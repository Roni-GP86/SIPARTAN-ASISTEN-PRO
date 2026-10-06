export interface SchoolIdentity {
  namaSatuanPendidikan: string;
  namaSekolah?: string; // alias for namaSatuanPendidikan
  namaGuru: string;
  nipGuru?: string;
  peranGuru?: 'Guru Kelas' | 'Guru Mata Pelajaran' | string;
  fotoGuruUrl?: string; // profile photo URL for guru
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  mataPelajaran: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap' | '1 (Ganjil)' | '2 (Genap)' | '1 & 2 (1 Tahun Penuh)' | string;
  alokasiWaktuTotal?: string;
  tempatPenetapan?: string;
  tanggalPenetapan?: string;
  alamatInstansi?: string;
  kabupaten?: string;
  logoUrl?: string; // Data URL Base64 or image URL for official kop surat & cover
  isLockedByAdmin?: boolean; // Dikunci permanen oleh Admin, pengguna tidak dapat mengedit
  // Baris KOP Dokumen Resmi Kedinasan
  kopBaris1?: string; // Baris 1: PEMERINTAH KABUPATEN TIMOR TENGAH UTARA
  kopBaris2?: string; // Baris 2: DINAS PENDIDIKAN DAN KEBUDAYAAN
  kopBaris3?: string; // Baris 3: SD NEGERI FATUBAI
  kopBaris4?: string; // Baris 4: ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah
  jenisUjian?: string; // Pilihan guru: Ulangan Harian / Tengah Semester 1 / Ujian Semester 1 / dll
}

export interface TPItem {
  id: string;
  kodeTP: string;
  elemen: string;
  kalimatCP: string;
  kompetensi: string; // Kata Kerja Operasional / KKO Taksonomi
  lingkupMateri: string; // Materi spesifik pokok
  rumusanTP: string; // Tujuan Pembelajaran utuh
  indikatorKetercapaian?: string;
  alokasiJP: number;
  dimensiP3: string[]; // Dimensi Profil Lulusan (8 DPL)
  semesterTarget: 'Semester 1' | 'Semester 2' | 'Fleksibel';
  kelasTarget?: string; // misal '3' atau '4' (atau '1', '2', '5', '6')
  kelasCentang?: string[]; // array kelas yang dicentang, misal ['3'] atau ['3', '4']
  kataKunci?: string;
  urutanAlur: number;
}

export interface BedahElemenRow {
  id: string;
  elemen: string;
  capaianPembelajaran: string;
  kalimatCP?: string; // alias for capaianPembelajaran
  rujukanRegulasi?: string;
  daftarKompetensi: string[]; // e.g. ["1. Memahami", "2. Mengidentifikasi"]
  daftarLingkupMateri: string[]; // e.g. ["1. Bentuk dan fungsi pancaindra", "2. Siklus hidup..."]
  daftarTP: TPItem[];
}

export interface ElemenCPItem {
  id?: string;
  elemen: string;
  capaianPembelajaran: string;
  deskripsiSingkat?: string;
}

export interface ATPBlockItem {
  id: string;
  judulUnit?: string;
  kelas?: string;
  tujuanPembelajaranList: {
    kodeTP: string;
    rumusanTP: string;
  }[];
  perkiraanJP: number;
  kataKunci: string;
  lingkupMateriList: string[];
  glosarium: {
    istilah: string;
    definisi: string;
  }[];
}

export interface ATPItem {
  id: string;
  kodeTP: string;
  urutan: number;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  alokasiJP: number;
  semester: string;
  dimensiP3: string[]; // Minimal 3 Dimensi Profil Lulusan (DPL)
  indikatorKetercapaian: string;
  kegiatanPembelajaranInti?: string;
  kelasTarget?: string;
  elemen?: string;
  kalimatCP?: string;
}

export interface MateriPokok {
  bab: string;
  judulMateri: string;
  subMateri: string[];
  perkiraanJP: number;
}

export interface GlosariumItem {
  istilah: string;
  definisi: string;
}

export interface DaftarPustakaItem {
  penulis: string;
  tahun: string;
  judul: string;
  penerbit: string;
  kota?: string;
  keterangan?: string;
}

export interface ATPDocument {
  id: string;
  tanggalDibuat: string;
  // A. Identitas
  identitas: SchoolIdentity;
  // B. Elemen & C. Capaian Pembelajaran Terpisah Per Elemen
  elemen: string;
  capaianPembelajaran: string;
  elemenList?: ElemenCPItem[]; // Deskripsi CP terpisah per elemen untuk 1 mata pelajaran utuh
  // D. Alur Tujuan Pembelajaran
  atpList: ATPItem[];
  // E. Materi
  materiPokokList: MateriPokok[];
  // F. Dimensi Profil Lulusan (8 DPL)
  dimensiProfilLulusan: string[];
  penjelasanDPL?: string;
  // G. Glosarium
  glosarium: GlosariumItem[];
  // H. Daftar Pustaka
  daftarPustaka: DaftarPustakaItem[];
  // Blok ATP sesuai format unit/tema (Halaman 8)
  atpBlocks?: ATPBlockItem[];
  // Catatan rasionalitas alur
  rasionalPenyusunan?: string;
}

export interface AsesmenPertemuanItem {
  jenisAsesmen: string; // e.g. "Asesmen Diagnostik (Awal) & Formatif (Proses)" | "Asesmen Formatif (Proses)" | "Asesmen Formatif (Presentasi) & Asesmen Sumatif (Lingkup TP)"
  teknikDanBentuk: string; // e.g. "Observasi Kinerja Diskusi & Tanya Jawab Lisan"
  instrumen: string; // e.g. "Lembar Observasi Aktivitas & LKPD Aktivitas Pertemuan ke-1"
  buktiBelajar: string; // e.g. "Respon lisan siswa terhadap pertanyaan pemantik serta catatan isian awal kelompok pada LKPD"
  tindakLanjut?: string; // e.g. "Bimbingan perancah langsung bagi siswa yang masih ragu, pengayaan konsep bagi siswa mahir"
}

export interface PertemuanModul {
  pertemuanKe: number;
  alokasiWaktu: string;
  tujuanPembelajaran?: string; // Rumusan TP Payung yang dituju (sama antar pertemuan jika dari TP yang sama)
  subMateri?: string; // Sub-materi pokok / materi ajar spesifik yang dipelajari pada pertemuan ini (hasil analisis CP-TP-ATP)
  fokusTP: string; // Fokus pembelajaran & indikator ketercapaian pertemuan ini
  pendahuluan: string[];
  kegiatanInti: {
    faseSintaks: string;
    aktivitasGuru: string;
    aktivitasSiswa: string;
    pengalamanBelajar?: string;
    prinsipPembelajaran?: string;
    alokasiMenit?: string;
  }[];
  penutup: string[];
  asesmenPertemuan?: AsesmenPertemuanItem;
}

export interface RubrikKriteria {
  aspek: string;
  baruBerkembang: string;
  layak: string;
  cakap: string;
  mahir: string;
}

export interface SoalAsesmen {
  nomor: number;
  soal: string;
  pilihanGanda?: string[];
  kunciJawaban: string;
  bobot: number;
}

export interface LKPDItem {
  judulLKPD: string;
  tujuanKegiatan: string;
  alatBahan: string[];
  langkahKerja: string[];
  pertanyaanDiskusi: string[];
  kesimpulanPrompt: string;
}

// =========================================================================
// RENCANA PEMBELAJARAN MENDALAM (RPM) / MODUL AJAR KURIKULUM MERDEKA
// Sesuai Struktur Resmi Kemendikdasmen & Panduan Pembelajaran Mendalam
// =========================================================================

export interface IdentifikasiPesertaDidikRPM {
  kompetensiAwal: string; // (a). Kompetensi Awal Murid
  karakteristikMurid: string[]; // (b). Karakteristik Murid: 'Aktif secara fisik', 'Suka belajar konkret', dll
  karakteristikMuridCustom?: string;
  kebutuhanMurid: string; // (c). Kebutuhan Murid
}

export interface IdentifikasiPembelajaranRPM {
  identifikasiPesertaDidik: IdentifikasiPesertaDidikRPM;
  karakteristikMateri: string; // 2. Karakteristik Materi
  dimensiProfilLulusan: string[]; // 3. Dimensi Profil Lulusan
}

export interface LintasDisiplinIlmuItem {
  mataPelajaran: string; // e.g. "Pendidikan Pancasila", "IPAS", "KKA (Koding & AI)"
  keterkaitan: string;
}

export interface PraktikPedagogisRPM {
  modelPembelajaran: string; // Problem Based Learning (PBL), PjBL, Inkuiri Terbimbing, Discovery
  pendekatanPembelajaran: string; // Pembelajaran Mendalam (Deep Learning - Mindful, Meaningful, Joyful)
  metodePembelajaran: string[]; // ['Diskusi Kelompok', 'Tanya Jawab', 'Demonstrasi', 'Eksplorasi']
}

export interface MitraPembelajaranRPM {
  mitraInternal: string[]; // ['Guru Kelas', 'Guru Mata Pelajaran', 'Peserta Didik', 'Teman Sebaya']
  mitraEksternal: string[]; // ['Orang Tua', 'Tokoh Masyarakat', 'Pengawas']
}

export interface LingkunganBelajarRPM {
  lingkunganFisik: string[]; // ['Ruang Kelas', 'Lapangan', 'Perpustakaan', 'Laboratorium']
  lingkunganFisikDeskripsi?: string;
  budayaBelajar: string[]; // ['Disiplin', 'Kerja Sama', 'Saling Menghargai', 'Aktif Bertanya', 'Jujur & Tanggung Jawab', 'Refleksi Diri']
}

export interface PemanfaatanTeknologiRPM {
  platformAplikasi: string[]; // ['Quizizz', 'YouTube', 'Canva', 'Google Classroom']
  perangkatDigital: string[]; // ['Laptop / Komputer', 'Android / Smartphone', 'Papan Interaktif', 'Proyektor / LCD']
  mediaDigital: string[]; // ['Video Pembelajaran', 'Infografis', 'Komik Digital', 'Slide Presentasi', 'Audio']
}

export interface DesainPembelajaranRPM {
  capaianPembelajaran: string; // 1. Capaian Pembelajaran (Deskripsi utuh dan lengkap)
  capaianPembelajaranPerElemen?: {
    elemen: string;
    capaianPembelajaran: string;
    kodeTPList?: string[];
  }[];
  tujuanPembelajaran: string; // 2. Tujuan Pembelajaran (sesuai ATP)
  lintasDisiplinIlmu: LintasDisiplinIlmuItem[]; // 3. Lintas Disiplin Ilmu
  praktikPedagogis: PraktikPedagogisRPM; // 4. Praktik Pedagogis
  mitraPembelajaran: MitraPembelajaranRPM; // 5. Mitra Pembelajaran
  lingkunganBelajar: LingkunganBelajarRPM; // 6. Lingkungan Belajar
  pemanfaatanTeknologi: PemanfaatanTeknologiRPM; // 7. Pemanfaatan Digital
}

export interface SintaksDeepLearningItem {
  faseSintaks: string; // e.g. "Sintak 1. Orientasi siswa pada masalah"
  aktivitas: string; // Aktivitas guru dan siswa secara detail
  pengalamanBelajar?: string; // ✨ Pengalaman Belajar: Bermakna / Berkesadaran / Menggembirakan
  prinsipPembelajaran?: string; // 💎 Prinsip Pembelajaran: Memahami / Mengaplikasikan / Merefleksi
  alokasiMenit?: string; // e.g. "10 Menit"
}

export interface LangkahPembelajaranRPMRow {
  kegiatan: 'Kegiatan Awal' | 'Kegiatan Inti' | 'Kegiatan Akhir';
  deskripsi: string;
  waktu: string; // e.g. "10 Menit", "50 Menit", "10 Menit"
  sintaksList?: SintaksDeepLearningItem[];
}

export interface AsesmenTeknikSumber {
  bentukTeknik: string;
  caraSumber: string;
  waktuPelaksanaan?: string;
  daftarInstrumen?: string[];
}

export interface AsesmenPembelajaranRPM {
  diagnostik: AsesmenTeknikSumber;
  formatif: AsesmenTeknikSumber;
  sumatif: AsesmenTeknikSumber;
  rincianPerPertemuan?: {
    pertemuanKe: number;
    jenisAsesmen: string;
    fokusAktivitas: string;
    teknikBentuk: string;
    buktiBelajar: string;
  }[];
}

export interface RubrikPenilaianRPMItem {
  nomor: number;
  aspekPenilaian: string;
  kriteria: string;
  skor4: string; // Sangat Baik
  skor3: string; // Baik
  skor2: string; // Cukup
  skor1: string; // Kurang
}

export interface LKPDLangkahKerjaItem {
  nomor: number;
  langkahKerja: string;
  hasilJawabanPlaceholder?: string;
}

export interface LKPDSubAktivitasPertemuan {
  pertemuanKe: number;
  judulAktivitas: string;
  fokusTarget: string;
  petunjukAktivitas: string[];
  langkahKerja: LKPDLangkahKerjaItem[];
  pertanyaanPemantik?: string;
  refleksiSesi?: string;
}

export interface LKPDDokumenRPM {
  judulLKPD: string;
  petunjuk: string[];
  langkahKerjaAwal: LKPDLangkahKerjaItem[];
  kegiatanKelompokJudul: string;
  kegiatanKelompokInstruksi: string;
  pertanyaanAnalisis: { nomor: number; pertanyaan: string; hasilPlaceholder?: string }[];
  refleksiDiriKelompok: { nomor: number; pertanyaan: string; hasilPlaceholder?: string }[];
  aktivitasPerPertemuan?: LKPDSubAktivitasPertemuan[];
}

export interface SoalEvaluasiRPMItem {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  bobot?: number;
}

export interface ModulAjarDocument {
  id: string;
  atpDocumentId?: string;
  tanggalDibuat: string;
  
  // RPM Specific Structure
  judulModul?: string; // "RENCANA PEMBELAJARAN MENDALAM" (bisa diinput manual)
  topikMateri?: string; // Topik/Materi spesifik dari TP/ATP
  elemen?: string; // Elemen terpilih
  alokasiWaktuPertemuan?: string; // e.g. "2 x 35 Menit (1 kali pertemuan)"
  jumlahPertemuan?: number;
  totalJP?: number;

  identifikasiRPM?: IdentifikasiPembelajaranRPM;
  desainPembelajaranRPM?: DesainPembelajaranRPM;
  langkahPembelajaranRPM?: LangkahPembelajaranRPMRow[];
  asesmenRPM?: AsesmenPembelajaranRPM;
  rubrikPenilaianRPM?: RubrikPenilaianRPMItem[];
  lkpdRPM?: LKPDDokumenRPM;
  soalEvaluasiRPM?: SoalEvaluasiRPMItem[];

  // Informasi Umum
  identitas: SchoolIdentity & {
    alokasiWaktuModul: string;
    targetPesertaDidik: string;
    modaPembelajaran: string;
  };
  kompetensiAwal: string[];
  profilPelajarPancasila: string[];
  saranaPrasarana: {
    fasilitas: string[];
    lingkunganBelajar: string[];
    mediaAjar: string[];
  };
  modelPembelajaran: string; // misal: Problem Based Learning (PBL), Discovery Learning, PjBL

  // Komponen Inti
  tujuanPembelajaranSpesifik: string[];
  pemahamanBermakna: string[];
  pertanyaanPemantik: string[];
  persiapanPembelajaran: string[];
  kegiatanPembelajaran: PertemuanModul[];
  asesmen: {
    diagnostik: {
      teknik: string;
      daftarPertanyaan: string[];
    };
    formatif: {
      teknik: string;
      deskripsi: string;
      rubrik: RubrikKriteria[];
    };
    sumatif: {
      teknik: string;
      daftarSoal: SoalAsesmen[];
    };
  };
  pengayaanDanRemedial: {
    pengayaan: string;
    remedial: string;
  };
  refleksi: {
    refleksiGuru: string[];
    refleksiSiswa: string[];
  };

  // Lampiran
  lkpd: LKPDItem[];
  bahanBacaanGuruDanSiswa: {
    ringkasanMateri: string;
    materiPengayaanSingkat: string;
  };
  glosarium: GlosariumItem[];
  daftarPustaka: string[];
}

export interface RPMConfigOptions {
  selectedKelas?: string;
  semester?: string;
  selectedTPCodes: string[];
  selectedTPDetails?: TPItem[];
  elemen?: string;
  capaianPembelajaran?: string;
  capaianPembelajaranPerElemen?: {
    elemen: string;
    capaianPembelajaran: string;
    kodeTPList?: string[];
  }[];
  topikMateri: string;
  alokasiWaktu: string;
  jumlahPertemuan?: number;
  totalJP?: number;
  modelPembelajaran: string;
  pendekatanPembelajaran: string;
  metodePembelajaran: string[];
  useMitraInternal: boolean;
  mitraInternal: string[];
  useMitraEksternal: boolean;
  mitraEksternal: string[];
  pemanfaatanPlatform: string[];
  pemanfaatanPerangkat: string[];
  pemanfaatanMedia: string[];
  lingkunganFisik: string[];
  lingkunganFisikDeskripsi?: string;
  budayaBelajar: string[];
  karakteristikMateri?: string;
  karakteristikMurid: string[];
  karakteristikMuridCustom?: string;
  kebutuhanMurid: string;
  dimensiProfilLulusan: string[];
}

export interface SelectedElementItem {
  id: string;
  elemen: string;
  capaianPembelajaran: string;
  deskripsiSingkat?: string;
  isSelected: boolean;
}

export interface PresetCP {
  id: string;
  mataPelajaran: string;
  jenjang: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  elemen: string;
  capaianPembelajaran: string;
  deskripsiSingkat: string;
}

// =========================================================================
// KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
// Berdasarkan Permendikbudristek No. 21 Tahun 2022 & Panduan Pembelajaran dan Asesmen (PPA)
// =========================================================================

export interface KKTPKriteriaDeskripsi {
  kriteria: string;
  memadai: boolean;
  belumMemadai: boolean;
  catatanGuru?: string;
}

export interface KKTPRubrikEviden {
  namaEviden: string;
  baruBerkembang: string; // 1: Belum menunjukkan kemampuan dasar, hasil belum jelas
  layak: string;          // 2: Mampu memenuhi kriteria dasar namun sebagian belum lengkap
  cakap: string;          // 3: Mampu secara mandiri, logis, runtut, dan tepat memenuhi kriteria
  mahir: string;          // 4: Melampaui kriteria, ada fakta pendukung relevan, bernalar kritis
}

export interface KKTPRubrikKualitatif {
  baruBerkembang: string;
  layak: string;
  cakap: string;
  mahir: string;
  // Aliases for compatibility
  perluBimbingan?: string;
  cukup?: string;
  baik?: string;
  sangatBaik?: string;
  kriteriaEviden?: KKTPRubrikEviden[];
  kesimpulanKetuntasan: string; // "Peserta didik dianggap telah mencapai tujuan pembelajaran jika kriteria/bukti kinerja mencapai tahap minimal Cakap atau Mahir."
}

export interface KKTPIntervalNilai {
  interval0_40: string;   // 0 - 40%: Belum mencapai tujuan, intervensi: Remedial di seluruh bagian
  interval41_65: string;  // 41 - 65%: Belum mencapai tujuan, intervensi: Remedial di bagian yang diperlukan
  interval66_85: string;  // 66 - 85%: Sudah mencapai tujuan (KKTP), intervensi: Tidak perlu remedial
  interval86_100: string; // 86 - 100%: Sudah mencapai tujuan, intervensi: Perlu pengayaan atau tantangan lebih
  kesimpulanInterval: string; // "KKTP: Interval 66 - 85% (Sudah Mencapai Tujuan Pembelajaran Tanpa Remedial)"
}

export interface KKTPIntervalDariRubrik {
  kriteriaList: {
    kriteria: string;
    bobotDefault: number; // 1 - 4
  }[];
  skorMaksimal: number; // 16
  skalaBobot: {
    bobot: number;
    keterangan: string; // 1: Belum Muncul, 2: Muncul Sebagian Kecil, 3: Sudah Muncul di Sebagian Besar, 4: Terlihat pada Keseluruhan Teks
  }[];
  contohSimulasi: {
    skorDiperoleh: number;
    nilaiHitung: number;
    kesimpulan: string;
  };
}

export interface KKTPBloomTaxonomy {
  tingkatKKO: string; // Misal: "C4 (Menganalisis)"
  tesBerjenjang: {
    tingkat: string; // C1, C2, C3, C4
    label: string;   // Mengingat, Memahami, Menerapkan, Menganalisis
    deskripsiSoal: string;
  }[];
  kesimpulanKetuntasan: string; // "Siswa yang telah dapat mengerjakan tes sampai soal yang berasal dari C4 maka dikatakan telah mencapai tujuan pembelajaran."
}

export interface KKTPPerencanaanPenilaian {
  tujuanPembelajaran: string;
  indikatorCapaianPerforma: string;
  bentukPenilaian: string;   // Refleksi, Esai, Jurnal, Poster, Tes tertulis, Diskusi Kelas, Produk, Presentasi, Tes lisan, Portofolio, Praktik, Unjuk Kerja
  instrumenPenilaian: string;// Rubrik, Tes tertulis, Catatan Anekdotal, Grafik perkembangan, Observasi, Proyek, Kinerja, Tes lisan
  pendekatanKKTP: string;    // Deskripsi Kriteria, Rubrik, Interval Nilai, Interval Nilai dari Rubrik
  keteranganKetuntasan: string; // Minimal Cakap untuk kedua bukti / Interval 66-85% / Minimal 3 dari 4 kriteria memadai
}

export interface KKTPItem {
  id: string;
  kodeTP: string;
  elemen: string;
  rumusanTP: string;
  lingkupMateri: string;
  indikatorKetercapaian: string; // Indikator Ketercapaian Tujuan Pembelajaran (IKTP) / Eviden Performa
  alokasiJP: number;
  semester: string;
  kelasTarget?: string;
  dimensiP3?: string[];
  
  // Data Lineage (Silsilah Penurunan dari CP dan ATP Final)
  kalimatCP?: string;
  kompetensi?: string;
  sumberAsal?: 'CP_ANALISIS' | 'ATP_FINAL';
  
  // 4 Cara Menetapkan KKTP Resmi Panduan Asesmen Kemendikbudristek
  pendekatanRubrik: KKTPRubrikKualitatif;
  intervalNilai: KKTPIntervalNilai;
  intervalDariRubrik?: KKTPIntervalDariRubrik;
  kriteriaDeskripsi: KKTPKriteriaDeskripsi[];
  bloomTaxonomy?: KKTPBloomTaxonomy;
  perencanaanPenilaian?: KKTPPerencanaanPenilaian;

  teknikAsesmen: string[];
  bentukPenilaian?: string;
  instrumenAsesmen: string;
  tindakLanjutRemedial: string;
  tindakLanjutPengayaan: string;
}

export interface KKTPDocument {
  id: string;
  atpDocumentId?: string;
  tanggalDibuat: string;
  identitas: SchoolIdentity;
  elemen: string;
  capaianPembelajaran: string;
  kktpList: KKTPItem[];
  pendekatanDipilih: 'Semua Pendekatan' | 'Rubrik Kualitatif' | 'Interval Nilai' | 'Deskripsi Kriteria' | 'Interval dari Rubrik';
  catatanPedagogis: string;
  landasanHukum?: {
    permendikbud: string;
    panduanAsesmen: string;
    prinsipUtama: string[];
  };
  panduanPelaksanaanAsesmen: {
    langkahAsesmenFormatif: string[];
    langkahAsesmenSumatif: string[];
    pengolahanNilaiRapor: string;
  };
}

export interface AccessRecord {
  id: string;
  kodeAkses: string; // Selalu diawali "GP-", misal: "GP-RHB1"
  isActive: boolean; // Aktif / Nonaktif oleh pemilik formulir
  status?: 'active' | 'inactive'; // Helper status alias
  isPremiumMaster?: boolean; // Kode master pengembang rahasia
  isDemo?: boolean; // Akun demo resmi (GP-RHB1)
  isPermanent?: boolean; // Akun premium bawaan sistem yang tidak bisa dihapus oleh user, hanya diedit oleh admin
  tanggalDibuat: string;
  tanggalAktivasi?: string;
  
  // Data Guru & Sekolah Terikat (Locked & Anti-Tamper)
  namaGuru: string;
  nipGuru: string;
  jabatan: 'Guru Kelas' | 'Guru Mata Pelajaran';
  namaSekolah: string;
  namaSatuanPendidikan?: string; // Alias untuk namaSekolah
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string; // misal '5 & 6', '5', '6', '3 & 4', dll.
  mataPelajaran?: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  alamatInstansi?: string;
  tempatPenetapan?: string;
  tahunPelajaran?: string;
  semester?: string;
  kopBaris1?: string;
  kopBaris2?: string;
  kopBaris3?: string;
  kopBaris4?: string;
  logoUrl?: string;

  // Metadata pendaftaran
  emailPendaftar?: string;
  nomorHpPendaftar?: string;
  sumberPendaftaran: 'Google Form' | 'Input Langsung' | 'Sistem Bawaan';
  catatanStatus?: string;
  isLockedByAdmin?: boolean; // Dikunci permanen oleh Administrator
  adminLastEditedAt?: string; // Waktu pengeditan terakhir oleh Admin
  adminEditNote?: string;
}

export interface GoogleFormConfig {
  formId?: string;
  formUrl?: string;
  responderUrl?: string;
  title: string;
  lastSyncedAt?: string;
  totalResponses?: number;
}

// =========================================================================
// PROGRAM TAHUNAN (PROTA) & PROGRAM SEMESTER (PROMES)
// Berdasarkan Permendikdasmen No. 13 Tahun 2025 & BSKAP No. 046 Tahun 2025
// =========================================================================

export interface ProtaItem {
  id: string;
  nomor: number;
  kodeTP: string;
  elemen: string;
  lingkupMateri: string;
  tujuanPembelajaran: string;
  alokasiJP: number;
  semester: 'Semester 1' | 'Semester 2' | '1 (Ganjil)' | '2 (Genap)';
  kelasTarget?: string;
  keterangan?: string;
}

export interface ProtaSemesterSummary {
  jpTatapMuka: number;
  jpSumatifLingkupMateri: number;
  jpSumatifAkhirSemester: number;
  jpCadangan: number;
  totalJPSemester: number;
  jumlahMingguEfektif: number;
}

export interface ProtaDocument {
  id: string;
  tanggalDibuat: string;
  identitas: SchoolIdentity;
  totalJPTahun: number;
  alokasiRegulasi: {
    jpMingguIntra: number;
    jpTahunIntra: number;
    jpTahunKoku?: number;
    totalJPTahun: number;
    asumsiMingguTahun: number;
    durasiMenitPerJP: number;
    dasarHukum: string;
  };
  itemsSemester1: ProtaItem[];
  itemsSemester2: ProtaItem[];
  summarySemester1: ProtaSemesterSummary;
  summarySemester2: ProtaSemesterSummary;
  totalJPTahunAkumulasi: number;
  catatanRasional: string;
}

export interface PromesWeekSlot {
  mingguKe: number; // 1 s.d. 5
  isEfektif: boolean;
  keteranganKhusus?: 'MPLS' | 'STS' | 'SAS' | 'SAT' | 'RAPOR' | 'LIBUR' | 'P5' | 'KEGIATAN' | 'TKA' | 'US' | 'FAKULTATIF' | string;
  labelKegiatan?: string;
}

export interface PromesMonthHeader {
  namaBulan: string; // 'Juli', 'Agustus', dll.
  nomorBulan: number;
  weeks: PromesWeekSlot[];
}

export interface PromesRowItem {
  id: string;
  nomor: number;
  elemen: string;
  kodeTP: string;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  alokasiJP: number;
  // Key format: `${namaBulan}_${mingguKe}`
  distribusiMingguan: { [key: string]: number | string };
  keterangan?: string;
}

export interface PromesSemesterData {
  semesterLabel: 'Semester 1 (Ganjil)' | 'Semester 2 (Genap)';
  semesterTipe: '1' | '2';
  bulanList: PromesMonthHeader[];
  rows: PromesRowItem[];
  summary: {
    jpTatapMuka: number;
    jpSumatifLingkupMateri: number;
    jpSumatifAkhir: number;
    jpCadangan: number;
    totalJP: number;
    totalMingguEfektif: number;
    totalMingguNonEfektif: number;
  };
  kegiatanAgendaKhusus: {
    kode: string;
    namaKegiatan: string;
    bulan: string;
    mingguKe: number;
    warnaBadge: string;
  }[];
}

export interface PromesDocument {
  id: string;
  tanggalDibuat: string;
  identitas: SchoolIdentity;
  jpMinggu: number;
  semester1: PromesSemesterData;
  semester2: PromesSemesterData;
  dasarHukum: string;
  catatanPelaksanaan: string;
}

export interface SavedItem {
  id: string;
  type: 'ATP' | 'MODUL' | 'KKTP' | 'PROTA' | 'PROMES' | 'PROMPT_MEDIA' | 'SOAL' | 'TP';
  title: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  tanggal: string;
  atpData?: ATPDocument;
  modulData?: ModulAjarDocument;
  kktpData?: KKTPDocument;
  protaData?: ProtaDocument;
  promesData?: PromesDocument;
  soalData?: KisiKisiSoalDocument;
  tpData?: {
    tpList: TPItem[];
    elemenRows?: BedahElemenRow[];
    rasionalAnalisis?: string;
    identitas?: SchoolIdentity;
  };
}

// Media Prompt Types (Slide Presentasi, Video Pembelajaran 3D, Notebook, Flashcard, Infografis, Peta Konsep/Pikiran & Komik)

export type MediaOutputFormat = 'slide' | 'video' | 'notebook' | 'flashcard' | 'infografis' | 'petakonsep' | 'all';

// Preset Tema Busana & Latar untuk Video Pembelajaran 3D
export type MediaPromptThemeSetting =
  | 'auto' // Otomatis Cerdas Sesuai Mata Pelajaran & Lingkup Materi
  | 'kelas_merah_putih' // Ruang Kelas SD Indonesia (Seragam Merah Putih & Batik Guru)
  | 'pramuka_lengkap' // Kepanduan & Alam Terbuka (Seragam Pramuka Lengkap Indonesia)
  | 'olahraga_lapangan' // Lapangan Olahraga & Kebugaran (Kaos Sporty & Training)
  | 'penjelajah_safari' // Petualangan Alam Bebas (Busana Safari / Explorer Rompi Khaki)
  | 'astronot_antariksa' // Eksplorasi Antariksa & Tata Surya (Baju Astronot Futuristik Edukasi)
  | 'laboratorium_sains' // Laboratorium Sains & Riset Cilik (Jas Lab Putih & Safety Goggles)
  | 'adat_nusantara'; // Kebudayaan Nusantara (Pakaian Adat & Etnik Tradisional)

// Pilihan Mode Kehadiran Tokoh (Bisa 1, 2, atau 3 Tokoh secara Bergantian atau Ditentukan User)
export type MediaPromptCharacterMode =
  | 'dynamic' // Cerdas Bergantian: 1, 2, atau 3 Tokoh sesuai Alur Adegan Edukatif
  | 'trio' // Seluruh 3 Tokoh Lengkap (Pak Roni, Ghea, Jordy di Setiap Adegan)
  | 'solo_pak_roni' // Solo 1 Tokoh: Pak Roni (Guru)
  | 'solo_ghea' // Solo 1 Tokoh: Ghea (Siswi)
  | 'solo_jordy' // Solo 1 Tokoh: Jordy (Siswa)
  | 'duo_students' // Duo 2 Tokoh: Ghea & Jordy (Kolaborasi Murid Sebaya)
  | 'duo_guru_ghea' // Duo 2 Tokoh: Pak Roni & Ghea
  | 'duo_guru_jordy' // Duo 2 Tokoh: Pak Roni & Jordy
  | 'custom'; // Pilihan Kustom Pengguna (Checkbox Bebas)

export interface MediaPromptCharacterCustomSelection {
  pakRoni: boolean;
  ghea: boolean;
  jordy: boolean;
}

export type MediaPromptAspectRatio = 'landscape' | 'portrait';
export type MediaPromptSceneCount = 4 | 6 | 8 | 10 | 12 | 14 | 'auto';

export interface MediaPromptPreferences {
  mediaTypeFilter: MediaOutputFormat;
  selectedStyle: 'pixar' | 'disney' | 'storybook';
  selectedClassFilter?: string;
  themeSetting?: MediaPromptThemeSetting;
  characterMode?: MediaPromptCharacterMode;
  customCharacters?: MediaPromptCharacterCustomSelection;
  aspectRatio?: MediaPromptAspectRatio;
  sceneCount?: MediaPromptSceneCount;
  savedAt?: string;
}

export interface MediaFormatDirectiveInfo {
  id: MediaOutputFormat;
  label: string;
  badge: string;
  description: string;
  targetTools: string[];
  rules: string[];
  pedagogicalFocus: string;
}

// 0. VIDEO PEMBELAJARAN 3D (Aset Karakter Konsisten + Prompt Gambar per Adegan + Prompt Video Animasi & Dialog)
export interface MediaPromptCharacterAsset {
  characterId: 'pak_roni' | 'ghea' | 'jordy' | string;
  name: string;
  role: string;
  age: string;
  physicalTraits: string; // Wajib 100% konsisten untuk seluruh materi
  attire: string; // Disesuaikan dengan tema latar & busana
  promptCharacterAsset: string;
  negativePrompt: string;
}

export interface MediaPromptSceneImage {
  sceneNumber: number;
  sceneTitle: string;
  durationEstimate: string; // e.g. "8 detik"
  mood: string;
  characters: string; // e.g. "Pak Roni, Ghea, Jordy" atau "Solo Ghea", dll
  aspectRatio?: string; // '16:9' atau '9:16'
  relevantAnimation?: string; // Animasi visual 3D / hologram / peraga interaktif yang relevan dengan penjelasan
  promptGambarScene: string;
  negativePrompt: string;
}

export interface MediaPromptSceneVideo {
  sceneNumber: number;
  sceneTitle: string;
  characters: string;
  action: string;
  expression: string;
  secondary: string;
  camera: string;
  dialogue: string;
  relevantAnimation?: string; // Animasi visual 3D / hologram / peraga interaktif yang relevan dengan penjelasan
  timingPacing?: string; // Detail timing: bicara mulai 0.5s, tempo normal & jelas 10-15 kata, transisi akhir 0.5s
  promptVideoScene: string;
  negativePrompt: string;
}

export interface MediaPromptVideo {
  title: string;
  videoTitle?: string;
  totalScenes: number; // Fleksibel: 6, 8, atau 10 Adegan (Default 8 Adegan Edukasi Lengkap)
  targetAudience: string;
  visualStyle: string;
  themeSetting?: MediaPromptThemeSetting;
  themeLabel?: string;
  settingDescription?: string;
  characterMode?: MediaPromptCharacterMode;
  characterModeLabel?: string;
  aspectRatio?: MediaPromptAspectRatio;
  aspectRatioLabel?: string;
  sceneCountPreference?: MediaPromptSceneCount;
  activeCharacterNames?: string[];
  characterAssets: MediaPromptCharacterAsset[];
  sceneImages: MediaPromptSceneImage[];
  sceneVideos: MediaPromptSceneVideo[];
  fullPromptVideoAI: string; // Paket Lengkap 3 Lapisan (Aset Karakter + Prompt Gambar + Prompt Video)
  fullPromptCharactersOnly: string;
  fullPromptSceneImagesOnly: string;
  fullPromptSceneVideosOnly: string;
  pedomanGuruIndo: string;
  recommendedAspectRatio: string; // '16:9 Widescreen' atau '9:16 Portrait Vertikal'
  formatDirectiveSummary?: string;
}

// 1. SLIDE PRESENTASI (Minimal 5 Slide, Maksimal 10 Slide, Bahasa Ramah Anak)
export interface MediaPromptSlideItem {
  slideNumber: number; // 1 s.d. 10
  slideTitle: string; // Misal: "Slide 1: Petualangan Dimulai - Misteri Bilangan Desimal!"
  layoutType: 'title' | 'hook' | 'concept' | 'diagram' | 'example' | 'activity' | 'reflection' | 'summary';
  headline: string; // Kalimat utama ramah anak & memikat
  bulletPoints: string[]; // 2-4 poin ringkas, komunikatif, mudah dipahami anak SD
  visualIllustrationPrompt: string; // Deskripsi visual 3D Pixar anak SD Indonesia berseragam merah-putih
  teacherInteractionGuide: string; // Pertanyaan pemantik guru saat menampilkan slide ini
  keyTakeaway: string; // Pesan kunci yang dipahami anak
}

export interface MediaPromptSlide {
  title: string;
  presentationTitle?: string; // Alias for title
  totalSlides: number; // Minimal 5, maksimal 10 slide (biasanya 8 slide)
  targetAudience: string;
  visualStyle: string;
  slides: MediaPromptSlideItem[];
  fullPromptPresentationAI: string; // Prompt komprehensif untuk Gamma App / Canva Magic Design / PPT AI / Gemini
  pedomanGuruIndo: string;
  recommendedRatio: string; // '16:9 Widescreen'
  formatDirectiveSummary?: string; // Penjelasan aturan spesifik format slide
}

// 2. NOTEBOOK DIGITAL / JURNAL BELAJAR INTERAKTIF (Untuk NotebookLM / Buku Catatan Siswa)
export interface MediaPromptNotebookSection {
  sectionNumber: number;
  sectionTitle: string; // Misal: "Zona Detektif: Pertanyaan Misteri Hari Ini"
  contentType: 'hook' | 'mindmap' | 'did_you_know' | 'mini_challenge' | 'reflection';
  guidedQuestionsOrPrompts: string[];
  summaryDoodleNote: string; // Poin ringkas gaya catatan visual murid
  interactiveActivity: string; // Aktivitas menulis / menggambar di buku catatan
}

export interface MediaPromptNotebook {
  title: string;
  notebookTitle?: string; // Alias for title
  subtitle: string;
  targetAudience: string;
  visualStyle: string;
  notebookSections: MediaPromptNotebookSection[];
  fullPromptNotebookAI: string; // Prompt siap pakai untuk NotebookLM / Google Docs / Canva Worksheet
  pedomanGuruIndo: string;
  recommendedFormat: string; // 'A4 / Binder Notebook Digital'
  formatDirectiveSummary?: string; // Penjelasan aturan spesifik format notebook
}

// 3. FLASHCARD PINTAR (Kartu Tanya-Jawab & Misi Bergambar Bolak-Balik)
export interface MediaPromptFlashcardCard {
  cardNumber: number;
  category: 'Tebak Konsep' | 'Kasus Nyata' | 'Trik Cepat' | 'Tantangan Kritis' | 'Kenali Ciri & Rahasia' | string;
  frontSide: {
    title: string;
    questionOrChallenge: string; // Bahasa ramah anak & memantik rasa penasaran
    visualCue: string; // Ilustrasi 3D Pixar anak SD
    hint: string; // Petunjuk kecil ramah anak
  };
  backSide: {
    answer: string; // Jawaban ramah anak yang tepat & jelas
    simpleExplanation: string; // Alasan logis yang mudah dicerna
    funFactOrMotto: string; // Fakta seru atau jargon penyemangat
  };
}

export interface MediaPromptFlashcard {
  title: string;
  deckTitle?: string; // Alias for title
  totalCards: number; // Misal 6 kartu bolak-balik
  targetAudience: string;
  visualStyle: string;
  cards: MediaPromptFlashcardCard[];
  fullPromptFlashcardAI: string; // Prompt siap pakai untuk Canva Flashcard Maker / Quizlet / Anki
  pedomanGuruIndo: string;
  recommendedSize: string; // '3:2 Kartu Edukasi'
  formatDirectiveSummary?: string; // Penjelasan aturan spesifik format flashcard
}

// 4. INFOGRAFIS EDUKATIF 1 HALAMAN
export interface MediaPromptInfographicSection {
  sectionNumber: number;
  heading: string;
  iconOrVisualElement: string;
  keyPoints: string[];
  didYouKnowOrCallout?: string;
}

export interface MediaPromptInfographic {
  title: string;
  subtitle: string;
  targetAudience: string;
  visualStyle: string;
  centralIllustrationPrompt: string;
  sections: MediaPromptInfographicSection[];
  layoutGuide: string;
  colorPalette: string;
  fullEnglishPrompt: string;
  pedomanGuruIndo: string;
  recommendedAspectRatio: string;
  formatDirectiveSummary?: string; // Penjelasan aturan spesifik format infografis
}

// 5. KOMIK PEMBELAJARAN (Preserved for compatibility)
export interface MediaPromptComicPanel {
  panelNumber: number;
  title: string;
  setting: string;
  characters: string;
  action: string;
  dialogue: string;
  visualCue: string;
}

export interface MediaPromptComic {
  title: string;
  synopsis: string;
  targetAudience: string;
  visualStyle: string; // e.g. "Pixar 3D Animation Style" / "Disney Modern 3D Style"
  characterDesignGuide: string; // Indonesian elementary uniform specifications
  panels: MediaPromptComicPanel[];
  fullEnglishPrompt: string;
  pedomanGuruIndo: string;
  recommendedAspectRatio: string;
}

// 6. PETA KONSEP & PETA PIKIRAN (Mind Map Edukatif Cabang & Hubungan Konsep)
export interface MindMapBranch {
  branchNumber: number;
  branchName: string; // Misal: "1. Pengertian & Konsep Dasar"
  branchColor: string; // Kode warna hex, misal "#3B82F6"
  connectingPhrase: string; // Kata/frasa penghubung ramah anak, misal: "meliputi", "terdiri dari", "contohnya"
  subBranches: string[]; // 2-4 rincian konsep konkret
  visualDoodle: string; // Ikon visual 3D atau doodle konkret
  miniChallenge: string; // Pertanyaan eksplorasi / tantangan siswa
}

export interface MediaPromptMindMap {
  title: string;
  mindMapTitle?: string; // Alias for title
  centralTheme: string; // Topik Pusat / Nodus Utama
  centralVisualMetaphor: string; // Metafora visual pusat (Pohon Pengetahuan, Matahari, Laboratorium Cilik)
  targetAudience: string;
  visualStyle: string;
  layoutStructure: 'Radial / Memusat (Matahari)' | 'Pohon Bertingkat (Hierarkis)' | 'Alur Petualangan (Flow)';
  branches: MindMapBranch[];
  recommendedTools: string[]; // ['GitMind AI', 'Canva Mind Map Maker', 'XMind', 'Miro', 'Whimsical', 'Markmap']
  fullPromptMindMapAI: string; // Prompt komprehensif untuk generator AI (ChatGPT/Claude/Gemini/GitMind/Canva)
  fullMarkdownOutline: string; // Format outline Markdown siap import langsung ke Markmap / GitMind / XMind
  markdownOutline?: string; // alias for fullMarkdownOutline
  pedomanGuruIndo: string;
  recommendedRatio: string; // '16:9 Landscape / A4 Horizontal'
  formatDirectiveSummary?: string;
}

export interface TPMediaPromptItem {
  id: string;
  kodeTP: string;
  rumusanTP: string;
  kompetensi: string;
  lingkupMateri: string;
  elemen?: string;
  kelas: string;
  fase: string;
  mataPelajaran: string;
  slide: MediaPromptSlide;
  video?: MediaPromptVideo;
  notebook: MediaPromptNotebook;
  flashcard: MediaPromptFlashcard;
  infografis: MediaPromptInfographic;
  petakonsep?: MediaPromptMindMap;
  komik?: MediaPromptComic;
  formatSpecificDirectives?: {
    format: MediaOutputFormat;
    summary: string;
    rules: string[];
  };
}

export interface MediaPromptDocument {
  id: string;
  tanggalDibuat: string;
  identitas: SchoolIdentity;
  selectedMataPelajaran: string;
  selectedFase: string;
  selectedKelas: string;
  visualStylePreference: 'pixar' | 'disney' | 'storybook';
  selectedOutputFormat?: MediaOutputFormat;
  formatInstructionApplied?: string;
  items: TPMediaPromptItem[];
}

export type PageOrientation = 'portrait' | 'landscape';
export type PaperSize = 'a4' | 'f4' | 'legal' | 'letter';

export interface PageMargins {
  top: number;    // in mm
  bottom: number; // in mm
  left: number;   // in mm
  right: number;  // in mm
}

export interface PDFLayoutOptions {
  orientation: PageOrientation;
  paperSize: PaperSize;
  margins: PageMargins;
}

// =========================================================================
// KISI-KISI SOAL & NASKAH SOAL ASESMEN KURIKULUM MERDEKA
// Sesuai Panduan Pembelajaran dan Asesmen (PPA) Kemendikdasmen & BSKAP 046/2025
// =========================================================================

export type JenisAsesmenSoal =
  | 'Ulangan Harian'
  | 'Tengah Semester 1'
  | 'Semester 1'
  | 'Tengah Semester 2'
  | 'Semester 2';

export type JenisBentukSoal =
  | 'Pilihan Ganda'
  | 'Menjodohkan'
  | 'Benar / Salah'
  | 'Isian Singkat'
  | 'Uraian';

export type LevelKognitifSoal =
  | 'Level 1' // L1: Mengingat & Memahami (C1 - C2 / LOTS)
  | 'Level 2' // L2: Menerapkan / Aplikasi (C3 / MOTS)
  | 'Level 3'; // L3: Penalaran / HOTS (C4 - C6)

export interface KonfigurasiJenisSoal {
  jenis: JenisBentukSoal;
  enabled: boolean;
  jumlahSoal: number;
  level1Count: number; // L1: Mengingat & Memahami
  level2Count: number; // L2: Menerapkan / Aplikasi
  level3Count: number; // L3: Penalaran / HOTS
  bobotPerSoal: number; // e.g., PG=1 atau 2, Uraian=5
}

export interface KonfigurasiKisiKisiSoal {
  judulDokumen?: string;
  jenisAsesmen: JenisAsesmenSoal;
  mataPelajaran: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  semester: string;
  tahunPelajaran: string;
  alokasiWaktu: string; // e.g. "60 Menit", "90 Menit"
  tanggalPelaksanaan?: string;
  selectedTPCodes: string[]; // Butir TP terpilih
  alokasiSoalPerElemen?: Record<string, number>; // Alokasi kuota jumlah soal per elemen (Multi-elemen)
  konfigurasiSoal: Record<JenisBentukSoal, KonfigurasiJenisSoal>;
}

export interface KisiKisiItemRow {
  nomor: number;
  nomorSoalDisplay: string; // e.g. "1", "2"
  elemen: string;
  capaianPembelajaran: string;
  kodeTP: string;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  indikatorSoal: string; // Rumusan operasional: "Disajikan stimulus berupa..., peserta didik dapat..."
  levelKognitif: LevelKognitifSoal;
  tingkatKKO: string; // e.g. "C1 (Mengingat)", "C3 (Menerapkan)"
  bentukSoal: JenisBentukSoal;
  bobotSkor: number;
}

export interface ButirSoalPilihanGanda {
  nomor: number;
  stimulus?: string;
  pertanyaan: string;
  pilihan: {
    kunci: 'A' | 'B' | 'C' | 'D';
    teks: string;
  }[];
  kunciJawaban: 'A' | 'B' | 'C' | 'D';
  pembahasan: string;
  bobot: number;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
}

export interface ButirSoalMenjodohkanItem {
  nomor: number;
  premis: string; // Kolom A (Pernyataan)
  pasanganKunci: string; // Kunci respon Kolom B
}

export interface ButirSoalMenjodohkanGroup {
  nomorGroup: number;
  instruksi: string; // "Pasangkanlah pernyataan di Kolom A dengan jawaban yang sesuai di Kolom B!"
  daftarPremis: { nomor: number; teks: string }[];
  daftarPilihanRespon: { label: string; teks: string }[];
  kunciJawabanPasangan: { nomorPremis: number; labelRespon: string }[];
  bobotTotal: number;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
}

export interface ButirSoalBenarSalah {
  nomor: number;
  pernyataan: string;
  kunciJawaban: 'Benar' | 'Salah';
  alasanKunci: string;
  bobot: number;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
}

export interface ButirSoalIsianSingkat {
  nomor: number;
  pertanyaan: string; // Pertanyaan langsung atau kalimat rumpang
  kunciJawaban: string;
  alternatifJawaban?: string[];
  bobot: number;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
}

export interface ButirSoalUraian {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  pedomanPenskoran: {
    kriteria: string;
    skorMaks: number;
  }[];
  bobot: number;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
}

export interface NaskahSoalDocument {
  identitas: SchoolIdentity & {
    jenisAsesmen: JenisAsesmenSoal;
    alokasiWaktu: string;
    hariTanggal?: string;
  };
  petunjukUmum: string[];
  soalPilihanGanda: ButirSoalPilihanGanda[];
  soalMenjodohkan: ButirSoalMenjodohkanGroup[];
  soalBenarSalah: ButirSoalBenarSalah[];
  soalIsianSingkat: ButirSoalIsianSingkat[];
  soalUraian: ButirSoalUraian[];
  totalButirSoal: number;
  totalSkorMaksimal: number;
}

export interface PedomanPenskoranItem {
  nomorSoalDisplay: string;
  bentukSoal: JenisBentukSoal;
  kunciJawabanSingkat: string;
  bobotSkor: number;
  pedomanPenskoranLengkap?: string;
  pembahasan?: string;
}

export interface KisiKisiSoalDocument {
  id: string;
  tanggalDibuat: string;
  konfigurasi: KonfigurasiKisiKisiSoal;
  identitas: SchoolIdentity;
  tabelKisiKisi: KisiKisiItemRow[];
  naskahSoal: NaskahSoalDocument;
  pedomanPenskoran: PedomanPenskoranItem[];
  ringkasanDistribusi: {
    totalSoal: number;
    totalSkorMaksimal: number;
    distribusiBentuk: Record<JenisBentukSoal, number>;
    distribusiLevel: Record<LevelKognitifSoal, number>;
  };
}

// ==========================================
// RUANG MURID: CBT, EXAM PACKAGE & SUBMISSION
// ==========================================

export interface ExamPackage {
  id: string;
  kodeAksesGuru: string;
  judul: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  semester: string;
  jenisAsesmen: JenisAsesmenSoal;
  kategori?: string;
  daftarTP: {
    kodeTP: string;
    rumusanTP: string;
    lingkupMateri: string;
    elemen?: string;
  }[];
  tokenUjian?: string;
  durasiMenit: number;
  isActive: boolean; // Aktif = bisa diakses murid di Ruang Ujian
  soalDocument: KisiKisiSoalDocument;
  tipePenyusun?: 'otomatis_tp' | 'guru';
  totalSoal?: number; // Alias helper
  createdAt: string;
  updatedAt?: string;
}

export interface StudentExamAnswer {
  nomorSoalDisplay: string;
  bentukSoal: JenisBentukSoal;
  jawabanSiswa: any; // string for PG/BS/Isian/Uraian, or Record<string, string> for Menjodohkan
  isCorrect?: boolean;
  skorDidapat?: number;
  skorMaksimal?: number;
  kodeTP?: string;
}

export interface ExamSubmission {
  id: string;
  paketId: string;
  packageId?: string; // alias for paketId
  judulPaket: string;
  namaSiswa: string;
  siswaNama?: string; // alias for namaSiswa
  nisn: string;
  siswaNisn?: string; // alias for nisn
  kelas: string;
  mataPelajaran: string;
  mapel?: string; // alias for mataPelajaran
  jenisAsesmen: JenisAsesmenSoal;
  daftarTP: {
    kodeTP: string;
    rumusanTP: string;
    lingkupMateri: string;
  }[];
  jawabanList: StudentExamAnswer[];
  jawabanDetail?: any[];
  skorTotal: number;
  skorMaksimal: number;
  nilaiAkhir: number; // Skala 0 - 100
  score?: number; // alias for nilaiAkhir
  keteranganKKTP: 'Perlu Bimbingan' | 'Cukup' | 'Baik' | 'Sangat Baik';
  predikat?: string;
  submittedAt: string;
  waktuKirim?: string; // alias for submittedAt
  analisisTP?: {
    kodeTP: string;
    rumusanTP: string;
    skorDidapat: number;
    skorMaksimal: number;
    persentase: number;
    isTuntas: boolean;
  }[];
}

export interface StudentReadingMaterial {
  id: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  elemen: string;
  judul: string;
  ringkasanInfografis: string[];
  poinKunci: { judulPoin: string; penjelasan: string; ikon?: string }[];
  glosariumMini: { istilah: string; arti: string }[];
  faktaMenarik: string;
  tipsBelajar: string;
}





export interface StudentInfo {
  id: string;
  nama: string;
  nisn: string;
  nis?: string;
  kelas?: string;
}

export type LearningMediaType = 'pdf' | 'gambar' | 'ppt' | 'video' | 'audio' | 'teks' | 'link';

export interface SubjectFolder {
  id: string;
  name: string;
  subject: string; // Predefined subject e.g. "IPAS (Ilmu Pengetahuan Alam & Sosial)", "Matematika", etc.
  description?: string;
  createdAt: string;
  createdBy?: string;
  color?: string;
  icon?: string;
  itemCount?: number;
}

export interface MaterialSlide {
  slideNumber: number;
  judulSlide: string;
  subjudul?: string;
  poinMateri: string[];
  konsepKunci?: string;
  catatanGuru?: string;
  ilustrasiIkon?: string;
}

export interface LearningMaterialMedia {
  id: string;
  judul: string;
  deskripsi?: string;
  mataPelajaran: string; // "Pendidikan Pancasila", "Bahasa Indonesia", "Matematika", "IPAS", "Seni Budaya", "PJOK", "Bahasa Inggris", "Pendidikan Agama", "Muatan Lokal"
  fase?: string; // Fase A, Fase B, Fase C
  kelas?: string; // 1, 2, 3, 4, 5, 6
  jenisMedia: LearningMediaType;
  fileName: string;
  fileSize?: number; // bytes
  fileType?: string; // MIME type e.g. "application/pdf", "image/png", "video/mp4"
  fileData?: string; // Data URL Base64 (untuk gambar/dokumen/video terkompresi atau cache offline)
  fileUrl?: string; // Tautan video YouTube / Google Drive / URL external
  storageUrl?: string; // Direct Firebase Storage Download URL
  storagePath?: string; // Firebase Storage object path (e.g. materials/IPAS/xxx.pdf)
  downloadUrl?: string; // Direct download URL for students
  folderId?: string; // Subject-specific folder ID
  folderName?: string; // Subject-specific folder name
  uploadedBy?: string; // Nama guru atau kode akses GP
  createdAt: string;
  updatedAt: string;
  isOfflineReady?: boolean; // Disimpan permanen di IndexedDB perangkat murid
  viewsCount?: number;
  durasiVideo?: string;
  halamanPdf?: number;
  ringkasan?: string;
  slides?: MaterialSlide[]; // Untuk bahan ajar berbasis slide presentasi interaktif
}
