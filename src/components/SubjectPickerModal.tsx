import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  Layers,
  ArrowRight,
  GraduationCap,
  Star,
} from 'lucide-react';
import { OFFICIAL_SUBJECT_FOLDERS, SubjectFolder } from '../data/officialCPDatabase';
import {
  getSubjectAnalysisStatus,
  getSubjectEmoticon,
} from '../utils/subjectWorkspaceService';
import { sounds } from '../utils/audioEffects';

interface SubjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject?: string;
  currentMataPelajaran?: string;
  currentFase: string;
  allowedFase?: string;
  onSelectSubject?: (folder: SubjectFolder) => void;
  onSelectAnalyzedSubject?: (folder: SubjectFolder) => void;
  onRequestUnanalyzedSubject?: (folder: SubjectFolder) => void;
}

// Visual theme definitions per subject for ultra-vibrant, animated game-like cards
function getSubjectTheme(mapel: string, isSelected: boolean) {
  const m = (mapel || '').toLowerCase();

  if (m.includes('matematika')) {
    return {
      gradient: isSelected
        ? 'from-blue-600/30 via-[#0B2550] to-cyan-900/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
        : 'from-[#081830] via-[#0B2042] to-[#061428] border-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-500/20',
      iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-cyan-500/30',
      badgeFase: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      accentColor: 'text-cyan-300',
      tagBg: 'bg-cyan-950/60 text-cyan-200 border-cyan-800/40',
      emoji: '📐',
    };
  }
  if (m.includes('alam') || m.includes('ipas') || m.includes('sosial')) {
    return {
      gradient: isSelected
        ? 'from-emerald-600/30 via-[#072F24] to-teal-900/40 border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
        : 'from-[#041E17] via-[#072920] to-[#041611] border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-500/20',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/30',
      badgeFase: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      accentColor: 'text-emerald-300',
      tagBg: 'bg-emerald-950/60 text-emerald-200 border-emerald-800/40',
      emoji: '🔬',
    };
  }
  if (m.includes('indonesia')) {
    return {
      gradient: isSelected
        ? 'from-amber-600/30 via-[#361E0A] to-orange-900/40 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
        : 'from-[#241306] via-[#2F1A08] to-[#1A0B03] border-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/20',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 shadow-amber-500/30',
      badgeFase: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      accentColor: 'text-amber-300',
      tagBg: 'bg-amber-950/60 text-amber-200 border-amber-800/40',
      emoji: '📖',
    };
  }
  if (m.includes('pancasila') || m.includes('pkn') || m.includes('kewarganegaraan')) {
    return {
      gradient: isSelected
        ? 'from-rose-600/30 via-[#3D0F1B] to-red-900/40 border-rose-400 ring-2 ring-rose-400/50 shadow-rose-500/20'
        : 'from-[#270911] via-[#330D17] to-[#1C050B] border-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/20',
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-rose-500/30',
      badgeFase: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      accentColor: 'text-rose-300',
      tagBg: 'bg-rose-950/60 text-rose-200 border-rose-800/40',
      emoji: '🇮🇩',
    };
  }
  if (m.includes('seni') || m.includes('musik') || m.includes('rupa') || m.includes('tari') || m.includes('teater')) {
    return {
      gradient: isSelected
        ? 'from-purple-600/30 via-[#310E3D] to-fuchsia-900/40 border-fuchsia-400 ring-2 ring-fuchsia-400/50 shadow-fuchsia-500/20'
        : 'from-[#200829] via-[#2A0B36] to-[#17051D] border-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/20',
      iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-purple-500/30',
      badgeFase: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      accentColor: 'text-fuchsia-300',
      tagBg: 'bg-purple-950/60 text-purple-200 border-purple-800/40',
      emoji: '🎨',
    };
  }
  if (m.includes('jasmani') || m.includes('pjok') || m.includes('olahraga')) {
    return {
      gradient: isSelected
        ? 'from-orange-600/30 via-[#381F08] to-yellow-900/40 border-orange-400 ring-2 ring-orange-400/50 shadow-orange-500/20'
        : 'from-[#241304] via-[#2E1805] to-[#180C03] border-orange-500/30 hover:border-orange-400 hover:shadow-orange-500/20',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-orange-500/30',
      badgeFase: 'bg-orange-950/80 text-orange-300 border-orange-500/40',
      accentColor: 'text-orange-300',
      tagBg: 'bg-orange-950/60 text-orange-200 border-orange-800/40',
      emoji: '⚽',
    };
  }
  if (m.includes('agama') || m.includes('katolik')) {
    return {
      gradient: isSelected
        ? 'from-indigo-600/30 via-[#1C1642] to-violet-900/40 border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-500/20'
        : 'from-[#110D2E] via-[#17123A] to-[#0D0921] border-indigo-500/30 hover:border-indigo-400 hover:shadow-indigo-500/20',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30',
      badgeFase: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
      accentColor: 'text-indigo-300',
      tagBg: 'bg-indigo-950/60 text-indigo-200 border-indigo-800/40',
      emoji: '⛪',
    };
  }

  // Default theme
  return {
    gradient: isSelected
      ? 'from-blue-600/30 via-[#0F1E3A] to-slate-900/40 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20'
      : 'from-[#0B1528] via-[#0E1E3B] to-[#070E1C] border-slate-700/60 hover:border-amber-400 hover:shadow-amber-500/20',
    iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-amber-500/30',
    badgeFase: 'bg-slate-900 text-slate-300 border-slate-700',
    accentColor: 'text-amber-300',
    tagBg: 'bg-slate-900/60 text-slate-300 border-slate-800',
    emoji: '📚',
  };
}

export const SubjectPickerModal: React.FC<SubjectPickerModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  currentMataPelajaran,
  currentFase,
  allowedFase = 'ALL',
  onSelectSubject,
  onSelectAnalyzedSubject,
  onRequestUnanalyzedSubject,
}) => {
  const activeSubjectName = currentMataPelajaran || currentSubject || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [faseFilter, setFaseFilter] = useState<string>(allowedFase !== 'ALL' ? allowedFase : currentFase);

  if (!isOpen) return null;

  const filteredFolders = OFFICIAL_SUBJECT_FOLDERS.filter((folder) => {
    const matchFase = faseFilter === 'ALL' || folder.fase === faseFilter;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchSearch =
      q === '' ||
      (folder.mataPelajaran || '').toLowerCase().includes(q) ||
      (folder.deskripsiMapel || '').toLowerCase().includes(q);
    return matchFase && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#070e1c] border-2 border-amber-500/70 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-100 ring-4 ring-amber-500/20 my-auto animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#040812] via-[#0E1E3C] to-[#040812] border-b-2 border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 border-2 border-amber-300/40 shrink-0">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Bank Mata Pelajaran Resmi BSKAP No. 046/2025 &amp; BKP No. 20/2026
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {filteredFolders.length} Mapel Tersedia</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>Pilih Mata Pelajaran Interaktif</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 bg-[#050A17] border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran (Matematika, IPAS, Bahasa Indonesia, Seni, PJOK...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#091224] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Fase Pills */}
          {allowedFase === 'ALL' && (
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Fase A', 'Fase B', 'Fase C'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setFaseFilter(f);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    faseFilter === f
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {f === 'ALL' ? 'Semua Fase' : f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Subject Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#040814]">
          {filteredFolders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-bold text-slate-300">Mata pelajaran tidak ditemukan dengan kata kunci tersebut.</p>
              <p className="text-slate-500">Coba ganti filter fase atau gunakan kata kunci lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredFolders.map((folder) => {
                const status = getSubjectAnalysisStatus(folder.mataPelajaran, folder.fase);
                const isActive =
                  (folder.mataPelajaran || '').toLowerCase().trim() === activeSubjectName.toLowerCase().trim() &&
                  (folder.fase || '').toLowerCase().trim() === (currentFase || '').toLowerCase().trim();
                const emoticon = getSubjectEmoticon(folder.mataPelajaran);
                const theme = getSubjectTheme(folder.mataPelajaran, isActive);

                return (
                  <div
                    key={folder.id}
                    onMouseEnter={() => sounds.playCardHover()}
                    onClick={() => {
                      sounds.playSelect();
                      if (onSelectSubject) {
                        onSelectSubject(folder);
                        onClose();
                      } else if (status.isComplete || status.hasTP) {
                        onSelectAnalyzedSubject?.(folder);
                        onClose();
                      } else {
                        onRequestUnanalyzedSubject?.(folder);
                      }
                    }}
                    className={`group relative p-4 sm:p-4.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-lg bg-gradient-to-br hover:-translate-y-1 hover:shadow-xl active:scale-98 ${theme.gradient}`}
                  >
                    {/* Corner decorative light */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                    <div>
                      {/* Top Row: Icon + Title + Active/Status Indicator */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div
                          className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg border-2 border-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${theme.iconBg}`}
                        >
                          {emoticon || theme.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-xs ${theme.badgeFase}`}
                            >
                              {folder.fase}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/90 text-slate-300 border border-slate-700">
                              Kelas {folder.kelas}
                            </span>

                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-slate-950" />
                                <span>Aktif</span>
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-white text-sm sm:text-base leading-snug group-hover:text-amber-300 transition-colors">
                            {folder.mataPelajaran}
                          </h4>
                        </div>
                      </div>

                      {/* Elemen Tags */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>{folder.elemenList.length} Elemen Capaian:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                          {folder.elemenList.slice(0, 3).map((e, eIdx) => (
                            <span
                              key={eIdx}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${theme.tagBg}`}
                            >
                              {e.elemen}
                            </span>
                          ))}
                          {folder.elemenList.length > 3 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                              +{folder.elemenList.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status & CTA */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        {status.isComplete ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Dokumen Lengkap ({status.tpCount} TP)</span>
                          </div>
                        ) : status.hasTP ? (
                          <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            <span>Analisis TP Siap</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span>Perlu Analisis CP</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                        <span>Pilih Mapel</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 sm:p-4 bg-[#040812] border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span>
              Dokumen tersimpan otomatis per mata pelajaran di cache lokal dan Firebase Firestore.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
