import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccessRecord } from '../types';

export interface UserAccessPdfOptions {
  schoolName: string;
  records: AccessRecord[];
  reportDate?: string;
  adminName?: string;
  adminNip?: string;
  logoBase64?: string;
}

/**
 * Menghasilkan Dokumen PDF Resmi Rekapitulasi Kode Akses & Hak Penugasan Pendidik
 * berdasarkan pilihan Satuan Pendidikan / Sekolah oleh Administrator.
 */
export function generateUserAccessListPDF(options: UserAccessPdfOptions): void {
  const {
    schoolName,
    records,
    reportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    adminName = 'Roni Hariyanto Bhidju, S.Pd',
    adminNip = '198603012020121005',
    logoBase64,
  } = options;

  // Menggunakan orientasi Landscape (A4: 297mm x 210mm) agar seluruh kolom tercakup rapi dan terbaca jelas
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const marginX = 14;
  let currentY = 11;
  const kopStartY = currentY;

  // ================= 1. LOGO KOP SURAT (JIKA DIUNGGAH) =================
  if (logoBase64) {
    try {
      const format = logoBase64.includes('image/png') ? 'PNG' : 'JPEG';
      // Posisi logo dinaikkan sedikit dan ukuran disesuaikan menjadi 16.5mm x 16.5mm agar proporsional dan tidak menyentuh garis kop
      doc.addImage(logoBase64, format, marginX + 3, kopStartY - 2.5, 16.5, 16.5);
    } catch (e) {
      console.warn('Gagal menambahkan logo ke PDF:', e);
    }
  }

  // ================= KOP SURAT RESMI PEMDA TTU =================
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KABUPATEN TIMOR TENGAH UTARA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFontSize(13);
  const displaySchool = schoolName && schoolName !== 'ALL' && schoolName !== 'Semua Satuan Pendidikan'
    ? schoolName.toUpperCase()
    : 'SATUAN PENDIDIKAN TINGKAT DASAR (SD / MI)';
  doc.text(displaySchool, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text('Laman Resmi: SIPARTAN TTU (Sistem Perancang & Analisis Perangkat Ajar Kurikulum Merdeka) • Tahun 2026/2027', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Garis Pembatas Kop Surat (Double Line)
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.25);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // ================= 2. JUDUL DOKUMEN LAPORAN =================
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const title = `DAFTAR KODE AKSES RESMI & HAK PENUGASAN PENDIDIK SIPARTAN`;
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.text(`Rekapitulasi Hak Akses Multi-Perangkat dan Penguncian Identitas Pendidik • ${displaySchool}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  // ================= 3. PARAMETER & KEPALA SEKOLAH =================
  const firstRecord = records[0];
  const ksName = firstRecord?.namaKepalaSekolah && firstRecord.namaKepalaSekolah !== '-' ? firstRecord.namaKepalaSekolah : 'Darius Kusi, S.Pd.';
  const ksNip = firstRecord?.nipKepalaSekolah && firstRecord.nipKepalaSekolah !== '-' ? firstRecord.nipKepalaSekolah : '196709192008011008';
  const totalGuru = records.length;
  const totalAktif = records.filter((r) => r.isActive).length;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: 0.8,
      textColor: [20, 20, 20],
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 4 },
      2: { cellWidth: 95 },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { cellWidth: 4 },
      5: { cellWidth: 85 },
    },
    body: [
      ['Satuan Pendidikan', ':', displaySchool, 'Total Pendidik', ':', `${totalGuru} Guru Terdaftar (${totalAktif} Aktif)`],
      ['Kepala Sekolah', ':', `${ksName} (NIP: ${ksNip})`, 'Tanggal Cetak', ':', reportDate],
      ['Sistem Aplikasi', ':', 'SIPARTAN (BSKAP 046/2025 & Permen 13/2025)', 'Status Keamanan', ':', 'Kode Unik Rahasia (Terkunci ke Perangkat Guru)'],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // ================= 4. TABEL UTAMA KODE AKSES GURU =================
  const tableRows = records.map((r, index) => {
    let penugasan = r.jabatan === 'Guru Mata Pelajaran' ? 'Guru Mata Pelajaran' : 'Guru Kelas';
    let faseKelas = '';
    if (r.isPremiumMaster || r.isDemo) {
      faseKelas = 'Semua Fase (Kelas 1-6)';
    } else if (r.jabatan === 'Guru Mata Pelajaran') {
      faseKelas = 'Kelas 1 s.d. 6 (Fase A-C)';
    } else {
      faseKelas = `${r.fase || 'Fase C'} (Kelas ${r.kelas || '5 & 6'})`;
    }

    let mapel = r.mataPelajaran || 'Matematika';
    if (r.jabatan === 'Guru Kelas') {
      mapel = 'Mapel Umum Kelas';
    }

    const statusText = r.isActive ? 'AKTIF' : 'NONAKTIF';

    return [
      String(index + 1),
      r.kodeAkses,
      r.namaGuru,
      r.nipGuru && r.nipGuru !== '-' ? r.nipGuru : '-',
      penugasan,
      faseKelas,
      mapel,
      r.nomorHpPendaftar || '-',
      statusText,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'No.',
        'Kode Akses',
        'Nama Lengkap Guru & Gelar',
        'NIP Guru',
        'Jabatan',
        'Fase & Kelas',
        'Mata Pelajaran',
        'No. WhatsApp',
        'Status',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 21, 40], // Deep Navy SIPARTAN
      textColor: [255, 255, 255],
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [40, 50, 70],
    },
    styles: {
      font: 'times',
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [200, 205, 215],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center', fontStyle: 'bold', textColor: [15, 60, 150] }, // Highlight Kode Akses
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
      6: { cellWidth: 40 },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Pewarnaan status
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'AKTIF') {
          data.cell.styles.textColor = [22, 101, 52]; // Emerald dark
        } else {
          data.cell.styles.textColor = [185, 28, 28]; // Red dark
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Jika posisi Y terlalu mepet dengan batas bawah halaman (pageHeight = 210mm), buat halaman baru
  if (currentY + 42 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    currentY = 16;
  }

  // ================= 5. TANDA TANGAN HANYA OLEH PENGEMBANG (SEBELAH KANAN) =================
  const signatureX = pageWidth - marginX - 75; // Sisi Kanan Dokumen

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`Kefamenanu, ${reportDate}`, signatureX, currentY);
  currentY += 4.5;
  doc.text('Administrator & Pengembang SIPARTAN,', signatureX, currentY);

  currentY += 20; // Ruang Tanda Tangan

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(adminName, signatureX, currentY);
  currentY += 4.5;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${adminNip}`, signatureX, currentY);

  // ================= 6. CATATAN KERAHASIAAN & WATERMARK =================
  currentY += 8;
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(
    '* Catatan: Dokumen resmi rahasia internal SIPARTAN. Kode akses bersifat unik dan personal bagi masing-masing guru untuk masuk serta menyusun perangkat ajar di gawai masing-masing.',
    marginX,
    currentY
  );

  // ================= 7. SIMPAN / UNDUH FILE PDF =================
  const cleanFilename = `SIPARTAN_Daftar_Kode_Akses_${displaySchool.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(cleanFilename);
}
