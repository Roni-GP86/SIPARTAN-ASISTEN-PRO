import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  Building,
  GraduationCap,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  KALDIK_TTU_METADATA,
  KALDIK_TTU_MONTHS,
  KALDIK_TTU_EVENTS,
} from '../data/kaldikTTUData';

interface KaldikTTUModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KaldikTTUModal: React.FC<KaldikTTUModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'bulanan' | 'agenda'>('ringkasan');
  const [filterSemester, setFilterSemester] = useState<'all' | '1' | '2'>('all');

  if (!isOpen) return null;

  const filteredMonths = KALDIK_TTU_MONTHS.filter(
    (m) => filterSemester === 'all' || m.semester === filterSemester
  );

  const filteredEvents = KALDIK_TTU_EVENTS.filter(
    (e) => filterSemester === 'all' || e.semester === filterSemester
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1528] via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Resmi Kab. TTU • TA {KALDIK_TTU_METADATA.tahunAjaran}
                </span>
                <span className="text-[11px] text-slate-300 hidden sm:inline">SK No. {KALDIK_TTU_METADATA.nomorSK}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                Kalender Pendidikan Kabupaten Timor Tengah Utara
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Semester Selector */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ringkasan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ringkasan'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkasan Regulasi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulanan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bulanan'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rincian Hari Efektif
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda Asesmen & Libur
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Filter Semester:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterSemester('all')}
                className={`px-2 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                  filterSemester === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterSemester('1')}
                className={`px-2 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                  filterSemester === '1'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semester 1
              </button>
              <button
                type="button"
                onClick={() => setFilterSemester('2')}
                className={`px-2 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                  filterSemester === '2'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semester 2
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: RINGKASAN REGULASI */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Card Ringkasan HE & ME */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                      Semester 1 (Ganjil)
                    </span>
                    <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                      22 Minggu
                    </span>
                  </div>
                  <div className="text-2xl font-black text-indigo-950">
                    {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester1.hariEfektifSekolah}{' '}
                    <span className="text-xs font-semibold text-indigo-700">Hari Efektif</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 mt-1">
                    18 Minggu Efektif Intrakurikuler • 1 Hari Efektif Fakultatif (Hari Arwah)
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Semester 2 (Genap)
                    </span>
                    <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                      22 Minggu
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950">
                    {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.semester2.hariEfektifSekolah}{' '}
                    <span className="text-xs font-semibold text-emerald-700">Hari Efektif</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    18 Minggu Efektif Intrakurikuler • 2 Hari Fakultatif (Rabu Abu &amp; Tri Hari Suci)
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Total 1 Tahun Pelajaran
                    </span>
                    <span className="text-xs font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md">
                      44 Minggu
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-950">
                    {KALDIK_TTU_METADATA.rekapitulasiHariEfektif.totalTahunan.hariEfektifSekolah}{' '}
                    <span className="text-xs font-semibold text-amber-800">Hari Efektif Sekolah</span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1">
                    36 Minggu Efektif Intrakurikuler • 91 Total Hari Libur Resmi
                  </p>
                </div>
              </div>

              {/* Ketentuan Teknis Jam Belajar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Ketentuan Jam &amp; Waktu Pembelajaran Satuan Pendidikan (Bab V &amp; VI)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Waktu Mulai Sekolah</span>
                    <span className="font-extrabold text-slate-900">Pukul 07.30 WITA</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Berlaku untuk seluruh satuan pendidikan di Kab. TTU</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Durasi JP Jenjang SD</span>
                    <span className="font-extrabold text-slate-900">35 Menit / Jam Pelajaran</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tatap muka intrakurikuler sesuai struktur kurikulum</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Minimal Minggu Efektif</span>
                    <span className="font-extrabold text-slate-900">Minimal 18 Minggu / Semester</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Termasuk kegiatan intrakurikuler dan kokurikuler (P5)</p>
                  </div>
                </div>
              </div>

              {/* Data Penetapan & Pejabat */}
              <div className="p-4 bg-indigo-950 text-white rounded-xl border border-indigo-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300">{KALDIK_TTU_METADATA.dinas}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Ditetapkan di {KALDIK_TTU_METADATA.tempatPenetapan} pada tanggal {KALDIK_TTU_METADATA.tanggalSK}
                  </p>
                  <p className="text-slate-400 text-[10.5px]">
                    Kepala Dinas: <strong className="text-white">{KALDIK_TTU_METADATA.kepalaDinas.nama}</strong> ({KALDIK_TTU_METADATA.kepalaDinas.pangkat}, NIP {KALDIK_TTU_METADATA.kepalaDinas.nip})
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-right shrink-0">
                  <span className="text-[10px] text-amber-300 font-bold block uppercase">Kesesuaian Aplikasi</span>
                  <span className="text-xs font-black text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Sinkron Prota &amp; Promes
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RINCIAN HARI EFEKTIF PER BULAN */}
          {activeTab === 'bulanan' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Bulan</th>
                      <th className="p-2.5 text-center">Semester</th>
                      <th className="p-2.5 text-center">Minggu Efektif</th>
                      <th className="p-2.5 text-center">Hari Efektif (HE)</th>
                      <th className="p-2.5 text-center">Fakultatif</th>
                      <th className="p-2.5">Catatan &amp; Agenda Khusus Kab. TTU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMonths.map((m, idx) => (
                      <tr key={m.namaBulan} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-black text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {m.namaBulan} {m.tahun}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.semester === '1'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Sem {m.semester}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-black text-indigo-700">
                          {m.mingguEfektif} ME
                        </td>
                        <td className="p-2.5 text-center font-black text-slate-900 bg-slate-50/50">
                          {m.hariEfektif} Hari
                        </td>
                        <td className="p-2.5 text-center">
                          {m.hariEfektifFakultatif ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                              {m.hariEfektifFakultatif} Hari
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                          {m.catatanKhusus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={2} className="p-2.5 uppercase font-black">
                        Total {filterSemester === 'all' ? '1 Tahun' : `Semester ${filterSemester}`}
                      </td>
                      <td className="p-2.5 text-center font-black text-indigo-800">
                        {filteredMonths.reduce((sum, m) => sum + m.mingguEfektif, 0)} ME
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-900">
                        {filteredMonths.reduce((sum, m) => sum + m.hariEfektif, 0)} Hari Efektif
                      </td>
                      <td className="p-2.5 text-center font-black text-purple-800">
                        {filteredMonths.reduce((sum, m) => sum + (m.hariEfektifFakultatif || 0), 0)} Hari
                      </td>
                      <td className="p-2.5 text-slate-500 italic text-[10px]">
                        Berdasarkan Lampiran II, III, dan IV SK Kaldik Kab. TTU No. 400.3/36/2026
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AGENDA ASESMEN & LIBUR RESMI */}
          {activeTab === 'agenda' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${evt.badgeWarna}`}>
                        {evt.badgeKode}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Sem {evt.semester}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {evt.nama}
                    </div>
                    <div className="text-[11px] font-black text-indigo-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {evt.tanggal}
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-snug">
                      {evt.keterangan}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-[11px]">
              Kaldik ini otomatis disinkronkan ke distribusi pekan PROMES dan kalkulasi alokasi PROTA.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
