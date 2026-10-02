import React, { useState, useRef } from 'react';
import { ShieldCheck, HardDrive, Download, Upload, RotateCcw, Check, Sparkles, AlertTriangle, Activity } from 'lucide-react';
import { downloadBackupFile, clearWorkingDrafts, createEmergencyBackupBeforeReset, hasEmergencyBackup, getEmergencyBackupData } from '../utils/storageUtils';

interface AutoSaveIndicatorProps {
  lastSavedTime?: string | null;
  schoolName?: string;
  onResetToDefault: () => void;
  onRestoreFromBackup: (backupData: any) => void;
  onOpenDataIntegrity?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSavedTime,
  schoolName = 'SD Negeri Fatubai',
  onResetToDefault,
  onRestoreFromBackup,
  onOpenDataIntegrity,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emergencyExists = hasEmergencyBackup();

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Baru saja';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Baru saja';
    }
  };

  const handleDownload = () => {
    downloadBackupFile(schoolName);
    setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && (parsed.identitas || parsed.tpList || parsed.elemenRows)) {
          onRestoreFromBackup(parsed);
          setIsOpen(false);
        } else {
          alert('File backup tidak memiliki format perangkat ajar yang sesuai.');
        }
      } catch (err) {
        alert('Gagal membaca file backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="relative inline-block text-left">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-2xs transition-all cursor-pointer"
        title="Klik untuk opsi cadangan atau reset data. Semua data tersimpan permanen di browser ini."
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Tersimpan Permanen</span>
        <span className="text-[10px] text-emerald-700 font-medium hidden md:inline">
          ({formatTime(lastSavedTime)})
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:pr-8 bg-slate-950/20" onClick={() => { setIsOpen(false); setConfirmReset(false); }}>
          <div
            className="w-80 bg-white rounded-xl shadow-2xl border-2 border-slate-300 p-3.5 text-slate-900 space-y-3 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#0B1528]">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>Penyimpanan Permanen Aktif</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Kebal Refresh
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Setiap ketikan, perubahan elemen, rumusan TP, ATP, dan modul ajar Anda langsung disimpan otomatis secara permanen di browser ini. Tidak akan hilang meskipun laptop mati atau tab di-refresh.
            </p>

            <div className="space-y-1.5 pt-1">
              {onOpenDataIntegrity && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDataIntegrity();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pusat Keutuhan &amp; Cadangan Data</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 font-black text-emerald-900">
                    Audit
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh File Cadangan (.json)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pulihkan dari File (.json)</span>
                </div>
              </button>

              {emergencyExists && (
                <button
                  type="button"
                  onClick={() => {
                    const emergency = getEmergencyBackupData();
                    if (emergency) {
                      onRestoreFromBackup(emergency);
                      setIsOpen(false);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pulihkan Cadangan Pra-Reset</span>
                  </div>
                </button>
              )}

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kembalikan ke Format Awal</span>
                  </div>
                </button>
              ) : (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg space-y-2">
                  <div className="flex items-start gap-1.5 text-[11px] font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Yakin ingin mereset draf kerja ke contoh awal Matematika Fase C? Cadangan darurat otomatis akan disimpan sebelum reset.</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-1 rounded text-[10px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        createEmergencyBackupBeforeReset();
                        onResetToDefault();
                        setConfirmReset(false);
                        setIsOpen(false);
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
                    >
                      Ya, Cadangkan &amp; Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-right pt-1 border-t border-slate-100">
              Pembaruan terakhir: {formatTime(lastSavedTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
