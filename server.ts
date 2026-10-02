import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  generatePedagogicalTPFallback,
  generateMultiElementTPFallback,
  generatePedagogicalATPFallback,
  generatePedagogicalKKTPFallback,
  generatePedagogicalModulFallback,
  getStatutoryJP,
  calibrateJPList,
  isSyntaxMatchingModel,
  cleanActivityText,
} from "./server/curriculumEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Fast Health Check Endpoint for Cloud Run
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Server-side Gemini client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Multi-model Gemini Caller with automatic resilience
async function callGeminiStructured<T>(
  prompt: string,
  systemInstruction: string,
  responseSchema: any
): Promise<T | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  // Ordered fallback models
  const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.7-flash"];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          return parsed as T;
        }
      }
    } catch {
      // If access is restricted or key denied, quietly fallback to next model or curriculum engine
    }
  }

  return null;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint 1: Analisis Capaian Pembelajaran menjadi Kompetensi, Lingkup Materi, dan Tujuan Pembelajaran (TP)
app.post("/api/generate-tp", async (req, res) => {
  try {
    const { identitas, elemen, capaianPembelajaran, selectedElements, preferensiTambahan } = req.body;

    const elementList: Array<{ id?: string; elemen: string; capaianPembelajaran: string }> =
      Array.isArray(selectedElements) && selectedElements.length > 0
        ? selectedElements.filter((e: any) => e.capaianPembelajaran && e.capaianPembelajaran.trim())
        : capaianPembelajaran && capaianPembelajaran.trim()
        ? [{ id: 'el-1', elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran }]
        : [];

    if (elementList.length === 0) {
      return res.status(400).json({ error: "Capaian Pembelajaran (CP) untuk minimal 1 elemen wajib diisi." });
    }

    const systemInstruction = `Anda adalah pakar kurikulum pendidikan dasar nasional Indonesia (Kurikulum Merdeka) dari Kemendikdasmen / Kemendikbudristek RI, dengan spesialisasi jenjang Sekolah Dasar (SD / MI): Fase A (Kelas 1-2), Fase B (Kelas 3-4), dan Fase C (Kelas 5-6) yang berpedoman pada Keputusan Kepala BSKAP No. 046 Tahun 2025 dan Permendikdasmen No. 13 Tahun 2025 (Standar Alokasi Waktu Pembelajaran SD: 1 JP = 35 Menit).
Tugas Anda adalah menganalisis Capaian Pembelajaran (CP) untuk SATU MATA PELAJARAN UTUH yang terdiri dari 1 atau lebih ELEMEN secara terpisah dan komprehensif.

ATURAN STRUKTURAL DAN PEDAGOGIS MUTLAK:
1. Deskripsi CP SETIAP ELEMEN JANGAN DIGABUNGKAN, analisis harus dibuat mandiri per masing-masing elemen.
2. KAIDAH DEKOMPOSISI GRANULAR 1 KOMPETENSI / 1 KONTEN = 1 TUJUAN PEMBELAJARAN (PRINSIP NON-LUMPING):
   - Jangan pernah menggabungkan beberapa kompetensi atau materi ke dalam satu rumusan TP, meskipun dalam kalimat CP terdapat kata penghubung 'dan', 'serta', 'maupun', atau tanda baca koma ','.
   - Setiap Kata Kerja Operasional (KKO) dan materi inti menuntut instrumen penilaian/KKTP yang berbeda, sehingga wajib berdiri sendiri sebagai butir Tujuan Pembelajaran (TP) mandiri.
3. Uraikan daftar Kompetensi bernomor:
   - Identifikasi setiap KKO secara spesifik: 1. [KKO A], 2. [KKO B], 3. [KKO C], 4. [KKO D], dst.
4. Uraikan daftar Lingkup Materi bernomor:
   - Identifikasi setiap materi pokok secara spesifik: 1. [Materi A], 2. [Materi B], 3. [Materi C], 4. [Materi D], dst.
5. MANDATORI RASIO 1 : 1 JUMLAH TP DENGAN KOMPETENSI DAN MATERI (CAKUPAN PENUH 100%):
   - JUMLAH BUTIR TP WAJIB MEMILIKI RASIO 1 : 1 DENGAN BUTIR KOMPETENSI DAN MATERI.
   - CONTOH NYATA: JIKA PADA SUATU ELEMEN TERDAPAT 4 KOMPETENSI DAN 4 LINGKUP MATERI, MAKA PADA DAFTAR TP WAJIB DIRUMUSKAN TEPAT 4 BUTIR TP MANDIRI (DILARANG MEREDUKSI/MERINGKAS MENJADI HANYA 2 ATAU 3 TP)!
   - Jika terdapat 6 kompetensi dan 6 materi -> susun tepat 6 butir TP!
   - Butir TP 1 memetakan Kompetensi 1 dan Materi 1: (Peserta didik mampu [KKO 1] [Materi 1]...)
   - Butir TP 2 memetakan Kompetensi 2 dan Materi 2: (Peserta didik mampu [KKO 2] [Materi 2]...)
   - Butir TP 3 memetakan Kompetensi 3 dan Materi 3: (Peserta didik mampu [KKO 3] [Materi 3]...)
   - Butir TP 4 memetakan Kompetensi 4 dan Materi 4: (Peserta didik mampu [KKO 4] [Materi 4]...)
6. KORELASI KETAT TUJUAN PEMBELAJARAN (TP) DENGAN KOLOM KELAS (TANDA CENTANG 'v' ATAU STREP '-'):
   - Tentukan target kelas (Kelas 1 atau 2 untuk Fase A; Kelas 3 atau 4 untuk Fase B; Kelas 5 atau 6 untuk Fase C) secara cermat berdasarkan hierarki kognitif:
     * Kompetensi dan materi dasar/fondasi dialokasikan ke kelas awal fase (Kelas 1 pada Fase A, Kelas 3 pada Fase B, Kelas 5 pada Fase C).
     * Kompetensi dan materi lanjutan/pendalaman/analisis dialokasikan ke kelas kedua fase (Kelas 2 pada Fase A, Kelas 4 pada Fase B, Kelas 6 pada Fase C).
   - Pada schema, tetapkan 'kelasTarget' dan 'kelasCentang' (array berisi kelas yang diajarkan, misalnya ["3"] atau ["4"]) secara tepat sehingga tanda centang ('v') dan tanda strep ('-') pada kolom kelas sesuai 100% dengan poin kompetensi dan konten yang dirumuskan.
7. MANDATORI DPL (DIMENSI PROFIL LULUSAN / P3): SETIAP butir/nomor/kode TP WAJIB memiliki MINIMAL 3 Dimensi Profil Lulusan (contoh: ['Bernalar Kritis', 'Mandiri', 'Gotong Royong']). Jangan berikan kurang dari 3 dimensi per butir TP!
8. ALOKASI WAKTU PERMENDIKDASMEN NO. 13 TAHUN 2025: Alokasi JP per TP dihitung berbasis jam pelajaran SD (1 JP = 35 Menit) dengan distribusi jam intrakurikuler yang proporsional sesuai fase.

Output HARUS berupa JSON murni sesuai schema.`;

    const elementsFormatted = elementList
      .map((el, i) => `--- ELEMEN ${i + 1}: ${el.elemen} ---\nCP: ${el.capaianPembelajaran}`)
      .join('\n\n');

    const prompt = `Analisis Capaian Pembelajaran SD/MI untuk seluruh elemen mata pelajaran berikut:
Mata Pelajaran: ${identitas?.mataPelajaran || "IPAS"}
Fase / Pilihan Kelas: ${identitas?.fase || "Fase B"} (Kelas ${identitas?.fase === 'Fase A' ? '1 & 2' : identitas?.fase === 'Fase C' ? '5 & 6' : '3 & 4'})
Tahun Pelajaran: ${identitas?.tahunPelajaran || "2026/2027"}

Daftar Elemen & Capaian Pembelajaran:
${elementsFormatted}

Catatan Khusus Guru: ${preferensiTambahan || "Susun analisis CP ke TP komprehensif untuk seluruh elemen dalam satu mata pelajaran secara utuh sesuai regulasi BSKAP 046/2025."}
PANDUAN MUTLAK 1:1 JUMLAH TP: Wajib dekonstruksi secara granular tanpa penggabungan (non-lumping). Jika ditemukan 4 kompetensi dan 4 materi, susun tepat 4 TP relevan (jangan diringkas jadi 2 atau 3). Setiap kompetensi dan materi harus memiliki butir TP mandiri.`;

    const tpSchema = {
      type: Type.OBJECT,
      properties: {
        rasionalAnalisis: {
          type: Type.STRING,
          description: "Penjelasan ringkas strategi dekonstruksi CP seluruh elemen mata pelajaran",
        },
        elemenRows: {
          type: Type.ARRAY,
          description: "Hasil bedah CP ke TP per masing-masing elemen",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              elemen: { type: Type.STRING },
              capaianPembelajaran: { type: Type.STRING },
              daftarKompetensi: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Contoh: ['1. Menganalisis', '2. Membuat simulasi']",
              },
              daftarLingkupMateri: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Contoh: ['1. Bentuk dan fungsi bagian tubuh tumbuhan', '2. Siklus hidup makhluk hidup']",
              },
              daftarTP: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kodeTP: { type: Type.STRING, description: "Contoh: 3.1, 3.2, 4.1" },
                    kompetensi: { type: Type.STRING },
                    lingkupMateri: { type: Type.STRING },
                    rumusanTP: { type: Type.STRING },
                    indikatorKetercapaian: { type: Type.STRING },
                    alokasiJP: { type: Type.INTEGER },
                    dimensiP3: { type: Type.ARRAY, items: { type: Type.STRING } },
                    semesterTarget: { type: Type.STRING },
                    kelasTarget: { type: Type.STRING, description: "Kelas spesifik (misal '3' atau '4')" },
                    kelasCentang: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array kelas yang dicentang 'v', misal ['3'] atau ['4']",
                    },
                    urutanAlur: { type: Type.INTEGER },
                  },
                  required: ["kodeTP", "kompetensi", "lingkupMateri", "rumusanTP", "alokasiJP", "dimensiP3", "kelasTarget", "kelasCentang", "urutanAlur"],
                },
              },
            },
            required: ["elemen", "capaianPembelajaran", "daftarKompetensi", "daftarLingkupMateri", "daftarTP"],
          },
        },
      },
      required: ["rasionalAnalisis", "elemenRows"],
    };

    let result = await callGeminiStructured<any>(prompt, systemInstruction, tpSchema);

    const fase = identitas?.fase || 'Fase B';
    const kelasOptions = fase === 'Fase A' ? ['1', '2'] : fase === 'Fase B' ? ['3', '4'] : ['5', '6'];

    if (!result || !result.elemenRows || result.elemenRows.length === 0) {
      result = generateMultiElementTPFallback(identitas || {}, elementList, preferensiTambahan);
    } else {
      result.kelasTersedia = kelasOptions;
      const flatTPs: any[] = [];
      let counter = 1;

      result.elemenRows = result.elemenRows.map((row: any, rIdx: number) => {
        const rowId = row.id || `el-row-${rIdx + 1}`;
        const DPL_DEFAULTS = [
          'Bernalar Kritis',
          'Mandiri',
          'Gotong Royong',
          'Kreatif',
          'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
          'Berkebhinekaan Global',
        ];

        let rawTPs = Array.isArray(row.daftarTP) ? [...row.daftarTP] : [];
        const rawKomp = Array.isArray(row.daftarKompetensi) ? row.daftarKompetensi : [];
        const rawMat = Array.isArray(row.daftarLingkupMateri) ? row.daftarLingkupMateri : [];
        const targetCount = Math.max(rawKomp.length, rawMat.length);

        // Safeguard: Ensure 1:1 coverage without reduction (if LLM returned fewer TPs)
        if (rawTPs.length < targetCount) {
          for (let fillIdx = rawTPs.length; fillIdx < targetCount; fillIdx++) {
            const kompRaw = rawKomp[fillIdx] ? rawKomp[fillIdx].replace(/^\d+\.\s*/, '').trim() : 'Menganalisis';
            const matRaw = rawMat[fillIdx] ? rawMat[fillIdx].replace(/^\d+\.\s*/, '').trim() : `Materi ${row.elemen}`;
            const targetK = kelasOptions[fillIdx < Math.ceil(targetCount / 2) ? 0 : 1];
            rawTPs.push({
              kodeTP: `${targetK}.${fillIdx + 1}`,
              kompetensi: kompRaw,
              lingkupMateri: matRaw,
              rumusanTP: `Peserta didik mampu ${kompRaw.toLowerCase()} ${matRaw.toLowerCase()} secara tepat dan kontekstual.`,
              indikatorKetercapaian: `Peserta didik dapat mendemonstrasikan pemahaman materi ${matRaw.toLowerCase()} melalui asesmen dan unjuk kerja mandiri.`,
              alokasiJP: 4,
              dimensiP3: ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'],
              semesterTarget: fillIdx < Math.ceil(targetCount / 2) ? 'Semester 1' : 'Semester 2',
              kelasTarget: targetK,
              kelasCentang: [targetK],
              urutanAlur: fillIdx + 1,
            });
          }
        }

        const rowTPs = rawTPs.map((tp: any, tIdx: number) => {
          let kTarget = String(tp.kelasTarget || '').replace(/^kelas\s*/i, '').trim();
          if (!kelasOptions.includes(kTarget)) {
            kTarget = kelasOptions[tIdx < Math.ceil(row.daftarTP.length / 2) ? 0 : 1];
          }

          let rawCentang = Array.isArray(tp.kelasCentang)
            ? tp.kelasCentang.map((c: any) => String(c).replace(/^kelas\s*/i, '').trim())
            : [kTarget];
          rawCentang = rawCentang.filter((c: string) => kelasOptions.includes(c));
          if (rawCentang.length === 0) {
            rawCentang = [kTarget];
          }

          let dpl = Array.isArray(tp.dimensiP3) ? [...tp.dimensiP3] : [];
          if (dpl.length < 3) {
            for (const d of DPL_DEFAULTS) {
              if (!dpl.includes(d)) dpl.push(d);
              if (dpl.length >= 3) break;
            }
          }

          const tpObj = {
            ...tp,
            id: tp.id || `tp-${Date.now()}-${rIdx}-${tIdx + 1}`,
            elemen: row.elemen,
            kalimatCP: row.capaianPembelajaran,
            dimensiP3: dpl,
            kelasTarget: kTarget,
            kelasCentang: rawCentang,
            urutanAlur: counter++,
          };
          flatTPs.push(tpObj);
          return tpObj;
        });

        return {
          ...row,
          id: rowId,
          daftarTP: rowTPs,
        };
      });

      result.daftarTP = flatTPs;
      result.daftarKompetensi = result.elemenRows.flatMap((r: any) => r.daftarKompetensi || []);
      result.daftarLingkupMateri = result.elemenRows.flatMap((r: any) => r.daftarLingkupMateri || []);

      // Calibrate TP JP allocations to meet statutory intrakurikuler allocation of Permendikdasmen No. 13 Tahun 2025
      const mapel = identitas?.mataPelajaran || '';
      const k1 = kelasOptions[0];
      const k2 = kelasOptions[1];
      const statJP1 = getStatutoryJP(mapel, k1);
      const statJP2 = getStatutoryJP(mapel, k2);

      const k1TPs = flatTPs.filter((t: any) => t.kelasTarget === k1);
      const k2TPs = flatTPs.filter((t: any) => t.kelasTarget === k2);

      calibrateJPList(k1TPs, statJP1);
      calibrateJPList(k2TPs, statJP2);

      // Sync calibrated JP back to elemenRows
      result.elemenRows.forEach((row: any) => {
        if (Array.isArray(row.daftarTP)) {
          row.daftarTP.forEach((tp: any) => {
            const matched = flatTPs.find((f: any) => f.id === tp.id);
            if (matched) {
              tp.alokasiJP = matched.alokasiJP;
            }
          });
        }
      });
    }

    res.json(result);
  } catch {
    const { identitas, elemen, capaianPembelajaran, selectedElements, preferensiTambahan } = req.body;
    const elementList =
      Array.isArray(selectedElements) && selectedElements.length > 0
        ? selectedElements
        : [{ id: 'el-1', elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran || '' }];
    const fallback = generateMultiElementTPFallback(identitas || {}, elementList, preferensiTambahan);
    res.json(fallback);
  }
});

// Endpoint 2: Penyusunan Dokumen Alur Tujuan Pembelajaran (ATP) Lengkap 8 Bagian (A s.d H)
app.post("/api/generate-atp", async (req, res) => {
  try {
    const { identitas, elemen, capaianPembelajaran, tpList, selectedElements, elemenList: reqElemenList, preferensiTambahan } = req.body;

    const rawElemenList: Array<{ id?: string; elemen: string; capaianPembelajaran: string; deskripsiSingkat?: string }> =
      Array.isArray(reqElemenList) && reqElemenList.length > 0
        ? reqElemenList
        : Array.isArray(selectedElements) && selectedElements.length > 0
        ? selectedElements
        : capaianPembelajaran && capaianPembelajaran.trim()
        ? [{ id: 'el-1', elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran }]
        : [];

    if ((!capaianPembelajaran && rawElemenList.length === 0) || !tpList || !Array.isArray(tpList) || tpList.length === 0) {
      return res.status(400).json({ error: "Data TP dan Capaian Pembelajaran diperlukan untuk menyusun ATP." });
    }

    const systemInstruction = `Anda adalah ahli kurikulum Kurikulum Merdeka Indonesia jenjang Sekolah Dasar (SD / MI) untuk Fase A (Kelas 1-2), Fase B (Kelas 3-4), dan Fase C (Kelas 5-6) berpedoman pada Keputusan Kepala BSKAP No. 046 Tahun 2025 dan Permendikdasmen No. 13 Tahun 2025.
Susun Dokumen Alur Tujuan Pembelajaran (ATP) resmi dan lengkap untuk 1 MATA PELAJARAN UTUH dengan struktur 8 Bagian baku:

MANDATORI STRUKTUR DAN ATURAN KHUSUS:
1. 1 MATA PELAJARAN DIBUAT SEKALIGUS NAMUN DIKELOMPOKKAN PER ELEMEN.
2. DESKRIPSI ELEMEN DAN CAPAIAN PEMBELAJARAN (CP) JANGAN DIGABUNGKAN, TAPI DIBUAT TERPISAH PER ELEMEN! Sajikan setiap elemen dengan teks CP-nya masing-masing secara utuh dan jelas.
3. SETIAP NOMOR / KODE TP DI TABEL ATP WAJIB MEMILIKI MINIMAL 3 DIMENSI PROFIL LULUSAN (DPL / PROFIL PELAJAR PANCASILA). PENTING: Pilihan Dimensi Profil Lulusan HARUS RELEVAN dengan materi, tujuan, dan aktivitas pembelajaran pada butir tersebut! Jangan menggunakan template berulang secara membabi-buta. Pilihlah dimensi (seperti Bernalar Kritis, Mandiri, Gotong Royong, Kreatif, Berkebinekaan Global, atau Beriman & Bertaqwa) yang secara kontekstual paling tepat. Jangan pernah memberikan kurang dari 3 DPL.
4. Cantumkan nama elemen pada setiap butir alur TP.
5. STANDAR ALOKASI WAKTU PERMENDIKDASMEN NO. 13 TAHUN 2025:
   - Durasi 1 JP pembelajaran SD seluruh fase adalah 35 Menit.
   - Asumsi minggu efektif: 36 minggu per tahun (Kelas 1-5) dan 32 minggu per tahun (Kelas 6).
   - Akumulasi alokasi JP intrakurikuler pada TP dan estimasi JP Bab Materi Pokok wajib relevan dengan beban belajar intrakurikuler resmi (contoh: Matematika Fase C = 5 JP/minggu, 90 JP/semester, 180 JP/tahun; IPAS Fase B = 5 JP/minggu, 180 JP/tahun).

Bagian Dokumen:
A. IDENTITAS: Satuan Pendidikan, Guru, Kepala Sekolah, Mata Pelajaran, Fase, Kelas, Tahun Pelajaran, Alokasi Waktu Total.
B & C. ELEMEN & CAPAIAN PEMBELAJARAN TERPISAH: Sajikan daftar elemen dan teks Capaian Pembelajaran masing-masing elemen secara terpisah dan lengkap.
D. ALUR TUJUAN PEMBELAJARAN (ATP): Tabel Alur hierarkis dari awal ke akhir fase/kelas, dilengkapi Kode TP, Elemen, Rumusan TP, Lingkup Materi, Alokasi JP, Dimensi Profil Lulusan (minimal 3 DPL), Semester, Indikator Ketercapaian (IKTP), dan Ringkasan Kegiatan Inti.
E. MATERI POKOK & SUB-MATERI: Pengelompokan Bab/Unit pembelajaran terstruktur per elemen beserta sub-materi dan estimasi JP.
F. DIMENSI PROFIL LULUSAN (DPL): Deskripsi integrasi nilai-nilai DPL dalam pembelajaran.
G. GLOSARIUM: Istilah esensial dan definisinya.
H. DAFTAR PUSTAKA: Buku guru/siswa resmi Kemendikdasmen, Permendikdasmen No. 13 Tahun 2025, dan BSKAP 046/2025.

Format output HARUS berupa JSON murni sesuai schema.`;

    const elementsFormatted = rawElemenList
      .map((el, i) => `--- ELEMEN ${i + 1}: ${el.elemen} ---\nCP: ${el.capaianPembelajaran}`)
      .join('\n\n');

    const prompt = `Susun Dokumen ATP SD/MI 1 Mata Pelajaran Utuh dengan deskripsi CP terpisah per elemen dan minimal 3 DPL per nomor TP berdasarkan data berikut:
Identitas Sekolah & Guru:
- Satuan Pendidikan: ${identitas?.namaSatuanPendidikan || "SD Negeri Fatubai"}
- Guru Kelas / Mata Pelajaran: ${identitas?.namaGuru || "Haryanto Roni Bhidju, S.Pd.SD"}
- NIP Guru: ${identitas?.nipGuru || "19880512 201402 1 002"}
- Kepala Sekolah: ${identitas?.namaKepalaSekolah || "Darius Kusi, S.Pd."}
- NIP Kepala Sekolah: ${identitas?.nipKepalaSekolah || "196709192008011008"}
- Mata Pelajaran: ${identitas?.mataPelajaran || "Matematika"}
- Fase / Kelas: ${identitas?.fase || "Fase C"} / ${identitas?.kelas || "5 & 6"}
- Tahun Pelajaran: ${identitas?.tahunPelajaran || "2026/2027"}
- Semester: ${identitas?.semester || "1 (Ganjil)"}

Daftar Elemen dan Capaian Pembelajaran (Terpisah Per Elemen):
${elementsFormatted || capaianPembelajaran}

Daftar TP yang telah dianalisis sebelumnya:
${JSON.stringify(tpList, null, 2)}

Catatan Tambahan: ${preferensiTambahan || "Pastikan seluruh elemen tercakup secara mandiri, dan setiap kode TP memuat minimal 3 Dimensi Profil Lulusan (DPL)."}`;

    const atpSchema = {
      type: Type.OBJECT,
      properties: {
        rasionalPenyusunan: {
          type: Type.STRING,
          description: "Rasionalisasi alur pembelajaran dari sederhana ke kompleks per elemen",
        },
        elemenList: {
          type: Type.ARRAY,
          description: "Daftar elemen dan teks CP yang terpisah per elemen (Bagian B & C)",
          items: {
            type: Type.OBJECT,
            properties: {
              elemen: { type: Type.STRING },
              capaianPembelajaran: { type: Type.STRING },
              deskripsiSingkat: { type: Type.STRING },
            },
            required: ["elemen", "capaianPembelajaran"],
          },
        },
        atpList: {
          type: Type.ARRAY,
          description: "Daftar urutan alur tujuan pembelajaran (Bagian D) dengan minimal 3 DPL per nomor TP",
          items: {
            type: Type.OBJECT,
            properties: {
              kodeTP: { type: Type.STRING },
              urutan: { type: Type.INTEGER },
              elemen: { type: Type.STRING, description: "Nama elemen dari TP tersebut" },
              tujuanPembelajaran: { type: Type.STRING },
              lingkupMateri: { type: Type.STRING },
              alokasiJP: { type: Type.INTEGER },
              semester: { type: Type.STRING },
              dimensiP3: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Minimal 3 Dimensi Profil Lulusan (DPL)",
              },
              indikatorKetercapaian: { type: Type.STRING },
              kegiatanPembelajaranInti: { type: Type.STRING },
            },
            required: ["kodeTP", "urutan", "tujuanPembelajaran", "lingkupMateri", "alokasiJP", "semester", "dimensiP3", "indikatorKetercapaian"],
          },
        },
        materiPokokList: {
          type: Type.ARRAY,
          description: "Struktur Materi Pokok dan Sub-Materi (Bagian E)",
          items: {
            type: Type.OBJECT,
            properties: {
              bab: { type: Type.STRING, description: "Contoh: Bab 1 (Elemen Bilangan)" },
              judulMateri: { type: Type.STRING },
              subMateri: { type: Type.ARRAY, items: { type: Type.STRING } },
              perkiraanJP: { type: Type.INTEGER },
            },
            required: ["bab", "judulMateri", "subMateri", "perkiraanJP"],
          },
        },
        dimensiProfilLulusan: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Dimensi Profil Pelajar Pancasila yang dikembangkan (Bagian F)",
        },
        penjelasanDPL: {
          type: Type.STRING,
          description: "Deskripsi integrasi nilai-nilai DPL dalam proses belajar",
        },
        glosarium: {
          type: Type.ARRAY,
          description: "Daftar istilah dan artinya (Bagian G)",
          items: {
            type: Type.OBJECT,
            properties: {
              istilah: { type: Type.STRING },
              definisi: { type: Type.STRING },
            },
            required: ["istilah", "definisi"],
          },
        },
        daftarPustaka: {
          type: Type.ARRAY,
          description: "Daftar referensi kepustakaan standar akademik (Bagian H)",
          items: {
            type: Type.OBJECT,
            properties: {
              penulis: { type: Type.STRING },
              tahun: { type: Type.STRING },
              judul: { type: Type.STRING },
              penerbit: { type: Type.STRING },
              kota: { type: Type.STRING },
              keterangan: { type: Type.STRING },
            },
            required: ["penulis", "tahun", "judul", "penerbit"],
          },
        },
      },
      required: [
        "rasionalPenyusunan",
        "atpList",
        "materiPokokList",
        "dimensiProfilLulusan",
        "penjelasanDPL",
        "glosarium",
        "daftarPustaka",
      ],
    };

    let result = await callGeminiStructured<any>(prompt, systemInstruction, atpSchema);

    if (!result || !result.atpList || result.atpList.length === 0) {
      result = generatePedagogicalATPFallback(
        identitas || {},
        elemen || "",
        capaianPembelajaran || "",
        tpList,
        preferensiTambahan,
        rawElemenList
      );
    }

    const DPL_DEFAULTS = [
      'Bernalar Kritis',
      'Mandiri',
      'Gotong Royong',
      'Kreatif',
      'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
      'Berkebhinekaan Global',
    ];

    // Ensure elemenList is strictly populated with original rawElemenList if provided
    if (rawElemenList && rawElemenList.length > 0) {
      result.elemenList = rawElemenList;
    } else if (!result.elemenList || result.elemenList.length === 0) {
      result.elemenList = [{ elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran || '' }];
    }

    // Ensure all ATP items have at least 3 DPL and proper element tag
    result.atpList = result.atpList.map((item: any, idx: number) => {
      let dpl = Array.isArray(item.dimensiP3) ? [...item.dimensiP3] : [];
      if (dpl.length < 3) {
        for (const d of DPL_DEFAULTS) {
          if (!dpl.includes(d)) dpl.push(d);
          if (dpl.length >= 3) break;
        }
      }

      // Match corresponding TP to inherit element if missing
      const matchingTP = tpList.find((t: any) => t.kodeTP === item.kodeTP || t.rumusanTP === item.tujuanPembelajaran);
      let assignedElemen = matchingTP?.elemen || item.elemen;
      if (!assignedElemen || assignedElemen.includes('&') || assignedElemen.toLowerCase().includes('seluruh')) {
        assignedElemen = result.elemenList[0]?.elemen || elemen;
      }

      return {
        ...item,
        id: item.id || `atp-item-${idx + 1}`,
        elemen: assignedElemen,
        dimensiP3: dpl,
      };
    });

    // Calibrate ATP items to match statutory JP from Permendikdasmen No. 13 Tahun 2025
    const mapel = identitas?.mataPelajaran || '';
    const fase = identitas?.fase || 'Fase B';
    const kelasOptions = fase === 'Fase A' ? ['1', '2'] : fase === 'Fase C' ? ['5', '6'] : ['3', '4'];
    const k1 = kelasOptions[0];
    const k2 = kelasOptions[1];
    const statJP1 = getStatutoryJP(mapel, k1);
    const statJP2 = getStatutoryJP(mapel, k2);

    const k1ATP = result.atpList.filter((item: any) => String(item.kodeTP || '').startsWith(k1));
    const k2ATP = result.atpList.filter((item: any) => String(item.kodeTP || '').startsWith(k2));

    if (k1ATP.length > 0) calibrateJPList(k1ATP, statJP1);
    if (k2ATP.length > 0) calibrateJPList(k2ATP, statJP2);
    if (k1ATP.length === 0 && k2ATP.length === 0) {
      calibrateJPList(result.atpList, statJP1 + statJP2);
    }

    res.json(result);
  } catch {
    const { identitas, elemen, capaianPembelajaran, tpList, selectedElements, elemenList: reqElemenList, preferensiTambahan } = req.body;
    const rawElemenList =
      Array.isArray(reqElemenList) && reqElemenList.length > 0
        ? reqElemenList
        : Array.isArray(selectedElements) && selectedElements.length > 0
        ? selectedElements
        : [{ elemen: elemen || 'Elemen Mapel', capaianPembelajaran: capaianPembelajaran || '' }];
    const fallback = generatePedagogicalATPFallback(identitas || {}, elemen || "", capaianPembelajaran || "", tpList || [], preferensiTambahan, rawElemenList);
    (fallback as any).elemenList = rawElemenList;
    res.json(fallback);
  }
});

// Endpoint 3: Penyusunan Dokumen KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
// Terhubung secara presisi dengan Capaian Pembelajaran (CP), TP, dan ATP
app.post("/api/generate-kktp", async (req, res) => {
  try {
    const { identitas, tpList, atpDocument, preferensiTambahan } = req.body;

    if (!tpList || !Array.isArray(tpList) || tpList.length === 0) {
      return res.status(400).json({ error: "Data Tujuan Pembelajaran (TP) diperlukan untuk menyusun dokumen KKTP." });
    }

    const mapel = identitas?.mataPelajaran || "Matematika";
    const fase = identitas?.fase || "Fase C";

    const systemInstruction = `Anda adalah pakar kurikulum dan evaluasi pembelajaran Kurikulum Merdeka jenjang Sekolah Dasar (SD/MI) berpedoman pada Permendikbudristek No. 21 Tahun 2022, Keputusan Kepala BSKAP No. 046 Tahun 2025, dan Panduan Pembelajaran dan Asesmen (PPA) Kemendikdasmen/Kemendikbudristek.
Tugas Anda adalah menyusun Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) yang saling terhubung erat dan terpadu dengan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Alur Tujuan Pembelajaran (ATP).

MANDATORI REGULASI DAN KETENTUAN RESMI KKTP:
1. KKTP DITURUNKAN DARI TUJUAN PEMBELAJARAN (TP):
   KKTP bukan KKM tunggal (KKM adalah angka batas seragam masa lalu yang dilarang dalam Kurikulum Merdeka). KKTP adalah serangkaian kriteria deskriptif kualitatif untuk menentukan apakah peserta didik telah mencapai TP tertentu.
2. 4 PENDEKATAN RESMI KKTP SESUAI PANDUAN PPA KEMENDIKBUDRISTEK:
   a. Pendekatan Rubrik Kualitatif 4 Jenjang (Slide 11-15):
      - Baru Berkembang (0 - 60): Belum mampu menunjukkan bukti performa, memerlukan bimbingan intensif dari guru.
      - Layak (61 - 70): Menunjukkan pemahaman dasar dengan arahan dan scaffolding bertahap.
      - Cakap (71 - 85) [BATAS TUNTAS KKTP]: Memenuhi kriteria ketercapaian secara mandiri, akurat, dan runtut.
      - Mahir (86 - 100) [MELAMPAUI]: Melampaui kriteria secara mandiri, mampu bernalar kritis, dan mengaitkan ke konteks nyata.
      - Ketentuan Ketuntasan: Peserta didik dianggap tuntas jika minimal mencapai jenjang "Cakap" pada semua kriteria/eviden.
   b. Pendekatan Interval Nilai & Rencana Tindak Lanjut (Slide 16-17):
      - 0 - 40%: Belum tuntas, intervensi khusus dan remedial total dengan media konkret/manipulatif.
      - 41 - 65%: Belum tuntas, bimbingan remedial terarah pada bagian materi spesifik (tutor sebaya / latihan terbimbing).
      - 66 - 85%: Tuntas belajar (KKTP), tidak perlu remedial, siap lanjut ke materi selanjutnya.
      - 86 - 100%: Tuntas melampaui, pengayaan penalaran tingkat tinggi (HOTS) atau mini riset mandiri.
   c. Pendekatan Interval dari Rubrik (Slide 18-20): Mengonversi skor rubrik berbobot menjadi persentase ketercapaian.
   d. Pendekatan Deskripsi Kriteria (Slide 9-10): Penilaian kriteria memadai / belum memadai.
3. MATRIKS PERENCANAAN PENILAIAN FORMATIF & SUMATIF (Slide 23):
   Setiap TP harus dipetakan Indikator Capaian Performa/Eviden, Bentuk Penilaian, Instrumen Penilaian, Pendekatan KKTP, dan Keterangan Ketuntasan.
4. ANALISIS TAKSONOMI BLOOM:
   Tentukan KKO (C1 - C6), ranah kognitif (LOTS / MOTS / HOTS), dan dimensi pengetahuan (Faktual, Konseptual, Prosedural, Metakognitif).

Output HARUS berupa JSON murni sesuai schema.`;

    const prompt = `Susun Dokumen KKTP resmi dan komprehensif untuk mata pelajaran ${mapel} ${fase} yang saling terhubung langsung dengan butir-butir TP berikut:
Identitas Satuan Pendidikan:
- Nama Sekolah: ${identitas?.namaSatuanPendidikan || "SD Negeri Fatubai"}
- Guru: ${identitas?.namaGuru || "Haryanto Roni Bhidju, S.Pd.SD"} (NIP: ${identitas?.nipGuru || "19880512 201402 1 002"})
- Kepala Sekolah: ${identitas?.namaKepalaSekolah || "Darius Kusi, S.Pd."} (NIP: ${identitas?.nipKepalaSekolah || "196709192008011008"})
- Mata Pelajaran: ${mapel}
- Fase / Kelas: ${fase} / ${identitas?.kelas || "5 & 6"}
- Semester: ${identitas?.semester || "1 (Ganjil)"}
- Tahun Pelajaran: ${identitas?.tahunPelajaran || "2026/2027"}

Daftar TP yang Dianalisis:
${JSON.stringify(tpList, null, 2)}

Catatan Khusus: ${preferensiTambahan || "Pastikan seluruh butir TP memiliki rubrik 4 jenjang resmi (Baru Berkembang, Layak, Cakap, Mahir), matriks perencanaan penilaian formatif/sumatif Slide 23, interval nilai tindak lanjut, dan taksonomi Bloom."}`;

    const kktpSchema = {
      type: Type.OBJECT,
      properties: {
        catatanPedagogis: {
          type: Type.STRING,
          description: "Penjelasan rasional dan filosofi penggunaan KKTP berbasis TP (bukan KKM) sesuai Permendikbudristek No. 21/2022 dan Panduan PPA 2025",
        },
        skalaKetuntasanMinimal: {
          type: Type.INTEGER,
          description: "Nilai ketuntasan standar acuan interval (misal 70 atau 75)",
        },
        kktpList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              kodeTP: { type: Type.STRING },
              elemen: { type: Type.STRING },
              rumusanTP: { type: Type.STRING },
              lingkupMateri: { type: Type.STRING },
              indikatorKetercapaian: { type: Type.STRING },
              alokasiJP: { type: Type.INTEGER },
              semester: { type: Type.STRING },
              kelasTarget: { type: Type.STRING },
              dimensiP3: { type: Type.ARRAY, items: { type: Type.STRING } },
              pendekatanRubrik: {
                type: Type.OBJECT,
                properties: {
                  baruBerkembang: { type: Type.STRING },
                  layak: { type: Type.STRING },
                  cakap: { type: Type.STRING },
                  mahir: { type: Type.STRING },
                  kesimpulanKetuntasan: { type: Type.STRING },
                  perluBimbingan: { type: Type.STRING },
                  cukup: { type: Type.STRING },
                  baik: { type: Type.STRING },
                  sangatBaik: { type: Type.STRING },
                  evidenList: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        kriteria: { type: Type.STRING },
                        baruBerkembang: { type: Type.STRING },
                        layak: { type: Type.STRING },
                        cakap: { type: Type.STRING },
                        mahir: { type: Type.STRING },
                      },
                      required: ["kriteria", "baruBerkembang", "layak", "cakap", "mahir"],
                    },
                  },
                },
                required: ["baruBerkembang", "layak", "cakap", "mahir"],
              },
              intervalNilai: {
                type: Type.OBJECT,
                properties: {
                  interval0_40: { type: Type.STRING },
                  interval41_65: { type: Type.STRING },
                  interval66_85: { type: Type.STRING },
                  interval86_100: { type: Type.STRING },
                  kesimpulanInterval: { type: Type.STRING },
                },
                required: ["interval0_40", "interval41_65", "interval66_85", "interval86_100"],
              },
              intervalDariRubrik: {
                type: Type.OBJECT,
                properties: {
                  skorMaksimal: { type: Type.INTEGER },
                  kriteriaSkor: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        kriteria: { type: Type.STRING },
                        skorMinimalTuntas: { type: Type.INTEGER },
                        bobotSkor: { type: Type.INTEGER },
                      },
                      required: ["kriteria", "skorMinimalTuntas"],
                    },
                  },
                  intervalKetuntasan: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        rentangSkor: { type: Type.STRING },
                        kategori: { type: Type.STRING },
                        tindakLanjut: { type: Type.STRING },
                      },
                      required: ["rentangSkor", "kategori", "tindakLanjut"],
                    },
                  },
                },
              },
              bloomTaxonomy: {
                type: Type.OBJECT,
                properties: {
                  kategori: { type: Type.STRING },
                  tingkatKKO: { type: Type.STRING },
                  kataKerjaOperasional: { type: Type.STRING },
                  ranahKognitif: { type: Type.STRING },
                  dimensiPengetahuan: { type: Type.STRING },
                },
                required: ["kategori", "tingkatKKO", "kataKerjaOperasional", "ranahKognitif", "dimensiPengetahuan"],
              },
              perencanaanPenilaian: {
                type: Type.OBJECT,
                properties: {
                  indikatorCapaianPerforma: { type: Type.STRING },
                  bentukPenilaian: { type: Type.STRING },
                  instrumenPenilaian: { type: Type.STRING },
                  pendekatanKKTP: { type: Type.STRING },
                  keteranganKetuntasan: { type: Type.STRING },
                },
                required: ["indikatorCapaianPerforma", "bentukPenilaian", "instrumenPenilaian", "pendekatanKKTP", "keteranganKetuntasan"],
              },
              kriteriaDeskripsi: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kriteria: { type: Type.STRING },
                    memadai: { type: Type.BOOLEAN },
                    belumMemadai: { type: Type.BOOLEAN },
                    catatanGuru: { type: Type.STRING },
                  },
                  required: ["kriteria", "memadai", "belumMemadai"],
                },
              },
              teknikAsesmen: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              instrumenAsesmen: { type: Type.STRING },
              tindakLanjutRemedial: { type: Type.STRING },
              tindakLanjutPengayaan: { type: Type.STRING },
            },
            required: [
              "kodeTP",
              "elemen",
              "rumusanTP",
              "lingkupMateri",
              "indikatorKetercapaian",
              "pendekatanRubrik",
              "intervalNilai",
              "kriteriaDeskripsi",
              "teknikAsesmen",
              "instrumenAsesmen",
              "tindakLanjutRemedial",
              "tindakLanjutPengayaan",
            ],
          },
        },
        panduanPelaksanaanAsesmen: {
          type: Type.OBJECT,
          properties: {
            langkahAsesmenFormatif: { type: Type.ARRAY, items: { type: Type.STRING } },
            langkahAsesmenSumatif: { type: Type.ARRAY, items: { type: Type.STRING } },
            pengolahanNilaiRapor: { type: Type.STRING },
          },
          required: ["langkahAsesmenFormatif", "langkahAsesmenSumatif", "pengolahanNilaiRapor"],
        },
      },
      required: ["catatanPedagogis", "kktpList", "panduanPelaksanaanAsesmen"],
    };

    let result = await callGeminiStructured<any>(prompt, systemInstruction, kktpSchema);

    if (!result || !result.kktpList || result.kktpList.length === 0) {
      result = generatePedagogicalKKTPFallback(identitas || {}, tpList, atpDocument, preferensiTambahan);
    } else {
      // Ensure metadata and identifiers are complete
      result.id = `kktp-${Date.now()}`;
      result.atpDocumentId = atpDocument?.id;
      result.tanggalDibuat = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      result.identitas = identitas;
      result.elemen = Array.from(new Set(tpList.map((t: any) => t.elemen))).join(' & ') || 'Seluruh Elemen Mapel';
      result.capaianPembelajaran = atpDocument?.capaianPembelajaran || tpList.map((t: any) => t.kalimatCP).filter(Boolean).slice(0, 3).join('\n') || '';
      result.pendekatanDipilih = 'Semua Pendekatan';
      result.skalaKetuntasanMinimal = result.skalaKetuntasanMinimal || 70;

      // Ensure every item has an id
      result.kktpList = result.kktpList.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `kktp-item-${idx + 1}-${Date.now()}`,
      }));
    }

    res.json(result);
  } catch {
    const { identitas, tpList, atpDocument, preferensiTambahan } = req.body;
    const fallback = generatePedagogicalKKTPFallback(identitas || {}, tpList || [], atpDocument, preferensiTambahan);
    res.json(fallback);
  }
});

// Endpoint 4: Penyusunan Modul Ajar (RPP Plus) Lengkap dengan LKPD & Asesmen Autentik
app.post("/api/generate-modul-ajar", async (req, res) => {
  try {
    const {
      identitas,
      elemen,
      capaianPembelajaran,
      selectedTPs,
      materiFokus,
      modelPembelajaranPilihan,
      preferensiTambahan,
      rpmOptions,
    } = req.body;

    if (!selectedTPs || !Array.isArray(selectedTPs) || selectedTPs.length === 0) {
      return res.status(400).json({ error: "Minimal pilih satu Tujuan Pembelajaran (TP) untuk Modul Ajar." });
    }

    const systemInstruction = `Anda adalah Master Guru Penggerak dan perancang kurikulum Kurikulum Merdeka Sekolah Dasar (SD / MI) untuk Fase A (Kelas 1-2), Fase B (Kelas 3-4), dan Fase C (Kelas 5-6).
Buat Dokumen Modul Ajar (RPP Plus) SD yang sangat lengkap, inspiratif, ramah anak, kontekstual, dan langsung dapat dipraktikkan oleh guru SD di kelas.
Modul Ajar harus memuat komponen standar lengkap:
1. INFORMASI UMUM:
   - Identitas Modul (Nama SD/MI, Penyusun, Tahun, Jenjang/Fase/Kelas, Alokasi Waktu, Moda Pembelajaran, Target Siswa).
   - Kompetensi Awal (prasyarat ramah kognitif anak SD).
   - Profil Pelajar Pancasila (DPL) yang dibiasakan dan secara kontekstual PALING RELEVAN dengan materi dan aktivitas. Jangan menggunakan template berulang secara membabi-buta, pilihlah yang sesuai dengan substansi pelajaran.
   - Sarana dan Prasarana (media ajar konkret, benda manipulatif, gambar, lingkungan sekolah).
   - Target Peserta Didik (Reguler/Tipikal, Hambatan Belajar, Pencapaian Tinggi).
   - Model Pembelajaran (PBL, Discovery Learning, PjBL, Inquiry, bermain peran, dll. dengan sintaks runtut).

2. KOMPONEN INTI:
   - Tujuan Pembelajaran Spesifik untuk unit/pertemuan ini.
   - Pemahaman Bermakna (manfaat nyata materi dalam kehidupan anak sehari-hari).
   - Pertanyaan Pemantik yang menggugah rasa ingin tahu siswa usia SD.
   - Persiapan Pembelajaran.
   - Rencana Kegiatan Pembelajaran per Pertemuan (detail alokasi waktu, Pendahuluan, Kegiatan Inti dengan sintaks model pembelajaran bertahap mencakup aktivitas guru dan aktivitas siswa yang aktif, serta Penutup reflektif).
   - Asesmen Lengkap:
     * Asesmen Diagnostik (non-kognitif & kognitif awal)
     * Asesmen Formatif (proses, observasi, dan Rubrik Penilaian 4 Kategori: Baru Berkembang, Layak, Cakap, Mahir)
     * Asesmen Sumatif (contoh soal evaluasi ramah anak SD beserta kunci jawaban & bobot)
   - Pengayaan & Remedial yang terukur.
   - Refleksi Guru & Peserta Didik (pertanyaan panduan refleksi anak).

3. LAMPIRAN:
   - Lembar Kerja Peserta Didik (LKPD) yang aplikatif dan siap pakai dengan petunjuk kerja jelas bergambar/berstruktur dan pertanyaan diskusi.
   - Bahan Bacaan Guru & Peserta Didik (ringkasan materi esensial bahasa sederhana).
   - Glosarium & Daftar Pustaka buku SD Kemdikbudristek serta regulasi kurikulum terbaru.

4. ALOKASI WAKTU & ATURAN BAKU DISTRIBUSI PERTEMUAN (PERMENDIKDASMEN NO. 13 TAHUN 2025):
   - Alokasi waktu pembelajaran jenjang SD seluruh fase menganut durasi 1 JP = 35 Menit (misal: 2 JP x 35 menit = 70 menit; 3 JP x 35 menit = 105 menit per pertemuan).
   - ATURAN BAKU DISTRIBUSI PERTEMUAN: Minimal setiap kali pertemuan terdiri dari 2 JP dan maksimal 3 JP. DILARANG MERANCANG PERTEMUAN 1 JP ATAU LEBIH DARI 3 JP!
   - Contoh Distribusi Alokasi:
     * Jika 12 JP -> 6 Pertemuan (masing-masing 2 JP: 2-2-2-2-2-2)
     * Jika 11 JP -> 5 Pertemuan (2-2-2-2-3 JP)
     * Jika 8 JP  -> 4 Pertemuan (masing-masing 2 JP: 2-2-2-2)
     * Jika 6 JP  -> 3 Pertemuan (masing-masing 2 JP: 2-2-2)
     * Jika 4 JP  -> 2 Pertemuan (masing-masing 2 JP: 2-2)
   - Pastikan alokasi intrakurikuler dan sintaks kegiatan pembelajaran terstruktur secara efektif untuk pembelajaran mendalam (deep learning).

    5. ATURAN PENULISAN LANGKAH-LANGKAH / AKTIVITAS PEMBELAJARAN (SANGAT WAJIB & KRUSIAL):
       - DILARANG MENGGUNAKAN ISTILAH ASING YANG TIDAK DIPAHAMI GURU ATAU MURID! Jangan gunakan istilah bahasa Inggris seperti: Ice Breaking, Mindful Learning, Meaningful Learning, Joyful Learning, Deep Learning, Scaffolding, Brainstorming, Gallery Walk, Problem Statement, Data Collection, Data Processing, Verification, Generalization, Student-Centered, Peer Assessment, dll. Gunakan Bahasa Indonesia yang lugas, alami, dan mudah dipahami guru maupun murid SD!
       - SETIAP PERTEMUAN (Pertemuan 1, Pertemuan 2, Pertemuan 3, dst.) WAJIB MEMILIKI 3 TAHAP UTUH (Kegiatan Awal, Kegiatan Inti, Kegiatan Akhir):
         1) Kegiatan Awal (Pendahuluan) — WAJIB BERVARIASI DAN RELEVAN DI SETIAP PERTEMUAN:
            * WAJIB di setiap pertemuan: Guru menyapa murid dengan ramah, mengajak murid berdoa bersama sesuai agama dan kepercayaan masing-masing, serta mengecek kehadiran murid.
            * Aktivitas pembuka setelah doa dan mengecek kehadiran HARUS BERVARIASI untuk setiap pertemuan dan MEMILIKI KORELASI / RELEVANSI langsung dengan materi pembelajaran:
              - Contoh Pertemuan 1: Setelah berdoa dan mengecek kehadiran, guru mengajak murid melakukan permainan singkat asah otak atau tebak cepat yang berkaitan dengan pengenalan materi.
              - Pertemuan 2: JANGAN lagi menggunakan permainan asah otak / penyegar suasana yang sama! Gunakan kegiatan lain yang berkorelasi dengan materi, misalnya mengajak murid mengamati benda nyata, alat peraga, atau gambar di sekitar kelas yang berkaitan dengan sub-materi pertemuan ke-2.
              - Pertemuan 3: Gunakan kegiatan pembuka lain yang relevan, misalnya bercerita singkat tentang kejadian sehari-hari di rumah/sekolah atau kilas balik berantai menyambung temuan pertemuan sebelumnya ke tantangan praktik hari ini.
              - Pertemuan 4 dan seterusnya: Gunakan aktivitas kontekstual lain seperti simulasi singkat, tebak manfaat materi dalam kehidupan nyata, atau tantangan kasus sederhana.
            * WAJIB memberikan Pertanyaan Pemantik di setiap pertemuan dengan PERTANYAAN YANG BERBEDA-BEDA sesuai target pencapaian di setiap pertemuan dan relevan dengan Tujuan Pembelajaran!
            * Menyampaikan tujuan kegiatan pembelajaran yang akan dicapai pada pertemuan tersebut dengan bahasa yang mudah dipahami murid.
         2) Kegiatan Inti: 5 tahapan langkah model pembelajaran dalam Bahasa Indonesia yang jelas (aktivitas guru, aktivitas murid, alokasi menit, pengalaman belajar, dan prinsip pembelajaran) yang berkembang bertahap dari Pertemuan 1 (pengenalan & pemahaman dasar), Pertemuan 2 (penyelidikan & latihan), hingga Pertemuan Puncak (penerapan karya & unjuk pemahaman).
         3) Kegiatan Akhir (Penutup): Menyimpulkan pembelajaran bersama murid, refleksi pemahaman dan perasaan murid dengan pertanyaan yang bervariasi tiap pertemuan, umpan balik dan apresiasi dari guru, informasi kegiatan pertemuan berikutnya, serta berdoa penutup bersama dan salam.

Format output HARUS berupa JSON murni sesuai schema.`;

    const prompt = `Susun Dokumen Modul Ajar SD/MI lengkap untuk data berikut:
Identitas:
- Satuan Pendidikan: ${identitas?.namaSatuanPendidikan || "SD Negeri Fatubai"}
- Guru Kelas / Pengampu: ${identitas?.namaGuru || "Haryanto Roni Bhidju, S.Pd.SD"}
- NIP: ${identitas?.nipGuru || "19880512 201402 1 002"}
- Kepala Sekolah: ${identitas?.namaKepalaSekolah || "Darius Kusi, S.Pd."}
- NIP Kepala Sekolah: ${identitas?.nipKepalaSekolah || "196709192008011008"}
- Mata Pelajaran: ${identitas?.mataPelajaran || "IPAS SD"}
- Fase / Kelas: ${identitas?.fase || "Fase B"} / ${identitas?.kelas || "IV (Empat)"}
- Tahun Pelajaran: ${identitas?.tahunPelajaran || "2026/2027"}
- Semester: ${identitas?.semester || "1 (Ganjil)"}

Elemen: ${elemen || "Elemen Mapel"}

Tujuan Pembelajaran (TP) yang menjadi fokus modul ini:
${JSON.stringify(selectedTPs, null, 2)}

Materi Fokus: ${materiFokus || "Sesuai TP terpilih"}
Model Pembelajaran yang Dikehendaki: ${modelPembelajaranPilihan || "Problem Based Learning (PBL)"}

Pemanfaatan Media Pembelajaran Terpilih Guru: ${Array.isArray(rpmOptions?.pemanfaatanMedia) && rpmOptions.pemanfaatanMedia.length > 0 ? rpmOptions.pemanfaatanMedia.join(', ') : 'Benda nyata/konkret, tayangan gambar interaktif, dan video pembelajaran'}
Perangkat Digital yang Digunakan: ${Array.isArray(rpmOptions?.pemanfaatanPerangkat) && rpmOptions.pemanfaatanPerangkat.length > 0 ? rpmOptions.pemanfaatanPerangkat.join(', ') : 'Laptop / Komputer Guru, Proyektor LCD'}
Platform / Aplikasi Pembelajaran: ${Array.isArray(rpmOptions?.pemanfaatanPlatform) && rpmOptions.pemanfaatanPlatform.length > 0 ? rpmOptions.pemanfaatanPlatform.join(', ') : 'Canva Pendidikan, Video Edukasi Kemendikdasmen'}
Pendekatan Pembelajaran: ${rpmOptions?.pendekatanPembelajaran || 'Pembelajaran Mendalam (Berkesadaran, Bermakna, dan Menggembirakan)'}
Metode Pembelajaran Terpilih: ${Array.isArray(rpmOptions?.metodePembelajaran) && rpmOptions.metodePembelajaran.length > 0 ? rpmOptions.metodePembelajaran.join(', ') : 'Diskusi kelompok, tanya jawab interaktif, peragaan benda nyata, dan presentasi'}
Budaya Belajar Kelas: ${Array.isArray(rpmOptions?.budayaBelajar) && rpmOptions.budayaBelajar.length > 0 ? rpmOptions.budayaBelajar.join(', ') : 'Kerja sama gotong royong, aktif bertanya, bernalar kritis, dan saling menghargai'}

KETENTUAN KHUSUS AKTIVITAS (SANGAT WAJIB):
1. DILARANG menggunakan istilah asing yang sulit dipahami guru atau murid (seperti Ice Breaking, Mindful, Meaningful, Joyful, Scaffolding, Brainstorming, Gallery Walk, Problem Statement, Data Collection, dll.). Gunakan Bahasa Indonesia yang jelas dan akrab bagi guru serta murid!
2. Pada Kegiatan Awal setiap pertemuan: WAJIB mengajak murid berdoa bersama dan mengecek kehadiran murid. Setelah itu, berikan aktivitas pembuka yang BERVARIASI antarpertemuan dan relevan dengan materi (misal Pertemuan 1 asah otak singkat terkait materi, Pertemuan 2 pengamatan benda/gambar nyata tanpa mengulang asah otak, Pertemuan 3 cerita kontekstual atau kilas balik berantai, dst.).
3. WAJIB menyertakan Pertanyaan Pemantik pada Kegiatan Awal di setiap pertemuan dengan kalimat pertanyaan yang BERBEDA-BEDA sesuai target capaian pertemuan tersebut dan relevan dengan Tujuan Pembelajaran.
4. Media pembelajaran, perangkat digital, dan aplikasi yang telah ditentukan oleh guru di atas HARUS benar-benar digunakan dalam langkah kegiatan Guru dan Murid.

Capaian Pembelajaran (CP) Acuan:
"""
${capaianPembelajaran || "-"}
"""

Kebutuhan Khusus Guru: ${preferensiTambahan || "Sertakan LKPD yang menarik dan rubrik asesmen autentik."}`;

    const modulSchema = {
      type: Type.OBJECT,
      properties: {
        alokasiWaktuModul: { type: Type.STRING, description: "Contoh: 3 Pertemuan x 2 JP (6 JP)" },
        targetPesertaDidik: { type: Type.STRING, description: "Peserta didik reguler / tipikal (32 siswa)" },
        modaPembelajaran: { type: Type.STRING, description: "Tatap Muka (Luring)" },
        kompetensiAwal: { type: Type.ARRAY, items: { type: Type.STRING } },
        profilPelajarPancasila: { type: Type.ARRAY, items: { type: Type.STRING } },
        saranaPrasarana: {
          type: Type.OBJECT,
          properties: {
            fasilitas: { type: Type.ARRAY, items: { type: Type.STRING } },
            lingkunganBelajar: { type: Type.ARRAY, items: { type: Type.STRING } },
            mediaAjar: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["fasilitas", "lingkunganBelajar", "mediaAjar"],
        },
        modelPembelajaran: { type: Type.STRING },
        tujuanPembelajaranSpesifik: { type: Type.ARRAY, items: { type: Type.STRING } },
        pemahamanBermakna: { type: Type.ARRAY, items: { type: Type.STRING } },
        pertanyaanPemantik: { type: Type.ARRAY, items: { type: Type.STRING } },
        persiapanPembelajaran: { type: Type.ARRAY, items: { type: Type.STRING } },
        kegiatanPembelajaran: {
          type: Type.ARRAY,
          description: "Skenario pembelajaran per pertemuan",
          items: {
            type: Type.OBJECT,
            properties: {
              pertemuanKe: { type: Type.INTEGER },
              alokasiWaktu: { type: Type.STRING },
              fokusTP: { type: Type.STRING },
              pendahuluan: { type: Type.ARRAY, items: { type: Type.STRING } },
              kegiatanInti: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    faseSintaks: { type: Type.STRING, description: "Tahap sintaks model (misal: Orientasi Masalah)" },
                    aktivitasGuru: { type: Type.STRING },
                    aktivitasSiswa: { type: Type.STRING },
                  },
                  required: ["faseSintaks", "aktivitasGuru", "aktivitasSiswa"],
                },
              },
              penutup: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["pertemuanKe", "alokasiWaktu", "fokusTP", "pendahuluan", "kegiatanInti", "penutup"],
          },
        },
        asesmen: {
          type: Type.OBJECT,
          properties: {
            diagnostik: {
              type: Type.OBJECT,
              properties: {
                teknik: { type: Type.STRING },
                daftarPertanyaan: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["teknik", "daftarPertanyaan"],
            },
            formatif: {
              type: Type.OBJECT,
              properties: {
                teknik: { type: Type.STRING },
                deskripsi: { type: Type.STRING },
                rubrik: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      aspek: { type: Type.STRING },
                      baruBerkembang: { type: Type.STRING },
                      layak: { type: Type.STRING },
                      cakap: { type: Type.STRING },
                      mahir: { type: Type.STRING },
                    },
                    required: ["aspek", "baruBerkembang", "layak", "cakap", "mahir"],
                  },
                },
              },
              required: ["teknik", "deskripsi", "rubrik"],
            },
            sumatif: {
              type: Type.OBJECT,
              properties: {
                teknik: { type: Type.STRING },
                daftarSoal: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nomor: { type: Type.INTEGER },
                      soal: { type: Type.STRING },
                      pilihanGanda: { type: Type.ARRAY, items: { type: Type.STRING } },
                      kunciJawaban: { type: Type.STRING },
                      bobot: { type: Type.INTEGER },
                    },
                    required: ["nomor", "soal", "kunciJawaban", "bobot"],
                  },
                },
              },
              required: ["teknik", "daftarSoal"],
            },
          },
          required: ["diagnostik", "formatif", "sumatif"],
        },
        pengayaanDanRemedial: {
          type: Type.OBJECT,
          properties: {
            pengayaan: { type: Type.STRING },
            remedial: { type: Type.STRING },
          },
          required: ["pengayaan", "remedial"],
        },
        refleksi: {
          type: Type.OBJECT,
          properties: {
            refleksiGuru: { type: Type.ARRAY, items: { type: Type.STRING } },
            refleksiSiswa: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["refleksiGuru", "refleksiSiswa"],
        },
        lkpd: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              judulLKPD: { type: Type.STRING },
              tujuanKegiatan: { type: Type.STRING },
              alatBahan: { type: Type.ARRAY, items: { type: Type.STRING } },
              langkahKerja: { type: Type.ARRAY, items: { type: Type.STRING } },
              pertanyaanDiskusi: { type: Type.ARRAY, items: { type: Type.STRING } },
              kesimpulanPrompt: { type: Type.STRING },
            },
            required: ["judulLKPD", "tujuanKegiatan", "langkahKerja", "pertanyaanDiskusi"],
          },
        },
        bahanBacaanGuruDanSiswa: {
          type: Type.OBJECT,
          properties: {
            ringkasanMateri: { type: Type.STRING },
            materiPengayaanSingkat: { type: Type.STRING },
          },
          required: ["ringkasanMateri", "materiPengayaanSingkat"],
        },
        glosarium: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              istilah: { type: Type.STRING },
              definisi: { type: Type.STRING },
            },
            required: ["istilah", "definisi"],
          },
        },
        daftarPustaka: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        "alokasiWaktuModul",
        "targetPesertaDidik",
        "modaPembelajaran",
        "kompetensiAwal",
        "profilPelajarPancasila",
        "saranaPrasarana",
        "modelPembelajaran",
        "tujuanPembelajaranSpesifik",
        "pemahamanBermakna",
        "pertanyaanPemantik",
        "kegiatanPembelajaran",
        "asesmen",
        "pengayaanDanRemedial",
        "refleksi",
        "lkpd",
        "bahanBacaanGuruDanSiswa",
        "glosarium",
        "daftarPustaka",
      ],
    };

    let result = await callGeminiStructured<any>(prompt, systemInstruction, modulSchema);

    const fallback = generatePedagogicalModulFallback(
      identitas || {},
      elemen || "",
      capaianPembelajaran || "",
      selectedTPs,
      materiFokus || "",
      modelPembelajaranPilihan,
      preferensiTambahan,
      rpmOptions
    );

    if (!result || !result.kegiatanPembelajaran) {
      result = fallback;
    } else {
      // Ensure RPM structured fields are present and integrated
      result.judulModul = result.judulModul || 'RENCANA PEMBELAJARAN MENDALAM';
      result.topikMateri = rpmOptions?.topikMateri || result.topikMateri || materiFokus || fallback.topikMateri;
      result.elemen = result.elemen || elemen || fallback.elemen;
      result.alokasiWaktuPertemuan = rpmOptions?.alokasiWaktu || result.alokasiWaktuPertemuan || '2 x 35 Menit (1 kali pertemuan)';
      const expectedMeetingsCount = Math.max(1, rpmOptions?.jumlahPertemuan || fallback.jumlahPertemuan || 1);
      result.jumlahPertemuan = expectedMeetingsCount;

      // Ensure every meeting has full 3-phase pedagogical structure and progressive focus
      if (!Array.isArray(result.kegiatanPembelajaran) || result.kegiatanPembelajaran.length === 0) {
        result.kegiatanPembelajaran = fallback.kegiatanPembelajaran;
      } else {
        // Expand if fewer meetings than requested
        while (result.kegiatanPembelajaran.length < expectedMeetingsCount) {
          const nextIdx = result.kegiatanPembelajaran.length;
          const fallbackMeet = fallback.kegiatanPembelajaran[nextIdx] || fallback.kegiatanPembelajaran[0];
          result.kegiatanPembelajaran.push(JSON.parse(JSON.stringify(fallbackMeet)));
        }

        // Validate and sanitize each meeting
        result.kegiatanPembelajaran = result.kegiatanPembelajaran.slice(0, expectedMeetingsCount).map((meet: any, idx: number) => {
          const fallbackMeet = fallback.kegiatanPembelajaran[idx] || fallback.kegiatanPembelajaran[0];
          
          // 1. Kegiatan Awal (Pendahuluan) - WAJIB ada doa, cek kehadiran, variasi aktivitas pembuka, dan pertanyaan pemantik berbeda
          const joinedPend = Array.isArray(meet.pendahuluan) ? meet.pendahuluan.join(' ') : '';
          const hasDoaAndHadir = /doa|berdoa/i.test(joinedPend) && /hadir|kehadiran|kabar/i.test(joinedPend);
          const hasPemantik = /pemantik|\?/i.test(joinedPend);
          const repeatsIceBreaking = idx > 0 && /ice\s*breaking|asah\s*otak|tebak\s*cepat/i.test(joinedPend);
          const rawPendahuluan =
            Array.isArray(meet.pendahuluan) &&
            meet.pendahuluan.length >= 3 &&
            hasDoaAndHadir &&
            hasPemantik &&
            !repeatsIceBreaking
              ? meet.pendahuluan
              : fallbackMeet.pendahuluan;
          const pendahuluan = (rawPendahuluan || []).map((p: string) => cleanActivityText(p));

          // 2. Kegiatan Akhir (Penutup) - MUST NOT BE EMPTY & CLEAN NUMBERING
          const rawPenutup = Array.isArray(meet.penutup) && meet.penutup.length >= 3
            ? meet.penutup
            : fallbackMeet.penutup;
          const penutup = (rawPenutup || []).map((p: string) => cleanActivityText(p));

          // 3. Fokus Pembelajaran Progresif (singkat dan lengkap tanpa memotong kode TP)
          const fokusTP = fallbackMeet.fokusTP;

          // 4. Kegiatan Inti dengan Pengalaman & Prinsip (100% Relevan Sintaks Model & Tanpa Istilah Asing)
          const targetModel = modelPembelajaranPilihan || 'Problem Based Learning (PBL)';
          const isModelMatching = Array.isArray(meet.kegiatanInti) &&
            meet.kegiatanInti.length >= 3 &&
            isSyntaxMatchingModel(String(meet.kegiatanInti[0]?.faseSintaks || ''), targetModel);

          let kegiatanInti = isModelMatching
            ? meet.kegiatanInti
            : fallbackMeet.kegiatanInti;

          kegiatanInti = kegiatanInti.map((step: any, sIdx: number) => {
            const fallbackStep = fallbackMeet.kegiatanInti[sIdx] || fallbackMeet.kegiatanInti[0];
            return {
              ...step,
              faseSintaks: cleanActivityText(step.faseSintaks || fallbackStep?.faseSintaks),
              aktivitasGuru: cleanActivityText(step.aktivitasGuru || fallbackStep?.aktivitasGuru),
              aktivitasSiswa: cleanActivityText(step.aktivitasSiswa || fallbackStep?.aktivitasSiswa),
              alokasiMenit: step.alokasiMenit || fallbackStep?.alokasiMenit || '10 Menit',
              pengalamanBelajar: cleanActivityText(step.pengalamanBelajar || fallbackStep?.pengalamanBelajar || (
                sIdx === 0 ? 'Bermakna: Menghubungkan materi dengan kehidupan nyata.' :
                sIdx === 1 ? 'Menggembirakan: Belajar melalui kerja sama kelompok yang akrab.' :
                sIdx === 2 ? 'Berkesadaran: Mengalami proses berpikir mendalam dan pembuktian nyata.' :
                sIdx === 3 ? 'Menggembirakan & Saling Menghargai: Mengembangkan rasa percaya diri dan saling memberi semangat.' :
                'Bermakna & Reflektif: Mengukuhkan pemahaman utuh dan merenungkan proses belajar.'
              )),
              prinsipPembelajaran: cleanActivityText(step.prinsipPembelajaran || fallbackStep?.prinsipPembelajaran || (
                sIdx === 0 ? 'Memahami: Mengenal konsep dasar materi secara terstruktur.' :
                sIdx === 1 ? 'Merencanakan langkah kerja dan bergotong royong.' :
                sIdx === 2 ? 'Mengaplikasikan: Menerapkan konsep untuk menyelesaikan persoalan nyata.' :
                sIdx === 3 ? 'Mengomunikasikan: Menyajikan gagasan secara santun dan runtut.' :
                'Merefleksikan: Meninjau proses berpikir dan kebenaran kesimpulan.'
              )),
            };
          });

          return {
            ...meet,
            pertemuanKe: idx + 1,
            alokasiWaktu: fallbackMeet.alokasiWaktu || meet.alokasiWaktu,
            fokusTP,
            pendahuluan,
            kegiatanInti,
            penutup,
          };
        });
      }
      result.identifikasiRPM = fallback.identifikasiRPM;
      result.desainPembelajaranRPM = fallback.desainPembelajaranRPM;
      result.langkahPembelajaranRPM = fallback.langkahPembelajaranRPM;
      result.asesmenRPM = fallback.asesmenRPM;
      result.rubrikPenilaianRPM = fallback.rubrikPenilaianRPM;
      result.lkpdRPM = fallback.lkpdRPM;
      result.soalEvaluasiRPM = fallback.soalEvaluasiRPM;
    }

    res.json(result);
  } catch {
    const {
      identitas,
      elemen,
      capaianPembelajaran,
      selectedTPs,
      materiFokus,
      modelPembelajaranPilihan,
      preferensiTambahan,
      rpmOptions,
    } = req.body;
    const fallback = generatePedagogicalModulFallback(
      identitas || {},
      elemen || "",
      capaianPembelajaran || "",
      selectedTPs || [],
      materiFokus || "",
      modelPembelajaranPilihan,
      preferensiTambahan,
      rpmOptions
    );
    res.json(fallback);
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
