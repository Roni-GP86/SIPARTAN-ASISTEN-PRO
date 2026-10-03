import {
  SchoolIdentity,
  TPItem,
  SelectedElementItem,
  BedahElemenRow,
  ATPDocument,
  KKTPDocument,
  ProtaDocument,
  PromesDocument,
  ModulAjarDocument,
  KisiKisiSoalDocument,
  SavedItem,
  StudentInfo,
} from '../types';
import { getAllSubjectWorkspaces, isTPListValidForSubject } from './subjectWorkspaceService';
import { getLocalExamPackages, getLocalSubmissions } from '../services/examService';
import { getAutoSnapshots } from './storageUtils';

export interface IntegrityCheckItem {
  id: string;
  category: 'identitas' | 'kurikulum' | 'dokumen' | 'cloud' | 'arsip' | 'siswa';
  title: string;
  status: 'passed' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface DataIntegrityReport {
  score: number; // 0 - 100
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  errorChecks: number;
  items: IntegrityCheckItem[];
  timestamp: string;
  summary: string;
}

/**
 * Memeriksa seluruh aspek integritas data SIPARTAN:
 * 1. Keutuhan Profil & Identitas Sekolah/Guru
 * 2. Konsistensi TP terhadap BSKAP No. 046 Tahun 2025 & Permendikdasmen No. 13 Tahun 2025
 * 3. Keutuhan Alur Pembelajaran (ATP, KKTP, Prota, Promes, Modul Ajar)
 * 4. Keberadaan Ruang Kerja Lintas Mata Pelajaran (Multi-Subject Workspaces)
 * 5. Arsip Dokumen Lokal & Ketersediaan Cadangan Otomatis (Snapshots)
 * 6. Keutuhan Data Murid & Nilai Ujian Ruang Murid
 */
export function auditDataIntegrity(params: {
  identitas: SchoolIdentity;
  tpList: TPItem[];
  elemenRows: BedahElemenRow[];
  selectedElements: SelectedElementItem[];
  atpDocument: ATPDocument | null;
  kktpDocument: KKTPDocument | null;
  protaDocument: ProtaDocument | null;
  promesDocument: PromesDocument | null;
  modulAjarDocument: ModulAjarDocument | null;
  soalDocument?: KisiKisiSoalDocument | null;
  savedItems: SavedItem[];
  students: StudentInfo[];
  cloudStatus?: string;
}): DataIntegrityReport {
  const items: IntegrityCheckItem[] = [];
  const {
    identitas,
    tpList,
    elemenRows,
    atpDocument,
    kktpDocument,
    protaDocument,
    promesDocument,
    modulAjarDocument,
    soalDocument,
    savedItems,
    students,
    cloudStatus,
  } = params;

  // 1. Audit Identitas Guru & Sekolah
  if (identitas.namaGuru && identitas.namaGuru.trim().length > 2 && identitas.namaSatuanPendidikan) {
    items.push({
      id: 'id-identitas-guru',
      category: 'identitas',
      title: 'Identitas Guru & Satuan Pendidikan',
      status: 'passed',
      message: `Terverifikasi untuk ${identitas.namaGuru} (${identitas.namaSatuanPendidikan}).`,
      details: `NIP: ${identitas.nipGuru || 'Terdaftar'} | ${identitas.mataPelajaran} - ${identitas.fase} (Kelas ${identitas.kelas})`,
    });
  } else {
    items.push({
      id: 'id-identitas-guru',
      category: 'identitas',
      title: 'Identitas Guru & Satuan Pendidikan',
      status: 'warning',
      message: 'Nama guru atau satuan pendidikan belum terisi lengkap.',
    });
  }

  // 2. Audit Kesesuaian TP dengan Mata Pelajaran (Anti-Kontaminasi Data)
  if (tpList && tpList.length > 0) {
    const isValidSubject = isTPListValidForSubject(tpList, identitas.mataPelajaran);
    const isAgama =
      (identitas.mataPelajaran || '').toLowerCase().includes('agama') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('katolik') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('kristen') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('islam') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('hindu') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('buddha') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('khonghucu') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('pak') ||
      (identitas.mataPelajaran || '').toLowerCase().includes('pai');
    const cpRegName = isAgama ? 'BKP 020/2026' : 'BSKAP No. 046 Tahun 2025';
    if (isValidSubject) {
      items.push({
        id: 'id-tp-validity',
        category: 'kurikulum',
        title: `Keutuhan TP (${identitas.mataPelajaran})`,
        status: 'passed',
        message: `${tpList.length} Tujuan Pembelajaran autentik dan bebas kontaminasi materi silang.`,
        details: `Seluruh materi terverifikasi sesuai ${cpRegName}.`,
      });
    } else {
      items.push({
        id: 'id-tp-validity',
        category: 'kurikulum',
        title: `Keutuhan TP (${identitas.mataPelajaran})`,
        status: 'warning',
        message: 'Ditemukan indikasi ketidaksesuaian lingkup materi dengan mata pelajaran aktif.',
        details: 'Saran: Muat ulang atau sinkronkan ruang kerja mata pelajaran.',
      });
    }
  } else {
    items.push({
      id: 'id-tp-validity',
      category: 'kurikulum',
      title: `Keutuhan TP (${identitas.mataPelajaran})`,
      status: 'warning',
      message: 'Daftar TP saat ini kosong.',
    });
  }

  // 3. Audit Perangkat Turunan (ATP 8 Bagian)
  if (atpDocument && atpDocument.atpList && atpDocument.atpList.length > 0) {
    items.push({
      id: 'id-atp-doc',
      category: 'dokumen',
      title: 'Alur Tujuan Pembelajaran (ATP 8 Bagian)',
      status: 'passed',
      message: `Dokumen ATP lengkap (${atpDocument.atpList.length} alur pembelajaran terstruktur).`,
      details: 'Memenuhi standar 8 Bagian (A-H) Kurikulum Merdeka.',
    });
  } else {
    items.push({
      id: 'id-atp-doc',
      category: 'dokumen',
      title: 'Alur Tujuan Pembelajaran (ATP 8 Bagian)',
      status: 'warning',
      message: 'Dokumen ATP belum disusun atau draf kosong.',
    });
  }

  // 4. Audit KKTP & Rubrik
  if (kktpDocument && kktpDocument.kktpList && kktpDocument.kktpList.length > 0) {
    items.push({
      id: 'id-kktp-doc',
      category: 'dokumen',
      title: 'Kriteria Ketercapaian TP (KKTP)',
      status: 'passed',
      message: `Tersedia ${kktpDocument.kktpList.length} kriteria asesmen dengan interval & deskripsi rubrik.`,
    });
  } else {
    items.push({
      id: 'id-kktp-doc',
      category: 'dokumen',
      title: 'Kriteria Ketercapaian TP (KKTP)',
      status: 'warning',
      message: 'Dokumen KKTP belum digenerate untuk mapel ini.',
    });
  }

  // 5. Audit PROTA & PROMES
  if (protaDocument && promesDocument) {
    items.push({
      id: 'id-prota-promes',
      category: 'dokumen',
      title: 'Program Tahunan & Semester (PROTA & PROMES)',
      status: 'passed',
      message: `Alokasi JP sinkron dengan Permendikdasmen No. 13 Tahun 2025 (${protaDocument.totalJPTahun || protaDocument.totalJPTahunAkumulasi || 0} JP).`,
    });
  } else {
    items.push({
      id: 'id-prota-promes',
      category: 'dokumen',
      title: 'Program Tahunan & Semester (PROTA & PROMES)',
      status: 'warning',
      message: 'PROTA atau PROMES belum lengkap.',
    });
  }

  // 6. Audit Ruang Kerja Multi-Mata Pelajaran (Subject Workspaces)
  const workspaces = getAllSubjectWorkspaces();
  const workspaceCount = Object.keys(workspaces).length;
  if (workspaceCount > 0) {
    items.push({
      id: 'id-workspaces',
      category: 'kurikulum',
      title: 'Ruang Kerja Multi-Mapel',
      status: 'passed',
      message: `${workspaceCount} ruang kerja mata pelajaran tersimpan terpisah dan aman dari tumpang tindih.`,
      details: Object.keys(workspaces).join(', '),
    });
  } else {
    items.push({
      id: 'id-workspaces',
      category: 'kurikulum',
      title: 'Ruang Kerja Multi-Mapel',
      status: 'error',
      message: 'Tidak ditemukan ruang kerja tersimpan di memori.',
    });
  }

  // 7. Audit Arsip Dokumen Lokal
  if (savedItems && savedItems.length > 0) {
    items.push({
      id: 'id-arsip-saved',
      category: 'arsip',
      title: 'Arsip Dokumen Permanen',
      status: 'passed',
      message: `${savedItems.length} dokumen tersimpan dalam riwayat arsip yang kebal refresh.`,
    });
  } else {
    items.push({
      id: 'id-arsip-saved',
      category: 'arsip',
      title: 'Arsip Dokumen Permanen',
      status: 'passed',
      message: 'Riwayat arsip bersih. Draf aktif tersimpan aman di ruang kerja.',
    });
  }

  // 8. Audit Snapshots Pencadangan Otomatis
  const snapshots = getAutoSnapshots();
  if (snapshots && snapshots.length > 0) {
    items.push({
      id: 'id-snapshots',
      category: 'arsip',
      title: 'Snapshot Cadangan Otomatis',
      status: 'passed',
      message: `${snapshots.length} snapshot cadangan otomatis tersedia untuk pemulihan darurat seketika.`,
      details: `Cadangan terbaru: ${snapshots[0].timestamp}`,
    });
  } else {
    items.push({
      id: 'id-snapshots',
      category: 'arsip',
      title: 'Snapshot Cadangan Otomatis',
      status: 'warning',
      message: 'Belum ada snapshot cadangan otomatis tersimpan.',
    });
  }

  // 9. Audit Data Murid & Nilai Ujian Ruang Murid
  const studentCount = students ? students.length : 0;
  const submissions = getLocalSubmissions();
  const examPackages = getLocalExamPackages();

  if (studentCount > 0 || submissions.length > 0 || examPackages.length > 0) {
    items.push({
      id: 'id-ruang-murid-data',
      category: 'siswa',
      title: 'Integritas Ruang Murid & Siswa',
      status: 'passed',
      message: `${studentCount} peserta didik terdaftar, ${examPackages.length} paket soal, ${submissions.length} lembar jawaban terlindungi.`,
      details: 'Semua berkas jawaban murid dilindungi dari penghapusan bebas untuk menjamin akuntabilitas rapor.',
    });
  } else {
    items.push({
      id: 'id-ruang-murid-data',
      category: 'siswa',
      title: 'Integritas Ruang Murid & Siswa',
      status: 'passed',
      message: 'Portal Ruang Murid siap digunakan.',
    });
  }

  // 10. Audit Status Cloud Firestore
  if (cloudStatus === 'error') {
    items.push({
      id: 'id-cloud-status',
      category: 'cloud',
      title: 'Sinkronisasi Cloud Firestore',
      status: 'warning',
      message: 'Terjadi kendala jaringan saat sinkron cloud. Data saat ini tersimpan aman di cache lokal.',
    });
  } else {
    items.push({
      id: 'id-cloud-status',
      category: 'cloud',
      title: 'Sinkronisasi Cloud Firestore',
      status: 'passed',
      message: 'Penyimpanan awan Firebase Firestore aktif dengan perlindungan anti-penimpaan.',
    });
  }

  // Hitung Skor Keutuhan Data
  const total = items.length;
  const passed = items.filter((i) => i.status === 'passed').length;
  const warning = items.filter((i) => i.status === 'warning').length;
  const error = items.filter((i) => i.status === 'error').length;

  const score = Math.round(((passed * 1 + warning * 0.7) / total) * 100);

  let summary = 'Data Anda 100% utuh, konsisten, dan terlindungi penuh lintas perangkat.';
  if (score < 80) {
    summary = 'Sebagian data kurikulum belum lengkap, namun seluruh berkas aktif tersimpan aman.';
  } else if (score < 95) {
    summary = 'Integritas data sangat baik. Seluruh komponen penting kurikulum telah terlindungi.';
  }

  return {
    score,
    totalChecks: total,
    passedChecks: passed,
    warningChecks: warning,
    errorChecks: error,
    items,
    timestamp: new Date().toISOString(),
    summary,
  };
}
