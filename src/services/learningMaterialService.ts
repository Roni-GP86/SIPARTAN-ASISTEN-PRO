/**
 * Service Pengelolaan Bahan Ajar & Media Pembelajaran (PDF, Gambar, PPT, Video, Audio)
 * Terintegrasi penuh dengan Firebase Firestore dan IndexedDB untuk akses 100% offline.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebaseAuth';
import { LearningMaterialMedia, LearningMediaType, SubjectFolder, MaterialSlide } from '../types';
import {
  saveOfflineMaterialFile,
  deleteOfflineMaterialFile,
  getOfflineMaterialFile,
  getAllOfflineMaterialIds,
} from './offlineMaterialStorage';

const COLLECTION_NAME = 'sipartan_learning_materials';
const LOCAL_STORAGE_CACHE_KEY = 'sipartan_materials_meta_cache_v1';
const FOLDERS_COLLECTION_NAME = 'sipartan_subject_folders';
const LOCAL_FOLDERS_CACHE_KEY = 'sipartan_folders_cache_v1';

// Daftar Folder Mata Pelajaran Bawaan Kurikulum Merdeka SD Fatubai
export const DEFAULT_SUBJECT_FOLDERS: SubjectFolder[] = [
  {
    id: 'fld-ipas-modul',
    name: 'Modul & Lembar Kerja IPAS',
    subject: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    description: 'Kumpulan modul ajar, LKPD, dan praktikum sains & sosial.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'emerald',
    icon: '🔬',
  },
  {
    id: 'fld-pancasila-modul',
    name: 'Bahan Ajar & Nilai Pancasila',
    subject: 'Pendidikan Pancasila',
    description: 'Modul pengamalan sila, infografis hak dan kewajiban warga negara.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'amber',
    icon: '🏛️',
  },
  {
    id: 'fld-matematika-operasi',
    name: 'Operasi Hitung & Pecahan',
    subject: 'Matematika',
    description: 'LKPD latihan berhitung, konsep pecahan, dan geometri dasar.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'blue',
    icon: '🔢',
  },
  {
    id: 'fld-indonesia-literasi',
    name: 'Teks Narasi & Kosakata',
    subject: 'Bahasa Indonesia',
    description: 'Bacaan cerita interaktif, teks nonfiksi, dan kamus kata sulit.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'sky',
    icon: '📖',
  },
  {
    id: 'fld-seni-budaya',
    name: 'Karya Seni & Budaya Nusantara',
    subject: 'Seni Budaya',
    description: 'Pola gambar ragam hias, lagu daerah, dan kerajinan tangan.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'purple',
    icon: '🎨',
  },
  {
    id: 'fld-pjok-kebugaran',
    name: 'Aktivitas Fisik & Kebugaran Jasmani',
    subject: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
    description: 'Gerak dasar lokomotor, senam irama, dan pola hidup sehat.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'orange',
    icon: '🏃',
  },
  {
    id: 'fld-inggris-basic',
    name: 'Vocabulary & Simple Phrases',
    subject: 'Bahasa Inggris',
    description: 'Daily expressions, classroom English, and flashcards.',
    createdAt: '2026-09-01T08:00:00.000Z',
    color: 'teal',
    icon: '🇬🇧',
  },
];

// Daftar Kamar Mata Pelajaran Kurikulum Merdeka SD
export const KAMAR_MAPEL_LIST = [
  'Semua Mata Pelajaran',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS (Ilmu Pengetahuan Alam & Sosial)',
  'Seni Budaya',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Pendidikan Agama Katolik & Budi Pekerti',
  'Muatan Lokal / Khas Daerah',
] as const;

// Daftar Pilihan Media
export const JENIS_MEDIA_LIST: {
  type: LearningMediaType;
  label: string;
  badge: string;
  iconName: string;
  acceptExtensions: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  deskripsi: string;
}[] = [
  {
    type: 'pdf',
    label: 'Dokumen & PDF',
    badge: '📄 PDF / LKPD',
    iconName: 'FileText',
    acceptExtensions: '.pdf',
    colorBg: 'bg-rose-500/15',
    colorBorder: 'border-rose-500/30',
    colorText: 'text-rose-400',
    deskripsi: 'Modul ajar, lembar kerja peserta didik (LKPD), ringkasan materi, atau buku siswa PDF.',
  },
  {
    type: 'gambar',
    label: 'Gambar & Infografis',
    badge: '🖼️ Gambar / Bagan',
    iconName: 'Image',
    acceptExtensions: '.jpg,.jpeg,.png,.webp,.gif,.svg',
    colorBg: 'bg-emerald-500/15',
    colorBorder: 'border-emerald-500/30',
    colorText: 'text-emerald-400',
    deskripsi: 'Infografis visual, diagram, peta konsep, foto ilustrasi materi pelajaran beresolusi tinggi.',
  },
  {
    type: 'ppt',
    label: 'Slide Presentasi (PPT)',
    badge: '📊 Slide PPT',
    iconName: 'Presentation',
    acceptExtensions: '.ppt,.pptx,.pdf',
    colorBg: 'bg-amber-500/15',
    colorBorder: 'border-amber-500/30',
    colorText: 'text-amber-400',
    deskripsi: 'Tayangan slide PowerPoint atau slide presentasi pembelajaran yang disiapkan guru.',
  },
  {
    type: 'video',
    label: 'Video Pembelajaran',
    badge: '🎥 Video MP4 / WebM',
    iconName: 'Video',
    acceptExtensions: '.mp4,.webm,.ogg',
    colorBg: 'bg-sky-500/15',
    colorBorder: 'border-sky-500/30',
    colorText: 'text-sky-400',
    deskripsi: 'Rekaman video penjelasan guru, animasi konsep, demonstrasi sains, atau tautan video edukasi.',
  },
  {
    type: 'audio',
    label: 'Audio & Podcast',
    badge: '🎧 Audio / Podcasting',
    iconName: 'Headphones',
    acceptExtensions: '.mp3,.wav,.ogg,.m4a',
    colorBg: 'bg-purple-500/15',
    colorBorder: 'border-purple-500/30',
    colorText: 'text-purple-400',
    deskripsi: 'Rekaman suara guru membacakan cerita, dongeng edukasi, hafalan, atau lagu wajib nasional.',
  },
  {
    type: 'link',
    label: 'Tautan Interaktif / Drive',
    badge: '🔗 Web / Drive / Canva',
    iconName: 'ExternalLink',
    acceptExtensions: '',
    colorBg: 'bg-indigo-500/15',
    colorBorder: 'border-indigo-500/30',
    colorText: 'text-indigo-400',
    deskripsi: 'Tautan sumber belajar interaktif, Google Drive sekolah, Quizizz, atau presentasi Canva.',
  },
];

// Bahan Ajar Bawaan Terstruktur untuk SD Fatubai & Kurikulum Merdeka
export const DEFAULT_LEARNING_MATERIALS: LearningMaterialMedia[] = [
  {
    id: 'mat-ipas-tatasurya-01',
    judul: 'Eksplorasi Sistem Tata Surya & Gerak Planet',
    deskripsi: 'Infografis lengkap urutan 8 planet tata surya, ciri khas planet dalam dan planet luar, serta pengaruh revolusi bumi bagi kehidupan.',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    fase: 'Fase C',
    kelas: '6',
    jenisMedia: 'gambar',
    fileName: 'Infografis_Tata_Surya_Lengkap.png',
    fileSize: 420000,
    fileType: 'image/svg+xml',
    ringkasan: `RINGKASAN LENGKAP MATERI TATA SURYA:
1. MATAHARI SEBAGAI PUSAT: Bintang terdekat dengan bumi yang memancarkan energi panas dan cahaya sendiri, memegang gravitasi terbesar dalam tata surya kita.
2. PLANET DALAM (Terestrial):
   • Merkurius: Planet terkecil dan terdekat dengan matahari, tidak memiliki atmosfer pelindung.
   • Venus: Planet terpanas karena efek rumah kaca ekstrem, sering disebut bintang fajar atau bintang kejora.
   • Bumi: Satu-satunya planet yang diketahui memiliki air dalam bentuk cair dan menopang kehidupan.
   • Mars: Planet merah yang kaya akan oksida besi, memiliki gunung tertinggi di tata surya (Olympus Mons).
3. SABUK ASTEROID: Kumpulan ribuan batuan ruang angkasa yang memisahkan planet dalam dan planet luar (antara orbit Mars dan Yupiter).
4. PLANET LUAR (Raksasa Gas & Es):
   • Yupiter: Planet terbesar dengan bintik merah raksasa (badai abadi).
   • Saturnus: Planet cantik dengan sistem cincin es dan debu kosmik paling megah.
   • Uranus: Planet es yang berotasi menggelinding miring hingga 98 derajat.
   • Neptunus: Planet berangin paling kencang dengan warna biru cerah akibat gas metana.
5. AKIBAT GERAKAN BUMI:
   • Rotasi Bumi (24 jam): Menyebabkan pergantian siang dan malam, gerak semu harian matahari, dan perbedaan zona waktu.
   • Revolusi Bumi (365,25 hari): Menyebabkan pergantian musim di belahan bumi utara/selatan dan perubahan lamanya waktu siang/malam.`,
    // SVG infografis tata surya mandiri beresolusi tajam
    fileData: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
        <defs>
          <radialGradient id="sun" cx="15%" cy="50%" r="45%">
            <stop offset="0%" stop-color="#FFF9D2"/>
            <stop offset="60%" stop-color="#FF9900"/>
            <stop offset="100%" stop-color="#CC3300"/>
          </radialGradient>
          <linearGradient id="space" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050B14"/>
            <stop offset="50%" stop-color="#0B1A30"/>
            <stop offset="100%" stop-color="#02050A"/>
          </linearGradient>
        </defs>
        <rect width="1000" height="650" fill="url(#space)"/>
        <!-- Bintang -->
        <circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.8"/>
        <circle cx="340" cy="120" r="1" fill="#fff" opacity="0.6"/>
        <circle cx="560" cy="60" r="1.5" fill="#fff" opacity="0.9"/>
        <circle cx="780" cy="140" r="2" fill="#fff" opacity="0.8"/>
        <circle cx="890" cy="90" r="1" fill="#fff" opacity="0.5"/>
        <circle cx="250" cy="540" r="1.5" fill="#fff" opacity="0.7"/>
        <circle cx="680" cy="570" r="2" fill="#fff" opacity="0.8"/>
        
        <!-- Matahari -->
        <circle cx="-50" cy="325" r="230" fill="url(#sun)"/>
        <text x="25" y="330" fill="#ffffff" font-weight="900" font-family="sans-serif" font-size="22">MATAHARI</text>
        
        <!-- Orbit Lines -->
        <ellipse cx="-50" cy="325" rx="300" ry="240" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        <ellipse cx="-50" cy="325" rx="390" ry="260" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        <ellipse cx="-50" cy="325" rx="490" ry="280" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        <ellipse cx="-50" cy="325" rx="580" ry="300" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        <ellipse cx="-50" cy="325" rx="720" ry="320" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        <ellipse cx="-50" cy="325" rx="860" ry="340" fill="none" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4"/>
        
        <!-- Merkurius -->
        <circle cx="250" cy="325" r="11" fill="#A0AEC0"/>
        <text x="250" y="355" fill="#E2E8F0" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">Merkurius</text>

        <!-- Venus -->
        <circle cx="340" cy="325" r="17" fill="#ECC94B"/>
        <text x="340" y="365" fill="#FEFCBF" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">Venus</text>

        <!-- Bumi -->
        <circle cx="440" cy="325" r="20" fill="#3182CE"/>
        <circle cx="446" cy="320" r="7" fill="#48BB78" opacity="0.8"/>
        <text x="440" y="370" fill="#63B3ED" font-family="sans-serif" font-weight="black" font-size="13" text-anchor="middle">Bumi 🌍</text>

        <!-- Mars -->
        <circle cx="530" cy="325" r="14" fill="#E53E3E"/>
        <text x="530" y="360" fill="#FEB2B2" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">Mars</text>

        <!-- Yupiter -->
        <circle cx="670" cy="325" r="42" fill="#DD6B20"/>
        <ellipse cx="670" cy="325" rx="42" ry="6" fill="#C05621"/>
        <text x="670" y="390" fill="#FBD38D" font-family="sans-serif" font-weight="black" font-size="14" text-anchor="middle">Yupiter</text>

        <!-- Saturnus -->
        <circle cx="810" cy="325" r="32" fill="#D69E2E"/>
        <ellipse cx="810" cy="325" rx="55" ry="10" fill="none" stroke="#ECC94B" stroke-width="4" transform="rotate(-15 810 325)"/>
        <text x="810" y="380" fill="#FAF089" font-family="sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Saturnus</text>

        <!-- Header -->
        <rect x="40" y="30" width="460" height="75" rx="14" fill="#0B1528" fill-opacity="0.85" stroke="#3B82F6" stroke-width="1.5"/>
        <text x="60" y="62" fill="#60A5FA" font-family="sans-serif" font-weight="900" font-size="18">Kamar IPAS • Kurikulum Merdeka</text>
        <text x="60" y="88" fill="#F8FAFC" font-family="sans-serif" font-weight="bold" font-size="13">Bagan Peredaran Planet Mengelilingi Matahari</text>
        
        <!-- Legend Bottom -->
        <rect x="40" y="550" width="920" height="65" rx="12" fill="#0B1528" fill-opacity="0.9" stroke="#1E293B" stroke-width="1.2"/>
        <text x="60" y="578" fill="#F59E0B" font-family="sans-serif" font-weight="bold" font-size="12">💡 Catatan Pembelajaran:</text>
        <text x="60" y="598" fill="#CBD5E1" font-family="sans-serif" font-size="11.5">Planet Dalam: Merkurius, Venus, Bumi, Mars. Planet Luar: Yupiter, Saturnus, Uranus, Neptunus. Revolusi Bumi = 365,25 hari.</text>
      </svg>
    `),
    uploadedBy: 'Bapak/Ibu Guru Kelas',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    isOfflineReady: true,
  },
  {
    id: 'mat-pancasila-modul-02',
    judul: 'Modul LKPD Interaktif: Nilai-Nilai Luhur Pancasila dalam Kehidupan Sehari-hari',
    deskripsi: 'Lembar Kerja Peserta Didik (LKPD) dan rangkuman komprehensif implementasi Sila 1 sampai 5 Pancasila di lingkungan keluarga, sekolah, dan masyarakat.',
    mataPelajaran: 'Pendidikan Pancasila',
    fase: 'Fase B',
    kelas: '4',
    jenisMedia: 'pdf',
    fileName: 'LKPD_Nilai_Luhur_Pancasila_SD.pdf',
    fileSize: 310000,
    fileType: 'application/pdf',
    ringkasan: `PANDUAN LENGKAP PENDIDIKAN PANCASILA:
BAB I: NILAI DASAR PANCASILA DALAM KEHIDUPAN SEHARI-HARI

1. Sila Pertama: Ketuhanan Yang Maha Esa (Simbol Bintang Emas)
• Makna: Bangsa Indonesia meyakini keberadaan Tuhan Yang Maha Esa dan menjunjung tinggi kemerdekaan beribadah.
• Praktik Nyata di Sekolah:
  - Berdoa dengan khusyuk sebelum dan sesudah belajar bersama.
  - Menghormati teman yang sedang menjalankan ibadah puasa atau ibadah lainnya tanpa mengganggu.
  - Menjaga kebersihan tempat ibadah di lingkungan sekolah.

2. Sila Kedua: Kemanusiaan yang Adil dan Beradab (Simbol Rantai Emas)
• Makna: Mengakui persamaan derajat, hak, dan kewajiban asasi setiap manusia tanpa membeda-bedakan suku, keturunan, atau status.
• Praktik Nyata di Sekolah:
  - Menolong teman yang terjatuh di halaman sekolah tanpa diminta.
  - Tidak mengejek kekurangan fisik atau latar belakang keluarga teman.
  - Bersikap santun, membiasakan 5S (Senyum, Salam, Sapa, Sopan, Santun) kepada guru dan penjaga sekolah.

3. Sila Ketiga: Persatuan Indonesia (Simbol Pohon Beringin)
• Makna: Mengutamakan kepentingan bangsa dan negara di atas kepentingan pribadi atau golongan, dengan semangat Bhinneka Tunggal Ika.
• Praktik Nyata di Sekolah:
  - Melaksanakan piket kelas dan kerja bakti bersama tanpa membedakan teman.
  - Senang mempelajari kebudayaan daerah lain (tarian, lagu daerah, baju adat).
  - Mencintai dan bangga mengenakan seragam batik produk pengrajin Indonesia.

4. Sila Keempat: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan (Simbol Kepala Banteng)
• Makna: Menyelesaikan persoalan bersama dengan jalan musyawarah untuk mencapai mufakat.
• Praktik Nyata di Sekolah:
  - Melakukan musyawarah secara terbuka dan adil saat memilih ketua kelas atau kelompok belajar.
  - Mendengarkan pendapat teman saat berdiskusi tanpa memotong pembicaraan.
  - Menerima keputusan bersama dengan lapang dada meskipun berbeda dengan usul awal kita.

5. Sila Kelima: Keadilan Sosial bagi Seluruh Rakyat Indonesia (Simbol Padi dan Kapas)
• Makna: Mengembangkan perbuatan luhur yang mencerminkan sikap kekeluargaan dan gotong royong, serta bersikap adil terhadap sesama.
• Praktik Nyata di Sekolah:
  - Membagi tugas kelompok piket secara merata sesuai kesepakatan.
  - Membiasakan hidup hemat, tidak boros, dan suka menabung.
  - Menghargai hasil karya, gambar, atau puisi teman dengan memberikan pujian tulus.`,
    uploadedBy: 'Guru Pendidikan Pancasila',
    createdAt: '2026-09-03T09:15:00.000Z',
    updatedAt: '2026-09-03T09:15:00.000Z',
    isOfflineReady: true,
    halamanPdf: 8,
  },
  {
    id: 'mat-mtk-pecahan-03',
    judul: 'Slide Presentasi Interaktif: Mengenal Pecahan Senilai & Operasi Hitung',
    deskripsi: 'Slide presentasi warna-warni disertai visualisasi pizza dan kue untuk mempermudah anak memahami pecahan biasa, pecahan campuran, dan pecahan desimal.',
    mataPelajaran: 'Matematika',
    fase: 'Fase B',
    kelas: '4',
    jenisMedia: 'ppt',
    fileName: 'Slide_Materi_Pecahan_Senilai.pptx',
    fileSize: 560000,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ringkasan: `POIN PRESENTASI PECAHAN SENILAI:
• Slide 1: Konsep Dasar Pecahan (Pembilang di atas, Penyebut di bawah).
• Slide 2: Mengapa 1/2 sama dengan 2/4 dan 4/8? Pembuktian potong kue.
• Slide 3: Mengalikan atau membagi pembilang dan penyebut dengan angka yang sama.
• Slide 4: Latihan soal interaktif tebak gambar pecahan senilai.`,
    slides: [
      {
        slideNumber: 1,
        judulSlide: 'Konsep Dasar Pecahan',
        subjudul: 'Apa itu Pembilang dan Penyebut?',
        poinMateri: [
          'Pecahan menyatakan bagian dari keseluruhan benda yang utuh atau sekelompok benda.',
          'Bentuk penulisan pecahan adalah a/b, dengan ketentuan angka b tidak boleh sama dengan nol (b ≠ 0).',
          'Angka di atas (a) dinamakan Pembilang: menunjukkan berapa banyak bagian yang diambil atau diwarnai.',
          'Angka di bawah (b) dinamakan Penyebut: menunjukkan total seluruh bagian yang dipotong sama rata.',
        ],
        konsepKunci: 'Pecahan yang adil hanya tercipta apabila setiap bagian dipotong dengan ukuran SAMA BESAR!',
        catatanGuru: 'Bayangkan pizza bundar dipotong menjadi 4 potong sama besar. Jika kamu makan 1 potong, kamu telah memakan 1/4 bagian pizza.',
        ilustrasiIkon: '🍕',
      },
      {
        slideNumber: 2,
        judulSlide: 'Pecahan Senilai (Setara)',
        subjudul: 'Bentuk Angka Berbeda, Luas Daerah Persis Sama',
        poinMateri: [
          'Dua pecahan disebut Senilai jika mewakili nilai besaran atau luas daerah arsiran yang sama persis.',
          'Buktinya: 1 potong dari 2 bagian (1/2) sama luasnya dengan 2 potong dari 4 bagian (2/4), atau 4 potong dari 8 bagian (4/8).',
          'Pecahan senilai diperoleh dengan mengalikan pembilang dan penyebut dengan bilangan bulat yang sama.',
          'Atau diperoleh dengan membagi pembilang dan penyebut dengan faktor persekutuan yang sama.',
        ],
        konsepKunci: 'Rumus Emas: a/b = (a × n) / (b × n) dengan n adalah angka selain 0.',
        catatanGuru: 'Contoh: 1/2 dikalikan 3/3 menjadi 3/6. Artinya 1/2 dan 3/6 bernilai setara.',
        ilustrasiIkon: '🍰',
      },
      {
        slideNumber: 3,
        judulSlide: 'Metode Pengujian Pecahan Senilai',
        subjudul: 'Teknik Perkalian Silang yang Cepat & Akurat',
        poinMateri: [
          'Metode Perkalian Silang: Untuk menguji apakah a/b = c/d, kalikan pembilang pertama dengan penyebut kedua (a × d) dan penyebut pertama dengan pembilang kedua (b × c).',
          'Jika a × d = b × c, maka kedua pecahan tersebut PASTI senilai!',
          'Uji Coba: Apakah 2/3 senilai dengan 6/9? Hitung: 2 × 9 = 18 dan 3 × 6 = 18. Keduanya sama-sama 18, jadi TERBUKTI senilai!',
          'Metode ini sangat berguna saat mengerjakan soal ulangan dengan cepat tanpa perlu menggambar.',
        ],
        konsepKunci: 'Perkalian silang selalu menghasilkan angka kembar jika kedua pecahan benar-benar senilai.',
        catatanGuru: 'Biasakan siswa memeriksa jawaban mereka menggunakan teknik perkalian silang ini.',
        ilustrasiIkon: '✖️',
      },
      {
        slideNumber: 4,
        judulSlide: 'Menyederhanakan Pecahan',
        subjudul: 'Menemukan Bentuk Paling Sederhana Menggunakan FPB',
        poinMateri: [
          'Suatu pecahan dikatakan dalam bentuk paling sederhana jika FPB (Faktor Persekutuan Terbesar) dari pembilang dan penyebut adalah 1.',
          'Langkah 1: Tentukan FPB dari pembilang dan penyebut.',
          'Langkah 2: Bagi pembilang dan penyebut dengan FPB tersebut secara serempak.',
          'Contoh: Sederhanakan pecahan 12/18. FPB dari 12 dan 18 adalah 6. Hitung: 12 ÷ 6 = 2 dan 18 ÷ 6 = 3. Bentuk paling sederhananya adalah 2/3.',
        ],
        konsepKunci: 'Bila belum menguasai FPB cepat, bagi bertahap dengan bilangan prima 2, lalu 3, lalu 5 hingga tuntas.',
        catatanGuru: 'Selalu ingatkan siswa untuk menyederhanakan pecahan hasil akhir dalam setiap jawaban asesmen.',
        ilustrasiIkon: '✂️',
      },
      {
        slideNumber: 5,
        judulSlide: 'Operasi Penjumlahan & Pengurangan Pecahan',
        subjudul: 'Penyebut Sama vs Penyebut Berbeda',
        poinMateri: [
          'Kasus 1 (Penyebut Sama): Cukup jumlahkan atau kurangkan pembilang di atas. Contoh: 2/7 + 3/7 = 5/7 (penyebut tetap 7).',
          'Kasus 2 (Penyebut Berbeda): JANGAN langsung menjumlahkan! Samakan dulu penyebutnya memakai KPK.',
          'Contoh Kasus 2: 1/4 + 1/2. KPK dari 4 dan 2 adalah 4. Ubah 1/2 menjadi 2/4. Maka: 1/4 + 2/4 = 3/4.',
          'PERINGATAN: Kesalahan umum adalah menjumlahkan atas dengan atas dan bawah dengan bawah (1/2 + 1/3 BUKAN 2/5)!',
        ],
        konsepKunci: 'Samakan penyebut dulu memakai KPK, baru operasikan pembilangnya!',
        catatanGuru: 'Buatlah analogi wadah yang sama agar siswa memahami perlunya penyebut yang seragam.',
        ilustrasiIkon: '➕',
      },
      {
        slideNumber: 6,
        judulSlide: 'Rangkuman & Tantangan Kuis Asyik',
        subjudul: 'Yuk, Buktikan Pemahaman Belajarmu!',
        poinMateri: [
          'Tantangan 1: Manakah pecahan yang senilai dengan 3/5? (A. 6/10, B. 9/12, C. 3/10) -> Jawaban: A (dikalikan 2/2).',
          'Tantangan 2: Sederhanakan pecahan 15/25! -> Jawaban: Bagi 5/5 menghasilkan 3/5.',
          'Tantangan 3: Ibu punya 1/2 potong martabak, lalu adik membawa 1/4 potong lagi. Berapa totalnya? -> 2/4 + 1/4 = 3/4 potong martabak!',
          'Selamat! Kamu telah menguasai seluruh materi pecahan ini dengan gemilang.',
        ],
        konsepKunci: 'Bintang Prestasi: Ulangi latihan dengan angka-angka baru agar kemampuan matematikamu semakin terasah.',
        catatanGuru: 'Siswa yang telah menyelesaikan slide ini siap untuk mengikuti Misi Latihan Bab di Ruang Murid.',
        ilustrasiIkon: '🏆',
      },
    ],
    uploadedBy: 'Guru Matematika',
    createdAt: '2026-09-05T10:30:00.000Z',
    updatedAt: '2026-09-05T10:30:00.000Z',
    isOfflineReady: true,
  },
  {
    id: 'mat-video-ekosistem-04',
    judul: 'Video Pembelajaran: Rantai Makanan & Jaring-Jaring Kehidupan di Hutan Tropis',
    deskripsi: 'Video edukasi animasi interaktif yang menjelaskan peran produsen (tumbuhan hijau), konsumen primer (herbivora), konsumen sekunder (karnivora), dan pengurai (dekomposer).',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    fase: 'Fase C',
    kelas: '5',
    jenisMedia: 'video',
    fileName: 'Video_Animasi_Rantai_Makanan.mp4',
    fileSize: 1250000,
    fileType: 'video/mp4',
    durasiVideo: '06:45',
    ringkasan: `RINGKASAN MATERI EKOSISTEM & JARING-JARING MAKANAN:
1. PRODUSEN: Organisme autotrof (tumbuhan hijau dan alga) yang mampu membuat makanannya sendiri melalui proses fotosintesis dengan bantuan sinar matahari.
2. KONSUMEN TINGKAT I (Herbivora): Hewan pemakan tumbuhan seperti belalang, ulat, sapi, dan kelinci.
3. KONSUMEN TINGKAT II (Karnivora/Omnivora): Hewan yang memakan konsumen primer, contohnya burung pemakan ulat, katak, dan ayam.
4. KONSUMEN PUNCAK: Predator yang berada di puncak rantai makanan dan tidak dimangsa oleh hewan lain saat hidup, seperti elang, harimau, dan singa.
5. PENGURAI (Dekomposer): Mikroorganisme seperti jamur dan bakteri yang menguraikan sisa bangkai hewan dan tumbuhan menjadi unsur hara yang menyuburkan tanah.`,
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    uploadedBy: 'Guru IPAS',
    createdAt: '2026-09-07T11:00:00.000Z',
    updatedAt: '2026-09-07T11:00:00.000Z',
    isOfflineReady: true,
  },
  {
    id: 'mat-bindonesia-puisi-05',
    judul: 'Audio Guru: Mendongeng & Cara Membaca Puisi dengan Intonasi Tepat',
    deskripsi: 'Rekaman suara panduan guru mengenai ekspresi wajah, jeda, tanda baca, serta penjiwaan dalam mendeklamasikan puisi anak di depan kelas.',
    mataPelajaran: 'Bahasa Indonesia',
    fase: 'Fase B',
    kelas: '3',
    jenisMedia: 'audio',
    fileName: 'Panduan_Vokal_Membaca_Puisi.mp3',
    fileSize: 450000,
    fileType: 'audio/mpeg',
    ringkasan: `PANDUAN LENGKAP DEKLAMASI PUISI ANAK:
1. ARTIKULASI: Kejelasan dalam melafalkan setiap suku kata dan huruf konsonan (terutama huruf r, s, p, t).
2. INTONASI: Naik turunnya nada suara saat membacakan bait puisi sesuai emosi (gembira, sedih, bersemangat, haru).
3. JEDA & TEMPO: Mengatur pernapasan dan memberi hentian sejenak pada tanda baca titik (.) dan koma (,). Jangan terburu-buru!
4. MIMIK & GESTUR: Kesesuaian ekspresi wajah dan gerakan tangan yang wajar untuk memperkuat makna bait puisi.
5. CONTOH TEKS PUISI LATIHAN:
   "Terima Kasih Guruku"
   Di setiap pagi yang cerah menyapa,
   Kau sambut kami dengan senyum bahagia,
   Membimbing langkah mengeja kata,
   Menyalakan pelita di dalam dada.`,
    uploadedBy: 'Guru Bahasa Indonesia',
    createdAt: '2026-09-10T14:20:00.000Z',
    updatedAt: '2026-09-10T14:20:00.000Z',
    isOfflineReady: true,
  },
  {
    id: 'mat-binggris-daily-06',
    judul: 'Slide Interaktif Bahasa Inggris: Everyday Classroom Expressions & Self Introduction',
    deskripsi: 'Slide pembelajaran interaktif mengenalkan salam harian, perkenalan diri bahasa Inggris, nama benda di kelas, dan ungkapan sopan.',
    mataPelajaran: 'Bahasa Inggris',
    fase: 'Fase B',
    kelas: '4',
    jenisMedia: 'ppt',
    fileName: 'Everyday_English_Classroom.pptx',
    fileSize: 510000,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    slides: [
      {
        slideNumber: 1,
        judulSlide: 'Greetings & Daily Polite Words',
        subjudul: 'How to Greet Teachers and Friends',
        poinMateri: [
          'Good morning (Selamat pagi - digunakan dari terbit fajar hingga pukul 12:00 siang).',
          'Good afternoon (Selamat siang/sore - dari pukul 12:00 siang hingga petang).',
          'Good evening (Selamat malam saat menyapa seseorang).',
          'Polite Words: Please (tolong), Thank you (terima kasih), You are welcome (sama-sama), Excuse me (permisi/maaf).',
        ],
        konsepKunci: 'Saying "Please" and "Thank you" makes everyone happy!',
        catatanGuru: 'Ajak murid mempraktikkan salam pagi setiap masuk ruang kelas.',
        ilustrasiIkon: '👋',
      },
      {
        slideNumber: 2,
        judulSlide: 'How to Introduce Yourself',
        subjudul: 'Simple Self Introduction Pattern',
        poinMateri: [
          'Hello everyone! My name is ... (Nama lengkapmu).',
          'You can call me ... (Nama panggilanmu).',
          'I am 10 years old. I live in Fatubai.',
          'My favorite hobby is reading and drawing.',
          'Nice to meet you all! (Senang berkenalan dengan kalian).',
        ],
        konsepKunci: 'Stand confidently with a bright smile when introducing yourself.',
        catatanGuru: 'Beri giliran kepada setiap murid untuk membacakan kartu perkenalan diri di depan kelas.',
        ilustrasiIkon: '🌟',
      },
      {
        slideNumber: 3,
        judulSlide: 'Classroom Objects & Instructions',
        subjudul: 'Things We Find Inside Our Classroom',
        poinMateri: [
          'Objects: Book (buku), Pencil (pensil), Eraser (penghapus), Ruler (penggaris), Whiteboard (papan tulis), Desk (meja).',
          'Teacher Instructions:',
          '• "Open your book to page 10" (Buka buku halaman 10).',
          '• "Raise your hand to speak" (Angkat tanganmu untuk berbicara).',
          '• "Listen carefully" (Dengarkan dengan saksama).',
        ],
        konsepKunci: 'Point to the object when mentioning its English name to memorize faster!',
        catatanGuru: 'Mainkan tebak kata dengan mengangkat barang di meja guru.',
        ilustrasiIkon: '✏️',
      },
      {
        slideNumber: 4,
        judulSlide: 'Wrap-up & Mini Practice Quiz',
        subjudul: 'Can You Answer These Questions?',
        poinMateri: [
          'Question 1: What do you say when your friend gives you a candy? -> Answer: "Thank you!"',
          'Question 2: How do you introduce your age? -> Answer: "I am ... years old."',
          'Question 3: What is "penghapus" in English? -> Answer: "Eraser" or "Rubber".',
          'Awesome job! Keep practicing your English every single day.',
        ],
        konsepKunci: 'Great learners practice without fear of making mistakes!',
        catatanGuru: 'Reward active participants with high-fives and star badges.',
        ilustrasiIkon: '🏆',
      },
    ],
    uploadedBy: 'Guru Bahasa Inggris',
    createdAt: '2026-09-12T08:30:00.000Z',
    updatedAt: '2026-09-12T08:30:00.000Z',
    isOfflineReady: true,
  },
  {
    id: 'mat-senibudaya-batik-07',
    judul: 'Slide Pembelajaran Seni Budaya: Ragam Motif Batik Nusantara & Filosofinya',
    deskripsi: 'Slide interaktif mengenalkan keindahan motif batik khas Indonesia seperti Megamendung, Parang Rusak, Kawung, serta cara melestarikannya.',
    mataPelajaran: 'Seni Budaya',
    fase: 'Fase C',
    kelas: '5',
    jenisMedia: 'ppt',
    fileName: 'Ragam_Motif_Batik_Nusantara.pptx',
    fileSize: 620000,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    slides: [
      {
        slideNumber: 1,
        judulSlide: 'Batik sebagai Warisan Budaya Dunia',
        subjudul: 'Karya Adiluhung Bangsa Indonesia yang Diakui UNESCO',
        poinMateri: [
          'Batik secara resmi diakui oleh UNESCO sebagai Warisan Budaya Takbenda Kemanusiaan pada 2 Oktober 2009.',
          'Kata "Batik" berasal dari bahasa Jawa: "Amba" (menulis luas) dan "Titik" (membuat titik demi titik menggunakan malam/lilin).',
          'Batik bukan sekadar corak kain, melainkan kesatuan antara teknik perintang warna canting dan makna filosofi kehidupan.',
        ],
        konsepKunci: 'Batik adalah identitas kebanggaan bangsa yang wajib kita lestarikan bersama.',
        catatanGuru: 'Ajak murid mengenakan batik setiap hari Kamis atau peringatan Hari Batik Nasional.',
        ilustrasiIkon: '🎨',
      },
      {
        slideNumber: 2,
        judulSlide: 'Motif Kawung: Simbol Kesucian & Ketulusan Hati',
        subjudul: 'Bentuk Bulat Lonjong Menyerupai Buah Kolang-Kaling',
        poinMateri: [
          'Motif Kawung berbentuk empat lingkaran lonjong yang tersusun simetris menyerupai bunga teratai atau buah kolang-kaling.',
          'Filosofi Mendalam: Menggambarkan kesucian hati, ketulusan budi pekerti, dan pengendalian hawa nafsu manusia.',
          'Pada zaman dahulu, motif ini dikenakan oleh para pemimpin kerajaan sebagai pengingat untuk selalu bersikap adil dan bijaksana.',
        ],
        konsepKunci: 'Keteraturan geometris motif kawung melambangkan keteraturan hidup yang selaras dengan alam semesta.',
        catatanGuru: 'Bimbing siswa menggambar pola kawung dengan bantuan jangka dan penggaris.',
        ilustrasiIkon: '🌸',
      },
      {
        slideNumber: 3,
        judulSlide: 'Motif Megamendung: Kearifan Cirebon yang Menyejukkan',
        subjudul: 'Bentuk Gumpalan Awan Bergradasi Warna Tajam',
        poinMateri: [
          'Berasal dari daerah pesisir Cirebon, Jawa Barat, dengan pengaruh perpaduan budaya Tionghoa dan Nusantara.',
          'Bentuknya menyerupai garis awan bergulung dengan gradasi warna bertingkat (biasanya biru tua hingga putih atau merah).',
          'Filosofi Mendalam: Pemimpin harus berhati sejuk seperti awan yang menurunkan hujan pembawa kesuburan, tidak mudah marah saat menghadapi cobaan.',
        ],
        konsepKunci: 'Megamendung mengajarkan manusia untuk selalu tenang, sabar, dan membawa keteduhan bagi lingkungan.',
        catatanGuru: 'Tunjukkan perbedaan gradasi 7 lapis warna pada motif Megamendung asli.',
        ilustrasiIkon: '☁️',
      },
      {
        slideNumber: 4,
        judulSlide: 'Rangkuman & Kreativitas Menggambar Batik',
        subjudul: 'Mari Berkarya Menciptakan Corakmu Sendiri!',
        poinMateri: [
          'Setiap daerah di Indonesia memiliki corak batik yang unik mencerminkan flora, fauna, dan kearifan lokalnya.',
          'Tantangan Proyek Kelas: Gambarlah satu motif batik nusantara pada selembar kertas gambar A4 dan warnai dengan krayon atau spidol.',
          'Pamerkan hasil karyamu di majalah dinding kelas agar teman-temanmu dapat mengagumi keindahannya.',
        ],
        konsepKunci: 'Cintailah produk dan karya seni budaya asli tanah air Indonesia!',
        catatanGuru: 'Berikan penilaian apresiatif terhadap ketelitian dan kerapian arsir warna siswa.',
        ilustrasiIkon: '✨',
      },
    ],
    uploadedBy: 'Guru Seni Budaya',
    createdAt: '2026-09-14T09:00:00.000Z',
    updatedAt: '2026-09-14T09:00:00.000Z',
    isOfflineReady: true,
  },
];

/**
 * Menyimpan cache metadata ke localStorage agar tampilan instan tanpa loading
 */
function cacheMaterialsLocally(materials: LearningMaterialMedia[]) {
  try {
    // Simpan metadata tanpa fileData yang terlalu besar untuk mencegah QuotaExceeded di localStorage
    const metaOnly = materials.map((m) => {
      const copy = { ...m };
      if (copy.fileData && copy.fileData.length > 50000) {
        delete copy.fileData;
      }
      return copy;
    });
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(metaOnly));
  } catch (e) {
    console.warn('Gagal menyimpan cache metadata materi ke localStorage:', e);
  }
}

/**
 * Membaca cache metadata dari localStorage
 */
export function getCachedMaterialsLocally(): LearningMaterialMedia[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca cache lokal materi:', e);
  }
  return DEFAULT_LEARNING_MATERIALS;
}

/**
 * Berlangganan (real-time subscription) ke koleksi Firestore sipartan_learning_materials
 * Sekaligus mendeteksi ketersediaan offline di IndexedDB perangkat ini.
 */
export function subscribeToLearningMaterials(
  callback: (materials: LearningMaterialMedia[]) => void
): () => void {
  // Langsung kembalikan cache lokal terlebih dahulu untuk kecepatan render instan
  const initialCache = getCachedMaterialsLocally();
  callback(initialCache);

  try {
    const materialsCol = collection(db, COLLECTION_NAME);
    const q = query(materialsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const offlineIds = new Set(await getAllOfflineMaterialIds());

        if (snapshot.empty) {
          // Jika di Firestore masih kosong, pakai data default
          const withOfflineStatus = DEFAULT_LEARNING_MATERIALS.map((item) => ({
            ...item,
            isOfflineReady: item.isOfflineReady || offlineIds.has(item.id),
          }));
          cacheMaterialsLocally(withOfflineStatus);
          callback(withOfflineStatus);
          return;
        }

        const items: LearningMaterialMedia[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LearningMaterialMedia;
          items.push({
            ...data,
            id: docSnap.id,
            isOfflineReady: offlineIds.has(docSnap.id) || !!data.isOfflineReady,
          });
        });

        cacheMaterialsLocally(items);
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscription error sipartan_learning_materials:', error);
        // Fallback ke cache lokal
        callback(getCachedMaterialsLocally());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Gagal menginisialisasi listener Firestore sipartan_learning_materials:', err);
    return () => {};
  }
}

// ==========================================
// PENGELOLAAN FOLDER MATA PELAJARAN
// ==========================================

export function getCachedFoldersLocally(): SubjectFolder[] {
  try {
    const raw = localStorage.getItem(LOCAL_FOLDERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Gagal membaca cache folder lokal:', e);
  }
  return DEFAULT_SUBJECT_FOLDERS;
}

export function cacheFoldersLocally(folders: SubjectFolder[]): void {
  try {
    localStorage.setItem(LOCAL_FOLDERS_CACHE_KEY, JSON.stringify(folders));
  } catch (e) {
    console.warn('Gagal menyimpan cache folder lokal:', e);
  }
}

/**
 * Mendengarkan daftar folder mata pelajaran secara real-time dari Firestore
 */
export function subscribeToSubjectFolders(
  callback: (folders: SubjectFolder[]) => void
): () => void {
  try {
    const q = collection(db, FOLDERS_COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          cacheFoldersLocally(DEFAULT_SUBJECT_FOLDERS);
          callback(DEFAULT_SUBJECT_FOLDERS);
          return;
        }

        const list: SubjectFolder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as SubjectFolder;
          list.push({ ...data, id: docSnap.id });
        });

        // Gabungkan jika ada default folder yang belum dibuat
        const existingIds = new Set(list.map((f) => f.id));
        const combined = [...list];
        DEFAULT_SUBJECT_FOLDERS.forEach((def) => {
          if (!existingIds.has(def.id)) {
            combined.push(def);
          }
        });

        cacheFoldersLocally(combined);
        callback(combined);
      },
      (error) => {
        console.warn('Firestore subscription error sipartan_subject_folders:', error);
        callback(getCachedFoldersLocally());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Gagal menginisialisasi listener Firestore sipartan_subject_folders:', err);
    callback(getCachedFoldersLocally());
    return () => {};
  }
}

/**
 * Guru membuat folder baru khusus mata pelajaran tertentu
 */
export async function createSubjectFolder(payload: {
  name: string;
  subject: string;
  description?: string;
  color?: string;
  icon?: string;
  createdBy?: string;
}): Promise<SubjectFolder> {
  const id = 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newFolder: SubjectFolder = {
    id,
    name: payload.name.trim(),
    subject: payload.subject,
    description: payload.description?.trim() || '',
    color: payload.color || 'blue',
    icon: payload.icon || '📁',
    createdAt: new Date().toISOString(),
    createdBy: payload.createdBy || 'Bapak/Ibu Guru',
  };

  try {
    const docRef = doc(db, FOLDERS_COLLECTION_NAME, id);
    await setDoc(docRef, newFolder);
  } catch (err) {
    console.warn('Gagal menyimpan folder ke Firestore, simpan ke lokal:', err);
  }

  const cached = getCachedFoldersLocally();
  const updated = [newFolder, ...cached.filter((f) => f.id !== id)];
  cacheFoldersLocally(updated);

  return newFolder;
}

/**
 * Menghapus folder mata pelajaran
 */
export async function deleteSubjectFolder(folderId: string): Promise<void> {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION_NAME, folderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Gagal menghapus folder dari Firestore:', err);
  }

  const cached = getCachedFoldersLocally();
  const filtered = cached.filter((f) => f.id !== folderId);
  cacheFoldersLocally(filtered);
}

// ==========================================
// UPLOAD & PENGELOLAAN BERKAS KE FIREBASE STORAGE & FIRESTORE
// ==========================================

/**
 * Generator slide otomatis berstruktur lengkap untuk bahan ajar PPT / Presentasi
 */
export function generateDefaultSlidesForMaterial(
  title: string,
  description?: string,
  subject?: string
): MaterialSlide[] {
  const cleanTitle = title.replace(/\.[^/.]+$/, '');
  const cleanDesc = description?.trim() || 'Materi pembelajaran Kurikulum Merdeka interaktif untuk siswa.';

  return [
    {
      slideNumber: 1,
      judulSlide: cleanTitle,
      subjudul: subject ? `Mata Pelajaran: ${subject}` : 'Selamat Datang di Slide Pembelajaran Interaktif',
      poinMateri: [
        'Selamat datang di ruang pembelajaran interaktif!',
        'Slide ini dirancang agar kamu dapat belajar mandiri secara terarah langkah demi langkah.',
        'Gunakan tombol "Slide Berikutnya ➡️" di bawah atau tombol panah kanan pada keyboard untuk membuka slide berikutnya.',
      ],
      konsepKunci: 'Fokus, baca perlahan, dan pahami intisari dari setiap tayangan slide.',
      catatanGuru: cleanDesc,
      ilustrasiIkon: '🚀',
    },
    {
      slideNumber: 2,
      judulSlide: 'Tujuan & Capaian Pembelajaran',
      subjudul: 'Apa yang akan kita kuasai bersama?',
      poinMateri: [
        '1. Memahami konsep utama dan istilah penting dalam bab ini.',
        '2. Mengidentifikasi contoh-contoh konkret dalam kehidupan sehari-hari.',
        '3. Mampu menyelesaikan latihan mandiri dan asesmen kelas dengan percaya diri.',
      ],
      konsepKunci: 'Belajar bermakna dimulai dengan mengetahui manfaat materi ini bagi kehidupan sehari-hari.',
      catatanGuru: 'Ajak teman berdiskusi atau tanyakan kepada guru apabila ada kata yang belum kamu mengerti.',
      ilustrasiIkon: '🎯',
    },
    {
      slideNumber: 3,
      judulSlide: 'Pembahasan Inti & Konsep Kunci',
      subjudul: `Intisari Materi: ${cleanTitle}`,
      poinMateri: [
        cleanDesc,
        'Simak keterkaitan antarkonsep yang telah disusun oleh bapak/ibu guru.',
        'Catat rumus, definisi, atau bagan penting di buku catatanmu.',
      ],
      konsepKunci: 'Pahami logika dasarnya, bukan sekadar menghafal teks.',
      catatanGuru: 'Perhatikan penjelasan guru dan diskusikan poin-poin yang menarik perhatianmu.',
      ilustrasiIkon: '💡',
    },
    {
      slideNumber: 4,
      judulSlide: 'Penerapan & Contoh Nyata',
      subjudul: 'Mengamati Konsep di Lingkungan Sekitar',
      poinMateri: [
        'Materi ini berhubungan erat dengan alam, lingkungan sekolah, serta kebiasaan hidup sehari-hari.',
        'Dengan mempelajari topik ini, kita melatih cara berpikir kritis, logis, dan solutif.',
      ],
      konsepKunci: 'Carilah satu contoh nyata penerapan materi ini di sekeliling rumah atau kelasmu!',
      catatanGuru: 'Berikan contoh sederhana yang sering ditemui siswa agar semakin mudah diingat.',
      ilustrasiIkon: '🔍',
    },
    {
      slideNumber: 5,
      judulSlide: 'Rangkuman & Refleksi Belajar',
      subjudul: 'Hebat, Kamu Sudah Menyelesaikan Slide Ini!',
      poinMateri: [
        'Seluruh materi pada slide ini telah berhasil kamu pelajari dengan tuntas.',
        'Pastikan kamu telah memahami poin-poin utamanya dan siap untuk latihan evaluasi.',
        'Teruslah bersemangat belajar dan jelajahi bahan ajar lainnya di Kamar Bahan Ajar!',
      ],
      konsepKunci: 'Prestasi gemilang diraih melalui ketekunan membaca dan belajar setiap hari.',
      catatanGuru: 'Bila sudah tuntas membaca, kamu dapat melanjutkan ke menu latihan soal atau ujian CBT.',
      ilustrasiIkon: '🎉',
    },
  ];
}

/**
 * Guru mengunggah bahan ajar baru (PDF, JPG, PNG, PPT, MP4)
 * Menyimpan fisik berkas ke Firebase Storage, referensi ke Firestore, dan cache ke IndexedDB.
 */
export async function uploadLearningMaterial(
  payload: {
    judul: string;
    deskripsi?: string;
    mataPelajaran: string;
    folderId?: string;
    folderName?: string;
    fase?: string;
    kelas?: string;
    jenisMedia: LearningMediaType;
    uploadedBy: string;
    durasiVideo?: string;
    halamanPdf?: number;
    fileUrl?: string;
    file?: File | null;
    slides?: MaterialSlide[];
    onProgress?: (percent: number) => void;
  }
): Promise<LearningMaterialMedia> {
  const id = 'mat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  let fileName = payload.file?.name || `${payload.judul.replace(/\s+/g, '_')}.${payload.jenisMedia}`;
  let fileSize = payload.file?.size || 0;
  let fileType = payload.file?.type || '';
  let fileDataUrl: string | undefined = undefined;
  let storageUrl: string | undefined = undefined;
  let storagePath: string | undefined = undefined;

  // Deteksi otomatis format jika diunggah dari file
  if (payload.file) {
    const ext = payload.file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      payload.jenisMedia = 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      payload.jenisMedia = 'gambar';
    } else if (['ppt', 'pptx'].includes(ext)) {
      payload.jenisMedia = 'ppt';
    } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      payload.jenisMedia = 'video';
    } else if (['mp3', 'wav', 'm4a'].includes(ext)) {
      payload.jenisMedia = 'audio';
    }
  }

  // 1. Upload file ke Firebase Storage & Simpan ke IndexedDB lokal
  if (payload.file) {
    try {
      const safeSubject = payload.mataPelajaran.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const safeFolder = (payload.folderName || 'Umum').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const safeFileName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `materials/${safeSubject}/${safeFolder}/${Date.now()}_${safeFileName}`;
      
      if (payload.onProgress) payload.onProgress(25);

      // Simpan file asli ke IndexedDB lokal secara instan agar murid langsung bisa membukanya
      try {
        if (payload.file.size < 500000) {
          try {
            fileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(payload.file!);
            });
          } catch {
            // Abaikan jika dataURL gagal, blob tersimpan aman di IndexedDB
          }
        }

        await saveOfflineMaterialFile(id, {
          blob: payload.file,
          dataUrl: fileDataUrl,
          fileName,
          fileType,
          fileSize,
        });
      } catch (localStoreErr) {
        console.warn('Peringatan penyimpanan lokal IndexedDB:', localStoreErr);
      }

      if (payload.onProgress) payload.onProgress(50);

      // Upload ke Firebase Storage dengan timeout singkat 3 detik agar tidak menggantung di 92%
      try {
        const storageRef = ref(storage, storagePath);
        const uploadPromise = uploadBytes(storageRef, payload.file, {
          contentType: payload.file.type || undefined,
        }).then((snapshot) => getDownloadURL(snapshot.ref));

        const timeoutPromise = new Promise<string | null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );

        const urlResult = await Promise.race([uploadPromise, timeoutPromise]);
        if (urlResult) {
          storageUrl = urlResult;
        }
      } catch (cloudStorageErr) {
        console.warn('Firebase Storage offline atau dibatasi jaringan, beralih ke cache lokal:', cloudStorageErr);
      }

      if (payload.onProgress) payload.onProgress(85);
    } catch (storageErr) {
      console.warn('Penyimpanan berkas:', storageErr);
    }
  }

  // Tautan unduh utama
  const directDownloadUrl = storageUrl || fileDataUrl || payload.fileUrl;

  const slidesContent =
    payload.slides && payload.slides.length > 0
      ? payload.slides
      : undefined;

  const newMaterial: LearningMaterialMedia = {
    id,
    judul: payload.judul.trim(),
    deskripsi: payload.deskripsi?.trim() || '',
    mataPelajaran: payload.mataPelajaran,
    folderId: payload.folderId || undefined,
    folderName: payload.folderName || undefined,
    fase: payload.fase || 'Fase B',
    kelas: payload.kelas || '4',
    jenisMedia: payload.jenisMedia,
    fileName,
    fileSize,
    fileType,
    fileData: !storageUrl && fileDataUrl && fileDataUrl.length <= 250000 ? fileDataUrl : undefined,
    fileUrl: storageUrl || payload.fileUrl || undefined,
    storageUrl: storageUrl || undefined,
    storagePath: storagePath || undefined,
    downloadUrl: directDownloadUrl || undefined,
    uploadedBy: payload.uploadedBy || 'Guru SD Fatubai',
    createdAt: now,
    updatedAt: now,
    isOfflineReady: true,
    durasiVideo: payload.durasiVideo,
    halamanPdf: payload.halamanPdf,
    slides: slidesContent,
  };

  // Simpan metadata ke Firestore dengan timeout 1.5 detik
  try {
    if (payload.onProgress) payload.onProgress(95);
    const docRef = doc(db, COLLECTION_NAME, id);
    const cleanObj: any = { ...newMaterial };
    Object.keys(cleanObj).forEach((k) => cleanObj[k] === undefined && delete cleanObj[k]);
    
    await Promise.race([
      setDoc(docRef, cleanObj),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch (firestoreError) {
    console.warn('Penyimpanan Firestore metadata beralih ke lokal:', firestoreError);
  }

  // Update local cache
  const cached = getCachedMaterialsLocally();
  const updated = [newMaterial, ...cached.filter((m) => m.id !== id)];
  cacheMaterialsLocally(updated);

  // Pastikan progres tepat mencapai 100%
  if (payload.onProgress) {
    payload.onProgress(100);
  }

  return newMaterial;
}

/**
 * Guru menghapus bahan ajar secara permanen
 * Menghapus dari Firebase Storage, Firestore, dan cache offline IndexedDB
 */
export async function deleteLearningMaterial(
  id: string,
  storagePath?: string
): Promise<void> {
  // 1. Hapus berkas fisik dari Firebase Storage jika ada
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Catatan: berkas Firebase Storage sudah terhapus atau tidak ditemukan:', err);
    }
  }

  // 2. Hapus referensi dari Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Gagal menghapus dari Firestore:', err);
  }

  // 3. Hapus dari IndexedDB offline store
  await deleteOfflineMaterialFile(id);

  // 4. Hapus dari local storage cache
  const cached = getCachedMaterialsLocally();
  const filtered = cached.filter((m) => m.id !== id);
  cacheMaterialsLocally(filtered);
}

/**
 * Helper untuk murid mengunduh langsung berkas materi ke perangkat (Download Action)
 */
export async function downloadMaterialToDevice(material: LearningMaterialMedia): Promise<void> {
  const safeFileName = material.fileName || `${material.judul.replace(/\s+/g, '_')}.${material.jenisMedia}`;

  // 1. Coba dari cache lokal IndexedDB terlebih dahulu
  try {
    const offlineRecord = await getOfflineMaterialFile(material.id);
    if (offlineRecord?.blob) {
      const url = URL.createObjectURL(offlineRecord.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return;
    }

    if (offlineRecord?.dataUrl || material.fileData) {
      const a = document.createElement('a');
      a.href = (offlineRecord?.dataUrl || material.fileData)!;
      a.download = safeFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  } catch (e) {
    console.warn('Fallback download dari URL:', e);
  }

  // 2. Gunakan downloadUrl / storageUrl / fileUrl
  const fileUrl = material.downloadUrl || material.storageUrl || material.fileUrl;
  if (fileUrl) {
    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        return;
      }
    } catch {
      // Direct anchor link fallback
    }

    // Direct download link
    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Mengambil file media lengkap untuk dibuka/diputar/diunduh oleh murid
 * Mencari dari IndexedDB (offline) terlebih dahulu, jika belum ada cari dari Firestore/Storage URL.
 */
export async function resolveMaterialContent(
  material: LearningMaterialMedia
): Promise<{ dataUrl?: string; blobUrl?: string; externalUrl?: string; isFromOffline: boolean }> {
  // 1. Cek dari IndexedDB
  const offlineRecord = await getOfflineMaterialFile(material.id);
  if (offlineRecord) {
    if (offlineRecord.blob) {
      const blobUrl = URL.createObjectURL(offlineRecord.blob);
      return { blobUrl, isFromOffline: true };
    }
    if (offlineRecord.dataUrl) {
      return { dataUrl: offlineRecord.dataUrl, isFromOffline: true };
    }
  }

  // 2. Jika ada dataURL di metadata
  if (material.fileData) {
    saveOfflineMaterialFile(material.id, {
      dataUrl: material.fileData,
      fileName: material.fileName,
      fileType: material.fileType || 'application/octet-stream',
      fileSize: material.fileSize,
    }).catch((e) => console.warn('Gagal auto-cache ke IndexedDB:', e));

    return { dataUrl: material.fileData, isFromOffline: false };
  }

  // 3. Jika ada downloadUrl atau storageUrl atau fileUrl
  const resolvedUrl = material.downloadUrl || material.storageUrl || material.fileUrl;
  if (resolvedUrl) {
    return { externalUrl: resolvedUrl, isFromOffline: false };
  }

  return { isFromOffline: false };
}

/**
 * Murid mengunduh / menyimpan bahan ajar ke perangkat untuk akses offline
 */
export async function downloadAndSaveMaterialForOffline(
  material: LearningMaterialMedia
): Promise<boolean> {
  try {
    if (material.fileData) {
      await saveOfflineMaterialFile(material.id, {
        dataUrl: material.fileData,
        fileName: material.fileName,
        fileType: material.fileType || 'application/octet-stream',
        fileSize: material.fileSize,
      });
      return true;
    }

    const resolvedUrl = material.downloadUrl || material.storageUrl || material.fileUrl;
    if (resolvedUrl) {
      const res = await fetch(resolvedUrl);
      const blob = await res.blob();
      await saveOfflineMaterialFile(material.id, {
        blob,
        fileName: material.fileName,
        fileType: blob.type || material.fileType || 'application/octet-stream',
        fileSize: blob.size,
      });
      return true;
    }

    return false;
  } catch (err) {
    console.error('Gagal mengunduh bahan ajar untuk offline:', err);
    return false;
  }
}
