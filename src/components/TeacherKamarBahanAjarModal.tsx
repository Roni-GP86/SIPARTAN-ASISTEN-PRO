import React from 'react';
import { motion } from 'motion/react';
import { X, BookOpen, Cloud, Sparkles } from 'lucide-react';
import { SchoolIdentity } from '../types';
import { KamarBahanAjarView } from './KamarBahanAjarView';

interface TeacherKamarBahanAjarModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  showToast: (msg: string) => void;
}

export const TeacherKamarBahanAjarModal: React.FC<TeacherKamarBahanAjarModalProps> = ({
  isOpen,
  onClose,
  identitas,
  showToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-6xl rounded-3xl bg-[#080F1F] border-2 border-emerald-500/40 shadow-2xl text-slate-100 flex flex-col max-h-[94vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#0E1B38] via-[#0A162D] to-[#0E1B38] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ruang Guru • Pusat Unggah &amp; Kelola Bahan Ajar
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5" />
                  Tersinkron Otomatis ke Ruang Murid
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Kelola Bahan Ajar &amp; Media Pembelajaran Siswa
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mode Guru (Akses Unggah &amp; Hapus)</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: KamarBahanAjarView with isTeacherMode=true */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <KamarBahanAjarView
            identitas={identitas}
            showToast={showToast}
            isTeacherMode={true}
          />
        </div>
      </motion.div>
    </div>
  );
};
