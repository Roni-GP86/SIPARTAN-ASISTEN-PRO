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
import { db, getActiveFirebaseConfig, ensureFirebaseAuth } from './firebaseAuth';
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

let isCloudOnlineState = true;
let lastCloudErrorMessage: string | null = null;

export function getLastCloudErrorDetail(): string | null {
  return lastCloudErrorMessage;
}

export function resetCloudCooldown(): void {
  isCloudOnlineState = true;
  lastCloudErrorMessage = null;
}

export function isFirestoreOnline(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  return isCloudOnlineState;
}

/**
 * Pembersih nilai undefined agar tidak ditolak Firestore SDK
 */
function sanitizeFirestorePayload<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Menguji koneksi langsung ke Cloud Firestore
 */
export async function testFirestoreConnectionAsync(): Promise<{ success: boolean; message: string }> {
  resetCloudCooldown();
  await ensureFirebaseAuth().catch(() => null);
  const activeCfg = getActiveFirebaseConfig();
  const activeProject = activeCfg.projectId || 'bahan-ajar-guru';

  try {
    // 1. Tulis ping ke collection settings
    const pingDocRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'connection_ping');
    await setDoc(
      pingDocRef,
      {
        pingTime: new Date().toISOString(),
        testedBy: 'Admin SIPARTAN',
        projectId: activeProject,
        status: 'online',
      },
      { merge: true }
    );

    // 2. Baca koleksi pendaftaran
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await getDocs(colRef);
    isCloudOnlineState = true;
    lastCloudErrorMessage = null;

    // 3. Pastikan data Master & Demo ada di Cloud Firestore jika koleksi masih kosong
    if (snapshot.empty) {
      await saveAccessRecordToFirestore(DEFAULT_PREMIUM_RECORD).catch(() => {});
      await saveAccessRecordToFirestore(DEFAULT_SIMULASI_RECORD).catch(() => {});
      await saveAccessRecordToFirestore(DEFAULT_FERIANUS_RECORD).catch(() => {});
    }

    return {
      success: true,
      message: `KONEKSI CLOUD BERHASIL & ONLINE! Proyek Firebase "${activeProject}" terhubung aktif dan siap menyinkronkan data secara real-time ke seluruh gawai/Netlify.`,
    };
  } catch (err: any) {
    isCloudOnlineState = false;
    lastCloudErrorMessage = err?.message || `Gagal tersambung ke Cloud Firestore "${activeProject}".`;
    console.warn('[Firestore] Test connection error:', lastCloudErrorMessage);
    return {
      success: false,
      message: lastCloudErrorMessage,
    };
  }
}

/**
 * Menyimpan / memperbarui 1 data kode akses guru ke Cloud Firestore
 */
export async function saveAccessRecordToFirestore(
  record: AccessRecord
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const clean = (record.kodeAkses || '').toUpperCase().trim();
    const docId = clean ? `acc-${clean.replace(/\s+/g, '')}` : (record.id || `acc-${Date.now()}`);
    
    const sanitized = sanitizeFirestorePayload({
      ...record,
      id: docId,
      status: record.isActive ? 'active' : 'inactive',
      updatedAt: new Date().toISOString(),
    });

    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, docId);
    await setDoc(docRef, sanitized, { merge: true });
    isCloudOnlineState = true;
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Save record error:', error);
    lastCloudErrorMessage = error?.message || 'Gagal menyimpan ke Cloud Firestore.';
    return {
      success: false,
      error: lastCloudErrorMessage,
    };
  }
}

/**
 * Menghapus data kode akses dari Cloud Firestore secara permanen
 */
export async function deleteAccessRecordFromFirestore(
  recordId: string,
  kodeAkses?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    if (recordId) {
      const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, recordId);
      await deleteDoc(docRef);
    }
    if (kodeAkses) {
      const clean = kodeAkses.toUpperCase().trim();
      const altDocRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, `acc-${clean.replace(/\s+/g, '')}`);
      await deleteDoc(altDocRef);
    }
    isCloudOnlineState = true;
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Delete record error:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Mengubah status aktif/nonaktif satu kode akses di Cloud Firestore
 */
export async function updateAccessRecordStatusInFirestore(
  recordId: string,
  isActive: boolean,
  kodeAkses?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const clean = (kodeAkses || '').toUpperCase().trim();
    const docId = clean ? `acc-${clean.replace(/\s+/g, '')}` : recordId;
    if (!docId) return { success: false, error: 'ID tidak valid' };

    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, docId);
    const updateData: Record<string, any> = {
      isActive,
      status: isActive ? 'active' : 'inactive',
      updatedAt: new Date().toISOString(),
    };
    if (isActive) {
      updateData.tanggalAktivasi = new Date().toISOString();
    }
    await setDoc(docRef, updateData, { merge: true });

    if (recordId && recordId !== docId) {
      const legacyRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, recordId);
      await setDoc(legacyRef, updateData, { merge: true }).catch(() => {});
    }
    isCloudOnlineState = true;
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Update status error:', error);
    return { success: false, error: error?.message };
  }
}

/**
 * Mengaktifkan atau menonaktifkan seluruh kode akses di Cloud Firestore
 */
export async function batchUpdateAllAccessCodesInFirestore(isActive: boolean): Promise<void> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await getDocs(colRef);
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
    isCloudOnlineState = true;
  } catch (error) {
    console.error('[Firestore] Batch update error:', error);
  }
}

/**
 * Normalisasi data Cloud Firestore dengan akun bawaan sistem
 */
function mergeAndNormalizeRecords(cloudRecords: AccessRecord[]): AccessRecord[] {
  const mapByCode = new Map<string, AccessRecord>();

  // 1. Akun Master & Demo bawaan
  mapByCode.set(MASTER_ACCESS_CODE, DEFAULT_PREMIUM_RECORD);
  mapByCode.set(DEMO_ACCESS_CODE, DEFAULT_SIMULASI_RECORD);

  // 2. Data dari Cloud Firestore
  cloudRecords.forEach((r) => {
    if (!r.kodeAkses) return;
    const cleanCode = r.kodeAkses.toUpperCase().trim();

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
        id: r.id || `acc-${cleanCode.replace(/\s+/g, '')}`,
        status: r.isActive ? 'active' : 'inactive',
        namaSatuanPendidikan: r.namaSatuanPendidikan || r.namaSekolah,
      });
    }
  });

  const merged = Array.from(mapByCode.values());
  saveAllAccessRecords(merged);
  return merged;
}

/**
 * Mengambil seluruh data kode akses dari Cloud Firestore secara one-time fetch
 */
export async function fetchAllAccessRecordsFromFirestore(): Promise<AccessRecord[]> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const cloudRecords: AccessRecord[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRecord;
      cloudRecords.push({
        ...data,
        id: data.id || docSnap.id,
      });
    });

    isCloudOnlineState = true;
    return mergeAndNormalizeRecords(cloudRecords);
  } catch (error) {
    console.error('[Firestore] Fetch all error:', error);
    return getAllAccessRecords();
  }
}

/**
 * Berlangganan (Real-Time Listener) pada koleksi kode akses di Cloud Firestore.
 */
export function subscribeToAccessRecordsFromFirestore(
  onRecordsUpdated: (records: AccessRecord[]) => void
): () => void {
  try {
    ensureFirebaseAuth().catch(() => null);
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    let active = true;

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!active) return;
        isCloudOnlineState = true;
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
        console.warn('[Firestore] Subscription listener error:', error);
        onRecordsUpdated(getAllAccessRecords());
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  } catch (error) {
    console.error('[Firestore] Failed to subscribe:', error);
    onRecordsUpdated(getAllAccessRecords());
    return () => {};
  }
}

/**
 * Berlangganan (Real-time Listener) pada 1 kode akses spesifik.
 */
export function subscribeToSingleAccessCode(
  code: string,
  onRecordUpdated: (record: AccessRecord | null) => void
): () => void {
  if (!code) {
    onRecordUpdated(null);
    return () => {};
  }
  const clean = code.toUpperCase().trim();
  if (isMasterAccessCode(clean)) {
    onRecordUpdated(DEFAULT_PREMIUM_RECORD);
    return () => {};
  }
  if (isSimulationAccessCode(clean)) {
    onRecordUpdated(DEFAULT_SIMULASI_RECORD);
    return () => {};
  }

  try {
    ensureFirebaseAuth().catch(() => null);
    const docId = `acc-${clean.replace(/\s+/g, '')}`;
    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, docId);
    let active = true;

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!active) return;
        isCloudOnlineState = true;
        if (docSnap.exists()) {
          const data = docSnap.data() as AccessRecord;
          const rec: AccessRecord = {
            ...data,
            id: docSnap.id,
            status: data.isActive ? 'active' : 'inactive',
          };
          onRecordUpdated(rec);
        } else {
          onRecordUpdated(findAccessRecordInFirestore(clean) as any);
        }
      },
      (err) => {
        console.warn('[Firestore] Single code listener error:', err);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  } catch (err) {
    console.error('[Firestore] Single code subscribe error:', err);
    return () => {};
  }
}

/**
 * Mencari satu kode akses langsung dari Firestore
 */
export async function findAccessRecordInFirestore(code: string): Promise<AccessRecord | null> {
  if (!code) return null;
  const clean = code.toUpperCase().trim();

  if (isMasterAccessCode(clean)) return DEFAULT_PREMIUM_RECORD;
  if (isSimulationAccessCode(clean)) return DEFAULT_SIMULASI_RECORD;

  try {
    await ensureFirebaseAuth().catch(() => null);
    const standardDocId = `acc-${clean.replace(/\s+/g, '')}`;
    const docRef = doc(db, FIRESTORE_ACCESS_CODES_COLLECTION, standardDocId);
    
    // 1. Baca langsung by ID
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AccessRecord;
      const matched: AccessRecord = {
        ...data,
        id: docSnap.id,
        status: data.isActive ? 'active' : 'inactive',
      };
      isCloudOnlineState = true;
      return matched;
    }

    // 2. Query fallback jika doc ID berbeda
    const colRef = collection(db, FIRESTORE_ACCESS_CODES_COLLECTION);
    const q = query(colRef, where('kodeAkses', '==', clean), limit(1));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const firstDoc = qSnap.docs[0];
      const data = firstDoc.data() as AccessRecord;
      const matched: AccessRecord = {
        ...data,
        id: firstDoc.id,
        status: data.isActive ? 'active' : 'inactive',
      };
      isCloudOnlineState = true;
      return matched;
    }
  } catch (error) {
    console.error('[Firestore] Find code error:', error);
  }

  // Fallback ke cache lokal
  const localList = getAllAccessRecords();
  return localList.find((r) => r.kodeAkses.toUpperCase().trim() === clean) || null;
}

/**
 * Sinkronisasi status proteksi Microsoft Word di Cloud Firestore
 */
export async function saveWordExportDisabledToFirestore(
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    await setDoc(docRef, { disabled, updatedAt: new Date().toISOString() }, { merge: true });
    isCloudOnlineState = true;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

export async function fetchWordExportDisabledFromFirestore(): Promise<boolean | null> {
  try {
    await ensureFirebaseAuth().catch(() => null);
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      isCloudOnlineState = true;
      return Boolean(snap.data()?.disabled);
    }
  } catch (e) {
    console.warn('[Firestore] Fetch word policy error:', e);
  }
  return null;
}

export function subscribeToWordExportDisabledFromFirestore(
  onPolicyChanged: (disabled: boolean) => void
): () => void {
  try {
    ensureFirebaseAuth().catch(() => null);
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, 'word_export_policy');
    let active = true;

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!active) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          onPolicyChanged(Boolean(data?.disabled));
        }
      },
      () => {}
    );

    return () => {
      active = false;
      unsubscribe();
    };
  } catch (e) {
    return () => {};
  }
}
