import React from 'react';
import {
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  CheckSquare,
  FileSpreadsheet,
  Calendar,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { getSubjectEmoticon } from '../utils/subjectWorkspaceService';
import { SubjectFolder } from '../data/officialCPDatabase';

export interface SubjectAnalysisWarningModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  targetFolder?: SubjectFolder | null;
  targetSubject?: string;
  targetFase?: string;
  currentMataPelajaran?: string;
  currentSubject?: string;
  currentFase?: string;
  onProceedToAnalyze?: () => void;
  onConfirmStartAnalysis?: () => void;
}

export const SubjectAnalysisWarningModal: React.FC<SubjectAnalysisWarningModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  targetFolder,
  targetSubject,
  targetFase,
  currentMataPelajaran,
  currentSubject,
  currentFase = 'Fase C',
  onProceedToAnalyze,
  onConfirmStartAnalysis,
}) => {
  if (!isOpen) return null;

  const resolvedTargetSubject = targetSubject || targetFolder?.mataPelajaran || 'Mata Pelajaran Baru';
  const resolvedTargetFase = targetFase || targetFolder?.fase || 'Fase';
  const resolvedCurrentSubject = currentSubject || currentMataPelajaran || 'Mata Pelajaran Saat Ini';
  const handleClose = onCancel || onClose || (() => {});
  const handleProceed = onConfirmStartAnalysis || onProceedToAnalyze || (() => {});

  const targetEmoticon = getSubjectEmoticon(resolvedTargetSubject);
  const currentEmoticon = getSubjectEmoticon(resolvedCurrentSubject);

  const isAgamaKatolik = (resolvedTargetSubject || '').toLowerCase().includes('agama') || (resolvedTargetSubject || '').toLowerCase().includes('katolik');
  const regCpLabel = isAgamaKatolik ? 'Regulasi Standar Capaian Pembelajaran BKP No. 20/2026' : 'Keputusan Kepala BSKAP No. 046 Tahun 2025';
  const regCpShort = isAgamaKatolik ? 'BKP No. 20/2026' : 'BSKAP No. 046/2025';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-[#0B1528] border-2 border-amber-500/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 ring-4 ring-amber-500/20 my-auto max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header with Glowing Warning Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-[#181105] to-[#0B1528] border-b-2 border-amber-500/40 relative shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/60 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.35)]">
              <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚠️ Peringatan Alur Kurikulum
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {regCpShort}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                Dokumen Kurikulum Belum Dianalisis!
              </h3>
              <p className="text-xs text-amber-200/90 mt-0.5 font-medium">
                Mata Pelajaran <span className="font-bold text-amber-300">{targetEmoticon} {resolvedTargetSubject}</span> ({resolvedTargetFase})
              </p>
            </div>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Explanation Alert Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-100 space-y-2 leading-relaxed">
            <p className="font-semibold text-white">
              Sesuai prinsip <strong>Kurikulum Merdeka ({regCpLabel})</strong>:
            </p>
            <p className="text-slate-300">
              <strong>Modul Ajar (RPP)</strong> tidak dapat dirancang secara valid tanpa adanya rumusan <strong>Tujuan Pembelajaran (TP)</strong>, susunan <strong>Alur Tujuan Pembelajaran (ATP 8 Bagian A-H)</strong>, dan <strong>Kriteria Ketercapaian (KKTP)</strong> yang diturunkan dari Capaian Pembelajaran (CP).
            </p>
          </div>

          {/* Checklist of Missing Elements for Target Subject */}
          <div className="bg-[#070e1c] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Status Dokumen {resolvedTargetSubject}:</span>
              <span className="text-rose-400 font-bold">4 Tahap Belum Selesai</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>1. Analisis CP ke TP (Kompetensi &amp; Materi)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  Belum Ada
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>2. Dokumen Alur Tujuan Pembelajaran (ATP 8 Bagian)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  Belum Ada
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>3. Kriteria Ketercapaian TP (KKTP &amp; Interval)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  Belum Ada
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>4. Program Tahunan &amp; Semester (PROTA &amp; PROMES)</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  Belum Ada
                </span>
              </div>
            </div>
          </div>

          {/* Safety reassurance about current subject */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              Dokumen mata pelajaran <strong className="text-emerald-300">{currentEmoticon} {resolvedCurrentSubject}</strong> yang telah Anda susun <strong>tetap tersimpan aman</strong> di arsip dan tidak akan hilang.
            </div>
          </div>
        </div>

        {/* Footer Actions - Always accessible */}
        <div className="p-4 bg-[#070e1c] border-t border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Batal &amp; Tetap di {resolvedCurrentSubject}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mulai Analisis CP {resolvedTargetSubject} Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
