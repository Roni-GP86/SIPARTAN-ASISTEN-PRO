import { ATPDocument, ModulAjarDocument, TPItem, SchoolIdentity, KKTPDocument, ProtaDocument, PromesDocument, PromesSemesterData, MediaPromptDocument, PDFLayoutOptions, PertemuanModul } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isWordExportDisabled } from '../services/accessCodeService';
import { normalizeRPMData, cleanParentheses, getPrinsipBadgeInfo, cleanMeetingAlokasi, cleanMeetingFokus, parseTotalJPAndCount, distributeJPPerMeeting, getPedagogicalStageForMeeting, calculateMeetingTimeAllocation, cleanActivityText } from './rpmUtils';
import { isSyntaxMatchingModel } from './modelSyntaxEngine';
import { DELAPAN_DIMENSI_PROFIL_LULUSAN, normalizeDimensiProfilLulusan } from '../data/dimensiProfilLulusan';
import { formatCPElemenText, resolveElemenListForATP, resolveSingleElemenForTP } from './curriculumCPResolver';

function formatTPWithCode(kodeTP?: string, rumusanTP?: string): string {
  if (!rumusanTP) return '';
  if (!kodeTP) return rumusanTP;
  const cleanCode = kodeTP.trim();
  const cleanRumusan = rumusanTP.trim();
  if (cleanRumusan.startsWith(cleanCode)) {
    return cleanRumusan;
  }
  return `${cleanCode}. ${cleanRumusan}`;
}

/**
 * Memunculkan notifikasi resmi dan memancarkan event ketika pengguna mencoba mengunduh Word
 * namun telah dinonaktifkan oleh Administrator sekolah.
 */
export function notifyWordExportBlocked(): void {
  const message = 'unduhan word di nonaktifkan oleh admin! (hal ini mencegah pengeditan data via word!)';
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sipartan_word_export_blocked', {
        detail: { message },
      })
    );
    try {
      alert(message);
    } catch {
      // safe fallback if alert suppressed in iframe
    }
  }
}

/**
 * Mengunci elemen data identitas resmi (Sekolah, Fase, Kelas, Guru, NIP, Kepala Sekolah)
 * di dokumen Microsoft Word (.doc) menggunakan Word Structured Document Tag (w:sdt)
 * dengan kunci sdtContentLocked dan sdtLocked, serta atribut HTML contenteditable="false".
 * Ini memastikan teks di Microsoft Word terkunci permanen dan tidak dapat diedit maupun diubah.
 */
export function lockWordData(content: string, fieldName: string = 'Identitas Resmi Terkunci'): string {
  if (!content) return '';
  return `<w:sdt><w:sdtPr><w:alias w:val="${fieldName}"/><w:tag w:val="SIPARTAN_LOCKED"/><w:lock w:val="sdtContentLocked"/><w:lock w:val="sdtLocked"/></w:sdtPr><w:sdtContent><span contenteditable="false" style="mso-element:sdt; user-select:none; -webkit-user-select:none; font-weight:inherit;">${content}</span></w:sdtContent></w:sdt>`;
}

/**
 * Returns exact official CP regulation metadata according to statutory law:
 * - Pendidikan Agama Katolik dan Budi Pekerti berpedoman pada BKP No. 20/2026
 * - Mata pelajaran umum lainnya berpedoman pada Keputusan Kepala BSKAP No. 046 Tahun 2025
 */
export function getCpRegulationInfo(mataPelajaran?: string) {
  const isAgamaKatolik = (mataPelajaran || '').toLowerCase().includes('agama') || (mataPelajaran || '').toLowerCase().includes('katolik');
  if (isAgamaKatolik) {
    return {
      fullName: 'Regulasi Standar Capaian Pembelajaran BKP No. 20/2026',
      shortName: 'BKP No. 20/2026',
      headerName: 'BKP No. 20/2026',
      isAgama: true,
    };
  }
  return {
    fullName: 'Keputusan Kepala BSKAP No. 046 Tahun 2025',
    shortName: 'BSKAP No. 046/2025',
    headerName: 'BSKAP No. 046/2025',
    isAgama: false,
  };
}

/**
 * Memecah string materi/kompetensi/indikator yang berupa paragraf, bullet poin bersambung,
 * pemisah koma, titik-koma, penomoran (1., 2., a., b.), atau dash (-) menjadi daftar poin bersih terpisah.
 */
export function extractCleanPoints(input: string | string[] | undefined | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    const flattened = input.flatMap((item) => extractCleanPoints(item));
    return Array.from(new Set(flattened)).filter(Boolean);
  }

  const str = String(input).trim();
  if (!str) return [];

  // 1. Jika mengandung newline (\n atau \r)
  if (str.includes('\n') || str.includes('\r')) {
    const lines = str
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s•\-\*\d+\.\(\)a-zA-Z\.]+\s*/, '').trim())
      .filter((s) => s.length > 0);
    if (lines.length > 1) return lines;
  }

  // 2. Jika mengandung bullet point '•' atau '&bull;'
  if (str.includes('•') || str.includes('&bull;')) {
    const bulletParts = str
      .split(/•|&bull;/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (bulletParts.length > 1) return bulletParts;
  }

  // 3. Jika mengandung pola penomoran seperti "1. ... 2. ..." atau "(1) ... (2) ..."
  if (/(?:\d+\.|\(\d+\)|[a-e]\.)\s+[A-Z0-9]/i.test(str)) {
    const parts = str.split(/(?=(?:\d+\.|\(\d+\)|[a-e]\.)\s+)/i);
    const cleaned = parts
      .map((p) => p.replace(/^(?:\d+\.|\(\d+\)|[a-e]\.)\s*/i, '').trim())
      .filter((p) => p.length > 0);
    if (cleaned.length > 1) return cleaned;
  }

  // 4. Jika mengandung pemisah titik koma ';'
  if (str.includes(';')) {
    const semiParts = str
      .split(';')
      .map((s) => s.trim().replace(/^[\s•\-\*]+/, ''))
      .filter((s) => s.length > 0);
    if (semiParts.length > 1) return semiParts;
  }

  // 5. Fallback frasa tunggal
  return [str.replace(/^[\s•\-\*]+/, '').trim()];
}

/**
 * Format materi atau daftar poin untuk tabel dokumen Word (.doc):
 * Menghasilkan HTML list (<ul> atau <ol>) jika lebih dari 1 poin,
 * sehingga setiap materi atau sub-poin tampil pada baris baru secara profesional.
 */
export function formatListToWordHtml(
  input: string | string[] | undefined | null,
  listType: 'ul' | 'ol' = 'ul',
  fallback: string = '-'
): string {
  const points = extractCleanPoints(input);
  if (points.length === 0) return fallback;
  if (points.length === 1) return points[0];

  if (listType === 'ol') {
    return `<ol style="margin: 0; padding-left: 14px; line-height: 1.4; font-size: 10.5pt;">${points
      .map((p) => `<li style="margin-bottom: 2px;">${p}</li>`)
      .join('')}</ol>`;
  }

  return `<ul style="margin: 0; padding-left: 14px; line-height: 1.4; font-size: 10.5pt;">${points
    .map((p) => `<li style="margin-bottom: 2px;">${p}</li>`)
    .join('')}</ul>`;
}

/**
 * Format materi atau daftar poin untuk PDF (jsPDF / autoTable):
 * Menghasilkan string dengan pemisah baris baru berpoin (\n• ... atau \n1. ...),
 * memastikan setiap materi tersusun rapi pada baris baru.
 */
export function formatListToPDFText(
  input: string | string[] | undefined | null,
  mode: 'bullet' | 'numbered' = 'numbered',
  fallback: string = '-'
): string {
  const points = extractCleanPoints(input);
  if (points.length === 0) return fallback;
  if (points.length === 1) return points[0];

  if (mode === 'bullet') {
    return points.map((p) => `• ${p}`).join('\n');
  }
  return points.map((p, i) => `${i + 1}. ${p}`).join('\n');
}

export interface RasionalTaksonomiData {
  ringkasanKKO: { lots: string[]; mots: string[]; hots: string[] };
  persentase: { lots: number; mots: number; hots: number };
  totalTP: number;
  totalJP: number;
  fase: string;
  mapel: string;
  rasionalText: string;
  rekomendasiList: string[];
}

/**
 * Menghasilkan analisis rasional penurunan CP ke TP dan rekomendasi pedagogis
 * berbasis taksonomi kognitif (Taksonomi Bloom Revisi) sesuai regulasi BSKAP 046/2025 & Permendikdasmen 13/2025.
 */
export function getRasionalDanTaksonomiBedahCP(
  tpList: TPItem[],
  identitas: SchoolIdentity,
  rasionalAnalisis?: string
): RasionalTaksonomiData {
  const lotsKeywords = ['identifikasi', 'kenal', 'sebut', 'jelas', 'paham', 'baca', 'tunjuk', 'simak', 'tulis', 'amati'];
  const motsKeywords = ['terap', 'aplikasi', 'hitung', 'klasifikasi', 'kelompok', 'demonstrasi', 'laku', 'gunakan', 'urut'];
  const hotsKeywords = ['analisis', 'selidiki', 'evaluasi', 'rancang', 'kreasi', 'buat', 'kembang', 'banding', 'simpul', 'korelasikan', 'kaji'];

  const lotsKKO = new Set<string>();
  const motsKKO = new Set<string>();
  const hotsKKO = new Set<string>();

  let countLOTS = 0;
  let countMOTS = 0;
  let countHOTS = 0;

  tpList.forEach((tp) => {
    const komp = (tp.kompetensi || '').toLowerCase();
    const isHOTS = hotsKeywords.some((k) => komp.includes(k));
    const isMOTS = motsKeywords.some((k) => komp.includes(k));
    const isLOTS = lotsKeywords.some((k) => komp.includes(k));

    if (isHOTS) {
      countHOTS++;
      if (tp.kompetensi) hotsKKO.add(tp.kompetensi);
    } else if (isMOTS) {
      countMOTS++;
      if (tp.kompetensi) motsKKO.add(tp.kompetensi);
    } else {
      countLOTS++;
      if (tp.kompetensi) lotsKKO.add(tp.kompetensi);
    }
  });

  const total = tpList.length || 1;
  const pctLOTS = Math.round((countLOTS / total) * 100);
  const pctMOTS = Math.round((countMOTS / total) * 100);
  const pctHOTS = Math.max(0, 100 - pctLOTS - pctMOTS);

  const totalJP = tpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);

  const defaultRasional = rasionalAnalisis ||
    `Penurunan Capaian Pembelajaran (CP) mata pelajaran ${identitas.mataPelajaran || 'terkait'} (${identitas.fase || 'Fase B'}) menjadi Tujuan Pembelajaran (TP) disusun secara terstruktur, terpadu, dan berkesinambungan berlandaskan ${getCpRegulationInfo(identitas.mataPelajaran).fullName} dan Permendikdasmen No. 13 Tahun 2025. Perumusan mengintegrasikan penguasaan konten materi esensial dengan kompetensi operasional melalui pendekatan bertahap (scaffolding) dari ranah pemahaman konkret menuju penalaran tingkat tinggi (HOTS), sehingga menjamin ketercapaian kompetensi lulusan yang adaptif, mandiri, dan berkarakter sesuai Dimensi Profil Lulusan.`;

  const rekomendasiList = [
    `Penerapan Diferensiasi Pembelajaran: Memberikan scaffolding dan media konkret bagi murid pada domain pemahaman dasar (LOTS C1-C2), serta menyediakan pengayaan proyek pemecahan masalah (HOTS C4-C6) bagi murid yang mencapai penguasaan lebih cepat.`,
    `Asesmen Autentik Berkelanjutan: Melaksanakan asesmen formatif berkala (assessment as & for learning) menggunakan rubrik kinerja dan lembar observasi untuk mendeteksi kesiapan belajar dan hambatan belajar sebelum melaksanakan asesmen sumatif lingkup materi.`,
    `Penguatan Dimensi Profil Lulusan: Memadukan secara eksplisit 8 Dimensi Profil Lulusan (khususnya Penalaran Kritis, Kemandirian, dan Kolaborasi) pada setiap aktivitas eksplorasi konsep dan penugasan kolaboratif.`,
    `Keluwesan Alokasi Waktu (${totalJP} JP Total): Jam pelajaran intrakurikuler dirancang fleksibel antar-TP sehingga pendidik dapat menyesuaikan kecepatan pengajaran berdasarkan daya serap murid.`
  ];

  return {
    ringkasanKKO: {
      lots: Array.from(lotsKKO),
      mots: Array.from(motsKKO),
      hots: Array.from(hotsKKO)
    },
    persentase: { lots: pctLOTS, mots: pctMOTS, hots: pctHOTS },
    totalTP: tpList.length,
    totalJP,
    fase: identitas.fase || 'Fase B',
    mapel: identitas.mataPelajaran || 'Mata Pelajaran',
    rasionalText: defaultRasional,
    rekomendasiList
  };
}

// ==========================================
// 0. EXPORT DOKUMEN BEDAH & ANALISIS CP KE TP KE WORD (.DOC)
// ==========================================
export function exportTPAnalysisToWord(
  tpList: TPItem[],
  identitas: SchoolIdentity,
  elemen: string,
  capaianPembelajaran: string,
  rasionalAnalisis?: string,
  elemenRows?: Array<{
    id: string;
    elemen: string;
    capaianPembelajaran: string;
    daftarKompetensi: string[];
    daftarLingkupMateri: string[];
    daftarTP: TPItem[];
  }>
) {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const fase = identitas.fase || 'Fase B';
  const kelasCols =
    fase === 'Fase A' ? ['1', '2'] : fase === 'Fase B' ? ['3', '4'] : ['5', '6'];

  const rowsToRender =
    elemenRows && elemenRows.length > 0
      ? elemenRows
      : [
          {
            id: 'row-1',
            elemen: elemen || 'Pemahaman IPAS',
            capaianPembelajaran: capaianPembelajaran || '',
            daftarKompetensi: Array.from(new Set(tpList.map((t) => t.kompetensi).filter(Boolean))).map((k, i) => `${i + 1}. ${k}`),
            daftarLingkupMateri: Array.from(new Set(tpList.map((t) => t.lingkupMateri).filter(Boolean))).map((m, i) => `${i + 1}. ${m}`),
            daftarTP: tpList,
          },
        ];

  const rasionalData = getRasionalDanTaksonomiBedahCP(tpList, identitas, rasionalAnalisis);

  const tbodyHtml = rowsToRender
    .map((row) => {
      const rowKompetensi = row.daftarKompetensi || [];
      const rowMateri = row.daftarLingkupMateri || [];
      const rowTPs = row.daftarTP || [];
      const span = Math.max(rowTPs.length, 1);

      if (rowTPs.length === 0) {
        return `
        <tr>
          <td style="font-weight: bold; vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 11pt;">${row.elemen}</td>
          <td style="text-align: justify; font-size: 11pt; line-height: 1.35; vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 25%;">${(row.capaianPembelajaran || '').replace(/\n/g, '<br/>')}</td>
          <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 11pt;">
            <ol style="margin: 0; padding-left: 16px;">
              ${rowKompetensi.map((k) => `<li>${k.replace(/^\d+\.\s*/, '')}</li>`).join('')}
            </ol>
          </td>
          <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 20%; font-size: 11pt;">
            <ol style="margin: 0; padding-left: 16px;">
              ${rowMateri.map((m) => `<li>${m.replace(/^\d+\.\s*/, '')}</li>`).join('')}
            </ol>
          </td>
          <td style="vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; font-size: 11pt; width: 23%; color: #666; font-style: italic;">
            Belum ada TP yang dirumuskan
          </td>
          ${kelasCols.map(() => `<td style="text-align: center; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 4px; font-weight: bold; font-size: 11pt; width: 6%; white-space: nowrap;">-</td>`).join('')}
        </tr>
        `;
      }

      return rowTPs.map((tp, tIdx) => {
        const centang = Array.isArray(tp.kelasCentang)
          ? tp.kelasCentang
          : [tp.kelasTarget || kelasCols[0]];

        const kelasCells = kelasCols.map((k) => {
          const isCentang = centang.includes(k);
          return `
            <td style="text-align: center; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 4px; font-weight: bold; font-size: 11pt; width: 6%; white-space: nowrap;">
              ${isCentang ? 'v' : '-'}
            </td>
          `;
        }).join('');

        const tpKomp = tp.kompetensi 
          ? tp.kompetensi.replace(/^\d+\.\s*/, '')
          : (rowKompetensi[tIdx] ? rowKompetensi[tIdx].replace(/^\d+\.\s*/, '') : (tIdx === 0 ? rowKompetensi.map((k, i) => `${i + 1}. ${k.replace(/^\d+\.\s*/, '')}`).join('<br/>') : '— s.d.a —'));

        const rawTpMat = tp.lingkupMateri
          ? tp.lingkupMateri.replace(/^\d+\.\s*/, '')
          : (rowMateri[tIdx] ? rowMateri[tIdx].replace(/^\d+\.\s*/, '') : (tIdx === 0 ? rowMateri.map((m, i) => `${i + 1}. ${m.replace(/^\d+\.\s*/, '')}`).join('<br/>') : '— s.d.a —'));

        const tpKompPoints = extractCleanPoints(tp.kompetensi || (rowKompetensi[tIdx] ? rowKompetensi[tIdx] : []));
        const renderedTpKomp = tpKompPoints.length > 1
          ? `<ul style="margin: 0; padding-left: 14px; line-height: 1.35; font-size: 10.5pt;">${tpKompPoints.map((k) => `<li style="margin-bottom: 2px;">${k}</li>`).join('')}</ul>`
          : (tpKompPoints[0] || tpKomp);

        const tpMatPoints = extractCleanPoints(tp.lingkupMateri || (rowMateri[tIdx] ? rowMateri[tIdx] : []));
        const renderedTpMat = tpMatPoints.length > 1
          ? `<ul style="margin: 0; padding-left: 14px; line-height: 1.35; font-size: 10.5pt;">${tpMatPoints.map((m) => `<li style="margin-bottom: 2px;">${m}</li>`).join('')}</ul>`
          : (tpMatPoints[0] || rawTpMat);

        if (tIdx === 0) {
          const allKompPoints = extractCleanPoints(rowKompetensi);
          const allMatPoints = extractCleanPoints(rowMateri);
          return `
          <tr style="page-break-inside: avoid;">
            <td style="font-weight: bold; vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 11pt;">
              ${row.elemen}
            </td>
            <td style="text-align: justify; font-size: 11pt; line-height: 1.35; vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 25%;">
              ${(row.capaianPembelajaran || '').replace(/\n/g, '<br/>')}
            </td>
            <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 11pt;">
              <ol style="margin: 0; padding-left: 16px; line-height: 1.4;">
                ${allKompPoints.map((k) => `<li style="margin-bottom: 2px;">${k}</li>`).join('')}
              </ol>
            </td>
            <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 20%; font-size: 11pt;">
              <ol style="margin: 0; padding-left: 16px; line-height: 1.4;">
                ${allMatPoints.map((m) => `<li style="margin-bottom: 2px;">${m}</li>`).join('')}
              </ol>
            </td>
            <td style="vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; font-size: 11pt; line-height: 1.35; width: 23%;">
              &bull; ${formatTPWithCode(tp.kodeTP, tp.rumusanTP)} <em style="font-size: 11pt; color: #1e3a8a;">(${tp.alokasiJP || 4} JP)</em>
            </td>
            ${kelasCells}
          </tr>
          `;
        }

        return `
        <tr style="page-break-inside: avoid;">
          <td style="font-weight: normal; vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 10pt; color: #333;">
            ${row.elemen}
          </td>
          <td style="text-align: center; font-size: 10pt; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 25%; color: #666; font-style: italic;">
            — s.d.a —<br/><span style="font-size: 9pt; font-style: normal; color: #888;">(Elemen ${row.elemen})</span>
          </td>
          <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 12%; font-size: 10.5pt;">
            ${renderedTpKomp}
          </td>
          <td style="vertical-align: top; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; width: 20%; font-size: 10.5pt;">
            ${renderedTpMat}
          </td>
          <td style="vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; font-size: 11pt; line-height: 1.35; width: 23%;">
            &bull; ${formatTPWithCode(tp.kodeTP, tp.rumusanTP)} <em style="font-size: 11pt; color: #1e3a8a;">(${tp.alokasiJP || 4} JP)</em>
          </td>
          ${kelasCells}
        </tr>
        `;
      }).join('');
    })
    .join('');

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Analisis Capaian Pembelajaran ke Tujuan Pembelajaran - ${identitas.mataPelajaran}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.8cm 2cm 1.8cm 2.5cm; /* margin landscape optimal */
      mso-page-orientation: landscape;
    }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000; }
    h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; color: #000; margin-top: 15px; margin-bottom: 5px; }
    .cover-title { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 40px; line-height: 1.4; }
    .cover-mapel { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 30px; }
    .cover-school { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 30px; margin-bottom: 60px; line-height: 1.5; }
    .page-break { page-break-before: always; }
    table { width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0; margin-top: 8px; margin-bottom: 15px; font-size: 11pt; font-family: 'Times New Roman', Times, serif; }
    th, td { border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; vertical-align: top; line-height: 1.5; }
    th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 11pt; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; line-height: 1.5; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .sub-head { font-style: italic; font-size: 11pt; font-weight: normal; }
    .table-identitas td { border: none; padding: 3px 6px; font-size: 11pt; line-height: 1.5; }
    .footer-ttd { margin-top: 35px; width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    .footer-ttd td { border: none; width: 50%; text-align: left; padding: 2px 10px 2px 30px; font-size: 10.5pt; line-height: 1.35; vertical-align: top; }
    ol, ul { margin-top: 4px; margin-bottom: 8px; padding-left: 20px; font-size: 11pt; line-height: 1.5; }
    li { margin-bottom: 5px; line-height: 1.5; }
  </style>
</head>
<body>
  <!-- HALAMAN 1: COVER DOKUMEN -->
  ${identitas.logoUrl ? `
  <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
    <img src="${identitas.logoUrl}" style="max-height: 95px; max-width: 95px; object-fit: contain;" alt="Logo Satuan Pendidikan" />
  </div>` : ''}
  <div class="cover-title" style="${identitas.logoUrl ? 'margin-top: 15px;' : ''}">
    ANALISIS CAPAIAN PEMBELAJARAN KE<br/>
    TUJUAN PEMBELAJARAN
  </div>

  <div class="cover-mapel">
    ${identitas.mataPelajaran || 'IPAS'} (${lockWordData(identitas.fase || 'FASE B', 'Fase')} - ${lockWordData('KELAS ' + (identitas.kelas || '4'), 'Kelas')})
  </div>

  <div class="cover-school" style="margin: 25px auto 50px auto; width: 60%;">
    <table style="width: 100%; border: none; border-collapse: collapse; font-size: 11pt; text-align: left;">
      <tr>
        <td style="width: 32%; padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Satuan Pendidikan</td>
        <td style="width: 4%; padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="width: 64%; padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">${lockWordData(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Satuan Pendidikan')}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Tahun Pelajaran</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;">${lockWordData(identitas.tahunPelajaran || '2026/2027', 'Tahun Pelajaran')}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Penyusun / Guru</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;"><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td>
      </tr>
      ${identitas.alokasiWaktuTotal ? `
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Alokasi Intrakurikuler</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;">${lockWordData(identitas.alokasiWaktuTotal, 'Alokasi Waktu')}</td>
      </tr>` : ''}
    </table>
  </div>

  <div class="page-break"></div>

  <!-- HALAMAN 2: IDENTITAS & MATRIKS BEDAH ANALISIS CP KE TP -->
  <table class="table-identitas" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 12px;">
    <tr>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Satuan Pendidikan</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 40%; font-weight: bold; vertical-align: top; padding: 2px 0;">${lockWordData(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Satuan Pendidikan')}</td>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Fase / Kelas</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 20%; vertical-align: top; padding: 2px 0;">${lockWordData(identitas.fase, 'Fase')} / Kelas ${lockWordData(identitas.kelas, 'Kelas')}</td>
    </tr>
    <tr>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Mata Pelajaran</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 40%; font-weight: bold; vertical-align: top; padding: 2px 0;">${identitas.mataPelajaran || '-'}</td>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Tahun Pelajaran</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 20%; vertical-align: top; padding: 2px 0;">${lockWordData(identitas.tahunPelajaran, 'Tahun Pelajaran')}</td>
    </tr>
    <tr>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Penyusun</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 40%; vertical-align: top; padding: 2px 0;"><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td>
      <td style="width: 17%; font-weight: bold; vertical-align: top; padding: 2px 0;">Alokasi Waktu</td>
      <td style="width: 3%; text-align: center; vertical-align: top; padding: 2px 0; font-weight: bold;">:</td>
      <td style="width: 20%; vertical-align: top; padding: 2px 0;">${lockWordData(identitas.alokasiWaktuTotal || '-', 'Alokasi Waktu')}</td>
    </tr>
  </table>

  <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0;">
    <thead>
      <tr>
        <th rowspan="2" style="width: 12%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">Elemen</th>
        <th rowspan="2" style="width: 25%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
          Capaian Pembelajaran<br/>
          <span class="sub-head">(${getCpRegulationInfo(identitas.mataPelajaran).shortName})</span>
        </th>
        <th rowspan="2" style="width: 12%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
          Kompetensi<br/>
          <span class="sub-head">(KKO Taksonomi)</span>
        </th>
        <th rowspan="2" style="width: 20%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
          Lingkup Materi/Konten<br/>
          <span class="sub-head">(Materi Esensial CP)</span>
        </th>
        <th rowspan="2" style="width: 19%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
          Tujuan Pembelajaran (TP)<br/>
          <span class="sub-head">(Kompetensi + Konten)</span>
        </th>
        <th colspan="${kelasCols.length}" style="width: 12%; vertical-align: middle; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
          Alokasi Kelas (${kelasCols.join(' | ')})<br/>
          <span class="sub-head">(Penetapan Kelas)</span>
        </th>
      </tr>
      <tr>
        ${kelasCols.map((k) => `<th style="font-weight: bold; text-align: center; width: 6%; white-space: nowrap; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">Kelas ${k}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>

  <!-- HALAMAN TERPISAH: LEMBAR RASIONAL, REKOMENDASI TAKSONOMI BEDAH CP & PENGESAHAN -->
  <div class="page-break"></div>
  <div style="page-break-before: always; margin-top: 20px;">
    <div style="text-align: center; border-bottom: 2px double #000; padding-bottom: 8px; margin-bottom: 16px;">
      <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
        LEMBAR RASIONAL &amp; REKOMENDASI TAKSONOMI BEDAH CP
      </h3>
      <p style="margin: 3px 0 0 0; font-size: 11pt; font-style: italic;">
        Landasan Pedagogis, Distribusi Dimensi Kognitif (Taksonomi Bloom Revisi), dan Pengesahan Analisis Capaian Pembelajaran
      </p>
    </div>

    <table style="width: 100%; border: none; margin-bottom: 14px; border-collapse: collapse;">
      <tr>
        <td style="border: none; width: 50%; vertical-align: top; padding-right: 12px;">
          <h4 style="font-size: 11pt; margin: 0 0 6px 0; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
            A. RASIONAL PENURUNAN CP KE TP
          </h4>
          <p style="text-align: justify; font-size: 11pt; line-height: 1.45; margin: 0 0 10px 0;">
            ${rasionalData.rasionalText}
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11pt; line-height: 1.4;">
            <strong>Regulasi Acuan:</strong> ${getCpRegulationInfo(identitas.mataPelajaran).fullName} &amp; Permendikdasmen No. 13 Tahun 2025 (Alokasi Beban Belajar Resmi).<br/>
            <strong>Total Volume Beban:</strong> ${rasionalData.totalTP} Tujuan Pembelajaran (${rasionalData.totalJP} JP Intrakurikuler).
          </div>
        </td>
        <td style="border: none; width: 50%; vertical-align: top; padding-left: 12px;">
          <h4 style="font-size: 11pt; margin: 0 0 6px 0; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
            B. PEMETAAN DIMENSI KOGNITIF (BLOOM REVISI)
          </h4>
          <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 4px; margin-bottom: 6px;">
            <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center;">
              <th style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">Tingkat Kognitif</th>
              <th style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">Porsi (%)</th>
              <th style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">KKO Representatif</th>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;"><strong>C1 - C2</strong> (Pemahaman Dasar / LOTS)</td>
              <td style="padding: 5px; text-align: center; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-weight: bold;">${rasionalData.persentase.lots}%</td>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-size: 11pt;">${rasionalData.ringkasanKKO.lots.slice(0, 4).join(', ') || 'Memahami, Mengidentifikasi'}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;"><strong>C3</strong> (Penerapan Konsep / MOTS)</td>
              <td style="padding: 5px; text-align: center; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-weight: bold;">${rasionalData.persentase.mots}%</td>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-size: 11pt;">${rasionalData.ringkasanKKO.mots.slice(0, 4).join(', ') || 'Mempraktikkan, Mengelompokkan'}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;"><strong>C4 - C6</strong> (Penalaran Tinggi / HOTS)</td>
              <td style="padding: 5px; text-align: center; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-weight: bold;">${rasionalData.persentase.hots}%</td>
              <td style="padding: 5px; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; font-size: 11pt;">${rasionalData.ringkasanKKO.hots.slice(0, 4).join(', ') || 'Menganalisis, Merancang'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- POIN C & AREA TANDA TANGAN: WAJIB DAN HARUS 1 HALAMAN TIDAK TERPISAH -->
    <div style="page-break-inside: avoid; mso-break-inside: avoid;">
      <h4 style="font-size: 10.5pt; margin: 8px 0 4px 0; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
        C. REKOMENDASI PEDAGOGIS PELAKSANAAN PEMBELAJARAN
      </h4>
      <ol style="margin-top: 3px; margin-bottom: 12px; padding-left: 20px; font-size: 9.5pt; line-height: 1.35;">
        ${(rasionalData.rekomendasiList || []).map((rek) => `<li style="margin-bottom: 2.5px;">${rek}</li>`).join('')}
      </ol>

      <!-- AREA TANDA TANGAN PENGESAHAN DOKUMEN (FORMAT RESMI KEDINASAN) -->
      <table class="footer-ttd" style="width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: avoid;">
        <tr>
          <td>Mengetahui,</td>
          <td>${identitas.tempatPenetapan || 'Fatubai'}, ${identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
        <tr>
          <td><strong>Kepala Sekolah</strong></td>
          <td><strong>${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')}</strong></td>
        </tr>
        <tr>
          <td style="padding-top: 40pt; vertical-align: bottom;">
            <strong><u>${lockWordData(identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Nama Kepala Sekolah')}</u></strong>
          </td>
          <td style="padding-top: 40pt; vertical-align: bottom;">
            <strong><u>${lockWordData(identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd', 'Nama Guru')}</u></strong>
          </td>
        </tr>
        <tr>
          <td>NIP. ${lockWordData(identitas.nipKepalaSekolah || '196709192008011008', 'NIP Kepala Sekolah')}</td>
          <td>NIP. ${lockWordData(identitas.nipGuru || '198603012020121005', 'NIP Guru')}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
  `;

  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  downloadBlob(
    htmlContent,
    `Bedah_CP_ke_TP_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.doc`,
    'application/msword'
  );
}

// ==========================================
// 0.1 EXPORT DOKUMEN BEDAH CP KE TP KE PDF
// ==========================================
export function exportTPAnalysisToPDF(
  tpList: TPItem[],
  identitas: SchoolIdentity,
  elemen: string,
  capaianPembelajaran: string,
  rasionalAnalisis?: string,
  elemenRows?: Array<{
    id: string;
    elemen: string;
    capaianPembelajaran: string;
    daftarKompetensi: string[];
    daftarLingkupMateri: string[];
    daftarTP: TPItem[];
  }>,
  layoutOptions?: Partial<PDFLayoutOptions>
) {
  const layout = resolvePDFLayout(layoutOptions, 'landscape');

  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: layout.format as any,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Safe landscape margins to ensure the 6-7 column table has maximum comfortable room
  const marginLeft = Math.max(10, Math.min(layout.marginLeft, 15));
  const marginRight = Math.max(10, Math.min(layout.marginRight, 15));
  const marginTop = Math.max(10, Math.min(layout.marginTop, 15));
  const marginBottom = Math.max(10, Math.min(layout.marginBottom, 15));
  const contentWidth = pageWidth - marginLeft - marginRight;
  const tablePrintableWidth = contentWidth;

  // PAGE 1: COVER PAGE
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      // Ukuran akademis proporsional cover: ~28mm x 28mm
      doc.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', (pageWidth - 28) / 2, 22, 28, 28);
    } catch (e) {
      console.warn('Gagal memuat logo pada cover PDF:', e);
    }
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  const coverTitleY = identitas.logoUrl ? 64 : 60;
  doc.text('ANALISIS CAPAIAN PEMBELAJARAN KE', pageWidth / 2, coverTitleY, { align: 'center' });
  doc.text('TUJUAN PEMBELAJARAN', pageWidth / 2, coverTitleY + 12, { align: 'center' });

  doc.setFontSize(16);
  doc.text((identitas.mataPelajaran || 'IPAS').toUpperCase(), pageWidth / 2, 96, { align: 'center' });
  doc.setFontSize(12.5);
  doc.text(`${(identitas.fase || 'FASE C').toUpperCase()}${identitas.kelas ? ` - KELAS ${identitas.kelas}` : ''}`, pageWidth / 2, 105, { align: 'center' });

  doc.setFontSize(13);
  doc.text((identitas.namaSatuanPendidikan || 'SD Negeri Fatubai').toUpperCase(), pageWidth / 2, 130, { align: 'center' });
  doc.text((identitas.tahunPelajaran || '2026/2027').toUpperCase(), pageWidth / 2, 138, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Penyusun: ${identitas.namaGuru || '-'}`, pageWidth / 2, 146, { align: 'center' });
  if (identitas.alokasiWaktuTotal) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Alokasi Intrakurikuler: ${identitas.alokasiWaktuTotal}`, pageWidth / 2, 153, { align: 'center' });
  }

  // PAGE 2: EXACT TABLE
  doc.addPage(layout.format as any, layout.orientation);
  let currentY = marginTop;

  // Render Official Identity Header on Page 2 with strictly aligned colons (:)
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: tablePrintableWidth,
    body: [
      [
        { content: 'Satuan Pendidikan', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', styles: { fontStyle: 'bold', cellWidth: 92 } },
        { content: 'Fase / Kelas', styles: { fontStyle: 'bold', cellWidth: 26 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: `${identitas.fase || 'Fase B'} / Kelas ${identitas.kelas || '-'}`, styles: { cellWidth: 'auto' } },
      ],
      [
        { content: 'Mata Pelajaran', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: identitas.mataPelajaran || '-', styles: { fontStyle: 'bold', cellWidth: 92 } },
        { content: 'Tahun Pelajaran', styles: { fontStyle: 'bold', cellWidth: 26 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: identitas.tahunPelajaran || '2026/2027', styles: { cellWidth: 'auto' } },
      ],
      [
        { content: 'Penyusun / Guru', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: identitas.namaGuru || '-', styles: { cellWidth: 92 } },
        { content: 'Alokasi Waktu', styles: { fontStyle: 'bold', cellWidth: 26 } },
        { content: ':', styles: { halign: 'center', cellWidth: 4, fontStyle: 'bold' } },
        { content: identitas.alokasiWaktuTotal || '-', styles: { cellWidth: 'auto' } },
      ],
    ],
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: { top: 0.8, bottom: 0.8, left: 0.5, right: 0.5 },
      textColor: [0, 0, 0],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  const fase = identitas.fase || 'Fase B';
  let kelasCols: string[] = ['5', '6'];
  if (fase === 'Fase A') kelasCols = ['1', '2'];
  else if (fase === 'Fase B') kelasCols = ['3', '4'];
  else if (fase === 'Fase C') kelasCols = ['5', '6'];
  else if (fase === 'Fase D') kelasCols = ['7', '8', '9'];
  else if (fase === 'Fase E') kelasCols = ['10'];
  else if (fase === 'Fase F') kelasCols = ['11', '12'];

  const rowsToRender =
    elemenRows && elemenRows.length > 0
      ? elemenRows
      : [
          {
            id: 'row-1',
            elemen: elemen || 'Pemahaman IPAS',
            capaianPembelajaran: capaianPembelajaran || '',
            daftarKompetensi: Array.from(new Set(tpList.map((t) => t.kompetensi).filter(Boolean))).map((k, i) => `${i + 1}. ${k}`),
            daftarLingkupMateri: Array.from(new Set(tpList.map((t) => t.lingkupMateri).filter(Boolean))).map((m, i) => `${i + 1}. ${m}`),
            daftarTP: tpList,
          },
        ];

  const tableHead = [
    [
      { content: 'Elemen', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: `Capaian Pembelajaran\n(${getCpRegulationInfo(identitas.mataPelajaran).shortName})`, rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'Kompetensi\n(Kata Kerja Operasional / KKO)', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'Lingkup Materi / Konten\n(Materi Esensial CP)', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'Tujuan Pembelajaran (TP)\n(Kompetensi + Konten & JP)', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: `Penetapan Kelas\n(${identitas.fase})`, colSpan: kelasCols.length, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 } } },
    ],
    [
      ...kelasCols.map((k) => ({
        content: `Kelas ${k}`,
        styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fillColor: [240, 240, 240], fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 } },
      })),
    ],
  ];

  const tableBody: any[] = [];
  rowsToRender.forEach((row) => {
    const rowKompetensi = row.daftarKompetensi || [];
    const rowMateri = row.daftarLingkupMateri || [];
    const rowTPs = row.daftarTP || [];

    const kompClean = extractCleanPoints(rowKompetensi);
    const matClean = extractCleanPoints(rowMateri);
    const kompText = formatListToPDFText(kompClean, 'numbered');
    const matText = formatListToPDFText(matClean, 'numbered');

    if (rowTPs.length === 0) {
      tableBody.push([
        { content: row.elemen || 'Elemen', styles: { fontStyle: 'bold' as const, valign: 'top' as const, fontSize: 8.5 } },
        { content: row.capaianPembelajaran || '-', styles: { valign: 'top' as const, fontSize: 8 } },
        { content: kompText, styles: { valign: 'top' as const, fontSize: 8 } },
        { content: matText, styles: { valign: 'top' as const, fontSize: 8 } },
        { content: 'Belum ada TP yang dirumuskan', styles: { valign: 'top' as const, fontSize: 8, fontStyle: 'italic' as const } },
        ...kelasCols.map(() => ({ content: '-', styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 } } })),
      ]);
      return;
    }

    rowTPs.forEach((tp, tIdx) => {
      const centang = Array.isArray(tp.kelasCentang)
        ? tp.kelasCentang
        : [tp.kelasTarget || kelasCols[0]];
      const cleanCentang = centang.map((c) => String(c).trim());

      const checkCells = kelasCols.map((k) => ({
        content: cleanCentang.includes(String(k).trim()) ? 'v' : '-',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 8.5,
          cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 },
        },
      }));

      const tpCell = {
        content: `\u2022 ${formatTPWithCode(tp.kodeTP, tp.rumusanTP)} (${tp.alokasiJP || 4} JP)`,
        styles: { valign: 'middle' as const, fontSize: 8.5 },
      };

      const rawTpKomp = tp.kompetensi 
        ? tp.kompetensi.replace(/^\d+\.\s*/, '')
        : (rowKompetensi[tIdx] ? rowKompetensi[tIdx].replace(/^\d+\.\s*/, '') : (tIdx === 0 ? kompText : '— s.d.a —'));

      const rawTpMat = tp.lingkupMateri
        ? tp.lingkupMateri.replace(/^\d+\.\s*/, '')
        : (rowMateri[tIdx] ? rowMateri[tIdx].replace(/^\d+\.\s*/, '') : (tIdx === 0 ? matText : '— s.d.a —'));

      const tpKompPoints = extractCleanPoints(tp.kompetensi || (rowKompetensi[tIdx] ? rowKompetensi[tIdx] : []));
      const tpKompFormatted = tpKompPoints.length > 1
        ? formatListToPDFText(tpKompPoints, 'bullet')
        : (tpKompPoints[0] || rawTpKomp);

      const tpMatPoints = extractCleanPoints(tp.lingkupMateri || (rowMateri[tIdx] ? rowMateri[tIdx] : []));
      const tpMatFormatted = tpMatPoints.length > 1
        ? formatListToPDFText(tpMatPoints, 'bullet')
        : (tpMatPoints[0] || rawTpMat);

      if (tIdx === 0) {
        tableBody.push([
          { content: row.elemen || 'Elemen', styles: { fontStyle: 'bold' as const, valign: 'top' as const, fontSize: 8.5 } },
          { content: row.capaianPembelajaran || '-', styles: { valign: 'top' as const, fontSize: 8 } },
          { content: kompText || tpKompFormatted, styles: { valign: 'top' as const, fontSize: 8 } },
          { content: matText || tpMatFormatted, styles: { valign: 'top' as const, fontSize: 8 } },
          tpCell,
          ...checkCells,
        ]);
      } else {
        tableBody.push([
          { content: row.elemen || 'Elemen', styles: { fontStyle: 'normal' as const, valign: 'top' as const, fontSize: 8, textColor: [0, 0, 0] } },
          { content: `— s.d.a —\n(${row.elemen})`, styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 7.5, textColor: [0, 0, 0], fontStyle: 'italic' as const } },
          { content: tpKompFormatted, styles: { valign: 'top' as const, fontSize: 8 } },
          { content: tpMatFormatted, styles: { valign: 'top' as const, fontSize: 8 } },
          tpCell,
          ...checkCells,
        ]);
      }
    });
  });

  // Class column width: 14mm is ideal for "Kelas X" on a single line and centered checkmark
  const classColWidth = kelasCols.length > 2 ? 12 : 14;
  const totalClassColsWidth = classColWidth * kelasCols.length;

  // Available width for the 5 content columns (Elemen, CP, Komp, Materi, TP)
  const remainingContentWidth = tablePrintableWidth - totalClassColsWidth;

  // Proportional widths allocated according to content volume:
  const colElemenWidth = Math.round(remainingContentWidth * 0.10);      // ~24mm (Elemen)
  const colCPWidth = Math.round(remainingContentWidth * 0.27);          // ~65mm (Capaian Pembelajaran)
  const colKompWidth = Math.round(remainingContentWidth * 0.125);       // ~30mm (Kompetensi KKO)
  const colMatWidth = Math.round(remainingContentWidth * 0.19);         // ~46mm (Lingkup Materi)
  // Col TP takes exact remainder so total sum equals tablePrintableWidth down to exact sub-millimeter
  const colTPWidth = remainingContentWidth - (colElemenWidth + colCPWidth + colKompWidth + colMatWidth); // ~76mm (TP list + JP)

  const dynamicColStyles: Record<number, any> = {
    0: { cellWidth: colElemenWidth, fontStyle: 'bold' },
    1: { cellWidth: colCPWidth },
    2: { cellWidth: colKompWidth },
    3: { cellWidth: colMatWidth },
    4: { cellWidth: colTPWidth },
  };

  kelasCols.forEach((_, idx) => {
    dynamicColStyles[5 + idx] = {
      cellWidth: classColWidth,
      halign: 'center',
      cellPadding: { top: 2, bottom: 2, left: 0.5, right: 0.5 },
    };
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    tableWidth: tablePrintableWidth,
    head: tableHead as any,
    body: tableBody as any,
    theme: 'grid',
    pageBreak: 'auto',
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    headStyles: { 
      font: 'times', 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      fontSize: 9, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.25, 
      halign: 'center', 
      valign: 'middle' 
    },
    styles: { 
      font: 'times', 
      fontSize: 8.5, 
      cellPadding: 2, 
      textColor: [0, 0, 0], 
      lineColor: [0, 0, 0], 
      lineWidth: 0.25, 
      overflow: 'linebreak' 
    },
    columnStyles: dynamicColStyles,
  });

  // =========================================================================
  // LEMBAR RASIONAL, REKOMENDASI TAKSONOMI & TANDA TANGAN (WAJIB 1 HALAMAN UTUH)
  // (Poin C Rekomendasi Pedagogis dan Pengesahan Tanda Tangan berada di 1 halaman yang sama)
  // =========================================================================
  doc.addPage(layout.format as any, layout.orientation);
  const rasionalData = getRasionalDanTaksonomiBedahCP(tpList, identitas, rasionalAnalisis);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('LEMBAR RASIONAL, REKOMENDASI TAKSONOMI & PENGESAHAN ANALISIS CP KE TP', pageWidth / 2, 14.5, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Landasan Pedagogis, Distribusi Dimensi Kognitif (Taksonomi Bloom Revisi), Rekomendasi Pelaksanaan, dan Pengesahan Dokumen', pageWidth / 2, 19, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, 21, pageWidth - marginRight, 21);

  const colGap = 8;
  const col1Width = (pageWidth - marginLeft - marginRight - colGap) / 2;
  const col2X = marginLeft + col1Width + colGap;
  const col2Width = col1Width;

  // --- KOLOM KIRI (A. RASIONAL PENURUNAN CP KE TP) ---
  let col1Y = 26;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('A. RASIONAL PENURUNAN CP KE TP (BSKAP 046/2025)', marginLeft, col1Y);
  col1Y += 4;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  const rasionalLines = doc.splitTextToSize(rasionalData.rasionalText, col1Width - 2);
  doc.text(rasionalLines, marginLeft, col1Y);
  col1Y += rasionalLines.length * 3.3 + 3;

  // Kotak Info Regulasi Acuan & Beban Belajar
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginLeft, col1Y, col1Width, 12, 1, 1, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Regulasi Acuan: Keputusan BSKAP 046/2025 & Permendikdasmen 13/2025', marginLeft + 3, col1Y + 4.5);
  doc.setFont('times', 'normal');
  doc.text(`Total Beban Belajar: ${rasionalData.totalTP} Tujuan Pembelajaran (${rasionalData.totalJP} JP Intrakurikuler)`, marginLeft + 3, col1Y + 9);
  col1Y += 14;

  // --- KOLOM KANAN (B. PEMETAAN DIMENSI KOGNITIF TAKSONOMI BLOOM REVISI) ---
  let col2Y = 26;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('B. PEMETAAN DIMENSI KOGNITIF (BLOOM REVISI)', col2X, col2Y);

  const taksonomiBody = [
    [
      'C1 - C2 (LOTS)',
      `${rasionalData.persentase.lots}%`,
      rasionalData.ringkasanKKO.lots.slice(0, 4).join(', ') || 'Memahami, Mengidentifikasi',
      'Fondasi konsep konkret & scaffolding visual'
    ],
    [
      'C3 (MOTS)',
      `${rasionalData.persentase.mots}%`,
      rasionalData.ringkasanKKO.mots.slice(0, 4).join(', ') || 'Menerapkan, Mengelompokkan',
      'Keterampilan aplikatif & demonstrasi terpandu'
    ],
    [
      'C4 - C6 (HOTS)',
      `${rasionalData.persentase.hots}%`,
      rasionalData.ringkasanKKO.hots.slice(0, 4).join(', ') || 'Menganalisis, Merancang',
      'Nalar kritis, pemecahan masalah kontekstual'
    ]
  ];

  autoTable(doc, {
    startY: 29.5,
    margin: { left: col2X, right: marginRight },
    tableWidth: col2Width,
    head: [['Tingkat Kognitif', 'Porsi', 'KKO Representatif', 'Fokus Intervensi']],
    body: taksonomiBody,
    theme: 'grid',
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center', cellPadding: 1.5 },
    styles: { font: 'times', fontSize: 7.5, cellPadding: 1.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 'auto' },
    }
  });

  const bFinalY = (doc as any).lastAutoTable.finalY;
  let pageY = Math.max(col1Y, bFinalY) + 3;

  // --- BAGIAN C: REKOMENDASI PEDAGOGIS (MEMBENTANG LENGKAP) ---
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('C. REKOMENDASI PEDAGOGIS PELAKSANAAN PEMBELAJARAN', marginLeft, pageY);
  pageY += 4.2;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  rasionalData.rekomendasiList.forEach((rek, idx) => {
    const rekLines = doc.splitTextToSize(`${idx + 1}. ${rek}`, pageWidth - marginLeft - marginRight - 4);
    doc.text(rekLines, marginLeft + 2, pageY);
    pageY += rekLines.length * 3.3 + 1.2;
  });

  pageY += 4;

  // --- AREA TANDA TANGAN (WAJIB DAN HARUS 1 HALAMAN DENGAN POIN C TANPA TERPISAH) ---
  renderSignatures(doc, identitas, pageY, pageWidth, marginLeft, marginRight);

  // Running Page Number
  addDocumentPageNumbers(doc, `Bedah CP-TP - ${identitas.mataPelajaran} (${identitas.fase})`, marginLeft, marginRight);

  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`Bedah_CP_ke_TP_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.pdf`);
}

// ==========================================
// 1. EXPORT ATP KE WORD (.DOC)
// ==========================================
export function exportATPToWord(atp: ATPDocument) {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const { identitas, elemen, capaianPembelajaran, elemenList, atpList, materiPokokList, dimensiProfilLulusan, penjelasanDPL, glosarium, daftarPustaka, rasionalPenyusunan } = atp;

  const resolvedElementsWord = resolveElemenListForATP(atp);

  const elemenSectionsHtml =
    resolvedElementsWord && resolvedElementsWord.length > 0
      ? resolvedElementsWord
          .map(
            (el, i) => `
        <div style="margin-bottom: 12px; background-color: #f9f9f9; padding: 10px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 6px 0; font-size: 11pt; font-weight: bold; color: #1e3a8a;">
            ${i + 1}. Elemen ${el.elemen.replace(/^Elemen\s+/i, '')}
          </h4>
          <p style="text-align: justify; margin: 0; font-size: 11pt; line-height: 1.5;">
            ${formatCPElemenText(el.capaianPembelajaran)}
          </p>
        </div>
      `
          )
          .join('')
      : `
        <p><strong>Elemen: ${(elemen || 'Elemen Pembelajaran').replace(/^Elemen\s+/i, '')}</strong></p>
        <div style="text-align: justify; background-color: #fafafa; padding: 8px; border: 1px solid #ddd; font-size: 11pt;">
          ${formatCPElemenText(capaianPembelajaran)}
        </div>
      `;

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Analisis Tujuan Pembelajaran ke Alur Tujuan Pembelajaran - ${identitas.mataPelajaran}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2.5cm 2cm 2cm 3cm; /* margin kiri 3cm untuk jilid */
    }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000; }
    h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; color: #000; margin-top: 15px; margin-bottom: 5px; }
    h1 { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; line-height: 1.3; }
    h2 { font-size: 11pt; text-align: center; font-weight: bold; margin-bottom: 20px; }
    h3 { font-size: 11pt; font-weight: bold; background-color: #f2f2f2; padding: 6px 10px; border-left: 4px solid #000; margin-top: 24px; margin-bottom: 12px; }
    p { font-size: 11pt; line-height: 1.5; margin-bottom: 8px; }
    .cover-title { font-size: 14pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 40px; line-height: 1.4; }
    .cover-mapel { font-size: 12pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 30px; }
    .cover-school { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 30px; margin-bottom: 60px; line-height: 1.5; }
    .page-break { page-break-before: always; }
    table { width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0; margin-top: 12px; margin-bottom: 16px; font-size: 11pt; font-family: 'Times New Roman', Times, serif; }
    th, td { border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; vertical-align: top; line-height: 1.5; }
    th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 11pt; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; line-height: 1.5; }
    .table-identitas td { border: none; padding: 4px 6px; font-size: 11pt; line-height: 1.5; }
    .footer-ttd { margin-top: 40px; width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    .footer-ttd td { border: none; width: 50%; text-align: left; padding: 2px 10px 2px 30px; font-size: 11pt; line-height: 1.5; vertical-align: top; }
    ol, ul { margin-top: 6px; margin-bottom: 12px; padding-left: 25px; font-size: 11pt; line-height: 1.5; }
    li { margin-bottom: 5px; line-height: 1.5; }
  </style>
</head>
<body>
  <!-- HALAMAN 1: COVER DOKUMEN RESMI -->
  ${identitas.logoUrl ? `
  <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
    <img src="${identitas.logoUrl}" style="max-height: 95px; max-width: 95px; object-fit: contain;" alt="Logo Satuan Pendidikan" />
  </div>` : ''}
  <div class="cover-title" style="${identitas.logoUrl ? 'margin-top: 15px;' : ''}">
    ANALISIS TUJUAN PEMBELAJARAN KE<br/>
    ALUR TUJUAN PEMBELAJARAN (ATP)
  </div>

  <div class="cover-mapel">
    ${identitas.mataPelajaran || 'IPAS'} (${lockWordData(identitas.fase || 'FASE C', 'Fase')} - ${lockWordData('KELAS ' + (identitas.kelas || '5 & 6'), 'Kelas')})
  </div>

  <div class="cover-school" style="margin: 25px auto 50px auto; width: 65%;">
    <table style="width: 100%; border: none; border-collapse: collapse; font-size: 11pt; text-align: left;">
      <tr>
        <td style="width: 35%; padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Satuan Pendidikan</td>
        <td style="width: 4%; padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="width: 61%; padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">${lockWordData(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Satuan Pendidikan')}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Tahun Pelajaran</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;">${lockWordData(identitas.tahunPelajaran || '2026/2027', 'Tahun Pelajaran')}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Penyusun / Guru</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;"><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td>
      </tr>
      ${identitas.alokasiWaktuTotal ? `
      <tr>
        <td style="padding: 3px 0; font-weight: bold; border: none; vertical-align: top;">Alokasi Intrakurikuler</td>
        <td style="padding: 3px 0; text-align: center; font-weight: bold; border: none; vertical-align: top;">:</td>
        <td style="padding: 3px 0; border: none; vertical-align: top;">${lockWordData(identitas.alokasiWaktuTotal, 'Alokasi Waktu')}</td>
      </tr>` : ''}
    </table>
  </div>

  <div class="page-break"></div>

  <!-- HALAMAN 2: DOKUMEN ANALISIS ATP -->
  <h1>ANALISIS TUJUAN PEMBELAJARAN KE ALUR TUJUAN PEMBELAJARAN</h1>
  <h2>KURIKULUM MERDEKA - BSKAP NO. 046 TAHUN 2025</h2>

  <h3>A. IDENTITAS DOKUMEN</h3>
  <table class="table-identitas" style="width: 100%; border: none; border-collapse: collapse; table-layout: fixed;">
    <colgroup>
      <col style="width: 28%;" />
      <col style="width: 3%;" />
      <col style="width: 69%;" />
    </colgroup>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Nama Satuan Pendidikan</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;"><strong>${lockWordData(identitas.namaSatuanPendidikan || '-', 'Satuan Pendidikan')}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Penyusun / Guru</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;"><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Mata Pelajaran</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;"><strong>${identitas.mataPelajaran || '-'}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Fase / Kelas</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;">${lockWordData(identitas.fase, 'Fase')} / Kelas ${lockWordData(identitas.kelas, 'Kelas')}</td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Tahun Pelajaran / Semester</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;">${lockWordData(identitas.tahunPelajaran, 'Tahun Pelajaran')} / Semester ${identitas.semester}</td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 3px 0;">Alokasi Waktu Intrakurikuler</td><td style="width: 3%; text-align: center; vertical-align: top; padding: 3px 0; font-weight: bold;">:</td><td style="width: 69%; vertical-align: top; padding: 3px 0;"><strong>${lockWordData(identitas.alokasiWaktuTotal || atpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0) + ' JP', 'Alokasi Waktu')}</strong></td></tr>
  </table>

  <h3>B & C. ELEMEN DAN CAPAIAN PEMBELAJARAN (TERPISAH PER ELEMEN)</h3>
  ${elemenSectionsHtml}

  ${rasionalPenyusunan ? `
    <p style="line-height: 1.5; margin-top: 10px;"><em><strong>Rasional Alur Pembelajaran:</strong> ${rasionalPenyusunan}</em></p>
  ` : ''}

  <h3>D. ALUR TUJUAN PEMBELAJARAN (ATP)</h3>
  <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0;">
    <thead>
      <tr>
        <th style="width: 4%;">No</th>
        <th style="width: 8%;">Kode TP</th>
        <th style="width: 13%;">Elemen</th>
        <th style="width: 27%;">Tujuan Pembelajaran (TP)</th>
        <th style="width: 18%;">Lingkup Materi</th>
        <th style="width: 6%;">JP</th>
        <th style="width: 12%;">Dimensi Profil Lulusan</th>
        <th style="width: 12%;">Indikator Ketercapaian</th>
      </tr>
    </thead>
    <tbody>
      ${atpList.map((item, idx) => `
        <tr>
          <td style="text-align: center; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${idx + 1}</td>
          <td style="text-align: center; font-weight: bold; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${item.kodeTP}</td>
          <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;"><strong>${resolveSingleElemenForTP(item.elemen, atp.elemen, item.tujuanPembelajaran, item.lingkupMateri, resolvedElementsWord)}</strong></td>
          <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${item.tujuanPembelajaran}</td>
          <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${formatListToWordHtml(item.lingkupMateri, 'ul')}</td>
          <td style="text-align: center; font-weight: bold; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${item.alokasiJP} JP</td>
          <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
            <ul style="margin: 0; padding-left: 14px; font-size: 11pt; line-height: 1.5;">
              ${(Array.isArray(item.dimensiP3) ? item.dimensiP3 : [item.dimensiP3]).map((d) => `<li>${normalizeDimensiProfilLulusan(d)}</li>`).join('')}
            </ul>
          </td>
          <td style="font-size: 11pt; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; line-height: 1.5;">${formatListToWordHtml(item.indikatorKetercapaian, 'ul')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- SECTION E: MATERI POKOK DAN SUB-MATERI (HALAMAN BARU) -->
  <div style="page-break-before: always; mso-break-before: always;">
    <h3>E. MATERI POKOK DAN SUB-MATERI</h3>
    <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0;">
      <thead>
        <tr>
          <th style="width: 20%;">Bab / Unit</th>
          <th style="width: 30%;">Materi Pokok</th>
          <th style="width: 40%;">Sub-Materi Pembelajaran</th>
          <th style="width: 10%;">Estimasi JP</th>
        </tr>
      </thead>
      <tbody>
        ${materiPokokList.map((m) => `
          <tr>
            <td style="font-weight: bold; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${m.bab}</td>
            <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;"><strong>${m.judulMateri}</strong></td>
            <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">
              <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
                ${(m.subMateri || []).map((sm) => `<li>${sm}</li>`).join('')}
              </ul>
            </td>
            <td style="text-align: center; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt;">${m.perkiraanJP} JP</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- SECTION F & G: DIMENSI PROFIL LULUSAN DAN GLOSARIUM (WAJIB 1 HALAMAN) -->
  <div style="page-break-before: always; mso-break-before: always; page-break-inside: avoid; margin-top: 18px;">
    <h3 style="margin-top: 18px; margin-bottom: 12px;">F. DIMENSI PROFIL LULUSAN</h3>
    <ol style="margin-top: 6px; margin-bottom: 14px; padding-left: 24px; font-size: 10.5pt; line-height: 1.45;">
      ${DELAPAN_DIMENSI_PROFIL_LULUSAN.map((dim) => `
        <li style="margin-bottom: 5px; line-height: 1.45; text-align: justify;">
          <strong>${dim.nama}:</strong> ${dim.definisi}
        </li>
      `).join('')}
    </ol>

    <h3 style="margin-top: 16px; margin-bottom: 10px;">G. GLOSARIUM</h3>
    <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0; font-size: 10pt;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="width: 30%; padding: 4px 6px;">Istilah</th>
          <th style="width: 70%; padding: 4px 6px;">Definisi / Penjelasan</th>
        </tr>
      </thead>
      <tbody>
        ${glosarium.map((g) => `
          <tr>
            <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 4px 6px;"><strong>${g.istilah}</strong></td>
            <td style="border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 4px 6px; text-align: justify;">${g.definisi}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- HALAMAN AKHIR TERPADU: DAFTAR PUSTAKA DAN PENGESAHAN DOKUMEN (WAJIB 1 HALAMAN BERSAMA TANDA TANGAN) -->
  <div style="page-break-before: always; mso-break-before: always; page-break-inside: avoid; margin-top: 20px;">
    <h3 style="margin-top: 20px; margin-bottom: 12px;">H. DAFTAR PUSTAKA</h3>
    <ol style="margin-top: 10px; margin-bottom: 24px; padding-left: 24px; font-size: 11pt; line-height: 1.5;">
      ${daftarPustaka.map((dp) => `
        <li style="margin-bottom: 6px; line-height: 1.5; text-align: justify;">${dp.penulis}. (${dp.tahun}). <em>${dp.judul}</em>. ${dp.kota ? dp.kota + ': ' : ''}${dp.penerbit}. ${dp.keterangan ? `(${dp.keterangan})` : ''}</li>
      `).join('')}
    </ol>

    <table class="footer-ttd" style="width: 100%; border-collapse: collapse; margin-top: 36px; page-break-inside: avoid;">
      <tr>
        <td>Mengetahui,</td>
        <td>${identitas.tempatPenetapan || 'Fatubai'}, ${identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr>
        <td><strong>Kepala Sekolah</strong></td>
        <td><strong>${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')}</strong></td>
      </tr>
      <tr>
        <td style="padding-top: 45pt; vertical-align: bottom;">
          <strong><u>${lockWordData(identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Nama Kepala Sekolah')}</u></strong>
        </td>
        <td style="padding-top: 45pt; vertical-align: bottom;">
          <strong><u>${lockWordData(identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd', 'Nama Guru')}</u></strong>
        </td>
      </tr>
      <tr>
        <td>NIP. ${lockWordData(identitas.nipKepalaSekolah || '196709192008011008', 'NIP Kepala Sekolah')}</td>
        <td>NIP. ${lockWordData(identitas.nipGuru || '198603012020121005', 'NIP Guru')}</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  downloadBlob(htmlContent, `Analisis_TP_ke_ATP_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.doc`, 'application/msword');
}

// ==========================================
// HELPER: RESOLVE MULTIPLE MEETINGS FOR RPM & MODUL AJAR
// ==========================================
export function getResolvedMeetings(modul: ModulAjarDocument, overrideAlokasi?: string): PertemuanModul[] {
  const { count, jpList } = parseTotalJPAndCount(modul, overrideAlokasi);

  const rawMeetings = Array.isArray(modul.kegiatanPembelajaran) ? modul.kegiatanPembelajaran : [];
  const resolved: PertemuanModul[] = [];

  const techData = (modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi;
  const lingData = (modul as any).desainPembelajaranRPM?.lingkunganBelajar;
  const optionsParam = {
    mediaList: techData?.mediaDigital && techData.mediaDigital.length > 0 ? techData.mediaDigital : (modul.saranaPrasarana?.mediaAjar || []),
    perangkatList: techData?.perangkatDigital && techData.perangkatDigital.length > 0 ? techData.perangkatDigital : (modul.saranaPrasarana?.fasilitas || []),
    platformList: techData?.platformAplikasi || [],
    metodeList: (modul as any).desainPembelajaranRPM?.praktikPedagogis?.metodePembelajaran || [],
    pendekatan: (modul as any).desainPembelajaranRPM?.praktikPedagogis?.pendekatanPembelajaran || '',
    budayaBelajar: lingData?.budayaBelajar || [],
    lingkunganFisik: lingData?.lingkunganFisik || [],
  };

  for (let m = 1; m <= count; m++) {
    const meetingJP = jpList[m - 1] !== undefined ? jpList[m - 1] : 2;
    const targetModel = modul.modelPembelajaran || (modul as any).desainPembelajaranRPM?.praktikPedagogis?.modelPembelajaran || 'Problem Based Learning (PBL)';
    const stage = getPedagogicalStageForMeeting(
      m,
      count,
      modul.topikMateri || '',
      targetModel,
      (modul.tujuanPembelajaranSpesifik && modul.tujuanPembelajaranSpesifik[0]) || modul.topikMateri || '',
      optionsParam
    );

    const existing = rawMeetings[m - 1];
    const tpText =
      (modul.tujuanPembelajaranSpesifik && modul.tujuanPembelajaranSpesifik[0]) ||
      (modul as any).desainPembelajaranRPM?.tujuanPembelajaran ||
      modul.topikMateri ||
      '';

    if (existing) {
      const rawPendText = Array.isArray(existing.pendahuluan) ? existing.pendahuluan.join(' ') : '';
      const isOldTemplatePend =
        rawPendText.includes('Mindful Learning') ||
        rawPendText.includes('Joyful Learning') ||
        rawPendText.includes('Meaningful Learning') ||
        rawPendText.includes('Review & Bridging') ||
        (m > 1 && /ice\s*breaking/i.test(rawPendText)) ||
        !/pemantik/i.test(rawPendText);

      // Pastikan setiap pertemuan memiliki Kegiatan Awal yang bervariasi, wajib doa & cek kehadiran, dan wajib pertanyaan pemantik sesuai pertemuan
      const pendahuluan =
        Array.isArray(existing.pendahuluan) && existing.pendahuluan.length >= 3 && !isOldTemplatePend
          ? existing.pendahuluan.map((p) => cleanActivityText(p))
          : stage.pendahuluan;

      const rawPenutupText = Array.isArray(existing.penutup) ? existing.penutup.join(' ') : '';
      const isOldTemplatePenutup =
        rawPenutupText.includes('Refleksi Pembelajaran Mendalam:') ||
        rawPenutupText.includes('kartu ekspresi perasaan / lembar refleksi');

      const penutup =
        Array.isArray(existing.penutup) && existing.penutup.length >= 3 && !isOldTemplatePenutup
          ? existing.penutup.map((p) => cleanActivityText(p))
          : stage.penutup;

      const fokusTP = cleanMeetingFokus(
        existing.fokusTP,
        '-',
        m - 1,
        count,
        modul.topikMateri || '',
        tpText
      );

      const firstMeetFirstFase = String(rawMeetings[0]?.kegiatanInti?.[0]?.faseSintaks || '');
      const currFirstFase = String(existing.kegiatanInti?.[0]?.faseSintaks || '');
      const isDuplicateAcrossMeetings = m > 1 && firstMeetFirstFase && currFirstFase === firstMeetFirstFase &&
        String(rawMeetings[0]?.kegiatanInti?.[0]?.aktivitasGuru || '') === String(existing.kegiatanInti?.[0]?.aktivitasGuru || '');

      const isModelMatching = Array.isArray(existing.kegiatanInti) &&
        existing.kegiatanInti.length >= 3 &&
        !isDuplicateAcrossMeetings &&
        isSyntaxMatchingModel(currFirstFase, targetModel);

      const enrichedInti = isModelMatching
        ? existing.kegiatanInti.map((step, idx) => {
            const fallbackStep = stage.kegiatanInti[idx] || stage.kegiatanInti[0];
            return {
              ...step,
              faseSintaks: cleanActivityText(step.faseSintaks || fallbackStep?.faseSintaks),
              aktivitasGuru: cleanActivityText(step.aktivitasGuru || fallbackStep?.aktivitasGuru),
              aktivitasSiswa: cleanActivityText(step.aktivitasSiswa || fallbackStep?.aktivitasSiswa),
              alokasiMenit: step.alokasiMenit || fallbackStep?.alokasiMenit || '10 Menit',
              pengalamanBelajar: cleanActivityText(step.pengalamanBelajar || fallbackStep?.pengalamanBelajar || 'Bermakna'),
              prinsipPembelajaran: cleanActivityText(step.prinsipPembelajaran || fallbackStep?.prinsipPembelajaran || 'Memahami: Mengenal esensi materi secara terstruktur.'),
            };
          })
        : stage.kegiatanInti;

      resolved.push({
        ...existing,
        pertemuanKe: m,
        alokasiWaktu: `${meetingJP} JP (${meetingJP} x 35 Menit)`,
        fokusTP,
        pendahuluan,
        kegiatanInti: enrichedInti,
        penutup,
      });
    } else {
      // Generate dynamically from pedagogical stage
      const fokusTP = cleanMeetingFokus(
        stage.stageName,
        '-',
        m - 1,
        count,
        modul.topikMateri || '',
        tpText
      );

      resolved.push({
        pertemuanKe: m,
        alokasiWaktu: `${meetingJP} JP (${meetingJP} x 35 Menit)`,
        fokusTP,
        pendahuluan: stage.pendahuluan,
        kegiatanInti: stage.kegiatanInti,
        penutup: stage.penutup,
      });
    }
  }

  return resolved;
}

// ==========================================
// 2. EXPORT MODUL AJAR KE WORD (.DOC)
// ==========================================
export function exportModulAjarToWord(modul: ModulAjarDocument) {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const {
    identitas,
    kompetensiAwal = [],
    profilPelajarPancasila = [],
    saranaPrasarana = { fasilitas: [], lingkunganBelajar: [], mediaAjar: [] },
    modelPembelajaran = 'Problem Based Learning',
    tujuanPembelajaranSpesifik = [],
    pemahamanBermakna = [],
    pertanyaanPemantik = [],
    persiapanPembelajaran = [],
    kegiatanPembelajaran = [],
    asesmen,
    pengayaanDanRemedial = { pengayaan: '', remedial: '' },
    refleksi = { refleksiGuru: [], refleksiSiswa: [] },
    lkpd = [],
    bahanBacaanGuruDanSiswa = { ringkasanMateri: '', materiPengayaanSingkat: '' },
    glosarium = [],
    daftarPustaka = [],
    judulModul,
    elemen,
    topikMateri,
    alokasiWaktuPertemuan,
    identifikasiRPM,
    desainPembelajaranRPM,
    langkahPembelajaranRPM,
    asesmenRPM,
    rubrikPenilaianRPM,
    lkpdRPM,
    soalEvaluasiRPM,
  } = modul;

  const isRPM = Boolean(identifikasiRPM || desainPembelajaranRPM || langkahPembelajaranRPM);

  const docJudul = judulModul || (isRPM ? 'RENCANA PEMBELAJARAN MENDALAM' : 'MODUL AJAR KURIKULUM MERDEKA');
  const namaSekolah = lockWordData(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Satuan Pendidikan');
  const namaGuru = lockWordData(identitas.namaGuru || '-', 'Nama Guru');
  const nipGuru = identitas.nipGuru ? lockWordData(identitas.nipGuru, 'NIP Guru') : '';
  const tahunPelajaran = lockWordData(identitas.tahunPelajaran, 'Tahun Pelajaran');
  const semester = identitas.semester;
  const fase = lockWordData(identitas.fase, 'Fase');
  const kelas = lockWordData(identitas.kelas, 'Kelas');
  const mapel = identitas.mataPelajaran;
  const elemenVal = elemen || (modul as any).elemen || '-';
  const topikVal = topikMateri || '-';
  const alokasiVal = alokasiWaktuPertemuan || identitas.alokasiWaktuModul || '2 x 35 Menit (1 kali pertemuan)';
  const { totalJP, count, jpList, formattedIdentityAlokasi } = parseTotalJPAndCount(modul, alokasiVal);
  const finalAlokasiIdentity = formattedIdentityAlokasi || alokasiVal;

  const { idData, dsData, lpData, asData, rbData, lkData, soData } = normalizeRPMData(modul, {
    alokasiWaktu: finalAlokasiIdentity,
    topikMateri: topikVal,
  });

  const resolvedMeetings = getResolvedMeetings(modul, finalAlokasiIdentity);

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${docJudul} - ${mapel}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2.5cm 2cm 2cm 2.5cm;
    }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000000; word-break: break-word; }
    h1, h2, h3, h4, h5 { font-family: 'Times New Roman', Times, serif; color: #000000; margin-top: 14pt; margin-bottom: 6pt; }
    h1 { font-size: 11pt; text-align: center; text-transform: uppercase; font-weight: bold; line-height: 1.3; }
    h2 { font-size: 11pt; text-align: center; font-weight: bold; margin-bottom: 16pt; line-height: 1.5; }
    h3 { font-size: 11pt; font-weight: bold; background-color: #f1f5f9; padding: 5pt 8pt; border: 1px solid #cbd5e1; margin-top: 16pt; margin-bottom: 8pt; line-height: 1.5; color: #000000; }
    h4 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; line-height: 1.5; color: #000000; }
    p { font-size: 11pt; line-height: 1.5; margin: 4pt 0; text-align: justify; word-break: break-word; }
    table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; font-size: 11pt; line-height: 1.5; font-family: 'Times New Roman', Times, serif; word-break: break-word; }
    th, td { border: 1px solid #000000; padding: 6pt 8pt; vertical-align: top; word-break: break-word; }
    th { background-color: #f1f5f9; font-weight: bold; text-align: center; font-size: 11pt; line-height: 1.4; color: #000000; }
    .table-identitas td { border: none; padding: 3pt 6pt; font-size: 11pt; line-height: 1.5; }
    .footer-ttd { margin-top: 30pt; width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    .footer-ttd td { border: none; width: 50%; text-align: left; padding: 2pt 10pt 2pt 35pt; font-size: 11pt; line-height: 1.5; vertical-align: top; }
    ol, ul { margin-top: 4pt; margin-bottom: 6pt; padding-left: 24pt; font-size: 11pt; line-height: 1.5; }
    li { margin-bottom: 4pt; text-align: justify; line-height: 1.5; font-size: 11pt; }
    .badge-dpl { display: inline-block; background: #f2f2f2; border: 1px solid #999; padding: 2pt 6pt; margin-right: 4pt; border-radius: 3pt; font-size: 11pt; }
  </style>
</head>
<body>
  <h1>${docJudul}</h1>
  <h2>MATA PELAJARAN: ${mapel.toUpperCase()} (${fase} - KELAS ${kelas})</h2>

  <h3>A. INFORMASI UMUM / IDENTITAS</h3>
  <table class="table-identitas" style="width: 100%; border: none; border-collapse: collapse; table-layout: fixed;">
    <colgroup>
      <col style="width: 28%;" />
      <col style="width: 3%;" />
      <col style="width: 69%;" />
    </colgroup>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Nama Satuan Pendidikan</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${namaSekolah}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Penyusun / Guru</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${namaGuru}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Tahun Pelajaran / Semester</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;">${tahunPelajaran} / Semester ${semester}</td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Fase / Kelas</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;">${fase} / Kelas ${kelas}</td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Mata Pelajaran</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${mapel}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Elemen</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${elemenVal}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Topik / Materi</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${topikVal}</strong></td></tr>
    <tr><td style="width: 28%; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">Alokasi Waktu</td><td style="width: 3%; text-align: center; font-weight: bold; vertical-align: top; padding: 2.5pt 0;">:</td><td style="width: 69%; vertical-align: top; padding: 2.5pt 0;"><strong>${finalAlokasiIdentity}</strong></td></tr>
  </table>

  <!-- B. IDENTIFIKASI WAJIB DIMULAI DARI HALAMAN 2 -->
  <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />
  <div style="page-break-before: always; mso-break-type: section-break;"></div>
  <h3 style="page-break-before: always; margin-top: 0;">B. IDENTIFIKASI</h3>
  <h4>1. Identifikasi Murid</h4>
  <p><strong>(a). Kompetensi Awal Murid:</strong><br/>${idData.kompetensiAwal}</p>
  <p><strong>(b). Karakteristik Murid:</strong></p>
  <ul>
    ${(idData.karakteristikMurid || []).map((k) => `<li>${k}</li>`).join('')}
  </ul>
  ${idData.karakteristikMuridCustom ? `<p><em>Karakteristik Khusus: ${idData.karakteristikMuridCustom}</em></p>` : ''}
  <p><strong>(c). Kebutuhan Murid:</strong><br/>${idData.kebutuhanMurid}</p>

  <h4>2. Karakteristik Materi</h4>
  <p style="text-align: justify;">${idData.karakteristikMateri}</p>

  <h4>3. Dimensi Profil Lulusan (Minimal 3 DPL sesuai ATP)</h4>
  <ul>
    ${(idData.dimensiProfilLulusan || []).map((d) => `<li><strong>${d}</strong></li>`).join('')}
  </ul>

  <h3>C. DESAIN PEMBELAJARAN</h3>
  <h4>1. Capaian Pembelajaran (Berdasarkan Elemen dari TP Terpilih)</h4>
  ${(dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0)
    ? dsData.capaianPembelajaranPerElemen.map((item) => `
      <div style="margin-bottom: 10px;">
        <p style="margin-bottom: 2px; font-weight: bold;">Elemen: ${item.elemen}</p>
        <p style="text-align: justify; margin-top: 2px; text-indent: 1.5em; line-height: 1.5;">${item.capaianPembelajaran}</p>
      </div>
    `).join('')
    : `<p style="text-align: justify; line-height: 1.5;">${(dsData.capaianPembelajaran || '').replace(/\n/g, '<br/>')}</p>`
  }

  <h4>2. Tujuan Pembelajaran</h4>
  <p style="text-align: justify; line-height: 1.5; font-weight: normal;">${dsData.tujuanPembelajaran}</p>

  <h4>3. Lintas Disiplin Ilmu</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Mata Pelajaran Terkait</th>
        <th style="width: 70%;">Keterkaitan Konsep / Nilai</th>
      </tr>
    </thead>
    <tbody>
      ${(dsData.lintasDisiplinIlmu || []).map((ld) => `
        <tr>
          <td><strong>${ld.mataPelajaran}</strong></td>
          <td>${ld.keterkaitan}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h4>4. Praktik Pedagogis</h4>
  <ul>
    <li><strong>Model Pembelajaran:</strong> ${dsData.praktikPedagogis.modelPembelajaran}</li>
    <li><strong>Pendekatan:</strong> ${cleanParentheses(dsData.praktikPedagogis.pendekatanPembelajaran)}</li>
    <li><strong>Metode Pembelajaran:</strong> ${(dsData.praktikPedagogis.metodePembelajaran || []).join(', ')}</li>
  </ul>

  <h4>5. Mitra Pembelajaran (Kemitraan)</h4>
  <ol style="margin-left: 20px; padding-left: 0;">
    ${dsData.mitraPembelajaran.mitraInternal?.length > 0 ? `<li><strong>1. Mitra Internal:</strong> ${dsData.mitraPembelajaran.mitraInternal.join(', ')}</li>` : ''}
    ${dsData.mitraPembelajaran.mitraEksternal?.length > 0 ? `<li><strong>${dsData.mitraPembelajaran.mitraInternal?.length > 0 ? '2. Mitra Eksternal' : '1. Mitra Eksternal'}:</strong> ${dsData.mitraPembelajaran.mitraEksternal.join(', ')}</li>` : ''}
    ${(!dsData.mitraPembelajaran.mitraInternal?.length && !dsData.mitraPembelajaran.mitraEksternal?.length) ? `<li><em>Pembelajaran mandiri di kelas (tanpa kemitraan khusus).</em></li>` : ''}
  </ol>

  <h4>6. Lingkungan Belajar</h4>
  <ul>
    <li><strong>Lingkungan Fisik:</strong> ${(dsData.lingkunganBelajar.lingkunganFisik || []).join(', ')}</li>
    <li><strong>Deskripsi Penataan:</strong> ${dsData.lingkunganBelajar.lingkunganFisikDeskripsi || '-'}</li>
    <li><strong>Budaya Belajar:</strong> ${(dsData.lingkunganBelajar.budayaBelajar || []).join(', ')}</li>
  </ul>

  ${(dsData.pemanfaatanTeknologi.platformAplikasi?.length > 0 || dsData.pemanfaatanTeknologi.perangkatDigital?.length > 0 || dsData.pemanfaatanTeknologi.mediaDigital?.length > 0) ? `
  <h4>7. Pemanfaatan Digital</h4>
  <ul>
    ${dsData.pemanfaatanTeknologi.platformAplikasi?.length > 0 ? `<li><strong>Platform & Aplikasi:</strong> ${dsData.pemanfaatanTeknologi.platformAplikasi.join(', ')}</li>` : ''}
    ${dsData.pemanfaatanTeknologi.perangkatDigital?.length > 0 ? `<li><strong>Perangkat Digital:</strong> ${dsData.pemanfaatanTeknologi.perangkatDigital.join(', ')}</li>` : ''}
    ${dsData.pemanfaatanTeknologi.mediaDigital?.length > 0 ? `<li><strong>Media Digital:</strong> ${dsData.pemanfaatanTeknologi.mediaDigital.join(', ')}</li>` : ''}
  </ul>
  ` : ''}

  <h3>D. LANGKAH-LANGKAH PEMBELAJARAN (SINTAKS DEEP LEARNING)</h3>
  ${resolvedMeetings.map((pert: any, pIdx: number) => {
    const pertNo = pert.pertemuanKe || (pIdx + 1);
    const cleanAlokasi = cleanMeetingAlokasi(pert.alokasiWaktu, '2 JP (2 x 35 Menit)', pIdx, modul, finalAlokasiIdentity);
    const cleanFokus = cleanMeetingFokus(pert.fokusTP || topikVal, '-', pIdx, resolvedMeetings.length, topikVal, dsData.tujuanPembelajaran);
    const timeAlloc = calculateMeetingTimeAllocation(cleanAlokasi, 2);
    const intiSteps = pert.kegiatanInti && pert.kegiatanInti.length > 0 ? pert.kegiatanInti : [
      {
        faseSintaks: 'Tahap 1: Orientasi Murid pada Masalah Kontekstual',
        aktivitasGuru: `Guru menyajikan fenomena kontekstual materi ${topikVal} untuk memicu rasa ingin tahu murid.`,
        aktivitasSiswa: 'Murid mengamati stimulus secara saksama dan mengajukan pertanyaan kritis dengan santun.',
        pengalamanBelajar: 'Bermakna (Meaningful Learning)',
        prinsipPembelajaran: 'Memahami esensi materi secara terstruktur'
      }
    ];

    return `
    <div style="page-break-before: always; mso-break-type: section-break;"></div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 0;">
      <tr>
        <td style="background-color: #f1f5f9; border: 1px solid #000000; padding: 6pt 8pt; color: #000000;">
          <div style="font-weight: bold; font-size: 11pt;">PERTEMUAN ${pertNo}, ALOKASI WAKTU: ${cleanAlokasi}</div>
          <div style="margin-top: 3pt; font-size: 11pt;"><strong>FOKUS:</strong> ${cleanFokus}</div>
        </td>
      </tr>
    </table>
    <table style="margin-top: 0;">
      <thead>
        <tr>
          <th style="width: 24%;">KEGIATAN</th>
          <th style="width: 61%;">DESKRIPSI KEGIATAN &amp; SINTAKS</th>
          <th style="width: 15%;">ALOKASI WAKTU</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; vertical-align: top;">Kegiatan Awal<br/>(Pendahuluan)</td>
          <td style="vertical-align: top;">
            <ol style="margin: 0; padding-left: 20px;">
              ${(pert.pendahuluan || []).map((step: string) => `<li>${step}</li>`).join('')}
            </ol>
          </td>
          <td style="text-align: center; font-weight: bold; vertical-align: middle;">${timeAlloc.formatAwal}</td>
        </tr>
        ${intiSteps.map((step: any, sIdx: number) => `
        <tr>
          <td style="font-weight: bold; vertical-align: top;">
            Kegiatan Inti<br/><br/>
            Tahap ${sIdx + 1}:<br/>
            ${step.faseSintaks || 'Sintaks Deep Learning'}
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 4pt 0;"><strong>Aktivitas Guru:</strong><br/>${step.aktivitasGuru}</p>
            <p style="margin: 0 0 4pt 0;"><strong>Aktivitas Murid:</strong><br/>${step.aktivitasSiswa}</p>
            ${step.pengalamanBelajar ? `<p style="margin: 0 0 2pt 0; font-size: 10pt;">• <strong>Pengalaman Belajar:</strong> ${step.pengalamanBelajar}</p>` : ''}
            ${step.prinsipPembelajaran ? `<p style="margin: 0; font-size: 10pt;">• <strong>Prinsip Pembelajaran:</strong> ${step.prinsipPembelajaran}</p>` : ''}
          </td>
          ${sIdx === 0 ? `<td rowspan="${intiSteps.length}" style="text-align: center; font-weight: bold; vertical-align: middle;">${timeAlloc.formatInti}</td>` : ''}
        </tr>
        `).join('')}
        <tr>
          <td style="font-weight: bold; vertical-align: top;">Kegiatan Akhir<br/>(Penutup)</td>
          <td style="vertical-align: top;">
            <ol style="margin: 0; padding-left: 20px;">
              ${(pert.penutup || []).map((step: string) => `<li>${step}</li>`).join('')}
            </ol>
          </td>
          <td style="text-align: center; font-weight: bold; vertical-align: middle;">${timeAlloc.formatAkhir}</td>
        </tr>
      </tbody>
    </table>
  `;}).join('')}

  <h3>E. ASESMEN PEMBELAJARAN</h3>
  <table class="table-identitas" style="width: 100%; border: none; border-collapse: collapse; table-layout: fixed;">
    <tr>
      <td style="width: 175pt; font-weight: bold; vertical-align: top; padding: 3px 0;">1. Asesmen Diagnostik (Awal)</td>
      <td style="vertical-align: top; padding: 3px 0;">: <strong>${asData.diagnostik.bentukTeknik}</strong><br/>&nbsp;&nbsp;<em>${asData.diagnostik.caraSumber}</em></td>
    </tr>
    <tr>
      <td style="width: 175pt; font-weight: bold; vertical-align: top; padding: 3px 0;">2. Asesmen Formatif (Proses)</td>
      <td style="vertical-align: top; padding: 3px 0;">: <strong>${asData.formatif.bentukTeknik}</strong><br/>&nbsp;&nbsp;<em>${asData.formatif.caraSumber}</em></td>
    </tr>
    <tr>
      <td style="width: 175pt; font-weight: bold; vertical-align: top; padding: 3px 0;">3. Asesmen Sumatif (Akhir)</td>
      <td style="vertical-align: top; padding: 3px 0;">: <strong>${asData.sumatif.bentukTeknik}</strong><br/>&nbsp;&nbsp;<em>${asData.sumatif.caraSumber}</em></td>
    </tr>
  </table>

  <!-- PENGESAHAN DOKUMEN (FORMAT RESMI KEDINASAN KEMENDIKBUDRISTEK) -->
  <table class="footer-ttd">
    <tr>
      <td>Mengetahui,</td>
      <td>${identitas.tempatPenetapan || 'Fatubai'}, ${identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
    </tr>
    <tr>
      <td><strong>Kepala Sekolah</strong></td>
      <td><strong>${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')}</strong></td>
    </tr>
    <tr>
      <td style="padding-top: 48pt; vertical-align: bottom;">
        <strong><u>${lockWordData(identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Nama Kepala Sekolah')}</u></strong>
      </td>
      <td style="padding-top: 48pt; vertical-align: bottom;">
        <strong><u>${namaGuru}</u></strong>
      </td>
    </tr>
    <tr>
      <td>NIP. ${lockWordData(identitas.nipKepalaSekolah || '196709192008011008', 'NIP Kepala Sekolah')}</td>
      <td>NIP. ${nipGuru || '198603012020121005'}</td>
    </tr>
  </table>

  <!-- LAMPIRAN I: RUBRIK PENILAIAN -->
  <div style="page-break-before: always;">
    <h3 style="text-align: center;">LAMPIRAN I: RUBRIK PENILAIAN LENGKAP</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th style="width: 20%;">Aspek Penilaian</th>
          <th style="width: 21%;">Kriteria</th>
          <th style="width: 13.5%;">Skor 4<br/>(Sangat Baik)</th>
          <th style="width: 13.5%;">Skor 3<br/>(Baik)</th>
          <th style="width: 13.5%;">Skor 2<br/>(Cukup)</th>
          <th style="width: 13.5%;">Skor 1<br/>(Kurang)</th>
        </tr>
      </thead>
      <tbody>
        ${rbData.map((r) => `
          <tr>
            <td style="text-align: center;">${r.nomor}</td>
            <td><strong>${r.aspekPenilaian}</strong></td>
            <td>${r.kriteria}</td>
            <td>${r.skor4}</td>
            <td>${r.skor3}</td>
            <td>${r.skor2}</td>
            <td>${r.skor1}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- LAMPIRAN II: LKPD -->
  <div style="page-break-before: always;">
    <h3 style="text-align: center;">LAMPIRAN II: LEMBAR KERJA PESERTA DIDIK (LKPD)</h3>
    <div style="border: 2px solid #000; padding: 14px; margin-top: 10px;">
      <h4 style="text-align: center; margin: 0 0 6px 0;"><strong>${lkData.judulLKPD}</strong></h4>
      <p style="text-align: center; margin: 0 0 10px 0; font-size: 11pt;">
        Kelompok: ............................................ • Kelas: ${kelas} • Anggota: 1. ..................... 2. ..................... 3. ..................... 4. .....................
      </p>

      <p><strong>Petunjuk Belajar:</strong></p>
      <ol>
        ${lkData.petunjuk.map((p) => `<li>${p}</li>`).join('')}
      </ol>

      <p><strong>A. Langkah Kerja & Pengamatan:</strong></p>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">No</th>
            <th style="width: 52%;">Instruksi Langkah Kerja</th>
            <th style="width: 40%;">Hasil Jawaban / Pengamatan</th>
          </tr>
        </thead>
        <tbody>
          ${lkData.langkahKerjaAwal.map((lk) => `
            <tr>
              <td style="text-align: center;">${lk.nomor}</td>
              <td>${lk.langkahKerja}</td>
              <td style="color: #555; font-style: italic;">${lk.hasilJawabanPlaceholder}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p><strong>B. ${lkData.kegiatanKelompokJudul}:</strong></p>
      <p><em>${lkData.kegiatanKelompokInstruksi}</em></p>
      <ol>
        ${lkData.pertanyaanAnalisis.map((pa) => `
          <li>
            <strong>${pa.pertanyaan}</strong><br/>
            <span style="color: #555; font-style: italic;">Jawaban: ${pa.hasilPlaceholder}</span>
          </li>
        `).join('')}
      </ol>

      <p><strong>C. Refleksi Diri & Kelompok:</strong></p>
      <ol>
        ${lkData.refleksiDiriKelompok.map((r) => `
          <li>
            ${r.pertanyaan}<br/>
            <span style="color: #555; font-style: italic;">Tanggapan: ${r.hasilPlaceholder}</span>
          </li>
        `).join('')}
      </ol>
    </div>
  </div>

  <!-- LAMPIRAN III: SOAL EVALUASI -->
  <div style="page-break-before: always;">
    <h3 style="text-align: center;">LAMPIRAN III: SOAL EVALUASI PEMAHAMAN</h3>
    <ol>
      ${soData.map((s) => `
        <li style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0;"><strong>${s.pertanyaan}</strong></p>
          <div style="background-color: #f9f9f9; border-left: 3px solid #000; padding: 4px 8px;">
            <em style="font-size: 11pt;">Kunci Jawaban / Pembahasan: ${s.kunciJawaban}</em>
          </div>
        </li>
      `).join('')}
    </ol>
  </div>
</body>
</html>
  `;

  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const filePrefix = isRPM ? 'RPM_Rencana_Pembelajaran_Mendalam' : 'Modul_Ajar';
  downloadBlob(htmlContent, `${filePrefix}_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.doc`, 'application/msword');
}

// ==========================================
// 3. EXPORT ATP KE PDF (jsPDF + autoTable)
// ==========================================
export function exportATPToPDF(atp: ATPDocument, layoutOptions?: Partial<PDFLayoutOptions>) {
  const { identitas, elemen, capaianPembelajaran, atpList, materiPokokList, dimensiProfilLulusan, penjelasanDPL, glosarium, daftarPustaka, rasionalPenyusunan } = atp;

  const layout = resolvePDFLayout(layoutOptions, 'portrait');

  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: layout.format as any,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = marginTop;

  // PAGE 1: COVER PAGE RESMI (Format Cover Analisis Kurikulum Merdeka)
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      doc.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', (pageWidth - 28) / 2, 28, 28, 28);
    } catch (e) {
      console.warn('Gagal memuat logo pada cover PDF:', e);
    }
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  const coverTitleY = identitas.logoUrl ? 70 : 60;
  doc.text('ANALISIS TUJUAN PEMBELAJARAN KE', pageWidth / 2, coverTitleY, { align: 'center' });
  doc.text('ALUR TUJUAN PEMBELAJARAN (ATP)', pageWidth / 2, coverTitleY + 10, { align: 'center' });

  doc.setFontSize(14);
  doc.text((identitas.mataPelajaran || 'ILMU PENGETAHUAN ALAM DAN SOSIAL (IPAS)').toUpperCase(), pageWidth / 2, coverTitleY + 32, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${(identitas.fase || 'FASE C').toUpperCase()}${identitas.kelas ? ` - KELAS ${identitas.kelas}` : ''}`, pageWidth / 2, coverTitleY + 41, { align: 'center' });

  doc.setFontSize(13);
  doc.text((identitas.namaSatuanPendidikan || 'SD Negeri Fatubai').toUpperCase(), pageWidth / 2, coverTitleY + 70, { align: 'center' });
  doc.text(`TAHUN PELAJARAN ${identitas.tahunPelajaran || '2026/2027'}`, pageWidth / 2, coverTitleY + 78, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Penyusun: ${identitas.namaGuru || '-'}`, pageWidth / 2, coverTitleY + 86, { align: 'center' });
  if (identitas.alokasiWaktuTotal) {
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Alokasi Intrakurikuler: ${identitas.alokasiWaktuTotal}`, pageWidth / 2, coverTitleY + 93, { align: 'center' });
  }

  // PAGE 2: Dokumen Resmi Isi (Dimulai dari Header & Bagian A. Identitas Dokumen)
  doc.addPage(layout.format as any, layout.orientation);
  currentY = marginTop;

  // Title Header - Styled exactly like Web UI
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('ANALISIS TUJUAN PEMBELAJARAN KE ALUR TUJUAN PEMBELAJARAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`KURIKULUM MERDEKA • TAHUN PELAJARAN ${identitas.tahunPelajaran || '2025/2026'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Horizontal subtle separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 6;

  // Section A: Identitas (Framed Boxed Card with Soft Slate-50 Background)
  renderModernSectionHeader(doc, 'A. IDENTITAS DOKUMEN', currentY, marginLeft, marginRight, 'IDENTITAS');
  currentY += 8.5;

  const totalJP = atpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);
  const identitasData = [
    ['Nama Satuan Pendidikan', ':', identitas.namaSatuanPendidikan || '-'],
    ['Penyusun / Guru', ':', `${identitas.namaGuru || '-'}`],
    ['Mata Pelajaran', ':', identitas.mataPelajaran || '-'],
    ['Fase / Kelas', ':', `${identitas.fase} / Kelas ${identitas.kelas}`],
    ['Tahun Pelajaran / Semester', ':', `${identitas.tahunPelajaran} / Semester ${identitas.semester}`],
    ['Alokasi Waktu Intrakurikuler', ':', identitas.alokasiWaktuTotal || `${totalJP} JP (Permendikdasmen No. 13 Tahun 2025 @ 35 Menit)`],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    body: identitasData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 10,
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'top',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 54, textColor: [0, 0, 0], valign: 'top' },
      1: { cellWidth: 5, halign: 'center', cellPadding: { top: 2.2, bottom: 2.2, left: 0.2, right: 0.2 }, fontStyle: 'bold', textColor: [0, 0, 0], valign: 'top' },
      2: { fontStyle: 'bold', cellWidth: 'auto', textColor: [0, 0, 0], valign: 'top' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Section B & C: Elemen dan Capaian Pembelajaran (Terpisah Per Elemen dalam Kotak Kartu)
  if (currentY > pageHeight - marginBottom - 30) {
    doc.addPage(layout.format as any, layout.orientation);
    currentY = marginTop;
  }
  renderModernSectionHeader(doc, 'B & C. ELEMEN DAN CAPAIAN PEMBELAJARAN', currentY, marginLeft, marginRight, 'CP');
  currentY += 8.5;

  const resolvedElementsPDF = resolveElemenListForATP(atp);

  resolvedElementsPDF.forEach((el) => {
    if (currentY > pageHeight - marginBottom - 30) {
      doc.addPage(layout.format as any, layout.orientation);
      currentY = marginTop;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
      body: [
        [{ content: `Elemen: ${el.elemen.replace(/^Elemen\s+/i, '')}`, styles: { font: 'times', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } } }],
        [{ content: formatCPElemenText(el.capaianPembelajaran) || '-', styles: { font: 'times', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, halign: 'justify' } }],
      ],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.25 },
      pageBreak: 'auto',
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  });

  if (rasionalPenyusunan) {
    if (currentY > pageHeight - marginBottom - 25) {
      doc.addPage(layout.format as any, layout.orientation);
      currentY = marginTop;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
      body: [
        [{ content: 'Rasional Alur Pembelajaran:', styles: { font: 'times', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9.5, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 } } }],
        [{ content: rasionalPenyusunan, styles: { font: 'times', fontStyle: 'italic', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, halign: 'justify' } }],
      ],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.25 },
      pageBreak: 'auto',
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Section D: Tabel Alur Tujuan Pembelajaran
  if (currentY > pageHeight - marginBottom - 35) {
    doc.addPage(layout.format as any, layout.orientation);
    currentY = marginTop;
  }
  renderModernSectionHeader(doc, 'D. ALUR TUJUAN PEMBELAJARAN (ATP)', currentY, marginLeft, marginRight, 'TABEL ATP');
  currentY += 8.5;

  const tableBody = atpList.map((item, idx) => {
    const dplText = Array.isArray(item.dimensiP3)
      ? item.dimensiP3.map((d) => `• ${normalizeDimensiProfilLulusan(d)}`).join('\n')
      : normalizeDimensiProfilLulusan(item.dimensiP3 || '-');

    const cleanLM = formatListToPDFText(item.lingkupMateri, 'bullet');
    const cleanIKTP = formatListToPDFText(item.indikatorKetercapaian, 'bullet');

    return [
      idx + 1,
      item.kodeTP,
      resolveSingleElemenForTP(item.elemen, atp.elemen, item.tujuanPembelajaran, item.lingkupMateri, resolvedElementsPDF),
      item.tujuanPembelajaran,
      cleanLM || '-',
      `${item.alokasiJP} JP`,
      dplText,
      cleanIKTP || '-',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    head: [['No', 'Kode', 'Elemen', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi', 'JP', 'Dimensi Profil Lulusan', 'Indikator Ketercapaian']],
    body: tableBody,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: {
      font: 'times',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    styles: {
      font: 'times',
      fontSize: 9.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: layout.orientation === 'landscape' ? 30 : 20, fontStyle: 'bold' },
      3: { cellWidth: layout.orientation === 'landscape' ? 65 : 44 },
      4: { cellWidth: layout.orientation === 'landscape' ? 40 : 28 },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: layout.orientation === 'landscape' ? 48 : 32 },
      7: { cellWidth: layout.orientation === 'landscape' ? 40 : 29 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Section E: Materi Pokok dan Sub-Materi (Wajib Halaman Baru, Tidak Digabungkan dengan Bagian Sebelumnya)
  doc.addPage(layout.format as any, layout.orientation);
  currentY = marginTop;

  renderModernSectionHeader(doc, 'E. MATERI POKOK DAN SUB-MATERI', currentY, marginLeft, marginRight, 'MATERI');
  currentY += 8.5;

  const materiBody = materiPokokList.map((m) => [
    m.bab,
    m.judulMateri,
    formatListToPDFText(m.subMateri, 'bullet'),
    `${m.perkiraanJP} JP`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    head: [['Bab / Unit', 'Materi Pokok', 'Sub-Materi Pembelajaran', 'JP']],
    body: materiBody,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: {
      font: 'times',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    styles: {
      font: 'times',
      fontSize: 9.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: layout.orientation === 'landscape' ? 140 : 95 },
      3: { cellWidth: 20, halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // Section F & G: Dimensi Profil Lulusan & Glosarium (WAJIB BERADA DI 1 HALAMAN YANG SAMA)
  // =========================================================================
  doc.addPage(layout.format as any, layout.orientation);
  currentY = marginTop;

  renderModernSectionHeader(doc, 'F. DIMENSI PROFIL LULUSAN', currentY, marginLeft, marginRight, '8 DPL');
  currentY += 8.5;

  const dplRows = DELAPAN_DIMENSI_PROFIL_LULUSAN.map((dim, idx) => [
    { content: `${idx + 1}.  ${dim.nama}`, styles: { font: 'times', fontStyle: 'bold' as const, cellWidth: 48, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } },
    { content: dim.definisi, styles: { font: 'times', fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], halign: 'justify' as const } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    head: [['Dimensi Profil Lulusan (DPL)', 'Penjelasan Operasional / Karakteristik']],
    body: dplRows,
    theme: 'grid',
    headStyles: {
      font: 'times',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: { top: 1.6, bottom: 1.6, left: 2.5, right: 2.5 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    pageBreak: 'avoid',
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Section G: Glosarium (Menyatu pada halaman yang sama dengan F)
  renderModernSectionHeader(doc, 'G. GLOSARIUM', currentY, marginLeft, marginRight, 'GLOSARIUM');
  currentY += 8.5;

  const glosariumBody = glosarium.map((g) => [g.istilah, g.definisi]);
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    head: [['Istilah', 'Definisi / Penjelasan Operasional']],
    body: glosariumBody,
    theme: 'grid',
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    headStyles: {
      font: 'times',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  });

  // =========================================================================
  // Section H: Daftar Pustaka & Tanda Tangan (WAJIB 1 HALAMAN BERSAMA TANDA TANGAN)
  // =========================================================================
  doc.addPage(layout.format as any, layout.orientation);
  currentY = marginTop;

  renderModernSectionHeader(doc, 'H. DAFTAR PUSTAKA', currentY, marginLeft, marginRight, 'REFERENSI');
  currentY += 8.5;

  const dpBody = daftarPustaka.map((dp, idx) => [
    { content: `${idx + 1}.`, styles: { font: 'times', fontStyle: 'bold' as const, cellWidth: 8, halign: 'center' as const, textColor: [0, 0, 0] as [number, number, number] } },
    { content: `${dp.penulis}. (${dp.tahun}). ${dp.judul}. ${dp.kota ? dp.kota + ': ' : ''}${dp.penerbit}. ${dp.keterangan ? `(${dp.keterangan})` : ''}`, styles: { font: 'times', halign: 'justify' as const, textColor: [0, 0, 0] as [number, number, number] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
    body: dpBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    pageBreak: 'avoid',
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Tanda Tangan Pengesahan (Berada 1 halaman bersama Daftar Pustaka)
  renderSignatures(doc, identitas, currentY, pageWidth, marginLeft, marginRight);

  // Add Page Numbers & Running Header
  addDocumentPageNumbers(doc, `Analisis TP ke ATP - ${identitas.mataPelajaran} (${identitas.fase})`, marginLeft, marginRight);

  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`Analisis_TP_ke_ATP_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.pdf`);
}

// ==========================================
// ==========================================
// 4. EXPORT RPM KE PDF (jsPDF + autoTable)
// ==========================================
function renderRPMSectionHeader(doc: jsPDF, title: string, y: number, marginX: number = 15, rightMargin: number = 15) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX - rightMargin;
  const boxHeight = 8;

  // Background box lembut dengan border hitam standar
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginX, y, contentWidth, boxHeight, 'FD');

  // Title: Times New Roman, Bold, 12pt, Hitam Standar (0, 0, 0)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, marginX + 3, y + 5.5, { maxWidth: contentWidth - 6 });
}

function sanitizeDimensiLulusan(text: string): string {
  if (!text) return '';
  return text
    .replace(/Profil Pelajar Pancasila\s*\(P3\)/gi, 'Dimensi Profil Lulusan')
    .replace(/Profil Pelajar Pancasila/gi, 'Dimensi Lulusan')
    .replace(/Pelajar Pancasila/gi, 'Dimensi Lulusan')
    .replace(/Profil Kelulusan/gi, 'Dimensi Lulusan');
}

export function exportRPMToPDF(modul: ModulAjarDocument, layoutOptions?: Partial<PDFLayoutOptions>) {
  const {
    identitas,
    elemen,
    topikMateri,
    alokasiWaktuPertemuan,
  } = modul;

  const layout = resolvePDFLayout(layoutOptions, 'portrait');
  const doc = new jsPDF({ orientation: layout.orientation, unit: 'mm', format: layout.format as any });
  doc.setLineHeightFactor(1.5); // Spasi 1,5

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;
  const margin = marginLeft;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = marginTop;

  const topikVal = topikMateri || '-';
  const elemenVal = elemen || (modul as any).elemen || '-';
  const alokasiVal = alokasiWaktuPertemuan || identitas.alokasiWaktuModul || '2 x 35 Menit (1 kali pertemuan)';
  const { formattedIdentityAlokasi } = parseTotalJPAndCount(modul, alokasiVal);
  const finalAlokasiIdentity = formattedIdentityAlokasi || alokasiVal;

  // ==========================================
  // PAGE 1: JUDUL & IDENTITAS
  // (Format Resmi: 12pt Times New Roman, Spasi 1.5, Hitam Standar)
  // ==========================================
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Hitam standar
  doc.text('RENCANA PEMBELAJARAN MENDALAM', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Garis Pemisah Standar Hitam
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - marginRight, currentY);
  currentY += 6;

  const { idData, dsData, asData, rbData, lkData, soData } = normalizeRPMData(modul, {
    alokasiWaktu: alokasiVal,
    topikMateri: topikVal,
  });

  // ==========================================
  // A. INFORMASI UMUM / IDENTITAS MODUL
  // (Titik Dua Sejajar Presisi Menggunakan Kolom Terpisah)
  // ==========================================
  renderRPMSectionHeader(doc, 'A. INFORMASI UMUM / IDENTITAS MODUL', currentY, margin, marginRight);
  currentY += 9.5;

  const identitasRows = [
    ['Nama Satuan Pendidikan', ':', `${identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}`],
    ['Penyusun / Guru', ':', `${identitas.namaGuru || '-'}`],
    ['Tahun Pelajaran / Semester', ':', `${identitas.tahunPelajaran} / Semester ${identitas.semester}`],
    ['Fase / Kelas', ':', `${identitas.fase} / Kelas ${identitas.kelas}`],
    ['Mata Pelajaran', ':', `${identitas.mataPelajaran}`],
    [`Elemen (${getCpRegulationInfo(identitas.mataPelajaran).shortName})`, ':', `${elemenVal}`],
    ['Topik / Materi Pokok', ':', `${topikVal}`],
    ['Alokasi Waktu Intrakurikuler', ':', `${finalAlokasiIdentity}`],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: identitasRows,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
      1: { cellWidth: 6, halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], cellPadding: { top: 2.8, bottom: 2.8, left: 0.2, right: 0.2 }, valign: 'top' as const },
      2: { cellWidth: contentWidth - 68, fontStyle: 'normal' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
    },
    pageBreak: 'avoid',
  });

  // =========================================================================
  // B. IDENTIFIKASI (WAJIB DIMULAI DARI HALAMAN 2)
  // =========================================================================
  doc.addPage();
  currentY = marginTop;

  renderRPMSectionHeader(doc, 'B. IDENTIFIKASI', currentY, margin, marginRight);
  currentY += 9.5;

  const matCleanRPM = formatListToPDFText(idData.karakteristikMateri, 'bullet');
  const karakteristikMuridList = (idData.karakteristikMurid || []).map((k: string) => `• ${k}`).join('\n');
  const karakteristikMuridCustom = idData.karakteristikMuridCustom ? `\n• ${idData.karakteristikMuridCustom}` : '';
  const dplList = (idData.dimensiProfilLulusan || []).map((d: string) => `• ${d}`).join('\n');

  const bRows = [
    [{ content: '1. Identifikasi Murid', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }],
    [{ content: sanitizeDimensiLulusan(`a. Kompetensi Awal Murid:\n${idData.kompetensiAwal || '-'}\n\nb. Karakteristik Murid:\n${karakteristikMuridList}${karakteristikMuridCustom}\n\nc. Kebutuhan Murid:\n${idData.kebutuhanMurid || '-'}`), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }],
    [{ content: '2. Karakteristik Materi', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }],
    [{ content: sanitizeDimensiLulusan(matCleanRPM || idData.karakteristikMateri || '-'), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], halign: 'justify' as const } }],
    [{ content: '3. Dimensi Profil Lulusan (Minimal 3 DPL Sesuai Dokumen ATP)', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }],
    [{ content: sanitizeDimensiLulusan(dplList || '-'), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: bRows as any,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // C. DESAIN PEMBELAJARAN (WAJIB DIMULAI DARI HALAMAN 3)
  // ==========================================
  doc.addPage();
  currentY = marginTop;

  renderRPMSectionHeader(doc, 'C. DESAIN PEMBELAJARAN', currentY, margin, marginRight);
  currentY += 9.5;

  let dsRows: any[] = [];

  // 1. Capaian Pembelajaran
  dsRows.push([{ content: '1. Capaian Pembelajaran (Berdasarkan Elemen dari TP Terpilih):', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let cpText = '';
  if (dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0) {
    dsData.capaianPembelajaranPerElemen.forEach((item: any, idx: number) => {
      cpText += `Elemen: ${item.elemen}\n${item.capaianPembelajaran}${idx < dsData.capaianPembelajaranPerElemen.length - 1 ? '\n\n' : ''}`;
    });
  } else {
    cpText = dsData.capaianPembelajaran || '-';
  }
  dsRows.push([{ content: sanitizeDimensiLulusan(cpText.trim()), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], halign: 'justify' as const } }]);

  // 2. Tujuan Pembelajaran
  dsRows.push([{ content: '2. Tujuan Pembelajaran:', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  dsRows.push([{ content: sanitizeDimensiLulusan(`${dsData.tujuanPembelajaran || '-'}`), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  // 3. Lintas Disiplin Ilmu
  dsRows.push([{ content: '3. Lintas Disiplin Ilmu:', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let lintasText = '';
  if (dsData.lintasDisiplinIlmu && dsData.lintasDisiplinIlmu.length > 0) {
    lintasText = dsData.lintasDisiplinIlmu.map((ld: any) => `• ${ld.mataPelajaran}: ${ld.keterkaitan}`).join('\n');
  } else {
    lintasText = 'Pembelajaran terintegrasi dengan konteks tematik satuan pendidikan.';
  }
  dsRows.push([{ content: sanitizeDimensiLulusan(lintasText), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  // 4. Praktik Pedagogis
  dsRows.push([{ content: '4. Praktik Pedagogis:', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let pText = `• Model Pembelajaran: ${dsData.praktikPedagogis.modelPembelajaran || '-'}\n`;
  pText += `• Pendekatan Pembelajaran: ${cleanParentheses(dsData.praktikPedagogis.pendekatanPembelajaran) || '-'}\n`;
  pText += `• Metode Pembelajaran: ${(dsData.praktikPedagogis.metodePembelajaran || []).join(', ') || '-'}`;
  dsRows.push([{ content: sanitizeDimensiLulusan(pText), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  // 5. Mitra Pembelajaran (Kemitraan)
  dsRows.push([{ content: '5. Mitra Pembelajaran (Kemitraan):', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let mtText = '';
  if (dsData.mitraPembelajaran.mitraInternal?.length > 0) {
    mtText += `1. Mitra Internal: ${dsData.mitraPembelajaran.mitraInternal.join(', ')}\n`;
  }
  if (dsData.mitraPembelajaran.mitraEksternal?.length > 0) {
    mtText += `${dsData.mitraPembelajaran.mitraInternal?.length > 0 ? '2. Mitra Eksternal' : '1. Mitra Eksternal'}: ${dsData.mitraPembelajaran.mitraEksternal.join(', ')}`;
  }
  if (!mtText) {
    mtText = 'Pembelajaran mandiri di ruang kelas (tanpa kemitraan khusus).';
  }
  dsRows.push([{ content: sanitizeDimensiLulusan(mtText.trim()), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  // 6. Lingkungan Belajar
  dsRows.push([{ content: '6. Lingkungan Belajar:', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let envText = `1. Lingkungan Fisik: ${(dsData.lingkunganBelajar.lingkunganFisik || []).join(', ') || '-'}`;
  if (dsData.lingkunganBelajar.lingkunganFisikDeskripsi) {
    envText += ` (${dsData.lingkunganBelajar.lingkunganFisikDeskripsi})`;
  }
  envText += `\n2. Budaya Belajar: ${(dsData.lingkunganBelajar.budayaBelajar || []).join(', ') || '-'}`;
  dsRows.push([{ content: sanitizeDimensiLulusan(envText), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  // 7. Pemanfaatan Teknologi Digital
  dsRows.push([{ content: '7. Pemanfaatan Teknologi Digital:', styles: { font: 'times', fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } }]);
  let techText = `1. Platform & Aplikasi Digital: ${dsData.pemanfaatanTeknologi?.platformAplikasi?.join(', ') || '-'}\n`;
  techText += `2. Perangkat Digital: ${dsData.pemanfaatanTeknologi?.perangkatDigital?.join(', ') || '-'}\n`;
  techText += `3. Media Pembelajaran Digital: ${dsData.pemanfaatanTeknologi?.mediaDigital?.join(', ') || '-'}`;
  dsRows.push([{ content: sanitizeDimensiLulusan(techText), styles: { font: 'times', fontSize: 12, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number] } }]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: dsRows as any,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // D. LANGKAH-LANGKAH PEMBELAJARAN
  // SETIAP PERTEMUAN WAJIB DIMULAI DARI HALAMAN BARU!
  // ALOKASI WAKTU HANYA DITULIS UNTUK AWAL, INTI, DAN AKHIR (BUKAN TIAP SINTAK)!
  // JUDUL PERTEMUAN DITULIS DALAM HEADER TABEL SEHINGGA TIDAK MELEWATI KERTAS
  // =========================================================================
  const resolvedMeetings = getResolvedMeetings(modul, finalAlokasiIdentity);

  resolvedMeetings.forEach((pert: any, pIdx: number) => {
    // Setiap pertemuan WAJIB dimulai dari halaman baru
    doc.addPage();
    currentY = marginTop;

    // Pada pertemuan pertama, tampilkan Judul Seksi D di bagian atas halaman
    if (pIdx === 0) {
      renderRPMSectionHeader(doc, 'D. LANGKAH-LANGKAH PEMBELAJARAN', currentY, margin, marginRight);
      currentY += 9.5;
    }

    const pertNo = pert.pertemuanKe || (pIdx + 1);
    const cleanAlokasi = cleanMeetingAlokasi(pert.alokasiWaktu, '2 JP (2 x 35 Menit)', pIdx, modul, finalAlokasiIdentity);
    const cleanFokus = cleanMeetingFokus(pert.fokusTP || topikVal, '-', pIdx, resolvedMeetings.length, topikVal, dsData.tujuanPembelajaran);
    const timeAlloc = calculateMeetingTimeAllocation(cleanAlokasi, 2);

    let pertRows: any[] = [];

    // 1. Kegiatan Awal (Pendahuluan)
    let awalItems = pert.pendahuluan && pert.pendahuluan.length > 0
      ? pert.pendahuluan
      : [
          'Guru menyapa murid dengan salam hangat, memimpin doa bersama, dan mengecek kehadiran murid dengan penuh perhatian.',
          'Guru mengajak murid melakukan apersepsi bermakna mengaitkan materi dengan pengalaman sehari-hari murid.',
          'Guru mengajukan pertanyaan pemantik kontekstual untuk membangkitkan rasa ingin tahu murid.',
          'Guru menyampaikan tujuan pembelajaran pertemuan ini serta alur kegiatan yang akan dilakukan.'
        ];
    let awalText = awalItems.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');

    pertRows.push([
      { content: 'Kegiatan Awal\n(Pendahuluan)', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const, fontSize: 12 } },
      { content: sanitizeDimensiLulusan(awalText), styles: { valign: 'top' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } },
      { content: timeAlloc.formatAwal, styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'middle' as const, fontSize: 12 } }
    ]);

    // 2. Kegiatan Inti: Tahap Sintaks
    const intiSteps = pert.kegiatanInti && pert.kegiatanInti.length > 0
      ? pert.kegiatanInti
      : [
          {
            faseSintaks: 'Tahap 1: Orientasi Murid pada Masalah Kontekstual',
            aktivitasGuru: `Guru menyajikan fenomena kontekstual materi ${modul.topikMateri || ''} untuk memicu rasa ingin tahu murid.`,
            aktivitasSiswa: 'Murid mengamati stimulus secara saksama dan mengajukan pertanyaan kritis dengan santun.',
            pengalamanBelajar: 'Bermakna',
            prinsipPembelajaran: 'Memahami esensi materi secara terstruktur',
          },
          {
            faseSintaks: 'Tahap 2: Mengorganisasikan Murid untuk Belajar Kolaboratif',
            aktivitasGuru: `Guru membagi murid ke dalam kelompok belajar heterogen dan membagikan Lembar Kerja Murid (LKPD).`,
            aktivitasSiswa: 'Murid berkumpul bersama kelompok, memahami instruksi LKPD, dan membagi peran kerja secara adil.',
            pengalamanBelajar: 'Menggembirakan',
            prinsipPembelajaran: 'Berkolaborasi aktif dan bergotong royong',
          },
          {
            faseSintaks: 'Tahap 3: Membimbing Penyelidikan Mandiri dan Kelompok',
            aktivitasGuru: 'Guru berkeliling membimbing penyelidikan kelompok dan memberikan bantuan bertahap (scaffolding).',
            aktivitasSiswa: 'Murid melakukan penyelidikan, mendiskusikan pemecahan masalah, dan mencatat hasil pada LKPD.',
            pengalamanBelajar: 'Berkesadaran',
            prinsipPembelajaran: 'Mengaplikasikan konsep untuk menyelesaikan persoalan nyata',
          },
          {
            faseSintaks: 'Tahap 4: Mengembangkan dan Menyajikan Hasil Karya',
            aktivitasGuru: 'Guru memfasilitasi presentasi kelompok dan membimbing murid memberikan tanggapan apresiatif.',
            aktivitasSiswa: 'Setiap kelompok menyajikan kesimpulan dan hasil karya kelompoknya di depan kelas dengan percaya diri.',
            pengalamanBelajar: 'Menggembirakan & Apresiatif',
            prinsipPembelajaran: 'Mengomunikasikan gagasan secara jelas dan santun',
          },
          {
            faseSintaks: 'Tahap 5: Menganalisis dan Mengevaluasi Proses Pemecahan Masalah',
            aktivitasGuru: 'Guru bersama murid merangkum intisari konsep materi, meluruskan miskonsepsi, dan memberi penguatan.',
            aktivitasSiswa: 'Murid bersama guru menyimpulkan inti konsep pembelajaran dan mencatat butir-butir penting.',
            pengalamanBelajar: 'Bermakna & Reflektif',
            prinsipPembelajaran: 'Merefleksikan proses berpikir dan pemahaman',
          },
        ];

    intiSteps.forEach((step: any, sIdx: number) => {
      let actGuru = (step.aktivitasGuru || '-').replace(/^\[Pertemuan\s*\d+\]\s*(Guru memfasilitasi dan mengarahkan aktivitas:\s*)?/i, '');
      if (!actGuru.toLowerCase().startsWith('guru')) {
        actGuru = `Guru ${actGuru}`;
      }
      let actMurid = (step.aktivitasSiswa || '-').replace(/^\[Pertemuan\s*\d+\]\s*/i, '');
      if (!actMurid.toLowerCase().startsWith('murid') && !actMurid.toLowerCase().startsWith('peserta didik')) {
        actMurid = `Murid ${actMurid}`;
      }

      let cellContent = `Aktivitas Guru:\n${actGuru}\n\nAktivitas Murid:\n${actMurid}`;
      if (step.pengalamanBelajar) {
        cellContent += `\n\n• Pengalaman Belajar: ${step.pengalamanBelajar}`;
      }
      if (step.prinsipPembelajaran) {
        cellContent += `\n• Prinsip Pembelajaran: ${step.prinsipPembelajaran}`;
      }

      const intiRow: any[] = [
        {
          content: `Kegiatan Inti\n\n${step.faseSintaks || `Tahap ${sIdx + 1}`}`,
          styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const, fontSize: 12 }
        },
        { content: sanitizeDimensiLulusan(cellContent), styles: { valign: 'top' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } },
        {
          content: sIdx === 0 ? timeAlloc.formatInti : '',
          styles: {
            halign: 'center' as const,
            fontStyle: 'bold' as const,
            fillColor: [255, 255, 255] as [number, number, number],
            textColor: [0, 0, 0] as [number, number, number],
            valign: sIdx === 0 ? ('middle' as const) : ('top' as const),
            fontSize: 12
          }
        }
      ];

      pertRows.push(intiRow);
    });

    // 3. Kegiatan Akhir (Penutup)
    let penutupItems = pert.penutup && pert.penutup.length > 0
      ? pert.penutup
      : [
          'Peserta didik bersama guru menyimpulkan butir-butir penting materi yang telah dipelajari.',
          'Guru memandu refleksi bersama murid mengenai proses belajar dan pemahaman yang diperoleh.',
          'Guru memberikan apresiasi atas partisipasi seluruh murid serta menyampaikan tindak lanjut kegiatan berikutnya.',
          'Pembelajaran diakhiri dengan doa bersama yang dipimpin oleh salah satu murid dan salam penutup.'
        ];
    let penutupText = penutupItems.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');

    pertRows.push([
      { content: 'Kegiatan Akhir\n(Penutup)', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const, fontSize: 12 } },
      { content: sanitizeDimensiLulusan(penutupText), styles: { valign: 'top' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontSize: 12 } },
      { content: timeAlloc.formatAkhir, styles: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'middle' as const, fontSize: 12 } }
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: marginRight },
      head: [
        [
          {
            content: `PERTEMUAN ${pertNo} • ALOKASI WAKTU: ${cleanAlokasi.toUpperCase()}\nFokus TP: ${cleanFokus}`,
            colSpan: 3,
            styles: {
              font: 'times',
              fontStyle: 'bold',
              fontSize: 12,
              textColor: [0, 0, 0],
              fillColor: [240, 240, 240],
              halign: 'left',
              cellPadding: 3.5,
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
            }
          }
        ],
        [
          { content: 'Kegiatan / Tahapan Sintaks', styles: { halign: 'center' as const, cellWidth: 44, font: 'times', fontStyle: 'bold' as const, fontSize: 12, textColor: [0, 0, 0], fillColor: [245, 245, 245] as [number, number, number] } },
          { content: 'Deskripsi Aktivitas Pembelajaran (Guru & Murid)', styles: { halign: 'center' as const, cellWidth: contentWidth - 44 - 28, font: 'times', fontStyle: 'bold' as const, fontSize: 12, textColor: [0, 0, 0], fillColor: [245, 245, 245] as [number, number, number] } },
          { content: 'Alokasi Waktu', styles: { halign: 'center' as const, cellWidth: 28, font: 'times', fontStyle: 'bold' as const, fontSize: 12, textColor: [0, 0, 0], fillColor: [245, 245, 245] as [number, number, number] } }
        ]
      ],
      body: pertRows,
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: {
        font: 'times',
        fontStyle: 'bold',
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        fontSize: 12,
        halign: 'center',
      },
      styles: {
        font: 'times',
        fontSize: 12,
        cellPadding: 2.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: contentWidth - 44 - 28 },
        2: { cellWidth: 28 }
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  });

  // ==========================================
  // E. ASESMEN PEMBELAJARAN (WAJIB HALAMAN BARU & 1 HALAMAN DENGAN TANDATANGAN)
  // ==========================================
  doc.addPage();
  currentY = marginTop;

  renderRPMSectionHeader(doc, 'E. ASESMEN PEMBELAJARAN', currentY, margin, marginRight);
  currentY += 9.5;

  const asRows = [
    [
      '1. Asesmen Diagnostik (Awal)',
      ':',
      `Bentuk / Teknik : ${asData.diagnostik.bentukTeknik}\nCara / Sumber   : ${asData.diagnostik.caraSumber}`
    ],
    [
      '2. Asesmen Formatif (Proses)',
      ':',
      `Bentuk / Teknik : ${asData.formatif.bentukTeknik}\nCara / Sumber   : ${asData.formatif.caraSumber}`
    ],
    [
      '3. Asesmen Sumatif (Akhir)',
      ':',
      `Bentuk / Teknik : ${asData.sumatif.bentukTeknik}\nCara / Sumber   : ${asData.sumatif.caraSumber}`
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: asRows,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
      1: { cellWidth: 6, halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], cellPadding: { top: 2.8, bottom: 2.8, left: 0.2, right: 0.2 }, valign: 'top' as const },
      2: { cellWidth: contentWidth - 68, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
    },
    pageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // LEMBAR PENGESAHAN (Tanda Tangan Mengetahui Kepala Sekolah & Guru)
  // WAJIB 1 HALAMAN BERSAMA ASESMEN (TIDAK TERPISAH)
  // ==========================================
  renderSignatures(doc, identitas, currentY, pageWidth, margin, marginRight);
  currentY += 38;

  // ==========================================
  // LAMPIRAN I: RUBRIK PENILAIAN LENGKAP
  // ==========================================
  doc.addPage();
  currentY = marginTop;

  renderRPMSectionHeader(doc, 'LAMPIRAN I: RUBRIK PENILAIAN LENGKAP', currentY, margin, marginRight);
  currentY += 9.5;

  const rRows = (rbData || []).map((r: any) => [
    r.nomor || '-',
    sanitizeDimensiLulusan(r.aspekPenilaian || '-'),
    sanitizeDimensiLulusan(r.kriteria || '-'),
    sanitizeDimensiLulusan(r.skor4 || '-'),
    sanitizeDimensiLulusan(r.skor3 || '-'),
    sanitizeDimensiLulusan(r.skor2 || '-'),
    sanitizeDimensiLulusan(r.skor1 || '-'),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    head: [[
      'No',
      'Aspek Penilaian',
      'Kriteria',
      'Skor 4\n(Sangat Baik)',
      'Skor 3\n(Baik)',
      'Skor 2\n(Cukup)',
      'Skor 1\n(Kurang)',
    ]],
    body: rRows,
    theme: 'grid',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      fontSize: 11,
      halign: 'center',
    },
    styles: {
      font: 'times',
      fontSize: 10.5,
      cellPadding: 2.4,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' as const },
      1: { cellWidth: 32 },
      2: { cellWidth: 34 },
      3: { cellWidth: (contentWidth - 74) / 4 },
      4: { cellWidth: (contentWidth - 74) / 4 },
      5: { cellWidth: (contentWidth - 74) / 4 },
      6: { cellWidth: (contentWidth - 74) / 4 },
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // LAMPIRAN II: LEMBAR KERJA MURID (LKPD)
  // ==========================================
  if (lkData && (lkData.judulLKPD || (lkData as any).judul)) {
    doc.addPage();
    currentY = marginTop;

    renderRPMSectionHeader(doc, 'LAMPIRAN II: LEMBAR KERJA MURID (LKPD)', currentY, margin, marginRight);
    currentY += 9.5;

    const lkpdHeading = [
      ['Mata Pelajaran / Topik', ':', `${identitas.mataPelajaran} - ${sanitizeDimensiLulusan(lkData.judulLKPD || (lkData as any).judul || topikVal)}`],
      ['Kelas / Fase', ':', `${identitas.kelas} / ${identitas.fase}`],
      ['Kelompok / Anggota', ':', 'Kelompok: ............ | Anggota: 1. ................ 2. ................ 3. ................ 4. ................'],
      ['Petunjuk Belajar', ':', (lkData.petunjuk || []).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: marginRight },
      body: lkpdHeading,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 12,
        cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 62, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
        1: { cellWidth: 6, halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], cellPadding: { top: 2.8, bottom: 2.8, left: 0.2, right: 0.2 }, valign: 'top' as const },
        2: { cellWidth: contentWidth - 68, fillColor: [255, 255, 255] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], valign: 'top' as const },
      },
      pageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 5;

    // Bagian A: Tabel Langkah Kerja
    if (lkData.langkahKerjaAwal && lkData.langkahKerjaAwal.length > 0) {
      const lkRows = lkData.langkahKerjaAwal.map((lk: any) => [
        lk.nomor || '-',
        sanitizeDimensiLulusan(lk.langkahKerja || '-'),
        lk.hasilJawabanPlaceholder || '........................................................',
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: marginRight },
        head: [['No', 'Instruksi Langkah Kerja', 'Hasil Pengamatan / Jawaban']],
        body: lkRows,
        theme: 'grid',
        headStyles: {
          font: 'times',
          fontStyle: 'bold',
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontSize: 12,
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
        },
        styles: {
          font: 'times',
          fontSize: 12,
          cellPadding: 2.8,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' as const },
          1: { cellWidth: 95 },
          2: { cellWidth: contentWidth - 105 },
        },
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    }

    // Bagian B & C: Diskusi Kelompok & Refleksi
    let diskusiText = `B. ${sanitizeDimensiLulusan(lkData.kegiatanKelompokJudul || 'Kegiatan Kelompok')}:\n${sanitizeDimensiLulusan(lkData.kegiatanKelompokInstruksi || '')}\n\n`;
    if (lkData.pertanyaanAnalisis && lkData.pertanyaanAnalisis.length > 0) {
      diskusiText += 'Pertanyaan Analisis:\n' + lkData.pertanyaanAnalisis.map((pa: any, i: number) => `${i + 1}. ${sanitizeDimensiLulusan(pa.pertanyaan)}`).join('\n') + '\n\n';
    }
    if (lkData.refleksiDiriKelompok && lkData.refleksiDiriKelompok.length > 0) {
      diskusiText += 'C. Refleksi Diri & Kelompok:\n' + lkData.refleksiDiriKelompok.map((r: any) => `• ${sanitizeDimensiLulusan(r.pertanyaan)}`).join('\n');
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: marginRight },
      body: [[{ content: diskusiText.trim(), styles: { font: 'times', fontSize: 12, textColor: [0, 0, 0], fillColor: [255, 255, 255], cellPadding: 3 } }]],
      theme: 'grid',
      styles: {
        fontSize: 12,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // ==========================================
  // LAMPIRAN III: SOAL EVALUASI
  // ==========================================
  if (soData && soData.length > 0) {
    doc.addPage();
    currentY = marginTop;

    renderRPMSectionHeader(doc, 'LAMPIRAN III: SOAL EVALUASI PEMAHAMAN KONSEPTUAL', currentY, margin, marginRight);
    currentY += 9.5;

    let evRows = soData.map((s: any) => {
      let txt = `${s.nomor}. ${sanitizeDimensiLulusan(s.pertanyaan)}`;
      if (s.pilihanGanda && s.pilihanGanda.length > 0) {
        txt += `\n${s.pilihanGanda.map((pg: string) => sanitizeDimensiLulusan(pg)).join('\n')}`;
      }
      txt += `\n\n[Kunci Jawaban & Pembahasan]:\n${sanitizeDimensiLulusan(s.kunciJawaban)}`;
      return [{ content: txt, styles: { font: 'times', fontSize: 12, textColor: [0, 0, 0] as [number, number, number], fillColor: [255, 255, 255] as [number, number, number], cellPadding: 3 } }];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: marginRight },
      body: evRows as any,
      theme: 'grid',
      styles: {
        fontSize: 12,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
  }

  // Nomor Halaman Bersih Standar Tanpa Tulisan Bawaan Sistem
  addCleanPageNumbers(doc);
  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`RPM_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.pdf`);
}

export function exportModulAjarToPDF(modul: ModulAjarDocument, layoutOptions?: Partial<PDFLayoutOptions>) {
  if (modul.identifikasiRPM || modul.desainPembelajaranRPM || modul.langkahPembelajaranRPM) {
    exportRPMToPDF(modul, layoutOptions);
    return;
  }

  const {
    identitas,
    kompetensiAwal,
    profilPelajarPancasila,
    saranaPrasarana,
    modelPembelajaran,
    tujuanPembelajaranSpesifik,
    pemahamanBermakna,
    pertanyaanPemantik,
    kegiatanPembelajaran,
    asesmen,
    pengayaanDanRemedial,
    refleksi,
    lkpd,
  } = modul;

  const layout = resolvePDFLayout(layoutOptions, 'portrait');
  const doc = new jsPDF({ orientation: layout.orientation, unit: 'mm', format: layout.format as any });
  doc.setLineHeightFactor(1.5); // Set jarak baris 1.5

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;
  const margin = marginLeft;
  let currentY = marginTop;

  // Title Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('MODUL AJAR KURIKULUM MERDEKA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.setFontSize(11);
  doc.text(`MATA PELAJARAN: ${identitas.mataPelajaran.toUpperCase()} (${identitas.fase} - KELAS ${identitas.kelas})`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  const sectionStyles = { font: 'times', fontSize: 10, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 };
  const headStyles = { font: 'times', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 };

  const contentWidth = pageWidth - marginLeft - marginRight;

  // I. INFORMASI UMUM
  renderModernSectionHeader(doc, 'I. INFORMASI UMUM / IDENTITAS MODUL', currentY, margin, marginRight, 'IDENTITAS');
  currentY += 8.5;

  const infoUmumRows = [
    ['Satuan Pendidikan', ':', `${identitas.namaSatuanPendidikan || '-'}`],
    ['Penyusun / Guru', ':', `${identitas.namaGuru || '-'}`],
    ['Tahun Pelajaran / Semester', ':', `${identitas.tahunPelajaran} / Semester ${identitas.semester}`],
    ['Jenjang / Fase / Kelas', ':', `SD / ${identitas.fase} / Kelas ${identitas.kelas}`],
    ['Mata Pelajaran', ':', `${identitas.mataPelajaran}`],
    ['Alokasi Waktu Modul', ':', `${identitas.alokasiWaktuModul}`],
    ['Target Murid', ':', `${identitas.targetPesertaDidik}`],
    ['Moda Pembelajaran', ':', `${identitas.modaPembelajaran || '-'}`],
    ['Model Pembelajaran', ':', `${modelPembelajaran}`],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: infoUmumRows,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9.5,
      cellPadding: { top: 2.3, bottom: 2.3, left: 3, right: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [0, 0, 0], valign: 'top' },
      1: { cellWidth: 5, halign: 'center', fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [0, 0, 0], cellPadding: { top: 2.3, bottom: 2.3, left: 0.2, right: 0.2 }, valign: 'top' },
      2: { cellWidth: contentWidth - 59, fontStyle: 'normal', fillColor: [255, 255, 255], textColor: [0, 0, 0], valign: 'top' },
    },
    pageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Sarana & Prasarana, Kompetensi Awal, DPL
  const saranaPrasRows = [
    [{ content: 'Kompetensi Awal:', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } }],
    [`${(kompetensiAwal||[]).map((k: string) => `• ${k}`).join('\n')}`],
    [{ content: 'Dimensi Profil Lulusan:', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } }],
    [`${(profilPelajarPancasila||[]).map((p: string) => `• ${p}`).join('\n')}`],
    [{ content: 'Sarana dan Prasarana:', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } }],
    [`Media Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`],
    [{ content: 'Pemanfaatan Teknologi Digital:', styles: { fontStyle: 'bold' as const, fillColor: [245, 245, 245], textColor: [0, 0, 0] } }],
    [`Platform/Aplikasi: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.platformAplikasi || []).join(', ') || '-'}\nPerangkat Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.perangkatDigital || []).join(', ') || '-'}\nMedia Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.mediaDigital || []).join(', ') || '-'}`]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: marginRight },
    body: saranaPrasRows as any,
    theme: 'grid',
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // II. KOMPONEN INTI
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['II. KOMPONEN INTI']],
    body: [
      [{ content: 'A. Tujuan Pembelajaran Spesifik:', styles: { fontStyle: 'bold' as const } }],
      [`${(tujuanPembelajaranSpesifik||[]).map((t: string) => `• ${t}`).join('\n')}`],
      [{ content: 'B. Pemahaman Bermakna:', styles: { fontStyle: 'bold' as const } }],
      [`${(pemahamanBermakna||[]).map((p: string) => `• ${p}`).join('\n')}`],
      [{ content: 'C. Pertanyaan Pemantik:', styles: { fontStyle: 'bold' as const } }],
      [`${(pertanyaanPemantik||[]).map((p: string) => `• "${p}"`).join('\n')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {
    doc.addPage();
    currentY = margin;
    
    let lpRows: any[] = [];
    
    // Pendahuluan
    let pendaText = "";
    if (pert.pendahuluan && pert.pendahuluan.length > 0) {
      pendaText = pert.pendahuluan.map((p: string, i: number) => `${i+1}. ${p}`).join("\n");
    }
    lpRows.push([
      { content: '1. Pendahuluan', styles: { fontStyle: 'bold' as const } },
      { content: pendaText, colSpan: 2 }
    ]);
    
    // Inti
    if (pert.kegiatanInti && pert.kegiatanInti.length > 0) {
      pert.kegiatanInti.forEach((ki: any, idx: number) => {
        let titleText = idx === 0 ? `2. Kegiatan Inti\n\nFase: ${ki.faseSintaks}` : `Fase: ${ki.faseSintaks}`;
        lpRows.push([
          { content: titleText, styles: { fontStyle: idx === 0 ? 'bold' as const : 'normal' as const } },
          ki.aktivitasGuru,
          ki.aktivitasSiswa
        ]);
      });
    }
    
    // Penutup
    let penutupText = "";
    if (pert.penutup && pert.penutup.length > 0) {
      penutupText = pert.penutup.map((p: string, i: number) => `${i+1}. ${p}`).join("\n");
    }
    lpRows.push([
      { content: '3. Penutup', styles: { fontStyle: 'bold' as const } },
      { content: penutupText, colSpan: 2 }
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[
        { content: `D. KEGIATAN PEMBELAJARAN (Pertemuan ${pert.pertemuanKe}) - ${pert.alokasiWaktu}`, colSpan: 3 }
      ], [
        { content: 'Tahap Kegiatan', styles: { halign: 'center' } },
        { content: 'Aktivitas Guru', styles: { halign: 'center' } },
        { content: 'Aktivitas Murid', styles: { halign: 'center' } }
      ]],
      body: lpRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' }
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  });

  // Asesmen
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['E. ASESMEN PEMBELAJARAN']],
    body: [
      [{ content: '1. Asesmen Diagnostik (Awal):', styles: { fontStyle: 'bold' as const } }],
      [`Teknik: ${asesmen.diagnostik.teknik}\n${(asesmen.diagnostik.daftarPertanyaan||[]).map((q: string) => `• ${q}`).join('\n')}`],
      [{ content: '2. Asesmen Formatif (Proses):', styles: { fontStyle: 'bold' as const } }],
      [`Teknik: ${asesmen.formatif.teknik}\n${asesmen.formatif.deskripsi}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  const rubrikRows = (asesmen.formatif.rubrik||[]).map((r: any) => [r.aspek, r.baruBerkembang, r.layak, r.cakap, r.mahir]);
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Rubrik Penilaian Formatif', '', '', '', '']],
    body: [['Aspek Penilaian', 'Baru Berkembang (1)', 'Layak (2)', 'Cakap (3)', 'Mahir (4)'], ...rubrikRows],
    theme: 'grid',
    headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2, halign: 'center' },
    styles: { font: 'times', fontSize: 11, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  let sumatifRows = (asesmen.sumatif.daftarSoal||[]).map((s: any) => {
    let txt = `${s.nomor}. ${s.soal} (Bobot: ${s.bobot})`;
    if (s.pilihanGanda && s.pilihanGanda.length > 0) {
      txt += `\n${s.pilihanGanda.join('\n')}`;
    }
    txt += `\n\nKunci Jawaban: ${s.kunciJawaban}`;
    return [txt];
  });
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`3. Asesmen Sumatif (Teknik: ${asesmen.sumatif.teknik})`]],
    body: sumatifRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // F. PENGAYAAN, REMEDIAL & REFLEKSI
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['F. PENGAYAAN, REMEDIAL & REFLEKSI']],
    body: [
      [{ content: 'Pengayaan:', styles: { fontStyle: 'bold' as const } }],
      [`${pengayaanDanRemedial?.pengayaan || '-'}`],
      [{ content: 'Remedial:', styles: { fontStyle: 'bold' as const } }],
      [`${pengayaanDanRemedial?.remedial || '-'}`],
      [{ content: 'Refleksi Guru:', styles: { fontStyle: 'bold' as const } }],
      [`${(refleksi?.refleksiGuru || []).map((x: string) => `• ${x}`).join('\n')}`],
      [{ content: 'Refleksi Murid:', styles: { fontStyle: 'bold' as const } }],
      [`${(refleksi?.refleksiSiswa || []).map((x: string) => `• ${x}`).join('\n')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  renderSignatures(doc, identitas, currentY, pageWidth, margin);

  // LKPD
  lkpd.forEach((lk: any, idx: number) => {
    doc.addPage();
    currentY = 16;
    let lkRows = [
      [{ content: 'Tujuan Kegiatan:', styles: { fontStyle: 'bold' as const } }],
      [`${lk.tujuanKegiatan}`],
      [{ content: 'Alat & Bahan:', styles: { fontStyle: 'bold' as const } }],
      [`${(lk.alatBahan || []).map((a: string) => `• ${a}`).join('\n')}`],
      [{ content: 'Langkah Kerja:', styles: { fontStyle: 'bold' as const } }],
      [`${(lk.langkahKerja || []).map((l: string, i: number) => `${i+1}. ${l}`).join('\n')}`],
      [{ content: 'Pertanyaan Diskusi:', styles: { fontStyle: 'bold' as const } }],
      [`${(lk.pertanyaanDiskusi || []).map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`]
    ];
    if (lk.kesimpulanPrompt) {
      lkRows.push([{ content: 'Kesimpulan:', styles: { fontStyle: 'bold' as const } }]);
      lkRows.push([`${lk.kesimpulanPrompt}`]);
    }
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`LAMPIRAN: LKPD ${idx + 1} - ${lk.judulLKPD}`]],
      body: lkRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
  });

  addDocumentPageNumbers(doc, `Modul Ajar - ${identitas.mataPelajaran} (${identitas.fase})`);
  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`Modul_Ajar_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.pdf`);
}

// HELPER FUNCTIONS FOR PDF STYLING & CLEANUP
// ==========================================
export function resolvePDFLayout(
  layoutOptions?: Partial<PDFLayoutOptions>,
  defaultOrientation: 'portrait' | 'landscape' = 'portrait'
) {
  const orientation = layoutOptions?.orientation || defaultOrientation;
  const paperSize = layoutOptions?.paperSize || 'a4';
  const format: string | [number, number] = paperSize === 'f4' ? [215, 330] : paperSize;

  const isLandscape = orientation === 'landscape';
  const defaultMargin = isLandscape ? 14 : 16;
  const isDefaultPortraitMargin =
    layoutOptions?.margins?.left === 25 && layoutOptions?.margins?.right === 20;

  const marginLeft = isLandscape && isDefaultPortraitMargin
    ? 14
    : (layoutOptions?.margins?.left ?? defaultMargin);
  const marginRight = isLandscape && isDefaultPortraitMargin
    ? 14
    : (layoutOptions?.margins?.right ?? defaultMargin);
  const marginTop = layoutOptions?.margins?.top ?? (isLandscape ? 15 : 16);
  const marginBottom = layoutOptions?.margins?.bottom ?? (isLandscape ? 15 : 16);

  return {
    orientation,
    paperSize,
    format,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
  };
}

function renderSectionTitle(doc: jsPDF, title: string, y: number, marginX: number = 14, rightMargin?: number) {
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(title, marginX, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const rMargin = rightMargin !== undefined ? rightMargin : marginX;
  doc.line(marginX, y + 1.5, doc.internal.pageSize.getWidth() - rMargin, y + 1.5);
}

function renderModernSectionHeader(doc: jsPDF, title: string, y: number, marginX: number = 14, rightMargin?: number, badgeText?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rMargin = rightMargin !== undefined ? rightMargin : marginX;
  const contentWidth = pageWidth - marginX - rMargin;
  const boxHeight = 7.5;

  // Background box: neutral light with standard black border
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(marginX, y, contentWidth, boxHeight, 'FD');

  // Left accent bar: black
  doc.setFillColor(0, 0, 0);
  doc.rect(marginX, y, 2.5, boxHeight, 'F');

  // Title text
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(title, marginX + 5, y + 5.2);

  // Optional badge on right side
  if (badgeText) {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    const badgeW = doc.getTextWidth(badgeText) + 5;
    const badgeX = marginX + contentWidth - badgeW - 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(badgeX, y + 1.2, badgeW, 5.0, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.text(badgeText, badgeX + 2.5, y + 4.6);
  }
}

function renderSignatures(doc: jsPDF, identitas: any, startY: number, pageWidth: number, margin: number, rightMargin?: number) {
  const col1X = margin + 5;
  const rMargin = rightMargin !== undefined ? rightMargin : margin;
  const col2X = pageWidth - rMargin - 75;

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  // Col 1: Kepala Sekolah
  doc.text('Mengetahui,', col1X, startY);
  doc.text('Kepala Sekolah', col1X, startY + 5.5);

  doc.setFont('times', 'bold');
  doc.text(identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.', col1X, startY + 26);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${identitas.nipKepalaSekolah || '196709192008011008'}`, col1X, startY + 31.5);

  // Col 2: Penyusun
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`${identitas.tempatPenetapan || 'Fatubai'}, ${identitas.tanggalPenetapan || tanggalHariIni}`, col2X, startY);
  doc.text(`${identitas.peranGuru || 'Guru Kelas'}`, col2X, startY + 5.5);

  doc.setFont('times', 'bold');
  doc.text(identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd', col2X, startY + 26);
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${identitas.nipGuru || '198603012020121005'}`, col2X, startY + 31.5);
}

function addCleanPageNumbers(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`- ${i} -`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
}

function addDocumentPageNumbers(
  doc: jsPDF,
  documentTitle: string,
  marginLeft: number = 14,
  marginRight: number = 14,
  mataPelajaran?: string
) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const regShort = getCpRegulationInfo(mataPelajaran || documentTitle).shortName;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Top subtle running header
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(documentTitle, marginLeft, 8);
    doc.text(`Kurikulum Merdeka - ${regShort}`, pageWidth - marginRight, 8, { align: 'right' });

    // Bottom running footer
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, pageHeight - 10, pageWidth - marginRight, pageHeight - 10);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Dokumen Perangkat Ajar Kurikulum Merdeka`, marginLeft, pageHeight - 6);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - marginRight, pageHeight - 6, { align: 'right' });
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 4. EXPORT DOKUMEN KKTP (KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN)
// ==========================================

export function exportKKTPToWord(kktp: KKTPDocument) {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const id = kktp.identitas;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `KKTP_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}_${(id.namaSatuanPendidikan || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;

  const kopHtml = `
    <table style="width: 100%; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
      <tr>
        ${id.logoUrl ? `<td style="width: 15%; text-align: center; vertical-align: middle; padding-right: 12px;"><img src="${id.logoUrl}" style="max-height: 75px; max-width: 75px; object-fit: contain;" alt="Logo" /></td>` : ''}
        <td style="text-align: center; vertical-align: middle;">
          <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px;">PEMERINTAH KABUPATEN TIMOR TENGAH UTARA</h3>
          <h2 style="margin: 2px 0; font-size: 11pt; text-transform: uppercase; font-weight: bold;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
          <h1 style="margin: 3px 0; font-size: 13pt; text-transform: uppercase; font-weight: bold;">${lockWordData(id.namaSatuanPendidikan || 'SD NEGERI FATUBAI', 'Satuan Pendidikan')}</h1>
          <p style="margin: 2px 0 0 0; font-size: 9.5pt;">Alamat: ${lockWordData(id.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713')}</p>
        </td>
      </tr>
    </table>
  `;

  const identitasTable = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'Times New Roman', serif; font-size: 11pt;">
      <tr>
        <td style="width: 25%; font-weight: bold; padding: 4px 0;">Satuan Pendidikan</td>
        <td style="width: 3%;">:</td>
        <td style="width: 32%;">${lockWordData(id.namaSatuanPendidikan, 'Satuan Pendidikan')}</td>
        <td style="width: 18%; font-weight: bold; padding: 4px 0;">Fase / Kelas</td>
        <td style="width: 3%;">:</td>
        <td style="width: 19%;">${lockWordData(id.fase, 'Fase')} / ${lockWordData(id.kelas, 'Kelas')}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 4px 0;">Mata Pelajaran</td>
        <td>:</td>
        <td>${id.mataPelajaran}</td>
        <td style="font-weight: bold; padding: 4px 0;">Semester</td>
        <td>:</td>
        <td>${id.semester}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 4px 0;">Penyusun</td>
        <td>:</td>
        <td>${lockWordData(id.namaGuru, 'Nama Guru')}</td>
        <td style="font-weight: bold; padding: 4px 0;">Tahun Ajaran</td>
        <td>:</td>
        <td>${lockWordData(id.tahunPelajaran, 'Tahun Pelajaran')}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 4px 0;">Standar KKTP</td>
        <td>:</td>
        <td colspan="4"><span style="background: #dcfce7; color: #166534; padding: 3px 10px; font-weight: bold; border: 1px solid #86efac;">KKTP Berbasis TP (Minimal Cakap / Interval 66 - 85%) &bull; Bukan KKM Tunggal</span></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 4px 0;">Dasar Regulasi</td>
        <td>:</td>
        <td colspan="4" style="font-size: 11pt; color: #334155;">Permendikbudristek No. 21/2022 Pasal 9 &bull; Panduan Pembelajaran dan Asesmen (PPA) 2025</td>
      </tr>
    </table>
  `;

  // Rubrik Kualitatif Table (4 Jenjang Resmi)
  const rubrikRows = kktp.kktpList
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center; vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px;">${idx + 1}</td>
        <td style="text-align: center; vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-weight: bold;">${item.kodeTP}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px;">
          <div style="font-weight: bold; color: #1e3a8a;">[${item.elemen}]</div>
          <div>${item.rumusanTP}</div>
          <div style="font-size: 11pt; color: #475569; margin-top: 3px;"><strong>Materi:</strong> ${item.lingkupMateri} (${item.alokasiJP} JP)</div>
          <div style="font-size: 11pt; color: #166534; margin-top: 4px; background: #f0fdf4; padding: 3px; border: 1px solid #bbf7d0;"><strong>Ketuntasan:</strong> ${item.pendekatanRubrik.kesimpulanKetuntasan || 'Minimal Cakap pada kedua eviden'}</div>
        </td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #fff1f2;">${item.pendekatanRubrik.baruBerkembang || item.pendekatanRubrik.perluBimbingan}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #fffbeb;">${item.pendekatanRubrik.layak || item.pendekatanRubrik.cukup}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #f0fdf4; font-weight: 500;">${item.pendekatanRubrik.cakap || item.pendekatanRubrik.baik}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #eff6ff;">${item.pendekatanRubrik.mahir || item.pendekatanRubrik.sangatBaik}</td>
      </tr>
    `
    )
    .join('');

  // Interval Nilai Table
  const intervalRows = kktp.kktpList
    .map(
      (item) => `
      <tr>
        <td style="text-align: center; vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-weight: bold;">${item.kodeTP}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt;">${item.rumusanTP}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #ffe4e6;">${item.intervalNilai.interval0_40}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #fef3c7;">${item.intervalNilai.interval41_65}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #dcfce7;">${item.intervalNilai.interval66_85}</td>
        <td style="vertical-align: top; border: 1.0pt solid #000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; background: #dbeafe;">${item.intervalNilai.interval86_100}</td>
      </tr>
    `
    )
    .join('');

  const tandaTanganHtml = `
    <div style="page-break-before: always; page-break-inside: avoid; mso-break-type: section-break; font-family: 'Times New Roman', serif;">
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="font-size: 11pt; text-transform: uppercase; font-weight: bold; margin: 0;">LEMBAR PENGESAHAN & PENETAPAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h3>
        <p style="font-size: 10pt; font-style: italic; margin: 4px 0 0 0;">Standar Pembelajaran dan Asesmen Kurikulum Merdeka - ${getCpRegulationInfo(kktp.identitas?.mataPelajaran).fullName} &amp; Permendikbudristek No. 21/2022</p>
        <hr style="border: 0; border-bottom: 1px solid #000; margin-top: 8px;"/>
      </div>

      <div style="margin-bottom: 18px; border: 1.0pt solid #000; padding: 10px; background-color: #f8fafc; page-break-inside: avoid;">
        <div style="font-weight: bold; text-align: center; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px; font-size: 10.5pt; color: #0f172a;">
          INFORMASI PENETAPAN DAN JENIS KKTP YANG DIGUNAKAN
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1.0pt solid #000; font-size: 10pt; font-family: 'Times New Roman', serif; margin-bottom: 0;">
          <tr>
            <td style="width: 32%; font-weight: bold; vertical-align: top; padding: 6px 8px; background: #f1f5f9; border: 1.0pt solid #000;">1. Jenis / Pendekatan KKTP yang Digunakan</td>
            <td style="width: 68%; vertical-align: top; padding: 6px 8px; border: 1.0pt solid #000;">
              <strong>&bull; Pendekatan Skala atau Interval Nilai</strong> (Standar Kuantitatif Penilaian Sumatif)<br/>
              <strong>&bull; Pendekatan Rubrik Kualitatif 4 Kategori</strong>: Baru Berkembang, Layak, Cakap, Mahir (Standar Bukti Belajar / Eviden)<br/>
              <strong>&bull; Pendekatan Deskripsi Kriteria & Interval Olahan Rubrik</strong> (Dasar Perumusan Narasi Rapor)
            </td>
          </tr>
          <tr>
            <td style="font-weight: bold; vertical-align: top; padding: 6px 8px; background: #f1f5f9; border: 1.0pt solid #000;">2. Kriteria & Rentang Interval Ketuntasan</td>
            <td style="vertical-align: top; padding: 6px 8px; border: 1.0pt solid #000;">
              &bull; <strong>0% - 40%</strong> : Belum Mencapai Tujuan (Wajib Remedial di Seluruh Bagian)<br/>
              &bull; <strong>41% - 65%</strong> : Belum Mencapai Tujuan (Remedial Terarah pada Indikator Belum Dikuasai)<br/>
              &bull; <strong style="color: #166534;">66% - 85% : SUDAH MENCAPAI TUJUAN (TUNTAS KKTP - Lanjut ke TP Berikutnya)</strong><br/>
              &bull; <strong style="color: #1e40af;">86% - 100% : MELAMPAUI STANDAR (Tuntas KKTP dengan Pengayaan HOTS)</strong>
            </td>
          </tr>
          <tr>
            <td style="font-weight: bold; vertical-align: top; padding: 6px 8px; background: #f1f5f9; border: 1.0pt solid #000;">3. Standar Batas Minimal Ketuntasan</td>
            <td style="vertical-align: top; padding: 6px 8px; border: 1.0pt solid #000;">
              Peserta didik dinyatakan <strong>TUNTAS</strong> mencapai Tujuan Pembelajaran (TP) jika mencapai rentang nilai <strong>Interval 66% - 85%</strong> atau mencapai tahap predikat minimal <strong>CAKAP</strong> pada seluruh bukti kriteria performa.
            </td>
          </tr>
          <tr>
            <td style="font-weight: bold; vertical-align: top; padding: 6px 8px; background: #f1f5f9; border: 1.0pt solid #000;">4. Landasan Regulasi & Prinsip Penilaian</td>
            <td style="vertical-align: top; padding: 6px 8px; border: 1.0pt solid #000;">
              Permendikbudristek No. 21 Tahun 2022 Pasal 9 & Panduan Pembelajaran dan Asesmen (PPA) 2025. KKTP ditetapkan spesifik per Tujuan Pembelajaran (TP) — <strong>BUKAN KKM tunggal pukul rata</strong>. Penilaian formatif untuk perbaikan pembelajaran, sedangkan penilaian sumatif untuk ketercapaian TP dan penulisan deskripsi rapor.
            </td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; margin-top: 25px; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; border: none; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%; text-align: center; border: none;">
            Mengetahui,<br/>
            Kepala Sekolah<br/><br/><br/><br/>
            <strong><u>${lockWordData(id.namaKepalaSekolah, 'Nama Kepala Sekolah')}</u></strong><br/>
            NIP. ${lockWordData(id.nipKepalaSekolah || '........................................', 'NIP Kepala Sekolah')}
          </td>
          <td style="width: 50%; text-align: center; border: none;">
            ${id.tempatPenetapan || 'Fatubai'}, ${id.tanggalPenetapan || kktp.tanggalDibuat || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
            ${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan Guru')}<br/><br/><br/><br/>
            <strong><u>${lockWordData(id.namaGuru, 'Nama Guru')}</u></strong><br/>
            NIP. ${lockWordData(id.nipGuru || '........................................', 'NIP Guru')}
          </td>
        </tr>
      </table>
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>KKTP ${id.mataPelajaran} ${id.fase}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 2.5cm 2.5cm 2.5cm 3.5cm; /* margin kiri 3.5cm untuk penjilidan */
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000; }
        h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; margin: 0; }
        .section-title { font-size: 11pt; font-weight: bold; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; }
        p { font-size: 11pt; line-height: 1.5; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0; width: 100%; font-size: 11pt; font-family: 'Times New Roman', Times, serif; }
        th { background: #f1f5f9; border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 8px; font-size: 11pt; text-align: center; font-family: 'Times New Roman', Times, serif; }
        td { border: 1.0pt solid #000000; mso-border-alt: solid black 1.0pt; padding: 6px 8px; font-family: 'Times New Roman', Times, serif; }
      </style>
    </head>
    <body>
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 16px;">
        <h2 style="font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px;">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h2>
        <p style="margin: 4px 0 0 0; font-size: 11pt;">MATA PELAJARAN: <strong>${(id.mataPelajaran || '').toUpperCase()}</strong> - ${lockWordData(id.fase.toUpperCase(), 'Fase')}</p>
      </div>

      ${identitasTable}

      <div class="section-title">A. DASAR PEDAGOGIS & KETENTUAN KKTP (BSKAP 046/2025)</div>
      <p style="text-align: justify; margin: 6px 0 16px 0; font-size: 11pt; line-height: 1.5;">${kktp.catatanPedagogis}</p>

      <div class="section-title">B. DOKUMEN UTAMA: CARA KETIGA (MENGGUNAKAN SKALA / INTERVAL NILAI) - PPA SLIDE 16-17</div>
      <div style="font-size: 11pt; color: #1e293b; background: #f8fafc; border: 1.0pt solid #cbd5e1; padding: 10px; margin-bottom: 12px; line-height: 1.5;">
        <strong>Ketentuan Baku Penetapan KKTP Menggunakan Skala / Interval Nilai (Panduan Pembelajaran dan Asesmen 2025):</strong>
        <ol style="margin: 4px 0 0 0; padding-left: 20px;">
          <li><strong>Batas Ketercapaian (KKTP):</strong> Peserta didik dinyatakan telah mencapai Tujuan Pembelajaran apabila perolehan nilainya minimal berada pada interval <strong>66% - 85%</strong> (skor &ge; 66).</li>
          <li><strong>Formula Perhitungan Nilai:</strong> <code>Persentase Ketercapaian (%) = (Skor Perolehan / Skor Maksimal Instrumen) &times; 100%</code></li>
          <li><strong>Rencana Aksi Intervensi Pedagogis:</strong>
            <ul style="margin: 2px 0 0 0; padding-left: 18px;">
              <li><strong style="color: #991b1b;">0% - 40% (Belum Mencapai Tujuan):</strong> Diberikan remedial di seluruh bagian materi dengan bimbingan intensif dan alat peraga konkret.</li>
              <li><strong style="color: #b45309;">41% - 65% (Belum Mencapai Tujuan):</strong> Diberikan remedial di bagian yang diperlukan melalui tutor sebaya dan latihan bertahap.</li>
              <li><strong style="color: #166534;">66% - 85% (Sudah Mencapai Tujuan - Tuntas KKTP):</strong> Tidak perlu remedial, murid siap melanjutkan ke TP berikutnya.</li>
              <li><strong style="color: #1e40af;">86% - 100% (Sudah Mencapai Tujuan - Melampaui Standar):</strong> Diberikan pengayaan materi penalaran tingkat tinggi (HOTS) atau mini proyek.</li>
            </ul>
          </li>
          <li><strong>Penyusunan Rapor:</strong> Interval ini menjadi dasar penulisan deskripsi rapor Kurikulum Merdeka (menarasikan kompetensi tertinggi dan yang masih perlu pendampingan).</li>
        </ol>
      </div>

      <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0;">
        <thead>
          <tr>
            <th style="width: 7%;">Kode TP</th>
            <th style="width: 23%;">Elemen & Tujuan Pembelajaran (TP)</th>
            <th style="width: 17%; background: #fee2e2; color: #991b1b;">0% - 40%<br/>(Remedial Total)</th>
            <th style="width: 17%; background: #fef3c7; color: #92400e;">41% - 65%<br/>(Remedial Terarah)</th>
            <th style="width: 18%; background: #dcfce7; color: #166534;">66% - 85% [TUNTAS KKTP]<br/>(Lanjut TP Berikutnya)</th>
            <th style="width: 18%; background: #dbeafe; color: #1e40af;">86% - 100%<br/>(Pengayaan HOTS)</th>
          </tr>
        </thead>
        <tbody>
          ${intervalRows}
        </tbody>
      </table>

      <div class="section-title" style="page-break-before: always;">C. DOKUMEN PENDUKUNG: PENDEKATAN RUBRIK KUALITATIF 4 JENJANG (SLIDE 11-15)</div>
      <p style="font-size: 11pt; color: #334155; margin: 4px 0 8px 0;">
        <strong>Kriteria Ketuntasan:</strong> Peserta didik dinyatakan telah mencapai Tujuan Pembelajaran jika bukti performa/kriteria mencapai tahap <strong>MINIMAL CAKAP</strong> atau <strong>MAHIR</strong> (Skor 71 - 100).
      </p>
      <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 1.0pt solid #000000; border-spacing: 0;">
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 8%;">Kode TP</th>
            <th style="width: 26%;">Elemen, Rumusan TP & Materi</th>
            <th style="width: 15%; background: #fee2e2;">Baru Berkembang<br/>(0 - 60)</th>
            <th style="width: 15%; background: #fef3c7;">Layak<br/>(61 - 70)</th>
            <th style="width: 16%; background: #dcfce7;">Cakap [Tuntas KKTP]<br/>(71 - 85)</th>
            <th style="width: 16%; background: #dbeafe;">Mahir<br/>(86 - 100)</th>
          </tr>
        </thead>
        <tbody>
          ${rubrikRows}
        </tbody>
      </table>

      <div class="section-title">D. PANDUAN PELAKSANAAN ASESMEN FORMATIF, SUMATIF & RAPOR</div>
      <div style="font-size: 11pt; margin-bottom: 12px;">
        <strong>1. Asesmen Formatif (Assessment for & as learning):</strong>
        <ul style="margin: 4px 0; padding-left: 20px;">
          ${kktp.panduanPelaksanaanAsesmen.langkahAsesmenFormatif.map((l) => `<li>${l}</li>`).join('')}
        </ul>
        <strong>2. Asesmen Sumatif (Assessment of learning):</strong>
        <ul style="margin: 4px 0; padding-left: 20px;">
          ${kktp.panduanPelaksanaanAsesmen.langkahAsesmenSumatif.map((l) => `<li>${l}</li>`).join('')}
        </ul>
        <strong>3. Pengolahan Nilai Rapor:</strong>
        <p style="margin: 4px 0 0 0; text-align: justify;">${kktp.panduanPelaksanaanAsesmen.pengolahanNilaiRapor}</p>
      </div>

      ${tandaTanganHtml}
    </body>
    </html>
  `;

  downloadBlob(htmlContent, fileName, 'application/msword');
}

export function exportKKTPToExcel(kktp: KKTPDocument) {
  const id = kktp.identitas;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `KKTP_Excel_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.csv`;

  const headers = [
    'No',
    'Kode TP',
    'Elemen',
    'Rumusan Tujuan Pembelajaran (TP)',
    'Lingkup Materi',
    'Alokasi JP',
    'Semester',
    'IKTP (Bukti Kinerja)',
    'Bentuk Penilaian',
    'Instrumen Penilaian',
    'Pendekatan KKTP',
    'Rubrik: Baru Berkembang (0-60)',
    'Rubrik: Layak (61-70)',
    'Rubrik: Cakap (71-85) [KKTP]',
    'Rubrik: Mahir (86-100)',
    'Kesimpulan Ketuntasan Rubrik',
    'Interval 0-40% (Remedial Total)',
    'Interval 41-65% (Remedial Terarah)',
    'Interval 66-85% (Tuntas Belajar KKTP)',
    'Interval 86-100% (Pengayaan HOTS)',
    'Kesimpulan Interval',
    'Target KKO Taksonomi Bloom',
  ];

  const rows = kktp.kktpList.map((item, idx) => [
    idx + 1,
    `"${item.kodeTP}"`,
    `"${item.elemen}"`,
    `"${item.rumusanTP.replace(/"/g, '""')}"`,
    `"${item.lingkupMateri.replace(/"/g, '""')}"`,
    item.alokasiJP,
    `"${item.semester}"`,
    `"${item.indikatorKetercapaian.replace(/"/g, '""')}"`,
    `"${(item.perencanaanPenilaian?.bentukPenilaian || (item.teknikAsesmen || []).join(', ')).replace(/"/g, '""')}"`,
    `"${(item.perencanaanPenilaian?.instrumenPenilaian || item.instrumenAsesmen).replace(/"/g, '""')}"`,
    `"${(item.perencanaanPenilaian?.pendekatanKKTP || 'Rubrik & Interval Nilai').replace(/"/g, '""')}"`,
    `"${(item.pendekatanRubrik.baruBerkembang || item.pendekatanRubrik.perluBimbingan).replace(/"/g, '""')}"`,
    `"${(item.pendekatanRubrik.layak || item.pendekatanRubrik.cukup).replace(/"/g, '""')}"`,
    `"${(item.pendekatanRubrik.cakap || item.pendekatanRubrik.baik).replace(/"/g, '""')}"`,
    `"${(item.pendekatanRubrik.mahir || item.pendekatanRubrik.sangatBaik).replace(/"/g, '""')}"`,
    `"${(item.pendekatanRubrik.kesimpulanKetuntasan || 'Minimal Cakap pada kedua eviden').replace(/"/g, '""')}"`,
    `"${item.intervalNilai.interval0_40.replace(/"/g, '""')}"`,
    `"${item.intervalNilai.interval41_65.replace(/"/g, '""')}"`,
    `"${item.intervalNilai.interval66_85.replace(/"/g, '""')}"`,
    `"${item.intervalNilai.interval86_100.replace(/"/g, '""')}"`,
    `"${(item.intervalNilai.kesimpulanInterval || 'KKTP: Interval 66% - 85%').replace(/"/g, '""')}"`,
    `"${(item.bloomTaxonomy?.tingkatKKO || 'C4 Menganalisis').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, fileName, 'text/csv');
}

export function exportKKTPToPDF(kktp: KKTPDocument, layoutOptions?: Partial<PDFLayoutOptions>) {
  const layout = resolvePDFLayout(layoutOptions, 'landscape');
  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: layout.format as any,
  });

  const id = kktp.identitas;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('DOKUMEN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${(id.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase()} - KURIKULUM MERDEKA`, pageWidth / 2, 17, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(
    `Mata Pelajaran: ${id.mataPelajaran} | ${id.fase} - Kelas ${id.kelas} | Semester ${id.semester} | Tahun Ajaran ${id.tahunPelajaran} | Penyusun: ${id.namaGuru}`,
    pageWidth / 2,
    21.5,
    { align: 'center' }
  );
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(
    'Landasan Regulasi: Permendikbudristek No. 21/2022 & Panduan Pembelajaran dan Asesmen (PPA) 2025 (KKTP Berbasis TP, Bukan KKM)',
    pageWidth / 2,
    25.5,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, 27.5, pageWidth - marginRight, 27.5);

  const tableData = kktp.kktpList.map((item, idx) => [
    idx + 1,
    item.kodeTP,
    `${item.elemen}\n\n${item.rumusanTP}\n(Materi: ${item.lingkupMateri} - ${item.alokasiJP} JP)\n[KKTP: Interval 66% - 85%]`,
    item.intervalNilai?.interval0_40 || '-',
    item.intervalNilai?.interval41_65 || '-',
    item.intervalNilai?.interval66_85 || '-',
    item.intervalNilai?.interval86_100 || '-',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        { content: 'No', styles: { halign: 'center' } },
        { content: 'Kode TP', styles: { halign: 'center' } },
        { content: 'Elemen & Tujuan Pembelajaran (TP)', styles: { halign: 'left' } },
        { content: '0% - 40%\n(Remedial Total)', styles: { halign: 'center', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
        { content: '41% - 65%\n(Remedial Terarah)', styles: { halign: 'center', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
        { content: '66% - 85% [TUNTAS KKTP]\n(Lanjut TP Berikutnya)', styles: { halign: 'center', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
        { content: '86% - 100%\n(Pengayaan HOTS)', styles: { halign: 'center', fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
      ],
    ],
    body: tableData,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    styles: {
      font: 'times',
      fontSize: 11,
      cellPadding: 2,
      valign: 'top',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 56 },
      3: { cellWidth: 48 },
      4: { cellWidth: 48 },
      5: { cellWidth: 50 },
      6: { cellWidth: 46 },
    },
    margin: { left: 14, right: 14 },
  });

  // Halaman terpisah untuk Lembar Pengesahan & Penetapan KKTP
  // KETERANGAN INFORMASI JENIS KKTP WAJIB BERADA 1 HALAMAN DENGAN TANDA TANGAN TIDAK BOLEH DIPISAHKAN!
  doc.addPage('a4', 'landscape');
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.text('LEMBAR PENGESAHAN & PENETAPAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', pageWidth / 2, 18, { align: 'center' });
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Standar Kurikulum Merdeka - Berdasarkan Permendikbudristek No. 21/2022 & ${getCpRegulationInfo(kktp.identitas?.mataPelajaran).fullName}`, pageWidth / 2, 23, { align: 'center' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, 25.5, pageWidth - marginRight, 25.5);
  doc.setTextColor(0, 0, 0);

  // Baris Identitas Singkat Dokumen
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `Satuan Pendidikan: ${id.namaSatuanPendidikan || 'SD Negeri'}  |  Mata Pelajaran: ${id.mataPelajaran}  |  ${id.fase} - Kelas ${id.kelas}  |  Semester: ${id.semester}  |  Tahun Ajaran: ${id.tahunPelajaran}`,
    pageWidth / 2,
    30,
    { align: 'center' }
  );

  // Informasi Terkait Jenis KKTP yang Digunakan
  const infoTableWidth = pageWidth - marginLeft - marginRight;
  autoTable(doc, {
    startY: 33,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: infoTableWidth,
    head: [
      [
        {
          content: 'INFORMASI PENETAPAN DAN JENIS KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) YANG DIGUNAKAN',
          colSpan: 2,
          styles: { halign: 'center', fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9.5 },
        },
      ],
    ],
    body: [
      [
        { content: '1. Jenis / Pendekatan KKTP yang Digunakan', styles: { fontStyle: 'bold', cellWidth: 72 } },
        { content: '• Pendekatan Skala atau Interval Nilai (Standar Kuantitatif Penilaian Sumatif)\n• Pendekatan Rubrik Kualitatif 4 Kategori (Baru Berkembang, Layak, Cakap, Mahir)\n• Pendekatan Deskripsi Kriteria & Interval Olahan Rubrik (Dasar Perumusan Narasi Rapor)' },
      ],
      [
        { content: '2. Kriteria & Rentang Interval Ketuntasan', styles: { fontStyle: 'bold' } },
        { content: '• 0% - 40%   : Belum Mencapai Ketuntasan (Wajib remedial di seluruh bagian dengan bimbingan intensif)\n• 41% - 65%  : Belum Mencapai Ketuntasan (Remedial terarah pada indikator eviden yang belum dikuasai)\n• 66% - 85%  : SUDAH MENCAPAI TUJUAN (TUNTAS KKTP - Siap melanjutkan ke Tujuan Pembelajaran berikutnya)\n• 86% - 100% : MELAMPAUI STANDAR (Tuntas KKTP dengan materi pengayaan dan tantangan HOTS)' },
      ],
      [
        { content: '3. Batas Minimal Ketercapaian (KKTP)', styles: { fontStyle: 'bold' } },
        { content: 'Peserta didik dinyatakan TUNTAS mencapai Tujuan Pembelajaran (TP) jika memperoleh nilai pada rentang Interval Minimal 66% - 85% atau mencapai predikat minimal "CAKAP" pada rubrik penilaian kualitatif.' },
      ],
      [
        { content: '4. Landasan Regulasi & Kebijakan Rapor', styles: { fontStyle: 'bold' } },
        { content: 'Permendikbudristek No. 21 Tahun 2022 Pasal 9 & Panduan Pembelajaran dan Asesmen (PPA) 2025. KKTP ditetapkan spesifik per Tujuan Pembelajaran (TP), BUKAN KKM tunggal pukul rata. Penilaian formatif untuk diagnosis pembelajaran, dan penilaian sumatif untuk ketercapaian TP serta penulisan deskripsi rapor.' },
      ],
    ],
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 92;
  const signatureStartY = Math.max(finalTableY + 8, 106);

  renderSignatures(doc, id, signatureStartY, pageWidth, marginLeft, marginRight);

  addDocumentPageNumbers(doc, `KKTP ${id.mataPelajaran} ${id.fase}`, marginLeft, marginRight);
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`KKTP_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.pdf`);
}

// ==========================================
// 5. EXPORT DOKUMEN PROGRAM TAHUNAN (PROTA)
// ==========================================

export function exportProtaToWord(prota: ProtaDocument) {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const id = prota.identitas;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `PROTA_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}_${(id.namaSatuanPendidikan || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;

  const kopHtml = `
    <table style="width: 100%; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
      <tr>
        ${id.logoUrl ? `<td style="width: 15%; text-align: center; vertical-align: middle; padding-right: 12px;"><img src="${id.logoUrl}" style="max-height: 75px; max-width: 75px; object-fit: contain;" alt="Logo" /></td>` : ''}
        <td style="text-align: center; vertical-align: middle;">
          <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px;">PEMERINTAH KABUPATEN TIMOR TENGAH UTARA</h3>
          <h2 style="margin: 2px 0; font-size: 11pt; text-transform: uppercase; font-weight: bold;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
          <h1 style="margin: 3px 0; font-size: 13pt; text-transform: uppercase; font-weight: bold;">${lockWordData(id.namaSatuanPendidikan || 'SD NEGERI FATUBAI', 'Satuan Pendidikan')}</h1>
          <p style="margin: 2px 0 0 0; font-size: 9.5pt;">Alamat: ${lockWordData(id.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713')}</p>
        </td>
      </tr>
    </table>
  `;

  const renderTableRows = (items: typeof prota.itemsSemester1) => {
    return items
      .map(
        (it) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 11pt;">${it.nomor}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">${it.kodeTP}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11pt;">${it.elemen}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11pt;">${it.tujuanPembelajaran}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11pt;">${it.lingkupMateri}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">${it.alokasiJP} JP</td>
      </tr>
    `
      )
      .join('');
  };

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Program Tahunan (PROTA) - ${id.mataPelajaran}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 20px; font-size: 11pt; line-height: 1.5; }
        th { border: 1px solid #000; background-color: #f2f2f2; padding: 8px; font-size: 11pt; text-align: center; font-weight: bold; line-height: 1.5; }
        td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; vertical-align: top; line-height: 1.5; }
        .section-title { font-size: 11pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-bottom: 1.5px solid #000; padding-bottom: 6px; line-height: 1.5; }
      </style>
    </head>
    <body>
      ${kopHtml}
      
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 11pt; text-transform: uppercase; font-weight: bold; text-decoration: underline;">PROGRAM TAHUNAN (PROTA)</h2>
        <p style="margin: 4px 0 0; font-size: 11pt; font-weight: bold;">KURIKULUM MERDEKA TAHUN PELAJARAN ${lockWordData(id.tahunPelajaran || '2025/2026', 'Tahun Pelajaran')}</p>
      </div>

      <table>
        <tr>
          <td style="width: 25%; font-weight: bold; border: none; padding: 3px 0;">Satuan Pendidikan</td>
          <td style="width: 2%; border: none; padding: 3px 0;">:</td>
          <td style="border: none; padding: 3px 0;">${lockWordData(id.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Satuan Pendidikan')}</td>
          <td style="width: 20%; font-weight: bold; border: none; padding: 3px 0;">Fase / Kelas</td>
          <td style="width: 2%; border: none; padding: 3px 0;">:</td>
          <td style="border: none; padding: 3px 0;">${lockWordData(id.fase, 'Fase')} / Kelas ${lockWordData(String(id.kelas), 'Kelas')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border: none; padding: 3px 0;">Mata Pelajaran</td>
          <td style="border: none; padding: 3px 0;">:</td>
          <td style="border: none; padding: 3px 0;">${lockWordData(id.mataPelajaran, 'Mata Pelajaran')}</td>
          <td style="font-weight: bold; border: none; padding: 3px 0;">Alokasi JP Permen 13/2025</td>
          <td style="border: none; padding: 3px 0;">:</td>
          <td style="border: none; padding: 3px 0; font-weight: bold;">${prota.totalJPTahun} JP / Tahun (${prota.alokasiRegulasi.jpMingguIntra} JP / Minggu)</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border: none; padding: 3px 0;">Penyusun</td>
          <td style="border: none; padding: 3px 0;">:</td>
          <td style=\"border: none; padding: 3px 0;\">${lockWordData(id.namaGuru, 'Guru')}</td>
          <td style="font-weight: bold; border: none; padding: 3px 0;">Dasar Hukum</td>
          <td style="border: none; padding: 3px 0;">:</td>
          <td style="border: none; padding: 3px 0; font-size: 11pt;">${prota.alokasiRegulasi.dasarHukum}</td>
        </tr>
      </table>

      <div class="section-title">A. DISTRIBUSI ALOKASI WAKTU SEMESTER 1 (GANJIL)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 10%;">Kode TP</th>
            <th style="width: 18%;">Elemen</th>
            <th style="width: 37%;">Tujuan Pembelajaran (TP)</th>
            <th style="width: 20%;">Lingkup Materi</th>
            <th style="width: 10%;">Alokasi JP</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(prota.itemsSemester1)}
          <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="5" style="text-align: right; padding: 8px;">Subtotal Alokasi Semester 1:</td>
            <td style="text-align: center; padding: 8px; font-size: 11pt;">${prota.summarySemester1.totalJPSemester} JP</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">B. DISTRIBUSI ALOKASI WAKTU SEMESTER 2 (GENAP)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 10%;">Kode TP</th>
            <th style="width: 18%;">Elemen</th>
            <th style="width: 37%;">Tujuan Pembelajaran (TP)</th>
            <th style="width: 20%;">Lingkup Materi</th>
            <th style="width: 10%;">Alokasi JP</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(prota.itemsSemester2)}
          <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="5" style="text-align: right; padding: 8px;">Subtotal Alokasi Semester 2:</td>
            <td style="text-align: center; padding: 8px; font-size: 11pt;">${prota.summarySemester2.totalJPSemester} JP</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">C. REKAPITULASI TOTAL PROGRAM TAHUNAN &amp; VALIDASI REGULASI</div>
      <table>
        <tr style="background-color: #f2f2f2;">
          <th style="text-align: left; width: 60%;">Komponen Alokasi Waktu</th>
          <th style="width: 40%;">Alokasi JP Resmi</th>
        </tr>
        <tr>
          <td>1. Total Jam Intrakurikuler Semester 1 (Ganjil)</td>
          <td style="text-align: center; font-weight: bold;">${prota.summarySemester1.totalJPSemester} JP (${prota.summarySemester1.jumlahMingguEfektif} Minggu Efektif)</td>
        </tr>
        <tr>
          <td>2. Total Jam Intrakurikuler Semester 2 (Genap)</td>
          <td style="text-align: center; font-weight: bold;">${prota.summarySemester2.totalJPSemester} JP (${prota.summarySemester2.jumlahMingguEfektif} Minggu Efektif)</td>
        </tr>
        <tr style="background-color: #e8f5e9; font-weight: bold;">
          <td>Total Alokasi Waktu Intrakurikuler 1 Tahun Pelajaran</td>
          <td style="text-align: center; font-size: 11pt; color: #1b5e20;">${prota.totalJPTahunAkumulasi} JP (Validasi Sesuai Permendikdasmen No. 13/2025)</td>
        </tr>
        <tr>
          <td>Projek Penguatan Profil Pelajar Pancasila (P5) / Kokurikuler (Tahunan)</td>
          <td style="text-align: center;">${prota.alokasiRegulasi.jpTahunKoku || 36} JP / Tahun</td>
        </tr>
      </table>

      <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 18px;">
        <div style="border: 1px solid #94a3b8; background-color: #f8fafc; padding: 10px 14px; margin-bottom: 14px; font-size: 11pt; font-family: 'Times New Roman', serif;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #0f172a;">KETERANGAN &amp; CATATAN PELAKSANAAN PROGRAM TAHUNAN (PROTA):</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155;">
            <li style="margin-bottom: 3px;"><b>Dasar Regulasi:</b> Alokasi jam pelajaran (JP) intrakurikuler berpedoman baku pada <b>Permendikdasmen No. 13 Tahun 2025</b> dan Capaian Pembelajaran (CP) berdasarkan <b>${getCpRegulationInfo(prota.identitas?.mataPelajaran).fullName}</b>.</li>
            <li style="margin-bottom: 3px;"><b>Sinkronisasi Kaldik Daerah:</b> Berpedoman pada <b>Kalender Pendidikan Kabupaten Timor Tengah Utara Tahun Ajaran 2026/2027 (SK Kadis Dikbud TTU No. 400.3/36/2026)</b> dengan total <b>213 Hari Efektif Sekolah</b> (105 Hari Semester 1 dan 108 Hari Semester 2 / 36-44 Pekan Efektif).</li>
            <li style="margin-bottom: 3px;"><b>Fleksibilitas Pelaksanaan:</b> Alokasi JP per Tujuan Pembelajaran (TP) dan alur per semester bersifat dinamis, dapat disesuaikan dengan asesmen diagnostik murid dan agenda satuan pendidikan.</li>
            <li style="margin-bottom: 3px;"><b>Ketuntasan Belajar:</b> Ketercapaian kompetensi diukur berdasarkan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis pendekatan rubrik/interval nilai, bukan nilai KKM tunggal.</li>
            <li><b>Alokasi Kokurikuler:</b> Jam Projek Penguatan Profil Pelajar Pancasila (P5) dialokasikan tersendiri sebesar ${prota.alokasiRegulasi.jpTahunKoku || 36} JP/tahun di luar alokasi intrakurikuler di atas.</li>
          </ul>
        </div>

        <table style="border: none; width: 100%;">
          <tr>
            <td style="border: none; width: 50%; vertical-align: top;">
              Mengetahui,<br>
              Kepala Sekolah<br><br><br><br>
              <b>${lockWordData(id.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Kepala Sekolah')}</b><br>
              NIP. ${lockWordData(id.nipKepalaSekolah || '196709192008011008', 'NIP Kepala Sekolah')}
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              ${lockWordData(id.tempatPenetapan || 'Fatubai', 'Tempat')}, ${lockWordData(id.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 'Tanggal')}<br>
              ${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')}<br><br><br><br>
              <b>${lockWordData(id.namaGuru, 'Guru')}</b><br>
              NIP. ${lockWordData(id.nipGuru || '-', 'NIP Guru')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  downloadBlob(html, fileName, 'application/msword');
}

export function exportProtaToPDF(prota: ProtaDocument, layoutOptions?: Partial<PDFLayoutOptions>) {
  const layout = resolvePDFLayout(layoutOptions, 'portrait');
  const doc = new jsPDF({ orientation: layout.orientation, unit: 'mm', format: layout.format as any });
  const id = prota.identitas;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('PROGRAM TAHUNAN (PROTA)', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`KURIKULUM MERDEKA TAHUN PELAJARAN ${id.tahunPelajaran || '2025/2026'}`, pageWidth / 2, 24, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, 27, pageWidth - marginRight, 27);

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const metaStartY = 33;
  doc.text(`Satuan Pendidikan : ${id.namaSatuanPendidikan || 'SD Negeri Fatubai'}`, marginLeft, metaStartY);
  doc.text(`Mata Pelajaran    : ${id.mataPelajaran}`, marginLeft, metaStartY + 5);
  doc.text(`Fase / Kelas      : ${id.fase} / Kelas ${id.kelas}`, marginLeft, metaStartY + 10);

  doc.text(`Alokasi Regulasi  : ${prota.totalJPTahun} JP/Tahun (${prota.alokasiRegulasi.jpMingguIntra} JP/Mgg)`, pageWidth - marginRight, metaStartY, { align: 'right' });
  doc.text(`Penyusun          : ${id.namaGuru}`, pageWidth - marginRight, metaStartY + 5, { align: 'right' });
  doc.text(`Dasar Hukum       : Permendikdasmen No. 13 Thn 2025`, pageWidth - marginRight, metaStartY + 10, { align: 'right' });

  // Tabel Semester 1
  autoTable(doc, {
    startY: metaStartY + 15,
    head: [
      [{ content: 'SEMESTER 1 (GANJIL)', colSpan: 6, styles: { halign: 'left', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 11 } }],
      ['No', 'Kode TP', 'Elemen', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi', 'Alokasi'],
    ],
    body: [
      ...prota.itemsSemester1.map((it) => [
        it.nomor,
        it.kodeTP,
        it.elemen,
        it.tujuanPembelajaran,
        it.lingkupMateri,
        `${it.alokasiJP} JP`,
      ]),
      [{ content: `Subtotal Alokasi Semester 1: ${prota.summarySemester1.totalJPSemester} JP`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250], textColor: [0, 0, 0] } }],
    ],
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], font: 'times', fontStyle: 'bold', fontSize: 11, lineColor: [0, 0, 0], lineWidth: 0.25 },
    styles: { font: 'times', fontSize: 10.5, cellPadding: 2.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 34 },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
  });

  // Tabel Semester 2
  const finalY1 = (doc as any).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: finalY1,
    head: [
      [{ content: 'SEMESTER 2 (GENAP)', colSpan: 6, styles: { halign: 'left', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 11 } }],
      ['No', 'Kode TP', 'Elemen', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi', 'Alokasi'],
    ],
    body: [
      ...prota.itemsSemester2.map((it) => [
        it.nomor,
        it.kodeTP,
        it.elemen,
        it.tujuanPembelajaran,
        it.lingkupMateri,
        `${it.alokasiJP} JP`,
      ]),
      [{ content: `Subtotal Alokasi Semester 2: ${prota.summarySemester2.totalJPSemester} JP`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250], textColor: [0, 0, 0] } }],
      [{ content: `TOTAL ALOKASI TAHUNAN: ${prota.totalJPTahunAkumulasi} JP (Resmi Permendikdasmen No. 13 Tahun 2025)`, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] } }],
    ],
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], font: 'times', fontStyle: 'bold', fontSize: 11, lineColor: [0, 0, 0], lineWidth: 0.25 },
    styles: { font: 'times', fontSize: 10.5, cellPadding: 2.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 34 },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
  });

  const finalY2 = (doc as any).lastAutoTable.finalY + 8;
  const neededHeight = 62; // Keterangan box (21mm) + Spacing (4mm) + Signatures (35mm) + bottom buffer
  let startBlockY = finalY2;

  if (finalY2 + neededHeight > pageHeight - 15) {
    doc.addPage();
    startBlockY = 20;
  }

  // Box Keterangan & Catatan Pelaksanaan (wajib 1 halaman dengan tanda tangan)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, startBlockY, pageWidth - marginLeft - marginRight, 22, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('KETERANGAN & CATATAN PELAKSANAAN PROGRAM TAHUNAN (PROTA):', marginLeft + 4, startBlockY + 4.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`1. Alokasi waktu intrakurikuler berpedoman baku pada Permendikdasmen No. 13 Tahun 2025 dan ${getCpRegulationInfo(id.mataPelajaran).fullName}.`, marginLeft + 4, startBlockY + 8.5);
  doc.text('2. Sinkronisasi Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027 (SK No. 400.3/36/2026): Total 213 Hari Efektif (105 Sem 1 & 108 Sem 2).', marginLeft + 4, startBlockY + 12.5);
  doc.text('3. Alokasi JP dan alur pembelajaran dinamis sesuai asesmen diagnostik murid serta dinamika kalender satuan pendidikan.', marginLeft + 4, startBlockY + 16.5);
  doc.text('4. Ketercapaian kompetensi dievaluasi menggunakan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis pendekatan rubrik/interval nilai.', marginLeft + 4, startBlockY + 20.0);

  // Tanda Tangan pada halaman yang sama persis
  renderSignatures(doc, id, startBlockY + 27, pageWidth, marginLeft, marginRight);

  addDocumentPageNumbers(doc, `PROTA ${id.mataPelajaran} ${id.fase}`, marginLeft, marginRight);
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`PROTA_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.pdf`);
}

export function exportProtaToExcel(prota: ProtaDocument) {
  const id = prota.identitas;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `PROTA_Excel_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.csv`;

  const headers = ['No', 'Semester', 'Kode TP', 'Elemen', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi', 'Alokasi JP'];
  const rows: (string | number)[][] = [];

  prota.itemsSemester1.forEach((it) => {
    rows.push([it.nomor, 'Semester 1', `"${it.kodeTP}"`, `"${it.elemen}"`, `"${it.tujuanPembelajaran.replace(/"/g, '""')}"`, `"${it.lingkupMateri}"`, it.alokasiJP]);
  });

  prota.itemsSemester2.forEach((it) => {
    rows.push([it.nomor, 'Semester 2', `"${it.kodeTP}"`, `"${it.elemen}"`, `"${it.tujuanPembelajaran.replace(/"/g, '""')}"`, `"${it.lingkupMateri}"`, it.alokasiJP]);
  });

  const csvContent = [
    `"PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA"`,
    `"Mata Pelajaran: ${id.mataPelajaran} - Kelas ${id.kelas} (${id.fase})"`,
    `"Satuan Pendidikan: ${id.namaSatuanPendidikan || 'SD Negeri Fatubai'}"`,
    `"Regulasi: Permendikdasmen No. 13 Tahun 2025 (${prota.totalJPTahun} JP/Tahun)"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    `"Total JP Semester 1",,,,,,"${prota.summarySemester1.totalJPSemester}"`,
    `"Total JP Semester 2",,,,,,"${prota.summarySemester2.totalJPSemester}"`,
    `"Total Akumulasi Tahunan",,,,,,"${prota.totalJPTahunAkumulasi}"`,
  ].join('\n');

  downloadBlob(csvContent, fileName, 'text/csv');
}

// ==========================================
// 6. EXPORT DOKUMEN PROGRAM SEMESTER (PROMES)
// ==========================================

export function exportPromesToWord(promes: PromesDocument, semesterPilihan: '1' | '2' | 'all' = '1') {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const id = promes.identitas;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const semLabel = semesterPilihan === '2' ? 'Sem2' : semesterPilihan === 'all' ? 'Lengkap' : 'Sem1';
  const fileName = `PROMES_${semLabel}_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.doc`;

  const renderSemesterTable = (data: PromesSemesterData) => {
    // Bangun header kolom per bulan dan pekan
    const thBulan = data.bulanList
      .map((b) => `<th colspan="${b.weeks.length}" style="border: 1px solid #000; text-align: center; background-color: #e2e8f0; font-size: 11pt;">${b.namaBulan}</th>`)
      .join('');

    const thPekan = data.bulanList
      .flatMap((b) =>
        b.weeks.map(
          (w) =>
            `<th style="border: 1px solid #000; text-align: center; width: 18px; font-size: 11pt; background-color: ${w.isEfektif ? '#ffffff' : '#cbd5e1'};" title="${w.labelKegiatan || ''}">${w.mingguKe}</th>`
        )
      )
      .join('');

    const trRows = data.rows
      .map(
        (r) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 11pt;">${r.nomor}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 11pt;">${r.kodeTP}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 11pt;">${r.tujuanPembelajaran}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 11pt;">${r.lingkupMateri}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 11pt;">${r.alokasiJP}</td>
        ${data.bulanList
          .flatMap((b) =>
            b.weeks.map((w) => {
              const key = `${b.namaBulan}_${w.mingguKe}`;
              const val = r.distribusiMingguan[key];
              const bg = !w.isEfektif ? 'background-color: #cbd5e1;' : '';
              return `<td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 11pt; font-weight: bold; ${bg}">${val || ''}</td>`;
            })
          )
          .join('')}
      </tr>
    `
      )
      .join('');

    return `
      <div style="margin-top: 15px;">
        <h3 style="margin: 0 0 6px; font-size: 11pt; font-weight: bold; text-transform: uppercase;">${data.semesterLabel} (Alokasi: ${data.summary.totalJP} JP / ${data.summary.totalMingguEfektif} Minggu Efektif)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th rowspan="2" style="border: 1px solid #000; width: 3%;">No</th>
              <th rowspan="2" style="border: 1px solid #000; width: 7%;">Kode</th>
              <th rowspan="2" style="border: 1px solid #000; width: 30%;">Tujuan Pembelajaran (TP)</th>
              <th rowspan="2" style="border: 1px solid #000; width: 18%;">Lingkup Materi</th>
              <th rowspan="2" style="border: 1px solid #000; width: 5%;">JP</th>
              ${thBulan}
            </tr>
            <tr>
              ${thPekan}
            </tr>
          </thead>
          <tbody>
            ${trRows}
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #000; text-align: right; padding: 6px;">Total Jam Tatap Muka:</td>
              <td style="border: 1px solid #000; text-align: center; padding: 6px;">${data.summary.totalJP}</td>
              <td colspan="26" style="border: 1px solid #000; text-align: center; font-size: 11pt; color: #475569;">Terdistribusi Merata Berdasarkan Alokasi Permendikdasmen No. 13 Tahun 2025</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Program Semester (PROMES) - ${id.mataPelajaran}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 16px; font-size: 11pt; line-height: 1.5; }
        th { border: 1px solid #000; padding: 5px; font-size: 11pt; text-align: center; line-height: 1.5; }
        td { border: 1px solid #000; padding: 4px; font-size: 11pt; vertical-align: middle; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div style="text-align: center; border-bottom: 2.5px double #000; padding-bottom: 8px; margin-bottom: 14px;">
        <h2 style="margin: 0; font-size: 11pt; text-transform: uppercase; font-weight: bold;">PROGRAM SEMESTER (PROMES) KURIKULUM MERDEKA</h2>
        <p style="margin: 3px 0 0; font-size: 11pt; font-weight: bold;">TAHUN PELAJARAN ${lockWordData(id.tahunPelajaran || '2025/2026', 'Tahun')} - ${lockWordData(id.namaSatuanPendidikan || 'SD NEGERI FATUBAI', 'Sekolah')}</p>
      </div>

      <table style="width: 100%; border: none; margin-bottom: 10px;">
        <tr>
          <td style="border: none; width: 18%; font-weight: bold;">Mata Pelajaran</td>
          <td style="border: none; width: 2%;">:</td>
          <td style="border: none; width: 35%;">${lockWordData(id.mataPelajaran, 'Mata Pelajaran')}</td>
          <td style="border: none; width: 18%; font-weight: bold;">Fase / Kelas</td>
          <td style="border: none; width: 2%;">:</td>
          <td style="border: none;">${lockWordData(id.fase, 'Fase')} / Kelas ${lockWordData(String(id.kelas), 'Kelas')}</td>
        </tr>
        <tr>
          <td style="border: none; font-weight: bold;">Alokasi JP / Pekan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">${promes.jpMinggu} JP / Minggu</td>
          <td style="border: none; font-weight: bold;">Penyusun</td>
          <td style="border: none;">:</td>
          <td style=\"border: none;\">${lockWordData(id.namaGuru, 'Guru')}</td>
        </tr>
      </table>

      ${semesterPilihan === '2' ? renderSemesterTable(promes.semester2) : semesterPilihan === 'all' ? renderSemesterTable(promes.semester1) + '<br>' + renderSemesterTable(promes.semester2) : renderSemesterTable(promes.semester1)}

      <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 18px;">
        <div style="border: 1px solid #94a3b8; background-color: #f8fafc; padding: 10px 14px; margin-bottom: 12px; font-size: 11pt; font-family: 'Times New Roman', serif;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #0f172a;">KETERANGAN &amp; CATATAN PELAKSANAAN PROGRAM SEMESTER (PROMES):</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155;">
            <li style="margin-bottom: 2px;"><b>Distribusi Waktu &amp; Alokasi JP:</b> Distribusi tatap muka mingguan berpedoman pada alokasi intrakurikuler Permendikdasmen No. 13 Tahun 2025 (${promes.jpMinggu} JP/Minggu) sesuai kalender akademik semester ${semesterPilihan === '2' ? '2 (Genap)' : '1 (Ganjil)'}.</li>
            <li style="margin-bottom: 2px;"><b>Sinkronisasi Kaldik TTU 2026/2027:</b> Berpedoman pada SK Kadis Dikbud Kab. Timor Tengah Utara No. 400.3/36/2026, memperhitungkan ${semesterPilihan === '2' ? '108 Hari Efektif di Semester 2' : '105 Hari Efektif di Semester 1'} (total 213 Hari Efektif Sekolah / 18 Minggu Efektif Intrakurikuler per semester).</li>
            <li style="margin-bottom: 2px;"><b>Asesmen &amp; Agenda Daerah:</b> Telah mengantisipasi jadwal resmi Sumatif Tengah Semester (STS 1 / STS 2), SAS/SAT, perkiraan TKA SD, Ujian Sekolah (US), serta hari efektif fakultatif keagamaan daerah (Hari Arwah, Rabu Abu, Kamis Putih).</li>
            <li><b>Pembelajaran Berdiferensiasi:</b> Jam cadangan dialokasikan untuk penguatan materi esensial, bimbingan remedial, dan pengayaan kompetensi murid.</li>
          </ul>
        </div>

        <table style="border: none; width: 100%;">
          <tr>
            <td style="border: none; width: 50%; vertical-align: top;">
              Mengetahui,<br>
              Kepala Sekolah<br><br><br><br>
              <b>${lockWordData(id.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Kepala Sekolah')}</b><br>
              NIP. ${lockWordData(id.nipKepalaSekolah || '196709192008011008', 'NIP')}
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              ${lockWordData(id.tempatPenetapan || 'Fatubai', 'Tempat')}, ${lockWordData(id.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 'Tanggal')}<br>
              ${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')}<br><br><br><br>
              <b>${lockWordData(id.namaGuru, 'Guru')}</b><br>
              NIP. ${lockWordData(id.nipGuru || '-', 'NIP')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  downloadBlob(html, fileName, 'application/msword');
}

export function exportPromesToPDF(promes: PromesDocument, semesterPilihan: '1' | '2' = '1', layoutOptions?: Partial<PDFLayoutOptions>) {
  const layout = resolvePDFLayout(layoutOptions, 'landscape');
  const doc = new jsPDF({ orientation: layout.orientation, unit: 'mm', format: layout.format as any });
  const id = promes.identitas;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = layout.marginLeft;
  const marginRight = layout.marginRight;
  const marginTop = layout.marginTop;
  const marginBottom = layout.marginBottom;
  const data = semesterPilihan === '2' ? promes.semester2 : promes.semester1;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(`PROGRAM SEMESTER (PROMES) - ${data.semesterLabel.toUpperCase()}`, pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`KURIKULUM MERDEKA TAHUN PELAJARAN ${id.tahunPelajaran || '2025/2026'}`, pageWidth / 2, 19, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, 22, pageWidth - marginRight, 22);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Satuan Pendidikan : ${id.namaSatuanPendidikan || 'SD Negeri Fatubai'}`, marginLeft, 27);
  doc.text(`Mata Pelajaran    : ${id.mataPelajaran} (${id.fase} - Kelas ${id.kelas})`, marginLeft, 31);
  doc.text(`Alokasi Waktu     : ${promes.jpMinggu} JP/Minggu | Total: ${data.summary.totalJP} JP (${data.summary.totalMingguEfektif} Minggu Efektif)`, pageWidth - marginRight, 27, { align: 'right' });
  doc.text(`Penyusun          : ${id.namaGuru}`, pageWidth - marginRight, 31, { align: 'right' });

  // Susun kolom tabel landscape
  const tableHeadersRow1: any[] = [
    { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Kode', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Tujuan Pembelajaran (TP)', rowSpan: 2, styles: { valign: 'middle' } },
    { content: 'Lingkup Materi', rowSpan: 2, styles: { valign: 'middle' } },
    { content: 'JP', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
  ];

  const tableHeadersRow2: any[] = [];

  data.bulanList.forEach((b) => {
    tableHeadersRow1.push({ content: b.namaBulan, colSpan: b.weeks.length, styles: { halign: 'center', fillColor: [241, 245, 249] } });
    b.weeks.forEach((w) => {
      tableHeadersRow2.push({ content: String(w.mingguKe), styles: { halign: 'center', fontSize: 7, fillColor: w.isEfektif ? [255, 255, 255] : [226, 232, 240] } });
    });
  });

  const bodyRows = data.rows.map((r) => {
    const rowCells: any[] = [r.nomor, r.kodeTP, r.tujuanPembelajaran, r.lingkupMateri, `${r.alokasiJP}`];
    data.bulanList.forEach((b) => {
      b.weeks.forEach((w) => {
        const key = `${b.namaBulan}_${w.mingguKe}`;
        const val = r.distribusiMingguan[key];
        rowCells.push({
          content: val ? String(val) : '',
          styles: { halign: 'center', fontStyle: 'bold', fillColor: !w.isEfektif ? [241, 245, 249] : undefined },
        });
      });
    });
    return rowCells;
  });

  autoTable(doc, {
    startY: 35,
    head: [tableHeadersRow1, tableHeadersRow2],
    body: bodyRows,
    theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    headStyles: { font: 'times', fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    styles: { font: 'times', fontSize: 7, cellPadding: 1.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 68 },
      3: { cellWidth: 38 },
      4: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const neededHeight = 56; // Keterangan box (18mm) + Spacing (4mm) + Signatures (32mm) + bottom buffer
  let startBlockY = finalY;

  if (finalY + neededHeight > pageHeight - 12) {
    doc.addPage(layout.format as any, layout.orientation);
    startBlockY = 16;
  }

  // Box Keterangan & Catatan Pelaksanaan (wajib 1 halaman dengan tanda tangan)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, startBlockY, pageWidth - marginLeft - marginRight, 20, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('KETERANGAN & CATATAN PELAKSANAAN PROGRAM SEMESTER (PROMES):', marginLeft + 4, startBlockY + 4);

  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`1. Distribusi jam tatap muka intrakurikuler berpedoman pada alokasi Permendikdasmen No. 13/2025 (${promes.jpMinggu} JP/Minggu).`, marginLeft + 4, startBlockY + 7.8);
  doc.text(`2. Disinkronkan dengan Kalender Pendidikan Kab. Timor Tengah Utara TA 2026/2027 (SK Kadis Dikbud TTU No. 400.3/36/2026): ${semesterPilihan === '2' ? '108 Hari Efektif Sem 2' : '105 Hari Efektif Sem 1'}.`, marginLeft + 4, startBlockY + 11.2);
  doc.text('3. Penjadwalan telah mengantisipasi pekan STS, SAS/SAT, perkiraan TKA, Ujian Sekolah (US), P5, dan hari efektif fakultatif keagamaan.', marginLeft + 4, startBlockY + 14.6);
  doc.text('4. Jam cadangan dimanfaatkan secara adaptif untuk pembelajaran berdiferensiasi serta bimbingan remedial dan pengayaan.', marginLeft + 4, startBlockY + 18.0);

  // Tanda Tangan pada halaman yang sama persis
  renderSignatures(doc, id, startBlockY + 25, pageWidth, marginLeft, marginRight);

  addDocumentPageNumbers(doc, `PROMES ${id.mataPelajaran} ${id.fase} ${data.semesterLabel}`, marginLeft, marginRight);
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`PROMES_Sem${semesterPilihan}_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.pdf`);
}

export function exportPromesToExcel(promes: PromesDocument, semesterPilihan: '1' | '2' = '1') {
  const id = promes.identitas;
  const data = semesterPilihan === '2' ? promes.semester2 : promes.semester1;
  const kelasSlug = id.kelas ? `_Kelas_${String(id.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `PROMES_Excel_Sem${semesterPilihan}_${id.mataPelajaran || 'Mapel'}_${id.fase || 'Fase'}${kelasSlug}.csv`;

  const weekHeaders: string[] = [];
  data.bulanList.forEach((b) => {
    b.weeks.forEach((w) => {
      weekHeaders.push(`"${b.namaBulan} M${w.mingguKe}"`);
    });
  });

  const headers = ['No', 'Kode TP', 'Elemen', 'Tujuan Pembelajaran (TP)', 'Lingkup Materi', 'Alokasi JP', ...weekHeaders];

  const rows = data.rows.map((r) => {
    const weekValues: (string | number)[] = [];
    data.bulanList.forEach((b) => {
      b.weeks.forEach((w) => {
        const key = `${b.namaBulan}_${w.mingguKe}`;
        weekValues.push(r.distribusiMingguan[key] || '');
      });
    });
    return [
      r.nomor,
      `"${r.kodeTP}"`,
      `"${r.elemen}"`,
      `"${r.tujuanPembelajaran.replace(/"/g, '""')}"`,
      `"${r.lingkupMateri}"`,
      r.alokasiJP,
      ...weekValues,
    ];
  });

  const csvContent = [
    `"PROGRAM SEMESTER (PROMES) KURIKULUM MERDEKA - ${data.semesterLabel.toUpperCase()}"`,
    `"Mata Pelajaran: ${id.mataPelajaran} - Kelas ${id.kelas} (${id.fase})"`,
    `"Satuan Pendidikan: ${id.namaSatuanPendidikan || 'SD Negeri Fatubai'}"`,
    `"Alokasi Regulasi: ${promes.jpMinggu} JP/Minggu"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  downloadBlob(csvContent, fileName, 'text/csv');
}

/**
 * Ekspor Dokumen Bank Prompt Media Pembelajaran (Komik & Infografis 3D Pixar/Disney) ke Microsoft Word (.doc)
 */
export function exportMediaPromptsToWord(
  doc: MediaPromptDocument,
  options?: { selectedKelas?: string; filterType?: 'all' | 'video' | 'slide' | 'notebook' | 'flashcard' | 'infografis' | 'petakonsep' | 'komik' }
): void {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const id = doc.identitas;
  const filteredItems = options?.selectedKelas && options.selectedKelas !== 'all'
    ? doc.items.filter(item => String(item.kelas) === String(options.selectedKelas))
    : doc.items;

  const kelasLabel = options?.selectedKelas && options.selectedKelas !== 'all'
    ? `Kelas ${options.selectedKelas}`
    : id.fase || 'Fase B';

  const filterType = options?.filterType || 'all';

  const itemsHtml = filteredItems.map((item, idx) => {
    const showVideo = (filterType === 'all' || filterType === 'video') && Boolean(item.video);
    const showSlide = filterType === 'all' || filterType === 'slide';
    const showNotebook = filterType === 'all' || filterType === 'notebook';
    const showFlashcard = filterType === 'all' || filterType === 'flashcard';
    const showInfo = filterType === 'all' || filterType === 'infografis';
    const showMindMap = (filterType === 'all' || filterType === 'petakonsep') && Boolean(item.petakonsep);
    const showKomik = (filterType === 'all' || filterType === 'komik') && Boolean(item.komik);

    const slideRowsHtml = item.slide ? item.slide.slides.map(s => `
      <tr style="border-bottom: 1px solid #CBD5E1;">
        <td style="padding: 6px 8px; font-weight: bold; background-color: #F8FAFC; width: 14%; vertical-align: top; font-size: 11pt;">
          Slide ${s.slideNumber}:<br><span style="font-size: 11pt; color: #475569;">${s.slideTitle}</span>
        </td>
        <td style="padding: 6px 8px; vertical-align: top; width: 36%; font-size: 11pt;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #1E3A8A;">${s.headline}</p>
          <ul style="margin: 0; padding-left: 14px; font-size: 11pt; color: #334155;">
            ${s.bulletPoints.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </td>
        <td style="padding: 6px 8px; vertical-align: top; width: 25%; font-size: 11pt; color: #475569; background-color: #F8FAFC;">
          ${s.visualIllustrationPrompt}
        </td>
        <td style="padding: 6px 8px; vertical-align: top; width: 25%; background-color: #EFF6FF; font-size: 11pt; color: #1E40AF;">
          <strong>Tips Guru:</strong> ${s.teacherInteractionGuide}
        </td>
      </tr>
    `).join('') : '';

    const notebookSectionsHtml = item.notebook ? item.notebook.notebookSections.map(ns => `
      <div style="margin-bottom: 8px; padding: 8px 10px; background-color: #FDF4FF; border-left: 3px solid #A855F7; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #7E22CE; font-size: 11pt;">${ns.sectionTitle}</p>
        <p style="margin: 0 0 4px 0; font-size: 11pt; color: #334155;"><strong>Panduan:</strong> ${ns.guidedQuestionsOrPrompts.join(' • ')}</p>
        <p style="margin: 0 0 4px 0; font-size: 11pt; color: #475569; font-style: italic;"><strong>Catatan Doodle:</strong> ${ns.summaryDoodleNote}</p>
        <p style="margin: 0; font-size: 11pt; color: #9333EA;"><strong>Aktivitas Murid:</strong> ${ns.interactiveActivity}</p>
      </div>
    `).join('') : '';

    const flashcardsHtml = item.flashcard ? item.flashcard.cards.map(c => `
      <tr style="border-bottom: 1px solid #CBD5E1;">
        <td style="padding: 6px 8px; font-weight: bold; background-color: #FFFBEB; width: 14%; vertical-align: top; font-size: 11pt; color: #B45309;">
          Kartu ${c.cardNumber}:<br>${c.category}
        </td>
        <td style="padding: 6px 8px; vertical-align: top; width: 43%; font-size: 11pt;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #0F172A;">[SISI DEPAN] ${c.frontSide.title}</p>
          <p style="margin: 0 0 4px 0;">${c.frontSide.questionOrChallenge}</p>
          <p style="margin: 0; font-size: 11pt; color: #B45309; font-style: italic;">Petunjuk: ${c.frontSide.hint}</p>
        </td>
        <td style="padding: 6px 8px; vertical-align: top; width: 43%; font-size: 11pt; background-color: #ECFDF5;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #065F46;">[SISI BELAKANG] Jawaban Tepat:</p>
          <p style="margin: 0 0 4px 0; color: #047857;">${c.backSide.answer}</p>
          <p style="margin: 0 0 4px 0; font-size: 11pt; color: #334155;">${c.backSide.simpleExplanation}</p>
          <p style="margin: 0; font-size: 11pt; color: #059669; font-weight: bold;">${c.backSide.funFactOrMotto}</p>
        </td>
      </tr>
    `).join('') : '';

    const infoSectionsHtml = item.infografis.sections.map(s => `
      <div style="margin-bottom: 8px; padding: 8px; background-color: #F8FAFC; border-left: 3px solid #0284C7; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #0369A1; font-size: 11pt;">${s.heading}</p>
        <ul style="margin: 0 0 4px 16px; padding: 0; font-size: 11pt;">
          ${s.keyPoints.map(pt => `<li>${pt}</li>`).join('')}
        </ul>
        ${s.didYouKnowOrCallout ? `<p style="margin: 0; font-size: 11pt; color: #D97706; font-style: italic;">★ ${s.didYouKnowOrCallout}</p>` : ''}
      </div>
    `).join('');

    return `
      <div style="margin-bottom: 24px; padding: 16px; border: 1.5pt solid #CBD5E1; border-radius: 8px; background-color: #FFFFFF; page-break-inside: avoid;">
        <div style="background-color: #0F172A; color: #FFFFFF; padding: 10px 14px; border-radius: 6px 6px 0 0; margin: -16px -16px 14px -16px;">
          <table style="width: 100%; border-collapse: collapse; color: #FFFFFF;">
            <tr>
              <td style="font-weight: bold; font-size: 11pt;">${idx + 1}. [${item.kodeTP}] ${item.lingkupMateri}</td>
              <td style="text-align: right; font-size: 11pt; color: #FCD34D;">Kelas ${item.kelas} • ${item.fase}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 11pt;"><strong>Rumusan Tujuan Pembelajaran (TP):</strong><br><em>${item.rumusanTP}</em></p>
        <p style="margin: 0 0 12px 0; font-size: 11pt; color: #475569;"><strong>Kompetensi Kunci:</strong> ${item.kompetensi} | <strong>Elemen:</strong> ${item.elemen || id.mataPelajaran}</p>

        ${showVideo && item.video ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #E11D48;">VIDEO PEMBELAJARAN 3D (${item.video.sceneVideos.length} ADEGAN @8 DETIK &amp; KARAKTER KONSISTEN - ${item.video.recommendedAspectRatio || '16:9 Landscape'})</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Gaya: 3D Pixar-inspired animation • Rasio: ${item.video.recommendedAspectRatio || '16:9 Landscape'} • Tiga Lapisan: Aset Karakter + Keyframe Gambar + Video &amp; Dialog Ringkas (Bebas Terpotong)</em></p>
            
            <p style="margin: 10px 0 4px 0; font-weight: bold; font-size: 11pt; color: #BE123C;">BAGIAN 1: ASET KARAKTER REFERENSI (KONSISTENSI FISIK MUTLAK):</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #FFE4E6; text-align: left;">
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 22%; color: #9F1239;">Karakter &amp; Peran</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 38%; color: #9F1239;">Ciri Fisik Konsisten</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 40%; color: #9F1239;">Busana &amp; Perlengkapan</th>
                </tr>
              </thead>
              <tbody>
                ${item.video.characterAssets.map(c => `
                  <tr style="border-bottom: 1px solid #CBD5E1;">
                    <td style="padding: 6px 8px; vertical-align: top; font-weight: bold; background-color: #FFF1F2;">
                      ${c.name}<br><span style="font-size: 10pt; color: #64748B; font-weight: normal;">${c.role}</span>
                    </td>
                    <td style="padding: 6px 8px; vertical-align: top;">${c.physicalTraits}</td>
                    <td style="padding: 6px 8px; vertical-align: top;">${c.attire}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <p style="margin: 10px 0 4px 0; font-weight: bold; font-size: 11pt; color: #BE123C;">BAGIAN 2 &amp; 3: ${item.video.sceneVideos.length} ADEGAN LENGKAP @8 DETIK (GAMBAR KEYFRAME, VIDEO &amp; DIALOG RINGKAS - ${item.video.recommendedAspectRatio || '16:9 Landscape'}):</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #FFE4E6; text-align: left;">
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 18%; color: #9F1239;">Adegan &amp; Durasi</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 42%; color: #9F1239;">Visual Aksi &amp; Kamera (Scene Video)</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 40%; color: #9F1239;">Naskah Dialog (100% Bahasa Indonesia)</th>
                </tr>
              </thead>
              <tbody>
                ${item.video.sceneVideos.map((sv, sIdx) => {
                  const si = item.video.sceneImages[sIdx];
                  return `
                    <tr style="border-bottom: 1px solid #CBD5E1;">
                      <td style="padding: 6px 8px; vertical-align: top; font-weight: bold; background-color: #FFF1F2;">
                        Adegan ${sv.sceneNumber}:<br><span style="font-size: 10pt; color: #64748B; font-weight: normal;">${si ? si.durationEstimate : '8 detik'}</span><br>
                        <span style="font-size: 9.5pt; color: #BE123C;">Tokoh: ${sv.characters}</span>
                      </td>
                      <td style="padding: 6px 8px; vertical-align: top;">
                        <p style="margin: 0 0 4px 0;"><strong>Aksi:</strong> ${sv.action}</p>
                        <p style="margin: 0; color: #475569; font-size: 10pt;"><strong>Kamera:</strong> ${sv.camera}</p>
                      </td>
                      <td style="padding: 6px 8px; vertical-align: top; background-color: #F8FAFC;">
                        <p style="margin: 0; font-style: italic; color: #0F172A;">${sv.dialogue.replace(/\|/g, '<br><br>')}</p>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Lengkap Video AI (Runway / Kling / Luma / Sora):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.video.fullPromptVideoAI}</pre>
            </div>

            <div style="background-color: #FFF1F2; border-left: 3px solid #F43F5E; padding: 8px 12px; border-radius: 4px; font-size: 11pt; color: #9F1239;">
              <strong>Pedoman Guru di Kelas:</strong><br>${item.video.pedomanGuruIndo.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        ${showSlide && item.slide ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #1E3A8A;">1. MEDIA SLIDE PRESENTASI EDUKATIF (${item.slide.totalSlides} SLIDE - BAHASA RAMAH ANAK)</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Format 16:9 Widescreen untuk Gamma App, Canva, atau PowerPoint AI. Ilustrasi 3D Pixar anak SD berseragam merah putih.</em></p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #F1F5F9; text-align: left;">
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 14%;">Slide</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 36%;">Teks Utama (Ramah Anak)</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 25%;">Visual 3D</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 25%;">Panduan Guru</th>
                </tr>
              </thead>
              <tbody>
                ${slideRowsHtml}
              </tbody>
            </table>

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Lengkap Generator Slide AI (Gamma / Canva / PPT):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.slide.fullPromptPresentationAI}</pre>
            </div>

            <div style="background-color: #EFF6FF; border-left: 3px solid #3B82F6; padding: 8px 12px; border-radius: 4px; font-size: 11pt; color: #1E40AF;">
              <strong>Pedoman Guru di Kelas:</strong><br>${item.slide.pedomanGuruIndo.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        ${showNotebook && item.notebook ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #7E22CE;">2. BUKU CATATAN & JURNAL BELAJAR INTERAKTIF (NOTEBOOKLM & CATATAN SISWA)</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Jurnal interaktif untuk NotebookLM, Google Docs, atau buku catatan siswa.</em></p>
            
            ${notebookSectionsHtml}

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px; margin-top: 8px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Sumber Notebook AI (NotebookLM / Docs):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.notebook.fullPromptNotebookAI}</pre>
            </div>
          </div>
        ` : ''}

        ${showFlashcard && item.flashcard ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #D97706;">3. FLASHCARD PINTAR (${item.flashcard.totalCards} KARTU BOLAK-BALIK TANYA JAWAB)</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Format kartu pintar untuk Canva Flashcard Maker, Quizlet, atau cetak peraga.</em></p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #F1F5F9; text-align: left;">
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 14%;">Kartu</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 43%;">Sisi Depan (Tantangan &amp; Hint)</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 43%;">Sisi Belakang (Kunci &amp; Penjelasan)</th>
                </tr>
              </thead>
              <tbody>
                ${flashcardsHtml}
              </tbody>
            </table>

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Generator Flashcard (Canva / Quizlet):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.flashcard.fullPromptFlashcardAI}</pre>
            </div>
          </div>
        ` : ''}

        ${showInfo ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #0284C7;">4. BAHAN AJAR INFOGRAFIS EDUKATIF 1 HALAMAN</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Poster visual 1 halaman terstruktur dengan ilustrasi maskot 3D Pixar anak SD Indonesia.</em></p>
            
            ${infoSectionsHtml}

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Lengkap Generator AI Gambar (English - Ready to Copy):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.infografis.fullEnglishPrompt}</pre>
            </div>

            <div style="background-color: #EFF6FF; border-left: 3px solid #3B82F6; padding: 8px 12px; border-radius: 4px; font-size: 11pt; color: #1E40AF;">
              <strong>Pedoman Guru di Kelas:</strong><br>${item.infografis.pedomanGuruIndo.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        ${showMindMap && item.petakonsep ? `
          <div style="margin-top: 14px; border-top: 2px dashed #CBD5E1; padding-top: 12px;">
            <h4 style="margin: 0 0 6px 0; font-size: 11pt; color: #059669;">5. PETA KONSEP & PETA PIKIRAN (MIND MAP EDUKATIF)</h4>
            <p style="margin: 0 0 8px 0; font-size: 11pt; color: #64748B;"><em>Topik Pusat: <strong>${item.petakonsep.centralTheme}</strong> • Metafora Visual: ${item.petakonsep.centralVisualMetaphor}</em></p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">
              <thead>
                <tr style="background-color: #ECFDF5; text-align: left;">
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 25%; color: #065F46;">Cabang &amp; Kata Hubung</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 45%; color: #065F46;">Sub-Cabang Konsep Kunci</th>
                  <th style="padding: 6px; border-bottom: 2px solid #CBD5E1; width: 30%; color: #065F46;">Ikon 3D &amp; Misi Tantangan</th>
                </tr>
              </thead>
              <tbody>
                ${item.petakonsep.branches.map(b => `
                  <tr style="border-bottom: 1px solid #CBD5E1;">
                    <td style="padding: 6px 8px; vertical-align: top; font-weight: bold; background-color: #F8FAFC;">
                      <span style="color: ${b.branchColor}; font-size: 11pt;">${b.branchName}</span><br>
                      <span style="font-size: 11pt; color: #475569; font-style: italic;">Frasa hubung: "${b.connectingPhrase}"</span>
                    </td>
                    <td style="padding: 6px 8px; vertical-align: top;">
                      <ul style="margin: 0; padding-left: 14px; color: #334155; font-size: 11pt;">
                        ${b.subBranches.map(sub => `<li>${sub}</li>`).join('')}
                      </ul>
                    </td>
                    <td style="padding: 6px 8px; vertical-align: top; background-color: #F8FAFC; font-size: 11pt;">
                      <strong>Ikon:</strong> ${b.visualDoodle}<br>
                      <strong style="color: #B45309;">Tantangan:</strong> <em>"${b.miniChallenge}"</em>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt; color: #1E293B; text-transform: uppercase;">Prompt Lengkap Generator Mind Map AI (GitMind / Canva / Gemini):</p>
              <pre style="margin: 0; font-family: Consolas, monospace; font-size: 11pt; white-space: pre-wrap; background: #0F172A; color: #E2E8F0; padding: 10px; border-radius: 4px;">${item.petakonsep.fullPromptMindMapAI}</pre>
            </div>

            <div style="background-color: #ECFDF5; border-left: 3px solid #10B981; padding: 8px 12px; border-radius: 4px; font-size: 11pt; color: #065F46;">
              <strong>Pedoman Guru di Kelas:</strong><br>${item.petakonsep.pedomanGuruIndo.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Bank Prompt Media Pembelajaran</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #1E293B; }
        h1, h2, h3, h4 { color: #0F172A; }
        @page { size: A4 portrait; margin: 2cm; }
      </style>
    </head>
    <body>
      <div style="text-align: center; border-bottom: 2pt solid #0F172A; padding-bottom: 12px; margin-bottom: 18px;">
        <h2 style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">BANK PROMPT MEDIA AJAR DIGITAL MULTI-FORMAT</h2>
        <h3 style="margin: 4px 0; font-size: 11pt; color: #475569;">SLIDE PRESENTASI • NOTEBOOK DIGITAL • FLASHCARD PINTAR • INFOGRAFIS • PETA KONSEP / PIKIRAN</h3>
        <p style="margin: 0; font-size: 11pt; color: #64748B;">Mata Pelajaran: ${id.mataPelajaran || 'Matematika'} • ${kelasLabel} • Tahun Pelajaran ${id.tahunPelajaran || '2026/2027'}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11pt; border: 1px solid #CBD5E1;">
        <tr style="background-color: #F8FAFC;">
          <td style="padding: 6px 12px; width: 25%; font-weight: bold;">Satuan Pendidikan</td>
          <td style="padding: 6px 12px; width: 25%;">${lockWordData(id.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Nama Satuan Pendidikan')}</td>
          <td style="padding: 6px 12px; width: 25%; font-weight: bold;">Penyusun</td>
          <td style="padding: 6px 12px; width: 25%;">${lockWordData(id.namaGuru || 'Penyusun', 'Nama Penyusun')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Fase / Kelas</td>
          <td style="padding: 6px 12px;">${id.fase} / ${kelasLabel}</td>
          <td style="padding: 6px 12px; font-weight: bold;">Kepala Sekolah</td>
          <td style="padding: 6px 12px;">${lockWordData(id.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Nama Kepala Sekolah')}</td>
        </tr>
      </table>

      <div style="background-color: #FEF2F2; border: 2px solid #EF4444; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px;">
        <p style="margin: 0 0 4px 0; color: #991B1B; font-weight: bold; font-size: 11pt; text-transform: uppercase;">
          ⚠️ PENEGASAN MUTLAK BAHASA MEDIA AJAR:
        </p>
        <p style="margin: 0; color: #7F1D1D; font-size: 11pt; line-height: 1.4;">
          Sekalipun prompt AI disusun dalam Bahasa Inggris agar model generator memahami detail teknis 3D dan pencahayaan secara optimal, <strong>SELURUH TEKS MEDIA AJAR WAJIB MENGGUNAKAN BAHASA INDONESIA YANG RAMAH ANAK</strong>. Dilarang keras menggunakan bahasa asing pada teks slide, kartu flashcard, maupun buku catatan siswa!
        </p>
      </div>

      ${itemsHtml}

      <div style="page-break-inside: avoid; margin-top: 24px; padding-top: 12px; border-top: 1pt solid #CBD5E1;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0; font-weight: bold;">Kepala Sekolah</p>
              <div style="height: 60px;"></div>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${lockWordData(id.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 'Nama Kepala Sekolah')}</p>
              <p style="margin: 0; font-size: 11pt; color: #475569;">NIP. ${lockWordData(id.nipKepalaSekolah || '196709192008011008', 'NIP Kepala Sekolah')}</p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <p style="margin: 0;">${id.tempatPenetapan || 'Fatubai'}, ${id.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 0; font-weight: bold;">${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')}</p>
              <div style="height: 60px;"></div>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${lockWordData(id.namaGuru || 'Penyusun', 'Nama Penyusun')}</p>
              <p style="margin: 0; font-size: 11pt; color: #475569;">NIP. ${lockWordData(id.nipGuru || '-', 'NIP Guru')}</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const fileName = `Prompt_Media_${id.mataPelajaran || 'Mapel'}_${kelasLabel.replace(/\s+/g, '_')}.doc`;
  downloadBlob(wordHtml, fileName, 'application/msword');
}

/**
 * Ekspor Dokumen Bank Prompt Media Pembelajaran ke format PDF
 */
export function exportMediaPromptsToPDF(
  doc: MediaPromptDocument,
  options?: { selectedKelas?: string; filterType?: 'all' | 'video' | 'slide' | 'notebook' | 'flashcard' | 'infografis' | 'petakonsep' | 'komik' },
  layoutOptions?: PDFLayoutOptions
): void {
  const id = doc.identitas;
  const filteredItems = options?.selectedKelas && options.selectedKelas !== 'all'
    ? doc.items.filter(item => String(item.kelas) === String(options.selectedKelas))
    : doc.items;

  const kelasLabel = options?.selectedKelas && options.selectedKelas !== 'all'
    ? `Kelas ${options.selectedKelas}`
    : id.fase || 'Fase B';

  const filterType = options?.filterType || 'all';

  const orientation = layoutOptions?.orientation || 'portrait';
  const paperSize = layoutOptions?.paperSize || 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let currentY = 18;

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(0, 0, 0);
  pdf.text('BANK PROMPT MEDIA AJAR DIGITAL MULTI-FORMAT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Video 3D • Slide Presentasi • Notebook Digital • Flashcard Pintar • Infografis • Peta Konsep', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  pdf.text(`Mata Pelajaran: ${id.mataPelajaran || 'Matematika'} • ${kelasLabel} • ${id.namaSatuanPendidikan || 'SD Negeri Fatubai'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  // Penegasan Mutlak Bahasa Indonesia Box
  pdf.setFillColor(245, 245, 245);
  pdf.setDrawColor(0, 0, 0);
  pdf.roundedRect(14, currentY, pageWidth - 28, 12, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PENEGASAN: SELURUH TEKS MEDIA WAJIB 100% BAHASA INDONESIA RAMAH ANAK!', 18, currentY + 4.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Bahasa sederhana, komunikatif, dan memicu rasa ingin tahu siswa SD Indonesia.', 18, currentY + 8.5);
  currentY += 15;

  // Render each item
  filteredItems.forEach((item, idx) => {
    // Check page height
    if (currentY > 240) {
      pdf.addPage();
      currentY = 18;
    }

    // Title banner
    pdf.setFillColor(240, 240, 240);
    pdf.setDrawColor(0, 0, 0);
    pdf.roundedRect(14, currentY, pageWidth - 28, 8, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${idx + 1}. [${item.kodeTP}] ${item.lingkupMateri} (Kelas ${item.kelas})`, 18, currentY + 5.5);
    currentY += 11;

    // TP Description
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    const tpLines = pdf.splitTextToSize(`Tujuan Pembelajaran: ${item.rumusanTP}`, pageWidth - 28);
    pdf.text(tpLines, 14, currentY);
    currentY += tpLines.length * 3.8 + 4;

    // 0. Video Pembelajaran 3D
    if ((filterType === 'all' || filterType === 'video') && item.video) {
      if (currentY > 220) {
        pdf.addPage();
        currentY = 18;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`VIDEO PEMBELAJARAN 3D (${item.video.sceneVideos.length} ADEGAN @8 DETIK & KARAKTER KONSISTEN - ${item.video.recommendedAspectRatio || '16:9 Landscape'})`, 14, currentY);
      currentY += 4;

      const charRows = item.video.characterAssets.map(c => [
        `${c.name}\n(${c.role})`,
        `${c.physicalTraits}`,
        `${c.attire}`,
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Karakter & Peran', 'Ciri Fisik Wajib Konsisten', 'Busana & Perlengkapan']],
        body: charRows,
        theme: 'grid',
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 80 },
          2: { cellWidth: 68 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 4;

      if (currentY > 220) {
        pdf.addPage();
        currentY = 18;
      }

      const sceneRows = item.video.sceneVideos.map((sv, sIdx) => {
        const si = item.video.sceneImages[sIdx];
        return [
          `Adegan ${sv.sceneNumber}\n(${si ? si.durationEstimate : '8 detik'})\n${sv.characters}`,
          `Aksi: ${sv.action}\nKamera: ${sv.camera}`,
          `Dialog (100% Bahasa Indonesia):\n${sv.dialogue}`,
        ];
      });

      autoTable(pdf, {
        startY: currentY,
        head: [['Adegan & Tokoh', 'Visual Aksi & Kamera', 'Naskah Dialog']],
        body: sceneRows,
        theme: 'grid',
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 80 },
          2: { cellWidth: 70 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 6;
    }

    // 1. Slide Presentasi
    if ((filterType === 'all' || filterType === 'slide') && item.slide) {
      if (currentY > 230) {
        pdf.addPage();
        currentY = 18;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`1. SLIDE PRESENTASI INTERAKTIF (${item.slide.totalSlides} SLIDE)`, 14, currentY);
      currentY += 4;

      const slideRows = item.slide.slides.map(s => [
        `Slide ${s.slideNumber}\n${s.slideTitle}`,
        `${s.headline}\n• ${s.bulletPoints.join('\n• ')}`,
        `Tips Guru: ${s.teacherInteractionGuide}`,
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Slide', 'Headline & Teks Ramah Anak', 'Panduan Guru']],
        body: slideRows,
        theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold' },
          1: { cellWidth: 88 },
          2: { cellWidth: 64 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 6;
    }

    // 2. Flashcard
    if ((filterType === 'all' || filterType === 'flashcard') && item.flashcard) {
      if (currentY > 230) {
        pdf.addPage();
        currentY = 18;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`2. FLASHCARD PINTAR (${item.flashcard.totalCards} KARTU BOLAK-BALIK)`, 14, currentY);
      currentY += 4;

      const flashRows = item.flashcard.cards.map(c => [
        `Kartu ${c.cardNumber}\n${c.category}`,
        `${c.frontSide.questionOrChallenge}\n(Hint: ${c.frontSide.hint})`,
        `${c.backSide.answer}\n${c.backSide.simpleExplanation}`,
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Kartu', 'Sisi Depan (Tantangan)', 'Sisi Belakang (Kunci Jawaban)']],
        body: flashRows,
        theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 77 },
          2: { cellWidth: 77 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 6;
    }

    // 3. Infografis
    if (filterType === 'all' || filterType === 'infografis') {
      if (currentY > 230) {
        pdf.addPage();
        currentY = 18;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text('3. INFOGRAFIS EDUKATIF 1 HALAMAN', 14, currentY);
      currentY += 4;

      const infoRows = item.infografis.sections.map(s => [
        s.heading,
        s.keyPoints.join(' • '),
        s.didYouKnowOrCallout || '-',
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Seksi Infografis', 'Poin-Poin Konsep Visual', 'Tips / Tahukah Kamu']],
        body: infoRows,
        theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold' },
          1: { cellWidth: 85 },
          2: { cellWidth: 50 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 6;
    }

    // 4. Peta Konsep / Peta Pikiran
    if ((filterType === 'all' || filterType === 'petakonsep') && item.petakonsep) {
      if (currentY > 230) {
        pdf.addPage();
        currentY = 18;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`4. PETA KONSEP & PETA PIKIRAN (5 CABANG HUBUNGAN KONSEP)`, 14, currentY);
      currentY += 4;

      const mmRows = item.petakonsep.branches.map(b => [
        `${b.branchName}\n(Frasa: "${b.connectingPhrase}")`,
        b.subBranches.map(sub => `• ${sub}`).join('\n'),
        `Ikon: ${b.visualDoodle}\nTantangan: ${b.miniChallenge}`,
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Cabang & Kata Hubung', 'Sub-Cabang Konsep Kunci', 'Ikon Visual & Misi Tantangan']],
        body: mmRows,
        theme: 'grid',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.25 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
        columnStyles: {
          0: { cellWidth: 48, fontStyle: 'bold' },
          1: { cellWidth: 72 },
          2: { cellWidth: 60 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 8;
    }
  });

  // Signature block
  if (currentY > 230) {
    pdf.addPage();
    currentY = 25;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Mengetahui,', 14, currentY);
  pdf.text(`${id.tempatPenetapan || 'Fatubai'}, ${id.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 60, currentY);
  currentY += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Kepala Sekolah`, 14, currentY);
  pdf.text(`${id.peranGuru || 'Guru Kelas'}`, pageWidth - 60, currentY);
  currentY += 16;
  pdf.text(id.namaKepalaSekolah || 'Darius Kusi, S.Pd.', 14, currentY);
  pdf.text(id.namaGuru || 'Penyusun', pageWidth - 60, currentY);
  currentY += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`NIP. ${id.nipKepalaSekolah || '196709192008011008'}`, 14, currentY);
  pdf.text(`NIP. ${id.nipGuru || '-'}`, pageWidth - 60, currentY);

  pdf.save(`Prompt_Media_${id.mataPelajaran || 'Mapel'}_${kelasLabel.replace(/\s+/g, '_')}.pdf`);
}



