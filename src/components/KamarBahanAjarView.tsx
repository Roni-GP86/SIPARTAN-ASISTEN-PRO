import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  HardDrive,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  Presentation,
  Headphones,
  Sparkles,
  Wifi,
  WifiOff,
  Filter,
  Download,
  AlertCircle,
  ExternalLink,
  FolderPlus,
  LayoutGrid,
  List,
  Folder,
  Loader2,
  FileDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LearningMaterialMedia,
  LearningMediaType,
  SchoolIdentity,
  SubjectFolder,
} from '../types';
import {
  subscribeToLearningMaterials,
  deleteLearningMaterial,
  downloadAndSaveMaterialForOffline,
  downloadMaterialToDevice,
  subscribeToSubjectFolders,
  deleteSubjectFolder,
  KAMAR_MAPEL_LIST,
  JENIS_MEDIA_LIST,
} from '../services/learningMaterialService';
import {
  getOfflineStorageSummary,
  clearAllOfflineMaterials,
  deleteOfflineMaterialFile,
} from '../services/offlineMaterialStorage';
import { UploadMaterialModal } from './UploadMaterialModal';
import { MaterialViewerModal } from './MaterialViewerModal';
import { CreateFolderModal } from './CreateFolderModal';
import { sounds } from '../utils/audioEffects';

interface KamarBahanAjarViewProps {
  identitas: SchoolIdentity;
  showToast: (msg: string) => void;
  isTeacherMode?: boolean;
}

// Icon mapper untuk setiap mata pelajaran
const MAPEL_ICONS: Record<string, string> = {
  'Semua Mata Pelajaran': '🌟',
  'Pendidikan Pancasila': '🏛️',
  'Bahasa Indonesia': '📖',
  'Matematika': '🔢',
  'IPAS (Ilmu Pengetahuan Alam & Sosial)': '🔬',
  'Seni Budaya': '🎨',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)': '🏃',
  'Bahasa Inggris': '🇬🇧',
  'Pendidikan Agama Katolik & Budi Pekerti': '⛪',
  'Pendidikan Agama Katolik dan Budi Pekerti': '⛪',
  'Muatan Lokal / Khas Daerah': '🏝️',
};

export const KamarBahanAjarView: React.FC<KamarBahanAjarViewProps> = ({
  identitas,
  showToast,
  isTeacherMode = true,
}) => {
  const [materials, setMaterials] = useState<LearningMaterialMedia[]>([]);
  const [folders, setFolders] = useState<SubjectFolder[]>([]);
  const [selectedMapel, setSelectedMapel] = useState<string>('Semua Mata Pelajaran');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<LearningMediaType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyOffline, setOnlyOffline] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState<boolean>(false);
  const [targetFolderSubject, setTargetFolderSubject] = useState<string>('');
  const [activeViewingMaterial, setActiveViewingMaterial] = useState<LearningMaterialMedia | null>(null);
  const [deleteConfirmMaterial, setDeleteConfirmMaterial] = useState<LearningMaterialMedia | null>(null);
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<SubjectFolder | null>(null);

  // Storage stats
  const [offlineStats, setOfflineStats] = useState<{ totalItems: number; totalBytes: number }>({
    totalItems: 0,
    totalBytes: 0,
  });

  const refreshOfflineStats = async () => {
    const summary = await getOfflineStorageSummary();
    setOfflineStats(summary);
  };

  useEffect(() => {
    refreshOfflineStats();
    const unsubMaterials = subscribeToLearningMaterials((data) => {
      setMaterials(data);
      refreshOfflineStats();
    });

    const unsubFolders = subscribeToSubjectFolders((folderList) => {
      setFolders(folderList);
    });

    return () => {
      unsubMaterials();
      unsubFolders();
    };
  }, []);

  // Filter folders based on current selected subject
  const currentSubjectFolders = folders.filter((f) => {
    if (selectedMapel === 'Semua Mata Pelajaran') return true;
    return f.subject === selectedMapel;
  });

  // Filter materials based on Subject, Folder, Media Type, Search, and Offline state
  const filteredMaterials = materials.filter((item) => {
    const matchMapel =
      selectedMapel === 'Semua Mata Pelajaran' || item.mataPelajaran === selectedMapel;
    const matchFolder =
      selectedFolderId === 'all' ||
      (selectedFolderId === 'unassigned' && !item.folderId) ||
      item.folderId === selectedFolderId;
    const matchMedia = selectedMediaType === 'all' || item.jenisMedia === selectedMediaType;
    const matchOffline = !onlyOffline || item.isOfflineReady;
    const matchSearch =
      !searchQuery.trim() ||
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.folderName && item.folderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.fileName && item.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchMapel && matchFolder && matchMedia && matchOffline && matchSearch;
  });

  // Calculate counts per subject
  const getSubjectCount = (mapel: string) => {
    if (mapel === 'Semua Mata Pelajaran') return materials.length;
    return materials.filter((m) => m.mataPelajaran === mapel).length;
  };

  // Calculate counts per folder
  const getFolderMaterialCount = (folderId: string) => {
    return materials.filter((m) => m.folderId === folderId).length;
  };

  // Calculate counts per media type
  const getMediaCount = (type: LearningMediaType | 'all') => {
    if (type === 'all') return materials.length;
    return materials.filter((m) => m.jenisMedia === type).length;
  };

  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDeleteMaterial = async (item: LearningMaterialMedia) => {
    try {
      setIsDeleting(true);
      await deleteLearningMaterial(item.id, item.storagePath);
      setMaterials((prev) => prev.filter((m) => m.id !== item.id));
      showToast(`✅ Berhasil! Bahan ajar "${item.judul}" telah dihapus dari sistem.`);
      setDeleteConfirmMaterial(null);
      refreshOfflineStats();
    } catch (e) {
      console.error('Gagal menghapus materi:', e);
      showToast('❌ Gagal menghapus bahan ajar. Silakan periksa koneksi Anda.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFolder = async (folder: SubjectFolder) => {
    try {
      await deleteSubjectFolder(folder.id);
      showToast(`Folder "${folder.name}" berhasil dihapus.`);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('all');
      }
      setDeleteConfirmFolder(null);
    } catch (e) {
      showToast('Gagal menghapus folder.');
    }
  };

  const handleDownloadFile = async (e: React.MouseEvent, item: LearningMaterialMedia) => {
    e.stopPropagation();
    try {
      setDownloadingId(item.id);
      sounds.playClick();
      await downloadMaterialToDevice(item);
      showToast(`Mengunduh berkas "${item.judul}" ke perangkat.`);
    } catch (err) {
      console.error('Download error:', err);
      showToast('Gagal mengunduh berkas.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleOffline = async (e: React.MouseEvent, item: LearningMaterialMedia) => {
    e.stopPropagation();
    if (item.isOfflineReady) {
      await deleteOfflineMaterialFile(item.id);
      showToast(`Cache offline "${item.judul}" dilepaskan.`);
      // Update local state
      setMaterials((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, isOfflineReady: false } : m))
      );
      refreshOfflineStats();
    } else {
      const success = await downloadAndSaveMaterialForOffline(item);
      if (success) {
        showToast(`⚡ "${item.judul}" tersimpan ke perangkat! Siap dibuka tanpa kuota internet.`);
        setMaterials((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, isOfflineReady: true } : m))
        );
        refreshOfflineStats();
      } else {
        showToast('Materi ini telah siap dibuka.');
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'File Ringan';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaBadge = (type: LearningMediaType) => {
    const found = JENIS_MEDIA_LIST.find((j) => j.type === type);
    return found || JENIS_MEDIA_LIST[0];
  };

  return (
    <div className="space-y-6">
      {/* BANNER HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#071E3D] via-[#0B2545] to-[#0D1F3C] p-6 sm:p-7 rounded-3xl border-2 border-blue-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-sm">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                Mendukung Akses 100% Offline Tanpa Kuota
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Firebase Storage Cloud &amp; Offline IndexedDB
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>📚 Kamar Bahan Ajar &amp; Media Belajar Digital</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kamar belajar mandiri peserta didik SD Fatubai dengan pengelompokan folder per mata pelajaran.
              Guru dapat mengunggah modul PDF, gambar JPG/PNG, slide PPT, serta video MP4 dengan penyimpanan cloud Firebase permanen.
            </p>
          </div>

          {/* Teacher Actions: Upload & Buat Folder */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            {isTeacherMode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setTargetFolderSubject(
                    selectedMapel !== 'Semua Mata Pelajaran' ? selectedMapel : 'IPAS (Ilmu Pengetahuan Alam & Sosial)'
                  );
                  setIsCreateFolderModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-102 active:scale-98"
                title="Buat folder baru untuk mengelompokkan bahan ajar"
              >
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>+ Buat Folder Mapel</span>
              </button>
            )}

            {isTeacherMode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/30 transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Unggah Bahan Ajar</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              📁
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Materi</div>
              <div className="text-sm font-black text-white">{materials.length} Judul</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              📂
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Folder Mapel</div>
              <div className="text-sm font-black text-white">{folders.length} Folder</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <div className="text-[10px] text-emerald-300 font-bold uppercase">Tersedia Offline</div>
              <div className="text-sm font-black text-emerald-400">
                {materials.filter((m) => m.isOfflineReady).length} Materi
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              💾
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Memori Tersimpan</div>
              <div className="text-sm font-black text-amber-300">
                {formatFileSize(offlineStats.totalBytes)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER 1: KAMAR MATA PELAJARAN (HORIZONTAL SCROLLABLE BADGES) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Pilih Kamar Mata Pelajaran:</span>
          </span>
          <span className="text-slate-400 font-semibold">{filteredMaterials.length} bahan ajar cocok</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {KAMAR_MAPEL_LIST.map((mapel) => {
            const isSelected = selectedMapel === mapel;
            const count = getSubjectCount(mapel);
            const icon = MAPEL_ICONS[mapel] || '📚';
            return (
              <button
                key={mapel}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedMapel(mapel);
                  setSelectedFolderId('all');
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25 scale-102'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border-slate-800 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                <span>{mapel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER 1.5: FOLDER PER MATA PELAJARAN (JIKA ADA FOLDER KHUSUS) */}
      <div className="bg-[#0B1528] p-3.5 sm:p-4 rounded-2xl border border-slate-800/90 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>
                Folder Khusus {selectedMapel !== 'Semua Mata Pelajaran' ? selectedMapel : 'Semua Mapel'}:
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              ({currentSubjectFolders.length} folder)
            </span>
          </div>

          {isTeacherMode && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setTargetFolderSubject(
                  selectedMapel !== 'Semua Mata Pelajaran' ? selectedMapel : 'IPAS (Ilmu Pengetahuan Alam & Sosial)'
                );
                setIsCreateFolderModalOpen(true);
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Folder Baru</span>
            </button>
          )}
        </div>

        {/* Folder Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setSelectedFolderId('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border ${
              selectedFolderId === 'all'
                ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700/80'
            }`}
          >
            <span>📁 Semua Folder</span>
          </button>

          {currentSubjectFolders.map((fol) => {
            const isSelected = selectedFolderId === fol.id;
            const count = getFolderMaterialCount(fol.id);
            return (
              <div
                key={fol.id}
                className={`inline-flex items-center rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFolderId(fol.id);
                  }}
                  className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{fol.icon || '📁'}</span>
                  <span>{fol.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white font-black' : 'bg-slate-800 text-slate-400 font-bold'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {isTeacherMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmFolder(fol);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-r-xl transition-colors cursor-pointer"
                    title={`Hapus folder ${fol.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER 2: JENIS MEDIA, PENCARIAN, & TOGGLE TAMPILAN (GRID VS DAFTAR SEDERHANA) */}
      <div className="bg-[#0B1528] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Format media buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedMediaType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              selectedMediaType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua Format ({getMediaCount('all')})
          </button>

          {JENIS_MEDIA_LIST.map((jm) => {
            const isSelected = selectedMediaType === jm.type;
            const count = getMediaCount(jm.type);
            return (
              <button
                key={jm.type}
                type="button"
                onClick={() => setSelectedMediaType(jm.type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{jm.badge.split(' ')[0]}</span>
                <span>{jm.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Controls right: Offline toggle, Search Box, and Grid vs List View Switcher */}
        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap sm:flex-nowrap">
          {/* Offline only toggle */}
          <button
            type="button"
            onClick={() => setOnlyOffline((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              onlyOffline
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Filter hanya bahan yang tersimpan offline"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Saja</span>
          </button>

          {/* View mode switcher: Grid vs Simple List */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Kartu (Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setViewMode('list');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Daftar Sederhana (Simple List View)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Daftar Unduh</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file, judul, materi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* CONTENT: EMPTY STATE OR (GRID / LIST VIEW) */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B1528] border-2 border-dashed border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto text-3xl">
            📂
          </div>
          <h4 className="text-base font-bold text-white">Belum Ada Bahan Ajar di Kamar / Folder Ini</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Bapak/Ibu Guru dapat mengunggah berkas PDF, modul gambar, slide presentasi PPT, atau video MP4 kapan saja tanpa batas jumlah.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isTeacherMode && (
              <button
                type="button"
                onClick={() => {
                  setTargetFolderSubject(
                    selectedMapel !== 'Semua Mata Pelajaran' ? selectedMapel : 'IPAS (Ilmu Pengetahuan Alam & Sosial)'
                  );
                  setIsCreateFolderModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-blue-500/40 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Buat Folder Mapel</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Unggah Bahan Ajar Sekarang</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* ===================================================================== */
        /* TAMPILAN DAFTAR SEDERHANA (SIMPLE LIST VIEW KHUSUS MURID & GURU)      */
        /* ===================================================================== */
        <div className="bg-[#0B1528] rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-4 h-4 text-blue-400" />
                <span>Daftar Berkas &amp; Unduhan Murid</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {filteredMaterials.length} Sumber Belajar
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Murid dapat mengklik tombol <strong className="text-white">"Unduh / Download"</strong> untuk menyimpan berkas ke HP/laptop, atau <strong className="text-white">"Buka"</strong> untuk langsung membaca/menonton.
            </p>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filteredMaterials.map((item, idx) => {
              const mediaConfig = getMediaBadge(item.jenisMedia);
              const isCurrentlyDownloading = downloadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-4.5 hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                >
                  {/* Left: Media Icon + Title + Meta */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${mediaConfig.colorBg} ${mediaConfig.colorBorder} border flex items-center justify-center text-xl shrink-0 shadow-inner mt-0.5`}
                    >
                      {item.jenisMedia === 'pdf' && '📄'}
                      {item.jenisMedia === 'gambar' && '🖼️'}
                      {item.jenisMedia === 'ppt' && '📊'}
                      {item.jenisMedia === 'video' && '🎥'}
                      {item.jenisMedia === 'audio' && '🎧'}
                      {item.jenisMedia === 'link' && '🔗'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mapel Tag */}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                          {item.mataPelajaran}
                        </span>

                        {/* Folder Tag (if assigned) */}
                        {item.folderName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Folder className="w-3 h-3 text-indigo-400" />
                            <span>{item.folderName}</span>
                          </span>
                        )}

                        {/* Format Tag */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${mediaConfig.colorBg} ${mediaConfig.colorText} border ${mediaConfig.colorBorder}`}
                        >
                          {mediaConfig.badge}
                        </span>

                        {/* Offline Status */}
                        {item.isOfflineReady ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Offline Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-blue-400" />
                            Cloud Ready
                          </span>
                        )}
                      </div>

                      {/* Judul */}
                      <h4
                        onClick={() => {
                          sounds.playClick();
                          setActiveViewingMaterial(item);
                        }}
                        className="font-black text-white text-sm sm:text-base hover:text-blue-300 transition-colors cursor-pointer leading-snug"
                      >
                        {item.judul}
                      </h4>

                      {/* File Details: Nama File Asli, Ukuran, Keterangan */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        {item.fileName && (
                          <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 truncate max-w-xs">
                            {item.fileName}
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatFileSize(item.fileSize)}</span>
                        {item.durasiVideo && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 font-mono">Durasi: {item.durasiVideo}</span>
                          </>
                        )}
                        {item.halamanPdf && (
                          <>
                            <span>•</span>
                            <span>{item.halamanPdf} Halaman</span>
                          </>
                        )}
                      </div>

                      {item.deskripsi && (
                        <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons (Unduh, Buka, Offline, Hapus) */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                    {/* Direct Download Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadFile(e, item)}
                      disabled={isCurrentlyDownloading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      title="Unduh berkas ini ke perangkat (HP / Komputer)"
                    >
                      {isCurrentlyDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Unduh / Download</span>
                        </>
                      )}
                    </button>

                    {/* View / Open Button */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveViewingMaterial(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                      title="Buka dan pelajari materi langsung"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </button>

                    {/* Offline Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleOffline(e, item)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        item.isOfflineReady
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-800'
                      }`}
                      title={item.isOfflineReady ? 'Lepaskan dari cache offline' : 'Simpan ke memori offline'}
                    >
                      <HardDrive className="w-4 h-4" />
                    </button>

                    {/* Delete (Teacher only) */}
                    {isTeacherMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmMaterial(item);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Hapus Bahan Ajar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* TAMPILAN KARTU (GRID VIEW)                                            */
        /* ===================================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredMaterials.map((item, idx) => {
              const mediaConfig = getMediaBadge(item.jenisMedia);
              const isCurrentlyDownloading = downloadingId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.3) }}
                  className="group relative bg-[#0B1528] hover:bg-[#0E1A32] rounded-3xl border-2 border-slate-800 hover:border-blue-500/50 p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Media Badge & Folder & Offline indicator */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${mediaConfig.colorBg} ${mediaConfig.colorText} border ${mediaConfig.colorBorder}`}
                        >
                          <span>{mediaConfig.badge}</span>
                        </span>

                        {item.folderName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                            <Folder className="w-3 h-3 text-indigo-400" />
                            <span className="truncate max-w-[120px]">{item.folderName}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.isOfflineReady ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Offline Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800">
                            <Wifi className="w-3 h-3 text-blue-400" />
                            Cloud
                          </span>
                        )}

                        {/* Delete Button for Teacher */}
                        {isTeacherMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmMaterial(item);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Hapus Bahan Ajar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Judul & Mata Pelajaran */}
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                        {item.mataPelajaran}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                        {item.judul}
                      </h4>
                      {item.deskripsi && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>

                    {/* Preview Graphic / Thumbnail */}
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setActiveViewingMaterial(item);
                      }}
                      className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800/80 p-3.5 flex items-center justify-between cursor-pointer hover:border-blue-400/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner shrink-0">
                          {item.jenisMedia === 'video' && '🎥'}
                          {item.jenisMedia === 'gambar' && '🖼️'}
                          {item.jenisMedia === 'pdf' && '📄'}
                          {item.jenisMedia === 'ppt' && '📊'}
                          {item.jenisMedia === 'audio' && '🎧'}
                          {item.jenisMedia === 'link' && '🔗'}
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-slate-200 line-clamp-1">{item.fileName || item.judul}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatFileSize(item.fileSize)} • {item.durasiVideo || (item.halamanPdf ? `${item.halamanPdf} Halaman` : 'Siap Pelajari')}
                          </div>
                        </div>
                      </div>

                      <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Direct in-app access first */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Buka & Pelajari Langsung di Aplikasi */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveViewingMaterial(item);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
                      title="Buka langsung di dalam aplikasi tanpa perlu unduh"
                    >
                      {item.jenisMedia === 'ppt' ? (
                        <>
                          <Presentation className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>Buka Slide Interaktif</span>
                        </>
                      ) : item.jenisMedia === 'pdf' ? (
                        <>
                          <FileText className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                          <span>Baca Materi Lengkap</span>
                        </>
                      ) : item.jenisMedia === 'video' ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                          <span>Tonton Video</span>
                        </>
                      ) : item.jenisMedia === 'audio' ? (
                        <>
                          <Headphones className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                          <span>Dengar Rekaman</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          <span>Buka &amp; Pelajari</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Simpan Offline Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleOffline(e, item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          item.isOfflineReady
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-rose-950/40 hover:text-rose-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={item.isOfflineReady ? 'Tersimpan di HP/Laptop (offline)' : 'Simpan ke memori offline aplikasi'}
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{item.isOfflineReady ? 'Offline' : 'Offline'}</span>
                      </button>

                      {/* Optional download icon for teacher backup */}
                      {isTeacherMode && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadFile(e, item)}
                          disabled={isCurrentlyDownloading}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
                          title="Simpan cadangan file ke perangkat (khusus guru)"
                        >
                          {isCurrentlyDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL BUAT FOLDER MATA PELAJARAN */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        defaultSubject={targetFolderSubject || selectedMapel}
        onSuccess={(folderName) => {
          showToast(`📁 Folder "${folderName}" berhasil dibuat!`);
        }}
      />

      {/* MODAL UNGGAH BAHAN AJAR BARU */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentMataPelajaran={selectedMapel !== 'Semua Mata Pelajaran' ? selectedMapel : undefined}
        currentKelas={identitas.kelas || '4'}
        currentFolderId={selectedFolderId !== 'all' ? selectedFolderId : undefined}
        availableFolders={folders}
        onRequestCreateFolder={(subject) => {
          setTargetFolderSubject(subject);
          setIsCreateFolderModalOpen(true);
        }}
        onSuccess={(title) => {
          showToast(`⚡ Bahan ajar "${title}" berhasil diunggah permanen ke Ruang Murid!`);
          refreshOfflineStats();
        }}
      />

      {/* MODAL PRATINJAU / VIEWER BAHAN AJAR */}
      <MaterialViewerModal
        material={activeViewingMaterial}
        isOpen={Boolean(activeViewingMaterial)}
        onClose={() => setActiveViewingMaterial(null)}
        showToast={showToast}
        onOfflineStatusChanged={() => {
          refreshOfflineStats();
        }}
      />

      {/* DIALOG KONFIRMASI HAPUS BAHAN AJAR */}
      {deleteConfirmMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#0F1E38] rounded-3xl border-2 border-rose-500/40 p-6 shadow-2xl space-y-4 text-white"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-white">Hapus Bahan Ajar?</h4>
              <p className="text-xs text-slate-300">
                Bahan ajar <strong className="text-white">"{deleteConfirmMaterial.judul}"</strong> akan dihapus permanen dari Cloud Firebase Storage dan memori offline seluruh murid.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMaterial(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMaterial(deleteConfirmMaterial)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Permanen</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS FOLDER */}
      {deleteConfirmFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#0F1E38] rounded-3xl border-2 border-rose-500/40 p-6 shadow-2xl space-y-4 text-white"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-white">Hapus Folder Mata Pelajaran?</h4>
              <p className="text-xs text-slate-300">
                Folder <strong className="text-white">"{deleteConfirmFolder.name}"</strong> ({deleteConfirmFolder.subject}) akan dihapus. Berkas di dalamnya tetap tersimpan di mata pelajaran tersebut.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFolder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(deleteConfirmFolder)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Hapus Folder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
