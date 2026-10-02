import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseAuth';
import {
  SchoolIdentity,
  BedahElemenRow,
  TPItem,
  SelectedElementItem,
  ATPDocument,
  KKTPDocument,
  ProtaDocument,
  PromesDocument,
  ModulAjarDocument,
  KisiKisiSoalDocument,
  SavedItem,
  StudentInfo,
} from '../types';
import { SubjectWorkspace, getAllSubjectWorkspaces, saveAllSubjectWorkspaces } from '../utils/subjectWorkspaceService';
import { STORAGE_KEYS, saveToStorage, createAutoSnapshot, loadFromStorage } from '../utils/storageUtils';
import { isMasterAccessCode } from './accessCodeService';
import { saveStudentList, getStudentList } from './studentService';

export const FIRESTORE_WORKSPACES_COLLECTION = 'sipartan_user_workspaces';

export interface UserWorkspaceDrafts {
  tpList: TPItem[];
  elemenRows: BedahElemenRow[];
  selectedElements: SelectedElementItem[];
  rasionalAnalisis: string;
  atpDocument: ATPDocument | null;
  kktpDocument: KKTPDocument | null;
  protaDocument: ProtaDocument | null;
  promesDocument: PromesDocument | null;
  modulAjarDocument: ModulAjarDocument | null;
  soalDocument?: KisiKisiSoalDocument | null;
  preferensiTambahan?: string;
  activeTab?: string;
}

export interface UserWorkspaceCloudData {
  kodeAkses: string;
  identitas: SchoolIdentity;
  workspaces: Record<string, SubjectWorkspace>;
  activeWorkspaceKey?: string;
  currentDrafts?: UserWorkspaceDrafts;
  savedItems?: SavedItem[];
  students?: StudentInfo[];
  lastUpdated: string;
}

export type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

let currentSyncStatus: CloudSyncStatus = 'idle';
let lastSyncError: string | null = null;

export function getCloudSyncStatus(): { status: CloudSyncStatus; lastError: string | null } {
  return { status: currentSyncStatus, lastError: lastSyncError };
}

function notifySyncStatus(status: CloudSyncStatus, error?: string | null) {
  currentSyncStatus = status;
  lastSyncError = error || null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sipartan_cloud_sync_status', {
        detail: { status, error: lastSyncError },
      })
    );
  }
}

/**
 * Pembersih rekursif untuk menghapus nilai undefined dan NaN agar tidak ditolak oleh Firestore
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== 'function') {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

/**
 * Timeout helper agar operasi firestore tidak menggantung jika offline
 */
function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi Firestore cloud timeout.')), ms)
    ),
  ]);
}

/**
 * Mendapatkan Document ID unik berdasarkan Kode Akses Guru
 */
export function getWorkspaceDocId(kodeAkses: string): string {
  const clean = kodeAkses.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '_');
  return `ws-${clean}`;
}

/**
 * Menyimpan seluruh data pekerjaan guru (TP, ATP, Prota, Promes, Modul Ajar, Identitas) ke Cloud Firestore
 */
export async function saveUserWorkspaceToFirestore(
  kodeAkses: string,
  payload: {
    identitas: SchoolIdentity;
    workspaces?: Record<string, SubjectWorkspace>;
    activeWorkspaceKey?: string;
    currentDrafts?: UserWorkspaceDrafts;
    savedItems?: SavedItem[];
    students?: StudentInfo[];
  }
): Promise<boolean> {
  if (!kodeAkses || kodeAkses.trim() === '') return false;
  // Validasi keutuhan: Jangan simpan jika identitas guru belum valid
  if (!payload.identitas || !payload.identitas.namaGuru || payload.identitas.namaGuru.trim().length < 2) {
    console.warn('[Cloud Workspaces] Penyimpanan ditunda: Identitas guru belum lengkap.');
    return false;
  }

  // Buat snapshot cadangan lokal sebelum sinkronisasi cloud
  try {
    createAutoSnapshot(`Pra-Sinkronisasi Cloud (${payload.identitas.mataPelajaran})`);
  } catch {}

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifySyncStatus('offline', 'Perangkat sedang luring (offline). Data tersimpan di cache lokal & snapshot.');
    return false;
  }

  notifySyncStatus('saving');

  try {
    const docId = getWorkspaceDocId(kodeAkses);
    const docRef = doc(db, FIRESTORE_WORKSPACES_COLLECTION, docId);

    // Baca data cloud eksisting agar ruang kerja mapel lain & arsip lama tidak tertimpa atau hilang!
    let existingWorkspaces: Record<string, SubjectWorkspace> = {};
    let existingSavedItems: SavedItem[] = [];
    let existingStudents: StudentInfo[] = [];

    try {
      const snap = await withTimeout(getDoc(docRef), 3500);
      if (snap.exists()) {
        const cloudExisting = snap.data() as UserWorkspaceCloudData;
        if (cloudExisting.workspaces && typeof cloudExisting.workspaces === 'object') {
          existingWorkspaces = cloudExisting.workspaces;
        }
        if (cloudExisting.savedItems && Array.isArray(cloudExisting.savedItems)) {
          existingSavedItems = cloudExisting.savedItems;
        }
        if (cloudExisting.students && Array.isArray(cloudExisting.students)) {
          existingStudents = cloudExisting.students;
        }
      }
    } catch (e) {
      // Jika timeout atau offline, lanjutkan dengan aman
    }

    // Gabungkan seluruh ruang kerja mapel secara non-destruktif
    const localWorkspaces = payload.workspaces || getAllSubjectWorkspaces();
    const mergedWorkspaces: Record<string, SubjectWorkspace> = {
      ...existingWorkspaces,
      ...localWorkspaces,
    };

    // Gabungkan arsip dokumen dengan deduplikasi ID
    let mergedSavedItems = payload.savedItems !== undefined ? payload.savedItems : existingSavedItems;
    if (existingSavedItems.length > 0 && mergedSavedItems.length > 0) {
      const idMap = new Set(mergedSavedItems.map((item) => item.id));
      for (const item of existingSavedItems) {
        if (!idMap.has(item.id)) {
          mergedSavedItems.push(item);
        }
      }
    } else if (existingSavedItems.length > 0 && mergedSavedItems.length === 0 && payload.savedItems === undefined) {
      mergedSavedItems = existingSavedItems;
    }

    // Gabungkan data murid sekolah
    const currentStudents = payload.students || getStudentList();
    const studentMap = new Map<string, StudentInfo>();
    existingStudents.forEach((s) => studentMap.set(s.id || s.nisn || s.nama, s));
    currentStudents.forEach((s) => studentMap.set(s.id || s.nisn || s.nama, s));
    const mergedStudents = Array.from(studentMap.values());

    // Jaga ukuran dokumen Cloud Firestore di bawah batas 1 MiB (1,048,576 bytes)
    let cloudSavedItems = mergedSavedItems;
    if (cloudSavedItems && cloudSavedItems.length > 20) {
      cloudSavedItems = cloudSavedItems.slice(0, 20);
    }

    const dataToSave: UserWorkspaceCloudData = {
      kodeAkses: kodeAkses.toUpperCase().trim(),
      identitas: payload.identitas,
      workspaces: mergedWorkspaces,
      activeWorkspaceKey: payload.activeWorkspaceKey,
      currentDrafts: payload.currentDrafts,
      savedItems: cloudSavedItems,
      students: mergedStudents,
      lastUpdated: new Date().toISOString(),
    };

    const sanitized = sanitizeForFirestore(dataToSave);

    await withTimeout(setDoc(docRef, sanitized, { merge: true }), 7000);
    notifySyncStatus('saved');
    return true;
  } catch (error: any) {
    const msg = error?.message || 'Gagal menyimpan ke Cloud Firestore.';
    console.warn('[Cloud Workspaces] Save error:', msg);
    notifySyncStatus('error', msg);
    return false;
  }
}

/**
 * Mengambil seluruh data pekerjaan guru dari Cloud Firestore berdasarkan Kode Akses
 * Digunakan saat guru berpindah perangkat (HP, laptop, komputer sekolah)
 */
export async function loadUserWorkspaceFromFirestore(
  kodeAkses: string
): Promise<UserWorkspaceCloudData | null> {
  if (!kodeAkses || kodeAkses.trim() === '') return null;

  try {
    const docId = getWorkspaceDocId(kodeAkses);
    const docRef = doc(db, FIRESTORE_WORKSPACES_COLLECTION, docId);
    const snapshot = await withTimeout(getDoc(docRef), 5500);

    if (snapshot.exists()) {
      const data = snapshot.data() as UserWorkspaceCloudData;
      return data;
    }
    return null;
  } catch (error: any) {
    console.warn('[Cloud Workspaces] Load error:', error?.message || error);
    return null;
  }
}

/**
 * Memulihkan data pekerjaan guru dari cloud ke localStorage dan memory dengan perlindungan keutuhan data
 */
export function applyCloudWorkspaceToLocalStorage(cloudData: UserWorkspaceCloudData): void {
  try {
    // 1. Simpan Identitas ke local storage jika valid
    if (cloudData.identitas && cloudData.identitas.namaGuru) {
      saveToStorage(STORAGE_KEYS.IDENTITAS, cloudData.identitas);
    }

    // 2. Gabungkan Subject Workspaces ke local storage (tidak menimpa mapel lain yang belum ada di cloud)
    if (cloudData.workspaces && Object.keys(cloudData.workspaces).length > 0) {
      const currentLocal = getAllSubjectWorkspaces();
      const merged = { ...currentLocal, ...cloudData.workspaces };
      saveAllSubjectWorkspaces(merged);
    }

    // 3. Simpan Current Drafts jika ada dan valid
    if (cloudData.currentDrafts) {
      const d = cloudData.currentDrafts;
      if (d.tpList && d.tpList.length > 0) saveToStorage(STORAGE_KEYS.TP_LIST, d.tpList);
      if (d.elemenRows && d.elemenRows.length > 0) saveToStorage(STORAGE_KEYS.ELEMEN_ROWS, d.elemenRows);
      if (d.selectedElements && d.selectedElements.length > 0) saveToStorage(STORAGE_KEYS.SELECTED_ELEMENTS, d.selectedElements);
      if (d.rasionalAnalisis) saveToStorage(STORAGE_KEYS.RASIONAL, d.rasionalAnalisis);
      if (d.atpDocument) saveToStorage(STORAGE_KEYS.ATP_DOC, d.atpDocument);
      if (d.kktpDocument) saveToStorage(STORAGE_KEYS.KKTP_DOC, d.kktpDocument);
      if (d.protaDocument) saveToStorage(STORAGE_KEYS.PROTA_DOC, d.protaDocument);
      if (d.promesDocument) saveToStorage(STORAGE_KEYS.PROMES_DOC, d.promesDocument);
      if (d.modulAjarDocument) saveToStorage(STORAGE_KEYS.MODUL_DOC, d.modulAjarDocument);
      if (d.soalDocument) saveToStorage(STORAGE_KEYS.SOAL_DOC, d.soalDocument);
      if (d.preferensiTambahan) saveToStorage(STORAGE_KEYS.PREFERENSI, d.preferensiTambahan);
      if (d.activeTab) saveToStorage(STORAGE_KEYS.ACTIVE_TAB, d.activeTab);
    }

    // 4. Gabungkan Saved Items Arsip jika ada dengan deduplikasi ID
    if (cloudData.savedItems && Array.isArray(cloudData.savedItems) && cloudData.savedItems.length > 0) {
      const localSaved = loadFromStorage<SavedItem[]>(STORAGE_KEYS.SAVED_ITEMS, []);
      const localMap = new Map<string, SavedItem>();
      localSaved.forEach((item) => localMap.set(item.id, item));
      cloudData.savedItems.forEach((item) => localMap.set(item.id, item));
      const mergedList = Array.from(localMap.values());
      saveToStorage(STORAGE_KEYS.SAVED_ITEMS, mergedList);
    }

    // 5. Gabungkan Data Murid Kelas jika ada
    if (cloudData.students && Array.isArray(cloudData.students) && cloudData.students.length > 0) {
      const localStudents = getStudentList();
      const sMap = new Map<string, StudentInfo>();
      localStudents.forEach((s) => sMap.set(s.id || s.nisn || s.nama, s));
      cloudData.students.forEach((s) => sMap.set(s.id || s.nisn || s.nama, s));
      saveStudentList(Array.from(sMap.values()));
    }

    // Buat snapshot cadangan lokal setelah sinkronisasi cloud berhasil
    createAutoSnapshot('Sinkronisasi Cloud Berhasil Dimuat');
  } catch (e) {
    console.error('Gagal menerapkan data cloud ke penyimpanan lokal:', e);
  }
}

/**
 * Memperbarui identitas pengguna pada dokumen workspace Cloud Firestore secara spesifik
 * Digunakan oleh Administrator saat mengedit identitas guru
 */
export async function updateUserWorkspaceIdentityInFirestore(
  kodeAkses: string,
  newIdentity: SchoolIdentity
): Promise<boolean> {
  if (!kodeAkses || kodeAkses.trim() === '') return false;
  try {
    const docId = getWorkspaceDocId(kodeAkses);
    const docRef = doc(db, FIRESTORE_WORKSPACES_COLLECTION, docId);
    const sanitized = sanitizeForFirestore({
      kodeAkses: kodeAkses.toUpperCase().trim(),
      identitas: newIdentity,
      lastUpdated: new Date().toISOString(),
    });
    await withTimeout(setDoc(docRef, sanitized, { merge: true }), 5000);
    return true;
  } catch (e) {
    console.warn('[Cloud Workspaces] Gagal update identitas pengguna:', e);
    return false;
  }
}

