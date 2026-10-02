const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const kelolaHeaderEnd = `<div className="flex items-center gap-1.5 text-xs text-indigo-200 mt-1">
                <span>Pengaturan Kunci Ujian & Laporan CBT</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>`;

const csvImportBtn = `          <div className="bg-gradient-to-br from-indigo-950 to-blue-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-md text-white mt-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Kelola Data Murid (Kartu Identitas)
            </h3>
            <p className="text-xs text-indigo-200 mb-4 max-w-2xl">
              Impor data murid (Nama & NISN) menggunakan format CSV atau Excel (.csv). Data ini akan ditampilkan sebagai pilihan kartu nama saat murid akan mengikuti ujian, mencegah kesalahan pengetikan nama/NISN.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload CSV Murid</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text) {
                        const parsed = parseCSVData(text);
                        if (parsed.length > 0) {
                          const existing = getStudentList();
                          const merged = [...existing, ...parsed];
                          // Optional: filter out duplicates by NISN
                          const unique = Array.from(new Map(merged.map(item => [item.nisn, item])).values());
                          saveStudentList(unique);
                          setStudentList(unique);
                          showToast(\`Berhasil mengimpor \${parsed.length} data murid.\`);
                        } else {
                          showToast('Format CSV tidak valid atau kosong.');
                        }
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
              <button 
                type="button"
                onClick={() => {
                  const csvContent = "NO,NIS / NISN,NAMA SISWA\\n1,12345678,Budi Santoso\\n2,87654321,Siti Aminah";
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = "Template_Data_Murid.csv";
                  link.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-slate-600"
              >
                <Download className="w-4 h-4" />
                <span>Download Template CSV</span>
              </button>
              {studentList.length > 0 && (
                <button 
                  type="button"
                  onClick={() => {
                    if (confirm('Anda yakin ingin menghapus semua data murid?')) {
                      saveStudentList([]);
                      setStudentList([]);
                      showToast('Data murid berhasil dihapus.');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-200 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-red-800/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Data</span>
                </button>
              )}
            </div>
            
            {studentList.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-900/40 rounded-xl border border-indigo-800/50 max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-indigo-300 mb-2">Total: {studentList.length} Murid Tersimpan</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {studentList.map(s => (
                    <div key={s.id} className="text-[10px] bg-slate-900/50 p-1.5 rounded truncate border border-slate-800">
                      <span className="font-bold text-slate-200">{s.nama}</span> <br/>
                      <span className="text-slate-500">{s.nisn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>`;

content = content.replace(kelolaHeaderEnd, kelolaHeaderEnd + '\n' + csvImportBtn);

// Add missing icon imports
content = content.replace(
  "Layers,",
  "Layers,\n  Users,\n  Upload,\n  Trash2,"
);

fs.writeFileSync('src/components/RuangMuridView.tsx', content);
