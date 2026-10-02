import os

def update():
    with open('src/components/RPMDocumentSection.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    start_str = "      {/* D. KANVAS PRINSIP PEMBELAJARAN & PENGALAMAN BELAJAR (DEEP LEARNING CANVAS MATRIX) */}"
    end_str = "      {/* E. LANGKAH-LANGKAH PEMBELAJARAN */}"

    start_idx = content.find(start_str)
    end_idx = content.find(end_str)

    if start_idx != -1 and end_idx != -1:
        # We delete the chunk between them
        content = content[:start_idx] + content[end_idx:]
    else:
        print("Not found")
        return

    # Now let's rename the headings E to D, F to E, G to F
    content = content.replace("E. LANGKAH-LANGKAH PEMBELAJARAN", "D. LANGKAH-LANGKAH PEMBELAJARAN")
    content = content.replace("E. Langkah-Langkah Pembelajaran", "D. Langkah-Langkah Pembelajaran")
    
    content = content.replace("F. ASESMEN PEMBELAJARAN", "E. ASESMEN PEMBELAJARAN")
    content = content.replace("F. Asesmen Pembelajaran", "E. Asesmen Pembelajaran")
    
    content = content.replace("G. PENGAYAAN", "F. PENGAYAAN")
    content = content.replace("G. Pengayaan", "F. Pengayaan")

    with open('src/components/RPMDocumentSection.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update()
