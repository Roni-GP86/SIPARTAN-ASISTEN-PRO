import React from 'react';
import { motion } from 'motion/react';
import { AppLogo } from './AppLogo';
import { ArrowRight, GraduationCap, Building, Sparkles, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audioEffects';

interface PortalSelectionViewProps {
  onSelectPortal: (mode: 'guru' | 'murid') => void;
}

export const PortalSelectionView: React.FC<PortalSelectionViewProps> = ({ onSelectPortal }) => {
  return (
    <div className="fixed inset-0 z-[90] bg-[#070e1c] overflow-y-auto overflow-x-hidden w-full h-full">
      {/* Subtle Ambient Radial Glows */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="min-h-full w-full flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 md:p-8 py-8 sm:py-12">
        <div className="relative z-10 max-w-3xl w-full mx-auto space-y-5 sm:space-y-6 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center space-y-2.5">
            <div className="flex justify-center mb-1">
              <AppLogo size="lg" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 tracking-tight leading-tight drop-shadow-sm">
              Tentukan Tujuan Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-md mx-auto">
              Sistem Informasi Pembelajaran & Asesmen Terpadu • SD Negeri Fatubai
            </p>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Guru Card */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => sounds.playCardHover()}
            onClick={() => {
              sounds.playSelect();
              onSelectPortal('guru');
            }}
            className="group relative flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#101F3B] to-[#0A1326] border-2 border-blue-500/30 hover:border-blue-400/80 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] transition-all duration-300 cursor-pointer overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Khusus Pendidik / Guru
            </span>

            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Building className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-white mb-2">Ruang Guru</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Perancangan modul ajar kurikulum merdeka, bank soal CBT, analisis CP/TP, dan rekap nilai siswa.
            </p>
            
            <div className="mt-auto pt-3 border-t border-blue-900/40 w-full flex flex-col items-center gap-1">
              <span className="text-[10.5px] text-blue-300/80 font-semibold">
                Kode Akses Guru (GP-XXXX) atau Lengkapi Formulir
              </span>
              <div className="inline-flex items-center gap-1.5 text-blue-400 text-xs font-black group-hover:text-blue-200 mt-1">
                Masuk Ruang Guru <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Murid Card */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => sounds.playCardHover()}
            onClick={() => {
              sounds.playWelcome();
              onSelectPortal('murid');
            }}
            className="group relative flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0B2520] to-[#061512] border-2 border-emerald-500/30 hover:border-emerald-400/80 shadow-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all duration-300 cursor-pointer overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-4 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Peserta Didik • Kode Akses Lisan
            </span>

            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <GraduationCap className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-white mb-2">Ruang Murid</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Mengerjakan ulangan harian, STS, SAS dan bahan bacaan literasi dengan format game yang seru & interaktif.
            </p>
            
            <div className="mt-auto pt-3 border-t border-emerald-900/40 w-full flex flex-col items-center gap-1">
              <span className="text-[10.5px] text-emerald-300 font-bold">
                Memerlukan Kode Akses Siswa dari Guru
              </span>
              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-black group-hover:text-emerald-200 mt-1">
                Masuk Ruang Murid <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>

        </div>
      </div>
    </div>
  );
};
