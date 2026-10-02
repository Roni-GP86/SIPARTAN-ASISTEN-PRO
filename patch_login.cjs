const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const returnStart = `  return (
    <div className="space-y-6 pb-16">`;

const newReturnStart = `  // ===== LOGIN SCREEN (PILIH KARTU NAMA) =====
  if (!selectedStudent && !studentName) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#070e1c] rounded-3xl border-4 border-blue-900/40 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 border-2 border-white/20 mb-2">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              Portal Ruang Murid
            </h1>
            <p className="text-sm sm:text-base text-blue-200 font-medium max-w-lg mx-auto">
              Silakan pilih kartu nama kamu di bawah ini untuk masuk ke ruang kelas digital dan melihat daftar ujian yang tersedia.
            </p>
          </div>

          <div className="w-full bg-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {studentList.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Pilih Kartu Identitas Kamu
                  </h3>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-black rounded-lg border border-slate-700">
                    {studentList.length} Murid
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2 pb-2">
                  {studentList.map(stu => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(stu);
                        setStudentName(stu.nama);
                        setStudentNisn(stu.nisn);
                        // Optional: play click sound here
                        try {
                          const audio = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'); // silent stub or real beep later
                          audio.play().catch(e=>console.log(e));
                        } catch(e) {}
                      }}
                      className="group flex flex-col text-left p-4 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl hover:border-emerald-400 hover:from-emerald-900/40 hover:to-slate-900 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full group-hover:bg-emerald-400/20 transition-colors" />
                      <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 mb-3 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-colors shrink-0">
                        <span className="text-lg font-black text-slate-300 group-hover:text-white">
                          {stu.nama.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-200 text-sm sm:text-base leading-tight group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {stu.nama}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-emerald-400/70">
                        NISN: {stu.nisn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                    <UserCircle2 className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white">Masukkan Identitas Manual</h3>
                  <p className="text-xs text-slate-400">Guru belum mengimpor data kelas. Silakan ketik nama dan NISN kamu di bawah ini.</p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const n = fd.get('nama') as string;
                    const nis = fd.get('nisn') as string;
                    if(n) {
                      setStudentName(n);
                      setStudentNisn(nis);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 ml-1">Nama Lengkap</label>
                    <input name="nama" required placeholder="Contoh: Budi Santoso" className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 ml-1">NISN (Opsional)</label>
                    <input name="nisn" placeholder="Contoh: 0012345678" className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span>Masuk ke Ruang Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
          
          <button onClick={onSwitchToRuangGuru} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 opacity-60 hover:opacity-100">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Ruang Guru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">`;

content = content.replace(returnStart, newReturnStart);

// Let's add UserCircle2 import
content = content.replace("Users,", "Users,\n  UserCircle2,");

fs.writeFileSync('src/components/RuangMuridView.tsx', content);
