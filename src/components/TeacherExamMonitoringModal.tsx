import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Eye,
  Filter,
  BarChart3,
  Calendar,
  Sparkles,
  Cloud,
  Image as ImageIcon,
  Check,
  Power,
  Trash2,
  Layers,
  BookOpen,
  PlusCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { StudentInfo, ExamSubmission, ExamPackage, SchoolIdentity, KisiKisiSoalDocument } from '../types';
import { getStudentList } from '../services/studentService';
import {
  getAllExamPackages,
  getAllExamSubmissions,
  toggleExamPackageStatus,
  deleteExamPackage,
} from '../services/examService';
import { generateStudentExamReportPDF } from '../utils/studentReportPdfGenerator';
import { StudentExamReviewModal } from './StudentExamReviewModal';
import { sounds } from '../utils/audioEffects';

interface TeacherExamMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  soalDocument?: KisiKisiSoalDocument | null;
  onOpenLogoUpload?: () => void;
  onOpenRaporAnalysis?: () => void;
  onNavigateToSoalTab?: () => void;
}

// Helper ekstraksi nama dan NISN yang 100% aman (mencegah crash undefined.trim())
const getSubmissionStudentName = (sub: ExamSubmission | null | undefined): string => {
  if (!sub) return '';
  return (sub.namaSiswa || (sub as any).siswaNama || '').trim();
};

const getSubmissionStudentNisn = (sub: ExamSubmission | null | undefined): string => {
  if (!sub) return '';
  return (sub.nisn || (sub as any).siswaNisn || '').trim();
};

const getSubmissionPackageId = (sub: ExamSubmission | null | undefined): string => {
  if (!sub) return '';
  return sub.paketId || (sub as any).packageId || '';
};

const isSubmissionForStudent = (sub: ExamSubmission | null | undefined, stu: StudentInfo): boolean => {
  if (!sub || !stu) return false;
  const sNisn = getSubmissionStudentNisn(sub);
  const sName = getSubmissionStudentName(sub).toLowerCase();
  const stuNisn = (stu.nisn || stu.nis || '').trim();
  const stuName = (stu.nama || '').trim().toLowerCase();

  if (stuNisn && sNisn && stuNisn === sNisn) return true;
  if (stuName && sName && stuName === sName) return true;
  return false;
};

export const TeacherExamMonitoringModal: React.FC<TeacherExamMonitoringModalProps> = ({
  isOpen,
  onClose,
  identitas: rawIdentitas,
  soalDocument,
  onOpenLogoUpload,
  onOpenRaporAnalysis,
  onNavigateToSoalTab,
}) => {
  const identitas: SchoolIdentity = rawIdentitas || {
    namaSatuanPendidikan: 'SD Negeri Fatubai',
    namaGuru: 'Yohanes Pantola, S.Pd.SD',
    nipGuru: '19870504 201101 1 008',
    namaKepalaSekolah: 'Theresia Opat, S.Pd.SD',
    nipKepalaSekolah: '19740312 199803 2 005',
    mataPelajaran: 'Matematika',
    fase: 'Fase C',
    kelas: 'VI',
    semester: '1 (Ganjil)',
    tahunPelajaran: '2026/2027',
  };
  const [activeTab, setActiveTab] = useState<'monitoring' | 'packages'>('monitoring');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [packages, setPackages] = useState<ExamPackage[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kktpThreshold, setKktpThreshold] = useState(75);
  const [packageToDelete, setPackageToDelete] = useState<ExamPackage | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewPackage, setActiveReviewPackage] = useState<ExamPackage | null>(null);
  const [activeReviewSubmission, setActiveReviewSubmission] = useState<ExamSubmission | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const stuList = getStudentList();
      setStudents(stuList || []);

      const [pkgs, subs] = await Promise.all([
        getAllExamPackages().catch(() => []),
        getAllExamSubmissions().catch(() => []),
      ]);
      setPackages(pkgs || []);
      setSubmissions(subs || []);
    } catch (e) {
      console.warn('Gagal memuat pantauan ujian:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPackage =
    selectedPackageId !== 'all'
      ? packages.find((p) => p.id === selectedPackageId) || null
      : null;

  // Filter submissions by package (menggunakan helper aman)
  const filteredSubmissions =
    selectedPackageId !== 'all'
      ? submissions.filter((s) => getSubmissionPackageId(s) === selectedPackageId)
      : submissions;

  // Search filter for students
  const filteredStudents = (students || []).filter(
    (stu) =>
      (stu.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stu.nisn || stu.nis || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate quick stats with 100% crash protection
  const completedStudents = (students || []).filter((stu) =>
    filteredSubmissions.some((sub) => isSubmissionForStudent(sub, stu))
  );

  const completedScores = completedStudents.map((stu) => {
    const sub = filteredSubmissions.find((s) => isSubmissionForStudent(s, stu));
    if (!sub) return 0;
    return typeof sub.nilaiAkhir === 'number' ? sub.nilaiAkhir : 0;
  });

  const avgScore =
    completedScores.length > 0
      ? Math.round(
          (completedScores.reduce((a, b) => a + b, 0) / completedScores.length) * 10
        ) / 10
      : 0;

  const passedStudents = completedScores.filter((score) => score >= kktpThreshold);
  const passPercentage =
    completedStudents.length > 0
      ? Math.round((passedStudents.length / completedStudents.length) * 100)
      : 0;

  const handleDownloadPDF = () => {
    sounds.playSuccess();
    generateStudentExamReportPDF({
      identitas,
      selectedPackage: currentPackage,
      students,
      submissions,
      kktpThreshold,
    });
  };

  const handleOpenReview = (submission: ExamSubmission) => {
    sounds.playSelect();
    const pkgId = getSubmissionPackageId(submission);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setActiveReviewPackage(pkg);
      setActiveReviewSubmission(submission);
      setReviewModalOpen(true);
    } else {
      // Jika paket ujian telah diubah atau tidak ditemukan, tetap buka dengan fallback aman
      setActiveReviewPackage({
        id: pkgId,
        kodeAksesGuru: '',
        judul: submission.judulPaket || 'Ujian Digital CBT',
        kategori: submission.jenisAsesmen || 'formatif',
        mataPelajaran: submission.mataPelajaran || identitas.mataPelajaran,
        kelas: submission.kelas || identitas.kelas,
        fase: identitas.fase,
        semester: '1',
        jenisAsesmen: (submission.jenisAsesmen || 'Asesmen Formatif') as any,
        daftarTP: submission.daftarTP || [],
        durasiMenit: 60,
        isActive: true,
        soalDocument: soalDocument || ({} as any),
        createdAt: submission.submittedAt || new Date().toISOString(),
        totalSoal: submission.jawabanList?.length || 0,
      });
      setActiveReviewSubmission(submission);
      setReviewModalOpen(true);
    }
  };

  const handleTogglePackage = async (pkg: ExamPackage) => {
    sounds.playClick();
    const updated = await toggleExamPackageStatus(pkg.id, !pkg.isActive);
    setPackages((prev) =>
      prev.map((p) => (p.id === pkg.id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleDeletePackageConfirm = async () => {
    if (!packageToDelete) return;
    sounds.playSelect();
    await deleteExamPackage(packageToDelete.id);
    setPackages((prev) => prev.filter((p) => p.id !== packageToDelete.id));
    if (selectedPackageId === packageToDelete.id) {
      setSelectedPackageId('all');
    }
    setPackageToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-5xl rounded-3xl bg-[#0A1326] border-2 border-blue-500/40 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-[#0E1B38] via-[#0A162D] to-[#0E1B38] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Ruang Guru • Pusat Kendali CBT &amp; Nilai
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5" />
                  Cloud Firestore Real-Time
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Pantauan Hasil Evaluasi CBT &amp; Rekap Nilai Siswa
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLogoUpload && (
              <button
                type="button"
                onClick={onOpenLogoUpload}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  identitas.logoUrl
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                    : 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/80'
                }`}
                title={
                  identitas.logoUrl
                    ? 'Logo resmi Kop surat aktif pada PDF. Klik untuk ganti atau lihat pratinjau.'
                    : 'Belum ada logo pada Kop Surat. Klik untuk unggah logo JPG/PNG.'
                }
              >
                {identitas.logoUrl ? (
                  <>
                    <img
                      src={identitas.logoUrl}
                      alt="Logo"
                      className="w-4 h-4 object-contain rounded-xs"
                    />
                    <span className="hidden sm:inline">Logo Kop Aktif</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Unggah Logo Kop</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all"
              title="Perbarui data terbaru"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {onOpenRaporAnalysis && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRaporAnalysis();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
                title="Buka Analisis Nilai Rapor & Deskripsi Kemajuan Belajar Format Kurikulum Merdeka"
              >
                <span>📈</span>
                <span className="hidden md:inline">Analisis Rapor</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              title="Unduh rekapitulasi nilai tertata rapih dan akademis dalam format PDF"
            >
              <Download className="w-4 h-4" />
              <span>Download Laporan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu: Pantauan vs Kelola Paket Ujian */}
        <div className="px-6 py-2.5 bg-[#080F1F] border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('monitoring');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'monitoring'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Hasil Nilai Murid ({submissions.length} Selesai)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('packages');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'packages'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kelola Paket Soal CBT ({packages.length} Paket)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Semua paket yang diaktifkan otomatis muncul di Ruang Murid</span>
          </div>
        </div>

        {activeTab === 'monitoring' ? (
          <>
            {/* Filter & Metric Ribbon */}
            <div className="p-4 bg-[#070e1c] border-b border-slate-800 space-y-3 shrink-0">
              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Package Selector */}
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Pilih Paket Ujian:</span>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0E1B38] border border-blue-500/40 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">-- Semua Paket &amp; Evaluasi Harian --</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        [{pkg.mataPelajaran || identitas.mataPelajaran}] {pkg.judul} ({(pkg.kategori || 'formatif').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Student */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / NISN murid..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0E1B38] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* KKTP Standard */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                  <span>Batas KKTP:</span>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={kktpThreshold}
                    onChange={(e) => setKktpThreshold(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-[#0E1B38] border border-slate-700 text-xs text-center font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Metric Cards Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#0E1B38]/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                    👥
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold">Total Murid Terdaftar</p>
                    <p className="text-base font-black text-white">{students.length} Siswa</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E1B38]/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    ✅
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold">Sudah Mengerjakan</p>
                    <p className="text-base font-black text-emerald-400">
                      {completedStudents.length} / {students.length}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E1B38]/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    ⭐
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold">Rata-rata Nilai</p>
                    <p className="text-base font-black text-amber-400">{avgScore > 0 ? avgScore : '-'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0E1B38]/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                    🎯
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold">Ketuntasan KKTP</p>
                    <p className="text-base font-black text-indigo-300">{passPercentage}% Tuntas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#070e1c]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E1B38] text-slate-300 uppercase tracking-wider font-extrabold text-[10.5px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-4">Nama Lengkap Murid</th>
                      <th className="py-3 px-3 text-center">NISN</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Nilai CBT</th>
                      <th className="py-3 px-3 text-center">Capaian KKTP</th>
                      <th className="py-3 px-3 text-center">Waktu Kirim</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          Tidak ada data murid yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((stu, idx) => {
                        const stuSubs = filteredSubmissions.filter((sub) =>
                          isSubmissionForStudent(sub, stu)
                        );
                        const latest = stuSubs.length > 0 ? stuSubs[0] : null;
                        const isDone = Boolean(latest);
                        const score = latest ? Math.round(latest.nilaiAkhir) : null;
                        const isPassed = score !== null && score >= kktpThreshold;
                        const submitTime = latest?.waktuKirim || latest?.submittedAt;
                        const timeFormatted =
                          submitTime && !isNaN(new Date(submitTime).getTime())
                            ? new Date(submitTime).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-';

                        return (
                          <tr
                            key={stu.id || `stu-${idx}`}
                            className="hover:bg-blue-950/20 transition-colors"
                          >
                            <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-black shrink-0">
                                {(stu.nama || '?').charAt(0)}
                              </div>
                              <span>{stu.nama}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-400">
                              {stu.nisn || stu.nis || '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Sudah Kirim
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  Belum Ujian
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {score !== null ? (
                                <span
                                  className={`text-sm font-black ${
                                    isPassed ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {score}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {score !== null ? (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    isPassed
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {isPassed ? 'TUNTAS' : 'BELUM TUNTAS'}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center text-[11px] text-slate-400 font-mono">
                              {isDone ? timeFormatted : '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {latest ? (
                                <button
                                  onClick={() => handleOpenReview(latest)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-white border border-blue-500/40 text-[10.5px] font-bold cursor-pointer transition-colors flex items-center gap-1 mx-auto"
                                  title="Tinjau lembar jawaban dan capaian per indikator"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat Jawaban</span>
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[11px] italic">Menunggu</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: KELOLA PAKET SOAL CBT (GURU) */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070e1c] p-4 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📦</span>
                  <span>Daftar Paket Ujian &amp; Penugasan CBT</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aktifkan paket agar dapat dikerjakan siswa di Ruang Murid. Paket yang dinonaktifkan tidak akan terlihat oleh siswa.
                </p>
              </div>

              {onNavigateToSoalTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToSoalTab();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Susun Soal Baru di Tab 9</span>
                </button>
              )}
            </div>

            {packages.length === 0 ? (
              <div className="p-8 text-center bg-[#070e1c] rounded-2xl border border-dashed border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto text-2xl">
                  📝
                </div>
                <h4 className="text-sm font-bold text-white">Belum Ada Paket Ujian CBT</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Anda dapat menyusun soal pada Menu 9 (Kisi-Kisi &amp; Soal CBT) di Ruang Guru, lalu klik tombol "Terbitkan ke CBT Ruang Murid".
                </p>
                {onNavigateToSoalTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToSoalTab();
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Buka Tab 9: Kisi-Kisi &amp; Soal CBT</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {packages.map((pkg) => {
                  const subCount = submissions.filter((s) => getSubmissionPackageId(s) === pkg.id).length;
                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        pkg.isActive
                          ? 'bg-[#0E1B38] border-emerald-500/50 shadow-md shadow-emerald-500/5'
                          : 'bg-slate-900/60 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                pkg.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {pkg.isActive ? '● AKTIF DI RUANG MURID' : '○ TIDAK AKTIF'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {(pkg.kategori || 'formatif').toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Kelas {pkg.kelas || identitas.kelas}
                            </span>
                          </div>

                          <h5 className="text-sm font-black text-white truncate" title={pkg.judul}>
                            {pkg.judul}
                          </h5>
                          <p className="text-xs text-amber-400 font-bold mt-0.5">
                            {pkg.mataPelajaran || identitas.mataPelajaran}
                          </p>
                        </div>

                        {/* Toggle Status Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePackage(pkg)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            pkg.isActive
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title={pkg.isActive ? 'Nonaktifkan paket ini dari murid' : 'Aktifkan paket ini untuk murid'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>⏱️ {pkg.durasiMenit || 60} Menit</span>
                          <span>📝 {pkg.totalSoal || 0} Soal</span>
                          <span className="text-emerald-400 font-bold">
                            ✅ {subCount} Murid Selesai
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPackageToDelete(pkg)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Hapus paket ujian ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer info bar */}
        <div className="p-4 bg-[#070e1c] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-400">
            <span className="font-bold text-white">Sinkronisasi Otomatis:</span> Setiap jawaban murid yang dikirim langsung tersinkron secara instan ke portal guru ini.
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs cursor-pointer hover:brightness-110 flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cetak Rekap Nilai Resmi (PDF)</span>
          </button>
        </div>
      </motion.div>

      {/* Student Review Modal */}
      {reviewModalOpen && activeReviewPackage && activeReviewSubmission && (
        <StudentExamReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          pkg={activeReviewPackage}
          submission={activeReviewSubmission}
        />
      )}

      {/* Delete Package Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1B38] border-2 border-rose-500/50 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base">Hapus Paket Ujian?</h4>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus paket <strong className="text-white">"{packageToDelete.judul}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePackageConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition-colors cursor-pointer shadow-md"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

