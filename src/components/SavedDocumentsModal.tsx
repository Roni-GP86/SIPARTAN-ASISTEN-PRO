import React, { useState, useRef } from 'react';
import {
  ATPDocument,
  ModulAjarDocument,
  KKTPDocument,
  ProtaDocument,
  PromesDocument,
  KisiKisiSoalDocument,
  SavedItem,
  SchoolIdentity,
} from '../types';
import {
  Bookmark,
  Trash2,
  ArrowRight,
  FileText,
  BookOpen,
  Clock,
  CheckSquare,
  Calendar,
  Layers,
  FileQuestion,
  Cloud,
  ShieldCheck,
  Download,
  Upload,
  Database,
  HardDrive,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { downloadBackupFile, validateAndParseBackupJSON, BackupValidationResult } from '../utils/storageUtils';

interface SavedDocumentsModalProps {
  savedItems: SavedItem[];
  identitas?: SchoolIdentity;
  onLoadATP: (atp: ATPDocument) => void;
  onLoadModul: (modul: ModulAjarDocument) => void;
  onLoadKKTP: (kktp: KKTPDocument) => void;
  onLoadProta?: (prota: ProtaDocument) => void;
  onLoadPromes?: (promes: PromesDocument) => void;
  onLoadSoal?: (soal: KisiKisiSoalDocument) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onRestoreBackup?: (data: any) => void;
}

export const SavedDocumentsModal: React.FC<SavedDocumentsModalProps> = ({
  savedItems,
  identitas,
  onLoadATP,
  onLoadModul,
  onLoadKKTP,
  onLoadProta,
  onLoadPromes,
  onLoadSoal,
  onDeleteItem,
  onClearAll,
  onRestoreBackup,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ATP' | 'KKTP' | 'PROTA' | 'PROMES' | 'MODUL' | 'SOAL'>('ALL');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseBackupJSON(content);
      if (!res.isValid) {
        setRestoreError(res.message);
        setRestoreValidation(null);
      } else {
        setRestoreValidation(res);
        setRestoreError(null);
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membaca file dari komputer Anda.');
    };
    reader.readAsText(file);
    // Reset file input so user can choose the same file again if needed
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (restoreValidation?.data && onRestoreBackup) {
      onRestoreBackup(restoreValidation.data);
      setRestoreValidation(null);
    }
  };

  const filteredItems = savedItems.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Keutuhan & Cadangan Data Banner */}
      <div className="bg-gradient-to-r from-[#0B1528] via-[#102042] to-[#0E1A34] rounded-2xl p-4 sm:p-5 border-2 border-amber-500/40 shadow-lg text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Jaminan Keutuhan &amp; Cadangan Data
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Terproteksi Multi-Lapis
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Data pekerjaan Anda terlindungi secara otomatis: tersimpan permanen di memori lokal peramban (kebal tombol refresh &amp; laptop mati), tersinkronisasi ke Google Cloud Firestore, serta dapat dicadangkan sebagai file mandiri.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadBackupFile(identitas?.namaSatuanPendidikan || 'SIPARTAN')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Unduh seluruh data (semua mapel, TP, ATP, KKTP, Prota, Promes, Modul, Bank Soal &amp; Siswa) ke file .json"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Unduh Cadangan (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#14264c] hover:bg-[#1a3264] text-sky-200 border border-sky-400/40 hover:border-sky-300 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Pulihkan seluruh data perangkat ajar dari file cadangan .json"
            >
              <Upload className="w-4 h-4 text-sky-300" />
              <span>Pulihkan Cadangan</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Security / Integrity Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Penyimpanan Lokal:</strong> Isolasi mapel otomatis, kebal hilang saat komputer mati.
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Cloud Firestore:</strong> Sinkron otomatis &amp; terenkripsi via Kode Akses.
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-white">Keutuhan Dokumen:</strong> Anti-overwrite, data valid tidak akan tertimpa dokumen kosong.
            </span>
          </div>
        </div>

        {/* Restore Error Notice */}
        {restoreError && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}
      </div>

      {/* Header & Clear Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900">Arsip Perangkat Ajar &amp; Bank Soal</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>Tersinkron Cloud Firebase</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dokumen tersimpan otomatis dan persisten di browser &amp; Firebase. Dokumen hanya akan terhapus jika Anda menghapusnya secara eksplisit.
            </p>
          </div>
        </div>

        {savedItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearAllConfirm(true)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua Arsip
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semua Dokumen ({savedItems.length})
        </button>
        <button
          onClick={() => setFilterType('ATP')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'ATP'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          Alur TP (ATP)
        </button>
        <button
          onClick={() => setFilterType('KKTP')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'KKTP'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
          }`}
        >
          KKTP
        </button>
        <button
          onClick={() => setFilterType('PROTA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'PROTA'
              ? 'bg-indigo-700 text-white'
              : 'bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
          }`}
        >
          Program Tahunan (PROTA)
        </button>
        <button
          onClick={() => setFilterType('PROMES')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'PROMES'
              ? 'bg-violet-700 text-white'
              : 'bg-white text-violet-800 hover:bg-violet-50 border border-violet-200'
          }`}
        >
          Program Semester (PROMES)
        </button>
        <button
          onClick={() => setFilterType('MODUL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'MODUL'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          Modul Ajar
        </button>
        <button
          onClick={() => setFilterType('SOAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            filterType === 'SOAL'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-300'
          }`}
        >
          Kisi-Kisi &amp; Naskah Soal
        </button>
      </div>

      {/* Item List or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {savedItems.length === 0 ? 'Belum Ada Dokumen Tersimpan' : 'Tidak Ada Dokumen untuk Kategori Ini'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Setiap dokumen ATP, KKTP, Prota, Promes, Modul Ajar, serta Kisi-kisi &amp; Naskah Soal disimpan secara permanen di arsip lokal dan Firebase Cloud saat Anda menekan tombol <strong>"Simpan Permanen ke Arsip &amp; Firebase"</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      item.type === 'ATP'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.type === 'KKTP'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : item.type === 'PROTA'
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        : item.type === 'PROMES'
                        ? 'bg-violet-50 text-violet-800 border border-violet-200'
                        : item.type === 'SOAL'
                        ? 'bg-purple-50 text-purple-900 border border-purple-300'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.type === 'ATP' ? (
                      <FileText className="w-3 h-3" />
                    ) : item.type === 'KKTP' ? (
                      <CheckSquare className="w-3 h-3" />
                    ) : item.type === 'PROTA' ? (
                      <Calendar className="w-3 h-3" />
                    ) : item.type === 'PROMES' ? (
                      <Layers className="w-3 h-3" />
                    ) : item.type === 'SOAL' ? (
                      <FileQuestion className="w-3 h-3 text-purple-700" />
                    ) : (
                      <BookOpen className="w-3 h-3" />
                    )}
                    <span>
                      {item.type === 'ATP'
                        ? 'Alur Tujuan Pembelajaran (ATP)'
                        : item.type === 'KKTP'
                        ? 'KKTP (Rubrik & Interval)'
                        : item.type === 'PROTA'
                        ? 'Program Tahunan (PROTA)'
                        : item.type === 'PROMES'
                        ? 'Program Semester (PROMES)'
                        : item.type === 'SOAL'
                        ? 'Kisi-Kisi & Naskah Soal'
                        : 'Modul Ajar'}
                    </span>
                  </span>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.tanggal}</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{item.title}</h3>

                <p className="text-xs text-slate-600">
                  {item.mataPelajaran} • {item.fase} - Kelas {item.kelas}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmItem({ id: item.id, title: item.title });
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Hapus dari arsip lokal dan Firebase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (item.type === 'ATP' && item.atpData) {
                      onLoadATP(item.atpData);
                    } else if (item.type === 'KKTP' && item.kktpData) {
                      onLoadKKTP(item.kktpData);
                    } else if (item.type === 'PROTA' && item.protaData && onLoadProta) {
                      onLoadProta(item.protaData);
                    } else if (item.type === 'PROMES' && item.promesData && onLoadPromes) {
                      onLoadPromes(item.promesData);
                    } else if (item.type === 'MODUL' && item.modulData) {
                      onLoadModul(item.modulData);
                    } else if (item.type === 'SOAL' && item.soalData && onLoadSoal) {
                      onLoadSoal(item.soalData);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Buka Dokumen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dokumen Tunggal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-200 w-full max-w-md p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Konfirmasi Hapus Dokumen</h4>
                <p className="text-xs text-slate-500">Tindakan ini menghapus arsip secara permanen</p>
              </div>
            </div>
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-2 text-slate-800">
              <p className="font-medium">Apakah Anda yakin ingin menghapus dokumen berikut dari arsip perangkat ajar dan Firebase?</p>
              <div className="font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-rose-200">
                {deleteConfirmItem.title}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteItem(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Dokumen */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 w-full max-w-md p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Hapus Seluruh Arsip?</h4>
                <p className="text-xs text-slate-500">Semua riwayat dokumen akan dibersihkan</p>
              </div>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-slate-800">
              <p className="font-semibold text-rose-900">
                Peringatan: Seluruh dokumen ({savedItems.length} arsip) akan dihapus secara permanen dari perangkat lokal dan sinkronisasi Firebase.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowClearAllConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Bersihkan Semua Arsip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi & Validasi Pemulihan Cadangan */}
      {restoreValidation && (
        <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-sky-300 w-full max-w-lg p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-sky-600">
              <div className="p-3 bg-sky-100 rounded-xl">
                <Upload className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Pulihkan Data Cadangan</h4>
                <p className="text-xs text-slate-500">File cadangan terverifikasi sah</p>
              </div>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs space-y-2.5 text-slate-800">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Format cadangan SIPARTAN valid! Ringkasan konten:</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-700">
                <li>
                  <strong>Satuan Pendidikan:</strong> {restoreValidation.summary?.schoolName}
                </li>
                <li>
                  <strong>Guru / Pendidik:</strong> {restoreValidation.summary?.teacherName}
                </li>
                <li>
                  <strong>Jumlah Mata Pelajaran:</strong> {restoreValidation.summary?.subjectCount} workspace
                </li>
                <li>
                  <strong>Dokumen Arsip:</strong> {restoreValidation.summary?.savedItemCount} berkas
                </li>
                <li>
                  <strong>Daftar Siswa Kelas:</strong> {restoreValidation.summary?.studentCount} peserta didik
                </li>
              </ul>
              <p className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-300 font-medium">
                Catatan: Memulihkan cadangan akan memperbarui draf kerja aktif dan arsip dokumen sesuai isi file cadangan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreValidation(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terapkan &amp; Pulihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
