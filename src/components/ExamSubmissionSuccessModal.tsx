import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Award,
  BookOpen,
  ArrowRight,
  Home,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ExamSubmission, ExamPackage } from '../types';
import { sounds } from '../utils/audioEffects';

interface ExamSubmissionSuccessModalProps {
  isOpen: boolean;
  submission: ExamSubmission | any | null;
  pkg: ExamPackage | null;
  onViewReview: () => void;
  onBackToHome: () => void;
}

export const ExamSubmissionSuccessModal: React.FC<ExamSubmissionSuccessModalProps> = ({
  isOpen,
  submission,
  pkg,
  onViewReview,
  onBackToHome,
}) => {
  if (!isOpen || !submission) return null;

  const score = Math.round(
    typeof submission.nilaiAkhir === 'number'
      ? submission.nilaiAkhir
      : typeof submission.skorAkhir === 'number'
      ? submission.skorAkhir
      : 0
  );
  const isPassed = score >= 70;

  let predikat = submission.predikat || submission.keteranganKKTP || 'Perlu Bimbingan';
  if (!submission.predikat && !submission.keteranganKKTP) {
    if (score >= 90) predikat = 'Sangat Memuaskan (A)';
    else if (score >= 80) predikat = 'Baik Sekali (B)';
    else if (score >= 70) predikat = 'Cukup (C)';
  }

  const rawAnswers = submission.jawabanList || submission.jawabanDetail || submission.jawabanMurid || [];
  const totalQuestions =
    pkg?.soalDocument?.ringkasanDistribusi?.totalSoal ||
    (rawAnswers.length > 0 ? rawAnswers.length : 10);
  const correctCount =
    rawAnswers.length > 0
      ? rawAnswers.filter((a: any) => a.isCorrect).length
      : Math.round((score / 100) * totalQuestions);
  const wrongCount = Math.max(0, totalQuestions - correctCount);

  const namaSiswa = submission.namaSiswa || submission.siswaNama || 'Peserta Didik';
  const nisn = submission.nisn || submission.siswaNisn || '-';
  const judul = submission.judulPaket || submission.judulUjian || pkg?.judul || 'Ujian Digital CBT';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.28 }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#091F1A] via-[#061512] to-[#040E0C] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/25 text-slate-100 overflow-hidden ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Confetti & Trophy Visual Banner */}
          <div className="relative px-6 pt-8 pb-5 text-center bg-gradient-to-b from-emerald-950/60 to-transparent border-b border-emerald-900/40 shrink-0">
            {/* Animated Trophy / Checkmark Badge */}
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-500 p-0.5 shadow-xl shadow-emerald-500/40 flex items-center justify-center mb-3.5 animate-bounce">
              <div className="w-full h-full rounded-[22px] bg-[#071914] flex items-center justify-center text-4xl">
                🏆✨
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sukses Terkirim ke Sistem Guru</span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              Selamat, Pekerjaanmu Selesai!
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              Jawabanmu telah tersimpan aman dan langsung masuk ke Buku Laporan Nilai Guru SD Negeri Fatubai.
            </p>
          </div>

          {/* Results Summary Box */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Score Big Pill */}
            <div className="p-5 rounded-2xl bg-[#0B2520] border border-emerald-500/40 shadow-inner flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Nilai Asesmen Akhir
              </span>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-200 to-emerald-300 tracking-tight">
                {score}
                <span className="text-2xl font-bold text-slate-400"> / 100</span>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isPassed ? '✓ TUNTAS KKTP' : 'REMEDIAL / PERLU BIMBINGAN'}
                </span>
                <span className="text-xs text-slate-300 font-bold">• {predikat}</span>
              </div>
            </div>

            {/* Student & Package Detail */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Nama Peserta Didik:</span>
                <span className="text-white font-extrabold">{namaSiswa}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">NISN / Identitas:</span>
                <span className="font-mono text-emerald-300 font-bold">{nisn}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Paket Soal CBT:</span>
                <span className="text-white font-bold max-w-[200px] truncate text-right">
                  {judul}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Hasil Jawaban:</span>
                <span className="text-white font-bold">
                  <span className="text-emerald-400 font-extrabold">{correctCount} Benar</span> •{' '}
                  <span className="text-rose-400 font-extrabold">{wrongCount} Salah</span> dari {totalQuestions} Soal
                </span>
              </div>
            </div>

            {/* Cloud Storage Confirmation Badge */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[11.5px] leading-relaxed">
                <strong>Data Tersimpan Otomatis:</strong> Nilai ini sudah dapat dilihat dan diunduh oleh Bapak Guru (Yohanes Pantola) dalam laporan resmi sekolah.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onBackToHome();
                }}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  onViewReview();
                }}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30"
              >
                <BookOpen className="w-4 h-4" />
                <span>Lihat Kunci &amp; Pembahasan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
