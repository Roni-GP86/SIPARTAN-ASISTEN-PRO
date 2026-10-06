import React, { useState, useEffect, useMemo } from 'react';
import { ExportConfirmModal } from './ExportConfirmModal';
import { ModulAjarDocument, SchoolIdentity, PDFLayoutOptions } from '../types';
import { exportModulAjarToWord, exportModulAjarToPDF, getResolvedMeetings } from '../utils/exportUtils';
import { normalizeRPMData, cleanMeetingAlokasi, cleanMeetingFokus, parseTotalJPAndCount, calculateMeetingTimeAllocation, cleanActivityText } from '../utils/rpmUtils';
import { buildStandardLKPDList } from '../utils/modelSyntaxEngine';
import { getClassesForFase } from '../utils/classFilterUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { RPMDocumentSection } from './RPMDocumentSection';
import { RPMCanvasView } from './RPMCanvasView';
import { executePrintWithLayout, loadSavedPDFLayout } from '../utils/printLayoutUtils';
import { Download, Printer, Check, BookOpen, ShieldCheck, FileSpreadsheet, ArrowLeft, HelpCircle, FileText, Edit2, Lock, Sparkles, Award, Layers, Users, Laptop, CheckCircle2, LayoutTemplate, Plus, X } from 'lucide-react';
import { LKPDVisualPromptModal } from './LKPDVisualPromptModal';
import { generateLKPDVisualPrompt, generateFullModuleLKPDVisualPrompt } from '../utils/lkpdPromptGenerator';
import { getLKPDMeetingStyle } from '../utils/lkpdStyleUtils';

interface ModulAjarViewProps {
  modul: ModulAjarDocument;
  onBackToATP: () => void;
  onSaveToHistory: () => void;
  isSaved: boolean;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onUpdateModul?: (updated: ModulAjarDocument) => void;
  onReconfigureRPM?: () => void;
  onGoToCPInput?: () => void;
}

export const ModulAjarView: React.FC<ModulAjarViewProps> = ({
  modul,
  onBackToATP,
  onSaveToHistory,
  isSaved,
  onOpenEditIdentity,
  onUpdateIdentitas,
  onUpdateModul,
  onReconfigureRPM,
  onGoToCPInput,
}) => {
  const isRPM = Boolean(modul.identifikasiRPM || modul.desainPembelajaranRPM || modul.langkahPembelajaranRPM);

  // Editable fields for RPM
  const [judulModul, setJudulModul] = useState(modul?.judulModul || 'RENCANA PEMBELAJARAN MENDALAM');
  const [topikMateri, setTopikMateri] = useState(modul?.topikMateri || (modul?.kegiatanPembelajaran?.[0]?.fokusTP || ''));
  const initialAlokasi = (() => {
    const raw = modul?.alokasiWaktuPertemuan || modul?.identitas?.alokasiWaktuModul || '2 x 35 Menit (1 kali pertemuan)';
    const parsed = parseTotalJPAndCount(modul || {} as any, raw);
    return parsed.formattedIdentityAlokasi || raw;
  })();
  const [alokasiWaktu, setAlokasiWaktu] = useState(initialAlokasi);
  const [tahunPelajaran, setTahunPelajaran] = useState(modul?.identitas?.tahunPelajaran || '2026/2027');
  const [semester, setSemester] = useState(modul?.identitas?.semester || '1');
  const [selectedFormat, setSelectedFormat] = useState<'rpm' | 'standar'>('rpm');
  const [rpmDisplayMode, setRpmDisplayMode] = useState<'canvas' | 'dokumen'>('canvas');

  // State untuk Pemanfaatan Teknologi Digital & Media yang bisa diedit / ditambah manual
  const initialTech = useMemo(() => {
    const norm = normalizeRPMData(modul || {} as any);
    return norm.dsData.pemanfaatanTeknologi;
  }, [modul]);

  const [pemanfaatanTeknologi, setPemanfaatanTeknologi] = useState<{
    platformAplikasi: string[];
    perangkatDigital: string[];
    mediaDigital: string[];
  }>(initialTech);

  const [isEditingStandarTech, setIsEditingStandarTech] = useState(false);
  const [newStandarPlatform, setNewStandarPlatform] = useState('');
  const [newStandarPerangkat, setNewStandarPerangkat] = useState('');
  const [newStandarMedia, setNewStandarMedia] = useState('');

  // Modal State Generator Prompt Visual LKPD AI
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptModalTitle, setPromptModalTitle] = useState('');
  const [promptModalText, setPromptModalText] = useState('');
  const [promptModalPertemuan, setPromptModalPertemuan] = useState<number | undefined>();

  useEffect(() => {
    if (!modul) return;
    setJudulModul(modul.judulModul || 'RENCANA PEMBELAJARAN MENDALAM');
    setTopikMateri(modul.topikMateri || (modul.kegiatanPembelajaran?.[0]?.fokusTP || ''));
    const raw = modul.alokasiWaktuPertemuan || modul.identitas?.alokasiWaktuModul || '2 x 35 Menit (1 kali pertemuan)';
    const parsed = parseTotalJPAndCount(modul, raw);
    setAlokasiWaktu(parsed.formattedIdentityAlokasi || raw);
    setTahunPelajaran(modul.identitas?.tahunPelajaran || '2026/2027');
    setSemester(modul.identitas?.semester || '1');
    const norm = normalizeRPMData(modul);
    setPemanfaatanTeknologi(norm.dsData.pemanfaatanTeknologi);
  }, [modul]);

  const effectiveModul: ModulAjarDocument = useMemo(() => {
    return {
      ...modul,
      desainPembelajaranRPM: {
        ...(modul.desainPembelajaranRPM as any),
        pemanfaatanTeknologi: {
          platformAplikasi: pemanfaatanTeknologi.platformAplikasi,
          perangkatDigital: pemanfaatanTeknologi.perangkatDigital,
          mediaDigital: pemanfaatanTeknologi.mediaDigital,
        },
      },
      saranaPrasarana: {
        ...(modul.saranaPrasarana || { fasilitas: [], lingkunganBelajar: [], mediaAjar: [] }),
        mediaAjar:
          pemanfaatanTeknologi.mediaDigital.length > 0
            ? pemanfaatanTeknologi.mediaDigital
            : modul.saranaPrasarana?.mediaAjar || [],
      },
    };
  }, [modul, pemanfaatanTeknologi]);

  const handleUpdatePemanfaatanTeknologi = (updated: {
    platformAplikasi: string[];
    perangkatDigital: string[];
    mediaDigital: string[];
  }) => {
    setPemanfaatanTeknologi(updated);
    if (onUpdateModul) {
      onUpdateModul({
        ...effectiveModul,
        desainPembelajaranRPM: {
          ...(effectiveModul.desainPembelajaranRPM as any),
          pemanfaatanTeknologi: updated,
        },
        saranaPrasarana: {
          ...(effectiveModul.saranaPrasarana || { fasilitas: [], lingkunganBelajar: [], mediaAjar: [] }),
          mediaAjar: updated.mediaDigital,
        },
      });
    }
  };

  const resolvedMeetings = getResolvedMeetings(effectiveModul, alokasiWaktu);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState(false);
  const [isDirectIdentityEditOpen, setIsDirectIdentityEditOpen] = useState(false);
  const [editIdentitasForm, setEditIdentitasForm] = useState<SchoolIdentity>({ ...modul.identitas });
  const [exportType, setExportType] = useState<'WORD' | 'PDF'>('WORD');
  const [activeTab, setActiveTab] = useState<'semua' | 'inti' | 'asesmen' | 'lkpd'>('semua');

  useEffect(() => {
    setEditIdentitasForm({ ...modul.identitas });
  }, [modul.identitas]);

  const handleOpenIdentityEditor = () => {
    setEditIdentitasForm({ ...effectiveModul.identitas });
    setIsDirectIdentityEditOpen(true);
  };

  const handleSaveDirectIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = { ...effectiveModul.identitas, ...editIdentitasForm };
    if (onUpdateIdentitas) {
      onUpdateIdentitas(updated);
    }
    if (onUpdateModul) {
      onUpdateModul({
        ...effectiveModul,
        identitas: updated,
      });
    }
    setIsDirectIdentityEditOpen(false);
  };

  const handlePrint = () => {
    executePrintWithLayout(loadSavedPDFLayout('portrait'));
  };

  const handleDownloadPDF = () => {
    setExportType('PDF');
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = (
    tempat: string,
    tanggal: string,
    selectedKelas?: string,
    layoutOptions?: PDFLayoutOptions,
    tahunPelajaranConfirm?: string
  ) => {
    const chosenClass = selectedKelas || 'all';
    const resolvedTP = tahunPelajaranConfirm || tahunPelajaran || modul.identitas.tahunPelajaran || '2026/2027';
    const updatedModul: ModulAjarDocument = {
      ...effectiveModul,
      judulModul,
      topikMateri,
      alokasiWaktuPertemuan: alokasiWaktu,
      identitas: {
        ...effectiveModul.identitas,
        tempatPenetapan: tempat,
        tanggalPenetapan: tanggal,
        kelas: chosenClass !== 'all' ? chosenClass : effectiveModul.identitas.kelas,
        tahunPelajaran: resolvedTP,
        semester,
      }
    };
    if (onUpdateIdentitas) {
      onUpdateIdentitas(updatedModul.identitas);
    }
    if (exportType === 'WORD') {
      exportModulAjarToWord(updatedModul);
    } else {
      exportModulAjarToPDF(updatedModul, layoutOptions);
    }
    setIsExportModalOpen(false);
  };

  const handleDownloadWord = () => {
    if (isWordExportDisabled()) {
      setIsWordBlockedModalOpen(true);
      return;
    }
    setExportType('WORD');
    setIsExportModalOpen(true);
  };

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto pb-12">
      {/* Top Action Header - Elegant Framed Layout */}
      <div className="no-print bg-white rounded-xl p-4 border-2 border-slate-300 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1528] text-amber-300 border-2 border-amber-400/50 flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-950 border border-orange-300">
                  Tahap 5 • Modul Ajar
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {modul.identitas.mataPelajaran}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Model: <strong className="text-slate-800">{modul.modelPembelajaran}</strong> • Terhubung dengan TP &amp; ATP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEditIdentity || handleOpenIdentityEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
            title="Edit Profil Sekolah, Guru, Kepala Sekolah, dan Titimangsa"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Edit Profil &amp; Identitas Modul</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Save to history */}
            <button
              id="btn-save-modul-history"
              onClick={onSaveToHistory}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isSaved ? 'Tersimpan di Arsip' : 'Simpan ke Arsip'}</span>
            </button>

            {/* Print */}
            <button
              id="btn-print-modul"
              onClick={handlePrint}
              title="Cetak dokumen langsung menggunakan dialog print browser yang telah dioptimalkan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak</span>
            </button>

            {onReconfigureRPM && (
              <button
                id="btn-reconfigure-rpm"
                type="button"
                onClick={onReconfigureRPM}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-400 transition-all shadow-2xs cursor-pointer"
                title="Atur Pilihan TP, Model, Metode, Mitra Pembelajaran, Alokasi Waktu, Kelas & Semester"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atur Pilihan Modul</span>
              </button>
            )}

            {onGoToCPInput && (
              <button
                id="btn-change-subject"
                type="button"
                onClick={onGoToCPInput}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border-2 border-slate-300 transition-all shadow-2xs cursor-pointer"
                title="Ganti Mata Pelajaran & Masukkan CP Baru (Tahap 1)"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Ganti Mata Pelajaran</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Download Word */}
            <button
              id="btn-download-word-modul"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-500 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>

            {/* Download PDF via jsPDF */}
            <button
              id="btn-download-pdf-modul"
              onClick={handleDownloadPDF}
              title="Unduh dokumen Modul Ajar PDF langsung berkualitas tinggi dengan standar kurikulum"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white border-2 border-rose-400 hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Format Selector: RPM (Deep Learning) vs Modul Standar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-xl border-2 border-slate-300 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">Format Dokumen:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedFormat('rpm')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              selectedFormat === 'rpm'
                ? 'bg-[#0B1528] text-amber-300 shadow-xs border border-amber-400/40 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Format RPM (Rencana Pembelajaran Mendalam)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('standar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
              selectedFormat === 'standar'
                ? 'bg-[#0B1528] text-amber-300 shadow-xs border border-amber-400/40 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Format Modul Ajar Standar</span>
          </button>
        </div>
      </div>

      {/* Sub-toggle Tampilan RPM: Desain Kanvas (Canva Mode) vs Naskah Resmi Cetak */}
      {selectedFormat === 'rpm' && (
        <div className="no-print flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-700 text-white shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black text-indigo-950 block">
                Gaya Tampilan Dokumen RPM:
              </span>
              <span className="text-[11px] text-indigo-700">
                Desain Tampilan Kanvas (Canva Style) vs Naskah Resmi (Formal Paper)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-indigo-200 shadow-2xs text-xs font-bold">
            <button
              type="button"
              id="btn-switch-canvas-view"
              onClick={() => setRpmDisplayMode('canvas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                rpmDisplayMode === 'canvas'
                  ? 'bg-indigo-700 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>🎨 Desain Tampilan Kanvas</span>
            </button>
            <button
              type="button"
              id="btn-switch-doc-view"
              onClick={() => setRpmDisplayMode('dokumen')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                rpmDisplayMode === 'dokumen'
                  ? 'bg-indigo-700 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 Naskah Dokumen Cetak</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs for quick scanning - Framed Segmented Controls */}
      <div className="no-print bg-slate-100 p-1.5 rounded-xl border-2 border-slate-300 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveTab('semua')}
          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'semua'
              ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40 font-black'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
          }`}
        >
          Lihat Semua Dokumen
        </button>
        <button
          onClick={() => setActiveTab('inti')}
          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'inti'
              ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40 font-black'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
          }`}
        >
          Kegiatan Pembelajaran ({(modul.kegiatanPembelajaran || []).length} Pertemuan)
        </button>
        <button
          onClick={() => setActiveTab('asesmen')}
          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'asesmen'
              ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40 font-black'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
          }`}
        >
          Asesmen &amp; Rubrik
        </button>
        <button
          onClick={() => setActiveTab('lkpd')}
          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'lkpd'
              ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40 font-black'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
          }`}
        >
          Lampiran LKPD ({modul.lkpd.length})
        </button>
      </div>

      {/* Dynamic Workflow Guide Callout */}
      <div className="no-print bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-blue-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Modul Terpasang: Kelas {modul.identitas.kelas} • Semester {modul.identitas.semester || '1'} • {modul.identitas.mataPelajaran}</span>
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Gunakan tombol <strong>"Atur Pilihan Modul"</strong> untuk memilih Tujuan Pembelajaran (TP), Model (PBL/PjBL), Metode, Mitra, Alokasi Waktu, Kelas, dan Semester. Untuk menyusun modul mapel lain, klik <strong>"Ganti Mata Pelajaran"</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onReconfigureRPM && (
            <button
              type="button"
              onClick={onReconfigureRPM}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Atur Pilihan Modul</span>
            </button>
          )}
          {onGoToCPInput && (
            <button
              type="button"
              onClick={onGoToCPInput}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ganti Mata Pelajaran (Kembali ke Tahap 1)"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Ganti Mapel</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Content Berdasarkan Format & Mode */}
      {selectedFormat === 'rpm' && rpmDisplayMode === 'canvas' ? (
        <RPMCanvasView
          modul={effectiveModul}
          judulModul={judulModul}
          setJudulModul={setJudulModul}
          topikMateri={topikMateri}
          setTopikMateri={setTopikMateri}
          alokasiWaktu={alokasiWaktu}
          setAlokasiWaktu={setAlokasiWaktu}
          tahunPelajaran={tahunPelajaran}
          setTahunPelajaran={setTahunPelajaran}
          semester={semester}
          setSemester={setSemester}
          onSwitchToDocument={() => setRpmDisplayMode('dokumen')}
          onPrint={handlePrint}
          onDownloadWord={handleDownloadWord}
          onDownloadPDF={handleDownloadPDF}
          onOpenEditIdentity={onOpenEditIdentity || handleOpenIdentityEditor}
          onUpdateIdentitas={onUpdateIdentitas}
          onUpdatePemanfaatanTeknologi={handleUpdatePemanfaatanTeknologi}
        />
      ) : (
        /* Main Document Content - Standar Penulisan Ilmiah: Times New Roman 12, Spasi 1.5, Batas Kertas Rapi */
        <div
          id="modul-ajar-paper-container"
          className="print-container scientific-doc modul-ajar-document bg-white rounded-lg border border-slate-300 shadow-md p-6 sm:p-10 md:p-12 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 space-y-6 text-[12pt] leading-[1.5] max-w-5xl mx-auto overflow-hidden break-words"
          style={{ fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', serif", fontSize: '12pt', lineHeight: 1.5 }}
        >
          {selectedFormat === 'rpm' ? (
            <RPMDocumentSection
              modul={effectiveModul}
              judulModul={judulModul}
              setJudulModul={setJudulModul}
              topikMateri={topikMateri}
              setTopikMateri={setTopikMateri}
              alokasiWaktu={alokasiWaktu}
              setAlokasiWaktu={setAlokasiWaktu}
              tahunPelajaran={tahunPelajaran}
              setTahunPelajaran={setTahunPelajaran}
              semester={semester}
              setSemester={setSemester}
              activeTab={activeTab}
              onOpenEditIdentity={onOpenEditIdentity || handleOpenIdentityEditor}
              onUpdateIdentitas={onUpdateIdentitas}
              onUpdatePemanfaatanTeknologi={handleUpdatePemanfaatanTeknologi}
            />
          ) : (
          <>
            {/* Header Modul Standar */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase text-slate-900 leading-snug">
                MODUL AJAR KURIKULUM MERDEKA
              </h1>
              <h2 className="text-[12pt] font-bold text-slate-800 tracking-wide uppercase leading-normal">
                MATA PELAJARAN: {(modul.identitas?.mataPelajaran || '').toUpperCase()}
              </h2>
              <p className="text-[11pt] sm:text-[12pt] text-slate-700 font-normal leading-normal">
                {modul.identitas?.namaSatuanPendidikan || 'Satuan Pendidikan'} • {modul.identitas?.fase} - Kelas {modul.identitas?.kelas} • Tahun Pelajaran {modul.identitas?.tahunPelajaran || '2026/2027'}
              </p>
            </div>

            {/* I. INFORMASI UMUM */}
            <section id="modul-info-umum" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded border-l-4 border-slate-800">
                <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
                  I. Informasi Umum
                </h3>
                <button
                  type="button"
                  onClick={onOpenEditIdentity || handleOpenIdentityEditor}
                  className="no-print px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold flex items-center gap-1.5 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                  title="Edit Identitas Sekolah, Guru, Kepala Sekolah, dan Kelas"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Profil &amp; Penyusun</span>
                </button>
              </div>

              {/* Identitas Tabel Standar Akademik */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[12pt] leading-[1.5] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-64 sm:w-72" />
                    <col className="w-8" />
                    <col className="w-auto" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">A. Satuan Pendidikan</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 text-slate-900 break-words font-semibold align-top">{modul.identitas.namaSatuanPendidikan || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">B. Penyusun</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 text-slate-900 break-words font-semibold align-top">{modul.identitas.namaGuru}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">C. Mata Pelajaran</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 text-slate-900 break-words font-semibold align-top">{modul.identitas.mataPelajaran}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">D. Fase / Kelas</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 text-slate-900 break-words align-top">{modul.identitas.fase} / Kelas {modul.identitas.kelas}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">E. Alokasi Waktu Modul</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 font-bold text-slate-900 break-words align-top">{modul.identitas.alokasiWaktuModul}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">F. Target Murid</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 text-slate-900 break-words align-top">{modul.identitas.targetPesertaDidik}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-200 text-slate-800 align-top">G. Model Pembelajaran</td>
                      <td className="w-8 p-2.5 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 select-none align-top">:</td>
                      <td className="p-2.5 font-bold text-slate-900 break-words align-top">{modul.modelPembelajaran}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kompetensi Awal & P3 */}
              <div className="grid sm:grid-cols-2 gap-3 text-[12pt]">
                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
                  <h4 className="font-bold text-slate-900">Kompetensi Awal (Prasyarat):</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-800 leading-[1.5] pl-1">
                    {(modul.kompetensiAwal || []).map((k, idx) => (
                      <li key={idx} className="text-justify break-words">{k}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
                  <h4 className="font-bold text-slate-900">Dimensi Profil Lulusan:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-800 leading-[1.5] pl-1">
                    {(modul.profilPelajarPancasila || []).map((p, idx) => (
                      <li key={idx} className="text-justify break-words">{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sarana & Prasarana */}
              <div className="p-3.5 bg-white rounded border border-slate-300 text-[12pt] space-y-1.5 leading-[1.5]">
                <h4 className="font-bold text-slate-900">Sarana dan Prasarana:</h4>
                <p className="text-justify break-words"><strong className="text-slate-900">Media Ajar:</strong> {(effectiveModul.saranaPrasarana?.mediaAjar || []).filter(Boolean).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Fasilitas:</strong> {(effectiveModul.saranaPrasarana?.fasilitas || []).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Lingkungan Belajar:</strong> {(effectiveModul.saranaPrasarana?.lingkunganBelajar || []).join(', ') || '-'}</p>
              </div>
              
              <div className="p-3.5 bg-white rounded border border-slate-300 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-slate-900">Pemanfaatan Teknologi Digital &amp; Media:</h4>
                  <button
                    type="button"
                    onClick={() => setIsEditingStandarTech(!isEditingStandarTech)}
                    className="no-print px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isEditingStandarTech ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-700" />
                        <span>Selesai Edit</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3 text-teal-700" />
                        <span>Edit / Tambah Manual</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditingStandarTech && (
                  <div
                    className="no-print p-3 bg-teal-50/70 border border-teal-300 rounded-xl space-y-2.5 text-xs"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {/* Platform */}
                    <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800 block">1. Platform/Aplikasi:</span>
                      {pemanfaatanTeknologi.platformAplikasi.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updated = [...pemanfaatanTeknologi.platformAplikasi];
                              updated[idx] = e.target.value;
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                platformAplikasi: updated,
                              });
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = pemanfaatanTeknologi.platformAplikasi.filter((_, i) => i !== idx);
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                platformAplikasi: updated,
                              });
                            }}
                            className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 pt-0.5">
                        <input
                          type="text"
                          value={newStandarPlatform}
                          onChange={(e) => setNewStandarPlatform(e.target.value)}
                          placeholder="Tambah platform manual..."
                          className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newStandarPlatform.trim()) {
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                platformAplikasi: [...pemanfaatanTeknologi.platformAplikasi, newStandarPlatform.trim()],
                              });
                              setNewStandarPlatform('');
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Perangkat */}
                    <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800 block">2. Perangkat Digital:</span>
                      {pemanfaatanTeknologi.perangkatDigital.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updated = [...pemanfaatanTeknologi.perangkatDigital];
                              updated[idx] = e.target.value;
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                perangkatDigital: updated,
                              });
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = pemanfaatanTeknologi.perangkatDigital.filter((_, i) => i !== idx);
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                perangkatDigital: updated,
                              });
                            }}
                            className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 pt-0.5">
                        <input
                          type="text"
                          value={newStandarPerangkat}
                          onChange={(e) => setNewStandarPerangkat(e.target.value)}
                          placeholder="Tambah perangkat manual..."
                          className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newStandarPerangkat.trim()) {
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                perangkatDigital: [...pemanfaatanTeknologi.perangkatDigital, newStandarPerangkat.trim()],
                              });
                              setNewStandarPerangkat('');
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800 block">3. Media Pembelajaran / Digital:</span>
                      {pemanfaatanTeknologi.mediaDigital.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updated = [...pemanfaatanTeknologi.mediaDigital];
                              updated[idx] = e.target.value;
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                mediaDigital: updated,
                              });
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = pemanfaatanTeknologi.mediaDigital.filter((_, i) => i !== idx);
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                mediaDigital: updated,
                              });
                            }}
                            className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 pt-0.5">
                        <input
                          type="text"
                          value={newStandarMedia}
                          onChange={(e) => setNewStandarMedia(e.target.value)}
                          placeholder="Tambah media manual..."
                          className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newStandarMedia.trim()) {
                              handleUpdatePemanfaatanTeknologi({
                                ...pemanfaatanTeknologi,
                                mediaDigital: [...pemanfaatanTeknologi.mediaDigital, newStandarMedia.trim()],
                              });
                              setNewStandarMedia('');
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-justify break-words"><strong className="text-slate-900">Platform/Aplikasi:</strong> {(pemanfaatanTeknologi.platformAplikasi || []).filter(Boolean).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Perangkat Digital:</strong> {(pemanfaatanTeknologi.perangkatDigital || []).filter(Boolean).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Media Digital:</strong> {(pemanfaatanTeknologi.mediaDigital || []).filter(Boolean).join(', ') || '-'}</p>
              </div>
            </section>

            {/* II. KOMPONEN INTI */}
            <section id="modul-komponen-inti" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
                <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
                  II. Komponen Inti
                </h3>
              </div>

              {/* TP Spesifik & Pemahaman Bermakna */}
              <div className="grid sm:grid-cols-2 gap-3 text-[12pt]">
                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
                  <h4 className="font-bold text-slate-900">A. Tujuan Pembelajaran:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-800 leading-[1.5] pl-1">
                    {(modul.tujuanPembelajaranSpesifik || []).map((t, idx) => (
                      <li key={idx} className="text-justify break-words">{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
                  <h4 className="font-bold text-slate-900">B. Pemahaman Bermakna:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-800 leading-[1.5] pl-1">
                    {(modul.pemahamanBermakna || []).map((pb, idx) => (
                      <li key={idx} className="text-justify break-words">{pb}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pertanyaan Pemantik */}
              <div className="p-3.5 bg-white rounded border border-slate-300 text-[12pt] space-y-1.5 leading-[1.5]">
                <h4 className="font-bold text-slate-900">C. Pertanyaan Pemantik:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-800 pl-1">
                  {(modul.pertanyaanPemantik || []).map((pp, idx) => (
                    <li key={idx} className="italic text-justify break-words">
                      "{pp}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skenario Kegiatan Pembelajaran Per Pertemuan */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-[12pt]">
                  D. Kegiatan Pembelajaran (Model: {modul.modelPembelajaran})
                </h4>

                {resolvedMeetings.map((pertemuan, pIdx) => {
                  const cleanAlokasi = cleanMeetingAlokasi(pertemuan.alokasiWaktu, '2 JP (2 x 35 Menit)', pIdx, modul, alokasiWaktu);
                  const timeAlloc = calculateMeetingTimeAllocation(cleanAlokasi, 2);
                  return (
                  <div
                    key={pertemuan.pertemuanKe || pIdx}
                    className="border border-slate-300 rounded overflow-hidden bg-white shadow-2xs space-y-0 print:break-before-page break-before-page"
                    style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
                  >
                    <div className="bg-slate-100 p-2.5 sm:p-3 border-b border-slate-300">
                      <div className="font-bold text-[11pt] sm:text-[12pt] text-slate-900 tracking-wide">
                        PERTEMUAN {pertemuan.pertemuanKe || (pIdx + 1)}, ALOKASI WAKTU: {cleanAlokasi}
                      </div>
                      <div className="text-[11pt] text-slate-800 mt-1 leading-snug">
                        <span className="font-bold">FOKUS:</span> {cleanMeetingFokus(pertemuan.fokusTP, '-', pIdx, resolvedMeetings.length, topikMateri, (modul.tujuanPembelajaranSpesifik && modul.tujuanPembelajaranSpesifik[0]) || '')}
                      </div>
                    </div>

                    <div className="p-0 border-t border-slate-300">
                      <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                            <th className="p-2.5 w-[25%] border-r border-slate-300 text-center">Tahap Kegiatan</th>
                            <th className="p-2.5 w-[37.5%] border-r border-slate-300 text-center">Aktivitas Guru</th>
                            <th className="p-2.5 w-[37.5%] text-center">Aktivitas Murid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {/* Pendahuluan */}
                          <tr className="align-top">
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                              <div>1. Kegiatan Awal</div>
                              <div className="text-[10pt] font-semibold text-sky-900 mt-0.5">({timeAlloc.formatAwal})</div>
                              <div className="text-[9pt] font-normal text-slate-500">Pendahuluan</div>
                            </td>
                            <td colSpan={2} className="p-2.5 text-slate-800">
                              <ul className="list-decimal list-outside ml-5 space-y-1 text-slate-800 leading-[1.5]">
                                {(pertemuan.pendahuluan || []).map((p, idx) => (
                                  <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(p)}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                          
                          {/* Kegiatan Inti */}
                          {(pertemuan.kegiatanInti || []).map((k, idx) => (
                            <tr key={`inti-${idx}`} className="align-top">
                              <td className="p-2.5 border-r border-slate-300">
                                {idx === 0 && (
                                  <div className="font-bold text-slate-900 mb-1">
                                    <div>2. Kegiatan Inti</div>
                                    <div className="text-[10pt] font-semibold text-sky-900">({timeAlloc.formatInti})</div>
                                    <div className="text-[9pt] font-normal text-slate-500">Model: {modul.modelPembelajaran || 'Deep Learning'}</div>
                                  </div>
                                )}
                                <div className="font-semibold text-slate-800 bg-slate-50 p-1.5 border border-slate-200 rounded mt-1 text-center">
                                  Fase: {k.faseSintaks}
                                </div>
                              </td>
                              <td className="p-2.5 text-slate-800 border-r border-slate-300 leading-[1.5] text-justify break-words">
                                {cleanActivityText(k.aktivitasGuru)}
                              </td>
                              <td className="p-2.5 text-slate-800 leading-[1.5] text-justify break-words">
                                {cleanActivityText(k.aktivitasSiswa)}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Penutup */}
                          <tr className="align-top">
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                              <div>3. Kegiatan Akhir</div>
                              <div className="text-[10pt] font-semibold text-sky-900 mt-0.5">({timeAlloc.formatAkhir})</div>
                              <div className="text-[9pt] font-normal text-slate-500">Penutup</div>
                            </td>
                            <td colSpan={2} className="p-2.5 text-slate-800">
                              <ul className="list-decimal list-outside ml-5 space-y-1 text-slate-800 leading-[1.5]">
                                {(pertemuan.penutup || []).map((pn, idx) => (
                                  <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(pn)}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );})}
              </div>
            </section>

            {/* ASESMEN & RUBRIK */}
            <section id="modul-asesmen" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'asesmen' ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
                <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
                  E. Asesmen Pembelajaran
                </h3>
              </div>

              {/* RENCANA ASESMEN LENGKAP PER PERTEMUAN */}
              <div className="p-4 bg-white rounded border border-slate-300 text-[12pt] space-y-4 leading-[1.5]">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">
                    1. Rencana Asesmen Komprehensif Per Pertemuan
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Struktur Per Pertemuan Sesuai Kurikulum Merdeka
                  </span>
                </div>

                <div className="space-y-4">
                  {resolvedMeetings.map((pert, pIdx) => {
                    const isFirst = pIdx === 0;
                    const isLast = pIdx === resolvedMeetings.length - 1;
                    const totalM = resolvedMeetings.length;
                    const defaultPlan = pert.asesmenPertemuan || {
                      jenisAsesmen: totalM === 1 ? 'Asesmen Diagnostik (Awal), Formatif (Proses) & Sumatif (Lingkup TP)' : isFirst ? 'Asesmen Diagnostik (Awal) & Formatif (Proses)' : isLast ? 'Asesmen Formatif (Presentasi) & Sumatif (Lingkup TP)' : 'Asesmen Formatif (Proses)',
                      teknikDanBentuk: isFirst ? 'Tanya Jawab Pemantik Lisan & Observasi Kesiapan Awal + Lembar Observasi Diskusi' : isLast ? 'Rubrik Presentasi Karya Kelompok & Tes Evaluasi Mandiri Tertulis (HOTS)' : 'Penilaian Kinerja Kelompok pada LKPD & Observasi Diskusi',
                      instrumen: `Lembar Kerja Peserta Didik (LKPD Aktivitas Pertemuan ${pIdx + 1}) & Lembar Observasi Sikap`,
                      buktiBelajar: `Catatan pengisian LKPD Aktivitas Pertemuan ${pIdx + 1} dan keaktifan proses belajar`,
                      tindakLanjut: 'Memberikan bimbingan langsung dan umpan balik deskriptif bagi siswa.',
                    };

                    return (
                      <div key={pIdx} className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-300 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1.5">
                          <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[11pt]">
                            {pIdx + 1}. ASESMEN PERTEMUAN {pIdx + 1} ({pert.alokasiWaktu || `${(pert as any).alokasiJP || 2} JP`}):
                          </h5>
                          <span className="text-[10pt] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                            {defaultPlan.jenisAsesmen}
                          </span>
                        </div>

                        {totalM === 1 ? (
                          /* Pertemuan Tunggal (1 Pertemuan) */
                          <div className="space-y-2.5 pl-2 text-slate-800">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">a. Asesmen Diagnostik (Awal Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Tanya Jawab Lisan Pemantik &amp; Observasi Kesiapan Awal</li>
                                <li><strong>Instrumen Asesmen:</strong> Daftar Pertanyaan Apersepsi Konseptual &amp; Catatan Awal Guru</li>
                                <li><strong>Bukti Belajar:</strong> Respon lisan aktif dan pemahaman prasyarat murid</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">b. Asesmen Formatif (Proses Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Observasi Kinerja Kelompok pada LKPD &amp; Umpan Balik Langsung</li>
                                <li><strong>Instrumen Asesmen:</strong> Lembar Kerja Peserta Didik (LKPD Terpadu) &amp; Rubrik Ketercapaian TP</li>
                                <li><strong>Bukti Belajar:</strong> Hasil pengerjaan lembar kerja dan keaktifan diskusi gotong royong</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">c. Asesmen Sumatif (Lingkup Tujuan Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Tes Mandiri Tertulis (HOTS) &amp; Refleksi Akhir TP</li>
                                <li><strong>Instrumen Asesmen:</strong> Lembar Soal Penalaran Konseptual (Pilihan Ganda &amp; Uraian)</li>
                                <li><strong>Bukti Belajar:</strong> Skor lembar evaluasi mandiri siswa</li>
                                <li><strong>Tindak Lanjut:</strong> Pemetaan ketuntasan KKTP untuk pengayaan/remedial</li>
                              </ul>
                            </div>
                          </div>
                        ) : isFirst ? (
                          /* Pertemuan 1: Diagnostik + Formatif */
                          <div className="space-y-2.5 pl-2 text-slate-800">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">a. Asesmen Diagnostik (Awal Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Tanya Jawab Pemantik Apersepsi Lisan &amp; Pengamatan Minat Belajar</li>
                                <li><strong>Instrumen Asesmen:</strong> {modul.asesmen?.diagnostik?.teknik ? `Pertanyaan Pemantik: ${modul.asesmen.diagnostik.teknik}` : '3 Butir Pertanyaan Apersepsi Kontekstual & Catatan Kesiapan Murid'}</li>
                                <li><strong>Bukti Belajar:</strong> Respon lisan langsung murid dalam menanggapi stimulus materi</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">b. Asesmen Formatif (Proses Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Observasi Keterlibatan Diskusi &amp; Penilaian Kinerja Eksplorasi Awal</li>
                                <li><strong>Instrumen Asesmen:</strong> LKPD Aktivitas Pertemuan 1 (Orientasi Masalah &amp; Eksplorasi Konsep) &amp; Lembar Observasi Sikap</li>
                                <li><strong>Bukti Belajar:</strong> Hasil pengisian lembar kerja kelompok Pertemuan 1 dan catatan pengamatan guru</li>
                                <li><strong>Tindak Lanjut:</strong> Memetakan kelompok butuh perancah bimbingan langsung vs kelompok mandiri</li>
                              </ul>
                            </div>
                          </div>
                        ) : isLast ? (
                          /* Pertemuan Terakhir: Formatif Presentasi + Sumatif */
                          <div className="space-y-2.5 pl-2 text-slate-800">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">a. Asesmen Formatif (Presentasi &amp; Refleksi):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Unjuk Kerja Presentasi Kelompok &amp; Lembar Refleksi Pembelajaran Bermakna</li>
                                <li><strong>Instrumen Asesmen:</strong> Rubrik Penilaian Presentasi Karya &amp; Lembar Refleksi Diri Siswa</li>
                                <li><strong>Bukti Belajar:</strong> Performa presentasi santun, karya laporan kelompok, dan lembar refleksi bermakna</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">b. Asesmen Sumatif (Lingkup Tujuan Pembelajaran):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Tes Tertulis Evaluasi Mandiri (Penalaran Tingkat Tinggi / HOTS)</li>
                                <li><strong>Instrumen Asesmen:</strong> Paket Tes Evaluasi Akhir TP (Pilihan Ganda &amp; Uraian Pemecahan Masalah)</li>
                                <li><strong>Bukti Belajar:</strong> Lembar jawaban tes evaluasi mandiri murid</li>
                                <li><strong>Tindak Lanjut:</strong> Menetapkan ketercapaian KKTP rapor, pengayaan bagi yang tuntas, dan remedial bagi yang belum tuntas</li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          /* Pertemuan 2 s.d. N-1: Formatif Proses */
                          <div className="space-y-2 pl-2 text-slate-800">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900">a. Asesmen Formatif (Proses Pembelajaran Berkelanjutan):</p>
                              <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                                <li><strong>Teknik &amp; Bentuk:</strong> Penilaian Kinerja Kolaboratif &amp; Observasi Penyelidikan Mandiri</li>
                                <li><strong>Instrumen Asesmen:</strong> LKPD Aktivitas Pertemuan {pIdx + 1} (Penyelidikan / Pengolahan Solusi) &amp; Lembar Ceklis Diskusi</li>
                                <li><strong>Bukti Belajar:</strong> Catatan data temuan penyelidikan pada LKPD Pertemuan {pIdx + 1} dan keaktifan interaksi kelompok</li>
                                <li><strong>Tindak Lanjut:</strong> Umpan balik deskriptif (descriptive feedback) seketika dari guru saat pendampingan</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rubrik Penilaian Formatif */}
              <div className="p-3.5 bg-white rounded border border-slate-300 text-[12pt] space-y-2.5 leading-[1.5]">
                <h4 className="font-bold text-slate-900">
                  2. Rubrik Penilaian Formatif (Kriteria Ketercapaian Tujuan Pembelajaran - KKTP):
                </h4>
                <p className="text-slate-800 text-justify break-words">
                  <strong>Teknik Utama:</strong> <span className="font-semibold">{modul.asesmen?.formatif?.teknik || 'Observasi Unjuk Kerja & Penilaian Portofolio LKPD'}</span> — {modul.asesmen?.formatif?.deskripsi || 'Digunakan untuk memantau kemajuan belajar murid secara berkelanjutan.'}
                </p>

                <div className="border border-slate-400 rounded overflow-hidden mt-2">
                  <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                        <th className="p-2 border-r border-slate-400 w-1/5 text-center">Aspek Penilaian</th>
                        <th className="p-2 border-r border-slate-400 w-1/5 text-center">Baru Berkembang (1)</th>
                        <th className="p-2 border-r border-slate-400 w-1/5 text-center">Layak (2)</th>
                        <th className="p-2 border-r border-slate-400 w-1/5 text-center">Cakap (3)</th>
                        <th className="p-2 w-1/5 text-center">Mahir (4)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {(modul.asesmen?.formatif?.rubrik || []).map((r, idx) => (
                        <tr key={idx} className="align-top">
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">
                            {r.aspek}
                          </td>
                          <td className="p-2.5 text-slate-800 border-r border-slate-300 leading-[1.4] text-justify break-words">
                            {r.baruBerkembang}
                          </td>
                          <td className="p-2.5 text-slate-800 border-r border-slate-300 leading-[1.4] text-justify break-words">
                            {r.layak}
                          </td>
                          <td className="p-2.5 text-slate-800 border-r border-slate-300 leading-[1.4] text-justify break-words">
                            {r.cakap}
                          </td>
                          <td className="p-2.5 text-slate-800 leading-[1.4] text-justify break-words">
                            {r.mahir}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sumatif */}
              <div className="p-3.5 bg-white rounded border border-slate-300 text-[12pt] space-y-2.5 leading-[1.5]">
                <h4 className="font-bold text-slate-900">
                  3. Asesmen Sumatif (Akhir Pembelajaran / Evaluasi):
                </h4>
                <p className="text-slate-800">Teknik: <span className="font-semibold">{modul.asesmen?.sumatif?.teknik || '-'}</span></p>

                <div className="space-y-3 pt-1">
                  {(modul.asesmen?.sumatif?.daftarSoal || []).map((s) => (
                    <div key={s.nomor} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900">Soal No. {s.nomor}</span>
                        <span className="text-[11pt] font-bold px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800">
                          Bobot: {s.bobot}
                        </span>
                      </div>
                      <p className="text-slate-900 text-justify break-words leading-[1.5]">{s.soal}</p>
                      {s.pilihanGanda && s.pilihanGanda.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-slate-800 leading-[1.5]">
                          {s.pilihanGanda.map((pg, pgIdx) => (
                            <div key={pgIdx} className="break-words">{pg}</div>
                          ))}
                        </div>
                      )}
                      <p className="text-[11pt] text-slate-900 font-medium bg-white p-2 rounded border border-slate-300 break-words leading-[1.5]">
                        <strong>Kunci / Rubrik Jawaban:</strong> {s.kunciJawaban}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pengayaan & Remedial & Refleksi */}
              <div className="grid sm:grid-cols-2 gap-3 text-[12pt]">
                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-2 leading-[1.5]">
                  <h4 className="font-bold text-slate-900">F. Pengayaan &amp; Remedial:</h4>
                  <p className="text-justify break-words"><strong>Pengayaan:</strong> {modul.pengayaanDanRemedial?.pengayaan || '-'}</p>
                  <p className="text-justify break-words"><strong>Remedial:</strong> {modul.pengayaanDanRemedial?.remedial || '-'}</p>
                </div>

                <div className="p-3.5 bg-white rounded border border-slate-300 space-y-2 leading-[1.5]">
                  <h4 className="font-bold text-slate-900">G. Refleksi Guru &amp; Siswa:</h4>
                  <div>
                    <span className="font-bold text-slate-800">Refleksi Guru:</span>
                    <ul className="list-disc list-inside text-slate-800 space-y-1 pl-1">
                      {(modul.refleksi?.refleksiGuru || []).map((rg, idx) => (
                        <li key={idx} className="text-justify break-words">{rg}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Refleksi Siswa:</span>
                    <ul className="list-disc list-inside text-slate-800 space-y-1 pl-1">
                      {(modul.refleksi?.refleksiSiswa || []).map((rs, idx) => (
                        <li key={idx} className="text-justify break-words">{rs}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Lembar Pengesahan Format Standar Resmi Kedinasan (Setelah Asesmen, Sebelum Lampiran LKPD) */}
            <div className="pt-8 border-t-2 border-slate-400 page-avoid-break text-[12pt] leading-[1.5]">
              <div className="no-print mb-4 flex items-center justify-between flex-wrap gap-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={onOpenEditIdentity || handleOpenIdentityEditor}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Edit Profil Sekolah, Guru, Kepala Sekolah, dan Titimangsa"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Data Penandatangan &amp; Titimangsa</span>
                </button>

                {onUpdateIdentitas && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Jabatan Penandatangan:</span>
                    <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-md">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateIdentitas({ ...modul.identitas, peranGuru: 'Guru Kelas' })
                        }
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                          (modul.identitas.peranGuru || 'Guru Kelas') === 'Guru Kelas'
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Klik untuk memilih Guru Kelas"
                      >
                        Guru Kelas
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateIdentitas({ ...modul.identitas, peranGuru: 'Guru Mata Pelajaran' })
                        }
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                          (modul.identitas.peranGuru || 'Guru Kelas') === 'Guru Mata Pelajaran'
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Klik untuk memilih Guru Mata Pelajaran"
                      >
                        Guru Mata Pelajaran
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <table className="w-full border-collapse border-none text-[12pt] leading-[1.5] text-slate-900">
                <tbody>
                  {/* Baris 1: Mengetahui & Tempat/Tanggal */}
                  <tr>
                    <td className="w-1/2 border-none p-0 align-top">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p>Mengetahui,</p>
                      </div>
                    </td>
                    <td className="w-1/2 border-none p-0 align-top">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p>
                          {modul.identitas.tempatPenetapan || modul.identitas.kabupaten || '...................'},{' '}
                          {modul.identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>
                  </tr>

                  {/* Baris 2: Jabatan Kepala Sekolah & Jabatan Guru Kelas */}
                  <tr>
                    <td className="w-1/2 border-none p-0 align-top pt-1">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="font-bold">Kepala Sekolah</p>
                      </div>
                    </td>
                    <td className="w-1/2 border-none p-0 align-top pt-1">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="font-bold">{modul.identitas.peranGuru || 'Guru Kelas'}</p>
                      </div>
                    </td>
                  </tr>

                  {/* Baris 3: Ruang Tanda Tangan & Nama Lengkap (Sejajar Sempurna) */}
                  <tr>
                    <td className="w-1/2 border-none p-0 align-bottom h-24 pb-1">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="font-bold underline break-words inline-block">
                          {modul.identitas.namaKepalaSekolah || '...........................................'}
                        </p>
                      </div>
                    </td>
                    <td className="w-1/2 border-none p-0 align-bottom h-24 pb-1">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="font-bold underline break-words inline-block">
                          {modul.identitas.namaGuru || '...........................................'}
                        </p>
                      </div>
                    </td>
                  </tr>

                  {/* Baris 4: NIP Kepala Sekolah & NIP Guru (Sejajar Sempurna) */}
                  <tr>
                    <td className="w-1/2 border-none p-0 align-top">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="text-slate-700">
                          NIP. {modul.identitas.nipKepalaSekolah ? modul.identitas.nipKepalaSekolah : '...........................................'}
                        </p>
                      </div>
                    </td>
                    <td className="w-1/2 border-none p-0 align-top">
                      <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                        <p className="text-slate-700">
                          NIP. {modul.identitas.nipGuru ? modul.identitas.nipGuru : '...........................................'}
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* III. LAMPIRAN LKPD & BAHAN BACAAN */}
            <section id="modul-lampiran" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'lkpd' ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800 flex-wrap gap-2">
                <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
                  III. Lampiran: Lembar Kerja Murid (LKPD Berkelompok) &amp; Bahan Ajar
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const resolvedLKPDList = Array.isArray(modul.lkpd) && modul.lkpd.length >= resolvedMeetings.length && modul.lkpd.length > 0
                      ? modul.lkpd
                      : buildStandardLKPDList(resolvedMeetings.length, topikMateri || modul.identitas.mataPelajaran, modul.modelPembelajaran);

                    const fullPrompt = generateFullModuleLKPDVisualPrompt(
                      resolvedLKPDList.length,
                      topikMateri,
                      modul.identitas.mataPelajaran,
                      modul.identitas.kelas,
                      modul.identitas.fase,
                      modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                      resolvedLKPDList.map((l, idx) => ({
                        judulAktivitas: l.judulLKPD || `Aktivitas Pertemuan ${idx + 1}`,
                        pertemuanKe: idx + 1,
                        topikMateri,
                        mataPelajaran: modul.identitas.mataPelajaran,
                        kelas: modul.identitas.kelas,
                        fase: modul.identitas.fase,
                        modelPembelajaran: modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                        fokusTarget: l.tujuanKegiatan || `Eksplorasi konsep ${topikMateri}`,
                        petunjukAktivitas: l.langkahKerja,
                        langkahKerja: (l.pertanyaanDiskusi || []).map((p, pIdx) => ({ nomor: pIdx + 1, langkahKerja: p })),
                        pertanyaanPemantik: l.kesimpulanPrompt,
                        refleksiSesi: 'Refleksi kerja sama kelompok',
                        namaSekolah: modul.identitas.namaSatuanPendidikan,
                      }))
                    );
                    setPromptModalTitle(`Paket Prompt Desain Visual LKPD (${resolvedLKPDList.length} Pertemuan)`);
                    setPromptModalText(fullPrompt);
                    setPromptModalPertemuan(undefined);
                    setPromptModalOpen(true);
                  }}
                  className="no-print px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Salin Prompt Desain Grafis LKPD untuk Google Gemini / Gems / Canva"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>✨ Prompt Desain Visual LKPD (Gemini AI / Gems)</span>
                </button>
              </div>

              {/* LKPD Cards (Modular Per Pertemuan) */}
              <div className="space-y-4">
                {(() => {
                  const resolvedLKPDList = Array.isArray(modul.lkpd) && modul.lkpd.length >= resolvedMeetings.length && modul.lkpd.length > 0
                    ? modul.lkpd
                    : buildStandardLKPDList(resolvedMeetings.length, topikMateri || modul.identitas.mataPelajaran, modul.modelPembelajaran);

                  return resolvedLKPDList.map((l, idx) => {
                    const pertNo = idx + 1;
                    const theme = getLKPDMeetingStyle(pertNo, modul.identitas.mataPelajaran);
                    return (
                    <div
                      key={idx}
                      className={theme.cardContainerClass}
                    >
                      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded flex items-center gap-1 font-sans">
                            <span>{theme.icon}</span>
                            <span>LKPD Pertemuan {pertNo}</span>
                          </span>
                          <h4 className="text-[14pt] font-bold text-slate-900 font-serif">
                            {l.judulLKPD}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const pText = generateLKPDVisualPrompt({
                              judulAktivitas: l.judulLKPD,
                              pertemuanKe: pertNo,
                              topikMateri,
                              mataPelajaran: modul.identitas.mataPelajaran,
                              kelas: modul.identitas.kelas,
                              fase: modul.identitas.fase,
                              modelPembelajaran: modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                              fokusTarget: l.tujuanKegiatan || `Eksplorasi konsep ${topikMateri}`,
                              petunjukAktivitas: l.langkahKerja,
                              langkahKerja: (l.pertanyaanDiskusi || []).map((p, pIdx) => ({ nomor: pIdx + 1, langkahKerja: p })),
                              pertanyaanPemantik: l.kesimpulanPrompt,
                              refleksiSesi: 'Refleksi kerja sama kelompok',
                              namaSekolah: modul.identitas.namaSatuanPendidikan,
                            });
                            setPromptModalTitle(`Prompt Visual LKPD Pertemuan ${pertNo}`);
                            setPromptModalText(pText);
                            setPromptModalPertemuan(pertNo);
                            setPromptModalOpen(true);
                          }}
                          className="no-print px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs font-sans"
                          title="Salin Prompt AI untuk Lembar Kerja Pertemuan Ini"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Prompt Visual Pertemuan {pertNo}</span>
                        </button>
                      </div>

                      {/* Box Identitas Kelompok Resmi (Maksimal 6 Siswa) */}
                      <div className="p-3.5 bg-slate-50/50 rounded border border-slate-400 text-[11pt] space-y-1.5 font-serif text-left shadow-2xs">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-300 font-bold text-slate-900">
                          <span>IDENTITAS KELOMPOK PERTEMUAN {pertNo} (MAKSIMAL 6 SISWA)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pb-1 border-b border-slate-300 text-slate-900 font-medium">
                          <div><strong>Nama Kelompok:</strong> ........................................</div>
                          <div><strong>Hari / Tanggal:</strong> ........................................</div>
                          <div><strong>Mata Pelajaran:</strong> {modul.identitas.mataPelajaran}</div>
                          <div><strong>Kelas / Pertemuan:</strong> Kelas {modul.identitas.kelas} (Pertemuan Ke-{pertNo})</div>
                        </div>
                        <div className="pt-0.5 text-slate-900">
                          <strong className="block mb-1 text-[11pt]">Anggota Kelompok (Maksimal 6 Siswa):</strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 text-slate-800 text-[11pt]">
                            <div>1. ................................ <strong>(Ketua)</strong></div>
                            <div>4. ................................</div>
                            <div>2. ................................</div>
                            <div>5. ................................</div>
                            <div>3. ................................</div>
                            <div>6. ................................</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11pt] text-slate-800 text-justify break-words">
                        <strong>Tujuan Pembelajaran Kelompok:</strong> {l.tujuanKegiatan}
                      </p>

                      {l.alatBahan && l.alatBahan.length > 0 && (
                        <div className="text-[12pt]">
                          <span className="font-bold text-slate-900">Alat &amp; Bahan Kelompok: </span>
                          <span className="text-slate-800">{l.alatBahan.join(', ')}</span>
                        </div>
                      )}

                      <div className="text-[12pt] space-y-1">
                        <h5 className="font-bold text-slate-900">Langkah Kegiatan Kelompok:</h5>
                        <ol className="list-decimal list-inside space-y-1 text-slate-800 pl-2">
                          {(l.langkahKerja || []).map((lk, lkIdx) => (
                            <li key={lkIdx} className="text-justify break-words">{lk}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="text-[12pt] space-y-2 pt-2">
                        <h5 className="font-bold text-slate-900 font-serif">Pertanyaan Diskusi Kelompok:</h5>
                        <ol className="list-decimal list-inside space-y-3 text-slate-800 pl-2">
                          {(l.pertanyaanDiskusi || []).map((pd, pdIdx) => (
                            <li key={pdIdx} className="font-medium text-slate-900 text-justify break-words space-y-1.5">
                              <span>{pd}</span>
                              <div className="p-3 bg-white rounded-lg border border-slate-300 text-slate-500 font-serif text-[11pt] mt-2 space-y-2 min-h-[110px] shadow-3xs">
                                <span className="text-[10pt] text-slate-400 font-sans block mb-1">Lembar Jawaban Kelompok:</span>
                                <div className="text-slate-400 border-b border-dotted border-slate-300 pb-1 mb-1"></div>
                                <div className="text-slate-400 border-b border-dotted border-slate-300 pb-1 mb-1"></div>
                                <div className="text-slate-400 border-b border-dotted border-slate-300 pb-1"></div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {l.kesimpulanPrompt && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-300 text-[12pt] text-slate-800 italic leading-[1.5] break-words">
                          <strong>Kesimpulan Kelompok:</strong> {l.kesimpulanPrompt}
                        </div>
                      )}
                    </div>
                  );
                });})()}
              </div>

              {/* Bahan Bacaan Guru & Siswa */}
              <div className="p-4 bg-white rounded border border-slate-300 text-[12pt] space-y-2 leading-[1.5]">
                <h4 className="font-bold text-slate-900">Bahan Bacaan Guru dan Murid:</h4>
                <p className="text-slate-800 leading-[1.5] text-justify break-words">
                  {modul.bahanBacaanGuruDanSiswa?.ringkasanMateri || '-'}
                </p>
                {modul.bahanBacaanGuruDanSiswa?.materiPengayaanSingkat && (
                  <p className="text-slate-800 leading-[1.5] text-justify break-words pt-1">
                    <strong>Pengayaan Singkat:</strong> {modul.bahanBacaanGuruDanSiswa.materiPengayaanSingkat}
                  </p>
                )}
              </div>

              {/* Glosarium Modul */}
              <div className="border border-slate-400 rounded overflow-hidden">
                <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                      <th className="p-2.5 w-1/3 border-r border-slate-400 text-center">Glosarium Istilah</th>
                      <th className="p-2.5 text-center">Definisi Konseptual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(modul.glosarium || []).map((g, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">
                          {g.istilah}
                        </td>
                        <td className="p-2.5 text-slate-800 text-justify break-words leading-[1.5]">{g.definisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Daftar Pustaka Modul */}
              <div className="p-5 bg-white rounded border border-slate-300 text-[12pt] leading-[1.5] mt-4">
                <h4 className="font-bold text-slate-900 mb-3 text-sm tracking-wide">Daftar Pustaka:</h4>
                <ul className="list-disc list-inside space-y-2.5 text-slate-800 pl-1">
                  {(modul.daftarPustaka || []).map((dp, idx) => (
                    <li key={idx} className="text-justify break-words leading-[1.5]">{dp}</li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
      )}

      {/* Back Button (No Print) */}
      <div className="no-print flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToATP}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dokumen ATP (8 Bagian)</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadWord}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh Modul Ajar (.doc)</span>
        </button>
      </div>

      {/* Quick Direct Identity Edit Modal for Modul Ajar */}
      {isDirectIdentityEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-slate-300 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0B1528] text-white p-4.5 sm:p-5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Identitas &amp; Profil Modul Ajar</h3>
                  <p className="text-xs text-amber-200">Perbarui Nama Sekolah, Guru, Kepala Sekolah, dan Titimangsa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectIdentityEditOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectIdentity} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Nama Satuan Pendidikan */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Nama Satuan Pendidikan (Sekolah):</label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Terkunci Sesuai Profil</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.namaSatuanPendidikan || ''}
                    placeholder="Nama Sekolah Terkunci"
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium select-none"
                  />
                </div>

                {/* Nama Guru */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Nama Guru / Penyusun:</label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Terkunci Sesuai Profil</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.namaGuru || ''}
                    placeholder="Nama Lengkap & Gelar"
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium select-none"
                  />
                </div>

                {/* NIP Guru */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">NIP Guru:</label>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.nipGuru || ''}
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium font-mono select-none"
                  />
                </div>

                {/* Peran Guru */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Jabatan Guru:</label>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.peranGuru || 'Guru Kelas'}
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium select-none"
                  />
                </div>

                {/* Kelas Target */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Kelas Target Modul ({editIdentitasForm.fase || modul.identitas.fase}):</label>
                  <select
                    value={editIdentitasForm.kelas || '5'}
                    onChange={(e) => setEditIdentitasForm({ ...editIdentitasForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 font-medium bg-white"
                  >
                    {getClassesForFase(editIdentitasForm.fase || modul.identitas.fase).map((cls) => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Nama Kepala Sekolah */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Nama Kepala Sekolah:</label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">Terkunci Sesuai Profil</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.namaKepalaSekolah || ''}
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium select-none"
                  />
                </div>

                {/* NIP Kepala Sekolah */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">NIP Kepala Sekolah:</label>
                  <input
                    type="text"
                    disabled
                    value={editIdentitasForm.nipKepalaSekolah || ''}
                    className="w-full px-3 py-2 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium font-mono select-none"
                  />
                </div>

                {/* Tempat Penetapan */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Tempat Penetapan (Kota/Kab/Desa):</label>
                  <input
                    type="text"
                    value={editIdentitasForm.tempatPenetapan || ''}
                    onChange={(e) => setEditIdentitasForm({ ...editIdentitasForm, tempatPenetapan: e.target.value })}
                    placeholder="Contoh: Fatubai / Jakarta"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 font-medium"
                  />
                </div>

                {/* Tanggal Penetapan */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Tanggal Penetapan:</label>
                  <input
                    type="text"
                    value={editIdentitasForm.tanggalPenetapan || ''}
                    onChange={(e) => setEditIdentitasForm({ ...editIdentitasForm, tanggalPenetapan: e.target.value })}
                    placeholder="Contoh: 15 Juli 2024"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 font-medium"
                  />
                </div>

                {/* Tahun Pelajaran & Semester */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Tahun Pelajaran:</label>
                  <input
                    type="text"
                    value={editIdentitasForm.tahunPelajaran || ''}
                    onChange={(e) => setEditIdentitasForm({ ...editIdentitasForm, tahunPelajaran: e.target.value })}
                    placeholder="Contoh: 2026/2027"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Semester:</label>
                  <select
                    value={editIdentitasForm.semester || '1'}
                    onChange={(e) => setEditIdentitasForm({ ...editIdentitasForm, semester: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 font-medium bg-white"
                  >
                    <option value="1">Semester 1 (Ganjil)</option>
                    <option value="2">Semester 2 (Genap)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDirectIdentityEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={modul.identitas}
        exportType={exportType}
        documentTitle={`Modul Ajar: ${modul.identitas.mataPelajaran}`}
        onUpdateIdentitas={onUpdateIdentitas}
        onConfirm={handleExportConfirm}
        availableClasses={getClassesForFase(modul.identitas.fase)}
        defaultSelectedKelas={modul.identitas.kelas}
        defaultOrientation="portrait"
      />

      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleDownloadPDF}
        documentTitle={`Modul Ajar: ${modul.identitas.mataPelajaran}`}
      />

      {/* Modal Generator Prompt Visual LKPD AI */}
      <LKPDVisualPromptModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        title={promptModalTitle}
        pertemuanKe={promptModalPertemuan}
        promptText={promptModalText}
        topikMateri={topikMateri}
        mataPelajaran={modul.identitas.mataPelajaran}
      />
    </div>
  );
};
