import re

with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in exportBedahCPToWord
content = re.sub(
    r"\$\{identitas\.namaSatuanPendidikan \? 'Ditetapkan di Sekolah' : 'Fatubai'\}, \$\{new Date\(\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}",
    r"${identitas.tempatPenetapan || (identitas.namaSatuanPendidikan ? 'Ditetapkan di Sekolah' : 'Fatubai')}, ${identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}",
    content
)

# Replace in exportBedahCPToPDF
# Oh wait, PDF uses doc.text ... Let's find it. It's actually not in exportBedahCPToPDF? 
# Wait, let's just do a generic replace for `${identitas.namaSatuanPendidikan ? 'Ditetapkan di Tempat' : 'Fatubai'}, ${tanggalHariIni}`
content = content.replace(
    "`${identitas.namaSatuanPendidikan ? 'Ditetapkan di Tempat' : 'Fatubai'}, ${tanggalHariIni}`",
    "`${identitas.tempatPenetapan || (identitas.namaSatuanPendidikan ? 'Ditetapkan di Tempat' : 'Fatubai')}, ${identitas.tanggalPenetapan || tanggalHariIni}`"
)

# Replace in KKTP Word
content = content.replace(
    "Fatubai, ${kktp.tanggalDibuat}",
    "${id.tempatPenetapan || 'Fatubai'}, ${id.tanggalPenetapan || kktp.tanggalDibuat}"
)

# Let's write it back
with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)
