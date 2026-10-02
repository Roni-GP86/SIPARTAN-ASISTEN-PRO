import re

def rewrite_pdf_exports():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    rpm_start = content.find('export function exportRPMToPDF(modul: ModulAjarDocument) {')
    helpers_start = content.find('// HELPER FUNCTIONS FOR PDF STYLING', rpm_start)
    if helpers_start == -1 or rpm_start == -1:
        print("Could not find bounds")
        return

    new_exports = r"""export function exportRPMToPDF(modul: ModulAjarDocument) {
  const {
    identitas,
    judulModul,
    elemen,
    topikMateri,
    alokasiWaktuPertemuan,
  } = modul;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setLineHeightFactor(1.5); // Set jarak baris (line spacing) 1.5

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 16;

  const docJudul = judulModul || 'RENCANA PEMBELAJARAN MENDALAM';
  const topikVal = topikMateri || '-';
  const elemenVal = elemen || (modul as any).elemen || '-';
  const alokasiVal = alokasiWaktuPertemuan || identitas.alokasiWaktuModul || '2 x 35 Menit (1 kali pertemuan)';

  // Title Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(docJudul.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  const { idData, dsData, lpData, asData, rbData, lkData, soData } = normalizeRPMData(modul, {
    alokasiWaktu: alokasiVal,
    topikMateri: topikVal,
  });

  const sectionStyles = { font: 'times', fontSize: 11, cellPadding: 3, textColor: [0, 0, 0] };
  const headStyles = { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 };
  
  // A. INFORMASI UMUM / IDENTITAS
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['A. INFORMASI UMUM / IDENTITAS']],
    body: [
      [`Judul Modul: ${docJudul}\nPenyusun: ${identitas.namaGuru || '-'}\nNama Sekolah: ${identitas.namaSatuanPendidikan || '-'}\nTahun Pelajaran / Semester: ${identitas.tahunPelajaran} / Semester ${identitas.semester}\nJenjang / Fase / Kelas: SD / ${identitas.fase} / Kelas ${identitas.kelas}\nMata Pelajaran: ${identitas.mataPelajaran}\nElemen: ${elemenVal}\nTopik / Materi: ${topikVal}\nAlokasi Waktu: ${alokasiVal}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // B. IDENTIFIKASI
  const bBody = [
    [{ content: '1. Identifikasi Murid:', styles: { fontStyle: 'bold' } }],
    [`(a) Kompetensi Awal: ${idData.kompetensiAwal}\n(b) Karakteristik Murid: ${idData.karakteristikMurid.join(', ')}${idData.karakteristikMuridCustom ? ` (${idData.karakteristikMuridCustom})` : ''}\n(c) Kebutuhan Murid: ${idData.kebutuhanMurid}`],
    [{ content: '2. Karakteristik Materi:', styles: { fontStyle: 'bold' } }],
    [`${idData.karakteristikMateri}`],
    [{ content: '3. Dimensi Profil Lulusan:', styles: { fontStyle: 'bold' } }],
    [`${idData.dimensiProfilLulusan.map((d:string) => `• ${d}`).join('\n')}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['B. IDENTIFIKASI']],
    body: bBody,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // C. DESAIN PEMBELAJARAN
  let dsRows: any[] = [];
  
  dsRows.push([{ content: '1. Capaian Pembelajaran:', styles: { fontStyle: 'bold' } }]);
  let cpText = '';
  if (dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0) {
    dsData.capaianPembelajaranPerElemen.forEach((item:any) => {
      cpText += `Elemen: ${item.elemen}\n${item.capaianPembelajaran}\n\n`;
    });
  } else {
    cpText += dsData.capaianPembelajaran;
  }
  dsRows.push([cpText.trim()]);
  
  dsRows.push([{ content: '2. Tujuan Pembelajaran:', styles: { fontStyle: 'bold' } }]);
  dsRows.push([`${dsData.tujuanPembelajaran}`]);
  
  dsRows.push([{ content: '3. Praktik Pedagogis:', styles: { fontStyle: 'bold' } }]);
  let pText = `Metode: ${dsData.praktikPedagogis.metodePembelajaran.join(', ')}\n`;
  pText += `Pendekatan: ${dsData.praktikPedagogis.pendekatanPembelajaran}\n`;
  pText += `Model: ${dsData.praktikPedagogis.modelPembelajaran}`;
  dsRows.push([pText]);

  dsRows.push([{ content: '4. Lingkungan Belajar:', styles: { fontStyle: 'bold' } }]);
  let envText = `Lingkungan Fisik: ${dsData.lingkunganBelajar.lingkunganFisik.join(', ')}\n`;
  envText += `Deskripsi Fisik: ${dsData.lingkunganBelajar.lingkunganFisikDeskripsi}\n`;
  envText += `Budaya Belajar: ${dsData.lingkunganBelajar.budayaBelajar.join(', ')}`;
  dsRows.push([envText]);

  dsRows.push([{ content: '5. Mitra Pembelajaran:', styles: { fontStyle: 'bold' } }]);
  let mtText = `Mitra Internal: ${dsData.mitraPembelajaran.mitraInternal.join(', ')}\n`;
  mtText += `Mitra Eksternal: ${dsData.mitraPembelajaran.mitraEksternal.join(', ')}`;
  dsRows.push([mtText]);

  dsRows.push([{ content: '6. Pemanfaatan Teknologi Digital:', styles: { fontStyle: 'bold' } }]);
  let techText = `Platform/Aplikasi: ${dsData.pemanfaatanTeknologi?.platformAplikasi?.join(', ') || '-'}\n`;
  techText += `Perangkat Digital: ${dsData.pemanfaatanTeknologi?.perangkatDigital?.join(', ') || '-'}\n`;
  techText += `Media Digital: ${dsData.pemanfaatanTeknologi?.mediaDigital?.join(', ') || '-'}`;
  dsRows.push([techText]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['C. DESAIN PEMBELAJARAN']],
    body: dsRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // D. LANGKAH PEMBELAJARAN
  let pRows = [];
  pRows.push([{ content: `1. Kegiatan Awal (${lpData.kegiatanAwal.alokasiMenit}):`, styles: { fontStyle: 'bold' } }]);
  pRows.push([`${lpData.kegiatanAwal.deskripsi}\n${lpData.kegiatanAwal.poinAktivitas.map((x: string) => `• ${x}`).join('\n')}`]);
  
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`D. LANGKAH PEMBELAJARAN (Total Waktu: ${lpData.alokasiWaktuTotal})`]],
    body: pRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY;

  let intiRows = lpData.kegiatanInti.sintaks.map((ki: any) => [
    `Tahap ${ki.tahapKe}:\n${ki.faseSintaks}`,
    ki.aktivitas,
    `[ PENGALAMAN BELAJAR ]\n${ki.pengalamanBelajar || '-'}\n\n[ PRINSIP PEMBELAJARAN ]\n${ki.prinsipPembelajaran || '-'}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}`, '', '']],
    body: [['Fase Sintaks', 'Aktivitas Utama', 'Prinsip & Pengalaman Belajar'], ...intiRows],
    theme: 'grid',
    headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
    styles: { font: 'times', fontSize: 11, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 55, fillColor: [245, 247, 250] },
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY;
  
  let endRows = [];
  endRows.push([{ content: `3. Kegiatan Akhir (${lpData.kegiatanAkhir.alokasiMenit}):`, styles: { fontStyle: 'bold' } }]);
  endRows.push([`${lpData.kegiatanAkhir.deskripsi}\n${lpData.kegiatanAkhir.poinAktivitas.map((x: string) => `• ${x}`).join('\n')}`]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: endRows,
    theme: 'grid',
    styles: sectionStyles as any,
    showHead: 'never',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // E. ASESMEN & RUBRIK
  const asRows = [
    [{ content: '1. Asesmen Diagnostik (Awal):', styles: { fontStyle: 'bold' } }],
    [`Bentuk/Teknik: ${asData.diagnostik.bentukTeknik}\nCara/Sumber: ${asData.diagnostik.caraSumber}`],
    [{ content: '2. Asesmen Formatif (Proses):', styles: { fontStyle: 'bold' } }],
    [`Bentuk/Teknik: ${asData.formatif.bentukTeknik}\nCara/Sumber: ${asData.formatif.caraSumber}`],
    [{ content: '3. Asesmen Sumatif (Akhir):', styles: { fontStyle: 'bold' } }],
    [`Bentuk/Teknik: ${asData.sumatif.bentukTeknik}\nCara/Sumber: ${asData.sumatif.caraSumber}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['E. ASESMEN PEMBELAJARAN']],
    body: asRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Rubrik
  const rRows = rbData.map((k: any) => [k.aspek, k.baruBerkembang, k.layak, k.cakap, k.mahir]);
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Aspek Penilaian', 'Baru Berkembang (1)', 'Layak (2)', 'Cakap (3)', 'Mahir (4)']],
    body: rRows,
    theme: 'grid',
    headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 10, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
    styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // F. PENGAYAAN, REMEDIAL & REFLEKSI
  const fRows = [
    [{ content: 'Pengayaan:', styles: { fontStyle: 'bold' } }],
    [`${modul.pengayaanDanRemedial?.pengayaan || '-'}`],
    [{ content: 'Remedial:', styles: { fontStyle: 'bold' } }],
    [`${modul.pengayaanDanRemedial?.remedial || '-'}`],
    [{ content: 'Refleksi Guru:', styles: { fontStyle: 'bold' } }],
    [`${(modul.refleksi?.refleksiGuru || []).map((x: string) => `• ${x}`).join('\n')}`],
    [{ content: 'Refleksi Murid:', styles: { fontStyle: 'bold' } }],
    [`${(modul.refleksi?.refleksiSiswa || []).map((x: string) => `• ${x}`).join('\n')}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['F. PENGAYAAN, REMEDIAL & REFLEKSI']],
    body: fRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Signatures
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  renderSignatures(doc, identitas, currentY, pageWidth, margin);

  // LKPD
  if (lkData && lkData.judulLKPD) {
    doc.addPage();
    currentY = 16;
    let lkRows = [
      [{ content: 'Petunjuk Kerja:', styles: { fontStyle: 'bold' } }],
      [`${(lkData.petunjuk || []).map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`],
      [{ content: 'Langkah Kerja Awal:', styles: { fontStyle: 'bold' } }],
      [`${(lkData.langkahKerjaAwal || []).map((l: any, i: number) => `${i+1}. ${l.judulLangkah}\n   ${l.instruksi}`).join('\n')}`],
      [{ content: `Kegiatan Kelompok (${lkData.kegiatanKelompokJudul || ''}):`, styles: { fontStyle: 'bold' } }],
      [`${lkData.kegiatanKelompokInstruksi || ''}`],
      [{ content: 'Pertanyaan Analisis:', styles: { fontStyle: 'bold' } }],
      [`${(lkData.pertanyaanAnalisis || []).map((p: any, i: number) => `${i+1}. ${p.pertanyaan}`).join('\n')}`],
      [{ content: 'Refleksi Diri:', styles: { fontStyle: 'bold' } }],
      [`${(lkData.refleksiDiriKelompok || []).map((r: any, i: number) => `${i+1}. ${r.pertanyaan}`).join('\n')}`]
    ];
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`LAMPIRAN: LKPD - ${lkData.judulLKPD || 'Lembar Kerja'}`]],
      body: lkRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
  }

  // Evaluasi
  if (soData && soData.length > 0) {
    doc.addPage();
    currentY = 16;
    let evRows = soData.map((s: any) => {
      let txt = `${s.nomor}. ${s.pertanyaan}`;
      if (s.pilihanGanda && s.pilihanGanda.length > 0) {
        txt += `\n${s.pilihanGanda.join('\n')}`;
      }
      txt += `\n\nKunci Jawaban: ${s.kunciJawaban}`;
      return [txt];
    });
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['LAMPIRAN: EVALUASI SUMATIF']],
      body: evRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
  }

  addCleanPageNumbers(doc);
  const kelasSlug = identitas.kelas ? `_Kelas_${String(identitas.kelas).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  doc.save(`RPM_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.fase}${kelasSlug}.pdf`);
}

export function exportModulAjarToPDF(modul: ModulAjarDocument) {
  if (modul.identifikasiRPM || modul.desainPembelajaranRPM || modul.langkahPembelajaranRPM) {
    exportRPMToPDF(modul);
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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setLineHeightFactor(1.5); // Set jarak baris 1.5

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 16;

  // Title Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('MODUL AJAR KURIKULUM MERDEKA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.setFontSize(11);
  doc.text(`MATA PELAJARAN: ${identitas.mataPelajaran.toUpperCase()} (${identitas.fase} - KELAS ${identitas.kelas})`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  const sectionStyles = { font: 'times', fontSize: 11, cellPadding: 3, textColor: [0, 0, 0] };
  const headStyles = { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 };

  // I. INFORMASI UMUM
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['I. INFORMASI UMUM']],
    body: [
      [{ content: 'Identitas Sekolah:', styles: { fontStyle: 'bold' } }],
      [`Satuan Pendidikan: ${identitas.namaSatuanPendidikan || '-'}\nPenyusun: ${identitas.namaGuru || '-'}\nTahun / Semester: ${identitas.tahunPelajaran} / Semester ${identitas.semester}\nJenjang / Fase / Kelas: SD / ${identitas.fase} / Kelas ${identitas.kelas}\nAlokasi Waktu Modul: ${identitas.alokasiWaktuModul}\nTarget Murid: ${identitas.targetPesertaDidik}\nModa Pembelajaran: ${identitas.modaPembelajaran || '-'}\nModel Pembelajaran: ${modelPembelajaran}`],
      [{ content: 'Kompetensi Awal:', styles: { fontStyle: 'bold' } }],
      [`${(kompetensiAwal||[]).map((k: string) => `• ${k}`).join('\n')}`],
      [{ content: 'Profil Pelajar Pancasila:', styles: { fontStyle: 'bold' } }],
      [`${(profilPelajarPancasila||[]).map((p: string) => `• ${p}`).join('\n')}`],
      [{ content: 'Sarana dan Prasarana:', styles: { fontStyle: 'bold' } }],
      [`Media Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
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
      [{ content: 'A. Tujuan Pembelajaran Spesifik:', styles: { fontStyle: 'bold' } }],
      [`${(tujuanPembelajaranSpesifik||[]).map((t: string) => `• ${t}`).join('\n')}`],
      [{ content: 'B. Pemahaman Bermakna:', styles: { fontStyle: 'bold' } }],
      [`${(pemahamanBermakna||[]).map((p: string) => `• ${p}`).join('\n')}`],
      [{ content: 'C. Pertanyaan Pemantik:', styles: { fontStyle: 'bold' } }],
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
    let pRows = [];
    pRows.push([{ content: '1. Pendahuluan:', styles: { fontStyle: 'bold' } }]);
    pRows.push([`${(pert.pendahuluan||[]).map((x: string) => `• ${x}`).join('\n')}`]);
    
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`D. KEGIATAN PEMBELAJARAN (Pertemuan ${pert.pertemuanKe}) - ${pert.alokasiWaktu}`]],
      body: pRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY;

    let intiRows = pert.kegiatanInti.map((ki: any) => [
      ki.faseSintaks, 
      `Guru:\n${ki.aktivitasGuru}\n\nMurid:\n${ki.aktivitasSiswa}`,
      `[ PENGALAMAN BELAJAR ]\n${ki.pengalamanBelajar || '-'}\n\n[ PRINSIP PEMBELAJARAN ]\n${ki.prinsipPembelajaran || '-'}`
    ]);
    
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['2. Kegiatan Inti', '', '']],
      body: [['Fase Sintaks', 'Aktivitas Utama', 'Prinsip & Pengalaman Belajar'], ...intiRows],
      theme: 'grid',
      headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
      styles: { font: 'times', fontSize: 11, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 55, fillColor: [245, 247, 250] },
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY;

    let endRows = [];
    endRows.push([{ content: '3. Penutup:', styles: { fontStyle: 'bold' } }]);
    endRows.push([`${(pert.penutup||[]).map((x: string) => `• ${x}`).join('\n')}`]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: endRows,
      theme: 'grid',
      styles: sectionStyles as any,
      showHead: 'never',
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
      [{ content: '1. Asesmen Diagnostik (Awal):', styles: { fontStyle: 'bold' } }],
      [`Teknik: ${asesmen.diagnostik.teknik}\n${(asesmen.diagnostik.daftarPertanyaan||[]).map((q: string) => `• ${q}`).join('\n')}`],
      [{ content: '2. Asesmen Formatif (Proses):', styles: { fontStyle: 'bold' } }],
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
    headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 10, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2, halign: 'center' },
    styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
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
      [{ content: 'Pengayaan:', styles: { fontStyle: 'bold' } }],
      [`${pengayaanDanRemedial?.pengayaan || '-'}`],
      [{ content: 'Remedial:', styles: { fontStyle: 'bold' } }],
      [`${pengayaanDanRemedial?.remedial || '-'}`],
      [{ content: 'Refleksi Guru:', styles: { fontStyle: 'bold' } }],
      [`${(refleksi?.refleksiGuru || []).map((x: string) => `• ${x}`).join('\n')}`],
      [{ content: 'Refleksi Murid:', styles: { fontStyle: 'bold' } }],
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
      [{ content: 'Tujuan Kegiatan:', styles: { fontStyle: 'bold' } }],
      [`${lk.tujuanKegiatan}`],
      [{ content: 'Alat & Bahan:', styles: { fontStyle: 'bold' } }],
      [`${(lk.alatBahan || []).map((a: string) => `• ${a}`).join('\n')}`],
      [{ content: 'Langkah Kerja:', styles: { fontStyle: 'bold' } }],
      [`${(lk.langkahKerja || []).map((l: string, i: number) => `${i+1}. ${l}`).join('\n')}`],
      [{ content: 'Pertanyaan Diskusi:', styles: { fontStyle: 'bold' } }],
      [`${(lk.pertanyaanDiskusi || []).map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`]
    ];
    if (lk.kesimpulanPrompt) {
      lkRows.push([{ content: 'Kesimpulan:', styles: { fontStyle: 'bold' } }]);
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
"""

    final_content = content[:rpm_start] + new_exports + "\n" + content[helpers_start:]
    
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(final_content)
        
rewrite_pdf_exports()
