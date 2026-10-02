/**
 * Service Penyimpanan Offline IndexedDB untuk Bahan Ajar & Media Pembelajaran
 * Mendukung penyimpanan file biner kapasitas besar (PDF, Video MP4, Audio MP3, PPT, Gambar PNG/JPG)
 * Memungkinkan akses 100% offline tanpa kuota internet di Ruang Murid.
 */

const DB_NAME = 'sipartan_learning_db';
const DB_VERSION = 1;
const STORE_FILES = 'materials_files';
const STORE_META = 'materials_meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada peramban ini'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Gagal membuka IndexedDB'));
    };
  });
}

export interface OfflineFileRecord {
  id: string;
  blob?: Blob;
  dataUrl?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  savedAt: string;
}

/**
 * Menyimpan file media secara offline ke IndexedDB
 */
export async function saveOfflineMaterialFile(
  id: string,
  data: {
    blob?: Blob;
    dataUrl?: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
  }
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_FILES], 'readwrite');
      const store = tx.objectStore(STORE_FILES);

      const record: OfflineFileRecord = {
        id,
        blob: data.blob,
        dataUrl: data.dataUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize || (data.blob ? data.blob.size : (data.dataUrl?.length || 0)),
        savedAt: new Date().toISOString(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Mengambil file media dari cache offline IndexedDB
 */
export async function getOfflineMaterialFile(id: string): Promise<OfflineFileRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES], 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Gagal membaca dari IndexedDB:', err);
    return null;
  }
}

/**
 * Menghapus file media dari cache offline
 */
export async function deleteOfflineMaterialFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES], 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus dari IndexedDB:', err);
  }
}

/**
 * Memeriksa apakah suatu materi sudah tersimpan offline di perangkat
 */
export async function isMaterialOfflineReady(id: string): Promise<boolean> {
  try {
    const record = await getOfflineMaterialFile(id);
    return !!record && (!!record.blob || !!record.dataUrl);
  } catch {
    return false;
  }
}

/**
 * Mendapatkan daftar seluruh ID materi yang sudah tersimpan offline
 */
export async function getAllOfflineMaterialIds(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_FILES], 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = (request.result || []).map((k) => String(k));
        resolve(keys);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Menghitung ringkasan kapasitas penyimpanan offline yang terpakai
 */
export async function getOfflineStorageSummary(): Promise<{ totalItems: number; totalBytes: number }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_FILES], 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: OfflineFileRecord[] = request.result || [];
        const totalItems = records.length;
        const totalBytes = records.reduce((acc, r) => acc + (r.fileSize || 0), 0);
        resolve({ totalItems, totalBytes });
      };
      request.onerror = () => resolve({ totalItems: 0, totalBytes: 0 });
    });
  } catch {
    return { totalItems: 0, totalBytes: 0 };
  }
}

/**
 * Menghapus seluruh cache offline
 */
export async function clearAllOfflineMaterials(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES], 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Gagal membersihkan IndexedDB:', err);
  }
}
