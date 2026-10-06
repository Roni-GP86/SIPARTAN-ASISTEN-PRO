import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ExternalLink,
  Bot,
  Image as ImageIcon,
  FileText,
  Lightbulb,
  CheckCircle2,
  Printer,
  Palette,
} from 'lucide-react';

interface LKPDVisualPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pertemuanKe?: number;
  promptText: string;
  topikMateri: string;
  mataPelajaran: string;
}

export const LKPDVisualPromptModal: React.FC<LKPDVisualPromptModalProps> = ({
  isOpen,
  onClose,
  title,
  pertemuanKe,
  promptText,
  topikMateri,
  mataPelajaran,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-300/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Generator Prompt Desain Visual LKPD AI</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-300 shrink-0" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-indigo-200">
              {mataPelajaran} • Topik: <span className="text-white font-semibold">{topikMateri}</span>
              {pertemuanKe ? ` • Pertemuan Ke-${pertemuanKe}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">
          {/* Petunjuk Penggunaan */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cara Menghasilkan LKPD Desain Grafis Siap Cetak dari Gemini / Gems:</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-amber-900 space-y-1 pl-1">
              <li>
                Klik tombol <strong className="text-amber-950">"Salin Prompt AI"</strong> di bawah ini.
              </li>
              <li>
                Buka <strong className="text-amber-950">Google Gemini</strong>, <strong className="text-amber-950">Gemini Gems</strong>, atau <strong className="text-amber-950">Canva AI Magic Design</strong>.
              </li>
              <li>
                Tempel (<em className="not-italic font-mono bg-white/80 px-1 rounded border border-amber-300">Ctrl + V</em>) prompt lalu tekan Enter untuk menghasilkan tata letak LKPD visual indah bertema {topikMateri}!
              </li>
            </ol>
          </div>

          {/* Prompt Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="w-4 h-4 text-indigo-700" />
                <span>Naskah Prompt Visual LKPD (Siap Disalin):</span>
              </span>
              <button
                onClick={handleCopyPrompt}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Prompt Berhasil Disalin!' : 'Salin Prompt AI'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto border border-slate-800 shadow-inner select-all">
                {promptText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-blue-200" />
            <span>Buka Google Gemini</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-900 hover:bg-indigo-950 text-white'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Prompt'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
