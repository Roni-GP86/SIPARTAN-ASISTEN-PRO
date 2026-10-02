import re

def fix_exportUtils():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. RPM - Desain Pembelajaran (Start on new page)
    # Search for: `  // C. DESAIN PEMBELAJARAN`
    c_desain = """  // C. DESAIN PEMBELAJARAN
  let dsRows = [];"""
    new_c_desain = """  doc.addPage();
  currentY = margin;
  // C. DESAIN PEMBELAJARAN
  let dsRows = [];"""
    if c_desain in content:
        content = content.replace(c_desain, new_c_desain)
    
    # 2. RPM - Langkah Pembelajaran (Start on new page, One single AutoTable)
    # Remove the existing D. LANGKAH PEMBELAJARAN blocks and replace with unified table
    
    # Find the start of D. LANGKAH PEMBELAJARAN
    start_d_langkah = content.find("  // D. LANGKAH PEMBELAJARAN")
    # Find the start of E. ASESMEN PEMBELAJARAN
    start_e_asesmen = content.find("  // E. ASESMEN PEMBELAJARAN")
    
    if start_d_langkah != -1 and start_e_asesmen != -1:
        # We replace the whole chunk
        new_d_langkah = """  doc.addPage();
  currentY = margin;
  // D. LANGKAH PEMBELAJARAN
  
  let lpRows: any[] = [];
  
  // Awal
  let awalText = lpData.kegiatanAwal.deskripsi ? lpData.kegiatanAwal.deskripsi + "\\n" : "";
  if (lpData.kegiatanAwal.poinAktivitas && lpData.kegiatanAwal.poinAktivitas.length > 0) {
    awalText += lpData.kegiatanAwal.poinAktivitas.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
  }
  lpRows.push([
    { content: 'Kegiatan Awal', styles: { fontStyle: 'bold' } },
    awalText,
    { content: lpData.kegiatanAwal.alokasiMenit, styles: { halign: 'center', fontStyle: 'bold' } }
  ]);
  
  // Inti
  let intiText = "";
  if (lpData.kegiatanInti.sintaks && lpData.kegiatanInti.sintaks.length > 0) {
    intiText = lpData.kegiatanInti.sintaks.map((s: any) => {
      let t = `Fase: ${s.faseSintaks} (${s.alokasiMenit})\\n${s.aktivitas}\\n`;
      if (s.pengalamanBelajar) t += `[Pengalaman] ${s.pengalamanBelajar}\\n`;
      if (s.prinsipPembelajaran) t += `[Prinsip] ${s.prinsipPembelajaran}\\n`;
      return t;
    }).join("\\n");
  }
  lpRows.push([
    { content: `Kegiatan Inti\\n(Sintaks: ${lpData.kegiatanInti.modelPembelajaran})`, styles: { fontStyle: 'bold' } },
    intiText,
    { content: lpData.kegiatanInti.alokasiMenit, styles: { halign: 'center', fontStyle: 'bold' } }
  ]);
  
  // Akhir
  let akhirText = lpData.kegiatanAkhir.deskripsi ? lpData.kegiatanAkhir.deskripsi + "\\n" : "";
  if (lpData.kegiatanAkhir.poinAktivitas && lpData.kegiatanAkhir.poinAktivitas.length > 0) {
    akhirText += lpData.kegiatanAkhir.poinAktivitas.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
  }
  lpRows.push([
    { content: 'Kegiatan Akhir', styles: { fontStyle: 'bold' } },
    akhirText,
    { content: lpData.kegiatanAkhir.alokasiMenit, styles: { halign: 'center', fontStyle: 'bold' } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: `D. LANGKAH-LANGKAH PEMBELAJARAN (Total Waktu: ${lpData.alokasiWaktuTotal})`, colSpan: 3 }
    ], [
      { content: 'Kegiatan', styles: { halign: 'center' } },
      { content: 'Deskripsi Kegiatan & Sintaks Pembelajaran Mendalam', styles: { halign: 'center' } },
      { content: 'Alokasi Waktu', styles: { halign: 'center' } }
    ]],
    body: lpRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 }
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

"""
        content = content[:start_d_langkah] + new_d_langkah + content[start_e_asesmen:]
    
    # 3. Modul Ajar - II. KOMPONEN INTI (Start on new page)
    # Modul Ajar uses "II. KOMPONEN INTI" as equivalent to Desain Pembelajaran (it has Tujuan, Pemahaman Bermakna, etc.)
    # Let's break page before II. KOMPONEN INTI
    c_komponen_inti = """  // II. KOMPONEN INTI
  let intiRows = [];"""
    new_c_komponen_inti = """  doc.addPage();
  currentY = margin;
  // II. KOMPONEN INTI
  let intiRows = [];"""
    if c_komponen_inti in content:
        content = content.replace(c_komponen_inti, new_c_komponen_inti)
        
    # 4. Modul Ajar - D. KEGIATAN PEMBELAJARAN (Start on new page, Unified table)
    # Search for D. KEGIATAN PEMBELAJARAN in exportModulAjarToPDF
    # In Modul Ajar, Kegiatan Pembelajaran is a loop of "pertemuan"
    
    # I need a custom script to replace that loop in Modul Ajar.
    
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

fix_exportUtils()
