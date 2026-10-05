import React, { useState, useMemo } from 'react';
import {
  PromesDocument,
  PromesSemesterData,
  PromesRowItem,
  SchoolIdentity,
  TPItem,
  ATPDocument,
  PDFLayoutOptions,
} from '../types';
import {
  Calendar,
  FileDown,
  FileText,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  exportPromesToWord,
  exportPromesToPDF,
  exportPromesToExcel,
} from '../utils/exportUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { ExportConfirmModal } from './ExportConfirmModal';
import { KaldikTTUModal } from './KaldikTTUModal';
import { getClassesForFase, doesItemMatchClass } from '../utils/classFilterUtils';
import { filterPromesDocumentByClass } from '../utils/protaPromesGenerator';
import { KALDIK_TTU_METADATA } from '../data/kaldikTTUData';

interface PromesDocumentViewProps {
  promesData: PromesDocument;
  onUpdatePromes?: (updated: PromesDocument) => void;
  onSaveToArchive?: () => void;
  isSaved?: boolean;
  tpList?: TPItem[];
  atpDocument?: ATPDocument | null;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
}

export const PromesDocumentView: React.FC<PromesDocumentViewProps> = ({
  promesData,
  onUpdatePromes,
  onSaveToArchive,
  isSaved = false,
  tpList,
  atpDocument,
  onOpenEditIdentity,
  onUpdateIdentitas,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>('1');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isKaldikModalOpen, setIsKaldikModalOpen] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF' | 'EXCEL'>('WORD');

  // Available classes for current Fase
  const availableClasses = useMemo(() => {
    return getClassesForFase(promesData.identitas.fase);
  }, [promesData.identitas.fase]);

  // Recompute or filter Promes based on selected class
  const effectivePromes = useMemo(() => {
    if (selectedClassFilter === 'all') return promesData;
    return filterPromesDocumentByClass(promesData, selectedClassFilter, tpList, atpDocument);
  }, [promesData, selectedClassFilter, tpList, atpDocument]);

  const allPromesRows = useMemo(() => {
    return [...promesData.semester1.rows, ...promesData.semester2.rows];
  }, [promesData]);

  // Counts of TPs per class
  const itemCountsByClass = useMemo(() => {
    const counts: { all: number; [cls: string]: number } = { all: allPromesRows.length };
    availableClasses.forEach((cls) => {
      counts[cls] = allPromesRows.filter((it, idx) =>
        doesItemMatchClass(it, cls, promesData.identitas.fase, idx, allPromesRows.length)
      ).length;
    });
    return counts;
  }, [allPromesRows, availableClasses, promesData.identitas.fase]);

  const id = effectivePromes.identitas;
  const currentSemesterData: PromesSemesterData =
    selectedSemester === '1' ? effectivePromes.semester1 : effectivePromes.semester2;

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
    const resolvedTP = tahunPelajaran || effectivePromes.identitas.tahunPelajaran || '2026/2027';
    const promesToExport = filterPromesDocumentByClass(
      {
        ...effectivePromes,
        identitas: {
          ...effectivePromes.identitas,
          tempatPenetapan: tempat,
          tanggalPenetapan: tanggal,
          tahunPelajaran: resolvedTP,
        },
      },
      finalClass,
      tpList,
      atpDocument
    );
    promesToExport.identitas.tempatPenetapan = tempat;
    promesToExport.identitas.tanggalPenetapan = tanggal;
    promesToExport.identitas.tahunPelajaran = resolvedTP;

    if (onUpdateIdentitas) {
      onUpdateIdentitas(promesToExport.identitas);
    }

    if (exportType === 'WORD') {
      exportPromesToWord(promesToExport, selectedSemester);
    } else if (exportType === 'PDF') {
      exportPromesToPDF(promesToExport, selectedSemester, layoutOptions);
    } else {
      exportPromesToExcel(promesToExport, selectedSemester);
    }
    setIsExportModalOpen(false);
  };

  const handleCellChange = (rowId: string, bulan: string, mingguKe: number, value: string) => {
    if (!onUpdatePromes) return;

    const key = `${bulan}_${mingguKe}`;
    const semKey = selectedSemester === '1' ? 'semester1' : 'semester2';

    const updatedRows = currentSemesterData.rows.map((r) => {
      if (r.id === rowId) {
        const numVal = parseInt(value) || 0;
        const newDistribusi = { ...r.distribusiMingguan };
        if (numVal > 0) {
          newDistribusi[key] = numVal;
        } else {
          delete newDistribusi[key];
        }
        return { ...r, distribusiMingguan: newDistribusi };
      }
      return r;
    });

    onUpdatePromes({
      ...effectivePromes,
      [semKey]: {
        ...currentSemesterData,
        rows: updatedRows,
      },
    });
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Calendar className="w-3.5 h-3.5" />
                Program Semester (PROMES)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Standar Kurikulum Merdeka 2025
              </span>
              {isSaved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Tersimpan di Arsip
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Program Semester (PROMES) - {id.mataPelajaran}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Fase {id.fase} • Kelas {id.kelas} • TP {id.tahunPelajaran || '2025/2026'} • {id.namaSatuanPendidikan || 'SD Negeri Fatubai'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSaveToArchive && (
              <button
                id="btn-save-promes"
                onClick={onSaveToArchive}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan ke Arsip
              </button>
            )}

            <button
              id="btn-export-promes-word"
              onClick={handleOpenWordExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Unduh format Microsoft Word (.doc) dengan opsi pilihan kelas"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              Word (.doc)
            </button>

            <button
              id="btn-export-promes-pdf"
              onClick={handleOpenPDFExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="Cetak atau unduh dokumen PDF resmi landscape dengan opsi pilihan kelas"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              PDF Resmi
            </button>

            <button
              id="btn-export-promes-excel"
              onClick={handleOpenExcelExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
              title="Unduh data tabel ke format CSV / Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Excel / CSV
            </button>

            <button
              id="btn-open-kaldik-promes"
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

        {/* Ringkasan Beban & Minggu Efektif */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Alokasi Beban Tatap Muka</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-slate-900">{effectivePromes.jpMinggu} JP</span>
              <span className="text-xs text-slate-500">/ Minggu</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Permendikdasmen No. 13 Tahun 2025
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Total JP Semester {selectedSemester}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-indigo-700">{currentSemesterData.summary.totalJP} JP</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Tatap Muka &amp; Cadangan/Asesmen
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Minggu Efektif Belajar</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-emerald-700">{currentSemesterData.summary.totalMingguEfektif} Minggu</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              Dari 24 minggu kalender semester
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Non-Efektif &amp; Libur</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-slate-700">{currentSemesterData.summary.totalMingguNonEfektif} Minggu</span>
            </div>
            <span className="text-[11px] text-slate-600 mt-0.5 block">
              STS, SAS/SAT, Libur Semester
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
                <span className="font-black text-amber-950">Disinkronkan dengan Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-200/70 text-amber-950 border border-amber-300">
                  SK No. {KALDIK_TTU_METADATA.nomorSK}
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Semester {selectedSemester === '1' ? '1 (Ganjil): 105 Hari Efektif Sekolah' : '2 (Genap): 108 Hari Efektif Sekolah'} (Total Tahunan: {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah} Hari Efektif • 36 Minggu Efektif Intrakurikuler).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsKaldikModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Rincian Kaldik &amp; Agenda</span>
            <ChevronRight className="w-3.5 h-3.5" />
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
              <span>Semua Kelas ({promesData.identitas.fase})</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedClassFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {allPromesRows.length} TP
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
                Menampilkan PROMES khusus <strong>Kelas {selectedClassFilter}</strong> ({effectivePromes.jpMinggu} JP/Minggu - Permendikdasmen 13/2025)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pilihan Semester */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSemester('1')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedSemester === '1'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <span>Semester 1 (Ganjil)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
              Juli - Des
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSemester('2')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedSemester === '2'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <span>Semester 2 (Genap)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
              Jan - Juni
            </span>
          </button>
        </div>

        {/* Legend / Keterangan Warna */}
        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800">Keterangan Khusus:</span>
          {currentSemesterData.kegiatanAgendaKhusus.map((ag) => (
            <span
              key={ag.kode}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${ag.warnaBadge}`}
              title={`${ag.namaKegiatan} (${ag.bulan} M-${ag.mingguKe})`}
            >
              {ag.kode}: {ag.namaKegiatan}
            </span>
          ))}
        </div>
      </div>

      {/* Matriks Distribusi Mingguan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">
              Matriks Distribusi Pekanan - {currentSemesterData.semesterLabel}
            </span>
          </div>
          <span className="text-xs text-slate-500 italic">
            Klik pada angka dalam sel untuk mengubah jam distribusi per minggu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Header Baris 1: Bulan */}
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                <th rowSpan={2} className="p-2.5 w-10 text-center border-r border-slate-200">No</th>
                <th rowSpan={2} className="p-2.5 w-20 text-center border-r border-slate-200">Kode TP</th>
                <th rowSpan={2} className="p-2.5 min-w-[240px] border-r border-slate-200">Tujuan Pembelajaran (TP)</th>
                <th rowSpan={2} className="p-2.5 min-w-[160px] border-r border-slate-200">Lingkup Materi</th>
                <th rowSpan={2} className="p-2.5 w-12 text-center border-r border-slate-200">JP</th>
                {currentSemesterData.bulanList.map((b) => (
                  <th
                    key={b.namaBulan}
                    colSpan={b.weeks.length}
                    className="p-2 text-center border-r border-slate-200 uppercase tracking-wide bg-slate-200/70"
                  >
                    {b.namaBulan}
                  </th>
                ))}
              </tr>

              {/* Header Baris 2: Minggu Ke */}
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                {currentSemesterData.bulanList.map((b) =>
                  b.weeks.map((w) => (
                    <th
                      key={`${b.namaBulan}_${w.mingguKe}`}
                      className={`p-1.5 w-8 text-center border-r border-slate-200 text-[10px] ${
                        !w.isEfektif ? 'bg-slate-200 text-slate-400' : 'bg-white'
                      }`}
                      title={`${b.namaBulan} Minggu ke-${w.mingguKe} ${w.labelKegiatan || w.keteranganKhusus ? `(${w.labelKegiatan || w.keteranganKhusus})` : ''}`}
                    >
                      {w.mingguKe}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {currentSemesterData.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2 text-center text-slate-500 font-medium border-r border-slate-200">
                    {row.nomor}
                  </td>
                  <td className="p-2 text-center font-mono font-bold text-indigo-700 border-r border-slate-200">
                    {row.kodeTP}
                  </td>
                  <td className="p-2 text-slate-900 leading-relaxed border-r border-slate-200">
                    <div className="font-semibold text-slate-800 line-clamp-2">{row.tujuanPembelajaran}</div>
                    <span className="text-[10px] text-slate-500">{row.elemen}</span>
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-200">
                    {row.lingkupMateri}
                  </td>
                  <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50">
                    {row.alokasiJP}
                  </td>

                  {/* Sel Distribusi Mingguan */}
                  {currentSemesterData.bulanList.map((b) =>
                    b.weeks.map((w) => {
                      const key = `${b.namaBulan}_${w.mingguKe}`;
                      const val = row.distribusiMingguan[key];
                      const isAgenda = !w.isEfektif;

                      return (
                        <td
                          key={key}
                          className={`p-1 text-center border-r border-slate-200 ${
                            isAgenda ? 'bg-slate-100' : ''
                          }`}
                        >
                          {isAgenda ? (
                            <span className="text-[9px] font-bold text-slate-400 block" title={w.labelKegiatan || w.keteranganKhusus}>
                              {(w.keteranganKhusus || w.labelKegiatan || '-').slice(0, 3)}
                            </span>
                          ) : (
                            <input
                              type="text"
                              maxLength={2}
                              value={val !== undefined ? val : ''}
                              onChange={(e) =>
                                handleCellChange(row.id, b.namaBulan, w.mingguKe, e.target.value)
                              }
                              className={`w-7 text-center font-bold py-0.5 text-xs rounded transition-all ${
                                val
                                  ? 'bg-indigo-600 text-white font-extrabold shadow-2xs'
                                  : 'hover:bg-slate-100 text-slate-300 hover:text-slate-700'
                              }`}
                              placeholder="·"
                            />
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>

            {/* Footer Summary Total JP */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={4} className="p-3 text-right border-r border-slate-200">
                  Total Jam Intrakurikuler Terjadwal:
                </td>
                <td className="p-3 text-center text-sm font-extrabold text-indigo-700 border-r border-slate-200">
                  {currentSemesterData.rows.reduce((acc, r) => acc + r.alokasiJP, 0)} JP
                </td>
                <td
                  colSpan={currentSemesterData.bulanList.reduce((acc, b) => acc + b.weeks.length, 0)}
                  className="p-3 text-xs text-slate-600 italic"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      Terdistribusi merata pada {currentSemesterData.summary.totalMingguEfektif} Minggu Efektif @ {effectivePromes.jpMinggu} JP/Minggu
                    </span>
                    <span className="font-semibold text-emerald-700">
                      Sesuai Permendikdasmen No. 13 Tahun 2025
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Keterangan Singkat & Lembar Pengesahan (WAJIB 1 Halaman saat dicetak / PDF) */}
      <div
        className="page-avoid-break print:break-inside-avoid print:page-break-inside-avoid mt-6 space-y-4"
        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
      >
        {/* Keterangan & Catatan Pelaksanaan PROMES */}
        <div className="bg-slate-50 rounded-xl border border-slate-300 p-5 text-xs text-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-200">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Keterangan &amp; Catatan Pelaksanaan Program Semester (PROMES)</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 leading-relaxed pt-1">
            <li>
              <strong>Distribusi Beban Intrakurikuler:</strong> Distribusi jam tatap muka mingguan berpedoman baku pada alokasi{' '}
              <strong>{effectivePromes.jpMinggu} JP/Minggu</strong> sesuai Permendikdasmen No. 13 Tahun 2025.
            </li>
            <li>
              <strong>Sinkronisasi Kalender Pendidikan:</strong> Disinkronkan dengan{' '}
              <strong>Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027 (SK Kadis Dikbud No. {KALDIK_TTU_METADATA.nomorSK})</strong>, mencakup{' '}
              <strong>{selectedSemester === '1' ? `${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah} Hari Efektif Sekolah di Semester 1` : `${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah} Hari Efektif Sekolah di Semester 2`}</strong> (total tahunan {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah} Hari Efektif / 18 Minggu Efektif Tatap Muka per semester).
            </li>
            <li>
              <strong>Asesmen &amp; Agenda Daerah:</strong> Jadwal telah mengantisipasi pelaksanaan Sumatif Tengah Semester ({selectedSemester === '1' ? 'STS 1' : 'STS 2'}), {selectedSemester === '1' ? 'SAS' : 'SAT/US'}, perkiraan TKA, Projek P5, serta hari efektif fakultatif keagamaan daerah (Hari Arwah, Rabu Abu, Kamis Putih).
            </li>
            <li>
              <strong>Pembelajaran Berdiferensiasi &amp; Remedial:</strong> Jam cadangan dialokasikan secara adaptif untuk penyesuaian materi esensial, bimbingan remedial bagi peserta didik yang membutuhkan, serta pengayaan kompetensi.
            </li>
          </ul>
        </div>

        {/* Lembar Pengesahan Tanda Tangan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            Lembar Pengesahan Program Semester (PROMES)
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

      {/* Modals */}
      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleOpenPDFExport}
        documentTitle={`Program Semester (Promes) Semester ${selectedSemester}`}
      />

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={effectivePromes.identitas}
        exportType={exportType}
        documentTitle={`Program Semester (PROMES) Semester ${selectedSemester} ${selectedClassFilter !== 'all' ? `Kelas ${selectedClassFilter}` : effectivePromes.identitas.fase}`}
        availableClasses={availableClasses}
        defaultSelectedKelas={selectedClassFilter}
        itemCountsByClass={itemCountsByClass}
        onConfirm={handleExportConfirm}
        onUpdateIdentitas={onUpdateIdentitas}
        defaultOrientation="landscape"
      />

      <KaldikTTUModal
        isOpen={isKaldikModalOpen}
        onClose={() => setIsKaldikModalOpen(false)}
      />
    </div>
  );
};
