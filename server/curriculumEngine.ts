// Pedagogical Curriculum Analysis Engine for Kurikulum Merdeka SD/MI (Fase A, B, C)
// Provides reliable, high-fidelity curriculum generation and fallback processing
import { buildPedagogicalMeetingPlan, detectModelType, isSyntaxMatchingModel } from '../src/utils/modelSyntaxEngine';
import { cleanActivityText } from '../src/utils/rpmUtils';
export { buildPedagogicalMeetingPlan, detectModelType, isSyntaxMatchingModel, cleanActivityText };

export interface IdentityParam {
  namaSatuanPendidikan?: string;
  namaGuru?: string;
  nipGuru?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  mataPelajaran?: string;
  fase?: 'Fase A' | 'Fase B' | 'Fase C';
  kelas?: string;
  tahunPelajaran?: string;
  semester?: string;
}

export interface TPItemParam {
  kodeTP: string;
  kompetensi: string;
  lingkupMateri: string;
  rumusanTP: string;
  indikatorKetercapaian: string;
  alokasiJP: number;
  dimensiP3: string[];
  semesterTarget?: string;
  urutanAlur?: number;
}

// Bloom / Cognitive Verbs taxonomy mapped to SD Fases
const FASE_A_VERBS = ['Mengenal', 'Menyebutkan', 'Menunjukkan', 'Mengelompokkan', 'Meniru', 'Menceritakan', 'Mempraktikkan sederhana'];
const FASE_B_VERBS = ['Mengidentifikasi', 'Menjelaskan', 'Mendeskripsikan', 'Membandingkan', 'Menerapkan', 'Membuat simulasi', 'Mendemonstrasikan'];
const FASE_C_VERBS = ['Menganalisis', 'Menyelidiki', 'Mengonstruksi', 'Menyimpulkan', 'Merancang', 'Mengevaluasi', 'Mengomunikasikan'];

export function formatTPWithCode(kodeTP?: string, rumusanTP?: string): string {
  if (!rumusanTP) return '';
  const cleanRumusan = rumusanTP.trim();
  if (!kodeTP || !kodeTP.trim()) return cleanRumusan;

  const cleanCode = kodeTP.trim();
  const escapedCode = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codeAtStartRegex = new RegExp(`^(?:\\[?\\s*${escapedCode}\\s*[\\]\\.:-]?\\s*)+`, 'i');

  if (codeAtStartRegex.test(cleanRumusan)) {
    const stripped = cleanRumusan.replace(codeAtStartRegex, '').trim();
    return `${cleanCode} ${stripped}`;
  }

  const anyCodeRegex = /^(?:TP\s*[\.:-]?\s*)?(?:\[?\s*\d+(?:\.\d+)*\s*[\]\.:-]?\s*)+/i;
  if (anyCodeRegex.test(cleanRumusan)) {
    const stripped = cleanRumusan.replace(anyCodeRegex, '').trim();
    return `${cleanCode} ${stripped}`;
  }

  return `${cleanCode} ${cleanRumusan}`;
}

const DPL_OPTIONS = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
];

/**
 * Statutory intrakurikuler JP per year for SD according to Permendikdasmen No. 13 Tahun 2025.
 * 1 JP = 35 Menit.
 */
export function getStatutoryJP(mapel: string, kelas: string): number {
  const s = String(mapel || '').toLowerCase().trim();
  const k = String(kelas || '').trim();
  const isK6 = k === '6';
  const isK1 = k === '1';
  const isK2 = k === '2';

  if (s.includes('matematika') || s.includes('math') || s.includes('mtk')) {
    return isK6 ? 160 : 180;
  }
  if (s.includes('indonesia') || s.includes('b.indo') || s.includes('b indo')) {
    if (isK1) return 252;
    if (isK2) return 288;
    if (isK6) return 192;
    return 216;
  }
  if (s.includes('ipas') || s.includes('alam dan sosial') || s.includes('ipa') || s.includes('ips') || s.includes('sains')) {
    return isK6 ? 160 : 180;
  }
  if (s.includes('pancasila') || s.includes('pkn') || s.includes('ppkn')) {
    return isK6 ? 128 : 144;
  }
  if (s.includes('agama') || s.includes('budi pekerti')) {
    return isK6 ? 96 : 108;
  }
  if (s.includes('jasmani') || s.includes('pjok') || s.includes('olahraga')) {
    return isK6 ? 96 : 108;
  }
  if (s.includes('seni') || s.includes('budaya') || s.includes('sbdp')) {
    return isK6 ? 96 : 108;
  }
  if (s.includes('inggris') || s.includes('english')) {
    return isK6 ? 64 : 72;
  }
  if (s.includes('koding') || s.includes('coding') || s.includes('artifisial') || s.includes('ai')) {
    return isK6 ? 64 : 72;
  }
  if (s.includes('muatan lokal') || s.includes('mulok') || s.includes('daerah')) {
    return isK6 ? 64 : 72;
  }
  return isK6 ? 160 : 180;
}

/**
 * Calibrates the JP allocation across an array of items so that the sum strictly matches targetJP.
 */
export function calibrateJPList<T extends { alokasiJP?: number }>(items: T[], targetJP: number): void {
  if (!items || items.length === 0 || targetJP <= 0) return;
  const currentSum = items.reduce((sum, item) => sum + Math.max(1, Number(item.alokasiJP) || 1), 0);
  if (currentSum === targetJP) return;

  let allocatedSum = 0;
  items.forEach((item) => {
    const rawVal = Math.max(1, Number(item.alokasiJP) || 1);
    const scaled = Math.max(1, Math.round((rawVal / currentSum) * targetJP));
    item.alokasiJP = scaled;
    allocatedSum += scaled;
  });

  let diff = targetJP - allocatedSum;
  let idx = 0;
  while (diff !== 0 && items.length > 0) {
    const step = diff > 0 ? 1 : -1;
    const targetItem = items[idx % items.length];
    if (step < 0 && (targetItem.alokasiJP || 1) <= 2) {
      // Keep min 2 JP if possible
    } else {
      targetItem.alokasiJP = Math.max(1, (targetItem.alokasiJP || 1) + step);
      diff -= step;
    }
    idx++;
    if (idx > items.length * 15) {
      items[0].alokasiJP = Math.max(1, (items[0].alokasiJP || 1) + diff);
      break;
    }
  }
}

export interface DeconstructedAtomicUnit {
  kompetensi: string;
  lingkupMateri: string;
  rumusanTP: string;
  indikatorKetercapaian: string;
  alokasiJP: number;
}

/**
 * Intelligent pedagogical clause and competency decomposer for Indonesian Kurikulum Merdeka (BSKAP 046/2025).
 * Guarantees strict 1:1 atomic deconstruction without grouping or reducing competencies/contents.
 */
function deconstructCPToAtomicUnits(
  cpText: string,
  elemenName: string,
  fase: string
): DeconstructedAtomicUnit[] {
  if (!cpText || !cpText.trim()) return [];

  const cleanText = cpText
    .replace(/^mampu menerapkan keterampilan proses yang meliputi:\s*/i, '')
    .trim();

  // Step 1: Check known rich curriculum elements for exact gold-standard decomposition
  const lowerCP = cleanText.toLowerCase();
  const lowerElemen = elemenName.toLowerCase();

  // =========================================================================
  // MATEMATIKA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Bilangan Fase A
  if (
    lowerElemen.includes('bilangan') &&
    (lowerCP.includes('sampai 100') || lowerCP.includes('benda-benda konkret yang banyaknya sampai 20') || (fase === 'Fase A' && lowerCP.includes('setengah dan seperempat')))
  ) {
    return [
      {
        kompetensi: 'Memahami Number Sense dan Nilai Tempat Bilangan Cacah s.d. 100',
        lingkupMateri: 'Number sense, membaca, menulis, menentukan nilai tempat (puluhan & satuan) bilangan cacah s.d. 100',
        rumusanTP: 'Peserta didik mampu menunjukkan pemahaman dan intuisi bilangan (number sense), membaca, menulis, serta menentukan nilai tempat bilangan cacah sampai 100 secara tepat.',
        indikatorKetercapaian: 'Dapat membaca lambang bilangan, menulis nama bilangan, serta menguraikan puluhan dan satuan dari bilangan 1 sampai 100.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Membandingkan, Mengurutkan, dan Komposisi-Dekomposisi Bilangan Cacah s.d. 100',
        lingkupMateri: 'Membandingkan, mengurutkan, komposisi (menyusun) dan dekomposisi (mengurai) bilangan cacah s.d. 100',
        rumusanTP: 'Peserta didik mampu membandingkan, mengurutkan, serta melakukan komposisi (menyusun) dan dekomposisi (mengurai) bilangan cacah sampai 100 dengan cermat.',
        indikatorKetercapaian: 'Dapat membandingkan dua bilangan menggunakan istilah lebih banyak/sedikit serta mengurutkan kelompok bilangan dari terkecil/terbesar.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Melakukan Operasi Penjumlahan dan Pengurangan Konkret s.d. 20',
        lingkupMateri: 'Operasi penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan benda-benda konkret',
        rumusanTP: 'Peserta didik mampu melakukan operasi penjumlahan dan pengurangan menggunakan benda-benda konkret yang banyaknya sampai 20 dalam pemecahan masalah sehari-hari.',
        indikatorKetercapaian: 'Dapat menghitung hasil penjumlahan dan pengurangan benda riil atau gambar hingga kuantitas 20 tanpa ragu.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Memahami Pecahan Setengah dan Seperempat',
        lingkupMateri: 'Konsep pecahan sebagai bagian dari keseluruhan (setengah 1/2 dan seperempat 1/4) dari benda riil atau kumpulan benda',
        rumusanTP: 'Peserta didik mampu menunjukkan pemahaman pecahan sebagai bagian dari keseluruhan melalui konteks membagi sebuah benda atau kumpulan benda sama banyak (setengah dan seperempat).',
        indikatorKetercapaian: 'Dapat memperagakan memotong kue/kertas menjadi dua atau empat bagian sama besar dan mengidentifikasi pecahan 1/2 serta 1/4.',
        alokasiJP: 10,
      },
    ];
  }

  // 2. Aljabar Fase A
  if (
    lowerElemen.includes('aljabar') &&
    (lowerCP.includes('makna simbol matematika "="') || lowerCP.includes('pola bukan bilangan') || (fase === 'Fase A' && lowerCP.includes('cacah sampai 20 menggunakan gambar')))
  ) {
    return [
      {
        kompetensi: 'Memahami Makna Simbol Matematika "=" pada Operasi s.d. 20',
        lingkupMateri: 'Makna simbol keseimbangan "=" dalam kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 20 dengan bantuan gambar',
        rumusanTP: 'Peserta didik mampu menunjukkan pemahaman makna simbol matematika "=" dalam suatu kalimat matematika yang terkait dengan penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan gambar.',
        indikatorKetercapaian: 'Dapat menyatakan kesetaraan kuantitas dua kelompok objek bergambar menggunakan tanda "=" secara benar.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Mengenali, Meniru, dan Melanjutkan Pola Bukan Bilangan',
        lingkupMateri: 'Pola berulang non-bilangan (pola warna, bentuk gambar, gerakan, dan bunyi/suara)',
        rumusanTP: 'Peserta didik mampu mengenali, meniru, dan melanjutkan pola bukan bilangan (misalnya gambar, warna, bunyi/suara) secara teratur dan runtut.',
        indikatorKetercapaian: 'Dapat menebak dan melengkapi urutan pola gambar bentuk geometris atau susunan warna yang berulang secara tepat.',
        alokasiJP: 14,
      },
    ];
  }

  // 3. Pengukuran Fase A
  if (
    lowerElemen.includes('pengukuran') &&
    (lowerCP.includes('membandingkan panjang dan berat benda secara langsung') || (fase === 'Fase A' && lowerCP.includes('satuan tidak baku') && !lowerCP.includes('satuan baku')))
  ) {
    return [
      {
        kompetensi: 'Membandingkan Panjang, Berat Benda, dan Durasi Waktu Secara Langsung',
        lingkupMateri: 'Perbandingan langsung panjang (panjang/pendek), berat (berat/ringan), dan durasi waktu (lama/sebentar)',
        rumusanTP: 'Peserta didik mampu membandingkan panjang dan berat benda secara langsung serta membandingkan durasi waktu kegiatan sehari-hari secara logis.',
        indikatorKetercapaian: 'Dapat menyejajarkan dua benda untuk menentukan yang lebih panjang dan memperkirakan aktivitas yang berlangsung lebih lama.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Mengukur dan Mengestimasi Panjang dan Berat dengan Satuan Tidak Baku',
        lingkupMateri: 'Pengukuran dan estimasi panjang dan berat menggunakan satuan tidak baku (jengkal, depa, langkah, klip kertas, kelereng)',
        rumusanTP: 'Peserta didik mampu mengukur dan mengestimasi panjang dan berat benda menggunakan satuan tidak baku secara terampil dan kreatif.',
        indikatorKetercapaian: 'Dapat mengukur panjang meja dengan jengkal tangan dan menimbang berat benda menggunakan gantungan baju dan kelereng.',
        alokasiJP: 14,
      },
    ];
  }

  // 4. Geometri Fase A
  if (
    lowerElemen.includes('geometri') &&
    (lowerCP.includes('segi banyak, lingkaran') || lowerCP.includes('balok, kubus, kerucut, dan bola') || (fase === 'Fase A' && lowerCP.includes('kanan, kiri, depan belakang')))
  ) {
    return [
      {
        kompetensi: 'Mengenal Berbagai Bangun Datar dan Bangun Ruang',
        lingkupMateri: 'Bangun datar (segitiga, segiempat, segi banyak, lingkaran) dan bangun ruang (balok, kubus, kerucut, bola) di sekitar',
        rumusanTP: 'Peserta didik mampu mengenal berbagai bangun datar dan bangun ruang konkret di lingkungan sekitarnya dengan tepat.',
        indikatorKetercapaian: 'Dapat mengelompokkan benda-benda konkret di kelas berdasarkan bentuk bangun datar dan bangun ruangnya.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Melakukan Komposisi dan Dekomposisi Bangun Datar',
        lingkupMateri: 'Penyusunan (komposisi) dan penguraian (dekomposisi) bangun datar (tangram sederhana)',
        rumusanTP: 'Peserta didik mampu melakukan komposisi (penyusunan) dan dekomposisi (penguraian) suatu bangun datar (segitiga, segiempat, dan segi banyak) secara kreatif.',
        indikatorKetercapaian: 'Dapat merangkai beberapa segitiga menjadi bentuk segiempat atau mengurai bangun segiempat menjadi bentuk lain.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menentukan Posisi Relatif Benda',
        lingkupMateri: 'Orientasi spasial dan letak posisi relatif benda (kanan, kiri, depan, belakang, atas, bawah)',
        rumusanTP: 'Peserta didik mampu menentukan dan mendeskripsikan posisi benda terhadap benda lain (kanan, kiri, depan, belakang, bawah, atas) secara cermat.',
        indikatorKetercapaian: 'Dapat meletakkan dan menyebutkan letak posisi buku/alat tulis terhadap benda di sekitarnya dengan tepat.',
        alokasiJP: 10,
      },
    ];
  }

  // 5. Analisis Data dan Peluang Fase A
  if (
    (lowerElemen.includes('data') || lowerElemen.includes('peluang')) &&
    (lowerCP.includes('turus dan piktogram paling banyak 4 kategori') || (fase === 'Fase A' && lowerCP.includes('mengurutkan, menyortir, mengelompokkan')))
  ) {
    return [
      {
        kompetensi: 'Mengurutkan, Menyortir, dan Mengelompokkan Data Banyak Benda',
        lingkupMateri: 'Penyortiran dan pengelompokan benda konkret s.d. 4 kategori berdasarkan warna, bentuk, atau ukuran',
        rumusanTP: 'Peserta didik mampu mengurutkan, menyortir, mengelompokkan, dan membandingkan data dari banyak benda secara teliti.',
        indikatorKetercapaian: 'Dapat mengelompokkan daun, kancing, atau mainan ke dalam wadah sesuai kategori dan menghitung jumlahnya.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menyajikan dan Membaca Data Menggunakan Turus dan Piktogram',
        lingkupMateri: 'Pencatatan data dengan turus dan penyajian piktogram sederhana paling banyak 4 kategori',
        rumusanTP: 'Peserta didik mampu menyajikan data dari banyak benda dengan menggunakan turus dan piktogram paling banyak 4 kategori secara komunikatif.',
        indikatorKetercapaian: 'Dapat membuat garis turus untuk mencatat data kesukaan buah teman sekelas dan menampilkannya dalam tabel piktogram.',
        alokasiJP: 14,
      },
    ];
  }

  // =========================================================================
  // MATEMATIKA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Bilangan Fase B
  if (
    lowerElemen.includes('bilangan') &&
    (lowerCP.includes('sampai 10.000') || lowerCP.includes('operasi bilangan penjumlahan dan pengurangan bilangan cacah sampai 1.000') || (fase === 'Fase B' && lowerCP.includes('pecahan senilai')))
  ) {
    return [
      {
        kompetensi: 'Memahami Number Sense dan Nilai Tempat Cacah s.d. 10.000',
        lingkupMateri: 'Membaca, menulis, membandingkan, mengurutkan, nilai tempat, serta komposisi & dekomposisi bilangan cacah s.d. 10.000',
        rumusanTP: 'Peserta didik mampu memiliki pemahaman intuisi bilangan (number sense), membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, serta melakukan komposisi dan dekomposisi bilangan cacah sampai 10.000.',
        indikatorKetercapaian: 'Dapat menguraikan bilangan ribuan ke dalam nilai tempat ribuan, ratusan, puluhan, dan satuan serta mengurutkannya.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Menyelesaikan Operasi Penjumlahan dan Pengurangan s.d. 1.000',
        lingkupMateri: 'Penjumlahan dan pengurangan bilangan cacah sampai 1.000 dengan teknik menyimpan/meminjam dan soal cerita',
        rumusanTP: 'Peserta didik mampu melakukan dan menyelesaikan masalah operasi penjumlahan dan pengurangan bilangan cacah sampai 1.000 dalam konteks nyata.',
        indikatorKetercapaian: 'Dapat menghitung hasil tambah dan kurang ratusan secara tepat dan memecahkan soal cerita kontekstual.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Menyelesaikan Masalah Perkalian dan Pembagian s.d. 100 serta Faktor & Kelipatan',
        lingkupMateri: 'Perkalian dan pembagian s.d. 100 dengan benda konkret/gambar/simbol serta pengenalan kelipatan dan faktor bilangan',
        rumusanTP: 'Peserta didik mampu melakukan operasi perkalian dan pembagian bilangan cacah sampai 100 serta mengenal konsep kelipatan dan faktor bilangan.',
        indikatorKetercapaian: 'Dapat mengalikan dan membagi bilangan cacah s.d. 100 serta mendaftar faktor dan kelipatan dari suatu bilangan.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Membandingkan, Mengurutkan, dan Pecahan Senilai',
        lingkupMateri: 'Perbandingan dan pengurutan pecahan pembilang satu atau berpenyebut sama, serta konsep pecahan senilai',
        rumusanTP: 'Peserta didik mampu melakukan perbandingan dan pengurutan pecahan berpenyebut sama atau berpembilang satu, serta mengenal dan menerapkan pecahan senilai.',
        indikatorKetercapaian: 'Dapat menentukan pecahan yang lebih besar/kecil dan membuat pecahan senilai dengan mengalikan pembilang dan penyebut.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Memahami Intuisi Desimal dan Persen',
        lingkupMateri: 'Konversi dan representasi pecahan persepuluhan dan perseratusan ke bentuk desimal dan persen',
        rumusanTP: 'Peserta didik mampu memiliki intuisi pecahan dan desimal serta dapat menentukan bentuk pecahan sebagai bilangan desimal dan persen.',
        indikatorKetercapaian: 'Dapat mengubah pecahan berpenyebut 10 dan 100 ke bentuk desimal koma serta lambang persen (%).',
        alokasiJP: 8,
      },
    ];
  }

  // 2. Aljabar Fase B
  if (
    lowerElemen.includes('aljabar') &&
    (lowerCP.includes('menemukan nilai yang tidak diketahui dalam kalimat matematika') || lowerCP.includes('pola bilangan membesar dan mengecil yang dapat melibatkan penjumlahan') || (fase === 'Fase B' && lowerCP.includes('cacah sampai 100')))
  ) {
    return [
      {
        kompetensi: 'Menemukan Nilai yang Tidak Diketahui dalam Kalimat Matematika s.d. 100',
        lingkupMateri: 'Penyelesaian nilai yang belum diketahui dalam kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 100',
        rumusanTP: 'Peserta didik mampu menemukan nilai yang tidak diketahui dalam kalimat matematika yang melibatkan penjumlahan dan pengurangan pada bilangan cacah sampai 100 dengan memanfaatkan sifat-sifat operasi hitung.',
        indikatorKetercapaian: 'Dapat mencari nilai pengganti titik-titik atau kotak kosong dalam persamaan penjumlahan/pengurangan.',
        alokasiJP: 15,
      },
      {
        kompetensi: 'Mengidentifikasi dan Mengembangkan Pola Gambar dan Pola Bilangan s.d. 100',
        lingkupMateri: 'Pola gambar/objek berulang dan pola bilangan membesar serta mengecil melibatkan tambah dan kurang s.d. 100',
        rumusanTP: 'Peserta didik mampu mengidentifikasi, meniru, dan mengembangkan pola gambar atau objek sederhana dan pola bilangan membesar dan mengecil pada bilangan cacah sampai 100.',
        indikatorKetercapaian: 'Dapat menentukan aturan lompatan bilangan loncat naik/turun dan mengisi angka berikutnya pada barisan bilangan.',
        alokasiJP: 15,
      },
    ];
  }

  // 3. Pengukuran Fase B
  if (
    lowerElemen.includes('pengukuran') &&
    (lowerCP.includes('satuan baku panjang (cm, m)') || lowerCP.includes('satuan berat (g, kg)') || (fase === 'Fase B' && lowerCP.includes('luas dan volume menggunakan satuan tidak baku dan satuan baku')))
  ) {
    return [
      {
        kompetensi: 'Mengukur Panjang dan Berat dengan Satuan Baku serta Hubungan Antar-satuannya',
        lingkupMateri: 'Pengukuran panjang (cm, m) dan berat (g, kg) menggunakan alat ukur baku serta konversi hubungan antar-satuannya',
        rumusanTP: 'Peserta didik mampu mengukur panjang dan berat benda menggunakan satuan baku serta menentukan hubungan antar-satuan baku panjang (cm, m) dan antar-satuan berat (g, kg).',
        indikatorKetercapaian: 'Dapat menggunakan penggaris/meteran dan timbangan serta mengonversi 1 m = 100 cm dan 1 kg = 1.000 g.',
        alokasiJP: 16,
      },
      {
        kompetensi: 'Mengukur dan Mengestimasi Luas dan Volume Satuan Tidak Baku dan Baku',
        lingkupMateri: 'Pengukuran dan estimasi luas (persegi satuan) dan volume (kubus satuan/liter) menggunakan satuan tidak baku dan baku',
        rumusanTP: 'Peserta didik mampu mengukur dan mengestimasi luas dan volume menggunakan satuan tidak baku dan satuan baku berupa bilangan cacah secara mandiri.',
        indikatorKetercapaian: 'Dapat menghitung luas permukaan dengan petak satuan dan menghitung volume bangun ruang menggunakan tumpukan kubus satuan.',
        alokasiJP: 18,
      },
    ];
  }

  // 4. Geometri Fase B
  if (
    lowerElemen.includes('geometri') &&
    (lowerCP.includes('mendeskripsikan ciri berbagai bentuk bangun datar (segiempat, segitiga, segi banyak)') || (fase === 'Fase B' && lowerCP.includes('menyusun (komposisi) dan mengurai (dekomposisi) berbagai bangun datar')))
  ) {
    return [
      {
        kompetensi: 'Mendeskripsikan Ciri-ciri Bangun Datar',
        lingkupMateri: 'Karakteristik dan sifat geometris berbagai bangun datar (segiempat, segitiga, segi banyak: sisi, sudut, garis sejajar)',
        rumusanTP: 'Peserta didik mampu mendeskripsikan ciri berbagai bentuk bangun datar (segiempat, segitiga, dan segi banyak) berdasarkan jumlah sisi dan sudutnya.',
        indikatorKetercapaian: 'Dapat menyebutkan dan membedakan ciri-ciri persegi, persegi panjang, segitiga sama sisi/kaki, dan jajar genjang.',
        alokasiJP: 15,
      },
      {
        kompetensi: 'Melakukan Komposisi dan Dekomposisi Bangun Datar dengan Berbagai Cara',
        lingkupMateri: 'Penyusunan (komposisi) dan penguraian (dekomposisi) bangun datar majemuk dengan lebih dari satu cara',
        rumusanTP: 'Peserta didik mampu menyusun (komposisi) dan mengurai (dekomposisi) berbagai bangun datar dengan lebih dari satu cara jika memungkinkan.',
        indikatorKetercapaian: 'Dapat memecah bangun segiempat menjadi dua segitiga atau menyusun beberapa bangun datar menjadi bentuk baru secara kreatif.',
        alokasiJP: 15,
      },
    ];
  }

  // 5. Analisis Data dan Peluang Fase B
  if (
    (lowerElemen.includes('data') || lowerElemen.includes('peluang')) &&
    (lowerCP.includes('tabel, diagram gambar, piktogram, dan diagram batang (skala satu satuan)') || (fase === 'Fase B' && lowerCP.includes('diagram batang (skala satu satuan)')))
  ) {
    return [
      {
        kompetensi: 'Mengurutkan, Membandingkan, dan Menyajikan Data dalam Tabel dan Piktogram',
        lingkupMateri: 'Pengumpulan, pengurutan, dan penyajian data dalam bentuk tabel frekuensi dan piktogram (diagram gambar)',
        rumusanTP: 'Peserta didik mampu mengurutkan, membandingkan, dan menyajikan data dalam bentuk tabel dan diagram gambar (piktogram) secara sistematis.',
        indikatorKetercapaian: 'Dapat mengorganisasikan data mentah ke dalam tabel dan menggambar simbol piktogram yang mewakili data.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Menganalisis dan Menginterpretasi Diagram Batang Skala Satu Satuan',
        lingkupMateri: 'Penyajian, analisis, dan interpretasi data diagram batang vertikal/horizontal berskala satu satuan',
        rumusanTP: 'Peserta didik mampu menyajikan, menganalisis, dan menginterpretasi data dalam bentuk diagram batang (skala satu satuan) untuk mengambil kesimpulan.',
        indikatorKetercapaian: 'Dapat membaca diagram batang, menentukan kategori data paling banyak/sedikit, serta menghitung selisih antardata.',
        alokasiJP: 16,
      },
    ];
  }

  // Curated 1:1 decomposition for Matematika Fase C - Bilangan
  if (lowerElemen.includes('bilangan') && lowerCP.includes('1.000.000') && lowerCP.includes('pecahan')) {
    return [
      {
        kompetensi: 'Membaca Lambang dan Nama Bilangan',
        lingkupMateri: 'Bilangan cacah sampai 1.000.000',
        rumusanTP: 'Peserta didik mampu membaca lambang dan nama bilangan cacah sampai 1.000.000 dengan lafal dan simbol yang tepat.',
        indikatorKetercapaian: 'Dapat melafalkan dan membaca angka 6 digit secara tepat dalam berbagai konteks.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menuliskan Lambang dan Nama Bilangan',
        lingkupMateri: 'Lambang bilangan cacah sampai 1.000.000',
        rumusanTP: 'Peserta didik mampu menuliskan lambang dan nama bilangan cacah sampai 1.000.000 secara benar dan sistematis.',
        indikatorKetercapaian: 'Dapat menuliskan angka bilangan cacah besar berdasarkan penyebutan lisan atau teks.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menentukan Nilai Tempat',
        lingkupMateri: 'Nilai tempat bilangan cacah sampai 1.000.000 (satuan s.d. ratus ribuan)',
        rumusanTP: 'Peserta didik mampu menentukan nilai tempat angka pada bilangan cacah sampai 1.000.000 secara teliti.',
        indikatorKetercapaian: 'Dapat menguraikan posisi nilai tempat ratus ribuan, puluh ribuan, ribuan, ratusan, puluhan, dan satuan.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Membandingkan Bilangan',
        lingkupMateri: 'Perbandingan bilangan cacah sampai 1.000.000',
        rumusanTP: 'Peserta didik mampu membandingkan dua bilangan cacah sampai 1.000.000 menggunakan tanda relasi pembanding (<, >, =).',
        indikatorKetercapaian: 'Dapat menentukan nilai yang lebih besar, lebih kecil, atau sama pada pasangan bilangan 6 digit.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengurutkan Bilangan',
        lingkupMateri: 'Pengurutan sekumpulan bilangan cacah sampai 1.000.000',
        rumusanTP: 'Peserta didik mampu mengurutkan sekumpulan bilangan cacah sampai 1.000.000 dari terkecil ke terbesar atau sebaliknya.',
        indikatorKetercapaian: 'Dapat menyusun urutan 5 atau lebih bilangan cacah secara runtut dan presisi.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Melakukan Komposisi dan Dekomposisi',
        lingkupMateri: 'Komposisi dan dekomposisi bilangan cacah sampai 1.000.000',
        rumusanTP: 'Peserta didik mampu melakukan komposisi (menyusun) dan dekomposisi (mengurai) bilangan cacah sampai 1.000.000 berdasarkan nilai tempatnya.',
        indikatorKetercapaian: 'Dapat mengurai bilangan menjadi bentuk penjumlahan nilai tempat dan merekonstruksinya kembali.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Melakukan Operasi Penjumlahan dan Pengurangan',
        lingkupMateri: 'Penjumlahan dan pengurangan bilangan cacah sampai 100.000',
        rumusanTP: 'Peserta didik mampu melakukan operasi penjumlahan dan pengurangan bilangan cacah sampai 100.000 dengan teknik menyimpan dan meminjam.',
        indikatorKetercapaian: 'Dapat menghitung hasil operasi tambah dan kurang bilangan 5 digit secara mandiri dan akurat.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Melakukan Operasi Perkalian dan Pembagian',
        lingkupMateri: 'Perkalian dan pembagian bilangan cacah sampai 100.000',
        rumusanTP: 'Peserta didik mampu melakukan operasi perkalian dan pembagian bilangan cacah sampai 100.000 menggunakan metode bersusun.',
        indikatorKetercapaian: 'Dapat menyelesaikan perkalian multi-digit dan pembagian bersusun (porogapit) dengan cermat.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Menyelesaikan Masalah Terkait Uang',
        lingkupMateri: 'Aplikasi nilai mata uang dalam transaksi kehidupan sehari-hari',
        rumusanTP: 'Peserta didik mampu menyelesaikan masalah kontekstual yang berkaitan dengan uang dan pengelolaan keuangan sederhana.',
        indikatorKetercapaian: 'Dapat menghitung transaksi jual-beli, uang kembalian, dan membuat estimasi anggaran belanja sederhana.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menyelesaikan Masalah KPK dan FPB',
        lingkupMateri: 'Kelipatan Persekutuan Terkecil (KPK) dan Faktor Persekutuan Terbesar (FPB)',
        rumusanTP: 'Peserta didik mampu menentukan serta menyelesaikan masalah sehari-hari yang berkaitan dengan KPK dan FPB.',
        indikatorKetercapaian: 'Dapat memecahkan masalah jadwal berulang bersama (KPK) dan pembagian barang sama banyak (FPB).',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Membandingkan dan Mengurutkan Pecahan',
        lingkupMateri: 'Pecahan biasa, pecahan campuran, dan bilangan desimal (satu angka di belakang koma)',
        rumusanTP: 'Peserta didik mampu membandingkan dan mengurutkan berbagai pecahan termasuk pecahan campuran serta bilangan desimal.',
        indikatorKetercapaian: 'Dapat menyamakan penyebut pecahan dan mengurutkan nilai pecahan serta desimal dari terkecil ke terbesar.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Melakukan Operasi Hitung dan Konversi Pecahan',
        lingkupMateri: 'Operasi hitung pecahan (penjumlahan, pengurangan, perkalian, pembagian) dan konversi pecahan',
        rumusanTP: 'Peserta didik mampu melakukan operasi hitung pecahan dengan bilangan asli serta mengubah pecahan menjadi berbagai bentuk pecahan lain.',
        indikatorKetercapaian: 'Dapat menghitung operasi pecahan dan mengubah bentuk pecahan biasa ke desimal atau persen.',
        alokasiJP: 5,
      },
    ];
  }

  // Curated 1:1 decomposition for Matematika Fase C - Aljabar
  if (lowerElemen.includes('aljabar') && lowerCP.includes('kalimat matematika')) {
    return [
      {
        kompetensi: 'Menemukan Nilai yang Belum Diketahui',
        lingkupMateri: 'Kalimat matematika bilangan cacah sampai 1.000 dan sifat-sifat operasi hitung',
        rumusanTP: 'Peserta didik mampu menemukan nilai yang belum diketahui dalam kalimat matematika yang melibatkan operasi hitung pada bilangan cacah sampai 1.000.',
        indikatorKetercapaian: 'Dapat menentukan nilai variabel atau simbol dalam persamaan matematika terbuka sederhana.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengidentifikasi dan Mengembangkan Pola Bilangan',
        lingkupMateri: 'Pola bilangan membesar dan mengecil berbasis perkalian dan pembagian',
        rumusanTP: 'Peserta didik mampu mengidentifikasi, meniru, dan mengembangkan pola bilangan membesar dan mengecil yang melibatkan operasi perkalian dan pembagian.',
        indikatorKetercapaian: 'Dapat memprediksi dan menuliskan suku berikutnya pada barisan pola bilangan geometris/kelipatan.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Bernalar Proporsional Menggunakan Rasio Satuan',
        lingkupMateri: 'Rasio satuan dalam penyelesaian masalah kehidupan sehari-hari',
        rumusanTP: 'Peserta didik mampu bernalar secara proporsional untuk menyelesaikan masalah sehari-hari yang melibatkan rasio satuan.',
        indikatorKetercapaian: 'Dapat menghitung harga per unit dan perbandingan laju kuantitas benda secara akurat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menyelesaikan Masalah Terkait Proporsi',
        lingkupMateri: 'Aplikasi perkalian dan pembagian dalam masalah proporsi dan perbandingan senilai',
        rumusanTP: 'Peserta didik mampu menggunakan operasi perkalian dan pembagian dalam menyelesaikan masalah sehari-hari yang terkait dengan proporsi.',
        indikatorKetercapaian: 'Dapat memecahkan persoalan perbandingan senilai, skala peta, dan konversi resep secara mandiri.',
        alokasiJP: 4,
      },
    ];
  }

  // Curated 1:1 decomposition for Matematika Fase C - Pengukuran
  if (lowerElemen.includes('pengukuran') && lowerCP.includes('keliling') && lowerCP.includes('sudut')) {
    return [
      {
        kompetensi: 'Menentukan Keliling Bangun Datar',
        lingkupMateri: 'Keliling berbagai bentuk bangun datar (segitiga, segiempat, segi banyak) dan gabungannya',
        rumusanTP: 'Peserta didik mampu menentukan keliling berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) serta bangun gabungannya.',
        indikatorKetercapaian: 'Dapat menghitung total panjang sisi keliling bidang datar beraturan dan tidak beraturan.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menentukan Luas Bangun Datar',
        lingkupMateri: 'Luas berbagai bentuk bangun datar (segitiga, segiempat, segi banyak) dan gabungannya',
        rumusanTP: 'Peserta didik mampu menentukan luas berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) serta luas gabungannya.',
        indikatorKetercapaian: 'Dapat menghitung luas permukaan bangun datar tunggal dan gabungan menggunakan rumus standar.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Menghitung Durasi Waktu',
        lingkupMateri: 'Perhitungan dan estimasi durasi waktu dalam aktivitas kehidupan sehari-hari',
        rumusanTP: 'Peserta didik mampu menghitung dan mengestimasi durasi waktu dalam berbagai aktivitas kehidupan sehari-hari dengan satuan baku.',
        indikatorKetercapaian: 'Dapat menentukan rentang waktu antara jam mulai dan jam selesai suatu kegiatan secara tepat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengukur Besar Sudut Menggunakan Busur',
        lingkupMateri: 'Pengukuran sudut pada bangun datar dan sudut yang dibentuk dari dua garis berpotongan',
        rumusanTP: 'Peserta didik mampu mengukur dan menentukan besar sudut pada bangun datar atau yang dibentuk dari dua garis berpotongan menggunakan busur derajat.',
        indikatorKetercapaian: 'Dapat mengukur dan mengklasifikasikan sudut lancip, siku-siku, dan tumpul secara presisi.',
        alokasiJP: 4,
      },
    ];
  }

  // Curated 1:1 decomposition for Matematika Fase C - Geometri
  if (lowerElemen.includes('geometri') && lowerCP.includes('bangun ruang') && lowerCP.includes('spasial')) {
    return [
      {
        kompetensi: 'Mengkonstruksi dan Mengurai Bangun Ruang',
        lingkupMateri: 'Konstruksi jaring-jaring dan penguraian bangun ruang (kubus, balok, dan gabungannya)',
        rumusanTP: 'Peserta didik mampu mengkonstruksi dan mengurai bangun ruang (kubus, balok, dan gabungannya) melalui pembuatan jaring-jaring.',
        indikatorKetercapaian: 'Dapat merancang sketsa jaring-jaring kubus/balok dan merangkainya menjadi model 3D utuh.',
        alokasiJP: 5,
      },
      {
        kompetensi: 'Mengenali Visualisasi Spasial 3D',
        lingkupMateri: 'Visualisasi spasial proyeksi sudut pandang tampak depan, atas, dan samping',
        rumusanTP: 'Peserta didik mampu mengenali, menginterpretasikan, dan menggambar visualisasi spasial objek (tampak depan, atas, dan samping).',
        indikatorKetercapaian: 'Dapat menggambar sketsa objek 3 dimensi berdasarkan perspektif pandang yang berbeda.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Membandingkan Karakteristik Bangun Datar dan Bangun Ruang',
        lingkupMateri: 'Sifat-sifat dan karakteristik geometris komparatif bangun datar dan bangun ruang',
        rumusanTP: 'Peserta didik mampu membandingkan karakteristik dan sifat-sifat geometris antar bangun datar dan antar bangun ruang secara sistematis.',
        indikatorKetercapaian: 'Dapat menganalisis perbedaan jumlah rusuk, sisi, titik sudut, dan bidang simetri.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menentukan Lokasi pada Peta Sistem Berpetak',
        lingkupMateri: 'Sistem koordinat berpetak dan pemetaan lokasi pada denah berskala',
        rumusanTP: 'Peserta didik mampu menentukan dan memplot lokasi posisi objek pada peta yang menggunakan sistem berpetak.',
        indikatorKetercapaian: 'Dapat membaca titik koordinat (baris, kolom) dan memetakan jalur perjalanan pada peta berpetak.',
        alokasiJP: 4,
      },
    ];
  }

  // Curated 1:1 decomposition for Matematika Fase C - Analisis Data dan Peluang
  if (lowerElemen.includes('data') && lowerCP.includes('piktogram') && lowerCP.includes('peluang')) {
    return [
      {
        kompetensi: 'Mengurutkan dan Membandingkan Data',
        lingkupMateri: 'Data kuantitatif banyak benda dan hasil pengukuran dalam kehidupan sehari-hari',
        rumusanTP: 'Peserta didik mampu mengurutkan dan membandingkan data banyak benda serta data hasil pengukuran untuk mendapatkan informasi awal.',
        indikatorKetercapaian: 'Dapat menata data acak menjadi data berurutan dan menentukan nilai data tertinggi serta terendah.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menyajikan Data ke Format Visual',
        lingkupMateri: 'Penyajian data dalam bentuk piktogram (diagram gambar), diagram batang, dan tabel frekuensi',
        rumusanTP: 'Peserta didik mampu menyajikan data ke dalam bentuk gambar, piktogram, diagram batang, dan tabel frekuensi secara komunikatif.',
        indikatorKetercapaian: 'Dapat menggambar diagram batang vertikal/horizontal dengan skala angka sumbu yang tepat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menganalisis dan Menarik Informasi Data',
        lingkupMateri: 'Analisis, interpretasi, dan penarikan kesimpulan informasi dari sajian data visual',
        rumusanTP: 'Peserta didik mampu menganalisis sajian data gambar, piktogram, diagram batang, dan tabel frekuensi untuk menarik kesimpulan logis.',
        indikatorKetercapaian: 'Dapat menjawab pertanyaan analitis dan merumuskan inferensi berdasarkan grafik atau tabel.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menentukan Peluang Kejadian Acak',
        lingkupMateri: 'Peluang kejadian acak (kemungkinan lebih besar, lebih kecil, sama, atau mustahil) dalam percobaan sederhana',
        rumusanTP: 'Peserta didik mampu menentukan kejadian dengan kemungkinan yang lebih besar atau lebih kecil dalam suatu percobaan acak.',
        indikatorKetercapaian: 'Dapat memprediksi dan membandingkan peluang munculnya kejadian pada percobaan koin, dadu, atau pemutar.',
        alokasiJP: 4,
      },
    ];
  }

  // =========================================================================
  // BAHASA INDONESIA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Menyimak Fase A
  if (
    lowerElemen.includes('menyimak') &&
    (lowerCP.includes('percakapan yang berkaitan dengan diri') || (fase === 'Fase A' && lowerCP.includes('teks aural')))
  ) {
    return [
      {
        kompetensi: 'Memahami Informasi Teks Nonsastra Aural tentang Diri dan Keluarga',
        lingkupMateri: 'Teks aural percakapan dan instruksi lisan tentang diri sendiri dan keluarga',
        rumusanTP: 'Peserta didik mampu memahami informasi penting dari teks nonsastra berbentuk teks aural berupa percakapan yang berkaitan dengan diri dan keluarga secara tepat.',
        indikatorKetercapaian: 'Dapat menjawab pertanyaan siapa, apa, dan di mana dari percakapan lisan tentang keluarga yang didengarkan.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Memahami Informasi Teks Nonsastra Aural tentang Lingkungan Sekitar',
        lingkupMateri: 'Teks aural deskriptif tentang kebersihan dan lingkungan sekitar rumah/sekolah',
        rumusanTP: 'Peserta didik mampu memahami instruksi dan informasi dari teks aural nonsastra yang berkaitan dengan lingkungan sekitar rumah dan sekolah.',
        indikatorKetercapaian: 'Dapat menyebutkan 2-3 fakta penting tentang lingkungan yang didengar dari pembacaan teks guru.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Memahami Pesan Teks Sastra Berbentuk Teks Aural',
        lingkupMateri: 'Teks sastra aural (dongeng fabel, puisi anak, dan lagu anak) beserta pesan moralnya',
        rumusanTP: 'Peserta didik mampu memahami dan menceritakan pesan moral atau amanat sederhana dari teks sastra berbentuk teks aural yang didengarkan.',
        indikatorKetercapaian: 'Dapat mengidentifikasi sifat baik tokoh dongeng dan pesan kebaikan dalam fabel yang dibacakan.',
        alokasiJP: 23,
      },
    ];
  }

  // 2. Membaca dan Memirsa Fase A
  if (
    (lowerElemen.includes('membaca') || lowerElemen.includes('memirsa')) &&
    (lowerCP.includes('kata-kata sederhana dengan fasih') || (fase === 'Fase A' && lowerCP.includes('kesehatan, dan/atau lingkungan')))
  ) {
    return [
      {
        kompetensi: 'Membaca Kata-kata Sederhana dengan Fasih',
        lingkupMateri: 'Pola suku kata dan kata sederhana (KV, KVK, KV-KV) tentang diri, keluarga, dan kesehatan',
        rumusanTP: 'Peserta didik mampu membaca kata-kata sederhana dengan fasih dan lafal yang jelas dari bacaan dan tayangan yang dipirsa.',
        indikatorKetercapaian: 'Dapat mengeja dan membaca lancar 10-15 kosakata dasar tentang anggota tubuh, keluarga, dan kebiasaan sehat.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Memahami Isi Bacaan Bertema Diri, Keluarga, dan Kesehatan',
        lingkupMateri: 'Teks bacaan pendek berilustrasi tentang pola hidup sehat dan interaksi keluarga',
        rumusanTP: 'Peserta didik mampu memahami isi bacaan pendek tentang diri, keluarga, dan kesehatan dengan menjawab pertanyaan pemahaman sederhana.',
        indikatorKetercapaian: 'Dapat menemukan informasi tersurat dan menjawab pertanyaan apa, siapa, dan bagaimana dari bacaan pendek.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Memaknai Isi Tayangan Visual dan Lingkungan Sekitar',
        lingkupMateri: 'Tayangan visual, simbol rambu keselamatan sederhana, dan ilustrasi buku bertema lingkungan',
        rumusanTP: 'Peserta didik mampu memahami isi informasi dari tayangan yang dipirsa atau gambar situasi lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat menceritakan makna simbol gambar atau infografis anak sederhana yang diamati secara cermat.',
        alokasiJP: 23,
      },
    ];
  }

  // 3. Berbicara dan Mempresentasikan Fase A
  if (
    (lowerElemen.includes('berbicara') || lowerElemen.includes('mempresentasikan')) &&
    (lowerCP.includes('bertanya tentang sesuatu, menjawab') || (fase === 'Fase A' && lowerCP.includes('perasaan dan gagasan secara lisan')))
  ) {
    return [
      {
        kompetensi: 'Merespons Percakapan Santun dengan Teman dan Pendidik',
        lingkupMateri: 'Etika berbicara santun, intonasi ramah, bertanya dan merespons dalam percakapan lisan',
        rumusanTP: 'Peserta didik mampu merespons dengan bertanya, menjawab, dan menanggapi komentar orang lain secara santun dalam percakapan tentang diri dan keluarga.',
        indikatorKetercapaian: 'Dapat mengajukan pertanyaan sopan kepada guru dan menanggapi teman dengan kata tolong, maaf, dan terima kasih.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Mengungkapkan Perasaan dan Gagasan Secara Lisan',
        lingkupMateri: 'Pengungkapan ide, perasaan senang/sedih secara lisan dengan atau tanpa bantuan gambar',
        rumusanTP: 'Peserta didik mampu mengungkapkan perasaan dan gagasan secara lisan dengan runtut dan percaya diri dengan atau tanpa bantuan gambar.',
        indikatorKetercapaian: 'Dapat menceritakan pengalaman emosi atau kegiatan yang disukai di depan kelas dengan bahasa yang jelas.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Menceritakan Kembali Isi Teks yang Didengar atau Dibaca',
        lingkupMateri: 'Penceritaan ulang alur cerita teks dongeng atau informasi kesehatan/lingkungan',
        rumusanTP: 'Peserta didik mampu menceritakan kembali isi berbagai tipe teks yang dibaca, dipirsa, atau didengar tentang kesehatan dan lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat menguraikan kembali awal, tengah, dan akhir cerita yang telah disimak menggunakan kata-kata sendiri.',
        alokasiJP: 23,
      },
    ];
  }

  // 4. Menulis Fase A
  if (
    lowerElemen.includes('menulis') &&
    (lowerCP.includes('menulis permulaan') || (fase === 'Fase A' && lowerCP.includes('tulisan tangan yang semakin baik')))
  ) {
    return [
      {
        kompetensi: 'Menulis Permulaan dengan Posisi dan Gerakan Benar',
        lingkupMateri: 'Sikap duduk yang benar, cara memegang pensil, garis tegak, datar, lengkung, dan bentuk huruf lepas/sambung',
        rumusanTP: 'Peserta didik mampu menulis permulaan dengan benar di atas kertas dan/atau media digital dengan memperhatikan postur dan ketelitian motorik halus.',
        indikatorKetercapaian: 'Dapat memegang alat tulis dengan posisi tripod yang benar dan menjiplak/menulis huruf alfabet secara presisi.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Mengembangkan Tulisan Tangan yang Rapi dan Terbaca',
        lingkupMateri: 'Kerapian tulisan tangan, konsistensi ukuran huruf, dan spasi antarkata',
        rumusanTP: 'Peserta didik mampu mengembangkan tulisan tangan yang semakin baik, rapi, terbaca, dan memperhatikan spasi antarkata.',
        indikatorKetercapaian: 'Dapat menyalin 2-3 kalimat pendek pada buku bergaris dengan jarak huruf yang teratur dan bersih.',
        alokasiJP: 20,
      },
      {
        kompetensi: 'Menulis Rangkaian Kalimat Sederhana Bertema Lingkungan',
        lingkupMateri: 'Penyusunan kalimat sederhana berpola S-P-O dan penulisan teks deskripsi pendek bertema keluarga/lingkungan',
        rumusanTP: 'Peserta didik mampu menulis berbagai tipe teks sederhana tentang diri, keluarga, dan lingkungan sekitar dalam bentuk rangkaian beberapa kalimat sederhana.',
        indikatorKetercapaian: 'Dapat menuliskan 3 kalimat sederhana yang padu menggunakan huruf kapital awal kalimat dan tanda titik.',
        alokasiJP: 23,
      },
    ];
  }

  // =========================================================================
  // BAHASA INDONESIA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Menyimak Fase B
  if (
    lowerElemen.includes('menyimak') &&
    (lowerCP.includes('ide pokok suatu informasi dari teks nonsastra') || (fase === 'Fase B' && lowerCP.includes('teks nonsastra berbentuk teks aural')))
  ) {
    return [
      {
        kompetensi: 'Memahami Ide Pokok Teks Nonsastra Aural',
        lingkupMateri: 'Ide pokok dan informasi penting dari teks berita lisan, penjelasan guru, atau rekaman audio informatif',
        rumusanTP: 'Peserta didik mampu memahami dan menentukan ide pokok suatu informasi dari teks nonsastra berbentuk teks aural yang didengarkan.',
        indikatorKetercapaian: 'Dapat menuliskan atau menyebutkan kalimat utama/gagasan pokok dari paragraf teks lisan yang dibacakan.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengidentifikasi Fakta dan Rincian Informasi Teks Nonsastra Aural',
        lingkupMateri: 'Pencatatan fakta-fakta pendukung dan kata kunci dalam teks laporan hasil observasi lisan',
        rumusanTP: 'Peserta didik mampu mengidentifikasi fakta-fakta pendukung dan rincian informasi penting dari teks nonsastra aural secara cermat.',
        indikatorKetercapaian: 'Dapat mencatat poin-poin penting dari simakan teks nonfiksi dan menyusun ringkasan singkat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Memahami Isi dan Pesan Moral Teks Sastra Aural',
        lingkupMateri: 'Unsur cerita fiksi aural (tokoh, watak, alur, latar) dan amanat dalam dongeng legenda/fabel yang didengar',
        rumusanTP: 'Peserta didik mampu memahami isi, alur peristiwa, dan pesan moral dari teks sastra berbentuk teks aural.',
        indikatorKetercapaian: 'Dapat menganalisis karakter tokoh dan hikmah keteladanan yang disampaikan dalam cerita dongeng lisan.',
        alokasiJP: 18,
      },
    ];
  }

  // 2. Membaca dan Memirsa Fase B
  if (
    (lowerElemen.includes('membaca') || lowerElemen.includes('memirsa')) &&
    (lowerCP.includes('kata-kata baru dengan fasih') || (fase === 'Fase B' && lowerCP.includes('ide pokok, ide pendukung')))
  ) {
    return [
      {
        kompetensi: 'Membaca Fasih Kata-kata Baru dan Berimbuhan',
        lingkupMateri: 'Pelafalan kata baru, kata berimbuhan (me-, di-, pe-, -kan, -an), dan istilah populer dalam bacaan',
        rumusanTP: 'Peserta didik mampu membaca kata-kata baru dengan fasih dan intonasi yang tepat dari bacaan teks cetak maupun elektronik.',
        indikatorKetercapaian: 'Dapat membaca teks narasi/deskripsi dengan lafal yang jelas, tanda baca tepat, dan tidak terbata-bata.',
        alokasiJP: 13,
      },
      {
        kompetensi: 'Menentukan Ide Pokok dan Ide Pendukung Teks Nonsastra',
        lingkupMateri: 'Gagasan pokok, gagasan pendukung, dan struktur paragraf pada teks eksposisi dan artikel anak',
        rumusanTP: 'Peserta didik mampu memahami dan membedakan ide pokok serta ide pendukung dalam teks nonsastra berbentuk cetak atau elektronik.',
        indikatorKetercapaian: 'Dapat menggarisbawahi kalimat utama dan menyebutkan minimal dua kalimat penjelas dalam setiap paragraf.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Menganalisis Pesan dan Karakter Tokoh dalam Teks Sastra',
        lingkupMateri: 'Tema, alur cerita, konflik ringan, dan pesan moral teks sastra (cerita pendek anak, puisi, fabel nusantara)',
        rumusanTP: 'Peserta didik mampu memahami pesan, amanat, dan nilai budi pekerti dalam teks sastra berbentuk cetak dan elektronik.',
        indikatorKetercapaian: 'Dapat menguraikan amanat yang terkandung dalam cerita anak dan mengaitkannya dengan kehidupan sehari-hari.',
        alokasiJP: 13,
      },
      {
        kompetensi: 'Memaknai Informasi dan Fakta dari Teks Multimodal',
        lingkupMateri: 'Interpretasi infografis anak, teks multimodal, bagan petunjuk, dan tayangan edukatif',
        rumusanTP: 'Peserta didik mampu memahami informasi dan fakta visual yang disajikan melalui gambar ilustrasi, bagan, dan tayangan yang dipirsa.',
        indikatorKetercapaian: 'Dapat menjelaskan alur petunjuk visual atau data infografis sederhana yang ditayangkan.',
        alokasiJP: 14,
      },
    ];
  }

  // 3. Berbicara dan Mempresentasikan Fase B
  if (
    (lowerElemen.includes('berbicara') || lowerElemen.includes('mempresentasikan')) &&
    (lowerCP.includes('sikap tubuh/gestur yang sesuai') || (fase === 'Fase B' && lowerCP.includes('volume dan intonasi yang tepat')))
  ) {
    return [
      {
        kompetensi: 'Menyajikan Pendapat dengan Diksi Santun dan Gestur yang Tepat',
        lingkupMateri: 'Keterampilan berbicara persuasif, pilihan kata santun, sikap tubuh/gestur tegak, volume suara, dan intonasi',
        rumusanTP: 'Peserta didik mampu menyajikan pendapat dengan pilihan kata yang tepat dan sikap tubuh/gestur yang percaya diri serta santun.',
        indikatorKetercapaian: 'Dapat mengemukakan ide atau sanggahan di hadapan audiens dengan intonasi jelas dan kontak mata yang baik.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menanggapi Diskusi Kelompok Sesuai Tata Cara dan Etika',
        lingkupMateri: 'Aturan dan tata krama berdiskusi (mengacungkan tangan, mendengarkan, menghormati pendapat berbeda)',
        rumusanTP: 'Peserta didik mampu menanggapi diskusi kelas dan kerja kelompok sesuai tata cara dan etika bermusyawarah yang baik.',
        indikatorKetercapaian: 'Dapat berpartisipasi aktif dalam diskusi kelompok tanpa memotong pembicaraan orang lain secara semena-mena.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menceritakan Kembali Isi Informasi Berbagai Tipe Teks Secara Runtut',
        lingkupMateri: 'Teknik penyajian kembali isi teks lisan, tulisan, dan visual dengan struktur runtut (awal-tengah-akhir)',
        rumusanTP: 'Peserta didik mampu menceritakan kembali isi dan/atau informasi dari berbagai tipe teks yang dibaca, dipirsa, atau didengar dengan runtut dan menarik.',
        indikatorKetercapaian: 'Dapat merangkum dan menceritakan kembali bacaan dongeng atau berita anak menggunakan bahasanya sendiri secara lancar.',
        alokasiJP: 18,
      },
    ];
  }

  // 4. Menulis Fase B
  if (
    lowerElemen.includes('menulis') &&
    (lowerCP.includes('makna denotatif') || (fase === 'Fase B' && lowerCP.includes('rangkaian kalimat yang beragam')))
  ) {
    return [
      {
        kompetensi: 'Menulis Berbagai Tipe Teks Sederhana dengan Rangkaian Kalimat Beragam',
        lingkupMateri: 'Penulisan teks narasi, deskripsi, dan prosedur dengan variasi kalimat tunggal dan majemuk setara',
        rumusanTP: 'Peserta didik mampu menulis berbagai tipe teks sederhana dengan rangkaian kalimat yang beragam, runtut, dan koheren sesuai konteks.',
        indikatorKetercapaian: 'Dapat menyusun karangan deskripsi tentang hewan/tumbuhan atau narasi pengalaman liburan minimal 2 paragraf.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menerapkan Kaidah Kebahasaan, Ejaan, dan Tanda Baca Baku',
        lingkupMateri: 'Pedoman Ejaan (EYD/PUEBI): huruf kapital, tanda titik, tanda koma, tanda hubung, dan imbuhan dasar',
        rumusanTP: 'Peserta didik mampu menerapkan kaidah kebahasaan, tanda baca baku, dan penggunaan imbuhan dalam teks tulisannya.',
        indikatorKetercapaian: 'Dapat mengoreksi dan menuliskan kalimat dengan penggunaan huruf kapital dan tanda titik/koma yang tepat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menggunakan Kosakata Makna Denotatif yang Lugas dan Tepat Konteks',
        lingkupMateri: 'Pemilihan kosakata bermakna lugas/denotatif dan istilah baku untuk penulisan informatif',
        rumusanTP: 'Peserta didik mampu menggunakan kaidah kebahasaan dan kosakata baru yang memiliki makna denotatif untuk menulis teks secara lugas dan tepat.',
        indikatorKetercapaian: 'Dapat menyusun kalimat informatif menggunakan kosakata baru dengan arti harfiah/lugas yang tepat sasaran.',
        alokasiJP: 18,
      },
    ];
  }

  // =========================================================================
  // BAHASA INDONESIA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Menyimak Fase C
  if (
    lowerElemen.includes('menyimak') &&
    (lowerCP.includes('menganalisis informasi dari teks nonsastra') || (fase === 'Fase C' && lowerCP.includes('teks nonsastra berbentuk teks aural')))
  ) {
    return [
      {
        kompetensi: 'Menganalisis Informasi dan Akurasi Fakta Teks Nonsastra Aural',
        lingkupMateri: 'Analisis kritis fakta, data, dan opini dalam pidato, berita radio/podcast, dan wawancara lisan',
        rumusanTP: 'Peserta didik mampu menganalisis informasi, membedakan fakta dan opini, serta menguji akurasi pesan dari teks nonsastra berbentuk teks aural.',
        indikatorKetercapaian: 'Dapat menyaring informasi penting dan memilah antara pernyataan fakta dengan opini pembicara secara tepat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menganalisis Isi, Alur Cerita, dan Karakter Tokoh Teks Sastra Aural',
        lingkupMateri: 'Analisis alur cerita, perwatakan tokoh, latar, dan sudut pandang pencerita dalam teks sastra aural',
        rumusanTP: 'Peserta didik mampu menganalisis isi, dinamika alur, dan kompleksitas perwatakan tokoh dalam teks sastra berbentuk teks aural.',
        indikatorKetercapaian: 'Dapat menguraikan konflik utama dan penyelesaian cerita yang diperdengarkan secara analitis.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengevaluasi Nilai-nilai Kehidupan dalam Teks Sastra yang Didengar',
        lingkupMateri: 'Evaluasi nilai moral, budaya, dan kearifan lokal dalam hikayat atau cerita rakyat audio',
        rumusanTP: 'Peserta didik mampu mengevaluasi nilai-nilai moral, sosial, dan kearifan lokal yang tersirat dalam teks sastra berbentuk teks aural.',
        indikatorKetercapaian: 'Dapat memberikan refleksi kritis terhadap pesan moral cerita dan mengaitkannya dengan tantangan masa kini.',
        alokasiJP: 18,
      },
    ];
  }

  // 2. Membaca dan Memirsa Fase C
  if (
    (lowerElemen.includes('membaca') || lowerElemen.includes('memirsa')) &&
    (lowerCP.includes('pola kombinasi huruf') || (fase === 'Fase C' && lowerCP.includes('visual dan/atau audiovisual')))
  ) {
    return [
      {
        kompetensi: 'Membaca Fasih Kata dengan Berbagai Pola Kombinasi Huruf Kompleks',
        lingkupMateri: 'Pelafalan kata-kata dengan pola kombinasi huruf konsonan rangkap (kh, ng, ny, sy) dan kata serapan asing',
        rumusanTP: 'Peserta didik mampu membaca kata-kata dengan berbagai pola kombinasi huruf kompleks dan istilah ilmiah secara fasih dan bermakna.',
        indikatorKetercapaian: 'Dapat melafalkan kata-kata teknis dan istilah serapan dengan artikulasi yang tepat dalam teks panjang.',
        alokasiJP: 13,
      },
      {
        kompetensi: 'Menganalisis Ide Pokok, Ide Pendukung, dan Struktur Teks Nonsastra',
        lingkupMateri: 'Analisis struktur teks argumentasi, eksplanasi ilmiah, dan artikel berita cetak/elektronik',
        rumusanTP: 'Peserta didik mampu menganalisis ide pokok, ide pendukung, dan keterkaitan antarsubjudul dalam teks nonsastra secara kritis.',
        indikatorKetercapaian: 'Dapat membuat peta pikiran (mind map) yang memetakan ide pokok dan rincian penjelas tiap paragraf teks eksplanasi.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Menganalisis Nilai-nilai Moral dan Sosial dalam Teks Sastra',
        lingkupMateri: 'Apresiasi karya sastra (cerpen, novel anak, drama, dan puisi modern) dan nilai-nilai kemanusiaan',
        rumusanTP: 'Peserta didik mampu menganalisis informasi, majas sederhana, serta nilai-nilai budi pekerti dalam teks sastra visual/cetak.',
        indikatorKetercapaian: 'Dapat menelaah motif tindakan tokoh utama dan hikmah filosofis dalam teks cerita anak.',
        alokasiJP: 13,
      },
      {
        kompetensi: 'Menafsirkan Informasi dan Argumen Teks Visual dan Audiovisual',
        lingkupMateri: 'Analisis infografis data statistik anak, tayangan dokumenter pendek, dan kampanye sosial visual',
        rumusanTP: 'Peserta didik mampu menganalisis informasi, sudut pandang pembuat pesan, dan nilai-nilai dalam teks visual dan audiovisual.',
        indikatorKetercapaian: 'Dapat merumuskan simpulan objektif berdasarkan sajian infografis kompleks dan video dokumenter edukatif.',
        alokasiJP: 14,
      },
    ];
  }

  // 3. Berbicara dan Mempresentasikan Fase C
  if (
    (lowerElemen.includes('berbicara') || lowerElemen.includes('mempresentasikan')) &&
    (lowerCP.includes('mempresentasikan gagasan dari berbagai tipe teks') || (fase === 'Fase C' && lowerCP.includes('penggunaan kosakata secara kreatif')))
  ) {
    return [
      {
        kompetensi: 'Mempresentasikan Gagasan dari Berbagai Tipe Teks Secara Efektif dan Santun',
        lingkupMateri: 'Teknik presentasi ilmiah populer, penggunaan media bantu visual, artikulasi lugas, dan retorika santun',
        rumusanTP: 'Peserta didik mampu mempresentasikan gagasan dari berbagai tipe teks dengan efektif, intonasi memikat, dan bahasa santun di hadapan audiens.',
        indikatorKetercapaian: 'Dapat memaparkan hasil laporan pengamatan atau resensi buku menggunakan slide presentasi secara meyakinkan.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menyampaikan Perasaan Berdasarkan Fakta dan Imajinasi Secara Menarik',
        lingkupMateri: 'Bercerita (storytelling), monolog ekspresif, dan pengungkapan pengalaman emosional berbasis fakta/imajinasi',
        rumusanTP: 'Peserta didik mampu menyampaikan perasaan berdasarkan fakta dan imajinasi secara indah dan menarik di hadapan pendengar.',
        indikatorKetercapaian: 'Dapat membawakan cerita pengalaman atau kisah inspiratif dengan penjiwaan, intonasi emosional, dan kontak audiens yang kuat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menampilkan Pembacaan Puisi dan Karya Sastra dengan Kosakata Kreatif',
        lingkupMateri: 'Deklamasi puisi, dramatisasi cerita rakyat, dan pemanfaatan kosakata kiasan kreatif',
        rumusanTP: 'Peserta didik mampu menampilkan karya sastra lisan dengan olah vokal, ekspresi wajah, dan penggunaan kosakata secara kreatif dan artistik.',
        indikatorKetercapaian: 'Dapat mendeklamasikan puisi dengan dinamika penghayatan mimik wajah dan artikulasi yang menyentuh pendengar.',
        alokasiJP: 18,
      },
    ];
  }

  // 4. Menulis Fase C
  if (
    lowerElemen.includes('menulis') &&
    (lowerCP.includes('kalimat kompleks secara kreatif') || (fase === 'Fase C' && lowerCP.includes('denotatif dan konotatif')))
  ) {
    return [
      {
        kompetensi: 'Menulis Teks Narasi dan Deskripsi Menggunakan Kalimat Kompleks Kreatif',
        lingkupMateri: 'Pengembangan cerita naratif dan teks deskriptif imajinatif dengan kalimat majemuk bertingkat',
        rumusanTP: 'Peserta didik mampu menulis berbagai tipe teks sederhana berdasarkan gagasan, pengamatan, dan imajinasi dengan rangkaian kalimat kompleks secara kreatif dan indah.',
        indikatorKetercapaian: 'Dapat menyusun cerpen anak atau esai deskriptif minimal 3-4 paragraf yang mengalir padu dan memikat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menulis Teks Eksposisi dan Laporan Pengamatan Logis',
        lingkupMateri: 'Penulisan laporan hasil observasi, teks tanggapan kritis, dan penjelasan ilmiah populer berbasis fakta',
        rumusanTP: 'Peserta didik mampu menulis teks laporan pengamatan dan eksposisi dengan struktur pembuka, argumen fakta, dan simpulan yang logis.',
        indikatorKetercapaian: 'Dapat menyajikan data hasil kunjungan atau percobaan sains ke dalam teks laporan formal dengan ejaan yang sempurna.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menggunakan Kosakata Makna Denotatif dan Konotatif dalam Menulis',
        lingkupMateri: 'Penerapan makna denotatif (makna sebenarnya) dan makna konotatif (makna kias/majas metafora, personifikasi) secara tepat',
        rumusanTP: 'Peserta didik mampu menggunakan kaidah kebahasaan dan kosakata baru yang memiliki makna denotatif dan konotatif sesuai konteks tulisan.',
        indikatorKetercapaian: 'Dapat membedakan dan menyisipkan ungkapan bermajas serta istilah denotatif pada bagian tulisan yang relevan.',
        alokasiJP: 18,
      },
    ];
  }

  // =========================================================================
  // BAHASA INGGRIS - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Menyimak - Berbicara (Listening - Speaking) Fase B
  if (
    (lowerElemen.includes('listening') || lowerElemen.includes('speaking') || (lowerElemen.includes('menyimak') && lowerCP.includes('verbal atau non-verbal'))) &&
    (lowerCP.includes('teks lisan sederhana') || lowerCP.includes('kehidupan sehari-hari baik secara verbal atau non-verbal')) &&
    !lowerCP.includes('teks aural') &&
    !lowerCP.includes('teks nonsastra')
  ) {
    return [
      {
        kompetensi: 'Memahami Teks Lisan Sederhana Sehari-hari',
        lingkupMateri: 'Teks lisan sederhana kehidupan sehari-hari (sapaan/greetings, instruksi kelas, dan informasi diri)',
        rumusanTP: 'Peserta didik mampu memahami teks lisan dan instruksi sederhana tentang kehidupan sehari-hari dalam konteks kelas secara tepat.',
        indikatorKetercapaian: 'Dapat merespon salam, instruksi lisan guru, dan mengenali ungkapan perkenalan diri sederhana.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Merespon Teks Lisan dan Multimodal Kontekstual',
        lingkupMateri: 'Respon verbal dan non-verbal terhadap teks lisan/multimodal sederhana (nama benda, warna, dan angka)',
        rumusanTP: 'Peserta didik mampu merespon teks lisan atau teks multimodal sederhana baik secara verbal maupun non-verbal sesuai konteks.',
        indikatorKetercapaian: 'Dapat memberikan jawaban singkat atau isyarat/tindakan fisik yang tepat terhadap pertanyaan lisan sederhana.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengidentifikasi Informasi Topik Sehari-hari',
        lingkupMateri: 'Percakapan lisan interpersonal pendek (keluarga, hobi, makanan dan minuman kesukaan)',
        rumusanTP: 'Peserta didik mampu mengidentifikasi informasi penting dari percakapan lisan pendek seputar keluarga dan aktivitas sehari-hari.',
        indikatorKetercapaian: 'Dapat menyebutkan informasi kunci dari teks audio/lisan pendek dengan pengucapan yang jelas.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Berinteraksi Lisan Menggunakan Frasa Sederhana',
        lingkupMateri: 'Interaksi lisan sederhana (menanyakan dan menyatakan kepemilikan, kesukaan, serta kegiatan rutin)',
        rumusanTP: 'Peserta didik mampu berinteraksi secara lisan menggunakan frasa dan kalimat pendek sederhana dalam situasi komunikatif kelas.',
        indikatorKetercapaian: 'Dapat melakukan dialog tanya-jawab lisan sederhana bersama teman sebaya secara percaya diri.',
        alokasiJP: 4,
      },
    ];
  }

  // 2. Membaca - Memirsa (Reading - Viewing) Fase B
  if (
    (lowerElemen.includes('reading') || lowerElemen.includes('viewing') || (lowerElemen.includes('membaca') && lowerCP.includes('verbal atau non-verbal'))) &&
    (lowerCP.includes('teks tulis pendek') || lowerCP.includes('bergambar')) &&
    !lowerCP.includes('teks sastra') &&
    !lowerCP.includes('teks nonsastra') &&
    !lowerCP.includes('kata-kata baru')
  ) {
    return [
      {
        kompetensi: 'Membaca dan Memahami Kosakata Bergambar',
        lingkupMateri: 'Kosakata teks tulis pendek dan gambar ilustrasi (benda sekolah, hewan, dan lingkungan sekitar)',
        rumusanTP: 'Peserta didik mampu membaca dan memahami kata serta frasa pendek bergambar tentang kehidupan sehari-hari dengan lafal yang benar.',
        indikatorKetercapaian: 'Dapat mencocokkan kata/frasa tulis dengan gambar ilustrasi pendukung secara tepat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengidentifikasi Makna Teks Multimodal Pendek',
        lingkupMateri: 'Teks tulis pendek sederhana dan teks multimodal (kartu kata, poster berilustrasi, dan cerita bergambar)',
        rumusanTP: 'Peserta didik mampu memahami isi dan pesan sederhana dari teks multimodal pendek tentang topik kehidupan sehari-hari.',
        indikatorKetercapaian: 'Dapat menemukan informasi tersurat dari teks pendek bergambar yang dibaca secara terbimbing.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Membaca Kalimat Pendek Deskriptif',
        lingkupMateri: 'Teks deskriptif pendek sederhana berilustrasi tentang objek dan aktivitas sehari-hari',
        rumusanTP: 'Peserta didik mampu membaca kalimat pendek deskriptif tentang kehidupan sehari-hari secara lancar dan bermakna.',
        indikatorKetercapaian: 'Dapat membaca nyaring kalimat pendek dengan intonasi dan pengucapan yang mudah dipahami.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Merespons Teks Tulis Secara Verbal dan Non-Verbal',
        lingkupMateri: 'Tanggapan pemahaman bacaan (menjawab pertanyaan ya/tidak, melengkapi kata, atau mewarnai sesuai instruksi teks)',
        rumusanTP: 'Peserta didik mampu merespons teks tulis pendek sederhana dan multimodal baik secara lisan, tulisan, maupun tindakan sesuai konteks.',
        indikatorKetercapaian: 'Dapat menjawab pertanyaan pemahaman bacaan sederhana secara lisan maupun tertulis dengan benar.',
        alokasiJP: 4,
      },
    ];
  }

  // 3. Menulis - Mempresentasikan (Writing - Presenting) Fase B
  if (
    (lowerElemen.includes('writing') || lowerElemen.includes('presenting') || (lowerElemen.includes('menulis') && lowerCP.includes('mengomunikasikan gagasan'))) &&
    (lowerCP.includes('teks tulis pendek') || lowerCP.includes('pilihan kata')) &&
    !lowerCP.includes('makna denotatif') &&
    !lowerCP.includes('rangkaian kalimat yang beragam')
  ) {
    return [
      {
        kompetensi: 'Menulis Kata dan Frasa Sederhana',
        lingkupMateri: 'Penyalinan dan penulisan kata/frasa pendek bermakna (ejaan dasar, huruf kapital, dan tanda titik)',
        rumusanTP: 'Peserta didik mampu menuliskan kata dan frasa sederhana tentang topik sehari-hari dengan ejaan dan kaidah penulisan yang benar.',
        indikatorKetercapaian: 'Dapat menuliskan label nama objek, kata benda, dan kata sifat sederhana secara akurat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengomunikasikan Gagasan Melalui Teks Bergambar',
        lingkupMateri: 'Teks tulis pendek berilustrasi (caption sederhana, kartu ucapan, dan deskripsi singkat gambar)',
        rumusanTP: 'Peserta didik mampu mengomunikasikan gagasan tentang topik sehari-hari dalam teks tulis pendek berilustrasi sesuai konteks.',
        indikatorKetercapaian: 'Dapat menyusun keterangan teks pendek 1-2 baris untuk mendeskripsikan gambar favoritnya.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menyusun Kalimat Sederhana Terstruktur',
        lingkupMateri: 'Kalimat sederhana dengan pola Subjek + Kata Kerja + Objek tentang kegiatan sehari-hari',
        rumusanTP: 'Peserta didik mampu menyusun kalimat pendek terstruktur untuk mengungkapkan kegiatan dan benda di sekitarnya.',
        indikatorKetercapaian: 'Dapat melengkapi dan menyusun kalimat rumpang menjadi kalimat utuh yang bermakna.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mempresentasikan Karya Tulis dan Gambar',
        lingkupMateri: 'Presentasi lisan karya tulis dan gambar di depan kelas menggunakan bahasa tubuh komunikatif',
        rumusanTP: 'Peserta didik mampu mempresentasikan gagasan dan hasil karya tulis pendeknya di hadapan teman dan guru secara percaya diri.',
        indikatorKetercapaian: 'Dapat menunjukkan dan membacakan karya teks berilustrasinya dengan suara lantang dan jelas.',
        alokasiJP: 4,
      },
    ];
  }

  // =========================================================================
  // BAHASA INGGRIS - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Menyimak - Berbicara (Listening - Speaking) Fase C
  if (
    (lowerElemen.includes('listening') || lowerElemen.includes('speaking') || (lowerElemen.includes('menyimak') && lowerCP.includes('kalimat pendek dan sederhana'))) &&
    (lowerCP.includes('alur informasi teks secara keseluruhan') || lowerCP.includes('kalimat pendek dan sederhana')) &&
    !lowerCP.includes('teks aural') &&
    !lowerCP.includes('teks nonsastra')
  ) {
    return [
      {
        kompetensi: 'Memahami Alur Informasi Teks Lisan',
        lingkupMateri: 'Alur informasi teks lisan dan multimodal tentang topik sehari-hari (jadwal kegiatan, petunjuk arah, dan percakapan kontekstual)',
        rumusanTP: 'Peserta didik mampu memahami alur informasi teks secara keseluruhan dari teks lisan dan multimodal sederhana tentang topik sehari-hari.',
        indikatorKetercapaian: 'Dapat menguraikan urutan kejadian atau langkah-langkah yang didengar dari rekaman lisan secara runtut.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Merespon Teks Lisan Menggunakan Kalimat Pendek',
        lingkupMateri: 'Respon lisan komunikatif (menyatakan pendapat sederhana, menanyakan waktu/harga, dan mengungkapkan perasaan)',
        rumusanTP: 'Peserta didik mampu merespon teks lisan atau multimodal tentang topik sehari-hari secara lisan dengan kalimat pendek dan sederhana sesuai konteks.',
        indikatorKetercapaian: 'Dapat menjawab pertanyaan dan memberikan tanggapan lisan dengan tata bahasa sederhana yang berterima.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengidentifikasi Informasi Spesifik Percakapan',
        lingkupMateri: 'Dialog transaksional dan interpersonal (rencana masa depan, kegemaran, pengalaman liburan, dan cuaca)',
        rumusanTP: 'Peserta didik mampu mengidentifikasi informasi rinci dan gagasan pembicara dalam percakapan lisan sehari-hari secara tepat.',
        indikatorKetercapaian: 'Dapat mencatat poin-poin penting dan fakta spesifik dari dialog interaktif yang didengarkan.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengomunikasikan Percakapan Lisan Dua Arah',
        lingkupMateri: 'Komunikasi lisan interaktif (role play percakapan sehari-hari di pasar, sekolah, atau lingkungan rumah)',
        rumusanTP: 'Peserta didik mampu melakukan percakapan lisan dua arah dengan kalimat pendek sederhana secara lancar dan kontekstual.',
        indikatorKetercapaian: 'Dapat mempraktikkan simulasi percakapan kontekstual dengan intonasi dan pelafalan yang wajar.',
        alokasiJP: 4,
      },
    ];
  }

  // 2. Membaca - Memirsa (Reading - Viewing) Fase C
  if (
    (lowerElemen.includes('reading') || lowerElemen.includes('viewing') || (lowerElemen.includes('membaca') && lowerCP.includes('beragam teks pendek'))) &&
    (lowerCP.includes('alur informasi secara keseluruhan, gagasan utama') || lowerCP.includes('beragam teks pendek')) &&
    !lowerCP.includes('kombinasi huruf') &&
    !lowerCP.includes('teks sastra')
  ) {
    return [
      {
        kompetensi: 'Memahami Gagasan Utama Beragam Teks Pendek',
        lingkupMateri: 'Gagasan utama (main idea) dari berbagai teks pendek deskriptif, naratif, dan infografis seputar topik sehari-hari',
        rumusanTP: 'Peserta didik mampu memahami alur informasi secara keseluruhan dan menemukan gagasan utama dari beragam teks pendek atau multimodal.',
        indikatorKetercapaian: 'Dapat merumuskan gagasan pokok tiap paragraf pendek dari teks bacaan yang disajikan.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menemukan Informasi Rinci dari Teks Bacaan',
        lingkupMateri: 'Informasi rinci tersurat dan tersirat (5W+1H) dalam teks bacaan pendek dan multimodal bertema kontekstual',
        rumusanTP: 'Peserta didik mampu mengidentifikasi informasi rinci dari beragam teks pendek atau teks multimodal tentang topik sehari-hari secara cermat.',
        indikatorKetercapaian: 'Dapat menjawab pertanyaan pemahaman mendalam terkait fakta, waktu, tempat, dan tokoh dalam teks.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menganalisis Alur Teks Deskriptif dan Prosedur Sederhana',
        lingkupMateri: 'Struktur teks deskriptif dan teks prosedur sederhana (resep makanan, panduan kerajinan, dan infografis sains populer)',
        rumusanTP: 'Peserta didik mampu menganalisis alur informasi dan urutan langkah pada teks prosedur serta deskriptif sederhana.',
        indikatorKetercapaian: 'Dapat menyusun kembali potongan-potongan teks acak menjadi urutan alur informasi yang padu.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Merespon Isi Teks Multimodal Sesuai Konteks',
        lingkupMateri: 'Inferensi makna kosakata baru berdasarkan konteks bacaan dan respon kritis terhadap pesan teks visual/infografis',
        rumusanTP: 'Peserta didik mampu merespon pesan teks pendek dan teks multimodal serta menebak makna kata baru sesuai konteks bacaan.',
        indikatorKetercapaian: 'Dapat menyimpulkan makna pesan bacaan dan mengaitkannya dengan pengalaman kehidupan sehari-hari.',
        alokasiJP: 4,
      },
    ];
  }

  // 3. Menulis - Mempresentasikan (Writing - Presenting) Fase C
  if (
    (lowerElemen.includes('writing') || lowerElemen.includes('presenting') || (lowerElemen.includes('menulis') && lowerCP.includes('ide dan pengalamannya'))) &&
    (lowerCP.includes('ide dan pengalamannya') || (lowerCP.includes('berbagai jenis teks tulis sederhana') && lowerCP.includes('pengalamannya'))) &&
    !lowerCP.includes('denotatif dan konotatif') &&
    !lowerCP.includes('kalimat kompleks secara kreatif')
  ) {
    return [
      {
        kompetensi: 'Menulis Ide dan Pengalaman Melalui Paragraf Sederhana',
        lingkupMateri: 'Penulisan paragraf pendek tentang ide, pengalaman pribadi, atau kegiatan harian (recount/descriptive sederhana)',
        rumusanTP: 'Peserta didik mampu mengomunikasikan ide dan pengalamannya melalui penulisan paragraf sederhana dengan kalimat kohesif.',
        indikatorKetercapaian: 'Dapat menuliskan cerita pengalaman pribadi 3-5 kalimat menggunakan kata hubung (and, but, because, then) secara tepat.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Menyusun Berbagai Jenis Teks Tulis Sederhana',
        lingkupMateri: 'Berbagai jenis teks tulis sederhana (teks deskriptif objek/hewan, teks prosedur langkah sederhana, dan pesan singkat/surel)',
        rumusanTP: 'Peserta didik mampu menyusun berbagai jenis teks tulis sederhana tentang topik sehari-hari dengan struktur teks yang tepat.',
        indikatorKetercapaian: 'Dapat membuat panduan prosedur atau deskripsi benda dengan ejaan, huruf kapital, dan tanda baca yang benar.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mengembangkan Teks Multimodal Kreatif',
        lingkupMateri: 'Teks multimodal kreatif (poster mini, buklet bergambar, infografis sederhana, atau strip komik pendek)',
        rumusanTP: 'Peserta didik mampu membuat teks multimodal kreatif yang memadukan tulisan dan ilustrasi visual tentang topik sehari-hari.',
        indikatorKetercapaian: 'Dapat mendesain poster atau buklet sederhana bertema ramah lingkungan atau kebiasaan sehat dengan pesan jelas.',
        alokasiJP: 4,
      },
      {
        kompetensi: 'Mempresentasikan Ide dan Karya Secara Komunikatif',
        lingkupMateri: 'Penyajian lisan karya tulis dan proyek multimodal di depan kelas dengan artikulasi jelas dan sikap santun',
        rumusanTP: 'Peserta didik mampu mempresentasikan ide, pengalaman, dan karya tulis sederhananya secara percaya diri di depan kelas.',
        indikatorKetercapaian: 'Dapat menjelaskan isi karya teks dan infografisnya secara lisan dengan lancar dan intonasi yang baik.',
        alokasiJP: 4,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN PANCASILA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Pancasila Fase A
  if (
    lowerElemen.includes('pancasila') &&
    (lowerCP.includes('bendera negara') || lowerCP.includes('lagu kebangsaan') || (fase === 'Fase A' && !lowerCP.includes('makna sila-sila') && !lowerCP.includes('kronologi')))
  ) {
    return [
      {
        kompetensi: 'Mengenal Bendera Negara Sang Merah Putih',
        lingkupMateri: 'Bendera negara Sang Merah Putih dan aturan penghormatannya',
        rumusanTP: 'Peserta didik mampu mengenal bendera negara Sang Merah Putih serta menunjukkan rasa hormat dan tertib saat pengibarannya.',
        indikatorKetercapaian: 'Dapat mengidentifikasi warna, arti, dan sikap hormat yang benar terhadap bendera Sang Merah Putih.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mengenal Lagu Kebangsaan Indonesia Raya',
        lingkupMateri: 'Lagu kebangsaan Indonesia Raya dan sikap tertib bernyanyi',
        rumusanTP: 'Peserta didik mampu mengenal dan menyanyikan lagu kebangsaan Indonesia Raya dengan sikap berdiri tegak dan khidmat.',
        indikatorKetercapaian: 'Dapat menyanyikan lagu Indonesia Raya secara serempak dengan sikap tubuh tegak dan tertib.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mengenal Simbol dan Sila-sila Pancasila dalam Garuda Pancasila',
        lingkupMateri: 'Simbol (bintang, rantai, pohon beringin, kepala banteng, padi dan kapas) dan bunyi sila-sila Pancasila',
        rumusanTP: 'Peserta didik mampu mengenal simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila secara runtut.',
        indikatorKetercapaian: 'Dapat mencocokkan lima simbol Pancasila dengan sila ke-1 sampai ke-5 secara tepat.',
        alokasiJP: 16,
      },
      {
        kompetensi: 'Menerapkan Nilai-nilai Pancasila di Lingkungan Keluarga',
        lingkupMateri: 'Penerapan nilai-nilai sila Pancasila dalam kehidupan keluarga sehari-hari',
        rumusanTP: 'Peserta didik mampu menerapkan nilai-nilai luhur Pancasila dalam interaksi dan kebiasaan baik di lingkungan keluarga.',
        indikatorKetercapaian: 'Dapat menceritakan dan menunjukkan contoh sikap tolong-menolong dan rukun di rumah sesuai sila Pancasila.',
        alokasiJP: 36,
      },
    ];
  }

  // 2. UUD NRI 1945 Fase A
  if (
    (lowerElemen.includes('undang-undang') || lowerElemen.includes('uud')) &&
    (lowerCP.includes('lingkungan keluarga') || (fase === 'Fase A' && !lowerCP.includes('sekolah dan lingkungan tempat tinggal') && !lowerCP.includes('norma')))
  ) {
    return [
      {
        kompetensi: 'Mengenal Aturan di Lingkungan Keluarga',
        lingkupMateri: 'Aturan dan tata tertib di lingkungan keluarga (waktu belajar, tidur, dan merapikan mainan)',
        rumusanTP: 'Peserta didik mampu mengenal berbagai aturan dan tata tertib yang berlaku di lingkungan keluarga secara tepat.',
        indikatorKetercapaian: 'Dapat menyebutkan 3-4 contoh aturan harian di rumah yang harus ditaati.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menunjukkan Sikap Mematuhi Aturan di Rumah',
        lingkupMateri: 'Perilaku disiplin dan patuh terhadap aturan di lingkungan keluarga',
        rumusanTP: 'Peserta didik mampu menunjukkan sikap patuh, tertib, dan disiplin dalam mematuhi aturan di lingkungan keluarga.',
        indikatorKetercapaian: 'Dapat membiasakan diri merapikan perlengkapan sekolah dan tidur tepat waktu sesuai aturan rumah.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menceritakan Pengalaman Mematuhi Aturan Keluarga',
        lingkupMateri: 'Pengalaman pribadi dalam mematuhi aturan keluarga secara lisan dan gambar',
        rumusanTP: 'Peserta didik mampu menceritakan pengalaman pribadi mematuhi aturan di lingkungan keluarga secara santun dan percaya diri.',
        indikatorKetercapaian: 'Dapat menceritakan secara lisan manfaat mematuhi aturan keluarga di hadapan teman dan guru.',
        alokasiJP: 18,
      },
    ];
  }

  // 3. Bhinneka Tunggal Ika Fase A
  if (
    lowerElemen.includes('bhinneka') &&
    (lowerCP.includes('semboyan') || lowerCP.includes('jenis kelamin') || (fase === 'Fase A' && !lowerCP.includes('budaya, suku bangsa') && !lowerCP.includes('melestarikan')))
  ) {
    return [
      {
        kompetensi: 'Mengenal Semboyan Bhinneka Tunggal Ika',
        lingkupMateri: 'Makna semboyan Bhinneka Tunggal Ika sebagai lambang persatuan dalam perbedaan',
        rumusanTP: 'Peserta didik mampu mengenal semboyan Bhinneka Tunggal Ika serta memahami arti berbeda-beda tetapi tetap satu jua.',
        indikatorKetercapaian: 'Dapat melafalkan semboyan Bhinneka Tunggal Ika dan menjelaskan arti persatuan dalam keragaman secara sederhana.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengidentifikasi Identitas Diri (Jenis Kelamin dan Hobi)',
        lingkupMateri: 'Identitas diri berdasarkan jenis kelamin, ciri fisik, dan hobi atau kegemaran',
        rumusanTP: 'Peserta didik mampu mengidentifikasi identitas dirinya sesuai dengan jenis kelamin, ciri fisik, dan hobi dengan rasa percaya diri.',
        indikatorKetercapaian: 'Dapat memperkenalkan diri, menyebutkan jenis kelamin, serta hobi yang disukai di depan kelas.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menghargai Keberagaman Bahasa dan Agama di Sekitar',
        lingkupMateri: 'Sikap menghargai keragaman bahasa daerah serta agama dan kepercayaan di lingkungan sekitar',
        rumusanTP: 'Peserta didik mampu menghargai identitas orang lain sesuai bahasa, agama, dan kepercayaan di lingkungan sekitarnya tanpa membeda-bedakan.',
        indikatorKetercapaian: 'Dapat menunjukkan sikap ramah, santun, dan saling menghormati teman yang berbeda bahasa daerah atau agama.',
        alokasiJP: 36,
      },
    ];
  }

  // 4. NKRI Fase A
  if (
    (lowerElemen.includes('negara kesatuan') || lowerElemen.includes('nkri')) &&
    (lowerCP.includes('lingkungan tempat tinggal dan sekolah') || (fase === 'Fase A' && !lowerCP.includes('rt, rw') && !lowerCP.includes('kabupaten')))
  ) {
    return [
      {
        kompetensi: 'Mengenal Karakteristik Lingkungan Tempat Tinggal dan Sekolah',
        lingkupMateri: 'Karakteristik fisik dan sosial lingkungan tempat tinggal dan sekolah sebagai bagian NKRI',
        rumusanTP: 'Peserta didik mampu mengenal karakteristik lingkungan tempat tinggal dan sekolah sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia.',
        indikatorKetercapaian: 'Dapat menyebutkan bagian-bagian lingkungan rumah dan sekolah serta batas-batas sederhananya.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menceritakan Kerja Sama Menjaga Lingkungan Sekitar',
        lingkupMateri: 'Pengalaman dan contoh nyata bekerja sama merawat lingkungan rumah dan sekolah',
        rumusanTP: 'Peserta didik mampu menceritakan contoh dan pengalaman bekerja sama menjaga kebersihan dan ketertiban lingkungan sekitar secara runtut.',
        indikatorKetercapaian: 'Dapat menceritakan kegiatan membersihkan kelas atau rumah bersama keluarga dan teman.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mempraktikkan Bekerja Sama Menjaga Lingkungan dalam Keberagaman',
        lingkupMateri: 'Praktik gotong royong merawat kebersihan lingkungan sekitar dalam suasana keberagaman',
        rumusanTP: 'Peserta didik mampu mempraktikkan kegiatan bekerja sama menjaga lingkungan sekitar bersama teman dalam keberagaman secara kompak.',
        indikatorKetercapaian: 'Dapat berpartisipasi aktif dalam piket kelas atau kerja bakti sekolah bersama teman tanpa membeda-bedakan.',
        alokasiJP: 36,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN PANCASILA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Pancasila Fase B
  if (
    lowerElemen.includes('pancasila') &&
    (lowerCP.includes('makna sila-sila') || lowerCP.includes('perumus pancasila') || (fase === 'Fase B' && !lowerCP.includes('kronologi') && !lowerCP.includes('bendera negara')))
  ) {
    return [
      {
        kompetensi: 'Mengidentifikasi Makna Sila-sila Pancasila',
        lingkupMateri: 'Makna dan hubungan antar simbol serta sila-sila Pancasila dalam kehidupan',
        rumusanTP: 'Peserta didik mampu mengidentifikasi makna sila-sila Pancasila serta hubungan simbol dengan nilai-nilai luhur Pancasila secara tepat.',
        indikatorKetercapaian: 'Dapat menjelaskan makna yang terkandung dalam setiap sila Pancasila dan simbol Garuda Pancasila.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menerapkan Nilai Pancasila dalam Kehidupan Sehari-hari',
        lingkupMateri: 'Penerapan nilai-nilai Pancasila dalam interaksi harian di rumah, sekolah, dan masyarakat',
        rumusanTP: 'Peserta didik mampu menerapkan nilai-nilai sila Pancasila dalam kehidupan sehari-hari di rumah, sekolah, dan lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat memberikan contoh dan mempraktikkan perilaku jujur, adil, tolong-menolong, dan musyawarah di kelas.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengenal Karakter Para Perumus Pancasila',
        lingkupMateri: 'Karakter keteladanan para tokoh perumus Pancasila (kejujuran, cinta tanah air, musyawarah)',
        rumusanTP: 'Peserta didik mampu mengenal biografi singkat dan meneladani karakter keteladanan para perumus Pancasila.',
        indikatorKetercapaian: 'Dapat menyebutkan nama tokoh perumus Pancasila dan menceritakan sikap kepahlawanan yang patut diteladani.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menunjukkan Sikap Bangga Menjadi Anak Indonesia Berbahasa Persatuan',
        lingkupMateri: 'Sikap bangga berbahasa Indonesia sebagai bahasa persatuan di lingkungan sekitar',
        rumusanTP: 'Peserta didik mampu menunjukkan sikap bangga menjadi anak Indonesia yang memiliki bahasa Indonesia sebagai bahasa persatuan di lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat menggunakan Bahasa Indonesia yang baik dan santun dalam berinteraksi dengan teman berbeda suku.',
        alokasiJP: 18,
      },
    ];
  }

  // 2. UUD NRI 1945 Fase B
  if (
    (lowerElemen.includes('undang-undang') || lowerElemen.includes('uud')) &&
    (lowerCP.includes('sekolah dan lingkungan tempat tinggal') || lowerCP.includes('hak yang didapat dan kewajiban') || (fase === 'Fase B' && !lowerCP.includes('keluarga;') && !lowerCP.includes('pembukaan')))
  ) {
    return [
      {
        kompetensi: 'Mengidentifikasi Aturan di Sekolah dan Lingkungan Tempat Tinggal',
        lingkupMateri: 'Norma, aturan tertulis dan tidak tertulis di sekolah dan tempat tinggal',
        rumusanTP: 'Peserta didik mampu mengidentifikasi berbagai macam aturan di sekolah dan lingkungan tempat tinggal secara cermat.',
        indikatorKetercapaian: 'Dapat membedakan aturan tertulis (tata tertib sekolah) dan aturan tidak tertulis (kesopanan bermasyarakat).',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Melaksanakan Aturan di Sekolah dan Tempat Tinggal',
        lingkupMateri: 'Pelaksanaan aturan sekolah dan norma masyarakat dengan penuh tanggung jawab',
        rumusanTP: 'Peserta didik mampu melaksanakan aturan di sekolah dan lingkungan tempat tinggal dengan disiplin dan penuh kesadaran.',
        indikatorKetercapaian: 'Dapat mematuhi tata tertib kelas dan norma pergaulan di masyarakat dalam kehidupan sehari-hari.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengidentifikasi Hak dan Kewajiban Anggota Keluarga dan Warga Sekolah',
        lingkupMateri: 'Hak yang didapat dan kewajiban yang harus dipenuhi di rumah dan di sekolah',
        rumusanTP: 'Peserta didik mampu mengidentifikasi hak yang didapat dan kewajiban sebagai anggota keluarga dan sebagai warga sekolah secara adil.',
        indikatorKetercapaian: 'Dapat mengelompokkan contoh hak anak di rumah/sekolah dan kewajiban yang menyertainya.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menerapkan Hak dan Kewajiban Secara Seimbang',
        lingkupMateri: 'Penerapan hak dan kewajiban secara selaras, serasi, dan seimbang dalam kehidupan harian',
        rumusanTP: 'Peserta didik mampu menerapkan hak dan kewajiban secara seimbang dalam kehidupan sehari-hari sebagai anggota keluarga dan warga sekolah.',
        indikatorKetercapaian: 'Dapat menuntaskan kewajiban belajar dan piket terlebih dahulu sebelum meminta hak bermain.',
        alokasiJP: 18,
      },
    ];
  }

  // 3. Bhinneka Tunggal Ika Fase B
  if (
    lowerElemen.includes('bhinneka') &&
    (lowerCP.includes('budaya, suku bangsa') || lowerCP.includes('keluarga, dan teman-temannya') || (fase === 'Fase B' && !lowerCP.includes('jenis kelamin, hobi') && !lowerCP.includes('melestarikan')))
  ) {
    return [
      {
        kompetensi: 'Membedakan Identitas Budaya dan Suku Bangsa',
        lingkupMateri: 'Keragaman budaya, suku bangsa, adat istiadat, dan bahasa daerah di lingkungan sekitar',
        rumusanTP: 'Peserta didik mampu membedakan identitas, keluarga, dan teman-temannya sesuai budaya, suku bangsa, dan bahasa di lingkungan sekitar secara inklusif.',
        indikatorKetercapaian: 'Dapat menyebutkan keragaman suku, bahasa daerah, dan pakaian adat teman sebaya dengan sikap apresiatif.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menghargai Keragaman Bahasa dan Tradisi Teman Sebaya',
        lingkupMateri: 'Sikap menghormati bahasa dan tradisi adat teman sebaya tanpa diskriminasi',
        rumusanTP: 'Peserta didik mampu menghargai keragaman bahasa dan adat kebiasaan teman tanpa merendahkan satu sama lain.',
        indikatorKetercapaian: 'Dapat berkomunikasi saling menghargai dengan teman yang menggunakan dialek atau bahasa daerah berbeda.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menghargai Keberagaman Agama dan Kepercayaan di Lingkungan Sekitar',
        lingkupMateri: 'Sikap toleransi dan kerukunan antarumat beragama dan kepercayaan di masyarakat sekitar',
        rumusanTP: 'Peserta didik mampu menghargai perbedaan agama dan kepercayaan teman-temannya di lingkungan sekitar demi terciptanya kerukunan hidup.',
        indikatorKetercapaian: 'Dapat menunjukkan sikap toleran saat teman beribadah dan tidak mengganggu perayaan hari besar keagamaan orang lain.',
        alokasiJP: 36,
      },
    ];
  }

  // 4. NKRI Fase B
  if (
    (lowerElemen.includes('negara kesatuan') || lowerElemen.includes('nkri')) &&
    (lowerCP.includes('rt, rw') || lowerCP.includes('kecamatan') || (fase === 'Fase B' && !lowerCP.includes('kabupaten/kota') && !lowerCP.includes('lingkungan tempat tinggal dan sekolah;')))
  ) {
    return [
      {
        kompetensi: 'Mengidentifikasi Lingkungan Tempat Tinggal RT, RW, dan Desa/Kelurahan',
        lingkupMateri: 'Susunan wilayah administratif RT, RW, dan desa atau kelurahan sebagai bagian NKRI',
        rumusanTP: 'Peserta didik mampu mengidentifikasi susunan wilayah tempat tinggal (RT, RW, desa atau kelurahan) sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia.',
        indikatorKetercapaian: 'Dapat menyebutkan nama RT, RW, desa/kelurahan tempat tinggalnya dan tugas perangkat desa/kelurahan.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Mengidentifikasi Wilayah Kecamatan sebagai Bagian NKRI',
        lingkupMateri: 'Batas wilayah dan fungsi pemerintahan kecamatan dalam struktur NKRI',
        rumusanTP: 'Peserta didik mampu mengidentifikasi wilayah kecamatan sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia.',
        indikatorKetercapaian: 'Dapat menjelaskan letak kantor kecamatan dan perannya dalam melayani warga masyarakat.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menunjukkan Perilaku Bekerja Sama dalam Keberagaman Sosial dan Budaya',
        lingkupMateri: 'Bentuk-bentuk kerja sama dan gotong royong di tengah keberagaman suku bangsa, sosial, dan budaya',
        rumusanTP: 'Peserta didik mampu menunjukkan perilaku bekerja sama dalam berbagai bentuk keberagaman suku bangsa, sosial, dan budaya di lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat berpartisipasi dalam kegiatan kerja bakti atau festival budaya di lingkungan sekitar secara sukarela.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menjaga Persatuan dan Kesatuan Bangsa di Lingkungan Sekitar',
        lingkupMateri: 'Tindakan nyata menjaga persatuan dan kesatuan bangsa yang terikat semboyan persatuan',
        rumusanTP: 'Peserta didik mampu mempraktikkan tindakan nyata untuk merawat persatuan dan kesatuan di lingkungan masyarakat sekitar.',
        indikatorKetercapaian: 'Dapat mencegah pertengkaran antarteman dan mengajak teman hidup rukun dalam perbedaan.',
        alokasiJP: 18,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN PANCASILA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Pancasila Fase C
  if (
    lowerElemen.includes('pancasila') &&
    (lowerCP.includes('kronologi') || lowerCP.includes('pandangan hidup') || fase === 'Fase C')
  ) {
    return [
      {
        kompetensi: 'Memahami Kronologi Sejarah Kelahiran Pancasila',
        lingkupMateri: 'Kronologi sejarah kelahiran Pancasila (sidang BPUPK, Piagam Jakarta, hingga pengesahan PPKI 18 Agustus 1945)',
        rumusanTP: 'Peserta didik mampu memahami kronologi sejarah kelahiran Pancasila secara runtut dan mendalam.',
        indikatorKetercapaian: 'Dapat menceritakan proses perumusan dasar negara dari sidang BPUPK pertama sampai pengesahan oleh PPKI.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Meneladani Sikap Para Perumus Pancasila',
        lingkupMateri: 'Nilai-nilai keteladanan para tokoh perumus Pancasila dan penerapannya di masyarakat',
        rumusanTP: 'Peserta didik mampu meneladani sikap para perumus Pancasila dan menerapkannya dalam kehidupan di lingkungan masyarakat.',
        indikatorKetercapaian: 'Dapat mengidentifikasi sikap cinta tanah air, pantang menyerah, dan jiwa musyawarah para tokoh pendiri bangsa.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menghubungkan Sila-sila dalam Pancasila sebagai Suatu Kesatuan yang Utuh',
        lingkupMateri: 'Keterkaitan dan kesatuan organik sila-sila dalam Pancasila (sila 1 s.d. sila 5)',
        rumusanTP: 'Peserta didik mampu menghubungkan sila-sila dalam Pancasila sebagai suatu kesatuan hierarkis yang utuh dan tidak terpisahkan.',
        indikatorKetercapaian: 'Dapat menjelaskan keterkaitan antara sila Ketuhanan dengan sila-sila berikutnya secara logis.',
        alokasiJP: 18,
      },
      {
        kompetensi: 'Menguraikan Makna Nilai Pancasila sebagai Dasar Negara dan Pandangan Hidup',
        lingkupMateri: 'Makna nilai-nilai Pancasila sebagai dasar negara, ideologi nasional, dan pandangan hidup bangsa',
        rumusanTP: 'Peserta didik mampu menguraikan makna nilai-nilai Pancasila sebagai dasar negara dan pandangan hidup bangsa dalam kehidupan bernegara.',
        indikatorKetercapaian: 'Dapat menganalisis fungsi Pancasila sebagai pedoman moral dan hukum tertinggi bangsa Indonesia.',
        alokasiJP: 18,
      },
    ];
  }

  // 2. UUD NRI 1945 Fase C
  if (
    (lowerElemen.includes('undang-undang') || lowerElemen.includes('uud')) &&
    (lowerCP.includes('pembukaan undang-undang') || lowerCP.includes('musyawarah untuk membuat kesepakatan') || fase === 'Fase C')
  ) {
    return [
      {
        kompetensi: 'Mengimplementasikan Norma, Hak, dan Kewajiban sebagai Warga Negara',
        lingkupMateri: 'Bentuk-bentuk norma (agama, kesusilaan, kesopanan, hukum), hak, dan kewajiban warga negara',
        rumusanTP: 'Peserta didik mampu mengimplementasikan bentuk-bentuk norma, hak, dan kewajiban dalam kedudukannya sebagai warga negara secara bertanggung jawab.',
        indikatorKetercapaian: 'Dapat membedakan sanksi norma dan melaksanakan kewajiban warga negara dengan tertib.',
        alokasiJP: 24,
      },
      {
        kompetensi: 'Mengenal Pembukaan UUD Negara Republik Indonesia Tahun 1945',
        lingkupMateri: 'Makna Pembukaan UUD NRI Tahun 1945, pokok-pokok pikiran, dan tujuan negara',
        rumusanTP: 'Peserta didik mampu mengenal dan memahami makna Pembukaan Undang-Undang Dasar Negara Republik Indonesia Tahun 1945 secara komprehensif.',
        indikatorKetercapaian: 'Dapat menyebutkan 4 tujuan negara dalam alinea keempat Pembukaan UUD NRI 1945.',
        alokasiJP: 24,
      },
      {
        kompetensi: 'Mempraktikkan Musyawarah untuk Membuat Kesepakatan dan Aturan Bersama',
        lingkupMateri: 'Musyawarah mufakat, perumusan kesepakatan bersama di lingkungan keluarga dan sekolah',
        rumusanTP: 'Peserta didik mampu mempraktikkan musyawarah untuk membuat kesepakatan dan aturan bersama serta menerapkannya di keluarga dan sekolah.',
        indikatorKetercapaian: 'Dapat berperan aktif dalam musyawarah kelas, menghargai pendapat orang lain, dan menerima hasil mufakat dengan lapang dada.',
        alokasiJP: 24,
      },
    ];
  }

  // 3. Bhinneka Tunggal Ika Fase C
  if (
    lowerElemen.includes('bhinneka') &&
    (lowerCP.includes('melestarikan') || lowerCP.includes('semboyan dalam bingkai') || fase === 'Fase C')
  ) {
    return [
      {
        kompetensi: 'Mengidentifikasi Sikap Menghormati dan Menjaga Keberagaman Budaya',
        lingkupMateri: 'Identifikasi sikap menghormati, menjaga, dan merawat keberagaman budaya dalam bingkai Bhinneka Tunggal Ika',
        rumusanTP: 'Peserta didik mampu mengidentifikasi sikap menghormati dan menjaga keberagaman budaya sesuai semboyan Bhinneka Tunggal Ika di lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat menyajikan data keragaman rumah adat, tarian, dan upacara adat nusantara dengan rasa bangga.',
        alokasiJP: 36,
      },
      {
        kompetensi: 'Melestarikan Keberagaman Budaya Nusantara',
        lingkupMateri: 'Upaya pelestarian kesenian dan kearifan lokal nusantara di era modern',
        rumusanTP: 'Peserta didik mampu menyajikan hasil identifikasi dan melakukan aksi nyata melestarikan keberagaman budaya bangsa dalam kehidupan sehari-hari.',
        indikatorKetercapaian: 'Dapat mempraktikkan salah satu karya seni daerah atau menampilkan kearifan lokal dalam kegiatan sekolah.',
        alokasiJP: 36,
      },
    ];
  }

  // 4. NKRI Fase C
  if (
    (lowerElemen.includes('negara kesatuan') || lowerElemen.includes('nkri')) &&
    (lowerCP.includes('kabupaten/kota') || lowerCP.includes('bela negara') || fase === 'Fase C')
  ) {
    return [
      {
        kompetensi: 'Mengenal Wilayah dalam Konteks Kabupaten/Kota dan Provinsi sebagai Bagian NKRI',
        lingkupMateri: 'Wilayah kabupaten/kota dan provinsi (letak, batas wilayah, potensi, dan tata pemerintahan) dalam NKRI',
        rumusanTP: 'Peserta didik mampu mengenal wilayahnya dalam konteks kabupaten/kota dan provinsi sebagai bagian integral dari Negara Kesatuan Republik Indonesia.',
        indikatorKetercapaian: 'Dapat memetakan wilayah kabupaten dan provinsi tempat tinggalnya beserta potensi daerahnya.',
        alokasiJP: 36,
      },
      {
        kompetensi: 'Menunjukkan Perilaku Gotong Royong Menjaga Persatuan sebagai Wujud Bela Negara',
        lingkupMateri: 'Sikap gotong royong menjaga keutuhan wilayah dan persatuan di sekolah dan lingkungan sekitar sebagai wujud bela negara',
        rumusanTP: 'Peserta didik mampu menunjukkan perilaku gotong royong untuk menjaga persatuan di lingkungan sekolah dan sekitar sebagai wujud bela negara.',
        indikatorKetercapaian: 'Dapat menginisiasi kegiatan tolong-menolong dan menjaga kedamaian sekolah sebagai wujud cinta tanah air.',
        alokasiJP: 36,
      },
    ];
  }

  // =========================================================================
  // IPAS (ILMU PENGETAHUAN ALAM DAN SOSIAL) - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  // 1. Pemahaman IPAS Fase B
  if (
    (lowerElemen.includes('pemahaman') || lowerElemen.includes('ipas') || lowerElemen.includes('sains')) &&
    (lowerCP.includes('pancaindra') || lowerCP.includes('siklus hidup') || lowerCP.includes('perubahan wujud zat') || (fase === 'Fase B' && lowerCP.includes('mitigasi perubahan iklim')))
  ) {
    return [
      {
        kompetensi: 'Menjelaskan Bentuk dan Fungsi Pancaindra',
        lingkupMateri: 'Bentuk organ, struktur anatomi dasar, fungsi pancaindra (mata, telinga, hidung, lidah, kulit), dan cara perawatannya',
        rumusanTP: 'Peserta didik mampu menjelaskan bentuk dan fungsi pancaindra manusia serta membiasakan diri merawat kesehatannya dalam kehidupan sehari-hari.',
        indikatorKetercapaian: 'Dapat mengidentifikasi nama bagian panca indra, fungsinya dalam mengenali rangsangan, dan 2 cara menjaga kebersihannya.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Menganalisis Siklus Hidup Makhluk Hidup dan Pelestariannya',
        lingkupMateri: 'Siklus hidup (metamorfosis sempurna dan tidak sempurna) pada hewan/tumbuhan di lingkungan sekitar serta upaya pelestariannya',
        rumusanTP: 'Peserta didik mampu menganalisis tahapan siklus hidup berbagai makhluk hidup di lingkungan sekitar dan merumuskan upaya pelestariannya secara bertanggung jawab.',
        indikatorKetercapaian: 'Dapat membandingkan daur hidup kupu-kupu, katak, atau kecoak serta menyajikan poster perlindungan hewan langka.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menghasilkan Solusi Masalah Pelestarian Sumber Daya Alam sebagai Mitigasi Perubahan Iklim',
        lingkupMateri: 'Pelestarian sumber daya alam (air, tanah, hutan), pemilahan sampah 3R, dan aksi nyata mitigasi perubahan iklim',
        rumusanTP: 'Peserta didik mampu menghasilkan solusi kreatif untuk memecahkan masalah pelestarian sumber daya alam di lingkungan sekitar sebagai upaya mitigasi perubahan iklim.',
        indikatorKetercapaian: 'Dapat merancang ide penghematan energi atau pengelolaan sampah plastik di sekolah untuk menjaga kelestarian bumi.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menyimpulkan Proses Perubahan Wujud Zat',
        lingkupMateri: 'Sifat wujud zat (padat, cair, gas) dan proses perubahannya (mencair, membeku, menguap, mengembun, menyublim, mengkristal)',
        rumusanTP: 'Peserta didik mampu menyimpulkan proses perubahan wujud zat melalui serangkaian pengamatan dan percobaan sederhana.',
        indikatorKetercapaian: 'Dapat mendemonstrasikan dan menjelaskan perubahan wujud es mencair, air mendidih menguap, dan embun pagi secara tepat.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menjelaskan Sumber, Bentuk, dan Proses Perubahan Bentuk Energi',
        lingkupMateri: 'Sumber energi (matahari, angin, air, biomassa), bentuk energi (panas, gerak, cahaya, listrik, kimia), dan transformasinya dalam kehidupan',
        rumusanTP: 'Peserta didik mampu menjelaskan ragam sumber dan bentuk energi serta proses transformasi perubahan bentuk energi dalam kehidupan sehari-hari.',
        indikatorKetercapaian: 'Dapat memberikan 3 contoh konversi energi pada alat elektronik rumah tangga (seperti setrika, blender, lampu).',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Membedakan Jenis Gaya dan Pengaruhnya Terhadap Benda',
        lingkupMateri: 'Ragam jenis gaya (otot, gesek, magnet, pegas, gravitasi) dan pengaruh gaya terhadap arah, gerak, dan bentuk benda',
        rumusanTP: 'Peserta didik mampu membedakan berbagai jenis gaya serta menganalisis pengaruh gaya terhadap gerak, arah, dan perubahan bentuk benda melalui eksperimen sederhana.',
        indikatorKetercapaian: 'Dapat membuktikan pengaruh gaya dorong/tarik pada laju mobil mainan dan plastisin yang berubah bentuk saat ditekan.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menjelaskan Peran, Tugas, Tanggung Jawab, dan Interaksi Sosial',
        lingkupMateri: 'Peran sosial, tugas, tanggung jawab warga sekolah dan warga masyarakat, serta bentuk interaksi sosial yang harmonis',
        rumusanTP: 'Peserta didik mampu menjelaskan peran, tugas, dan tanggung jawab individu serta interaksi sosial yang terjadi di lingkungan sekitar tempat tinggal dan sekolah.',
        indikatorKetercapaian: 'Dapat memetakan tugas kepala sekolah, guru, siswa, serta ketua RT dan mendeskripsikan kerja sama antarwarga.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mengenali Letak Kabupaten/Kota dan Provinsi Menggunakan Peta',
        lingkupMateri: 'Komponen peta (judul, skala, arah mata angin, simbol), letak geografis kabupaten/kota dan provinsi menggunakan peta konvensional/digital',
        rumusanTP: 'Peserta didik mampu mengenali dan membaca letak kabupaten/kota serta provinsi tempat tinggalnya dengan memanfaatkan peta konvensional atau digital (Google Maps).',
        indikatorKetercapaian: 'Dapat menunjukkan posisi ibu kota kabupaten dan batas wilayah provinsi tempat tinggalnya pada peta atlas atau digital.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mengklasifikasikan Ragam Bentang Alam, Profesi Masyarakat, dan Budaya Lokal',
        lingkupMateri: 'Bentang alam (pantai, dataran rendah, dataran tinggi), keterkaitannya dengan mata pencaharian, ragam budaya, dan pelestariannya',
        rumusanTP: 'Peserta didik mampu mengklasifikasikan ragam bentang alam serta keterkaitannya dengan profesi masyarakat, keragaman budaya, dan aksi pelestariannya.',
        indikatorKetercapaian: 'Dapat menghubungkan profesi nelayan di pesisir atau petani di dataran tinggi serta menyebutkan tarian/upacara adat daerahnya.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Menganalisis Sejarah Masyarakat di Lingkungan Tempat Tinggal',
        lingkupMateri: 'Jejak sejarah lokal, tokoh pahlawan atau pendiri desa/daerah, dan peninggalan bersejarah di lingkungan sekitar',
        rumusanTP: 'Peserta didik mampu menganalisis asal-usul dan sejarah masyarakat di lingkungan tempat tinggalnya serta mengambil keteladanan dari tokoh lokal.',
        indikatorKetercapaian: 'Dapat menceritakan asal mula nama daerah tempat tinggal dan menyebutkan bangunan bersejarah atau tradisi lokal warisan leluhur.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Menjelaskan Nilai Mata Uang, Fungsinya, dan Pengelolaan Keuangan Bijak',
        lingkupMateri: 'Uang kartal rupiah (kertas & logam), fungsi uang sebagai alat tukar sah, kebutuhan vs keinginan, dan kebiasaan gemar menabung',
        rumusanTP: 'Peserta didik mampu menjelaskan nilai mata uang dan fungsinya serta mempraktikkan cara mengelola uang jajan secara bijak dan gemar menabung.',
        indikatorKetercapaian: 'Dapat menghitung nilai nominal uang, membedakan kebutuhan pokok dengan keinginan sesaat, dan membuat buku tabungan sederhana.',
        alokasiJP: 10,
      },
    ];
  }

  // 2. Keterampilan Proses IPAS Fase B
  if (
    (lowerElemen.includes('keterampilan') || lowerElemen.includes('proses')) &&
    (lowerCP.includes('mengamati') && lowerCP.includes('mempertanyakan dan memprediksi') && (fase === 'Fase B' || lowerCP.includes('turus dan diagram gambar')))
  ) {
    return [
      {
        kompetensi: 'Mengamati dan Mencatat Fenomena Alam dan Sosial',
        lingkupMateri: 'Pengamatan terfokus fenomena sederhana pancaindra, perubahan wujud, dan interaksi lingkungan serta pencatatan data fakta',
        rumusanTP: 'Peserta didik mampu mengamati fenomena dan peristiwa secara cermat dan sistematis serta mencatat hasil pengamatannya dalam format catatan ilmiah sederhana.',
        indikatorKetercapaian: 'Dapat mencatat perubahan tinggi kecambah atau waktu melelehnya es batu secara teratur dalam tabel lembar kerja.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mempertanyakan dan Membuat Prediksi Ilmiah',
        lingkupMateri: 'Perumusan pertanyaan ilmiah (apa, mengapa, bagaimana) dan hipotesis/prediksi awal berdasarkan pengalaman sebelumnya',
        rumusanTP: 'Peserta didik mampu mengajukan pertanyaan mendalam secara mandiri tentang hal yang ingin diselidiki dan membuat prediksi logis berdasarkan pengetahuan awal.',
        indikatorKetercapaian: 'Dapat menyusun kalimat tanya penyelidikan dan menebak hasil percobaan gaya magnet sebelum diuji coba.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Merencanakan dan Melakukan Penyelidikan dengan Alat Ukur Sederhana',
        lingkupMateri: 'Penyusunan langkah kerja observasi, keselamatan kerja, dan penggunaan alat bantu pengukuran (penggaris, timbangan, termometer)',
        rumusanTP: 'Peserta didik mampu merencanakan langkah operasional dan melakukan penyelidikan terpandu menggunakan alat bantu pengukuran sederhana secara tertib.',
        indikatorKetercapaian: 'Dapat mengukur suhu air dengan termometer atau mengukur jarak tempuh mobil mainan dengan mistar secara aman.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Memproses, Menganalisis Data Turus/Diagram, dan Membandingkan Prediksi',
        lingkupMateri: 'Organisasi data dalam turus dan diagram gambar (piktogram), perbandingan data nyata dengan dugaan awal, serta penarikan simpulan',
        rumusanTP: 'Peserta didik mampu mengorganisasikan data hasil penyelidikan ke dalam bentuk turus dan diagram gambar serta membandingkan hasil pengamatan dengan prediksinya.',
        indikatorKetercapaian: 'Dapat membuat grafik diagram gambar dari data jenis pekerjaan warga dan membuktikan kebenaran hipotesis awalnya.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Mengevaluasi, Merefleksikan, dan Mengomunikasikan Hasil Penyelidikan',
        lingkupMateri: 'Refleksi kelebihan dan kendala penyelidikan serta komunikasi hasil lisan/tulisan melalui poster, presentasi, atau laporan sederhana',
        rumusanTP: 'Peserta didik mampu melakukan refleksi perbaikan terhadap proses penyelidikan dan mengomunikasikan kesimpulan hasil pengamatan secara lisan dan tulisan.',
        indikatorKetercapaian: 'Dapat mempresentasikan laporan hasil eksperimen perubahan wujud di depan kelas dengan bahasa yang jelas dan percaya diri.',
        alokasiJP: 12,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE A (KELAS I & II)
  // Sesuai Regulasi Standar Capaian Pembelajaran BKP No. 20/2026
  // =========================================================================
  // 1. Pribadi Murid Fase A
  if (
    lowerElemen.includes('pribadi') &&
    (lowerCP.includes('dicintai tuhan') || lowerCP.includes('anggota tubuh') || (fase === 'Fase A' && lowerCP.includes('merawat tubuhnya')))
  ) {
    return [
      {
        kompetensi: 'Memahami Diri sebagai Pribadi yang Dicintai Tuhan',
        lingkupMateri: 'Pribadi murid anugerah istimewa Allah Bapa yang dicintai Tuhan tanpa syarat',
        rumusanTP: 'Peserta didik mampu memahami dirinya sebagai pribadi ciptaan yang dikasihi Tuhan serta bersyukur atas keberadaan dirinya.',
        indikatorKetercapaian: 'Dapat menyebutkan bukti kasih Tuhan dalam hidupnya dan mengungkapkan doa syukur sederhana atas dirinya.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Mengenal Fungsi dan Merawat Anggota Tubuh Ciptaan Tuhan',
        lingkupMateri: 'Anggota tubuh (pancaindra, tangan, kaki), kegunaan untuk berbuat baik, dan cara menjaga kebersihan serta kesehatan tubuh',
        rumusanTP: 'Peserta didik mampu mengidentifikasi anggota tubuh yang berguna dan membiasakan diri merawat kebersihan serta kesehatannya sebagai wujud syukur kepada Tuhan.',
        indikatorKetercapaian: 'Dapat memperagakan cara mencuci tangan, menggosok gigi, dan menyebutkan perbuatan baik yang dilakukan dengan tangan dan kaki.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Mengembangkan Potensi Diri Bersama Teman di Rumah dan Sekolah',
        lingkupMateri: 'Peran teman sebaya, kehangatan keluarga di rumah, dan suasana sekolah sebagai wadah mengembangkan bakat dan potensi diri',
        rumusanTP: 'Peserta didik mampu memahami teman-teman serta lingkungan rumah dan sekolah sebagai tempat anugerah Tuhan untuk mengembangkan potensi dirinya dengan gembira.',
        indikatorKetercapaian: 'Dapat menyebutkan bakat yang dimilikinya dan menunjukkan sikap saling mendukung saat belajar dan bermain bersama teman.',
        alokasiJP: 9,
      },
    ];
  }

  // 2. Yesus Kristus Fase A
  if (
    lowerElemen.includes('yesus') &&
    (lowerCP.includes('langit, bumi') || lowerCP.includes('nuh') || lowerCP.includes('majus') || (fase === 'Fase A' && lowerCP.includes('bait allah')))
  ) {
    return [
      {
        kompetensi: 'Memahami Kisah Penciptaan Langit, Bumi, dan Isinya oleh Tuhan',
        lingkupMateri: 'Penciptaan alam semesta (terang, langit, laut, darat, tumbuhan, benda penerang, hewan, dan manusia) oleh Allah Bapa',
        rumusanTP: 'Peserta didik mampu memahami bahwa Tuhan menciptakan langit, bumi, dan seluruh isinya dengan penuh kasih untuk kebahagiaan manusia.',
        indikatorKetercapaian: 'Dapat menceritakan kembali urutan penciptaan alam secara sederhana dan menyebutkan 3 ciptaan Tuhan yang paling disukai.',
        alokasiJP: 6,
      },
      {
        kompetensi: 'Meneladani Tokoh-Tokoh Iman Perjanjian Lama',
        lingkupMateri: 'Kisah ketaatan Nuh membangun bahtera, kesetiaan Abraham, Ishak anak perjanjian, dan Yakub',
        rumusanTP: 'Peserta didik mampu memahami dan meneladani keteguhan iman tokoh-tokoh Perjanjian Lama (Nuh, Abraham, Ishak, dan Yakub) dalam mendengarkan suara Tuhan.',
        indikatorKetercapaian: 'Dapat menceritakan teladan ketaatan Nabi Nuh dan keikhlasan Abraham saat dipanggil oleh Allah.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Kisah Kelahiran Yesus dan Kunjungan Tiga Orang Majus',
        lingkupMateri: 'Kabar sukacita Malaikat Gabriel, kelahiran bayi Yesus di kandang Betlehem, dan persembahan tiga orang Majus (emas, kemenyan, mur)',
        rumusanTP: 'Peserta didik mampu memahami kisah kelahiran Tuhan Yesus Kristus dan peristiwa tiga orang Majus dari Timur yang sujud menyembah Sang Juruselamat.',
        indikatorKetercapaian: 'Dapat menyebutkan makna hadiah Natal tiga orang Majus dan menyanyikan lagu Natal anak dengan sukacita.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Meneladani Masa Kanak-Kanak Yesus di Nazaret dan Bait Allah',
        lingkupMateri: 'Ketaatan Yesus kepada Maria dan Yosef di Nazaret, peristiwa dipersembahkan di Bait Allah, dan Yesus di Bait Allah pada umur 12 tahun',
        rumusanTP: 'Peserta didik mampu meneladani sikap masa kanak-kanak Yesus yang taat kepada orang tua di Nazaret dan tekun mendengarkan pengajaran di Bait Allah.',
        indikatorKetercapaian: 'Dapat menceritakan keteladanan Yesus berbakti kepada orang tua dan kebiasaan berdoa di rumah ibadah.',
        alokasiJP: 7,
      },
    ];
  }

  // 3. Gereja Fase A
  if (
    lowerElemen.includes('gereja') &&
    (lowerCP.includes('tanda salib') || lowerCP.includes('bapa kami') || (fase === 'Fase A' && lowerCP.includes('salam maria')))
  ) {
    return [
      {
        kompetensi: 'Mempraktikkan Tanda Salib dan Doa-Doa Pokok Katolik',
        lingkupMateri: 'Sikap doa yang hening, membuat Tanda Salib yang benar dan khidmat, melafalkan doa Bapa Kami, Salam Maria, dan Kemuliaan',
        rumusanTP: 'Peserta didik mampu memahami imannya dengan mempraktikkan tanda salib secara khidmat serta melafalkan doa Bapa Kami, Salam Maria, dan Kemuliaan dengan lancar.',
        indikatorKetercapaian: 'Dapat membuat tanda salib dengan tangan kanan menyentuh dahi, dada, bahu kiri dan kanan serta berdoa Bapa Kami bersama teman.',
        alokasiJP: 10,
      },
      {
        kompetensi: 'Melaksanakan Perintah Allah dalam Kehidupan Sehari-hari',
        lingkupMateri: 'Hukum Kasih: Mengasihi Tuhan Allah dan mengasihi sesama manusia seperti diri sendiri',
        rumusanTP: 'Peserta didik mampu memahami iman dengan melaksanakan perintah Allah melalui tindakan kasih dan ketaatan kepada orang tua dan guru.',
        indikatorKetercapaian: 'Dapat memberikan 2 contoh perbuatan kasih kepada teman di kelas yang sedang membutuhkan pertolongan.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Membiasakan Diri Berdoa Pujian, Syukur, dan Permohonan',
        lingkupMateri: 'Ragam doa anak: doa pujian atas keagungan Tuhan, doa syukur atas makanan/keluarga, dan doa permohonan perlindungan',
        rumusanTP: 'Peserta didik mampu membiasakan diri berdoa secara spontan untuk memuji Tuhan, bersyukur atas berkat-Nya, dan memohon pertolongan dalam rutinitas sehari-hari.',
        indikatorKetercapaian: 'Dapat memimpin doa sebelum makan atau doa sebelum belajar dengan kata-kata santun dan tulus.',
        alokasiJP: 9,
      },
    ];
  }

  // 4. Masyarakat Fase A
  if (
    lowerElemen.includes('masyarakat') &&
    (lowerCP.includes('lingkungan keluarga') || (fase === 'Fase A' && lowerCP.includes('rukun dengan tetangga')))
  ) {
    return [
      {
        kompetensi: 'Bekerja Sama dengan Keluarga dan Teman Sebaya',
        lingkupMateri: 'Kebiasaan tolong-menolong di rumah (merapikan tempat tidur, membantu orang tua) dan bermain adil bersama teman sekolah',
        rumusanTP: 'Peserta didik mampu memahami peran lingkungan keluarga dan membiasakan diri bekerja sama secara harmonis dengan anggota keluarga serta teman sebaya.',
        indikatorKetercapaian: 'Dapat menceritakan pengalaman membantu ibu/ayah di rumah dan berbagi mainan dengan teman tanpa bertengkar.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Mewujudkan Hidup Rukun dengan Tetangga di Sekitar',
        lingkupMateri: 'Sikap ramah, menyapa tetangga, menghormati perbedaan suku/agama tetangga, dan menjenguk tetangga yang sakit',
        rumusanTP: 'Peserta didik mampu mewujudkan nilai iman di tengah masyarakat melalui kebiasaan hidup rukun, saling menyapa, dan santun dengan tetangga.',
        indikatorKetercapaian: 'Dapat mendemonstrasikan cara menyapa tetangga dengan senyum, salam, dan sapa yang ramah.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Bergotong Royong Merawat Lingkungan Hidup Ciptaan Tuhan',
        lingkupMateri: 'Membuang sampah pada tempatnya, menyiram tanaman, memelihara keindahan pekarangan rumah dan kelas',
        rumusanTP: 'Peserta didik mampu bergotong royong merawat lingkungan alam di sekitarnya sebagai wujud nyata tanggung jawab memelihara ciptaan Allah.',
        indikatorKetercapaian: 'Dapat aktif membersihkan ruang kelas dan merawat tanaman hias di sekolah dengan gembira.',
        alokasiJP: 9,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE B (KELAS III & IV)
  // Sesuai Regulasi Standar Capaian Pembelajaran BKP No. 20/2026
  // =========================================================================
  // 1. Pribadi Murid Fase B
  if (
    lowerElemen.includes('pribadi') &&
    (lowerCP.includes('tumbuh dan berkembang') || lowerCP.includes('pribadi yang unik') || (fase === 'Fase B' && lowerCP.includes('mengembangkan keunikan')))
  ) {
    return [
      {
        kompetensi: 'Memahami Pertumbuhan dan Perkembangan Diri',
        lingkupMateri: 'Proses tumbuh kembang jasmani dan rohani, perbedaan kemampuan, dan rasa syukur atas anugerah kehidupan',
        rumusanTP: 'Peserta didik mampu memahami dirinya sebagai pribadi yang terus tumbuh dan berkembang secara sehat dalam kasih karunia Tuhan.',
        indikatorKetercapaian: 'Dapat membandingkan kemampuan dirinya saat kelas 1 dengan saat ini serta merawat tubuhnya dengan pola hidup sehat.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Mewujudkan Iman melalui Perbuatan Baik Sehari-hari',
        lingkupMateri: 'Perbuatan baik sebagai buah iman: kejujuran, disiplin, peduli sesama yang membutuhkan, dan sikap pemaaf',
        rumusanTP: 'Peserta didik mampu mewujudkan iman kristiani secara konkret melalui perbuatan baik dan kebajikan moral dalam interaksi sehari-hari.',
        indikatorKetercapaian: 'Dapat menceritakan 2 tindakan nyata menolong teman yang kesulitan dan menghindari berkata bohong.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Bersyukur dan Mengembangkan Keunikan Diri Bersama Orang Lain',
        lingkupMateri: 'Keunikan talenta diri, saling melengkapi dengan keterbatasan teman, dan kolaborasi positif di lingkungan sekolah',
        rumusanTP: 'Peserta didik mampu memahami diri sebagai pribadi yang unik, bersyukur kepada Tuhan, dan bersedia mengembangkan keunikan potensinya bersama orang lain dan lingkungan sekitar.',
        indikatorKetercapaian: 'Dapat menampilkan bakat uniknya (bernyanyi, melukis, berpuisi, atau olahraga) dan menghargai talenta teman lain.',
        alokasiJP: 9,
      },
    ];
  }

  // 2. Yesus Kristus Fase B
  if (
    lowerElemen.includes('yesus') &&
    (lowerCP.includes('yusuf, musa, dan yosua') || lowerCP.includes('sepuluh perintah allah') || lowerCP.includes('samuel, saul, dan daud') || (fase === 'Fase B' && lowerCP.includes('pemenuhan janji allah')))
  ) {
    return [
      {
        kompetensi: 'Memahami Karya Keselamatan Allah Melalui Yusuf, Musa, dan Yosua',
        lingkupMateri: 'Kisah pengampunan Yusuf kepada saudara-saudaranya di Mesir, Musa membebaskan bangsa Israel dari perbudakan, dan keberanian Yosua',
        rumusanTP: 'Peserta didik mampu memahami karya keselamatan Allah yang agung melalui kisah kepemimpinan dan keteladanan iman tokoh Yusuf, Musa, dan Yosua.',
        indikatorKetercapaian: 'Dapat menceritakan bagaimana Yusuf membalas kejahatan dengan kebaikan dan bagaimana Allah menuntun Musa membelah Laut Teberau.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Menghayati Sepuluh Perintah Allah sebagai Pedoman Hidup',
        lingkupMateri: 'Sepuluh Perintah Allah (Dekalog): relasi kasih kepada Allah (perintah 1-3) dan relasi kasih kepada sesama (perintah 4-10)',
        rumusanTP: 'Peserta didik mampu memahami dan menghayati Sepuluh Perintah Allah sebagai kompas dan pedoman moral utama dalam kehidupan beriman kristiani.',
        indikatorKetercapaian: 'Dapat menyebutkan bunyi Sepuluh Perintah Allah secara berurutan dan mengidentifikasi penerapannya di sekolah.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Bangsa Israel Memasuki Tanah Terjanji dan Para Pemimpin Israel',
        lingkupMateri: 'Penyertaan Allah di tanah Kanaan, panggilan Nabi Samuel yang taat mendengar Tuhan, Raja Saul, dan kepemimpinan Raja Daud',
        rumusanTP: 'Peserta didik mampu memahami penyertaan Allah saat bangsa Israel memasuki tanah terjanji serta bagaimana Allah memberkati para pemimpin Israel (Samuel, Saul, dan Daud).',
        indikatorKetercapaian: 'Dapat menceritakan keteladanan Samuel menjawab "Berbicaralah Tuhan, hamba-Mu mendengarkan" dan keberanian Daud melawan Goliat.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Yesus sebagai Pemenuhan Janji Allah yang Mewartakan Kerajaan Allah',
        lingkupMateri: 'Yesus Sang Mesias pemenuhan janji nabi, pewartaan Kerajaan Allah melalui sabda bahagia, perumpamaan orang Samaria yang murah hati, dan mukjizat kasih',
        rumusanTP: 'Peserta didik mampu memahami Yesus Kristus sebagai pemenuhan janji keselamatan Allah yang mewartakan Kerajaan Allah melalui perkataan, perbuatan, dan mukjizat-Nya.',
        indikatorKetercapaian: 'Dapat menceritakan 1 perumpamaan Yesus dan 1 kisah mukjizat penyembuhan yang dilakukan Yesus bagi orang miskin/sakit.',
        alokasiJP: 6,
      },
    ];
  }

  // 3. Gereja Fase B
  if (
    lowerElemen.includes('gereja') &&
    (lowerCP.includes('sakramen baptis') || (fase === 'Fase B' && (lowerCP.includes('sakramen ekaristi') || lowerCP.includes('sakramen tobat'))))
  ) {
    return [
      {
        kompetensi: 'Memahami Sakramen Inisiasi dan Penyembuhan (Baptis, Ekaristi, Tobat)',
        lingkupMateri: 'Makna Sakramen Baptis (pintu gerbang iman), Sakramen Ekaristi (makan Tubuh dan Darah Kristus), dan Sakramen Tobat/Rekonsiliasi (kerahiman Allah)',
        rumusanTP: 'Peserta didik mampu memahami makna dan rahmat yang diterima melalui Sakramen Baptis, Sakramen Ekaristi, dan Sakramen Tobat dalam tradisi suci Gereja Katolik.',
        indikatorKetercapaian: 'Dapat menjelaskan simbol lilin dan air pada baptis, arti komuni kudus pada perayaan ekaristi, dan tahapan mengaku dosa dengan sungguh-sungguh.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Mengungkapkan Rasa Syukur dalam Doa Pribadi dan Doa Bersama',
        lingkupMateri: 'Praksis doa pribadi di kamar hening, doa bersama dalam keluarga (Doa Meja, Doa Malam), dan doa lingkungan/stasi',
        rumusanTP: 'Peserta didik mampu mengungkapkan rasa syukur mendalam kepada Allah Bapa melalui kebiasaan doa pribadi dan doa bersama keluarga serta komunitas Gereja.',
        indikatorKetercapaian: 'Dapat menyusun teks doa syukur pribadi secara tertulis dan mendoakannya dengan khidmat di depan kelas.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Mewujudkan Makna Doa melalui Sikap dan Tindakan Sehari-hari',
        lingkupMateri: 'Doa yang menggerakkan hati: sabar, rendah hati, suka menolong, tekun belajar, dan menjauhkan rasa iri dengki',
        rumusanTP: 'Peserta didik mampu mewujudkan makna doa dalam tindakan konkret sehari-hari sehingga kata dan perbuatannya menjadi kesaksian iman yang hidup.',
        indikatorKetercapaian: 'Dapat menunjukkan sikap tenang, ramah, dan saling menolong sebagai cerminan anak yang rajin berdoa.',
        alokasiJP: 9,
      },
    ];
  }

  // 4. Masyarakat Fase B
  if (
    lowerElemen.includes('masyarakat') &&
    (lowerCP.includes('menghormati pemimpin masyarakat') || lowerCP.includes('tradisi masyarakat') || (fase === 'Fase B' && lowerCP.includes('menghormati orang tua')))
  ) {
    return [
      {
        kompetensi: 'Menghormati Pemimpin Masyarakat dan Menghargai Tradisi Budaya Lokal',
        lingkupMateri: 'Ketaatan pada tata tertib masyarakat, menghormati ketua RT/RW/Kepala Desa, dan mengapresiasi upacara adat serta tradisi luhur setempat',
        rumusanTP: 'Peserta didik mampu mewujudkan imannya di tengah masyarakat melalui kebiasaan menghormati para pemimpin masyarakat dan menghargai keragaman tradisi budaya lokal.',
        indikatorKetercapaian: 'Dapat menyebutkan peran pemimpin warga di lingkungannya dan memberikan contoh sikap santun terhadap tokoh masyarakat.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Melestarikan Lingkungan Alam Ciptaan Tuhan (Laudato Si)',
        lingkupMateri: 'Bumi sebagai rumah bersama (Laudato Si\'), menghemat pemakaian air dan listrik, gerakan memilah sampah, dan menanam pohon',
        rumusanTP: 'Peserta didik mampu berperan aktif melestarikan lingkungan alam ciptaan Tuhan demi keberlangsungan hidup seluruh makhluk.',
        indikatorKetercapaian: 'Dapat memilah sampah organik dan non-organik di sekolah serta membuat poster ajakan menjaga kelestarian alam.',
        alokasiJP: 9,
      },
      {
        kompetensi: 'Menghormati Orang Tua, Hidup Pribadi, dan Milik Orang Lain',
        lingkupMateri: 'Penerapan Perintah Kehormatan: berbakti kepada orang tua, menghormati privasi sesama, serta menjaga kejujuran terhadap hak milik orang lain',
        rumusanTP: 'Peserta didik mampu mewujudkan rasa hormat mendalam terhadap orang tua, menghormati batas hidup pribadi sesama, dan tidak mengambil barang milik orang lain.',
        indikatorKetercapaian: 'Dapat mengembalikan barang temuan kepada pemiliknya dan mendengarkan nasihat ayah dan ibu dengan patuh.',
        alokasiJP: 9,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE C (KELAS V & VI)
  // Sesuai Regulasi Standar Capaian Pembelajaran BKP No. 20/2026
  // =========================================================================
  // 1. Pribadi Murid Fase C
  if (
    lowerElemen.includes('pribadi') &&
    (lowerCP.includes('perempuan atau laki-laki') || lowerCP.includes('citra allah') || (fase === 'Fase C' && lowerCP.includes('warga dunia')))
  ) {
    return [
      {
        kompetensi: 'Memahami Diri sebagai Perempuan atau Laki-Laki Citra Allah yang Sederajat dan Saling Melengkapi',
        lingkupMateri: 'Perempuan atau laki-laki sebagai citra Allah yang sederajat, saling melengkapi, dan bersyukur atas martabat luhur',
        rumusanTP: 'Peserta didik mampu memahami diri sebagai perempuan atau laki-laki sebagai citra Allah yang sederajat dan saling melengkapi.',
        indikatorKetercapaian: 'Dapat menjelaskan bahwa perempuan dan laki-laki diciptakan sederajat sebagai citra Allah serta menunjukkan sikap saling melengkapi dan menghormati.',
        alokasiJP: 12,
      },
      {
        kompetensi: 'Memahami Hak dan Kewajiban sebagai Warga Negara Indonesia dan Warga Dunia',
        lingkupMateri: 'Hak dan kewajiban diri sebagai warga negara, kebanggaan sebagai bangsa Indonesia, dan kesadaran sebagai warga dunia',
        rumusanTP: 'Peserta didik mampu memahami hak dan kewajiban dirinya sebagai warga negara, memiliki rasa bangga sebagai bangsa Indonesia, serta memahami diri sebagai warga dunia.',
        indikatorKetercapaian: 'Dapat mengidentifikasi hak dan kewajiban sebagai warga negara Indonesia serta menunjukkan rasa bangga berbangsa Indonesia dan bersikap terbuka sebagai warga dunia.',
        alokasiJP: 12,
      },
    ];
  }

  // 2. Yesus Kristus Fase C
  if (
    lowerElemen.includes('yesus') &&
    (lowerCP.includes('daud sebagai pemimpin') || lowerCP.includes('daud, salomo') || lowerCP.includes('nabi elia') || (fase === 'Fase C' && lowerCP.includes('ester')))
  ) {
    return [
      {
        kompetensi: 'Memahami Perjuangan Tokoh-Tokoh Kitab Suci (Daud, Salomo, Ester, Maria, dan Elisabet)',
        lingkupMateri: 'Daud pemimpin yang tangguh, Salomo yang bijaksana, Ester perempuan pemberani, serta kesetiaan dan kepasrahan Maria dan Elisabet kepada Allah',
        rumusanTP: 'Peserta didik mampu memahami perjuangan tokoh-tokoh Kitab Suci: Daud sebagai pemimpin yang tangguh, Salomo yang bijaksana, Ester perempuan pemberani, serta tokoh Maria dan Elisabet yang setia dan berserah kepada Allah.',
        indikatorKetercapaian: 'Dapat menceritakan keteladanan Daud, hikmat Salomo, keberanian Ester, dan kesetiaan Maria serta Elisabet dalam menanggapi rencana Allah.',
        alokasiJP: 6,
      },
      {
        kompetensi: 'Meneladani Yesus yang Taat kepada Allah dan Mengajarkan Pengampunan',
        lingkupMateri: 'Ketaatan Yesus kepada kehendak Allah Bapa, ajaran pengampunan tanpa batas, dan panggilan pertobatan bagi orang berdosa',
        rumusanTP: 'Peserta didik mampu meneladani Yesus yang taat kepada Allah, mengajarkan pengampunan, dan memanggil orang berdosa untuk bertobat.',
        indikatorKetercapaian: 'Dapat memaparkan teladan ketaatan Yesus serta mempraktikkan sikap saling memaafkan dan menjauhi dendam dalam pergaulan sehari-hari.',
        alokasiJP: 6,
      },
      {
        kompetensi: 'Menghayati Sengsara, Wafat, Kebangkitan Yesus, dan Pengutusan Roh Kudus',
        lingkupMateri: 'Peristiwa Yesus menderita, wafat di salib, bangkit mulia, serta mengutus Roh Kudus menguatkan para rasul dan orang beriman',
        rumusanTP: 'Peserta didik mampu menghayati misteri Yesus yang menderita, wafat, dan bangkit, serta mengutus Roh Kudus untuk menguatkan para rasul dan orang yang beriman kepada-Nya.',
        indikatorKetercapaian: 'Dapat menceritakan makna peristiwa Paskah dan bagaimana Roh Kudus mendampingi para rasul dan orang beriman untuk mewartakan Injil.',
        alokasiJP: 6,
      },
      {
        kompetensi: 'Memahami Perjuangan Para Nabi dan Pewartaan Kerajaan Allah oleh Yesus',
        lingkupMateri: 'Perjuangan Nabi Elia menobatkan bangsa Israel, Nabi Amos pejuang keadilan, nubuat Nabi Yesaya tentang Juru Selamat, dan Yesus mewartakan Kerajaan Allah dengan perkataan dan perbuatan',
        rumusanTP: 'Peserta didik mampu memahami perjuangan Nabi Elia yang menobatkan bangsa Israel, Nabi Amos sebagai pejuang keadilan, Nabi Yesaya yang menubuatkan kedatangan Juru Selamat, serta Yesus yang mewartakan Kerajaan Allah dengan perkataan dan perbuatan.',
        indikatorKetercapaian: 'Dapat menguraikan pokok nubuat para nabi serta memberikan contoh pewartaan Kerajaan Allah oleh Yesus melalui perkataan dan perbuatan kasih-Nya.',
        alokasiJP: 6,
      },
    ];
  }

  // 3. Gereja Fase C
  if (
    lowerElemen.includes('gereja') &&
    (lowerCP.includes('mewujudkan iman dalam kehidupan sehari-hari') || lowerCP.includes('persekutuan para kudus') || (fase === 'Fase C' && (lowerCP.includes('satu, kudus, katolik') || lowerCP.includes('menggereja'))))
  ) {
    return [
      {
        kompetensi: 'Mewujudkan Iman Sehari-Hari dan Melibatkan Diri dalam Kehidupan Menggereja',
        lingkupMateri: 'Perwujudan iman dalam tindakan sehari-hari, keterlibatan aktif dalam kehidupan menggereja sebagai persekutuan yang dijiwai Roh Kudus',
        rumusanTP: 'Peserta didik mampu mewujudkan iman dalam kehidupan sehari-hari dan melibatkan diri dalam kehidupan menggereja sebagai wujud kehidupan bersama yang dijiwai oleh Roh Kudus.',
        indikatorKetercapaian: 'Dapat aktif terlibat dalam doa bersama, perayaan ekaristi/liturgi sekolah, dan kegiatan pelayanan kasih Gereja.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Memahami Sifat-Sifat Gereja yang Satu, Kudus, Katolik, dan Apostolik',
        lingkupMateri: 'Empat sifat hakiki Gereja Katolik: Satu dalam iman dan pimpinan, Kudus karena Kristus, Katolik merangkul segala bangsa, dan Apostolik berakar pada ajaran para rasul',
        rumusanTP: 'Peserta didik mampu memahami hakikat Gereja yang satu, kudus, katolik, dan apostolik dalam bimbingan Roh Kudus.',
        indikatorKetercapaian: 'Dapat menyebutkan dan menjelaskan makna masing-masing dari 4 sifat Gereja Katolik secara benar.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Memahami Persekutuan Para Kudus, Pengampunan Dosa, Kebangkitan Badan, dan Kehidupan Kekal',
        lingkupMateri: 'Syahadat Para Rasul: persekutuan para kudus, kerahiman pengampunan dosa Allah, pengharapan kebangkitan badan, dan hidup kekal di surga',
        rumusanTP: 'Peserta didik mampu memahami ajaran iman tentang persekutuan para kudus, pengampunan dosa, kebangkitan badan, dan kehidupan kekal.',
        indikatorKetercapaian: 'Dapat menguraikan doa Aku Percaya (Kredo) dan menghayati teladan orang-orang kudus (Santo/Santa) dalam kehidupannya.',
        alokasiJP: 8,
      },
    ];
  }

  // 4. Masyarakat Fase C
  if (
    lowerElemen.includes('masyarakat') &&
    (lowerCP.includes('pelestarian lingkungan') || lowerCP.includes('menegakkan keadilan') || (fase === 'Fase C' && lowerCP.includes('dialog antarumat beragama')))
  ) {
    return [
      {
        kompetensi: 'Terlibat Aktif dalam Pelestarian Lingkungan Hidup Ciptaan Tuhan',
        lingkupMateri: 'Pelestarian alam semesta rumah bersama, peduli lingkungan hidup, mengelola sampah, penghijauan sekolah, dan hemat energi',
        rumusanTP: 'Peserta didik mampu memahami pentingnya dan terlibat aktif dalam pelestarian lingkungan hidup sebagai perwujudan tanggung jawab iman merawat ciptaan Tuhan.',
        indikatorKetercapaian: 'Dapat mempraktikkan tindakan nyata merawat tanaman sekolah, membuang sampah pada tempatnya, dan menjaga kebersihan lingkungan.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Bersikap Jujur, Bertindak Menurut Hati Nurani, dan Menegakkan Keadilan Sehari-Hari',
        lingkupMateri: 'Kejujuran moral, suara hati nurani yang murni, menegakkan keadilan dan kebenaran sebagai murid Kristus, serta membela yang lemah',
        rumusanTP: 'Peserta didik mampu bersikap jujur, bertindak menurut bisikan hati nurani, dan menegakkan keadilan dalam kehidupan sehari-hari sebagai orang beriman Kristiani.',
        indikatorKetercapaian: 'Dapat menunjukkan sikap jujur saat ulangan, berani mengakui kesalahan, dan membela teman yang diperlakukan tidak adil.',
        alokasiJP: 8,
      },
      {
        kompetensi: 'Membangun Persaudaraan dan Melakukan Dialog Antarumat Beragama',
        lingkupMateri: 'Moderasi beragama, persaudaraan sejati lintas iman, toleransi aktif, saling menghargai perayaan hari raya agama lain, dan hidup rukun berdampingan',
        rumusanTP: 'Peserta didik mampu melakukan dialog dan menjalin persaudaraan sejati antarumat beragama dalam kehidupan bermasyarakat.',
        indikatorKetercapaian: 'Dapat memberikan contoh sikap ramah, santun, dan saling menghormati dengan sesama teman dari berbagai agama dan kepercayaan.',
        alokasiJP: 8,
      },
    ];
  }

  // =========================================================================
  // PENDIDIKAN AGAMA KRISTEN DAN BUDI PEKERTI (Regulasi BKP No. 020/2026)
  // =========================================================================
  // FASE A
  // 1. Allah Berkarya Fase A
  if (
    lowerElemen.includes('allah berkarya') &&
    (fase === 'Fase A' || lowerCP.includes('pribadi yang istimewa') || lowerCP.includes('kehadiran keluarga'))
  ) {
    return [
      {
        kompetensi: 'Memahami Allah Menciptakan Dirinya sebagai Pribadi Istimewa',
        lingkupMateri: 'Allah Pencipta yang menjadikan setiap pribadi istimewa, unik, dan mampu berinteraksi positif dengan lingkungan terdekat',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah menciptakan dirinya sebagai pribadi yang istimewa serta membangun interaksi yang ramah dengan lingkungan terdekat.',
        indikatorKetercapaian: 'Dapat menceritakan keistimewaan dirinya sebagai ciptaan Allah dan menunjukkan interaksi yang baik dengan teman di sekitar.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Pemeliharaan Allah melalui Kehadiran Keluarga',
        lingkupMateri: 'Allah Pemelihara yang memelihara kehidupan manusia melalui kasih sayang, perhatian, dan bimbingan orang tua serta keluarga',
        rumusanTP: 'Peserta didik mampu memahami dan mensyukuri pemeliharaan Allah pada dirinya melalui kehadiran keluarga dalam kehidupan sehari-hari.',
        indikatorKetercapaian: 'Dapat menyebutkan wujud kasih sayang anggota keluarga dan mempraktikkan ungkapan terima kasih serta doa syukur atas keluarganya.',
        alokasiJP: 13,
      },
    ];
  }

  // 2. Manusia dan Nilai-nilai Kristiani Fase A
  if (
    (lowerElemen.includes('manusia') || lowerElemen.includes('nilai')) &&
    (fase === 'Fase A' || lowerCP.includes('bertumbuh dan berkembang') || lowerCP.includes('kebaikan, ramah'))
  ) {
    return [
      {
        kompetensi: 'Memahami Diri sebagai Pribadi yang Bertumbuh dan Berkembang',
        lingkupMateri: 'Hakikat manusia ciptaan Allah yang mengalami pertumbuhan fisik, akal budi, dan perkembangan emosional secara sehat',
        rumusanTP: 'Peserta didik mampu memahami dirinya sebagai pribadi yang senantiasa bertumbuh dan berkembang atas anugerah Allah.',
        indikatorKetercapaian: 'Dapat menceritakan perubahan kemampuan dirinya dari bayi hingga masa sekolah dasar dengan rasa syukur.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami dan Menerapkan Makna Kebaikan, Sikap Ramah, dan Sopan',
        lingkupMateri: 'Nilai-nilai Kristiani: berbuat kebaikan, bersikap ramah, berkata jujur, dan berperilaku sopan di lingkungan rumah dan sekolah',
        rumusanTP: 'Peserta didik mampu memahami makna tindakan kebaikan serta mempraktikkan sikap ramah dan sopan di rumah maupun di sekolah.',
        indikatorKetercapaian: 'Dapat membiasakan 5S (senyum, salam, sapa, sopan, santun) dan membantu teman yang membutuhkan dengan tulus.',
        alokasiJP: 13,
      },
    ];
  }

  // 3. Gereja dan Masyarakat Majemuk Fase A
  if (
    (lowerElemen.includes('gereja') || lowerElemen.includes('majemuk')) &&
    (fase === 'Fase A' || lowerCP.includes('wadah berkumpul') || lowerCP.includes('keragaman suku'))
  ) {
    return [
      {
        kompetensi: 'Memahami Keberadaan Gereja, Berdoa, dan Memuji Tuhan',
        lingkupMateri: 'Tugas panggilan gereja sebagai persekutuan orang percaya, wadah ibadah bersama, serta pembiasaan doa dan puji-pujian kepada Tuhan',
        rumusanTP: 'Peserta didik mampu memahami keberadaan gereja sebagai wadah berkumpul dan beribadah serta membiasakan diri tekun berdoa dan memuji Tuhan.',
        indikatorKetercapaian: 'Dapat menyanyikan lagu pujian rohani anak dan mempraktikkan sikap doa yang khidmat dalam ibadah sekolah/gereja.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Keragaman Suku Bangsa sebagai Anugerah Allah',
        lingkupMateri: 'Masyarakat majemuk: keragaman suku bangsa, bahasa daerah, dan kebiasaan di Indonesia sebagai kekayaan anugerah Allah yang indah',
        rumusanTP: 'Peserta didik mampu memahami keragaman suku bangsa di sekitarnya sebagai anugerah Allah dan hidup rukun bersama sesama.',
        indikatorKetercapaian: 'Dapat menyebutkan beragam suku teman di kelasnya dan menunjukkan sikap mau berteman tanpa membeda-bedakan asal daerah.',
        alokasiJP: 13,
      },
    ];
  }

  // 4. Alam dan Lingkungan Hidup Fase A
  if (
    (lowerElemen.includes('alam') || lowerElemen.includes('lingkungan')) &&
    (fase === 'Fase A' || lowerCP.includes('lingkungan hidup sebagai ciptaan') || lowerCP.includes('memelihara alam dan lingkungan hidup di rumah'))
  ) {
    return [
      {
        kompetensi: 'Memahami Alam dan Lingkungan Hidup sebagai Ciptaan Allah',
        lingkupMateri: 'Keindahan alam ciptaan Allah: langit, bumi, tanaman, dan hewan yang diciptakan Allah untuk kelangsungan hidup manusia',
        rumusanTP: 'Peserta didik mampu memahami alam dan lingkungan hidup sekitar sebagai karya agung ciptaan Allah yang patut disyukuri.',
        indikatorKetercapaian: 'Dapat menyebutkan berbagai ciptaan Allah di sekitarnya dan mengungkapkan kekaguman atas keindahan ciptaan Tuhan.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Tugas Memelihara Alam dan Lingkungan di Rumah dan Sekolah',
        lingkupMateri: 'Tanggung jawab manusia terhadap alam: menjaga kebersihan kelas, membuang sampah pada tempatnya, dan merawat tanaman di rumah dan sekolah',
        rumusanTP: 'Peserta didik mampu memahami dan menjalankan tugas memelihara alam serta kebersihan lingkungan hidup di rumah dan di sekolah.',
        indikatorKetercapaian: 'Dapat mempraktikkan tindakan nyata menyiram tanaman, memilah sampah, dan merapikan ruang kelas secara bertanggung jawab.',
        alokasiJP: 13,
      },
    ];
  }

  // FASE B
  // 1. Allah Berkarya Fase B
  if (
    lowerElemen.includes('allah berkarya') &&
    (fase === 'Fase B' || lowerCP.includes('flora dan fauna') || lowerCP.includes('allah pembaru') || lowerCP.includes('penyelamat'))
  ) {
    return [
      {
        kompetensi: 'Memahami Allah Menciptakan Flora, Fauna, dan Manusia (Perempuan dan Laki-Laki)',
        lingkupMateri: 'Kemahakuasaan Allah Sang Pencipta dalam menciptakan keanekaragaman flora, fauna, serta manusia perempuan dan laki-laki yang sederajat',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah menciptakan flora, fauna, serta manusia perempuan dan laki-laki dengan martabat yang setara.',
        indikatorKetercapaian: 'Dapat menjelaskan keterkaitan harmonis antara flora, fauna, dan manusia serta menghormati kesetaraan perempuan dan laki-laki.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Pemeliharaan Allah melalui Kehadiran Orang-Orang di Sekitarnya',
        lingkupMateri: 'Pemeliharaan Allah yang hadir melalui peran orang tua, guru, sahabat, dan tetangga yang saling memperhatikan dan mengasihi',
        rumusanTP: 'Peserta didik mampu memahami dan mensyukuri pemeliharaan Allah pada dirinya melalui kehadiran orang-orang di sekitarnya.',
        indikatorKetercapaian: 'Dapat menyebutkan peran nyata orang-orang di sekitarnya yang mencerminkan pemeliharaan dan kasih Allah.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami dan Mengimani Allah sebagai Penyelamat',
        lingkupMateri: 'Karya keselamatan Allah bagi manusia: pertolongan Allah di saat kesulitan dan pemenuhan janji keselamatan bagi umat beriman',
        rumusanTP: 'Peserta didik mampu memahami hakikat Allah sebagai Penyelamat hidup manusia dan menaruh pengharapan teguh kepada-Nya.',
        indikatorKetercapaian: 'Dapat menceritakan kisah pertolongan Allah dalam Alkitab dan mengaitkannya dengan pengalaman hidupnya.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Mengenal dan Meneladani Allah sebagai Pembaru Hidup',
        lingkupMateri: 'Allah Pembaru: kuasa pembaruan Allah yang mengubah hati, sikap, dan pola pikir manusia menjadi semakin baik dan benar',
        rumusanTP: 'Peserta didik mampu mengenal Allah sebagai Pembaru yang membimbing manusia untuk senantiasa memperbaiki diri.',
        indikatorKetercapaian: 'Dapat mengidentifikasi perilaku lama yang buruk untuk diubah menjadi perilaku baru yang memuliakan Allah.',
        alokasiJP: 6,
      },
    ];
  }

  // 2. Manusia dan Nilai-nilai Kristiani Fase B
  if (
    (lowerElemen.includes('manusia') || lowerElemen.includes('nilai')) &&
    (fase === 'Fase B' || lowerCP.includes('makhluk individu dan sosial') || lowerCP.includes('disiplin di rumah'))
  ) {
    return [
      {
        kompetensi: 'Memahami Diri sebagai Makhluk Individu dan Sosial yang Bekerja Sama',
        lingkupMateri: 'Hakikat manusia sebagai makhluk individu yang mandiri sekaligus makhluk sosial yang membutuhkan teman, saudara, dan orang tua',
        rumusanTP: 'Peserta didik mampu memahami diri sebagai makhluk individu dan sosial yang dapat bergaul dan bekerja sama dengan teman, saudara, dan orang tua.',
        indikatorKetercapaian: 'Dapat bekerja sama secara aktif dalam kelompok belajar dan menunjukkan sikap saling tolong-menolong tanpa pamrih.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami dan Menerapkan Sikap Disiplin di Rumah dan Sekolah',
        lingkupMateri: 'Nilai-nilai Kristiani: sikap disiplin waktu, tertib belajar, ketaatan pada aturan, dan tanggung jawab moral di rumah dan sekolah',
        rumusanTP: 'Peserta didik mampu memahami pentingnya sikap disiplin dan membiasakannya dalam aktivitas di rumah serta di sekolah.',
        indikatorKetercapaian: 'Dapat mematuhi jadwal harian, menyelesaikan tugas sekolah tepat waktu, dan mematuhi tata tertib dengan kesadaran sendiri.',
        alokasiJP: 13,
      },
    ];
  }

  // 3. Gereja dan Masyarakat Majemuk Fase B
  if (
    (lowerElemen.includes('gereja') || lowerElemen.includes('majemuk')) &&
    (fase === 'Fase B' || lowerCP.includes('bersekutu, bersaksi, dan melayani') || lowerCP.includes('budaya dan agama sebagai'))
  ) {
    return [
      {
        kompetensi: 'Memahami Tugas Panggilan Gereja: Bersekutu, Bersaksi, dan Melayani',
        lingkupMateri: 'Tri tugas gereja: bersekutu (koinonia), bersaksi tentang kasih Kristus (marturia), dan melayani sesama dengan tulus (diakonia)',
        rumusanTP: 'Peserta didik mampu memahami tugas panggilan gereja untuk bersekutu, bersaksi, dan melayani dalam kehidupan nyata.',
        indikatorKetercapaian: 'Dapat menjelaskan arti persekutuan, kesaksian, dan pelayanan serta memberi contoh tindakan pelayanannya di lingkungan kelas/sekolah.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Keragaman Budaya dan Agama sebagai Anugerah Allah',
        lingkupMateri: 'Masyarakat majemuk: kemajemukan suku, bahasa, tradisi, dan agama di Indonesia sebagai kekayaan yang harus disyukuri dan dihormati',
        rumusanTP: 'Peserta didik mampu memahami keragaman budaya dan agama sebagai anugerah Allah yang indah serta menumbuhkan persaudaraan lintas batas.',
        indikatorKetercapaian: 'Dapat menghargai perbedaan tata cara ibadah dan budaya teman serta menunjukkan sikap toleran dalam pergaulan sehari-hari.',
        alokasiJP: 13,
      },
    ];
  }

  // 4. Alam dan Lingkungan Hidup Fase B
  if (
    (lowerElemen.includes('alam') || lowerElemen.includes('lingkungan')) &&
    (fase === 'Fase B' || lowerCP.includes('berbagai fenomena alam') || lowerCP.includes('memelihara alam dan lingkungan sekitarnya'))
  ) {
    return [
      {
        kompetensi: 'Memahami Kehadiran Allah dalam Berbagai Fenomena Alam',
        lingkupMateri: 'Kehadiran dan keagungan Allah yang terungkap lewat fenomena alam: pergantian musim, siklus air, pelangi, dan keteraturan kosmis',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah hadir dan menyatakan kemahakuasaan-Nya melalui berbagai macam fenomena alam.',
        indikatorKetercapaian: 'Dapat menguraikan bagaimana keteraturan alam mencerminkan hikmat dan pemeliharaan Allah bagi seluruh ciptaan.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami dan Melakukan Upaya Memelihara Alam dan Lingkungan Sekitar',
        lingkupMateri: 'Tanggung jawab manusia terhadap alam: konservasi lingkungan, penghematan energi, penghijauan, dan pencegahan kerusakan alam',
        rumusanTP: 'Peserta didik mampu memahami dan mempraktikkan upaya memelihara alam dan lingkungan sekitarnya secara berkelanjutan.',
        indikatorKetercapaian: 'Dapat memprakarsai kegiatan menanam tanaman obat/hias di sekolah dan mempraktikkan pengurangan limbah plastik.',
        alokasiJP: 13,
      },
    ];
  }

  // FASE C
  // 1. Allah Berkarya Fase C
  if (
    lowerElemen.includes('allah berkarya') &&
    (fase === 'Fase C' || lowerCP.includes('berkarya melalui keluarga, sekolah') || lowerCP.includes('berkebutuhan khusus') || lowerCP.includes('yesus kristus'))
  ) {
    return [
      {
        kompetensi: 'Memahami Allah Pencipta Berkarya melalui Keluarga, Sekolah, dan Masyarakat',
        lingkupMateri: 'Karya pemeliharaan dan penciptaan Allah yang berkesinambungan melalui peran keluarga, lingkungan sekolah, dan tatanan masyarakat',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah Pencipta berkarya nyata melalui keluarga, sekolah, dan masyarakat untuk kebaikan bersama.',
        indikatorKetercapaian: 'Dapat menganalisis peran konstruktif keluarga, guru di sekolah, dan warga masyarakat dalam mendukung pertumbuhan hidupnya.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Pemeliharaan Allah bagi Seluruh Umat Termasuk yang Berkebutuhan Khusus',
        lingkupMateri: 'Keadilan dan kasih pemeliharaan Allah yang inklusif tanpa membedakan kondisi fisik, mental, maupun mereka yang berkebutuhan khusus',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah memelihara seluruh umat manusia, termasuk mereka yang berkebutuhan khusus, dengan kasih yang sempurna.',
        indikatorKetercapaian: 'Dapat menunjukkan empati, penerimaan tulus, dan pembelaan terhadap martabat sesama teman yang berkebutuhan khusus.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Karya Penyelamatan Allah bagi Manusia melalui Yesus Kristus',
        lingkupMateri: 'Hakikat karya keselamatan: pengampunan dosa, kasih karunia, dan penebusan sejati yang dianugerahkan Allah dalam pribadi Yesus Kristus',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah menyelamatkan manusia dari kuasa dosa melalui pengorbanan dan kasih Yesus Kristus.',
        indikatorKetercapaian: 'Dapat menjelaskan makna pengorbanan Yesus Kristus di kayu salib dan menghayati keselamatan tersebut dalam doa dan pertobatan.',
        alokasiJP: 7,
      },
      {
        kompetensi: 'Memahami Karya Allah Membarui Hidup Manusia',
        lingkupMateri: 'Pembaruan hidup manusia oleh Roh Kudus: perubahan dari manusia lama yang berdosa menuju manusia baru yang hidup dalam kebenaran Allah',
        rumusanTP: 'Peserta didik mampu memahami bahwa Allah membarui hidup manusia untuk senantiasa hidup seturut firman-Nya.',
        indikatorKetercapaian: 'Dapat memberikan kesaksian hidup tentang perubahan sikap dari egois menjadi peduli dan taat kepada firman Tuhan.',
        alokasiJP: 6,
      },
    ];
  }

  // 2. Manusia dan Nilai-nilai Kristiani Fase C
  if (
    (lowerElemen.includes('manusia') || lowerElemen.includes('nilai')) &&
    (fase === 'Fase C' || lowerCP.includes('makhluk terbatas') || lowerCP.includes('buah roh'))
  ) {
    return [
      {
        kompetensi: 'Memahami Hakikat Manusia sebagai Makhluk Terbatas yang Membutuhkan Pertolongan Allah',
        lingkupMateri: 'Kejatuhan manusia dalam dosa, kerapuhan, keterbatasan akal dan daya manusia, serta kebutuhan mutlak akan pertolongan dan anugerah Allah',
        rumusanTP: 'Peserta didik mampu memahami bahwa manusia adalah makhluk terbatas yang bergantung sepenuhnya pada pertolongan Allah.',
        indikatorKetercapaian: 'Dapat merefleksikan keterbatasan dirinya dengan rendah hati dan membiasakan diri memohon hikmat Tuhan dalam setiap tantangan.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami dan Mewujudkan Buah Roh dalam Interaksi Antar Sesama',
        lingkupMateri: 'Buah Roh (kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, penguasaan diri) dalam pergaulan',
        rumusanTP: 'Peserta didik mampu memahami dan mewujudkan buah Roh dalam interaksi sehari-hari bersama sesama tanpa membeda-bedakan.',
        indikatorKetercapaian: 'Dapat menunjukkan sikap bersahabat, berbela rasa, dan tolong-menolong tanpa membeda-bedakan suku, agama, ras, dan antargolongan.',
        alokasiJP: 13,
      },
    ];
  }

  // 3. Gereja dan Masyarakat Majemuk Fase C
  if (
    (lowerElemen.includes('gereja') || lowerElemen.includes('majemuk')) &&
    (fase === 'Fase C' || lowerCP.includes('pelayanan terhadap sesama') || lowerCP.includes('hidup rukun dan toleransi'))
  ) {
    return [
      {
        kompetensi: 'Memahami Pelayanan terhadap Sesama sebagai Tanggung Jawab Orang Beriman',
        lingkupMateri: 'Panggilan pelayanan (diakonia): membela kaum lemah, aksi solidaritas, berbela rasa, dan kepedulian sosial sebagai bukti iman yang hidup',
        rumusanTP: 'Peserta didik mampu memahami pelayanan terhadap sesama sebagai wujud tanggung jawab dan panggilan hidup orang beriman.',
        indikatorKetercapaian: 'Dapat merancang dan berpartisipasi dalam aksi bakti sosial sederhana atau kepedulian sosial di lingkungan sekolah/masyarakat.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Hidup Rukun dan Toleransi dalam Masyarakat Majemuk',
        lingkupMateri: 'Toleransi aktif, moderasi beragama, merawat kerukunan, serta menolak segala bentuk diskriminasi dalam masyarakat majemuk Indonesia',
        rumusanTP: 'Peserta didik mampu memahami pentingnya hidup rukun, bertoleransi, dan merajut persaudaraan sejati dalam masyarakat majemuk.',
        indikatorKetercapaian: 'Dapat menyelesaikan perbedaan pendapat secara damai dan berkolaborasi harmonis dalam kegiatan bersama teman lintas agama/suku.',
        alokasiJP: 13,
      },
    ];
  }

  // 4. Alam dan Lingkungan Hidup Fase C
  if (
    (lowerElemen.includes('alam') || lowerElemen.includes('lingkungan')) &&
    (fase === 'Fase C' || lowerCP.includes('allah hadir melalui alam') || lowerCP.includes('tanggung jawab orang beriman dalam memelihara'))
  ) {
    return [
      {
        kompetensi: 'Memahami dan Menghayati Kehadiran Allah melalui Alam Ciptaan',
        lingkupMateri: 'Teologi penciptaan: alam semesta sebagai cermin kemuliaan, kebijaksanaan, dan keagungan Allah yang harus dijunjung tinggi',
        rumusanTP: 'Peserta didik mampu memahami dan menghayati kehadiran serta kebesaran Allah yang tercermin melalui alam semesta ciptaan-Nya.',
        indikatorKetercapaian: 'Dapat mengekspresikan kekaguman atas ciptaan Allah melalui tulisan reflektif atau karya seni lingkungan hidup.',
        alokasiJP: 14,
      },
      {
        kompetensi: 'Memahami Tanggung Jawab Orang Beriman dalam Memelihara Lingkungan Hidup',
        lingkupMateri: 'Mandat penatalayanan alam: mitigasi krisis iklim, pelestarian ekosistem, pencegahan eksploitasi, dan gaya hidup ramah lingkungan',
        rumusanTP: 'Peserta didik mampu memahami dan mewujudkan tanggung jawab orang beriman dalam memelihara serta menjaga kelestarian lingkungan hidup.',
        indikatorKetercapaian: 'Dapat menyusun rencana aksi nyata pengurangan jejak karbon sederhana, pemanfaatan daur ulang, dan perawatan ruang hijau sekolah.',
        alokasiJP: 13,
      },
    ];
  }

  // Step 2: Intelligent Generalized Clause & Competency Decomposer for custom or any other CP text
  // Split on:
  // - Semicolons ;
  // - Periods followed by space or newline
  // - Bullet points ●, •, -
  // - Lookahead for action verbs after commas or conjunctions: `, serta `, `, dan `, `; serta `, `; dan `
  const rawClauses = cleanText
    .split(/(?:;\s*serta\s+|;\s*dan\s+|,\s*serta\s+|,\s*dan\s+|;\s+|\n+|●|•|\*|(?<=\d\.\s+)|(?<=[.!?])\s+)/i)
    .map((c) => c.trim().replace(/^[-•*\d.]+\s*/, ''))
    .filter((c) => c.length > 8);

  const units: DeconstructedAtomicUnit[] = [];

  for (const clause of rawClauses) {
    // Check if clause contains multiple comma-separated action verbs (e.g. "membaca, menulis, membandingkan")
    const subSegments = clause
      .split(/(?<=[,])\s*(?=(?:menunjukkan|membaca|menulis|menentukan|membandingkan|mengurutkan|melakukan|menyelesaikan|mengubah|menemukan|mengidentifikasi|meniru|mengembangkan|bernalar|menggunakan|menghitung|mengukur|mengkonstruksi|mengonstruksi|mengurai|mengenali|menganalisis|menyajikan|menjelaskan|mempraktikkan|mendeskripsikan|merefleksikan|meninjau|membedakan|mengklasifikasikan|menghasilkan|merancang|menyelidiki)\b)/i)
      .map((s) => s.trim().replace(/^[,;\s]+/, '').replace(/[,;\s]+$/, ''))
      .filter((s) => s.length > 6);

    for (const seg of subSegments) {
      // Extract active verb
      const verbMatch = seg.match(/^(menunjukkan|membaca|menulis|menentukan|membandingkan|mengurutkan|melakukan|menyelesaikan|mengubah|menemukan|mengidentifikasi|meniru|mengembangkan|bernalar|menggunakan|menghitung|mengukur|mengkonstruksi|mengonstruksi|mengurai|mengenali|menganalisis|menyajikan|menjelaskan|mempraktikkan|mendeskripsikan|merefleksikan|meninjau|membedakan|mengklasifikasikan|menghasilkan|merancang|menyelidiki)\b/i);

      let verb = verbMatch ? verbMatch[1] : (fase === 'Fase A' ? 'Mengenal' : fase === 'Fase B' ? 'Menjelaskan' : 'Menganalisis');
      verb = verb.charAt(0).toUpperCase() + verb.slice(1);

      let topic = seg
        .replace(/^peserta didik\s+/i, '')
        .replace(/^(mampu|dapat|murid dapat|murid)\s+/i, '')
        .replace(new RegExp(`^${verb}\\s+`, 'i'), '')
        .trim();

      if (!topic || topic.length < 3) {
        topic = `konsep dan materi terkait ${elemenName}`;
      }

      // Title case for kompetensi label
      const kompetensiLabel = `${verb} ${topic.split(' ').slice(0, 3).join(' ')}`.trim();

      // Clean topic length
      if (topic.length > 110) {
        topic = topic.substring(0, 110).replace(/[,;]\s*$/, '') + '...';
      }

      units.push({
        kompetensi: kompetensiLabel.charAt(0).toUpperCase() + kompetensiLabel.slice(1),
        lingkupMateri: topic.charAt(0).toUpperCase() + topic.slice(1),
        rumusanTP: `Peserta didik mampu ${verb.toLowerCase()} ${topic} secara tepat, mandiri, dan kontekstual.`,
        indikatorKetercapaian: `Peserta didik dapat mendemonstrasikan penguasaan materi ${topic.toLowerCase()} melalui unjuk kerja dan penyelesaian soal secara terukur.`,
        alokasiJP: 4,
      });
    }
  }

  // If no units were detected (e.g. very short text), provide at least 2 granular fallback units
  if (units.length === 0) {
    const v1 = fase === 'Fase A' ? 'Mengenal' : fase === 'Fase B' ? 'Mengidentifikasi' : 'Menganalisis';
    const v2 = fase === 'Fase A' ? 'Mempraktikkan' : fase === 'Fase B' ? 'Menjelaskan' : 'Mengonstruksi';
    units.push(
      {
        kompetensi: `${v1} Konsep Dasar`,
        lingkupMateri: `Materi pokok ${elemenName}`,
        rumusanTP: `Peserta didik mampu ${v1.toLowerCase()} materi pokok ${elemenName} secara mandiri.`,
        indikatorKetercapaian: `Dapat mengidentifikasi fakta dan konsep penting pada ${elemenName}.`,
        alokasiJP: 4,
      },
      {
        kompetensi: `${v2} Penerapan Kontekstual`,
        lingkupMateri: `Penerapan dan pemecahan masalah terkait ${elemenName}`,
        rumusanTP: `Peserta didik mampu ${v2.toLowerCase()} konsep ${elemenName} dalam konteks kehidupan sehari-hari.`,
        indikatorKetercapaian: `Dapat memecahkan persoalan sederhana terkait ${elemenName} secara terampil.`,
        alokasiJP: 4,
      }
    );
  }

  return units;
}

/**
 * Generate Multi-Element TP Analysis from a Subject Folder containing multiple elements
 * Strictly implements 1:1 granular mapping: 1 competency x 1 content = 1 TP.
 */
export function generateMultiElementTPFallback(
  identitas: IdentityParam,
  elementList: Array<{ id?: string; elemen: string; capaianPembelajaran: string }>,
  preferensiTambahan?: string
) {
  const fase = identitas.fase || 'Fase B';
  const mapel = identitas.mataPelajaran || 'IPAS';
  const kelasOptions = fase === 'Fase A' ? ['1', '2'] : fase === 'Fase B' ? ['3', '4'] : ['5', '6'];

  const elemenRows: any[] = [];
  const allTPs: any[] = [];
  let globalTPIndex = 1;

  for (let elIdx = 0; elIdx < elementList.length; elIdx++) {
    const el = elementList[elIdx];
    const atomicUnits = deconstructCPToAtomicUnits(el.capaianPembelajaran, el.elemen, fase);

    const elementKompetensiList: string[] = [];
    const elementMateriList: string[] = [];
    const elementTPList: any[] = [];

    const totalUnits = atomicUnits.length;
    const midpoint = Math.ceil(totalUnits / 2);

    for (let uIdx = 0; uIdx < atomicUnits.length; uIdx++) {
      const unit = atomicUnits[uIdx];

      // Formulate numbered lists
      elementKompetensiList.push(`${uIdx + 1}. ${unit.kompetensi}`);
      elementMateriList.push(`${uIdx + 1}. ${unit.lingkupMateri}`);

      // Distribute classes across Fase: first half to grade 1, second half to grade 2 of Fase
      const targetKelas = kelasOptions[uIdx < midpoint ? 0 : 1];
      const kodeTP = `${targetKelas}.${globalTPIndex}`;
      const semester = uIdx < midpoint ? 'Semester 1' : 'Semester 2';

      const assignedDPL = [
        DPL_OPTIONS[(elIdx + uIdx) % DPL_OPTIONS.length],
        DPL_OPTIONS[(elIdx + uIdx + 2) % DPL_OPTIONS.length],
        DPL_OPTIONS[(elIdx + uIdx + 4) % DPL_OPTIONS.length],
      ];

      const tpObj = {
        id: `tp-${Date.now()}-${elIdx}-${uIdx + 1}`,
        kodeTP: kodeTP,
        elemen: el.elemen,
        kalimatCP: el.capaianPembelajaran,
        kompetensi: unit.kompetensi,
        lingkupMateri: unit.lingkupMateri,
        rumusanTP: formatTPWithCode(kodeTP, unit.rumusanTP),
        indikatorKetercapaian: unit.indikatorKetercapaian,
        alokasiJP: unit.alokasiJP || 4,
        dimensiP3: assignedDPL, // Minimal 3 DPL
        semesterTarget: semester,
        kelasTarget: targetKelas,
        kelasCentang: [targetKelas],
        urutanAlur: globalTPIndex,
      };

      elementTPList.push(tpObj);
      allTPs.push(tpObj);
      globalTPIndex++;
    }

    elemenRows.push({
      id: el.id || `row-el-${elIdx + 1}`,
      elemen: el.elemen,
      capaianPembelajaran: el.capaianPembelajaran,
      daftarKompetensi: elementKompetensiList,
      daftarLingkupMateri: elementMateriList,
      daftarTP: elementTPList,
    });
  }

  // Calibrate TP JP allocations to meet statutory intrakurikuler allocation of Permendikdasmen No. 13 Tahun 2025
  const k1 = kelasOptions[0];
  const k2 = kelasOptions[1];
  const statJP1 = getStatutoryJP(mapel, k1);
  const statJP2 = getStatutoryJP(mapel, k2);

  const k1TPs = allTPs.filter((t) => t.kelasTarget === k1);
  const k2TPs = allTPs.filter((t) => t.kelasTarget === k2);

  calibrateJPList(k1TPs, statJP1);
  calibrateJPList(k2TPs, statJP2);

  // Sync back to elemenRows
  elemenRows.forEach((row) => {
    row.daftarTP.forEach((tp: any) => {
      const matched = allTPs.find((f: any) => f.id === tp.id);
      if (matched) {
        tp.alokasiJP = matched.alokasiJP;
      }
    });
  });

  const isAgama = mapel.toLowerCase().includes('agama') || 
                  mapel.toLowerCase().includes('katolik') || 
                  mapel.toLowerCase().includes('kristen') || 
                  mapel.toLowerCase().includes('islam') || 
                  mapel.toLowerCase().includes('hindu') || 
                  mapel.toLowerCase().includes('buddha') || 
                  mapel.toLowerCase().includes('khonghucu') || 
                  mapel.toLowerCase().includes('pak') || 
                  mapel.toLowerCase().includes('pai');
  const regName = isAgama
    ? 'Regulasi Standar Capaian Pembelajaran BKP No. 020/2026'
    : 'Keputusan Kepala BSKAP No. 046 Tahun 2025';

  return {
    rasionalAnalisis: `Analisis Capaian Pembelajaran (CP) untuk seluruh elemen pada mata pelajaran ${mapel} (${fase}, Kelas ${kelasOptions.join(' & ')}) berdasarkan ${regName} didekonstruksi dengan prinsip 1:1 granular tanpa penggabungan (non-lumping), memetakan setiap kompetensi dan konten menjadi Tujuan Pembelajaran (TP) mandiri yang terukur.`,
    elemenRows,
    daftarKompetensi: elemenRows.flatMap((r) => r.daftarKompetensi),
    daftarLingkupMateri: elemenRows.flatMap((r) => r.daftarLingkupMateri),
    kelasTersedia: kelasOptions,
    daftarTP: allTPs,
  };
}

/**
 * Generate TP Analysis from Capaian Pembelajaran
 */
export function generatePedagogicalTPFallback(
  identitas: IdentityParam,
  elemen: string,
  capaianPembelajaran: string,
  preferensiTambahan?: string
) {
  const result = generateMultiElementTPFallback(
    identitas,
    [{ id: 'el-1', elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran }],
    preferensiTambahan
  );
  return result;
}

/**
 * Generate ATP 8 Parts (A - H) Document
 */
export function generatePedagogicalATPFallback(
  identitas: IdentityParam,
  elemen: string,
  capaianPembelajaran: string,
  tpList: TPItemParam[],
  preferensiTambahan?: string,
  elemenList?: Array<{ id?: string; elemen: string; capaianPembelajaran: string }>
) {
  const fase = identitas.fase || 'Fase B';
  const mapel = identitas.mataPelajaran || 'IPAS';
  const kelasOptions = fase === 'Fase A' ? ['1', '2'] : fase === 'Fase B' ? ['3', '4'] : ['5', '6'];

  const atpList = tpList.map((tp, idx) => {
    let dpl = tp.dimensiP3 && tp.dimensiP3.length >= 3 
      ? tp.dimensiP3 
      : (tp.dimensiP3 && tp.dimensiP3.length > 0 
          ? [...tp.dimensiP3, ...DPL_OPTIONS.filter(d => !tp.dimensiP3.includes(d))].slice(0, 3)
          : ['Bernalar Kritis', 'Mandiri', 'Gotong Royong']);

    return {
      kodeTP: tp.kodeTP || `TP ${idx + 1}`,
      urutan: idx + 1,
      tujuanPembelajaran: formatTPWithCode(tp.kodeTP, tp.rumusanTP),
      lingkupMateri: tp.lingkupMateri,
      alokasiJP: tp.alokasiJP || 4,
      semester: tp.semesterTarget || (idx < tpList.length / 2 ? 'Semester 1' : 'Semester 2'),
      dimensiP3: dpl, // Minimal 3 DPL
      indikatorKetercapaian:
        tp.indikatorKetercapaian ||
        `Peserta didik mampu mendemonstrasikan penguasaan materi ${tp.lingkupMateri} dan mengomunikasikannya dengan percaya diri.`,
      kegiatanPembelajaranInti: `Kegiatan eksplorasi materi ${tp.lingkupMateri}, diskusi kelompok terarah, pembuatan portofolio/karya sederhana, dan presentasi kelas.`,
      elemen: (tp as any).elemen || elemen,
    };
  });

  // Helper for generating subject-specific authentic glossary terms
  function getSubjectGlosarium(subjectName: string): Array<{ istilah: string; definisi: string }> {
    const s = (subjectName || '').toLowerCase();
    if (s.includes('pancasila') || s.includes('pkn') || s.includes('ppkn') || s.includes('kewarganegaraan')) {
      return [
        { istilah: 'Pancasila', definisi: 'Dasar negara Republik Indonesia dan ideologi bangsa yang terdiri dari lima sila yang saling terkait dan tidak terpisahkan.' },
        { istilah: 'Garuda Pancasila', definisi: 'Lambang negara kesatuan Republik Indonesia berbentuk burung Garuda yang menengok ke kanan dengan perisai berisi simbol lima sila.' },
        { istilah: 'Sila', definisi: 'Dasar, aturan moral, atau prinsip fundamental yang menjadi pegangan hidup bermasyarakat, berbangsa, dan bernegara.' },
        { istilah: 'Norma', definisi: 'Kaidah, pedoman, atau aturan tingkah laku yang berlaku dan disepakati bersama dalam masyarakat.' },
        { istilah: 'Aturan', definisi: 'Ketentuan yang dibuat untuk ditaati demi menjaga ketertiban, keadilan, dan kenyamanan bersama.' },
        { istilah: 'Hak', definisi: 'Segala sesuatu yang mutlak menjadi milik atau berhak diperoleh seseorang sesuai kedudukan dan martabatnya.' },
        { istilah: 'Kewajiban', definisi: 'Sesuatu yang wajib dilaksanakan dengan rasa penuh tanggung jawab sebelum atau saat menuntut hak.' },
        { istilah: 'Musyawarah Mufakat', definisi: 'Proses pembahasan bersama untuk memecahkan persoalan dan mengambil keputusan demi kebaikan bersama tanpa pemaksaan kehendak.' },
        { istilah: 'Bhinneka Tunggal Ika', definisi: 'Semboyan resmi bangsa Indonesia yang bermakna berbeda-beda tetapi tetap satu jua dalam ikatan kebangsaan.' },
        { istilah: 'Toleransi', definisi: 'Sikap saling menghormati, menghargai, dan menerima perbedaan keyakinan, budaya, adat, serta pendapat antarsesama.' },
        { istilah: 'Negara Kesatuan Republik Indonesia (NKRI)', definisi: 'Bentuk negara Indonesia yang berkedaulatan rakyat dan bersatu dari Sabang sampai Merauke.' },
        { istilah: 'Gotong Royong', definisi: 'Bekerja bersama-sama secara sukarela untuk mencapai suatu hasil yang bermanfaat bagi kepentingan umum.' },
        { istilah: 'Bela Negara', definisi: 'Tekad, sikap, dan tindakan warga negara secara teratur dan menyeluruh yang dijiwai oleh kecintaan kepada tanah air.' },
      ];
    }

    if (s.includes('matematika') || s.includes('math') || s.includes('mtk')) {
      return [
        { istilah: 'Number Sense', definisi: 'Kepekaan dan intuisi mendalam terhadap makna bilangan, hubungan antarbilangan, dan operasi matematika.' },
        { istilah: 'Nilai Tempat', definisi: 'Nilai yang dimiliki oleh suatu angka berdasarkan kedudukan atau posisinya dalam susunan bilangan (satuan, puluhan, ratusan, dst).' },
        { istilah: 'Komposisi Bilangan', definisi: 'Proses menggabungkan atau menyusun beberapa bilangan menjadi satu nilai bilangan utuh.' },
        { istilah: 'Dekomposisi Bilangan', definisi: 'Proses menguraikan suatu bilangan utuh menjadi komponen-komponen penyusunnya berdasarkan nilai tempat.' },
        { istilah: 'KPK', definisi: 'Kelipatan Persekutuan Terkecil dari dua bilangan atau lebih yang habis dibagi oleh bilangan-bilangan tersebut.' },
        { istilah: 'FPB', definisi: 'Faktor Persekutuan Terbesar dari dua bilangan atau lebih yang dapat membagi habis bilangan-bilangan tersebut.' },
        { istilah: 'Pecahan Campuran', definisi: 'Bentuk pecahan yang terdiri dari bilangan bulat utuh dan pecahan biasa.' },
        { istilah: 'Bilangan Desimal', definisi: 'Bilangan yang menggunakan tanda koma sebagai pemisah antara bilangan bulat dan bagian persepuluhan, perseratusan, dst.' },
        { istilah: 'Rasio Satuan', definisi: 'Perbandingan antara dua besaran yang berbeda di mana salah satu kuantitasnya bernilai satu satuan.' },
        { istilah: 'Piktogram', definisi: 'Diagram atau grafik penyajian data yang menggunakan gambar atau simbol untuk mewakili jumlah tertentu.' },
      ];
    }

    if (s.includes('ipas') || s.includes('alam dan sosial') || s.includes('ipa') || s.includes('ips') || s.includes('sains')) {
      return [
        { istilah: 'Pancaindra', definisi: 'Lima organ tubuh manusia yang berfungsi untuk mengenali lingkungan sekitar (mata, telinga, hidung, lidah, kulit).' },
        { istilah: 'Siklus Hidup', definisi: 'Seluruh tahapan pertumbuhan dan perkembangan yang dialami makhluk hidup dari awal hingga dewasa.' },
        { istilah: 'Mitigasi', definisi: 'Rangkaian upaya untuk meminimalkan dan mencegah risiko atau dampak perubahan iklim dan kerusakan sumber daya alam.' },
        { istilah: 'Perubahan Wujud Zat', definisi: 'Proses termal perubahan wujud zat dari padat, cair, atau gas (mencair, membeku, menguap, mengembun, menyublim, mengkristal).' },
        { istilah: 'Ekosistem', definisi: 'Sistem hubungan timbal balik yang dinamis antara komponen makhluk hidup (biotik) dengan lingkungannya (abiotik).' },
        { istilah: 'Energi & Transformasi', definisi: 'Kemampuan melakukan usaha dan perubahan dari satu bentuk energi (cahaya, panas, listrik, gerak, kimia) ke bentuk energi lain.' },
        { istilah: 'Gaya', definisi: 'Tarikan atau dorongan yang dapat menyebabkan benda bergerak, berhenti, berubah arah, atau berubah bentuk.' },
        { istilah: 'Peta Konvensional & Digital', definisi: 'Representasi grafis permukaan bumi dengan skala, simbol, dan arah mata angin baik dalam bentuk cetak (atlas) maupun digital (Google Maps).' },
        { istilah: 'Bentang Alam', definisi: 'Ragam bentuk permukaan bumi seperti dataran rendah, dataran tinggi, pegunungan, lembah, dan pesisir pantai.' },
        { istilah: 'Kearifan Lokal & Budaya', definisi: 'Warisan tata nilai, norma, tradisi, dan kebiasaan luhur masyarakat setempat dalam berinteraksi dengan sesama dan alam.' },
        { istilah: 'Literasi Finansial & Uang', definisi: 'Kemampuan memahami nilai nominal uang, fungsi uang sebagai alat tukar sah, serta keterampilan mengelola keuangan secara bijak antara kebutuhan dan keinginan.' },
        { istilah: 'Penyelidikan Ilmiah', definisi: 'Proses terstruktur pembuktian fenomena melalui pengamatan, pengajuan hipotesis, eksperimen dengan alat ukur, organisasi data turus/piktogram, dan komunikasi hasil.' },
      ];
    }

    if (s.includes('agama') || s.includes('katolik')) {
      return [
        { istilah: 'Citra Allah (Imago Dei)', definisi: 'Ajaran bahwa manusia diciptakan segambar dan serupa dengan Allah yang bermartabat luhur, berakal budi, dan memiliki kehendak bebas.' },
        { istilah: 'Sakramen', definisi: 'Tanda dan sarana keselamatan yang kelihatan dari rahmat Allah yang tidak kelihatan, ditetapkan oleh Kristus dan dipercayakan kepada Gereja.' },
        { istilah: 'Sakramen Baptis', definisi: 'Sakramen inisiasi pertama yang menghapus dosa asal, melahirkan kembali seseorang sebagai anak Allah dan anggota Tubuh Kristus (Gereja).' },
        { istilah: 'Sakramen Ekaristi', definisi: 'Sumber dan puncak seluruh hidup kristiani, perayaan syukur mengenang sengsara, wafat, dan kebangkitan Kristus dalam rupa roti dan anggur.' },
        { istilah: 'Sakramen Tobat (Rekonsiliasi)', definisi: 'Sakramen penyembuhan dan pengampunan dosa melalui kerahiman Allah dan absolusi dari pelayanan imam.' },
        { istilah: 'Kerajaan Allah', definisi: 'Suasana kehidupan di mana Allah meraja dengan nyata, yang ditandai oleh kebenaran, keadilan, cinta kasih, damai sejahtera, dan pengampunan.' },
        { istilah: 'Hati Nurani', definisi: 'Suara hati terdalam manusia yang selalu membisikkan untuk mencintai kebaikan, melakukan yang benar, dan menjauhi yang jahat.' },
        { istilah: 'Kitab Suci', definisi: 'Sabda Allah yang dituliskan oleh pengarang manusia di bawah bimbingan dan ilham Roh Kudus, terdiri dari Perjanjian Lama dan Perjanjian Baru.' },
        { istilah: 'Sepuluh Perintah Allah (Dekalog)', definisi: 'Hukum moral dasar yang diberikan Allah kepada Musa di Gunung Sinai sebagai pedoman hidup beriman dan bermasyarakat.' },
        { istilah: 'Gereja Satu, Kudus, Katolik, Apostolik', definisi: 'Empat sifat hakiki Gereja: satu dalam iman, kudus karena Kristus kepalanya, katolik karena merangkul semua bangsa, dan apostolik karena berakar pada ajaran para rasul.' },
        { istilah: 'Laudato Si\'', definisi: 'Ajaran ensiklik Paus Fransiskus tentang panggilan merawat bumi sebagai rumah bersama (care for our common home) dan keadilan ekologis.' },
        { istilah: 'Ajaran Sosial Gereja (ASG)', definisi: 'Kumpulan ajaran moral Gereja dalam menanggapi masalah keadilan sosial, hak asasi manusia, perdamaian, dan pembelaan bagi kaum lemah/miskin.' },
        { istilah: 'Moderasi Beragama & Dialog', definisi: 'Sikap beragama yang seimbang, mengedepankan toleransi aktif, saling menghormati perbedaan iman, dan membangun persaudaraan sejati antarsesama.' },
      ];
    }

    if (s.includes('indonesia') || s.includes('b.indo')) {
      return [
        { istilah: 'Teks Aural', definisi: 'Teks bahasa yang disampaikan secara lisan (dibacakan dan/atau didengarkan).' },
        { istilah: 'Teks Nonsastra', definisi: 'Teks yang berisi informasi faktual, objektif, dan logis seperti berita, petunjuk, dan deskripsi fakta.' },
        { istilah: 'Teks Sastra', definisi: 'Karya tulis imajinatif bernilai seni bahasa seperti dongeng, fabel, puisi, cerita anak, dan pantun.' },
        { istilah: 'Ide Pokok', definisi: 'Gagasan utama atau inti sari pikiran yang menjadi dasar pengembangan suatu paragraf atau teks.' },
        { istilah: 'Ide Pendukung', definisi: 'Gagasan penjelas yang menguraikan, memperjelas, atau memberi contoh terhadap ide pokok.' },
        { istilah: 'Kosakata', definisi: 'Perbendaharaan kata yang dimiliki dan dipahami seseorang dalam berbahasa.' },
        { istilah: 'Membaca Nyaring', definisi: 'Aktivitas melafalkan teks tulis dengan suara jelas, intonasi tepat, dan memperhatikan tanda baca.' },
        { istilah: 'Memirsa', definisi: 'Proses mencermati, memahami, dan memaknai informasi yang disajikan melalui gambar, infografis, atau tayangan visual.' },
        { istilah: 'Gestur', definisi: 'Gerak tubuh, tangan, atau kepala yang digunakan untuk memperkuat pesan saat berbicara di depan audiens.' },
        { istilah: 'Intonasi', definisi: 'Ketepatan tinggi-rendah nada dan lagu kalimat dalam pengucapan kata dan kalimat saat presentasi.' },
        { istilah: 'Makna Denotatif', definisi: 'Makna kata atau kelompok kata yang lugas, sebenarnya, objektif, dan tidak bermakna kiasan.' },
        { istilah: 'Makna Konotatif', definisi: 'Makna kias atau makna tambahan yang mengandung nilai rasa tertentu di luar makna sebenarnya.' },
        { istilah: 'Teks Multimodal', definisi: 'Teks yang menggabungkan dua atau lebih moda komunikasi seperti teks verbal, gambar, diagram, dan warna.' },
        { istilah: 'EYD / PUEBI', definisi: 'Pedoman resmi tata ejaan bahasa Indonesia yang mengatur penulisan huruf kapital, kata, dan tanda baca.' },
      ];
    }

    if (s.includes('inggris') || s.includes('english')) {
      return [
        { istilah: 'Listening', definisi: 'Keterampilan menyimak dan memahami pesan lisan bahasa Inggris dalam konteks sehari-hari.' },
        { istilah: 'Speaking', definisi: 'Keterampilan berkomunikasi secara lisan dengan pelafalan dan kosakata bahasa Inggris yang sesuai konteks.' },
        { istilah: 'Reading', definisi: 'Keterampilan membaca dan memahami teks tulis pendek berbahasa Inggris baik tersurat maupun tersirat.' },
        { istilah: 'Viewing', definisi: 'Keterampilan mengamati dan menginterpretasikan gambar atau ilustrasi yang menyertai teks bahasa Inggris.' },
        { istilah: 'Writing', definisi: 'Keterampilan menyusun kata, kalimat, atau paragraf pendek berbahasa Inggris dengan ejaan yang benar.' },
        { istilah: 'Multimodal Text', definisi: 'Teks yang memadukan bahasa tulis dengan elemen visual seperti gambar, lambang, warna, atau audio.' },
      ];
    }

    return [
      { istilah: 'Capaian Pembelajaran (CP)', definisi: 'Kompetensi pembelajaran yang harus dicapai peserta didik pada setiap fase perkembangan.' },
      { istilah: 'Tujuan Pembelajaran (TP)', definisi: 'Deskripsi pencapaian tiga aspek kompetensi (pengetahuan, keterampilan, dan sikap) yang diperoleh peserta didik.' },
      { istilah: 'Alur Tujuan Pembelajaran (ATP)', definisi: 'Rangkaian tujuan pembelajaran yang disusun secara logis menurut urutan pembelajaran sejak awal hingga akhir fase.' },
      { istilah: 'Asesmen Formatif', definisi: 'Penilaian berkelanjutan yang bertujuan memantau dan memperbaiki proses pembelajaran peserta didik.' },
      { istilah: 'Asesmen Sumatif', definisi: 'Penilaian pada akhir periode pembelajaran untuk mengukur ketercapaian tujuan pembelajaran secara komprehensif.' },
    ];
  }

  // Consistent, Dynamic Bab & Chapter Grouping by Elemen (Preserves 100% of sub-topics)
  const fullGlosarium = getSubjectGlosarium(mapel);

  // Group TPs by Elemen
  const elemenMap = new Map<string, typeof tpList>();
  tpList.forEach((tp) => {
    const elName = ((tp as any).elemen || elemen || 'Materi Pokok').trim();
    if (!elemenMap.has(elName)) {
      elemenMap.set(elName, []);
    }
    elemenMap.get(elName)!.push(tp);
  });

  const atpBlocks: any[] = [];
  const materiPokokList: Array<{ bab: string; judulMateri: string; subMateri: string[]; perkiraanJP: number }> = [];

  if (elemenMap.size > 1) {
    let babCounter = 1;
    elemenMap.forEach((tpsInElemen, elName) => {
      const subMateri = Array.from(new Set(tpsInElemen.map((t) => t.lingkupMateri || t.rumusanTP)));
      const totalJP = tpsInElemen.reduce((acc, curr) => acc + (curr.alokasiJP || 4), 0);
      const unitClass = (tpsInElemen[0] as any)?.kelasTarget || (babCounter <= Math.ceil(elemenMap.size / 2) ? kelasOptions[0] : (kelasOptions[1] || kelasOptions[0]));

      materiPokokList.push({
        bab: `Bab ${babCounter}`,
        judulMateri: `${elName}`,
        subMateri,
        perkiraanJP: totalJP,
      });

      atpBlocks.push({
        id: `block-${babCounter}`,
        judulUnit: `Unit ${babCounter}: ${elName}`,
        kelas: unitClass,
        tujuanPembelajaranList: tpsInElemen.map((t, idx) => ({
          kodeTP: t.kodeTP || `${unitClass}.${idx + 1}`,
          rumusanTP: formatTPWithCode(t.kodeTP || `${unitClass}.${idx + 1}`, t.rumusanTP),
        })),
        perkiraanJP: totalJP,
        kataKunci: subMateri.slice(0, 3).join(', '),
        lingkupMateriList: subMateri,
        glosarium: fullGlosarium.slice((babCounter - 1) * 3, babCounter * 3).length > 0
          ? fullGlosarium.slice((babCounter - 1) * 3, babCounter * 3)
          : fullGlosarium.slice(0, 3),
      });

      babCounter++;
    });
  } else {
    // Single element: split by semester or into balanced halves so structure is clean and consistent
    const mid = Math.ceil(tpList.length / 2);
    const block1TPs = tpList.slice(0, mid);
    const block2TPs = tpList.slice(mid);

    const sub1 = Array.from(new Set(block1TPs.map((t) => t.lingkupMateri || t.rumusanTP)));
    const jp1 = block1TPs.reduce((acc, curr) => acc + (curr.alokasiJP || 4), 0);
    const sub2 = Array.from(new Set(block2TPs.map((t) => t.lingkupMateri || t.rumusanTP)));
    const jp2 = block2TPs.reduce((acc, curr) => acc + (curr.alokasiJP || 4), 0);

    materiPokokList.push(
      {
        bab: 'Bab 1',
        judulMateri: `Pengenalan dan Eksplorasi Dasar: ${block1TPs[0]?.lingkupMateri || elemen}`,
        subMateri: sub1,
        perkiraanJP: jp1,
      },
      {
        bab: 'Bab 2',
        judulMateri: `Pengembangan dan Aplikasi Kontekstual: ${block2TPs[0]?.lingkupMateri || mapel}`,
        subMateri: sub2,
        perkiraanJP: jp2,
      }
    );

    atpBlocks.push(
      {
        id: 'block-1',
        judulUnit: `Unit 1: ${block1TPs[0]?.lingkupMateri || elemen}`,
        kelas: kelasOptions[0],
        tujuanPembelajaranList: block1TPs.map((t, idx) => ({
          kodeTP: t.kodeTP || `${kelasOptions[0]}.${idx + 1}`,
          rumusanTP: formatTPWithCode(t.kodeTP || `${kelasOptions[0]}.${idx + 1}`, t.rumusanTP),
        })),
        perkiraanJP: jp1,
        kataKunci: sub1.slice(0, 3).join(', '),
        lingkupMateriList: sub1,
        glosarium: fullGlosarium.slice(0, 3),
      },
      {
        id: 'block-2',
        judulUnit: `Unit 2: ${block2TPs[0]?.lingkupMateri || mapel}`,
        kelas: kelasOptions[1] || kelasOptions[0],
        tujuanPembelajaranList: block2TPs.map((t, idx) => ({
          kodeTP: t.kodeTP || `${kelasOptions[1] || kelasOptions[0]}.${idx + 1}`,
          rumusanTP: formatTPWithCode(t.kodeTP || `${kelasOptions[1] || kelasOptions[0]}.${idx + 1}`, t.rumusanTP),
        })),
        perkiraanJP: jp2,
        kataKunci: sub2.slice(0, 3).join(', '),
        lingkupMateriList: sub2,
        glosarium: fullGlosarium.slice(3, 6).length > 0 ? fullGlosarium.slice(3, 6) : fullGlosarium.slice(0, 3),
      }
    );
  }

  const dimensiProfilLulusan = [
    'Keimanan dan Ketakwaan terhadap Tuhan YME: Memiliki keyakinan teguh, akhlak mulia, serta mengamalkan nilai spiritual dalam keseharian.',
    'Kewargaan: Memiliki rasa cinta tanah air, menghargai keberagaman, menaati aturan sosial, serta peduli pada lingkungan sekitar.',
    'Penalaran Kritis: Mampu memproses informasi, menganalisis masalah secara analitis, serta mencari solusi yang logis.',
    'Kreativitas: Berani mengeksplorasi ide baru dan menciptakan sesuatu yang orisinal serta bermanfaat.',
    'Kolaborasi: Mampu bekerja sama secara efektif dan bergotong royong untuk mencapai tujuan bersama.',
    'Kemandirian: Bertanggung jawab atas proses dan hasil belajar sendiri tanpa bergantung pada orang lain.',
    'Kesehatan: Memiliki fisik yang bugar serta menjaga keseimbangan kesehatan mental dan fisik (well-being).',
    'Komunikasi: Mampu menyampaikan pendapat dengan santun, mendengarkan orang lain, serta berkomunikasi secara efektif.',
  ];

  const penjelasanDPL = '';

  const glosarium = [
    {
      istilah: 'Capaian Pembelajaran (CP)',
      definisi: 'Kompetensi pembelajaran yang harus dicapai peserta didik pada setiap fase perkembangan.',
    },
    {
      istilah: 'Tujuan Pembelajaran (TP)',
      definisi: 'Deskripsi pencapaian aspek kompetensi dan materi esensial yang diperoleh peserta didik dalam rangkaian pembelajaran.',
    },
    {
      istilah: 'Alur Tujuan Pembelajaran (ATP)',
      definisi: 'Rangkaian tujuan pembelajaran yang disusun secara logis menurut urutan pembelajaran sejak awal hingga akhir suatu fase.',
    },
    ...fullGlosarium,
  ];

  const isAgamaKatolik = mapel.toLowerCase().includes('agama') || mapel.toLowerCase().includes('katolik');

  const daftarPustaka = [
    {
      penulis: 'Kementerian Pendidikan Dasar dan Menengah RI',
      tahun: '2025',
      judul: 'Peraturan Menteri Pendidikan Dasar dan Menengah (Permendikdasmen) Nomor 13 Tahun 2025 tentang Struktur Kurikulum dan Alokasi Waktu Pembelajaran Jenjang SD/MI',
      penerbit: 'Kemendikdasmen RI',
      kota: 'Jakarta',
      keterangan: 'Regulasi Standar Alokasi Waktu Intrakurikuler SD (1 JP = 35 Menit)',
    },
    {
      penulis: 'Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP)',
      tahun: isAgama ? '2026' : '2025',
      judul: isAgama
        ? `Keputusan BKP No. 020/2026 tentang Capaian Pembelajaran Pendidikan Agama dan Budi Pekerti (${mapel})`
        : 'Keputusan Kepala BSKAP No. 046 Tahun 2025 tentang Capaian Pembelajaran pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah',
      penerbit: 'Kemendikdasmen / Kemendikbudristek RI',
      kota: 'Jakarta',
      keterangan: isAgama ? 'Regulasi Standar Capaian Pembelajaran BKP No. 020/2026' : 'Regulasi Standar Capaian Pembelajaran Terbaru 2025',
    },
    {
      penulis: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
      tahun: '2022',
      judul: `Panduan Pembelajaran dan Asesmen Pendidikan Anak Usia Dini, Pendidikan Dasar, dan Menengah`,
      penerbit: 'Pusat Kurikulum dan Pembelajaran',
      kota: 'Jakarta',
      keterangan: 'Pedoman Resmi Asesmen & Kurikulum',
    },
    {
      penulis: 'Tim Penulis Buku Guru SD',
      tahun: '2023',
      judul: `Buku Panduan Guru ${mapel} untuk SD/MI Kelas ${identitas.kelas || (fase === 'Fase A' ? '1 & 2' : fase === 'Fase B' ? '3 & 4' : '5 & 6')}`,
      penerbit: 'Pusat Perbukuan Kemendikbudristek',
      kota: 'Jakarta',
      keterangan: 'Buku Pegangan Guru Resmi',
    },
  ];

  if (isAgamaKatolik) {
    daftarPustaka.push(
      {
        penulis: 'Lembaga Alkitab Indonesia (LAI) & Konferensi Waligereja Indonesia (KWI)',
        tahun: '2024',
        judul: 'Alkitab Deuterokanonika (Perjanjian Lama dan Perjanjian Baru)',
        penerbit: 'Lembaga Biblika Indonesia / LAI-KWI',
        kota: 'Jakarta',
        keterangan: 'Teks Kitab Suci Resmi Gereja Katolik',
      },
      {
        penulis: 'Komisi Kateketik Konferensi Waligereja Indonesia (Komkat KWI)',
        tahun: '2024',
        judul: 'Buku Siswa & Guru Pendidikan Agama Katolik dan Budi Pekerti Kurikulum Merdeka',
        penerbit: 'Pusat Perbukuan Kemendikdasmen & PT Kanisius',
        kota: 'Yogyakarta',
        keterangan: 'Buku Teks Utama Pendidikan Agama Katolik',
      }
    );
  }

  if (mapel.toLowerCase().includes('pancasila') || mapel.toLowerCase().includes('pkn')) {
    daftarPustaka.push({
      penulis: 'Majelis Permusyawaratan Rakyat RI',
      tahun: '2002',
      judul: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
      penerbit: 'Sekretariat Jenderal MPR RI',
      kota: 'Jakarta',
      keterangan: 'Sumber Hukum Tertinggi Negara RI',
    });
  }

  return {
    elemenList: elemenList && elemenList.length > 0 ? elemenList : undefined,
    rasionalPenyusunan: `Alur Tujuan Pembelajaran (ATP) ${mapel} pada ${fase} disusun secara linier dan bertahap, memfasilitasi ketercapaian pemahaman esensial dan keterampilan proses secara berkelanjutan.`,
    atpList,
    atpBlocks,
    materiPokokList,
    dimensiProfilLulusan,
    penjelasanDPL,
    glosarium,
    daftarPustaka,
  };
}

/**
 * Generate Complete Modul Ajar (RPP Plus) with LKPD, Assessments, and Rubrics
 */
export function generatePedagogicalModulFallback(
  identitas: IdentityParam,
  elemen: string,
  capaianPembelajaran: string,
  selectedTPs: TPItemParam[],
  materiFokus: string,
  modelPembelajaranPilihan?: string,
  preferensiTambahan?: string,
  options?: any
) {
  const fase = identitas.fase || 'Fase C';
  const mapel = identitas.mataPelajaran || 'Matematika';
  const model = options?.modelPembelajaran || modelPembelajaranPilihan || 'Problem Based Learning (PBL)';
  const tpHead = selectedTPs[0] || {
    kodeTP: 'TP 1',
    rumusanTP: `Peserta didik mampu memahami dan menyelesaikan persoalan terkait ${materiFokus || mapel}.`,
    lingkupMateri: materiFokus || mapel,
    alokasiJP: 4,
    dimensiP3: ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'],
  };

  const topic = options?.topikMateri || materiFokus || tpHead.lingkupMateri || mapel;
  const dplList = options?.dimensiProfilLulusan && options.dimensiProfilLulusan.length > 0
    ? options.dimensiProfilLulusan
    : (Array.isArray(tpHead.dimensiP3) && tpHead.dimensiP3.length >= 3
      ? tpHead.dimensiP3
      : ['Bernalar Kritis', 'Mandiri', 'Gotong Royong']);

  const alokasiVal = options?.alokasiWaktu || '2 x 35 Menit (1 kali pertemuan)';

  // User-selected methods
  const chosenMethods = options?.metodePembelajaran && options.metodePembelajaran.length > 0
    ? options.metodePembelajaran
    : [
        'Diskusi Kelompok',
        'Tanya Jawab Interaktif',
        'Demonstrasi Benda Konkret',
        'Eksplorasi Terbimbing',
        'Presentasi Apresiatif',
      ];

  // User-selected partners (respect omission if not selected!)
  const mitraInternal = options?.useMitraInternal === false
    ? []
    : (options?.mitraInternal !== undefined
      ? options.mitraInternal
      : ['Guru Kelas / Guru Pengampu', 'Peserta Didik (Tutor Sebaya)']);

  const mitraEksternal = options?.useMitraEksternal === false
    ? []
    : (options?.mitraEksternal !== undefined
      ? options.mitraEksternal
      : ['Orang Tua / Wali Murid', 'Komunitas Lingkungan Sekitar Sekolah']);

  // User-selected digital tools
  const platformAplikasi = options?.pemanfaatanPlatform !== undefined
    ? options.pemanfaatanPlatform
    : ['YouTube Edukasi Kemendikdasmen', 'Canva for Education'];

  const perangkatDigital = options?.pemanfaatanPerangkat !== undefined
    ? options.pemanfaatanPerangkat
    : ['Laptop / Komputer Guru', 'Proyektor LCD'];

  const mediaDigital = options?.pemanfaatanMedia !== undefined
    ? options.pemanfaatanMedia
    : ['Video Animasi Edukasi Konsep Nyata', 'Slide Presentasi Interaktif'];

  const lingkunganFisik = options?.lingkunganFisik || ['Ruang Kelas Fleksibel Berkelompok', 'Pojok Baca Kelas'];
  const lingkunganFisikDeskripsi = options?.lingkunganFisikDeskripsi || 'Ruang kelas ditata secara dinamis dengan formasi meja melingkar (4-5 murid per kelompok) untuk memfasilitasi interaksi aktif dan diskusi kolaboratif yang inklusif.';
  const budayaBelajar = options?.budayaBelajar || [
    'Disiplin Waktu & Tanggung Jawab',
    'Gotong Royong & Kerja Sama',
    'Saling Menghargai & Berempati',
    'Aktif Bertanya & Bernalar Kritis',
    'Refleksi Diri yang Terbiasa',
  ];

  const karakteristikMurid = options?.karakteristikMurid || [
    'Rasa ingin tahu tinggi',
    'Aktif secara fisik',
    'Suka belajar konkret',
    'Senang berkelompok',
  ];
  const karakteristikMuridCustom = options?.karakteristikMuridCustom || 'Siswa antusias terhadap tantangan visual, demonstrasi langsung, dan permainan edukatif.';
  const kebutuhanMurid = options?.kebutuhanMurid || 'Memerlukan media ajar konkret/benda nyata, bimbingan bertahap, serta kesempatan kerja sama aktif bersama teman sebaya dalam memecahkan masalah sehari-hari.';

  // 1. Identifikasi Pembelajaran RPM
  const identifikasiRPM = {
    identifikasiPesertaDidik: {
      kompetensiAwal: `Peserta didik telah memiliki pemahaman dasar, pengetahuan awal, dan pengalaman sehari-hari terkait materi ${topic} dari pembelajaran sebelumnya.`,
      karakteristikMurid,
      karakteristikMuridCustom,
      kebutuhanMurid,
    },
    karakteristikMateri: options?.karakteristikMateri || `Materi ${topic} pada elemen ${elemen || 'Mata Pelajaran'} jenjang SD bersifat konseptual dan praktis yang sangat dekat dengan permasalahan di lingkungan sekitar dan kegiatan sehari-hari peserta didik.`,
    dimensiProfilLulusan: dplList,
  };

  // 2. Desain Pembelajaran RPM
  const perElemenList = options?.capaianPembelajaranPerElemen || (
    Array.isArray(selectedTPs) && selectedTPs.length > 0 && selectedTPs.some((t: any) => t.elemen && t.kalimatCP)
      ? Array.from(
          selectedTPs.reduce((acc: Map<string, any>, curr: any) => {
            const elKey = curr.elemen || elemen || 'Elemen Pembelajaran';
            if (!acc.has(elKey)) {
              acc.set(elKey, {
                elemen: elKey,
                capaianPembelajaran: curr.kalimatCP || capaianPembelajaran,
                kodeTPList: [curr.kodeTP],
              });
            } else {
              const item = acc.get(elKey);
              if (!item.kodeTPList.includes(curr.kodeTP)) {
                item.kodeTPList.push(curr.kodeTP);
              }
            }
            return acc;
          }, new Map()).values()
        )
      : undefined
  );

  const finalCP = options?.capaianPembelajaran || capaianPembelajaran || `Memahami konsep inti, melakukan penalaran terstruktur, dan menerapkan pemahaman ${topic} dalam kehidupan sehari-hari.`;

  const desainPembelajaranRPM = {
    capaianPembelajaran: finalCP,
    capaianPembelajaranPerElemen: perElemenList,
    tujuanPembelajaran: formatTPWithCode(tpHead.kodeTP, tpHead.rumusanTP),
    lintasDisiplinIlmu: (() => {
      const mapelLower = (mapel || '').toLowerCase();
      if (mapelLower.includes('matematika')) {
        return [
          {
            mataPelajaran: 'Bahasa Indonesia',
            keterkaitan: 'Keterampilan literasi memahami kalimat cerita dan menyajikan argumentasi penalaran matematika secara runtut.',
          },
          {
            mataPelajaran: 'Pendidikan Pancasila',
            keterkaitan: 'Membiasakan gotong royong, kerja sama aktif, dan saling menghargai saat memecahkan masalah dalam kelompok.',
          },
        ];
      }
      if (mapelLower.includes('ipas') || mapelLower.includes('alam')) {
        return [
          {
            mataPelajaran: 'Bahasa Indonesia',
            keterkaitan: 'Keterampilan menyimak instruksi penyelidikan dan menyusun teks laporan observasi yang komunikatif.',
          },
          {
            mataPelajaran: 'Matematika',
            keterkaitan: 'Pengukuran kuantitatif dan penyajian data hasil pengamatan ke dalam tabel serta diagram sederhana.',
          },
        ];
      }
      if (mapelLower.includes('pancasila')) {
        return [
          {
            mataPelajaran: 'Bahasa Indonesia',
            keterkaitan: 'Menyampaikan pendapat dengan santun dalam musyawarah kelas dan menghargai keberagaman pandangan.',
          },
          {
            mataPelajaran: 'Seni Rupa',
            keterkaitan: 'Mengekspresikan nilai gotong royong dan kebajikan melalui pembuatan poster atau karya visual menarik.',
          },
        ];
      }
      return [
        {
          mataPelajaran: 'Bahasa Indonesia',
          keterkaitan: 'Penguatan literasi membaca instruksi dan mendeskripsikan gagasan utama secara runtut dan jelas.',
        },
        {
          mataPelajaran: 'Pendidikan Pancasila',
          keterkaitan: 'Menumbuhkan budaya gotong royong, tanggung jawab, dan musyawarah dalam aktivitas kelompok.',
        },
      ];
    })(),
    praktikPedagogis: {
      modelPembelajaran: model,
      pendekatanPembelajaran: options?.pendekatanPembelajaran || 'Pembelajaran Mendalam (Berkesadaran, Bermakna, dan Menggembirakan)',
      metodePembelajaran: chosenMethods,
    },
    mitraPembelajaran: {
      mitraInternal,
      mitraEksternal,
    },
    lingkunganBelajar: {
      lingkunganFisik,
      lingkunganFisikDeskripsi,
      budayaBelajar,
    },
    pemanfaatanTeknologi: {
      platformAplikasi,
      perangkatDigital,
      mediaDigital,
    },
  };

  // 3. Langkah-Langkah Pembelajaran RPM (Pembelajaran Mendalam)
  const pedagogicalOptions = {
    mediaList: mediaDigital,
    perangkatList: perangkatDigital,
    platformList: platformAplikasi,
    metodeList: chosenMethods,
    pendekatan: options?.pendekatanPembelajaran || 'Pembelajaran Mendalam (Berkesadaran, Bermakna, dan Menggembirakan)',
    budayaBelajar: budayaBelajar,
    lingkunganFisik: lingkunganFisik,
  };
  const defaultMeetingPlan = buildPedagogicalMeetingPlan(1, 1, topic, model, formatTPWithCode(tpHead.kodeTP, tpHead.rumusanTP), pedagogicalOptions);
  const langkahPembelajaranRPM = [
    {
      kegiatan: 'Kegiatan Awal' as const,
      waktu: '10 Menit',
      deskripsi: defaultMeetingPlan.pendahuluan.join('\n'),
    },
    {
      kegiatan: 'Kegiatan Inti' as const,
      waktu: '50 Menit',
      deskripsi: `Pelaksanaan Sintaks Model Pembelajaran ${model} yang mengintegrasikan pengalaman belajar Bermakna, Berkesadaran, dan Menggembirakan serta prinsip Memahami, Mengaplikasikan, dan Merefleksikan.`,
      sintaksList: defaultMeetingPlan.kegiatanInti.map((s, idx) => ({
        tahapKe: idx + 1,
        faseSintaks: s.faseSintaks,
        alokasiMenit: s.alokasiMenit,
        aktivitas: `Guru: ${s.aktivitasGuru}\nMurid: ${s.aktivitasSiswa}`,
        aktivitasGuru: s.aktivitasGuru,
        aktivitasSiswa: s.aktivitasSiswa,
        pengalamanBelajar: s.pengalamanBelajar,
        prinsipPembelajaran: s.prinsipPembelajaran,
      })),
    },
    {
      kegiatan: 'Kegiatan Akhir' as const,
      waktu: '10 Menit',
      deskripsi: defaultMeetingPlan.penutup.join('\n'),
    },
  ];

  // 4. Asesmen Pembelajaran RPM
  const asesmenRPM = {
    diagnostik: {
      bentukTeknik: 'Tanya Jawab Lisan & Observasi Kesiapan Awal',
      caraSumber: `[Bersumber dari Kegiatan Pendahuluan/Apersepsi] Guru mengajukan pertanyaan pemantik lisan mengenai pengalaman sehari-hari siswa terkait ${topic} untuk memetakan kesiapan belajar.`,
    },
    formatif: {
      bentukTeknik: 'Penilaian Kinerja Kelompok pada LKPD & Lembar Observasi Diskusi',
      caraSumber: `[Bersumber dari Kegiatan Inti / Sintaks Penyelidikan] Guru mengamati keaktifan, kolaborasi gotong royong, dan penalaran kritis selama proses diskusi dan pengisian LKPD.`,
    },
    sumatif: {
      bentukTeknik: 'Presentasi Hasil Penyelidikan & Lembar Evaluasi Mandiri (Tes Tertulis)',
      caraSumber: `[Bersumber dari Hasil Karya LKPD & Soal Evaluasi di akhir pertemuan] Mengukur ketercapaian penguasaan konsep dan kemampuan aplikasi materi secara individual.`,
    },
  };

  // 5. Rubrik Penilaian RPM (4 Jenjang)
  const rubrikPenilaianRPM = [
    {
      nomor: 1,
      aspekPenilaian: 'Pemahaman Konsep Inti',
      kriteria: `Kemampuan mengidentifikasi, menjelaskan, dan merumuskan esensi materi ${topic}.`,
      skor4: `Menjelaskan konsep materi ${topic} secara sangat tepat, runtut, mendalam, dan mampu mengaitkan dengan contoh baru secara mandiri.`,
      skor3: `Menjelaskan konsep materi ${topic} secara tepat dan benar tanpa kesalahan konsep yang berarti.`,
      skor2: `Menjelaskan sebagian konsep materi ${topic}, namun masih membutuhkan bantuan atau petunjuk berkala dari guru.`,
      skor1: `Belum mampu menjelaskan konsep materi ${topic} meskipun telah diberikan panduan dan bantuan langsung.`,
    },
    {
      nomor: 2,
      aspekPenilaian: 'Keterampilan Penyelesaian Masalah',
      kriteria: `Keterampilan menerapkan langkah-langkah prosedural penyelesaian soal kontekstual.`,
      skor4: `Menerapkan strategi pemecahan masalah secara kreatif, akurat, sistematis, dan dapat menjelaskan alasannya secara logis.`,
      skor3: `Menerapkan langkah penyelesaian masalah secara tepat dan menghasilkan jawaban yang benar.`,
      skor2: `Menerapkan langkah penyelesaian masalah tetapi terdapat kekeliruan perhitungan/prosedur di bagian tertentu.`,
      skor1: `Kesulitan menentukan langkah penyelesaian dan memerlukan bimbingan penuh dari guru.`,
    },
    {
      nomor: 3,
      aspekPenilaian: 'Kolaborasi & Gotong Royong',
      kriteria: `Partisipasi aktif dalam kelompok, pembagian peran, dan saling menghargai pendapat teman.`,
      skor4: `Sangat aktif berdiskusi, berinisiatif membantu rekan yang kesulitan, dan mendengarkan masukan teman dengan santun.`,
      skor3: `Aktif bekerja sama, menjalankan peran yang diberikan, dan menghargai keputusan kelompok.`,
      skor2: `Kurang aktif dalam kerja kelompok, sesekali pasif dan perlu diingatkan oleh teman atau guru.`,
      skor1: `Tidak berpartisipasi dalam diskusi kelompok atau mendominasi tanpa memedulikan rekan lain.`,
    },
    {
      nomor: 4,
      aspekPenilaian: 'Komunikasi & Presentasi Karya',
      kriteria: `Kemampuan menyajikan hasil pengamatan/penyelidikan di depan kelas secara percaya diri.`,
      skor4: `Menyampaikan hasil karya dengan suara lantang, artikulasi jelas, percaya diri tinggi, dan mampu merespons pertanyaan dengan tepat.`,
      skor3: `Menyampaikan hasil karya dengan jelas, runtut, dan bersikap sopan di depan kelas.`,
      skor2: `Menyampaikan hasil karya dengan suara lirih atau membaca teks sepenuhnya tanpa kontak mata.`,
      skor1: `Belum berani atau enggan mempresentasikan hasil kerja di depan kelas.`,
    },
  ];

  // 6. LKPD Lengkap RPM
  const lkpdRPM = {
    judulLKPD: `LEMBAR KERJA PESERTA DIDIK (LKPD): EKSPLORASI MENDALAM ${topic.toUpperCase()}`,
    petunjuk: [
      'Berdoalah sebelum memulai mengerjakan LKPD bersama kelompokmu.',
      'Tuliskan nama kelompok dan nama seluruh anggota pada tempat yang telah disediakan.',
      'Bacalah setiap petunjuk dan permasalahan dengan teliti bersama teman kelompokmu.',
      'Lakukan pengamatan dan diskusikan langkah kerja secara bergotong royong.',
      'Tanyakan kepada Bapak/Ibu Guru apabila ada instruksi yang belum kalian pahami.',
    ],
    langkahKerjaAwal: [
      {
        nomor: 1,
        langkahKerja: `Amati media konkret / gambar / teks stimulus yang disajikan guru mengenai ${topic}. Tuliskan apa yang kalian lihat:`,
        hasilJawabanPlaceholder: 'Tuliskan hasil pengamatan awal kelompok di sini...',
      },
      {
        nomor: 2,
        langkahKerja: `Identifikasi 2 (dua) hal penting atau pola yang kalian temukan dari pengamatan tersebut:`,
        hasilJawabanPlaceholder: 'Hal penting 1: ... \nHal penting 2: ...',
      },
      {
        nomor: 3,
        langkahKerja: `Diskusikan bersama kelompok: mengapa materi ${topic} ini sangat bermanfaat dalam kehidupan sehari-hari kalian?`,
        hasilJawabanPlaceholder: 'Manfaat yang kami temukan adalah...',
      },
    ],
    kegiatanKelompokJudul: `Aktivitas Penyelidikan & Pemecahan Masalah:`,
    kegiatanKelompokInstruksi: `Berdasarkan data dan kasus kontekstual berikut, diskusikan bersama seluruh anggota kelompok untuk menyelesaikan tantangan di bawah ini:`,
    pertanyaanAnalisis: [
      {
        nomor: 1,
        pertanyaan: `Berdasarkan fakta yang telah diamati, bagaimanakah tahapan atau cara yang paling tepat untuk menyelesaikan persoalan terkait ${topic}? Jelaskan alasan kelompokmu!`,
        hasilPlaceholder: 'Langkah penyelesaian kelompok kami adalah...',
      },
      {
        nomor: 2,
        pertanyaan: `Jika kalian menghadapi situasi nyata di sekolah atau di rumah yang berhubungan dengan ${topic}, apa tindakan terbaik yang akan kalian lakukan?`,
        hasilPlaceholder: 'Tindakan yang akan kami lakukan adalah...',
      },
    ],
    refleksiDiriKelompok: [
      {
        nomor: 1,
        pertanyaan: 'Apakah semua anggota kelompok ikut aktif berdiskusi dan membantu menyelesaikan LKPD ini? (Ya / Sebagian / Belum)',
        hasilPlaceholder: 'Tanggapan kelompok...',
      },
      {
        nomor: 2,
        pertanyaan: 'Bagian mana dari kegiatan hari ini yang paling seru dan menantang bagi kalian?',
        hasilPlaceholder: 'Hal paling seru adalah...',
      },
    ],
  };

  // 7. Soal Evaluasi RPM (5 Soal Lengkap + Kunci Jawaban)
  const soalEvaluasiRPM = [
    {
      nomor: 1,
      pertanyaan: `Jelaskan dengan bahasamu sendiri apa yang dimaksud dengan ${topic} dan mengapa hal tersebut penting dipelajari!`,
      kunciJawaban: `${topic} adalah konsep esensial yang membantu kita memahami pola dan menyelesaikan permasalahan konkret dalam kehidupan sehari-hari secara logis dan terstruktur.`,
      bobot: 20,
    },
    {
      nomor: 2,
      pertanyaan: `Sebutkan 2 (dua) contoh nyata penerapan ${topic} yang dapat kalian temui di lingkungan sekitar rumah atau sekolah!`,
      kunciJawaban: `1. Penerapan dalam kegiatan menghitung, mengukur, atau menata kebutuhan sehari-hari. 2. Penerapan dalam kerja sama dan pengambilan keputusan logis bersama keluarga/teman.`,
      bobot: 20,
    },
    {
      nomor: 3,
      pertanyaan: `Ketika menyelesaikan persoalan terkait ${topic}, mengapa kita harus teliti dan memeriksa kembali hasil kerja kita?`,
      kunciJawaban: `Agar hasil yang diperoleh akurat, terhindar dari kekeliruan langkah perhitungan/prosedur, serta melatih sikap tanggung jawab dan bernalar kritis.`,
      bobot: 20,
    },
    {
      nomor: 4,
      pertanyaan: `Tuliskan langkah-langkah sistematis yang harus dilakukan saat menyelesaikan permasalahan terkait ${topic}!`,
      kunciJawaban: `1. Membaca dan memahami persoalan dengan teliti. 2. Mengidentifikasi informasi yang diketahui dan ditanyakan. 3. Menentukan strategi penyelesaian. 4. Menghitung/mengerjakan sesuai prosedur. 5. Memeriksa kembali hasil kerja.`,
      bobot: 20,
    },
    {
      nomor: 5,
      pertanyaan: `Sikap Profil Pelajar Pancasila apa sajakah yang paling kamu kembangkan saat belajar materi ini bersama kelompokmu? Berikan contoh perbuatannya!`,
      kunciJawaban: `Gotong royong (saling membantu dan berbagi tugas), Bernalar Kritis (menganalisis masalah dan mengajukan ide), serta Mandiri (bertanggung jawab atas tugas bagian masing-masing).`,
      bobot: 20,
    },
  ];

  const rawTotalJP = options?.totalJP || (Array.isArray(selectedTPs) ? selectedTPs.reduce((acc: number, curr: any) => acc + (Number(curr.alokasiJP) || 0), 0) : 0);
  const totalJP = Math.max(2, rawTotalJP > 0 ? rawTotalJP : (options?.jumlahPertemuan ? options.jumlahPertemuan * 2 : 12));

  // Batas wajib alokasi SD: Minimal 2 JP dan Maksimal 3 JP per pertemuan
  const minAllowedMeetings = Math.ceil(totalJP / 3);
  const maxAllowedMeetings = Math.max(1, Math.floor(totalJP / 2));

  let totalMeetingsCount = options?.jumlahPertemuan || 0;
  if (!totalMeetingsCount || totalMeetingsCount < minAllowedMeetings || totalMeetingsCount > maxAllowedMeetings) {
    totalMeetingsCount = maxAllowedMeetings;
  }

  // Distribusi matematis JP per pertemuan: minimal 2 JP, maksimal 3 JP
  // Jika ada sisa (misal 11 JP / 5 pertemuan = base 2 JP, sisa 1 JP),
  // sisa dialokasikan pada pertemuan akhir (2-2-2-2-3)
  const baseJP = Math.floor(totalJP / totalMeetingsCount);
  const remainderJP = totalJP - (baseJP * totalMeetingsCount);
  const jpDistribution: number[] = [];
  for (let i = 0; i < totalMeetingsCount; i++) {
    const isExtra = i >= (totalMeetingsCount - remainderJP);
    jpDistribution.push(baseJP + (isExtra ? 1 : 0));
  }

  const allSame = jpDistribution.every((val) => val === jpDistribution[0]);
  const formattedAlokasi = totalMeetingsCount === 1
    ? `${totalJP} JP (${totalJP} x 35 Menit)`
    : allSame
      ? `${totalJP} JP (${totalMeetingsCount} Pertemuan @ ${jpDistribution[0]} JP x 35 Menit)`
      : `${totalJP} JP (${totalMeetingsCount} Pertemuan @ ${jpDistribution.join('-')} JP x 35 Menit)`;

  return {
    judulModul: 'RENCANA PEMBELAJARAN MENDALAM',
    topikMateri: topic,
    elemen: elemen || 'Elemen Mata Pelajaran',
    alokasiWaktuPertemuan: options?.alokasiWaktu && options.alokasiWaktu.includes(`${totalJP} JP`) ? options.alokasiWaktu : formattedAlokasi,
    jumlahPertemuan: totalMeetingsCount,
    totalJP: totalJP,

    // RPM Comprehensive Modules
    identifikasiRPM,
    desainPembelajaranRPM,
    langkahPembelajaranRPM,
    asesmenRPM,
    rubrikPenilaianRPM,
    lkpdRPM,
    soalEvaluasiRPM,

    // Legacy fields maintained for backward compatibility
    alokasiWaktuModul: `${selectedTPs.length * 2} Pertemuan x 2 JP (${selectedTPs.length * 4} Jam Pelajaran)`,
    targetPesertaDidik: 'Peserta didik reguler/tipikal jenjang SD (28 - 32 siswa) dengan keberagaman gaya belajar visual, auditori, dan kinestetik.',
    modaPembelajaran: 'Tatap Muka (Luring) Berbasis Aktivitas Konkret',
    kompetensiAwal: [
      `Peserta didik telah mengenal konsep dasar dan fenomena sehari-hari yang berkaitan dengan ${topic}.`,
      `Peserta didik mampu membaca teks narasi sederhana dan mengamati objek lingkungan secara teliti.`,
      `Peserta didik terbiasa bekerja sama dalam kelompok kecil 4-5 anak.`,
    ],
    profilPelajarPancasila: dplList,
    saranaPrasarana: {
      fasilitas: ['Ruang kelas yang fleksibel untuk kerja kelompok', 'Papan tulis dan spidol warna', 'Pojok baca/sumber referensi'],
      lingkunganBelajar: ['Halaman/taman sekolah untuk observasi langsung', 'Area kelas yang aman dan ramah anak'],
      mediaAjar: [
        `Benda nyata/konkret dan gambar ilustrasi terkait ${topic}`,
        'Lembar Kerja Peserta Didik (LKPD) Cetak Bergambar',
        'Slide presentasi interaktif / Video pembelajaran edukatif ramah anak',
        'Sticky notes dan kertas plano untuk pajangan karya hasil belajar',
      ],
    },
    modelPembelajaran: model,
    tujuanPembelajaranSpesifik: selectedTPs.map((t) => formatTPWithCode(t.kodeTP, t.rumusanTP)),
    pemahamanBermakna: [
      `Memahami ${topic} membantu peserta didik menyadari pentingnya menjaga dan memanfaatkan lingkungan sekitar secara bijak.`,
      `Pengetahuan ini melatih anak berpikir sistematis dalam memecahkan masalah sehari-hari yang dihadapi bersama teman dan keluarga.`,
    ],
    pertanyaanPemantik: [
      `Pernahkah kalian mengamati ${topic} di sekitar rumah atau sekolah? Apa yang kalian temukan?`,
      `Mengapa hal tersebut bisa terjadi dan apa dampaknya jika kita tidak memperhatikannya?`,
      `Bagaimana cara kita membuktikan atau mencari tahu jawabannya bersama-sama hari ini?`,
    ],
    persiapanPembelajaran: [
      'Guru menyiapkan media ajar konkret, lembar LKPD bergambar, dan kartu observasi.',
      'Guru mengatur formasi tempat duduk menjadi kelompok belajar heterogen (4-5 siswa per kelompok).',
      'Guru menyiapkan rubrik penilaian formatif dan lembar asesmen diagnostik awal.',
    ],
    kegiatanPembelajaran: (() => {
      const numMeetings = totalMeetingsCount;
      const meetings = [];
      const tpFormatted = formatTPWithCode(tpHead.kodeTP, tpHead.rumusanTP);
      for (let m = 1; m <= numMeetings; m++) {
        const meetJP = jpDistribution[m - 1] || 2;
        const plan = buildPedagogicalMeetingPlan(m, numMeetings, topic, model, tpFormatted, pedagogicalOptions);
        meetings.push({
          pertemuanKe: m,
          alokasiWaktu: `${meetJP} JP (${meetJP} x 35 Menit)`,
          fokusTP: `${tpFormatted} — [${plan.stageName}]`,
          pendahuluan: plan.pendahuluan,
          kegiatanInti: plan.kegiatanInti,
          penutup: plan.penutup,
        });
      }
      return meetings;
    })(),
    asesmen: {
      diagnostik: {
        teknik: 'Tanya Jawab Lisan & Kuis Gambar Awal (Non-tes)',
        daftarPertanyaan: [
          `Sebutkan 2 contoh benda atau kejadian yang berhubungan dengan ${topic} yang pernah kalian lihat!`,
          `Menurut kalian, apa fungsi atau manfaat hal tersebut dalam kehidupan kita?`,
          `Bagaimana perasaan kalian saat belajar bersama kelompok hari ini? (Tunjukkan jempol ke atas atau emotikon)`,
        ],
      },
      formatif: {
        teknik: 'Observasi Kinerja Diskusi & Penilaian Produk LKPD',
        deskripsi: 'Penilaian dilakukan selama proses kegiatan eksplorasi dan diskusi kelompok menggunakan Rubrik Ketercapaian 4 Tingkat.',
        rubrik: [
          {
            aspek: 'Pemahaman Konsep Materi',
            baruBerkembang: 'Belum mampu menyebutkan konsep inti meskipun telah diberi petunjuk berulang.',
            layak: 'Mampu menyebutkan sebagian konsep inti dengan bantuan bimbingan guru.',
            cakap: 'Mampu menjelaskan konsep inti materi secara tepat dan mandiri.',
            mahir: 'Mampu menjelaskan konsep secara mendalam serta memberikan contoh nyata baru di sekitarnya.',
          },
          {
            aspek: 'Keterampilan Kerja Sama (Gotong Royong)',
            baruBerkembang: 'Masih pasif dan belum mau berbagi tugas dalam kelompok.',
            layak: 'Terlibat dalam kelompok namun perlu sering diingatkan oleh teman/guru.',
            cakap: 'Aktif berdiskusi, mendengarkan pendapat teman, dan menyelesaikan bagian tugasnya dengan baik.',
            mahir: 'Sangat inisiatif membantu anggota kelompok lain dan memimpin jalannya diskusi dengan santun.',
          },
          {
            aspek: 'Kerapian dan Kejelasan Pengisian LKPD',
            baruBerkembang: 'Isian LKPD belum lengkap dan jawaban belum terstruktur.',
            layak: 'Isian LKPD cukup lengkap dengan beberapa bagian yang perlu perbaikan.',
            cakap: 'Isian LKPD lengkap, rapi, dan mudah dipahami.',
            mahir: 'Isian LKPD sangat lengkap, sistematis, disertai gambar/sketsa pendukung yang menarik.',
          },
        ],
      },
      sumatif: {
        teknik: 'Tes Tertulis Ramah Anak (Pilihan Ganda & Isian Singkat Kontekstual)',
        daftarSoal: [
          {
            nomor: 1,
            soal: `Berdasarkan pembelajaran tentang ${topic}, manakah pernyataan berikut yang paling tepat menggambarkan fungsinya?`,
            pilihanGanda: [
              'A. Membantu makhluk hidup bertumbuh dan beradaptasi',
              'B. Menyebabkan lingkungan menjadi kotor dan rusak',
              'C. Tidak memiliki kegunaan apapun bagi alam',
              'D. Hanya terjadi di laboratorium tertutup',
            ],
            kunciJawaban: 'A. Membantu makhluk hidup bertumbuh dan beradaptasi',
            bobot: 25,
          },
          {
            nomor: 2,
            soal: `Ketika kita bekerja sama dalam kelompok untuk mengamati ${topic}, sikap terpuji yang harus kita tunjukkan adalah...`,
            pilihanGanda: [
              'A. Memaksakan kehendak sendiri kepada teman',
              'B. Mendengarkan pendapat teman dan berbagi tugas dengan adil',
              'C. Bermain sendiri dan tidak ikut menulis di LKPD',
              'D. Menyalahkan teman jika ada kesalahan',
            ],
            kunciJawaban: 'B. Mendengarkan pendapat teman dan berbagi tugas dengan adil',
            bobot: 25,
          },
          {
            nomor: 3,
            soal: `Tuliskan 2 langkah sederhana yang dapat kalian lakukan di rumah atau sekolah untuk menerapkan pemahaman tentang ${topic}!`,
            pilihanGanda: [],
            kunciJawaban: '1. Mengamati dan merawat lingkungan sekitar. 2. Melakukan penghematan atau pemanfaatan secara bijak.',
            bobot: 50,
          },
        ],
      },
    },
    pengayaanDanRemedial: {
      pengayaan: `Bagi peserta didik yang telah mencapai kriteria mahir (KKTP > 85), diberikan tantangan membuat komik mini 4 panel atau poster ajakan peduli lingkungan terkait ${topic} untuk dipajang di mading kelas.`,
      remedial: `Bagi peserta didik yang belum mencapai ketuntasan (KKTP < 70), guru memberikan bimbingan individual (re-teaching) dengan media gambar berlabel dan mendampingi pengulangan bagian yang belum dipahami.`,
    },
    refleksi: {
      refleksiGuru: [
        'Apakah alokasi waktu yang direncanakan sudah sesuai dengan ritme belajar anak SD?',
        'Model pembelajaran mana yang paling efektif membuat siswa aktif dan antusias?',
        'Siswa mana yang masih membutuhkan pendampingan lebih intensif pada pertemuan berikutnya?',
      ],
      refleksiSiswa: [
        'Bagian kegiatan mana yang paling menyenangkan dan membuatmu bersemangat hari ini?',
        'Hal baru apa yang berhasil kamu pelajari bersama teman kelompokmu?',
        'Apa yang ingin kamu ketahui lebih lanjut pada pelajaran berikutnya?',
      ],
    },
    lkpd: [
      {
        judulLKPD: `LKPD Petualang Sains & Pengetahuan: Eksplorasi Seru ${topic}`,
        tujuanKegiatan: `Melalui pengamatan bersama kelompok, peserta didik mampu menemukan, mengelompokkan, dan menjelaskan bagian-bagian penting dari ${topic}.`,
        alatBahan: [
          'Alat tulis dan pensil warna',
          'Spesimen/gambar objek pengamatan nyata',
          'Kaca pembesar (lup) / penggaris',
          'Kertas LKPD berpetak pengamatan',
        ],
        langkahKerja: [
          'Bentuklah kelompok yang terdiri dari 4 sampai 5 orang temanmu!',
          'Tuliskan nama kelompok dan nama seluruh anggota pada kotak yang disediakan di atas.',
          'Amatilah objek/gambar yang diberikan oleh Bapak/Ibu Guru dengan teliti menggunakan kaca pembesar.',
          'Diskusikan pertanyaan-pertanyaan di bawah ini dan tuliskan jawaban hasil kesepakatan kelompok.',
          'Warnai diagram atau gambarlah hasil pengamatanmu semenarik mungkin!',
        ],
        pertanyaanDiskusi: [
          `1. Apa sajakah ciri-ciri atau bagian penting yang kalian temukan pada ${topic}?`,
          '2. Menurut kelompok kalian, apa fungsi utama dari masing-masing bagian tersebut?',
          '3. Bagaimana cara terbaik bagi kita untuk menjaga atau memanfaatkan hal tersebut di kehidupan sehari-hari?',
        ],
        kesimpulanPrompt: 'Tuliskan kesimpulan kelompokmu: "Berdasarkan pengamatan kami, kami menyimpulkan bahwa..."',
      },
    ],
    bahanBacaanGuruDanSiswa: {
      ringkasanMateri: `Materi ${topic} merupakan salah satu pondasi penting dalam pembelajaran ${mapel} di jenjang SD. Pembelajaran dirancang berpusat pada anak (student-centered) dengan menghubungkan konsep abstrak ke benda-benda nyata yang dapat disentuh, diamati, dan dirasakan secara langsung oleh siswa dalam kehidupan sehari-hari.`,
      materiPengayaanSingkat: `Informasi Menarik untuk Siswa: Tahukah kalian bahwa di berbagai belahan dunia, pemanfaatan ${topic} telah berkembang menjadi teknologi ramah lingkungan yang sangat canggih dan bermanfaat bagi masa depan bumi kita!`,
    },
    glosarium: [
      {
        istilah: 'Eksplorasi',
        definisi: 'Kegiatan menjelajahi dan mencari tahu secara langsung untuk memperoleh pengalaman belajar baru.',
      },
      {
        istilah: 'Refleksi',
        definisi: 'Kegiatan merenungkan kembali apa yang sudah dipelajari dan dirasakan selama proses pembelajaran.',
      },
    ],
    daftarPustaka: [
      `Buku Panduan Guru ${mapel} SD/MI Kelas ${identitas.kelas || 'IV'} - Kemendikbudristek RI (2023)`,
      `Buku Teks Siswa ${mapel} SD/MI Kelas ${identitas.kelas || 'IV'} - Kemendikbudristek RI (2023)`,
      'Panduan Pembelajaran dan Asesmen Kurikulum Merdeka - BSKAP Kemendikbudristek (2024)',
    ],
  };
}

/**
 * Generate Comprehensive KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) Document
 * Strictly interconnected with CP, TP, and ATP for any elementary subject and phase
 */
export function generatePedagogicalKKTPFallback(
  identitas: IdentityParam,
  tpList: any[],
  atpDocument?: any,
  preferensiTambahan?: string
) {
  const mapel = identitas.mataPelajaran || 'Matematika';
  const fase = identitas.fase || 'Fase C';
  const kelas = identitas.kelas || (fase === 'Fase A' ? '1' : fase === 'Fase B' ? '4' : '5');
  const semester = identitas.semester || '1 (Ganjil)';

  // Build KKTP items by directly inheriting from each TP
  const kktpList = (tpList || []).map((tp, idx) => {
    const kodeTP = tp.kodeTP || `${idx + 1}.1`;
    const elemen = tp.elemen || 'Elemen Pembelajaran';
    const rawRumusanTP = tp.rumusanTP || tp.tujuanPembelajaran || `Peserta didik mampu memahami dan menguasai ${tp.lingkupMateri || 'materi pokok'}.`;
    const rumusanTP = formatTPWithCode(kodeTP, rawRumusanTP);
    const materi = tp.lingkupMateri || 'Materi Inti';
    const kompetensi = tp.kompetensi || 'Memahami dan Menerapkan';
    const alokasiJP = tp.alokasiJP || 4;
    const iktp = tp.indikatorKetercapaian || `Peserta didik mampu mengidentifikasi, mendemonstrasikan, dan menyelesaikan tugas terkait ${materi} secara mandiri dan akurat.`;
    const semesterTarget = tp.semesterTarget || tp.semester || semester;
    const kelasTarget = tp.kelasTarget || kelas;
    const dpl = Array.isArray(tp.dimensiP3) && tp.dimensiP3.length >= 3
      ? tp.dimensiP3
      : ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'];

    // Action verb extraction
    const verbClean = kompetensi.replace(/^\d+\.\s*/, '').toLowerCase();

    return {
      id: `kktp-item-${idx + 1}-${Date.now()}`,
      kodeTP,
      elemen,
      rumusanTP,
      lingkupMateri: materi,
      indikatorKetercapaian: iktp,
      alokasiJP,
      semester: semesterTarget,
      kelasTarget,
      dimensiP3: dpl,
      pendekatanRubrik: {
        baruBerkembang: `Peserta didik belum menunjukkan bukti performa pemahaman materi ${materi}, belum mampu ${verbClean} meskipun telah diberikan panduan dan instruksi langsung (Skor 0 - 60).`,
        layak: `Peserta didik mulai mampu ${verbClean} materi ${materi} dengan bantuan petunjuk bertahap atau arahan berkala dari pendidik (Skor 61 - 70).`,
        cakap: `Peserta didik mampu secara mandiri ${verbClean} materi ${materi} secara tepat, terstruktur, dan sesuai dengan kriteria ketercapaian [Tuntas KKTP] (Skor 71 - 85).`,
        mahir: `Peserta didik sangat mahir dan mandiri dalam ${verbClean} materi ${materi}, mampu mengaitkannya ke persoalan kontekstual serta bernalar kritis tingkat tinggi (Skor 86 - 100).`,
        kesimpulanKetuntasan: 'Peserta didik dianggap tuntas jika minimal mencapai jenjang Cakap pada kedua bukti kinerja/eviden.',
        perluBimbingan: `Peserta didik belum menunjukkan pemahaman konsep dasar tentang ${materi} (Skor 0 - 60).`,
        cukup: `Peserta didik mulai mampu ${verbClean} materi ${materi} dengan bantuan (Skor 61 - 70).`,
        baik: `Peserta didik telah mampu secara mandiri ${verbClean} materi ${materi} (Skor 71 - 85).`,
        sangatBaik: `Peserta didik sangat mahir dalam ${verbClean} materi ${materi} (Skor 86 - 100).`,
        evidenList: [
          {
            kriteria: `1. Pemahaman konsep dan fakta inti ${materi}`,
            baruBerkembang: `Belum mampu mengidentifikasi fakta/konsep inti ${materi}`,
            layak: `Mampu mengidentifikasi sebagian konsep inti dengan bantuan stimulus`,
            cakap: `Mampu menjelaskan konsep inti ${materi} secara mandiri dan tepat [Tuntas]`,
            mahir: `Mampu menganalisis dan mengaitkan konsep inti ke situasi baru secara kritis`,
          },
          {
            kriteria: `2. Keterampilan unjuk kerja / ${verbClean} dalam pemecahan masalah`,
            baruBerkembang: `Belum mampu menyelesaikan prosedur kerja ${verbClean}`,
            layak: `Menyelesaikan prosedur kerja dengan bantuan bimbingan guru`,
            cakap: `Menyelesaikan prosedur kerja ${verbClean} secara runtut dan mandiri [Tuntas]`,
            mahir: `Menyelesaikan persoalan secara kreatif, akurat, dan dapat membantu temannya`,
          },
        ],
      },
      intervalNilai: {
        interval0_40: `0% - 40% (Belum Tuntas): Perlu intervensi khusus, pembelajaran remedial menyeluruh (re-teaching) untuk materi ${materi} menggunakan media konkret/manipulatif.`,
        interval41_65: `41% - 65% (Belum Tuntas): Belum mencapai ketuntasan, diberikan bimbingan remedial terarah pada bagian materi spesifik yang masih keliru melalui tutor sebaya atau latihan bertahap.`,
        interval66_85: `66% - 85% (Tuntas Belajar): Telah mencapai ketuntasan tujuan pembelajaran (KKTP). Tidak perlu remedial, peserta didik siap melanjutkan materi berikutnya.`,
        interval86_100: `86% - 100% (Tuntas Melampaui Kriteria): Tuntas dengan predikat sangat memuaskan. Diberikan materi pengayaan penalaran tingkat tinggi (HOTS) atau tantangan proyek mini.`,
        kesimpulanInterval: 'Ketuntasan minimal KKTP berada pada interval 66% - 85%. Nilai di bawah 66% memerlukan intervensi terencana.',
      },
      intervalDariRubrik: {
        skorMaksimal: 8,
        kriteriaSkor: [
          {
            kriteria: `Eviden 1: Pemahaman Konsep ${materi}`,
            skorMinimalTuntas: 3,
            bobotSkor: 4,
          },
          {
            kriteria: `Eviden 2: Keterampilan ${verbClean}`,
            skorMinimalTuntas: 3,
            bobotSkor: 4,
          },
        ],
        intervalKetuntasan: [
          { rentangSkor: '0% - 40% (Skor 0 - 3)', kategori: 'Belum Tuntas (Intervensi Khusus)', tindakLanjut: 'Remedial di seluruh bagian dengan media konkret' },
          { rentangSkor: '41% - 65% (Skor 4 - 5)', kategori: 'Belum Tuntas (Perlu Bimbingan)', tindakLanjut: 'Remedial di bagian yang belum dikuasai' },
          { rentangSkor: '66% - 85% (Skor 6 - 7)', kategori: 'Tuntas Belajar (Cakap)', tindakLanjut: 'Tidak remedial, lanjut materi berikutnya' },
          { rentangSkor: '86% - 100% (Skor 8)', kategori: 'Tuntas Melampaui (Mahir)', tindakLanjut: 'Diberikan pengayaan atau tantangan HOTS' },
        ],
      },
      bloomTaxonomy: {
        kategori: fase === 'Fase C' ? 'C4 Menganalisis' : fase === 'Fase B' ? 'C3 Menerapkan' : 'C2 Memahami',
        tingkatKKO: fase === 'Fase C' ? 'C4 (Higher Order Thinking Skills / HOTS)' : 'C3 (Middle Order Thinking Skills / MOTS)',
        kataKerjaOperasional: verbClean,
        ranahKognitif: fase === 'Fase C' ? 'HOTS (Menganalisis & Mengaitkan)' : 'MOTS (Menerapkan & Mengoperasikan)',
        dimensiPengetahuan: 'Konseptual & Prosedural Kontekstual',
      },
      perencanaanPenilaian: {
        indikatorCapaianPerforma: iktp,
        bentukPenilaian: 'Tes Formatif & Unjuk Kerja (Kinerja Praktik)',
        instrumenPenilaian: `Rubrik Kualitatif 4 Jenjang & Lembar Observasi Kinerja ${materi}`,
        pendekatanKKTP: 'Rubrik & Interval Nilai',
        keteranganKetuntasan: 'Peserta didik dinyatakan tuntas jika mencapai kriteria Minimal Cakap pada kedua eviden',
      },
      kriteriaDeskripsi: [
        {
          kriteria: `1. Memahami konsep dasar dan terminologi penting dalam ${materi}`,
          memadai: true,
          belumMemadai: false,
          catatanGuru: `Mampu menjelaskan konsep ${materi} dengan bahasa sendiri secara jelas.`,
        },
        {
          kriteria: `2. Terampil dalam ${verbClean} sesuai prosedur langkah pembelajaran`,
          memadai: true,
          belumMemadai: false,
          catatanGuru: `Mampu menyelesaikan langkah-langkah kerja atau persoalan terkait ${materi}.`,
        },
        {
          kriteria: `3. Mengaitkan materi ${materi} dengan situasi nyata di lingkungan sehari-hari`,
          memadai: true,
          belumMemadai: false,
          catatanGuru: `Mampu menyebutkan contoh penerapan konkret dalam kehidupan anak.`,
        },
        {
          kriteria: `4. Menunjukkan profil pelajar pancasila (${dpl.slice(0, 2).join(', ')}) selama pembelajaran`,
          memadai: true,
          belumMemadai: false,
          catatanGuru: `Menunjukkan keaktifan bertanya, bernalar kritis, dan bekerja sama secara bertanggung jawab.`,
        },
      ],
      teknikAsesmen: [
        'Observasi Performa / Kinerja Siswa',
        'Tes Tertulis Formatif / Lembar Kerja (LKPD)',
        'Penilaian Portofolio Produk Belajar',
      ],
      instrumenAsesmen: `Lembar Observasi Skala Kriteria 4 Tingkat, Rubrik Asesmen Unjuk Kerja, dan Lembar Soal Uji Kompetensi ${materi}.`,
      tindakLanjutRemedial: `Pemberian bimbingan individual dan penyederhanaan instruksi menggunakan kartu konsep/benda konkret untuk materi ${materi}, dilanjutkan dengan tes konfirmasi ketercapaian.`,
      tindakLanjutPengayaan: `Pemberian tugas eksplorasi terbuka (open-ended problem), studi kasus sederhana di lingkungan rumah/sekolah, atau penugasan peran sebagai tutor sebaya bagi rekan yang memerlukan bantuan.`,
    };
  });

  return {
    id: `kktp-${Date.now()}`,
    atpDocumentId: atpDocument?.id,
    tanggalDibuat: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    identitas,
    elemen: tpList.length > 0 ? Array.from(new Set(tpList.map(t => t.elemen))).join(' & ') : 'Seluruh Elemen Mapel',
    capaianPembelajaran: atpDocument?.capaianPembelajaran || tpList.map(t => t.kalimatCP).filter(Boolean).slice(0, 3).join('\n') || '',
    kktpList,
    pendekatanDipilih: 'Semua Pendekatan',
    skalaKetuntasanMinimal: 70,
    catatanPedagogis: `Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) ini disusun mengacu pada Keputusan Kepala BSKAP No. 046 Tahun 2025 dan Panduan Pembelajaran dan Asesmen Kurikulum Merdeka. Setiap butir KKTP memiliki keterhubungan langsung (traceability) dengan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan urutan Alur Tujuan Pembelajaran (ATP) mata pelajaran ${mapel} ${fase}. Guru menggunakan dokumen ini sebagai instrumen autentik untuk menentukan ketercapaian belajar siswa, merancang intervensi remedial terfokus, serta menyusun laporan kemajuan belajar siswa pada rapor.`,
    panduanPelaksanaanAsesmen: {
      langkahAsesmenFormatif: [
        'Lakukan observasi dan asesmen awal sebelum atau saat memulai pembelajaran untuk memetakan kesiapan peserta didik.',
        'Gunakan rubrik kriteria 4 tingkat saat proses pembelajaran (asesmen formatif) untuk memberikan umpan balik (feedback) langsung yang membangun.',
        'Catat perkembangan peserta didik pada lembar observasi harian tanpa menghakimi dengan angka tunggal yang kaku.',
      ],
      langkahAsesmenSumatif: [
        'Laksanakan asesmen sumatif setelah satu atau beberapa Tujuan Pembelajaran (TP) selesai dipelajari.',
        'Cocokkan capaian hasil asesmen peserta didik dengan tabel interval nilai ketuntasan (0-40%, 41-65%, 66-85%, 86-100%).',
        'Bagi peserta didik yang berada pada interval 0-65%, wajib diberikan perbaikan/remedial terarah sebelum penilaian akhir periode.',
      ],
      pengolahanNilaiRapor: `Nilai akhir mata pelajaran pada rapor diperoleh dari pengolahan hasil asesmen sumatif lingkup materi (beberapa TP) dan sumatif akhir semester. Deskripsi capaian pada rapor ditulis berdasarkan narasi capaian tertinggi (TP yang paling dikuasai) dan capaian yang masih membutuhkan pendampingan, yang ditarik langsung dari deskriptor KKTP ini.`,
    },
  };
}

