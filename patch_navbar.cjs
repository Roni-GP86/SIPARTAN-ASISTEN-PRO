const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

const guruMenuStart = `<div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">
          <span className="text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1">
            <span>📚</span>
            <span>Menu Ruang Guru</span>
          </span>
          <span className="text-[9.5px] text-amber-300 font-bold bg-[#0E1B38] px-2 py-0.5 rounded-full border border-amber-500/40 shadow-xs">
            SIPARTAN
          </span>
        </div>`;

const wrapperStart = `{portalMode === 'guru' && (
          <div className="space-y-2">
            ${guruMenuStart}`;

content = content.replace(guruMenuStart, wrapperStart);

// find the end of the guru tabs. The last tab is saved items (Arsip Workspace)
const savedItemsEnd = `            <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 border border-red-300">
              {savedCount}
            </div>
          )}
        </button>`;

const newSavedItemsEnd = `            <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 border border-red-300">
              {savedCount}
            </div>
          )}
        </button>
      </div>
    )}`;

content = content.replace(savedItemsEnd, newSavedItemsEnd);

fs.writeFileSync('src/components/Navbar.tsx', content);
