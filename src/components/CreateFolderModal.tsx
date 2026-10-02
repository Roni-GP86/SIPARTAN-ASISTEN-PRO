import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KAMAR_MAPEL_LIST, createSubjectFolder } from '../services/learningMaterialService';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (folderName: string) => void;
  defaultSubject?: string;
  subjects?: readonly string[];
}

const COLOR_CHOICES = [
  { label: 'Biru', value: 'blue', border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-blue-400' },
  { label: 'Hijau Zamrud', value: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-600', text: 'text-emerald-400' },
  { label: 'Kuning Amber', value: 'amber', border: 'border-amber-500', bg: 'bg-amber-600', text: 'text-amber-400' },
  { label: 'Ungu', value: 'purple', border: 'border-purple-500', bg: 'bg-purple-600', text: 'text-purple-400' },
  { label: 'Merah Rose', value: 'rose', border: 'border-rose-500', bg: 'bg-rose-600', text: 'text-rose-400' },
  { label: 'Langit Biru', value: 'sky', border: 'border-sky-500', bg: 'bg-sky-600', text: 'text-sky-400' },
  { label: 'Oranye', value: 'orange', border: 'border-orange-500', bg: 'bg-orange-600', text: 'text-orange-400' },
  { label: 'Teal', value: 'teal', border: 'border-teal-500', bg: 'bg-teal-600', text: 'text-teal-400' },
];

const ICON_CHOICES = ['📁', '📚', '🔬', '🔢', '📖', '🏛️', '🎨', '🏃', '🇬🇧', '🕌', '🏝️', '📝', '💡', '🚀', '⭐'];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultSubject,
  subjects = KAMAR_MAPEL_LIST.filter((m) => m !== 'Semua Mata Pelajaran'),
}) => {
  const validSubjects = subjects.filter((s) => (s as string) !== 'Semua Mata Pelajaran');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    defaultSubject && (defaultSubject as string) !== 'Semua Mata Pelajaran'
      ? defaultSubject
      : validSubjects[0] || 'IPAS (Ilmu Pengetahuan Alam & Sosial)'
  );
  const [folderName, setFolderName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('blue');
  const [selectedIcon, setSelectedIcon] = useState<string>('📁');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setErrorMsg('Nama folder tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createSubjectFolder({
        name: folderName.trim(),
        subject: selectedSubject,
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
        createdBy: 'Guru Kelas / Mata Pelajaran',
      });

      onSuccess(folderName.trim());
      onClose();
    } catch (err: any) {
      console.error('Gagal membuat folder:', err);
      setErrorMsg('Gagal membuat folder: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0B1528] border-2 border-blue-500/50 rounded-3xl shadow-2xl p-6 text-white space-y-5 my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl shrink-0">
                {selectedIcon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <span>Buat Folder Mata Pelajaran Baru</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  Folder khusus per mata pelajaran untuk mengorganisasi modul, LKPD, PPT, & video.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilihan Mata Pelajaran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                1. Pilih Mata Pelajaran Induk <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              >
                {validSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900 text-white">
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Folder */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                2. Nama Folder <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Contoh: Bab 1 - Pancasila & Nilai Luhur, LKPD Praktikum Sains"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                3. Deskripsi Singkat Folder (Opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Penjelasan ringkas isi modul / dokumen di dalam folder ini..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Ikon Folder */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                4. Pilih Simbol / Ikon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 max-h-24 overflow-y-auto">
                {ICON_CHOICES.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setSelectedIcon(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                      selectedIcon === ic
                        ? 'bg-blue-600 scale-110 shadow-md ring-2 ring-blue-400'
                        : 'bg-slate-800 hover:bg-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Warna Folder */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                5. Pilih Warna Aksen
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setSelectedColor(col.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      selectedColor === col.value
                        ? `${col.border} ${col.bg} text-white shadow-md ring-1 ring-white/50`
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${col.bg}`} />
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Folder...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Simpan & Buat Folder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
