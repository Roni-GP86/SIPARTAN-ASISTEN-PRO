const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldPG = `{/* BENTUK 1: PILIHAN GANDA */}
                  {currentQ.bentukSoal === 'Pilihan Ganda' && (
                    <div className="space-y-4">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                        {currentQ.soal.pertanyaan}
                      </p>
                      <div className="space-y-2.5 pt-2">
                        {currentQ.soal.opsi.map((opt: any) => {
                          const isSelected =
                            studentAnswers[currentQ.displayNum] === opt.label;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => {
                                setStudentAnswers((prev) => ({
                                  ...prev,
                                  [currentQ.displayNum]: opt.label,
                                }));
                              }}
                              className={\`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer \${
                                isSelected
                                  ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-2xs font-semibold'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }\`}
                            >
                              <span
                                className={\`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 \${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }\`}
                              >
                                {opt.label}
                              </span>
                              <span className="text-xs sm:text-sm pt-0.5">{opt.teks}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}`;

const newPG = `{/* BENTUK 1: PILIHAN GANDA */}
                  {currentQ.bentukSoal === 'Pilihan Ganda' && (
                    <div className="space-y-6 animate-in zoom-in duration-300">
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border-2 border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <p className="text-lg sm:text-xl font-extrabold text-indigo-950 leading-relaxed drop-shadow-sm text-center">
                          {currentQ.soal.pertanyaan}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQ.soal.opsi.map((opt: any, idx: number) => {
                          const isSelected = studentAnswers[currentQ.displayNum] === opt.label;
                          const bgColors = [
                            'from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600',
                            'from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600',
                            'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
                            'from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600'
                          ];
                          const activeColor = bgColors[idx % 4];
                          
                          return (
                            <button
                              key={opt.label}
                              onClick={() => {
                                setStudentAnswers((prev) => ({
                                  ...prev,
                                  [currentQ.displayNum]: opt.label,
                                }));
                              }}
                              className={\`relative overflow-hidden w-full text-left p-5 rounded-2xl border-b-4 transition-all flex items-center gap-4 cursor-pointer transform hover:-translate-y-1 \${
                                isSelected
                                  ? \`bg-gradient-to-b \${activeColor} border-b-black/20 text-white shadow-xl scale-[1.02]\`
                                  : 'bg-white border-b-slate-200 hover:border-b-slate-300 text-slate-700 shadow-sm'
                              }\`}
                            >
                              <div className={\`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-inner \${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }\`}>
                                {opt.label}
                              </div>
                              <span className={\`text-sm sm:text-base font-bold flex-1 \${isSelected ? 'text-white drop-shadow-md' : 'text-slate-700'}\`}>
                                {opt.teks}
                              </span>
                              {isSelected && (
                                <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}`;

content = content.replace(oldPG, newPG);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
