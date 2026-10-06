import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SchoolIdentity,
  TPItem,
  ATPDocument,
  ModulAjarDocument,
  SelectedElementItem,
  BedahElemenRow,
  KKTPDocument,
  AccessRecord,
  ProtaDocument,
  PromesDocument,
  SavedItem,
  RPMConfigOptions,
  KisiKisiSoalDocument,
  ExamPackage,
} from './types';
import { OFFICIAL_SUBJECT_FOLDERS } from './data/officialCPDatabase';
import {
  INITIAL_MATEMATIKA_IDENTITAS,
  INITIAL_MATEMATIKA_SELECTED_ELEMENTS,
  INITIAL_MATEMATIKA_ELEMEN_ROWS,
  INITIAL_MATEMATIKA_TP_LIST,
  INITIAL_MATEMATIKA_RASIONAL,
  INITIAL_MATEMATIKA_ATP_DOCUMENT,
  INITIAL_MATEMATIKA_KKTP_DOCUMENT,
} from './data/initialMatematikaFaseC';
import { Navbar } from './components/Navbar';
import { CPInputForm } from './components/CPInputForm';
import { TPAnalysisView } from './components/TPAnalysisView';
import { ATPDocumentView } from './components/ATPDocumentView';
import { KKTPDocumentView } from './components/KKTPDocumentView';
import { ProtaDocumentView } from './components/ProtaDocumentView';
import { PromesDocumentView } from './components/PromesDocumentView';
import { ModulAjarView } from './components/ModulAjarView';
import { MediaPromptView } from './components/MediaPromptView';
import { BankSoalView } from './components/BankSoalView';
import { AnalisisNilaiRaporView } from './components/AnalisisNilaiRaporView';
import { RuangMuridView } from './components/RuangMuridView';
import { PortalSelectionView } from './components/PortalSelectionView';
import { saveOrPublishExamPackage } from './services/examService';
import { SavedDocumentsModal } from './components/SavedDocumentsModal';
import { GuideModal } from './components/GuideModal';
import { SchoolIdentityModal } from './components/SchoolIdentityModal';
import { AccessGateModal } from './components/AccessGateModal';
import { AdminAccessManagerModal } from './components/AdminAccessManagerModal';
import { WordDownloadBlockedModal } from './components/WordDownloadBlockedModal';
import { RPMConfigModal } from './components/RPMConfigModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SubjectPickerModal } from './components/SubjectPickerModal';
import { SubjectAnalysisWarningModal } from './components/SubjectAnalysisWarningModal';
import { StudentManagerModal } from './components/StudentManagerModal';
import { TeacherExamMonitoringModal } from './components/TeacherExamMonitoringModal';
import { TeacherKamarBahanAjarModal } from './components/TeacherKamarBahanAjarModal';
import { RuangMuridDeactivatedModal } from './components/RuangMuridDeactivatedModal';
import { RuangMuridPasscodeModal } from './components/RuangMuridPasscodeModal';
import { DataIntegrityModal } from './components/DataIntegrityModal';
import { AutoSaveIndicator } from './components/AutoSaveIndicator';
import {
  isRuangMuridEnabled,
  isStudentAuthenticatedForRuangMurid,
  setStudentAuthenticatedForRuangMurid,
  subscribeToRuangMuridPolicy,
} from './services/ruangMuridPolicyService';
import { getStudentCount } from './services/studentService';
import {
  saveSubjectWorkspace,
  getSubjectWorkspace,
  hasSubjectBeenAnalyzed,
  getSubjectEmoticon,
  getOrInitSubjectWorkspace,
  SubjectWorkspace,
  isTPListValidForSubject,
} from './utils/subjectWorkspaceService';
import { SubjectFolder } from './data/officialCPDatabase';
import { getPermen13Allocation } from './data/permendikdasmen13Data';
import { AppLogo } from './components/AppLogo';
import { resolveCPPerElemenFromTPs } from './utils/curriculumCPResolver';
import { 
  getItemClass, 
  filterATPDocumentByClass, 
  filterKKTPDocumentByClass 
} from './utils/classFilterUtils';
import { 
  filterProtaDocumentByClass, 
  filterPromesDocumentByClass 
} from './utils/protaPromesGenerator';
import { formatImageUrl } from './utils/imageUtils';
import { buildKKTPDocumentFromTP } from './utils/kktpGenerator';
import { buildProtaDocumentFromTP, buildPromesDocumentFromTP } from './utils/protaPromesGenerator';
import { buildDefaultModulAjarFromTP } from './utils/modulAjarGenerator';
import { generateKisiKisiDanNaskahSoal, getDefaultKonfigurasiSoal } from './utils/kisiKisiSoalGenerator';
import {
  getActiveSessionCode,
  setActiveSessionCode,
  clearActiveSessionCode,
  findAccessRecord,
  getAllAccessRecords,
  convertAccessRecordToIdentity,
  MASTER_ACCESS_CODE,
  DEFAULT_PREMIUM_RECORD,
  isMasterAccessCode,
  isDeactivatedLegacyCode,
  isWordExportDisabled,
  getAllowedFaseForRecord,
  isSubjectAllowedForRecord,
  subscribeToAccessRecordsFromFirestore,
  subscribeToSingleAccessCode,
  findAccessRecordAsync,
  subscribeToWordExportDisabledFromFirestore,
  fetchWordExportDisabledFromFirestore,
  updateAccessRecordAsync,
} from './services/accessCodeService';
import {
  saveUserWorkspaceToFirestore,
  loadUserWorkspaceFromFirestore,
  applyCloudWorkspaceToLocalStorage,
  getCloudSyncStatus,
  CloudSyncStatus,
  updateUserWorkspaceIdentityInFirestore,
} from './services/userWorkspaceFirestore';
import {
  getAllSubjectWorkspaces,
  saveAllSubjectWorkspaces,
  makeSubjectKey,
} from './utils/subjectWorkspaceService';
import {
  STORAGE_KEYS,
  saveToStorage,
  loadFromStorage,
  clearWorkingDrafts,
  createEmergencyBackupBeforeReset,
  createAutoSnapshot,
} from './utils/storageUtils';
import { getStudentList, saveStudentList } from './services/studentService';
import { sounds } from './utils/audioEffects';
import {
  clientGenerateTP,
  clientGenerateATP,
  clientGenerateKKTP,
  clientGenerateModulAjar,
} from './services/curriculumApiClient';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Menu,
  BookOpen,
  Sparkles,
  HelpCircle,
  Building,
  CheckSquare,
  ArrowRight,
  GraduationCap,
  MapPin,
  Award,
  Lock,
  KeyRound,
  ShieldCheck,
  Crown,
  Calendar,
  Layers,
  ChevronDown,
  Users,
} from 'lucide-react';

export default function App() {

  // Check URL parameter for direct student access (e.g. ?portal=murid or ?role=murid)
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = (urlParams.get('portal') || urlParams.get('mode') || urlParams.get('role') || '').toLowerCase();
      if (portalParam === 'murid' || portalParam === 'siswa') {
        return false; // Langsung masuk tanpa splash delay untuk murid
      }
    } catch {}
    return true;
  });
  
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4500); // 4.5 seconds for the intro animation
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Navigation with permanent persistence - default to 'tp' so user immediately sees the generated document
  const [currentTab, setCurrentTab] = useState<'input' | 'tp' | 'atp' | 'kktp' | 'prota' | 'promes' | 'modul' | 'prompt-media' | 'soal' | 'saved' | 'rapor'>(() => {
    return loadFromStorage<'input' | 'tp' | 'atp' | 'kktp' | 'prota' | 'promes' | 'modul' | 'prompt-media' | 'soal' | 'saved' | 'rapor'>(STORAGE_KEYS.ACTIVE_TAB, 'tp');
  });

  // Portal Mode: 'selection' (gateway) | 'guru' (default SIPARTAN) | 'murid' (portal ujian & bahan bacaan siswa)
  const [portalMode, setPortalMode] = useState<'selection' | 'guru' | 'murid'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = (urlParams.get('portal') || urlParams.get('mode') || urlParams.get('role') || '').toLowerCase();
      if (portalParam === 'murid' || portalParam === 'siswa') return 'murid';
      if (portalParam === 'guru') return 'guru';
    } catch {}
    return 'selection';
  });

  // Ruang Murid Security & Gate States (SDN Fatubai)
  const [isRuangMuridDeactivatedModalOpen, setIsRuangMuridDeactivatedModalOpen] = useState(false);
  const [isRuangMuridPasscodeModalOpen, setIsRuangMuridPasscodeModalOpen] = useState(false);
  const [isExamMonitoringModalOpen, setIsExamMonitoringModalOpen] = useState(false);
  const [isTeacherBahanAjarModalOpen, setIsTeacherBahanAjarModalOpen] = useState(false);

  const handleSwitchPortalMode = (mode: 'guru' | 'murid' | 'selection') => {
    if (mode === 'murid') {
      // Pastikan modal akses guru ditutup
      setIsAccessGateOpen(false);

      if (!isRuangMuridEnabled()) {
        setIsRuangMuridDeactivatedModalOpen(true);
        return;
      }
      if (!isStudentAuthenticatedForRuangMurid()) {
        setIsRuangMuridPasscodeModalOpen(true);
        return;
      }
      setPortalMode('murid');
      setIsRuangMuridPasscodeModalOpen(false);
      return;
    }

    if (mode === 'guru') {
      // Pastikan modal kode murid ditutup
      setIsRuangMuridPasscodeModalOpen(false);
      setIsRuangMuridDeactivatedModalOpen(false);

      // Periksa apakah sudah ada sesi aktif sebelumnya yang sah
      const code = getActiveSessionCode();
      if (code && !isDeactivatedLegacyCode(code)) {
        const rec = findAccessRecord(code);
        if (rec && (rec.isActive || rec.status === 'active')) {
          setActiveAccessRecord(rec);
          setPortalMode('guru');
          setIsAccessGateOpen(false);
          // Verifikasi ke Cloud Firestore di latar belakang agar selalu sinkron lintas perangkat
          findAccessRecordAsync(code).then((cloudRec) => {
            if (cloudRec) {
              if (!cloudRec.isActive || cloudRec.status === 'inactive') {
                setActiveAccessRecord(null);
                clearActiveSessionCode();
                setIsAccessGateOpen(true);
              } else {
                setActiveAccessRecord(cloudRec);
              }
            }
          }).catch(() => {});
          return;
        } else {
          // Jika di cache lokal belum aktif, cari langsung di Cloud Firestore
          findAccessRecordAsync(code).then((cloudRec) => {
            if (cloudRec && (cloudRec.isActive || cloudRec.status === 'active')) {
              setActiveAccessRecord(cloudRec);
              setPortalMode('guru');
              setIsAccessGateOpen(false);
            }
          }).catch(() => {});
        }
      }

      // Jika belum ada kode sesi aktif atau pengunjung baru:
      // TAMPILKAN MODAL AKSES GATE (AKUN DEMO GP-RHB1 ATAU FORMULIR PENDAFTARAN)
      // DILARANG KERAS memberikan KODE MASTER ADMIN (GP-1386) SECARA OTOMATIS!
      setActiveAccessRecord(null);
      setPortalMode('guru');
      setIsAccessGateOpen(true);
      return;
    }

    // mode === 'selection'
    setIsAccessGateOpen(false);
    setIsRuangMuridPasscodeModalOpen(false);
    setIsRuangMuridDeactivatedModalOpen(false);
    setStudentAuthenticatedForRuangMurid(false);
    setPortalMode('selection');
  };

  const handleStudentPasscodeSuccess = () => {
    setIsRuangMuridPasscodeModalOpen(false);
    setPortalMode('murid');
    setIsAccessGateOpen(false);
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isDataIntegrityModalOpen, setIsDataIntegrityModalOpen] = useState(false);
  const [isInitialCloudSyncDone, setIsInitialCloudSyncDone] = useState(false);
  const [isStudentManagerOpen, setIsStudentManagerOpen] = useState(false);
  const [isRPMConfigOpen, setIsRPMConfigOpen] = useState(false);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const [isSubjectWarningOpen, setIsSubjectWarningOpen] = useState(false);
  const [pendingSubjectFolder, setPendingSubjectFolder] = useState<SubjectFolder | null>(null);
  const [pendingTPCodesForModul, setPendingTPCodesForModul] = useState<string[]>([]);
  const [lastRPMOptions, setLastRPMOptions] = useState<Partial<RPMConfigOptions> | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setDesktopSidebarOpen((prev) => !prev);
    } else {
      setMobileSidebarOpen((prev) => !prev);
    }
  };

  // Form State initialized with permanent persistence and default SD Negeri Fatubai
  const [identitas, setIdentitas] = useState<SchoolIdentity>(() => {
    try {
      const stored = loadFromStorage<SchoolIdentity | null>(STORAGE_KEYS.IDENTITAS, null);
      if (stored) {
        // Migrasi legacy demo/dev hanya untuk akun default pengembang
        if (stored.namaSatuanPendidikan === 'UPTD SD NEGERI SASI') {
          stored.namaSatuanPendidikan = 'SD Negeri Fatubai';
        }
        if (
          stored.namaGuru === 'Haryanto Roni Bhidju, S.Pd.SD' ||
          stored.namaGuru === 'Roni Hariyanto Bhidju, S. Pd' ||
          stored.namaGuru === 'Roni Hariyanto Bhidju, S.Pd'
        ) {
          stored.namaGuru = 'Roni Hariyanto Bhidju, S.Pd';
          if (stored.nipGuru === '19880512 201402 1 002' || !stored.nipGuru) {
            stored.nipGuru = '198603012020121005';
          }
        }
        return { ...INITIAL_MATEMATIKA_IDENTITAS, ...stored };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MATEMATIKA_IDENTITAS;
  });

  const identitasRef = useRef<SchoolIdentity>(identitas);
  useEffect(() => {
    identitasRef.current = identitas;
  }, [identitas]);

  // Access Code and Google Form Security State
  const [activeAccessRecord, setActiveAccessRecord] = useState<AccessRecord | null>(() => {
    const code = getActiveSessionCode();
    if (code && !isDeactivatedLegacyCode(code)) {
      const rec = findAccessRecord(code);
      if (rec && (rec.status === 'active' || rec.isActive)) {
        return rec;
      }
    }
    // Jika tidak ada sesi valid atau kode dinonaktifkan, user wajib memasukkan kode akses
    return null;
  });
  const [isAccessGateOpen, setIsAccessGateOpen] = useState<boolean>(() => {
    // Hanya buka gate saat berada di portal guru dan belum terverifikasi
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = (urlParams.get('portal') || urlParams.get('mode') || urlParams.get('role') || '').toLowerCase();
      if (portalParam === 'murid' || portalParam === 'siswa') return false;
    } catch {}
    const code = getActiveSessionCode();
    if (!code || isDeactivatedLegacyCode(code)) return false; // Biarkan user memilih di PortalSelectionView terlebih dahulu
    const rec = findAccessRecord(code);
    return !rec || (!rec.isActive && rec.status !== 'active');
  });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isWordBlockedNoticeOpen, setIsWordBlockedNoticeOpen] = useState(false);
  const [isWordDisabledGlobal, setIsWordDisabledGlobal] = useState<boolean>(() => isWordExportDisabled());
  const [pendingAccessCount, setPendingAccessCount] = useState<number>(0);

  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);


    // 2. Sinkronkan dan dengarkan (Real-Time Listener) status kebijakan unduhan Word dari Cloud Firestore
    const unsubscribeWordPolicy = subscribeToWordExportDisabledFromFirestore((disabled) => {
      setIsWordDisabledGlobal(disabled);
    });

    // Fallback one-time fetch saat awal boot
    fetchWordExportDisabledFromFirestore()
      .then((disabled) => {
        if (disabled !== null) {
          setIsWordDisabledGlobal(disabled);
        }
      })
      .catch(() => {});


  // Selected Elements per Subject Folder with permanent persistence
  const [selectedElements, setSelectedElements] = useState<SelectedElementItem[]>(() => {
    return loadFromStorage<SelectedElementItem[]>(
      STORAGE_KEYS.SELECTED_ELEMENTS,
      INITIAL_MATEMATIKA_SELECTED_ELEMENTS
    );
  });

  const [preferensiTambahan, setPreferensiTambahan] = useState<string>(() => {
    return loadFromStorage<string>(STORAGE_KEYS.PREFERENSI, '');
  });

  // Generated Data States with permanent persistence
  const [elemenRows, setElemenRows] = useState<BedahElemenRow[]>(() => {
    const stored = loadFromStorage<BedahElemenRow[] | null>(STORAGE_KEYS.ELEMEN_ROWS, null);
    if (stored && stored.length > 0) {
      const allTPs = stored.flatMap(r => r.daftarTP || []);
      const totalJP = allTPs.reduce((a, c) => a + Number(c.alokasiJP || 0), 0);
      const bilRow = stored.find(r => r.elemen?.toLowerCase().includes('bilangan'));
      if ((bilRow && bilRow.daftarTP && bilRow.daftarTP.length <= 5) || totalJP < 300) {
        return INITIAL_MATEMATIKA_ELEMEN_ROWS;
      }
      return stored;
    }
    return INITIAL_MATEMATIKA_ELEMEN_ROWS;
  });

  const [tpList, setTpList] = useState<TPItem[]>(() => {
    const storedIdentitas = loadFromStorage<SchoolIdentity | null>(STORAGE_KEYS.IDENTITAS, null);
    const activeMapel = storedIdentitas?.mataPelajaran || 'Matematika';
    const stored = loadFromStorage<TPItem[] | null>(STORAGE_KEYS.TP_LIST, null);

    if (stored && stored.length > 0 && isTPListValidForSubject(stored, activeMapel)) {
      if (activeMapel === 'Matematika') {
        const totalJP = stored.reduce((a, c) => a + Number(c.alokasiJP || 0), 0);
        if (stored.length <= 20 || totalJP < 300) {
          return INITIAL_MATEMATIKA_TP_LIST;
        }
      }
      return stored;
    }

    if (activeMapel !== 'Matematika') {
      const ws = getOrInitSubjectWorkspace(
        activeMapel,
        storedIdentitas?.fase || 'Fase C',
        storedIdentitas?.kelas || '5',
        storedIdentitas || undefined
      );
      if (ws && ws.tpList && ws.tpList.length > 0) {
        return ws.tpList;
      }
    }
    return INITIAL_MATEMATIKA_TP_LIST;
  });

  const [rasionalAnalisis, setRasionalAnalisis] = useState<string>(() => {
    return loadFromStorage<string>(
      STORAGE_KEYS.RASIONAL,
      INITIAL_MATEMATIKA_RASIONAL
    );
  });

  const [atpDocument, setAtpDocument] = useState<ATPDocument | null>(() => {
    const stored = loadFromStorage<ATPDocument | null>(STORAGE_KEYS.ATP_DOC, null);
    if (stored && stored.atpList) {
      const totalJP = stored.atpList.reduce((a, c) => a + Number(c.alokasiJP || 0), 0);
      if (stored.atpList.length <= 20 || totalJP < 300) {
        return INITIAL_MATEMATIKA_ATP_DOCUMENT;
      }
      return stored;
    }
    return INITIAL_MATEMATIKA_ATP_DOCUMENT;
  });

  const [kktpDocument, setKktpDocument] = useState<KKTPDocument | null>(() => {
    const stored = loadFromStorage<KKTPDocument | null>(STORAGE_KEYS.KKTP_DOC, null);
    if (stored && stored.kktpList && stored.kktpList.length <= 20) {
      return INITIAL_MATEMATIKA_KKTP_DOCUMENT;
    }
    return stored || INITIAL_MATEMATIKA_KKTP_DOCUMENT;
  });

  const [modulAjarDocument, setModulAjarDocument] = useState<ModulAjarDocument | null>(() => {
    const stored = loadFromStorage<ModulAjarDocument | null>(STORAGE_KEYS.MODUL_DOC, null);
    if (stored) return stored;
    try {
      return buildDefaultModulAjarFromTP(
        INITIAL_MATEMATIKA_IDENTITAS,
        INITIAL_MATEMATIKA_TP_LIST,
        INITIAL_MATEMATIKA_ATP_DOCUMENT
      );
    } catch (e) {
      return null;
    }
  });

  const [protaDocument, setProtaDocument] = useState<ProtaDocument | null>(() => {
    const stored = loadFromStorage<ProtaDocument | null>(STORAGE_KEYS.PROTA_DOC, null);
    if (stored && stored.itemsSemester1 && stored.itemsSemester1.length > 0) {
      return stored;
    }
    try {
      return buildProtaDocumentFromTP(
        INITIAL_MATEMATIKA_IDENTITAS,
        INITIAL_MATEMATIKA_TP_LIST,
        INITIAL_MATEMATIKA_ATP_DOCUMENT
      );
    } catch (e) {
      return null;
    }
  });

  const [promesDocument, setPromesDocument] = useState<PromesDocument | null>(() => {
    const stored = loadFromStorage<PromesDocument | null>(STORAGE_KEYS.PROMES_DOC, null);
    if (stored && stored.semester1 && stored.semester1.rows.length > 0) {
      return stored;
    }
    try {
      return buildPromesDocumentFromTP(
        INITIAL_MATEMATIKA_IDENTITAS,
        INITIAL_MATEMATIKA_TP_LIST,
        INITIAL_MATEMATIKA_ATP_DOCUMENT
      );
    } catch (e) {
      return null;
    }
  });

  const [soalDocument, setSoalDocument] = useState<KisiKisiSoalDocument | null>(() => {
    const stored = loadFromStorage<KisiKisiSoalDocument | null>(STORAGE_KEYS.SOAL_DOC, null);
    if (stored) return stored;
    try {
      const cfg = getDefaultKonfigurasiSoal(
        'Ulangan Harian',
        INITIAL_MATEMATIKA_IDENTITAS,
        INITIAL_MATEMATIKA_TP_LIST
      );
      return generateKisiKisiDanNaskahSoal(
        INITIAL_MATEMATIKA_IDENTITAS,
        INITIAL_MATEMATIKA_TP_LIST,
        INITIAL_MATEMATIKA_ATP_DOCUMENT,
        cfg
      );
    } catch (e) {
      return null;
    }
  });

  // Loading & Error States
  const [isLoadingTP, setIsLoadingTP] = useState<boolean>(false);
  const [isLoadingATP, setIsLoadingATP] = useState<boolean>(false);
  const [isLoadingKKTP, setIsLoadingKKTP] = useState<boolean>(false);
  const [isLoadingModul, setIsLoadingModul] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History Library with persistence
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    return loadFromStorage<SavedItem[]>(STORAGE_KEYS.SAVED_ITEMS, []);
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    return loadFromStorage<string | null>(STORAGE_KEYS.LAST_SAVED, null);
  });

  // --- AUTOMATIC PERSISTENCE HOOKS (Kebal Refresh & Laptop Mati) ---
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.IDENTITAS, identitas);
    setLastSavedTime(new Date().toISOString());
  }, [identitas]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TAB, currentTab);
  }, [currentTab]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_ELEMENTS, selectedElements);
    setLastSavedTime(new Date().toISOString());
  }, [selectedElements]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PREFERENSI, preferensiTambahan);
  }, [preferensiTambahan]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ELEMEN_ROWS, elemenRows);
    setLastSavedTime(new Date().toISOString());
  }, [elemenRows]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TP_LIST, tpList);
    setLastSavedTime(new Date().toISOString());
  }, [tpList]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RASIONAL, rasionalAnalisis);
  }, [rasionalAnalisis]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ATP_DOC, atpDocument);
    setLastSavedTime(new Date().toISOString());
  }, [atpDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.KKTP_DOC, kktpDocument);
    setLastSavedTime(new Date().toISOString());
  }, [kktpDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MODUL_DOC, modulAjarDocument);
    setLastSavedTime(new Date().toISOString());
  }, [modulAjarDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROTA_DOC, protaDocument);
    setLastSavedTime(new Date().toISOString());
  }, [protaDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROMES_DOC, promesDocument);
    setLastSavedTime(new Date().toISOString());
  }, [promesDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SOAL_DOC, soalDocument);
    setLastSavedTime(new Date().toISOString());
  }, [soalDocument]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVED_ITEMS, savedItems);
  }, [savedItems]);

  // Auto-save current subject workspace to subject-isolated storage
  useEffect(() => {
    if (identitas.mataPelajaran) {
      if (tpList.length === 0 || isTPListValidForSubject(tpList, identitas.mataPelajaran)) {
        saveSubjectWorkspace({
          mataPelajaran: identitas.mataPelajaran,
          fase: identitas.fase || 'Fase C',
          kelas: identitas.kelas || '5',
          identitas,
          selectedElements,
          preferensiTambahan,
          elemenRows,
          tpList,
          rasionalAnalisis,
          atpDocument,
          kktpDocument,
          protaDocument,
          promesDocument,
          modulAjarDocument,
          soalDocument,
        });
      }
    }
  }, [
    identitas,
    selectedElements,
    preferensiTambahan,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument,
    kktpDocument,
    protaDocument,
    promesDocument,
    modulAjarDocument,
    soalDocument,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Dedicated workspace loader into active React state
  const loadWorkspaceIntoState = useCallback((ws: SubjectWorkspace) => {
    if (!ws) return;
    setIdentitas((prev) => {
      const cleanPrevKelas = String(prev.kelas || '').replace(/[^0-9]/g, '');
      const cleanWsKelas = String(ws.kelas || ws.identitas?.kelas || '').replace(/[^0-9]/g, '');
      const finalKelas = (prev.fase === ws.fase && cleanPrevKelas) ? cleanPrevKelas : (cleanWsKelas || '5');
      return {
        ...ws.identitas,
        ...prev,
        mataPelajaran: ws.mataPelajaran,
        fase: ws.fase,
        kelas: finalKelas,
      };
    });
    setSelectedElements(ws.selectedElements || []);
    setPreferensiTambahan(ws.preferensiTambahan || '');
    setElemenRows(ws.elemenRows || []);
    setTpList(ws.tpList || []);
    setRasionalAnalisis(ws.rasionalAnalisis || '');
    setAtpDocument(ws.atpDocument || null);
    setKktpDocument(ws.kktpDocument || null);
    setProtaDocument(ws.protaDocument || null);
    setPromesDocument(ws.promesDocument || null);
    setModulAjarDocument(ws.modulAjarDocument || null);
    setSoalDocument(ws.soalDocument || null);
  }, []);

  // Synchronize state if active subject does not match active tpList
  useEffect(() => {
    if (identitas.mataPelajaran && tpList.length > 0) {
      if (!isTPListValidForSubject(tpList, identitas.mataPelajaran)) {
        console.warn(
          `[App] State out of sync: TP list does not match ${identitas.mataPelajaran}. Auto-loading authentic workspace.`
        );
        const ws = getOrInitSubjectWorkspace(
          identitas.mataPelajaran,
          identitas.fase || 'Fase C',
          identitas.kelas || '5',
          identitas
        );
        loadWorkspaceIntoState(ws);
      }
    }
  }, [identitas.mataPelajaran, loadWorkspaceIntoState]);

  // Handle switching to another Subject Folder without losing progress
  const handleSelectSubject = (folder: SubjectFolder) => {
    const allowedFase = getAllowedFaseForRecord(activeAccessRecord);
    if (allowedFase !== 'ALL' && folder.fase !== allowedFase) {
      showToast(`Fase ${folder.fase} terkunci. Akun Anda terdaftar khusus untuk ${allowedFase}.`);
      return;
    }

    if (!isSubjectAllowedForRecord(folder.mataPelajaran, activeAccessRecord)) {
      showToast(
        `Mata Pelajaran "${folder.mataPelajaran}" terkunci. Akun Anda terdaftar khusus untuk ${activeAccessRecord?.mataPelajaran || 'Mata Pelajaran Tertentu'}.`
      );
      return;
    }

    // If target is already active subject, close picker and done
    if (
      (identitas.mataPelajaran || '').toLowerCase().trim() === (folder.mataPelajaran || '').toLowerCase().trim() &&
      (identitas.fase || '').toLowerCase().trim() === (folder.fase || '').toLowerCase().trim()
    ) {
      setIsSubjectPickerOpen(false);
      return;
    }

    // Save current subject workspace first
    saveSubjectWorkspace({
      mataPelajaran: identitas.mataPelajaran,
      fase: identitas.fase || 'Fase C',
      kelas: identitas.kelas || '5',
      identitas,
      selectedElements,
      preferensiTambahan,
      elemenRows,
      tpList,
      rasionalAnalisis,
      atpDocument,
      kktpDocument,
      protaDocument,
      promesDocument,
      modulAjarDocument,
      soalDocument,
    });

    // Load or initialize target subject workspace with current active class if phase matches
    const targetClassToUse = (identitas.fase === folder.fase && identitas.kelas) ? identitas.kelas : folder.kelas;
    const ws = getOrInitSubjectWorkspace(folder.mataPelajaran, folder.fase, targetClassToUse, identitas);
    loadWorkspaceIntoState(ws);
    setIsSubjectPickerOpen(false);
    showToast(
      `Beralih ke ${folder.mataPelajaran} (${folder.fase}). Seluruh TP, ATP, KKTP, PROTA & PROMES siap digunakan!`
    );
  };

  // User confirmed in Warning Modal: Start Analysis for unanalyzed subject
  const handleConfirmStartAnalysis = () => {
    if (!pendingSubjectFolder) return;
    const folder = pendingSubjectFolder;

    // Save current subject workspace first
    saveSubjectWorkspace({
      mataPelajaran: identitas.mataPelajaran,
      fase: identitas.fase || 'Fase C',
      kelas: identitas.kelas || '5',
      identitas,
      selectedElements,
      preferensiTambahan,
      elemenRows,
      tpList,
      rasionalAnalisis,
      atpDocument,
      kktpDocument,
      protaDocument,
      promesDocument,
      modulAjarDocument,
      soalDocument,
    });

    let newKelas = String(identitas.kelas || '').replace(/[^0-9]/g, '');
    if (folder.fase === 'Fase A' && !['1', '2'].includes(newKelas)) newKelas = '1';
    if (folder.fase === 'Fase B' && !['3', '4'].includes(newKelas)) newKelas = '3';
    if (folder.fase === 'Fase C' && !['5', '6'].includes(newKelas)) newKelas = '5';

    const alloc = getPermen13Allocation(folder.mataPelajaran, folder.fase, newKelas);

    // Set new subject in identitas
    setIdentitas({
      ...identitas,
      mataPelajaran: folder.mataPelajaran,
      fase: folder.fase,
      kelas: newKelas,
      alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
    });

    // Populate official elements so teacher can analyze CP
    const newElements: SelectedElementItem[] = folder.elemenList.map((el) => ({
      id: el.id,
      elemen: el.elemen,
      capaianPembelajaran: el.capaianPembelajaran,
      deskripsiSingkat: el.deskripsiSingkat,
      isSelected: true,
    }));
    setSelectedElements(newElements);

    // Clear working drafts for this fresh unanalyzed subject
    setElemenRows([]);
    setTpList([]);
    setRasionalAnalisis('');
    setAtpDocument(null);
    setKktpDocument(null);
    setProtaDocument(null);
    setPromesDocument(null);
    setModulAjarDocument(null);
    setSoalDocument(null);

    // Close modals
    setIsSubjectWarningOpen(false);
    setIsRPMConfigOpen(false);
    setPendingSubjectFolder(null);

    // Navigate to Input CP tab so teacher can run "Analisis CP Seluruh Elemen"
    setCurrentTab('input');
    showToast(
      `Mata Pelajaran ${folder.mataPelajaran} aktif. Silakan klik 'Analisis CP Seluruh Elemen' untuk menghasilkan TP & ATP!`
    );
  };

  // User cancelled in Warning Modal: keep current subject & state
  const handleCancelSubjectSwitch = () => {
    setIsSubjectWarningOpen(false);
    setPendingSubjectFolder(null);
  };

  // Immediate synchronization handler for any identity updates (from Form or Modal)
  const handleIdentitasChange = (newIdentitas: SchoolIdentity) => {
    const prevMapel = (identitas.mataPelajaran || '').trim().toLowerCase();
    const nextMapel = (newIdentitas.mataPelajaran || '').trim().toLowerCase();

    // If subject changed, switch workspace automatically so TP and curriculum match
    if (nextMapel && prevMapel && nextMapel !== prevMapel) {
      saveSubjectWorkspace({
        mataPelajaran: identitas.mataPelajaran,
        fase: identitas.fase || 'Fase C',
        kelas: identitas.kelas || '5',
        identitas,
        selectedElements,
        preferensiTambahan,
        elemenRows,
        tpList,
        rasionalAnalisis,
        atpDocument,
        kktpDocument,
        protaDocument,
        promesDocument,
        modulAjarDocument,
        soalDocument,
      });

      const ws = getOrInitSubjectWorkspace(
        newIdentitas.mataPelajaran,
        newIdentitas.fase || identitas.fase || 'Fase C',
        newIdentitas.kelas || identitas.kelas || '5',
        newIdentitas
      );
      loadWorkspaceIntoState(ws);
      return;
    }

    setIdentitas(newIdentitas);
  };

  const handleUpdateIdentitas = async (newIdentitas: SchoolIdentity) => {
    handleIdentitasChange(newIdentitas);

    // 1. Sinkronkan secara instan ke seluruh dokumen aktif di memori
    setAtpDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));
    setKktpDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));
    setProtaDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));
    setPromesDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));
    setModulAjarDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));
    setSoalDocument((prev) => (prev ? { ...prev, identitas: { ...prev.identitas, ...newIdentitas } } : null));

    // 2. Simpan permanen ke subject workspace lokal
    try {
      saveSubjectWorkspace({
        mataPelajaran: newIdentitas.mataPelajaran || identitas.mataPelajaran || 'Matematika',
        fase: newIdentitas.fase || identitas.fase || 'Fase C',
        kelas: newIdentitas.kelas || identitas.kelas || '5',
        identitas: newIdentitas,
        selectedElements,
        preferensiTambahan,
        elemenRows,
        tpList,
        rasionalAnalisis,
        atpDocument: atpDocument ? { ...atpDocument, identitas: { ...atpDocument.identitas, ...newIdentitas } } : null,
        kktpDocument: kktpDocument ? { ...kktpDocument, identitas: { ...kktpDocument.identitas, ...newIdentitas } } : null,
        protaDocument: protaDocument ? { ...protaDocument, identitas: { ...protaDocument.identitas, ...newIdentitas } } : null,
        promesDocument: promesDocument ? { ...promesDocument, identitas: { ...promesDocument.identitas, ...newIdentitas } } : null,
        modulAjarDocument: modulAjarDocument ? { ...modulAjarDocument, identitas: { ...modulAjarDocument.identitas, ...newIdentitas } } : null,
        soalDocument: soalDocument ? { ...soalDocument, identitas: { ...soalDocument.identitas, ...newIdentitas } } : null,
      });
      saveToStorage(STORAGE_KEYS.IDENTITAS, newIdentitas);
    } catch (e) {
      console.warn('Gagal menyimpan workspace lokal setelah update identitas:', e);
    }

    // 3. Sinkronisasi permanen ke Cloud Firestore
    if (activeAccessRecord && !isDeactivatedLegacyCode(activeAccessRecord.kodeAkses)) {
      try {
        await updateUserWorkspaceIdentityInFirestore(activeAccessRecord.kodeAkses, newIdentitas);
        const res = await updateAccessRecordAsync(activeAccessRecord.kodeAkses, {
          namaGuru: newIdentitas.namaGuru,
          nipGuru: newIdentitas.nipGuru || '-',
          namaSekolah: newIdentitas.namaSatuanPendidikan,
          namaSatuanPendidikan: newIdentitas.namaSatuanPendidikan,
          namaKepalaSekolah: newIdentitas.namaKepalaSekolah || '-',
          nipKepalaSekolah: newIdentitas.nipKepalaSekolah || '-',
          fase: newIdentitas.fase,
          kelas: newIdentitas.kelas,
          alamatInstansi: newIdentitas.alamatInstansi,
          tempatPenetapan: newIdentitas.tempatPenetapan,
          tahunPelajaran: newIdentitas.tahunPelajaran,
          semester: newIdentitas.semester,
          kopBaris1: newIdentitas.kopBaris1,
          kopBaris2: newIdentitas.kopBaris2,
          kopBaris3: newIdentitas.kopBaris3,
          kopBaris4: newIdentitas.kopBaris4,
          logoUrl: newIdentitas.logoUrl,
        });
        if (res.success && res.record) {
          setActiveAccessRecord(res.record);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi data profil gawai ke cloud:', err);
      }
    }
    showToast('Profil Sekolah & Guru berhasil diperbarui! Seluruh dokumen resmi otomatis disinkronkan.');
  };

  // Muat data pekerjaan dari Firebase Cloud Firestore jika ada
  const syncUserWorkspaceFromCloud = useCallback(async (kodeAkses: string) => {
    if (!kodeAkses || isDeactivatedLegacyCode(kodeAkses)) {
      setIsInitialCloudSyncDone(true);
      return;
    }
    setIsSyncingWithCloud(true);
    try {
      const cloudData = await loadUserWorkspaceFromFirestore(kodeAkses);
      if (cloudData) {
        const mainId = cloudData.identitas;
        if (mainId && mainId.namaGuru) {
          // MIGRASI IDENTITAS SEBELUM LOAD: Cegah data lama (seperti kelas usang) muncul kembali saat halaman direfresh
          if (cloudData.currentDrafts) {
            const d = cloudData.currentDrafts;
            if (d.atpDocument) d.atpDocument.identitas = { ...d.atpDocument.identitas, ...mainId };
            if (d.kktpDocument) d.kktpDocument.identitas = { ...d.kktpDocument.identitas, ...mainId };
            if (d.protaDocument) d.protaDocument.identitas = { ...d.protaDocument.identitas, ...mainId };
            if (d.promesDocument) d.promesDocument.identitas = { ...d.promesDocument.identitas, ...mainId };
            if (d.modulAjarDocument) d.modulAjarDocument.identitas = { ...d.modulAjarDocument.identitas, ...mainId };
            if (d.soalDocument) d.soalDocument.identitas = { ...d.soalDocument.identitas, ...mainId };
          }
          if (cloudData.workspaces) {
            Object.keys(cloudData.workspaces).forEach((key) => {
              const ws = cloudData.workspaces[key];
              if (ws) {
                ws.identitas = { ...ws.identitas, ...mainId };
                ws.kelas = mainId.kelas || ws.kelas;
                ws.fase = mainId.fase || ws.fase;
                if (ws.atpDocument) ws.atpDocument.identitas = { ...ws.atpDocument.identitas, ...mainId };
                if (ws.kktpDocument) ws.kktpDocument.identitas = { ...ws.kktpDocument.identitas, ...mainId };
                if (ws.protaDocument) ws.protaDocument.identitas = { ...ws.protaDocument.identitas, ...mainId };
                if (ws.promesDocument) ws.promesDocument.identitas = { ...ws.promesDocument.identitas, ...mainId };
                if (ws.modulAjarDocument) ws.modulAjarDocument.identitas = { ...ws.modulAjarDocument.identitas, ...mainId };
                if (ws.soalDocument) ws.soalDocument.identitas = { ...ws.soalDocument.identitas, ...mainId };
              }
            });
          }
        }

        applyCloudWorkspaceToLocalStorage(cloudData);
        if (cloudData.identitas) {
          setIdentitas(cloudData.identitas);
        }
        if (cloudData.currentDrafts) {
          const d = cloudData.currentDrafts;
          if (d.tpList && d.tpList.length > 0) setTpList(d.tpList);
          if (d.elemenRows && d.elemenRows.length > 0) setElemenRows(d.elemenRows);
          if (d.selectedElements && d.selectedElements.length > 0) setSelectedElements(d.selectedElements);
          if (d.rasionalAnalisis) setRasionalAnalisis(d.rasionalAnalisis);
          if (d.atpDocument) setAtpDocument(d.atpDocument);
          if (d.kktpDocument) setKktpDocument(d.kktpDocument);
          if (d.protaDocument) setProtaDocument(d.protaDocument);
          if (d.promesDocument) setPromesDocument(d.promesDocument);
          if (d.modulAjarDocument) setModulAjarDocument(d.modulAjarDocument);
          if (d.preferensiTambahan !== undefined) setPreferensiTambahan(d.preferensiTambahan);
          if (d.activeTab) setCurrentTab(d.activeTab as any);
        }
        if (cloudData.savedItems && Array.isArray(cloudData.savedItems) && cloudData.savedItems.length > 0) {
          setSavedItems(cloudData.savedItems);
          saveToStorage(STORAGE_KEYS.SAVED_ITEMS, cloudData.savedItems);
        }
        if (cloudData.students && Array.isArray(cloudData.students) && cloudData.students.length > 0) {
          saveStudentList(cloudData.students);
        }
        showToast(`☁️ Sinkronisasi berhasil! Dokumen pekerjaan untuk kode ${kodeAkses} telah dimuat dari Cloud Firestore.`);
      }
    } catch (e) {
      console.warn('Gagal sinkron data dari Cloud:', e);
    } finally {
      setIsSyncingWithCloud(false);
      setIsInitialCloudSyncDone(true);
    }
  }, [showToast]);

  // Simpan seluruh data pekerjaan saat ini ke Firebase Cloud Firestore
  const saveCurrentWorkspaceToCloud = useCallback(async (targetCode?: string): Promise<boolean> => {
    const code = targetCode || activeAccessRecord?.kodeAkses;
    if (!code || isDeactivatedLegacyCode(code)) return false;
    const workspaces = getAllSubjectWorkspaces();
    return await saveUserWorkspaceToFirestore(code, {
      identitas,
      workspaces,
      activeWorkspaceKey: makeSubjectKey(identitas.mataPelajaran, identitas.fase),
      savedItems,
      students: getStudentList(),
      currentDrafts: {
        tpList,
        elemenRows,
        selectedElements,
        rasionalAnalisis,
        atpDocument,
        kktpDocument,
        protaDocument,
        promesDocument,
        modulAjarDocument,
        soalDocument,
        preferensiTambahan,
        activeTab: currentTab,
      },
    });
  }, [
    activeAccessRecord,
    identitas,
    savedItems,
    tpList,
    elemenRows,
    selectedElements,
    rasionalAnalisis,
    atpDocument,
    kktpDocument,
    protaDocument,
    promesDocument,
    modulAjarDocument,
    soalDocument,
    preferensiTambahan,
    currentTab,
  ]);

  const handleManualCloudSync = async () => {
    if (!activeAccessRecord?.kodeAkses) {
      showToast('⚠️ Silakan masuk dengan kode akses Anda terlebih dahulu.');
      return;
    }
    setIsSyncingWithCloud(true);
    const success = await saveCurrentWorkspaceToCloud();
    setIsSyncingWithCloud(false);
    if (success !== false) {
      showToast('☁️ Seluruh data & dokumen pekerjaan Anda berhasil tersimpan permanen di Firebase Cloud!');
    }
  };

  // Muat data cloud pada pembukaan awal jika pengguna sudah memiliki sesi login aktif
  useEffect(() => {
    if (activeAccessRecord?.kodeAkses && !isDeactivatedLegacyCode(activeAccessRecord.kodeAkses)) {
      syncUserWorkspaceFromCloud(activeAccessRecord.kodeAkses);
    } else {
      setIsInitialCloudSyncDone(true);
    }
  }, []);

  // Auto-sync debounced (3.5 detik) ke Cloud Firestore saat terjadi modifikasi pekerjaan
  useEffect(() => {
    // Keutuhan data: Jangan pernah auto-sync sebelum sinkronisasi awal selesai!
    if (!isInitialCloudSyncDone) {
      return;
    }
    if (!activeAccessRecord?.kodeAkses || isDeactivatedLegacyCode(activeAccessRecord.kodeAkses)) {
      return;
    }
    const timer = setTimeout(() => {
      saveCurrentWorkspaceToCloud();
    }, 3500);
    return () => clearTimeout(timer);
  }, [
    isInitialCloudSyncDone,
    activeAccessRecord?.kodeAkses,
    identitas,
    tpList,
    elemenRows,
    selectedElements,
    rasionalAnalisis,
    atpDocument,
    kktpDocument,
    protaDocument,
    promesDocument,
    modulAjarDocument,
    preferensiTambahan,
    currentTab,
    saveCurrentWorkspaceToCloud,
  ]);

  // Enforce locked identity whenever active access record is set or changed
  const handleApplyAccessRecord = async (record: AccessRecord) => {
    setActiveAccessRecord(record);
    setActiveSessionCode(record.kodeAkses);
    const updatedId = convertAccessRecordToIdentity(record, identitas);
    handleIdentitasChange(updatedId);
    showToast(`Kode Akses ${record.kodeAkses} aktif! Identitas tersinkronisasi.`);
    await syncUserWorkspaceFromCloud(record.kodeAkses);
  };

  // Real-time Listener Lintas Perangkat: Mendeteksi seketika perubahan dari Cloud Firestore
  // (misalnya saat Admin mengaktifkan/menonaktifkan atau mengedit data user dari perangkat Admin)
  useEffect(() => {
    if (!activeAccessRecord?.kodeAkses) return;
    const currentCode = activeAccessRecord.kodeAkses.toUpperCase().trim();
    if (isMasterAccessCode(currentCode)) return;

    const unsubscribe = subscribeToSingleAccessCode(currentCode, (cloudRecord) => {
      if (!cloudRecord) return;

      // 1. Jika akun dinonaktifkan oleh Admin dari perangkat lain
      if (!cloudRecord.isActive || cloudRecord.status === 'inactive') {
        setActiveAccessRecord(null);
        clearActiveSessionCode();
        setIsAccessGateOpen(true);
        showToast(`Kode akses ${currentCode} telah dinonaktifkan oleh Administrator.`);
        return;
      }

      // 2. Periksa apakah Admin melakukan perubahan identitas
      const currentId = identitasRef.current;
      const updatedIdentity = convertAccessRecordToIdentity(cloudRecord, currentId);
      const isChanged =
        (currentId.namaSatuanPendidikan || '').toLowerCase().trim() !== (updatedIdentity.namaSatuanPendidikan || '').toLowerCase().trim() ||
        (currentId.namaGuru || '').toLowerCase().trim() !== (updatedIdentity.namaGuru || '').toLowerCase().trim() ||
        currentId.nipGuru !== updatedIdentity.nipGuru ||
        (currentId.namaKepalaSekolah || '').toLowerCase().trim() !== (updatedIdentity.namaKepalaSekolah || '').toLowerCase().trim() ||
        currentId.nipKepalaSekolah !== updatedIdentity.nipKepalaSekolah ||
        currentId.fase !== updatedIdentity.fase;

      if (isChanged) {
        // Pertahankan kelas aktif yang dipilih jika fasenya sama
        if (currentId.fase === updatedIdentity.fase && currentId.kelas) {
          updatedIdentity.kelas = currentId.kelas;
        }
        setActiveAccessRecord(cloudRecord);
        handleUpdateIdentitas(updatedIdentity);
        showToast(`⚡ Pembaruan identitas dari Admin telah diterapkan ke seluruh dokumen Anda secara real-time.`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeAccessRecord?.kodeAkses]);

  // Synchronize TP edits to tpList, elemenRows, and kktpDocument for complete referential integrity
  const handleUpdateTPList = (updatedTPs: TPItem[]) => {
    setTpList(updatedTPs);
    setElemenRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        daftarTP: updatedTPs.filter(
          (tp) => (tp.elemen || '').toLowerCase().trim() === (row.elemen || '').toLowerCase().trim()
        ),
      }))
    );
    // Keep KKTP linked directly to updated TPs
    if (kktpDocument) {
      setKktpDocument(buildKKTPDocumentFromTP(identitas, updatedTPs, atpDocument));
    }
  };

  // Reset to initial clean state with explicit confirmation to protect data integrity
  const handleResetToDefault = () => {
    const confirmReset = window.confirm(
      '⚠️ PERINGATAN KEUTUHAN DATA:\nApakah Anda yakin ingin mengatur ulang draf kerja aktif ke contoh awal Matematika Fase C?\n\nCadangan darurat otomatis akan dibuat sebelum draf direset.'
    );
    if (!confirmReset) return;

    // Jaga keutuhan data: Buat cadangan darurat sebelum reset
    createEmergencyBackupBeforeReset();

    clearWorkingDrafts(true);
    setSelectedElements(INITIAL_MATEMATIKA_SELECTED_ELEMENTS);
    setPreferensiTambahan('');
    setElemenRows(INITIAL_MATEMATIKA_ELEMEN_ROWS);
    setTpList(INITIAL_MATEMATIKA_TP_LIST);
    setRasionalAnalisis(INITIAL_MATEMATIKA_RASIONAL);
    setAtpDocument(INITIAL_MATEMATIKA_ATP_DOCUMENT);
    setKktpDocument(INITIAL_MATEMATIKA_KKTP_DOCUMENT);
    setProtaDocument(null);
    setPromesDocument(null);
    setModulAjarDocument(null);
    setSoalDocument(null);
    setCurrentTab('tp');
    showToast('Draf diatur ulang. Cadangan darurat pra-reset berhasil disimpan & dapat dipulihkan kapan saja.');
  };

  // Restore workspace from validated JSON backup file
  const handleRestoreFromBackup = (data: any) => {
    try {
      if (data.identitas) {
        setIdentitas(data.identitas);
        saveToStorage(STORAGE_KEYS.IDENTITAS, data.identitas);
      }
      if (data.selectedElements) {
        setSelectedElements(data.selectedElements);
        saveToStorage(STORAGE_KEYS.SELECTED_ELEMENTS, data.selectedElements);
      }
      if (data.preferensiTambahan !== undefined) {
        setPreferensiTambahan(data.preferensiTambahan);
        saveToStorage(STORAGE_KEYS.PREFERENSI, data.preferensiTambahan);
      }
      if (data.elemenRows) {
        setElemenRows(data.elemenRows);
        saveToStorage(STORAGE_KEYS.ELEMEN_ROWS, data.elemenRows);
      }
      if (data.tpList) {
        setTpList(data.tpList);
        saveToStorage(STORAGE_KEYS.TP_LIST, data.tpList);
      }
      if (data.rasionalAnalisis !== undefined) {
        setRasionalAnalisis(data.rasionalAnalisis);
        saveToStorage(STORAGE_KEYS.RASIONAL, data.rasionalAnalisis);
      }
      if (data.atpDocument) {
        setAtpDocument(data.atpDocument);
        saveToStorage(STORAGE_KEYS.ATP_DOC, data.atpDocument);
      }
      if (data.kktpDocument) {
        setKktpDocument(data.kktpDocument);
        saveToStorage(STORAGE_KEYS.KKTP_DOC, data.kktpDocument);
      }
      if (data.protaDocument) {
        setProtaDocument(data.protaDocument);
        saveToStorage(STORAGE_KEYS.PROTA_DOC, data.protaDocument);
      }
      if (data.promesDocument) {
        setPromesDocument(data.promesDocument);
        saveToStorage(STORAGE_KEYS.PROMES_DOC, data.promesDocument);
      }
      if (data.modulAjarDocument) {
        setModulAjarDocument(data.modulAjarDocument);
        saveToStorage(STORAGE_KEYS.MODUL_DOC, data.modulAjarDocument);
      }
      if (data.soalDocument) {
        setSoalDocument(data.soalDocument);
        saveToStorage(STORAGE_KEYS.SOAL_DOC, data.soalDocument);
      }
      if (data.savedItems && Array.isArray(data.savedItems)) {
        setSavedItems(data.savedItems);
        saveToStorage(STORAGE_KEYS.SAVED_ITEMS, data.savedItems);
      }
      if (data.workspaces && typeof data.workspaces === 'object') {
        saveAllSubjectWorkspaces(data.workspaces);
      }
      if (data.students && Array.isArray(data.students)) {
        saveStudentList(data.students);
      }
      if (data.activeTab) {
        setCurrentTab(data.activeTab);
      }
      createAutoSnapshot('Dipulihkan dari Cadangan Data');
      showToast('Data perangkat ajar & arsip berhasil dipulihkan secara utuh dari cadangan!');
    } catch (err) {
      console.error('Gagal memulihkan cadangan:', err);
      showToast('Terjadi kendala saat menerapkan data cadangan.');
    }
  };

  // Step 1: Generate TP from Multi-Element CP Batch
  const handleGenerateTP = async () => {
    const activeSelected = selectedElements.filter((e) => e.isSelected && e.capaianPembelajaran.trim());
    if (activeSelected.length === 0) {
      setErrorMessage('Pilih minimal satu elemen dan pastikan teks Capaian Pembelajaran tidak kosong.');
      return;
    }

    setErrorMessage(null);
    setIsLoadingTP(true);

    try {
      const {
        elemenRows: returnedRowsRaw,
        daftarTP: allTPsRaw,
        rasionalAnalisis: rasionalText,
        isClientFallback,
      } = await clientGenerateTP(identitas, activeSelected, preferensiTambahan);

      // Process elemenRows
      const returnedRows: BedahElemenRow[] = (returnedRowsRaw || []).map((row: any, rIdx: number) => ({
        id: row.id || `row-${rIdx + 1}`,
        elemen: row.elemen || `Elemen ${rIdx + 1}`,
        capaianPembelajaran: row.capaianPembelajaran || '',
        daftarKompetensi: row.daftarKompetensi || [],
        daftarLingkupMateri: row.daftarLingkupMateri || [],
        daftarTP: (row.daftarTP || []).map((tp: any, tIdx: number) => ({
          id: tp.id || `tp-${rIdx + 1}-${tIdx + 1}-${Date.now()}`,
          kodeTP: tp.kodeTP || `${rIdx + 1}.${tIdx + 1}`,
          elemen: row.elemen || tp.elemen,
          kalimatCP: row.capaianPembelajaran || tp.kalimatCP,
          kompetensi: tp.kompetensi || 'Memahami',
          lingkupMateri: tp.lingkupMateri || 'Materi Pokok',
          rumusanTP: tp.rumusanTP || 'Peserta didik mampu...',
          indikatorKetercapaian: tp.indikatorKetercapaian || '',
          alokasiJP: tp.alokasiJP || 4,
          dimensiP3: tp.dimensiP3 || ['Bernalar Kritis', 'Mandiri'],
          semesterTarget: tp.semesterTarget || 'Semester 1',
          kelasTarget: tp.kelasTarget || (identitas.fase === 'Fase A' ? '1' : identitas.fase === 'Fase B' ? '3' : '5'),
          kelasCentang: tp.kelasCentang || [tp.kelasTarget || (identitas.fase === 'Fase A' ? '1' : identitas.fase === 'Fase B' ? '3' : '5')],
          urutanAlur: tp.urutanAlur || tIdx + 1,
        })),
      }));

      // Flatten all TPs for consolidated workflow
      const allTPs: TPItem[] = (allTPsRaw && allTPsRaw.length > 0) ? allTPsRaw : returnedRows.flatMap((r) => r.daftarTP);

      setElemenRows(returnedRows);
      setTpList(allTPs);
      setRasionalAnalisis(rasionalText || '');
      // Synchronize KKTP directly to new TP list
      const initialKKTP = buildKKTPDocumentFromTP(identitas, allTPs, null);
      setKktpDocument(initialKKTP);
      setCurrentTab('tp');
      if (isClientFallback) {
        showToast(`Berhasil menganalisis ${returnedRows.length} elemen (${allTPs.length} butir TP) via Standar Pedagogis!`);
      } else {
        showToast(`Berhasil menganalisis ${returnedRows.length} elemen (${allTPs.length} butir TP) mata pelajaran!`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsLoadingTP(false);
    }
  };

  // Step 2: Generate Complete 8-Section ATP (A to H)
  const handleGenerateATP = async () => {
    if (tpList.length === 0) {
      setErrorMessage('Daftar TP belum tersedia. Silakan analisis CP terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsLoadingATP(true);

    try {
      const activeElemenNames = elemenRows.length > 0 ? elemenRows.map((r) => r.elemen).join(' & ') : 'Seluruh Elemen';
      const activeCPText = elemenRows.length > 0 ? elemenRows.map((r) => `[${r.elemen}]:\n${r.capaianPembelajaran}`).join('\n\n') : '';
      const currentElemenList = elemenRows.map((r) => ({
        elemen: r.elemen,
        capaianPembelajaran: r.capaianPembelajaran,
      }));

      const { data, isClientFallback } = await clientGenerateATP(
        identitas,
        activeElemenNames,
        activeCPText,
        currentElemenList,
        tpList,
        preferensiTambahan
      );

      const atpDoc: ATPDocument = {
        id: `atp-${Date.now()}`,
        tanggalDibuat: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        identitas,
        elemen: activeElemenNames,
        capaianPembelajaran: activeCPText,
        elemenList: data.elemenList && data.elemenList.length > 0 ? data.elemenList : currentElemenList,
        atpList: data.atpList || [],
        materiPokokList: data.materiPokokList || [],
        dimensiProfilLulusan: data.dimensiProfilLulusan || [],
        penjelasanDPL: data.penjelasanDPL || '',
        glosarium: data.glosarium || [],
        daftarPustaka: data.daftarPustaka || [],
        rasionalPenyusunan: data.rasionalPenyusunan || '',
      };

      setAtpDocument(atpDoc);
      // Synchronize KKTP, Prota, and Promes directly to new ATP document
      const linkedKKTP = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
      setKktpDocument(linkedKKTP);
      const linkedProta = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
      setProtaDocument(linkedProta);
      const linkedPromes = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
      setPromesDocument(linkedPromes);
      setCurrentTab('atp');
      showToast('Dokumen Alur Tujuan Pembelajaran (ATP) 8 Bagian berhasil disusun!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyusun dokumen ATP.');
    } finally {
      setIsLoadingATP(false);
    }
  };

  // Step 2.5: Generate KKTP Document (Rubrik 4 Kategori, Interval, Deskripsi BSKAP 046/2025)
  const handleGenerateKKTP = async (autoNavigate: boolean = true) => {
    if (tpList.length === 0) {
      setErrorMessage('Daftar TP belum tersedia. Silakan analisis CP terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsLoadingKKTP(true);

    try {
      const { data: kktpDoc } = await clientGenerateKKTP(
        identitas,
        tpList,
        atpDocument,
        preferensiTambahan
      );

      setKktpDocument(kktpDoc);
      if (autoNavigate) {
        setCurrentTab('kktp');
        showToast('Dokumen KKTP (Rubrik Kualitatif & Interval Nilai) berhasil disusun!');
      }
    } catch (err: any) {
      console.error(err);
      const kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDocument);
      setKktpDocument(kktpDoc);
      if (autoNavigate) {
        setCurrentTab('kktp');
        showToast('Dokumen KKTP disusun menggunakan standar pedagogis lokal.');
      }
    } finally {
      setIsLoadingKKTP(false);
    }
  };

  // Open Pre-Generation Selection Modal (RPM Config)
  const handleOpenRPMConfig = (selectedTPCodes?: string[]) => {
    const codes = (selectedTPCodes && selectedTPCodes.length > 0)
      ? selectedTPCodes
      : (atpDocument?.atpList?.map((t) => t.kodeTP) || tpList.map((t) => t.kodeTP));

    if (codes.length === 0) {
      setErrorMessage('Belum ada Tujuan Pembelajaran yang tersedia untuk membuat Modul Ajar.');
      return;
    }

    setPendingTPCodesForModul(codes);
    setIsRPMConfigOpen(true);
  };

  const handleConfirmRPMConfig = async (options: RPMConfigOptions) => {
    setLastRPMOptions(options);
    setIsRPMConfigOpen(false);
    const targetCodes = options.selectedTPCodes && options.selectedTPCodes.length > 0
      ? options.selectedTPCodes
      : pendingTPCodesForModul;
    await handleGenerateModulAjar(targetCodes, options);
  };

  // Step 3: Generate Modul Ajar from selected TPs
  const handleGenerateModulAjar = async (selectedTPCodes: string[], rpmOptions?: RPMConfigOptions) => {
    const selectedTPObjects = tpList.filter((tp) => selectedTPCodes.includes(tp.kodeTP));

    if (selectedTPObjects.length === 0) {
      setErrorMessage('Pilih minimal satu Tujuan Pembelajaran untuk membuat Modul Ajar.');
      return;
    }

    // Determine the single specific class and semester for this RPP meeting
    const targetKelas = rpmOptions?.selectedKelas || (selectedTPObjects[0] ? getItemClass(selectedTPObjects[0], identitas.fase) : identitas.kelas);
    const targetSemester = rpmOptions?.semester || identitas.semester || '1';
    const specificIdentitas: SchoolIdentity = {
      ...identitas,
      kelas: targetKelas,
      semester: targetSemester,
    };
    setIdentitas((prev) => ({
      ...prev,
      kelas: targetKelas,
      semester: targetSemester,
    }));

    setErrorMessage(null);
    setIsLoadingModul(true);

    try {
      // Selesaikan Elemen dan Capaian Pembelajaran lengkap berdasarkan TP yang dipilih
      const cpResolution = resolveCPPerElemenFromTPs(
        selectedTPObjects,
        elemenRows,
        atpDocument,
        specificIdentitas
      );

      // Per professional RPP standards: 1 meeting focuses on 1 element
      const activeElemenNames = (cpResolution.perElemenList[0]?.elemen) || cpResolution.elemenString || selectedTPObjects[0]?.elemen || 'Elemen Mapel';
      const activeCPText = cpResolution.perElemenList[0]?.capaianPembelajaran || cpResolution.capaianPembelajaranFormatted;
      const chosenModel = rpmOptions?.modelPembelajaran || (preferensiTambahan.includes('Problem Based Learning')
        ? 'Problem Based Learning (PBL)'
        : preferensiTambahan.includes('Project')
        ? 'Project Based Learning (PjBL)'
        : preferensiTambahan.includes('Discovery')
        ? 'Discovery Learning'
        : 'Problem Based Learning (PBL)');

      const enrichedRPMOptions: RPMConfigOptions = {
        ...(rpmOptions || ({} as RPMConfigOptions)),
        selectedKelas: targetKelas,
        selectedTPCodes,
        elemen: activeElemenNames,
        capaianPembelajaran: activeCPText,
        capaianPembelajaranPerElemen: cpResolution.perElemenList,
        topikMateri: rpmOptions?.topikMateri || selectedTPObjects.map((t) => t.lingkupMateri).join(', '),
        alokasiWaktu: rpmOptions?.alokasiWaktu || '2 x 35 Menit (1 kali pertemuan)',
        modelPembelajaran: chosenModel,
        pendekatanPembelajaran: rpmOptions?.pendekatanPembelajaran || 'Pembelajaran Mendalam (Deep Learning - Mindful, Meaningful, Joyful)',
        metodePembelajaran: rpmOptions?.metodePembelajaran || ['Diskusi Kelompok', 'Tanya Jawab Interaktif', 'Praktik Langsung'],
        useMitraInternal: rpmOptions?.useMitraInternal ?? true,
        mitraInternal: rpmOptions?.mitraInternal || [],
        useMitraEksternal: rpmOptions?.useMitraEksternal ?? true,
        mitraEksternal: rpmOptions?.mitraEksternal || [],
        pemanfaatanPlatform: rpmOptions?.pemanfaatanPlatform || [],
        pemanfaatanPerangkat: rpmOptions?.pemanfaatanPerangkat || [],
        pemanfaatanMedia: rpmOptions?.pemanfaatanMedia || [],
        lingkunganFisik: rpmOptions?.lingkunganFisik || [],
        lingkunganFisikDeskripsi: rpmOptions?.lingkunganFisikDeskripsi || '',
        budayaBelajar: rpmOptions?.budayaBelajar || [],
        karakteristikMateri: rpmOptions?.karakteristikMateri,
        karakteristikMurid: rpmOptions?.karakteristikMurid || [],
        karakteristikMuridCustom: rpmOptions?.karakteristikMuridCustom || '',
        kebutuhanMurid: rpmOptions?.kebutuhanMurid || '',
        dimensiProfilLulusan: rpmOptions?.dimensiProfilLulusan || ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'],
        jumlahPertemuan: rpmOptions?.jumlahPertemuan,
        totalJP: rpmOptions?.totalJP,
      };

      const { data } = await clientGenerateModulAjar(
        specificIdentitas,
        activeElemenNames,
        activeCPText,
        selectedTPObjects,
        enrichedRPMOptions.topikMateri,
        chosenModel,
        preferensiTambahan,
        enrichedRPMOptions
      );

      const modulDoc: ModulAjarDocument = {
        id: `modul-${Date.now()}`,
        atpDocumentId: atpDocument?.id,
        tanggalDibuat: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        judulModul: data.judulModul || 'RENCANA PEMBELAJARAN MENDALAM',
        elemen: activeElemenNames,
        topikMateri: data.topikMateri || enrichedRPMOptions.topikMateri,
        alokasiWaktuPertemuan: enrichedRPMOptions.alokasiWaktu || data.alokasiWaktuPertemuan,
        jumlahPertemuan: data.jumlahPertemuan || enrichedRPMOptions.jumlahPertemuan || 1,
        totalJP: data.totalJP || enrichedRPMOptions.totalJP,
        identitas: {
          ...identitas,
          kelas: targetKelas,
          alokasiWaktuModul: enrichedRPMOptions.alokasiWaktu || data.alokasiWaktuModul || data.alokasiWaktuPertemuan,
          targetPesertaDidik: data.targetPesertaDidik || 'Peserta didik reguler / tipikal',
          modaPembelajaran: data.modaPembelajaran || 'Tatap Muka (Luring)',
        },
        identifikasiRPM: data.identifikasiRPM ? {
          ...data.identifikasiRPM,
          karakteristikMateri: enrichedRPMOptions.karakteristikMateri || data.identifikasiRPM.karakteristikMateri,
        } : data.identifikasiRPM,
        desainPembelajaranRPM: {
          ...data.desainPembelajaranRPM,
          capaianPembelajaran: activeCPText || data.desainPembelajaranRPM?.capaianPembelajaran,
          capaianPembelajaranPerElemen: cpResolution.perElemenList?.length ? cpResolution.perElemenList : data.desainPembelajaranRPM?.capaianPembelajaranPerElemen,
          pemanfaatanTeknologi: {
            platformAplikasi: rpmOptions?.pemanfaatanPlatform !== undefined ? rpmOptions.pemanfaatanPlatform : (data.desainPembelajaranRPM?.pemanfaatanTeknologi?.platformAplikasi || []),
            perangkatDigital: rpmOptions?.pemanfaatanPerangkat !== undefined ? rpmOptions.pemanfaatanPerangkat : (data.desainPembelajaranRPM?.pemanfaatanTeknologi?.perangkatDigital || []),
            mediaDigital: rpmOptions?.pemanfaatanMedia !== undefined ? rpmOptions.pemanfaatanMedia : (data.desainPembelajaranRPM?.pemanfaatanTeknologi?.mediaDigital || []),
          },
        },
        langkahPembelajaranRPM: data.langkahPembelajaranRPM,
        asesmenRPM: data.asesmenRPM,
        rubrikPenilaianRPM: data.rubrikPenilaianRPM,
        lkpdRPM: data.lkpdRPM,
        soalEvaluasiRPM: data.soalEvaluasiRPM,
        kompetensiAwal: data.kompetensiAwal || [],
        profilPelajarPancasila: data.profilPelajarPancasila || [],
        saranaPrasarana: data.saranaPrasarana || { fasilitas: [], lingkunganBelajar: [], mediaAjar: [] },
        modelPembelajaran: data.modelPembelajaran || chosenModel,
        tujuanPembelajaranSpesifik: data.tujuanPembelajaranSpesifik || [],
        pemahamanBermakna: data.pemahamanBermakna || [],
        pertanyaanPemantik: data.pertanyaanPemantik || [],
        persiapanPembelajaran: data.persiapanPembelajaran || [],
        kegiatanPembelajaran: data.kegiatanPembelajaran || [],
        asesmen: data.asesmen || {
          diagnostik: { teknik: 'Tanya Jawab', daftarPertanyaan: [] },
          formatif: { teknik: 'Observasi & Lembar Kerja', deskripsi: '', rubrik: [] },
          sumatif: { teknik: 'Tes Tertulis', daftarSoal: [] },
        },
        pengayaanDanRemedial: data.pengayaanDanRemedial || { pengayaan: '', remedial: '' },
        refleksi: data.refleksi || { refleksiGuru: [], refleksiSiswa: [] },
        lkpd: data.lkpd || [],
        bahanBacaanGuruDanSiswa: data.bahanBacaanGuruDanSiswa || { ringkasanMateri: '', materiPengayaanSingkat: '' },
        glosarium: data.glosarium || [],
        daftarPustaka: data.daftarPustaka || [],
      };

      setModulAjarDocument(modulDoc);
      setCurrentTab('modul');
      showToast('Modul Ajar Rencana Pembelajaran Mendalam (RPM) berhasil disusun!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyusun Modul Ajar.');
    } finally {
      setIsLoadingModul(false);
    }
  };

  // Save ATP to History
  const handleSaveATPHistory = () => {
    if (!atpDocument) return;
    const existingIndex = savedItems.findIndex((s) => s.id === atpDocument.id);
    const item: SavedItem = {
      id: atpDocument.id,
      type: 'ATP',
      title: `ATP: ${atpDocument.identitas.mataPelajaran} (${atpDocument.elemen})`,
      mataPelajaran: atpDocument.identitas.mataPelajaran,
      fase: atpDocument.identitas.fase,
      kelas: atpDocument.identitas.kelas,
      tanggal: atpDocument.tanggalDibuat,
      atpData: atpDocument,
    };

    if (existingIndex >= 0) {
      const updated = [...savedItems];
      updated[existingIndex] = item;
      setSavedItems(updated);
    } else {
      setSavedItems([item, ...savedItems]);
    }
    showToast('Dokumen ATP berhasil disimpan ke riwayat!');
  };

  // Save KKTP to History
  const handleSaveKKTPHistory = () => {
    if (!kktpDocument) return;
    const existingIndex = savedItems.findIndex((s) => s.id === kktpDocument.id);
    const item: SavedItem = {
      id: kktpDocument.id,
      type: 'KKTP',
      title: `KKTP: ${kktpDocument.identitas.mataPelajaran} (${kktpDocument.kktpList.length} TP)`,
      mataPelajaran: kktpDocument.identitas.mataPelajaran,
      fase: kktpDocument.identitas.fase,
      kelas: kktpDocument.identitas.kelas,
      tanggal: kktpDocument.tanggalDibuat,
      kktpData: kktpDocument,
    };

    if (existingIndex >= 0) {
      const updated = [...savedItems];
      updated[existingIndex] = item;
      setSavedItems(updated);
    } else {
      setSavedItems([item, ...savedItems]);
    }
    showToast('Dokumen KKTP berhasil disimpan ke riwayat!');
  };

  // Save Modul to History
  const handleSaveModulHistory = () => {
    if (!modulAjarDocument) return;
    const existingIndex = savedItems.findIndex((s) => s.id === modulAjarDocument.id);
    const item: SavedItem = {
      id: modulAjarDocument.id,
      type: 'MODUL',
      title: `Modul: ${modulAjarDocument.identitas.mataPelajaran} (${modulAjarDocument.modelPembelajaran})`,
      mataPelajaran: modulAjarDocument.identitas.mataPelajaran,
      fase: modulAjarDocument.identitas.fase,
      kelas: modulAjarDocument.identitas.kelas,
      tanggal: modulAjarDocument.tanggalDibuat,
      modulData: modulAjarDocument,
    };

    if (existingIndex >= 0) {
      const updated = [...savedItems];
      updated[existingIndex] = item;
      setSavedItems(updated);
    } else {
      setSavedItems([item, ...savedItems]);
    }
    showToast('Modul Ajar berhasil disimpan ke riwayat!');
  };

  // Save Prota to History / Archive
  const handleSaveProtaHistory = () => {
    if (!protaDocument) return;
    const existingIndex = savedItems.findIndex((s) => s.id === protaDocument.id);
    const item: SavedItem = {
      id: protaDocument.id,
      type: 'PROTA',
      title: `PROTA: ${protaDocument.identitas.mataPelajaran} (${protaDocument.totalJPTahunAkumulasi} JP)`,
      mataPelajaran: protaDocument.identitas.mataPelajaran,
      fase: protaDocument.identitas.fase,
      kelas: String(protaDocument.identitas.kelas),
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      protaData: protaDocument,
    };

    if (existingIndex >= 0) {
      const updated = [...savedItems];
      updated[existingIndex] = item;
      setSavedItems(updated);
    } else {
      setSavedItems([item, ...savedItems]);
    }
    showToast('Program Tahunan (PROTA) berhasil disimpan ke arsip!');
  };

  // Save Promes to History / Archive
  const handleSavePromesHistory = () => {
    if (!promesDocument) return;
    const existingIndex = savedItems.findIndex((s) => s.id === promesDocument.id);
    const item: SavedItem = {
      id: promesDocument.id,
      type: 'PROMES',
      title: `PROMES: ${promesDocument.identitas.mataPelajaran} (${promesDocument.jpMinggu} JP/Mgg)`,
      mataPelajaran: promesDocument.identitas.mataPelajaran,
      fase: promesDocument.identitas.fase,
      kelas: String(promesDocument.identitas.kelas),
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      promesData: promesDocument,
    };

    if (existingIndex >= 0) {
      const updated = [...savedItems];
      updated[existingIndex] = item;
      setSavedItems(updated);
    } else {
      setSavedItems([item, ...savedItems]);
    }
    showToast('Program Semester (PROMES) berhasil disimpan ke arsip!');
  };

  const handleLoadATPFromSaved = (atp: ATPDocument) => {
    setAtpDocument(atp);
    setIdentitas(atp.identitas);
    const tps: TPItem[] = atp.atpList.map((item, idx) => ({
      id: item.id || `tp-loaded-${idx}`,
      kodeTP: item.kodeTP,
      elemen: atp.elemen,
      kalimatCP: atp.capaianPembelajaran,
      kompetensi: 'Kompetensi Terpadu',
      lingkupMateri: item.lingkupMateri,
      rumusanTP: item.tujuanPembelajaran,
      indikatorKetercapaian: item.indikatorKetercapaian,
      alokasiJP: item.alokasiJP,
      dimensiP3: item.dimensiP3,
      semesterTarget: 'Semester 1',
      urutanAlur: item.urutan,
    }));
    setTpList(tps);
    setCurrentTab('atp');
    showToast('Dokumen ATP berhasil dimuat dari riwayat!');
  };

  const handleLoadKKTPFromSaved = (kktp: KKTPDocument) => {
    setKktpDocument(kktp);
    setIdentitas(kktp.identitas);
    setCurrentTab('kktp');
    showToast('Dokumen KKTP berhasil dimuat dari riwayat!');
  };

  const handleLoadProtaFromSaved = (prota: ProtaDocument) => {
    setProtaDocument(prota);
    setIdentitas(prota.identitas);
    setCurrentTab('prota');
    showToast(`Program Tahunan ${prota.identitas.mataPelajaran} berhasil dimuat!`);
  };

  const handleLoadPromesFromSaved = (promes: PromesDocument) => {
    setPromesDocument(promes);
    setIdentitas(promes.identitas);
    setCurrentTab('promes');
    showToast(`Program Semester ${promes.identitas.mataPelajaran} berhasil dimuat!`);
  };

  const handleLoadModulFromSaved = (modul: ModulAjarDocument) => {
    setModulAjarDocument(modul);
    setIdentitas(modul.identitas);
    setCurrentTab('modul');
    showToast('Modul Ajar berhasil dimuat dari riwayat!');
  };

  // Save Soal to History / Archive & Firebase
  const handleSavePermanentSoal = (docToSave: KisiKisiSoalDocument) => {
    const existingIndex = savedItems.findIndex((s) => s.id === docToSave.id);
    const item: SavedItem = {
      id: docToSave.id,
      type: 'SOAL',
      title: `Kisi-Kisi & Naskah Soal ${docToSave.konfigurasi.jenisAsesmen} (${docToSave.naskahSoal.totalButirSoal} Butir)`,
      mataPelajaran: docToSave.identitas.mataPelajaran,
      fase: docToSave.identitas.fase,
      kelas: String(docToSave.identitas.kelas),
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      soalData: docToSave,
    };

    let updatedItems: SavedItem[];
    if (existingIndex >= 0) {
      updatedItems = [...savedItems];
      updatedItems[existingIndex] = item;
    } else {
      updatedItems = [item, ...savedItems];
    }
    setSavedItems(updatedItems);
    saveToStorage(STORAGE_KEYS.SAVED_ITEMS, updatedItems);
    saveToStorage(STORAGE_KEYS.SOAL_DOC, docToSave);

    // Sync to Cloud Firestore immediately
    const activeCode = getActiveSessionCode();
    if (activeCode) {
      saveUserWorkspaceToFirestore(activeCode, {
        identitas,
        savedItems: updatedItems,
        currentDrafts: {
          tpList,
          elemenRows,
          selectedElements,
          rasionalAnalisis,
          atpDocument,
          kktpDocument,
          protaDocument,
          promesDocument,
          modulAjarDocument,
          soalDocument: docToSave,
        },
      }).catch((e) => console.warn('Sync soal to firestore error:', e));
    }

    showToast('Kisi-Kisi & Naskah Soal berhasil disimpan permanen ke Arsip & Firebase!');
  };

  const handleLoadSoalFromSaved = (soal: KisiKisiSoalDocument) => {
    setSoalDocument(soal);
    setIdentitas(soal.identitas);
    setCurrentTab('soal');
    showToast(`Dokumen Kisi-Kisi & Naskah Soal ${soal.konfigurasi.jenisAsesmen} berhasil dimuat!`);
  };

  const handlePublishToRuangMurid = async (docToPublish: KisiKisiSoalDocument) => {
    try {
      const pkg: ExamPackage = {
        id: `pkg-${docToPublish.id}`,
        kodeAksesGuru: activeAccessRecord?.kodeAkses || identitas.namaGuru || 'GURU',
        judul: `${docToPublish.konfigurasi.jenisAsesmen} ${docToPublish.identitas.mataPelajaran} - Kelas ${docToPublish.identitas.kelas}`,
        mataPelajaran: docToPublish.identitas.mataPelajaran,
        fase: docToPublish.identitas.fase,
        kelas: docToPublish.identitas.kelas,
        semester: docToPublish.identitas.semester,
        jenisAsesmen: docToPublish.konfigurasi.jenisAsesmen,
        daftarTP: Array.from(new Set(docToPublish.tabelKisiKisi.map(k => k.kodeTP))).map(kode => {
          const row = docToPublish.tabelKisiKisi.find(k => k.kodeTP === kode);
          return {
            kodeTP: kode,
            rumusanTP: row?.tujuanPembelajaran || '',
            lingkupMateri: row?.lingkupMateri || '',
            elemen: row?.elemen || 'Semua Elemen'
          };
        }),
        durasiMenit: 120,
        isActive: true,
        soalDocument: docToPublish,
        createdAt: new Date().toISOString(),
      };
      await saveOrPublishExamPackage(pkg);
      showToast('🚀 Paket Ujian berhasil diaktifkan! Murid sekarang dapat mengakses ulangan ini di Ruang Murid.');
    } catch (e) {
      console.error(e);
      showToast('Gagal mengaktifkan paket ujian.');
    }
  };

  const handleDeleteSavedItem = (id: string) => {
    const nextItems = savedItems.filter((item) => item.id !== id);
    setSavedItems(nextItems);
    saveToStorage(STORAGE_KEYS.SAVED_ITEMS, nextItems);

    // Auto-sync deletion to Cloud Firestore immediately so it vanishes from Firebase
    const activeCode = getActiveSessionCode();
    if (activeCode) {
      saveUserWorkspaceToFirestore(activeCode, {
        identitas,
        savedItems: nextItems,
        currentDrafts: {
          tpList,
          elemenRows,
          selectedElements,
          rasionalAnalisis,
          atpDocument,
          kktpDocument,
          protaDocument,
          promesDocument,
          modulAjarDocument,
          soalDocument,
        },
      }).catch((e) => console.warn('Sync delete to firestore error:', e));
    }

    showToast('Dokumen berhasil dihapus permanen dari arsip lokal dan Firebase.');
  };

  const handleClearAllSaved = () => {
    setSavedItems([]);
    saveToStorage(STORAGE_KEYS.SAVED_ITEMS, []);

    // Auto-sync clear to Cloud Firestore immediately
    const activeCode = getActiveSessionCode();
    if (activeCode) {
      saveUserWorkspaceToFirestore(activeCode, {
        identitas,
        savedItems: [],
        currentDrafts: {
          tpList,
          elemenRows,
          selectedElements,
          rasionalAnalisis,
          atpDocument,
          kktpDocument,
          protaDocument,
          promesDocument,
          modulAjarDocument,
          soalDocument,
        },
      }).catch((e) => console.warn('Sync clear to firestore error:', e));
    }

    showToast('Semua riwayat arsip berhasil dikosongkan dari lokal dan Firebase.');
  };

  // Header Title & Badge logic with Emoticons & Premium Theme
  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'input':
        return {
          icon: '📥',
          title: 'Input Capaian Pembelajaran & Bank Mapel SD',
          badge: `${selectedElements.filter((e) => e.isSelected).length} Elemen Terpilih`,
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/60',
        };
      case 'tp':
        return {
          icon: '🎯',
          title: 'Dokumen Analisis CP ke TP Seluruh Elemen Mapel',
          badge: `${elemenRows.length || 1} Elemen • ${tpList.length} Butir TP`,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/60',
        };
      case 'atp':
        return {
          icon: '🛤️',
          title: 'Alur Tujuan Pembelajaran (ATP) 8 Bagian (A-H)',
          badge: atpDocument ? 'Format BSKAP 046/2025' : 'Penyusunan',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60',
        };
      case 'kktp':
        return {
          icon: '📊',
          title: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)',
          badge: kktpDocument ? `${kktpDocument.kktpList.length} Indikator TP` : 'Format BSKAP 046/2025',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-400/60',
        };
      case 'prota':
        return {
          icon: '📅',
          title: 'Program Tahunan (PROTA) Kurikulum Merdeka 2025',
          badge: protaDocument ? `${protaDocument.totalJPTahunAkumulasi} JP • Permen 13/2025` : 'Regulasi Valid',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/60',
        };
      case 'promes':
        return {
          icon: '🗓️',
          title: 'Program Semester (PROMES) Kurikulum Merdeka 2025',
          badge: promesDocument ? `${promesDocument.jpMinggu} JP/Mgg • Matriks Mingguan` : 'Regulasi Valid',
          badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/60',
        };
      case 'modul':
        return {
          icon: '📘',
          title: 'Dokumen Modul Ajar (RPP), LKPD & Rubrik Asesmen',
          badge: modulAjarDocument ? `${modulAjarDocument.modelPembelajaran}` : 'Penyusunan',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
        };
      case 'prompt-media':
        return {
          icon: '🎨',
          title: 'Bank Prompt Media 3D Pixar/Disney & Komik',
          badge: `${tpList.length} TP • Siap Salin`,
          badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-400/60',
        };
      case 'soal':
        return {
          icon: '📝',
          title: 'Perancangan Kisi-Kisi & Naskah Soal',
          badge: 'Tahap 9',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/60',
        };
      case 'saved':
        return {
          icon: '📁',
          title: 'Riwayat Arsip Perangkat Ajar & Firebase Cloud',
          badge: `${savedItems.length} Dokumen`,
          badgeColor: 'bg-slate-700/40 text-slate-200 border-slate-500',
        };
      case 'rapor':
        return {
          icon: '📈',
          title: 'Analisis Nilai Rapor & Deskripsi Kemajuan Belajar (Kurikulum Merdeka)',
          badge: `${identitas.mataPelajaran || 'Mapel'} • Kelas ${identitas.kelas || 'VI'}`,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  const primaryElemenName = elemenRows.length > 0 ? elemenRows[0].elemen : selectedElements[0]?.elemen || 'Elemen Mapel';
  const primaryCPText = elemenRows.length > 0 ? elemenRows[0].capaianPembelajaran : selectedElements[0]?.capaianPembelajaran || '';

  return (
    
    <div className="flex h-screen w-full bg-[#070e1c] font-sans text-slate-100 overflow-hidden">
      {/* Intro Splash Screen - Compact Single Viewport 100% Fit */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070e1c] overflow-hidden px-4 py-3 select-none h-screen max-h-screen">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-amber-500/15 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full my-auto space-y-2.5 sm:space-y-3">
            {/* Logo Aplikasi: Perpaduan Buku dan Pena */}
            <div className="animate-in zoom-in duration-500 ease-out fill-mode-both">
              <AppLogo size="xl" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            
            {/* Title & Subtitle */}
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-600 delay-100 ease-out fill-mode-both">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 tracking-tight leading-tight drop-shadow-sm">
                SELAMAT DATANG DI SIPARTAN
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-300 tracking-wider uppercase">
                (Sistem Perancang &amp; Analisis Perangkat Ajar)
              </p>
            </div>

            {/* Regulatory Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] sm:text-[10px] animate-in fade-in slide-in-from-bottom-2 duration-600 delay-200 ease-out fill-mode-both">
              <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 font-semibold">
                Kurikulum Merdeka 2025/2026
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BSKAP 046/2025 &amp; BKP 020/2026 (Agama)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-950/70 text-blue-300 border border-blue-500/40 font-semibold">
                Permendikdasmen No. 13/2025 (1 JP = 35 Menit)
              </span>
            </div>
            
            {/* Kartu Profil Pengembang: Foto Wajib Roni Hariyanto Bhidju */}
            <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-3 duration-600 delay-300 ease-out fill-mode-both">
              <div className="relative flex items-center gap-3 bg-gradient-to-r from-[#0C1A33] via-[#0E2040] to-[#0A162B] border-2 border-amber-400/60 rounded-xl p-2.5 shadow-xl backdrop-blur-md">
                {/* Foto Pengembang Resmi Sesuai Unggahan */}
                <div className="relative shrink-0">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden ring-2 ring-amber-400 shadow-md bg-slate-900">
                    <img
                      src={formatImageUrl(identitas.fotoGuruUrl || '/teacher_roni.jpg')}
                      alt="Roni Hariyanto Bhidju, S.Pd"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B1528] flex items-center justify-center text-white" title="Pengembang Terverifikasi">
                    <Award className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Teks Identitas Pengembang */}
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      BY :
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">PENGEMBANG SISTEM</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide leading-tight truncate">
                    Roni Hariyanto Bhidju, S.Pd
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-emerald-400 font-bold mt-0.5 truncate">
                    Guru SD Dedikatif &amp; Transformatif Provinsi NTT
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Masuk & Progress Bar */}
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-600 delay-400 ease-out fill-mode-both flex flex-col items-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSplash(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:shadow-[0_0_35px_rgba(251,191,36,0.5)] hover:scale-105 transition-all cursor-pointer border border-amber-300 active:scale-95"
              >
                <span>Masuk ke SIPARTAN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              {/* Progress Loading Bar */}
              <div className="w-48 sm:w-60 h-1 bg-slate-800/80 rounded-full mt-2.5 overflow-hidden border border-slate-700/50">
                <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 rounded-full w-full animate-[progress_4.5s_ease-in-out_forwards]"></div>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 font-medium tracking-wider">
                MEMUAT APLIKASI...
              </span>
            </div>

            <style>{`
              @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(0); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Toast Notification with Gold & Emerald Trim */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0B1528] text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-semibold flex items-center space-x-2.5 border-2 border-amber-400/60 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Global Loading Overlay with Royal Navy & Gold Card */}
      {(isLoadingTP || isLoadingATP || isLoadingKKTP || isLoadingModul) && (
        <div className="fixed inset-0 z-50 bg-[#0B1528]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border-2 border-amber-500 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B1528] to-[#1e3a8a] text-amber-400 mx-auto flex items-center justify-center shadow-md border-2 border-amber-400/50">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-[#0B1528] text-sm">
                {isLoadingTP
                  ? 'Menganalisis Seluruh Elemen Mapel...'
                  : isLoadingATP
                  ? 'Menyusun Dokumen ATP 8 Bagian...'
                  : isLoadingKKTP
                  ? 'Menyusun Dokumen KKTP (Rubrik & Interval)...'
                  : 'Merancang Modul Ajar & LKPD...'}
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {isLoadingTP
                  ? 'Sistem sedang membedah setiap elemen CP menjadi kompetensi dan materi spesifik...'
                  : isLoadingATP
                  ? 'Sistem menyelaraskan materi pokok, alur waktu, DPL, glosarium, dan daftar pustaka...'
                  : isLoadingKKTP
                  ? 'Sistem merumuskan rubrik 4 kategori, interval nilai ketuntasan, dan deskripsi ketercapaian...'
                  : 'Sistem merancang skenario pembelajaran, lembar kerja siswa, dan rubrik asesmen...'}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      {!showSplash && portalMode === "selection" && (
        <PortalSelectionView
          onSelectPortal={handleSwitchPortalMode}
          pendingCount={pendingAccessCount}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        />
      )}
      {portalMode !== "selection" && (
        <>


      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* High Density Left Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 ${
          desktopSidebarOpen ? 'lg:w-[280px] lg:opacity-100' : 'lg:w-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none'
        }`}
      >
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setMobileSidebarOpen(false);
          }}
          onCloseSidebar={() => {
            setMobileSidebarOpen(false);
            setDesktopSidebarOpen(false);
          }}
          hasTP={tpList.length > 0}
          hasATP={atpDocument !== null}
          hasKKTP={Boolean(kktpDocument && kktpDocument.kktpList.length > 0)}
          hasProta={Boolean(protaDocument || tpList.length > 0)}
          hasPromes={Boolean(promesDocument || tpList.length > 0)}
          hasModul={modulAjarDocument !== null}
          hasMediaPrompt={tpList.length > 0}
          hasSoal={Boolean(soalDocument || tpList.length > 0)}
          savedCount={savedItems.length}
          onOpenHelp={() => {
            setIsGuideOpen(true);
            setMobileSidebarOpen(false);
          }}
          identitas={identitas}
          onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
          activeAccessRecord={activeAccessRecord}
          onOpenAccessGate={() => setIsAccessGateOpen(true)}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          pendingCount={pendingAccessCount}
          onOpenCreateModul={() => {
            setMobileSidebarOpen(false);
            handleOpenRPMConfig();
          }}
          onOpenSubjectPicker={() => {
            setMobileSidebarOpen(false);
            setIsSubjectPickerOpen(true);
          }}
          onOpenStudentManager={() => {
            setMobileSidebarOpen(false);
            setIsStudentManagerOpen(true);
          }}
          onOpenExamMonitoring={() => {
            setMobileSidebarOpen(false);
            setIsExamMonitoringModalOpen(true);
          }}
          onOpenKamarBahanAjar={() => {
            setMobileSidebarOpen(false);
            setIsTeacherBahanAjarModalOpen(true);
          }}
          cloudSyncStatus={cloudSyncStatus}
          onManualSync={handleManualCloudSync}
          isSyncingWithCloud={isSyncingWithCloud}
          portalMode={portalMode}
          onSwitchPortalMode={handleSwitchPortalMode}
          onOpenDataIntegrity={() => setIsDataIntegrityModalOpen(true)}
        />
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070e1c]">
        {/* Top Header Bar with Gold/Navy/Emerald Accents */}
        <header className="h-14 bg-[#0B1528] border-b-2 border-slate-800/90 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10 shadow-md relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500" />
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Tombol Garis 3 (Hamburger Menu) - Selalu terlihat utuh & jelas di semua layar */}
            <button
              id="btn-toggle-sidebar"
              type="button"
              onClick={toggleSidebar}
              className="px-2.5 sm:px-3 py-1.5 text-amber-300 hover:text-white bg-slate-900/95 hover:bg-slate-800 rounded-xl cursor-pointer border-2 border-amber-400/90 hover:border-amber-300 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20 active:scale-95 z-20"
              title={(!desktopSidebarOpen && !mobileSidebarOpen) ? "Buka Menu Sidebar (Garis 3)" : "Tutup Menu Sidebar (Garis 3)"}
              aria-label="Buka atau Tutup Menu Sidebar"
            >
              <Menu className="w-5 h-5 text-amber-400 shrink-0" strokeWidth={2.5} />
              <span className="text-[11px] font-black text-amber-300 hidden sm:inline tracking-wider uppercase">Menu</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {headerMeta.icon && (
                <span className="text-base shrink-0">{headerMeta.icon}</span>
              )}
              <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate">
                {headerMeta.title}
              </h2>
            </div>
            <span
              className={`hidden md:inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase border-2 shadow-2xs ${headerMeta.badgeColor}`}
            >
              {headerMeta.badge}
            </span>

          </div>

          <div className="flex items-center gap-2 shrink-0">

            {/* Quick Indicator for Teacher: AutoSave & Data Integrity */}
            {portalMode === 'guru' && (
              <div className="hidden sm:inline-block">
                <AutoSaveIndicator
                  schoolName={identitas.namaSatuanPendidikan}
                  onResetToDefault={handleResetToDefault}
                  onRestoreFromBackup={handleRestoreFromBackup}
                  onOpenDataIntegrity={() => setIsDataIntegrityModalOpen(true)}
                />
              </div>
            )}

            {/* Active Code or Masuk ke SIPARTAN Gate Button */}
            {activeAccessRecord ? (
              <button
                type="button"
                onClick={() => setIsAccessGateOpen(true)}
                className={`px-2.5 py-1.5 text-xs font-mono font-black rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors border-2 ${
                  activeAccessRecord.kodeAkses === MASTER_ACCESS_CODE || activeAccessRecord.isPremiumMaster
                    ? 'text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 border-amber-300'
                    : 'text-amber-300 bg-[#0E1B38] hover:bg-[#14264e] border-amber-500/50 hover:border-amber-400'
                }`}
                title={
                  activeAccessRecord.kodeAkses === MASTER_ACCESS_CODE || activeAccessRecord.isPremiumMaster
                    ? 'Mode Master Admin & Pengembang Aktif (Akses Bebas Semua Fitur)'
                    : `Kode Akses Aktif: ${activeAccessRecord.kodeAkses} (${activeAccessRecord.namaGuru} - ${activeAccessRecord.namaSatuanPendidikan}). Klik untuk ubah kode.`
                }
              >
                {activeAccessRecord.kodeAkses === MASTER_ACCESS_CODE || activeAccessRecord.isPremiumMaster ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span className="hidden sm:inline font-sans font-black">MASTER ADMIN</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden sm:inline">{activeAccessRecord.kodeAkses}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAccessGateOpen(true)}
                className="px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masuk ke SIPARTAN</span>
              </button>
            )}

            {/* Indikator Status Unduhan Word Dinonaktifkan Admin */}
            {isWordDisabledGlobal && (
              <div
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-950/70 border border-amber-500/60 text-amber-300 shadow-2xs"
                title="Unduhan Word dinonaktifkan oleh Admin (mencegah pengeditan data via Word)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Unduhan Word Dinonaktifkan Admin</span>
              </div>
            )}

            {/* Admin Google Forms Security trigger - HANYA MUNCUL PADA KODE SUPER ADMIN */}
            {activeAccessRecord && (isMasterAccessCode(activeAccessRecord.kodeAkses) || activeAccessRecord.isPremiumMaster) && (
              <button
                id="header-admin-panel"
                type="button"
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 rounded-lg border-2 border-amber-500/50 hover:border-amber-400 transition-colors cursor-pointer shadow-xs"
                title="Panel Administrator: Integrasi Google Forms & Kelola Kode Akses"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </button>
            )}


            <button
              onClick={() => setShowSplash(true)}
              className="p-1.5 xl:px-2.5 xl:py-1.5 text-xs font-bold text-amber-300 bg-[#0E1B38] hover:bg-[#122244] hover:text-amber-200 border-2 border-amber-500/50 hover:border-amber-400 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Tampilkan Halaman Intro / Pembuka SIPARTAN"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden 2xl:inline">Intro SIPARTAN</span>
            </button>

            <button
              onClick={() => setIsIdentityModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-300 bg-[#0E1B38] hover:bg-[#162a56] hover:text-amber-100 border-2 border-amber-400/80 hover:border-amber-300 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Menu Profil Sekolah & Guru: Atur alamat instansi, tempat cetak, tahun pelajaran, semester, dan pemilihan kelas"
            >
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Profil Sekolah &amp; Guru</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-1.5 lg:px-2.5 lg:py-1.5 text-xs font-bold text-emerald-300 bg-[#081e18] hover:bg-[#0c2a22] hover:text-emerald-200 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Panduan Resmi BSKAP"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">Panduan BSKAP</span>
            </button>

            {currentTab === 'atp' && atpDocument && (
              <button
                onClick={() => {
                  if (!kktpDocument) {
                    handleGenerateKKTP(true);
                  } else {
                    setCurrentTab('kktp');
                  }
                }}
                disabled={isLoadingKKTP}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg border border-teal-500 shadow-sm hover:from-teal-500 hover:to-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Dokumen KKTP (Tahap 4)</span>
              </button>
            )}

            {currentTab === 'kktp' && kktpDocument && (
              <button
                onClick={() => handleOpenRPMConfig(tpList.map((t) => t.kodeTP))}
                disabled={isLoadingModul}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg border border-orange-500 shadow-sm hover:from-orange-500 hover:to-amber-500 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Buat Modul Ajar (Tahap 5)</span>
              </button>
            )}

            {currentTab === 'input' && (
              <button
                onClick={handleGenerateTP}
                disabled={isLoadingTP || selectedElements.filter((e) => e.isSelected).length === 0}
                className="px-3.5 py-1.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-2 border-amber-300 rounded-lg shadow-md hover:from-amber-300 hover:to-amber-500 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Analisis CP Seluruh Elemen</span>
              </button>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="no-print bg-rose-50 border-b-2 border-rose-300 text-rose-900 px-4 py-2.5 text-xs flex items-center justify-between shrink-0 font-medium">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-950 font-bold px-2 py-0.5 rounded text-xs cursor-pointer border border-rose-300"
            >
              ✕ Tutup
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-6">
          {portalMode === 'murid' ? (
            <RuangMuridView
              identitas={identitas}
              tpList={tpList}
              atpDocument={atpDocument}
              soalDocument={soalDocument}
              activeAccessRecord={activeAccessRecord}
              onSwitchToRuangGuru={() => handleSwitchPortalMode('guru')}
              showToast={showToast}
            />
          ) : (
            <>
              {currentTab === 'input' && (
                <CPInputForm
                  identitas={identitas}
                  onChangeIdentitas={handleIdentitasChange}
                  selectedElements={selectedElements}
                  onChangeSelectedElements={setSelectedElements}
                  preferensiTambahan={preferensiTambahan}
                  onChangePreferensiTambahan={setPreferensiTambahan}
                  onGenerateTP={handleGenerateTP}
                  isLoading={isLoadingTP}
                  activeAccessRecord={activeAccessRecord}
                  onSelectSubjectFolder={handleSelectSubject}
                  onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
                  onSaveIdentitas={handleUpdateIdentitas}
                />
              )}

          {currentTab === 'tp' && (
            <TPAnalysisView
              tpList={tpList}
              rasionalAnalisis={rasionalAnalisis}
              identitas={identitas}
              elemen={primaryElemenName}
              capaianPembelajaran={primaryCPText}
              elemenRows={elemenRows}
              onUpdateTPList={handleUpdateTPList}
              onProceedToATP={handleGenerateATP}
              onProceedToMediaPrompt={() => setCurrentTab('prompt-media')}
              onBackToInput={() => setCurrentTab('input')}
              isLoadingATP={isLoadingATP}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
            />
          )}

          {currentTab === 'atp' && atpDocument && (
            <ATPDocumentView
              atp={atpDocument}
              onUpdateATP={setAtpDocument}
              onProceedToModulAjar={handleOpenRPMConfig}
              onProceedToKKTP={() => {
                if (!kktpDocument) {
                  handleGenerateKKTP(true);
                } else {
                  setCurrentTab('kktp');
                }
              }}
              onProceedToProta={() => {
                if (!protaDocument) {
                  setProtaDocument(buildProtaDocumentFromTP(identitas, tpList, atpDocument));
                }
                setCurrentTab('prota');
              }}
              onProceedToPromes={() => {
                if (!promesDocument) {
                  setPromesDocument(buildPromesDocumentFromTP(identitas, tpList, atpDocument));
                }
                setCurrentTab('promes');
              }}
              onBackToTP={() => setCurrentTab('tp')}
              onSaveToHistory={handleSaveATPHistory}
              isSaved={savedItems.some((s) => s.id === atpDocument.id)}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
            />
          )}

          {currentTab === 'kktp' && kktpDocument && (
            <KKTPDocumentView
              kktp={kktpDocument}
              onUpdateKKTP={setKktpDocument}
              onProceedToModulAjar={handleOpenRPMConfig}
              onBackToATP={() => setCurrentTab('atp')}
              onSaveToHistory={handleSaveKKTPHistory}
              isSaved={savedItems.some((s) => s.id === kktpDocument.id)}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
              onRegenerateWithAI={() => handleGenerateKKTP(true)}
              isGenerating={isLoadingKKTP}
            />
          )}

          {currentTab === 'prota' && (
            <ProtaDocumentView
              protaData={
                protaDocument ||
                buildProtaDocumentFromTP(
                  identitas,
                  tpList,
                  atpDocument
                )
              }
              onUpdateProta={setProtaDocument}
              onSaveToArchive={handleSaveProtaHistory}
              isSaved={protaDocument ? savedItems.some((s) => s.id === protaDocument.id) : false}
              tpList={tpList}
              atpDocument={atpDocument}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
              onProceedToPromes={() => {
                if (!promesDocument) {
                  setPromesDocument(buildPromesDocumentFromTP(identitas, tpList, atpDocument));
                }
                setCurrentTab('promes');
              }}
            />
          )}

          {currentTab === 'promes' && (
            <PromesDocumentView
              promesData={
                promesDocument ||
                buildPromesDocumentFromTP(
                  identitas,
                  tpList,
                  atpDocument
                )
              }
              onUpdatePromes={setPromesDocument}
              onSaveToArchive={handleSavePromesHistory}
              isSaved={promesDocument ? savedItems.some((s) => s.id === promesDocument.id) : false}
              tpList={tpList}
              atpDocument={atpDocument}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
            />
          )}

          {currentTab === 'modul' && (
            (() => {
              const activeModul = modulAjarDocument || (
                (tpList.length > 0 || (atpDocument && atpDocument.atpList?.length > 0))
                  ? buildDefaultModulAjarFromTP(identitas, tpList, atpDocument, lastRPMOptions)
                  : null
              );

              if (!activeModul) {
                return (
                  <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                      📖
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Belum Ada Tujuan Pembelajaran untuk Modul Ajar
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Silakan lakukan input Capaian Pembelajaran (CP) dan analisis Tujuan Pembelajaran (TP) terlebih dahulu untuk menyusun RPP / Modul Ajar.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('input')}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                    >
                      Buka Form Input CP
                    </button>
                  </div>
                );
              }

              return (
                <ModulAjarView
                  modul={activeModul}
                  onBackToATP={() => setCurrentTab('atp')}
                  onSaveToHistory={handleSaveModulHistory}
                  isSaved={savedItems.some((s) => s.id === activeModul.id)}
                  onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
                  onUpdateIdentitas={handleUpdateIdentitas}
                  onUpdateModul={(updated) => {
                    setModulAjarDocument(updated);
                    if (updated.desainPembelajaranRPM?.pemanfaatanTeknologi) {
                      setLastRPMOptions((prev) => ({
                        ...prev,
                        pemanfaatanPlatform: updated.desainPembelajaranRPM.pemanfaatanTeknologi.platformAplikasi,
                        pemanfaatanPerangkat: updated.desainPembelajaranRPM.pemanfaatanTeknologi.perangkatDigital,
                        pemanfaatanMedia: updated.desainPembelajaranRPM.pemanfaatanTeknologi.mediaDigital,
                      }));
                    }
                  }}
                  onReconfigureRPM={() => handleOpenRPMConfig()}
                  onGoToCPInput={() => setCurrentTab('input')}
                />
              );
            })()
          )}

          {currentTab === 'prompt-media' && (
            <MediaPromptView
              identitas={identitas}
              tpList={tpList}
              onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleUpdateIdentitas}
              onSwitchSubjectWorkspace={loadWorkspaceIntoState}
            />
          )}

          {currentTab === 'soal' && (
            <BankSoalView
              identitas={identitas}
              tpList={tpList}
              atpDocument={atpDocument}
              soalDocument={soalDocument}
              onUpdateSoalDocument={setSoalDocument}
              onSavePermanent={handleSavePermanentSoal}
              isSavedPermanent={soalDocument ? savedItems.some((s) => s.id === soalDocument.id) : false}
              onOpenEditIdentity={() => setIsIdentityModalOpen(true)}
              onUpdateIdentitas={handleIdentitasChange}
              onOpenSubjectPicker={() => setIsSubjectPickerOpen(true)}
              activeAccessRecord={activeAccessRecord}
              onPublishToRuangMurid={handlePublishToRuangMurid}
              onNavigateToRuangMurid={() => handleSwitchPortalMode('murid')}
              onNavigateToRapor={() => setCurrentTab('rapor')}
            />
          )}

          {currentTab === 'saved' && (
            <SavedDocumentsModal
              savedItems={savedItems}
              identitas={identitas}
              onLoadATP={handleLoadATPFromSaved}
              onLoadKKTP={handleLoadKKTPFromSaved}
              onLoadProta={handleLoadProtaFromSaved}
              onLoadPromes={handleLoadPromesFromSaved}
              onLoadModul={handleLoadModulFromSaved}
              onLoadSoal={handleLoadSoalFromSaved}
              onDeleteItem={handleDeleteSavedItem}
              onClearAll={handleClearAllSaved}
              onRestoreBackup={handleRestoreFromBackup}
            />
          )}

          {currentTab === 'rapor' && (
            <AnalisisNilaiRaporView
              identitas={identitas}
              tpList={tpList}
              onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
              onNavigateToMonitoring={() => setIsExamMonitoringModalOpen(true)}
              onNavigateToRuangMurid={() => handleSwitchPortalMode('murid')}
              onUpdateIdentitas={handleUpdateIdentitas}
            />
          )}
            </>
          )}
        </main>
      </div>
      </>
      )}

      {/* Guide / Explanation Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* School & Teacher Profile Edit Modal */}
      <SchoolIdentityModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        identitas={identitas}
        onSave={handleUpdateIdentitas}
        activeAccessRecord={activeAccessRecord}
        onOpenAccessGate={() => {
          setIsIdentityModalOpen(false);
          setIsAccessGateOpen(true);
        }}
      />

      {/* Access Gate Modal (Login / Verification with Kode Akses atau Formulir Pendaftaran - Ruang Guru) */}
      <AccessGateModal
        isOpen={isAccessGateOpen}
        onClose={() => {
          // Jika guru membatalkan tanpa unlock dan belum memiliki sesi terverifikasi, kembalikan ke Portal Selection
          const code = getActiveSessionCode();
          const rec = code && !isDeactivatedLegacyCode(code) ? findAccessRecord(code) : null;
          const isVerified = Boolean(rec && (rec.isActive || rec.status === 'active'));
          if (!isVerified) {
            setPortalMode('selection');
          }
          setIsAccessGateOpen(false);
        }}
        activeRecord={activeAccessRecord}
        onSuccessUnlock={(record) => {
          handleApplyAccessRecord(record);
          setPortalMode('guru');
          setIsAccessGateOpen(false);
        }}
        onSuccess={(record) => {
          handleApplyAccessRecord(record);
          setPortalMode('guru');
          setIsAccessGateOpen(false);
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
      />

      {/* Admin Panel for Google Forms and Access Code Management */}
      <AdminAccessManagerModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onCodeUpdated={() => {
          if (activeAccessRecord) {
            const refreshed = findAccessRecord(activeAccessRecord.kodeAkses);
            if (refreshed) {
              if (refreshed.status === 'inactive' || !refreshed.isActive) {
                setActiveAccessRecord(null);
                showToast(`Kode ${refreshed.kodeAkses} telah dinonaktifkan.`);
              } else {
                setActiveAccessRecord(refreshed);
                const updatedIdentity = convertAccessRecordToIdentity(refreshed, identitas);
                handleUpdateIdentitas(updatedIdentity);
              }
            }
          }
        }}
      />

      {/* Universal Modal: Unduhan Word Dinonaktifkan Admin */}
      <WordDownloadBlockedModal
        isOpen={isWordBlockedNoticeOpen}
        onClose={() => setIsWordBlockedNoticeOpen(false)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
      />

      {/* Pre-Generation RPM Selection Modal (Metode, Mitra, Pemanfaatan Digital, dll.) */}
      {isRPMConfigOpen && (
        <ErrorBoundary
          fallbackTitle="Kendala Membuka Pengaturan Modul"
          onReset={() => setIsRPMConfigOpen(false)}
        >
          <RPMConfigModal
            isOpen={isRPMConfigOpen}
            onClose={() => setIsRPMConfigOpen(false)}
            identitas={identitas}
            tpList={tpList}
            elemenRows={elemenRows}
            atpDocument={atpDocument}
            defaultSelectedTPCodes={pendingTPCodesForModul}
            initialOptions={lastRPMOptions}
            onConfirm={handleConfirmRPMConfig}
            onUpdateIdentitas={(updated) => setIdentitas(updated)}
            onGoToCPInput={() => {
              setIsRPMConfigOpen(false);
              setCurrentTab('input');
            }}
            onOpenSubjectPicker={() => setIsSubjectPickerOpen(true)}
            isLoading={isLoadingModul}
          />
        </ErrorBoundary>
      )}

      {/* Subject Picker Modal: Beralih Mata Pelajaran tanpa kehilangan dokumen tersimpan */}
      {isSubjectPickerOpen && (
        <SubjectPickerModal
          isOpen={isSubjectPickerOpen}
          onClose={() => setIsSubjectPickerOpen(false)}
          currentMataPelajaran={identitas.mataPelajaran}
          currentFase={identitas.fase}
          allowedFase={getAllowedFaseForRecord(activeAccessRecord)}
          activeAccessRecord={activeAccessRecord}
          onSelectSubject={handleSelectSubject}
        />
      )}

      {/* Warning Modal when switching to an unanalyzed subject */}
      {isSubjectWarningOpen && (
        <SubjectAnalysisWarningModal
          isOpen={isSubjectWarningOpen}
          targetFolder={pendingSubjectFolder}
          currentMataPelajaran={identitas.mataPelajaran}
          currentFase={identitas.fase}
          onConfirmStartAnalysis={handleConfirmStartAnalysis}
          onCancel={handleCancelSubjectSwitch}
        />
      )}

      {/* Student Manager Modal: Kelola Peserta Didik (12 Siswa SD Negeri Fatubai), Tambah, Edit, Hapus, Impor/Ekspor CSV, dan Riwayat Nilai */}
      {isStudentManagerOpen && (
        <StudentManagerModal
          isOpen={isStudentManagerOpen}
          onClose={() => setIsStudentManagerOpen(false)}
          classNameTitle={`Kelas ${identitas.kelas || 'VI'} - ${identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}`}
        />
      )}

      {/* Teacher CBT Exam Monitoring & Academic PDF Report Modal (Multi-Device Guru) */}
      <TeacherExamMonitoringModal
        isOpen={isExamMonitoringModalOpen}
        onClose={() => setIsExamMonitoringModalOpen(false)}
        identitas={identitas}
        soalDocument={soalDocument}
        onOpenRaporAnalysis={() => setCurrentTab('rapor')}
        onNavigateToSoalTab={() => {
          setIsExamMonitoringModalOpen(false);
          setCurrentTab('soal');
        }}
      />

      {/* Teacher Learning Material & Media Management Modal (Ruang Guru) */}
      <TeacherKamarBahanAjarModal
        isOpen={isTeacherBahanAjarModalOpen}
        onClose={() => setIsTeacherBahanAjarModalOpen(false)}
        identitas={identitas}
        showToast={showToast}
      />

      {/* Ruang Murid Deactivated by Admin GP-1386 Modal */}
      <RuangMuridDeactivatedModal
        isOpen={isRuangMuridDeactivatedModalOpen}
        onClose={() => {
          setIsRuangMuridDeactivatedModalOpen(false);
          if (portalMode !== 'guru') {
            setPortalMode('selection');
          }
        }}
      />

      {/* Ruang Murid Security Gate Passcode Modal (FTB-123) */}
      <RuangMuridPasscodeModal
        isOpen={isRuangMuridPasscodeModalOpen}
        onClose={() => {
          setIsRuangMuridPasscodeModalOpen(false);
          if (!isStudentAuthenticatedForRuangMurid() && portalMode !== 'murid') {
            setPortalMode('selection');
          }
        }}
        onCancel={() => {
          setIsRuangMuridPasscodeModalOpen(false);
          if (!isStudentAuthenticatedForRuangMurid() && portalMode !== 'murid') {
            setPortalMode('selection');
          }
        }}
        onSuccess={handleStudentPasscodeSuccess}
      />

      {/* Floating Admin Notification for New Access Requests */}
      {pendingAccessCount > 0 && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0 animate-bounce">🔔</span>
            <div className="min-w-0 text-xs leading-tight">
              <span className="font-black text-slate-950 block text-xs sm:text-sm">
                {pendingAccessCount} Permohonan Kode Akses Baru!
              </span>
              <span className="text-[11px] text-amber-950 truncate block font-medium">
                Ada guru mendaftar dari HP/perangkat lain.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminPanelOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 font-black text-xs shrink-0 cursor-pointer shadow-md transition-transform hover:scale-105"
          >
            Buka Panel
          </button>
        </div>
      )}

      {/* Data Integrity & Backup Guardian Modal */}
      <DataIntegrityModal
        isOpen={isDataIntegrityModalOpen}
        onClose={() => setIsDataIntegrityModalOpen(false)}
        identitas={identitas}
        tpList={tpList}
        elemenRows={elemenRows}
        selectedElements={selectedElements}
        atpDocument={atpDocument}
        kktpDocument={kktpDocument}
        protaDocument={protaDocument}
        promesDocument={promesDocument}
        modulAjarDocument={modulAjarDocument}
        soalDocument={soalDocument}
        savedItems={savedItems}
        students={getStudentList()}
        cloudStatus={cloudSyncStatus}
        onRestoreFromBackup={handleRestoreFromBackup}
        onManualCloudSync={handleManualCloudSync}
      />
    </div>
  );
}
