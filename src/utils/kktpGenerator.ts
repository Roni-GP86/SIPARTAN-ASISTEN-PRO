import { SchoolIdentity, TPItem, ATPDocument, KKTPDocument, KKTPItem } from '../types';
import { normalizeDPLArray } from '../data/dimensiProfilLulusan';

/**
 * Membangun Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
 * Berdasarkan:
 * 1. Permendikbudristek No. 21 Tahun 2022 Tentang Standar Penilaian Pendidikan (Ayat 7 & 8)
 * 2. Panduan Pembelajaran dan Asesmen (PPA) Tahun 2025 Kemendikdasmen
 * 3. Keputusan Kepala BSKAP No. 046 Tahun 2025
 * 
 * KKTP BUKAN KKM! KKTP dirumuskan secara spesifik untuk setiap Tujuan Pembelajaran (TP)
 * dengan 4 Cara Resmi:
 * 1. Menggunakan Deskripsi Kriteria (Memadai / Tidak Memadai, minimal 3 dari 4 kriteria)
 * 2. Menggunakan Rubrik (Baru Berkembang, Layak, Cakap, Mahir - KKTP: Minimal Cakap)
 * 3. Menggunakan Skala / Interval Nilai (0-40%, 41-65%, 66-85% [KKTP], 86-100%)
 * 4. Menggunakan Skala Interval yang Diolah dari Rubrik (Bobot 1-4, Skor Maks 16, Nilai Konversi)
 * Ditambah:
 * 5. Alternatif Peninjauan Taksonomi Bloom (Revisi Anderson C1-C4)
 * 6. Matriks Perencanaan Penilaian Formatif dan Sumatif (Tabel Format Resmi Slide 23)
 */
export function buildKKTPDocumentFromTP(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDoc?: ATPDocument | null
): KKTPDocument {
  const mapel = identitas.mataPelajaran || 'Matematika';
  const fase = identitas.fase || 'Fase C';
  const kelas = identitas.kelas || (fase === 'Fase A' ? '1 & 2' : fase === 'Fase B' ? '3 & 4' : '5 & 6');
  const semester = identitas.semester || '1 (Ganjil)';

  // Jaminan Lineage (Silsilah Asal Usul TP):
  // 1. Jika Dokumen ATP sudah ada dan memiliki atpList, gunakan TP dari ATP sebagai sumber TP FINAL yang sudah diurutkan.
  // 2. Jika belum, gunakan tpList hasil analisis CP.
  // Cross-reference keduanya untuk menjamin kalimatCP, kompetensi, alokasi JP, dan lingkup materi tetap utuh 100%.
  const effectiveTPList: TPItem[] = (atpDoc && atpDoc.atpList && atpDoc.atpList.length > 0)
    ? atpDoc.atpList.map((atpItem, idx) => {
        const matchedTP = (tpList || []).find((t) => t.kodeTP === atpItem.kodeTP || t.id === atpItem.id);
        return {
          id: atpItem.id || matchedTP?.id || `tp-final-${idx + 1}`,
          kodeTP: atpItem.kodeTP || matchedTP?.kodeTP || `${idx + 1}.1`,
          elemen: atpItem.elemen || matchedTP?.elemen || atpDoc.elemen || 'Elemen Pembelajaran',
          kalimatCP: matchedTP?.kalimatCP || atpDoc.capaianPembelajaran || '',
          kompetensi: matchedTP?.kompetensi || 'Memahami dan Menerapkan',
          lingkupMateri: atpItem.lingkupMateri || matchedTP?.lingkupMateri || 'Materi Pokok',
          rumusanTP: atpItem.tujuanPembelajaran || matchedTP?.rumusanTP || '',
          indikatorKetercapaian: atpItem.indikatorKetercapaian || matchedTP?.indikatorKetercapaian || '',
          alokasiJP: atpItem.alokasiJP || matchedTP?.alokasiJP || 4,
          dimensiP3: normalizeDPLArray((atpItem.dimensiP3 && atpItem.dimensiP3.length > 0) ? atpItem.dimensiP3 : matchedTP?.dimensiP3),
          semesterTarget: (matchedTP?.semesterTarget || (String(atpItem.semester || '').toLowerCase().includes('2') || String(semester || '').includes('2') ? 'Semester 2' : 'Semester 1')) as 'Semester 1' | 'Semester 2' | 'Fleksibel',
          kelasTarget: atpItem.kelasTarget || matchedTP?.kelasTarget || (fase === 'Fase A' ? '1' : fase === 'Fase B' ? '3' : '5'),
          kelasCentang: matchedTP?.kelasCentang || [atpItem.kelasTarget || '5'],
          urutanAlur: atpItem.urutan || matchedTP?.urutanAlur || idx + 1,
        };
      })
    : (tpList || []);

  const kktpList: KKTPItem[] = effectiveTPList.map((tp, idx) => {
    const kodeTP = tp.kodeTP || `${idx + 1}.1`;
    const elemen = tp.elemen || 'Elemen Pembelajaran';
    const rumusanTP = tp.rumusanTP || `Peserta didik mampu memahami dan menguasai ${tp.lingkupMateri || 'materi'}.`;
    const materi = tp.lingkupMateri || 'Materi Pokok';
    const kompetensi = tp.kompetensi || 'Memahami dan Menerapkan';
    const alokasiJP = tp.alokasiJP || 4;
    const iktp =
      tp.indikatorKetercapaian ||
      `Peserta didik mampu mendemonstrasikan pemahaman konsep, prosedur penyelesaian, dan penerapan kontekstual pada materi ${materi}.`;
    const semesterTarget = tp.semesterTarget || semester;
    const kelasTarget = tp.kelasTarget || (fase === 'Fase A' ? '1' : fase === 'Fase B' ? '3' : '5');
    const dpl = normalizeDPLArray(tp.dimensiP3);

    const verb = (kompetensi || 'Memahami dan Menerapkan').replace(/^\d+\.\s*/, '').trim() || 'memahami';
    const verbLower = verb.toLowerCase();

    // 1. CARA RUBRIK (Slide 11-15): Baru Berkembang, Layak, Cakap, Mahir
    const rubrikBaruBerkembang = `Peserta didik belum mampu ${verbLower} konsep ${materi}, pemahaman konsep belum tampak dalam pengerjaan, ide/jawaban masih belum terstruktur dan membutuhkan instruksi langsung bertahap dari guru.`;
    const rubrikLayak = `Peserta didik mulai mampu ${verbLower} materi ${materi}, telah memahami konsep dasar secara umum namun masih ditemukan sebagian kekeliruan atau ketidaklengkapan penjelasan.`;
    const rubrikCakap = `Peserta didik mampu secara mandiri ${verbLower} materi ${materi} secara tepat, runtut, dan terstruktur serta mampu menjelaskan alasan atau langkah kerjanya secara logis.`;
    const rubrikMahir = `Peserta didik sangat mahir ${verbLower} materi ${materi}, mampu menyelesaikan persoalan kompleks atau kontekstual kehidupan sehari-hari, serta menyertakan fakta/alasan pendukung yang relevan dan bernalar kritis.`;

    const kriteriaEviden = [
      {
        namaEviden: `1. Pemahaman Konsep & Isi Materi (${materi})`,
        baruBerkembang: `Belum mampu mengidentifikasi dan menjelaskan konsep dasar ${materi}.`,
        layak: `Mampu menjelaskan sebagian besar konsep dasar ${materi} dengan benar.`,
        cakap: `Mampu menjelaskan seluruh konsep inti materi ${materi} secara tepat dan runtut.`,
        mahir: `Mampu menguasai seluruh konsep inti ${materi} dan mengaitkannya dengan materi lain secara mendalam.`,
      },
      {
        namaEviden: `2. Keterampilan Prosedural & Penerapan Kontekstual`,
        baruBerkembang: `Belum terampil mempraktikkan atau menerapkan konsep ${materi} dalam pemecahan masalah.`,
        layak: `Mampu mempraktikkan langkah-langkah penerapan ${materi} dengan bimbingan pendidik.`,
        cakap: `Mampu mempraktikkan atau menyelesaikan persoalan ${materi} secara mandiri dan sistematis.`,
        mahir: `Mampu memecahkan masalah kontekstual baru terkait ${materi} secara kreatif, mandiri, dan orisinal.`,
      },
    ];

    // 2. CARA KETIGA RESMI PPA: SKALA / INTERVAL NILAI & TINDAK LANJUT INTERVENSI (Slide 16-17)
    const intervalNilai = generateKKTPIntervalNilai(kodeTP, verb, materi, rumusanTP, iktp);

    // 3. CARA INTERVAL YANG DIOLAH DARI RUBRIK (Slide 18-21): 4 Kriteria x Bobot 1-4
    const intervalDariRubrik = {
      kriteriaList: [
        { kriteria: `1. Menunjukkan pemahaman konsep dan istilah pokok ${materi}`, bobotDefault: 3 },
        { kriteria: `2. Menunjukkan kemampuan ${verbLower} secara runtut dan terstruktur`, bobotDefault: 3 },
        { kriteria: `3. Menjelaskan hasil penalaran atau pemecahan masalah secara logis`, bobotDefault: 3 },
        { kriteria: `4. Mengaplikasikan pemahaman ke dalam situasi/soal kontekstual nyata`, bobotDefault: 3 },
      ],
      skorMaksimal: 16,
      skalaBobot: [
        { bobot: 1, keterangan: 'Belum Muncul' },
        { bobot: 2, keterangan: 'Muncul Sebagian Kecil' },
        { bobot: 3, keterangan: 'Sudah Muncul di Sebagian Besar' },
        { bobot: 4, keterangan: 'Terlihat pada Keseluruhan Bukti' },
      ],
      contohSimulasi: {
        skorDiperoleh: 12,
        nilaiHitung: 75,
        kesimpulan: 'Nilai 75: Berada pada interval 66 - 85% (Telah mencapai tujuan pembelajaran tanpa remedial - KKTP Terpenuhi).',
      },
    };

    // 4. CARA DESKRIPSI KRITERIA (Slide 8-10): Memadai vs Tidak Memadai
    const kriteriaDeskripsi = [
      {
        kriteria: `Laporan/hasil kerja menunjukkan penguasaan konsep materi ${materi} secara tepat.`,
        memadai: true,
        belumMemadai: false,
        catatanGuru: `Peserta didik mampu mendeskripsikan gagasan utama materi ${materi}.`,
      },
      {
        kriteria: `Laporan/jawaban menunjukkan langkah kerja dan hasil pengamatan yang jelas dan runtut.`,
        memadai: true,
        belumMemadai: false,
        catatanGuru: `Pengerjaan dilakukan secara teratur dan sistematis.`,
      },
      {
        kriteria: `Menjelaskan hubungan kausalitas/alasan yang logis sehingga dapat meyakinkan pendidik/pembaca.`,
        memadai: true,
        belumMemadai: false,
        catatanGuru: `Mampu mengemukakan argumen atau cara penyelesaian secara rasional.`,
      },
      {
        kriteria: `Mampu menyajikan dan mengkomunikasikan hasil belajar dengan bahasa yang runtut dan santun.`,
        memadai: true,
        belumMemadai: false,
        catatanGuru: `Menggunakan tata kalimat yang komunikatif dan percaya diri.`,
      },
    ];

    // 5. ALTERNATIF TAKSONOMI BLOOM (Slide 22)
    const bloomTaxonomy = {
      tingkatKKO: `C4 (${competencyToBloom(verb)})`,
      tesBerjenjang: [
        { tingkat: 'C1', label: 'Mengingat', deskripsiSoal: `Menyebutkan dan mengidentifikasi fakta dasar/istilah terkait materi ${materi}.` },
        { tingkat: 'C2', label: 'Memahami', deskripsiSoal: `Menjelaskan konsep dan prinsip kerja pada materi ${materi} dengan kalimat sendiri.` },
        { tingkat: 'C3', label: 'Menerapkan', deskripsiSoal: `Menggunakan rumus/prosedur untuk menyelesaikan masalah rutin terkait materi ${materi}.` },
        { tingkat: 'C4', label: 'Menganalisis', deskripsiSoal: `Memeriksa, membedakan, atau menemukan hubungan sebab-akibat kontekstual dalam materi ${materi}.` },
      ],
      kesimpulanKetuntasan: `Siswa yang telah dapat mengerjakan tes sampai soal yang berasal dari level KKO kompetensi (${competencyToBloom(verb)}) dinyatakan telah mencapai Tujuan Pembelajaran.`,
    };

    // 6. MATRIKS PERENCANAAN PENILAIAN FORMATIF & SUMATIF (Slide 23)
    const perencanaanPenilaian = {
      tujuanPembelajaran: rumusanTP,
      indikatorCapaianPerforma: iktp,
      bentukPenilaian: inferBentukPenilaian(verb, materi),
      instrumenPenilaian: inferInstrumenPenilaian(verb),
      pendekatanKKTP: 'Rubrik Kualitatif & Interval Nilai',
      keteranganKetuntasan: 'Minimal Cakap untuk kedua eviden (Interval 66 - 85%)',
    };

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
      // Lineage properties
      kalimatCP: tp.kalimatCP,
      kompetensi: tp.kompetensi,
      sumberAsal: (atpDoc && atpDoc.atpList && atpDoc.atpList.length > 0 ? 'ATP_FINAL' : 'CP_ANALISIS') as 'ATP_FINAL' | 'CP_ANALISIS',
      pendekatanRubrik: {
        baruBerkembang: rubrikBaruBerkembang,
        layak: rubrikLayak,
        cakap: rubrikCakap,
        mahir: rubrikMahir,
        // compatibility aliases
        perluBimbingan: rubrikBaruBerkembang,
        cukup: rubrikLayak,
        baik: rubrikCakap,
        sangatBaik: rubrikMahir,
        kriteriaEviden,
        kesimpulanKetuntasan: 'Peserta didik dianggap sudah mencapai tujuan pembelajaran jika kedua kriteria/bukti kinerja mencapai tahap minimal Cakap atau Mahir (KKTP: Minimal Cakap pada kedua kriteria).',
      },
      intervalNilai,
      intervalDariRubrik,
      kriteriaDeskripsi,
      bloomTaxonomy,
      perencanaanPenilaian,
      teknikAsesmen: [
        'Observasi Performa / Kinerja Peserta Didik',
        'Tes Tertulis Formatif / Lembar Kerja (LKPD)',
        'Penilaian Portofolio / Produk Hasil Belajar',
      ],
      instrumenAsesmen: `Rubrik 4 Tingkat Ketercapaian, Lembar Observasi Kinerja, dan Tes Formatif/Sumatif Berjenjang ${materi}.`,
      tindakLanjutRemedial: `Bimbingan personal (re-teaching) pada materi ${materi} dengan media konkret/visual, diikuti tes formatif konfirmasi ketercapaian.`,
      tindakLanjutPengayaan: `Pemberian tantangan masalah kontekstual terbuka (open-ended problem) atau proyek mini investigasi mandiri terkait ${materi}.`,
    };
  });

  return {
    id: `kktp-${Date.now()}`,
    atpDocumentId: atpDoc?.id,
    tanggalDibuat: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    identitas,
    elemen:
      tpList.length > 0
        ? Array.from(new Set(tpList.map((t) => t.elemen))).join(' & ')
        : 'Seluruh Elemen Mapel',
    capaianPembelajaran:
      atpDoc?.capaianPembelajaran ||
      tpList
        .map((t) => t.kalimatCP)
        .filter(Boolean)
        .slice(0, 3)
        .join('\n') ||
      '',
    kktpList,
    pendekatanDipilih: 'Semua Pendekatan',
    catatanPedagogis: `Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) ini disusun berdasarkan Permendikbudristek No. 21 Tahun 2022 Pasal 9 ayat (7) & (8), Panduan Pembelajaran dan Asesmen (PPA) Tahun 2025, dan ${((identitas.mataPelajaran || '').toLowerCase().includes('agama') || (identitas.mataPelajaran || '').toLowerCase().includes('katolik') || (identitas.mataPelajaran || '').toLowerCase().includes('kristen') || (identitas.mataPelajaran || '').toLowerCase().includes('pak') || (identitas.mataPelajaran || '').toLowerCase().includes('pai')) ? 'Regulasi Standar Capaian Pembelajaran BKP No. 020/2026' : 'Keputusan Kepala BSKAP No. 046 Tahun 2025'}. KKTP merupakan penjelasan (deskripsi) tentang kemampuan apa yang perlu ditunjukkan/didemonstrasikan peserta didik sebagai bukti bahwa ia telah mencapai Tujuan Pembelajaran (TP). Pada Kurikulum Merdeka, KKTP menggantikan fungsi KKM tunggal. Penilaian sumatif dilakukan dengan membandingkan pencapaian hasil belajar peserta didik dengan kriteria ketercapaian TP menggunakan rubrik performa (Baru Berkembang, Layak, Cakap, Mahir) dan skala interval nilai (0-40%, 41-65%, 66-85%, 86-100%).`,
    landasanHukum: {
      permendikbud: 'Permendikbudristek No. 21 Tahun 2022 Pasal 9 ayat (7) dan (8) tentang Standar Penilaian Pendidikan',
      panduanAsesmen: 'Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka Tahun 2025 - Kementerian Pendidikan Dasar dan Menengah',
      prinsipUtama: [
        'KKTP dikembangkan secara spesifik untuk setiap Tujuan Pembelajaran (TP), bukan satu angka KKM mutlak untuk seluruh mata pelajaran.',
        'KKTP berfungsi memberikan informasi yang bermanfaat untuk perbaikan proses pembelajaran (formatif) dan penentuan ketercapaian belajar (sumatif).',
        'Penetapan ketercapaian dapat menggunakan 4 cara resmi: Deskripsi Kriteria, Rubrik Kualitatif, Skala Interval Nilai, dan Interval Nilai yang Diolah dari Rubrik.',
      ],
    },
    panduanPelaksanaanAsesmen: {
      langkahAsesmenFormatif: [
        'Lakukan asesmen awal (diagnostik) untuk memetakan kesiapan dan prasyarat kompetensi peserta didik.',
        'Gunakan rubrik kualitatif 4 tingkat (Baru Berkembang, Layak, Cakap, Mahir) saat kegiatan pembelajaran berlangsung untuk memberikan umpan balik (feedback) langsung.',
        'Asesmen formatif bertujuan memperbaiki proses pembelajaran (assessment for & as learning), bukan untuk dimasukkan sebagai nilai akhir rapor.',
      ],
      langkahAsesmenSumatif: [
        'Laksanakan asesmen sumatif setelah satu atau kumpulan Tujuan Pembelajaran (TP) selesai dipelajari.',
        'Bandingkan pencapaian hasil asesmen peserta didik dengan kriteria KKTP yang telah ditentukan untuk TP tersebut.',
        'Gunakan skala interval (0-40% remedial total, 41-65% remedial terarah, 66-85% tuntas tanpa remedial, 86-100% pengayaan tantangan).',
        'Peserta didik yang belum mencapai tahap tuntas (0-65%) wajib diberikan intervensi remedial sebelum pelaporan nilai akhir semester.',
      ],
      pengolahanNilaiRapor: `Nilai akhir rapor Kurikulum Merdeka diolah dari rerata asesmen sumatif lingkup materi dan asesmen sumatif akhir semester (SAS). Deskripsi rapor disusun berdasarkan bukti ketercapaian TP: mencantumkan kompetensi tertinggi yang dikuasai dengan sangat baik dan kompetensi yang masih perlu bimbingan lanjutan, mengacu langsung pada rumusan KKTP ini.`,
    },
  };
}

function competencyToBloom(verb: string): string {
  const v = (verb || '').toLowerCase();
  if (v.includes('analisis') || v.includes('membedakan') || v.includes('menyelidiki') || v.includes('mengidentifikasi hubungan')) {
    return 'Menganalisis (C4)';
  }
  if (v.includes('terap') || v.includes('hitung') || v.includes('lakukan') || v.includes('gunakan') || v.includes('selesaikan')) {
    return 'Menerapkan (C3)';
  }
  if (v.includes('jelas') || v.includes('paham') || v.includes('deskripsi') || v.includes('kelompokkan')) {
    return 'Memahami (C2)';
  }
  if (v.includes('sebut') || v.includes('tulis') || v.includes('ingat')) {
    return 'Mengingat (C1)';
  }
  return 'Menerapkan / Menganalisis (C3 - C4)';
}

function inferBentukPenilaian(verb: string, _materi?: string): string {
  const v = (verb || '').toLowerCase();
  if (v.includes('tulis') || v.includes('laporan') || v.includes('cerita')) {
    return 'Produk Laporan, Esai, & Tes Tertulis';
  }
  if (v.includes('praktik') || v.includes('simulasi') || v.includes('buat') || v.includes('rancang')) {
    return 'Unjuk Kerja / Praktik & Produk Hasil Belajar';
  }
  if (v.includes('hitung') || v.includes('analisis') || v.includes('hitunglah')) {
    return 'Tes Tertulis Formatif, Esai Penalaran, & Refleksi';
  }
  return 'Tes Tertulis, Diskusi Kelas, & Unjuk Kerja';
}

function inferInstrumenPenilaian(verb: string): string {
  const v = (verb || '').toLowerCase();
  if (v.includes('praktik') || v.includes('performa') || v.includes('tulis')) {
    return 'Rubrik Performa 4 Skala & Lembar Observasi';
  }
  return 'Rubrik Penilaian, Soal Tes Berjenjang (C1-C4), & Catatan Anekdotal';
}

/**
 * Menghasilkan data KKTP Cara Ketiga: Menggunakan Skala (Interval Nilai)
 * Berdasarkan Panduan Pembelajaran dan Asesmen (PPA) Kemendikdasmen Slide 16-17
 * 4 Interval Baku Resmi:
 * - 0 - 40%   : Belum mencapai ketuntasan -> Remedial di seluruh bagian
 * - 41 - 65%  : Belum mencapai ketuntasan -> Remedial di bagian yang diperlukan
 * - 66 - 85%  : Sudah mencapai ketuntasan (KKTP) -> Tidak perlu remedial, lanjut materi berikutnya
 * - 86 - 100% : Sudah mencapai ketuntasan (Melampaui kriteria) -> Pengayaan / tantangan lebih (HOTS)
 */
function generateKKTPIntervalNilai(
  kodeTP: string,
  verb: string,
  materi: string,
  _rumusanTP: string,
  _iktp: string
) {
  const v = (verb || 'memahami').toLowerCase();
  const mLower = (materi || '').toLowerCase();

  let c0_40 = `Peserta didik belum menguasai konsep dasar ${materi} dan belum mampu ${v}. Masih mengalami kendala mendasar dalam mengenali istilah, simbol, atau prosedur awal.`;
  let c41_65 = `Peserta didik mulai memahami konsep dasar ${materi}, namun masih sering melakukan kekeliruan dalam prosedur ${v} atau belum konsisten menyelesaikan soal terapan.`;
  let c66_85 = `Peserta didik telah menguasai konsep inti ${materi} secara tepat dan mampu ${v} secara mandiri, runtut, dan sistematis sesuai kriteria ketercapaian tujuan pembelajaran.`;
  let c86_100 = `Peserta didik menguasai materi ${materi} secara mendalam dan menyeluruh, sangat terampil ${v}, serta mampu bernalar kritis memecahkan masalah kontekstual baru secara mandiri dan kreatif.`;

  // Tailored by topic for enhanced validity and pedagogical relevance
  if (mLower.includes('nilai tempat') || kodeTP === '5.1') {
    c0_40 = `Peserta didik belum memahami konsep nilai tempat (satuan s.d ratus ribuan) dan belum mampu memisahkan nilai angka secara terstruktur.`;
    c41_65 = `Peserta didik mampu membaca bilangan cacah s.d 1.000.000, namun masih sering tertukar menentukan nilai tempat puluhan ribu dan ratus ribuan atau keliru saat dekomposisi bilangan kompleks.`;
    c66_85 = `Peserta didik mampu membaca, menulis, menentukan nilai tempat dengan tepat, serta melakukan komposisi dan dekomposisi bilangan cacah sampai 1.000.000 secara mandiri dan runtut.`;
    c86_100 = `Peserta didik sangat mahir menganalisis nilai tempat bilangan cacah besar, mampu melakukan komposisi-dekomposisi fleksibel, serta terampil memecahkan masalah kontekstual perbandingan bilangan besar dalam kehidupan nyata.`;
  } else if (mLower.includes('operasi hitung') || kodeTP === '5.2') {
    c0_40 = `Peserta didik belum menguasai prosedur penjumlahan, pengurangan, perkalian, atau pembagian bersusun pada bilangan cacah besar, serta belum memahami hubungan nilai uang.`;
    c41_65 = `Peserta didik mampu melakukan operasi penjumlahan dan pengurangan dasar, namun masih sering keliru pada operasi perkalian dan pembagian bersusun atau saat menyelesaikan soal cerita pemecahan masalah uang.`;
    c66_85 = `Peserta didik mampu menyelesaikan operasi hitung penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah sampai 100.000 dengan benar serta mampu menyelesaikan masalah kontekstual nilai uang secara mandiri.`;
    c86_100 = `Peserta didik sangat terampil dan cepat dalam memilih strategi operasi hitung paling efisien, mampu menyelesaikan soal cerita multi-langkah terkait pengelolaan uang dan bernalar logis secara akurat.`;
  } else if (mLower.includes('kpk') || kodeTP === '5.3') {
    c0_40 = `Peserta didik belum memahami konsep faktor dan kelipatan bilangan serta belum mampu menentukan faktorisasi prima dengan pohon faktor.`;
    c41_65 = `Peserta didik dapat menentukan kelipatan dan faktor dari bilangan sederhana, namun masih sering keliru membedakan konsep KPK dan FPB atau salah dalam menentukan pangkat pada faktorisasi prima.`;
    c66_85 = `Peserta didik mampu menentukan KPK dan FPB menggunakan metode faktorisasi prima secara tepat serta mampu menyelesaikan masalah sehari-hari terkait jadwal bersama (KPK) dan pembagian sama rata (FPB).`;
    c86_100 = `Peserta didik mampu menyelesaikan masalah kontekstual non-rutin yang melibatkan KPK dan FPB pada lebih dari dua bilangan besar serta mampu menjelaskan alasan rasional pemilihan metodenya.`;
  } else if (mLower.includes('pecahan') || kodeTP === '6.1' || kodeTP === '6.2') {
    c0_40 = `Peserta didik belum memahami konsep pecahan senilai, belum mampu menyamakan penyebut, dan belum mengenal nilai tempat bilangan desimal.`;
    c41_65 = `Peserta didik dapat mengurutkan pecahan berpenyebut sama, namun masih keliru saat menyamakan penyebut pecahan tidak sama, mengubah pecahan campuran ke biasa, atau membandingkan bilangan desimal.`;
    c66_85 = `Peserta didik mampu membandingkan dan mengurutkan berbagai pecahan termasuk pecahan campuran dan desimal, serta terampil melakukan operasi perkalian dan pembagian pecahan secara mandiri dan runtut.`;
    c86_100 = `Peserta didik sangat mahir mengaitkan konsep pecahan, desimal, dan persen ke dalam situasi belanja, diskon, atau pembagian proporsional dalam kehidupan nyata secara mandiri dan bernalar kritis.`;
  } else if (mLower.includes('aljabar') || mLower.includes('kalimat matematika') || kodeTP === '5.4') {
    c0_40 = `Peserta didik belum memahami hubungan kesamaan dan belum mampu menemukan nilai yang belum diketahui dalam kalimat matematika sederhana.`;
    c41_65 = `Peserta didik dapat menyelesaikan kalimat matematika penjumlahan dan pengurangan, namun masih bingung menentukan operasi invers pada perkalian dan pembagian atau mencari variabel yang belum diketahui.`;
    c66_85 = `Peserta didik mampu menggunakan sifat-sifat bilangan dan operasi hitung untuk menemukan nilai yang belum diketahui dalam kalimat matematika secara tepat dan mandiri.`;
    c86_100 = `Peserta didik mampu merumuskan situasi kontekstual nyata ke dalam bentuk kalimat matematika serta menemukan solusi nilai yang belum diketahui dengan penalaran aljabar tingkat lanjut.`;
  } else if (mLower.includes('pola bilangan') || kodeTP === '5.5') {
    c0_40 = `Peserta didik belum mampu mengenali aturan pola bilangan sederhana (membesar atau mengecil).`;
    c41_65 = `Peserta didik dapat melanjutkan pola bilangan berulang sederhana, namun masih kesulitan mengidentifikasi pola perkalian/pembagian atau merumuskan aturan suku berikutnya.`;
    c66_85 = `Peserta didik mampu mengidentifikasi, meniru, dan mengembangkan pola bilangan membesar dan mengecil yang melibatkan perkalian dan pembagian secara runtut.`;
    c86_100 = `Peserta didik mampu membuat variasi pola bilangan baru yang kreatif, menganalisis pola bilangan non-linier, dan menjelaskan aturan pembentukannya secara logis.`;
  } else if (mLower.includes('keliling') || mLower.includes('luas') || kodeTP === '5.6') {
    c0_40 = `Peserta didik belum memahami perbedaan konsep keliling dan luas bangun datar serta belum menguasai rumus dasarnya.`;
    c41_65 = `Peserta didik mampu menghitung keliling dan luas bangun datar tunggal (persegi, persegi panjang), namun masih keliru saat membedah bangun datar gabungan menjadi bagian-bagian sederhana.`;
    c66_85 = `Peserta didik mampu menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segi empat) serta terampil menghitung luas bangun gabungan secara mandiri dan tepat.`;
    c86_100 = `Peserta didik mampu memecahkan masalah kontekstual perencanaan denah/taman nyata yang melibatkan perhitungan luas dan keliling bangun gabungan serta mengestimasi biaya bahan secara akurat.`;
  } else if (mLower.includes('bangun ruang') || mLower.includes('jaring') || kodeTP === '5.7') {
    c0_40 = `Peserta didik belum mengenali komponen bangun ruang (sisi, rusuk, titik sudut) dan belum memahami bentuk jaring-jaring kubus/balok.`;
    c41_65 = `Peserta didik dapat mengidentifikasi bangun ruang sederhana, namun masih kesulitan memvisualisasikan jaring-jaring yang benar atau membedakan posisi alas dan tutup.`;
    c66_85 = `Peserta didik mampu mengonstruksi dan mengurai bangun ruang (kubus, balok, dan gabungannya) serta mengenali berbagai variasi jaring-jaring kubus dan balok secara mandiri.`;
    c86_100 = `Peserta didik mampu merancang jaring-jaring bangun ruang gabungan kompleks dan menganalisis visualisasi spasial 3D (tampak atas, depan, samping) secara tepat dan bernalar spasial tinggi.`;
  } else if (mLower.includes('data') || mLower.includes('diagram') || kodeTP === '5.9') {
    c0_40 = `Peserta didik belum mampu membaca data sederhana pada tabel frekuensi dan belum mengenal diagram batang atau piktogram.`;
    c41_65 = `Peserta didik dapat membaca nilai data tunggal pada diagram, namun masih kesulitan membandingkan data antar-kategori atau menyajikan data mentah ke dalam diagram batang berfrekuensi.`;
    c66_85 = `Peserta didik mampu mengurutkan, membandingkan, menyajikan data hasil pengukuran dalam bentuk piktogram dan diagram batang, serta menganalisis informasi data secara tepat dan mandiri.`;
    c86_100 = `Peserta didik sangat terampil menginterpretasikan tren data, menarik simpulan kritis berbasis data, dan menyajikan laporan visual data yang informatif serta komunikatif.`;
  }

  const int0_40 = `0% - 40% (Belum Mencapai Tujuan): ${c0_40} Intervensi Pedagogis: Diberikan program remedial di seluruh bagian materi ${materi} melalui pembelajaran ulang (re-teaching) intensif satu-lawan-satu dengan bantuan media manipulatif/alat peraga konkret.`;
  const int41_65 = `41% - 65% (Belum Mencapai Tujuan): ${c41_65} Intervensi Pedagogis: Diberikan program remedial terarah pada sub-materi/prosedur yang belum dikuasai melalui bimbingan tutor sebaya dan latihan terbimbing bertahap (scaffolding).`;
  const int66_85 = `66% - 85% (Sudah Mencapai Tujuan - KKTP Standar): ${c66_85} Intervensi Pedagogis: Tidak perlu remedial (TUNTAS). Peserta didik telah tuntas mencapai kriteria dan siap melanjutkan ke Tujuan Pembelajaran (TP) berikutnya.`;
  const int86_100 = `86% - 100% (Sudah Mencapai Tujuan - Melampaui Standar): ${c86_100} Intervensi Pedagogis: Diberikan program pengayaan materi berupa latihan penalaran tingkat tinggi (HOTS), soal terbuka (open-ended problem), atau proyek investigasi mini kontekstual.`;

  return {
    interval0_40: int0_40,
    interval41_65: int41_65,
    interval66_85: int66_85,
    interval86_100: int86_100,
    kesimpulanInterval: `KKTP: Interval 66% - 85% (Peserta didik dinyatakan telah mencapai Tujuan Pembelajaran)`,
  };
}

