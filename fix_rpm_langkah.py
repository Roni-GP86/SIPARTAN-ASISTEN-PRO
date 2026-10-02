import os

def update():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    target_start = "  // D. LANGKAH PEMBELAJARAN"
    
    start_idx = content.find(target_start)
    if start_idx == -1:
        print("start_idx not found")
        return
        
    end_pattern = "  // E. ASESMEN & RUBRIK"
    end_idx = content.find(end_pattern, start_idx)
    if end_idx == -1:
        print("end_idx not found")
        return

    new_block = """  doc.addPage();
  currentY = margin;
  // D. LANGKAH PEMBELAJARAN
  
  let lpRows: any[] = [];
  
  // Awal
  let awalText = lpData.kegiatanAwal.deskripsi ? lpData.kegiatanAwal.deskripsi + "\\n" : "";
  if (lpData.kegiatanAwal.poinAktivitas && lpData.kegiatanAwal.poinAktivitas.length > 0) {
    awalText += lpData.kegiatanAwal.poinAktivitas.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
  }
  lpRows.push([
    { content: 'Kegiatan Awal', styles: { fontStyle: 'bold' as const } },
    awalText,
    { content: lpData.kegiatanAwal.alokasiMenit, styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
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
    { content: `Kegiatan Inti\\n(Sintaks: ${lpData.kegiatanInti.modelPembelajaran})`, styles: { fontStyle: 'bold' as const } },
    intiText,
    { content: lpData.kegiatanInti.alokasiMenit, styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
  ]);
  
  // Akhir
  let akhirText = lpData.kegiatanAkhir.deskripsi ? lpData.kegiatanAkhir.deskripsi + "\\n" : "";
  if (lpData.kegiatanAkhir.poinAktivitas && lpData.kegiatanAkhir.poinAktivitas.length > 0) {
    akhirText += lpData.kegiatanAkhir.poinAktivitas.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
  }
  lpRows.push([
    { content: 'Kegiatan Akhir', styles: { fontStyle: 'bold' as const } },
    akhirText,
    { content: lpData.kegiatanAkhir.alokasiMenit, styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: `D. LANGKAH-LANGKAH PEMBELAJARAN (Total Waktu: ${lpData.alokasiWaktuTotal})`, colSpan: 3 }
    ], [
      { content: 'Kegiatan', styles: { halign: 'center' as const } },
      { content: 'Deskripsi Kegiatan & Sintaks Pembelajaran Mendalam', styles: { halign: 'center' as const } },
      { content: 'Alokasi Waktu', styles: { halign: 'center' as const } }
    ]],
    body: lpRows,
    theme: 'grid',
    headStyles: headStyles as any,
    styles: sectionStyles as any,
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 }
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });
  currentY = (doc as any).lastAutoTable.finalY + 4;

"""
  
    content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

update()
