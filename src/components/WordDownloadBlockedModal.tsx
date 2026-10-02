import React from 'react';
import {
  ShieldAlert,
  FileText,
  X,
  Lock,
  ArrowRight,
  SlidersHorizontal,
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
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-amber-500 shadow-amber-950/20 flex flex-col my-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-blocked-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-950/40 text-amber-200 border border-amber-300/30">
                  Proteksi Keamanan
                </span>
              </div>
              <h2 id="word-blocked-title" className="text-sm sm:text-base font-black tracking-tight leading-tight text-white mt-0.5">
                Unduhan Word Dinonaktifkan!
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup Notifikasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-amber-50/40 via-white to-white overflow-y-auto flex-1">
          {/* Main Notice Box */}
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-950 leading-snug">
                  Unduhan word di nonaktifkan oleh admin!
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-900 font-semibold mt-1">
                  (Hal ini mencegah pengeditan data via Word!)
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed pt-1.5 border-t border-amber-200/80">
              Untuk menjaga integritas dan keabsahan kurikulum sesuai standar resmi{' '}
              <strong>Keputusan Kepala BSKAP No. 046 Tahun 2025</strong> dan{' '}
              <strong>Permendikdasmen No. 13 Tahun 2025</strong>, opsi unduhan Microsoft Word (.doc)
              telah dikunci oleh Administrator agar rumusan tidak diubah secara bebas di luar aplikasi.
            </p>
          </div>

          {/* Alternative Suggestion */}
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-slate-700 flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-slate-900">Gunakan Format PDF Resmi:</span> Anda tetap
              dapat mengunduh dokumen {documentTitle} dalam format <strong>PDF Resmi</strong> yang
              lengkap dengan lembar pengesahan tanda tangan dan siap cetak.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {onDownloadPDFInstead && (
              <button
                type="button"
                onClick={handleChoosePDF}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:brightness-110 text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Format PDF Resmi Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all shadow-2xs cursor-pointer text-center"
              >
                Tutup
              </button>

              {isAdmin && onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="py-2 px-3 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Buka Panel Administrator untuk mengaktifkan kembali unduhan Word"
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
