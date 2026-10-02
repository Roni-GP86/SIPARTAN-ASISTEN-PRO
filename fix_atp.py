with open('src/components/ATPDocumentView.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "`(NIP. ${atp.identitas.nipGuru})` : ''}", 
    "''}"
)
content = content.replace(
    "{atp.identitas.namaGuru} {atp.identitas.nipGuru ? '' : ''}",
    "{atp.identitas.namaGuru}"
)
with open('src/components/ATPDocumentView.tsx', 'w') as f:
    f.write(content)
