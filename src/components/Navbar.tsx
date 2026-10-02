import React from 'react';
import {
  BookOpen,
  Sparkles,
  FileText,
  Layers,
  Bookmark,
  HelpCircle,
  ChevronRight,
  School,
  User,
  Edit2,
  Settings,
  CheckSquare,
  ShieldCheck,
  KeyRound,
  Lock,
  FileSpreadsheet,
  Calendar,
  FolderSync,
  Cloud,
  RefreshCw,
  CheckCircle2,
  X,
  Menu,
} from 'lucide-react';
import { SchoolIdentity, AccessRecord } from '../types';
import { AppLogo } from './AppLogo';
import { formatImageUrl } from '../utils/imageUtils';
import { isMasterAccessCode } from '../services/accessCodeService';
import { getSubjectEmoticon } from '../utils/subjectWorkspaceService';
import { getStudentCount } from '../services/studentService';

interface NavbarProps {
  currentTab: 'input' | 'tp' | 'atp' | 'kktp' | 'prota' | 'promes' | 'modul' | 'prompt-media' | 'soal' | 'saved' | 'rapor';
  onSelectTab: (tab: 'input' | 'tp' | 'atp' | 'kktp' | 'prota' | 'promes' | 'modul' | 'prompt-media' | 'soal' | 'saved' | 'rapor') => void;
  hasTP: boolean;
  hasATP: boolean;
  hasKKTP: boolean;
  hasProta?: boolean;
  hasPromes?: boolean;
  hasModul: boolean;
  hasMediaPrompt?: boolean;
  hasSoal?: boolean;
  savedCount: number;
  onOpenHelp: () => void;
  identitas: SchoolIdentity;
  onOpenEditIdentity?: () => void;
  activeAccessRecord?: AccessRecord | null;
  onOpenAccessGate: () => void;
  onOpenAdminPanel: () => void;
  pendingCount?: number;
  onOpenCreateModul?: () => void;
  onOpenSubjectPicker?: () => void;
  cloudSyncStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  onManualSync?: () => void;
  isSyncingWithCloud?: boolean;
  portalMode?: 'guru' | 'murid';
  onSwitchPortalMode?: (mode: 'guru' | 'murid') => void;
  onOpenStudentManager?: () => void;
  onOpenExamMonitoring?: () => void;
  onOpenKamarBahanAjar?: () => void;
  onOpenDataIntegrity?: () => void;
  onCloseSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasTP,
  hasATP,
  hasKKTP,
  hasProta = false,
  hasPromes = false,
  hasModul,
  hasMediaPrompt = false,
  hasSoal = false,
  savedCount,
  onOpenHelp,
  onCloseSidebar,
  identitas,
  onOpenEditIdentity,
  activeAccessRecord,
  onOpenAccessGate,
  onOpenAdminPanel,
  pendingCount = 0,
  onOpenCreateModul,
  onOpenSubjectPicker,
  cloudSyncStatus = 'idle',
  onManualSync,
  isSyncingWithCloud = false,
  portalMode = 'guru',
  onSwitchPortalMode,
  onOpenStudentManager,
  onOpenExamMonitoring,
  onOpenKamarBahanAjar,
  onOpenDataIntegrity,
}) => {
  const isMasterAdmin = Boolean(
    activeAccessRecord && (isMasterAccessCode(activeAccessRecord.kodeAkses) || activeAccessRecord.isPremiumMaster)
  );
  const subjectEmoticon = getSubjectEmoticon(identitas.mataPelajaran);

  const activeSubjectName = identitas?.mataPelajaran || '';
  const isAgamaKatolik = activeSubjectName.toLowerCase().includes('agama') || activeSubjectName.toLowerCase().includes('katolik');
  const activeRegulasiBadge = isAgamaKatolik ? 'BKP No. 20/2026' : 'BSKAP No. 046/2025';

  return (
    <aside className="w-[280px] bg-[#0B1528] flex flex-col shrink-0 border-r-2 border-slate-800/80 shadow-xl select-none h-full z-20">
      {/* Brand Header with Royal Gold & Navy Accents */}
      <div className="p-3.5 border-b border-slate-800/90 bg-[#070e1c] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onSelectTab('input')}>
            <AppLogo size="sm" className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-extrabold tracking-tight text-xs leading-none">SIPARTAN</h1>
                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">SD/MI</span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {activeRegulasiBadge}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenHelp}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-md border border-slate-700/40 transition-colors cursor-pointer"
              title="Panduan & Struktur Kurikulum"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {onCloseSidebar && (
              <button
                type="button"
                onClick={onCloseSidebar}
                className="p-1.5 text-amber-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-md border border-amber-500/40 transition-colors cursor-pointer flex items-center justify-center"
                title="Tutup Menu Sidebar"
                aria-label="Tutup Menu Sidebar"
              >
                <X className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Active Subject Pill & Switcher */}
        <div className="p-2 rounded-xl bg-gradient-to-r from-[#0E1B38] to-[#13254d] border-2 border-amber-500/40 shadow-inner flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">{subjectEmoticon}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-white truncate leading-tight">
                {identitas.mataPelajaran}
              </div>
              <div className="text-[9.5px] text-amber-300 font-bold truncate">
                {identitas.fase} • Kelas {identitas.kelas}
              </div>
            </div>
          </div>
          {onOpenSubjectPicker && (
            <button
              type="button"
              onClick={onOpenSubjectPicker}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[9.5px] font-black shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              title="Ganti Mata Pelajaran atau Buka Arsip Dokumen Mapel Lain"
            >
              <span>Ganti</span>
              <ChevronRight className="w-3 h-3 text-amber-400" />
            </button>
          )}
        </div>

        {/* Access Code Indicator & Cloud Sync Status */}
        <div className="pt-0.5 space-y-1.5">
          {activeAccessRecord ? (
            <>
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#0A1325] to-[#0E1B38] border border-amber-500/30 shadow-inner flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-300">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-mono tracking-wider">{activeAccessRecord.kodeAkses}</span>
                    <span className="px-1 py-0.2 text-[8px] bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40 font-extrabold">
                      AKTIF
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-300 truncate mt-0.5">
                    Identitas Terkunci &amp; Terverifikasi
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAccessGate}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold shrink-0 transition-colors cursor-pointer"
                  title="Ganti atau Verifikasi Ulang Kode Akses"
                >
                  Ganti
                </button>
              </div>

              {/* Cloud Firestore Sync Status Bar */}
              <div className="px-2 py-1 rounded-lg bg-[#070e1c] border border-slate-800 flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  {cloudSyncStatus === 'saving' || isSyncingWithCloud ? (
                    <span className="flex items-center gap-1 text-sky-400 font-semibold animate-pulse truncate">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin shrink-0" />
                      Sinkron Cloud...
                    </span>
                  ) : cloudSyncStatus === 'saved' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium truncate">
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                      Tersimpan di Cloud
                    </span>
                  ) : cloudSyncStatus === 'offline' ? (
                    <span className="flex items-center gap-1 text-amber-400 truncate">
                      <Cloud className="w-2.5 h-2.5 shrink-0" />
                      Offline (Tersimpan Lokal)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 truncate">
                      <Cloud className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      Cloud Firestore Siap
                    </span>
                  )}
                </div>
                {onManualSync && (
                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncingWithCloud || cloudSyncStatus === 'saving'}
                    className="text-[9px] text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer disabled:opacity-50 shrink-0 ml-1"
                    title="Simpan paksa seluruh pekerjaan saat ini ke Firebase Cloud Firestore"
                  >
                    Simpan Cloud
                  </button>
                )}
              </div>

              {onOpenDataIntegrity && (
                <button
                  type="button"
                  onClick={onOpenDataIntegrity}
                  className="w-full px-2 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-between text-[9px] text-emerald-300 font-bold transition-all cursor-pointer shadow-xs group"
                  title="Pusat Keutuhan & Integritas Data Kurikulum"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Keutuhan Data: 100% Terlindungi</span>
                  </div>
                  <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 uppercase font-black">
                    Audit
                  </span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAccessGate}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Masuk ke SIPARTAN
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links (Spacious, Elegant Framed Layout) */}
      <nav className="flex-1 p-2.5 space-y-2 overflow-y-auto">
        {/* SWITCHER PORTAL: RUANG GURU VS RUANG MURID */}
        <div className="p-2 rounded-xl bg-[#070e1c] border-2 border-blue-500/30 space-y-1.5 shadow-xs">
          <span className="text-[9.5px] font-black text-sky-300 uppercase tracking-wider block px-1">
            PILIH RUANG APLIKASI:
          </span>
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onSwitchPortalMode && onSwitchPortalMode('guru')}
              className={`py-1.5 px-2 rounded-md font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                portalMode === 'guru'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🏫</span>
              <span>Ruang Guru</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchPortalMode && onSwitchPortalMode('murid')}
              className={`py-1.5 px-2 rounded-md font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                portalMode === 'murid'
                  ? 'bg-gradient-to-r from-sky-500 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🎓</span>
              <span>Ruang Murid</span>
            </button>
          </div>
        </div>

        {/* JIKA DI DALAM RUANG MURID, TAMPILKAN STATUS BADGE */}
        {portalMode === 'murid' && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-950 to-blue-950 border border-sky-600/40 text-xs space-y-1.5 text-sky-100">
            <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px]">
              <span>🎓</span>
              <span>Portal Khusus Peserta Didik</span>
            </div>
            <p className="text-[10.5px] text-sky-200 leading-relaxed">
              Membuka bahan bacaan, ujian CBT siswa, dan laporan nilai.
            </p>
            <button
              type="button"
              onClick={() => onSwitchPortalMode && onSwitchPortalMode('guru')}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <span>Kembali ke Ruang Guru</span>
            </button>
          </div>
        )}

{portalMode === 'guru' && (<div className="space-y-2">
        <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">
          <span className="text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1">
            <span>📚</span>
            <span>Menu Ruang Guru</span>
          </span>
          <span className="text-[9.5px] text-amber-300 font-bold bg-[#0E1B38] px-2 py-0.5 rounded-full border border-amber-500/40 shadow-xs">
            SIPARTAN
          </span>
        </div>

        {/* Tab 1: Input CP (Orange & Gold) */}
        <button
          id="nav-input-cp"
          onClick={() => onSelectTab('input')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'input'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-amber-400/40'
              : 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📑</span>
            <span className="truncate font-bold text-xs">1. Input Capaian (CP)</span>
          </div>
          <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-extrabold uppercase shrink-0 shadow-xs ${
            currentTab === 'input'
              ? 'bg-slate-950/20 text-slate-950 border border-slate-950/30'
              : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
          }`}>
            Tahap 1
          </span>
        </button>

        {/* Tab 2: Bedah CP ke TP (Kuning Emas) */}
        <button
          id="nav-tp-analysis"
          onClick={() => onSelectTab('tp')}
          disabled={!hasTP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'tp'
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black border-yellow-200 shadow-md ring-2 ring-yellow-400/40'
              : hasTP
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-yellow-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasTP ? 'Analisis CP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">🎯</span>
            <span className="truncate font-bold text-xs">2. Bedah CP ke TP</span>
          </div>
          {hasTP && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'tp' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'tp' ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
              Aktif
            </span>
          )}
        </button>

        {/* Tab 3: ATP Document (Hijau Emerald) */}
        <button
          id="nav-atp-doc"
          onClick={() => onSelectTab('atp')}
          disabled={!hasATP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'atp'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black border-emerald-300 shadow-md ring-2 ring-emerald-400/40'
              : hasATP
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-emerald-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasATP ? 'Susun ATP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📊</span>
            <span className="truncate font-bold text-xs">3. Analisis TP ke ATP</span>
          </div>
          {hasATP && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'atp' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'atp' ? 'bg-white' : 'bg-emerald-400'}`}></span>
              A-H Siap
            </span>
          )}
        </button>

        {/* Tab 4: KKTP Document (Biru Royal) */}
        <button
          id="nav-kktp-doc"
          onClick={() => onSelectTab('kktp')}
          disabled={!hasKKTP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'kktp'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black border-blue-300 shadow-md ring-2 ring-blue-400/40'
              : hasKKTP
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-blue-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasKKTP ? 'Susun KKTP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📐</span>
            <span className="truncate font-bold text-xs">4. Dokumen KKTP</span>
          </div>
          {hasKKTP && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'kktp' ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'kktp' ? 'bg-white' : 'bg-blue-400'}`}></span>
              Siap
            </span>
          )}
        </button>

        {/* Tab 5: Program Tahunan (PROTA) */}
        <button
          id="nav-prota-doc"
          onClick={() => onSelectTab('prota')}
          disabled={!hasProta}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'prota'
              ? 'bg-gradient-to-r from-indigo-700 to-violet-800 text-white font-black border-indigo-300 shadow-md ring-2 ring-indigo-400/40'
              : hasProta
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-indigo-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasProta ? 'Susun TP & ATP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📅</span>
            <span className="truncate font-bold text-xs">5. Prog. Tahunan (PROTA)</span>
          </div>
          {hasProta && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'prota' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'prota' ? 'bg-white' : 'bg-indigo-400'}`}></span>
              Siap
            </span>
          )}
        </button>

        {/* Tab 6: Program Semester (PROMES) */}
        <button
          id="nav-promes-doc"
          onClick={() => onSelectTab('promes')}
          disabled={!hasPromes}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'promes'
              ? 'bg-gradient-to-r from-violet-700 to-purple-800 text-white font-black border-violet-300 shadow-md ring-2 ring-violet-400/40'
              : hasPromes
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-violet-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasPromes ? 'Susun TP & ATP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">🗓️</span>
            <span className="truncate font-bold text-xs">6. Prog. Semester (PROMES)</span>
          </div>
          {hasPromes && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'promes' ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'promes' ? 'bg-white' : 'bg-violet-400'}`}></span>
              Siap
            </span>
          )}
        </button>

        {/* Tab 7: Modul Ajar (Orange & Kuning) */}
        <button
          id="nav-modul-ajar"
          onClick={() => {
            if (hasModul) {
              onSelectTab('modul');
            } else if (onOpenCreateModul) {
              onOpenCreateModul();
            } else {
              onSelectTab('modul');
            }
          }}
          disabled={!hasModul && !hasTP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'modul'
              ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white font-black border-orange-300 shadow-md ring-2 ring-orange-400/40'
              : hasModul
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-orange-400/50'
              : hasTP
              ? 'text-amber-200 bg-[#0E1B38]/90 hover:bg-amber-950/40 hover:text-amber-100 border-amber-600/50 hover:border-amber-400'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasModul && !hasTP ? 'Selesaikan TP & ATP terlebih dahulu' : !hasModul ? 'Klik untuk Mengonfigurasi & Menyusun Modul Ajar' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📖</span>
            <span className="truncate font-bold text-xs">7. Modul Ajar (RPP)</span>
          </div>
          {hasModul ? (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'modul' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'modul' ? 'bg-white' : 'bg-emerald-400'}`}></span>
              Lengkap
            </span>
          ) : hasTP ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Buat
            </span>
          ) : null}
        </button>

        {/* Tab 8: Prompt Media (Komik & Infografis 3D Pixar/Disney) */}
        <button
          id="nav-prompt-media"
          onClick={() => onSelectTab('prompt-media')}
          disabled={!hasTP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'prompt-media'
              ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black border-pink-300 shadow-md ring-2 ring-pink-400/40'
              : hasTP
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-pink-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasTP ? 'Analisis TP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">🎨</span>
            <span className="truncate font-bold text-xs">8. Prompt Media 3D</span>
          </div>
          {hasTP && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'prompt-media' ? 'bg-white/20 text-white' : 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'prompt-media' ? 'bg-white' : 'bg-pink-400'}`}></span>
              3D AI
            </span>
          )}
        </button>

        {/* Tab 9: Kisi-Kisi & Naskah Soal Ujian (Ungu Royal & Emas) */}
        <button
          id="nav-bank-soal"
          onClick={() => onSelectTab('soal')}
          disabled={!hasTP}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'soal'
              ? 'bg-gradient-to-r from-purple-700 via-indigo-800 to-blue-800 text-white font-black border-purple-300 shadow-md ring-2 ring-purple-400/40'
              : hasTP
              ? 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-purple-400/50'
              : 'text-slate-600 bg-[#0E1B38]/20 cursor-not-allowed opacity-40 border-transparent'
          }`}
          title={!hasTP ? 'Analisis TP terlebih dahulu' : ''}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📝</span>
            <span className="truncate font-bold text-xs">9. Kisi-Kisi &amp; Soal</span>
          </div>
          {hasSoal ? (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
              currentTab === 'soal' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTab === 'soal' ? 'bg-white' : 'bg-emerald-400'}`}></span>
              Siap
            </span>
          ) : hasTP ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Rancang
            </span>
          ) : null}
        </button>

        {/* Tab 10: Daftar Murid Kelas (Data Siswa SD Negeri Fatubai) */}
        <button
          id="nav-daftar-murid"
          onClick={() => {
            if (onOpenStudentManager) {
              onOpenStudentManager();
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-sky-400/50"
          title="Lihat & Kelola Daftar Murid Kelas (Data Siswa SD Negeri Fatubai)"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">👥</span>
            <span className="truncate font-bold text-xs">10. Daftar Murid Kelas</span>
          </div>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            {getStudentCount()} Siswa
          </span>
        </button>

        {/* Tab 11: Pantauan CBT & Laporan PDF Akademis (Multi-Device Guru) */}
        <button
          id="nav-pantauan-cbt"
          onClick={() => {
            if (onOpenExamMonitoring) {
              onOpenExamMonitoring();
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer text-slate-200 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 hover:from-emerald-900/70 hover:to-teal-900/60 hover:text-white border-emerald-700/60 hover:border-emerald-400 shadow-xs"
          title="Pantau Hasil CBT Peserta Didik di Perangkat Mereka & Unduh Laporan Nilai PDF Rapi Akademis"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📊</span>
            <span className="truncate font-bold text-xs">11. Pantauan CBT & PDF</span>
          </div>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time
          </span>
        </button>

        {/* Tab 12: Analisis Nilai Rapor & Deskripsi Kemajuan Belajar (Format Kurikulum Merdeka) */}
        <button
          id="nav-analisis-rapor"
          onClick={() => onSelectTab('rapor')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'rapor'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-amber-400/40'
              : 'text-slate-200 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-[#0E1B38] hover:from-amber-900/50 hover:to-[#122347] hover:text-white border-amber-700/50 hover:border-amber-400 shadow-xs'
          }`}
          title="Olah Nilai CBT Murid Menjadi Deskripsi Kemajuan Belajar Sesuai Format Rapor Kurikulum Merdeka"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📈</span>
            <span className="truncate font-bold text-xs">12. Analisis Nilai Rapor</span>
          </div>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs ${
            currentTab === 'rapor'
              ? 'bg-slate-950/25 text-slate-950 border border-slate-950/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Format KM
          </span>
        </button>

        {/* Tab 13: Kamar Bahan Ajar Murid (Unggah Materi & Offline Ready) */}
        <button
          id="nav-kamar-bahan-ajar"
          onClick={() => {
            if (onOpenKamarBahanAjar) {
              onOpenKamarBahanAjar();
            } else if (onSwitchPortalMode) {
              onSwitchPortalMode('murid');
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all border-2 cursor-pointer text-slate-200 bg-gradient-to-r from-blue-950/60 to-indigo-950/40 hover:from-blue-900/70 hover:to-indigo-900/60 hover:text-white border-blue-600/50 hover:border-blue-400 shadow-xs"
          title="Buka Kamar Bahan Ajar untuk Mengunggah Modul PDF, Gambar, PPT, Video & Audio yang Dapat Diakses Murid Secara Offline"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
            <span className="text-base shrink-0">📚</span>
            <span className="truncate font-bold text-xs">13. Kamar Bahan Ajar (Guru)</span>
          </div>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold shrink-0 shadow-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Unggah/Kelola
          </span>
        </button>

        {/* Library & Guide Section */}
        <div className="text-amber-400 font-extrabold text-[11px] uppercase tracking-wider px-2.5 pt-4 pb-1 flex items-center gap-1">
          <span>📁</span>
          <span>Arsip &amp; Pengaturan</span>
        </div>

        {/* Riwayat Tab (Biru Navy & Kuning Emas) */}
        <button
          id="nav-saved-docs"
          onClick={() => onSelectTab('saved')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all border-2 cursor-pointer ${
            currentTab === 'saved'
              ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-amber-300 font-black border-amber-400 shadow-md ring-2 ring-amber-400/40'
              : 'text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base shrink-0">📁</span>
            <span className="truncate font-bold">Riwayat Arsip Dokumen</span>
          </div>
          {savedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs border border-amber-300">
              {savedCount}
            </span>
          )}
        </button>

        {/* Panel Keamanan Google Forms (HANYA MUNCUL PADA KODE MASTER ADMIN) */}
        {isMasterAdmin && (
          <button
            id="nav-admin-panel"
            onClick={onOpenAdminPanel}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-amber-300 bg-gradient-to-r from-[#0E1B38] to-slate-900 hover:from-[#142852] hover:to-slate-850 border-2 border-amber-500/50 hover:border-amber-400 transition-all cursor-pointer shadow-xs relative"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base shrink-0">🏛️</span>
              <div className="text-left min-w-0">
                <span className="truncate block font-bold text-amber-300">Keamanan &amp; Kode Akses</span>
                <span className="text-[10px] text-amber-400/80 block font-mono">Panel Super Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {pendingCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse shadow-xs flex items-center gap-0.5"
                  title={`${pendingCount} guru baru mendaftar & menunggu verifikasi`}
                >
                  <span>🔔</span>
                  <span>{pendingCount}</span>
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </button>
        )}

        {/* Panduan Modal trigger */}
        <button
          id="nav-guide-trigger"
          onClick={onOpenHelp}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-slate-200 bg-[#0E1B38]/60 hover:bg-[#122347] hover:text-white border-2 border-slate-800 hover:border-emerald-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base shrink-0">💡</span>
            <span className="truncate font-bold">Panduan &amp; Struktur Kurikulum</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
</div>)}
      </nav>

      {/* Footer Profile Info - Framed in Navy & Gold */}
      <div className="p-3 border-t-2 border-slate-800/90 bg-[#070e1c] shrink-0">
        <div className="flex items-center justify-between gap-2.5 bg-[#0E1B38] p-2.5 rounded-xl border-2 border-amber-500/40 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={formatImageUrl(identitas.fotoGuruUrl || '/teacher_roni.jpg')}
              alt={identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}
              className="w-10 h-10 rounded-lg object-cover object-top shrink-0 shadow-sm ring-2 ring-amber-400/80 border border-amber-300/40"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="text-xs text-white font-black truncate leading-tight flex items-center gap-1">
                {activeAccessRecord && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                <span className="truncate">{identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}</span>
              </div>
              <div className="text-[10px] text-amber-300 truncate leading-tight mt-1 font-medium">
                {identitas.peranGuru || 'Guru Kelas'} • {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
              </div>
            </div>
          </div>
          {onOpenEditIdentity && (
            <button
              id="btn-nav-view-profile"
              type="button"
              onClick={onOpenEditIdentity}
              className="p-2 rounded-lg border-2 text-amber-300 bg-amber-600/10 border-amber-500/40 hover:bg-amber-600/20 transition-all shrink-0 cursor-pointer"
              title="Lihat Profil Identitas Resmi (Terkunci Permanen Sesuai Kode Akses)"
            >
              <Lock className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};


