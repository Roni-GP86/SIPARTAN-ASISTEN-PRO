import re

with open('src/components/ATPDocumentView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

modal_code = """
      <ExportConfirmModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        identitas={atp.identitas}
        exportType={exportType}
        documentTitle={`ATP: ${atp.identitas.mataPelajaran}`}
        onConfirm={handleExportConfirm}
      />
    </div>
  );
};
"""
content = re.sub(r"    </div>\s*\);\s*};\s*$", modal_code, content)

with open('src/components/ATPDocumentView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
