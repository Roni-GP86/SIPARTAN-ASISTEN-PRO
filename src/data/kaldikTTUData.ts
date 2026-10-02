/**
 * Kalender Pendidikan Resmi Kabupaten Timor Tengah Utara (TTU)
 * Tahun Ajaran 2026/2027
 * 
 * Dasar Hukum Resmi:
 * Keputusan Kepala Dinas Pendidikan dan Kebudayaan Kabupaten Timor Tengah Utara
 * Nomor: 400.3/36/2026 tentang Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran 2026/2027
 * Ditetapkan di Kefamenanu pada tanggal 20 Juli 2026
 * Kepala Dinas: BEATO YOSEF FR. OMENU, S.STP (Pembina Tk. I, NIP. 198003191999121004)
 */

export interface KaldikEventItem {
  id: string;
  nama: string;
  tanggal: string; // Range string atau single date e.g. "20 - 24 Juli 2026"
  tanggalMulai: string;
  tanggalSelesai: string;
  semester: '1' | '2';
  kategori: 'KEGIATAN_SEKOLAH' | 'ASESMEN' | 'RAPOR' | 'LIBUR_SEKOLAH' | 'LIBUR_NASIONAL' | 'FAKULTATIF';
  keterangan: string;
  badgeWarna: string;
  badgeKode: string;
}

export interface KaldikMonthDetail {
  namaBulan: string;
  tahun: number;
  semester: '1' | '2';
  mingguEfektif: number;
  hariEfektif: number;
  hariEfektifFakultatif?: number;
  mingguLiburUmum: number;
  mingguLiburSemester: number;
  catatanKhusus: string;
}

export const KALDIK_TTU_METADATA = {
  nomorSK: '400.3/36/2026',
  tanggalSK: '20 Juli 2026',
  tentang: 'Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran 2026/2027',
  dinas: 'Dinas Pendidikan dan Kebudayaan Kabupaten Timor Tengah Utara',
  tempatPenetapan: 'Kefamenanu',
  kepalaDinas: {
    nama: 'BEATO YOSEF FR. OMENU, S.STP',
    pangkat: 'Pembina Tk. I',
    nip: '198003191999121004',
  },
  tahunAjaran: '2026/2027',
  standarWaktu: {
    jamMasuk: '07.30 WITA',
    durasiJPSD: 35, // 35 menit per JP tatap muka
    durasiJPSMP: 40, // 40 menit per JP tatap muka
    minimalMingguEfektifSemester: 18,
  },
  rekapitulasiHariEfektif: {
    semester1: {
      mingguKalender: 22,
      mingguEfektif: 18,
      hariEfektifSekolah: 105,
      hariEfektifFakultatif: 1, // Hari Arwah (2 Nov 2026)
    },
    semester2: {
      mingguKalender: 22,
      mingguEfektif: 18,
      hariEfektifSekolah: 108,
      hariEfektifFakultatif: 2, // Rabu Abu (10 Feb) & Persiapan Kamis Putih (25 Mar)
    },
    totalTahunan: {
      mingguKalender: 44,
      mingguEfektif: 36,
      hariEfektifSekolah: 213,
      hariEfektifFakultatif: 3,
      totalHariLibur: 91,
    },
  },
};

export const KALDIK_TTU_MONTHS: KaldikMonthDetail[] = [
  // Semester 1 (2026)
  {
    namaBulan: 'Juli',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 2,
    hariEfektif: 10,
    mingguLiburUmum: 0,
    mingguLiburSemester: 2,
    catatanKhusus: '6-17 Juli Libur Semester 2, 20 Juli Hari Pertama Masuk Sekolah, 20-24 Juli MPLS Ramah',
  },
  {
    namaBulan: 'Agustus',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 4,
    hariEfektif: 18,
    mingguLiburUmum: 2,
    mingguLiburSemester: 0,
    catatanKhusus: '17 Ags: HUT Proklamasi RI ke-81, 25 Ags: Maulid Nabi Muhammad SAW',
  },
  {
    namaBulan: 'September',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 5,
    hariEfektif: 22,
    mingguLiburUmum: 0,
    mingguLiburSemester: 0,
    catatanKhusus: '14 - 18 September 2026: Sumatif Tengah Semester 1 (STS 1)',
  },
  {
    namaBulan: 'Oktober',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 4,
    hariEfektif: 22,
    mingguLiburUmum: 0,
    mingguLiburSemester: 0,
    catatanKhusus: 'Pekan Pembelajaran Intrakurikuler & Penguatan Projek P5',
  },
  {
    namaBulan: 'November',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 4,
    hariEfektif: 20,
    hariEfektifFakultatif: 1,
    mingguLiburUmum: 0,
    mingguLiburSemester: 0,
    catatanKhusus: '2 November 2026: Hari Efektif Fakultatif (Hari Arwah)',
  },
  {
    namaBulan: 'Desember',
    tahun: 2026,
    semester: '1',
    mingguEfektif: 3,
    hariEfektif: 13,
    mingguLiburUmum: 1,
    mingguLiburSemester: 2,
    catatanKhusus: '1-4 Des: SAS 1, 18 Des: Pembagian Rapor Semester 1, 21-31 Des: Libur Semester 1, 25 Des: Natal',
  },

  // Semester 2 (2027)
  {
    namaBulan: 'Januari',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 3,
    hariEfektif: 19,
    mingguLiburUmum: 2,
    mingguLiburSemester: 1,
    catatanKhusus: '1 Jan: Tahun Baru Masehi, 4 Jan: Hari Pertama Masuk Sekolah Sem 2, 5 Jan: Isra Mi\'raj',
  },
  {
    namaBulan: 'Februari',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 4,
    hariEfektif: 19,
    hariEfektifFakultatif: 1,
    mingguLiburUmum: 1,
    mingguLiburSemester: 0,
    catatanKhusus: '6 Feb: Tahun Baru Imlek, 10 Feb: Hari Efektif Fakultatif (Rabu Abu)',
  },
  {
    namaBulan: 'Maret',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 4,
    hariEfektif: 18,
    hariEfektifFakultatif: 1,
    mingguLiburUmum: 4,
    mingguLiburSemester: 0,
    catatanKhusus: '9 Mar: Nyepi, 10-11 Mar: Idul Fitri 1446H, 15-19 Mar: STS 2, 25 Mar: Fakultatif Kamis Putih, 26 Mar: Wafat Isa Al-Masih, 28 Mar: Paskah',
  },
  {
    namaBulan: 'April',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 4,
    hariEfektif: 22,
    mingguLiburUmum: 0,
    mingguLiburSemester: 0,
    catatanKhusus: '5 - 16 April 2027: Perkiraan TKA SMP, 19 - 30 April 2027: Perkiraan TKA SD',
  },
  {
    namaBulan: 'Mei',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 4,
    hariEfektif: 18,
    mingguLiburUmum: 4,
    mingguLiburSemester: 0,
    catatanKhusus: '1 Mei: Buruh, 6 Mei: Kenaikan Yesus Kristus, 10-14 Mei: Ujian Sekolah SD/SMP, 17 Mei: Idul Adha 1446H, 20 Mei: Waisak',
  },
  {
    namaBulan: 'Juni',
    tahun: 2027,
    semester: '2',
    mingguEfektif: 3,
    hariEfektif: 12,
    mingguLiburUmum: 1,
    mingguLiburSemester: 2,
    catatanKhusus: '1 Juni: Lahir Pancasila, 31 Mei & 2-4 Juni: SAS 2/SAT SD/SMP, 6 Juni: Tahun Baru Islam 1449H, 18 Juni: Rapor Sem 2, 21 Juni-9 Juli: Libur Sem 2, 12 Juli: TP 2027/2028',
  },
];

export const KALDIK_TTU_EVENTS: KaldikEventItem[] = [
  // Semester 1
  {
    id: 'e-mpls',
    nama: 'Masa Pengenalan Lingkungan Sekolah (MPLS Ramah)',
    tanggal: '20 - 24 Juli 2026',
    tanggalMulai: '2026-07-20',
    tanggalSelesai: '2026-07-24',
    semester: '1',
    kategori: 'KEGIATAN_SEKOLAH',
    keterangan: 'MPLS Ramah berlangsung 5 hari untuk orientasi, penanaman konsep pengenalan diri, dan budaya sekolah.',
    badgeWarna: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeKode: 'MPLS',
  },
  {
    id: 'e-hut-ri',
    nama: 'Hari Kemerdekaan Republik Indonesia ke-81',
    tanggal: 'Senin, 17 Agustus 2026',
    tanggalMulai: '2026-08-17',
    tanggalSelesai: '2026-08-17',
    semester: '1',
    kategori: 'LIBUR_NASIONAL',
    keterangan: 'Peringatan Hari Proklamasi Kemerdekaan RI.',
    badgeWarna: 'bg-red-50 text-red-700 border-red-200',
    badgeKode: 'HUT-RI',
  },
  {
    id: 'e-maulid',
    nama: 'Maulid Nabi Muhammad SAW',
    tanggal: 'Selasa, 25 Agustus 2026',
    tanggalMulai: '2026-08-25',
    tanggalSelesai: '2026-08-25',
    semester: '1',
    kategori: 'LIBUR_NASIONAL',
    keterangan: 'Libur Hari Raya Keagamaan.',
    badgeWarna: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeKode: 'MAULID',
  },
  {
    id: 'e-sts1',
    nama: 'Sumatif Tengah Semester 1 (STS 1)',
    tanggal: 'Senin - Jumat, 14 - 18 September 2026',
    tanggalMulai: '2026-09-14',
    tanggalSelesai: '2026-09-18',
    semester: '1',
    kategori: 'ASESMEN',
    keterangan: 'Dilaksanakan setelah 7 pekan pembelajaran efektif untuk mengukur capaian beberapa TP atau diisi kegiatan pengembangan bakat dan kreativitas.',
    badgeWarna: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeKode: 'STS 1',
  },
  {
    id: 'e-arwah',
    nama: 'Hari Arwah (Efektif Fakultatif)',
    tanggal: 'Senin, 2 November 2026',
    tanggalMulai: '2026-11-02',
    tanggalSelesai: '2026-11-02',
    semester: '1',
    kategori: 'FAKULTATIF',
    keterangan: 'Hari belajar efektif fakultatif keagamaan khusus di Kabupaten Timor Tengah Utara.',
    badgeWarna: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeKode: 'FAKULTATIF',
  },
  {
    id: 'e-sas1',
    nama: 'Sumatif Akhir Semester 1 (SAS 1)',
    tanggal: 'Selasa - Jumat, 1 - 4 Desember 2026',
    tanggalMulai: '2026-12-01',
    tanggalSelesai: '2026-12-04',
    semester: '1',
    kategori: 'ASESMEN',
    keterangan: 'Asesmen sumatif akhir semester ganjil bagi seluruh jenjang PAUD, SD, dan SMP.',
    badgeWarna: 'bg-rose-50 text-rose-700 border-rose-300',
    badgeKode: 'SAS 1',
  },
  {
    id: 'e-rapor1',
    nama: 'Pembagian Rapor Semester 1',
    tanggal: 'Jumat, 18 Desember 2026',
    tanggalMulai: '2026-12-18',
    tanggalSelesai: '2026-12-18',
    semester: '1',
    kategori: 'RAPOR',
    keterangan: 'Penyerahan Laporan Capaian Hasil Belajar (Lapor) Peserta Didik Semester 1 (Ganjil).',
    badgeWarna: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeKode: 'RAPOR 1',
  },
  {
    id: 'e-libur-sem1',
    nama: 'Libur Akhir Semester 1',
    tanggal: '21 Desember 2026 - 1 Januari 2027',
    tanggalMulai: '2026-12-21',
    tanggalSelesai: '2027-01-01',
    semester: '1',
    kategori: 'LIBUR_SEKOLAH',
    keterangan: 'Libur semester ganjil dan Hari Raya Natal.',
    badgeWarna: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeKode: 'LBR SEM 1',
  },

  // Semester 2
  {
    id: 'e-masuk2',
    nama: 'Hari Pertama Masuk Sekolah Semester 2',
    tanggal: 'Senin, 4 Januari 2027',
    tanggalMulai: '2027-01-04',
    tanggalSelesai: '2027-01-04',
    semester: '2',
    kategori: 'KEGIATAN_SEKOLAH',
    keterangan: 'Awal kegiatan belajar mengajar Semester Genap Tahun Ajaran 2026/2027.',
    badgeWarna: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeKode: 'AWAL SEM 2',
  },
  {
    id: 'e-rabu-abu',
    nama: 'Rabu Abu (Efektif Fakultatif)',
    tanggal: 'Rabu, 10 Februari 2027',
    tanggalMulai: '2027-02-10',
    tanggalSelesai: '2027-02-10',
    semester: '2',
    kategori: 'FAKULTATIF',
    keterangan: 'Hari efektif fakultatif keagamaan peribadatan Rabu Abu.',
    badgeWarna: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeKode: 'RABU ABU',
  },
  {
    id: 'e-sts2',
    nama: 'Sumatif Tengah Semester 2 (STS 2)',
    tanggal: 'Senin - Jumat, 15 - 19 Maret 2027',
    tanggalMulai: '2027-03-15',
    tanggalSelesai: '2027-03-19',
    semester: '2',
    kategori: 'ASESMEN',
    keterangan: 'Asesmen sumatif tengah semester genap jenjang SD dan SMP di Kabupaten TTU.',
    badgeWarna: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeKode: 'STS 2',
  },
  {
    id: 'e-kamis-putih',
    nama: 'Persiapan Kamis Putih & Tri Hari Suci',
    tanggal: '25 - 28 Maret 2027',
    tanggalMulai: '2027-03-25',
    tanggalSelesai: '2027-03-28',
    semester: '2',
    kategori: 'FAKULTATIF',
    keterangan: '25 Maret: Efektif Fakultatif Persiapan Kamis Putih, 26 Maret: Wafat Isa Al-Masih, 28 Maret: Paskah.',
    badgeWarna: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeKode: 'PASKAH',
  },
  {
    id: 'e-tka-sd',
    nama: 'Perkiraan Pelaksanaan TKA SD',
    tanggal: 'Senin - Jumat, 19 - 30 April 2027',
    tanggalMulai: '2027-04-19',
    tanggalSelesai: '2027-04-30',
    semester: '2',
    kategori: 'ASESMEN',
    keterangan: 'Perkiraan pelaksanaan Tes Kemampuan Akademik (TKA) resmi Kemendikdasmen jenjang SD.',
    badgeWarna: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    badgeKode: 'TKA SD',
  },
  {
    id: 'e-us-sd',
    nama: 'Ujian Sekolah (US) Jenjang SD dan SMP',
    tanggal: 'Senin - Jumat, 10 - 14 Mei 2027',
    tanggalMulai: '2027-05-10',
    tanggalSelesai: '2027-05-14',
    semester: '2',
    kategori: 'ASESMEN',
    keterangan: 'Ujian Sekolah utama bagi peserta didik tingkat akhir (Kelas 6 SD & Kelas 9 SMP).',
    badgeWarna: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    badgeKode: 'US SD',
  },
  {
    id: 'e-sas2',
    nama: 'Sumatif Akhir Semester 2 / Sumatif Akhir Tahun (SAT)',
    tanggal: 'Senin, 31 Mei & Rabu - Jumat, 2 - 4 Juni 2027',
    tanggalMulai: '2027-05-31',
    tanggalSelesai: '2027-06-04',
    semester: '2',
    kategori: 'ASESMEN',
    keterangan: 'Penilaian akhir tahun / penentu kenaikan kelas fase peserta didik SD dan SMP.',
    badgeWarna: 'bg-rose-50 text-rose-700 border-rose-300',
    badgeKode: 'SAT / SAS 2',
  },
  {
    id: 'e-rapor2',
    nama: 'Pembagian Rapor Semester 2 (Kenaikan Kelas)',
    tanggal: 'Jumat, 18 Juni 2027',
    tanggalMulai: '2027-06-18',
    tanggalSelesai: '2027-06-18',
    semester: '2',
    kategori: 'RAPOR',
    keterangan: 'Penyerahan Laporan Hasil Belajar akhir tahun ajaran 2026/2027.',
    badgeWarna: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeKode: 'RAPOR 2',
  },
  {
    id: 'e-libur-sem2',
    nama: 'Libur Akhir Tahun Pelajaran',
    tanggal: '21 Juni - 9 Juli 2027',
    tanggalMulai: '2027-06-21',
    tanggalSelesai: '2027-07-09',
    semester: '2',
    kategori: 'LIBUR_SEKOLAH',
    keterangan: 'Libur panjang akhir tahun pelajaran. Awal tahun ajaran baru 2027/2028 dimulai Senin, 12 Juli 2027.',
    badgeWarna: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeKode: 'LBR AKHIR TP',
  },
];
