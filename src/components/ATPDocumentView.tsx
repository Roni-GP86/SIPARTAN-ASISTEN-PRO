import React, { useState } from 'react';
import { ExportConfirmModal } from './ExportConfirmModal';
import { ATPDocument, SchoolIdentity, PDFLayoutOptions } from '../types';
import { exportATPToWord, exportATPToPDF } from '../utils/exportUtils';
import { filterATPDocumentByClass, countItemsByClass, getClassesForFase } from '../utils/classFilterUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { formatTPWithCode, formatCPElemenText, resolveElemenListForATP, resolveSingleElemenForTP } from '../utils/curriculumCPResolver';
import { executePrintWithLayout, loadSavedPDFLayout } from '../utils/printLayoutUtils';
import { DELAPAN_DIMENSI_PROFIL_LULUSAN, normalizeDimensiProfilLulusan } from '../data/dimensiProfilLulusan';
import { Download, Printer, Check, BookOpen, ArrowRight, ArrowLeft, Layers, ShieldCheck, Sparkles, Edit2, Save, FileText, Calendar, Filter, ListFilter, X, Eye } from 'lucide-react';

export type ATPSectionFilter = 'all' | 'A' | 'BC' | 'D' | 'E' | 'F' | 'G' | 'H';

const SECTION_OPTIONS: { id: ATPSectionFilter; label: string; fullLabel: string; shortCode: string }[] = [
  { id: 'all', label: 'Semua (A-H)', fullLabel: 'Seluruh Dokumen ATP (Bagian A - H)', shortCode: 'A-H' },
  { id: 'A', label: 'A. Identitas', fullLabel: 'A. Identitas Dokumen', shortCode: 'A' },
  { id: 'BC', label: 'B & C. Elemen & CP', fullLabel: 'B & C. Elemen dan Capaian Pembelajaran', shortCode: 'B-C' },
  { id: 'D', label: 'D. Alur TP (ATP)', fullLabel: 'D. Alur Tujuan Pembelajaran (ATP)', shortCode: 'D' },
  { id: 'E', label: 'E. Materi Pokok', fullLabel: 'E. Materi Pokok dan Sub-Materi', shortCode: 'E' },
  { id: 'F', label: 'F. Profil Lulusan', fullLabel: 'F. Dimensi Profil Lulusan (DPL)', shortCode: 'F' },
  { id: 'G', label: 'G. Glosarium', fullLabel: 'G. Glosarium Istilah', shortCode: 'G' },
  { id: 'H', label: 'H. Daftar Pustaka', fullLabel: 'H. Daftar Pustaka & Pengesahan', shortCode: 'H' },
];

interface ATPDocumentViewProps {
  atp: ATPDocument;
  onUpdateATP: (updated: ATPDocument) => void;
  onProceedToModulAjar: (selectedTPs: string[]) => void;
  onProceedToKKTP?: () => void;
  onProceedToProta?: () => void;
  onProceedToPromes?: () => void;
  onBackToTP: () => void;
  onSaveToHistory: () => void;
  isSaved: boolean;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
}

export const ATPDocumentView: React.FC<ATPDocumentViewProps> = ({

  atp,
  onUpdateATP,
  onProceedToModulAjar,
  onProceedToKKTP,
  onProceedToProta,
  onProceedToPromes,
  onBackToTP,
  onSaveToHistory,
  isSaved,
  onOpenEditIdentity,
  onUpdateIdentitas,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF'>('WORD');
  const [selectedTPIds, setSelectedTPIds] = useState<string[]>(
    atp.atpList.map((item) => item.kodeTP)
  );
  const [isEditingRasional, setIsEditingRasional] = useState(false);
  const [rasionalText, setRasionalText] = useState(atp.rasionalPenyusunan || '');

  // Filter bagian dokumen (A-H) & filter elemen mapel
  const [sectionFilter, setSectionFilter] = useState<ATPSectionFilter>('all');
  const [elemenMapelFilter, setElemenMapelFilter] = useState<string>('all');

  const totalJP = atp.atpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);
  const structuredElemenList = resolveElemenListForATP(atp);

  // Daftar elemen mata pelajaran unik dari ATP
  const distinctElemenList = React.useMemo(() => {
    const map = new Map<string, number>();
    atp.atpList.forEach((item) => {
      const elName = resolveSingleElemenForTP(
        item.elemen,
        atp.elemen,
        item.tujuanPembelajaran,
        item.lingkupMateri,
        structuredElemenList
      );
      const clean = elName.replace(/^Elemen\s+/i, '').trim();
      if (clean) {
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    });

    if (structuredElemenList && structuredElemenList.length > 0) {
      structuredElemenList.forEach((el) => {
        const clean = el.elemen.replace(/^Elemen\s+/i, '').trim();
        if (clean && !map.has(clean)) {
          map.set(clean, 0);
        }
      });
    }

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [atp.atpList, atp.elemen, structuredElemenList]);

  // Alur Tujuan Pembelajaran tersaring berdasarkan elemen mapel yang dipilih
  const filteredATPList = React.useMemo(() => {
    if (elemenMapelFilter === 'all') return atp.atpList;
    return atp.atpList.filter((item) => {
      const elName = resolveSingleElemenForTP(
        item.elemen,
        atp.elemen,
        item.tujuanPembelajaran,
        item.lingkupMateri,
        structuredElemenList
      );
      const clean = elName.replace(/^Elemen\s+/i, '').trim().toLowerCase();
      return clean === elemenMapelFilter.toLowerCase();
    });
  }, [atp.atpList, elemenMapelFilter, atp.elemen, structuredElemenList]);

  // Alokasi waktu JP tersaring
  const filteredTotalJP = React.useMemo(() => {
    return filteredATPList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);
  }, [filteredATPList]);

  // Elemen CP terstruktur tersaring
  const displayedElemenList = React.useMemo(() => {
    if (!structuredElemenList) return [];
    if (elemenMapelFilter === 'all') return structuredElemenList;
    return structuredElemenList.filter((el) => {
      const clean = el.elemen.replace(/^Elemen\s+/i, '').trim().toLowerCase();
      return clean === elemenMapelFilter.toLowerCase();
    });
  }, [structuredElemenList, elemenMapelFilter]);

  // Kompilasi Dimensi Profil Lulusan (DPL) aktif yang dibina dalam butir TP
  const activeDimensions = new Set(
    (atp.atpList || []).flatMap((item) =>
      Array.isArray(item.dimensiP3)
        ? item.dimensiP3.map((d) => normalizeDimensiProfilLulusan(d))
        : [normalizeDimensiProfilLulusan(item.dimensiP3 || '')]
    ).filter(Boolean)
  );

  // Sanitasi deskripsi DPL agar 100% bebas dari istilah lama P3 / Profil Pelajar Pancasila
  const sanitizedPenjelasanDPL = atp.penjelasanDPL
    ? atp.penjelasanDPL
        .replace(/Profil Pelajar Pancasila\s*\(P3\)/gi, 'Dimensi Profil Lulusan (DPL)')
        .replace(/Profil Pelajar Pancasila/gi, 'Dimensi Profil Lulusan (DPL)')
        .replace(/\(DPL\s*\/\s*P3\)/gi, '(DPL)')
        .replace(/\(P3\)/gi, '(DPL)')
    : 'Penyusunan Alur Tujuan Pembelajaran (ATP) ini mengintegrasikan 8 Dimensi Profil Lulusan (DPL) secara terarah dan kontekstual pada jenjang pendidikan dasar. Setiap butir Tujuan Pembelajaran (TP) memuat minimal 3 Dimensi Profil Lulusan yang relevan, terutama pembiasaan nilai Keimanan dan Ketakwaan terhadap Tuhan YME, Kewargaan, Penalaran Kritis dalam memecahkan masalah kontekstual, Kreativitas menghasilkan gagasan inovatif, Kolaborasi dalam kerja tim, Kemandirian dalam proses belajar, pemeliharaan Kesehatan mental dan fisik, serta keterampilan Komunikasi yang efektif dan santun.';

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
    tahunPelajaran?: string
  ) => {
    const chosenClass = selectedKelas || 'all';
    const resolvedTP = tahunPelajaran || atp.identitas.tahunPelajaran || '2026/2027';
    let documentToExport: ATPDocument = {
      ...atp,
      identitas: {
        ...atp.identitas,
        tempatPenetapan: tempat,
        tanggalPenetapan: tanggal,
        tahunPelajaran: resolvedTP,
      }
    };

    if (chosenClass !== 'all') {
      documentToExport = filterATPDocumentByClass(documentToExport, chosenClass);
    }

    if (onUpdateIdentitas) {
      onUpdateIdentitas(documentToExport.identitas);
    }

    if (exportType === 'WORD') {
      exportATPToWord(documentToExport);
    } else {
      exportATPToPDF(documentToExport, layoutOptions);
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

  const toggleSelectTP = (kodeTP: string) => {
    if (selectedTPIds.includes(kodeTP)) {
      if (selectedTPIds.length === 1) {
        alert('Pilih minimal satu Tujuan Pembelajaran.');
        return;
      }
      setSelectedTPIds(selectedTPIds.filter((k) => k !== kodeTP));
    } else {
      setSelectedTPIds([...selectedTPIds, kodeTP]);
    }
  };

  const handleSaveRasional = () => {
    onUpdateATP({ ...atp, rasionalPenyusunan: rasionalText });
    setIsEditingRasional(false);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Action Toolbar Header - Elegant Framed Layout */}
      <div className="no-print bg-white rounded-xl p-4 border-2 border-slate-300 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1528] text-amber-300 border-2 border-amber-400/50 flex items-center justify-center font-bold text-xs shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                  Tahap 3 • ATP Resmi
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {atp.identitas.mataPelajaran} (Fase {atp.identitas.fase} • Kelas {atp.identitas.kelas})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Struktur resmi BSKAP lengkap 8 bagian (A-H) siap telaah &amp; ekspor
              </p>
            </div>
          </div>

          {onOpenEditIdentity && (
            <button
              type="button"
              onClick={onOpenEditIdentity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
              title="Edit Profil Sekolah, Penyusun, dan Kepala Sekolah"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Edit Profil &amp; Penyusun</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Save to history */}
            <button
              id="btn-save-atp-history"
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
              id="btn-print-atp"
              onClick={handlePrint}
              title="Cetak langsung menggunakan dialog print browser yang telah dioptimalkan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Word */}
            <button
              id="btn-download-word-atp"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-500 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.doc)</span>
            </button>

            {/* Download PDF via jsPDF */}
            <button
              id="btn-download-pdf-atp"
              onClick={handleDownloadPDF}
              title="Unduh dokumen PDF langsung berkualitas tinggi dengan standar kurikulum"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white border-2 border-rose-400 hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* HALAMAN 1: COVER DOKUMEN RESMI - Framed (Sesuai Cover Analisis CP ke TP) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 shadow-md text-center font-serif text-slate-900 space-y-8 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:break-after-page">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 print:hidden" />
        
        <div className="space-y-3 pt-4">
          {atp.identitas.logoUrl && (
            <div className="flex justify-center pb-2">
              <img
                src={atp.identitas.logoUrl}
                alt="Logo Satuan Pendidikan"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xs"
              />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
            ANALISIS TUJUAN PEMBELAJARAN
            <br />
            KE ALUR TUJUAN PEMBELAJARAN (ATP)
          </h1>
          <div className="w-28 h-1 bg-[#0B1528] mx-auto mt-4 rounded-full print:hidden" />
        </div>

        <div className="py-4 sm:py-6 space-y-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-wide uppercase text-[#0B1528]">
            {atp.identitas.mataPelajaran || 'ILMU PENGETAHUAN ALAM DAN SOSIAL (IPAS)'}
          </h2>
          <p className="text-sm font-sans font-extrabold text-blue-800 bg-blue-50 inline-block px-3 py-1 rounded-md border border-blue-300">
            {atp.identitas.fase} • Kelas {atp.identitas.kelas}
          </p>
        </div>

        <div className="pt-4 sm:pt-6 pb-2 space-y-1">
          <p className="text-base font-black uppercase tracking-wide">
            {atp.identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
          </p>
          <p className="text-sm font-sans text-slate-600 font-medium">
            Tahun Pelajaran: {atp.identitas.tahunPelajaran || '2026/2027'}
          </p>
          <p className="text-xs font-sans text-slate-600 font-medium">
            Penyusun / Guru: {atp.identitas.namaGuru || '-'}
          </p>
          {atp.identitas.alokasiWaktuTotal && (
            <p className="text-xs font-sans text-emerald-800 font-bold bg-emerald-50 inline-block px-2.5 py-0.5 rounded border border-emerald-200 mt-1">
              Alokasi Intrakurikuler: {atp.identitas.alokasiWaktuTotal}
            </p>
          )}
        </div>

        {onOpenEditIdentity && (
          <div className="pt-2 no-print flex justify-center">
            <button
              type="button"
              onClick={onOpenEditIdentity}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border-2 border-blue-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Edit Data Cover &amp; Profil Sekolah</span>
            </button>
          </div>
        )}
      </div>

      {/* Official Formatted Document View - Halaman Isi */}
      <div className="atp-document print-container bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-8 text-slate-900 font-sans print:shadow-none print:border-none print:p-0" style={{ lineHeight: 1.5 }}>
        {/* Document Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-slate-900">
            ANALISIS TUJUAN PEMBELAJARAN KE ALUR TUJUAN PEMBELAJARAN
          </h1>
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide uppercase">
            KURIKULUM MERDEKA • TAHUN PELAJARAN {atp.identitas.tahunPelajaran}
          </h2>
        </div>

        <div className="mt-6 space-y-6 text-sm leading-[1.5] print:text-[11pt] print:leading-[1.5]">
          {/* A. IDENTITAS */}
          <section id="section-a-identitas" className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                A. IDENTITAS DOKUMEN
              </h3>
              {onOpenEditIdentity && (
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="no-print px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                  <span>Edit Data</span>
                </button>
              )}
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 leading-[1.5] mt-3.5 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse table-fixed">
                <colgroup>
                  <col className="w-56 sm:w-64" />
                  <col className="w-6" />
                  <col className="w-auto" />
                </colgroup>
                <tbody>
                  <tr className="border-b border-slate-200/60 last:border-b-0">
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Nama Satuan Pendidikan
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 font-bold text-slate-900 align-top pl-1">
                      {atp.identitas.namaSatuanPendidikan || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 last:border-b-0">
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Penyusun / Guru
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 text-slate-900 font-semibold align-top pl-1">
                      {atp.identitas.namaGuru || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 last:border-b-0">
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Mata Pelajaran
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 font-bold text-slate-950 align-top pl-1">
                      {atp.identitas.mataPelajaran || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 last:border-b-0">
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Fase / Kelas
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 text-slate-900 align-top pl-1">
                      {atp.identitas.fase} / Kelas {atp.identitas.kelas}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 last:border-b-0">
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Tahun Pelajaran / Semester
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 text-slate-900 align-top pl-1">
                      {atp.identitas.tahunPelajaran} / Semester {atp.identitas.semester}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-slate-700 align-top whitespace-nowrap">
                      Alokasi Waktu Intrakurikuler
                    </td>
                    <td className="w-6 py-2 text-center font-bold text-slate-700 align-top select-none">
                      :
                    </td>
                    <td className="py-2 font-bold text-blue-900 align-top pl-1">
                      {atp.identitas.alokasiWaktuTotal || `${totalJP} JP (Permendikdasmen No. 13 Tahun 2025 @ 35 Menit)`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* B. ELEMEN & C. CAPAIAN PEMBELAJARAN (TERPISAH PER ELEMEN) */}
          <section id="section-b-c-elemen-cp" className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                B &amp; C. ELEMEN DAN CAPAIAN PEMBELAJARAN (TERPISAH PER ELEMEN)
              </h3>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                BSKAP No. 046 Tahun 2025
              </span>
            </div>

            {structuredElemenList && structuredElemenList.length > 0 ? (
              <div className="space-y-3.5 mt-3.5">
                {structuredElemenList.map((el, elIdx) => (
                  <div
                    key={el.id || elIdx}
                    className="bg-slate-50 rounded border border-slate-200 p-3.5 space-y-2 transition-shadow hover:shadow-2xs"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {elIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">
                        Elemen {el.elemen.replace(/^Elemen\s+/i, '')}
                      </h4>
                      {el.deskripsiSingkat && (
                        <span className="text-[10px] text-slate-500 italic hidden sm:inline truncate max-w-md">
                          ({el.deskripsiSingkat})
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm print:text-[11pt] text-slate-800 text-justify leading-[1.6] pl-7">
                      {formatCPElemenText(el.capaianPembelajaran)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-3.5">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">
                    Elemen: {(atp.elemen || 'Elemen Pembelajaran').replace(/^Elemen\s+/i, '')}
                  </span>
                  <div className="text-xs sm:text-sm print:text-[11pt] text-slate-800 text-justify leading-[1.6]">
                    {formatCPElemenText(atp.capaianPembelajaran)}
                  </div>
                </div>
              </div>
            )}

            {atp.rasionalPenyusunan && (
              <div className="text-xs sm:text-sm text-slate-700 italic bg-blue-50/50 p-3.5 rounded border border-blue-100 leading-[1.5] mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-950 not-italic">Rasional Alur Pembelajaran:</span>
                  <button
                    onClick={() => setIsEditingRasional(!isEditingRasional)}
                    className="no-print text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>{isEditingRasional ? 'Batal' : 'Edit Rasional'}</span>
                  </button>
                </div>
                {isEditingRasional ? (
                  <div className="space-y-1.5 not-italic mt-1.5">
                    <textarea
                      rows={3}
                      value={rasionalText}
                      onChange={(e) => setRasionalText(e.target.value)}
                      className="w-full p-2 text-xs border border-blue-300 rounded bg-white text-slate-800 leading-[1.5]"
                    />
                    <button
                      onClick={handleSaveRasional}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan Rasional</span>
                    </button>
                  </div>
                ) : (
                  <p className="leading-[1.5]">{atp.rasionalPenyusunan}</p>
                )}
              </div>
            )}
          </section>

          {/* D. ALUR TUJUAN PEMBELAJARAN (ATP) */}
          <section id="section-d-atp" className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                D. ALUR TUJUAN PEMBELAJARAN (ATP)
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Permendikdasmen 13/2025
                </span>
                <span className="text-[10px] text-slate-700">
                  Total: <strong className="text-slate-900">{atp.atpList.length} TP</strong> • <strong className="text-blue-900 font-bold">{totalJP} JP</strong> (@ 35 Menit)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded mt-3.5">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 text-center w-8 border-r border-slate-200">No</th>
                    <th className="p-2 w-14 text-center border-r border-slate-200">Kode</th>
                    <th className="p-2 w-24 border-r border-slate-200">Elemen</th>
                    <th className="p-2 w-1/3 border-r border-slate-200">Tujuan Pembelajaran (TP)</th>
                    <th className="p-2 w-1/4 border-r border-slate-200">Lingkup Materi</th>
                    <th className="p-2 w-12 text-center border-r border-slate-200">JP</th>
                    <th className="p-2 w-1/5 border-r border-slate-200">Dimensi Profil Lulusan</th>
                    <th className="p-2">Indikator Ketercapaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {atp.atpList.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70">
                      <td className="p-2 text-center font-semibold text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="p-2 text-center font-bold text-blue-900 border-r border-slate-200">
                        {item.kodeTP}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <span className="block px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 text-center whitespace-normal leading-tight min-w-[85px] max-w-[125px] mx-auto">
                          {resolveSingleElemenForTP(item.elemen, atp.elemen, item.tujuanPembelajaran, item.lingkupMateri, structuredElemenList)}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-slate-900 border-r border-slate-200 leading-[1.5]">
                        {formatTPWithCode(item.kodeTP, item.tujuanPembelajaran)}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200 font-medium leading-[1.5]">
                        {item.lingkupMateri}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-200">
                        {item.alokasiJP}
                      </td>
                      <td className="p-2 text-slate-600 border-r border-slate-200">
                        <div className="flex flex-col gap-1">
                          {Array.isArray(item.dimensiP3) ? (
                            item.dimensiP3.map((d, dIdx) => {
                              const norm = normalizeDimensiProfilLulusan(d);
                              return (
                                <span
                                  key={dIdx}
                                  className="px-1.5 py-0.5 rounded bg-blue-50/90 text-blue-950 border border-blue-200 text-[9.5px] font-semibold flex items-center gap-1 leading-[1.4]"
                                >
                                  <span className="text-blue-600 text-[8px]">●</span> {norm}
                                </span>
                              );
                            })
                          ) : (
                            <span className="leading-[1.4]">{normalizeDimensiProfilLulusan(item.dimensiP3)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-slate-600 text-[10px] leading-[1.5]">
                        {item.indikatorKetercapaian}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={5} className="p-2 text-right border-r border-slate-200 font-bold text-slate-800">
                      Total Alokasi Waktu Intrakurikuler:
                    </td>
                    <td className="p-2 text-center text-xs font-black text-blue-900 border-r border-slate-200 bg-blue-50">
                      {totalJP} JP
                    </td>
                    <td colSpan={2} className="p-2 text-[10px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-emerald-900">
                          Sesuai Struktur Kurikulum Permendikdasmen No. 13/2025 (1 JP = 35 Menit)
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* E. MATERI POKOK & SUB-MATERI */}
          <section id="section-e-materi" className="space-y-3 print:break-before-page break-before-page page-break pt-4 print:pt-0">
            <div className="bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                E. MATERI POKOK DAN SUB-MATERI
              </h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded mt-3.5">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 w-20 border-r border-slate-200">Bab / Unit</th>
                    <th className="p-2 w-1/3 border-r border-slate-200">Materi Pokok</th>
                    <th className="p-2 border-r border-slate-200">Sub-Materi Pembelajaran</th>
                    <th className="p-2 w-16 text-center">Estimasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {atp.materiPokokList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                        {m.bab}
                      </td>
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200 leading-[1.5]">
                        {m.judulMateri}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200 leading-[1.5]">
                        <ul className="list-disc list-inside space-y-1">
                          {m.subMateri.map((sm, smIdx) => (
                            <li key={smIdx} className="leading-[1.5]">{sm}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2 text-center font-bold text-slate-800">
                        {m.perkiraanJP} JP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* F & G. DIMENSI PROFIL LULUSAN & GLOSARIUM (WAJIB BERADA PADA 1 HALAMAN YANG SAMA) */}
          <div className="space-y-4 page-break page-avoid-break print:break-before-page print:break-inside-avoid">
            {/* F. DIMENSI PROFIL LULUSAN */}
            <section id="section-f-dpl" className="space-y-3">
              <div className="bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  F. DIMENSI PROFIL LULUSAN
                </h3>
              </div>
              <div className="p-4 bg-slate-50 rounded border border-slate-200 mt-3.5">
                <ol className="space-y-2.5 list-decimal list-inside text-xs leading-[1.5]">
                  {DELAPAN_DIMENSI_PROFIL_LULUSAN.map((dim, idx) => {
                    const isEmphasized = activeDimensions.has(dim.nama) || activeDimensions.has(dim.lengkap);
                    return (
                      <li
                        key={idx}
                        className={`p-2.5 rounded border text-xs leading-[1.5] ${
                          isEmphasized
                            ? 'bg-blue-50/80 border-blue-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <strong className="text-slate-900 font-bold">{dim.nama}:</strong>{' '}
                        <span className="text-slate-700">{dim.definisi}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            {/* G. GLOSARIUM */}
            <section id="section-g-glosarium" className="space-y-3">
              <div className="bg-slate-100 p-2 rounded border-l-3 border-blue-600 mb-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  G. GLOSARIUM
                </h3>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded mt-3.5">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 w-1/4 border-r border-slate-200">Istilah</th>
                      <th className="p-2">Definisi / Penjelasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {atp.glosarium.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                          {g.istilah}
                        </td>
                        <td className="p-2 text-slate-700 leading-[1.5] text-justify">{g.definisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* H. DAFTAR PUSTAKA & PENGESAHAN DOKUMEN (WAJIB 1 HALAMAN BERSAMA TANDA TANGAN) */}
          <div className="space-y-6 page-break page-avoid-break print:break-before-page print:break-inside-avoid">
            {/* H. DAFTAR PUSTAKA */}
            <section id="section-h-daftar-pustaka" className="space-y-4">
              <div className="bg-slate-100 p-2.5 rounded border-l-3 border-blue-600 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  H. DAFTAR PUSTAKA
                </h3>
              </div>
              <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800 mt-4">
                <ol className="list-decimal list-inside space-y-3 pt-1">
                  {atp.daftarPustaka.map((p, idx) => (
                    <li key={idx} className="leading-[1.5] text-justify pl-1">
                      <span className="font-semibold">{p.penulis}</span>. ({p.tahun}).{' '}
                      <em>{p.judul}</em>. {p.kota ? `${p.kota}: ` : ''}
                      {p.penerbit}. {p.keterangan ? `(${p.keterangan})` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-200 page-avoid-break">
            {onUpdateIdentitas && (
              <div className="no-print mb-4 flex items-center justify-end gap-2 text-xs font-sans">
                <span className="text-slate-600 font-medium">Jabatan Penandatangan:</span>
                <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-md">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateIdentitas({ ...atp.identitas, peranGuru: 'Guru Kelas' })
                    }
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      (atp.identitas.peranGuru || 'Guru Kelas') === 'Guru Kelas'
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
                      onUpdateIdentitas({ ...atp.identitas, peranGuru: 'Guru Mata Pelajaran' })
                    }
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      (atp.identitas.peranGuru || 'Guru Kelas') === 'Guru Mata Pelajaran'
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

            <table className="w-full border-collapse border-none text-xs text-slate-900">
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
                        {atp.identitas.tempatPenetapan || 'Fatubai'},{' '}
                        {atp.identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', {
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
                      <p className="font-semibold">Kepala Sekolah</p>
                    </div>
                  </td>
                  <td className="w-1/2 border-none p-0 align-top pt-1">
                    <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                      <p className="font-semibold">{atp.identitas.peranGuru || 'Guru Kelas'}</p>
                    </div>
                  </td>
                </tr>

                {/* Baris 3: Ruang Tanda Tangan & Nama Lengkap */}
                <tr>
                  <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                    <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                      <p className="font-bold underline break-words inline-block">
                        {atp.identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.'}
                      </p>
                    </div>
                  </td>
                  <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                    <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                      <p className="font-bold underline break-words inline-block">
                        {atp.identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}
                      </p>
                    </div>
                  </td>
                </tr>

                {/* Baris 4: NIP Kepala Sekolah & NIP Guru */}
                <tr>
                  <td className="w-1/2 border-none p-0 align-top">
                    <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                      <p className="text-slate-600">
                        NIP. {atp.identitas.nipKepalaSekolah || '196709192008011008'}
                      </p>
                    </div>
                  </td>
                  <td className="w-1/2 border-none p-0 align-top">
                    <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                      <p className="text-slate-600">
                        NIP. {atp.identitas.nipGuru || '198603012020121005'}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {onOpenEditIdentity && (
              <div className="mt-6 pt-3 border-t border-dashed border-slate-200 flex justify-center no-print">
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-slate-600" />
                  <span>Ubah Data Tanda Tangan ATP (Kepala Sekolah &amp; Guru)</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Conversion & Navigation Panel (Professional Responsive Grid) */}
      <div className="no-print bg-[#0B1528] rounded-2xl p-5 sm:p-6 text-white border-2 border-amber-500/50 shadow-2xl space-y-5 w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Langkah Selanjutnya</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Lanjutkan ke Dokumen KKTP, PROTA, PROMES, atau Buat Modul Ajar (RPP)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Pilih butir Tujuan Pembelajaran (TP) yang menjadi fokus pembelajaran untuk dirancang menjadi Modul Ajar lengkap dengan LKPD dan Asesmen, atau lanjutkan ke dokumen kurikulum lainnya.
            </p>
          </div>
        </div>

        {/* TP Selector Box: Full width, clean grid, quick action buttons */}
        <div className="bg-[#070e1c] rounded-xl p-4 border border-slate-700/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-300">
                Pilih Butir TP Fokus untuk Modul Ajar:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {selectedTPIds.length} dari {atp.atpList.length} TP Terpilih
              </span>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTPIds(atp.atpList.map((t) => t.kodeTP))}
                className="px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  if (atp.atpList.length > 0) {
                    setSelectedTPIds([atp.atpList[0].kodeTP]);
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Pilih 1 TP Saja
              </button>
            </div>
          </div>

          {/* TP Pills: Responsive grid, clean chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1">
            {atp.atpList.map((item) => {
              const isSelected = selectedTPIds.includes(item.kodeTP);
              return (
                <button
                  key={item.kodeTP}
                  type="button"
                  onClick={() => toggleSelectTP(item.kodeTP)}
                  title={`TP ${item.kodeTP}: ${item.tujuanPembelajaran}`}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-amber-400/60 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                  <span className="truncate">TP {item.kodeTP}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Responsive Grid with Equal Width and No Horizontal Overflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          <button
            type="button"
            onClick={onBackToTP}
            className="w-full py-2.5 px-3.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Kembali ke TP</span>
          </button>

          {onProceedToKKTP && (
            <button
              id="btn-proceed-to-kktp"
              type="button"
              onClick={onProceedToKKTP}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border border-teal-400 shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Dokumen KKTP</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          {onProceedToProta && (
            <button
              id="btn-proceed-to-prota"
              type="button"
              onClick={onProceedToProta}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white border border-indigo-400 shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Prog. Tahunan (PROTA)</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          {onProceedToPromes && (
            <button
              id="btn-proceed-to-promes"
              type="button"
              onClick={onProceedToPromes}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white border border-violet-400 shadow-md cursor-pointer"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Prog. Semester (PROMES)</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          <button
            id="btn-generate-modul-from-atp"
            type="button"
            onClick={() => onProceedToModulAjar(selectedTPIds)}
            disabled={selectedTPIds.length === 0}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedTPIds.length === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border-2 border-blue-400 shadow-lg ring-2 ring-blue-400/30'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Modul Ajar ({selectedTPIds.length} TP)</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={atp.identitas}
        exportType={exportType}
        documentTitle={`ATP: ${atp.identitas.mataPelajaran}`}
        onUpdateIdentitas={onUpdateIdentitas}
        onConfirm={handleExportConfirm}
        availableClasses={getClassesForFase(atp.identitas.fase)}
        itemCountsByClass={countItemsByClass(atp.atpList, atp.identitas.fase)}
        defaultOrientation="portrait"
      />

      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleDownloadPDF}
        documentTitle={`ATP: ${atp.identitas.mataPelajaran}`}
      />
    </div>
  );
};
