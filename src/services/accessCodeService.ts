import { AccessRecord, SchoolIdentity, GoogleFormConfig } from '../types';
import { updateUserWorkspaceIdentityInFirestore } from './userWorkspaceFirestore';
import {
  saveAccessRecordToFirestore,
  deleteAccessRecordFromFirestore,
  updateAccessRecordStatusInFirestore,
  batchUpdateAllAccessCodesInFirestore,
  fetchAllAccessRecordsFromFirestore,
  subscribeToAccessRecordsFromFirestore,
  subscribeToSingleAccessCode,
  findAccessRecordInFirestore,
  saveWordExportDisabledToFirestore,
  fetchWordExportDisabledFromFirestore,
  subscribeToWordExportDisabledFromFirestore,
  isFirestoreOnline,
  getLastCloudErrorDetail,
  testFirestoreConnectionAsync,
  resetCloudCooldown,
} from './accessCodeFirestore';

export {
  saveAccessRecordToFirestore,
  deleteAccessRecordFromFirestore,
  updateAccessRecordStatusInFirestore,
  batchUpdateAllAccessCodesInFirestore,
  fetchAllAccessRecordsFromFirestore,
  subscribeToAccessRecordsFromFirestore,
  subscribeToSingleAccessCode,
  findAccessRecordInFirestore,
  saveWordExportDisabledToFirestore,
  fetchWordExportDisabledFromFirestore,
  subscribeToWordExportDisabledFromFirestore,
  isFirestoreOnline,
  getLastCloudErrorDetail,
  testFirestoreConnectionAsync,
  resetCloudCooldown,
};

export const ACCESS_CODES_STORAGE_KEY = 'sipartan_access_codes_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'sipartan_active_session_code_v1';
export const GOOGLE_FORM_CONFIG_STORAGE_KEY = 'sipartan_google_form_config_v1';
export const WORD_EXPORT_DISABLED_STORAGE_KEY = 'sipartan_word_export_disabled_v1';

// Kode Akses Master Admin Resmi
export const MASTER_ACCESS_CODE = 'GP-1386';
// Kode Akses Lama yang Telah Dinonaktifkan dan Tidak Berlaku Lagi
export const DEPRECATED_LEGACY_CODE = 'GP-86OK';

// Kontak Resmi Administrator & Pengembang SIPARTAN
export const ADMIN_WA_DISPLAY = '082236015517';
export const ADMIN_WA_INTL = '6282236015517';

/**
 * Format nomor HP lokal Indonesia (08xxx / 8xxx / +62xxx) menjadi format internasional wa.me (628xxx)
 */
export function formatWhatsAppNumber(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '628' + digits.slice(1);
  } else if (digits.startsWith('62')) {
    // already 62
  }
  return digits;
}

/**
 * Membuat tautan resmi kirim pesan WhatsApp langsung ke Administrator SIPARTAN (082236015517)
 */
export function createAdminWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${ADMIN_WA_INTL}?text=${encoded}`;
}

/**
 * Membuat tautan kirim pesan WhatsApp langsung ke nomor Guru Pendaftar
 */
export function createTeacherWhatsAppLink(teacherPhone: string, message: string): string {
  const formatted = formatWhatsAppNumber(teacherPhone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formatted || ADMIN_WA_INTL}?text=${encoded}`;
}

/**
 * Memeriksa apakah sebuah kode adalah Kode Master Administrator resmi (GP-1386)
 */
export function isMasterAccessCode(code?: string | null): boolean {
  if (!code) return false;
  const clean = code.toUpperCase().trim();
  return clean === MASTER_ACCESS_CODE;
}

/**
 * Memeriksa apakah kode yang dimasukkan adalah kode lama yang telah dinonaktifkan permanen
 */
export function isDeactivatedLegacyCode(code?: string | null): boolean {
  if (!code) return false;
  const clean = code.toUpperCase().trim().replace(/0/g, 'O');
  return clean === 'GP-86OK' || clean === '86OK';
}

/**
 * Kode Akses Resmi Akun Demo SIPARTAN: GP-RHB1
 * - Digunakan untuk pelatihan, uji coba, dan evaluasi resmi.
 * - Data Sekolah (SD Negeri Fatubai) dan Guru (Roni Hariyanto Bhidju, S. Pd) TERKUNCI PERMANEN.
 * - Pengguna HANYA dapat bebas mengganti pilihan Fase (Fase A, Fase B, Fase C) dan Kelas.
 */
export const DEMO_ACCESS_CODE = 'GP-RHB1';
export const SIMULASI_ACCESS_CODE = DEMO_ACCESS_CODE;

/**
 * Memeriksa apakah sebuah kode adalah Kode Akses Demo Resmi (GP-RHB1)
 * Mendukung variasi format dan alias demi kenyamanan pengguna
 */
export function isDemoAccessCode(code?: string | null): boolean {
  if (!code) return false;
  const clean = code.toUpperCase().trim();
  return (
    clean === DEMO_ACCESS_CODE ||
    clean === 'RHB1' ||
    clean === 'GP-DEMO' ||
    clean === 'DEMO' ||
    clean === 'GP-SIMULASI' ||
    clean === 'SIMULASI'
  );
}

export const isSimulationAccessCode = isDemoAccessCode;

export const DEFAULT_PREMIUM_RECORD: AccessRecord = {
  id: 'acc-master-gp1386',
  kodeAkses: MASTER_ACCESS_CODE,
  isActive: true,
  status: 'active',
  isPremiumMaster: true,
  tanggalDibuat: '2026-07-01T00:00:00.000Z',
  tanggalAktivasi: '2026-07-01T00:00:00.000Z',
  namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
  nipGuru: '198603012020121005',
  jabatan: 'Guru Kelas',
  namaSekolah: 'SD Negeri Fatubai',
  namaSatuanPendidikan: 'SD Negeri Fatubai',
  fase: 'Fase C',
  kelas: '5 & 6',
  mataPelajaran: 'Matematika',
  namaKepalaSekolah: 'Darius Kusi, S.Pd.',
  nipKepalaSekolah: '196709192008011008',
  emailPendaftar: 'yeniellu20@gmail.com',
  sumberPendaftaran: 'Sistem Bawaan',
  catatanStatus: 'Kode Master Administrator & Pengembang (Akses Penuh Tanpa Batasan)',
};

/**
 * Akun Demo Resmi SIPARTAN (GP-RHB1):
 * - Data Sekolah dan Guru TERKUNCI PERMANEN (SD Negeri Fatubai, Roni Hariyanto Bhidju, S.Pd).
 * - Pengguna HANYA dapat mengganti pilihan Fase (Fase A, B, C) serta Kelas.
 * - Bukan Super Admin (tidak bisa membuka panel kelola kode akses rahasia / Google Forms).
 */
export const DEFAULT_DEMO_RECORD: AccessRecord = {
  id: 'acc-demo-gp-rhb1',
  kodeAkses: DEMO_ACCESS_CODE, // 'GP-RHB1'
  isActive: true,
  status: 'active',
  isPremiumMaster: false, // BUKAN MASTER ADMIN!
  isDemo: true,
  tanggalDibuat: '2026-07-01T00:00:00.000Z',
  tanggalAktivasi: '2026-07-01T00:00:00.000Z',
  namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
  nipGuru: '198603012020121005',
  jabatan: 'Guru Kelas',
  namaSekolah: 'SD Negeri Fatubai',
  namaSatuanPendidikan: 'SD Negeri Fatubai',
  fase: 'Fase C',
  kelas: '5 & 6',
  mataPelajaran: 'Matematika',
  namaKepalaSekolah: 'Darius Kusi, S.Pd.',
  nipKepalaSekolah: '196709192008011008',
  emailPendaftar: 'demo@sipartan.id',
  sumberPendaftaran: 'Sistem Bawaan',
  catatanStatus: 'Akun Demo Resmi (GP-RHB1): Data sekolah & guru terkunci permanen, pengguna bebas mengganti fase dan kelas pembelajaran.',
};

export const DEFAULT_SIMULASI_RECORD = DEFAULT_DEMO_RECORD;

/**
 * Data Guru Resmi Terdaftar: Bapak Ferianus Ellu, S.Pd. SD
 * Satuan Pendidikan: SD Negeri Fatubai
 * Pendaftar resmi via Google Form / Formulir SIPARTAN
 */
export const DEFAULT_FERIANUS_RECORD: AccessRecord = {
  id: 'acc-teacher-ferianus-ellu',
  kodeAkses: 'GP-FE86',
  isActive: true,
  status: 'active',
  isPremiumMaster: false,
  isDemo: false,
  tanggalDibuat: '2026-07-02T08:00:00.000Z',
  tanggalAktivasi: '2026-07-02T08:30:00.000Z',
  namaGuru: 'Ferianus Ellu, S.Pd. SD',
  nipGuru: '198205142010011018',
  jabatan: 'Guru Kelas',
  namaSekolah: 'SD Negeri Fatubai',
  namaSatuanPendidikan: 'SD Negeri Fatubai',
  fase: 'Fase C',
  kelas: '5 & 6',
  mataPelajaran: 'Matematika',
  namaKepalaSekolah: 'Darius Kusi, S.Pd.',
  nipKepalaSekolah: '196709192008011008',
  emailPendaftar: 'yeniellu20@gmail.com',
  nomorHpPendaftar: '082236015517',
  sumberPendaftaran: 'Google Form',
  catatanStatus: 'Pendaftar Resmi Guru SIPARTAN (Terverifikasi & Aktif)',
};

/**
 * Membaca konfigurasi Google Form tersimpan
 */
export function getSavedGoogleFormConfig(): GoogleFormConfig | null {
  try {
    const raw = localStorage.getItem(GOOGLE_FORM_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan konfigurasi Google Form
 */
export function saveGoogleFormConfig(config: GoogleFormConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(GOOGLE_FORM_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(GOOGLE_FORM_CONFIG_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Gagal menyimpan config google form:', e);
  }
}

/**
 * Memeriksa apakah unduhan dokumen format Microsoft Word (.doc) dinonaktifkan oleh Admin.
 * Kebijakan ini mencegah pengeditan data dokumen di luar aplikasi SIPARTAN.
 */
export function isWordExportDisabled(): boolean {
  try {
    return localStorage.getItem(WORD_EXPORT_DISABLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mengubah status proteksi unduhan Word oleh Admin (Aktif / Nonaktif).
 */
export function setWordExportDisabled(disabled: boolean): void {
  setWordExportDisabledAsync(disabled).catch(() => {});
}

/**
 * Mengubah status proteksi unduhan Word oleh Admin secara asinkron dengan laporan status Cloud
 */
export async function setWordExportDisabledAsync(
  disabled: boolean
): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  try {
    if (disabled) {
      localStorage.setItem(WORD_EXPORT_DISABLED_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(WORD_EXPORT_DISABLED_STORAGE_KEY);
    }

    // Kirim event ke seluruh komponen agar update realtime tanpa reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sipartan_word_export_status_changed', { detail: { disabled } })
      );
    }

    // Simpan ke Cloud Firestore agar tersinkronisasi lintas perangkat
    const cloudRes = await saveWordExportDisabledToFirestore(disabled);
    if (cloudRes?.success) {
      return {
        success: true,
        cloudSynced: true,
        message: disabled
          ? 'Proteksi Unduhan Word BERHASIL DIAKTIFKAN di Cloud Firestore! Seluruh gawai & pengguna kini dilarang mengunduh dokumen Word.'
          : 'Unduhan Word BERHASIL DIAKTIFKAN KEMBALI di Cloud Firestore! Berlaku serentak untuk seluruh perangkat pengguna.',
      };
    } else {
      return {
        success: true,
        cloudSynced: false,
        message:
          (disabled ? 'Unduhan Word dinonaktifkan di perangkat ini.' : 'Unduhan Word diaktifkan di perangkat ini.') +
          ` PERINGATAN: Gagal sinkron ke Cloud Firestore (${cloudRes?.error || 'Database offline'}). Buka Panel Admin > Status Cloud untuk memeriksa database.`,
      };
    }
  } catch (e: any) {
    console.error('Gagal menyimpan status proteksi unduhan Word:', e);
    return {
      success: false,
      cloudSynced: false,
      message: `Gagal memperbarui status unduhan Word: ${e.message}`,
    };
  }
}

/**
 * Membaca seluruh daftar kode akses tersimpan.
 * Memastikan MASTER_ACCESS_CODE selalu ada dan terdefinisi.
 */
export function getAllAccessRecords(): AccessRecord[] {
  try {
    const raw = localStorage.getItem(ACCESS_CODES_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_PREMIUM_RECORD, DEFAULT_DEMO_RECORD];
      localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: AccessRecord[] = JSON.parse(raw);

    // Filter keluar secara permanen kode lama GP-86OK / GP-860K yang telah dinonaktifkan
    const cleaned = parsed.filter(
      (r) => !isDeactivatedLegacyCode(r.kodeAkses) && r.id !== 'acc-master-gp86ok'
    );

    const hasMaster = cleaned.some(
      (r) => isMasterAccessCode(r.kodeAkses)
    );
    if (!hasMaster) {
      cleaned.unshift(DEFAULT_PREMIUM_RECORD);
    }
    const hasDemo = cleaned.some(
      (r) => r.kodeAkses.toUpperCase().trim() === DEMO_ACCESS_CODE
    );
    if (!hasDemo) {
      cleaned.push(DEFAULT_DEMO_RECORD);
    }

    const normalized: AccessRecord[] = cleaned.map((r) => {
      const isMaster = isMasterAccessCode(r.kodeAkses);
      const isDemo = isSimulationAccessCode(r.kodeAkses);
      return {
        ...r,
        status: (r.isActive ?? true) ? ('active' as const) : ('inactive' as const),
        namaSatuanPendidikan: r.namaSatuanPendidikan || r.namaSekolah,
        namaGuru: (isMaster || isDemo) ? 'Roni Hariyanto Bhidju, S.Pd' : (r.namaGuru || 'Guru SIPARTAN'),
        nipGuru: (isMaster || isDemo) ? '198603012020121005' : (r.nipGuru || '-'),
      };
    });
    return normalized;
  } catch (e) {
    console.error('Gagal membaca data kode akses:', e);
    return [DEFAULT_PREMIUM_RECORD, DEFAULT_DEMO_RECORD];
  }
}

export function saveAllAccessRecords(records: AccessRecord[]): void {
  try {
    localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sipartan_access_codes_updated', { detail: { records } })
      );
    }
  } catch (e) {
    console.error('Gagal menyimpan data kode akses:', e);
  }
}

/**
 * Generate kode akses unik yang selalu diawali "GP-"
 * Format: GP-XXXX (4 karakter alfanumerik kapital acak yang mudah dibaca)
 */
export function generateUniqueAccessCode(existingRecords: AccessRecord[]): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Tanpa karakter ambigu (0, O, 1, I)
  const existingCodes = new Set(existingRecords.map((r) => r.kodeAkses.toUpperCase().trim()));

  for (let attempt = 0; attempt < 500; attempt++) {
    let part = '';
    for (let i = 0; i < 4; i++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = `GP-${part}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }
  return `GP-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/**
 * Mengambil record kode akses tertentu (case-insensitive)
 * Khusus Master Admin adalah GP-1386 (GP-86OK telah dinonaktifkan permanen),
 * serta GP-RHB1 / GP-SIMULASI / DEMO untuk Akun Simulasi
 */
export function findAccessRecord(code: string): AccessRecord | null {
  if (!code) return null;
  const cleanCode = code.toUpperCase().trim();
  
  // Jika kode adalah kode lama yang telah dinonaktifkan (GP-86OK), tolak langsung
  if (isDeactivatedLegacyCode(cleanCode)) {
    return null;
  }

  const records = getAllAccessRecords();
  
  if (isMasterAccessCode(cleanCode)) {
    const master = records.find((r) => isMasterAccessCode(r.kodeAkses) || r.isPremiumMaster);
    const rec = master || DEFAULT_PREMIUM_RECORD;
    return {
      ...rec,
      namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
      nipGuru: '198603012020121005',
    };
  }

  if (isSimulationAccessCode(cleanCode)) {
    const sim = records.find((r) => isSimulationAccessCode(r.kodeAkses));
    const rec = sim || DEFAULT_SIMULASI_RECORD;
    return {
      ...rec,
      namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
      nipGuru: '198603012020121005',
    };
  }

  return records.find((r) => r.kodeAkses.toUpperCase().trim() === cleanCode) || null;
}

/**
 * Toggle status aktif 1 kode akses
 */
export function toggleAccessCodeStatus(code: string, targetStatus?: boolean): AccessRecord | null {
  const records = getAllAccessRecords();
  const cleanCode = code.toUpperCase().trim();
  
  // Master access code & simulasi code cannot be deactivated
  if (cleanCode === MASTER_ACCESS_CODE || isSimulationAccessCode(cleanCode)) {
    return findAccessRecord(cleanCode);
  }

  let updatedRecord: AccessRecord | null = null;

  const next = records.map((r) => {
    if (r.kodeAkses.toUpperCase().trim() === cleanCode) {
      const nextActive = targetStatus !== undefined ? targetStatus : !r.isActive;
      updatedRecord = {
        ...r,
        isActive: nextActive,
        status: nextActive ? 'active' : 'inactive',
        tanggalAktivasi: nextActive ? (r.tanggalAktivasi || new Date().toISOString()) : r.tanggalAktivasi,
      };
      return updatedRecord;
    }
    return r;
  });

  saveAllAccessRecords(next);

  // Sinkronisasi status ke Cloud Firestore
  if (updatedRecord) {
    const recToSync: AccessRecord = updatedRecord;
    updateAccessRecordStatusInFirestore(recToSync.id, recToSync.isActive, recToSync.kodeAkses).catch(() => {});
  }

  return updatedRecord;
}

/**
 * Mengaktifkan seluruh kode akses sekaligus
 */
export function activateAllAccessCodes(): void {
  const records = getAllAccessRecords();
  const now = new Date().toISOString();
  const next = records.map((r) => ({
    ...r,
    isActive: true,
    status: 'active' as const,
    tanggalAktivasi: r.tanggalAktivasi || now,
  }));
  saveAllAccessRecords(next);

  // Sinkronisasi massal ke Cloud Firestore
  batchUpdateAllAccessCodesInFirestore(true).catch(() => {});
}

/**
 * Menonaktifkan seluruh kode akses sekaligus (kecuali opsional master atau semua)
 */
export function deactivateAllAccessCodes(includeMaster: boolean = false): void {
  const records = getAllAccessRecords();
  const next = records.map((r) => {
    if (r.isPremiumMaster && !includeMaster) {
      return r;
    }
    return {
      ...r,
      isActive: false,
      status: 'inactive' as const,
    };
  });
  saveAllAccessRecords(next);

  // Sinkronisasi massal ke Cloud Firestore
  batchUpdateAllAccessCodesInFirestore(false).catch(() => {});
}

/**
 * Menghapus 1 kode akses (kecuali Master Code)
 */
export function deleteAccessCode(code: string): boolean {
  if (!code) return false;
  const cleanCode = code.toUpperCase().trim();
  if (isMasterAccessCode(cleanCode)) return false;

  const records = getAllAccessRecords();
  const targetRecord = records.find((r) => r.kodeAkses.toUpperCase().trim() === cleanCode);
  const filtered = records.filter((r) => {
    const rCode = r.kodeAkses.toUpperCase().trim();
    return rCode !== cleanCode;
  });

  // Pastikan Master Code selalu tetap utuh
  const hasMaster = filtered.some((r) => isMasterAccessCode(r.kodeAkses) || r.isPremiumMaster);
  if (!hasMaster) {
    filtered.unshift(DEFAULT_PREMIUM_RECORD);
  }

  saveAllAccessRecords(filtered);

  // Hapus dari Cloud Firestore
  deleteAccessRecordFromFirestore(targetRecord?.id || '', cleanCode).catch(() => {});

  // Jika kode yang dihapus adalah sesi aktif saat ini di browser, bersihkan
  const currentSession = getActiveSessionCode();
  if (currentSession && currentSession.toUpperCase().trim() === cleanCode) {
    clearActiveSessionCode();
  }

  return true;
}

/**
 * Menghapus 1 kode akses secara asinkron dengan jaminan penghapusan permanen dari Cloud Firestore
 */
export async function deleteAccessCodeAsync(code: string): Promise<boolean> {
  if (!code) return false;
  const cleanCode = code.toUpperCase().trim();
  if (isMasterAccessCode(cleanCode)) return false;

  const records = getAllAccessRecords();
  const targetRecord = records.find((r) => r.kodeAkses.toUpperCase().trim() === cleanCode);
  const filtered = records.filter((r) => r.kodeAkses.toUpperCase().trim() !== cleanCode);

  saveAllAccessRecords(filtered);

  // Hapus dari Cloud Firestore secara tuntas
  await deleteAccessRecordFromFirestore(targetRecord?.id || '', cleanCode);

  const currentSession = getActiveSessionCode();
  if (currentSession && currentSession.toUpperCase().trim() === cleanCode) {
    clearActiveSessionCode();
  }

  return true;
}

/**
 * Mendaftarkan / menerbitkan kode akses baru secara manual atau otomatis
 */
export function createNewAccessRecord(data: {
  namaGuru: string;
  nipGuru?: string;
  jabatan?: 'Guru Kelas' | 'Guru Mata Pelajaran';
  namaSekolah: string;
  fase?: 'Fase A' | 'Fase B' | 'Fase C';
  kelas?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  emailPendaftar?: string;
  nomorHpPendaftar?: string;
  sumberPendaftaran?: 'Input Langsung' | 'Sistem Bawaan';
  autoActivate?: boolean;
}): AccessRecord {
  const records = getAllAccessRecords();
  const kodeAkses = generateUniqueAccessCode(records);
  const now = new Date().toISOString();

  const cleanCode = kodeAkses.toUpperCase().trim();
  const newRecord: AccessRecord = {
    id: `acc-${cleanCode.replace(/\s+/g, '')}`,
    kodeAkses,
    isActive: data.autoActivate ?? false,
    status: (data.autoActivate ?? false) ? 'active' : 'inactive',
    isPremiumMaster: false,
    tanggalDibuat: now,
    tanggalAktivasi: data.autoActivate ? now : undefined,
    namaGuru: data.namaGuru.trim(),
    nipGuru: (data.nipGuru || '-').trim(),
    jabatan: data.jabatan || 'Guru Kelas',
    namaSekolah: data.namaSekolah.trim(),
    namaSatuanPendidikan: data.namaSekolah.trim(),
    fase: data.fase || 'Fase C',
    kelas: data.kelas || (data.fase === 'Fase A' ? '1 & 2' : data.fase === 'Fase B' ? '3 & 4' : '5 & 6'),
    mataPelajaran: 'Matematika',
    namaKepalaSekolah: (data.namaKepalaSekolah || '-').trim(),
    nipKepalaSekolah: (data.nipKepalaSekolah || '-').trim(),
    emailPendaftar: data.emailPendaftar,
    nomorHpPendaftar: (data.nomorHpPendaftar || '').trim(),
    sumberPendaftaran: data.sumberPendaftaran || 'Input Langsung',
  };

  records.unshift(newRecord);
  saveAllAccessRecords(records);

  // Simpan permanen ke Cloud Firestore lintas perangkat
  saveAccessRecordToFirestore(newRecord).catch(() => {});

  return newRecord;
}

/**
 * Mendaftarkan / menerbitkan kode akses baru secara asinkron dengan jaminan penyimpanan langsung ke Cloud Firestore
 */
export async function createNewAccessRecordAsync(
  data: Parameters<typeof createNewAccessRecord>[0]
): Promise<AccessRecord & { cloudSynced: boolean; cloudError?: string }> {
  const records = getAllAccessRecords();
  const kodeAkses = generateUniqueAccessCode(records);
  const now = new Date().toISOString();

  const cleanCode = kodeAkses.toUpperCase().trim();
  const newRecord: AccessRecord = {
    id: `acc-${cleanCode.replace(/\s+/g, '')}`,
    kodeAkses,
    isActive: data.autoActivate ?? false,
    status: (data.autoActivate ?? false) ? 'active' : 'inactive',
    isPremiumMaster: false,
    tanggalDibuat: now,
    tanggalAktivasi: data.autoActivate ? now : undefined,
    namaGuru: data.namaGuru.trim(),
    nipGuru: (data.nipGuru || '-').trim(),
    jabatan: data.jabatan || 'Guru Kelas',
    namaSekolah: data.namaSekolah.trim(),
    namaSatuanPendidikan: data.namaSekolah.trim(),
    fase: data.fase || 'Fase C',
    kelas: data.kelas || (data.fase === 'Fase A' ? '1 & 2' : data.fase === 'Fase B' ? '3 & 4' : '5 & 6'),
    mataPelajaran: 'Matematika',
    namaKepalaSekolah: (data.namaKepalaSekolah || '-').trim(),
    nipKepalaSekolah: (data.nipKepalaSekolah || '-').trim(),
    emailPendaftar: data.emailPendaftar,
    nomorHpPendaftar: (data.nomorHpPendaftar || '').trim(),
    sumberPendaftaran: data.sumberPendaftaran || 'Input Langsung',
  };

  // 1. Simpan langsung ke Cloud Firestore
  const cloudRes = await saveAccessRecordToFirestore(newRecord);

  // 2. Simpan ke local storage
  const updatedRecords = [newRecord, ...records.filter(r => r.kodeAkses.toUpperCase().trim() !== cleanCode)];
  saveAllAccessRecords(updatedRecords);

  return {
    ...newRecord,
    cloudSynced: Boolean(cloudRes?.success),
    cloudError: cloudRes?.error,
  };
}

/**
 * Memperbarui data identitas dan status dari satu AccessRecord (oleh Admin)
 * Menyimpan pembaruan secara sinkron di cache lokal dan asinkron di Cloud Firestore
 */
export function updateAccessRecord(
  recordIdOrCode: string,
  updatedData: Partial<AccessRecord>
): AccessRecord | null {
  const records = getAllAccessRecords();
  const cleanKey = recordIdOrCode.toUpperCase().trim();
  let updatedRecord: AccessRecord | null = null;

  const next = records.map((r) => {
    if (
      r.id === recordIdOrCode ||
      r.kodeAkses.toUpperCase().trim() === cleanKey ||
      (r.kodeAkses && cleanKey && r.kodeAkses.toUpperCase().trim().replace(/^GP-/, '') === cleanKey.replace(/^GP-/, ''))
    ) {
      const isAct = updatedData.isActive !== undefined ? updatedData.isActive : r.isActive;
      updatedRecord = {
        ...r,
        ...updatedData,
        namaGuru: updatedData.namaGuru !== undefined ? updatedData.namaGuru.trim() : r.namaGuru,
        nipGuru: updatedData.nipGuru !== undefined ? updatedData.nipGuru.trim() : r.nipGuru,
        namaSekolah: updatedData.namaSekolah !== undefined ? updatedData.namaSekolah.trim() : r.namaSekolah,
        namaSatuanPendidikan: updatedData.namaSekolah !== undefined ? updatedData.namaSekolah.trim() : (r.namaSatuanPendidikan || r.namaSekolah),
        jabatan: updatedData.jabatan || r.jabatan,
        fase: updatedData.fase || r.fase,
        kelas: updatedData.kelas || r.kelas,
        mataPelajaran: updatedData.mataPelajaran || r.mataPelajaran || 'Matematika',
        namaKepalaSekolah: updatedData.namaKepalaSekolah !== undefined ? updatedData.namaKepalaSekolah.trim() : r.namaKepalaSekolah,
        nipKepalaSekolah: updatedData.nipKepalaSekolah !== undefined ? updatedData.nipKepalaSekolah.trim() : r.nipKepalaSekolah,
        nomorHpPendaftar: updatedData.nomorHpPendaftar !== undefined ? updatedData.nomorHpPendaftar.trim() : r.nomorHpPendaftar,
        isActive: isAct,
        status: isAct ? 'active' : 'inactive',
        isLockedByAdmin: true,
        adminLastEditedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAllAccessRecords(next);
    // Simpan permanen ke Firestore
    saveAccessRecordToFirestore(updatedRecord).catch(() => {});
  }

  return updatedRecord;
}

/**
 * Memperbarui data identitas pengguna secara asinkron dengan jaminan sinkronisasi ke
 * Cloud Firestore (koleksi sipartan_access_codes) dan workspace pengguna (koleksi sipartan_user_workspaces)
 */
export async function updateAccessRecordAsync(
  recordIdOrCode: string,
  updatedData: Partial<AccessRecord>
): Promise<{ success: boolean; record: AccessRecord | null; error?: string }> {
  const updated = updateAccessRecord(recordIdOrCode, updatedData);
  if (!updated) {
    return { success: false, record: null, error: 'Data kode akses tidak ditemukan.' };
  }

  // 1. Simpan ke koleksi access codes Firestore
  const cloudRes = await saveAccessRecordToFirestore(updated);

  // 2. Simpan identitas baru langsung ke dokumen workspace user di Cloud Firestore
  try {
    const newIdentity = convertAccessRecordToIdentity(updated);
    await updateUserWorkspaceIdentityInFirestore(updated.kodeAkses, newIdentity);
  } catch (e) {
    console.warn('Gagal update identitas workspace user di Cloud:', e);
  }

  return {
    success: true,
    record: updated,
    error: cloudRes.success ? undefined : cloudRes.error,
  };
}

/**
 * Mencari kode akses baik dari cache lokal maupun verifikasi langsung ke Cloud Firestore
 */
export async function findAccessRecordAsync(code: string): Promise<AccessRecord | null> {
  const local = findAccessRecord(code);
  if (local && local.isActive) {
    return local;
  }
  return await findAccessRecordInFirestore(code);
}

/**
 * Sesi Aktif Pengguna Saat Ini
 */
export function getActiveSessionCode(): string | null {
  try {
    const code = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!code) return null;
    if (isDeactivatedLegacyCode(code)) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function setActiveSessionCode(code: string | null): void {
  try {
    if (code) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, code.toUpperCase().trim());
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Gagal menyimpan active session code:', e);
  }
}

export function clearActiveSessionCode(): void {
  setActiveSessionCode(null);
}

/**
 * Mengetahui batasan Fase yang diizinkan untuk akun tertentu:
 * - Master Admin & Demo (GP-RHB1): 'ALL' (bebas mengakses dan memilih Fase A, B, C)
 * - Akun Guru Reguler: Terkunci khusus pada record.fase ('Fase A', 'Fase B', atau 'Fase C')
 */
export function getAllowedFaseForRecord(record?: AccessRecord | null): 'Fase A' | 'Fase B' | 'Fase C' | 'ALL' {
  if (!record) return 'ALL';
  if (isMasterAccessCode(record.kodeAkses) || record.isPremiumMaster) return 'ALL';
  if (isDemoAccessCode(record.kodeAkses) || record.isDemo) return 'ALL';
  return record.fase || 'ALL';
}

/**
 * Mengonversi AccessRecord menjadi SchoolIdentity resmi aplikasi SIPARTAN.
 * Memastikan data sekolah dan guru terkunci 100% dengan apa yang tertera di form/record.
 * Untuk Akun Demo (GP-RHB1) & Master Admin: Pilihan Fase dan Kelas fleksibel mengikuti pilihan pengguna.
 * Untuk Akun Guru Reguler: Fase dan Kelas TERKUNCI PERMANEN sesuai form permintaan kode!
 */
export function convertAccessRecordToIdentity(
  record: AccessRecord,
  currentIdentity?: Partial<SchoolIdentity>
): SchoolIdentity {
  const isFlexibleFaseKelas =
    isMasterAccessCode(record.kodeAkses) ||
    isDemoAccessCode(record.kodeAkses) ||
    record.isPremiumMaster ||
    Boolean(record.isDemo);

  return {
    // Data Satuan Pendidikan & Guru SELALU TERKUNCI PERMANEN sesuai record
    namaSatuanPendidikan: (currentIdentity?.namaSatuanPendidikan && currentIdentity.namaSatuanPendidikan.toLowerCase() === (record.namaSatuanPendidikan || record.namaSekolah || '').toLowerCase())
      ? currentIdentity.namaSatuanPendidikan
      : (record.namaSatuanPendidikan || record.namaSekolah),
    namaGuru: record.namaGuru,
    nipGuru: record.nipGuru,
    peranGuru: record.jabatan,
    namaKepalaSekolah: record.namaKepalaSekolah,
    nipKepalaSekolah: record.nipKepalaSekolah,
    mataPelajaran: currentIdentity?.mataPelajaran || record.mataPelajaran || 'Matematika',
    // Fase & Kelas: Dapat diubah bebas jika akun demo atau master. Terkunci jika akun guru reguler!
    fase: isFlexibleFaseKelas ? (currentIdentity?.fase || record.fase) : record.fase,
    kelas: isFlexibleFaseKelas ? (currentIdentity?.kelas || record.kelas) : record.kelas,
    tahunPelajaran: currentIdentity?.tahunPelajaran || '2026/2027',
    semester: currentIdentity?.semester || '1 (Ganjil)',
    alokasiWaktuTotal: currentIdentity?.alokasiWaktuTotal || '180 JP / Tahun (5 JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025',
    tempatPenetapan: currentIdentity?.tempatPenetapan || (record.namaSatuanPendidikan || record.namaSekolah).replace(/UPTD?|SD|Negeri|Swasta/gi, '').trim() || 'Fatubai',
    tanggalPenetapan: currentIdentity?.tanggalPenetapan || new Date().toISOString().split('T')[0],
    isLockedByAdmin: Boolean(record.isLockedByAdmin || !isFlexibleFaseKelas),
  };
}

/**
 * Memvalidasi kode akses guru khusus untuk membuka fitur guru di Ruang Murid
 * (seperti Laporan & Rekap Nilai, Kelola Paket Ujian, dan Beralih ke Ruang Guru).
 * Kode disesuaikan dengan kode akses profil guru yang sedang aktif, kode master GP-1386,
 * atau kode guru resmi lainnya yang terdaftar.
 */
export function validateTeacherAccessCode(
  inputCode: string,
  activeRecord?: AccessRecord | null
): { isValid: boolean; message?: string; record?: AccessRecord } {
  if (!inputCode || !inputCode.trim()) {
    return { isValid: false, message: 'Harap masukkan kode akses guru.' };
  }
  const clean = inputCode.toUpperCase().trim();
  const cleanNoPrefix = clean.replace(/^GP-/, '');

  if (isDeactivatedLegacyCode(clean)) {
    return {
      isValid: false,
      message: 'Kode akses GP-86OK telah dinonaktifkan secara permanen.',
    };
  }

  // 1. Cek terhadap profil guru yang sedang aktif
  if (activeRecord?.kodeAkses) {
    const profileCode = activeRecord.kodeAkses.toUpperCase().trim();
    const profileNoPrefix = profileCode.replace(/^GP-/, '');
    if (clean === profileCode || cleanNoPrefix === profileNoPrefix) {
      return { isValid: true, record: activeRecord };
    }
  }

  // 2. Cek terhadap sesi kode aktif tersimpan di browser
  const sessionCode = getActiveSessionCode();
  if (sessionCode) {
    const cleanSession = sessionCode.toUpperCase().trim();
    const sessionNoPrefix = cleanSession.replace(/^GP-/, '');
    if (clean === cleanSession || cleanNoPrefix === sessionNoPrefix) {
      const rec = findAccessRecord(cleanSession) || DEFAULT_PREMIUM_RECORD;
      return { isValid: true, record: rec };
    }
  }

  // 3. Cek kode master admin & pengembang resmi (GP-1386 atau 1386)
  if (isMasterAccessCode(clean) || clean === '1386' || cleanNoPrefix === '1386') {
    return { isValid: true, record: DEFAULT_PREMIUM_RECORD };
  }

  // 4. Cek kode demo / simulasi resmi (GP-RHB1)
  if (isDemoAccessCode(clean) || cleanNoPrefix === 'RHB1') {
    return { isValid: true, record: DEFAULT_DEMO_RECORD };
  }

  // 5. Cek dari seluruh database kode akses terdaftar
  const found = findAccessRecord(clean) || findAccessRecord(`GP-${cleanNoPrefix}`);
  if (found && (found.isActive || found.status === 'active')) {
    return { isValid: true, record: found };
  }

  return {
    isValid: false,
    message: 'Kode akses tidak sesuai. Silakan masukkan Kode Akses Profil Guru Anda yang sah.',
  };
}

