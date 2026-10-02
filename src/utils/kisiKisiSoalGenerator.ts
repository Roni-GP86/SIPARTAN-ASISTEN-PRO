import {
  SchoolIdentity,
  TPItem,
  ATPDocument,
  KonfigurasiKisiKisiSoal,
  KonfigurasiJenisSoal,
  JenisAsesmenSoal,
  JenisBentukSoal,
  LevelKognitifSoal,
  KisiKisiItemRow,
  ButirSoalPilihanGanda,
  ButirSoalMenjodohkanGroup,
  ButirSoalBenarSalah,
  ButirSoalIsianSingkat,
  ButirSoalUraian,
  NaskahSoalDocument,
  PedomanPenskoranItem,
  KisiKisiSoalDocument,
} from '../types';

/**
 * Helper resmi penulisan kisi-kisi Kurikulum Merdeka:
 * Pada kisi-kisi soal, deskripsi capaian pembelajaran tidak usah ditulis ulang
 * untuk setiap nomor soal yang memiliki elemen yang sama. Cukup ditulis
 * "Deskripsi elemen .....(isikan nama elemen)" agar hemat kertas dan rapi saat dicetak.
 */
export function getCpColumnDisplay(
  row: KisiKisiItemRow,
  index: number,
  allRows: KisiKisiItemRow[]
): string {
  const currentElemen = (row.elemen || '').trim().toLowerCase();
  if (!currentElemen) {
    return row.capaianPembelajaran || '-';
  }

  // Cek apakah elemen ini sudah pernah muncul pada baris sebelumnya (0 <= i < index)
  const isDuplicateElement = allRows.slice(0, index).some(
    (prevRow) => (prevRow.elemen || '').trim().toLowerCase() === currentElemen
  );

  if (isDuplicateElement) {
    return `Deskripsi elemen ${row.elemen}`;
  }

  // Kemunculan pertama elemen ini dalam dokumen kisi-kisi
  return row.capaianPembelajaran || `Deskripsi elemen ${row.elemen}`;
}

/**
 * Helper untuk menghitung alokasi pembagian jumlah soal per elemen secara rata & berimbang (Proporsional)
 */
export function calculateElementDistribution(
  elements: string[],
  totalQuestions: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (elements.length === 0 || totalQuestions <= 0) return result;

  const base = Math.floor(totalQuestions / elements.length);
  let remainder = totalQuestions % elements.length;

  elements.forEach((el) => {
    result[el] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  });

  return result;
}

/**
 * Helper untuk menghitung alokasi pembagian jumlah soal berdasarkan beban Jam Pelajaran (JP) TP di setiap elemen
 */
export function calculateElementDistributionByJP(
  elements: string[],
  tps: TPItem[],
  totalQuestions: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (elements.length === 0 || totalQuestions <= 0) return result;

  const jpPerElement: Record<string, number> = {};
  let grandTotalJP = 0;

  elements.forEach((el) => {
    const elTPs = tps.filter((t) => (t.elemen || 'Elemen Pokok').trim() === el.trim());
    const sumJP = elTPs.reduce((sum, t) => sum + (Number(t.alokasiJP) || 4), 0);
    jpPerElement[el] = Math.max(1, sumJP);
    grandTotalJP += jpPerElement[el];
  });

  let allocated = 0;
  elements.forEach((el, idx) => {
    if (idx === elements.length - 1) {
      result[el] = Math.max(1, totalQuestions - allocated);
    } else {
      const share = Math.round((jpPerElement[el] / grandTotalJP) * totalQuestions);
      const safeShare = Math.max(1, share);
      result[el] = safeShare;
      allocated += safeShare;
    }
  });

  return result;
}

/**
 * Menghasilkan konfigurasi default instan berdasarkan jenis asesmen
 */
export function getDefaultKonfigurasiSoal(
  jenisAsesmen: JenisAsesmenSoal,
  identitas: SchoolIdentity,
  availableTPs: TPItem[] = []
): KonfigurasiKisiKisiSoal {
  // Rekomendasi butir soal berdasarkan jenis asesmen
  let konfigurasi: Record<JenisBentukSoal, KonfigurasiJenisSoal>;

  if (jenisAsesmen === 'Ulangan Harian') {
    konfigurasi = {
      'Pilihan Ganda': {
        jenis: 'Pilihan Ganda',
        enabled: true,
        jumlahSoal: 10,
        level1Count: 4,
        level2Count: 4,
        level3Count: 2,
        bobotPerSoal: 1,
      },
      'Menjodohkan': {
        jenis: 'Menjodohkan',
        enabled: false,
        jumlahSoal: 5,
        level1Count: 3,
        level2Count: 2,
        level3Count: 0,
        bobotPerSoal: 1,
      },
      'Benar / Salah': {
        jenis: 'Benar / Salah',
        enabled: false,
        jumlahSoal: 5,
        level1Count: 3,
        level2Count: 2,
        level3Count: 0,
        bobotPerSoal: 1,
      },
      'Isian Singkat': {
        jenis: 'Isian Singkat',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 2,
        level2Count: 2,
        level3Count: 1,
        bobotPerSoal: 2,
      },
      'Uraian': {
        jenis: 'Uraian',
        enabled: true,
        jumlahSoal: 2,
        level1Count: 0,
        level2Count: 1,
        level3Count: 1,
        bobotPerSoal: 5,
      },
    };
  } else if (jenisAsesmen === 'Tengah Semester 1' || jenisAsesmen === 'Tengah Semester 2') {
    konfigurasi = {
      'Pilihan Ganda': {
        jenis: 'Pilihan Ganda',
        enabled: true,
        jumlahSoal: 15,
        level1Count: 5,
        level2Count: 7,
        level3Count: 3,
        bobotPerSoal: 1,
      },
      'Menjodohkan': {
        jenis: 'Menjodohkan',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 3,
        level2Count: 2,
        level3Count: 0,
        bobotPerSoal: 1,
      },
      'Benar / Salah': {
        jenis: 'Benar / Salah',
        enabled: false,
        jumlahSoal: 5,
        level1Count: 3,
        level2Count: 2,
        level3Count: 0,
        bobotPerSoal: 1,
      },
      'Isian Singkat': {
        jenis: 'Isian Singkat',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 2,
        level2Count: 2,
        level3Count: 1,
        bobotPerSoal: 2,
      },
      'Uraian': {
        jenis: 'Uraian',
        enabled: true,
        jumlahSoal: 3,
        level1Count: 0,
        level2Count: 1,
        level3Count: 2,
        bobotPerSoal: 5,
      },
    };
  } else {
    // Semester 1 / Semester 2 (Sumatif Akhir Semester / SAS / SAT)
    konfigurasi = {
      'Pilihan Ganda': {
        jenis: 'Pilihan Ganda',
        enabled: true,
        jumlahSoal: 20,
        level1Count: 6,
        level2Count: 9,
        level3Count: 5,
        bobotPerSoal: 1,
      },
      'Menjodohkan': {
        jenis: 'Menjodohkan',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 3,
        level2Count: 2,
        level3Count: 0,
        bobotPerSoal: 1,
      },
      'Benar / Salah': {
        jenis: 'Benar / Salah',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 2,
        level2Count: 2,
        level3Count: 1,
        bobotPerSoal: 1,
      },
      'Isian Singkat': {
        jenis: 'Isian Singkat',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 2,
        level2Count: 2,
        level3Count: 1,
        bobotPerSoal: 2,
      },
      'Uraian': {
        jenis: 'Uraian',
        enabled: true,
        jumlahSoal: 5,
        level1Count: 0,
        level2Count: 2,
        level3Count: 3,
        bobotPerSoal: 4,
      },
    };
  }

  // Filter TP codes according to semester if applicable
  const semesterStr = jenisAsesmen.includes('1')
    ? 'Semester 1'
    : jenisAsesmen.includes('2')
    ? 'Semester 2'
    : '';

  let matchedTPs = availableTPs.filter((tp) => {
    if (!semesterStr) return true;
    return !tp.semesterTarget || tp.semesterTarget === 'Fleksibel' || tp.semesterTarget === semesterStr;
  });

  if (matchedTPs.length === 0) {
    matchedTPs = availableTPs;
  }

  // PRINSIP KURIKULUM MERDEKA:
  // Pada Asesmen Sumatif Tengah Semester (STS) dan Akhir Semester (SAS/SAT),
  // soal WAJIB mencakup lebih dari 1 elemen agar mencerminkan capaian pembelajaran menyeluruh.
  // Jika matchedTPs hanya menghasilkan 1 elemen sedangkan mata pelajaran memiliki elemen lain,
  // sertakan TP dari elemen lain tersebut secara cerdas.
  const matchedElements = Array.from(new Set(matchedTPs.map((t) => (t.elemen || 'Elemen Pokok').trim())));
  const allElements = Array.from(new Set(availableTPs.map((t) => (t.elemen || 'Elemen Pokok').trim())));

  if (
    (jenisAsesmen.includes('Tengah Semester') || jenisAsesmen.includes('Semester')) &&
    matchedElements.length <= 1 &&
    allElements.length > 1
  ) {
    // Ambil TP dari semua elemen yang tersedia agar mencakup multi-elemen
    matchedTPs = availableTPs;
  }

  const selectedTPCodes = matchedTPs.map((t) => t.kodeTP);

  // Hitung total butir soal dari seluruh bentuk soal aktif
  const totalQuestionsAll = Object.values(konfigurasi)
    .filter((k) => k.enabled)
    .reduce((acc, curr) => acc + (Number(curr.jumlahSoal) || 0), 0);

  // Hitung alokasi default per elemen secara proporsional dan seimbang
  const activeElements = Array.from(
    new Set(
      matchedTPs
        .filter((t) => selectedTPCodes.includes(t.kodeTP))
        .map((t) => (t.elemen || 'Elemen Pokok').trim())
    )
  );

  const alokasiSoalPerElemen = calculateElementDistribution(
    activeElements.length > 0 ? activeElements : allElements,
    totalQuestionsAll
  );

  return {
    jenisAsesmen,
    mataPelajaran: identitas.mataPelajaran || 'Matematika',
    fase: identitas.fase || 'Fase C',
    kelas: identitas.kelas || '5',
    semester: identitas.semester || (jenisAsesmen.includes('2') ? '2 (Genap)' : '1 (Ganjil)'),
    tahunPelajaran: identitas.tahunPelajaran || '2025/2026',
    alokasiWaktu: '120 Menit',
    tanggalPelaksanaan: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    selectedTPCodes,
    alokasiSoalPerElemen,
    konfigurasiSoal: konfigurasi,
  };
}

/**
 * Menghasilkan rumusan indikator soal operasional berdasarkan KKO, Lingkup Materi, dan Level Kognitif
 */
function buildIndikatorSoal(
  tp: TPItem,
  bentuk: JenisBentukSoal,
  level: LevelKognitifSoal
): { indikator: string; kko: string } {
  const materi = tp.lingkupMateri || 'materi pokok';
  const kompetensi = tp.kompetensi || 'memahami';

  if (level === 'Level 1') {
    if (bentuk === 'Pilihan Ganda') {
      return {
        indikator: `Disajikan stimulus berupa definisi atau konsep dasar tentang ${materi}, peserta didik dapat mengidentifikasi atau menyebutkan unsur pokoknya dengan benar.`,
        kko: 'C1/C2 (Menyebutkan / Menjelaskan)',
      };
    } else if (bentuk === 'Menjodohkan') {
      return {
        indikator: `Disajikan daftar istilah dan konsep tentang ${materi}, peserta didik dapat memasangkan istilah dengan definisi yang tepat.`,
        kko: 'C1/C2 (Mencocokkan / Mengenal)',
      };
    } else if (bentuk === 'Benar / Salah') {
      return {
        indikator: `Disajikan pernyataan fakta dasar tentang ${materi}, peserta didik dapat menentukan kebenaran pernyataan tersebut.`,
        kko: 'C1/C2 (Mengenali)',
      };
    } else if (bentuk === 'Isian Singkat') {
      return {
        indikator: `Disajikan kalimat rumpang tentang konsep dasar ${materi}, peserta didik dapat melengkapi dengan istilah yang tepat.`,
        kko: 'C1/C2 (Menyebutkan)',
      };
    } else {
      return {
        indikator: `Peserta didik dapat menjelaskan secara ringkas konsep pokok mengenai ${materi}.`,
        kko: 'C2 (Menjelaskan)',
      };
    }
  } else if (level === 'Level 2') {
    if (bentuk === 'Pilihan Ganda') {
      return {
        indikator: `Disajikan ilustrasi atau persoalan kontekstual sehari-hari terkait ${materi}, peserta didik dapat menerapkan prosedur atau menyelesaikan masalah dengan tepat.`,
        kko: 'C3 (Menerapkan / Menentukan)',
      };
    } else if (bentuk === 'Menjodohkan') {
      return {
        indikator: `Disajikan situasi kasus sederhana dan cara penyelesaiannya tentang ${materi}, peserta didik dapat menjodohkan kasus dengan tindakan yang tepat.`,
        kko: 'C3 (Menerapkan)',
      };
    } else if (bentuk === 'Benar / Salah') {
      return {
        indikator: `Disajikan contoh penerapan aturan/konsep terkait ${materi} dalam kehidupan nyata, peserta didik dapat menilai ketepatan langkah tersebut.`,
        kko: 'C3 (Mengidentifikasi Kebenaran)',
      };
    } else if (bentuk === 'Isian Singkat') {
      return {
        indikator: `Disajikan soal hitungan atau kasus singkat terkait ${materi}, peserta didik dapat menentukan hasil akhir perhitungan atau prosedur dengan tepat.`,
        kko: 'C3 (Menghitung / Menentukan)',
      };
    } else {
      return {
        indikator: `Disajikan masalah kontekstual mengenai ${materi}, peserta didik dapat menyelesaikan langkah-langkah penyelesaian secara runtut dan benar.`,
        kko: 'C3 (Menerapkan & Menyelesaikan)',
      };
    }
  } else {
    // Level 3 (HOTS)
    if (bentuk === 'Pilihan Ganda') {
      return {
        indikator: `Disajikan data, tabel, diagram, atau narasi studi kasus kompleks mengenai ${materi}, peserta didik dapat menganalisis hubungan sebab-akibat atau menyimpulkan solusi yang paling tepat.`,
        kko: 'C4/C5 (Menganalisis / Menyimpulkan)',
      };
    } else if (bentuk === 'Menjodohkan') {
      return {
        indikator: `Disajikan beberapa hipotesis dan hasil analisis kritis tentang ${materi}, peserta didik dapat mengaitkan argumentasi dengan bukti yang relevan.`,
        kko: 'C4 (Mengaitkan / Menganalisis)',
      };
    } else if (bentuk === 'Benar / Salah') {
      return {
        indikator: `Disajikan pernyataan analitis kritis disertai alasan logis mengenai ${materi}, peserta didik dapat mengevaluasi keabsahan pernyataan tersebut.`,
        kko: 'C5 (Mengevaluasi)',
      };
    } else if (bentuk === 'Isian Singkat') {
      return {
        indikator: `Disajikan pola atau studi kasus singkat terkait ${materi}, peserta didik dapat menganalisis kesimpulan logis dari data tersebut.`,
        kko: 'C4 (Menganalisis)',
      };
    } else {
      return {
        indikator: `Disajikan permasalahan terbuka (open-ended) kontekstual tentang ${materi}, peserta didik dapat menganalisis masalah, merumuskan alternatif solusi inovatif, dan memberikan argumentasi rasional.`,
        kko: 'C4-C6 (Menganalisis / Mengevaluasi / Mengkreasi)',
      };
    }
  }
}

/**
 * Generator cerdas untuk naskah soal Kurikulum Merdeka yang berbasis fakta materi & CP
 */
export function generateKisiKisiDanNaskahSoal(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDoc: ATPDocument | null,
  konfigurasi: KonfigurasiKisiKisiSoal
): KisiKisiSoalDocument {
  // Ambil TP yang dipilih
  const availableTPs = tpList.length > 0
    ? tpList
    : (atpDoc?.atpList || []).map((a, i) => ({
        id: `tp-auto-${i}`,
        kodeTP: a.kodeTP,
        elemen: a.elemen || 'Elemen Pokok',
        kalimatCP: a.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kompetensi: 'Memahami dan menerapkan',
        lingkupMateri: a.lingkupMateri || 'Materi Pokok',
        rumusanTP: a.tujuanPembelajaran,
        alokasiJP: a.alokasiJP,
        dimensiP3: a.dimensiP3 || [],
        semesterTarget: 'Semester 1' as const,
        urutanAlur: a.urutan,
      }));

  const activeTPs = availableTPs.filter((tp) =>
    konfigurasi.selectedTPCodes.length === 0 || konfigurasi.selectedTPCodes.includes(tp.kodeTP)
  );

  const poolTPs = activeTPs.length > 0 ? activeTPs : availableTPs;

  const tabelKisiKisi: KisiKisiItemRow[] = [];
  const soalPilihanGanda: ButirSoalPilihanGanda[] = [];
  const soalMenjodohkan: ButirSoalMenjodohkanGroup[] = [];
  const soalBenarSalah: ButirSoalBenarSalah[] = [];
  const soalIsianSingkat: ButirSoalIsianSingkat[] = [];
  const soalUraian: ButirSoalUraian[] = [];
  const pedomanPenskoran: PedomanPenskoranItem[] = [];

  let globalNomorSoal = 1;

  // 1. SISTEM DISTRIBUSI MULTI-ELEMEN CERDAS (KURIKULUM MERDEKA)
  // Menjamin setiap mata pelajaran yang memiliki lebih dari 1 elemen terdistribusi secara seimbang
  const elemenMap = new Map<string, TPItem[]>();
  poolTPs.forEach((tp) => {
    const el = (tp.elemen || 'Elemen Pokok').trim();
    if (!elemenMap.has(el)) elemenMap.set(el, []);
    elemenMap.get(el)!.push(tp);
  });

  const availableElements = Array.from(elemenMap.keys());
  const customQuotas = konfigurasi.alokasiSoalPerElemen || {};

  // Hitung total butir soal dari seluruh jenis soal aktif
  const totalQuestionsAll =
    (konfigurasi.konfigurasiSoal['Pilihan Ganda']?.enabled ? Number(konfigurasi.konfigurasiSoal['Pilihan Ganda']?.jumlahSoal) || 0 : 0) +
    (konfigurasi.konfigurasiSoal['Menjodohkan']?.enabled ? Number(konfigurasi.konfigurasiSoal['Menjodohkan']?.jumlahSoal) || 0 : 0) +
    (konfigurasi.konfigurasiSoal['Benar / Salah']?.enabled ? Number(konfigurasi.konfigurasiSoal['Benar / Salah']?.jumlahSoal) || 0 : 0) +
    (konfigurasi.konfigurasiSoal['Isian Singkat']?.enabled ? Number(konfigurasi.konfigurasiSoal['Isian Singkat']?.jumlahSoal) || 0 : 0) +
    (konfigurasi.konfigurasiSoal['Uraian']?.enabled ? Number(konfigurasi.konfigurasiSoal['Uraian']?.jumlahSoal) || 0 : 0);

  // Buat antrian urutan elemen yang berimbang (interleaved multi-element sequence)
  const elementSequence: string[] = [];
  const hasCustomQuotas = availableElements.some((el) => (customQuotas[el] || 0) > 0);

  if (hasCustomQuotas) {
    const remaining: Record<string, number> = {};
    availableElements.forEach((el) => {
      remaining[el] = customQuotas[el] || 1;
    });

    let currentCount = 0;
    while (currentCount < Math.max(totalQuestionsAll, 1)) {
      let addedInRound = 0;
      for (const el of availableElements) {
        if ((remaining[el] || 0) > 0) {
          elementSequence.push(el);
          remaining[el]!--;
          currentCount++;
          addedInRound++;
          if (currentCount >= totalQuestionsAll) break;
        }
      }
      if (addedInRound === 0) {
        elementSequence.push(availableElements[currentCount % availableElements.length]);
        currentCount++;
      }
    }
  } else {
    // Rotasi merata ke semua elemen aktif
    for (let i = 0; i < Math.max(totalQuestionsAll, 50); i++) {
      elementSequence.push(availableElements[i % availableElements.length]);
    }
  }

  // Pointer ke masing-masing TP di setiap elemen
  const elementTPIndices: Record<string, number> = {};
  availableElements.forEach((el) => {
    elementTPIndices[el] = 0;
  });

  let globalQuestionIndex = 0;

  // Helper cerdas multi-elemen: mengambil TP secara rotasi berimbang antar elemen
  const getNextTP = (): TPItem => {
    const targetElement = elementSequence[globalQuestionIndex % elementSequence.length] || availableElements[0];
    globalQuestionIndex++;

    const tpsInElement = elemenMap.get(targetElement) || poolTPs;
    const currentPtr = elementTPIndices[targetElement] || 0;
    const chosenTP = tpsInElement[currentPtr % tpsInElement.length];
    elementTPIndices[targetElement] = currentPtr + 1;

    return chosenTP;
  };

  // 1. GENERATE PILIHAN GANDA
  const cfgPG = konfigurasi.konfigurasiSoal['Pilihan Ganda'];
  if (cfgPG && cfgPG.enabled && cfgPG.jumlahSoal > 0) {
    const totalPG = cfgPG.jumlahSoal;
    // Tentukan level tiap butir
    const levels: LevelKognitifSoal[] = [];
    for (let i = 0; i < cfgPG.level1Count; i++) levels.push('Level 1');
    for (let i = 0; i < cfgPG.level2Count; i++) levels.push('Level 2');
    for (let i = 0; i < cfgPG.level3Count; i++) levels.push('Level 3');
    // Jika ada sisa atau kurang seimbang, lengkapi
    while (levels.length < totalPG) levels.push('Level 2');
    levels.length = totalPG;

    levels.forEach((lvl, idx) => {
      const tp = getNextTP();
      const nomor = idx + 1;
      const { indikator, kko } = buildIndikatorSoal(tp, 'Pilihan Ganda', lvl);

      // Susun butir soal PG kontekstual
      const { pertanyaan, stimulus, pilihan, kunciJawaban, pembahasan } = generatePGItemContent(
        tp,
        lvl,
        nomor,
        identitas
      );

      soalPilihanGanda.push({
        nomor,
        stimulus,
        pertanyaan,
        pilihan,
        kunciJawaban,
        pembahasan,
        bobot: cfgPG.bobotPerSoal || 1,
        levelKognitif: lvl,
        kodeTP: tp.kodeTP,
        lingkupMateri: tp.lingkupMateri,
      });

      tabelKisiKisi.push({
        nomor: globalNomorSoal,
        nomorSoalDisplay: `${nomor}`,
        elemen: tp.elemen,
        capaianPembelajaran: tp.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri,
        indikatorSoal: indikator,
        levelKognitif: lvl,
        tingkatKKO: kko,
        bentukSoal: 'Pilihan Ganda',
        bobotSkor: cfgPG.bobotPerSoal || 1,
      });

      pedomanPenskoran.push({
        nomorSoalDisplay: `PG No. ${nomor}`,
        bentukSoal: 'Pilihan Ganda',
        kunciJawabanSingkat: kunciJawaban,
        bobotSkor: cfgPG.bobotPerSoal || 1,
      });

      globalNomorSoal++;
    });
  }

  // 2. GENERATE MENJODOHKAN
  const cfgJodoh = konfigurasi.konfigurasiSoal['Menjodohkan'];
  if (cfgJodoh && cfgJodoh.enabled && cfgJodoh.jumlahSoal > 0) {
    const totalJodoh = cfgJodoh.jumlahSoal;
    const levels: LevelKognitifSoal[] = [];
    for (let i = 0; i < cfgJodoh.level1Count; i++) levels.push('Level 1');
    for (let i = 0; i < cfgJodoh.level2Count; i++) levels.push('Level 2');
    for (let i = 0; i < cfgJodoh.level3Count; i++) levels.push('Level 3');
    while (levels.length < totalJodoh) levels.push('Level 2');
    levels.length = totalJodoh;

    const group = generateMenjodohkanContent(poolTPs, totalJodoh, levels[0], 1, cfgJodoh.bobotPerSoal || 1);
    soalMenjodohkan.push(group);

    // Setiap butir premis menjodohkan dicatat sebagai butir soal resmi pada dokumen kisi-kisi
    group.daftarPremis.forEach((premis, pIdx) => {
      const tp = getNextTP();
      const lvl = levels[pIdx] || 'Level 2';
      const { indikator, kko } = buildIndikatorSoal(tp, 'Menjodohkan', lvl);
      const nomorDisplay = `II.${premis.nomor}`;

      tabelKisiKisi.push({
        nomor: globalNomorSoal,
        nomorSoalDisplay: nomorDisplay,
        elemen: tp.elemen,
        capaianPembelajaran: tp.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri,
        indikatorSoal: indikator,
        levelKognitif: lvl,
        tingkatKKO: kko,
        bentukSoal: 'Menjodohkan',
        bobotSkor: cfgJodoh.bobotPerSoal || 1,
      });

      const matchingKunci = group.kunciJawabanPasangan.find((k) => k.nomorPremis === premis.nomor);
      pedomanPenskoran.push({
        nomorSoalDisplay: `Menjodohkan ${premis.nomor}`,
        bentukSoal: 'Menjodohkan',
        kunciJawabanSingkat: matchingKunci?.labelRespon || 'A',
        bobotSkor: cfgJodoh.bobotPerSoal || 1,
      });

      globalNomorSoal++;
    });
  }

  // 3. GENERATE BENAR / SALAH
  const cfgBS = konfigurasi.konfigurasiSoal['Benar / Salah'];
  if (cfgBS && cfgBS.enabled && cfgBS.jumlahSoal > 0) {
    const totalBS = cfgBS.jumlahSoal;
    const levels: LevelKognitifSoal[] = [];
    for (let i = 0; i < cfgBS.level1Count; i++) levels.push('Level 1');
    for (let i = 0; i < cfgBS.level2Count; i++) levels.push('Level 2');
    for (let i = 0; i < cfgBS.level3Count; i++) levels.push('Level 3');
    while (levels.length < totalBS) levels.push('Level 2');
    levels.length = totalBS;

    levels.forEach((lvl, idx) => {
      const tp = getNextTP();
      const nomor = idx + 1;
      const { indikator, kko } = buildIndikatorSoal(tp, 'Benar / Salah', lvl);

      const bsItem = generateBenarSalahContent(tp, lvl, nomor);
      soalBenarSalah.push({
        ...bsItem,
        bobot: cfgBS.bobotPerSoal || 1,
      });

      tabelKisiKisi.push({
        nomor: globalNomorSoal,
        nomorSoalDisplay: `III.${nomor}`,
        elemen: tp.elemen,
        capaianPembelajaran: tp.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri,
        indikatorSoal: indikator,
        levelKognitif: lvl,
        tingkatKKO: kko,
        bentukSoal: 'Benar / Salah',
        bobotSkor: cfgBS.bobotPerSoal || 1,
      });

      pedomanPenskoran.push({
        nomorSoalDisplay: `B/S No. ${nomor}`,
        bentukSoal: 'Benar / Salah',
        kunciJawabanSingkat: bsItem.kunciJawaban,
        bobotSkor: cfgBS.bobotPerSoal || 1,
      });

      globalNomorSoal++;
    });
  }

  // 4. GENERATE ISIAN SINGKAT
  const cfgIsian = konfigurasi.konfigurasiSoal['Isian Singkat'];
  if (cfgIsian && cfgIsian.enabled && cfgIsian.jumlahSoal > 0) {
    const totalIsian = cfgIsian.jumlahSoal;
    const levels: LevelKognitifSoal[] = [];
    for (let i = 0; i < cfgIsian.level1Count; i++) levels.push('Level 1');
    for (let i = 0; i < cfgIsian.level2Count; i++) levels.push('Level 2');
    for (let i = 0; i < cfgIsian.level3Count; i++) levels.push('Level 3');
    while (levels.length < totalIsian) levels.push('Level 2');
    levels.length = totalIsian;

    levels.forEach((lvl, idx) => {
      const tp = getNextTP();
      const nomor = idx + 1;
      const { indikator, kko } = buildIndikatorSoal(tp, 'Isian Singkat', lvl);

      const isianItem = generateIsianContent(tp, lvl, nomor);
      soalIsianSingkat.push({
        ...isianItem,
        bobot: cfgIsian.bobotPerSoal || 2,
      });

      tabelKisiKisi.push({
        nomor: globalNomorSoal,
        nomorSoalDisplay: `IV.${nomor}`,
        elemen: tp.elemen,
        capaianPembelajaran: tp.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri,
        indikatorSoal: indikator,
        levelKognitif: lvl,
        tingkatKKO: kko,
        bentukSoal: 'Isian Singkat',
        bobotSkor: cfgIsian.bobotPerSoal || 2,
      });

      pedomanPenskoran.push({
        nomorSoalDisplay: `Isian No. ${nomor}`,
        bentukSoal: 'Isian Singkat',
        kunciJawabanSingkat: isianItem.kunciJawaban,
        bobotSkor: cfgIsian.bobotPerSoal || 2,
      });

      globalNomorSoal++;
    });
  }

  // 5. GENERATE URAIAN
  const cfgUraian = konfigurasi.konfigurasiSoal['Uraian'];
  if (cfgUraian && cfgUraian.enabled && cfgUraian.jumlahSoal > 0) {
    const totalUraian = cfgUraian.jumlahSoal;
    const levels: LevelKognitifSoal[] = [];
    for (let i = 0; i < cfgUraian.level1Count; i++) levels.push('Level 1');
    for (let i = 0; i < cfgUraian.level2Count; i++) levels.push('Level 2');
    for (let i = 0; i < cfgUraian.level3Count; i++) levels.push('Level 3');
    while (levels.length < totalUraian) levels.push('Level 3');
    levels.length = totalUraian;

    levels.forEach((lvl, idx) => {
      const tp = getNextTP();
      const nomor = idx + 1;
      const { indikator, kko } = buildIndikatorSoal(tp, 'Uraian', lvl);

      const uraianItem = generateUraianContent(tp, lvl, nomor, cfgUraian.bobotPerSoal || 5);
      soalUraian.push(uraianItem);

      tabelKisiKisi.push({
        nomor: globalNomorSoal,
        nomorSoalDisplay: `V.${nomor}`,
        elemen: tp.elemen,
        capaianPembelajaran: tp.kalimatCP || atpDoc?.capaianPembelajaran || '',
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.rumusanTP,
        lingkupMateri: tp.lingkupMateri,
        indikatorSoal: indikator,
        levelKognitif: lvl,
        tingkatKKO: kko,
        bentukSoal: 'Uraian',
        bobotSkor: cfgUraian.bobotPerSoal || 5,
      });

      pedomanPenskoran.push({
        nomorSoalDisplay: `Uraian No. ${nomor}`,
        bentukSoal: 'Uraian',
        kunciJawabanSingkat: uraianItem.kunciJawaban,
        bobotSkor: cfgUraian.bobotPerSoal || 5,
      });

      globalNomorSoal++;
    });
  }

  // Hitung total butir & total skor maksimal
  const totalButirSoal =
    soalPilihanGanda.length +
    soalMenjodohkan.reduce((acc, g) => acc + g.daftarPremis.length, 0) +
    soalBenarSalah.length +
    soalIsianSingkat.length +
    soalUraian.length;

  const totalSkorMaksimal =
    soalPilihanGanda.reduce((acc, s) => acc + s.bobot, 0) +
    soalMenjodohkan.reduce((acc, g) => acc + g.bobotTotal, 0) +
    soalBenarSalah.reduce((acc, s) => acc + s.bobot, 0) +
    soalIsianSingkat.reduce((acc, s) => acc + s.bobot, 0) +
    soalUraian.reduce((acc, s) => acc + s.bobot, 0);

  // Distribusi bentuk & level
  const distribusiBentuk: Record<JenisBentukSoal, number> = {
    'Pilihan Ganda': soalPilihanGanda.length,
    'Menjodohkan': soalMenjodohkan.reduce((acc, g) => acc + g.daftarPremis.length, 0),
    'Benar / Salah': soalBenarSalah.length,
    'Isian Singkat': soalIsianSingkat.length,
    'Uraian': soalUraian.length,
  };

  let countL1 = 0;
  let countL2 = 0;
  let countL3 = 0;

  tabelKisiKisi.forEach((k) => {
    if (k.levelKognitif === 'Level 1') countL1++;
    else if (k.levelKognitif === 'Level 2') countL2++;
    else countL3++;
  });

  const distribusiLevel: Record<LevelKognitifSoal, number> = {
    'Level 1': countL1,
    'Level 2': countL2,
    'Level 3': countL3,
  };

  const petunjukUmum = [
    'Tulislah nama, nomor peserta, dan kelas pada lembar jawaban yang telah disediakan!',
    'Bacalah setiap butir soal dengan cermat dan teliti sebelum Anda menjawabnya!',
    'Kerjakanlah terlebih dahulu soal-soal yang Anda anggap lebih mudah!',
    'Periksalah kembali seluruh pekerjaan Anda sebelum diserahkan kepada Bapak/Ibu Guru!',
    'Berdoalah sebelum dan sesudah mengerjakan tes agar diberikan kelancaran dan kemudahan.',
  ];

  const naskahSoal: NaskahSoalDocument = {
    identitas: {
      ...identitas,
      jenisAsesmen: konfigurasi.jenisAsesmen,
      alokasiWaktu: konfigurasi.alokasiWaktu,
      hariTanggal: konfigurasi.tanggalPelaksanaan,
    },
    petunjukUmum,
    soalPilihanGanda,
    soalMenjodohkan,
    soalBenarSalah,
    soalIsianSingkat,
    soalUraian,
    totalButirSoal,
    totalSkorMaksimal,
  };

  return {
    id: `soal-${Date.now()}`,
    tanggalDibuat: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    konfigurasi,
    identitas,
    tabelKisiKisi,
    naskahSoal,
    pedomanPenskoran,
    ringkasanDistribusi: {
      totalSoal: totalButirSoal,
      totalSkorMaksimal,
      distribusiBentuk,
      distribusiLevel,
    },
  };
}

// -------------------------------------------------------------------------
// Helper Content Generators (Authentic Contextual Elementary Education)
// -------------------------------------------------------------------------

function cleanMateri(materi: string): string {
  return materi.replace(/^[\d\.\-\*•]+\s*/, '').trim();
}

function generatePGItemContent(
  tp: TPItem,
  level: LevelKognitifSoal,
  nomor: number,
  identitas: SchoolIdentity
): {
  pertanyaan: string;
  stimulus?: string;
  pilihan: { kunci: 'A' | 'B' | 'C' | 'D'; teks: string }[];
  kunciJawaban: 'A' | 'B' | 'C' | 'D';
  pembahasan: string;
} {
  const materi = cleanMateri(tp.lingkupMateri);
  const mapel = identitas.mataPelajaran.toLowerCase();

  if (level === 'Level 1') {
    // Pengetahuan & Pemahaman konsep dasar
    return {
      stimulus: `Perhatikan pernyataan tentang materi ${materi} berikut ini!`,
      pertanyaan: `Pernyataan di bawah ini yang paling tepat menjelaskan tentang konsep dasar dari ${materi} adalah ....`,
      pilihan: [
        { kunci: 'A', teks: `Prinsip utama yang mengatur pemahaman mendasar dan aturan operasional mengenai ${materi}` },
        { kunci: 'B', teks: `Proses tambahan yang hanya diterapkan saat melakukan penilaian khusus di kelas` },
        { kunci: 'C', teks: `Langkah perkiraan tanpa menggunakan pedoman konsep materi yang baku` },
        { kunci: 'D', teks: `Pengulangan materi sebelumnya yang tidak memiliki hubungan langsung dengan tujuan belajar` },
      ],
      kunciJawaban: 'A',
      pembahasan: `Konsep dasar dari ${materi} merujuk pada pemahaman mendasar dan prinsip operasional sesuai capaian pembelajaran pada materi tersebut.`,
    };
  } else if (level === 'Level 2') {
    // Penerapan / Aplikasi kasus kontekstual
    return {
      stimulus: `Seorang siswa sedang melakukan kegiatan pembelajaran kelompok untuk menyelesaikan tugas yang berkaitan dengan ${materi}. Siswa tersebut mencatat data dan mengamati pola yang terjadi.`,
      pertanyaan: `Berdasarkan kegiatan tersebut, langkah penerapan yang paling tepat untuk memecahkan persoalan ${materi} adalah ....`,
      pilihan: [
        { kunci: 'A', teks: `Mengabaikan data yang telah dicatat dan menebak jawaban secara langsung` },
        { kunci: 'B', teks: `Menerapkan rumus atau prosedur pemecahan masalah ${materi} secara runtut dan teratur` },
        { kunci: 'C', teks: `Menyalin jawaban teman tanpa memeriksa kebenaran langkah penyelesaiannya` },
        { kunci: 'D', teks: `Mengubah seluruh data percobaan agar menghasilkan kesimpulan yang cepat selesai` },
      ],
      kunciJawaban: 'B',
      pembahasan: `Pada tahap penerapan (Level 2), peserta didik dituntut mampu mengaplikasikan langkah kerja atau prosedur pemecahan masalah ${materi} secara sistematis dan benar.`,
    };
  } else {
    // Level 3 (Penalaran / Analisis / HOTS)
    return {
      stimulus: `Disajikan dua kondisi berbeda dalam kehidupan sehari-hari terkait pemanfaatan konsep ${materi}. Pada kondisi pertama, penerapan dilakukan sesuai standar panduan, sedangkan pada kondisi kedua terjadi kekeliruan dalam memperhitungkan faktor utama.`,
      pertanyaan: `Berdasarkan analisis perbandingan di atas, kesimpulan kritis yang dapat dirumuskan terkait keberhasilan pemecahan masalah ${materi} adalah ....`,
      pilihan: [
        { kunci: 'A', teks: `Faktor ketelitian dalam menganalisis data dan pemahaman konsep mendalam menjadi kunci utama keberhasilan pemecahan masalah` },
        { kunci: 'B', teks: `Kedua kondisi akan menghasilkan dampak yang sama karena hasil akhir tidak dipengaruhi oleh proses analisis` },
        { kunci: 'C', teks: `Kekeliruan pada kondisi kedua tidak berpengaruh karena konsep ${materi} bersifat acak` },
        { kunci: 'D', teks: `Penyelesaian masalah lebih baik dilakukan secara spontan tanpa perlu memperhatikan hubungan sebab-akibat` },
      ],
      kunciJawaban: 'A',
      pembahasan: `Soal penalaran (HOTS) menuntut peserta didik menganalisis hubungan sebab-akibat dan menyimpulkan bahwa ketelitian pemahaman konsep ${materi} sangat krusial.`,
    };
  }
}

function generateMenjodohkanContent(
  tpOrPool: TPItem | TPItem[],
  jumlahItem: number,
  level: LevelKognitifSoal,
  nomorGroup: number,
  bobotPerSoal: number
): ButirSoalMenjodohkanGroup {
  const pool = Array.isArray(tpOrPool) ? tpOrPool : [tpOrPool];
  const primaryTP = pool[0];
  const count = Math.max(1, jumlahItem);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const daftarPremis: { nomor: number; teks: string }[] = [];
  const daftarPilihanRespon: { label: string; teks: string }[] = [];
  const kunciJawabanPasangan: { nomorPremis: number; labelRespon: string }[] = [];

  for (let i = 0; i < count; i++) {
    const curTP = pool[i % pool.length];
    const materi = cleanMateri(curTP.lingkupMateri);
    const label = alphabet[i % alphabet.length] || `P${i + 1}`;

    let premisTeks = '';
    let responTeks = '';

    const variation = i % 5;
    if (variation === 0) {
      premisTeks = `Prinsip atau konsep pokok yang mendasari materi ${materi}`;
      responTeks = `Memahami aturan operasional dan konsep dasar ${materi}`;
    } else if (variation === 1) {
      premisTeks = `Bentuk penerapan praktis dari konsep ${materi} dalam kehidupan sehari-hari`;
      responTeks = `Menyelesaikan persoalan nyata kontekstual secara mandiri`;
    } else if (variation === 2) {
      premisTeks = `Tujuan utama kompetensi pada pembelajaran ${materi}`;
      responTeks = `Menguasai langkah penyelesaian masalah terstruktur`;
    } else if (variation === 3) {
      premisTeks = `Sikap ilmiah dan karakter bernalar kritis saat mempelajari ${materi}`;
      responTeks = `Bekerja dengan teliti, tekun, dan bertanggung jawab`;
    } else {
      premisTeks = `Manfaat jangka panjang memahami materi ${materi} bagi lingkungan`;
      responTeks = `Meningkatkan kemampuan pemecahan masalah di masa depan`;
    }

    daftarPremis.push({
      nomor: i + 1,
      teks: premisTeks,
    });

    daftarPilihanRespon.push({
      label,
      teks: responTeks,
    });

    kunciJawabanPasangan.push({
      nomorPremis: i + 1,
      labelRespon: label,
    });
  }

  return {
    nomorGroup,
    instruksi: `Pasangkanlah butir pernyataan pada Kolom A (Kiri) dengan pilihan jawaban yang paling tepat pada Kolom B (Kanan)!`,
    daftarPremis,
    daftarPilihanRespon,
    kunciJawabanPasangan,
    bobotTotal: count * bobotPerSoal,
    levelKognitif: level,
    kodeTP: primaryTP.kodeTP,
    lingkupMateri: primaryTP.lingkupMateri,
  };
}

function generateBenarSalahContent(
  tp: TPItem,
  level: LevelKognitifSoal,
  nomor: number
): {
  nomor: number;
  pernyataan: string;
  kunciJawaban: 'Benar' | 'Salah';
  alasanKunci: string;
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
} {
  const materi = cleanMateri(tp.lingkupMateri);
  const isBenar = nomor % 2 === 1;

  if (isBenar) {
    return {
      nomor,
      pernyataan: `Dalam memahami konsep ${materi}, peserta didik perlu mengenali ciri-ciri pokok dan menerapkan langkah penyelesaian secara runtut dan teratur.`,
      kunciJawaban: 'Benar',
      alasanKunci: `Pernyataan tersebut benar karena pemahaman konsep yang kokoh memerlukan pengenalan ciri pokok dan prosedur sistematis.`,
      levelKognitif: level,
      kodeTP: tp.kodeTP,
      lingkupMateri: tp.lingkupMateri,
    };
  } else {
    return {
      nomor,
      pernyataan: `Konsep ${materi} dapat diabaikan ketika menyelesaikan persoalan nyata karena hasil akhir tidak dipengaruhi oleh aturan atau prinsip materinya.`,
      kunciJawaban: 'Salah',
      alasanKunci: `Pernyataan tersebut salah karena penyelesaian persoalan kontekstual wajib berpedoman pada kaidah dan prinsip dasar ${materi}.`,
      levelKognitif: level,
      kodeTP: tp.kodeTP,
      lingkupMateri: tp.lingkupMateri,
    };
  }
}

function generateIsianContent(
  tp: TPItem,
  level: LevelKognitifSoal,
  nomor: number
): {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  alternatifJawaban?: string[];
  levelKognitif: LevelKognitifSoal;
  kodeTP: string;
  lingkupMateri: string;
} {
  const materi = cleanMateri(tp.lingkupMateri);

  if (level === 'Level 1') {
    return {
      nomor,
      pertanyaan: `Istilah atau konsep pokok yang menjadi fokus utama dalam pembelajaran ${materi} adalah ....`,
      kunciJawaban: `${materi}`,
      alternatifJawaban: [`konsep ${materi}`, materi],
      levelKognitif: level,
      kodeTP: tp.kodeTP,
      lingkupMateri: tp.lingkupMateri,
    };
  } else if (level === 'Level 2') {
    return {
      nomor,
      pertanyaan: `Langkah pertama yang wajib dilakukan peserta didik saat menerapkan pemecahan masalah terkait ${materi} adalah ....`,
      kunciJawaban: `Memahami data dan masalah yang diketahui`,
      alternatifJawaban: [`Menganalisis soal`, `Membaca data`, `Mengidentifikasi masalah`],
      levelKognitif: level,
      kodeTP: tp.kodeTP,
      lingkupMateri: tp.lingkupMateri,
    };
  } else {
    return {
      nomor,
      pertanyaan: `Jika terjadi perubahan kondisi dalam penerapan ${materi}, maka dampak utama terhadap kesimpulan yang diperoleh adalah ....`,
      kunciJawaban: `Hasil kesimpulan akan berubah menyesuaikan kondisi baru`,
      alternatifJawaban: [`Menyesuaikan kondisi data baru`, `Perubahan hasil akhir`],
      levelKognitif: level,
      kodeTP: tp.kodeTP,
      lingkupMateri: tp.lingkupMateri,
    };
  }
}

function generateUraianContent(
  tp: TPItem,
  level: LevelKognitifSoal,
  nomor: number,
  bobotMaks: number
): ButirSoalUraian {
  const materi = cleanMateri(tp.lingkupMateri);

  return {
    nomor,
    pertanyaan: `Jelaskan secara lengkap dan sistematis bagaimana penerapan konsep ${materi} dapat membantu memecahkan persoalan yang dihadapi dalam kehidupan sehari-hari di lingkungan sekolah atau rumah! Tuliskan langkah-langkahnya secara terstruktur!`,
    kunciJawaban: `Langkah pemecahan masalah ${materi}:
1. Mengidentifikasi persoalan yang ada dan data yang relevan.
2. Menentukan konsep/aturan dari ${materi} yang tepat digunakan.
3. Melaksanakan langkah pemecahan masalah secara runtut.
4. Memeriksa kembali kebenaran hasil akhir dan menarik kesimpulan rasional.`,
    pedomanPenskoran: [
      { kriteria: 'Menyebutkan identifikasi masalah dan data awal dengan tepat', skorMaks: Math.ceil(bobotMaks * 0.3) },
      { kriteria: 'Menjelaskan langkah penerapan konsep materi secara runtut dan logis', skorMaks: Math.ceil(bobotMaks * 0.4) },
      { kriteria: 'Merumuskan kesimpulan akhir kontekstual dengan argumentasi yang jelas', skorMaks: Math.floor(bobotMaks * 0.3) },
    ],
    bobot: bobotMaks,
    levelKognitif: level,
    kodeTP: tp.kodeTP,
    lingkupMateri: tp.lingkupMateri,
  };
}
