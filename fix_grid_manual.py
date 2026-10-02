import re

with open('src/components/RuangMuridView.tsx', 'r') as f:
    content = f.read()

start_marker = """              {examPackages.filter((p) => p.isActive).length === 0 ? ("""
end_marker = """          {/* JIKA MEMILIH PAKET TAPI BELUM KLIK MULAI (FORM IDENTITAS SISWA) */}"""

if start_marker in content and end_marker in content:
    pre = content.split(start_marker)[0] + start_marker + "\n"
    
    empty_state = """                <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <h4 className="text-base font-extrabold text-amber-900">
                    Belum Ada Paket Ujian yang Diaktifkan
                  </h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto">
                    Guru belum mengaktifkan paket soal untuk peserta didik. Silakan buka modul <strong>Bank Soal</strong> di Ruang Guru atau tab <strong>Kelola Paket Ujian</strong> untuk mengaktifkan paket ujian.
                  </p>
                  <button
                    onClick={() => setActiveTab('kelola')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs cursor-pointer shadow-md"
                  >
                    <span>Buka Tab Kelola Paket Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : ("""

    new_content = """                <div>
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
                              key={pkg.id}
                              className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                {pkg.jenisAsesmen}
                              </div>

                              <div className="space-y-2">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                                  {pkg.mataPelajaran}
                                </span>
                                <h4 className="text-base font-black text-slate-900 leading-snug">
                                  {pkg.judul}
                                </h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>{pkg.fase} • Kelas {pkg.kelas}</span>
                                </p>

                                {/* Khusus Ulangan Harian: Wajib Tampilkan Tujuan Pembelajaran (TP) */}
                                {pkg.daftarTP && pkg.daftarTP.length > 0 && (
                                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                                    <span className="font-extrabold text-slate-800 block text-[10px] uppercase tracking-wider">
                                      🎯 Tujuan Pembelajaran (TP):
                                    </span>
                                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                      {pkg.daftarTP.map((t, tIdx) => (
                                        <div key={tIdx} className="flex gap-1.5 text-slate-700">
                                          <span className="font-bold text-blue-700 shrink-0">[{t.kodeTP}]</span>
                                          <span className="line-clamp-2">{t.rumusanTP}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-100">
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{pkg.durasiMenit || 60} Menit</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{pkg.soalDocument.ringkasanDistribusi.totalSoal} Butir Soal</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleStartExam(pkg)}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                              >
                                <Play className="w-4 h-4 fill-white" />
                                <span>Mulai Mengerjakan Soal</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
"""
    post = end_marker + content.split(end_marker)[1]
    
    with open('src/components/RuangMuridView.tsx', 'w') as f:
        f.write(pre + empty_state + new_content + post)
