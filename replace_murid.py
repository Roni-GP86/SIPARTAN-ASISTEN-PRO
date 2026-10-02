import os

files_to_check = [
    'src/components/ModulAjarView.tsx',
    'src/components/RPMCanvasView.tsx',
    'src/components/RPMDocumentSection.tsx',
    'src/components/KKTPDocumentView.tsx',
    'src/components/RPMConfigModal.tsx'
]

for filepath in files_to_check:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace instances of Peserta Didik with Murid
        content = content.replace('Peserta Didik', 'Murid')
        content = content.replace('peserta didik', 'murid')
        content = content.replace('peserta Didik', 'murid')
        
        # Also ensure "Karakteristik Murid" in ModulAjarView/RPMCanvasView
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

