import re

with open('src/components/TPAnalysisView.tsx', 'r') as f:
    content = f.read()

handler_code = """  const handleExportConfirm = (tempat: string, tanggal: string) => {
    const updatedIdentitas = {
      ...identitas,
      tempatPenetapan: tempat,
      tanggalPenetapan: tanggal,
    };
    if (exportType === 'WORD') {
      exportBedahCPToWord(updatedIdentitas, tpList, elemenRows);
    } else {
      exportBedahCPToPDF(updatedIdentitas, tpList, elemenRows);
    }
    setIsExportModalOpen(false);
  };

  const handleDownloadWord = () => {
"""

if "const handleExportConfirm" not in content:
    content = content.replace("  const handleDownloadWord = () => {\n", handler_code)
    
with open('src/components/TPAnalysisView.tsx', 'w') as f:
    f.write(content)
