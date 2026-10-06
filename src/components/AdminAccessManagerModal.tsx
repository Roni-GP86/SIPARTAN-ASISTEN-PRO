import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
  Trash2,
  Users,
  Search,
  Check,
  Share2,
  Sparkles,
  Lock,
  AlertCircle,
  Crown,
  MessageCircle,
  Phone,
  Bell,
  Download,
  Upload,
  Database,
  HelpCircle,
  CheckSquare,
  Pencil,
  Save,
  FileText,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import { generateUserAccessListPDF } from '../utils/userAccessPdfGenerator';
import {
  getAllAccessRecords,
  saveAllAccessRecords,
  toggleAccessCodeStatus,
  activateAllAccessCodes,
  deactivateAllAccessCodes,
  deleteAccessCode,
  deleteAccessCodeAsync,
  createNewAccessRecord,
  createNewAccessRecordAsync,
  updateAccessRecord,
  updateAccessRecordAsync,
  MASTER_ACCESS_CODE,
  isMasterAccessCode,
  isPermanentAccessCode,
  isDeactivatedLegacyCode,
  getActiveSessionCode,
  setActiveSessionCode,
  ADMIN_WA_DISPLAY,
  ADMIN_WA_INTL,
  createAdminWhatsAppLink,
  createTeacherWhatsAppLink,
  isWordExportDisabled,
  setWordExportDisabled,
  setWordExportDisabledAsync,
  subscribeToAccessRecordsFromFirestore,
  fetchAllAccessRecordsFromFirestore,
  updateAccessRecordStatusInFirestore,
  saveAccessRecordToFirestore,
  isFirestoreOnline,
  getLastCloudErrorDetail,
  testFirestoreConnectionAsync,
  resetCloudCooldown,
  GURU_MAPEL_SUBJECT_OPTIONS,
  isSubjectTeacher,
} from '../services/accessCodeService';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  FirebaseClientConfig,
} from '../services/firebaseAuth';
import { AccessRecord } from '../types';
import {
  isRuangMuridEnabled,
  setRuangMuridEnabled,
  RUANG_MURID_STUDENT_PASSCODE,
  subscribeToRuangMuridPolicy,
} from '../services/ruangMuridPolicyService';

interface AdminAccessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
  onCodeUpdated?: () => void;
}

export const AdminAccessManagerModal: React.FC<AdminAccessManagerModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudDiagnosticMessage, setCloudDiagnosticMessage] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState('');
  const [showWaPasteInput, setShowWaPasteInput] = useState(false);
  const [waPasteInput, setWaPasteInput] = useState('');

  // Modal Terbitkan Kode Manual
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNamaGuru, setNewNamaGuru] = useState('');
  const [newNipGuru, setNewNipGuru] = useState('');
  const [newJabatan, setNewJabatan] = useState<'Guru Kelas' | 'Guru Mata Pelajaran'>('Guru Kelas');
  const [newMataPelajaran, setNewMataPelajaran] = useState<string>('Pendidikan Agama Katolik dan Budi Pekerti');
  const [newNamaSekolah, setNewNamaSekolah] = useState('');
  const [newNomorWA, setNewNomorWA] = useState('');
  const [newFase, setNewFase] = useState<'Fase A' | 'Fase B' | 'Fase C'>('Fase C');
  const [newKelas, setNewKelas] = useState('5 & 6');
  const [newNamaKS, setNewNamaKS] = useState('');
  const [newNipKS, setNewNipKS] = useState('');

  // Modal Edit Identitas Pengguna (Admin)
  const [editingRecord, setEditingRecord] = useState<AccessRecord | null>(null);
  const [editNamaGuru, setEditNamaGuru] = useState('');
  const [editNipGuru, setEditNipGuru] = useState('');
  const [editNamaSekolah, setEditNamaSekolah] = useState('');
  const [editJabatan, setEditJabatan] = useState<'Guru Kelas' | 'Guru Mata Pelajaran'>('Guru Kelas');
  const [editFase, setEditFase] = useState<'Fase A' | 'Fase B' | 'Fase C'>('Fase C');
  const [editKelas, setEditKelas] = useState('5');
  const [editMataPelajaran, setEditMataPelajaran] = useState('Matematika');
  const [editNamaKS, setEditNamaKS] = useState('');
  const [editNipKS, setEditNipKS] = useState('');
  const [editNomorWA, setEditNomorWA] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Admin Master Authorization Gate
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminCodeInput, setAdminCodeInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AccessRecord | null>(null);
  const [isDeletingCode, setIsDeletingCode] = useState<boolean>(false);

  // Proteksi Keaslian Dokumen: Status Unduhan Word
  const [isWordDisabled, setIsWordDisabled] = useState<boolean>(() => isWordExportDisabled());
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [isRuangMuridActive, setIsRuangMuridActive] = useState<boolean>(() => isRuangMuridEnabled());
  const [selectedSchoolForPdf, setSelectedSchoolForPdf] = useState<string>('ALL');
  const [pdfLogoBase64, setPdfLogoBase64] = useState<string>(() => {
    try {
      return localStorage.getItem('sipartan_admin_pdf_logo_v1') || '';
    } catch {
      return '';
    }
  });

  const refreshList = async () => {
    resetCloudCooldown();
    const list = getAllAccessRecords();
    setRecords(list);
    setIsWordDisabled(isWordExportDisabled());
    setIsRuangMuridActive(isRuangMuridEnabled());
    if (onDataChanged) onDataChanged();

    // Ambil data terbaru dari Cloud Firestore
    try {
      setIsSyncingFirestore(true);
      const cloudList = await fetchAllAccessRecordsFromFirestore();
      if (cloudList && cloudList.length > 0) {
        setRecords(cloudList);
      }
    } catch (err) {
      console.warn('[Firestore] Info sinkronisasi data cloud:', err);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      const currentSession = getActiveSessionCode();
      if (isMasterAccessCode(currentSession)) {
        setIsAdminUnlocked(true);
      } else {
        setIsAdminUnlocked(false);
      }

      // Uji status konektivitas Firestore di latar belakang
      testFirestoreConnectionAsync()
        .then((res) => {
          setCloudSyncStatus(res.success ? 'online' : 'offline');
          setCloudDiagnosticMessage(res.message);
        })
        .catch(() => {
          setCloudSyncStatus('offline');
        });

      // Realtime listener dari Cloud Firestore
      const unsubscribe = subscribeToAccessRecordsFromFirestore((cloudRecords) => {
        setRecords(cloudRecords);
      });

      const unsubRuangMurid = subscribeToRuangMuridPolicy((enabled) => {
        setIsRuangMuridActive(enabled);
      });

      return () => {
        unsubscribe();
        unsubRuangMurid();
      };
    } else {
      setAdminCodeInput('');
      setAdminAuthError(null);
      setDeleteConfirmTarget(null);
    }
  }, [isOpen]);

  const handleUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDeactivatedLegacyCode(adminCodeInput)) {
      setAdminAuthError('Kode "GP-86OK" telah dinonaktifkan/kadaluarsa secara permanen. Silakan masukkan Kode Master Admin resmi yang baru (GP-1386).');
      return;
    }
    if (isMasterAccessCode(adminCodeInput)) {
      setIsAdminUnlocked(true);
      setActiveSessionCode(MASTER_ACCESS_CODE);
      setAdminAuthError(null);
      refreshList();
    } else {
      setAdminAuthError('Kode Akses Master tidak valid. Akses administrator ditolak.');
    }
  };

  if (!isOpen) return null;

  const handleToggleStatus = async (code: string) => {
    if (isMasterAccessCode(code)) {
      setNotification({ type: 'error', text: 'Kode Master Admin & Pengembang selalu aktif dan tidak dapat dinonaktifkan.' });
      return;
    }
    const updated = toggleAccessCodeStatus(code);
    if (updated) {
      await updateAccessRecordStatusInFirestore(updated.id, updated.isActive, updated.kodeAkses);
    }
    await refreshList();
    if (onDataChanged) onDataChanged();

    if (updated?.isActive) {
      setNotification({
        type: 'success',
        text: `Kode akses ${code} (${updated.namaGuru}) BERHASIL DIAKTIFKAN di Cloud Firestore! Anda dapat langsung mengirim kode ke WA Guru atau WA Admin (${ADMIN_WA_DISPLAY}).`,
      });
    } else {
      setNotification({
        type: 'success',
        text: `Kode akses ${code} berhasil DINONAKTIFKAN di Cloud Firestore.`,
      });
    }
  };

  const handleActivateAll = async () => {
    activateAllAccessCodes();
    await refreshList();
    if (onDataChanged) onDataChanged();
    setNotification({ type: 'success', text: 'Seluruh kode akses berhasil DIAKTIFKAN di Cloud Firestore.' });
  };

  const handleDeactivateAll = async () => {
    deactivateAllAccessCodes(false); // keep master code safe
    await refreshList();
    if (onDataChanged) onDataChanged();
    setNotification({ type: 'success', text: 'Seluruh kode akses guru berhasil DINONAKTIFKAN (Kode Master Administrator tetap aktif).' });
  };

  const handleToggleWordExport = async () => {
    const nextState = !isWordDisabled;
    setIsWordDisabled(nextState);
    const res = await setWordExportDisabledAsync(nextState);
    if (onDataChanged) onDataChanged();

    setNotification({
      type: res.cloudSynced ? 'success' : 'error',
      text: res.message,
    });
    if (res.cloudSynced) {
      setCloudSyncStatus('online');
    }
  };

  const handleToggleRuangMurid = async () => {
    const nextState = !isRuangMuridActive;
    setIsRuangMuridActive(nextState);
    const res = await setRuangMuridEnabled(nextState, MASTER_ACCESS_CODE);
    if (onDataChanged) onDataChanged();

    setNotification({
      type: res.cloudSynced ? 'success' : 'error',
      text: res.message,
    });
    if (res.cloudSynced) {
      setCloudSyncStatus('online');
    }
  };

  const handleDelete = (code: string) => {
    if (isMasterAccessCode(code) || isPermanentAccessCode(code)) {
      setNotification({
        type: 'error',
        text: 'Akun ini adalah Akun Resmi Permanen sistem dan tidak dapat dihapus. Anda dapat mengubah statusnya menjadi nonaktif jika ingin menonaktifkan akses guru.',
      });
      return;
    }
    const target = records.find((r) => r.kodeAkses.toUpperCase().trim() === code.toUpperCase().trim());
    if (target?.isPermanent) {
      setNotification({
        type: 'error',
        text: 'Akun ini adalah Akun Resmi Permanen sistem dan tidak dapat dihapus.',
      });
      return;
    }
    if (target) {
      setDeleteConfirmTarget(target);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmTarget || isDeletingCode) return;
    const target = deleteConfirmTarget;
    const code = target.kodeAkses;
    const teacherName = target.namaGuru;
    setIsDeletingCode(true);

    try {
      // 1. Optimistic removal from UI list
      setRecords((prev) =>
        prev.filter(
          (r) =>
            r.kodeAkses.toUpperCase().trim() !== code.toUpperCase().trim() &&
            r.id !== target.id
        )
      );

      // 2. Direct Firestore and local deletion
      const success = await deleteAccessCodeAsync(code);
      if (success) {
        setNotification({
          type: 'success',
          text: `Kode akses ${code} (${teacherName}) berhasil dihapus permanen dari Cloud Firestore dan seluruh perangkat.`,
        });
        if (onDataChanged) onDataChanged();
      } else {
        setNotification({
          type: 'error',
          text: `Gagal menghapus kode akses ${code} dari Cloud Firestore.`,
        });
        refreshList();
      }
    } catch (err: any) {
      console.error('[Firestore] Gagal menghapus kode akses:', err);
      setNotification({
        type: 'error',
        text: `Terjadi kendala saat menghapus kode ${code}: ${err?.message || 'Error'}`,
      });
      refreshList();
    } finally {
      setDeleteConfirmTarget(null);
      setIsDeletingCode(false);
    }
  };

  const handleCreateManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNamaGuru.trim() || !newNamaSekolah.trim()) {
      setNotification({ type: 'error', text: 'Nama Guru dan Nama Sekolah wajib diisi.' });
      return;
    }

    try {
      const isMapel = newJabatan === 'Guru Mata Pelajaran';
      const created = await createNewAccessRecordAsync({
        namaGuru: newNamaGuru.trim(),
        nipGuru: newNipGuru.trim() || '-',
        jabatan: newJabatan,
        namaSekolah: newNamaSekolah.trim(),
        fase: isMapel ? 'Fase C' : newFase,
        kelas: isMapel ? '1 - 6' : newKelas,
        mataPelajaran: isMapel ? newMataPelajaran : 'Matematika',
        namaKepalaSekolah: newNamaKS.trim() || '-',
        nipKepalaSekolah: newNipKS.trim() || '-',
        nomorHpPendaftar: newNomorWA.trim(),
        sumberPendaftaran: 'Input Langsung',
        autoActivate: true,
      });

      setRecords((prev) => [created, ...prev.filter((r) => r.kodeAkses !== created.kodeAkses)]);
      setShowAddModal(false);
      setNewNamaGuru('');
      setNewNipGuru('');
      setNewNamaSekolah('');
      setNewNomorWA('');
      setNewNamaKS('');
      setNewNipKS('');

      if (created.cloudSynced === false && created.cloudError) {
        setNotification({
          type: 'error',
          text: `⚠️ Kode ${created.kodeAkses} tersimpan di memori perangkat ini, namun gagal dikirim ke Cloud: ${created.cloudError}. Periksa aturan Firestore atau klik tombol "Tes Koneksi Cloud".`,
        });
      } else {
        setNotification({
          type: 'success',
          text: `✅ Kode ${created.kodeAkses} (${created.namaGuru}) BERHASIL TERSIMPAN DI CLOUD FIRESTORE & DIAKTIFKAN! Pengguna di HP/Laptop mana pun kini dapat langsung masuk menggunakan kode ${created.kodeAkses}.`,
        });
      }
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Gagal menerbitkan kode ke Cloud Firestore: ${err.message}`,
      });
    }
  };

  const handleOpenEdit = (r: AccessRecord) => {
    setEditingRecord(r);
    setEditNamaGuru(r.namaGuru || '');
    setEditNipGuru(r.nipGuru && r.nipGuru !== '-' ? r.nipGuru : '');
    setEditNamaSekolah(r.namaSekolah || r.namaSatuanPendidikan || '');
    setEditJabatan(r.jabatan || 'Guru Kelas');
    setEditFase(r.fase || 'Fase C');
    setEditKelas(r.kelas || (r.fase === 'Fase A' ? '1' : r.fase === 'Fase B' ? '3' : '5'));
    setEditMataPelajaran(r.mataPelajaran || 'Matematika');
    setEditNamaKS(r.namaKepalaSekolah && r.namaKepalaSekolah !== '-' ? r.namaKepalaSekolah : '');
    setEditNipKS(r.nipKepalaSekolah && r.nipKepalaSekolah !== '-' ? r.nipKepalaSekolah : '');
    setEditNomorWA(r.nomorHpPendaftar || '');
    setEditIsActive(Boolean(r.isActive));
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editNamaGuru.trim() || !editNamaSekolah.trim()) {
      setEditErrorMsg('Nama Guru dan Nama Satuan Pendidikan wajib diisi.');
      return;
    }

    setIsSavingEdit(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const isMapel = editJabatan === 'Guru Mata Pelajaran';
      const selectedFase = isMapel ? (editFase || 'Fase C') : editFase;
      const selectedKelas = isMapel ? '1 - 6' : (editKelas.trim() || (editFase === 'Fase A' ? '1' : editFase === 'Fase B' ? '3' : '5'));

      const res = await updateAccessRecordAsync(editingRecord.kodeAkses, {
        namaGuru: editNamaGuru.trim(),
        nipGuru: editNipGuru.trim() || '-',
        namaSekolah: editNamaSekolah.trim(),
        namaSatuanPendidikan: editNamaSekolah.trim(),
        jabatan: editJabatan,
        fase: selectedFase,
        kelas: selectedKelas,
        mataPelajaran: isMapel ? editMataPelajaran.trim() : (editingRecord.mataPelajaran || 'Matematika'),
        namaKepalaSekolah: editNamaKS.trim() || '-',
        nipKepalaSekolah: editNipKS.trim() || '-',
        nomorHpPendaftar: editNomorWA.trim(),
        isActive: editIsActive,
        status: editIsActive ? 'active' : 'inactive',
        isLockedByAdmin: true,
        adminLastEditedAt: new Date().toISOString(),
      });

      if (res.success && res.record) {
        setRecords((prev) =>
          prev.map((item) => (item.id === res.record!.id || item.kodeAkses === res.record!.kodeAkses ? res.record! : item))
        );

        const successText = `✅ Identitas ${res.record.namaGuru} (${res.record.kodeAkses}) Kelas ${res.record.kelas} (${res.record.fase}) berhasil diperbarui dan tersimpan permanen!`;
        setEditSuccessMsg(successText);
        setNotification({
          type: 'success',
          text: `Identitas ${res.record.namaGuru} (${res.record.kodeAkses}) Kelas ${res.record.kelas} (${res.record.fase}) berhasil tersimpan permanen di Cloud Firestore & perangkat. Tampilan RPP/RPM pengguna otomatis disesuaikan!`,
        });
        if (onDataChanged) onDataChanged();

        setIsSavingEdit(false);
        setTimeout(() => {
          setEditingRecord(null);
        }, 1000);
      } else {
        setEditErrorMsg(res.error || 'Gagal menyimpan perubahan ke Cloud Firestore.');
        setIsSavingEdit(false);
      }
    } catch (err: any) {
      console.error('[Admin] Error saving edit:', err);
      setEditErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menyimpan data.');
      setIsSavingEdit(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTeacherActivationWAMessage = (record: AccessRecord) => {
    const penugasanText = record.jabatan === 'Guru Mata Pelajaran'
      ? `Guru Mata Pelajaran (${record.mataPelajaran || 'Pendidikan Agama Katolik'} - Kelas 1 s.d. 6 / Fase A-C)`
      : `Guru Kelas (${record.fase} - Kelas ${record.kelas})`;

    return `Halo Bapak/Ibu ${record.namaGuru},\n\nKabar baik! Permohonan Kode Akses SIPARTAN Anda telah DIVERIFIKASI & DIAKTIFKAN oleh Administrator (${ADMIN_WA_DISPLAY}):\n\n🔑 KODE AKSES: *${record.kodeAkses}*\n🏫 Satuan Pendidikan: ${record.namaSekolah}\n📚 Penugasan: ${penugasanText}\n👤 Kepala Sekolah: ${record.namaKepalaSekolah}\n📱 Nomor WA: ${record.nomorHpPendaftar || '-'}\nStatus: *AKTIF*\n\nSilakan buka aplikasi SIPARTAN, klik menu *"Masuk ke SIPARTAN"*, lalu masukkan kode: *${record.kodeAkses}*.\nIdentitas resmi Anda otomatis terkunci permanen pada cover dan seluruh dokumen.\n\nSelamat menyusun perangkat pembelajaran!`;
  };

  const handleCopyWAMessage = (record: AccessRecord) => {
    const text = getTeacherActivationWAMessage(record);
    navigator.clipboard.writeText(text);
    setCopiedCode(record.kodeAkses + '-wa');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Permintaan baru yang menunggu aktivasi (bukan akun master dan belum aktif)
  const pendingRequests = records.filter(
    (r) => !r.isActive && !r.isPremiumMaster && !isMasterAccessCode(r.kodeAkses)
  );

  const handleActivateAllPending = () => {
    if (pendingRequests.length === 0) return;
    const now = new Date().toISOString();
    const next = records.map((r) => {
      if (!r.isActive && !r.isPremiumMaster && !isMasterAccessCode(r.kodeAkses)) {
        return {
          ...r,
          isActive: true,
          status: 'active' as const,
          tanggalAktivasi: r.tanggalAktivasi || now,
        };
      }
      return r;
    });
    setRecords(next);
    saveAllAccessRecords(next);
    // Sinkronkan ke Cloud Firestore
    pendingRequests.forEach((rec) => {
      updateAccessRecordStatusInFirestore(rec.id, true, rec.kodeAkses).catch(() => {});
    });
    setNotification({
      type: 'success',
      text: `Berhasil mengaktifkan ${pendingRequests.length} permohonan kode akses guru baru! Data tersimpan permanen.`,
    });
    if (onDataChanged) onDataChanged();
  };

  const handleTestCloudConnection = async () => {
    setIsTestingCloud(true);
    setCloudDiagnosticMessage(null);
    setCloudSyncStatus('checking');
    try {
      const res = await testFirestoreConnectionAsync();
      setCloudDiagnosticMessage(res.message);
      setCloudSyncStatus(res.success ? 'online' : 'offline');
      setNotification({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        refreshList();
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal tersambung ke Cloud Firestore.';
      setCloudDiagnosticMessage(msg);
      setCloudSyncStatus('offline');
      setNotification({ type: 'error', text: msg });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleSaveCustomConfig = async () => {
    if (!customConfigInput.trim()) {
      setNotification({ type: 'error', text: 'Silakan masukkan objek konfigurasi Firebase Anda.' });
      return;
    }
    try {
      let parsed: any;
      let text = customConfigInput.trim();
      // Bersihkan jika user mem-paste "const firebaseConfig = { ... };"
      if (text.includes('=')) {
        text = text.substring(text.indexOf('=') + 1).trim();
      }
      if (text.endsWith(';')) {
        text = text.slice(0, -1).trim();
      }
      // Mendukung format JSON ataupun JS object
      try {
        parsed = JSON.parse(text);
      } catch {
        // Coba evaluasi safe object
        const fn = new Function(`return (${text})`);
        parsed = fn();
      }

      if (!parsed?.projectId || !parsed?.apiKey) {
        throw new Error('Konfigurasi harus menyertakan "projectId" dan "apiKey".');
      }

      saveCustomFirebaseConfig(parsed);
      setShowConfigModal(false);
      setNotification({
        type: 'success',
        text: `Konfigurasi Firebase untuk project "${parsed.projectId}" berhasil disimpan! Menguji koneksi...`,
      });
      setTimeout(() => {
        handleTestCloudConnection();
      }, 500);
    } catch (e: any) {
      setNotification({
        type: 'error',
        text: `Format konfigurasi tidak valid: ${e.message}`,
      });
    }
  };

  const handleResetConfig = () => {
    clearCustomFirebaseConfig();
    setShowConfigModal(false);
    setNotification({
      type: 'success',
      text: 'Konfigurasi Firebase dikembalikan ke konfigurasi bawaan aplikasi. Menguji koneksi...',
    });
    setTimeout(() => {
      handleTestCloudConnection();
    }, 500);
  };

  const handleDownloadConfigJson = () => {
    const config = getActiveFirebaseConfig();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'firebase-applet-config.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setNotification({
      type: 'success',
      text: 'File "firebase-applet-config.json" berhasil diunduh! Anda dapat menyertakannya di folder root proyek sebelum deploy ke Netlify.',
    });
  };

  const handleParseWaPaste = () => {
    if (!waPasteInput.trim()) return;
    const text = waPasteInput;

    const findMatch = (pattern: RegExp) => {
      const match = text.match(pattern);
      return match && match[1] ? match[1].trim() : '';
    };

    const nama = findMatch(/(?:Nama\s+Guru|Nama\s+Lengkap)[\s:]+([^\n\r]+)/i);
    const nip = findMatch(/(?:NIP\s+Guru|NIP)[\s:]+([^\n\r]+)/i);
    const sekolah = findMatch(/(?:Satuan\s+Pendidikan|Nama\s+Sekolah|Sekolah)[\s:]+([^\n\r]+)/i);
    const wa = findMatch(/(?:Nomor\s+WA|WhatsApp|No\s+WA|HP)[\s:]+([0-9\+\-\s]+)/i);
    const ks = findMatch(/(?:Kepala\s+Sekolah|Nama\s+KS)[\s:]+([^\n\r\(]+)/i);
    const nipKs = findMatch(/(?:NIP\s+Kepala\s+Sekolah|NIP\s+KS|NIP:\s*)([0-9\-\s]+)/i);

    if (nama) setNewNamaGuru(nama);
    if (nip) setNewNipGuru(nip);
    if (sekolah) setNewNamaSekolah(sekolah);
    if (wa) setNewNomorWA(wa.replace(/[^0-9]/g, ''));
    if (ks) setNewNamaKS(ks);
    if (nipKs) setNewNipKS(nipKs);

    if (text.includes('Fase A')) {
      setNewFase('Fase A');
      setNewKelas(text.includes('Kelas 1') ? '1' : '2');
    } else if (text.includes('Fase B')) {
      setNewFase('Fase B');
      setNewKelas(text.includes('Kelas 4') ? '4' : '3');
    } else if (text.includes('Fase C')) {
      setNewFase('Fase C');
      setNewKelas(text.includes('Kelas 6') ? '6' : '5');
    }

    if (text.includes('Guru Mata Pelajaran')) {
      setNewJabatan('Guru Mata Pelajaran');
    } else {
      setNewJabatan('Guru Kelas');
    }

    setShowWaPasteInput(false);
    setWaPasteInput('');
    setNotification({
      type: 'success',
      text: 'Format teks pesan WhatsApp berhasil diekstrak otomatis ke formulir pendaftaran guru!',
    });
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `sipartan_cadangan_kode_guru_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setNotification({ type: 'success', text: 'Cadangan data kode akses guru berhasil diunduh dalam format JSON.' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const map = new Map<string, AccessRecord>();
          records.forEach((r) => {
            if (r.kodeAkses) map.set(r.kodeAkses.toUpperCase().trim(), r);
          });
          parsed.forEach((r: AccessRecord) => {
            if (r.kodeAkses) {
              const clean = r.kodeAkses.toUpperCase().trim();
              map.set(clean, { ...r, status: r.isActive ? 'active' : 'inactive' });
              saveAccessRecordToFirestore(r).catch(() => {});
            }
          });
          const merged = Array.from(map.values());
          setRecords(merged);
          saveAllAccessRecords(merged);
          setNotification({
            type: 'success',
            text: `Berhasil mengimpor ${parsed.length} kode akses guru! Data tersimpan permanen.`,
          });
          if (onDataChanged) onDataChanged();
        } else {
          setNotification({ type: 'error', text: 'Format file cadangan tidak valid (harus array JSON).' });
        }
      } catch {
        setNotification({ type: 'error', text: 'Gagal membaca file cadangan. Pastikan file JSON valid.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Daftar seluruh nama sekolah / satuan pendidikan yang memiliki data pendidik terdaftar
  const availableSchools = Array.from(
    new Set(
      records
        .map((r) => (r.namaSekolah || r.namaSatuanPendidikan || '').trim())
        .filter((s) => s.length > 0)
    )
  ).sort();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Ukuran file logo maksimal 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPdfLogoBase64(base64);
      try {
        localStorage.setItem('sipartan_admin_pdf_logo_v1', base64);
      } catch {}
      setNotification({
        type: 'success',
        text: 'Logo Kop Surat berhasil diunggah! Logo ini akan otomatis dicetak pada Kop Dokumen PDF.',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setPdfLogoBase64('');
    try {
      localStorage.removeItem('sipartan_admin_pdf_logo_v1');
    } catch {}
    setNotification({
      type: 'success',
      text: 'Logo Kop Surat telah dihapus dari template cetak PDF.',
    });
  };

  const handleDownloadPdfBySchool = () => {
    let targetRecords: AccessRecord[];
    let targetSchoolName = selectedSchoolForPdf;

    if (selectedSchoolForPdf === 'ALL' || !selectedSchoolForPdf) {
      targetRecords = records;
      targetSchoolName = 'Semua Satuan Pendidikan';
    } else {
      targetRecords = records.filter(
        (r) =>
          (r.namaSekolah || r.namaSatuanPendidikan || '').toLowerCase().trim() ===
          selectedSchoolForPdf.toLowerCase().trim()
      );
    }

    if (targetRecords.length === 0) {
      setNotification({
        type: 'error',
        text: `Tidak ada data pengguna terdaftar untuk sekolah "${targetSchoolName}".`,
      });
      return;
    }

    try {
      generateUserAccessListPDF({
        schoolName: targetSchoolName,
        records: targetRecords,
        logoBase64: pdfLogoBase64 || undefined,
      });
      setNotification({
        type: 'success',
        text: `📄 Laporan PDF Rekap Kode Akses untuk "${targetSchoolName}" (${targetRecords.length} guru) berhasil diunduh!`,
      });
    } catch (e: any) {
      console.error(e);
      setNotification({
        type: 'error',
        text: `Gagal menghasilkan dokumen PDF: ${e?.message || 'Error'}`,
      });
    }
  };

  // Filtered records
  const filtered = records.filter((r) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      (r.kodeAkses || '').toLowerCase().includes(q) ||
      (r.namaGuru || '').toLowerCase().includes(q) ||
      (r.namaSekolah || '').toLowerCase().includes(q) ||
      (r.nipGuru && r.nipGuru.includes(searchQuery));

    if (!matchesSearch) return false;
    if (filterStatus === 'ACTIVE') return r.isActive;
    if (filterStatus === 'INACTIVE') return !r.isActive;
    if (filterStatus === 'PENDING') return !r.isActive && !r.isPremiumMaster && !isMasterAccessCode(r.kodeAkses);
    return true;
  });

  const totalActive = records.filter((r) => r.isActive).length;
  const totalInactive = records.length - totalActive;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-blue-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Panel Kontrol Admin &amp; Keamanan SIPARTAN</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500 text-white uppercase tracking-wider">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Pusat Manajemen Cloud Firestore, Penerbitan, Aktivasi &amp; Pengendalian Akses Multi-Perangkat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Tutup Panel
          </button>
        </div>

        {/* Body Content */}
        {!isAdminUnlocked ? (
          <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-lg my-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-md ring-4 ring-amber-400/20 border border-amber-400/40">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Otorisasi Administrator &amp; Pengembang
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Panel manajemen kode akses, aktivasi/deaktivasi, dan sinkronisasi Cloud Firestore ini dilindungi khusus untuk <strong>Admin &amp; Pengembang Aplikasi</strong> (Bapak Roni Hariyanto Bhidju, S. Pd).
                </p>
              </div>

              {adminAuthError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2 text-left animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockAdmin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-left">
                    Masukkan Kode Akses Master Admin:
                  </label>
                  <input
                    type="password"
                    value={adminCodeInput}
                    onChange={(e) => {
                      setAdminCodeInput(e.target.value.toUpperCase());
                      setAdminAuthError(null);
                    }}
                    placeholder="Masukkan Kode Master Rahasia"
                    className="w-full px-4 py-3 text-sm font-mono font-bold tracking-widest text-center bg-white text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 shadow-xs"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:brightness-110 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Buka Panel Administrator</span>
                </button>
              </form>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Kode master bersifat rahasia dan wajib dijaga kerahasiaannya.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Master Admin Status Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>Otorisasi Administrator Master Aktif</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-mono font-black">
                      {MASTER_ACCESS_CODE}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    Selamat bertugas, Bapak Roni Hariyanto Bhidju, S. Pd. Anda memiliki hak kendali penuh untuk mengaktifkan/menonaktifkan akun guru serta sinkronisasi Cloud Firestore.
                  </div>
                </div>
              </div>

              {/* Firestore Cloud Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-2xs shrink-0">
                <span className={`w-2 h-2 rounded-full ${isFirestoreOnline() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`}></span>
                <span>{isFirestoreOnline() ? 'Cloud Firestore: Online (Sinkron Realtime)' : 'Cloud Firestore: Menunggu Database Dibuat'}</span>
              </div>
            </div>

            {/* Permintaan Baru Menunggu Persetujuan Admin */}
            {pendingRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500 text-amber-950 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs animate-bounce">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      <span>{pendingRequests.length} Permintaan Kode Akses Guru Baru Menunggu Verifikasi!</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                        Perlu Tindakan
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-0.5 font-medium">
                      Guru telah mendaftar melalui perangkat mereka. Klik tombol di samping untuk langsung mengaktifkan semua permohonan baru dan simpan permanen.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleActivateAllPending}
                    className="px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktifkan Semua ({pendingRequests.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('PENDING')}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-amber-300 shadow-xs cursor-pointer"
                  >
                    Lihat Antrean
                  </button>
                </div>
              </div>
            )}

            {/* Status & Panduan Cloud Firestore Multi-Device Hub */}
            <div className={`p-4 rounded-2xl border text-xs space-y-3 shadow-2xs transition-all ${
              cloudSyncStatus === 'online'
                ? 'bg-emerald-50/70 border-emerald-300'
                : cloudSyncStatus === 'offline'
                ? 'bg-amber-50/90 border-amber-300'
                : 'bg-blue-50/70 border-blue-200'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0 mt-0.5 ${
                    cloudSyncStatus === 'online'
                      ? 'bg-emerald-600'
                      : cloudSyncStatus === 'offline'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Sinkronisasi Online Multi-Perangkat (Firebase Firestore)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider ${
                        cloudSyncStatus === 'online'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : cloudSyncStatus === 'offline'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {cloudSyncStatus === 'online'
                          ? '● ONLINE & TERHUBUNG'
                          : cloudSyncStatus === 'offline'
                          ? '● OFFLINE / PERLU PERHATIAN'
                          : '○ MEMERIKSA STATUS...'}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed text-slate-600">
                      {cloudSyncStatus === 'online' ? (
                        <span className="text-emerald-900 font-medium">
                          Database aktif pada project <strong className="font-mono">{getActiveFirebaseConfig().projectId}</strong>. Seluruh perubahan status (unduh Word, Ruang Murid) dan pendaftaran guru otomatis tersinkronisasi langsung ke link Netlify dan HP/Laptop teman.
                        </span>
                      ) : cloudSyncStatus === 'offline' ? (
                        <span className="text-amber-950 font-medium">
                          Aplikasi saat ini hanya menyimpan data di perangkat ini. Database Firestore di project <strong className="font-mono">{getActiveFirebaseConfig().projectId}</strong> belum aktif atau tidak dapat diakses, sehingga gawai teman belum menerima perubahan.
                        </span>
                      ) : (
                        <span>Sedang menguji konektivitas real-time ke Cloud Firestore...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={handleTestCloudConnection}
                    disabled={isTestingCloud}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingCloud ? 'animate-spin' : ''}`} />
                    <span>{isTestingCloud ? 'Menguji...' : 'Tes Koneksi Cloud'}</span>
                  </button>
                  <a
                    href={`https://console.firebase.google.com/project/${getActiveFirebaseConfig().projectId}/firestore`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-300 inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Buka Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomConfigInput(JSON.stringify(getActiveFirebaseConfig(), null, 2));
                      setShowConfigModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-700" />
                    <span>Konfigurasi Firebase &amp; Netlify</span>
                  </button>
                </div>
              </div>

              {(getLastCloudErrorDetail() || cloudDiagnosticMessage) && (
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-1 ${
                  cloudSyncStatus === 'online'
                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                    : 'bg-amber-100/80 border-amber-300 text-amber-950'
                }`}>
                  <div className="font-bold flex items-center gap-1 text-slate-900">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                    <span>Diagnostik Konektivitas Cloud:</span>
                  </div>
                  <p className="font-mono text-[10.5px] whitespace-pre-wrap">{cloudDiagnosticMessage || getLastCloudErrorDetail()}</p>
                </div>
              )}
            </div>

            {/* Notification Banner */}
          {notification && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold flex-1">{notification.text}</div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Section 1: Pusat Sinkronisasi Cloud Firestore & Tindakan Cepat */}
          <div className="p-5 rounded-2xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-800/60 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/40 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-inner">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white tracking-wide">Pusat Cloud Firestore Real-Time</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                      Online Multi-User
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/80">
                    Semua pendaftaran dan status kode akses tersimpan online di project <strong className="font-mono text-amber-300">{getActiveFirebaseConfig().projectId}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestCloudConnection}
                  disabled={isTestingCloud}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingCloud ? 'animate-spin' : ''}`} />
                  <span>{isTestingCloud ? 'Menguji...' : 'Tes Koneksi Cloud'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomConfigInput(JSON.stringify(getActiveFirebaseConfig(), null, 2));
                    setShowConfigModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 font-bold text-xs border border-blue-400/30 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pengaturan Firebase</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-blue-300">Pendaftaran Otomatis</div>
                <div className="text-white text-[11px] leading-relaxed">
                  Guru mendaftar langsung di formulir aplikasi di perangkat masing-masing tanpa perlu Google Form.
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-300">Notifikasi Masuk Admin</div>
                <div className="text-white text-[11px] leading-relaxed">
                  Notifikasi bunyi bel &amp; badge permohonan baru otomatis muncul di panel Admin saat ada guru mendaftar.
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-amber-300">Aktivasi Real-Time</div>
                <div className="text-white text-[11px] leading-relaxed">
                  Sekali Admin klik &quot;Aktifkan&quot;, akun guru di perangkat manapun langsung otomatis terbuka.
                </div>
              </div>
            </div>
          </div>

          {/* Section: Proteksi Unduhan Word (Pencegahan Pengeditan Data via Word) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-xs ${
              isWordDisabled
                ? 'bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 border-amber-400'
                : 'bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-blue-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                    isWordDisabled
                      ? 'bg-amber-500 text-white border-amber-600 ring-4 ring-amber-400/20'
                      : 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-500/10'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      Proteksi Data: Izin Unduhan Dokumen Word (.doc)
                    </h4>
                    {isWordDisabled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 border border-amber-400/80 shadow-2xs">
                        <Lock className="w-3 h-3 text-amber-900" />
                        DINONAKTIFKAN ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        DIIZINKAN (AKTIF)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {isWordDisabled ? (
                      <>
                        <strong className="text-amber-950">Fitur unduhan Word telah dimatikan.</strong> Pengguna yang mengklik tombol unduh Word akan dicegat dengan notifikasi:{' '}
                        <em className="text-amber-900 font-semibold">
                          "unduhan word di nonaktifkan oleh admin! (hal ini mencegah pengeditan data via word!)"
                        </em>
                        . Guru/pengguna hanya diizinkan mengunduh dokumen resmi dalam format <strong>PDF Siap Cetak</strong>.
                      </>
                    ) : (
                      <>
                        Saat ini pengguna dapat mengunduh dokumen dalam format Word (.doc) dan PDF. Klik tombol di samping untuk menonaktifkan unduhan Word{' '}
                        <strong className="text-slate-800">guna mencegah modifikasi/pengeditan data kurikulum di luar sistem SIPARTAN</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={handleToggleWordExport}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isWordDisabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-900/20'
                      : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-amber-900/20'
                  }`}
                >
                  {isWordDisabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-200" />
                      <span>Aktifkan Kembali Unduhan Word</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-amber-200" />
                      <span>Nonaktifkan Unduhan Word</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Pengaturan Ruang Murid (CBT) & Kode Masuk Siswa Permanen (FTB-123) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-xs ${
              isRuangMuridActive
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border-emerald-300'
                : 'bg-gradient-to-br from-rose-50 via-amber-50/40 to-slate-50 border-rose-300'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                    isRuangMuridActive
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-500/10'
                      : 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-500/10'
                  }`}
                >
                  {isRuangMuridActive ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      Ruang Murid (CBT): Akses Asesmen &amp; Evaluasi Siswa
                    </h4>
                    {isRuangMuridActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        RUANG MURID AKTIF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
                        <Lock className="w-3 h-3 text-rose-700" />
                        DINONAKTIFKAN ADMIN (GP-1386)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {isRuangMuridActive ? (
                      <>
                        Ruang Murid saat ini <strong>terbuka untuk 12 siswa Kelas 6 SDN Fatubai</strong>. Siswa wajib memasukkan kode unik peserta didik <strong className="font-mono text-emerald-800 font-black">{RUANG_MURID_STUDENT_PASSCODE}</strong> saat masuk.
                      </>
                    ) : (
                      <>
                        <strong className="text-rose-900">Ruang Murid dinonaktifkan oleh Admin.</strong> Ketika user/siswa mengklik Ruang Murid, sistem menampilkan kartu informasi beremoticon:{' '}
                        <em className="text-rose-900 font-semibold">
                          "Mohon maaf, fitur ini tersedia khusus untuk murid Kelas 6 SDN Fatubai."
                        </em>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={handleToggleRuangMurid}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isRuangMuridActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-rose-900/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-900/20'
                  }`}
                >
                  {isRuangMuridActive ? (
                    <>
                      <ToggleLeft className="w-4 h-4 text-rose-200" />
                      <span>Nonaktifkan Ruang Murid</span>
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-200" />
                      <span>Aktifkan Kembali Ruang Murid</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Permanent Student Access Code Display Card (Khusus Master Admin) */}
            <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/90 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-0.5">
                  🔑
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-900 flex flex-wrap items-center gap-1.5">
                    <span>KODE AKSES RESMI PESERTA DIDIK (DISAMPAIKAN LISAN):</span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-mono font-black text-xs border border-amber-300">
                      {RUANG_MURID_STUDENT_PASSCODE}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-amber-900/90 mt-1 leading-relaxed">
                    <strong>Hanya ada di Akun Master Admin:</strong> Sampaikan kode ini secara <em>lisan langsung</em> kepada murid di kelas saat akan memulai asesmen. Kode ini tidak pernah ditampilkan di kartu input murid guna mencegah pihak luar masuk dan merusak daftar nilai siswa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(RUANG_MURID_STUDENT_PASSCODE);
                    setCopiedCode(RUANG_MURID_STUDENT_PASSCODE);
                    setTimeout(() => setCopiedCode(null), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Salin kode untuk keperluan administrasi guru"
                >
                  {copiedCode === RUANG_MURID_STUDENT_PASSCODE ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode Akses</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Stats & Bulk Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat Card 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Kode Terbit</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{records.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Kode Aktif (Bisa Masuk)</div>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">{totalActive}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Kode Nonaktif (Terkunci)</div>
                <div className="text-2xl font-black text-red-700 mt-0.5">{totalInactive}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section: Download Rekap Kode Akses Guru Per Satuan Pendidikan (Format PDF) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-blue-500/50 shadow-md text-white space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-800/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
                  <FileText className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white tracking-wide">
                      Cetak &amp; Unduh Laporan Kode Akses Guru (Format PDF)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 uppercase">
                      Siap Cetak / A4
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/80">
                    Pilih nama sekolah di bawah ini untuk mengunduh dokumen PDF resmi berisi daftar nama guru, NIP, penugasan, dan kode akses unik masing-masing.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* 1. Pilih Satuan Pendidikan */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-1">
                  <label className="text-xs font-bold text-blue-200 shrink-0 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Satuan Pendidikan:</span>
                  </label>
                  <select
                    value={selectedSchoolForPdf}
                    onChange={(e) => setSelectedSchoolForPdf(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-blue-400/50 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="ALL">Semua Satuan Pendidikan ({records.length} Guru Terdaftar)</option>
                    {availableSchools.map((sch) => {
                      const count = records.filter(
                        (r) => (r.namaSekolah || r.namaSatuanPendidikan || '').toLowerCase().trim() === sch.toLowerCase().trim()
                      ).length;
                      return (
                        <option key={sch} value={sch}>
                          {sch} ({count} Guru)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Unggah Logo Kop Surat */}
                <div className="flex items-center gap-2.5 shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-blue-400/40">
                  {pdfLogoBase64 ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={pdfLogoBase64}
                        alt="Logo Kop"
                        className="w-7 h-7 object-contain bg-white rounded p-0.5 border border-slate-300"
                      />
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Logo Kop Aktif
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-[10px] text-red-300 hover:text-red-100 font-bold underline ml-1 cursor-pointer"
                        title="Hapus logo"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Unggah Logo Kop</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 3. Tombol Unduh PDF */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadPdfBySchool}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Unduh PDF ({selectedSchoolForPdf === 'ALL' ? 'Semua Sekolah' : selectedSchoolForPdf})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Action Toolbar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {pendingRequests.length > 0 && (
                <button
                  type="button"
                  onClick={handleActivateAllPending}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Aktifkan Permintaan Baru ({pendingRequests.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleActivateAll}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktifkan Semua Kode
              </button>

              <button
                type="button"
                onClick={handleDeactivateAll}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                Nonaktifkan Semua Kode
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Terbitkan Kode Manual
              </button>

              <button
                type="button"
                onClick={refreshList}
                disabled={isSyncingFirestore}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Tarik & sinkronkan data pendaftaran terbaru dari Cloud Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
                <span>{isSyncingFirestore ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300"
                title="Unduh seluruh data pendaftaran kode guru sebagai file cadangan JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor Cadangan</span>
              </button>

              <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Impor Cadangan</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari guru / sekolah / kode..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none w-48 sm:w-56 bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-blue-600 focus:outline-none font-semibold text-slate-900"
              >
                <option value="ALL">Semua ({records.length})</option>
                <option value="PENDING">⚡ Menunggu Aktivasi ({pendingRequests.length})</option>
                <option value="ACTIVE">Aktif Saja ({totalActive})</option>
                <option value="INACTIVE">Nonaktif Saja ({totalInactive})</option>
              </select>
            </div>
          </div>

          {/* Section 4: Table / Cards of All Access Records */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Guru & Kode Akses Terbit ({filtered.length})</span>
              <span className="text-[11px] text-slate-700 normal-case font-normal">
                Kode aktif dapat membuka aplikasi; identitas otomatis mengunci dokumen.
              </span>
            </h4>

            {filtered.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs">
                Tidak ada data kode akses yang cocok dengan pencarian.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((r) => {
                  const isMaster = Boolean(r.isPremiumMaster || isMasterAccessCode(r.kodeAkses));
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        !r.isActive && !isMaster
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                          : r.isActive
                          ? 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-75'
                      }`}
                    >
                      {/* Left info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg border shadow-2xs flex items-center gap-1.5 ${
                              isMaster
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : r.isActive
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : 'bg-slate-100 text-slate-500 border-slate-300 line-through'
                            }`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {r.kodeAkses}
                          </span>

                          {isMaster && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                              <Crown className="w-3 h-3" />
                              KODE MASTER ADMIN (RAHASIA)
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.isActive ? '● AKTIF' : '○ NONAKTIF'}
                          </span>

                          {isMaster ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                              Akses Bebas Semua Fase &amp; Semua Kelas • Jabatan Bebas
                            </span>
                          ) : r.isPermanent ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100/80 text-amber-950 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-700" />
                              {r.jabatan === 'Guru Mata Pelajaran'
                                ? `Guru Mapel: ${r.mataPelajaran || 'Pendidikan Agama Katolik'} (Kelas 1-6 • Permanen)`
                                : `Guru Kelas: ${r.fase} (Kelas ${r.kelas} • Permanen)`}
                            </span>
                          ) : r.jabatan === 'Guru Mata Pelajaran' ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-300">
                              Guru Mapel: {r.mataPelajaran || 'Pendidikan Agama Katolik'} (Akses Semua Kelas 1-6)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-semibold border border-blue-200">
                              Guru Kelas: {r.fase} (Kelas {r.kelas})
                            </span>
                          )}

                          <span className="text-[10px] text-slate-700">
                            Terbit: {new Date(r.tanggalDibuat).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        {/* Teacher & School Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
                          <div>
                            <span className="text-slate-700">Guru: </span>
                            <span className="font-bold text-slate-900">{r.namaGuru}</span>
                            <span className="text-slate-700 text-[11px]"> (NIP: {r.nipGuru || '-'})</span>
                          </div>
                          <div>
                            <span className="text-slate-700">Satuan: </span>
                            <span className="font-semibold text-slate-800">{r.namaSekolah}</span>
                          </div>
                          <div>
                            <span className="text-slate-700">Kepala Sekolah: </span>
                            <span className="font-medium text-slate-800">{r.namaKepalaSekolah || '-'}</span>
                            <span className="text-slate-700 text-[11px]"> (NIP: {r.nipKepalaSekolah || '-'})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>No. WA Guru: <strong className="font-mono text-black font-bold">{r.nomorHpPendaftar || 'Belum diisi'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right action buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                        {/* Toggle switch or Master badge */}
                        {isMaster ? (
                          <div
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 cursor-default select-none shadow-2xs"
                            title="Kode Master Admin selalu aktif dan tidak dapat dinonaktifkan"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-700" />
                            Selalu Aktif
                          </div>
                        ) : (
                          <>
                            {!r.isActive && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(r.kodeAkses)}
                                className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-xs hover:scale-105 active:scale-95"
                                title="Klik untuk langsung aktifkan permohonan kode guru ini"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aktifkan Sekarang</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(r.kodeAkses)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                r.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                              }`}
                              title={r.isActive ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                            >
                              {r.isActive ? (
                                <>
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  Aktif
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-slate-500" />
                                  Nonaktif
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Copy Code */}
                        <button
                          type="button"
                          onClick={() => handleCopyCode(r.kodeAkses)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Salin Kode Akses"
                        >
                          {copiedCode === r.kodeAkses ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Direct WhatsApp to Teacher */}
                        {r.nomorHpPendaftar ? (
                          <a
                            href={createTeacherWhatsAppLink(r.nomorHpPendaftar, getTeacherActivationWAMessage(r))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-400 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            title={`Buka WhatsApp & Kirim Kode Langsung ke ${r.namaGuru} (${r.nomorHpPendaftar})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim ke WA Guru</span>
                          </a>
                        ) : null}

                        {/* Open via Admin WhatsApp (082236015517) */}
                        <a
                          href={createAdminWhatsAppLink(getTeacherActivationWAMessage(r))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Buka WhatsApp via Nomor Admin (${ADMIN_WA_DISPLAY})`}
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Share WA Admin</span>
                        </a>

                        {/* Copy WA Message */}
                        <button
                          type="button"
                          onClick={() => handleCopyWAMessage(r)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Salin Pesan Format WhatsApp"
                        >
                          {copiedCode === r.kodeAkses + '-wa' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit button (available for all records except master) */}
                        {!isMaster && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Data Guru & Penugasan Mapel/Fase (Khusus Admin)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button (ONLY for non-master and non-permanent records) */}
                        {!isMaster && !r.isPermanent && !isPermanentAccessCode(r.kodeAkses) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(r.kodeAkses)}
                            className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title="Hapus Kode Akses"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Modal Sub: Terbitkan Manual */}
        {showAddModal && (
          <div className="fixed inset-0 z-[125] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleCreateManualCode}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 flex flex-col animate-in fade-in zoom-in-95 my-auto max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Terbitkan Kode Akses Manual</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Fields Wrapper */}
              <div className="flex-1 overflow-y-auto pr-1.5 py-4 space-y-4 text-xs max-h-[62vh]">
                {/* Tombol Cepat Tempel Format WhatsApp Guru */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs">
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Punya pesan pendaftaran dari WhatsApp guru?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWaPasteInput(!showWaPasteInput)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    {showWaPasteInput ? 'Tutup Tempel' : 'Tempel Teks WA'}
                  </button>
                </div>

                {showWaPasteInput && (
                  <div className="p-3 bg-emerald-100/60 border border-emerald-300 rounded-xl space-y-2 text-xs">
                    <p className="text-emerald-950 font-medium text-[11px]">
                      Tempel pesan WhatsApp yang dikirimkan guru (yang berisi Nama, NIP, Satuan Pendidikan, No WA, dll), lalu klik &quot;Ekstrak Otomatis&quot;:
                    </p>
                    <textarea
                      rows={4}
                      value={waPasteInput}
                      onChange={(e) => setWaPasteInput(e.target.value)}
                      placeholder="Contoh format pesan WA:
Nama Lengkap: Yeni Ellu, S.Pd.
NIP: 19860520...
Jabatan: Guru Kelas (Fase C)
Satuan Pendidikan: SDN Fatubai
Nomor WA: 081234567890
Kepala Sekolah: Gusmardi, S.Pd."
                      className="w-full p-2 border border-emerald-400 rounded-lg bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowWaPasteInput(false)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleParseWaPaste}
                        className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Ekstrak Otomatis ke Form
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      1. Nama Lengkap Guru (dengan Gelar) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newNamaGuru}
                      onChange={(e) => setNewNamaGuru(e.target.value)}
                      placeholder="Contoh: Yeni Ellu, S.Pd."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">2. NIP Guru</label>
                    <input
                      type="text"
                      value={newNipGuru}
                      onChange={(e) => setNewNipGuru(e.target.value)}
                      placeholder="18 digit atau -"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">3. Jabatan Guru</label>
                    <select
                      value={newJabatan}
                      onChange={(e) => {
                        const j = e.target.value as any;
                        setNewJabatan(j);
                        if (j === 'Guru Kelas') {
                          setNewKelas(newFase === 'Fase A' ? '1' : newFase === 'Fase B' ? '3' : '5');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-blue-600 focus:outline-none font-semibold"
                    >
                      <option value="Guru Kelas">Guru Kelas</option>
                      <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      4. Nama Satuan Pendidikan (Sekolah) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newNamaSekolah}
                      onChange={(e) => setNewNamaSekolah(e.target.value)}
                      placeholder="Contoh: UPT SD Negeri 1 Silaut"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Nomor WhatsApp Guru (Wajib Aktif) <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        Untuk Kirim Kode via WhatsApp
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newNomorWA}
                      onChange={(e) => setNewNomorWA(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg focus:border-emerald-600 focus:outline-none bg-emerald-50/20 text-black font-bold placeholder:text-slate-400"
                    />
                  </div>

                  {newJabatan === 'Guru Mata Pelajaran' ? (
                    <div className="sm:col-span-2 p-3 bg-indigo-50/80 border-2 border-indigo-200 rounded-xl space-y-1.5">
                      <label className="block font-bold text-indigo-950 mb-1">
                        5. Mata Pelajaran yang Diampu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newMataPelajaran}
                        onChange={(e) => setNewMataPelajaran(e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg bg-white text-slate-900 focus:border-indigo-600 focus:outline-none font-semibold text-xs"
                      >
                        {GURU_MAPEL_SUBJECT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10.5px] text-indigo-900 leading-tight">
                        ✨ <strong>Hak Akses Kelas 1 s.d. 6:</strong> Guru Mata Pelajaran otomatis berhak mengakses seluruh Fase A, B, C (Kelas 1 s.d. 6) khusus mata pelajaran yang dipilih.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">5. Fase</label>
                        <select
                          value={newFase}
                          onChange={(e) => {
                            const f = e.target.value as any;
                            setNewFase(f);
                            setNewKelas(f === 'Fase A' ? '1' : f === 'Fase B' ? '3' : '5');
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-blue-600 focus:outline-none font-semibold"
                        >
                          <option value="Fase C">Fase C (Kelas 5 & 6)</option>
                          <option value="Fase B">Fase B (Kelas 3 & 4)</option>
                          <option value="Fase A">Fase A (Kelas 1 & 2)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Kelas <span className="text-red-500">*</span></label>
                        <select
                          value={newKelas}
                          onChange={(e) => setNewKelas(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-blue-600 focus:outline-none font-semibold"
                        >
                          {newFase === 'Fase A' && (
                            <>
                              <option value="1">Kelas 1</option>
                              <option value="2">Kelas 2</option>
                            </>
                          )}
                          {newFase === 'Fase B' && (
                            <>
                              <option value="3">Kelas 3</option>
                              <option value="4">Kelas 4</option>
                            </>
                          )}
                          {newFase === 'Fase C' && (
                            <>
                              <option value="5">Kelas 5</option>
                              <option value="6">Kelas 6</option>
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">6. Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      value={newNamaKS}
                      onChange={(e) => setNewNamaKS(e.target.value)}
                      placeholder="Contoh: Gusmardi, S.Pd."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">7. NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      value={newNipKS}
                      onChange={(e) => setNewNipKS(e.target.value)}
                      placeholder="18 digit atau -"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2 pt-3.5 border-t shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Terbitkan Kode (GP-XXXX)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Sub: Edit Data Guru & Penugasan Mapel */}
        {editingRecord && (
          <div className="fixed inset-0 z-[125] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={handleSaveEdit}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Data Guru &amp; Penugasan</h3>
                    <p className="text-xs text-slate-500 font-mono">Kode Akses: {editingRecord.kodeAkses}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {editSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {editErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">1. Nama Lengkap Guru <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editNamaGuru}
                    onChange={(e) => setEditNamaGuru(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">2. NIP Guru</label>
                  <input
                    type="text"
                    value={editNipGuru}
                    onChange={(e) => setEditNipGuru(e.target.value)}
                    placeholder="18 digit atau -"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">3. Jabatan Guru <span className="text-red-500">*</span></label>
                  <select
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-indigo-600 focus:outline-none font-semibold"
                  >
                    <option value="Guru Kelas">Guru Kelas</option>
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">4. Nama Satuan Pendidikan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editNamaSekolah}
                    onChange={(e) => setEditNamaSekolah(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Nomor WhatsApp Guru</label>
                  <input
                    type="text"
                    value={editNomorWA}
                    onChange={(e) => setEditNomorWA(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                {editJabatan === 'Guru Mata Pelajaran' ? (
                  <div className="sm:col-span-2 p-3 bg-indigo-50/80 border-2 border-indigo-200 rounded-xl space-y-1.5">
                    <label className="block font-bold text-indigo-950 mb-1">
                      5. Mata Pelajaran yang Diampu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editMataPelajaran}
                      onChange={(e) => setEditMataPelajaran(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-300 rounded-lg bg-white text-slate-900 focus:border-indigo-600 focus:outline-none font-semibold text-xs"
                    >
                      {GURU_MAPEL_SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10.5px] text-indigo-900 leading-tight">
                      ✨ <strong>Hak Akses Kelas 1 s.d. 6:</strong> Guru Mata Pelajaran otomatis berhak mengakses seluruh Fase A, B, C (Kelas 1 s.d. 6) khusus mata pelajaran yang dipilih.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">5. Fase</label>
                      <select
                        value={editFase}
                        onChange={(e) => {
                          const f = e.target.value as any;
                          setEditFase(f);
                          setEditKelas(f === 'Fase A' ? '1' : f === 'Fase B' ? '3' : '5');
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-indigo-600 focus:outline-none font-semibold"
                      >
                        <option value="Fase C">Fase C (Kelas 5 & 6)</option>
                        <option value="Fase B">Fase B (Kelas 3 & 4)</option>
                        <option value="Fase A">Fase A (Kelas 1 & 2)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Kelas <span className="text-red-500">*</span></label>
                      <select
                        value={editKelas}
                        onChange={(e) => setEditKelas(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-indigo-600 focus:outline-none font-semibold"
                      >
                        {editFase === 'Fase A' && (
                          <>
                            <option value="1">Kelas 1</option>
                            <option value="2">Kelas 2</option>
                          </>
                        )}
                        {editFase === 'Fase B' && (
                          <>
                            <option value="3">Kelas 3</option>
                            <option value="4">Kelas 4</option>
                          </>
                        )}
                        {editFase === 'Fase C' && (
                          <>
                            <option value="5">Kelas 5</option>
                            <option value="6">Kelas 6</option>
                          </>
                        )}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-800 mb-1">6. Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={editNamaKS}
                    onChange={(e) => setEditNamaKS(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">7. NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={editNipKS}
                    onChange={(e) => setEditNipKS(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-none bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="font-bold text-slate-800">Status Akun Aktif (Dapat Masuk ke Aplikasi)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Modal Sub: Konfirmasi Hapus Kode Akses (In-App Dialog, bebas blokir iframe) */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Konfirmasi Hapus Kode</h4>
                  <p className="text-xs text-slate-500">Tindakan ini permanen dan tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl text-xs space-y-2 text-slate-800">
                <p className="font-medium">Apakah Anda yakin ingin menghapus kode akses ini dari sistem SIPARTAN?</p>
                <div className="font-mono font-black text-sm text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-300 inline-block shadow-2xs">
                  {deleteConfirmTarget.kodeAkses}
                </div>
                <div className="text-slate-700 space-y-1">
                  <div>Guru: <strong className="text-slate-900">{deleteConfirmTarget.namaGuru}</strong> (NIP: {deleteConfirmTarget.nipGuru || '-'})</div>
                  <div>Sekolah: <strong className="text-slate-900">{deleteConfirmTarget.namaSekolah}</strong></div>
                  <div>Fase &amp; Kelas: <span className="font-medium text-slate-900">{deleteConfirmTarget.fase} ({deleteConfirmTarget.kelas})</span></div>
                </div>
                <p className="text-[11px] font-semibold text-red-700 pt-1 border-t border-red-200">
                  ⚠️ Guru bersangkutan tidak akan dapat masuk ke aplikasi SIPARTAN lagi setelah kode ini dihapus.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingCode}
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeletingCode}
                  onClick={executeDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeletingCode ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ya, Hapus Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sub: Konfigurasi Firebase & Panduan Sinkronisasi Netlify */}
        {showConfigModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Konfigurasi Firebase &amp; Panduan Sinkronisasi Netlify
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sinkronisasi multi-pengguna dan multi-perangkat via Cloud Firestore
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Status & Info Proyek Aktif */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Informasi Firebase Yang Digunakan Saat Ini:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    cloudSyncStatus === 'online'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cloudSyncStatus === 'online' ? 'TERHUBUNG KE CLOUD' : 'BELUM TERHUBUNG'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-slate-700">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Project ID</span>
                    <strong className="text-slate-900">{getActiveFirebaseConfig().projectId}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Auth Domain</span>
                    <span className="text-slate-900 truncate block">{getActiveFirebaseConfig().authDomain}</span>
                  </div>
                </div>
              </div>

              {/* Panduan Mengaktifkan Firestore di Firebase Console */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-xs space-y-2.5 text-amber-950">
                <div className="font-black text-amber-900 flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Mengapa Teman Anda di Netlify Belum Menerima Perubahan?</span>
                </div>
                <p className="leading-relaxed">
                  Aplikasi SIPARTAN dirancang membaca &amp; menulis data ke <strong>Cloud Firestore</strong>. Jika database Firestore di proyek Firebase Anda belum dibuat / diaktifkan di Firebase Console, maka data hanya akan tersimpan di memori lokal browser perangkat Anda sendiri!
                </p>
                <div className="pt-2 border-t border-amber-200 space-y-1.5 text-[11.5px]">
                  <p className="font-bold text-slate-900">Cara mengaktifkan dalam 2 menit:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                    <li>
                      Buka Firebase Console:{' '}
                      <a
                        href={`https://console.firebase.google.com/project/${getActiveFirebaseConfig().projectId}/firestore`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 font-bold underline inline-flex items-center gap-0.5"
                      >
                        console.firebase.google.com <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </li>
                    <li>Pastikan Anda login menggunakan akun Google Anda (<strong>haryantoronibhidju86@gmail.com</strong>).</li>
                    <li>Di menu sebelah kiri, klik <strong>Build</strong> &gt; <strong>Firestore Database</strong>.</li>
                    <li>Klik tombol <strong>Create Database</strong>.</li>
                    <li>Pilih lokasi database (misalnya <em>asia-southeast1</em> atau <em>asia-southeast2</em>).</li>
                    <li>Pilih <strong>Start in test mode</strong> (aturan baca/tulis aktif), lalu klik <strong>Create / Enable</strong>.</li>
                    <li>Kembali ke aplikasi ini dan klik tombol <strong>&quot;Tes Koneksi Cloud&quot;</strong>. Status akan langsung berubah menjadi hijau 🟢 Online!</li>
                  </ol>
                </div>
              </div>

              {/* Form Ganti Konfigurasi Firebase (Custom Config) */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-900">
                  Ganti / Tempel Konfigurasi Firebase Sendiri (Opsional):
                </label>
                <p className="text-[11px] text-slate-500">
                  Jika Anda memiliki proyek Firebase pribadi lain (seperti <code>sipartan-da5b2</code>), Anda dapat menempelkan objek konfigurasi Firebase (JSON atau kode JS) di bawah ini:
                </p>
                <textarea
                  rows={6}
                  value={customConfigInput}
                  onChange={(e) => setCustomConfigInput(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "sipartan-da5b2.firebaseapp.com",\n  "projectId": "sipartan-da5b2",\n  "storageBucket": "sipartan-da5b2.firebasestorage.app"\n}`}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadConfigJson}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unduh Config File (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    Reset Bawaan
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomConfig}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simpan &amp; Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
