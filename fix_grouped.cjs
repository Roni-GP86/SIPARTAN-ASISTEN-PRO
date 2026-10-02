const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldGrid = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {examPackages
                    .filter((p) => p.isActive)
                    .map((pkg) => (
                      <div
                        key={pkg.id}`;

const newGrid = `<div>
                  {(() => {
                    const activeExams = examPackages.filter((p) => p.isActive);
                    const groupedExams = activeExams.reduce((acc, pkg) => {
                      const mapel = pkg.mataPelajaran || 'Lainnya';
                      if (!acc[mapel]) acc[mapel] = [];
                      acc[mapel].push(pkg);
                      return acc;
                    }, {});

                    return Object.entries(groupedExams).map(([mapel, pkgs]) => (
                      <div key={mapel} className="mb-6 last:mb-0 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200 shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-700" />
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest drop-shadow-sm">
                            {mapel}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pkgs.map((pkg) => (
                            <div
                              key={pkg.id}`;

content = content.replace(oldGrid, newGrid);

const oldEndGrid = `                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartExam(pkg)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                        >
                          Mulai Ujian Sekarang
                        </button>
                      </div>
                    ))}
                </div>`;

const newEndGrid = `                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartExam(pkg)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Mulai {pkg.jenisAsesmen}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>`;

content = content.replace(oldEndGrid, newEndGrid);

fs.writeFileSync('src/components/RuangMuridView.tsx', content);
