import React from 'react';
import {
  ShieldAlert,
  FileText,
  X,
  Lock,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { isMasterAccessCode, getActiveSessionCode } from '../services/accessCodeService';

interface WordDownloadBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDFInstead?: () => void;
  onOpenAdminPanel?: () => void;
  documentTitle?: string;
}

export const WordDownloadBlockedModal: React.FC<WordDownloadBlockedModalProps> = ({
  isOpen,
  onClose,
  onDownloadPDFInstead,
  onOpenAdminPanel,
  documentTitle = 'Dokumen Perangkat Ajar',
}) => {
  if (!isOpen) return null;

  const currentCode = getActiveSessionCode();
  const isAdmin = isMasterAccessCode(currentCode);

  const handleChoosePDF = () => {
    onClose();
    if (onDownloadPDFInstead) {
      onDownloadPDFInstead();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-amber-500 shadow-amber-950/30 flex flex-col my-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-blocked-title"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between shrink-0 border-b border-amber-700/50">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-amber-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/40 text-amber-200 border border-amber-300/40">
                  Proteksi Keamanan Dokumen
                </span>
              </div>
              <h2 id="word-blocked-title" className="text-base sm:text-lg font-black tracking-tight leading-tight text-white mt-1">
                Pemberitahuan Unduhan Word
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup Pemberitahuan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-amber-50/50 via-white to-white overflow-y-auto flex-1">
          {/* Main Requested Notice Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-400/80 shadow-md text-center space-y-2.5">
            <div className="text-3xl mb-1">🔒📑⚠️</div>
            <h3 className="text-sm sm:text-base font-black text-amber-950 leading-snug tracking-tight">
              "Mohon maaf, untuk keamanan dokumen terhadap hal pencurian data dan pengeditan identitas, fitur ini ditutup oleh Admin!"
            </h3>
            <p className="text-xs text-amber-900/90 font-medium">
              Opsi ekspor Microsoft Word (.doc) dinonaktifkan sementara demi menjaga integritas data dan hak cipta penyusun.
            </p>
          </div>

          {/* Security & Integrity Points */}
          <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-900">Perlindungan Identitas Pendidik &amp; Sekolah:</strong> Mencegah pengubahan identitas resmi (Nama Guru, NIP, Satuan Pendidikan, Kepala Sekolah) dan plagiasi format perangkat di luar aplikasi SIPARTAN.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-900">Keabsahan Regulasi Kurikulum:</strong> Memastikan rumusan CP, TP, ATP, KKTP, dan Modul Ajar tetap murni sesuai standar <strong>Keputusan Kepala BSKAP No. 046 Tahun 2025</strong> dan <strong>Permendikdasmen No. 13 Tahun 2025</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-900">Format PDF Resmi Tersedia:</strong> Anda tetap dapat mengunduh dokumen <strong>{documentTitle}</strong> dalam format <strong>PDF Resmi Siap Cetak</strong> lengkap dengan lembar pengesahan.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {onDownloadPDFInstead && (
              <button
                type="button"
                onClick={handleChoosePDF}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:brightness-110 text-white font-black text-xs tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Format PDF Resmi Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all shadow-2xs cursor-pointer text-center"
              >
                Kembali
              </button>

              {isAdmin && onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="py-2.5 px-4 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Buka Panel Administrator untuk mengelola status unduhan Word"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
