import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  HardDrive,
  Cloud,
  Clock,
  History,
  Check,
  X,
  FileText,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  auditDataIntegrity,
  DataIntegrityReport,
  IntegrityCheckItem,
} from '../utils/dataIntegrityService';
import {
  downloadBackupFile,
  createAutoSnapshot,
  getAutoSnapshots,
  AutoSnapshotItem,
  hasEmergencyBackup,
  getEmergencyBackupData,
} from '../utils/storageUtils';
import { SchoolIdentity, TPItem, SelectedElementItem, BedahElemenRow, ATPDocument, KKTPDocument, ProtaDocument, PromesDocument, ModulAjarDocument, KisiKisiSoalDocument, SavedItem, StudentInfo } from '../types';

interface DataIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  tpList: TPItem[];
  elemenRows: BedahElemenRow[];
  selectedElements: SelectedElementItem[];
  atpDocument: ATPDocument | null;
  kktpDocument: KKTPDocument | null;
  protaDocument: ProtaDocument | null;
  promesDocument: PromesDocument | null;
  modulAjarDocument: ModulAjarDocument | null;
  soalDocument?: KisiKisiSoalDocument | null;
  savedItems: SavedItem[];
  students: StudentInfo[];
  cloudStatus?: string;
  onRestoreFromBackup: (backupData: any) => void;
  onManualCloudSync?: () => void;
}

export const DataIntegrityModal: React.FC<DataIntegrityModalProps> = ({
  isOpen,
  onClose,
  identitas,
  tpList,
  elemenRows,
  selectedElements,
  atpDocument,
  kktpDocument,
  protaDocument,
  promesDocument,
  modulAjarDocument,
  soalDocument,
  savedItems,
  students,
  cloudStatus,
  onRestoreFromBackup,
  onManualCloudSync,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'snapshots' | 'actions'>('audit');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [snapshotList, setSnapshotList] = useState<AutoSnapshotItem[]>(() => getAutoSnapshots());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const report = auditDataIntegrity({
    identitas,
    tpList,
    elemenRows,
    selectedElements,
    atpDocument,
    kktpDocument,
    protaDocument,
    promesDocument,
    modulAjarDocument,
    soalDocument,
    savedItems,
    students,
    cloudStatus,
  });

  const handleCreateSnapshot = () => {
    createAutoSnapshot('Manual User Snapshot');
    setSnapshotList(getAutoSnapshots());
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleDownload = () => {
    downloadBackupFile(identitas.namaSatuanPendidikan || 'SD_Negeri_Fatubai');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && (parsed.identitas || parsed.tpList || parsed.workspaces)) {
          onRestoreFromBackup(parsed);
          onClose();
        } else {
          alert('Format file cadangan tidak sesuai.');
        }
      } catch (err) {
        alert('Gagal membaca file cadangan.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreSnapshot = (snap: AutoSnapshotItem) => {
    if (window.confirm(`Pulihkan data dari snapshot tanggal ${new Date(snap.timestamp).toLocaleString('id-ID')}?`)) {
      onRestoreFromBackup(snap.data);
      onClose();
    }
  };

  const handleRestoreEmergency = () => {
    const emergency = getEmergencyBackupData();
    if (!emergency) {
      alert('Tidak ada cadangan darurat pra-reset yang tersimpan.');
      return;
    }
    if (window.confirm('Pulihkan data dari cadangan darurat yang dibuat sebelum reset terakhir?')) {
      onRestoreFromBackup(emergency);
      onClose();
    }
  };

  const emergencyAvailable = hasEmergencyBackup();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B1528] to-[#122347] text-white flex items-center justify-between border-b-2 border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Pusat Keutuhan &amp; Cadangan Data</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {report.score}% Terlindungi
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                Pemeriksaan kepatuhan BSKAP 046/2025, Permendikdasmen 13/2025, &amp; Cloud Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Keutuhan ({report.passedChecks}/{report.totalChecks})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'snapshots'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Snapshot ({snapshotList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh &amp; Pulihkan Cadangan</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-900">
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {/* Score Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black text-base shadow-sm shrink-0">
                    <span>{report.score}%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      Indeks Integritas &amp; Keutuhan Data
                    </h4>
                    <p className="text-[11.5px] text-emerald-900 leading-snug mt-0.5">
                      {report.summary}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{copiedSuccess ? 'Snapshot Disimpan!' : 'Snapshot Baru'}</span>
                </button>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {report.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                      item.status === 'passed'
                        ? 'bg-white border-slate-200'
                        : item.status === 'warning'
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-rose-50/60 border-rose-300'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : item.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            item.status === 'passed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : item.status === 'warning'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {item.status === 'passed' ? 'Valid' : item.status === 'warning' ? 'Perhatian' : 'Perlu Dibenahi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed mt-0.5">{item.message}</p>
                      {item.details && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Snapshot Cadangan Otomatis</h4>
                  <p className="text-[11px] text-slate-500">
                    SIPARTAN secara berkala menyimpan salinan dokumen Anda agar dapat dipulihkan sewaktu-waktu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ambil Snapshot</span>
                </button>
              </div>

              {snapshotList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  Belum ada snapshot cadangan otomatis tersimpan. Klik "Ambil Snapshot" untuk mencadangkan.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshotList.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{snap.label}</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {snap.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(snap.timestamp).toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>{snap.teacherName} ({snap.schoolName})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-400/50 text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                        title="Pulihkan seluruh draf dokumen dari snapshot ini"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>Pulihkan</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {emergencyAvailable && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center justify-between gap-3 mt-3">
                  <div>
                    <span className="text-xs font-bold text-rose-900">Cadangan Darurat Sebelum Reset</span>
                    <p className="text-[10.5px] text-rose-700 mt-0.5">
                      Draf kerja sebelum tombol reset terakhir ditekan tersimpan aman dan siap dipulihkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreEmergency}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan Darurat</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pencadangan &amp; Pemulihan Manual</h4>
                <p className="text-[11px] text-slate-500">
                  Unduh berkas JSON untuk diarsipkan di flashdisk/Google Drive atau dipindahkan ke komputer lain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Unduh File Cadangan (.json)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mengekspor seluruh TP, ATP, KKTP, Prota, Promes, Modul Ajar, Soal, Ruang Kerja Mapel, &amp; Data Siswa ke file JSON tunggal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Cadangan (.json)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>Pulihkan dari File (.json)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Unggah berkas cadangan SIPARTAN yang pernah diunduh sebelumnya untuk memulihkan seluruh dokumen secara instan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Berkas JSON</span>
                  </button>
                </div>
              </div>

              {onManualCloudSync && (
                <div className="p-3.5 rounded-xl border border-sky-300 bg-sky-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-5 h-5 text-sky-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-sky-950">Sinkronkan ke Cloud Firestore</span>
                      <p className="text-[11px] text-sky-800">
                        Kirim data terbaru ke database awan agar dapat dibuka dari perangkat lain.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onManualCloudSync();
                      setCopiedSuccess(true);
                      setTimeout(() => setCopiedSuccess(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Sinkron Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Penyimpanan Permanen Browser + Cloud Firestore Terenkripsi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
