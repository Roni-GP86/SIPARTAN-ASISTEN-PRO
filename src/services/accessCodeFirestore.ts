import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, getActiveFirebaseConfig } from './firebaseAuth';
import { AccessRecord } from '../types';
import {
  DEFAULT_PREMIUM_RECORD,
  DEFAULT_SIMULASI_RECORD,
  DEFAULT_FERIANUS_RECORD,
  MASTER_ACCESS_CODE,
  DEMO_ACCESS_CODE,
  isMasterAccessCode,
  isSimulationAccessCode,
  isDeactivatedLegacyCode,
  getAllAccessRecords,
  saveAllAccessRecords,
} from './accessCodeService';

export const FIRESTORE_ACCESS_CODES_COLLECTION = 'sipartan_access_codes';
export const FIRESTORE_SETTINGS_COLLECTION = 'sipartan_settings';

// Circuit breaker adaptif untuk pemulihan cepat
let isCloudAvailable = true;
let lastFailureTime = 0;
const FAILURE_COOLDOWN_MS = 4000; // Jeda singkat 4 detik saja untuk pemulihan cepat
let lastCloudErrorDetail: string | null = null;

export function getLastCloudErrorDetail(): string | null {
  return lastCloudErrorDetail;
}

export function resetCloudCooldown(): void {
  isCloudAvailable = true;
  lastFailureTime = 0;
  lastCloudErrorDetail = null;
}

export function isFirestoreOnline(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  return isCloudAvailable;
}

function canAttemptCloud(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  if (!isCloudAvailable) {
    if (Date.now() - lastFailureTime > FAILURE_COOLDOWN_MS) {
      isCloudAvailable = true; // Coba kembali setelah masa cooldown
      return true;
    }
    return false;
  }
  return true;
}

function markCloudFailure(err?: any) {
  isCloudAvailable = false;
  lastFailureTime = Date.now();
  const rawMsg = err?.message || String(err || '');
  const activeCfg = getActiveFirebaseConfig();
  const activeProject = activeCfg.projectId || 'level-program-7sjh2';

  if (
    rawMsg.includes('NOT_FOUND') ||
    rawMsg.includes('not-found') ||
    rawMsg.includes('404') ||
    rawMsg.includes('does not exist')
  ) {
    lastCloudErrorDetail = `Database Cloud Firestore belum dibuat pada proyek Firebase "${activeProject}". Buka Firebase Console (https://console.firebase.google.com/project/${activeProject}/firestore) lalu klik "Create Database" (Pilih "Start in test mode" / Mode Uji Coba: allow read, write: if true). Sebelum database diaktifkan di Firebase Console, aplikasi hanya dapat menyimpan data di perangkat masing-masing (tidak tersinkronisasi lintas gawai/Netlify).`;
  } else if (
    rawMsg.includes('PERMISSION_DENIED') ||
    rawMsg.includes('has not been used in project') ||
    rawMsg.includes('disabled')
  ) {
    lastCloudErrorDetail = `Akses ke database Firestore proyek "${activeProject}" ditolak. Pastikan Security Rules di Firebase Console telah disetel: "allow read, write: if true;".`;
  } else if (rawMsg.includes('offline') || rawMsg.includes('unavailable') || rawMsg.includes('timeout')) {
    lastCloudErrorDetail = `Koneksi internet atau backend Firestore proyek "${activeProject}" sedang tidak merespons (timeout). Data pendaftaran tetap tersimpan aman di perangkat lokal.`;
  } else {
    lastCloudErrorDetail = rawMsg || 'Koneksi Cloud Firestore tidak merespons.';
  }
  console.warn('[Firestore] Info koneksi:', lastCloudErrorDetail);
}

/**
 * Menguji koneksi langsung ke Cloud Firestore dan memberikan umpan balik diagnostik nyata
 */
export async function testFirestoreConnectionAsync(): Promise<{ success: boolean; message: string }> {
  resetCloudCooldown();
  const activeCfg = getActiveFirebaseConfig();
  const activeProject = activeCfg.projectId || 'level-program-7sjh2';
  try {
    // 1. Uji Tulis Dokumen Uji Ping Nyata
    const pingDocRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'connection_ping');
    const pingData = {
      pingTime: new Date().toISOString(),
      testedBy: 'Admin SIPARTAN',
      platform: typeof window !== 'undefined' ? window.navigator.userAgent : 'Browser',
      projectId: activeProject,
      status: 'online',
    };
    await withTimeout(setDoc(pingDocRef, pingData, { merge: true }), 5000);

    // 2. Uji Baca Koleksi Pendaftaran
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 5000);
    isCloudAvailable = true;
    lastCloudErrorDetail = null;

    // 3. Sinkronkan data pendaftaran lokal ke cloud jika belum ada di database
    const localRecords = getAllAccessRecords();
    const existingDocIds = new Set(snapshot.docs.map((d) => d.id));
    let uploadedCount = 0;
    for (const rec of localRecords) {
      const docId = rec.id || `acc-${rec.kodeAkses.replace(/\s+/g, '')}`;
      if (!existingDocIds.has(docId)) {
        await saveAccessRecordToFirestore(rec).catch(() => {});
        uploadedCount++;
      }
    }

    return {
      success: true,
      message: `KONEKSI CLOUD BERHASIL & ONLINE! Proyek Firebase "${activeProject}" terhubung aktif. Database Cloud Firestore siap menyinkronkan data pendaftaran guru dan pengaturan admin secara real-time ke semua perangkat/Netlify!` + (uploadedCount > 0 ? ` (Tersinkron ${uploadedCount} data lokal ke Cloud).` : ''),
    };
  } catch (err: any) {
    markCloudFailure(err);
    return {
      success: false,
      message: lastCloudErrorDetail || err?.message || `Gagal tersambung ke Cloud Firestore proyek "${activeProject}".`,
    };
  }
}

/**
 * Helper pembatas waktu agar operasi Firestore tidak macet atau hanging jika offline
 */
function withTimeout<T>(promise: Promise<T>, ms = 6500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout: backend tidak merespons')), ms)
    ),
  ]);
}

/**
 * Pembersih nilai undefined agar tidak menyebabkan error pada Firestore SDK
 */
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Menyimpan atau memperbarui 1 data kode akses guru ke Cloud Firestore
 */
export async function saveAccessRecordToFirestore(
  record: AccessRecord
): Promise<{ success: boolean; error?: string }> {
  if (!canAttemptCloud()) {
    return {
      success: false,
      error: lastCloudErrorDetail || 'Jaringan Cloud Firestore sedang offline / tidak terjangkau.',
    };
  }
  try {
    const clean = (record.kodeAkses || '').toUpperCase().trim();
    const docId = clean ? `acc-${clean.replace(/\s+/g, '')}` : (record.id || `acc-${Date.now()}`);
    const sanitized = cleanFirestoreData({
      ...record,
      id: docId,
      status: record.isActive ? 'active' : 'inactive',
      updatedAt: new Date().toISOString(),
    });

    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, docId);
    await withTimeout(setDoc(docRef, sanitized, { merge: true }), 4000);
    isCloudAvailable = true;
    return { success: true };
  } catch (error: any) {
    markCloudFailure(error);
    return {
      success: false,
      error: lastCloudErrorDetail || error?.message || 'Gagal menyimpan ke Cloud Firestore.',
    };
  }
}

/**
 * Menghapus data kode akses dari Cloud Firestore
 */
export async function deleteAccessRecordFromFirestore(recordId: string, kodeAkses?: string): Promise<void> {
  if (!canAttemptCloud()) return;
  try {
    if (recordId) {
      const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, recordId);
      await withTimeout(deleteDoc(docRef), 3000).catch(() => {});
    }
    if (kodeAkses) {
      const clean = kodeAkses.toUpperCase().trim();
      const altDocRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, `acc-${clean.replace(/\s+/g, '')}`);
      await withTimeout(deleteDoc(altDocRef), 3000).catch(() => {});
    }
    isCloudAvailable = true;
  } catch (error) {
    markCloudFailure(error);
  }
}

/**
 * Mengubah status aktif/nonaktif satu kode akses di Cloud Firestore
 */
export async function updateAccessRecordStatusInFirestore(
  recordId: string,
  isActive: boolean,
  kodeAkses?: string
): Promise<void> {
  if (!canAttemptCloud()) return;
  try {
    const clean = (kodeAkses || '').toUpperCase().trim();
    const docId = clean ? `acc-${clean.replace(/\s+/g, '')}` : recordId;
    if (!docId) return;

    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, docId);
    const updateData: Record<string, any> = {
      isActive,
      status: isActive ? 'active' : 'inactive',
      updatedAt: new Date().toISOString(),
    };
    if (isActive) {
      updateData.tanggalAktivasi = new Date().toISOString();
    }
    await withTimeout(setDoc(docRef, updateData, { merge: true }), 3000);
    // Jika recordId berbeda dengan docId, perbarui juga recordId lama untuk konsistensi
    if (recordId && recordId !== docId) {
      const legacyRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, recordId);
      await withTimeout(setDoc(legacyRef, updateData, { merge: true }), 2000).catch(() => {});
    }
    isCloudAvailable = true;
  } catch (error) {
    markCloudFailure(error);
  }
}

/**
 * Mengaktifkan atau menonaktifkan seluruh kode akses di Cloud Firestore
 */
export async function batchUpdateAllAccessCodesInFirestore(isActive: boolean): Promise<void> {
  if (!canAttemptCloud()) return;
  try {
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 4000);
    const now = new Date().toISOString();

    const updates = snapshot.docs.map(async (d) => {
      const data = d.data();
      if (data.isPremiumMaster || isMasterAccessCode(data.kodeAkses)) {
        return;
      }
      await setDoc(
        d.ref,
        {
          isActive,
          status: isActive ? 'active' : 'inactive',
          ...(isActive ? { tanggalAktivasi: now } : {}),
          updatedAt: now,
        },
        { merge: true }
      );
    });

    await Promise.all(updates);
    isCloudAvailable = true;
  } catch (error) {
    markCloudFailure(error);
  }
}

/**
 * Menggabungkan data dari Firestore dengan default system records (Master & Demo)
 * serta memastikan data localStorage lokal juga tersinkronisasi.
 */
function mergeAndNormalizeRecords(cloudRecords: AccessRecord[]): AccessRecord[] {
  const mapByCode = new Map<string, AccessRecord>();

  // 1. Masukkan akun Master (GP-1386), Demo bawaan (GP-RHB1), dan Guru Resmi (GP-FE86) terlebih dahulu
  mapByCode.set(MASTER_ACCESS_CODE, DEFAULT_PREMIUM_RECORD);
  mapByCode.set(DEMO_ACCESS_CODE, DEFAULT_SIMULASI_RECORD);
  mapByCode.set('GP-FE86', DEFAULT_FERIANUS_RECORD);

  // 2. Masukkan data dari cloud (abaikan dan bersihkan GP-86OK jika masih tersimpan di cloud lama)
  cloudRecords.forEach((r) => {
    if (!r.kodeAkses) return;
    const cleanCode = r.kodeAkses.toUpperCase().trim();

    // Hapus dokumen GP-86OK lama dari Firestore jika ditemukan
    if (isDeactivatedLegacyCode(cleanCode) || r.id === 'acc-master-gp86ok') {
      deleteAccessRecordFromFirestore(r.id || 'acc-master-gp86ok', cleanCode).catch(() => {});
      return;
    }

    if (isMasterAccessCode(cleanCode)) {
      mapByCode.set(MASTER_ACCESS_CODE, {
        ...DEFAULT_PREMIUM_RECORD,
        ...r,
        kodeAkses: MASTER_ACCESS_CODE,
        namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
        nipGuru: '198603012020121005',
        isPremiumMaster: true,
      });
    } else if (isSimulationAccessCode(cleanCode)) {
      mapByCode.set(DEMO_ACCESS_CODE, {
        ...DEFAULT_SIMULASI_RECORD,
        ...r,
        namaGuru: 'Roni Hariyanto Bhidju, S.Pd',
        nipGuru: '198603012020121005',
        isDemo: true,
      });
    } else {
      mapByCode.set(cleanCode, {
        ...r,
        status: r.isActive ? 'active' : 'inactive',
        namaSatuanPendidikan: r.namaSatuanPendidikan || r.namaSekolah,
      });
    }
  });

  // 3. Masukkan data lokal lama jika belum ada di cloud (agar data lama lokal tidak hilang)
  const localList = getAllAccessRecords();
  localList.forEach((localRec) => {
    if (!localRec.kodeAkses) return;
    const clean = localRec.kodeAkses.toUpperCase().trim();
    if (!mapByCode.has(clean)) {
      mapByCode.set(clean, localRec);
      // Kirim ke cloud di background jika cloud sedang aktif
      if (canAttemptCloud()) {
        saveAccessRecordToFirestore(localRec).catch(() => {});
      }
    }
  });

  const merged = Array.from(mapByCode.values());
  // Simpan ke localStorage sebagai cache sinkron offline
  saveAllAccessRecords(merged);
  return merged;
}

/**
 * Mengambil seluruh data kode akses dari Cloud Firestore secara one-time fetch
 */
export async function fetchAllAccessRecordsFromFirestore(): Promise<AccessRecord[]> {
  if (!canAttemptCloud()) {
    return getAllAccessRecords();
  }

  try {
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 3500);
    const cloudRecords: AccessRecord[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRecord;
      cloudRecords.push({
        ...data,
        id: data.id || docSnap.id,
      });
    });

    isCloudAvailable = true;
    const merged = mergeAndNormalizeRecords(cloudRecords);
    return merged;
  } catch (error) {
    markCloudFailure(error);
    return getAllAccessRecords();
  }
}

/**
 * Berlangganan (Real-Time Listener) pada koleksi kode akses di Cloud Firestore.
 * Aman dan otomatis fallback jika koneksi cloud offline.
 */
export function subscribeToAccessRecordsFromFirestore(
  onRecordsUpdated: (records: AccessRecord[]) => void
): () => void {
  if (!canAttemptCloud()) {
    onRecordsUpdated(getAllAccessRecords());
    return () => {};
  }

  try {
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    let active = true;
    let unsubInternal: (() => void) | null = null;

    unsubInternal = onSnapshot(
      colRef,
      (snapshot) => {
        if (!active) return;
        isCloudAvailable = true;
        const cloudRecords: AccessRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AccessRecord;
          cloudRecords.push({
            ...data,
            id: data.id || docSnap.id,
          });
        });

        const merged = mergeAndNormalizeRecords(cloudRecords);
        onRecordsUpdated(merged);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sipartan_access_records_synced', { detail: { count: merged.length } })
          );
        }
      },
      (error) => {
        markCloudFailure(error);
        onRecordsUpdated(getAllAccessRecords());
        // Hentikan listener yang gagal agar tidak terus mengulang error koneksi
        if (unsubInternal) {
          try {
            unsubInternal();
          } catch {}
          unsubInternal = null;
        }
      }
    );

    return () => {
      active = false;
      if (unsubInternal) {
        try {
          unsubInternal();
        } catch {}
      }
    };
  } catch (error) {
    markCloudFailure(error);
    onRecordsUpdated(getAllAccessRecords());
    return () => {};
  }
}

/**
 * Mencari satu kode akses langsung dari Firestore untuk memastikan status terbarunya.
 * Menggunakan direct document lookup O(1) dan targeted query untuk respon secepat kilat.
 */
export async function findAccessRecordInFirestore(code: string): Promise<AccessRecord | null> {
  if (!code) return null;
  const clean = code.toUpperCase().trim();

  if (isMasterAccessCode(clean)) return DEFAULT_PREMIUM_RECORD;
  if (isSimulationAccessCode(clean)) return DEFAULT_SIMULASI_RECORD;

  if (canAttemptCloud()) {
    try {
      const standardDocId = `acc-${clean.replace(/\s+/g, '')}`;
      const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, standardDocId);
      
      // 1. Coba baca langsung dokumen spesifik (sangat cepat, O(1))
      const docSnap = await withTimeout(getDoc(docRef), 2000).catch(() => null);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as AccessRecord;
        const matched: AccessRecord = {
          ...data,
          id: docSnap.id,
          status: data.isActive ? 'active' : 'inactive',
        };
        isCloudAvailable = true;
        // Sinkronkan ke cache lokal
        const local = getAllAccessRecords();
        const idx = local.findIndex((r) => r.kodeAkses.toUpperCase().trim() === clean);
        if (idx >= 0) local[idx] = matched;
        else local.unshift(matched);
        saveAllAccessRecords(local);
        return matched;
      }

      // 2. Jika tidak ditemukan via docId standar, gunakan query terindeks berlimit 1
      const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
      const q = query(colRef, where('kodeAkses', '==', clean), limit(1));
      const qSnap = await withTimeout(getDocs(q), 2000).catch(() => null);
      if (qSnap && !qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        const data = firstDoc.data() as AccessRecord;
        const matched: AccessRecord = {
          ...data,
          id: firstDoc.id,
          status: data.isActive ? 'active' : 'inactive',
        };
        isCloudAvailable = true;
        const local = getAllAccessRecords();
        const idx = local.findIndex((r) => r.kodeAkses.toUpperCase().trim() === clean);
        if (idx >= 0) local[idx] = matched;
        else local.unshift(matched);
        saveAllAccessRecords(local);
        return matched;
      }
    } catch (error) {
      markCloudFailure(error);
    }
  }

  // Fallback ke pencarian local storage
  const localList = getAllAccessRecords();
  return localList.find((r) => r.kodeAkses.toUpperCase().trim() === clean) || null;
}

/**
 * Sinkronisasi status proteksi Microsoft Word di Cloud Firestore
 */
export async function saveWordExportDisabledToFirestore(
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!canAttemptCloud()) {
    return {
      success: false,
      error: lastCloudErrorDetail || 'Jaringan Cloud Firestore offline.',
    };
  }
  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    await withTimeout(
      setDoc(docRef, { disabled, updatedAt: new Date().toISOString() }, { merge: true }),
      3500
    );
    isCloudAvailable = true;
    return { success: true };
  } catch (e: any) {
    markCloudFailure(e);
    return {
      success: false,
      error: lastCloudErrorDetail || e?.message || 'Gagal menyimpan ke Cloud Firestore',
    };
  }
}

export async function fetchWordExportDisabledFromFirestore(): Promise<boolean | null> {
  if (!canAttemptCloud()) return null;
  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    const snap = await withTimeout(getDoc(docRef), 2500);
    if (snap.exists()) {
      isCloudAvailable = true;
      const data = snap.data();
      return Boolean(data.disabled);
    }
  } catch (e) {
    markCloudFailure(e);
  }
  return null;
}

/**
 * Berlangganan (Real-time Listener) kebijakan unduhan Microsoft Word dari Cloud Firestore.
 * Ketika Admin mengubah toggle Proteksi Unduhan Word, semua perangkat & user yang membuka aplikasi
 * akan langsung menerima status kebijakan baru secara real-time tanpa perlu me-refresh browser.
 */
export function subscribeToWordExportDisabledFromFirestore(
  onPolicyChanged: (disabled: boolean) => void
): () => void {
  if (!canAttemptCloud()) {
    return () => {};
  }

  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    let active = true;
    let unsubInternal: (() => void) | null = null;

    unsubInternal = onSnapshot(
      docRef,
      (docSnap) => {
        if (!active) return;
        isCloudAvailable = true;
        if (docSnap.exists()) {
          const data = docSnap.data();
          const disabled = Boolean(data?.disabled);
          onPolicyChanged(disabled);
        }
      },
      (err) => {
        markCloudFailure(err);
        if (unsubInternal) {
          try {
            unsubInternal();
          } catch {}
          unsubInternal = null;
        }
      }
    );

    return () => {
      active = false;
      if (unsubInternal) {
        try {
          unsubInternal();
        } catch {}
      }
    };
  } catch (e) {
    return () => {};
  }
}

