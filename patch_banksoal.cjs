const fs = require('fs');
let content = fs.readFileSync('src/components/BankSoalView.tsx', 'utf8');

// 1. Remove the old Publish button
const oldPublish = `            {/* Direct Publish to Ruang Murid CBT */}
            {soalDocument && onPublishToRuangMurid && (
              <button
                id="btn-publish-ruang-murid"
                onClick={() => onPublishToRuangMurid(soalDocument)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:brightness-110 text-white border-2 border-blue-400 shadow-md transition-all cursor-pointer active:scale-95"
                title="Aktifkan paket ujian ini agar peserta didik dapat langsung mengerjakan asesmen di Ruang Murid CBT"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>🚀 Buka Ujian di Ruang Murid</span>
              </button>
            )}`;

content = content.replace(oldPublish, "");

// 2. Add the new Synchronization Panel at the top of the Naskah Soal view
const naskahStart = `{activeTab === 'naskah' && soalDocument && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6">`;

const newNaskahStart = `{activeTab === 'naskah' && soalDocument && (
        <div className="space-y-6 animate-in fade-in">
          {/* SINKRONISASI KE RUANG MURID PANEL */}
          {onPublishToRuangMurid && (
            <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-indigo-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0 border border-indigo-400/30 shadow-inner">
                  <span className="text-2xl">📡</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-sm sm:text-base">
                    Sistem Ujian Berbasis Komputer (CBT)
                  </h3>
                  <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    Naskah soal ini dapat langsung diaktifkan secara digital. Murid akan menemukan paket <strong>{soalDocument.konfigurasi.jenisAsesmen}</strong> ini di Ruang Murid mereka.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onPublishToRuangMurid(soalDocument)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 border-2 border-emerald-300/50"
              >
                <Sparkles className="w-4 h-4 text-emerald-100" />
                <span>Sinkronisasi ke Ruang {soalDocument.konfigurasi.jenisAsesmen}</span>
              </button>
            </div>
          )}

        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6 relative">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-bl-xl rounded-tr-xl tracking-wider">
            PREVIEW NASKAH SOAL
          </div>`;

content = content.replace(naskahStart, newNaskahStart);
// Close the extra div wrap added for the section
const naskahEnd = `          </div>
        </div>
      )}`;
const newNaskahEnd = `          </div>
        </div>
        </div>
      )}`;
content = content.replace(naskahEnd, newNaskahEnd);

fs.writeFileSync('src/components/BankSoalView.tsx', content);
