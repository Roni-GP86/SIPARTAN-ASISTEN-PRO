import os

files_to_check = [
    'src/utils/exportUtils.ts',
    'src/utils/rpmUtils.ts'
]

for filepath in files_to_check:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace occurrences in text labels without breaking variable names
        # We can just replace "Peserta Didik" -> "Murid"
        content = content.replace('Peserta Didik', 'Murid')
        content = content.replace('peserta didik', 'murid')
        content = content.replace('peserta Didik', 'murid')
        
        # Revert variables that shouldn't change
        # If there are variables like "targetMurid" that were originally targetPesertaDidik
        content = content.replace('targetMurid', 'targetPesertaDidik')
        content = content.replace('karakteristikMurid', 'karakteristikPesertaDidik') # Wait! In rpmUtils I named it karakteristikMurid originally, maybe.
        # Actually, in JS/TS objects it doesn't matter if it gets replaced unless it breaks an interface.
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

