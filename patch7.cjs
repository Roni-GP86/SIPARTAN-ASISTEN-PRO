const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldQWrap = `<div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">`;
const newQWrap = `<div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 relative">
                  {/* Decorative background elements */}
                  <div className="absolute top-10 left-10 w-32 h-32 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />`;

content = content.replace(oldQWrap, newQWrap);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
