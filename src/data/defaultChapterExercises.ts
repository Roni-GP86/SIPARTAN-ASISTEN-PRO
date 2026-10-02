import { ExamPackage, KisiKisiSoalDocument, JenisAsesmenSoal, LevelKognitifSoal } from '../types';
import { INITIAL_MATEMATIKA_IDENTITAS } from './initialMatematikaFaseC';

/**
 * Factory helper to build a 100% compliant KisiKisiSoalDocument and ExamPackage
 */
export function createExamPackage(params: {
  id: string;
  judul: string;
  mataPelajaran: string;
  kelas?: string;
  semester?: '1 (Ganjil)' | '2 (Genap)' | 'Ganjil' | 'Genap' | '1 & 2 (1 Tahun Penuh)';
  jenisAsesmen: JenisAsesmenSoal;
  durasiMenit: number;
  daftarTP: {
    kodeTP: string;
    rumusanTP: string;
    lingkupMateri: string;
    elemen?: string;
  }[];
  pgItems: {
    nomor: number;
    stimulus?: string;
    pertanyaan: string;
    pilihan: { kunci: 'A' | 'B' | 'C' | 'D'; teks: string }[];
    kunciJawaban: 'A' | 'B' | 'C' | 'D';
    pembahasan: string;
    kodeTP: string;
    lingkupMateri: string;
    level?: LevelKognitifSoal;
  }[];
  bsItems?: {
    nomor: number;
    pernyataan: string;
    kunciJawaban: 'Benar' | 'Salah';
    alasanKunci: string;
    kodeTP: string;
    lingkupMateri: string;
  }[];
  menjodohkanItems?: {
    nomorGroup: number;
    instruksi: string;
    daftarPremis: { nomor: number; teks: string }[];
    daftarPilihanRespon: { label: string; teks: string }[];
    kunciJawabanPasangan: { nomorPremis: number; labelRespon: string }[];
    kodeTP: string;
    lingkupMateri: string;
  }[];
  isianItems?: {
    nomor: number;
    pertanyaan: string;
    kunciJawaban: string;
    kodeTP: string;
    lingkupMateri: string;
  }[];
  uraianItems?: {
    nomor: number;
    pertanyaan: string;
    kunciJawaban: string;
    pedomanPenskoran?: { kriteria: string; skorMaks: number }[];
    kodeTP: string;
    lingkupMateri: string;
  }[];
}): ExamPackage {
  const {
    id,
    judul,
    mataPelajaran,
    kelas = '5',
    semester = '1 (Ganjil)',
    jenisAsesmen,
    durasiMenit,
    daftarTP,
    pgItems,
    bsItems = [],
    menjodohkanItems = [],
    isianItems = [],
    uraianItems = [],
  } = params;

  const identitas = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran,
    kelas,
    semester,
  };

  const formattedPG = pgItems.map((p) => ({
    nomor: p.nomor,
    stimulus: p.stimulus,
    pertanyaan: p.pertanyaan,
    pilihan: p.pilihan,
    kunciJawaban: p.kunciJawaban,
    pembahasan: p.pembahasan,
    bobot: 1,
    levelKognitif: p.level || 'Level 2',
    kodeTP: p.kodeTP,
    lingkupMateri: p.lingkupMateri,
  }));

  const formattedBS = bsItems.map((b) => ({
    nomor: b.nomor,
    pernyataan: b.pernyataan,
    kunciJawaban: b.kunciJawaban,
    alasanKunci: b.alasanKunci,
    bobot: 1,
    levelKognitif: 'Level 2' as LevelKognitifSoal,
    kodeTP: b.kodeTP,
    lingkupMateri: b.lingkupMateri,
  }));

  const formattedJodoh = menjodohkanItems.map((m) => ({
    nomorGroup: m.nomorGroup,
    instruksi: m.instruksi,
    daftarPremis: m.daftarPremis,
    daftarPilihanRespon: m.daftarPilihanRespon,
    kunciJawabanPasangan: m.kunciJawabanPasangan,
    bobotTotal: m.daftarPremis.length * 1,
    levelKognitif: 'Level 2' as LevelKognitifSoal,
    kodeTP: m.kodeTP,
    lingkupMateri: m.lingkupMateri,
  }));

  const formattedIsian = isianItems.map((i) => ({
    nomor: i.nomor,
    pertanyaan: i.pertanyaan,
    kunciJawaban: i.kunciJawaban,
    bobot: 2,
    levelKognitif: 'Level 2' as LevelKognitifSoal,
    kodeTP: i.kodeTP,
    lingkupMateri: i.lingkupMateri,
  }));

  const formattedUraian = uraianItems.map((u) => ({
    nomor: u.nomor,
    pertanyaan: u.pertanyaan,
    kunciJawaban: u.kunciJawaban,
    pedomanPenskoran: u.pedomanPenskoran || [
      { kriteria: 'Menuliskan langkah dan hasil dengan benar', skorMaks: 5 },
    ],
    bobot: 5,
    levelKognitif: 'Level 3' as LevelKognitifSoal,
    kodeTP: u.kodeTP,
    lingkupMateri: u.lingkupMateri,
  }));

  // Build tabel kisi-kisi
  const tabelKisiKisi: any[] = [];
  let noIndex = 1;

  formattedPG.forEach((p) => {
    tabelKisiKisi.push({
      nomor: noIndex++,
      nomorSoalDisplay: String(p.nomor),
      elemen: daftarTP.find((t) => t.kodeTP === p.kodeTP)?.elemen || 'Elemen Pokok',
      capaianPembelajaran: 'Menguasai capaian pembelajaran Kurikulum Merdeka Fase C',
      kodeTP: p.kodeTP,
      tujuanPembelajaran: daftarTP.find((t) => t.kodeTP === p.kodeTP)?.rumusanTP || p.lingkupMateri,
      lingkupMateri: p.lingkupMateri,
      indikatorSoal: `Disajikan permasalahan ${p.lingkupMateri}, peserta didik dapat menentukan jawaban yang tepat.`,
      levelKognitif: p.levelKognitif,
      tingkatKKO: 'C2 - C4',
      bentukSoal: 'Pilihan Ganda',
      bobotSkor: p.bobot,
    });
  });

  formattedBS.forEach((b) => {
    tabelKisiKisi.push({
      nomor: noIndex++,
      nomorSoalDisplay: `BS-${b.nomor}`,
      elemen: daftarTP.find((t) => t.kodeTP === b.kodeTP)?.elemen || 'Elemen Pokok',
      capaianPembelajaran: 'Menguasai capaian pembelajaran Kurikulum Merdeka Fase C',
      kodeTP: b.kodeTP,
      tujuanPembelajaran: daftarTP.find((t) => t.kodeTP === b.kodeTP)?.rumusanTP || b.lingkupMateri,
      lingkupMateri: b.lingkupMateri,
      indikatorSoal: `Disajikan pernyataan terkait ${b.lingkupMateri}, peserta didik dapat memvalidasi kebenaran konsep.`,
      levelKognitif: b.levelKognitif,
      tingkatKKO: 'C2 - C3',
      bentukSoal: 'Benar / Salah',
      bobotSkor: b.bobot,
    });
  });

  formattedJodoh.forEach((m) => {
    tabelKisiKisi.push({
      nomor: noIndex++,
      nomorSoalDisplay: `Jodoh-${m.nomorGroup}`,
      elemen: daftarTP.find((t) => t.kodeTP === m.kodeTP)?.elemen || 'Elemen Pokok',
      capaianPembelajaran: 'Menguasai capaian pembelajaran Kurikulum Merdeka Fase C',
      kodeTP: m.kodeTP,
      tujuanPembelajaran: daftarTP.find((t) => t.kodeTP === m.kodeTP)?.rumusanTP || m.lingkupMateri,
      lingkupMateri: m.lingkupMateri,
      indikatorSoal: `Disajikan pasangan konsep dan makna tentang ${m.lingkupMateri}, peserta didik dapat menjodohkan dengan benar.`,
      levelKognitif: m.levelKognitif,
      tingkatKKO: 'C2 - C3',
      bentukSoal: 'Menjodohkan',
      bobotSkor: m.bobotTotal,
    });
  });

  formattedIsian.forEach((i) => {
    tabelKisiKisi.push({
      nomor: noIndex++,
      nomorSoalDisplay: `Isian-${i.nomor}`,
      elemen: daftarTP.find((t) => t.kodeTP === i.kodeTP)?.elemen || 'Elemen Pokok',
      capaianPembelajaran: 'Menguasai capaian pembelajaran Kurikulum Merdeka Fase C',
      kodeTP: i.kodeTP,
      tujuanPembelajaran: daftarTP.find((t) => t.kodeTP === i.kodeTP)?.rumusanTP || i.lingkupMateri,
      lingkupMateri: i.lingkupMateri,
      indikatorSoal: `Disajikan kalimat rumpang tentang ${i.lingkupMateri}, peserta didik dapat melengkapi jawaban dengan tepat.`,
      levelKognitif: i.levelKognitif,
      tingkatKKO: 'C2 - C3',
      bentukSoal: 'Isian Singkat',
      bobotSkor: i.bobot,
    });
  });

  formattedUraian.forEach((u) => {
    tabelKisiKisi.push({
      nomor: noIndex++,
      nomorSoalDisplay: `Uraian-${u.nomor}`,
      elemen: daftarTP.find((t) => t.kodeTP === u.kodeTP)?.elemen || 'Elemen Pokok',
      capaianPembelajaran: 'Menguasai capaian pembelajaran Kurikulum Merdeka Fase C',
      kodeTP: u.kodeTP,
      tujuanPembelajaran: daftarTP.find((t) => t.kodeTP === u.kodeTP)?.rumusanTP || u.lingkupMateri,
      lingkupMateri: u.lingkupMateri,
      indikatorSoal: `Disajikan studi kasus kontekstual tentang ${u.lingkupMateri}, peserta didik dapat menguraikan penalaran dan solusi sistematis.`,
      levelKognitif: u.levelKognitif,
      tingkatKKO: 'C4 - C5',
      bentukSoal: 'Uraian',
      bobotSkor: u.bobot,
    });
  });

  // Pedoman penskoran
  const pedomanPenskoran: any[] = [];
  formattedPG.forEach((p) => {
    pedomanPenskoran.push({
      nomorSoalDisplay: String(p.nomor),
      bentukSoal: 'Pilihan Ganda',
      kunciJawabanSingkat: p.kunciJawaban,
      bobotSkor: p.bobot,
    });
  });
  formattedBS.forEach((b) => {
    pedomanPenskoran.push({
      nomorSoalDisplay: String(b.nomor),
      bentukSoal: 'Benar / Salah',
      kunciJawabanSingkat: b.kunciJawaban,
      bobotSkor: b.bobot,
    });
  });
  formattedJodoh.forEach((j) => {
    j.kunciJawabanPasangan.forEach((k) => {
      pedomanPenskoran.push({
        nomorSoalDisplay: `${j.nomorGroup}.${k.nomorPremis}`,
        bentukSoal: 'Menjodohkan',
        kunciJawabanSingkat: k.labelRespon,
        bobotSkor: 1,
      });
    });
  });
  formattedIsian.forEach((i) => {
    pedomanPenskoran.push({
      nomorSoalDisplay: String(i.nomor),
      bentukSoal: 'Isian Singkat',
      kunciJawabanSingkat: i.kunciJawaban,
      bobotSkor: i.bobot,
    });
  });
  formattedUraian.forEach((u) => {
    pedomanPenskoran.push({
      nomorSoalDisplay: String(u.nomor),
      bentukSoal: 'Uraian',
      kunciJawabanSingkat: u.kunciJawaban,
      bobotSkor: u.bobot,
    });
  });

  const totalSoal =
    formattedPG.length +
    formattedBS.length +
    formattedJodoh.reduce((acc, j) => acc + j.daftarPremis.length, 0) +
    formattedIsian.length +
    formattedUraian.length;

  const totalSkorMaksimal =
    formattedPG.reduce((a, b) => a + b.bobot, 0) +
    formattedBS.reduce((a, b) => a + b.bobot, 0) +
    formattedJodoh.reduce((a, b) => a + b.bobotTotal, 0) +
    formattedIsian.reduce((a, b) => a + b.bobot, 0) +
    formattedUraian.reduce((a, b) => a + b.bobot, 0);

  const soalDoc: KisiKisiSoalDocument = {
    id: `doc-${id}`,
    tanggalDibuat: 'Tahun Ajaran 2026/2027',
    konfigurasi: {
      jenisAsesmen,
      mataPelajaran,
      fase: 'Fase C',
      kelas,
      semester,
      tahunPelajaran: '2026/2027',
      alokasiWaktu: '120 Menit',
      selectedTPCodes: daftarTP.map((t) => t.kodeTP),
      konfigurasiSoal: {
        'Pilihan Ganda': {
          jenis: 'Pilihan Ganda',
          enabled: formattedPG.length > 0,
          jumlahSoal: formattedPG.length,
          level1Count: 2,
          level2Count: 4,
          level3Count: 2,
          bobotPerSoal: 1,
        },
        'Menjodohkan': {
          jenis: 'Menjodohkan',
          enabled: formattedJodoh.length > 0,
          jumlahSoal: formattedJodoh.length,
          level1Count: 1,
          level2Count: 1,
          level3Count: 0,
          bobotPerSoal: 1,
        },
        'Benar / Salah': {
          jenis: 'Benar / Salah',
          enabled: formattedBS.length > 0,
          jumlahSoal: formattedBS.length,
          level1Count: 1,
          level2Count: 1,
          level3Count: 0,
          bobotPerSoal: 1,
        },
        'Isian Singkat': {
          jenis: 'Isian Singkat',
          enabled: formattedIsian.length > 0,
          jumlahSoal: formattedIsian.length,
          level1Count: 1,
          level2Count: 1,
          level3Count: 0,
          bobotPerSoal: 2,
        },
        'Uraian': {
          jenis: 'Uraian',
          enabled: formattedUraian.length > 0,
          jumlahSoal: formattedUraian.length,
          level1Count: 0,
          level2Count: 0,
          level3Count: formattedUraian.length,
          bobotPerSoal: 5,
        },
      },
    },
    identitas: {
      ...identitas,
      namaSatuanPendidikan: 'SD Negeri Fatubai',
    },
    tabelKisiKisi,
    naskahSoal: {
      identitas: {
        ...identitas,
        jenisAsesmen,
        alokasiWaktu: `${durasiMenit} Menit`,
        namaSatuanPendidikan: 'SD Negeri Fatubai',
      },
      petunjukUmum: [
        'Berdoalah sebelum memulai mengerjakan soal latihan ini!',
        'Bacalah setiap butir pertanyaan dengan saksama dan teliti.',
        'Pilihlah salah satu jawaban yang paling tepat atau tuliskan jawabanmu pada kotak yang disediakan.',
        'Periksa kembali seluruh jawaban sebelum menekan tombol Kirim Lembar Jawaban.',
      ],
      soalPilihanGanda: formattedPG,
      soalMenjodohkan: formattedJodoh,
      soalBenarSalah: formattedBS,
      soalIsianSingkat: formattedIsian,
      soalUraian: formattedUraian,
      totalButirSoal: totalSoal,
      totalSkorMaksimal,
    },
    pedomanPenskoran,
    ringkasanDistribusi: {
      totalSoal,
      totalSkorMaksimal,
      distribusiBentuk: {
        'Pilihan Ganda': formattedPG.length,
        'Menjodohkan': formattedJodoh.reduce((acc, j) => acc + j.daftarPremis.length, 0),
        'Benar / Salah': formattedBS.length,
        'Isian Singkat': formattedIsian.length,
        'Uraian': formattedUraian.length,
      },
      distribusiLevel: {
        'Level 1': 3,
        'Level 2': 5,
        'Level 3': 2,
      },
    },
  };

  return {
    id,
    kodeAksesGuru: 'FATUBAI-RONI-2025',
    judul,
    mataPelajaran,
    fase: 'Fase C',
    kelas,
    semester,
    jenisAsesmen,
    daftarTP,
    durasiMenit: 120,
    isActive: true,
    soalDocument: soalDoc,
    createdAt: new Date().toISOString(),
  };
}

// =========================================================================
// PAKET SOAL LATIHAN HARIAN / BAB RESMI KURIKULUM MERDEKA SD NEGERI FATUBAI
// Disusun Otomatis Berdasarkan Materi untuk Mencapai Tujuan Pembelajaran (TP)
// =========================================================================

export const DEFAULT_CHAPTER_EXERCISES: ExamPackage[] = [
  // -----------------------------------------------------------------------
  // MATEMATIKA - BAB 1: BILANGAN CACAH S.D 100.000 & NILAI TEMPAT
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-mat-bab-1',
    judul: 'Latihan Bab 1: Bilangan Cacah Sampai 100.000 & Nilai Tempat',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.1',
        rumusanTP: 'Membaca, menulis, menentukan nilai tempat, dan membandingkan bilangan cacah sampai 100.000.',
        lingkupMateri: 'Membaca & Nilai Tempat Bilangan Cacah s.d 100.000',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.2',
        rumusanTP: 'Melakukan dekomposisi bilangan cacah dan menyelesaikan permasalahan nilai mata uang dalam kehidupan sehari-hari.',
        lingkupMateri: 'Dekomposisi Bilangan & Masalah Nilai Uang',
        elemen: 'Bilangan',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Pada lambang bilangan 74.520, angka 7 menempati nilai tempat ....',
        pilihan: [
          { kunci: 'A', teks: 'Ratusan' },
          { kunci: 'B', teks: 'Ribuan' },
          { kunci: 'C', teks: 'Puluh ribuan' },
          { kunci: 'D', teks: 'Ratus ribuan' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Angka 7 berada pada urutan kelima dari kanan, yaitu nilai tempat puluh ribuan (70.000).',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Nilai Tempat Bilangan',
      },
      {
        nomor: 2,
        pertanyaan: 'Bentuk panjang (dekomposisi) dari bilangan 83.250 yang paling tepat adalah ....',
        pilihan: [
          { kunci: 'A', teks: '80.000 + 3.000 + 200 + 50' },
          { kunci: 'B', teks: '8.000 + 300 + 20 + 5' },
          { kunci: 'C', teks: '80.000 + 300 + 250' },
          { kunci: 'D', teks: '800.000 + 30.000 + 200 + 50' },
        ],
        kunciJawaban: 'A',
        pembahasan: '83.250 diuraikan berdasarkan nilai tempatnya menjadi 80.000 + 3.000 + 200 + 50.',
        kodeTP: 'TP-MAT-5.2',
        lingkupMateri: 'Dekomposisi Bilangan',
      },
      {
        nomor: 3,
        stimulus: 'Toko Koperasi SD Fatubai mencatat hasil penjualan buku sebesar Rp48.750, sedangkan Toko Maju mencatat Rp48.570.',
        pertanyaan: 'Tanda perbandingan yang tepat untuk kedua nilai penjualan tersebut adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Rp48.750 < Rp48.570' },
          { kunci: 'B', teks: 'Rp48.750 > Rp48.570' },
          { kunci: 'C', teks: 'Rp48.750 = Rp48.570' },
          { kunci: 'D', teks: 'Rp48.750 ≤ Rp48.500' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Angka ratusan pada 48.750 adalah 7, sedangkan pada 48.570 adalah 5. Karena 7 > 5, maka 48.750 > 48.570.',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Membandingkan Bilangan',
      },
      {
        nomor: 4,
        pertanyaan: 'Urutan bilangan 52.400, 51.900, 53.100, 52.050 dari yang terkecil adalah ....',
        pilihan: [
          { kunci: 'A', teks: '53.100, 52.400, 52.050, 51.900' },
          { kunci: 'B', teks: '51.900, 52.050, 52.400, 53.100' },
          { kunci: 'C', teks: '51.900, 52.400, 52.050, 53.100' },
          { kunci: 'D', teks: '52.050, 51.900, 52.400, 53.100' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Perbandingan nilai terkecil ke terbesar: 51.900 < 52.050 < 52.400 < 53.100.',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Mengurutkan Bilangan',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Bilangan sembilan puluh lima ribu empat ratus ditulis dengan angka 95.400.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Penulisan sembilan puluh lima ribu empat ratus adalah 95.400.',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Membaca & Menulis Bilangan',
      },
      {
        nomor: 2,
        pernyataan: 'Nilai angka 6 pada bilangan 36.820 adalah 600.',
        kunciJawaban: 'Salah',
        alasanKunci: 'Nilai angka 6 berada pada tempat ribuan sehingga bernilai 6.000, bukan 600.',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Nilai Tempat Bilangan',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah lambang bilangan dengan nilai tempat angka yang digarisbawahi!',
        daftarPremis: [
          { nomor: 1, teks: 'Angka 4 pada 42.100' },
          { nomor: 2, teks: 'Angka 8 pada 28.350' },
          { nomor: 3, teks: 'Angka 5 pada 12.530' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Puluh Ribuan (40.000)' },
          { label: 'B', teks: 'Ribuan (8.000)' },
          { label: 'C', teks: 'Ratusan (500)' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Nilai Tempat Bilangan',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Lambang bilangan dari "enam puluh delapan ribu dua ratus lima" adalah ....',
        kunciJawaban: '68.205',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Menulis Bilangan',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Alfonsius membawa uang Rp50.000 ke toko alat tulis di dekat SD Fatubai. Ia membeli buku tulis seharga Rp18.500 dan kotak pensil seharga Rp14.200. Berapakah sisa uang kembalian yang diterima Alfonsius?',
        kunciJawaban: 'Total belanja = Rp18.500 + Rp14.200 = Rp32.700. Sisa kembalian = Rp50.000 - Rp32.700 = Rp17.300.',
        kodeTP: 'TP-MAT-5.2',
        lingkupMateri: 'Masalah Uang Sehari-hari',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // MATEMATIKA - BAB 2: OPERASI HITUNG CAMPURAN & FPB-KPK
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-mat-bab-2',
    judul: 'Latihan Bab 2: Operasi Hitung Campuran, KPK & FPB',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.3',
        rumusanTP: 'Melakukan operasi hitung campuran (penjumlahan, pengurangan, perkalian, dan pembagian) bilangan cacah.',
        lingkupMateri: 'Operasi Hitung Campuran Bilangan Cacah',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.4',
        rumusanTP: 'Menyelesaikan permasalahan kontekstual yang berkaitan dengan Kelipatan Persekutuan Terkecil (KPK) dan Faktor Persekutuan Terbesar (FPB).',
        lingkupMateri: 'Aplikasi KPK dan FPB',
        elemen: 'Bilangan',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Hasil dari perhitungan 1.250 + 750 × 4 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '8.000' },
          { kunci: 'B', teks: '4.250' },
          { kunci: 'C', teks: '5.000' },
          { kunci: 'D', teks: '3.750' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Perkalian dikerjakan terlebih dahulu: 750 × 4 = 3.000. Kemudian dijumlahkan: 1.250 + 3.000 = 4.250.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Operasi Hitung Campuran',
      },
      {
        nomor: 2,
        pertanyaan: 'Hasil dari 5.000 - (1.500 + 1.200) : 3 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '4.100' },
          { kunci: 'B', teks: '1.100' },
          { kunci: 'C', teks: '4.500' },
          { kunci: 'D', teks: '3.900' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Hitung dalam kurung: 1.500 + 1.200 = 2.700. Kemudian pembagian: 2.700 : 3 = 900. Terakhir: 5.000 - 900 = 4.100.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Operasi Hitung Campuran',
      },
      {
        nomor: 3,
        stimulus: 'Ibu guru memiliki 24 buku tulis dan 36 pensil. Barang-barang tersebut akan dibagikan kepada sejumlah murid dengan jumlah yang sama banyak untuk setiap jenis barang.',
        pertanyaan: 'Jumlah murid terbanyak yang dapat menerima paket bantuan tersebut adalah .... (Gunakan FPB)',
        pilihan: [
          { kunci: 'A', teks: '6 murid' },
          { kunci: 'B', teks: '8 murid' },
          { kunci: 'C', teks: '12 murid' },
          { kunci: 'D', teks: '18 murid' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Faktor persekutuan terbesar (FPB) dari 24 dan 36 adalah 12. Jadi paling banyak 12 murid.',
        kodeTP: 'TP-MAT-5.4',
        lingkupMateri: 'FPB Kontekstual',
      },
      {
        nomor: 4,
        pertanyaan: 'Stefanus berlatih memanah setiap 4 hari sekali dan Mario setiap 6 hari sekali. Jika hari ini mereka berlatih bersama, berapa hari lagi mereka akan berlatih bersama kembali?',
        pilihan: [
          { kunci: 'A', teks: '10 hari' },
          { kunci: 'B', teks: '12 hari' },
          { kunci: 'C', teks: '16 hari' },
          { kunci: 'D', teks: '24 hari' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'KPK dari 4 dan 6 adalah 12. Mereka akan berlatih bersama lagi 12 hari kemudian.',
        kodeTP: 'TP-MAT-5.4',
        lingkupMateri: 'KPK Kontekstual',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Pada operasi hitung campuran, operasi perkalian dan pembagian memiliki kedudukan lebih kuat dibanding penjumlahan dan pengurangan.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Sesuai aturan hierarki matematika, operasi kali/bagi selalu didahulukan daripada tambah/kurang.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Hierarki Operasi',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah soal operasi hitung berikut dengan hasil perhitungannya yang tepat!',
        daftarPremis: [
          { nomor: 1, teks: '100 × 5 + 50' },
          { nomor: 2, teks: '500 - 200 : 2' },
          { nomor: 3, teks: 'FPB dari 15 dan 25' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '550' },
          { label: 'B', teks: '400' },
          { label: 'C', teks: '5' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Operasi & FPB',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'KPK dari bilangan 8 dan 12 adalah ....',
        kunciJawaban: '24',
        kodeTP: 'TP-MAT-5.4',
        lingkupMateri: 'KPK',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Pak Guru Darius memiliki 40 buah jeruk dan 60 buah apel. Pak Guru ingin memasukkannya ke dalam keranjang dengan jumlah jeruk dan apel yang sama di setiap keranjang. Berapakah keranjang paling banyak yang dibutuhkan, dan berapa isi tiap keranjang?',
        kunciJawaban: 'Mencari FPB dari 40 dan 60 yaitu 20 keranjang. Setiap keranjang berisi 40:20 = 2 jeruk dan 60:20 = 3 apel.',
        kodeTP: 'TP-MAT-5.4',
        lingkupMateri: 'FPB Pembagian Buah',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // MATEMATIKA - BAB 3: PECAHAN, DESIMAL & PERSEN
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-mat-bab-3',
    judul: 'Latihan Bab 3: Pecahan, Desimal dan Persen',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.5',
        rumusanTP: 'Membandingkan, mengurutkan, dan melakukan operasi penjumlahan dan pengurangan berbagai bentuk pecahan.',
        lingkupMateri: 'Operasi Pecahan Biasa & Campuran',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.6',
        rumusanTP: 'Mengubah bentuk pecahan menjadi desimal dan persen serta menyelesaikan masalah kehidupan sehari-hari.',
        lingkupMateri: 'Desimal dan Persen',
        elemen: 'Bilangan',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Hasil penjumlahan pecahan 2/5 + 1/3 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '3/8' },
          { kunci: 'B', teks: '11/15' },
          { kunci: 'C', teks: '7/15' },
          { kunci: 'D', teks: '3/15' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Samakan penyebut dengan KPK(5, 3) = 15. 2/5 = 6/15, 1/3 = 5/15. Jumlahnya = 6/15 + 5/15 = 11/15.',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Penjumlahan Pecahan',
      },
      {
        nomor: 2,
        pertanyaan: 'Bentuk persen (%) dari pecahan 3/4 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '25%' },
          { kunci: 'B', teks: '50%' },
          { kunci: 'C', teks: '75%' },
          { kunci: 'D', teks: '80%' },
        ],
        kunciJawaban: 'C',
        pembahasan: '3/4 × 100% = 300/4% = 75%.',
        kodeTP: 'TP-MAT-5.6',
        lingkupMateri: 'Pecahan ke Persen',
      },
      {
        nomor: 3,
        pertanyaan: 'Bentuk desimal dari pecahan 1/2 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '0,2' },
          { kunci: 'B', teks: '0,5' },
          { kunci: 'C', teks: '0,25' },
          { kunci: 'D', teks: '0,05' },
        ],
        kunciJawaban: 'B',
        pembahasan: '1 dibagi 2 = 0,5 (atau 5/10).',
        kodeTP: 'TP-MAT-5.6',
        lingkupMateri: 'Pecahan ke Desimal',
      },
      {
        nomor: 4,
        stimulus: 'Maria memiliki pita sepanjang 3/4 meter. Ia menggunakan 1/2 meter untuk menghias kado sahabatnya di kelas 5.',
        pertanyaan: 'Sisa panjang pita Maria sekarang adalah ....',
        pilihan: [
          { kunci: 'A', teks: '1/4 meter' },
          { kunci: 'B', teks: '2/4 meter' },
          { kunci: 'C', teks: '1/2 meter' },
          { kunci: 'D', teks: '1/8 meter' },
        ],
        kunciJawaban: 'A',
        pembahasan: '3/4 - 1/2 = 3/4 - 2/4 = 1/4 meter.',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Pengurangan Pecahan',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Pecahan 4/10 senilai dengan bilangan desimal 0,4.',
        kunciJawaban: 'Benar',
        alasanKunci: '4 dibagi 10 menghasilkan tepat 0,4.',
        kodeTP: 'TP-MAT-5.6',
        lingkupMateri: 'Pecahan Desimal',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah pecahan biasa berikut dengan bentuk desimalnya yang sesuai!',
        daftarPremis: [
          { nomor: 1, teks: '1/4' },
          { nomor: 2, teks: '3/5' },
          { nomor: 3, teks: '7/10' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '0,25' },
          { label: 'B', teks: '0,6' },
          { label: 'C', teks: '0,7' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.6',
        lingkupMateri: 'Desimal',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Nilai dari 0,25 jika diubah menjadi bentuk persen adalah .... %',
        kunciJawaban: '25',
        kodeTP: 'TP-MAT-5.6',
        lingkupMateri: 'Persen',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Yulius membeli 2 1/2 kg beras dan 1 1/4 kg gula pasir di pasar desa. Berapa kilogram total berat belanjaan yang dibawa pulang oleh Yulius?',
        kunciJawaban: '2 1/2 + 1 1/4 = 2 2/4 + 1 1/4 = 3 3/4 kg (atau 3,75 kg).',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Penjumlahan Pecahan Campuran',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // MATEMATIKA - BAB 4: KELILING & LUAS BANGUN DATAR
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-mat-bab-4',
    judul: 'Latihan Bab 4: Keliling dan Luas Bangun Datar',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.7',
        rumusanTP: 'Menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, dan gabungannya).',
        lingkupMateri: 'Keliling & Luas Bangun Datar',
        elemen: 'Pengukuran',
      },
      {
        kodeTP: 'TP-MAT-5.8',
        rumusanTP: 'Menyelesaikan permasalahan kontekstual pengukuran luas pekarangan dan panjang sisi di lingkungan sekitar.',
        lingkupMateri: 'Aplikasi Geometri Bangun Datar',
        elemen: 'Pengukuran',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebuah taman berbentuk persegi panjang memiliki panjang 15 meter dan lebar 8 meter. Luas taman tersebut adalah ....',
        pilihan: [
          { kunci: 'A', teks: '46 m²' },
          { kunci: 'B', teks: '120 m²' },
          { kunci: 'C', teks: '90 m²' },
          { kunci: 'D', teks: '150 m²' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Luas persegi panjang = panjang × lebar = 15 m × 8 m = 120 m².',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Luas Persegi Panjang',
      },
      {
        nomor: 2,
        pertanyaan: 'Sebuah segitiga memiliki panjang alas 10 cm dan tinggi 6 cm. Luas segitiga tersebut adalah ....',
        pilihan: [
          { kunci: 'A', teks: '60 cm²' },
          { kunci: 'B', teks: '30 cm²' },
          { kunci: 'C', teks: '16 cm²' },
          { kunci: 'D', teks: '24 cm²' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Luas segitiga = 1/2 × alas × tinggi = 1/2 × 10 × 6 = 30 cm².',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Luas Segitiga',
      },
      {
        nomor: 3,
        pertanyaan: 'Keliling sebuah persegi yang memiliki panjang sisi 9 cm adalah ....',
        pilihan: [
          { kunci: 'A', teks: '18 cm' },
          { kunci: 'B', teks: '27 cm' },
          { kunci: 'C', teks: '36 cm' },
          { kunci: 'D', teks: '81 cm' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Keliling persegi = 4 × sisi = 4 × 9 cm = 36 cm.',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Keliling Persegi',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Rumus untuk mencari luas bangun segitiga adalah (Alas × Tinggi) : 2.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Benar, luas segitiga adalah setengah dari hasil kali alas dan tinggi.',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Rumus Segitiga',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah nama bangun datar dengan rumus luasnya!',
        daftarPremis: [
          { nomor: 1, teks: 'Persegi' },
          { nomor: 2, teks: 'Persegi Panjang' },
          { nomor: 3, teks: 'Segitiga' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Sisi × Sisi' },
          { label: 'B', teks: 'Panjang × Lebar' },
          { label: 'C', teks: '(Alas × Tinggi) / 2' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Rumus Bangun Datar',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Keliling lapangan bola voli berukuran panjang 18 m dan lebar 9 m adalah .... meter.',
        kunciJawaban: '54',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Keliling',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Kebun sekolah SD Fatubai berbentuk persegi panjang dengan panjang 20 meter dan lebar 12 meter. Di sekeliling kebun tersebut akan dipasang pagar kawat. Berapakah panjang kawat yang dibutuhkan untuk mengelilingi seluruh kebun?',
        kunciJawaban: 'Keliling = 2 × (panjang + lebar) = 2 × (20 m + 12 m) = 2 × 32 m = 64 meter kawat.',
        kodeTP: 'TP-MAT-5.8',
        lingkupMateri: 'Keliling Persegi Panjang Kontekstual',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // IPAS - BAB 1: CAHAYA DAN SIFAT-SIFATNYA SERTA PENGLIHATAN
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-ipas-bab-1',
    judul: 'Latihan Bab 1: Cahaya dan Sifat-Sifatnya serta Indra Penglihatan',
    mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-IPAS-5.1',
        rumusanTP: 'Menyelidiki sifat-sifat cahaya (merambat lurus, menembus benda bening, memantul, membias, dan terurai) melalui percobaan sederhana.',
        lingkupMateri: 'Sifat-Sifat Cahaya',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-5.2',
        rumusanTP: 'Menganalisis cara kerja indra penglihatan mata manusia dan kaitannya dengan pemantulan cahaya.',
        lingkupMateri: 'Indra Penglihatan & Cara Kerja Mata',
        elemen: 'Pemahaman IPAS',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Peristiwa terbentuknya pelangi di langit setelah hujan membuktikan bahwa cahaya memiliki sifat ....',
        pilihan: [
          { kunci: 'A', teks: 'Merambat lurus' },
          { kunci: 'B', teks: 'Dapat menembus benda gelap' },
          { kunci: 'C', teks: 'Dapat diuraikan (dispersi)' },
          { kunci: 'D', teks: 'Menghilang di udara' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Cahaya putih matahari diuraikan oleh tetesan air hujan menjadi spektrum warna pelangi (dispersi cahaya).',
        kodeTP: 'TP-IPAS-5.1',
        lingkupMateri: 'Sifat Cahaya Diuraikan',
      },
      {
        nomor: 2,
        stimulus: 'Febrianus meletakkan sebatang pensil di dalam gelas transparan yang berisi air bening. Dari samping, pensil terlihat seolah-olah patah.',
        pertanyaan: 'Peristiwa tersebut terjadi karena sifat cahaya, yaitu ....',
        pilihan: [
          { kunci: 'A', teks: 'Cahaya merambat lurus' },
          { kunci: 'B', teks: 'Cahaya dibiaskan (pembiasan)' },
          { kunci: 'C', teks: 'Cahaya dipantulkan sempurna' },
          { kunci: 'D', teks: 'Cahaya diserap oleh air' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pembiasan cahaya terjadi karena cahaya merambat melalui dua zat yang berbeda kerapatan optiknya (udara dan air).',
        kodeTP: 'TP-IPAS-5.1',
        lingkupMateri: 'Pembiasan Cahaya',
      },
      {
        nomor: 3,
        pertanyaan: 'Bagian mata yang berfungsi mengatur banyak sedikitnya cahaya yang masuk ke dalam bola mata adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Kornea' },
          { kunci: 'B', teks: 'Pupil' },
          { kunci: 'C', teks: 'Retina' },
          { kunci: 'D', teks: 'Saraf optik' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pupil akan mengecil saat cahaya terang dan membesar saat cahaya redup untuk mengatur intensitas cahaya.',
        kodeTP: 'TP-IPAS-5.2',
        lingkupMateri: 'Fungsi Bagian Mata',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Cahaya dapat menembus benda bening seperti kaca jendela dan air jernih.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Benda bening dapat meneruskan hampir seluruh berkas cahaya yang mengenainya.',
        kodeTP: 'TP-IPAS-5.1',
        lingkupMateri: 'Benda Bening',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah bagian mata berikut dengan fungsinya yang benar!',
        daftarPremis: [
          { nomor: 1, teks: 'Kornea' },
          { nomor: 2, teks: 'Retina' },
          { nomor: 3, teks: 'Lensa Mata' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Melindungi bagian dalam mata dan meneruskan cahaya' },
          { label: 'B', teks: 'Tempat terbentuknya bayangan benda' },
          { label: 'C', teks: 'Memfokuskan berkas cahaya agar jatuh tepat di retina' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-IPAS-5.2',
        lingkupMateri: 'Struktur Mata',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Cermin yang digunakan pada spion kendaraan bermotor agar pandangan pengemudi lebih luas adalah cermin ....',
        kunciJawaban: 'cembung',
        kodeTP: 'TP-IPAS-5.1',
        lingkupMateri: 'Pemantulan Cermin',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Jelaskan bagaimana proses mata manusia dapat melihat benda-benda di sekitarnya!',
        kunciJawaban: 'Cahaya dari sumber cahaya mengenai benda, lalu dipantulkan ke mata. Cahaya masuk melalui kornea, melewati pupil, dibiaskan lensa mata hingga jatuh di retina, lalu sinyal dikirim oleh saraf mata ke otak untuk diterjemahkan.',
        kodeTP: 'TP-IPAS-5.2',
        lingkupMateri: 'Mekanisme Penglihatan',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // IPAS - BAB 2: HARMONI DALAM EKOSISTEM & JARING MAKANAN
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-ipas-bab-2',
    judul: 'Latihan Bab 2: Harmoni dalam Ekosistem & Jaring Makanan',
    mataPelajaran: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-IPAS-5.3',
        rumusanTP: 'Menganalisis hubungan antarmakhluk hidup dalam bentuk rantai makanan dan jaring-jaring makanan di suatu ekosistem.',
        lingkupMateri: 'Rantai & Jaring-Jaring Makanan',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-5.4',
        rumusanTP: 'Mengevaluasi dampak ketidakseimbangan ekosistem akibat ulah manusia dan merumuskan upaya pelestariannya.',
        lingkupMateri: 'Keseimbangan Ekosistem & Konservasi',
        elemen: 'Pemahaman IPAS',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Dalam sebuah rantai makanan di sawah: Padi → Belalang → Katak → Ular → Elang. Makhluk hidup yang berperan sebagai konsumen tingkat II adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Padi' },
          { kunci: 'B', teks: 'Belalang' },
          { kunci: 'C', teks: 'Katak' },
          { kunci: 'D', teks: 'Ular' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Padi (produsen) dimakan Belalang (konsumen I), Belalang dimakan Katak (konsumen II).',
        kodeTP: 'TP-IPAS-5.3',
        lingkupMateri: 'Rantai Makanan',
      },
      {
        nomor: 2,
        pertanyaan: 'Organisme yang berperan menguraikan sisa-sisa makhluk hidup yang telah mati menjadi zat hara bagi tanah adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Produsen' },
          { kunci: 'B', teks: 'Herbivor' },
          { kunci: 'C', teks: 'Pengurai (Dekomposer)' },
          { kunci: 'D', teks: 'Karnivor puncak' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Pengurai (seperti jamur dan bakteri pengurai) menguraikan zat organik menjadi mineral tanah untuk diserap kembali oleh tumbuhan.',
        kodeTP: 'TP-IPAS-5.3',
        lingkupMateri: 'Peran Dekomposer',
      },
      {
        nomor: 3,
        pertanyaan: 'Jika populasi ular di sawah diburu secara besar-besaran oleh manusia, dampak langsung yang akan terjadi pada ekosistem adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Populasi tikus dan katak meningkat pesat sehingga merusak tanaman padi' },
          { kunci: 'B', teks: 'Hasil panen padi semakin berlimpah' },
          { kunci: 'C', teks: 'Populasi elang bertambah banyak' },
          { kunci: 'D', teks: 'Air sawah menjadi kering' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Karena ular adalah predator tikus dan katak, hilangnya ular membuat hama tikus berkembang biak tanpa kendali dan merusak panen padi.',
        kodeTP: 'TP-IPAS-5.4',
        lingkupMateri: 'Dampak Perubahan Ekosistem',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Tumbuhan hijau disebut sebagai produsen karena dapat membuat makanannya sendiri melalui proses fotosintesis.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Tumbuhan menghasilkan energi kimia mandiri melalui fotosintesis menggunakan sinar matahari, air, dan CO2.',
        kodeTP: 'TP-IPAS-5.3',
        lingkupMateri: 'Produsen',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah jenis hewan dengan peran makanannya di ekosistem!',
        daftarPremis: [
          { nomor: 1, teks: 'Sapi dan Kambing' },
          { nomor: 2, teks: 'Harimau dan Elang' },
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
        kodeTP: 'TP-IPAS-5.3',
        lingkupMateri: 'Klasifikasi Hewan',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Kumpulan dari beberapa rantai makanan yang saling berhubungan di suatu ekosistem dinamakan .... makanan.',
        kunciJawaban: 'jaring-jaring',
        kodeTP: 'TP-IPAS-5.3',
        lingkupMateri: 'Jaring-jaring Makanan',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebutkan 3 tindakan nyata yang dapat dilakukan oleh murid SD Negeri Fatubai untuk menjaga kelestarian lingkungan dan keanekaragaman makhluk hidup di sekitar sekolah!',
        kunciJawaban: '1. Tidak membuang sampah sembarangan (memilah sampah), 2. Menanam pohon atau merawat tanaman di taman sekolah, 3. Tidak merusak atau memburu sarang burung dan serangga bermanfaat.',
        kodeTP: 'TP-IPAS-5.4',
        lingkupMateri: 'Upaya Pelestarian',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // BAHASA INDONESIA - BAB 1: IDE POKOK & INFORMASI TEKS BACAAN
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-indo-bab-1',
    judul: 'Latihan Bab 1: Menemukan Ide Pokok dan Informasi Teks Bacaan',
    mataPelajaran: 'Bahasa Indonesia',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-INDO-5.1',
        rumusanTP: 'Menemukan ide pokok dan kalimat penjelas dalam teks narasi dan deskripsi yang dibaca.',
        lingkupMateri: 'Ide Pokok & Kalimat Utama',
        elemen: 'Membaca dan Memirsa',
      },
      {
        kodeTP: 'TP-INDO-5.2',
        rumusanTP: 'Membedakan informasi berupa fakta dan opini serta menyimpulkan pesan tersurat dan tersirat dalam teks.',
        lingkupMateri: 'Fakta, Opini & Simpulan Teks',
        elemen: 'Membaca dan Memirsa',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        stimulus: 'Hutan mangrove memiliki peran yang sangat penting bagi wilayah pesisir pantai. Hutan ini dapat mencegah abrasi atau pengikisan pantai oleh gelombang ombak laut. Selain itu, akar pohon bakau menjadi tempat hidup dan berkembang biak bagi berbagai jenis ikan kecil dan kepiting.',
        pertanyaan: 'Ide pokok dari paragraf bacaan di atas adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Cara menanam pohon bakau di pesisir pantai' },
          { kunci: 'B', teks: 'Peran dan manfaat penting hutan mangrove bagi pesisir' },
          { kunci: 'C', teks: 'Jenis ikan dan kepiting yang ada di laut' },
          { kunci: 'D', teks: 'Penyebab terjadinya gelombang ombak laut' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Kalimat utama ada di awal paragraf yang menyatakan peran penting hutan mangrove, dijelaskan dengan fungsi penahan abrasi dan habitat ikan.',
        kodeTP: 'TP-INDO-5.1',
        lingkupMateri: 'Ide Pokok Paragraf',
      },
      {
        nomor: 2,
        pertanyaan: 'Kalimat di bawah ini yang merupakan contoh kalimat FAKTA adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Pantai di Pulau Timor adalah tempat wisata paling indah di dunia.' },
          { kunci: 'B', teks: 'SD Negeri Fatubai terletak di Kabupaten Timor Tengah Utara (TTU).' },
          { kunci: 'C', teks: 'Menurut saya, pelajaran matematika jauh lebih mudah daripada IPA.' },
          { kunci: 'D', teks: 'Mungkin besok sore hujan lebat akan turun membasahi lapangan.' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pernyataan B merupakan fakta nyata yang dapat dibuktikan kebenarannya, sedangkan A, C, dan D memuat opini/pendapat pribadi.',
        kodeTP: 'TP-INDO-5.2',
        lingkupMateri: 'Membedakan Fakta dan Opini',
      },
      {
        nomor: 3,
        pertanyaan: 'Paragraf yang kalimat utamanya terletak di akhir paragraf disebut paragraf ....',
        pilihan: [
          { kunci: 'A', teks: 'Deduktif' },
          { kunci: 'B', teks: 'Induktif' },
          { kunci: 'C', teks: 'Campuran' },
          { kunci: 'D', teks: 'Naratif' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Paragraf induktif menyajikan kalimat penjelas terlebih dahulu lalu ditutup oleh kalimat utama di akhir paragraf.',
        kodeTP: 'TP-INDO-5.1',
        lingkupMateri: 'Jenis Paragraf',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Kalimat penjelas berfungsi untuk mendukung, memperjelas, dan menguraikan ide pokok pada kalimat utama.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Kalimat penjelas memuat data, contoh, dan rincian penunjang kalimat utama.',
        kodeTP: 'TP-INDO-5.1',
        lingkupMateri: 'Fungsi Kalimat Penjelas',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah istilah kebahasaan berikut dengan artinya yang tepat!',
        daftarPremis: [
          { nomor: 1, teks: 'Ide Pokok' },
          { nomor: 2, teks: 'Fakta' },
          { nomor: 3, teks: 'Opini' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Gagasan utama yang menjadi dasar pengembangan sebuah paragraf' },
          { label: 'B', teks: 'Hal atau peristiwa yang benar-benar terjadi dan dapat dibuktikan' },
          { label: 'C', teks: 'Pendapat atau pandangan seseorang yang belum tentu disepakati semua orang' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-INDO-5.2',
        lingkupMateri: 'Istilah Bahasa',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Paragraf yang letak kalimat utamanya berada di awal paragraf disebut paragraf ....',
        kunciJawaban: 'deduktif',
        kodeTP: 'TP-INDO-5.1',
        lingkupMateri: 'Paragraf Deduktif',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Tuliskan satu paragraf pendek (3-4 kalimat) yang bertemakan "Semangat Belajar di SD Negeri Fatubai", lalu tentukan manakah kalimat utamanya!',
        kunciJawaban: 'Contoh: Setiap pagi, murid-murid SD Negeri Fatubai datang ke sekolah dengan penuh semangat. Mereka menyapa guru dengan senyum ramah sebelum masuk ke kelas. Di dalam kelas, mereka rajin membaca buku dan menyelesaikan latihan soal. (Kalimat utama: Setiap pagi, murid-murid SD Negeri Fatubai datang ke sekolah dengan penuh semangat).',
        kodeTP: 'TP-INDO-5.1',
        lingkupMateri: 'Menulis Paragraf',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // PENDIDIKAN PANCASILA - BAB 1: PENERAPAN NILAI PANCASILA
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-pancasila-bab-1',
    judul: 'Latihan Bab 1: Penerapan Nilai-Nilai Pancasila dalam Kehidupan',
    mataPelajaran: 'Pendidikan Pancasila',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-PAN-5.1',
        rumusanTP: 'Menjelaskan makna dan contoh penerapan sila pertama sampai kelima Pancasila dalam kehidupan sehari-hari.',
        lingkupMateri: 'Penerapan Nilai-Nilai Pancasila',
        elemen: 'Pancasila',
      },
      {
        kodeTP: 'TP-PAN-5.2',
        rumusanTP: 'Membiasakan sikap gotong royong, toleransi, dan musyawarah mufakat di lingkungan keluarga, sekolah, dan masyarakat.',
        lingkupMateri: 'Gotong Royong & Musyawarah',
        elemen: 'Bhinneka Tunggal Ika',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Memberikan kesempatan kepada teman yang berbeda agama untuk beribadah sesuai keyakinannya merupakan wujud pengamalan Pancasila sila ke ....',
        pilihan: [
          { kunci: 'A', teks: 'Pertama (Ketuhanan Yang Maha Esa)' },
          { kunci: 'B', teks: 'Kedua (Kemanusiaan yang Adil dan Beradab)' },
          { kunci: 'C', teks: 'Ketiga (Persatuan Indonesia)' },
          { kunci: 'D', teks: 'Kelima (Keadilan Sosial bagi Seluruh Rakyat Indonesia)' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Sila pertama menekankan kebebasan beragama dan saling menghormati antarumat beragama.',
        kodeTP: 'TP-PAN-5.1',
        lingkupMateri: 'Pengamalan Sila 1',
      },
      {
        nomor: 2,
        pertanyaan: 'Ketika memilih ketua kelas di kelas 5 SD Fatubai, keputusan diambil melalui musyawarah bersama seluruh murid. Hal ini mencerminkan pengamalan sila ke ....',
        pilihan: [
          { kunci: 'A', teks: 'Kedua' },
          { kunci: 'B', teks: 'Ketiga' },
          { kunci: 'C', teks: 'Keempat' },
          { kunci: 'D', teks: 'Kelima' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Sila keempat menekankan musyawarah untuk mufakat dalam pengambilan keputusan bersama.',
        kodeTP: 'TP-PAN-5.1',
        lingkupMateri: 'Pengamalan Sila 4',
      },
      {
        nomor: 3,
        pertanyaan: 'Sikap gotong royong membersihkan pekarangan sekolah tanpa membeda-bedakan asal suku dan agama mencerminkan nilai sila ....',
        pilihan: [
          { kunci: 'A', teks: 'Pertama' },
          { kunci: 'B', teks: 'Kedua' },
          { kunci: 'C', teks: 'Ketiga (Persatuan Indonesia)' },
          { kunci: 'D', teks: 'Keempat' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Gotong royong memupuk persatuan dan kerukunan bangsa sesuai sila ke-3.',
        kodeTP: 'TP-PAN-5.2',
        lingkupMateri: 'Persatuan & Gotong Royong',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Pancasila berkedudukan sebagai dasar negara dan pandangan hidup bangsa Indonesia.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Pancasila adalah falsafah dasar dan landasan ideologi seluruh bangsa Indonesia.',
        kodeTP: 'TP-PAN-5.1',
        lingkupMateri: 'Kedudukan Pancasila',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah sila Pancasila dengan simbol lambang negaranya yang tepat!',
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
        kodeTP: 'TP-PAN-5.1',
        lingkupMateri: 'Simbol Sila Pancasila',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Semboyan persatuan bangsa Indonesia yang bermakna "Berbeda-beda tetapi tetap satu jua" adalah ....',
        kunciJawaban: 'bhinneka tunggal ika',
        kodeTP: 'TP-PAN-5.2',
        lingkupMateri: 'Semboyan Negara',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebutkan 3 contoh perbuatan adil dan saling menghormati yang dapat kamu lakukan kepada teman-temanmu di lingkungan SD Negeri Fatubai!',
        kunciJawaban: '1. Tidak mengejek teman yang sedang kesulitan belajar, 2. Mau berteman dan bermain dengan siapa saja tanpa membedakan suku/agama, 3. Membagi tugas piket kelas secara merata dan jujur.',
        kodeTP: 'TP-PAN-5.1',
        lingkupMateri: 'Penerapan di Sekolah',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // UJIAN RESMI: SUMATIF TENGAH SEMESTER (STS) MATEMATIKA KELAS 5
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'sts-mat-5-sem-1',
    judul: 'Asesmen Sumatif Tengah Semester (STS) Matematika Kelas 5',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Tengah Semester 1',
    durasiMenit: 60,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.1',
        rumusanTP: 'Membaca, menulis, menentukan nilai tempat, dan membandingkan bilangan cacah sampai 100.000.',
        lingkupMateri: 'Bilangan Cacah s.d 100.000',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.3',
        rumusanTP: 'Melakukan operasi hitung campuran bilangan cacah sampai 100.000 dan menyelesaikan masalah KPK/FPB.',
        lingkupMateri: 'Operasi Campuran & KPK-FPB',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.5',
        rumusanTP: 'Melakukan operasi pecahan dan mengubah ke bentuk desimal serta persen.',
        lingkupMateri: 'Pecahan, Desimal & Persen',
        elemen: 'Bilangan',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Nilai angka 5 pada bilangan 65.420 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '50.000' },
          { kunci: 'B', teks: '5.000' },
          { kunci: 'C', teks: '500' },
          { kunci: 'D', teks: '50' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Angka 5 menempati nilai tempat ribuan (5.000).',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Nilai Tempat',
      },
      {
        nomor: 2,
        pertanyaan: 'Hasil dari 2.500 + 1.500 : 50 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '80' },
          { kunci: 'B', teks: '2.530' },
          { kunci: 'C', teks: '2.503' },
          { kunci: 'D', teks: '2.800' },
        ],
        kunciJawaban: 'B',
        pembahasan: '1.500 : 50 = 30. Lalu 2.500 + 30 = 2.530.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Operasi Campuran',
      },
      {
        nomor: 3,
        pertanyaan: 'Bentuk persen dari pecahan 1/4 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '10%' },
          { kunci: 'B', teks: '20%' },
          { kunci: 'C', teks: '25%' },
          { kunci: 'D', teks: '40%' },
        ],
        kunciJawaban: 'C',
        pembahasan: '1/4 × 100% = 25%.',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Persen',
      },
      {
        nomor: 4,
        pertanyaan: 'FPB dari 18 dan 24 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '3' },
          { kunci: 'B', teks: '6' },
          { kunci: 'C', teks: '12' },
          { kunci: 'D', teks: '72' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Faktor 18 = 1,2,3,6,9,18. Faktor 24 = 1,2,3,4,6,8,12,24. FPB = 6.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'FPB',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: '0,75 senilai dengan pecahan 3/4 dan 75%.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Benar, 3/4 = 0,75 = 75/100 = 75%.',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Pecahan Senilai',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah operasi hitung berikut dengan hasil yang sesuai!',
        daftarPremis: [
          { nomor: 1, teks: '1/2 + 1/4' },
          { nomor: 2, teks: '10.000 - 4.500' },
          { nomor: 3, teks: 'KPK dari 3 dan 5' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '3/4' },
          { label: 'B', teks: '5.500' },
          { label: 'C', teks: '15' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'Campuran STS',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Hasil dari 4/5 - 1/5 adalah .... (tulis pecahan a/b)',
        kunciJawaban: '3/5',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Pecahan',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Di perpustakaan SD Fatubai terdapat 45 buku cerita dan 60 buku ensiklopedia. Buku-buku tersebut akan disusun rapi ke dalam beberapa rak buku sehingga setiap rak memiliki jumlah buku cerita dan buku ensiklopedia yang sama. Berapa rak paling banyak yang dibutuhkan?',
        kunciJawaban: 'Mencari FPB dari 45 dan 60. Faktor 45 = 1,3,5,9,15,45. Faktor 60 = 1,2,3,4,5,6,10,12,15,20,30,60. FPB = 15. Maka paling banyak dibutuhkan 15 rak buku.',
        kodeTP: 'TP-MAT-5.3',
        lingkupMateri: 'FPB Rak Buku',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // UJIAN RESMI: SUMATIF AKHIR SEMESTER (SAS) MATEMATIKA KELAS 5
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'sas-mat-5-sem-1',
    judul: 'Asesmen Sumatif Akhir Semester (SAS / PAS) Matematika Kelas 5',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Semester 1',
    durasiMenit: 60,
    daftarTP: [
      {
        kodeTP: 'TP-MAT-5.1',
        rumusanTP: 'Menyelesaikan permasalahan bilangan cacah s.d 100.000, FPB, dan KPK.',
        lingkupMateri: 'Bilangan & KPK-FPB',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.5',
        rumusanTP: 'Melakukan operasi penjumlahan, pengurangan pecahan, desimal, dan persen.',
        lingkupMateri: 'Pecahan, Desimal & Persen',
        elemen: 'Bilangan',
      },
      {
        kodeTP: 'TP-MAT-5.7',
        rumusanTP: 'Menghitung keliling dan luas bangun datar (persegi, persegi panjang, segitiga).',
        lingkupMateri: 'Keliling & Luas Bangun Datar',
        elemen: 'Pengukuran',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Hasil dari (25.000 + 15.000) : 50 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '800' },
          { kunci: 'B', teks: '600' },
          { kunci: 'C', teks: '500' },
          { kunci: 'D', teks: '400' },
        ],
        kunciJawaban: 'A',
        pembahasan: '25.000 + 15.000 = 40.000. Lalu 40.000 : 50 = 800.',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'Operasi Campuran',
      },
      {
        nomor: 2,
        pertanyaan: 'Sebuah persegi memiliki keliling 48 cm. Panjang sisi persegi tersebut adalah ....',
        pilihan: [
          { kunci: 'A', teks: '10 cm' },
          { kunci: 'B', teks: '12 cm' },
          { kunci: 'C', teks: '14 cm' },
          { kunci: 'D', teks: '16 cm' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Sisi = Keliling : 4 = 48 cm : 4 = 12 cm.',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Keliling Persegi',
      },
      {
        nomor: 3,
        pertanyaan: 'Hasil dari 1/2 + 0,5 dalam bentuk persen adalah ....',
        pilihan: [
          { kunci: 'A', teks: '50%' },
          { kunci: 'B', teks: '75%' },
          { kunci: 'C', teks: '100%' },
          { kunci: 'D', teks: '150%' },
        ],
        kunciJawaban: 'C',
        pembahasan: '1/2 = 50%, 0,5 = 50%. 50% + 50% = 100%.',
        kodeTP: 'TP-MAT-5.5',
        lingkupMateri: 'Pecahan & Persen',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Luas persegi panjang yang berukuran panjang 10 cm dan lebar 7 cm adalah 70 cm².',
        kunciJawaban: 'Benar',
        alasanKunci: 'Luas = 10 cm × 7 cm = 70 cm².',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Luas Persegi Panjang',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah bangun datar dengan kelilingnya jika panjang sisinya diketahui!',
        daftarPremis: [
          { nomor: 1, teks: 'Persegi (sisi 10 cm)' },
          { nomor: 2, teks: 'Persegi panjang (panjang 10 cm, lebar 5 cm)' },
          { nomor: 3, teks: 'Segitiga sama sisi (sisi 8 cm)' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Keliling = 40 cm' },
          { label: 'B', teks: 'Keliling = 30 cm' },
          { label: 'C', teks: 'Keliling = 24 cm' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Keliling Bangun Datar',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'KPK dari bilangan 6 dan 9 adalah ....',
        kunciJawaban: '18',
        kodeTP: 'TP-MAT-5.1',
        lingkupMateri: 'KPK',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Halaman sekolah SD Negeri Fatubai berbentuk persegi panjang dengan panjang 25 meter dan lebar 14 meter. Hitunglah: a) Keliling halaman sekolah, b) Luas halaman sekolah!',
        kunciJawaban: 'a) Keliling = 2 × (25 + 14) = 2 × 39 = 78 meter. b) Luas = 25 × 14 = 350 m².',
        kodeTP: 'TP-MAT-5.7',
        lingkupMateri: 'Keliling & Luas Kontekstual',
      },
    ],
  }),

  // =======================================================================
  // PENDIDIKAN PANCASILA FASE A (KELAS 1 & 2 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-pancasila-fa-lengkap',
    judul: 'Ulangan Harian Pendidikan Pancasila Fase A: Simbol Garuda, Aturan Rumah, dan Keragaman',
    mataPelajaran: 'Pendidikan Pancasila',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 30,
    daftarTP: [
      {
        kodeTP: '1.1',
        rumusanTP: 'Mengenal simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila.',
        lingkupMateri: 'Simbol Garuda Pancasila',
        elemen: 'Pancasila',
      },
      {
        kodeTP: '1.2',
        rumusanTP: 'Mengenal aturan di lingkungan keluarga dan mematuhi aturan sehari-hari.',
        lingkupMateri: 'Aturan Keluarga',
        elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
      },
      {
        kodeTP: '1.3',
        rumusanTP: 'Mengenal semboyan Bhinneka Tunggal Ika dan menghargai keragaman identitas diri.',
        lingkupMateri: 'Bhinneka Tunggal Ika & Identitas',
        elemen: 'Bhinneka Tunggal Ika',
      },
      {
        kodeTP: '1.4',
        rumusanTP: 'Mengenal lingkungan tempat tinggal dan mempraktikkan bekerja sama menjaga lingkungan.',
        lingkupMateri: 'Kerja Sama Menjaga Lingkungan NKRI',
        elemen: 'Negara Kesatuan Republik Indonesia',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Warna bendera kebangsaan negara Indonesia adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Merah dan Kuning' },
          { kunci: 'B', teks: 'Merah dan Putih' },
          { kunci: 'C', teks: 'Putih dan Biru' },
          { kunci: 'D', teks: 'Hijau dan Putih' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Bendera negara Republik Indonesia adalah Sang Saka Merah Putih.',
        kodeTP: '1.1',
        lingkupMateri: 'Bendera Negara',
      },
      {
        nomor: 2,
        pertanyaan: 'Simbol sila pertama Pancasila, "Ketuhanan Yang Maha Esa", adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Bintang emas' },
          { kunci: 'B', teks: 'Rantai emas' },
          { kunci: 'C', teks: 'Pohon beringin' },
          { kunci: 'D', teks: 'Kepala banteng' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Bintang bersudut lima berlatar belakang hitam adalah simbol sila ke-1.',
        kodeTP: '1.1',
        lingkupMateri: 'Simbol Sila Pancasila',
      },
      {
        nomor: 3,
        pertanyaan: 'Contoh aturan yang baik saat berada di rumah adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Tidur larut malam setiap hari' },
          { kunci: 'B', teks: 'Merapikan tempat tidur setelah bangun' },
          { kunci: 'C', teks: 'Meninggalkan mainan berserakan di lantai' },
          { kunci: 'D', teks: 'Menonton televisi tanpa belajar' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Merapikan tempat tidur sendiri adalah wujud mematuhi aturan keluarga dan mandiri.',
        kodeTP: '1.2',
        lingkupMateri: 'Aturan di Rumah',
      },
      {
        nomor: 4,
        pertanyaan: 'Arti semboyan Bhinneka Tunggal Ika adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Bersatu kita teguh bercerai kita runtuh' },
          { kunci: 'B', teks: 'Berbeda-beda tetapi tetap satu jua' },
          { kunci: 'C', teks: 'Maju terus pantang mundur' },
          { kunci: 'D', teks: 'Bekerja bersama demi keuntungan' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Bhinneka Tunggal Ika berasal dari bahasa Jawa Kuno yang berarti beraneka ragam namun tetap satu kesatuan.',
        kodeTP: '1.3',
        lingkupMateri: 'Semboyan Bhinneka Tunggal Ika',
      },
      {
        nomor: 5,
        pertanyaan: 'Jika ada teman yang sedang membersihkan ruang kelas saat jadwal piket, sikap kita sebaiknya ....',
        pilihan: [
          { kunci: 'A', teks: 'Ikut membantu bekerja sama' },
          { kunci: 'B', teks: 'Pura-pura tidak melihat' },
          { kunci: 'C', teks: 'Mengejek teman yang sedang menyapu' },
          { kunci: 'D', teks: 'Membuang sampah sembarangan' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Bekerja sama dan saling membantu menjaga kebersihan kelas merupakan wujud gotong royong.',
        kodeTP: '1.4',
        lingkupMateri: 'Kerja Sama Menjaga Lingkungan',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Ketika lagu Indonesia Raya dinyanyikan, semua peserta upacara harus berdiri tegak dengan sikap hormat.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Sikap tertib dan khidmat saat mendengarkan lagu kebangsaan merupakan bukti rasa cinta tanah air.',
        kodeTP: '1.1',
        lingkupMateri: 'Lagu Kebangsaan',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah lambang sila Pancasila dengan bunyi silanya!',
        daftarPremis: [
          { nomor: 1, teks: 'Bintang Emas' },
          { nomor: 2, teks: 'Rantai Emas' },
          { nomor: 3, teks: 'Pohon Beringin' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Sila ke-1: Ketuhanan Yang Maha Esa' },
          { label: 'B', teks: 'Sila ke-2: Kemanusiaan yang Adil dan Beradab' },
          { label: 'C', teks: 'Sila ke-3: Persatuan Indonesia' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '1.1',
        lingkupMateri: 'Simbol Sila',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Burung yang menjadi lambang negara Republik Indonesia adalah burung ....',
        kunciJawaban: 'Garuda',
        kodeTP: '1.1',
        lingkupMateri: 'Lambang Negara',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebutkan 2 contoh aturan yang berlaku di rumahmu sehari-hari!',
        kunciJawaban: 'Contoh: 1. Merapikan tempat tidur setelah bangun pagi. 2. Berpamitan kepada orang tua sebelum berangkat ke sekolah.',
        kodeTP: '1.2',
        lingkupMateri: 'Aturan Keluarga',
      },
    ],
  }),

  // =======================================================================
  // PENDIDIKAN PANCASILA FASE B (KELAS 3 & 4 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-pancasila-fb-lengkap',
    judul: 'Ulangan Harian Pendidikan Pancasila Fase B: Makna Sila, Hak Kewajiban, dan Wilayah NKRI',
    mataPelajaran: 'Pendidikan Pancasila',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: '3.1',
        rumusanTP: 'Mengidentifikasi makna sila-sila Pancasila dan mengenal karakter para perumus Pancasila.',
        lingkupMateri: 'Makna Sila & Tokoh Perumus Pancasila',
        elemen: 'Pancasila',
      },
      {
        kodeTP: '3.2',
        rumusanTP: 'Mengidentifikasi aturan di sekolah serta hak dan kewajiban warga sekolah.',
        lingkupMateri: 'Aturan, Hak & Kewajiban Sekolah',
        elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
      },
      {
        kodeTP: '3.3',
        rumusanTP: 'Menghargai keragaman suku bangsa, bahasa, dan agama di lingkungan sekitar.',
        lingkupMateri: 'Keberagaman Suku & Budaya',
        elemen: 'Bhinneka Tunggal Ika',
      },
      {
        kodeTP: '3.4',
        rumusanTP: 'Mengidentifikasi wilayah tempat tinggal (RT, RW, Desa, Kecamatan) dalam bingkai NKRI.',
        lingkupMateri: 'Wilayah Tempat Tinggal & Persatuan NKRI',
        elemen: 'Negara Kesatuan Republik Indonesia',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Salah satu tokoh bangsa yang mengusulkan rumusan dasar negara pada sidang BPUPK tanggal 1 Juni 1945 adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Ir. Soekarno' },
          { kunci: 'B', teks: 'Ki Hajar Dewantara' },
          { kunci: 'C', teks: 'Jenderal Soedirman' },
          { kunci: 'D', teks: 'Pangeran Diponegoro' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Ir. Soekarno menyampaikan pidato rumusan dasar negara yang dinamakan Pancasila pada 1 Juni 1945.',
        kodeTP: '3.1',
        lingkupMateri: 'Tokoh Perumus Pancasila',
      },
      {
        nomor: 2,
        pertanyaan: 'Sesuatu yang harus kita kerjakan dengan penuh rasa tanggung jawab disebut ....',
        pilihan: [
          { kunci: 'A', teks: 'Hak' },
          { kunci: 'B', teks: 'Kewajiban' },
          { kunci: 'C', teks: 'Hadiah' },
          { kunci: 'D', teks: 'Keistimewaan' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Kewajiban adalah tindakan atau tugas yang harus dipenuhi secara bertanggung jawab.',
        kodeTP: '3.2',
        lingkupMateri: 'Hak dan Kewajiban',
      },
      {
        nomor: 3,
        pertanyaan: 'Contoh kewajiban utama seorang murid di sekolah adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Mendapatkan nilai bagus tanpa belajar' },
          { kunci: 'B', teks: 'Menaati tata tertib sekolah dan belajar dengan sungguh-sungguh' },
          { kunci: 'C', teks: 'Bebas datang ke sekolah kapan saja' },
          { kunci: 'D', teks: 'Memakai seragam sesuka hati' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Menghormati guru, menaati aturan, dan belajar tekun adalah kewajiban dasar murid.',
        kodeTP: '3.2',
        lingkupMateri: 'Kewajiban di Sekolah',
      },
      {
        nomor: 4,
        pertanyaan: 'Bahasa yang digunakan sebagai bahasa persatuan antarsuku bangsa di Indonesia adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Bahasa Daerah' },
          { kunci: 'B', teks: 'Bahasa Indonesia' },
          { kunci: 'C', teks: 'Bahasa Asing' },
          { kunci: 'D', teks: 'Bahasa Isyarat' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Bahasa Indonesia disepakati sebagai bahasa persatuan nasional sejak Sumpah Pemuda 1928.',
        kodeTP: '3.1',
        lingkupMateri: 'Bahasa Persatuan',
      },
      {
        nomor: 5,
        pertanyaan: 'Susunan wilayah tempat tinggal yang terkecil di bawah pengawasan RW adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'RT (Rukun Tetangga)' },
          { kunci: 'B', teks: 'Kelurahan' },
          { kunci: 'C', teks: 'Kecamatan' },
          { kunci: 'D', teks: 'Kabupaten' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Rukun Tetangga (RT) adalah organisasi kemasyarakatan paling dasar di bawah RW.',
        kodeTP: '3.4',
        lingkupMateri: 'Wilayah Administratif',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Kita harus menuntut hak terlebih dahulu sebelum melaksanakan kewajiban.',
        kunciJawaban: 'Salah',
        alasanKunci: 'Hak dan kewajiban harus dilaksanakan secara seimbang, dengan mengutamakan pemenuhan kewajiban terlebih dahulu.',
        kodeTP: '3.2',
        lingkupMateri: 'Keseimbangan Hak dan Kewajiban',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah tingkatan wilayah pemerintahan berikut dengan pemimpinnya!',
        daftarPremis: [
          { nomor: 1, teks: 'Kecamatan' },
          { nomor: 2, teks: 'Desa' },
          { nomor: 3, teks: 'Kabupaten' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Dipimpin oleh Camat' },
          { label: 'B', teks: 'Dipimpin oleh Kepala Desa' },
          { label: 'C', teks: 'Dipimpin oleh Bupati' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '3.4',
        lingkupMateri: 'Pemerintahan Wilayah',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Semboyan yang tertulis pada pita yang dicengkeram oleh burung Garuda Pancasila adalah ....',
        kunciJawaban: 'Bhinneka Tunggal Ika',
        kodeTP: '3.3',
        lingkupMateri: 'Bhinneka Tunggal Ika',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Jelaskan mengapa kita harus saling menghormati perbedaan suku dan agama antarteman di sekolah!',
        kunciJawaban: 'Agar tercipta kerukunan, persatuan, dan kedamaian di sekolah sehingga suasana belajar menjadi nyaman dan tidak terjadi permusuhan.',
        kodeTP: '3.3',
        lingkupMateri: 'Toleransi Antarteman',
      },
    ],
  }),

  // =======================================================================
  // BAHASA INDONESIA FASE A (KELAS 1 & 2 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-indo-fa-lengkap',
    judul: 'Ulangan Harian Bahasa Indonesia Fase A: Menyimak Teks Aural, Membaca Kata, dan Menulis Permulaan',
    mataPelajaran: 'Bahasa Indonesia',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 30,
    daftarTP: [
      {
        kodeTP: '1.1',
        rumusanTP: 'Memahami informasi dari teks nonsastra berbentuk teks aural tentang diri dan keluarga.',
        lingkupMateri: 'Teks Aural Diri & Keluarga',
        elemen: 'Menyimak',
      },
      {
        kodeTP: '1.2',
        rumusanTP: 'Membaca kata-kata sederhana dengan fasih dari bacaan tentang pola hidup sehat.',
        lingkupMateri: 'Membaca Kata Sederhana',
        elemen: 'Membaca dan Memirsa',
      },
      {
        kodeTP: '1.3',
        rumusanTP: 'Merespons dengan bertanya dan menjawab santun dalam percakapan lisan.',
        lingkupMateri: 'Percakapan Lisan Santun',
        elemen: 'Berbicara dan Mempresentasikan',
      },
      {
        kodeTP: '1.4',
        rumusanTP: 'Menulis permulaan dengan benar dan menyusun rangkaian kalimat sederhana.',
        lingkupMateri: 'Menulis Permulaan & Kalimat Sederhana',
        elemen: 'Menulis',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        stimulus: 'Ibu sedang menyiapkan sarapan di dapur. Budi membantu membawakan piring bersih ke meja makan. Setelah itu, mereka sarapan bersama ayah dan adik.',
        pertanyaan: 'Siapakah yang membantu ibu membawakan piring bersih?',
        pilihan: [
          { kunci: 'A', teks: 'Ayah' },
          { kunci: 'B', teks: 'Budi' },
          { kunci: 'C', teks: 'Adik' },
          { kunci: 'D', teks: 'Paman' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Berdasarkan teks simakan di atas, Budi yang membantu membawakan piring bersih.',
        kodeTP: '1.1',
        lingkupMateri: 'Informasi Teks Aural',
      },
      {
        nomor: 2,
        pertanyaan: 'Suku kata yang menyusun kata "kesehatan" adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'ke - se - ha - tan' },
          { kunci: 'B', teks: 'kes - e - hat - an' },
          { kunci: 'C', teks: 'kese - ha - tan' },
          { kunci: 'D', teks: 'ke - sehat - an' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Kata ke-se-ha-tan terdiri atas 4 suku kata.',
        kodeTP: '1.2',
        lingkupMateri: 'Pola Suku Kata',
      },
      {
        nomor: 3,
        pertanyaan: 'Ketika ingin meminjam pensil kepada teman sekelas, kalimat santun yang kita ucapkan adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Sini pensilmu aku pakai!' },
          { kunci: 'B', teks: 'Bolehkah saya meminjam pensilmu, tolong?' },
          { kunci: 'C', teks: 'Jangan pelit, berikan pensil itu!' },
          { kunci: 'D', teks: 'Cepat berikan pensilmu sekarang!' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Meminjam barang orang lain harus menggunakan kata tolong dan permisi secara sopan.',
        kodeTP: '1.3',
        lingkupMateri: 'Percakapan Santun',
      },
      {
        nomor: 4,
        pertanyaan: 'Huruf kapital yang tepat digunakan pada awal penulisan kalimat ....',
        pilihan: [
          { kunci: 'A', teks: 'hari ini kami belajar bahasa indonesia.' },
          { kunci: 'B', teks: 'Hari ini kami belajar Bahasa Indonesia.' },
          { kunci: 'C', teks: 'hari Ini Kami belajar bahasa indonesia.' },
          { kunci: 'D', teks: 'HARI INI KAMI BELAJAR BAHASA INDONESIA.' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Huruf kapital digunakan pada awal kalimat dan nama mata pelajaran/bahasa resmi.',
        kodeTP: '1.4',
        lingkupMateri: 'Kaidah Ejaan Menulis',
      },
      {
        nomor: 5,
        pertanyaan: 'Tanda baca yang tepat untuk mengakhiri kalimat berita sederhana adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Tanda titik (.)' },
          { kunci: 'B', teks: 'Tanda tanya (?)' },
          { kunci: 'C', teks: 'Tanda seru (!)' },
          { kunci: 'D', teks: 'Tanda koma (,)' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Kalimat berita ditutup dengan tanda titik (.).',
        kodeTP: '1.4',
        lingkupMateri: 'Tanda Baca',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Ketika guru sedang membacakan cerita di depan kelas, murid harus mendengarkan dengan tertib dan menyimak dengan baik.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Menyimak dengan sungguh-sungguh adalah kunci memahami pesan cerita dan menghormati pembicara.',
        kodeTP: '1.1',
        lingkupMateri: 'Sikap Menyimak',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah kata berikut dengan lawan katanya (antonim)!',
        daftarPremis: [
          { nomor: 1, teks: 'Bersih' },
          { nomor: 2, teks: 'Sehat' },
          { nomor: 3, teks: 'Rajin' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Kotor' },
          { label: 'B', teks: 'Sakit' },
          { label: 'C', teks: 'Malas' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '1.2',
        lingkupMateri: 'Kosakata Lawan Kata',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Saat menulis di buku tulis, posisi duduk kita harus tegak agar punggung tidak ....',
        kunciJawaban: 'sakit',
        kodeTP: '1.4',
        lingkupMateri: 'Sikap Duduk Menulis',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Tuliskan satu kalimat sederhana yang menceritakan kegiatanmu membersihkan rumah bersama keluarga!',
        kunciJawaban: 'Contoh: Saya membantu ayah menyapu halaman rumah pada hari Minggu pagi.',
        kodeTP: '1.4',
        lingkupMateri: 'Menyusun Kalimat',
      },
    ],
  }),

  // =======================================================================
  // BAHASA INDONESIA FASE B (KELAS 3 & 4 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-indo-fb-lengkap',
    judul: 'Ulangan Harian Bahasa Indonesia Fase B: Ide Pokok Teks Aural, Kosakata Baru, dan Menulis Teks Denotatif',
    mataPelajaran: 'Bahasa Indonesia',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: '3.1',
        rumusanTP: 'Memahami ide pokok dan informasi penting dari teks nonsastra berbentuk teks aural.',
        lingkupMateri: 'Ide Pokok Teks Aural',
        elemen: 'Menyimak',
      },
      {
        kodeTP: '3.2',
        rumusanTP: 'Membaca kata-kata baru dengan fasih dan membedakan ide pokok serta ide pendukung.',
        lingkupMateri: 'Ide Pokok & Ide Pendukung',
        elemen: 'Membaca dan Memirsa',
      },
      {
        kodeTP: '3.3',
        rumusanTP: 'Menyajikan pendapat dengan pilihan kata dan gestur yang sesuai dalam diskusi.',
        lingkupMateri: 'Presentasi & Diskusi Santun',
        elemen: 'Berbicara dan Mempresentasikan',
      },
      {
        kodeTP: '3.4',
        rumusanTP: 'Menulis teks sederhana dengan kaidah kebahasaan dan kosakata bermakna denotatif.',
        lingkupMateri: 'Menulis Teks & Makna Denotatif',
        elemen: 'Menulis',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        stimulus: 'Tanaman padi membutuhkan pasokan air yang cukup selama masa pertumbuhan. Petani di pedesaan mengalirkan air dari sungai menggunakan saluran irigasi tradisional. Bila musim kemarau panjang tiba, para petani saling bergotong royong menjaga ketersediaan air sawah.',
        pertanyaan: 'Gagasan utama (ide pokok) dari bacaan di atas adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Bentuk saluran irigasi tradisional' },
          { kunci: 'B', teks: 'Kebutuhan air bagi pertumbuhan tanaman padi' },
          { kunci: 'C', teks: 'Penyebab terjadinya kemarau panjang' },
          { kunci: 'D', teks: 'Hasil panen beras di pedesaan' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Kalimat utama ada di awal paragraf yang membahas kebutuhan air tanaman padi.',
        kodeTP: '3.2',
        lingkupMateri: 'Ide Pokok Teks',
      },
      {
        nomor: 2,
        pertanyaan: 'Kata di bawah ini yang menggunakan imbuhan "me-" yang tepat pada kata dasar "sapu" adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Mesapu' },
          { kunci: 'B', teks: 'Menyapu' },
          { kunci: 'C', teks: 'Mensapu' },
          { kunci: 'D', teks: 'Mengsapu' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Kata berawalan huruf "s" luluh menjadi "meny-" bila diberi awalan me- (me + sapu = menyapu).',
        kodeTP: '3.2',
        lingkupMateri: 'Pembentukan Kata Berimbuhan',
      },
      {
        nomor: 3,
        pertanyaan: 'Makna DENOTATIF (makna sebenarnya / lugas) dari kata "bunga" terdapat pada kalimat ....',
        pilihan: [
          { kunci: 'A', teks: 'Siti dijuluki sebagai bunga desa karena keramahannya.' },
          { kunci: 'B', teks: 'Ibu menanam bunga mawar yang harum di halaman rumah.' },
          { kunci: 'C', teks: 'Ayah harus membayar bunga pinjaman di bank setiap bulan.' },
          { kunci: 'D', teks: 'Pemuda itu gugur sebagai bunga bangsa di medan laga.' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pilihan B merujuk pada tanaman berbunga (makna denotatif/sebenarnya), sedangkan A, C, dan D adalah makna kias/konotatif.',
        kodeTP: '3.4',
        lingkupMateri: 'Makna Denotatif',
      },
      {
        nomor: 4,
        pertanyaan: 'Saat berdiskusi dalam kelompok, jika ada teman yang sedang menyampaikan usulannya, sikap yang benar adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Memotong pembicaraannya dengan suara keras' },
          { kunci: 'B', teks: 'Mendengarkan sampai selesai lalu menanggapi dengan santun' },
          { kunci: 'C', teks: 'Mengejek pendapat teman karena tidak sependapat' },
          { kunci: 'D', teks: 'Tidur dan tidak mau memperhatikan diskusi' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Tata cara diskusi yang baik menuntut kita mendengarkan pembicara hingga selesai sebelum menanggapi secara santun.',
        kodeTP: '3.3',
        lingkupMateri: 'Tata Cara Diskusi',
      },
      {
        nomor: 5,
        pertanyaan: 'Penulisan kata depan "di" yang tepat untuk menunjukkan tempat adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Disekolah' },
          { kunci: 'B', teks: 'Di sekolah' },
          { kunci: 'C', teks: 'Disapu' },
          { kunci: 'D', teks: 'Dimakan' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Kata depan "di" yang menunjukkan tempat ditulis terpisah dari kata yang mengikutinya (di sekolah, di rumah).',
        kodeTP: '3.4',
        lingkupMateri: 'Penulisan Kata Depan',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Paragraf yang kalimat utamanya terletak di awal paragraf dinamakan paragraf deduktif.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Paragraf deduktif menempatkan gagasan utama di awal, lalu diikuti oleh kalimat-kalimat penjelas.',
        kodeTP: '3.2',
        lingkupMateri: 'Jenis Paragraf',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah jenis teks berikut dengan ciri utamanya!',
        daftarPremis: [
          { nomor: 1, teks: 'Teks Narasi' },
          { nomor: 2, teks: 'Teks Deskripsi' },
          { nomor: 3, teks: 'Teks Prosedur' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Menceritakan urutan peristiwa atau kisah tokoh' },
          { label: 'B', teks: 'Menggambarkan objek atau keadaan secara rinci' },
          { label: 'C', teks: 'Memuat langkah-langkah atau petunjuk melakukan sesuatu' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '3.4',
        lingkupMateri: 'Jenis-jenis Teks',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Teks yang menyajikan fakta objektif dan informasi pengetahuan (bukan rekaan/imajinasi) disebut teks ....',
        kunciJawaban: 'nonsastra (atau nonfiksi)',
        kodeTP: '3.1',
        lingkupMateri: 'Teks Nonsastra',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Jelaskan perbedaan antara kalimat utama (ide pokok) dengan kalimat penjelas (ide pendukung) dalam sebuah paragraf!',
        kunciJawaban: 'Kalimat utama memuat ide pokok atau inti pembahasan seluruh paragraf, sedangkan kalimat penjelas menguraikan rincian, bukti, atau contoh-contoh yang memperjelas ide pokok tersebut.',
        kodeTP: '3.2',
        lingkupMateri: 'Ide Pokok dan Penjelas',
      },
    ],
  }),

  // =======================================================================
  // MATEMATIKA FASE A (KELAS 1 & 2 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-mat-fa-lengkap',
    judul: 'Ulangan Harian Matematika Fase A: Bilangan s.d 100, Penjumlahan, Pengukuran, dan Bangun Datar',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: '1.1',
        rumusanTP: 'Menunjukkan pemahaman number sense, nilai tempat, serta penjumlahan dan pengurangan konkret sampai 20.',
        lingkupMateri: 'Number Sense & Nilai Tempat Cacah s.d 100',
        elemen: 'Bilangan',
      },
      {
        kodeTP: '1.2',
        rumusanTP: 'Memahami makna simbol "=" dalam kalimat matematika dan mengenali pola bukan bilangan.',
        lingkupMateri: 'Simbol "=" dan Pola Bukan Bilangan',
        elemen: 'Aljabar',
      },
      {
        kodeTP: '1.3',
        rumusanTP: 'Membandingkan panjang, berat, dan durasi waktu menggunakan satuan tidak baku.',
        lingkupMateri: 'Pengukuran Satuan Tidak Baku',
        elemen: 'Pengukuran',
      },
      {
        kodeTP: '1.4',
        rumusanTP: 'Mengenal berbagai bentuk bangun datar, bangun ruang, dan posisi relatif benda.',
        lingkupMateri: 'Geometri & Bangun Datar',
        elemen: 'Geometri',
      },
      {
        kodeTP: '1.5',
        rumusanTP: 'Mengurutkan, mengelompokkan, dan menyajikan data dengan turus dan piktogram s.d 4 kategori.',
        lingkupMateri: 'Turus & Piktogram Sederhana',
        elemen: 'Analisis Data dan Peluang',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Nilai tempat angka 7 pada bilangan 75 adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Satuan' },
          { kunci: 'B', teks: 'Puluhan' },
          { kunci: 'C', teks: 'Ratusan' },
          { kunci: 'D', teks: 'Ribuan' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pada bilangan 75, angka 7 menempati nilai puluhan (nilainya 70) dan angka 5 menempati satuan (nilainya 5).',
        kodeTP: '1.1',
        lingkupMateri: 'Nilai Tempat',
      },
      {
        nomor: 2,
        pertanyaan: 'Ibu membeli 12 butir telur. Di perjalanan pecah 4 butir. Sisa telur ibu yang masih utuh adalah ....',
        pilihan: [
          { kunci: 'A', teks: '6 butir' },
          { kunci: 'B', teks: '7 butir' },
          { kunci: 'C', teks: '8 butir' },
          { kunci: 'D', teks: '9 butir' },
        ],
        kunciJawaban: 'C',
        pembahasan: '12 - 4 = 8 butir telur.',
        kodeTP: '1.1',
        lingkupMateri: 'Pengurangan Konkret',
      },
      {
        nomor: 3,
        pertanyaan: 'Bila sebuah pizza dipotong menjadi 2 bagian yang sama besar, maka masing-masing potongan bernilai ....',
        pilihan: [
          { kunci: 'A', teks: 'Setengah (1/2)' },
          { kunci: 'B', teks: 'Seperempat (1/4)' },
          { kunci: 'C', teks: 'Satu utuh (1)' },
          { kunci: 'D', teks: 'Sepertiga (1/3)' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Satu benda utuh dibagi dua sama besar dinamakan setengah atau satu per dua (1/2).',
        kodeTP: '1.1',
        lingkupMateri: 'Pecahan Setengah',
      },
      {
        nomor: 4,
        pertanyaan: 'Perhatikan pola warna berikut: Merah, Kuning, Hijau, Merah, Kuning, .... Warna berikutnya adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Merah' },
          { kunci: 'B', teks: 'Hijau' },
          { kunci: 'C', teks: 'Kuning' },
          { kunci: 'D', teks: 'Biru' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pola warna berulang setiap 3 warna (Merah - Kuning - Hijau). Setelah Kuning adalah Hijau.',
        kodeTP: '1.2',
        lingkupMateri: 'Pola Bukan Bilangan',
      },
      {
        nomor: 5,
        pertanyaan: 'Benda di dalam kelas yang memiliki permukaan berbentuk lingkaran adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Papan tulis' },
          { kunci: 'B', teks: 'Jam dinding bulat' },
          { kunci: 'C', teks: 'Buku tulis' },
          { kunci: 'D', teks: 'Penggaris segitiga' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Jam dinding bundar memiliki bentuk lingkaran.',
        kodeTP: '1.4',
        lingkupMateri: 'Bangun Datar Lingkaran',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Panjang meja kelas dapat diukur menggunakan jengkal tangan sebagai satuan tidak baku.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Jengkal tangan merupakan salah satu contoh alat ukur panjang satuan tidak baku.',
        kodeTP: '1.3',
        lingkupMateri: 'Satuan Tidak Baku',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah benda ruang berikut dengan bentuk bangun ruangnya!',
        daftarPremis: [
          { nomor: 1, teks: 'Kotak kardus pasta gigi' },
          { nomor: 2, teks: 'Dadu permainan ular tangga' },
          { nomor: 3, teks: 'Bola sepak' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Balok' },
          { label: 'B', teks: 'Kubus' },
          { label: 'C', teks: 'Bola' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '1.4',
        lingkupMateri: 'Bangun Ruang',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Dalam kalimat matematika 8 + ... = 15, angka pengganti titik-titik adalah ....',
        kunciJawaban: '7',
        kodeTP: '1.2',
        lingkupMateri: 'Simbol Sama Dengan',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebutkan 3 macam bangun datar yang memiliki sudut dan garis lurus!',
        kunciJawaban: 'Contoh: Segitiga, Persegi (segiempat), dan Persegi Panjang.',
        kodeTP: '1.4',
        lingkupMateri: 'Macam Bangun Datar',
      },
    ],
  }),

  // =======================================================================
  // MATEMATIKA FASE B (KELAS 3 & 4 SD/MI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =======================================================================
  createExamPackage({
    id: 'lat-mat-fb-lengkap',
    judul: 'Ulangan Harian Matematika Fase B: Operasi Cacah s.d 1.000, Pecahan Senilai, Pengukuran Baku, dan Diagram Batang',
    mataPelajaran: 'Matematika',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 40,
    daftarTP: [
      {
        kodeTP: '3.1',
        rumusanTP: 'Menyelesaikan operasi penjumlahan/pengurangan s.d 1.000, perkalian/pembagian s.d 100, serta pecahan senilai dan desimal.',
        lingkupMateri: 'Operasi Bilangan Cacah & Pecahan Senilai',
        elemen: 'Bilangan',
      },
      {
        kodeTP: '3.2',
        rumusanTP: 'Menemukan nilai yang tidak diketahui dalam kalimat matematika dan mengembangkan pola bilangan membesar/mengecil.',
        lingkupMateri: 'Kalimat Matematika & Pola Bilangan',
        elemen: 'Aljabar',
      },
      {
        kodeTP: '3.3',
        rumusanTP: 'Mengukur panjang dan berat dengan satuan baku (cm, m, g, kg) serta estimasi luas dan volume.',
        lingkupMateri: 'Satuan Baku & Luas-Volume',
        elemen: 'Pengukuran',
      },
      {
        kodeTP: '3.4',
        rumusanTP: 'Mendeskripsikan ciri bangun datar serta menyusun dan mengurai berbagai bentuk bangun datar.',
        lingkupMateri: 'Ciri & Komposisi Bangun Datar',
        elemen: 'Geometri',
      },
      {
        kodeTP: '3.5',
        rumusanTP: 'Mengurutkan, menyajikan, dan menginterpretasi data dalam bentuk tabel dan diagram batang skala satu satuan.',
        lingkupMateri: 'Diagram Batang Skala Satu Satuan',
        elemen: 'Analisis Data dan Peluang',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Hasil dari operasi hitung penjumlahan 485 + 278 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '753' },
          { kunci: 'B', teks: '763' },
          { kunci: 'C', teks: '773' },
          { kunci: 'D', teks: '783' },
        ],
        kunciJawaban: 'B',
        pembahasan: '485 + 278 = 763.',
        kodeTP: '3.1',
        lingkupMateri: 'Penjumlahan Bilangan Cacah',
      },
      {
        nomor: 2,
        pertanyaan: 'Pecahan yang SENILAI dengan pecahan 2/5 adalah ....',
        pilihan: [
          { kunci: 'A', teks: '4/10' },
          { kunci: 'B', teks: '3/10' },
          { kunci: 'C', teks: '4/15' },
          { kunci: 'D', teks: '5/2' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Pembilang dan penyebut dikalikan 2: (2 x 2) / (5 x 2) = 4/10.',
        kodeTP: '3.1',
        lingkupMateri: 'Pecahan Senilai',
      },
      {
        nomor: 3,
        pertanyaan: 'Pola bilangan loncat berikut: 12, 16, 20, 24, .... Suku bilangan berikutnya adalah ....',
        pilihan: [
          { kunci: 'A', teks: '26' },
          { kunci: 'B', teks: '28' },
          { kunci: 'C', teks: '30' },
          { kunci: 'D', teks: '32' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Pola bertambah 4 (+4). Jadi 24 + 4 = 28.',
        kodeTP: '3.2',
        lingkupMateri: 'Pola Bilangan Membesar',
      },
      {
        nomor: 4,
        pertanyaan: 'Panjang pita Ani adalah 3 meter. Jika dinyatakan dalam satuan centimeter (cm), panjang pita Ani adalah ....',
        pilihan: [
          { kunci: 'A', teks: '30 cm' },
          { kunci: 'B', teks: '300 cm' },
          { kunci: 'C', teks: '3.000 cm' },
          { kunci: 'D', teks: '30.000 cm' },
        ],
        kunciJawaban: 'B',
        pembahasan: '1 meter = 100 centimeter. Maka 3 m = 3 x 100 = 300 cm.',
        kodeTP: '3.3',
        lingkupMateri: 'Konversi Satuan Baku',
      },
      {
        nomor: 5,
        pertanyaan: 'Sebuah bangun datar memiliki 4 sisi sama panjang dan 4 sudut siku-siku. Bangun tersebut adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Persegi panjang' },
          { kunci: 'B', teks: 'Persegi (Bujur sangkar)' },
          { kunci: 'C', teks: 'Trapesium' },
          { kunci: 'D', teks: 'Jajar genjang' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Ciri persegi adalah keempat sisinya berukuran sama panjang dan keempat sudutnya siku-siku (90 derajat).',
        kodeTP: '3.4',
        lingkupMateri: 'Ciri-ciri Bangun Datar',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Nilai pecahan 3/10 jika diubah menjadi bentuk desimal adalah 0,3.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Pecahan persepuluhan memiliki satu angka di belakang tanda koma desimal, sehingga 3/10 = 0,3.',
        kodeTP: '3.1',
        lingkupMateri: 'Desimal dan Pecahan',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah besaran massa berikut dengan nilai kesetaraannya!',
        daftarPremis: [
          { nomor: 1, teks: '1 kilogram (kg)' },
          { nomor: 2, teks: '2 kilogram (kg)' },
          { nomor: 3, teks: '5.000 gram (g)' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: '1.000 gram (g)' },
          { label: 'B', teks: '2.000 gram (g)' },
          { label: 'C', teks: '5 kilogram (kg)' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'A' },
          { nomorPremis: 2, labelRespon: 'B' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: '3.3',
        lingkupMateri: 'Satuan Berat Baku',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Faktor persekutuan terbesar dari bilangan 12 dan 18 adalah ....',
        kunciJawaban: '6',
        kodeTP: '3.1',
        lingkupMateri: 'Faktor dan Kelipatan',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Siswa kelas 4 mengumpulkan data buah kesukaan: Apel = 8 siswa, Mangga = 12 siswa, Jeruk = 6 siswa. Berapakah selisih jumlah siswa yang menyukai Mangga dan Jeruk?',
        kunciJawaban: 'Selisih siswa = Jumlah penyuka Mangga - Jumlah penyuka Jeruk = 12 - 6 = 6 siswa.',
        kodeTP: '3.5',
        lingkupMateri: 'Interpretasi Data',
      },
    ],
  }),

  // -----------------------------------------------------------------------
  // IPAS FASE B (KELAS III & IV) - PAKET ULANGAN HARIAN LENGKAP
  // -----------------------------------------------------------------------
  createExamPackage({
    id: 'lat-ipas-fb-lengkap',
    judul: 'Latihan IPAS Fase B (Kelas III & IV): Pemahaman Alam, Sosial & Penyelidikan Ilmiah',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    jenisAsesmen: 'Ulangan Harian',
    durasiMenit: 35,
    daftarTP: [
      {
        kodeTP: 'TP-IPAS-B.1',
        rumusanTP: 'Menjelaskan bentuk dan fungsi pancaindra manusia serta membiasakan diri merawat kesehatannya.',
        lingkupMateri: 'Bentuk dan Fungsi Pancaindra',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-B.2',
        rumusanTP: 'Menganalisis tahapan siklus hidup makhluk hidup dan merumuskan upaya pelestariannya.',
        lingkupMateri: 'Siklus Hidup Makhluk Hidup',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-B.4',
        rumusanTP: 'Menyimpulkan proses perubahan wujud zat melalui serangkaian pengamatan dan percobaan.',
        lingkupMateri: 'Perubahan Wujud Zat',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-B.5',
        rumusanTP: 'Menjelaskan ragam sumber dan bentuk energi serta transformasinya dalam kehidupan sehari-hari.',
        lingkupMateri: 'Sumber dan Transformasi Energi',
        elemen: 'Pemahaman IPAS',
      },
      {
        kodeTP: 'TP-IPAS-B.6',
        rumusanTP: 'Membedakan berbagai jenis gaya serta menganalisis pengaruh gaya terhadap gerak dan bentuk benda.',
        lingkupMateri: 'Jenis Gaya dan Pengaruhnya',
        elemen: 'Pemahaman IPAS',
      },
    ],
    pgItems: [
      {
        nomor: 1,
        pertanyaan: 'Bagian pancaindra yang berfungsi menerima rangsangan gelombang bunyi atau suara adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Mata' },
          { kunci: 'B', teks: 'Telinga' },
          { kunci: 'C', teks: 'Hidung' },
          { kunci: 'D', teks: 'Lidah' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Telinga adalah indra pendengaran yang mendeteksi getaran gelombang bunyi.',
        kodeTP: 'TP-IPAS-B.1',
        lingkupMateri: 'Fungsi Pancaindra',
      },
      {
        nomor: 2,
        pertanyaan: 'Urutan daur hidup (metamorfosis sempurna) pada kupu-kupu yang benar adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Telur -> Ulat (Larva) -> Kepompong (Pupa) -> Kupu-kupu' },
          { kunci: 'B', teks: 'Telur -> Kepompong -> Ulat -> Kupu-kupu' },
          { kunci: 'C', teks: 'Kupu-kupu -> Kepompong -> Ulat -> Telur' },
          { kunci: 'D', teks: 'Telur -> Nimfa -> Kupu-kupu dewasa' },
        ],
        kunciJawaban: 'A',
        pembahasan: 'Kupu-kupu mengalami metamorfosis sempurna: telur menetas menjadi ulat (larva), lalu menjadi kepompong (pupa), dan keluar menjadi kupu-kupu dewasa.',
        kodeTP: 'TP-IPAS-B.2',
        lingkupMateri: 'Siklus Hidup Kupu-kupu',
      },
      {
        nomor: 3,
        pertanyaan: 'Peristiwa es batu di dalam gelas yang berubah menjadi air cair karena terkena panas ruangan disebut proses ....',
        pilihan: [
          { kunci: 'A', teks: 'Membeku' },
          { kunci: 'B', teks: 'Mencair' },
          { kunci: 'C', teks: 'Menguap' },
          { kunci: 'D', teks: 'Mengembun' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Mencair adalah perubahan wujud zat dari padat menjadi cair akibat menyerap panas (kalor).',
        kodeTP: 'TP-IPAS-B.4',
        lingkupMateri: 'Perubahan Wujud Zat',
      },
      {
        nomor: 4,
        pertanyaan: 'Perubahan bentuk energi yang terjadi saat kita menyalakan setrika listrik untuk merapikan seragam sekolah adalah ....',
        pilihan: [
          { kunci: 'A', teks: 'Energi listrik menjadi energi gerak' },
          { kunci: 'B', teks: 'Energi listrik menjadi energi panas' },
          { kunci: 'C', teks: 'Energi panas menjadi energi listrik' },
          { kunci: 'D', teks: 'Energi kimia menjadi energi cahaya' },
        ],
        kunciJawaban: 'B',
        pembahasan: 'Setrika listrik mengubah energi listrik menjadi energi panas pada lempeng pemanasnya.',
        kodeTP: 'TP-IPAS-B.5',
        lingkupMateri: 'Transformasi Energi',
      },
      {
        nomor: 5,
        pertanyaan: 'Ketika Doni menarik tuas rem sepeda, sepeda yang melaju kencang perlahan melambat lalu berhenti. Hal ini disebabkan adanya gaya ....',
        pilihan: [
          { kunci: 'A', teks: 'Gaya gravitasi' },
          { kunci: 'B', teks: 'Gaya magnet' },
          { kunci: 'C', teks: 'Gaya gesek' },
          { kunci: 'D', teks: 'Gaya pegas' },
        ],
        kunciJawaban: 'C',
        pembahasan: 'Karet rem yang bergesekan dengan velg roda menimbulkan gaya gesek yang memperlambat laju sepeda.',
        kodeTP: 'TP-IPAS-B.6',
        lingkupMateri: 'Gaya Gesek',
      },
    ],
    bsItems: [
      {
        nomor: 1,
        pernyataan: 'Wilayah bentang alam berupa dataran tinggi yang berhawa sejuk sangat cocok untuk kegiatan perkebunan teh, sayur-mayur, dan objek wisata alam.',
        kunciJawaban: 'Benar',
        alasanKunci: 'Dataran tinggi memiliki suhu sejuk dan tanah subur yang ideal bagi budidaya teh, kopi, sayuran, dan wisata alam.',
        kodeTP: 'TP-IPAS-B.9',
        lingkupMateri: 'Bentang Alam dan Profesi',
      },
    ],
    menjodohkanItems: [
      {
        nomorGroup: 1,
        instruksi: 'Pasangkanlah organ pancaindra dengan fungsi rangsangan utamanya!',
        daftarPremis: [
          { nomor: 1, teks: 'Mata' },
          { nomor: 2, teks: 'Lidah' },
          { nomor: 3, teks: 'Kulit' },
        ],
        daftarPilihanRespon: [
          { label: 'A', teks: 'Mengecap rasa manis, asin, asam, pahit' },
          { label: 'B', teks: 'Melihat warna dan menangkap cahaya' },
          { label: 'C', teks: 'Merasakan rabaan, tekstur kasar/halus, dan suhu' },
        ],
        kunciJawabanPasangan: [
          { nomorPremis: 1, labelRespon: 'B' },
          { nomorPremis: 2, labelRespon: 'A' },
          { nomorPremis: 3, labelRespon: 'C' },
        ],
        kodeTP: 'TP-IPAS-B.1',
        lingkupMateri: 'Fungsi Pancaindra',
      },
    ],
    isianItems: [
      {
        nomor: 1,
        pertanyaan: 'Nama mata uang resmi yang berlaku sebagai alat tukar sah di seluruh wilayah Negara Kesatuan Republik Indonesia adalah ....',
        kunciJawaban: 'Rupiah',
        kodeTP: 'TP-IPAS-B.11',
        lingkupMateri: 'Nilai Mata Uang',
      },
    ],
    uraianItems: [
      {
        nomor: 1,
        pertanyaan: 'Sebutkan 2 contoh tindakan nyata yang dapat dilakukan oleh murid di lingkungan sekolah sebagai upaya mitigasi perubahan iklim dan pelestarian lingkungan!',
        kunciJawaban: '1. Memilah sampah organik dan anorganik serta mengurangi penggunaan botol plastik sekali pakai. 2. Mematikan kran air dan lampu kelas saat tidak digunakan untuk menghemat energi.',
        kodeTP: 'TP-IPAS-B.3',
        lingkupMateri: 'Mitigasi Perubahan Iklim',
      },
    ],
  }),
];
