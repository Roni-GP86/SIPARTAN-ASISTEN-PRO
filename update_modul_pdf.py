import re

def update_pdf():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    target = """      [{ content: 'Sarana dan Prasarana:', styles: { fontStyle: 'bold' } }],
      [`Media Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`]"""

    replacement = """      [{ content: 'Sarana dan Prasarana:', styles: { fontStyle: 'bold' } }],
      [`Media Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`],
      [{ content: 'Pemanfaatan Teknologi Digital:', styles: { fontStyle: 'bold' } }],
      [`Platform/Aplikasi: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.platformAplikasi || []).join(', ') || '-'}\nPerangkat Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.perangkatDigital || []).join(', ') || '-'}\nMedia Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.mediaDigital || []).join(', ') || '-'}`]"""

    if target in content:
        content = content.replace(target, replacement)
    else:
        print("Target not found in exportUtils.ts")

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

update_pdf()
