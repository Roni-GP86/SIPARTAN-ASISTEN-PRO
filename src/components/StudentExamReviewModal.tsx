import React, { useState, useMemo } from 'react';
import { ExamSubmission, ExamPackage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  BookOpen,
  X,
  Printer,
  Filter,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StudentExamReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ExamSubmission | any;
  examPackage?: ExamPackage | null;
  pkg?: ExamPackage | null; // Compatibility alias
}

export const StudentExamReviewModal: React.FC<StudentExamReviewModalProps> = ({
  isOpen,
  onClose,
  submission,
  examPackage,
  pkg,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const [selectedTP, setSelectedTP] = useState<string>('all');

  // Normalize target package
  const activePkg = examPackage || pkg || null;
  const doc = activePkg?.soalDocument;

  // Build question lookup map from soalDocument if available
  const questionDetailsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        pertanyaan: string;
        pilihanJawaban?: Record<string, string>;
        kunciJawaban: string;
        pembahasan?: string;
        kodeTP?: string;
        rumusanTP?: string;
        bentukSoal?: string;
        bobot?: number;
      }
    >();

    if (!doc) return map;

    // Pedoman penskoran lookup
    const pedomanMap = new Map<string, { kunci: string; pembahasan: string; bobot: number }>();
    (doc.pedomanPenskoran || []).forEach((p: any) => {
      pedomanMap.set(String(p.nomorSoalDisplay).trim().toUpperCase(), {
        kunci: p.kunciJawabanSingkat || '',
        pembahasan: p.pedomanPenskoranLengkap || p.pembahasan || '',
        bobot: p.bobotSkor || 1,
      });
    });

    // Kisi-kisi TP lookup
    const tpLookup = new Map<string, { kodeTP: string; rumusanTP: string }>();
    (doc.tabelKisiKisi || []).forEach((k) => {
      tpLookup.set(String(k.nomorSoalDisplay).trim().toUpperCase(), {
        kodeTP: k.kodeTP,
        rumusanTP: k.tujuanPembelajaran,
      });
    });

    // 1. Pilihan Ganda
    (doc.naskahSoal?.soalPilihanGanda || []).forEach((q: any) => {
      const key = String(q.nomor).trim().toUpperCase();
      const ped = pedomanMap.get(key);
      const tp = tpLookup.get(key);
      map.set(key, {
        pertanyaan: q.pertanyaan,
        pilihanJawaban: q.pilihanJawaban || q.pilihan,
        kunciJawaban: q.kunciJawaban || ped?.kunci || '',
        pembahasan: q.pembahasan || ped?.pembahasan,
        kodeTP: q.kodeTP || tp?.kodeTP,
        rumusanTP: tp?.rumusanTP,
        bentukSoal: 'Pilihan Ganda',
        bobot: q.bobot || ped?.bobot || 1,
      });
    });

    // 2. Benar Salah
    (doc.naskahSoal?.soalBenarSalah || []).forEach((q: any) => {
      const key = String(q.nomor).trim().toUpperCase();
      const ped = pedomanMap.get(key);
      const tp = tpLookup.get(key);
      map.set(key, {
        pertanyaan: q.pernyataan,
        kunciJawaban: q.kunciJawaban || ped?.kunci || '',
        pembahasan: q.alasanKunci || q.pembahasan || ped?.pembahasan,
        kodeTP: q.kodeTP || tp?.kodeTP,
        rumusanTP: tp?.rumusanTP,
        bentukSoal: 'Benar / Salah',
        bobot: q.bobot || ped?.bobot || 1,
      });
    });

    // 3. Menjodohkan
    (doc.naskahSoal?.soalMenjodohkan || []).forEach((q: any) => {
      const key = String(q.nomorGroup || q.nomor || '1').trim().toUpperCase();
      const ped = pedomanMap.get(key);
      const tp = tpLookup.get(key);
      const premisStr = (q.kunciJawabanPasangan || q.pasangan || [])
        .map((p: any, idx: number) =>
          p.nomorPremis ? `${p.nomorPremis} ➔ ${p.labelRespon}` : `${idx + 1}. ${p.premis} ➔ ${p.respon}`
        )
        .join('; ');
      map.set(key, {
        pertanyaan: q.instruksi || 'Pasangkanlah pernyataan di sebelah kiri dengan jawaban yang tepat di sebelah kanan.',
        kunciJawaban: premisStr || ped?.kunci || '',
        pembahasan: q.pembahasan || ped?.pembahasan || 'Cocokkan premis dengan respon yang sesuai.',
        kodeTP: q.kodeTP || tp?.kodeTP,
        rumusanTP: tp?.rumusanTP,
        bentukSoal: 'Menjodohkan',
        bobot: q.bobotTotal || q.bobot || ped?.bobot || 2,
      });
    });

    // 4. Isian Singkat
    (doc.naskahSoal?.soalIsianSingkat || []).forEach((q: any) => {
      const key = String(q.nomor).trim().toUpperCase();
      const ped = pedomanMap.get(key);
      const tp = tpLookup.get(key);
      map.set(key, {
        pertanyaan: q.pertanyaan,
        kunciJawaban: q.kunciJawaban || ped?.kunci || '',
        pembahasan: q.pembahasan || ped?.pembahasan || `Kunci: ${q.kunciJawaban}`,
        kodeTP: q.kodeTP || tp?.kodeTP,
        rumusanTP: tp?.rumusanTP,
        bentukSoal: 'Isian Singkat',
        bobot: q.bobot || ped?.bobot || 2,
      });
    });

    // 5. Uraian
    (doc.naskahSoal?.soalUraian || []).forEach((q: any) => {
      const key = String(q.nomor).trim().toUpperCase();
      const ped = pedomanMap.get(key);
      const tp = tpLookup.get(key);
      const pedomanText = Array.isArray(q.pedomanPenskoran)
        ? q.pedomanPenskoran.map((item: any) => `${item.kriteria} (Skor maks: ${item.skorMaks})`).join('; ')
        : String(q.pedomanPenskoran || '');
      map.set(key, {
        pertanyaan: q.pertanyaan,
        kunciJawaban: q.kunciJawaban || ped?.kunci || (pedomanText ? `Pedoman: ${pedomanText}` : ''),
        pembahasan: q.pembahasan || ped?.pembahasan || pedomanText || 'Penyelesaian uraian sesuai konsep materi.',
        kodeTP: q.kodeTP || tp?.kodeTP,
        rumusanTP: tp?.rumusanTP,
        bentukSoal: 'Uraian',
        bobot: q.bobot || ped?.bobot || 4,
      });
    });

    return map;
  }, [doc]);

  if (!isOpen || !submission) return null;

  // Normalize submission fields safely
  const judul = submission.judulPaket || submission.judulUjian || activePkg?.judul || 'Ulangan Digital SD Fatubai';
  const namaSiswa = submission.namaSiswa || submission.siswaNama || 'Peserta Didik';
  const nisn = submission.nisn || submission.siswaNisn || '-';
  const nilaiAkhir = typeof submission.nilaiAkhir === 'number'
    ? submission.nilaiAkhir
    : typeof submission.skorAkhir === 'number'
    ? submission.skorAkhir
    : 0;
  const predikat = submission.predikat || submission.keteranganKKTP || submission.statusKelulusan || 'Selesai';

  // Safe answers list extraction
  const rawAnswersList: any[] =
    Array.isArray(submission.jawabanList) && submission.jawabanList.length > 0
      ? submission.jawabanList
      : Array.isArray(submission.jawabanDetail) && submission.jawabanDetail.length > 0
      ? submission.jawabanDetail
      : Array.isArray(submission.jawabanMurid) && submission.jawabanMurid.length > 0
      ? submission.jawabanMurid
      : [];

  // Filtered answers
  const filteredList = rawAnswersList.filter((ans) => {
    const isCorrect = Boolean(ans.isCorrect);
    if (filterMode === 'wrong' && isCorrect) return false;
    if (filterMode === 'correct' && !isCorrect) return false;

    if (selectedTP !== 'all') {
      const qKey = String(ans.nomorSoalDisplay || ans.nomorDisplay || ans.nomor || '').trim().toUpperCase();
      const meta = questionDetailsMap.get(qKey);
      const ansTP = ans.kodeTP || meta?.kodeTP || '';
      if (ansTP !== selectedTP) return false;
    }
    return true;
  });

  const correctTotal = rawAnswersList.filter((a) => a.isCorrect).length;
  const wrongTotal = rawAnswersList.length - correctTotal;

  // Unique TPs in submission
  const availableTPs = submission.analisisTP || submission.daftarTP || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-[#0B1528] border-2 border-indigo-500/60 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-7 text-slate-100 space-y-6 my-auto max-h-[92vh] flex flex-col ring-1 ring-white/10"
        >
          {/* Top Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-700/80 pb-4 shrink-0">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-black uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tinjauan Kunci Jawaban &amp; Pembahasan TP</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {judul}
              </h3>
              <p className="text-xs text-slate-300">
                Nama Murid: <span className="font-bold text-amber-300">{namaSiswa}</span> (NISN: {nisn}) • Nilai Akhir:{' '}
                <span className="font-black text-emerald-400 text-sm">{nilaiAkhir.toFixed(1)}/100</span> ({predikat})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors border border-slate-700"
                title="Tutup Jendela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Summary Badges & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Semua Butir ({rawAnswersList.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('wrong')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'wrong'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Perlu Dipelajari ({wrongTotal})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'correct'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Jawaban Tepat ({correctTotal})</span>
              </button>
            </div>

            {/* Optional TP filter selector */}
            {availableTPs.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Filter TP:</span>
                <select
                  value={selectedTP}
                  onChange={(e) => setSelectedTP(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
                >
                  <option value="all">Seluruh Tujuan Pembelajaran</option>
                  {availableTPs.map((tp: any) => (
                    <option key={tp.kodeTP} value={tp.kodeTP}>
                      {tp.kodeTP} {tp.rumusanTP ? `- ${tp.rumusanTP.substring(0, 30)}...` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* List of answers & explanations (Scrollable) */}
          <div className="space-y-4 overflow-y-auto flex-1 pr-1.5">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
                <p className="text-sm font-semibold">Tidak ada butir soal pada filter ini.</p>
              </div>
            ) : (
              filteredList.map((ans, idx) => {
                const displayNum = ans.nomorSoalDisplay || ans.nomorDisplay || ans.nomor || String(idx + 1);
                const qKey = String(displayNum).trim().toUpperCase();
                const meta = questionDetailsMap.get(qKey);

                const isCorrect = Boolean(ans.isCorrect);
                const bentukSoal = ans.bentukSoal || meta?.bentukSoal || 'Soal';
                const questionText = ans.pertanyaanTeks || meta?.pertanyaan || '';
                const studentAns = ans.jawabanSiswa !== undefined ? ans.jawabanSiswa : ans.jawaban;
                const correctKey = ans.kunciJawaban || meta?.kunciJawaban || '-';
                const pembahasan = ans.pembahasan || meta?.pembahasan || '';
                const tpCode = ans.kodeTP || meta?.kodeTP || '';
                const tpRumusan = meta?.rumusanTP || '';

                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 transition-all ${
                      isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                        : 'bg-rose-950/20 border-rose-500/40 text-slate-200'
                    }`}
                  >
                    {/* Header item */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-white/10 text-white font-black text-xs flex items-center justify-center border border-white/10">
                          {displayNum}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {bentukSoal}
                        </span>
                        {tpCode && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                            {tpCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Benar (+{ans.skorDidapat ?? ans.skorDiperoleh ?? 1} poin)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Belum Tepat (0 poin)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question text */}
                    {questionText && (
                      <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                          {questionText}
                        </p>

                        {/* Multiple choice options preview if available */}
                        {meta?.pilihanJawaban && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            {Object.entries(meta.pilihanJawaban).map(([optKey, optText]) => {
                              const isStudentPick = String(studentAns).trim().toUpperCase() === optKey.toUpperCase();
                              const isOfficialKey = String(correctKey).trim().toUpperCase() === optKey.toUpperCase();

                              let optBorder = 'border-white/5 bg-white/5 text-slate-300';
                              if (isOfficialKey) {
                                optBorder = 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-bold';
                              } else if (isStudentPick && !isCorrect) {
                                optBorder = 'border-rose-500/60 bg-rose-500/20 text-rose-200';
                              }

                              return (
                                <div
                                  key={optKey}
                                  className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${optBorder}`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                                    {optKey.toUpperCase()}
                                  </span>
                                  <span className="text-left flex-1">{optText}</span>
                                  {isOfficialKey && (
                                    <span className="text-[10px] uppercase font-extrabold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                      Kunci
                                    </span>
                                  )}
                                  {isStudentPick && !isOfficialKey && (
                                    <span className="text-[10px] uppercase font-extrabold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
                                      Pilihanmu
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Jawaban Siswa:
                        </span>
                        <p className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {typeof studentAns === 'object'
                            ? JSON.stringify(studentAns)
                            : String(studentAns || '(Tidak dijawab)')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block">
                          Kunci Jawaban Resmi Guru:
                        </span>
                        <p className="font-bold text-amber-200">
                          {correctKey}
                        </p>
                      </div>
                    </div>

                    {/* Educational TP explanation */}
                    {(pembahasan || tpRumusan) && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pembahasan Edukatif &amp; Ketercapaian TP:</span>
                        </div>
                        {tpRumusan && (
                          <p className="text-indigo-200 font-semibold text-[11px]">
                            TP Terkait: {tpRumusan}
                          </p>
                        )}
                        {pembahasan && (
                          <p className="text-slate-200 leading-relaxed text-[11px]">
                            {pembahasan}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/80 shrink-0">
            <span className="text-xs text-slate-400 text-center sm:text-left">
              Gunakan kunci dan pembahasan ini sebagai bahan belajar mandiri untuk memperkuat kompetensi materi.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all"
            >
              Tutup Pembahasan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
