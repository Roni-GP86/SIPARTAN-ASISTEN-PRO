import os
import re

def fix_signatures():
    # exportUtils.ts
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(
        r"Penyusun,<br/>",
        r"${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')},<br/>",
        content
    )
    content = re.sub(
        r"Penyusun,<br><br><br><br>",
        r"${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')},<br><br><br><br>",
        content
    )
    
    # Specific ones:
    content = content.replace("doc.text('Penyusun,', col2X, startY + 5.5);", "doc.text(`${identitas.peranGuru || 'Guru Kelas'}`, col2X, startY + 5.5);")
    content = content.replace("pdf.text('Penyusun,', pageWidth - 60, currentY);", "pdf.text(`${id.peranGuru || 'Guru Kelas'}`, pageWidth - 60, currentY);")
    content = content.replace("<p style=\"margin: 0; font-weight: bold;\">Penyusun,</p>", "<p style=\"margin: 0; font-weight: bold;\">${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')}</p>")

    # The ones with identitas (Modul Ajar)
    content = content.replace(
        "${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')},<br/>",
        "${lockWordData(identitas.peranGuru || 'Guru Kelas', 'Jabatan Guru')}<br/>"
    )
    content = content.replace(
        "${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')},<br><br><br><br>",
        "${lockWordData(id.peranGuru || 'Guru Kelas', 'Jabatan')}<br><br><br><br>"
    )

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)
        
    # Now for components
    def replace_penyusun(filepath, obj_name):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(
            r"<p[^>]*>Penyusun,?</p>",
            f'<p className="font-bold text-slate-900">{{{obj_name}.peranGuru || \'Guru Kelas\'}}</p>',
            content
        )
        # also KKTP which has text-slate-600
        content = re.sub(
            r'<p className="text-slate-600">Penyusun</p>',
            f'<p className="text-slate-600">{{{obj_name}.peranGuru || \'Guru Kelas\'}}</p>',
            content
        )
        content = re.sub(
            r'<p className="font-bold text-slate-900">Penyusun</p>',
            f'<p className="font-bold text-slate-900">{{{obj_name}.peranGuru || \'Guru Kelas\'}}</p>',
            content
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    replace_penyusun('src/components/ProtaDocumentView.tsx', 'id')
    replace_penyusun('src/components/PromesDocumentView.tsx', 'id')
    replace_penyusun('src/components/KKTPDocumentView.tsx', 'kktp.identitas')
    replace_penyusun('src/components/ATPDocumentView.tsx', 'atp.identitas')
    replace_penyusun('src/components/TPAnalysisView.tsx', 'identitas')
    replace_penyusun('src/components/ModulAjarView.tsx', 'modul.identitas')
    replace_penyusun('src/components/RPMCanvasView.tsx', 'modul.identitas')
    replace_penyusun('src/components/RPMDocumentSection.tsx', 'modul.identitas')

fix_signatures()
