import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Maximize2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Sliders, 
  Sparkles,
  RotateCcw,
  Check,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { PageOrientation, PaperSize, PageMargins, PDFLayoutOptions } from '../types';
import { 
  MARGIN_PRESETS, 
  PAPER_SIZE_OPTIONS, 
  savePDFLayout 
} from '../utils/printLayoutUtils';

interface PDFLayoutControlProps {
  layout: PDFLayoutOptions;
  onChange: (updated: PDFLayoutOptions) => void;
  compactMode?: boolean;
}

export const PDFLayoutControl: React.FC<PDFLayoutControlProps> = ({
  layout,
  onChange,
  compactMode = false,
}) => {
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Check matching preset on mount or when margins change
  useEffect(() => {
    const matched = MARGIN_PRESETS.find((p) => {
      if (p.id === 'custom') return false;
      return (
        p.margins.top === layout.margins.top &&
        p.margins.bottom === layout.margins.bottom &&
        p.margins.left === layout.margins.left &&
        p.margins.right === layout.margins.right
      );
    });
    if (matched) {
      setActivePreset(matched.id);
    } else {
      setActivePreset('custom');
    }
  }, [layout.margins]);

  const handleOrientationChange = (newOrientation: PageOrientation) => {
    const updated: PDFLayoutOptions = {
      ...layout,
      orientation: newOrientation,
    };
    onChange(updated);
    savePDFLayout(updated);
  };

  const handlePaperSizeChange = (newSize: PaperSize) => {
    const updated: PDFLayoutOptions = {
      ...layout,
      paperSize: newSize,
    };
    onChange(updated);
    savePDFLayout(updated);
  };

  const handlePresetSelect = (presetId: string) => {
    const found = MARGIN_PRESETS.find((p) => p.id === presetId);
    if (found && presetId !== 'custom') {
      const updated: PDFLayoutOptions = {
        ...layout,
        margins: { ...found.margins },
      };
      setActivePreset(presetId);
      onChange(updated);
      savePDFLayout(updated);
    } else {
      setActivePreset('custom');
    }
  };

  const handleManualMarginChange = (side: keyof PageMargins, value: number) => {
    const clamped = Math.max(5, Math.min(60, Number(value) || 0));
    const updated: PDFLayoutOptions = {
      ...layout,
      margins: {
        ...layout.margins,
        [side]: clamped,
      },
    };
    setActivePreset('custom');
    onChange(updated);
    savePDFLayout(updated);
  };

  const stepMargin = (side: keyof PageMargins, delta: number) => {
    handleManualMarginChange(side, layout.margins[side] + delta);
  };

  // Dimensions for live preview scaling
  const currentPaper = PAPER_SIZE_OPTIONS.find((p) => p.id === layout.paperSize) || PAPER_SIZE_OPTIONS[0];
  const paperW = layout.orientation === 'portrait' ? currentPaper.widthMm : currentPaper.heightMm;
  const paperH = layout.orientation === 'portrait' ? currentPaper.heightMm : currentPaper.widthMm;

  // Printable area dimensions in mm
  const printableWidth = Math.max(10, paperW - layout.margins.left - layout.margins.right);
  const printableHeight = Math.max(10, paperH - layout.margins.top - layout.margins.bottom);

  // Percentage calculations for SVG/CSS miniature
  const topPercent = Math.min(45, (layout.margins.top / paperH) * 100);
  const bottomPercent = Math.min(45, (layout.margins.bottom / paperH) * 100);
  const leftPercent = Math.min(45, (layout.margins.left / paperW) * 100);
  const rightPercent = Math.min(45, (layout.margins.right / paperW) * 100);

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. ORIENTASI HALAMAN (PORTRAIT VS LANDSCAPE) */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Orientasi Halaman:</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {layout.orientation === 'portrait' ? 'Tegak (Portrait)' : 'Mendatar (Landscape)'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Portrait Button */}
          <button
            type="button"
            onClick={() => handleOrientationChange('portrait')}
            className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
              layout.orientation === 'portrait'
                ? 'border-blue-600 bg-blue-50/90 text-blue-950 shadow-xs ring-1 ring-blue-400'
                : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700'
            }`}
          >
            <div
              className={`w-7 h-10 rounded border-2 flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                layout.orientation === 'portrait'
                  ? 'border-blue-600 bg-white text-blue-600'
                  : 'border-slate-400 bg-slate-100 text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black leading-tight">Portrait (Tegak)</span>
                {layout.orientation === 'portrait' && (
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[3]" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                Standar ATP, Modul Ajar &amp; Dokumen Naratif
              </p>
            </div>
          </button>

          {/* Landscape Button */}
          <button
            type="button"
            onClick={() => handleOrientationChange('landscape')}
            className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
              layout.orientation === 'landscape'
                ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-xs ring-1 ring-indigo-400'
                : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700'
            }`}
          >
            <div
              className={`w-10 h-7 rounded border-2 flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                layout.orientation === 'landscape'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-slate-400 bg-slate-100 text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black leading-tight">Landscape (Mendatar)</span>
                {layout.orientation === 'landscape' && (
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 stroke-[3]" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                Ideal untuk Tabel Lebar (Promes, KKTP, Analisis CP)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. UKURAN KERTAS (A4, F4 / FOLIO, LETTER, LEGAL) */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Ukuran Kertas Cetak:</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500">{currentPaper.dims}</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PAPER_SIZE_OPTIONS.map((paper) => {
            const isSelected = layout.paperSize === paper.id;
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => handlePaperSizeChange(paper.id)}
                className={`px-2.5 py-2 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs font-black'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs'
                }`}
              >
                <div className="text-xs">{paper.name}</div>
                <div className={`text-[9px] ${isSelected ? 'text-indigo-100 font-medium' : 'text-slate-400 font-normal'}`}>
                  {paper.dims}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PENGATURAN MARGIN MANUAL & PRESET */}
      <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pengaturan Margin Halaman:</span>
          </label>

          <span className="text-[10px] text-slate-500 font-medium italic">
            Satuan milimeter (10 mm = 1 cm)
          </span>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap gap-1.5">
          {MARGIN_PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                title={p.description}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 border-amber-700 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                {p.badge}
              </button>
            );
          })}
        </div>

        {/* Grid 4 Margin Stepper Inputs & Live Miniature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-center">
          {/* 4 Manual Margin Steppers (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-2">
            {/* Top Margin */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-blue-600" />
                  <span>Atas (Top)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  {(layout.margins.top / 10).toFixed(1)} cm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMargin('top', -1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Kurangi 1 mm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={layout.margins.top}
                  onChange={(e) => handleManualMarginChange('top', Number(e.target.value))}
                  className="w-full text-center py-0.5 px-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                />
                <span className="text-[10px] text-slate-500 font-bold pr-0.5">mm</span>
                <button
                  type="button"
                  onClick={() => stepMargin('top', 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Tambah 1 mm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bottom Margin */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-blue-600" />
                  <span>Bawah (Bottom)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  {(layout.margins.bottom / 10).toFixed(1)} cm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMargin('bottom', -1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Kurangi 1 mm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={layout.margins.bottom}
                  onChange={(e) => handleManualMarginChange('bottom', Number(e.target.value))}
                  className="w-full text-center py-0.5 px-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                />
                <span className="text-[10px] text-slate-500 font-bold pr-0.5">mm</span>
                <button
                  type="button"
                  onClick={() => stepMargin('bottom', 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Tambah 1 mm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Left Margin */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 text-indigo-600" />
                  <span>Kiri (Left / Jilid)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  {(layout.margins.left / 10).toFixed(1)} cm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMargin('left', -1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Kurangi 1 mm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={layout.margins.left}
                  onChange={(e) => handleManualMarginChange('left', Number(e.target.value))}
                  className="w-full text-center py-0.5 px-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                />
                <span className="text-[10px] text-slate-500 font-bold pr-0.5">mm</span>
                <button
                  type="button"
                  onClick={() => stepMargin('left', 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Tambah 1 mm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Right Margin */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-indigo-600" />
                  <span>Kanan (Right)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  {(layout.margins.right / 10).toFixed(1)} cm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMargin('right', -1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Kurangi 1 mm"
                >
                  -
                </button>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={layout.margins.right}
                  onChange={(e) => handleManualMarginChange('right', Number(e.target.value))}
                  className="w-full text-center py-0.5 px-1 text-xs font-bold text-slate-900 border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200"
                />
                <span className="text-[10px] text-slate-500 font-bold pr-0.5">mm</span>
                <button
                  type="button"
                  onClick={() => stepMargin('right', 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center border border-slate-300 cursor-pointer"
                  title="Tambah 1 mm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Miniature Sheet Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-2.5 bg-slate-100/90 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Simulasi Lembar Cetak</span>
            </div>

            {/* Visual Paper Sheet */}
            <div
              className={`bg-white rounded border-2 border-slate-400 shadow-sm relative transition-all duration-200 flex items-center justify-center overflow-hidden ${
                layout.orientation === 'portrait'
                  ? 'w-24 h-32'
                  : 'w-34 h-24'
              }`}
            >
              {/* Margins Boundary Box */}
              <div
                className="absolute border border-dashed border-blue-500 bg-blue-50/50 flex flex-col items-center justify-center transition-all duration-200 p-0.5 overflow-hidden"
                style={{
                  top: `${topPercent}%`,
                  bottom: `${bottomPercent}%`,
                  left: `${leftPercent}%`,
                  right: `${rightPercent}%`,
                }}
              >
                {/* Simulated Content lines */}
                <div className="w-full space-y-0.5 opacity-60">
                  <div className="h-1 bg-slate-400 rounded-xs w-3/4 mx-auto" />
                  <div className="h-0.5 bg-slate-300 rounded-xs w-full" />
                  <div className="h-0.5 bg-slate-300 rounded-xs w-5/6" />
                  <div className="h-0.5 bg-slate-300 rounded-xs w-4/5" />
                </div>
              </div>

              {/* Rulers indicator pills */}
              <div className="absolute top-0.5 left-1 text-[7px] font-mono font-bold text-slate-600 bg-white/90 px-0.5 rounded">
                T:{layout.margins.top}
              </div>
              <div className="absolute bottom-0.5 right-1 text-[7px] font-mono font-bold text-slate-600 bg-white/90 px-0.5 rounded">
                B:{layout.margins.bottom}
              </div>
            </div>

            {/* Printable Width & Height specs */}
            <div className="mt-2 text-center text-[10px] text-slate-600 font-medium">
              Area Bersih:{' '}
              <span className="font-bold text-slate-900 font-mono">
                {printableWidth} × {printableHeight} mm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
