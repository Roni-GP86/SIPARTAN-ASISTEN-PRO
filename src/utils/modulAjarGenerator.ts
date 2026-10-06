import { ModulAjarDocument, SchoolIdentity, TPItem, ATPDocument, RPMConfigOptions } from '../types';
import { generatePedagogicalModulFallback } from '../../server/curriculumEngine';
import { resolveCPPerElemenFromTPs } from './curriculumCPResolver';

/**
 * Pembangun Dokumen Modul Ajar (Rencana Pembelajaran Mendalam / RPM) Default
 * Menghasilkan dokumen RPP/RPM lengkap (Canvas + Naskah Dokumen Resmi) secara instan dari TP & ATP aktif
 * sehingga menu Modul Ajar tidak pernah menampilkan layar putih saat diklik!
 */
export function buildDefaultModulAjarFromTP(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDoc?: ATPDocument | null,
  rpmOptions?: Partial<RPMConfigOptions>
): ModulAjarDocument {
  const mapel = identitas.mataPelajaran || 'Matematika';
  const fase = identitas.fase || 'Fase C';
  const targetKelas = String(identitas.kelas || (fase === 'Fase A' ? '1' : fase === 'Fase B' ? '3' : '5')).replace(/[^0-9]/g, '') || '5';
  const targetSemester = identitas.semester ? String(identitas.semester).replace(/[^0-9]/g, '') || '1' : '1';

  // 1. Ambil daftar TP yang relevan
  const effectiveTPs: TPItem[] = (Array.isArray(tpList) && tpList.length > 0)
    ? tpList
    : (atpDoc && Array.isArray(atpDoc.atpList) && atpDoc.atpList.length > 0)
    ? atpDoc.atpList.map((a, i) => ({
        id: a.id || `tp-auto-${i + 1}`,
        kodeTP: a.kodeTP || `${i + 1}.1`,
        elemen: a.elemen || atpDoc.elemen || 'Elemen Pembelajaran',
        kalimatCP: atpDoc.capaianPembelajaran || '',
        kompetensi: 'Memahami dan Menerapkan',
        lingkupMateri: a.lingkupMateri || 'Materi Pokok',
        rumusanTP: a.tujuanPembelajaran,
        alokasiJP: a.alokasiJP || 4,
        dimensiP3: a.dimensiP3 || ['Bernalar Kritis', 'Mandiri'],
        semesterTarget: targetSemester === '2' ? 'Semester 2' : 'Semester 1',
        kelasTarget: targetKelas,
        kelasCentang: [targetKelas],
        urutanAlur: a.urutan || i + 1,
      } as TPItem))
    : [];

  const selectedTPObjects = effectiveTPs.length > 0
    ? effectiveTPs
    : [
        {
          id: 'tp-def-1',
          kodeTP: '1.1',
          elemen: 'Elemen Pembelajaran',
          kalimatCP: `Peserta didik menguasai materi ${mapel}`,
          kompetensi: 'Memahami dan Mengaplikasikan',
          lingkupMateri: mapel,
          rumusanTP: `Peserta didik mampu memahami dan mengaplikasikan materi ${mapel} secara mendalam.`,
          alokasiJP: 4,
          dimensiP3: ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'],
          semesterTarget: 'Semester 1' as const,
          kelasTarget: targetKelas,
          kelasCentang: [targetKelas],
          urutanAlur: 1,
        } as TPItem,
      ];

  const primaryElemen = selectedTPObjects[0]?.elemen || atpDoc?.elemen || 'Elemen Pembelajaran';
  const cpResolution = resolveCPPerElemenFromTPs(
    selectedTPObjects,
    undefined,
    atpDoc,
    { ...identitas, kelas: targetKelas, semester: targetSemester }
  );
  const activeCPText = cpResolution.perElemenList[0]?.capaianPembelajaran || cpResolution.capaianPembelajaranFormatted || atpDoc?.capaianPembelajaran || `Peserta didik mampu memahami capaian pembelajaran ${mapel}.`;
  const primaryTopic = rpmOptions?.topikMateri || selectedTPObjects[0]?.lingkupMateri || mapel;
  const chosenModel = rpmOptions?.modelPembelajaran || 'Problem Based Learning (PBL)';

  const raw = generatePedagogicalModulFallback(
    {
      ...identitas,
      kelas: targetKelas,
      semester: targetSemester,
    },
    primaryElemen,
    activeCPText,
    selectedTPObjects as any,
    primaryTopic,
    chosenModel,
    '',
    {
      topikMateri: primaryTopic,
      modelPembelajaran: chosenModel,
      jumlahPertemuan: rpmOptions?.jumlahPertemuan || 2,
      totalJP: rpmOptions?.totalJP || 4,
      ...rpmOptions,
    }
  );

  const modulDoc: ModulAjarDocument = {
    id: `modul-auto-${Date.now()}`,
    atpDocumentId: atpDoc?.id,
    tanggalDibuat: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    judulModul: raw.judulModul || 'RENCANA PEMBELAJARAN MENDALAM',
    elemen: primaryElemen,
    topikMateri: primaryTopic,
    alokasiWaktuPertemuan: raw.alokasiWaktuPertemuan || '2 x 35 Menit (1 kali pertemuan)',
    jumlahPertemuan: raw.jumlahPertemuan || 2,
    totalJP: raw.totalJP || 4,
    identitas: {
      ...identitas,
      kelas: targetKelas,
      semester: targetSemester,
      alokasiWaktuModul: raw.alokasiWaktuModul || raw.alokasiWaktuPertemuan || '2 x 35 Menit',
      targetPesertaDidik: 'Peserta didik reguler / tipikal',
      modaPembelajaran: 'Tatap Muka (Luring)',
    },
    identifikasiRPM: raw.identifikasiRPM,
    desainPembelajaranRPM: raw.desainPembelajaranRPM,
    langkahPembelajaranRPM: raw.langkahPembelajaranRPM,
    asesmenRPM: raw.asesmenRPM,
    rubrikPenilaianRPM: raw.rubrikPenilaianRPM,
    lkpdRPM: raw.lkpdRPM,
    soalEvaluasiRPM: raw.soalEvaluasiRPM,
    kompetensiAwal: raw.kompetensiAwal || [],
    profilPelajarPancasila: raw.profilPelajarPancasila || [],
    saranaPrasarana: raw.saranaPrasarana || { fasilitas: [], lingkunganBelajar: [], mediaAjar: [] },
    modelPembelajaran: chosenModel,
    tujuanPembelajaranSpesifik: raw.tujuanPembelajaranSpesifik || [],
    pemahamanBermakna: raw.pemahamanBermakna || [],
    pertanyaanPemantik: raw.pertanyaanPemantik || [],
    persiapanPembelajaran: raw.persiapanPembelajaran || [],
    kegiatanPembelajaran: Array.isArray(raw.kegiatanPembelajaran) ? raw.kegiatanPembelajaran : [],
    asesmen: raw.asesmen || {
      diagnostik: { teknik: 'Tanya Jawab', daftarPertanyaan: [] },
      formatif: { teknik: 'Observasi & Lembar Kerja', deskripsi: '', rubrik: [] },
      sumatif: { teknik: 'Tes Tertulis', daftarSoal: [] },
    },
    pengayaanDanRemedial: raw.pengayaanDanRemedial || { pengayaan: '', remedial: '' },
    refleksi: raw.refleksi || { refleksiGuru: [], refleksiSiswa: [] },
    lkpd: Array.isArray(raw.lkpd) ? raw.lkpd : [],
    bahanBacaanGuruDanSiswa: raw.bahanBacaanGuruDanSiswa || { ringkasanMateri: '', materiPengayaanSingkat: '' },
    glosarium: Array.isArray(raw.glosarium) ? raw.glosarium : [],
    daftarPustaka: Array.isArray(raw.daftarPustaka) ? raw.daftarPustaka : [],
  };

  return modulDoc;
}
