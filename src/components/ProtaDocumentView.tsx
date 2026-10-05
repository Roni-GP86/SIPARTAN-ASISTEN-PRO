import React, { useState, useMemo } from 'react';
import {
  ProtaDocument,
  ProtaItem,
  SchoolIdentity,
  TPItem,
  ATPDocument,
  PDFLayoutOptions,
} from '../types';
import {
  FileDown,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Layers,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import {
  exportProtaToWord,
  exportProtaToPDF,
  exportProtaToExcel,
} from '../utils/exportUtils';
import { calibrateTPAllocationJP } from '../data/permendikdasmen13Data';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { ExportConfirmModal } from './ExportConfirmModal';
import { KaldikTTUModal } from './KaldikTTUModal';
import { getClassesForFase, doesItemMatchClass } from '../utils/classFilterUtils';
import { filterProtaDocumentByClass } from '../utils/protaPromesGenerator';
import { KALDIK_TTU_METADATA } from '../data/kaldikTTUData';

interface ProtaDocumentViewProps {
  protaData: ProtaDocument;
  onUpdateProta?: (updated: ProtaDocument) => void;
  onSaveToArchive?: () => void;
  isSaved?: boolean;
  tpList?: TPItem[];
  atpDocument?: ATPDocument | null;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onProceedToPromes?: () => void;
}

export const ProtaDocumentView: React.FC<ProtaDocumentViewProps> = ({
  protaData,
  onUpdateProta,
  onSaveToArchive,
  isSaved = false,
  tpList,
  atpDocument,
  onOpenEditIdentity,
  onUpdateIdentitas,
  onProceedToPromes,
}) => {
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isKaldikModalOpen, setIsKaldikModalOpen] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF' | 'EXCEL'>('WORD');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'sem1' | 'sem2' | 'rekap'>('sem1');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const isAgama =
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('agama') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('katolik') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('kristen') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('islam') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('hindu') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('buddha') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('khonghucu') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('pak') ||
    (protaData?.identitas?.mataPelajaran || '').toLowerCase().includes('pai');
  const regCpLabel = isAgama ? 'Regulasi Standar Capaian Pembelajaran BKP No. 020/2026' : 'Keputusan Kepala BSKAP No. 046 Tahun 2025';
  const regCpShort = isAgama ? 'BKP 020/2026' : 'BSKAP No. 046/2025';

  // Available classes for current Fase
  const availableClasses = useMemo(() => {
    return getClassesForFase(protaData.identitas.fase);
  }, [protaData.identitas.fase]);

  // Recompute or filter Prota based on selected class
  const effectiveProta = useMemo(() => {
    if (selectedClassFilter === 'all') return protaData;
    return filterProtaDocumentByClass(protaData, selectedClassFilter, tpList, atpDocument);
  }, [protaData, selectedClassFilter, tpList, atpDocument]);

  const allProtaItems = useMemo(() => {
    return [...protaData.itemsSemester1, ...protaData.itemsSemester2];
  }, [protaData]);

  // Counts of TPs per class
  const itemCountsByClass = useMemo(() => {
    const counts: { all: number; [cls: string]: number } = { all: allProtaItems.length };
    availableClasses.forEach((cls) => {
      counts[cls] = allProtaItems.filter((it, idx) =>
        doesItemMatchClass(it, cls, protaData.identitas.fase, idx, allProtaItems.length)
      ).length;
    });
    return counts;
  }, [allProtaItems, availableClasses, protaData.identitas.fase]);

  const id = effectiveProta.identitas;
  const targetJP = effectiveProta.totalJPTahun;
  const currentTotalJP = effectiveProta.totalJPTahunAkumulasi;
  const isAlignedWithRegulasi = currentTotalJP === targetJP;

  const handleOpenWordExport = () => {
    if (isWordExportDisabled()) {
      setIsWordBlockedModalOpen(true);
      return;
    }
    setExportType('WORD');
    setIsExportModalOpen(true);
  };

  const handleOpenPDFExport = () => {
    setExportType('PDF');
    setIsExportModalOpen(true);
  };

  const handleOpenExcelExport = () => {
    setExportType('EXCEL');
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = (
    tempat: string,
    tanggal: string,
    chosenClass?: string,
    layoutOptions?: PDFLayoutOptions,
    tahunPelajaran?: string
  ) => {
    const finalClass = chosenClass || selectedClassFilter || 'all';
    const resolvedTP = tahunPelajaran || effectiveProta.identitas.tahunPelajaran || '2026/2027';
    const protaToExport = filterProtaDocumentByClass(
      {
        ...effectiveProta,
        identitas: {
          ...effectiveProta.identitas,
          tempatPenetapan: tempat,
          tanggalPenetapan: tanggal,
          tahunPelajaran: resolvedTP,
        },
      },
      finalClass,
      tpList,
      atpDocument
    );
    protaToExport.identitas.tempatPenetapan = tempat;
    protaToExport.identitas.tanggalPenetapan = tanggal;
    protaToExport.identitas.tahunPelajaran = resolvedTP;

    if (onUpdateIdentitas) {
      onUpdateIdentitas(protaToExport.identitas);
    }

    if (exportType === 'WORD') {
      exportProtaToWord(protaToExport);
    } else if (exportType === 'PDF') {
      exportProtaToPDF(protaToExport, layoutOptions);
    } else {
      exportProtaToExcel(protaToExport);
    }
    setIsExportModalOpen(false);
  };

  const handleUpdateItemJP = (semester: '1' | '2', itemId: string, newJP: number) => {
    if (!onUpdateProta) return;
    const itemsKey = semester === '1' ? 'itemsSemester1' : 'itemsSemester2';
    const summaryKey = semester === '1' ? 'summarySemester1' : 'summarySemester2';

    const updatedItems = effectiveProta[itemsKey].map((it) => {
      if (it.id === itemId) {
        return { ...it, alokasiJP: Math.max(1, newJP) };
      }
      return it;
    });

    const newSubtotal = updatedItems.reduce((acc, it) => acc + it.alokasiJP, 0);
    const updatedSummary = {
      ...effectiveProta[summaryKey],
      totalJPSemester: newSubtotal,
      jpTatapMuka: Math.max(0, newSubtotal - 6),
    };

    const newTotalTahunan =
      semester === '1'
        ? newSubtotal + effectiveProta.summarySemester2.totalJPSemester
        : effectiveProta.summarySemester1.totalJPSemester + newSubtotal;

    onUpdateProta({
      ...effectiveProta,
      [itemsKey]: updatedItems,
      [summaryKey]: updatedSummary,
      totalJPTahunAkumulasi: newTotalTahunan,
    });
  };

  const handleAutoCalibrate = () => {
    if (!onUpdateProta) return;
    const items1 = effectiveProta.itemsSemester1.map((it) => ({ ...it }));
    const items2 = effectiveProta.itemsSemester2.map((it) => ({ ...it }));

    const targetSem1 = Math.round(targetJP / 2);
    const targetSem2 = targetJP - targetSem1;

    calibrateTPAllocationJP(items1, targetSem1);
    calibrateTPAllocationJP(items2, targetSem2);

    const subtotal1 = items1.reduce((acc, it) => acc + it.alokasiJP, 0);
    const subtotal2 = items2.reduce((acc, it) => acc + it.alokasiJP, 0);

    onUpdateProta({
      ...effectiveProta,
      itemsSemester1: items1,
      itemsSemester2: items2,
      summarySemester1: {
        ...effectiveProta.summarySemester1,
        totalJPSemester: subtotal1,
        jpTatapMuka: Math.max(0, subtotal1 - 6),
      },
      summarySemester2: {
        ...effectiveProta.summarySemester2,
        totalJPSemester: subtotal2,
        jpTatapMuka: Math.max(0, subtotal2 - 6),
      },
      totalJPTahunAkumulasi: subtotal1 + subtotal2,
    });
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header Actions & Title Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Calendar className="w-3.5 h-3.5" />
                Program Tahunan (PROTA)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Permendikdasmen No. 13 Tahun 2025
              </span>
              {isSaved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Tersimpan di Arsip
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Program Tahunan (PROTA) - {id.mataPelajaran}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Fase {id.fase} • Kelas {id.kelas} • TP {id.tahunPelajaran || '2025/2026'} • {id.namaSatuanPendidikan || 'SD Negeri Fatubai'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSaveToArchive && (
              <button
                id="btn-save-prota"
                onClick={onSaveToArchive}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan ke Arsip
              </button>
            )}

            <button
              id="btn-export-prota-word"
              onClick={handleOpenWordExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Unduh format Microsoft Word (.doc) dengan opsi pilihan kelas"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              Word (.doc)
            </button>

            <button
              id="btn-export-prota-pdf"
              onClick={handleOpenPDFExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="Cetak atau unduh dokumen PDF resmi dengan opsi pilihan kelas"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              PDF Resmi
            </button>

            <button
              id="btn-export-prota-excel"
              onClick={handleOpenExcelExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
              title="Unduh data tabel ke format CSV / Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Excel / CSV
            </button>

            <button
              id="btn-open-kaldik-prota"
              type="button"
              onClick={() => setIsKaldikModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
              title="Lihat Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran 2026/2027 (SK No. 400.3/36/2026)"
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Kaldik TTU 2026/2027</span>
            </button>
          </div>
        </div>

        {/* Status Validasi Alokasi Waktu Regulasi Permendikdasmen No. 13 Tahun 2025 */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Target Regulasi Permen 13/2025</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-slate-900">{targetJP} JP</span>
              <span className="text-xs text-slate-500">/ Tahun</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block font-mono">
              {effectiveProta.alokasiRegulasi.jpMingguIntra} JP / Minggu
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Total Akumulasi Terencana</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-lg font-bold ${isAlignedWithRegulasi ? 'text-emerald-700' : 'text-amber-700'}`}>
                {currentTotalJP} JP
              </span>
              <span className="text-xs text-slate-500">/ Tahun</span>
            </div>
            <span className={`text-[11px] font-semibold mt-0.5 block ${isAlignedWithRegulasi ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isAlignedWithRegulasi ? '✓ Tepat 100% Sesuai Regulasi' : `Selisih: ${Math.abs(currentTotalJP - targetJP)} JP`}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Alokasi Kokurikuler (P5)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-indigo-700">{effectiveProta.alokasiRegulasi.jpTahunKoku || 36} JP</span>
              <span className="text-xs text-slate-500">/ Tahun</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Dialokasikan terpisah (Modular)
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium block">Kalibrasi Otomatis</span>
            {!isAlignedWithRegulasi ? (
              <button
                type="button"
                onClick={handleAutoCalibrate}
                className="mt-1 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Seimbangkan JP (13/2025)
              </button>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Struktur Alokasi Valid
              </div>
            )}
            <span className="text-[10px] text-slate-500 mt-1">
              {regCpShort}
            </span>
          </div>
        </div>

        {/* Banner Kalender Pendidikan TTU 2026/2027 */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-indigo-50/40 to-slate-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-800 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-950">Pedoman Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-200/70 text-amber-950 border border-amber-300">
                  SK No. {KALDIK_TTU_METADATA.nomorSK}
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Total <strong>{KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah} Hari Efektif Sekolah</strong> ({KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah} Hari Semester 1 • {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah} Hari Semester 2 • 36 Minggu Efektif Intrakurikuler).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsKaldikModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Rincian Kaldik &amp; Agenda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Class Filter Bar - Pilihan Dokumen Per Kelas / Semua Kelas */}
      {availableClasses.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pl-1 pr-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Pilihan Lingkup Kelas:
            </span>
            <button
              type="button"
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedClassFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>Semua Kelas ({protaData.identitas.fase})</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedClassFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {allProtaItems.length} TP
              </span>
            </button>
            {availableClasses.map((cls) => {
              const isSelected = selectedClassFilter === cls;
              const count = itemCountsByClass[cls] || 0;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>Kelas {cls}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {count} TP
                  </span>
                </button>
              );
            })}
          </div>

          {selectedClassFilter !== 'all' && (
            <div className="text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Menampilkan PROTA khusus <strong>Kelas {selectedClassFilter}</strong> ({effectiveProta.totalJPTahun} JP/Tahun - Permendikdasmen 13/2025)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation: Semester 1, Semester 2, Rekapitulasi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sem1')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'sem1'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semester 1 (Ganjil) - {effectiveProta.summarySemester1.totalJPSemester} JP
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sem2')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'sem2'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semester 2 (Genap) - {effectiveProta.summarySemester2.totalJPSemester} JP
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rekap')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'rekap'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Rekapitulasi &amp; Validasi
        </button>
      </div>

      {/* Konten Tab Semester 1 & 2 */}
      {(activeTab === 'sem1' || activeTab === 'sem2') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'sem1' ? 'Distribusi Alokasi Waktu - Semester 1 (Ganjil)' : 'Distribusi Alokasi Waktu - Semester 2 (Genap)'}
              </h2>
              <p className="text-xs text-slate-600">
                {activeTab === 'sem1'
                  ? `${effectiveProta.summarySemester1.jumlahMingguEfektif} Minggu Efektif • ${effectiveProta.itemsSemester1.length} Tujuan Pembelajaran`
                  : `${effectiveProta.summarySemester2.jumlahMingguEfektif} Minggu Efektif • ${effectiveProta.itemsSemester2.length} Tujuan Pembelajaran`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                Subtotal: {activeTab === 'sem1' ? effectiveProta.summarySemester1.totalJPSemester : effectiveProta.summarySemester2.totalJPSemester} JP
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-24">Kode TP</th>
                  <th className="py-3 px-3 w-40">Elemen</th>
                  <th className="py-3 px-4">Tujuan Pembelajaran (TP)</th>
                  <th className="py-3 px-4 w-48">Lingkup Materi</th>
                  <th className="py-3 px-3 w-28 text-center">Alokasi JP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(activeTab === 'sem1' ? effectiveProta.itemsSemester1 : effectiveProta.itemsSemester2).map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center text-xs font-semibold text-slate-500">
                      {item.nomor || idx + 1}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono font-bold text-indigo-700">
                      {item.kodeTP}
                    </td>
                    <td className="py-3 px-3 text-xs font-medium text-slate-700">
                      {item.elemen}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-900 leading-relaxed">
                      {item.tujuanPembelajaran}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {item.lingkupMateri}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {editingItemId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="36"
                            value={item.alokasiJP}
                            onChange={(e) =>
                              handleUpdateItemJP(
                                activeTab === 'sem1' ? '1' : '2',
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-14 text-center text-xs font-bold py-1 px-1 border border-indigo-400 rounded focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="p-1 text-emerald-600 hover:text-emerald-800"
                            title="Selesai"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingItemId(item.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          title="Klik untuk mengubah alokasi JP"
                        >
                          {item.alokasiJP} JP
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Konten Tab Rekapitulasi & Lembar Pengesahan */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Rekapitulasi Total Program Tahunan &amp; Validasi Regulasi
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Komponen Alokasi Waktu</th>
                    <th className="py-2.5 px-4 text-center w-36">Alokasi Waktu</th>
                    <th className="py-2.5 px-4 text-left w-64">Keterangan Regulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      Total Jam Intrakurikuler Semester 1 (Ganjil)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {effectiveProta.summarySemester1.totalJPSemester} JP
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {effectiveProta.summarySemester1.jumlahMingguEfektif} Minggu Efektif
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      Total Jam Intrakurikuler Semester 2 (Genap)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {effectiveProta.summarySemester2.totalJPSemester} JP
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {effectiveProta.summarySemester2.jumlahMingguEfektif} Minggu Efektif
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                    <td className="py-3 px-4">
                      Total Alokasi Waktu Intrakurikuler 1 Tahun Pelajaran
                    </td>
                    <td className="py-3 px-4 text-center text-base text-emerald-700">
                      {effectiveProta.totalJPTahunAkumulasi} JP
                    </td>
                    <td className="py-3 px-4 text-xs text-emerald-800 font-semibold">
                      Sesuai Permendikdasmen No. 13 Tahun 2025 ({effectiveProta.alokasiRegulasi.jpMingguIntra} JP/Minggu)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-700">
                      Projek Penguatan Profil Pelajar Pancasila (P5) / Kokurikuler
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {effectiveProta.alokasiRegulasi.jpTahunKoku || 36} JP
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Dialokasikan sistem blok/modular terpisah
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Keterangan Singkat & Lembar Pengesahan (WAJIB 1 Halaman saat dicetak / PDF) */}
      <div
        className="page-avoid-break print:break-inside-avoid print:page-break-inside-avoid mt-6 space-y-4"
        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
      >
        {/* Keterangan & Catatan Pelaksanaan PROTA */}
        <div className="bg-slate-50 rounded-xl border border-slate-300 p-5 text-xs text-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-200">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Keterangan &amp; Catatan Pelaksanaan Program Tahunan (PROTA)</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 leading-relaxed pt-1">
            <li>
              <strong>Dasar Regulasi:</strong> Alokasi jam pelajaran (JP) intrakurikuler berpedoman baku pada{' '}
              <strong>Permendikdasmen No. 13 Tahun 2025</strong> dan Capaian Pembelajaran (CP) berdasarkan{' '}
              <strong>{regCpLabel}</strong>.
            </li>
            <li>
              <strong>Sinkronisasi Kalender Pendidikan:</strong> Berpedoman pada{' '}
              <strong>Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027 (SK Kadis Dikbud No. {KALDIK_TTU_METADATA.nomorSK})</strong> dengan total{' '}
              <strong>{KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah} Hari Efektif Sekolah</strong> ({KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah} Hari Semester 1 &amp; {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah} Hari Semester 2 / 36-44 Pekan).
            </li>
            <li>
              <strong>Fleksibilitas Pelaksanaan:</strong> Alokasi JP per Tujuan Pembelajaran (TP) dan alur per semester bersifat fleksibel, dapat disesuaikan dengan asesmen diagnostik awal peserta didik serta dinamika satuan pendidikan.
            </li>
            <li>
              <strong>Ketuntasan Belajar:</strong> Ketercapaian kompetensi diukur berdasarkan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis pendekatan rubrik/interval nilai, bukan nilai KKM tunggal.
            </li>
            <li>
              <strong>Alokasi Kokurikuler:</strong> Jam Projek Penguatan Profil Pelajar Pancasila (P5) dialokasikan tersendiri sebesar{' '}
              <strong>{effectiveProta.alokasiRegulasi.jpTahunKoku || 36} JP/tahun</strong> di luar alokasi intrakurikuler di atas.
            </li>
          </ul>
        </div>

        {/* Lembar Pengesahan Tanda Tangan Resmi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            Lembar Pengesahan Program Tahunan (PROTA)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">
                Kepala Sekolah
              </p>
              <div className="h-20" />
              <p className="font-black text-slate-950 underline">
                {id.namaKepalaSekolah || '...........................................'}
              </p>
              <p className="text-xs text-slate-600">
                NIP. {id.nipKepalaSekolah ? id.nipKepalaSekolah : '...........................................'}
              </p>
            </div>

            <div className="space-y-1 md:text-right">
              <p className="font-medium text-slate-600">
                {id.tempatPenetapan || id.kabupaten || '...................'},{' '}
                {id.tanggalPenetapan ||
                  new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </p>
              <p className="font-bold text-slate-900">{id.peranGuru || 'Guru Kelas'}</p>
              <div className="h-20" />
              <p className="font-black text-slate-950 underline">
                {id.namaGuru || '...........................................'}
              </p>
              <p className="text-xs text-slate-600">
                NIP. {id.nipGuru ? id.nipGuru : '...........................................'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialogs */}
      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleOpenPDFExport}
        documentTitle="Program Tahunan (Prota)"
      />

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={effectiveProta.identitas}
        exportType={exportType}
        documentTitle={`Program Tahunan (PROTA) ${selectedClassFilter !== 'all' ? `Kelas ${selectedClassFilter}` : effectiveProta.identitas.fase}`}
        availableClasses={availableClasses}
        defaultSelectedKelas={selectedClassFilter}
        itemCountsByClass={itemCountsByClass}
        onConfirm={handleExportConfirm}
        onUpdateIdentitas={onUpdateIdentitas}
        defaultOrientation="portrait"
      />

      <KaldikTTUModal
        isOpen={isKaldikModalOpen}
        onClose={() => setIsKaldikModalOpen(false)}
      />
    </div>
  );
};
