const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldStartExam = `  const handleStartExam = (pkg: ExamPackage) => {
    setActiveExamToTake(pkg);
    setStudentName('');
    setStudentNisn('');
    setStudentClass(identitas.kelas || '5');
    setStudentAnswers({});
    setRaguRaguMap({});
    setCurrentQuestionIndex(0);
    setTimeLeftSeconds((pkg.durasiMenit || 60) * 60);
    setIsExamStarted(false);
    setExamResult(null);
  };`;

const newStartExam = `  const handleStartExam = (pkg: ExamPackage) => {
    setActiveExamToTake(pkg);
    setStudentClass(identitas.kelas || '5');
    setStudentAnswers({});
    setRaguRaguMap({});
    setCurrentQuestionIndex(0);
    setTimeLeftSeconds((pkg.durasiMenit || 60) * 60);
    
    // Langsung mulai karena identitas sudah terpilih di awal
    setIsExamStarted(true);
    setExamResult(null);
    
    // Play sound Start Game
    try {
      const audio = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
      audio.play().catch(e=>console.log(e));
    } catch(e) {}
  };`;

content = content.replace(oldStartExam, newStartExam);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
