import re
import sys

def rewrite_pdf_exports():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    rpm_start = content.find('export function exportRPMToPDF(modul: ModulAjarDocument) {')
    helpers_start = content.find('// HELPER FUNCTIONS FOR PDF STYLING', rpm_start)
    if helpers_start == -1:
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
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // B. IDENTIFIKASI
  const bBody = [
    [`1. Identifikasi Peserta Didik:\n(a) Kompetensi Awal: ${idData.kompetensiAwal}\n(b) Karakteristik: ${idData.karakteristikMurid.join(', ')}${idData.karakteristikMuridCustom ? ` (${idData.karakteristikMuridCustom})` : ''}\n(c) Kebutuhan Murid: ${idData.kebutuhanMurid}`],
    [`2. Karakteristik Materi:\n${idData.karakteristikMateri}`],
    [`3. Dimensi Profil Lulusan:\n${idData.dimensiProfilLulusan.map((d:string) => `• ${d}`).join('\n')}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['B. IDENTIFIKASI']],
    body: bBody,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // C. DESAIN PEMBELAJARAN
  let dsRows: string[][] = [];
  
  let cpText = '1. Capaian Pembelajaran:\n';
  if (dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0) {
    dsData.capaianPembelajaranPerElemen.forEach((item:any) => {
      cpText += `Elemen: ${item.elemen}\n${item.capaianPembelajaran}\n\n`;
    });
  } else {
    cpText += dsData.capaianPembelajaran;
  }
  dsRows.push([cpText.trim()]);
  dsRows.push([`2. Tujuan Pembelajaran:\n${dsData.tujuanPembelajaran}`]);
  
  let pText = "3. Praktik Pedagogis:\n";
  pText += `Metode: ${dsData.praktikPedagogis.metodePembelajaran.join(', ')}\n`;
  pText += `Pendekatan: ${dsData.praktikPedagogis.pendekatanPembelajaran}\n`;
  pText += `Model: ${dsData.praktikPedagogis.modelPembelajaran}`;
  dsRows.push([pText]);

  let envText = "4. Lingkungan Belajar:\n";
  envText += `Lingkungan Fisik: ${dsData.lingkunganBelajar.lingkunganFisik.join(', ')}\n`;
  envText += `Deskripsi Fisik: ${dsData.lingkunganBelajar.lingkunganFisikDeskripsi}\n`;
  envText += `Budaya Belajar: ${dsData.lingkunganBelajar.budayaBelajar.join(', ')}`;
  dsRows.push([envText]);

  let mtText = "5. Mitra Pembelajaran:\n";
  mtText += `Mitra Internal: ${dsData.mitraPembelajaran.mitraInternal.join(', ')}\n`;
  mtText += `Mitra Eksternal: ${dsData.mitraPembelajaran.mitraEksternal.join(', ')}`;
  dsRows.push([mtText]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['C. DESAIN PEMBELAJARAN']],
    body: dsRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // D. LANGKAH PEMBELAJARAN
  let pRows = [];
  pRows.push([`1. Kegiatan Awal (${lpData.kegiatanAwal.alokasiMenit}):\n${lpData.kegiatanAwal.deskripsi}\n${lpData.kegiatanAwal.poinAktivitas.map((x: string) => `• ${x}`).join('\n')}`]);
  
  let intiText = `2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}:\n`;
  lpData.kegiatanInti.sintaks.forEach((ki: any) => {
    intiText += `\nTahap ${ki.tahapKe}: ${ki.namaTahap}\nGuru: ${ki.aktivitasGuru}\nSiswa: ${ki.aktivitasMurid}\nPrinsip: ${ki.prinsipPembelajaran || '-'}\n`;
  });
  pRows.push([intiText]);
  pRows.push([`3. Kegiatan Akhir (${lpData.kegiatanAkhir.alokasiMenit}):\n${lpData.kegiatanAkhir.deskripsi}\n${lpData.kegiatanAkhir.poinAktivitas.map((x: string) => `• ${x}`).join('\n')}`]);
  
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`D. LANGKAH PEMBELAJARAN (Total Waktu: ${lpData.alokasiWaktuTotal})`]],
    body: pRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // E. ASESMEN & RUBRIK
  const asRows = [
    [`1. Asesmen Diagnostik (Awal):\nBentuk/Teknik: ${asData.diagnostik.bentukTeknik}\nCara/Sumber: ${asData.diagnostik.caraSumber}`],
    [`2. Asesmen Formatif (Proses):\nBentuk/Teknik: ${asData.formatif.bentukTeknik}\nCara/Sumber: ${asData.formatif.caraSumber}`],
    [`3. Asesmen Sumatif (Akhir):\nBentuk/Teknik: ${asData.sumatif.bentukTeknik}\nCara/Sumber: ${asData.sumatif.caraSumber}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['E. ASESMEN PEMBELAJARAN']],
    body: asRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
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
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // F. PENGAYAAN, REMEDIAL & REFLEKSI
  const fRows = [
    [`Pengayaan:\n${modul.pengayaanDanRemedial?.pengayaan || '-'}`],
    [`Remedial:\n${modul.pengayaanDanRemedial?.remedial || '-'}`],
    [`Refleksi Guru:\n${(modul.refleksi?.refleksiGuru || []).map((x: string) => `• ${x}`).join('\n')}`],
    [`Refleksi Siswa:\n${(modul.refleksi?.refleksiSiswa || []).map((x: string) => `• ${x}`).join('\n')}`]
  ];
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['F. PENGAYAAN, REMEDIAL & REFLEKSI']],
    body: fRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
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
      [`Petunjuk Kerja:\n${lkData.petunjuk.map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`],
      [`Langkah Kerja Awal:\n${lkData.langkahKerjaAwal.map((l: any, i: number) => `${i+1}. ${l.judulLangkah}\n   ${l.instruksi}`).join('\n')}`],
      [`Kegiatan Kelompok (${lkData.kegiatanKelompokJudul}):\n${lkData.kegiatanKelompokInstruksi}`],
      [`Pertanyaan Analisis:\n${lkData.pertanyaanAnalisis.map((p: any, i: number) => `${i+1}. ${p.pertanyaan}`).join('\n')}`],
      [`Refleksi Diri:\n${lkData.refleksiDiriKelompok.map((r: any, i: number) => `${i+1}. ${r.pertanyaan}`).join('\n')}`]
    ];
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`LAMPIRAN: LKPD - ${lkData.judulLKPD}`]],
      body: lkRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
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
      [`Satuan Pendidikan: ${identitas.namaSatuanPendidikan || '-'}\nPenyusun: ${identitas.namaGuru || '-'}\nTahun / Semester: ${identitas.tahunPelajaran} / Semester ${identitas.semester}\nJenjang / Fase / Kelas: SD / ${identitas.fase} / Kelas ${identitas.kelas}\nAlokasi Waktu Modul: ${identitas.alokasiWaktuModul}\nTarget Peserta Didik: ${identitas.targetPesertaDidik}\nModa Pembelajaran: ${identitas.modaPembelajaran || '-'}\nModel Pembelajaran: ${modelPembelajaran}`],
      [`Kompetensi Awal:\n${(kompetensiAwal||[]).map((k: string) => `• ${k}`).join('\n')}`],
      [`Profil Pelajar Pancasila:\n${(profilPelajarPancasila||[]).map((p: string) => `• ${p}`).join('\n')}`],
      [`Sarana dan Prasarana:\nMedia Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // II. KOMPONEN INTI
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['II. KOMPONEN INTI']],
    body: [
      [`A. Tujuan Pembelajaran Spesifik:\n${(tujuanPembelajaranSpesifik||[]).map((t: string) => `• ${t}`).join('\n')}`],
      [`B. Pemahaman Bermakna:\n${(pemahamanBermakna||[]).map((p: string) => `• ${p}`).join('\n')}`],
      [`C. Pertanyaan Pemantik:\n${(pertanyaanPemantik||[]).map((p: string) => `• "${p}"`).join('\n')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {
    let pRows = [];
    pRows.push([`1. Pendahuluan:\n${(pert.pendahuluan||[]).map((x: string) => `• ${x}`).join('\n')}`]);
    
    let intiRows = pert.kegiatanInti.map((ki: any) => [ki.faseSintaks, ki.aktivitasGuru, ki.aktivitasSiswa]);
    
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`D. KEGIATAN PEMBELAJARAN (Pertemuan ${pert.pertemuanKe}) - ${pert.alokasiWaktu}`]],
      body: pRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
    });
    currentY = (doc as any).lastAutoTable.finalY;
    
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['2. Kegiatan Inti', '', '']],
      body: [['Fase Sintaks', 'Aktivitas Guru', 'Aktivitas Peserta Didik'], ...intiRows],
      theme: 'grid',
      headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
      styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
      },
    });
    currentY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [[`3. Penutup:\n${(pert.penutup||[]).map((x: string) => `• ${x}`).join('\n')}`]],
      theme: 'grid',
      styles: sectionStyles as any,
      showHead: 'never',
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 4;
  });

  // Asesmen
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['E. ASESMEN PEMBELAJARAN']],
    body: [
      [`1. Asesmen Diagnostik (Awal):\nTeknik: ${asesmen.diagnostik.teknik}\n${(asesmen.diagnostik.daftarPertanyaan||[]).map((q: string) => `• ${q}`).join('\n')}`],
      [`2. Asesmen Formatif (Proses):\nTeknik: ${asesmen.formatif.teknik}\n${asesmen.formatif.deskripsi}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
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
    columnStyles: { 0: { fontStyle: 'bold' } }
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
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

  // F. PENGAYAAN, REMEDIAL & REFLEKSI
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['F. PENGAYAAN, REMEDIAL & REFLEKSI']],
    body: [
      [`Pengayaan:\n${pengayaanDanRemedial?.pengayaan || '-'}`],
      [`Remedial:\n${pengayaanDanRemedial?.remedial || '-'}`],
      [`Refleksi Guru:\n${(refleksi?.refleksiGuru || []).map((x: string) => `• ${x}`).join('\n')}`],
      [`Refleksi Siswa:\n${(refleksi?.refleksiSiswa || []).map((x: string) => `• ${x}`).join('\n')}`]
    ],
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
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
      [`Tujuan Kegiatan: ${lk.tujuanKegiatan}`],
      [`Alat & Bahan:\n${(lk.alatBahan || []).map((a: string) => `• ${a}`).join('\n')}`],
      [`Langkah Kerja:\n${(lk.langkahKerja || []).map((l: string, i: number) => `${i+1}. ${l}`).join('\n')}`],
      [`Pertanyaan Diskusi:\n${(lk.pertanyaanDiskusi || []).map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`]
    ];
    if (lk.kesimpulanPrompt) {
      lkRows.push([`Kesimpulan:\n${lk.kesimpulanPrompt}`]);
    }
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[`LAMPIRAN: LKPD ${idx + 1} - ${lk.judulLKPD}`]],
      body: lkRows,
      theme: 'grid',
      headStyles: headStyles as any,
      styles: sectionStyles as any,
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
