with open('src/components/TPAnalysisView.tsx', 'r') as f:
    content = f.read()

content = content.replace("import Reactimport { ExportConfirmModal } from './ExportConfirmModal';", "import React, { useState } from 'react';\nimport { ExportConfirmModal } from './ExportConfirmModal';")
with open('src/components/TPAnalysisView.tsx', 'w') as f:
    f.write(content)
