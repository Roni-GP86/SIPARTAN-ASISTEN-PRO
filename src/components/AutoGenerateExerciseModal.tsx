import React, { useState } from 'react';
import {
  SchoolIdentity,
  TPItem,
  ExamPackage,
} from '../types';
import {
  autoGenerateAndPublishChapterExercise,
  autoSyncExercisesForCurriculumTP,
  RECOMMENDED_CHAPTER_TEMPLATES,
  SubjectChapterTemplate,
} from '../services/chapterExerciseAutoService';
import { sounds } from '../utils/audioEffects';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Clock,
  Layers,
  Zap,
  Check,
  X,
  Plus,
} from 'lucide-react';

interface AutoGenerateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  tpList: TPItem[];
  onPackageCreated: (pkg: ExamPackage) => void;
  onBatchCreated: (count: number) => void;
  showToast: (msg: string) => void;
}

export const AutoGenerateExerciseModal: React.FC<AutoGenerateExerciseModalProps> = ({
  isOpen,
  onClose,
  identitas,
  tpList,
  onPackageCreated,
  onBatchCreated,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'tp-kurikulum' | 'katalog-bab' | 'kustom'>(
    tpList && tpList.length > 0 ? 'tp-kurikulum' : 'katalog-bab'
  );

  // Selection state for TP Kurikulum
  const [selectedTPCode, setSelectedTPCode] = useState<string>(
    tpList && tpList.length > 0 ? tpList[0].kodeTP : ''
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  // Selection state for Katalog Bab
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('Semua');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SubjectChapterTemplate | null>(
    RECOMMENDED_CHAPTER_TEMPLATES[0] || null
  );

  // Custom Form state
  const [customMapel, setCustomMapel] = useState<string>(identitas.mataPelajaran || 'Matematika');
  const [customBabJudul, setCustomBabJudul] = useState<string>('');
  const [customMateri, setCustomMateri] = useState<string>('');
  const [customRumusanTP, setCustomRumusanTP] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter catalog by subject
  const filteredCatalog = RECOMMENDED_CHAPTER_TEMPLATES.filter((item) =>
    selectedSubjectFilter === 'Semua' ? true : item.mataPelajaran.toLowerCase().includes(selectedSubjectFilter.toLowerCase())
  );

  // Handle generation from active TP
  const handleGenerateFromTP = async () => {
    const targetTP = tpList.find((t) => t.kodeTP === selectedTPCode);
    if (!targetTP) {
      showToast('Pilih salah satu Tujuan Pembelajaran (TP) terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    sounds.playClick();

    try {
      const materi = targetTP.lingkupMateri || 'Materi Pokok';
      const babJudul = `Bab: ${materi}`;

      const pkg = await autoGenerateAndPublishChapterExercise({
        identitas,
        mataPelajaran: identitas.mataPelajaran || 'Mata Pelajaran',
        babJudul,
        lingkupMateri: materi,
        rumusanTP: targetTP.rumusanTP,
        kodeTP: targetTP.kodeTP,
        elemen: targetTP.elemen,
        durasiMenit: durationMinutes,
      });

      sounds.playVictoryFanfare();
      onPackageCreated(pkg);
      showToast(`🎉 Paket Latihan Bab "${materi}" berhasil disusun otomatis dan masuk ke Ruang Murid!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyusun soal latihan bab secara otomatis.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle batch generation for all TPs
  const handleBatchGenerateAllTP = async () => {
    if (!tpList || tpList.length === 0) {
      showToast('Belum ada data TP yang dapat disinkronkan.');
      return;
    }

    setIsGenerating(true);
    sounds.playClick();

    try {
      const result = await autoSyncExercisesForCurriculumTP(tpList, identitas);
      sounds.playVictoryFanfare();
      onBatchCreated(result.totalCreated);
      showToast(`⚡ Berhasil menyusun & menerbitkan ${result.totalCreated} paket latihan bab baru ke Ruang Murid!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal melakukan sinkronisasi latihan bab.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generation from recommended catalog
  const handleGenerateFromCatalog = async () => {
    if (!selectedCatalogItem) {
      showToast('Pilih salah satu materi bab dari katalog terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    sounds.playClick();

    try {
      const pkg = await autoGenerateAndPublishChapterExercise({
        identitas,
        mataPelajaran: selectedCatalogItem.mataPelajaran,
        babJudul: selectedCatalogItem.babJudul,
        lingkupMateri: selectedCatalogItem.lingkupMateri,
        rumusanTP: selectedCatalogItem.rumusanTP,
        kodeTP: selectedCatalogItem.kodeTP,
        elemen: selectedCatalogItem.elemen,
        durasiMenit: durationMinutes,
      });

      sounds.playVictoryFanfare();
      onPackageCreated(pkg);
      showToast(`🎉 Paket Latihan "${selectedCatalogItem.babJudul}" berhasil dimasukkan ke Ruang Murid!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyusun soal latihan dari katalog.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generation from custom form
  const handleGenerateCustom = async () => {
    if (!customBabJudul.trim() || !customMateri.trim() || !customRumusanTP.trim()) {
      showToast('Mohon lengkapi judul bab, lingkup materi, dan rumusan TP.');
      return;
    }

    setIsGenerating(true);
    sounds.playClick();

    try {
      const kodeTP = `TP-KUS-${Date.now().toString().slice(-4)}`;
      const pkg = await autoGenerateAndPublishChapterExercise({
        identitas,
        mataPelajaran: customMapel,
        babJudul: customBabJudul,
        lingkupMateri: customMateri,
        rumusanTP: customRumusanTP,
        kodeTP,
        elemen: 'Elemen Pembelajaran',
        durasiMenit: durationMinutes,
      });

      sounds.playVictoryFanfare();
      onPackageCreated(pkg);
      showToast(`🎉 Paket Latihan Bab "${customBabJudul}" berhasil dimasukkan ke Ruang Murid!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyusun soal latihan kustom.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-[#0B1528] border-2 border-amber-400/90 rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 text-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Penyusun Otomatis Soal Latihan Bab &amp; Harian</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Susun Soal Latihan Bab Berdasarkan TP &amp; Materi
              </h3>
              <p className="text-xs text-slate-300">
                Otomatis menghasilkan paket latihan ramah anak (10–15 butir soal: Pilihan Ganda, Benar/Salah, Menjodohkan, Isian, Uraian) selaras TP &amp; materi langsung ke Ruang Murid.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Source Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-[#070E1E] p-1.5 rounded-2xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tp-kurikulum')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'tp-kurikulum'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Dari TP Kurikulum ({tpList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('katalog-bab')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'katalog-bab'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Katalog Bab SD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kustom')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'kustom'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Bab Baru</span>
            </button>
          </div>

          {/* TAB 1: DARI TP KURIKULUM */}
          {activeTab === 'tp-kurikulum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Pilih Tujuan Pembelajaran (TP) yang ingin dibuatkan paket latihan:
                </span>
                {tpList.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchGenerateAllTP}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400 text-cyan-300 text-[11px] font-black cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-300" />
                    <span>⚡ Susun Semua TP Sekaligus</span>
                  </button>
                )}
              </div>

              {tpList.length === 0 ? (
                <div className="bg-[#070E1E] p-6 rounded-2xl border border-slate-800 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-400">
                    Belum ada data Tujuan Pembelajaran (TP) di lembar kerja guru saat ini.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bapak/Ibu dapat memilih tab &quot;Katalog Bab SD&quot; atau merumuskan TP di menu Analisis CP &amp; TP.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('katalog-bab')}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black cursor-pointer shadow-md"
                  >
                    Buka Katalog Bab Rekomendasi →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tpList.map((tp) => {
                    const isSelected = selectedTPCode === tp.kodeTP;
                    return (
                      <div
                        key={tp.id || tp.kodeTP}
                        onClick={() => setSelectedTPCode(tp.kodeTP)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-[#070E1E] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 border-amber-400 text-slate-950 font-black'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                              {tp.kodeTP}
                            </span>
                            <span className="text-xs font-black text-white">
                              {tp.lingkupMateri || 'Materi Pokok'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">{tp.rumusanTP}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KATALOG BAB SD REKOMENDASI */}
          {activeTab === 'katalog-bab' && (
            <div className="space-y-4">
              {/* Subject Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['Semua', 'Matematika', 'IPAS', 'Indonesia', 'Pancasila'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSubjectFilter === f
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Catalog Items */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredCatalog.map((item) => {
                  const isSelected = selectedCatalogItem?.kodeTP === item.kodeTP;
                  return (
                    <div
                      key={item.kodeTP}
                      onClick={() => setSelectedCatalogItem(item)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-[#070E1E] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-slate-950 font-black'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            {item.mataPelajaran}
                          </span>
                          <span className="text-xs font-black text-white">{item.babJudul}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{item.rumusanTP}</p>
                        <p className="text-[11px] text-amber-300/80">{item.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FORM INPUT BAB KUSTOM */}
          {activeTab === 'kustom' && (
            <div className="space-y-3 bg-[#070E1E] p-4 rounded-2xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={customMapel}
                    onChange={(e) => setCustomMapel(e.target.value)}
                    placeholder="Contoh: IPAS / Matematika"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Judul Bab</label>
                  <input
                    type="text"
                    value={customBabJudul}
                    onChange={(e) => setCustomBabJudul(e.target.value)}
                    placeholder="Contoh: Bab 2: Ekosistem & Rantai Makanan"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Lingkup Materi Pokok</label>
                <input
                  type="text"
                  value={customMateri}
                  onChange={(e) => setCustomMateri(e.target.value)}
                  placeholder="Contoh: Rantai Makanan dan Peran Makhluk Hidup"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Rumusan Tujuan Pembelajaran (TP)</label>
                <textarea
                  rows={2}
                  value={customRumusanTP}
                  onChange={(e) => setCustomRumusanTP(e.target.value)}
                  placeholder="Contoh: Peserta didik dapat menganalisis peran produsen, konsumen, dan dekomposer dalam jaring-jaring makanan...."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Konfigurasi Durasi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070E1E] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">Durasi Pengerjaan Ujian / Latihan:</span>
            </div>
            <div className="flex items-center gap-2">
              {[60, 90, 120].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMinutes(d)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    durationMinutes === d
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {d} Menit {d === 120 ? '⭐ (Standar)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isGenerating}
              onClick={() => {
                if (activeTab === 'tp-kurikulum') handleGenerateFromTP();
                else if (activeTab === 'katalog-bab') handleGenerateFromCatalog();
                else handleGenerateCustom();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Menyusun Soal &amp; Menerbitkan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>🚀 Susun &amp; Masukkan ke Ruang Murid Sekarang</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
