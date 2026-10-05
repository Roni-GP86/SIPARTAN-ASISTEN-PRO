import React, { useState, useRef, useEffect } from 'react';
import { SchoolIdentity, SelectedElementItem, AccessRecord } from '../types';
import { OFFICIAL_SUBJECT_FOLDERS, SubjectFolder } from '../data/officialCPDatabase';
import {
  Sparkles,
  FolderOpen,
  Folder,
  Layers,
  BookOpen,
  School,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Filter,
  Upload,
  ClipboardPaste,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  FileCheck,
  Clock,
  Lock,
  ShieldCheck,
  GraduationCap,
  Building
} from 'lucide-react';
import { getPermen13Allocation } from '../data/permendikdasmen13Data';
import { Permen13AllocationModal } from './Permen13AllocationModal';
import {
  getAllowedFaseForRecord,
  isDemoAccessCode,
  isMasterAccessCode,
  isSubjectTeacher,
  isSubjectAllowedForRecord,
} from '../services/accessCodeService';

// Dedicated Subject Thematic Palette tailored for Executive Navy & Gold Theme
const getSubjectCardStyle = (mapel: string, isSelected: boolean) => {
  const lower = (mapel || '').toLowerCase();
  if (lower.includes('matematika')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-blue-900/30 scale-[1.01]' 
        : 'border-2 border-blue-500/40 hover:border-blue-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#0F2852] via-[#0D2246] to-[#0A1830]' 
        : 'bg-[#0A1830] hover:bg-[#0D2040]',
      title: 'text-blue-100 font-black',
      iconBg: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-950 text-blue-300 border border-blue-600/50',
      badgeFase: 'bg-[#070e1c] text-blue-300 border border-blue-500/40',
      badgeKelas: 'bg-blue-950 text-blue-200 border border-blue-700/50',
      badgeElemen: 'bg-blue-900/80 text-blue-200 border border-blue-500/50',
      accentDot: 'bg-blue-400',
    };
  }
  if (lower.includes('ipas') || lower.includes('alam') || lower.includes('sosial')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-emerald-900/30 scale-[1.01]' 
        : 'border-2 border-emerald-500/40 hover:border-emerald-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#0E2E25] via-[#0B251E] to-[#081C16]' 
        : 'bg-[#081C16] hover:bg-[#0B261F]',
      title: 'text-emerald-100 font-black',
      iconBg: isSelected ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50',
      badgeFase: 'bg-[#070e1c] text-emerald-300 border border-emerald-500/40',
      badgeKelas: 'bg-emerald-950 text-emerald-200 border border-emerald-700/50',
      badgeElemen: 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50',
      accentDot: 'bg-emerald-400',
    };
  }
  if (lower.includes('indonesia')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-900/30 scale-[1.01]' 
        : 'border-2 border-amber-500/40 hover:border-amber-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#33240A] via-[#261A07] to-[#181105]' 
        : 'bg-[#181105] hover:bg-[#241908]',
      title: 'text-amber-100 font-black',
      iconBg: isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-amber-950 text-amber-300 border border-amber-600/50',
      badgeFase: 'bg-[#070e1c] text-amber-300 border border-amber-500/40',
      badgeKelas: 'bg-amber-950 text-amber-200 border border-amber-700/50',
      badgeElemen: 'bg-amber-900/80 text-amber-200 border border-amber-500/50',
      accentDot: 'bg-amber-400',
    };
  }
  if (lower.includes('pancasila') || lower.includes('pkn')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-orange-900/30 scale-[1.01]' 
        : 'border-2 border-orange-500/40 hover:border-orange-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#331A0A] via-[#261307] to-[#180C05]' 
        : 'bg-[#180C05] hover:bg-[#241308]',
      title: 'text-orange-100 font-black',
      iconBg: isSelected ? 'bg-orange-500 text-white' : 'bg-orange-950 text-orange-300 border border-orange-600/50',
      badgeFase: 'bg-[#070e1c] text-orange-300 border border-orange-500/40',
      badgeKelas: 'bg-orange-950 text-orange-200 border border-orange-700/50',
      badgeElemen: 'bg-orange-900/80 text-orange-200 border border-orange-500/50',
      accentDot: 'bg-orange-400',
    };
  }
  if (lower.includes('agama') || lower.includes('islam') || lower.includes('kristen') || lower.includes('katolik')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-indigo-900/30 scale-[1.01]' 
        : 'border-2 border-indigo-500/40 hover:border-indigo-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#1E1840] via-[#161230] to-[#0E0B20]' 
        : 'bg-[#0E0B20] hover:bg-[#151130]',
      title: 'text-indigo-100 font-black',
      iconBg: isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-950 text-indigo-300 border border-indigo-600/50',
      badgeFase: 'bg-[#070e1c] text-indigo-300 border border-indigo-500/40',
      badgeKelas: 'bg-indigo-950 text-indigo-200 border border-indigo-700/50',
      badgeElemen: 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/50',
      accentDot: 'bg-indigo-400',
    };
  }
  if (lower.includes('jasmani') || lower.includes('pjok') || lower.includes('olahraga')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-teal-900/30 scale-[1.01]' 
        : 'border-2 border-teal-500/40 hover:border-teal-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#0B2C30] via-[#082226] to-[#05171A]' 
        : 'bg-[#05171A] hover:bg-[#082328]',
      title: 'text-teal-100 font-black',
      iconBg: isSelected ? 'bg-teal-500 text-slate-950 font-black' : 'bg-teal-950 text-teal-300 border border-teal-600/50',
      badgeFase: 'bg-[#070e1c] text-teal-300 border border-teal-500/40',
      badgeKelas: 'bg-teal-950 text-teal-200 border border-teal-700/50',
      badgeElemen: 'bg-teal-900/80 text-teal-200 border border-teal-500/50',
      accentDot: 'bg-teal-400',
    };
  }
  if (lower.includes('seni')) {
    return {
      border: isSelected 
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-yellow-900/30 scale-[1.01]' 
        : 'border-2 border-yellow-500/40 hover:border-yellow-400/80 shadow-xs hover:shadow-md',
      bg: isSelected 
        ? 'bg-gradient-to-br from-[#332A0A] via-[#261F07] to-[#181405]' 
        : 'bg-[#181405] hover:bg-[#251F08]',
      title: 'text-yellow-100 font-black',
      iconBg: isSelected ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-yellow-950 text-yellow-300 border border-yellow-600/50',
      badgeFase: 'bg-[#070e1c] text-yellow-300 border border-yellow-500/40',
      badgeKelas: 'bg-yellow-950 text-yellow-200 border border-yellow-700/50',
      badgeElemen: 'bg-yellow-900/80 text-yellow-200 border border-yellow-500/50',
      accentDot: 'bg-yellow-400',
    };
  }
  // Default: Royal Slate-Navy
  return {
    border: isSelected 
      ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.01]' 
      : 'border-2 border-slate-700 hover:border-amber-400/70 shadow-xs hover:shadow-md',
    bg: isSelected 
      ? 'bg-gradient-to-br from-[#122244] via-[#0E1B38] to-[#091326]' 
      : 'bg-[#0C172E] hover:bg-[#0F1E3C]',
    title: 'text-slate-100 font-black',
    iconBg: isSelected ? 'bg-amber-400 text-slate-950' : 'bg-[#070e1c] text-amber-300 border border-amber-500/40',
    badgeFase: 'bg-[#070e1c] text-amber-300 border border-amber-400/50',
    badgeKelas: 'bg-slate-800 text-slate-200 border border-slate-700',
    badgeElemen: 'bg-slate-800 text-amber-200 border border-slate-700',
    accentDot: 'bg-amber-400',
  };
};

interface CPInputFormProps {
  identitas: SchoolIdentity;
  onChangeIdentitas: (identitas: SchoolIdentity) => void;
  selectedElements: SelectedElementItem[];
  onChangeSelectedElements: (elements: SelectedElementItem[]) => void;
  preferensiTambahan: string;
  onChangePreferensiTambahan: (pref: string) => void;
  onGenerateTP: () => void;
  isLoading: boolean;
  activeAccessRecord?: AccessRecord | null;
  onSelectSubjectFolder?: (folder: SubjectFolder) => void;
}

export const CPInputForm: React.FC<CPInputFormProps> = ({
  identitas,
  onChangeIdentitas,
  selectedElements,
  onChangeSelectedElements,
  preferensiTambahan,
  onChangePreferensiTambahan,
  onGenerateTP,
  isLoading,
  activeAccessRecord,
  onSelectSubjectFolder,
}) => {
  const allowedFase = getAllowedFaseForRecord(activeAccessRecord);
  const isDemoMode = activeAccessRecord
    ? isDemoAccessCode(activeAccessRecord.kodeAkses) || Boolean(activeAccessRecord.isDemo)
    : false;
  const isSubjectTeacherUser = isSubjectTeacher(activeAccessRecord) && !isDemoMode && !isMasterAccessCode(activeAccessRecord?.kodeAkses);
  const isPhaseRestricted = allowedFase !== 'ALL';
  const isSubjectRestricted = isSubjectTeacherUser;

  const [activeInputMode, setActiveInputMode] = useState<'folder_bank' | 'manual' | 'upload'>('folder_bank');
  const [activeFolderId, setActiveFolderId] = useState<string>('folder-ipas-fase-b');
  const [faseFilter, setFaseFilter] = useState<'ALL' | 'Fase A' | 'Fase B' | 'Fase C'>(
    isPhaseRestricted ? allowedFase : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showIdentityDetails, setShowIdentityDetails] = useState<boolean>(true);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(null);
  const [expandedElementId, setExpandedElementId] = useState<string | null>(null);
  const [showPermenModal, setShowPermenModal] = useState<boolean>(false);
  const [phaseLockAlert, setPhaseLockAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enforce filter matching allowed phase if restricted
  useEffect(() => {
    if (isPhaseRestricted) {
      setFaseFilter(allowedFase);
    }
  }, [isPhaseRestricted, allowedFase]);

  // Live calculation of Permendikdasmen No. 13 Tahun 2025 allocation
  const permenAllocation = getPermen13Allocation(
    identitas.mataPelajaran || 'Matematika',
    identitas.fase || 'Fase C',
    identitas.kelas || '5'
  );

  const handleApplyPermenAllocation = (customText?: string) => {
    const text =
      customText ||
      `${permenAllocation.jpTahunIntra} JP / Tahun (${permenAllocation.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`;
    onChangeIdentitas({
      ...identitas,
      alokasiWaktuTotal: text,
    });
  };

  // Filtered Subject Folders from Official Database
  const filteredFolders = OFFICIAL_SUBJECT_FOLDERS.filter((folder) => {
    const matchesFase = faseFilter === 'ALL' || folder.fase === faseFilter;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      (folder.mataPelajaran || '').toLowerCase().includes(q) ||
      (folder.deskripsiMapel || '').toLowerCase().includes(q) ||
      (folder.elemenList || []).some(
        (el) =>
          (el.elemen || '').toLowerCase().includes(q) ||
          (el.capaianPembelajaran || '').toLowerCase().includes(q)
      );
    return matchesFase && matchesSearch;
  });

  // When a subject folder is selected from the bank
  const handleSelectFolder = (folder: SubjectFolder) => {
    if (isPhaseRestricted && folder.fase !== allowedFase) {
      setPhaseLockAlert(
        `Fase ${folder.fase} terkunci! Akun Anda terdaftar khusus untuk ${allowedFase}. Silakan buka folder ${allowedFase}, ajukan kode akses baru, atau gunakan Akun Demo (GP-RHB1).`
      );
      return;
    }
    if (isSubjectRestricted && !isSubjectAllowedForRecord(folder.mataPelajaran, activeAccessRecord)) {
      setPhaseLockAlert(
        `Mata Pelajaran "${folder.mataPelajaran}" terkunci! Akun Anda terdaftar khusus sebagai Guru Mata Pelajaran "${activeAccessRecord?.mataPelajaran || 'Pendidikan Agama'}". Anda berhak mengakses seluruh Fase A, B, C untuk mata pelajaran ${activeAccessRecord?.mataPelajaran || ''}.`
      );
      return;
    }
    setPhaseLockAlert(null);
    setActiveFolderId(folder.id);

    if (onSelectSubjectFolder) {
      onSelectSubjectFolder(folder);
      return;
    }

    let newKelas = identitas.kelas;
    if (folder.fase === 'Fase A' && !['1', '2'].includes(newKelas)) newKelas = '1';
    if (folder.fase === 'Fase B' && !['3', '4'].includes(newKelas)) newKelas = '3';
    if (folder.fase === 'Fase C' && !['5', '6'].includes(newKelas)) newKelas = '5';

    const alloc = getPermen13Allocation(folder.mataPelajaran, folder.fase, newKelas);

    onChangeIdentitas({
      ...identitas,
      mataPelajaran: folder.mataPelajaran,
      fase: folder.fase,
      kelas: newKelas,
      alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
    });

    const newElements: SelectedElementItem[] = folder.elemenList.map((el) => ({
      id: el.id,
      elemen: el.elemen,
      capaianPembelajaran: el.capaianPembelajaran,
      deskripsiSingkat: el.deskripsiSingkat,
      isSelected: true,
    }));

    onChangeSelectedElements(newElements);
  };

  // Toggle single element checkbox
  const handleToggleElement = (id: string) => {
    const updated = selectedElements.map((el) =>
      el.id === id ? { ...el, isSelected: !el.isSelected } : el
    );
    onChangeSelectedElements(updated);
  };

  // Select all or Deselect all elements
  const handleToggleAllElements = (selectAll: boolean) => {
    const updated = selectedElements.map((el) => ({ ...el, isSelected: selectAll }));
    onChangeSelectedElements(updated);
  };

  // Update specific element CP text
  const handleUpdateElementCP = (id: string, newCPText: string) => {
    const updated = selectedElements.map((el) =>
      el.id === id ? { ...el, capaianPembelajaran: newCPText } : el
    );
    onChangeSelectedElements(updated);
  };

  // Update specific element title
  const handleUpdateElementName = (id: string, newName: string) => {
    const updated = selectedElements.map((el) =>
      el.id === id ? { ...el, elemen: newName } : el
    );
    onChangeSelectedElements(updated);
  };

  // Add custom element
  const handleAddCustomElement = () => {
    const newIndex = selectedElements.length + 1;
    const newEl: SelectedElementItem = {
      id: `custom-el-${Date.now()}`,
      elemen: `Elemen ${newIndex}`,
      capaianPembelajaran: '',
      deskripsiSingkat: 'Elemen tambahan yang disesuaikan oleh guru',
      isSelected: true,
    };
    onChangeSelectedElements([...selectedElements, newEl]);
    setExpandedElementId(newEl.id);
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    if (selectedElements.length <= 1) {
      alert('Minimal harus ada 1 elemen dalam mata pelajaran.');
      return;
    }
    const filtered = selectedElements.filter((el) => el.id !== id);
    onChangeSelectedElements(filtered);
  };

  // Process file upload
  const processUploadedFile = (file: File) => {
    setUploadStatusMessage(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (content.mataPelajaran) {
            onChangeIdentitas({ ...identitas, mataPelajaran: content.mataPelajaran });
          }
          if (Array.isArray(content.elemenList) && content.elemenList.length > 0) {
            const mapped: SelectedElementItem[] = content.elemenList.map((item: any, idx: number) => ({
              id: item.id || `uploaded-el-${idx}`,
              elemen: item.elemen || `Elemen ${idx + 1}`,
              capaianPembelajaran: item.capaianPembelajaran || item.cp || '',
              deskripsiSingkat: item.deskripsiSingkat || '',
              isSelected: true,
            }));
            onChangeSelectedElements(mapped);
            setUploadStatusMessage(`Berhasil memuat ${mapped.length} elemen mata pelajaran dari ${file.name}`);
          } else if (content.capaianPembelajaran) {
            const single: SelectedElementItem = {
              id: 'uploaded-el-1',
              elemen: content.elemen || 'Elemen Mapel',
              capaianPembelajaran: content.capaianPembelajaran,
              isSelected: true,
            };
            onChangeSelectedElements([single]);
            setUploadStatusMessage(`Berhasil memuat CP dari ${file.name}`);
          }
        } catch {
          setUploadStatusMessage('Format JSON tidak valid.');
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        if (text.trim()) {
          const single: SelectedElementItem = {
            id: `uploaded-el-${Date.now()}`,
            elemen: 'Elemen Pembelajaran',
            capaianPembelajaran: text.trim(),
            isSelected: true,
          };
          onChangeSelectedElements([single]);
          setUploadStatusMessage(`Berhasil membaca teks dari ${file.name} (${text.length} karakter).`);
        }
      };
      reader.readAsText(file);
    }
  };

  const selectedCount = selectedElements.filter((e) => e.isSelected).length;
  const isAgama =
    (identitas?.mataPelajaran || '').toLowerCase().includes('agama') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('katolik') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('kristen') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('islam') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('hindu') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('buddha') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('khonghucu') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('pak') ||
    (identitas?.mataPelajaran || '').toLowerCase().includes('pai');
  const cpRegulasiTitle = isAgama ? 'Regulasi BKP 020/2026' : 'BSKAP No. 046 Tahun 2025';

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">
      {/* Header Info Banner - Framed in Deep Navy with Gold & Emerald Accents */}
      <div className="rounded-xl bg-[#0B1528] text-white p-5 border-2 border-amber-500/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500" />
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              Khusus SD / MI
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold tracking-wider">
              Fase A • Fase B • Fase C
            </span>
            <span className="text-xs text-amber-300/90 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {cpRegulasiTitle}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Folder Bank CP Per Mata Pelajaran &amp; Analisis Batch Seluruh Elemen
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Setiap mata pelajaran dikelompokkan dalam <strong className="text-amber-300">1 Folder Terpadu</strong> berisi seluruh elemen dan CP resminya. Guru cukup memilih mata pelajaran, menyesuaikan elemen yang diinginkan, dan aplikasi akan menghasilkan analisis TP untuk <strong className="text-emerald-300">seluruh elemen mata pelajaran sekaligus</strong>.
          </p>
        </div>

        <button
          id="btn-quick-generate-top"
          type="button"
          onClick={onGenerateTP}
          disabled={isLoading || selectedCount === 0}
          className="shrink-0 px-4 py-2.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-2 border-amber-300 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Menganalisis {selectedCount} Elemen...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Analisis {selectedCount} Elemen Mapel</span>
            </>
          )}
        </button>
      </div>

      {/* ALOKASI WAKTU RESMI PERMENDIKDASMEN NO. 13 TAHUN 2025 BANNER & CONTROLLER */}
      <div className="bg-gradient-to-r from-[#0B1D16] via-[#102c21] to-[#0B1D16] text-white rounded-xl p-3.5 sm:p-4 border-2 border-emerald-500/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                  Permendikdasmen No. 13 Tahun 2025
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  Standar SD: 1 JP = 35 Menit
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>
                  Alokasi Intrakurikuler {identitas.mataPelajaran}:{' '}
                  <strong className="text-amber-300">{permenAllocation.jpMingguIntra} JP/Minggu</strong>
                </span>
                <span className="text-emerald-500">•</span>
                <span>
                  Semester: <strong className="text-emerald-300">{permenAllocation.jpSemesterIntra} JP</strong>
                </span>
                <span className="text-emerald-500">•</span>
                <span>
                  Tahun: <strong className="text-emerald-300">{permenAllocation.jpTahunIntra} JP</strong>
                </span>
                <span className="text-[11px] text-slate-300 font-normal">
                  ({permenAllocation.asumsiMingguTahun} Minggu Efektif)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-apply-permen13-auto"
              type="button"
              onClick={() => handleApplyPermenAllocation()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Terapkan alokasi ini ke identitas dokumen"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Alokasi</span>
            </button>

            <button
              id="btn-open-permen13-modal"
              type="button"
              onClick={() => setShowPermenModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 border border-amber-400/50 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Lihat Tabel Alokasi Waktu Resmi Seluruh Kelas SD (Fase A, B, C)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Matriks Lengkap SD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input Mode Selector - Framed with Dual Tone Accent */}
      <div className="bg-white rounded-xl p-3.5 border-2 border-slate-300 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-700 flex items-center justify-center">
              <Folder className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black text-[#0B1528] uppercase tracking-wide">
              Metode Input Elemen &amp; Capaian Pembelajaran:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="tab-mode-folder-bank"
              type="button"
              onClick={() => setActiveInputMode('folder_bank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
                activeInputMode === 'folder_bank'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-xs ring-1 ring-amber-400/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Folder Bank Mapel BSKAP ({OFFICIAL_SUBJECT_FOLDERS.length} Mapel SD)</span>
            </button>

            <button
              id="tab-mode-manual"
              type="button"
              onClick={() => setActiveInputMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
                activeInputMode === 'manual'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-xs ring-1 ring-amber-400/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Input Bebas / Kustom Elemen</span>
            </button>

            <button
              id="tab-mode-upload"
              type="button"
              onClick={() => setActiveInputMode('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border-2 cursor-pointer ${
                activeInputMode === 'upload'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-xs ring-1 ring-amber-400/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Dokumen (.txt / .json)</span>
            </button>
          </div>
        </div>

        {/* 1. FOLDER BANK MAPEL MODE */}
        {activeInputMode === 'folder_bank' && (
          <div className="pt-2 space-y-3">
            {/* Phase lock alert popup banner */}
            {phaseLockAlert && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-between gap-2.5 text-xs text-red-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-semibold">{phaseLockAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPhaseLockAlert(null)}
                  className="px-2 py-0.5 rounded text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Demo Mode Status Banner */}
            {isDemoMode && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black text-emerald-900 flex items-center gap-1.5 flex-wrap">
                    <span>Akun Demo Resmi Aktif: GP-RHB1</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9.5px] font-black tracking-wider">
                      AKUN DEMO RESMI
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    Data Sekolah &amp; Guru terkunci permanen pada <strong>SD Negeri Fatubai (Roni Hariyanto Bhidju, S. Pd)</strong>. Anda bebas memilih dan berganti pilihan <strong>Fase A, Fase B, dan Fase C</strong> serta seluruh kelas SD.
                  </p>
                </div>
              </div>
            )}

            {/* Guru Mata Pelajaran Status Banner */}
            {isSubjectRestricted && (
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-300 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
                <Lock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black text-indigo-900 flex items-center gap-1.5 flex-wrap">
                    <span>Akun Guru Mata Pelajaran: Khusus {activeAccessRecord?.mataPelajaran || 'Pendidikan Agama Katolik'}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9.5px] font-mono font-black">
                      {activeAccessRecord?.kodeAkses}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9.5px] font-bold">
                      Fase A, B, C (Kelas 1-6) Bebas Diakses
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                    Anda memiliki hak akses penuh ke seluruh jenjang <strong>Kelas 1 s.d. 6 (Fase A, Fase B, dan Fase C)</strong> untuk mata pelajaran <strong>{activeAccessRecord?.mataPelajaran}</strong>. Mata pelajaran lain terkunci otomatis.
                  </p>
                </div>
              </div>
            )}

            {/* Regular Teacher Phase-Locked Status Banner */}
            {isPhaseRestricted && !isSubjectRestricted && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
                <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black text-blue-900 flex items-center gap-1.5 flex-wrap">
                    <span>Akun Guru Terdaftar: Khusus {allowedFase} (Kelas {activeAccessRecord?.kelas})</span>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-mono font-black">
                      {activeAccessRecord?.kodeAkses}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-bold">
                      Fase Lain Terkunci
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                    Aplikasi SIPARTAN membuka khusus <strong>{allowedFase}</strong> sesuai data pendaftaran kode akses Anda. Fase lainnya terkunci otomatis. Untuk mengampu fase lain, silakan ajukan formulir kode akses baru atau gunakan <strong>Akun Demo (GP-RHB1)</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border-2 border-slate-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  id="input-search-folder-bank"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mata pelajaran atau materi (contoh: IPAS, Matematika, Bahasa Indonesia, Pancasila, PAI)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border-2 border-slate-300 focus:outline-hidden focus:border-amber-500 bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-slate-600 font-bold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-600" />
                  <span>Fase:</span>
                </span>
                {(['ALL', 'Fase A', 'Fase B', 'Fase C'] as const).map((filterKey) => {
                  const isLocked = isPhaseRestricted && filterKey !== allowedFase;
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          setPhaseLockAlert(
                            `Fase ${filterKey} terkunci! Akun Anda terdaftar khusus untuk ${allowedFase}. Silakan buka folder ${allowedFase} atau gunakan Akun Demo (GP-RHB1).`
                          );
                          return;
                        }
                        setFaseFilter(filterKey);
                      }}
                      className={`px-3 py-1 rounded-md text-[11px] font-extrabold transition-all border-2 flex items-center gap-1.5 ${
                        isLocked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          : faseFilter === filterKey
                          ? 'bg-[#0B1528] text-amber-300 border-amber-400 shadow-xs cursor-pointer'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border-slate-300 cursor-pointer'
                      }`}
                      title={isLocked ? `Fase terkunci: Akun Anda khusus ${allowedFase}` : undefined}
                    >
                      {isLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                      <span>{filterKey === 'ALL' ? 'Semua Fase SD' : filterKey}</span>
                      {isLocked && <span className="text-[9px] font-bold text-red-500">(Kunci)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Folder Grid Cards - Distinctly Colored & Framed for Elegance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1.5 p-1">
              {filteredFolders.map((folder) => {
                const isSelected = activeFolderId === folder.id;
                const isFolderSubjectLocked = isSubjectRestricted && !isSubjectAllowedForRecord(folder.mataPelajaran, activeAccessRecord);
                const isFolderPhaseLocked = isPhaseRestricted && folder.fase !== allowedFase;
                const isFolderLocked = isFolderPhaseLocked || isFolderSubjectLocked;
                const style = getSubjectCardStyle(folder.mataPelajaran, isSelected);

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSelectFolder(folder)}
                    className={`text-left p-4 rounded-xl transition-all relative flex flex-col justify-between ${
                      isFolderLocked
                        ? 'opacity-40 grayscale-[40%] bg-slate-100 border-2 border-slate-300 cursor-not-allowed'
                        : `cursor-pointer ${style.border} ${style.bg}`
                    }`}
                  >
                    <div className="space-y-2.5 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${isFolderLocked ? 'bg-slate-300 text-slate-600' : style.iconBg}`}>
                            {isFolderLocked ? <Lock className="w-4 h-4 text-slate-600" /> : <FolderOpen className="w-4 h-4" />}
                          </div>
                          <span className={`text-xs ${isFolderLocked ? 'text-slate-700 font-bold' : style.title} line-clamp-1`}>
                            {folder.mataPelajaran}
                          </span>
                        </div>
                        {isFolderLocked ? (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-red-700 text-[9.5px] font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Terkunci
                          </span>
                        ) : isSelected ? (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm ring-2 ring-emerald-300">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className={`shrink-0 w-2 h-2 rounded-full ${style.accentDot} mt-1.5`} />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shadow-2xs ${isFolderLocked ? 'bg-slate-200 text-slate-600 border border-slate-300' : style.badgeFase}`}>
                          {folder.fase}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${isFolderLocked ? 'bg-slate-200 text-slate-600 border border-slate-300' : style.badgeKelas}`}>
                          Kelas {folder.kelas}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${isFolderLocked ? 'bg-slate-200 text-slate-600 border border-slate-300' : style.badgeElemen}`}>
                          {folder.elemenList.length} Elemen
                        </span>
                      </div>

                      <p className={`text-[11px] ${isFolderLocked ? 'text-slate-500' : 'text-slate-600'} line-clamp-2 leading-relaxed font-medium`}>
                        {isFolderLocked
                          ? `Terkunci: Khusus ${folder.fase}. Kode akses Anda terdaftar untuk ${allowedFase}.`
                          : folder.deskripsiMapel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MANUAL CUSTOM MODE */}
        {activeInputMode === 'manual' && (
          <div className="pt-2 space-y-3">
            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900">Mode Input Bebas:</span> Anda dapat mengetikkan nama mata pelajaran dan menambahkan banyak elemen beserta teks Capaian Pembelajaran (CP) sesuai dokumen kurikulum sekolah/dinas Anda.
              </div>
            </div>
          </div>
        )}

        {/* 3. UPLOAD MODE */}
        {activeInputMode === 'upload' && (
          <div className="pt-2 space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processUploadedFile(file);
                }}
                className="hidden"
              />
              <Upload className="w-7 h-7 text-amber-600 mx-auto mb-2" />
              <div className="text-xs font-black text-[#0B1528]">
                Klik atau Seret File Dokumen CP (.txt / .json) ke sini
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Format didukung: File JSON CP terstruktur atau Teks biasa hasil copas dokumen CP dinas
              </div>
            </div>

            {uploadStatusMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-900 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadStatusMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE SUBJECT FOLDER & MULTI-ELEMENT MANAGER - Framed */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0B1528] text-amber-400 border border-amber-400/40 shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#0B1528]">
                  {identitas.mataPelajaran || 'Mata Pelajaran Belum Dipilih'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-900 text-[10px] font-black border border-amber-400">
                  {identitas.fase} (Kelas {identitas.kelas})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar elemen dan Capaian Pembelajaran dalam 1 folder mata pelajaran ini:
              </p>
            </div>
          </div>

          {/* Bulk Element Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleToggleAllElements(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              Pilih Semua ({selectedElements.length})
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllElements(false)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              Batal Semua
            </button>
            <button
              type="button"
              onClick={handleAddCustomElement}
              className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 border border-orange-400 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Elemen (+)</span>
            </button>
          </div>
        </div>

        {/* Elements List - Structured Frames */}
        <div className="space-y-3">
          {selectedElements.map((el, index) => {
            const isExpanded = expandedElementId === el.id || selectedElements.length <= 2;

            return (
              <div
                key={el.id}
                className={`rounded-xl border-2 transition-all overflow-hidden ${
                  el.isSelected
                    ? 'bg-white border-slate-300 shadow-xs ring-1 ring-slate-900/5'
                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                }`}
              >
                {/* Top decorative accent bar */}
                <div className={`h-1 ${el.isSelected ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500' : 'bg-slate-300'}`} />

                {/* Element Header Bar */}
                <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id={`chk-el-${el.id}`}
                      checked={el.isSelected}
                      onChange={() => handleToggleElement(el.id)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-2 border-slate-400 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0B1528] text-amber-300 text-[10px] font-black border border-amber-400/40">
                          Elemen {index + 1}
                        </span>
                        <input
                          type="text"
                          value={el.elemen}
                          onChange={(e) => handleUpdateElementName(el.id, e.target.value)}
                          className="text-xs font-extrabold text-[#0B1528] bg-transparent border-b-2 border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-hidden px-1 py-0.5 flex-1"
                          placeholder="Nama Elemen Mata Pelajaran..."
                        />
                      </div>
                      {el.deskripsiSingkat && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                          {el.deskripsiSingkat}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedElementId(isExpanded ? null : el.id)}
                      className="p-1.5 text-slate-600 hover:text-[#0B1528] hover:bg-slate-100 rounded-md text-xs flex items-center gap-1 border border-slate-200 cursor-pointer"
                      title={isExpanded ? 'Sembunyikan Teks CP' : 'Tampilkan & Edit Teks CP'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {selectedElements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(el.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 cursor-pointer"
                        title="Hapus Elemen Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Capaian Pembelajaran Text Area */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t-2 border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Teks Capaian Pembelajaran (CP) Resmi BSKAP 046/2025:
                      </label>
                      <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{el.capaianPembelajaran.length} karakter</span>
                    </div>

                    <textarea
                      rows={3}
                      value={el.capaianPembelajaran}
                      onChange={(e) => handleUpdateElementCP(el.id, e.target.value)}
                      placeholder="Masukkan atau sesuaikan teks Capaian Pembelajaran untuk elemen ini..."
                      className="w-full p-3 text-xs rounded-lg border-2 border-slate-300 focus:outline-hidden focus:border-amber-500 leading-relaxed text-slate-900 bg-white font-medium"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* IDENTITAS SATUAN PENDIDIKAN - TERKUNCI RESMI (SESUAI FORMULIR KODE AKSES) */}
      <div className="bg-white rounded-xl p-4 border-2 border-slate-300 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowIdentityDetails(!showIdentityDetails)}
          className="w-full flex items-center justify-between text-left font-black text-xs text-[#0B1528] cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-md bg-[#0B1528] text-amber-400 flex items-center justify-center text-xs shadow-2xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-900">Identitas Satuan Pendidikan &amp; Data Penyusun</span>
            <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-700" />
              TERKUNCI RESMI
            </span>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
              {identitas.namaSatuanPendidikan || 'SD'} • {identitas.namaGuru || 'Guru'} ({identitas.peranGuru || 'Guru Kelas'})
            </span>
          </div>
          {showIdentityDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </button>

        {showIdentityDetails && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            {/* Banner: Terkunci Permanen Sesuai Permintaan Kode Akses */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-amber-950 flex items-center gap-1.5">
                  <span>Data Identitas Resmi Dikunci Otomatis</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9.5px] font-mono font-black border border-amber-400">
                    ANTI-EDIT
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed mt-0.5">
                  Data satuan pendidikan, guru pengampu, dan kepala sekolah terkunci permanen sesuai data formulir pendaftaran kode akses resmi SIPARTAN. Pengeditan tidak diizinkan guna menjamin keaslian, integritas, dan validitas dokumen kurikulum resmi Anda.
                </p>
              </div>
            </div>

            {/* Readonly Locked Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Nama Sekolah */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-600" />
                    Satuan Pendidikan
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-black text-sm text-slate-900">
                  {identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
                </div>
              </div>

              {/* Jabatan Guru */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-600" />
                    Jabatan Tanda Tangan
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-black text-sm text-slate-900">
                  {identitas.peranGuru || 'Guru Kelas'}
                </div>
              </div>

              {/* Nama Guru */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-600" />
                    Penyusun
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-black text-sm text-slate-900">
                  {identitas.namaGuru || 'Nama Guru Belum Diatur'}
                </div>
              </div>

              {/* NIP Guru */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>NIP Guru</span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-800">
                  {identitas.nipGuru || '-'}
                </div>
              </div>

              {/* Kepala Sekolah */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-rose-600" />
                    Kepala Sekolah
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-black text-sm text-slate-900">
                  {identitas.namaKepalaSekolah || 'Kepala Sekolah Belum Diatur'}
                </div>
              </div>

              {/* NIP Kepala Sekolah */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>NIP Kepala Sekolah</span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-800">
                  {identitas.nipKepalaSekolah || '-'}
                </div>
              </div>

              {/* Tahun Pelajaran & Semester */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Tahun Pelajaran &amp; Semester</span>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {identitas.tahunPelajaran || '2026/2027'} • Semester {identitas.semester || '1 (Ganjil)'}
                </div>
              </div>

              {/* Alokasi Waktu Permendikdasmen No 13/2025 */}
              <div className="sm:col-span-2 lg:col-span-2 p-3 bg-emerald-50/80 rounded-xl border border-emerald-300">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    Alokasi Waktu Intrakurikuler (Permendikdasmen No. 13 Tahun 2025)
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Standar Regulasi
                  </span>
                </div>
                <div className="font-bold text-xs text-emerald-950">
                  {identitas.alokasiWaktuTotal || '180 JP / Tahun (5 JP/Minggu @ 35 Menit)'}
                </div>
                <div className="text-[10px] text-emerald-800 mt-1">
                  *Alokasi jam pelajaran terkunci otomatis sesuai regulasi resmi dan tercetak pada Cover, Analisis TP, ATP, dan Modul Ajar.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CATATAN TAMBAHAN / PREFERENSI GURU - Framed */}
      <div className="bg-white rounded-xl p-4 border-2 border-slate-300 shadow-sm space-y-2">
        <label className="block text-xs font-extrabold text-[#0B1528] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Catatan / Penyesuaian Karakteristik Sekolah (Opsional):
        </label>
        <input
          type="text"
          value={preferensiTambahan}
          onChange={(e) => onChangePreferensiTambahan(e.target.value)}
          placeholder="Contoh: Fokus pada pemanfaatan lingkungan sekitar sekolah, praktikum sederhana, dan kearifan lokal..."
          className="w-full px-3 py-2 text-xs rounded-lg border-2 border-slate-300 focus:outline-hidden focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs"
        />
      </div>

      {/* BIG PRIMARY CTA SUBMIT BUTTON - Majestic Navy, Gold & Warm Orange */}
      <div className="pt-2">
        <button
          id="btn-generate-tp-bottom"
          type="button"
          onClick={onGenerateTP}
          disabled={isLoading || selectedCount === 0}
          className="w-full py-4 px-5 rounded-xl font-black text-sm text-amber-300 bg-gradient-to-r from-[#0B1528] via-[#142647] to-[#0B1528] hover:from-[#11203b] hover:to-[#1b345f] hover:text-white border-2 border-amber-400 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <span>Sedang Menganalisis Seluruh Elemen {identitas.mataPelajaran}...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>
                Mulai Analisis CP ke TP 1 Mapel Utuh ({selectedCount} Elemen Terpilih) Sesuai BSKAP 046/2025
              </span>
            </>
          )}
        </button>
      </div>

      {/* Modal Alokasi Waktu Permendikdasmen No. 13 Tahun 2025 */}
      {showPermenModal && (
        <Permen13AllocationModal
          isOpen={showPermenModal}
          onClose={() => setShowPermenModal(false)}
          currentMapel={identitas.mataPelajaran}
          currentFase={identitas.fase}
          currentKelas={identitas.kelas}
          onApplyAllocation={(alokasi) => handleApplyPermenAllocation(alokasi)}
        />
      )}
    </div>
  );
};
