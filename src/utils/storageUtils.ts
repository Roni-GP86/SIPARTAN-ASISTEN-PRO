/**
 * Storage Utility for Permanent Client-Side Persistence
 * Kebal refresh, browser tab ditutup, atau laptop/komputer mati!
 */

export const STORAGE_KEYS = {
  IDENTITAS: 'perangkat_ajar_identitas_v4',
  ACTIVE_TAB: 'perangkat_ajar_active_tab_v4',
  SELECTED_ELEMENTS: 'perangkat_ajar_selected_elements_v4',
  PREFERENSI: 'perangkat_ajar_preferensi_v4',
  ELEMEN_ROWS: 'perangkat_ajar_elemen_rows_v4',
  TP_LIST: 'perangkat_ajar_tp_list_v4',
  RASIONAL: 'perangkat_ajar_rasional_v4',
  ATP_DOC: 'perangkat_ajar_atp_doc_v4',
  PROTA_DOC: 'perangkat_ajar_prota_doc_v4',
  PROMES_DOC: 'perangkat_ajar_promes_doc_v4',
  KKTP_DOC: 'perangkat_ajar_kktp_doc_v4',
  MODUL_DOC: 'perangkat_ajar_modul_doc_v4',
  SOAL_DOC: 'perangkat_ajar_soal_doc_v4',
  SAVED_ITEMS: 'perangkat_ajar_saved_items_v4',
  LAST_SAVED: 'perangkat_ajar_last_saved_time_v4',
  MEDIA_PROMPT_PREFS: 'perangkat_ajar_media_prompt_prefs_v2',
  WORKSPACES: 'sipartan_subject_workspaces_v2',
  STUDENTS: 'sipartan_student_list_v2',
  SNAPSHOTS: 'sipartan_auto_snapshots_v2',
  EMERGENCY_BACKUP: 'sipartan_emergency_backup_v2',
} as const;

/**
 * Safely saves data to localStorage with quota protection and error handling
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    return true;
  } catch (error: any) {
    console.warn(`[storageUtils] Error saving key "${key}" to localStorage:`, error);
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      console.warn('[storageUtils] LocalStorage quota exceeded. Pruning temporary snapshots & retrying...');
      try {
        // Prune rolling snapshots and legacy emergency keys to free up space
        localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('firestore_') || k.startsWith('sipartan_emergency_'))) {
            localStorage.removeItem(k);
          }
        }
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
        return true;
      } catch (retryError) {
        console.error('[storageUtils] LocalStorage retry after prune failed:', retryError);
      }
    }
    return false;
  }
}

/**
 * Safely loads data from localStorage, falling back to defaultValue if missing or invalid
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined || item === '') {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[storageUtils] Error loading key "${key}" from localStorage. Using default value.`, error);
    return defaultValue;
  }
}

/**
 * Removes a key from storage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[storageUtils] Error removing key "${key}":`, error);
  }
}

/**
 * Generates a complete JSON backup string of all teacher data across all modules
 */
export function generateFullBackupJSON(): string {
  const backup = {
    app: 'SIPARTAN',
    version: '3.0',
    schemaVersion: '2025.1',
    exportTimestamp: new Date().toISOString(),
    identitas: loadFromStorage(STORAGE_KEYS.IDENTITAS, null),
    activeTab: loadFromStorage(STORAGE_KEYS.ACTIVE_TAB, 'tp'),
    selectedElements: loadFromStorage(STORAGE_KEYS.SELECTED_ELEMENTS, []),
    preferensiTambahan: loadFromStorage(STORAGE_KEYS.PREFERENSI, ''),
    elemenRows: loadFromStorage(STORAGE_KEYS.ELEMEN_ROWS, []),
    tpList: loadFromStorage(STORAGE_KEYS.TP_LIST, []),
    rasionalAnalisis: loadFromStorage(STORAGE_KEYS.RASIONAL, ''),
    atpDocument: loadFromStorage(STORAGE_KEYS.ATP_DOC, null),
    protaDocument: loadFromStorage(STORAGE_KEYS.PROTA_DOC, null),
    promesDocument: loadFromStorage(STORAGE_KEYS.PROMES_DOC, null),
    kktpDocument: loadFromStorage(STORAGE_KEYS.KKTP_DOC, null),
    modulAjarDocument: loadFromStorage(STORAGE_KEYS.MODUL_DOC, null),
    soalDocument: loadFromStorage(STORAGE_KEYS.SOAL_DOC, null),
    savedItems: loadFromStorage(STORAGE_KEYS.SAVED_ITEMS, []),
    workspaces: loadFromStorage(STORAGE_KEYS.WORKSPACES, {}),
    students: loadFromStorage(STORAGE_KEYS.STUDENTS, []),
  };

  return JSON.stringify(backup, null, 2);
}

export interface BackupValidationResult {
  isValid: boolean;
  message: string;
  summary?: {
    schoolName?: string;
    teacherName?: string;
    subjectCount: number;
    savedItemCount: number;
    studentCount: number;
    hasTP: boolean;
    hasATP: boolean;
    hasKKTP: boolean;
    hasProta: boolean;
    hasPromes: boolean;
    hasModul: boolean;
    hasSoal: boolean;
  };
  data?: any;
}

/**
 * Validates and parses uploaded backup JSON file to ensure data integrity
 */
export function validateAndParseBackupJSON(jsonString: string): BackupValidationResult {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { isValid: false, message: 'File kosong atau tidak dapat dibaca.' };
    }

    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { isValid: false, message: 'Struktur data bukan objek JSON valid.' };
    }

    const hasIdentitas = Boolean(data.identitas);
    const hasWorkspaces = Boolean(data.workspaces && typeof data.workspaces === 'object');
    const hasSavedItems = Array.isArray(data.savedItems);
    const hasTP = Array.isArray(data.tpList) && data.tpList.length > 0;

    if (!hasIdentitas && !hasWorkspaces && !hasSavedItems && !hasTP) {
      return {
        isValid: false,
        message: 'File ini tidak berisi data cadangan SIPARTAN yang sah (tidak ditemukan modul perangkat ajar).',
      };
    }

    const workspaceKeys = hasWorkspaces ? Object.keys(data.workspaces) : [];
    const savedCount = hasSavedItems ? data.savedItems.length : 0;
    const studentCount = Array.isArray(data.students) ? data.students.length : 0;

    return {
      isValid: true,
      message: 'File cadangan sah dan siap dipulihkan.',
      summary: {
        schoolName: data.identitas?.namaSatuanPendidikan || 'SD',
        teacherName: data.identitas?.namaGuru || 'Guru',
        subjectCount: Math.max(workspaceKeys.length, data.identitas?.mataPelajaran ? 1 : 0),
        savedItemCount: savedCount,
        studentCount,
        hasTP: Boolean(hasTP || (hasWorkspaces && Object.values(data.workspaces).some((w: any) => w.tpList?.length > 0))),
        hasATP: Boolean(data.atpDocument),
        hasKKTP: Boolean(data.kktpDocument),
        hasProta: Boolean(data.protaDocument),
        hasPromes: Boolean(data.promesDocument),
        hasModul: Boolean(data.modulAjarDocument),
        hasSoal: Boolean(data.soalDocument),
      },
      data,
    };
  } catch (err: any) {
    return {
      isValid: false,
      message: `File rusak atau format JSON salah: ${err?.message || 'SyntaxError'}`,
    };
  }
}

/**
 * Triggers a file download for the teacher's backup
 */
export function downloadBackupFile(schoolName: string = 'SD-Negeri-Fatubai'): void {
  const jsonStr = generateFullBackupJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  a.href = url;
  a.download = `Cadangan_SIPARTAN_${cleanSchool}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Clears working drafts from localStorage (resets to default), optionally retaining identity
 */
export function clearWorkingDrafts(retainIdentity: boolean = true): void {
  const idBackup = retainIdentity ? localStorage.getItem(STORAGE_KEYS.IDENTITAS) : null;
  const historyBackup = localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);

  removeFromStorage(STORAGE_KEYS.ACTIVE_TAB);
  removeFromStorage(STORAGE_KEYS.SELECTED_ELEMENTS);
  removeFromStorage(STORAGE_KEYS.PREFERENSI);
  removeFromStorage(STORAGE_KEYS.ELEMEN_ROWS);
  removeFromStorage(STORAGE_KEYS.TP_LIST);
  removeFromStorage(STORAGE_KEYS.RASIONAL);
  removeFromStorage(STORAGE_KEYS.ATP_DOC);
  removeFromStorage(STORAGE_KEYS.KKTP_DOC);
  removeFromStorage(STORAGE_KEYS.PROTA_DOC);
  removeFromStorage(STORAGE_KEYS.PROMES_DOC);
  removeFromStorage(STORAGE_KEYS.MODUL_DOC);
  removeFromStorage(STORAGE_KEYS.SOAL_DOC);

  if (!retainIdentity) {
    removeFromStorage(STORAGE_KEYS.IDENTITAS);
  } else if (idBackup) {
    localStorage.setItem(STORAGE_KEYS.IDENTITAS, idBackup);
  }

  if (historyBackup) {
    localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, historyBackup);
  }
}

export interface AutoSnapshotItem {
  id: string;
  timestamp: string;
  label: string;
  schoolName: string;
  teacherName: string;
  subject: string;
  data: any;
}

/**
 * Menyimpan snapshot cadangan otomatis (maksimal 2 snapshot rolling ringan)
 * Menjamin keutuhan data tanpa membebani kuota 5MB localStorage browser
 */
export function createAutoSnapshot(label: string = 'Snapshot Otomatis'): void {
  try {
    const rawBackup = generateFullBackupJSON();
    const parsed = JSON.parse(rawBackup);
    if (!parsed) return;

    // Kecualikan duplikasi histori dokumen tersimpan yang berat dari snapshot
    // karena savedItems sudah tersimpan mandiri di kuncinya sendiri
    if (parsed.savedItems && Array.isArray(parsed.savedItems)) {
      parsed.savedItems = parsed.savedItems.slice(0, 3).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        timestamp: item.timestamp,
      }));
    }

    const existingSnapshots = getAutoSnapshots();
    const newSnapshot: AutoSnapshotItem = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      schoolName: parsed.identitas?.namaSatuanPendidikan || 'SD',
      teacherName: parsed.identitas?.namaGuru || 'Guru',
      subject: parsed.identitas?.mataPelajaran || 'Matematika',
      data: parsed,
    };

    // Batasi 2 snapshot rolling terbaru untuk menjaga kuota memori tetap lega
    const updated = [newSnapshot, ...existingSnapshots.slice(0, 1)];
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
  } catch (e: any) {
    console.warn('[storageUtils] Gagal membuat snapshot otomatis:', e);
    // Jika quota penuh saat snapshot, bersihkan snapshot lama
    if (e?.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
      } catch {}
    }
  }
}

/**
 * Mengambil daftar seluruh snapshot cadangan otomatis
 */
export function getAutoSnapshots(): AutoSnapshotItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (!raw) return [];
    return JSON.parse(raw) as AutoSnapshotItem[];
  } catch {
    return [];
  }
}

/**
 * Menyimpan cadangan darurat sebelum pengguna melakukan reset atau pembersihan data
 */
export function createEmergencyBackupBeforeReset(): void {
  try {
    const rawBackup = generateFullBackupJSON();
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_BACKUP, rawBackup);
    createAutoSnapshot('Cadangan Darurat Sebelum Reset');
  } catch (e) {
    console.warn('[storageUtils] Gagal menyimpan cadangan darurat sebelum reset:', e);
  }
}

/**
 * Mengecek apakah terdapat cadangan darurat yang bisa dipulihkan
 */
export function hasEmergencyBackup(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.EMERGENCY_BACKUP));
  } catch {
    return false;
  }
}

/**
 * Mengambil dan mengembalikan data cadangan darurat sebelum reset
 */
export function getEmergencyBackupData(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY_BACKUP);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
