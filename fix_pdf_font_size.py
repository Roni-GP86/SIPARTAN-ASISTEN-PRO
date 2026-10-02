import os
import re

def fix_pdf_font_size():
    with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. TP Analysis PDF (Bedah TP)
    # headStyles: { font: 'times', fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.25 }
    # styles: { font: 'times', fontSize: 7.5, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25, overflow: 'linebreak' }
    content = content.replace("fontSize: 8", "fontSize: 11")
    content = content.replace("fontSize: 7.5", "fontSize: 11")

    # 2. ATP PDF
    # headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', fontSize: 8.5, lineColor: [0, 0, 0], lineWidth: 0.25 },
    # styles: { font: 'times', fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    content = content.replace("fontSize: 8.5", "fontSize: 11")
    
    # 3. KKTP PDF
    # headStyles: { font: 'times', fillColor: [240, 240, 240], textColor: 0, fontSize: 10, fontStyle: 'bold', lineColor: [0,0,0], lineWidth: 0.2, halign: 'center' },
    # styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0,0,0], lineWidth: 0.2 },
    content = content.replace("fontSize: 10", "fontSize: 11")
    
    # PDF general texts (doc.setFontSize(8) -> doc.setFontSize(11) etc)
    content = re.sub(r"doc\.setFontSize\((?:8|9|9\.5)\)", "doc.setFontSize(11)", content)

    # Let's also check if any other font size needs fixing.
    # We replaced all 7.5, 8, 8.5, 9, 9.5, 10 to 11.
    # Wait, what about Word Exports? 
    # Word exports have CSS for body font-size:
    # <style>
    # body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; ...
    # table { font-size: 10.5pt; ...
    content = re.sub(r"font-size: \d+\.?\d*pt;", "font-size: 11pt;", content)
    content = re.sub(r"font-size:\d+\.?\d*pt;", "font-size: 11pt;", content)

    with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
        f.write(content)

fix_pdf_font_size()
