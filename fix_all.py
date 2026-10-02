files = [
    'src/components/KKTPDocumentView.tsx',
    'src/components/ModulAjarView.tsx'
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # The issue: "import React\nimport { ExportConfirmModal } from './ExportConfirmModal';\n, { useState } from 'react';"
    content = content.replace(
        "import React\nimport { ExportConfirmModal } from './ExportConfirmModal';\n, { useState } from 'react';",
        "import React, { useState } from 'react';\nimport { ExportConfirmModal } from './ExportConfirmModal';"
    )
    
    with open(file_path, 'w') as f:
        f.write(content)
