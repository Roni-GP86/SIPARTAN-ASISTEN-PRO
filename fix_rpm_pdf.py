import re

def rewrite_rpm_pdf():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where Kegiatan Inti is built in exportRPMToPDF
    target = """  // D. LANGKAH PEMBELAJARAN
  let pRows = [];
  pRows.push([`1. Kegiatan Awal (${lpData.kegiatanAwal.alokasiMenit}):\\n${lpData.kegiatanAwal.deskripsi}\\n${lpData.kegiatanAwal.poinAktivitas.map((x: string) => `• ${x}`).join('\\n')}`]);
  
  let intiText = `2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}:\\n`;
  lpData.kegiatanInti.sintaks.forEach((ki: any) => {
    intiText += `\\nTahap ${ki.tahapKe}: ${ki.faseSintaks}\\nAktivitas: ${ki.aktivitas}\\nPengalaman Belajar: ${ki.pengalamanBelajar || '-'}\\nPrinsip Pembelajaran: ${ki.prinsipPembelajaran || '-'}\\n`;
  });
  pRows.push([intiText]);
  pRows.push([`3. Kegiatan Akhir (${lpData.kegiatanAkhir.alokasiMenit}):\\n${lpData.kegiatanAkhir.deskripsi}\\n${lpData.kegiatanAkhir.poinAktivitas.map((x: string) => `• ${x}`).join('\\n')}`]);
  
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
  currentY = (doc as any).lastAutoTable.finalY + 4;"""

    replacement = """  // D. LANGKAH PEMBELAJARAN
  let pRows = [];
  pRows.push([`1. Kegiatan Awal (${lpData.kegiatanAwal.alokasiMenit}):\\n${lpData.kegiatanAwal.deskripsi}\\n${lpData.kegiatanAwal.poinAktivitas.map((x: string) => `• ${x}`).join('\\n')}`]);
  
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
  currentY = (doc as any).lastAutoTable.finalY; // No gap

  let intiRows = lpData.kegiatanInti.sintaks.map((ki: any) => [
    `Tahap ${ki.tahapKe}:\\n${ki.faseSintaks}`, 
    ki.aktivitas,
    `[ PENGALAMAN BELAJAR ]\\n${ki.pengalamanBelajar || '-'}\\n\\n[ PRINSIP PEMBELAJARAN ]\\n${ki.prinsipPembelajaran || '-'}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[`2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}`, '', '']],
    body: [['Fase Sintaks', 'Aktivitas Utama', 'Prinsip & Pengalaman Belajar'], ...intiRows],
    theme: 'grid',
    headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
    styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 50, fillColor: [245, 247, 250] }, // Slight color to highlight
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });
  currentY = (doc as any).lastAutoTable.finalY; // No gap

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: [[`3. Kegiatan Akhir (${lpData.kegiatanAkhir.alokasiMenit}):\\n${lpData.kegiatanAkhir.deskripsi}\\n${lpData.kegiatanAkhir.poinAktivitas.map((x: string) => `• ${x}`).join('\\n')}`]],
    theme: 'grid',
    styles: sectionStyles as any,
    showHead: 'never',
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;"""

    if target in content:
        content = content.replace(target, replacement)
    else:
        print("Target 1 not found")

    target2 = """    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['2. Kegiatan Inti', '', '']],
      body: [['Fase Sintaks', 'Aktivitas Utama', 'Prinsip & Pengalaman Belajar'], ...intiRows],
      theme: 'grid',
      headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
      styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50 },
      },
      pageBreak: 'avoid',
      rowPageBreak: 'avoid'
    });"""

    replacement2 = """    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['2. Kegiatan Inti', '', '']],
      body: [['Fase Sintaks', 'Aktivitas Utama', 'Prinsip & Pengalaman Belajar'], ...intiRows],
      theme: 'grid',
      headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
      styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50, fillColor: [245, 247, 250] },
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid'
    });"""

    if target2 in content:
        content = content.replace(target2, replacement2)
    else:
        print("Target 2 not found")
        
    target3 = """    let intiRows = pert.kegiatanInti.map((ki: any) => [
      ki.faseSintaks, 
      `${ki.aktivitasGuru}\\n\\nSiswa:\\n${ki.aktivitasSiswa}`,
      `Pengalaman: ${ki.pengalamanBelajar || '-'}\\n\\nPrinsip: ${ki.prinsipPembelajaran || '-'}`
    ]);"""
    
    replacement3 = """    let intiRows = pert.kegiatanInti.map((ki: any) => [
      ki.faseSintaks, 
      `Guru: ${ki.aktivitasGuru}\\n\\nSiswa: ${ki.aktivitasSiswa}`,
      `[ PENGALAMAN BELAJAR ]\\n${ki.pengalamanBelajar || '-'}\\n\\n[ PRINSIP PEMBELAJARAN ]\\n${ki.prinsipPembelajaran || '-'}`
    ]);"""

    if target3 in content:
        content = content.replace(target3, replacement3)
    else:
        print("Target 3 not found")

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)
        
rewrite_rpm_pdf()
