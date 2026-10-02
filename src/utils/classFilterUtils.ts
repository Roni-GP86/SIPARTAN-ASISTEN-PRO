import { TPItem, BedahElemenRow, ATPDocument, ATPItem, KKTPDocument, KKTPItem, MateriPokok, SchoolIdentity } from '../types';

/**
 * Returns the individual classes associated with a given Fase.
 * - Fase A -> ['1', '2']
 * - Fase B -> ['3', '4']
 * - Fase C -> ['5', '6']
 */
export function getClassesForFase(fase?: string): string[] {
  if (fase === 'Fase A') return ['1', '2'];
  if (fase === 'Fase B') return ['3', '4'];
  if (fase === 'Fase C') return ['5', '6'];
  return ['5', '6'];
}

/**
 * Determines which class a TP/ATP/KKTP item belongs to.
 */
export function getItemClass(
  item: {
    kodeTP?: string;
    kelasTarget?: string;
    kelasCentang?: string[];
    urutanAlur?: number;
    urutan?: number;
  },
  fase: string,
  index?: number,
  totalCount?: number
): string {
  const possibleClasses = getClassesForFase(fase);

  // 1. Explicit kelasTarget
  if (item.kelasTarget && possibleClasses.includes(String(item.kelasTarget).trim())) {
    return String(item.kelasTarget).trim();
  }

  // 2. Explicit kelasCentang
  if (Array.isArray(item.kelasCentang) && item.kelasCentang.length > 0) {
    for (const c of item.kelasCentang) {
      const trimmed = String(c).trim();
      if (possibleClasses.includes(trimmed)) {
        return trimmed;
      }
    }
  }

  // 3. Match from kodeTP pattern (e.g. "5.1", "6.2", "1.1", "2.1", "3.1", "4.1")
  const kode = (item.kodeTP || '').trim();
  const match = kode.match(/(?:TP[-.\s]*)?([1-9])(?:[-.]\d+)?/i);
  if (match && match[1] && possibleClasses.includes(match[1])) {
    return match[1];
  }

  // 4. Fallback: distribute evenly by index across possible classes
  if (index !== undefined && totalCount && totalCount > 0) {
    const half = Math.ceil(totalCount / possibleClasses.length);
    const classIdx = Math.min(Math.floor(index / half), possibleClasses.length - 1);
    return possibleClasses[classIdx];
  }

  return possibleClasses[0];
}

/**
 * Check whether an item belongs to the selected class filter ('all' or specific class e.g. '5').
 */
export function doesItemMatchClass(
  item: {
    kodeTP?: string;
    kelasTarget?: string;
    kelasCentang?: string[];
    urutanAlur?: number;
    urutan?: number;
  },
  selectedKelas: string,
  fase: string,
  index?: number,
  totalCount?: number
): boolean {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return true;
  }

  // If item has kelasCentang array, check if selectedKelas is present
  if (Array.isArray(item.kelasCentang) && item.kelasCentang.includes(selectedKelas)) {
    return true;
  }

  const determinedClass = getItemClass(item, fase, index, totalCount);
  return determinedClass === selectedKelas;
}

/**
 * Filter a list of TPItems by selected class.
 */
export function filterTPListByClass(tpList: TPItem[], selectedKelas: string, fase: string): TPItem[] {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return tpList;
  }
  const total = tpList.length;
  return tpList.filter((tp, idx) => doesItemMatchClass(tp, selectedKelas, fase, idx, total));
}

/**
 * Filter BedahElemenRow list by selected class.
 * Omits rows that have zero TPs for the selected class to conserve paper,
 * unless all rows would be removed.
 */
export function filterElemenRowsByClass(
  rows: BedahElemenRow[],
  selectedKelas: string,
  fase: string
): BedahElemenRow[] {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return rows;
  }
  const mapped = rows.map((row) => {
    const filteredTPs = filterTPListByClass(row.daftarTP || [], selectedKelas, fase);
    return {
      ...row,
      daftarTP: filteredTPs,
    };
  });

  // Filter out elements that have no TPs for this specific class to reduce printed pages
  const withTPs = mapped.filter((r) => r.daftarTP && r.daftarTP.length > 0);
  return withTPs.length > 0 ? withTPs : mapped;
}

/**
 * Filter an ATPDocument by selected class.
 */
export function filterATPDocumentByClass(atp: ATPDocument, selectedKelas: string): ATPDocument {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return atp;
  }

  const fase = atp.identitas.fase || 'Fase C';
  const totalAtp = atp.atpList.length;

  const filteredAtpList = atp.atpList
    .filter((item, idx) => doesItemMatchClass(item, selectedKelas, fase, idx, totalAtp))
    .map((item, newIdx) => ({
      ...item,
      urutan: newIdx + 1,
    }));

  const filteredTotalJP = filteredAtpList.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);

  // Filter materi pokok if applicable
  const classes = getClassesForFase(fase);
  const classIdx = classes.indexOf(selectedKelas);
  let filteredMateri = atp.materiPokokList;
  if (atp.materiPokokList && atp.materiPokokList.length >= classes.length && classIdx >= 0) {
    const half = Math.ceil(atp.materiPokokList.length / classes.length);
    const start = classIdx * half;
    const end = Math.min(start + half, atp.materiPokokList.length);
    const sliced = atp.materiPokokList.slice(start, end);
    if (sliced.length > 0) {
      filteredMateri = sliced;
    }
  }

  // Filter elemenList to elements actually present in the filtered ATP list (reduces pages)
  let filteredElemenList = atp.elemenList;
  if (atp.elemenList && atp.elemenList.length > 0 && filteredAtpList.length > 0) {
    const usedElemenNames = new Set(
      filteredAtpList.map((item) => (item.elemen || '').toLowerCase().trim()).filter(Boolean)
    );
    if (usedElemenNames.size > 0) {
      const matched = atp.elemenList.filter((el) => usedElemenNames.has((el.elemen || '').toLowerCase().trim()));
      if (matched.length > 0) {
        filteredElemenList = matched;
      }
    }
  }

  const updatedIdentitas: SchoolIdentity = {
    ...atp.identitas,
    kelas: selectedKelas,
    alokasiWaktuTotal: `${filteredTotalJP} JP`,
  };

  return {
    ...atp,
    identitas: updatedIdentitas,
    atpList: filteredAtpList.length > 0 ? filteredAtpList : atp.atpList,
    materiPokokList: filteredMateri,
    elemenList: filteredElemenList,
  };
}

/**
 * Filter a KKTPDocument by selected class.
 */
export function filterKKTPDocumentByClass(kktp: KKTPDocument, selectedKelas: string): KKTPDocument {
  if (!selectedKelas || selectedKelas === 'all' || selectedKelas === 'semua') {
    return kktp;
  }

  const fase = kktp.identitas.fase || 'Fase C';
  const totalKktp = kktp.kktpList.length;

  const filteredKktpList = kktp.kktpList.filter((item, idx) =>
    doesItemMatchClass(item, selectedKelas, fase, idx, totalKktp)
  );

  const updatedIdentitas: SchoolIdentity = {
    ...kktp.identitas,
    kelas: selectedKelas,
  };

  return {
    ...kktp,
    identitas: updatedIdentitas,
    kktpList: filteredKktpList.length > 0 ? filteredKktpList : kktp.kktpList,
  };
}

/**
 * Counts the number of items per class for preview badges.
 */
export function countItemsByClass(
  items: Array<{
    kodeTP?: string;
    kelasTarget?: string;
    kelasCentang?: string[];
    urutanAlur?: number;
    urutan?: number;
  }>,
  fase: string
): { all: number; [kelas: string]: number } {
  const possibleClasses = getClassesForFase(fase);
  const total = items.length;
  const result: { all: number; [kelas: string]: number } = { all: total };

  possibleClasses.forEach((cls) => {
    result[cls] = items.filter((item, idx) => doesItemMatchClass(item, cls, fase, idx, total)).length;
  });

  return result;
}
