import os
import re

def update():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # In exportModulAjarToPDF, find:
    target_start = """  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {"""
    
    # We will replace from there until:
    target_end = """    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['3. Penutup']],
      body: endRows,
      theme: 'grid',
      headStyles: { font: 'times', fillColor: [255, 255, 255], textColor: 0, fontSize: 11, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2 },
      styles: { font: 'times', fontSize: 11, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  });"""
    
    start_idx = content.find(target_start)
    if start_idx == -1:
        print("start_idx not found")
        return
        
    end_idx = content.find(target_end, start_idx)
    if end_idx == -1:
        print("end_idx not found")
        return
        
    end_idx += len(target_end)
    
    new_block = """  // Kegiatan Pembelajaran
  kegiatanPembelajaran.forEach((pert: any) => {
    doc.addPage();
    currentY = margin;
    
    let lpRows: any[] = [];
    
    // Pendahuluan
    let pendaText = "";
    if (pert.pendahuluan && pert.pendahuluan.length > 0) {
      pendaText = pert.pendahuluan.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
    }
    lpRows.push([
      { content: '1. Pendahuluan', styles: { fontStyle: 'bold' } },
      { content: pendaText, colSpan: 2 }
    ]);
    
    // Inti
    if (pert.kegiatanInti && pert.kegiatanInti.length > 0) {
      pert.kegiatanInti.forEach((ki: any, idx: number) => {
        let titleText = idx === 0 ? `2. Kegiatan Inti\\n\\nFase: ${ki.faseSintaks}` : `Fase: ${ki.faseSintaks}`;
        lpRows.push([
          { content: titleText, styles: { fontStyle: idx === 0 ? 'bold' : 'normal' } },
          ki.aktivitasGuru,
          ki.aktivitasSiswa
        ]);
      });
    }
    
    // Penutup
    let penutupText = "";
    if (pert.penutup && pert.penutup.length > 0) {
      penutupText = pert.penutup.map((p: string, i: number) => `${i+1}. ${p}`).join("\\n");
    }
    lpRows.push([
      { content: '3. Penutup', styles: { fontStyle: 'bold' } },
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
  });"""
  
    content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

update()
