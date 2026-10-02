import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  MapPin,
  Calendar,
  Save,
  PenLine,
  Layers,
  Leaf,
  Lock,
  ShieldAlert,
  GraduationCap,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { SchoolIdentity, PageOrientation, PDFLayoutOptions } from '../types';
import { getClassesForFase } from '../utils/classFilterUtils';
import { isWordExportDisabled } from '../services/accessCodeService';
import { PDFLayoutControl } from './PDFLayoutControl';
import { loadSavedPDFLayout } from '../utils/printLayoutUtils';

export interface ExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  exportType: 'WORD' | 'PDF' | 'EXCEL' | 'CSV';
  documentTitle: string;
  onConfirm: (
    tempat: string,
    tanggal: string,
    selectedKelas?: string,
    layoutOptions?: PDFLayoutOptions,
    tahunPelajaran?: string
  ) => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  availableClasses?: string[];
  defaultSelectedKelas?: string;
  itemCountsByClass?: { all: number; [kelas: string]: number };
  defaultOrientation?: PageOrientation;
  showClassSelector?: boolean;
}

export const ExportConfirmModal: React.FC<ExportConfirmModalProps> = ({
  isOpen,
  onClose,
  identitas,
  exportType,
  documentTitle,
  onConfirm,
  onUpdateIdentitas,
  availableClasses,
  defaultSelectedKelas,
  itemCountsByClass,
  defaultOrientation,
  showClassSelector = true,
}) => {
  // Determine available classes based on Fase if not explicitly passed
  const classList = availableClasses && availableClasses.length > 0
    ? availableClasses
    : getClassesForFase(identitas.fase);

  // Selected class state: 'all' or specific class e.g. '5', '6'
  const [selectedKelas, setSelectedKelas] = useState<string>(defaultSelectedKelas || 'all');

  // PDF Layout state
  const [pdfLayout, setPdfLayout] = useState<PDFLayoutOptions>(() =>
    loadSavedPDFLayout(defaultOrientation || 'portrait')
  );

  // Default values for Titimangsa
  const [tempat, setTempat] = useState<string>(
    identitas.tempatPenetapan || 
    (identitas.namaSatuanPendidikan ? identitas.namaSatuanPendidikan.replace(/SD Negeri |SDN |SD |SMP |SMA |SMK /, '') : 'Fatubai')
  );
  
  const [tanggal, setTanggal] = useState<string>(
    identitas.tanggalPenetapan || 
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  const [tahunPelajaran, setTahunPelajaran] = useState<string>(
    identitas.tahunPelajaran || '2026/2027'
  );

  const [wordBlockedError, setWordBlockedError] = useState<string | null>(null);
  const isWordDisabled = exportType === 'WORD' && isWordExportDisabled();

  React.useEffect(() => {
    if (isOpen) {
      setWordBlockedError(null);
      setSelectedKelas(defaultSelectedKelas || 'all');
      setPdfLayout(loadSavedPDFLayout(defaultOrientation || 'portrait'));
      setTempat(
        identitas.tempatPenetapan || 
        (identitas.namaSatuanPendidikan ? identitas.namaSatuanPendidikan.replace(/SD Negeri |SDN |SD |SMP |SMA |SMK /, '') : 'Fatubai')
      );
      setTanggal(
        identitas.tanggalPenetapan || 
        new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      );
      setTahunPelajaran(identitas.tahunPelajaran || '2026/2027');
    }
  }, [
    isOpen,
    defaultSelectedKelas,
    defaultOrientation,
    identitas.tempatPenetapan,
    identitas.tanggalPenetapan,
    identitas.tahunPelajaran,
    identitas.namaSatuanPendidikan,
  ]);

  if (!isOpen) return null;

  const resolvedTempat = tempat.trim() || identitas.tempatPenetapan || 'Fatubai';
  const resolvedTanggal = tanggal.trim() || identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const resolvedTP = tahunPelajaran.trim() || identitas.tahunPelajaran || '2026/2027';

  const handleSaveOnly = () => {
    if (onUpdateIdentitas) {
      onUpdateIdentitas({
        ...identitas,
        tempatPenetapan: resolvedTempat,
        tanggalPenetapan: resolvedTanggal,
        tahunPelajaran: resolvedTP,
        kelas: (showClassSelector && classList.length > 0)
          ? (selectedKelas === 'all' ? (classList.length > 1 ? `${classList[0]} & ${classList[1]}` : identitas.kelas) : selectedKelas)
          : identitas.kelas,
      });
      onClose();
    }
  };

  const handleDownload = () => {
    if (isWordDisabled) {
      const msg = 'unduhan word di nonaktifkan oleh admin! (hal ini mencegah pengeditan data via word!)';
      setWordBlockedError(msg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sipartan_word_export_blocked', {
            detail: { message: msg },
          })
        );
      }
      return;
    }
    if (onUpdateIdentitas) {
      onUpdateIdentitas({
        ...identitas,
        tempatPenetapan: resolvedTempat,
        tanggalPenetapan: resolvedTanggal,
        tahunPelajaran: resolvedTP,
        kelas: (showClassSelector && classList.length > 0)
          ? (selectedKelas === 'all' ? (classList.length > 1 ? `${classList[0]} & ${classList[1]}` : identitas.kelas) : selectedKelas)
          : identitas.kelas,
      });
    }
    onConfirm(
      resolvedTempat,
      resolvedTanggal,
      selectedKelas,
      exportType === 'PDF' ? pdfLayout : undefined,
      resolvedTP
    );
  };

  const labelKelasTarget =
    showClassSelector && classList.length > 0
      ? selectedKelas === 'all'
        ? `Semua (${classList.join(' & ')})`
        : `Kelas ${selectedKelas}`
      : identitas.kelas ? `Kelas ${identitas.kelas}` : '';

  const getFormatBadgeLabel = () => {
    switch (exportType) {
      case 'WORD':
        return 'Word (.doc)';
      case 'PDF':
        return 'PDF Resmi';
      case 'EXCEL':
        return 'Excel / Spreadsheet';
      case 'CSV':
        return 'CSV File';
    }
  };

  const getHeaderGradient = () => {
    switch (exportType) {
      case 'WORD':
        return 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 border-blue-600 shadow-blue-900/20';
      case 'PDF':
        return 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-rose-600 shadow-rose-900/20';
      case 'EXCEL':
      case 'CSV':
        return 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 border-emerald-600 shadow-emerald-900/20';
    }
  };

  const getDownloadButtonColor = () => {
    switch (exportType) {
      case 'WORD':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'PDF':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'EXCEL':
      case 'CSV':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
  };

  // Preset suggestions for places
  const tempatSuggestions = Array.from(
    new Set([
      identitas.tempatPenetapan,
      identitas.namaSatuanPendidikan?.replace(/SD Negeri |SDN |SD |SMP |SMA |SMK /, ''),
      identitas.kabupaten,
      'Fatubai',
      'Kefamenanu',
      'Kupang',
    ].filter((t): t is string => Boolean(t && t.trim().length > 1)))
  );

  // Preset suggestions for academic years
  const tahunPelajaranOptions = ['2026/2027', '2025/2026', '2027/2028', '2024/2025'];

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border-2 my-auto max-h-[94vh] flex flex-col ${
          exportType === 'WORD'
            ? 'border-blue-600 shadow-blue-900/20'
            : exportType === 'PDF'
            ? 'border-rose-600 shadow-rose-900/20'
            : 'border-emerald-600 shadow-emerald-900/20'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-download-title"
      >
        {/* Colored Header with Frame Trim */}
        <div className={`px-4 py-3 text-white flex items-center justify-between shrink-0 ${getHeaderGradient()}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs border border-white/30">
              {exportType === 'WORD' && <Download className="w-4 h-4 text-white" />}
              {exportType === 'PDF' && <FileText className="w-4 h-4 text-white" />}
              {(exportType === 'EXCEL' || exportType === 'CSV') && <FileSpreadsheet className="w-4 h-4 text-white" />}
            </div>
            <div className="min-w-0">
              <h2 id="confirm-download-title" className="text-sm font-black tracking-tight leading-tight truncate">
                Konfirmasi Sebelum Unduh Dokumen
              </h2>
              <p className="text-[11px] text-white/90 font-medium truncate">
                {documentTitle} • {getFormatBadgeLabel()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Form Body with Tempat, Tanggal, Tahun Pelajaran & Class Selector */}
        <div className="p-4 bg-gradient-to-b from-slate-50/80 to-white space-y-3.5 overflow-y-auto flex-1">
          {/* Official Guidance Note */}
          <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-[11px] leading-relaxed flex items-start gap-2 shadow-2xs">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-indigo-900">Validasi Titimangsa Resmi:</span> Pastikan <strong>Tempat</strong>, <strong>Tanggal</strong>, dan <strong>Tahun Pelajaran</strong> sesuai agar dokumen sah dan relevan secara administrasi kedinasan.
            </div>
          </div>

          {/* Warning Banner if Word export is disabled by admin */}
          {isWordDisabled && (
            <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-amber-950 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>unduhan word di nonaktifkan oleh admin!</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                (hal ini mencegah pengeditan data via word!). Dokumen tidak dapat diunduh dalam format Word (.doc). Silakan gunakan format <strong>PDF Resmi</strong> yang sah dan siap cetak.
              </p>
            </div>
          )}

          {wordBlockedError && (
            <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-950 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">{wordBlockedError}</p>
              </div>
            </div>
          )}

          {/* 1. Tempat Penetapan (Wajib) */}
          <div className="space-y-1 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <label htmlFor="input-tempat" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Tempat Penetapan (Kota / Daerah)</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Titimangsa</span>
            </div>
            <input
              id="input-tempat"
              type="text"
              required
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              placeholder="Contoh: Fatubai, Kefamenanu, Kupang"
              className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50/60 rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
            {tempatSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[10px] text-slate-500 font-medium">Cepat:</span>
                {tempatSuggestions.slice(0, 4).map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => setTempat(ts)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                      tempat === ts
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {ts}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Tanggal Penetapan (Wajib) */}
          <div className="space-y-1 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <label htmlFor="input-tanggal" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tanggal Penetapan Dokumen</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Titimangsa</span>
            </div>
            <input
              id="input-tanggal"
              type="text"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              placeholder="Contoh: 14 Juli 2026 atau 5 Januari 2026"
              className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50/60 rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() =>
                  setTanggal(
                    new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  )
                }
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setTanggal('14 Juli 2026')}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Awal Sem. Ganjil (14 Juli 2026)
              </button>
              <button
                type="button"
                onClick={() => setTanggal('5 Januari 2026')}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Awal Sem. Genap (5 Jan 2026)
              </button>
            </div>
          </div>

          {/* 3. Tahun Pelajaran (Wajib) */}
          <div className="space-y-1 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <label htmlFor="input-tp" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tahun Pelajaran / Tahun Ajaran</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Tahun Akademik</span>
            </div>
            <input
              id="input-tp"
              type="text"
              required
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              placeholder="Contoh: 2026/2027"
              className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50/60 rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all shadow-2xs"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] text-slate-500 font-medium">Pilihan:</span>
              {tahunPelajaranOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTahunPelajaran(opt)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    tahunPelajaran === opt
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Class Selection Filter (Fase vs Single Class) if applicable */}
          {showClassSelector && classList && classList.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Pilih Tingkat Kelas Dokumen:</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-600" />
                  Hemat Kertas
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-tight">
                Pilih kelas yang Anda ampu untuk mengurangi jumlah kertas cetak, atau unduh fase penuh:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* Option All */}
                <button
                  type="button"
                  onClick={() => setSelectedKelas('all')}
                  className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedKelas === 'all'
                      ? 'border-blue-600 bg-blue-50/90 text-blue-950 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">Semua Kelas</span>
                    {selectedKelas === 'all' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Fase Penuh ({classList.join(' & ')})
                  </span>
                  {itemCountsByClass && itemCountsByClass.all !== undefined && (
                    <span className="mt-1 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 w-fit">
                      {itemCountsByClass.all} butir
                    </span>
                  )}
                </button>

                {/* Individual Classes */}
                {classList.map((cls) => {
                  const count = itemCountsByClass ? itemCountsByClass[cls] : undefined;
                  const isSelected = selectedKelas === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedKelas(cls)}
                      className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black">Kelas {cls} Saja</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-800 font-bold mt-0.5">
                        Khusus Kelas {cls}
                      </span>
                      {count !== undefined && (
                        <span className="mt-1 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-900 w-fit">
                          {count} butir
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedKelas !== 'all' && (
                <div className="mt-1 text-[10px] font-bold text-emerald-900 bg-emerald-50 p-1.5 rounded border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Dokumen akan disesuaikan khusus <strong>Kelas {selectedKelas}</strong> saja.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5. Kontrol Tata Letak PDF Canggih (Orientasi & Margin Manual) */}
          {exportType === 'PDF' && (
            <div className="pt-1">
              <PDFLayoutControl
                layout={pdfLayout}
                onChange={setPdfLayout}
                compactMode={true}
              />
            </div>
          )}
        </div>

        {/* Compact Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {onUpdateIdentitas && (
              <button
                type="button"
                onClick={handleSaveOnly}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="Simpan tempat, tanggal & tahun pelajaran ke identitas sekolah"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className={`px-3.5 py-2 text-xs font-black rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 ${getDownloadButtonColor()}`}
            >
              {exportType === 'WORD' && <Download className="w-3.5 h-3.5" />}
              {exportType === 'PDF' && <FileText className="w-3.5 h-3.5" />}
              {(exportType === 'EXCEL' || exportType === 'CSV') && <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span>
                Konfirmasi &amp; Unduh {getFormatBadgeLabel()} {labelKelasTarget ? `(${labelKelasTarget})` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


