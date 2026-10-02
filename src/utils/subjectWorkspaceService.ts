import {
  BedahElemenRow,
  TPItem,
  SchoolIdentity,
  SelectedElementItem,
  ATPDocument,
  KKTPDocument,
  ProtaDocument,
  PromesDocument,
  ModulAjarDocument,
  KisiKisiSoalDocument,
} from '../types';
import {
  INITIAL_MATEMATIKA_IDENTITAS,
  INITIAL_MATEMATIKA_SELECTED_ELEMENTS,
  INITIAL_MATEMATIKA_ELEMEN_ROWS,
  INITIAL_MATEMATIKA_TP_LIST,
  INITIAL_MATEMATIKA_RASIONAL,
  INITIAL_MATEMATIKA_ATP_DOCUMENT,
  INITIAL_MATEMATIKA_KKTP_DOCUMENT,
} from '../data/initialMatematikaFaseC';
import { buildProtaDocumentFromTP, buildPromesDocumentFromTP } from './protaPromesGenerator';
import { buildKKTPDocumentFromTP } from './kktpGenerator';
import { OFFICIAL_SUBJECT_FOLDERS, SubjectFolder } from '../data/officialCPDatabase';
import { getPermen13Allocation } from '../data/permendikdasmen13Data';
import {
  generateMultiElementTPFallback,
  generatePedagogicalATPFallback,
} from '../../server/curriculumEngine';

export interface SubjectWorkspace {
  id: string; // e.g. "matematika__fase_c"
  mataPelajaran: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  identitas?: SchoolIdentity;
  preferensiTambahan?: string;
  selectedElements: SelectedElementItem[];
  elemenRows: BedahElemenRow[];
  tpList: TPItem[];
  rasionalAnalisis: string;
  atpDocument: ATPDocument | null;
  kktpDocument: KKTPDocument | null;
  protaDocument: ProtaDocument | null;
  promesDocument: PromesDocument | null;
  modulAjarDocument: ModulAjarDocument | null;
  soalDocument?: KisiKisiSoalDocument | null;
  lastUpdated: string;
}

const STORAGE_KEY_WORKSPACES = 'sipartan_subject_workspaces_v1';

export function makeSubjectKey(mataPelajaran: string, fase: string): string {
  const cleanMapel = (mataPelajaran || 'Matematika')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const cleanFase = (fase || 'Fase C')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${cleanMapel}__${cleanFase}`;
}

/**
 * Returns initial default workspace for Matematika Fase C (100% complete)
 */
function createDefaultMatematikaFaseCWorkspace(): SubjectWorkspace {
  let prota: ProtaDocument | null = null;
  let promes: PromesDocument | null = null;
  try {
    prota = buildProtaDocumentFromTP(
      INITIAL_MATEMATIKA_IDENTITAS,
      INITIAL_MATEMATIKA_TP_LIST,
      INITIAL_MATEMATIKA_ATP_DOCUMENT
    );
    promes = buildPromesDocumentFromTP(
      INITIAL_MATEMATIKA_IDENTITAS,
      INITIAL_MATEMATIKA_TP_LIST,
      INITIAL_MATEMATIKA_ATP_DOCUMENT
    );
  } catch (e) {
    console.error('Error generating initial prota/promes for Matematika:', e);
  }

  return {
    id: makeSubjectKey(INITIAL_MATEMATIKA_IDENTITAS.mataPelajaran, INITIAL_MATEMATIKA_IDENTITAS.fase),
    mataPelajaran: INITIAL_MATEMATIKA_IDENTITAS.mataPelajaran,
    fase: INITIAL_MATEMATIKA_IDENTITAS.fase,
    kelas: INITIAL_MATEMATIKA_IDENTITAS.kelas,
    selectedElements: INITIAL_MATEMATIKA_SELECTED_ELEMENTS,
    elemenRows: INITIAL_MATEMATIKA_ELEMEN_ROWS,
    tpList: INITIAL_MATEMATIKA_TP_LIST,
    rasionalAnalisis: INITIAL_MATEMATIKA_RASIONAL,
    atpDocument: INITIAL_MATEMATIKA_ATP_DOCUMENT,
    kktpDocument: INITIAL_MATEMATIKA_KKTP_DOCUMENT,
    protaDocument: prota,
    promesDocument: promes,
    modulAjarDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns initial default workspace for Pendidikan Pancasila (Fase A, B, or C) (100% complete)
 */
export function createDefaultPancasilaWorkspace(
  fase: 'Fase A' | 'Fase B' | 'Fase C',
  defaultKelas: string
): SubjectWorkspace {
  const folder = findOfficialSubjectFolder('Pendidikan Pancasila', fase);
  const alloc = getPermen13Allocation('Pendidikan Pancasila', fase, defaultKelas);
  const identitas: SchoolIdentity = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran: 'Pendidikan Pancasila',
    fase,
    kelas: defaultKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [];

  const tpGen = generateMultiElementTPFallback(identitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Pancasila', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      identitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-pancasila-${fase.toLowerCase().replace(/\s+/g, '-')}`,
      identitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (e) {
    console.error(`Error generating ATP for Pendidikan Pancasila ${fase}:`, e);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating KKTP for Pendidikan Pancasila ${fase}:`, e);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating Prota/Promes for Pendidikan Pancasila ${fase}:`, e);
  }

  return {
    id: makeSubjectKey('Pendidikan Pancasila', fase),
    mataPelajaran: 'Pendidikan Pancasila',
    fase,
    kelas: defaultKelas,
    identitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns initial default workspace for Bahasa Indonesia (Fase A, B, or C) (100% complete)
 */
export function createDefaultBahasaIndonesiaWorkspace(
  fase: 'Fase A' | 'Fase B' | 'Fase C',
  defaultKelas: string
): SubjectWorkspace {
  const folder = findOfficialSubjectFolder('Bahasa Indonesia', fase);
  const alloc = getPermen13Allocation('Bahasa Indonesia', fase, defaultKelas);
  const identitas: SchoolIdentity = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran: 'Bahasa Indonesia',
    fase,
    kelas: defaultKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [];

  const tpGen = generateMultiElementTPFallback(identitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Menyimak', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      identitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-bindo-${fase.toLowerCase().replace(/\s+/g, '-')}`,
      identitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (e) {
    console.error(`Error generating ATP for Bahasa Indonesia ${fase}:`, e);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating KKTP for Bahasa Indonesia ${fase}:`, e);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating Prota/Promes for Bahasa Indonesia ${fase}:`, e);
  }

  return {
    id: makeSubjectKey('Bahasa Indonesia', fase),
    mataPelajaran: 'Bahasa Indonesia',
    fase,
    kelas: defaultKelas,
    identitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns initial default workspace for Matematika (Fase A, B, or C) (100% complete)
 */
export function createDefaultMatematikaWorkspace(
  fase: 'Fase A' | 'Fase B' | 'Fase C',
  defaultKelas: string
): SubjectWorkspace {
  const folder = findOfficialSubjectFolder('Matematika', fase);
  const alloc = getPermen13Allocation('Matematika', fase, defaultKelas);
  const identitas: SchoolIdentity = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran: 'Matematika',
    fase,
    kelas: defaultKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [];

  const tpGen = generateMultiElementTPFallback(identitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Bilangan', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      identitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-mat-${fase.toLowerCase().replace(/\s+/g, '-')}`,
      identitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (e) {
    console.error(`Error generating ATP for Matematika ${fase}:`, e);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating KKTP for Matematika ${fase}:`, e);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating Prota/Promes for Matematika ${fase}:`, e);
  }

  return {
    id: makeSubjectKey('Matematika', fase),
    mataPelajaran: 'Matematika',
    fase,
    kelas: defaultKelas,
    identitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns initial default workspace for IPAS (Fase B or C) (100% complete)
 */
export function createDefaultIPASWorkspace(
  fase: 'Fase B' | 'Fase C',
  defaultKelas: string
): SubjectWorkspace {
  const folder = findOfficialSubjectFolder('IPAS', fase);
  const alloc = getPermen13Allocation('Ilmu Pengetahuan Alam dan Sosial (IPAS)', fase, defaultKelas);
  const identitas: SchoolIdentity = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    fase,
    kelas: defaultKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [];

  const tpGen = generateMultiElementTPFallback(identitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Pemahaman IPAS', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      identitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-ipas-${fase.toLowerCase().replace(/\s+/g, '-')}`,
      identitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (e) {
    console.error(`Error generating ATP for IPAS ${fase}:`, e);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating KKTP for IPAS ${fase}:`, e);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating Prota/Promes for IPAS ${fase}:`, e);
  }

  return {
    id: makeSubjectKey('IPAS (Ilmu Pengetahuan Alam dan Sosial)', fase),
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    fase,
    kelas: defaultKelas,
    identitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns initial default workspace for Pendidikan Agama Katolik dan Budi Pekerti (Fase A, B, or C) (100% complete)
 * Sesuai Regulasi Standar Capaian Pembelajaran BKP No. 20/2026
 */
export function createDefaultKatolikWorkspace(
  fase: 'Fase A' | 'Fase B' | 'Fase C',
  defaultKelas: string
): SubjectWorkspace {
  const mapelName = 'Pendidikan Agama Katolik dan Budi Pekerti';
  const folder = findOfficialSubjectFolder(mapelName, fase);
  const alloc = getPermen13Allocation(mapelName, fase, defaultKelas);
  const identitas: SchoolIdentity = {
    ...INITIAL_MATEMATIKA_IDENTITAS,
    mataPelajaran: mapelName,
    fase,
    kelas: defaultKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Regulasi BKP No. 20/2026 & Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [];

  const tpGen = generateMultiElementTPFallback(identitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Pribadi murid', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      identitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-katolik-${fase.toLowerCase().replace(/\s+/g, '-')}`,
      identitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (e) {
    console.error(`Error generating ATP for Katolik ${fase}:`, e);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating KKTP for Katolik ${fase}:`, e);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(identitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(identitas, tpList, atpDoc);
  } catch (e) {
    console.error(`Error generating Prota/Promes for Katolik ${fase}:`, e);
  }

  return {
    id: makeSubjectKey(mapelName, fase),
    mataPelajaran: mapelName,
    fase,
    kelas: defaultKelas,
    identitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Strict validator to check whether a TP list belongs authentically to the given mataPelajaran,
 * preventing cross-subject contamination (e.g. Matematika/Pecahan appearing under Pendidikan Pancasila).
 */
export function isTPListValidForSubject(
  tpList: TPItem[] | undefined | null,
  mataPelajaran: string
): boolean {
  if (!tpList || tpList.length === 0) return false;
  const mapel = (mataPelajaran || '').toLowerCase().trim();

  // 1. PENDIDIKAN PANCASILA / PPKN / KEWARGANEGARAAN
  if (
    mapel.includes('pancasila') ||
    mapel.includes('pkn') ||
    mapel.includes('ppkn') ||
    mapel.includes('kewarganegaraan')
  ) {
    const mathScienceContaminants = [
      'pecahan',
      'bilangan cacah',
      'bilangan bulat',
      'operasi hitung',
      'penjumlahan',
      'pengurangan',
      'perkalian',
      'pembagian',
      'kpk',
      'fpb',
      'aljabar',
      'geometri',
      'bangun datar',
      'bangun ruang',
      'sudut',
      'diagram batang',
      'piktogram',
      'desimal',
      'fotosintesis',
      'ekosistem',
      'tata surya',
    ];

    const pancasilaPositiveKeywords = [
      'pancasila',
      'sila',
      'garuda',
      'lambang',
      'uud',
      'undang-undang',
      'norma',
      'aturan',
      'hak',
      'kewajiban',
      'musyawarah',
      'mufakat',
      'gotong royong',
      'bhinneka',
      'keberagaman',
      'nkri',
      'persatuan',
      'identitas',
      'warga negara',
      'kebinekaan',
      'dasar negara',
      'semboyan',
      'cinta tanah air',
      'adat',
      'suku',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (mathScienceContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (pancasilaPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  // 2. MATEMATIKA
  if (
    mapel.includes('matematika') ||
    mapel.includes('math') ||
    mapel.includes('hitung') ||
    mapel.includes('mtk')
  ) {
    const mathContaminants = [
      'pancasila',
      'sila',
      'uud 1945',
      'bhinneka',
      'gotong royong',
      'musyawarah mufakat',
      'fotosintesis',
      'ekosistem',
    ];

    const mathPositiveKeywords = [
      'bilangan',
      'angka',
      'pecahan',
      'desimal',
      'persen',
      'hitung',
      'aljabar',
      'geometri',
      'ruang',
      'datar',
      'sudut',
      'keliling',
      'luas',
      'panjang',
      'berat',
      'waktu',
      'volume',
      'data',
      'diagram',
      'kpk',
      'fpb',
      'rasio',
      'pola',
      'matematika',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (mathContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (mathPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  // 3. IPAS
  if (
    mapel.includes('ipas') ||
    mapel.includes('alam dan sosial') ||
    mapel.includes('ipa') ||
    mapel.includes('sains')
  ) {
    const ipasContaminants = [
      'pecahan',
      'bilangan cacah',
      'kpk',
      'fpb',
      'aljabar',
      'pancasila',
      'sila-sila',
      'uud 1945',
    ];

    const ipasPositiveKeywords = [
      'ekosistem',
      'tumbuhan',
      'hewan',
      'fotosintesis',
      'organ',
      'tubuh',
      'zat',
      'energi',
      'gaya',
      'magnet',
      'cahaya',
      'bunyi',
      'tata surya',
      'bumi',
      'cuaca',
      'iklim',
      'peta',
      'bentang alam',
      'sejarah',
      'kebutuhan',
      'uang',
      'ipas',
      'alam',
      'sosial',
      'pancaindra',
      'siklus',
      'wujud',
      'mitigasi',
      'penyelidikan',
      'pelestarian',
      'perubahan',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (ipasContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (ipasPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  // 4. BAHASA INDONESIA
  if (mapel.includes('indonesia')) {
    const indoContaminants = [
      'pecahan',
      'bilangan cacah',
      'kpk',
      'fpb',
      'aljabar',
      'geometri',
      'fotosintesis',
      'sila pancasila',
    ];

    const indoPositiveKeywords = [
      'menyimak',
      'membaca',
      'memirsa',
      'berbicara',
      'mempresentasikan',
      'menulis',
      'teks',
      'kata',
      'kalimat',
      'paragraf',
      'cerita',
      'dongeng',
      'puisi',
      'kosakata',
      'ide pokok',
      'gagasan',
      'tokoh',
      'alur',
      'bahasa',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (indoContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (indoPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  // 5. BAHASA INGGRIS
  if (mapel.includes('inggris') || mapel.includes('english')) {
    const englishContaminants = [
      'pecahan',
      'bilangan cacah',
      'kpk',
      'fpb',
      'aljabar',
      'geometri',
      'fotosintesis',
      'sila pancasila',
      'uud 1945',
    ];

    const englishPositiveKeywords = [
      'menyimak',
      'berbicara',
      'membaca',
      'memirsa',
      'menulis',
      'mempresentasikan',
      'listening',
      'speaking',
      'reading',
      'viewing',
      'writing',
      'presenting',
      'teks',
      'lisan',
      'multimodal',
      'tulis',
      'gagasan',
      'ide',
      'pengalaman',
      'informasi',
      'sehari-hari',
      'everyday',
      'konteks',
      'sederhana',
      'pendek',
      'bahasa inggris',
      'inggris',
      'english',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (englishContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (englishPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  // 6. PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI
  if (
    mapel.includes('katolik') ||
    mapel.includes('agama')
  ) {
    const katolikContaminants = [
      'pecahan',
      'bilangan cacah',
      'kpk',
      'fpb',
      'aljabar',
      'fotosintesis',
      'ekosistem',
      'tata surya',
      'uud 1945',
    ];

    const katolikPositiveKeywords = [
      'tuhan',
      'allah',
      'yesus',
      'kristus',
      'gereja',
      'sakramen',
      'baptis',
      'ekaristi',
      'tobat',
      'krisma',
      'kitab suci',
      'perjanjian lama',
      'perjanjian baru',
      'doa',
      'bapa kami',
      'salam maria',
      'kemuliaan',
      'tanda salib',
      'iman',
      'citra allah',
      'nuh',
      'abraham',
      'ishak',
      'yakub',
      'yusuf',
      'musa',
      'yosua',
      'daud',
      'salomo',
      'ester',
      'maria',
      'elisabet',
      'sepuluh perintah',
      'bait allah',
      'kerajaan allah',
      'hati nurani',
      'laudato si',
      'moderasi',
      'tetangga',
      'rukun',
      'gotong royong',
      'pribadi murid',
      'katolik',
      'kasih',
      'moral',
    ];

    let positiveHits = 0;
    let contaminantHits = 0;

    for (const tp of tpList) {
      const text = `${tp.lingkupMateri || ''} ${tp.rumusanTP || ''} ${tp.elemen || ''} ${tp.kompetensi || ''}`.toLowerCase();
      if (katolikContaminants.some((w) => text.includes(w))) {
        contaminantHits++;
      }
      if (katolikPositiveKeywords.some((w) => text.includes(w))) {
        positiveHits++;
      }
    }

    if (contaminantHits > 0 || positiveHits === 0) {
      return false;
    }
    return true;
  }

  return true;
}

/**
 * Load all subject workspaces from storage. Always ensures Matematika Fase C exists as complete.
 */
export function getAllSubjectWorkspaces(): Record<string, SubjectWorkspace> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
    const workspaces: Record<string, SubjectWorkspace> = raw ? JSON.parse(raw) : {};

    let needsResave = false;
    // Sanitize any corrupted or cross-contaminated workspaces from localStorage
    Object.keys(workspaces).forEach((key) => {
      const ws = workspaces[key];
      const mapelLower = (ws?.mataPelajaran || key).toLowerCase();
      // Enforce user instruction: remove all other religions, keeping ONLY Pendidikan Agama Katolik dan Budi Pekerti
      if (
        mapelLower.includes('islam') ||
        mapelLower.includes('pai') ||
        mapelLower.includes('kristen') ||
        mapelLower.includes('hindu') ||
        mapelLower.includes('buddha') ||
        mapelLower.includes('khonghucu')
      ) {
        console.warn(`[getAllSubjectWorkspaces] Purging non-Catholic religion workspace:`, key);
        delete workspaces[key];
        needsResave = true;
        return;
      }
      if (ws && ws.tpList && ws.tpList.length > 0 && ws.mataPelajaran) {
        if (!isTPListValidForSubject(ws.tpList, ws.mataPelajaran)) {
          console.warn(`[getAllSubjectWorkspaces] Contaminated workspace detected for ${ws.mataPelajaran}, purging:`, key);
          delete workspaces[key];
          needsResave = true;
        }
      }
    });

    const matKey = makeSubjectKey('Matematika', 'Fase C');
    if (!workspaces[matKey] || !workspaces[matKey].tpList || workspaces[matKey].tpList.length === 0) {
      workspaces[matKey] = createDefaultMatematikaFaseCWorkspace();
      needsResave = true;
    }

    const panAKey = makeSubjectKey('Pendidikan Pancasila', 'Fase A');
    if (!workspaces[panAKey] || !workspaces[panAKey].tpList || workspaces[panAKey].tpList.length === 0) {
      workspaces[panAKey] = createDefaultPancasilaWorkspace('Fase A', '1');
      needsResave = true;
    }

    const panBKey = makeSubjectKey('Pendidikan Pancasila', 'Fase B');
    if (!workspaces[panBKey] || !workspaces[panBKey].tpList || workspaces[panBKey].tpList.length === 0) {
      workspaces[panBKey] = createDefaultPancasilaWorkspace('Fase B', '3');
      needsResave = true;
    }

    const panCKey = makeSubjectKey('Pendidikan Pancasila', 'Fase C');
    if (!workspaces[panCKey] || !workspaces[panCKey].tpList || workspaces[panCKey].tpList.length === 0) {
      workspaces[panCKey] = createDefaultPancasilaWorkspace('Fase C', '5');
      needsResave = true;
    }

    const bindoAKey = makeSubjectKey('Bahasa Indonesia', 'Fase A');
    if (!workspaces[bindoAKey] || !workspaces[bindoAKey].tpList || workspaces[bindoAKey].tpList.length === 0) {
      workspaces[bindoAKey] = createDefaultBahasaIndonesiaWorkspace('Fase A', '1');
      needsResave = true;
    }

    const bindoBKey = makeSubjectKey('Bahasa Indonesia', 'Fase B');
    if (!workspaces[bindoBKey] || !workspaces[bindoBKey].tpList || workspaces[bindoBKey].tpList.length === 0) {
      workspaces[bindoBKey] = createDefaultBahasaIndonesiaWorkspace('Fase B', '3');
      needsResave = true;
    }

    const bindoCKey = makeSubjectKey('Bahasa Indonesia', 'Fase C');
    if (!workspaces[bindoCKey] || !workspaces[bindoCKey].tpList || workspaces[bindoCKey].tpList.length === 0) {
      workspaces[bindoCKey] = createDefaultBahasaIndonesiaWorkspace('Fase C', '5');
      needsResave = true;
    }

    const matAKey = makeSubjectKey('Matematika', 'Fase A');
    if (!workspaces[matAKey] || !workspaces[matAKey].tpList || workspaces[matAKey].tpList.length === 0) {
      workspaces[matAKey] = createDefaultMatematikaWorkspace('Fase A', '1');
      needsResave = true;
    }

    const matBKey = makeSubjectKey('Matematika', 'Fase B');
    if (!workspaces[matBKey] || !workspaces[matBKey].tpList || workspaces[matBKey].tpList.length === 0) {
      workspaces[matBKey] = createDefaultMatematikaWorkspace('Fase B', '3');
      needsResave = true;
    }

    const ipasBKey = makeSubjectKey('IPAS (Ilmu Pengetahuan Alam dan Sosial)', 'Fase B');
    if (!workspaces[ipasBKey] || !workspaces[ipasBKey].tpList || workspaces[ipasBKey].tpList.length === 0) {
      workspaces[ipasBKey] = createDefaultIPASWorkspace('Fase B', '3');
      needsResave = true;
    }

    const ipasBShortKey = makeSubjectKey('IPAS', 'Fase B');
    if (!workspaces[ipasBShortKey] || !workspaces[ipasBShortKey].tpList || workspaces[ipasBShortKey].tpList.length === 0) {
      workspaces[ipasBShortKey] = workspaces[ipasBKey];
      needsResave = true;
    }

    const ipasCKey = makeSubjectKey('IPAS (Ilmu Pengetahuan Alam dan Sosial)', 'Fase C');
    if (!workspaces[ipasCKey] || !workspaces[ipasCKey].tpList || workspaces[ipasCKey].tpList.length === 0) {
      workspaces[ipasCKey] = createDefaultIPASWorkspace('Fase C', '5');
      needsResave = true;
    }

    const ipasCShortKey = makeSubjectKey('IPAS', 'Fase C');
    if (!workspaces[ipasCShortKey] || !workspaces[ipasCShortKey].tpList || workspaces[ipasCShortKey].tpList.length === 0) {
      workspaces[ipasCShortKey] = workspaces[ipasCKey];
      needsResave = true;
    }

    // PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI (Regulasi BKP No. 20/2026)
    const katAFullKey = makeSubjectKey('Pendidikan Agama Katolik dan Budi Pekerti', 'Fase A');
    if (!workspaces[katAFullKey] || !workspaces[katAFullKey].tpList || workspaces[katAFullKey].tpList.length === 0) {
      workspaces[katAFullKey] = createDefaultKatolikWorkspace('Fase A', '1');
      needsResave = true;
    }

    const katBFullKey = makeSubjectKey('Pendidikan Agama Katolik dan Budi Pekerti', 'Fase B');
    if (!workspaces[katBFullKey] || !workspaces[katBFullKey].tpList || workspaces[katBFullKey].tpList.length === 0) {
      workspaces[katBFullKey] = createDefaultKatolikWorkspace('Fase B', '3');
      needsResave = true;
    }

    const katCFullKey = makeSubjectKey('Pendidikan Agama Katolik dan Budi Pekerti', 'Fase C');
    const existingKatC = workspaces[katCFullKey];
    const katCNeedsRefresh = !existingKatC ||
      !existingKatC.tpList ||
      existingKatC.tpList.length === 0 ||
      (existingKatC.selectedElements && existingKatC.selectedElements.some(el => el.elemen === 'Pribadi murid' && !el.capaianPembelajaran.includes('perempuan atau laki-laki')));

    if (katCNeedsRefresh) {
      workspaces[katCFullKey] = createDefaultKatolikWorkspace('Fase C', '5');
      needsResave = true;
    }

    // Set Aliases for ease of lookup
    const katAliases: [string, 'Fase A' | 'Fase B' | 'Fase C', string][] = [
      ['Pendidikan Agama Katolik', 'Fase A', katAFullKey],
      ['Pendidikan Agama Katolik', 'Fase B', katBFullKey],
      ['Pendidikan Agama Katolik', 'Fase C', katCFullKey],
      ['Pendidikan Agama', 'Fase A', katAFullKey],
      ['Pendidikan Agama', 'Fase B', katBFullKey],
      ['Pendidikan Agama', 'Fase C', katCFullKey],
      ['Pendidikan Agama & Budi Pekerti', 'Fase A', katAFullKey],
      ['Pendidikan Agama & Budi Pekerti', 'Fase B', katBFullKey],
      ['Pendidikan Agama & Budi Pekerti', 'Fase C', katCFullKey],
      ['Agama Katolik', 'Fase A', katAFullKey],
      ['Agama Katolik', 'Fase B', katBFullKey],
      ['Agama Katolik', 'Fase C', katCFullKey],
    ];

    katAliases.forEach(([aliasMapel, aliasFase, sourceKey]) => {
      const aliasKey = makeSubjectKey(aliasMapel, aliasFase);
      if (!workspaces[aliasKey] || !workspaces[aliasKey].tpList || workspaces[aliasKey].tpList.length === 0) {
        if (workspaces[sourceKey]) {
          workspaces[aliasKey] = workspaces[sourceKey];
          needsResave = true;
        }
      }
    });

    if (needsResave) {
      saveAllSubjectWorkspaces(workspaces);
    }
    return workspaces;
  } catch (err) {
    console.warn('Error reading workspaces, initializing default:', err);
    const def: Record<string, SubjectWorkspace> = {
      [makeSubjectKey('Matematika', 'Fase C')]: createDefaultMatematikaFaseCWorkspace(),
    };
    return def;
  }
}

/**
 * Save all subject workspaces to storage
 */
export function saveAllSubjectWorkspaces(workspaces: Record<string, SubjectWorkspace>): void {
  try {
    localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
  } catch (err) {
    console.warn('Error saving subject workspaces:', err);
  }
}

/**
 * Get a single subject workspace by mataPelajaran and fase
 */
export function getSubjectWorkspace(mataPelajaran: string, fase: string): SubjectWorkspace | undefined {
  const all = getAllSubjectWorkspaces();
  const key = makeSubjectKey(mataPelajaran, fase);
  return all[key];
}

/**
 * Save or update a single subject workspace
 */
export function saveSingleSubjectWorkspace(workspace: SubjectWorkspace): void {
  const all = getAllSubjectWorkspaces();
  const key = workspace.id || makeSubjectKey(workspace.mataPelajaran, workspace.fase);
  all[key] = {
    ...workspace,
    id: key,
    lastUpdated: new Date().toISOString(),
  };
  saveAllSubjectWorkspaces(all);
}

/**
 * Save or update a subject workspace from partial data
 */
export function saveSubjectWorkspace(
  workspace: Partial<SubjectWorkspace> & { mataPelajaran: string; fase: string; explicitReset?: boolean }
): void {
  const all = getAllSubjectWorkspaces();
  const key = makeSubjectKey(workspace.mataPelajaran, workspace.fase);
  const existing: Partial<SubjectWorkspace> = all[key] || {};

  // Verify that if tpList is provided, it genuinely belongs to workspace.mataPelajaran
  let safeTPList = existing.tpList || [];
  if (workspace.tpList && workspace.tpList.length > 0) {
    if (isTPListValidForSubject(workspace.tpList, workspace.mataPelajaran)) {
      safeTPList = workspace.tpList;
    } else {
      console.warn(
        `[saveSubjectWorkspace] Prevented saving cross-contaminated TP list for subject "${workspace.mataPelajaran}". Retaining authentic TP list.`
      );
    }
  } else if (workspace.explicitReset) {
    safeTPList = [];
  }

  // Data integrity guard: Do not overwrite existing valid documents with null unless explicitReset is requested
  const safeAtp = workspace.atpDocument !== undefined && workspace.atpDocument !== null
    ? workspace.atpDocument
    : (workspace.explicitReset ? null : (existing.atpDocument || null));

  const safeKktp = workspace.kktpDocument !== undefined && workspace.kktpDocument !== null
    ? workspace.kktpDocument
    : (workspace.explicitReset ? null : (existing.kktpDocument || null));

  const safeProta = workspace.protaDocument !== undefined && workspace.protaDocument !== null
    ? workspace.protaDocument
    : (workspace.explicitReset ? null : (existing.protaDocument || null));

  const safePromes = workspace.promesDocument !== undefined && workspace.promesDocument !== null
    ? workspace.promesDocument
    : (workspace.explicitReset ? null : (existing.promesDocument || null));

  const safeModul = workspace.modulAjarDocument !== undefined && workspace.modulAjarDocument !== null
    ? workspace.modulAjarDocument
    : (workspace.explicitReset ? null : (existing.modulAjarDocument || null));

  const safeSoal = workspace.soalDocument !== undefined && workspace.soalDocument !== null
    ? workspace.soalDocument
    : (workspace.explicitReset ? null : (existing.soalDocument || null));

  all[key] = {
    ...existing,
    ...workspace,
    id: key,
    mataPelajaran: workspace.mataPelajaran,
    fase: workspace.fase as any,
    kelas: workspace.kelas || existing.kelas || '5',
    selectedElements: workspace.selectedElements && workspace.selectedElements.length > 0 
      ? workspace.selectedElements 
      : (workspace.explicitReset ? [] : (existing.selectedElements || [])),
    elemenRows: workspace.elemenRows && workspace.elemenRows.length > 0
      ? workspace.elemenRows
      : (workspace.explicitReset ? [] : (existing.elemenRows || [])),
    tpList: safeTPList,
    rasionalAnalisis: workspace.rasionalAnalisis || (workspace.explicitReset ? '' : (existing.rasionalAnalisis || '')),
    atpDocument: safeAtp,
    kktpDocument: safeKktp,
    protaDocument: safeProta,
    promesDocument: safePromes,
    modulAjarDocument: safeModul,
    soalDocument: safeSoal,
    lastUpdated: new Date().toISOString(),
  } as SubjectWorkspace;
  saveAllSubjectWorkspaces(all);
}

/**
 * Find the closest matching official subject folder from Keputusan Kepala BSKAP No. 046 Tahun 2025
 */
export function findOfficialSubjectFolder(
  mataPelajaran: string,
  fase?: string
): SubjectFolder | undefined {
  const normMapel = (mataPelajaran || '').toLowerCase().trim();
  const normFase = (fase || '').toLowerCase().trim();

  const matchedFolders = OFFICIAL_SUBJECT_FOLDERS.filter((f) => {
    const fm = f.mataPelajaran.toLowerCase();
    if (
      normMapel.includes('ipas') ||
      normMapel.includes('alam dan sosial') ||
      normMapel.includes('ilmu pengetahuan alam')
    ) {
      return fm.includes('ipas') || fm.includes('alam dan sosial');
    }
    if (normMapel.includes('indonesia')) return fm.includes('indonesia');
    if (normMapel.includes('matematika') || normMapel.includes('math') || normMapel.includes('mtk')) {
      return fm.includes('matematika');
    }
    if (normMapel.includes('pancasila') || normMapel.includes('ppkn') || normMapel.includes('pkn')) {
      return fm.includes('pancasila');
    }
    if (normMapel.includes('pjok') || normMapel.includes('jasmani') || normMapel.includes('olahraga')) {
      return fm.includes('pjok') || fm.includes('jasmani');
    }
    if (normMapel.includes('seni rupa')) return fm.includes('seni rupa');
    if (normMapel.includes('seni musik')) return fm.includes('seni musik');
    if (normMapel.includes('inggris') || normMapel.includes('english')) return fm.includes('inggris');
    if (normMapel.includes('agama') || normMapel.includes('islam') || normMapel.includes('pai')) {
      return fm.includes('agama') || fm.includes('islam');
    }
    return fm.includes(normMapel) || normMapel.includes(fm);
  });

  if (matchedFolders.length === 0) return undefined;

  if (normFase) {
    const exactFase = matchedFolders.find((f) => f.fase.toLowerCase() === normFase);
    if (exactFase) return exactFase;
  }

  return matchedFolders[0];
}

/**
 * Get or initialize a subject workspace. If not yet initialized, automatically deconstructs
 * the official Capaian Pembelajaran into complete pedagogical TP items and curriculum documents.
 */
export function getOrInitSubjectWorkspace(
  mataPelajaran: string,
  fase: string = 'Fase C',
  kelas: string = '5',
  identitasBase?: SchoolIdentity
): SubjectWorkspace {
  const all = getAllSubjectWorkspaces();
  const key = makeSubjectKey(mataPelajaran, fase);
  const existing = all[key];

  if (existing && existing.tpList && existing.tpList.length > 0) {
    if (isTPListValidForSubject(existing.tpList, mataPelajaran)) {
      return existing;
    }
    console.warn(
      `[getOrInitSubjectWorkspace] Existing workspace for "${mataPelajaran}" contained mismatched TP data. Re-initializing authentic subject workspace.`
    );
  }

  // Find matching official folder
  const folder = findOfficialSubjectFolder(mataPelajaran, fase);

  // Target class selection
  let targetKelas = kelas;
  const effectiveFase = (folder ? folder.fase : fase) as 'Fase A' | 'Fase B' | 'Fase C';
  if (effectiveFase === 'Fase A' && !['1', '2'].includes(targetKelas)) targetKelas = '1';
  if (effectiveFase === 'Fase B' && !['3', '4'].includes(targetKelas)) targetKelas = '3';
  if (effectiveFase === 'Fase C' && !['5', '6'].includes(targetKelas)) targetKelas = '5';

  const effectiveMapel = folder ? folder.mataPelajaran : mataPelajaran;
  const alloc = getPermen13Allocation(effectiveMapel, effectiveFase, targetKelas);

  const effectiveIdentitas: SchoolIdentity = {
    ...(identitasBase || INITIAL_MATEMATIKA_IDENTITAS),
    mataPelajaran: effectiveMapel,
    fase: effectiveFase,
    kelas: targetKelas,
    alokasiWaktuTotal: `${alloc.jpTahunIntra} JP / Tahun (${alloc.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`,
  };

  const selectedElements: SelectedElementItem[] = folder
    ? folder.elemenList.map((el) => ({
        id: el.id,
        elemen: el.elemen,
        capaianPembelajaran: el.capaianPembelajaran,
        deskripsiSingkat: el.deskripsiSingkat,
        isSelected: true,
      }))
    : [
        {
          id: `custom-el-1`,
          elemen: `Capaian Pembelajaran ${effectiveMapel}`,
          capaianPembelajaran: `Peserta didik mampu memahami konsep dasar, menerapkan keterampilan berpikir kritis, dan mengomunikasikan hasil pemahaman terkait ${effectiveMapel} secara santun dan mandiri.`,
          deskripsiSingkat: `Elemen Pembelajaran Inti ${effectiveMapel}`,
          isSelected: true,
        },
      ];

  // Generate authentic TP decomposition using Pedagogical Engine
  const tpGen = generateMultiElementTPFallback(effectiveIdentitas, selectedElements, '');
  const tpList = tpGen.daftarTP || [];
  const elemenRows = tpGen.elemenRows || [];
  const rasionalAnalisis = tpGen.rasionalAnalisis || '';

  // Generate ATP, KKTP, Prota, Promes
  let atpDoc: ATPDocument | null = null;
  let kktpDoc: KKTPDocument | null = null;
  let protaDoc: ProtaDocument | null = null;
  let promesDoc: PromesDocument | null = null;

  try {
    const firstEl = selectedElements[0] || { elemen: 'Elemen 1', capaianPembelajaran: '' };
    const rawAtp = generatePedagogicalATPFallback(
      effectiveIdentitas,
      firstEl.elemen,
      firstEl.capaianPembelajaran,
      tpList as any,
      '',
      selectedElements.map((e) => ({ elemen: e.elemen, capaianPembelajaran: e.capaianPembelajaran }))
    );
    atpDoc = {
      id: `atp-${Date.now()}`,
      identitas: effectiveIdentitas,
      elemen: firstEl.elemen,
      capaianPembelajaran: firstEl.capaianPembelajaran,
      tanggalDibuat: new Date().toLocaleDateString('id-ID'),
      ...rawAtp,
    } as ATPDocument;
  } catch (err) {
    console.warn('Error generating initial ATP for workspace:', err);
  }

  try {
    kktpDoc = buildKKTPDocumentFromTP(effectiveIdentitas, tpList, atpDoc);
  } catch (err) {
    console.warn('Error generating initial KKTP for workspace:', err);
  }

  try {
    protaDoc = buildProtaDocumentFromTP(effectiveIdentitas, tpList, atpDoc);
    promesDoc = buildPromesDocumentFromTP(effectiveIdentitas, tpList, atpDoc);
  } catch (err) {
    console.warn('Error generating initial Prota/Promes for workspace:', err);
  }

  const newWorkspace: SubjectWorkspace = {
    id: key,
    mataPelajaran: effectiveMapel,
    fase: effectiveFase,
    kelas: targetKelas,
    identitas: effectiveIdentitas,
    preferensiTambahan: '',
    selectedElements,
    elemenRows,
    tpList,
    rasionalAnalisis,
    atpDocument: atpDoc,
    kktpDocument: kktpDoc,
    protaDocument: protaDoc,
    promesDocument: promesDoc,
    modulAjarDocument: null,
    soalDocument: null,
    lastUpdated: new Date().toISOString(),
  };

  all[key] = newWorkspace;
  saveAllSubjectWorkspaces(all);

  return newWorkspace;
}

/**
 * Check if a subject has already been analyzed (has TP list and ATP document)
 */
export function hasSubjectBeenAnalyzed(mataPelajaran: string, fase: string): boolean {
  const all = getAllSubjectWorkspaces();
  const key = makeSubjectKey(mataPelajaran, fase);
  const ws = all[key];
  if (ws && ws.tpList && ws.tpList.length > 0) return true;

  // If matching official folder exists, it can be loaded or generated seamlessly
  const folder = findOfficialSubjectFolder(mataPelajaran, fase);
  return Boolean(folder);
}

/**
 * Get detailed analysis status for a subject
 */
export function getSubjectAnalysisStatus(mataPelajaran: string, fase: string): {
  key: string;
  hasTP: boolean;
  hasATP: boolean;
  hasKKTP: boolean;
  hasProta: boolean;
  hasPromes: boolean;
  hasModul: boolean;
  tpCount: number;
  isComplete: boolean;
  lastUpdated?: string;
} {
  const all = getAllSubjectWorkspaces();
  const key = makeSubjectKey(mataPelajaran, fase);
  const ws = all[key];

  if (!ws) {
    return {
      key,
      hasTP: false,
      hasATP: false,
      hasKKTP: false,
      hasProta: false,
      hasPromes: false,
      hasModul: false,
      tpCount: 0,
      isComplete: false,
    };
  }

  const hasTP = Boolean(ws.tpList && ws.tpList.length > 0);
  const hasATP = Boolean(ws.atpDocument && ws.atpDocument.atpList && ws.atpDocument.atpList.length > 0);
  const hasKKTP = Boolean(ws.kktpDocument && ws.kktpDocument.kktpList && ws.kktpDocument.kktpList.length > 0);
  const hasProta = Boolean(ws.protaDocument);
  const hasPromes = Boolean(ws.promesDocument);
  const hasModul = Boolean(ws.modulAjarDocument);

  return {
    key,
    hasTP,
    hasATP,
    hasKKTP,
    hasProta,
    hasPromes,
    hasModul,
    tpCount: ws.tpList ? ws.tpList.length : 0,
    isComplete: hasTP && hasATP && hasKKTP,
    lastUpdated: ws.lastUpdated,
  };
}

/**
 * Get an appropriate emoticon for a mata pelajaran
 */
export function getSubjectEmoticon(mataPelajaran: string): string {
  const lower = (mataPelajaran || '').toLowerCase();
  if (lower.includes('matematika')) return '📐';
  if (lower.includes('ipas') || lower.includes('alam') || lower.includes('sosial')) return '🔬';
  if (lower.includes('indonesia')) return '🇮🇩';
  if (lower.includes('pancasila') || lower.includes('pkn')) return '🏛️';
  if (lower.includes('agama') || lower.includes('islam') || lower.includes('kristen') || lower.includes('katolik')) return '📖';
  if (lower.includes('jasmani') || lower.includes('pjok') || lower.includes('olahraga')) return '🏃';
  if (lower.includes('seni rupa') || lower.includes('gambar')) return '🎨';
  if (lower.includes('seni musik')) return '🎵';
  if (lower.includes('seni teater') || lower.includes('tari')) return '🎭';
  if (lower.includes('inggris')) return '🇬🇧';
  return '📚';
}
