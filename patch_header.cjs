const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldHeader = `        {/* Switch back to Ruang Guru */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSwitchToRuangGuru}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-extrabold text-xs shadow-md hover:bg-sky-50 transition-all cursor-pointer border border-blue-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ruang Guru</span>
          </button>
        </div>
      </div>`;

const newHeader = `        {/* Current Student Profile */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-3 bg-white/10 p-2 pr-4 rounded-full border border-white/20 shadow-inner backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <span className="font-black text-white text-lg">
                {studentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Sedang Login</span>
              <span className="font-extrabold text-sm text-white leading-tight max-w-[120px] truncate">{studentName}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                setSelectedStudent(null);
                setStudentName('');
                setStudentNisn('');
              }}
              className="inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border border-rose-500/30"
            >
              <span>Keluar / Ganti Siswa</span>
            </button>
            <button
              onClick={onSwitchToRuangGuru}
              className="inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border border-white/20"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Ke Ruang Guru</span>
            </button>
          </div>
        </div>
      </div>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
