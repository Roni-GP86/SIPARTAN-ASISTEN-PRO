import re

def fix_pdf_exports():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where intiText is built
    target = """  let intiText = `2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}:\\n`;
  lpData.kegiatanInti.sintaks.forEach((ki: any) => {
    intiText += `\\nTahap ${ki.tahapKe}: ${ki.namaTahap}\\nGuru: ${ki.aktivitasGuru}\\nSiswa: ${ki.aktivitasMurid}\\nPrinsip: ${ki.prinsipPembelajaran || '-'}\\n`;
  });
  pRows.push([intiText]);"""

    replacement = """  let intiText = `2. Kegiatan Inti (${lpData.kegiatanInti.alokasiMenit}) - Model: ${lpData.kegiatanInti.modelPembelajaran}:\\n`;
  lpData.kegiatanInti.sintaks.forEach((ki: any) => {
    intiText += `\\nTahap ${ki.tahapKe}: ${ki.faseSintaks}\\nAktivitas: ${ki.aktivitas}\\nPengalaman Belajar: ${ki.pengalamanBelajar || '-'}\\nPrinsip Pembelajaran: ${ki.prinsipPembelajaran || '-'}\\n`;
  });
  pRows.push([intiText]);"""

    if target in content:
        content = content.replace(target, replacement)
    else:
        print("Target 1 not found")

    target2 = """  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {
    let pRows = [];
    pRows.push([`1. Pendahuluan:\\n${(pert.pendahuluan||[]).map((x: string) => `• ${x}`).join('\\n')}`]);
    
    let intiRows = pert.kegiatanInti.map((ki: any) => [ki.faseSintaks, ki.aktivitasGuru, ki.aktivitasSiswa]);
    
    autoTable(doc, {"""

    replacement2 = """  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {
    let pRows = [];
    pRows.push([`1. Pendahuluan:\\n${(pert.pendahuluan||[]).map((x: string) => `• ${x}`).join('\\n')}`]);
    
    let intiRows = pert.kegiatanInti.map((ki: any) => [
      ki.faseSintaks, 
      `${ki.aktivitasGuru}\\n\\nSiswa:\\n${ki.aktivitasSiswa}`,
      `Pengalaman: ${ki.pengalamanBelajar || '-'}\\n\\nPrinsip: ${ki.prinsipPembelajaran || '-'}`
    ]);
    
    autoTable(doc, {"""

    if target2 in content:
        content = content.replace(target2, replacement2)
    else:
        print("Target 2 not found")
        
    target3 = """    autoTable(doc, {
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
    });"""

    replacement3 = """    autoTable(doc, {
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
    
    if target3 in content:
        content = content.replace(target3, replacement3)
    else:
        print("Target 3 not found")

    # Add pageBreak: 'avoid' to some tables. Actually `pageBreak: 'avoid'` works, but `rowPageBreak: 'avoid'` is better globally.
    content = content.replace("theme: 'grid',", "theme: 'grid',\n    pageBreak: 'auto',\n    rowPageBreak: 'avoid',")

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)
        
fix_pdf_exports()
