import re

with open('src/utils/rpmUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getPedagogicalStageForMeeting implementation
start_marker = '/**\n * Mengembalikan tahapan pedagogis progresif yang kaya dan terstruktur untuk setiap pertemuan.'
end_marker = '  return {\n    stageName,\n    stageFocus,\n    pendahuluan,\n    kegiatanInti,\n    penutup,\n  };\n}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

end_idx += len(end_marker)

new_code = '''export interface PedagogicalOptionsParam {
  mediaList?: string[];
  perangkatList?: string[];
  platformList?: string[];
  metodeList?: string[];
  pendekatan?: string;
}

/**
 * Mengembalikan sintaks resmi dan deskripsi kegiatan operasional guru dan murid
 * yang persis relevan dengan model pembelajaran yang dipilih serta pemanfaatan media inputan guru.
 */
export function getModelSyntaxStages(
  model: string = 'Problem Based Learning (PBL)',
  stageType: 'terpadu' | 'fondasi' | 'penyelidikan' | 'aplikasi' | 'puncak',
  meetingNum: number,
  totalMeetings: number,
  safeTopic: string,
  options?: PedagogicalOptionsParam
): {
  faseSintaks: string;
  alokasiMenit: string;
  aktivitasGuru: string;
  aktivitasSiswa: string;
  pengalamanBelajar: string;
  prinsipPembelajaran: string;
}[] {
  const modelLower = (model || '').toLowerCase();
  const mediaList = options?.mediaList && options.mediaList.length > 0
    ? options.mediaList
    : ['Video Pembelajaran Kontekstual', 'Slide Presentasi Bergambar', 'Lembar Kerja Interaktif'];
  const perangkatList = options?.perangkatList && options.perangkatList.length > 0
    ? options.perangkatList
    : ['Laptop Guru', 'LCD Proyektor'];
  const platformList = options?.platformList && options.platformList.length > 0
    ? options.platformList
    : ['YouTube Edukasi', 'Canva for Education'];

  const primaryMedia = mediaList[0] || 'media ajar kontekstual';
  const secondaryMedia = mediaList[1] || mediaList[0] || 'Lembar Kerja Peserta Didik (LKPD)';
  const deviceStr = perangkatList.join(' dan ') || 'LCD Proyektor dan Laptop';
  const platformStr = platformList.join(', ') || 'media digital';

  // 1. PROJECT BASED LEARNING (PjBL)
  if (modelLower.includes('project') || modelLower.includes('pjbl')) {
    const cleanModelName = 'PjBL';
    if (stageType === 'fondasi') {
      return [
        {
          faseSintaks: `Sintak 1 (${cleanModelName}): Penentuan Pertanyaan Mendasar (Essential Question)`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru menayangkan ${primaryMedia} terkait karya proyek ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}) dan mengajukan pertanyaan pemantik mendasar yang menantang kreativitas murid.`,
          aktivitasSiswa: `Murid menyimak tayangan ${primaryMedia} dengan konsentrasi (Mindful), merespons pertanyaan guru, dan mengidentifikasi tujuan serta manfaat karya proyek yang akan dirancang.`,
          pengalamanBelajar: 'Bermakna (Meaningful): Mengaitkan ide kreasi proyek dengan kegunaan nyata di lingkungan sekitar.',
          prinsipPembelajaran: 'Memahami: Menangkap esensi tantangan dan arah pembuatan proyek.',
        },
        {
          faseSintaks: `Sintak 2 (${cleanModelName}): Mendesain Perencanaan Proyek (Design a Plan for the Project)`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru membagikan LKPD panduan proyek, membimbing pembentukan tim kerja kolaboratif, serta mendampingi pemilihan alat, bahan, dan sketsa desain proyek.`,
          aktivitasSiswa: `Murid dalam kelompok berdiskusi merancang sketsa desain karya, menentukan alat dan bahan (termasuk memanfaatkan ${secondaryMedia}), serta menyepakati pembagian tugas kerja tim secara adil.`,
          pengalamanBelajar: 'Menggembirakan (Joyful): Mengekspresikan ide kreatif bersama rekan tim dalam suasana kolaboratif yang inklusif.',
          prinsipPembelajaran: 'Merencanakan desain produk karya secara terstruktur dan inovatif.',
        },
        {
          faseSintaks: `Sintak 3 (${cleanModelName}): Menyusun Jadwal Pembuatan Proyek (Create a Schedule)`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru memfasilitasi murid menetapkan tenggat waktu (timeline) pengerjaan tahapan proyek agar terukur dan selesai tepat waktu.`,
          aktivitasSiswa: `Kelompok menyusun jadwal kerja rinci pada LKPD (persiapan bahan, langkah perakitan, uji coba awal, hingga penyelesaian) secara bertanggung jawab.`,
          pengalamanBelajar: 'Berkesadaran (Mindful): Melatih manajemen waktu, kedisiplinan, dan komitmen tim.',
          prinsipPembelajaran: 'Mengaplikasikan perencanaan alur kerja dan tenggat waktu nyata.',
        },
        {
          faseSintaks: `Sintak 4 (${cleanModelName}): Eksplorasi Awal Bahan & Bimbingan Konsep Proyek`,
          alokasiMenit: '15 Menit',
          aktivitasGuru: `Guru mendampingi kelompok mengeksplorasi bahan proyek dan memastikan pemahaman konsep dasar ${safeTopic} telah dikuasai dengan baik.`,
          aktivitasSiswa: `Murid memilah bahan kerja, melakukan uji coba konsep sederhana, dan mencatat kesiapan bahan pada tabel LKPD.`,
          pengalamanBelajar: 'Berkesadaran (Mindful): Mengamati secara saksama kesesuaian bahan dengan rancangan proyek.',
          prinsipPembelajaran: 'Mengaplikasikan konsep dasar ke dalam penyiapan bahan proyek.',
        },
        {
          faseSintaks: `Sintak 5 (${cleanModelName}): Konsolidasi Rencana Kerja & Kesepakatan Proyek`,
          alokasiMenit: '5 Menit',
          aktivitasGuru: `Guru memeriksa kesiapan draf desain proyek setiap kelompok dan memberikan umpan balik penguatan sebelum masuk tahap pembuatan intensif.`,
          aktivitasSiswa: `Murid menyelaraskan masukan guru pada lembar desain proyek dan menyatakan kesiapan memulai pembuatan karya.`,
          pengalamanBelajar: 'Bermakna & Reflektif: Memastikan fondasi rencana proyek telah matang dan realistis.',
          prinsipPembelajaran: 'Merefleksikan kesiapan desain dan strategi pembuatan proyek.',
        },
      ];
    }

    if (stageType === 'penyelidikan') {
      return [
        {
          faseSintaks: `Sintak 1 (${cleanModelName}): Reviu Progres Desain & Pengkondisian Tim Kerja`,
          alokasiMenit: '5 Menit',
          aktivitasGuru: `Guru menampilkan kembali panduan proyek pada ${deviceStr} dan memeriksa kesiapan alat bahan setiap tim.`,
          aktivitasSiswa: `Murid menyiapkan bahan proyek di meja kerja kelompok dan mengecek pembagian tugas masing-masing anggota.`,
          pengalamanBelajar: 'Berkesadaran (Mindful): Memusatkan perhatian dan kesiapan fisik untuk bekerja berkarya.',
          prinsipPembelajaran: 'Merencanakan kesiapan kerja tim secara terorganisir.',
        },
        {
          faseSintaks: `Sintak 2 (${cleanModelName}): Pembuatan Produk Proyek Bertahap (Executing the Project)`,
          alokasiMenit: '15 Menit',
          aktivitasGuru: `Guru berkeliling memfasilitasi pembuatan karya, mengamati kerja sama tim, dan membimbing keselamatan kerja serta ketelitian teknik.`,
          aktivitasSiswa: `Murid secara gotong royong merakit, menyusun, dan membuat produk proyek ${safeTopic} sesuai langkah-langkah pada panduan LKPD.`,
          pengalamanBelajar: 'Menggembirakan (Joyful): Belajar melalui praktik fisik aktif, kolaborasi tangan terampil, dan saling membantu.',
          prinsipPembelajaran: 'Mengaplikasikan konsep materi dan keterampilan kinestetik dalam mewujudkan produk nyata.',
        },
        {
          faseSintaks: `Sintak 3 (${cleanModelName}): Memonitor Keaktifan dan Perkembangan Proyek (Monitoring Progress)`,
          alokasiMenit: '15 Menit',
          aktivitasGuru: `Guru memonitor keaktifan setiap murid menggunakan lembar observasi dan memberikan scaffolding bagi tim yang menemui kendala teknis.`,
          aktivitasSiswa: `Murid berkonsultasi mengenai kendala pembuatan produk, melakukan perbaikan desain secara mandiri, dan mencatat progres pada LKPD.`,
          pengalamanBelajar: 'Berkesadaran (Mindful): Belajar mengatasi hambatan teknis dengan ketekunan, kesabaran, dan nalar kritis.',
          prinsipPembelajaran: 'Mengaplikasikan strategi pemecahan masalah konkret saat berkarya.',
        },
        {
          faseSintaks: `Sintak 4 (${cleanModelName}): Uji Coba Fungsi Awal Produk Proyek`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru membimbing kelompok menguji coba apakah karya proyek yang dibuat telah berfungsi dan memenuhi tujuan awal materi ${safeTopic}.`,
          aktivitasSiswa: `Murid melakukan uji coba fungsi karya, mencatat hasil uji coba pada tabel LKPD, dan mengidentifikasi bagian yang perlu disempurnakan.`,
          pengalamanBelajar: 'Bermakna (Meaningful): Mengalami pembuktian empiris terhadap keberhasilan produk yang diciptakan.',
          prinsipPembelajaran: 'Menguji dan memverifikasi kualitas karya secara objektif.',
        },
        {
          faseSintaks: `Sintak 5 (${cleanModelName}): Refleksi Progres Harian & Rencana Finishing`,
          alokasiMenit: '5 Menit',
          aktivitasGuru: `Guru mengapresiasi ketekunan setiap kelompok dan memberikan arahan persiapan penyempurnaan akhir produk.`,
          aktivitasSiswa: `Murid merapikan area kerja, mencatat hal yang perlu disempurnakan di pertemuan berikutnya, dan mengamankan produk proyek.`,
          pengalamanBelajar: 'Bermakna & Reflektif: Menilai efektivitas waktu kerja dan pencapaian progres tim.',
          prinsipPembelajaran: 'Merefleksikan mutu sementara karya proyek.',
        },
      ];
    }

    if (stageType === 'puncak') {
      return [
        {
          faseSintaks: `Sintak 1 (${cleanModelName}): Penataan Gelar Karya Proyek (Gallery Walk Setup)`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru memandu kelompok menata stan pameran karya proyek di ruang kelas dan membagikan rubrik penilaian serta stiker apresiasi.`,
          aktivitasSiswa: `Murid menata produk karya proyek tim di meja stan, memasang poster penjelasan/LKPD, dan membagi peran penjaga stan serta pengunjung keliling.`,
          pengalamanBelajar: 'Menggembirakan (Joyful): Suasana kelas berubah menjadi pameran karya semarak yang membanggakan.',
          prinsipPembelajaran: 'Merencanakan unjuk karya di hadapan publik sekolah.',
        },
        {
          faseSintaks: `Sintak 2 (${cleanModelName}): Menguji Hasil Karya & Presentasi Pameran Proyek (Assess the Outcome)`,
          alokasiMenit: '15 Menit',
          aktivitasGuru: `Guru berkeliling menilai unjuk kerja murid, mengamati interaksi dialogis, dan memfasilitasi tanya jawab bermutu antarkelompok.`,
          aktivitasSiswa: `Murid bergantian mempresentasikan fungsi dan cara kerja produk proyeknya kepada pengunjung stan, menjawab pertanyaan, dan menerima stiker apresiasi.`,
          pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami proses saling menghargai keberagaman karya dan berpikir kritis.',
          prinsipPembelajaran: 'Mengomunikasikan konsep materi ${safeTopic} secara fasih dan runtut.',
        },
        {
          faseSintaks: `Sintak 3 (${cleanModelName}): Evaluasi Pengalaman Belajar & Asesmen Tuntas Capaian TP (Evaluate Experience)`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru membagikan lembar asesmen evaluasi capaian TP untuk mengukur penguasaan konsep komprehensif setiap murid.`,
          aktivitasSiswa: `Murid mengerjakan evaluasi capaian TP secara mandiri, jujur, tenang, dan berintegritas tinggi.`,
          pengalamanBelajar: 'Berkesadaran: Mengukur ketercapaian kompetensi pribadi secara jujur dan bertanggung jawab.',
          prinsipPembelajaran: 'Menunjukkan bukti ketuntasan Tujuan Pembelajaran ${safeTopic}.',
        },
        {
          faseSintaks: `Sintak 4 (${cleanModelName}): Refleksi Kolaboratif & Penghargaan Prestasi Karya`,
          alokasiMenit: '10 Menit',
          aktivitasGuru: `Guru bersama murid mengulas inspirasi karya terbaik dan merayakan keberhasilan penyelesaian proyek bersama.`,
          aktivitasSiswa: `Murid mengungkapkan rasa bangga atas produk kelompoknya, menyampaikan pelajaran hidup paling berharga, dan saling memberi tepuk apresiasi.`,
          pengalamanBelajar: 'Menggembirakan & Apresiatif: Menumbuhkan kebanggaan atas usaha bersama dan penghargaan tim.',
          prinsipPembelajaran: 'Merefleksikan seluruh proses pembuatan proyek dari awal hingga akhir.',
        },
        {
          faseSintaks: `Sintak 5 (${cleanModelName}): Penegasan Makna Pembelajaran & Nilai Profil Pelajar Pancasila`,
          alokasiMenit: '5 Menit',
          aktivitasGuru: `Guru menegaskan keterkaitan nilai gotong royong, nalar kritis, dan kemandirian yang tercermin selama merancang proyek.`,
          aktivitasSiswa: `Murid menyimak dengan khidmat dan berkomitmen menerapkan sikap kreatif dan peduli lingkungan di kehidupan sehari-hari.`,
          pengalamanBelajar: 'Bermakna: Menghubungkan capaian proyek dengan pembentukan karakter pribadi anak.',
          prinsipPembelajaran: 'Menginternalisasi nilai-nilai proyek menjadi bagian dari karakter diri.',
        },
      ];
    }

    // Default / Terpadu PjBL
    return [
      {
        faseSintaks: `Sintak 1 (${cleanModelName}): Penentuan Pertanyaan Mendasar (Essential Question)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru menayangkan ${primaryMedia} seputar persoalan nyata ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}) dan mengajukan pertanyaan pemantik yang menantang pembuatan proyek.`,
        aktivitasSiswa: `Murid menyimak tayangan ${primaryMedia}, merespons pertanyaan guru, dan mengidentifikasi tujuan pembuatan karya proyek secara antusias.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Menghubungkan kreasi proyek dengan manfaat nyata di kehidupan sehari-hari.',
        prinsipPembelajaran: 'Memahami tantangan materi dan arah tujuan proyek.',
      },
      {
        faseSintaks: `Sintak 2 (${cleanModelName}): Mendesain Perencanaan Proyek & Jadwal Pembuatan (Plan & Schedule)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru membagikan LKPD panduan proyek, membimbing pembentukan tim, serta memandu pembagian tugas dan penentuan jadwal kerja.`,
        aktivitasSiswa: `Murid berdiskusi menyusun sketsa karya proyek, memilih bahan kerja (termasuk ${secondaryMedia}), dan menetapkan tahapan kerja tim.`,
        pengalamanBelajar: 'Menggembirakan (Joyful): Belajar melalui interaksi sosial kolaboratif dan perancangan kreatif.',
        prinsipPembelajaran: 'Merencanakan alur kerja dan desain produk inovatif.',
      },
      {
        faseSintaks: `Sintak 3 (${cleanModelName}): Memonitor Keaktifan dan Perkembangan Proyek (Monitor Progress)`,
        alokasiMenit: '15 Menit',
        aktivitasGuru: `Guru berkeliling memfasilitasi pembuatan karya, memberikan scaffolding bagi kelompok yang membutuhkan, dan mengamati ketelitian murid.`,
        aktivitasSiswa: `Murid bersama kelompoknya membuat karya proyek dengan tekun, melakukan uji coba bertahap, dan mencatat progres pada LKPD.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami proses berkarya yang memerlukan fokus, ketelitian, dan gotong royong.',
        prinsipPembelajaran: 'Mengaplikasikan konsep materi dalam wujud karya konkret.',
      },
      {
        faseSintaks: `Sintak 4 (${cleanModelName}): Menguji Hasil Karya Proyek (Assess the Outcome)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru memandu pengujian kelayakan hasil proyek dan memfasilitasi pameran karya antarkelompok (Gallery Walk).`,
        aktivitasSiswa: `Setiap kelompok memamerkan dan mendemonstrasikan hasil karya proyeknya, saling memberikan umpan balik apresiatif, dan menjawab pertanyaan teman.`,
        pengalamanBelajar: 'Menggembirakan & Apresiatif: Mengembangkan rasa bangga atas karya tim dan menghargai karya rekan lain.',
        prinsipPembelajaran: 'Mengomunikasikan keberfungsian produk dan konsep yang mendasarinya.',
      },
      {
        faseSintaks: `Sintak 5 (${cleanModelName}): Evaluasi Pengalaman Belajar (Evaluate the Experience)`,
        alokasiMenit: '5 Menit',
        aktivitasGuru: `Guru meluruskan miskonsepsi, memandu refleksi menyeluruh atas proses proyek, dan merangkum intisari materi ${safeTopic}.`,
        aktivitasSiswa: `Murid menyimpulkan konsep kunci, mengungkapkan pelajaran bermakna dari pembuatan proyek, dan mencatat perbaikan pada buku catatan.`,
        pengalamanBelajar: 'Bermakna & Reflektif: Mengukuhkan pemahaman konsep dan mengevaluasi pengalaman belajar.',
        prinsipPembelajaran: 'Merefleksikan proses pembuatan karya dan hasil belajar.',
      },
    ];
  }

  // 2. DISCOVERY LEARNING
  if (modelLower.includes('discovery')) {
    const cleanModelName = 'Discovery Learning';
    return [
      {
        faseSintaks: `Sintak 1 (${cleanModelName}): Pemberian Rangsangan (Stimulation)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru menampilkan stimulus berupa ${primaryMedia} seputar ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}) untuk memusatkan perhatian dan membangkitkan rasa ingin tahu murid.`,
        aktivitasSiswa: `Murid mengamati objek stimulus dengan saksama (Mindful), mencatat fakta menarik atau kejanggalan yang terlihat, dan menjawab pertanyaan pemantik awal guru.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Mengaktifkan rasa ingin tahu anak terhadap fenomena konsep materi baru.',
        prinsipPembelajaran: 'Memahami: Menangkap fenomena awal materi secara konkret.',
      },
      {
        faseSintaks: `Sintak 2 (${cleanModelName}): Pernyataan / Identifikasi Masalah (Problem Statement)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru membimbing murid merumuskan pertanyaan penyelidikan dan menentukan hipotesis (dugaan sementara) yang akan dibuktikan.`,
        aktivitasSiswa: `Murid dalam kelompok merumuskan masalah pada LKPD dan menuliskan hipotesis jawaban sementara berlandaskan pengamatan awal.`,
        pengalamanBelajar: 'Menggembirakan (Joyful): Menantang keberanian anak mengutarakan dugaan ilmiah bersama rekan kelompok.',
        prinsipPembelajaran: 'Merumuskan masalah dan hipotesis secara terarah.',
      },
      {
        faseSintaks: `Sintak 3 (${cleanModelName}): Pengumpulan Data (Data Collection)`,
        alokasiMenit: '15 Menit',
        aktivitasGuru: `Guru memfasilitasi kelompok mengumpulkan informasi dengan membagikan LKPD, ${secondaryMedia}, dan benda konkret manipulatif.`,
        aktivitasSiswa: `Murid melakukan observasi langsung, memanipulasi benda konkret, mencari informasi pendukung, dan mencatat data temuan pada tabel LKPD.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami proses pengamatan teliti, ketekunan, dan kejujuran ilmiah dalam mencatat data.',
        prinsipPembelajaran: 'Mengaplikasikan teknik pencatatan data dan observasi faktual.',
      },
      {
        faseSintaks: `Sintak 4 (${cleanModelName}): Pengolahan Data (Data Processing)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru mendampingi kelompok menafsirkan data, mengklasifikasi kategori temuan, dan memfasilitasi diskusi kritis antaranggot kelompok.`,
        aktivitasSiswa: `Murid mendiskusikan data temuan bersama tim, menghubungkan pola antardata, dan menjawab pertanyaan analisis pada LKPD.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Mengasah penalaran logis dan keterampilan berpikir analitis mendalam.',
        prinsipPembelajaran: 'Mengaplikasikan analisis logis untuk mengolah data mentah menjadi informasi bermakna.',
      },
      {
        faseSintaks: `Sintak 5 (${cleanModelName}): Pembuktian & Penarikan Simpulan (Verification & Generalization)`,
        alokasiMenit: '5 Menit',
        aktivitasGuru: `Guru memandu murid membandingkan hasil olah data dengan literatur konsep pada rangkuman materi, meluruskan miskonsepsi, dan merumuskan simpulan umum bersama murid.`,
        aktivitasSiswa: `Murid mencocokkan pembuktian hipotesis, mempresentasikan temuan di depan kelas, menyelaraskan catatan konsep ${safeTopic}, dan merefleksikan proses belajar.`,
        pengalamanBelajar: 'Bermakna & Reflektif: Menemukan sendiri kebenaran ilmiah dan mengukuhkan pemahaman konsep yang kokoh.',
        prinsipPembelajaran: 'Membuktikan keabsahan hipotesis dan merefleksikan simpulan akhir secara komprehensif.',
      },
    ];
  }

  // 3. INKUIRI TERBIMBING (GUIDED INQUIRY)
  if (modelLower.includes('inkuiri') || modelLower.includes('inquiry')) {
    const cleanModelName = 'Inkuiri Terbimbing';
    return [
      {
        faseSintaks: `Sintak 1 (${cleanModelName}): Orientasi Masalah & Eksplorasi Fenomena`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru menyajikan fenomena alam/konsep nyata seputar ${safeTopic} menggunakan ${primaryMedia} dan ${deviceStr}, lalu memandu murid memfokuskan perhatian.`,
        aktivitasSiswa: `Murid menyimak stimulus dengan cermat (Mindful), mengidentifikasi keunikan fenomena, dan mengutarakan pertanyaan rasa ingin tahu.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Mengaitkan rasa ingin tahu dengan fenomena konkret yang dihadirkan.',
        prinsipPembelajaran: 'Memahami fenomena dasar secara kontekstual.',
      },
      {
        faseSintaks: `Sintak 2 (${cleanModelName}): Merumuskan Masalah & Hipotesis Penyelidikan`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru memandu murid membatasi ruang lingkup penyelidikan menjadi pertanyaan terarah dan membimbing perumusan dugaan sementara (hipotesis).`,
        aktivitasSiswa: `Murid berdiskusi dalam kelompok merumuskan pertanyaan penyelidikan pada LKPD dan menuliskan hipotesis jawaban beserta alasannya.`,
        pengalamanBelajar: 'Menggembirakan (Joyful): Terlibat aktif dalam merancang arah penyelidikan ilmiah bersama teman.',
        prinsipPembelajaran: 'Merencanakan hipotesis dan fokus investigasi.',
      },
      {
        faseSintaks: `Sintak 3 (${cleanModelName}): Mengumpulkan Data Melalui Eksperimen / Observasi Terbimbing`,
        alokasiMenit: '15 Menit',
        aktivitasGuru: `Guru menyediakan alat bahan konkret dan membagikan panduan LKPD eksperimen serta mengawasi keselamatan dan ketepatan penyelidikan.`,
        aktivitasSiswa: `Murid melakukan langkah eksperimen langsung, memanipulasi ${secondaryMedia} dan benda konkret, serta mencatat data hasil pengamatan pada tabel LKPD.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Menghayati ketelitian observasi, kejujuran data, dan pembuktian langsung.',
        prinsipPembelajaran: 'Mengaplikasikan metode inkuiri dan pengumpulan data secara sistematis.',
      },
      {
        faseSintaks: `Sintak 4 (${cleanModelName}): Menguji Hipotesis & Analisis Temuan`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru memandu murid menganalisis apakah data hasil pengamatan membuktikan atau menolak dugaan sementara mereka.`,
        aktivitasSiswa: `Murid membandingkan dugaan awal dengan data riil hasil observasi, mendiskusikan alasan ilmiahnya bersama tim, dan menyusun argumen pembuktian.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Menyadari pentingnya bukti nyata dalam menetapkan kebenaran ilmiah.',
        prinsipPembelajaran: 'Mengaplikasikan penalaran kritis untuk menguji validitas hipotesis.',
      },
      {
        faseSintaks: `Sintak 5 (${cleanModelName}): Merumuskan Kesimpulan & Refleksi Inkuiri`,
        alokasiMenit: '5 Menit',
        aktivitasGuru: `Guru memfasilitasi presentasi temuan antarkelompok, mengonfirmasi simpulan bersama, serta meluruskan miskonsepsi materi ${safeTopic}.`,
        aktivitasSiswa: `Murid menyimpulkan konsep utama, membagikan temuan kepada teman sekelas dengan percaya diri, dan merefleksikan proses inkuiri yang telah dilalui.`,
        pengalamanBelajar: 'Menggembirakan & Reflektif: Merasakan kepuasan menjadi peneliti cilik dan saling mengapresiasi.',
        prinsipPembelajaran: 'Merefleksikan seluruh proses penyelidikan inkuiri.',
      },
    ];
  }

  // 4. BERMAIN PERAN & SIMULASI (ROLE PLAY)
  if (modelLower.includes('peran') || modelLower.includes('role') || modelLower.includes('simulasi')) {
    const cleanModelName = 'Role Play & Simulasi';
    return [
      {
        faseSintaks: `Sintak 1 (${cleanModelName}): Sosialisasi Skenario dan Situasi Nyata`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru menyajikan skenario kontekstual terkait materi ${safeTopic} menggunakan ${primaryMedia} pada ${deviceStr} dan menjelaskan latar belakang peran.`,
        aktivitasSiswa: `Murid menyimak skenario secara saksama, memahami masalah yang perlu diperankan, dan menunjukkan empati terhadap situasi.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Mengembangkan empati dan keterlibatan emosional positif.',
        prinsipPembelajaran: 'Memahami konteks permasalahan sosial/konseptual.',
      },
      {
        faseSintaks: `Sintak 2 (${cleanModelName}): Pembagian Peran dan Penghayatan Karakter`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru membagi kelompok peran, membagikan lembar panduan peran / LKPD, dan mengarahkan siswa yang menjadi pengamat (observer).`,
        aktivitasSiswa: `Murid menyepakati peran masing-masing, membaca panduan dialog/tindakan (didukung ${secondaryMedia}), dan berlatih singkat bersama anggota kelompok.`,
        pengalamanBelajar: 'Menggembirakan (Joyful): Belajar melalui ekspresi peran, interaksi spontan, dan kerja tim.',
        prinsipPembelajaran: 'Merencanakan tindakan berdasarkan peran yang diemban.',
      },
      {
        faseSintaks: `Sintak 3 (${cleanModelName}): Pelaksanaan Simulasi / Bermain Peran`,
        alokasiMenit: '15 Menit',
        aktivitasGuru: `Guru memfasilitasi jalannya simulasi bermain peran di depan kelas dan mendampingi siswa pengamat mencatat hal-hal penting.`,
        aktivitasSiswa: `Kelompok pemeran memperagakan situasi pemecahan masalah dengan penuh penghayatan, sementara murid pengamat mencatat perilaku dan keputusan penting pada lembar observasi.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami dinamika interaksi nyata dan pengambilan keputusan langsung.',
        prinsipPembelajaran: 'Mengaplikasikan konsep dan nilai moral dalam tindakan simulasi.',
      },
      {
        faseSintaks: `Sintak 4 (${cleanModelName}): Diskusi dan Analisis Pasca Peran (Debriefing)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru memandu dialog reflektif antara pemeran dan pengamat mengenai alasan pengambilan keputusan dalam peran.`,
        aktivitasSiswa: `Murid mengemukakan perasaan saat memerankan karakter, mendiskusikan tanggapan pengamat, dan menganalisis solusi terbaik.`,
        pengalamanBelajar: 'Bermakna & Reflektif: Menghubungkan pengalaman simulasi dengan nilai kebajikan kehidupan nyata.',
        prinsipPembelajaran: 'Mengomunikasikan dan menganalisis konsekuensi dari setiap tindakan.',
      },
      {
        faseSintaks: `Sintak 5 (${cleanModelName}): Penarikan Simpulan dan Refleksi Nilai`,
        alokasiMenit: '5 Menit',
        aktivitasGuru: `Guru menegaskan intisari konsep materi ${safeTopic} dan nilai karakter Profil Pelajar Pancasila yang dipelajari.`,
        aktivitasSiswa: `Murid merumuskan simpulan bersama guru dan menuliskan komitmen penerapan sikap positif dalam kehidupan sehari-hari.`,
        pengalamanBelajar: 'Menggembirakan & Apresiatif: Merasa dihargai atas keberanian berekspresi dan memiliki wawasan baru.',
        prinsipPembelajaran: 'Merefleksikan nilai-nilai pembelajaran menjadi bagian dari karakter.',
      },
    ];
  }

  // 5. DIFERENSIASI KONTEN & PROSES
  if (modelLower.includes('diferensiasi')) {
    const cleanModelName = 'Pembelajaran Berdiferensiasi';
    return [
      {
        faseSintaks: `Sintak 1 (${cleanModelName}): Pemetaan Kesiapan Belajar & Orientasi Topik`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru menyajikan apersepsi visual menggunakan ${primaryMedia} dan memetakan tingkat kesiapan murid melalui pertanyaan diagnostik singkat.`,
        aktivitasSiswa: `Murid merespons pertanyaan pemantik guru secara antusias dan mengenali fokus belajarnya hari ini.`,
        pengalamanBelajar: 'Bermakna (Meaningful): Merasa diakui kesiapan dan gaya belajarnya secara adil.',
        prinsipPembelajaran: 'Memahami konsep dasar sesuai kesiapan masing-masing.',
      },
      {
        faseSintaks: `Sintak 2 (${cleanModelName}): Pengorganisasian Belajar Berdasarkan Profil Belajar & Minat`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru mengelompokkan murid berdasarkan profil kesiapan/gaya belajar (visual, auditori, kinestetik) dan menyediakan materi bertingkat.`,
        aktivitasSiswa: `Murid bergabung dengan kelompok belajarnya, memilih media pendukung yang sesuai, dan menyepakati target kerja tim pada LKPD diferensiasi.`,
        pengalamanBelajar: 'Menggembirakan (Joyful): Belajar dengan cara yang paling nyaman dan menyenangkan sesuai keunikan diri.',
        prinsipPembelajaran: 'Merencanakan eksplorasi belajar yang sesuai potensi.',
      },
      {
        faseSintaks: `Sintak 3 (${cleanModelName}): Bimbingan Bertingkat (Tiered Scaffolding) & Eksplorasi Konten`,
        alokasiMenit: '15 Menit',
        aktivitasGuru: `Guru memberikan bimbingan intensif bagi kelompok yang memerlukan bantuan dasar, serta memberikan tantangan pengayaan bagi kelompok yang sudah mahir.`,
        aktivitasSiswa: `Murid melakukan eksplorasi materi secara mandiri dan berkelompok menggunakan ${secondaryMedia}, LKPD bertingkat, dan benda konkret manipulatif.`,
        pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami proses belajar yang menantang namun dapat dicapai.',
        prinsipPembelajaran: 'Mengaplikasikan pemahaman konsep melalui berbagai tingkatan penugasan.',
      },
      {
        faseSintaks: `Sintak 4 (${cleanModelName}): Berbagi Hasil Eksplorasi Beragam (Gallery Walk / Sharing)`,
        alokasiMenit: '10 Menit',
        aktivitasGuru: `Guru memfasilitasi presentasi silang antarkelompok agar murid saling melihat keberagaman cara belajar dan karya rekan lain.`,
        aktivitasSiswa: `Setiap kelompok membagikan hasil belajarnya, saling memberikan umpan balik apresiatif, dan memperkaya wawasan dari kelompok lain.`,
        pengalamanBelajar: 'Menggembirakan & Apresiatif: Mengembangkan rasa bangga atas capaian sendiri dan mengapresiasi keunikan teman.',
        prinsipPembelajaran: 'Mengomunikasikan pemahaman secara percaya diri.',
      },
      {
        faseSintaks: `Sintak 5 (${cleanModelName}): Evaluasi Ketercapaian Kompetensi & Refleksi Bersama`,
        alokasiMenit: '5 Menit',
        aktivitasGuru: `Guru mengonfirmasi konsep kunci materi ${safeTopic}, memandu asesmen formatif mandiri, dan mengapresiasi kemajuan setiap murid.`,
        aktivitasSiswa: `Murid mengerjakan evaluasi mandiri secara jujur dan merefleksikan kemajuan belajar yang telah dicapai hari ini.`,
        pengalamanBelajar: 'Bermakna & Reflektif: Menyadari perkembangan kompetensi diri secara positif.',
        prinsipPembelajaran: 'Merefleksikan capaian belajar dan menentukan langkah perbaikan.',
      },
    ];
  }

  // 6. DEFAULT / PROBLEM BASED LEARNING (PBL)
  const cleanModelName = 'PBL';
  return [
    {
      faseSintaks: `Sintak 1 (${cleanModelName}): Orientasi Siswa pada Masalah Kontekstual`,
      alokasiMenit: '10 Menit',
      aktivitasGuru: `Guru menayangkan ${primaryMedia} terkait persoalan nyata tentang materi ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}) dan melontarkan pertanyaan pemantik yang menggugah nalar kritis murid.`,
      aktivitasSiswa: `Murid mengamati tayangan ${primaryMedia} secara fokus (Mindful), mengidentifikasi masalah nyata yang disajikan, dan merespons pertanyaan pemantik guru secara aktif.`,
      pengalamanBelajar: 'Bermakna (Meaningful): Mengaitkan materi ${safeTopic} dengan konteks nyata kehidupan sehari-hari anak.',
      prinsipPembelajaran: 'Memahami: Mengenal dan mengidentifikasi esensi persoalan kontekstual secara terstruktur.',
    },
    {
      faseSintaks: `Sintak 2 (${cleanModelName}): Mengorganisasikan Siswa untuk Belajar Kolaboratif`,
      alokasiMenit: '10 Menit',
      aktivitasGuru: `Guru membagi siswa ke dalam kelompok heterogen (4-5 murid), membagikan Lembar Kerja Peserta Didik (LKPD), dan memastikan setiap anggota kelompok memiliki peran tugas yang jelas (ketua, pencatat, penanya).`,
      aktivitasSiswa: `Murid berkumpul bersama kelompoknya, mencermati instruksi LKPD, menyepakati pembagian tugas kerja tim, dan menyiapkan alat belajar secara gotong royong.`,
      pengalamanBelajar: 'Menggembirakan (Joyful): Belajar melalui interaksi sosial yang ramah, kompak, dan adil.',
      prinsipPembelajaran: 'Merencanakan langkah pemecahan masalah bersama kelompok.',
    },
    {
      faseSintaks: `Sintak 3 (${cleanModelName}): Membimbing Penyelidikan Mandiri dan Kelompok`,
      alokasiMenit: '15 Menit',
      aktivitasGuru: `Guru berkeliling mendampingi penyelidikan, memberikan bimbingan terarah (scaffolding) bagi kelompok yang membutuhkan, serta memfasilitasi penggunaan ${secondaryMedia} dan benda konkret manipulatif.`,
      aktivitasSiswa: `Murid melakukan investigasi secara aktif, memanipulasi benda konkret, mengolah data pada tabel LKPD, dan mendiskusikan alternatif solusi bersama teman sebaya.`,
      pengalamanBelajar: 'Berkesadaran (Mindful): Mengalami proses berpikir mendalam, ketelitian menganalisis, dan pembuktian berbasis data.',
      prinsipPembelajaran: 'Mengaplikasikan: Menerapkan konsep materi untuk menyelesaikan persoalan pada LKPD.',
    },
    {
      faseSintaks: `Sintak 4 (${cleanModelName}): Mengembangkan dan Menyajikan Hasil Karya`,
      alokasiMenit: '10 Menit',
      aktivitasGuru: `Guru memfasilitasi setiap kelompok merapikan hasil analisis LKPD dan memandu jalannya presentasi / pameran mini karya di depan kelas dengan suasana apresiatif.`,
      aktivitasSiswa: `Perwakilan kelompok mempresentasikan hasil pemecahan masalah di depan kelas dengan percaya diri, sementara kelompok lain menyimak santun dan memberikan apresiasi serta tanggapan positif.`,
      pengalamanBelajar: 'Menggembirakan & Apresiatif: Mengembangkan rasa percaya diri berbicara dan menghargai karya rekan sekelas.',
      prinsipPembelajaran: 'Mengomunikasikan: Menyajikan argumen logis dan gagasan solusi secara runtut.',
    },
    {
      faseSintaks: `Sintak 5 (${cleanModelName}): Menganalisis dan Mengevaluasi Proses Pemecahan Masalah`,
      alokasiMenit: '5 Menit',
      aktivitasGuru: `Guru bersama murid mengevaluasi seluruh proses pemecahan masalah, meluruskan miskonsepsi, memberikan penguatan konsep kunci ${safeTopic}, serta mengukur pemahaman melalui kuis formatif interaktif.`,
      aktivitasSiswa: `Murid merefleksikan proses belajar, menyimpulkan konsep esensial bersama guru, dan mencatat butir perbaikan pada buku catatan.`,
      pengalamanBelajar: 'Bermakna & Reflektif: Mengukuhkan pemahaman konsep yang bertahan lama dan meninjau proses metakognisi.',
      prinsipPembelajaran: 'Merefleksikan: Meninjau proses berpikir dan kebenaran simpulan akhir.',
    },
  ];
}

/**
 * Mengembalikan tahapan pedagogis progresif yang kaya dan terstruktur untuk setiap pertemuan.
 * Memastikan setiap pertemuan memiliki fokus unik, proses pembelajaran bertahap (scaffolding),
 * dan siklus utuh: Kegiatan Awal (Pendahuluan) -> Kegiatan Inti -> Kegiatan Akhir (Penutup),
 * serta persis mengikuti sintaks model pembelajaran dan media yang diinput guru.
 */
export function getPedagogicalStageForMeeting(
  meetingNum: number,
  totalMeetings: number,
  topic: string = 'Materi Pembelajaran',
  model: string = 'Problem Based Learning (PBL)',
  tpText?: string,
  options?: PedagogicalOptionsParam
): {
  stageName: string;
  stageFocus: string;
  pendahuluan: string[];
  kegiatanInti: {
    faseSintaks: string;
    alokasiMenit: string;
    aktivitasGuru: string;
    aktivitasSiswa: string;
    pengalamanBelajar: string;
    prinsipPembelajaran: string;
  }[];
  penutup: string[];
} {
  const m = Math.max(1, meetingNum);
  const total = Math.max(1, totalMeetings);
  const safeTopic = topic || 'Materi Pembelajaran';

  const mediaList = options?.mediaList && options.mediaList.length > 0
    ? options.mediaList
    : ['Video Pembelajaran Kontekstual', 'Slide Presentasi Bergambar', 'Lembar Kerja Interaktif'];
  const perangkatList = options?.perangkatList && options.perangkatList.length > 0
    ? options.perangkatList
    : ['Laptop Guru', 'LCD Proyektor'];
  const platformList = options?.platformList && options.platformList.length > 0
    ? options.platformList
    : ['YouTube Edukasi', 'Canva for Education'];

  const primaryMedia = mediaList[0] || 'media ajar kontekstual';
  const secondaryMedia = mediaList[1] || mediaList[0] || 'Lembar Kerja Peserta Didik (LKPD)';
  const deviceStr = perangkatList.join(' dan ') || 'LCD Proyektor dan Laptop';
  const platformStr = platformList.join(', ') || 'media digital';

  let stageType: 'terpadu' | 'fondasi' | 'penyelidikan' | 'aplikasi' | 'puncak' = 'terpadu';
  let stageName = '';
  let stageFocus = '';

  if (total === 1) {
    stageType = 'terpadu';
    stageName = `Tahap Terpadu: Pemahaman Konsep, Penyelidikan & Refleksi Holistik ${safeTopic}`;
    stageFocus = `Pemahaman konsep esensial, eksplorasi kontekstual berbantuan ${primaryMedia}, dan refleksi pemecahan masalah ${safeTopic}`;
  } else if (total === 2) {
    if (m === 1) {
      stageType = 'fondasi';
      stageName = `Tahap Fondasi: Orientasi Konsep Dasar & Eksplorasi Konkret ${safeTopic}`;
      stageFocus = `Pemahaman konsep esensial, orientasi masalah menggunakan ${primaryMedia}, dan pengenalan prinsip dasar ${safeTopic}`;
    } else {
      stageType = 'puncak';
      stageName = `Tahap Aplikasi & Evaluasi Tuntas: Penyelidikan Lanjutan, Pemecahan Masalah & Refleksi ${safeTopic}`;
      stageFocus = `Menerapkan konsep ${safeTopic} pada persoalan nyata, penyelidikan kelompok lanjutan dengan ${secondaryMedia}, dan evaluasi ketuntasan TP`;
    }
  } else if (total === 3) {
    if (m === 1) {
      stageType = 'fondasi';
      stageName = `Tahap Fondasi: Orientasi Konsep Dasar & Eksplorasi Konkret ${safeTopic}`;
      stageFocus = `Pemahaman konsep awal, orientasi masalah kontekstual menggunakan ${primaryMedia}, dan eksplorasi konkret ${safeTopic}`;
    } else if (m === 2) {
      stageType = 'penyelidikan';
      stageName = `Tahap Penyelidikan: Investigasi Terbimbing, Eksperimen & Analisis Data ${safeTopic}`;
      stageFocus = `Melakukan penyelidikan kelompok, pengumpulan bukti faktual menggunakan ${secondaryMedia}, dan pengujian konsep ilmiah ${safeTopic}`;
    } else {
      stageType = 'puncak';
      stageName = `Tahap Unjuk Pemahaman: Gelar Karya / Presentasi & Evaluasi Tuntas Capaian TP ${safeTopic}`;
      stageFocus = `Pameran karya, unjuk pemahaman mendalam, evaluasi tuntas ketercapaian Tujuan Pembelajaran, dan refleksi akhir ${safeTopic}`;
    }
  } else {
    // 4 atau lebih pertemuan
    if (m === 1) {
      stageType = 'fondasi';
      stageName = `Tahap Fondasi: Orientasi Fenomena Nyata, Eksplorasi Konkret & Pemahaman Konsep Dasar ${safeTopic}`;
      stageFocus = `Membangun pemahaman konsep dasar, mengamati fenomena kontekstual melalui ${primaryMedia}, dan menumbuhkan rasa ingin tahu ${safeTopic}`;
    } else if (m === 2) {
      stageType = 'penyelidikan';
      stageName = `Tahap Penyelidikan: Investigasi Terbimbing, Eksperimen & Analisis Data ${safeTopic}`;
      stageFocus = `Melakukan penyelidikan kelompok, pengumpulan bukti data menggunakan ${secondaryMedia}, dan verifikasi ilmiah ${safeTopic}`;
    } else if (m < total) {
      stageType = 'aplikasi';
      stageName = `Tahap Aplikasi & Kreasi (Pertemuan ${m}): Pemecahan Masalah Kontekstual & Solusi Kreatif ${safeTopic}`;
      stageFocus = `Menerapkan konsep yang telah terbukti untuk menyelesaikan tantangan nyata dan merancang produk karya ${safeTopic}`;
    } else {
      stageType = 'puncak';
      stageName = `Tahap Unjuk Pemahaman: Gelar Karya / Presentasi, Evaluasi Tuntas Capaian TP & Refleksi Holistik ${safeTopic}`;
      stageFocus = `Pameran karya (Gallery Walk), unjuk pemahaman mendalam, evaluasi tuntas ketercapaian Tujuan Pembelajaran, dan refleksi akhir ${safeTopic}`;
    }
  }

  // Kegiatan Awal: Relevan, terstruktur, dan secara eksplisit memanfaatkan media yang diinput guru
  let pendahuluan: string[] = [];
  if (m === 1) {
    pendahuluan = [
      `1. Guru menyapa murid dengan salam hangat, memimpin doa bersama, dan mengecek kehadiran murid dengan penuh perhatian dan empati (Beriman & Bertakwa).`,
      `2. Guru memandu Ice Breaking konsentrasi (Tepuk Fokus / Olah Gerak Ceria) untuk membangkitkan suasana kelas yang menyenangkan dan antusias (Joyful Learning).`,
      `3. Apersepsi Bermakna dengan Media Pilihan: Guru menayangkan ${primaryMedia} seputar materi ${safeTopic} menggunakan ${deviceStr} (melalui ${platformStr}). Murid menyimak tayangan dengan saksama (Mindful Learning), mengaitkannya dengan fenomena di lingkungan sekitar, dan merespons pertanyaan pemantik guru secara aktif (Meaningful Learning).`,
      `4. Guru menyampaikan tujuan pembelajaran pertemuan ini, alur kegiatan belajar mendalam berbasis model ${model}, serta kesepakatan belajar kelas yang disepakati bersama.`,
    ];
  } else {
    pendahuluan = [
      `1. Guru memberi salam hangat dan ceria, memimpin doa bersama, dan mengecek kehadiran serta kesiapan belajar murid (Beriman & Bertakwa).`,
      `2. Guru memandu Ice Breaking penyemangat (Tebak Konsep Ceria / Gerak Konsentrasi) untuk menyegarkan fokus anak (Joyful Learning).`,
      `3. Apersepsi Review & Bridging dengan Media: Guru mengulas kembali konsep kunci Pertemuan ${m - 1} dan menampilkan stimulus pendukung menggunakan ${primaryMedia} pada ${deviceStr} untuk menjembatani pemahaman awal dengan tantangan kegiatan hari ini. Murid mengamati tayangan media, mengingat kembali konsep dasar, dan merespons pertanyaan penghubung guru.`,
      `4. Guru menyampaikan fokus capaian pertemuan ke-${m}, garis besar kegiatan kelompok, serta kriteria keberhasilan belajar hari ini.`,
    ];
  }

  // Kegiatan Inti: Dihasilkan secara akurat dari sintaks model pembelajaran yang dipilih guru
  const kegiatanInti = getModelSyntaxStages(model, stageType, m, total, safeTopic, options);

  // Kegiatan Akhir: Refleksi, evaluasi, apresiasi, dan tindak lanjut
  const penutup: string[] = [
    `1. Murid bersama guru menyimpulkan butir-butir penting pembelajaran dan mengonfirmasi pemahaman konsep materi ${safeTopic} berdasarkan hasil eksplorasi pada ${secondaryMedia}.`,
    `2. Refleksi Pembelajaran Mendalam: Murid menyampaikan kesan, hal yang paling disukai, dan bagian yang masih membutuhkan latihan melalui lembar refleksi / kartu perasaan anak.`,
    `3. Guru memberikan penguatan moral, mengapresiasi setinggi-tingginya keaktifan dan kerja sama gotong royong seluruh murid, serta memberikan arahan tindak lanjut (pengamatan kontekstual di rumah bersama keluarga).`,
    `4. Seluruh rangkaian pembelajaran ditutup dengan doa bersama yang dipimpin oleh salah satu murid dan salam penutup ramah.`,
  ];

  return {
    stageName,
    stageFocus,
    pendahuluan,
    kegiatanInti,
    penutup,
  };
}'''

content = content[:start_idx] + new_code + content[end_idx:]

with open('src/utils/rpmUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced getPedagogicalStageForMeeting in src/utils/rpmUtils.ts")
