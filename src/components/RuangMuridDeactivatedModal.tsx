import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  X,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  School,
  GraduationCap,
} from 'lucide-react';
import {
  setRuangMuridEnabled,
  MASTER_ADMIN_ACCESS_CODE,
} from '../services/ruangMuridPolicyService';

interface RuangMuridDeactivatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminReactivated?: () => void;
}

export const RuangMuridDeactivatedModal: React.FC<RuangMuridDeactivatedModalProps> = ({
  isOpen,
  onClose,
  onAdminReactivated,
}) => {
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleReactivateByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    const clean = adminCodeInput.trim().toUpperCase();
    if (clean !== MASTER_ADMIN_ACCESS_CODE) {
      setErrorMsg('Kode otorisasi salah. Akses ditolak.');
      setIsProcessing(false);
      return;
    }

    const res = await setRuangMuridEnabled(true, clean);
    setIsProcessing(false);

    if (res.success) {
      setShowAdminUnlock(false);
      if (onAdminReactivated) onAdminReactivated();
      onClose();
    } else {
      setErrorMsg(res.message || 'Gagal mengaktifkan Ruang Murid.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0e1b38] via-[#091326] to-[#060c18] border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 text-slate-100 overflow-hidden ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Decorative Banner */}
          <div className="relative px-6 pt-7 pb-4 text-center border-b border-slate-800/80 bg-gradient-to-r from-amber-950/50 via-indigo-950/40 to-slate-950/60 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon Badge */}
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center mb-3">
              <div className="w-full h-full rounded-[22px] bg-[#0A1326] flex items-center justify-center text-3xl">
                🏫🔒✨
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Terbatas • SD Negeri Fatubai</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pemberitahuan Ruang Murid
            </h3>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* The Specific Requested Notification Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/70 shadow-lg text-center space-y-2">
              <div className="text-2xl mb-1">🙏📚🎒</div>
              <p className="text-base sm:text-lg font-black text-amber-200 leading-snug tracking-tight">
                "Mohon maaf, fitur ini tersedia khusus untuk murid Kelas 6 SDN Fatubai."
              </p>
              <p className="text-xs text-amber-300/80 font-medium">
                Pintu evaluasi belajar sedang ditutup oleh Administrator atau dibatasi khusus bagi siswa terdaftar resmi.
              </p>
            </div>

            {/* Informational Points with Emojis */}
            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">🎓</span>
                <p>
                  <strong className="text-white">Peserta Didik Resmi:</strong> Ruang evaluasi ini diperuntukkan secara eksklusif bagi 12 murid Kelas 6 SDN Fatubai yang telah menerima kode akses resmi secara lisan dari guru pengampu.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">🛡️</span>
                <p>
                  <strong className="text-white">Integritas CBT &amp; Asesmen:</strong> Penutupan sementara bertujuan memastikan jadwal pengerjaan ulangan harian, STS, dan SAS berjalan tertib dan terarah.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">👨‍🏫</span>
                <p>
                  <strong className="text-white">Bimbingan Guru:</strong> Jika jam ujian resmi telah tiba namun akses masih terkunci, silakan hubungi Guru Kelas VI SDN Fatubai.
                </p>
              </div>
            </div>

            {/* Admin Reactivation Panel (Collapsible) */}
            {showAdminUnlock ? (
              <form
                onSubmit={handleReactivateByAdmin}
                className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-400" />
                    Otorisasi Buka Akses (Guru / Admin)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminUnlock(false)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-1">
                  <input
                    type="password"
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    placeholder="Masukkan Kode Akses Admin..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/50 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                    autoFocus
                  />
                  {errorMsg && (
                    <p className="text-[11px] text-rose-400 font-medium">⚠️ {errorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !adminCodeInput}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Memverifikasi...' : 'Aktifkan Kembali Ruang Murid'}</span>
                </button>
              </form>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-600"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
                <span>Kembali ke Halaman Utama</span>
              </button>

              {!showAdminUnlock && (
                <button
                  type="button"
                  onClick={() => setShowAdminUnlock(true)}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  title="Masuk sebagai Administrator / Guru untuk mengaktifkan kembali"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Saya Guru / Admin</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
