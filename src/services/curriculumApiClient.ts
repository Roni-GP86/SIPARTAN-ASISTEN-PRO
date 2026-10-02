import {
  generateMultiElementTPFallback,
  generatePedagogicalATPFallback,
  generatePedagogicalKKTPFallback,
  generatePedagogicalModulFallback,
} from '../../server/curriculumEngine';
import { SchoolIdentity, TPItem, ATPDocument, KKTPDocument, BedahElemenRow } from '../types';

export interface SelectedElementItem {
  id: string;
  elemen: string;
  capaianPembelajaran: string;
  isSelected: boolean;
}

export interface TPGenerationResult {
  elemenRows: BedahElemenRow[];
  daftarTP: TPItem[];
  rasionalAnalisis: string;
  isClientFallback: boolean;
}

/**
 * Robust API helper with automatic client-side pedagogical fallback.
 * Works seamlessly on Netlify, static hosts, serverless, and local/Cloud Run environments.
 */

export async function clientGenerateTP(
  identitas: SchoolIdentity,
  selectedElements: SelectedElementItem[],
  preferensiTambahan: string = ''
): Promise<TPGenerationResult> {
  const activeSelected = selectedElements.filter((e) => e.isSelected && e.capaianPembelajaran.trim());

  // 1. Try server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for serverless/network

    const response = await fetch('/api/generate-tp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identitas,
        selectedElements: activeSelected,
        preferensiTambahan,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && (data.elemenRows || data.daftarTP)) {
        return {
          elemenRows: data.elemenRows || [],
          daftarTP: data.daftarTP || [],
          rasionalAnalisis: data.rasionalAnalisis || '',
          isClientFallback: false,
        };
      }
    } else {
      console.warn(
        `[Curriculum Engine] /api/generate-tp merespons status ${response.status} (${contentType}). Mengaktifkan Pedagogical Engine Client-Side (Netlify/Static Mode).`
      );
    }
  } catch (err) {
    console.warn('[Curriculum Engine] Backend server tidak terjangkau (Netlify/Offline). Menggunakan Pedagogical Engine Client-Side:', err);
  }

  // 2. Client-side Pedagogical Engine (Netlify / Static / Offline mode)
  const fallback = generateMultiElementTPFallback(identitas, activeSelected, preferensiTambahan);
  return {
    elemenRows: fallback.elemenRows || [],
    daftarTP: fallback.daftarTP || [],
    rasionalAnalisis: fallback.rasionalAnalisis || '',
    isClientFallback: true,
  };
}

export async function clientGenerateATP(
  identitas: SchoolIdentity,
  elemen: string,
  capaianPembelajaran: string,
  elemenList: Array<{ elemen: string; capaianPembelajaran: string }>,
  tpList: TPItem[],
  preferensiTambahan: string = ''
): Promise<{ data: any; isClientFallback: boolean }> {
  // 1. Try server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/generate-atp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identitas,
        elemen,
        capaianPembelajaran,
        elemenList,
        tpList,
        preferensiTambahan,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.atpList) {
        return { data, isClientFallback: false };
      }
    } else {
      console.warn(
        `[Curriculum Engine] /api/generate-atp merespons status ${response.status}. Mengaktifkan Pedagogical Engine Client-Side.`
      );
    }
  } catch (err) {
    console.warn('[Curriculum Engine] Backend server tidak terjangkau untuk ATP. Menggunakan Pedagogical Engine Client-Side:', err);
  }

  // 2. Client-side Pedagogical Fallback
  const fallback = generatePedagogicalATPFallback(
    identitas,
    elemen,
    capaianPembelajaran,
    tpList as any,
    preferensiTambahan,
    elemenList
  );
  return { data: fallback, isClientFallback: true };
}

export async function clientGenerateKKTP(
  identitas: SchoolIdentity,
  tpList: TPItem[],
  atpDocument: ATPDocument | null,
  preferensiTambahan: string = ''
): Promise<{ data: KKTPDocument; isClientFallback: boolean }> {
  // 1. Try server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/generate-kktp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identitas,
        tpList,
        atpDocument,
        preferensiTambahan,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.kktpList) {
        return { data, isClientFallback: false };
      }
    }
  } catch (err) {
    console.warn('[Curriculum Engine] Backend server tidak terjangkau untuk KKTP. Menggunakan Pedagogical Engine Client-Side:', err);
  }

  // 2. Client-side Pedagogical Fallback
  const fallback = generatePedagogicalKKTPFallback(
    identitas,
    tpList as any,
    atpDocument,
    preferensiTambahan
  );
  return { data: fallback as unknown as KKTPDocument, isClientFallback: true };
}

export async function clientGenerateModulAjar(
  identitas: SchoolIdentity,
  elemen: string,
  capaianPembelajaran: string,
  selectedTPs: TPItem[],
  materiFokus: string,
  modelPembelajaranPilihan: string,
  preferensiTambahan: string = '',
  options?: any
): Promise<{ data: any; isClientFallback: boolean }> {
  // 1. Try server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/generate-modul-ajar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identitas,
        elemen,
        capaianPembelajaran,
        selectedTPs,
        materiFokus,
        modelPembelajaranPilihan,
        preferensiTambahan,
        rpmOptions: options,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.kegiatanPembelajaran) {
        return { data, isClientFallback: false };
      }
    }
  } catch (err) {
    console.warn('[Curriculum Engine] Backend server tidak terjangkau untuk Modul Ajar. Menggunakan Pedagogical Engine Client-Side:', err);
  }

  // 2. Client-side Pedagogical Fallback
  const fallback = generatePedagogicalModulFallback(
    identitas,
    elemen,
    capaianPembelajaran,
    selectedTPs as any,
    materiFokus,
    modelPembelajaranPilihan,
    preferensiTambahan,
    options
  );
  return { data: fallback, isClientFallback: true };
}
