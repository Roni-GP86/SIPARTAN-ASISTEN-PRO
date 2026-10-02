const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldHeader = `<div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      {activeExamToTake.judul}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                      {studentName} • {studentClass} • {identitas.mataPelajaran}
                    </p>
                  </div>
                </div>
                {/* Timer & Nav Mobile */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={\`px-3 py-1.5 rounded-lg border-2 text-xs sm:text-sm font-black flex items-center gap-1.5 \${
                    timeLeftSeconds < 300
                      ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                      : 'bg-white border-slate-200 text-slate-700'
                  }\`}>
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor(timeLeftSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(timeLeftSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>`;

const newHeader = `<div className="flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white truncate drop-shadow-sm">
                      {activeExamToTake.judul}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">{studentName}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">Kelas {studentClass}</span>
                    </div>
                  </div>
                </div>
                {/* Timer & Nav Mobile */}
                <div className="flex flex-col items-end gap-1 shrink-0 relative z-10">
                  <div className={\`px-4 py-2 rounded-xl border-b-4 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg \${
                    timeLeftSeconds < 300
                      ? 'bg-rose-500 border-rose-700 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-800'
                  }\`}>
                    <Clock className={\`w-4 h-4 \${timeLeftSeconds < 300 ? 'text-white' : 'text-blue-500'}\`} />
                    <span>
                      {Math.floor(timeLeftSeconds / 60).toString().padStart(2, '0')}:
                      {(timeLeftSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
