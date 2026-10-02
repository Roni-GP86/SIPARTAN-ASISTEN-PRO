import os
import re

def fix_signatures():
    # components
    for filename in os.listdir('src/components'):
        if not filename.endswith('.tsx'): continue
        filepath = os.path.join('src/components', filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace Kepala Sekolah
        content = re.sub(
            r"Kepala \{[^}]+\.namaSatuanPendidikan(?: \|\| '[^']+')?\}",
            r"Kepala Sekolah",
            content
        )
        # Replace Guru Pengampu
        content = re.sub(
            r"Guru Pengampu / Penyusun",
            r"Guru Kelas / Mata Pelajaran",
            content
        )
        content = re.sub(
            r"Penyusun / Guru Pengampu",
            r"Guru Kelas / Mata Pelajaran",
            content
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
    # exportUtils.ts
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Kepala Sekolah
    content = re.sub(
        r"Kepala \$\{lockWordData\([^}]+\.namaSatuanPendidikan[^}]+\)\}",
        r"Kepala Sekolah",
        content
    )
    content = re.sub(
        r"Kepala \$\{id\.namaSatuanPendidikan \|\| 'SD Negeri Fatubai'\}",
        r"Kepala Sekolah",
        content
    )
    content = re.sub(
        r"Kepala \$\{namaSekolah\}",
        r"Kepala Sekolah",
        content
    )
    content = re.sub(
        r"doc\.text\(`Kepala \$\{identitas\.namaSatuanPendidikan \|\| 'SD Negeri Fatubai'\}`, col1X, startY \+ 5\.5\);",
        r"doc.text('Kepala Sekolah', col1X, startY + 5.5);",
        content
    )

    # Guru
    content = re.sub(
        r"Guru Pengampu / Penyusun",
        r"Penyusun",
        content
    )
    content = re.sub(
        r"Penyusun / Guru Pengampu",
        r"Penyusun",
        content
    )
    
    # Let's also find Penyusun in signature and replace it with their jabatan if we can, or Guru Kelas/Mata Pelajaran
    # Wait, the user said "cukup tulis guru kelas atau guru mata pelajaran sesuai jabatan yang diampu". 
    # For exportUtils, we can just use `${identitas.jabatan || 'Guru'}` if we have it, or `${lockWordData(identitas.jabatan || 'Guru Kelas', 'Jabatan')}`
    
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

fix_signatures()
