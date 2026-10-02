import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Printer,
  Edit3,
  UserCheck,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  School,
  Save,
  X,
  Share2,
} from 'lucide-react';
import {
  StudentInfo,
  ExamSubmission,
  ExamPackage,
  SchoolIdentity,
  TPItem,
} from '../types';
import {
  RaporStudentRow,
  RaporSettings,
  computeRaporData,
  saveRaporOverrides,
  resetRaporOverrides,
  copyRaporToClipboard,
  exportRaporToCSV,
  generateRaporAnalysisPDF,
  StudentAllSubjectsReport,
  computeStudentAllSubjectsReport,
  generateIndividualStudentRaporPDF,
} from '../services/raporService';
import { getStudentList, subscribeToStudentListFromFirestore } from '../services/studentService';
import {
  getAllExamPackages,
  getAllExamSubmissions,
  subscribeToExamSubmissions,
} from '../services/examService';
import { sounds } from '../utils/audioEffects';
import { ExportConfirmModal } from './ExportConfirmModal';
import { PDFLayoutOptions } from '../types';

interface AnalisisNilaiRaporViewProps {
  identitas: SchoolIdentity;
  tpList: TPItem[];
  onOpenIdentityModal?: () => void;
  onNavigateToMonitoring?: () => void;
  onNavigateToRuangMurid?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
}

export const AnalisisNilaiRaporView: React.FC<AnalisisNilaiRaporViewProps> = ({
  identitas,
  tpList,
  onOpenIdentityModal,
  onNavigateToMonitoring,
  onNavigateToRuangMurid,
  onUpdateIdentitas,
}) => {
  // 1. State Data
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // 2. State Filter & Konfigurasi Rapor
  const [settings, setSettings] = useState<RaporSettings>(() => ({
    mataPelajaran: identitas.mataPelajaran || 'Matematika',
    kelas: identitas.kelas || 'VI',
    semester: (identitas.semester as any)?.includes('2') ? 'Semester 2' : 'Semester 1',
    tahunPelajaran: identitas.tahunPelajaran || '2026/2027',
    kktpThreshold: 75,
    bobotFormatif: 50,
    bobotSTS: 25,
    bobotSAS: 25,
  }));

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // 3. Modal Edit Catatan / Nilai Siswa Tertentu
  const [editingStudent, setEditingStudent] = useState<RaporStudentRow | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [editFormatif, setEditFormatif] = useState<number>(0);
  const [editSTS, setEditSTS] = useState<number>(0);
  const [editSAS, setEditSAS] = useState<number>(0);
  const [editTertinggi, setEditTertinggi] = useState<string>('');
  const [editPerluBimbingan, setEditPerluBimbingan] = useState<string>('');
  const [editCatatan, setEditCatatan] = useState<string>('');

  // 3b. Modal Laporan Rapor Per Murid (Seluruh Mata Pelajaran)
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentInfo | null>(null);
  const [studentAllSubjectsReport, setStudentAllSubjectsReport] = useState<StudentAllSubjectsReport | null>(null);

  // 4. Memuat Data dari Layanan
  const loadData = async () => {
    setIsLoading(true);
    try {
      const studentData = getStudentList();
      setStudents(studentData);

      const [pkgData, subData] = await Promise.all([
        getAllExamPackages(),
        getAllExamSubmissions(),
      ]);
      setPackages(pkgData);
      setSubmissions(subData);
    } catch (e) {
      console.warn('Gagal memuat data rapor:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Berlangganan real-time hasil ujian murid dari Firebase Firestore
    const unsubSubmissions = subscribeToExamSubmissions((updatedSubs) => {
      setSubmissions(updatedSubs);
    });

    // Berlangganan real-time daftar murid dari Firebase Firestore
    const unsubStudents = subscribeToStudentListFromFirestore((updatedStudents) => {
      setStudents(updatedStudents);
    });

    return () => {
      unsubSubmissions();
      unsubStudents();
    };
  }, []);

  // Sinkronkan nama mapel bila identitas guru berubah
  useEffect(() => {
    if (identitas.mataPelajaran) {
      setSettings((prev) => ({
        ...prev,
        mataPelajaran: identitas.mataPelajaran || prev.mataPelajaran,
        kelas: identitas.kelas || prev.kelas,
        tahunPelajaran: identitas.tahunPelajaran || prev.tahunPelajaran,
      }));
    }
  }, [identitas.mataPelajaran, identitas.kelas, identitas.tahunPelajaran]);

  // 5. Perhitungan Komprehensif Rapor
  const { rows, activeTPList, stats } = useMemo(() => {
    return computeRaporData(students, submissions, packages, tpList, settings);
  }, [students, submissions, packages, tpList, settings]);

  // Filter Baris Siswa Berdasarkan Pencarian
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) => r.nama.toLowerCase().includes(q) || r.nisn.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  // 6. Handle Aksi Aksi
  const handleCopyClipboard = () => {
    sounds.playSelect();
    const ok = copyRaporToClipboard(rows, activeTPList);
    if (ok) {
      setCopiedSuccess(true);
      sounds.playSuccess();
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  // State konfirmasi Titimangsa & Tahun Pelajaran sebelum unduh dokumen nilai rapor
  const [raporExportModal, setRaporExportModal] = useState<{
    isOpen: boolean;
    exportType: 'CSV' | 'PDF';
    target: 'rekap-csv' | 'rekap-pdf' | 'murid-pdf';
    title: string;
  } | null>(null);

  const handleOpenExportConfirm = (target: 'rekap-csv' | 'rekap-pdf' | 'murid-pdf', type: 'CSV' | 'PDF') => {
    let title = '';
    if (target === 'rekap-csv') {
      title = `Ekspor Data Nilai Rapor (${settings.mataPelajaran})`;
    } else if (target === 'rekap-pdf') {
      title = `Buku Nilai & Analisis Rapor (${settings.mataPelajaran})`;
    } else {
      title = `Laporan Capaian Belajar Murid: ${selectedStudentForReport?.nama || 'Siswa'}`;
    }
    setRaporExportModal({
      isOpen: true,
      exportType: type,
      target,
      title,
    });
  };

  const handleExportConfirmExecute = (
    tempat: string,
    tanggal: string,
    _selectedKelas?: string,
    layoutOptions?: PDFLayoutOptions,
    tahunPelajaran?: string
  ) => {
    if (!raporExportModal) return;
    const resolvedTP = tahunPelajaran || identitas.tahunPelajaran || settings.tahunPelajaran || '2026/2027';
    const updatedIdentitas: SchoolIdentity = {
      ...identitas,
      tempatPenetapan: tempat,
      tanggalPenetapan: tanggal,
      tahunPelajaran: resolvedTP,
    };
    if (onUpdateIdentitas) {
      onUpdateIdentitas(updatedIdentitas);
    }
    const updatedSettings: RaporSettings = {
      ...settings,
      tahunPelajaran: resolvedTP,
    };
    setSettings(updatedSettings);

    if (raporExportModal.target === 'rekap-csv') {
      sounds.playSelect();
      exportRaporToCSV(rows, activeTPList, updatedSettings);
    } else if (raporExportModal.target === 'rekap-pdf') {
      sounds.playSuccess();
      generateRaporAnalysisPDF({
        identitas: updatedIdentitas,
        settings: updatedSettings,
        rows,
        activeTPList,
        stats,
      });
    } else if (raporExportModal.target === 'murid-pdf' && studentAllSubjectsReport) {
      sounds.playSuccess();
      generateIndividualStudentRaporPDF({
        identitas: updatedIdentitas,
        settings: updatedSettings,
        report: studentAllSubjectsReport,
      });
    }

    setRaporExportModal(null);
  };

  const handleExportCSV = () => {
    handleOpenExportConfirm('rekap-csv', 'CSV');
  };

  const handleDownloadPDF = () => {
    handleOpenExportConfirm('rekap-pdf', 'PDF');
  };

  const handleResetOverrides = () => {
    setShowResetConfirmModal(true);
  };

  // Membuka lembar laporan rapor per murid untuk seluruh mata pelajaran
  const handleOpenStudentAllSubjectsReport = (student: StudentInfo) => {
    sounds.playSelect();
    const rep = computeStudentAllSubjectsReport(student, submissions, packages, settings);
    setSelectedStudentForReport(student);
    setStudentAllSubjectsReport(rep);
  };

  const handleSelectStudentForReportChange = (studentId: string) => {
    const found = students.find((s) => s.id === studentId);
    if (found) {
      sounds.playClick();
      const rep = computeStudentAllSubjectsReport(found, submissions, packages, settings);
      setSelectedStudentForReport(found);
      setStudentAllSubjectsReport(rep);
    }
  };

  const handleDownloadStudentReportPDF = () => {
    if (!studentAllSubjectsReport) return;
    handleOpenExportConfirm('murid-pdf', 'PDF');
  };

  const confirmResetOverrides = () => {
    sounds.playSelect();
    resetRaporOverrides(settings.mataPelajaran, settings.semester);
    loadData();
    setShowResetConfirmModal(false);
  };

  const handleOpenEditModal = (student: RaporStudentRow) => {
    sounds.playClick();
    setEditingStudent(student);
    setEditFormatif(student.nilaiFormatif);
    setEditSTS(student.nilaiSTS);
    setEditSAS(student.nilaiSAS);
    setEditTertinggi(student.capaianTertinggi);
    setEditPerluBimbingan(student.capaianPerluBimbingan);
    setEditCatatan(student.catatanGuru || '');
  };

  const handleSaveStudentEdit = () => {
    if (!editingStudent) return;
    sounds.playSuccess();

    const totalBobot =
      settings.bobotFormatif + settings.bobotSTS + settings.bobotSAS;
    const finalNA = Math.round(
      (editFormatif * settings.bobotFormatif +
        editSTS * settings.bobotSTS +
        editSAS * settings.bobotSAS) /
        (totalBobot || 100)
    );

    const existingOverrides = JSON.parse(
      localStorage.getItem(
        `sipartan_rapor_overrides_${settings.mataPelajaran}_${settings.semester}`.replace(
          /\s+/g,
          '_'
        )
      ) || '{}'
    );

    existingOverrides[editingStudent.studentId] = {
      nilaiFormatif: editFormatif,
      nilaiSTS: editSTS,
      nilaiSAS: editSAS,
      nilaiAkhir: finalNA,
      capaianTertinggi: editTertinggi,
      capaianPerluBimbingan: editPerluBimbingan,
      catatanGuru: editCatatan,
    };

    saveRaporOverrides(
      settings.mataPelajaran,
      settings.semester,
      existingOverrides
    );

    setEditingStudent(null);
    loadData();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* 1. Header Banner & Identitas */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C1733] via-[#0E1F42] to-[#142857] border-2 border-indigo-500/30 p-6 sm:p-8 shadow-2xl text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                Kurikulum Merdeka • PPA Kemdikbudristek
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-400" />
                {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Kelas {identitas.kelas || 'VI'} ({students.length} Murid)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-950/80 text-sky-300 border border-sky-400/30 flex items-center gap-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Firestore: {submissions.length} Nilai Terkoneksi</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Analisis Nilai Rapor &amp; Deskripsi Kemajuan Belajar</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Mengolah data skor latihan harian dan hasil CBT peserta didik secara otomatis
              menjadi deskripsi naratif capaian kompetensi (Capaian Tertinggi &amp; Hal yang Perlu
              Peningkatan) siap pakai untuk e-Rapor dan cetak rapor resmi.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                copiedSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
              }`}
              title="Salin tabel nilai dan deskripsi rapor siap tempel ke format e-Rapor atau Spreadsheet"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Salin Format e-Rapor</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
              title="Unduh data rapor dalam bentuk file Excel CSV"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Ekspor Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (students.length > 0) {
                  handleOpenStudentAllSubjectsReport(students[0]);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25 border border-indigo-400/30"
              title="Buka laporan rekapitulasi nilai rapor per murid untuk seluruh mata pelajaran seperti format buku rapor anak"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>Rapor Per Murid (Semua Mapel)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              title="Unduh laporan analisis rapor resmi ber-Kop Surat SDN Fatubai lengkap tanda tangan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan PDF Resmi</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isConfigOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Atur pembobotan nilai rapor dan ambang batas KKTP"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all"
              title="Sinkronkan nilai CBT terbaru dari server cloud"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Pengaturan Bobot & KKTP Dropdown Drawer */}
        <AnimatePresence>
          {isConfigOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-5 border-t border-indigo-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-950/60 p-4 rounded-2xl"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={settings.mataPelajaran}
                  onChange={(e) =>
                    setSettings({ ...settings, mataPelajaran: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={settings.semester}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      semester: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Semester 1">Semester 1 (Ganjil)</option>
                  <option value="Semester 2">Semester 2 (Genap)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ambang Batas KKTP
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={settings.kktpThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        kktpThreshold: Number(e.target.value) || 75,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-black focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400">Poin</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Bobot Formatif : STS : SAS
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={settings.bobotFormatif}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bobotFormatif: Number(e.target.value) || 0,
                      })
                    }
                    title="Bobot Nilai Formatif / Latihan TP (%)"
                    className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 text-center font-bold"
                  />
                  <input
                    type="number"
                    value={settings.bobotSTS}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bobotSTS: Number(e.target.value) || 0,
                      })
                    }
                    title="Bobot Nilai STS (%)"
                    className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-sky-300 text-center font-bold"
                  />
                  <input
                    type="number"
                    value={settings.bobotSAS}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bobotSAS: Number(e.target.value) || 0,
                      })
                    }
                    title="Bobot Nilai SAS (%)"
                    className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-purple-300 text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleResetOverrides}
                  className="w-full py-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Edit Manual</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Summary Bento Statistik Kelas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rata-rata NA Rapor
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-1">
            <span>{stats.avgNilaiAkhir}</span>
            <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nilai Akhir Klasikal</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rata Formatif (TP)
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {stats.avgFormatif}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {activeTPList.length} TP Aktif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rata STS &amp; SAS
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1 flex items-center gap-2">
            <span>{stats.avgSTS}</span>
            <span className="text-xs text-slate-500 font-normal">|</span>
            <span className="text-purple-400">{stats.avgSAS}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sumatif Tengah &amp; Akhir</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ketuntasan KKTP
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {stats.percentagePassed}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.passedCount} Tuntas • {stats.remedialCount} Remedial
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rentang Nilai
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-1 flex items-baseline gap-1">
            <span>{stats.lowestScore}</span>
            <span className="text-xs text-slate-400 font-normal">-</span>
            <span className="text-emerald-400">{stats.highestScore}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Terendah s.d. Tertinggi</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B38]/80 border border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Distribusi Predikat
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-black">
              A:{stats.predikatCounts.A}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-black">
              B:{stats.predikatCounts.B}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-black">
              C:{stats.predikatCounts.C}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-black">
              D:{stats.predikatCounts.D}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Total {students.length} Siswa</div>
        </div>
      </div>

      {/* 4. Filter & Pencarian Siswa */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E1B38]/90 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama murid atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Tuntas (&ge;{settings.kktpThreshold})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>Perlu Bimbingan (&lt;{settings.kktpThreshold})</span>
          </div>
          {onNavigateToMonitoring && (
            <button
              type="button"
              onClick={onNavigateToMonitoring}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 cursor-pointer transition-colors"
            >
              Lihat Pantauan CBT
            </button>
          )}
        </div>
      </div>

      {/* 5. Tabel Utama Analisis Nilai Rapor & Deskripsi Kurikulum Merdeka */}
      <div className="rounded-3xl bg-[#0A1326] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#0E1B38] to-[#142347] text-slate-300 border-b border-slate-800 font-extrabold uppercase tracking-wider">
                <th className="p-3.5 text-center w-12 shrink-0">No</th>
                <th className="p-3.5 min-w-[190px]">Nama Peserta Didik</th>
                {activeTPList.slice(0, 4).map((tp) => (
                  <th
                    key={tp.kodeTP}
                    className="p-3 text-center min-w-[75px]"
                    title={`${tp.kodeTP}: ${tp.rumusanTP}`}
                  >
                    <div className="text-amber-400 font-black">{tp.kodeTP}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[90px]">
                      {tp.lingkupMateri || 'Materi'}
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[70px] bg-slate-900/60 font-black text-emerald-300">
                  Rata TP
                </th>
                <th className="p-3 text-center min-w-[65px] font-bold text-sky-300">STS</th>
                <th className="p-3 text-center min-w-[65px] font-bold text-purple-300">SAS</th>
                <th className="p-3.5 text-center min-w-[90px] bg-slate-900 font-black text-amber-300">
                  NA Rapor
                </th>
                <th className="p-3.5 min-w-[280px]">
                  Capaian Tertinggi (Penguasaan Sangat Baik)
                </th>
                <th className="p-3.5 min-w-[280px]">
                  Perlu Peningkatan (Perlu Bimbingan)
                </th>
                <th className="p-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRows.map((row, index) => {
                const isPassed = row.nilaiAkhir >= settings.kktpThreshold;
                return (
                  <tr
                    key={row.studentId}
                    className={`hover:bg-[#0E1B38]/50 transition-colors ${
                      row.isCustomized ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    {/* No */}
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">
                      {index + 1}
                    </td>

                    {/* Nama & NISN */}
                    <td className="p-3.5">
                      <div className="font-black text-white text-sm flex items-center gap-1.5">
                        <span>{row.nama}</span>
                        {row.isCustomized && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9.5px] bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30"
                            title="Telah disesuaikan oleh guru"
                          >
                            Edit
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        NISN: {row.nisn}
                      </div>
                    </td>

                    {/* Nilai Tiap TP */}
                    {activeTPList.slice(0, 4).map((tp) => {
                      const scoreItem = row.tpScores[tp.kodeTP];
                      const val = scoreItem ? scoreItem.skor : row.nilaiFormatif;
                      return (
                        <td
                          key={tp.kodeTP}
                          className="p-3 text-center font-mono font-bold"
                        >
                          <span
                            className={`px-2 py-1 rounded-lg text-xs ${
                              val >= settings.kktpThreshold
                                ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
                                : 'text-rose-300 bg-rose-950/40 border border-rose-500/30'
                            }`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })}

                    {/* Rata-rata Formatif */}
                    <td className="p-3 text-center bg-slate-900/60 font-mono font-black text-emerald-300 text-sm">
                      {row.nilaiFormatif}
                    </td>

                    {/* STS */}
                    <td className="p-3 text-center font-mono font-bold text-sky-300">
                      {row.nilaiSTS}
                    </td>

                    {/* SAS */}
                    <td className="p-3 text-center font-mono font-bold text-purple-300">
                      {row.nilaiSAS}
                    </td>

                    {/* Nilai Akhir (NA) & Predikat */}
                    <td className="p-3.5 text-center bg-slate-900/90 font-mono">
                      <div
                        className={`text-base font-black ${
                          isPassed ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {row.nilaiAkhir}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mt-0.5 ${
                          row.predikat === 'A'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : row.predikat === 'B'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            : row.predikat === 'C'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                        }`}
                      >
                        {row.keteranganKKTP} ({row.predikat})
                      </span>
                    </td>

                    {/* Capaian Tertinggi */}
                    <td className="p-3.5 text-slate-200 text-[11.5px] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{row.capaianTertinggi}</span>
                      </div>
                    </td>

                    {/* Capaian Perlu Peningkatan */}
                    <td className="p-3.5 text-slate-300 text-[11.5px] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{row.capaianPerluBimbingan}</span>
                      </div>
                    </td>

                    {/* Tombol Aksi */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const foundStudent = students.find((s) => s.id === row.studentId || s.nisn === row.nisn) || {
                              id: row.studentId,
                              nama: row.nama,
                              nisn: row.nisn,
                              nis: row.nis,
                            };
                            handleOpenStudentAllSubjectsReport(foundStudent);
                          }}
                          className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-500/30 cursor-pointer transition-colors shadow-xs"
                          title="Cetak & Lihat Rekapitulasi Rapor Murid ini untuk Seluruh Mata Pelajaran"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(row)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer transition-colors shadow-xs"
                          title="Edit nilai dan sesuaikan narasi deskripsi murid ini"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Edukasi Format Rapor Kurikulum Merdeka Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-400/30">
            💡
          </div>
          <div>
            <h4 className="text-sm font-black text-white">
              Prinsip Deskripsi Rapor Kurikulum Merdeka (PPA Kemdikbudristek)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-3xl">
              Deskripsi rapor tidak lagi membandingkan peringkat antar anak, melainkan memaparkan
              kompetensi yang <strong>paling dikuasai (Capaian Tertinggi)</strong> serta kompetensi
              yang <strong>masih memerlukan bimbingan (Capaian yang Perlu Peningkatan)</strong>{' '}
              secara bermakna dan memotivasi tumbuh kembang peserta didik.
            </p>
          </div>
        </div>

        {onNavigateToRuangMurid && (
          <button
            type="button"
            onClick={onNavigateToRuangMurid}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold text-xs border border-indigo-400/40 cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Buka Ruang Murid</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 7. Modal Edit Nilai & Deskripsi Rapor Murid Tertentu */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl rounded-3xl bg-[#0C1733] border-2 border-amber-500/40 shadow-2xl p-5 sm:p-6 text-white space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md">
                    ✏️
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Penyesuaian Nilai &amp; Deskripsi Rapor
                    </h3>
                    <p className="text-xs text-amber-300 font-bold">
                      {editingStudent.nama} (NISN: {editingStudent.nisn})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                {/* Form Input Nilai Komponen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    Nilai Formatif (Rata TP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editFormatif}
                    onChange={(e) => setEditFormatif(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400">Bobot {settings.bobotFormatif}%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-300 mb-1">
                    Nilai Sumatif Tengah (STS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editSTS}
                    onChange={(e) => setEditSTS(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-xl bg-slate-950 border border-slate-700 text-sky-400 focus:outline-none focus:border-sky-400"
                  />
                  <span className="text-[10px] text-slate-400">Bobot {settings.bobotSTS}%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">
                    Nilai Sumatif Akhir (SAS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editSAS}
                    onChange={(e) => setEditSAS(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black rounded-xl bg-slate-950 border border-slate-700 text-purple-400 focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[10px] text-slate-400">Bobot {settings.bobotSAS}%</span>
                </div>
              </div>

              {/* Form Narasi Capaian Tertinggi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Deskripsi Capaian Tertinggi (Penguasaan Sangat Baik)</span>
                </label>
                <textarea
                  rows={3}
                  value={editTertinggi}
                  onChange={(e) => setEditTertinggi(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-400"
                  placeholder="Menunjukkan penguasaan yang sangat baik dalam..."
                />
              </div>

              {/* Form Narasi Perlu Peningkatan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Deskripsi Capaian yang Perlu Peningkatan (Bimbingan)</span>
                </label>
                <textarea
                  rows={3}
                  value={editPerluBimbingan}
                  onChange={(e) => setEditPerluBimbingan(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-400"
                  placeholder="Perlu bimbingan dan pendampingan dalam..."
                />
              </div>

              {/* Catatan Tambahan Guru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Catatan Personal Guru (Opsional)
                </label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                  placeholder="Contoh: Tingkatkan ketekunan dalam mengerjakan tugas mandiri di rumah."
                />
              </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentEdit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Penyesuaian Rapor</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Konfirmasi Reset Penyesuaian Rapor */}
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-[#0C1733] border-2 border-amber-500/60 shadow-2xl p-6 text-white space-y-4 my-auto max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
                  <RotateCcw className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reset Penyesuaian Rapor</h3>
                  <p className="text-xs text-slate-400">Kembalikan ke nilai asli CBT</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs space-y-2 text-slate-300">
                <p className="leading-relaxed">
                  Apakah Anda yakin ingin mengembalikan seluruh nilai dan deskripsi rapor ke <strong>hasil murni pengerjaan CBT</strong> peserta didik?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmResetOverrides}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ya, Reset ke Nilai Murni</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Laporan Rapor Per Murid Untuk Seluruh Mata Pelajaran */}
        {selectedStudentForReport && studentAllSubjectsReport && (
          <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl rounded-3xl bg-[#091224] border-2 border-indigo-500/50 shadow-2xl p-5 sm:p-6 text-white my-auto max-h-[94vh] flex flex-col gap-4 overflow-hidden"
            >
              {/* Header Modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
                    <UserCheck className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        Buku Rapor Siswa • Kurikulum Merdeka
                      </span>
                      <span className="text-xs text-slate-400">
                        NISN: {studentAllSubjectsReport.student.nisn || '-'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      Laporan Hasil Belajar: {studentAllSubjectsReport.student.nama}
                    </h3>
                  </div>
                </div>

                {/* Kontrol Navigasi Murid & Aksi Unduh */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-[11px] font-bold text-slate-400">Ganti Murid:</span>
                    <select
                      value={selectedStudentForReport.id}
                      onChange={(e) => handleSelectStudentForReportChange(e.target.value)}
                      className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.nama} ({s.nisn || s.nis || '-'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadStudentReportPDF}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    title="Cetak format lembar rapor anak resmi PDF A4 ber-Kop Surat dan Tanda Tangan"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Rapor PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForReport(null);
                      setStudentAllSubjectsReport(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Rangkuman Data Identitas & Kartu Ringkasan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Satuan Pendidikan</div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">
                    {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
                  </div>
                  <div className="text-[10px] text-slate-400">Kelas {identitas.kelas || 'VI'} • {settings.semester}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Nilai Akhir</div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    {studentAllSubjectsReport.rataRataNilaiAkhir}
                    <span className="text-xs text-slate-400 font-semibold ml-1.5">
                      (Predikat {studentAllSubjectsReport.predikatUmum})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Skala 100 • KKTP &ge; {settings.kktpThreshold}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ketuntasan Mata Pelajaran</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {studentAllSubjectsReport.jumlahTuntas} Tuntas
                    {studentAllSubjectsReport.jumlahBelumTuntas > 0 && (
                      <span className="text-xs text-rose-400 font-bold ml-1.5">
                        • {studentAllSubjectsReport.jumlahBelumTuntas} Perlu Remedial
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">Dari {studentAllSubjectsReport.totalMataPelajaran} Mata Pelajaran</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Guru Kelas / Wali Kelas</div>
                  <div className="text-xs font-bold text-indigo-300 truncate mt-0.5">
                    {identitas.namaGuru || 'Yohanes Pantola, S.Pd.SD'}
                  </div>
                  <div className="text-[10px] text-slate-400">Tahun Ajaran {settings.tahunPelajaran}</div>
                </div>
              </div>

              {/* Tabel Lembar Rapor Seluruh Mata Pelajaran */}
              <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#121F3D] text-slate-300 text-[11px] font-bold sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="p-3 text-center w-10">No</th>
                      <th className="p-3 min-w-[170px]">Mata Pelajaran</th>
                      <th className="p-3 text-center w-14">Formatif</th>
                      <th className="p-3 text-center w-14">STS</th>
                      <th className="p-3 text-center w-14">SAS</th>
                      <th className="p-3 text-center w-16 text-amber-300">Nilai Akhir</th>
                      <th className="p-3 text-center w-14">Predikat</th>
                      <th className="p-3 min-w-[320px]">Deskripsi Capaian Kompetensi (Kurikulum Merdeka)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {studentAllSubjectsReport.subjectItems.map((item, idx) => {
                      const isPassed = item.nilaiAkhir >= settings.kktpThreshold;
                      return (
                        <tr key={item.mataPelajaran} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>{item.mataPelajaran}</span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-300">
                            {item.nilaiFormatif > 0 ? item.nilaiFormatif : '-'}
                          </td>
                          <td className="p-3 text-center font-mono text-sky-300">
                            {item.nilaiSTS > 0 ? item.nilaiSTS : '-'}
                          </td>
                          <td className="p-3 text-center font-mono text-purple-300">
                            {item.nilaiSAS > 0 ? item.nilaiSAS : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-sm">
                            <span className={item.nilaiAkhir > 0 ? (isPassed ? 'text-amber-400' : 'text-rose-400') : 'text-slate-500'}>
                              {item.nilaiAkhir > 0 ? item.nilaiAkhir : '-'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.nilaiAkhir > 0 ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  item.predikat === 'A'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : item.predikat === 'B'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : item.predikat === 'C'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {item.predikat}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] leading-relaxed text-slate-300 space-y-1">
                            {item.nilaiAkhir > 0 ? (
                              <>
                                <div className="flex items-start gap-1.5 text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                                  <span>{item.capaianTertinggi}</span>
                                </div>
                                <div className="flex items-start gap-1.5 text-amber-200">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                                  <span>{item.capaianPerluBimbingan}</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-500 italic">
                                Belum ada riwayat asesmen CBT yang terekam pada mata pelajaran ini.
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan Akademik & Karakter Profil Pelajar Pancasila */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Catatan Wali Kelas &amp; Profil Pelajar Pancasila:</span>
                  </div>
                  <p className="text-slate-300 italic text-[11px]">
                    &ldquo;Ananda {studentAllSubjectsReport.student.nama} menunjukkan budi pekerti yang santun, kepedulian sosial yang tinggi, dan dedikasi belajar yang patut diapresiasi. Tingkatkan terus kedisiplinan dan literasi numerasi di semester mendatang!&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadStudentReportPDF}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Unduh Lembar Rapor Resmi (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForReport(null);
                      setStudentAllSubjectsReport(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Titimangsa & Tahun Pelajaran Sebelum Download Rapor */}
      {raporExportModal && (
        <ExportConfirmModal
          isOpen={raporExportModal.isOpen}
          onClose={() => setRaporExportModal(null)}
          identitas={identitas}
          exportType={raporExportModal.exportType}
          documentTitle={raporExportModal.title}
          onUpdateIdentitas={onUpdateIdentitas}
          onConfirm={handleExportConfirmExecute}
          showClassSelector={false}
          defaultOrientation={raporExportModal.target === 'murid-pdf' ? 'portrait' : 'landscape'}
        />
      )}
    </div>
  );
};
