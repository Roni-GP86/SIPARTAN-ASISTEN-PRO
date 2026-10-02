const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const kelolaContent = `{activeTab === 'kelola' && (`;

const latihanContent = `{activeTab === 'latihan' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-lg">
                <span className="text-4xl">🎯</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">Ruang Latihan Mandiri</h2>
              <p className="text-orange-50 text-sm max-w-lg font-medium leading-relaxed">
                Asah kemampuanmu dengan soal-soal latihan bawaan sistem. Latihan ini dirancang untuk membantumu lebih siap menghadapi ujian sesungguhnya!
              </p>
              <button 
                onClick={() => showToast('Ruang Latihan sedang dalam tahap pengembangan konten oleh Guru. Nantikan pembaruannya segera!')}
                className="mt-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-extrabold shadow-lg hover:bg-orange-50 hover:scale-105 transition-all"
              >
                Mulai Latihan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      `;

content = content.replace(kelolaContent, latihanContent + kelolaContent);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
