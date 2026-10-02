import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SchoolIdentity, AccessRecord } from '../types';
import {
  validateTeacherAccessCode,
  getActiveSessionCode,
  MASTER_ACCESS_CODE,
} from '../services/accessCodeService';
import { sounds } from '../utils/audioEffects';

interface TeacherAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record?: AccessRecord) => void;
  featureName?: string;
  featureDescription?: string;
  identitas?: SchoolIdentity;
  activeAccessRecord?: AccessRecord | null;
}

export const TeacherAccessModal: React.FC<TeacherAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  featureName = 'Laporan & Kelola Paket Ujian',
  featureDescription,
  identitas,
  activeAccessRecord,
}) => {
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccessCodeInput('');
      setErrorMessage(null);
      setIsSuccess(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTeacherName =
    identitas?.namaGuru || activeAccessRecord?.namaGuru || 'Guru Kelas / Pengampu';
  const currentSchoolName =
    identitas?.namaSatuanPendidikan || activeAccessRecord?.namaSekolah || 'Satuan Pendidikan';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = validateTeacherAccessCode(accessCodeInput, activeAccessRecord);

    if (result.isValid) {
      setIsSuccess(true);
      sounds.playSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        setAccessCodeInput('');
        onSuccess(result.record);
      }, 600);
    } else {
      sounds.playDoubt();
      setErrorMessage(
        result.message ||
          'Kode akses tidak sesuai dengan kode akses profil guru Anda. Silakan periksa kembali profil guru.'
      );
      inputRef.current?.focus();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1b30] via-[#091322] to-[#050b14] border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20 text-slate-100 overflow-hidden ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 text-center border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-amber-950/40 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Tutup & Tetap di Ruang Murid"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center mb-3">
              <div className="w-full h-full rounded-[14px] bg-[#091322] flex items-center justify-center text-2xl">
                🔐
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10.5px] font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Khusus Guru Di Ruang Murid</span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Buka {featureName}
            </h3>

            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
              {featureDescription ||
                'Fitur ini hanya dapat diakses oleh Bapak/Ibu Guru. Masukkan Kode Akses Profil Guru Anda untuk membuka.'}
            </p>

            {/* Info Guru & Sekolah */}
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold truncate">{currentTeacherName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 truncate">{currentSchoolName}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-amber-300 uppercase tracking-wider text-center">
                Kode Akses Profil Guru
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={accessCodeInput}
                  onChange={(e) => {
                    setAccessCodeInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan Kode Akses Guru (GP-••••)"
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border-2 border-amber-500/40 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 text-white placeholder-slate-500 text-center font-mono text-base tracking-widest font-black transition-all outline-hidden uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Kode disesuaikan dengan kode akses pada profil guru Anda.
              </p>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}

            {/* Success Feedback */}
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 text-center font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kode Terverifikasi! Membuka akses guru...</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Kembali ke Ruang Murid
              </button>

              <button
                type="submit"
                disabled={!accessCodeInput.trim() || isSuccess}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Buka Akses Guru</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
