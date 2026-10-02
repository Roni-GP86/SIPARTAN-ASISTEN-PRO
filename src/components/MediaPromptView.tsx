import React, { useState, useMemo } from 'react';
import {
  TPItem,
  SchoolIdentity,
  TPMediaPromptItem,
  MediaPromptDocument,
  MediaOutputFormat,
  MediaPromptPreferences,
  MediaPromptThemeSetting,
  MediaPromptCharacterMode,
  MediaPromptCharacterCustomSelection,
  MediaPromptAspectRatio,
  MediaPromptSceneCount,
} from '../types';
import {
  generateMediaPromptsForTPList,
  VISUAL_STYLES,
  VisualStyleType,
  INDONESIAN_SD_UNIFORM_PROMPT,
  FORMAT_SPECIFIC_DIRECTIVES,
  THEME_SETTING_CONFIGS,
  PERMANENT_CHARACTER_PHYSICAL_TRAITS,
} from '../utils/mediaPromptGenerator';
import {
  exportMediaPromptsToWord,
  exportMediaPromptsToPDF,
} from '../utils/exportUtils';
import { ExportConfirmModal } from './ExportConfirmModal';
import { PDFLayoutOptions } from '../types';
import {
  STORAGE_KEYS,
  saveToStorage,
  loadFromStorage,
} from '../utils/storageUtils';
import {
  getOrInitSubjectWorkspace,
  getSubjectEmoticon,
  SubjectWorkspace,
  isTPListValidForSubject,
} from '../utils/subjectWorkspaceService';
import {
  Sparkles,
  BookOpen,
  Copy,
  Check,
  FileText,
  Download,
  Search,
  Palette,
  Info,
  ChevronDown,
  ChevronUp,
  Wand2,
  CheckCircle2,
  Building2,
  User,
  Layout,
  HelpCircle,
  AlertTriangle,
  Presentation,
  BookMarked,
  CreditCard,
  RotateCw,
  Lightbulb,
  ExternalLink,
  SlidersHorizontal,
  Network,
  GitBranch,
  Save,
  BookmarkCheck,
  Film,
  Video,
  PlaySquare,
  Clapperboard,
  Sparkles as SparklesIcon,
  Users,
  Shirt,
  Compass,
  Rocket,
  Tent,
  FlaskConical,
  MapPin,
  CheckSquare,
  Square,
  Smartphone,
  Monitor,
  Timer,
  Clock,
} from 'lucide-react';

interface MediaPromptViewProps {
  identitas: SchoolIdentity;
  tpList: TPItem[];
  onOpenIdentityModal?: () => void;
  onUpdateIdentitas?: (updated: Partial<SchoolIdentity>) => void;
  onSwitchSubjectWorkspace?: (workspace: SubjectWorkspace) => void;
}

export const SD_MAPEL_OPTIONS = [
  'Matematika',
  'Bahasa Indonesia',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Pendidikan Pancasila',
  'Seni Rupa',
  'Seni Musik',
  'Seni Tari',
  'Seni Teater',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Pendidikan Agama Katolik dan Budi Pekerti',
];

type MediaTypeFilter = 'all' | 'video' | 'slide' | 'notebook' | 'flashcard' | 'infografis' | 'petakonsep';

const DEFAULT_PROMPT_PREFS: MediaPromptPreferences = {
  mediaTypeFilter: 'video',
  selectedStyle: 'pixar',
  selectedClassFilter: 'all',
  themeSetting: 'auto',
  characterMode: 'dynamic',
  customCharacters: {
    pakRoni: true,
    ghea: true,
    jordy: true,
  },
  aspectRatio: 'landscape',
  sceneCount: 'auto',
};

export const MediaPromptView: React.FC<MediaPromptViewProps> = ({
  identitas,
  tpList,
  onOpenIdentityModal,
  onUpdateIdentitas,
  onSwitchSubjectWorkspace,
}) => {
  // Load preferences from local storage so chosen media format & theme are remembered across sessions
  const [selectedStyle, setSelectedStyle] = useState<VisualStyleType>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    const validStyles: VisualStyleType[] = ['pixar', 'disney', 'storybook'];
    return saved?.selectedStyle && validStyles.includes(saved.selectedStyle)
      ? saved.selectedStyle
      : 'pixar';
  });

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.selectedClassFilter || 'all';
  });

  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    const validFormats: MediaTypeFilter[] = ['video', 'slide', 'notebook', 'flashcard', 'infografis', 'petakonsep', 'all'];
    return saved?.mediaTypeFilter && validFormats.includes(saved.mediaTypeFilter)
      ? saved.mediaTypeFilter
      : 'video';
  });

  // Tema Busana & Latar Tempat untuk Video 3D (misal: Ruang Kelas Merah-Putih, Pramuka, Olahraga, Penjelajah, Astronot, dll)
  const [themeSetting, setThemeSetting] = useState<MediaPromptThemeSetting>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.themeSetting || 'auto';
  });

  // Mode Kehadiran Tokoh (Dinamis bergantian 1-3 tokoh, Trio, Duo, Solo Pak Roni/Ghea/Jordy, atau Kustom)
  const [characterMode, setCharacterMode] = useState<MediaPromptCharacterMode>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.characterMode || 'dynamic';
  });

  // Pilihan Karakter Kustom bila characterMode === 'custom'
  const [customCharacters, setCustomCharacters] = useState<MediaPromptCharacterCustomSelection>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.customCharacters || {
      pakRoni: true,
      ghea: true,
      jordy: true,
    };
  });

  // Format Rasio Layar Video: Landscape (16:9 Widescreen / TV / Proyektor) atau Portrait (9:16 Vertikal / Shorts / HP)
  const [aspectRatio, setAspectRatio] = useState<MediaPromptAspectRatio>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.aspectRatio === 'portrait' ? 'portrait' : 'landscape';
  });

  // Jumlah Adegan Video Edukasi: 'auto' (Sesuai kerumitan materi TP) atau 6, 8, 10, 12, 14 Adegan Lengkap
  const [sceneCount, setSceneCount] = useState<MediaPromptSceneCount>(() => {
    const saved = loadFromStorage<MediaPromptPreferences>(
      STORAGE_KEYS.MEDIA_PROMPT_PREFS,
      DEFAULT_PROMPT_PREFS
    );
    return saved?.sceneCount !== undefined ? saved.sceneCount : 'auto';
  });

  // State for user feedback when preferences are saved
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [hasSavedPreferences, setHasSavedPreferences] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.MEDIA_PROMPT_PREFS));
    } catch {
      return false;
    }
  });

  // Modal konfirmasi Titimangsa & Tahun Pelajaran sebelum unduh dokumen prompt
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'WORD' | 'PDF'>('WORD');

  const handleOpenExport = (type: 'WORD' | 'PDF') => {
    setExportType(type);
    setExportModalOpen(true);
  };

  const handleConfirmExport = (
    tempat: string,
    tanggal: string,
    chosenClass?: string,
    layoutOptions?: PDFLayoutOptions,
    tahunPelajaran?: string
  ) => {
    const resolvedTP = tahunPelajaran || identitas.tahunPelajaran || '2026/2027';
    const updatedIdentitas: SchoolIdentity = {
      ...identitas,
      tempatPenetapan: tempat,
      tanggalPenetapan: tanggal,
      tahunPelajaran: resolvedTP,
    };
    if (onUpdateIdentitas) {
      onUpdateIdentitas(updatedIdentitas);
    }
    const updatedPromptDoc: MediaPromptDocument = {
      ...promptDocument,
      identitas: updatedIdentitas,
    };
    const finalClass = chosenClass || selectedClassFilter || 'all';
    if (exportType === 'WORD') {
      exportMediaPromptsToWord(updatedPromptDoc, {
        selectedKelas: finalClass,
        filterType: mediaTypeFilter,
      });
    } else {
      exportMediaPromptsToPDF(
        updatedPromptDoc,
        {
          selectedKelas: finalClass,
          filterType: mediaTypeFilter,
        },
        layoutOptions
      );
    }
    setExportModalOpen(false);
  };

  // Save prompt preferences to Local Storage
  const handleSavePreferences = () => {
    const prefs: MediaPromptPreferences = {
      mediaTypeFilter,
      selectedStyle,
      selectedClassFilter,
      themeSetting,
      characterMode,
      customCharacters,
      aspectRatio,
      sceneCount,
      savedAt: new Date().toISOString(),
    };
    const success = saveToStorage(STORAGE_KEYS.MEDIA_PROMPT_PREFS, prefs);
    if (success) {
      setHasSavedPreferences(true);
      const styleName = VISUAL_STYLES[selectedStyle]?.label?.replace('Gaya Animasi 3D ', '') || selectedStyle;
      const formatLabelMap: Record<MediaTypeFilter, string> = {
        video: 'Video Pembelajaran 3D',
        slide: 'Slide Presentasi',
        notebook: 'Notebook Digital',
        flashcard: 'Flashcard Pintar',
        infografis: 'Infografis Edukatif',
        petakonsep: 'Peta Konsep / Pikiran',
        all: 'Semua Format',
      };
      const formatName = formatLabelMap[mediaTypeFilter] || mediaTypeFilter;
      const ratioName = aspectRatio === 'portrait' ? '9:16 Portrait Vertikal' : '16:9 Landscape Widescreen';
      const sceneName = sceneCount === 'auto' ? 'Otomatis Sesuai TP' : `${sceneCount} Adegan`;
      setSavedSuccessMessage(`Preferensi tersimpan: Format "${formatName}", Rasio "${ratioName}", "${sceneName}", Tema "${styleName}"!`);
      setTimeout(() => {
        setSavedSuccessMessage(null);
      }, 3500);
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTpId, setExpandedTpId] = useState<string | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [activeItemForModal, setActiveItemForModal] = useState<TPMediaPromptItem | null>(null);
  const [customSetting, setCustomSetting] = useState<string>('sekolah_standar');
  const [customUniform, setCustomUniform] = useState<string>('merah_putih');

  // Dynamic Subject (Mata Pelajaran) Selection directly on prompt view
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState<string>(
    identitas.mataPelajaran || 'Matematika'
  );
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(
    Boolean(identitas.mataPelajaran && !SD_MAPEL_OPTIONS.includes(identitas.mataPelajaran))
  );
  const [customSubjectInput, setCustomSubjectInput] = useState<string>(
    identitas.mataPelajaran && !SD_MAPEL_OPTIONS.includes(identitas.mataPelajaran)
      ? identitas.mataPelajaran
      : ''
  );

  // Sync if prop changes externally
  React.useEffect(() => {
    if (identitas.mataPelajaran) {
      setSelectedMataPelajaran(identitas.mataPelajaran);
      if (!SD_MAPEL_OPTIONS.includes(identitas.mataPelajaran)) {
        setIsCustomSubject(true);
        setCustomSubjectInput(identitas.mataPelajaran);
      }
    }
  }, [identitas.mataPelajaran]);

  // Effective School Identity reflecting chosen Subject
  const effectiveIdentitas: SchoolIdentity = useMemo(() => {
    return {
      ...identitas,
      mataPelajaran: selectedMataPelajaran,
    };
  }, [identitas, selectedMataPelajaran]);

  const handleChangeMataPelajaran = (newMapel: string) => {
    const trimmed = newMapel.trim() || 'Matematika';
    setSelectedMataPelajaran(trimmed);

    // Immediately get or initialize official workspace for this subject
    const ws = getOrInitSubjectWorkspace(
      trimmed,
      effectiveIdentitas.fase || 'Fase C',
      effectiveIdentitas.kelas || '5',
      effectiveIdentitas
    );

    onUpdateIdentitas?.({ mataPelajaran: trimmed });
    onSwitchSubjectWorkspace?.(ws);
  };

  // Effective TP list strictly matching selectedMataPelajaran
  const effectiveTPList: TPItem[] = useMemo(() => {
    // Check if the current tpList belongs authentically to the selected subject
    if (tpList && tpList.length > 0 && isTPListValidForSubject(tpList, selectedMataPelajaran)) {
      return tpList;
    }

    // Always fetch or init authentic workspace for the selected subject
    const ws = getOrInitSubjectWorkspace(
      selectedMataPelajaran,
      effectiveIdentitas.fase || 'Fase C',
      effectiveIdentitas.kelas || '5',
      effectiveIdentitas
    );
    if (ws && ws.tpList && ws.tpList.length > 0 && isTPListValidForSubject(ws.tpList, selectedMataPelajaran)) {
      return ws.tpList;
    }

    return ws?.tpList || tpList;
  }, [tpList, selectedMataPelajaran, effectiveIdentitas]);

  // Interactive flipped cards state for Flashcards: { "tpId-cardIdx": boolean }
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleCardFlip = (key: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Available classes based on Fase
  const availableClasses = useMemo(() => {
    const fase = effectiveIdentitas.fase || 'Fase B';
    if (fase === 'Fase A') return ['1', '2'];
    if (fase === 'Fase C') return ['5', '6'];
    return ['3', '4'];
  }, [effectiveIdentitas.fase]);

  // Format output target for prompt generator
  const activeFormatForGenerator: MediaOutputFormat =
    mediaTypeFilter === 'all' ? 'slide' : (mediaTypeFilter as MediaOutputFormat);

  // Generate full prompt document based on effective TP list, effective subject, visual style, and active format rules
  const promptDocument: MediaPromptDocument = useMemo(() => {
    return generateMediaPromptsForTPList(
      effectiveTPList,
      effectiveIdentitas,
      selectedStyle,
      activeFormatForGenerator,
      themeSetting,
      characterMode,
      customCharacters,
      aspectRatio,
      sceneCount
    );
  }, [
    effectiveTPList,
    effectiveIdentitas,
    selectedStyle,
    activeFormatForGenerator,
    themeSetting,
    characterMode,
    customCharacters,
    aspectRatio,
    sceneCount,
  ]);

  // Filter items based on class filter and search query
  const filteredItems = useMemo(() => {
    return promptDocument.items.filter((item) => {
      // Class filter
      if (selectedClassFilter !== 'all' && String(item.kelas) !== String(selectedClassFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesKode = (item.kodeTP || '').toLowerCase().includes(query);
        const matchesMateri = (item.lingkupMateri || '').toLowerCase().includes(query);
        const matchesRumusan = (item.rumusanTP || '').toLowerCase().includes(query);
        const matchesVideo = (item.video?.title || '').toLowerCase().includes(query);
        const matchesSlide = (item.slide?.title || '').toLowerCase().includes(query);
        const matchesNotebook = (item.notebook?.title || '').toLowerCase().includes(query);
        const matchesFlashcard = (item.flashcard?.title || '').toLowerCase().includes(query);
        const matchesInfografis = (item.infografis?.title || '').toLowerCase().includes(query);
        const matchesPetaKonsep = (item.petakonsep?.title || '').toLowerCase().includes(query) ||
          (item.petakonsep?.centralTheme || '').toLowerCase().includes(query);
        return (
          matchesKode ||
          matchesMateri ||
          matchesRumusan ||
          matchesVideo ||
          matchesSlide ||
          matchesNotebook ||
          matchesFlashcard ||
          matchesInfografis ||
          matchesPetaKonsep
        );
      }
      return true;
    });
  }, [promptDocument.items, selectedClassFilter, searchQuery]);

  // Copy handler with visual feedback
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Copy all prompts in English with strict Indonesian language mandate
  const handleCopyAllEnglish = () => {
    const strictHeader = `================================================================================
PENEGASAN MUTLAK BAHASA MEDIA AJAR:
SEKALIPUN PROMPT DISUSUN DALAM BAHASA INGGRIS UNTUK MODEL AI, SELURUH TEKS
PADA MEDIA YANG DIHASILKAN WAJIB MENGGUNAKAN BAHASA INDONESIA YANG RAMAH ANAK!
DILARANG KERAS MENGGUNAKAN BAHASA ASING PADA TEKS VIDEO, SLIDE, CATATAN SISWA, FLASHCARD, INFOGRAFIS, MAUPUN PETA KONSEP!
================================================================================\n\n`;

    const allPrompts = strictHeader + filteredItems
      .map((item, idx) => {
        let text = `=== [${idx + 1}] TP ${item.kodeTP}: ${item.lingkupMateri} (Kelas ${item.kelas}) ===\n\n`;
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'video') {
          if (item.video) {
            text += `--- 0. VIDEO PEMBELAJARAN 3D PIXAR (ASET KARAKTER + GAMBAR ADEGAN + VIDEO DIALOG) ---\n${item.video.fullPromptVideoAI}\n\n`;
          }
        }
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'slide') {
          if (item.slide) {
            text += `--- 1. SLIDE PRESENTASI INTERAKTIF (5-10 SLIDE) PROMPT ---\n${item.slide.fullPromptPresentationAI}\n\n`;
          }
        }
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'notebook') {
          if (item.notebook) {
            text += `--- 2. NOTEBOOK DIGITAL & JURNAL BELAJAR PROMPT ---\n${item.notebook.fullPromptNotebookAI}\n\n`;
          }
        }
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'flashcard') {
          if (item.flashcard) {
            text += `--- 3. SMART FLASHCARD SET PROMPT ---\n${item.flashcard.fullPromptFlashcardAI}\n\n`;
          }
        }
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'infografis') {
          text += `--- 4. 1-PAGE EDUCATIONAL INFOGRAPHIC POSTER PROMPT ---\n${item.infografis.fullEnglishPrompt}\n\n`;
        }
        if (mediaTypeFilter === 'all' || mediaTypeFilter === 'petakonsep') {
          if (item.petakonsep) {
            text += `--- 5. PETA KONSEP & PETA PIKIRAN (MIND MAP) PROMPT ---\n${item.petakonsep.fullPromptMindMapAI}\n\n`;
          }
        }
        return text;
      })
      .join('\n========================================\n\n');

    handleCopy(allPrompts, 'copy-all-english');
  };

  // Open Gemini Notebook handler: copies prompt and opens Google Gemini Notebook (https://notebook.google/?hl=id)
  const handleOpenGeminiNotebook = async (promptText: string, feedbackId: string) => {
    try {
      await handleCopy(promptText, feedbackId);
    } catch (e) {
      console.warn('Clipboard copy warning:', e);
    }
    window.open('https://notebook.google/?hl=id', '_blank', 'noopener,noreferrer');
  };

  // Open Gemini Notebook for all filtered items
  const handleOpenGeminiAll = () => {
    handleCopyAllEnglish();
    window.open('https://notebook.google/?hl=id', '_blank', 'noopener,noreferrer');
  };

  // Open custom modal
  const handleOpenCustomize = (item: TPMediaPromptItem) => {
    setActiveItemForModal(item);
    setIsCustomizeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-linear-to-r from-[#0B1528] via-[#102042] to-[#1E3A8A] rounded-2xl p-6 md:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        {/* Decorative ambient elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Format Media Prompt Generator (Kurikulum Merdeka)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Bank Prompt Media Ajar Interaktif &amp; Ramah Anak
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Didesain khusus untuk 5 format media utama: <strong>Slide Presentasi</strong> (5–10 slide),{' '}
              <strong>Notebook Digital</strong> (NotebookLM &amp; catatan siswa),{' '}
              <strong>Flashcard Pintar</strong> (kartu bolak-balik tantangan-jawaban),{' '}
              <strong>Infografis Edukatif</strong> (poster 1 halaman), dan{' '}
              <strong>Peta Konsep / Pikiran</strong> (mind map 5 cabang radial). Prompt siap pakai di AI seperti Gamma App, Canva, NotebookLM, GitMind, PowerPoint AI, DALL-E, dan Midjourney.
            </p>

            {/* Meta Tags info with Active Subject Indicator */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-amber-400/40">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mapel:</span>
                <strong className="text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded text-xs">
                  {selectedMataPelajaran}
                </strong>
                <span className="text-[10px] text-amber-200/70 italic">(Dapat diubah di bawah)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{effectiveIdentitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4 text-purple-400" />
                <span>Penyusun: <strong className="text-white">{effectiveIdentitas.namaGuru || 'Penyusun'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {/* Direct Gemini Notebook Action */}
            <button
              onClick={handleOpenGeminiAll}
              className="px-4 py-2.5 rounded-xl font-black text-xs bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 border border-purple-300/40 ring-2 ring-purple-400/30"
              title="Salin semua prompt & langsung buka Google Gemini Notebook (https://notebook.google/?hl=id)"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>
                {copiedId === 'copy-all-english'
                  ? 'Prompt Disalin! Membuka Gemini...'
                  : 'Hasilkan Konten (Gemini Notebook)'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
            </button>

            <button
              onClick={handleCopyAllEnglish}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
              title="Salin semua prompt dalam bahasa Inggris ke papan klip"
            >
              {copiedId === 'copy-all-english' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                  <span>Semua Prompt Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Semua Prompt ({mediaTypeFilter.toUpperCase()})</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOpenExport('WORD')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 border border-blue-400/40"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Unduh Word (.doc)</span>
            </button>

            <button
              onClick={() => handleOpenExport('PDF')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 border border-slate-700"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Penegasan Mutlak Bahasa Indonesia Banner */}
      <div className="bg-linear-to-r from-red-950 via-rose-950 to-amber-950 rounded-2xl p-5 md:p-6 text-white shadow-lg border-2 border-amber-400/80 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-400 text-slate-950 shrink-0 shadow-md">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                PENEGASAN MUTLAK BAHASA MEDIA AJAR
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-red-600 text-white border border-red-400">
                100% BAHASA INDONESIA RAMAH ANAK
              </span>
            </div>
            <p className="text-xs md:text-sm text-amber-100 font-semibold leading-relaxed">
              Sekalipun instruksi teknis prompt AI disusun dalam Bahasa Inggris agar model generator AI (Gamma, Canva AI, Midjourney, DALL-E, NotebookLM) memahami arahan tata letak, pencahayaan 3D, dan rasio:
            </p>
            <div className="p-3.5 rounded-xl bg-black/50 border border-amber-400/40 text-xs md:text-sm space-y-1.5 text-white">
              <p className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <span>★</span>
                <span>SELURUH TEKS, JUDUL, DAN DIALOG WAJIB 100% BAHASA INDONESIA YANG RAMAH ANAK!</span>
              </p>
              <p className="text-slate-200 text-xs leading-relaxed">
                Teks slide presentasi, kartu tanya-jawab flashcard, jurnal notebook, maupun label poster harus menggunakan kalimat sederhana, komunikatif, dan sesuai perkembangan kognitif anak usia SD. Sistem ini menyematkan perintah ketat agar AI tidak menghasilkan istilah asing yang membingungkan siswa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Format Selector Buttons (Notebook, Slide Presentasi, Flashcard, Infografis) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  Pilih Format Media Ajar:
                </label>
                {hasSavedPreferences && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                    Preferensi Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Pilih format media dan tema gaya visual, lalu simpan agar otomatis terpilih saat kembali
              </p>
            </div>

            {/* Tombol Simpan Preferensi Prompt */}
            <div className="flex items-center gap-2 flex-wrap">
              {savedSuccessMessage && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs animate-in fade-in duration-200">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                  <span>{savedSuccessMessage}</span>
                </span>
              )}

              <button
                id="btn-save-prompt-preferences"
                onClick={handleSavePreferences}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white transition-all flex items-center gap-2 shadow-xs hover:shadow cursor-pointer border border-indigo-500/80 ring-2 ring-indigo-500/20"
                title="Simpan pilihan format media dan tema saat ini ke penyimpanan lokal agar otomatis terpilih saat kembali"
              >
                <Save className="w-3.5 h-3.5 text-indigo-200" />
                <span>Simpan Preferensi Prompt</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* Video Pembelajaran 3D */}
            <button
              id="btn-filter-video"
              onClick={() => setMediaTypeFilter('video')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'video'
                  ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'video' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Film className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Video 3D Pixar</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Aset Karakter + Prompt Gambar + Video &amp; Dialog
              </span>
            </button>

            {/* Slide Presentasi */}
            <button
              onClick={() => setMediaTypeFilter('slide')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'slide'
                  ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'slide' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Presentation className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Slide Presentasi</span>
              </div>
              <span className="text-[10px] text-slate-500">
                5–10 slide (Standar 8 slide) interaktif &amp; ramah anak
              </span>
            </button>

            {/* Notebook Digital */}
            <button
              onClick={() => setMediaTypeFilter('notebook')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'notebook'
                  ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs ring-2 ring-purple-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'notebook' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <BookMarked className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Notebook Digital</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Format jurnal belajar untuk NotebookLM &amp; catatan siswa
              </span>
            </button>

            {/* Flashcard Pintar */}
            <button
              onClick={() => setMediaTypeFilter('flashcard')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'flashcard'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'flashcard' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                  <CreditCard className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Flashcard Pintar</span>
              </div>
              <span className="text-[10px] text-slate-500">
                6 kartu bolak-balik tantangan &amp; kunci jawaban
              </span>
            </button>

            {/* Infografis Edukatif */}
            <button
              onClick={() => setMediaTypeFilter('infografis')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'infografis'
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-950 shadow-xs ring-2 ring-cyan-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'infografis' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Layout className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Infografis Edukatif</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Poster 1 halaman 4 kuadran visual &amp; maskot siswa
              </span>
            </button>

            {/* Peta Konsep / Pikiran */}
            <button
              id="btn-filter-petakonsep"
              onClick={() => setMediaTypeFilter('petakonsep')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'petakonsep'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'petakonsep' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <Network className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Peta Konsep / Pikiran</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Mind map radial 5 cabang, kata hubung &amp; outline
              </span>
            </button>

            {/* Semua Format */}
            <button
              onClick={() => setMediaTypeFilter('all')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                mediaTypeFilter === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${mediaTypeFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-black">Semua Format</span>
              </div>
              <span className={`text-[10px] ${mediaTypeFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                Tampilkan seluruh media secara komprehensif
              </span>
            </button>
          </div>

          {/* Active Format Directive Control Panel */}
          {FORMAT_SPECIFIC_DIRECTIVES[activeFormatForGenerator] && (
            <div className="p-4 rounded-xl bg-linear-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1 rounded-md bg-indigo-600 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                    Instruksi Khusus Format Aktif:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {FORMAT_SPECIFIC_DIRECTIVES[activeFormatForGenerator].badge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Generator Otomatis Disesuaikan</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {FORMAT_SPECIFIC_DIRECTIVES[activeFormatForGenerator].description}
              </p>

              {/* Rules list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {FORMAT_SPECIFIC_DIRECTIVES[activeFormatForGenerator].rules.map((rule, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-1.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                    <span className="text-[11px] text-slate-700 leading-snug">{rule}</span>
                  </div>
                ))}
              </div>

              {/* Compatible AI Apps */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="font-bold text-slate-600">Aplikasi Rekomendasi:</span>
                {FORMAT_SPECIFIC_DIRECTIVES[activeFormatForGenerator].targetApps.map((app, aIdx) => (
                  <span
                    key={aIdx}
                    className="px-2 py-0.5 rounded-md bg-white text-indigo-900 border border-indigo-200/60 font-medium text-[10px]"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Secondary Controls: Mata Pelajaran, Visual Style, Class Filter */}
        <div className="pt-4 border-t border-slate-100 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          {/* Mata Pelajaran Selector */}
          <div className="space-y-1.5 w-full xl:w-80 shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Mata Pelajaran Media:
              </label>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                ✓ Ubah Mapel Bebas
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <select
                value={isCustomSubject ? '__custom__' : selectedMataPelajaran}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomSubject(true);
                  } else {
                    setIsCustomSubject(false);
                    handleChangeMataPelajaran(val);
                  }
                }}
                className="w-full text-xs font-bold bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition-colors"
              >
                {SD_MAPEL_OPTIONS.map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
                <option value="__custom__">✏️ Ketik Mata Pelajaran Lain...</option>
              </select>

              {isCustomSubject && (
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="Ketik nama mapel kustom..."
                    className="text-xs px-3 py-1.5 bg-white border-2 border-indigo-300 rounded-xl grow text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <button
                    onClick={() => {
                      if (customSubjectInput.trim()) {
                        handleChangeMataPelajaran(customSubjectInput.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    Terapkan
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                <span className="text-sm">{getSubjectEmoticon(selectedMataPelajaran)}</span>
                <span className="font-bold">
                  {effectiveTPList.length} TP Aktif: {selectedMataPelajaran} ({effectiveIdentitas.fase || 'Fase C'})
                </span>
              </div>
            </div>
          </div>

          {/* Visual Style Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600" />
                Gaya Visual Ilustrasi AI (Tema):
              </label>
              <button
                onClick={handleSavePreferences}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200"
                title="Simpan pilihan format media dan tema saat ini ke Local Storage"
              >
                <Save className="w-3 h-3 text-indigo-600" />
                <span>Simpan Preferensi</span>
              </button>
            </div>
            <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
              {(Object.keys(VISUAL_STYLES) as VisualStyleType[]).map((styleKey) => {
                const cfg = VISUAL_STYLES[styleKey];
                const isActive = selectedStyle === styleKey;
                return (
                  <button
                    key={styleKey}
                    onClick={() => setSelectedStyle(styleKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <span>{cfg.label.replace('Gaya Animasi 3D ', '')}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              {VISUAL_STYLES[selectedStyle].tagline}
            </p>
          </div>

          {/* Class Filter */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-600 block">Filter Kelas:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
              <button
                onClick={() => setSelectedClassFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  selectedClassFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    selectedClassFilter === cls
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kelas {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pengaturan Sutradara Video 3D (Rasio Layar, Jumlah Adegan, Karakter & Busana) */}
        <div className="p-4 rounded-xl bg-linear-to-r from-rose-50/60 via-amber-50/50 to-slate-50 border-2 border-rose-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                <Clapperboard className="w-5 h-5" />
              </span>
              <div>
                <h5 className="text-xs md:text-sm font-black text-rose-950 uppercase tracking-wide flex items-center gap-2">
                  <span>Studio Sutradara Video Pembelajaran 3D</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900 border border-rose-300">
                    Standar Generator AI
                  </span>
                </h5>
                <p className="text-[11.5px] text-rose-800 leading-snug">
                  Atur rasio orientasi layar (Landscape/Portrait), jumlah adegan adaptif materi, pakaian &amp; latar tokoh untuk hasil video AI yang maksimal dan konsisten.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5 shadow-2xs">
                <Timer className="w-3.5 h-3.5 text-rose-700" />
                <span>@8 Detik / Adegan</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Format Rasio Layar (Landscape vs Portrait) */}
            <div className="space-y-1.5 bg-white/90 rounded-xl p-3 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    {aspectRatio === 'landscape' ? (
                      <Monitor className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    Rasio Layar:
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    {aspectRatio === 'landscape' ? '16:9' : '9:16'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('landscape')}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      aspectRatio === 'landscape'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-rose-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Landscape</span>
                    </div>
                    <span className={`text-[9.5px] font-normal ${aspectRatio === 'landscape' ? 'text-rose-100' : 'text-slate-500'}`}>
                      16:9 Widescreen
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('portrait')}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                      aspectRatio === 'portrait'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-rose-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Portrait</span>
                    </div>
                    <span className={`text-[9.5px] font-normal ${aspectRatio === 'portrait' ? 'text-rose-100' : 'text-slate-500'}`}>
                      9:16 Vertikal
                    </span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug pt-1">
                {aspectRatio === 'landscape'
                  ? '📺 Cocok untuk TV Sekolah, Layar Proyektor LCD, YouTube, Laptop.'
                  : '📱 Cocok untuk Shorts, Instagram Reels, TikTok, Layar Smartphone Siswa.'}
              </p>
            </div>

            {/* 2. Jumlah Adegan & Durasi Total */}
            <div className="space-y-1.5 bg-white/90 rounded-xl p-3 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-rose-600" />
                    Jumlah Adegan:
                  </span>
                  {sceneCount === 'auto' ? (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ⚡ Otomatis
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      {sceneCount} Adegan
                    </span>
                  )}
                </label>
                <select
                  value={String(sceneCount)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSceneCount(val === 'auto' ? 'auto' : (Number(val) as MediaPromptSceneCount));
                  }}
                  className="w-full text-xs font-bold bg-white border-2 border-rose-200 hover:border-rose-400 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="auto">⚡ Otomatis Sesuai TP (Default 4 Adegan Hemat &amp; Utuh)</option>
                  <option value="4">🌟 4 Adegan (~32 detik — Format Hemat &amp; Utuh Bersambung)</option>
                  <option value="6">🎬 6 Adegan (~48 detik — Cepat &amp; Padat)</option>
                  <option value="8">🎬 8 Adegan (~64 detik — Standar Kurikulum)</option>
                  <option value="10">🎬 10 Adegan (~80 detik — Tuntas &amp; Kuis)</option>
                  <option value="12">🎬 12 Adegan (~96 detik — Eksplorasi Mendalam)</option>
                  <option value="14">🎬 14 Adegan (~112 detik — Cerita Komprehensif)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug pt-1">
                {sceneCount === 'auto'
                  ? '🎯 Otomatis menyajikan 4 adegan terpadu bersambung utuh (apersepsi hook, animasi 3D, fenomena mendalam, dan rangkuman penutup).'
                  : `⏱️ Setiap adegan tepat 8 detik (bicara detik 0.5–7.5, transisi 0.5s). Total durasi ~${Number(sceneCount) * 8} detik.`}
              </p>
            </div>

            {/* 3. Pilihan Busana & Latar */}
            <div className="space-y-1.5 bg-white/90 rounded-xl p-3 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-rose-600" />
                    Tema Busana &amp; Latar:
                  </span>
                  {themeSetting === 'auto' && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ⚡ Otomatis
                    </span>
                  )}
                </label>
                <select
                  value={themeSetting}
                  onChange={(e) => setThemeSetting(e.target.value as MediaPromptThemeSetting)}
                  className="w-full text-xs font-bold bg-white border-2 border-rose-200 hover:border-rose-400 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="auto">⚡ Otomatis Adaptif Topik (Rekomendasi)</option>
                  <option value="kelas_merah_putih">🏫 Ruang Kelas SD (Merah-Putih &amp; Batik)</option>
                  <option value="pramuka_lengkap">⛺ Perkemahan Pramuka (Siaga/Penggalang)</option>
                  <option value="olahraga_lapangan">⚽ Lapangan Olahraga (Jersey Sporty)</option>
                  <option value="penjelajah_safari">🧭 Petualangan Alam (Rompi Safari Khaki)</option>
                  <option value="astronot_antariksa">🚀 Antariksa (Baju Astronot Futuristik)</option>
                  <option value="laboratorium_sains">🧪 Laboratorium (Jas Lab &amp; Goggles)</option>
                  <option value="adat_nusantara">🏛️ Budaya Nusantara (Pakaian Adat Etnik)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug pt-1 truncate">
                {themeSetting === 'auto'
                  ? 'Menganalisis TP agar pakaian sesuai konteks materi.'
                  : THEME_SETTING_CONFIGS[themeSetting]?.shortDesc || ''}
              </p>
            </div>

            {/* 4. Mode Kehadiran Tokoh */}
            <div className="space-y-1.5 bg-white/90 rounded-xl p-3 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-600" />
                    Pemeran Karakter:
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Pak Roni, Ghea, Jordy
                  </span>
                </label>
                <select
                  value={characterMode}
                  onChange={(e) => setCharacterMode(e.target.value as MediaPromptCharacterMode)}
                  className="w-full text-xs font-bold bg-white border-2 border-rose-200 hover:border-rose-400 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="dynamic">🎬 Dinamis Bergantian (Sesuai Alur Pedagogi)</option>
                  <option value="trio">👥 Selalu Trio Bersama (Pak Roni, Jordy, Ghea)</option>
                  <option value="solo_pak_roni">👨‍🏫 Hanya Guru (Pak Roni Solo)</option>
                  <option value="duo_students">🎒 Hanya Murid (Jordy &amp; Ghea)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug pt-1">
                {characterMode === 'dynamic'
                  ? 'Karakter tampil bergantian (1-3 tokoh) sesuai fungsi adegan.'
                  : 'Fokus pada tokoh yang dipilih guru secara konsisten.'}
              </p>
            </div>
          </div>

          {/* Expert Director Pedagogical & Anti-Cutoff Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-amber-600 text-white shrink-0 mt-0.5 shadow-2xs">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <span>Pedoman Sutradara Video Edukatif: Menjelaskan Materi Nyata &amp; Dialog Anti-Terpotong</span>
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  • <strong>Diawali Pertanyaan Pemantik:</strong> Adegan 1 selalu memantik rasa ingin tahu dan penasaran siswa terkait fenomena nyata materi.<br />
                  • <strong>Bukan Sekadar Pajangan (Edukasi Mendalam):</strong> Menjelaskan secara tuntas apa itu materi (definisi), apa saja bagian/komponen dan fungsinya, bagaimana cara kerjanya, hingga cara merawat/menjaga atau menerapkannya dalam keseharian.<br />
                  • <strong>Dialog Bahasa Indonesia Ramah &amp; Anti-Terpotong (6–12 Kata):</strong> Percakapan natural santai, selesai diucapkan dalam 3–4 detik, menyisakan 4 detik jeda animasi visual di batas klip generator video 8 detik.<br />
                  • <strong>Kuis Kilat &amp; Pembuktian TP:</strong> Menantang penonton menebak kuis materi, memverifikasi jawaban, dan mengunci capaian Tujuan Pembelajaran secara tuntas.
                </p>
              </div>
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Preferensi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gemini Notebook Direct Integration Banner */}
        <div className="p-3.5 rounded-xl bg-linear-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-linear-to-br from-purple-600 to-indigo-700 text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="space-y-0.5">
              <p className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5">
                <span>Menu Pintar: Hasilkan Konten Pembelajaran di Gemini Notebook</span>
                <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.2 rounded-full font-bold">Baru</span>
              </p>
              <p className="text-[11px] text-purple-800 leading-snug">
                Klik tombol ungu <strong>"Hasilkan Konten"</strong> di samping prompt manapun untuk otomatis menyalin prompt &amp; langsung membuka <strong>notebook.google/?hl=id</strong> di tab baru. Tinggal tekan <strong>Ctrl+V (Tempel)</strong> untuk membuat modul, podcast, atau slide seketika!
              </p>
            </div>
          </div>
          <a
            href="https://notebook.google/?hl=id"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs self-start sm:self-auto shrink-0 transition-all active:scale-95"
          >
            <span>Buka Gemini Notebook</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan kode TP (misal 5.1), materi, judul slide, atau kata kunci..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Prompts Cards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Daftar Prompt Media Ajar ({filteredItems.length} Butir Tujuan Pembelajaran)
          </h2>
          <span className="text-xs text-slate-500">
            Pilih media di atas untuk memfokuskan tampilan prompt yang Anda butuhkan
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada butir TP yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Coba reset kata kunci pencarian atau ubah filter kelas di atas untuk melihat seluruh prompt media ajar.
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isExpanded = expandedTpId === item.id || expandedTpId === null;
            const showVideo = (mediaTypeFilter === 'all' || mediaTypeFilter === 'video') && Boolean(item.video);
            const showSlide = mediaTypeFilter === 'all' || mediaTypeFilter === 'slide';
            const showNotebook = mediaTypeFilter === 'all' || mediaTypeFilter === 'notebook';
            const showFlashcard = mediaTypeFilter === 'all' || mediaTypeFilter === 'flashcard';
            const showInfografis = mediaTypeFilter === 'all' || mediaTypeFilter === 'infografis';
            const showPetaKonsep = (mediaTypeFilter === 'all' || mediaTypeFilter === 'petakonsep') && Boolean(item.petakonsep);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Header Bar */}
                <div className="p-5 bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-400 text-slate-950 font-mono">
                        TP {item.kodeTP}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/10 text-cyan-300 border border-white/15">
                        Kelas {item.kelas} • {item.fase}
                      </span>
                      {item.elemen && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 text-slate-300">
                          Elemen: {item.elemen}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white truncate">
                      {idx + 1}. {item.lingkupMateri}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenCustomize(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/90 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
                      title="Kustomisasi latar sekolah atau seragam"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Kustomisasi AI</span>
                    </button>
                    <button
                      onClick={() => setExpandedTpId(isExpanded && expandedTpId !== null ? '' : item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
                    >
                      {isExpanded && expandedTpId !== null ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* TP Description Block */}
                <div className="px-5 py-3.5 bg-amber-50/60 border-b border-amber-200/60 text-xs text-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    TP
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 leading-relaxed">
                      {item.rumusanTP}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong>Kompetensi Kunci:</strong> {item.kompetensi} |{' '}
                      <strong>Lingkup Materi:</strong> {item.lingkupMateri}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                {isExpanded && (
                  <div className="p-5 md:p-6 space-y-8">
                    {/* FORMAT 0: VIDEO PEMBELAJARAN 3D (3 Karakter Konsisten & 5 Adegan Lengkap) */}
                    {showVideo && item.video && (
                      <div className="space-y-6 rounded-2xl border-2 border-rose-200 bg-rose-50/20 p-4 md:p-6 shadow-xs">
                        {/* Video Section Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-rose-200/80">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs">
                                <Film className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm md:text-base font-black text-rose-950 uppercase tracking-wider">
                                Video Pembelajaran 3D (Animasi Pixar-Inspired &amp; 3 Karakter Konsisten)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                3D Pixar Animation
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white flex items-center gap-1">
                                {item.video.aspectRatio === 'portrait' ? (
                                  <>
                                    <Smartphone className="w-3 h-3 text-rose-300" />
                                    <span>9:16 Portrait Vertikal</span>
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="w-3 h-3 text-sky-300" />
                                    <span>16:9 Landscape Widescreen</span>
                                  </>
                                )}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                <span>{item.video.totalScenes} Adegan Lengkap</span>
                                <span className="font-normal text-emerald-100">(~{item.video.totalScenes * 8}s)</span>
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <p className="text-xs text-rose-900 font-medium">
                                <strong>Judul Tayangan:</strong> {item.video.videoTitle}
                              </p>
                              {item.video.themeLabel && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                  <Shirt className="w-3 h-3 text-amber-700" />
                                  Busana &amp; Latar: {item.video.themeLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Gemini Notebook Action */}
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.video!.fullPromptVideoAI, `video-gemini-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-purple-400/40"
                              title="Salin prompt video lengkap & buka Google Gemini Notebook"
                            >
                              {copiedId === `video-gemini-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin! Membuka...</span>
                                </>
                              ) : (
                                <>
                                  <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Hasilkan Konten</span>
                                  <ExternalLink className="w-3 h-3 text-purple-200" />
                                </>
                              )}
                            </button>

                            {/* Copy Full Video Prompt */}
                            <button
                              onClick={() => handleCopy(item.video!.fullPromptVideoAI, `video-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Salin prompt lengkap (Karakter + Gambar Adegan + Video & Dialog)"
                            >
                              {copiedId === `video-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-200 stroke-[3]" />
                                  <span>Paket Video Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Paket Lengkap Video</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* BAGIAN 1: PROMPT ASET KARAKTER REFERENSI */}
                        <div className="space-y-3 bg-white rounded-xl p-4 border border-rose-200/90 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                                  Langkah 1
                                </span>
                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  Prompt Aset Karakter Referensi (Konsistensi Fisik Wajib)
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Generate gambar aset karakter ini terlebih dahulu. Gunakan sebagai <em>Image Reference</em> di setiap scene agar wajah, rambut, dan fisik tetap konsisten!
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopy(item.video!.fullPromptCharactersOnly, `video-chars-${item.id}`)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              {copiedId === `video-chars-${item.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Salin Semua Karakter</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                            {item.video.characterAssets.map((char) => (
                              <div
                                key={char.characterId}
                                className="bg-rose-50/30 rounded-xl p-3.5 border border-rose-200/70 flex flex-col justify-between space-y-3 hover:border-rose-300 transition-all"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                        {char.name[0]}
                                      </div>
                                      <div>
                                        <h6 className="text-xs font-black text-slate-900 leading-none">
                                          {char.name}
                                        </h6>
                                        <span className="text-[10px] font-semibold text-rose-700">
                                          {char.role}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-slate-600 border border-slate-200">
                                      Referensi
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 text-[11px] text-slate-700">
                                    <div>
                                      <strong className="text-slate-900 block text-[10px] uppercase font-bold text-rose-900">
                                        Ciri Fisik Konsisten:
                                      </strong>
                                      <span className="text-slate-600 leading-snug block">
                                        {char.physicalTraits}
                                      </span>
                                    </div>
                                    <div>
                                      <strong className="text-slate-900 block text-[10px] uppercase font-bold text-rose-900">
                                        Busana &amp; Ciri Khas:
                                      </strong>
                                      <span className="text-slate-600 leading-snug block">
                                        {char.attire}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 rounded bg-slate-900 text-slate-100 text-[10px] font-mono leading-relaxed line-clamp-3 overflow-hidden select-all">
                                    {char.promptCharacterAsset}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCopy(char.promptCharacterAsset, `char-${char.characterId}-${item.id}`)}
                                  className="w-full py-1 px-2.5 rounded-lg text-[11px] font-bold bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                                >
                                  {copiedId === `char-${char.characterId}-${item.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                      <span>Aset {char.name} Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin Prompt Aset {char.name}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* BAGIAN 2: PROMPT GAMBAR KEYFRAME SETIAP ADEGAN */}
                        <div className="space-y-3 bg-white rounded-xl p-4 border border-rose-200/90 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                                  Langkah 2
                                </span>
                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  Prompt Gambar Keyframe Setiap Adegan ({item.video.totalScenes} Scene Ilustrasi)
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Gunakan prompt gambar ini di Midjourney, DALL-E 3, atau Imagen 3 untuk menghasilkan visual diam (keyframe) dari setiap adegan.
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopy(item.video!.fullPromptSceneImagesOnly, `video-images-${item.id}`)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              {copiedId === `video-images-${item.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Salin {item.video.totalScenes} Prompt Gambar</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-3 pt-1">
                            {item.video.sceneImages.map((sceneImg) => (
                              <div
                                key={sceneImg.sceneNumber}
                                className="bg-indigo-50/20 rounded-xl p-3.5 border border-indigo-100 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-indigo-300 transition-all"
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white">
                                      Adegan {sceneImg.sceneNumber}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                      {sceneImg.sceneTitle}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      • Durasi: ~{sceneImg.durationEstimate}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-indigo-100/70 text-indigo-900">
                                      Suasana: {sceneImg.mood}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900">
                                      🚫 100% Bebas Teks di Gambar
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    <strong>Tokoh yang Tampil:</strong> {sceneImg.characters}
                                  </p>
                                  {sceneImg.relevantAnimation && (
                                    <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-[11px] flex items-start gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="text-indigo-950 font-bold block text-[10px] uppercase">
                                          ✨ Animasi 3D / Peraga Relevan:
                                        </strong>
                                        <span className="text-indigo-900">{sceneImg.relevantAnimation}</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[10.5px] font-mono leading-relaxed select-all">
                                    {sceneImg.promptGambarScene}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCopy(sceneImg.promptGambarScene, `scene-img-${sceneImg.sceneNumber}-${item.id}`)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-center cursor-pointer active:scale-95"
                                  title={`Salin prompt gambar untuk Adegan ${sceneImg.sceneNumber}`}
                                >
                                  {copiedId === `scene-img-${sceneImg.sceneNumber}-${item.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                      <span>Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin Prompt Gambar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* BAGIAN 3: PROMPT VIDEO MOTION & NASKAH DIALOG */}
                        <div className="space-y-3 bg-white rounded-xl p-4 border border-rose-200/90 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                                  Langkah 3
                                </span>
                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  Prompt Video Motion &amp; Naskah Dialog ({item.video.totalScenes} Adegan Lengkap)
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Dialog dimulai tepat di detik 00:00.5s dengan tempo normal dan artikulatif (10–15 kata). Waktu bicara efektif 7,0 detik dan jeda transisi akhir tepat 0,5 detik. Teks dialog murni suara (Voice-Over), tidak dirender sebagai teks pada video!
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopy(item.video!.fullPromptSceneVideosOnly, `video-videos-${item.id}`)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              {copiedId === `video-videos-${item.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Salin {item.video.totalScenes} Prompt Video &amp; Dialog</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-3.5 pt-1">
                            {item.video.sceneVideos.map((sceneVid) => (
                              <div
                                key={sceneVid.sceneNumber}
                                className="bg-rose-50/20 rounded-xl p-3.5 border border-rose-200/80 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-rose-300 transition-all"
                              >
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                                      Adegan {sceneVid.sceneNumber} Video
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                      {sceneVid.sceneTitle}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700">
                                      Tokoh: {sceneVid.characters}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                                      <Timer className="w-3 h-3" />
                                      <span>8 Detik Tepat</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-900">
                                      ✓ Dialog Jelas (10–15 Kata)
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900">
                                      🚫 100% Bebas Teks di Layar
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="p-2 rounded-lg bg-white border border-rose-100">
                                      <strong className="text-rose-900 block text-[10px] uppercase font-bold mb-0.5">
                                        🎬 Aksi Gerak Animasi:
                                      </strong>
                                      <span className="text-slate-700 leading-snug">
                                        {sceneVid.action}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white border border-rose-100">
                                      <strong className="text-rose-900 block text-[10px] uppercase font-bold mb-0.5">
                                        🎥 Pergerakan Kamera:
                                      </strong>
                                      <span className="text-slate-700 leading-snug">
                                        {sceneVid.camera}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Animasi Relevan Pendukung */}
                                  {sceneVid.relevantAnimation && (
                                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/80 text-[11px] flex items-start gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="text-purple-950 font-bold block text-[10px] uppercase tracking-wide">
                                          ✨ Animasi 3D / Hologram Pendukung Materi:
                                        </strong>
                                        <span className="text-purple-900 leading-relaxed">{sceneVid.relevantAnimation}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dialogue Bubble */}
                                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                        <span>💬 Naskah Dialog Bersambung (100% Bahasa Indonesia):</span>
                                      </span>
                                      <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                                        ⏱️ Mulai Detik 0.5 s/d 07.5 (7.0s Efektif) • Jeda Akhir Cukup 0.5s
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-900 italic font-semibold leading-relaxed">
                                      "{sceneVid.dialogue}"
                                    </p>
                                  </div>

                                  {/* Raw prompt snippet */}
                                  <div className="p-2 rounded bg-slate-900 text-slate-100 text-[10.5px] font-mono leading-relaxed select-all">
                                    {sceneVid.promptVideoScene}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCopy(sceneVid.promptVideoScene, `scene-vid-${sceneVid.sceneNumber}-${item.id}`)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-center cursor-pointer active:scale-95"
                                  title={`Salin prompt video motion untuk Adegan ${sceneVid.sceneNumber}`}
                                >
                                  {copiedId === `scene-vid-${sceneVid.sceneNumber}-${item.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                      <span>Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin Prompt Video</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pedoman Guru di Kelas */}
                        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                          <strong className="text-emerald-900 block font-bold text-xs uppercase tracking-wide">
                            💡 Pedoman Interaksi Guru di Kelas saat Memutar Video:
                          </strong>
                          <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                            {item.video.pedomanGuruIndo}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* FORMAT 1: SLIDE PRESENTASI (5-10 Slide, 8 Slide Terstruktur) */}
                    {showSlide && item.slide && (
                      <div className="space-y-4 rounded-xl border-2 border-blue-100 bg-blue-50/20 p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/70">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-blue-600 text-white">
                                <Presentation className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm font-black text-blue-950 uppercase tracking-wider">
                                1. Slide Presentasi Edukatif ({item.slide.totalSlides} Slide Lengkap)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                Format 16:9 Widescreen
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                                Bahasa Ramah Anak SD
                              </span>
                            </div>
                            <p className="text-xs text-blue-900 font-medium">
                              <strong>Judul Presentasi:</strong> {item.slide.title}
                            </p>
                          </div>

                          {/* Copy & AI Execution Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Gemini Notebook Action */}
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.slide!.fullPromptPresentationAI, `slide-gemini-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-purple-400/40"
                              title="Salin prompt slide ini & buka Google Gemini Notebook (https://notebook.google/?hl=id)"
                            >
                              {copiedId === `slide-gemini-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin! Membuka...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Hasilkan Konten</span>
                                  <ExternalLink className="w-3 h-3 text-purple-200" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopy(item.slide!.fullPromptPresentationAI, `slide-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Salin prompt lengkap untuk dimasukkan ke Gamma App, Canva, atau PowerPoint AI"
                            >
                              {copiedId === `slide-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-300 stroke-[3]" />
                                  <span>Prompt Slide Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt Slide</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Slide Deck Grid: Minimal 5, Maksimal 10 (Standar 8 Slide) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {item.slide.slides.map((s) => (
                            <div
                              key={s.slideNumber}
                              className="bg-white rounded-xl p-3.5 border border-blue-200/80 shadow-xs flex flex-col justify-between space-y-2 hover:border-blue-400 transition-colors"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-900">
                                    Slide {s.slideNumber}/{item.slide?.totalSlides}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(`Slide ${s.slideNumber}: ${s.slideTitle}\nHeadline: ${s.headline}\nPoin: ${s.bulletPoints.join(', ')}\nVisual: ${s.visualIllustrationPrompt}`, `slide-single-${item.id}-${s.slideNumber}`)}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Salin teks slide ini"
                                  >
                                    {copiedId === `slide-single-${item.id}-${s.slideNumber}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                  {s.slideTitle}
                                </h5>
                                <p className="text-[11px] font-semibold text-blue-700 leading-snug">
                                  "{s.headline}"
                                </p>
                                <ul className="text-[10.5px] text-slate-600 space-y-0.5 list-disc list-inside">
                                  {s.bulletPoints.map((bp, bIdx) => (
                                    <li key={bIdx} className="leading-relaxed">
                                      {bp}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <p className="text-[9.5px] text-slate-500 italic leading-snug">
                                  <strong>Visual 3D:</strong> {s.visualIllustrationPrompt}
                                </p>
                                <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200/60 text-[9.5px] text-amber-900 font-medium">
                                  💡 <strong>Guru:</strong> {s.teacherInteractionGuide}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Raw Prompt for AI Presentation Tools */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Full Prompt AI Presentation (Siap Pakai untuk Gamma / Canva / PPT AI):
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenGeminiNotebook(item.slide!.fullPromptPresentationAI, `slide-raw-gemini-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                                title="Salin teks & buka Google Gemini Notebook"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Hasilkan Konten</span>
                                <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleCopy(item.slide!.fullPromptPresentationAI, `slide-raw-${item.id}`)}
                                className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                Salin Prompt
                              </button>
                            </div>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-48 border border-slate-800 select-all">
                            {item.slide.fullPromptPresentationAI}
                          </pre>
                        </div>

                        {/* Pedoman Guru */}
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
                          <p className="font-bold flex items-center gap-1.5 mb-1 text-blue-950">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            Tips Pemanfaatan Slide di Kelas:
                          </p>
                          <p className="text-[11px] leading-relaxed whitespace-pre-line">
                            {item.slide.pedomanGuruIndo}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* FORMAT 2: NOTEBOOK DIGITAL (NotebookLM & Jurnal Belajar Siswa) */}
                    {showNotebook && item.notebook && (
                      <div className="space-y-4 rounded-xl border-2 border-purple-100 bg-purple-50/20 p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200/70">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-purple-600 text-white">
                                <BookMarked className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm font-black text-purple-950 uppercase tracking-wider">
                                2. Notebook Digital &amp; Jurnal Belajar Siswa ({item.notebook.notebookSections.length} Seksi Interaktif)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Format NotebookLM / Jurnal Belajar
                              </span>
                            </div>
                            <p className="text-xs text-purple-900 font-medium">
                              <strong>Judul Jurnal:</strong> {item.notebook.title}
                            </p>
                          </div>

                          {/* Copy & AI Execution Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Gemini Notebook Action */}
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.notebook!.fullPromptNotebookAI, `notebook-gemini-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-purple-400/40"
                              title="Salin prompt notebook ini & buka Google Gemini Notebook (https://notebook.google/?hl=id)"
                            >
                              {copiedId === `notebook-gemini-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin! Membuka...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Hasilkan Konten</span>
                                  <ExternalLink className="w-3 h-3 text-purple-200" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopy(item.notebook!.fullPromptNotebookAI, `notebook-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Salin format jurnal belajar untuk NotebookLM atau Google Docs"
                            >
                              {copiedId === `notebook-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-300 stroke-[3]" />
                                  <span>Format Notebook Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt NotebookLM / Docs</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 5 Seksi Jurnal Siswa */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.notebook.notebookSections.map((sec, sIdx) => (
                            <div
                              key={sIdx}
                              className="bg-white rounded-xl p-3.5 border border-purple-200/80 shadow-xs space-y-2 hover:border-purple-400 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900">
                                  Seksi {sIdx + 1}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900">
                                {sec.sectionTitle}
                              </h5>
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-purple-800">
                                  Pertanyaan Pemandu:
                                </p>
                                <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-0.5">
                                  {sec.guidedQuestionsOrPrompts.map((q, qIdx) => (
                                    <li key={qIdx}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 italic">
                                ✏️ <strong>Catatan Doodle:</strong> {sec.summaryDoodleNote}
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 font-medium">
                                🎯 <strong>Aktivitas Siswa:</strong> {sec.interactiveActivity}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Raw Prompt for NotebookLM */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Format Teks Sumber untuk NotebookLM / Google Docs:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenGeminiNotebook(item.notebook!.fullPromptNotebookAI, `notebook-raw-gemini-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                                title="Salin format teks & buka Google Gemini Notebook"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Hasilkan Konten</span>
                                <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleCopy(item.notebook!.fullPromptNotebookAI, `notebook-raw-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                Salin Teks
                              </button>
                            </div>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-48 border border-slate-800 select-all">
                            {item.notebook.fullPromptNotebookAI}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* FORMAT 3: FLASHCARD PINTAR (Kartu Bolak-Balik Tantangan & Kunci) */}
                    {showFlashcard && item.flashcard && (
                      <div className="space-y-4 rounded-xl border-2 border-amber-200 bg-amber-50/20 p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-amber-500 text-slate-950">
                                <CreditCard className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                                3. Flashcard Pintar Edukatif ({item.flashcard.totalCards} Kartu Bolak-Balik)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                                Interaktif (Klik Kartu untuk Membalik)
                              </span>
                            </div>
                            <p className="text-xs text-amber-900 font-medium">
                              <strong>Set Kartu:</strong> {item.flashcard.title}
                            </p>
                          </div>

                          {/* Copy & AI Execution Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Gemini Notebook Action */}
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.flashcard!.fullPromptFlashcardAI, `flashcard-gemini-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-purple-400/40"
                              title="Salin prompt flashcard ini & buka Google Gemini Notebook (https://notebook.google/?hl=id)"
                            >
                              {copiedId === `flashcard-gemini-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin! Membuka...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Hasilkan Konten</span>
                                  <ExternalLink className="w-3 h-3 text-purple-200" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopy(item.flashcard!.fullPromptFlashcardAI, `flashcard-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title="Salin prompt untuk Canva Flashcard Maker, Quizlet, atau cetak peraga"
                            >
                              {copiedId === `flashcard-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-200 stroke-[3]" />
                                  <span>Prompt Flashcard Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt Flashcard (Canva / Quizlet)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Flip Flashcards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {item.flashcard.cards.map((card) => {
                            const cardKey = `${item.id}-${card.cardNumber}`;
                            const isFlipped = Boolean(flippedCards[cardKey]);

                            return (
                              <div
                                key={card.cardNumber}
                                onClick={() => toggleCardFlip(cardKey)}
                                className="group relative bg-white rounded-xl p-4 border-2 border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer select-none min-h-56 flex flex-col justify-between"
                                title="Klik kartu untuk membalik antara Sisi Depan dan Sisi Belakang"
                              >
                                {/* Top status indicator */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900">
                                    Kartu {card.cardNumber} • {card.category}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 group-hover:text-amber-600">
                                    <RotateCw className="w-3 h-3" />
                                    {isFlipped ? 'Sisi Belakang (Jawaban)' : 'Sisi Depan (Tantangan)'}
                                  </span>
                                </div>

                                {/* Dynamic Card Face: Front or Back */}
                                {!isFlipped ? (
                                  <div className="py-2 space-y-2">
                                    <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider">
                                      [SISI DEPAN / PERTANYAAN]
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                                      {card.frontSide.title}
                                    </h5>
                                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                                      {card.frontSide.questionOrChallenge}
                                    </p>
                                    <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900">
                                      💡 <strong>Petunjuk Cilik:</strong> {card.frontSide.hint}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-2 space-y-2 bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-200">
                                    <span className="text-[10px] font-black text-emerald-700 block uppercase tracking-wider">
                                      [SISI BELAKANG / KUNCI JAWABAN]
                                    </span>
                                    <p className="text-xs font-black text-emerald-950 leading-snug">
                                      Jawaban: {card.backSide.answer}
                                    </p>
                                    <p className="text-[10.5px] text-slate-700 leading-relaxed">
                                      {card.backSide.simpleExplanation}
                                    </p>
                                    <div className="p-1.5 rounded-md bg-white border border-emerald-300 text-[10px] text-emerald-800 font-bold">
                                      ⭐ <strong>Slogan Emas:</strong> "{card.backSide.funFactOrMotto}"
                                    </div>
                                  </div>
                                )}

                                {/* Bottom flip hint */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Sentuh/klik untuk membalik</span>
                                  <span className="text-amber-600 font-bold">Balik ⟳</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Raw Prompt for Flashcard AI Maker */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Prompt Lengkap Generator Flashcard (Canva / Quizlet):
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenGeminiNotebook(item.flashcard!.fullPromptFlashcardAI, `flashcard-raw-gemini-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                                title="Salin prompt & buka Google Gemini Notebook"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Hasilkan Konten</span>
                                <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleCopy(item.flashcard!.fullPromptFlashcardAI, `flashcard-raw-${item.id}`)}
                                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                Salin Teks
                              </button>
                            </div>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-48 border border-slate-800 select-all">
                            {item.flashcard.fullPromptFlashcardAI}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* FORMAT 4: INFOGRAFIS EDUKATIF (Poster 1 Halaman 4 Kuadran) */}
                    {showInfografis && (
                      <div className="space-y-4 rounded-xl border-2 border-cyan-100 bg-cyan-50/20 p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-200/70">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-cyan-600 text-white">
                                <Layout className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm font-black text-cyan-950 uppercase tracking-wider">
                                4. Infografis Edukatif (Poster 1 Halaman)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-200 text-cyan-800">
                                Format 3:4 Portrait Poster
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white border border-red-300">
                                100% Teks Bahasa Indonesia
                              </span>
                            </div>
                            <p className="text-xs text-cyan-900 font-medium">
                              {item.infografis.title} — {item.infografis.subtitle}
                            </p>
                          </div>

                          {/* Copy & AI Execution Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Gemini Notebook Action */}
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.infografis.fullEnglishPrompt, `info-gemini-${item.id}`)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-purple-400/40"
                              title="Salin prompt infografis ini & buka Google Gemini Notebook (https://notebook.google/?hl=id)"
                            >
                              {copiedId === `info-gemini-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin! Membuka...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Hasilkan Konten</span>
                                  <ExternalLink className="w-3 h-3 text-purple-200" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopy(item.infografis.fullEnglishPrompt, `info-${item.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                            >
                              {copiedId === `info-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-300 stroke-[3]" />
                                  <span>Prompt Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt Infografis (EN)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Central Hero Concept */}
                        <div className="p-3 bg-white rounded-xl border border-cyan-200/80 text-xs text-slate-700 space-y-1">
                          <p className="font-bold text-cyan-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                            Fokus Maskot &amp; Ilustrasi Sentral:
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {item.infografis.centralIllustrationPrompt}
                          </p>
                        </div>

                        {/* 4 Infographic Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {item.infografis.sections.map((section) => (
                            <div
                              key={section.sectionNumber}
                              className="bg-white rounded-xl p-3.5 border border-cyan-200/80 shadow-xs space-y-2 hover:border-cyan-400 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black flex items-center justify-center shrink-0">
                                  {section.sectionNumber}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">
                                  {section.heading}
                                </h5>
                              </div>
                              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 pl-1">
                                {section.keyPoints.map((pt, pIdx) => (
                                  <li key={pIdx} className="leading-relaxed">
                                    {pt}
                                  </li>
                                ))}
                              </ul>
                              {section.didYouKnowOrCallout && (
                                <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[10px] text-amber-900 font-semibold italic">
                                  ★ {section.didYouKnowOrCallout}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Raw English Prompt Preview */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Full English Prompt (Siap Pakai untuk Generator AI):
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenGeminiNotebook(item.infografis.fullEnglishPrompt, `info-raw-gemini-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                                title="Salin prompt & buka Google Gemini Notebook"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Hasilkan Konten</span>
                                <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleCopy(item.infografis.fullEnglishPrompt, `info-raw-${item.id}`)}
                                className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                Salin Teks
                              </button>
                            </div>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-48 border border-slate-800 select-all">
                            {item.infografis.fullEnglishPrompt}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* 5. PETA KONSEP & PETA PIKIRAN (MIND MAP RADIAL) */}
                    {showPetaKonsep && item.petakonsep && (
                      <div className="bg-emerald-50/40 border border-emerald-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                              <Network className="w-5 h-5" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-extrabold text-emerald-950">
                                  5. PETA KONSEP &amp; PETA PIKIRAN (MIND MAP RADIAL EDUKATIF)
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Radial 5 Cabang
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  100% Bahasa Indonesia Ramah Anak
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Visualisasi memusat berstruktur hierarkis dengan kata hubung bermakna untuk menguatkan pemahaman konseptual siswa.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenGeminiNotebook(item.petakonsep!.fullPromptMindMapAI, `mindmap-gemini-${item.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border border-purple-400/40"
                              title="Salin prompt & buka Google Gemini Notebook"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Hasilkan Konten</span>
                              <ExternalLink className="w-3 h-3 text-purple-200" />
                            </button>

                            <button
                              onClick={() => handleCopy(item.petakonsep!.fullPromptMindMapAI, `mindmap-prompt-${item.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              {copiedId === `mindmap-prompt-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Prompt Mind Map</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Central Node Card */}
                        <div className="p-4 rounded-xl bg-linear-to-r from-emerald-100/90 via-teal-50 to-emerald-100/70 border border-emerald-300/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                                Titik Pusat Peta Pikiran (Central Theme):
                              </span>
                            </div>
                            <h5 className="text-base font-black text-slate-900">
                              {item.petakonsep.centralTheme}
                            </h5>
                            <p className="text-xs text-slate-700">
                              <strong>Metafora Visual 3D:</strong> {item.petakonsep.centralVisualMetaphor}
                            </p>
                          </div>
                          <div className="shrink-0 bg-white/90 px-3 py-2 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                            <span>Format: <strong>Radial 5 Cabang</strong></span> • <span>Level: <strong>Kelas {item.kelas} SD</strong></span>
                          </div>
                        </div>

                        {/* 5 Cabang Utama Interaktif */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                              <GitBranch className="w-4 h-4 text-emerald-600" />
                              5 Cabang Utama &amp; Kata Penghubung:
                            </h5>
                            <span className="text-[11px] text-slate-500">
                              Setiap cabang dilengkapi ikon visual &amp; tantangan interaktif siswa
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            {item.petakonsep.branches.map((b) => (
                              <div
                                key={b.branchNumber}
                                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-2.5"
                                style={{ borderTopWidth: '4px', borderTopColor: b.branchColor }}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      Cabang {b.branchNumber}
                                    </span>
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: b.branchColor }}
                                      title={`Warna: ${b.branchColor}`}
                                    />
                                  </div>
                                  <h6 className="text-xs font-bold text-slate-900 leading-snug">
                                    {b.branchName}
                                  </h6>
                                  <div className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-[10px] text-emerald-800 font-semibold border border-emerald-200/60">
                                    Kata hubung: &ldquo;{b.connectingPhrase}&rdquo;
                                  </div>
                                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 pt-1">
                                    {b.subBranches.map((sub, sIdx) => (
                                      <li key={sIdx} className="leading-snug">
                                        {sub}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px]">
                                  <div className="text-slate-600 flex items-start gap-1">
                                    <span className="font-bold text-slate-700">Ikon:</span>
                                    <span>{b.visualDoodle}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 font-medium leading-relaxed">
                                    <strong className="text-amber-800">💡 Misi Murid:</strong> {b.miniChallenge}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Markdown Outline Box (Siap Impor ke GitMind, Markmap, XMind) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              Outline Markdown Hierarkis (Bisa Diimpor Langsung ke GitMind / Markmap / XMind):
                            </span>
                            <button
                              onClick={() => handleCopy(item.petakonsep!.markdownOutline, `mindmap-md-${item.id}`)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              Salin Outline
                            </button>
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-40 border border-slate-800 select-all">
                            {item.petakonsep.markdownOutline}
                          </pre>
                        </div>

                        {/* Full AI Prompt Box */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Prompt Lengkap Generator AI (Siap Pakai untuk Gemini / ChatGPT / Canva):
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenGeminiNotebook(item.petakonsep!.fullPromptMindMapAI, `mindmap-raw-gemini-${item.id}`)}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                                title="Salin prompt & buka Google Gemini Notebook"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>Hasilkan Konten</span>
                                <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                              </button>
                              <button
                                onClick={() => handleCopy(item.petakonsep!.fullPromptMindMapAI, `mindmap-raw-${item.id}`)}
                                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                Salin Teks
                              </button>
                            </div>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-48 border border-slate-800 select-all">
                            {item.petakonsep.fullPromptMindMapAI}
                          </pre>
                        </div>

                        {/* Pedoman Guru */}
                        <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300/80 text-xs text-emerald-950 space-y-1">
                          <strong className="block font-black text-emerald-900 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-emerald-700" />
                            Panduan Praktis Guru di Kelas (Apersepsi &amp; Rangkuman):
                          </strong>
                          <p className="leading-relaxed whitespace-pre-line text-emerald-900/90 text-[11px]">
                            {item.petakonsep.pedomanGuruIndo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Guide Box & Recommendations */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Panduan Pemanfaatan Media Ajar Digital di Kelas:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
            <span className="font-bold text-blue-900 flex items-center gap-1">
              🖥️ 1. Slide Presentasi
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Gunakan prompt slide pada <strong>Gamma App (gamma.app)</strong>, Canva Magic Presentation, atau Microsoft Copilot. Tampilkan sebagai panduan visual ceria saat mengajarkan konsep di depan kelas.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-1.5">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              📓 2. Notebook Digital
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Masukkan teks prompt ke dalam <strong>NotebookLM (notebooklm.google.com)</strong> untuk membuat podcast audio otomatis, ringkasan belajar interaktif, atau bahan jurnal cetak siswa.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              🃏 3. Flashcard Pintar
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Gunakan prompt pada <strong>Canva Flashcard Maker</strong> atau Quizlet. Cetak bolak-balik untuk kegiatan kuis kelompok atau ice-breaking berhadiah bintang apresiasi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200/80 space-y-1.5">
            <span className="font-bold text-cyan-900 flex items-center gap-1">
              📊 4. Infografis Edukatif
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Tempel prompt ke generator gambar AI (Midjourney / Bing Image Creator) untuk menghasilkan poster 1 halaman berwarna yang dapat dipajang di mading kelas atau modul ajar.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
            <span className="font-bold text-emerald-900 flex items-center gap-1">
              🧠 5. Peta Konsep / Pikiran
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Gunakan prompt pada <strong>GitMind AI (gitmind.com)</strong>, Canva Mind Map, atau XMind. Impor outline Markdown untuk membentuk pohon konsep radial dengan asosiasi warna ramah anak.
            </p>
          </div>
        </div>
      </div>

      {/* Customize AI Modal */}
      {isCustomizeModalOpen && activeItemForModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Kustomisasi Prompt dengan Konteks Khusus
                </h3>
              </div>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuaikan latar lingkungan dan seragam untuk butir TP <strong>{activeItemForModal.kodeTP}: {activeItemForModal.lingkupMateri}</strong>:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Latar Lingkungan (Setting):
                </label>
                <select
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="sekolah_standar">Ruang Kelas SD Indonesia Bersih &amp; Terang</option>
                  <option value="ttu_ntt">Sekolah Asri Pedesaan Timor Tengah Utara (NTT) dengan Nuansa Alam Tropis</option>
                  <option value="kebun_sekolah">Kebun Sekolah &amp; Taman Literasi Terbuka</option>
                  <option value="laboratorium">Sudut Sains &amp; Pojok Baca Edukatif</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Pilihan Seragam Peserta Didik:
                </label>
                <select
                  value={customUniform}
                  onChange={(e) => setCustomUniform(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="merah_putih">Seragam Nasional SD (Kemeja Putih &amp; Celana/Rok Merah + Dasi)</option>
                  <option value="pramuka">Seragam Pramuka Siaga SD (Coklat Muda &amp; Coklat Tua + Hasduk)</option>
                  <option value="batik">Seragam Batik Sekolah Indonesia Ceria</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const basePrompt = activeItemForModal.slide
                    ? activeItemForModal.slide.fullPromptPresentationAI
                    : activeItemForModal.infografis.fullEnglishPrompt;
                  const enrichedPrompt = `${basePrompt}\n\nADDITIONAL CUSTOM CONTEXT: Setting environment specifically tailored to ${customSetting.replace(/_/g, ' ')}, and children characters strictly wearing authentic ${customUniform.replace(/_/g, ' ')} school attire.`;
                  handleCopy(enrichedPrompt, `custom-${activeItemForModal.id}`);
                  setIsCustomizeModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Prompt Terkustomisasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Titimangsa & Tahun Pelajaran Sebelum Download Media Prompts */}
      <ExportConfirmModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        identitas={promptDocument.identitas || identitas}
        exportType={exportType}
        documentTitle={`Prompt Media Pembelajaran: ${identitas.mataPelajaran}`}
        onUpdateIdentitas={onUpdateIdentitas}
        onConfirm={handleConfirmExport}
        availableClasses={availableClasses}
        defaultSelectedKelas={selectedClassFilter}
        showClassSelector={true}
        defaultOrientation="portrait"
      />
    </div>
  );
};
