import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseAuth';

export const RUANG_MURID_STUDENT_PASSCODE = 'FTB-123';
export const MASTER_ADMIN_ACCESS_CODE = 'GP-1386';

const RUANG_MURID_ENABLED_STORAGE_KEY = 'sipartan_ruang_murid_enabled_v1';
const RUANG_MURID_AUTH_SESSION_KEY = 'sipartan_ruang_murid_auth_session_v1';
const FIRESTORE_SETTINGS_COLLECTION = 'sipartan_settings';
const RUANG_MURID_POLICY_DOC = 'ruang_murid_policy';

/**
 * Timeout helper agar koneksi jaringan lambat tidak memblokir aplikasi
 */
function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi Firestore timeout')), ms)
    ),
  ]);
}

/**
 * Cek apakah Ruang Murid aktif (bisa diakses)
 * Default: true
 */
export function isRuangMuridEnabled(): boolean {
  try {
    const val = localStorage.getItem(RUANG_MURID_ENABLED_STORAGE_KEY);
    if (val === null) return true; // default aktif
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Mengubah status aktif/nonaktif Ruang Murid oleh Administrator Master (GP-1386).
 * Tersinkronisasi ke Cloud Firestore secara real-time lintas perangkat.
 */
export async function setRuangMuridEnabled(
  enabled: boolean,
  adminCode: string
): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  const cleanCode = adminCode.trim().toUpperCase();
  if (cleanCode !== MASTER_ADMIN_ACCESS_CODE) {
    return {
      success: false,
      cloudSynced: false,
      message: 'Kode akses tidak valid. Hanya Master Admin (GP-1386) yang berhak mengubah status Ruang Murid.',
    };
  }

  try {
    // 1. Simpan ke LocalStorage
    localStorage.setItem(RUANG_MURID_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');

    // 2. Broadcast event lokal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sipartan_ruang_murid_status_changed', {
          detail: { enabled },
        })
      );
    }

    // 3. Simpan ke Cloud Firestore untuk sinkronisasi seluruh perangkat
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, RUANG_MURID_POLICY_DOC);
    await withTimeout(
      setDoc(
        docRef,
        {
          enabled,
          studentPasscode: RUANG_MURID_STUDENT_PASSCODE,
          updatedAt: new Date().toISOString(),
          updatedBy: MASTER_ADMIN_ACCESS_CODE,
          school: 'SD Negeri Fatubai',
        },
        { merge: true }
      ),
      4500
    );

    return {
      success: true,
      cloudSynced: true,
      message: enabled
        ? 'Ruang Murid BERHASIL DIAKTIFKAN di Cloud Firestore! Seluruh murid di semua perangkat & gawai dapat mengakses lembar soal.'
        : 'Ruang Murid BERHASIL DINONAKTIFKAN di Cloud Firestore! Fitur ini kini terkunci secara serentak di semua perangkat murid.',
    };
  } catch (e: any) {
    console.warn('[RuangMuridPolicy] Gagal mengirim ke Cloud Firestore:', e);
    return {
      success: true,
      cloudSynced: false,
      message:
        (enabled ? 'Ruang Murid diaktifkan di perangkat ini.' : 'Ruang Murid dinonaktifkan di perangkat ini.') +
        ' PERINGATAN: Gagal sinkron ke Cloud Firestore (Database offline/belum aktif di Firebase Console). Agar perubahan berlaku di HP/Laptop teman, pastikan database Firestore telah dibuat.',
    };
  }
}

/**
 * Mengambil status kebijakan Ruang Murid dari Cloud Firestore
 */
export async function fetchRuangMuridPolicyFromFirestore(): Promise<boolean> {
  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, RUANG_MURID_POLICY_DOC);
    const snap = await withTimeout(getDoc(docRef), 3000);
    if (snap.exists()) {
      const data = snap.data();
      const enabled = data.enabled !== undefined ? Boolean(data.enabled) : true;
      localStorage.setItem(RUANG_MURID_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
      return enabled;
    }
  } catch (e) {
    console.warn('[RuangMuridPolicy] Menggunakan status lokal:', e);
  }
  return isRuangMuridEnabled();
}

/**
 * Real-time Listener (onSnapshot) kebijakan Ruang Murid dari Cloud Firestore.
 * Mengupdate status pada semua gawai (ponsel, tablet, laptop) seketika admin mengubah toggle.
 */
export function subscribeToRuangMuridPolicy(
  onPolicyChanged: (enabled: boolean) => void
): () => void {
  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, RUANG_MURID_POLICY_DOC);
    let active = true;

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const enabled = data.enabled !== undefined ? Boolean(data.enabled) : true;
          localStorage.setItem(RUANG_MURID_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
          onPolicyChanged(enabled);
        }
      },
      (err) => {
        console.warn('[RuangMuridPolicy] Listener offline:', err);
      }
    );

    return () => {
      active = false;
      try {
        unsub();
      } catch {}
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Verifikasi apakah kode yang dimasukkan murid cocok dengan kode unik resmi FTB-123
 */
export function verifyRuangMuridStudentPasscode(inputCode: string): boolean {
  if (!inputCode) return false;
  return inputCode.trim().toUpperCase() === RUANG_MURID_STUDENT_PASSCODE;
}

/**
 * Cek apakah sesi murid saat ini sudah terautentikasi kode FTB-123
 */
export function isStudentAuthenticatedForRuangMurid(): boolean {
  try {
    const sessionAuth = sessionStorage.getItem(RUANG_MURID_AUTH_SESSION_KEY);
    return sessionAuth === 'true';
  } catch {
    return false;
  }
}

/**
 * Set status autentikasi kode masuk murid
 */
export function setStudentAuthenticatedForRuangMurid(authenticated: boolean): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(RUANG_MURID_AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(RUANG_MURID_AUTH_SESSION_KEY);
    }
    // Bersihkan dari localStorage agar tidak tersimpan permanen lintas hari/sesi
    localStorage.removeItem(RUANG_MURID_AUTH_SESSION_KEY);
  } catch (e) {
    console.error('Gagal menyimpan sesi autentikasi murid:', e);
  }
}

const RUANG_MURID_TEACHER_AUTH_SESSION_KEY = 'sipartan_ruang_murid_teacher_auth_v1';

/**
 * Cek apakah guru sudah membuka kunci akses fitur guru (Laporan Rekap & Kelola Paket) di Ruang Murid
 */
export function isTeacherAuthenticatedForRuangMurid(): boolean {
  try {
    return sessionStorage.getItem(RUANG_MURID_TEACHER_AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Simpan / cabut status otorisasi guru di Ruang Murid
 */
export function setTeacherAuthenticatedForRuangMurid(authenticated: boolean): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(RUANG_MURID_TEACHER_AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(RUANG_MURID_TEACHER_AUTH_SESSION_KEY);
    }
  } catch {}
}

/**
 * Memvalidasi kode akses guru untuk membuka fitur guru (Rekap Nilai & Kelola Paket) di Ruang Murid.
 * Disesuaikan langsung dengan Kode Akses Profil Guru aktif, kode master, dan kode terdaftar.
 */
export function verifyTeacherProfileAccessCode(
  inputCode: string,
  teacherActiveCode?: string | null
): boolean {
  if (!inputCode) return false;
  const clean = inputCode.trim().toUpperCase();

  // 1. Kode yang berasal dari profil guru aktif (identitas / activeSessionCode)
  if (teacherActiveCode && clean === teacherActiveCode.trim().toUpperCase()) {
    return true;
  }

  // 2. Kode dari session storage / local storage
  try {
    const sessionCode = localStorage.getItem('sipartan_active_session_code');
    if (sessionCode && clean === sessionCode.trim().toUpperCase()) {
      return true;
    }
  } catch {}

  // 3. Kode Master Guru & Administrator
  if (
    clean === 'GP-1386' ||
    clean === 'GP-FATUBAI2026' ||
    clean === 'FATUBAI2026' ||
    clean === 'GP-MASTER' ||
    clean === 'ADMIN-FATUBAI' ||
    clean.startsWith('GP-')
  ) {
    // Periksa daftar pendaftaran kode akses lokal
    try {
      const stored = localStorage.getItem('sipartan_access_records_v1');
      if (stored) {
        const records = JSON.parse(stored);
        if (Array.isArray(records)) {
          const found = records.find(
            (r: any) =>
              r.kodeAkses &&
              r.kodeAkses.trim().toUpperCase() === clean &&
              (r.isActive !== false || r.isPremiumMaster)
          );
          if (found) return true;
        }
      }
    } catch {}

    if (
      clean === 'GP-1386' ||
      clean === 'GP-FATUBAI2026' ||
      clean === 'FATUBAI2026' ||
      clean === 'GP-MASTER' ||
      clean === 'ADMIN-FATUBAI'
    ) {
      return true;
    }
  }

  return false;
}
