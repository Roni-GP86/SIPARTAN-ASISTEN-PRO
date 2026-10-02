import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  FileText,
  Presentation,
  Headphones,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  RotateCcw,
  Maximize2,
  Eye,
  Type,
  Video,
  Download,
  FileDown,
  MonitorPlay,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearningMaterialMedia, MaterialSlide } from '../types';
import {
  resolveMaterialContent,
  downloadAndSaveMaterialForOffline,
} from '../services/learningMaterialService';
import { deleteOfflineMaterialFile } from '../services/offlineMaterialStorage';
import { sounds } from '../utils/audioEffects';

interface MaterialViewerModalProps {
  material: LearningMaterialMedia | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
  onOfflineStatusChanged?: () => void;
}

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&rel=0`
    : null;
}

function getGoogleDriveEmbedUrl(url?: string | null): string | null {
  if (!url || !url.includes('drive.google.com')) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  material,
  isOpen,
  onClose,
  showToast,
  onOfflineStatusChanged,
}) => {
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [isFromOffline, setIsFromOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSavingOffline, setIsSavingOffline] = useState<boolean>(false);

  // Slide Presenter State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // PDF / Document Reader State (Default to native PDF viewer so original file is always displayed!)
  const [docViewMode, setDocViewMode] = useState<'pdf' | 'reading'>('pdf');
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Slide toggle: berkas asli vs slide interaktif (jika data slide tersedia)
  const [pptViewMode, setPptViewMode] = useState<'berkas' | 'interaktif'>('berkas');

  // Slides array hanya digunakan jika materi secara eksplisit memiliki slides custom
  const slides = useMemo<MaterialSlide[]>(() => {
    if (!material) return [];
    if (material.slides && material.slides.length > 0) {
      return material.slides;
    }
    return [];
  }, [material]);

  // Reset states when opening a new material
  useEffect(() => {
    if (!material || !isOpen) {
      setContentUrl(null);
      setCurrentSlideIndex(0);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setZoomLevel(1);
    setCurrentSlideIndex(0);
    // Selalu tampilkan format asli berkas secara default (PDF / Berkas Asli)
    setDocViewMode('pdf');
    setPptViewMode('berkas');

    resolveMaterialContent(material)
      .then((resolved) => {
        if (!isMounted) return;
        if (resolved.blobUrl) {
          setContentUrl(resolved.blobUrl);
          setIsFromOffline(resolved.isFromOffline);
        } else if (resolved.dataUrl) {
          setContentUrl(resolved.dataUrl);
          setIsFromOffline(resolved.isFromOffline);
        } else if (resolved.externalUrl) {
          setContentUrl(resolved.externalUrl);
          setIsFromOffline(resolved.isFromOffline);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat konten media:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [material, isOpen]);

  // Keyboard navigation for slide presentation (ArrowRight / ArrowLeft)
  useEffect(() => {
    if (!isOpen || slides.length === 0 || pptViewMode !== 'interaktif') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (currentSlideIndex < slides.length - 1) {
          e.preventDefault();
          sounds.playNextQuestion();
          setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentSlideIndex > 0) {
          e.preventDefault();
          sounds.playClick();
          setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, currentSlideIndex, pptViewMode, onClose]);

  if (!isOpen || !material) return null;

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      sounds.playNextQuestion();
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      sounds.playClick();
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleToggleOfflineCache = async () => {
    if (material.isOfflineReady) {
      await deleteOfflineMaterialFile(material.id);
      showToast('Cache offline materi dilepaskan dari perangkat ini.');
      if (onOfflineStatusChanged) onOfflineStatusChanged();
    } else {
      setIsSavingOffline(true);
      try {
        const ok = await downloadAndSaveMaterialForOffline(material);
        if (ok) {
          showToast('⚡ Berhasil disimpan ke perangkat! Materi ini kini bisa dibuka tanpa kuota internet.');
          if (onOfflineStatusChanged) onOfflineStatusChanged();
        } else {
          showToast('Materi ini telah siap diakses di aplikasi.');
        }
      } catch (e) {
        showToast('Gagal menyimpan cache offline.');
      } finally {
        setIsSavingOffline(false);
      }
    }
  };

  const isPdfDoc =
    material.jenisMedia === 'pdf' ||
    material.fileType?.includes('pdf') ||
    material.fileName?.toLowerCase().endsWith('.pdf');

  const isPptSlide =
    material.jenisMedia === 'ppt' ||
    material.fileName?.toLowerCase().endsWith('.pptx') ||
    material.fileName?.toLowerCase().endsWith('.ppt');

  const youtubeEmbed = getYouTubeEmbedUrl(contentUrl || material.fileUrl);
  const driveEmbed = getGoogleDriveEmbedUrl(contentUrl || material.fileUrl);

  const activeDownloadUrl =
    contentUrl || material.fileUrl || material.downloadUrl || material.fileData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-5xl bg-gradient-to-b from-[#0F1E38] to-[#0A1424] rounded-3xl border-2 border-blue-500/40 shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[92vh] text-white"
      >
        {/* =================================================================== */}
        {/* HEADER BAR                                                          */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
              {material.jenisMedia === 'video' && '🎥'}
              {material.jenisMedia === 'gambar' && '🖼️'}
              {material.jenisMedia === 'pdf' && '📄'}
              {material.jenisMedia === 'ppt' && '📊'}
              {material.jenisMedia === 'audio' && '🎧'}
              {material.jenisMedia === 'link' && '🔗'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {material.mataPelajaran}
                </span>
                <span className="text-[10px] text-slate-300 font-semibold">
                  {material.fase || 'Fase B'} • Kelas {material.kelas || '4'}
                </span>
                {material.folderName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    📁 {material.folderName}
                  </span>
                )}
                {material.isOfflineReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Siap Offline
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate mt-0.5" title={material.judul}>
                {material.judul}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Quick Download / Open Original File Button */}
            {activeDownloadUrl && (
              <a
                href={activeDownloadUrl}
                download={material.fileName || `${material.judul}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-400/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Unduh atau Buka Berkas Asli di Tab Baru"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh Berkas</span>
              </a>
            )}

            {/* Toggle Cache Offline */}
            <button
              type="button"
              onClick={handleToggleOfflineCache}
              disabled={isSavingOffline}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                material.isOfflineReady
                  ? 'bg-emerald-600/30 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-600/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Simpan ke perangkat agar dapat dibuka saat tanpa internet"
            >
              {isSavingOffline ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{material.isOfflineReady ? 'Tersimpan Offline' : 'Simpan Offline'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Pratinjau (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Offline indicator banner */}
        {isFromOffline && (
          <div className="px-4 py-1.5 bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Materi dibuka langsung dari penyimpanan lokal perangkat (100% Hemat Kuota).
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Mode Tanpa Internet</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* MAIN VIEWER CONTAINER                                               */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center bg-slate-950/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400 my-auto">
              <Loader2 className="w-9 h-9 animate-spin text-blue-400" />
              <p className="text-sm font-semibold">Mempersiapkan berkas asli untuk dipelajari...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center max-w-5xl space-y-4">
              {/* ============================================================= */}
              {/* 1. SLIDE / PRESENTASI (PPT / PPTX / SLIDE PDF)                */}
              {/* ============================================================= */}
              {isPptSlide && (
                <div className="w-full space-y-4">
                  {/* Top Slide Control Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 flex items-center gap-1.5">
                        <Presentation className="w-4 h-4" />
                        <span>Presentasi Slide Guru</span>
                      </span>
                      {material.fileName && (
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          ({material.fileName})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {slides.length > 0 && (
                        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setPptViewMode('berkas')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              pptViewMode === 'berkas'
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            Berkas Asli
                          </button>
                          <button
                            type="button"
                            onClick={() => setPptViewMode('interaktif')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              pptViewMode === 'interaktif'
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            Slide Interaktif
                          </button>
                        </div>
                      )}

                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Layar Penuh</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* SUB-VIEW 1A: Slide Interaktif Deck (Hanya jika guru membuat slide interaktif) */}
                  {pptViewMode === 'interaktif' && slides.length > 0 && currentSlide && (
                    <div className="w-full space-y-4">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300"
                          initial={{ width: '0%' }}
                          animate={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
                          transition={{ duration: 0.25 }}
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentSlideIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="w-full rounded-3xl bg-gradient-to-b from-[#112344] via-[#0C1B35] to-[#081224] border-2 border-amber-500/40 p-5 sm:p-8 shadow-2xl space-y-6 text-left relative overflow-hidden"
                        >
                          <div className="space-y-1.5 border-b border-amber-500/20 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                                {currentSlideIndex + 1}
                              </span>
                              <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
                                {material.mataPelajaran}
                              </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                              {currentSlide.judulSlide}
                            </h2>
                            {currentSlide.subjudul && (
                              <p className="text-sm sm:text-base text-blue-200/90 font-medium">
                                {currentSlide.subjudul}
                              </p>
                            )}
                          </div>

                          {currentSlide.konsepKunci && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 shadow-inner flex items-start gap-3">
                              <span className="text-xl shrink-0">💡</span>
                              <div>
                                <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                                  Konsep Kunci:
                                </span>
                                <p className="text-sm font-bold text-amber-100 mt-0.5 leading-relaxed">
                                  {currentSlide.konsepKunci}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                              Poin Pembelajaran:
                            </span>
                            <div className="grid grid-cols-1 gap-2.5">
                              {currentSlide.poinMateri.map((poin, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/30 transition-colors flex items-start gap-3"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {pIdx + 1}
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
                                    {poin}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handlePrevSlide}
                          disabled={currentSlideIndex === 0}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Sebelumnya</span>
                        </button>

                        <span className="text-xs font-black text-amber-300">
                          Slide {currentSlideIndex + 1} dari {totalSlides}
                        </span>

                        <button
                          type="button"
                          onClick={handleNextSlide}
                          disabled={currentSlideIndex >= totalSlides - 1}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <span>Berikutnya</span>
                          <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 1B: Berkas Asli Presentation Viewer */}
                  {pptViewMode === 'berkas' && (
                    <div className="w-full space-y-4">
                      {/* Jika berkas yang diunggah berupa Slide Gambar (PNG/JPG dari Canva/PowerPoint) */}
                      {contentUrl && (/\.(png|jpe?g|webp|svg|gif)$/i.test(material.fileName || '') || material.fileType?.startsWith('image/')) ? (
                        <div className="w-full rounded-3xl overflow-auto max-h-[76vh] bg-slate-900/95 border-2 border-amber-500/40 p-3 flex items-center justify-center shadow-2xl">
                          <img
                            src={contentUrl}
                            alt={material.judul}
                            className="max-w-full h-auto object-contain rounded-2xl shadow-lg"
                          />
                        </div>
                      ) : contentUrl && (material.fileName?.toLowerCase().endsWith('.pdf') || material.fileType === 'application/pdf') ? (
                        /* Jika berkas yang diunggah berupa PDF (Slide PDF dari Canva/PPT) */
                        <div className="w-full h-[76vh] rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-white shadow-2xl relative">
                          <iframe
                            src={`${contentUrl}#toolbar=1&navpanes=1`}
                            title={material.judul}
                            className="w-full h-full border-none bg-white"
                          />
                        </div>
                      ) : contentUrl && (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) ? (
                        /* Jika URL publik internet (Firebase Storage), gunakan Microsoft Office Online Viewer */
                        <div className="w-full h-[76vh] rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-slate-900 shadow-2xl relative">
                          <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(contentUrl)}`}
                            title={material.judul}
                            className="w-full h-full border-none bg-white"
                          />
                        </div>
                      ) : (
                        /* Tampilan Kartu Berkas Asli yang Elegan & Tombol Buka/Unduh */
                        <div className="w-full p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#16213E] to-[#0A1424] border-2 border-amber-500/40 text-center space-y-6 shadow-2xl">
                          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border-2 border-amber-400/30 flex items-center justify-center mx-auto text-4xl shadow-inner">
                            📊
                          </div>
                          <div className="max-w-xl mx-auto space-y-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                              {material.judul}
                            </h3>
                            <p className="text-sm text-slate-300">
                              Berkas presentasi slide pembelajaran asli ({material.fileName || 'Presentasi.pptx'}) siap dipelajari oleh peserta didik.
                            </p>
                            {material.deskripsi && (
                              <p className="text-xs text-amber-200/80 italic mt-2">
                                &ldquo;{material.deskripsi}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            {activeDownloadUrl && (
                              <>
                                <a
                                  href={activeDownloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all hover:scale-103"
                                >
                                  <MonitorPlay className="w-4 h-4" />
                                  <span>Putar / Buka di Tab Baru</span>
                                </a>

                                <a
                                  href={activeDownloadUrl}
                                  download={material.fileName || `${material.judul}.pptx`}
                                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-md cursor-pointer transition-all hover:scale-103"
                                >
                                  <Download className="w-4 h-4 text-amber-400" />
                                  <span>Unduh Berkas Slide (.pptx)</span>
                                </a>
                              </>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto text-left space-y-1">
                            <span className="font-bold text-amber-300 block">💡 Panduan Guru &amp; Siswa:</span>
                            <p>
                              Untuk menayangkan animasi presentasi penuh, klik <strong>Putar / Buka di Tab Baru</strong> atau buka file ini menggunakan Microsoft PowerPoint / Google Slides di perangkat Anda.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 2. PDF & DOKUMEN ASLI (LKPD, MODUL, BUKU SISWA BERGAMBAR)     */}
              {/* ============================================================= */}
              {isPdfDoc && !isPptSlide && (
                <div className="w-full space-y-3">
                  {/* Top Bar Switcher & Action */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-rose-500/30 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDocViewMode('pdf')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          docViewMode === 'pdf'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>📄 Tampilan Dokumen PDF Asli</span>
                      </button>

                      {material.ringkasan && (
                        <button
                          type="button"
                          onClick={() => setDocViewMode('reading')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            docViewMode === 'reading'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>📖 Rangkuman &amp; Naskah Guru</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 shadow transition-all"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Layar Penuh</span>
                        </a>
                      )}

                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          download={material.fileName || `${material.judul}.pdf`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold border border-rose-500/40 shadow transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mode 1 (DEFAULT): DOKUMEN PDF ASLI DI IFRAME DENGAN RESOLUSI TINGGI */}
                  {docViewMode === 'pdf' && (
                    <div className="w-full h-[76vh] sm:h-[82vh] rounded-3xl overflow-hidden border-2 border-rose-500/30 bg-white shadow-2xl relative">
                      {contentUrl ? (
                        <iframe
                          src={`${contentUrl}#toolbar=1&navpanes=1`}
                          title={material.judul}
                          className="w-full h-full border-none bg-white"
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-center text-slate-400 space-y-4">
                          <FileText className="w-12 h-12 text-rose-400" />
                          <p className="text-sm font-semibold text-white">
                            Berkas PDF siap dibuka pada peramban Anda.
                          </p>
                          {activeDownloadUrl && (
                            <a
                              href={activeDownloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Buka Dokumen PDF di Tab Baru</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Rangkuman & Catatan Teks Guru (Hanya jika guru mengisi ringkasan) */}
                  {docViewMode === 'reading' && material.ringkasan && (
                    <div className="w-full rounded-3xl bg-slate-900 border-2 border-rose-500/30 p-6 sm:p-8 space-y-4 text-left shadow-2xl">
                      <div className="border-b border-slate-800 pb-3">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">
                          Rangkuman Penjelasan Guru:
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{material.judul}</h3>
                      </div>
                      <div className="whitespace-pre-line text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                        {material.ringkasan}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 3. GAMBAR & INFOGRAFIS (TAMPILKAN GAMBAR ASLINYA)             */}
              {/* ============================================================= */}
              {material.jenisMedia === 'gambar' && (
                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 gap-2">
                    <span className="text-xs text-emerald-300 font-black px-2 flex items-center gap-1.5">
                      <span>🖼️ Gambar Asli Bahan Ajar</span>
                      {material.fileName && (
                        <span className="text-slate-400 font-mono text-[11px]">({material.fileName})</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Perbesar (+)"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        title="Perkecil (-)"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono cursor-pointer"
                        title="Kembalikan ke Ukuran Normal"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>

                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-bold border border-emerald-500/40"
                          title="Buka Gambar Layar Penuh"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Layar Penuh</span>
                        </a>
                      )}

                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          download={material.fileName || `${material.judul}.jpg`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                          title="Unduh Gambar Asli"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Unduh</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="w-full rounded-3xl overflow-auto max-h-[72vh] bg-slate-900/90 border-2 border-emerald-500/40 p-3 flex items-center justify-center shadow-2xl">
                    {contentUrl ? (
                      <img
                        src={contentUrl}
                        alt={material.judul}
                        style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                        className="max-w-full h-auto object-contain rounded-2xl origin-center shadow-lg"
                      />
                    ) : (
                      <div className="p-12 text-slate-400">Gambar tidak dapat dimuat.</div>
                    )}
                  </div>

                  {/* Keterangan Deskripsi Gambar */}
                  {(material.deskripsi || material.ringkasan) && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-emerald-300 block mb-1">📖 Catatan Gambar:</span>
                      {material.deskripsi || material.ringkasan}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 4. VIDEO (TAMPILKAN VIDEO ASLINYA)                            */}
              {/* ============================================================= */}
              {material.jenisMedia === 'video' && (
                <div className="w-full space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-sky-500/40 shadow-2xl aspect-video flex items-center justify-center">
                    {youtubeEmbed ? (
                      <iframe
                        src={youtubeEmbed}
                        title={material.judul}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-none"
                      />
                    ) : driveEmbed ? (
                      <iframe
                        src={driveEmbed}
                        title={material.judul}
                        allowFullScreen
                        className="w-full h-full border-none"
                      />
                    ) : contentUrl ? (
                      <video
                        src={contentUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        Browser Anda tidak mendukung pemutar video HTML5.
                      </video>
                    ) : (
                      <div className="p-8 text-center text-slate-400 space-y-3">
                        <Video className="w-12 h-12 text-sky-400 mx-auto" />
                        <p className="text-sm font-semibold">Tautan video edukasi langsung:</p>
                        {material.fileUrl && (
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg"
                          >
                            <span>Buka Video di Tab Baru</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-300 font-bold">
                      🎥 Video Pembelajaran Interaktif
                    </span>
                    <div className="flex items-center gap-2">
                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Tab Baru</span>
                        </a>
                      )}
                      {activeDownloadUrl && (
                        <a
                          href={activeDownloadUrl}
                          download={material.fileName || `${material.judul}.mp4`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Video</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {material.ringkasan && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-sky-300 block mb-1">📌 Rangkuman Isi Video:</span>
                      {material.ringkasan}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 5. AUDIO & REKAMAN SUARA GURU                                 */}
              {/* ============================================================= */}
              {material.jenisMedia === 'audio' && (
                <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#15102D] to-[#0A1424] border-2 border-purple-500/40 text-center space-y-5 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                    <Headphones className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{material.judul}</h4>
                    <p className="text-xs text-purple-300/80 mt-1">
                      Rekaman Penjelasan Guru • Dengarkan dengan earphone atau speaker
                    </p>
                  </div>

                  {contentUrl && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
                      <audio controls autoPlay src={contentUrl} className="w-full" />
                    </div>
                  )}

                  {activeDownloadUrl && (
                    <div className="pt-2">
                      <a
                        href={activeDownloadUrl}
                        download={material.fileName || `${material.judul}.mp3`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Berkas Audio (.mp3)</span>
                      </a>
                    </div>
                  )}

                  {material.ringkasan && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-purple-300 block mb-1">📜 Naskah Bacaan &amp; Catatan:</span>
                      {material.ringkasan}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* 6. TAUTAN WEB / DRIVE                                         */}
              {/* ============================================================= */}
              {material.jenisMedia === 'link' && (
                <div className="w-full max-w-2xl p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500/30 text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                    🔗
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{material.judul}</h4>
                    <p className="text-xs text-slate-400 mt-1">{material.deskripsi}</p>
                  </div>
                  {material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all hover:scale-102"
                    >
                      <span>Buka Tautan Pembelajaran</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* FOOTER BAR                                                          */}
        {/* =================================================================== */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 shrink-0">
          <span>Diunggah oleh: <strong className="text-slate-200">{material.uploadedBy || 'Guru Kelas'}</strong></span>
          <span className="font-mono text-[10px] text-slate-500">{material.fileName}</span>
        </div>
      </motion.div>
    </div>
  );
};
