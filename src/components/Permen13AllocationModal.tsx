import React, { useState } from 'react';
import {
  ALOKASI_KELAS_1,
  ALOKASI_KELAS_2,
  ALOKASI_KELAS_3_4,
  ALOKASI_KELAS_5,
  ALOKASI_KELAS_6,
  LevelAllocationStructure,
  getPermen13Allocation,
} from '../data/permendikdasmen13Data';
import { X, Clock, BookOpen, ShieldCheck, Check, Sparkles, AlertCircle, Info } from 'lucide-react';

interface Permen13AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapel?: string;
  currentFase?: string;
  currentKelas?: string;
  onApplyAllocation?: (alokasiText: string) => void;
}

export const Permen13AllocationModal: React.FC<Permen13AllocationModalProps> = ({
  isOpen,
  onClose,
  currentMapel = 'Matematika',
  currentFase = 'Fase C',
  currentKelas = '5 & 6',
  onApplyAllocation,
}) => {
  // Determine initial active tab based on currentKelas / currentFase
  const getInitialTab = (): '1' | '2' | '3_4' | '5' | '6' => {
    const k = String(currentKelas || '').toLowerCase();
    const f = String(currentFase || '').toLowerCase();
    if (f.includes('fase a') || f === 'a') {
      if (k.includes('2')) return '2';
      return '1';
    }
    if (f.includes('fase b') || f === 'b' || k.includes('3') || k.includes('4')) return '3_4';
    if ((k.includes('6') || k.includes('vi')) && !k.includes('5') && !k.includes('v')) return '6';
    return '5';
  };

  const [activeTab, setActiveTab] = useState<'1' | '2' | '3_4' | '5' | '6'>(getInitialTab());

  const currentAllocation = getPermen13Allocation(currentMapel, currentFase, currentKelas);

  const structures: Record<string, LevelAllocationStructure> = {
    '1': ALOKASI_KELAS_1,
    '2': ALOKASI_KELAS_2,
    '3_4': ALOKASI_KELAS_3_4,
    '5': ALOKASI_KELAS_5,
    '6': ALOKASI_KELAS_6,
  };

  const activeStructure = structures[activeTab];

  const handleApply = (customText?: string) => {
    if (onApplyAllocation) {
      const text = customText || `${currentAllocation.jpTahunIntra} JP / Tahun (${currentAllocation.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`;
      onApplyAllocation(text);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1528] via-[#162a52] to-[#0B1528] p-4 sm:p-5 text-white flex items-start justify-between gap-3 border-b-2 border-amber-400 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Regulasi Resmi
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Permendikdasmen Nomor 13 Tahun 2025
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Struktur &amp; Standar Alokasi Waktu Intrakurikuler SD (Fase A, B, C)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Standar durasi pembelajaran resmi SD: <strong className="text-amber-300">1 JP = 35 Menit</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Selection Highlight Banner */}
        <div className="bg-amber-50 p-3 sm:p-4 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
                Mata Pelajaran yang Sedang Dipilih:
              </span>
              <div className="text-sm font-black text-slate-950 flex items-center gap-2 flex-wrap">
                <span>{currentMapel}</span>
                <span className="text-xs font-semibold text-slate-600">({currentFase} • Kelas {currentKelas})</span>
                <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {currentAllocation.jpMingguIntra} JP / Minggu
                </span>
                <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                  {currentAllocation.jpTahunIntra} JP / Tahun ({currentAllocation.jpSemesterIntra} JP/Semester)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleApply()}
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border-2 border-amber-500 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Alokasi ke Dokumen</span>
          </button>
        </div>

        {/* Level Tabs (Kelas 1 s.d 6 SD) */}
        <div className="bg-slate-100 px-4 pt-3 border-b border-slate-300 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('1')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 border-x-2 cursor-pointer ${
              activeTab === '1'
                ? 'bg-white border-slate-300 border-b-transparent text-blue-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas I (Fase A)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('2')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 border-x-2 cursor-pointer ${
              activeTab === '2'
                ? 'bg-white border-slate-300 border-b-transparent text-blue-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas II (Fase A)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('3_4')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 border-x-2 cursor-pointer ${
              activeTab === '3_4'
                ? 'bg-white border-slate-300 border-b-transparent text-blue-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas III &amp; IV (Fase B)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('5')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 border-x-2 cursor-pointer ${
              activeTab === '5'
                ? 'bg-white border-slate-300 border-b-transparent text-blue-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas V (Fase C)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('6')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 border-x-2 cursor-pointer ${
              activeTab === '6'
                ? 'bg-white border-slate-300 border-b-transparent text-blue-900 shadow-xs'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kelas VI (Fase C) • 32 Minggu
          </button>
        </div>

        {/* Modal Body / Table Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              {activeStructure.catatanRegulasi}
            </span>
            <span className="font-bold text-slate-900">
              Asumsi: {activeStructure.asumsiMingguTahun} Minggu Efektif/Tahun • 1 JP = {activeStructure.durasiMenitPerJP} Menit
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2.5 border-r border-slate-200 w-8 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-200">Mata Pelajaran</th>
                  <th className="p-2.5 border-r border-slate-200 text-center w-28 bg-emerald-50 text-emerald-950">
                    Alokasi Intrakurikuler
                    <span className="block text-[10px] font-normal text-emerald-700">(per Minggu / Tahun)</span>
                  </th>
                  <th className="p-2.5 border-r border-slate-200 text-center w-28 bg-blue-50 text-blue-950">
                    Kokurikuler (P3/DPL)
                    <span className="block text-[10px] font-normal text-blue-700">(per Tahun)</span>
                  </th>
                  <th className="p-2.5 text-center w-28 font-extrabold bg-slate-200 text-slate-900">
                    Total Beban Belajar
                    <span className="block text-[10px] font-normal text-slate-700">(per Tahun)</span>
                  </th>
                  <th className="p-2.5 text-center w-24 bg-slate-100 text-slate-900">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeStructure.daftarMapel.map((m, idx) => {
                  const cur = (currentMapel || '').toLowerCase().trim();
                  const mName = (m.mataPelajaran || '').toLowerCase().trim();
                  const isCurrent =
                    cur !== '' &&
                    mName !== '' &&
                    (mName.includes(cur) || cur.includes(mName));

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-amber-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center border-r border-slate-200 font-medium text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{m.mataPelajaran}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">
                              Mapel Anda
                            </span>
                          )}
                          {m.kategori === 'pilihan' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              Mapel Pilihan Baru
                            </span>
                          )}
                          {m.kategori === 'mulok' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                              Muatan Lokal
                            </span>
                          )}
                        </div>
                        {m.keterangan && (
                          <span className="text-[10.5px] text-slate-500 italic block mt-0.5">
                            {m.keterangan}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-emerald-950 bg-emerald-50/50">
                        <span>{m.jpMingguIntra} JP / mgg</span>
                        <span className="block text-[10.5px] text-emerald-700 font-normal">
                          ({m.jpTahunIntra} JP / tahun)
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center text-blue-900 bg-blue-50/50">
                        {m.jpTahunKoku ? (
                          <>
                            <span className="font-semibold">{m.jpMingguKoku || 1} JP / mgg</span>
                            <span className="block text-[10.5px] text-blue-700">({m.jpTahunKoku} JP)</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-950 bg-slate-100 border-r border-slate-200">
                        {m.totalJPTahun} JP
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const customText = `${m.jpTahunIntra} JP / Tahun (${m.jpMingguIntra} JP/Minggu Intrakurikuler @ 35 Menit) - Permendikdasmen No. 13 Tahun 2025`;
                            handleApply(customText);
                          }}
                          className={`px-2 py-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xs'
                              : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-300'
                          }`}
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-2.5 text-right border-r border-slate-300">
                    TOTAL BEBAN BELAJAR WAJIB (Belum Termasuk Mulok/Pilihan):
                  </td>
                  <td className="p-2.5 text-center border-r border-slate-300 text-emerald-950 bg-emerald-100">
                    {activeStructure.totalWajibIntra} JP
                  </td>
                  <td className="p-2.5 text-center border-r border-slate-300 text-blue-950 bg-blue-100">
                    {activeStructure.totalWajibKoku} JP
                  </td>
                  <td className="p-2.5 text-center bg-slate-300 text-slate-950 border-r border-slate-300">
                    {activeStructure.totalWajibSemua} JP
                  </td>
                  <td className="p-2.5 text-center bg-slate-200 text-slate-400">
                    -
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Key Insights & Implementation Rules */}
          <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 space-y-1.5 text-xs text-blue-950">
            <h4 className="font-black flex items-center gap-1.5 text-blue-900 uppercase tracking-wide">
              <BookOpen className="w-4 h-4" />
              Ketentuan Implementasi Permendikdasmen No. 13 Tahun 2025 untuk Guru SD:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
              <li>
                <strong>Durasi 1 JP:</strong> Seluruh perhitungan jam pelajaran intrakurikuler jenjang SD dihitung berbasis <strong>35 menit per JP</strong>.
              </li>
              <li>
                <strong>Jumlah Minggu Efektif:</strong> Kelas I sampai V diasumsikan <strong>36 minggu efektif per tahun</strong> (18 minggu per semester). Khusus Kelas VI dialokasikan <strong>32 minggu efektif</strong> untuk mengakomodasi persiapan kelulusan akhir jenjang.
              </li>
              <li>
                <strong>Mata Pelajaran Pilihan Baru (Pasal 32A):</strong> Satuan pendidikan dapat menyelenggarakan mata pelajaran pilihan <em>Koding dan Kecerdasan Artifisial</em> dengan alokasi 2 JP/minggu (72 JP/tahun pada kelas 5, 64 JP/tahun pada kelas 6).
              </li>
              <li>
                <strong>Kesesuaian Dokumen ATP &amp; Modul Ajar:</strong> Akumulasi JP pada Tujuan Pembelajaran (TP) dan Bab Materi Pokok wajib relevan dan mencakup kuota jam intrakurikuler per semester/tahun secara proporsional.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Aplikasi otomatis menyesuaikan alokasi waktu dokumen dengan regulasi terbaru.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => handleApply()}
              className="px-4 py-2 rounded-lg text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Alokasi Resmi Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
