import { StudentInfo } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storageUtils';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseAuth';

const STUDENT_LIST_KEY = 'sipartan_student_list';
export const FIRESTORE_STUDENTS_DOC = 'fatubai_roster';
export const FIRESTORE_STUDENTS_COLLECTION = 'sipartan_students';

export const DEFAULT_STUDENT_LIST: StudentInfo[] = [
  { id: 'std-01', nis: '314', nisn: '314', nama: 'ALFONSIUS MISA' },
  { id: 'std-02', nis: '276', nisn: '0164310989', nama: 'FEBRIANUS D HANOE' },
  { id: 'std-03', nis: '258', nisn: '3144485770', nama: 'FLORIDA BANUSU' },
  { id: 'std-04', nis: '256', nisn: '3148133459', nama: 'FRANSISKUS PUATERO' },
  { id: 'std-05', nis: '288', nisn: '3157174153', nama: 'MATEUS KAUSE' },
  { id: 'std-06', nis: '289', nisn: '3151880167', nama: 'NATALIA BUATEFA' },
  { id: 'std-07', nis: '245', nisn: '245', nama: 'NORBERTUS HANOE' },
  { id: 'std-08', nis: '261', nisn: '3141294287', nama: 'PASKALIS HANOE' },
  { id: 'std-09', nis: '290', nisn: '3157126495', nama: 'PETROSIA KONO ARAN' },
  { id: 'std-10', nis: '263', nisn: '3157245047', nama: 'SIRILIUS BUATEFA' },
  { id: 'std-11', nis: '292', nisn: '0157074163', nama: 'YOHANES BUATEFA' },
  { id: 'std-12', nis: '0000000001', nisn: '0000000001', nama: 'YUVENTA AKOIT' },
];

export function getStudentList(): StudentInfo[] {
  const existing = loadFromStorage<StudentInfo[]>(STUDENT_LIST_KEY, []);
  // Detect if legacy dummy list exists (e.g. old count 20 or contains 'Alberto Da Silva')
  const isLegacyDummy =
    !existing ||
    existing.length === 0 ||
    existing.length === 20 ||
    existing.some((s) => s.nama.toLowerCase().includes('alberto da silva'));
  if (isLegacyDummy) {
    saveToStorage(STUDENT_LIST_KEY, DEFAULT_STUDENT_LIST);
    return DEFAULT_STUDENT_LIST;
  }
  return existing;
}

export function getStudentCount(): number {
  return getStudentList().length;
}

/**
 * Menyimpan data murid ke local storage dan secara otomatis menyinkronkan ke Cloud Firestore
 */
export function saveStudentList(list: StudentInfo[]): void {
  saveToStorage(STUDENT_LIST_KEY, list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sipartan_student_list_updated', { detail: { list } }));
  }
  // Sinkronkan ke Firebase Cloud Firestore secara non-blocking
  saveStudentListToFirestore(list).catch(() => {});
}

/**
 * Menyimpan data murid ke Cloud Firestore
 */
export async function saveStudentListToFirestore(list: StudentInfo[]): Promise<boolean> {
  try {
    const docRef = doc(db, FIRESTORE_STUDENTS_COLLECTION, FIRESTORE_STUDENTS_DOC);
    await setDoc(docRef, {
      students: list,
      totalCount: list.length,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Gagal menyimpan data murid ke cloud:', err);
    return false;
  }
}

/**
 * Mengambil data murid terbaru langsung dari Cloud Firestore
 */
export async function fetchStudentListFromFirestore(): Promise<StudentInfo[]> {
  try {
    const docRef = doc(db, FIRESTORE_STUDENTS_COLLECTION, FIRESTORE_STUDENTS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.students) && data.students.length > 0) {
        saveToStorage(STUDENT_LIST_KEY, data.students);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sipartan_student_list_updated', { detail: { list: data.students } }));
        }
        return data.students as StudentInfo[];
      }
    }
  } catch (err) {
    console.warn('[Firestore] Gagal mengambil data murid dari cloud:', err);
  }
  return getStudentList();
}

/**
 * Berlangganan (realtime listener) data murid dari Cloud Firestore
 */
export function subscribeToStudentListFromFirestore(
  onUpdate: (students: StudentInfo[]) => void
): () => void {
  try {
    const docRef = doc(db, FIRESTORE_STUDENTS_COLLECTION, FIRESTORE_STUDENTS_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.students) && data.students.length > 0) {
            saveToStorage(STUDENT_LIST_KEY, data.students);
            onUpdate(data.students as StudentInfo[]);
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Error listener data murid:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export function resetToDefaultStudentList(): StudentInfo[] {
  saveStudentList(DEFAULT_STUDENT_LIST);
  return DEFAULT_STUDENT_LIST;
}

export function addStudent(student: Omit<StudentInfo, 'id'>): StudentInfo[] {
  const current = getStudentList();
  const newStudent: StudentInfo = {
    id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...student,
  };
  const updated = [...current, newStudent];
  saveStudentList(updated);
  return updated;
}

export function updateStudent(id: string, updatedData: Partial<StudentInfo>): StudentInfo[] {
  const current = getStudentList();
  const updated = current.map(s => s.id === id ? { ...s, ...updatedData } : s);
  saveStudentList(updated);
  return updated;
}

export function deleteStudent(id: string): StudentInfo[] {
  const current = getStudentList();
  const updated = current.filter(s => s.id !== id);
  saveStudentList(updated);
  return updated;
}

export function parseCSVData(csvContent: string): StudentInfo[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const students: StudentInfo[] = [];
  
  // Try to find columns for NISN and Nama
  for (let i = 0; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (rawCols.length === 0) continue;
    
    // Check if it's header
    if (i === 0 && (rawCols[0].toLowerCase().includes('no') || rawCols[1]?.toLowerCase().includes('nis') || rawCols[2]?.toLowerCase().includes('nama'))) {
      continue;
    }
    
    let nisn = '';
    let nama = '';
    
    if (rawCols.length >= 3) {
      nisn = rawCols[1] || '';
      nama = rawCols[2] || '';
    } else if (rawCols.length === 2) {
      nisn = rawCols[0] || '';
      nama = rawCols[1] || '';
    } else if (rawCols.length === 1 && rawCols[0]) {
      nama = rawCols[0];
      nisn = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }
    
    if (nama.trim()) {
      students.push({
        id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        nama: nama.trim(),
        nisn: nisn.trim() || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
    }
  }
  return students;
}
