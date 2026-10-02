import { PageOrientation, PaperSize, PageMargins, PDFLayoutOptions } from '../types';

export interface MarginPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  margins: PageMargins;
}

export const MARGIN_PRESETS: MarginPreset[] = [
  {
    id: 'skripsi',
    name: 'Standar Skripsi / KTI (4-3-3-3 cm)',
    badge: 'Akademis 4-3-3-3',
    description: 'Kiri: 40mm, Atas: 30mm, Kanan: 30mm, Bawah: 30mm',
    margins: { top: 30, bottom: 30, left: 40, right: 30 },
  },
  {
    id: 'dinas',
    name: 'Standar Dinas / Resmi (3-2-2-2 cm)',
    badge: 'Kedinasan 3-2-2-2',
    description: 'Kiri: 30mm, Atas: 20mm, Kanan: 20mm, Bawah: 20mm',
    margins: { top: 20, bottom: 20, left: 30, right: 20 },
  },
  {
    id: 'normal',
    name: 'Normal Standar (20 mm)',
    badge: 'Simetris 20mm',
    description: 'Semua sisi 20mm seimbang',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  },
  {
    id: 'kompak',
    name: 'Kompak / Hemat Kertas (10-12 mm)',
    badge: 'Hemat Kertas',
    description: 'Kiri: 12mm, Atas: 10mm, Kanan: 12mm, Bawah: 10mm',
    margins: { top: 10, bottom: 10, left: 12, right: 10 },
  },
  {
    id: 'custom',
    name: 'Kustom / Manual',
    badge: 'Bebas Atur',
    description: 'Atur milimeter (mm) manual untuk setiap sisi',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  },
];

export const PAPER_SIZE_OPTIONS: Array<{ id: PaperSize; name: string; dims: string; widthMm: number; heightMm: number }> = [
  { id: 'a4', name: 'A4', dims: '210 × 297 mm', widthMm: 210, heightMm: 297 },
  { id: 'f4', name: 'F4 / Folio', dims: '215 × 330 mm', widthMm: 215, heightMm: 330 },
  { id: 'letter', name: 'Letter', dims: '216 × 279 mm', widthMm: 216, heightMm: 279 },
  { id: 'legal', name: 'Legal', dims: '216 × 356 mm', widthMm: 216, heightMm: 356 },
];

export const DEFAULT_PDF_LAYOUT: PDFLayoutOptions = {
  orientation: 'portrait',
  paperSize: 'a4',
  margins: { top: 20, bottom: 20, left: 25, right: 20 },
};

export const DEFAULT_LANDSCAPE_PDF_LAYOUT: PDFLayoutOptions = {
  orientation: 'landscape',
  paperSize: 'a4',
  margins: { top: 15, bottom: 15, left: 14, right: 14 },
};

const STORAGE_KEY = 'sipartan_user_pdf_layout_pref';

/**
 * Load user's saved PDF layout preference from localStorage or fallback to default
 */
export function loadSavedPDFLayout(fallbackOrientation?: PageOrientation): PDFLayoutOptions {
  const isLandscape = fallbackOrientation === 'landscape';
  const baseLayout = isLandscape ? DEFAULT_LANDSCAPE_PDF_LAYOUT : DEFAULT_PDF_LAYOUT;

  if (typeof window === 'undefined') {
    return {
      ...baseLayout,
      orientation: fallbackOrientation || baseLayout.orientation,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If document needs landscape, and saved margins are the default portrait margins (left: 25, right: 20),
      // adjust to safe landscape margins so tables are never cut off.
      const isDefaultPortraitMargin =
        (Number(parsed.margins?.left) === 25 || !parsed.margins?.left) &&
        (Number(parsed.margins?.right) === 20 || !parsed.margins?.right);

      const resolvedMargins = isLandscape && isDefaultPortraitMargin
        ? { top: 15, bottom: 15, left: 14, right: 14 }
        : {
            top: Number(parsed.margins?.top) || (isLandscape ? 15 : 20),
            bottom: Number(parsed.margins?.bottom) || (isLandscape ? 15 : 20),
            left: Number(parsed.margins?.left) || (isLandscape ? 14 : 25),
            right: Number(parsed.margins?.right) || (isLandscape ? 14 : 20),
          };

      return {
        orientation: fallbackOrientation || parsed.orientation || (isLandscape ? 'landscape' : 'portrait'),
        paperSize: parsed.paperSize || 'a4',
        margins: resolvedMargins,
      };
    }
  } catch (err) {
    console.warn('Failed to load saved PDF layout preference:', err);
  }

  return {
    ...baseLayout,
    orientation: fallbackOrientation || baseLayout.orientation,
  };
}

/**
 * Save user's PDF layout preference into localStorage
 */
export function savePDFLayout(options: PDFLayoutOptions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch (err) {
    console.warn('Failed to save PDF layout preference:', err);
  }
}

/**
 * Injects or updates dynamic @media print @page CSS into the document head
 * so browser window.print() respects the selected orientation and manual margins.
 */
export function applyPrintPageLayout(layout: PDFLayoutOptions): void {
  if (typeof document === 'undefined') return;
  const styleId = 'sipartan-dynamic-print-layout';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const paperSizeCss = layout.paperSize === 'f4' ? '215mm 330mm' : layout.paperSize.toUpperCase();
  const orientationCss = layout.orientation;
  const { top, bottom, left, right } = layout.margins;

  styleEl.innerHTML = `
    @media print {
      @page {
        size: ${paperSizeCss} ${orientationCss} !important;
        margin: ${top}mm ${right}mm ${bottom}mm ${left}mm !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-container {
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: none !important;
      }
    }
  `;
}

/**
 * Apply layout to print styling and immediately trigger window.print()
 */
export function executePrintWithLayout(layout: PDFLayoutOptions): void {
  applyPrintPageLayout(layout);
  savePDFLayout(layout);
  setTimeout(() => {
    window.print();
  }, 60);
}
