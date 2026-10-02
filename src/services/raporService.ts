import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  StudentInfo,
  ExamSubmission,
  ExamPackage,
  SchoolIdentity,
  TPItem,
} from '../types';

export interface RaporTPScoreItem {
  kodeTP: string;
  rumusanTP: string;
  lingkupMateri: string;
  skor: number;
  isTuntas: boolean;
  submissionCount: number;
}

export interface RaporStudentRow {
  studentId: string;
  nisn: string;
  nis: string;
  nama: string;
  tpScores: Record<string, RaporTPScoreItem>;
  nilaiFormatif: number; // Rata-rata Formatif / TP
  nilaiSTS: number; // Sumatif Tengah Semester
  nilaiSAS: number; // Sumatif Akhir Semester
  nilaiAkhir: number; // Nilai Akhir (NA) Rapor
  predikat: 'A' | 'B' | 'C' | 'D';
  keteranganKKTP: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  capaianTertinggi: string;
  capaianPerluBimbingan: string;
  catatanGuru?: string;
  isCustomized?: boolean;
  totalSubmissions: number;
}

export interface RaporSettings {
  mataPelajaran: string;
  kelas: string;
  semester: 'Semester 1' | 'Semester 2';
  tahunPelajaran: string;
  kktpThreshold: number; // Default 75
  bobotFormatif: number; // Default 50%
  bobotSTS: number; // Default 25%
  bobotSAS: number; // Default 25%
}

export interface RaporClassStats {
  totalStudents: number;
  activeStudents: number;
  avgFormatif: number;
  avgSTS: number;
  avgSAS: number;
  avgNilaiAkhir: number;
  highestScore: number;
  lowestScore: number;
  passedCount: number;
  remedialCount: number;
  percentagePassed: number;
  predikatCounts: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

const STORAGE_PREFIX = 'sipartan_rapor_overrides_';

/**
 * Membersihkan awalan frasa rumusan TP agar menjadi kalimat mengalir
 * sesuai kaidah penulisan narasi Rapor Kurikulum Merdeka (PPA Kemdikbud).
 */
export function cleanTPRumusanForRapor(rumusanTP: string): string {
  if (!rumusanTP) return '';
  let cleaned = rumusanTP.trim();

  // Pola-pola klise yang perlu disederhanakan
  const prefixes = [
    /^peserta didik mampu\s+/i,
    /^peserta didik dapat\s+/i,
    /^siswa mampu\s+/i,
    /^siswa dapat\s+/i,
    /^murid mampu\s+/i,
    /^murid dapat\s+/i,
    /^melalui kegiatan pembelajaran peserta didik mampu\s+/i,
    /^melalui pengamatan peserta didik mampu\s+/i,
    /^melalui diskusi peserta didik dapat\s+/i,
    /^setelah mempelajari materi ini peserta didik mampu\s+/i,
    /^mampu\s+/i,
    /^dapat\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '');
      break;
    }
  }

  // Huruf pertama dikecilkan agar menyambung dengan "dalam ..."
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  // Hilangkan tanda titik di akhir jika ada
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned.trim();
}

/**
 * Menyusun deskripsi ketercapaian kompetensi otomatis (Capaian Tertinggi & Perlu Bimbingan)
 * berdasarkan data skor TP dan ambang batas KKTP.
 */
export function generateDeskripsiKurikulumMerdeka(
  tpList: { kodeTP: string; rumusanTP: string; lingkupMateri?: string }[],
  tpScores: Record<string, RaporTPScoreItem>,
  kktpThreshold: number,
  nilaiAkhir: number
): { capaianTertinggi: string; capaianPerluBimbingan: string } {
  const evaluatedTPs = tpList.map((tp) => {
    const scoreItem = tpScores[tp.kodeTP];
    const score = scoreItem ? scoreItem.skor : nilaiAkhir;
    return {
      kodeTP: tp.kodeTP,
      rumusanTP: tp.rumusanTP,
      lingkupMateri: tp.lingkupMateri || '',
      skor: score,
      cleanRumusan: cleanTPRumusanForRapor(tp.rumusanTP),
    };
  });

  if (evaluatedTPs.length === 0) {
    return {
      capaianTertinggi:
        nilaiAkhir >= kktpThreshold
          ? 'Menunjukkan penguasaan yang sangat baik dalam memahami konsep materi pembelajaran.'
          : 'Menunjukkan pemahaman yang cukup dalam materi pembelajaran yang telah dipelajari.',
      capaianPerluBimbingan:
        nilaiAkhir >= kktpThreshold
          ? 'Perlu pemantapan dan pengayaan berkelanjutan untuk mempertahankan prestasi belajar.'
          : 'Perlu bimbingan dan pendampingan intensif dalam pemecahan masalah pembelajaran.',
    };
  }

  // Urutkan dari skor tertinggi ke terendah
  const sorted = [...evaluatedTPs].sort((a, b) => b.skor - a.skor);

  const bestTP = sorted[0];
  const lowestTP = sorted[sorted.length - 1];

  // 1. Rumusan Capaian Tertinggi
  let capaianTertinggi = '';
  if (bestTP.skor >= 88) {
    capaianTertinggi = `Menunjukkan penguasaan yang sangat baik dalam ${bestTP.cleanRumusan}.`;
  } else if (bestTP.skor >= kktpThreshold) {
    capaianTertinggi = `Menunjukkan penguasaan yang baik dalam ${bestTP.cleanRumusan}.`;
  } else {
    capaianTertinggi = `Menunjukkan pemahaman yang berkembang dalam ${bestTP.cleanRumusan}.`;
  }

  // 2. Rumusan Capaian yang Perlu Peningkatan / Bimbingan
  let capaianPerluBimbingan = '';
  const belowKKTP = sorted.filter((tp) => tp.skor < kktpThreshold);

  if (belowKKTP.length > 0) {
    const targetLowest = belowKKTP[belowKKTP.length - 1];
    capaianPerluBimbingan = `Perlu bimbingan dan pendampingan dalam ${targetLowest.cleanRumusan}.`;
  } else {
    // Semua TP tuntas
    if (lowestTP && lowestTP.skor < 85) {
      capaianPerluBimbingan = `Perlu sedikit penguatan dan latihan tambahan dalam ${lowestTP.cleanRumusan}.`;
    } else {
      capaianPerluBimbingan =
        'Menunjukkan penguasaan yang merata di seluruh tujuan pembelajaran, pertahankan motivasi dan prestasi belajarnya.';
    }
  }

  return { capaianTertinggi, capaianPerluBimbingan };
}

/**
 * Menyimpan data penyesuaian/catatan guru ke localStorage
 */
export function saveRaporOverrides(
  mapel: string,
  semester: string,
  overrides: Record<string, Partial<RaporStudentRow>>
): void {
  try {
    const key = `${STORAGE_PREFIX}${mapel}_${semester}`.replace(/\s+/g, '_');
    localStorage.setItem(key, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Gagal menyimpan penyesuaian rapor ke localStorage:', e);
  }
}

/**
 * Memuat data penyesuaian/catatan guru dari localStorage
 */
export function loadRaporOverrides(
  mapel: string,
  semester: string
): Record<string, Partial<RaporStudentRow>> {
  try {
    const key = `${STORAGE_PREFIX}${mapel}_${semester}`.replace(/\s+/g, '_');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Gagal memuat penyesuaian rapor dari localStorage:', e);
    return {};
  }
}

/**
 * Mengosongkan data penyesuaian manual kembali ke murni CBT
 */
export function resetRaporOverrides(mapel: string, semester: string): void {
  try {
    const key = `${STORAGE_PREFIX}${mapel}_${semester}`.replace(/\s+/g, '_');
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Gagal mereset penyesuaian rapor:', e);
  }
}

/**
 * Menghitung rekap nilai rapor murid dari data hasil ujian CBT
 */
export function computeRaporData(
  students: StudentInfo[],
  submissions: ExamSubmission[],
  packages: ExamPackage[],
  curriculumTPs: TPItem[],
  settings: RaporSettings
): {
  rows: RaporStudentRow[];
  activeTPList: { kodeTP: string; rumusanTP: string; lingkupMateri: string }[];
  stats: RaporClassStats;
} {
  const {
    mataPelajaran,
    semester,
    kktpThreshold = 75,
    bobotFormatif = 50,
    bobotSTS = 25,
    bobotSAS = 25,
  } = settings;

  // 1. Ekstraksi Daftar TP yang Relevan dengan Mata Pelajaran & Semester Ini
  let activeTPList: { kodeTP: string; rumusanTP: string; lingkupMateri: string }[] = [];

  // Ambil dari daftar TP kurikulum aktif terlebih dahulu
  if (curriculumTPs && curriculumTPs.length > 0) {
    activeTPList = curriculumTPs
      .filter((tp) => {
        if (!tp.semesterTarget || tp.semesterTarget === 'Fleksibel') return true;
        return tp.semesterTarget === semester;
      })
      .map((tp) => ({
        kodeTP: tp.kodeTP,
        rumusanTP: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri || '',
      }));
  }

  // Jika belum ada TP dari kurikulum, cari dari paket CBT mata pelajaran ini
  if (activeTPList.length === 0) {
    const relevantPackages = packages.filter(
      (p) =>
        !mataPelajaran ||
        mataPelajaran === 'Semua Mata Pelajaran' ||
        p.mataPelajaran?.toLowerCase() === mataPelajaran.toLowerCase()
    );

    const tpMap = new Map<string, { kodeTP: string; rumusanTP: string; lingkupMateri: string }>();
    relevantPackages.forEach((pkg) => {
      if (pkg.daftarTP && pkg.daftarTP.length > 0) {
        pkg.daftarTP.forEach((tp) => {
          if (!tpMap.has(tp.kodeTP)) {
            tpMap.set(tp.kodeTP, {
              kodeTP: tp.kodeTP,
              rumusanTP: tp.rumusanTP,
              lingkupMateri: tp.lingkupMateri || '',
            });
          }
        });
      }
    });

    activeTPList = Array.from(tpMap.values());
  }

  // Jika tetap kosong, buat 3 TP default representatif agar matriks rapor tetap utuh dan estetik
  if (activeTPList.length === 0) {
    activeTPList = [
      {
        kodeTP: 'TP-01',
        rumusanTP: 'Memahami konsep dasar dan kaidah pokok pembelajaran dengan cermat',
        lingkupMateri: 'Konsep Dasar & Teori',
      },
      {
        kodeTP: 'TP-02',
        rumusanTP: 'Menerapkan prosedur pemecahan masalah kontekstual dalam situasi nyata',
        lingkupMateri: 'Penerapan & Operasi',
      },
      {
        kodeTP: 'TP-03',
        rumusanTP: 'Menganalisis hubungan sebab-akibat dan menyimpulkan solusi dengan logis',
        lingkupMateri: 'Analisis & Penalaran',
      },
    ];
  }

  // 2. Muat Override Guru Tersimpan
  const overrides = loadRaporOverrides(mataPelajaran, semester);

  // 3. Olah Nilai Tiap Murid
  const rows: RaporStudentRow[] = students.map((stu) => {
    // Cari seluruh submission murid ini
    const stuSubs = submissions.filter((sub) => {
      const nisnMatch =
        (sub.nisn && sub.nisn === stu.nisn) ||
        ((sub as any).siswaNisn && (sub as any).siswaNisn === stu.nisn);
      const namaMatch =
        (sub.namaSiswa && sub.namaSiswa.trim().toLowerCase() === stu.nama.trim().toLowerCase()) ||
        ((sub as any).siswaNama &&
          (sub as any).siswaNama.trim().toLowerCase() === stu.nama.trim().toLowerCase());
      return nisnMatch || namaMatch;
    });

    // Filter submission sesuai mata pelajaran jika ada
    const relevantSubs =
      mataPelajaran && mataPelajaran !== 'Semua Mata Pelajaran'
        ? stuSubs.filter(
            (s) => !s.mataPelajaran || s.mataPelajaran.toLowerCase() === mataPelajaran.toLowerCase()
          )
        : stuSubs;

    // A. Kumpulkan Skor per TP
    const tpScores: Record<string, RaporTPScoreItem> = {};

    activeTPList.forEach((tp) => {
      let totalSkorTP = 0;
      let countTP = 0;

      relevantSubs.forEach((sub) => {
        // Cek jika ada analisisTP terperinci
        if (sub.analisisTP && sub.analisisTP.length > 0) {
          const matched = sub.analisisTP.find(
            (a) => a.kodeTP.toLowerCase() === tp.kodeTP.toLowerCase()
          );
          if (matched) {
            totalSkorTP += matched.persentase;
            countTP++;
          }
        } else if (sub.daftarTP && sub.daftarTP.some((d) => d.kodeTP === tp.kodeTP)) {
          totalSkorTP += sub.nilaiAkhir;
          countTP++;
        }
      });

      if (countTP > 0) {
        const skorRata = Math.round(totalSkorTP / countTP);
        tpScores[tp.kodeTP] = {
          kodeTP: tp.kodeTP,
          rumusanTP: tp.rumusanTP,
          lingkupMateri: tp.lingkupMateri,
          skor: skorRata,
          isTuntas: skorRata >= kktpThreshold,
          submissionCount: countTP,
        };
      }
    });

    // B. Cari Nilai Formatif (Rata-rata TP yang ada, atau nilai rata-rata submission ulangan harian)
    const tpScoreValues = Object.values(tpScores).map((t) => t.skor);
    let computedFormatif =
      tpScoreValues.length > 0
        ? Math.round(tpScoreValues.reduce((a, b) => a + b, 0) / tpScoreValues.length)
        : 0;

    // Jika belum ada nilai per-TP tapi ada submission umum
    if (computedFormatif === 0 && relevantSubs.length > 0) {
      computedFormatif = Math.round(
        relevantSubs.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / relevantSubs.length
      );
    }

    // C. Cari Nilai STS & SAS
    const stsSub = relevantSubs.find(
      (s) =>
        s.jenisAsesmen === 'Tengah Semester 1' ||
        s.jenisAsesmen === 'Tengah Semester 2' ||
        s.judulPaket?.toLowerCase().includes('tengah') ||
        s.judulPaket?.toLowerCase().includes('sts')
    );
    let computedSTS = stsSub ? Math.round(stsSub.nilaiAkhir) : 0;

    const sasSub = relevantSubs.find(
      (s) =>
        s.jenisAsesmen === 'Semester 1' ||
        s.jenisAsesmen === 'Semester 2' ||
        s.judulPaket?.toLowerCase().includes('akhir') ||
        s.judulPaket?.toLowerCase().includes('sas') ||
        s.judulPaket?.toLowerCase().includes('pas')
    );
    let computedSAS = sasSub ? Math.round(sasSub.nilaiAkhir) : 0;

    // Estimasi proporsional jika belum ikut STS/SAS (agar guru dapat gambaran awal)
    if (computedSTS === 0 && computedFormatif > 0) {
      computedSTS = Math.min(100, Math.max(50, computedFormatif));
    }
    if (computedSAS === 0 && computedFormatif > 0) {
      computedSAS = Math.min(100, Math.max(50, computedFormatif));
    }

    // D. Hitung Nilai Akhir (NA)
    const totalBobot = bobotFormatif + bobotSTS + bobotSAS;
    let nilaiAkhir =
      computedFormatif > 0 || computedSTS > 0 || computedSAS > 0
        ? Math.round(
            (computedFormatif * bobotFormatif + computedSTS * bobotSTS + computedSAS * bobotSAS) /
              (totalBobot || 100)
          )
        : 0;

    // E. Susun Deskripsi Rapor Kurikulum Merdeka Otomatis
    const autoDeskripsi = generateDeskripsiKurikulumMerdeka(
      activeTPList,
      tpScores,
      kktpThreshold,
      nilaiAkhir
    );

    // F. Cek apakah ada Override Manual dari Guru
    const studentOverride = overrides[stu.id] || {};
    const finalFormatif =
      studentOverride.nilaiFormatif !== undefined
        ? studentOverride.nilaiFormatif
        : computedFormatif;
    const finalSTS =
      studentOverride.nilaiSTS !== undefined ? studentOverride.nilaiSTS : computedSTS;
    const finalSAS =
      studentOverride.nilaiSAS !== undefined ? studentOverride.nilaiSAS : computedSAS;

    const finalNA =
      studentOverride.nilaiAkhir !== undefined
        ? studentOverride.nilaiAkhir
        : Math.round(
            (finalFormatif * bobotFormatif + finalSTS * bobotSTS + finalSAS * bobotSAS) /
              (totalBobot || 100)
          );

    let predikat: 'A' | 'B' | 'C' | 'D' = 'C';
    let keteranganKKTP: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Cukup';

    if (finalNA >= 90) {
      predikat = 'A';
      keteranganKKTP = 'Sangat Baik';
    } else if (finalNA >= 80) {
      predikat = 'B';
      keteranganKKTP = 'Baik';
    } else if (finalNA >= kktpThreshold) {
      predikat = 'C';
      keteranganKKTP = 'Cukup';
    } else {
      predikat = 'D';
      keteranganKKTP = 'Perlu Bimbingan';
    }

    const capaianTertinggi =
      studentOverride.capaianTertinggi || autoDeskripsi.capaianTertinggi;
    const capaianPerluBimbingan =
      studentOverride.capaianPerluBimbingan || autoDeskripsi.capaianPerluBimbingan;
    const catatanGuru = studentOverride.catatanGuru || '';

    return {
      studentId: stu.id,
      nisn: stu.nisn,
      nis: stu.nis || stu.nisn,
      nama: stu.nama,
      tpScores,
      nilaiFormatif: finalFormatif,
      nilaiSTS: finalSTS,
      nilaiSAS: finalSAS,
      nilaiAkhir: finalNA,
      predikat,
      keteranganKKTP,
      capaianTertinggi,
      capaianPerluBimbingan,
      catatanGuru,
      isCustomized: Boolean(overrides[stu.id]),
      totalSubmissions: relevantSubs.length,
    };
  });

  // 4. Hitung Statistik Klasikal
  const activeStudentsList = rows.filter((r) => r.nilaiAkhir > 0);
  const totalStudents = rows.length;
  const activeStudents = activeStudentsList.length;

  let sumFormatif = 0;
  let sumSTS = 0;
  let sumSAS = 0;
  let sumNA = 0;
  let highestScore = 0;
  let lowestScore = 100;
  let passedCount = 0;

  const predikatCounts = { A: 0, B: 0, C: 0, D: 0 };

  rows.forEach((r) => {
    predikatCounts[r.predikat]++;
    if (r.nilaiAkhir > 0) {
      sumFormatif += r.nilaiFormatif;
      sumSTS += r.nilaiSTS;
      sumSAS += r.nilaiSAS;
      sumNA += r.nilaiAkhir;

      if (r.nilaiAkhir > highestScore) highestScore = r.nilaiAkhir;
      if (r.nilaiAkhir < lowestScore) lowestScore = r.nilaiAkhir;
      if (r.nilaiAkhir >= kktpThreshold) passedCount++;
    }
  });

  if (activeStudents === 0) {
    lowestScore = 0;
  }

  const avgFormatif = activeStudents > 0 ? Math.round((sumFormatif / activeStudents) * 10) / 10 : 0;
  const avgSTS = activeStudents > 0 ? Math.round((sumSTS / activeStudents) * 10) / 10 : 0;
  const avgSAS = activeStudents > 0 ? Math.round((sumSAS / activeStudents) * 10) / 10 : 0;
  const avgNilaiAkhir = activeStudents > 0 ? Math.round((sumNA / activeStudents) * 10) / 10 : 0;
  const percentagePassed =
    activeStudents > 0 ? Math.round((passedCount / activeStudents) * 100) : 0;

  const stats: RaporClassStats = {
    totalStudents,
    activeStudents,
    avgFormatif,
    avgSTS,
    avgSAS,
    avgNilaiAkhir,
    highestScore,
    lowestScore,
    passedCount,
    remedialCount: activeStudents - passedCount,
    percentagePassed,
    predikatCounts,
  };

  return { rows, activeTPList, stats };
}

/**
 * Salin data rekap rapor ke clipboard dalam format TSV (siap paste ke e-Rapor atau Excel)
 */
export function copyRaporToClipboard(
  rows: RaporStudentRow[],
  activeTPList: { kodeTP: string; rumusanTP: string }[]
): boolean {
  try {
    const tpHeaders = activeTPList.map((t) => t.kodeTP).join('\t');
    const header = `No\tNISN\tNama Peserta Didik\t${tpHeaders}\tRata Formatif\tSTS\tSAS\tNilai Akhir\tPredikat\tCapaian Tertinggi\tCapaian Perlu Bimbingan\tCatatan Guru`;

    const bodyLines = rows.map((r, i) => {
      const tpValues = activeTPList
        .map((t) => (r.tpScores[t.kodeTP] ? r.tpScores[t.kodeTP].skor : r.nilaiFormatif || '-'))
        .join('\t');
      return `${i + 1}\t${r.nisn}\t${r.nama}\t${tpValues}\t${r.nilaiFormatif}\t${r.nilaiSTS}\t${r.nilaiSAS}\t${r.nilaiAkhir}\t${r.predikat}\t"${r.capaianTertinggi}"\t"${r.capaianPerluBimbingan}"\t"${r.catatanGuru || '-'}"`;
    });

    const fullText = [header, ...bodyLines].join('\n');
    navigator.clipboard.writeText(fullText);
    return true;
  } catch (e) {
    console.warn('Gagal menyalin format e-Rapor:', e);
    return false;
  }
}

/**
 * Unduh Rekap Nilai Rapor dalam format CSV/Excel
 */
export function exportRaporToCSV(
  rows: RaporStudentRow[],
  activeTPList: { kodeTP: string; rumusanTP: string }[],
  settings: RaporSettings
): void {
  const tpHeaders = activeTPList.map((t) => `"${t.kodeTP}"`).join(',');
  const header = `No,NISN,Nama Murid,${tpHeaders},"Rata Formatif","Nilai STS","Nilai SAS","Nilai Akhir","Predikat","Keterangan KKTP","Capaian Tertinggi","Capaian Perlu Peningkatan","Catatan Guru"`;

  const lines = rows.map((r, i) => {
    const tpVals = activeTPList
      .map((t) => (r.tpScores[t.kodeTP] ? r.tpScores[t.kodeTP].skor : r.nilaiFormatif))
      .join(',');
    const sanitizedTertinggi = (r.capaianTertinggi || '').replace(/"/g, '""');
    const sanitizedBimbingan = (r.capaianPerluBimbingan || '').replace(/"/g, '""');
    const sanitizedCatatan = (r.catatanGuru || '').replace(/"/g, '""');

    return `${i + 1},"${r.nisn}","${r.nama}",${tpVals},${r.nilaiFormatif},${r.nilaiSTS},${r.nilaiSAS},${r.nilaiAkhir},"${r.predikat}","${r.keteranganKKTP}","${sanitizedTertinggi}","${sanitizedBimbingan}","${sanitizedCatatan}"`;
  });

  const csvContent = '\uFEFF' + [header, ...lines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Rekap_Nilai_Rapor_${settings.mataPelajaran}_${settings.kelas}_${settings.semester}.csv`.replace(
    /\s+/g,
    '_'
  );
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Menghasilkan Dokumen PDF Resmi Akademis Analisis Nilai Rapor & Deskripsi Kemajuan Belajar
 * Lengkap dengan Kop Sekolah, Tabel Nilai Komprehensif, Kolom Deskripsi Kurikulum Merdeka,
 * Statistik Klasikal, dan Titimangsa Tanda Tangan Resmi.
 */
export function generateRaporAnalysisPDF(options: {
  identitas: SchoolIdentity;
  settings: RaporSettings;
  rows: RaporStudentRow[];
  activeTPList: { kodeTP: string; rumusanTP: string; lingkupMateri: string }[];
  stats: RaporClassStats;
}): void {
  const { identitas, settings, rows, activeTPList, stats } = options;

  // Format Landscape A4 untuk menampung tabel nilai dan deskripsi rapor dengan lapang
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 12;

  // ================= 1. KOP SURAT RESMI =================
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      doc.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', marginX + 4, 10, 20, 20);
    } catch (e) {
      console.warn('Gagal memuat logo sekolah:', e);
    }
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KABUPATEN TIMOR TENGAH UTARA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.8;

  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.2;

  doc.setFontSize(13.5);
  const schoolName = (identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  const alamat = identitas.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - TTU';
  doc.text(`Alamat: ${alamat} • NPSN: 50304381`, pageWidth / 2, currentY, {
    align: 'center',
  });
  currentY += 3.5;

  doc.text(
    'Sistem Informasi Pembelajaran & Asesmen Terpadu (SIPARTAN) • Tahun Ajaran 2026/2027',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 3;

  // Garis Ganda Pembatas Kop Surat
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.25);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // ================= 2. JUDUL LAPORAN =================
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(
    'LAPORAN ANALISIS NILAI RAPOR & DESKRIPSI KEMAJUAN BELAJAR',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 4.5;

  doc.setFontSize(9.5);
  doc.setFont('times', 'italic');
  doc.text(
    'Standar Pengolahan Asesmen Formatif & Sumatif Sesuai Panduan Pembelajaran & Asesmen (PPA) Kurikulum Merdeka',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 5;

  // ================= 3. PARAMETER IDENTITAS & PEMBOBOTAN =================
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 0.8, textColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 3 },
      2: { cellWidth: 60 },
      3: { cellWidth: 28, fontStyle: 'bold' },
      4: { cellWidth: 3 },
      5: { cellWidth: 60 },
      6: { cellWidth: 32, fontStyle: 'bold' },
      7: { cellWidth: 3 },
      8: { cellWidth: 55 },
    },
    body: [
      [
        'Satuan Pendidikan',
        ':',
        identitas.namaSatuanPendidikan || 'SD Negeri Fatubai',
        'Mata Pelajaran',
        ':',
        settings.mataPelajaran,
        'KKTP Minimal',
        ':',
        `${settings.kktpThreshold} (Skala 100)`,
      ],
      [
        'Kelas / Fase',
        ':',
        `Kelas ${identitas.kelas || 'VI'} (${identitas.fase || 'Fase C'})`,
        'Semester',
        ':',
        settings.semester,
        'Rumus NA Rapor',
        ':',
        `F (${settings.bobotFormatif}%) + STS (${settings.bobotSTS}%) + SAS (${settings.bobotSAS}%)`,
      ],
      [
        'Guru Pengampu',
        ':',
        identitas.namaGuru || 'Yohanes Pantola, S.Pd.SD',
        'Tahun Ajaran',
        ':',
        settings.tahunPelajaran || '2026/2027',
        'Titimangsa Cetak',
        ':',
        new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // ================= 4. TABEL REKAPITULASI RAPOR UTAMA =================
  const tableHead = [
    [
      { content: 'No', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'NISN', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'Nama Peserta Didik', rowSpan: 2, styles: { halign: 'left' as const, valign: 'middle' as const } },
      { content: 'Capaian TP (Formatif)', colSpan: Math.min(activeTPList.length, 4) + 1, styles: { halign: 'center' as const } },
      { content: 'Sumatif', colSpan: 2, styles: { halign: 'center' as const } },
      { content: 'Nilai Akhir', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'Predikat', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'Deskripsi Capaian Kompetensi Kurikulum Merdeka', colSpan: 2, styles: { halign: 'center' as const } },
    ],
    [
      ...activeTPList.slice(0, 4).map((t) => ({ content: t.kodeTP, styles: { halign: 'center' as const } })),
      { content: 'Rata F', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
      { content: 'STS', styles: { halign: 'center' as const } },
      { content: 'SAS', styles: { halign: 'center' as const } },
      { content: 'Capaian Tertinggi (Penguasaan Sangat Baik)', styles: { halign: 'left' as const } },
      { content: 'Perlu Peningkatan (Perlu Bimbingan)', styles: { halign: 'left' as const } },
    ],
  ];

  const tableBody = rows.map((r, i) => {
    const tpCells = activeTPList.slice(0, 4).map((t) => {
      const score = r.tpScores[t.kodeTP]?.skor;
      return score !== undefined ? `${score}` : `${r.nilaiFormatif || '-'}`;
    });

    return [
      `${i + 1}`,
      r.nisn || '-',
      r.nama,
      ...tpCells,
      `${r.nilaiFormatif}`,
      `${r.nilaiSTS}`,
      `${r.nilaiSAS}`,
      `${r.nilaiAkhir}`,
      `${r.predikat}`,
      r.capaianTertinggi || '-',
      r.capaianPerluBimbingan || '-',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: tableHead as any,
    body: tableBody,
    styles: {
      font: 'times',
      fontSize: 7.5,
      cellPadding: 1.4,
      textColor: [20, 20, 20],
      lineColor: [180, 180, 180],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 50, 90],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38, fontStyle: 'bold' },
      // TP cells + Rata F + STS + SAS
      [3]: { cellWidth: 10, halign: 'center' },
      [4]: { cellWidth: 10, halign: 'center' },
      [5]: { cellWidth: 10, halign: 'center' },
      [6]: { cellWidth: 10, halign: 'center' },
      [7]: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
      [8]: { cellWidth: 10, halign: 'center' },
      [9]: { cellWidth: 10, halign: 'center' },
      [10]: { cellWidth: 11, halign: 'center', fontStyle: 'bold' },
      [11]: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      [12]: { cellWidth: 57, fontSize: 7, cellPadding: 1 },
      [13]: { cellWidth: 55, fontSize: 7, cellPadding: 1 },
    },
    didParseCell: (data) => {
      // Pewarnaan nilai akhir jika di bawah KKTP
      if (data.section === 'body' && data.column.index === 10) {
        const val = Number(data.cell.raw);
        if (val > 0 && val < settings.kktpThreshold) {
          data.cell.styles.textColor = [200, 30, 30];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ================= 5. REKAPITULASI KLASIKAL =================
  if (currentY > pageHeight - 48) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('REKAPITULASI STATISTIK KELAS:', marginX, currentY);
  currentY += 2.5;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: { font: 'times', fontSize: 8, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [45, 65, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [
      [
        'Total Peserta Didik',
        'Rata-rata Formatif',
        'Rata-rata STS',
        'Rata-rata SAS',
        'Rata-rata Nilai Akhir',
        'Nilai Tertinggi',
        'Nilai Terendah',
        'Tuntas KKTP',
        'Belum Tuntas',
        '% Ketuntasan Klasikal',
      ],
    ],
    body: [
      [
        `${stats.totalStudents} Murid`,
        `${stats.avgFormatif}`,
        `${stats.avgSTS}`,
        `${stats.avgSAS}`,
        `${stats.avgNilaiAkhir}`,
        `${stats.highestScore}`,
        `${stats.lowestScore}`,
        `${stats.passedCount} Murid`,
        `${stats.remedialCount} Murid`,
        `${stats.percentagePassed}%`,
      ],
    ],
    bodyStyles: { fontStyle: 'bold', textColor: [20, 20, 20] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ================= 6. LEMBAR PENGESAHAN & TANDA TANGAN =================
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 15;
  }

  const signWidth = 85;
  const leftX = marginX + 10;
  const rightX = pageWidth - marginX - signWidth;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);

  // Kiri: Kepala Sekolah
  doc.text('Mengetahui,', leftX, currentY);
  doc.text('Kepala Satuan Pendidikan', leftX, currentY + 4.5);
  doc.text(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', leftX, currentY + 9);

  // Kanan: Guru Kelas
  const kota = identitas.kabupaten || 'Fatubai';
  const tglStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`${kota}, ${tglStr}`, rightX, currentY);
  doc.text('Guru Kelas VI Pengampu,', rightX, currentY + 4.5);

  const signSpace = 18;
  currentY += signSpace + 9;

  // Nama & NIP Kiri
  doc.setFont('times', 'bold');
  const kepsekNama = identitas.namaKepalaSekolah || 'Yulius Foni, S.Pd';
  doc.text(kepsekNama, leftX, currentY);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${identitas.nipKepalaSekolah || '19750812 200212 1 004'}`, leftX, currentY + 4);

  // Nama & NIP Kanan
  doc.setFont('times', 'bold');
  const guruNama = identitas.namaGuru || 'Yohanes Pantola, S.Pd.SD';
  doc.text(guruNama, rightX, currentY);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${identitas.nipGuru || '19880415 201101 1 007'}`, rightX, currentY + 4);

  // Download PDF
  const filename = `Laporan_Analisis_Rapor_${settings.mataPelajaran}_${settings.kelas}_${settings.semester}.pdf`.replace(
    /\s+/g,
    '_'
  );
  doc.save(filename);
}

/**
 * =====================================================================
 * LAPORAN ANALISIS RAPOR PER MURID UNTUK KESELURUHAN MATA PELAJARAN
 * Format Resmi Lembar Rapor Hasil Belajar Siswa (Kurikulum Merdeka)
 * =====================================================================
 */

export interface StudentAllSubjectsReportItem {
  mataPelajaran: string;
  nilaiFormatif: number;
  nilaiSTS: number;
  nilaiSAS: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  keteranganKKTP: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  capaianTertinggi: string;
  capaianPerluBimbingan: string;
  totalSubmissions: number;
}

export interface StudentAllSubjectsReport {
  student: StudentInfo;
  semester: 'Semester 1' | 'Semester 2';
  kelas: string;
  tahunPelajaran: string;
  kktpThreshold: number;
  subjectItems: StudentAllSubjectsReportItem[];
  rataRataNilaiAkhir: number;
  totalMataPelajaran: number;
  jumlahTuntas: number;
  jumlahBelumTuntas: number;
  predikatUmum: 'A' | 'B' | 'C' | 'D';
}

/**
 * Daftar Mata Pelajaran Wajib Kurikulum Merdeka Sekolah Dasar
 */
export const KURIKULUM_MERDEKA_STANDARD_SUBJECTS: string[] = [
  'Pendidikan Agama Katolik & Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS (Ilmu Pengetahuan Alam & Sosial)',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Seni Budaya',
  'Bahasa Inggris',
  'Muatan Lokal / Khas Daerah',
];

/**
 * Menghitung rekapitulasi nilai rapor untuk 1 murid tertentu mencakup seluruh mata pelajaran
 */
export function computeStudentAllSubjectsReport(
  student: StudentInfo,
  submissions: ExamSubmission[],
  packages: ExamPackage[],
  settings: RaporSettings
): StudentAllSubjectsReport {
  const { semester, kelas, tahunPelajaran, kktpThreshold = 75, bobotFormatif = 50, bobotSTS = 25, bobotSAS = 25 } = settings;
  const totalBobot = (bobotFormatif + bobotSTS + bobotSAS) || 100;

  // Filter semua submission milik murid ini
  const stuSubs = submissions.filter((sub) => {
    const nisnMatch =
      (sub.nisn && sub.nisn === student.nisn) ||
      ((sub as any).siswaNisn && (sub as any).siswaNisn === student.nisn);
    const namaMatch =
      (sub.namaSiswa && sub.namaSiswa.trim().toLowerCase() === student.nama.trim().toLowerCase()) ||
      ((sub as any).siswaNama &&
        (sub as any).siswaNama.trim().toLowerCase() === student.nama.trim().toLowerCase());
    return nisnMatch || namaMatch;
  });

  // Himpun seluruh mata pelajaran yang ada di paket soal / submission + standar kurikulum
  const subjectSet = new Set<string>();
  KURIKULUM_MERDEKA_STANDARD_SUBJECTS.forEach((m) => subjectSet.add(m));
  packages.forEach((p) => {
    if (p.mataPelajaran && p.mataPelajaran !== 'Semua Mata Pelajaran') {
      subjectSet.add(p.mataPelajaran.trim());
    }
  });
  stuSubs.forEach((s) => {
    if (s.mataPelajaran && s.mataPelajaran !== 'Semua Mata Pelajaran') {
      subjectSet.add(s.mataPelajaran.trim());
    }
  });

  const subjectList = Array.from(subjectSet);

  const subjectItems: StudentAllSubjectsReportItem[] = subjectList.map((mapel) => {
    const mapelClean = mapel.toLowerCase().trim();
    const mapelSubs = stuSubs.filter(
      (s) => s.mataPelajaran && s.mataPelajaran.toLowerCase().trim() === mapelClean
    );

    // Kumpulkan nilai formatif, STS, SAS
    const formatifSubs = mapelSubs.filter((s) => {
      const j = String(s.jenisAsesmen || '').toLowerCase();
      return j.includes('formatif') || j.includes('harian') || j.includes('latihan') || j.includes('bab') || j.includes('tp');
    });
    const stsSubs = mapelSubs.filter((s) => {
      const j = String(s.jenisAsesmen || '').toLowerCase();
      return j.includes('sts') || j.includes('tengah');
    });
    const sasSubs = mapelSubs.filter((s) => {
      const j = String(s.jenisAsesmen || '').toLowerCase();
      return j.includes('sas') || j.includes('akhir') || j.includes('semester');
    });

    // Hitung rata-rata nilai
    const avgFrom = (list: ExamSubmission[]) =>
      list.length > 0
        ? Math.round(list.reduce((acc, c) => acc + (c.nilaiAkhir || 0), 0) / list.length)
        : 0;

    let nilaiFormatif = avgFrom(formatifSubs);
    let nilaiSTS = avgFrom(stsSubs);
    let nilaiSAS = avgFrom(sasSubs);

    // Jika murid mengerjakan paket namun jenis asesmen umum, hitung dari seluruh mapelSubs
    if (mapelSubs.length > 0) {
      const avgAll = avgFrom(mapelSubs);
      if (nilaiFormatif === 0) nilaiFormatif = avgAll;
      if (nilaiSTS === 0) nilaiSTS = avgAll;
      if (nilaiSAS === 0) nilaiSAS = avgAll;
    }

    // Muat override guru jika ada
    const overrides = loadRaporOverrides(mapel, semester);
    const stuOverride = overrides[student.id] || overrides[student.nisn];

    if (stuOverride) {
      if (stuOverride.nilaiFormatif !== undefined) nilaiFormatif = stuOverride.nilaiFormatif;
      if (stuOverride.nilaiSTS !== undefined) nilaiSTS = stuOverride.nilaiSTS;
      if (stuOverride.nilaiSAS !== undefined) nilaiSAS = stuOverride.nilaiSAS;
    }

    let nilaiAkhir = 0;
    if (nilaiFormatif > 0 || nilaiSTS > 0 || nilaiSAS > 0) {
      nilaiAkhir = Math.round(
        (nilaiFormatif * bobotFormatif + nilaiSTS * bobotSTS + nilaiSAS * bobotSAS) / totalBobot
      );
    }
    if (stuOverride && stuOverride.nilaiAkhir !== undefined) {
      nilaiAkhir = stuOverride.nilaiAkhir;
    }

    let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
    let keteranganKKTP: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Perlu Bimbingan';

    if (nilaiAkhir >= 90) {
      predikat = 'A';
      keteranganKKTP = 'Sangat Baik';
    } else if (nilaiAkhir >= 80) {
      predikat = 'B';
      keteranganKKTP = 'Baik';
    } else if (nilaiAkhir >= kktpThreshold) {
      predikat = 'C';
      keteranganKKTP = 'Cukup';
    } else {
      predikat = 'D';
      keteranganKKTP = 'Perlu Bimbingan';
    }

    // Narasi Kurikulum Merdeka
    let capaianTertinggi = stuOverride?.capaianTertinggi || '';
    let capaianPerluBimbingan = stuOverride?.capaianPerluBimbingan || '';

    if (!capaianTertinggi || !capaianPerluBimbingan) {
      if (nilaiAkhir >= 85) {
        capaianTertinggi = `Menunjukkan penguasaan yang sangat baik dalam memahami konsep pokok dan penerapan materi ${mapel}.`;
        capaianPerluBimbingan = 'Mampu mempertahankan konsistensi penguasaan capaian pembelajaran dengan sangat baik.';
      } else if (nilaiAkhir >= kktpThreshold) {
        capaianTertinggi = `Menunjukkan pemahaman yang baik dalam capaian kompetensi materi pokok ${mapel}.`;
        capaianPerluBimbingan = `Perlu sedikit pendalaman latihan mandiri pada pemecahan soal analitis ${mapel}.`;
      } else if (nilaiAkhir > 0) {
        capaianTertinggi = `Menunjukkan usaha dan perkembangan pemahaman dalam materi dasar ${mapel}.`;
        capaianPerluBimbingan = `Perlu bimbingan intensif dan pengulangan remedial untuk materi esensial ${mapel}.`;
      } else {
        capaianTertinggi = `Belum ada riwayat asesmen CBT yang terekam pada mata pelajaran ${mapel}.`;
        capaianPerluBimbingan = 'Perlu mengikuti jadwal asesmen formatif dan sumatif berkala.';
      }
    }

    return {
      mataPelajaran: mapel,
      nilaiFormatif,
      nilaiSTS,
      nilaiSAS,
      nilaiAkhir,
      predikat,
      keteranganKKTP,
      capaianTertinggi,
      capaianPerluBimbingan,
      totalSubmissions: mapelSubs.length,
    };
  });

  const activeSubjects = subjectItems.filter((s) => s.nilaiAkhir > 0);
  const totalNA = activeSubjects.reduce((acc, c) => acc + c.nilaiAkhir, 0);
  const rataRataNilaiAkhir = activeSubjects.length > 0 ? Math.round((totalNA / activeSubjects.length) * 10) / 10 : 0;
  const jumlahTuntas = subjectItems.filter((s) => s.nilaiAkhir >= kktpThreshold).length;
  const jumlahBelumTuntas = subjectItems.filter((s) => s.nilaiAkhir > 0 && s.nilaiAkhir < kktpThreshold).length;

  let predikatUmum: 'A' | 'B' | 'C' | 'D' = 'D';
  if (rataRataNilaiAkhir >= 90) predikatUmum = 'A';
  else if (rataRataNilaiAkhir >= 80) predikatUmum = 'B';
  else if (rataRataNilaiAkhir >= kktpThreshold) predikatUmum = 'C';

  return {
    student,
    semester,
    kelas,
    tahunPelajaran,
    kktpThreshold,
    subjectItems,
    rataRataNilaiAkhir,
    totalMataPelajaran: subjectItems.length,
    jumlahTuntas,
    jumlahBelumTuntas,
    predikatUmum,
  };
}

/**
 * Menghasilkan Dokumen Cetak Rapor Murid Perorangan (Seluruh Mata Pelajaran)
 * Sesuai Standar Format Lembar Rapor Hasil Belajar Peserta Didik (Kurikulum Merdeka)
 * Lengkap dengan Identitas Siswa, Tabel Nilai Seluruh Mapel, Deskripsi Capaian Kompetensi,
 * Catatan Akademik Wali Kelas, dan Tanda Tangan Orang Tua / Wali Siswa, Guru, & Kepala Sekolah.
 */
export function generateIndividualStudentRaporPDF(options: {
  identitas: SchoolIdentity;
  settings: RaporSettings;
  report: StudentAllSubjectsReport;
}): void {
  const { identitas, settings, report } = options;
  const { student, subjectItems, rataRataNilaiAkhir, kktpThreshold, jumlahTuntas, jumlahBelumTuntas, predikatUmum } = report;

  // Format Portrait A4 Resmi Buku Rapor Siswa
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  let currentY = 12;

  // ================= 1. KOP SURAT RESMI LEMBAR RAPOR =================
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      doc.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', marginX + 3, 10, 18, 18);
    } catch (e) {
      console.warn('Gagal memuat logo sekolah:', e);
    }
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('PEMERINTAH KABUPATEN TIMOR TENGAH UTARA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(13);
  const schoolName = (identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.3;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  const alamat = identitas.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - TTU';
  doc.text(`Alamat: ${alamat} • NPSN: 50304381`, pageWidth / 2, currentY, {
    align: 'center',
  });
  currentY += 3.5;

  doc.setFont('times', 'italic');
  doc.text(
    'Sistem Informasi Pembelajaran & Asesmen Terpadu (SIPARTAN) • Laporan Hasil Belajar Siswa',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 3;

  // Garis Ganda Kop
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 1.1;
  doc.setLineWidth(0.25);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // ================= 2. JUDUL LEMBAR RAPOR =================
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(
    'LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR SISWA)',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 4.2;

  doc.setFontSize(8.5);
  doc.setFont('times', 'italic');
  doc.text(
    'Rekapitulasi Capaian Pembelajaran & Nilai Akhir Seluruh Mata Pelajaran Kurikulum Merdeka',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 5;

  // ================= 3. IDENTITAS PESERTA DIDIK & SEKOLAH =================
  const semesterStr = settings.semester || 'Semester 1';
  const kelasStr = `Kelas ${identitas.kelas || 'VI'} (${identitas.fase || 'Fase C'})`;
  const thnAjaran = settings.tahunPelajaran || '2026/2027';

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 0.9, textColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 3 },
      2: { cellWidth: 62 },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 3 },
      5: { cellWidth: 48 },
    },
    body: [
      [
        'Nama Peserta Didik',
        ':',
        student.nama.toUpperCase(),
        'Kelas / Fase',
        ':',
        kelasStr,
      ],
      [
        'Nomor Induk Siswa (NIS)',
        ':',
        student.nis || '-',
        'Semester',
        ':',
        semesterStr,
      ],
      [
        'NISN',
        ':',
        student.nisn || '-',
        'Tahun Pelajaran',
        ':',
        thnAjaran,
      ],
      [
        'Satuan Pendidikan',
        ':',
        identitas.namaSatuanPendidikan || 'SD Negeri Fatubai',
        'Kriteria Ketuntasan',
        ':',
        `KKTP \u2265 ${kktpThreshold}`,
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // ================= 4. TABEL REKAPITULASI RAPOR SELURUH MATA PELAJARAN =================
  const tableHead = [
    [
      { content: 'No', styles: { halign: 'center' as const } },
      { content: 'Mata Pelajaran', styles: { halign: 'left' as const } },
      { content: 'Formatif', styles: { halign: 'center' as const } },
      { content: 'STS', styles: { halign: 'center' as const } },
      { content: 'SAS', styles: { halign: 'center' as const } },
      { content: 'Nilai Akhir', styles: { halign: 'center' as const } },
      { content: 'Predikat', styles: { halign: 'center' as const } },
      { content: 'Capaian Kompetensi (Deskripsi Rapor)', styles: { halign: 'left' as const } },
    ],
  ];

  const tableBody = subjectItems.map((item, idx) => {
    const naStr = item.nilaiAkhir > 0 ? `${item.nilaiAkhir}` : '-';
    const predikatStr = item.nilaiAkhir > 0 ? `${item.predikat}` : '-';
    const desc = item.nilaiAkhir > 0
      ? `• ${item.capaianTertinggi}\n• ${item.capaianPerluBimbingan}`
      : 'Belum ada evaluasi nilai yang terekam untuk semester ini.';

    return [
      `${idx + 1}`,
      item.mataPelajaran,
      item.nilaiFormatif > 0 ? `${item.nilaiFormatif}` : '-',
      item.nilaiSTS > 0 ? `${item.nilaiSTS}` : '-',
      item.nilaiSAS > 0 ? `${item.nilaiSAS}` : '-',
      naStr,
      predikatStr,
      desc,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    head: tableHead as any,
    body: tableBody,
    styles: {
      font: 'times',
      fontSize: 8,
      cellPadding: 1.6,
      textColor: [20, 20, 20],
      lineColor: [180, 180, 180],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [24, 43, 73],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 77, fontSize: 7.2, cellPadding: 1.4 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = Number(data.cell.raw);
        if (val > 0 && val < kktpThreshold) {
          data.cell.styles.textColor = [200, 30, 30];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // ================= 5. RANGKUMAN PRESTASI & STATISTIK SISWA =================
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('RANGKUMAN PRESTASI & STATUS KETUNTASAN SISWA:', marginX, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: { font: 'times', fontSize: 8, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [40, 60, 95], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [
      [
        'Total Mata Pelajaran',
        'Rata-rata Nilai Akhir',
        'Predikat Prestasi Umum',
        'Jumlah Mapel Tuntas',
        'Jumlah Mapel Remedial',
        'Status Ketuntasan Belajar',
      ],
    ],
    body: [
      [
        `${subjectItems.length} Mata Pelajaran`,
        `${rataRataNilaiAkhir}`,
        `${predikatUmum}`,
        `${jumlahTuntas} Mapel`,
        `${jumlahBelumTuntas} Mapel`,
        jumlahBelumTuntas === 0 && jumlahTuntas > 0 ? 'TUNTAS SELURUH MAPEL' : 'MEMERLUKAN REMEDIAL',
      ],
    ],
    bodyStyles: { fontStyle: 'bold', textColor: [20, 20, 20] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Catatan Akademik & Karakter Profil Pelajar Pancasila
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    body: [
      [
        {
          content: `CATATAN GURU KELAS / WALI KELAS:\nAnanda ${student.nama} menunjukkan budi pekerti yang santun, kepedulian sosial yang tinggi, dan dedikasi belajar yang patut diapresiasi. Tingkatkan terus kedisiplinan dan literasi numerasi di semester mendatang!`,
          styles: { fontStyle: 'italic', textColor: [30, 30, 30] },
        },
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ================= 6. TITIMANGSA TANDA TANGAN RESMI TIGA PIHAK =================
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 15;
  }

  const signColWidth = (pageWidth - marginX * 2) / 3;
  const col1X = marginX;
  const col2X = marginX + signColWidth;
  const col3X = marginX + signColWidth * 2;

  const kota = identitas.kabupaten || 'Fatubai';
  const tglStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);

  // Kolom 1: Orang Tua / Wali
  doc.text('Mengetahui,', col1X + 4, currentY);
  doc.text('Orang Tua / Wali Peserta Didik,', col1X + 4, currentY + 4.5);

  // Kolom 2: Guru Kelas
  doc.text(`${kota}, ${tglStr}`, col2X + 4, currentY);
  doc.text('Guru Kelas VI Pengampu,', col2X + 4, currentY + 4.5);

  // Kolom 3: Kepala Sekolah
  doc.text('Mengetahui,', col3X + 4, currentY);
  doc.text('Kepala Satuan Pendidikan,', col3X + 4, currentY + 4.5);

  const signGap = 17;
  currentY += signGap + 8;

  // Garis tanda tangan ortu
  doc.line(col1X + 4, currentY, col1X + signColWidth - 10, currentY);
  doc.setFontSize(7.5);
  doc.text('( .................................................. )', col1X + 4, currentY + 3.5);

  // Guru Kelas
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  const guruNama = identitas.namaGuru || 'Yohanes Pantola, S.Pd.SD';
  doc.text(guruNama, col2X + 4, currentY);
  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${identitas.nipGuru || '19880415 201101 1 007'}`, col2X + 4, currentY + 3.5);

  // Kepala Sekolah
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  const kepsekNama = identitas.namaKepalaSekolah || 'Yulius Foni, S.Pd';
  doc.text(kepsekNama, col3X + 4, currentY);
  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${identitas.nipKepalaSekolah || '19750812 200212 1 004'}`, col3X + 4, currentY + 3.5);

  // Download PDF
  const cleanName = student.nama.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Rapor_Lengkap_${cleanName}_Semua_Mapel_${settings.kelas}_${settings.semester}.pdf`.replace(
    /\s+/g,
    '_'
  );
  doc.save(filename);
}

