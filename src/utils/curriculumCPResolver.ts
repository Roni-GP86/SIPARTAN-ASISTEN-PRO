import { TPItem, BedahElemenRow, ATPDocument, SchoolIdentity } from '../types';
import { OFFICIAL_SUBJECT_FOLDERS } from '../data/officialCPDatabase';

export interface ResolvedCPPerElemen {
  elemen: string;
  capaianPembelajaran: string;
  kodeTPList: string[];
}

export interface CPResolutionResult {
  elemenString: string;
  capaianPembelajaranFormatted: string;
  perElemenList: ResolvedCPPerElemen[];
}

/**
 * Normalizes text for clean, resilient matching
 */
function cleanStr(s?: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds the official Capaian Pembelajaran text for an element from the official BSKAP database
 */
export function findOfficialElementCP(
  elementName: string,
  mataPelajaran?: string,
  fase?: string
): string | null {
  if (!elementName) return null;
  const cleanEl = cleanStr(elementName);

  // 1. Try finding by matching subject and fase
  const matchingFolders = OFFICIAL_SUBJECT_FOLDERS.filter((f) => {
    const mapelMatch = !mataPelajaran || cleanStr(f.mataPelajaran).includes(cleanStr(mataPelajaran)) || cleanStr(mataPelajaran).includes(cleanStr(f.mataPelajaran));
    const faseMatch = !fase || cleanStr(f.fase) === cleanStr(fase);
    return mapelMatch && faseMatch;
  });

  for (const folder of matchingFolders) {
    for (const el of folder.elemenList) {
      if (cleanStr(el.elemen) === cleanEl || cleanStr(el.elemen).includes(cleanEl) || cleanEl.includes(cleanStr(el.elemen))) {
        if (el.capaianPembelajaran && el.capaianPembelajaran.trim().length > 30) {
          return el.capaianPembelajaran.trim();
        }
      }
    }
  }

  // 2. Broad search across all folders if not found in specific folder
  for (const folder of OFFICIAL_SUBJECT_FOLDERS) {
    for (const el of folder.elemenList) {
      if (cleanStr(el.elemen) === cleanEl) {
        if (el.capaianPembelajaran && el.capaianPembelajaran.trim().length > 30) {
          return el.capaianPembelajaran.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Traces each selected TP to its source Element and retrieves the full, detailed Capaian Pembelajaran.
 * Based on Keputusan Kepala BSKAP No. 046 Tahun 2025.
 */
export function resolveCPPerElemenFromTPs(
  selectedTPs: Array<TPItem | { kodeTP: string; elemen?: string; kalimatCP?: string; rumusanTP?: string; lingkupMateri?: string }>,
  elemenRows?: BedahElemenRow[],
  atpDocument?: ATPDocument | null,
  identitas?: SchoolIdentity
): CPResolutionResult {
  if (!selectedTPs || selectedTPs.length === 0) {
    return {
      elemenString: 'Elemen Mapel',
      capaianPembelajaranFormatted: 'Peserta didik mampu memahami dan menerapkan konsep dalam memecahkan masalah kontekstual.',
      perElemenList: [],
    };
  }

  // Map to collect: elementName -> { elemen, capaianPembelajaran, kodeTPList }
  const elementMap = new Map<string, { elemen: string; capaianPembelajaran: string; kodeTPList: string[] }>();

  for (const tp of selectedTPs) {
    const kodeTP = tp.kodeTP || 'TP';

    // Step 1: Identify element name for this TP
    let detectedElemen = (tp.elemen || '').trim();

    // Try finding from elemenRows if not available or verify
    if (elemenRows && elemenRows.length > 0) {
      const matchedRow = elemenRows.find(
        (r) =>
          r.daftarTP?.some((t) => t.kodeTP === kodeTP) ||
          (detectedElemen && cleanStr(r.elemen) === cleanStr(detectedElemen))
      );
      if (matchedRow) {
        detectedElemen = matchedRow.elemen.trim();
      }
    }

    // Try finding from atpDocument
    if (!detectedElemen && atpDocument) {
      const atpItem = atpDocument.atpList?.find((a) => a.kodeTP === kodeTP);
      if (atpItem?.elemen) {
        detectedElemen = atpItem.elemen.trim();
      }
    }

    // Fallback if still empty: try identifying by mapel or TP text
    if (!detectedElemen) {
      detectedElemen = identitas?.mataPelajaran ? `Elemen ${identitas.mataPelajaran}` : 'Elemen Pembelajaran';
    }

    // Step 2: Retrieve the full, detailed Capaian Pembelajaran for this element
    let fullCP = '';

    // Priority A: from elemenRows (user's edited/approved full CP breakdown)
    if (elemenRows && elemenRows.length > 0) {
      const matchedRow = elemenRows.find(
        (r) =>
          cleanStr(r.elemen) === cleanStr(detectedElemen) ||
          r.daftarTP?.some((t) => t.kodeTP === kodeTP)
      );
      if (matchedRow && matchedRow.capaianPembelajaran && matchedRow.capaianPembelajaran.trim().length > 30) {
        fullCP = matchedRow.capaianPembelajaran.trim();
      }
    }

    // Priority B: from atpDocument.elemenList
    if (!fullCP && atpDocument?.elemenList && atpDocument.elemenList.length > 0) {
      const matchedEl = atpDocument.elemenList.find(
        (e) => cleanStr(e.elemen) === cleanStr(detectedElemen)
      );
      if (matchedEl && matchedEl.capaianPembelajaran && matchedEl.capaianPembelajaran.trim().length > 30) {
        fullCP = matchedEl.capaianPembelajaran.trim();
      }
    }

    // Priority C: from official BSKAP database
    if (!fullCP) {
      const officialCP = findOfficialElementCP(
        detectedElemen,
        identitas?.mataPelajaran,
        identitas?.fase
      );
      if (officialCP) {
        fullCP = officialCP;
      }
    }

    // Priority D: from tp.kalimatCP if reasonably detailed
    if (!fullCP && tp.kalimatCP && tp.kalimatCP.trim().length > 40) {
      fullCP = tp.kalimatCP.trim();
    }

    // Fallback if still empty
    if (!fullCP) {
      fullCP = `Pada akhir ${identitas?.fase || 'fase ini'}, peserta didik mampu memahami, menalar, dan mengaplikasikan kompetensi ${tp.lingkupMateri || detectedElemen} secara mendalam dalam konteks kehidupan sehari-hari.`;
    }

    // Key in map for unique element grouping
    const key = cleanStr(detectedElemen) || detectedElemen;
    if (!elementMap.has(key)) {
      elementMap.set(key, {
        elemen: detectedElemen,
        capaianPembelajaran: fullCP,
        kodeTPList: [kodeTP],
      });
    } else {
      const existing = elementMap.get(key)!;
      if (!existing.kodeTPList.includes(kodeTP)) {
        existing.kodeTPList.push(kodeTP);
      }
      // If existing had a shorter CP, upgrade it to fullCP
      if (fullCP.length > existing.capaianPembelajaran.length) {
        existing.capaianPembelajaran = fullCP;
      }
    }
  }

  const perElemenList = Array.from(elementMap.values());
  const elemenString = perElemenList.map((item) => item.elemen).join(' & ');

  let capaianPembelajaranFormatted = '';
  if (perElemenList.length === 1) {
    capaianPembelajaranFormatted = `Elemen: ${perElemenList[0].elemen}\n${perElemenList[0].capaianPembelajaran}`;
  } else {
    capaianPembelajaranFormatted = perElemenList
      .map((item) => `Elemen: ${item.elemen}\n${item.capaianPembelajaran}`)
      .join('\n\n');
  }

  return {
    elemenString,
    capaianPembelajaranFormatted,
    perElemenList,
  };
}

/**
 * Menghilangkan pendobelan teks atau kalimat identik yang berulang pada string TP
 */
export function deduplicateSentenceText(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Cek jika seluruh teks merupakan pengulangan 2 kali persis (misal "Peserta didik... Peserta didik...")
  const halfLen = Math.floor(cleaned.length / 2);
  for (let offset = -5; offset <= 5; offset++) {
    const splitPoint = halfLen + offset;
    if (splitPoint > 10 && splitPoint < cleaned.length - 10) {
      const firstHalf = cleaned.slice(0, splitPoint).trim();
      const secondHalf = cleaned.slice(splitPoint).trim();
      if (firstHalf.length > 15 && firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
        cleaned = firstHalf;
        break;
      }
    }
  }

  // 2. Cek jika ada 2 kalimat identik berturut-turut dipisahkan titik, koma, titik koma, atau spasi
  cleaned = cleaned.replace(/([^.!?]+[.!?])\s*\1+/gi, '$1');

  // 3. Cek pengulangan klausa panjang (>20 karakter) yang terduplikasi
  const clauses = cleaned.split(/(?<=[.!?])\s+/);
  if (clauses.length > 1) {
    const uniqueClauses: string[] = [];
    for (const c of clauses) {
      const trimC = c.trim();
      if (!trimC) continue;
      // Jangan masukkan jika klausa persis sama sudah ada
      if (!uniqueClauses.some(existing => existing.toLowerCase() === trimC.toLowerCase())) {
        uniqueClauses.push(trimC);
      }
    }
    cleaned = uniqueClauses.join(' ');
  }

  // 4. Bersihkan duplikasi kata/frase yang menempel berulang langsung, misal "Peserta didik Peserta didik"
  cleaned = cleaned.replace(/\b(\w+(?:\s+\w+){1,4})\s+\1\b/gi, '$1');

  return cleaned.trim();
}

/**
 * Membersihkan rumusan TP dari awalan kode TP yang berulang (misal "5.1", "TP 5.1:", dll)
 * dan mengembalikan murni kalimat isi TP tanpa kode di depannya serta tanpa pendobelan.
 */
export function cleanTPTextWithoutCode(kodeTP?: string, rumusanTP?: string): string {
  if (!rumusanTP) return '';
  let text = rumusanTP.trim();

  // Hapus awalan kode spesifik berulang-ulang dalam perulangan hingga bersih total
  let prevText = '';
  while (prevText !== text) {
    prevText = text;

    if (kodeTP && kodeTP.trim()) {
      const cleanCode = kodeTP.trim();
      const escapedCode = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const specificCodeRegex = new RegExp(`^(?:(?:\\[?\\s*${escapedCode}\\s*[\\]\\.:-]?\\s*)|(?:TP\\s*${escapedCode}\\s*[\\]\\.:-]?\\s*)|(?:TP\\s*[\\]\\.:-]?\\s*)|(?:\\d+(?:\\.\\d+)*\\s*[\\]\\.:-]?\\s*))+`, 'i');
      text = text.replace(specificCodeRegex, '').trim();
    }

    // Hapus awalan format umum "TP 5.1:", "5.1.", "1. ", "TP.", dll
    const genericCodeRegex = /^(?:(?:TP\s*[\.:-]?\s*)?(?:\[?\s*\d+(?:\.\d+)*\s*[\]\.:-]?\s*))+/i;
    text = text.replace(genericCodeRegex, '').trim();

    // Hapus tanda baca pembuka yang tersisa seperti ":", "-", atau "."
    text = text.replace(/^[:\-\.\s]+/, '').trim();
  }

  // Hapus duplikasi kalimat jika ada
  text = deduplicateSentenceText(text);

  return text;
}

/**
 * Memastikan penulisan TP selalu diawali satu kode TP resmi tanpa pendobelan penulisan
 * (Contoh: "5.1 Peserta didik mampu...") per regulasi Kurikulum Merdeka.
 */
export function formatTPWithCode(kodeTP?: string, rumusanTP?: string): string {
  if (!rumusanTP) return '';
  const cleanBody = cleanTPTextWithoutCode(kodeTP, rumusanTP);
  
  if (!kodeTP || !kodeTP.trim()) {
    return cleanBody;
  }

  const cleanCode = kodeTP.trim();
  // Cegah pendobelan jika cleanBody masih mengandung cleanCode di depannya
  if (cleanBody.toLowerCase().startsWith(cleanCode.toLowerCase())) {
    return cleanBody;
  }

  return `${cleanCode} ${cleanBody}`;
}

/**
 * Normalizes Capaian Pembelajaran (CP) text to ensure it is written in standard prose paragraph format,
 * strictly matching the official original text ("versi asli, bukan dalam bentuk poin-poin").
 * Removes bullet points (●, •, etc.) and joins clauses naturally into continuous prose.
 */
export function formatCPElemenText(rawText?: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // If text contains bullet points (e.g. ● or •) or bulleted newlines
  if (/[●•]/.test(text)) {
    // Remove introduction if it's like "Mampu menerapkan keterampilan proses yang meliputi:"
    text = text.replace(/^Mampu\s+menerapkan\s+keterampilan\s+proses\s+yang\s+meliputi\s*:\s*/i, '');
    
    // Replace bullet points followed by heading and text
    // E.g. "● Mengamati\nMurid..." -> "Mengamati: Murid..."
    text = text.replace(/●\s*([A-Za-z\s,]+)\n\s*/g, '$1: ');
    text = text.replace(/•\s*([A-Za-z\s,]+)\n\s*/g, '$1: ');
    
    // Remove any leftover bullet symbols
    text = text.replace(/[●•]\s*/g, '');
  }

  // Normalize duplicate newlines or extra spaces into cohesive paragraph flow
  text = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ');

  // Clean multiple spaces
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Resolves the structured elements list for an ATP document, guaranteeing clean separation
 * and official paragraph-formatted Capaian Pembelajaran per element.
 */
export function resolveElemenListForATP(atp: ATPDocument): Array<{ id?: string; elemen: string; capaianPembelajaran: string; deskripsiSingkat?: string }> {
  // If atp.elemenList already has valid elements
  if (atp.elemenList && atp.elemenList.length > 0) {
    return atp.elemenList.map((el, idx) => ({
      ...el,
      elemen: el.elemen.replace(/^Elemen\s+/i, '').trim(),
      capaianPembelajaran: formatCPElemenText(el.capaianPembelajaran),
    }));
  }

  // Check if subject matches official folders (e.g. IPAS)
  const mapel = atp.identitas?.mataPelajaran || '';
  const fase = atp.identitas?.fase || '';
  const matchingFolder = OFFICIAL_SUBJECT_FOLDERS.find(f => {
    const mMatch = cleanStr(f.mataPelajaran).includes(cleanStr(mapel)) || cleanStr(mapel).includes(cleanStr(f.mataPelajaran));
    const fMatch = !fase || cleanStr(f.fase) === cleanStr(fase);
    return mMatch && fMatch;
  });

  if (matchingFolder && matchingFolder.elemenList.length > 0) {
    return matchingFolder.elemenList.map((el) => ({
      id: el.id,
      elemen: el.elemen.replace(/^Elemen\s+/i, '').trim(),
      capaianPembelajaran: formatCPElemenText(el.capaianPembelajaran),
      deskripsiSingkat: el.deskripsiSingkat,
    }));
  }

  // Check if atp.capaianPembelajaran contains brackets like [Elemen 1]: ... [Elemen 2]: ...
  const rawCP = atp.capaianPembelajaran || '';
  const bracketMatches = Array.from(rawCP.matchAll(/\[([^\]]+)\]:\s*([\s\S]*?)(?=(?:\[[^\]]+\]:|$))/g));
  if (bracketMatches.length > 0) {
    return bracketMatches.map((m, idx) => ({
      id: `el-parsed-${idx}`,
      elemen: m[1].replace(/^Elemen\s+/i, '').trim(),
      capaianPembelajaran: formatCPElemenText(m[2].trim()),
    }));
  }

  // Fallback single element
  const fallbackElemen = (atp.elemen || 'Elemen Pembelajaran').replace(/^Elemen\s+/i, '').trim();
  return [
    {
      id: 'el-single',
      elemen: fallbackElemen,
      capaianPembelajaran: formatCPElemenText(rawCP),
    },
  ];
}

/**
 * Resolves a single clean element name for a TP in the ATP table.
 * Prevents concatenation strings like "Pemahaman IPAS & Keterampilan Proses" in individual TP rows.
 */
export function resolveSingleElemenForTP(
  itemElemen?: string,
  atpElemen?: string,
  tpText?: string,
  lingkupMateri?: string,
  elemenList?: Array<{ elemen: string }>
): string {
  const cleanItem = (itemElemen || '').replace(/^Elemen\s+/i, '').trim();
  if (cleanItem && !cleanItem.includes('&') && !cleanItem.toLowerCase().includes('seluruh')) {
    return cleanItem;
  }

  if (elemenList && elemenList.length > 0) {
    const combinedContent = `${tpText || ''} ${lingkupMateri || ''}`.toLowerCase();
    
    // Check for IPAS process skills
    const isProcessSkill = /mengamati|penyelidikan|prediksi|observasi|turus|grafik|diagram|refleksi|komunikasi|eksperimen|percobaan/i.test(combinedContent);
    const kpElement = elemenList.find(e => /keterampilan\s*proses/i.test(e.elemen));
    const pemahamanElement = elemenList.find(e => /pemahaman/i.test(e.elemen));

    if (isProcessSkill && kpElement) {
      return kpElement.elemen.replace(/^Elemen\s+/i, '').trim();
    }
    if (pemahamanElement) {
      return pemahamanElement.elemen.replace(/^Elemen\s+/i, '').trim();
    }
    return elemenList[0].elemen.replace(/^Elemen\s+/i, '').trim();
  }

  if (atpElemen && !atpElemen.includes('&')) {
    return atpElemen.replace(/^Elemen\s+/i, '').trim();
  }

  if (cleanItem && cleanItem.includes('&')) {
    return cleanItem.split('&')[0].trim();
  }

  return cleanItem || '-';
}
