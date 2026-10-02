import re
import glob

files = [
    'src/components/TPAnalysisView.tsx',
    'src/components/KKTPDocumentView.tsx',
    'src/components/ModulAjarView.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    import_statement = "import { ExportConfirmModal } from './ExportConfirmModal';\n"
    if "ExportConfirmModal" not in content:
        content = content.replace("import { SchoolIdentity", import_statement + "import { SchoolIdentity")
        
        # Also handle TPAnalysisView which has TPItem instead of SchoolIdentity in some places
        if "import { SchoolIdentity" not in content:
            content = content.replace("import React", "import React\n" + import_statement)

    # Add states
    state_code = """  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF'>('WORD');"""
    if "isExportModalOpen" not in content:
        content = re.sub(
            r"(const \w+View.*?\{)",
            r"\1\n" + state_code,
            content
        )

    # Figure out the prop name for identity
    doc_var = "kktp" if "KKTPDocumentView" in file_path else ("modul" if "ModulAjarView" in file_path else "identitas")
    if file_path == 'src/components/TPAnalysisView.tsx':
        export_word = "exportBedahCPToWord(identitas, tpList, elemenRows);"
        export_pdf = "exportBedahCPToPDF(identitas, tpList, elemenRows);"
        ident_ref = "identitas"
        doc_title = "Bedah CP"
        # TPAnalysisView export function replacement
        content = re.sub(r"const handleDownloadPDF = \(\) => \{\s*exportBedahCPToPDF\(identitas, tpList, elemenRows\);\s*\};",
            """const handleDownloadPDF = () => {
    setExportType('PDF');
    setIsExportModalOpen(true);
  };""", content)
        content = re.sub(r"const handleDownloadWord = \(\) => \{\s*exportBedahCPToWord\(identitas, tpList, elemenRows\);\s*\};",
            """const handleDownloadWord = () => {
    setExportType('WORD');
    setIsExportModalOpen(true);
  };""", content)
        confirm_handler = """  const handleExportConfirm = (tempat: string, tanggal: string) => {
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
  };"""

    elif file_path == 'src/components/KKTPDocumentView.tsx':
        ident_ref = "kktp.identitas"
        doc_title = "KKTP"
        content = re.sub(r"const handleDownloadPDF = \(\) => \{\s*exportKKTPToPDF\(kktp\);\s*\};",
            """const handleDownloadPDF = () => {
    setExportType('PDF');
    setIsExportModalOpen(true);
  };""", content)
        content = re.sub(r"const handleDownloadWord = \(\) => \{\s*exportKKTPToWord\(kktp\);\s*\};",
            """const handleDownloadWord = () => {
    setExportType('WORD');
    setIsExportModalOpen(true);
  };""", content)
        confirm_handler = """  const handleExportConfirm = (tempat: string, tanggal: string) => {
    const updatedKktp = {
      ...kktp,
      identitas: {
        ...kktp.identitas,
        tempatPenetapan: tempat,
        tanggalPenetapan: tanggal,
      }
    };
    if (exportType === 'WORD') {
      exportKKTPToWord(updatedKktp);
    } else {
      exportKKTPToPDF(updatedKktp);
    }
    setIsExportModalOpen(false);
  };"""

    elif file_path == 'src/components/ModulAjarView.tsx':
        ident_ref = "modul.identitas"
        doc_title = "Modul Ajar"
        content = re.sub(r"const handleDownloadPDF = \(\) => \{\s*exportModulAjarToPDF\(modul\);\s*\};",
            """const handleDownloadPDF = () => {
    setExportType('PDF');
    setIsExportModalOpen(true);
  };""", content)
        content = re.sub(r"const handleDownloadWord = \(\) => \{\s*exportModulAjarToWord\(modul\);\s*\};",
            """const handleDownloadWord = () => {
    setExportType('WORD');
    setIsExportModalOpen(true);
  };""", content)
        confirm_handler = """  const handleExportConfirm = (tempat: string, tanggal: string) => {
    const updatedModul = {
      ...modul,
      identitas: {
        ...modul.identitas,
        tempatPenetapan: tempat,
        tanggalPenetapan: tanggal,
      }
    };
    if (exportType === 'WORD') {
      exportModulAjarToWord(updatedModul);
    } else {
      exportModulAjarToPDF(updatedModul);
    }
    setIsExportModalOpen(false);
  };"""

    if "handleExportConfirm" not in content:
        content = content.replace("const handleDownloadWord", confirm_handler + "\n\n  const handleDownloadWord")

    # Modals at EOF
    modal_code = f"""
      <ExportConfirmModal
        isOpen={{isExportModalOpen}}
        onClose={{() => setIsExportModalOpen(false)}}
        identitas={{{ident_ref}}}
        exportType={{exportType}}
        documentTitle={{`{doc_title}`}}
        onConfirm={{handleExportConfirm}}
      />
    </div>
  );
}};
"""
    content = re.sub(r"    </div>\s*\);\s*};\s*$", modal_code, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

