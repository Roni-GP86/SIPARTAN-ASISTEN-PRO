import {
  TPItem,
  SchoolIdentity,
  TPMediaPromptItem,
  MediaPromptSlide,
  MediaPromptSlideItem,
  MediaPromptNotebook,
  MediaPromptNotebookSection,
  MediaPromptFlashcard,
  MediaPromptFlashcardCard,
  MediaPromptComic,
  MediaPromptInfographic,
  MediaPromptMindMap,
  MindMapBranch,
  MediaPromptDocument,
  MediaOutputFormat,
  MediaPromptVideo,
  MediaPromptCharacterAsset,
  MediaPromptSceneImage,
  MediaPromptSceneVideo,
  MediaPromptThemeSetting,
  MediaPromptCharacterMode,
  MediaPromptCharacterCustomSelection,
  MediaPromptAspectRatio,
  MediaPromptSceneCount,
} from '../types';

export type VisualStyleType = 'pixar' | 'disney' | 'storybook';

export interface VisualStyleConfig {
  id: VisualStyleType;
  label: string;
  tagline: string;
  lightingPrompt: string;
  renderKeywords: string;
}

export const VISUAL_STYLES: Record<VisualStyleType, VisualStyleConfig> = {
  pixar: {
    id: 'pixar',
    label: 'Gaya Animasi 3D Pixar',
    tagline: 'Karakter ekspresif, tekstur halus, pencahayaan hangat & sinematik',
    lightingPrompt: 'Pixar 3D animation style, warm soft volumetric lighting, cheerful morning sunlight, sub-surface scattering skin tones',
    renderKeywords: '3D Pixar render, octane render 8k, Disney-Pixar movie still aesthetic, adorable expressive faces, rich vibrant color grading, smooth 3D modeling, highly detailed textures',
  },
  disney: {
    id: 'disney',
    label: 'Gaya Animasi 3D Disney Modern',
    tagline: 'Nuansa magis, warna cerah memikat, mata berbinar & dinamis',
    lightingPrompt: 'Modern Disney 3D animation style, luminous magical lighting, sparkling vibrant highlights, gentle rim light',
    renderKeywords: 'Disney 3D animation feature film quality, expressive large lively eyes, glossy smooth hair, charming Disney character proportions, clean vibrant pastels, Unreal Engine 5 render',
  },
  storybook: {
    id: 'storybook',
    label: 'Gaya Buku Cerita 3D Bergambar (Storybook)',
    tagline: 'Sentuhan artistik bertekstur, warna lembut pastel edukatif ramah anak',
    lightingPrompt: 'Whimsical 3D storybook illustration style, diffused gentle warm light, soft cozy atmosphere',
    renderKeywords: '3D storybook diorama, tactile miniature clay-like textures, soft edges, pastel color palette, comforting and highly engaging for young learners, high definition children book illustration',
  },
};

/**
 * Petunjuk & Aturan Spesifik untuk masing-masing Format Output Media Pembelajaran:
 * - 'Slide Presentasi': Wajib maksimal 10 slide (minimal 5 slide), rasio 16:9 widescreen, panduan interaksi guru tiap slide.
 * - 'Notebook/Buku Saku': Format saku & jurnal modular 5 seksi (doodle notes, fakta unik, tantangan) untuk NotebookLM & catatan siswa.
 * - 'Flashcard': Fokus terminologi esensial & konsep kunci, format kartu bolak-balik 3:2, trik cepat jembatan keledai.
 * - 'Infografis': Poster edukatif 1 halaman vertikal (3:4) dengan 4 kuadran seimbang dan hero 3D materi.
 */
export interface FormatDirectiveConfig {
  format: MediaOutputFormat;
  title: string;
  badge: string;
  description: string;
  targetApps: string[];
  rules: string[];
  promptInstructionBlock: string;
}

export const FORMAT_SPECIFIC_DIRECTIVES: Record<MediaOutputFormat, FormatDirectiveConfig> = {
  slide: {
    format: 'slide',
    title: 'Slide Presentasi',
    badge: 'Wajib Maksimal 10 Slide • Widescreen 16:9 • Gamma / Canva / PPT AI',
    description:
      'Format presentasi visual interaktif dengan pembatasan wajib maksimal 10 slide (minimal 5 slide), rasio 16:9, dan pedoman interaksi guru per slide.',
    targetApps: ['Gamma App AI', 'Canva Magic Presentation', 'Microsoft PowerPoint AI', 'Google Slides AI'],
    rules: [
      'WAJIB MAKSIMAL 10 SLIDE: Struktur 5–10 slide (standar ideal 8 slide) lengkap dari cover hingga penutup ceria.',
      'TATA LETAK 16:9 WIDESCREEN: Format horizontal proyektor kelas dengan tata letak bersih dan tidak padat teks.',
      'MAKSIMAL 3-4 POIN RINGKAS PER SLIDE: Menggunakan bahasa ramah anak yang mudah dicerna dan font berukuran besar.',
      'VISUAL 3D MASKOT ANAK SD: Setiap slide wajib menyertakan deskripsi visual 3D siswa SD berseragam merah-putih.',
      'PANDUAN INTERAKSI GURU: Setiap slide dilengkapi pertanyaan apersepsi, ice-breaking, dan manajemen dialog kelas.',
      'SELURUH TEKS WAJIB 100% BAHASA INDONESIA: Bahasa Indonesia santun, menyenangkan, dan komunikatif.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: SLIDE PRESENTASI (WAJIB MAKSIMAL 10 SLIDE)
================================================================================
1. ATURAN JUMLAH SLIDE: WAJIB MAKSIMAL 10 SLIDE (PERSYARATAN MUTLAK: 5-10 SLIDE, STANDAR 8 SLIDE TERSTRUKTUR).
2. TATA LETAK: FORMAT 16:9 WIDESCREEN DENGAN DESAIN MODERN, LEGA, SEIMBANG, DAN TIDAK PADAT TEKS.
3. KEPADATAN TEKS: MAKSIMAL 3-4 POIN RAMAH ANAK PER SLIDE DENGAN UKURAN HURUF BESAR & KONTRAS NYAMAN DI MATA.
4. ILUSTRASI & MASKOT: SETIAP SLIDE WAJIB MENYERTAKAN DESKRIPSI VISUAL 3D SISWA SD INDONESIA BERSERAGAM MERAH-PUTIH.
5. PEDOMAN INTERAKSI GURU: SETIAP SLIDE WAJIB DILENGKAPI PANDUAN GURU (PERTANYAAN APERSEPSI & ICE-BREAKING).
6. BAHASA: 100% BAHASA INDONESIA YANG RAMAH ANAK, MENYENANGKAN, DAN MEMICU RASA INGIN TAHU SISWA SD.
================================================================================`,
  },
  video: {
    format: 'video',
    title: 'Video Pembelajaran 3D',
    badge: 'Animasi 3D 5 Adegan • Karakter Konsisten • Prompt Aset + Gambar + Video',
    description:
      'Format video animasi pembelajaran 3D berdurasi 5 adegan lengkap dengan 3 lapis prompt: Prompt Aset Karakter Konsisten (Pak Roni, Ghea, Jordy), Prompt Gambar Keyframe per Adegan, dan Prompt Video Animasi & Dialog Edukatif.',
    targetApps: ['Runway Gen-3 Alpha', 'Kling AI', 'Luma Dream Machine / Ray 2', 'OpenAI Sora', 'Hailuo Minimax', 'Pika Labs', 'DALL-E 3 / Midjourney v6'],
    rules: [
      'KONSISTENSI KARAKTER MUTLAK: Pak Roni (Guru pria muda 20 tahun tampan berbatik modern), Ghea (Murid SD wanita 7-8 th berambut sebahu bando merah), Jordy (Murid SD pria 7-8 th berambut ikal alami bervolume). Wajah, rambut, mata, dan pakaian seragam WAJIB PERSIS SAMA di setiap prompt adegan.',
      '3 LAPISAN PROMPT WAJIB: (1) Prompt Aset Karakter untuk Image Reference awal, (2) Prompt Gambar untuk keyframe visual per adegan, (3) Prompt Video untuk animasi dinamis, gerakan kamera, ekspresi mikro, dan dialog edukatif.',
      'STRUKTUR WAJIB 5 ADEGAN LENGKAP & KONSISTEN: Adegan 1 (Apersepsi & Tantangan Seru), Adegan 2 (Eksplorasi Objek Nyata), Adegan 3 (Penjelasan Konsep Inti & Visualisasi Hologram 3D), Adegan 4 (Aksi Kolaboratif & Solusi Masalah), Adegan 5 (Refleksi Ceria & Kesimpulan Emas).',
      'DIALOG 100% BAHASA INDONESIA: Setiap adegan memuat percakapan santun, ramah anak, dan mendidik antar karakter yang menjelaskan materi secara bermakna.',
      'DURASI ESTIMASI 8 DETIK PER ADEGAN: Dirancang optimal untuk model AI video generatif modern (5-10 detik per shot).',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: VIDEO PEMBELAJARAN 3D (5 ADEGAN LENGKAP & KARAKTER KONSISTEN)
================================================================================
1. KONSISTENSI KARAKTER (WAJIB SAMA DI SETIAP ADEGAN):
   - Pak Roni: Guru pria muda Indonesia 20 tahun yang tampan, wajah oval ramah, rambut hitam pendek belah samping, kemeja batik navy & emas modern, celana gelap formal.
   - Ghea: Murid SD wanita Indonesia 7-8 tahun, wajah bulat imut pipi kemerahan, rambut hitam sebahu poni rapi dengan bando merah cerah, seragam SD merah-putih.
   - Jordy: Murid SD pria Indonesia 7-8 tahun, wajah energik ramah, rambut ikal alami pendek rapi, seragam SD merah-putih.
2. 3 JENIS PROMPT BERLAPIS:
   - PROMPT ASET KARAKTER: Generate sebagai gambar referensi awal karakter (Image Reference).
   - PROMPT GAMBAR: Keyframe gambar tiap adegan (Adegan 1 s.d. 5).
   - PROMPT VIDEO & DIALOG: Pergerakan, aksi, ekspresi, kamera, dan dialog edukatif Bahasa Indonesia (Adegan 1 s.d. 5).
3. STRUKTUR 5 ADEGAN KONSISTEN (TIDAK BOLEH KURANG):
   - Adegan 1: Apersepsi & Tantangan Misterius di Kelas
   - Adegan 2: Eksplorasi Benda Nyata & Pengamatan Masalah
   - Adegan 3: Penjelasan Konsep Inti & Visualisasi Hologram 3D
   - Adegan 4: Aksi Kolaboratif & Menyelesaikan Tantangan Bersama
   - Adegan 5: Refleksi Ceria, Kesimpulan Emas & Penutup Inspiratif
4. DIALOG & BAHASA: 100% BAHASA INDONESIA YANG RAMAH ANAK, MENYENANGKAN, DAN MENDIDIK.
================================================================================`,
  },
  notebook: {
    format: 'notebook',
    title: 'Notebook/Buku Saku',
    badge: 'Buku Saku • Jurnal Siswa • Google NotebookLM / Dokumen Saku',
    description:
      'Format buku saku & jurnal belajar mandiri terpadu 5 seksi dengan visual doodle notes untuk Google NotebookLM dan catatan siswa.',
    targetApps: ['Google NotebookLM', 'Google Docs', 'Canva Worksheet Maker', 'Buku Catatan Saku Siswa'],
    rules: [
      'FORMAT BUKU SAKU & JURNAL BELAJAR SISWA MANDIRI: Siap diunggah ke Google NotebookLM dan dicetak saku ukuran A5/B5.',
      'STRUKTUR 5 SEKSI MODULAR: (1) Zona Detektif Cilik, (2) Peta Konsep Doodle, (3) Kotak Tahukah Kamu, (4) Lembar Misi, (5) Refleksi Bintang.',
      'CATATAN VISUAL (DOODLE NOTES): Memancing anak aktif menggambar diagram alur, doodle ide, dan mewarnai peta konsep.',
      'GAYA BAHASA DIALOGIS & BERSAHABAT: Menumbuhkan keberanian bertanya dan merangkum ide sendiri tanpa rasa takut salah.',
      'SELURUH PANDUAN WAJIB 100% BAHASA INDONESIA: Kalimat tutur yang menginspirasi rasa percaya diri anak SD.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: NOTEBOOK / BUKU SAKU SISWA (NOTEBOOKLM & JURNAL BELAJAR)
================================================================================
1. FORMAT MEDIA: BUKU SAKU MODULAR & JURNAL BELAJAR MANDIRI (KOMPATIBEL NOTEBOOKLM & CETAK SAKU A5/B5).
2. STRUKTUR 5 SEKSI AKTIF:
   - Seksi 1: Zona Detektif Cilik (Pertanyaan misteri pemantik rasa penasaran)
   - Seksi 2: Peta Konsep Ramah Anak (Doodle Notes & diagram visual yang mudah digambar siswa)
   - Seksi 3: Kotak Ajaib "Tahukah Kamu?" (Fakta unik kontekstual yang menginspirasi)
   - Seksi 4: Lembar Misi & Teka-Teki Cilik (Tantangan bertahap Level 1 pemula hingga Level 2 pengayaan)
   - Seksi 5: Pojok Refleksi & Bintang Capaianku (Skala bintang pemahaman diri & apresiasi belajar)
3. INTERAKTIVITAS: Seluruh instruksi harus interaktif, mengajak anak menuliskan ide dan membuat doodle kreatif.
4. BAHASA: 100% BAHASA INDONESIA YANG HANGAT, BERSAHABAT, DAN MEMBIMBING SISWA MERENUNGKAN MATERI SECARA MANDIRI.
================================================================================`,
  },
  flashcard: {
    format: 'flashcard',
    title: 'Flashcard',
    badge: 'Fokus Terminologi & Konsep Kunci • Kartu Bolak-Balik 3:2',
    description:
      'Format kartu belajar pintar bolak-balik dengan fokus mendalam pada penguasaan terminologi esensial, definisi ramah anak, dan trik memori cepat.',
    targetApps: ['Canva Flashcard Maker', 'Quizlet AI', 'Anki Deck Creator', 'Kartu Cetak Peraga Kelas'],
    rules: [
      'FOKUS MENDALAM PADA PENGUASAAN TERMINOLOGI ESENSIAL & KONSEP KUNCI: Menjelaskan istilah inti dengan bahasa sederhana.',
      'FORMAT KARTU BOLAK-BALIK (FRONT & BACK): Dimensi proporsional 3:2 kartu edukasi atau cetak A6 siap laminating.',
      'SISI DEPAN (FRONT SIDE): Pertanyaan tebakan terminologi, tantangan rasa ingin tahu, visual cue 3D, dan hint terarah.',
      'SISI BELAKANG (BACK SIDE): Kunci jawaban definitif, analogi konkret ramah anak, dan trik cepat / jembatan keledai (mnemonik).',
      'KATEGORISASI GAMIFIKASI KELAS: Tebak Konsep, Kenali Ciri & Rahasia, Kasus Nyata, Trik Cepat, Tantangan Kritis.',
      'SELURUH TANYA-JAWAB WAJIB 100% BAHASA INDONESIA: Komunikatif dan memicu daya ingat jangka panjang.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: SMART FLASHCARD (FOKUS TERMINOLOGI & KONSEP KUNCI)
================================================================================
1. FOKUS PEDAGOGIS: FOKUS MENDALAM PADA PENGUASAAN TERMINOLOGI ESENSIAL, KATA KUNCI MATERI, DAN PEMAHAMAN KONSEP.
2. FORMAT KARTU: KARTU BOLAK-BALIK (FRONT & BACK) BERDIMENSI STANDAR 3:2 ATAU UKURAN CETAK SAKU A6.
3. STRUKTUR SISI DEPAN (FRONT SIDE):
   - Judul kartu spesifik & kategori konsep terminologi.
   - Pertanyaan/tantangan menguji istilah dan makna konsep dengan bahasa ramah anak.
   - Ilustrasi 3D Pixar anak SD dan petunjuk kecil (hint terarah).
4. STRUKTUR SISI BELAKANG (BACK SIDE):
   - Kunci jawaban tepat, lugas, dan terbukti benar.
   - Penjelasan analogi konkret yang mudah dicerna nalar anak SD.
   - Slogan emas atau "Jembatan Keledai" (Trik Cepat / Mnemonik) untuk mengunci ingatan.
5. KATEGORISASI GAMIFIKASI: Tebak Konsep, Kenali Ciri & Rahasia, Kasus Nyata, Trik Cepat, Tantangan Kritis.
6. BAHASA: 100% BAHASA INDONESIA SANTUN, MENYENANGKAN, DAN KOMUNIKATIF.
================================================================================`,
  },
  infografis: {
    format: 'infografis',
    title: 'Infografis',
    badge: 'Poster 1 Halaman Utuh • 4 Kuadran Seimbang • Visual 3D Hero',
    description:
      'Format poster visual 1 halaman vertikal (3:4) memuat 4 kuadran ringkasan materi, hero visual 3D maskot SD, dan nilai Dimensi Profil Lulusan.',
    targetApps: ['Midjourney v6', 'DALL-E 3', 'Adobe Firefly', 'Canva Infographic Maker'],
    rules: [
      'LAYOUT POSTER 1 HALAMAN VERTIKAL (ASPECT RATIO 3:4 ATAU 2:3): Poster satu halaman utuh tanpa scroll.',
      'STRUKTUR 4 KUADRAN SEIMBANG: (1) Definisi & Makna, (2) Ciri/Bagian, (3) Contoh Nyata di Indonesia, (4) Langkah Cerdas Aksi.',
      'CENTRAL HERO VISUAL 3D: Ilustrasi siswa SD berseragam merah-putih berinteraksi dengan diagram hologram konsep materi.',
      'DIMENSI PROFIL LULUSAN: Nilai Penalaran Kritis, Kemandirian, dan Kolaborasi pada footer poster.',
      'SELURUH TEKS, JUDUL, & LABEL WAJIB 100% BAHASA INDONESIA: Bebas dari istilah asing tanpa terjemahan.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: INFOGRAFIS EDUKATIF 1 HALAMAN UTUH
================================================================================
1. TATA LETAK MUTLAK: POSTER 1 HALAMAN VERTIKAL (PORTRAIT 3:4 ATAU 2:3) TANPA MULTI-HALAMAN.
2. HIERARKI 4 KUADRAN SEIMBANG:
   - Seksi 1 (Kiri Atas): Definisi & Makna Esensial ("Apa Itu...?").
   - Seksi 2 (Kanan Atas): Ciri & Bagian Penting Materi.
   - Seksi 3 (Kiri Bawah): Contoh Nyata di Kehidupan Sehari-hari Indonesia.
   - Seksi 4 (Kanan Bawah): Langkah Cerdas Menyelesaikan Tantangan.
3. HERO VISUAL 3D TERPUSAT: Siswa SD Indonesia berseragam merah-putih berinteraksi ceria dengan hologram 3D materi.
4. FOOTER IDENTITAS: Dimensi Profil Lulusan (Penalaran Kritis, Kemandirian, Kolaborasi) & Kurikulum Merdeka.
5. TEKS WAJIB 100% BAHASA INDONESIA: Seluruh label diagram, kotak info, dan judul wajib Bahasa Indonesia.
================================================================================`,
  },
  petakonsep: {
    format: 'petakonsep',
    title: 'Peta Konsep / Peta Pikiran',
    badge: 'Peta Pikiran Radial & Hirarki • GitMind / XMind / Canva / Miro / Markmap',
    description:
      'Format peta konsep & peta pikiran (mind map) visual dengan nodus pusat, 5 cabang utama berkode warna, kata penghubung ramah anak, dan outline hierarki untuk pemahaman holistik.',
    targetApps: ['GitMind AI', 'Canva Mind Map Maker', 'XMind', 'Whimsical', 'Miro', 'Markmap'],
    rules: [
      'NODUS PUSAT JELAS & MEMIKAT: Berisi topik utama materi dengan metafora visual ramah anak (Pohon Pengetahuan, Matahari, Laboratorium).',
      '5 CABANG UTAMA BERKODE WARNA: Mengelompokkan materi ke cabang logis (Definisi, Bagian/Unsur, Contoh Nyata, Langkah Praktik, Tips Cerdas).',
      'KATA PENGHUBUNG (PROPOSISI) RAMAH ANAK: Menghubungkan nodus dengan frasa pendek ("terdiri atas", "contohnya", "langkahnya", "disimpulkan").',
      'SUB-CABANG KONKRET & MAKSIMAL 2-3 KATA PER LABEL: Konsep ringkas, padat, dan mudah diingat anak SD.',
      'IKON VISUAL & DOODLE 3D DI SETIAP CABANG: Setiap cabang memiliki pengingat visual konkret untuk daya ingat spasial anak.',
      'FORMAT OUTPUT MULTI-KOMPATIBEL: Dilengkapi diagram visual, outline Markdown hierarkis, dan prompt AI komprehensif.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI KHUSUS FORMAT: PETA KONSEP & PETA PIKIRAN (MIND MAP EDUKATIF)
================================================================================
1. STRUKTUR UTAMA: PETA PIKIRAN MEMUSAT (RADIAL) DENGAN TOPIK PUSAT JELAS & 5 CABANG UTAMA DENGAN KODE WARNA KONTRAS.
2. TATA BAHASA & KATA PENGHUBUNG: SETIAP CABANG MENGGUNAKAN KATA PENGHUBUNG SPESIFIK & SUB-CABANG DENGAN MAKSIMAL 2-3 KATA PER LABEL.
3. ASOSIASI VISUAL: SETIAP CABANG WAJIB MENYERTAKAN REKOMENDASI IKON VISUAL 3D/DOODLE RAMAH ANAK UNTUK MEMPERKUAT DAYA INGAT.
4. OUTLINE MARKDOWN: WAJIB MENYERTAKAN STRUKTUR HIERARKIS INDENTASI TAB (MARKDOWN) AGAR DAPAT LANGSUNG DIIMPOR KE XMIND / GITMIND / MARKMAP.
5. PEDOMAN GURU: PANDUAN AKTIVITAS MIND MAPPING BERSAMA SISWA (MENEMPEL STICKY NOTES ATAU MENGGAMBAR BERSAMA DI PAPAN TULIS).
6. BAHASA: 100% BAHASA INDONESIA YANG RAMAH ANAK, MENARIK, DAN MEMUDAHKAN SISWA MENGHUBUNGKAN ANTARKONSEP.
================================================================================`,
  },
  all: {
    format: 'all',
    title: 'Semua Format (Kompilasi Lengkap)',
    badge: 'Kompilasi 5 Format Media Ajar Lengkap',
    description:
      'Menghasilkan seluruh format media secara simultan dengan instruksi spesifik masing-masing format diterapkan secara penuh.',
    targetApps: ['Gamma App', 'Google NotebookLM', 'Canva', 'Quizlet', 'GitMind', 'PowerPoint AI'],
    rules: [
      'Slide Presentasi: Wajib 5–10 slide (maksimal 10 slide), format 16:9 widescreen, panduan interaksi guru tiap slide.',
      'Notebook/Buku Saku: Format saku modular 5 seksi catatan visual (doodle notes) untuk NotebookLM & catatan siswa.',
      'Flashcard: Fokus mendalam pada terminologi & konsep kunci, format kartu bolak-balik 3:2, trik cepat jembatan keledai.',
      'Infografis: Poster 1 halaman 4 kuadran seimbang dengan hero visual 3D siswa SD Indonesia.',
      'Peta Konsep / Pikiran: Peta pikiran radial 5 cabang berkode warna, kata penghubung ramah anak, dan outline Markdown.',
      'Seluruh teks di semua media wajib 100% Bahasa Indonesia yang ramah anak dan komunikatif.',
    ],
    promptInstructionBlock: `================================================================================
INSTRUKSI SPESIFIK MULTI-FORMAT MEDIA AJAR (KOMPILASI LENGKAP 5 MEDIA)
================================================================================
- SLIDE PRESENTASI: WAJIB MAKSIMAL 10 SLIDE (5-10 SLIDE), 16:9 WIDESCREEN, PANDUAN GURU TIAP SLIDE.
- NOTEBOOK/BUKU SAKU: FORMAT SAKU MODULAR 5 SEKSI DOODLE NOTES SIAP PAKAI NOTEBOOKLM & CATATAN SISWA.
- FLASHCARD: FOKUS TERMINOLOGI & KONSEP ESENSIAL, KARTU BOLAK-BALIK 3:2, TRIK MEMORI JEMBATAN KELEDAI.
- INFOGRAFIS: POSTER 1 HALAMAN 4 KUADRAN SEIMBANG DENGAN HERO MASKOT 3D SISWA SD INDONESIA.
- PETA KONSEP / PIKIRAN: PETA PIKIRAN MEMUSAT 5 CABANG BERKODE WARNA DENGAN KATA PENGHUBUNG & OUTLINE MARKDOWN.
- SELURUH KONTEN DI SELURUH FORMAT WAJIB 100% BAHASA INDONESIA RAMAH ANAK.
================================================================================`,
  },
};

/**
 * Standard Indonesian Elementary School Uniform Prompt Specification
 */
export const INDONESIAN_SD_UNIFORM_PROMPT =
  'Indonesian elementary school students (anak SD Indonesia) wearing authentic Indonesian public school uniforms: ' +
  'crisp white short-sleeved collared shirt with red school circular emblem badge on the left chest pocket, ' +
  'for boys: bright red knee-length tailored school shorts with black belt, ' +
  'for girls: bright red pleated school skirt down to the knees, ' +
  'neat small bright red school necktie (dasi merah SD), ' +
  'authentic red-and-white school cap (topi merah putih SD) with Indonesian school emblem, ' +
  'clean white socks and shiny black sneakers. ' +
  'The children have warm Southeast Asian Indonesian friendly features, bright cheerful eyes, and natural joyful expressions. ' +
  'Environment: Authentic bright Indonesian elementary school (ruang kelas sekolah dasar bernuansa Indonesia dengan papan tulis, bendera Merah Putih di sudut dinding, dan jendela tropis yang asri).';

/**
 * KONSISTENSI FISIK TOKOH WAJIB 100% MUTLAK DAN TETAP SAMA DI SELURUH MATERI & PROMPT
 * Nama dan karakter fisik (wajah, bentuk mata, rambut, warna kulit, ekspresi permanen)
 * WAJIB TETAP SAMA PERSIS untuk Pak Roni, Ghea, dan Jordy.
 * Yang disesuaikan secara dinamis adalah BUSANA (kostum) dan LATAR (setting/tempat),
 * serta JUMLAH TOKOH (bisa 1, 2, atau 3 tokoh bergantian atau ditentukan pengguna).
 */
export const PERMANENT_CHARACTER_PHYSICAL_TRAITS = {
  pakRoni: {
    characterId: 'pak_roni' as const,
    name: 'Pak Roni',
    role: 'Guru Pria Muda (20-25 Tahun) Tampan & Karismatik',
    age: '20-25 Tahun',
    physicalTraitsEn:
      'Indonesian handsome young male teacher around 20-25 years old named Pak Roni, clean-shaven handsome oval face with defined neat jawline, warm expressive almond-shaped dark brown eyes, thick neat dark eyebrows, short neat modern side-parted black hair, charming friendly teacher smile, athletic upright posture, light warm golden tan Southeast Asian complexion',
    physicalTraitsId:
      'Guru pria muda Indonesia usia 20-25 tahun bernama Pak Roni yang berwajah tampan bersih (tanpa kumis/jenggot), rahang oval tegas rapi, mata cokelat tua berbinar hangat dan bijaksana, alis tebal rapi, rambut hitam lurus pendek belah samping modern klimis, senyum ramah berkarisma, postur tegap atletis, dan kulit sawo matang cerah Indonesia',
    negativePrompt:
      'text, watermark, multiple people, extra limbs, deformed hands, blurry, distorted face, beard, mustache, wrinkles, elderly, bad anatomy, double heads',
  },
  ghea: {
    characterId: 'ghea' as const,
    name: 'Ghea',
    role: 'Siswi SD Wanita Ceria, Kritis & Penuh Rasa Ingin Tahu',
    age: '7-10 Tahun',
    physicalTraitsEn:
      'Indonesian elementary school girl named Ghea, cute round face with soft natural rosy cheeks, large sparkling curious dark brown eyes, straight glossy shoulder-length neat black hair with neat front bangs and signature bright red headband, sweet enthusiastic joyful smile, light-warm Southeast Asian complexion',
    physicalTraitsId:
      'Siswi SD Indonesia bernama Ghea, wajah bulat imut dengan pipi tembam merona alami, mata bulat besar berbinar penuh rasa ingin tahu, rambut hitam lurus sebahu berponi depan rapi dengan bando merah cerah khas yang selalu tersemat rapi di dahinya, senyum ceria periang, dan kulit kuning langsat Indonesia',
    negativePrompt:
      'text, watermark, multiple people, extra limbs, deformed hands, blurry, distorted face, mature, adult, hijab, messy hair, extra fingers, bad anatomy',
  },
  jordy: {
    characterId: 'jordy' as const,
    name: 'Jordy',
    role: 'Siswa SD Pria Energik, Cerdas & Penuh Semangat',
    age: '7-10 Tahun',
    physicalTraitsEn:
      'Indonesian elementary school boy named Jordy, spirited friendly energetic face, bright intelligent dark eyes, short neat naturally wavy voluminous black hair, energetic broad adventurous smile, healthy warm tan Indonesian complexion',
    physicalTraitsId:
      'Siswa SD Indonesia bernama Jordy, wajah ramah energik cerdas, mata hitam cerah berbinar penuh antusiasme, rambut hitam ikal bergelombang alami pendek bervolume rapi, senyum lebar petualang yang percaya diri, dan kulit sawo matang khas anak Indonesia',
    negativePrompt:
      'text, watermark, multiple people, extra limbs, deformed hands, blurry, distorted face, mature, adult, straight hair, beard, extra fingers, bad anatomy',
  },
};

export interface ThemeSettingConfig {
  id: MediaPromptThemeSetting;
  label: string;
  badge: string;
  shortDesc: string;
  environmentEn: string;
  environmentId: string;
  cameraAtmosphereEn: string;
  pakRoniAttireEn: string;
  pakRoniAttireId: string;
  gheaAttireEn: string;
  gheaAttireId: string;
  jordyAttireEn: string;
  jordyAttireId: string;
}

export const THEME_SETTING_CONFIGS: Record<
  Exclude<MediaPromptThemeSetting, 'auto'>,
  ThemeSettingConfig
> = {
  kelas_merah_putih: {
    id: 'kelas_merah_putih',
    label: 'Ruang Kelas SD Modern (Seragam Merah-Putih & Batik Guru)',
    badge: 'Ruang Kelas • Seragam Merah-Putih',
    shortDesc: 'Latar ruang kelas SD Indonesia modern dengan seragam merah-putih nasional dan kemeja batik modern guru',
    environmentEn:
      'Authentic bright Indonesian elementary classroom with polished wooden desks, interactive chalkboard with colorful diagrams, Indonesian red-and-white flag in the corner, student artwork bulletin board, and wide tropical windows with gentle morning sunlight',
    environmentId:
      'Ruang kelas SD Indonesia modern yang cerah dan rapi dengan meja kayu berpelitur, papan tulis interaktif dengan diagram ilustrasi, bendera Merah Putih di sudut dinding, karya siswa di majalah dinding, dan jendela tropis lebar bermandikan cahaya pagi yang asri',
    cameraAtmosphereEn: 'Warm soft volumetric morning light, cheerful vibrant elementary school atmosphere, crisp shallow depth of field',
    pakRoniAttireEn:
      'Authentic contemporary Indonesian navy blue and subtle gold pattern batik collared shirt, tailored dark charcoal gray formal trousers, polished black dress shoes, holding a smart digital tablet and pointer',
    pakRoniAttireId:
      'Kemeja batik modern nusantara warna biru navy beraksen emas halus, celana panjang bahan abu-abu arang rapi, sepatu pantofel formal hitam berkilap, memegang tablet edukasi interaktif',
    gheaAttireEn:
      'Authentic Indonesian public elementary school uniform: crisp short-sleeved white collared shirt with red circular OSIS school badge on left chest pocket, bright red knee-length pleated skirt, small neat red necktie, signature bright red headband on her bangs, clean white socks, shiny black sneakers, holding a colorful student notebook',
    gheaAttireId:
      'Seragam SD Merah-Putih nasional lengkap: kemeja putih lengan pendek bersaku emblem OSIS SD, rok lipit merah sebatas lutut, dasi merah kecil, bando merah cerah khas di rambut hitam berponinya, kaus kaki putih, sepatu kets hitam rapi',
    jordyAttireEn:
      'Authentic Indonesian public elementary school uniform: crisp short-sleeved white collared shirt with red circular OSIS school badge on left chest pocket, bright red knee-length tailored shorts with black belt, small red necktie, clean white socks, sporty black-and-white sneakers, holding an educational magnifying glass and ruler',
    jordyAttireId:
      'Seragam SD Merah-Putih nasional lengkap: kemeja putih lengan pendek bersaku logo OSIS SD, celana pendek merah berikat pinggang hitam, dasi merah, kaus kaki putih, sepatu sneakers sporty, memegang kaca pembesar dan mistar',
  },
  pramuka_lengkap: {
    id: 'pramuka_lengkap',
    label: 'Kepanduan & Alam Terbuka (Seragam Pramuka Indonesia Lengkap)',
    badge: 'Bumi Perkemahan • Seragam Pramuka',
    shortDesc: 'Latar bumi perkemahan pinus tropis asri dengan seragam Pramuka lengkap berhasduk kacu merah-putih dan baret/topi kepanduan',
    environmentEn:
      'Lush green Indonesian pine forest campsite and outdoor scout ground with colorful scout tents, wooden campfire ring, Indonesian national flag and scout fleur-de-lis flag fluttering on bamboo poles, misty morning green hills in the background',
    environmentId:
      'Bumi perkemahan alam tropis Indonesia yang asri dengan deretan tenda pramuka warna-warni, tiang bambu bendera Merah Putih dan tunas kelapa pramuka, api unggun kayu rapi, latar perbukitan hijau berkabut sejuk',
    cameraAtmosphereEn: 'Fresh outdoor morning mountain sunlight, gentle mist, cinematic nature backdrop with pine trees and bamboo fixtures',
    pakRoniAttireEn:
      'Authentic Indonesian Scoutmaster uniform (Seragam Pembina Pramuka Indonesia lengkap): crisp light brown collared scout shirt with scout badges and gold world scout emblem, red-and-white neckerchief (hasduk kacu pramuka merah putih) secured with a woven rattan woggle ring, dark brown tailored scout trousers, dark brown leather scout belt, brown scout beret, rugged brown leather boots, carrying a scout whistle and field compass',
    pakRoniAttireId:
      'Seragam Pembina Pramuka Indonesia lengkap: kemeja pramuka cokelat muda beremblem pandu dunia, hasduk kacu merah-putih dengan ring rotan, celana panjang cokelat tua, baret cokelat pramuka, sepatu boots kulit cokelat tangguh, membawa peluit dan kompas lapangan',
    gheaAttireEn:
      'Authentic Indonesian female elementary scout uniform (Seragam Pramuka Siaga/Penggalang Putri lengkap): light brown short-sleeved scout blouse with Indonesian scout embroidery patches on collar and sleeves, red-and-white scout neckerchief (hasduk kacu merah putih) with brass ring, dark brown pleated scout skirt, signature bright red headband neatly visible under her brown scout hat, dark socks and sturdy sneakers, holding a wooden clipboard with scout challenge checklist',
    gheaAttireId:
      'Seragam Pramuka Siaga/Penggalang putri lengkap: baju cokelat muda berlencana pramuka, hasduk kacu merah-putih dengan kolong kuningan, rok lipit cokelat tua, bando merah khasnya tetap tersemat rapi di bawah topi pramuka, sepatu kets tangguh, memegang papan ujian kecakapan',
    jordyAttireEn:
      'Authentic Indonesian male elementary scout uniform (Seragam Pramuka Siaga/Penggalang Putra lengkap): light brown short-sleeved scout shirt with scouting badge patches, red-and-white scout neckerchief (kacu pramuka merah putih) with rattan ring, dark brown tailored scout shorts with scout belt, brown scout beret perched over his neat wavy black hair, brown socks and sturdy outdoor sneakers, holding an expedition magnifying glass and field notebook',
    jordyAttireId:
      'Seragam Pramuka Siaga/Penggalang putra lengkap: baju pramuka cokelat muda berbadge tunas kelapa, hasduk kacu merah-putih dengan ring rotan, celana cokelat tua, baret cokelat di atas rambut ikal hitamnya yang rapi, membawa kaca pembesar petualang dan buku catatan saku',
  },
  olahraga_lapangan: {
    id: 'olahraga_lapangan',
    label: 'Lapangan Olahraga & Kebugaran (Kaos Jersey Sporty & Training)',
    badge: 'Lapangan Olahraga • Jersey Sporty',
    shortDesc: 'Latar lapangan rumput hijau dan lintasan lari sekolah dengan kaos jersey olahraga sekolah cerah bernapas dan celana training',
    environmentEn:
      'Vibrant Indonesian elementary school sports field with manicured green grass, terracotta running track, mini soccer goals and basketball hoops, shaded banyan tree, fluttering Indonesian flag under clear bright blue sky',
    environmentId:
      'Lapangan olahraga sekolah berumput hijau terawat, lintasan lari terra-cotta, tiang gawang mini, pohon beringin peneduh di tepi lapangan, di bawah langit biru cerah dengan bendera Merah Putih berkibar',
    cameraAtmosphereEn: 'High-energy dynamic outdoor daylight, crisp athletic motion blur, bright saturated sky, inspiring sports atmosphere',
    pakRoniAttireEn:
      'Athletic modern physical education teacher attire: sporty breathable navy blue and vibrant orange accent polo shirt, comfortable charcoal jogger training sweatpants, sports teacher whistle with red lanyard around neck, digital sports stopwatch on wrist, high-performance running sneakers',
    pakRoniAttireId:
      'Busana guru olahraga modern: polo shirt atletis biru navy beraksen oranye terang, celana training jogging abu-abu arang nyaman, peluit guru olahraga berkalung tali merah, stopwatch digital di pergelangan, sepatu lari sporty',
    gheaAttireEn:
      'Authentic Indonesian elementary school PE sports uniform: bright breathable orange and navy blue crew-neck sports jersey with school sports crest, matching navy blue athletic training jogger pants with white side stripes, her signature bright red headband keeping her bangs neat, white sports socks, trendy running sneakers',
    gheaAttireId:
      'Kaos jersey olahraga sekolah lengan pendek bernapas warna oranye cerah dan biru navy berlogo olahraga sekolah, celana training olahraga biru navy bergaris putih, bando merah khasnya menjaga poni tetap rapi, sepatu sneakers lari',
    jordyAttireEn:
      'Authentic Indonesian elementary school PE sports uniform: vibrant breathable orange and navy blue athletic jersey, sporty navy blue athletic shorts or training pants with white racing stripes, sporty wristband, clean sports socks, dynamic running sneakers, his wavy black hair bouncing with energetic sporty enthusiasm',
    jordyAttireId:
      'Kaos jersey olahraga sekolah bernapas warna oranye cerah dan biru navy, celana training sporty bergaris putih, gelang karet olahraga, sepatu sneakers running, rambut ikal hitamnya bergoyang energik penuh semangat',
  },
  penjelajah_safari: {
    id: 'penjelajah_safari',
    label: 'Petualangan Alam Bebas (Busana Safari / Explorer Rompi Khaki)',
    badge: 'Petualangan Rimba • Safari Explorer',
    shortDesc: 'Latar ekspedisi hutan hujan tropis Indonesia dengan rompi petualang safari saku banyak khaki, celana kargo tahan air, dan sepatu boots',
    environmentEn:
      'Breathtaking tropical rainforest nature exploration sanctuary in Indonesia with majestic mossy dipterocarp trees, clear rocky stream with sparkling cool water, tropical butterflies, hanging wooden suspension bridge, and sunbeams piercing the lush canopy',
    environmentId:
      'Ekspedisi alam hutan hujan tropis Indonesia yang megah, pohon raksasa meranti berlumut asri, sungai berbatu jernih dengan air mengalir sejuk, kupu-kupu tropis beterbangan, jembatan kayu gantung, dan sinar matahari menembus rimbun kanopi daun',
    cameraAtmosphereEn: 'Cinematic National Geographic style, rich atmospheric forest depth, dappled emerald sunbeams, lush organic nature textures',
    pakRoniAttireEn:
      'Rugged charismatic expedition safari explorer attire: multi-pocket khaki utility safari vest over a breathable olive-green rolled-sleeve outdoor shirt, durable khaki cargo trousers with utility belt, tough water-resistant brown hiking boots, carrying an antique rolled topographic map, brass explorer compass, and field expedition notebook',
    pakRoniAttireId:
      'Rompi petualang safari khaki multi-saku tangguh di atas kemeja katun outdoor hijau zaitun gulung lengan, celana kargo penjelajah tahan air, sepatu boots hiking kulit cokelat tangguh, membawa peta topografi dan kompas penjelajah',
    gheaAttireEn:
      'Junior nature explorer safari adventurer outfit: cute multi-pocket khaki safari vest over a breathable soft-cotton yellow t-shirt, beige cargo adventure shorts, signature bright red headband peeking adorably beneath a lightweight explorer safari brim hat, child-safe canteen flask strapped across shoulder, brown trail hiking boots, holding a miniature nature specimen container with leaf sample',
    gheaAttireId:
      'Rompi petualang safari cilik warna khaki lembut di atas kaos katun kuning ceria, celana kargo petualang, topi rimba safari kecil dengan bando merah khasnya mengintip manis di dahinya, tempat minum termos mini selempang, sepatu hiking cilik',
    jordyAttireEn:
      'Junior wilderness explorer adventurer outfit: durable tan safari expedition vest with utility brass clips over a forest-green adventure shirt, khaki cargo pants with reinforced knees, rugged explorer boots, his wavy black hair framed by an explorer field cap, carrying compact binoculars and an illuminated magnifying glass',
    jordyAttireId:
      'Rompi safari explorer tan dengan saku klip di atas kaos petualang hijau rimba, celana kargo tahan gesek, topi penjelajah di atas rambut ikalnya yang bervolume, sepatu boots trekking, membawa teropong binokular dan kaca pembesar lampu',
  },
  astronot_antariksa: {
    id: 'astronot_antariksa',
    label: 'Eksplorasi Antariksa & Tata Surya (Baju Astronot Futuristik Edukasi)',
    badge: 'Stasiun Antariksa • Baju Astronot',
    shortDesc: 'Latar stasiun luar angkasa observatorium kubah dengan baju astronot berteknologi tinggi beremblem bendera Indonesia dan visor bening',
    environmentEn:
      'High-tech futuristic space station orbital observatory educational hub with massive panoramic curved observation dome window overlooking glowing blue Earth, revolving solar system planets, glowing Saturn rings, and glistening nebulae',
    environmentId:
      'Stasiun luar angkasa observatorium futuristik edukasi dengan jendela observasi panorama melengkung raksasa menghadap pemandangan spektakuler bumi bulat biru bercahaya, planet-planet tata surya, cincin Saturnus bercahaya, dan galaksi bintang bertaburan',
    cameraAtmosphereEn: 'Cinematic Interstellar sci-fi lighting, deep cosmic blues and glowing stellar gold, zero-gravity floating visual aids, ultra-sharp 8k render',
    pakRoniAttireEn:
      'Sleek futuristic educational astronaut commander spacesuit: pristine white tailored spacesuit with gold and midnight-blue aerodynamic trim, Indonesian flag patch and educational science insignia on chest and shoulders, clear transparent crystal visor helmet opened smoothly to reveal his handsome clean-shaven face and neat side-parted hair, tactile touchscreen gauntlets',
    pakRoniAttireId:
      'Baju astronot modern komandan berteknologi tinggi: pakaian antariksa putih bersih beraksen emas dan biru malam, emblem bendera Indonesia dan lencana sains edukasi di dada, helm visor kaca bening terbuka memperlihatkan wajah tampannya yang ramah dan rambut belah sampingnya yang rapi',
    gheaAttireEn:
      'Charming futuristic junior astronaut spacesuit: high-tech white astronaut flight suit with playful red and coral-pink accent stripes, Indonesian flag mission badge on sleeve, transparent crystal dome helmet retracted comfortably showing her cute round face, sparkling eyes, and signature bright red headband, mini gravity boots, holding an interactive holographic celestial tablet',
    gheaAttireId:
      'Baju astronot anak berteknologi tinggi: jumpsuit antariksa putih bersih bergaris aksen merah koral, lencana misi antariksa Indonesia di lengan, helm kubah kaca kristal terbuka memperlihatkan wajah bulat imut, mata berbinar, dan bando merah khasnya, memegang tablet hologram antariksa',
    jordyAttireEn:
      'High-energy futuristic junior astronaut spacesuit: sleek white astronaut flight suit with electric-cyan and silver trim, Indonesian space explorer crest on chest, transparent crystal helmet visor open showcasing his spirited wavy black hair and wide adventurous grin, compact miniature astronaut propulsion backpack, holding a glowing digital planet scanner',
    jordyAttireId:
      'Baju astronot anak berteknologi tinggi: baju astronot putih ramping bergaris cyan elektrik dan perak, emblem penjelajah antariksa cilik Indonesia, helm visor kaca kristal terbuka memperlihatkan rambut ikal khasnya dan senyum petualang lebarnya, jetpack mini di punggung, memegang pemindai planet digital',
  },
  laboratorium_sains: {
    id: 'laboratorium_sains',
    label: 'Laboratorium Sains & Riset Cilik (Jas Lab Putih & Safety Goggles)',
    badge: 'Laboratorium Riset • Jas Lab & Kacamata',
    shortDesc: 'Latar laboratorium sains sekolah modern dengan jas lab putih bersih rapi, safety goggles transparan, mikroskop digital, dan tabung reaksi',
    environmentEn:
      'State-of-the-art bright Indonesian elementary school science laboratory with clean white ceramic workbenches, safe colorful test tube racks, glowing digital microscope, 3D molecular models, and illustrated periodic charts on glass partitions',
    environmentId:
      'Laboratorium sains sekolah dasar modern yang bersih dan canggih, meja laboratorium porselen putih dengan rak tabung reaksi warna-warni aman anak, mikroskop digital bercahaya lembut, model molekul 3D, dan bagan periodik bergambar di dinding kaca',
    cameraAtmosphereEn: 'Crisp sterile yet warm laboratory lighting, jewel-toned glass beaker refractions, clean clinical depth with friendly school atmosphere',
    pakRoniAttireEn:
      'Professional scientific mentor attire: crisp tailored white laboratory coat over an elegant buttoned shirt and dark trousers, modern safety goggles pushed neatly onto his forehead above his thick dark eyebrows, digital laboratory research tablet in hand, laser pointer pen in chest pocket',
    pakRoniAttireId:
      'Jas laboratorium sains guru: jas lab putih bersih elegan di atas kemeja rapi dan celana bahan gelap, kacamata pelindung safety goggles modern dinaikkan rapi di dahinya di atas alis tebalnya, memegang tablet riset laboratorium dan pulpen laser',
    gheaAttireEn:
      'Junior scientist research attire: crisp clean white student lab coat tailored for children, child-sized transparent safety goggles resting adorably over her bangs beside her signature bright red headband, kid-safe rubber research gloves, holding a small Erlenmeyer flask with glowing non-toxic colorful solution',
    gheaAttireId:
      'Jas laboratorium cilik: jas lab putih bersih seukuran anak yang pas, kacamata pelindung safety goggles transparan bertengger imut di samping bando merah khasnya, sarung tangan riset anak, memegang labu Erlenmeyer kecil berisi larutan warna-warni aman',
    jordyAttireEn:
      'Junior scientist experimental attire: crisp child-sized white lab coat with colorful test tube pins on the lapel, protective clear safety glasses over his curious dark eyes, neat wavy black hair, holding a high-precision student pipette and illuminated pocket magnifying lens',
    jordyAttireId:
      'Jas laboratorium cilik: jas lab putih anak dengan pin tabung reaksi warna-warni di kerah, kacamata pelindung mata jernih, rambut ikal hitamnya rapi, tersenyum riang memegang pipet tetes presisi dan lensa pembesar berlampu',
  },
  adat_nusantara: {
    id: 'adat_nusantara',
    label: 'Kebudayaan Nusantara (Pakaian Adat & Etnik Tradisional)',
    badge: 'Pendopo Budaya • Pakaian Adat',
    shortDesc: 'Latar pendopo agung berukir jati dengan pakaian adat etnik nusantara yang anggun, tenun songket, kebaya kutubaru, dan destar batik',
    environmentEn:
      'Magnificent traditional Indonesian wooden pendopo cultural pavilion with carved teak pillars, warm terracotta floor, authentic shadow puppet wayang motifs and vibrant batik cloths gracefully displayed, tropical garden courtyard with stone candi gate in the background',
    environmentId:
      'Pendopo agung nusantara dengan tiang kayu jati berukir artistik, lantai marmer hangat, ornamen wayang kulit dan kain batik nusantara terbentang anggun, berlatar taman asri tropis dengan gapura candi yang megah',
    cameraAtmosphereEn: 'Warm royal cultural ambiance, golden teakwood reflections, dignified graceful lighting celebrating Indonesian heritage',
    pakRoniAttireEn:
      'Distinguished contemporary Indonesian cultural attire: elegant tailored navy-and-maroon woven tenun songket jacket with mandarin collar, dark formal trousers, traditional polished leather footwear, adorned with an authentic handwoven Indonesian cultural sash',
    pakRoniAttireId:
      'Busana adat nusantara pria: kemeja jas tenun songket motif nusantara elegan kerah shanghai warna navy dan marun, celana formal serasi, selendang tenun tangan nusantara berwibawa',
    gheaAttireEn:
      'Graceful modern Indonesian cultural dress for girls: cheerful bright yellow and floral coral-red kebaya kutubaru with matching fine batik jarik pleated skirt, her signature bright red headband adorned with a small delicate jasmine flower hair-clip, sweet traditional velvet slippers, holding an illustrated folklore puppet card',
    gheaAttireId:
      'Kebaya kutubaru modern anak: kebaya warna kuning cerah berpadu corak floral merah koral dan rok jarik batik nusantara, bando merah khasnya dipercantik jepit bunga melati kecil, memegang kartu wayang edukasi',
    jordyAttireEn:
      'Spirited modern Indonesian cultural attire for boys: vibrant emerald-green and gold-trimmed bespoke traditional collar vest with comfortable matching trousers, authentic batik destar/udeng headcloth tied stylishly around his neat naturally wavy black hair, cultural fabric sash, holding a traditional miniature wooden instrument',
    jordyAttireId:
      'Busana adat nusantara anak: beskap/rompi tradisional warna hijau zamrud beraksen emas, celana nyaman senada, kain udeng/destar batik terikat gagah di atas rambut ikal hitamnya yang rapi, membawa alat musik tradisional mini',
  },
};

/**
 * Deteksi otomatis tema busana & latar berdasarkan mata pelajaran dan materi pembelajaran
 */
export function detectThemeFromContext(
  mataPelajaran: string,
  coreConcept: string
): Exclude<MediaPromptThemeSetting, 'auto'> {
  const text = `${mataPelajaran || ''} ${coreConcept || ''}`.toLowerCase();

  // 1. Antariksa & Tata Surya
  if (
    text.includes('tata surya') ||
    text.includes('planet') ||
    text.includes('bumi dan antariksa') ||
    text.includes('bintang') ||
    text.includes('gravitasi') ||
    text.includes('astronomi') ||
    text.includes('angkasa') ||
    text.includes('bulan') ||
    text.includes('orbit') ||
    text.includes('solar system') ||
    text.includes('alam semesta')
  ) {
    return 'astronot_antariksa';
  }

  // 2. Petualangan Alam Bebas & Ekosistem
  if (
    text.includes('hutan') ||
    text.includes('ekosistem') ||
    text.includes('rantai makanan') ||
    text.includes('lingkungan') ||
    text.includes('hewan') ||
    text.includes('tumbuhan') ||
    text.includes('flora') ||
    text.includes('fauna') ||
    text.includes('konservasi') ||
    text.includes('geografi') ||
    text.includes('habitat') ||
    text.includes('biodiversitas') ||
    text.includes('alam bebas') ||
    text.includes('petualangan') ||
    text.includes('rawa') ||
    text.includes('sungai') ||
    text.includes('daur hidup')
  ) {
    return 'penjelajah_safari';
  }

  // 3. Olahraga & Kebugaran (PJOK)
  if (
    text.includes('olahraga') ||
    text.includes('pjok') ||
    text.includes('senam') ||
    text.includes('kebugaran') ||
    text.includes('lari') ||
    text.includes('lompat') ||
    text.includes('atletik') ||
    text.includes('bola') ||
    text.includes('pola gerak') ||
    text.includes('motorik') ||
    text.includes('otot') ||
    text.includes('daya tahan') ||
    text.includes('lapangan')
  ) {
    return 'olahraga_lapangan';
  }

  // 4. Kepanduan / Pramuka
  if (
    text.includes('pramuka') ||
    text.includes('kepanduan') ||
    text.includes('kemah') ||
    text.includes('berkemah') ||
    text.includes('tali temali') ||
    text.includes('sandi') ||
    text.includes('tunas kelapa')
  ) {
    return 'pramuka_lengkap';
  }

  // 5. Laboratorium Sains & Eksperimen
  if (
    text.includes('eksperimen') ||
    text.includes('laboratorium') ||
    text.includes('zat') ||
    text.includes('wujud benda') ||
    text.includes('campuran') ||
    text.includes('reaksi') ||
    text.includes('larutan') ||
    text.includes('mikroskop') ||
    text.includes('magnet') ||
    text.includes('listrik') ||
    text.includes('kalor') ||
    text.includes('suhu') ||
    text.includes('pemuaian') ||
    text.includes('cahaya') ||
    text.includes('bunyi')
  ) {
    return 'laboratorium_sains';
  }

  // 6. Kebudayaan Nusantara
  if (
    text.includes('adat') ||
    text.includes('budaya') ||
    text.includes('tradisi') ||
    text.includes('nusantara') ||
    text.includes('pancasila') ||
    text.includes('kebinekaan') ||
    text.includes('seni tari') ||
    text.includes('daerah') ||
    text.includes('lagu daerah') ||
    text.includes('rumah adat') ||
    text.includes('pakaian adat') ||
    text.includes('suku')
  ) {
    return 'adat_nusantara';
  }

  // Standar: Ruang Kelas SD Merah-Putih
  return 'kelas_merah_putih';
}

/**
 * Resolusi tema aktif bawaan
 */
export function resolveThemeSetting(
  requestedTheme: MediaPromptThemeSetting | undefined,
  mataPelajaran: string,
  coreConcept: string
): Exclude<MediaPromptThemeSetting, 'auto'> {
  if (!requestedTheme || requestedTheme === 'auto') {
    return detectThemeFromContext(mataPelajaran, coreConcept);
  }
  return requestedTheme;
}

/**
 * RESOLUSI DINAMIS TEMA BUSANA & LATAR ADAPTIF
 * Mengubah busana Pak Roni, Jordy, dan Ghea serta latar tempat secara dinamis
 * sesuai dengan mata pelajaran, materi pokok, dan tujuan pembelajaran yang dipelajari,
 * dengan ciri fisik karakter (wajah, rambut, mata, postur) tetap 100% konsisten!
 */
export function resolveTopicAdaptiveThemeAndAttire(
  requestedTheme: MediaPromptThemeSetting | undefined,
  mataPelajaran: string,
  coreConcept: string,
  tujuanPembelajaran?: string,
  kodeTP?: string
): ThemeSettingConfig {
  // Jika pengguna secara eksplisit memilih preset tema manual (bukan 'auto'), gunakan preset tersebut
  if (requestedTheme && requestedTheme !== 'auto' && THEME_SETTING_CONFIGS[requestedTheme]) {
    return THEME_SETTING_CONFIGS[requestedTheme];
  }

  const mapelLower = (mataPelajaran || '').toLowerCase().trim();
  const conceptLower = (coreConcept || '').toLowerCase().trim();
  const tpLower = (tujuanPembelajaran || '').toLowerCase().trim();
  const combined = `${mapelLower} ${conceptLower} ${tpLower}`;

  // =========================================================================
  // 1. MATA PELAJARAN: PENDIDIKAN PANCASILA / PKn / KEWARGANEGARAAN
  // =========================================================================
  if (
    mapelLower.includes('pancasila') ||
    mapelLower.includes('pkn') ||
    mapelLower.includes('ppkn') ||
    mapelLower.includes('kewarganegaraan')
  ) {
    // 1A. Keragaman Budaya, Rumah Adat, Lagu & Tarian Daerah (Bhinneka Tunggal Ika)
    if (
      combined.includes('budaya') ||
      combined.includes('adat') ||
      combined.includes('suku') ||
      combined.includes('tari') ||
      combined.includes('lagu daerah') ||
      combined.includes('tradisi') ||
      combined.includes('bhinneka') ||
      combined.includes('kebinekaan') ||
      combined.includes('rumah adat') ||
      combined.includes('pakaian adat')
    ) {
      return {
        id: 'adat_nusantara',
        label: `Pendopo Seni Budaya • Busana Adat & Tenun Nusantara (${coreConcept})`,
        badge: 'Pendopo Budaya • Pakaian Adat Etnik',
        shortDesc: `Latar pendopo nusantara berukir kayu jati megah dengan busana tenun dan kebaya etnik nusantara untuk eksplorasi ${coreConcept}`,
        environmentEn: `Magnificent traditional Indonesian wooden pendopo cultural pavilion adorned with intricate teakwood carvings, authentic shadow puppet motifs, handwoven batik cloths, and traditional musical props representing '${coreConcept}', with a tropical garden courtyard in the background`,
        environmentId: `Pendopo agung nusantara dengan tiang kayu jati berukir artistik, replika rumah adat nusantara, ornamen wayang kulit, dan bentangan kain batik nusantara yang anggun untuk materi ${coreConcept}`,
        cameraAtmosphereEn: `Warm golden cultural lighting, dignified Indonesian heritage ambiance, crisp shallow depth of field`,
        pakRoniAttireEn: `Distinguished contemporary Indonesian cultural attire: elegant tailored navy-and-maroon woven tenun songket jacket with mandarin collar, dark formal trousers, traditional polished leather footwear, adorned with an authentic handwoven Indonesian cultural sash`,
        pakRoniAttireId: `Baju beskap modern tenun songket nusantara warna marun dan navy beraksen emas halus, celana formal senada, selendang tenun nusantara berwibawa`,
        gheaAttireEn: `Graceful modern Indonesian cultural dress: cheerful bright yellow and floral coral-red kebaya kutubaru with matching fine batik jarik pleated skirt, her signature bright red headband adorned with a small delicate jasmine flower hair-clip, sweet traditional velvet slippers, holding an illustrated folklore puppet card`,
        gheaAttireId: `Kebaya kutubaru modern anak warna kuning ceria berpadu corak floral merah koral dan rok jarik batik nusantara, bando merah khasnya dipercantik jepit melati kecil, memegang kartu wayang edukasi`,
        jordyAttireEn: `Spirited modern Indonesian cultural attire for boys: vibrant emerald-green and gold-trimmed bespoke traditional collar vest with comfortable matching trousers, authentic batik destar/udeng headcloth tied stylishly around his neat naturally wavy black hair, cultural fabric sash, holding a traditional miniature wooden instrument`,
        jordyAttireId: `Beskap modern cilik warna hijau zamrud beraksen emas, celana nyaman senada, kain udeng/destar batik terikat gagah di atas rambut ikal hitamnya, membawa alat musik tradisional mini`,
      };
    }

    // 1B. Norma, Hak & Kewajiban, Aturan Sekolah, Musyawarah Mufakat
    if (
      combined.includes('norma') ||
      combined.includes('aturan') ||
      combined.includes('hak') ||
      combined.includes('kewajiban') ||
      combined.includes('musyawarah') ||
      combined.includes('mufakat') ||
      combined.includes('tertib') ||
      combined.includes('disiplin') ||
      combined.includes('uud') ||
      combined.includes('kesepakatan')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Pojok Parlemen Cilik • Rompi Sahabat Norma & Duta Tertib (${coreConcept})`,
        badge: 'Ruang Musyawarah • Duta Tertib',
        shortDesc: `Latar ruang musyawarah cilik sekolah dengan rompi Sahabat Norma dan pin Duta Disiplin untuk pendalaman ${coreConcept}`,
        environmentEn: `Inspiring Indonesian civic discussion studio and classroom parliament corner with a kid-friendly wooden round deliberation table, decorative mini gavel, class commitment pledge tree on the wall, Indonesian national flag, and sunny windows`,
        environmentId: `Ruang musyawarah cilik dan pojok tertib sekolah dengan meja bundar kayu ramah anak, pohon komitmen aturan kelas, dan dinding bergambar piagam kesepakatan belajar`,
        cameraAtmosphereEn: `Bright friendly morning illumination, democratic and collaborative civic learning atmosphere, crisp visual depth`,
        pakRoniAttireEn: `Smart-casual educator blazer in charcoal gray over a crisp light blue shirt with a miniature brass scales-of-justice lapel pin, dark formal trousers, polished dress shoes, holding the School Constitution & Ethics Handbook`,
        pakRoniAttireId: `Blazer pendidik modern warna abu-abu arang di atas kemeja biru muda rapi dengan pin timbangan keadilan mini, celana formal gelap, memegang buku saku Tata Tertib & Norma Sekolah`,
        gheaAttireEn: `Junior Ethics Ambassador uniform: crisp white collared blouse under a tailored beige vest embroidered with a 'Sahabat Tertib' badge, neat knee-length pleated navy skirt, signature bright red headband, holding a colorful student merit journal`,
        gheaAttireId: `Seragam Duta Disiplin Cilik: blus putih dengan rompi krem berbadge 'Sahabat Tertib', rok lipit rapi, bando merah cerah khas di dahinya berponi, memegang buku catatan kebaikan`,
        jordyAttireEn: `Junior Ethics Ambassador uniform: tailored light beige vest with brass buttons and 'Penjaga Aturan' emblem over a short-sleeved white shirt, tidy navy trousers, neat naturally wavy black hair, holding a mutual agreement checklist`,
        jordyAttireId: `Seragam Duta Disiplin Cilik: rompi krem senada berkancing kuningan dengan emblem 'Penjaga Aturan', celana kargo rapi, rambut ikal hitam mengembang energik, memegang kartu kesepakatan belajar`,
      };
    }

    // 1C. Makna Sila-Sila Pancasila, Garuda Pancasila, Gotong Royong, Persatuan & NKRI (Default Pancasila)
    return {
      id: 'adat_nusantara',
      label: `Balai Kebangsaan • Busana Batik Tulis & Duta Cilik Pancasila (${coreConcept})`,
      badge: 'Balai Kebangsaan • Batik & Duta Pancasila',
      shortDesc: `Latar balai kebangsaan nusantara dengan lambang Garuda Pancasila megah, busana batik tulis kontemporer guru, dan selempang Duta Cilik Pancasila untuk ${coreConcept}`,
      environmentEn: `Dignified Indonesian national civic hall with a grand golden Garuda Pancasila emblem mounted on a rich teakwood wall, vibrant Indonesian red-and-white flags, illuminated archipelago map of Indonesia, round wooden discussion desk, and warm tropical morning light`,
      environmentId: `Balai pertemuan dan ruang kebangsaan nusantara dengan lambang Garuda Pancasila emas megah di dinding utama, bendera Merah Putih berkibar anggun di tiang kayu berukir, peta kepulauan Indonesia berlampu lembut, dan meja bundar kayu jati`,
      cameraAtmosphereEn: `Warm majestic amber and golden morning sunbeams, inspiring patriotic unity atmosphere, crisp cinematic 3D lighting`,
      pakRoniAttireEn: `Contemporary Indonesian navy blue and subtle gold pattern batik collared shirt with a gleaming golden Garuda emblem pin on left chest, tailored dark charcoal formal trousers, polished black dress shoes, holding an interactive civic learning tablet`,
      pakRoniAttireId: `Kemeja batik modern tulis nusantara warna biru navy dan emas elegan dengan pin burung Garuda di dada kiri, celana bahan arang formal rapi, sepatu pantofel hitam mengkilap, memegang tablet civic education`,
      gheaAttireEn: `Cheerful modern Indonesian junior civic dress: sunny yellow modern kebaya kutubaru with fine red-and-gold ethnic trim, pleated batik jarik skirt, her signature bright red headband affixed with a small red-and-white ribbon pin, pristine white socks, clean sneakers, wearing a red 'Duta Pancasila Cilik' sash`,
      gheaAttireId: `Kebaya kutubaru modern anak warna kuning cerah berpadu corak floral merah koral dan rok batik jarik lipit rapi, bando merah cerah khas bersemat pin pita Merah-Putih kecil di dahinya, mengenakan selempang Duta Pancasila Cilik`,
      jordyAttireEn: `Contemporary junior batik shirt in rich maroon and cream geometric motifs with national crest embroidery, neat brown chino trousers, wearing a red-and-white 'Duta Pancasila Cilik' ceremonial sash across his chest, short neat naturally wavy black hair, clean sneakers, carrying an illustrated civic badge card`,
      jordyAttireId: `Kemeja batik modern anak kombinasi lengan pendek warna merah marun dan krem berlogo tunas kebangsaan, celana chino cokelat rapi, selempang Duta Pancasila Cilik, rambut ikal hitamnya tertata rapi`,
    };
  }

  // =========================================================================
  // 2. MATA PELAJARAN: MATEMATIKA
  // =========================================================================
  if (
    mapelLower.includes('matematika') ||
    mapelLower.includes('math') ||
    mapelLower.includes('hitung')
  ) {
    // 2A. Pecahan, Pecahan Senilai, Desimal, Persen
    if (
      combined.includes('pecahan') ||
      combined.includes('fraction') ||
      combined.includes('desimal') ||
      combined.includes('persen') ||
      combined.includes('pembilang') ||
      combined.includes('penyebut') ||
      combined.includes('senilai')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Studio Pecahan Ajaib • Rompi Geometri & Celemek Math Baker (${coreConcept})`,
        badge: 'Studio Pecahan • Math Explorer',
        shortDesc: `Latar studio eksplorasi pecahan matematika dengan papan peraga keping pecahan kue 3D, rompi juru hitung cilik, dan celemek math baker untuk ${coreConcept}`,
        environmentEn: `Playful interactive Fraction Discovery Laboratory and Math Bakery Studio with colorful 3D fraction pies (halves, quarters, eighths) displayed on wooden stands, glowing interactive digital fraction wall, balance scale, and student workbenches`,
        environmentId: `Studio Eksplorasi Matematika & Fraction Discovery Lab dengan papan pajangan kue pecahan 3D terpotong simetris (1/2, 1/4, 1/8), timbangan digital kue, roda pecahan warna-warni bercahaya, dan layar grid interaktif`,
        cameraAtmosphereEn: `Warm delightful bakery-laboratory lighting, cheerful pastel tones, sharp depth of field focusing on hands-on fraction manipulatives`,
        pakRoniAttireEn: `Crisp light-blue educational work shirt with an artistic geometric bowtie patterned with fraction slices, a tailored gray cotton math educator apron with fraction pin badges and digital stylus, dark trousers, polished shoes`,
        pakRoniAttireId: `Kemeja kerja edukasi biru muda dengan dasi kupu-kupu geometri unik bermotif irisan pecahan, celemek juru hitung katun abu-abu rapi dengan pin fraksi dan stylus tablet`,
        gheaAttireEn: `Sweet denim blue pinafore dress over a white short-sleeved blouse adorned with colorful fraction cake enamel pins on the chest, her signature bright red headband, clean white socks, navy sneakers, holding an interactive fraction clipboard`,
        gheaAttireId: `Gaun pinafore terusan biru denim manis di atas blus putih lengan pendek dengan pin kue pecahan warna-warni di dada, bando merah cerah khasnya, memegang papan jepit pecahan digital`,
        jordyAttireEn: `Vibrant yellow short-sleeved cotton shirt under a multi-pocket denim explorer vest containing mini calculator and colorful fraction tokens, tilted detective beret over his wavy black hair, comfortable trousers, holding an interactive spinning fraction disc`,
        jordyAttireId: `Kemeja katun pendek kuning cerah berompi denim dengan saku alat hitung, topi beret detektif angka miring di atas rambut ikal hitamnya, membawa roda pecahan interaktif dan kalkulator mini`,
      };
    }

    // 2B. Geometri, Bangun Datar, Bangun Ruang, Sudut, Keliling, Luas, Volume, Pengukuran
    if (
      combined.includes('bangun ruang') ||
      combined.includes('bangun datar') ||
      combined.includes('geometri') ||
      combined.includes('kubus') ||
      combined.includes('balok') ||
      combined.includes('prisma') ||
      combined.includes('limas') ||
      combined.includes('tabung') ||
      combined.includes('kerucut') ||
      combined.includes('sudut') ||
      combined.includes('keliling') ||
      combined.includes('luas') ||
      combined.includes('volume') ||
      combined.includes('pengukuran') ||
      combined.includes('jaring')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Bengkel Arsitek Geometri Cilik • Rompi Rancang Bangun & Mistar Siku (${coreConcept})`,
        badge: 'Bengkel Arsitek • Geometri Cilik',
        shortDesc: `Latar studio arsitek cilik dengan miniatur transparan kubus-balok 3D, rompi perancang bangun, dan mistar ukur untuk ${coreConcept}`,
        environmentEn: `Bright Junior Architect & Geometry Design Workshop with broad drafting tables, glowing transparent 3D geometric polyhedrons (cubes, rectangular prisms, pyramids), colorful rulers, blueprint display screens, and sunlight streaming through large gridded windows`,
        environmentId: `Bengkel Studio Arsitek & Geometri Cilik dengan meja rancang bangun kayu lebar, miniatur kubus, balok, kerucut bercahaya neon lembut, busur derajat raksasa, dan layar proyeksi blueprint biru`,
        cameraAtmosphereEn: `Sharp architectural volumetric daylight, clean drafting precision mood, crisp edge highlights on 3D geometric solids`,
        pakRoniAttireEn: `Crisp white rolled-sleeve shirt under a fitted navy architect utility vest with a golden triangular scale ruler in chest pocket, dark tailored trousers, carrying a precision digital laser distance meter`,
        pakRoniAttireId: `Kemeja putih lengan digulung rapi dengan rompi arsitek navy, penggaris segitiga arsitek di saku dada, jangka ukur digital presisi di tangan`,
        gheaAttireEn: `Pastel coral architect smock-vest with a tiny red bow over a white blouse, child-safe retractable measuring tape sling pouch across shoulder, her signature bright red headband, holding a luminous transparent wireframe 3D cube model`,
        gheaAttireId: `Rompi arsitek cilik warna pastel dengan pita merah, blus katun, pita ukur meteran gulung kecil terselempang manis, bando merah cerah khasnya, memegang model kubus transparan bercahaya`,
        jordyAttireEn: `Bright yellow junior builder safety helmet perched cheerfully over his voluminous naturally wavy black hair, lightweight reflective miniature construction vest, tool belt pouch with kid-safe plastic T-square, holding a colorful 3D triangular prism`,
        jordyAttireId: `Helm proyek arsitek cilik kuning cerah di atas rambut ikalnya yang lebat, rompi konstruksi mini bergaris reflektif perak, sabuk perkakas mainan, memegang prisma segitiga 3D`,
      };
    }

    // 2C. Data, Diagram, Piktogram, Grafik, Statistika
    if (
      combined.includes('data') ||
      combined.includes('diagram') ||
      combined.includes('grafik') ||
      combined.includes('tabel') ||
      combined.includes('piktogram') ||
      combined.includes('modus') ||
      combined.includes('median') ||
      combined.includes('rata-rata')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Pusat Analisis Data Cilik • Rompi Analis & Layar Infografis Digital (${coreConcept})`,
        badge: 'Studio Data • Analis Cilik',
        shortDesc: `Latar studio infografis data digital dengan diagram batang 3D bercahaya, rompi analis cilik, dan balok piktogram untuk ${coreConcept}`,
        environmentEn: `Futuristic elementary data science discovery hub with large interactive digital touch screens displaying glowing 3D bar graphs, pie charts, colorful magnetic data blocks, and illuminated survey tallies`,
        environmentId: `Studio Data & Infografis Cilik dengan layar sentuh interaktif raksasa menampilkan diagram batang dan lingkaran warna-warni 3D bercahaya untuk materi ${coreConcept}`,
        cameraAtmosphereEn: `Dynamic high-tech educational luminescence, clean analytical clarity, crisp vibrant primary colors`,
        pakRoniAttireEn: `Oxford educator shirt under a fitted charcoal knit vest with digital stylus pen, dark trousers, holding an interactive survey tablet`,
        pakRoniAttireId: `Kemeja oxford rapi dengan rompi rajut abu-abu, pulpen stylus digital di saku, memegang tablet survei interaktif`,
        gheaAttireEn: `Smart collared blouse under a pastel teal data-analyst apron, signature bright red headband, holding an interactive bar-graph tablet showing colorful statistics`,
        gheaAttireId: `Blus rapi dengan celemek analis pastel, bando merah khas di dahi, memegang tablet grafik diagram batang interaktif`,
        jordyAttireEn: `Sporty polo shirt with junior data analyst badge, neat naturally wavy black hair, holding colorful stackable 3D pictogram survey cubes`,
        jordyAttireId: `Kaos polo sporty dengan kartu tanda analis data cilik, rambut ikal hitam bervolume, memegang balok diagram piktogram 3D`,
      };
    }

    // 2D. Bilangan Cacah, Operasi Hitung, KPK, FPB, Nilai Tempat (Default Matematika)
    return {
      id: 'kelas_merah_putih',
      label: `Laboratorium Angka Cerdas • Busana Math Detective & Smart Cardigan (${coreConcept})`,
      badge: 'Laboratorium Angka • Math Detective',
      shortDesc: `Latar laboratorium petualang angka futuristik dengan pohon faktorisasi bercahaya dan tangga bilangan 3D untuk ${coreConcept}`,
      environmentEn: `Modern interactive Math Explorer Studio with luminous digital number lines, 3D factorization tree display, oversized colorful abacus beads, and step-by-step arithmetic challenge cards under bright classroom illumination`,
      environmentId: `Laboratorium Kode & Petualang Angka Futuristik dengan pohon faktorisasi bercahaya, papan sempoa digital neon, dan tangga bilangan 3D interaktif untuk ${coreConcept}`,
      cameraAtmosphereEn: `Sharp vibrant high-energy math exploration lighting, clean educational clarity, radiant colorful numeric glows`,
      pakRoniAttireEn: `Sophisticated dark navy knit cardigan over a crisp collared dress shirt with a subtle 'Math Mentor' enamel badge, sleek round reading glasses, tailored trousers, polished shoes, holding a glowing digital pointer`,
      pakRoniAttireId: `Cardigan rajut biru tua modern di atas kemeja berkerah rapi dengan lencana 'Mathematician Mentor', kacamata baca tipis berbingkai bulat yang intelektual, celana rapi`,
      gheaAttireEn: `Smart white collared shirt with a red tartan ribbon tie, neat pleated skirt, her signature bright red headband, clean socks and sneakers, holding an illuminated digital arithmetic tablet`,
      gheaAttireId: `Kemeja putih dengan pita dasi kotak-kotak tartan, rok berlipit rapi, bando merah khasnya, memegang tablet grafik bilangan digital`,
      jordyAttireEn: `Sporty knit sweater patterned with colorful geometric numbers over a collared shirt, tailored trousers, fresh sneakers, his wavy black hair bouncing with energy, holding colorful prime factorization challenge cards`,
      jordyAttireId: `Sweater rajut sporty bergaris angka-angka warna-warni, celana katun rapi, sepatu sneakers sporty, memegang kartu petualang KPK & FPB`,
    };
  }

  // =========================================================================
  // 3. MATA PELAJARAN: IPAS / IPA / SAINS
  // =========================================================================
  if (
    mapelLower.includes('ipas') ||
    mapelLower.includes('ipa') ||
    mapelLower.includes('sains') ||
    mapelLower.includes('alam') ||
    mapelLower.includes('sosial')
  ) {
    // 3A. Antariksa, Tata Surya, Planet, Bumi & Bulan
    if (
      combined.includes('tata surya') ||
      combined.includes('planet') ||
      combined.includes('bumi dan antariksa') ||
      combined.includes('bintang') ||
      combined.includes('gravitasi') ||
      combined.includes('astronomi') ||
      combined.includes('angkasa') ||
      combined.includes('bulan') ||
      combined.includes('orbit') ||
      combined.includes('solar system') ||
      combined.includes('alam semesta')
    ) {
      return THEME_SETTING_CONFIGS.astronot_antariksa;
    }

    // 3B. Ekosistem, Rantai Makanan, Hutan, Hewan, Tumbuhan, Habitat, Konservasi
    if (
      combined.includes('ekosistem') ||
      combined.includes('rantai makanan') ||
      combined.includes('hutan') ||
      combined.includes('hewan') ||
      combined.includes('tumbuhan') ||
      combined.includes('flora') ||
      combined.includes('fauna') ||
      combined.includes('konservasi') ||
      combined.includes('habitat') ||
      combined.includes('biodiversitas') ||
      combined.includes('alam bebas') ||
      combined.includes('daur hidup')
    ) {
      return THEME_SETTING_CONFIGS.penjelajah_safari;
    }

    // 3C. Anatomi Tubuh Manusia, Panca Indera, Rangka, Otot, Pencernaan, Pernapasan, Kesehatan
    if (
      combined.includes('tubuh') ||
      combined.includes('rangka') ||
      combined.includes('tulang') ||
      combined.includes('otot') ||
      combined.includes('panca indera') ||
      combined.includes('organ') ||
      combined.includes('pencernaan') ||
      combined.includes('pernapasan') ||
      combined.includes('darah') ||
      combined.includes('jantung') ||
      combined.includes('paru') ||
      combined.includes('gizi') ||
      combined.includes('sehat')
    ) {
      return {
        id: 'laboratorium_sains',
        label: `Klinik Anatomi Cilik • Jas Medis Edukasi & Model 3D Organ (${coreConcept})`,
        badge: 'Klinik Anatomi • Medis Edukasi',
        shortDesc: `Latar studio anatomi dan klinik edukatif sekolah dengan manekin tubuh transparan 3D dan jas dokter edukasi untuk ${coreConcept}`,
        environmentEn: `Bright friendly Junior Health & Human Anatomy Discovery Studio with transparent 3D glowing anatomical human models, interactive sensory organ charts, kid-safe health posters, and clean white worktables bathed in pleasant sunlight`,
        environmentId: `Ruang Klinik & Studio Anatomi Edukatif Sekolah dengan manekin model 3D anatomi tubuh manusia transparan bercahaya, diagram panca indera interaktif, dan poster kesehatan ceria untuk materi ${coreConcept}`,
        cameraAtmosphereEn: `Gentle medical-educational illumination, clear pristine cleanliness, friendly comforting atmosphere, crisp depth of field`,
        pakRoniAttireEn: `Crisp short doctor-educator white coat over a light blue collared shirt with a pediatric educational stethoscope draped neatly around his neck, dark trousers, holding an interactive 3D human anatomy tablet`,
        pakRoniAttireId: `Jas dokter pendidik putih pendek dengan stetoskop edukasi berkalung rapi, kemeja biru muda, memegang tablet anatomi 3D`,
        gheaAttireEn: `Cute tailored junior doctor white coat over her clothes with a pastel play stethoscope, signature bright red headband neat across her bangs, holding an illustrated sensory organ reference chart`,
        gheaAttireId: `Jas dokter cilik putih dengan stetoskop mainan warna pastel, bando merah cerah khas di rambut berponi, memegang bagan panca indera interaktif`,
        jordyAttireEn: `Junior health investigator white coat with child-friendly diagnostic penlight, his wavy black hair neat and lively, holding a miniature articulated 3D human skeleton model`,
        jordyAttireId: `Jas medis cilik dengan senter periksa telinga-mata ramah anak, rambut ikal hitam bervolume, memegang model rangka tubuh 3D mini`,
      };
    }

    // 3D. Cuaca, Iklim, Bencana Alam, Siklus Air, Batuan & Gunung Berapi
    if (
      combined.includes('siklus air') ||
      combined.includes('hujan') ||
      combined.includes('awan') ||
      combined.includes('cuaca') ||
      combined.includes('iklim') ||
      combined.includes('tanah') ||
      combined.includes('batuan') ||
      combined.includes('gunung') ||
      combined.includes('gempa') ||
      combined.includes('vulkanik') ||
      combined.includes('erosi')
    ) {
      return {
        id: 'penjelajah_safari',
        label: `Stasiun Meteorologi & Geologi Cilik • Jaket Ekspedisi Cuaca (${coreConcept})`,
        badge: 'Stasiun Cuaca • Ekspedisi Geologi',
        shortDesc: `Latar pos pengamatan cuaca dan geologi sekolah dengan maket siklus air 3D dan jaket ekspedisi lapangan untuk ${coreConcept}`,
        environmentEn: `Outdoor School Weather & Earth Science Observation Station with transparent glass water cycle miniature, spinning wind anemometer, barometer, cross-section volcano model, and mountain vistas under dynamic clouds`,
        environmentId: `Stasiun Pengamatan Cuaca & Geologi Sekolah dengan miniatur siklus air kaca, anemometer pengukur angin, barometer, dan maket gunung berapi 3D berpenampang melintang untuk ${coreConcept}`,
        cameraAtmosphereEn: `Dynamic atmospheric outdoor light, natural sky drama, crisp environmental textures and tactile earth materials`,
        pakRoniAttireEn: `All-weather orange outdoor expedition jacket over a practical field shirt, durable cargo pants, hiking boots, holding a digital pocket anemometer`,
        pakRoniAttireId: `Jaket ekspedisi lapangan warna oranye tahan angin, anemometer saku di tangan, celana kargo outdoor`,
        gheaAttireEn: `Bright sunny-yellow junior raincoat with reflective trim, yellow rain boots, signature bright red headband visible under hood, holding a glowing 3D water cycle cloud model`,
        gheaAttireId: `Jaket hujan anak warna kuning cerah dengan aksen garis reflektif, sepatu boots karet kuning, bando merah khasnya, memegang model awan siklus air 3D`,
        jordyAttireEn: `Sky-blue outdoor windbreaker jacket, durable trousers, sturdy boots, his naturally wavy black hair peeking from an expedition beanie, holding a mineral rock sample and digital barometer`,
        jordyAttireId: `Jaket windbreaker warna biru langit, celana tahan gesek, rambut ikalnya mengintip, membawa barometer digital dan sampel batuan`,
      };
    }

    // 3E. Zat, Wujud Benda, Campuran, Energi, Listrik, Magnet, Kalor & Suhu (Default IPAS)
    return THEME_SETTING_CONFIGS.laboratorium_sains;
  }

  // =========================================================================
  // 4. MATA PELAJARAN: BAHASA INDONESIA
  // =========================================================================
  if (mapelLower.includes('indonesia')) {
    // 4A. Cerita Rakyat, Dongeng, Fabel, Tokoh & Watak
    if (
      combined.includes('cerita') ||
      combined.includes('dongeng') ||
      combined.includes('fabel') ||
      combined.includes('tokoh') ||
      combined.includes('watak') ||
      combined.includes('alur') ||
      combined.includes('legenda') ||
      combined.includes('mitos')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Pojok Dongeng Ajaib • Busana Sahabat Cerita & Rompi Katun Hangat (${coreConcept})`,
        badge: 'Pojok Dongeng • Sahabat Cerita',
        shortDesc: `Latar perpustakaan dongeng ajaib dengan pohon buku raksasa dan busana sahabat cerita hangat untuk ${coreConcept}`,
        environmentEn: `Magical storybook reading sanctuary with a whimsical giant wooden storybook tree in the center, plush colorful wool floor cushions, warm glowing hanging lanterns, miniature castle book displays, and fairytale illustrations`,
        environmentId: `Perpustakaan Dongeng & Pojok Cerita Ajaib Sekolah dengan pohon buku raksasa di tengah ruangan, bantal duduk wol empuk warna-warni, lentera gantung temaram hangat, dan kastil buku 3D mini untuk materi ${coreConcept}`,
        cameraAtmosphereEn: `Cozy enchanting golden storybook glow, warm gentle shadows, comforting fairytale aesthetic`,
        pakRoniAttireEn: `Warm caramel-brown knit cardigan over a crisp white cotton collared shirt, dark trousers, holding an ornate hardcover leather storybook with embossed gold lettering`,
        pakRoniAttireId: `Cardigan rajut hangat warna karamel di atas kemeja katun putih klasik, memegang buku dongeng bersampul kulit tebal berukir emas`,
        gheaAttireEn: `Charming fairytale pinafore dress with ribbon embroidery over a ruffled collar blouse, her signature bright red headband adorned with a tiny storybook pin, holding playful animal hand puppets`,
        gheaAttireId: `Gaun pinafore terusan dongeng manis di atas blus berkerah renda pita, bando merah khasnya disematkan pin buku cerita kecil, memegang boneka wayang tangan tokoh fabel`,
        jordyAttireEn: `Vintage-styled storyteller shorts with leather suspenders over a warm plaid flannel shirt, newsboy cap tilted over his wavy black hair, holding an illustrated folklore popup book`,
        jordyAttireId: `Celana kargo pendek dengan suspender kulit cokelat di atas kemeja flanel bergaris hangat, topi petualang dongeng di atas rambut ikalnya, memegang buku cerita bergambar terbuka`,
      };
    }

    // 4B. Puisi, Pantun, Deklamasi, Drama & Pentas Sastra
    if (
      combined.includes('puisi') ||
      combined.includes('pantun') ||
      combined.includes('deklamasi') ||
      combined.includes('sastra') ||
      combined.includes('drama') ||
      combined.includes('teater') ||
      combined.includes('rima')
    ) {
      return {
        id: 'adat_nusantara',
        label: `Panggung Sastra Cilik • Busana Penyair Cilik & Naskah Pita Emas (${coreConcept})`,
        badge: 'Panggung Sastra • Busana Pentas',
        shortDesc: `Latar panggung teater sastra sekolah dengan tirai beludru merah dan busana pentas anggun untuk pembacaan ${coreConcept}`,
        environmentEn: `Inspiring school literature stage with rich velvet theatrical curtains, classic retro vintage microphone on a stand, carved wooden poetry easel, warm stage spotlighting, and applause banner in the background`,
        environmentId: `Panggung Sastra & Teater Baca Cilik dengan tirai beludru merah panggung, mikrofon retro berdiri klasik, dan papan bait puisi berbingkai kayu artistik untuk ${coreConcept}`,
        cameraAtmosphereEn: `Dramatic soft theatrical stage lighting, artistic bokeh, poetic and expressive ambiance`,
        pakRoniAttireEn: `Elegant modern silk batik shirt with a delicate traditional draped shoulder sash, tailored trousers, carrying rolled poetry scrolls tied with golden ribbons`,
        pakRoniAttireId: `Kemeja batik tulis sutra santun dengan syal selendang tipis elegan, membawa gulungan kertas puisi berpita emas`,
        gheaAttireEn: `Graceful pastel pink dress with subtle floral embroidery, her signature bright red headband, holding an illustrated poetry booklet tied with red ribbon`,
        gheaAttireId: `Gaun terusan anggun warna merah muda pastel dengan aksen bordir bunga, bando merah khas di dahi berponi, memegang naskah puisi berhias pita`,
        jordyAttireEn: `Crisp buttoned white shirt with a small neat black bowtie and formal vest, his wavy black hair impeccably groomed for stage performance, holding rhyming pantun cards`,
        jordyAttireId: `Kemeja putih berkancing rapi dengan dasi kupu-kupu hitam kecil, rompi formal rapi, rambut ikal tersisir rapi bergaya penampil panggung cilik, memegang naskah pantun`,
      };
    }

    // 4C. Teks Petunjuk, Prosedur, Wawancara, Jurnalis & Wartawan Cilik
    if (
      combined.includes('petunjuk') ||
      combined.includes('prosedur') ||
      combined.includes('wawancara') ||
      combined.includes('berita') ||
      combined.includes('jurnalistik') ||
      combined.includes('laporan')
    ) {
      return {
        id: 'kelas_merah_putih',
        label: `Redaksi Jurnalis Cilik • Rompi Reporter Pers & Kamera Saku (${coreConcept})`,
        badge: 'Redaksi Pers • Wartawan Cilik',
        shortDesc: `Latar ruang redaksi pers sekolah dengan papan berita dinding, rompi reporter pers cilik, dan mikrofon wawancara untuk ${coreConcept}`,
        environmentEn: `Bustling junior newsroom and school press editorial desk with wooden workstations, cork bulletin board covered in student news articles, school broadcast microphone, and studio lighting`,
        environmentId: `Ruang Redaksi Berita & Pojok Wartawan Cilik Sekolah dengan meja redaksi kayu, papan kliping artikel dinding, mikrofon wawancara berlogo sekolah, dan kamera studio untuk ${coreConcept}`,
        cameraAtmosphereEn: `Crisp journalistic documentary illumination, active inquisitive mood, shallow depth of field`,
        pakRoniAttireEn: `Smart-casual navy educator blazer over a white polo shirt, editorial advisor press lanyard badge, dark trousers, holding an official news folder`,
        pakRoniAttireId: `Blazer smart-casual navy di atas kaos polo putih, lanyard kartu pers pembina jurnalistik, memegang map berita`,
        gheaAttireEn: `Tailored junior reporter vest in beige with an official 'Wartawan Cilik' press badge, signature bright red headband, carrying a red pocket interview notepad and pen`,
        gheaAttireId: `Rompi reporter cilik warna krem dengan badge pers bertuliskan 'Wartawan Cilik', buku saku catatan jurnalis bersampul merah di tangan, bando merah khasnya`,
        jordyAttireEn: `Matching junior reporter vest with a compact camera strapped securely across his chest, newsboy cap over his naturally wavy hair, holding a kid-safe interview microphone`,
        jordyAttireId: `Rompi reporter warna senada dengan kamera fotografi saku tergantung di dada, topi newsboy cap di atas rambut ikalnya, mikrofon wawancara di tangan`,
      };
    }

    // 4D. Literasi Membaca, Menulis, Kosakata, Kalimat (Default Bahasa Indonesia)
    return {
      id: 'kelas_merah_putih',
      label: `Taman Baca Literasi Ceria • Kemeja Duta Baca & Seragam Ceria (${coreConcept})`,
      badge: 'Taman Baca • Duta Literasi',
      shortDesc: `Latar taman baca terbuka sekolah yang asri dengan rak buku warna-warni dan busana duta literasi membaca untuk ${coreConcept}`,
      environmentEn: `Open-air school garden reading lounge with a cozy wooden gazebo, colorful student bookshelves, illustrated vocabulary flashcards hanging from wooden lines, and lush shade trees`,
      environmentId: `Taman Baca Literasi Terbuka Sekolah dengan gazebo kayu estetik, rak buku anak penuh warna, papan pajangan karya tulis siswa, dan pohon rindang asri untuk materi ${coreConcept}`,
      cameraAtmosphereEn: `Fresh airy tropical sunlight, cheerful reading ambiance, vibrant book colors and crisp bokeh`,
      pakRoniAttireEn: `Comfortable light-blue collared educator shirt with a 'Duta Literasi Guru' ceremonial sash, dark trousers, holding an engaging illustrated children's reader`,
      pakRoniAttireId: `Kemeja katun santai warna biru pastel dengan selempang Duta Literasi Guru, memegang buku cerita bersampul menarik`,
      gheaAttireEn: `Crisp blouse with a pastel pleated skirt, 'Duta Membaca' sash across shoulder, her signature bright red headband, holding colorful vocabulary picture cards`,
      gheaAttireId: `Blus putih rapi dengan rok lipit merah muda pastel, selempang Duta Membaca Cilik, bando merah khas di dahi, memegang kartu kosakata bergambar`,
      jordyAttireEn: `Vibrant teal short-sleeved cotton shirt, tidy trousers, his wavy black hair neat and bouncy, holding an illustrated student encyclopedia`,
      jordyAttireId: `Kemeja kasual katun lengan pendek warna toska cerah, celana chino rapi, rambut ikal hitamnya bervolume rapi, memegang buku ensiklopedia anak`,
    };
  }

  // =========================================================================
  // 5. MATA PELAJARAN: PJOK (OLAHRAGA & KEBUGARAN)
  // =========================================================================
  if (
    mapelLower.includes('pjok') ||
    mapelLower.includes('olahraga') ||
    mapelLower.includes('penjas') ||
    mapelLower.includes('jasmani')
  ) {
    return THEME_SETTING_CONFIGS.olahraga_lapangan;
  }

  // =========================================================================
  // 6. MATA PELAJARAN: SENI RUPA & KRIYA
  // =========================================================================
  if (
    mapelLower.includes('seni rupa') ||
    mapelLower.includes('rupa') ||
    mapelLower.includes('lukis') ||
    mapelLower.includes('gambar') ||
    mapelLower.includes('kriya')
  ) {
    return {
      id: 'kelas_merah_putih',
      label: `Studio Seni Rupa • Celemek Pelukis & Baret Seniman Cilik (${coreConcept})`,
      badge: 'Studio Seni Rupa • Pelukis Cilik',
      shortDesc: `Latar studio galeri seni rupa dengan kanvas di atas easel kayu, palet cat air, dan celemek pelukis warna-warni untuk ${coreConcept}`,
      environmentEn: `Vibrant Indonesian school art gallery and craft atelier with wooden display easels holding student paintings, clay pottery tables, colorful palettes, and glass jars with various paintbrushes under bright natural skylights`,
      environmentId: `Studio Galeri Seni Lukis & Ruang Kriya Sekolah dengan kanvas-kanvas karya seni di atas easel kayu, meja putar tembikar tanah liat, palet cat kayu penuh warna, kuas-kuas aneka ukuran dalam toples kaca untuk materi ${coreConcept}`,
      cameraAtmosphereEn: `Warm artistic studio daylight, richly saturated pigment splashes, creative bohemian ambiance with crisp visual clarity`,
      pakRoniAttireEn: `Linen educator shirt with rolled sleeves under a genuine artist brown canvas apron with cheerful splashes of paint, dark trousers, holding an artist wooden palette and fine sable brushes`,
      pakRoniAttireId: `Kemeja katun linen santai lengan digulung dengan celemek pelukis katun cokelat berbercak cat artistik warna-warni, memegang palet kayu dan kuas lukis berbulu halus`,
      gheaAttireEn: `Pastel light-blue child art smock patterned with flowers over clothes, her signature bright red headband with a miniature paintbrush tucked adorably beside her ear, paint-speckled fingers holding watercolor brush`,
      gheaAttireId: `Baju celemek pelukis cilik (art smock) warna biru muda pastel bermotif bunga dengan saku kuas kecil, bando merah cerah khasnya terselip kuas gambar kecil di samping telinga, jari-jemarinya memegang kuas cat air`,
      jordyAttireEn: `Vibrant green child art smock with playful primary color splashes, a black artist beret tilted jauntily over his wavy black hair, holding a wooden mixing palette and a mini canvas`,
      jordyAttireId: `Baju celemek pelukis cilik warna hijau cerah dengan bercak cat warna-warni ceria, topi baret pelukis hitam miring di atas rambut ikalnya yang mengembang, memegang palet warna dan kanvas mini`,
    };
  }

  // =========================================================================
  // 7. MATA PELAJARAN: SENI MUSIK
  // =========================================================================
  if (
    mapelLower.includes('musik') ||
    mapelLower.includes('suara') ||
    mapelLower.includes('nada') ||
    mapelLower.includes('lagu') ||
    mapelLower.includes('alat musik')
  ) {
    return {
      id: 'adat_nusantara',
      label: `Studio Musik Harmoni • Busana Musisi Cilik & Angklung Bambu (${coreConcept})`,
      badge: 'Studio Musik • Busana Harmoni',
      shortDesc: `Latar studio musik harmoni sekolah dengan jajaran angklung bambu bertingkat dan busana musisi cilik untuk ${coreConcept}`,
      environmentEn: `Acoustic Indonesian school music lounge and harmony studio with authentic tiered bamboo angklung racks, miniature brass gamelan bonang, upright acoustic piano, and floating 3D musical clef decorations`,
      environmentId: `Studio Musik Harmoni & Balai Nada Sekolah dengan instrumen angklung bambu berjejer rapi pada rak kayu jati, gamelan bonang mini kuningan berkilau, piano akustik tegak, dan dekorasi simbol not balok 3D melayang untuk materi ${coreConcept}`,
      cameraAtmosphereEn: `Warm harmonious melodic lighting, gentle golden wood reflections, resonant artistic atmosphere`,
      pakRoniAttireEn: `Modern mandarin-collar batik shirt with an authentic cultural woven sash, tailored trousers, holding a small conductor's baton`,
      pakRoniAttireId: `Kemeja batik modern berkerah mandarin dengan selendang kain etnik terkalung rapi, memegang tongkat konduktor musik (baton) kecil yang elegan`,
      gheaAttireEn: `Graceful white blouse with a pleated teal skirt accented by a musical treble-clef ribbon, signature bright red headband, holding a colorful student melodica (pianika) instrument`,
      gheaAttireId: `Blus putih anggun dengan rok lipit biru toska beraksen pita musik, bando merah khas di rambut berponinya, memegang instrumen pianika atau angklung nada melati`,
      jordyAttireEn: `Tailored black vest over a crisp long-sleeved white shirt with a colorful bow-tie, his naturally wavy black hair neatly styled, holding a tuned bamboo angklung instrument`,
      jordyAttireId: `Rompi hitam di atas kemeja putih lengan panjang dengan dasi kupu-kupu warna-warni, rambut ikal bervolume tersisir rapi, memegang gitar akustik mini atau angklung bambu`,
    };
  }

  // =========================================================================
  // 8. MATA PELAJARAN: PENDIDIKAN AGAMA KATOLIK & BUDI PEKERTI
  // =========================================================================
  if (
    mapelLower.includes('agama') ||
    mapelLower.includes('katolik') ||
    mapelLower.includes('budi pekerti')
  ) {
    return {
      id: 'adat_nusantara',
      label: `Ruang Kelas Agama Katolik & Kapel Sekolah Asri • Salib Kayu, Lilin Syukur & Alkitab Katolik (${coreConcept})`,
      badge: 'Kapel & Kelas Agama • Karakter Kasih Kristiani',
      shortDesc: `Latar kelas agama Katolik dan serambi kapel sekolah yang damai dengan salib kayu anggun, lilin bernyala, dan Alkitab Katolik bergambar untuk ${coreConcept}`,
      environmentEn: `Peaceful Indonesian school Catholic classroom and serene chapel veranda with polished wooden altar, warm candlelight, wooden wall crucifix, beautiful Catholic children's Bible on lectern, and lush tropical school garden visible through arched windows`,
      environmentId: `Ruang kelas Pendidikan Agama Katolik dan serambi kapel sekolah yang teduh dan khidmat dengan meja altar kayu jati berhias lilin bernyala, salib dinding kayu anggun, Alkitab Katolik anak bergambar di atas mimbar, dan jendela lengkung menghadap taman sekolah hijau untuk ${coreConcept}`,
      cameraAtmosphereEn: `Warm peaceful divine golden glow, gentle soft ambient lighting, serene reverent depth of field`,
      pakRoniAttireEn: `Pristine white neat formal collared shirt layered with an elegant traditional Timor/NTT woven motif vest (selendang tenun), dark pressed formal trousers, polished leather shoes, warm benevolent teacher presence`,
      pakRoniAttireId: `Kemeja putih berkerah formal rapi berpadu rompi/selendang tenun etnik khas NTT bermotif anggun, celana kain panjang hitam rapi, sepatu pantofel berkilau, memancarkan wibawa pendidik yang ramah dan penuh kasih`,
      gheaAttireEn: `Neat modest Catholic school uniform with a small tasteful wooden cross pendant necklace, hair neatly tied with a red ribbon, holding an illustrated Catholic Bible storybook with joyful reverent smile`,
      gheaAttireId: `Seragam sekolah rapi berkalung salib kayu kecil manis, rambut berkepang rapi dengan pita merah manis, memegang buku kisah Alkitab Katolik bergambar dengan senyum ceria dan santun`,
      jordyAttireEn: `Crisp clean white school shirt with red shorts, wearing a small wooden cross pendant necklace, hands held in respectful prayer posture or holding an illustrated saints storybook`,
      jordyAttireId: `Seragam merah putih sekolah bersih rapi, berkalung salib kayu mungil, menunjukkan sikap tangan berdoa yang khidmat atau memegang buku teladan orang kudus bergambar`,
    };
  }

  // =========================================================================
  // 9. MATA PELAJARAN: BAHASA INGGRIS
  // =========================================================================
  if (
    mapelLower.includes('inggris') ||
    mapelLower.includes('english')
  ) {
    return {
      id: 'kelas_merah_putih',
      label: `Global Fun English Studio • Blazer Edukasi & Chic Plaid Uniform (${coreConcept})`,
      badge: 'English Studio • Global Explorer',
      shortDesc: `Latar studio bahasa Inggris global dengan peta dunia interaktif, kartu kosakata bergambar, dan seragam chic plaid untuk ${coreConcept}`,
      environmentEn: `Bright Fun English Language Lounge & Global Explorer Studio with a giant illuminated world map, colorful vocabulary flashcards on lines, world clocks showing London-Jakarta-New York, and miniature landmark models on shelves`,
      environmentId: `Fun English Language Lounge & Global Explorer Studio dengan peta dunia interaktif raksasa bercahaya, kartu flashcard kosakata bergambar, jam dinding zona waktu London-Jakarta-New York, dan miniatur landmark dunia di atas rak buku untuk ${coreConcept}`,
      cameraAtmosphereEn: `Bright international school daylight, cheery vibrant colors, inspiring global communication mood`,
      pakRoniAttireEn: `Smart international teacher navy blazer over a crisp white polo shirt, world friendship flag lapel badge, tailored trousers, holding colorful bilingual activity cards`,
      pakRoniAttireId: `Smart international teacher blazer warna navy di atas kaos berkerah putih rapi, lencana bendera persahabatan dunia, memegang kartu petunjuk bahasa Inggris bergambar`,
      gheaAttireEn: `Chic schoolgirl uniform: crisp white shirt with peter-pan collar under a maroon plaid pleated skirt, signature bright red headband, white socks, holding 'My English Storybook'`,
      gheaAttireId: `Seragam sekolah internasional anak yang chic: kemeja putih berkerah peter-pan dengan rok lipit kotak-kotak (plaid skirt) warna merah marun, bando merah cerah khasnya, memegang buku 'My English Storybook'`,
      jordyAttireEn: `Sporty royal blue polo shirt with casual knit necktie, neat khaki chino pants, his wavy black hair bouncing with friendly energy, holding a mini interactive globe`,
      jordyAttireId: `Kemeja polo shirt warna biru laut dengan dasi rajut kecil kasual, celana chino krem, rambut ikal hitamnya rapi energik, memegang globe bola dunia interaktif kecil`,
    };
  }

  // =========================================================================
  // 10. KEPANDUAN / PRAMUKA KHUSUS
  // =========================================================================
  if (
    combined.includes('pramuka') ||
    combined.includes('kepanduan') ||
    combined.includes('kemah') ||
    combined.includes('tunas kelapa')
  ) {
    return THEME_SETTING_CONFIGS.pramuka_lengkap;
  }

  // =========================================================================
  // 11. STANDAR: RUANG KELAS SD INDONESIA (MERAH-PUTIH & BATIK GURU)
  // =========================================================================
  return THEME_SETTING_CONFIGS.kelas_merah_putih;
}

/**
 * Helper menghasilkan Aset Karakter Konsisten sesuai tema busana terpilih
 */
export function getCharacterAssetForTheme(
  charKey: 'pakRoni' | 'ghea' | 'jordy',
  themeInput: Exclude<MediaPromptThemeSetting, 'auto'> | ThemeSettingConfig,
  style: VisualStyleType = 'pixar'
): MediaPromptCharacterAsset {
  const trait = PERMANENT_CHARACTER_PHYSICAL_TRAITS[charKey];
  const theme: ThemeSettingConfig =
    typeof themeInput === 'string'
      ? THEME_SETTING_CONFIGS[themeInput] || THEME_SETTING_CONFIGS.kelas_merah_putih
      : themeInput;
  const styleConfig = VISUAL_STYLES[style] || VISUAL_STYLES.pixar;

  const attireEn =
    charKey === 'pakRoni'
      ? theme.pakRoniAttireEn
      : charKey === 'ghea'
      ? theme.gheaAttireEn
      : theme.jordyAttireEn;

  const attireId =
    charKey === 'pakRoni'
      ? theme.pakRoniAttireId
      : charKey === 'ghea'
      ? theme.gheaAttireId
      : theme.jordyAttireId;

  const promptCharacterAsset = `Aset Karakter: ${trait.name} (${trait.role})
Tema Busana: ${theme.label}

Instruksi: Generate gambar ini terlebih dahulu sebagai referensi karakter utama. Gunakan sebagai "Image Reference" di generator AI (Midjourney / Runway / Kling / Flux / Leonardo) agar konsistensi fisik (wajah, rambut, mata) tetap persis sama di setiap adegan!

${styleConfig.renderKeywords}. Single character full body portrait.
PHYSICAL TRAITS (WAJIB PERSIS SAMA): ${trait.physicalTraitsEn}.
ATTIRE & PROPS: Wearing ${attireEn}.
POSE & FRAMING: Neutral standing pose, confident friendly posture facing camera, stylized proportions, studio neutral gradient background, soft rim lighting, ultra high detail, polished cinematic 3D character design.

NEGATIVE: ${trait.negativePrompt}`;

  return {
    characterId: trait.characterId,
    name: trait.name,
    role: trait.role,
    age: trait.age,
    physicalTraits: trait.physicalTraitsId,
    attire: attireId,
    promptCharacterAsset,
    negativePrompt: trait.negativePrompt,
  };
}

/**
 * Resolusi tokoh aktif untuk masing-masing adegan berdasarkan mode dan konfigurasi pengguna (Mendukung 6, 8, atau 10 Adegan)
 */
export function resolveSceneCharacters(
  mode: MediaPromptCharacterMode = 'dynamic',
  sceneNumber: number,
  custom?: MediaPromptCharacterCustomSelection,
  totalScenes: number = 8
): {
  activeKeys: ('pakRoni' | 'ghea' | 'jordy')[];
  characterNames: string;
  sceneRoleSummary: string;
} {
  // 1. Kustom Pilihan Tokoh
  if (mode === 'custom' && custom) {
    const active: ('pakRoni' | 'ghea' | 'jordy')[] = [];
    if (custom.pakRoni) active.push('pakRoni');
    if (custom.ghea) active.push('ghea');
    if (custom.jordy) active.push('jordy');

    if (active.length === 0) {
      // Fallback aman jika semua tidak dicentang
      return {
        activeKeys: ['pakRoni', 'ghea', 'jordy'],
        characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
        sceneRoleSummary: 'Trio Lengkap (3 Tokoh Terpilih)',
      };
    }
    const names = active
      .map((k) => (k === 'pakRoni' ? 'Pak Roni' : k === 'ghea' ? 'Ghea' : 'Jordy'))
      .join(', ');
    return {
      activeKeys: active,
      characterNames: `${names} (${active.length} Tokoh Terpilih)`,
      sceneRoleSummary: `${names} (${active.length} Tokoh)`,
    };
  }

  // 2. Solo 1 Tokoh
  if (mode === 'solo_pak_roni') {
    return {
      activeKeys: ['pakRoni'],
      characterNames: 'Solo Pak Roni (Guru)',
      sceneRoleSummary: 'Solo Pak Roni (1 Tokoh Guru Membimbing & Menginspirasi)',
    };
  }
  if (mode === 'solo_ghea') {
    return {
      activeKeys: ['ghea'],
      characterNames: 'Solo Ghea (Siswi)',
      sceneRoleSummary: 'Solo Ghea (1 Tokoh Siswi Detektif Belajar Ceria)',
    };
  }
  if (mode === 'solo_jordy') {
    return {
      activeKeys: ['jordy'],
      characterNames: 'Solo Jordy (Siswa)',
      sceneRoleSummary: 'Solo Jordy (1 Tokoh Siswa Eksploratif Energik)',
    };
  }

  // 3. Duo 2 Tokoh
  if (mode === 'duo_students') {
    return {
      activeKeys: ['ghea', 'jordy'],
      characterNames: 'Duo Ghea & Jordy (Murid)',
      sceneRoleSummary: 'Duo Ghea & Jordy (2 Tokoh Murid Kolaboratif Sebaya)',
    };
  }
  if (mode === 'duo_guru_ghea') {
    return {
      activeKeys: ['pakRoni', 'ghea'],
      characterNames: 'Duo Pak Roni & Ghea',
      sceneRoleSummary: 'Duo Pak Roni & Ghea (2 Tokoh Interaksi Guru-Siswi)',
    };
  }
  if (mode === 'duo_guru_jordy') {
    return {
      activeKeys: ['pakRoni', 'jordy'],
      characterNames: 'Duo Pak Roni & Jordy',
      sceneRoleSummary: 'Duo Pak Roni & Jordy (2 Tokoh Interaksi Guru-Siswa)',
    };
  }

  // 4. Trio Lengkap 3 Tokoh di Semua Adegan
  if (mode === 'trio') {
    return {
      activeKeys: ['pakRoni', 'ghea', 'jordy'],
      characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
      sceneRoleSummary: 'Trio Lengkap (Pak Roni, Ghea, Jordy)',
    };
  }

  // 5. Default: 'dynamic' (Bergantian Cerdas Sesuai Alur Edukatif 4, 6, 8, atau 10 Adegan)
  if (totalScenes <= 4) {
    switch (sceneNumber) {
      case 1:
        return {
          activeKeys: ['ghea', 'jordy'],
          characterNames: 'Duo Ghea & Jordy (Murid)',
          sceneRoleSummary: 'Duo Murid (Apersepsi & Hook Pemantik Rasa Penasaran)',
        };
      case 2:
        return {
          activeKeys: ['pakRoni', 'jordy'],
          characterNames: 'Pak Roni & Jordy (Duo Guru-Siswa)',
          sceneRoleSummary: 'Duo Guru-Siswa (Eksplorasi Animasi 3D & Sistem Komponen)',
        };
      case 3:
        return {
          activeKeys: ['pakRoni', 'ghea'],
          characterNames: 'Pak Roni & Ghea (Duo Guru-Siswi)',
          sceneRoleSummary: 'Duo Guru-Siswi (Pendalaman Mekanisme & Fenomena Ilmiah)',
        };
      case 4:
      default:
        return {
          activeKeys: ['pakRoni', 'ghea', 'jordy'],
          characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
          sceneRoleSummary: 'Trio Lengkap (Rangkuman Tuntas, Dampak Nyata & Salam Penutup)',
        };
    }
  }

  if (totalScenes === 6) {
    switch (sceneNumber) {
      case 1:
        return {
          activeKeys: ['pakRoni'],
          characterNames: 'Pak Roni (Solo Guru)',
          sceneRoleSummary: 'Solo Pak Roni (Guru Membuka Apersepsi & Tantangan Dunia Nyata)',
        };
      case 2:
        return {
          activeKeys: ['jordy'],
          characterNames: 'Jordy (Siswa Ceria)',
          sceneRoleSummary: 'Solo Jordy (Siswa Menemukan Pertanyaan Pemantik Kunci)',
        };
      case 3:
        return {
          activeKeys: ['pakRoni', 'ghea'],
          characterNames: 'Pak Roni & Ghea',
          sceneRoleSummary: 'Duo Guru & Siswi (Pemaparan Konsep Inti & Visualisasi 3D)',
        };
      case 4:
        return {
          activeKeys: ['ghea'],
          characterNames: 'Ghea (Siswi Cerdas)',
          sceneRoleSummary: 'Solo Ghea (Momen Aha! Murid Memahami Pola Materi)',
        };
      case 5:
        return {
          activeKeys: ['ghea', 'jordy'],
          characterNames: 'Ghea & Jordy (Duo Murid)',
          sceneRoleSummary: 'Duo Murid (Praktik Kolaboratif Menyelesaikan Contoh Kasus)',
        };
      case 6:
      default:
        return {
          activeKeys: ['pakRoni', 'ghea', 'jordy'],
          characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
          sceneRoleSummary: 'Trio Lengkap (Refleksi Emas & Kesimpulan Menyenangkan)',
        };
    }
  }

  if (totalScenes === 10) {
    switch (sceneNumber) {
      case 1:
        return {
          activeKeys: ['pakRoni'],
          characterNames: 'Pak Roni (Solo Guru)',
          sceneRoleSummary: 'Solo Pak Roni (Apersepsi & Fenomena Menarik)',
        };
      case 2:
        return {
          activeKeys: ['jordy'],
          characterNames: 'Jordy (Siswa)',
          sceneRoleSummary: 'Solo Jordy (Rasa Ingin Tahu & Identifikasi Masalah)',
        };
      case 3:
        return {
          activeKeys: ['pakRoni'],
          characterNames: 'Pak Roni (Solo Guru)',
          sceneRoleSummary: 'Solo Pak Roni (Fondasi Teori & Unsur Pokok Materi)',
        };
      case 4:
        return {
          activeKeys: ['ghea'],
          characterNames: 'Ghea (Siswi)',
          sceneRoleSummary: 'Solo Ghea (Eksplorasi Benda Konkret & Alat Peraga)',
        };
      case 5:
        return {
          activeKeys: ['pakRoni', 'ghea'],
          characterNames: 'Pak Roni & Ghea',
          sceneRoleSummary: 'Duo Guru-Siswi (Visualisasi Animasi 3D Cara Kerja)',
        };
      case 6:
        return {
          activeKeys: ['jordy'],
          characterNames: 'Jordy (Siswa)',
          sceneRoleSummary: 'Solo Jordy (Momen Aha & Analogi Sederhana)',
        };
      case 7:
        return {
          activeKeys: ['ghea', 'jordy'],
          characterNames: 'Ghea & Jordy (Duo Murid)',
          sceneRoleSummary: 'Duo Murid (Uji Coba Contoh Kasus 1 Mandiri)',
        };
      case 8:
        return {
          activeKeys: ['pakRoni', 'jordy'],
          characterNames: 'Pak Roni & Jordy',
          sceneRoleSummary: 'Duo Guru & Siswa (Penyelesaian Masalah Kasus 2)',
        };
      case 9:
        return {
          activeKeys: ['pakRoni', 'ghea'],
          characterNames: 'Pak Roni & Ghea',
          sceneRoleSummary: 'Duo Guru & Siswi (Pengecekan Kritis & Hindari Miskonsepsi)',
        };
      case 10:
      default:
        return {
          activeKeys: ['pakRoni', 'ghea', 'jordy'],
          characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
          sceneRoleSummary: 'Trio Lengkap (Refleksi Emas & Penguatan Karakter Dimensi Lulusan)',
        };
    }
  }

  // Standar: 8 Adegan (Rekomendasi Utama Pembelajaran Tuntas)
  switch (sceneNumber) {
    case 1:
      return {
        activeKeys: ['pakRoni'],
        characterNames: 'Pak Roni (Solo Guru)',
        sceneRoleSummary: 'Solo Pak Roni (Apersepsi & Tantangan Masalah Dunia Nyata)',
      };
    case 2:
      return {
        activeKeys: ['jordy'],
        characterNames: 'Jordy (Siswa Ceria)',
        sceneRoleSummary: 'Solo Jordy (Rasa Ingin Tahu & Pertanyaan Kunci Penyelidikan)',
      };
    case 3:
      return {
        activeKeys: ['pakRoni'],
        characterNames: 'Pak Roni (Solo Guru)',
        sceneRoleSummary: 'Solo Pak Roni (Pemaparan Fondasi Konsep Inti dengan Alat Peraga)',
      };
    case 4:
      return {
        activeKeys: ['pakRoni', 'ghea'],
        characterNames: 'Pak Roni & Ghea (Duo Guru-Siswi)',
        sceneRoleSummary: 'Duo Pak Roni & Ghea (Visualisasi Animasi 3D & Cara Kerja Interaktif)',
      };
    case 5:
      return {
        activeKeys: ['ghea'],
        characterNames: 'Ghea (Siswi Berjilbab)',
        sceneRoleSummary: 'Solo Ghea (Momen Aha! Murid Memahami Analogi Sederhana)',
      };
    case 6:
      return {
        activeKeys: ['ghea', 'jordy'],
        characterNames: 'Ghea & Jordy (Duo Murid)',
        sceneRoleSummary: 'Duo Ghea & Jordy (Praktik Kolaboratif Menuntaskan Langkah Masalah)',
      };
    case 7:
      return {
        activeKeys: ['pakRoni', 'jordy'],
        characterNames: 'Pak Roni & Jordy (Duo Guru-Siswa)',
        sceneRoleSummary: 'Duo Pak Roni & Jordy (Verifikasi Solusi & Pembuktian Capaian TP)',
      };
    case 8:
    default:
      return {
        activeKeys: ['pakRoni', 'ghea', 'jordy'],
        characterNames: 'Pak Roni, Ghea, Jordy (Trio Lengkap)',
        sceneRoleSummary: 'Trio Lengkap (Refleksi Emas, Kesimpulan & Salam Pelajar Pancasila)',
      };
  }
}

/**
 * Backward compatibility: VIDEO_CHARACTER_SPECS default to kelas_merah_putih
 */
export const VIDEO_CHARACTER_SPECS: Record<'pakRoni' | 'ghea' | 'jordy', MediaPromptCharacterAsset> = {
  pakRoni: getCharacterAssetForTheme('pakRoni', 'kelas_merah_putih', 'pixar'),
  ghea: getCharacterAssetForTheme('ghea', 'kelas_merah_putih', 'pixar'),
  jordy: getCharacterAssetForTheme('jordy', 'kelas_merah_putih', 'pixar'),
};

/**
 * PENEGASAN MUTLAK BAHASA INDONESIA:
 * Seluruh teks media ajar, slide presentasi, buku catatan, kartu belajar, dan infografis
 * WAJIB 100% menggunakan Bahasa Indonesia yang ramah anak, santun, dan memotivasi.
 */
export const STRICT_INDONESIAN_LANGUAGE_MANDATE = `
================================================================================
CRITICAL MANDATORY INSTRUCTION: 100% BAHASA INDONESIA ONLY FOR IN-MEDIA TEXT!
(PENEGASAN MUTLAK: SELURUH TEKS SLIDE, NOTEBOOK, FLASHCARD & INFOGRAFIS WAJIB BAHASA INDONESIA!)
1. ALL VISIBLE TEXT, SLIDE BULLET POINTS, FLASHCARD QUESTIONS & ANSWERS, AND NOTEBOOK PROMPTS
   MUST BE WRITTEN EXCLUSIVELY IN NATURAL, CHILD-FRIENDLY BAHASA INDONESIA.
2. USE SIMPLE, INSPIRING, WARM, AND ENGAGING LANGUAGE SUITABLE FOR ELEMENTARY STUDENTS (ANAK SD).
3. DO NOT USE OVERLY FORMAL JARGON. USE WORDS THAT SPARK JOY AND CRITICAL THINKING.
4. PRESERVE STRICTLY ALL INDONESIAN TERMINOLOGY AND CURRICULUM MERDEKA VALUES.
================================================================================
`.trim();

/**
 * Clean and normalize text strings
 */
function cleanText(text?: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Clean concept string and strip numerical prefixes like "1. ", "2) ", "A. "
 */
function cleanConceptString(text?: string): string {
  if (!text) return '';
  return text
    .replace(/^[0-9]+[.\-)]\s*/, '')
    .replace(/^[A-Za-z][.\-)]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SubjectLearningTools {
  categoryName: string;
  deskPropsEn: string;
  deskPropsId: string;
  hologramVisualEn: string;
  dialogSubject: string;
}

/**
 * Generate subject-specific pedagogical props and visual cues tailored to the chosen Mata Pelajaran
 */
export function getSubjectLearningTools(mataPelajaran: string, coreConcept: string): SubjectLearningTools {
  const mapelLower = (mataPelajaran || '').toLowerCase();

  if (mapelLower.includes('matematika') || mapelLower.includes('math') || mapelLower.includes('hitung')) {
    return {
      categoryName: 'Matematika',
      deskPropsEn: `concrete mathematical manipulatives of '${coreConcept}' (colorful counting cubes, fraction discs, 3D geometric solids, number lines, kid-safe ruler, and calculation cards)`,
      deskPropsId: `alat peraga konkret matematika (balok hitung warna-warni, keping pecahan, bangun ruang mini, garis bilangan, dan kartu tantangan berhitung)`,
      hologramVisualEn: `interactive glowing 3D geometric breakdown, dynamic floating number transformations, and colorful fraction diagrams illustrating '${coreConcept}'`,
      dialogSubject: 'Matematika',
    };
  }

  if (mapelLower.includes('ipas') || mapelLower.includes('ipa') || mapelLower.includes('sains') || mapelLower.includes('alam') || mapelLower.includes('sosial')) {
    return {
      categoryName: 'IPAS',
      deskPropsEn: `concrete scientific and social inquiry props of '${coreConcept}' (student magnifying glasses, miniature specimen jars, leaf/rock samples, dynamic ecosystem observation cards, and an illustrated nature journal)`,
      deskPropsId: `peralatan observasi dan penyelidikan sains IPAS (kaca pembesar, wadah spesimen mini, kartu pengamatan ekosistem/sosial, dan buku jurnal alam bergambar)`,
      hologramVisualEn: `luminous 3D floating ecosystem model, anatomical cross-section, or physical phenomena simulation illustrating '${coreConcept}'`,
      dialogSubject: 'IPAS',
    };
  }

  if (mapelLower.includes('indonesia')) {
    return {
      categoryName: 'Bahasa Indonesia',
      deskPropsEn: `concrete language learning manipulatives of '${coreConcept}' (illustrated storybook cards, vocabulary flashcards, sentence strip puzzle blocks, and a colorful student dictionary)`,
      deskPropsId: `media literasi bahasa (kartu cerita bergambar, kartu kosakata bergambar, balok susun kalimat, dan kamus cilik)`,
      hologramVisualEn: `floating luminous storybook scene, animated word relation diagrams, and character speech bubbles illustrating '${coreConcept}'`,
      dialogSubject: 'Bahasa Indonesia',
    };
  }

  if (mapelLower.includes('pancasila') || mapelLower.includes('pkn') || mapelLower.includes('kewarganegaraan')) {
    return {
      categoryName: 'Pendidikan Pancasila',
      deskPropsEn: `concrete civic learning materials of '${coreConcept}' (Garuda Pancasila emblem tokens, mutual cooperation gotong-royong picture cards, community role-play cards, and Indonesian cultural diversity charts)`,
      deskPropsId: `media edukasi Pancasila (kartu gotong royong, lambang sila-sila Pancasila, miniatur rumah adat, dan kartu simulasi musyawarah)`,
      hologramVisualEn: `glowing 3D Indonesian diversity tapestry, national unity symbols, and harmonious community life scenes illustrating '${coreConcept}'`,
      dialogSubject: 'Pendidikan Pancasila',
    };
  }

  if (mapelLower.includes('inggris') || mapelLower.includes('english')) {
    return {
      categoryName: 'Bahasa Inggris',
      deskPropsEn: `bilingual visual vocabulary flashcards, colorful alphabet puzzle blocks, and cartoon dialogue cards representing '${coreConcept}'`,
      deskPropsId: `kartu kosakata dwibahasa bergambar, balok huruf interaktif, dan kartu percakapan ceria`,
      hologramVisualEn: `floating 3D animated word labels, speech bubbles, and cheerful character action animations illustrating '${coreConcept}'`,
      dialogSubject: 'Bahasa Inggris',
    };
  }

  if (mapelLower.includes('seni') || mapelLower.includes('rupa') || mapelLower.includes('sbdp') || mapelLower.includes('musik') || mapelLower.includes('tari')) {
    return {
      categoryName: 'Seni Rupa & Budaya',
      deskPropsEn: `vibrant watercolor paint palettes, color wheels, texture swatches, modeling clay, and sketchpad pages representing '${coreConcept}'`,
      deskPropsId: `palet cat air, roda warna interaktif, lempung pemodelan, dan buku sketsa bergambar`,
      hologramVisualEn: `whimsical 3D floating color wheel, swirling artistic patterns, and dynamic brushstroke animations illustrating '${coreConcept}'`,
      dialogSubject: 'Seni Rupa',
    };
  }

  if (mapelLower.includes('pjok') || mapelLower.includes('olahraga') || mapelLower.includes('penjas')) {
    return {
      categoryName: 'PJOK',
      deskPropsEn: `mini agility cones, movement posture sequence cards, colorful jump ropes, and sports timer props representing '${coreConcept}'`,
      deskPropsId: `kerucut ketangkasan mini, kartu urutan gerak tubuh, tali lompat warna-warni, dan stopwatch anak`,
      hologramVisualEn: `luminous 3D human motion trajectory, healthy posture guide, and dynamic fitness flow diagrams illustrating '${coreConcept}'`,
      dialogSubject: 'PJOK',
    };
  }

  if (mapelLower.includes('agama') || mapelLower.includes('katolik')) {
    return {
      categoryName: mataPelajaran || 'Pendidikan Agama Katolik dan Budi Pekerti',
      deskPropsEn: `illustrated Catholic Bible story cards, lighted candle prop, crucifix symbol, and children's prayer cards representing '${coreConcept}'`,
      deskPropsId: `kartu bergambar kisah Alkitab Katolik, lilin bernyala, salib kecil, dan kartu doa harian anak`,
      hologramVisualEn: `soft warm luminous 3D light of Christ, dove of the Holy Spirit, heart-warming Gospel scenes, and golden virtue rays illustrating '${coreConcept}'`,
      dialogSubject: 'Pendidikan Agama Katolik dan Budi Pekerti',
    };
  }

  const cleanMapel = cleanText(mataPelajaran) || 'Mata Pelajaran SD';
  return {
    categoryName: cleanMapel,
    deskPropsEn: `concrete interactive classroom learning cards, hands-on study manipulatives, illustrated worksheets, and student tools representing '${coreConcept}'`,
    deskPropsId: `kartu peraga interaktif, benda konkret pembelajaran, dan lembar aktivitas kreatif`,
    hologramVisualEn: `luminous 3D concept model and interactive visual diagram illustrating '${coreConcept}'`,
    dialogSubject: cleanMapel,
  };
}

/**
 * Extract core pedagogical concept from TP text with rich contextual fallback
 * and strict cross-subject contamination guard
 */
function extractConceptFromTP(tp: TPItem, mataPelajaran: string): {
  coreConcept: string;
  actionVerb: string;
  contextSubject: string;
  tujuanPembelajaran: string;
  kodeTP: string;
} {
  const mapelLower = (mataPelajaran || '').toLowerCase().trim();
  let kompetensi = cleanConceptString(tp.kompetensi);
  let materi = cleanConceptString(tp.lingkupMateri);

  // Jika lingkup materi kosong atau terlalu singkat, ekstrak dari rumusan TP
  if (!materi || materi.length < 3) {
    materi = cleanConceptString(tp.rumusanTP) || 'Konsep Dasar Pembelajaran';
  }

  // Cross-Subject Contamination Guard:
  // If subject is Pendidikan Pancasila / PKn, reject any leaked Math or Science concepts
  if (
    mapelLower.includes('pancasila') ||
    mapelLower.includes('pkn') ||
    mapelLower.includes('ppkn') ||
    mapelLower.includes('kewarganegaraan')
  ) {
    const mathScienceWords = [
      'pecahan',
      'bilangan',
      'cacah',
      'hitung',
      'aljabar',
      'geometri',
      'sudut',
      'kpk',
      'fpb',
      'desimal',
      'diagram',
      'fotosintesis',
      'ekosistem',
    ];
    const hasMathContamination = mathScienceWords.some(
      (w) => materi.toLowerCase().includes(w) || (tp.rumusanTP && tp.rumusanTP.toLowerCase().includes(w))
    );

    if (hasMathContamination) {
      const elemenLower = (tp.elemen || '').toLowerCase();
      if (elemenLower.includes('uud') || elemenLower.includes('norma')) {
        materi = 'Norma, Hak, dan Kewajiban Warga Negara';
      } else if (elemenLower.includes('bhinneka') || elemenLower.includes('kebinekaan')) {
        materi = 'Keberagaman Budaya dalam Bingkai Bhinneka Tunggal Ika';
      } else if (elemenLower.includes('nkri') || elemenLower.includes('negara kesatuan')) {
        materi = 'Persatuan dan Gotong Royong dalam Menjaga Keutuhan NKRI';
      } else {
        materi = 'Makna dan Nilai Sila-Sila Pancasila dalam Kehidupan Sehari-hari';
      }
    }
  }

  // If subject is Matematika, reject foreign concepts
  if (mapelLower.includes('matematika') || mapelLower.includes('math')) {
    const foreignWords = ['pancasila', 'sila', 'uud 1945', 'bhinneka', 'fotosintesis', 'ekosistem'];
    if (foreignWords.some((w) => materi.toLowerCase().includes(w))) {
      materi = 'Operasi Hitung dan Penalaran Matematika';
    }
  }

  // If subject is IPAS, reject Math/Pancasila contamination
  if (mapelLower.includes('ipas') || mapelLower.includes('alam dan sosial')) {
    const foreignWords = ['pecahan', 'bilangan cacah', 'kpk', 'fpb', 'pancasila', 'sila-sila'];
    if (foreignWords.some((w) => materi.toLowerCase().includes(w))) {
      materi = 'Penyelidikan Ilmiah dan Eksplorasi Lingkungan Hidup';
    }
  }

  if (!kompetensi) {
    kompetensi = 'Memahami dan Menerapkan';
  }

  return {
    coreConcept: materi,
    actionVerb: kompetensi,
    contextSubject: cleanText(mataPelajaran) || 'Mata Pelajaran SD',
    tujuanPembelajaran: cleanText(tp.rumusanTP),
    kodeTP: cleanText(tp.kodeTP) || 'TP',
  };
}

// =============================================================================
// 1. SLIDE PRESENTASI PEMBELAJARAN (5 - 10 SLIDE TERSTRUKTUR, RAMAH ANAK)
// =============================================================================
export function generateSlidePresentationForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat
): MediaPromptSlide {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'slide'] || FORMAT_SPECIFIC_DIRECTIVES.slide;

  // 8 Slides (Memenuhi aturan minimal 5 slide dan maksimal 10 slide)
  const slides: MediaPromptSlideItem[] = [
    {
      slideNumber: 1,
      slideTitle: `Slide 1: Cover Petualangan Belajar`,
      layoutType: 'title',
      headline: `Halo Sahabat Hebat! Selamat Datang di Petualangan ${coreConcept}!`,
      bulletPoints: [
        `Mata Pelajaran: ${mataPelajaran} (${gradeLabel})`,
        `Tujuan Kita: Menjadi detektif cilik yang mampu ${actionVerb.toLowerCase()} ${coreConcept}`,
        `Motto Hari Ini: "Belajar Ceria, Bernalar Kritis, Pasti Bisa!"`,
      ],
      visualIllustrationPrompt: `Cover slide 16:9, colorful playful background with Indonesian flag corner accent, featuring happy 3D Pixar elementary students (Budi and Siti) in Indonesian white-and-red school uniforms waving enthusiastically toward the camera with big friendly smiles, floating 3D study props related to '${coreConcept}'.`,
      teacherInteractionGuide: `Sapa siswa dengan senyuman hangat dan semangat tinggi. Ajak seluruh siswa menyerukan motto bersama-sama: "Belajar Ceria, Bernalar Kritis, Pasti Bisa!"`,
      keyTakeaway: `Membangkitkan antusiasme, rasa percaya diri, dan kesiapan mental belajar siswa.`,
    },
    {
      slideNumber: 2,
      slideTitle: `Slide 2: Apersepsi & Misteri Sehari-hari`,
      layoutType: 'hook',
      headline: `Pernahkah Kamu Mengalami Misteri Ini di Sekitarmu?`,
      bulletPoints: [
        `Bayangkan saat kamu sedang berbelanja, bermain, atau membantu orang tua di rumah.`,
        `Terkadang kita menemukan tantangan nyata seputar ${coreConcept}.`,
        `Tahukah kamu rahasia sederhana untuk memecahkan teka-teki ini?`,
      ],
      visualIllustrationPrompt: `Classroom hook scene, 3D Pixar character looking curious with a cute glowing lightbulb above head, inspecting real-world items and pointing at a playful mystery question mark banner, sunny natural classroom lighting.`,
      teacherInteractionGuide: `Tanyakan kepada siswa: "Siapa di sini yang pernah melihat atau mengalami hal ini saat di rumah atau di sekolah? Coba angkat tangan!" Berikan apresiasi pada siswa yang berani bercerita.`,
      keyTakeaway: `Mengaitkan materi pembelajaran dengan pengalaman nyata anak di kehidupan sehari-hari.`,
    },
    {
      slideNumber: 3,
      slideTitle: `Slide 3: Konsep Inti - Apa Rahasianya?`,
      layoutType: 'concept',
      headline: `Mengenal Rahasia Utama: Apa Itu ${coreConcept}?`,
      bulletPoints: [
        `${coreConcept} adalah cara seru dan teratur untuk memahami bagaimana hal di sekitar kita bekerja.`,
        `Kuncinya sangat mudah: kita cukup mengamati pola dan memahami bagian-bagian pentingnya.`,
        `Ingat kata kuncinya: cermat, teliti, dan jangan takut salah saat mencoba!`,
      ],
      visualIllustrationPrompt: `Clean educational 3D visual diagram, a friendly Indonesian teacher avatar in neat batik standing beside a clear animated concept board displaying simple icons and colorful geometric blocks illustrating '${coreConcept}'.`,
      teacherInteractionGuide: `Jelaskan dengan bahasa tutur yang tenang, perlahan, dan gunakan analogi benda nyata (misal: balok mainan, buah, atau uang koin). Minta 1-2 siswa mengulang kata kunci utamanya.`,
      keyTakeaway: `Memahami definisi materi secara esensial tanpa hafalan yang memberatkan otak anak.`,
    },
    {
      slideNumber: 4,
      slideTitle: `Slide 4: Langkah & Cara Kerja Hebat`,
      layoutType: 'diagram',
      headline: `Tiga Langkah Mudah Menguasai ${coreConcept}`,
      bulletPoints: [
        `Langkah 1: Perhatikan informasi yang diberikan dengan seksama.`,
        `Langkah 2: Terapkan cara ${actionVerb.toLowerCase()} secara bertahap dan rapi.`,
        `Langkah 3: Cek kembali hasilnya dengan senyum puas dan bangga!`,
      ],
      visualIllustrationPrompt: `Three floating colorful 3D step-by-step podium cards labeled 1, 2, 3 with cheerful mascot icons, bright vibrant colors, glowing pathways connecting the steps in a clear progression.`,
      teacherInteractionGuide: `Ajak siswa mempraktikkan gerakan tangan: jari 1 (amati), jari 2 (kerjakan), jari 3 (cek kembali) agar memudahkan memori kinestetik anak.`,
      keyTakeaway: `Membekali siswa dengan alur pikir prosedural yang sistematis dan mudah direplikasi.`,
    },
    {
      slideNumber: 5,
      slideTitle: `Slide 5: Contoh Seru di Sekitar Kita`,
      layoutType: 'example',
      headline: `Ternyata ${coreConcept} Ada di Mana-Mana!`,
      bulletPoints: [
        `Contoh Kasus 1: Saat kita membagi camilan atau bekal bersama sahabat secara adil.`,
        `Contoh Kasus 2: Saat menghitung koleksi buku bacaan atau peralatan tulis di kelas.`,
        `Contoh Kasus 3: Membantu menjaga ketertiban dan keindahan lingkungan sekolah kita.`,
      ],
      visualIllustrationPrompt: `Whimsical 3D diorama of an Indonesian schoolyard and traditional market stall, Indonesian students in red-and-white uniforms collaborating cheerfully, practical props illustrating '${coreConcept}' in daily context.`,
      teacherInteractionGuide: `Tanyakan: "Dari ketiga contoh seru ini, mana yang paling sering kalian jumpai setiap hari?" Dengarkan respon siswa dengan antusias.`,
      keyTakeaway: `Memperkuat kebermaknaan belajar (meaningful learning) bahwa materi ini berguna selamanya.`,
    },
    {
      slideNumber: 6,
      slideTitle: `Slide 6: Ayo Mencoba Bersama! (Kuis Cepat)`,
      layoutType: 'activity',
      headline: `Tantangan Detektif Cilik: Siapa Cepat Dia Hebat!`,
      bulletPoints: [
        `Ada teka-teki mini di papan tulis kelas kita!`,
        `Mari kita selesaikan bersama teman sebangku dengan gotong royong.`,
        `Diskusikan: bagaimana caramu ${actionVerb.toLowerCase()} soal ini dengan tepat?`,
      ],
      visualIllustrationPrompt: `Interactive game show-like 3D classroom frame, two Indonesian student characters smiling and pointing at a bright question card with big bold numbers/letters, cheerful confetti stars floating around.`,
      teacherInteractionGuide: `Beri waktu 2 menit bagi siswa untuk berbisik riang dan berdiskusi dengan teman sebangku. Pilih perwakilan siswa secara acak untuk menjawab dengan nada ceria.`,
      keyTakeaway: `Mengaktifkan partisipasi aktif, kolaborasi teman sebaya, dan verifikasi pemahaman instan.`,
    },
    {
      slideNumber: 7,
      slideTitle: `Slide 7: Refleksi & Karakter Dimensi Profil Lulusan`,
      layoutType: 'reflection',
      headline: `Hebat! Nilai Kebaikan Apa yang Kita Dapatkan Hari Ini?`,
      bulletPoints: [
        `Penalaran Kritis: Kita belajar berpikir runut dan mencari bukti yang benar.`,
        `Kemandirian & Kolaborasi: Kita berani mencoba sendiri dan senang bekerja sama dengan sahabat.`,
        `Pantang Menyerah: Kegagalan saat latihan adalah tangga menuju pemahaman sejati!`,
      ],
      visualIllustrationPrompt: `Heartwarming 3D Pixar composition showing Indonesian boy and girl students holding a shining golden star emblem of Garuda Pancasila, warm ambient sunbeams, inspiring peaceful expression.`,
      teacherInteractionGuide: `Bimbing siswa merenungi karakter yang telah mereka latih: "Anak pintar tidak hanya tahu rumus, tapi juga jujur, santun, dan suka bekerja sama."`,
      keyTakeaway: `Internalisasi Dimensi Profil Lulusan secara kontekstual ke dalam mata pelajaran.`,
    },
    {
      slideNumber: 8,
      slideTitle: `Slide 8: Sorak Keberhasilan & Penutup`,
      layoutType: 'summary',
      headline: `Luar Biasa! Kamu Resmi Menjadi Bintang ${coreConcept}!`,
      bulletPoints: [
        `Tiga Kata Emas: Aku Paham, Aku Bisa, Aku Senang!`,
        `Misi Rumah Sederhana: Ceritakan 1 hal seru hari ini kepada orang tuamu di rumah.`,
        `Sampai jumpa di petualangan belajar berikutnya dengan senyum yang lebih lebar!`,
      ],
      visualIllustrationPrompt: `Celebratory victory scene, Indonesian elementary school students joyfully throwing their red school caps into the air with radiant smiles, golden star fireworks, clean elegant closing slide layout.`,
      teacherInteractionGuide: `Ajak seluruh kelas bertepuk tangan meriah ("Tepuk Hebat") untuk diri mereka sendiri. Tutup presentasi dengan doa dan ucapan salam yang hangat.`,
      keyTakeaway: `Memberikan penutupan yang memuaskan secara emosional dan meninggalkan kesan positif terhadap pelajaran.`,
    },
  ];

  // Full presentation AI prompt for Gamma / Canva Magic Design / PPT AI
  const fullPromptPresentationAI = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

${formatRule.promptInstructionBlock}

PROMPT SPESIFIKASI SLIDE PRESENTASI INTERAKTIF (8 SLIDE LENGKAP - MAKSIMAL 10 SLIDE):
Topik Materi: ${coreConcept}
Mata Pelajaran: ${mataPelajaran} (${gradeLabel})
Kompetensi Sasaran: ${actionVerb}
Total Slide: 8 Slide (Struktur Terstruktur Proporsional Sesuai Batas Maksimal 10 Slide)
Pedoman Format: ${formatRule.badge}
Gaya Visual & Seni: ${styleConfig.lightingPrompt}, ${styleConfig.renderKeywords}
Karakter & Seragam: ${INDONESIAN_SD_UNIFORM_PROMPT}

INSTRUKSI KHUSUS PEMBUATAN SLIDE (GAMMA APP / CANVA / POWERPOINT AI):
1. ATURAN WAJIB MAKSIMAL 10 SLIDE: Total slide dalam satu rangkaian dibatasi maksimal 10 slide (minimal 5 slide).
2. Format slide 16:9 widescreen dengan tata letak bersih, lega, modern, dan tidak padat teks (maksimal 3-4 poin ramah anak per slide).
3. Seluruh teks pada slide WAJIB menggunakan BAHASA INDONESIA yang santun, komunikatif, dan memicu rasa ingin tahu siswa SD.
4. Gunakan tipografi yang mudah dibaca anak (seperti Fredoka, Poppins, atau Plus Jakarta Sans) dengan kontras warna yang nyaman untuk mata.
5. Sertakan ilustrasi 3D animasi khas anak SD Indonesia berseragam merah-putih di setiap slide.
6. Sertakan panduan interaksi guru di setiap slide untuk memudahkan guru memantik diskusi kelas.

RINCIAN LENGKAP PER SLIDE:
${slides
  .map(
    (s) => `--- SLIDE ${s.slideNumber}: ${s.slideTitle} ---
- Judul Slide (Bahasa Indonesia): "${s.headline}"
- Poin Teks Utama (Ramah Anak):
${s.bulletPoints.map((b) => `  * ${b}`).join('\n')}
- Deskripsi Visual & Maskot 3D: ${s.visualIllustrationPrompt}
- Panduan Interaksi Guru: ${s.teacherInteractionGuide}
- Intisari Capaian: ${s.keyTakeaway}`
  )
  .join('\n\n')}
`.trim();

  const pedomanGuruIndo = `Pedoman Pelaksanaan Slide Presentasi di Kelas:
1. Aturan format slide: Rangkaian ini berisi 8 slide (memenuhi aturan wajib maksimal 10 slide & minimal 5 slide) sehingga fokus dan tidak melelahkan siswa.
2. Tayangkan Slide 1-2 di 10 menit pertama sebagai pemantik apersepsi dan membangun suasana kelas yang riang gembira.
3. Saat memasuki Slide 3-4, gunakan benda konkret atau alat peraga sederhana yang ada di sekitar meja guru.
4. Berikan panggung interaksi pada Slide 6; biarkan siswa saling berdiskusi 2-3 menit sebelum menjawab bersama.
5. Manfaatkan Slide 7 untuk menanamkan Dimensi Profil Lulusan (Penalaran Kritis, Kemandirian, Kolaborasi).
6. Akhiri dengan Slide 8 dengan melakukan tepuk semangat bersama seluruh siswa.`;

  return {
    title: `Slide Presentasi Edukatif: Petualangan Menyenangkan ${coreConcept}`,
    presentationTitle: `Slide Presentasi Edukatif: Petualangan Menyenangkan ${coreConcept}`,
    totalSlides: slides.length,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    slides,
    fullPromptPresentationAI,
    pedomanGuruIndo,
    recommendedRatio: '16:9 Widescreen (Cocok untuk Canva, Gamma AI, & Proyektor Kelas)',
    formatDirectiveSummary: formatRule.rules[0] + ' ' + formatRule.description,
  };
}

// =============================================================================
// 2. NOTEBOOK DIGITAL / JURNAL BELAJAR INTERAKTIF (UNTUK NOTEBOOKLM & CATATAN ANAK)
// =============================================================================
export function generateNotebookForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat
): MediaPromptNotebook {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'notebook'] || FORMAT_SPECIFIC_DIRECTIVES.notebook;

  const notebookSections: MediaPromptNotebookSection[] = [
    {
      sectionNumber: 1,
      sectionTitle: `1. Zona Detektif Cilik: Pertanyaan Misteri Hari Ini`,
      contentType: 'hook',
      guidedQuestionsOrPrompts: [
        `Apa teka-teki terbesar yang ingin kamu pecahkan tentang ${coreConcept}?`,
        `Tuliskan 1 hal yang sudah kamu ketahui dan 1 hal baru yang paling membuatmu penasaran!`,
      ],
      summaryDoodleNote: `Kotak Catatan: "Detektif hebat selalu mengamati dengan teliti sebelum menarik kesimpulan!"`,
      interactiveActivity: `Gambarlah sebuah kaca pembesar ajaib di sudut bukumu dan tuliskan kata kunci '${coreConcept}' di dalamnya!`,
    },
    {
      sectionNumber: 2,
      sectionTitle: `2. Peta Konsep Ramah Anak (Doodle Notes)`,
      contentType: 'mindmap',
      guidedQuestionsOrPrompts: [
        `Bagaimana cara termudah mengingat cara kerja ${coreConcept}?`,
        `Hubungkan konsep ini dengan 3 benda yang sering kamu jumpai di sekolah atau rumah.`,
      ],
      summaryDoodleNote: `Peta Alur: [Mulai dengan Mengamati] ➔ [Gunakan Cara ${actionVerb}] ➔ [Temukan Jawaban Tepat]`,
      interactiveActivity: `Buatlah diagram panah warna-warni di halaman catatanmu dengan 3 warna berbeda untuk tiap langkah.`,
    },
    {
      sectionNumber: 3,
      sectionTitle: `3. Kotak Ajaib: "Tahukah Kamu?"`,
      contentType: 'did_you_know',
      guidedQuestionsOrPrompts: [
        `Fakta Unik: Materi ${coreConcept} ternyata digunakan oleh para insinyur, pedagang, dan penjelajah di seluruh dunia!`,
        `Mengapa orang-orang hebat membutuhkan keahlian ini dalam pekerjaannya?`,
      ],
      summaryDoodleNote: `Fakta Keren: Belajar materi ini melatih otak kita menjadi lebih cepat menemukan solusi cerdas.`,
      interactiveActivity: `Tuliskan satu cita-citamu (dokter, pilot, guru, dll.) dan jelaskan bagaimana materi ini akan membantumu kelak!`,
    },
    {
      sectionNumber: 4,
      sectionTitle: `4. Lembar Misi & Teka-Teki Cilik`,
      contentType: 'mini_challenge',
      guidedQuestionsOrPrompts: [
        `Tantangan Level 1: Terapkan langkah dasar ${actionVerb.toLowerCase()} pada contoh soal sederhana.`,
        `Tantangan Level 2: Coba jelaskan kembali caramu kepada teman di sebelahmu dengan caramu sendiri.`,
      ],
      summaryDoodleNote: `Kunci Sukses: Tidak apa-apa jika salah pada percobaan pertama, terus perbaiki dan coba lagi!`,
      interactiveActivity: `Kotak Tantangan: Tuliskan jawabanmu dengan tulisan terindahmu dan beri bingkai bintang di sekelilingnya!`,
    },
    {
      sectionNumber: 5,
      sectionTitle: `5. Pojok Refleksi & Bintang Capaianku`,
      contentType: 'reflection',
      guidedQuestionsOrPrompts: [
        `Seberapa paham kamu dengan materi hari ini? (Beri warna 1 sampai 5 bintang kejora!)`,
        `Kalimat Refleksiku: "Hal paling membahagiakan saat belajar ${coreConcept} hari ini adalah..."`,
      ],
      summaryDoodleNote: `Catatan Hati: "Setiap langkah kecil belajarku adalah kemajuan besar untuk masa depanku."`,
      interactiveActivity: `Warnai 5 bintang prestasimu dan tuliskan ucapan terima kasih untuk dirimu sendiri yang sudah berjuang hari ini!`,
    },
  ];

  const fullPromptNotebookAI = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

${formatRule.promptInstructionBlock}

PROMPT SUMBER DIGITAL INTERAKTIF / BUKU CATATAN SISWA (NOTEBOOKLM / GOOGLE DOCS):
Topik Materi: ${coreConcept}
Mata Pelajaran: ${mataPelajaran} (${gradeLabel})
Gaya Format: Jurnal Belajar Interaktif Siswa SD (Interactive Student Notebook Companion)
Pedoman Format: ${formatRule.badge}
Bahasa: 100% Bahasa Indonesia Ramah Anak & Menggugah Semangat
Estetika Visual: ${styleConfig.label} (${styleConfig.renderKeywords})

INSTRUKSI UNTUK NOTEBOOKLM ATAU GENERATOR WORKSHEET:
1. Buat dokumen materi pendamping belajar berbentuk lembar catatan terpandu (guided note-taking journal) untuk siswa ${gradeLabel}.
2. Susun materi ke dalam 5 bagian terstruktur: Zona Detektif, Peta Konsep Doodle, Kotak Tahukah Kamu, Misi Teka-Teki, dan Pojok Refleksi.
3. Seluruh instruksi harus interaktif, mengajak anak menuliskan ide, menggambar doodle sederhana, dan merefleksikan proses berpikirnya.

BAGIAN-BAGIAN NOTEBOOK SISWA:
${notebookSections
  .map(
    (ns) => `--- SEKSI ${ns.sectionNumber}: ${ns.sectionTitle} ---
* Pertanyaan Panduan:
${ns.guidedQuestionsOrPrompts.map((q) => `  - ${q}`).join('\n')}
* Inti Catatan Rangkuman: ${ns.summaryDoodleNote}
* Aktivitas Praktik Murid: ${ns.interactiveActivity}`
  )
  .join('\n\n')}
`.trim();

  const pedomanGuruIndo = `Pedoman Pemanfaatan Notebook Belajar di Kelas:
1. Format saku & jurnal belajar: Menggunakan format modular 5 seksi catatan visual (doodle notes) yang dirancang ramah anak dan kompatibel dengan Google NotebookLM.
2. Bagikan atau proyeksikan panduan notebook ini agar siswa dapat mencatat secara bermakna di buku catatan/buku tugas mereka.
3. Izinkan siswa menghias catatan dengan pensil warna atau krayon pada bagian Peta Konsep dan Zona Kreatif.
4. Gunakan data Notebook ini sebagai sumber dokumen bagi guru di aplikasi NotebookLM untuk menghasilkan kuis audio atau ringkasan diskusi kelas.
5. Cek Pojok Refleksi sebagai asesmen formatif harian untuk melihat tingkat pemahaman masing-masing siswa.`;

  return {
    title: `Buku Catatan & Jurnal Interaktif: Detektif Cilik ${coreConcept}`,
    notebookTitle: `Buku Catatan & Jurnal Interaktif: Detektif Cilik ${coreConcept}`,
    subtitle: `Panduan Catatan Belajar Kreatif & Lembar Refleksi Bermakna untuk ${gradeLabel}`,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    notebookSections,
    fullPromptNotebookAI,
    pedomanGuruIndo,
    recommendedFormat: 'A4 / Binder Notebook Digital & Sumber NotebookLM',
    formatDirectiveSummary: formatRule.rules[0] + ' ' + formatRule.description,
  };
}

// =============================================================================
// 3. FLASHCARD PINTAR (KARTU TANYA JAWAB & MISI BERGAMBAR BOLAK-BALIK)
// =============================================================================
export function generateFlashcardForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat
): MediaPromptFlashcard {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'flashcard'] || FORMAT_SPECIFIC_DIRECTIVES.flashcard;

  const cards: MediaPromptFlashcardCard[] = [
    {
      cardNumber: 1,
      category: 'Tebak Konsep',
      frontSide: {
        title: `Kartu 1: Apa Sebenarnya ${coreConcept}?`,
        questionOrChallenge: `Jika kamu diminta menjelaskan '${coreConcept}' kepada adik kelasmu, kata apa yang paling tepat untuk menggambarkannya?`,
        visualCue: `3D Pixar character smiling with a curious expression, holding a soft pastel question mark card in an Indonesian classroom setting.`,
        hint: `Pikirkan hal utama yang kita lakukan saat mempelajari materi ini!`,
      },
      backSide: {
        answer: `${coreConcept} adalah cara kita untuk ${actionVerb.toLowerCase()} sesuatu secara runtut dan teliti agar hasilnya benar!`,
        simpleExplanation: `Dengan memahami dasarnya, kita tidak perlu bingung karena setiap bagian memiliki pola dan keteraturan yang terbukti logis.`,
        funFactOrMotto: `★ Kata Kunci Keren: "Pahami polanya, kuasai ilmunya!"`,
      },
    },
    {
      cardNumber: 2,
      category: 'Kenali Ciri & Rahasia',
      frontSide: {
        title: `Kartu 2: Temukan Ciri Pentingnya!`,
        questionOrChallenge: `Apa tanda atau ciri utama yang membedakan ${coreConcept} dari konsep lainnya?`,
        visualCue: `Close-up shot of a cheerful Indonesian student examining colorful floating 3D geometric shapes or icons with a magnifying glass.`,
        hint: `Perhatikan aturan atau urutan langkahnya!`,
      },
      backSide: {
        answer: `Ciri utamanya adalah adanya langkah-langkah yang berurutan dan hasil akhir yang pasti dan logis jika dikerjakan dengan cermat.`,
        simpleExplanation: `Jika kita melewatkan satu langkah awal, hasil akhirnya bisa berbeda. Jadi ketelitian adalah kunci utamanya.`,
        funFactOrMotto: `★ Tips Cerdik: "Teliti di awal, tenang di akhir!"`,
      },
    },
    {
      cardNumber: 3,
      category: 'Kasus Nyata',
      frontSide: {
        title: `Kartu 3: Teka-Teki di Sekitar Kita`,
        questionOrChallenge: `Kapan waktu terbaik kita menerapkan keahlian ${actionVerb.toLowerCase()} ${coreConcept} di rumah atau sekolah?`,
        visualCue: `3D miniature diorama of an Indonesian school playground and classroom shop, lively joyful atmosphere, warm sunlight.`,
        hint: `Pikirkan saat kamu berbagi dengan teman atau membereskan sesuatu!`,
      },
      backSide: {
        answer: `Saat kita sedang berbagi benda, menghitung kebutuhan kelompok, atau mengatur jadwal kegiatan agar semuanya rapi dan adil!`,
        simpleExplanation: `Materi pelajaran ini bukan cuma ada di buku tulis, tapi teman setia kita dalam menyelesaikan masalah sehari-hari.`,
        funFactOrMotto: `★ Rahasia Nyata: "Belajar di sekolah untuk digunakan di kehidupan nyata!"`,
      },
    },
    {
      cardNumber: 4,
      category: 'Trik Cepat',
      frontSide: {
        title: `Kartu 4: Jembatan Ingatan Ajaib`,
        questionOrChallenge: `Bagaimana trik cepat agar kita tidak mudah lupa saat mengerjakan tugas ${coreConcept}?`,
        visualCue: `3D Pixar character with glowing lightbulb idea above head, smiling brightly and giving a thumbs-up.`,
        hint: `Gunakan singkatan atau jembatan keledai yang mudah diingat!`,
      },
      backSide: {
        answer: `Gunakan rumus 3-T: Tahu apa yang ditanya, Tentukan cara kerjanya, Teliti kembali jawabannya!`,
        simpleExplanation: `Dengan 3 langkah singkat ini, pikiran kita akan terbiasa bekerja secara teratur tanpa rasa panik.`,
        funFactOrMotto: `★ Jembatan Emas: "3-T: Tahu, Tentukan, Teliti!"`,
      },
    },
    {
      cardNumber: 5,
      category: 'Tantangan Kritis',
      frontSide: {
        title: `Kartu 5: Uji Kehebatan Bernalar`,
        questionOrChallenge: `Jika Budi dan Siti mendapatkan hasil yang berbeda saat menyelesaikan soal ${coreConcept}, apa yang harus mereka lakukan?`,
        visualCue: `Two Indonesian elementary students in red-and-white uniforms looking at a paper together with friendly collaborative smiles.`,
        hint: `Ingat Dimensi Profil Lulusan: Penalaran Kritis dan Kolaborasi!`,
      },
      backSide: {
        answer: `Mereka harus saling berdiskusi santun, memeriksa langkah pengerjaan bersama-sama, dan mencari di mana letak perbedaannya tanpa bermusuhan!`,
        simpleExplanation: `Perbedaan pendapat adalah kesempatan emas untuk saling belajar dan membuktikan cara yang paling tepat.`,
        funFactOrMotto: `★ Sikap Juara: "Beda pendapat bukan masalah, mari cari bukti bersama!"`,
      },
    },
    {
      cardNumber: 6,
      category: 'Tantangan Kritis',
      frontSide: {
        title: `Kartu 6: Misi Bintang Kejora`,
        questionOrChallenge: `Bisakah kamu membuat 1 contoh soal atau tebakan baru tentang ${coreConcept} untuk ditanyakan pada teman sebangkumu?`,
        visualCue: `Cheering Indonesian students doing a high-five under confetti and sparkling golden stars in an Indonesian elementary school.`,
        hint: `Gunakan nama temanmu dan benda-benda kesukaanmu dalam soal!`,
      },
      backSide: {
        answer: `Tentu saja bisa! Murid yang benar-benar paham materi adalah murid yang sudah bisa membuat teka-teki baru untuk menguji temannya!`,
        simpleExplanation: `Membuat soal melatih kreativitas otak tingkat tinggi dan membuat suasana belajar di kelas jadi sangat menyenangkan.`,
        funFactOrMotto: `★ Gelar Hebat: "Kamu resmi menjadi Master ${coreConcept}!"`,
      },
    },
  ];

  const fullPromptFlashcardAI = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

${formatRule.promptInstructionBlock}

PROMPT PEMBUAT FLASHCARD PINTAR BOLAK-BALIK (CANVA / QUIZLET / ANKI / IMAGE GENERATOR):
Topik Materi: ${coreConcept}
Mata Pelajaran: ${mataPelajaran} (${gradeLabel})
Fokus Utama: Penguasaan Terminologi Esensial, Konsep Kunci, & Memori Cepat
Pedoman Format: ${formatRule.badge}
Format: 6 Kartu Edukatif Bolak-Balik (Sisi Depan: Tantangan Terminologi/Pertanyaan, Sisi Belakang: Definisi & Kunci Jawaban Ramah Anak)
Gaya Visual: ${styleConfig.lightingPrompt}, ${styleConfig.renderKeywords}
Karakter: ${INDONESIAN_SD_UNIFORM_PROMPT}

INSTRUKSI KHUSUS PEMBUATAN FLASHCARD (FOKUS TERMINOLOGI & KONSEP):
1. FOKUS TERMINOLOGI: Setiap kartu ditujukan untuk menguji pemahaman definisi kunci materi pembelajaran.
2. Sisi depan (Front Side) berisi judul kartu, pertanyaan/tantangan terminologi ramah anak, ilustrasi visual 3D, dan petunjuk mini (hint).
3. Sisi belakang (Back Side) berisi jawaban tepat dan ringkas, penjelasan sederhana logis, serta slogan emas atau jembatan keledai (trik cepat).
4. Seluruh teks WAJIB menggunakan Bahasa Indonesia yang ramah anak, ceria, dan membangun rasa percaya diri.

DETAIL 6 KARTU BOLAK-BALIK:
${cards
  .map(
    (c) => `=== KARTU ${c.cardNumber}: [${c.category}] - ${c.frontSide.title} ===
[SISI DEPAN / FRONT SIDE]
* Pertanyaan/Tantangan: "${c.frontSide.questionOrChallenge}"
* Ilustrasi Kartu 3D: ${c.frontSide.visualCue}
* Petunjuk Kecil (Hint): "${c.frontSide.hint}"

[SISI BELAKANG / BACK SIDE]
* Jawaban Tepat: "${c.backSide.answer}"
* Penjelasan Ramah Anak: "${c.backSide.simpleExplanation}"
* Fakta/Slogan Emas: "${c.backSide.funFactOrMotto}"`
  )
  .join('\n\n')}
`.trim();

  const pedomanGuruIndo = `Pedoman Pemanfaatan Flashcard Pintar di Kelas:
1. Fokus Terminologi & Konsep: Kartu ini mengasah penguasaan istilah kunci materi ${coreConcept} dengan jembatan keledai dan analogi sederhana.
2. Cetak bolak-balik pada kertas tebal (kertas foto / art paper) dan laminating agar awet digunakan berulang kali.
3. Mainkan "Kuis Tebak Cepat": Guru atau ketua kelompok membacakan Sisi Depan, dan murid berlomba menjawab Sisi Belakang.
4. Gunakan Kartu 5 dan 6 sebagai kegiatan pengayaan (enrichment) bagi siswa yang menyelesaikan tugas lebih awal.
5. Jadikan flashcard ini sebagai kartu pos literasi matematika/sains yang bisa dipinjam siswa ke rumah.`;

  return {
    title: `Flashcard Pintar: Kartu Tantangan ${coreConcept}`,
    deckTitle: `Flashcard Pintar: Kartu Tantangan ${coreConcept}`,
    totalCards: cards.length,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    cards,
    fullPromptFlashcardAI,
    pedomanGuruIndo,
    recommendedSize: 'Ukuran Kartu 3:2 (Standar Flashcard Canva & Cetak A6)',
    formatDirectiveSummary: formatRule.rules[0] + ' ' + formatRule.description,
  };
}

// =============================================================================
// 4. INFOGRAFIS EDUKATIF 1 HALAMAN
// =============================================================================
export function generateInfographicForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat
): MediaPromptInfographic {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1-2' : fase === 'Fase C' ? '5-6' : '3-4')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'infografis'] || FORMAT_SPECIFIC_DIRECTIVES.infografis;

  const sections = [
    {
      sectionNumber: 1,
      heading: `1. Apa Itu ${coreConcept}? (Konsep Inti)`,
      iconOrVisualElement: `Ikon 3D Pixar berkilau berbentuk buku pintar atau kaca pembesar ajaib bercahaya lembut.`,
      keyPoints: [
        `Pengertian sederhana dan kontekstual yang mudah diresapi anak usia ${gradeLabel}.`,
        `Fungsi utama materi '${coreConcept}' dalam menyelesaikan permasalahan di sekitar kita.`,
        `Kompetensi kunci: Peserta didik mampu ${actionVerb.toLowerCase()} secara mandiri dan percaya diri.`,
      ],
      didYouKnowOrCallout: `Tahukah Kamu? Konsep ini pertama kali dipelajari agar kita bisa berpikir teratur dan teliti!`,
    },
    {
      sectionNumber: 2,
      heading: `2. Ciri-Ciri & Bagian Penting (Struktur & Karakteristik)`,
      iconOrVisualElement: `Diagram 3D terapung dengan label kartu bernomor 1, 2, dan 3 yang saling terhubung garis cahaya pastel.`,
      keyPoints: [
        `Komponen pertama: Fondasi dasar dan elemen pembentuk konsep.`,
        `Komponen kedua: Keterkaitan antar-bagian yang saling mendukung.`,
        `Komponen ketiga: Aturan baku atau rumus praktis yang mudah diingat dengan jembatan keledai.`,
      ],
      didYouKnowOrCallout: `Tips Praktis: Perhatikan selalu kata kunci utama sebelum menarik kesimpulan!`,
    },
    {
      sectionNumber: 3,
      heading: `3. Contoh Nyata Sehari-hari (Kontekstual di Indonesia)`,
      iconOrVisualElement: `Ilustrasi 3D mini diorama suasana lingkungan rumah, pasar tradisional, atau kebun sekolah tropis Indonesia.`,
      keyPoints: [
        `Penerapan nyata saat bergotong royong di lingkungan sekolah maupun keluarga.`,
        `Contoh studi kasus sederhana dengan visual sebelum dan sesudah (before & after).`,
        `Bagaimana materi ini membantu kita mengambil keputusan yang tepat setiap hari.`,
      ],
      didYouKnowOrCallout: `Di Indonesia, kita sering menerapkan ini tanpa sadar saat bermain dan belajar bersama teman!`,
    },
    {
      sectionNumber: 4,
      heading: `4. Langkah Cerdas Menyelesaikan Tugas (Step-by-Step Action)`,
      iconOrVisualElement: `Tangga keberhasilan 3D Pixar dengan karakter anak SD Indonesia menaiki anak tangga sambil tersenyum bangga.`,
      keyPoints: [
        `Langkah 1: Baca dan cermati informasi dengan teliti.`,
        `Langkah 2: Terapkan kaidah '${actionVerb}' langkah demi langkah.`,
        `Langkah 3: Periksa kembali hasil kerja untuk memastikan ketepatan.`,
      ],
      didYouKnowOrCallout: `Ingat: Ketelitian adalah kunci utama anak hebat Kurikulum Merdeka!`,
    },
  ];

  const fullEnglishPrompt = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

${formatRule.promptInstructionBlock}

A masterfully designed 1-page educational infographic poster for elementary school children, created in ${styleConfig.lightingPrompt}.
FORMAT SPECIFICATION: ${formatRule.badge}

MANDATORY BAHASA INDONESIA INFOGRAPHIC TITLE BANNER:
"PINTAR & CERDAS: MEMAHAMI ${coreConcept.toUpperCase()}"
SUBTITLE: "Panduan Visual Lengkap & Menyenangkan untuk Siswa ${gradeLabel}"

VISUAL STYLE & COMPOSITION:
- Style: ${styleConfig.renderKeywords}.
- Layout: A clean, highly organized 1-page portrait educational poster (aspect ratio 3:4 or 4:5) with balanced negative space, modern card-based floating info blocks, and delightful 3D Pixar diorama elements.
- Color Palette: Educational warm royal blue, sunlight yellow accents, soft cream background, fresh emerald green markers, and crisp bold typography badges.

CENTRAL HERO ILLUSTRATION:
At the upper-center of the poster sits a captivating 3D Pixar scene:
${INDONESIAN_SD_UNIFORM_PROMPT}
A joyful Indonesian boy and girl in red-and-white school uniforms are interacting happily with a large, glowing, translucent 3D infographic hologram illustrating '${coreConcept}'. The hologram features floating gears, numbers, nature elements, and golden light particles that represent knowledge.

STRUCTURED 4-SECTION INFOGRAPHIC CONTENT (ALL TEXT MUST BE IN BAHASA INDONESIA):
1. SECTION 1 (TOP LEFT): Heading "1. Apa Itu ${coreConcept}?". Inside a soft rounded floating 3D container, a sparkling 3D magnifying glass icon accompanied by simple bullet points explaining the core meaning in clear Indonesian terminology. Includes a cute ribbon badge: "Tahukah Kamu?"
2. SECTION 2 (TOP RIGHT): Heading "2. Ciri & Bagian Penting". Illustrated with a clear 3D flow diagram with numbered circular badges (1, 2, 3) connecting essential components of ${coreConcept}.
3. SECTION 3 (BOTTOM LEFT): Heading "3. Contoh Nyata di Indonesia". A charming miniature 3D diorama of an Indonesian schoolyard demonstrating practical everyday examples of this topic in action.
4. SECTION 4 (BOTTOM RIGHT): Heading "4. Langkah Cerdas Menyelesaikan Tugas". A whimsical 3D three-step staircase leading to a gleaming golden star trophy, showing children the 3 clear Indonesian steps to master this objective. Badge: "Tips Praktis".

FOOTER & VALUES BANNER (IN BAHASA INDONESIA):
At the bottom, a sleek badge displaying: "Dimensi Profil Lulusan: Penalaran Kritis • Kemandirian • Kolaborasi | Kurikulum Merdeka" with miniature 3D mascot stickers.

TECHNICAL ATTRIBUTES & STRICT TEXT ENFORCEMENT:
Extremely crisp vector-like text containers, ultra-detailed textures, volumetric soft shadows, 8k resolution, highly legible infographic hierarchy.
CRITICAL LANGUAGE MANDATE: All visible in-image text, headings, numbers, and diagram labels MUST be in BAHASA INDONESIA. ENGLISH OR FOREIGN WORDS ARE STRICTLY PROHIBITED ON THIS POSTER.
NEGATIVE PROMPT: english text on poster, foreign language words, latin text, untranslated english headings, gibberish typography, watermark, blurry letters.`;

  const pedomanGuruIndo = `Pedoman Pemanfaatan Infografis di Kelas:
1. Format poster 1 halaman utuh: Dirancang dengan 4 kuadran visual seimbang dan rasio 3:4/2:3 agar mudah dipajang atau dicetak utuh tanpa terpotong.
2. Pasang infografis ini di papan pajangan kelas atau bagikan versi cetak/digital kepada siswa sebagai bahan ajar rangkuman visual.
3. Gunakan diagram 4 seksi untuk memandu siswa membuat peta konsep (mind mapping) mandiri di buku catatan.
4. Hubungkan Seksi 3 (Contoh Nyata) dengan pengalaman langsung murid di sekolah atau lingkungan rumah mereka.
5. Tinjau kembali Seksi 4 sebelum asesmen formatif untuk merefleksikan ketuntasan belajar siswa.`;

  return {
    title: `Infografis Edukatif: Eksplorasi Visual ${coreConcept}`,
    subtitle: `Panduan Visual 1 Halaman Lengkap, Interaktif, dan Menyenangkan untuk Siswa ${gradeLabel}`,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    centralIllustrationPrompt: `A 3D Pixar-style glowing hologram representing '${coreConcept}' surrounded by cheerful Indonesian elementary school students in red-and-white uniforms.`,
    sections,
    layoutGuide: `Layout poster 1 halaman vertikal (portrait 3:4 atau 2:3) dengan 4 kuadran kotak informasi bertekstur 3D melayang di atas latar belakang pastel bersih.`,
    colorPalette: `Royal Navy Blue (#1E3A8A), Warm Amber (#F59E0B), Emerald Green (#10B981), Pure White (#FFFFFF), Soft Slate (#F8FAFC).`,
    fullEnglishPrompt,
    pedomanGuruIndo,
    recommendedAspectRatio: '3:4 (Poster Vertikal Edukasi)',
    formatDirectiveSummary: formatRule.rules[0] + ' ' + formatRule.description,
  };
}

// =============================================================================
// 5. KOMIK PEMBELAJARAN (Preserved for compatibility)
// =============================================================================
export function generateComicForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar'
): MediaPromptComic {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];

  const studentNameBoy = 'Budi';
  const studentNameGirl = 'Siti';
  const teacherName = 'Pak Guru Roni';

  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;

  const panels = [
    {
      panelNumber: 1,
      title: 'Tantangan Sehari-hari (The Everyday Mystery)',
      setting: `Di dalam ruang kelas SD Indonesia yang cerah dan rapi dengan meja kayu berderet, poster peta Indonesia, dan jendela dengan pemandangan pohon hijau.`,
      characters: `${studentNameBoy} dan ${studentNameGirl} berseragam putih-merah SD lengkap dengan dasi merah.`,
      action: `${studentNameBoy} memegang pensil di pelipisnya dengan wajah berpikir penasaran sambil menunjuk buku pelajarannya yang memuat tema '${coreConcept}'. ${studentNameGirl} melihat dengan mata berbinar penasaran.`,
      dialogue: `${studentNameBoy}: "Wah, bagaimana ya cara kita ${actionVerb.toLowerCase()} ${coreConcept} ini dengan mudah?" | ${studentNameGirl}: "Ayo kita cari tahu rahasianya bersama-sama!"`,
      visualCue: `Medium wide shot, eye level, colorful Indonesian classroom environment, warm natural lighting from classroom window.`,
    },
    {
      panelNumber: 2,
      title: 'Eksplorasi Objek & Diskusi Seru (Hands-on Exploration)',
      setting: `Meja belajar kelompok siswa dengan model peraga konkret dan kartu warna-warni bertuliskan langkah-langkah '${coreConcept}'.`,
      characters: `${studentNameBoy} dan ${studentNameGirl} sedang berinteraksi aktif dengan benda manipulatif atau diagram visual.`,
      action: `${studentNameGirl} dengan antusias menyusun kartu konsep dan menunjukkan pola menarik kepada ${studentNameBoy}. Wajah ${studentNameBoy} mulai tersenyum ceria saat menemukan petunjuk penting.`,
      dialogue: `${studentNameGirl}: "Lihat ${studentNameBoy}! Ternyata setiap bagian dari ${coreConcept} memiliki pola dan aturan yang sangat teratur!" | ${studentNameBoy}: "Oh, jadi langkah awalnya harus dimulai dari sini!"`,
      visualCue: `Close-up on hands and enthusiastic faces, dynamic angle, vibrant 3D elements on the wooden desk, cheerful glowing expressions.`,
    },
    {
      panelNumber: 3,
      title: 'Bimbingan Guru & "Aha! Moment" (Teacher Mentorship)',
      setting: `Depan papan tulis kelas dengan diagram alur berwarna cerah dan tulisan kapur rapi.`,
      characters: `${teacherName} (guru pria Indonesia ramah berseragam batik resmi, berkacamata dan tersenyum kebapakan) mendampingi ${studentNameBoy} dan ${studentNameGirl}.`,
      action: `${teacherName} menepuk pundak siswa dengan hangat sambil menunjuk ilustrasi visual '${coreConcept}' di papan tulis. ${studentNameBoy} dan ${studentNameGirl} tersenyum lebar dengan bola lampu imajinasi bersinar di atas kepala (momen paham).`,
      dialogue: `${teacherName}: "Hebat sekali kalian! Kuncinya adalah ${actionVerb.toLowerCase()} dengan teliti langkah demi langkah!" | ${studentNameBoy} & ${studentNameGirl}: "Aha! Sekarang kami benar-benar paham cara kerjanya, Pak Guru!"`,
      visualCue: `Medium shot, warm golden rim lighting, fatherly inspiring teacher figure, joyful expressive students in white-and-red uniforms.`,
    },
    {
      panelNumber: 4,
      title: 'Praktik Nyata & Kolaborasi Berhasil (Active Practice & Success)',
      setting: `Sudut ruang kelas atau halaman sekolah yang asri dengan tiang bendera Merah Putih di latar belakang.`,
      characters: `${studentNameBoy} dan ${studentNameGirl} memegang lembar karya mereka yang terselesaikan sempurna.`,
      action: `Keduanya melakukan high-five (tos tangan) penuh semangat dengan lembar tugas bertuliskan nilai bintang emas dan catatan kerja rapi tentang '${coreConcept}'.`,
      dialogue: `${studentNameBoy}: "Ternyata belajar ${coreConcept} sangat menyenangkan dan bermanfaat untuk kehidupan kita!" | ${studentNameGirl}: "Benar, kita berhasil menyelesaikannya bersama!"`,
      visualCue: `Dynamic action angle, floating celebratory confetti and gold star effects, joyful high-five motion blur, vivid Indonesian school background.`,
    },
    {
      panelNumber: 5,
      title: 'Kesimpulan & Refleksi Karakter (Joyful Takeaway & Core Value)',
      setting: `Gerbang sekolah atau taman literasi sekolah yang asri dengan dedaunan hijau tropis dan sinar matahari sore yang hangat.`,
      characters: `${studentNameBoy} dan ${studentNameGirl} tersenyum bangga menghadap ke arah pembaca, memegang poster mini bertuliskan '${tp.kodeTP}: ${coreConcept}'.`,
      action: `Keduanya mengacungkan jempol ke arah penonton dengan senyum tulus ramah, menunjukkan bahwa setiap anak Indonesia pasti bisa menguasai materi ini dengan rajin mencoba dan bernalar kritis.`,
      dialogue: `Narasi Komik: "Kini aku mampu ${actionVerb.toLowerCase()} ${coreConcept}! Mari terus giat belajar, bernalar kritis, dan pantang menyerah!"`,
      visualCue: `Symmetrical hero wide shot, cinematic warm twilight sunbeams, smiling proud Indonesian elementary students, beautiful Pixar character render.`,
    },
  ];

  const fullEnglishPrompt = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

A stunning 5-panel educational comic strip layout arranged in a clean vertical and horizontal storytelling sequence, designed in ${styleConfig.lightingPrompt}.

COMIC TITLE (MANDATORY BAHASA INDONESIA):
"PETUALANGAN BELAJAR: MENGUASAI ${coreConcept.toUpperCase()}"
TARGET AUDIENCE: Elementary School Grade ${kelas || '3-4'} Students (SD Indonesia).
VISUAL STYLE & RENDERING: ${styleConfig.renderKeywords}. 
COLOR PALETTE: Warm golden amber, royal navy blue, vivid school red, fresh grass green, and crisp paper white.

CHARACTERS & ATTIRE:
${INDONESIAN_SD_UNIFORM_PROMPT}

PANEL-BY-PANEL STORYLINE WITH STRICT BAHASA INDONESIA DIALOGUES:
${panels.map((p) => `- PANEL ${p.panelNumber}: [${p.title}] ${p.action}\n  * SPEECH BUBBLE: "${p.dialogue}"`).join('\n\n')}
`.trim();

  const pedomanGuruIndo = `Pedoman Pemanfaatan Komik di Kelas:
1. Tayangkan atau cetak komik 5 panel ini sebagai apersepsi di awal pembelajaran untuk memantik rasa ingin tahu murid.
2. Ajak siswa membaca dialog bergantian untuk melatih kelancaran membaca dan pemahaman konsep '${coreConcept}'.
3. Gunakan Panel 5 sebagai penguatan Dimensi Profil Lulusan (Penalaran Kritis, Kemandirian, dan Kolaborasi).`;

  return {
    title: `Komik Edukasi 5 Panel: Petualangan Menguasai ${coreConcept}`,
    synopsis: `Kisah inspiratif Budi dan Siti dalam memecahkan tantangan materi ${coreConcept} di kelas SD Indonesia hingga meraih pemahaman bermakna melalui bimbingan guru dan gotong royong.`,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    characterDesignGuide: INDONESIAN_SD_UNIFORM_PROMPT,
    panels,
    fullEnglishPrompt,
    pedomanGuruIndo,
    recommendedAspectRatio: '16:9 / Multi-panel Comic Grid',
  };
}

// =============================================================================
// 6. PETA KONSEP & PETA PIKIRAN (MIND MAP EDUKATIF RAMAH ANAK SD)
// =============================================================================
export function generateMindMapForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat
): MediaPromptMindMap {
  const { coreConcept, actionVerb } = extractConceptFromTP(tp, mataPelajaran);
  const styleConfig = VISUAL_STYLES[style];
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'petakonsep'] || FORMAT_SPECIFIC_DIRECTIVES.petakonsep;

  // 5 Cabang Utama Berkode Warna & Ramah Anak
  const branches: MindMapBranch[] = [
    {
      branchNumber: 1,
      branchName: `1. Definisi & Konsep Kunci`,
      branchColor: '#2563EB', // Blue
      connectingPhrase: 'didefinisikan sebagai',
      subBranches: [
        `Arti sederhana & mudah dipahami anak usia ${gradeLabel}`,
        `Kata kunci utama: Memahami makna dasar secara tepat`,
        `Karakteristik penting yang mudah dikenali dalam kehidupan`,
      ],
      visualDoodle: `Ikon bola lampu kristal bersinar 3D dengan senyuman ceria`,
      miniChallenge: `Bisakah kamu menyebutkan kembali arti ${coreConcept} dengan bahasamu sendiri?`,
    },
    {
      branchNumber: 2,
      branchName: `2. Bagian & Ciri Penting`,
      branchColor: '#059669', // Emerald Green
      connectingPhrase: 'terdiri atas unsur',
      subBranches: [
        `Komponen utama penyusun materi ${coreConcept}`,
        `Ciri-ciri khas yang membedakan dengan materi lain`,
        `Hubungan antarelemen yang saling berurutan dan melengkapi`,
      ],
      visualDoodle: `Ikon balok puzzle 3D beraneka warna yang terpasang rapi`,
      miniChallenge: `Sebutkan 2 ciri atau bagian yang paling mudah kamu temukan!`,
    },
    {
      branchNumber: 3,
      branchName: `3. Contoh Nyata di Sekitarmu`,
      branchColor: '#D97706', // Amber
      connectingPhrase: 'dapat ditemukan pada',
      subBranches: [
        `Contoh konkret di lingkungan rumah dan sekolah Indonesia`,
        `Peristiwa nyata saat bermain atau beraktivitas bersama teman`,
        `Manfaat langsung dalam kehidupan sehari-hari anak SD`,
      ],
      visualDoodle: `Ikon tas sekolah merah-putih 3D & rumah panggung ceria`,
      miniChallenge: `Temukan 1 contoh nyata di dalam kelasmu sekarang juga!`,
    },
    {
      branchNumber: 4,
      branchName: `4. Langkah & Cara Praktik`,
      branchColor: '#7C3AED', // Purple
      connectingPhrase: 'diterapkan melalui langkah',
      subBranches: [
        `Langkah 1: Mengamati tanda-tanda kunci dengan teliti`,
        `Langkah 2: Melakukan proses kerja atau perhitungan terarah`,
        `Langkah 3: Mengecek kembali hasil & menarik kesimpulan`,
      ],
      visualDoodle: `Ikon kaca pembesar detektif cilik 3D & pensil warna ajaib`,
      miniChallenge: `Ayo coba praktikkan langkah kedua bersama teman sebangkumu!`,
    },
    {
      branchNumber: 5,
      branchName: `5. Tips Cerdas & Kesimpulan Emas`,
      branchColor: '#DB2777', // Pink
      connectingPhrase: 'disimpulkan sebagai',
      subBranches: [
        `Jembatan keledai / rumus cepat diingat murid SD`,
        `Hal penting yang TIDAK boleh dilupakan saat asesmen`,
        `Kunci keberhasilan menguasai kompetensi ${actionVerb.toLowerCase()}`,
      ],
      visualDoodle: `Ikon bintang emas bersinar 3D & piala juara cilik`,
      miniChallenge: `Apa satu kata ajaib yang membuatmu paling ingat materi ini?`,
    },
  ];

  // Markdown hierarchical outline (ready for Markmap, GitMind, XMind, Obsidian)
  const fullMarkdownOutline = `# 🌟 PETA PIKIRAN: ${coreConcept.toUpperCase()} (${gradeLabel})
## Topik Pusat: ${coreConcept} (Mata Pelajaran: ${mataPelajaran})
- Tujuan Pembelajaran: Siswa mampu ${actionVerb.toLowerCase()} ${coreConcept}
${branches
  .map(
    (b) => `### ${b.branchName}
- **Kata Penghubung:** ${b.connectingPhrase}
${b.subBranches.map((sub) => `  - ${sub}`).join('\n')}
  - 🎨 *Ikon Visual:* ${b.visualDoodle}
  - 💡 *Tantangan Murid:* ${b.miniChallenge}`
  )
  .join('\n')}`;

  const fullPromptMindMapAI = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

Act as an expert Elementary Education Mind Map Designer and Visual Learning Architect.
Create a comprehensive, visually captivating, child-friendly Mind Map (Peta Konsep / Peta Pikiran) in 100% Bahasa Indonesia for elementary school students.

--- METADATA PEMBELAJARAN ---
- Mata Pelajaran: ${mataPelajaran}
- Sasaran: Siswa ${gradeLabel} (Kurikulum Merdeka)
- Tujuan Pembelajaran: Siswa mampu ${actionVerb.toLowerCase()} '${coreConcept}'.
- Gaya Visual & Rendering: ${styleConfig.label} (${styleConfig.renderKeywords})
- Format Tata Letak: Mind Map Memusat / Radial (Pohon Pengetahuan / Matahari Ceria)
- Warna Dominan: Biru Terang (#2563EB), Hijau Zamrud (#059669), Kuning Emas (#D97706), Ungu Kreatif (#7C3AED), Pink Ceria (#DB2777).

--- FORMAT DIRECTIVES APPLIED ---
${formatRule.promptInstructionBlock}

--- DETAIL STRUKTUR CABANG PETA KONSEP (BAHASA INDONESIA) ---
1. NODUS PUSAT (CENTRAL THEME):
   - Topik Inti: "${coreConcept}"
   - Metafora Visual: Pohon Pengetahuan Rindang 3D dengan karakter siswa SD Indonesia (Budi & Siti berseragam merah-putih) sedang tersenyum ceria mengamati peta konsep di samping papan tulis.
   - Slogan Pusat: "Pahami Konsepnya, Hubungkan Cabangnya, Kuasai Ilmunya!"

2. 5 CABANG UTAMA & HUBUNGAN LOGIS:
${branches
  .map(
    (b) => `   * Cabang #${b.branchNumber}: [${b.branchName}]
     - Kode Warna: ${b.branchColor}
     - Frasa Penghubung: "${b.connectingPhrase}"
     - Sub-Cabang Kunci:
${b.subBranches.map((s) => `       • ${s}`).join('\n')}
     - Elemen Visual 3D: ${b.visualDoodle}
     - Misi / Tantangan Murid: "${b.miniChallenge}"`
  )
  .join('\n\n')}

--- OUTLINE IMPORT (MARKDOWN / MERMAID MINDMAP COMPATIBLE) ---
\`\`\`markdown
${fullMarkdownOutline}
\`\`\`

--- REKOMENDASI APLIKASI PEMBUAT MIND MAP ---
1. GitMind AI / Canva Mind Map: Masukkan outline Markdown di atas untuk langsung membuat diagram radial otomatis.
2. XMind / Miro / Whimsical: Gunakan 5 percabangan warna dengan ikon visual konkret di setiap sudut.
3. Google Gemini Notebook (https://notebook.google/?hl=id): Tempel prompt ini untuk menghasilkan ringkasan interaktif, analogi sederhana, kuis tanya-jawab, dan kartu belajar percabangan.

Pastikan seluruh teks di nodus menggunakan Bahasa Indonesia yang ramah anak, komunikatif, dan memicu daya ingat spasial murid SD.`;

  const pedomanGuruIndo = `Pedoman Pemanfaatan Peta Konsep / Peta Pikiran di Kelas SD:
1. Aktivitas Pembuka (Apersepsi): Tampilkan diagram peta pikiran ini di proyektor atau papan tulis. Ajak siswa menebak hubungan antarcabang: "Anak-anak, mengapa materi ini dihubungkan dengan cabang warna hijau?"
2. Belajar Kolaboratif: Bagikan lembar kerja kosong dengan diagram pohon/radial, minta siswa mengisi sub-cabang dengan kata kunci buatan mereka sendiri atau gambar doodle lucu.
3. Asosiasi Warna & Memori: Latih daya ingat murid dengan mengenali 5 cabang warna (Biru = Arti, Hijau = Ciri/Unsur, Kuning = Contoh Nyata, Ungu = Langkah Praktik, Pink = Tips Cerdas).
4. Ekspor ke Alat Digital: Anda dapat mengimpor struktur outline teks ke GitMind, Canva, XMind, atau langsung paste ke Google Gemini Notebook untuk membuat kuis interaktif cabang.`;

  return {
    title: `Peta Konsep & Peta Pikiran: Menjelajahi ${coreConcept}`,
    mindMapTitle: `Peta Konsep: ${coreConcept}`,
    centralTheme: coreConcept,
    centralVisualMetaphor: `Pohon Pengetahuan Rindang 3D dengan karakter anak SD Indonesia (Budi & Siti)`,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    layoutStructure: 'Radial / Memusat (Matahari)',
    branches,
    recommendedTools: ['GitMind AI', 'Canva Mind Map Maker', 'XMind', 'Miro', 'Whimsical', 'Markmap'],
    fullPromptMindMapAI,
    fullMarkdownOutline,
    pedomanGuruIndo,
    recommendedRatio: '16:9 Landscape / A4 Horizontal',
    formatDirectiveSummary: formatRule.description,
  };
}

// Helper: Dekomposisi Materi untuk Sutradara Video Edukatif Berbobot & Interaktif
export interface PedagogicalVideoBreakdown {
  curiosityHookTitle: string;
  curiosityHookQuestionId: string;
  curiosityHookQuestionEn: string;
  mysteryContextId: string;
  mysteryContextEn: string;
  conceptDefinitionId: string;
  conceptDefinitionEn: string;
  part1Name: string;
  part1FunctionId: string;
  part1FunctionEn: string;
  part2Name: string;
  part2FunctionId: string;
  part2FunctionEn: string;
  mechanismId: string;
  mechanismEn: string;
  maintenanceId: string;
  maintenanceEn: string;
  pitfallTipId: string;
  pitfallTipEn: string;
  collaborationTaskId: string;
  collaborationTaskEn: string;
  quizQuestion: string;
  quizAnswer: string;
  tpVerificationStatement: string;
  realLifeBenefitId: string;
  realLifeBenefitEn: string;
  goldenTakeawayId: string;
  goldenTakeawayEn: string;

  // Animasi visual 3D / hologram relevan per adegan (mendukung penjelasan materi secara eksplisit)
  animationScene1Id: string;
  animationScene1En: string;
  animationScene2Id: string;
  animationScene2En: string;
  animationScene3Id: string;
  animationScene3En: string;
  animationScene4Id: string;
  animationScene4En: string;

  // Dialog Bersambung Khusus Format 4 Adegan (10-15 kata per turn, mulai detik 0.5, jeda akhir 0.5s)
  dialogueFourScene1: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueFourScene2: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueFourScene3: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueFourScene4: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;

  // Dialogues Master 14 Tahapan (10-15 kata per turn, artikulatif & santai, mulai detik 0.5s)
  dialogueHook: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueObservation: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueDefinition: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialoguePart1: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialoguePart2: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueMechanism: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueMaintenance: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialoguePitfall: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueCollaboration: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueQuizQuestion: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueQuizAnswer: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueRealLife: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueReflection: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  dialogueCelebration: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
}

export function decomposeMateriForPedagogicalVideo(
  tp: TPItem,
  mataPelajaran: string,
  coreConcept: string,
  actionVerb: string,
  tujuanPembelajaran: string,
  kodeTP: string
): PedagogicalVideoBreakdown {
  const combinedText = `${tp.rumusanTP || ''} ${tp.lingkupMateri || ''} ${tp.kompetensi || ''} ${mataPelajaran} ${coreConcept}`.toLowerCase();

  // 1. TATA SURYA, BUMI, REVOLUSI BUMI, ROTASI BUMI, PLANET, GERHANA & MUSIM (IPAS / SAINS)
  if (
    combinedText.includes('revolusi') ||
    combinedText.includes('rotasi') ||
    combinedText.includes('bumi') ||
    combinedText.includes('tata surya') ||
    combinedText.includes('planet') ||
    combinedText.includes('matahari') ||
    combinedText.includes('bulan') ||
    combinedText.includes('gerhana') ||
    combinedText.includes('musim') ||
    combinedText.includes('orbit')
  ) {
    return {
      curiosityHookTitle: 'Misteri Perjalanan Bumi Mengelilingi Matahari',
      curiosityHookQuestionId: 'Tahukah kalian, mengapa bumi kita terus bergerak mengelilingi matahari tanpa pernah berhenti sedetik pun?',
      curiosityHookQuestionEn: 'Do you know why our Earth constantly orbits around the Sun without pausing for a single second?',
      mysteryContextId: 'mengamati bola globe dunia berputar di atas meja kelas di samping miniatur matahari bercahaya',
      mysteryContextEn: 'observing a desktop rotating Earth globe beside a softly glowing tabletop miniature sun model',
      conceptDefinitionId: 'Revolusi bumi adalah gerakan bumi berputar mengelilingi matahari pada garis orbit elips selama satu tahun penuh.',
      conceptDefinitionEn: 'Earth revolution is the continuous motion of Earth orbiting the Sun along an elliptical path for one full year.',
      part1Name: 'Jalur Orbit Elips & Periode 365 Hari',
      part1FunctionId: 'Orbit bumi berbentuk sedikit lonjong elips dan membutuhkan waktu sekitar 365 seperempat hari untuk satu putaran.',
      part1FunctionEn: 'Earth orbits along an elliptical trajectory requiring approximately 365.25 days for a single complete revolution.',
      part2Name: 'Tahun Kabisat & Kemiringan Sumbu 23,5 Derajat',
      part2FunctionId: 'Sisa seperempat hari digabungkan tiap empat tahun menjadi 29 Februari, serta kemiringan sumbu bumi 23,5 derajat.',
      part2FunctionEn: 'The quarter-day accumulates every four years into February 29th leap year, coupled with Earth axial tilt of 23.5 degrees.',
      mechanismId: 'Kemiringan sumbu bumi saat berevolusi menyebabkan intensitas sinar matahari yang diterima belahan bumi terus berganti.',
      mechanismEn: 'Earth axial tilt during revolution alters sunlight angles causing distinct seasons and shifting daylight durations.',
      maintenanceId: 'Memahami revolusi bumi membantu kita membuat sistem penanggalan kalender dan bersiap menghadapi perubahan musim.',
      maintenanceEn: 'Understanding revolution guides calendar systems and helps societies adapt to seasonal weather shifts.',
      pitfallTipId: 'Jangan keliru membedakan rotasi bumi berputar pada porosnya dengan revolusi bumi mengelilingi matahari.',
      pitfallTipEn: 'Never confuse Earth daily rotation on its own axis with its yearly revolution around the Sun.',
      collaborationTaskId: 'memperagakan orbit bumi mengelilingi model lampu matahari menggunakan replika bola bumi kecil',
      collaborationTaskEn: 'demonstrating Earth orbit around a sun-lamp model using miniature globes',
      quizQuestion: 'Berapa lama waktu yang dibutuhkan bumi untuk satu kali mengelilingi matahari secara penuh?',
      quizAnswer: 'Tiga ratus enam puluh lima hari atau tepatnya satu tahun masehi!',
      tpVerificationStatement: `Siswa telah tuntas memahami konsep revolusi bumi dan akibatnya sesuai TP [${kodeTP}].`,
      realLifeBenefitId: 'Memahami tata surya membuat kita bersyukur atas keteraturan alam semesta yang menopang seluruh kehidupan di bumi.',
      realLifeBenefitEn: 'Comprehending astronomy nurtures gratitude for the cosmic order sustaining life on Earth.',
      goldenTakeawayId: 'Keteraturan bumi mengitari matahari adalah bukti keagungan penciptaan alam semesta yang menakjubkan.',
      goldenTakeawayEn: 'The flawless cosmic harmony of Earth orbit reflects the magnificent architecture of the universe.',

      // Animasi Relevan Khusus Topik Revolusi Bumi
      animationScene1Id: 'Globe bumi berputar di samping lampu matahari miniatur di meja kelas dengan garis orbit elips bercahaya halus.',
      animationScene1En: 'Rotating classroom desktop globe beside a glowing miniature tabletop sun with subtle glowing orbital rings.',
      animationScene2Id: 'Hologram 3D spektakuler tata surya menyala di tengah memperlihatkan matahari keemasan dan bumi bulat biru beredar di jalur orbit elips, dengan kalender melayang membalik lembaran bulan dari Januari hingga Desember.',
      animationScene2En: 'Spectacular luminous 3D solar system hologram showing glowing golden sun at center and blue Earth orbiting smoothly along an elliptical pathway, with floating translucent calendar flipping months from January to December.',
      animationScene3Id: 'Hologram interaktif memperlihatkan kalender 29 Februari tahun kabisat bercahaya lembut dan garis sumbu hijau miring menembus bola bumi dengan sudut 23,5 derajat.',
      animationScene3En: 'Interactive hologram displaying glowing leap year calendar with February 29th, alongside an illuminated green axial tilt line piercing Earth at 23.5 degrees.',
      animationScene4Id: 'Efek visual 3D menampilkan miniatur bumi dengan daun musim gugur berputar dan butiran salju lembut melayang di belahan bumi, memperlihatkan perbedaan pergantian musim dan perbedaan siang malam.',
      animationScene4En: 'Enchanting 3D visual effects around miniature Earth showing autumn leaves drifting and soft snowflakes falling over hemispheres, demonstrating changing seasons and daylight differences.',

      // Dialog Bersambung 4 Adegan (10-15 kata per turn, mulai 0.5s, jeda akhir 0.5s)
      dialogueFourScene1: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Ghea, kamu tahu nggak apa itu revolusi bumi yang sebenarnya?" | Ghea: "Tahu! Revolusi bumi adalah gerakan bumi berputar mengelilingi matahari secara teratur!"`;
        }
        if (keys.includes('pakRoni') && keys.includes('ghea')) {
          return `Pak Roni: "Ghea, tahukah kamu apa rahasia gerakan revolusi bumi kita?" | Ghea: "Revolusi bumi adalah gerakan bumi berputar mengelilingi matahari secara teratur!"`;
        }
        return `Ghea: "Revolusi bumi adalah gerakan bumi berputar mengelilingi matahari secara teratur dan berulang!"`;
      },
      dialogueFourScene2: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Wah, lihat! Jadi bumi benar-benar bergerak mengelilingi matahari pada jalurnya?" | Ghea: "Benar! Jalurnya disebut orbit elips, dan butuh waktu sekitar 365 hari atau satu tahun!"`;
        }
        return `Pak Roni: "Bumi beredar pada lintasan orbit elips selama 365 hari atau satu tahun penuh!"`;
      },
      dialogueFourScene3: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Tapi kenapa kadang bulan Februari punya 29 hari di tahun kabisat?" | Ghea: "Karena revolusi bumi bersisa seperempat hari, ditambah kemiringan sumbu bumi 23,5 derajat!"`;
        }
        return `Ghea: "Tahun kabisat terjadi dari akumulasi sisa waktu revolusi bumi dengan kemiringan sumbu 23,5 derajat!"`;
      },
      dialogueFourScene4: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Ghea: "Akibatnya terjadi pergantian musim, perbedaan lama siang malam, dan gerak semu matahari!" | Jordy: "Revolusi bumi sungguh menakjubkan! Sampai jumpa di petualangan sains berikutnya!"`;
        }
        return `Semua: "Revolusi bumi mengatur musim dan waktu kita! Sampai jumpa di pembelajaran berikutnya!"`;
      },

      // Dialog Master 14 Tahapan (10-15 kata per turn)
      dialogueHook: (keys) => `Jordy: "Ghea, tahukah kamu mengapa bumi terus mengitari matahari tanpa henti?" | Ghea: "Mari kita selidiki bersama rahasia besar alam semesta ini!"`,
      dialogueObservation: (keys) => `Pak Roni: "Perhatikan globe dan model matahari ini dengan saksama anak-anak!" | Jordy: "Ada jalur peredaran yang sangat teratur dan tidak pernah tabrakan!"`,
      dialogueDefinition: (keys) => `Pak Roni: "Revolusi bumi adalah gerakan peredaran bumi mengelilingi matahari pada orbitnya!" | Ghea: "Gerakan ini berlangsung terus-menerus sepanjang tahun tanpa henti!"`,
      dialoguePart1: (keys) => `Ghea: "Bumi membutuhkan waktu sekitar 365 seperempat hari untuk satu putaran!" | Jordy: "Waktu satu putaran penuh itulah yang kita sebut satu tahun!"`,
      dialoguePart2: (keys) => `Pak Roni: "Perhatikan kalender tahun kabisat dan kemiringan sumbu bumi 23,5 derajat!" | Ghea: "Kemiringan sumbu inilah yang membuat paparan sinar matahari berbeda-beda!"`,
      dialogueMechanism: (keys) => `Jordy: "Sumbu miring membuat kutub utara dan selatan bergantian disinari matahari!" | Pak Roni: "Itulah mekanisme utama yang melahirkan dinamika alam di bumi!"`,
      dialogueMaintenance: (keys) => `Ghea: "Pengetahuan revolusi bumi membantu para petani menentukan waktu tanam tepat!" | Jordy: "Kita juga bisa memprediksi perubahan cuaca dan musim dengan cermat!"`,
      dialoguePitfall: (keys) => `Pak Roni: "Ingat baik-baik, jangan samakan rotasi bumi harian dengan revolusi tahunan!" | Ghea: "Rotasi menghasilkan siang malam, sedangkan revolusi menghasilkan pergantian musim!"`,
      dialogueCollaboration: (keys) => `Jordy: "Kami berhasil menyimulasikan orbit bumi mengelilingi matahari secara tepat!" | Ghea: "Semua posisi bulan dan bumi berada pada garis orbit benar!"`,
      dialogueQuizQuestion: (keys) => `Pak Roni: "Berapa lama waktu yang dibutuhkan bumi menyelesaikan satu kali revolusi?" | Jordy: "Ayo tebak teman-teman, berapa hari atau berapa tahun?"`,
      dialogueQuizAnswer: (keys) => `Ghea: "Tepat 365 seperempat hari atau senilai satu tahun masehi!" | Pak Roni: "Hebat sekali, jawaban kalian seratus persen tepat dan benar!"`,
      dialogueRealLife: (keys) => `Pak Roni: "Keteraturan tata surya mengajarkan kita pentingnya disiplin dan ketepatan waktu!" | Jordy: "Alam semesta bekerja dengan hukum sains yang sangat luar biasa!"`,
      dialogueReflection: (keys) => `Ghea: "Bumi adalah rumah indah kita yang dirancang dengan sangat sempurna!" | Pak Roni: "Syukuri nikmat kehidupan dengan terus rajin belajar dan bereksplorasi!"`,
      dialogueCelebration: (keys) => `Pak Roni: "Kalian telah tuntas menguasai materi revolusi bumi hari ini!" | Semua: "Sains itu menyenangkan! Sampai jumpa di video edukasi berikutnya!"`,
    };
  }

  // 2. ORGAN TUBUH MANUSIA & SISTEM TUBUH (Jantung, Paru, Lambung, Otot, Rangka, Panca Indra)
  if (
    combinedText.includes('organ') ||
    combinedText.includes('tubuh') ||
    combinedText.includes('jantung') ||
    combinedText.includes('paru') ||
    combinedText.includes('lambung') ||
    combinedText.includes('pencernaan') ||
    combinedText.includes('pernapasan') ||
    combinedText.includes('indra') ||
    combinedText.includes('rangka') ||
    combinedText.includes('tulang') ||
    combinedText.includes('peredaran darah')
  ) {
    const isMaintenanceTopic = combinedText.includes('menjaga') || combinedText.includes('merawat') || combinedText.includes('sehat') || combinedText.includes('kebiasaan');
    return {
      curiosityHookTitle: isMaintenanceTopic ? 'Misteri Menjaga Organ Tubuh Tetap Bugar' : 'Misteri Mesin Ajaib di Dalam Tubuh',
      curiosityHookQuestionId: 'Tahukah kalian mesin ajaib apa di dalam tubuh yang memompa darah siang malam tanpa berhenti?',
      curiosityHookQuestionEn: 'What magical machine inside our human body pumps blood day and night without ever pausing?',
      mysteryContextId: 'mengamati siluet torso tubuh manusia bercahaya memperlihatkan letak organ vital yang bekerja serasi',
      mysteryContextEn: 'observing a glowing human silhouette model displaying vital organs working in harmony',
      conceptDefinitionId: 'Organ tubuh adalah bagian penting di dalam tubuh yang memiliki tugas khusus menjaga kita tetap hidup dan bertenaga.',
      conceptDefinitionEn: 'Body organs are specialized internal structures performing vital functions to sustain human life and vigor.',
      part1Name: 'Jantung & Paru-Paru (Pemompa Darah & Oksigen)',
      part1FunctionId: 'Jantung memompa darah segar ke seluruh tubuh sedangkan paru-paru menghirup oksigen bersih bagi sel-sel kita.',
      part1FunctionEn: 'Heart circulates oxygenated blood while lungs absorb clean oxygen to revitalize all body tissues.',
      part2Name: 'Lambung & Usus (Pencerna Sari Nutrisi)',
      part2FunctionId: 'Lambung dan usus mencerna makanan sehat menjadi sari nutrisi dan energi aktif untuk belajar dan berolahraga.',
      part2FunctionEn: 'Stomach and intestines digest nutritious food into usable fuel for active learning and physical motion.',
      mechanismId: 'Oksigen dari paru-paru dan nutrisi dari lambung dialirkan oleh darah ke seluruh organ agar tubuh selalu berenergi.',
      mechanismEn: 'Oxygen and digested nutrients circulate via blood vessels energizing muscles, organs, and brain.',
      maintenanceId: 'Merawat organ tubuh dengan makan bergizi seimbang, rajin minum air putih, berolahraga, dan tidur cukup delapan jam.',
      maintenanceEn: 'Care for organs with balanced diets, generous clean water, routine exercise, and eight hours of restful sleep.',
      pitfallTipId: 'Hindari tidur larut malam dan batasi makanan manis berlemak agar kerja jantung dan lambung tidak terbebani.',
      pitfallTipEn: 'Avoid late nights and minimize sugary junk foods to prevent straining vital digestive and cardiac organs.',
      collaborationTaskId: 'memasangkan kartu nama organ dengan fungsi vitalnya dan langkah perawatannya secara tepat',
      collaborationTaskEn: 'matching organ name cards with their specific vital functions and healthy maintenance habits',
      quizQuestion: 'Organ penting di dalam rongga dada yang bertugas memompa darah ke seluruh tubuh adalah?',
      quizAnswer: 'Jantung! Mesin pemompa darah yang tak kenal lelah menjaga kita tetap hidup!',
      tpVerificationStatement: `Siswa telah tuntas memahami struktur, fungsi, dan cara merawat organ tubuh sesuai TP [${kodeTP}].`,
      realLifeBenefitId: 'Memahami organ tubuh membuat kita sadar pentingnya pola hidup sehat sejak usia dini demi masa depan cerah.',
      realLifeBenefitEn: 'Appreciating body anatomy motivates lifelong healthy habits to support bright energetic futures.',
      goldenTakeawayId: 'Kesehatan tubuh adalah anugerah terindah yang harus dijaga dengan penuh rasa tanggung jawab.',
      goldenTakeawayEn: 'Physical vitality is a priceless treasure that must be preserved with daily mindful choices.',

      // Animasi Relevan Organ Tubuh
      animationScene1Id: 'Torso anatomi tubuh transparan di atas meja kelas dengan organ jantung menyala merah lembut dan paru-paru biru muda.',
      animationScene1En: 'Translucent human anatomy torso on classroom desk with heart glowing crimson and lungs glowing gentle cyan.',
      animationScene2Id: 'Hologram 3D torso tubuh manusia bercahaya memperlihatkan jantung berdenyut anggun memompa darah ke pembuluh dan lambung mengolah nutrisi.',
      animationScene2En: 'Luminous 3D transparent human torso hologram displaying glowing heart pumping crimson blood through arteries and stomach processing nutrients.',
      animationScene3Id: 'Diagram animasi 3D aliran darah mikroskopis membawa gelembung oksigen dan molekul nutrisi ke setiap sel otot dan otak.',
      animationScene3En: 'Microscopic 3D animated circulatory stream carrying oxygen bubbles and nutrient molecules into muscle and brain cells.',
      animationScene4Id: 'Visual peraga pola hidup sehat melayang di sekeliling: piring gizi seimbang, botol air mineral berkilau, dan jam tidur delapan jam.',
      animationScene4En: 'Floating 3D wellness icons surrounding characters: balanced nutritious plate, sparkling water bottle, and an eight-hour sleep clock.',

      // Dialog Bersambung 4 Adegan
      dialogueFourScene1: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Tahukah kalian mesin ajaib apa di dalam tubuh yang memompa darah?" | Ghea: "Itu jantung kita, Pak! Organ vital pemompa darah paling penting bagi tubuh!"`;
        }
        return `Ghea: "Jordy, tahukah kamu organ apa yang memompa darah kita?" | Jordy: "Itu jantung! Organ vital yang bekerja tanpa henti memompa darah!"`;
      },
      dialogueFourScene2: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Wah, lihat denyut jantungnya! Mengalirkan darah segar kaya oksigen dari paru-paru!" | Jordy: "Lalu lambung dan usus mencerna makanan menjadi nutrisi bertenaga untuk beraktivitas!"`;
        }
        return `Pak Roni: "Jantung memompa oksigen dari paru-paru dan nutrisi lambung ke seluruh tubuh!"`;
      },
      dialogueFourScene3: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Darah membawa oksigen dan nutrisi agar seluruh bagian tubuh bisa bekerja!" | Ghea: "Semua organ tubuh saling bekerja sama secara teratur tanpa pernah berhenti!"`;
        }
        return `Jordy: "Oksigen dan nutrisi dialirkan darah ke seluruh sel agar kita berenergi!"`;
      },
      dialogueFourScene4: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Rawat organ tubuh dengan makan bergizi, minum air putih, dan rutin berolahraga!" | Semua: "Jaga kesehatan tubuh kita sejak dini agar selalu siap meraih cita-cita!"`;
        }
        return `Semua: "Mari sayangi dan rawat organ tubuh kita agar selalu sehat bugar!"`;
      },

      // Dialog Master 14 Tahapan (10-15 kata per turn)
      dialogueHook: (keys) => `Pak Roni: "Tahukah kalian apa mesin ajaib yang memompa darah dalam dada?" | Ghea: "Apakah mesin itu adalah jantung kita yang berdetak setiap saat?"`,
      dialogueObservation: (keys) => `Pak Roni: "Perhatikan model torso anatomi ini dengan saksama anak-anak hebat!" | Jordy: "Wah, letak organ tersusun sangat rapi dan saling terhubung harmonis!"`,
      dialogueDefinition: (keys) => `Pak Roni: "Organ tubuh adalah bagian penting yang menjalankan fungsi penopang kehidupan kita!" | Ghea: "Masing-masing organ memiliki tugas khusus yang sangat hebat bagi kesehatan!"`,
      dialoguePart1: (keys) => `Pak Roni: "Jantung memompa darah sedangkan paru-paru menyuplai oksigen segar bagi tubuh!" | Jordy: "Keduanya bekerja sama mengalirkan udara bersih ke seluruh jaringan sel!"`,
      dialoguePart2: (keys) => `Ghea: "Lambung dan usus bertugas mengolah makanan menjadi sari pati energi!" | Jordy: "Nutrisi itulah yang membuat kita kuat belajar dan berolahraga ceria!"`,
      dialogueMechanism: (keys) => `Pak Roni: "Aliran darah membawa oksigen dan nutrisi ke setiap jaringan sel tubuh!" | Ghea: "Semua organ saling bergantung untuk menjaga kebugaran tubuh kita seutuhnya!"`,
      dialogueMaintenance: (keys) => `Jordy: "Bagaimana cara terbaik menjaga agar organ tubuh tetap sehat bugar?" | Pak Roni: "Makanlah makanan bergizi, minumlah air putih cukup, dan tidurlah teratur!"`,
      dialoguePitfall: (keys) => `Pak Roni: "Hindari kebiasaan begadang dan kurangi jajan makanan manis serta berlemak!" | Ghea: "Istirahat cukup dan makanan sehat melindungi organ dari kerusakan dini!"`,
      dialogueCollaboration: (keys) => `Ghea: "Kami berhasil memasangkan kartu nama organ beserta fungsi vitalnya tepat!" | Jordy: "Kerja sama kelompok membuat kita makin memahami sistem tubuh manusia!"`,
      dialogueQuizQuestion: (keys) => `Pak Roni: "Organ apa yang berdetak di dalam rongga dada memompa darah?" | Ghea: "Ayo teman-teman di rumah, coba jawab pertanyaan seru ini!"`,
      dialogueQuizAnswer: (keys) => `Jordy: "Jawabannya adalah jantung kita yang berdetak siang dan malam!" | Pak Roni: "Tepat sekali, jawaban kalian benar seratus persen tanpa ada kesalahan!"`,
      dialogueRealLife: (keys) => `Ghea: "Tubuh yang sehat membuat kita bersemangat belajar dan menggapai cita-cita!" | Pak Roni: "Kesehatan tubuh adalah investasi terbaik untuk masa depan kalian nanti!"`,
      dialogueReflection: (keys) => `Pak Roni: "Rawatlah anugerah tubuh sehat ini dengan penuh rasa syukur mendalam!" | Jordy: "Kesehatan adalah harta paling berharga yang wajib kita jaga bersama!"`,
      dialogueCelebration: (keys) => `Pak Roni: "Selamat, kalian telah berhasil menuntaskan materi organ tubuh hari ini!" | Semua: "Jaga kesehatan selalu dan sampai jumpa di petualangan video berikutnya!"`,
    };
  }

  // 3. TUMBUHAN, BAGIAN TUMBUHAN & FOTOSINTESIS
  if (
    combinedText.includes('tumbuhan') ||
    combinedText.includes('fotosintesis') ||
    combinedText.includes('daun') ||
    combinedText.includes('akar') ||
    combinedText.includes('batang') ||
    combinedText.includes('bunga') ||
    combinedText.includes('klorofil')
  ) {
    return {
      curiosityHookTitle: 'Misteri Dapur Ajaib Daun Hijau',
      curiosityHookQuestionId: 'Dari mana pohon besar mendapatkan makanan padahal tidak punya mulut atau dapur seperti kita?',
      curiosityHookQuestionEn: 'How do giant green trees produce food without a mouth or kitchen like humans?',
      mysteryContextId: 'mengamati tanaman pot yang terkena sinar matahari pagi dengan tetes embun berkilauan',
      mysteryContextEn: 'inspecting a vibrant potted plant under morning sunbeams with dewdrops glistening on leaves',
      conceptDefinitionId: 'Tumbuhan adalah makhluk hidup mandiri yang memasak makanannya sendiri melalui proses fotosintesis.',
      conceptDefinitionEn: 'Plants are autotrophic living beings producing their own nutrients through sunlight photosynthesis.',
      part1Name: 'Akar & Batang (Penyerap & Pengangkut)',
      part1FunctionId: 'Akar menyerap air dan mineral dari tanah lalu batang mengalirkannya menuju daun hijau.',
      part1FunctionEn: 'Roots absorb water and soil minerals while stems transport them upward to green leaves.',
      part2Name: 'Daun Hijau & Klorofil (Dapur Memasak Makanan)',
      part2FunctionId: 'Klorofil pada daun menangkap sinar matahari untuk mengubah air dan karbon dioksida jadi makanan.',
      part2FunctionEn: 'Chlorophyll within leaves captures solar photons converting water and carbon dioxide into food.',
      mechanismId: 'Air dari tanah dan karbon dioksida dari udara diolah menjadi glukosa makanan dan oksigen bersih.',
      mechanismEn: 'Water and carbon dioxide transform into nourishing glucose sugar and release pure oxygen.',
      maintenanceId: 'Merawat tanaman dengan menyiram air secukupnya, memberi pupuk, dan memastikan cukup cahaya matahari.',
      maintenanceEn: 'Care for plants with regular watering, organic compost, and adequate exposure to sunlight.',
      pitfallTipId: 'Jangan meletakkan tanaman di tempat gelap dan jangan menyiram air terlalu berlebihan hingga busuk.',
      pitfallTipEn: 'Never keep plants in complete darkness or overwater them risking fatal root rot.',
      collaborationTaskId: 'mengamati penampang daun dengan mikroskop dan menyusun kartu alur fotosintesis runtut',
      collaborationTaskEn: 'observing leaf cross-sections with microscopes and sequencing photosynthesis cards',
      quizQuestion: 'Gas bersih apa yang dilepaskan daun ke udara saat melakukan proses fotosintesis?',
      quizAnswer: 'Gas oksigen! Udara bersih menyegarkan yang kita hirup setiap hari untuk bernapas!',
      tpVerificationStatement: `Siswa telah tuntas memahami bagian tumbuhan dan proses fotosintesis sesuai TP [${kodeTP}].`,
      realLifeBenefitId: 'Menjaga kelestarian tumbuhan berarti menjaga pasokan oksigen bersih bagi kehidupan seluruh makhluk di bumi.',
      realLifeBenefitEn: 'Preserving plant biodiversity guarantees clean oxygen reserves for all living species globally.',
      goldenTakeawayId: 'Tumbuhan adalah sahabat sejati bumi yang memberi kita oksigen dan keteduhan alami.',
      goldenTakeawayEn: 'Plants are the green lungs of Earth offering us life-giving oxygen and shade.',

      // Animasi Relevan Tumbuhan & Fotosintesis
      animationScene1Id: 'Tanaman pot hijau subur di atas meja kelas bermandikan sinar matahari pagi dengan tetesan embun bening.',
      animationScene1En: 'Flourishing green potted plant on sunny classroom desk with glistening dewdrops on fresh leaves.',
      animationScene2Id: 'Hologram 3D sehelai daun hijau bercahaya tembus pandang memperlihatkan sel klorofil menyerap sinar matahari keemasan dan karbon dioksida.',
      animationScene2En: 'Luminous 3D cross-section hologram of a green leaf showing chlorophyll cells capturing golden sunlight and carbon dioxide.',
      animationScene3Id: 'Animasi kimia 3D molekul air dan karbon dioksida bereaksi menghasilkan gelembung glukosa makanan dan oksigen bersih.',
      animationScene3En: 'Dynamic 3D chemical reaction animation showing water and carbon dioxide forming glucose energy and pure oxygen bubbles.',
      animationScene4Id: 'Visual peraga hutan tropis hijau menyejukkan melepaskan partikel oksigen segar bercahaya dengan siswa menyiram bibit tanaman.',
      animationScene4En: 'Lush tropical foliage releasing sparkling oxygen particles into morning air while students tend a young seedling.',

      // Dialog Bersambung 4 Adegan
      dialogueFourScene1: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Jordy, dari mana pohon besar mendapatkan makanan padahal tidak punya dapur?" | Jordy: "Tumbuhan adalah makhluk ajaib yang bisa memasak makanannya sendiri melalui fotosintesis!"`;
        }
        return `Pak Roni: "Tumbuhan memasak makanannya sendiri melalui proses fotosintesis menggunakan sinar matahari!"`;
      },
      dialogueFourScene2: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Lihat klorofil pada daun menyerap sinar matahari dan gas karbon dioksida!" | Ghea: "Sementara akar menyerap air dan mineral dari dalam tanah secara terus-menerus!"`;
        }
        return `Ghea: "Klorofil daun menyerap cahaya matahari sementara akar menyerap air dari tanah!"`;
      },
      dialogueFourScene3: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Fotosintesis menghasilkan glukosa sebagai sumber energi tumbuhan dan melepaskan oksigen bersih!" | Jordy: "Oksigen yang dihasilkan daun itulah yang kita hirup setiap hari untuk bernapas!"`;
        }
        return `Pak Roni: "Fotosintesis menghasilkan glukosa makanan bagi tumbuhan dan melepaskan oksigen bersih!"`;
      },
      dialogueFourScene4: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Tumbuhan adalah sahabat paru-paru bumi yang sangat berharga bagi semua makhluk!" | Semua: "Mari rawat dan tanam pohon agar bumi kita tetap asri dan sejuk!"`;
        }
        return `Semua: "Mari lestarikan pohon hijau di sekitar kita! Sampai jumpa di video berikutnya!"`;
      },

      // Dialog Master 14 Tahapan (10-15 kata per turn)
      dialogueHook: (keys) => `Ghea: "Jordy, tahukah kamu bagaimana cara pohon memasak makanan tanpa dapur?" | Jordy: "Mari kita selidiki rahasia fotosintesis pada daun hijau ini bersama!"`,
      dialogueObservation: (keys) => `Pak Roni: "Amati daun hijau dan tetesan embun segar di bawah sinar matahari!" | Ghea: "Daun tampak sangat segar dan memiliki urat daun yang begitu rapi!"`,
      dialogueDefinition: (keys) => `Pak Roni: "Fotosintesis adalah proses tumbuhan memasak makanannya sendiri menggunakan energi sinar matahari!" | Jordy: "Proses luar biasa ini menjadi sumber kehidupan utama bagi seluruh bumi!"`,
      dialoguePart1: (keys) => `Pak Roni: "Akar menyerap air tanah dan batang mengalirkannya ke seluruh ranting!" | Ghea: "Batang kokoh berfungsi sebagai jembatan penghubung nutrisi menuju daun-daun hijau!"`,
      dialoguePart2: (keys) => `Jordy: "Zat hijau daun klorofil bekerja menangkap energi cahaya matahari pagi!" | Pak Roni: "Klorofil adalah panel surya alami yang sangat canggih pada tumbuhan!"`,
      dialogueMechanism: (keys) => `Ghea: "Air dan karbon dioksida diolah menjadi zat gula dan oksigen!" | Pak Roni: "Reaksi fotosintesis menghasilkan makanan sekaligus udara bersih bagi seluruh makhluk!"`,
      dialogueMaintenance: (keys) => `Jordy: "Kita wajib menyiram tanaman secara rutin dan memberinya pupuk organik!" | Ghea: "Pastikan tanaman mendapatkan sinar matahari cukup agar fotosintesis berjalan lancar!"`,
      dialoguePitfall: (keys) => `Pak Roni: "Jangan letakkan tanaman di ruangan gelap tanpa cahaya matahari langsung!" | Jordy: "Tanpa cahaya matahari, tumbuhan tidak bisa memasak makanan dan akan layu!"`,
      dialogueCollaboration: (keys) => `Ghea: "Susunan bagan alur fotosintesis kelompok kita berhasil diselesaikan dengan tepat!" | Jordy: "Semua kartu bahan dan hasil fotosintesis terpasang pada tempat benar!"`,
      dialogueQuizQuestion: (keys) => `Pak Roni: "Gas apa yang dihasilkan daun saat fotosintesis untuk kita bernapas?" | Ghea: "Ayo tebak teman-teman, gas apa yang sangat menyegarkan paru-paru?"`,
      dialogueQuizAnswer: (keys) => `Jordy: "Gas oksigen bersih yang membuat udara terasa sangat segar sekali!" | Pak Roni: "Luar biasa tepat, jawaban kalian membuktikan pemahaman materi yang sangat mantap!"`,
      dialogueRealLife: (keys) => `Pak Roni: "Menanam satu pohon berarti menyumbang oksigen bagi masa depan bumi!" | Ghea: "Hutan lebat menjaga keseimbangan iklim dan mencegah bencana banjir bandang!"`,
      dialogueReflection: (keys) => `Ghea: "Tumbuhan mengajarkan kita untuk selalu memberi manfaat tulus bagi sesama!" | Pak Roni: "Jadilah pribadi berkarakter mulia yang selalu membawa keteduhan di sekitarmu!"`,
      dialogueCelebration: (keys) => `Pak Roni: "Selamat anak-anak, kalian telah menguasai rahasia fotosintesis dengan sempurna!" | Semua: "Sayangi pohon kita dan sampai jumpa di video pembelajaran berikutnya!"`,
    };
  }

  // 4. MATEMATIKA (PECAHAN, OPERASI HITUNG & PENGUKURAN)
  if (
    combinedText.includes('pecahan') ||
    combinedText.includes('desimal') ||
    combinedText.includes('persen') ||
    combinedText.includes('penjumlahan') ||
    combinedText.includes('pengurangan') ||
    combinedText.includes('perkalian') ||
    combinedText.includes('pembagian') ||
    combinedText.includes('matematika') ||
    combinedText.includes('bangun') ||
    combinedText.includes('sudut') ||
    combinedText.includes('luas')
  ) {
    return {
      curiosityHookTitle: 'Misteri Membagi Roti Pizza Sama Rata',
      curiosityHookQuestionId: 'Bagaimana cara membagi satu loyang kue agar semua teman mendapat bagian yang adil?',
      curiosityHookQuestionEn: 'How can we divide a single whole cake fairly so every friend gets an identical portion?',
      mysteryContextId: 'mengamati model lingkaran kue berwarna-warni yang dapat dibongkar pasang di atas meja',
      mysteryContextEn: 'inspecting colorful segmented circular manipulatives on the wooden classroom desk',
      conceptDefinitionId: 'Pecahan adalah bilangan yang mewakili bagian dari satu kesatuan utuh yang dibagi sama besar.',
      conceptDefinitionEn: 'A fraction represents proportional equal parts of a single unified whole.',
      part1Name: 'Pembilang (Bagian yang Diambil)',
      part1FunctionId: 'Pembilang adalah angka di atas yang menunjukkan banyaknya potongan yang kita ambil atau arsir.',
      part1FunctionEn: 'Numerator is the top digit representing how many equal segments are taken or shaded.',
      part2Name: 'Penyebut (Jumlah Seluruh Potongan)',
      part2FunctionId: 'Penyebut adalah angka di bawah yang menunjukkan total seluruh potongan pada satu kesatuan utuh.',
      part2FunctionEn: 'Denominator is the bottom digit representing the total number of parts dividing the whole.',
      mechanismId: 'Pecahan senilai diperoleh dengan mengalikan atau membagi pembilang dan penyebut dengan angka sama.',
      mechanismEn: 'Equivalent fractions are formed by multiplying or dividing numerator and denominator by identical non-zero integers.',
      maintenanceId: 'Menerapkan pecahan saat membagi makanan, menakar resep memasak, dan menghitung uang tabungan.',
      maintenanceEn: 'Apply fractions in fair sharing, kitchen recipe measurements, and currency saving calculations.',
      pitfallTipId: 'Jangan pernah menjumlahkan angka penyebut saat menjumlahkan pecahan berpenyebut sama.',
      pitfallTipEn: 'Never add denominators together when summing fractions sharing a common bottom digit.',
      collaborationTaskId: 'menyusun kepingan pecahan lingkaran untuk membuktikan pecahan senilai secara nyata',
      collaborationTaskEn: 'assembling circular fraction puzzle pieces proving equivalence visually',
      quizQuestion: 'Jika satu pizza dipotong menjadi 4 bagian sama besar dan kamu makan 2, berapa nilainya?',
      quizAnswer: 'Dua per empat, yang nilainya sama persis dengan satu per dua atau setengah!',
      tpVerificationStatement: `Siswa telah tuntas memahami konsep dan penyelesaian pecahan sesuai TP [${kodeTP}].`,
      realLifeBenefitId: 'Belajar pecahan melatih kita bersikap jujur, adil, dan cermat dalam berbagi rezeki dengan sesama.',
      realLifeBenefitEn: 'Fractions cultivate honesty, fairness, and precision in sharing everyday resources.',
      goldenTakeawayId: 'Berbagi secara adil membawa kebahagiaan dan persahabatan yang rukun bagi kita semua.',
      goldenTakeawayEn: 'Fair sharing fosters enduring joy and harmonious relationships among friends.',

      // Animasi Relevan Matematika Pecahan
      animationScene1Id: 'Model lingkaran kue pizza warna-warni di atas meja kelas yang terbagi menjadi empat potongan sama besar.',
      animationScene1En: 'Segmented colorful pizza puzzle disc on classroom desk divided into four equal proportional slices.',
      animationScene2Id: 'Hologram 3D kue pizza bundar lezat terbagi menjadi empat potongan dengan angka pembilang dan penyebut bercahaya melayang lembut.',
      animationScene2En: 'Luminous 3D pizza hologram divided into four precise slices with glowing numerator and denominator digits hovering above.',
      animationScene3Id: 'Kepingan hologram pecahan interaktif dua per empat bergabung sempurna menjadi setengah lingkaran membuktikan pecahan senilai.',
      animationScene3En: 'Interactive 3D fraction pieces showing 2/4 merging seamlessly into an identical half circle, proving equivalent fractions.',
      animationScene4Id: 'Visual peraga kue terbagi rata dengan siswa tersenyum bahagia berbagi makanan dan bintang emas pemahaman matematika.',
      animationScene4En: 'Cheerful classroom scene with equally shared pastries and shining golden mastery stars floating overhead.',

      // Dialog Bersambung 4 Adegan
      dialogueFourScene1: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Ghea, bagaimana cara membagi satu loyang kue agar semua teman mendapat bagian adil?" | Ghea: "Kita gunakan konsep pecahan matematika agar pembagian potongannya sama besar dan adil!"`;
        }
        return `Pak Roni: "Pecahan matematika membantu kita membagi benda utuh secara adil dan tepat!"`;
      },
      dialogueFourScene2: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Angka atas adalah pembilang menunjukkan jumlah potongan yang kita ambil!" | Jordy: "Dan angka bawah adalah penyebut menunjukkan jumlah seluruh potongan kue utuh!"`;
        }
        return `Ghea: "Pembilang adalah potongan yang diambil dan penyebut adalah jumlah seluruh potongan!"`;
      },
      dialogueFourScene3: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Dua per empat senilai dengan satu per dua karena ukurannya sama persis!" | Jordy: "Wah, kalikan pembilang dan penyebut dengan angka sama untuk mencari pecahan senilai!"`;
        }
        return `Pak Roni: "Pecahan dua per empat nilainya sama persis dengan satu per dua!"`;
      },
      dialogueFourScene4: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Pecahan membuat kita terbiasa bersikap adil dan jujur saat berbagi rezeki!" | Semua: "Matematika pecahan itu mudah, seru, dan sangat berguna dalam kehidupan kita!"`;
        }
        return `Semua: "Matematika pecahan itu seru dan adil! Sampai jumpa di pembelajaran berikutnya!"`;
      },

      // Dialog Master 14 Tahapan (10-15 kata per turn)
      dialogueHook: (keys) => `Jordy: "Ghea, bagaimana cara membagi kue agar semua teman kebagian adil?" | Ghea: "Mari kita selidiki ilmu pecahan matematika untuk memecahkan masalah ini!"`,
      dialogueObservation: (keys) => `Pak Roni: "Perhatikan kepingan lingkaran fraksi warna-warni di atas meja ini!" | Jordy: "Semua kepingan jika digabungkan membentuk satu lingkaran utuh sempurna!"`,
      dialogueDefinition: (keys) => `Pak Roni: "Pecahan adalah bilangan yang menunjukkan bagian dari satu kesatuan utuh!" | Ghea: "Setiap bagian wajib dipotong dengan ukuran yang sama persis dan adil!"`,
      dialoguePart1: (keys) => `Pak Roni: "Angka atas disebut pembilang yang menunjukkan potongan yang kita ambil!" | Ghea: "Jika mengambil satu potong, maka angka pembilangnya ditulis angka satu!"`,
      dialoguePart2: (keys) => `Jordy: "Angka bawah disebut penyebut yang menyatakan total seluruh potongan benda!" | Pak Roni: "Jika kue dipotong empat, maka angka penyebutnya ditulis angka empat!"`,
      dialogueMechanism: (keys) => `Pak Roni: "Pecahan senilai memiliki bentuk angka berbeda namun nilai ukurannya sama!" | Ghea: "Kepingan dua per empat ukurannya tepat sama dengan satu per dua!"`,
      dialogueMaintenance: (keys) => `Jordy: "Pecahan sangat bermanfaat saat membantu ibu menakar resep membuat roti!" | Pak Roni: "Kalian juga bisa membagi waktu belajar dan bermain secara seimbang!"`,
      dialoguePitfall: (keys) => `Pak Roni: "Ingat baik-baik, jangan pernah menjumlahkan angka penyebut yang di bawah!" | Jordy: "Hanya angka pembilang di atas yang kita jumlahkan saat menghitung pecahan!"`,
      dialogueCollaboration: (keys) => `Ghea: "Teka-teki pecahan kelompok kita terbukti cocok dengan diagram lingkaran!" | Jordy: "Kerja sama berhitung kita menghasilkan jawaban yang sangat akurat dan rapi!"`,
      dialogueQuizQuestion: (keys) => `Pak Roni: "Berapa nilai pecahan jika dua potong diambil dari empat bagian?" | Ghea: "Ayo hitung cepat teman-teman, sederhanakan juga bentuk pecahannya!"`,
      dialogueQuizAnswer: (keys) => `Jordy: "Nilainya dua per empat atau senilai dengan satu per dua!" | Pak Roni: "Luar biasa pintar, jawaban kalian seratus persen tepat tanpa cela!"`,
      dialogueRealLife: (keys) => `Ghea: "Pecahan melatih kita untuk selalu adil saat berbagi dengan teman!" | Pak Roni: "Sikap jujur dan adil adalah cerminan nilai luhur Pelajar Pancasila!"`,
      dialogueReflection: (keys) => `Pak Roni: "Matematika itu indah, logis, dan memudahkan banyak urusan manusia!" | Jordy: "Belajar matematika bersama Pak Roni ternyata sangat mudah dan menyenangkan!"`,
      dialogueCelebration: (keys) => `Pak Roni: "Hebat sekali, kalian telah menuntaskan pemahaman pecahan dengan gemilang!" | Semua: "Matematika itu seru dan sampai jumpa di petualangan video berikutnya!"`,
    };
  }

  // 5. NORMA, ATURAN, HAK & KEWAJIBAN (PENDIDIKAN PANCASILA)
  if (
    combinedText.includes('norma') ||
    combinedText.includes('aturan') ||
    combinedText.includes('hak') ||
    combinedText.includes('kewajiban') ||
    combinedText.includes('tertib') ||
    combinedText.includes('disiplin') ||
    combinedText.includes('musyawarah') ||
    combinedText.includes('pancasila')
  ) {
    return {
      curiosityHookTitle: 'Misteri Ketertiban Lampu Lalu Lintas',
      curiosityHookQuestionId: 'Apa yang akan terjadi di jalan raya dan di sekolah jika tidak ada lampu lalu lintas dan aturan tata tertib sama sekali?',
      curiosityHookQuestionEn: 'What would happen on busy roads and schools if traffic lights and rules suddenly vanished?',
      mysteryContextId: 'mengamati miniatur persimpangan jalan raya dan suasana kelas yang damai tertib',
      mysteryContextEn: 'inspecting a tabletop city intersection model with working traffic lights and orderly pedestrian crossing',
      conceptDefinitionId: 'Norma dan tata tertib adalah aturan bersama yang dibuat agar kita hidup aman, tertib, damai, dan saling menghargai.',
      conceptDefinitionEn: 'Norms and regulations are mutual societal agreements established to ensure safety, order, and mutual respect.',
      part1Name: 'Kewajiban (Tanggung Jawab yang Wajib Dilaksanakan)',
      part1FunctionId: 'Kewajiban adalah tugas yang harus kita tunaikan dengan ikhlas, seperti belajar rajin dan membersihkan kelas.',
      part1FunctionEn: 'Obligations are moral duties we fulfill earnestly, such as diligent studying and classroom chores.',
      part2Name: 'Hak (Hal Baik yang Berhak Diterima)',
      part2FunctionId: 'Hak adalah hal baik yang kita peroleh setelah menuntaskan kewajiban, seperti mendapatkan rasa aman dan nilai.',
      part2FunctionEn: 'Rights are legitimate entitlements enjoyed after fulfilling duties, including safety, education, and praise.',
      mechanismId: 'Dahulukan kewajiban sebelum hak, dan selesaikan perbedaan pendapat melalui musyawarah mufakat yang santun.',
      mechanismEn: 'Prioritize obligations before claiming rights, and resolve conflicts via courteous consensus deliberation.',
      maintenanceId: 'Menaati tata tertib kelas, datang tepat waktu, mendengarkan bapak ibu guru, dan menjaga fasilitas sekolah.',
      maintenanceEn: 'Honor classroom rules, arrive punctually, listen attentively to teachers, and protect public facilities.',
      pitfallTipId: 'Jangan menuntut hak berlebihan sebelum menuntaskan kewajiban dan jangan melanggar aturan saat tidak diawasi.',
      pitfallTipEn: 'Avoid demanding privileges before executing duties, and never violate rules when unsupervised.',
      collaborationTaskId: 'bermusyawarah membagi jadwal piket kelas dan menyusun kesepakatan belajar bersama',
      collaborationTaskEn: 'deliberating on chore schedules and crafting a collective classroom pledge',
      quizQuestion: 'Mana yang harus kita laksanakan terlebih dahulu: hak atau kewajiban?',
      quizAnswer: 'Kewajiban! Dahulukan kewajiban baru nikmati hakmu dengan bahagia!',
      tpVerificationStatement: `Siswa telah tuntas memahami norma, hak, dan kewajiban sesuai TP [${kodeTP}].`,
      realLifeBenefitId: 'Ketaatan pada norma menciptakan lingkungan yang aman, rukun, dan saling menghormati antarsesama warga.',
      realLifeBenefitEn: 'Respect for norms creates a safe, harmonious community founded upon mutual dignity.',
      goldenTakeawayId: 'Disiplin dan ketaatan pada aturan adalah kunci hidup damai dan saling menghargai.',
      goldenTakeawayEn: 'Discipline and adherence to collective agreements unlock peaceful civic coexistence.',

      // Animasi Relevan Norma & Aturan
      animationScene1Id: 'Miniatur jalan raya dengan lampu lalu lintas bekerja dan zebra cross aman di samping piagam kesepakatan kelas.',
      animationScene1En: 'Miniature city intersection with functioning traffic signal and crosswalk beside classroom pledge charter.',
      animationScene2Id: 'Hologram 3D miniatur jalan raya kota tertib berdampingan dengan suasana musyawarah kelas yang damai saling mendengarkan.',
      animationScene2En: 'Miniature 3D city hologram with orderly traffic signals alongside a peaceful consensus classroom deliberation.',
      animationScene3Id: 'Pohon kesepakatan tata tertib kelas dengan kartu-kartu aturan disiplin dan musyawarah mufakat bertengger harmonis.',
      animationScene3En: 'Classroom agreement pledge tree with green leaves representing discipline, consensus deliberation, and mutual respect.',
      animationScene4Id: 'Lambang Garuda Pancasila emas megah menyinari siswa berjabatan tangan hangat saling menghargai di bawah bendera Merah Putih.',
      animationScene4En: 'Grand golden Garuda Pancasila emblem shining over smiling students shaking hands cordially beneath fluttering red-and-white flags.',

      // Dialog Bersambung 4 Adegan
      dialogueFourScene1: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Ghea, apa yang terjadi jika di jalan raya tidak ada lampu lalu lintas?" | Ghea: "Pasti terjadi kekacauan! Karena itu manusia memerlukan norma dan aturan tertib bersama!"`;
        }
        return `Pak Roni: "Aturan dan norma diciptakan agar masyarakat hidup tertib, aman, dan damai!"`;
      },
      dialogueFourScene2: (keys) => {
        if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
          return `Ghea: "Kewajiban adalah tugas yang harus kita laksanakan dengan penuh rasa tanggung jawab!" | Jordy: "Sedangkan hak adalah hal baik yang kita peroleh setelah menuntaskan kewajiban kita!"`;
        }
        return `Ghea: "Kewajiban wajib kita laksanakan terlebih dahulu sebelum menuntut perolehan hak kita!"`;
      },
      dialogueFourScene3: (keys) => {
        if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
          return `Pak Roni: "Dahulukan kewajiban sebelum hak, dan selesaikan perbedaan melalui musyawarah mufakat santun!" | Ghea: "Menaati tata tertib kelas membuat suasana belajar menjadi nyaman dan aman!"`;
        }
        return `Pak Roni: "Selesaikan setiap perbedaan pendapat melalui musyawarah mufakat yang santun dan adil!"`;
      },
      dialogueFourScene4: (keys) => {
        if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
          return `Jordy: "Disiplin sejati tumbuh dari kesadaran hati kita untuk menghargai orang lain!" | Semua: "Mari patuhi aturan dan jaga kerukunan demi Indonesia yang damai!"`;
        }
        return `Semua: "Patuhi aturan dan hidup rukun selalu! Sampai jumpa di video berikutnya!"`;
      },

      // Dialog Master 14 Tahapan (10-15 kata per turn)
      dialogueHook: (keys) => `Jordy: "Ghea, apa jadinya jalan raya jika lampu lalu lintas mati serentak?" | Ghea: "Pasti terjadi kemacetan parah dan kecelakaan karena semua orang berebut jalan!"`,
      dialogueObservation: (keys) => `Pak Roni: "Perhatikan miniatur jalan raya dan suasana kelas kita yang tertib!" | Jordy: "Saat semua orang menaati rambu-rambu, perjalanan terasa sangat lancar dan aman!"`,
      dialogueDefinition: (keys) => `Pak Roni: "Norma adalah aturan kesepakatan bersama untuk menciptakan ketertiban dan kedamaian masyarakat!" | Ghea: "Norma menjadi pedoman bagi kita untuk selalu berbuat baik dan sopan!"`,
      dialoguePart1: (keys) => `Pak Roni: "Kewajiban adalah tanggung jawab yang harus kita laksanakan dengan ikhlas tulus!" | Ghea: "Contohnya adalah piket membersihkan kelas dan belajar dengan sungguh-sungguh setiap hari!"`,
      dialoguePart2: (keys) => `Jordy: "Sedangkan hak adalah hal baik yang kita terima setelah kewajiban tuntas!" | Pak Roni: "Kalian berhak mendapatkan bimbingan ilmu, rasa aman, dan apresiasi penuh kasih!"`,
      dialogueMechanism: (keys) => `Pak Roni: "Selesaikan setiap perbedaan pendapat di kelas melalui musyawarah mufakat santun!" | Ghea: "Musyawarah melatih kita saling mendengarkan dan menghormati keputusan bersama yang adil!"`,
      dialogueMaintenance: (keys) => `Jordy: "Kita wajib datang tepat waktu dan membuang sampah pada tempatnya!" | Pak Roni: "Disiplin kecil di sekolah membentuk karakter warga negara yang hebat nantinya!"`,
      dialoguePitfall: (keys) => `Pak Roni: "Jangan melanggar aturan meskipun tidak ada bapak ibu guru yang mengawasi!" | Ghea: "Disiplin sejati lahir dari kejujuran hati nurani kita sendiri tanpa paksaan!"`,
      dialogueCollaboration: (keys) => `Ghea: "Jadwal piket kelas kita berhasil disepakati bersama secara musyawarah mufakat!" | Jordy: "Semua teman setuju dan siap menjalankan tugas piket dengan penuh tanggung jawab!"`,
      dialogueQuizQuestion: (keys) => `Pak Roni: "Mana yang harus kita dahulukan terlebih dahulu, hak atau kewajiban?" | Ghea: "Ayo jawab dengan tegas kawan-kawan, hak atau kewajiban yang didahulukan?"`,
      dialogueQuizAnswer: (keys) => `Jordy: "Kewajiban harus didahulukan terlebih dahulu sebelum menuntut perolehan hak kita!" | Pak Roni: "Seratus persen tepat, menuntaskan kewajiban adalah kunci terbukanya hak kita!"`,
      dialogueRealLife: (keys) => `Ghea: "Ketaatan pada norma membuat lingkungan sekolah dan rumah terasa sangat damai!" | Pak Roni: "Masyarakat yang rukun berawal dari warga yang patuh pada tata tertib!"`,
      dialogueReflection: (keys) => `Pak Roni: "Kalian adalah generasi Pelajar Pancasila teladan yang berakhlak mulia dan disiplin!" | Jordy: "Kami bangga menjadi anak Indonesia yang selalu taat aturan dan rukun!"`,
      dialogueCelebration: (keys) => `Pak Roni: "Hebat sekali capaian hari ini, kalian telah memahami norma dengan sempurna!" | Semua: "Patuhi aturan, jaga kedamaian, dan sampai jumpa di video edukasi berikutnya!"`,
    };
  }

  // 6. UNIVERSAL / DEFAULT PEDAGOGICAL BREAKDOWN (Untuk Topik & Mapel Lainnya)
  return {
    curiosityHookTitle: `Misteri Menjelajahi Rahasia ${coreConcept}`,
    curiosityHookQuestionId: `Tahukah kalian, apa rahasia penting di balik ${coreConcept} yang sering kita jumpai di sekitar kita?`,
    curiosityHookQuestionEn: `Have you ever wondered what key principles make "${coreConcept}" work in the world around us?`,
    mysteryContextId: `mengamati fenomena nyata sehari-hari yang berkaitan erat dengan konsep ${coreConcept}`,
    mysteryContextEn: `examining an intriguing real-world demonstration embodying "${coreConcept}"`,
    conceptDefinitionId: `${coreConcept} adalah pemahaman mendasar dalam ${mataPelajaran} mengenai cara kerja dan prinsip hal di sekitar kita agar bermanfaat bagi manusia.`,
    conceptDefinitionEn: `"${coreConcept}" is the foundational knowledge in ${mataPelajaran} explaining how things function systematically for human benefit.`,
    part1Name: `Unsur Pokok 1: Struktur & Prinsip Dasar ${coreConcept}`,
    part1FunctionId: `Bagian awal ini bertugas membentuk fondasi utama agar kita dapat ${actionVerb.toLowerCase()} materi secara logis.`,
    part1FunctionEn: `This primary element forms the core logic allowing students to ${actionVerb.toLowerCase()} systematically.`,
    part2Name: `Unsur Pokok 2: Penerapan & Cara Kerja Nyata`,
    part2FunctionId: `Bagian kedua ini membuktikan bagaimana ${coreConcept} bekerja dalam praktik dan menghasilkan manfaat nyata.`,
    part2FunctionEn: `This secondary element demonstrates how "${coreConcept}" operates in practice delivering real outcomes.`,
    mechanismId: `Setiap tahapan saling terhubung secara runtut dari pemahaman dasar hingga pembuktian hasil akhir.`,
    mechanismEn: `Each step links progressively from foundational concept to empirical practical verification.`,
    maintenanceId: `Menerapkan pemahaman ${coreConcept} secara rutin, teliti, dan penuh tanggung jawab dalam kehidupan nyata.`,
    maintenanceEn: `Apply knowledge of "${coreConcept}" regularly with precision and responsibility in daily experiences.`,
    pitfallTipId: `Perhatikan langkah-langkahnya dengan cermat dan jangan terburu-buru menyimpulkan tanpa bukti nyata.`,
    pitfallTipEn: 'Observe every step attentively and avoid rushing into conclusions without verification.',
    collaborationTaskId: `bekerja sama menganalisis data, memecahkan tantangan, dan membuktikan capaian materi`,
    collaborationTaskEn: `collaborating to investigate evidence, solve challenges, and prove learning mastery`,
    quizQuestion: `Kuis kilat: apa hal terpenting yang harus kita kuasai saat mempelajari ${coreConcept}?`,
    quizAnswer: `Memahami konsep dasarnya dan berlatih secara cermat serta konsisten!`,
    tpVerificationStatement: `Siswa telah tuntas mencapai kompetensi ${actionVerb.toLowerCase()} ${coreConcept} sesuai TP [${kodeTP}]: ${tujuanPembelajaran}.`,
    realLifeBenefitId: `Penguasaan ${coreConcept} melatih kita berpikir kritis, mandiri, dan mampu menyelesaikan masalah di kehidupan nyata.`,
    realLifeBenefitEn: `Mastering "${coreConcept}" develops critical thinking, independence, and real-world problem-solving dexterity.`,
    goldenTakeawayId: `Belajar dengan rasa ingin tahu yang tinggi membuka pintu pengetahuan luas yang bermanfaat bagi sesama.`,
    goldenTakeawayEn: 'Learning with genuine curiosity unlocks boundless wisdom to serve society and community.',

    // Animasi Relevan Universal
    animationScene1Id: `Alat peraga edukasi konsep ${coreConcept} di atas meja belajar dengan pencahayaan lembut yang siap diaktifkan.`,
    animationScene1En: `Interactive educational learning manipulative for "${coreConcept}" neatly arranged on desk under soft light.`,
    animationScene2Id: `Hologram visual 3D konsep ${coreConcept} bercahaya melayang anggun di tengah meja, memperlihatkan struktur komponen utama yang berputar harmonis.`,
    animationScene2En: `Luminous 3D hologram of "${coreConcept}" floating gracefully above the desk displaying primary components rotating in harmony.`,
    animationScene3Id: `Simulasi interaktif 3D langkah demi langkah membuktikan mekanisme kerja ${coreConcept} dalam menyelesaikan tantangan nyata secara terukur.`,
    animationScene3En: `Interactive 3D step-by-step simulation demonstrating the operational mechanism of "${coreConcept}" solving real-world challenges.`,
    animationScene4Id: `Visual peraga penerapan praktis ${coreConcept} di kehidupan nyata dengan efek bintang keberhasilan dan senyum hangat karakter.`,
    animationScene4En: `Practical real-life demonstration visuals of "${coreConcept}" highlighted by celebratory ambient star sparkles.`,

    // Dialog Bersambung 4 Adegan Universal (10-15 kata per turn)
    dialogueFourScene1: (keys) => {
      if (keys.includes('ghea') && (keys.includes('jordy') || keys.includes('pakRoni'))) {
        return `Ghea: "Jordy, tahukah kamu apa rahasia penting di balik materi ${coreConcept} ini?" | Jordy: "Tahu! Konsep ${coreConcept} membantu kita memahami cara kerja hal penting di lingkungan sekitar!"`;
      }
      return `Pak Roni: "Konsep ${coreConcept} membantu kita memahami cara kerja hal penting di sekitar kita!"`;
    },
    dialogueFourScene2: (keys) => {
      if (keys.includes('jordy') && (keys.includes('ghea') || keys.includes('pakRoni'))) {
        return `Jordy: "Wah, lihat model hologram 3D ini! Semua komponen ${coreConcept} tersusun sangat rapi!" | Ghea: "Benar! Setiap bagian memiliki tugas khusus yang saling mendukung satu sama lain!"`;
      }
      return `Ghea: "Model 3D ini memperlihatkan bagaimana seluruh komponen materi saling mendukung harmonis!"`;
    },
    dialogueFourScene3: (keys) => {
      if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
        return `Pak Roni: "Amati bagaimana proses kerja ${coreConcept} berlangsung secara runtut dan teratur!" | Jordy: "Langkah-langkah pembuktian ini membuat kita makin yakin dan paham secara mendalam!"`;
      }
      return `Pak Roni: "Proses kerja materi ini berjalan secara runtut dan menghasilkan manfaat nyata!"`;
    },
    dialogueFourScene4: (keys) => {
      if (keys.includes('pakRoni') && (keys.includes('ghea') || keys.includes('jordy'))) {
        return `Pak Roni: "Kalian telah membuktikan pemahaman mendalam tentang ${coreConcept} secara tuntas dan mandiri!" | Semua: "Belajar hal baru sungguh menyenangkan dan sampai jumpa di video berikutnya!"`;
      }
      return `Semua: "Belajar hal baru membuka wawasan luas! Sampai jumpa di video berikutnya!"`;
    },

    // Dialog Master 14 Tahapan (10-15 kata per turn)
    dialogueHook: (keys) => `Pak Roni: "Tahukah kalian rahasia besar di balik materi ${coreConcept} ini?" | Ghea: "Bagaimana cara kerja dan penerapannya dalam kehidupan kita sehari-hari, Pak?"`,
    dialogueObservation: (keys) => `Ghea: "Lihat benda peraga konkret ini dengan teliti kawan-kawan semua!" | Jordy: "Ada pola kerja yang sangat teratur dan mudah untuk kita pelajari!"`,
    dialogueDefinition: (keys) => `Pak Roni: "Konsep ${coreConcept} membantu kita memecahkan masalah di kehidupan sehari-hari dengan cerdas!" | Ghea: "Penjelasannya sangat gamblang dan mudah dicerna oleh kita semua di kelas!"`,
    dialoguePart1: (keys) => `Pak Roni: "Kenali bagian intinya dengan saksama sebagai fondasi awal pemahaman materi!" | Jordy: "Bagian pokok pertama ini menjadi kunci penting untuk langkah penyelidikan berikutnya!"`,
    dialoguePart2: (keys) => `Ghea: "Model visual interaktif ini memperjelas bagian kedua secara gamblang dan menarik!" | Jordy: "Kita bisa melihat fungsi khususnya dengan sangat detail dan mudah dimengerti!"`,
    dialogueMechanism: (keys) => `Pak Roni: "Perhatikan bagaimana mekanisme kerja materi ini berlangsung langkah demi langkah!" | Ghea: "Semua alur prosesnya saling terhubung logis dari awal sampai pembuktian akhir!"`,
    dialogueMaintenance: (keys) => `Jordy: "Bagaimana cara menerapkan pengetahuan ini dalam kegiatan kita sehari-hari di rumah?" | Pak Roni: "Praktikkan ilmunya secara teliti, bertanggung jawab, dan bermanfaat bagi orang lain!"`,
    dialoguePitfall: (keys) => `Pak Roni: "Ingat tips penting ini, jangan terburu-buru menyimpulkan tanpa memeriksa data nyata!" | Ghea: "Ketelitian dan kehati-hatian selalu membuahkan hasil belajar yang akurat dan memuaskan!"`,
    dialogueCollaboration: (keys) => `Ghea: "Hasil kerja sama kelompok kita berhasil membuktikan kebenaran konsep materi!" | Jordy: "Kolaborasi aktif membuat tantangan belajar yang rumit terasa sangat ringan dikerjakan!"`,
    dialogueQuizQuestion: (keys) => `Pak Roni: "Kuis kilat untuk kalian semua, apa inti terpenting dari materi ini?" | Ghea: "Ayo teman-teman di rumah, tebak jawaban yang paling tepat dan cermat!"`,
    dialogueQuizAnswer: (keys) => `Jordy: "Kuncinya adalah memahami prinsip dasarnya dan tekun berlatih secara teratur!" | Pak Roni: "Tepat sekali, ketekunan kalian dalam belajar membuahkan prestasi yang sangat membanggakan!"`,
    dialogueRealLife: (keys) => `Pak Roni: "Ilmu pengetahuan yang kalian kuasai adalah bekal meraih cita-cita mulia!" | Ghea: "Kami makin termotivasi untuk terus mengeksplorasi banyak hal baru di sekolah!"`,
    dialogueReflection: (keys) => `Pak Roni: "Miliki rasa ingin tahu yang tinggi untuk menyingkap keajaiban semesta ini!" | Jordy: "Belajar hal baru membuka wawasan luas dan melatih daya pikir kritis!"`,
    dialogueCelebration: (keys) => `Pak Roni: "Luar biasa, kalian telah menuntaskan seluruh capaian pembelajaran dengan sangat gemilang!" | Semua: "Tetap semangat belajar dan sampai jumpa di petualangan video edukasi berikutnya!"`,
  };
}

// =============================================================================
// 7. VIDEO PEMBELAJARAN 3D (ASET KARAKTER + PROMPT GAMBAR + PROMPT VIDEO)
// =============================================================================
export function generateVideoPromptForTP(
  tp: TPItem,
  fase: string,
  kelas: string,
  mataPelajaran: string,
  style: VisualStyleType = 'pixar',
  formatOverride?: MediaOutputFormat,
  themeSetting?: MediaPromptThemeSetting,
  characterMode?: MediaPromptCharacterMode,
  customCharacters?: MediaPromptCharacterCustomSelection,
  aspectRatio: MediaPromptAspectRatio = 'landscape',
  sceneCount: MediaPromptSceneCount = 'auto'
): MediaPromptVideo {
  const { coreConcept, actionVerb, tujuanPembelajaran, kodeTP } = extractConceptFromTP(tp, mataPelajaran);
  const subjectTools = getSubjectLearningTools(mataPelajaran, coreConcept);
  const styleConfig = VISUAL_STYLES[style] || VISUAL_STYLES.pixar;
  const gradeLabel = `Kelas ${kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3')} SD`;
  const formatRule = FORMAT_SPECIFIC_DIRECTIVES[formatOverride || 'video'] || FORMAT_SPECIFIC_DIRECTIVES.video;

  // 1. DEKOMPOSISI MATERI PEDAGOGIS EDUKATIF MENDALAM
  const pedagogy = decomposeMateriForPedagogicalVideo(
    tp,
    mataPelajaran,
    coreConcept,
    actionVerb,
    tujuanPembelajaran,
    kodeTP
  );

  // 2. RESOLUSI TEMA BUSANA & LATAR DINAMIS SESUAI MATA PELAJARAN, TOPIK & TUJUAN PEMBELAJARAN
  const themeConfig = resolveTopicAdaptiveThemeAndAttire(
    themeSetting,
    mataPelajaran,
    coreConcept,
    tujuanPembelajaran,
    kodeTP
  );
  const activeThemeKey = (themeConfig.id || 'auto') as Exclude<MediaPromptThemeSetting, 'auto'>;
  const effectiveMode: MediaPromptCharacterMode = characterMode || 'dynamic';

  // 3. RESOLUSI FORMAT RASIO ASPEK (LANDSCAPE 16:9 ATAU PORTRAIT 9:16)
  const isPortrait = aspectRatio === 'portrait';
  const ratioLabel = isPortrait
    ? '9:16 Portrait Vertikal (Shorts / Reels / TikTok / Smartphone)'
    : '16:9 Widescreen Landscape (Standar TV / Proyektor / YouTube / Layar Lebar)';
  const ratioTag = isPortrait ? '9:16' : '16:9';
  const compositionPromptEn = isPortrait
    ? 'aspect ratio 9:16 vertical smartphone composition, centered character blocking with visible expressive gestures, high vertical headroom, optimized for vertical mobile screens and social video feeds'
    : 'aspect ratio 16:9 widescreen landscape framing, balanced rule-of-thirds cinematic horizontal composition, rich atmospheric classroom or nature environment';

  // 4. JUMLAH ADEGAN DINAMIS (Fleksibel & Cerdas Berdasarkan Materi TP - Default 4 Adegan Hemat & Utuh)
  let effectiveSceneCount: number;
  if (typeof sceneCount === 'number') {
    effectiveSceneCount = Math.min(Math.max(sceneCount, 4), 14);
  } else {
    // Mode 'auto': Opsi standar hemat adegan dan bersambung utuh (4 adegan)
    const tpText = `${tp.rumusanTP || ''} ${tp.lingkupMateri || ''} ${tp.kompetensi || ''}`.toLowerCase();
    const isComplex =
      tpText.includes('menganalisis') ||
      tpText.includes('memecahkan masalah') ||
      tpText.includes('mengevaluasi') ||
      tpText.includes('merancang') ||
      tpText.includes('campuran') ||
      tpText.includes('ekosistem') ||
      tpText.length > 95;

    if (isComplex) {
      effectiveSceneCount = 6; // Untuk topik sangat kompleks
    } else {
      effectiveSceneCount = 4; // Format 4 adegan andalan: hemat adegan, materi mudah dipahami, penjelasan mantap
    }
  }

  // Resolusi tokoh per adegan
  const allSceneChars = Array.from({ length: effectiveSceneCount }, (_, i) =>
    resolveSceneCharacters(effectiveMode, i + 1, customCharacters, effectiveSceneCount)
  );

  // Kumpulkan tokoh unik yang hadir di video ini
  const uniqueCharKeys = new Set<'pakRoni' | 'ghea' | 'jordy'>();
  allSceneChars.forEach((sc) => sc.activeKeys.forEach((k) => uniqueCharKeys.add(k)));
  if (uniqueCharKeys.size === 0) {
    uniqueCharKeys.add('pakRoni');
    uniqueCharKeys.add('ghea');
    uniqueCharKeys.add('jordy');
  }

  // ASET KARAKTER KONSISTEN
  const characterAssets: MediaPromptCharacterAsset[] = Array.from(uniqueCharKeys).map((charKey) =>
    getCharacterAssetForTheme(charKey, themeConfig, style)
  );

  const activeCharacterNames = Array.from(uniqueCharKeys).map((k) =>
    k === 'pakRoni' ? 'Pak Roni' : k === 'ghea' ? 'Ghea' : 'Jordy'
  );

  // Helper deskripsi visual karakter untuk prompt gambar
  const formatSceneCharactersEn = (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => {
    return keys
      .map((k) => {
        const trait = PERMANENT_CHARACTER_PHYSICAL_TRAITS[k];
        const attire =
          k === 'pakRoni'
            ? themeConfig.pakRoniAttireEn
            : k === 'ghea'
            ? themeConfig.gheaAttireEn
            : themeConfig.jordyAttireEn;
        return `${trait.name} (${trait.physicalTraitsEn}, wearing ${attire})`;
      })
      .join('. ');
  };

  // 5. BLUEPRINT ADEGAN PEDAGOGIS EDUKATIF
  interface SceneBlueprint {
    title: string;
    actionId: string;
    actionEn: string;
    expressionId: string;
    expressionEn: string;
    secondaryId: string;
    secondaryEn: string;
    cameraEn: string;
    relevantAnimationId: string;
    relevantAnimationEn: string;
    buildDialogue: (keys: ('pakRoni' | 'ghea' | 'jordy')[]) => string;
  }

  // Blueprint Khusus 4 Adegan Utuh Terpadu (Apersepsi Hook -> Animasi 3D Muncul -> Pendalaman Fenomena -> Rangkuman & Penutup)
  const fourSceneBlueprints: SceneBlueprint[] = [
    // Adegan 1: Apersepsi & Hook Pemantik Rasa Penasaran
    {
      title: `Apersepsi & Pengenalan Konsep: ${pedagogy.curiosityHookTitle}`,
      actionId: `memantik rasa penasaran dengan pertanyaan "${pedagogy.curiosityHookQuestionId}" sambil menunjuk peraga awal (${subjectTools.deskPropsId}) di ${themeConfig.environmentId}, yang langsung dijawab ramah menjelaskan konsep dasar materi`,
      actionEn: `spark curiosity with question "${pedagogy.curiosityHookQuestionEn}" gesturing to concrete classroom props (${subjectTools.deskPropsEn}) in ${themeConfig.environmentEn}, seamlessly introducing foundational concept with friendly expressions`,
      expressionId: 'Mata berbinar penuh rasa ingin tahu, senyum ramah menyapa hangat, artikulatif dan antusias',
      expressionEn: 'Warm curious eyes sparkling with excitement, friendly teacher and student smile, natural articulate demeanor',
      secondaryId: 'Pendaran cahaya pagi lembut menerangi meja belajar, peraga awal tertata rapi',
      secondaryEn: 'Soft morning light illuminating neat study desk and tangible props',
      cameraEn: isPortrait
        ? 'Vertical medium shot, tracking friendly eye contact and expressive natural hand gestures in 9:16 mobile composition'
        : 'Cinematic medium two-shot with smooth slow dolly-in framing characters and desk props in balanced 16:9 widescreen',
      relevantAnimationId: pedagogy.animationScene1Id,
      relevantAnimationEn: pedagogy.animationScene1En,
      buildDialogue: pedagogy.dialogueFourScene1,
    },
    // Adegan 2: Animasi 3D Muncul — Eksplorasi Sistem & Komponen
    {
      title: `Animasi 3D Interaktif: Eksplorasi Struktur & Sistem ${coreConcept}`,
      actionId: `takjub mengamati animasi visual 3D / hologram interaktif yang menyala bercahaya di depan mereka (${pedagogy.animationScene2Id}), menjelaskan komponen dan struktur utama materi secara runtut`,
      actionEn: `marvel at luminous 3D hologram animation appearing dynamically before them (${pedagogy.animationScene2En}), explaining primary components and functional structure with precision`,
      expressionId: 'Ekspresi takjub gembira, mata membesar antusias mengamati peraga 3D, gestur menunjuk kagum',
      expressionEn: 'Awe-struck delight, enthusiastic sparkling eyes reflecting luminous hologram, animated pointing gestures',
      secondaryId: 'Pendaran partikel hologram lembut melayang anggun di udara memukau pandangan',
      secondaryEn: 'Translucent floating 3D volumetric particles with gentle cinematic glow',
      cameraEn: isPortrait
        ? 'Vertical dynamic low-angle tracking shot capturing awe-filled faces and the glowing 3D animation hovering in 9:16 frame'
        : 'Cinematic 90-degree orbital arc shot gliding smoothly around characters and glowing 3D center animation in 16:9 widescreen',
      relevantAnimationId: pedagogy.animationScene2Id,
      relevantAnimationEn: pedagogy.animationScene2En,
      buildDialogue: pedagogy.dialogueFourScene2,
    },
    // Adegan 3: Pendalaman Mekanisme & Fenomena Nyata
    {
      title: `Pendalaman Mekanisme & Fenomena Nyata: ${coreConcept}`,
      actionId: `mengamati animasi bergerak dinamis yang membuktikan cara kerja dan fenomena unik (${pedagogy.animationScene3Id}), mendiskusikan mekanisme detail dengan penuh pemahaman`,
      actionEn: `interact with dynamic animation demonstrating intricate mechanism and real-world phenomenon (${pedagogy.animationScene3En}), discussing key principles with deep clarity`,
      expressionId: 'Fokus cermat, senyum puas memahami cara kerja ilmiah, anggukan mantap saling mengonfirmasi',
      expressionEn: 'Focused concentration, joyful scientific comprehension, affirming nods and collaborative engagement',
      secondaryId: 'Animasi bergerak mulus memperlihatkan keteraturan proses secara detail dan harmonis',
      secondaryEn: 'Smooth mechanical or biological animation cycles with crisp shallow depth of field',
      cameraEn: isPortrait
        ? 'Vertical medium close-up following characters interacting with dynamic moving details of the 3D model in 9:16 frame'
        : 'Slow cinematic push-in focusing on characters analyzing dynamic interactive animation on the display in 16:9 widescreen',
      relevantAnimationId: pedagogy.animationScene3Id,
      relevantAnimationEn: pedagogy.animationScene3En,
      buildDialogue: pedagogy.dialogueFourScene3,
    },
    // Adegan 4: Dampak Nyata, Rangkuman Tuntas & Penutup Memikat
    {
      title: `Dampak Nyata, Rangkuman Tuntas & Salam Penutup: ${coreConcept}`,
      actionId: `memperlihatkan dampak nyata dan manfaat materi (${pedagogy.animationScene4Id}), merangkum pesan kunci capaian TP [${kodeTP}], lalu tersenyum hangat melambaikan tangan ke arah kamera`,
      actionEn: `showcase real-world impacts and life benefits (${pedagogy.animationScene4En}), summarize core learning takeaway, and wave warm smiling farewell directly to audience`,
      expressionId: 'Puas bangga, gembira penuh semangat, senyum lebar tulus menyapa ramah penonton',
      expressionEn: 'Radiant happiness, triumphant learning mastery, warm energetic farewell wave directly to viewers',
      secondaryId: 'Efek visual keemasan hangat merayakan keberhasilan belajar, suasana menyenangkan',
      secondaryEn: 'Warm celebratory golden ambient glow, subtle positive sparkles floating gently',
      cameraEn: isPortrait
        ? 'Vertical eye-level shot capturing all characters smiling and waving warmly directly into the vertical smartphone screen'
        : 'Cinematic wide pull-back shot with characters waving enthusiastically framed by beautiful educational environment in 16:9',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueFourScene4,
    },
  ];

  // Master katalog 14 tahapan adegan edukasi mendalam
  const masterSceneBlueprints: SceneBlueprint[] = [
    // 1. Adegan 1: Hook & Pertanyaan Pemantik Rasa Penasaran
    {
      title: `Apersepsi: ${pedagogy.curiosityHookTitle}`,
      actionId: `memperkenalkan tantangan rasa ingin tahu: "${pedagogy.curiosityHookQuestionId}" sambil ${pedagogy.mysteryContextId} di ${themeConfig.environmentId}`,
      actionEn: `raise the curiosity question "${pedagogy.curiosityHookQuestionEn}" while ${pedagogy.mysteryContextEn} in ${subjectTools.categoryName}`,
      expressionId: 'Mata berbinar penuh rasa ingin tahu, tersenyum ramah menyapa penonton, ekspresi misteri memikat',
      expressionEn: 'Warm, charismatic, enthusiastic eyes sparkling with curiosity, friendly engaging smile',
      secondaryId: 'Pendaran cahaya lembut pagi, ruangan belajar asri tertata rapi, bayangan alami halus',
      secondaryEn: 'Subtle morning dust motes, gentle natural light reflections, orderly setting',
      cameraEn: isPortrait
        ? 'Vertical medium close-up shot, gentle slow tilt down focusing on friendly curious expressions'
        : 'Cinematic slow dolly push-in toward characters in balanced landscape framing',
      relevantAnimationId: pedagogy.animationScene1Id,
      relevantAnimationEn: pedagogy.animationScene1En,
      buildDialogue: pedagogy.dialogueHook,
    },
    // 2. Adegan 2: Observasi Fenomena & Objek Nyata
    {
      title: 'Observasi Fenomena & Benda Konkret',
      actionId: `mengamati fenomena nyata dan benda konkret (${subjectTools.deskPropsId}) untuk meneliti keteraturan ${coreConcept}`,
      actionEn: `inspect and interact with concrete props (${subjectTools.deskPropsEn}) observing real-world manifestation of "${coreConcept}"`,
      expressionId: 'Fokus menyelidiki, mata jeli mengamati petunjuk, senyum antusias menemukan pola',
      expressionEn: 'Thoughtful concentration, observant gaze, joyful curiosity exploring tangible patterns',
      secondaryId: 'Alat peraga tertata rapi, bayangan lembut alami di atas meja kerja',
      secondaryEn: 'Tools and manipulatives neatly arranged, natural ambient reflections',
      cameraEn: isPortrait
        ? 'Vertical close-up tracking hands and expressive curious eyes'
        : 'Cinematic orbital medium shot circling the hands-on inspection desk',
      relevantAnimationId: pedagogy.animationScene1Id,
      relevantAnimationEn: pedagogy.animationScene1En,
      buildDialogue: pedagogy.dialogueObservation,
    },
    // 3. Adegan 3: Penjelasan Konsep Inti (Apa Itu Materi?)
    {
      title: `Konsep Inti: Apa Itu ${coreConcept}?`,
      actionId: `menjelaskan secara gamblang dan menyenangkan definisi inti: ${pedagogy.conceptDefinitionId}`,
      actionEn: `explain core definition: "${pedagogy.conceptDefinitionEn}" with clarity and warmth`,
      expressionId: 'Senyum ramah mengedukasi, gestur tangan terbuka komunikatif, artikulatif santun',
      expressionEn: 'Encouraging, clear expressive articulation, approachable teacher and student demeanor',
      secondaryId: 'Diagram konsep ramah anak terpampang rapi dengan ilustrasi ceria',
      secondaryEn: 'Clean educational infographic background with soft atmospheric lighting',
      cameraEn: isPortrait
        ? 'Vertical medium shot framing friendly upper body gestures and clear facial clarity'
        : 'Cinematic eye-level medium close-up shot with smooth gentle pan',
      relevantAnimationId: pedagogy.animationScene2Id,
      relevantAnimationEn: pedagogy.animationScene2En,
      buildDialogue: pedagogy.dialogueDefinition,
    },
    // 4. Adegan 4: Komponen & Fungsi Bagian 1
    {
      title: `Komponen & Fungsi 1: ${pedagogy.part1Name}`,
      actionId: `memperagakan bagian ${pedagogy.part1Name} dan menjelaskan fungsi khususnya: ${pedagogy.part1FunctionId}`,
      actionEn: `demonstrate "${pedagogy.part1Name}" explaining its specific vital function: "${pedagogy.part1FunctionEn}"`,
      expressionId: 'Fokus menerangkan, tangan menunjuk bagian dengan presisi, ekspresi takjub',
      expressionEn: 'Clear instructional focus, precise pointing gesture, delighted learning expression',
      secondaryId: 'Sorotan cahaya terarah pada komponen yang sedang dijelaskan',
      secondaryEn: 'Focused gentle spotlight illuminating the active component and hands',
      cameraEn: isPortrait
        ? 'Vertical tight shot zooming in on character gestures and component details'
        : 'Medium side-angle tracking shot focusing on hands-on component demonstration',
      relevantAnimationId: pedagogy.animationScene2Id,
      relevantAnimationEn: pedagogy.animationScene2En,
      buildDialogue: pedagogy.dialoguePart1,
    },
    // 5. Adegan 5: Komponen & Fungsi Bagian 2 (Model Visual 3D)
    {
      title: `Komponen & Fungsi 2: ${pedagogy.part2Name}`,
      actionId: `mengamati model visual interaktif (${pedagogy.animationScene2Id}) untuk ${pedagogy.part2Name}: ${pedagogy.part2FunctionId}`,
      actionEn: `interact with 3D luminous model (${pedagogy.animationScene2En}) showing "${pedagogy.part2Name}": "${pedagogy.part2FunctionEn}"`,
      expressionId: 'Takjub gembira, mata membesar antusias melihat visual interaktif bercahaya',
      expressionEn: 'Awe, wonder, bright sparkling eyes reflecting magical interactive glow',
      secondaryId: 'Pendaran visual hologram lembut melayang anggun di udara',
      secondaryEn: 'Soft translucent volumetric hologram with floating gentle particles',
      cameraEn: isPortrait
        ? 'Vertical dynamic low-angle looking up at glowing model and awe-filled faces'
        : 'Slow cinematic arc shot gliding 90-degrees around glowing demonstration table',
      relevantAnimationId: pedagogy.animationScene2Id,
      relevantAnimationEn: pedagogy.animationScene2En,
      buildDialogue: pedagogy.dialoguePart2,
    },
    // 6. Adegan 6: Cara Kerja & Mekanisme Runtut
    {
      title: 'Cara Kerja & Mekanisme Runtut',
      actionId: `memperagakan bagaimana proses kerja ${coreConcept} berlangsung: ${pedagogy.mechanismId}`,
      actionEn: `demonstrate step-by-step mechanism of "${coreConcept}": "${pedagogy.mechanismEn}"`,
      expressionId: 'Cermat, percaya diri mendemonstrasikan proses, senyum puas melihat alur tepat',
      expressionEn: 'Confident mastery, smooth precise movement, joyful scientific discovery',
      secondaryId: 'Alur proses bekerja mulus tanpa hambatan, pantulan cahaya harmonis',
      secondaryEn: 'Smooth mechanical or organic motion, subtle depth of field blur',
      cameraEn: isPortrait
        ? 'Vertical tracking shot following the step-by-step movement'
        : 'Overhead 45-degree angle descending smoothly to eye level',
      relevantAnimationId: pedagogy.animationScene3Id,
      relevantAnimationEn: pedagogy.animationScene3En,
      buildDialogue: pedagogy.dialogueMechanism,
    },
    // 7. Adegan 7: Cara Menjaga, Merawat & Menerapkan
    {
      title: 'Penerapan & Cara Merawat / Menjaga',
      actionId: `mempraktikkan cara merawat atau menerapkan materi dalam kehidupan sehari-hari: ${pedagogy.maintenanceId}`,
      actionEn: `practice daily real-world care or application of "${coreConcept}": "${pedagogy.maintenanceEn}"`,
      expressionId: 'Penuh kepedulian, telaten, ramah, gestur merawat dengan kasih sayang',
      expressionEn: 'Caring, nurturing attitude, practical empathy, warm responsible demeanor',
      secondaryId: 'Nuansa lingkungan bersih, asri, sehat, dan penuh energi positif',
      secondaryEn: 'Warm wholesome natural environment, vibrant clean ambiance',
      cameraEn: isPortrait
        ? 'Vertical medium shot capturing practical action and heartfelt smiles'
        : 'Cinematic wide-to-medium transition showing characters and healthy environment',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueMaintenance,
    },
    // 8. Adegan 8: Tips Cerdas & Hal yang Harus Dihindari
    {
      title: 'Tips Cerdas: Hindari Kesalahan',
      actionId: `mengingatkan tips penting pencegah kekeliruan: ${pedagogy.pitfallTipId}`,
      actionEn: `share critical safety tip or misconception warning: "${pedagogy.pitfallTipEn}"`,
      expressionId: 'Perhatian peduli, gestur mengingatkan dengan ramah dan santun, senyum bijak',
      expressionEn: 'Friendly cautionary gesture, caring instructional gaze, reassuring smile',
      secondaryId: 'Ikon checklist hijau dan tanda pengingat ramah anak di papan kecil',
      secondaryEn: 'Small desk organizer with friendly checklist visual markers',
      cameraEn: isPortrait
        ? 'Vertical close-up focusing on sincere communicative facial cues'
        : 'Medium two-shot tracking friendly advisor gestures and attentive listening',
      relevantAnimationId: pedagogy.animationScene3Id,
      relevantAnimationEn: pedagogy.animationScene3En,
      buildDialogue: pedagogy.dialoguePitfall,
    },
    // 9. Adegan 9: Kolaborasi Sebaya & Pemecahan Masalah
    {
      title: 'Kolaborasi Sebaya: Menguji Pemahaman',
      actionId: `bekerja sama dalam kelompok kecil ${pedagogy.collaborationTaskId}`,
      actionEn: `collaborate in small peer group ${pedagogy.collaborationTaskEn}`,
      expressionId: 'Kompak, bersemangat saling mendukung, senyum ceria kerja sama',
      expressionEn: 'Joyful teamwork, lively cooperative synergy, mutual encouragement',
      secondaryId: 'Catatan hasil kolaborasi tertata rapi di atas meja belajar bersama',
      secondaryEn: 'Shared study table with organized cards, clean notebooks, and color pens',
      cameraEn: isPortrait
        ? 'Vertical group shot capturing all collaborative smiles in a close cozy circle'
        : 'Cinematic two-shot panning between students collaborating actively',
      relevantAnimationId: pedagogy.animationScene3Id,
      relevantAnimationEn: pedagogy.animationScene3En,
      buildDialogue: pedagogy.dialogueCollaboration,
    },
    // 10. Adegan 10: Kuis Kilat Cek Pemahaman Penonton
    {
      title: 'Kuis Kilat: Tantangan Pemahaman Interaktif',
      actionId: `menghadap ramah ke arah kamera mengajak penonton menjawab kuis materi: "${pedagogy.quizQuestion}"`,
      actionEn: `engage audience directly with interactive quiz question: "${pedagogy.quizQuestion}"`,
      expressionId: 'Mengajak interaksi, tersenyum ceria, alis terangkat ramah menantang penonton',
      expressionEn: 'Inviting, playful direct address, warm engaging eye contact with camera',
      secondaryId: 'Kartu kuis beranimasi ceria dengan tanda tanya ramah anak',
      secondaryEn: 'Clean playful quiz card graphic floating subtly with soft ambient sparkle',
      cameraEn: isPortrait
        ? 'Vertical direct-to-camera eye-level shot inviting viewer interaction'
        : 'Medium center-framed shot breaking the 4th wall with cheerful friendly gaze',
      relevantAnimationId: pedagogy.animationScene2Id,
      relevantAnimationEn: pedagogy.animationScene2En,
      buildDialogue: pedagogy.dialogueQuizQuestion,
    },
    // 11. Adegan 11: Kunci Jawaban Kuis & Pembuktian Capaian TP
    {
      title: `Verifikasi Kuis & Capaian TP [${kodeTP}]`,
      actionId: `membuka kunci jawaban kuis ("${pedagogy.quizAnswer}") dan menegaskan bahwa ${pedagogy.tpVerificationStatement}`,
      actionEn: `reveal quiz answer ("${pedagogy.quizAnswer}") triumphantly verifying mastery of TP [${kodeTP}]`,
      expressionId: 'Puas bangga, mengacungkan jempol ceria, senyum merekah gembira',
      expressionEn: 'Triumphant satisfaction, cheerful thumbs-up, beaming genuine smiles',
      secondaryId: 'Tanda bintang emas atau centang hijau berkilau lembut menandakan keberhasilan',
      secondaryEn: 'Golden celebratory star sparkle, bright positive classroom backdrop',
      cameraEn: isPortrait
        ? 'Vertical medium shot with upbeat slight zoom-in celebrating correct answer'
        : 'Dynamic medium shot tracking proud affirming gesture and cheerful smiles',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueQuizAnswer,
    },
    // 12. Adegan 12: Koneksi Nyata bagi Masa Depan
    {
      title: 'Manfaat Nyata: Bekal Masa Depan',
      actionId: `menjelaskan manfaat nyata ilmu pengetahuan ini: ${pedagogy.realLifeBenefitId}`,
      actionEn: `illustrate tangible life benefits: "${pedagogy.realLifeBenefitEn}"`,
      expressionId: 'Penuh inspirasi, mata berbinar menatap optimis masa depan, senyum bijak',
      expressionEn: 'Inspiring, visionary optimism, warm encouragement for lifelong learning',
      secondaryId: 'Cahaya keemasan hangat menerangi ruang belajar melambangkan masa depan cerah',
      secondaryEn: 'Warm golden volumetric rays symbolizing hopeful future possibilities',
      cameraEn: isPortrait
        ? 'Vertical medium shot tracking inspiring upward gaze and hopeful smiles'
        : 'Slow cinematic dolly-out showcasing characters framed by warm hopeful ambiance',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueRealLife,
    },
    // 13. Adegan 13: Refleksi Emas Mutiara Pemahaman
    {
      title: 'Refleksi Emas: Mutiara Pemahaman',
      actionId: `merenungkan pesan hikmah dan intisari penting: ${pedagogy.goldenTakeawayId}`,
      actionEn: `reflect on deep golden takeaway: "${pedagogy.goldenTakeawayEn}"`,
      expressionId: 'Tenang, penuh rasa syukur, senyum damai yang hangat dan mendalam',
      expressionEn: 'Serene contemplation, heartfelt gratitude, peaceful harmonious presence',
      secondaryId: 'Suasana tenang asri, pencahayaan lembut meneduhkan hati penonton',
      secondaryEn: 'Tranquil serene atmosphere with soft comforting ambient lighting',
      cameraEn: isPortrait
        ? 'Vertical slow gentle zoom on serene, thankful expressions'
        : 'Gentle cinematic drift framing characters in peaceful reflective stillness',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueReflection,
    },
    // 14. Adegan 14: Selebrasi Prestasi & Salam Penutup Ramah
    {
      title: 'Selebrasi Prestasi: Salam Pelajar Pancasila',
      actionId: `merayakan tuntasnya pembelajaran ${coreConcept} dengan melambaikan tangan ceria ke arah penonton`,
      actionEn: `celebrate joyful learning achievement of "${coreConcept}" and wave warm smiling farewell to students`,
      expressionId: 'Gembira bersorak ceria, melambaikan tangan ramah, senyum lebar penuh semangat',
      expressionEn: 'Joyful radiant happiness, warm energetic wave, friendly infectious enthusiasm',
      secondaryId: 'Konfeti warna-warni lembut melayang lambat di udara merayakan kesuksesan',
      secondaryEn: 'Soft colorful celebratory confetti floating gently in warm sunlight',
      cameraEn: isPortrait
        ? 'Vertical final medium shot, characters waving warmly right into the smartphone screen'
        : 'Cinematic wide pull-back shot with all characters waving enthusiastically together',
      relevantAnimationId: pedagogy.animationScene4Id,
      relevantAnimationEn: pedagogy.animationScene4En,
      buildDialogue: pedagogy.dialogueCelebration,
    },
  ];

  // Pilih susunan adegan terbaik sesuai effectiveSceneCount (4, 6, 8, 10, 12, atau 14 adegan)
  const selectedBlueprints: SceneBlueprint[] = [];
  if (effectiveSceneCount <= 4) {
    // 4 Adegan (Format Hemat & Utuh Bersambung seperti Video Edukasi):
    selectedBlueprints.push(...fourSceneBlueprints.slice(0, 4));
  } else if (effectiveSceneCount <= 6) {
    // 6 Adegan: 1. Hook Pemantik -> 3. Definisi Konsep Inti -> 4. Komponen 1 & Fungsi -> 6. Cara Kerja Runtut -> 7. Cara Menjaga/Menerapkan -> 14. Selebrasi Prestasi
    [0, 2, 3, 5, 6, 13].forEach((idx) => {
      if (masterSceneBlueprints[idx]) selectedBlueprints.push(masterSceneBlueprints[idx]);
    });
  } else if (effectiveSceneCount <= 8) {
    // 8 Adegan: 1. Hook Pemantik -> 3. Definisi Konsep Inti -> 4. Komponen 1 & Fungsi -> 5. Komponen 2 & Visual 3D -> 6. Cara Kerja Runtut -> 7. Cara Menjaga/Menerapkan -> 10. Kuis Kilat Cek Pemahaman -> 14. Selebrasi Prestasi
    [0, 2, 3, 4, 5, 6, 9, 13].forEach((idx) => {
      if (masterSceneBlueprints[idx]) selectedBlueprints.push(masterSceneBlueprints[idx]);
    });
  } else if (effectiveSceneCount <= 10) {
    // 10 Adegan: Lengkap dengan Observasi Nyata (1), Tips Cerdas (7), dan Kuis Kilat (9)
    [0, 1, 2, 3, 4, 5, 6, 7, 9, 13].forEach((idx) => {
      if (masterSceneBlueprints[idx]) selectedBlueprints.push(masterSceneBlueprints[idx]);
    });
  } else if (effectiveSceneCount <= 12) {
    // 12 Adegan: Eksplorasi Menyeluruh dengan Kolaborasi Sebaya (8) dan Verifikasi Kunci Kuis (10)
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13].forEach((idx) => {
      if (masterSceneBlueprints[idx]) selectedBlueprints.push(masterSceneBlueprints[idx]);
    });
  } else {
    // 14 Adegan: Seluruh 14 tahap masterclass video edukasi
    selectedBlueprints.push(...masterSceneBlueprints.slice(0, 14));
  }

  // 6. GENERATE PROMPT GAMBAR KEYFRAME TIAP ADEGAN (STRICTLY NO ON-SCREEN TEXT)
  const sceneImages: MediaPromptSceneImage[] = selectedBlueprints.map((bp, idx) => {
    const scNumber = idx + 1;
    const sceneChars = allSceneChars[idx] || allSceneChars[0];
    const dialogueLine = bp.buildDialogue(sceneChars.activeKeys);

    return {
      sceneNumber: scNumber,
      sceneTitle: `ADEGAN ${scNumber} — ${bp.title.toUpperCase()} (${sceneChars.characterNames})`,
      durationEstimate: '8 detik',
      mood: bp.expressionId,
      characters: sceneChars.characterNames,
      aspectRatio: ratioTag,
      relevantAnimation: bp.relevantAnimationId,
      promptGambarScene: `ADEGAN ${scNumber} — ${bp.title.toUpperCase()}
Durasi estimasi: 8 detik
Format Rasio: ${ratioLabel} (--ar ${ratioTag})
Mata Pelajaran: ${subjectTools.categoryName} (${gradeLabel})
Materi Pokok: ${coreConcept}
Tujuan Pembelajaran [${kodeTP}]: ${tujuanPembelajaran}
Tema Latar & Busana: ${themeConfig.label}
Tokoh yang Hadir: ${sceneChars.characterNames} (${sceneChars.sceneRoleSummary})

3D Pixar-inspired animation style.
${compositionPromptEn}.
CHARACTERS: ${formatSceneCharactersEn(sceneChars.activeKeys)}.
SCENE: ${sceneChars.characterNames} ${bp.actionEn}.
ENVIRONMENT: ${themeConfig.environmentEn}.
ATMOSPHERE & CAMERA: ${bp.cameraEn}, ${themeConfig.cameraAtmosphereEn}.
EXPRESSION & MIMIC: ${bp.expressionEn}.
RELEVANT 3D ANIMATION / VISUAL PROPS: ${bp.relevantAnimationEn}.
LIGHTING & SECONDARY: ${bp.secondaryEn}.
SCENE STORY CONTEXT (FOR EXPRESSION & BODY POSING ONLY — DO NOT RENDER ANY TEXT ON IMAGE): Characters actively discuss "${dialogueLine}".
CRITICAL DIRECTIVE: STRICTLY NO ON-SCREEN TEXT, NO SUBTITLES, NO CAPTIONS, NO SPEECH BUBBLES, NO WORDS, NO TYPOGRAPHY, NO WATERMARKS. Pure cinematic illustration without typography.
NEGATIVE: text, subtitles, captions, speech bubbles, words, typography, logo, watermark, distorted faces, missing limbs, extra fingers, blurry, low resolution, unnatural eyes, bad proportions`,
      negativePrompt:
        'text, subtitles, captions, speech bubbles, words, typography, logo, watermark, distorted faces, missing limbs, extra fingers, blurry, low resolution, unnatural eyes, bad proportions',
    };
  });

  // 7. GENERATE PROMPT VIDEO ANIMASI TIAP ADEGAN (8 DETIK, DIALOG MULAI 0.5s, JEDA AKHIR 0.5s, 10-15 KATA)
  const sceneVideos: MediaPromptSceneVideo[] = selectedBlueprints.map((bp, idx) => {
    const scNumber = idx + 1;
    const sceneChars = allSceneChars[idx] || allSceneChars[0];
    const dialogueLine = bp.buildDialogue(sceneChars.activeKeys);

    return {
      sceneNumber: scNumber,
      sceneTitle: `Adegan ${scNumber}: ${bp.title} (${sceneChars.characterNames})`,
      characters: sceneChars.characterNames,
      action: `${sceneChars.characterNames} ${bp.actionId} di ${themeConfig.environmentId}. Seluruh aksi selaras dengan capaian tujuan pembelajaran [${kodeTP}].`,
      expression: bp.expressionId,
      secondary: bp.secondaryId,
      camera: bp.cameraEn,
      dialogue: dialogueLine,
      relevantAnimation: bp.relevantAnimationId,
      timingPacing:
        'Percakapan dimulai detik 00:00.5s dengan tempo normal, jelas dan ramah (~10–15 kata per giliran). Waktu bicara efektif 7,0 detik (00:00.5s - 00:07.5s). Jeda transisi akhir adegan tepat 0,5 detik (00:07.5s - 00:08.0s) untuk transisi mulus dan dinamis ke adegan berikutnya.',
      promptVideoScene: `Adegan ${scNumber}: ${bp.title}
Mata Pelajaran: ${subjectTools.categoryName} (${gradeLabel}) | Materi: ${coreConcept} | Capaian [${kodeTP}]
Format Rasio Video: ${ratioTag} (${ratioLabel})
Durasi: 8 detik tepat | Gerakan Halus Sinematik
Tema Busana & Latar: ${themeConfig.label}

3D Pixar-inspired animation style. ${compositionPromptEn}.
CHARACTERS: ${formatSceneCharactersEn(sceneChars.activeKeys)}.
ACTION: ${sceneChars.characterNames} ${bp.actionEn} in ${themeConfig.environmentEn}.
EXPRESSION & MIMIC: ${bp.expressionEn}. Warm, engaging, lively lip-sync matching spoken dialogue.
RELEVANT 3D ANIMATION / VISUAL PROPS: ${bp.relevantAnimationEn}.
SECONDARY MOTION: ${bp.secondaryEn}.
CAMERA MOVEMENT: ${bp.cameraEn}, smooth cinematic motion.
CRITICAL DIRECTIVE: NO ON-SCREEN SUBTITLES, NO TEXT OVERLAYS, NO SPEECH BUBBLES, NO CAPTIONS. Spoken dialogue is strictly AUDIO VOICE-OVER (VO) / speech track, NOT rendered as visual text on screen.
AUDIO / DIALOGUE (VOICE-OVER ONLY — 10-15 WORDS PER TURN — 100% BAHASA INDONESIA):
"${dialogueLine}"
TIMING & PACING: Spoken dialogue starts promptly at timestamp 00:00.5s at normal, articulate, friendly educational pacing (~10-15 words per turn, effective speech duration 00:00.5s to 00:07.5s = 7.0 seconds). Intonation and facial expressions are warm, engaging, and synchronized with 3D animation. Leave a crisp 0.5-second buffer at the end (00:07.5s - 00:08.0s) for a clean seamless cut to the next scene.
NEGATIVE: text, subtitles, captions, speech bubbles, words, titles, typography, watermark, morphing, jump cuts, glitch, distorted hands, bad audio sync, unnatural body shifts, extra limbs`,
      negativePrompt:
        'text, subtitles, captions, speech bubbles, words, titles, typography, watermark, morphing, jump cuts, glitch, distorted hands, bad audio sync, unnatural body shifts, extra limbs',
    };
  });

  const fullPromptCharactersOnly = `================================================================================
BAGIAN 1: PROMPT ASET KARAKTER REFERENSI (${characterAssets.length} TOKOH TERPILIH)
Tema Busana & Latar: ${themeConfig.label}
Instruksi: Generate gambar aset karakter ini terlebih dahulu sebagai referensi awal (Image Reference).
Nama dan ciri fisik (wajah, rambut, mata) wajib 100% konsisten di semua adegan!
================================================================================

${characterAssets
  .map(
    (ca, idx) =>
      `${idx + 1}. ASET KARAKTER: ${ca.name.toUpperCase()} (${ca.role.toUpperCase()})
${ca.promptCharacterAsset}`
  )
  .join('\n\n--------------------------------------------------------------------------------\n\n')}`;

  const fullPromptSceneImagesOnly = `================================================================================
BAGIAN 2: PROMPT GAMBAR KEYFRAME (${effectiveSceneCount} ADEGAN BERURUTAN)
Materi Pokok: ${coreConcept} | Capaian TP: [${kodeTP}]
Format Rasio: ${ratioLabel} (--ar ${ratioTag})
Instruksi Sutradara: Gunakan aset karakter Bagian 1 sebagai konsistensi karakter.
ATURAN MUTLAK: BEBAS DARI SEMUA TEKS / SUBTITLE / WATERMARK PADA GAMBAR!
================================================================================

${sceneImages
  .map((si) => si.promptGambarScene)
  .join('\n\n--------------------------------------------------------------------------------\n\n')}`;

  const fullPromptSceneVideosOnly = `================================================================================
BAGIAN 3: PROMPT VIDEO GERAK & SULIH SUARA (${effectiveSceneCount} ADEGAN BERSAMBUNG UTUH)
Durasi: 8 detik per klip (~${effectiveSceneCount * 8} detik total video utuh)
Format Rasio: ${ratioLabel}
Instruksi Sutradara:
1. Dialog dimulai tepat pada detik 00:00.5s dengan kecepatan normal dan artikulatif (10-15 kata per giliran).
2. Waktu bicara efektif 7,0 detik, menyisakan jeda transisi akhir tepat 0,5 detik (00:07.5s - 00:08.0s) yang mulus.
3. Setiap adegan didukung animasi visual 3D / hologram interaktif yang relevan dengan materi.
4. DILARANG KERAS MENAMPILKAN TEKS DI LAYAR. Teks dialog adalah murni naskah suara (Voice Over / Dubbing).
================================================================================

${sceneVideos
  .map((sv) => sv.promptVideoScene)
  .join('\n\n--------------------------------------------------------------------------------\n\n')}`;

  const fullPromptVideoAI = `${STRICT_INDONESIAN_LANGUAGE_MANDATE}

PAKET LENGKAP PROMPT VIDEO PEMBELAJARAN 3D (SUTRADARA EDUKASI SD)
Tujuan Pembelajaran [${tp.kodeTP}]: ${tp.rumusanTP}
Mata Pelajaran: ${mataPelajaran} (${gradeLabel})
Lingkup Materi: ${coreConcept}
Gaya Visual: ${styleConfig.label} (${styleConfig.renderKeywords})
Format Rasio: ${ratioLabel}
Jumlah Adegan: ${effectiveSceneCount} Adegan (Durasi total ~${effectiveSceneCount * 8} detik, @8 detik per klip)
Tema Busana & Latar: ${themeConfig.label} (${themeConfig.shortDesc})
Mode Kehadiran Tokoh: ${effectiveMode === 'dynamic' ? 'Dinamis Bergantian (1, 2, atau 3 Tokoh Sesuai Alur Cerita)' : effectiveMode}
Tokoh Utama: ${activeCharacterNames.join(', ')}

STANDAR SUTRADARA FILM EDUKASI SD (VIDEO UTUH BERSAMBUNG):
- Struktur Adegan: Dirancang sebagai satu kesatuan video utuh yang jika digabungkan dialognya bersambung alami dari awal hingga akhir.
- Timing & Pacing Dialog: Percakapan dimulai tepat di detik ke 0,5 (00:00.5s), intonasi hangat, artikulatif, dan kecepatan normal jelas (~10-15 kata per turn).
- Durasi Bicara Efektif: 7,0 detik (00:00.5s - 00:07.5s), menyisakan jeda transisi akhir tepat 0,5 detik (00:07.5s - 00:08.0s) yang mulus dan dinamis tanpa hening panjang.
- Dukungan Animasi Relevan: Setiap penjelasan dalam adegan didukung secara eksplisit oleh animasi visual 3D / hologram interaktif yang memvisualisasikan materi secara hidup.
- ATURAN MUTLAK BEBAS TEKS (100% NO TEXT ON SCREEN): Teks dialog adalah murni naskah audio (Voice Over / Dubbing / Lip Sync). DILARANG KERAS menampilkan teks dialog, subtitle, atau tulisan pada gambar dan video!

PANDUAN ALUR PRODUKSI VIDEO AI:
1. LANGKAH 1 (Aset Karakter): Generate ${characterAssets.length} karakter (${activeCharacterNames.join(', ')}) dari Bagian 1 sebagai foto referensi utama (Image Reference).
2. LANGKAH 2 (Gambar Keyframe): Generate gambar keyframe ${effectiveSceneCount} adegan dari Bagian 2 menggunakan referensi karakter Bagian 1 dalam rasio ${ratioTag}.
3. LANGKAH 3 (Video & Dialog): Masukkan gambar adegan ke AI Video Generator (Image-to-Video) dan tempelkan prompt video Bagian 3.
4. LANGKAH 4 (Sulih Suara / Dubbing): Rekam narasi dan dialog Bahasa Indonesia sesuai naskah dialog singkat tiap adegan.

${fullPromptCharactersOnly}

${fullPromptSceneImagesOnly}

${fullPromptSceneVideosOnly}

================================================================================
REKOMENDASI PLATFORM AI VIDEO & GAMBAR:
- Video AI (Image-to-Video): Runway Gen-3 Alpha, Kling AI 1.5, Luma Ray 2, Hailuo Minimax, OpenAI Sora, Pika Labs.
- Gambar Keyframe: Midjourney v6, OpenAI DALL-E 3, Google Imagen 3, Leonardo AI, Flux.1.
- Voice Over / Dubbing: ElevenLabs (Multilingual Bahasa Indonesia), Google Cloud Text-to-Speech, CapCut Auto Voice.
================================================================================`;

  const pedomanGuruIndo = `Pedoman Sutradara & Pemanfaatan Video Pembelajaran 3D di Kelas (${subjectTools.categoryName} - ${coreConcept}):
Target Capaian [${kodeTP}]: ${tujuanPembelajaran}
Format Rasio: ${ratioLabel} | Jumlah Adegan: ${effectiveSceneCount} Adegan (@8 detik)
Tema Busana & Latar: ${themeConfig.label}

1. Tahap Apersepsi & Motivasi (Adegan 1): Putar Adegan 1 sebagai pembuka pelajaran untuk memantik rasa ingin tahu murid terhadap masalah nyata ${coreConcept}. Pertanyaan pemantik langsung dijawab dengan definisi awal secara artikulatif.
2. Tahap Eksplorasi Konsep & Animasi 3D (Adegan 2 & 3): Visualisasi konkret dan hologram 3D mempermudah siswa memahami mekanisme materi (${subjectTools.deskPropsId}). Guru dapat mem-pause video sejenak untuk menanyakan: "Apa yang kalian amati dari perputaran model 3D tadi?"
3. Tahap Dampak Nyata & Rangkuman Tuntas (Adegan ${effectiveSceneCount}): Kunci pemahaman dengan rangkuman dampak nyata dan penegasan bahwa capaian [${kodeTP}] telah tuntas dengan gemilang! Seluruh adegan menyatu utuh tanpa jeda canggung.`;

  return {
    title: `Video Pembelajaran 3D: Petualangan Menjelajahi ${coreConcept}`,
    videoTitle: `Petualangan ${coreConcept} (${themeConfig.badge})`,
    totalScenes: effectiveSceneCount,
    targetAudience: gradeLabel,
    visualStyle: styleConfig.label,
    themeSetting: activeThemeKey,
    themeLabel: themeConfig.label,
    settingDescription: themeConfig.shortDesc,
    characterMode: effectiveMode,
    characterModeLabel:
      effectiveMode === 'dynamic'
        ? 'Dinamis Bergantian (1, 2, atau 3 Tokoh)'
        : effectiveMode === 'trio'
        ? 'Trio Lengkap (Pak Roni, Ghea, Jordy)'
        : effectiveMode === 'duo_students'
        ? 'Duo Murid (Ghea & Jordy)'
        : effectiveMode === 'solo_pak_roni'
        ? 'Solo Guru (Pak Roni)'
        : effectiveMode === 'solo_ghea'
        ? 'Solo Siswi (Ghea)'
        : effectiveMode === 'solo_jordy'
        ? 'Solo Siswa (Jordy)'
        : 'Kustom Pilihan Pengguna',
    aspectRatio,
    aspectRatioLabel: ratioLabel,
    sceneCountPreference: sceneCount,
    activeCharacterNames,
    characterAssets,
    sceneImages,
    sceneVideos,
    fullPromptVideoAI,
    fullPromptCharactersOnly,
    fullPromptSceneImagesOnly,
    fullPromptSceneVideosOnly,
    pedomanGuruIndo,
    recommendedAspectRatio: ratioLabel,
    formatDirectiveSummary: formatRule.description,
  };
}

export function generateMediaPromptsForTPList(
  tpList: TPItem[],
  identitas: SchoolIdentity,
  preferredStyle: VisualStyleType = 'pixar',
  outputFormat: MediaOutputFormat = 'slide',
  themeSetting?: MediaPromptThemeSetting,
  characterMode?: MediaPromptCharacterMode,
  customCharacters?: MediaPromptCharacterCustomSelection,
  aspectRatio: MediaPromptAspectRatio = 'landscape',
  sceneCount: MediaPromptSceneCount = 'auto'
): MediaPromptDocument {
  const fase = identitas.fase || 'Fase B';
  const mataPelajaran = identitas.mataPelajaran || 'Mata Pelajaran SD';
  const kelas = identitas.kelas || (fase === 'Fase A' ? '1' : fase === 'Fase C' ? '5' : '3');
  const formatConfig = FORMAT_SPECIFIC_DIRECTIVES[outputFormat] || FORMAT_SPECIFIC_DIRECTIVES.slide;

  const items: TPMediaPromptItem[] = tpList.map((tp, index) => {
    const itemKelas = tp.kelasTarget || kelas;
    const slide = generateSlidePresentationForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle, outputFormat);
    const video = generateVideoPromptForTP(
      tp,
      fase,
      itemKelas,
      mataPelajaran,
      preferredStyle,
      outputFormat,
      themeSetting,
      characterMode,
      customCharacters,
      aspectRatio,
      sceneCount
    );
    const notebook = generateNotebookForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle, outputFormat);
    const flashcard = generateFlashcardForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle, outputFormat);
    const infografis = generateInfographicForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle, outputFormat);
    const petakonsep = generateMindMapForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle, outputFormat);
    const komik = generateComicForTP(tp, fase, itemKelas, mataPelajaran, preferredStyle);

    return {
      id: `media-prompt-${tp.kodeTP || index + 1}-${Date.now()}`,
      kodeTP: tp.kodeTP || `TP-${index + 1}`,
      rumusanTP: tp.rumusanTP,
      kompetensi: tp.kompetensi,
      lingkupMateri: tp.lingkupMateri,
      elemen: tp.elemen,
      kelas: itemKelas,
      fase,
      mataPelajaran,
      slide,
      video,
      notebook,
      flashcard,
      infografis,
      petakonsep,
      komik,
      formatSpecificDirectives: {
        format: outputFormat,
        summary: formatConfig.description,
        rules: formatConfig.rules,
      },
    };
  });

  return {
    id: `doc-media-prompt-${Date.now()}`,
    tanggalDibuat: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    identitas,
    selectedMataPelajaran: mataPelajaran,
    selectedFase: fase,
    selectedKelas: kelas,
    visualStylePreference: preferredStyle,
    selectedOutputFormat: outputFormat,
    formatInstructionApplied: formatConfig.title,
    items,
  };
}
