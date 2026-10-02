import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Presentation,
  Headphones,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FolderOpen,
  FolderPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearningMediaType, SubjectFolder } from '../types';
import {
  KAMAR_MAPEL_LIST,
  JENIS_MEDIA_LIST,
  uploadLearningMaterial,
} from '../services/learningMaterialService';
import { sounds } from '../utils/audioEffects';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (materialName: string) => void;
  currentMataPelajaran?: string;
  currentKelas?: string;
  currentFolderId?: string;
  availableFolders?: SubjectFolder[];
  onRequestCreateFolder?: (subject: string) => void;
}

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentMataPelajaran,
  currentKelas = '4',
  currentFolderId,
  availableFolders = [],
  onRequestCreateFolder,
}) => {
  const [mataPelajaran, setMataPelajaran] = useState<string>(
    currentMataPelajaran && currentMataPelajaran !== 'Semua Mata Pelajaran'
      ? currentMataPelajaran
      : 'IPAS (Ilmu Pengetahuan Alam & Sosial)'
  );
  const [fase, setFase] = useState<'Fase A' | 'Fase B' | 'Fase C'>('Fase B');
  const [kelas, setKelas] = useState<string>(currentKelas);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || '');
  const [jenisMedia, setJenisMedia] = useState<LearningMediaType>('pdf');
  const [judul, setJudul] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [durasiVideo, setDurasiVideo] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedMaterialName, setUploadedMaterialName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentMataPelajaran && currentMataPelajaran !== 'Semua Mata Pelajaran') {
      setMataPelajaran(currentMataPelajaran);
    }
  }, [currentMataPelajaran]);

  useEffect(() => {
    if (currentFolderId) {
      setSelectedFolderId(currentFolderId);
    }
  }, [currentFolderId]);

  if (!isOpen) return null;

  // Filter folder yang sesuai dengan mata pelajaran yang dipilih
  const filteredFoldersForSubject = availableFolders.filter(
    (f) => f.subject === mataPelajaran
  );

  const currentMediaConfig = JENIS_MEDIA_LIST.find((m) => m.type === jenisMedia) || JENIS_MEDIA_LIST[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg('');

      // Auto-detect format media
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') {
        setJenisMedia('pdf');
      } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        setJenisMedia('gambar');
      } else if (['ppt', 'pptx'].includes(ext)) {
        setJenisMedia('ppt');
      } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
        setJenisMedia('video');
      } else if (['mp3', 'wav', 'm4a'].includes(ext)) {
        setJenisMedia('audio');
      }

      // Auto-fill title if empty
      if (!judul) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setJudul(cleanName);
      }
    }
  };

  const resetForm = () => {
    setJudul('');
    setDeskripsi('');
    setSelectedFile(null);
    setFileUrl('');
    setDurasiVideo('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadedMaterialName('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setErrorMsg('Silakan masukkan judul bahan ajar');
      return;
    }

    if (!selectedFile && !fileUrl.trim()) {
      setErrorMsg('Pilih file (PDF, JPG, PNG, PPT, atau MP4) dari komputer/HP atau masukkan tautan');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(15);
    setErrorMsg('');

    const matchedFolder = availableFolders.find((f) => f.id === selectedFolderId);

    try {
      await uploadLearningMaterial({
        judul,
        deskripsi,
        mataPelajaran,
        folderId: selectedFolderId || undefined,
        folderName: matchedFolder ? matchedFolder.name : undefined,
        fase,
        kelas,
        jenisMedia,
        uploadedBy: 'Bapak/Ibu Guru',
        durasiVideo: durasiVideo.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        file: selectedFile,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setUploadedMaterialName(judul);
      setUploadProgress(100);
      setUploadStatus('success');
      sounds.playSuccess();
      onSuccess(judul);
    } catch (err: any) {
      console.error('Upload gagal:', err);
      setUploadStatus('error');
      setErrorMsg(err.message || 'Gagal mengunggah bahan ajar. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStepText = (pct: number) => {
    if (pct < 35) return '1/3 Menyiapkan berkas asli & memori lokal...';
    if (pct < 85) return '2/3 Mengunggah berkas ke Cloud Storage & sinkronisasi...';
    if (pct < 100) return '3/3 Menyimpan katalog bahan ajar & verifikasi akses murid...';
    return '✅ 100% Berhasil! Bahan ajar aktif & siap dipelajari.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#0F1D36] to-[#0B1528] rounded-3xl border-2 border-blue-500/40 shadow-2xl shadow-blue-500/10 overflow-hidden my-6 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Ruang Guru • Arsip Digital
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Firebase Storage &amp; Offline
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Unggah Bahan Ajar &amp; Media Pembelajaran
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Success Screen */}
        {uploadStatus === 'success' ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ✅ Berhasil Diunggah &amp; Tersimpan
              </span>
              <h4 className="text-2xl font-black text-white">
                Bahan Ajar Berhasil Dipublikasikan!
              </h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Materi <span className="text-amber-300 font-bold">"{uploadedMaterialName}"</span> telah tersimpan di Firebase Storage &amp; Database dan siap langsung dibuka serta dipelajari oleh murid di Ruang Murid tanpa perlu diunduh.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mata Pelajaran:</span>
                <span className="font-bold text-blue-300">{mataPelajaran}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format Bahan:</span>
                <span className="font-bold text-amber-300 uppercase">{jenisMedia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Akses Murid:</span>
                <span className="font-bold text-emerald-400">Langsung Buka &amp; Baca di Aplikasi</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Selesai &amp; Buka Kamar Bahan Ajar
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                + Unggah Bahan Ajar Lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center gap-2.5 text-rose-300 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Kamar Mata Pelajaran & Folder Mapel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                1. Pilih Mata Pelajaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={mataPelajaran}
                onChange={(e) => {
                  setMataPelajaran(e.target.value);
                  setSelectedFolderId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-blue-400 focus:outline-none"
              >
                {KAMAR_MAPEL_LIST.filter((m) => m !== 'Semua Mata Pelajaran').map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Folder Mapel (Opsional)
                </label>
                {onRequestCreateFolder && (
                  <button
                    type="button"
                    onClick={() => onRequestCreateFolder(mataPelajaran)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ Folder Baru</span>
                  </button>
                )}
              </div>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-blue-400 focus:outline-none"
              >
                <option value="">📁 Root / Tanpa Folder Khusus</option>
                {filteredFoldersForSubject.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.icon || '📁'} {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fase & Kelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Fase Pembelajaran</label>
              <select
                value={fase}
                onChange={(e) => setFase(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-400 focus:outline-none"
              >
                <option value="Fase A">Fase A (Kelas 1 - 2)</option>
                <option value="Fase B">Fase B (Kelas 3 - 4)</option>
                <option value="Fase C">Fase C (Kelas 5 - 6)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <option key={k} value={String(k)}>
                    Kelas {k} SD
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Jenis Media yang Diunggah */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
              2. Pilih Jenis Format Media <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {JENIS_MEDIA_LIST.map((item) => {
                const isSelected = jenisMedia === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setJenisMedia(item.type);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-400 shadow-md shadow-blue-500/20 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">
                        {item.type === 'pdf' && '📄'}
                        {item.type === 'gambar' && '🖼️'}
                        {item.type === 'ppt' && '📊'}
                        {item.type === 'video' && '🎥'}
                        {item.type === 'audio' && '🎧'}
                        {item.type === 'link' && '🔗'}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.acceptExtensions || 'Tautan web'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Judul Bahan Ajar */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              3. Beri Nama / Judul Bahan Ajar <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Modul LKPD Bagian Tumbuhan & Fungsinya / Video Rantai Makanan"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* 4. Deskripsi / Petunjuk untuk Murid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Deskripsi Singkat / Petunjuk Belajar Murid (Opsional)
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={2}
              placeholder="Jelaskan ringkasan materi atau apa yang perlu dipelajari siswa dari bahan ini..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Khusus Video: Durasi Video */}
          {jenisMedia === 'video' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Perkiraan Durasi Video (Opsional, contoh: 05:30)
              </label>
              <input
                type="text"
                value={durasiVideo}
                onChange={(e) => setDurasiVideo(e.target.value)}
                placeholder="05:30"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}

          {/* 5. Upload File Media (Drag & Drop / Browse) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              5. Pilih File dari Komputer/HP <span className="text-rose-400">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={currentMediaConfig.acceptExtensions}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                selectedFile
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-blue-400/60 bg-slate-900/50 hover:bg-slate-900/80'
              }`}
            >
              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-300 mt-0.5">
                      Ukuran: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 underline">
                    Klik untuk mengganti file
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Klik untuk memilih file {currentMediaConfig.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Format didukung: {currentMediaConfig.acceptExtensions || 'Semua file media'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Opsi Tautan Eksternal / Google Drive / Video Link */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Atau Masukkan Tautan File / Google Drive / YouTube (Opsional)</span>
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau https://youtube.com/..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Progress Bar Saat Upload dengan Feedback Jelas */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-blue-950/80 border-2 border-blue-400 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>{getStepText(uploadProgress)}</span>
                </span>
                <span className="text-amber-400 font-mono font-black text-sm">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(uploadProgress, 10)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 text-center font-medium">
                Sedang memproses... Harap tunggu sejenak hingga selesai.
              </p>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200/90 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Langsung Diakses &amp; Dibaca Murid Tanpa Download:</span>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Bahan ajar yang Anda unggah langsung dapat dibuka, dipelajari, dan dibaca per slide oleh murid di dalam aplikasi tanpa membebani memori unduhan murid!
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah ({Math.round(uploadProgress)}%)...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Unggah &amp; Publikasikan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </motion.div>
    </div>
  );
};
