import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebaseAuth';
import {
  ExamPackage,
  ExamSubmission,
  StudentExamAnswer,
  KisiKisiSoalDocument,
  StudentReadingMaterial,
} from '../types';
import {
  INITIAL_MATEMATIKA_IDENTITAS,
  INITIAL_MATEMATIKA_TP_LIST,
  INITIAL_MATEMATIKA_ATP_DOCUMENT,
} from '../data/initialMatematikaFaseC';
import {
  getDefaultKonfigurasiSoal,
  generateKisiKisiDanNaskahSoal,
} from '../utils/kisiKisiSoalGenerator';
import { DEFAULT_CHAPTER_EXERCISES } from '../data/defaultChapterExercises';

export const EXAM_PACKAGES_COLLECTION = 'sipartan_exam_packages';
export const EXAM_SUBMISSIONS_COLLECTION = 'sipartan_exam_submissions';

const LOCAL_STORAGE_PACKAGES_KEY = 'sipartan_local_exam_packages';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'sipartan_local_exam_submissions';
export const DELETED_PACKAGES_STORAGE_KEY = 'sipartan_deleted_exam_package_ids';

export function getDeletedPackageIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PACKAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPackageAsDeleted(packageId: string): void {
  try {
    const list = getDeletedPackageIds();
    if (!list.includes(packageId)) {
      list.push(packageId);
      localStorage.setItem(DELETED_PACKAGES_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Gagal menandai paket sebagai dihapus:', e);
  }
}

export function unmarkPackageAsDeleted(packageId: string): void {
  try {
    const list = getDeletedPackageIds().filter((id) => id !== packageId);
    localStorage.setItem(DELETED_PACKAGES_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Helper to sanitize object for Firestore (remove undefined and functions)
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && typeof v !== 'function') {
      result[k] = sanitizeForFirestore(v);
    }
  }
  return result;
}

/**
 * Helper with timeout to prevent hanging on weak network
 */
function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi Firestore timeout.')), ms)
    ),
  ]);
}

// -------------------------------------------------------------
// LOCAL STORAGE HELPERS (FOR RESILIENCE AND OFFLINE GUARANTEE)
// -------------------------------------------------------------

export function getLocalExamPackages(): ExamPackage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PACKAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalExamPackages(packages: ExamPackage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PACKAGES_KEY, JSON.stringify(packages));
  } catch (e) {
    console.warn('Gagal menyimpan paket ujian ke localStorage:', e);
  }
}

export function getLocalSubmissions(): ExamSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSubmissions(subs: ExamSubmission[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(subs));
  } catch (e) {
    console.warn('Gagal menyimpan submission ke localStorage:', e);
  }
}

// -------------------------------------------------------------
// EXAM PACKAGES (GURU PUBLISH & MANAGE)
// -------------------------------------------------------------

/**
 * Guru mempublikasikan atau memperbarui paket ujian agar dapat diakses oleh siswa di Ruang Murid
 */
export async function saveOrPublishExamPackage(pkg: ExamPackage): Promise<boolean> {
  // Pulihkan ID jika sebelumnya sempat dihapus
  unmarkPackageAsDeleted(pkg.id);

  // Seluruh paket dipastikan memiliki alokasi waktu 120 menit sesuai kebijakan resmi
  const standardizedPkg: ExamPackage = {
    ...pkg,
    durasiMenit: 120,
    updatedAt: new Date().toISOString(),
  };

  // 1. Simpan di local storage terlebih dahulu
  const localList = getLocalExamPackages();
  const idx = localList.findIndex((p) => p.id === standardizedPkg.id);
  if (idx >= 0) {
    localList[idx] = standardizedPkg;
  } else {
    localList.unshift(standardizedPkg);
  }
  saveLocalExamPackages(localList);

  // 2. Simpan ke Firebase Firestore
  try {
    const docRef = doc(db, EXAM_PACKAGES_COLLECTION, standardizedPkg.id);
    const sanitized = sanitizeForFirestore(standardizedPkg);
    await withTimeout(setDoc(docRef, sanitized, { merge: true }), 7000);
    return true;
  } catch (e) {
    console.warn('[Firebase] Gagal simpan paket ujian ke Cloud Firestore, tersimpan di lokal:', e);
    return true; // Tetap berhasil secara lokal
  }
}

/**
 * Mengambil seluruh paket ujian (aktif dan riwayat) baik dari Firebase maupun local storage
 * Secara otomatis menjamin seluruh Latihan Bab Standar Kurikulum Merdeka Fase C selalu tersedia di Ruang Murid
 * kecuali yang sudah dihapus oleh guru.
 */
export async function getAllExamPackages(): Promise<ExamPackage[]> {
  const localList = getLocalExamPackages();
  const deletedIds = new Set(getDeletedPackageIds());

  // Susun peta master yang memuat seluruh Latihan Bab Kurikulum Merdeka bawaan
  const map = new Map<string, ExamPackage>();
  DEFAULT_CHAPTER_EXERCISES.forEach((pkg) => {
    if (!deletedIds.has(pkg.id)) {
      map.set(pkg.id, { ...pkg, durasiMenit: 120 });
    }
  });

  // Tumpangkan data lokal (mempertahankan status aktif/nonaktif atau editan lokal)
  localList.forEach((pkg) => {
    if (!deletedIds.has(pkg.id)) {
      map.set(pkg.id, { ...pkg, durasiMenit: 120 });
    }
  });

  try {
    const colRef = collection(db, EXAM_PACKAGES_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 5000);
    if (!snapshot.empty) {
      snapshot.forEach((d) => {
        const cloudPkg = d.data() as ExamPackage;
        if (!deletedIds.has(cloudPkg.id)) {
          map.set(cloudPkg.id, { ...cloudPkg, durasiMenit: 120 });
        }
      });
    }
  } catch (e) {
    console.warn('[Firebase] Menggunakan data paket ujian dari cache lokal & default:', e);
  }

  const merged = Array.from(map.values()).filter((pkg) => !deletedIds.has(pkg.id));
  saveLocalExamPackages(merged);
  return merged;
}

/**
 * Mengatur ulang / menyusun kembali seluruh paket latihan bab standar Kurikulum Merdeka Fase C
 */
export async function resetToCurriculumPackages(): Promise<ExamPackage[]> {
  const map = new Map<string, ExamPackage>();
  // Bersihkan ID terhapus untuk paket standar jika guru memilih reset
  DEFAULT_CHAPTER_EXERCISES.forEach((pkg) => {
    unmarkPackageAsDeleted(pkg.id);
    map.set(pkg.id, { ...pkg, durasiMenit: 120, isActive: true });
  });

  // Pertahankan ujian yang disusun mandiri oleh Guru
  const currentLocal = getLocalExamPackages();
  currentLocal.forEach((pkg) => {
    if (!pkg.id.startsWith('lat-') && !pkg.id.startsWith('sts-') && !pkg.id.startsWith('sas-')) {
      map.set(pkg.id, { ...pkg, durasiMenit: 120 });
    }
  });

  const merged = Array.from(map.values());
  saveLocalExamPackages(merged);
  return merged;
}

/**
 * Mengubah status aktif paket ujian (Buka / Tutup Ujian untuk Siswa)
 */
export async function toggleExamPackageStatus(packageId: string, isActive: boolean): Promise<boolean> {
  const localList = getLocalExamPackages();
  const target = localList.find((p) => p.id === packageId);
  if (target) {
    target.isActive = isActive;
    target.durasiMenit = 120;
    target.updatedAt = new Date().toISOString();
    saveLocalExamPackages(localList);
  }

  try {
    const docRef = doc(db, EXAM_PACKAGES_COLLECTION, packageId);
    await withTimeout(setDoc(docRef, { isActive, durasiMenit: 120, updatedAt: new Date().toISOString() }, { merge: true }), 5000);
    return true;
  } catch (e) {
    console.warn('[Firebase] Gagal toggle status paket di cloud, diperbarui di lokal:', e);
    return true;
  }
}

/**
 * Menghapus paket ujian secara permanen (guru dapat menghapus daftar soal di ruang murid)
 */
export async function deleteExamPackage(packageId: string): Promise<boolean> {
  // Tandai sebagai dihapus agar tidak dimunculkan kembali dari default templates
  markPackageAsDeleted(packageId);

  const localList = getLocalExamPackages().filter((p) => p.id !== packageId);
  saveLocalExamPackages(localList);

  try {
    const docRef = doc(db, EXAM_PACKAGES_COLLECTION, packageId);
    await withTimeout(deleteDoc(docRef), 5000);
    return true;
  } catch (e) {
    console.warn('[Firebase] Gagal hapus paket di cloud:', e);
    return true;
  }
}

// -------------------------------------------------------------
// EXAM EVALUATION & SCORING LOGIC
// -------------------------------------------------------------

/**
 * Menghitung skor siswa secara otomatis dan objektif berdasarkan pedoman penskoran guru
 */
export function evaluateStudentExam(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
): ExamSubmission {
  // Extract soalDoc from ExamPackage or direct document
  const soalDoc: KisiKisiSoalDocument = (arg1 && arg1.soalDocument) ? arg1.soalDocument : arg1;

  let rawAnswers: Record<string, any> = {};
  let namaSiswa = 'Peserta Didik';
  let nisn = '-';
  let kelas = '5';

  if (typeof arg2 === 'object' && !Array.isArray(arg2)) {
    rawAnswers = arg2;
    namaSiswa = typeof arg3 === 'string' ? arg3 : 'Peserta Didik';
    nisn = typeof arg4 === 'string' ? arg4 : '-';
    kelas = typeof arg5 === 'string' ? arg5 : '5';
  } else if (typeof arg2 === 'string') {
    namaSiswa = arg2;
    nisn = typeof arg3 === 'string' ? arg3 : '-';
    kelas = typeof arg4 === 'string' ? arg4 : '5';
    if (Array.isArray(arg5)) {
      arg5.forEach((item: any) => {
        if (item && item.nomorDisplay !== undefined) {
          rawAnswers[item.nomorDisplay] = item.jawabanSiswa;
        }
      });
    } else if (typeof arg5 === 'object' && arg5 !== null) {
      rawAnswers = arg5;
    }
  }

  const answerList: StudentExamAnswer[] = [];
  let totalSkorDidapat = 0;
  let totalSkorMaks = soalDoc?.ringkasanDistribusi?.totalSkorMaksimal || 100;

  // Build map of master scoring keys
  const pedomanMap = new Map<string, { bentukSoal: string; kunci: string; bobot: number }>();
  (soalDoc.pedomanPenskoran || []).forEach((p) => {
    pedomanMap.set(p.nomorSoalDisplay.trim().toUpperCase(), {
      bentukSoal: p.bentukSoal,
      kunci: p.kunciJawabanSingkat || '',
      bobot: p.bobotSkor || 1,
    });
  });

  // Map each question from Naskah Soal to associate with TP
  const questionTPMap = new Map<string, string>();
  (soalDoc.tabelKisiKisi || []).forEach((row) => {
    questionTPMap.set(row.nomorSoalDisplay.trim().toUpperCase(), row.kodeTP);
  });

  // 1. Pilihan Ganda
  (soalDoc.naskahSoal?.soalPilihanGanda || []).forEach((q) => {
    const numDisplay = String(q.nomor).trim().toUpperCase();
    const studentAns = (rawAnswers[numDisplay] || '').toString().trim().toUpperCase();
    const correctAns = (q.kunciJawaban || '').toString().trim().toUpperCase();
    const bobot = pedomanMap.get(numDisplay)?.bobot || q.bobot || 1;
    const isCorrect = studentAns !== '' && studentAns === correctAns;
    const skor = isCorrect ? bobot : 0;
    totalSkorDidapat += skor;

    answerList.push({
      nomorSoalDisplay: String(q.nomor),
      bentukSoal: 'Pilihan Ganda',
      jawabanSiswa: studentAns,
      isCorrect,
      skorDidapat: skor,
      skorMaksimal: bobot,
      kodeTP: questionTPMap.get(numDisplay) || q.kodeTP,
    });
  });

  // 2. Benar / Salah
  (soalDoc.naskahSoal?.soalBenarSalah || []).forEach((q) => {
    const numDisplay = String(q.nomor).trim().toUpperCase();
    const studentAns = (rawAnswers[numDisplay] || '').toString().trim().toUpperCase();
    const correctAns = (q.kunciJawaban || '').toString().trim().toUpperCase();
    const bobot = pedomanMap.get(numDisplay)?.bobot || q.bobot || 1;
    const isCorrect =
      studentAns !== '' &&
      (studentAns === correctAns ||
        (studentAns === 'B' && correctAns.startsWith('B')) ||
        (studentAns === 'S' && correctAns.startsWith('S')));
    const skor = isCorrect ? bobot : 0;
    totalSkorDidapat += skor;

    answerList.push({
      nomorSoalDisplay: String(q.nomor),
      bentukSoal: 'Benar / Salah',
      jawabanSiswa: studentAns,
      isCorrect,
      skorDidapat: skor,
      skorMaksimal: bobot,
      kodeTP: questionTPMap.get(numDisplay) || q.kodeTP,
    });
  });

  // 3. Menjodohkan
  (soalDoc.naskahSoal?.soalMenjodohkan || []).forEach((group) => {
    (group.daftarPremis || []).forEach((pair, pIdx) => {
      const numDisplay = `${group.nomorGroup}.${pIdx + 1}`.toUpperCase();
      const studentPairAns = (rawAnswers[numDisplay] || '').toString().trim().toLowerCase();
      const matchingKunci = group.kunciJawabanPasangan?.find((k) => k.nomorPremis === pair.nomor);
      const correctPairAns = (matchingKunci?.labelRespon || '').toString().trim().toLowerCase();
      const bobot = Math.max(1, Math.round((pedomanMap.get(String(group.nomorGroup))?.bobot || group.bobotTotal || 2) / (group.daftarPremis.length || 1)));
      const isCorrect = studentPairAns !== '' && (studentPairAns === correctPairAns || correctPairAns.includes(studentPairAns));
      const skor = isCorrect ? bobot : 0;
      totalSkorDidapat += skor;

      answerList.push({
        nomorSoalDisplay: numDisplay,
        bentukSoal: 'Menjodohkan',
        jawabanSiswa: rawAnswers[numDisplay] || '-',
        isCorrect,
        skorDidapat: skor,
        skorMaksimal: bobot,
        kodeTP: questionTPMap.get(String(group.nomorGroup)) || group.kodeTP,
      });
    });
  });

  // 4. Isian Singkat
  (soalDoc.naskahSoal?.soalIsianSingkat || []).forEach((q) => {
    const numDisplay = String(q.nomor).trim().toUpperCase();
    const studentAns = (rawAnswers[numDisplay] || '').toString().trim().toLowerCase();
    const correctAns = (q.kunciJawaban || '').toString().trim().toLowerCase();
    const bobot = pedomanMap.get(numDisplay)?.bobot || q.bobot || 2;
    const isCorrect = studentAns !== '' && (studentAns === correctAns || correctAns.includes(studentAns));
    const skor = isCorrect ? bobot : studentAns.length > 2 ? Math.floor(bobot / 2) : 0;
    totalSkorDidapat += skor;

    answerList.push({
      nomorSoalDisplay: String(q.nomor),
      bentukSoal: 'Isian Singkat',
      jawabanSiswa: rawAnswers[numDisplay] || '-',
      isCorrect,
      skorDidapat: skor,
      skorMaksimal: bobot,
      kodeTP: questionTPMap.get(numDisplay) || q.kodeTP,
    });
  });

  // 5. Uraian
  (soalDoc.naskahSoal?.soalUraian || []).forEach((q) => {
    const numDisplay = String(q.nomor).trim().toUpperCase();
    const studentAns = (rawAnswers[numDisplay] || '').toString().trim();
    const bobot = pedomanMap.get(numDisplay)?.bobot || q.bobot || 4;
    let skor = 0;
    if (studentAns.length > 30) skor = bobot;
    else if (studentAns.length > 10) skor = Math.round(bobot * 0.7);
    else if (studentAns.length > 0) skor = Math.round(bobot * 0.4);
    totalSkorDidapat += skor;

    answerList.push({
      nomorSoalDisplay: String(q.nomor),
      bentukSoal: 'Uraian',
      jawabanSiswa: studentAns || '-',
      isCorrect: skor >= Math.round(bobot * 0.7),
      skorDidapat: skor,
      skorMaksimal: bobot,
      kodeTP: questionTPMap.get(numDisplay) || q.kodeTP,
    });
  });

  // Hitung Nilai Akhir (0 - 100)
  const nilaiAkhir = totalSkorMaks > 0 ? Math.round((totalSkorDidapat / totalSkorMaks) * 100) : 0;

  // Tentukan Keterangan KKTP
  let keteranganKKTP: 'Perlu Bimbingan' | 'Cukup' | 'Baik' | 'Sangat Baik' = 'Cukup';
  if (nilaiAkhir >= 86) keteranganKKTP = 'Sangat Baik';
  else if (nilaiAkhir >= 71) keteranganKKTP = 'Baik';
  else if (nilaiAkhir >= 56) keteranganKKTP = 'Cukup';
  else keteranganKKTP = 'Perlu Bimbingan';

  // Analisis Per Tujuan Pembelajaran (TP)
  const tpMap = new Map<string, { rumusanTP: string; skorDidapat: number; skorMaksimal: number }>();
  (soalDoc.tabelKisiKisi || []).forEach((row) => {
    if (row.kodeTP && !tpMap.has(row.kodeTP)) {
      tpMap.set(row.kodeTP, {
        rumusanTP: row.tujuanPembelajaran,
        skorDidapat: 0,
        skorMaksimal: 0,
      });
    }
  });

  answerList.forEach((ans) => {
    if (ans.kodeTP && tpMap.has(ans.kodeTP)) {
      const entry = tpMap.get(ans.kodeTP)!;
      entry.skorDidapat += ans.skorDidapat || 0;
      entry.skorMaksimal += ans.skorMaksimal || 1;
    }
  });

  const analisisTP = Array.from(tpMap.entries()).map(([kodeTP, val]) => {
    const pct = val.skorMaksimal > 0 ? Math.round((val.skorDidapat / val.skorMaksimal) * 100) : 100;
    return {
      kodeTP,
      rumusanTP: val.rumusanTP,
      skorDidapat: val.skorDidapat,
      skorMaksimal: val.skorMaksimal,
      persentase: pct,
      isTuntas: pct >= 65,
    };
  });

  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    paketId: soalDoc.id,
    judulPaket: `${soalDoc.konfigurasi?.jenisAsesmen || 'Asesmen'} ${soalDoc.identitas?.mataPelajaran || 'Matematika'}`,
    namaSiswa: namaSiswa.trim(),
    nisn: nisn.trim(),
    kelas: kelas.trim(),
    mataPelajaran: soalDoc.identitas?.mataPelajaran || 'Matematika',
    jenisAsesmen: soalDoc.konfigurasi?.jenisAsesmen || 'Ulangan Harian',
    daftarTP: Array.from(tpMap.entries()).map(([kodeTP, val]) => ({
      kodeTP,
      rumusanTP: val.rumusanTP,
      lingkupMateri: '',
    })),
    jawabanList: answerList,
    jawabanDetail: answerList,
    skorTotal: totalSkorDidapat,
    skorMaksimal: totalSkorMaks,
    nilaiAkhir,
    keteranganKKTP,
    predikat: keteranganKKTP,
    submittedAt: new Date().toISOString(),
    analisisTP,
  };
}

// -------------------------------------------------------------
// SUBMISSIONS (SIMPAN HASIL UJIAN SISWA KE FIREBASE & LOKAL)
// -------------------------------------------------------------

/**
 * Siswa mengirimkan lembar ujian (disimpan di Firebase Firestore & cache lokal)
 */
export async function submitExamSubmission(submission: ExamSubmission): Promise<boolean> {
  // 1. Simpan di local storage dengan deduplikasi ID agar data tidak ganda
  const localList = getLocalSubmissions().filter((s) => s.id !== submission.id);
  localList.unshift(submission);
  saveLocalSubmissions(localList);

  // 2. Simpan ke Firebase Firestore
  try {
    const docRef = doc(db, EXAM_SUBMISSIONS_COLLECTION, submission.id);
    const sanitized = sanitizeForFirestore(submission);
    await withTimeout(setDoc(docRef, sanitized), 7000);
    return true;
  } catch (e) {
    console.warn('[Firebase] Gagal simpan hasil ujian ke Firestore, tersimpan di lokal:', e);
    return true;
  }
}

/**
 * Mengambil seluruh hasil ujian siswa
 */
export async function getAllExamSubmissions(paketId?: string): Promise<ExamSubmission[]> {
  const localList = getLocalSubmissions();

  try {
    const colRef = collection(db, EXAM_SUBMISSIONS_COLLECTION);
    const snapshot = await withTimeout(getDocs(colRef), 6000);
    if (!snapshot.empty) {
      const cloudList: ExamSubmission[] = [];
      snapshot.forEach((d) => {
        cloudList.push(d.data() as ExamSubmission);
      });

      const map = new Map<string, ExamSubmission>();
      cloudList.forEach((s) => map.set(s.id, s));
      localList.forEach((s) => {
        if (!map.has(s.id)) map.set(s.id, s);
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      saveLocalSubmissions(merged);

      if (paketId) {
        return merged.filter((s) => s.paketId === paketId);
      }
      return merged;
    }
  } catch (e) {
    console.warn('[Firebase] Mengambil submissions dari cache lokal:', e);
  }

  if (paketId) {
    return localList.filter((s) => s.paketId === paketId);
  }
  return localList;
}

/**
 * Menghapus data hasil ujian siswa jika diperlukan guru
 */
export async function deleteExamSubmission(submissionId: string): Promise<boolean> {
  const localList = getLocalSubmissions().filter((s) => s.id !== submissionId);
  saveLocalSubmissions(localList);

  try {
    const docRef = doc(db, EXAM_SUBMISSIONS_COLLECTION, submissionId);
    await withTimeout(deleteDoc(docRef), 5000);
    return true;
  } catch (e) {
    console.warn('[Firebase] Gagal hapus hasil ujian di cloud:', e);
    return true;
  }
}

/**
 * Berlangganan (Real-time Listener) hasil pengerjaan ujian siswa dari Cloud Firestore.
 * Setiap kali siswa di perangkat/HP lain menyelesaikan ujian, dashboard guru akan
 * langsung menerima nilai siswa secara live dan otomatis memperbarui rekapan nilai.
 */
export function subscribeToExamSubmissions(
  onUpdate: (submissions: ExamSubmission[]) => void,
  paketId?: string
): () => void {
  try {
    const colRef = collection(db, EXAM_SUBMISSIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const cloudList: ExamSubmission[] = [];
        snapshot.forEach((d) => {
          cloudList.push(d.data() as ExamSubmission);
        });

        const localList = getLocalSubmissions();
        const map = new Map<string, ExamSubmission>();
        cloudList.forEach((s) => map.set(s.id, s));
        localList.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        saveLocalSubmissions(merged);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sipartan_submissions_synced', { detail: { count: merged.length } })
          );
        }

        const filtered = paketId ? merged.filter((s) => s.paketId === paketId) : merged;
        onUpdate(filtered);
      },
      (err) => {
        console.warn('[Firebase] Listener hasil ujian error, fallback ke cache lokal:', err);
        const local = getAllExamSubmissions(paketId);
        local.then((data) => onUpdate(data)).catch(() => {});
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Berlangganan (Real-time Listener) paket ujian dari Cloud Firestore.
 * Siswa di Ruang Murid akan langsung menerima paket soal baru yang diterbitkan Guru.
 */
export function subscribeToExamPackages(
  onUpdate: (packages: ExamPackage[]) => void
): () => void {
  try {
    const colRef = collection(db, EXAM_PACKAGES_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const map = new Map<string, ExamPackage>();
        DEFAULT_CHAPTER_EXERCISES.forEach((pkg) => map.set(pkg.id, pkg));
        getLocalExamPackages().forEach((pkg) => map.set(pkg.id, pkg));

        snapshot.forEach((d) => {
          const cloudPkg = d.data() as ExamPackage;
          map.set(cloudPkg.id, cloudPkg);
        });

        const merged = Array.from(map.values());
        saveLocalExamPackages(merged);
        onUpdate(merged);
      },
      (err) => {
        console.warn('[Firebase] Listener paket ujian error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// EKSPOR DATA MURID & NILAI (NAMA & NISN) KE CSV / EXCEL
// -------------------------------------------------------------

/**
 * Mengekspor data peserta didik dan hasil ujian ke format CSV / Spreadsheet
 * Memuat Nama Siswa, NISN, Kelas, Mata Pelajaran, Jenis Asesmen, Capaian TP, Nilai Akhir, dan Keterangan KKTP
 */
export function exportStudentListCSV(submissions: ExamSubmission[], judulFile?: string): void {
  if (submissions.length === 0) return;

  // Get unique students based on NISN
  const uniqueStudentsMap = new Map<string, string>(); // NISN -> Nama
  submissions.forEach(sub => {
    if (sub.nisn && sub.namaSiswa) {
      uniqueStudentsMap.set(sub.nisn, sub.namaSiswa);
    }
  });

  const headers = [
    'No',
    'Nama Peserta Didik',
    'NISN'
  ];

  const rows = Array.from(uniqueStudentsMap.entries()).map(([nisn, nama], index) => [
    index + 1,
    nama,
    nisn
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${judulFile || 'Daftar_Peserta_Didik'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSubmissionsToCSV(submissions: ExamSubmission[], judulFile?: string): void {

  const headers = [
    'No',
    'Nama Peserta Didik',
    'NISN',
    'Kelas',
    'Mata Pelajaran',
    'Jenis Asesmen / Ulangan',
    'Tujuan Pembelajaran (TP) Diujikan',
    'Skor Perolehan',
    'Skor Maksimal',
    'Nilai Akhir (0-100)',
    'Keterangan KKTP',
    'Waktu Mengerjakan',
  ];

  const rows = submissions.map((s, idx) => {
    const tpString = s.daftarTP && s.daftarTP.length > 0
      ? s.daftarTP.map((t) => `[${t.kodeTP}] ${t.rumusanTP}`).join('; ')
      : '-';

    const waktuFormatted = new Date(s.submittedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      idx + 1,
      `"${s.namaSiswa.replace(/"/g, '""')}"`,
      `'${s.nisn}`, // Tanda kutip tunggal agar excel memperlakukan NISN sebagai teks
      `"${s.kelas}"`,
      `"${s.mataPelajaran}"`,
      `"${s.jenisAsesmen}"`,
      `"${tpString.replace(/"/g, '""')}"`,
      s.skorTotal,
      s.skorMaksimal,
      s.nilaiAkhir,
      `"${s.keteranganKKTP}"`,
      `"${waktuFormatted}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = `${judulFile || 'Data_Nilai_Murid_SIPARTAN'}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// BAHAN BACAAN & INFOGRAFIS INTERAKTIF SISWA (RUANG BACA)
// -------------------------------------------------------------

export const DEFAULT_STUDENT_READINGS: StudentReadingMaterial[] = [
  {
    id: 'baca-mat-1',
    mataPelajaran: 'Matematika',
    fase: 'Fase C',
    kelas: '5',
    elemen: 'Bilangan',
    judul: 'Petualangan Pecahan: Membandingkan & Mengoperasikan Bilangan Pecahan',
    ringkasanInfografis: [
      'Pecahan terdiri dari Pembilang (angka atas) dan Penyebut (angka bawah).',
      'Untuk membandingkan pecahan berpenyebut sama, bandingkan saja pembilangnya.',
      'Untuk pecahan berpenyebut beda, samakan penyebutnya menggunakan KPK.',
      'Perkalian pecahan sangat mudah: Pembilang × Pembilang, Penyebut × Penyebut!',
    ],
    poinKunci: [
      {
        judulPoin: '1. Mengenal Pecahan Senilai',
        penjelasan: 'Pecahan senilai memiliki nilai yang sama meski angkanya berbeda, misal 1/2 = 2/4 = 4/8.',
        ikon: 'Divide',
      },
      {
        judulPoin: '2. Menyederhanakan Pecahan',
        penjelasan: 'Bagi pembilang dan penyebut dengan FPB yang sama hingga tidak dapat dibagi lagi.',
        ikon: 'CheckCircle2',
      },
      {
        judulPoin: '3. Pecahan Desimal & Persen',
        penjelasan: 'Pecahan berpenyebut 10, 100, atau 1000 dapat diubah menjadi bentuk desimal atau persen (%).',
        ikon: 'Sparkles',
      },
    ],
    glosariumMini: [
      { istilah: 'Pembilang', arti: 'Bilangan di bagian atas garis pecahan yang menunjukkan bagian yang diambil.' },
      { istilah: 'Penyebut', arti: 'Bilangan di bagian bawah garis pecahan yang menunjukkan seluruh bagian utuh.' },
      { istilah: 'KPK', arti: 'Kelipatan Persekutuan Terkecil, digunakan menyamakan penyebut pecahan.' },
    ],
    faktaMenarik: 'Tahukah kamu? Konsep pecahan sudah digunakan bangsa Mesir Kuno lebih dari 3.000 tahun lalu!',
    tipsBelajar: 'Gunakan gambar kue pizza atau cokelat batangan saat membayangkan pembagian pecahan.',
  },
  {
    id: 'baca-ipas-1',
    mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    fase: 'Fase C',
    kelas: '5',
    elemen: 'Pemahaman IPAS (Sains dan Sosial)',
    judul: 'Melihat Lebih Terang: Keajaiban Cahaya dan Sifat-Sifatnya',
    ringkasanInfografis: [
      'Cahaya merambat lurus dari sumber cahaya ke segala arah.',
      'Cahaya dapat menembus benda bening seperti kaca dan air jernih.',
      'Cahaya dapat dipantulkan saat mengenai permukaan licin seperti cermin datar.',
      'Cahaya dapat dibiaskan (dibelokkan) saat merambat melalui dua zat yang berbeda kerapatan.',
      'Cahaya putih matahari dapat diuraikan menjadi warna-warni pelangi (me-ji-ku-hi-bi-ni-u).',
    ],
    poinKunci: [
      {
        judulPoin: '1. Mengapa Kita Bisa Melihat?',
        penjelasan: 'Mata kita melihat benda karena benda tersebut memantulkan cahaya ke dalam mata kita.',
        ikon: 'Eye',
      },
      {
        judulPoin: '2. Pembiasan Cahaya',
        penjelasan: 'Sedotan di dalam gelas berisi air terlihat patah karena pembelokan cahaya di perbatasan air dan udara.',
        ikon: 'Compass',
      },
      {
        judulPoin: '3. Cermin dan Bayangan',
        penjelasan: 'Cermin cekung memperbesar bayangan, sedangkan cermin cembung memperluas jangkauan pandang.',
        ikon: 'Shield',
      },
    ],
    glosariumMini: [
      { istilah: 'Refleksi', arti: 'Peristiwa pemantulan berkas cahaya saat membentur permukaan penghalang.' },
      { istilah: 'Refraksi', arti: 'Peristiwa pembelokan cahaya saat berpindah medium berkerapatan berbeda.' },
      { istilah: 'Dispersi', arti: 'Penguraian cahaya putih (polikromatik) menjadi warna-warni pelangi (monokromatik).' },
    ],
    faktaMenarik: 'Kecepatan cahaya di ruang hampa adalah 300.000 km per detik! Dalam satu detik bisa keliling bumi 7 kali!',
    tipsBelajar: 'Coba lakukan eksperimen sederhana dengan senter, cermin saku, dan segelas air di rumah!',
  },
  {
    id: 'baca-ind-1',
    mataPelajaran: 'Bahasa Indonesia',
    fase: 'Fase C',
    kelas: '5',
    elemen: 'Membaca dan Memirsa',
    judul: 'Menemukan Gagasan Pokok & Informasi Penting dalam Teks Bacaan',
    ringkasanInfografis: [
      'Setiap paragraf memiliki satu Gagasan Pokok (ide utama).',
      'Gagasan Pokok didukung oleh beberapa Gagasan Pendukung (kalimat penjelas).',
      'Gagasan pokok bisa berada di awal paragraf (deduktif) atau di akhir paragraf (induktif).',
      'Gunakan rumus kata tanya ADIKSIMBA (Apa, Di mana, Kapan, Siapa, Mengapa, Bagaimana) untuk merangkum.',
    ],
    poinKunci: [
      {
        judulPoin: '1. Membaca Memindai (Scanning)',
        penjelasan: 'Membaca cepat untuk mencari kata kunci tertentu seperti tanggal, nama tokoh, atau angka.',
        ikon: 'Search',
      },
      {
        judulPoin: '2. Membedakan Fakta dan Opini',
        penjelasan: 'Fakta adalah hal nyata yang dapat dibuktikan, sedangkan opini adalah pendapat pribadi.',
        ikon: 'BookOpen',
      },
    ],
    glosariumMini: [
      { istilah: 'Gagasan Pokok', arti: 'Pikiran utama atau inti pembicaraan dalam suatu paragraf.' },
      { istilah: 'Paragraf Deduktif', arti: 'Paragraf yang kalimat utamanya terletak di awal.' },
      { istilah: 'Sinonim', arti: 'Persamaan kata yang memiliki makna sejenis.' },
    ],
    faktaMenarik: 'Membaca 15 menit setiap hari dapat memperkaya kosakata kamu hingga lebih dari 1 juta kata per tahun!',
    tipsBelajar: 'Garis bawahi kata penting atau gunakan stabilo warna-warni saat membaca teks bacaan.',
  },
  {
    id: 'baca-pan-1',
    mataPelajaran: 'Pendidikan Pancasila',
    fase: 'Fase C',
    kelas: '5',
    elemen: 'Pancasila',
    judul: 'Pancasila Sebagai Panduan Hidup: Nilai Luhur dalam Kehidupan Sehari-hari',
    ringkasanInfografis: [
      'Sila ke-1 (Bintang): Percaya pada Tuhan YME dan toleransi antarumat beragama.',
      'Sila ke-2 (Rantai Emas): Menghargai hak asasi sesama dan gemar membantu teman.',
      'Sila ke-3 (Pohon Beringin): Menjaga persatuan dan cinta tanah air Indonesia.',
      'Sila ke-4 (Kepala Banteng): Musyawarah untuk mufakat dalam mengambil keputusan bersama.',
      'Sila ke-5 (Padi dan Kapas): Bersikap adil dan menghargai hasil karya orang lain.',
    ],
    poinKunci: [
      {
        judulPoin: '1. Gotong Royong di Sekolah',
        penjelasan: 'Membersihkan kelas bersama dan bekerja sama menyelesaikan tugas kelompok secara adil.',
        ikon: 'Users',
      },
      {
        judulPoin: '2. Musyawarah Pemilihan Ketua Kelas',
        penjelasan: 'Mendengarkan pendapat orang lain dengan lapang dada dan menghargai hasil mufakat.',
        ikon: 'MessageSquare',
      },
    ],
    glosariumMini: [
      { istilah: 'Toleransi', arti: 'Sikap saling menghormati dan menghargai perbedaan keyakinan atau suku.' },
      { istilah: 'Mufakat', arti: 'Kesepakatan bersama yang dicapai setelah berdiskusi dan bermusyawarah.' },
    ],
    faktaMenarik: 'Garuda Pancasila memiliki 17 helai bulu sayap, 8 bulu ekor, 19 bulu pangkal ekor, dan 45 bulu leher, melambangkan 17-8-1945!',
    tipsBelajar: 'Praktikkan satu perbuatan baik Pancasila setiap hari, seperti menyapa teman atau membuang sampah pada tempatnya.',
  },
];
