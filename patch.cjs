const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

// Add imports
content = content.replace(
  "import {",
  "import { StudentInfo } from '../types';\nimport { getStudentList, saveStudentList, parseCSVData } from '../services/studentService';\nimport {"
);

// Add Latihan tab and student list state
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'bacaan' | 'ujian' | 'rekap' | 'kelola'>('ujian');",
  "const [activeTab, setActiveTab] = useState<'bacaan' | 'ujian' | 'latihan' | 'rekap' | 'kelola'>('ujian');\n  const [studentList, setStudentList] = useState<StudentInfo[]>([]);\n  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);"
);

// Add effect to load students
content = content.replace(
  "const refreshData = async () => {",
  "const refreshData = async () => {\n    setStudentList(getStudentList());"
);

fs.writeFileSync('src/components/RuangMuridView.tsx', content);
