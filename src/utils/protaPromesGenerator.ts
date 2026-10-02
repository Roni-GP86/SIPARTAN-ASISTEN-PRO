import {
  SchoolIdentity,
  TPItem,
  ATPDocument,
  ProtaDocument,
  ProtaItem,
  ProtaSemesterSummary,
  PromesDocument,
  PromesSemesterData,
  PromesRowItem,
  PromesMonthHeader,
  PromesWeekSlot,
} from '../types';
import { getPermen13Allocation, calibrateTPAllocationJP } from '../data/permendikdasmen13Data';
import { filterTPListByClass, doesItemMatchClass, filterATPDocumentByClass } from './classFilterUtils';
import { KALDIK_TTU_METADATA, KALDIK_TTU_EVENTS, KALDIK_TTU_MONTHS } from '../data/kaldikTTUData';

/**
 * Membangun Dokumen Program Tahunan (Prota) Berstandar Kemendikdasmen & Kurikulum Merdeka
 * Sesuai Regulasi:
 * 1. Permendikdasmen No. 13 Tahun 2025 (Alokasi Waktu Intrakurikuler & P5)
 * 2. Keputusan BSKAP No. 046 Tahun 2025
 * 3. Panduan Pembelajaran dan Asesmen (PPA) 2025
 */
export function buildProtaDocumentFromTP(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDoc?: ATPDocument | null
): ProtaDocument {
  const mapel = identitas.mataPelajaran || 'Bahasa Indonesia';
  const fase = identitas.fase || 'Fase B';
  const kelas = identitas.kelas || (fase === 'Fase A' ? '1' : fase === 'Fase B' ? '4' : '5');

  // Ambil regulasi baku alokasi waktu Permendikdasmen No. 13 Tahun 2025
  const alokasiResmi = getPermen13Allocation(mapel, fase, String(kelas));
  const targetJPTahun = alokasiResmi.jpTahunIntra > 0 ? alokasiResmi.jpTahunIntra : 144;
  const targetJPSemester1 = Math.round(targetJPTahun / 2);
  const targetJPSemester2 = targetJPTahun - targetJPSemester1;

  // Silsilah data TP (Lineage): Gunakan atpList jika tersedia, jika tidak gunakan tpList
  const effectiveTPs: {
    id: string;
    kodeTP: string;
    elemen: string;
    tujuanPembelajaran: string;
    lingkupMateri: string;
    alokasiJP: number;
    semesterTarget?: string;
  }[] = (atpDoc && atpDoc.atpList && atpDoc.atpList.length > 0)
    ? atpDoc.atpList.map((item, idx) => {
        const matched = (tpList || []).find((t) => t.kodeTP === item.kodeTP || t.id === item.id);
        return {
          id: item.id || matched?.id || `prota-tp-${idx + 1}`,
          kodeTP: item.kodeTP || matched?.kodeTP || `${idx + 1}.1`,
          elemen: item.elemen || matched?.elemen || atpDoc.elemen || 'Elemen Pembelajaran',
          tujuanPembelajaran: item.tujuanPembelajaran || matched?.rumusanTP || '',
          lingkupMateri: item.lingkupMateri || matched?.lingkupMateri || 'Materi Pokok',
          alokasiJP: item.alokasiJP || matched?.alokasiJP || 4,
          semesterTarget: matched?.semesterTarget || item.semester,
        };
      })
    : (tpList || []).map((t, idx) => ({
        id: t.id || `prota-tp-${idx + 1}`,
        kodeTP: t.kodeTP || `${idx + 1}.1`,
        elemen: t.elemen || 'Elemen Pembelajaran',
        tujuanPembelajaran: t.rumusanTP || '',
        lingkupMateri: t.lingkupMateri || 'Materi Pokok',
        alokasiJP: t.alokasiJP || 4,
        semesterTarget: t.semesterTarget,
      }));

  // Pembagian ke Semester 1 dan Semester 2
  const itemsSem1Raw: typeof effectiveTPs = [];
  const itemsSem2Raw: typeof effectiveTPs = [];

  const midPoint = Math.ceil(effectiveTPs.length / 2);

  effectiveTPs.forEach((tp, idx) => {
    const isExplicitSem2 =
      tp.semesterTarget?.toLowerCase().includes('2') ||
      tp.semesterTarget?.toLowerCase().includes('genap');
    const isExplicitSem1 =
      tp.semesterTarget?.toLowerCase().includes('1') ||
      tp.semesterTarget?.toLowerCase().includes('ganjil');

    if (isExplicitSem2) {
      itemsSem2Raw.push(tp);
    } else if (isExplicitSem1) {
      itemsSem1Raw.push(tp);
    } else {
      // Pembagian seimbang berurutan alur ATP
      if (idx < midPoint) {
        itemsSem1Raw.push(tp);
      } else {
        itemsSem2Raw.push(tp);
      }
    }
  });

  // Jika salah satu semester kosong, seimbangkan
  if (itemsSem1Raw.length === 0 && itemsSem2Raw.length > 0) {
    itemsSem1Raw.push(...itemsSem2Raw.splice(0, Math.ceil(itemsSem2Raw.length / 2)));
  } else if (itemsSem2Raw.length === 0 && itemsSem1Raw.length > 0) {
    itemsSem2Raw.push(...itemsSem1Raw.splice(Math.ceil(itemsSem1Raw.length / 2)));
  }

  // Kalibrasi alokasi JP per semester agar tepat dengan Permendikdasmen No. 13 Tahun 2025
  calibrateTPAllocationJP(itemsSem1Raw, targetJPSemester1);
  calibrateTPAllocationJP(itemsSem2Raw, targetJPSemester2);

  const itemsSemester1: ProtaItem[] = itemsSem1Raw.map((tp, idx) => ({
    id: `prota-s1-${idx + 1}`,
    nomor: idx + 1,
    kodeTP: tp.kodeTP,
    elemen: tp.elemen,
    lingkupMateri: tp.lingkupMateri,
    tujuanPembelajaran: tp.tujuanPembelajaran,
    alokasiJP: tp.alokasiJP,
    semester: 'Semester 1',
    kelasTarget: kelas,
  }));

  const itemsSemester2: ProtaItem[] = itemsSem2Raw.map((tp, idx) => ({
    id: `prota-s2-${idx + 1}`,
    nomor: idx + 1,
    kodeTP: tp.kodeTP,
    elemen: tp.elemen,
    lingkupMateri: tp.lingkupMateri,
    tujuanPembelajaran: tp.tujuanPembelajaran,
    alokasiJP: tp.alokasiJP,
    semester: 'Semester 2',
    kelasTarget: kelas,
  }));

  const totalJPSem1 = itemsSemester1.reduce((sum, it) => sum + it.alokasiJP, 0);
  const totalJPSem2 = itemsSemester2.reduce((sum, it) => sum + it.alokasiJP, 0);

  const summarySemester1: ProtaSemesterSummary = {
    jpTatapMuka: Math.max(0, totalJPSem1 - 6),
    jpSumatifLingkupMateri: 4,
    jpSumatifAkhirSemester: 2,
    jpCadangan: 0,
    totalJPSemester: totalJPSem1,
    jumlahMingguEfektif: alokasiResmi.asumsiMingguSemester || 18,
  };

  const summarySemester2: ProtaSemesterSummary = {
    jpTatapMuka: Math.max(0, totalJPSem2 - 6),
    jpSumatifLingkupMateri: 4,
    jpSumatifAkhirSemester: 2,
    jpCadangan: 0,
    totalJPSemester: totalJPSem2,
    jumlahMingguEfektif: alokasiResmi.isKelasAkhir ? 14 : (alokasiResmi.asumsiMingguSemester || 18),
  };

  return {
    id: `prota-${Date.now()}`,
    tanggalDibuat: new Date().toISOString(),
    identitas,
    totalJPTahun: targetJPTahun,
    alokasiRegulasi: {
      jpMingguIntra: alokasiResmi.jpMingguIntra,
      jpTahunIntra: alokasiResmi.jpTahunIntra,
      jpTahunKoku: alokasiResmi.jpTahunKoku,
      totalJPTahun: alokasiResmi.totalJPTahun,
      asumsiMingguTahun: alokasiResmi.asumsiMingguTahun,
      durasiMenitPerJP: 35,
      dasarHukum: `${alokasiResmi.catatanRegulasi}, ${(mapel.toLowerCase().includes('agama') || mapel.toLowerCase().includes('katolik')) ? 'BKP No. 20/2026' : 'BSKAP No. 046/2025'}, & Kaldik Dikbud Kab. Timor Tengah Utara SK No. ${KALDIK_TTU_METADATA.nomorSK}`,
    },
    itemsSemester1,
    itemsSemester2,
    summarySemester1,
    summarySemester2,
    totalJPTahunAkumulasi: totalJPSem1 + totalJPSem2,
    catatanRasional: `Program Tahunan ini disusun berdasarkan analisis Tujuan Pembelajaran (TP) dan Alur Tujuan Pembelajaran (ATP) mata pelajaran ${mapel} Kelas ${kelas} (${fase}), diselaraskan secara akurat dengan alokasi waktu intrakurikuler Permendikdasmen No. 13 Tahun 2025 (${targetJPTahun} JP/Tahun) serta berpedoman pada Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran ${KALDIK_TTU_METADATA.tahunAjaran} (SK No. ${KALDIK_TTU_METADATA.nomorSK}) dengan total ${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah} Hari Efektif Sekolah (${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah} Hari Semester 1 dan ${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah} Hari Semester 2).`,
  };
}

/**
 * Membangun Dokumen Program Semester (Promes) Berstandar Kemendikdasmen
 * Matriks Mingguan per Bulan (Juli-Desember untuk Sem 1, Januari-Juni untuk Sem 2)
 */
export function buildPromesDocumentFromTP(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDoc?: ATPDocument | null
): PromesDocument {
  const prota = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
  const jpMinggu = prota.alokasiRegulasi.jpMingguIntra || 4;

  // Struktur Bulan Semester 1: Juli - Desember (Berdasarkan Kaldik TTU SK No. 400.3/36/2026)
  const bulanSemester1: PromesMonthHeader[] = [
    {
      namaBulan: 'Juli',
      nomorBulan: 7,
      weeks: [
        { mingguKe: 1, isEfektif: false, keteranganKhusus: 'LIBUR', labelKegiatan: 'Libur Akhir Tahun Pelajaran' },
        { mingguKe: 2, isEfektif: false, keteranganKhusus: 'LIBUR', labelKegiatan: 'Libur Akhir Tahun Pelajaran' },
        { mingguKe: 3, isEfektif: false, keteranganKhusus: 'MPLS', labelKegiatan: 'MPLS Ramah (20-24 Juli 2026)' },
        { mingguKe: 4, isEfektif: true, labelKegiatan: 'Pekan Efektif Belajar' },
        { mingguKe: 5, isEfektif: true, labelKegiatan: 'Pekan Efektif Belajar' },
      ],
    },
    {
      namaBulan: 'Agustus',
      nomorBulan: 8,
      weeks: [
        { mingguKe: 1, isEfektif: true },
        { mingguKe: 2, isEfektif: true },
        { mingguKe: 3, isEfektif: true, keteranganKhusus: 'KEGIATAN', labelKegiatan: 'HUT Proklamasi RI ke-81 (17 Ags)' },
        { mingguKe: 4, isEfektif: true, labelKegiatan: 'Maulid Nabi SAW (25 Ags)' },
      ],
    },
    {
      namaBulan: 'September',
      nomorBulan: 9,
      weeks: [
        { mingguKe: 1, isEfektif: true },
        { mingguKe: 2, isEfektif: true },
        { mingguKe: 3, isEfektif: false, keteranganKhusus: 'STS', labelKegiatan: 'Sumatif Tengah Semester 1 (14-18 Sept 2026)' },
        { mingguKe: 4, isEfektif: true },
        { mingguKe: 5, isEfektif: true },
      ],
    },
    {
      namaBulan: 'Oktober',
      nomorBulan: 10,
      weeks: [
        { mingguKe: 1, isEfektif: true },
        { mingguKe: 2, isEfektif: true },
        { mingguKe: 3, isEfektif: true },
        { mingguKe: 4, isEfektif: true },
      ],
    },
    {
      namaBulan: 'November',
      nomorBulan: 11,
      weeks: [
        { mingguKe: 1, isEfektif: true, labelKegiatan: 'Efektif Fakultatif Hari Arwah (2 Nov)' },
        { mingguKe: 2, isEfektif: true },
        { mingguKe: 3, isEfektif: true },
        { mingguKe: 4, isEfektif: true },
      ],
    },
    {
      namaBulan: 'Desember',
      nomorBulan: 12,
      weeks: [
        { mingguKe: 1, isEfektif: false, keteranganKhusus: 'SAS', labelKegiatan: 'Sumatif Akhir Semester 1 (1-4 Des 2026)' },
        { mingguKe: 2, isEfektif: false, keteranganKhusus: 'KEGIATAN', labelKegiatan: 'Pengolahan Nilai & Remedial' },
        { mingguKe: 3, isEfektif: false, keteranganKhusus: 'RAPOR', labelKegiatan: 'Penyerahan Rapor Sem 1 (18 Des 2026)' },
        { mingguKe: 4, isEfektif: false, keteranganKhusus: 'LIBUR', labelKegiatan: 'Libur Akhir Semester 1 & Natal (21-31 Des)' },
      ],
    },
  ];

  // Struktur Bulan Semester 2: Januari - Juni (Berdasarkan Kaldik TTU SK No. 400.3/36/2026)
  const bulanSemester2: PromesMonthHeader[] = [
    {
      namaBulan: 'Januari',
      nomorBulan: 1,
      weeks: [
        { mingguKe: 1, isEfektif: true, labelKegiatan: 'Hari Pertama Masuk Sem 2 (4 Jan 2027)' },
        { mingguKe: 2, isEfektif: true },
        { mingguKe: 3, isEfektif: true },
        { mingguKe: 4, isEfektif: true },
      ],
    },
    {
      namaBulan: 'Februari',
      nomorBulan: 2,
      weeks: [
        { mingguKe: 1, isEfektif: true, labelKegiatan: 'Tahun Baru Imlek (6 Feb)' },
        { mingguKe: 2, isEfektif: true, labelKegiatan: 'Efektif Fakultatif Rabu Abu (10 Feb)' },
        { mingguKe: 3, isEfektif: true },
        { mingguKe: 4, isEfektif: true },
      ],
    },
    {
      namaBulan: 'Maret',
      nomorBulan: 3,
      weeks: [
        { mingguKe: 1, isEfektif: true },
        { mingguKe: 2, isEfektif: true, labelKegiatan: 'Nyepi & Idul Fitri 1446H' },
        { mingguKe: 3, isEfektif: false, keteranganKhusus: 'STS', labelKegiatan: 'Sumatif Tengah Semester 2 (15-19 Mar 2027)' },
        { mingguKe: 4, isEfektif: true, labelKegiatan: 'Fakultatif Kamis Putih & Wafat Isa Al-Masih' },
      ],
    },
    {
      namaBulan: 'April',
      nomorBulan: 4,
      weeks: [
        { mingguKe: 1, isEfektif: true },
        { mingguKe: 2, isEfektif: true, labelKegiatan: 'Perkiraan TKA SMP' },
        { mingguKe: 3, isEfektif: true, labelKegiatan: 'Perkiraan TKA SMP' },
        { mingguKe: 4, isEfektif: false, keteranganKhusus: 'TKA', labelKegiatan: 'Perkiraan TKA SD (19-30 Apr 2027)' },
      ],
    },
    {
      namaBulan: 'Mei',
      nomorBulan: 5,
      weeks: [
        { mingguKe: 1, isEfektif: true, labelKegiatan: 'Hari Buruh & Kenaikan Yesus' },
        { mingguKe: 2, isEfektif: false, keteranganKhusus: 'US', labelKegiatan: 'Ujian Sekolah SD & SMP (10-14 Mei 2027)' },
        { mingguKe: 3, isEfektif: true, labelKegiatan: 'Idul Adha & Waisak' },
        { mingguKe: 4, isEfektif: true },
      ],
    },
    {
      namaBulan: 'Juni',
      nomorBulan: 6,
      weeks: [
        { mingguKe: 1, isEfektif: false, keteranganKhusus: 'SAT', labelKegiatan: 'Sumatif Akhir Semester 2 / SAT (31 Mei & 2-4 Juni 2027)' },
        { mingguKe: 2, isEfektif: false, keteranganKhusus: 'KEGIATAN', labelKegiatan: 'Pengolahan Nilai & Rapat Kenaikan' },
        { mingguKe: 3, isEfektif: false, keteranganKhusus: 'RAPOR', labelKegiatan: 'Pembagian Rapor Semester 2 (18 Juni 2027)' },
        { mingguKe: 4, isEfektif: false, keteranganKhusus: 'LIBUR', labelKegiatan: 'Libur Akhir Tahun Pelajaran (21 Juni - 9 Juli)' },
      ],
    },
  ];

  // Helper untuk mendistribusikan JP item ke pekan efektif secara otomatis
  function generatePromesRows(
    items: ProtaItem[],
    bulanHeaders: PromesMonthHeader[],
    jpPerWeek: number
  ): PromesRowItem[] {
    // Kumpulkan semua slot minggu efektif
    const effectiveSlots: { bulan: string; mingguKe: number }[] = [];
    bulanHeaders.forEach((b) => {
      b.weeks.forEach((w) => {
        if (w.isEfektif) {
          effectiveSlots.push({ bulan: b.namaBulan, mingguKe: w.mingguKe });
        }
      });
    });

    let currentSlotIdx = 0;
    let remainingJPInCurrentSlot = jpPerWeek;

    return items.map((tp, idx) => {
      const rowItem: PromesRowItem = {
        id: `promes-row-${tp.id}`,
        nomor: idx + 1,
        elemen: tp.elemen,
        kodeTP: tp.kodeTP,
        tujuanPembelajaran: tp.tujuanPembelajaran,
        lingkupMateri: tp.lingkupMateri,
        alokasiJP: tp.alokasiJP,
        distribusiMingguan: {},
      };

      let neededJP = tp.alokasiJP;

      while (neededJP > 0 && currentSlotIdx < effectiveSlots.length) {
        const slot = effectiveSlots[currentSlotIdx];
        const key = `${slot.bulan}_${slot.mingguKe}`;
        const canTake = Math.min(neededJP, remainingJPInCurrentSlot);

        if (canTake > 0) {
          rowItem.distribusiMingguan[key] = (Number(rowItem.distribusiMingguan[key]) || 0) + canTake;
          neededJP -= canTake;
          remainingJPInCurrentSlot -= canTake;
        }

        if (remainingJPInCurrentSlot === 0) {
          currentSlotIdx++;
          remainingJPInCurrentSlot = jpPerWeek;
        }
      }

      return rowItem;
    });
  }

  const rowsSem1 = generatePromesRows(prota.itemsSemester1, bulanSemester1, jpMinggu);
  const rowsSem2 = generatePromesRows(prota.itemsSemester2, bulanSemester2, jpMinggu);

  const sem1EffWeeks = bulanSemester1.reduce((acc, b) => acc + b.weeks.filter((w) => w.isEfektif).length, 0);
  const sem1NonEffWeeks = bulanSemester1.reduce((acc, b) => acc + b.weeks.filter((w) => !w.isEfektif).length, 0);

  const sem2EffWeeks = bulanSemester2.reduce((acc, b) => acc + b.weeks.filter((w) => w.isEfektif).length, 0);
  const sem2NonEffWeeks = bulanSemester2.reduce((acc, b) => acc + b.weeks.filter((w) => !w.isEfektif).length, 0);

  const semester1Data: PromesSemesterData = {
    semesterLabel: 'Semester 1 (Ganjil)',
    semesterTipe: '1',
    bulanList: bulanSemester1,
    rows: rowsSem1,
    summary: {
      jpTatapMuka: prota.summarySemester1.jpTatapMuka,
      jpSumatifLingkupMateri: prota.summarySemester1.jpSumatifLingkupMateri,
      jpSumatifAkhir: prota.summarySemester1.jpSumatifAkhirSemester,
      jpCadangan: prota.summarySemester1.jpCadangan,
      totalJP: prota.summarySemester1.totalJPSemester,
      totalMingguEfektif: sem1EffWeeks,
      totalMingguNonEfektif: sem1NonEffWeeks,
    },
    kegiatanAgendaKhusus: [
      { kode: 'MPLS', namaKegiatan: 'Masa Pengenalan Lingkungan Sekolah (MPLS Ramah: 20-24 Juli 2026)', bulan: 'Juli', mingguKe: 3, warnaBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
      { kode: 'HUT-RI', namaKegiatan: 'Peringatan HUT Kemerdekaan RI ke-81 (17 Agustus 2026)', bulan: 'Agustus', mingguKe: 3, warnaBadge: 'bg-red-100 text-red-900 border-red-300' },
      { kode: 'STS', namaKegiatan: 'Sumatif Tengah Semester 1 (STS 1: 14-18 September 2026)', bulan: 'September', mingguKe: 3, warnaBadge: 'bg-amber-100 text-amber-900 border-amber-300' },
      { kode: 'FAKULTATIF', namaKegiatan: 'Hari Efektif Fakultatif Hari Arwah (2 November 2026)', bulan: 'November', mingguKe: 1, warnaBadge: 'bg-purple-100 text-purple-900 border-purple-300' },
      { kode: 'SAS', namaKegiatan: 'Sumatif Akhir Semester 1 (SAS 1: 1-4 Desember 2026)', bulan: 'Desember', mingguKe: 1, warnaBadge: 'bg-rose-100 text-rose-900 border-rose-300' },
      { kode: 'RAPOR', namaKegiatan: 'Penyerahan Buku Laporan Hasil Belajar (18 Desember 2026)', bulan: 'Desember', mingguKe: 3, warnaBadge: 'bg-blue-100 text-blue-900 border-blue-300' },
      { kode: 'LIBUR', namaKegiatan: 'Libur Akhir Semester 1 & Natal (21-31 Desember 2026)', bulan: 'Desember', mingguKe: 4, warnaBadge: 'bg-slate-200 text-slate-800 border-slate-400' },
    ],
  };

  const semester2Data: PromesSemesterData = {
    semesterLabel: 'Semester 2 (Genap)',
    semesterTipe: '2',
    bulanList: bulanSemester2,
    rows: rowsSem2,
    summary: {
      jpTatapMuka: prota.summarySemester2.jpTatapMuka,
      jpSumatifLingkupMateri: prota.summarySemester2.jpSumatifLingkupMateri,
      jpSumatifAkhir: prota.summarySemester2.jpSumatifAkhirSemester,
      jpCadangan: prota.summarySemester2.jpCadangan,
      totalJP: prota.summarySemester2.totalJPSemester,
      totalMingguEfektif: sem2EffWeeks,
      totalMingguNonEfektif: sem2NonEffWeeks,
    },
    kegiatanAgendaKhusus: [
      { kode: 'AWAL', namaKegiatan: 'Hari Pertama Masuk Sekolah Sem 2 (4 Januari 2027)', bulan: 'Januari', mingguKe: 1, warnaBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      { kode: 'FAKULTATIF', namaKegiatan: 'Hari Efektif Fakultatif Rabu Abu (10 Februari 2027)', bulan: 'Februari', mingguKe: 2, warnaBadge: 'bg-purple-100 text-purple-900 border-purple-300' },
      { kode: 'STS', namaKegiatan: 'Sumatif Tengah Semester 2 (STS 2: 15-19 Maret 2027)', bulan: 'Maret', mingguKe: 3, warnaBadge: 'bg-amber-100 text-amber-900 border-amber-300' },
      { kode: 'TKA', namaKegiatan: 'Perkiraan Tes Kemampuan Akademik SD (19-30 April 2027)', bulan: 'April', mingguKe: 4, warnaBadge: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
      { kode: 'US', namaKegiatan: 'Ujian Sekolah Utama Jenjang SD (10-14 Mei 2027)', bulan: 'Mei', mingguKe: 2, warnaBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
      { kode: 'SAT', namaKegiatan: 'Sumatif Akhir Semester 2 / SAT (31 Mei & 2-4 Juni 2027)', bulan: 'Juni', mingguKe: 1, warnaBadge: 'bg-rose-100 text-rose-900 border-rose-300' },
      { kode: 'RAPOR', namaKegiatan: 'Penyerahan Rapor Kenaikan Kelas (18 Juni 2027)', bulan: 'Juni', mingguKe: 3, warnaBadge: 'bg-blue-100 text-blue-900 border-blue-300' },
      { kode: 'LIBUR', namaKegiatan: 'Libur Akhir Tahun Pelajaran (21 Juni - 9 Juli 2027)', bulan: 'Juni', mingguKe: 4, warnaBadge: 'bg-slate-200 text-slate-800 border-slate-400' },
    ],
  };

  return {
    id: `promes-${Date.now()}`,
    tanggalDibuat: new Date().toISOString(),
    identitas,
    jpMinggu,
    semester1: semester1Data,
    semester2: semester2Data,
    dasarHukum: prota.alokasiRegulasi.dasarHukum,
    catatanPelaksanaan: `Program Semester (Promes) disusun berdasarkan alokasi intrakurikuler ${jpMinggu} JP/Minggu dan disinkronkan langsung dengan Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran ${KALDIK_TTU_METADATA.tahunAjaran} (Keputusan Kadis Dikbud Kab. TTU No. ${KALDIK_TTU_METADATA.nomorSK}), memperhitungkan ${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah} Hari Efektif di Semester 1 dan ${KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah} Hari Efektif di Semester 2, serta mengakomodasi pekan STS, SAS/SAT, TKA SD, US SD, dan hari efektif fakultatif keagamaan daerah.`,
  };
}

/**
 * Memfilter atau menyusun ulang Dokumen Prota khusus untuk kelas tertentu (misal Kelas 5 atau Kelas 6)
 * atau mengembalikan Prota lengkap untuk semua kelas dalam Fase.
 */
export function filterProtaDocumentByClass(
  prota: ProtaDocument,
  selectedKelas: string,
  tpList?: TPItem[],
  atpDoc?: ATPDocument | null
): ProtaDocument {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return prota;
  }
  const fase = prota.identitas.fase || 'Fase C';
  const sourceTPs =
    tpList && tpList.length > 0
      ? tpList
      : [...prota.itemsSemester1, ...prota.itemsSemester2].map((p, idx) => ({
          id: p.id,
          kodeTP: p.kodeTP,
          elemen: p.elemen,
          rumusanTP: p.tujuanPembelajaran,
          lingkupMateri: p.lingkupMateri,
          alokasiJP: p.alokasiJP,
          semesterTarget: p.semester.includes('2') ? 'Semester 2' : 'Semester 1',
          kelasTarget: p.kelasTarget || selectedKelas,
          urutanAlur: idx + 1,
        } as TPItem));

  const filteredTPs = filterTPListByClass(sourceTPs, selectedKelas, fase);
  const effectiveTPs = filteredTPs.length > 0 ? filteredTPs : sourceTPs;

  const filteredATP = atpDoc ? filterATPDocumentByClass(atpDoc, selectedKelas) : null;

  const updatedIdentitas: SchoolIdentity = {
    ...prota.identitas,
    kelas: selectedKelas,
  };

  return buildProtaDocumentFromTP(updatedIdentitas, effectiveTPs, filteredATP);
}

/**
 * Memfilter atau menyusun ulang Dokumen Promes khusus untuk kelas tertentu (misal Kelas 5 atau Kelas 6)
 * atau mengembalikan Promes lengkap untuk semua kelas dalam Fase.
 */
export function filterPromesDocumentByClass(
  promes: PromesDocument,
  selectedKelas: string,
  tpList?: TPItem[],
  atpDoc?: ATPDocument | null
): PromesDocument {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return promes;
  }
  const fase = promes.identitas.fase || 'Fase C';
  const sourceTPs =
    tpList && tpList.length > 0
      ? tpList
      : [...promes.semester1.rows, ...promes.semester2.rows].map((r, idx) => ({
          id: r.id,
          kodeTP: r.kodeTP,
          elemen: r.elemen,
          rumusanTP: r.tujuanPembelajaran,
          lingkupMateri: r.lingkupMateri,
          alokasiJP: r.alokasiJP,
          semesterTarget: 'Semester 1',
          kelasTarget: selectedKelas,
          urutanAlur: idx + 1,
        } as TPItem));

  const filteredTPs = filterTPListByClass(sourceTPs, selectedKelas, fase);
  const effectiveTPs = filteredTPs.length > 0 ? filteredTPs : sourceTPs;

  const filteredATP = atpDoc ? filterATPDocumentByClass(atpDoc, selectedKelas) : null;

  const updatedIdentitas: SchoolIdentity = {
    ...promes.identitas,
    kelas: selectedKelas,
  };

  return buildPromesDocumentFromTP(updatedIdentitas, effectiveTPs, filteredATP);
}

