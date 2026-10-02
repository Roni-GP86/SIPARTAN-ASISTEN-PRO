import os

def update():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    start_str = "  <h3>D. KANVAS PRINSIP &amp; PENGALAMAN BELAJAR (DEEP LEARNING CANVAS)</h3>"
    end_str = "  <h3>E. LANGKAH-LANGKAH PEMBELAJARAN (SINTAKS DEEP LEARNING)</h3>"

    start_idx = content.find(start_str)
    end_idx = content.find(end_str)

    if start_idx != -1 and end_idx != -1:
        # Delete from start_idx up to end_idx
        content = content[:start_idx] + content[end_idx:]
    else:
        print("Not found HTML Kanvas")

    # Rename E, F, G to D, E, F in Word HTML export as well
    content = content.replace("E. LANGKAH-LANGKAH PEMBELAJARAN (SINTAKS DEEP LEARNING)", "D. LANGKAH-LANGKAH PEMBELAJARAN (SINTAKS DEEP LEARNING)")
    content = content.replace("F. ASESMEN PEMBELAJARAN", "E. ASESMEN PEMBELAJARAN")
    content = content.replace("G. PENGAYAAN &amp; REMEDIAL", "F. PENGAYAAN &amp; REMEDIAL")
    
    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

update()
