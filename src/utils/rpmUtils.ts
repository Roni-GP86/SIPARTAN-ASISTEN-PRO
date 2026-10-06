import { ModulAjarDocument, RubrikPenilaianRPMItem, SoalEvaluasiRPMItem, LKPDDokumenRPM, AsesmenPertemuanItem } from '../types';
import { findOfficialElementCP, formatTPWithCode } from './curriculumCPResolver';
import { normalizeDPLArray } from '../data/dimensiProfilLulusan';
import {
  isSyntaxMatchingModel,
  detectModelType,
  buildPedagogicalMeetingPlan,
  sanitizeForeignPedagogicalTerms,
  buildModularLKPDActivities,
} from './modelSyntaxEngine';

export interface NormalizedRPMData {
  idData: {
    kompetensiAwal: string;
    karakteristikMurid: string[];
    karakteristikMuridCustom: string;
    kebutuhanMurid: string;
    karakteristikMateri: string;
    dimensiProfilLulusan: string[];
  };
  dsData: {
    capaianPembelajaran: string;
    capaianPembelajaranPerElemen?: {
      elemen: string;
      capaianPembelajaran: string;
      kodeTPList?: string[];
    }[];
    tujuanPembelajaran: string;
    lintasDisiplinIlmu: { mataPelajaran: string; keterkaitan: string }[];
    praktikPedagogis: {
      modelPembelajaran: string;
      pendekatanPembelajaran: string;
      metodePembelajaran: string[];
    };
    mitraPembelajaran: {
      mitraInternal: string[];
      mitraEksternal: string[];
    };
    lingkunganBelajar: {
      lingkunganFisik: string[];
      lingkunganFisikDeskripsi: string;
      budayaBelajar: string[];
    };
    pemanfaatanTeknologi: {
      platformAplikasi: string[];
      perangkatDigital: string[];
      mediaDigital: string[];
    };
  };
  lpData: {
    alokasiWaktuTotal: string;
    kegiatanAwal: {
      alokasiMenit: string;
      deskripsi: string;
      poinAktivitas: string[];
    };
    kegiatanInti: {
      alokasiMenit: string;
      modelPembelajaran: string;
      sintaks: {
        tahapKe: number;
        faseSintaks: string;
        alokasiMenit: string;
        aktivitas: string;
        pengalamanBelajar?: string;
        prinsipPembelajaran?: string;
      }[];
    };
    kegiatanAkhir: {
      alokasiMenit: string;
      deskripsi: string;
      poinAktivitas: string[];
    };
  };
  asData: {
    diagnostik: { bentukTeknik: string; caraSumber: string };
    formatif: { bentukTeknik: string; caraSumber: string };
    sumatif: { bentukTeknik: string; caraSumber: string };
  };
  rbData: RubrikPenilaianRPMItem[];
  lkData: LKPDDokumenRPM;
  soData: SoalEvaluasiRPMItem[];
}

export function normalizeRPMData(
  modul: ModulAjarDocument,
  extra?: { alokasiWaktu?: string; topikMateri?: string }
): NormalizedRPMData {
  const topikVal = extra?.topikMateri || modul.topikMateri || modul.identitas?.mataPelajaran || 'Materi Pembelajaran';
  const alokasiVal = extra?.alokasiWaktu || modul.alokasiWaktuPertemuan || modul.identitas?.alokasiWaktuModul || '2 x 35 Menit (1 Pertemuan)';
  const { count } = parseTotalJPAndCount(modul, alokasiVal);

  // 1. Normalisasi Identifikasi (B)
  const rawId = (modul.identifikasiRPM as any) || {};
  const idPeserta = rawId.identifikasiPesertaDidik || {};

  const kompetensiAwal =
    idPeserta.kompetensiAwal ||
    rawId.kompetensiAwal ||
    (Array.isArray(modul.kompetensiAwal) && modul.kompetensiAwal.length > 0
      ? modul.kompetensiAwal.join('; ')
      : `Peserta didik telah memiliki pemahaman dasar dan intuisi awal terkait ${topikVal}.`);

  const rawKM = idPeserta.karakteristikPesertaDidik || rawId.karakteristikPesertaDidik;
  const karakteristikMurid: string[] =
    Array.isArray(rawKM) && rawKM.length > 0
      ? rawKM
      : ['Visual', 'Auditori', 'Kinestetik', 'Suka Belajar Kontekstual'];

  const karakteristikMuridCustom =
    idPeserta.karakteristikMuridCustom || rawId.karakteristikMuridCustom || '';

  const kebutuhanMurid =
    idPeserta.kebutuhanMurid ||
    rawId.kebutuhanMurid ||
    'Bimbingan bertahap, media peraga konkret, dan kerja sama kelompok.';

  const karakteristikMateri =
    rawId.karakteristikMateri ||
    `Materi ${topikVal} bersifat konseptual dan prosedural yang aplikatif serta dekat dengan kehidupan sehari-hari murid.`;

  const rawDPL = rawId.dimensiProfilLulusan || modul.profilPelajarPancasila;
  const dimensiProfilLulusan: string[] = normalizeDPLArray(
    Array.isArray(rawDPL) && rawDPL.length > 0 ? rawDPL : ['Penalaran Kritis', 'Kemandirian', 'Kolaborasi']
  );

  const idData = {
    kompetensiAwal,
    karakteristikMurid,
    karakteristikMuridCustom,
    kebutuhanMurid,
    karakteristikMateri,
    dimensiProfilLulusan,
  };

  // 2. Normalisasi Desain Pembelajaran (C)
  const rawDs = (modul.desainPembelajaranRPM as any) || {};
  let perElemenList: Array<{ elemen: string; capaianPembelajaran: string; kodeTPList?: string[] }> | undefined =
    rawDs.capaianPembelajaranPerElemen;

  let cpVal =
    rawDs.capaianPembelajaran ||
    (modul as any).capaianPembelajaran || '';

  // If perElemenList is not defined or empty, resolve from module element and official database
  if (!perElemenList || perElemenList.length === 0) {
    const elName = modul.elemen || 'Elemen Pembelajaran';
    const officialCP = findOfficialElementCP(elName, modul.identitas?.mataPelajaran, modul.identitas?.fase);
    if (officialCP) {
      perElemenList = [
        {
          elemen: elName,
          capaianPembelajaran: officialCP,
          kodeTPList: [],
        },
      ];
      if (!cpVal || cpVal.length < 50 || cpVal.includes('Peserta didik mampu memahami dan menerapkan konsep')) {
        cpVal = `Elemen: ${elName}\n${officialCP}`;
      }
    }
  }

  if (!cpVal) {
    cpVal =
      Array.isArray(modul.tujuanPembelajaranSpesifik) && modul.tujuanPembelajaranSpesifik.length > 0
        ? modul.tujuanPembelajaranSpesifik.join('. ')
        : `Peserta didik mampu memahami dan menerapkan konsep ${topikVal} dalam memecahkan masalah kontekstual.`;
  }

  const rawTPVal =
    rawDs.tujuanPembelajaran ||
    (Array.isArray(modul.tujuanPembelajaranSpesifik) && modul.tujuanPembelajaranSpesifik.length > 0
      ? modul.tujuanPembelajaranSpesifik.join('; ')
      : `Menjelaskan dan mengaplikasikan konsep dasar ${topikVal}`);

  let tpCode = '5.1';
  if (perElemenList && perElemenList.length > 0 && perElemenList[0].kodeTPList && perElemenList[0].kodeTPList[0]) {
    tpCode = perElemenList[0].kodeTPList[0];
  } else if (modul.kegiatanPembelajaran?.[0]?.fokusTP) {
    const m = modul.kegiatanPembelajaran[0].fokusTP.match(/\b(\d+\.\d+)\b/);
    if (m) tpCode = m[1];
  } else if (modul.identitas?.fase === 'Fase A') {
    tpCode = '1.1';
  } else if (modul.identitas?.fase === 'Fase B') {
    tpCode = '3.1';
  }

  const tpVal = formatTPWithCode(tpCode, rawTPVal);

  const rawLDI = rawDs.lintasDisiplinIlmu;
  const cleanedLDI: { mataPelajaran: string; keterkaitan: string }[] = [];
  for (const item of Array.isArray(rawLDI) ? rawLDI : []) {
    if (!item || !item.mataPelajaran) continue;
    const mp = String(item.mataPelajaran).trim();
    if (mp.toLowerCase().includes('ipas / seni rupa') || mp.toLowerCase().includes('ipas/seni rupa')) {
      cleanedLDI.push({
        mataPelajaran: 'Seni Rupa',
        keterkaitan: item.keterkaitan || 'Menyajikan hasil karya visual/pola bentuk secara estetis, kreatif, dan rapi.',
      });
    } else if (mp.includes('/')) {
      const parts = mp.split('/').map((s: string) => s.trim()).filter(Boolean);
      cleanedLDI.push({
        mataPelajaran: parts[0] || 'Bahasa Indonesia',
        keterkaitan: item.keterkaitan || 'Penguatan literasi komunikasi dan penalaran terstruktur.',
      });
    } else {
      cleanedLDI.push({
        mataPelajaran: mp,
        keterkaitan: item.keterkaitan || 'Penguatan pemahaman konsep dan penalaran terstruktur.',
      });
    }
  }

  let lintasDisiplinIlmu: { mataPelajaran: string; keterkaitan: string }[] = [];
  if (cleanedLDI.length >= 2) {
    lintasDisiplinIlmu = cleanedLDI.slice(0, 2);
  } else if (cleanedLDI.length === 1) {
    const firstMP = String(cleanedLDI[0]?.mataPelajaran || '').toLowerCase();
    const secondSubject = firstMP.includes('bahasa')
      ? { mataPelajaran: 'Pendidikan Pancasila', keterkaitan: 'Membiasakan gotong royong, kerja sama, dan musyawarah dalam diskusi kelompok.' }
      : { mataPelajaran: 'Bahasa Indonesia', keterkaitan: 'Meningkatkan keterampilan literasi menyimak instruksi dan menyajikan gagasan secara runtut.' };
    lintasDisiplinIlmu = [cleanedLDI[0], secondSubject];
  } else {
    lintasDisiplinIlmu = [
      { mataPelajaran: 'Bahasa Indonesia', keterkaitan: 'Keterampilan menyimak instruksi dan menyampaikan pendapat santun secara tertulis maupun lisan.' },
      { mataPelajaran: 'Pendidikan Pancasila', keterkaitan: 'Sikap gotong royong, saling menghargai pendapat, dan musyawarah mufakat dalam kelompok.' },
    ];
  }

  const rawMetode = rawDs.praktikPedagogis?.metodePembelajaran;
  const metodePembelajaran: string[] =
    Array.isArray(rawMetode)
      ? rawMetode
      : ['Eksplorasi Kontekstual', 'Diskusi Kelompok Terbimbing', 'Praktik Langsung', 'Tanya Jawab'];

  const hasMitraConfig = Boolean(rawDs.mitraPembelajaran);
  const rawMitraInt = rawDs.mitraPembelajaran?.mitraInternal;
  const mitraInternal: string[] = Array.isArray(rawMitraInt)
    ? rawMitraInt
    : hasMitraConfig
    ? []
    : ['Rekan Sejawat Guru', 'Tenaga Kependidikan', 'Orang Tua / Wali Murid'];

  const rawMitraEks = rawDs.mitraPembelajaran?.mitraEksternal;
  const mitraEksternal: string[] = Array.isArray(rawMitraEks)
    ? rawMitraEks
    : hasMitraConfig
    ? []
    : ['Komunitas Lingkungan Sekitar Sekolah'];

  const rawLingkFisik = rawDs.lingkunganBelajar?.lingkunganFisik;
  const lingkunganFisik: string[] =
    Array.isArray(rawLingkFisik) && rawLingkFisik.length > 0
      ? rawLingkFisik
      : ['Ruang Kelas Fleksibel', 'Sudut Belajar Eksploratif'];

  const rawBudaya = rawDs.lingkunganBelajar?.budayaBelajar;
  const budayaBelajar: string[] =
    Array.isArray(rawBudaya) && rawBudaya.length > 0
      ? rawBudaya
      : ['Apresiatif & Inklusif', 'Gotong Royong & Saling Menghargai', 'Rasa Ingin Tahu Tinggi'];

  const hasTechConfig = Boolean(rawDs.pemanfaatanTeknologi);
  const rawPlat = rawDs.pemanfaatanTeknologi?.platformAplikasi;
  const platformAplikasi: string[] = Array.isArray(rawPlat)
    ? rawPlat
    : hasTechConfig
    ? []
    : ['Media Pembelajaran Visual / Video Edukasi', 'Lembar Kerja Berbasis Gambar'];

  const rawPerangkat = rawDs.pemanfaatanTeknologi?.perangkatDigital;
  const perangkatDigital: string[] = Array.isArray(rawPerangkat)
    ? rawPerangkat
    : hasTechConfig
    ? []
    : ['Laptop / Proyektor', 'Audio Speaker'];

  const rawMediaDig = rawDs.pemanfaatanTeknologi?.mediaDigital;
  const mediaDigital: string[] = Array.isArray(rawMediaDig)
    ? rawMediaDig
    : hasTechConfig
    ? []
    : ['Slide Presentasi Kontekstual', 'Gambar & Infografis Edukatif'];

  const dsData = {
    capaianPembelajaran: cpVal,
    capaianPembelajaranPerElemen: perElemenList,
    tujuanPembelajaran: tpVal,
    lintasDisiplinIlmu,
    praktikPedagogis: {
      modelPembelajaran: rawDs.praktikPedagogis?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL)',
      pendekatanPembelajaran: rawDs.praktikPedagogis?.pendekatanPembelajaran || 'Pembelajaran Mendalam (Berkesadaran, Bermakna, dan Menggembirakan)',
      metodePembelajaran,
    },
    mitraPembelajaran: {
      mitraInternal,
      mitraEksternal,
    },
    lingkunganBelajar: {
      lingkunganFisik,
      lingkunganFisikDeskripsi: rawDs.lingkunganBelajar?.lingkunganFisikDeskripsi || 'Penataan meja kursi memudahkan kolaborasi kelompok kecil dan interaksi aktif.',
      budayaBelajar,
    },
    pemanfaatanTeknologi: {
      platformAplikasi,
      perangkatDigital,
      mediaDigital,
    },
  };

  // 3. Normalisasi Langkah Pembelajaran (D)
  const rawLp = modul.langkahPembelajaranRPM as any;
  let awalRow: any = null;
  let intiRow: any = null;
  let akhirRow: any = null;

  if (Array.isArray(rawLp)) {
    awalRow = rawLp.find((r: any) => r.kegiatan === 'Kegiatan Awal' || String(r.kegiatan || '').toLowerCase().includes('awal') || String(r.kegiatan || '').toLowerCase().includes('pendahuluan')) || rawLp[0];
    intiRow = rawLp.find((r: any) => r.kegiatan === 'Kegiatan Inti' || String(r.kegiatan || '').toLowerCase().includes('inti')) || rawLp[1];
    akhirRow = rawLp.find((r: any) => r.kegiatan === 'Kegiatan Akhir' || String(r.kegiatan || '').toLowerCase().includes('akhir') || String(r.kegiatan || '').toLowerCase().includes('penutup')) || rawLp[2];
  } else if (rawLp && typeof rawLp === 'object') {
    awalRow = rawLp.kegiatanAwal;
    intiRow = rawLp.kegiatanInti;
    akhirRow = rawLp.kegiatanAkhir;
  }

  // Parse Kegiatan Awal
  let awalDeskripsi = awalRow?.deskripsi || '';
  let awalPoin = Array.isArray(awalRow?.poinAktivitas) && awalRow.poinAktivitas.length > 0
    ? awalRow.poinAktivitas.map((p: string) => cleanActivityText(p))
    : [];
  if (awalPoin.length === 0 && awalDeskripsi) {
    const lines = awalDeskripsi.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length > 1) {
      awalPoin = lines.map((l: string) => cleanActivityText(l));
      awalDeskripsi = '';
    }
  } else if (awalPoin.length > 0 && awalDeskripsi) {
    const cleanDesk = awalDeskripsi.replace(/[\d\.\-\•\*\s]/g, '').toLowerCase();
    const cleanPoin = awalPoin.join('').replace(/[\d\.\-\•\*\s]/g, '').toLowerCase();
    if (cleanDesk === cleanPoin || (cleanDesk.length > 0 && cleanPoin.includes(cleanDesk))) {
      awalDeskripsi = '';
    }
  }
  const defaultStage1 = buildPedagogicalMeetingPlan(1, 1, topikVal, rawDs.praktikPedagogis?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL)', tpVal, {
    mediaList: mediaDigital.length > 0 ? mediaDigital : undefined,
    perangkatList: perangkatDigital.length > 0 ? perangkatDigital : undefined,
    platformList: platformAplikasi.length > 0 ? platformAplikasi : undefined,
    metodeList: metodePembelajaran,
    pendekatan: dsData.praktikPedagogis.pendekatanPembelajaran,
  });

  if (awalPoin.length === 0 && !awalDeskripsi) {
    awalPoin = defaultStage1.pendahuluan;
  }

  // Parse Kegiatan Akhir
  let akhirDeskripsi = akhirRow?.deskripsi || '';
  let akhirPoin = Array.isArray(akhirRow?.poinAktivitas) && akhirRow.poinAktivitas.length > 0
    ? akhirRow.poinAktivitas.map((p: string) => cleanActivityText(p))
    : [];
  if (akhirPoin.length === 0 && akhirDeskripsi) {
    const lines = akhirDeskripsi.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length > 1) {
      akhirPoin = lines.map((l: string) => cleanActivityText(l));
      akhirDeskripsi = '';
    }
  } else if (akhirPoin.length > 0 && akhirDeskripsi) {
    const cleanDesk = akhirDeskripsi.replace(/[\d\.\-\•\*\s]/g, '').toLowerCase();
    const cleanPoin = akhirPoin.join('').replace(/[\d\.\-\•\*\s]/g, '').toLowerCase();
    if (cleanDesk === cleanPoin || (cleanDesk.length > 0 && cleanPoin.includes(cleanDesk))) {
      akhirDeskripsi = '';
    }
  }
  if (akhirPoin.length === 0 && !akhirDeskripsi) {
    akhirPoin = defaultStage1.penutup;
  }

  // Parse Kegiatan Inti & Sintaks
  const chosenModel = rawDs.praktikPedagogis?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL)';
  let sintaksList: any[] = [];
  const rawSintaks = intiRow?.sintaksList || intiRow?.sintaks;
  const isRawMatching = Array.isArray(rawSintaks) && rawSintaks.length > 0 && isSyntaxMatchingModel(String(rawSintaks[0]?.faseSintaks || ''), chosenModel);
  const isMeetMatching = Array.isArray(modul.kegiatanPembelajaran) &&
    modul.kegiatanPembelajaran.length > 0 &&
    Array.isArray(modul.kegiatanPembelajaran[0]?.kegiatanInti) &&
    modul.kegiatanPembelajaran[0].kegiatanInti.length > 0 &&
    isSyntaxMatchingModel(String(modul.kegiatanPembelajaran[0].kegiatanInti[0]?.faseSintaks || ''), chosenModel);

  if (isRawMatching) {
    sintaksList = rawSintaks.map((s: any, idx: number) => ({
      tahapKe: s.tahapKe || idx + 1,
      faseSintaks: sanitizeForeignPedagogicalTerms(s.faseSintaks || `Sintak ${idx + 1}`),
      alokasiMenit: s.alokasiMenit || s.waktu || '10 Menit',
      aktivitas: sanitizeForeignPedagogicalTerms(s.aktivitas || (s.aktivitasGuru ? `Guru: ${s.aktivitasGuru}. Murid: ${s.aktivitasSiswa || ''}` : '')),
      aktivitasGuru: sanitizeForeignPedagogicalTerms(s.aktivitasGuru || ''),
      aktivitasSiswa: sanitizeForeignPedagogicalTerms(s.aktivitasSiswa || ''),
      pengalamanBelajar: sanitizeForeignPedagogicalTerms(s.pengalamanBelajar || 'Bermakna'),
      prinsipPembelajaran: sanitizeForeignPedagogicalTerms(s.prinsipPembelajaran || 'Memahami & Mengaplikasikan'),
    }));
  } else if (isMeetMatching) {
    sintaksList = modul.kegiatanPembelajaran[0].kegiatanInti.map((k: any, i: number) => ({
      tahapKe: i + 1,
      faseSintaks: sanitizeForeignPedagogicalTerms(k.faseSintaks || `Tahap ${i + 1}`),
      alokasiMenit: k.alokasiMenit || '10-15 Menit',
      aktivitas: sanitizeForeignPedagogicalTerms(k.aktivitas || `Guru: ${k.aktivitasGuru || ''}. Murid: ${k.aktivitasSiswa || ''}`),
      aktivitasGuru: sanitizeForeignPedagogicalTerms(k.aktivitasGuru || ''),
      aktivitasSiswa: sanitizeForeignPedagogicalTerms(k.aktivitasSiswa || ''),
      pengalamanBelajar: sanitizeForeignPedagogicalTerms(k.pengalamanBelajar || 'Bermakna & Berkesadaran'),
      prinsipPembelajaran: sanitizeForeignPedagogicalTerms(k.prinsipPembelajaran || 'Memahami konsep secara mendalam & Mengaplikasikannya dalam konteks nyata'),
    }));
  } else {
    sintaksList = defaultStage1.kegiatanInti.map((s, idx) => ({
      tahapKe: idx + 1,
      faseSintaks: s.faseSintaks,
      alokasiMenit: s.alokasiMenit,
      aktivitas: `Guru: ${s.aktivitasGuru}. Murid: ${s.aktivitasSiswa}`,
      aktivitasGuru: s.aktivitasGuru,
      aktivitasSiswa: s.aktivitasSiswa,
      pengalamanBelajar: s.pengalamanBelajar,
      prinsipPembelajaran: s.prinsipPembelajaran,
    }));
  }

  const lpData = {
    alokasiWaktuTotal: alokasiVal,
    kegiatanAwal: {
      alokasiMenit: awalRow?.waktu || awalRow?.alokasiMenit || '10 Menit',
      deskripsi: awalDeskripsi,
      poinAktivitas: awalPoin,
    },
    kegiatanInti: {
      alokasiMenit: intiRow?.waktu || intiRow?.alokasiMenit || '50 Menit',
      modelPembelajaran: rawDs.praktikPedagogis?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL)',
      sintaks: sintaksList,
    },
    kegiatanAkhir: {
      alokasiMenit: akhirRow?.waktu || akhirRow?.alokasiMenit || '10 Menit',
      deskripsi: akhirDeskripsi,
      poinAktivitas: akhirPoin,
    },
  };

  // 4. Normalisasi Asesmen (E)
  const rawAs = (modul.asesmenRPM as any) || {};
  const asData = {
    diagnostik: {
      waktuPelaksanaan: rawAs.diagnostik?.waktuPelaksanaan || 'Pertemuan ke-1 (Kegiatan Awal / Apersepsi Pemantik)',
      bentukTeknik: rawAs.diagnostik?.bentukTeknik || modul.asesmen?.diagnostik?.teknik || 'Tanya Jawab Pemantik Lisan & Observasi Kesiapan Belajar Awal',
      caraSumber: rawAs.diagnostik?.caraSumber || 'Dilakukan di awal kegiatan pertemuan pertama dengan pertanyaan pemantik dan apersepsi lisan guru untuk memetakan kesiapan murid.',
      daftarInstrumen: Array.isArray(rawAs.diagnostik?.daftarInstrumen) && rawAs.diagnostik.daftarInstrumen.length > 0
        ? rawAs.diagnostik.daftarInstrumen
        : [
            `Pertanyaan Pemantik: "Sebutkan 2 contoh hal terkait ${topikVal} yang pernah kalian temui di sekitar rumah atau sekolah!"`,
            'Lembar Cek Kesiapan: Memetakan pemahaman prasyarat awal murid sebelum kegiatan inti kelompok.',
          ],
    },
    formatif: {
      waktuPelaksanaan: rawAs.formatif?.waktuPelaksanaan || `Pertemuan ke-1 sampai Pertemuan ke-${count} (Terpadu di setiap Kegiatan Inti & Akhir)`,
      bentukTeknik: rawAs.formatif?.bentukTeknik || modul.asesmen?.formatif?.teknik || 'Observasi Kinerja Kolaborasi & Penilaian Aktivitas Kelompok pada LKPD',
      caraSumber: rawAs.formatif?.caraSumber || `Dilakukan berkelanjutan selama proses kegiatan pada Pertemuan 1 s.d. ${count} menggunakan rubrik observasi dan pengerjaan LKPD per pertemuan.`,
      rincianPerPertemuan: Array.isArray(rawAs.formatif?.rincianPerPertemuan) && rawAs.formatif.rincianPerPertemuan.length > 0
        ? rawAs.formatif.rincianPerPertemuan
        : Array.from({ length: count }).map((_, idx) => {
            const m = idx + 1;
            const focusName = m === 1
              ? 'Eksplorasi Konsep Awal & Pengamatan Fenomena'
              : m === count
              ? 'Keterampilan Komunikasi, Presentasi Karya & Refleksi Diri'
              : m === 2
              ? 'Penyelidikan Mandiri & Pengumpulan Data Konkret'
              : m === 3
              ? 'Pengolahan Data & Analisis Solusi Kelompok'
              : 'Perancangan Solusi & Uji Coba Karya';
            return {
              pertemuanKe: m,
              jenisAsesmen: m === 1 ? 'Diagnostik & Formatif' : m === count ? 'Formatif & Sumatif' : 'Formatif',
              fokusAktivitas: focusName,
              teknikBentuk: m === count ? 'Rubrik Presentasi & Refleksi' : 'Observasi Kinerja & LKPD',
              buktiBelajar: `Catatan isian LKPD Aktivitas Pertemuan ${m} dan keaktifan kelompok`,
            };
          }),
    },
    sumatif: {
      waktuPelaksanaan: rawAs.sumatif?.waktuPelaksanaan || `Khusus Pertemuan Terakhir (Pertemuan ke-${count}) setelah seluruh lingkup materi selesai`,
      bentukTeknik: rawAs.sumatif?.bentukTeknik || modul.asesmen?.sumatif?.teknik || 'Tes Tertulis Mandiri Penalaran Mendalam (HOTS) & Rubrik Unjuk Kerja Produk Akhir',
      caraSumber: rawAs.sumatif?.caraSumber || `Dilakukan pada akhir pertemuan ke-${count} setelah seluruh materi TP selesai untuk mengukur ketercapaian Tujuan Pembelajaran secara individual (KKTP).`,
      daftarInstrumen: Array.isArray(rawAs.sumatif?.daftarInstrumen) && rawAs.sumatif.daftarInstrumen.length > 0
        ? rawAs.sumatif.daftarInstrumen
        : [
            '5 Butir Soal Evaluasi Penalaran HOTS Kontekstual',
            'Rubrik Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)',
            'Kunci Jawaban dan Pedoman Penskoran Nilai (Skala 0-100)',
          ],
    },
    rincianPerPertemuan: rawAs.rincianPerPertemuan || rawAs.formatif?.rincianPerPertemuan || [],
  };

  // 5. Normalisasi Rubrik Penilaian (F)
  const defaultRubrik: RubrikPenilaianRPMItem[] = [
    {
      nomor: 1,
      aspekPenilaian: 'Pemahaman Konsep',
      kriteria: 'Kemampuan menjelaskan dan menerapkan konsep inti secara akurat.',
      skor4: 'Menjelaskan konsep sangat tepat, lengkap, dan mampu memberi contoh kontekstual.',
      skor3: 'Menjelaskan konsep dengan tepat dan lengkap dengan sedikit bantuan.',
      skor2: 'Menjelaskan sebagian konsep dengan tepat namun masih membutuhkan bimbingan.',
      skor1: 'Belum mampu menjelaskan konsep secara tepat walau sudah dibimbing.',
    },
    {
      nomor: 2,
      aspekPenilaian: 'Keterampilan Penyelidikan (LKPD)',
      kriteria: 'Ketelitian dan keaktifan menyelesaikan instruksi kerja dan analisis data.',
      skor4: 'Langkah kerja sangat runtut, data akurat, dan analisis jawaban sangat mendalam.',
      skor3: 'Langkah kerja runtut, data akurat, dan analisis jawaban tepat.',
      skor2: 'Langkah kerja cukup runtut, terdapat sebagian data yang kurang lengkap.',
      skor1: 'Langkah kerja belum runtut dan memerlukan bimbingan intensif.',
    },
    {
      nomor: 3,
      aspekPenilaian: 'Kolaborasi & Gotong Royong',
      kriteria: 'Partisipasi aktif dalam kelompok, saling mendengarkan, dan menghargai pendapat.',
      skor4: 'Sangat aktif berbagi peran, inisiatif tinggi, dan sangat menghargai teman.',
      skor3: 'Aktif bekerjasama dan menjalankan peran yang diberikan dengan baik.',
      skor2: 'Cukup berpartisipasi dalam kelompok namun masih sesekali pasif.',
      skor1: 'Kurang terlibat dalam kerjasama kelompok dan memerlukan dorongan guru.',
    },
    {
      nomor: 4,
      aspekPenilaian: 'Komunikasi / Presentasi',
      kriteria: 'Kejelasan penyampaian hasil kerja dan ketepatan merespons pertanyaan.',
      skor4: 'Menyampaikan hasil kerja dengan sangat jelas, percaya diri, dan argumentasi kuat.',
      skor3: 'Menyampaikan hasil kerja dengan jelas dan percaya diri.',
      skor2: 'Menyampaikan hasil kerja cukup jelas namun masih ragu-ragu.',
      skor1: 'Belum mampu menyampaikan hasil kerja dengan jelas.',
    },
  ];
  const rawRb = modul.rubrikPenilaianRPM;
  const rbData = Array.isArray(rawRb) && rawRb.length > 0 ? rawRb : defaultRubrik;

  // 6. Normalisasi LKPD (G)
  const rawLk = (modul.lkpdRPM as any) || {};
  const lkData: LKPDDokumenRPM = {
    judulLKPD: rawLk.judulLKPD || `LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topikVal.toUpperCase()}`,
    petunjuk: Array.isArray(rawLk.petunjuk) && rawLk.petunjuk.length > 0 ? rawLk.petunjuk : [
      'Tuliskan nama kelompok dan nama anggota (maksimal 6 siswa) pada kolom identitas yang tersedia.',
      'Bacalah setiap petunjuk langkah kerja dengan cermat dan gembira bersama kelompokmu.',
      'Diskusikan bersama teman sekelompokmu dan bagi peran kerja secara adil dan rukun.',
      'Tanyakan kepada guru jika ada langkah kegiatan yang belum kamu pahami.',
    ],
    langkahKerjaAwal: Array.isArray(rawLk.langkahKerjaAwal) && rawLk.langkahKerjaAwal.length > 0 ? rawLk.langkahKerjaAwal : [
      { nomor: 1, langkahKerja: 'Amati bahan, gambar, atau media stimulasi yang disiapkan di meja belajarmu.', hasilJawabanPlaceholder: 'Tuliskan objek atau fenomena apa yang kalian amati bersama kelompok.' },
      { nomor: 2, langkahKerja: 'Lakukan eksplorasi atau pengukuran sesuai panduan percobaan/pengamatan.', hasilJawabanPlaceholder: 'Catat data atau temuan hasil eksplorasi secara teliti.' },
      { nomor: 3, langkahKerja: 'Diskusikan pola atau hubungan konsep yang muncul dari data yang diperoleh.', hasilJawabanPlaceholder: 'Tuliskan pola atau hubungan yang kalian temukan.' },
    ],
    kegiatanKelompokJudul: rawLk.kegiatanKelompokJudul || 'Aktivitas Kelompok & Pemecahan Masalah',
    kegiatanKelompokInstruksi: rawLk.kegiatanKelompokInstruksi || 'Diskusikan bersama kelompok dan selesaikan tantangan analisis berikut ini:',
    pertanyaanAnalisis: Array.isArray(rawLk.pertanyaanAnalisis) && rawLk.pertanyaanAnalisis.length > 0 ? rawLk.pertanyaanAnalisis : [
      { nomor: 1, pertanyaan: `Berdasarkan pengamatan kelompok, mengapa materi "${topikVal}" sangat penting dalam kehidupan sehari-hari? Berikan 2 contoh konkretnya!`, hasilPlaceholder: 'Tuliskan jawaban analisis kelompokmu di sini...' },
      { nomor: 2, pertanyaan: 'Bagaimana solusi atau langkah kerja terbaik jika kalian menghadapi tantangan serupa di lingkungan nyata?', hasilPlaceholder: 'Tuliskan rumusan solusi kelompokmu di sini...' },
    ],
    refleksiDiriKelompok: Array.isArray(rawLk.refleksiDiriKelompok) && rawLk.refleksiDiriKelompok.length > 0 ? rawLk.refleksiDiriKelompok : [
      { nomor: 1, pertanyaan: 'Apa hal paling berharga dan baru yang kami pelajari hari ini?', hasilPlaceholder: 'Refleksi kelompok...' },
      { nomor: 2, pertanyaan: 'Bagaimana kerjasama kelompok kami berlangsung dan apa yang perlu ditingkatkan?', hasilPlaceholder: 'Refleksi kerjasama...' },
    ],
    aktivitasPerPertemuan: Array.isArray(rawLk.aktivitasPerPertemuan) && rawLk.aktivitasPerPertemuan.length > 0
      ? rawLk.aktivitasPerPertemuan
      : buildModularLKPDActivities(count, topikVal, rawDs.praktikPedagogis?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL)'),
  };

  // 7. Normalisasi Soal Evaluasi (H)
  const defaultSoal: SoalEvaluasiRPMItem[] = [
    { nomor: 1, pertanyaan: `Jelaskan pengertian dan konsep utama dari ${topikVal} menggunakan bahasamu sendiri!`, kunciJawaban: `Konsep utama dari ${topikVal} mencakup pemahaman prinsip dasar serta penerapannya dalam memecahkan masalah kontekstual.` },
    { nomor: 2, pertanyaan: `Berikan 2 contoh penerapan konsep ${topikVal} yang dapat kamu temukan dalam kehidupan sehari-hari di rumah atau sekolah!`, kunciJawaban: `Penerapan dapat dilihat dari aktivitas sehari-hari yang membutuhkan pemahaman konsep tersebut secara praktis.` },
    { nomor: 3, pertanyaan: `Jika kamu diminta membantu teman yang belum memahami ${topikVal}, langkah atau penjelasan apa yang akan kamu berikan?`, kunciJawaban: `Menjelaskan mulai dari hal yang paling konkret atau analogi nyata, kemudian menghubungkannya dengan konsep inti.` },
    { nomor: 4, pertanyaan: `Tuliskan langkah-langkah sistematis yang kalian lakukan ketika menyelesaikan LKPD hari ini!`, kunciJawaban: `Membaca petunjuk, membagi tugas, mengamati fenomena, mencatat data hasil penyelidikan, dan merumuskan simpulan bersama.` },
    { nomor: 5, pertanyaan: `Sikap apa saja yang kalian latih selama kegiatan diskusi kelompok hari ini?`, kunciJawaban: `Gotong royong, saling menghargai pendapat teman, bernalar kritis, dan jujur dalam mencatat data.` },
  ];
  const rawSo = modul.soalEvaluasiRPM;
  const soData = Array.isArray(rawSo) && rawSo.length > 0 ? rawSo : defaultSoal;

  return {
    idData,
    dsData,
    lpData,
    asData,
    rbData,
    lkData,
    soData,
  };
}

/**
 * Utility to clean redundant parenthetical information for official documents
 * e.g., "Pembelajaran Mendalam (Deep Learning - Mindful, Meaningful, Joyful)" -> "Pembelajaran Mendalam"
 */
export function cleanParentheses(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Badge style details for Deep Learning Principles
 */
export interface PrinsipBadgeInfo {
  emoji: string;
  bgClass: string;
  hexBg: string;
  hexText: string;
  hexBorder: string;
}

export function getPrinsipBadgeInfo(prinsipText: string): PrinsipBadgeInfo {
  const lower = (prinsipText || '').toLowerCase();

  if (lower.includes('sadar') || lower.includes('mindful')) {
    return {
      emoji: '🧠',
      bgClass: 'bg-purple-100 text-purple-900 border-purple-300',
      hexBg: '#f3e8ff',
      hexText: '#581c87',
      hexBorder: '#d8b4fe',
    };
  }
  if (lower.includes('makna') || lower.includes('meaningful')) {
    return {
      emoji: '💡',
      bgClass: 'bg-amber-100 text-amber-900 border-amber-300',
      hexBg: '#fef3c7',
      hexText: '#78350f',
      hexBorder: '#fcd34d',
    };
  }
  if (lower.includes('gembira') || lower.includes('senang') || lower.includes('joyful')) {
    return {
      emoji: '😊',
      bgClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      hexBg: '#d1fae5',
      hexText: '#064e3b',
      hexBorder: '#6ee7b7',
    };
  }
  if (lower.includes('aplikasi') || lower.includes('terap') || lower.includes('tindakan')) {
    return {
      emoji: '⚙️',
      bgClass: 'bg-teal-100 text-teal-900 border-teal-300',
      hexBg: '#ccfbf1',
      hexText: '#134e4a',
      hexBorder: '#5eead4',
    };
  }
  if (lower.includes('refleksi') || lower.includes('renung')) {
    return {
      emoji: '🪞',
      bgClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      hexBg: '#e0e7ff',
      hexText: '#312e81',
      hexBorder: '#a5b4fc',
    };
  }
  if (lower.includes('paham') || lower.includes('mengerti') || lower.includes('analisis')) {
    return {
      emoji: '🔍',
      bgClass: 'bg-blue-100 text-blue-900 border-blue-300',
      hexBg: '#dbeafe',
      hexText: '#1e3a8a',
      hexBorder: '#93c5fd',
    };
  }
  if (lower.includes('murid') || lower.includes('siswa') || lower.includes('pusat')) {
    return {
      emoji: '🎯',
      bgClass: 'bg-rose-100 text-rose-900 border-rose-300',
      hexBg: '#ffe4e6',
      hexText: '#881337',
      hexBorder: '#fda4af',
    };
  }
  if (lower.includes('kolaborasi') || lower.includes('kelompok') || lower.includes('gotong')) {
    return {
      emoji: '🤝',
      bgClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      hexBg: '#cffafe',
      hexText: '#164e63',
      hexBorder: '#67e8f9',
    };
  }

  // Default clean amber/gold badge
  return {
    emoji: '💎',
    bgClass: 'bg-amber-100 text-amber-900 border-amber-300',
    hexBg: '#fef3c7',
    hexText: '#78350f',
    hexBorder: '#fcd34d',
  };
}

export function getPengalamanBadgeInfo(pengalamanText: string): PrinsipBadgeInfo {
  const lower = (pengalamanText || '').toLowerCase();
  if (lower.includes('refleksi') || lower.includes('renung') || lower.includes('evaluasi')) {
    return {
      emoji: '🪞',
      bgClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      hexBg: '#ecfdf5',
      hexText: '#065f46',
      hexBorder: '#6ee7b7',
    };
  }
  if (lower.includes('aplikasi') || lower.includes('terap') || lower.includes('praktik') || lower.includes('buat') || lower.includes('karya')) {
    return {
      emoji: '🚀',
      bgClass: 'bg-cyan-50 text-cyan-900 border-cyan-300',
      hexBg: '#ecfeff',
      hexText: '#155e75',
      hexBorder: '#67e8f9',
    };
  }
  // default: memahami / understanding
  return {
    emoji: '🔍',
    bgClass: 'bg-sky-50 text-sky-900 border-sky-300',
    hexBg: '#f0f9ff',
    hexText: '#0369a1',
    hexBorder: '#7dd3fc',
  };
}

/**
 * Menghitung distribusi JP per pertemuan yang adil, pedagogis, dan matematis.
 * ATURAN BAKU:
 * - Minimal setiap pertemuan = 2 JP, maksimal = 3 JP.
 * - Total seluruh pertemuan tepat sama dengan totalJP.
 * - Sisa pembagian (misal 11 JP / 5 pertemuan = base 2 JP, sisa 1 JP)
 *   dialokasikan ke pertemuan-pertemuan akhir, sehingga membentuk pola (2-2-2-2-3).
 * Contoh:
 * - totalJP = 12 -> 6 pertemuan: [2, 2, 2, 2, 2, 2] (total 12 JP)
 * - totalJP = 11 -> 5 pertemuan: [2, 2, 2, 2, 3] (total 11 JP)
 * - totalJP = 8  -> 4 pertemuan: [2, 2, 2, 2] (total 8 JP)
 */
export function distributeJPPerMeeting(totalJP: number, count?: number): number[] {
  const safeTotal = Math.max(2, totalJP > 0 ? totalJP : 2);

  // Batas wajib: Minimal 2 JP dan Maksimal 3 JP per pertemuan
  const minCount = Math.ceil(safeTotal / 3);
  const maxCount = Math.max(1, Math.floor(safeTotal / 2));

  // Jika count di luar rentang [minCount, maxCount] atau tidak ditentukan,
  // gunakan standar ideal SD: maxCount = Math.max(1, Math.floor(safeTotal / 2))
  let safeCount = typeof count === 'number' && count > 0 ? count : maxCount;
  if (safeCount < minCount || safeCount > maxCount) {
    safeCount = maxCount;
  }

  const baseJP = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal - (baseJP * safeCount);

  const result: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    // Sisa JP dialokasikan ke pertemuan-pertemuan terakhir (misal 2-2-2-2-3)
    const isExtra = i >= (safeCount - remainder);
    result.push(baseJP + (isExtra ? 1 : 0));
  }
  return result;
}

/**
 * Mengurai total JP, jumlah pertemuan, dan daftar alokasi JP per pertemuan dari dokumen modul
 * secara presisi untuk menjamin relevansi penuh antara Identitas dan Langkah Pembelajaran.
 * Menegakkan aturan: Minimal 2 JP dan Maksimal 3 JP per pertemuan.
 */
export function parseTotalJPAndCount(
  modul: ModulAjarDocument,
  overrideAlokasi?: string
): {
  totalJP: number;
  count: number;
  jpList: number[];
  formattedIdentityAlokasi: string;
} {
  const alokasiStr = (overrideAlokasi || modul.alokasiWaktuPertemuan || modul.identitas?.alokasiWaktuModul || '').trim();

  // 1. Tentukan Total JP terlebih dahulu
  let totalJP = modul.totalJP || (modul as any).totalJP || 0;
  if (!totalJP) {
    // Cari pola "XX JP" di awal string (misal: "12 JP (...)")
    const mJPHead = alokasiStr.match(/^(\d+)\s*JP/i);
    if (mJPHead) {
      totalJP = parseInt(mJPHead[1], 10);
    } else {
      const mJP = alokasiStr.match(/(\d+)\s*JP/i);
      if (mJP) {
        totalJP = parseInt(mJP[1], 10);
      } else {
        const mJam = alokasiStr.match(/(\d+)\s*Jam\s*Pelajaran/i);
        if (mJam) {
          totalJP = parseInt(mJam[1], 10);
        } else {
          const mMenit = alokasiStr.match(/(\d+)\s*x\s*(\d+)\s*Menit/i);
          if (mMenit) {
            totalJP = parseInt(mMenit[1], 10);
          }
        }
      }
    }
  }

  // Fallback cerdas jika total JP belum terisi
  if (!totalJP) {
    const rawMeetingsCount = Array.isArray(modul.kegiatanPembelajaran) ? modul.kegiatanPembelajaran.length : 0;
    totalJP = rawMeetingsCount > 0 ? rawMeetingsCount * 2 : 12;
  }
  totalJP = Math.max(2, totalJP);

  // Batas wajib: minimal 2 JP dan maksimal 3 JP per pertemuan
  const minAllowed = Math.ceil(totalJP / 3);
  const maxAllowed = Math.max(1, Math.floor(totalJP / 2));

  // 2. Tentukan Jumlah Pertemuan
  let count = modul.jumlahPertemuan || 0;
  if (!count) {
    const mPertemuan = alokasiStr.match(/(\d+)\s*(?:kali\s*)?pertemuan/i);
    if (mPertemuan) {
      count = parseInt(mPertemuan[1], 10);
    } else if (Array.isArray(modul.kegiatanPembelajaran) && modul.kegiatanPembelajaran.length > 0) {
      count = modul.kegiatanPembelajaran.length;
    }
  }

  // Validasi ketat: jika count di luar batas [minAllowed, maxAllowed], set ke standar ideal SD (maxAllowed)
  if (!count || count < minAllowed || count > maxAllowed) {
    count = maxAllowed;
  }

  const jpList = distributeJPPerMeeting(totalJP, count);

  // Format string representatif untuk Identitas Modul
  let formattedIdentityAlokasi = '';
  const allSame = jpList.every((val) => val === jpList[0]);
  if (count === 1) {
    formattedIdentityAlokasi = `${totalJP} JP (${totalJP} x 35 Menit)`;
  } else if (allSame) {
    formattedIdentityAlokasi = `${totalJP} JP (${count} Pertemuan @ ${jpList[0]} JP x 35 Menit)`;
  } else {
    formattedIdentityAlokasi = `${totalJP} JP (${count} Pertemuan @ ${jpList.join('-')} JP x 35 Menit)`;
  }

  return {
    totalJP,
    count,
    jpList,
    formattedIdentityAlokasi,
  };
}

/**
 * Struktur breakdown alokasi waktu pertemuan (Kegiatan Awal, Inti, Akhir)
 */
export interface MeetingTimeBreakdown {
  jp: number;
  totalMenit: number;
  awalMenit: number;
  intiMenit: number;
  akhirMenit: number;
  formatAwal: string;
  formatInti: string;
  formatAkhir: string;
  summaryText: string;
}

/**
 * Menghitung alokasi waktu per pertemuan untuk Kegiatan Awal, Inti, dan Akhir
 * sesuai instruksi kurikulum & pengguna:
 * - 2 x 35 menit (70 menit) => Kegiatan Awal: 10 menit, Kegiatan Inti: 50 menit, Kegiatan Akhir: 10 menit
 * - 3 x 35 menit (105 menit) => Kegiatan Awal: 15 menit, Kegiatan Inti: 75 menit, Kegiatan Akhir: 15 menit
 * - 4 x 35 menit (140 menit) => Kegiatan Awal: 15 menit, Kegiatan Inti: 110 menit, Kegiatan Akhir: 15 menit
 * - 1 x 35 menit (35 menit) => Kegiatan Awal: 5 menit, Kegiatan Inti: 25 menit, Kegiatan Akhir: 5 menit
 * Alokasi waktu hanya ditulis untuk Kegiatan Awal, Inti, dan Akhir, BUKAN di setiap sintak individu.
 */
export function calculateMeetingTimeAllocation(
  alokasiStrOrJP?: string | number,
  defaultJP: number = 2
): MeetingTimeBreakdown {
  let jp = defaultJP;
  let menitPerJP = 35;

  if (typeof alokasiStrOrJP === 'number') {
    jp = alokasiStrOrJP > 0 ? alokasiStrOrJP : defaultJP;
  } else if (typeof alokasiStrOrJP === 'string') {
    const raw = alokasiStrOrJP.trim();
    // Cari pola "X x 35" atau "X JP" atau "@ X JP"
    const mJP = raw.match(/(\d+)\s*(?:JP|x\s*(\d+))/i);
    if (mJP) {
      const parsedJP = parseInt(mJP[1], 10);
      if (parsedJP > 0 && parsedJP <= 10) {
        jp = parsedJP;
      }
      if (mJP[2]) {
        const parsedMenit = parseInt(mJP[2], 10);
        if (parsedMenit > 0) menitPerJP = parsedMenit;
      }
    } else {
      const mMenit = raw.match(/(\d+)\s*menit/i);
      if (mMenit) {
        const total = parseInt(mMenit[1], 10);
        if (total >= 90 && total <= 115) jp = 3;
        else if (total >= 120) jp = 4;
        else if (total <= 45) jp = 1;
        else jp = 2;
      }
    }
  }

  const totalMenit = jp * menitPerJP;
  let awalMenit = 10;
  let intiMenit = 50;
  let akhirMenit = 10;

  if (jp === 1) {
    awalMenit = 5;
    intiMenit = 25;
    akhirMenit = 5;
  } else if (jp === 2) {
    awalMenit = 10;
    intiMenit = 50;
    akhirMenit = 10;
  } else if (jp === 3) {
    awalMenit = 15;
    intiMenit = 75;
    akhirMenit = 15;
  } else if (jp === 4) {
    awalMenit = 15;
    intiMenit = 110;
    akhirMenit = 15;
  } else if (jp >= 5) {
    awalMenit = 20;
    intiMenit = totalMenit - 40;
    akhirMenit = 20;
  }

  return {
    jp,
    totalMenit,
    awalMenit,
    intiMenit,
    akhirMenit,
    formatAwal: `${awalMenit} Menit`,
    formatInti: `${intiMenit} Menit`,
    formatAkhir: `${akhirMenit} Menit`,
    summaryText: `Kegiatan Awal: ${awalMenit} Menit, Kegiatan Inti: ${intiMenit} Menit, Kegiatan Akhir: ${akhirMenit} Menit (Total ${jp} JP / ${totalMenit} Menit)`,
  };
}

/**
 * Membersihkan alokasi waktu pertemuan agar ringkas dan rapi sesuai instruksi pengguna:
 * Menjamin format: "X JP (X x 35 Menit)"
 * Jika parameter meetingIndex dan modul diberikan, menghitung porsi JP spesifik untuk pertemuan tersebut
 * sehingga total JP seluruh pertemuan tepat sesuai Identitas (misal 12 JP).
 */
export function cleanMeetingAlokasi(
  raw?: string,
  defaultVal: string = '2 JP (2 x 35 Menit)',
  meetingIndex?: number,
  modul?: ModulAjarDocument,
  overrideAlokasi?: string
): string {
  // Jika konteks modul dan index pertemuan tersedia, gunakan distribusi JP matematis yang valid
  if (modul && meetingIndex !== undefined && meetingIndex >= 0) {
    const { jpList } = parseTotalJPAndCount(modul, overrideAlokasi);
    const jp = jpList[meetingIndex] !== undefined ? jpList[meetingIndex] : 2;
    return `${jp} JP (${jp} x 35 Menit)`;
  }

  if (!raw || typeof raw !== 'string') return defaultVal;

  const trimmed = raw.trim();

  // Pola "@ X JP x YY Menit" atau "@ X x YY Menit"
  const mAt = trimmed.match(/@\s*(\d+)\s*(?:JP)?\s*x\s*(\d+)\s*Menit/i);
  if (mAt) {
    const jp = parseInt(mAt[1], 10);
    const menit = mAt[2];
    return `${jp} JP (${jp} x ${menit} Menit)`;
  }

  // Pola "X JP (X x YY Menit)"
  const mFull = trimmed.match(/(\d+)\s*JP\s*\(\s*(\d+)\s*x\s*(\d+)\s*Menit\s*\)/i);
  if (mFull) {
    return `${mFull[1]} JP (${mFull[2]} x ${mFull[3]} Menit)`;
  }

  // Pola "X x YY Menit"
  const mJPxMenit = trimmed.match(/(\d+)\s*x\s*(\d+)\s*Menit/i);
  if (mJPxMenit) {
    const jp = parseInt(mJPxMenit[1], 10);
    return `${jp} JP (${jp} x ${mJPxMenit[2]} Menit)`;
  }

  // Pola "X JP"
  const mJP = trimmed.match(/(\d+)\s*JP/i);
  if (mJP) {
    const jp = parseInt(mJP[1], 10);
    if (jp <= 6) {
      return `${jp} JP (${jp} x 35 Menit)`;
    }
  }

  let cleaned = trimmed
    .replace(/^Pertemuan\s*\d+\s*dari\s*\d+\s*Pertemuan\s*/i, '')
    .replace(/\(1\s*kali\s*pertemuan\)/gi, '')
    .replace(/^\s*\(\s*/, '')
    .replace(/\s*\)\s*$/, '')
    .trim();

  return cleaned || defaultVal;
}

/**
 * Membersihkan awalan penomoran ganda/dobel pada teks butir kegiatan pembelajaran.
 * Menghapus awalan seperti "1. ", "1.1. ", "1.1 ", "1) ", "1. 1. ", bullet point, dll.,
 * sehingga ketika dirender di dalam list (<ol> / <ul> / autotable) penomoran tidak tertulis dobel
 * melainkan rapi satu kali saja (misal: 1. ..., 2. ... bukan 1. 1. ... atau 1.1. ...).
 */
export function cleanActivityText(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();
  // Loop untuk menghapus awalan penomoran berulang seperti "1. ", "1.1. ", "1.1 ", "1.1.1. ", "1) ", "- ", "• "
  while (/^(\d+(\.\d+)*[\.\)]|\-|\•|\*)\s*/.test(cleaned)) {
    const prev = cleaned;
    cleaned = cleaned.replace(/^(\d+(\.\d+)*[\.\)]|\-|\•|\*)\s*/, '').trim();
    if (cleaned === prev) break;
  }
  return sanitizeForeignPedagogicalTerms(cleaned);
}

export interface PedagogicalOptionsParam {
  mediaList?: string[];
  perangkatList?: string[];
  platformList?: string[];
  metodeList?: string[];
  pendekatan?: string;
  budayaBelajar?: string[];
  lingkunganFisik?: string[];
}

/**
 * Mengembalikan sintaks resmi dan deskripsi kegiatan operasional guru dan murid
 * yang relevan dengan model pembelajaran yang dipilih, tanpa istilah asing yang membingungkan,
 * serta berkembang secara bertahap untuk setiap pertemuan.
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
  const plan = buildPedagogicalMeetingPlan(
    meetingNum,
    totalMeetings,
    safeTopic,
    model,
    safeTopic,
    options
  );
  return plan.kegiatanInti;
}

/**
 * Mengembalikan tahapan pedagogis progresif yang kaya dan terstruktur untuk setiap pertemuan.
 * Memastikan setiap pertemuan memiliki:
 * - Kegiatan Awal yang bervariasi untuk setiap pertemuan, relevan dengan materi, wajib memuat doa & cek kehadiran,
 *   serta wajib memuat Pertanyaan Pemantik yang berbeda sesuai target pencapaian pertemuan & Tujuan Pembelajaran (TP).
 * - Kegiatan Inti dan Kegiatan Akhir yang bebas istilah asing dan sesuai sintaks model pembelajaran.
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
  asesmenPertemuan?: AsesmenPertemuanItem;
} {
  return buildPedagogicalMeetingPlan(
    meetingNum,
    totalMeetings,
    topic,
    model,
    tpText,
    options
  );
}

/**
 * Membersihkan dan memformat fokus tujuan pembelajaran pada setiap pertemuan secara singkat dan lengkap (tanpa dipotong "..."):
 * - Menampilkan rumusan Tujuan Pembelajaran secara utuh/lengkap (termasuk kode TP jika ada).
 * - Jika terdiri dari beberapa pertemuan, menyertakan keterangan singkat tahap fokus pertemuan tersebut di dalam tanda kurung.
 */
export function cleanMeetingFokus(
  raw?: string,
  defaultVal: string = '-',
  meetingIndex?: number,
  totalMeetings?: number,
  topic?: string,
  tpText?: string
): string {
  const safeMeetingIdx = meetingIndex !== undefined ? meetingIndex : 0;
  const safeTotalMeetings = totalMeetings !== undefined && totalMeetings > 0 ? totalMeetings : 1;
  const safeTopic = topic || 'Materi Pembelajaran';

  let extractedStage = '';
  let extractedTP = '';

  if (raw && typeof raw === 'string') {
    const trimmed = raw.trim();

    // 1. Cek jika ada kurung siku [...]
    const bracketMatch = trimmed.match(/\[(.*?)\]/);
    if (bracketMatch && bracketMatch[1]) {
      extractedStage = bracketMatch[1].trim();
    }

    // 2. Cek jika ada format lama "(Target TP: ...)"
    const targetTpMatch = trimmed.match(/\(Target\s*TP:\s*(.*?)\)\s*$/i);
    if (targetTpMatch && targetTpMatch[1]) {
      extractedTP = targetTpMatch[1].trim();
      const beforeTarget = trimmed.slice(0, targetTpMatch.index).trim();
      if (!extractedStage && beforeTarget) {
        extractedStage = beforeTarget;
      }
    } else if (trimmed.includes('—') || trimmed.includes('--')) {
      const parts = trimmed.split(/\s*(?:—|--)\s*/);
      if (parts[0]) {
        if (parts[0].toLowerCase().startsWith('tahap')) {
          extractedStage = extractedStage || parts[0].trim();
          if (parts[1] && !parts[1].startsWith('[')) {
            extractedTP = parts[1].trim();
          }
        } else {
          extractedTP = parts[0].trim();
        }
      }
    } else if (!bracketMatch && trimmed.length > 5) {
      if (trimmed.toLowerCase().startsWith('tahap')) {
        extractedStage = trimmed;
      } else {
        extractedTP = trimmed;
      }
    }
  }

  // 3. Ringkas nama tahap agar singkat dan padat (ambil bagian inti sebelum titik dua ':', tanpa mengulang topik panjang)
  if (!extractedStage) {
    if (safeTotalMeetings <= 1) {
      extractedStage = '';
    } else if (safeMeetingIdx === 0) {
      extractedStage = 'Tahap Pengenalan & Pemahaman Konsep Dasar';
    } else if (safeMeetingIdx >= safeTotalMeetings - 1) {
      extractedStage = 'Tahap Penyajian Hasil & Evaluasi Ketuntasan';
    } else if (safeMeetingIdx === 1) {
      extractedStage = 'Tahap Penyelidikan & Penerapan Konsep';
    } else {
      extractedStage = 'Tahap Pendalaman Materi & Pemecahan Masalah';
    }
  } else {
    extractedStage = extractedStage
      .replace(/^\s*\[/, '')
      .replace(/\]\s*$/, '')
      .split(':')[0]
      .replace(/\(\s*Pertemuan\s*\d+\s*\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // 4. Utamakan tpText yang utuh/lengkap (tidak terpotong "...")
  let cleanFullTP = '';
  if (tpText && typeof tpText === 'string' && tpText.trim().length > 5) {
    cleanFullTP = tpText.trim();
  } else if (extractedTP && !extractedTP.endsWith('...')) {
    cleanFullTP = extractedTP;
  } else if (extractedTP) {
    cleanFullTP = extractedTP.replace(/\.\.\.$/, '').trim();
  }

  // Bersihkan imbuhan tahap yang mungkin sudah menempel di ujung cleanFullTP
  if (cleanFullTP) {
    cleanFullTP = cleanFullTP
      .replace(/\s*(?:—|--)\s*\[.*?\]\s*$/g, '')
      .replace(/\s*\((?:Tahap|Fokus|Target TP)[^)]*\)\.?\s*$/gi, '')
      .replace(/\.+$/, '')
      .trim();
  }

  // 5. Susun hasil akhir secara singkat dan lengkap (utuh tanpa dipotong "...")
  if (cleanFullTP && cleanFullTP.length > 5) {
    const isSingleOrTerpadu = safeTotalMeetings <= 1 || /terpadu/i.test(extractedStage);
    if (isSingleOrTerpadu || !extractedStage) {
      return `${cleanFullTP}.`;
    }
    return `${cleanFullTP} (${extractedStage}).`;
  }

  if (extractedStage) {
    return `${extractedStage}: ${safeTopic}.`;
  }

  return defaultVal;
}

