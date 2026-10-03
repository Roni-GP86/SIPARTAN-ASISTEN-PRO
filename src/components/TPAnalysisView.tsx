import React, { useState } from "react";
import { ExportConfirmModal } from './ExportConfirmModal';
import { filterTPListByClass, filterElemenRowsByClass, countItemsByClass, getClassesForFase } from '../utils/classFilterUtils';

import { TPItem, SchoolIdentity, BedahElemenRow, PDFLayoutOptions } from '../types';
import { exportTPAnalysisToWord, exportTPAnalysisToPDF, getRasionalDanTaksonomiBedahCP } from '../utils/exportUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { formatTPWithCode } from '../utils/curriculumCPResolver';
import { executePrintWithLayout, loadSavedPDFLayout } from '../utils/printLayoutUtils';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  Layers,
  Clock,
  ArrowRight,
  ArrowLeft,
  Printer,
  FileDown,
  CheckCircle2,
  FileText,
  Building,
  GraduationCap,
  ListOrdered,
  BookOpen,
  FolderOpen,
  Lock
} from 'lucide-react';

interface TPAnalysisViewProps {
  tpList: TPItem[];
  rasionalAnalisis: string;
  identitas: SchoolIdentity;
  elemen: string;
  capaianPembelajaran: string;
  elemenRows?: BedahElemenRow[];
  onUpdateTPList: (tpList: TPItem[]) => void;
  onProceedToATP: () => void;
  onProceedToMediaPrompt?: () => void;
  onBackToInput: () => void;
  isLoadingATP: boolean;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
}

export const TPAnalysisView: React.FC<TPAnalysisViewProps> = ({

  tpList,
  rasionalAnalisis,
  identitas,
  elemen,
  capaianPembelajaran,
  elemenRows,
  onUpdateTPList,
  onProceedToATP,
  onProceedToMediaPrompt,
  onBackToInput,
  isLoadingATP,
  onOpenEditIdentity,
  onUpdateIdentitas,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF'>('WORD');
  const [viewMode, setViewMode] = useState<'document_exact' | 'table_edit'>('document_exact');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TPItem>>({});

  // Determine sub-grades based on Fase
  const fase = identitas.fase || 'Fase B';
  const kelasCols =
    fase === 'Fase A'
      ? ['1', '2']
      : fase === 'Fase B'
      ? ['3', '4']
      : ['5', '6'];

  const totalJP = tpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);
  const rasionalData = getRasionalDanTaksonomiBedahCP(tpList, identitas, rasionalAnalisis);
  const isAgama =
    (identitas.mataPelajaran || '').toLowerCase().includes('agama') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('katolik') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('kristen') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('islam') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('hindu') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('buddha') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('khonghucu') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('pak') ||
    (identitas.mataPelajaran || '').toLowerCase().includes('pai');
  const regulasiCpLabel = isAgama ? 'Regulasi Standar Capaian Pembelajaran BKP No. 020/2026' : 'Keputusan Kepala BSKAP No. 046 Tahun 2025';
  const regulasiCpShort = isAgama ? 'BKP 020/2026' : 'Keputusan Kepala BSKAP No. 046/2025';

  // Build resolved rows for display with strict deduplication
  const seenTPKeys = new Set<string>();
  const resolvedRows: BedahElemenRow[] =
    elemenRows && elemenRows.length > 0
      ? elemenRows.map((row) => {
          // Re-filter TPs belonging to this element from tpList with strict deduplication
          const rowTPs = tpList.filter((tp) => {
            const matchesElemen = (tp.elemen || '').toLowerCase().trim() === (row.elemen || '').toLowerCase().trim();
            const tpKey = `${tp.kodeTP || ''}_${(tp.rumusanTP || '').slice(0, 35)}`.toLowerCase();
            if (matchesElemen && !seenTPKeys.has(tpKey)) {
              seenTPKeys.add(tpKey);
              return true;
            }
            return false;
          });

          const fallbackTPs = (row.daftarTP || []).filter((tp) => {
            const tpKey = `${tp.kodeTP || ''}_${(tp.rumusanTP || '').slice(0, 35)}`.toLowerCase();
            if (!seenTPKeys.has(tpKey)) {
              seenTPKeys.add(tpKey);
              return true;
            }
            return false;
          });

          return {
            ...row,
            daftarTP: rowTPs.length > 0 ? rowTPs : fallbackTPs,
          };
        })
      : [
          {
            id: 'row-default-1',
            elemen: elemen || 'Pemahaman IPAS',
            capaianPembelajaran: capaianPembelajaran || '',
            daftarKompetensi: Array.from(new Set(tpList.map((t) => t.kompetensi).filter(Boolean))).map(
              (k, i) => `${i + 1}. ${k}`
            ),
            daftarLingkupMateri: Array.from(new Set(tpList.map((t) => t.lingkupMateri).filter(Boolean))).map(
              (m, i) => `${i + 1}. ${m}`
            ),
            daftarTP: tpList.filter((tp) => {
              const tpKey = `${tp.kodeTP || ''}_${(tp.rumusanTP || '').slice(0, 35)}`.toLowerCase();
              if (!seenTPKeys.has(tpKey)) {
                seenTPKeys.add(tpKey);
                return true;
              }
              return false;
            }),
          },
        ];

  const startEdit = (tp: TPItem) => {
    setEditingId(tp.id);
    setEditForm({ ...tp });
    setViewMode('table_edit');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    const updated = tpList.map((tp) => (tp.id === id ? ({ ...tp, ...editForm } as TPItem) : tp));
    onUpdateTPList(updated);
    setEditingId(null);
    setEditForm({});
  };

  const toggleClassForTP = (tpId: string, kelasNum: string) => {
    const updated = tpList.map((tp) => {
      if (tp.id !== tpId) return tp;
      const currentCentang = Array.isArray(tp.kelasCentang)
        ? [...tp.kelasCentang]
        : tp.kelasTarget
        ? [tp.kelasTarget]
        : [];

      let nextCentang: string[];
      if (currentCentang.includes(kelasNum)) {
        nextCentang = currentCentang.filter((k) => k !== kelasNum);
      } else {
        nextCentang = [...currentCentang, kelasNum];
      }

      const newTarget = nextCentang.length > 0 ? nextCentang[0] : kelasNum;
      return {
        ...tp,
        kelasCentang: nextCentang,
        kelasTarget: newTarget,
      };
    });
    onUpdateTPList(updated);
  };


  const handleDownloadWord = () => {
    if (isWordExportDisabled()) {
      setIsWordBlockedModalOpen(true);
      return;
    }
    setExportType('WORD');
    setIsExportModalOpen(true);
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
    tahunPelajaran?: string
  ) => {
    const chosenClass = selectedKelas || 'all';
    const isFiltered = chosenClass !== 'all';
    const resolvedTP = tahunPelajaran || identitas.tahunPelajaran || '2026/2027';

    // Filter TPs if specific class selected
    const filteredTPs = isFiltered
      ? filterTPListByClass(tpList, chosenClass, identitas.fase)
      : tpList;

    // Filter Elemen Rows if specific class selected
    const sourceRows = elemenRows && elemenRows.length > 0 
      ? elemenRows 
      : [{ id: '1', elemen: elemen, capaianPembelajaran: capaianPembelajaran, daftarKompetensi: [], daftarLingkupMateri: [], daftarTP: tpList }];
    const filteredRows = isFiltered
      ? filterElemenRowsByClass(sourceRows, chosenClass, identitas.fase)
      : sourceRows;

    // Recalculate total JP for selected class
    const classTotalJP = filteredTPs.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);

    const updatedIdentitas: SchoolIdentity = {
      ...identitas,
      tempatPenetapan: tempat,
      tanggalPenetapan: tanggal,
      tahunPelajaran: resolvedTP,
      kelas: isFiltered ? chosenClass : (kelasCols.length > 1 ? `${kelasCols[0]} & ${kelasCols[1]}` : identitas.kelas),
      alokasiWaktuTotal: `${classTotalJP} JP`,
    };

    if (onUpdateIdentitas) {
      onUpdateIdentitas(updatedIdentitas);
    }

    if (exportType === 'WORD') {
      exportTPAnalysisToWord(filteredTPs, updatedIdentitas, elemen, capaianPembelajaran, rasionalAnalisis, filteredRows);
    } else {
      exportTPAnalysisToPDF(filteredTPs, updatedIdentitas, elemen, capaianPembelajaran, rasionalAnalisis, filteredRows, layoutOptions);
    }
    setIsExportModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (tpList.length <= 1) {
      alert('Minimal harus ada satu Tujuan Pembelajaran (TP).');
      return;
    }
    const filtered = tpList.filter((tp) => tp.id !== id);
    onUpdateTPList(filtered);
  };

  const handleAddNewTPForElement = (targetElemen: string, targetCP: string) => {
    const nextIndex = tpList.length + 1;
    const defaultKelas = kelasCols[0];
    const newTP: TPItem = {
      id: `tp-${Date.now()}`,
      kodeTP: `${defaultKelas}.${nextIndex}`,
      elemen: targetElemen || elemen || 'Elemen Mapel',
      kalimatCP: targetCP || capaianPembelajaran,
      kompetensi: 'Memahami',
      lingkupMateri: 'Materi Pokok Baru',
      rumusanTP: 'Peserta didik mampu memahami materi secara mandiri dan kontekstual.',
      indikatorKetercapaian: 'Dapat menjelaskan konsep dan menyajikan hasil pengamatan dengan tepat.',
      alokasiJP: 4,
      dimensiP3: ['Bernalar Kritis', 'Mandiri'],
      semesterTarget: 'Semester 1',
      kelasTarget: defaultKelas,
      kelasCentang: [defaultKelas],
      urutanAlur: nextIndex,
    };
    onUpdateTPList([...tpList, newTP]);
    startEdit(newTP);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Top Action Header Bar - Clean Framed Layout */}
      <div className="bg-white rounded-xl p-4 border-2 border-slate-300 shadow-md space-y-3 mb-6 relative">
        {/* Tier 1: Breadcrumb/Back, Badges, and View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onBackToInput}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors flex items-center gap-1.5 text-xs font-black border-2 border-slate-300 cursor-pointer shadow-2xs"
              title="Kembali ke formulir input CP"
            >
              <ArrowLeft className="w-4 h-4 text-amber-600" />
              <span>Kembali ke Input CP</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-[#0B1528] text-amber-300 text-xs font-black border border-amber-400/50 shadow-xs">
                {resolvedRows.length} Elemen Mapel
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-xs font-black border border-amber-500 shadow-xs">
                {tpList.length} Butir TP
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 text-xs font-black border-2 border-emerald-400 shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Total {totalJP} JP (@ 35 Menit)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-300 text-[11px] font-bold">
                Permendikdasmen 13/2025
              </span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border-2 border-slate-300 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('document_exact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === 'document_exact'
                  ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Tampilan Matriks
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table_edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === 'table_edit'
                  ? 'bg-[#0B1528] text-amber-300 shadow-sm border border-amber-400/40'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1.5" />
              Mode Edit Butir
            </button>
          </div>
        </div>

        {/* Tier 2: Document Action Buttons & Primary Proceed Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenEditIdentity && (
              <button
                type="button"
                onClick={onOpenEditIdentity}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Edit Profil Sekolah, Penyusun, dan Kepala Sekolah"
              >
                <Building className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Profil Sekolah &amp; Penyusun</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black text-white bg-blue-700 hover:bg-blue-800 border-2 border-blue-500 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download Dokumen Microsoft Word (.doc) Lengkap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-700 border-2 border-rose-400 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download Dokumen PDF Resmi Lengkap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => executePrintWithLayout(loadSavedPDFLayout('landscape'))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Cetak Dokumen"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onProceedToMediaPrompt && (
              <button
                type="button"
                onClick={onProceedToMediaPrompt}
                className="px-3.5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 border-2 border-pink-400 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                title="Buka Bank Prompt Media Pembelajaran (Komik & Infografis 3D Pixar/Disney)"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Prompt Media 3D</span>
              </button>
            )}

            {/* Primary Action: Susun ATP */}
            <button
              type="button"
              onClick={onProceedToATP}
              disabled={isLoadingATP}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-emerald-600 border-2 border-emerald-400 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isLoadingATP ? (
                <span>Menyusun Analisis TP ke ATP 8 Bagian...</span>
              ) : (
                <>
                  <span>Lanjut Susun Analisis TP ke ATP 8 Bagian (A-H)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rationale / Context Card - Framed in Gold & Amber */}
      {rasionalAnalisis && (
        <div className="bg-amber-50/90 border-2 border-amber-400 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <div className="w-6 h-6 rounded-md bg-[#0B1528] text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1">
            <span className="font-extrabold text-amber-950 uppercase tracking-wide text-[11px]">
              Rasional &amp; Rekomendasi Taksonomi Bedah CP:
            </span>
            <p className="text-amber-900 leading-relaxed text-xs font-medium">{rasionalAnalisis}</p>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW CONTAINER */}
      {viewMode === 'document_exact' ? (
        <div className="space-y-6">
          {/* HALAMAN 1: COVER DOKUMEN RESMI - Framed */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 shadow-md text-center font-serif text-slate-900 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500" />
            
            <div className="space-y-3 pt-4">
              {identitas.logoUrl && (
                <div className="flex justify-center pb-2">
                  <img
                    src={identitas.logoUrl}
                    alt="Logo Satuan Pendidikan"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xs"
                  />
                </div>
              )}
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                ANALISIS CAPAIAN PEMBELAJARAN
                <br />
                KE TUJUAN PEMBELAJARAN
              </h1>
              <div className="w-28 h-1 bg-[#0B1528] mx-auto mt-4 rounded-full" />
            </div>

            <div className="py-6 space-y-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-wide uppercase text-[#0B1528]">
                {identitas.mataPelajaran || 'ILMU PENGETAHUAN ALAM DAN SOSIAL (IPAS)'}
              </h2>
              <p className="text-sm font-sans font-extrabold text-amber-800 bg-amber-50 inline-block px-3 py-1 rounded-md border border-amber-300">
                {identitas.fase} • Kelas {identitas.kelas}
              </p>
            </div>

            <div className="pt-6 pb-2 space-y-1">
              <p className="text-base font-black uppercase tracking-wide">
                {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
              </p>
              <p className="text-sm font-sans text-slate-600 font-medium">
                Tahun Pelajaran: {identitas.tahunPelajaran || '2026/2027'}
              </p>
              {identitas.alokasiWaktuTotal && (
                <p className="text-xs font-sans text-emerald-800 font-bold bg-emerald-50 inline-block px-2.5 py-0.5 rounded border border-emerald-200 mt-1">
                  Alokasi Intrakurikuler: {identitas.alokasiWaktuTotal}
                </p>
              )}
            </div>

            {onOpenEditIdentity && (
              <div className="pt-2 no-print flex justify-center">
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit Data Cover &amp; Profil Sekolah</span>
                </button>
              </div>
            )}
          </div>

          {/* HALAMAN 2: MATRIKS TABEL BEDAH ANALISIS CP KE TP LENGKAP - Framed */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-7 shadow-md overflow-x-auto relative">
            <div className="mb-4 pb-3 border-b-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-[#0B1528] uppercase tracking-wide">
                  Matriks Analisis CP ke TP — {identitas.mataPelajaran} ({identitas.fase})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {regulasiCpLabel} • Seluruh Elemen Mata Pelajaran
                </p>
              </div>
            </div>

            {/* TABEL RESMI CP */}
            <table className="w-full border-collapse border-2 border-slate-900 text-slate-900 text-xs">
              <thead>
                {/* Row 1 Header Utama */}
                <tr className="bg-[#0B1528] text-white font-extrabold text-center">
                  <th rowSpan={2} className="border border-slate-900 p-3 w-32 align-middle text-xs text-amber-300">
                    Elemen
                  </th>
                  <th className="border border-slate-900 p-2.5 w-64 align-middle text-xs">
                    Capaian Pembelajaran
                  </th>
                  <th className="border border-slate-900 p-2.5 w-36 align-middle text-xs">
                    Kompetensi
                  </th>
                  <th className="border border-slate-900 p-2.5 w-48 align-middle text-xs">
                    Lingkup Materi / Konten
                  </th>
                  <th className="border border-slate-900 p-2.5 align-middle text-xs text-amber-300">
                    Tujuan Pembelajaran (TP)
                  </th>
                  <th
                    colSpan={kelasCols.length}
                    className="border border-slate-900 p-2 text-center align-middle text-xs text-emerald-300"
                  >
                    Penetapan Kelas ({identitas.fase})
                  </th>
                  <th rowSpan={2} className="no-print border border-slate-900 p-2 text-center w-14 align-middle text-xs">
                    Aksi
                  </th>
                </tr>

                {/* Row 2 Sub-header Resmi Penjelasan Kolom */}
                <tr className="bg-slate-100 text-slate-800 text-[10px] text-center">
                  <th className="border border-slate-900 p-1.5 font-normal italic text-slate-700 bg-slate-100">
                    {regulasiCpShort}
                  </th>
                  <th className="border border-slate-900 p-1.5 font-normal italic text-slate-700 bg-slate-100">
                    KKO pada Capaian Pembelajaran
                  </th>
                  <th className="border border-slate-900 p-1.5 font-normal italic text-slate-700 bg-slate-100">
                    Materi Esensial CP
                  </th>
                  <th className="border border-slate-900 p-1.5 font-normal italic text-slate-700 bg-slate-100">
                    Kompetensi + Konten &amp; JP
                  </th>
                  {kelasCols.map((k) => (
                    <th
                      key={`head-sub-${k}`}
                      className="border border-slate-900 p-1.5 font-bold text-slate-900 w-16 min-w-[64px] text-center not-italic text-xs bg-amber-100 whitespace-nowrap"
                    >
                      Kelas {k}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {resolvedRows.map((row, rIdx) => {
                  const rowTPs = row.daftarTP || [];
                  const rowKompetensi = row.daftarKompetensi || [];
                  const rowMateri = row.daftarLingkupMateri || [];

                  if (rowTPs.length === 0) {
                    return (
                      <tr key={row.id || `row-${rIdx}`} className="align-top hover:bg-slate-50/40">
                        <td className="border border-slate-900 p-3 font-bold text-slate-900 text-xs bg-slate-50/30">
                          <div className="space-y-1">
                            <div>{row.elemen}</div>
                            <div className="no-print pt-2">
                              <button
                                type="button"
                                onClick={() => handleAddNewTPForElement(row.elemen, row.capaianPembelajaran)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Tambah TP</span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="border border-slate-900 p-3 text-[11px] leading-relaxed text-justify text-slate-900">
                          {row.capaianPembelajaran}
                        </td>
                        <td className="border border-slate-900 p-3 text-xs">
                          <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                            {rowKompetensi.map((komp, kIdx) => (
                              <li key={kIdx} className="leading-snug">{komp.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                          </ol>
                        </td>
                        <td className="border border-slate-900 p-3 text-xs">
                          <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                            {rowMateri.map((mat, mIdx) => (
                              <li key={mat} className="text-slate-900">{mat.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                          </ol>
                        </td>
                        <td className="border border-slate-900 p-3 text-xs text-slate-400 italic">
                          Belum ada Tujuan Pembelajaran yang dirumuskan
                        </td>
                        {kelasCols.map((k) => (
                          <td key={`empty-${k}`} className="border border-slate-900 p-2 text-center align-middle w-16 min-w-[64px] text-slate-400 font-bold whitespace-nowrap">
                            -
                          </td>
                        ))}
                        <td className="no-print border border-slate-900 p-2 text-center align-middle w-14 text-slate-400">
                          -
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={row.id || `row-${rIdx}`}>
                      {rowTPs.map((tp, tIdx) => {
                        const centang = Array.isArray(tp.kelasCentang)
                          ? tp.kelasCentang
                          : tp.kelasTarget
                          ? [tp.kelasTarget]
                          : [];

                        const tpKomp = tp.kompetensi 
                          ? tp.kompetensi.replace(/^\d+\.\s*/, '')
                          : (rowKompetensi[tIdx] ? rowKompetensi[tIdx].replace(/^\d+\.\s*/, '') : '— s.d.a —');

                        const tpMat = tp.lingkupMateri 
                          ? tp.lingkupMateri.replace(/^\d+\.\s*/, '')
                          : (rowMateri[tIdx] ? rowMateri[tIdx].replace(/^\d+\.\s*/, '') : '— s.d.a —');

                        return (
                          <tr
                            key={tp.id || `tp-${tIdx}`}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            {/* Kolom 1: Elemen */}
                            <td className="border border-slate-900 p-2.5 font-bold text-slate-900 text-xs bg-slate-50/40 align-top">
                              {tIdx === 0 ? (
                                <div className="space-y-1.5 sticky top-2">
                                  <div className="font-extrabold text-[#0B1528] leading-tight">{row.elemen}</div>
                                  <span className="no-print inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                    {rowTPs.length} Butir TP
                                  </span>
                                  <div className="no-print pt-2 border-t border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleAddNewTPForElement(row.elemen, row.capaianPembelajaran)}
                                      className="text-[10px] font-bold text-blue-700 hover:text-blue-950 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-300 transition-colors w-full justify-center"
                                      title="Tambah butir Tujuan Pembelajaran baru untuk elemen ini"
                                    >
                                      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>+ Tambah TP</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 text-xs leading-snug">{row.elemen}</div>
                                  <div className="text-[10px] text-slate-400 italic">(Lanjutan Elemen)</div>
                                </div>
                              )}
                            </td>

                            {/* Kolom 2: Capaian Pembelajaran */}
                            <td className="border border-slate-900 p-2.5 text-[11px] leading-relaxed text-justify text-slate-900 align-top">
                              {tIdx === 0 ? (
                                row.capaianPembelajaran
                              ) : (
                                <div className="text-slate-500 italic text-[10.5px] leading-relaxed text-center py-1.5 bg-slate-50/50 rounded border border-slate-200/60">
                                  — s.d.a —
                                  <div className="text-[9.5px] text-slate-400 font-sans not-italic">
                                    (Capaian Pembelajaran Elemen {row.elemen})
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Kolom 3: Kompetensi */}
                            <td className="border border-slate-900 p-2.5 text-xs align-top">
                              {tIdx === 0 ? (
                                <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                                  {rowKompetensi.map((komp, kIdx) => (
                                    <li key={kIdx} className="leading-snug">
                                      {komp.replace(/^\d+\.\s*/, '')}
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800 leading-snug">
                                    {tpKomp}
                                  </div>
                                  <div className="text-[9.5px] text-slate-400 italic">
                                    (Kompetensi TP {tIdx + 1})
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Kolom 4: Lingkup Materi/Konten */}
                            <td className="border border-slate-900 p-2.5 text-xs align-top">
                              {tIdx === 0 ? (
                                <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                                  {rowMateri.map((mat, mIdx) => (
                                    <li key={mIdx} className="text-slate-900 font-medium">
                                      {mat.replace(/^\d+\.\s*/, '')}
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800 leading-snug">
                                    {tpMat}
                                  </div>
                                  <div className="text-[9.5px] text-slate-400 italic">
                                    (Materi TP {tIdx + 1})
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Kolom 5: Tujuan Pembelajaran (Setiap baris memuat 1 butir TP) */}
                            <td className="border border-slate-900 p-2.5 text-xs align-middle">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-900 font-bold shrink-0 mt-0.5 text-sm leading-none">●</span>
                                <div className="flex-1">
                                  <span className="font-normal text-slate-900 leading-relaxed text-xs">
                                    {formatTPWithCode(tp.kodeTP, tp.rumusanTP)}
                                  </span>
                                  <span className="no-print ml-2 text-[10px] text-blue-700 font-semibold inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    ({tp.alokasiJP || 4} JP)
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Kolom 6+: Centang Kelas per TP - DIJAMIN 100% SEJAJAR DENGAN BUTIR TP KARENA SATU TR */}
                            {kelasCols.map((k) => {
                              const isChecked = centang.includes(k);
                              return (
                                <td
                                  key={`cell-${tp.id || tIdx}-${k}`}
                                  className="border border-slate-900 p-1 text-center align-middle w-16 min-w-[64px] bg-white whitespace-nowrap"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleClassForTP(tp.id, k)}
                                    className={`w-7 h-7 mx-auto flex items-center justify-center font-black text-sm transition-all rounded cursor-pointer border ${
                                      isChecked
                                        ? 'text-slate-950 font-black bg-amber-200 border-amber-400 hover:bg-rose-100 hover:text-rose-700'
                                        : 'text-slate-300 font-bold border-transparent hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                    title={`Kelas ${k}: ${isChecked ? 'Centang (v) - diajarkan di kelas ini' : 'Strep (-) - tidak diajarkan di kelas ini'}. Klik untuk mengubah.`}
                                  >
                                    {isChecked ? 'v' : '-'}
                                  </button>
                                </td>
                              );
                            })}

                            {/* Kolom Aksi */}
                            <td className="no-print border border-slate-900 p-1 text-center align-middle w-14">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(tp)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                  title="Edit Butir TP"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(tp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Hapus TP"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border border-black">
                  <td colSpan={5} className="border border-black p-2 text-right">
                    Total Alokasi Waktu Intrakurikuler:
                  </td>
                  <td colSpan={kelasCols.length + 1} className="border border-black p-2 text-left">
                    <span className="font-bold text-slate-900">{totalJP} JP</span>
                    <span className="ml-2 text-[10px] text-slate-700 font-normal">
                      (Sesuai Regulasi Permendikdasmen No. 13/2025 • 1 JP = 35 Menit)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* LEMBAR RASIONAL, REKOMENDASI TAKSONOMI & PENGESAHAN DOKUMEN ANALISIS CP KE TP */}
            <div className="mt-10 pt-6 border-t-2 border-slate-900 break-before-page print:break-before-page">
              <div className="text-center pb-3 mb-5 border-b-2 border-double border-slate-900">
                <h3 className="font-serif font-bold text-sm md:text-base uppercase tracking-wider text-slate-900">
                  LEMBAR RASIONAL &amp; REKOMENDASI TAKSONOMI BEDAH CP
                </h3>
                <p className="text-xs italic text-slate-600 mt-1">
                  Landasan Pedagogis, Distribusi Dimensi Kognitif (Taksonomi Bloom Revisi), dan Pengesahan Analisis Capaian Pembelajaran
                </p>
              </div>

              {/* Bagian A & B: Grid 2 Kolom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs font-serif">
                {/* Kolom A: Rasional Penurunan CP ke TP */}
                <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-sm border border-slate-300 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                      <span>A. RASIONAL PENURUNAN CP KE TP</span>
                      <span className="text-[10px] font-sans font-normal text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        BSKAP 046/2025
                      </span>
                    </h4>
                    <p className="text-slate-800 leading-relaxed text-justify text-[11px] mt-2">
                      {rasionalData.rasionalText}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-[10.5px] font-sans space-y-0.5 text-slate-700 mt-2">
                    <div><strong>Regulasi Acuan:</strong> Keputusan Kepala BSKAP 046/2025 &amp; Permendikdasmen 13/2025</div>
                    <div><strong>Total Beban Belajar:</strong> {rasionalData.totalTP} Butir TP ({rasionalData.totalJP} JP Intrakurikuler)</div>
                  </div>
                </div>

                {/* Kolom B: Pemetaan Taksonomi Bloom */}
                <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-sm border border-slate-300">
                  <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                    <span>B. PEMETAAN DIMENSI KOGNITIF (BLOOM REVISI)</span>
                    <span className="text-[10px] font-sans font-normal text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Distribusi KKO
                    </span>
                  </h4>
                  <table className="w-full border-collapse border border-slate-400 text-[10.5px] bg-white mt-2">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center text-slate-800">
                        <th className="border border-slate-400 p-1.5">Tingkat Kognitif</th>
                        <th className="border border-slate-400 p-1.5 w-14">Porsi</th>
                        <th className="border border-slate-400 p-1.5">KKO Representatif</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold text-slate-900">C1 - C2 (LOTS / Pemahaman)</td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold text-blue-700">{rasionalData.persentase.lots}%</td>
                        <td className="border border-slate-400 p-1.5 text-slate-700">{rasionalData.ringkasanKKO.lots.slice(0, 4).join(', ') || 'Memahami, Mengidentifikasi'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold text-slate-900">C3 (MOTS / Penerapan)</td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold text-emerald-700">{rasionalData.persentase.mots}%</td>
                        <td className="border border-slate-400 p-1.5 text-slate-700">{rasionalData.ringkasanKKO.mots.slice(0, 4).join(', ') || 'Mempraktikkan, Mengelompokkan'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-1.5 font-semibold text-slate-900">C4 - C6 (HOTS / Penalaran)</td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold text-purple-700">{rasionalData.persentase.hots}%</td>
                        <td className="border border-slate-400 p-1.5 text-slate-700">{rasionalData.ringkasanKKO.hots.slice(0, 4).join(', ') || 'Menganalisis, Merancang'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    *Keseimbangan taksonomi mendukung pembelajaran bertahap dari pemahaman konkret hingga nalar kritis tingkat tinggi.
                  </p>
                </div>
              </div>

              {/* POIN C REKOMENDASI PEDAGOGIS & TANDA TANGAN: WAJIB DAN HARUS 1 HALAMAN TIDAK TERPISAH */}
              <div className="break-inside-avoid print:break-inside-avoid page-break-inside-avoid space-y-6 pt-1">
                <div className="bg-slate-50/70 p-3.5 rounded-sm border border-slate-300 font-serif">
                  <h4 className="font-bold text-xs text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
                    C. REKOMENDASI PEDAGOGIS PELAKSANAAN PEMBELAJARAN
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-800 leading-relaxed">
                    {rasionalData.rekomendasiList.map((rek, idx) => (
                      <li key={idx}>{rek}</li>
                    ))}
                  </ol>
                </div>

                {/* Official Signature Area */}
                <div className="pt-2">
                  {onUpdateIdentitas && (
                    <div className="no-print mb-4 flex items-center justify-end gap-2 text-xs font-sans">
                      <span className="text-slate-600 font-medium">Jabatan Penandatangan:</span>
                      <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-md">
                        <button
                          type="button"
                          onClick={() => onUpdateIdentitas({ ...identitas, peranGuru: 'Guru Kelas' })}
                          className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                            (identitas.peranGuru || 'Guru Kelas') === 'Guru Kelas'
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Klik untuk memilih Guru Kelas"
                        >
                          Guru Kelas
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateIdentitas({ ...identitas, peranGuru: 'Guru Mata Pelajaran' })}
                          className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                            (identitas.peranGuru || 'Guru Kelas') === 'Guru Mata Pelajaran'
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

                  <table className="w-full border-collapse border-none text-xs font-serif text-slate-900">
                    <tbody>
                      {/* Baris 1: Mengetahui & Tempat/Tanggal */}
                      <tr>
                        <td className="w-1/2 border-none p-0 align-top">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p>Mengetahui,</p>
                          </div>
                        </td>
                        <td className="w-1/2 border-none p-0 align-top">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p>
                              {identitas.tempatPenetapan || 'Fatubai'},{' '}
                              {identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', {
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
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="font-bold">Kepala Sekolah</p>
                          </div>
                        </td>
                        <td className="w-1/2 border-none p-0 align-top pt-1">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="font-bold">{identitas.peranGuru || 'Guru Kelas'}</p>
                          </div>
                        </td>
                      </tr>

                      {/* Baris 3: Ruang Tanda Tangan & Nama Lengkap */}
                      <tr>
                        <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="font-bold underline break-words inline-block">
                              {identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.'}
                            </p>
                          </div>
                        </td>
                        <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="font-bold underline break-words inline-block">
                              {identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}
                            </p>
                          </div>
                        </td>
                      </tr>

                      {/* Baris 4: NIP Kepala Sekolah & NIP Guru */}
                      <tr>
                        <td className="w-1/2 border-none p-0 align-top">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="text-[11px] font-sans text-slate-600">
                              NIP. {identitas.nipKepalaSekolah || '196709192008011008'}
                            </p>
                          </div>
                        </td>
                        <td className="w-1/2 border-none p-0 align-top">
                          <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                            <p className="text-[11px] font-sans text-slate-600">
                              NIP. {identitas.nipGuru || '198603012020121005'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {onOpenEditIdentity && (
              <div className="mt-6 pt-3 border-t border-dashed border-slate-200 flex justify-center no-print">
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ubah Data Tanda Tangan (Kepala Sekolah &amp; Guru)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODE EDIT DETAIL SETIAP BUTIR TP */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              Daftar Rincian {tpList.length} Butir Tujuan Pembelajaran ({resolvedRows.length} Elemen)
            </span>
            <button
              type="button"
              onClick={() => handleAddNewTPForElement(resolvedRows[0]?.elemen || elemen, capaianPembelajaran)}
              className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Butir TP Baru</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {tpList.map((tp, index) => {
              const isEditing = editingId === tp.id;

              return (
                <div
                  key={tp.id}
                  className={`bg-white rounded-lg border p-4 transition-all ${
                    isEditing ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                            Edit TP #{index + 1}
                          </span>
                          <span className="font-bold text-slate-700">{editForm.elemen}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(tp.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Rumusan Tujuan Pembelajaran (TP):
                          </label>
                          <textarea
                            rows={3}
                            value={editForm.rumusanTP || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, rumusanTP: e.target.value })
                            }
                            className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Indikator / Kriteria Ketercapaian (IKTP):
                          </label>
                          <textarea
                            rows={3}
                            value={editForm.indikatorKetercapaian || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, indikatorKetercapaian: e.target.value })
                            }
                            className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kompetensi:
                          </label>
                          <input
                            type="text"
                            value={editForm.kompetensi || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, kompetensi: e.target.value })
                            }
                            className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Lingkup Materi / Konten:
                          </label>
                          <input
                            type="text"
                            value={editForm.lingkupMateri || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, lingkupMateri: e.target.value })
                            }
                            className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Alokasi Jam Pelajaran (JP):
                          </label>
                          <input
                            type="number"
                            value={editForm.alokasiJP || 4}
                            onChange={(e) =>
                              setEditForm({ ...editForm, alokasiJP: Number(e.target.value) || 2 })
                            }
                            className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Target Kelas:
                          </label>
                          <div className="flex items-center gap-2 pt-1">
                            {kelasCols.map((k) => (
                              <label key={k} className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    Array.isArray(editForm.kelasCentang)
                                      ? editForm.kelasCentang.includes(k)
                                      : editForm.kelasTarget === k
                                  }
                                  onChange={() => {
                                    const current = Array.isArray(editForm.kelasCentang)
                                      ? [...editForm.kelasCentang]
                                      : editForm.kelasTarget
                                      ? [editForm.kelasTarget]
                                      : [];
                                    const next = current.includes(k)
                                      ? current.filter((c) => c !== k)
                                      : [...current, k];
                                    setEditForm({
                                      ...editForm,
                                      kelasCentang: next,
                                      kelasTarget: next[0] || k,
                                    });
                                  }}
                                  className="rounded text-blue-600"
                                />
                                <span>Kelas {k}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                            TP #{index + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[10px]">
                            {tp.elemen}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold text-[10px]">
                            Kelas{' '}
                            {Array.isArray(tp.kelasCentang) && tp.kelasCentang.length > 0
                              ? tp.kelasCentang.join(', ')
                              : tp.kelasTarget || kelasCols[0]}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                            {tp.alokasiJP || 4} JP
                          </span>
                        </div>

                        <p className="font-bold text-slate-900 leading-relaxed text-xs">
                          {formatTPWithCode(tp.kodeTP, tp.rumusanTP)}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-700">Kompetensi: </span>
                            <span>{tp.kompetensi}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">Materi: </span>
                            <span>{tp.lingkupMateri}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(tp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={identitas}
        exportType={exportType}
        documentTitle={`Bedah CP: ${identitas.mataPelajaran}`}
        onUpdateIdentitas={onUpdateIdentitas}
        onConfirm={handleExportConfirm}
        availableClasses={kelasCols}
        itemCountsByClass={countItemsByClass(tpList, identitas.fase)}
        defaultOrientation="landscape"
      />

      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleDownloadPDF}
        documentTitle={`Bedah CP & TP: ${identitas.mataPelajaran}`}
      />
    </div>
  );
};
