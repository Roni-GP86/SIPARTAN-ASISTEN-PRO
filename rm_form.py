with open('src/components/RuangMuridView.tsx', 'r') as f:
    content = f.read()

start_marker = """          {/* JIKA MEMILIH PAKET TAPI BELUM KLIK MULAI (FORM IDENTITAS SISWA) */}
          {activeExamToTake && !isExamStarted && !examResult && ("""

end_marker = """                <button
                  onClick={() => {
                    if (!studentName || !studentNisn) {
                      showToast('Nama Lengkap dan NISN wajib diisi sebelum mulai!');
                      return;
                    }
                    setIsExamStarted(true);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Ya, Saya Siap Mulai Ujian</span>
                </button>
              </div>
            </div>
          )}

          {/* JIKA UJIAN SEDANG BERLANGSUNG */}"""

if start_marker in content and end_marker in content:
    pre = content.split(start_marker)[0]
    post = end_marker + content.split(end_marker)[1]
    with open('src/components/RuangMuridView.tsx', 'w') as f:
        f.write(pre + "\n" + post)
    print("Removed identitas form successfully")
else:
    print("Markers not found")
