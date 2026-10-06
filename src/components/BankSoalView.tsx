import React, { useState, useEffect } from 'react';
import {
  SchoolIdentity,
  TPItem,
  ATPDocument,
  KisiKisiSoalDocument,
  KonfigurasiKisiKisiSoal,
  KonfigurasiJenisSoal,
  JenisAsesmenSoal,
  JenisBentukSoal,
  LevelKognitifSoal,
  AccessRecord,
} from '../types';
import {
  getDefaultKonfigurasiSoal,
  generateKisiKisiDanNaskahSoal,
  getCpColumnDisplay,
  calculateElementDistribution,
  calculateElementDistributionByJP,
} from '../utils/kisiKisiSoalGenerator';
import {
  exportKisiKisiToWord,
  exportNaskahSoalToWord,
  exportKunciJawabanToWord,
  exportKisiKisiToPDF,
  exportNaskahSoalToPDF,
  exportKunciJawabanToPDF,
  formatTitimangsaDokumen,
} from '../utils/soalExportUtils';
import { executePrintWithLayout, loadSavedPDFLayout } from '../utils/printLayoutUtils';
import { cleanTPTextWithoutCode } from '../utils/curriculumCPResolver';
import { BankSoalPrintConfirmModal } from './BankSoalPrintConfirmModal';
import { PDFLayoutOptions } from '../types';
import {
  FileQuestion,
  Sparkles,
  Printer,
  Download,
  CheckCircle2,
  Settings,
  ListChecks,
  FileText,
  KeyRound,
  ShieldCheck,
  Check,
  Edit2,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  BarChart2,
  RefreshCw,
  BookOpen,
  MapPin,
  Building2,
  Rocket,
  Send,
  ArrowRight,
  Zap,
  AlertTriangle,
  Plus,
  Minus,
  PieChart,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AutoGenerateExerciseModal } from './AutoGenerateExerciseModal';
import { autoSyncExercisesForCurriculumTP } from '../services/chapterExerciseAutoService';

const POPULAR_SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Seni Rupa',
  'Seni Musik',
  'Seni Tari',
  'Seni Teater',
  'Pendidikan Agama Katolik dan Budi Pekerti',
  'Bahasa Inggris',
  'Muatan Lokal (Bahasa Daerah)',
];

const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  for (const m of monthsIndo) {
    if (dateStr.toLowerCase().includes(m.toLowerCase())) return dateStr;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      return `${day} ${monthsIndo[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

const convertIndoDateToISO = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  for (let i = 0; i < monthsIndo.length; i++) {
    const m = monthsIndo[i];
    if (dateStr.toLowerCase().includes(m.toLowerCase())) {
      const match = dateStr.match(/(\d{1,2})\s+[A-Za-z]+\s+(\d{4})/);
      if (match) {
        const d = match[1].padStart(2, '0');
        const mo = String(i + 1).padStart(2, '0');
        const y = match[2];
        return `${y}-${mo}-${d}`;
      }
    }
  }
  return '';
};

interface BankSoalViewProps {
  identitas: SchoolIdentity;
  tpList: TPItem[];
  atpDocument: ATPDocument | null;
  soalDocument: KisiKisiSoalDocument | null;
  onUpdateSoalDocument: (doc: KisiKisiSoalDocument) => void;
  onSavePermanent: (doc: KisiKisiSoalDocument) => void;
  isSavedPermanent: boolean;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (newIdentitas: SchoolIdentity) => void;
  onOpenSubjectPicker?: () => void;
  activeAccessRecord?: AccessRecord | null;
  onPublishToRuangMurid?: (doc: KisiKisiSoalDocument) => void;
  onNavigateToRuangMurid?: () => void;
  onNavigateToRapor?: () => void;
}

export const BankSoalView: React.FC<BankSoalViewProps> = ({
  identitas,
  tpList,
  atpDocument,
  soalDocument,
  onUpdateSoalDocument,
  onSavePermanent,
  isSavedPermanent,
  onOpenEditIdentity,
  onUpdateIdentitas,
  onOpenSubjectPicker,
  activeAccessRecord,
  onPublishToRuangMurid,
  onNavigateToRuangMurid,
  onNavigateToRapor,
}) => {
  // Active inner tab
  const [activeTab, setActiveTab] = useState<'config' | 'kisikisi' | 'naskah' | 'kunci'>('config');

  // Konfigurasi state
  const [config, setConfig] = useState<KonfigurasiKisiKisiSoal>(() => {
    let base = soalDocument ? soalDocument.konfigurasi : getDefaultKonfigurasiSoal('Ulangan Harian', identitas, tpList);
    if (!base.alokasiSoalPerElemen || Object.keys(base.alokasiSoalPerElemen).length === 0) {
      const activeTPs = (tpList || []).filter((t) => (base.selectedTPCodes || []).includes(t.kodeTP));
      const pool = activeTPs.length > 0 ? activeTPs : (tpList || []);
      const elements = Array.from(new Set(pool.map((t) => (t.elemen || 'Elemen Pokok').trim())));
      const total = Object.values(base.konfigurasiSoal)
        .filter((k) => k.enabled)
        .reduce((sum, curr) => sum + (Number(curr.jumlahSoal) || 0), 0);
      base = {
        ...base,
        alokasiSoalPerElemen: calculateElementDistribution(elements, total),
      };
    }
    return base;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [wordMenuOpen, setWordMenuOpen] = useState(false);
  const [customMapelOpen, setCustomMapelOpen] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [isSyncingExercises, setIsSyncingExercises] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Modal konfirmasi KOP 4 Baris, Unggah Logo, Pemilihan Kelas, Titimangsa & Tahun Pelajaran sebelum Cetak / Unduh Dokumen
  const [printConfirmModalState, setPrintConfirmModalState] = useState<{
    isOpen: boolean;
    actionType: 'PRINT' | 'WORD' | 'PDF';
    target: 'kisi-kisi' | 'naskah' | 'kunci';
  } | null>(null);

  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);

  const handleOpenPrintConfirm = (target: 'kisi-kisi' | 'naskah' | 'kunci', actionType: 'PRINT' | 'WORD' | 'PDF') => {
    if (!soalDocument) return;
    setPrintConfirmModalState({
      isOpen: true,
      actionType,
      target,
    });
  };

  const handlePrintConfirmExecute = (
    updatedIdentitas: SchoolIdentity,
    updatedKonfigurasi: KonfigurasiKisiKisiSoal,
    actionType: 'PRINT' | 'WORD' | 'PDF',
    target: 'kisi-kisi' | 'naskah' | 'kunci'
  ) => {
    if (!soalDocument) return;

    if (onUpdateIdentitas) {
      onUpdateIdentitas(updatedIdentitas);
    }

    const updatedDoc: KisiKisiSoalDocument = {
      ...soalDocument,
      identitas: updatedIdentitas,
      konfigurasi: updatedKonfigurasi,
    };

    if (onUpdateSoalDocument) {
      onUpdateSoalDocument(updatedDoc);
    }

    if (actionType === 'PRINT') {
      const isLandscape = target === 'kisi-kisi';
      executePrintWithLayout(loadSavedPDFLayout(isLandscape ? 'landscape' : 'portrait'));
    } else if (actionType === 'WORD') {
      if (target === 'naskah') {
        exportNaskahSoalToWord(updatedDoc);
      } else if (target === 'kisi-kisi') {
        exportKisiKisiToWord(updatedDoc);
      } else if (target === 'kunci') {
        exportKunciJawabanToWord(updatedDoc);
      }
    } else if (actionType === 'PDF') {
      if (target === 'kisi-kisi') {
        exportKisiKisiToPDF(updatedDoc);
      } else if (target === 'naskah') {
        exportNaskahSoalToPDF(updatedDoc);
      } else if (target === 'kunci') {
        exportKunciJawabanToPDF(updatedDoc);
      }
    }

    setPrintConfirmModalState(null);
  };

  const handleQuickSyncAllExercises = async () => {
    if (!tpList || tpList.length === 0) {
      alert('Belum ada Tujuan Pembelajaran (TP) yang terdaftar. Silakan masukkan TP pada menu Analisis CP & TP terlebih dahulu.');
      return;
    }
    setIsSyncingExercises(true);
    try {
      const res = await autoSyncExercisesForCurriculumTP(tpList, identitas);
      setSyncSuccessMessage(`🎉 Berhasil menyusun ${res.totalCreated} paket latihan bab otomatis ke Ruang Murid! Siswa kini dapat langsung belajar mandiri di Ruang Latihan.`);
      setTimeout(() => setSyncSuccessMessage(null), 6000);
    } catch (e) {
      console.error(e);
      alert('Gagal menyusun latihan bab otomatis.');
    } finally {
      setIsSyncingExercises(false);
    }
  };

  // Auto-sync configuration and doc with incoming identitas updates
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      mataPelajaran: identitas.mataPelajaran || prev.mataPelajaran,
      fase: identitas.fase || prev.fase,
      kelas: identitas.kelas || prev.kelas,
      semester: identitas.semester || prev.semester,
      tahunPelajaran: identitas.tahunPelajaran || prev.tahunPelajaran,
      tanggalPelaksanaan: prev.tanggalPelaksanaan || identitas.tanggalPenetapan || '22 September 2026',
    }));
  }, [identitas.mataPelajaran, identitas.fase, identitas.kelas, identitas.semester, identitas.tahunPelajaran, identitas.tanggalPenetapan]);

  useEffect(() => {
    if (soalDocument) {
      const isOutdated =
        soalDocument.identitas.namaSatuanPendidikan !== (identitas.namaSatuanPendidikan || identitas.namaSekolah) ||
        soalDocument.identitas.namaGuru !== identitas.namaGuru ||
        soalDocument.identitas.nipGuru !== identitas.nipGuru ||
        soalDocument.identitas.namaKepalaSekolah !== identitas.namaKepalaSekolah ||
        soalDocument.identitas.nipKepalaSekolah !== identitas.nipKepalaSekolah ||
        soalDocument.identitas.mataPelajaran !== identitas.mataPelajaran ||
        soalDocument.identitas.tempatPenetapan !== identitas.tempatPenetapan ||
        soalDocument.identitas.tanggalPenetapan !== identitas.tanggalPenetapan;

      if (isOutdated) {
        onUpdateSoalDocument({
          ...soalDocument,
          identitas: {
            ...soalDocument.identitas,
            ...identitas,
            namaSatuanPendidikan: identitas.namaSatuanPendidikan || identitas.namaSekolah,
          },
        });
      }
    }
  }, [identitas]);

  const handleSelectMataPelajaran = (newMapel: string) => {
    if (!newMapel.trim()) return;
    setConfig((prev) => ({ ...prev, mataPelajaran: newMapel.trim() }));
    if (onUpdateIdentitas) {
      onUpdateIdentitas({ ...identitas, mataPelajaran: newMapel.trim() });
    }
    if (soalDocument) {
      onUpdateSoalDocument({
        ...soalDocument,
        identitas: { ...soalDocument.identitas, mataPelajaran: newMapel.trim() },
      });
    }
  };

  const handleChangeTempat = (newTempat: string) => {
    if (onUpdateIdentitas) {
      onUpdateIdentitas({ ...identitas, tempatPenetapan: newTempat });
    }
    if (soalDocument) {
      onUpdateSoalDocument({
        ...soalDocument,
        identitas: { ...soalDocument.identitas, tempatPenetapan: newTempat },
      });
    }
  };

  const handleChangeTanggal = (newDateStr: string) => {
    const formatted = formatIndonesianDate(newDateStr);
    setConfig((prev) => ({ ...prev, tanggalPelaksanaan: formatted }));
    if (onUpdateIdentitas) {
      onUpdateIdentitas({ ...identitas, tanggalPenetapan: formatted });
    }
    if (soalDocument) {
      onUpdateSoalDocument({
        ...soalDocument,
        konfigurasi: { ...soalDocument.konfigurasi, tanggalPelaksanaan: formatted },
        identitas: { ...soalDocument.identitas, tanggalPenetapan: formatted },
      });
    }
  };

  // Available TPs from tpList or atpDocument
  const availableTPs = tpList.length > 0
    ? tpList
    : (atpDocument?.atpList || []).map((a, i) => ({
        id: `tp-auto-${i}`,
        kodeTP: a.kodeTP,
        elemen: a.elemen || 'Elemen Pokok',
        kalimatCP: a.kalimatCP || atpDocument?.capaianPembelajaran || '',
        kompetensi: 'Memahami dan menerapkan',
        lingkupMateri: a.lingkupMateri || 'Materi Pokok',
        rumusanTP: a.tujuanPembelajaran,
        alokasiJP: a.alokasiJP,
        dimensiP3: a.dimensiP3 || [],
        semesterTarget: 'Semester 1' as const,
        urutanAlur: a.urutan,
      }));

  // 1. Logika Cerdas Multi-Elemen Kurikulum Merdeka
  const uniqueElements = React.useMemo(() => {
    const set = new Set<string>();
    availableTPs.forEach((tp) => {
      const el = (tp.elemen || 'Elemen Pokok').trim();
      if (el) set.add(el);
    });
    return Array.from(set);
  }, [availableTPs]);

  const tpsByElement = React.useMemo(() => {
    const map = new Map<string, TPItem[]>();
    uniqueElements.forEach((el) => map.set(el, []));
    availableTPs.forEach((tp) => {
      const el = (tp.elemen || 'Elemen Pokok').trim();
      if (!map.has(el)) map.set(el, []);
      map.get(el)!.push(tp);
    });
    return map;
  }, [availableTPs, uniqueElements]);

  // Elemen yang memiliki minimal 1 butir TP yang aktif dipilih
  const activeSelectedElements = React.useMemo(() => {
    const list: string[] = [];
    uniqueElements.forEach((el) => {
      const elTPs = tpsByElement.get(el) || [];
      const hasSelected = elTPs.some((t) => config.selectedTPCodes.includes(t.kodeTP));
      if (hasSelected) list.push(el);
    });
    return list;
  }, [uniqueElements, tpsByElement, config.selectedTPCodes]);

  // Apakah asesmen ini merupakan Asesmen Tengah / Akhir Semester (STS / SAS)
  const isSemesterExam =
    config.jenisAsesmen.includes('Tengah Semester') ||
    config.jenisAsesmen.includes('Semester 1') ||
    config.jenisAsesmen.includes('Semester 2');

  // Helper change jenis asesmen
  const handleSelectJenisAsesmen = (jenis: JenisAsesmenSoal) => {
    const newCfg = getDefaultKonfigurasiSoal(jenis, identitas, availableTPs);
    setConfig(newCfg);
  };

  // Toggle TP individual
  const handleToggleTP = (kodeTP: string) => {
    setConfig((prev) => {
      const exists = prev.selectedTPCodes.includes(kodeTP);
      const updated = exists
        ? prev.selectedTPCodes.filter((c) => c !== kodeTP)
        : [...prev.selectedTPCodes, kodeTP];

      // Periksa elemen aktif baru
      const newActive = uniqueElements.filter((el) => {
        const tps = tpsByElement.get(el) || [];
        return tps.some((t) => updated.includes(t.kodeTP));
      });

      const currentQuotas = { ...(prev.alokasiSoalPerElemen || {}) };
      // Jika ada elemen aktif baru yang belum ada kuotanya, hitung ulang proporsional
      const needsInit = newActive.some((el) => !currentQuotas[el] || currentQuotas[el] <= 0);
      const totalSoal = Object.values(prev.konfigurasiSoal)
        .filter((k) => k.enabled)
        .reduce((sum, curr) => sum + (Number(curr.jumlahSoal) || 0), 0);

      const updatedQuotas = needsInit
        ? calculateElementDistribution(newActive, totalSoal)
        : currentQuotas;

      return {
        ...prev,
        selectedTPCodes: updated,
        alokasiSoalPerElemen: updatedQuotas,
      };
    });
  };

  // Toggle seluruh TP di dalam satu elemen spesifik
  const handleToggleElementAllTPs = (element: string, selectAll: boolean) => {
    const elTPs = tpsByElement.get(element) || [];
    const elTPCodes = elTPs.map((t) => t.kodeTP);

    setConfig((prev) => {
      let updated: string[];
      if (selectAll) {
        updated = Array.from(new Set([...prev.selectedTPCodes, ...elTPCodes]));
      } else {
        updated = prev.selectedTPCodes.filter((c) => !elTPCodes.includes(c));
      }

      const newActive = uniqueElements.filter((el) => {
        const tps = tpsByElement.get(el) || [];
        return tps.some((t) => updated.includes(t.kodeTP));
      });

      const totalSoal = Object.values(prev.konfigurasiSoal)
        .filter((k) => k.enabled)
        .reduce((sum, curr) => sum + (Number(curr.jumlahSoal) || 0), 0);

      const newQuotas = calculateElementDistribution(newActive, totalSoal);

      return {
        ...prev,
        selectedTPCodes: updated,
        alokasiSoalPerElemen: newQuotas,
      };
    });
  };

  const handleSelectAllTP = () => {
    const allCodes = availableTPs.map((t) => t.kodeTP);
    const totalSoal = Object.values(config.konfigurasiSoal)
      .filter((k) => k.enabled)
      .reduce((sum, curr) => sum + (Number(curr.jumlahSoal) || 0), 0);

    const quotas = calculateElementDistribution(uniqueElements, totalSoal);
    setConfig((prev) => ({
      ...prev,
      selectedTPCodes: allCodes,
      alokasiSoalPerElemen: quotas,
    }));
  };

  const handleClearAllTP = () => {
    setConfig((prev) => ({ ...prev, selectedTPCodes: [], alokasiSoalPerElemen: {} }));
  };

  // Sertakan semua elemen semester aktif (rekomendasi wajib Kurikulum Merdeka)
  const handleIncludeAllSemesterElements = () => {
    const semesterStr = config.jenisAsesmen.includes('1')
      ? 'Semester 1'
      : config.jenisAsesmen.includes('2')
      ? 'Semester 2'
      : '';

    const targetTPs = availableTPs.filter(
      (t) => !semesterStr || !t.semesterTarget || t.semesterTarget === 'Fleksibel' || t.semesterTarget === semesterStr
    );
    const chosen = (targetTPs.length > 0 ? targetTPs : availableTPs).map((t) => t.kodeTP);

    const newActive = uniqueElements.filter((el) => {
      const tps = tpsByElement.get(el) || [];
      return tps.some((t) => chosen.includes(t.kodeTP));
    });

    const totalSoal = Object.values(config.konfigurasiSoal)
      .filter((k) => k.enabled)
      .reduce((sum, curr) => sum + (Number(curr.jumlahSoal) || 0), 0);

    const newQuotas = calculateElementDistribution(newActive, totalSoal);

    setConfig((prev) => ({
      ...prev,
      selectedTPCodes: chosen,
      alokasiSoalPerElemen: newQuotas,
    }));
  };

  // Update kuota jumlah soal per elemen secara manual oleh guru
  const handleUpdateElementQuota = (element: string, quota: number) => {
    setConfig((prev) => ({
      ...prev,
      alokasiSoalPerElemen: {
        ...(prev.alokasiSoalPerElemen || {}),
        [element]: Math.max(0, quota),
      },
    }));
  };

  // Total metrics bentuk soal
  const settingList = Object.values(config.konfigurasiSoal) as KonfigurasiJenisSoal[];
  const totalSoalKalkulasi = settingList.reduce(
    (acc, curr) => acc + (curr.enabled ? Number(curr.jumlahSoal) || 0 : 0),
    0
  );

  const totalSkorKalkulasi = settingList.reduce(
    (acc, curr) => acc + (curr.enabled ? (Number(curr.jumlahSoal) || 0) * (Number(curr.bobotPerSoal) || 1) : 0),
    0
  );

  const totalL1 = settingList.reduce(
    (acc, curr) => acc + (curr.enabled ? Number(curr.level1Count) || 0 : 0),
    0
  );
  const totalL2 = settingList.reduce(
    (acc, curr) => acc + (curr.enabled ? Number(curr.level2Count) || 0 : 0),
    0
  );
  const totalL3 = settingList.reduce(
    (acc, curr) => acc + (curr.enabled ? Number(curr.level3Count) || 0 : 0),
    0
  );

  // Total alokasi soal yang saat ini dibagi ke elemen-elemen
  const totalAllocatedToElements = React.useMemo(() => {
    const quotas = config.alokasiSoalPerElemen || {};
    return activeSelectedElements.reduce((sum, el) => sum + (Number(quotas[el]) || 0), 0);
  }, [config.alokasiSoalPerElemen, activeSelectedElements]);

  // Bagi rata otomatis kuota soal ke seluruh elemen aktif
  const handleDistributeEqually = () => {
    const targetElements = activeSelectedElements.length > 0 ? activeSelectedElements : uniqueElements;
    const dist = calculateElementDistribution(targetElements, totalSoalKalkulasi);
    setConfig((prev) => ({
      ...prev,
      alokasiSoalPerElemen: dist,
    }));
  };

  // Bagi proporsional berdasarkan bobot jam pelajaran (JP)
  const handleDistributeByJP = () => {
    const targetElements = activeSelectedElements.length > 0 ? activeSelectedElements : uniqueElements;
    const dist = calculateElementDistributionByJP(targetElements, availableTPs, totalSoalKalkulasi);
    setConfig((prev) => ({
      ...prev,
      alokasiSoalPerElemen: dist,
    }));
  };

  // Sinkronkan otomatis kuota elemen agar klop dengan total soal kalkulasi
  const handleAutoSyncElementQuotas = () => {
    const targetElements = activeSelectedElements.length > 0 ? activeSelectedElements : uniqueElements;
    if (targetElements.length === 0) return;
    const current = { ...(config.alokasiSoalPerElemen || {}) };
    const sum = targetElements.reduce((acc, el) => acc + (Number(current[el]) || 0), 0);
    const diff = totalSoalKalkulasi - sum;
    if (diff === 0) return;
    const firstEl = targetElements[0];
    current[firstEl] = Math.max(1, (Number(current[firstEl]) || 0) + diff);
    setConfig((prev) => ({
      ...prev,
      alokasiSoalPerElemen: current,
    }));
  };

  // Update specific question type configuration
  const handleUpdateJenisSoal = (
    jenis: JenisBentukSoal,
    field: 'enabled' | 'jumlahSoal' | 'level1Count' | 'level2Count' | 'level3Count' | 'bobotPerSoal',
    value: any
  ) => {
    setConfig((prev) => {
      const current = prev.konfigurasiSoal[jenis];
      const updated = { ...current, [field]: value };

      // Auto-rebalance levels if jumlahSoal changes
      if (field === 'jumlahSoal') {
        const total = Math.max(0, Number(value) || 0);
        const l1 = Math.round(total * 0.35);
        const l2 = Math.round(total * 0.45);
        const l3 = Math.max(0, total - l1 - l2);
        updated.level1Count = l1;
        updated.level2Count = l2;
        updated.level3Count = l3;
      }

      return {
        ...prev,
        konfigurasiSoal: {
          ...prev.konfigurasiSoal,
          [jenis]: updated,
        },
      };
    });
  };

  // Generate Document
  const handleGenerate = () => {
    if (config.selectedTPCodes.length === 0 && availableTPs.length > 0) {
      // Auto select all if none selected
      config.selectedTPCodes = availableTPs.map((t) => t.kodeTP);
    }

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const newDoc = generateKisiKisiDanNaskahSoal(identitas, availableTPs, atpDocument, config);
        onUpdateSoalDocument(newDoc);
        setActiveTab('kisikisi');
      } catch (err) {
        console.error('Failed to generate soal:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  const handlePrint = () => {
    const currentTarget: 'kisi-kisi' | 'naskah' | 'kunci' =
      activeTab === 'kisikisi' ? 'kisi-kisi' : activeTab === 'naskah' ? 'naskah' : 'kunci';
    handleOpenPrintConfirm(currentTarget, 'PRINT');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* Top Header Toolbar */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1528] text-amber-300 border-2 border-amber-400/60 flex items-center justify-center font-bold text-sm shadow-xs">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-950 border border-purple-300">
                  Tahap 9 • Kisi-Kisi &amp; Naskah Soal
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {identitas.mataPelajaran} (Fase {identitas.fase} • Kelas {identitas.kelas})
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                Perancangan Kisi-Kisi &amp; Naskah Soal Asesmen Sumatif Kurikulum Merdeka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenEditIdentity && (
              <button
                type="button"
                onClick={onOpenEditIdentity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 transition-all shadow-2xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Identitas</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Inner Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Inner Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="tab-btn-config"
              onClick={() => setActiveTab('config')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-purple-600" />
              <span>1. Pengaturan &amp; Generator</span>
            </button>

            <button
              id="tab-btn-kisikisi"
              onClick={() => setActiveTab('kisikisi')}
              disabled={!soalDocument}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'kisikisi'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : soalDocument
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Matriks Kisi-Kisi Soal</span>
              {soalDocument && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-800 font-black">
                  {soalDocument.tabelKisiKisi.length}
                </span>
              )}
            </button>

            <button
              id="tab-btn-naskah"
              onClick={() => setActiveTab('naskah')}
              disabled={!soalDocument}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'naskah'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : soalDocument
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Naskah Soal Siswa</span>
              {soalDocument && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-black">
                  {soalDocument.naskahSoal.totalButirSoal} Soal
                </span>
              )}
            </button>

            <button
              id="tab-btn-kunci"
              onClick={() => setActiveTab('kunci')}
              disabled={!soalDocument}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'kunci'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : soalDocument
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Kunci &amp; Penskoran</span>
            </button>
          </div>

          {/* Export & Save Buttons */}
          <div className="flex flex-wrap items-center gap-2">


            {/* Permanent Save Button */}
            {soalDocument && (
              <button
                id="btn-save-soal-permanent"
                onClick={() => onSavePermanent(soalDocument)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer shadow-xs ${
                  isSavedPermanent
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500 hover:brightness-105'
                }`}
                title="Simpan permanen ke arsip browser dan sinkronkan ke Firebase Cloud"
              >
                {isSavedPermanent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    <span>Tersimpan di Arsip &amp; Firebase</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Simpan Permanen ke Arsip &amp; Firebase</span>
                  </>
                )}
              </button>
            )}

            {/* Terbitkan Ujian Guru ke Ruang Murid (CBT) */}
            {soalDocument && (
              <button
                id="btn-publish-soal-to-murid"
                onClick={() => {
                  if (onPublishToRuangMurid) {
                    onPublishToRuangMurid(soalDocument);
                    setShowPublishSuccessModal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white border-2 border-indigo-400 shadow-xs transition-all cursor-pointer"
                title="Terbitkan naskah ujian resmi susunan guru ke Ruang Murid agar siswa dapat mengerjakan CBT secara langsung"
              >
                <Rocket className="w-3.5 h-3.5 text-amber-300" />
                <span>Terbitkan ke Ruang Murid (CBT)</span>
              </button>
            )}

            {/* Print */}
            {soalDocument && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white border-2 border-slate-700 hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                title="Cetak tampilan dokumen resmi"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak Lembar</span>
              </button>
            )}

            {/* PDF Export Dropdown */}
            {soalDocument && (
              <div className="relative">
                <button
                  onClick={() => {
                    setPdfMenuOpen(!pdfMenuOpen);
                    setWordMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-500 shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {pdfMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border-2 border-slate-200 p-1.5 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setPdfMenuOpen(false);
                        handleOpenPrintConfirm('kisi-kisi', 'PDF');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <ListChecks className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <div>Kisi-Kisi Soal (.pdf)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Wajib Landscape</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPdfMenuOpen(false);
                        handleOpenPrintConfirm('naskah', 'PDF');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <div>Naskah Soal Siswa (.pdf)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Wajib Portrait • Tanpa TTD</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPdfMenuOpen(false);
                        handleOpenPrintConfirm('kunci', 'PDF');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <div>Kunci &amp; Penskoran (.pdf)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Wajib Portrait • Rubrik</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Word Export Dropdown */}
            {soalDocument && (
              <div className="relative">
                <button
                  onClick={() => {
                    setWordMenuOpen(!wordMenuOpen);
                    setPdfMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-blue-700 hover:bg-blue-800 text-white border-2 border-blue-500 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Word</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {wordMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border-2 border-slate-200 p-1.5 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setWordMenuOpen(false);
                        handleOpenPrintConfirm('naskah', 'WORD');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <div>Naskah Soal Siswa (.doc)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Portrait • Tanpa TTD</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setWordMenuOpen(false);
                        handleOpenPrintConfirm('kisi-kisi', 'WORD');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <ListChecks className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <div>Matriks Kisi-Kisi Soal (.doc)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Wajib Landscape</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setWordMenuOpen(false);
                        handleOpenPrintConfirm('kunci', 'WORD');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 text-slate-800 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <div>Kunci &amp; Rubrik (.doc)</div>
                        <div className="text-[10px] text-slate-500 font-normal">Portrait • Rubrik Penskoran</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW CONTENT BASED ON ACTIVE INNER TAB */}

      {/* 1. CONFIGURATOR & GENERATOR */}
      {activeTab === 'config' && (
        <div className="space-y-5">
          {/* BANNER KHUSUS: SUSUN OTOMATIS SOAL LATIHAN HARIAN / BAB KE RUANG MURID */}
          <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-2 border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  Otomatisasi Kurikulum Berbasis TP
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Susun Otomatis Soal Latihan Harian / Bab ke Ruang Murid
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                💡 <b>Perbedaan Fungsi:</b> Soal latihan harian per bab dapat disusun secara otomatis berdasarkan materi untuk mencapai <b>Tujuan Pembelajaran (TP)</b> dan langsung diterbitkan ke Ruang Murid (dilengkapi pembahasan edukatif mandiri). Sedangkan untuk naskah <b>Ujian Resmi (STS / SAS / Ulangan Resmi)</b>, Bapak/Ibu Guru menyusun dan menerbitkannya melalui form kisi-kisi di bawah ini.
              </p>
              {syncSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickSyncAllExercises}
                disabled={isSyncingExercises}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                title="Menyusun otomatis paket latihan bab untuk semua TP kurikulum aktif ke Ruang Murid"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSyncingExercises ? 'Sedang Menyusun...' : '⚡ Susun Semua Latihan TP ke Murid'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAutoGenerateModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Buka generator untuk memilih TP spesifik atau katalog rekomendasi bab"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Pilih Bab Spesifik</span>
              </button>
            </div>
          </div>

          {/* Section 1: Identitas Dokumen, Pilihan Mata Pelajaran, & Konfirmasi Tempat-Tanggal */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Identitas Dokumen, Pilihan Mata Pelajaran, &amp; Konfirmasi Tempat-Tanggal
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sesuai data registrasi kode akses, dengan opsi pemilihan mata pelajaran &amp; konfirmasi tanggal asesmen
                  </p>
                </div>
              </div>

              {onOpenEditIdentity && (
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer self-start sm:self-auto"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lihat Profil Satuan Pendidikan</span>
                </button>
              )}
            </div>

            {/* Grid Form Pengaturan Mapel, Tempat, dan Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolom 1: Pilihan Mata Pelajaran */}
              <div className="space-y-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Pilihan Mata Pelajaran</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-extrabold bg-blue-100 px-1.5 py-0.5 rounded">
                    Wajib Ada di Dokumen
                  </span>
                </label>

                <div className="space-y-2">
                  <select
                    value={POPULAR_SUBJECTS.includes(identitas.mataPelajaran) ? identitas.mataPelajaran : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setCustomMapelOpen(true);
                      } else {
                        setCustomMapelOpen(false);
                        handleSelectMataPelajaran(e.target.value);
                      }
                    }}
                    className="w-full text-xs font-bold bg-white border border-blue-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {POPULAR_SUBJECTS.map((mapel) => (
                      <option key={mapel} value={mapel}>
                        {mapel}
                      </option>
                    ))}
                    <option value="custom">-- Ketik Mata Pelajaran Lainnya --</option>
                  </select>

                  {/* Input kustom jika mapel di luar opsi standar */}
                  {(!POPULAR_SUBJECTS.includes(identitas.mataPelajaran) || customMapelOpen) && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={identitas.mataPelajaran}
                        onChange={(e) => handleSelectMataPelajaran(e.target.value)}
                        placeholder="Ketik nama mata pelajaran..."
                        className="w-full text-xs font-bold bg-white border border-blue-400 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-blue-700 block">Ketik bebas nama mata pelajaran lokal/khusus</span>
                    </div>
                  )}

                  {onOpenSubjectPicker && (
                    <button
                      type="button"
                      onClick={onOpenSubjectPicker}
                      className="w-full text-left flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-blue-800 bg-white hover:bg-blue-100/60 border border-blue-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pilih dari Bank Mapel BSKAP (12 Mapel)</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Kolom 2: Konfirmasi Tempat Penetapan */}
              <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Konfirmasi Tempat Penetapan</span>
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={identitas.tempatPenetapan || ''}
                    onChange={(e) => handleChangeTempat(e.target.value)}
                    placeholder="Contoh: Fatubai / Jakarta / Kupang"
                    className="w-full text-xs font-bold bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10.5px] text-emerald-800 leading-tight">
                    Ditampilkan pada titimangsa lembar pengesahan Kisi-Kisi &amp; Kunci Jawaban.
                  </p>
                </div>
              </div>

              {/* Kolom 3: Konfirmasi Tanggal Pelaksanaan & Asesmen */}
              <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Konfirmasi Tanggal Asesmen</span>
                  </span>
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded">
                    Hari &amp; Tanggal
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={config.tanggalPelaksanaan || identitas.tanggalPenetapan || ''}
                      onChange={(e) => handleChangeTanggal(e.target.value)}
                      placeholder="Contoh: 22 September 2026"
                      className="flex-1 text-xs font-bold bg-white border border-amber-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="date"
                      value={convertIndoDateToISO(config.tanggalPelaksanaan || identitas.tanggalPenetapan)}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleChangeTanggal(e.target.value);
                        }
                      }}
                      className="w-10 text-xs bg-white border border-amber-300 rounded-lg p-1.5 cursor-pointer text-slate-700"
                      title="Pilih tanggal dari kalender"
                    />
                  </div>
                  <p className="text-[10.5px] text-amber-900 leading-tight">
                    Otomatis tercetak di kop naskah soal siswa &amp; tanda tangan resmi.
                  </p>
                </div>
              </div>
            </div>

            {/* Rekap Identitas Satuan Pendidikan & Guru Pengampu (Sesuai Form Registrasi Kode Akses) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B1528] text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Sesuai Form Registrasi Kode Akses
                    </span>
                    {activeAccessRecord?.kodeAkses && (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                        {activeAccessRecord.kodeAkses}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2.5">
                    <span><b>Guru:</b> {identitas.namaGuru} ({identitas.nipGuru || '-'})</span>
                    <span>•</span>
                    <span><b>Kepala Sekolah:</b> {identitas.namaKepalaSekolah} ({identitas.nipKepalaSekolah || '-'})</span>
                    <span>•</span>
                    <span><b>Fase/Kelas:</b> {identitas.fase} - Kelas {identitas.kelas}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600">
                  Semester {identitas.semester} • TP {identitas.tahunPelajaran}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Pilih Jenis Pelaksanaan Asesmen */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Pilih Jenis Pelaksanaan Asesmen
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Pilih salah satu sesuai kalender akademik
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
              {(
                [
                  'Ulangan Harian',
                  'Tengah Semester 1',
                  'Semester 1',
                  'Tengah Semester 2',
                  'Semester 2',
                ] as JenisAsesmenSoal[]
              ).map((jenis) => {
                const isSelected = config.jenisAsesmen === jenis;
                return (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => handleSelectJenisAsesmen(jenis)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-purple-600 text-purple-950 shadow-xs ring-2 ring-purple-400/30 font-bold'
                        : 'bg-white border-slate-200 hover:border-purple-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">
                        {jenis === 'Ulangan Harian'
                          ? 'Ulangan Harian'
                          : jenis === 'Tengah Semester 1'
                          ? 'STS Semester 1'
                          : jenis === 'Semester 1'
                          ? 'SAS Semester 1'
                          : jenis === 'Tengah Semester 2'
                          ? 'STS Semester 2'
                          : 'SAS Semester 2'}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {jenis === 'Ulangan Harian'
                        ? 'Formatif / Sumatif TP'
                        : jenis.includes('Tengah')
                        ? 'Sumatif Tengah Smt'
                        : 'Sumatif Akhir Smt'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pemilihan TP Berbasis Multi-Elemen Kurikulum Merdeka */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Tujuan Pembelajaran (TP) Berbasis Multi-Elemen Kurikulum Merdeka
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih TP yang diujikan per elemen. Tersedia {uniqueElements.length} elemen pada mapel {identitas.mataPelajaran} ({config.selectedTPCodes.length} TP terpilih di {activeSelectedElements.length} elemen aktif).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllTP}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 cursor-pointer"
                >
                  Pilih Semua TP
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTP}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Peringatan Cerdas: Asesmen Tengah & Akhir Semester Wajib Lebih dari 1 Elemen */}
            {isSemesterExam && activeSelectedElements.length <= 1 && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-400 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
                      <span>Prinsip Kurikulum Merdeka: Asesmen Multi-Elemen</span>
                      <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-extrabold uppercase">
                        Wajib Diperhatikan
                      </span>
                    </h4>
                    <p className="text-[11.5px] text-amber-900 mt-1 leading-relaxed">
                      Mata pelajaran <b>{identitas.mataPelajaran}</b> memiliki {uniqueElements.length} elemen materi. Pada <b>{config.jenisAsesmen}</b>, naskah soal <b>tidak boleh hanya terdiri dari 1 elemen saja</b> agar evaluasi capaian belajar mencakup seluruh elemen yang diajarkan pada semester berjalan.
                      {activeSelectedElements.length === 1 && (
                        <span> Saat ini baru 1 elemen yang Anda pilih (<b>{activeSelectedElements[0]}</b>).</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleIncludeAllSemesterElements}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 self-start md:self-auto"
                  title="Otomatis memilihkan seluruh TP pada elemen yang diajarkan di semester ini"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Sertakan Semua Elemen Semester Ini</span>
                </button>
              </div>
            )}

            {/* Daftar TP Dikelompokkan Rapi Berdasarkan Masing-Masing Elemen */}
            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {uniqueElements.map((elementName) => {
                const elTPs = tpsByElement.get(elementName) || [];
                const selectedInEl = elTPs.filter((t) => config.selectedTPCodes.includes(t.kodeTP));
                const isAllElSelected = elTPs.length > 0 && selectedInEl.length === elTPs.length;
                const isSomeElSelected = selectedInEl.length > 0 && !isAllElSelected;
                const totalJPEl = elTPs.reduce((sum, t) => sum + (Number(t.alokasiJP) || 0), 0);

                return (
                  <div
                    key={elementName}
                    className={`rounded-2xl border-2 transition-all ${
                      selectedInEl.length > 0
                        ? 'border-blue-300 bg-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    {/* Header Grup Elemen */}
                    <div className="p-3 sm:p-3.5 bg-slate-100/70 border-b border-slate-200 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleElementAllTPs(elementName, !isAllElSelected)}
                          className="text-blue-700 hover:text-blue-900 cursor-pointer"
                          title={isAllElSelected ? 'Batalkan pilihan elemen ini' : 'Pilih semua TP elemen ini'}
                        >
                          {isAllElSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : isSomeElSelected ? (
                            <div className="w-5 h-5 rounded border-2 border-blue-600 flex items-center justify-center bg-blue-50">
                              <div className="w-2.5 h-2.5 bg-blue-600 rounded-xs"></div>
                            </div>
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-slate-900">
                              Elemen: {elementName}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                selectedInEl.length > 0
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {selectedInEl.length} dari {elTPs.length} TP Terpilih
                            </span>
                            {totalJPEl > 0 && (
                              <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-300 px-1.5 py-0.5 rounded">
                                {totalJPEl} JP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleElementAllTPs(elementName, !isAllElSelected)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isAllElSelected
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-2xs'
                          }`}
                        >
                          {isAllElSelected ? 'Batalkan Elemen Ini' : 'Pilih Semua di Elemen Ini'}
                        </button>
                      </div>
                    </div>

                    {/* Butir-butir TP di dalam Elemen */}
                    <div className="p-3 space-y-2">
                      {elTPs.map((tp) => {
                        const isChecked = config.selectedTPCodes.includes(tp.kodeTP);
                        return (
                          <label
                            key={tp.kodeTP}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50/40 border-blue-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 opacity-75'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTP(tp.kodeTP)}
                              className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono font-black text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-300">
                                  {tp.kodeTP}
                                </span>
                                <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {tp.lingkupMateri}
                                </span>
                                {tp.alokasiJP && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {tp.alokasiJP} JP
                                  </span>
                                )}
                                {tp.semesterTarget && (
                                  <span className="text-[9.5px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {tp.semesterTarget}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-800 leading-snug font-medium">
                                {tp.rumusanTP}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Pembagian Alokasi Jumlah Soal per Elemen (Distribusi Proporsional & Kuota Guru) */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Pembagian Alokasi Jumlah Soal per Elemen
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tentukan kuota berapa butir soal untuk setiap elemen agar naskah kisi-kisi &amp; soal berimbang secara komprehensif.
                  </p>
                </div>
              </div>

              {/* Tombol Alat Distribusi Cepat */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDistributeEqually}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  title="Membagi rata total soal ke seluruh elemen aktif secara adil"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Bagi Rata Otomatis</span>
                </button>
                <button
                  type="button"
                  onClick={handleDistributeByJP}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  title="Membagi kuota soal proporsional dengan alokasi jam pelajaran (JP) TP"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bagi Sesuai Jam Pelajaran (JP)</span>
                </button>
              </div>
            </div>

            {/* Status Bar Indikator Sinkronisasi Kuota Elemen vs Total Soal Ujian */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700">Status Alokasi Elemen:</span>
                <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {totalAllocatedToElements} Butir Dialokasikan
                </span>
                <span className="text-slate-400">/</span>
                <span className="font-bold text-slate-700">
                  Total Soal Bentuk: <b>{totalSoalKalkulasi} Butir</b>
                </span>

                {totalAllocatedToElements === totalSoalKalkulasi ? (
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ 100% Pas &amp; Sinkron</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      ⚠️ Selisih {Math.abs(totalSoalKalkulasi - totalAllocatedToElements)} Butir ({totalAllocatedToElements > totalSoalKalkulasi ? 'Kelebihan' : 'Kurang'})
                    </span>
                  </span>
                )}
              </div>

              {totalAllocatedToElements !== totalSoalKalkulasi && (
                <button
                  type="button"
                  onClick={handleAutoSyncElementQuotas}
                  className="px-3 py-1 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  🔄 Sinkronkan ke Total Soal
                </button>
              )}
            </div>

            {/* Kartu-Kartu Kuota per Elemen */}
            {activeSelectedElements.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-600">
                Belum ada TP yang dipilih pada Section 3 di atas. Silakan centang TP yang akan diujikan untuk mengatur pembagian soal per elemen.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSelectedElements.map((elementName) => {
                  const quota = config.alokasiSoalPerElemen?.[elementName] || 0;
                  const elTPs = tpsByElement.get(elementName) || [];
                  const selectedTPsInEl = elTPs.filter((t) => config.selectedTPCodes.includes(t.kodeTP));
                  const percentOfTotal = totalSoalKalkulasi > 0 ? Math.round((quota / totalSoalKalkulasi) * 100) : 0;

                  return (
                    <div
                      key={elementName}
                      className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/30 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-xs text-slate-900">
                            Elemen: {elementName}
                          </h4>
                          <p className="text-[10.5px] text-slate-600 mt-0.5">
                            {selectedTPsInEl.length} TP terpilih diujikan
                          </p>
                        </div>
                        <span className="text-[10.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                          {percentOfTotal}%
                        </span>
                      </div>

                      {/* Stepper & Input Jumlah Soal untuk Elemen Ini */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Jumlah Soal Elemen Ini:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateElementQuota(elementName, Math.max(0, quota - 1))}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Kurangi 1 soal"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={quota}
                            onChange={(e) =>
                              handleUpdateElementQuota(elementName, parseInt(e.target.value) || 0)
                            }
                            className="flex-1 text-center font-black text-sm bg-white border border-emerald-400 rounded-lg py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateElementQuota(elementName, quota + 1)}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Tambah 1 soal"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium">
                        💡 Butir soal elemen ini akan didistribusikan secara berimbang ke seluruh bentuk soal aktif.
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Konfigurasi 5 Bentuk Soal & Tingkat Kognitif (Level 1, Level 2, Level 3) */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Konfigurasi Bentuk Soal &amp; Tingkat Kognitif (Level 1, 2, 3)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tentukan jumlah soal dan proporsi tingkat kesukaran pada setiap jenis soal
                  </p>
                </div>
              </div>

              {/* Real-time Summary Badge */}
              <div className="flex items-center gap-2 text-xs font-bold bg-[#0B1528] text-white px-3 py-1.5 rounded-xl border border-amber-400/60 shadow-xs">
                <span>Total: {totalSoalKalkulasi} Soal</span>
                <span className="text-amber-400">•</span>
                <span className="text-amber-300">Skor Maks: {totalSkorKalkulasi}</span>
                <span className="text-slate-400">•</span>
                <span className="text-sky-300">L1: {totalL1}</span>
                <span className="text-emerald-300">L2: {totalL2}</span>
                <span className="text-rose-300">L3: {totalL3}</span>
              </div>
            </div>

            {/* 5 Distinct Cards for each Question Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Card 1: Pilihan Ganda (Blue Theme) */}
              <div className="rounded-xl border-2 border-blue-300 bg-blue-50/40 p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟦</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-blue-950">A. Pilihan Ganda</h4>
                      <p className="text-[10px] text-blue-800/80">Opsi 4 Pilihan (A, B, C, D)</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.konfigurasiSoal['Pilihan Ganda'].enabled}
                      onChange={(e) => handleUpdateJenisSoal('Pilihan Ganda', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {config.konfigurasiSoal['Pilihan Ganda'].enabled && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Jumlah Soal PG:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={config.konfigurasiSoal['Pilihan Ganda'].jumlahSoal}
                        onChange={(e) =>
                          handleUpdateJenisSoal('Pilihan Ganda', 'jumlahSoal', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded-md border border-blue-300 bg-white font-bold text-center"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-blue-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-blue-900">Distribusi Level Kognitif:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-sky-800">L1 (C1-C2)</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Pilihan Ganda'].level1Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Pilihan Ganda', 'level1Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-sky-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-emerald-800">L2 (C3)</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Pilihan Ganda'].level2Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Pilihan Ganda', 'level2Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-rose-800">L3 (HOTS)</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Pilihan Ganda'].level3Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Pilihan Ganda', 'level3Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-rose-300 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Menjodohkan (Emerald Theme) */}
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟩</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-emerald-950">B. Menjodohkan</h4>
                      <p className="text-[10px] text-emerald-800/80">Kolom Premis &amp; Respon</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.konfigurasiSoal['Menjodohkan'].enabled}
                      onChange={(e) => handleUpdateJenisSoal('Menjodohkan', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {config.konfigurasiSoal['Menjodohkan'].enabled && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Jumlah Pasangan:</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={config.konfigurasiSoal['Menjodohkan'].jumlahSoal}
                        onChange={(e) =>
                          handleUpdateJenisSoal('Menjodohkan', 'jumlahSoal', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded-md border border-emerald-300 bg-white font-bold text-center"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-900">Distribusi Level Kognitif:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-sky-800">L1</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Menjodohkan'].level1Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Menjodohkan', 'level1Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-sky-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-emerald-800">L2</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Menjodohkan'].level2Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Menjodohkan', 'level2Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-rose-800">L3</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Menjodohkan'].level3Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Menjodohkan', 'level3Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-rose-300 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Benar / Salah (Violet Theme) */}
              <div className="rounded-xl border-2 border-violet-300 bg-violet-50/40 p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟪</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-violet-950">C. Benar / Salah</h4>
                      <p className="text-[10px] text-violet-800/80">Evaluasi Pernyataan Konsep</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.konfigurasiSoal['Benar / Salah'].enabled}
                      onChange={(e) => handleUpdateJenisSoal('Benar / Salah', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {config.konfigurasiSoal['Benar / Salah'].enabled && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Jumlah Soal B/S:</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={config.konfigurasiSoal['Benar / Salah'].jumlahSoal}
                        onChange={(e) =>
                          handleUpdateJenisSoal('Benar / Salah', 'jumlahSoal', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded-md border border-violet-300 bg-white font-bold text-center"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-violet-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-violet-900">Distribusi Level Kognitif:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-sky-800">L1</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Benar / Salah'].level1Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Benar / Salah', 'level1Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-sky-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-emerald-800">L2</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Benar / Salah'].level2Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Benar / Salah', 'level2Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-rose-800">L3</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Benar / Salah'].level3Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Benar / Salah', 'level3Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-rose-300 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Isian Singkat (Amber Theme) */}
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟧</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-amber-950">D. Isian Singkat</h4>
                      <p className="text-[10px] text-amber-800/80">Istilah &amp; Hitungan Cepat</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.konfigurasiSoal['Isian Singkat'].enabled}
                      onChange={(e) => handleUpdateJenisSoal('Isian Singkat', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {config.konfigurasiSoal['Isian Singkat'].enabled && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Jumlah Soal Isian:</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={config.konfigurasiSoal['Isian Singkat'].jumlahSoal}
                        onChange={(e) =>
                          handleUpdateJenisSoal('Isian Singkat', 'jumlahSoal', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded-md border border-amber-300 bg-white font-bold text-center"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-amber-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-amber-900">Distribusi Level Kognitif:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-sky-800">L1</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Isian Singkat'].level1Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Isian Singkat', 'level1Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-sky-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-emerald-800">L2</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Isian Singkat'].level2Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Isian Singkat', 'level2Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-rose-800">L3</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Isian Singkat'].level3Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Isian Singkat', 'level3Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-rose-300 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 5: Uraian (Rose Theme) */}
              <div className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟥</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-rose-950">E. Uraian / Essay</h4>
                      <p className="text-[10px] text-rose-800/80">Pemecahan Masalah &amp; Analisis</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.konfigurasiSoal['Uraian'].enabled}
                      onChange={(e) => handleUpdateJenisSoal('Uraian', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {config.konfigurasiSoal['Uraian'].enabled && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Jumlah Soal Uraian:</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={config.konfigurasiSoal['Uraian'].jumlahSoal}
                        onChange={(e) =>
                          handleUpdateJenisSoal('Uraian', 'jumlahSoal', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded-md border border-rose-300 bg-white font-bold text-center"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-rose-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-rose-900">Distribusi Level Kognitif:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-sky-50 border border-sky-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-sky-800">L1</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Uraian'].level1Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Uraian', 'level1Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-sky-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-emerald-800">L2</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Uraian'].level2Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Uraian', 'level2Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-0.5"
                          />
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded p-1">
                          <span className="block text-[9.5px] font-bold text-rose-800">L3</span>
                          <input
                            type="number"
                            min="0"
                            value={config.konfigurasiSoal['Uraian'].level3Count}
                            onChange={(e) =>
                              handleUpdateJenisSoal('Uraian', 'level3Count', parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-bold text-xs bg-white rounded border border-rose-300 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execute Generator Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || totalSoalKalkulasi === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:brightness-110 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyusun Kisi-Kisi &amp; Naskah Soal Berbasis CP/TP...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Susun Kisi-Kisi &amp; Naskah Soal Otomatis (Sesuai CP &amp; TP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MATRIKS KISI-KISI SOAL (Format Laporan Akademis Resmi • Times New Roman 12 • Spasi 1.5) */}
      {activeTab === 'kisikisi' && soalDocument && (
        <div className="space-y-4">
          {/* Action Toolbar (No Print) */}
          <div className="no-print bg-white rounded-2xl p-4 border-2 border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#0B1528] text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                📋
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Laporan Akademis Matriks Kisi-Kisi Penulisan Soal
                </h4>
                <p className="text-[11px] text-slate-500">
                  Standar Times New Roman 12 • Jarak Spasi 1,5 • Hemat Kertas (CP Elemen Sama Tidak Ditulis Ulang)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kisi-kisi', 'WORD')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer shadow-2xs"
                title="Unduh dokumen kisi-kisi formal dalam format Microsoft Word (.doc)"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>Unduh Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kisi-kisi', 'PDF')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 cursor-pointer shadow-2xs"
                title="Ekspor dokumen kisi-kisi formal langsung ke file PDF Landscape"
              >
                <FileText className="w-3.5 h-3.5 text-rose-700" />
                <span>Ekspor PDF Resmi</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kisi-kisi', 'PRINT')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                title="Cetak langsung menggunakan browser"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak Lembar</span>
              </button>
            </div>
          </div>

          {/* Kertas Dokumen Laporan Akademis Kisi-Kisi (WAJIB LANDSCAPE) */}
          <div
            className="bg-white rounded-xl p-8 sm:p-10 border-2 border-slate-300 shadow-md text-black print:p-0 print:border-none print:shadow-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12pt',
              lineHeight: '1.5',
            }}
          >
            {/* Kop Laporan Akademis Formal 4 Baris + Logo */}
            <div className="text-center pb-2">
              <div className="flex items-center justify-center gap-4 mb-2">
                {(identitas.logoUrl || '/school_logo.jpg') && (
                  <img
                    src={identitas.logoUrl || '/school_logo.jpg'}
                    alt="Logo Kop"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                )}
                <div>
                  <div className="text-[12pt] font-bold uppercase tracking-wider text-black">
                    {identitas.kopBaris1 || (identitas.kabupaten ? `PEMERINTAH KABUPATEN ${identitas.kabupaten.toUpperCase()}` : 'PEMERINTAH DAERAH')}
                  </div>
                  <div className="text-[13pt] font-bold uppercase tracking-wider text-black">
                    {identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                  </div>
                  <div className="text-[15pt] font-black uppercase tracking-wide text-black mt-0.5">
                    {(identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SATUAN PENDIDIKAN').toUpperCase()}
                  </div>
                  <div className="text-[10pt] font-normal italic text-slate-800">
                    {identitas.kopBaris4 || (identitas.alamatInstansi ? (identitas.alamatInstansi.toLowerCase().startsWith('alamat:') ? identitas.alamatInstansi : `Alamat: ${identitas.alamatInstansi}`) : '')}
                  </div>
                </div>
              </div>

              {/* Garis Pembatas Ganda Kop Akademis */}
              <div className="border-b-[2.5px] border-black mt-3"></div>
              <div className="border-b border-black mt-0.5 mb-4"></div>

              {/* Judul Dokumen Sesuai Regulasi: Cukup KISI-KISI SOAL */}
              <div className="text-[14pt] font-black uppercase tracking-wide text-black mt-1">
                KISI-KISI SOAL
              </div>
              <div className="text-[11pt] font-bold uppercase text-slate-800 mt-0.5">
                {(identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen || 'UJIAN SEMESTER 1').toUpperCase()} • TAHUN PELAJARAN {identitas.tahunPelajaran} • KURIKULUM MERDEKA
              </div>
            </div>

            {/* Tabel Identitas Dokumen Asesmen - TITIK DUA SEJAJAR SEMPURNA */}
            <div className="mb-4">
              <table
                className="w-full border-none text-left"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12pt',
                  lineHeight: '1.5',
                }}
              >
                <tbody>
                  <tr>
                    <td className="w-52 font-bold py-0.5">Satuan Pendidikan</td>
                    <td className="w-4 text-center font-bold py-0.5">:</td>
                    <td className="py-0.5 font-bold">{(identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase()}</td>
                    <td className="w-48 font-bold py-0.5">Mata Pelajaran</td>
                    <td className="w-4 text-center font-bold py-0.5">:</td>
                    <td className="py-0.5 font-bold">{identitas.mataPelajaran}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-0.5">Fase / Kelas</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.fase} / Kelas {identitas.kelas}</td>
                    <td className="font-bold py-0.5">Bentuk Asesmen</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-0.5">Semester / Th. Pelajaran</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.semester} / {identitas.tahunPelajaran}</td>
                    <td className="font-bold py-0.5">Alokasi Waktu</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{soalDocument.konfigurasi.alokasiWaktu}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-0.5">Jumlah Butir Soal</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5 font-bold" colSpan={4}>
                      {soalDocument.ringkasanDistribusi.totalSoal} Butir Soal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabel Matriks Kisi-Kisi Soal Bergaris Formal Akademis */}
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse border border-black"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12pt',
                  lineHeight: '1.5',
                  border: '1.5px solid #000',
                }}
              >
                <thead>
                  <tr className="bg-slate-100 text-black">
                    <th className="p-2 border border-black text-center font-bold w-10">No</th>
                    <th className="p-2 border border-black font-bold w-52">Capaian Pembelajaran (CP)</th>
                    <th className="p-2 border border-black font-bold w-32">Elemen</th>
                    <th className="p-2 border border-black font-bold w-36">Lingkup Materi</th>
                    <th className="p-2 border border-black font-bold w-48">Tujuan Pembelajaran (TP)</th>
                    <th className="p-2 border border-black font-bold">Indikator Soal</th>
                    <th className="p-2 border border-black font-bold text-center w-24">Level</th>
                    <th className="p-2 border border-black font-bold text-center w-28">Bentuk</th>
                    <th className="p-2 border border-black font-bold text-center w-16">No. Soal</th>
                  </tr>
                </thead>
                <tbody>
                  {soalDocument.tabelKisiKisi.map((row, idx) => {
                    const cpDisplay = getCpColumnDisplay(row, idx, soalDocument.tabelKisiKisi);
                    const isCompactCp = cpDisplay.startsWith('Deskripsi elemen');

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 border border-black text-center align-top font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-black align-top text-justify">
                          {isCompactCp ? (
                            <span className="font-semibold italic text-slate-800">
                              {cpDisplay}
                            </span>
                          ) : (
                            <span>{cpDisplay}</span>
                          )}
                        </td>
                        <td className="p-2 border border-black align-top font-bold">
                          {row.elemen}
                        </td>
                        <td className="p-2 border border-black align-top">
                          {row.lingkupMateri}
                        </td>
                        <td className="p-2 border border-black align-top">
                          <b>{row.kodeTP}</b>: {cleanTPTextWithoutCode(row.kodeTP, row.tujuanPembelajaran)}
                        </td>
                        <td className="p-2 border border-black align-top text-justify">
                          {row.indikatorSoal}
                        </td>
                        <td className="p-2 border border-black align-top text-center">
                          <span className="font-bold">{row.levelKognitif}</span>
                          <span className="block text-[10pt] text-slate-700">({row.tingkatKKO})</span>
                        </td>
                        <td className="p-2 border border-black align-top text-center font-medium">
                          {row.bentukSoal}
                        </td>
                        <td className="p-2 border border-black align-top text-center font-bold text-[12.5pt]">
                          {row.nomorSoalDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* HALAMAN TERPISAH (WAJIB HALAMAN BARU): REKAPITULASI, KETERANGAN & LEMBAR PENGESAHAN TANDA TANGAN */}
            <div
              className="break-before-page print:break-before-page pt-6 mt-8 border-t-2 border-dashed border-slate-300 print:border-none text-black space-y-6"
              style={{
                pageBreakBefore: 'always',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '12pt',
                lineHeight: '1.5',
              }}
            >
              {/* Header Halaman Terpisah */}
              <div className="text-center border-b border-black pb-2">
                <h3 className="text-[13pt] font-black uppercase tracking-wider text-black">
                  REKAPITULASI &amp; KETERANGAN KISI-KISI SOAL
                </h3>
                <p className="text-[10.5pt] font-bold text-slate-800 uppercase mt-0.5">
                  {(identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase()} • {(identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen || 'UJIAN SEMESTER 1').toUpperCase()} • TAHUN PELAJARAN {identitas.tahunPelajaran}
                </p>
              </div>

              {/* Grid 2 Kolom Rekapitulasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Kolom 1: Rekap Level Kognitif */}
                <div className="p-3 bg-slate-50 border border-black rounded space-y-2">
                  <h4 className="font-bold border-b border-slate-400 pb-1 text-black">
                    I. Distribusi Tingkat Level Kognitif:
                  </h4>
                  <table className="w-full text-left border-none">
                    <tbody>
                      <tr>
                        <td className="py-1">• Level 1 (Mengingat &amp; Memahami / LOTS)</td>
                        <td className="w-4 text-center">:</td>
                        <td className="py-1 font-bold">{soalDocument.ringkasanDistribusi.distribusiLevel['Level 1'] || 0} Soal</td>
                      </tr>
                      <tr>
                        <td className="py-1">• Level 2 (Menerapkan / Aplikasi / MOTS)</td>
                        <td className="w-4 text-center">:</td>
                        <td className="py-1 font-bold">{soalDocument.ringkasanDistribusi.distribusiLevel['Level 2'] || 0} Soal</td>
                      </tr>
                      <tr>
                        <td className="py-1">• Level 3 (Penalaran &amp; Analisis / HOTS)</td>
                        <td className="w-4 text-center">:</td>
                        <td className="py-1 font-bold">{soalDocument.ringkasanDistribusi.distribusiLevel['Level 3'] || 0} Soal</td>
                      </tr>
                      <tr className="border-t border-dashed border-slate-400 font-black">
                        <td className="pt-1.5">Total Keseluruhan Soal</td>
                        <td className="text-center pt-1.5">:</td>
                        <td className="pt-1.5 text-blue-900">{soalDocument.ringkasanDistribusi.totalSoal} Butir Soal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Kolom 2: Rekap Bentuk Soal */}
                <div className="p-3 bg-slate-50 border border-black rounded space-y-2">
                  <h4 className="font-bold border-b border-slate-400 pb-1 text-black">
                    II. Distribusi Bentuk &amp; Jenis Soal:
                  </h4>
                  <table className="w-full text-left border-none">
                    <tbody>
                      {soalDocument.ringkasanDistribusi.distribusiBentuk['Pilihan Ganda'] ? (
                        <tr>
                          <td className="py-0.5">• Pilihan Ganda (PG)</td>
                          <td className="w-4 text-center">:</td>
                          <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.distribusiBentuk['Pilihan Ganda']} Butir</td>
                        </tr>
                      ) : null}
                      {soalDocument.ringkasanDistribusi.distribusiBentuk['Menjodohkan'] ? (
                        <tr>
                          <td className="py-0.5">• Menjodohkan</td>
                          <td className="w-4 text-center">:</td>
                          <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.distribusiBentuk['Menjodohkan']} Butir</td>
                        </tr>
                      ) : null}
                      {soalDocument.ringkasanDistribusi.distribusiBentuk['Benar / Salah'] ? (
                        <tr>
                          <td className="py-0.5">• Benar / Salah</td>
                          <td className="w-4 text-center">:</td>
                          <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.distribusiBentuk['Benar / Salah']} Butir</td>
                        </tr>
                      ) : null}
                      {soalDocument.ringkasanDistribusi.distribusiBentuk['Isian Singkat'] ? (
                        <tr>
                          <td className="py-0.5">• Isian Singkat</td>
                          <td className="w-4 text-center">:</td>
                          <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.distribusiBentuk['Isian Singkat']} Butir</td>
                        </tr>
                      ) : null}
                      {soalDocument.ringkasanDistribusi.distribusiBentuk['Uraian / Esai'] ? (
                        <tr>
                          <td className="py-0.5">• Uraian / Esai</td>
                          <td className="w-4 text-center">:</td>
                          <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.distribusiBentuk['Uraian / Esai']} Butir</td>
                        </tr>
                      ) : null}
                      <tr className="border-t border-dashed border-slate-400 font-black">
                        <td className="pt-1.5">Total Skor Maksimal</td>
                        <td className="text-center pt-1.5">:</td>
                        <td className="pt-1.5 text-emerald-900">{soalDocument.ringkasanDistribusi.totalSkorMaksimal} Poin</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Keterangan & Catatan Khusus Asesmen */}
              <div className="p-3 bg-white border border-black rounded text-xs sm:text-sm space-y-1">
                <div className="font-bold text-black">KETERANGAN &amp; CATATAN KHUSUS ASESMEN:</div>
                <ol className="list-decimal list-outside ml-5 space-y-1 text-slate-800">
                  <li>
                    Matriks kisi-kisi penulisan soal di atas disusun secara terpadu mengacu pada Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) {identitas.mataPelajaran} {identitas.fase} yang berlaku.
                  </li>
                  <li className="font-bold text-black">
                    Kunci jawaban, format kunci respon, dan rubrik pedoman penskoran terperinci tersedia secara terpisah pada dokumen "Lembar Kunci Jawaban dan Pedoman Penskoran".
                  </li>
                </ol>
              </div>

              {/* Area Tanda Tangan Resmi (Wajib 1 Halaman dengan Keterangan) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                <div className="text-center">
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Satuan Pendidikan</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline underline-offset-4">
                    {identitas.namaKepalaSekolah || '...................................................'}
                  </p>
                  <p>
                    NIP. {identitas.nipKepalaSekolah || '...................................................'}
                  </p>
                </div>

                <div className="text-center">
                  <p>
                    {formatTitimangsaDokumen(identitas.tempatPenetapan, soalDocument.konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan)}
                  </p>
                  <p className="font-bold">
                    {identitas.peranGuru || 'Guru Mata Pelajaran / Kelas'}
                  </p>
                  <div className="h-20"></div>
                  <p className="font-bold underline underline-offset-4">
                    {identitas.namaGuru || '...................................................'}
                  </p>
                  <p>
                    NIP. {identitas.nipGuru || '...................................................'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. NASKAH SOAL SISWA (Lembar Ujian Lengkap) */}
      {activeTab === 'naskah' && soalDocument && (
        <div className="space-y-6 animate-in fade-in">
          {/* SINKRONISASI KE RUANG MURID PANEL */}
          {onPublishToRuangMurid && (
            <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-indigo-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0 border border-indigo-400/30 shadow-inner">
                  <span className="text-2xl">📡</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-sm sm:text-base">
                    Sistem Ujian Berbasis Komputer (CBT)
                  </h3>
                  <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    Naskah soal ini dapat langsung diaktifkan secara digital. Murid akan menemukan paket <strong>{soalDocument.konfigurasi.jenisAsesmen}</strong> ini di Ruang Murid mereka.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onPublishToRuangMurid(soalDocument)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 border-2 border-emerald-300/50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Sinkronisasi ke Ruang {soalDocument.konfigurasi.jenisAsesmen}</span>
                </button>

                {onNavigateToRapor && (
                  <button
                    onClick={onNavigateToRapor}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs bg-slate-900/90 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border-2 border-amber-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                    title="Buka Analisis Nilai Rapor & Deskripsi Kemajuan Belajar Format Kurikulum Merdeka"
                  >
                    <span>📈</span>
                    <span>Analisis Nilai Rapor</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Toolbar Header untuk Naskah Soal */}
          <div className="bg-white rounded-xl p-3 border-2 border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Naskah Lembar Soal &amp; Jawaban Siswa
                </h4>
                <p className="text-[11px] text-slate-500">
                  Siap cetak dan siap dibagikan untuk asesmen siswa
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('naskah', 'WORD')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer shadow-2xs"
                title="Unduh naskah soal siswa dalam format Microsoft Word (.doc)"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>Unduh Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('naskah', 'PDF')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 cursor-pointer shadow-2xs"
                title="Ekspor naskah soal siswa langsung ke file PDF Portrait"
              >
                <FileText className="w-3.5 h-3.5 text-rose-700" />
                <span>Ekspor PDF Resmi</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('naskah', 'PRINT')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                title="Cetak langsung menggunakan browser"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak Naskah</span>
              </button>
            </div>
          </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6 relative">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-bl-xl rounded-tr-xl tracking-wider">
            PREVIEW NASKAH SOAL (WAJIB PORTRAIT)
          </div>
          {/* KOP RESMI LEMBAR SOAL 4 BARIS + LOGO */}
          <div className="text-center pb-2">
            <div className="flex items-center justify-center gap-3">
              {(identitas.logoUrl || '/school_logo.jpg') && (
                <img
                  src={identitas.logoUrl || '/school_logo.jpg'}
                  alt="Logo Sekolah"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
                />
              )}
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {identitas.kopBaris1 || (identitas.kabupaten ? `PEMERINTAH KABUPATEN ${identitas.kabupaten.toUpperCase()}` : 'PEMERINTAH DAERAH')}
                </h4>
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                </h4>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                  {(identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SATUAN PENDIDIKAN').toUpperCase()}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                  {identitas.kopBaris4 || (identitas.alamatInstansi ? (identitas.alamatInstansi.toLowerCase().startsWith('alamat:') ? identitas.alamatInstansi : `Alamat: ${identitas.alamatInstansi}`) : '')}
                </p>
              </div>
            </div>

            {/* Garis Pembatas Ganda Kop */}
            <div className="border-b-[2.5px] border-black mt-3"></div>
            <div className="border-b border-black mt-0.5 mb-3"></div>

            <div className="pt-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                NASKAH SOAL
              </h4>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                {(identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen || 'UJIAN SEMESTER 1').toUpperCase()} • TAHUN PELAJARAN {identitas.tahunPelajaran}
              </p>
            </div>
          </div>

          {/* Kolom Identitas Siswa & Mata Pelajaran (TITIK DUA SEJAJAR SEMPURNA) */}
          <table className="w-full border border-black border-collapse text-xs mb-4">
            <tbody>
              <tr>
                <td className="w-36 font-bold p-2 border border-black bg-slate-50/60">Mata Pelajaran</td>
                <td className="w-4 text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black font-black text-blue-900">{identitas.mataPelajaran}</td>
                <td className="w-36 font-bold p-2 border border-black bg-slate-50/60">Nama Peserta</td>
                <td className="w-4 text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black font-mono">................................................</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Fase / Kelas</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black">{identitas.fase} / Kelas {identitas.kelas}</td>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Nomor Absen</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black font-mono">................................................</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Hari, Tanggal</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black">{soalDocument.konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan || '...........................'}</td>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Nilai Perolehan</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black text-center font-mono font-black text-sm">&nbsp;</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Waktu Pengerjaan</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black">{soalDocument.konfigurasi.alokasiWaktu}</td>
                <td className="font-bold p-2 border border-black bg-slate-50/60">Paraf Guru / Ortu</td>
                <td className="text-center font-bold p-2 border border-black">:</td>
                <td className="p-2 border border-black font-mono">................................................</td>
              </tr>
            </tbody>
          </table>

          {/* Petunjuk Umum */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
            <span className="font-black uppercase tracking-wider text-[11px] block">
              Petunjuk Umum:
            </span>
            <ol className="list-decimal list-inside space-y-0.5 text-[11.5px] leading-relaxed">
              {soalDocument.naskahSoal.petunjukUmum.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </div>

          {/* BAGIAN A: PILIHAN GANDA */}
          {soalDocument.naskahSoal.soalPilihanGanda.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="border-b-2 border-blue-500 pb-1 flex items-center justify-between">
                <h4 className="font-black text-sm text-blue-950 uppercase tracking-wide">
                  A. Pilihan Ganda
                </h4>
                <span className="text-xs font-bold text-blue-800">
                  {soalDocument.naskahSoal.soalPilihanGanda.length} Butir Soal
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">
                Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!
              </p>

              <div className="space-y-4">
                {soalDocument.naskahSoal.soalPilihanGanda.map((soal) => (
                  <div key={soal.nomor} className="text-xs space-y-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-slate-900 text-sm w-6 shrink-0">
                        {soal.nomor}.
                      </span>
                      <div className="flex-1 space-y-1">
                        {soal.stimulus && (
                          <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                            {soal.stimulus}
                          </p>
                        )}
                        <p className="font-bold text-slate-900 leading-relaxed text-[12.5px]">
                          {soal.pertanyaan}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                      {soal.pilihan.map((p) => (
                        <div
                          key={p.kunci}
                          className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200"
                        >
                          <span className="font-black text-blue-900 w-5">{p.kunci}.</span>
                          <span className="text-slate-800 leading-snug">{p.teks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BAGIAN B: MENJODOHKAN */}
          {soalDocument.naskahSoal.soalMenjodohkan.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b-2 border-emerald-500 pb-1 flex items-center justify-between">
                <h4 className="font-black text-sm text-emerald-950 uppercase tracking-wide">
                  B. Menjodohkan
                </h4>
                <span className="text-xs font-bold text-emerald-800">
                  Pasangkan Kolom A dan B
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">
                Pasangkanlah butir pernyataan pada Kolom A dengan pilihan jawaban yang paling tepat pada Kolom B!
              </p>

              {soalDocument.naskahSoal.soalMenjodohkan.map((group, gIdx) => (
                <div key={gIdx} className="overflow-x-auto border border-emerald-300 rounded-xl shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-emerald-100 text-emerald-950 font-black">
                        <th className="p-2.5 w-12 text-center border-b border-emerald-300">No</th>
                        <th className="p-2.5 border-b border-emerald-300 w-1/2">KOLOM A (Pernyataan)</th>
                        <th className="p-2.5 border-b border-emerald-300 w-20 text-center">Jawaban</th>
                        <th className="p-2.5 border-b border-emerald-300 w-1/2">KOLOM B (Pilihan Jawaban)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {group.daftarPremis.map((premis, idx) => {
                        const respon = group.daftarPilihanRespon[idx];
                        return (
                          <tr key={idx} className="bg-white">
                            <td className="p-2.5 text-center font-bold text-slate-600">{premis.nomor}</td>
                            <td className="p-2.5 font-medium text-slate-800">{premis.teks}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-400 bg-slate-50">
                              ( ... )
                            </td>
                            <td className="p-2.5 text-slate-800">
                              {respon ? (
                                <div>
                                  <span className="font-black text-emerald-900 mr-1.5">{respon.label}.</span>
                                  <span>{respon.teks}</span>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* BAGIAN C: BENAR / SALAH */}
          {soalDocument.naskahSoal.soalBenarSalah.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b-2 border-violet-500 pb-1 flex items-center justify-between">
                <h4 className="font-black text-sm text-violet-950 uppercase tracking-wide">
                  C. Benar / Salah
                </h4>
                <span className="text-xs font-bold text-violet-800">
                  {soalDocument.naskahSoal.soalBenarSalah.length} Butir Pernyataan
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">
                Berilah tanda centang (✓) pada kolom B jika pernyataan Benar, atau pada kolom S jika pernyataan Salah!
              </p>

              <div className="overflow-x-auto border border-violet-300 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-violet-100 text-violet-950 font-black">
                      <th className="p-2.5 w-12 text-center border-b border-violet-300">No</th>
                      <th className="p-2.5 border-b border-violet-300">Pernyataan Konsep</th>
                      <th className="p-2.5 w-16 text-center border-b border-violet-300">B</th>
                      <th className="p-2.5 w-16 text-center border-b border-violet-300">S</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {soalDocument.naskahSoal.soalBenarSalah.map((item) => (
                      <tr key={item.nomor} className="bg-white">
                        <td className="p-2.5 text-center font-bold text-slate-600">{item.nomor}</td>
                        <td className="p-2.5 font-medium text-slate-800 leading-relaxed">{item.pernyataan}</td>
                        <td className="p-2.5 text-center">
                          <div className="w-6 h-6 border-2 border-slate-400 rounded mx-auto"></div>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="w-6 h-6 border-2 border-slate-400 rounded mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BAGIAN D: ISIAN SINGKAT */}
          {soalDocument.naskahSoal.soalIsianSingkat.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b-2 border-amber-500 pb-1 flex items-center justify-between">
                <h4 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                  D. Isian Singkat
                </h4>
                <span className="text-xs font-bold text-amber-800">
                  {soalDocument.naskahSoal.soalIsianSingkat.length} Butir Soal
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">
                Isilah titik-titik pada butir soal berikut dengan jawaban yang singkat dan tepat!
              </p>

              <div className="space-y-3">
                {soalDocument.naskahSoal.soalIsianSingkat.map((item) => (
                  <div key={item.nomor} className="p-3 rounded-xl bg-amber-50/30 border border-amber-200 text-xs flex items-start gap-2.5">
                    <span className="font-black text-slate-900 text-sm w-6 shrink-0">
                      {item.nomor}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="font-bold text-slate-900 leading-relaxed text-[12.5px]">
                        {item.pertanyaan}
                      </p>
                      <div className="pt-2 border-b-2 border-dotted border-slate-400 w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BAGIAN E: URAIAN */}
          {soalDocument.naskahSoal.soalUraian.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b-2 border-rose-500 pb-1 flex items-center justify-between">
                <h4 className="font-black text-sm text-rose-950 uppercase tracking-wide">
                  E. Uraian / Pemecahan Masalah
                </h4>
                <span className="text-xs font-bold text-rose-800">
                  {soalDocument.naskahSoal.soalUraian.length} Butir Soal
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">
                Jawablah pertanyaan-pertanyaan berikut dengan uraian yang jelas, runtut, dan lengkap!
              </p>

              <div className="space-y-4">
                {soalDocument.naskahSoal.soalUraian.map((item) => (
                  <div key={item.nomor} className="p-4 rounded-xl bg-rose-50/20 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="font-black text-slate-900 text-sm w-6 shrink-0">
                        {item.nomor}.
                      </span>
                      <p className="font-bold text-slate-900 leading-relaxed text-[12.5px] flex-1">
                        {item.pertanyaan}
                      </p>
                    </div>
                    {/* Lembar Garis Jawaban Siswa */}
                    <div className="pl-8 pt-2 space-y-3">
                      <div className="border-b border-dashed border-slate-400 h-6"></div>
                      <div className="border-b border-dashed border-slate-400 h-6"></div>
                      <div className="border-b border-dashed border-slate-400 h-6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* 4. KUNCI JAWABAN & PEDOMAN PENSKORAN (WAJIB PORTRAIT) */}
      {activeTab === 'kunci' && soalDocument && (
        <div className="space-y-4">
          {/* Action Toolbar for Tab 4 */}
          <div className="no-print bg-white rounded-xl p-3.5 sm:p-4 border-2 border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-base border border-amber-300">
                🔑
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Kunci Jawaban &amp; Pedoman Penskoran
                </h4>
                <p className="text-[11px] text-slate-500">
                  Wajib Portrait • Panduan Koreksi Guru, Rubrik Penskoran, dan Rumus NA
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kunci', 'WORD')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer shadow-2xs"
                title="Unduh kunci jawaban dan pedoman penskoran dalam format Word (.doc)"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>Unduh Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kunci', 'PDF')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 cursor-pointer shadow-2xs"
                title="Ekspor kunci jawaban langsung ke file PDF Portrait"
              >
                <FileText className="w-3.5 h-3.5 text-rose-700" />
                <span>Ekspor PDF Resmi</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintConfirm('kunci', 'PRINT')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                title="Cetak langsung menggunakan browser"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak Lembar</span>
              </button>
            </div>
          </div>

          {/* Kertas Dokumen Kunci Jawaban & Penskoran (WAJIB PORTRAIT) */}
          <div
            className="bg-white rounded-xl p-8 sm:p-10 border-2 border-slate-300 shadow-md text-black print:p-0 print:border-none print:shadow-none space-y-6"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '11pt',
              lineHeight: '1.4',
            }}
          >
            {/* Kop Laporan Akademis Formal 4 Baris + Logo */}
            <div className="text-center pb-2">
              <div className="flex items-center justify-center gap-4 mb-2">
                {(identitas.logoUrl || '/school_logo.jpg') && (
                  <img
                    src={identitas.logoUrl || '/school_logo.jpg'}
                    alt="Logo Kop"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                )}
                <div>
                  <div className="text-[11.5pt] font-bold uppercase tracking-wider text-black">
                    {identitas.kopBaris1 || (identitas.kabupaten ? `PEMERINTAH KABUPATEN ${identitas.kabupaten.toUpperCase()}` : 'PEMERINTAH DAERAH')}
                  </div>
                  <div className="text-[12.5pt] font-bold uppercase tracking-wider text-black">
                    {identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                  </div>
                  <div className="text-[14pt] font-black uppercase tracking-wide text-black mt-0.5">
                    {(identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SATUAN PENDIDIKAN').toUpperCase()}
                  </div>
                  <div className="text-[9.5pt] font-normal italic text-slate-800">
                    {identitas.kopBaris4 || (identitas.alamatInstansi ? (identitas.alamatInstansi.toLowerCase().startsWith('alamat:') ? identitas.alamatInstansi : `Alamat: ${identitas.alamatInstansi}`) : '')}
                  </div>
                </div>
              </div>

              {/* Garis Pembatas Ganda Kop */}
              <div className="border-b-[2.5px] border-black mt-3"></div>
              <div className="border-b border-black mt-0.5 mb-4"></div>

              {/* Judul Dokumen */}
              <div className="text-[13pt] font-black uppercase tracking-wide text-black mt-1">
                KUNCI JAWABAN &amp; PEDOMAN PENSKORAN
              </div>
              <div className="text-[10.5pt] font-bold uppercase text-slate-800 mt-0.5">
                {(identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen || 'UJIAN SEMESTER 1').toUpperCase()} • TAHUN PELAJARAN {identitas.tahunPelajaran}
              </div>
            </div>

            {/* Tabel Identitas Dokumen Kunci - TITIK DUA SEJAJAR SEMPURNA */}
            <div className="mb-2">
              <table
                className="w-full border-none text-left"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '11pt',
                  lineHeight: '1.4',
                }}
              >
                <tbody>
                  <tr>
                    <td className="w-48 font-bold py-0.5">Satuan Pendidikan</td>
                    <td className="w-4 text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI'}</td>
                    <td className="w-44 font-bold py-0.5">Mata Pelajaran</td>
                    <td className="w-4 text-center font-bold py-0.5">:</td>
                    <td className="py-0.5 font-bold">{identitas.mataPelajaran}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-0.5">Fase / Kelas</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.fase} / Kelas {identitas.kelas}</td>
                    <td className="font-bold py-0.5">Bentuk Asesmen</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.jenisUjian || soalDocument.konfigurasi.jenisAsesmen}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-0.5">Semester / Th. Pelajaran</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5">{identitas.semester} / {identitas.tahunPelajaran}</td>
                    <td className="font-bold py-0.5">Total Soal / Skor Maks</td>
                    <td className="text-center font-bold py-0.5">:</td>
                    <td className="py-0.5 font-bold">{soalDocument.ringkasanDistribusi.totalSoal} Butir / {soalDocument.ringkasanDistribusi.totalSkorMaksimal}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          {/* Master Key Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1528] text-white font-bold">
                  <th className="p-2.5 text-center w-12 border border-slate-700">No</th>
                  <th className="p-2.5 w-32 border border-slate-700">Nomor Soal</th>
                  <th className="p-2.5 w-32 border border-slate-700">Bentuk Soal</th>
                  <th className="p-2.5 border border-slate-700">Kunci Jawaban Singkat</th>
                  <th className="p-2.5 text-center w-24 border border-slate-700">Bobot Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {soalDocument.pedomanPenskoran.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 text-center font-bold text-slate-600 border border-slate-300">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-bold text-slate-900 border border-slate-300">
                      {item.nomorSoalDisplay}
                    </td>
                    <td className="p-2 font-semibold text-slate-700 border border-slate-300">
                      {item.bentukSoal}
                    </td>
                    <td className="p-2 font-mono font-bold text-blue-900 border border-slate-300">
                      {item.kunciJawabanSingkat}
                    </td>
                    <td className="p-2 text-center font-black text-slate-900 border border-slate-300 bg-slate-100/50">
                      {item.bobotSkor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rubrik Uraian */}
          {soalDocument.naskahSoal.soalUraian.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Rubrik Pedoman Penskoran Soal Uraian
              </h4>
              <div className="space-y-3">
                {soalDocument.naskahSoal.soalUraian.map((u) => (
                  <div key={u.nomor} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900">
                      Soal No. {u.nomor}: {u.pertanyaan}
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950 whitespace-pre-line">
                      <span className="font-black text-[11px] block text-emerald-900 mb-1">
                        Kunci Jawaban Ideal:
                      </span>
                      {u.kunciJawaban}
                    </div>
                    <table className="w-full text-left text-xs border border-slate-200 mt-2">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold">
                          <th className="p-2">Kriteria Skor</th>
                          <th className="p-2 w-28 text-center">Skor Maksimal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {u.pedomanPenskoran.map((p, pIdx) => (
                          <tr key={pIdx}>
                            <td className="p-2 text-slate-700">{p.kriteria}</td>
                            <td className="p-2 text-center font-bold text-slate-900">{p.skorMaks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rumus Nilai Akhir */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 text-xs space-y-2">
            <span className="font-black text-blue-950 uppercase tracking-wider text-[11px] block">
              Rumus Perhitungan Nilai Akhir (NA):
            </span>
            <div className="p-3 bg-white rounded-lg border border-blue-200 font-mono font-bold text-blue-900 text-center text-sm shadow-2xs">
              Nilai Akhir (NA) = ( Total Skor Perolehan / {soalDocument.ringkasanDistribusi.totalSkorMaksimal} ) × 100
            </div>
            <p className="text-[11px] text-blue-800">
              Rentang nilai 0 - 100 disesuaikan dengan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) yang telah ditetapkan pada kurikulum sekolah.
            </p>
          </div>

          {/* Tanda Tangan Pengesahan Resmi (Kepala Sekolah & Guru) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-xs">
            <div className="text-center space-y-1">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-800">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-extrabold text-slate-900 underline underline-offset-4">
                {identitas.namaKepalaSekolah || '...........................................'}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                NIP. {identitas.nipKepalaSekolah || '...........................................'}
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-slate-600">
                {formatTitimangsaDokumen(identitas.tempatPenetapan, soalDocument.konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan)}
              </p>
              <p className="font-bold text-slate-800">
                {identitas.peranGuru || 'Guru Mata Pelajaran / Kelas'}
              </p>
              <div className="h-16"></div>
              <p className="font-extrabold text-slate-900 underline underline-offset-4">
                {identitas.namaGuru || '...........................................'}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                NIP. {identitas.nipGuru || '...........................................'}
              </p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Modal Notifikasi Sukses Terbit ke Ruang Murid */}
      {showPublishSuccessModal && soalDocument && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border-2 border-indigo-500 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <Rocket className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                  Ujian Resmi Guru Terbit
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Berhasil Diterbitkan ke Ruang Murid!
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-800">
                {soalDocument.konfigurasi.judulDokumen || 'Naskah Ujian Resmi'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Mapel: <strong className="text-slate-800">{soalDocument.identitas.mataPelajaran}</strong></div>
                <div>Kelas: <strong className="text-slate-800">{soalDocument.identitas.kelas}</strong></div>
                <div>Jenis: <strong className="text-slate-800">{soalDocument.konfigurasi.jenisAsesmen}</strong></div>
                <div>Jumlah Soal: <strong className="text-slate-800">{soalDocument.ringkasanDistribusi.totalSoal} Butir</strong></div>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                ✅ Naskah telah disimpan di sistem CBT Ruang Murid dan siap dikerjakan oleh seluruh siswa secara online.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishSuccessModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Tetap di Bank Soal
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPublishSuccessModal(false);
                  if (onNavigateToRuangMurid) {
                    onNavigateToRuangMurid();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>🚀 Buka Ruang Murid Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generator Otomatis Latihan Bab ke Ruang Murid */}
      <AutoGenerateExerciseModal
        isOpen={isAutoGenerateModalOpen}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        identitas={identitas}
        tpList={tpList}
        onPackageCreated={(pkg) => {
          setSyncSuccessMessage(`🎉 Paket "${pkg.judul}" berhasil disusun otomatis dan masuk ke Ruang Murid!`);
          setTimeout(() => setSyncSuccessMessage(null), 6000);
        }}
        onBatchCreated={(count) => {
          setSyncSuccessMessage(`⚡ Berhasil menyusun ${count} paket latihan bab baru ke Ruang Murid!`);
          setTimeout(() => setSyncSuccessMessage(null), 6000);
        }}
        showToast={(msg) => {
          setSyncSuccessMessage(msg);
          setTimeout(() => setSyncSuccessMessage(null), 6000);
        }}
      />

      {/* Modal Konfirmasi KOP 4 Baris, Unggah Logo, Pemilihan Kelas, Titimangsa & Tahun Pelajaran sebelum Cetak / Ekspor */}
      {printConfirmModalState && soalDocument && (
        <BankSoalPrintConfirmModal
          isOpen={printConfirmModalState.isOpen}
          onClose={() => setPrintConfirmModalState(null)}
          actionType={printConfirmModalState.actionType}
          target={printConfirmModalState.target}
          identitas={soalDocument.identitas || identitas}
          konfigurasi={soalDocument.konfigurasi || config}
          availableTPs={availableTPs}
          onConfirm={handlePrintConfirmExecute}
        />
      )}
    </div>
  );
};
