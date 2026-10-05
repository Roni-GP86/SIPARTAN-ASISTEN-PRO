import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentInfo, ExamSubmission, ExamPackage, SchoolIdentity } from '../types';
import { getStudentList } from '../services/studentService';

export interface StudentExamReportData {
  identitas: SchoolIdentity;
  selectedPackage?: ExamPackage | null;
  students: StudentInfo[];
  submissions: ExamSubmission[];
  kktpThreshold?: number; // default 75
  reportTitle?: string;
  reportDate?: string;
}

/**
 * Menghasilkan Dokumen PDF Resmi dan Akademis untuk Rekapitulasi Hasil Ujian Peserta Didik CBT
 * SD Negeri Fatubai - Kelas 6.
 */
export function generateStudentExamReportPDF(data: StudentExamReportData): void {
  const {
    identitas,
    selectedPackage,
    students,
    submissions,
    kktpThreshold = 75,
    reportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 12;

  // ================= 1. KOP SURAT RESMI =================
  // Logo Resmi Satuan Pendidikan (jika diunggah guru/sekolah)
  if (identitas.logoUrl) {
    try {
      const isPng = identitas.logoUrl.includes('image/png');
      // Ukuran akademis proporsional: 20mm x 20mm
      doc.addImage(identitas.logoUrl, isPng ? 'PNG' : 'JPEG', marginX + 2, 10.5, 20, 20);
    } catch (e) {
      console.warn('Gagal memuat logo sekolah pada PDF Kop Surat:', e);
    }
  }

  // Baris 1: Pemerintah Kabupaten
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text(identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // Baris 2: Dinas Pendidikan dan Kebudayaan
  doc.text(identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Baris 3: Nama Satuan Pendidikan
  doc.setFontSize(14);
  const schoolName = (identitas.kopBaris3 || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();
  doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Baris 4: Alamat Lengkap Instansi
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  const alamat = identitas.kopBaris4 || (identitas.alamatInstansi ? (identitas.alamatInstansi.toLowerCase().startsWith('alamat:') ? identitas.alamatInstansi : `Alamat: ${identitas.alamatInstansi}`) : (identitas.namaSatuanPendidikan ? `Alamat: Lingkungan ${identitas.namaSatuanPendidikan}` : ''));
  if (alamat) {
    doc.text(alamat, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
  }
  doc.text(`Laman Resmi Asesmen CBT: SIPARTAN • Tahun Ajaran ${identitas.tahunPelajaran || '2026/2027'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Garis Pembatas Kop Surat (Double Line)
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.25);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 7;

  // ================= 2. JUDUL LAPORAN =================
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const title = selectedPackage
    ? `LAPORAN HASIL ASESMEN CBT: ${selectedPackage.judul.toUpperCase()}`
    : 'LAPORAN REKAPITULASI HASIL ASESMEN & EVALUASI BELAJAR (CBT)';
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(9.5);
  doc.setFont('times', 'italic');
  doc.text('Sistem Informasi Pembelajaran & Asesmen Terpadu (SIPARTAN)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // ================= 3. TABEL IDENTITAS & PARAMETER =================
  const mapel = selectedPackage?.mataPelajaran || identitas.mataPelajaran || 'Semua Mata Pelajaran';
  const kelas = `Kelas ${identitas.kelas || 'VI'} (${identitas.fase || 'Fase C'})`;
  const semester = identitas.semester || 'Semester I (Ganjil)';
  const tahun = identitas.tahunPelajaran || (identitas as any).tahunAjaran || '2026/2027';
  const guruNama = identitas.namaGuru || 'Yohanes Pantola, S.Pd.SD';

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 1,
      textColor: [20, 20, 20],
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 4 },
      2: { cellWidth: 55 },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 4 },
      5: { cellWidth: 55 },
    },
    body: [
      ['Satuan Pendidikan', ':', identitas.namaSatuanPendidikan || 'SD Negeri Fatubai', 'Tahun Pelajaran', ':', tahun],
      ['Mata Pelajaran', ':', mapel, 'Kelas / Fase', ':', kelas],
      ['Jenis Asesmen', ':', selectedPackage ? String(selectedPackage.jenisAsesmen || (selectedPackage as any).kategori || 'CBT').toUpperCase() : 'CBT Terpadu', 'Semester', ':', semester],
      ['KKTP Minimal', ':', `${kktpThreshold} (Skala 100)`, 'Guru Pengampu', ':', guruNama],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ================= 4. PENYUSUNAN DATA SISWA =================
  let totalScore = 0;
  let highestScore = 0;
  let lowestScore = 100;
  let completedCount = 0;
  let passedCount = 0;

  // Pastikan daftar siswa terisi (gunakan students yang diberikan atau fallback ke getStudentList)
  let rosterList: StudentInfo[] = students && students.length > 0 ? [...students] : getStudentList();
  
  // Tambahkan siswa dari submissions jika ada nama yang belum ada di daftar roster
  const existingNames = new Set(rosterList.map((s) => s.nama.trim().toLowerCase()));
  submissions.forEach((sub, subIdx) => {
    const sName = (sub.namaSiswa || (sub as any).siswaNama || '').trim();
    if (sName && !existingNames.has(sName.toLowerCase())) {
      existingNames.add(sName.toLowerCase());
      rosterList.push({
        id: `std-extra-${subIdx}`,
        nama: sName,
        nisn: sub.nisn || (sub as any).siswaNisn || '-',
        nis: sub.nisn || (sub as any).siswaNisn || '-',
      });
    }
  });

  const tableBody = rosterList.map((stu, index) => {
    // Cari submission siswa
    const stuSubs = submissions.filter(
      (sub) =>
        (sub.nisn && sub.nisn === stu.nisn) ||
        (sub.namaSiswa && sub.namaSiswa.trim().toLowerCase() === stu.nama.trim().toLowerCase()) ||
        ((sub as any).siswaNisn === stu.nisn) ||
        ((sub as any).siswaNama && (sub as any).siswaNama.trim().toLowerCase() === stu.nama.trim().toLowerCase())
    );

    // Filter package jika dipilih
    const relevantSubs = selectedPackage
      ? stuSubs.filter((sub) => (sub.paketId || (sub as any).packageId) === selectedPackage.id)
      : stuSubs;

    const latestSub = relevantSubs.length > 0 ? relevantSubs[0] : null;

    let scoreStr = '-';
    let predikatStr = 'Belum Ujian';
    let statusKKTP = 'Belum Mengerjakan';
    let waktuStr = '-';

    if (latestSub) {
      completedCount++;
      const score = Math.round(latestSub.nilaiAkhir);
      totalScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;

      scoreStr = `${score}`;

      if (score >= kktpThreshold) {
        passedCount++;
        statusKKTP = 'TUNTAS';
      } else {
        statusKKTP = 'BELUM TUNTAS';
      }

      if (score >= 90) predikatStr = 'Sangat Baik (A)';
      else if (score >= 80) predikatStr = 'Baik (B)';
      else if (score >= 70) predikatStr = 'Cukup (C)';
      else predikatStr = 'Perlu Bimbingan (D)';

      try {
        const d = new Date(latestSub.submittedAt || (latestSub as any).waktuKirim || Date.now());
        waktuStr = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        waktuStr = 'Terkirim';
      }
    }

    return [
      (index + 1).toString(),
      stu.nisn || stu.nis || '-',
      stu.nama,
      scoreStr,
      predikatStr,
      statusKKTP,
      waktuStr,
    ];
  });

  const avgScore = completedCount > 0 ? Math.round((totalScore / completedCount) * 10) / 10 : 0;
  const passPercentage = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;
  if (completedCount === 0) lowestScore = 0;

  // Render Tabel Siswa
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'No',
        'NISN / NIS',
        'Nama Lengkap Murid (SDN Fatubai)',
        'Nilai',
        'Predikat Capaian',
        'Status KKTP',
        'Waktu Selesai',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: 2,
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      textColor: [20, 20, 20],
    },
    headStyles: {
      fillColor: [14, 27, 56], // Royal Deep Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, halign: 'center', font: 'courier' },
      2: { cellWidth: 64, fontStyle: 'bold' },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 23, halign: 'center', fontSize: 7.5 },
    },
    didParseCell: (hookData) => {
      // Pewarnaan status KKTP
      if (hookData.section === 'body' && hookData.column.index === 5) {
        const val = hookData.cell.raw;
        if (val === 'TUNTAS') {
          hookData.cell.styles.textColor = [16, 120, 70];
          hookData.cell.styles.fontStyle = 'bold';
        } else if (val === 'BELUM TUNTAS') {
          hookData.cell.styles.textColor = [185, 28, 28];
          hookData.cell.styles.fontStyle = 'bold';
        } else {
          hookData.cell.styles.textColor = [120, 120, 120];
        }
      }
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const val = hookData.cell.raw;
        if (val !== '-') {
          const num = Number(val);
          if (num >= kktpThreshold) {
            hookData.cell.styles.textColor = [14, 110, 60];
          } else {
            hookData.cell.styles.textColor = [190, 25, 25];
          }
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ================= 5. REKAPITULASI STATISTIK KELAS =================
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('REKAPITULASI HASIL EVALUASI KLASIKAL:', marginX, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [40, 60, 100],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    head: [
      [
        'Total Siswa',
        'Sudah Mengerjakan',
        'Belum Mengerjakan',
        'Tuntas KKTP',
        'Belum Tuntas',
        'Nilai Rata-rata',
        'Tertinggi',
        'Terendah',
        '% Ketuntasan',
      ],
    ],
    body: [
      [
        `${rosterList.length} Siswa`,
        `${completedCount} Siswa`,
        `${Math.max(0, rosterList.length - completedCount)} Siswa`,
        `${passedCount} Siswa`,
        `${completedCount - passedCount} Siswa`,
        avgScore > 0 ? `${avgScore}` : '-',
        highestScore > 0 ? `${highestScore}` : '-',
        lowestScore > 0 ? `${lowestScore}` : '-',
        `${passPercentage}%`,
      ],
    ],
    bodyStyles: {
      halign: 'center',
      fontStyle: 'bold',
      textColor: [20, 20, 20],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ================= 6. LEMBAR PENGESAHAN & TANDA TANGAN =================
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 15;
  }

  const signColWidth = 75;
  const leftX = marginX + 5;
  const rightX = pageWidth - marginX - signColWidth;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);

  // Tempat dan tanggal penetapan dokumen
  const tempatCetak = identitas.tempatPenetapan || (identitas.namaSatuanPendidikan ? identitas.namaSatuanPendidikan.replace(/UPTD?\s*|SD\s*Negeri\s*|SDN\s*|SD\s*|SMP\s*Negeri\s*|SMP\s*|SMA\s*|SMK\s*|Swasta\s*/gi, '').trim() : '........................');
  doc.text(`${tempatCetak}, ${reportDate}`, rightX, currentY);
  currentY += 5;

  doc.text('Mengetahui,', leftX, currentY);
  doc.text(`${identitas.peranGuru || 'Guru Kelas'},`, rightX, currentY);
  currentY += 4.5;

  doc.text(`Kepala ${identitas.namaSatuanPendidikan || 'Satuan Pendidikan'}`, leftX, currentY);
  doc.text(identitas.namaSatuanPendidikan || 'Satuan Pendidikan', rightX, currentY);

  // Spasi tanda tangan
  currentY += 24;

  const ksNama = identitas.namaKepalaSekolah && identitas.namaKepalaSekolah !== '-' ? identitas.namaKepalaSekolah : '...........................................';
  const ksNip = identitas.nipKepalaSekolah && identitas.nipKepalaSekolah !== '-' ? identitas.nipKepalaSekolah : '-';
  const grNama = identitas.namaGuru && identitas.namaGuru !== '-' ? identitas.namaGuru : '...........................................';
  const grNip = identitas.nipGuru && identitas.nipGuru !== '-' ? identitas.nipGuru : '-';

  doc.setFont('times', 'bold');
  doc.text(ksNama, leftX, currentY);
  doc.text(grNama, rightX, currentY);

  // Garis bawah tanda tangan
  doc.setLineWidth(0.3);
  doc.line(leftX, currentY + 1, leftX + signColWidth - 10, currentY + 1);
  doc.line(rightX, currentY + 1, rightX + signColWidth - 5, currentY + 1);
  currentY += 4.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${ksNip}`, leftX, currentY);
  doc.text(`NIP. ${grNip}`, rightX, currentY);

  // Footer Dokumen
  doc.setFontSize(7.5);
  doc.setFont('times', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Dicetak otomatis melalui Aplikasi SIPARTAN ${identitas.namaSatuanPendidikan || ''} pada ${new Date().toLocaleString('id-ID')}`,
    marginX,
    pageHeight - 8
  );

  // Simpan file
  const safeSchoolName = (identitas.namaSatuanPendidikan || 'Sekolah').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = selectedPackage
    ? `Laporan_CBT_${selectedPackage.judul.replace(/[^a-zA-Z0-9_-]/g, '_')}_${safeSchoolName}.pdf`
    : `Laporan_Hasil_Asesmen_Siswa_${safeSchoolName}.pdf`;

  doc.save(filename);
}
