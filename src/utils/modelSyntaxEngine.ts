/**
 * Mesin Penyusun Langkah Pembelajaran & Sintaks Model Pembelajaran
 * Sesuai Standar Kurikulum Merdeka & Pendekatan Pembelajaran Mendalam (Kemendikdasmen)
 *
 * Prinsip Utama:
 * 1. Menggunakan Bahasa Indonesia yang lugas, jelas, dan mudah dipahami oleh Guru maupun Murid SD (tanpa istilah asing yang membingungkan).
 * 2. Kegiatan Awal dirancang bervariasi untuk setiap pertemuan dan relevan dengan materi:
 *    - WAJIB memuat doa bersama dan mengecek kehadiran murid di setiap pertemuan.
 *    - Aktivitas pemanasan/pengondisian bervariasi di tiap pertemuan dan berkorelasi dengan topik (Pertemuan 1: permainan asah otak fokus materi; Pertemuan 2: lagu edukatif bertema materi; Pertemuan 3: cerita kontekstual/benda nyata; Pertemuan 4: tebak cepat/peragaan berpasangan; Pertemuan 5+: berbagi pengalaman nyata murid).
 *    - WAJIB memuat Pertanyaan Pemantik yang berbeda di setiap pertemuan sesuai target capaian pertemuan tersebut dan relevan dengan Tujuan Pembelajaran (TP).
 * 3. Kegiatan Inti dan Kegiatan Akhir berkembang secara bertahap dari pertemuan pertama hingga pertemuan terakhir.
 */

export type ModelPembelajaranType =
  | 'PBL'
  | 'PJBL'
  | 'DISCOVERY'
  | 'INQUIRY'
  | 'ROLE_PLAY'
  | 'DIFERENSIASI'
  | 'COOPERATIVE'
  | 'KONTEKSTUAL';

export function detectModelType(rawModel?: string): ModelPembelajaranType {
  const s = String(rawModel || '').toLowerCase();
  if (s.includes('project') || s.includes('pjbl') || s.includes('proyek')) return 'PJBL';
  if (s.includes('discovery') || s.includes('penemuan')) return 'DISCOVERY';
  if (s.includes('inkuiri') || s.includes('inquiry') || s.includes('terbimbing')) return 'INQUIRY';
  if (s.includes('peran') || s.includes('simulasi') || s.includes('role play') || s.includes('roleplay')) return 'ROLE_PLAY';
  if (s.includes('diferensiasi') || s.includes('differentiated') || s.includes('tarl')) return 'DIFERENSIASI';
  if (s.includes('kooperatif') || s.includes('cooperative') || s.includes('jigsaw') || s.includes('stad')) return 'COOPERATIVE';
  if (s.includes('kontekstual') || s.includes('contextual') || s.includes('ctl')) return 'KONTEKSTUAL';
  return 'PBL';
}

export function getIndonesianModelName(rawModel?: string): string {
  const mType = detectModelType(rawModel);
  switch (mType) {
    case 'PJBL':
      return 'Pembelajaran Berbasis Proyek (PjBL)';
    case 'DISCOVERY':
      return 'Pembelajaran Penemuan (Discovery Learning)';
    case 'INQUIRY':
      return 'Pembelajaran Penyelidikan Terbimbing (Inkuiri)';
    case 'ROLE_PLAY':
      return 'Bermain Peran dan Simulasi';
    case 'DIFERENSIASI':
      return 'Pembelajaran Berdiferensiasi';
    case 'COOPERATIVE':
      return 'Pembelajaran Kooperatif (Kerja Kelompok Terstruktur)';
    case 'KONTEKSTUAL':
      return 'Pembelajaran Kontekstual (CTL)';
    default:
      return 'Pembelajaran Berbasis Masalah (PBL)';
  }
}

export function isSyntaxMatchingModel(firstFase: string, model: string): boolean {
  if (!firstFase) return false;
  const mType = detectModelType(model);
  const s = firstFase.toLowerCase();
  if (mType === 'PJBL') return s.includes('pertanyaan') || s.includes('proyek') || s.includes('pjbl') || s.includes('karya');
  if (mType === 'DISCOVERY') return s.includes('rangsangan') || s.includes('penemuan') || s.includes('discovery') || s.includes('data');
  if (mType === 'INQUIRY') return s.includes('inkuiri') || s.includes('penyelidikan') || s.includes('fenomena') || s.includes('dugaan');
  if (mType === 'ROLE_PLAY') return s.includes('peran') || s.includes('skenario') || s.includes('simulasi');
  if (mType === 'DIFERENSIASI') return s.includes('diferensiasi') || s.includes('kesiapan');
  if (mType === 'COOPERATIVE') return s.includes('kooperatif') || s.includes('tujuan') || s.includes('kelompok');
  if (mType === 'KONTEKSTUAL') return s.includes('konstruktivisme') || s.includes('kontekstual') || s.includes('ctl') || s.includes('pengalaman');
  if (mType === 'PBL') return s.includes('masalah') || s.includes('pbl') || s.includes('penyelidikan');
  return true;
}

export interface ModelSyntaxItem {
  faseSintaks: string;
  alokasiMenit: string;
  aktivitasGuru: string;
  aktivitasSiswa: string;
  pengalamanBelajar: string;
  prinsipPembelajaran: string;
}

export interface PedagogicalPlanOptions {
  mediaList?: string[];
  perangkatList?: string[];
  platformList?: string[];
  metodeList?: string[];
  pendekatan?: string;
  budayaBelajar?: string[];
  lingkunganFisik?: string[];
}

export interface PedagogicalMeetingPlan {
  stageName: string;
  stageFocus: string;
  pendahuluan: string[];
  kegiatanInti: ModelSyntaxItem[];
  penutup: string[];
}

/**
 * Membersihkan istilah asing pada teks langkah pembelajaran agar 100% ramah dipahami guru & murid SD.
 */
export function sanitizeForeignPedagogicalTerms(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\(\s*Start with Essential Question\s*\)/gi, '')
    .replace(/\(\s*Essential Question\s*\)/gi, '')
    .replace(/\(\s*Design a Plan for the Project\s*\)/gi, '')
    .replace(/\(\s*Plan\s*&\s*Schedule\s*\)/gi, '')
    .replace(/\(\s*Create a Schedule\s*\)/gi, '')
    .replace(/\(\s*Executing the Project\s*\)/gi, '')
    .replace(/\(\s*Monitoring Progress\s*\)/gi, '')
    .replace(/\(\s*Monitor Project Progress\s*\)/gi, '')
    .replace(/\(\s*Monitor Progress\s*\)/gi, '')
    .replace(/\(\s*Assess the Outcome\s*\)/gi, '')
    .replace(/\(\s*Evaluate the Experience\s*\)/gi, '')
    .replace(/\(\s*Evaluate Experience\s*\)/gi, '')
    .replace(/\(\s*Gallery Walk Setup\s*\)/gi, '')
    .replace(/\(\s*Gallery Walk\s*\/\s*Sharing\s*\)/gi, '(Pameran Karya & Berbagi Hasil)')
    .replace(/\(\s*Showcase\s*\/\s*Gallery Walk\s*\)/gi, '(Pameran Karya Kelas)')
    .replace(/\(\s*Gallery Walk\s*\)/gi, '(Pameran Karya Kelas)')
    .replace(/\bGallery Walk\b/gi, 'pameran karya kunjung kelompok')
    .replace(/\(\s*Showcase\s*\)/gi, '(Unjuk Karya)')
    .replace(/\bShowcase\b/gi, 'unjuk karya kelas')
    .replace(/\(\s*Peer Review\s*\)/gi, '(Saling Memberi Masukan Antarteman)')
    .replace(/\bPeer Review\b/gi, 'saling memberi masukan antarkelompok')
    .replace(/\(\s*Stimulation\s*\)/gi, '')
    .replace(/\(\s*Problem Statement\s*\)/gi, '')
    .replace(/\(\s*Data Collection\s*\)/gi, '')
    .replace(/\(\s*Data Processing\s*\)/gi, '')
    .replace(/\(\s*Verification\s*&\s*Generalization\s*\)/gi, '')
    .replace(/\(\s*Verification\s*\)/gi, '')
    .replace(/\(\s*Generalization\s*\)/gi, '')
    .replace(/\(\s*investigable questions\s*\)/gi, '')
    .replace(/\(\s*guiding questions\s*\)/gi, '')
    .replace(/\(\s*cross-check\s*\)/gi, '')
    .replace(/\(\s*Role Playing\s*\)/gi, '')
    .replace(/\(\s*Debriefing\s*\)/gi, '')
    .replace(/\(\s*Tiered Scaffolding\s*\)/gi, '')
    .replace(/\(\s*tier-activity\s*\)/gi, '')
    .replace(/\(\s*scaffolding\s*\)/gi, '')
    .replace(/\bscaffolding\b/gi, 'bimbingan bertahap')
    .replace(/\(\s*peer tutoring\s*\)/gi, '')
    .replace(/\bpeer tutoring\b/gi, 'tutor sebaya')
    .replace(/\(\s*Constructivism\s*\)/gi, '')
    .replace(/\(\s*Inquiry Kontekstual\s*\)/gi, '')
    .replace(/\(\s*Questioning\s*\)/gi, '')
    .replace(/\(\s*Learning Community\s*\)/gi, '')
    .replace(/\(\s*Modeling\s*\)/gi, '')
    .replace(/\(\s*Reflection\s*\)/gi, '')
    .replace(/\(\s*Authentic Assessment\s*\)/gi, '')
    .replace(/\(\s*Mindful Learning\s*\)/gi, '(Berkesadaran)')
    .replace(/\(\s*Meaningful Learning\s*\)/gi, '(Bermakna)')
    .replace(/\(\s*Joyful Learning\s*\)/gi, '(Menggembirakan)')
    .replace(/\(\s*Mindful\s*\)/gi, '')
    .replace(/\(\s*Meaningful\s*\)/gi, '')
    .replace(/\(\s*Joyful\s*\)/gi, '')
    .replace(/\bReview\s*&\s*Bridging\b/gi, 'Ulasan Materi Sebelumnya dan Pengaitan')
    .replace(/\(\s*timeline\s*\)/gi, '')
    .replace(/\btimeline\b/gi, 'jadwal kerja')
    .replace(/\(\s*finishing\s*\)/gi, '')
    .replace(/\bfinishing\b/gi, 'penyempurnaan akhir')
    .replace(/\(\s*observer\s*\)/gi, '')
    .replace(/\bmulti-modal\b/gi, 'beragam media')
    .replace(/\(\s*ZPD\s*\)/gi, '')
    .replace(/\(\s*re-teaching\s*\)/gi, '')
    .replace(/\(\s*student-centered\s*\)/gi, '')
    .replace(/\(\s*open-ended problem\s*\)/gi, '')
    .replace(/\(\s*feedback\s*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractShortTPMeaning(tpText?: string, fallbackTopic: string = 'materi pembelajaran'): string {
  if (!tpText || typeof tpText !== 'string') return fallbackTopic;
  const cleaned = tpText
    .replace(/^[0-9]+(\.[0-9]+)*\s*/, '')
    .replace(/^Peserta didik mampu\s+/i, '')
    .replace(/^Murid mampu\s+/i, '')
    .replace(/^Siswa mampu\s+/i, '')
    .replace(/\.$/, '')
    .trim();
  return cleaned || fallbackTopic;
}

/**
 * Menyusun Kegiatan Awal (Pendahuluan) yang bervariasi untuk setiap pertemuan,
 * bebas istilah asing, relevan dengan materi, serta WAJIB memuat:
 * 1. Berdoa bersama & mengecek kehadiran murid.
 * 2. Aktivitas pengondisian/pemanasan yang berbeda di setiap pertemuan dan berkorelasi dengan pembelajaran
 *    (Pertemuan 1 boleh penyegar/asah otak, pertemuan berikutnya bernyanyi lagu materi, cerita kontekstual, peragaan benda nyata, dll.).
 * 3. Pertanyaan Pemantik yang WAJIB berbeda di setiap pertemuan sesuai target pencapaian pertemuan dan relevan dengan TP.
 * 4. Penyampaian tujuan pembelajaran spesifik pertemuan tersebut.
 */
export function buildVariedKegiatanAwal(
  meetingNum: number,
  totalMeetings: number,
  safeTopic: string,
  stageName: string,
  modelName: string,
  tpText?: string,
  options?: PedagogicalPlanOptions
): string[] {
  const m = Math.max(1, meetingNum);
  const total = Math.max(1, totalMeetings);
  const tpGoal = extractShortTPMeaning(tpText, `memahami dan menerapkan ${safeTopic}`);

  const mediaList = options?.mediaList && options.mediaList.length > 0
    ? options.mediaList
    : ['Video Pembelajaran Kontekstual', 'Gambar Ilustrasi Materi', 'Lembar Kerja Peserta Didik (LKPD)'];
  const perangkatList = options?.perangkatList && options.perangkatList.length > 0
    ? options.perangkatList
    : ['Laptop Guru', 'Proyektor LCD'];
  const metodeList = options?.metodeList && options.metodeList.length > 0
    ? options.metodeList
    : ['Diskusi Kelompok', 'Tanya Jawab', 'Pengamatan Langsung'];

  const primaryMedia = mediaList[0] || 'media gambar/video pembelajaran';
  const deviceStr = perangkatList.join(' dan ') || 'Laptop dan Proyektor LCD';
  const metodeStr = metodeList.slice(0, 3).join(', ');
  const cleanModel = getIndonesianModelName(modelName);

  // 1. WAJIB: Salam, Berdoa Bersama, dan Mengecek Kehadiran Murid
  const doaDanKehadiranVariations = [
    `Guru membuka kelas dengan salam hangat, mengajak seluruh murid berdoa bersama sesuai agama dan kepercayaan masing-masing yang dipimpin oleh ketua kelas, serta mengecek kehadiran dan kesiapan belajar murid satu per satu dengan penuh perhatian.`,
    `Guru menyapa murid dengan ramah dan semangat, mengajak murid berdoa bersama yang dipimpin secara bergiliran oleh salah satu murid untuk melatih keberanian dan kepemimpinan, kemudian mengecek kehadiran serta kerapian alat belajar murid.`,
    `Guru memberi salam pembuka yang ceria, memandu murid berdoa bersama dengan khusyuk sebagai wujud rasa syukur atas kesehatan hari ini, lalu mengecek kehadiran murid serta memastikan kondisi kelas bersih dan nyaman untuk belajar.`,
    `Guru mengawali pembelajaran dengan sapaan penuh kasih, mengajak murid berdoa bersama yang dipimpin oleh perwakilan murid, dilanjutkan dengan mengecek kehadiran murid serta menanyakan kesiapan kelompok belajar.`,
    `Guru membuka pelajaran dengan salam semangat pagi, mengajak seluruh murid menundukkan kepala sejenak untuk berdoa bersama sebelum menuntut ilmu, serta mengecek kehadiran dan kesiapan fisik maupun fokus murid.`,
    `Guru menyapa seluruh murid dengan antusias, mengajak murid berdoa bersama untuk memohon kelancaran kegiatan belajar hari ini, serta mengecek kehadiran murid dan kelengkapan buku serta alat tulis di meja masing-masing.`,
  ];
  const poinDoaKehadiran = doaDanKehadiranVariations[(m - 1) % doaDanKehadiranVariations.length];

  // 2. Aktivitas Pemanasan / Pengondisian yang BERVARIASI di setiap pertemuan dan RELEVAN dengan pembelajaran
  //    Pertemuan 1: Permainan asah otak fokus materi
  //    Pertemuan 2+: Aktivitas lain yang berkorelasi langsung dengan materi (Lagu edukatif, Cerita kontekstual, Tebak benda nyata, Peragaan berpasangan, Berbagi pengalaman nyata)
  let poinAktivitasVariasi = '';
  if (m === 1) {
    poinAktivitasVariasi = `Setelah berdoa, guru mengajak murid melakukan kegiatan asah otak singkat berupa tebak kata dan tepuk konsentrasi yang berkaitan dengan pengenalan kata kunci ${safeTopic} agar pikiran murid segar, fokus, dan siap menerima materi baru.`;
  } else if (m === 2) {
    poinAktivitasVariasi = `Setelah berdoa, guru mengajak murid menyanyikan lagu edukatif sederhana (menggunakan nada lagu anak yang akrab di telinga murid) dengan lirik yang memuat konsep dasar ${safeTopic} untuk membangun suasana gembira sekaligus menguatkan ingatan murid terhadap materi.`;
  } else if (m === 3) {
    poinAktivitasVariasi = `Setelah berdoa, guru menunjukkan benda nyata di depan kelas dan menceritakan kisah singkat dari kehidupan sehari-hari di lingkungan rumah/sekolah yang berkaitan erat dengan penerapan ${safeTopic} untuk menumbuhkan rasa penasaran murid.`;
  } else if (m === 4) {
    poinAktivitasVariasi = `Setelah berdoa, guru mengajak murid melakukan permainan mencocokkan kartu pasangan (antara contoh kasus nyata dan cara penyelesaiannya pada materi ${safeTopic}) secara berpasangan di bangku masing-masing untuk menguji kesiapan belajar.`;
  } else if (m === 5) {
    poinAktivitasVariasi = `Setelah berdoa, guru memberi kesempatan kepada 2 orang murid untuk maju menceritakan secara singkat pengalaman nyata mereka ketika melihat atau mempraktikkan ${safeTopic} di rumah, lalu murid lain menyimak dan memberi tepuk tangan apresiasi.`;
  } else {
    poinAktivitasVariasi = `Setelah berdoa, guru memandu peragaan singkat di depan kelas menggunakan media ${primaryMedia} tentang manfaat nyata ${safeTopic}, sehingga seluruh murid termotivasi dan memiliki gambaran utuh sebelum memasuki kegiatan utama.`;
  }

  // 3. WAJIB: Apersepsi & Pertanyaan Pemantik yang BERBEDA di setiap pertemuan sesuai Target Pencapaian Pertemuan & Relevan dengan TP
  let poinPemantik = '';
  if (total === 1) {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik: Guru menampilkan ${primaryMedia} menggunakan ${deviceStr} yang berkaitan dengan ${safeTopic}, lalu mengajukan pertanyaan pemantik yang relevan dengan Tujuan Pembelajaran (${tpGoal}): "Anak-anak, pernahkah kalian menjumpai peristiwa atau benda yang berhubungan dengan ${safeTopic} di sekitar rumah atau sekolah? Mengapa kita perlu memahami cara kerja dan langkah penyelesaian ${safeTopic} dengan tepat?" Murid menyampaikan pendapat awal mereka secara bergantian.`;
  } else if (m === 1) {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik Pertemuan 1 (Target Pengenalan Konsep Dasar): Guru menayangkan ${primaryMedia} melalui ${deviceStr} dan mengaitkannya dengan pengalaman sehari-hari murid, kemudian mengajukan pertanyaan pemantik awal sesuai Tujuan Pembelajaran (${tpGoal}): "Anak-anak, coba amati gambar/tayangan ini! Pernahkah kalian melihat atau mengalami hal yang berkaitan dengan ${safeTopic} di lingkungan sekitar kita? Apa saja ciri-ciri atau bagian penting dari ${safeTopic} yang sudah kalian ketahui?" Murid menjawab dengan antusias sesuai pengalaman masing-masing.`;
  } else if (m === 2 && m < total) {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik Pertemuan 2 (Target Penyelidikan & Langkah Kerja): Guru mengulas singkat materi pengenalan pada Pertemuan 1 dan menampilkan contoh persoalan ${safeTopic} melalui ${deviceStr}, lalu memberikan pertanyaan pemantik yang berbeda untuk mengarahkan penyelidikan (${tpGoal}): "Pada pertemuan lalu kita sudah mengenal dasar ${safeTopic}. Sekarang, bagaimana cara kita membuktikan dan menemukan langkah-langkah yang paling tepat untuk menyelesaikan persoalan ${safeTopic} ini?" Murid mengemukakan dugaan dan gagasan awalnya.`;
  } else if (m === 3 && m < total) {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik Pertemuan 3 (Target Penerapan pada Masalah Sehari-hari): Guru mengaitkan hasil temuan pertemuan ke-2 dengan situasi nyata di sekitar murid berbantuan ${primaryMedia} pada ${deviceStr}, lalu mengajukan pertanyaan pemantik khusus pertemuan ke-3 (${tpGoal}): "Jika kalian menemukan permasalahan nyata di rumah atau di sekolah yang berkaitan dengan ${safeTopic}, langkah apa yang harus kalian lakukan terlebih dahulu agar masalah tersebut dapat diselesaikan dengan benar?" Murid mendiskusikan tanggapannya secara aktif.`;
  } else if (m < total) {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik Pertemuan ${m} (Target Pendalaman & Ketelitian Pemecahan Masalah): Guru menyajikan kasus lanjutan seputar ${safeTopic} melalui ${deviceStr} untuk memperdalam keterampilan murid (${tpGoal}), kemudian mengajukan pertanyaan pemantik: "Dari berbagai latihan tentang ${safeTopic} yang sudah kita lakukan, bagian manakah yang memerlukan ketelitian paling tinggi, dan bagaimana cara kita memeriksa kembali agar hasil kerja kelompok kita benar-benar tepat?" Murid menjawab berdasarkan pengalaman belajar mereka.`;
  } else {
    poinPemantik = `Apersepsi dan Pertanyaan Pemantik Pertemuan ${m} (Target Puncak Unjuk Karya & Ketuntasan TP): Guru menampilkan rangkuman visual ${primaryMedia} pada ${deviceStr} dan mengajukan pertanyaan pemantik reflektif sesuai target ketuntasan Tujuan Pembelajaran (${tpGoal}): "Setelah kita mempelajari dan mempraktikkan ${safeTopic} dari pertemuan pertama hingga hari ini, manfaat nyata apa yang paling kalian rasakan dan bagaimana kalian akan menjelaskan hasil karya kelompok kalian agar teman-teman lain mudah memahaminya?" Murid menjawab dengan percaya diri.`;
  }

  // 4. Penyampaian Tujuan Pembelajaran & Rencana Kegiatan Spesifik Pertemuan
  const poinTujuan = `Guru menyampaikan tujuan pembelajaran khusus Pertemuan ke-${m} (${stageName}), menjelaskan urutan kegiatan belajar menggunakan model ${cleanModel} dan metode ${metodeStr}, serta mengingatkan kesepakatan kelas untuk saling menghargai dan aktif bekerja sama.`;

  return [poinDoaKehadiran, poinAktivitasVariasi, poinPemantik, poinTujuan];
}

/**
 * Menyusun Kegiatan Akhir (Penutup) yang bervariasi untuk setiap pertemuan dan bebas istilah asing.
 */
export function buildVariedKegiatanAkhir(
  meetingNum: number,
  totalMeetings: number,
  safeTopic: string,
  secondaryMedia: string,
  deviceStr: string
): string[] {
  const m = Math.max(1, meetingNum);
  const total = Math.max(1, totalMeetings);

  if (m === total) {
    return [
      `Murid bersama guru menyimpulkan seluruh intisari materi ${safeTopic} yang telah dipelajari dari awal hingga akhir berbantuan rangkuman pada ${deviceStr}, serta memastikan seluruh murid telah memahami konsep dengan benar.`,
      `Refleksi Akhir Pembelajaran: Murid menuliskan atau menyampaikan secara lisan 3 hal baru yang sudah dipahami tentang ${safeTopic}, 2 kegiatan yang paling berkesan, dan 1 sikap baik yang akan diterapkan di rumah.`,
      `Guru memberikan apresiasi dan penghargaan kepada seluruh kelompok atas ketekunan, kejujuran, dan kerja sama gotong royong yang telah ditunjukkan selama rangkaian pembelajaran.`,
      `Guru menyampaikan pesan penguatan agar murid mempraktikkan pengetahuan tentang ${safeTopic} dalam kehidupan sehari-hari bersama keluarga di rumah.`,
      `Kegiatan pembelajaran ditutup dengan doa syukur bersama yang dipimpin oleh salah satu murid secara tertib dan salam penutup dari guru.`,
    ];
  }

  if (m === 1) {
    return [
      `Murid bersama guru menyimpulkan konsep dasar ${safeTopic} yang telah dipelajari pada pertemuan pertama berdasarkan hasil pengamatan dan diskusi pada ${secondaryMedia}.`,
      `Refleksi Pertemuan 1: Guru menanyakan perasaan murid setelah mengikuti kegiatan hari ini dan meminta murid menyebutkan satu hal penting yang baru mereka ketahui tentang ${safeTopic}.`,
      `Guru memberikan pujian dan penguatan atas keberanian murid dalam bertanya dan menjawab selama kegiatan pengenalan materi.`,
      `Guru menyampaikan gambaran kegiatan untuk Pertemuan ke-2 (tahap penyelidikan dan praktik lebih lanjut) agar murid dapat mempersiapkan diri di rumah.`,
      `Pembelajaran ditutup dengan berdoa bersama yang dipimpin oleh salah satu murid dan salam penutup yang hangat.`,
    ];
  }

  return [
    `Murid bersama guru merangkum hasil penyelidikan dan latihan tentang ${safeTopic} pada pertemuan ke-${m} serta meluruskan kekeliruan pemahaman yang masih ditemukan.`,
    `Refleksi Pertemuan ${m}: Murid mengisi kartu refleksi singkat pada ${secondaryMedia} mengenai bagian materi ${safeTopic} yang sudah dikuasai dengan lancar dan bagian yang masih memerlukan latihan.`,
    `Guru memberikan apresiasi terhadap kekompakan kerja kelompok, ketelitian mencatat hasil kerja, dan sikap saling membantu antarteman.`,
    `Guru menyampaikan tindak lanjut dan informasi persiapan kegiatan untuk Pertemuan ke-${m + 1} agar murid semakin siap menyelesaikan tantangan berikutnya.`,
    `Kegiatan belajar diakhiri dengan doa bersama yang dipimpin oleh perwakilan murid secara bergantian dan salam penutup.`,
  ];
}

/**
 * Menyusun aktivitas pembelajaran awal, inti, dan akhir yang terstruktur, konkret,
 * bebas istilah asing, bervariasi di setiap pertemuan, dan 100% relevan dengan sintak model pembelajaran terpilih.
 */
export function buildPedagogicalMeetingPlan(
  meetingNum: number,
  totalMeetings: number,
  topic: string = 'Materi Pembelajaran',
  model: string = 'Problem Based Learning (PBL)',
  tpText?: string,
  options?: PedagogicalPlanOptions
): PedagogicalMeetingPlan {
  const m = Math.max(1, meetingNum);
  const total = Math.max(1, totalMeetings);
  const safeTopic = topic || 'Materi Pembelajaran';
  const modelType = detectModelType(model);

  const mediaList = options?.mediaList && options.mediaList.length > 0
    ? options.mediaList
    : ['Video Pembelajaran Kontekstual', 'Gambar Ilustrasi Materi', 'Lembar Kerja Peserta Didik (LKPD)'];
  const perangkatList = options?.perangkatList && options.perangkatList.length > 0
    ? options.perangkatList
    : ['Laptop Guru', 'Proyektor LCD'];
  const platformList = options?.platformList && options.platformList.length > 0
    ? options.platformList
    : ['Video Edukasi', 'Slide Presentasi'];

  const primaryMedia = mediaList[0] || 'media ajar visual konkret';
  const secondaryMedia = mediaList[1] || mediaList[0] || 'Lembar Kerja Peserta Didik (LKPD)';
  const deviceStr = perangkatList.join(' dan ') || 'Laptop dan Proyektor LCD';
  const platformStr = platformList.join(', ') || 'media pembelajaran';

  let stageName = '';
  let stageFocus = '';
  let kegiatanInti: ModelSyntaxItem[] = [];

  switch (modelType) {
    case 'PJBL': {
      // PEMBELAJARAN BERBASIS PROYEK (PjBL)
      if (total === 1) {
        stageName = `Tahap Proyek Terpadu: Perancangan, Pembuatan & Pameran Karya ${safeTopic}`;
        stageFocus = `Merumuskan pertanyaan mendasar, merancang dan membuat karya proyek berbantuan ${primaryMedia}, serta memamerkan hasil karya ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (PjBL): Penentuan Pertanyaan Mendasar`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menayangkan contoh masalah nyata di lingkungan sekitar terkait ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} (melalui ${platformStr}) dan mengajukan pertanyaan mendasar: "Karya apa yang dapat kita buat bersama untuk membantu menyelesaikan persoalan ini?".`,
            aktivitasSiswa: `Murid mengamati tayangan ${primaryMedia} dengan penuh perhatian, mendiskusikan manfaatnya, dan menyampaikan gagasan awal mengenai karya proyek yang ingin dibuat.`,
            pengalamanBelajar: `Bermakna: Menghubungkan rencana pembuatan karya dengan manfaat nyata bagi kehidupan sehari-hari.`,
            prinsipPembelajaran: `Memahami: Menangkap tujuan utama dan manfaat dari karya proyek yang akan dibuat.`,
          },
          {
            faseSintaks: `Sintak 2 (PjBL): Menyusun Rencana Karya Proyek`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok kerja (4-5 murid), membagikan panduan proyek pada ${secondaryMedia}, serta membimbing pemilihan alat, bahan, dan gambar rancangan karya.`,
            aktivitasSiswa: `Murid berdiskusi dalam kelompok menggambar rancangan karya ${safeTopic}, mencatat kebutuhan alat dan bahan pada ${secondaryMedia}, serta membagi tugas anggota kelompok secara adil.`,
            pengalamanBelajar: `Menggembirakan: Menuangkan ide kreatif bersama teman satu kelompok dalam suasana yang akrab dan kompak.`,
            prinsipPembelajaran: `Merencanakan: Menyusun langkah kerja dan rancangan karya secara rapi dan terarah.`,
          },
          {
            faseSintaks: `Sintak 3 (PjBL): Menyusun Jadwal Pembuatan Karya`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru membimbing setiap kelompok menyepakati pembagian waktu pengerjaan tiap tahap agar karya dapat selesai tepat waktu.`,
            aktivitasSiswa: `Murid menyepakati urutan kerja dan target waktu penyelesaian pada lembar jadwal ${secondaryMedia} dengan penuh tanggung jawab.`,
            pengalamanBelajar: `Berkesadaran: Melatih kedisiplinan mengatur waktu dan tanggung jawab menyelesaikan tugas bersama.`,
            prinsipPembelajaran: `Mengatur Alur Kerja: Menyusun tahapan pengerjaan karya secara teratur.`,
          },
          {
            faseSintaks: `Sintak 4 (PjBL): Pembuatan Karya dan Pemantauan Kemajuan Proyek`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru berkeliling memantau kegiatan pembuatan karya tiap kelompok, memberikan bimbingan bertahap saat murid menemui kesulitan, dan menilai kerja sama murid.`,
            aktivitasSiswa: `Murid bekerja sama secara gotong royong merakit dan membuat karya proyek ${safeTopic} sesuai pembagian tugas dengan teliti, rapi, dan saling membantu.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketelitian, kesabaran, dan keterampilan tangan dalam mewujudkan karya nyata.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan pemahaman materi ${safeTopic} ke dalam bentuk karya nyata.`,
          },
          {
            faseSintaks: `Sintak 5 (PjBL): Menguji dan Menampilkan Hasil Karya`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu kegiatan pameran karya di depan kelas dan membimbing pengujian apakah karya tiap kelompok sudah berfungsi sesuai tujuan.`,
            aktivitasSiswa: `Setiap kelompok menampilkan hasil karya proyek mereka di hadapan teman-teman, menjelaskan cara kerjanya, serta menerima tanggapan positif dari kelompok lain.`,
            pengalamanBelajar: `Menggembirakan: Merasakan kebanggaan atas hasil karya sendiri dan menghargai karya teman sekelas.`,
            prinsipPembelajaran: `Mengomunikasikan: Menjelaskan keunggulan karya dan konsep ${safeTopic} dengan bahasa yang runtut.`,
          },
          {
            faseSintaks: `Sintak 6 (PjBL): Evaluasi Pengalaman Belajar Proyek`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu murid mengulas kembali pengalaman selama membuat karya proyek, mengapresiasi usaha seluruh kelompok, dan menegaskan konsep penting ${safeTopic}.`,
            aktivitasSiswa: `Murid menceritakan pengalaman berharga selama membuat karya, menyebutkan hal baru yang dipelajari, dan mencatat kesimpulan di buku tulis.`,
            pengalamanBelajar: `Bermakna: Mengambil pelajaran berharga dari proses kerja sama dan pembuatan karya.`,
            prinsipPembelajaran: `Merefleksikan: Menilai kembali proses pembuatan karya dan ketercapaian tujuan belajar.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengenalan & Perencanaan Proyek: Merumuskan Ide, Desain & Jadwal Karya ${safeTopic}`;
        stageFocus = `Menggali ide proyek melalui ${primaryMedia}, menggambar rancangan karya pada ${secondaryMedia}, dan menyusun jadwal kerja kelompok ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (PjBL): Penentuan Pertanyaan Mendasar`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menayangkan ${primaryMedia} seputar permasalahan nyata ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}), lalu mengajukan pertanyaan mendasar untuk memancing ide pembuatan karya.`,
            aktivitasSiswa: `Murid menyimak tayangan ${primaryMedia} dengan saksama, mengenali permasalahan yang dihadapi, dan mengusulkan ide bentuk karya proyek yang bermanfaat.`,
            pengalamanBelajar: `Bermakna: Mengaitkan kebutuhan nyata di lingkungan sekitar dengan ide karya yang akan dibuat.`,
            prinsipPembelajaran: `Memahami: Mengenali permasalahan dasar dan tujuan pembuatan karya proyek.`,
          },
          {
            faseSintaks: `Sintak 2 (PjBL): Menyusun Rencana dan Desain Karya Proyek`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok (4-5 anak), membagikan lembar kerja ${secondaryMedia}, serta membimbing pembuatan sketsa gambar rancangan dan daftar alat bahan.`,
            aktivitasSiswa: `Murid berdiskusi dalam kelompok menggambar rancangan karya ${safeTopic}, mencatat daftar alat dan bahan yang mudah ditemukan pada ${secondaryMedia}, serta membagi tugas anggota kelompok.`,
            pengalamanBelajar: `Menggembirakan: Berdiskusi dengan gembira merancang ide karya bersama teman satu kelompok.`,
            prinsipPembelajaran: `Merencanakan: Menyusun rancangan karya secara jelas dan mudah dikerjakan.`,
          },
          {
            faseSintaks: `Sintak 3 (PjBL): Menyusun Jadwal Pelaksanaan Proyek`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membimbing setiap kelompok merinci tahapan pengerjaan proyek, menyepakati target waktu tiap pertemuan, dan memeriksa kesiapan rencana kelompok.`,
            aktivitasSiswa: `Murid menyusun jadwal tahapan pembuatan karya pada tabel ${secondaryMedia} dan menyepakati pembagian perlengkapan untuk pertemuan berikutnya.`,
            pengalamanBelajar: `Berkesadaran: Belajar mengatur waktu dan membangun komitmen kerja sama kelompok.`,
            prinsipPembelajaran: `Mengatur Rencana: Menyusun tahapan kerja secara teratur demi kelancaran proyek.`,
          },
        ];
      } else if (m === total) {
        stageName = `Tahap Pameran Karya & Evaluasi Proyek: Unjuk Karya Kelas & Evaluasi Penguasaan ${safeTopic}`;
        stageFocus = `Menguji hasil karya proyek, mengadakan pameran karya kelas, mengevaluasi pengalaman proyek, dan mengerjakan soal evaluasi ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 5 (PjBL): Menguji dan Memamerkan Hasil Karya Proyek`,
            alokasiMenit: '25 Menit',
            aktivitasGuru: `Guru mengatur kegiatan pameran karya di ruang kelas, memandu pengujian hasil karya setiap kelompok, dan menilai keterampilan presentasi murid.`,
            aktivitasSiswa: `Setiap kelompok memamerkan karya proyek ${safeTopic} di meja kelompoknya, memperagakan cara kerjanya kepada teman-teman, dan saling memberikan pujian serta saran yang santun.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh rasa percaya diri atas hasil karya kelompok dan sikap menghargai karya teman.`,
            prinsipPembelajaran: `Mengomunikasikan: Menjelaskan hasil karya dan penerapan konsep ${safeTopic} secara jelas.`,
          },
          {
            faseSintaks: `Sintak 6 (PjBL): Evaluasi Pengalaman Belajar Proyek`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memandu diskusi kelas untuk mengulas pengalaman selama mengerjakan proyek, membahas kesulitan yang berhasil diatasi, dan merangkum konsep utama ${safeTopic} pada ${deviceStr}.`,
            aktivitasSiswa: `Murid menceritakan pengalaman yang paling berkesan saat membuat proyek, mengungkapkan rasa syukur atas kerja sama tim, dan mencatat kesimpulan materi.`,
            pengalamanBelajar: `Bermakna: Menyadari manfaat kerja keras dan gotong royong dalam menyelesaikan suatu karya.`,
            prinsipPembelajaran: `Merefleksikan: Menilai kembali seluruh proses belajar dan mutu karya yang dihasilkan.`,
          },
          {
            faseSintaks: `Evaluasi Mandiri Penguasaan Materi`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membagikan lembar soal evaluasi mandiri untuk mengukur pemahaman masing-masing murid terhadap materi ${safeTopic}.`,
            aktivitasSiswa: `Murid mengerjakan soal evaluasi secara mandiri, jujur, dan teliti berdasarkan pemahaman yang diperoleh selama kegiatan proyek.`,
            pengalamanBelajar: `Berkesadaran: Mengukur kemampuan diri sendiri secara jujur dan bertanggung jawab.`,
            prinsipPembelajaran: `Membuktikan Pemahaman: Menunjukkan ketuntasan penguasaan Tujuan Pembelajaran.`,
          },
        ];
      } else {
        stageName = `Tahap Pembuatan & Penyempurnaan Karya (Pertemuan ${m}): Praktik Pembuatan Proyek ${safeTopic}`;
        stageFocus = `Melaksanakan pembuatan karya proyek secara berkelompok menggunakan alat bahan dan ${secondaryMedia}, serta uji coba fungsi karya ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 4 (PjBL): Pembuatan Karya dan Pemantauan Kemajuan Proyek`,
            alokasiMenit: '30 Menit',
            aktivitasGuru: `Guru berkeliling mendampingi proses pembuatan karya tiap kelompok, memberikan bimbingan bertahap saat murid menghadapi kendala, serta memantau keaktifan setiap anggota.`,
            aktivitasSiswa: `Murid bergotong royong merakit, menyusun, dan menyelesaikan karya proyek ${safeTopic} sesuai rancangan pada ${secondaryMedia} dengan tekun dan tertib.`,
            pengalamanBelajar: `Berkesadaran: Melatih fokus, ketelitian, kesabaran, dan kerja sama dalam membuat karya nyata.`,
            prinsipPembelajaran: `Mengaplikasikan: Mempraktikkan konsep materi ${safeTopic} secara langsung ke dalam pembuatan produk.`,
          },
          {
            faseSintaks: `Uji Coba Awal dan Penyempurnaan Karya Kelompok`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membimbing kelompok melakukan uji coba awal terhadap karya yang sedang dibuat serta memfasilitasi kelompok untuk saling memberi saran perbaikan yang membangun.`,
            aktivitasSiswa: `Kelompok menguji coba hasil karya mereka, mencatat bagian yang perlu diperbaiki pada ${secondaryMedia}, dan merapikan karya agar siap dipamerkan pada pertemuan berikutnya.`,
            pengalamanBelajar: `Menggembirakan: Belajar menerima masukan teman dengan senang hati demi menghasilkan karya terbaik.`,
            prinsipPembelajaran: `Menyempurnakan Karya: Memeriksa dan memperbaiki hasil kerja secara teliti.`,
          },
        ];
      }
      break;
    }

    case 'DISCOVERY': {
      // PEMBELAJARAN PENEMUAN (DISCOVERY LEARNING)
      if (total === 1) {
        stageName = `Tahap Penemuan Terpadu: Pengamatan, Pengolahan Data & Penarikan Kesimpulan ${safeTopic}`;
        stageFocus = `Pemberian rangsangan melalui ${primaryMedia}, perumusan masalah, pengumpulan dan pengolahan data pada ${secondaryMedia}, serta penarikan kesimpulan ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Discovery): Pemberian Rangsangan Pengamatan`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menampilkan contoh peristiwa atau objek nyata seputar ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} (melalui ${platformStr}) tanpa langsung menjelaskan rumusnya agar memancing rasa ingin tahu murid.`,
            aktivitasSiswa: `Murid mengamati gambar/tayangan secara teliti, menemukan hal-hal menarik dari contoh tersebut, dan terdorong untuk mencari tahu penjelasannya.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh rasa penasaran yang menyenangkan saat mengamati contoh nyata.`,
            prinsipPembelajaran: `Memahami: Mengenali gejala atau ciri awal materi ${safeTopic} secara konkret.`,
          },
          {
            faseSintaks: `Sintak 2 (Discovery): Mengidentifikasi Masalah dan Dugaan Awal`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membimbing murid menyusun pertanyaan tentang hal yang ingin diketahui dan menuliskan jawaban dugaan sementara terkait ${safeTopic}.`,
            aktivitasSiswa: `Murid berdiskusi dalam kelompok untuk menuliskan pertanyaan dan dugaan sementara pada lembar kerja ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Melatih keberanian berpikir kritis dalam membuat dugaan awal yang masuk akal.`,
            prinsipPembelajaran: `Merumuskan: Menyusun pertanyaan dan dugaan awal secara terarah.`,
          },
          {
            faseSintaks: `Sintak 3 (Discovery): Mengumpulkan Data dan Informasi`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menyediakan alat peraga konkret dan membagikan ${secondaryMedia} untuk memandu murid mengumpulkan data melalui pengamatan langsung.`,
            aktivitasSiswa: `Murid bekerja sama mengamati benda peraga, mencoba langkah-langkah pada ${secondaryMedia}, dan mencatat data yang ditemukan secara jujur dan rapi.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketelitian dan kejujuran saat mengamati serta mencatat fakta.`,
            prinsipPembelajaran: `Mengaplikasikan: Melakukan pengamatan langsung untuk mengumpulkan informasi yang dibutuhkan.`,
          },
          {
            faseSintaks: `Sintak 4 (Discovery): Mengolah Data Hasil Pengamatan`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru mendampingi setiap kelompok mengelompokkan, menghitung, atau membandingkan data hasil pengamatan seputar ${safeTopic}.`,
            aktivitasSiswa: `Murid berdiskusi mengolah catatan data pada ${secondaryMedia}, menemukan pola keteraturan, dan menjawab pertanyaan tuntunan.`,
            pengalamanBelajar: `Bermakna: Menemukan sendiri hubungan dan konsep materi dari data yang diolah bersama kelompok.`,
            prinsipPembelajaran: `Menalar: Membangun pemahaman konsep melalui pengolahan data yang runtut.`,
          },
          {
            faseSintaks: `Sintak 5 (Discovery): Membuktikan Kebenaran Temuan`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu murid mencocokkan hasil temuan kelompok dengan penjelasan pada buku pelajaran serta membandingkan temuan antarkelompok.`,
            aktivitasSiswa: `Murid memeriksa apakah dugaan awal mereka sudah sesuai dengan hasil pengamatan dan penjelasan buku, lalu menyampaikan hasilnya di depan kelas.`,
            pengalamanBelajar: `Berkesadaran: Menyadari bahwa kesimpulan yang benar harus didukung oleh bukti pengamatan yang tepat.`,
            prinsipPembelajaran: `Membuktikan: Memastikan kebenaran hasil temuan dengan konsep ilmu yang tepat.`,
          },
          {
            faseSintaks: `Sintak 6 (Discovery): Menarik Kesimpulan Akhir`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru membimbing murid merumuskan kesimpulan bersama tentang materi ${safeTopic} pada layar ${deviceStr} dan memberikan penguatan.`,
            aktivitasSiswa: `Murid menyimpulkan konsep utama ${safeTopic} dengan bahasa yang mudah dipahami dan mencatatnya di buku tulis.`,
            pengalamanBelajar: `Bermakna: Pemahaman materi lebih melekat karena ditemukan sendiri melalui proses pengamatan.`,
            prinsipPembelajaran: `Merefleksikan: Merangkum kesimpulan konsep ${safeTopic} secara utuh.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengamatan & Pengumpulan Data Awal: Mengenali Fenomena & Mencari Fakta ${safeTopic}`;
        stageFocus = `Mengamati contoh nyata melalui ${primaryMedia}, menyusun pertanyaan dan dugaan awal, serta mengumpulkan data pengamatan pada ${secondaryMedia} ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Discovery): Pemberian Rangsangan Pengamatan`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menayangkan ${primaryMedia} seputar materi ${safeTopic} menggunakan ${deviceStr} untuk memancing rasa ingin tahu murid tanpa langsung memberi tahu kesimpulan akhirnya.`,
            aktivitasSiswa: `Murid mengamati tayangan secara saksama, mencatat hal-hal unik yang terlihat, dan menyampaikan rasa ingin tahu mereka kepada guru.`,
            pengalamanBelajar: `Menggembirakan: Mengawali kegiatan belajar dengan rasa ingin tahu yang tinggi dan menyenangkan.`,
            prinsipPembelajaran: `Memahami: Mengenali ciri-ciri awal materi ${safeTopic} melalui pengamatan visual.`,
          },
          {
            faseSintaks: `Sintak 2 (Discovery): Mengidentifikasi Masalah dan Dugaan Awal`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membimbing murid dalam kelompok untuk merumuskan pertanyaan yang ingin diselidiki dan menuliskan dugaan awal terkait ${safeTopic}.`,
            aktivitasSiswa: `Murid berdiskusi menyusun pertanyaan penyelidikan pada ${secondaryMedia} dan menuliskan jawaban dugaan sementara kelompok mereka.`,
            pengalamanBelajar: `Berkesadaran: Melatih fokus berpikir dalam menentukan arah pengamatan.`,
            prinsipPembelajaran: `Merumuskan: Menetapkan dugaan sementara yang akan dibuktikan melalui pengamatan.`,
          },
          {
            faseSintaks: `Sintak 3 (Discovery): Mengumpulkan Data Pengamatan Awal`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membagikan lembar kerja ${secondaryMedia} dan benda peraga konkret, lalu membimbing murid cara mengamati dan mencatat data dengan benar.`,
            aktivitasSiswa: `Murid bekerja sama mengamati benda peraga, mengukur atau mengelompokkan contoh ${safeTopic}, serta mencatat hasilnya secara rapi pada tabel ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketelitian, kesabaran, dan kejujuran dalam mencatat fakta pengamatan.`,
            prinsipPembelajaran: `Mengaplikasikan: Menggunakan keterampilan pengamatan langsung untuk mengumpulkan data.`,
          },
        ];
      } else if (m < total) {
        stageName = `Tahap Pengolahan Data & Penemuan Pola (Pertemuan ${m}): Mengolah Fakta & Menemukan Konsep ${safeTopic}`;
        stageFocus = `Mengolah data hasil pengamatan pada ${secondaryMedia}, menemukan pola konsep ${safeTopic}, dan mencocokkan temuan antarkelompok`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 3 Lanjutan (Discovery): Melengkapi Data melalui Percobaan Konkret`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memberikan contoh kasus tambahan terkait ${safeTopic} menggunakan ${primaryMedia} dan mendampingi kelompok melengkapi data pengamatan mereka.`,
            aktivitasSiswa: `Murid memeriksa kembali catatan data pertemuan sebelumnya dan menambahkan data hasil percobaan baru pada ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Memastikan kelengkapan dan ketepatan data sebelum dianalisis lebih lanjut.`,
            prinsipPembelajaran: `Mengaplikasikan: Melakukan pengamatan lanjutan secara cermat dan teratur.`,
          },
          {
            faseSintaks: `Sintak 4 (Discovery): Mengolah Data dan Menemukan Pola Konsep`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membimbing setiap kelompok membandingkan data pada ${secondaryMedia}, menghitung atau mengelompokkan temuan, dan mencari hubungan konsep ${safeTopic}.`,
            aktivitasSiswa: `Murid berdiskusi mengolah data yang terkumpul, menemukan pola atau aturan pada materi ${safeTopic}, dan menjawab pertanyaan pada lembar kerja.`,
            pengalamanBelajar: `Bermakna: Merasakan kepuasan saat berhasil menemukan sendiri konsep materi dari data kelompok.`,
            prinsipPembelajaran: `Menalar: Membangun pemahaman konsep melalui diskusi pengolahan data.`,
          },
          {
            faseSintaks: `Sintak 5 Awal (Discovery): Pemeriksaan Silang Temuan Antarkelompok`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memfasilitasi perwakilan kelompok untuk saling mencocokkan hasil olahan data mereka dengan kelompok lain di kelas.`,
            aktivitasSiswa: `Kelompok saling membandingkan hasil temuan, mendiskusikan persamaan maupun perbedaannya dengan santun, dan memperbaiki catatan yang belum tepat.`,
            pengalamanBelajar: `Menggembirakan: Belajar bertukar pikiran dengan teman sekelas dalam suasana saling menghargai.`,
            prinsipPembelajaran: `Membuktikan: Memeriksa ketepatan hasil kerja kelompok bersama teman sebaya.`,
          },
        ];
      } else {
        stageName = `Tahap Pembuktian & Kesimpulan Akhir: Verifikasi Konsep & Evaluasi Penguasaan ${safeTopic}`;
        stageFocus = `Membuktikan kebenaran dugaan awal, menarik kesimpulan umum materi ${safeTopic} berbantuan ${deviceStr}, dan evaluasi ketuntasan belajar`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 5 (Discovery): Pembuktian Kebenaran Konsep`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memandu diskusi kelas untuk membandingkan hasil temuan seluruh kelompok dengan penjelasan konsep yang benar pada buku sumber dan tayangan ${deviceStr}.`,
            aktivitasSiswa: `Setiap kelompok memaparkan hasil temuan mereka di depan kelas, membuktikan apakah dugaan awal mereka benar, dan menyimak penguatan dari guru.`,
            pengalamanBelajar: `Berkesadaran: Memahami konsep secara yakin karena telah dibuktikan melalui data dan penjelasan ilmiah.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan hasil pembuktian konsep dengan percaya diri.`,
          },
          {
            faseSintaks: `Sintak 6 (Discovery): Menarik Kesimpulan Umum`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membimbing murid menyusun kesimpulan akhir tentang ${safeTopic} dan contoh penerapannya dalam kehidupan sehari-hari.`,
            aktivitasSiswa: `Murid merumuskan kesimpulan materi ${safeTopic} dengan kalimat mereka sendiri dan mencatat poin-poin penting di buku tulis.`,
            pengalamanBelajar: `Bermakna: Mengikat seluruh pengalaman pengamatan menjadi pengetahuan yang utuh dan mudah diingat.`,
            prinsipPembelajaran: `Merefleksikan: Merangkum intisari materi secara menyeluruh.`,
          },
          {
            faseSintaks: `Evaluasi Mandiri Penguasaan Tujuan Pembelajaran`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagikan lembar soal evaluasi untuk mengukur pemahaman mandiri setiap murid atas materi ${safeTopic}.`,
            aktivitasSiswa: `Murid mengerjakan soal evaluasi secara mandiri, jujur, dan tenang sesuai kemampuan yang telah dikuasai.`,
            pengalamanBelajar: `Berkesadaran: Melatih kejujuran dan tanggung jawab pribadi dalam mengerjakan evaluasi.`,
            prinsipPembelajaran: `Membuktikan Kemampuan: Menunjukkan ketercapaian Tujuan Pembelajaran secara mandiri.`,
          },
        ];
      }
      break;
    }

    case 'INQUIRY': {
      // PEMBELAJARAN PENYELIDIKAN TERBIMBING (INKUIRI TERBIMBING)
      if (total === 1) {
        stageName = `Tahap Penyelidikan Terpadu: Mengamati Peristiwa, Percobaan & Kesimpulan ${safeTopic}`;
        stageFocus = `Pengenalan peristiwa nyata melalui ${primaryMedia}, menyusun pertanyaan & dugaan, percobaan terbimbing pada ${secondaryMedia}, dan kesimpulan ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Inkuiri): Pengenalan Masalah dan Pengamatan Peristiwa`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memperagakan contoh peristiwa nyata seputar ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} untuk membangkitkan rasa ingin tahu murid.`,
            aktivitasSiswa: `Murid mengamati peragaan/tayangan dengan saksama, mengenali keunikan peristiwa tersebut, dan menyampaikan pertanyaan awal.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh semangat ingin tahu terhadap peristiwa nyata di lingkungan sekitar.`,
            prinsipPembelajaran: `Memahami: Mengenali permasalahan pokok yang akan diselidiki bersama.`,
          },
          {
            faseSintaks: `Sintak 2 (Inkuiri): Merumuskan Pertanyaan Penyelidikan`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membimbing murid menyusun kalimat pertanyaan penyelidikan yang jelas dan dapat dicari jawabannya melalui pengamatan atau percobaan.`,
            aktivitasSiswa: `Murid berdiskusi dalam kelompok menuliskan pertanyaan penyelidikan pada lembar kerja ${secondaryMedia} seputar ${safeTopic}.`,
            pengalamanBelajar: `Berkesadaran: Memusatkan pikiran pada hal utama yang ingin dibuktikan.`,
            prinsipPembelajaran: `Merumuskan: Menyusun pertanyaan penyelidikan secara runtut.`,
          },
          {
            faseSintaks: `Sintak 3 (Inkuiri): Mengajukan Dugaan Sementara`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu murid menghubungkan pengalaman mereka sebelumnya untuk menyusun jawaban dugaan sementara yang masuk akal.`,
            aktivitasSiswa: `Murid berdiskusi menentukan dugaan sementara atas pertanyaan penyelidikan dan menuliskannya pada ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Melatih keberanian mengemukakan pendapat berdasarkan alasan yang logis.`,
            prinsipPembelajaran: `Memperkirakan: Menetapkan dugaan awal sebelum melakukan percobaan.`,
          },
          {
            faseSintaks: `Sintak 4 (Inkuiri): Mengumpulkan Data melalui Percobaan Terbimbing`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagikan alat peraga konkret dan lembar panduan ${secondaryMedia}, menjelaskan aturan keselamatan kerja, serta mendampingi murid melakukan percobaan.`,
            aktivitasSiswa: `Murid melakukan pengamatan langsung atau percobaan sederhana secara bergotong royong dan mencatat hasilnya dengan teliti pada tabel ${secondaryMedia}.`,
            pengalamanBelajar: `Menggembirakan: Belajar secara aktif melalui praktik percobaan langsung bersama teman kelompok.`,
            prinsipPembelajaran: `Mengaplikasikan: Menggunakan keterampilan mengamati, mencoba, dan mencatat data secara jujur.`,
          },
          {
            faseSintaks: `Sintak 5 (Inkuiri): Menguji Dugaan dan Menganalisis Hasil`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru membimbing kelompok memeriksa data hasil percobaan dan membandingkannya dengan dugaan awal yang telah ditulis.`,
            aktivitasSiswa: `Murid mendiskusikan apakah data hasil percobaan mendukung dugaan awal mereka serta menyusun alasan penjelasannya.`,
            pengalamanBelajar: `Bermakna: Menyadari pentingnya bukti nyata dalam menjawab suatu permasalahan.`,
            prinsipPembelajaran: `Menalar: Menafsirkan hasil percobaan secara objektif dan masuk akal.`,
          },
          {
            faseSintaks: `Sintak 6 (Inkuiri): Merumuskan Kesimpulan Penyelidikan`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu perwakilan kelompok menyampaikan kesimpulan di depan kelas dan memberikan penguatan konsep ${safeTopic} pada layar ${deviceStr}.`,
            aktivitasSiswa: `Perwakilan kelompok membacakan kesimpulan hasil penyelidikan, menyimak penguatan guru, dan mencatat intisari materi.`,
            pengalamanBelajar: `Bermakna: Memperoleh pemahaman konsep yang kuat karena dibuktikan sendiri melalui penyelidikan.`,
            prinsipPembelajaran: `Merefleksikan: Menyimpulkan hasil penyelidikan dan menilai kembali proses belajar.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengenalan Masalah & Rencana Penyelidikan: Mengamati Peristiwa & Menyusun Dugaan ${safeTopic}`;
        stageFocus = `Mengamati peristiwa nyata melalui ${primaryMedia}, merumuskan pertanyaan penyelidikan, dan menyusun dugaan sementara pada ${secondaryMedia} ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Inkuiri): Pengenalan Masalah dan Pengamatan Peristiwa`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menghadirkan contoh peristiwa konkret seputar ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} yang memancing rasa ingin tahu murid.`,
            aktivitasSiswa: `Murid mengamati tayangan/peragaan dengan saksama, mencatat hal penting yang dilihat, dan menyampaikan rasa ingin tahu secara santun.`,
            pengalamanBelajar: `Menggembirakan: Menumbuhkan semangat mencari tahu terhadap peristiwa nyata di sekitar.`,
            prinsipPembelajaran: `Memahami: Mengenali fenomena dasar yang memerlukan penyelidikan lebih lanjut.`,
          },
          {
            faseSintaks: `Sintak 2 (Inkuiri): Merumuskan Pertanyaan Penyelidikan`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membimbing murid menyusun pertanyaan penyelidikan yang terarah dan dapat dibuktikan melalui kegiatan pengamatan atau percobaan.`,
            aktivitasSiswa: `Murid berdiskusi dalam kelompok menyusun daftar pertanyaan penyelidikan pada lembar kerja ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Melatih daya pikir kritis dalam menentukan fokus penyelidikan.`,
            prinsipPembelajaran: `Merumuskan: Menyusun pertanyaan penyelidikan secara jelas dan runtut.`,
          },
          {
            faseSintaks: `Sintak 3 (Inkuiri): Mengajukan Dugaan Sementara dan Rencana Percobaan`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memandu kelompok merumuskan jawaban dugaan sementara dan menyiapkan langkah-langkah pengamatan untuk dibuktikan.`,
            aktivitasSiswa: `Murid menuliskan dugaan sementara kelompok, mempelajari langkah kerja pada ${secondaryMedia}, dan membagi tugas anggota tim.`,
            pengalamanBelajar: `Berkesadaran: Belajar merencanakan langkah pembuktian secara tertib dan bekerja sama.`,
            prinsipPembelajaran: `Merencanakan: Menetapkan dugaan awal dan persiapan penyelidikan kelompok.`,
          },
        ];
      } else if (m < total) {
        stageName = `Tahap Percobaan & Pengumpulan Bukti (Pertemuan ${m}): Praktik Penyelidikan Terbimbing ${safeTopic}`;
        stageFocus = `Melakukan pengamatan/percobaan langsung tentang ${safeTopic}, mencatat data pada ${secondaryMedia}, dan mengolah temuan kelompok`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 4 (Inkuiri): Mengumpulkan Data melalui Percobaan Terbimbing`,
            alokasiMenit: '30 Menit',
            aktivitasGuru: `Guru mendampingi jalannya percobaan atau pengamatan tiap kelompok menggunakan benda konkret dan panduan ${secondaryMedia}, serta memastikan seluruh anggota aktif bekerja.`,
            aktivitasSiswa: `Murid melakukan percobaan/pengamatan langsung secara gotong royong, melakukan pengukuran atau pencatatan dengan teliti pada tabel ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Mengalami langsung proses mencari bukti dengan teliti, sabar, dan jujur.`,
            prinsipPembelajaran: `Mengaplikasikan: Mempraktikkan langkah penyelidikan untuk mengumpulkan fakta yang akurat.`,
          },
          {
            faseSintaks: `Sintak 5 Awal (Inkuiri): Pemeriksaan Data dan Diskusi Kelompok`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membimbing kelompok memeriksa kelengkapan data hasil percobaan dan memandu diskusi awal untuk menjawab pertanyaan pada ${secondaryMedia}.`,
            aktivitasSiswa: `Murid mendiskusikan hasil pengamatan bersama teman sekelompok, merapikan tabel data, dan menyiapkan bahan paparan untuk pertemuan berikutnya.`,
            pengalamanBelajar: `Bermakna: Belajar mengaitkan data hasil percobaan dengan konsep materi ${safeTopic}.`,
            prinsipPembelajaran: `Menalar: Mengolah catatan pengamatan menjadi informasi yang mudah dipahami.`,
          },
        ];
      } else {
        stageName = `Tahap Pengujian Dugaan & Kesimpulan Akhir: Pembuktian Konsep & Evaluasi ${safeTopic}`;
        stageFocus = `Menguji kesesuaian data dengan dugaan awal, mempresentasikan kesimpulan penyelidikan ${safeTopic}, dan evaluasi penguasaan TP`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 5 (Inkuiri): Menguji Dugaan Sementara dan Menganalisis Temuan`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memandu diskusi kelas untuk menganalisis data kelompok dan membuktikan apakah dugaan awal yang dibuat pada pertemuan pertama terbukti benar.`,
            aktivitasSiswa: `Murid membandingkan hasil percobaan pada ${secondaryMedia} dengan dugaan awal mereka, lalu menjelaskan alasannya di depan kelas.`,
            pengalamanBelajar: `Bermakna: Menyadari pentingnya bukti nyata dalam menarik kesimpulan yang benar.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan hasil pembuktian kelompok secara jelas dan santun.`,
          },
          {
            faseSintaks: `Sintak 6 (Inkuiri): Merumuskan Kesimpulan Bersama`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru mengonfirmasi ketepatan kesimpulan seluruh kelompok pada layar ${deviceStr}, meluruskan pemahaman yang kurang tepat, dan merangkum intisari ${safeTopic}.`,
            aktivitasSiswa: `Murid menyimpulkan konsep utama ${safeTopic} bersama guru dan mencatat rangkuman penting di buku tulis.`,
            pengalamanBelajar: `Bermakna: Mengukuhkan pemahaman konsep yang kuat berdasarkan pengalaman penyelidikan.`,
            prinsipPembelajaran: `Merefleksikan: Meninjau kembali proses penyelidikan dan menguatkan kesimpulan akhir.`,
          },
          {
            faseSintaks: `Evaluasi Mandiri Ketercapaian Tujuan Pembelajaran`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagikan lembar evaluasi mandiri untuk mengukur ketuntasan pemahaman masing-masing murid terhadap materi ${safeTopic}.`,
            aktivitasSiswa: `Murid mengerjakan soal evaluasi secara mandiri, jujur, dan percaya diri.`,
            pengalamanBelajar: `Berkesadaran: Menunjukkan kejujuran dan tanggung jawab atas hasil belajar sendiri.`,
            prinsipPembelajaran: `Membuktikan Kemampuan: Menunjukkan penguasaan Tujuan Pembelajaran secara tuntas.`,
          },
        ];
      }
      break;
    }

    case 'ROLE_PLAY': {
      // BERMAIN PERAN & SIMULASI
      if (total === 1) {
        stageName = `Tahap Simulasi & Bermain Peran Terpadu: Penghayatan Peran & Pemecahan Masalah ${safeTopic}`;
        stageFocus = `Pengenalan cerita skenario melalui ${primaryMedia}, pembagian peran pada ${secondaryMedia}, peragaan simulasi, dan pengambilan hikmah ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Bermain Peran): Pengenalan Cerita dan Situasi Masalah`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menyajikan cerita atau tayangan situasi nyata seputar ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} yang dekat dengan kehidupan anak sehari-hari.`,
            aktivitasSiswa: `Murid menyimak cerita dengan penuh perhatian, memahami permasalahan yang dialami tokoh cerita, dan bersiap memperagakannya.`,
            pengalamanBelajar: `Bermakna: Mengaitkan isi cerita dengan kejadian nyata yang sering ditemui murid.`,
            prinsipPembelajaran: `Memahami: Menangkap isi permasalahan dan pesan utama dalam skenario cerita.`,
          },
          {
            faseSintaks: `Sintak 2 (Bermain Peran): Pemilihan dan Pembagian Peran`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menjelaskan tugas masing-masing tokoh dalam cerita, membagikan lembar panduan peran pada ${secondaryMedia}, dan membagi peran secara adil.`,
            aktivitasSiswa: `Murid menerima peran masing-masing, membaca panduan percakapan atau tindakan pada ${secondaryMedia}, dan berlatih singkat dalam kelompok.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh rasa percaya diri dan empati saat berlatih memerankan tokoh cerita.`,
            prinsipPembelajaran: `Merencanakan: Mempersiapkan ungkapan dan tindakan sesuai peran yang diterima.`,
          },
          {
            faseSintaks: `Sintak 3 (Bermain Peran): Penataan Area Peragaan dan Penugasan Pengamat`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru mengatur bagian depan kelas sebagai tempat peragaan dan mengarahkan murid yang bertugas sebagai pengamat untuk mencatat hal penting pada ${secondaryMedia}.`,
            aktivitasSiswa: `Kelompok pemeran bersiap di depan kelas, sementara murid pengamat duduk tertib menyiapkan lembar catatan pengamatan.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketertiban dan sikap saling menghormati saat teman sedang tampil.`,
            prinsipPembelajaran: `Mengatur Kegiatan: Menjalankan tugas sebagai pemeran maupun pengamat dengan bertanggung jawab.`,
          },
          {
            faseSintaks: `Sintak 4 (Bermain Peran): Pelaksanaan Simulasi dan Peragaan Peran`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru mendampingi jalannya peragaan bermain peran dengan suasana yang ramah dan memberi semangat agar murid tampil percaya diri.`,
            aktivitasSiswa: `Murid memperagakan percakapan dan tindakan penyelesaian masalah terkait ${safeTopic} dengan bahasa yang santun, sementara pengamat mencatat jalannya peragaan.`,
            pengalamanBelajar: `Menggembirakan: Belajar melalui praktik peragaan langsung yang hidup, aktif, dan menyenangkan.`,
            prinsipPembelajaran: `Mengaplikasikan: Mempraktikkan pemahaman konsep dan sikap terpuji melalui tindakan nyata.`,
          },
          {
            faseSintaks: `Sintak 5 (Bermain Peran): Diskusi dan Ulasan Hasil Peragaan`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memandu tanya jawab antara kelompok pemeran dan pengamat untuk membahas cara penyelesaian masalah yang telah diperagakan.`,
            aktivitasSiswa: `Murid menyampaikan perasaan mereka setelah bermain peran, mendengarkan tanggapan teman pengamat, dan mendiskusikan cara penyelesaian terbaik.`,
            pengalamanBelajar: `Bermakna: Belajar menilai setiap tindakan dan mengambil pelajaran positif dari peragaan teman.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan tanggapan dan masukan dengan bahasa yang sopan.`,
          },
          {
            faseSintaks: `Sintak 6 (Bermain Peran): Menarik Kesimpulan dan Pesan Kebaikan`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru mengaitkan hasil peragaan dengan konsep inti materi ${safeTopic} serta mengajak murid menerapkan sikap baik tersebut di rumah dan sekolah.`,
            aktivitasSiswa: `Murid menyimpulkan pelajaran penting hari ini dan berkomitmen mempraktikkannya dalam kehidupan sehari-hari.`,
            pengalamanBelajar: `Bermakna: Menjadikan pengetahuan dan nilai kebaikan sebagai kebiasaan sehari-hari.`,
            prinsipPembelajaran: `Merefleksikan: Menghubungkan pengalaman bermain peran dengan perilaku nyata.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengenalan Skenario & Latihan Peran: Memahami Situasi & Pembagian Peran ${safeTopic}`;
        stageFocus = `Memahami cerita kontekstual melalui ${primaryMedia}, membagi peran kelompok, dan berlatih dialog/tindakan pada ${secondaryMedia} ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Bermain Peran): Pengenalan Cerita dan Situasi Nyata`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menampilkan cerita bergambar/video seputar ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} dan mendiskusikan isi ceritanya bersama murid.`,
            aktivitasSiswa: `Murid menyimak cerita dengan saksama, menyebutkan tokoh serta permasalahan yang muncul, dan mengaitkannya dengan konsep ${safeTopic}.`,
            pengalamanBelajar: `Bermakna: Memahami materi melalui alur cerita yang dekat dengan dunia anak.`,
            prinsipPembelajaran: `Memahami: Mengenali konsep dasar ${safeTopic} melalui situasi cerita.`,
          },
          {
            faseSintaks: `Sintak 2 (Bermain Peran): Pembagian Peran dan Pemahaman Tokoh`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok, membagikan naskah/panduan situasi pada ${secondaryMedia}, dan membimbing pembagian peran secara adil.`,
            aktivitasSiswa: `Murid memilih peran dalam kelompoknya, membaca tugas masing-masing tokoh pada ${secondaryMedia}, dan mendiskusikan cara menyelesaikan masalah dalam cerita.`,
            pengalamanBelajar: `Menggembirakan: Berbagi peran secara rukun dan kompak bersama teman kelompok.`,
            prinsipPembelajaran: `Merencanakan: Menyusun rencana percakapan dan tindakan pemecahan masalah.`,
          },
          {
            faseSintaks: `Sintak 3 (Bermain Peran): Latihan Peragaan Terbimbing dalam Kelompok`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru berkeliling mendampingi setiap kelompok berlatih memperagakan peran mereka dan memberikan saran agar kalimat serta tindakan sesuai dengan materi ${safeTopic}.`,
            aktivitasSiswa: `Murid berlatih memperagakan peran bersama teman sekelompok, saling membantu mengingatkan dialog, dan menyiapkan perlengkapan sederhana.`,
            pengalamanBelajar: `Berkesadaran: Melatih kesungguhan, kekompakan, dan rasa percaya diri sebelum tampil.`,
            prinsipPembelajaran: `Mengaplikasikan: Mencoba mempraktikkan konsep ${safeTopic} melalui latihan peran.`,
          },
        ];
      } else {
        stageName = `Tahap Pementasan Peran & Evaluasi (Pertemuan ${m}): Peragaan Kelas & Kesimpulan ${safeTopic}`;
        stageFocus = `Menampilkan simulasi bermain peran di depan kelas, mengulas hasil peragaan pada ${secondaryMedia}, dan evaluasi penguasaan ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 4 (Bermain Peran): Penampilan Simulasi Bermain Peran di Depan Kelas`,
            alokasiMenit: '25 Menit',
            aktivitasGuru: `Guru memandu jalannya penampilan bermain peran tiap kelompok secara bergantian dan mengarahkan murid penonton untuk mencatat pelajaran penting pada ${secondaryMedia}.`,
            aktivitasSiswa: `Kelompok pemeran tampil memperagakan penyelesaian masalah ${safeTopic} dengan penuh penghayatan, sementara kelompok lain menyimak dengan tertib dan memberi tepuk tangan apresiasi.`,
            pengalamanBelajar: `Menggembirakan: Merasakan kegembiraan tampil bersama kelompok dan belajar dari penampilan teman.`,
            prinsipPembelajaran: `Mengaplikasikan: Menampilkan pemahaman konsep dan sikap positif secara nyata.`,
          },
          {
            faseSintaks: `Sintak 5 (Bermain Peran): Diskusi dan Ulasan Hasil Peragaan`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memandu diskusi kelas untuk membahas keputusan dan cara penyelesaian masalah yang telah diperagakan oleh masing-masing kelompok.`,
            aktivitasSiswa: `Murid pemeran dan pengamat saling berbagi pendapat dengan santun mengenai tindakan terbaik yang sesuai dengan konsep ${safeTopic}.`,
            pengalamanBelajar: `Bermakna: Memperoleh pemahaman mendalam melalui diskusi terbuka yang saling menghargai.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan pendapat dan tanggapan secara runtut.`,
          },
          {
            faseSintaks: `Sintak 6 (Bermain Peran): Penarikan Kesimpulan dan Evaluasi Mandiri`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru merangkum konsep utama ${safeTopic} pada layar ${deviceStr} dan membagikan lembar evaluasi singkat untuk mengukur pemahaman individu murid.`,
            aktivitasSiswa: `Murid mencatat kesimpulan penting dan mengerjakan soal evaluasi mandiri dengan jujur dan teliti.`,
            pengalamanBelajar: `Berkesadaran: Mengukur pemahaman pribadi secara jujur dan bertanggung jawab.`,
            prinsipPembelajaran: `Merefleksikan: Mengikat makna pembelajaran dan membuktikan ketercapaian Tujuan Pembelajaran.`,
          },
        ];
      }
      break;
    }

    case 'DIFERENSIASI': {
      // PEMBELAJARAN BERDIFERENSIASI
      if (total === 1) {
        stageName = `Tahap Berdiferensiasi Terpadu: Belajar Sesuai Kesiapan, Pendampingan Bertahap & Unjuk Karya ${safeTopic}`;
        stageFocus = `Pemetaan kesiapan awal, pengenalan materi dengan beragam media (${primaryMedia}), latihan bertingkat pada ${secondaryMedia}, dan unjuk hasil belajar ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Diferensiasi): Mengenali Kesiapan dan Minat Belajar Murid`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru mengajukan beberapa pertanyaan ringan dan menampilkan gambar pada ${deviceStr} seputar ${safeTopic} untuk mengetahui pemahaman awal masing-masing murid.`,
            aktivitasSiswa: `Murid menjawab pertanyaan sesuai pemahaman awal mereka dengan tenang tanpa takut salah dan memilih cara belajar yang paling mereka sukai.`,
            pengalamanBelajar: `Berkesadaran: Merasa dihargai dan diterima sesuai kemampuan awal masing-masing.`,
            prinsipPembelajaran: `Memahami: Mengenali titik awal kesiapan belajar diri sendiri.`,
          },
          {
            faseSintaks: `Sintak 2 (Diferensiasi): Penyajian Materi Melalui Beragam Media (Diferensiasi Konten)`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menyajikan materi ${safeTopic} melalui beberapa cara: tayangan ${primaryMedia} pada ${deviceStr} untuk murid yang senang mengamati gambar/suara, bacaan bergambar, serta benda peraga untuk murid yang senang mencoba langsung.`,
            aktivitasSiswa: `Murid menyimak dan mempelajari konsep ${safeTopic} melalui media yang paling memudahkan mereka memahami materi.`,
            pengalamanBelajar: `Menggembirakan: Belajar dengan cara yang paling nyaman dan mudah dipahami oleh anak.`,
            prinsipPembelajaran: `Memahami: Membangun pemahaman konsep melalui media yang sesuai kebutuhan.`,
          },
          {
            faseSintaks: `Sintak 3 (Diferensiasi): Latihan Kelompok dengan Bimbingan Bertahap (Diferensiasi Proses)`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memberikan pendampingan lebih dekat bagi kelompok yang masih memerlukan bantuan dasar, serta memberikan tantangan soal pengembangan bagi kelompok yang sudah lancar.`,
            aktivitasSiswa: `Murid bekerja dalam kelompok mengerjakan lembar kegiatan ${secondaryMedia} sesuai tahapan kemampuan mereka dengan saling membantu.`,
            pengalamanBelajar: `Berkesadaran: Belajar secara bertahap sesuai kemampuan sehingga setiap anak mengalami kemajuan.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan konsep materi ${safeTopic} melalui latihan yang sesuai tingkat kesiapan.`,
          },
          {
            faseSintaks: `Sintak 4 (Diferensiasi): Menyajikan Hasil Belajar Sesuai Minat (Diferensiasi Produk)`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memberi kebebasan kepada kelompok untuk menyajikan hasil kerja mereka tentang ${safeTopic} dalam bentuk tulisan rapi, bagan bergambar, atau penjelasan lisan menggunakan peraga.`,
            aktivitasSiswa: `Murid bekerja sama menyusun dan menampilkan hasil belajar kelompok sesuai bentuk sajian yang mereka pilih di depan kelas.`,
            pengalamanBelajar: `Menggembirakan: Mengekspresikan pemahaman materi secara kreatif dan percaya diri.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan hasil kerja kelompok dengan cara yang menarik dan jelas.`,
          },
          {
            faseSintaks: `Sintak 5 (Diferensiasi): Penguatan Konsep dan Refleksi Kemajuan Belajar`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memberikan penguatan konsep utama ${safeTopic} pada layar ${deviceStr} dan mengapresiasi kemajuan belajar setiap murid.`,
            aktivitasSiswa: `Murid menyimpulkan materi bersama guru, menyadari kemajuan yang telah dicapai hari ini, dan mencatat poin penting di buku tulis.`,
            pengalamanBelajar: `Bermakna: Mensyukuri perkembangan kemampuan diri sendiri dan menghargai keberagaman teman.`,
            prinsipPembelajaran: `Merefleksikan: Menilai kemajuan belajar pribadi secara jujur.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pemetaan Kesiapan & Eksplorasi Beragam Media: Pengenalan Konsep Dasar ${safeTopic}`;
        stageFocus = `Memetakan kesiapan awal murid, mempelajari konsep dasar ${safeTopic} melalui beragam media (${primaryMedia}), dan latihan terbimbing pada ${secondaryMedia}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Diferensiasi): Pemetaan Kesiapan Belajar Awal Murid`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru melakukan tanya jawab awal dan kuis gambar singkat pada ${deviceStr} seputar ${safeTopic} untuk mengelompokkan kebutuhan bimbingan murid.`,
            aktivitasSiswa: `Murid merespons pertanyaan guru secara jujur dan bergabung ke dalam kelompok belajar dengan tertib.`,
            pengalamanBelajar: `Berkesadaran: Mengenali kesiapan diri untuk mempelajari materi baru.`,
            prinsipPembelajaran: `Memahami: Mengenal gambaran awal materi ${safeTopic}.`,
          },
          {
            faseSintaks: `Sintak 2 (Diferensiasi): Mengamati Materi Melalui Beragam Media Pilihan`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menyajikan penjelasan konsep dasar ${safeTopic} menggunakan tayangan ${primaryMedia} pada ${deviceStr}, kartu bacaan bergambar, serta alat peraga nyata.`,
            aktivitasSiswa: `Murid mengamati media ajar dengan antusias, mencatat ciri-ciri penting ${safeTopic}, dan bertanya jika ada bagian yang belum dimengerti.`,
            pengalamanBelajar: `Menggembirakan: Mempelajari materi baru dengan bantuan media visual dan benda nyata yang menarik.`,
            prinsipPembelajaran: `Memahami: Menangkap konsep dasar ${safeTopic} sesuai gaya belajar masing-masing.`,
          },
          {
            faseSintaks: `Sintak 3 (Diferensiasi): Eksplorasi Konsep Dasar dengan Bimbingan Bertahap`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membagikan lembar kerja ${secondaryMedia} tahap pengenalan dan mendampingi kelompok yang memerlukan penjelasan ulang secara sabar.`,
            aktivitasSiswa: `Murid mengerjakan latihan dasar pada ${secondaryMedia} bersama kelompoknya dan memastikan seluruh anggota memahami konsep awal.`,
            pengalamanBelajar: `Bermakna: Membangun dasar pemahaman yang kuat melalui latihan bertahap.`,
            prinsipPembelajaran: `Mengaplikasikan: Mencoba menerapkan konsep dasar pada latihan terbimbing.`,
          },
        ];
      } else {
        stageName = `Tahap Pendalaman Berjenjang & Unjuk Karya (Pertemuan ${m}): Kreasi Produk & Evaluasi ${safeTopic}`;
        stageFocus = `Menyelesaikan latihan berjenjang pada ${secondaryMedia}, membuat karya sajian pemahaman ${safeTopic}, dan evaluasi ketuntasan belajar`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 3 Lanjutan (Diferensiasi): Pemecahan Masalah Berjenjang Sesuai Kemampuan`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memberikan tugas pemecahan masalah tentang ${safeTopic} pada ${secondaryMedia} dengan tingkat bantuan yang disesuaikan dengan perkembangan tiap kelompok.`,
            aktivitasSiswa: `Murid berdiskusi menyelesaikan tantangan soal atau kegiatan praktik pada ${secondaryMedia} dengan teliti dan kompak.`,
            pengalamanBelajar: `Berkesadaran: Berusaha menyelesaikan tantangan belajar dengan sungguh-sungguh.`,
            prinsipPembelajaran: `Mengaplikasikan: Menggunakan konsep ${safeTopic} untuk memecahkan persoalan nyata.`,
          },
          {
            faseSintaks: `Sintak 4 (Diferensiasi): Membuat dan Menampilkan Karya Pemahaman (Diferensiasi Produk)`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memfasilitasi setiap kelompok menyajikan hasil kerja mereka (berupa ringkasan bergambar, peragaan benda, atau penjelasan lisan) di depan kelas.`,
            aktivitasSiswa: `Kelompok menampilkan hasil kerja mereka dengan percaya diri dan saling memberikan tanggapan positif kepada kelompok lain.`,
            pengalamanBelajar: `Menggembirakan: Bangga menampilkan hasil karya kelompok dan menghargai keunikan karya teman.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyajikan pemahaman konsep ${safeTopic} secara kreatif dan jelas.`,
          },
          {
            faseSintaks: `Sintak 5 (Diferensiasi): Penguatan Akhir dan Evaluasi Mandiri`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru merangkum konsep utama ${safeTopic} pada ${deviceStr} dan membagikan lembar evaluasi mandiri untuk mengukur ketuntasan Tujuan Pembelajaran.`,
            aktivitasSiswa: `Murid mengerjakan evaluasi mandiri secara jujur dan tenang, lalu mengumpulkan hasilnya kepada guru.`,
            pengalamanBelajar: `Bermakna: Menyadari hasil perkembangan belajar yang telah dicapai.`,
            prinsipPembelajaran: `Merefleksikan: Membuktikan penguasaan materi ${safeTopic} secara mandiri.`,
          },
        ];
      }
      break;
    }

    case 'COOPERATIVE': {
      // PEMBELAJARAN KOOPERATIF (KERJA KELOMPOK TERSTRUKTUR)
      if (total === 1) {
        stageName = `Tahap Kooperatif Terpadu: Penjelasan Inti, Belajar Bersama Tutor Sebaya & Penghargaan Kelompok ${safeTopic}`;
        stageFocus = `Penyampaian materi melalui ${primaryMedia}, kerja kelompok saling membantu pada ${secondaryMedia}, kuis mandiri, dan penghargaan kelompok ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (Kooperatif): Menyampaikan Tujuan dan Memotivasi Murid`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru menegaskan manfaat mempelajari ${safeTopic} dan menyemangati murid bahwa keberhasilan kelompok ditentukan oleh kerja sama dan kepedulian saling membantu antarteman.`,
            aktivitasSiswa: `Murid menyimak penjelasan guru dengan bersemangat dan berkomitmen untuk aktif bekerja sama dalam kelompok.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh semangat kebersamaan dan persaudaraan di dalam kelas.`,
            prinsipPembelajaran: `Memahami: Mengetahui sasaran belajar dan pentingnya gotong royong.`,
          },
          {
            faseSintaks: `Sintak 2 (Kooperatif): Menyajikan Penjelasan Konsep Materi`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menjelaskan konsep pokok materi ${safeTopic} secara runtut dan jelas berbantuan tayangan ${primaryMedia} pada ${deviceStr} (melalui ${platformStr}).`,
            aktivitasSiswa: `Murid memperhatikan penjelasan guru dengan fokus, mencatat hal-hal penting, dan bertanya apabila ada langkah yang belum dimengerti.`,
            pengalamanBelajar: `Berkesadaran: Memusatkan perhatian penuh untuk memahami penjelasan dasar materi.`,
            prinsipPembelajaran: `Memahami: Menguasai konsep dasar materi ${safeTopic} sebagai bekal diskusi kelompok.`,
          },
          {
            faseSintaks: `Sintak 3 (Kooperatif): Membentuk Kelompok Belajar Campuran`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok belajar beranggotakan 4-5 anak yang beragam kemampuannya, lalu membagikan lembar kerja ${secondaryMedia}.`,
            aktivitasSiswa: `Murid bergabung bersama kelompoknya dengan tertib, membagi peran kerja, dan mempelajari petunjuk pada ${secondaryMedia}.`,
            pengalamanBelajar: `Menggembirakan: Belajar bersama seluruh teman dengan rukun tanpa membeda-bedakan.`,
            prinsipPembelajaran: `Merencanakan: Mengatur pembagian tugas kelompok secara adil.`,
          },
          {
            faseSintaks: `Sintak 4 (Kooperatif): Membimbing Kerja Kelompok dan Tutor Sebaya`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru berkeliling memfasilitasi diskusi kelompok dan mendorong murid yang sudah lebih paham untuk membantu menjelaskan kepada teman sekelompoknya dengan sabar.`,
            aktivitasSiswa: `Murid berdiskusi menyelesaikan latihan pada ${secondaryMedia}; anggota yang sudah paham membimbing temannya hingga seluruh anggota kelompok benar-benar mengerti.`,
            pengalamanBelajar: `Bermakna: Merasakan indahnya saling membantu dan berbagi ilmu dengan teman sebaya.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan konsep ${safeTopic} secara bersama-sama hingga seluruh anggota paham.`,
          },
          {
            faseSintaks: `Sintak 5 (Kooperatif): Evaluasi dan Kuis Pemahaman Mandiri`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memberikan kuis atau soal latihan mandiri untuk mengukur pemahaman masing-masing murid setelah belajar bersama kelompok.`,
            aktivitasSiswa: `Setiap murid mengerjakan soal evaluasi secara mandiri dan jujur tanpa menyontek untuk membuktikan hasil belajar kelompoknya.`,
            pengalamanBelajar: `Berkesadaran: Menunjukkan kejujuran dan tanggung jawab pribadi atas hasil belajar.`,
            prinsipPembelajaran: `Membuktikan Kemampuan: Mengukur penguasaan konsep ${safeTopic} secara individu.`,
          },
          {
            faseSintaks: `Sintak 6 (Kooperatif): Memberikan Penghargaan Prestasi Kelompok`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru memberikan apresiasi dan predikat penghargaan (seperti Kelompok Terkompak, Kelompok Teraktif, Kelompok Teladan) kepada seluruh tim belajar.`,
            aktivitasSiswa: `Murid bertepuk tangan gembira merayakan keberhasilan bersama dan saling mengucapkan terima kasih kepada anggota kelompoknya.`,
            pengalamanBelajar: `Menggembirakan: Merasa dihargai atas usaha keras dan kekompakan kelompok.`,
            prinsipPembelajaran: `Merefleksikan: Menyadari manfaat kerja sama tim dalam mencapai keberhasilan belajar.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengenalan Konsep & Kerja Kelompok Awal: Penjelasan Inti & Diskusi Kooperatif ${safeTopic}`;
        stageFocus = `Menyimak penjelasan konsep dasar ${safeTopic} melalui ${primaryMedia}, pembentukan tim belajar, dan latihan kelompok pada ${secondaryMedia}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 & 2 (Kooperatif): Penyampaian Motivasi dan Penjelasan Konsep Dasar`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memotivasi semangat kerja sama murid dan menyajikan konsep dasar ${safeTopic} menggunakan media ${primaryMedia} pada ${deviceStr}.`,
            aktivitasSiswa: `Murid menyimak penjelasan dan contoh yang ditayangkan guru dengan saksama serta mencatat poin-poin penting di buku tulis.`,
            pengalamanBelajar: `Berkesadaran: Memperhatikan penjelasan konsep awal dengan fokus dan antusias.`,
            prinsipPembelajaran: `Memahami: Mengenal prinsip dasar materi ${safeTopic} secara jelas.`,
          },
          {
            faseSintaks: `Sintak 3 (Kooperatif): Pengorganisasian Kelompok Belajar Campuran`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru mengelompokkan murid secara beragam (4-5 murid per tim), membagikan lembar kegiatan ${secondaryMedia}, dan menjelaskan aturan saling membantu dalam kelompok.`,
            aktivitasSiswa: `Murid berkumpul bersama timnya dengan tertib, menyepakati tugas masing-masing anggota, dan membaca lembar kerja ${secondaryMedia}.`,
            pengalamanBelajar: `Menggembirakan: Membangun keakraban dan kesiapan bekerja sama dalam tim.`,
            prinsipPembelajaran: `Merencanakan: Mengatur cara kerja kelompok agar semua anggota terlibat aktif.`,
          },
          {
            faseSintaks: `Sintak 4 (Kooperatif): Diskusi Kelompok Terbimbing dan Saling Membantu`,
            alokasiMenit: '25 Menit',
            aktivitasGuru: `Guru berkeliling membimbing kelompok mengerjakan latihan dasar tentang ${safeTopic} pada ${secondaryMedia} dan memotivasi murid untuk saling mengajari.`,
            aktivitasSiswa: `Murid mendiskusikan jawaban latihan bersama-sama dan saling menjelaskan cara penyelesaian hingga seluruh anggota tim memahami materi dasar.`,
            pengalamanBelajar: `Bermakna: Belajar memahami materi lebih mudah melalui diskusi dan bantuan teman sebaya.`,
            prinsipPembelajaran: `Mengaplikasikan: Mempraktikkan konsep dasar ${safeTopic} dalam latihan kelompok.`,
          },
        ];
      } else {
        stageName = `Tahap Pendalaman Kelompok, Kuis Mandiri & Penghargaan (Pertemuan ${m}): Ketuntasan ${safeTopic}`;
        stageFocus = `Pendalaman soal kontekstual bersama tutor sebaya pada ${secondaryMedia}, kuis evaluasi mandiri, dan penghargaan kelompok ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 4 Lanjutan (Kooperatif): Pemecahan Masalah Kelompok dan Tutor Sebaya`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memberikan tantangan soal penerapan ${safeTopic} pada ${secondaryMedia} dan mendampingi kelompok berlatih bersama sebelum kuis mandiri.`,
            aktivitasSiswa: `Murid bekerja sama menyelesaikan soal penerapan, memastikan tidak ada anggota kelompok yang tertinggal pemahamannya.`,
            pengalamanBelajar: `Bermakna: Menguatkan rasa peduli dan tanggung jawab bersama terhadap pemahaman teman satu tim.`,
            prinsipPembelajaran: `Mengaplikasikan: Menyelesaikan persoalan kontekstual ${safeTopic} secara tepat.`,
          },
          {
            faseSintaks: `Sintak 5 (Kooperatif): Presentasi Kelompok dan Kuis Evaluasi Mandiri`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru meminta perwakilan kelompok menampilkan jawaban di depan kelas, lalu membagikan lembar kuis evaluasi untuk dikerjakan secara mandiri oleh tiap murid.`,
            aktivitasSiswa: `Perwakilan kelompok memaparkan hasil diskusi, kemudian seluruh murid mengerjakan kuis evaluasi secara mandiri dan jujur.`,
            pengalamanBelajar: `Berkesadaran: Mengukur kemampuan diri sendiri secara jujur setelah berlatih bersama kelompok.`,
            prinsipPembelajaran: `Membuktikan Kemampuan: Menunjukkan penguasaan materi ${safeTopic} secara mandiri.`,
          },
          {
            faseSintaks: `Sintak 6 (Kooperatif): Penghargaan Prestasi dan Kekompakan Kelompok`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru mengumumkan capaian perkembangan kelompok, memberikan bintang apresiasi/penghargaan kepada seluruh tim, dan menegaskan kesimpulan akhir ${safeTopic}.`,
            aktivitasSiswa: `Murid menyambut penghargaan dengan gembira, saling berjabat tangan memberi selamat, dan mencatat kesimpulan akhir pelajaran.`,
            pengalamanBelajar: `Menggembirakan: Merayakan keberhasilan belajar bersama dengan penuh rasa syukur.`,
            prinsipPembelajaran: `Merefleksikan: Menghargai proses kerja sama dan pencapaian belajar bersama.`,
          },
        ];
      }
      break;
    }

    case 'KONTEKSTUAL': {
      // PEMBELAJARAN KONTEKSTUAL (CTL)
      if (total === 1) {
        stageName = `Tahap Kontekstual Terpadu: Mengaitkan Pengalaman Nyata, Menemukan & Praktik ${safeTopic}`;
        stageFocus = `Mengaitkan materi dengan kehidupan nyata melalui ${primaryMedia}, penemuan konsep pada ${secondaryMedia}, peragaan contoh, dan penilaian nyata ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (CTL): Mengaitkan Materi dengan Pengalaman Nyata (Konstruktivisme)`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menayangkan ${primaryMedia} pada ${deviceStr} (melalui ${platformStr}) yang memperlihatkan kegiatan sehari-hari di sekitar rumah atau sekolah yang berhubungan dengan ${safeTopic}.`,
            aktivitasSiswa: `Murid mengingat pengalaman mereka sendiri di rumah/sekolah dan menghubungkannya dengan materi ${safeTopic} yang sedang dipelajari.`,
            pengalamanBelajar: `Bermakna: Menyadari bahwa materi pelajaran sangat dekat dan berguna dalam kehidupan sehari-hari.`,
            prinsipPembelajaran: `Memahami: Membangun pemahaman baru dari pengalaman nyata yang sudah dikenal murid.`,
          },
          {
            faseSintaks: `Sintak 2 & 3 (CTL): Menemukan Konsep dan Bertanya Aktif`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membagikan lembar kegiatan ${secondaryMedia} serta benda konkret, lalu memancing murid untuk mengamati dan mengajukan pertanyaan tentang cara kerja ${safeTopic}.`,
            aktivitasSiswa: `Murid mengamati benda konkret, menemukan sendiri ciri atau langkah penyelesaian pada ${secondaryMedia}, dan aktif bertanya kepada guru.`,
            pengalamanBelajar: `Berkesadaran: Merasakan kepuasan menemukan pengetahuan melalui pengamatan dan tanya jawab aktif.`,
            prinsipPembelajaran: `Menemukan: Menggali informasi secara aktif melalui pengamatan benda nyata.`,
          },
          {
            faseSintaks: `Sintak 4 (CTL): Belajar dalam Kelompok (Masyarakat Belajar)`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memfasilitasi kerja kelompok agar murid saling bertukar pikiran dan bekerja sama menyelesaikan persoalan nyata pada ${secondaryMedia}.`,
            aktivitasSiswa: `Murid berdiskusi dengan rukun dalam kelompoknya, saling mendengarkan pendapat teman, dan menyelesaikan tugas pada ${secondaryMedia}.`,
            pengalamanBelajar: `Menggembirakan: Belajar bersama teman dalam suasana yang akrab dan saling mendukung.`,
            prinsipPembelajaran: `Bekerja Sama: Membangun pemahaman bersama melalui diskusi kelompok.`,
          },
          {
            faseSintaks: `Sintak 5 (CTL): Peragaan Contoh Nyata (Pemodelan)`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru bersama salah satu murid memperagakan contoh langkah yang benar dalam menerapkan materi ${safeTopic} di depan kelas.`,
            aktivitasSiswa: `Murid memperhatikan peragaan contoh dengan saksama, lalu mencoba mempraktikkan langkah tersebut bersama kelompoknya.`,
            pengalamanBelajar: `Berkesadaran: Memperoleh contoh nyata yang jelas sehingga mudah dipraktikkan.`,
            prinsipPembelajaran: `Mengaplikasikan: Menirukan dan mempraktikkan langkah penerapan konsep secara tepat.`,
          },
          {
            faseSintaks: `Sintak 6 & 7 (CTL): Refleksi Makna dan Penilaian Kemampuan Nyata`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memandu murid merenungkan manfaat materi ${safeTopic} bagi kehidupan sehari-hari serta menilai unjuk kerja dan hasil latihan mandiri murid.`,
            aktivitasSiswa: `Murid menyampaikan manfaat materi yang dipelajari hari ini dan menyelesaikan soal latihan mandiri dengan jujur dan teliti.`,
            pengalamanBelajar: `Bermakna: Mengukuhkan pemahaman konsep dan kesiapan menerapkannya di rumah.`,
            prinsipPembelajaran: `Merefleksikan: Menilai pemahaman diri dan manfaat ilmu bagi kehidupan nyata.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengaitan Pengalaman Nyata & Penemuan Konsep Dasar ${safeTopic}`;
        stageFocus = `Menghubungkan pengalaman sehari-hari murid dengan ${primaryMedia}, mengamati contoh konkret, dan menemukan konsep dasar pada ${secondaryMedia} ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (CTL): Mengaitkan Materi dengan Pengalaman Sehari-hari`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menampilkan contoh kegiatan nyata di lingkungan sekitar melalui ${primaryMedia} pada ${deviceStr} dan mengajak murid mengaitkannya dengan materi ${safeTopic}.`,
            aktivitasSiswa: `Murid menceritakan pengalaman mereka yang berkaitan dengan contoh tersebut dan mengenali kegunaan materi ${safeTopic}.`,
            pengalamanBelajar: `Bermakna: Menemukan hubungan langsung antara pelajaran di kelas dengan kehidupan nyata.`,
            prinsipPembelajaran: `Memahami: Membangun pemahaman awal dari pengalaman nyata sehari-hari.`,
          },
          {
            faseSintaks: `Sintak 2 & 3 (CTL): Mengamati Benda Konkret dan Bertanya Aktif`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menyediakan benda konkret/ilustrasi terkait ${safeTopic} dan memancing rasa ingin tahu murid untuk bertanya serta mencari tahu konsep dasarnya.`,
            aktivitasSiswa: `Murid mengamati objek dengan teliti, mengajukan pertanyaan tentang hal yang ingin diketahui, dan mencatat temuan awal pada ${secondaryMedia}.`,
            pengalamanBelajar: `Menggembirakan: Tumbuh keberanian bertanya dan mengamati objek nyata secara langsung.`,
            prinsipPembelajaran: `Menemukan: Mengidentifikasi ciri dan konsep dasar melalui pengamatan.`,
          },
          {
            faseSintaks: `Sintak 4 (CTL): Diskusi Kelompok Masyarakat Belajar`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru membimbing murid bekerja dalam kelompok untuk mendiskusikan lembar kegiatan pengenalan ${safeTopic} pada ${secondaryMedia}.`,
            aktivitasSiswa: `Murid bertukar pendapat dengan santun dalam kelompok dan menyusun jawaban bersama atas persoalan dasar pada ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Belajar bekerja sama dan menghargai pendapat teman satu kelompok.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan pemahaman konsep dasar dalam diskusi kelompok.`,
          },
        ];
      } else {
        stageName = `Tahap Pemodelan Praktik & Penilaian Nyata (Pertemuan ${m}): Penerapan Sehari-hari ${safeTopic}`;
        stageFocus = `Memperagakan penerapan nyata materi ${safeTopic}, menyelesaikan tantangan kontekstual pada ${secondaryMedia}, dan evaluasi penguasaan TP`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 5 (CTL): Peragaan Contoh Penerapan Nyata (Pemodelan)`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memperagakan cara menyelesaikan persoalan sehari-hari yang berkaitan dengan ${safeTopic} menggunakan alat peraga dan ${deviceStr}, lalu meminta murid mempraktikkannya.`,
            aktivitasSiswa: `Murid mengamati contoh peragaan guru, kemudian mempraktikkan langkah penyelesaian kasus nyata pada lembar kerja ${secondaryMedia} bersama kelompok.`,
            pengalamanBelajar: `Berkesadaran: Memahami langkah kerja secara jelas melalui peragaan dan praktik langsung.`,
            prinsipPembelajaran: `Mengaplikasikan: Mempraktikkan cara penyelesaian masalah nyata secara runtut.`,
          },
          {
            faseSintaks: `Sintak 6 (CTL): Menampilkan Hasil Kerja dan Refleksi Manfaat Materi`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru memfasilitasi perwakilan kelompok menyampaikan hasil praktik mereka di depan kelas dan memandu refleksi tentang manfaat ${safeTopic} di rumah.`,
            aktivitasSiswa: `Perwakilan kelompok memaparkan hasil kerja mereka, sementara murid lain memberi tanggapan santun dan menyebutkan contoh penerapan di rumah.`,
            pengalamanBelajar: `Menggembirakan: Bangga berbagi hasil praktik dan memahami manfaat ilmu bagi keluarga dan lingkungan.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan hasil praktik dan manfaat pembelajaran secara jelas.`,
          },
          {
            faseSintaks: `Sintak 7 (CTL): Penilaian Kemampuan Nyata dan Evaluasi Mandiri`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menilai unjuk kerja murid dan membagikan lembar soal evaluasi kontekstual untuk dikerjakan secara mandiri.`,
            aktivitasSiswa: `Murid mengerjakan soal evaluasi mandiri dengan jujur, tenang, dan teliti sebagai bukti penguasaan materi ${safeTopic}.`,
            pengalamanBelajar: `Bermakna: Membuktikan kemampuan diri dalam menyelesaikan persoalan nyata.`,
            prinsipPembelajaran: `Merefleksikan: Menunjukkan ketuntasan pencapaian Tujuan Pembelajaran.`,
          },
        ];
      }
      break;
    }

    default: {
      // PEMBELAJARAN BERBASIS MASALAH (PBL) - DEFAULT
      if (total === 1) {
        stageName = `Tahap Pemecahan Masalah Terpadu: Pengenalan Masalah, Penyelidikan & Evaluasi ${safeTopic}`;
        stageFocus = `Pengenalan masalah nyata melalui ${primaryMedia}, penyelidikan kelompok pada ${secondaryMedia}, presentasi solusi, dan evaluasi konsep ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (PBL): Pengenalan Masalah Kontekstual kepada Murid`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru menampilkan permasalahan nyata sehari-hari seputar materi ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} (melalui ${platformStr}), lalu mengajak murid mengamati masalah yang perlu dipecahkan.`,
            aktivitasSiswa: `Murid mengamati tayangan ${primaryMedia} dengan penuh perhatian, mengenali permasalahan utama terkait ${safeTopic}, dan mengajukan pertanyaan tentang hal yang ingin diketahui.`,
            pengalamanBelajar: `Bermakna: Menghubungkan materi pelajaran dengan permasalahan nyata di lingkungan sekolah atau rumah.`,
            prinsipPembelajaran: `Memahami: Mengenali pokok permasalahan dan konsep dasar materi ${safeTopic}.`,
          },
          {
            faseSintaks: `Sintak 2 (PBL): Mengorganisasikan Murid untuk Belajar Berkelompok`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok belajar (4-5 murid), membagikan ${secondaryMedia}, dan membimbing pembagian tugas dalam kelompok (ketua, penulis, pemeriksa, penyaji) secara adil.`,
            aktivitasSiswa: `Murid berkumpul bersama kelompoknya, membagi tugas secara rukun, membaca petunjuk kerja pada ${secondaryMedia}, dan merencanakan langkah penyelesaian masalah.`,
            pengalamanBelajar: `Menggembirakan: Belajar bersama teman kelompok dalam suasana yang ramah, kompak, dan saling menghargai.`,
            prinsipPembelajaran: `Merencanakan: Menyusun langkah penyelesaian tugas kelompok secara bersama-sama.`,
          },
          {
            faseSintaks: `Sintak 3 (PBL): Membimbing Penyelidikan Mandiri dan Kelompok`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru berkeliling mendampingi kegiatan penyelidikan setiap kelompok, memberikan bimbingan bertahap bagi kelompok yang mengalami kesulitan, dan mendorong murid berpikir teliti.`,
            aktivitasSiswa: `Murid bekerja sama mengamati contoh/benda peraga, mengolah informasi pada tabel ${secondaryMedia}, berdiskusi mencari cara penyelesaian yang tepat, dan menuliskan hasilnya.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketelitian, fokus berpikir, dan kerja sama dalam memecahkan persoalan.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan konsep materi ${safeTopic} untuk menyelesaikan masalah pada lembar kerja.`,
          },
          {
            faseSintaks: `Sintak 4 (PBL): Mengembangkan dan Menyajikan Hasil Pemecahan Masalah`,
            alokasiMenit: '10 Menit',
            aktivitasGuru: `Guru memfasilitasi perwakilan setiap kelompok untuk menampilkan hasil pemecahan masalah di depan kelas serta memandu murid lain memberikan tanggapan yang santun.`,
            aktivitasSiswa: `Perwakilan kelompok membacakan atau memperagakan hasil diskusi pemecahan masalah di depan kelas dengan percaya diri, sementara kelompok lain menyimak dan memberi apresiasi.`,
            pengalamanBelajar: `Menggembirakan: Melatih keberanian berbicara di depan kelas dan menghargai hasil kerja teman.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan cara penyelesaian masalah dengan bahasa yang runtut dan jelas.`,
          },
          {
            faseSintaks: `Sintak 5 (PBL): Menganalisis dan Mengevaluasi Proses Pemecahan Masalah`,
            alokasiMenit: '5 Menit',
            aktivitasGuru: `Guru meluruskan kekeliruan yang ditemukan selama diskusi, menguatkan jawaban yang benar, dan merangkum konsep utama materi ${safeTopic} pada layar ${deviceStr}.`,
            aktivitasSiswa: `Bersama guru, murid menyimpulkan konsep penting pembelajaran hari ini, memeriksa kembali hasil kerja kelompok, dan mencatat rangkuman di buku tulis.`,
            pengalamanBelajar: `Bermakna: Menguatkan pemahaman konsep yang benar setelah melalui proses pemecahan masalah.`,
            prinsipPembelajaran: `Merefleksikan: Meninjau kembali cara penyelesaian masalah dan mengukuhkan kesimpulan akhir.`,
          },
        ];
      } else if (m === 1) {
        stageName = `Tahap Pengenalan Masalah & Konsep Dasar: Orientasi Kasus Nyata & Eksplorasi Awal ${safeTopic}`;
        stageFocus = `Mengamati masalah nyata melalui ${primaryMedia}, mengenal konsep dasar dan benda konkret, serta diskusi awal kelompok pada ${secondaryMedia} ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 (PBL): Pengenalan Masalah Nyata Sehari-hari`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menyajikan permasalahan nyata dari kehidupan sehari-hari tentang ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} untuk membangkitkan rasa ingin tahu murid.`,
            aktivitasSiswa: `Murid mengamati tayangan atau benda peraga dengan teliti, mencatat informasi penting yang ditemukan, dan menanyakan hal yang belum dipahami.`,
            pengalamanBelajar: `Bermakna: Menghubungkan pengalaman sehari-hari murid dengan konsep dasar yang dipelajari.`,
            prinsipPembelajaran: `Memahami: Mengenali ciri-ciri dan konsep dasar materi ${safeTopic}.`,
          },
          {
            faseSintaks: `Sintak 2 (PBL): Pengorganisasian Kelompok dan Pemahaman Tugas`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagi murid menjadi kelompok belajar (4-5 murid) dan membagikan lembar kerja ${secondaryMedia} tahap pengenalan konsep dasar.`,
            aktivitasSiswa: `Murid berkumpul bersama kelompoknya dengan tertib, membaca petunjuk pada ${secondaryMedia}, dan membagi tugas pengamatan secara adil.`,
            pengalamanBelajar: `Menggembirakan: Berinteraksi secara akrab dan rukun dalam kelompok belajar.`,
            prinsipPembelajaran: `Merencanakan: Mengatur pembagian tugas pengamatan bersama teman kelompok.`,
          },
          {
            faseSintaks: `Sintak 3 (PBL): Penyelidikan Awal dan Pengenalan Konsep Dasar`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru berkeliling mendampingi setiap kelompok mengamati benda peraga/contoh dasar ${safeTopic} dan memberikan bimbingan bertahap kepada murid yang membutuhkan.`,
            aktivitasSiswa: `Murid melakukan pengamatan langsung, mendiskusikan konsep dasar ${safeTopic}, dan mencatat hasil temuan awal pada ${secondaryMedia}.`,
            pengalamanBelajar: `Berkesadaran: Mengamati dengan teliti dan membangun pemahaman dasar yang kuat.`,
            prinsipPembelajaran: `Mengaplikasikan: Menggunakan pengamatan langsung untuk memahami konsep dasar.`,
          },
        ];
      } else if (m === total) {
        stageName = `Tahap Penyajian Solusi & Evaluasi Tuntas: Presentasi Karya & Evaluasi Capaian TP ${safeTopic}`;
        stageFocus = `Menyajikan hasil pemecahan masalah kelompok, mengevaluasi cara penyelesaian pada ${secondaryMedia}, dan mengerjakan evaluasi tuntas ${safeTopic}`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 4 (PBL): Menyajikan Hasil Pemecahan Masalah di Depan Kelas`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru memandu jalannya presentasi hasil pemecahan masalah tiap kelompok secara bergantian dan memfasilitasi tanya jawab yang santun antarkelompok.`,
            aktivitasSiswa: `Setiap kelompok memaparkan hasil penyelesaian masalah ${safeTopic} di depan kelas dengan percaya diri, menjawab pertanyaan teman, dan menerima masukan positif.`,
            pengalamanBelajar: `Menggembirakan: Bangga menampilkan hasil kerja kelompok dan belajar menghargai pendapat teman.`,
            prinsipPembelajaran: `Mengomunikasikan: Menyampaikan alasan dan langkah pemecahan masalah secara runtut.`,
          },
          {
            faseSintaks: `Sintak 5 (PBL): Menganalisis dan Mengevaluasi Proses Pemecahan Masalah`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menguatkan solusi yang tepat dari seluruh kelompok, meluruskan kekeliruan yang masih ada, dan merangkum intisari materi ${safeTopic} pada layar ${deviceStr}.`,
            aktivitasSiswa: `Murid bersama guru meninjau kembali cara penyelesaian masalah yang paling tepat serta mencatat kesimpulan penting di buku tulis.`,
            pengalamanBelajar: `Bermakna: Memahami secara utuh langkah penyelesaian masalah yang benar dan alasannya.`,
            prinsipPembelajaran: `Merefleksikan: Menilai kembali proses berpikir dan menguatkan pemahaman konsep.`,
          },
          {
            faseSintaks: `Evaluasi Mandiri Ketuntasan Tujuan Pembelajaran`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membagikan lembar soal evaluasi mandiri untuk mengukur ketuntasan pemahaman setiap murid terhadap Tujuan Pembelajaran materi ${safeTopic}.`,
            aktivitasSiswa: `Murid mengerjakan soal evaluasi secara mandiri, tenang, jujur, dan teliti.`,
            pengalamanBelajar: `Berkesadaran: Mengukur kemampuan diri sendiri dengan penuh kejujuran dan tanggung jawab.`,
            prinsipPembelajaran: `Membuktikan Kemampuan: Menunjukkan ketuntasan penguasaan Tujuan Pembelajaran.`,
          },
        ];
      } else {
        stageName = `Tahap Penyelidikan Lanjutan (Pertemuan ${m}): Pemecahan Kasus Nyata & Perumusan Solusi ${safeTopic}`;
        stageFocus = `Melakukan penyelidikan kelompok terhadap kasus nyata ${safeTopic}, mengolah data pada ${secondaryMedia}, dan menyusun solusi kelompok`;
        kegiatanInti = [
          {
            faseSintaks: `Sintak 1 & 2 Lanjutan (PBL): Analisis Kasus Nyata Lanjutan`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru menyajikan permasalahan kontekstual lanjutan terkait ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} yang menantang murid menerapkan konsep dari pertemuan sebelumnya.`,
            aktivitasSiswa: `Murid mencermati permasalahan baru tersebut bersama kelompoknya, menghubungkannya dengan konsep dasar yang telah dipelajari, dan menyusun rencana penyelesaian.`,
            pengalamanBelajar: `Bermakna: Merasakan manfaat materi pelajaran untuk menyelesaikan persoalan yang lebih menantang.`,
            prinsipPembelajaran: `Memahami: Mengenali hubungan antara konsep dasar dengan permasalahan nyata.`,
          },
          {
            faseSintaks: `Sintak 3 (PBL): Penyelidikan Kelompok dan Penyelesaian Masalah`,
            alokasiMenit: '20 Menit',
            aktivitasGuru: `Guru berkeliling membimbing kelompok melakukan perhitungan/analisis pada ${secondaryMedia} dan memastikan seluruh anggota kelompok ikut berpikir aktif.`,
            aktivitasSiswa: `Murid bekerja sama melakukan penyelidikan, menghitung atau menganalisis data pada ${secondaryMedia}, dan merumuskan langkah solusi yang tepat.`,
            pengalamanBelajar: `Berkesadaran: Melatih ketelitian, penalaran logis, dan kerja sama tim dalam menyelesaikan masalah.`,
            prinsipPembelajaran: `Mengaplikasikan: Menerapkan langkah-langkah konsep ${safeTopic} untuk memecahkan persoalan.`,
          },
          {
            faseSintaks: `Sintak 4 Awal (PBL): Menyusun Laporan Hasil Kerja dan Pemeriksaan Antarkelompok`,
            alokasiMenit: '15 Menit',
            aktivitasGuru: `Guru membimbing setiap kelompok merapikan hasil kerja pada ${secondaryMedia} dan memfasilitasi pertukaran saran singkat antarkelompok.`,
            aktivitasSiswa: `Kelompok memeriksa kembali ketepatan jawaban mereka, menyimak saran dari kelompok rekan, dan menyempurnakan hasil kerja untuk dipresentasikan.`,
            pengalamanBelajar: `Menggembirakan: Belajar saling memeriksa dan memberi masukan dengan cara yang santun.`,
            prinsipPembelajaran: `Menyempurnakan Solusi: Memeriksa kembali ketepatan hasil kerja kelompok sebelum disajikan.`,
          },
        ];
      }
      break;
    }
  }

  // Susun Kegiatan Awal & Kegiatan Akhir yang bervariasi untuk pertemuan ke-m
  const pendahuluan = buildVariedKegiatanAwal(m, total, safeTopic, stageName, model, tpText, options);
  const penutup = buildVariedKegiatanAkhir(m, total, safeTopic, secondaryMedia, deviceStr);

  return {
    stageName,
    stageFocus,
    pendahuluan,
    kegiatanInti,
    penutup,
  };
}
