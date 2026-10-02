import re

def fix_file():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. ATP Word Header: 
    # `<span style="font-size: 12pt; font-weight: normal; text-transform: none;">Penyusun: <strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong> ${identitas.nipGuru ? \`(NIP. ${lockWordData(identitas.nipGuru, 'NIP Guru')})\` : ''}</span><br/>`
    # Replace with no NIP.
    content = re.sub(
        r"Penyusun: <strong>\$\{lockWordData\(identitas\.namaGuru \|\| '-', 'Nama Guru'\)\}</strong> \$\{identitas\.nipGuru \? `\(NIP\. \$\{lockWordData\(identitas\.nipGuru, 'NIP Guru'\)\}\)` : ''\}</span>",
        r"Penyusun: <strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></span>",
        content
    )
    
    # 2. ATP Word Header (if table-based? ATPDocument):
    # `<td><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong> ${identitas.nipGuru ? \`(NIP. ${lockWordData(identitas.nipGuru, 'NIP Guru')})\` : ''}</td>`
    content = re.sub(
        r"<td><strong>\$\{lockWordData\(identitas\.namaGuru \|\| '-', 'Nama Guru'\)\}</strong> \$\{identitas\.nipGuru \? `\(NIP\. \$\{lockWordData\(identitas\.nipGuru, 'NIP Guru'\)\}\)` : ''\}</td>",
        r"<td><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td>",
        content
    )

    # 3. ATP PDF Header:
    # `doc.text(\`Penyusun: ${identitas.namaGuru || '-'} ${identitas.nipGuru ? \`(NIP. ${identitas.nipGuru})\` : ''}\`, pageWidth / 2, 146, { align: 'center' });`
    content = re.sub(
        r"doc\.text\(`Penyusun: \$\{identitas\.namaGuru \|\| '-'} \$\{identitas\.nipGuru \? `\(NIP\. \$\{identitas\.nipGuru\}\)` : ''\}`, pageWidth \/ 2, 146, \{ align: 'center' \}\);",
        r"doc.text(`Penyusun: ${identitas.namaGuru || '-'}`, pageWidth / 2, 146, { align: 'center' });",
        content
    )
    
    # 4. Modul Ajar / Bedah TP / KKTP Word Header (table style):
    # `<tr><td style="font-weight: bold;">Penyusun</td><td>:</td><td><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong> ${identitas.nipGuru ? \`(NIP. ${lockWordData(identitas.nipGuru, 'NIP Guru')})\` : ''}</td></tr>`
    content = re.sub(
        r"<tr><td style=\"font-weight: bold;\">Penyusun</td><td>:</td><td><strong>\$\{lockWordData\(identitas\.namaGuru \|\| '-', 'Nama Guru'\)\}</strong> \$\{identitas\.nipGuru \? `\(NIP\. \$\{lockWordData\(identitas\.nipGuru, 'NIP Guru'\)\}\)` : ''\}</td></tr>",
        r"<tr><td style=\"font-weight: bold;\">Penyusun</td><td>:</td><td><strong>${lockWordData(identitas.namaGuru || '-', 'Nama Guru')}</strong></td></tr>",
        content
    )

    # 5. TP Analysis PDF Header (or similar):
    # `['Penyusun', ':', \`${identitas.namaGuru || '-'} ${identitas.nipGuru ? \`(NIP. ${identitas.nipGuru})\` : ''}\`],`
    content = re.sub(
        r"\['Penyusun', ':', `\$\{identitas\.namaGuru \|\| '-'} \$\{identitas\.nipGuru \? `\(NIP\. \$\{identitas\.nipGuru\}\)` : ''\}`\],",
        r"['Penyusun', ':', `${identitas.namaGuru || '-'}`],",
        content
    )

    # 6. Prota Word Header:
    # `<td>${lockWordData(id.namaGuru, 'Nama Guru')} (NIP. ${lockWordData(id.nipGuru || '-', 'NIP Guru')})</td>`
    content = re.sub(
        r"<td>\$\{lockWordData\(id\.namaGuru, 'Nama Guru'\)\} \(NIP\. \$\{lockWordData\(id\.nipGuru \|\| '-', 'NIP Guru'\)\}\)</td>",
        r"<td>${lockWordData(id.namaGuru, 'Nama Guru')}</td>",
        content
    )
    
    # 7. Promes Word Header:
    # `<td style="border: none; padding: 3px 0;">${lockWordData(id.namaGuru, 'Guru')} (NIP. ${lockWordData(id.nipGuru || '-', 'NIP Guru')})</td>`
    content = re.sub(
        r"<td style=\"border: none; padding: 3px 0;\">\$\{lockWordData\(id\.namaGuru, 'Guru'\)\} \(NIP\. \$\{lockWordData\(id\.nipGuru \|\| '-', 'NIP Guru'\)\}\)</td>",
        r"<td style=\"border: none; padding: 3px 0;\">${lockWordData(id.namaGuru, 'Guru')}</td>",
        content
    )

    # 8. Promes Excel Header (or similar?):
    # `<td style="border: none;">${lockWordData(id.namaGuru, 'Guru')} (NIP. ${lockWordData(id.nipGuru || '-', 'NIP')})</td>`
    content = re.sub(
        r"<td style=\"border: none;\">\$\{lockWordData\(id\.namaGuru, 'Guru'\)\} \(NIP\. \$\{lockWordData\(id\.nipGuru \|\| '-', 'NIP'\)\}\)</td>",
        r"<td style=\"border: none;\">${lockWordData(id.namaGuru, 'Guru')}</td>",
        content
    )
    
    # 9. Promes PDF Header:
    # `doc.text(\`Penyusun          : ${id.namaGuru} (NIP. ${id.nipGuru || '-'})\`, pageWidth - 14, 31, { align: 'right' });`
    content = re.sub(
        r"doc\.text\(`Penyusun          : \$\{id\.namaGuru\} \(NIP\. \$\{id\.nipGuru \|\| '-'\}\)`, pageWidth - 14, 31, \{ align: 'right' \}\);",
        r"doc.text(`Penyusun          : ${id.namaGuru}`, pageWidth - 14, 31, { align: 'right' });",
        content
    )

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

fix_file()
