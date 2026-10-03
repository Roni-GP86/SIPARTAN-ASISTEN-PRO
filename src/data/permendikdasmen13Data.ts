// Data Struktur dan Alokasi Waktu Pembelajaran Resmi Jenjang SD (Seluruh Fase A, B, C)
// Berdasarkan PERATURAN MENTERI PENDIDIKAN DASAR DAN MENENGAH NOMOR 13 TAHUN 2025
// (Perubahan atas Permendikbudristek No. 12 Tahun 2024)
// Asumsi: 1 JP SD = 35 Menit
// Asumsi Minggu Efektif: Kelas I - V = 36 Minggu/Tahun; Kelas VI = 32 Minggu/Tahun

export interface SubjectAllocationItem {
  mataPelajaran: string;
  jpMingguIntra: number;
  jpTahunIntra: number;
  jpMingguKoku?: number;
  jpTahunKoku?: number;
  totalJPTahun: number;
  kategori: 'wajib' | 'pilihan' | 'mulok';
  keterangan?: string;
}

export interface LevelAllocationStructure {
  kelas: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  asumsiMingguTahun: number;
  asumsiMingguSemester: number;
  durasiMenitPerJP: number;
  daftarMapel: SubjectAllocationItem[];
  totalWajibIntra: number;
  totalWajibKoku: number;
  totalWajibSemua: number;
  catatanRegulasi: string;
}

// 1. FASE A - KELAS I (Tabel 1 Permendikdasmen 13/2025)
// Asumsi 1 Tahun = 36 minggu, 1 JP = 35 menit
export const ALOKASI_KELAS_1: LevelAllocationStructure = {
  kelas: '1',
  fase: 'Fase A',
  asumsiMingguTahun: 36,
  asumsiMingguSemester: 18,
  durasiMenitPerJP: 35,
  catatanRegulasi: 'Permendikdasmen No. 13 Tahun 2025 Lampiran II Tabel 1',
  daftarMapel: [
    {
      mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Pancasila',
      jpMingguIntra: 4,
      jpTahunIntra: 144,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 180,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Indonesia',
      jpMingguIntra: 7,
      jpTahunIntra: 252,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 288,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Matematika',
      jpMingguIntra: 4,
      jpTahunIntra: 144,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 180,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Jasmani Olahraga dan Kesehatan',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Muatan Lokal',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'mulok',
      keterangan: 'Maksimal 2 JP per minggu (72 JP/tahun)',
    },
  ],
  totalWajibIntra: 864, // 24 JP/minggu
  totalWajibKoku: 216,  // 6 JP/minggu
  totalWajibSemua: 1080,
};

// 2. FASE A - KELAS II (Tabel 2 Permendikdasmen 13/2025)
// Asumsi 1 Tahun = 36 minggu, 1 JP = 35 menit
export const ALOKASI_KELAS_2: LevelAllocationStructure = {
  kelas: '2',
  fase: 'Fase A',
  asumsiMingguTahun: 36,
  asumsiMingguSemester: 18,
  durasiMenitPerJP: 35,
  catatanRegulasi: 'Permendikdasmen No. 13 Tahun 2025 Lampiran II Tabel 2',
  daftarMapel: [
    {
      mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Pancasila',
      jpMingguIntra: 4,
      jpTahunIntra: 144,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 180,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Indonesia',
      jpMingguIntra: 8,
      jpTahunIntra: 288,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 324,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Matematika',
      jpMingguIntra: 5,
      jpTahunIntra: 180,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 216,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Jasmani Olahraga dan Kesehatan',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Muatan Lokal',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'mulok',
      keterangan: 'Maksimal 2 JP per minggu (72 JP/tahun)',
    },
  ],
  totalWajibIntra: 936, // 26 JP/minggu
  totalWajibKoku: 216,  // 6 JP/minggu
  totalWajibSemua: 1152,
};

// 3. FASE B - KELAS III & IV (Tabel 3 Permendikdasmen 13/2025)
// Asumsi 1 Tahun = 36 minggu, 1 JP = 35 menit
export const ALOKASI_KELAS_3_4: LevelAllocationStructure = {
  kelas: '3 & 4',
  fase: 'Fase B',
  asumsiMingguTahun: 36,
  asumsiMingguSemester: 18,
  durasiMenitPerJP: 35,
  catatanRegulasi: 'Permendikdasmen No. 13 Tahun 2025 Lampiran II Tabel 3',
  daftarMapel: [
    {
      mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Pancasila',
      jpMingguIntra: 4,
      jpTahunIntra: 144,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 180,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Indonesia',
      jpMingguIntra: 6,
      jpTahunIntra: 216,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 252,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Matematika',
      jpMingguIntra: 5,
      jpTahunIntra: 180,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 216,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      jpMingguIntra: 5,
      jpTahunIntra: 180,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 216,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Jasmani Olahraga dan Kesehatan',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Inggris',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'wajib',
      keterangan: 'Mata pelajaran wajib SD tanpa alokasi kokurikuler',
    },
    {
      mataPelajaran: 'Muatan Lokal',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'mulok',
      keterangan: 'Paling banyak 2 JP per minggu (72 JP/tahun)',
    },
  ],
  totalWajibIntra: 1116, // 31 JP/minggu
  totalWajibKoku: 252,   // 7 JP/minggu
  totalWajibSemua: 1368,
};

// 4. FASE C - KELAS V (Tabel 4 Permendikdasmen 13/2025)
// Asumsi 1 Tahun = 36 minggu, 1 JP = 35 menit
// Termasuk mata pelajaran pilihan baru: Koding dan Kecerdasan Artifisial
export const ALOKASI_KELAS_5: LevelAllocationStructure = {
  kelas: '5',
  fase: 'Fase C',
  asumsiMingguTahun: 36,
  asumsiMingguSemester: 18,
  durasiMenitPerJP: 35,
  catatanRegulasi: 'Permendikdasmen No. 13 Tahun 2025 Lampiran II Tabel 4',
  daftarMapel: [
    {
      mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Pancasila',
      jpMingguIntra: 4,
      jpTahunIntra: 144,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 180,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Indonesia',
      jpMingguIntra: 6,
      jpTahunIntra: 216,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 252,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Matematika',
      jpMingguIntra: 5,
      jpTahunIntra: 180,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 216,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      jpMingguIntra: 5,
      jpTahunIntra: 180,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 216,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Jasmani Olahraga dan Kesehatan',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)',
      jpMingguIntra: 3,
      jpTahunIntra: 108,
      jpMingguKoku: 1,
      jpTahunKoku: 36,
      totalJPTahun: 144,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Inggris',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Koding dan Kecerdasan Artifisial',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'pilihan',
      keterangan: 'Mata pelajaran pilihan baru Permendikdasmen 13/2025 Pasal 32A',
    },
    {
      mataPelajaran: 'Muatan Lokal',
      jpMingguIntra: 2,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      kategori: 'mulok',
      keterangan: 'Paling banyak 2 JP per minggu (72 JP/tahun)',
    },
  ],
  totalWajibIntra: 1116, // 31 JP/minggu
  totalWajibKoku: 252,   // 7 JP/minggu
  totalWajibSemua: 1368,
};

// 5. FASE C - KELAS VI (Tabel 5 Permendikdasmen 13/2025)
// Asumsi 1 Tahun = 32 minggu, 1 JP = 35 menit (Khusus kelas VI 32 minggu!)
export const ALOKASI_KELAS_6: LevelAllocationStructure = {
  kelas: '6',
  fase: 'Fase C',
  asumsiMingguTahun: 32,
  asumsiMingguSemester: 16,
  durasiMenitPerJP: 35,
  catatanRegulasi: 'Permendikdasmen No. 13 Tahun 2025 Lampiran II Tabel 5 (Asumsi 32 Minggu Efektif)',
  daftarMapel: [
    {
      mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 96,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 128,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
      jpMingguIntra: 3,
      jpTahunIntra: 96,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 128,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Pancasila',
      jpMingguIntra: 4,
      jpTahunIntra: 128,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 160,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Indonesia',
      jpMingguIntra: 6,
      jpTahunIntra: 192,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 224,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Matematika',
      jpMingguIntra: 5,
      jpTahunIntra: 160,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 192,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      jpMingguIntra: 5,
      jpTahunIntra: 160,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 192,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Pendidikan Jasmani Olahraga dan Kesehatan',
      jpMingguIntra: 3,
      jpTahunIntra: 96,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 128,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Seni dan Budaya (Rupa/Musik/Teater/Tari)',
      jpMingguIntra: 3,
      jpTahunIntra: 96,
      jpMingguKoku: 1,
      jpTahunKoku: 32,
      totalJPTahun: 128,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Bahasa Inggris',
      jpMingguIntra: 2,
      jpTahunIntra: 64,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 64,
      kategori: 'wajib',
    },
    {
      mataPelajaran: 'Koding dan Kecerdasan Artifisial',
      jpMingguIntra: 2,
      jpTahunIntra: 64,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 64,
      kategori: 'pilihan',
      keterangan: 'Mata pelajaran pilihan baru Permendikdasmen 13/2025 Pasal 32A',
    },
    {
      mataPelajaran: 'Muatan Lokal',
      jpMingguIntra: 2,
      jpTahunIntra: 64,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 64,
      kategori: 'mulok',
      keterangan: 'Paling banyak 2 JP per minggu (64 JP/tahun)',
    },
  ],
  totalWajibIntra: 992, // 31 JP/minggu
  totalWajibKoku: 224,  // 7 JP/minggu
  totalWajibSemua: 1216,
};

/**
 * Normalizes subject names to match statutory names in Permendikdasmen 13/2025
 */
export function normalizeMapelName(rawName: string): string {
  const s = String(rawName || '').toLowerCase().trim();
  if (s.includes('matematika') || s.includes('math') || s.includes('mtk')) return 'Matematika';
  if (s.includes('pancasila') || s.includes('pkn') || s.includes('ppkn') || s.includes('kewarganegaraan')) return 'Pendidikan Pancasila';
  if (s.includes('indonesia') || s.includes('b.indo') || s.includes('b indo')) return 'Bahasa Indonesia';
  if (s.includes('inggris') || s.includes('english') || s.includes('b.ing') || s.includes('b ing')) return 'Bahasa Inggris';
  if (s.includes('ipas') || s.includes('alam dan sosial') || s.includes('ipa') || s.includes('ips') || s.includes('sains'))
    return 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
  if (
    s.includes('agama') ||
    s.includes('pai') ||
    s.includes('pak') ||
    s.includes('budi pekerti') ||
    s.includes('islam') ||
    s.includes('kristen') ||
    s.includes('katolik') ||
    s.includes('hindu') ||
    s.includes('buddha') ||
    s.includes('khonghucu')
  ) {
    if (s.includes('kristen')) return 'Pendidikan Agama Kristen dan Budi Pekerti';
    if (s.includes('katolik')) return 'Pendidikan Agama Katolik dan Budi Pekerti';
    return 'Pendidikan Agama Katolik dan Budi Pekerti';
  }
  if (s.includes('jasmani') || s.includes('pjok') || s.includes('olahraga') || s.includes('penjas') || s.includes('penjaskes'))
    return 'Pendidikan Jasmani Olahraga dan Kesehatan';
  if (
    s.includes('seni') ||
    s.includes('musik') ||
    s.includes('rupa') ||
    s.includes('tari') ||
    s.includes('teater') ||
    s.includes('budaya') ||
    s.includes('sbdp') ||
    s.includes('prakarya')
  )
    return 'Seni dan Budaya (Rupa/Musik/Teater/Tari)';
  if (s.includes('koding') || s.includes('coding') || s.includes('artifisial') || s.includes('ai') || s.includes('kecerdasan buatan') || s.includes('informatika'))
    return 'Koding dan Kecerdasan Artifisial';
  if (s.includes('muatan lokal') || s.includes('mulok') || s.includes('daerah') || s.includes('jawa') || s.includes('sunda') || s.includes('bali'))
    return 'Muatan Lokal';
  return rawName;
}

/**
 * Helper to fetch exact statutory allocation info according to Permendikdasmen No. 13 Tahun 2025
 */
export function getPermen13Allocation(
  rawMapel: string,
  fase: string,
  rawKelas: string,
  rawSemester?: string
): {
  normalizedMapel: string;
  jpMingguIntra: number;
  jpSemesterIntra: number;
  jpTahunIntra: number;
  jpMingguKoku: number;
  jpTahunKoku: number;
  totalJPTahun: number;
  asumsiMingguTahun: number;
  asumsiMingguSemester: number;
  durasiMenitPerJP: number; // 35 menit untuk SD
  catatanRegulasi: string;
  kategori: string;
  isKelasAkhir: boolean;
} {
  const normMapel = normalizeMapelName(rawMapel);
  const kStr = String(rawKelas || '').trim().toLowerCase();
  const fStr = String(fase || '').trim();

  let structure: LevelAllocationStructure = ALOKASI_KELAS_3_4;
  let isKelasAkhir = false;

  // Grade & Phase mapping:
  if (
    kStr === '1' ||
    (kStr.includes('1') && !kStr.includes('2') && !kStr.includes('10') && !kStr.includes('11') && !kStr.includes('12')) ||
    (fStr === 'Fase A' && !kStr.includes('2'))
  ) {
    structure = ALOKASI_KELAS_1;
  } else if (
    kStr === '2' ||
    (kStr.includes('2') && !kStr.includes('12')) ||
    (fStr === 'Fase A' && kStr.includes('2'))
  ) {
    structure = ALOKASI_KELAS_2;
  } else if (
    fStr === 'Fase B' ||
    kStr.includes('3') ||
    kStr.includes('4') ||
    kStr.includes('iii') ||
    kStr.includes('iv')
  ) {
    structure = ALOKASI_KELAS_3_4;
  } else if (
    (kStr === '6' || kStr.includes('6') || kStr.includes('vi')) &&
    !kStr.includes('5') &&
    !kStr.includes('v') &&
    !kStr.includes('lima')
  ) {
    // Specifically Grade 6 alone (Terminal grade with 32 effective weeks)
    structure = ALOKASI_KELAS_6;
    isKelasAkhir = true;
  } else if (
    fStr === 'Fase C' ||
    kStr.includes('5') ||
    kStr.includes('v')
  ) {
    // Grade 5 or General Fase C (36 effective weeks)
    structure = ALOKASI_KELAS_5;
  }

  // Find exact subject in structure
  let match = structure.daftarMapel.find((m) => {
    const s1 = (m.mataPelajaran || '').toLowerCase();
    const s2 = (normMapel || '').toLowerCase();
    return (s1 && s2 && s1.includes(s2)) || (s2 && s1 && s2.includes(s1));
  });

  // Special handling for IPAS in Fase A (IPAS is integrated in Fase A)
  if (!match && normMapel.includes('Ilmu Pengetahuan Alam dan Sosial') && structure.fase === 'Fase A') {
    return {
      normalizedMapel: normMapel,
      jpMingguIntra: 0,
      jpSemesterIntra: 0,
      jpTahunIntra: 0,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 0,
      asumsiMingguTahun: structure.asumsiMingguTahun,
      asumsiMingguSemester: structure.asumsiMingguSemester,
      durasiMenitPerJP: 35,
      catatanRegulasi: 'Pada Fase A (Kelas 1 & 2), muatan IPAS diintegrasikan ke dalam Bahasa Indonesia & Pendidikan Pancasila (Belum berdiri sendiri).',
      kategori: 'wajib',
      isKelasAkhir,
    };
  }

  // Special handling for Bahasa Inggris in Fase A
  if (!match && normMapel === 'Bahasa Inggris' && structure.fase === 'Fase A') {
    return {
      normalizedMapel: 'Bahasa Inggris (Muatan Pilihan/Lokal Fase A)',
      jpMingguIntra: 2,
      jpSemesterIntra: 36,
      jpTahunIntra: 72,
      jpMingguKoku: 0,
      jpTahunKoku: 0,
      totalJPTahun: 72,
      asumsiMingguTahun: structure.asumsiMingguTahun,
      asumsiMingguSemester: structure.asumsiMingguSemester,
      durasiMenitPerJP: 35,
      catatanRegulasi: 'Bahasa Inggris menjadi wajib mulai Fase B (Kelas 3). Di Fase A dapat diajarkan sebagai pilihan/muatan lokal maks 2 JP/minggu.',
      kategori: 'mulok',
      isKelasAkhir,
    };
  }

  const jpMingguIntra = match ? match.jpMingguIntra : 4;
  const jpTahunIntra = match ? match.jpTahunIntra : jpMingguIntra * structure.asumsiMingguTahun;
  const jpMingguKoku = match?.jpMingguKoku ?? 1;
  const jpTahunKoku = match?.jpTahunKoku ?? structure.asumsiMingguTahun;
  const totalJPTahun = match ? match.totalJPTahun : jpTahunIntra + jpTahunKoku;
  const jpSemesterIntra = Math.round(jpTahunIntra / 2);

  return {
    normalizedMapel: match?.mataPelajaran || normMapel,
    jpMingguIntra,
    jpSemesterIntra,
    jpTahunIntra,
    jpMingguKoku,
    jpTahunKoku,
    totalJPTahun,
    asumsiMingguTahun: structure.asumsiMingguTahun,
    asumsiMingguSemester: structure.asumsiMingguSemester,
    durasiMenitPerJP: 35,
    catatanRegulasi: structure.catatanRegulasi,
    kategori: match?.kategori || 'wajib',
    isKelasAkhir,
  };
}

/**
 * Calibrates the JP allocation across an array of TPs or ATP items
 * so that the total sum strictly equals the target statutory JP from Permendikdasmen No. 13 Tahun 2025.
 */
export function calibrateTPAllocationJP<T extends { alokasiJP?: number }>(
  items: T[],
  targetJP: number
): void {
  if (!items || items.length === 0 || targetJP <= 0) return;

  const currentSum = items.reduce((sum, item) => sum + Math.max(1, Number(item.alokasiJP) || 1), 0);
  if (currentSum === targetJP) return;

  // Step 1: Scale proportionally
  let allocatedSum = 0;
  items.forEach((item) => {
    const rawVal = Math.max(1, Number(item.alokasiJP) || 1);
    const scaled = Math.max(1, Math.round((rawVal / currentSum) * targetJP));
    item.alokasiJP = scaled;
    allocatedSum += scaled;
  });

  // Step 2: Reconcile any rounding gap to meet targetJP exactly
  let diff = targetJP - allocatedSum;
  let idx = 0;
  while (diff !== 0 && items.length > 0) {
    const step = diff > 0 ? 1 : -1;
    const targetItem = items[idx % items.length];
    if (step < 0 && (targetItem.alokasiJP || 1) <= 2) {
      // Don't reduce below 2 JP if possible
    } else {
      targetItem.alokasiJP = Math.max(1, (targetItem.alokasiJP || 1) + step);
      diff -= step;
    }
    idx++;
    if (idx > items.length * 15) {
      // Emergency fallback
      items[0].alokasiJP = Math.max(1, (items[0].alokasiJP || 1) + diff);
      break;
    }
  }
}

