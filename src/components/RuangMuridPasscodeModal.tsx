import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  verifyRuangMuridStudentPasscode,
  setStudentAuthenticatedForRuangMurid,
} from '../services/ruangMuridPolicyService';
import { sounds } from '../utils/audioEffects';

interface RuangMuridPasscodeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const RuangMuridPasscodeModal: React.FC<RuangMuridPasscodeModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  onClose,
}) => {
  const handleDismiss = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isValid = verifyRuangMuridStudentPasscode(passcode);
    if (isValid) {
      setIsSuccess(true);
      sounds.playSuccess();
      setStudentAuthenticatedForRuangMurid(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPasscode('');
        onSuccess();
      }, 700);
    } else {
      sounds.playDoubt();
      setErrorMsg('Kode akses salah. Silakan tanyakan kode akses resmi secara lisan kepada Bapak/Ibu Guru.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#091f1a] via-[#081714] to-[#040e0c] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 text-slate-100 overflow-hidden ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 pt-7 pb-4 text-center border-b border-emerald-950/80 bg-gradient-to-r from-emerald-950/60 via-teal-950/50 to-slate-950/60 shrink-0">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-500 p-0.5 shadow-xl shadow-emerald-500/30 flex items-center justify-center mb-3">
              <div className="w-full h-full rounded-[14px] bg-[#071914] flex items-center justify-center text-2xl">
                🔑✨
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10.5px] font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pintu Gerbang Ruang Murid</span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Masukkan Kode Akses Siswa
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Masukkan kode akses yang telah disampaikan secara lisan oleh Bapak/Ibu Guru.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-emerald-300 uppercase tracking-wider text-center">
                Kode Akses Peserta Didik
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  placeholder="Ketik kode akses dari Guru..."
                  className="w-full text-center tracking-widest font-mono text-xl sm:text-2xl font-black px-12 py-3.5 rounded-2xl bg-slate-900/90 border-2 border-emerald-500/60 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all uppercase"
                  autoFocus
                  maxLength={16}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan Kode' : 'Tampilkan Kode'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-xs text-rose-400 font-bold justify-center pt-1"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </div>

            {/* Confidentiality Notice Box (Does NOT reveal any passcode) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-black">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Kerahasiaan Kode Akses Murid</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-300">
                Kode akses hanya disampaikan secara lisan oleh Bapak/Ibu Guru di kelas. Demi menjaga integritas lembar nilai dan mencegah penyalahgunaan identitas siswa, jangan membagikan kode ini kepada siapapun.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all border border-slate-700"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={!passcode.trim() || isSuccess}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Terverifikasi!</span>
                  </>
                ) : (
                  <>
                    <span>Buka Ruang Murid</span>
                    <ArrowRight className="w-4 h-4" />
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
