export interface DimensiProfilLulusanInfo {
  nama: string;
  definisi: string;
  lengkap: string;
}

/**
 * 8 Dimensi Profil Lulusan resmi:
 * 1. Keimanan dan Ketakwaan terhadap Tuhan YME
 * 2. Kewargaan
 * 3. Penalaran Kritis
 * 4. Kreativitas
 * 5. Kolaborasi
 * 6. Kemandirian
 * 7. Kesehatan
 * 8. Komunikasi
 */
export const DELAPAN_DIMENSI_PROFIL_LULUSAN: DimensiProfilLulusanInfo[] = [
  {
    nama: 'Keimanan dan Ketakwaan terhadap Tuhan YME',
    definisi: 'Memiliki keyakinan teguh, akhlak mulia, serta mengamalkan nilai spiritual dalam keseharian.',
    lengkap: 'Keimanan dan Ketakwaan terhadap Tuhan YME: Memiliki keyakinan teguh, akhlak mulia, serta mengamalkan nilai spiritual dalam keseharian.',
  },
  {
    nama: 'Kewargaan',
    definisi: 'Memiliki rasa cinta tanah air, menghargai keberagaman, menaati aturan sosial, serta peduli pada lingkungan sekitar.',
    lengkap: 'Kewargaan: Memiliki rasa cinta tanah air, menghargai keberagaman, menaati aturan sosial, serta peduli pada lingkungan sekitar.',
  },
  {
    nama: 'Penalaran Kritis',
    definisi: 'Mampu memproses informasi, menganalisis masalah secara analitis, serta mencari solusi yang logis.',
    lengkap: 'Penalaran Kritis: Mampu memproses informasi, menganalisis masalah secara analitis, serta mencari solusi yang logis.',
  },
  {
    nama: 'Kreativitas',
    definisi: 'Berani mengeksplorasi ide baru dan menciptakan sesuatu yang orisinal serta bermanfaat.',
    lengkap: 'Kreativitas: Berani mengeksplorasi ide baru dan menciptakan sesuatu yang orisinal serta bermanfaat.',
  },
  {
    nama: 'Kolaborasi',
    definisi: 'Mampu bekerja sama secara efektif dan bergotong royong untuk mencapai tujuan bersama.',
    lengkap: 'Kolaborasi: Mampu bekerja sama secara efektif dan bergotong royong untuk mencapai tujuan bersama.',
  },
  {
    nama: 'Kemandirian',
    definisi: 'Bertanggung jawab atas proses dan hasil belajar sendiri tanpa bergantung pada orang lain.',
    lengkap: 'Kemandirian: Bertanggung jawab atas proses dan hasil belajar sendiri tanpa bergantung pada orang lain.',
  },
  {
    nama: 'Kesehatan',
    definisi: 'Memiliki fisik yang bugar serta menjaga keseimbangan kesehatan mental dan fisik (well-being).',
    lengkap: 'Kesehatan: Memiliki fisik yang bugar serta menjaga keseimbangan kesehatan mental dan fisik (well-being).',
  },
  {
    nama: 'Komunikasi',
    definisi: 'Mampu menyampaikan pendapat dengan santun, mendengarkan orang lain, serta berkomunikasi secara efektif.',
    lengkap: 'Komunikasi: Mampu menyampaikan pendapat dengan santun, mendengarkan orang lain, serta berkomunikasi secara efektif.',
  },
];

export const DAFTAR_NAMA_DIMENSI_PROFIL_LULUSAN: string[] = DELAPAN_DIMENSI_PROFIL_LULUSAN.map((d) => d.nama);

/**
 * Pemetaan cerdas dari penamaan lama ke 8 Dimensi Profil Lulusan resmi
 */
export function normalizeDimensiProfilLulusan(dimensi: string): string {
  if (!dimensi) return 'Penalaran Kritis';
  const d = dimensi.trim();

  // Pencocokan langsung
  const exact = DAFTAR_NAMA_DIMENSI_PROFIL_LULUSAN.find(
    (n) => n.toLowerCase() === d.toLowerCase()
  );
  if (exact) return exact;

  const lower = d.toLowerCase();
  if (
    lower.includes('iman') ||
    lower.includes('takwa') ||
    lower.includes('tuhan') ||
    lower.includes('akhlak')
  ) {
    return 'Keimanan dan Ketakwaan terhadap Tuhan YME';
  }
  if (
    lower.includes('kewargaan') ||
    lower.includes('kebinekaan') ||
    lower.includes('kebhinekaan') ||
    lower.includes('cinta tanah air')
  ) {
    return 'Kewargaan';
  }
  if (
    lower.includes('kritis') ||
    lower.includes('penalaran') ||
    lower.includes('nalar')
  ) {
    return 'Penalaran Kritis';
  }
  if (
    lower.includes('kreativ') ||
    lower.includes('inovatif') ||
    lower.includes('kreatif')
  ) {
    return 'Kreativitas';
  }
  if (
    lower.includes('gotong') ||
    lower.includes('royong') ||
    lower.includes('kolaborasi') ||
    lower.includes('kerja sama')
  ) {
    return 'Kolaborasi';
  }
  if (
    lower.includes('mandiri') ||
    lower.includes('kemandirian')
  ) {
    return 'Kemandirian';
  }
  if (
    lower.includes('sehat') ||
    lower.includes('kebugaran') ||
    lower.includes('jasmani') ||
    lower.includes('well-being')
  ) {
    return 'Kesehatan';
  }
  if (
    lower.includes('komunikasi') ||
    lower.includes('bicara') ||
    lower.includes('pendapat')
  ) {
    return 'Komunikasi';
  }

  return d;
}

/**
 * Menormalkan array dimensi agar selalu mengacu ke 8 Dimensi Profil Lulusan (minimal 3)
 */
export function normalizeDPLArray(arr?: (string | undefined | null)[]): string[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return ['Penalaran Kritis', 'Kemandirian', 'Kolaborasi'];
  }
  const result: string[] = [];
  arr.forEach((item) => {
    if (!item) return;
    const normalized = normalizeDimensiProfilLulusan(item);
    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  });

  const fallback = ['Penalaran Kritis', 'Kemandirian', 'Kolaborasi'];
  for (const f of fallback) {
    if (result.length < 3 && !result.includes(f)) {
      result.push(f);
    }
  }

  return result;
}
