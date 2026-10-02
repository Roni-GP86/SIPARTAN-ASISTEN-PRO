with open('src/components/TPAnalysisView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "exportBedahCPToWord(updatedIdentitas, tpList, elemenRows);",
    "exportTPAnalysisToWord(tpList, updatedIdentitas, elemen, capaianPembelajaran, rasionalAnalisis, elemenRows);"
)
content = content.replace(
    "exportBedahCPToPDF(updatedIdentitas, tpList, elemenRows);",
    "exportTPAnalysisToPDF(tpList, updatedIdentitas, elemen, capaianPembelajaran, rasionalAnalisis, elemenRows);"
)

with open('src/components/TPAnalysisView.tsx', 'w') as f:
    f.write(content)
