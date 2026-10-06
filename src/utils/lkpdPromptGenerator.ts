export interface LKPDVisualPromptOptions {
  judulAktivitas: string;
  pertemuanKe: number;
  topikMateri: string;
  mataPelajaran: string;
  kelas: string;
  fase: string;
  modelPembelajaran: string;
  fokusTarget: string;
  petunjukAktivitas?: string[];
  langkahKerja?: { nomor?: number; langkahKerja: string; hasilJawabanPlaceholder?: string }[];
  pertanyaanPemantik?: string;
  refleksiSesi?: string;
  namaSekolah?: string;
}

/**
 * Merekap Prompt Desain Visual LKPD Per Pertemuan untuk Gemini AI / Gemini Gems / Canva AI
 */
export function generateLKPDVisualPrompt(opts: LKPDVisualPromptOptions): string {
  const stepsText = (opts.langkahKerja || [])
    .map((s, idx) => `   - Langkah ${s.nomor || idx + 1}: ${s.langkahKerja}`)
    .join('\n');

  const instructionsText = (opts.petunjukAktivitas || [])
    .map((pt, idx) => `   ${idx + 1}. ${pt}`)
    .join('\n');

  // Variasi Bingkai & Skema Warna Khusus Per Pertemuan
  const frameStyles = [
    'Bingkai Garis Ganda Biru Indigo (#1e3a8a) dengan Sudut Hiasan Edukatif Bintang',
    'Bingkai Garis Ganda Hijau Zamrud (#065f46) dengan Hiasan Daun / Eksplorasi Alam',
    'Bingkai Garis Ganda Kuning Emas (#92400e) dengan Hiasan Lencana Prestasi',
    'Bingkai Garis Ganda Ungu Kerajaan (#581c87) dengan Hiasan Kristal / Kreativitas',
    'Bingkai Garis Ganda Merah Mawar (#881337) with Hiasan Obor Semangat Belajar',
  ];
  const meetingFrame = frameStyles[(opts.pertemuanKe - 1) % frameStyles.length];

  return `🎨 PROMPT DESAIN VISUAL LKPD SIAP CETAK (GEMINI AI / GEMINI GEMS / CANVA AI)
================================================================================

Role: Senior Instructional Designer & Professional Graphic Specialist Sekolah.
Tugas: Buatkan Lembar Kerja Peserta Didik (LKPD) yang Sangat Indah, Menarik, Ramah Anak (Child-Friendly), Berstruktur Akademis Rapi, dan Siap Cetak (Format A4) untuk Kegiatan Belajar Berkelompok.

📌 INFORMASI IDENTITAS KELOMPOK (LEMBAR KERJA MAKSIMAL 6 ANGGOTA):
- Satuan Pendidikan : ${opts.namaSekolah || 'SD/SMP/SMA'}
- Mata Pelajaran    : ${opts.mataPelajaran}
- Kelas / Fase      : ${opts.kelas} / ${opts.fase}
- Topik / Pertemuan : ${opts.judulAktivitas} (Pertemuan Ke-${opts.pertemuanKe})
- Model Pembelajaran: ${opts.modelPembelajaran}

🎯 TUGAS & FOKUS AKTIVITAS KELOMPOK:
"${opts.fokusTarget}"

📝 ISI RINCIAN LKPD PERTEMUAN KE-${opts.pertemuanKe}:
A. PETUNJUK KERJA KELOMPOK (BAHASA RAMAH ANAK & KOMUNIKATIF):
${instructionsText || '   1. Yuk, berdoalah bersama kelompokmu sebelum memulai kegiatan!\n   2. Bekerjasamalah dengan rukun dan bagi peran secara adil.'}

B. TAHAP PENYELIDIKAN & EKSPLORASI KELOMPOK:
${stepsText || '   - Amati benda/gambar di mejamu dan catat hasil diskusimu dengan rapi!'}

C. PERTANYAAN DISKUSI ANALISIS KELOMPOK (SESUAI TINGKAT USIA SISWA):
   "${opts.pertanyaanPemantik || `Menurut kelompokmu, mengapa materi ${opts.topikMateri} ini penting dan bagaimana contoh sederhananya di sekitar kita?`}"

D. REFLEKSI CERIA KELOMPOK:
   "${opts.refleksiSesi || 'Hal baru dan menyenangkan apa yang kelompokmu dapatkan hari ini?'}"

================================================================================
🎨 INSTRUKSI DESAIN VISUAL & BINGKAI DEKORATIF KHUSUS (PERTEMUAN KE-${opts.pertemuanKe}):
1. TEMA BINGKAI & PINGGIRAN (FRAME DESIGN):
   - Gunakan gaya bingkai unik: ${meetingFrame}.
   - Pinggiran halaman A4 diberi batas garis ganda yang tegas, profesional, dan indah saat dicetak.

2. HEADER BOX KELOMPOK RAPI (MAKSIMAL 6 SISWA):
   - Dibuat dalam Kotak Rapi Bergaris di Bagian Atas Lembar Kerja:
     ---------------------------------------------------------------------------
     [ NAMA KELOMPOK : ........................ | HARI/TANGGAL: ................ ]
     [ MATA PELAJARAN: ${opts.mataPelajaran} | KELAS/PERTEMUAN: Kelas ${opts.kelas} (Ke-${opts.pertemuanKe}) ]
     ---------------------------------------------------------------------------
     👥 ANGGOTA KELOMPOK (MAKSIMAL 6 ANGGOTA):
     1. ........................................ (Ketua)    4. ........................................
     2. ........................................               5. ........................................
     3. ........................................               6. ........................................
     ---------------------------------------------------------------------------

3. GAYA VISUAL & DESAIN RAMAH ANAK:
   - Font Sans-Serif Edukatif (Futura / Montserrat / Arial Round) yang jernih & mudah dibaca anak-anak.
   - Hiasan vektor/kartun edukatif seputar "${opts.topikMateri}".
   - Kontras warna yang indah (Ramah dicetak Hitam-Putih / Fotokopi maupun Berwarna).

4. TABEL EKSPLORASI & KOTAK JAWABAN LUAS:
   - Tabel eksplorasi dengan garis sel tebal dan garis putus-putus tempat siswa menulis jawaban.
   - Kotak "Refleksi Kelompok" & "Nilai / Paraf Guru" di bagian bawah dengan ikon apresiasi bintang.

Output yang Diharapkan:
Hasilkan desain visual lembar LKPD lengkap, ramah anak, dan sangat estetis yang siap diunduh, dicetak, dan dibagikan langsung kepada peserta didik di kelas!`;
}

/**
 * Merekap Seluruh Prompt LKPD Semua Pertemuan dalam Satu Berkas Terstruktur
 */
export function generateFullModuleLKPDVisualPrompt(
  totalMeetings: number,
  topic: string,
  subject: string,
  kelas: string,
  fase: string,
  model: string,
  activities: LKPDVisualPromptOptions[]
): string {
  const meetingPrompts = activities
    .map((act) => generateLKPDVisualPrompt(act))
    .join('\n\n--------------------------------------------------------------------------------\n\n');

  return `🚀 PROMPT UTAMA GEMINI GEMS / CANVA AI: PAKET DESAIN VISUAL LKPD PERTEMUAN 1 S.D. ${totalMeetings}
================================================================================
Mata Pelajaran : ${subject}
Kelas / Fase   : ${kelas} / ${fase}
Topik Utama    : ${topic}
Model Belajar  : ${model}
Jumlah LKPD    : ${totalMeetings} Pertemuan (Lengkap Berkelompok 6 Anggota)

${meetingPrompts}`;
}
