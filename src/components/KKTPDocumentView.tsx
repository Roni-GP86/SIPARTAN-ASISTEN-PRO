import React, { useState } from 'react';
import { ExportConfirmModal } from './ExportConfirmModal';
import { KKTPDocument, KKTPItem, SchoolIdentity, PDFLayoutOptions } from '../types';
import { exportKKTPToWord, exportKKTPToPDF, exportKKTPToExcel } from '../utils/exportUtils';
import { filterKKTPDocumentByClass, countItemsByClass, getClassesForFase } from '../utils/classFilterUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { WordDownloadBlockedModal } from './WordDownloadBlockedModal';
import { formatTPWithCode } from '../utils/curriculumCPResolver';
import { executePrintWithLayout, loadSavedPDFLayout } from '../utils/printLayoutUtils';
import {
  Download,
  Printer,
  Check,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Edit2,
  Save,
  CheckSquare,
  BarChart3,
  ListOrdered,
  FileText,
  Search,
  Filter,
  Info,
  HelpCircle,
  Calculator,
  Layers,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface KKTPDocumentViewProps {
  kktp: KKTPDocument;
  onUpdateKKTP: (updated: KKTPDocument) => void;
  onProceedToModulAjar: (selectedTPs: string[]) => void;
  onBackToATP: () => void;
  onSaveToHistory?: () => void;
  isSaved?: boolean;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onRegenerateWithAI?: () => void;
  isGenerating?: boolean;
}

type KKTPTab =
  | 'matriks'
  | 'rubrik'
  | 'interval'
  | 'rubrik_interval'
  | 'deskripsi'
  | 'bloom'
  | 'panduan';

export const KKTPDocumentView: React.FC<KKTPDocumentViewProps> = ({

  kktp,
  onUpdateKKTP,
  onProceedToModulAjar,
  onBackToATP,
  onSaveToHistory,
  isSaved = false,
  onOpenEditIdentity,
  onRegenerateWithAI,
  isGenerating = false,
  onUpdateIdentitas,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWordBlockedModalOpen, setIsWordBlockedModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF' | 'EXCEL'>('WORD');
  // Default to user's selected primary approach: Cara Ketiga (Skala Interval Nilai)
  const [activeTab, setActiveTab] = useState<KKTPTab>('interval');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElemenFilter, setSelectedElemenFilter] = useState<string>('all');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [catatanText, setCatatanText] = useState(kktp.catatanPedagogis || '');
  const [selectedTPIds, setSelectedTPIds] = useState<string[]>(
    kktp.kktpList.map((item) => item.kodeTP)
  );

  // Interactive state for Cara 3: Skala (Interval Nilai) Assessment Simulator
  const [simTPCode, setSimTPCode] = useState<string>(kktp.kktpList[0]?.kodeTP || '5.1');
  const [simStudentName, setSimStudentName] = useState<string>('Ahmad Pratama');
  const [simScore, setSimScore] = useState<number>(75);
  const [simMaxScore, setSimMaxScore] = useState<number>(100);
  const [simRoster, setSimRoster] = useState<
    Array<{ id: string; nama: string; kodeTP: string; skor: number; maxSkor: number; persen: number; interval: string; tuntas: boolean }>
  >([
    { id: '1', nama: 'Ahmad Pratama', kodeTP: kktp.kktpList[0]?.kodeTP || '5.1', skor: 75, maxSkor: 100, persen: 75, interval: '66% - 85%', tuntas: true },
    { id: '2', nama: 'Siti Nurhaliza', kodeTP: kktp.kktpList[0]?.kodeTP || '5.1', skor: 92, maxSkor: 100, persen: 92, interval: '86% - 100%', tuntas: true },
    { id: '3', nama: 'Budi Santoso', kodeTP: kktp.kktpList[0]?.kodeTP || '5.1', skor: 58, maxSkor: 100, persen: 58, interval: '41% - 65%', tuntas: false },
    { id: '4', nama: 'Dewi Lestari', kodeTP: kktp.kktpList[0]?.kodeTP || '5.1', skor: 35, maxSkor: 100, persen: 35, interval: '0% - 40%', tuntas: false },
  ]);

  // Interactive state for Tab "Interval dari Rubrik" simulation
  const [simulasiSelectedTPIndex, setSimulasiSelectedTPIndex] = useState<number>(0);
  const [simulasiScores, setSimulasiScores] = useState<Record<string, number[]>>({});

  // Expanded eviden details per item in Tab Rubrik
  const [expandedEvidenTPs, setExpandedEvidenTPs] = useState<Record<string, boolean>>({});

  // Unique elements for filtering
  const availableElements = Array.from(
    new Set((kktp?.kktpList || []).map((item) => item?.elemen).filter(Boolean))
  );

  const isAgamaKatolik = (kktp?.identitas?.mataPelajaran || '').toLowerCase().includes('agama') || (kktp?.identitas?.mataPelajaran || '').toLowerCase().includes('katolik');
  const regCpLabel = isAgamaKatolik ? 'BKP No. 20/2026' : 'BSKAP No. 046 Tahun 2025';
  const regCpShort = isAgamaKatolik ? 'BKP No. 20/2026' : 'BSKAP No. 046/2025';

  const filteredItems = (kktp?.kktpList || []).filter((item) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.kodeTP || '').toLowerCase().includes(q) ||
      (item.rumusanTP || '').toLowerCase().includes(q) ||
      (item.lingkupMateri || '').toLowerCase().includes(q) ||
      (item.elemen || '').toLowerCase().includes(q);
    const matchesElemen =
      selectedElemenFilter === 'all' || item.elemen === selectedElemenFilter;
    return matchesSearch && matchesElemen;
  });

  const handlePrint = () => {
    executePrintWithLayout(loadSavedPDFLayout('landscape'));
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
    const resolvedTP = tahunPelajaran || kktp.identitas.tahunPelajaran || '2026/2027';
    let documentToExport: KKTPDocument = {
      ...kktp,
      identitas: {
        ...kktp.identitas,
        tempatPenetapan: tempat,
        tanggalPenetapan: tanggal,
        tahunPelajaran: resolvedTP,
      }
    };

    if (chosenClass !== 'all') {
      documentToExport = filterKKTPDocumentByClass(documentToExport, chosenClass);
    }

    if (onUpdateIdentitas) {
      onUpdateIdentitas(documentToExport.identitas);
    }

    if (exportType === 'WORD') {
      exportKKTPToWord(documentToExport);
    } else if (exportType === 'PDF') {
      exportKKTPToPDF(documentToExport, layoutOptions);
    } else {
      exportKKTPToExcel(documentToExport);
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

  const handleDownloadExcel = () => {
    setExportType('EXCEL');
    setIsExportModalOpen(true);
  };

  const handleSaveNote = () => {
    onUpdateKKTP({
      ...kktp,
      catatanPedagogis: catatanText,
    });
    setIsEditingNote(false);
  };

  const toggleSelectTP = (kodeTP: string) => {
    setSelectedTPIds((prev) =>
      prev.includes(kodeTP) ? prev.filter((id) => id !== kodeTP) : [...prev, kodeTP]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTPIds.length === kktp.kktpList.length) {
      setSelectedTPIds([]);
    } else {
      setSelectedTPIds(kktp.kktpList.map((item) => item.kodeTP));
    }
  };

  const toggleEvidenDetails = (kodeTP: string) => {
    setExpandedEvidenTPs((prev) => ({
      ...prev,
      [kodeTP]: !prev[kodeTP],
    }));
  };

  // Helper for current interactive TP simulation
  const currentSimulasiTP = kktp.kktpList[simulasiSelectedTPIndex] || kktp.kktpList[0];
  const currentTPKey = currentSimulasiTP?.kodeTP || 'default';
  const currentCriteriaScores =
    simulasiScores[currentTPKey] || [3, 3, 3, 3]; // Default score: 3 for each criteria (Total: 12)

  const handleScoreChange = (criteriaIndex: number, score: number) => {
    const updated = [...currentCriteriaScores];
    updated[criteriaIndex] = score;
    setSimulasiScores((prev) => ({
      ...prev,
      [currentTPKey]: updated,
    }));
  };

  const totalSimulasiScore = currentCriteriaScores.reduce((a, b) => a + b, 0);
  const maxSimulasiScore = 16;
  const calculatedPercentage = Math.round((totalSimulasiScore / maxSimulasiScore) * 100);

  const getIntervalCategory = (percentage: number) => {
    if (percentage <= 40) {
      return {
        label: '0% - 40%',
        status: 'Belum Mencapai Tujuan',
        intervensi: 'Remedial di seluruh bagian materi dengan media konkret/visual',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        tuntas: false,
      };
    } else if (percentage <= 65) {
      return {
        label: '41% - 65%',
        status: 'Belum Mencapai Tujuan',
        intervensi: 'Remedial di bagian yang diperlukan (tutor sebaya / latihan bertahap)',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        tuntas: false,
      };
    } else if (percentage <= 85) {
      return {
        label: '66% - 85%',
        status: 'Sudah Mencapai Tujuan (KKTP Standar)',
        intervensi: 'Tidak perlu remedial, tuntas belajar, dapat lanjut materi berikutnya',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        tuntas: true,
      };
    } else {
      return {
        label: '86% - 100%',
        status: 'Sudah Mencapai Tujuan (Melampaui Standar)',
        intervensi: 'Diberikan pengayaan materi penalaran tingkat tinggi (HOTS) atau tantangan proyek',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        tuntas: true,
      };
    }
  };

  const simulasiCategory = getIntervalCategory(calculatedPercentage);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Ribbon - Elegant Framed Layout */}
      <div className="no-print bg-white border-2 border-slate-300 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToATP}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>Kembali ke ATP</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-[#0B1528] text-amber-300 border border-amber-400/50 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                KKTP Berbasis TP Resmi
              </span>
              <span className="text-[11px] font-bold text-slate-600 hidden md:inline">
                Permendikbudristek 21/2022 &amp; PPA 2025
              </span>
            </div>
          </div>

          {onRegenerateWithAI && (
            <button
              onClick={onRegenerateWithAI}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 border-2 border-amber-300 rounded-lg transition-all disabled:opacity-50 shadow-xs cursor-pointer self-start sm:self-auto"
              title="Regenerasi KKTP menggunakan Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>{isGenerating ? 'Menyusun KKTP...' : 'Regenerasi via AI'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border-2 border-slate-300 overflow-hidden text-xs shadow-2xs">
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 font-bold bg-white hover:bg-rose-50 text-rose-700 border-r-2 border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export PDF (Landscape Resmi)"
              >
                <Download className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
              <button
                onClick={handleDownloadWord}
                className="px-3 py-1.5 font-bold bg-white hover:bg-blue-50 text-blue-700 border-r-2 border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Dokumen Word (.doc)"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Word</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 font-bold bg-white hover:bg-emerald-50 text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
            </div>

            {onSaveToHistory && (
              <button
                onClick={onSaveToHistory}
                disabled={isSaved}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg border-2 transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 cursor-default shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Tersimpan di Riwayat' : 'Simpan ke Riwayat'}</span>
              </button>
            )}

            <button
              onClick={() => onProceedToModulAjar(selectedTPIds)}
              disabled={selectedTPIds.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-blue-600 border-2 border-blue-400 rounded-lg shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lanjut Modul Ajar ({selectedTPIds.length} TP)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Clarification Banner: KKTP BUKAN KKM! */}
      <div className="no-print bg-gradient-to-r from-amber-50 via-orange-50/60 to-white border border-amber-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                Ketentuan Resmi KKTP Kurikulum Merdeka (Bukan KKM Tunggal!)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                Permendikbudristek No. 21 Tahun 2022 &bull; PPA 2025
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Prinsip Utama:</strong> Dalam Kurikulum Merdeka, penilaian tidak lagi menggunakan satu nilai KKM tunggal untuk seluruh mata pelajaran. 
              Sebagai gantinya, pendidik merumuskan <strong>Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</strong> secara spesifik 
              untuk setiap <strong>Tujuan Pembelajaran (TP)</strong>. KKTP berfungsi memberikan deskripsi autentik tentang bukti performa (eviden) 
              apakah murid telah mencapai tujuan pembelajaran atau belum, serta menentukan intervensi tindak lanjut yang tepat.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                &bull; 4 Cara Resmi: 1) Deskripsi Kriteria, 2) Rubrik Kualitatif, 3) Skala Interval Nilai, 4) Interval dari Rubrik
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                &bull; Dilengkapi Matriks Perencanaan Penilaian Formatif & Sumatif (Slide 23)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Official Document Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden print:border-none print:shadow-none">
        {/* Kop Resmi Satuan Pendidikan */}
        <div className="p-6 md:p-8 border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white text-center">
          <div className="max-w-3xl mx-auto space-y-1">
            <div className="flex items-center justify-center gap-4">
              {kktp.identitas.logoUrl && (
                <img
                  src={kktp.identitas.logoUrl}
                  alt="Logo Sekolah"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                />
              )}
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                  PEMERINTAH KABUPATEN TIMOR TENGAH UTARA
                </h4>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </h4>
                <h2 className="text-lg sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                  {kktp.identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                  Alamat: {kktp.identitas.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713'}
                </p>
              </div>
            </div>
            <div className="pt-2 pb-1">
              <div className="h-0.5 bg-slate-900 w-full" />
              <div className="h-px bg-slate-400 w-full mt-0.5" />
            </div>
            <div className="pt-3">
              <h1 className="text-base md:text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                DOKUMEN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
              </h1>
              <p className="text-xs font-semibold text-indigo-700 uppercase">
                Mata Pelajaran: {kktp.identitas.mataPelajaran} &bull; {kktp.identitas.fase} (Kelas {kktp.identitas.kelas}) &bull; Semester {kktp.identitas.semester}
              </p>
            </div>
          </div>
        </div>

        {/* Identity Matrix Card */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-slate-400 font-medium">Satuan Pendidikan</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {kktp.identitas.namaSatuanPendidikan}
              </div>
              <div className="text-slate-500 mt-1">NPSN: 50302319 / Akreditasi A</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-slate-400 font-medium">Mata Pelajaran & Fase</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {kktp.identitas.mataPelajaran}
              </div>
              <div className="text-indigo-600 font-medium mt-1">
                {kktp.identitas.fase} &bull; Kelas {kktp.identitas.kelas}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-slate-400 font-medium">Tahun Ajaran & Semester</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {kktp.identitas.tahunPelajaran}
              </div>
              <div className="text-slate-600 mt-1">Semester: {kktp.identitas.semester}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-slate-400 font-medium">Guru & Standar KKTP</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {kktp.identitas.namaGuru}
              </div>
              <div className="flex items-center justify-end text-slate-500 mt-1">
                
                <span className="font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                  KKTP: Minimal Cakap (66-85%)
                </span>
              </div>
            </div>
          </div>

          {onOpenEditIdentity && (
            <div className="mt-3 flex justify-end no-print">
              <button
                onClick={onOpenEditIdentity}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Ubah Data Identitas Satuan / Guru
              </button>
            </div>
          )}
        </div>

        {/* Rational & Legal Grounding Section */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                Dasar Filosofis & Landasan Yuridis KKTP (Permendikbudristek 21/2022 & PPA 2025)
              </h3>
              {isEditingNote ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={catatanText}
                    onChange={(e) => setCatatanText(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveNote}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Simpan Catatan
                    </button>
                    <button
                      onClick={() => setIsEditingNote(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed text-justify mt-1">
                  {kktp.catatanPedagogis}
                </p>
              )}

              {/* Quick Legal Callout */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <strong className="text-slate-800">Dasar Hukum:</strong> Permendikbudristek No. 21 Tahun 2022 Pasal 9 ayat (7) & (8)
                </span>
                <span>
                  <strong className="text-slate-800">Pedoman Teknis:</strong> Panduan Pembelajaran dan Asesmen (PPA) Tahun 2025
                </span>
                <span>
                  <strong className="text-slate-800">Regulasi CP:</strong> {regCpLabel}
                </span>
              </div>
            </div>
            {!isEditingNote && (
              <button
                onClick={() => setIsEditingNote(true)}
                className="no-print text-slate-400 hover:text-slate-700 p-1 rounded"
                title="Edit Rasional"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs & Filter Toolbar */}
        <div className="no-print px-6 pt-4 pb-2 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Navigation Tabs covering all 4 official ways + matrix + bloom */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('interval')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'interval'
                  ? 'bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-700'
                  : 'text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 font-semibold'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-300" />
              ⭐ Cara 3: Skala (Interval Nilai) [Pilihan Utama]
            </button>

            <button
              onClick={() => setActiveTab('matriks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'matriks'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Matriks Penilaian (Slide 23)
            </button>

            <button
              onClick={() => setActiveTab('deskripsi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'deskripsi'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Cara 1: Deskripsi Kriteria
            </button>

            <button
              onClick={() => setActiveTab('rubrik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'rubrik'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Cara 2: Rubrik 4 Jenjang
            </button>

            <button
              onClick={() => setActiveTab('rubrik_interval')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'rubrik_interval'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Cara 4: Interval dari Rubrik
            </button>

            <button
              onClick={() => setActiveTab('bloom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'bloom'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Alternatif Bloom (C1-C4)
            </button>

            <button
              onClick={() => setActiveTab('panduan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'panduan'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Panduan Rapor & Asesmen
            </button>
          </div>

          {/* Search & Element Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari TP, materi, atau kode..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-44 md:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {availableElements.length > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedElemenFilter}
                  onChange={(e) => setSelectedElemenFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Semua Elemen</option>
                  {availableElements.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB CONTENT: MATRIKS PERENCANAAN FORMATIF & SUMATIF (SLIDE 23) */}
        {/* ======================================================== */}
        {activeTab === 'matriks' && (
          <div className="p-6 space-y-4 overflow-x-auto">
            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-lg text-xs text-indigo-950 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-indigo-900">
                  Matriks Perencanaan Penilaian Formatif dan Sumatif (Format Resmi Panduan Asesmen Slide 23)
                </div>
                <div className="text-slate-700">
                  Tabel ini memetakan perencanaan penilaian untuk setiap Tujuan Pembelajaran (TP) yang mencakup indikator kinerja, 
                  bentuk penilaian (esau, unjuk kerja, LKPD, tes tertulis), instrumen penilaian, pendekatan penetapan KKTP, dan kriteria ketuntasannya.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Daftar Perencanaan Penilaian</span>
                <span>(Menampilkan {filteredItems.length} dari {kktp.kktpList.length} TP)</span>
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {selectedTPIds.length === kktp.kktpList.length ? 'Batalkan Semua Pilihan' : 'Pilih Semua TP'}
              </button>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2.5 text-center w-12">Pilih</th>
                  <th className="border border-slate-300 p-2.5 text-center w-12">No</th>
                  <th className="border border-slate-300 p-2.5 text-center w-16">Kode</th>
                  <th className="border border-slate-300 p-2.5 w-72">Tujuan Pembelajaran (TP)</th>
                  <th className="border border-slate-300 p-2.5 w-64">Indikator Capaian / Performa (Eviden)</th>
                  <th className="border border-slate-300 p-2.5 w-44">Bentuk Penilaian</th>
                  <th className="border border-slate-300 p-2.5 w-44">Instrumen Penilaian</th>
                  <th className="border border-slate-300 p-2.5 w-40 text-center">Pendekatan KKTP</th>
                  <th className="border border-slate-300 p-2.5 w-48 text-center bg-emerald-50 text-emerald-950">
                    Keterangan Ketuntasan (KKTP)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isSelected = selectedTPIds.includes(item.kodeTP);
                  const p = item.perencanaanPenilaian;
                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-slate-50/70 ${isSelected ? 'bg-indigo-50/20' : ''}`}
                    >
                      <td className="border border-slate-300 p-2 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTP(item.kodeTP)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Pilih TP"
                        />
                      </td>
                      <td className="border border-slate-300 p-2 text-center align-top text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 p-2 text-center align-top font-bold text-slate-800">
                        {item.kodeTP}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top space-y-1">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {formatTPWithCode(item.kodeTP, item.rumusanTP)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Materi:</span> {item.lingkupMateri} &bull; <span className="font-semibold text-slate-700">Elemen:</span> {item.elemen}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top text-slate-700 leading-relaxed text-[11px]">
                        {p?.indikatorCapaianPerforma || item.indikatorKetercapaian}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top text-slate-800 font-medium text-[11px]">
                        {p?.bentukPenilaian || (item.teknikAsesmen || []).join(', ')}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top text-slate-800 text-[11px]">
                        {p?.instrumenPenilaian || item.instrumenAsesmen}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top text-center text-[11px] font-semibold text-indigo-700">
                        {p?.pendekatanKKTP || 'Rubrik & Interval Nilai'}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top text-[11px] bg-emerald-50/50 text-emerald-900 font-medium leading-relaxed">
                        {p?.keteranganKetuntasan || 'Minimal Cakap pada kedua eviden (Interval 66 - 85%)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB CONTENT 1: PENDEKATAN RUBRIK KUALITATIF 4 JENJANG (SLIDE 11-15) */}
        {/* ======================================================== */}
        {activeTab === 'rubrik' && (
          <div className="p-6 space-y-4 overflow-x-auto">
            <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-blue-900">
                  Cara Penetapan KKTP 1: Menggunakan Rubrik Kualitatif 4 Jenjang Ketercapaian (Slide 11-15)
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Pendidik menetapkan kriteria performa berdasarkan bukti ketercapaian (eviden). 
                  Jenjang kualifikasi resmi: <strong>Baru Berkembang</strong>, <strong>Layak</strong>, <strong>Cakap</strong>, dan <strong>Mahir</strong>.
                  <br />
                  <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded inline-block mt-1">
                    Aturan Ketuntasan KKTP: Peserta didik dianggap telah mencapai tujuan pembelajaran jika kriteria/bukti kinerja mencapai tahap MINIMAL CAKAP pada kedua kriteria.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Tabel Rubrik Performa KKTP</span>
                <span>(Menampilkan {filteredItems.length} dari {kktp.kktpList.length} TP)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Baru Berkembang (0-60)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Layak (61-70)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cakap (71-85) [KKTP]
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Mahir (86-100)
                </span>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2.5 text-center w-12">Pilih</th>
                  <th className="border border-slate-300 p-2.5 text-center w-16">Kode</th>
                  <th className="border border-slate-300 p-2.5 w-72">Elemen & Tujuan Pembelajaran (TP)</th>
                  <th className="border border-slate-300 p-2.5 bg-rose-50 text-rose-950 text-center w-56">
                    Baru Berkembang<br />
                    <span className="text-[10px] font-normal text-rose-700">(Skor 0 - 60)</span>
                  </th>
                  <th className="border border-slate-300 p-2.5 bg-amber-50 text-amber-950 text-center w-56">
                    Layak<br />
                    <span className="text-[10px] font-normal text-amber-700">(Skor 61 - 70)</span>
                  </th>
                  <th className="border border-slate-300 p-2.5 bg-emerald-50 text-emerald-950 text-center w-56">
                    Cakap (Tuntas KKTP)<br />
                    <span className="text-[10px] font-normal text-emerald-700">(Skor 71 - 85)</span>
                  </th>
                  <th className="border border-slate-300 p-2.5 bg-blue-50 text-blue-950 text-center w-56">
                    Mahir (Melampaui)<br />
                    <span className="text-[10px] font-normal text-blue-700">(Skor 86 - 100)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isSelected = selectedTPIds.includes(item.kodeTP);
                  const rubrik = item.pendekatanRubrik;
                  const isExpanded = expandedEvidenTPs[item.kodeTP];
                  const hasEviden = rubrik.kriteriaEviden && rubrik.kriteriaEviden.length > 0;

                  return (
                    <React.Fragment key={item.id || idx}>
                      <tr className={`hover:bg-slate-50/60 ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                        <td className="border border-slate-300 p-2 text-center align-top">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTP(item.kodeTP)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            title="Pilih untuk Modul Ajar"
                          />
                        </td>
                        <td className="border border-slate-300 p-2 text-center align-top font-bold text-slate-800">
                          {item.kodeTP}
                        </td>
                        <td className="border border-slate-300 p-2.5 align-top space-y-1.5">
                          <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-indigo-700 border border-slate-200">
                            Elemen: {item.elemen}
                          </div>
                          <div className="font-semibold text-slate-900 leading-snug">
                            {formatTPWithCode(item.kodeTP, item.rumusanTP)}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Materi:</span> {item.lingkupMateri}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            <span className="font-semibold">Alokasi:</span> {item.alokasiJP} JP &bull; <span className="font-semibold">Kelas:</span> {item.kelasTarget} &bull; <span className="font-semibold">Semester:</span> {item.semester}
                          </div>
                          <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            <strong>Bukti Kinerja (Eviden):</strong> {item.indikatorKetercapaian}
                          </div>

                          {/* Toggle Eviden Details Button */}
                          {hasEviden && (
                            <button
                              onClick={() => toggleEvidenDetails(item.kodeTP)}
                              className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 mt-1 bg-indigo-50/80 px-2 py-1 rounded border border-indigo-200/60"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? 'Tutup Rincian Eviden' : 'Lihat Rubrik Per Eviden (2 Kriteria)'}
                            </button>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2.5 align-top bg-rose-50/30 text-slate-800 leading-relaxed text-justify text-[11px]">
                          {rubrik.baruBerkembang || rubrik.perluBimbingan}
                        </td>
                        <td className="border border-slate-300 p-2.5 align-top bg-amber-50/30 text-slate-800 leading-relaxed text-justify text-[11px]">
                          {rubrik.layak || rubrik.cukup}
                        </td>
                        <td className="border border-slate-300 p-2.5 align-top bg-emerald-50/30 text-slate-800 leading-relaxed text-justify text-[11px]">
                          {rubrik.cakap || rubrik.baik}
                        </td>
                        <td className="border border-slate-300 p-2.5 align-top bg-blue-50/30 text-slate-800 leading-relaxed text-justify text-[11px]">
                          {rubrik.mahir || rubrik.sangatBaik}
                        </td>
                      </tr>

                      {/* Kesimpulan Ketuntasan Row */}
                      <tr className="bg-emerald-50/40">
                        <td colSpan={3} className="border border-slate-300 p-2 text-[11px] font-bold text-emerald-900 text-right">
                          Kesimpulan Ketuntasan KKTP:
                        </td>
                        <td colSpan={4} className="border border-slate-300 p-2 text-[11px] text-emerald-950 font-medium leading-relaxed">
                          {rubrik.kesimpulanKetuntasan ||
                            'Peserta didik dianggap telah mencapai tujuan pembelajaran jika kedua kriteria/bukti kinerja mencapai tahap MINIMAL CAKAP atau MAHIR (KKTP: Minimal Cakap pada kedua kriteria).'}
                        </td>
                      </tr>

                      {/* Expanded Eviden Rows (Slide 12-14) */}
                      {isExpanded && hasEviden && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="border border-slate-300 p-3 space-y-2">
                            <div className="text-[11px] font-bold text-slate-800">
                              Rincian Rubrik Ketercapaian Per Bukti Kinerja (Eviden) - TP {item.kodeTP}:
                            </div>
                            <table className="w-full text-left border-collapse border border-slate-200 text-[11px] bg-white">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700">
                                  <th className="border border-slate-200 p-2 w-64">Nama Kriteria / Bukti Kinerja</th>
                                  <th className="border border-slate-200 p-2 bg-rose-50 text-rose-900">Baru Berkembang</th>
                                  <th className="border border-slate-200 p-2 bg-amber-50 text-amber-900">Layak</th>
                                  <th className="border border-slate-200 p-2 bg-emerald-50 text-emerald-900">Cakap (Tuntas)</th>
                                  <th className="border border-slate-200 p-2 bg-blue-50 text-blue-900">Mahir</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rubrik.kriteriaEviden?.map((ev, evIdx) => (
                                  <tr key={evIdx} className="hover:bg-slate-50/50">
                                    <td className="border border-slate-200 p-2 font-semibold text-slate-900">
                                      {ev.namaEviden}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-slate-700">
                                      {ev.baruBerkembang}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-slate-700">
                                      {ev.layak}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-slate-800 font-medium bg-emerald-50/30">
                                      {ev.cakap}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-slate-700">
                                      {ev.mahir}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB CONTENT: CARA KETIGA (SKALA / INTERVAL NILAI) - SLIDE 16-17 */}
        {/* ======================================================== */}
        {activeTab === 'interval' && (() => {
          const currentSimTP =
            kktp.kktpList.find((item) => item.kodeTP === simTPCode) || kktp.kktpList[0];
          const calculatedPercent =
            simMaxScore > 0
              ? Math.min(100, Math.max(0, Math.round((simScore / simMaxScore) * 100)))
              : 0;

          let intervalBadge = {
            label: '66% - 85%',
            title: 'Sudah Mencapai Tujuan (Tuntas KKTP)',
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            bgBox: 'bg-emerald-50/80 border-emerald-200',
            tuntas: true,
            intervensi: `Tidak perlu remedial. Peserta didik telah tuntas mencapai kriteria dan siap melanjutkan ke Tujuan Pembelajaran (TP) berikutnya.`,
            deskripsiRapor: `Menunjukkan penguasaan yang baik dan tuntas dalam materi ${currentSimTP?.lingkupMateri || 'pembelajaran'}, mampu menyelesaikan tugas secara mandiri dan akurat sesuai kriteria ketercapaian tujuan pembelajaran.`,
          };

          if (calculatedPercent <= 40) {
            intervalBadge = {
              label: '0% - 40%',
              title: 'Belum Mencapai Tujuan (Remedial Total)',
              badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
              bgBox: 'bg-rose-50/80 border-rose-200',
              tuntas: false,
              intervensi: `Diberikan program remedial di seluruh bagian materi ${currentSimTP?.lingkupMateri || ''} melalui pembelajaran ulang (re-teaching) intensif satu-lawan-satu dengan bantuan media manipulatif/alat peraga konkret.`,
              deskripsiRapor: `Menunjukkan kesungguhan dalam mempelajari materi ${currentSimTP?.lingkupMateri || ''}, namun masih memerlukan pendampingan intensif dan bimbingan terarah pada seluruh konsep dan prosedur dasar.`,
            };
          } else if (calculatedPercent <= 65) {
            intervalBadge = {
              label: '41% - 65%',
              title: 'Belum Mencapai Tujuan (Remedial Terarah)',
              badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
              bgBox: 'bg-amber-50/80 border-amber-200',
              tuntas: false,
              intervensi: `Diberikan program remedial terarah pada sub-materi/langkah kerja yang belum dikuasai melalui bimbingan tutor sebaya dan latihan terbimbing bertahap (scaffolding).`,
              deskripsiRapor: `Mulai memahami materi ${currentSimTP?.lingkupMateri || ''}, namun masih perlu pendampingan dan latihan terbimbing pada prosedur penyelesaian soal terapan secara mandiri.`,
            };
          } else if (calculatedPercent >= 86) {
            intervalBadge = {
              label: '86% - 100%',
              title: 'Sudah Mencapai Tujuan (Melampaui Standar)',
              badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
              bgBox: 'bg-blue-50/80 border-blue-200',
              tuntas: true,
              intervensi: `Diberikan program pengayaan materi berupa latihan penalaran tingkat tinggi (HOTS), pemecahan masalah terbuka (open-ended problem), atau mini proyek investigasi kontekstual.`,
              deskripsiRapor: `Sangat mahir dan melampaui kriteria ketercapaian dalam menguasai materi ${currentSimTP?.lingkupMateri || ''}, bernalar kritis, dan mampu menyelesaikan masalah kontekstual baru dengan mandiri serta kreatif.`,
            };
          }

          const handleAddSimToRoster = () => {
            const newEntry = {
              id: Date.now().toString(),
              nama: simStudentName.trim() || 'Murid',
              kodeTP: currentSimTP?.kodeTP || '5.1',
              skor: simScore,
              maxSkor: simMaxScore,
              persen: calculatedPercent,
              interval: intervalBadge.label,
              tuntas: intervalBadge.tuntas,
            };
            setSimRoster([newEntry, ...simRoster]);
          };

          const handleRemoveSimFromRoster = (id: string) => {
            setSimRoster(simRoster.filter((r) => r.id !== id));
          };

          return (
            <div className="p-6 space-y-6">
              {/* Top Banner: Filosofis & Ketentuan Baku Cara Ketiga */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-xl shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-500/30 rounded-lg border border-indigo-400/40 text-amber-300">
                      <ListOrdered className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
                        CARA KETIGA: MENGGUNAKAN SKALA (INTERVAL NILAI) & TINDAK LANJUT INTERVENSI
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Pilihan Terpilih
                        </span>
                      </h2>
                      <p className="text-xs text-indigo-200">
                        Berdasarkan Panduan Pembelajaran dan Asesmen (PPA) Kemendikdasmen 2025 Slide 16-17 & Permendikbudristek No. 21 Tahun 2022
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-1 rounded-md font-semibold">
                      Batas KKTP Tuntas: 66% - 85%
                    </span>
                  </div>
                </div>

                {/* 4 Official Intervals Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300">0% – 40%</span>
                      <span className="text-[10px] font-bold bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded">
                        Belum Tuntas
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-white">Remedial Total di Seluruh Bagian</div>
                    <p className="text-[10px] text-rose-200/80 leading-relaxed">
                      Pembelajaran ulang (re-teaching) intensif dan bimbingan perorangan menggunakan alat peraga konkret.
                    </p>
                  </div>

                  <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300">41% – 65%</span>
                      <span className="text-[10px] font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded">
                        Belum Tuntas
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-white">Remedial di Bagian yang Diperlukan</div>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                      Remedial terarah pada sub-materi yang belum dikuasai melalui tutor sebaya dan latihan terbimbing.
                    </p>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-400/50 p-3 rounded-lg space-y-1 ring-1 ring-emerald-400/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-300">66% – 85% [STANDAR KKTP]</span>
                      <span className="text-[10px] font-bold bg-emerald-500/40 text-emerald-100 px-1.5 py-0.5 rounded">
                        Tuntas Belajar
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-white">Tidak Perlu Remedial (Lanjut TP)</div>
                    <p className="text-[10px] text-emerald-200/90 leading-relaxed">
                      Peserta didik telah tuntas mencapai kriteria dan siap melanjutkan ke Tujuan Pembelajaran (TP) berikutnya.
                    </p>
                  </div>

                  <div className="bg-blue-950/40 border border-blue-500/40 p-3 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-300">86% – 100%</span>
                      <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded">
                        Melampaui KKTP
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-white">Diberikan Pengayaan Materi (HOTS)</div>
                    <p className="text-[10px] text-blue-200/80 leading-relaxed">
                      Tantangan penalaran tingkat tinggi (HOTS), pemecahan masalah terbuka, atau mini riset kontekstual.
                    </p>
                  </div>
                </div>

                {/* Mathematical Formula Callout */}
                <div className="bg-white/10 rounded-lg p-2.5 text-[11px] flex flex-wrap items-center justify-between gap-2 border border-white/10 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      <strong>Formula Penskoran Objektif:</strong> Persentase Ketercapaian (%) = (Skor Perolehan / Skor Maksimal Instrumen) &times; 100%
                    </span>
                  </div>
                  <div className="text-xs text-amber-200 font-mono">
                    Contoh: 15 / 20 soal = 75% &rarr; Masuk Interval 66% - 85% (Tuntas KKTP)
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION: KALKULATOR & SIMULATOR ASESMEN SISWA (CARA KETIGA) */}
              {/* ======================================================== */}
              <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
                <div className="bg-slate-100/80 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Simulator Pengolahan Nilai & Generator Narasi Rapor Asesmen (Cara Ketiga)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">
                    Uji coba penentuan interval dan narasi rapor secara langsung
                  </span>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Input Nilai Siswa */}
                  <div className="lg:col-span-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-200 lg:pr-5 pb-5 lg:pb-0">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        1. Pilih Tujuan Pembelajaran (TP):
                      </label>
                      <select
                        value={simTPCode}
                        onChange={(e) => setSimTPCode(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {kktp.kktpList.map((item) => (
                          <option key={item.kodeTP} value={item.kodeTP}>
                            TP {item.kodeTP}: {item.rumusanTP.length > 70 ? item.rumusanTP.substring(0, 70) + '...' : item.rumusanTP} ({item.lingkupMateri})
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-slate-500 mt-1">
                        <strong>Materi:</strong> {currentSimTP?.lingkupMateri} &bull; <strong>Alokasi:</strong> {currentSimTP?.alokasiJP} JP
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          2. Nama Murid:
                        </label>
                        <input
                          type="text"
                          value={simStudentName}
                          onChange={(e) => setSimStudentName(e.target.value)}
                          placeholder="Nama Siswa"
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Skor Siswa:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={simMaxScore}
                          value={simScore}
                          onChange={(e) => setSimScore(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Skor Maksimal:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={simMaxScore}
                          onChange={(e) => setSimMaxScore(Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex flex-col justify-end">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-center">
                          <span className="text-[10px] text-indigo-700 font-bold block">Hasil:</span>
                          <span className="text-sm font-black text-indigo-900">{calculatedPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Button add to class simulation table */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={handleAddSimToRoster}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Simpan Nilai ke Daftar Kelas
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Live Result & Rapor Narrative Output */}
                  <div className="lg:col-span-7 space-y-3.5">
                    {/* Visual Segmented Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Spektrum Interval Ketercapaian KKTP:</span>
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${intervalBadge.badgeBg}`}>
                          {calculatedPercent}% &bull; {intervalBadge.label} ({intervalBadge.title})
                        </span>
                      </div>

                      {/* 4 Colored segments with needle indicator */}
                      <div className="relative pt-1 pb-4">
                        <div className="h-3.5 w-full rounded-full overflow-hidden flex shadow-inner border border-slate-300">
                          <div className="w-[40%] bg-rose-400" title="0-40%: Remedial Total" />
                          <div className="w-[25%] bg-amber-400" title="41-65%: Remedial Terarah" />
                          <div className="w-[20%] bg-emerald-500" title="66-85%: Tuntas Standar KKTP" />
                          <div className="w-[15%] bg-blue-500" title="86-100%: Pengayaan HOTS" />
                        </div>

                        {/* Ticks and indicator */}
                        <div
                          className="absolute top-0 flex flex-col items-center -ml-2 transition-all duration-300"
                          style={{ left: `${Math.min(99, Math.max(1, calculatedPercent))}%` }}
                        >
                          <div className="w-4 h-4 bg-slate-900 border-2 border-white rounded-full shadow-md flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          </div>
                          <span className="text-[9px] font-black text-slate-900 bg-white px-1 rounded shadow-2xs border border-slate-300 mt-0.5">
                            {calculatedPercent}%
                          </span>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 px-1 mt-1 font-mono">
                          <span>0% (Remedial)</span>
                          <span>40%</span>
                          <span className="font-bold text-emerald-700 underline">65% (Batas KKTP)</span>
                          <span>85%</span>
                          <span>100% (HOTS)</span>
                        </div>
                      </div>
                    </div>

                    {/* Result Action Card */}
                    <div className={`p-3.5 rounded-lg border ${intervalBadge.bgBox} space-y-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                            Rencana Aksi Intervensi Pedagogis Guru:
                          </span>
                          <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug">
                            {intervalBadge.intervensi}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-1 rounded shrink-0 uppercase tracking-wide border ${
                            intervalBadge.tuntas
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-rose-600 text-white border-rose-700'
                          }`}
                        >
                          {intervalBadge.tuntas ? 'TUNTAS KKTP' : 'BELUM TUNTAS'}
                        </span>
                      </div>

                      {/* Narasi Rapor Kurikulum Merdeka */}
                      <div className="bg-white/90 p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            Narasi Rapor Kurikulum Merdeka (Otomatis):
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 italic leading-relaxed">
                          "{intervalBadge.deskripsiRapor}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Simulation Roster Table */}
                <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Daftar Rekap Nilai Asesmen Kelas (Simulasi Pembagian 4 Interval):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total Murid: {simRoster.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-200 bg-white text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold">
                          <th className="border border-slate-200 p-2 text-center w-10">No</th>
                          <th className="border border-slate-200 p-2">Nama Murid</th>
                          <th className="border border-slate-200 p-2 text-center w-16">Kode TP</th>
                          <th className="border border-slate-200 p-2 text-center w-24">Skor / Maks</th>
                          <th className="border border-slate-200 p-2 text-center w-20">Persen (%)</th>
                          <th className="border border-slate-200 p-2 text-center w-36">Rentang Interval</th>
                          <th className="border border-slate-200 p-2 text-center w-28">Status KKTP</th>
                          <th className="border border-slate-200 p-2 text-center w-12">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simRoster.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-slate-50/80">
                            <td className="border border-slate-200 p-2 text-center text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-200 p-2 font-semibold text-slate-900">
                              {r.nama}
                            </td>
                            <td className="border border-slate-200 p-2 text-center text-indigo-700 font-mono font-bold">
                              {r.kodeTP}
                            </td>
                            <td className="border border-slate-200 p-2 text-center font-mono">
                              {r.skor} / {r.maxSkor}
                            </td>
                            <td className="border border-slate-200 p-2 text-center font-bold text-slate-800">
                              {r.persen}%
                            </td>
                            <td className="border border-slate-200 p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  r.persen <= 40
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : r.persen <= 65
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : r.persen <= 85
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {r.interval}
                              </span>
                            </td>
                            <td className="border border-slate-200 p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.tuntas
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {r.tuntas ? 'Tuntas' : 'Perlu Remedial'}
                              </span>
                            </td>
                            <td className="border border-slate-200 p-2 text-center">
                              <button
                                onClick={() => handleRemoveSimFromRoster(r.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION: TABEL UTAMA DOKUMEN KKTP CARA KETIGA (INTERVAL NILAI) */}
              {/* ======================================================== */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-600" />
                      Tabel Dokumen KKTP Cara Ketiga: Skala (Interval Nilai) untuk Seluruh Tujuan Pembelajaran
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Menampilkan kriteria ketercapaian 4 interval dan rekomendasi intervensi pedagogis untuk setiap TP
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-slate-800">Centang TP</span> untuk pemilihan pembuatan Modul Ajar
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="border border-slate-300 p-2.5 text-center w-12 no-print">
                          <input
                            type="checkbox"
                            checked={
                              filteredItems.length > 0 &&
                              filteredItems.every((item) => selectedTPIds.includes(item.kodeTP))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTPIds(
                                  Array.from(
                                    new Set([...selectedTPIds, ...filteredItems.map((i) => i.kodeTP)])
                                  )
                                );
                              } else {
                                const removeCodes = new Set(filteredItems.map((i) => i.kodeTP));
                                setSelectedTPIds(selectedTPIds.filter((id) => !removeCodes.has(id)));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            title="Pilih Semua TP"
                          />
                        </th>
                        <th className="border border-slate-300 p-2.5 text-center w-16">Kode</th>
                        <th className="border border-slate-300 p-2.5 w-72">
                          Elemen & Tujuan Pembelajaran (TP)
                        </th>
                        <th className="border border-slate-300 p-2.5 bg-rose-50 text-rose-950 text-center w-60">
                          0% - 40%<br />
                          <span className="text-[10px] font-bold text-rose-700 uppercase">
                            Belum Tuntas (Remedial Total)
                          </span>
                        </th>
                        <th className="border border-slate-300 p-2.5 bg-amber-50 text-amber-950 text-center w-60">
                          41% - 65%<br />
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            Belum Tuntas (Remedial Terarah)
                          </span>
                        </th>
                        <th className="border border-slate-300 p-2.5 bg-emerald-50 text-emerald-950 text-center w-64 ring-2 ring-emerald-500/30">
                          66% - 85% [STANDAR KKTP]<br />
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">
                            Tuntas Belajar (Lanjut TP)
                          </span>
                        </th>
                        <th className="border border-slate-300 p-2.5 bg-blue-50 text-blue-950 text-center w-60">
                          86% - 100%<br />
                          <span className="text-[10px] font-bold text-blue-700 uppercase">
                            Melampaui (Pengayaan HOTS)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => {
                        const isSelected = selectedTPIds.includes(item.kodeTP);
                        return (
                          <tr
                            key={item.id || idx}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isSelected ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            <td className="border border-slate-300 p-2 text-center align-top no-print">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTPIds([...selectedTPIds, item.kodeTP]);
                                  } else {
                                    setSelectedTPIds(selectedTPIds.filter((id) => id !== item.kodeTP));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="border border-slate-300 p-2 text-center align-top font-bold text-slate-800">
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-indigo-700 font-mono">
                                {item.kodeTP}
                              </span>
                            </td>
                            <td className="border border-slate-300 p-2.5 align-top space-y-1.5">
                              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                                [{item.elemen}]
                              </div>
                              <div className="font-semibold text-slate-900 leading-snug">
                                {formatTPWithCode(item.kodeTP, item.rumusanTP)}
                              </div>
                              <div className="text-[11px] text-slate-500 pt-0.5">
                                <span className="font-semibold text-slate-700">Materi:</span> {item.lingkupMateri} &bull;{' '}
                                <span className="font-semibold text-slate-700">Alokasi:</span> {item.alokasiJP} JP &bull;{' '}
                                <span className="font-semibold text-slate-700">Semester:</span> {item.semester}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                                  {item.intervalNilai?.kesimpulanInterval ||
                                    'KKTP: Interval 66% - 85% (Tuntas Belajar)'}
                                </span>
                                {item.bentukPenilaian && (
                                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {item.bentukPenilaian}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2.5 align-top bg-rose-50/40 text-slate-800 leading-relaxed text-justify text-[11px]">
                              <div className="space-y-1">
                                <div>{item.intervalNilai?.interval0_40 || '-'}</div>
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2.5 align-top bg-amber-50/40 text-slate-800 leading-relaxed text-justify text-[11px]">
                              <div className="space-y-1">
                                <div>{item.intervalNilai?.interval41_65 || '-'}</div>
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2.5 align-top bg-emerald-50/50 text-slate-900 leading-relaxed text-justify text-[11px] font-medium ring-1 ring-emerald-500/20">
                              <div className="space-y-1">
                                <div>{item.intervalNilai?.interval66_85 || '-'}</div>
                              </div>
                            </td>
                            <td className="border border-slate-300 p-2.5 align-top bg-blue-50/40 text-slate-800 leading-relaxed text-justify text-[11px]">
                              <div className="space-y-1">
                                <div>{item.intervalNilai?.interval86_100 || '-'}</div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Toolbar underneath Cara Ketiga Table */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-800">{selectedTPIds.length} TP Terpilih</strong> dari{' '}
                  {kktp.kktpList.length} total TP untuk perancangan Modul Ajar dan Asesmen.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onProceedToModulAjar(selectedTPIds)}
                    disabled={selectedTPIds.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                  >
                    <span>Lanjut Buat Modul Ajar Berdasarkan KKTP ({selectedTPIds.length} TP)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* TAB CONTENT 3: INTERVAL DARI RUBRIK DENGAN SIMULASI (SLIDE 18-21) */}
        {/* ======================================================== */}
        {activeTab === 'rubrik_interval' && (
          <div className="p-6 space-y-5">
            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-lg text-xs text-purple-950 flex items-start gap-2.5">
              <Calculator className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="font-bold text-purple-900 text-sm">
                  Cara Penetapan KKTP 3: Interval Nilai yang Diolah dari Rubrik (Slide 18-21)
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Pendidik menggunakan rubrik ketercapaian dengan 4 kriteria eviden. Setiap kriteria dinilai menggunakan 4 skala bobot:
                  <strong> 1 (Belum Muncul)</strong>, <strong>2 (Muncul Sebagian Kecil)</strong>, <strong>3 (Sudah Muncul di Sebagian Besar)</strong>, 
                  dan <strong>4 (Terlihat pada Keseluruhan Teks/Karya)</strong>. 
                  Skor maksimal adalah 16 (4 kriteria &times; 4). Nilai dihitung dengan rumus: 
                  <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold mx-1">
                    (Skor Diperoleh / 16) &times; 100
                  </code>.
                  Hasil nilai kemudian dicocokkan dengan skala interval untuk menetapkan ketuntasan dan intervensi.
                </div>
              </div>
            </div>

            {/* Interactive Simulation Panel */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50/30 border-2 border-purple-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    Simulasi & Kalkulator Penilaian Interval dari Rubrik
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pilih Tujuan Pembelajaran dan klik nilai bobot untuk menghitung skor & status ketuntasan otomatis
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Pilih TP:</span>
                  <select
                    value={simulasiSelectedTPIndex}
                    onChange={(e) => setSimulasiSelectedTPIndex(Number(e.target.value))}
                    className="bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {kktp.kktpList.map((tp, idx) => (
                      <option key={tp.id || idx} value={idx}>
                        TP {tp.kodeTP} - {tp.lingkupMateri}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target TP Info */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  {formatTPWithCode(currentSimulasiTP?.kodeTP, currentSimulasiTP?.rumusanTP)}
                </div>
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700">Materi:</span> {currentSimulasiTP?.lingkupMateri} &bull; <span className="font-semibold text-slate-700">Elemen:</span> {currentSimulasiTP?.elemen}
                </div>
              </div>

              {/* Criteria Scoring Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Beri Skor Pada 4 Kriteria Ketuntasan (Skala Bobot 1 s.d. 4):
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    `1. Menunjukkan pemahaman konsep dasar dan istilah materi ${currentSimulasiTP?.lingkupMateri}`,
                    `2. Menunjukkan kemampuan prosedur penyelesaian secara runtut dan terstruktur`,
                    `3. Menjelaskan hasil penalaran atau pemecahan masalah secara logis`,
                    `4. Mengaplikasikan pemahaman ke dalam situasi / persoalan kontekstual nyata`,
                  ].map((critTitle, critIdx) => {
                    const currentScore = currentCriteriaScores[critIdx];
                    return (
                      <div
                        key={critIdx}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="font-semibold text-slate-800 leading-snug">
                          {critTitle}
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {[
                            { val: 1, label: '1 - Belum Muncul' },
                            { val: 2, label: '2 - Sebagian Kecil' },
                            { val: 3, label: '3 - Sebagian Besar' },
                            { val: 4, label: '4 - Terlihat Utuh' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              onClick={() => handleScoreChange(critIdx, opt.val)}
                              className={`py-1.5 px-1 rounded text-center text-[10px] font-bold border transition-all ${
                                currentScore === opt.val
                                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              {opt.val}
                              <div className="text-[9px] font-normal leading-tight hidden sm:block">
                                {opt.val === 1 ? 'Belum' : opt.val === 2 ? 'Kecil' : opt.val === 3 ? 'Besar' : 'Utuh'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="bg-white border-2 border-purple-300 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hasil Perhitungan Simulasi Nilai:
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      Skor: {totalSimulasiScore} / {maxSimulasiScore}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      Rumus: ({totalSimulasiScore} / 16) &times; 100 =
                    </span>
                    <span className="text-3xl font-black text-purple-700">
                      {calculatedPercentage}
                    </span>
                  </div>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kategori Interval & Status KKTP:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${simulasiCategory.badgeColor}`}>
                      {simulasiCategory.label} : {simulasiCategory.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 max-w-md pt-0.5">
                    <strong>Tindak Lanjut:</strong> {simulasiCategory.intervensi}
                  </p>
                </div>
              </div>
            </div>

            {/* Table of Criteria & Weights for All TPs */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Struktur Kriteria & Bobot Rubrik Untuk Seluruh Butir TP:
              </div>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-2.5 text-center w-16">Kode</th>
                    <th className="border border-slate-300 p-2.5 w-64">Tujuan Pembelajaran</th>
                    <th className="border border-slate-300 p-2.5">Kriteria 1 (Konsep)</th>
                    <th className="border border-slate-300 p-2.5">Kriteria 2 (Prosedur)</th>
                    <th className="border border-slate-300 p-2.5">Kriteria 3 (Penalaran)</th>
                    <th className="border border-slate-300 p-2.5">Kriteria 4 (Kontekstual)</th>
                    <th className="border border-slate-300 p-2.5 text-center w-28 bg-purple-50 text-purple-950">
                      Skor Maks / KKTP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="border border-slate-300 p-2 text-center align-top font-bold text-slate-800">
                        {item.kodeTP}
                      </td>
                      <td className="border border-slate-300 p-2.5 align-top space-y-0.5">
                        <div className="font-semibold text-slate-900">{formatTPWithCode(item.kodeTP, item.rumusanTP)}</div>
                        <div className="text-[11px] text-slate-500">Materi: {item.lingkupMateri}</div>
                      </td>
                      <td className="border border-slate-300 p-2 align-top text-[11px] text-slate-700">
                        Memahami konsep & istilah kunci (Bobot 1-4)
                      </td>
                      <td className="border border-slate-300 p-2 align-top text-[11px] text-slate-700">
                        Melakukan prosedur penyelesaian terstruktur (Bobot 1-4)
                      </td>
                      <td className="border border-slate-300 p-2 align-top text-[11px] text-slate-700">
                        Menjelaskan hasil penalaran logis (Bobot 1-4)
                      </td>
                      <td className="border border-slate-300 p-2 align-top text-[11px] text-slate-700">
                        Menerapkan dalam situasi kontekstual (Bobot 1-4)
                      </td>
                      <td className="border border-slate-300 p-2 align-top text-center text-[11px] bg-purple-50/50 text-purple-900 font-bold">
                        16 / Interval 66-85%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB CONTENT 4: PENDEKATAN DESKRIPSI KRITERIA (SLIDE 8-10) */}
        {/* ======================================================== */}
        {activeTab === 'deskripsi' && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-emerald-900">
                  Cara Penetapan KKTP 4: Menggunakan Deskripsi Kriteria (Slide 8-10)
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Pendidik menetapkan kriteria ketercapaian yang berisi komponen-komponen penting dari Tujuan Pembelajaran. 
                  Setiap komponen dinilai dengan status <strong>Memadai</strong> atau <strong>Tidak Memadai</strong>.
                  <br />
                  <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded inline-block mt-1">
                    Simpulan Ketuntasan: Peserta didik dianggap tuntas jika minimal 3 dari 4 kriteria memadai (KKTP: 3 dari 4 Kriteria atau 75% Kriteria Terpenuhi). Kategori tidak tuntas jika terdapat 2 kriteria tidak memadai maka perlu intervensi.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
                >
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">
                        TP {item.kodeTP}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">{formatTPWithCode(item.kodeTP, item.rumusanTP)}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Materi: {item.lingkupMateri} &bull; Elemen: {item.elemen}
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5">Kriteria / Komponen Ketercapaian</th>
                        <th className="p-2.5 w-32 text-center bg-rose-50 text-rose-800">Tidak Memadai</th>
                        <th className="p-2.5 w-32 text-center bg-emerald-50 text-emerald-800">Memadai</th>
                        <th className="p-2.5 w-72">Deskripsi Bukti Performa Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {item.kriteriaDeskripsi.map((kd, kIdx) => (
                        <tr key={kIdx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center font-medium text-slate-500">{kIdx + 1}</td>
                          <td className="p-2.5 text-slate-800 font-medium">{kd.kriteria}</td>
                          <td className="p-2.5 text-center bg-rose-50/20">
                            <span className="inline-block w-4 h-4 rounded border border-slate-300" />
                          </td>
                          <td className="p-2.5 text-center bg-emerald-50/20">
                            <Check className="w-4 h-4 text-emerald-600 inline-block font-bold" />
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px] italic">
                            {kd.catatanGuru || 'Menunjukkan pemahaman konsep dan pengerjaan terstruktur.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-3 bg-emerald-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-emerald-950">
                      Simpulan Status KKTP:
                      <span className="font-normal text-emerald-900 ml-1.5">
                        Tuntas jika minimal 3 dari 4 kriteria memadai (75% kriteria terpenuhi).
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Standar: Minimal 3 Kriteria Memadai
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB CONTENT 5: ALTERNATIF TAKSONOMI BLOOM (SLIDE 22) */}
        {/* ======================================================== */}
        {activeTab === 'bloom' && (
          <div className="p-6 space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 p-3.5 rounded-lg text-xs text-cyan-950 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-cyan-900">
                  Alternatif Penetapan KKTP Berdasarkan Taksonomi Bloom (Revisi Anderson) - Slide 22
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Penetapan kriteria dapat memanfaatkan tingkat kompetensi KKO pada Tujuan Pembelajaran (C1 Mengingat, C2 Memahami, C3 Menerapkan, C4 Menganalisis, C5 Mengevaluasi, C6 Mencipta). 
                  Pendidik menyusun tes berjenjang. 
                  <br />
                  <span className="font-bold text-cyan-900 bg-cyan-100/90 px-2 py-0.5 rounded inline-block mt-1">
                    Aturan Ketuntasan: Siswa yang telah dapat mengerjakan tes sampai soal yang berasal dari level KKO kompetensi Tujuan Pembelajaran dinyatakan telah mencapai Tujuan Pembelajaran.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item, idx) => {
                const bloom = item.bloomTaxonomy;
                return (
                  <div
                    key={item.id || idx}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-indigo-700 text-xs">TP {item.kodeTP}</span>
                          <span className="font-bold text-slate-800 text-xs">{formatTPWithCode(item.kodeTP, item.rumusanTP)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Materi: {item.lingkupMateri} &bull; Elemen: {item.elemen}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                        Target KKO: {bloom?.tingkatKKO || 'C3 / C4 (Menerapkan / Menganalisis)'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700">
                      Soal Tes Berjenjang Taksonomi Bloom:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      {[
                        {
                          level: 'C1',
                          label: 'Mengingat',
                          color: 'bg-slate-50 border-slate-200 text-slate-800',
                          badge: 'bg-slate-200 text-slate-700',
                          desc: `Menyebutkan dan mengidentifikasi fakta dasar terkait ${item.lingkupMateri}.`,
                        },
                        {
                          level: 'C2',
                          label: 'Memahami',
                          color: 'bg-blue-50/50 border-blue-200 text-blue-900',
                          badge: 'bg-blue-200 text-blue-800',
                          desc: `Menjelaskan konsep materi ${item.lingkupMateri} dengan bahasa sendiri secara runtut.`,
                        },
                        {
                          level: 'C3',
                          label: 'Menerapkan',
                          color: 'bg-emerald-50/50 border-emerald-200 text-emerald-900',
                          badge: 'bg-emerald-200 text-emerald-800',
                          desc: `Menggunakan prosedur untuk menyelesaikan masalah terkait ${item.lingkupMateri}.`,
                        },
                        {
                          level: 'C4',
                          label: 'Menganalisis',
                          color: 'bg-indigo-50/50 border-indigo-200 text-indigo-900',
                          badge: 'bg-indigo-200 text-indigo-800',
                          desc: `Memeriksa hubungan sebab-akibat atau persoalan kontekstual terkait ${item.lingkupMateri}.`,
                        },
                      ].map((lvl, lIdx) => (
                        <div
                          key={lIdx}
                          className={`p-3 rounded-lg border ${lvl.color} space-y-1.5`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${lvl.badge}`}>
                              {lvl.level}
                            </span>
                            <span className="font-bold text-[11px]">{lvl.label}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {lvl.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 bg-cyan-50/50 border border-cyan-200/60 rounded-lg text-xs text-cyan-950 font-medium">
                      <strong>Ketuntasan KKTP Berjenjang:</strong>{' '}
                      {bloom?.kesimpulanKetuntasan ||
                        `Peserta didik yang mampu mengerjakan tes berjenjang hingga soal tingkat level KKO TP (${bloom?.tingkatKKO || 'C4'}) dinyatakan telah mencapai Tujuan Pembelajaran.`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB CONTENT 6: PANDUAN ASESMEN & RAPOR KURIKULUM MERDEKA */}
        {/* ======================================================== */}
        {activeTab === 'panduan' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asesmen Formatif */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  1. Asesmen Formatif (Assessment For & As Learning)
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {kktp.panduanPelaksanaanAsesmen.langkahAsesmenFormatif.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Asesmen Sumatif */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  2. Asesmen Sumatif (Assessment Of Learning)
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {kktp.panduanPelaksanaanAsesmen.langkahAsesmenSumatif.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="w-5 h-5 bg-emerald-100 text-emerald-700 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pengolahan Nilai Rapor */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-xl p-5 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                3. Mekanisme Pengolahan Nilai & Deskripsi Rapor Kurikulum Merdeka
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {kktp.panduanPelaksanaanAsesmen.pengolahanNilaiRapor}
              </p>
            </div>
          </div>
        )}

        {/* Official Signature Endorsement & KKTP Type Specification Block */}
        <div 
          className="signature-card page-avoid-break p-6 md:p-8 border-t border-slate-200 bg-white space-y-6 break-inside-avoid print:break-inside-avoid print:page-avoid-break"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          {/* Informasi Terkait Jenis KKTP yang Digunakan */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70">
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Informasi Penetapan & Jenis KKTP yang Digunakan
                </h4>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                PPA 2025 &amp; {regCpShort}
              </span>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    1. Skala / Interval Nilai
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Standar kuantitatif asesmen sumatif: <strong>0-40%</strong> (remedial total), <strong>41-65%</strong> (remedial terarah), <strong className="text-emerald-700">66-85% (Tuntas KKTP)</strong>, dan <strong className="text-blue-700">86-100% (Pengayaan)</strong>.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    2. Rubrik Kualitatif 4 Jenjang
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Standar kualitatif bukti belajar: <em>Baru Berkembang</em> (0-60), <em>Layak</em> (61-70), <strong className="text-emerald-700">Cakap</strong> (71-85), dan <em>Mahir</em> (86-100). Murid tuntas jika minimal berada pada jenjang <strong>Cakap</strong>.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    3. Pelaporan & Tindak Lanjut
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    KKTP disusun spesifik per Tujuan Pembelajaran (bukan KKM tunggal). Nilai rapor dinarasikan berdasarkan TP tertinggi yang dikuasai dan TP yang masih membutuhkan pendampingan lanjutan.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Kriteria Ketuntasan Minimal:</strong> Peserta didik dinyatakan <strong>TUNTAS</strong> mencapai Tujuan Pembelajaran apabila perolehan nilai berada pada rentang <strong>Interval 66% – 85%</strong> atau minimal mencapai kriteria <strong>Cakap</strong> pada seluruh indikator/eviden ketercapaian TP.
                </div>
              </div>
            </div>
          </div>

          {/* Official Signatures Grid */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-2">
            <div className="space-y-1">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala Sekolah</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic no-print">(Tanda Tangan & Stempel Sekolah)</span>
              </div>
              <p className="font-extrabold text-slate-900 underline text-sm">{kktp.identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.'}</p>
              <p className="text-slate-500">NIP. {kktp.identitas.nipKepalaSekolah || '196709192008011008'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-600">{kktp.identitas.tempatPenetapan || 'Fatubai'}, {kktp.identitas.tanggalPenetapan || kktp.tanggalDibuat || '22 September 2026'}</p>
              <p className="font-bold text-slate-900">{kktp.identitas.peranGuru || 'Guru Kelas'}</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic no-print">(Tanda Tangan Penyusun)</span>
              </div>
              <p className="font-extrabold text-slate-900 underline text-sm">{kktp.identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}</p>
              <p className="text-slate-500">NIP. {kktp.identitas.nipGuru || '198603012020121005'}</p>
            </div>
          </div>
        </div>
      </div>

      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={kktp.identitas}
        exportType={exportType}
        documentTitle={`KKTP: ${kktp.identitas.mataPelajaran}`}
        onUpdateIdentitas={onUpdateIdentitas}
        onConfirm={handleExportConfirm}
        availableClasses={getClassesForFase(kktp.identitas.fase)}
        itemCountsByClass={countItemsByClass(kktp.kktpList, kktp.identitas.fase)}
        defaultOrientation="landscape"
      />

      <WordDownloadBlockedModal
        isOpen={isWordBlockedModalOpen}
        onClose={() => setIsWordBlockedModalOpen(false)}
        onDownloadPDFInstead={handleDownloadPDF}
        documentTitle={`KKTP: ${kktp.identitas.mataPelajaran}`}
      />
    </div>
  );
};
