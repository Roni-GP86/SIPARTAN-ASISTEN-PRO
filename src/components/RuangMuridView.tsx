import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Award,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  Send,
  Eye,
  KeyRound,
  Trash2,
  GraduationCap,
  Calendar,
  Layers,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  Heart,
  Star,
  LogOut,
  UserCheck,
  Target,
} from 'lucide-react';
import {
  ExamPackage,
  ExamSubmission,
  KisiKisiSoalDocument,
  SchoolIdentity,
  StudentInfo,
  StudentReadingMaterial,
  TPItem,
  ATPDocument,
  AccessRecord,
} from '../types';
import {
  getAllExamPackages,
  getAllExamSubmissions,
  subscribeToExamPackages,
  subscribeToExamSubmissions,
  toggleExamPackageStatus,
  deleteExamPackage,
  deleteExamSubmission,
  evaluateStudentExam,
  submitExamSubmission,
  exportSubmissionsToCSV,
  DEFAULT_STUDENT_READINGS,
} from '../services/examService';
import { getStudentList, subscribeToStudentListFromFirestore } from '../services/studentService';
import { generateStudentExamReportPDF } from '../utils/studentReportPdfGenerator';
import { sounds } from '../utils/audioEffects';
import { motion, AnimatePresence } from 'motion/react';
import { AutoGenerateExerciseModal } from './AutoGenerateExerciseModal';
import { StudentExamReviewModal } from './StudentExamReviewModal';
import {
  isRuangMuridEnabled,
  isStudentAuthenticatedForRuangMurid,
  subscribeToRuangMuridPolicy,
} from '../services/ruangMuridPolicyService';
import { RuangMuridDeactivatedModal } from './RuangMuridDeactivatedModal';
import { RuangMuridPasscodeModal } from './RuangMuridPasscodeModal';
import { ExamSubmissionSuccessModal } from './ExamSubmissionSuccessModal';
import { KamarBahanAjarView } from './KamarBahanAjarView';
import { ErrorBoundary } from './ErrorBoundary';
import { TeacherAccessModal } from './TeacherAccessModal';

interface RuangMuridViewProps {
  identitas: SchoolIdentity;
  tpList?: TPItem[];
  atpDocument?: ATPDocument | null;
  soalDocument: KisiKisiSoalDocument | null;
  activeAccessRecord?: AccessRecord | null;
  onSwitchToRuangGuru: () => void;
  showToast: (msg: string) => void;
}

const RuangMuridViewContent: React.FC<RuangMuridViewProps> = ({
  identitas,
  tpList = [],
  atpDocument = null,
  soalDocument,
  activeAccessRecord,
  onSwitchToRuangGuru,
  showToast,
}) => {
  // Navigation tabs in Ruang Murid
  const [activeTab, setActiveTab] = useState<'ujian' | 'bacaan' | 'capaian'>('ujian');

  // Teacher Security & Access Gate in Ruang Murid
  const [isTeacherUnlocked, setIsTeacherUnlocked] = useState<boolean>(false);
  const [isTeacherAuthModalOpen, setIsTeacherAuthModalOpen] = useState<boolean>(false);
  const [pendingTeacherAction, setPendingTeacherAction] = useState<{
    type: 'switch-guru';
    label: string;
    description?: string;
  } | null>(null);

  // Student State
  const [studentList, setStudentList] = useState<StudentInfo[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(() => {
    const saved = localStorage.getItem('sipartan_active_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.nama && parsed.nama.toLowerCase().includes('alberto da silva')) {
          localStorage.removeItem('sipartan_active_student');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [studentName, setStudentName] = useState<string>(selectedStudent?.nama || '');
  const [studentNisn, setStudentNisn] = useState<string>(selectedStudent?.nisn || '');
  const [studentClass, setStudentClass] = useState<string>(identitas.kelas || '5');

  // Exam Packages & Submissions
  const [examPackages, setExamPackages] = useState<ExamPackage[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteTargetPackage, setDeleteTargetPackage] = useState<ExamPackage | null>(null);

  // Filter submissions belonging to the selected student for Tab 3 Capaian
  const studentPersonalSubmissions = useMemo(() => {
    if (!selectedStudent) return [];
    const targetNisn = (selectedStudent.nisn || '').trim();
    const targetName = (selectedStudent.nama || '').trim().toLowerCase();

    return submissions.filter((sub) => {
      const subNisn = ((sub.nisn || (sub as any).siswaNisn) || '').trim();
      const subName = ((sub.namaSiswa || (sub as any).siswaNama) || '').trim().toLowerCase();
      if (targetNisn && subNisn && targetNisn === subNisn) return true;
      if (targetName && subName && targetName === subName) return true;
      return false;
    }).sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [submissions, selectedStudent]);

  const studentAvgScore = useMemo(() => {
    if (studentPersonalSubmissions.length === 0) return 0;
    const total = studentPersonalSubmissions.reduce((acc, s) => acc + (s.score || 0), 0);
    return Math.round(total / studentPersonalSubmissions.length);
  }, [studentPersonalSubmissions]);

  const studentHighScore = useMemo(() => {
    if (studentPersonalSubmissions.length === 0) return 0;
    return Math.max(...studentPersonalSubmissions.map((s) => s.score || 0));
  }, [studentPersonalSubmissions]);

  // Active CBT Exam Session State
  const [activeExamToTake, setActiveExamToTake] = useState<ExamPackage | null>(null);
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [raguRaguMap, setRaguRaguMap] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(7200); // 120 Menit default
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<ExamSubmission | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState<boolean>(false);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);

  // Kebijakan Ujian: Waktu 120 Menit, Wajib Selesai, & Konfirmasi Tambahan Waktu (10 - 15 Menit)
  const [isExtraTimeOffered, setIsExtraTimeOffered] = useState<boolean>(false);
  const [isExtraTimeActive, setIsExtraTimeActive] = useState<boolean>(false);
  const [extraTimeMinutesGranted, setExtraTimeMinutesGranted] = useState<number>(0);
  const [showExtraTimeConfirmModal, setShowExtraTimeConfirmModal] = useState<boolean>(false);
  const [showMustCompleteModal, setShowMustCompleteModal] = useState<boolean>(false);
  const [showConfirmFinishModal, setShowConfirmFinishModal] = useState<boolean>(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  // User exam flow step:
  // 'kategori' -> Pilihan Mengikuti Ulangan Harian, Tengah Semester, atau Akhir Semester
  // 'mapel-soal' -> Pilihan Mata Pelajaran dan Naskah Soal
  const [examFlowStep, setExamFlowStep] = useState<'kategori' | 'mapel-soal'>('kategori');
  const [selectedExamCategory, setSelectedExamCategory] = useState<'all' | 'ulangan' | 'sts' | 'sas'>('all');

  // Petunjuk Pengerjaan (Briefing) Modal
  const [briefingPackage, setBriefingPackage] = useState<ExamPackage | null>(null);

  // Rekap filters & review
  const [rekapSearch, setRekapSearch] = useState<string>('');
  const [rekapPackageFilter, setRekapPackageFilter] = useState<string>('all');
  const [selectedReviewSubmission, setSelectedReviewSubmission] = useState<ExamSubmission | null>(null);

  const handleDownloadRekapPDF = (targetPackageId?: string) => {
    sounds.playSuccess();
    const pkgId = targetPackageId || rekapPackageFilter;
    const selectedPkg = pkgId !== 'all' ? examPackages.find((p) => p.id === pkgId) || null : null;
    const targetSubs = pkgId !== 'all'
      ? submissions.filter((s) => (s.paketId || (s as any).packageId) === pkgId)
      : submissions;

    generateStudentExamReportPDF({
      identitas,
      selectedPackage: selectedPkg,
      students: studentList,
      submissions: targetSubs,
      kktpThreshold: 75,
    });
    showToast('Dokumen resmi Rekap Nilai PDF berhasil diunduh!');
  };

  // Search & filter for packages in student room
  const [packageSearchQuery, setPackageSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Security Policy & Passcode States (SDN Fatubai)
  const [isRoomEnabled, setIsRoomEnabled] = useState<boolean>(() => isRuangMuridEnabled());
  const [isStudentAuth, setIsStudentAuth] = useState<boolean>(() => isStudentAuthenticatedForRuangMurid());
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastSubmissionData, setLastSubmissionData] = useState<{
    submission: ExamSubmission;
    pkg: ExamPackage;
  } | null>(null);

  // Load students & packages
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const list = getStudentList();
      setStudentList(list);

      const [pkgs, subs] = await Promise.all([
        getAllExamPackages(),
        getAllExamSubmissions(),
      ]);
      setExamPackages(pkgs);
      setSubmissions(subs);
    } catch (e) {
      console.warn('Gagal memuat data ruang murid:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Subscribe to admin policy changes (e.g. deactivated by GP-1386)
    const unsubPolicy = subscribeToRuangMuridPolicy((enabled) => {
      setIsRoomEnabled(enabled);
    });

    // Subscribe to real-time exam packages from teacher
    const unsubPackages = subscribeToExamPackages((pkgs) => {
      setExamPackages(pkgs);
    });

    // Subscribe to real-time student list from teacher
    const unsubStudents = subscribeToStudentListFromFirestore((students) => {
      setStudentList(students);
    });

    // Subscribe to real-time exam submissions
    const unsubSubmissions = subscribeToExamSubmissions((subs) => {
      setSubmissions(subs);
    });

    return () => {
      unsubPolicy();
      unsubPackages();
      unsubStudents();
      unsubSubmissions();
    };
  }, []);

  const handleRequestSwitchToGuru = () => {
    if (isTeacherUnlocked) {
      sounds.playClick();
      onSwitchToRuangGuru();
    } else {
      sounds.playWarning();
      setPendingTeacherAction({
        type: 'switch-guru',
        label: 'Kembali ke Ruang Guru',
        description:
          'Ruang Guru berisi modul ajar, administrasi guru, dan pantauan ujian. Masukkan Kode Akses Guru Anda untuk beralih.',
      });
      setIsTeacherAuthModalOpen(true);
    }
  };

  const handleTeacherAuthSuccess = () => {
    setIsTeacherUnlocked(true);
    setIsTeacherAuthModalOpen(false);
    showToast('✅ Verifikasi Akses Guru Berhasil! Beralih ke Ruang Guru.');
    onSwitchToRuangGuru();
    setPendingTeacherAction(null);
  };

  // Sync selectedStudent to localStorage and open category choice
  const handleSelectStudent = (stu: StudentInfo) => {
    sounds.playWelcome();
    setSelectedStudent(stu);
    setStudentName(stu.nama);
    setStudentNisn(stu.nisn);
    localStorage.setItem('sipartan_active_student', JSON.stringify(stu));
    setActiveTab('ujian');
    setExamFlowStep('kategori');
    setSelectedExamCategory('all');
    setBriefingPackage(null);
    showToast(`Halo, ${stu.nama}! Silakan pilih jenis evaluasi yang ingin kamu ikuti.`);
  };

  const handleExitStudentProfile = () => {
    sounds.playClick();
    setSelectedStudent(null);
    setStudentName('');
    setStudentNisn('');
    localStorage.removeItem('sipartan_active_student');
    setActiveExamToTake(null);
    setIsExamStarted(false);
    setExamResult(null);
    setBriefingPackage(null);
    setExamFlowStep('kategori');
    showToast('Profil murid berhasil dikeluarkan. Silakan pilih kartu nama yang sesuai.');
  };

  const toggleSound = () => {
    const nextState = sounds.toggleMute();
    setIsMuted(nextState);
    if (!nextState) sounds.playClick();
  };

  // Flatten questions from active exam package
  const flatQuestions = useMemo(() => {
    if (!activeExamToTake) return [];
    const naskah = activeExamToTake.soalDocument.naskahSoal;
    const list: Array<{
      displayNum: string;
      bentukSoal: string;
      soal: any;
      petunjuk?: string;
    }> = [];

    // PG
    naskah.soalPilihanGanda?.forEach((q: any) => {
      const num = q.nomorDisplay || (q.nomor !== undefined ? String(q.nomor) : '1');
      const opsiList = q.opsi || (q.pilihan ? q.pilihan.map((p: any) => ({ label: p.kunci, teks: p.teks })) : []);
      list.push({
        displayNum: num,
        bentukSoal: 'Pilihan Ganda',
        soal: {
          ...q,
          opsi: opsiList,
        },
      });
    });

    // Benar/Salah
    naskah.soalBenarSalah?.forEach((q: any) => {
      const num = q.nomorDisplay || (q.nomor !== undefined ? String(q.nomor) : '1');
      list.push({
        displayNum: num,
        bentukSoal: 'Benar/Salah',
        soal: q,
      });
    });

    // Menjodohkan
    naskah.soalMenjodohkan?.forEach((group: any) => {
      const gNum = group.nomorDisplay || group.nomorGroup || '1';
      const items = group.daftarPremis || group.pasangan || [];
      const rights = group.daftarPilihanRespon ? group.daftarPilihanRespon.map((p: any) => p.teks) : (group.pasangan ? group.pasangan.map((p: any) => p.jawabanBenar) : []);
      items.forEach((pair: any, pIdx: number) => {
        list.push({
          displayNum: `${gNum}.${pIdx + 1}`,
          bentukSoal: 'Menjodohkan',
          soal: {
            ...pair,
            pernyataanKiri: pair.pernyataanKiri || pair.premis || pair.teks || '',
            parentNomor: gNum,
            instruksi: group.instruksi,
            semuaPilihanKanan: rights,
          },
        });
      });
    });

    // Isian Singkat
    naskah.soalIsianSingkat?.forEach((q: any) => {
      const num = q.nomorDisplay || (q.nomor !== undefined ? String(q.nomor) : '1');
      list.push({
        displayNum: num,
        bentukSoal: 'Isian Singkat',
        soal: q,
      });
    });

    // Uraian
    naskah.soalUraian?.forEach((q: any) => {
      const num = q.nomorDisplay || (q.nomor !== undefined ? String(q.nomor) : '1');
      list.push({
        displayNum: num,
        bentukSoal: 'Uraian',
        soal: q,
      });
    });

    return list;
  }, [activeExamToTake]);

  const currentQ = flatQuestions[currentQuestionIndex];

  // Identifikasi butir soal yang belum dijawab
  const getUnansweredQuestions = useCallback(() => {
    return flatQuestions.filter((q) => {
      const ans = studentAnswers[q.displayNum];
      if (ans === undefined || ans === null || ans === '') return true;
      if (typeof ans === 'string' && ans.trim() === '') return true;
      if (Array.isArray(ans) && ans.length === 0) return true;
      return false;
    });
  }, [flatQuestions, studentAnswers]);

  // Submit and evaluate exam
  const handleFinishExam = async (isAutoSubmitted: boolean = false) => {
    if (!activeExamToTake || isSubmitting) return;
    sounds.playVictoryFanfare();
    setIsSubmitting(true);
    setShowConfirmFinishModal(false);
    setShowExtraTimeConfirmModal(false);

    try {
      const answersList = flatQuestions.map((q) => ({
        nomorDisplay: q.displayNum,
        bentukSoal: q.bentukSoal,
        jawabanSiswa: studentAnswers[q.displayNum] || '',
        isRaguRagu: Boolean(raguRaguMap[q.displayNum]),
      }));

      const submission = evaluateStudentExam(
        activeExamToTake,
        studentName || 'Peserta Didik SD Fatubai',
        studentNisn || '-',
        studentClass,
        answersList
      );

      await submitExamSubmission(submission);
      setExamResult(submission);
      setLastSubmissionData({
        submission,
        pkg: activeExamToTake,
      });
      setIsSuccessModalOpen(true);
      if (isAutoSubmitted) {
        showToast(`⏱️ Waktu ujian telah selesai. Seluruh hasil pekerjaan otomatis tersimpan dalam sistem dan penilaian guru! (Nilai: ${submission.nilaiAkhir.toFixed(1)}/100)`);
      } else {
        showToast(`🎉 Ujian berhasil diselesaikan & terkirim ke Guru! Nilai kamu: ${submission.nilaiAkhir.toFixed(1)}/100`);
      }
      refreshData();
    } catch (e) {
      console.error('Gagal menyelesaikan ujian:', e);
      showToast('Terjadi kesalahan saat mengevaluasi ujian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer countdown during exam
  useEffect(() => {
    if (!isExamStarted || examResult !== null) return;

    if (timeLeftSeconds <= 0) {
      const unanswered = getUnansweredQuestions();
      // "namun jika murid belum menyelesaikan seluruh soal maka muncul konfirmasi tambahan waktu, 10 meni sampai 15 meniit."
      if (unanswered.length > 0 && !isExtraTimeOffered) {
        setIsExtraTimeOffered(true);
        setShowExtraTimeConfirmModal(true);
        sounds.playWarning();
        return;
      }

      // "jika tambahan waktu selesai dan murid belum menyelesaikan makan hasil pekerjaan otomatis tersimpan dalam sitem dan penilaian guru!"
      handleFinishExam(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeftSeconds, examResult, isExtraTimeOffered, getUnansweredQuestions]);

  // Start exam directly from card
  const handleStartExamDirect = (pkg: ExamPackage, practiceMode: boolean = false) => {
    sounds.playFanfare();
    setActiveExamToTake(pkg);
    setIsPracticeMode(practiceMode);
    setCurrentQuestionIndex(0);
    setStudentAnswers({});
    setRaguRaguMap({});
    setExamResult(null);
    setIsExtraTimeOffered(false);
    setIsExtraTimeActive(false);
    setExtraTimeMinutesGranted(0);
    setShowExtraTimeConfirmModal(false);
    setShowMustCompleteModal(false);
    setShowConfirmFinishModal(false);
    // Alokasi waktu ujian resmi adalah 120 Menit (7200 detik)
    setTimeLeftSeconds((pkg.durasiMenit || 120) * 60);
    setIsExamStarted(true);
  };

  // Penerapan Tambahan Waktu (10 atau 15 Menit)
  const handleApplyExtraTime = (minutes: number) => {
    setTimeLeftSeconds(minutes * 60);
    setIsExtraTimeActive(true);
    setExtraTimeMinutesGranted(minutes);
    setShowExtraTimeConfirmModal(false);
    sounds.playPowerUp();
    showToast(`⏱️ Tambahan waktu +${minutes} Menit telah diberikan. Selesaikan seluruh sisa soal!`);
  };

  // Murid menekan tombol Selesai / Akhiri Ujian
  // Aturan: "jika jumlah soal 10, 20 atau 30, maka murid wajib menyelesaikan seluruhnya jika waktu yang ditentukan masih ada. murid tidak bisa akhiri, sebelum waktu selesai"
  const handleAttemptFinishExam = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0 && timeLeftSeconds > 0) {
      sounds.playWrong();
      setShowMustCompleteModal(true);
      return;
    }
    // Jika semua butir soal telah terjawab, atau waktu pengerjaan telah habis
    setShowConfirmFinishModal(true);
  };

  // Filtered students for initial screen
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return studentList;
    return studentList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [studentList, studentSearch]);

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // XP Score calculation for gamification
  const answeredCount = Object.keys(studentAnswers).length;
  const currentXP = 100 + answeredCount * 50;

  // =========================================================================
  // POLICY & SECURITY GATES (SDN FATUBAI)
  // =========================================================================
  if (!isRoomEnabled) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#070e1c] rounded-3xl border border-slate-800">
        <RuangMuridDeactivatedModal
          isOpen={true}
          onClose={onSwitchToRuangGuru}
        />
      </div>
    );
  }

  if (!isStudentAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#070e1c] rounded-3xl border border-slate-800">
        <RuangMuridPasscodeModal
          isOpen={true}
          onSuccess={() => setIsStudentAuth(true)}
          onClose={onSwitchToRuangGuru}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PILIH KARTU NAMA MURID (INITIAL LANDING PAGE RUANG MURID)
  // =========================================================================
  if (!selectedStudent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-[85vh] flex flex-col items-center justify-between p-4 sm:p-6 bg-[#070e1c] rounded-3xl border-4 border-blue-900/40 relative overflow-hidden text-slate-100"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-3 pt-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-blue-400/40 text-blue-300 text-xs font-black uppercase tracking-wider shadow-lg">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>PORTAL ASESMEN & CBT PESERTA DIDIK • SD NEGERI FATUBAI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-blue-200 tracking-tight drop-shadow-md">
            Pilih Kartu Identitas Penjelajah
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Klik kartu nama kamu di bawah ini untuk langsung masuk ke ruang ulangan dan ujian interaktif berbasis gamifikasi.
          </p>

          {/* Quick Search Box */}
          <div className="w-full max-w-md relative pt-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Cari nama kamu atau NISN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0d1c3a] border-2 border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 shadow-md"
            />
          </div>
        </motion.div>

        {/* Student Cards Grid */}
        <div className="relative z-10 w-full max-w-5xl my-6 flex-1 overflow-y-auto max-h-[56vh] pr-1">
          {filteredStudents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 text-slate-400 space-y-2"
            >
              <div className="text-4xl">🔍</div>
              <p className="font-bold text-sm text-slate-300">Nama murid tidak ditemukan.</p>
              <p className="text-xs text-slate-500">Silakan periksa kembali ketikan nama atau NISN.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredStudents.map((stu, idx) => {
                const colorPalettes = [
                  { bg: 'from-blue-900/60 to-slate-900', border: 'border-blue-500/40 hover:border-blue-400', badge: 'bg-blue-500/20 text-blue-300', av: 'from-blue-500 to-indigo-600' },
                  { bg: 'from-emerald-900/60 to-slate-900', border: 'border-emerald-500/40 hover:border-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', av: 'from-emerald-500 to-teal-600' },
                  { bg: 'from-amber-900/60 to-slate-900', border: 'border-amber-500/40 hover:border-amber-400', badge: 'bg-amber-500/20 text-amber-300', av: 'from-amber-500 to-orange-600' },
                  { bg: 'from-purple-900/60 to-slate-900', border: 'border-purple-500/40 hover:border-purple-400', badge: 'bg-purple-500/20 text-purple-300', av: 'from-purple-500 to-pink-600' },
                  { bg: 'from-rose-900/60 to-slate-900', border: 'border-rose-500/40 hover:border-rose-400', badge: 'bg-rose-500/20 text-rose-300', av: 'from-rose-500 to-red-600' },
                ];
                const pal = colorPalettes[idx % colorPalettes.length];

                return (
                  <motion.button
                    key={stu.id}
                    type="button"
                    initial={{ opacity: 0, y: 15, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.025, 0.4), duration: 0.25 }}
                    whileHover={{ scale: 1.04, y: -5, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={() => sounds.playCardHover()}
                    onClick={() => handleSelectStudent(stu)}
                    className={`group relative p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center text-center justify-between overflow-hidden shadow-lg bg-gradient-to-b hover:shadow-xl ${pal.bg} ${pal.border}`}
                  >
                    {/* Corner shine */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full group-hover:scale-125 transition-transform" />

                    {/* Avatar Circle */}
                    <motion.div
                      whileHover={{ rotate: 6, scale: 1.1 }}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pal.av} shadow-md border-2 border-white/20 flex items-center justify-center text-xl font-black text-white mb-2.5`}
                    >
                      {stu.nama.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Student Name */}
                    <span className="font-extrabold text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-amber-300 transition-colors mb-1">
                      {stu.nama}
                    </span>

                    {/* NIS / NISN & Badge */}
                    <div className="space-y-1 w-full mt-1">
                      <span className="text-[10px] font-mono text-slate-300 block truncate">
                        {stu.nis && stu.nisn && stu.nis !== stu.nisn
                          ? `NIS: ${stu.nis} • NISN: ${stu.nisn}`
                          : stu.nis
                          ? `NIS: ${stu.nis}`
                          : `NISN: ${stu.nisn}`}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[9.5px] font-black border uppercase tracking-wider ${pal.badge}`}
                      >
                        Siswa No. #{idx + 1}
                      </span>
                    </div>

                    {/* Hover Enter Prompt */}
                    <div className="w-full mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-center gap-1 text-[10px] font-black text-amber-300 opacity-80 group-hover:opacity-100">
                      <span>Mulai Ujian</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation Back to Guru */}
        <div className="relative z-10 w-full max-w-5xl pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SD Negeri Fatubai • Terkoneksi CBT Server</span>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sounds.playClick();
              onSwitchToRuangGuru();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ruang Guru</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 2: GAMIFIED EXAM ROOM (SESI PENGERJAAN SOAL BERBASIS GAME)
  // =========================================================================
  if (activeExamToTake && isExamStarted && !examResult && currentQ) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 pb-12"
      >
        {/* GAME HUD BAR (HEADER ATAS) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-r from-[#0B1730] via-[#0E2248] to-[#0B1730] border-2 border-amber-500/60 rounded-3xl p-3.5 sm:p-5 shadow-2xl text-white relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Player Info */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-300"
              >
                {studentName.charAt(0).toUpperCase()}
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
                    {studentName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-500/40">
                    Kelas {studentClass}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 font-medium">
                  <span>{activeExamToTake.judul}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    {currentXP} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Live Hearts / Energy + Timer */}
            <div className="flex items-center gap-4">
              {/* 5 Energy Hearts */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-700">
                {[1, 2, 3, 4, 5].map((h) => (
                  <motion.div
                    key={h}
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: h * 0.2 }}
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </motion.div>
                ))}
              </div>

              {/* Digital Countdown Timer */}
              <motion.div
                animate={timeLeftSeconds < 300 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base border-2 shadow-inner ${
                  timeLeftSeconds < 300
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500'
                    : 'bg-[#060D1E] text-amber-300 border-amber-500/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </motion.div>

              {/* Sound Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleSound}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 transition-colors cursor-pointer"
                title={isMuted ? 'Nyalakan Efek Suara Game' : 'Bisukan Efek Suara'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </motion.button>

              {/* Exit Mission / Wrong Name button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowExitConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-200 transition-colors cursor-pointer text-xs font-black flex items-center gap-1.5 shadow-md"
                title="Keluar jika salah memilih nama murid atau ingin ganti mapel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salah Nama? Keluar</span>
              </motion.button>
            </div>
          </div>

          {/* Level / Question Progress Bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center gap-3">
            <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider whitespace-nowrap">
              Tantangan {currentQuestionIndex + 1} / {flatQuestions.length}
            </span>
            <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentQuestionIndex + 1) / flatQuestions.length) * 100}%`,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-300">
              {answeredCount} Terjawab
            </span>
          </div>
        </motion.div>

        {/* MAIN GAME WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* QUESTION BOX (LEFT 3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Quest Question Card with smooth step animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-[#0B1528] rounded-3xl border-2 border-slate-700/80 p-5 sm:p-7 shadow-xl space-y-6 relative overflow-hidden"
              >
                {/* Question Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md"
                    >
                      {currentQuestionIndex + 1}
                    </motion.span>
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/40">
                      {currentQ.bentukSoal}
                    </span>
                  </div>

                  {/* Ragu-Ragu Toggle Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      sounds.playDoubt();
                      const curNum = currentQ.displayNum;
                      setRaguRaguMap((prev) => ({ ...prev, [curNum]: !prev[curNum] }));
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                      raguRaguMap[currentQ.displayNum]
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-400'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{raguRaguMap[currentQ.displayNum] ? '🚩 Ragu-Ragu (Tandai)' : 'Tandai Ragu-Ragu'}</span>
                  </motion.button>
                </div>

                {/* BENTUK 1: PILIHAN GANDA (VIBRANT ARCADE BUTTONS) */}
                {currentQ.bentukSoal === 'Pilihan Ganda' && (
                  <div className="space-y-6">
                    {/* Pertanyaan */}
                    <div className="bg-[#070e1c] p-5 sm:p-6 rounded-2xl border-2 border-blue-900/60 shadow-inner">
                      <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {currentQ.soal.pertanyaan}
                      </p>
                    </div>

                    {/* 4 Arcade Gem Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {currentQ.soal.opsi?.map((opt: any, idx: number) => {
                        const isSelected = studentAnswers[currentQ.displayNum] === opt.label;
                        const arcadeStyles = [
                          { label: 'A', bg: 'from-amber-600 to-amber-700', active: 'border-amber-400 bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400', gem: '🟡' },
                          { label: 'B', bg: 'from-emerald-600 to-emerald-700', active: 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400', gem: '🟢' },
                          { label: 'C', bg: 'from-blue-600 to-blue-700', active: 'border-blue-400 bg-blue-500 text-white shadow-blue-500/30 ring-2 ring-blue-400', gem: '🔵' },
                          { label: 'D', bg: 'from-rose-600 to-rose-700', active: 'border-rose-400 bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-400', gem: '🔴' },
                        ];
                        const style = arcadeStyles[idx % arcadeStyles.length];

                        return (
                          <motion.button
                            key={opt.label}
                            type="button"
                            whileHover={{ scale: 1.02, x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              sounds.playSelect();
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [currentQ.displayNum]: opt.label,
                              }));
                            }}
                            className={`relative overflow-hidden text-left p-4 sm:p-4.5 rounded-2xl border-b-4 transition-colors flex items-center gap-3.5 cursor-pointer ${
                              isSelected
                                ? `${style.active} shadow-xl`
                                : 'bg-[#0D1B36] border-slate-700 hover:border-slate-500 text-slate-200 hover:bg-[#122448]'
                            }`}
                          >
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${
                                isSelected ? 'bg-white/25 text-inherit' : 'bg-slate-800 text-amber-300 border border-slate-700'
                              }`}
                            >
                              {opt.label}
                            </div>
                            <span className="text-xs sm:text-sm font-bold flex-1 leading-snug">
                              {opt.teks}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-inherit shrink-0" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BENTUK 2: BENAR / SALAH (2 GIANT DUEL SHIELDS) */}
                {currentQ.bentukSoal === 'Benar/Salah' && (
                  <div className="space-y-6">
                    <div className="bg-[#070e1c] p-5 sm:p-6 rounded-2xl border-2 border-emerald-900/60 shadow-inner">
                      <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block mb-1.5">
                        Pernyataan Soal:
                      </span>
                      <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {currentQ.soal.pernyataan}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm font-extrabold text-slate-300">
                      Pilih kebenaran pernyataan di atas:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {['Benar', 'Salah'].map((val) => {
                        const isSelected = studentAnswers[currentQ.displayNum] === val;
                        const isBenar = val === 'Benar';
                        return (
                          <motion.button
                            key={val}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              sounds.playSelect();
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [currentQ.displayNum]: val,
                              }));
                            }}
                            className={`p-6 rounded-2xl border-b-4 font-black text-base sm:text-lg text-center transition-colors cursor-pointer ${
                              isSelected
                                ? isBenar
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-700 ring-4 ring-emerald-400/40 shadow-xl'
                                  : 'bg-rose-600 text-white border-rose-800 ring-4 ring-rose-400/40 shadow-xl'
                                : 'bg-[#0D1B36] border-slate-700 text-slate-300 hover:bg-[#122448]'
                            }`}
                          >
                            <div className="text-3xl mb-1">{isBenar ? '🛡️' : '⚔️'}</div>
                            <span>{val.toUpperCase()}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BENTUK 3: MENJODOHKAN (PUZZLE QUEST) */}
                {currentQ.bentukSoal === 'Menjodohkan' && (
                  <div className="space-y-4">
                    <div className="bg-[#070e1c] p-5 rounded-2xl border-2 border-purple-900/60 space-y-2">
                      <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block">
                        🧩 Premis Pasangan Teka-Teki:
                      </span>
                      <p className="text-base font-bold text-white">
                        {currentQ.soal.pernyataanKiri}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-amber-300 uppercase tracking-wider">
                        Pilih Pasangan Jawaban yang Tepat:
                      </label>
                      <select
                        value={studentAnswers[currentQ.displayNum] || ''}
                        onChange={(e) => {
                          sounds.playSelect();
                          setStudentAnswers((prev) => ({
                            ...prev,
                            [currentQ.displayNum]: e.target.value,
                          }));
                        }}
                        className="w-full p-3.5 rounded-2xl border-2 border-slate-700 font-bold text-sm bg-[#0D1B36] text-white focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      >
                        <option value="">-- Klik untuk Memilih Pasangan Jawaban --</option>
                        {currentQ.soal.semuaPilihanKanan?.map((opt: string, optIdx: number) => (
                          <option key={optIdx} value={opt} className="bg-slate-900 text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* BENTUK 4: ISIAN SINGKAT (MAGIC CRYSTAL BOX) */}
                {currentQ.bentukSoal === 'Isian Singkat' && (
                  <div className="space-y-4">
                    <div className="bg-[#070e1c] p-5 rounded-2xl border-2 border-teal-900/60">
                      <p className="text-base font-bold text-white leading-relaxed">
                        {currentQ.soal.pertanyaan}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-teal-300 uppercase tracking-wider">
                        Ketik Jawaban Singkat Kamu di Bawah:
                      </label>
                      <input
                        type="text"
                        value={studentAnswers[currentQ.displayNum] || ''}
                        onChange={(e) => {
                          setStudentAnswers((prev) => ({
                            ...prev,
                            [currentQ.displayNum]: e.target.value,
                          }));
                        }}
                        placeholder="Ketik jawaban di sini..."
                        className="w-full p-3.5 rounded-2xl border-2 border-slate-700 font-bold text-sm bg-[#0D1B36] text-white focus:outline-hidden focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* BENTUK 5: URAIAN (SAGE SCROLL WRITING) */}
                {currentQ.bentukSoal === 'Uraian' && (
                  <div className="space-y-4">
                    <div className="bg-[#070e1c] p-5 rounded-2xl border-2 border-orange-900/60">
                      <p className="text-base font-bold text-white leading-relaxed">
                        {currentQ.soal.pertanyaan}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-amber-300 uppercase tracking-wider">
                        Tuliskan Penjelasan Lengkap Kamu:
                      </label>
                      <textarea
                        rows={4}
                        value={studentAnswers[currentQ.displayNum] || ''}
                        onChange={(e) => {
                          setStudentAnswers((prev) => ({
                            ...prev,
                            [currentQ.displayNum]: e.target.value,
                          }));
                        }}
                        placeholder="Tuliskan uraian langkah kerja atau alasan jawaban kamu..."
                        className="w-full p-3.5 rounded-2xl border-2 border-slate-700 font-medium text-sm bg-[#0D1B36] text-white focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* MODE LATIHAN: PEMBAHASAN EDUKATIF LANGSUNG BERDASARKAN TP */}
                {isPracticeMode && studentAnswers[currentQ.displayNum] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-slate-900 border-2 border-amber-400/70 text-xs text-slate-200 space-y-2.5 shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-blue-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-amber-300 uppercase tracking-wider text-[11px]">
                          Pembahasan Edukatif (Mode Belajar Mandiri)
                        </span>
                      </div>
                      {currentQ.soal.kunciJawaban && (
                        <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Kunci: {String(currentQ.soal.kunciJawaban)}
                        </span>
                      )}
                    </div>

                    {currentQ.soal.tujuanPembelajaran && (
                      <p className="text-amber-200/90 font-medium">
                        🎯 <strong>Target TP:</strong> {currentQ.soal.tujuanPembelajaran}
                      </p>
                    )}

                    {currentQ.soal.pembahasan ? (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-300 block">Penjelasan Konsep Materi:</span>
                        <p className="text-slate-100 leading-relaxed font-sans bg-black/30 p-3 rounded-xl border border-blue-900/50">
                          {currentQ.soal.pembahasan}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-300 italic">
                        Pelajari kembali materi pada buku teks tematik atau tanyakan kepada Bapak/Ibu guru jika memerlukan bimbingan lebih mendalam.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* NAVIGATION ACTION BUTTONS */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <motion.button
                    type="button"
                    whileHover={currentQuestionIndex !== 0 ? { scale: 1.04 } : {}}
                    whileTap={currentQuestionIndex !== 0 ? { scale: 0.96 } : {}}
                    disabled={currentQuestionIndex === 0}
                    onClick={() => {
                      sounds.playClick();
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Soal Sebelumnya</span>
                  </motion.button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < flatQuestions.length - 1 ? (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          sounds.playNextQuestion();
                          setCurrentQuestionIndex((prev) => Math.min(flatQuestions.length - 1, prev + 1));
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <span>Soal Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAttemptFinishExam}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesaikan Misi Ujian! 🏁</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* QUESTION SELECTOR LEVEL MAP (RIGHT 1 COL) */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-[#0B1528] rounded-3xl border-2 border-slate-700/80 p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Peta Soal Ujian</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {flatQuestions.length} Butir
                </span>
              </div>

              {/* Grid Number Badges */}
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {flatQuestions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = Boolean(studentAnswers[q.displayNum]);
                  const isRagu = Boolean(raguRaguMap[q.displayNum]);

                  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (isCurrent) {
                    badgeColor = 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50 shadow-md';
                  } else if (isRagu) {
                    badgeColor = 'bg-amber-500 text-slate-950 border-amber-300 font-black';
                  } else if (isAnswered) {
                    badgeColor = 'bg-emerald-600 text-white border-emerald-400';
                  }

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        sounds.playClick();
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`h-9 rounded-xl border font-mono font-black text-xs flex items-center justify-center transition-colors cursor-pointer ${badgeColor}`}
                    >
                      {idx + 1}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[10px] text-slate-300 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block border border-emerald-400" />
                  <span>Sudah Terjawab ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-amber-500 inline-block border border-amber-300" />
                  <span>Ragu-Ragu ({Object.values(raguRaguMap).filter(Boolean).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-800 inline-block border border-slate-700" />
                  <span>Belum Terjawab ({flatQuestions.length - answeredCount})</span>
                </div>
              </div>

              {/* Finish Exam Button */}
              <div className="pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAttemptFinishExam}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim & Selesaikan Ujian</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* EXIT CONFIRM MODAL WITH FRAMER MOTION ANIMATEPRESENCE */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.3 }}
                className="bg-[#0B1528] border-2 border-rose-500 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-slate-100 my-auto max-h-[90vh] overflow-y-auto"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-white">Konfirmasi Keluar dari Ujian</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kamu sedang login sebagai <strong className="text-amber-300">{studentName}</strong> (Kelas {studentClass}).
                  Jika kamu salah memilih nama siswa, klik &quot;Ganti Murid&quot; untuk memilih nama yang benar.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
                  >
                    Lanjut Mengerjakan
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowExitConfirm(false);
                      setIsExamStarted(false);
                      setActiveExamToTake(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Pilih Misi Lain
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowExitConfirm(false);
                      handleExitStudentProfile();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
                  >
                    Ganti Murid
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 3: VICTORY CELEBRATION & EXAM RESULT SCREEN
  // =========================================================================
  if (examResult) {
    const isLulus = examResult.nilaiAkhir >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.55 }}
        className="max-w-2xl mx-auto space-y-6 py-6 text-slate-100"
      >
        <div className="bg-gradient-to-b from-[#0B1733] via-[#0E2042] to-[#081022] border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5 relative overflow-hidden">
          {/* Confetti / Particle Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Trophy Icon with gentle animated sway */}
          <motion.div
            animate={{ rotate: [0, -6, 6, -6, 0], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 3.5 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 border-2 border-amber-200"
          >
            <Trophy className="w-10 h-10" />
          </motion.div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLulus ? 'MISI BERHASIL DITUNTASKAN!' : 'MISI SELESAI DENGAN BAIK'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Selamat, {examResult.namaSiswa}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Kamu telah menyelesaikan {examResult.judulPaket}
            </p>
          </div>

          {/* Score Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
            className="bg-[#050C1B] rounded-2xl border-2 border-amber-500/40 p-5 max-w-xs mx-auto shadow-inner space-y-1"
          >
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              Nilai Akhir Ujian
            </span>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
              {examResult.nilaiAkhir.toFixed(1)}
            </div>
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                isLulus ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {examResult.predikat || examResult.keteranganKKTP}
            </span>
          </motion.div>

          {/* Detailed Breakdown */}
          {(() => {
            const answersArr = examResult.jawabanDetail || examResult.jawabanList || [];
            return (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto text-xs">
                <div className="bg-[#071328] p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Terjawab</span>
                  <span className="text-base font-black text-white">
                    {answersArr.filter((j: any) => j.jawabanSiswa).length} / {answersArr.length}
                  </span>
                </div>
                <div className="bg-[#071328] p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ragu-Ragu</span>
                  <span className="text-base font-black text-amber-400">
                    {answersArr.filter((j: any) => j.isRaguRagu).length}
                  </span>
                </div>
                <div className="bg-[#071328] p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">XP Bonus</span>
                  <span className="text-base font-black text-emerald-400">+500 XP</span>
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sounds.playClick();
                setIsSuccessModalOpen(false);
                setShowExplanationModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-cyan-200" />
              <span>📋 Tinjau Kunci &amp; Pembahasan TP</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sounds.playClick();
                setShowExplanationModal(false);
                setIsSuccessModalOpen(false);
                setExamResult(null);
                setActiveExamToTake(null);
                setIsExamStarted(false);
                setExamFlowStep('kategori');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 cursor-pointer"
            >
              🏠 Kembali ke Beranda Ujian
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sounds.playClick();
                setShowExplanationModal(false);
                setIsSuccessModalOpen(false);
                if (activeExamToTake) handleStartExamDirect(activeExamToTake, isPracticeMode);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              🔄 Ulangi Latihan
            </motion.button>
          </div>
        </div>

        {/* Modal Tinjau Kunci & Pembahasan Edukatif TP Langsung di Layar Hasil */}
        <StudentExamReviewModal
          isOpen={showExplanationModal}
          onClose={() => setShowExplanationModal(false)}
          submission={examResult}
          examPackage={activeExamToTake}
        />

        {/* Modal Konfirmasi Sukses Kirim Ujian */}
        <ExamSubmissionSuccessModal
          isOpen={isSuccessModalOpen}
          submission={examResult}
          pkg={activeExamToTake}
          onViewReview={() => {
            setIsSuccessModalOpen(false);
            setShowExplanationModal(true);
          }}
          onBackToHome={() => {
            setIsSuccessModalOpen(false);
            setShowExplanationModal(false);
            setExamResult(null);
            setActiveExamToTake(null);
            setIsExamStarted(false);
            setExamFlowStep('kategori');
          }}
        />
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW 4: STUDENT DASHBOARD (QUEST BOARD / DAFTAR UJIAN & BACAAN)
  // =========================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-16 text-slate-100"
    >
      {/* TOP USER WELCOME BANNER WITH EXIT / GANTI NAMA BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-[#0B1A38] via-[#0E2450] to-[#08132A] border-2 border-blue-500/50 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.05 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300 shrink-0 cursor-default"
          >
            {studentName.charAt(0).toUpperCase()}
          </motion.div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Siswa Aktif SD Negeri Fatubai
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {selectedStudent?.nis && selectedStudent?.nisn && selectedStudent.nis !== selectedStudent.nisn
                  ? `NIS: ${selectedStudent.nis} • NISN: ${selectedStudent.nisn}`
                  : selectedStudent?.nis
                  ? `NIS: ${selectedStudent.nis}`
                  : `NISN: ${studentNisn}`} • Kelas {studentClass}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Halo, {studentName}! 🚀
            </h2>
            <p className="text-xs text-blue-200">
              Selamat datang di petualangan belajar digital. Pilih misi ulangan atau bacaan menarik di bawah ini.
            </p>
          </div>
        </div>

        {/* Action Controls: Ganti Nama + Mute + Kembali Guru */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Keluar / Ganti Nama jika salah pilih */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleExitStudentProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-2 border-rose-500/50 hover:border-rose-400 text-xs font-black shadow-md cursor-pointer transition-colors"
            title="Keluar jika salah memilih nama murid"
          >
            <UserCheck className="w-4 h-4 text-rose-300" />
            <span>Bukan {studentName.split(' ')[0]}? Ganti Nama</span>
          </motion.button>

          {/* Sound Toggle */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>

          {/* Ruang Guru */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRequestSwitchToGuru}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
            title={!isTeacherUnlocked ? 'Beralih ke Ruang Guru (Dilindungi Kode Akses Guru)' : 'Beralih ke Ruang Guru'}
          >
            {!isTeacherUnlocked ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Users className="w-4 h-4 text-blue-400" />
            )}
            <span className="hidden sm:inline">Ruang Guru</span>
          </motion.button>
        </div>
      </motion.div>

      {/* RUANG MURID TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sounds.playClick();
            setActiveTab('ujian');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            activeTab === 'ujian'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>🎮 Misi Ulangan &amp; Ujian CBT</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
            {examPackages.filter((p) => p.isActive).length} Aktif
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sounds.playClick();
            setActiveTab('bacaan');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            activeTab === 'bacaan'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>📚 Kamar Bahan Ajar &amp; Media</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            ⚡ Offline
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sounds.playClick();
            setActiveTab('capaian');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            activeTab === 'capaian'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>⭐ Riwayat &amp; Nilai Saya</span>
          {selectedStudent && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {studentPersonalSubmissions.length} Ujian
            </span>
          )}
        </motion.button>

        {/* Tombol Beralih Kembali ke Ruang Guru */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestSwitchToGuru}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer transition-colors shadow-xs"
            title="Kembali ke Ruang Guru (Pusat Administrasi & Perencanaan Pembelajaran)"
          >
            <span>🏫</span>
            <span className="font-extrabold hidden sm:inline">Kembali ke Ruang Guru</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MISI ULANGAN CBT DENGAN KARTU MAPEL INTERAKTIF & BERWARNA */}
      {/* ===================================================================== */}
      {activeTab === 'ujian' && (
        <div className="space-y-6">
          {/* LANGKAH 1: PILIHAN MENGIKUTI ULANGAN, TENGAH SEMESTER, ATAU AKHIR SEMESTER */}
          {examFlowStep === 'kategori' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-[#0B1528] p-5 sm:p-7 rounded-3xl border-2 border-blue-500/30 shadow-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                    Langkah 1: Tentukan Misi Ujian
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Evaluasi Terarah & Terstruktur
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Mau Ikut Ulangan atau Ujian Apa Hari Ini, {studentName.split(' ')[0]}? 🎯
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Pilih salah satu kategori evaluasi di bawah ini agar materi naskah soal lebih terarah sesuai jadwal dan kesiapan belajarmu di kelas.
                </p>
              </div>

              {/* 3 Large Gamified Category Cards with Framer Motion hover & entry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Kategori 1: Ulangan Harian */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  whileHover={{ scale: 1.025, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => sounds.playCardHover()}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedExamCategory('ulangan');
                    setExamFlowStep('mapel-soal');
                  }}
                  className="group relative bg-gradient-to-b from-[#07241A] via-[#092E22] to-[#04140F] border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 text-left transition-colors cursor-pointer flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg border-2 border-emerald-300">
                        📝
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Otomatis Berbasis TP
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        Latihan Harian &amp; Bab
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Soal latihan per bab/materi yang disusun secara otomatis berdasarkan TP untuk mematangkan penguasaan kompetensi dengan pembahasan interaktif.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs font-black text-emerald-300 group-hover:translate-x-1 transition-transform">
                    <span>Masuk ke Ruang Latihan Bab</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>

                {/* Kategori 2: Tengah Semester */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.12 }}
                  whileHover={{ scale: 1.025, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => sounds.playCardHover()}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedExamCategory('sts');
                    setExamFlowStep('mapel-soal');
                  }}
                  className="group relative bg-gradient-to-b from-[#07192C] via-[#09223D] to-[#05111E] border-2 border-cyan-500/50 hover:border-cyan-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 text-left transition-colors cursor-pointer flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl shadow-lg border-2 border-cyan-300">
                        🎯
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Ujian Resmi Guru (STS)
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                        Asesmen Tengah Semester (STS)
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Naskah evaluasi tengah semester resmi yang disusun langsung oleh Bapak/Ibu Guru untuk penilaian rapor.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs font-black text-cyan-300 group-hover:translate-x-1 transition-transform">
                    <span>Pilih Tengah Semester</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>

                {/* Kategori 3: Akhir Semester */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.19 }}
                  whileHover={{ scale: 1.025, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => sounds.playCardHover()}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedExamCategory('sas');
                    setExamFlowStep('mapel-soal');
                  }}
                  className="group relative bg-gradient-to-b from-[#240A2C] via-[#2F0D39] to-[#120417] border-2 border-purple-500/50 hover:border-purple-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 text-left transition-colors cursor-pointer flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-rose-600 flex items-center justify-center text-3xl shadow-lg border-2 border-purple-300">
                        🏆
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Ujian Resmi Guru (SAS)
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        Asesmen Akhir Semester (SAS / PAS)
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        Naskah sumatif akhir semester resmi yang dirancang dan diterbitkan oleh guru pengampu kelas.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-purple-500/20 flex items-center justify-between text-xs font-black text-purple-300 group-hover:translate-x-1 transition-transform">
                    <span>Pilih Akhir Semester</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>

              {/* Option to show all exams */}
              <div className="flex justify-center pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedExamCategory('all');
                    setExamFlowStep('mapel-soal');
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Atau Tampilkan Seluruh Naskah Ujian Tanpa Filter Kategori</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* LANGKAH 2: PILIHAN MATA PELAJARAN DAN NASKAH SOAL */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Navigasi Kategori & Filter Pencarian */}
              <div className="bg-[#0B1528] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        sounds.playClick();
                        setExamFlowStep('kategori');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4 text-amber-400" />
                      <span>Kembali ke Pilihan Kategori</span>
                    </motion.button>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {selectedExamCategory === 'ulangan' && '📝 Latihan Harian & Bab'}
                        {selectedExamCategory === 'sts' && '🎯 Asesmen Tengah Semester (STS)'}
                        {selectedExamCategory === 'sas' && '🏆 Asesmen Akhir Semester (SAS)'}
                        {selectedExamCategory === 'all' && '🌐 Semua Jenis Ujian'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        sounds.playClick();
                        setIsAutoGenerateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>✨ Susun Latihan Baru</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={refreshData}
                      className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                      title="Segarkan daftar soal"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Search and Subject Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={packageSearchQuery}
                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                      placeholder="Cari naskah latihan berdasarkan judul, mata pelajaran, atau materi..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    {packageSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPackageSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Subject Chips */}
                  {(() => {
                    const allActive = examPackages.filter((p) => p.isActive);
                    const distinctSubjects = Array.from(
                      new Set(allActive.map((p) => p.mataPelajaran || 'Lainnya'))
                    ).filter(Boolean);

                    return (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedSubjectFilter('all');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                            selectedSubjectFilter === 'all'
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          Semua Mapel
                        </button>
                        {distinctSubjects.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedSubjectFilter(sub);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                              selectedSubjectFilter === sub
                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Grouped by Mapel */}
              {(() => {
                const allActive = examPackages.filter((p) => p.isActive);
                const activeExams = allActive.filter((p) => {
                  if (selectedExamCategory !== 'all') {
                    const j = (p.jenisAsesmen || '').toLowerCase();
                    const t = (p.judul || '').toLowerCase();
                    if (selectedExamCategory === 'ulangan') {
                      const isFormatif =
                        j.includes('formatif') ||
                        j.includes('harian') ||
                        j.includes('materi') ||
                        t.includes('ulangan') ||
                        p.tipePenyusun === 'otomatis_tp';
                      if (!isFormatif) return false;
                    } else if (selectedExamCategory === 'sts') {
                      const isSTS =
                        j.includes('tengah') ||
                        j.includes('sts') ||
                        j.includes('pts') ||
                        t.includes('tengah') ||
                        t.includes('sts');
                      if (!isSTS) return false;
                    } else if (selectedExamCategory === 'sas') {
                      const isSAS =
                        j.includes('akhir') ||
                        j.includes('sas') ||
                        j.includes('pas') ||
                        t.includes('akhir') ||
                        t.includes('sas');
                      if (!isSAS) return false;
                    }
                  }

                  if (selectedSubjectFilter !== 'all') {
                    if ((p.mataPelajaran || '').toLowerCase() !== selectedSubjectFilter.toLowerCase()) {
                      return false;
                    }
                  }

                  if (packageSearchQuery.trim()) {
                    const q = packageSearchQuery.toLowerCase();
                    const matchesTitle = (p.judul || '').toLowerCase().includes(q);
                    const matchesSubject = (p.mataPelajaran || '').toLowerCase().includes(q);
                    const matchesTP = (p.daftarTP || []).some(
                      (tp) =>
                        (tp.rumusanTP || '').toLowerCase().includes(q) ||
                        (tp.kodeTP || '').toLowerCase().includes(q)
                    );
                    if (!matchesTitle && !matchesSubject && !matchesTP) return false;
                  }

                  return true;
                });

                if (activeExams.length === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0B1528] border-2 border-dashed border-amber-500/40 rounded-3xl p-8 text-center space-y-3"
                    >
                      <div className="text-4xl">📚</div>
                      <h4 className="text-base font-extrabold text-amber-300">
                        Tidak Ditemukan Naskah Soal yang Cocok
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        {packageSearchQuery || selectedSubjectFilter !== 'all'
                          ? 'Coba bersihkan pencarian atau ubah filter mata pelajaran untuk menemukan naskah soal lainnya.'
                          : 'Saat ini belum ada naskah soal aktif untuk kategori ini. Kamu dapat menampilkan seluruh ujian atau kembali memilih kategori.'}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {(packageSearchQuery || selectedSubjectFilter !== 'all') && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              sounds.playClick();
                              setPackageSearchQuery('');
                              setSelectedSubjectFilter('all');
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:brightness-105"
                          >
                            Reset Pencarian &amp; Filter
                          </motion.button>
                        )}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedExamCategory('all');
                            setPackageSearchQuery('');
                            setSelectedSubjectFilter('all');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
                        >
                          Tampilkan Seluruh Paket Ujian
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            sounds.playClick();
                            setExamFlowStep('kategori');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-850 text-slate-400 font-bold text-xs cursor-pointer border border-slate-800"
                        >
                          Kembali Pilih Kategori
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                }

                const grouped = activeExams.reduce((acc, pkg) => {
                  const m = pkg.mataPelajaran || 'Lainnya';
                  if (!acc[m]) acc[m] = [];
                  acc[m].push(pkg);
                  return acc;
                }, {} as Record<string, ExamPackage[]>);

                return (Object.entries(grouped) as [string, ExamPackage[]][]).map(([mapel, pkgs], mapelIdx) => {
                  // Mapel theme configuration
                  const isMat = mapel.toLowerCase().includes('matematika');
                  const isIpas = mapel.toLowerCase().includes('alam') || mapel.toLowerCase().includes('ipas');
                  const isIndo = mapel.toLowerCase().includes('indonesia');
                  const isPancasila = mapel.toLowerCase().includes('pancasila') || mapel.toLowerCase().includes('ppkn');

                  let mapelHeaderGradient = 'from-blue-600 via-indigo-600 to-cyan-500';
                  let mapelHeaderBg = 'from-blue-950/70 via-indigo-950/50 to-slate-900 border-blue-500/50 text-blue-200';
                  let mapelEmoji = '📚';
                  let mapelCardBorder = 'hover:border-cyan-400 group-hover:shadow-cyan-500/20';
                  let mapelCardBg = 'from-[#0A162C] via-[#0D1F3E] to-[#071124]';
                  let mapelSubtitle = 'Asesmen & Misi Pembelajaran Digital';

                  if (isMat) {
                    mapelHeaderGradient = 'from-cyan-500 via-blue-600 to-indigo-600';
                    mapelHeaderBg = 'from-cyan-950/70 via-blue-950/50 to-slate-900 border-cyan-500/50 text-cyan-200';
                    mapelEmoji = '📐';
                    mapelCardBorder = 'hover:border-cyan-400 group-hover:shadow-cyan-500/25';
                    mapelCardBg = 'from-[#07192C] via-[#09223D] to-[#05111E]';
                    mapelSubtitle = 'Eksplorasi Logika, Pecahan, Bilangan & Bangun Datar';
                  } else if (isIpas) {
                    mapelHeaderGradient = 'from-emerald-500 via-teal-600 to-cyan-600';
                    mapelHeaderBg = 'from-emerald-950/70 via-teal-950/50 to-slate-900 border-emerald-500/50 text-emerald-200';
                    mapelEmoji = '🔬';
                    mapelCardBorder = 'hover:border-emerald-400 group-hover:shadow-emerald-500/25';
                    mapelCardBg = 'from-[#07241A] via-[#092E22] to-[#04140F]';
                    mapelSubtitle = 'Eksperimen Alam, Makhluk Hidup & Fenomena Sekitar';
                  } else if (isIndo) {
                    mapelHeaderGradient = 'from-amber-500 via-orange-600 to-rose-600';
                    mapelHeaderBg = 'from-amber-950/70 via-orange-950/50 to-slate-900 border-amber-500/50 text-amber-200';
                    mapelEmoji = '📖';
                    mapelCardBorder = 'hover:border-amber-400 group-hover:shadow-amber-500/25';
                    mapelCardBg = 'from-[#281507] via-[#331C0B] to-[#160B03]';
                    mapelSubtitle = 'Literasi, Cerita Menarik, Kosakata & Pemahaman Teks';
                  } else if (isPancasila) {
                    mapelHeaderGradient = 'from-violet-500 via-purple-600 to-pink-600';
                    mapelHeaderBg = 'from-violet-950/70 via-purple-950/50 to-slate-900 border-violet-500/50 text-violet-200';
                    mapelEmoji = '🏛️';
                    mapelCardBorder = 'hover:border-violet-400 group-hover:shadow-violet-500/25';
                    mapelCardBg = 'from-[#1E0D2C] via-[#28123C] to-[#100619]';
                    mapelSubtitle = 'Nilai Gotong Royong, Karakter Mulia & Keberagaman';
                  }

                  return (
                    <motion.div
                      key={mapel}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: mapelIdx * 0.08 }}
                      className="space-y-4"
                    >
                      {/* Interactive Subject Header Banner */}
                      <div className={`p-4 rounded-3xl bg-gradient-to-r ${mapelHeaderBg} border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg relative overflow-hidden`}>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mapelHeaderGradient} text-white flex items-center justify-center text-2xl shadow-md shrink-0 ring-2 ring-white/20`}>
                            {mapelEmoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base sm:text-lg font-black text-white tracking-wide">
                                {mapel}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/20">
                                {pkgs.length} Naskah Soal Siap Dikerjakan
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium">
                              {mapelSubtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            Hadiah XP Maksimal
                          </span>
                        </div>
                      </div>

                      {/* Interactive Colorful Exam Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pkgs.map((pkg, pIdx) => {
                          const totalSoal = pkg.soalDocument?.ringkasanDistribusi?.totalSoal || 10;
                          return (
                            <motion.div
                              key={pkg.id}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: pIdx * 0.05 }}
                              whileHover={{ scale: 1.025, y: -5 }}
                              onMouseEnter={() => sounds.playCardHover()}
                              className={`group bg-gradient-to-b ${mapelCardBg} rounded-3xl border-2 border-slate-700/80 ${mapelCardBorder} p-5 shadow-xl hover:shadow-2xl transition-colors flex flex-col justify-between space-y-4 relative overflow-hidden`}
                            >
                              {/* Top Banner & Assessment Tag */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-white/10 text-white border border-white/15 uppercase tracking-wider">
                                    {pkg.fase} • Kelas {pkg.kelas}
                                  </span>
                                  <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    +500 XP
                                  </span>
                                </div>

                                {pkg.tipePenyusun === 'otomatis_tp' ? (
                                  <div className="bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-slate-950" />
                                    <span>Latihan Bab TP</span>
                                  </div>
                                ) : (
                                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                                    <span>Ujian Guru</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-base sm:text-lg font-black text-white leading-snug group-hover:text-amber-300 transition-colors">
                                    {pkg.judul}
                                  </h4>
                                  {pkg.daftarTP && pkg.daftarTP.length > 0 && pkg.daftarTP[0] && (
                                    <p className="text-[11px] text-emerald-200/90 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl mt-2 flex items-center gap-1.5 truncate">
                                      <span className="font-bold text-emerald-300 shrink-0">{pkg.daftarTP[0].kodeTP || 'TP'}:</span>
                                      <span className="truncate">{pkg.daftarTP[0].rumusanTP}</span>
                                    </p>
                                  )}
                                </div>

                                {/* Game Stats Bar */}
                                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-white/10 text-slate-300 font-semibold">
                                  <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                                    <span>{pkg.durasiMenit || 120} Menit</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-xl">
                                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{totalSoal} Soal Tantangan</span>
                                  </div>
                                </div>
                              </div>

                              {/* Button: Buka Petunjuk Pengerjaan & Hapus Paket (Guru) */}
                              <div className="flex items-center gap-2 w-full">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    sounds.playClick();
                                    setBriefingPackage(pkg);
                                  }}
                                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 transition-all"
                                >
                                  <FileText className="w-4 h-4 text-slate-950" />
                                  <span>Lihat Petunjuk & Mulai Ujian 📋</span>
                                </motion.button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playClick();
                                    setDeleteTargetPackage(pkg);
                                  }}
                                  className="p-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400 cursor-pointer transition-all shrink-0"
                                  title="Guru: Hapus Paket Soal Ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </motion.div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: KAMAR BAHAN AJAR & MEDIA PEMBELAJARAN (PDF, GAMBAR, PPT, VIDEO) */}
      {/* ===================================================================== */}
      {activeTab === 'bacaan' && (
        <KamarBahanAjarView
          identitas={identitas}
          showToast={showToast}
          isTeacherMode={false}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 3: RIWAYAT & NILAI SAYA (CAPAIAN BELAJAR PRIBADI MURID)            */}
      {/* ===================================================================== */}
      {activeTab === 'capaian' && (
        <div className="space-y-6">
          {/* Header Profil Murid */}
          <div className="bg-gradient-to-r from-[#0E1B38] via-[#0A162D] to-[#0E1B38] rounded-3xl border border-blue-900/60 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 shrink-0">
                  🎓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Profil Peserta Didik
                    </span>
                    <span className="text-xs text-slate-400">
                      {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {selectedStudent ? selectedStudent.nama : 'Belum Memilih Nama Siswa'}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                    <span>NISN: <strong className="text-amber-300">{selectedStudent?.nisn || '-'}</strong></span>
                    <span>•</span>
                    <span>Kelas: <strong className="text-cyan-300">{selectedStudent?.kelas || identitas.kelas || 'VI'}</strong></span>
                  </p>
                </div>
              </div>

              {!selectedStudent ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ujian');
                    setExamFlowStep('kategori');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all self-start md:self-auto"
                >
                  Pilih Nama Kamu di Sini 👈
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStudent(null);
                      setStudentName('');
                      setStudentNisn('');
                      localStorage.removeItem('sipartan_active_student');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Ganti Siswa</span>
                  </button>
                </div>
              )}
            </div>

            {/* Statistik Capaian Nilai Siswa */}
            {selectedStudent && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Total Ujian Selesai</div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-baseline gap-1">
                    <span>{studentPersonalSubmissions.length}</span>
                    <span className="text-xs text-slate-400 font-normal">Paket</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Rata-Rata Nilai</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-1">
                    <span>{studentAvgScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Nilai Tertinggi</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-1">
                    <span>{studentHighScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Ketuntasan KKTP (75)</div>
                  <div className="text-xl sm:text-2xl font-black text-teal-400 mt-1 flex items-baseline gap-1">
                    <span>{studentPersonalSubmissions.filter((s) => (s.score || 0) >= 75).length}</span>
                    <span className="text-xs text-slate-400 font-normal">Tuntas</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daftar Riwayat Ujian Siswa */}
          <div className="bg-[#0B1528] rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h4 className="text-base sm:text-lg font-black text-white">
                  Riwayat Ujian &amp; Pembahasan Jawaban
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {studentPersonalSubmissions.length} Hasil Tersimpan
              </span>
            </div>

            {!selectedStudent ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
                <p className="text-sm text-slate-300">
                  Silakan pilih profil murid di tab <strong>🎮 Misi Ulangan &amp; Ujian CBT</strong> untuk melihat rekaman nilai pribadimu.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ujian')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Buka Tab Ujian CBT
                </button>
              </div>
            ) : studentPersonalSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl mx-auto">
                  ✨
                </div>
                <h5 className="text-base font-black text-white">Belum Ada Ujian yang Diselesaikan</h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Kamu belum menyelesaikan ujian CBT. Ayo mulai kerjakan latihan soal atau ulangan harian yang telah diaktifkan oleh Bapak/Ibu Guru!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ujian')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Mulai Kerjakan Misi Ujian Sekarang 🚀
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {studentPersonalSubmissions.map((sub, idx) => {
                  const score = sub.score || 0;
                  const isPass = score >= 75;
                  const formattedDate = sub.submittedAt
                    ? new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <motion.div
                      key={sub.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {sub.mapel || 'Semua Mata Pelajaran'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isPass
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {isPass ? '✅ Tuntas (KKTP)' : 'Perlu Bimbingan'}
                          </span>
                        </div>

                        <h5 className="text-sm sm:text-base font-black text-white leading-snug">
                          {sub.judulPaket || 'Ujian CBT'}
                        </h5>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dikerjakan: {formattedDate}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-2xl font-black ${
                              score >= 85
                                ? 'text-emerald-400'
                                : score >= 75
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {score}
                          </span>
                          <span className="text-xs text-slate-500 font-normal">/ 100</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedReviewSubmission(sub);
                            setShowExplanationModal(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-indigo-500/40 flex items-center gap-1.5 shadow-xs"
                          title="Lihat pembahasan setiap butir soal dan kunci jawaban"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Pembahasan</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}



      {/* ===================================================================== */}
      {/* MODAL 1: PERINGATAN WAJIB MENYELESAIKAN SELURUH SOAL                   */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showMustCompleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0B1528] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-slate-100"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg">
                ⚠️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  Wajib Menyelesaikan Seluruh Soal!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Masih ada <strong className="text-amber-400 font-black">{getUnansweredQuestions().length} butir soal</strong> yang belum kamu jawab.
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1 text-left">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sisa Waktu Ujian:</span>
                    <strong className="text-cyan-400 font-mono text-sm">{formatTime(timeLeftSeconds)}</strong>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-normal pt-1">
                    📌 <em>Aturan Ujian: Murid wajib menyelesaikan seluruh butir soal selama waktu masih tersedia. Kamu tidak dapat mengakhiri ujian sebelum waktu selesai atau seluruh soal terjawab.</em>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowMustCompleteModal(false);
                  const firstUnanswered = getUnansweredQuestions()[0];
                  if (firstUnanswered) {
                    const idx = flatQuestions.findIndex((q) => q.displayNum === firstUnanswered.displayNum);
                    if (idx !== -1) setCurrentQuestionIndex(idx);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-lg shadow-amber-500/25 transition-all"
              >
                Lanjutkan Kerjakan Soal Tersisa ✍️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL 2: KONFIRMASI TAMBAHAN WAKTU (10 ATAU 15 MENIT)                   */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showExtraTimeConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0B1528] border-2 border-cyan-500 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-slate-100"
            >
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border-2 border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto text-3xl shadow-lg">
                ⏱️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  Waktu Habis: Ambil Tambahan Waktu?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Waktu reguler telah habis, namun kamu masih memiliki <strong className="text-amber-400 font-black">{getUnansweredQuestions().length} butir soal</strong> yang belum terselesaikan.
                </p>
                <p className="text-xs text-cyan-300">
                  Pilih tambahan waktu untuk menyelesaikan sisa soal kamu:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyExtraTime(10)}
                  className="p-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 hover:text-white font-black text-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-lg hover:scale-103"
                >
                  <span className="text-2xl">⚡</span>
                  <span>+10 Menit</span>
                  <span className="text-[10px] text-cyan-300 font-normal">Cukup untuk beberapa soal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyExtraTime(15)}
                  className="p-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400 text-amber-200 hover:text-white font-black text-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-lg hover:scale-103"
                >
                  <span className="text-2xl">🔥</span>
                  <span>+15 Menit</span>
                  <span className="text-[10px] text-amber-300 font-normal">Waktu ekstra maksimal</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtraTimeConfirmModal(false);
                    handleFinishExam(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer transition-all border border-slate-700"
                >
                  Tidak, Simpan &amp; Kirim Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL 3: KONFIRMASI AKHIRI UJIAN (SEMUA SOAL TERJAWAB)                 */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showConfirmFinishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0B1528] border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl text-slate-100"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg">
                ✅
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  Konfirmasi Selesai Ujian
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Luar biasa! Seluruh <strong className="text-emerald-400 font-black">{flatQuestions.length} butir soal</strong> telah kamu jawab dengan lengkap.
                </p>
                <p className="text-xs text-slate-400">
                  Apakah kamu yakin ingin mengakhiri ujian dan mengirim hasil pengerjaan ke guru sekarang?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowConfirmFinishModal(false);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
                >
                  Periksa Kembali 🔍
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    handleFinishExam(false);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Ya, Kirim Jawaban 🚀'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL PETUNJUK PENGERJAAN UJIAN (MISSION BRIEFING MODAL) */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {briefingPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0B1528] rounded-3xl border-2 border-amber-400/90 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-slate-100 my-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                      📋 Petunjuk Pengerjaan Ujian
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {briefingPackage.jenisAsesmen}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {briefingPackage.judul}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Mata Pelajaran: <strong className="text-cyan-300">{briefingPackage.mataPelajaran}</strong> • Kelas {briefingPackage.kelas} SD Negeri Fatubai
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    sounds.playClick();
                    setBriefingPackage(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  title="Tutup"
                >
                  ✕
                </motion.button>
              </div>

              {/* Identitas Siswa & Spesifikasi Ujian */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E1E] p-4 rounded-2xl border border-slate-700 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Nama Peserta</span>
                  <span className="text-xs font-black text-white block truncate">{studentName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">NIS / NISN Siswa</span>
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    {selectedStudent?.nis && selectedStudent?.nisn && selectedStudent.nis !== selectedStudent.nisn
                      ? `NIS: ${selectedStudent.nis} • NISN: ${selectedStudent.nisn}`
                      : selectedStudent?.nis
                      ? `NIS: ${selectedStudent.nis}`
                      : studentNisn}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Durasi Waktu</span>
                  <span className="text-xs font-black text-amber-300 block">{briefingPackage.durasiMenit || 60} Menit</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Jumlah Soal</span>
                  <span className="text-xs font-black text-emerald-400 block">
                    {briefingPackage.soalDocument?.ringkasanDistribusi?.totalSoal || 10} Butir Soal
                  </span>
                </div>
              </div>

              {/* Rincian Petunjuk Pengerjaan */}
              <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Aturan & Petunjuk Pengerjaan Resmi:</span>
                </h4>
                <ol className="space-y-2 text-xs text-slate-200 list-decimal pl-4 leading-relaxed">
                  <li>
                    <strong>Berdoa terlebih dahulu</strong> sebelum memulai pengerjaan soal sesuai dengan agama dan kepercayaan masing-masing.
                  </li>
                  <li>
                    <strong>Bacalah setiap butir pertanyaan dengan tenang, seksama, dan cermat</strong> sebelum memilih atau mengetikkan jawaban.
                  </li>
                  <li>
                    <strong>Kerjakan soal yang kamu anggap lebih mudah</strong> terlebih dahulu untuk menghemat waktu.
                  </li>
                  <li>
                    Gunakan tombol <strong>&quot;Tandai Ragu-Ragu&quot; (🚩)</strong> jika kamu belum yakin dengan jawabanmu agar dapat diperiksa kembali nanti.
                  </li>
                  <li>
                    Butir soal dalam ujian digital ini <strong>sama persis dengan naskah soal resmi dari bapak/ibu guru</strong>.
                  </li>
                  <li>
                    Periksa kembali seluruh nomor dari awal sampai akhir sebelum menekan tombol <strong>&quot;Selesaikan Misi Ujian&quot;</strong>.
                  </li>
                  <li>
                    Waktu pengerjaan akan <strong>berjalan mundur secara otomatis</strong> segera setelah kamu menekan tombol Mulai di bawah ini.
                  </li>
                </ol>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    sounds.playClick();
                    setBriefingPackage(null);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700 transition-colors"
                >
                  ← Kembali ke Pilihan Mapel
                </motion.button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const pkg = briefingPackage;
                      setBriefingPackage(null);
                      handleStartExamDirect(pkg, true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>💡 Mode Latihan &amp; Pembahasan Langsung</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const pkg = briefingPackage;
                      setBriefingPackage(null);
                      handleStartExamDirect(pkg, false);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <span>🚀 Mode Ujian CBT Resmi</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Generate Chapter Exercise Modal (Berdasarkan TP Kurikulum & Bank Materi SD) */}
      <AutoGenerateExerciseModal
        isOpen={isAutoGenerateModalOpen}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        identitas={identitas}
        tpList={tpList}
        onPackageCreated={(newPkg) => {
          setExamPackages((prev) => [newPkg, ...prev]);
          showToast(`✨ Soal latihan "${newPkg.judul}" berhasil disusun & dimasukkan ke Ruang Murid!`);
          refreshData();
        }}
        onBatchCreated={(count) => {
          showToast(`⚡ ${count} paket soal latihan bab berhasil disusun serentak & dimasukkan ke Ruang Murid!`);
          refreshData();
        }}
        showToast={showToast}
      />

      {/* Student Exam Review Modal (Kunci Jawaban, Pembahasan Lengkap & Analisis TP) */}
      <StudentExamReviewModal
        isOpen={showExplanationModal}
        onClose={() => {
          setShowExplanationModal(false);
          setSelectedReviewSubmission(null);
        }}
        submission={selectedReviewSubmission || examResult || lastSubmissionData?.submission}
        examPackage={
          activeExamToTake ||
          lastSubmissionData?.pkg ||
          examPackages.find(
            (p) => p.id === (selectedReviewSubmission?.paketId || examResult?.paketId || lastSubmissionData?.submission.paketId)
          )
        }
      />

      {/* Confirmation of Successful Submission (Multi-Device & Teacher Sync) */}
      <ExamSubmissionSuccessModal
        isOpen={isSuccessModalOpen}
        submission={lastSubmissionData?.submission || examResult || null}
        pkg={lastSubmissionData?.pkg || activeExamToTake || null}
        onViewReview={() => {
          setIsSuccessModalOpen(false);
          setShowExplanationModal(true);
        }}
        onBackToHome={() => {
          setIsSuccessModalOpen(false);
          setShowExplanationModal(false);
          setExamResult(null);
          setActiveExamToTake(null);
          setIsExamStarted(false);
          setExamFlowStep('kategori');
        }}
      />

      {/* Verification Modal for Teacher Access in Ruang Murid */}
      <TeacherAccessModal
        isOpen={isTeacherAuthModalOpen}
        onClose={() => {
          setIsTeacherAuthModalOpen(false);
          setPendingTeacherAction(null);
        }}
        onSuccess={handleTeacherAuthSuccess}
        featureName={pendingTeacherAction?.label || 'Fitur Khusus Guru'}
        featureDescription={pendingTeacherAction?.description}
        identitas={identitas}
        activeAccessRecord={activeAccessRecord}
      />
    </motion.div>
  );
};

export const RuangMuridView: React.FC<RuangMuridViewProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Ruang Murid SDN Fatubai"
      onReset={() => props.showToast('Memuat ulang ruang murid...')}
    >
      <RuangMuridViewContent {...props} />
    </ErrorBoundary>
  );
};
