import {
  ExamPackage,
  SchoolIdentity,
  TPItem,
  LevelKognitifSoal,
  KisiKisiSoalDocument,
} from '../types';
import { createExamPackage } from '../data/defaultChapterExercises';
import { saveOrPublishExamPackage, getAllExamPackages } from './examService';

export interface SubjectChapterTemplate {
  mataPelajaran: string;
  babJudul: string;
  lingkupMateri: string;
  rumusanTP: string;
  kodeTP: string;
  elemen: string;
  deskripsi: string;
}

/**
 * Katalog topik bab standar SD (Fase C / Kelas 5-6) yang siap disusun otomatis
 */
export const RECOMMENDED_CHAPTER_TEMPLATES: SubjectChapterTemplate[] = [
  // Matematika
  {
    mataPelajaran: 'Matematika',
    babJudul: 'Bab 1: Bilangan Cacah Sampai 100.000',
    lingkupMateri: 'Nilai Tempat dan Operasi Bilangan Cacah',
    rumusanTP: 'Peserta didik dapat membaca, menulis, menentukan nilai tempat, serta menyelesaikan operasi hitung penjumlahan dan pengurangan bilangan cacah sampai 100.000.',
    kodeTP: 'TP-MAT-5.1',
    elemen: 'Bilangan',
    deskripsi: 'Memperkuat konsep nilai tempat, perbandingan bilangan, dan penalaran operasi hitung kontekstual.',
  },
  {
    mataPelajaran: 'Matematika',
    babJudul: 'Bab 2: KPK dan FPB dalam Masalah Kontekstual',
    lingkupMateri: 'Kelipatan Persekutuan Terkecil & Faktor Persekutuan Terbesar',
    rumusanTP: 'Peserta didik dapat menentukan KPK dan FPB dari dua atau tiga bilangan serta menerapkannya dalam memecahkan masalah kehidupan sehari-hari.',
    kodeTP: 'TP-MAT-5.2',
    elemen: 'Bilangan',
    deskripsi: 'Penerapan KPK untuk jadwal bersama dan FPB untuk pembagian parcel/bingkisan adil.',
  },
  {
    mataPelajaran: 'Matematika',
    babJudul: 'Bab 3: Operasi Hitung Pecahan dan Desimal',
    lingkupMateri: 'Pecahan Biasa, Campuran, dan Desimal',
    rumusanTP: 'Peserta didik dapat membandingkan, mengurutkan, serta melakukan penjumlahan dan pengurangan pecahan berpenyebut berbeda.',
    kodeTP: 'TP-MAT-5.3',
    elemen: 'Bilangan',
    deskripsi: 'Pemahaman representasi visual pecahan dan konversi desimal.',
  },
  {
    mataPelajaran: 'Matematika',
    babJudul: 'Bab 4: Keliling dan Luas Bangun Datar',
    lingkupMateri: 'Keliling & Luas Persegi, Persegi Panjang, dan Segitiga',
    rumusanTP: 'Peserta didik dapat menghitung keliling dan luas bangun datar gabungan menggunakan rumus yang tepat dalam situasi nyata.',
    kodeTP: 'TP-MAT-5.4',
    elemen: 'Pengukuran',
    deskripsi: 'Perhitungan luas pekarangan, ubin lantai, dan bangun bertingkat.',
  },

  // IPAS
  {
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    babJudul: 'Bab 1: Cahaya dan Sifat-Sifatnya',
    lingkupMateri: 'Sifat-sifat Cahaya dan Indra Penglihatan',
    rumusanTP: 'Peserta didik dapat menganalisis sifat-sifat cahaya (merambat lurus, menembus benda bening, dipantulkan, dibiaskan) dan hubungannya dengan cara kerja mata manusia.',
    kodeTP: 'TP-IPAS-5.1',
    elemen: 'Pemahaman IPAS (Sains)',
    deskripsi: 'Eksplorasi fenomena bayangan, cermin, prisma pelangi, dan pemeliharaan kesehatan mata.',
  },
  {
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    babJudul: 'Bab 2: Harmoni dalam Ekosistem',
    lingkupMateri: 'Rantai Makanan, Jaring-Jaring Makanan, dan Peran Makhluk Hidup',
    rumusanTP: 'Peserta didik dapat menganalisis hubungan antar makhluk hidup pada rantai makanan serta dampak ketidakseimbangan ekosistem terhadap lingkungan.',
    kodeTP: 'TP-IPAS-5.2',
    elemen: 'Pemahaman IPAS (Sains)',
    deskripsi: 'Peran produsen, konsumen, dekomposer, dan aksi pelestarian habitat.',
  },
  {
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    babJudul: 'Bab 3: Magnet, Listrik, dan Teknologi di Sekitar Kita',
    lingkupMateri: 'Energi Listrik dan Gaya Magnet',
    rumusanTP: 'Peserta didik dapat mengidentifikasi pemanfaatan gaya magnet dan rangkaian listrik sederhana (seri dan paralel) dalam kehidupan sehari-hari.',
    kodeTP: 'TP-IPAS-5.3',
    elemen: 'Pemahaman IPAS (Sains)',
    deskripsi: 'Rangkaian senter, kutub magnet, generator listrik ramah lingkungan.',
  },
  {
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    babJudul: 'Bab 4: Indonesiaku Kaya Hayati dan Budaya',
    lingkupMateri: 'Keanekaragaman Flora, Fauna, dan Budaya Maritim',
    rumusanTP: 'Peserta didik dapat mengidentifikasi keanekaragaman hayati Indonesia (Garis Wallace & Weber) serta kearifan lokal dalam menjaga kelestarian alam.',
    kodeTP: 'TP-IPAS-5.4',
    elemen: 'Pemahaman IPAS (Sosial)',
    deskripsi: 'Persebaran fauna asiatis, peralihan, australis serta nilai gotong royong nusantara.',
  },

  // Bahasa Indonesia
  {
    mataPelajaran: 'Bahasa Indonesia',
    babJudul: 'Bab 1: Menemukan Ide Pokok dan Gagasan Pendukung',
    lingkupMateri: 'Teks Informasi dan Paragraf Eksplanasi',
    rumusanTP: 'Peserta didik dapat menentukan ide pokok dan ide pendukung pada teks informatif serta menuliskan ringkasan isi bacaan dengan bahasa sendiri.',
    kodeTP: 'TP-IND-5.1',
    elemen: 'Membaca dan Memirsa',
    deskripsi: 'Menganalisis kalimat utama, kalimat penjelas, dan inferensi bacaan fiksi/nonfiksi.',
  },
  {
    mataPelajaran: 'Bahasa Indonesia',
    babJudul: 'Bab 2: Teks Petunjuk dan Penulisan Kalimat Perintah',
    lingkupMateri: 'Teks Prosedur dan Kalimat Efektif',
    rumusanTP: 'Peserta didik dapat menyusun dan mengevaluasi teks prosedur langkah demi langkah dengan urutan kronologis yang runtut dan kosa kata baku.',
    kodeTP: 'TP-IND-5.2',
    elemen: 'Menulis',
    deskripsi: 'Membuat petunjuk penggunaan alat, resep tradisional, dan protokol kebersihan sekolah.',
  },

  // Pendidikan Pancasila
  {
    mataPelajaran: 'Pendidikan Pancasila',
    babJudul: 'Bab 1: Makna dan Pengamalan Sila-Sila Pancasila',
    lingkupMateri: 'Pancasila dalam Kehidupan Berbangsa dan Bernegara',
    rumusanTP: 'Peserta didik dapat menghubungkan nilai-nilai setiap sila Pancasila dengan tindakan nyata di lingkungan keluarga, sekolah, dan masyarakat.',
    kodeTP: 'TP-PAN-5.1',
    elemen: 'Pancasila',
    deskripsi: 'Toleransi beragama, musyawarah mufakat, keadilan sosial, dan gotong royong.',
  },
  {
    mataPelajaran: 'Pendidikan Pancasila',
    babJudul: 'Bab 2: Norma, Hak, dan Kewajiban Warga Negara',
    lingkupMateri: 'Norma Sosial, Hukum, dan Tata Tertib Sekolah',
    rumusanTP: 'Peserta didik dapat mengklasifikasikan macam-macam norma di masyarakat serta membedakan pelaksanaan hak dan kewajiban secara seimbang.',
    kodeTP: 'TP-PAN-5.2',
    elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
    deskripsi: 'Kepatuhan tata tertib, hak perlindungan anak, dan kewajiban menghargai orang lain.',
  },
];

/**
 * Generator cerdas butir soal latihan bab kontekstual berbasis TP & Lingkup Materi
 * Menghasilkan butir soal berkualitas tinggi, spesifik materi, dan berorientasi Kurikulum Merdeka SD
 */
export function buildChapterExerciseQuestions(params: {
  materi: string;
  rumusanTP: string;
  kodeTP: string;
  mataPelajaran: string;
  namaSekolah?: string;
  kabupaten?: string;
}) {
  const { materi, rumusanTP, kodeTP, mataPelajaran, namaSekolah = 'SD Negeri Fatubai', kabupaten = 'Timor Tengah Utara' } = params;

  const matLower = (mataPelajaran || '').toLowerCase();
  const materiLower = (materi || '').toLowerCase();
  const tpLower = (rumusanTP || '').toLowerCase();

  // -------------------------------------------------------------------------
  // KASUS 1: MATEMATIKA - BILANGAN CACAH, NILAI TEMPAT & DEKOMPOSISI
  // -------------------------------------------------------------------------
  if (
    matLower.includes('matematika') &&
    (materiLower.includes('bilangan') || materiLower.includes('nilai tempat') || materiLower.includes('cacah'))
  ) {
    const pgItems = [
      {
        nomor: 1,
        pertanyaan: 'Pada lambang bilangan 64.825, angka 4 menempati nilai tempat ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Puluh ribuan' },
          { kunci: 'B' as const, teks: 'Ribuan' },
          { kunci: 'C' as const, teks: 'Ratusan' },
          { kunci: 'D' as const, teks: 'Puluhan' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Angka 4 berada pada urutan keempat dari kanan, yaitu nilai tempat ribuan dengan nilai 4.000.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Bentuk dekomposisi (uraian nilai tempat) dari bilangan 75.390 yang paling tepat adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '70.000 + 5.000 + 300 + 90' },
          { kunci: 'B' as const, teks: '7.000 + 500 + 30 + 9' },
          { kunci: 'C' as const, teks: '70.000 + 500 + 390' },
          { kunci: 'D' as const, teks: '700.000 + 50.000 + 300 + 90' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Bilangan 75.390 diuraikan menjadi: 7 puluh ribuan (70.000) + 5 ribuan (5.000) + 3 ratusan (300) + 9 puluhan (90) + 0 satuan.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        stimulus: `Koperasi ${namaSekolah} di ${kabupaten} mencatat penjualan seragam bulan ini sebesar Rp48.750, sedangkan bulan lalu tercatat Rp48.570.`,
        pertanyaan: 'Tanda perbandingan yang tepat untuk membandingkan kedua nilai penjualan tersebut adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Rp48.750 < Rp48.570' },
          { kunci: 'B' as const, teks: 'Rp48.750 > Rp48.570' },
          { kunci: 'C' as const, teks: 'Rp48.750 = Rp48.570' },
          { kunci: 'D' as const, teks: 'Rp48.750 ≤ Rp48.500' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Angka ratusan pada 48.750 adalah 7, sedangkan pada 48.570 adalah 5. Karena 7 > 5, maka Rp48.750 > Rp48.570.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Urutan bilangan 32.500, 31.900, 33.200, 32.150 dari yang nilainya terkecil adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '31.900, 32.150, 32.500, 33.200' },
          { kunci: 'B' as const, teks: '33.200, 32.500, 32.150, 31.900' },
          { kunci: 'C' as const, teks: '31.900, 32.500, 32.150, 33.200' },
          { kunci: 'D' as const, teks: '32.150, 31.900, 32.500, 33.200' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Mengurutkan dari terkecil ke terbesar: 31.900 < 32.150 < 32.500 < 33.200.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        stimulus: `Seorang siswa membawa uang Rp50.000 untuk membeli buku seharga Rp23.500 dan pensil warna Rp14.200 di toko dekat sekolah.`,
        pertanyaan: 'Berapakah sisa uang kembalian yang diterima siswa tersebut?',
        pilihan: [
          { kunci: 'A' as const, teks: 'Rp12.300' },
          { kunci: 'B' as const, teks: 'Rp13.300' },
          { kunci: 'C' as const, teks: 'Rp14.300' },
          { kunci: 'D' as const, teks: 'Rp11.300' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Total belanja = Rp23.500 + Rp14.200 = Rp37.700. Sisa uang = Rp50.000 - Rp37.700 = Rp12.300.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 3' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Bilangan delapan puluh lima ribu empat ratus rupiah dituliskan dengan angka Rp85.400,00.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Penulisan angka dan nilai tempat untuk delapan puluh lima ribu empat ratus adalah 85.400.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Pada bilangan 52.810, nilai angka 5 adalah 5.000.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Angka 5 menempati nilai tempat puluh ribuan, sehingga bernilai 50.000 bukan 5.000.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah bilangan pada Kolom Kiri dengan nilai tempat angka yang digarisbawahi pada Kolom Kanan!',
        daftarPremis: [
          { nomor: 1, teks: 'Angka 9 pada 91.200' },
          { nomor: 2, teks: 'Angka 6 pada 26.450' },
          { nomor: 3, teks: 'Angka 8 pada 15.820' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Puluh Ribuan (90.000)' },
          { label: 'B', teks: 'Ribuan (6.000)' },
          { label: 'C', teks: 'Ratusan (800)' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Lambang bilangan dari "tujuh puluh empat ribu dua ratus delapan" adalah ....',
        kunciJawaban: '74.208',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Jelaskan langkah-langkah membandingkan dua buah bilangan cacah yang sama-sama memiliki 5 angka (puluh ribuan), misalnya 63.450 dan 63.810! Manakah yang bernilai lebih besar?`,
        kunciJawaban: 'Langkah: 1) Bandingkan angka puluh ribuan (keduanya sama yaitu 6), 2) Bandingkan angka ribuan (keduanya sama yaitu 3), 3) Bandingkan angka ratusan (4 dan 8). Karena 8 > 4, maka 63.810 > 63.450. Jadi bilangan yang lebih besar adalah 63.810.',
        pedomanPenskoran: [
          { kriteria: 'Menyebutkan langkah perbandingan digit dari nilai tempat tertinggi', skorMaks: 2 },
          { kriteria: 'Menunjukkan analisis angka ratusan yang berbeda', skorMaks: 2 },
          { kriteria: 'Menyimpulkan bilangan yang lebih besar dengan tepat', skorMaks: 1 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 2: MATEMATIKA - OPERASI HITUNG, KPK & FPB
  // -------------------------------------------------------------------------
  if (
    matLower.includes('matematika') &&
    (materiLower.includes('kpk') || materiLower.includes('fpb') || materiLower.includes('faktor') || materiLower.includes('operasi'))
  ) {
    const pgItems = [
      {
        nomor: 1,
        pertanyaan: 'Hasil dari perhitungan 2.500 + 1.250 × 4 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '15.000' },
          { kunci: 'B' as const, teks: '7.500' },
          { kunci: 'C' as const, teks: '10.000' },
          { kunci: 'D' as const, teks: '8.250' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Kerjakan perkalian lebih dahulu: 1.250 × 4 = 5.000. Lalu jumlahkan: 2.500 + 5.000 = 7.500.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Kelipatan Persekutuan Terkecil (KPK) dari bilangan 12 dan 18 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '24' },
          { kunci: 'B' as const, teks: '36' },
          { kunci: 'C' as const, teks: '48' },
          { kunci: 'D' as const, teks: '72' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Faktorisasi prima: 12 = 2² × 3, dan 18 = 2 × 3². KPK = 2² × 3² = 4 × 9 = 36.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        stimulus: `Di ${namaSekolah}, Roni berlatih futsal setiap 4 hari sekali dan Aldo berlatih setiap 6 hari sekali. Jika hari ini mereka berlatih bersama di lapangan sekolah,`,
        pertanyaan: 'Berapa hari lagi mereka berdua akan berlatih futsal bersama kembali?',
        pilihan: [
          { kunci: 'A' as const, teks: '10 hari' },
          { kunci: 'B' as const, teks: '12 hari' },
          { kunci: 'C' as const, teks: '16 hari' },
          { kunci: 'D' as const, teks: '24 hari' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Mencari KPK dari 4 dan 6. KPK(4, 6) = 12. Jadi mereka berlatih bersama 12 hari lagi.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 3' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Faktor Persekutuan Terbesar (FPB) dari bilangan 24 dan 36 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '6' },
          { kunci: 'B' as const, teks: '8' },
          { kunci: 'C' as const, teks: '12' },
          { kunci: 'D' as const, teks: '18' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Faktor 24: 1, 2, 3, 4, 6, 8, 12, 24. Faktor 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. FPB = 12.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        stimulus: `Ibu guru memiliki 30 buku tulis dan 45 pensil. Barang tersebut akan dibagikan kepada sejumlah murid dengan jumlah yang sama banyak untuk setiap jenis barang.`,
        pertanyaan: 'Berapakah jumlah murid terbanyak yang dapat menerima paket hadiah tersebut?',
        pilihan: [
          { kunci: 'A' as const, teks: '5 murid' },
          { kunci: 'B' as const, teks: '10 murid' },
          { kunci: 'C' as const, teks: '15 murid' },
          { kunci: 'D' as const, teks: '20 murid' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Mencari FPB dari 30 dan 45. FPB(30, 45) = 15 murid. Masing-masing mendapat 2 buku dan 3 pensil.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 3' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Pada operasi hitung campuran, operasi perkalian dan pembagian harus dikerjakan lebih dahulu daripada penjumlahan dan pengurangan.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Berdasarkan aturan hierarki operasi matematika, tingkat kali dan bagi lebih tinggi daripada tambah dan kurang.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'FPB dari dua bilangan selalu bernilai lebih besar daripada KPK kedua bilangan tersebut.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Nilai FPB selalu lebih kecil atau sama dengan bilangan tersebut, sedangkan KPK selalu lebih besar atau sama.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah soal operasi hitung berikut dengan hasil perhitungannya yang tepat!',
        daftarPremis: [
          { nomor: 1, teks: 'KPK dari 6 dan 8' },
          { nomor: 2, teks: 'FPB dari 20 dan 30' },
          { nomor: 3, teks: 'Hasil 100 - 25 × 2' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '24' },
          { label: 'B', teks: '10' },
          { label: 'C', teks: '50' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Kelipatan persekutuan terkecil (KPK) dari bilangan 8 dan 12 adalah ....',
        kunciJawaban: '24',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Pak Guru memiliki 36 buah apel dan 48 buah jeruk. Buah-buahan tersebut akan dibagikan ke dalam kantong plastik dengan jumlah apel dan jeruk sama banyak. Tentukan: a) Jumlah kantong plastik terbanyak yang dibutuhkan (FPB), b) Berapa buah apel dan jeruk di setiap kantong!`,
        kunciJawaban: 'a) Mencari FPB dari 36 dan 48. Faktor prima 36 = 2² × 3², 48 = 2⁴ × 3. FPB = 2² × 3 = 12 kantong plastik. b) Tiap kantong berisi 36 : 12 = 3 buah apel dan 48 : 12 = 4 buah jeruk.',
        pedomanPenskoran: [
          { kriteria: 'Menentukan FPB dari 36 dan 48 dengan benar (12 kantong)', skorMaks: 3 },
          { kriteria: 'Menghitung rincian isi apel dan jeruk tiap kantong dengan benar', skorMaks: 2 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 3: MATEMATIKA - PECAHAN, DESIMAL & PERSEN
  // -------------------------------------------------------------------------
  if (
    matLower.includes('matematika') &&
    (materiLower.includes('pecahan') || materiLower.includes('desimal') || materiLower.includes('persen'))
  ) {
    const pgItems = [
      {
        nomor: 1,
        pertanyaan: 'Hasil penjumlahan pecahan 2/5 + 1/3 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '3/8' },
          { kunci: 'B' as const, teks: '11/15' },
          { kunci: 'C' as const, teks: '7/15' },
          { kunci: 'D' as const, teks: '3/15' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Samakan penyebut KPK(5, 3) = 15. 2/5 = 6/15, dan 1/3 = 5/15. Hasilnya = 6/15 + 5/15 = 11/15.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Bentuk persen (%) dari pecahan 3/4 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '25%' },
          { kunci: 'B' as const, teks: '50%' },
          { kunci: 'C' as const, teks: '75%' },
          { kunci: 'D' as const, teks: '80%' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): 3/4 × 100% = 300/4% = 75%.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        pertanyaan: 'Bentuk desimal dari pecahan 1/2 adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '0,2' },
          { kunci: 'B' as const, teks: '0,5' },
          { kunci: 'C' as const, teks: '0,25' },
          { kunci: 'D' as const, teks: '0,05' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): 1 dibagi 2 = 0,5 (atau 5/10).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        stimulus: `Maria memiliki pita sepanjang 3/4 meter. Ia menggunakan 1/2 meter untuk menghias prakarya di kelas 5.`,
        pertanyaan: 'Sisa panjang pita Maria sekarang adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '1/4 meter' },
          { kunci: 'B' as const, teks: '2/4 meter' },
          { kunci: 'C' as const, teks: '1/2 meter' },
          { kunci: 'D' as const, teks: '1/8 meter' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): 3/4 - 1/2 = 3/4 - 2/4 = 1/4 meter.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        pertanyaan: 'Urutan pecahan 1/2, 3/4, 1/4 dari yang terkecil adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: '1/4, 1/2, 3/4' },
          { kunci: 'B' as const, teks: '3/4, 1/2, 1/4' },
          { kunci: 'C' as const, teks: '1/2, 1/4, 3/4' },
          { kunci: 'D' as const, teks: '1/4, 3/4, 1/2' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Samakan penyebut: 1/4 (0,25), 1/2 = 2/4 (0,5), 3/4 (0,75). Urutan dari terkecil: 1/4, 1/2, 3/4.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Pecahan 4/10 senilai dengan bilangan desimal 0,4.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: '4 per 10 berarti 4 dibagi 10 = 0,4.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Untuk menjumlahkan dua pecahan berpenyebut berbeda, pembilang dan penyebut langsung dijumlahkan tanpa menyamakan penyebut.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Pecahan dengan penyebut berbeda harus disamakan penyebutnya terlebih dahulu menggunakan KPK.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah pecahan biasa berikut dengan bentuk desimal atau persen yang senilai!',
        daftarPremis: [
          { nomor: 1, teks: 'Pecahan 1/4' },
          { nomor: 2, teks: 'Pecahan 1/2' },
          { nomor: 3, teks: 'Pecahan 3/5' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '0,25 (atau 25%)' },
          { label: 'B', teks: '0,50 (atau 50%)' },
          { label: 'C', teks: '0,60 (atau 60%)' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Bentuk persen dari pecahan 1/5 adalah .... %',
        kunciJawaban: '20',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Ibu membeli 1/2 kg gula pasir dan 3/4 kg tepung terigu di warung. Berapakah total berat belanjaan ibu seluruhnya dalam bentuk pecahan campuran? Tuliskan langkah penyelesaiannya!`,
        kunciJawaban: 'Langkah: 1/2 + 3/4 = 2/4 + 3/4 = 5/4 kg. Diubah ke pecahan campuran menjadi 1 1/4 kg.',
        pedomanPenskoran: [
          { kriteria: 'Menyamakan penyebut kedua pecahan dengan tepat', skorMaks: 2 },
          { kriteria: 'Menjumlahkan pembilang dan menghasilkan 5/4 kg', skorMaks: 2 },
          { kriteria: 'Mengubah ke pecahan campuran 1 1/4 kg dengan benar', skorMaks: 1 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 4: IPAS - CAHAYA, PENGLIHATAN & SIFAT GELOMBANG
  // -------------------------------------------------------------------------
  if (
    matLower.includes('ipas') &&
    (materiLower.includes('cahaya') || materiLower.includes('mata') || materiLower.includes('penglihatan') || materiLower.includes('sifat'))
  ) {
    const pgItems = [
      {
        nomor: 1,
        stimulus: 'Pada siang hari yang cerah, berkas sinar matahari masuk melalui celah genting rumah dan membentuk garis lurus yang tampak jelas.',
        pertanyaan: 'Peristiwa tersebut membuktikan bahwa cahaya memiliki sifat ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Dapat dibiaskan' },
          { kunci: 'B' as const, teks: 'Merambat lurus' },
          { kunci: 'C' as const, teks: 'Dapat diuraikan' },
          { kunci: 'D' as const, teks: 'Tidak dapat menembus udara' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Berkas cahaya matahari yang membentuk garis lurus membuktikan sifat dasar cahaya yang selalu merambat lurus pada medium yang seragam.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Ketika sebuah pensil dimasukkan ke dalam gelas bening berisi air jernih, pensil terlihat patah atau bengkok. Hal ini terjadi karena ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Cahaya dipantulkan baur' },
          { kunci: 'B' as const, teks: 'Cahaya mengalami pembiasan (refraksi)' },
          { kunci: 'C' as const, teks: 'Air menyerap seluruh berkas cahaya' },
          { kunci: 'D' as const, teks: 'Gelas menghasilkan bayangan semu' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Pembiasan cahaya terjadi karena berkas cahaya merambat melalui dua zat yang kerapatan optiknya berbeda (dari udara ke air).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        pertanyaan: 'Bagian mata yang berfungsi mengatur jumlah intensitas cahaya yang masuk ke dalam bola mata adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Kornea' },
          { kunci: 'B' as const, teks: 'Pupil' },
          { kunci: 'C' as const, teks: 'Retina' },
          { kunci: 'D' as const, teks: 'Saraf optik' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Pupil akan mengecil di tempat terang dan membesar di tempat redup untuk mengatur kuantitas cahaya yang masuk ke mata.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Cermin yang dipasang pada sudut jalan atau spion kendaraan bermotor untuk memperluas jangkauan pandangan adalah cermin ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Cermin datar' },
          { kunci: 'B' as const, teks: 'Cermin cekung' },
          { kunci: 'C' as const, teks: 'Cermin cembung' },
          { kunci: 'D' as const, teks: 'Prisma kaca' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Cermin cembung selalu menghasilkan bayangan tegak, diperkecil, dan memiliki daerah pandang yang sangat luas.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        pertanyaan: 'Peristiwa pelangi di langit setelah turun hujan merupakan bukti sifat cahaya dapat ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Diuraikan (dispersi) menjadi berbagai warna' },
          { kunci: 'B' as const, teks: 'Merambat berbelok-belok' },
          { kunci: 'C' as const, teks: 'Menghilang saat terkena air' },
          { kunci: 'D' as const, teks: 'Diserap oleh udara dingin' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Tetesan air hujan berfungsi sebagai prisma alami yang menguraikan cahaya putih matahari menjadi spektrum warna pelangi (me-ji-ku-hi-bi-ni-u).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Cahaya dapat menembus benda bening seperti kaca jendela dan air jernih, tetapi tidak dapat menembus benda gelap.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Benda bening meneruskan berkas cahaya, sedangkan benda gelap menghalangi cahaya sehingga membentuk bayangan.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Bayangan benda akan terbentuk di sisi yang sama dengan arah datangnya sumber cahaya.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Bayangan selalu terbentuk di belakang benda atau di sisi yang berlawanan dengan arah datangnya cahaya.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah bagian mata pada Kolom Kiri dengan fungsi utamanya pada Kolom Kanan!',
        daftarPremis: [
          { nomor: 1, teks: 'Kornea' },
          { nomor: 2, teks: 'Lensa Mata' },
          { nomor: 3, teks: 'Retina' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Melindungi bagian depan mata dan membiaskan cahaya pertama kali' },
          { label: 'B', teks: 'Mengatur fokus agar bayangan jatuh tepat pada retina' },
          { label: 'C', teks: 'Tempat menangkap bayangan benda yang tersusun atas sel saraf fotosensitif' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Peristiwa pembelokan arah rambat berkas cahaya ketika melalui dua zat yang berbeda kerapatan optiknya dinamakan ....',
        kunciJawaban: 'pembiasan',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Jelaskan proses bagaimana manusia dapat melihat suatu benda di sekitarnya secara berurutan mulai dari sumber cahaya hingga sinyal diterima oleh otak!`,
        kunciJawaban: '1) Cahaya dari sumber mengenai benda lalu dipantulkan ke mata, 2) Cahaya masuk menembus kornea dan pupil, 3) Dibiaskan oleh lensa mata sehingga jatuh tepat di retina, 4) Sel saraf retina mengirimkan impuls cahaya melalui saraf optik ke otak untuk diterjemahkan sebagai gambar.',
        pedomanPenskoran: [
          { kriteria: 'Menyebutkan pemantulan cahaya dari benda ke mata', skorMaks: 1 },
          { kriteria: 'Menjelaskan peran kornea, pupil, dan pembiasan lensa mata', skorMaks: 2 },
          { kriteria: 'Menyebutkan bayangan di retina dan penerusan ke otak lewat saraf optik', skorMaks: 2 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 5: IPAS - EKOSISTEM, RANTAI MAKANAN & LINGKUNGAN
  // -------------------------------------------------------------------------
  if (
    matLower.includes('ipas') &&
    (materiLower.includes('ekosistem') || materiLower.includes('rantai') || materiLower.includes('makanan') || materiLower.includes('lingkungan'))
  ) {
    const pgItems = [
      {
        nomor: 1,
        stimulus: 'Perhatikan rantai makanan di ekosistem sawah: Padi → Belalang → Katak → Ular → Elang.',
        pertanyaan: 'Organisme yang berperan sebagai konsumen tingkat II (kedua) adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Padi' },
          { kunci: 'B' as const, teks: 'Belalang' },
          { kunci: 'C' as const, teks: 'Katak' },
          { kunci: 'D' as const, teks: 'Ular' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Padi (produsen) dimakan Belalang (konsumen I), Belalang dimakan Katak (konsumen II).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Organisme yang berperan menguraikan sisa makhluk hidup yang telah mati menjadi unsur hara penyubur tanah adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Produsen' },
          { kunci: 'B' as const, teks: 'Konsumen puncak' },
          { kunci: 'C' as const, teks: 'Pengurai (dekomposer)' },
          { kunci: 'D' as const, teks: 'Herbivor' },
        ],
        kunciJawaban: 'C' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Bakteri pengurai dan jamur mengembalikan mineral organik kembali ke dalam tanah untuk dimanfaatkan tumbuhan.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        stimulus: 'Jika populasi ular sawah diburu secara besar-besaran oleh manusia hingga nyaris punah,',
        pertanyaan: 'Dampak negatif langsung yang akan terjadi terhadap ekosistem pertanian sawah adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Populasi tikus meningkat pesat sehingga merusak tanaman padi' },
          { kunci: 'B' as const, teks: 'Hasil panen padi semakin melimpah' },
          { kunci: 'C' as const, teks: 'Populasi elang bertambah banyak' },
          { kunci: 'D' as const, teks: 'Katak sawah berhenti berkembang biak' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Ular adalah pemangsa alami hama tikus. Jika predator hilang, hama tikus meledak dan menggagalkan panen petani.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 3' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Tumbuhan hijau menempati tingkatan trofik paling dasar (produsen) karena mampu ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Membuat makanannya sendiri melalui proses fotosintesis' },
          { kunci: 'B' as const, teks: 'Memangsa serangga kecil di sekitarnya' },
          { kunci: 'C' as const, teks: 'Hidup tanpa membutuhkan air dan cahaya matahari' },
          { kunci: 'D' as const, teks: 'Menghasilkan racun untuk mengusir pemakan tumbuhan' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Tumbuhan hijau memiliki klorofil dan memanfaatkan cahaya matahari untuk fotosintesis (autotrof).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        pertanyaan: 'Kumpulan dari beberapa rantai makanan yang saling berhubungan dan tumpang tindih dalam suatu ekosistem dinamakan ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Piramida makanan' },
          { kunci: 'B' as const, teks: 'Jaring-jaring makanan' },
          { kunci: 'C' as const, teks: 'Siklus energi' },
          { kunci: 'D' as const, teks: 'Habitat alami' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Jaring-jaring makanan menggambarkan hubungan makan dan dimakan yang lebih nyata dan kompleks dalam ekosistem.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Hubungan antara lebah madu dengan bunga merupakan contoh simbiosis mutualisme karena keduanya saling menguntungkan.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Lebah mendapat nektar madu dan bunga terbantu proses penyerbukannya.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Hewan pemakan daging seperti singa dan elang tergolong ke dalam kelompok herbivor.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Hewan pemakan daging disebut karnivor, sedangkan herbivor adalah hewan pemakan tumbuhan.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah jenis hewan dengan kelompok makanannya yang tepat!',
        daftarPremis: [
          { nomor: 1, teks: 'Sapi dan Kelinci' },
          { nomor: 2, teks: 'Harimau dan Burung Elang' },
          { nomor: 3, teks: 'Ayam dan Tikus' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Herbivor (Pemakan Tumbuhan)' },
          { label: 'B', teks: 'Karnivor (Pemakan Daging)' },
          { label: 'C', teks: 'Omnivor (Pemakan Segala)' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Dalam rantai makanan, tumbuhan hijau berperan sebagai ....',
        kunciJawaban: 'produsen',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Sebutkan 3 contoh tindakan nyata yang dapat dilakukan oleh murid ${namaSekolah} untuk menjaga kebersihan dan kelestarian ekosistem di lingkungan sekolah!`,
        kunciJawaban: '1) Membuang sampah pada tempatnya dan memilah sampah organik serta anorganik, 2) Merawat dan menyiram tanaman di kebun sekolah, 3) Tidak merusak atau memburu hewan-hewan kecil dan sarang burung yang ada di pekarangan sekolah.',
        pedomanPenskoran: [
          { kriteria: 'Menyebutkan perilaku pemilahan/pembuangan sampah', skorMaks: 2 },
          { kriteria: 'Menyebutkan tindakan penghijauan/merawat tanaman', skorMaks: 2 },
          { kriteria: 'Menyebutkan perlindungan hewan/serangga bermanfaat', skorMaks: 1 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 6: BAHASA INDONESIA - IDE POKOK, PARAGRAF & INFORMASI TEKS
  // -------------------------------------------------------------------------
  if (
    matLower.includes('indonesia') ||
    materiLower.includes('ide pokok') ||
    materiLower.includes('paragraf') ||
    materiLower.includes('teks')
  ) {
    const pgItems = [
      {
        nomor: 1,
        stimulus: `Hutan mangrove memiliki peran sangat vital bagi kelestarian pesisir pantai. Keberadaan akar pohon bakau mampu menahan deburan ombak besar sehingga mencegah abrasi pantai. Selain itu, kawasan mangrove juga menjadi rumah tempat berkembang biak aneka ikan kecil, udang, dan kepiting bakau.`,
        pertanyaan: 'Ide pokok dari paragraf bacaan di atas adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Cara membudidayakan kepiting bakau di laut' },
          { kunci: 'B' as const, teks: 'Peran vital hutan mangrove bagi kelestarian pesisir' },
          { kunci: 'C' as const, teks: 'Penyebab terjadinya deburan ombak besar' },
          { kunci: 'D' as const, teks: 'Kegiatan nelayan menangkap ikan di pesisir' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Kalimat utama terletak di awal paragraf yang membicarakan peran vital hutan mangrove, diperjelas dengan fungsi pencegah abrasi dan habitat ikan.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Kalimat di bawah ini yang merupakan kalimat FAKTA adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Pantai di Pulau Timor adalah tempat terindah di dunia.' },
          { kunci: 'B' as const, teks: `${namaSekolah} terletak di wilayah Kabupaten ${kabupaten}.` },
          { kunci: 'C' as const, teks: 'Menurut saya, membaca cerita lebih menyenangkan daripada berhitung.' },
          { kunci: 'D' as const, teks: 'Sepertinya sore nanti akan turun hujan lebat membasahi lapangan.' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Pilihan B merupakan fakta nyata yang memiliki data pasti dan dapat diverifikasi kebenarannya, sedangkan pilihan lainnya memuat opini atau dugaan.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        pertanyaan: 'Paragraf yang memiliki kalimat utama di awal paragraf disebut paragraf ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Deduktif' },
          { kunci: 'B' as const, teks: 'Induktif' },
          { kunci: 'C' as const, teks: 'Campuran' },
          { kunci: 'D' as const, teks: 'Naratif' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Paragraf deduktif diawali oleh kalimat utama (gagasan umum) lalu diikuti oleh kalimat-kalimat penjelas (khusus).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Fungsi utama kalimat penjelas dalam sebuah paragraf adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Menentang gagasan utama yang sudah ditulis' },
          { kunci: 'B' as const, teks: 'Mendukung, menguraikan, dan memberi bukti bagi ide pokok' },
          { kunci: 'C' as const, teks: 'Mengalihkan perhatian pembaca ke topik lain' },
          { kunci: 'D' as const, teks: 'Menggantikan keberadaan judul karangan' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Kalimat penjelas bertugas memberikan rincian fakta, data, atau keterangan pendukung gagasan utama.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        stimulus: `Langkah membuat teh manis: 1) Masukkan kantung teh ke dalam cangkir, 2) Tuang air panas ke dalam cangkir, 3) Tambahkan gula pasir secukupnya, 4) Aduk perlahan hingga gula larut sempurna.`,
        pertanyaan: 'Teks yang berisi petunjuk langkah-langkah kerja berurutan seperti di atas dinamakan teks ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Teks deskripsi' },
          { kunci: 'B' as const, teks: 'Teks prosedur' },
          { kunci: 'C' as const, teks: 'Teks narasi' },
          { kunci: 'D' as const, teks: 'Teks fabel' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Teks prosedur memuat tujuan, alat/bahan, dan urutan langkah sistematis untuk membuat atau melakukan sesuatu.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Ide pokok adalah gagasan inti yang menjadi dasar pengembangan sebuah paragraf bacaan.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Ide pokok menjadi fondasi utama tempat berdirinya semua kalimat penjelas dalam satu paragraf.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Kalimat opini berisi informasi data angka dan peristiwa yang dapat dibuktikan secara ilmiah.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Informasi berbasis data dan fakta terbukti disebut fakta, sedangkan opini merupakan pendapat atau anggapan subjektif.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah istilah kebahasaan pada Kolom Kiri dengan pengertian yang tepat pada Kolom Kanan!',
        daftarPremis: [
          { nomor: 1, teks: 'Ide Pokok' },
          { nomor: 2, teks: 'Paragraf Deduktif' },
          { nomor: 3, teks: 'Teks Prosedur' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Gagasan utama yang menjadi inti pembahasan paragraf' },
          { label: 'B', teks: 'Paragraf yang letak gagasan utamanya di awal kalimat' },
          { label: 'C', teks: 'Teks yang memuat langkah-langkah petunjuk melakukan kegiatan' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Paragraf yang kalimat utamanya terletak di akhir paragraf disebut paragraf ....',
        kunciJawaban: 'induktif',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Tuliskan sebuah paragraf deskripsi singkat (3-4 kalimat) tentang suasana pagi hari di lingkungan ${namaSekolah}, lalu garis bawahi manakah yang menjadi kalimat utamanya!`,
        kunciJawaban: 'Contoh: Pagi hari di SD Negeri Fatubai selalu diawali dengan suasana yang riang dan tertib. Murid-murid datang tepat waktu dengan seragam rapi dan menyapa bapak ibu guru di gerbang. Mereka bergotong royong menyapu halaman kelas sebelum bel pelajaran berbunyi. (Kalimat utama: Pagi hari di SD Negeri Fatubai selalu diawali dengan suasana yang riang dan tertib).',
        pedomanPenskoran: [
          { kriteria: 'Menuliskan 3-4 kalimat padu dan runtut', skorMaks: 2 },
          { kriteria: 'Menggunakan ejaan dan kosa kata baku bahasa Indonesia', skorMaks: 1 },
          { kriteria: 'Menentukan letak kalimat utama dengan tepat', skorMaks: 2 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 7: PENDIDIKAN PANCASILA - NILAI SILA, NORMA & GOTONG ROYONG
  // -------------------------------------------------------------------------
  if (
    matLower.includes('pancasila') ||
    matLower.includes('ppkn') ||
    materiLower.includes('pancasila') ||
    materiLower.includes('sila') ||
    materiLower.includes('norma')
  ) {
    const pgItems = [
      {
        nomor: 1,
        pertanyaan: 'Menghormati teman yang sedang menjalankan ibadah sesuai agamanya merupakan wujud pengamalan Pancasila sila ke ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Pertama (Ketuhanan Yang Maha Esa)' },
          { kunci: 'B' as const, teks: 'Kedua (Kemanusiaan yang Adil dan Beradab)' },
          { kunci: 'C' as const, teks: 'Ketiga (Persatuan Indonesia)' },
          { kunci: 'D' as const, teks: 'Kelima (Keadilan Sosial)' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Sila ke-1 membimbing toleransi, kerukunan beragama, dan penghormatan ibadah antarumat beragama.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 2,
        pertanyaan: 'Ketika bermusyawarah menentukan ketua kelas atau pembagian regu piket di kelas 5, sikap yang paling tepat ditunjukkan adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Memaksakan kehendak pribadi kepada semua teman' },
          { kunci: 'B' as const, teks: 'Mendengarkan pendapat orang lain dan menerima hasil mufakat bersama' },
          { kunci: 'C' as const, teks: 'Meninggalkan ruangan musyawarah jika usulnya ditolak' },
          { kunci: 'D' as const, teks: 'Menolak menjalankan tugas piket yang telah disepakati' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Sila ke-4 menegaskan asas musyawarah untuk mufakat dengan lapang dada dan tanggung jawab bersama.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 3,
        stimulus: `Murid-murid di ${namaSekolah} berasal dari berbagai suku dan latar belakang budaya, namun mereka selalu rukun dan kompak bekerja sama membersihkan lapangan.`,
        pertanyaan: 'Perilaku tersebut merupakan perwujudan semboyan nasional kita, yaitu ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Tut Wuri Handayani' },
          { kunci: 'B' as const, teks: 'Bhinneka Tunggal Ika' },
          { kunci: 'C' as const, teks: 'Ing Ngarsa Sung Tuladha' },
          { kunci: 'D' as const, teks: 'Mitreka Satata' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Bhinneka Tunggal Ika bermakna berbeda-beda tetapi tetap satu jua, memperkokoh persatuan Indonesia (sila ke-3).`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
      {
        nomor: 4,
        pertanyaan: 'Kewajiban utama seorang murid saat berada di lingkungan sekolah adalah ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Mendapatkan nilai rapor yang baik tanpa belajar' },
          { kunci: 'B' as const, teks: 'Mematuhi tata tertib sekolah dan menghormati guru' },
          { kunci: 'C' as const, teks: 'Menggunakan seluruh fasilitas guru sesuka hati' },
          { kunci: 'D' as const, teks: 'Bebas pulang kapan saja sebelum jam pelajaran usai' },
        ],
        kunciJawaban: 'B' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Hak dan kewajiban harus seimbang. Kewajiban murid adalah mentaati aturan sekolah, belajar sungguh-sungguh, dan sopan kepada guru.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 2' as LevelKognitifSoal,
      },
      {
        nomor: 5,
        pertanyaan: 'Lambang bintang emas pada perisai Garuda Pancasila melambangkan sila ....',
        pilihan: [
          { kunci: 'A' as const, teks: 'Pertama' },
          { kunci: 'B' as const, teks: 'Kedua' },
          { kunci: 'C' as const, teks: 'Ketiga' },
          { kunci: 'D' as const, teks: 'Keempat' },
        ],
        kunciJawaban: 'A' as const,
        pembahasan: `💡 Pembahasan Edukatif TP (${kodeTP}): Bintang emas berlatar hitam merupakan simbol sila ke-1: Ketuhanan Yang Maha Esa.`,
        kodeTP,
        lingkupMateri: materi,
        level: 'Level 1' as LevelKognitifSoal,
      },
    ];

    const bsItems = [
      {
        nomor: 1,
        pernyataan: 'Pancasila berkedudukan sebagai dasar negara dan pandangan hidup bagi seluruh bangsa Indonesia.',
        kunciJawaban: 'Benar' as const,
        alasanKunci: 'Pancasila adalah norma dasar (grundnorm) dan pedoman moral berbangsa serta bernegara.',
        kodeTP,
        lingkupMateri: materi,
      },
      {
        nomor: 2,
        pernyataan: 'Membantu teman yang tertimpa musibah hanya boleh dilakukan kepada teman yang satu suku dan seagama saja.',
        kunciJawaban: 'Salah' as const,
        alasanKunci: 'Nilai kemanusiaan (sila ke-2) mengajarkan kita menolong sesama tanpa memandang latar belakang suku atau agama.',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const menjodohkanItems = [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah nomor sila Pancasila pada Kolom Kiri dengan simbol lambangnya yang sesuai pada Kolom Kanan!',
        daftarPremis: [
          { nomor: 1, teks: 'Sila ke-1' },
          { nomor: 2, teks: 'Sila ke-2' },
          { nomor: 3, teks: 'Sila ke-3' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Bintang Emas' },
          { label: 'B', teks: 'Rantai Emas' },
          { label: 'C', teks: 'Pohon Beringin' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const isianItems = [
      {
        nomor: 1,
        pertanyaan: 'Semboyan persatuan bangsa Indonesia yang tertulis pada pita cengkeraman burung Garuda adalah ....',
        kunciJawaban: 'Bhinneka Tunggal Ika',
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    const uraianItems = [
      {
        nomor: 1,
        pertanyaan: `Berikan 3 contoh perilaku nyata pengamalan sila ke-2 (Kemanusiaan yang Adil dan Beradab) yang dapat kamu terapkan saat bergaul dengan teman sekelas di ${namaSekolah}!`,
        kunciJawaban: '1) Bersikap ramah dan santun tanpa mengejek atau merundung teman, 2) Menolong teman yang terjatuh atau membutuhkan bantuan alat tulis, 3) Menjenguk teman yang sedang sakit dan mendoakan kesembuhannya.',
        pedomanPenskoran: [
          { kriteria: 'Menyebutkan sikap anti-perundungan / santun', skorMaks: 2 },
          { kriteria: 'Menyebutkan sikap saling tolong-menolong', skorMaks: 2 },
          { kriteria: 'Menyebutkan empati kepedulian terhadap sesama', skorMaks: 1 },
        ],
        kodeTP,
        lingkupMateri: materi,
      },
    ];

    return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
  }

  // -------------------------------------------------------------------------
  // KASUS 8: MATERI UMUM / ADAPTIF (MENYESUAIKAN DENGAN KONTEN ASLI TP & MATERI DENGAN BAHASA RAMAH ANAK)
  // Menghasilkan 13 butir soal (6 PG + 2 Benar/Salah + 3 Menjodohkan + 1 Isian + 1 Uraian)
  // Memenuhi ketentuan: Minimal 10 soal dan Maksimal 15 soal
  // -------------------------------------------------------------------------
  const pgItems = [
    {
      nomor: 1,
      stimulus: `Ayo membaca! Hari ini di kelas kita belajar tentang "${materi}" untuk mencapai tujuan belajar (${kodeTP}).`,
      pertanyaan: `Langkah yang paling asyik dan benar untuk memahami materi "${materi}" bersama teman-teman adalah ....`,
      pilihan: [
        { kunci: 'A' as const, teks: `Membaca cerita dan penjelasan materi dengan teliti serta berani bertanya hal yang belum dipahami.` },
        { kunci: 'B' as const, teks: `Hanya menyalin jawaban kawan tanpa mau membaca penjelasannya.` },
        { kunci: 'C' as const, teks: `Bermain sendiri dan tidak mendengarkan penjelasan guru.` },
        { kunci: 'D' as const, teks: `Menutup buku dan langsung menyerah sebelum mencoba.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Hebat! Belajar "${materi}" paling seru bila kita membaca dengan cermat dan saling bertanya agar semakin pintar.`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 1' as LevelKognitifSoal,
    },
    {
      nomor: 2,
      stimulus: `Saat kita menemukan masalah atau tugas tentang "${materi}" di sekolah ${namaSekolah},`,
      pertanyaan: `Tindakan cerdas pertama yang sebaiknya kita lakukan sebelum menjawab adalah ....`,
      pilihan: [
        { kunci: 'A' as const, teks: `Mengamati cerita dan petunjuk soal dengan tenang dan teliti.` },
        { kunci: 'B' as const, teks: `Langsung memilih jawaban acak tanpa membaca soal.` },
        { kunci: 'C' as const, teks: `Menangis dan merasa takut salah menjawab.` },
        { kunci: 'D' as const, teks: `Menghapus semua tulisan kawan satu meja.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Bagus sekali! Sikap teliti dan tenang membantu kita menemukan kunci jawaban yang tepat pada materi "${materi}".`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 2' as LevelKognitifSoal,
    },
    {
      nomor: 3,
      pertanyaan: `Mengapa kita perlu mempelajari materi "${materi}" dengan sungguh-sungguh?`,
      pilihan: [
        { kunci: 'A' as const, teks: `Agar pengetahuan kita bertambah luas dan dapat membantu keluarga serta sesama.` },
        { kunci: 'B' as const, teks: `Hanya untuk mendapatkan pujian tanpa dipraktikkan.` },
        { kunci: 'C' as const, teks: `Supaya bisa menyombongkan nilai di depan teman.` },
        { kunci: 'D' as const, teks: `Hanya untuk mengisi waktu kosong di kelas.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Tepat sekali! Ilmu tentang "${materi}" sangat bermanfaat untuk bekal kebaikan dalam kehidupan sehari-hari kita.`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 2' as LevelKognitifSoal,
    },
    {
      nomor: 4,
      stimulus: `Bayangkan jika kawan sebangkumu merasa bingung saat belajar tentang "${materi}",`,
      pertanyaan: `Sikap ramah dan saling tolong yang paling baik kamu lakukan adalah ....`,
      pilihan: [
        { kunci: 'A' as const, teks: `Mengajaknya belajar bersama dan menjelaskan bagian yang ia belum pahami dengan santun.` },
        { kunci: 'B' as const, teks: `Mengejek kawan karena ia belum bisa menjawab.` },
        { kunci: 'C' as const, teks: `Menyuruhnya menyontek jawabanmu tanpa diajarkan caranya.` },
        { kunci: 'D' as const, teks: `Pura-pura tidak tahu dan meninggalkannya sendirian.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Luar biasa! Saling menyayangi dan belajar bersama membuat suasana kelas jadi nyaman dan semua murid bisa berhasil.`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 3' as LevelKognitifSoal,
    },
    {
      nomor: 5,
      pertanyaan: `Manfaat baik yang dapat kita terapkan dari materi "${materi}" di lingkungan sekitar tempat tinggal kita adalah ....`,
      pilihan: [
        { kunci: 'A' as const, teks: `Menjadi anak yang mandiri, jujur, dan bersemangat mencari solusi yang baik.` },
        { kunci: 'B' as const, teks: `Menjadi anak yang malas belajar di rumah.` },
        { kunci: 'C' as const, teks: `Membuat orang tua dan guru merasa cemas.` },
        { kunci: 'D' as const, teks: `Tidak mau bekerjasama saat kerja bakti lingkungan.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Benar! Pembelajaran bermakna menjadikan kita pribadi yang berakhlak mulia dan peduli lingkungan.`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 2' as LevelKognitifSoal,
    },
    {
      nomor: 6,
      stimulus: `Setelah menyelesaikan latihan tentang "${materi}", kita diajak membuat kesimpulan sederhana.`,
      pertanyaan: `Kunci keberhasilan utama dalam menguasai topik "${materi}" adalah ....`,
      pilihan: [
        { kunci: 'A' as const, teks: `Rajin berlatih, tekun membaca, dan tidak takut mencoba lagi saat belum sempurna.` },
        { kunci: 'B' as const, teks: `Hanya belajar saat menjelang jam ujian saja.` },
        { kunci: 'C' as const, teks: `Menghafal jawaban cepat tanpa memahami artinya.` },
        { kunci: 'D' as const, teks: `Bergantung sepenuhnya pada bantuan orang lain.` },
      ],
      kunciJawaban: 'A' as const,
      pembahasan: `💡 Pembahasan Seru TP (${kodeTP}): Hebat! Ketekunan dan keberanian untuk terus mencoba adalah kunci keberhasilan setiap penjelajah cilik.`,
      kodeTP,
      lingkupMateri: materi,
      level: 'Level 2' as LevelKognitifSoal,
    },
  ];

  const bsItems = [
    {
      nomor: 1,
      pernyataan: `Belajar dengan riang dan tekun pada materi "${materi}" akan membantu kita mencapai tujuan pembelajaran (${kodeTP}) dengan hasil yang membanggakan.`,
      kunciJawaban: 'Benar' as const,
      alasanKunci: `Sikap tekun dan ceria dalam belajar mempermudah kita memahami setiap konsep materi dengan tuntas.`,
      kodeTP,
      lingkupMateri: materi,
    },
    {
      nomor: 2,
      pernyataan: `Dalam mempelajari topik "${materi}", kita cukup menghafal nama judulnya saja tanpa perlu mempraktikkannya dalam kegiatan sehari-hari.`,
      kunciJawaban: 'Salah' as const,
      alasanKunci: `Ilmu yang kita pelajari harus dipahami maknanya dan dipraktikkan agar mendatangkan kebaikan bagi diri sendiri dan orang lain.`,
      kodeTP,
      lingkupMateri: materi,
    },
  ];

  const menjodohkanItems = [
    {
      nomorGroup: 1,
      instruksi: `Ayo pasangkan kartu kegiatan belajar "${materi}" di Kolom Kiri dengan manfaat baiknya di Kolom Kanan!`,
      daftarPremis: [
        { nomor: 1, teks: `Membaca materi ${materi} dengan teliti` },
        { nomor: 2, teks: `Berdiskusi santun bersama teman sekelas` },
        { nomor: 3, teks: `Mempraktikkan ilmu di rumah dan sekolah` },
      ],
      daftarPilihanRespon: [
        { label: 'A', teks: `Membuat kita mengerti cerita dan gagasan utamanya` },
        { label: 'B', teks: `Melatih keberanian dan sikap saling menghargai pendapat` },
        { label: 'C', teks: `Membantu menyelesaikan tugas nyata dan bermanfaat bagi keluarga` },
      ],
      kunciJawabanPasangan: [
        { nomorPremis: 1, labelRespon: 'A' },
        { nomorPremis: 2, labelRespon: 'B' },
        { nomorPremis: 3, labelRespon: 'C' },
      ],
      kodeTP,
      lingkupMateri: materi,
    },
  ];

  const isianItems = [
    {
      nomor: 1,
      pertanyaan: `Materi pokok yang sedang kita pelajari dengan ceria pada bab ini agar tercapai tujuan pembelajaran ${kodeTP} adalah ....`,
      kunciJawaban: materi,
      kodeTP,
      lingkupMateri: materi,
    },
  ];

  const uraianItems = [
    {
      nomor: 1,
      pertanyaan: `Ayo ceritakan dengan bahasamu sendiri yang santun! Mengapa kamu senang belajar materi "${materi}", dan bagaimana caramu memanfaatkan pengetahuan ini untuk membantu teman atau keluargamu di rumah?`,
      kunciJawaban: `Jawaban siswa memuat: 1) Menyebutkan alasan senang mempelajari materi ${materi} dengan bahasa yang santun (skor 2), 2) Menyebutkan contoh nyata cara membantu teman atau keluarga menggunakan ilmu tersebut (skor 2), 3) Kalimat mudah dipahami dan bermakna positif (skor 1). Total skor: 5.`,
      pedomanPenskoran: [
        { kriteria: 'Menyampaikan rasa senang dan pemahaman materi dengan bahasa ramah anak', skorMaks: 2 },
        { kriteria: 'Memberikan contoh nyata bantuan kepada kawan atau keluarga', skorMaks: 2 },
        { kriteria: 'Menuliskan gagasan secara runtut, santun, dan positif', skorMaks: 1 },
      ],
      kodeTP,
      lingkupMateri: materi,
    },
  ];

  return { pgItems, bsItems, menjodohkanItems, isianItems, uraianItems };
}

/**
 * Otomatis membuat dan menerbitkan paket latihan bab baru ke Ruang Murid
 */
export async function autoGenerateAndPublishChapterExercise(params: {
  identitas: SchoolIdentity;
  mataPelajaran: string;
  babJudul: string;
  lingkupMateri: string;
  rumusanTP: string;
  kodeTP: string;
  elemen?: string;
  durasiMenit?: number;
}): Promise<ExamPackage> {
  const {
    identitas,
    mataPelajaran,
    babJudul,
    lingkupMateri,
    rumusanTP,
    kodeTP,
    elemen = 'Elemen Capaian',
    durasiMenit = 45,
  } = params;

  const questions = buildChapterExerciseQuestions({
    materi: lingkupMateri,
    rumusanTP,
    kodeTP,
    mataPelajaran,
    namaSekolah: identitas.namaSatuanPendidikan || 'SD Negeri Fatubai',
    kabupaten: identitas.tempatPenetapan || 'Kab. Timor Tengah Utara',
  });

  const packageId = `pkg-auto-${kodeTP.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  const displayTitle = `Latihan Bab: ${babJudul} (${mataPelajaran})`;

  const examPkg = createExamPackage({
    id: packageId,
    judul: displayTitle,
    mataPelajaran,
    kelas: identitas.kelas || '5',
    semester: (identitas.semester as any) || '1 (Ganjil)',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit,
    daftarTP: [
      {
        kodeTP,
        rumusanTP,
        lingkupMateri,
        elemen,
      },
    ],
    pgItems: questions.pgItems,
    bsItems: questions.bsItems,
    menjodohkanItems: questions.menjodohkanItems,
    isianItems: questions.isianItems,
    uraianItems: questions.uraianItems,
  });

  examPkg.tipePenyusun = 'otomatis_tp';
  examPkg.isActive = true;

  // Simpan permanen ke Firestore dan LocalStorage
  await saveOrPublishExamPackage(examPkg);

  return examPkg;
}

/**
 * Otomatis menyusun soal latihan harian/bab untuk setiap TP yang ada di analisis kurikulum guru
 */
export async function autoSyncExercisesForCurriculumTP(
  tpList: TPItem[],
  identitas: SchoolIdentity
): Promise<{ totalCreated: number; packages: ExamPackage[] }> {
  if (!tpList || tpList.length === 0) {
    return { totalCreated: 0, packages: [] };
  }

  const existing = await getAllExamPackages();
  const created: ExamPackage[] = [];

  for (const tp of tpList) {
    const materi = tp.lingkupMateri || 'Materi Pokok';
    const kodeTP = tp.kodeTP || `TP-${Date.now()}`;
    const babName = `Bab: ${materi}`;

    // Cek apakah sudah ada paket latihan aktif untuk TP ini
    const alreadyExists = existing.some(
      (pkg) =>
        pkg.jenisAsesmen === 'Ulangan Harian' &&
        pkg.mataPelajaran.toLowerCase() === identitas.mataPelajaran.toLowerCase() &&
        pkg.daftarTP.some((t) => t.kodeTP === kodeTP || t.lingkupMateri.toLowerCase() === materi.toLowerCase())
    );

    if (!alreadyExists) {
      try {
        const pkg = await autoGenerateAndPublishChapterExercise({
          identitas,
          mataPelajaran: identitas.mataPelajaran,
          babJudul: babName,
          lingkupMateri: materi,
          rumusanTP: tp.rumusanTP,
          kodeTP,
          elemen: tp.elemen,
          durasiMenit: 45,
        });
        created.push(pkg);
      } catch (err) {
        console.error(`Gagal menyusun otomatis latihan untuk TP ${kodeTP}:`, err);
      }
    }
  }

  return { totalCreated: created.length, packages: created };
}
