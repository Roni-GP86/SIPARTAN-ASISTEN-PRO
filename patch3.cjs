const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const tabUjianBtn = `          <button
            onClick={() => {
              setActiveExamToTake(null);
              setIsExamStarted(false);
              setExamResult(null);
              setActiveTab('ujian');
            }}
            className={\`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer \${
              activeTab === 'ujian'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
            }\`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Ruang Ujian</span>
            <span className="sm:hidden">Ujian</span>
          </button>`;

const tabLatihanBtn = `          <button
            onClick={() => {
              setActiveExamToTake(null);
              setIsExamStarted(false);
              setExamResult(null);
              setActiveTab('latihan');
            }}
            className={\`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer \${
              activeTab === 'latihan'
                ? 'bg-orange-500 text-white shadow-lg scale-105'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-orange-300'
            }\`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Ruang Latihan</span>
            <span className="sm:hidden">Latihan</span>
          </button>`;

content = content.replace(tabUjianBtn, tabUjianBtn + '\n' + tabLatihanBtn);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
