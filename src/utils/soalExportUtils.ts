import { KisiKisiSoalDocument, PDFLayoutOptions } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isWordExportDisabled } from '../services/accessCodeService';
import { notifyWordExportBlocked, lockWordData } from './exportUtils';
import { getCpColumnDisplay } from './kisiKisiSoalGenerator';
import { cleanTPTextWithoutCode } from './curriculumCPResolver';

/**
 * Helper resmi penulisan titimangsa pada area tanda tangan dokumen (Tempat, Tanggal Bulan dan Tahun).
 * Area tanda tangan selalu diawali dengan Tanggal, Bulan dan Tahun resmi yang lengkap dan tidak boleh kosong/titik-titik.
 */
export function formatTitimangsaDokumen(tempat?: string, tanggal?: string): string {
  const tpt = (tempat || '').trim();
  const resolvedTempat = tpt && tpt !== 'Ditetapkan di Tempat' ? tpt : 'Fatubai';

  let tgl = (tanggal || '').trim();
  if (!tgl || /^[\.\-\s]+$/.test(tgl) || tgl === '........................') {
    tgl = '22 September 2026';
  }
  return `${resolvedTempat}, ${tgl}`;
}

/**
 * Ekspor Matriks Kisi-Kisi Soal ke format Microsoft Word (.doc)
 * Wajib LANDSCAPE, menggunakan font Times New Roman 12, dengan jarak spasi 1.5,
 * serta KOP Dokumen Resmi 4 Baris dengan logo dan judul dinamis.
 */
export function exportKisiKisiToWord(doc: KisiKisiSoalDocument): void {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const { identitas, konfigurasi, tabelKisiKisi, ringkasanDistribusi } = doc;
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();
  const fileName = `Kisi_Kisi_${jenisUjian.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.doc`;

  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';

  const rowsHtml = tabelKisiKisi
    .map(
      (row, idx) => `
    <tr>
      <td align="center" style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${idx + 1}</td>
      <td style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${getCpColumnDisplay(row, idx, tabelKisiKisi)}</td>
      <td style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;"><b>${row.elemen}</b></td>
      <td style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${row.lingkupMateri}</td>
      <td style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;"><b>${row.kodeTP}</b>: ${cleanTPTextWithoutCode(row.kodeTP, row.tujuanPembelajaran)}</td>
      <td style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${row.indikatorSoal}</td>
      <td align="center" style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${row.levelKognitif}<br/><small>(${row.tingkatKKO})</small></td>
      <td align="center" style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5;">${row.bentukSoal}</td>
      <td align="center" style="border:1px solid #000; padding:6px 8px; font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5; font-weight:bold;">${row.nomorSoalDisplay}</td>
    </tr>
  `
    )
    .join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Kisi-Kisi Penulisan Soal Asesmen</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 1.5cm 2cm 1.5cm 2cm;
          mso-page-orientation: landscape;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 0;
          color: #000000;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }
        th {
          background-color: #f2f2f2;
          border: 1px solid #000000;
          padding: 8px 6px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          font-weight: bold;
          text-align: center;
        }
        td {
          border: 1px solid #000000;
          padding: 6px 8px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          vertical-align: top;
        }
        .header-title {
          text-align: center;
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          font-weight: bold;
          line-height: 1.35;
          margin-top: 6px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .header-sub {
          text-align: center;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          font-weight: bold;
          line-height: 1.35;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .kop-line-thick {
          border-bottom: 2.5px solid #000000;
          margin-top: 4px;
          margin-bottom: 1.5px;
        }
        .kop-line-thin {
          border-bottom: 1px solid #000000;
          margin-bottom: 10px;
        }
        .identitas-table {
          width: 100%;
          margin-bottom: 14px;
          border: none;
        }
        .identitas-table td {
          border: none;
          padding: 3px 4px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.4;
        }
        .sig-table {
          width: 100%;
          border: none;
          margin-top: 28px;
        }
        .sig-table td {
          border: none;
          padding: 4px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <!-- KOP DOKUMEN RESMI 4 BARIS + LOGO -->
      <table style="width:100%; border:none; margin-bottom:0;">
        <tr>
          ${identitas.logoUrl ? `<td width="12%" align="center" valign="middle" style="border:none; padding-right:12px;"><img src="${identitas.logoUrl}" style="max-height:85px; max-width:85px; object-fit:contain;" alt="Logo" /></td>` : ''}
          <td align="center" style="border:none; line-height:1.25;">
            <div style="font-size:12pt; font-weight:bold; letter-spacing:0.5px;">${kop1}</div>
            <div style="font-size:13pt; font-weight:bold; letter-spacing:0.5px;">${kop2}</div>
            <div style="font-size:15pt; font-weight:bold; letter-spacing:1px; margin:2px 0;">${kop3}</div>
            <div style="font-size:10pt; font-weight:normal; font-style:italic;">${kop4}</div>
          </td>
        </tr>
      </table>
      <div class="kop-line-thick"></div>
      <div class="kop-line-thin"></div>

      <!-- JUDUL DOKUMEN RESMI (SESUAI REGULASI: TIDAK MENULIS ULANG MAPEL & KELAS) -->
      <div class="header-title">KISI-KISI SOAL</div>
      <div class="header-sub">${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran} • KURIKULUM MERDEKA</div>

      <table class="identitas-table">
        <tr>
          <td width="20%"><b>Satuan Pendidikan</b></td>
          <td width="2%">:</td>
          <td width="38%">${lockWordData(kop3, 'Satuan Pendidikan')}</td>
          <td width="18%"><b>Mata Pelajaran</b></td>
          <td width="2%">:</td>
          <td width="20%">${lockWordData(identitas.mataPelajaran)}</td>
        </tr>
        <tr>
          <td><b>Fase / Kelas</b></td>
          <td>:</td>
          <td>${identitas.fase} / Kelas ${identitas.kelas}</td>
          <td><b>Alokasi Waktu</b></td>
          <td>:</td>
          <td>${konfigurasi.alokasiWaktu}</td>
        </tr>
        <tr>
          <td><b>Semester / Th. Pelajaran</b></td>
          <td>:</td>
          <td>${identitas.semester} / ${identitas.tahunPelajaran}</td>
          <td><b>Jumlah Butir Soal</b></td>
          <td>:</td>
          <td>${ringkasanDistribusi.totalSoal} Butir Soal</td>
        </tr>
      </table>

      <table>
        <thead>
          <tr>
            <th width="4%">No</th>
            <th width="17%">Capaian Pembelajaran (CP)</th>
            <th width="10%">Elemen</th>
            <th width="12%">Lingkup Materi</th>
            <th width="18%">Tujuan Pembelajaran (TP)</th>
            <th width="19%">Indikator Soal</th>
            <th width="7%">Level</th>
            <th width="8%">Bentuk</th>
            <th width="5%">No. Soal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- HALAMAN TERPISAH (WAJIB HALAMAN BARU): REKAPITULASI, KETERANGAN & LEMBAR PENGESAHAN TANDA TANGAN -->
      <br clear="all" style="page-break-before:always; mso-break-type:section-break;" />
      <div style="page-break-before:always; mso-break-type:section-break; margin-top:24px;">
        <div style="text-align:center; font-family:'Times New Roman',Times,serif; font-size:13pt; font-weight:bold; margin-bottom:12px; text-transform:uppercase; border-bottom:1.5px solid #000; padding-bottom:5px;">
          REKAPITULASI &amp; KETERANGAN KISI-KISI SOAL
        </div>

        <table style="width:100%; border:none; margin-bottom:14px; border-collapse:collapse;">
          <tr>
            <!-- Kolom 1: Distribusi Level Kognitif -->
            <td width="48%" style="vertical-align:top; border:1px solid #000; padding:10px; background-color:#fafafa;">
              <div style="font-weight:bold; font-size:12pt; border-bottom:1px solid #999; padding-bottom:4px; margin-bottom:8px;">
                I. Distribusi Tingkat Level Kognitif:
              </div>
              <table style="width:100%; border:none; font-size:11pt; line-height:1.4;">
                <tr>
                  <td width="60%">• Level 1 (Mengingat &amp; Memahami / LOTS)</td>
                  <td width="5%">:</td>
                  <td width="35%"><b>${ringkasanDistribusi.distribusiLevel['Level 1'] || 0} Butir Soal</b></td>
                </tr>
                <tr>
                  <td>• Level 2 (Menerapkan / Aplikasi / MOTS)</td>
                  <td>:</td>
                  <td><b>${ringkasanDistribusi.distribusiLevel['Level 2'] || 0} Butir Soal</b></td>
                </tr>
                <tr>
                  <td>• Level 3 (Penalaran / HOTS)</td>
                  <td>:</td>
                  <td><b>${ringkasanDistribusi.distribusiLevel['Level 3'] || 0} Butir Soal</b></td>
                </tr>
                <tr style="border-top:1px dashed #666;">
                  <td style="padding-top:4px;"><b>Total Keseluruhan Soal</b></td>
                  <td style="padding-top:4px;">:</td>
                  <td style="padding-top:4px;"><b>${ringkasanDistribusi.totalSoal} Butir Soal</b></td>
                </tr>
              </table>
            </td>

            <td width="4%">&nbsp;</td>

            <!-- Kolom 2: Distribusi Bentuk & Jenis Soal -->
            <td width="48%" style="vertical-align:top; border:1px solid #000; padding:10px; background-color:#fafafa;">
              <div style="font-weight:bold; font-size:12pt; border-bottom:1px solid #999; padding-bottom:4px; margin-bottom:8px;">
                II. Distribusi Bentuk &amp; Jenis Soal:
              </div>
              <table style="width:100%; border:none; font-size:11pt; line-height:1.4;">
                ${ringkasanDistribusi.distribusiBentuk['Pilihan Ganda'] ? `<tr><td width="60%">• Pilihan Ganda (PG)</td><td width="5%">:</td><td width="35%"><b>${ringkasanDistribusi.distribusiBentuk['Pilihan Ganda']} Butir</b></td></tr>` : ''}
                ${ringkasanDistribusi.distribusiBentuk['Menjodohkan'] ? `<tr><td>• Menjodohkan</td><td>:</td><td><b>${ringkasanDistribusi.distribusiBentuk['Menjodohkan']} Butir</b></td></tr>` : ''}
                ${ringkasanDistribusi.distribusiBentuk['Benar / Salah'] ? `<tr><td>• Benar / Salah</td><td>:</td><td><b>${ringkasanDistribusi.distribusiBentuk['Benar / Salah']} Butir</b></td></tr>` : ''}
                ${ringkasanDistribusi.distribusiBentuk['Isian Singkat'] ? `<tr><td>• Isian Singkat</td><td>:</td><td><b>${ringkasanDistribusi.distribusiBentuk['Isian Singkat']} Butir</b></td></tr>` : ''}
                ${ringkasanDistribusi.distribusiBentuk['Uraian / Esai'] ? `<tr><td>• Uraian / Esai</td><td>:</td><td><b>${ringkasanDistribusi.distribusiBentuk['Uraian / Esai']} Butir</b></td></tr>` : ''}
                <tr style="border-top:1px dashed #666;">
                  <td style="padding-top:4px;"><b>Total Skor Maksimal</b></td>
                  <td style="padding-top:4px;">:</td>
                  <td style="padding-top:4px;"><b>${ringkasanDistribusi.totalSkorMaksimal} Poin</b></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Keterangan Asesmen & Kunci Jawaban -->
        <div style="border:1px solid #000; padding:8px 12px; margin-bottom:24px; background-color:#fefefe; font-size:11pt; line-height:1.5;">
          <b>KETERANGAN &amp; CATATAN KHUSUS ASESMEN:</b>
          <ol style="margin:4px 0 0 18px; padding:0;">
            <li style="margin-bottom:2px;">Matriks kisi-kisi penulisan soal di atas disusun secara terpadu mengacu pada Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) ${identitas.mataPelajaran} ${identitas.fase} yang berlaku.</li>
            <li style="margin-bottom:2px;"><b>Kunci jawaban, format kunci respon, dan rubrik pedoman penskoran terperinci tersedia secara terpisah pada dokumen "Lembar Kunci Jawaban dan Pedoman Penskoran".</b></li>
          </ol>
        </div>

        <!-- AREA TANDA TANGAN (1 Halaman Bersama Keterangan) -->
        <table class="sig-table" style="width:100%; border:none; margin-top:12px;">
          <tr>
            <td width="50%" align="center" style="vertical-align:top;">
              Mengetahui,<br/>
              Kepala Satuan Pendidikan<br/><br/><br/><br/>
              <b><u>${lockWordData(identitas.namaKepalaSekolah || '...........................................')}</u></b><br/>
              NIP. ${lockWordData(identitas.nipKepalaSekolah || '...........................................')}
            </td>
            <td width="50%" align="center" style="vertical-align:top;">
              ${formatTitimangsaDokumen(identitas.tempatPenetapan, konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan)}<br/>
              ${identitas.peranGuru || 'Guru Mata Pelajaran / Kelas'}<br/><br/><br/><br/>
              <b><u>${lockWordData(identitas.namaGuru || '...........................................')}</u></b><br/>
              NIP. ${lockWordData(identitas.nipGuru || '...........................................')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Naskah Soal Siswa & Lembar Kerja ke Microsoft Word (.doc)
 */
export function exportNaskahSoalToWord(doc: KisiKisiSoalDocument): void {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const { identitas, konfigurasi, naskahSoal } = doc;
  const fileName = `Naskah_Soal_${konfigurasi.jenisAsesmen.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.doc`;

  // Bagian PG
  let pgHtml = '';
  if (naskahSoal.soalPilihanGanda.length > 0) {
    pgHtml = `
      <div style="margin-top:16px; margin-bottom:8px; font-weight:bold; font-size:12pt; border-bottom:1.5px solid #000; padding-bottom:3px;">
        A. PILIHAN GANDA
      </div>
      <p style="font-style:italic; margin-bottom:12px; font-size:10pt;">
        Petunjuk Khusus: Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar pada lembar jawaban yang tersedia!
      </p>
      <ol style="padding-left:20px; margin-top:0;">
        ${naskahSoal.soalPilihanGanda
          .map(
            (soal) => `
          <li style="margin-bottom:12px; font-size:10.5pt;">
            ${soal.stimulus ? `<div style="font-style:italic; margin-bottom:4px; color:#333;">${soal.stimulus}</div>` : ''}
            <div>${soal.pertanyaan}</div>
            <table style="width:100%; border:none; margin-top:4px;">
              ${soal.pilihan
                .map(
                  (p) => `
                <tr>
                  <td width="5%" valign="top"><b>${p.kunci}.</b></td>
                  <td valign="top">${p.teks}</td>
                </tr>
              `
                )
                .join('')}
            </table>
          </li>
        `
          )
          .join('')}
      </ol>
    `;
  }

  // Bagian Menjodohkan
  let jodohHtml = '';
  if (naskahSoal.soalMenjodohkan.length > 0) {
    jodohHtml = `
      <div style="margin-top:20px; margin-bottom:8px; font-weight:bold; font-size:12pt; border-bottom:1.5px solid #000; padding-bottom:3px;">
        B. MENJODOHKAN
      </div>
      <p style="font-style:italic; margin-bottom:12px; font-size:10pt;">
        Petunjuk Khusus: Pasangkanlah butir pernyataan pada Kolom A dengan pilihan jawaban yang tepat pada Kolom B!
      </p>
      ${naskahSoal.soalMenjodohkan
        .map(
          (group) => `
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <thead>
            <tr>
              <th width="8%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">No</th>
              <th width="46%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">KOLOM A (Pernyataan)</th>
              <th width="8%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">Jawaban</th>
              <th width="38%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">KOLOM B (Pilihan)</th>
            </tr>
          </thead>
          <tbody>
            ${group.daftarPremis
              .map((premis, idx) => {
                const respon = group.daftarPilihanRespon[idx];
                return `
                <tr>
                  <td align="center" style="border:1px solid #000; padding:6px;">${premis.nomor}</td>
                  <td style="border:1px solid #000; padding:6px;">${premis.teks}</td>
                  <td align="center" style="border:1px solid #000; padding:6px; font-weight:bold;">( ... )</td>
                  <td style="border:1px solid #000; padding:6px;">${respon ? `<b>${respon.label}.</b> ${respon.teks}` : ''}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      `
        )
        .join('')}
    `;
  }

  // Bagian Benar Salah
  let bsHtml = '';
  if (naskahSoal.soalBenarSalah.length > 0) {
    bsHtml = `
      <div style="margin-top:20px; margin-bottom:8px; font-weight:bold; font-size:12pt; border-bottom:1.5px solid #000; padding-bottom:3px;">
        C. BENAR / SALAH
      </div>
      <p style="font-style:italic; margin-bottom:12px; font-size:10pt;">
        Petunjuk Khusus: Berilah tanda centang (✓) pada kolom B jika pernyataan Benar, atau pada kolom S jika pernyataan Salah!
      </p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <thead>
          <tr>
            <th width="8%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">No</th>
            <th width="76%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">Pernyataan</th>
            <th width="8%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">B</th>
            <th width="8%" style="border:1px solid #000; padding:6px; background-color:#f0f0f0;">S</th>
          </tr>
        </thead>
        <tbody>
          ${naskahSoal.soalBenarSalah
            .map(
              (item) => `
            <tr>
              <td align="center" style="border:1px solid #000; padding:6px;">${item.nomor}</td>
              <td style="border:1px solid #000; padding:6px;">${item.pernyataan}</td>
              <td align="center" style="border:1px solid #000; padding:6px;">[ &nbsp; ]</td>
              <td align="center" style="border:1px solid #000; padding:6px;">[ &nbsp; ]</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // Bagian Isian Singkat
  let isianHtml = '';
  if (naskahSoal.soalIsianSingkat.length > 0) {
    isianHtml = `
      <div style="margin-top:20px; margin-bottom:8px; font-weight:bold; font-size:12pt; border-bottom:1.5px solid #000; padding-bottom:3px;">
        D. ISIAN SINGKAT
      </div>
      <p style="font-style:italic; margin-bottom:12px; font-size:10pt;">
        Petunjuk Khusus: Isilah titik-titik pada butir soal berikut dengan jawaban yang singkat, tepat, dan benar!
      </p>
      <ol style="padding-left:20px; margin-top:0;">
        ${naskahSoal.soalIsianSingkat
          .map(
            (soal) => `
          <li style="margin-bottom:10px; font-size:10.5pt;">
            ${soal.pertanyaan}
          </li>
        `
          )
          .join('')}
      </ol>
    `;
  }

  // Bagian Uraian
  let uraianHtml = '';
  if (naskahSoal.soalUraian.length > 0) {
    uraianHtml = `
      <div style="margin-top:20px; margin-bottom:8px; font-weight:bold; font-size:12pt; border-bottom:1.5px solid #000; padding-bottom:3px;">
        E. URAIAN / ESAY
      </div>
      <p style="font-style:italic; margin-bottom:12px; font-size:10pt;">
        Petunjuk Khusus: Jawablah pertanyaan-pertanyaan berikut ini dengan uraian yang jelas, lengkap, dan sistematis!
      </p>
      <ol style="padding-left:20px; margin-top:0;">
        ${naskahSoal.soalUraian
          .map(
            (soal) => `
          <li style="margin-bottom:18px; font-size:10.5pt;">
            ${soal.pertanyaan}
            <div style="margin-top:8px; border-bottom:1px dashed #ccc; height:35px;"></div>
            <div style="margin-top:4px; border-bottom:1px dashed #ccc; height:35px;"></div>
          </li>
        `
          )
          .join('')}
      </ol>
    `;
  }

  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Naskah Soal Siswa</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.8cm 2cm 1.8cm 2cm;
          mso-page-orientation: portrait;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; margin: 0; color: #000; }
        .kop-table { width:100%; border:none; margin-bottom: 2px; }
        .kop-line-thick { border-bottom: 2.5px solid #000; margin-top: 3px; margin-bottom: 1.5px; }
        .kop-line-thin { border-bottom: 1px solid #000; margin-bottom: 12px; }
        .table-identitas { width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 14px; }
        .table-identitas td { border: 1px solid #000; padding: 4px 8px; font-size: 10pt; }
        .judul-ujian { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 2px; text-transform: uppercase; }
        .sub-ujian { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <table class="kop-table" style="border-collapse:collapse; width:100%;">
        <tr>
          ${identitas.logoUrl ? `<td width="15%" align="center" valign="middle" style="padding-right:12px;"><img src="${identitas.logoUrl}" style="max-height:80px; max-width:80px; object-fit:contain;" alt="Logo" /></td>` : ''}
          <td align="center" style="line-height:1.25;">
            <div style="font-size:11pt; font-weight:bold; letter-spacing:0.5px;">${kop1}</div>
            <div style="font-size:12pt; font-weight:bold; letter-spacing:0.5px;">${kop2}</div>
            <div style="font-size:14pt; font-weight:bold; letter-spacing:1px; margin:2px 0;">${kop3}</div>
            <div style="font-size:9.5pt; font-weight:normal; font-style:italic;">${kop4}</div>
          </td>
        </tr>
      </table>
      <div class="kop-line-thick"></div>
      <div class="kop-line-thin"></div>

      <div class="judul-ujian">NASKAH SOAL</div>
      <div class="sub-ujian">${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran}</div>

      <table class="table-identitas">
        <tr>
          <td width="18%"><b>Mata Pelajaran</b></td><td width="2%">:</td><td width="30%">${lockWordData(identitas.mataPelajaran)}</td>
          <td width="18%"><b>Nama Peserta</b></td><td width="2%">:</td><td width="30%">................................................</td>
        </tr>
        <tr>
          <td><b>Fase / Kelas</b></td><td>:</td><td>${identitas.fase} / Kelas ${identitas.kelas}</td>
          <td><b>Nomor Absen</b></td><td>:</td><td>................................................</td>
        </tr>
        <tr>
          <td><b>Hari, Tanggal</b></td><td>:</td><td>${konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan || '...........................'}</td>
          <td><b>Nilai / Skor</b></td><td>:</td><td style="font-weight:bold; font-size:11pt; text-align:center;">&nbsp;</td>
        </tr>
        <tr>
          <td><b>Waktu Pengerjaan</b></td><td>:</td><td>${konfigurasi.alokasiWaktu}</td>
          <td><b>Paraf Guru / Ortu</b></td><td>:</td><td>................................................</td>
        </tr>
      </table>

      <div style="background-color:#f9f9f9; border:1px solid #ddd; padding:8px 12px; margin-bottom:14px; font-size:9.5pt;">
        <b>PETUNJUK UMUM:</b>
        <ol style="margin:4px 0 0 16px; padding:0;">
          ${naskahSoal.petunjukUmum.map((p) => `<li>${p}</li>`).join('')}
        </ol>
      </div>

      ${pgHtml}
      ${jodohHtml}
      ${bsHtml}
      ${isianHtml}
      ${uraianHtml}

      <div style="text-align:center; margin-top:25px; font-style:italic; font-weight:bold; border-top:1px dashed #666; padding-top:10px;">
        -- Selamat Mengerjakan &amp; Semoga Sukses! --
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Kunci Jawaban & Pedoman Penskoran ke Word
 */
export function exportKunciJawabanToWord(doc: KisiKisiSoalDocument): void {
  if (isWordExportDisabled()) {
    notifyWordExportBlocked();
    return;
  }

  const { identitas, konfigurasi, pedomanPenskoran, naskahSoal, ringkasanDistribusi } = doc;
  const fileName = `Kunci_Jawaban_${konfigurasi.jenisAsesmen.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.doc`;

  const rowsHtml = pedomanPenskoran
    .map(
      (item, idx) => `
    <tr>
      <td align="center" style="border:1px solid #000; padding:6px;">${idx + 1}</td>
      <td style="border:1px solid #000; padding:6px; font-weight:bold;">${item.nomorSoalDisplay}</td>
      <td align="center" style="border:1px solid #000; padding:6px;">${item.bentukSoal}</td>
      <td style="border:1px solid #000; padding:6px;">${item.kunciJawabanSingkat}</td>
      <td align="center" style="border:1px solid #000; padding:6px; font-weight:bold;">${item.bobotSkor}</td>
    </tr>
  `
    )
    .join('');

  // Rubrik Uraian
  const rubrikHtml = naskahSoal.soalUraian
    .map(
      (u) => `
    <div style="margin-bottom:12px; font-size:10pt;">
      <b>Soal Uraian No. ${u.nomor}:</b> ${u.pertanyaan}
      <div style="margin:4px 0 2px 0;"><b>Kunci Jawaban Ideal:</b><br/>${u.kunciJawaban.replace(/\n/g, '<br/>')}</div>
      <table style="width:100%; border-collapse:collapse; margin-top:4px;">
        <thead>
          <tr>
            <th width="75%" style="border:1px solid #000; padding:4px; background-color:#f5f5f5; font-size:9pt;">Kriteria Penskoran</th>
            <th width="25%" style="border:1px solid #000; padding:4px; background-color:#f5f5f5; font-size:9pt;">Skor Maksimal</th>
          </tr>
        </thead>
        <tbody>
          ${u.pedomanPenskoran
            .map(
              (p) => `
            <tr>
              <td style="border:1px solid #000; padding:4px; font-size:9pt;">${p.kriteria}</td>
              <td align="center" style="border:1px solid #000; padding:4px; font-size:9pt; font-weight:bold;">${p.skorMaks}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
    )
    .join('');

  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Kunci Jawaban & Pedoman Penskoran</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.8cm 2cm 1.8cm 2cm;
          mso-page-orientation: portrait;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; margin: 0; color: #000; }
        .kop-table { width:100%; border:none; margin-bottom: 2px; }
        .kop-line-thick { border-bottom: 2.5px solid #000; margin-top: 3px; margin-bottom: 1.5px; }
        .kop-line-thin { border-bottom: 1px solid #000; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th { border: 1px solid #000; padding: 6px; font-size: 10pt; }
        .judul { text-align: center; font-size: 13pt; font-weight: bold; margin-top: 6px; margin-bottom: 2px; text-transform: uppercase; }
        .sub { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 14px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <table class="kop-table" style="border-collapse:collapse; width:100%;">
        <tr>
          ${identitas.logoUrl ? `<td width="15%" align="center" valign="middle" style="padding-right:12px;"><img src="${identitas.logoUrl}" style="max-height:80px; max-width:80px; object-fit:contain;" alt="Logo" /></td>` : ''}
          <td align="center" style="line-height:1.25;">
            <div style="font-size:11pt; font-weight:bold; letter-spacing:0.5px;">${kop1}</div>
            <div style="font-size:12pt; font-weight:bold; letter-spacing:0.5px;">${kop2}</div>
            <div style="font-size:14pt; font-weight:bold; letter-spacing:1px; margin:2px 0;">${kop3}</div>
            <div style="font-size:9.5pt; font-weight:normal; font-style:italic;">${kop4}</div>
          </td>
        </tr>
      </table>
      <div class="kop-line-thick"></div>
      <div class="kop-line-thin"></div>

      <div class="judul">KUNCI JAWABAN &amp; PEDOMAN PENSKORAN</div>
      <div class="sub">${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran}</div>

      <table style="width:100%; margin-bottom:12px; border:none; font-size:10pt;">
        <tr>
          <td width="20%"><b>Satuan Pendidikan</b></td><td width="2%">:</td><td width="38%">${lockWordData(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai')}</td>
          <td width="18%"><b>Mata Pelajaran</b></td><td width="2%">:</td><td width="20%"><b>${lockWordData(identitas.mataPelajaran)}</b></td>
        </tr>
        <tr>
          <td><b>Fase / Kelas</b></td><td>:</td><td>${identitas.fase} / Kelas ${identitas.kelas}</td>
          <td><b>Bentuk Asesmen</b></td><td>:</td><td>${konfigurasi.jenisAsesmen}</td>
        </tr>
        <tr>
          <td><b>Semester / Tahun Ajaran</b></td><td>:</td><td>${identitas.semester} / ${identitas.tahunPelajaran}</td>
          <td><b>Total Soal / Skor Maks</b></td><td>:</td><td>${ringkasanDistribusi.totalSoal} Butir / <b>${ringkasanDistribusi.totalSkorMaksimal}</b></td>
        </tr>
      </table>

      <div style="margin-bottom:8px; font-weight:bold; font-size:11pt;">TABEL KUNCI JAWABAN DAN BOBOT SKOR:</div>
      <table>
        <thead>
          <tr style="background-color:#f0f0f0;">
            <th width="6%">No</th>
            <th width="18%">Nomor Soal</th>
            <th width="18%">Bentuk Soal</th>
            <th width="44%">Kunci Jawaban</th>
            <th width="14%">Bobot Skor</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${naskahSoal.soalUraian.length > 0 ? `<div style="margin-top:20px; margin-bottom:8px; font-weight:bold; font-size:11pt;">RUBRIK PENSKORAN SOAL URAIAN:</div>${rubrikHtml}` : ''}

      <div style="margin-top:20px; border:1px solid #000; padding:10px; background-color:#fafafa; font-size:10.5pt;">
        <b>RUMUS PERHITUNGAN NILAI AKHIR (NA):</b><br/>
        <div style="margin-top:6px; font-family:Courier New, monospace; font-size:11pt; font-weight:bold;">
          Nilai Akhir (NA) = ( Total Skor Perolehan Peserta Didik / Total Skor Maksimal (${ringkasanDistribusi.totalSkorMaksimal}) ) × 100
        </div>
      </div>

      <table style="width:100%; border:none; margin-top:24px;">
        <tr>
          <td width="50%" align="center">
            Mengetahui,<br/>Kepala Sekolah<br/><br/><br/><br/>
            <b><u>${lockWordData(identitas.namaKepalaSekolah || '...........................................')}</u></b><br/>
            NIP. ${lockWordData(identitas.nipKepalaSekolah || '...........................................')}
          </td>
          <td width="50%" align="center">
            ${formatTitimangsaDokumen(identitas.tempatPenetapan, konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan)}<br/>
            ${identitas.peranGuru || 'Guru Mata Pelajaran / Kelas'}<br/><br/><br/><br/>
            <b><u>${lockWordData(identitas.namaGuru || '...........................................')}</u></b><br/>
            NIP. ${lockWordData(identitas.nipGuru || '...........................................')}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Matriks Kisi-Kisi Soal ke PDF menggunakan jsPDF & AutoTable (WAJIB Landscape)
 * Menggunakan font Times New Roman ('times'), line spacing 1.5, KOP Resmi 4 Baris + Logo, dan tata letak laporan akademis resmi.
 */
export function exportKisiKisiToPDF(doc: KisiKisiSoalDocument, layoutOptions?: PDFLayoutOptions): void {
  // Kisi-kisi soal WAJIB Landscape
  const orientation = 'landscape';
  const paperSize = layoutOptions?.paperSize || 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  });

  const { identitas, konfigurasi, tabelKisiKisi } = doc;
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();
  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';

  const pageWidth = pdf.internal.pageSize.getWidth(); // ~297mm for A4 landscape
  const centerX = pageWidth / 2;

  // 1. Gambar Logo KOP Resmi jika tersedia
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      pdf.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', 14, 7, 22, 22);
    } catch (e) {
      console.warn('Gagal memuat logo pada KOP PDF:', e);
    }
  }

  // 2. Teks KOP Resmi 4 Baris
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text(kop1, centerX, 11, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(kop2, centerX, 16, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text(kop3, centerX, 22, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(kop4, centerX, 26.5, { align: 'center' });

  // 3. Garis Pembatas KOP Resmi (Double Line)
  pdf.setLineWidth(0.7);
  pdf.line(14, 29, pageWidth - 14, 29);
  pdf.setLineWidth(0.2);
  pdf.line(14, 29.8, pageWidth - 14, 29.8);

  // 4. Judul Dokumen Resmi Dinamis Menyesuaikan Pilihan Guru
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text('KISI-KISI SOAL', centerX, 35, { align: 'center' });
  pdf.setFontSize(9.5);
  pdf.text(`${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran} • KURIKULUM MERDEKA`, centerX, 39.5, { align: 'center' });

  // 5. Tabel Identitas Dokumen Kisi-Kisi (Tanda Titik Dua Dijamin 100% Sejajar)
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  pdf.text('Satuan Pendidikan', 14, 44.5);
  pdf.text('Fase / Kelas', 14, 48.5);
  pdf.text('Semester / Th. Pelajaran', 14, 52.5);

  pdf.text(':', 52, 44.5);
  pdf.text(':', 52, 48.5);
  pdf.text(':', 52, 52.5);

  pdf.setFont('times', 'normal');
  pdf.text(kop3, 55, 44.5);
  pdf.text(`${identitas.fase} / Kelas ${identitas.kelas}`, 55, 48.5);
  pdf.text(`${identitas.semester} / ${identitas.tahunPelajaran}`, 55, 52.5);

  pdf.setFont('times', 'bold');
  pdf.text('Mata Pelajaran', 190, 44.5);
  pdf.text('Alokasi Waktu', 190, 48.5);
  pdf.text('Jumlah Butir Soal', 190, 52.5);

  pdf.text(':', 222, 44.5);
  pdf.text(':', 222, 48.5);
  pdf.text(':', 222, 52.5);

  pdf.setFont('times', 'normal');
  pdf.text(identitas.mataPelajaran, 225, 44.5);
  pdf.text(konfigurasi.alokasiWaktu, 225, 48.5);
  pdf.text(`${doc.ringkasanDistribusi.totalSoal} Butir Soal`, 225, 52.5);

  // 6. Baris Tabel Kisi-Kisi dengan Aturan Hemat Kertas & Tanpa Pendobelan Penulisan TP
  const tableRows = tabelKisiKisi.map((row, idx) => [
    idx + 1,
    getCpColumnDisplay(row, idx, tabelKisiKisi),
    row.elemen,
    row.lingkupMateri,
    `${row.kodeTP}: ${cleanTPTextWithoutCode(row.kodeTP, row.tujuanPembelajaran)}`,
    row.indikatorSoal,
    `${row.levelKognitif}\n(${row.tingkatKKO})`,
    row.bentukSoal,
    row.nomorSoalDisplay,
  ]);

  autoTable(pdf, {
    startY: 55,
    head: [
      ['No', 'Capaian Pembelajaran (CP)', 'Elemen', 'Lingkup Materi', 'Tujuan Pembelajaran (TP)', 'Indikator Soal', 'Level', 'Bentuk', 'No. Soal'],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      font: 'times',
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      font: 'times',
      fontSize: 8.5,
      textColor: [0, 0, 0],
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 30 },
      4: { cellWidth: 45 },
      5: { cellWidth: 50 },
      6: { cellWidth: 24, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      const str = `Dokumen Kisi-Kisi Akademis • Halaman ${pdf.getNumberOfPages()}`;
      pdf.setFont('times', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(str, data.settings.margin.left, pdf.internal.pageSize.height - 6);
    },
  });

  // HALAMAN TERPISAH (WAJIB HALAMAN BARU): REKAPITULASI, KETERANGAN & AREA TANDA TANGAN
  pdf.addPage('a4', 'landscape');

  // Judul Halaman Rekapitulasi & Keterangan
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text('REKAPITULASI & KETERANGAN KISI-KISI SOAL', centerX, 18, { align: 'center' });
  pdf.setFontSize(9.5);
  pdf.text(`${kop3} • ${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran}`, centerX, 23.5, { align: 'center' });

  pdf.setLineWidth(0.4);
  pdf.line(14, 26, pageWidth - 14, 26);

  // Tabel 1 (Kiri): Distribusi Tingkat Level Kognitif
  const totalL1 = doc.ringkasanDistribusi.distribusiLevel['Level 1'] || 0;
  const totalL2 = doc.ringkasanDistribusi.distribusiLevel['Level 2'] || 0;
  const totalL3 = doc.ringkasanDistribusi.distribusiLevel['Level 3'] || 0;
  const totSoal = doc.ringkasanDistribusi.totalSoal || 1;

  const pctL1 = Math.round((totalL1 / totSoal) * 100);
  const pctL2 = Math.round((totalL2 / totSoal) * 100);
  const pctL3 = Math.max(0, 100 - pctL1 - pctL2);

  const levelRows = [
    ['1', 'Level 1: Mengingat & Memahami (LOTS)', `${totalL1} Soal`, `${pctL1}%`],
    ['2', 'Level 2: Menerapkan / Aplikasi (MOTS)', `${totalL2} Soal`, `${pctL2}%`],
    ['3', 'Level 3: Penalaran & Analisis (HOTS)', `${totalL3} Soal`, `${pctL3}%`],
    ['', 'Total Keseluruhan Soal', `${totSoal} Butir`, '100%'],
  ];

  autoTable(pdf, {
    startY: 31,
    margin: { left: 14, right: pageWidth / 2 + 3 },
    head: [['No', 'Tingkat Level Kognitif', 'Jumlah', 'Proporsi']],
    body: levelRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 2.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 72 },
      2: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === levelRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 248, 248];
      }
    },
  });

  // Tabel 2 (Kanan): Distribusi Bentuk & Jenis Butir Soal
  const bentukRows: any[] = [];
  let bIdx = 1;
  if (doc.ringkasanDistribusi.distribusiBentuk['Pilihan Ganda']) {
    bentukRows.push([String(bIdx++), 'Pilihan Ganda (PG)', `${doc.ringkasanDistribusi.distribusiBentuk['Pilihan Ganda']} Butir`]);
  }
  if (doc.ringkasanDistribusi.distribusiBentuk['Menjodohkan']) {
    bentukRows.push([String(bIdx++), 'Menjodohkan', `${doc.ringkasanDistribusi.distribusiBentuk['Menjodohkan']} Butir`]);
  }
  if (doc.ringkasanDistribusi.distribusiBentuk['Benar / Salah']) {
    bentukRows.push([String(bIdx++), 'Benar / Salah', `${doc.ringkasanDistribusi.distribusiBentuk['Benar / Salah']} Butir`]);
  }
  if (doc.ringkasanDistribusi.distribusiBentuk['Isian Singkat']) {
    bentukRows.push([String(bIdx++), 'Isian Singkat', `${doc.ringkasanDistribusi.distribusiBentuk['Isian Singkat']} Butir`]);
  }
  if (doc.ringkasanDistribusi.distribusiBentuk['Uraian / Esai']) {
    bentukRows.push([String(bIdx++), 'Uraian / Esai', `${doc.ringkasanDistribusi.distribusiBentuk['Uraian / Esai']} Butir`]);
  }
  bentukRows.push(['', 'Total Skor Maksimal', `${doc.ringkasanDistribusi.totalSkorMaksimal} Poin`]);

  autoTable(pdf, {
    startY: 31,
    margin: { left: pageWidth / 2 + 3, right: 14 },
    head: [['No', 'Bentuk / Jenis Butir Soal', 'Jumlah / Bobot']],
    body: bentukRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 9, cellPadding: 2.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 75 },
      2: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.row.index === bentukRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 248, 248];
      }
    },
  });

  const recapEndY = Math.max(
    (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY : 70,
    70
  );

  // Kotak Keterangan & Catatan Khusus Asesmen
  const noteBoxY = recapEndY + 5;
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(0, 0, 0);
  pdf.setFillColor(252, 252, 252);
  pdf.rect(14, noteBoxY, pageWidth - 28, 22, 'FD');

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('KETERANGAN & CATATAN KHUSUS ASESMEN:', 18, noteBoxY + 5.5);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(
    `1. Matriks kisi-kisi penulisan soal di atas disusun secara terpadu mengacu pada Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) ${identitas.mataPelajaran} ${identitas.fase} yang berlaku.`,
    18,
    noteBoxY + 11
  );
  pdf.setFont('times', 'bold');
  pdf.text(
    '2. Kunci jawaban, format kunci respon, dan rubrik pedoman penskoran terperinci tersedia secara terpisah pada dokumen "Lembar Kunci Jawaban dan Pedoman Penskoran".',
    18,
    noteBoxY + 16.5
  );

  // Area Tanda Tangan Resmi Akademis (Wajib 1 Halaman Bersama Keterangan)
  const sigY = noteBoxY + 29;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(0, 0, 0);

  // Kiri: Mengetahui Kepala Sekolah
  pdf.text('Mengetahui,', 65, sigY, { align: 'center' });
  pdf.text('Kepala Satuan Pendidikan', 65, sigY + 5.5, { align: 'center' });
  pdf.setFont('times', 'bold');
  pdf.text(identitas.namaKepalaSekolah || '...........................................', 65, sigY + 25, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(`NIP. ${identitas.nipKepalaSekolah || '...........................................'}`, 65, sigY + 30.5, { align: 'center' });

  // Kanan: Tempat, Tanggal Penetapan & Guru
  const tglStr = formatTitimangsaDokumen(identitas.tempatPenetapan, konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan);
  pdf.text(tglStr, 230, sigY, { align: 'center' });
  pdf.text(identitas.peranGuru || 'Guru Mata Pelajaran / Kelas', 230, sigY + 5.5, { align: 'center' });
  pdf.setFont('times', 'bold');
  pdf.text(identitas.namaGuru || '...........................................', 230, sigY + 25, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(`NIP. ${identitas.nipGuru || '...........................................'}`, 230, sigY + 30.5, { align: 'center' });

  const fileName = `Kisi_Kisi_${jenisUjian.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.pdf`;
  pdf.save(fileName);
}

/**
 * Ekspor Naskah Soal Siswa ke PDF menggunakan jsPDF (WAJIB PORTRAIT)
 * Khusus Naskah Soal Siswa: TIDAK ADA TANDA TANGAN!
 */
export function exportNaskahSoalToPDF(doc: KisiKisiSoalDocument, layoutOptions?: PDFLayoutOptions): void {
  const orientation = 'portrait';
  const paperSize = layoutOptions?.paperSize || 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  });

  const { identitas, konfigurasi, naskahSoal } = doc;
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();
  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';

  const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
  const centerX = pageWidth / 2;

  // 1. Logo KOP Resmi
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      pdf.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', 14, 8, 20, 20);
    } catch (e) {
      console.warn('Gagal memuat logo pada KOP PDF Naskah:', e);
    }
  }

  // 2. Teks KOP Resmi 4 Baris
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(kop1, centerX, 11, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text(kop2, centerX, 16, { align: 'center' });
  pdf.setFontSize(13);
  pdf.text(kop3, centerX, 22, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(kop4, centerX, 26.5, { align: 'center' });

  // 3. Garis Pembatas KOP Ganda
  pdf.setLineWidth(0.7);
  pdf.line(14, 29, pageWidth - 14, 29);
  pdf.setLineWidth(0.2);
  pdf.line(14, 29.8, pageWidth - 14, 29.8);

  // 4. Judul Dokumen
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text('NASKAH SOAL', centerX, 36, { align: 'center' });
  pdf.setFontSize(9.5);
  pdf.text(`${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran}`, centerX, 41, { align: 'center' });

  // 5. Tabel Identitas Siswa (Kotak Persegi dengan Tanda Titik Dua Sejajar)
  pdf.setLineWidth(0.3);
  pdf.rect(14, 45, pageWidth - 28, 22);
  pdf.line(14, 50.5, pageWidth - 14, 50.5);
  pdf.line(14, 56, pageWidth - 14, 56);
  pdf.line(14, 61.5, pageWidth - 14, 61.5);
  pdf.line(centerX, 45, centerX, 67); // Divider tengah

  pdf.setFontSize(8.5);

  // Kolom Kiri
  pdf.setFont('times', 'bold');
  pdf.text('Mata Pelajaran', 16, 49);
  pdf.text('Fase / Kelas', 16, 54.5);
  pdf.text('Hari, Tanggal', 16, 60);
  pdf.text('Waktu Pengerjaan', 16, 65.5);

  pdf.text(':', 45, 49);
  pdf.text(':', 45, 54.5);
  pdf.text(':', 45, 60);
  pdf.text(':', 45, 65.5);

  pdf.setFont('times', 'normal');
  pdf.text(identitas.mataPelajaran, 48, 49);
  pdf.text(`${identitas.fase} / Kelas ${identitas.kelas}`, 48, 54.5);
  pdf.text(konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan || '...........................', 48, 60);
  pdf.text(konfigurasi.alokasiWaktu, 48, 65.5);

  // Kolom Kanan
  pdf.setFont('times', 'bold');
  pdf.text('Nama Peserta', centerX + 3, 49);
  pdf.text('Nomor Absen', centerX + 3, 54.5);
  pdf.text('Nilai / Skor', centerX + 3, 60);
  pdf.text('Paraf Guru / Ortu', centerX + 3, 65.5);

  pdf.text(':', centerX + 35, 49);
  pdf.text(':', centerX + 35, 54.5);
  pdf.text(':', centerX + 35, 60);
  pdf.text(':', centerX + 35, 65.5);

  pdf.setFont('times', 'normal');
  pdf.text('................................................', centerX + 38, 49);
  pdf.text('................................................', centerX + 38, 54.5);
  pdf.text('................................................', centerX + 38, 65.5);

  let currentY = 72;

  // Petunjuk Umum
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('PETUNJUK UMUM:', 14, currentY);
  currentY += 4;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  naskahSoal.petunjukUmum.forEach((p, idx) => {
    pdf.text(`${idx + 1}. ${p}`, 16, currentY);
    currentY += 3.8;
  });
  currentY += 2;

  // A. Pilihan Ganda
  if (naskahSoal.soalPilihanGanda.length > 0) {
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('A. PILIHAN GANDA', 14, currentY);
    currentY += 4;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.text('Petunjuk: Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!', 14, currentY);
    currentY += 5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8.5);

    naskahSoal.soalPilihanGanda.forEach((soal) => {
      if (currentY > 260) {
        pdf.addPage();
        currentY = 20;
      }
      const qLines = pdf.splitTextToSize(`${soal.nomor}. ${soal.pertanyaan}`, pageWidth - 28);
      pdf.text(qLines, 14, currentY);
      currentY += qLines.length * 4.2;

      // Pilihan
      soal.pilihan.forEach((p) => {
        if (currentY > 275) {
          pdf.addPage();
          currentY = 20;
        }
        const optLines = pdf.splitTextToSize(`${p.kunci}. ${p.teks}`, pageWidth - 36);
        pdf.text(optLines, 20, currentY);
        currentY += optLines.length * 3.8;
      });
      currentY += 2.5;
    });
  }

  // B. Menjodohkan
  if (naskahSoal.soalMenjodohkan.length > 0) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('B. MENJODOHKAN', 14, currentY);
    currentY += 4;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.text('Petunjuk: Pasangkanlah butir pernyataan pada Kolom A dengan pilihan jawaban pada Kolom B!', 14, currentY);
    currentY += 5;

    naskahSoal.soalMenjodohkan.forEach((group) => {
      const rows = group.daftarPremis.map((p, idx) => {
        const resp = group.daftarPilihanRespon[idx];
        return [
          p.nomor,
          p.teks,
          '( ... )',
          resp ? `${resp.label}. ${resp.teks}` : '',
        ];
      });

      autoTable(pdf, {
        startY: currentY,
        head: [['No', 'KOLOM A (Pernyataan)', 'Jawaban', 'KOLOM B (Pilihan)']],
        body: rows,
        theme: 'grid',
        styles: { font: 'times', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 74 },
        },
      });

      currentY = (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 6 : currentY + 30;
    });
  }

  // C. Benar / Salah
  if (naskahSoal.soalBenarSalah.length > 0) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('C. BENAR / SALAH', 14, currentY);
    currentY += 4;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.text('Petunjuk: Berilah tanda centang (v) pada kolom B jika Benar, atau pada kolom S jika Salah!', 14, currentY);
    currentY += 5;

    const bsRows = naskahSoal.soalBenarSalah.map((b) => [b.nomor, b.pernyataan, '', '']);
    autoTable(pdf, {
      startY: currentY,
      head: [['No', 'Pernyataan Konsep', 'B', 'S']],
      body: bsRows,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 144 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
      },
    });

    currentY = (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 6 : currentY + 30;
  }

  // D. Isian Singkat
  if (naskahSoal.soalIsianSingkat.length > 0) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('D. ISIAN SINGKAT', 14, currentY);
    currentY += 4;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.text('Petunjuk: Isilah titik-titik berikut dengan jawaban yang singkat dan tepat!', 14, currentY);
    currentY += 5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8.5);

    naskahSoal.soalIsianSingkat.forEach((item) => {
      if (currentY > 265) {
        pdf.addPage();
        currentY = 20;
      }
      const lines = pdf.splitTextToSize(`${item.nomor}. ${item.pertanyaan}`, pageWidth - 28);
      pdf.text(lines, 14, currentY);
      currentY += lines.length * 4.2 + 2;
    });
  }

  // E. Uraian
  if (naskahSoal.soalUraian.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('E. URAIAN / ESAY', 14, currentY);
    currentY += 4;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.text('Petunjuk: Jawablah pertanyaan berikut dengan uraian yang lengkap dan jelas!', 14, currentY);
    currentY += 5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8.5);

    naskahSoal.soalUraian.forEach((item) => {
      if (currentY > 255) {
        pdf.addPage();
        currentY = 20;
      }
      const lines = pdf.splitTextToSize(`${item.nomor}. ${item.pertanyaan}`, pageWidth - 28);
      pdf.text(lines, 14, currentY);
      currentY += lines.length * 4.2 + 8;
      // Garis jawaban siswa
      pdf.setDrawColor(180, 180, 180);
      pdf.line(20, currentY, pageWidth - 14, currentY);
      currentY += 5;
      pdf.line(20, currentY, pageWidth - 14, currentY);
      currentY += 6;
      pdf.setDrawColor(0, 0, 0);
    });
  }

  // Salam Penutup (PADA NASKAH SOAL TIDAK ADA TANDA TANGAN!)
  if (currentY > 265) {
    pdf.addPage();
    currentY = 25;
  } else {
    currentY += 6;
  }
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(9);
  pdf.text('-- Selamat Mengerjakan & Semoga Sukses! --', centerX, currentY, { align: 'center' });

  // Page numbering in footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100);
    pdf.text(`Lembar Naskah Soal Siswa • Halaman ${i} dari ${totalPages}`, 14, pdf.internal.pageSize.height - 6);
  }

  const fileName = `Naskah_Soal_${jenisUjian.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.pdf`;
  pdf.save(fileName);
}

/**
 * Ekspor Kunci Jawaban & Pedoman Penskoran ke PDF menggunakan jsPDF & AutoTable (WAJIB PORTRAIT)
 * Mencakup KOP Resmi 4 Baris + Logo, Titik Dua Sejajar, Tabel Kunci, Rubrik Uraian, Rumus NA, dan Tanda Tangan Resmi
 */
export function exportKunciJawabanToPDF(doc: KisiKisiSoalDocument, layoutOptions?: PDFLayoutOptions): void {
  const orientation = 'portrait';
  const paperSize = layoutOptions?.paperSize || 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  });

  const { identitas, konfigurasi, pedomanPenskoran, naskahSoal, ringkasanDistribusi } = doc;
  const jenisUjian = (identitas.jenisUjian || konfigurasi.jenisAsesmen || 'Ujian Semester 1').toUpperCase();
  const kop1 = identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
  const kop2 = identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kop3 = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  const kop4 = identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah';

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const centerX = pageWidth / 2;

  // 1. Gambar Logo KOP Resmi
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      pdf.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', 14, 7, 20, 20);
    } catch (e) {
      console.warn('Gagal memuat logo KOP pada PDF Kunci:', e);
    }
  }

  // 2. KOP Resmi 4 Baris
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(kop1, centerX, 11, { align: 'center' });
  pdf.setFontSize(11.5);
  pdf.text(kop2, centerX, 16, { align: 'center' });
  pdf.setFontSize(13);
  pdf.text(kop3, centerX, 21.5, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  pdf.text(kop4, centerX, 26, { align: 'center' });

  // 3. Garis Double KOP
  pdf.setLineWidth(0.7);
  pdf.line(14, 28.5, pageWidth - 14, 28.5);
  pdf.setLineWidth(0.2);
  pdf.line(14, 29.3, pageWidth - 14, 29.3);

  // 4. Judul Dokumen
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.text('KUNCI JAWABAN & PEDOMAN PENSKORAN', centerX, 35, { align: 'center' });
  pdf.setFontSize(9.5);
  pdf.text(`${jenisUjian} • TAHUN PELAJARAN ${identitas.tahunPelajaran}`, centerX, 40, { align: 'center' });

  // 5. Tabel Identitas Dokumen (Titik Dua Sejajar)
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('Satuan Pendidikan', 14, 46.5);
  pdf.text('Fase / Kelas', 14, 50.5);
  pdf.text('Semester / Th. Pelajaran', 14, 54.5);

  pdf.setFont('times', 'normal');
  pdf.text(':', 48, 46.5);
  pdf.text(':', 48, 50.5);
  pdf.text(':', 48, 54.5);

  pdf.text(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 51, 46.5);
  pdf.text(`${identitas.fase} / Kelas ${identitas.kelas}`, 51, 50.5);
  pdf.text(`${identitas.semester} / ${identitas.tahunPelajaran}`, 51, 54.5);

  pdf.setFont('times', 'bold');
  pdf.text('Mata Pelajaran', 125, 46.5);
  pdf.text('Bentuk Asesmen', 125, 50.5);
  pdf.text('Total Soal / Skor Maks', 125, 54.5);

  pdf.setFont('times', 'normal');
  pdf.text(':', 162, 46.5);
  pdf.text(':', 162, 50.5);
  pdf.text(':', 162, 54.5);

  pdf.setFont('times', 'bold');
  pdf.text(identitas.mataPelajaran, 165, 46.5);
  pdf.setFont('times', 'normal');
  pdf.text(konfigurasi.jenisAsesmen, 165, 50.5);
  pdf.text(`${ringkasanDistribusi.totalSoal} Butir / ${ringkasanDistribusi.totalSkorMaksimal}`, 165, 54.5);

  let currentY = 59;

  // 6. Tabel Master Kunci Jawaban
  const keyRows = pedomanPenskoran.map((item, idx) => [
    idx + 1,
    item.nomorSoalDisplay,
    item.bentukSoal,
    item.kunciJawabanSingkat,
    item.bobotSkor,
  ]);

  autoTable(pdf, {
    startY: currentY,
    head: [['No', 'Nomor Soal', 'Bentuk Soal', 'Kunci Jawaban Singkat / Acuan', 'Bobot Skor']],
    body: keyRows,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 92 },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
    },
  });

  currentY = (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 6 : currentY + 40;

  // 7. Rubrik Uraian jika ada
  if (naskahSoal.soalUraian.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9.5);
    pdf.text('PEDOMAN PENSKORAN & RUBRIK SOAL URAIAN:', 14, currentY);
    currentY += 4;

    naskahSoal.soalUraian.forEach((u) => {
      if (currentY > 240) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.setFont('times', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(`Soal Uraian No. ${u.nomor}: ${u.pertanyaan}`, 14, currentY);
      currentY += 4;
      pdf.setFont('times', 'normal');
      pdf.text(`Kunci Jawaban Ideal: ${u.kunciJawaban}`, 14, currentY);
      currentY += 4;

      const rubrikRows = u.pedomanPenskoran.map((p) => [p.kriteria, p.skorMaks]);
      autoTable(pdf, {
        startY: currentY,
        head: [['Kriteria Penskoran', 'Skor Maksimal']],
        body: rubrikRows,
        theme: 'grid',
        styles: { font: 'times', fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 145 },
          1: { cellWidth: 37, halign: 'center', fontStyle: 'bold' },
        },
      });
      currentY = (pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY + 4 : currentY + 20;
    });
  }

  // 8. Box Rumus Nilai Akhir (NA)
  if (currentY > 245) {
    pdf.addPage();
    currentY = 20;
  }
  pdf.setDrawColor(180, 180, 180);
  pdf.setFillColor(250, 250, 250);
  pdf.rect(14, currentY, pageWidth - 28, 14, 'FD');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RUMUS PERHITUNGAN NILAI AKHIR (NA):', 17, currentY + 4.5);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Nilai Akhir (NA) = ( Total Skor Perolehan / Total Skor Maksimal [${ringkasanDistribusi.totalSkorMaksimal}] ) × 100`, 17, currentY + 10);
  currentY += 20;

  // 9. Tanda Tangan Resmi Akademis
  if (currentY > 240) {
    pdf.addPage();
    currentY = 20;
  }
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9.5);

  // Kiri: Mengetahui Kepala Sekolah
  pdf.text('Mengetahui,', 45, currentY, { align: 'center' });
  pdf.text('Kepala Satuan Pendidikan', 45, currentY + 4.5, { align: 'center' });
  pdf.setFont('times', 'bold');
  pdf.text(identitas.namaKepalaSekolah || '...........................................', 45, currentY + 22, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(`NIP. ${identitas.nipKepalaSekolah || '...........................................'}`, 45, currentY + 26.5, { align: 'center' });

  // Kanan: Tempat, Tanggal & Guru
  const tglStr = formatTitimangsaDokumen(identitas.tempatPenetapan, konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan);
  pdf.text(tglStr, 155, currentY, { align: 'center' });
  pdf.text(identitas.peranGuru || 'Guru Mata Pelajaran / Kelas', 155, currentY + 4.5, { align: 'center' });
  pdf.setFont('times', 'bold');
  pdf.text(identitas.namaGuru || '...........................................', 155, currentY + 22, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.text(`NIP. ${identitas.nipGuru || '...........................................'}`, 155, currentY + 26.5, { align: 'center' });

  // Page numbering in footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100);
    pdf.text(`Kunci Jawaban & Pedoman Penskoran • Halaman ${i} dari ${totalPages}`, 14, pdf.internal.pageSize.height - 6);
  }

  const fileName = `Kunci_Jawaban_${jenisUjian.replace(/\s+/g, '_')}_${identitas.mataPelajaran}_Kelas_${identitas.kelas}.pdf`;
  pdf.save(fileName);
}

