import re

def update_pdf():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace the exact line of Media Ajar with itself plus the new section
    target_line = r"      [`Media Ajar: ${(saranaPrasarana?.mediaAjar||[]).join(', ')}\nFasilitas: ${(saranaPrasarana?.fasilitas||[]).join(', ')}\nLingkungan Belajar: ${(saranaPrasarana?.lingkunganBelajar||[]).join(', ')}`]"
    
    replacement = target_line + ",\n      [{ content: 'Pemanfaatan Teknologi Digital:', styles: { fontStyle: 'bold' } }],\n      [`Platform/Aplikasi: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.platformAplikasi || []).join(', ') || '-'}\\nPerangkat Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.perangkatDigital || []).join(', ') || '-'}\\nMedia Digital: ${((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.mediaDigital || []).join(', ') || '-'}`]"

    if target_line in content:
        content = content.replace(target_line, replacement)
    else:
        print("Target line not found in exportUtils.ts")

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

update_pdf()
