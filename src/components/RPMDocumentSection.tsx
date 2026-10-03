import React, { useState } from 'react';
import { ModulAjarDocument, SchoolIdentity } from '../types';
import { BookOpen, Users, Award, Layers, Sparkles, Laptop, CheckCircle2, Lock, Edit2, Plus, X, Check } from 'lucide-react';
import { normalizeRPMData, cleanParentheses, getPrinsipBadgeInfo, getPengalamanBadgeInfo, cleanMeetingAlokasi, cleanMeetingFokus, parseTotalJPAndCount, calculateMeetingTimeAllocation, cleanActivityText } from '../utils/rpmUtils';
import { getResolvedMeetings } from '../utils/exportUtils';

interface RPMDocumentSectionProps {
  modul: ModulAjarDocument;
  judulModul: string;
  setJudulModul: (val: string) => void;
  topikMateri: string;
  setTopikMateri: (val: string) => void;
  alokasiWaktu: string;
  setAlokasiWaktu: (val: string) => void;
  tahunPelajaran: string;
  setTahunPelajaran: (val: string) => void;
  semester: string;
  setSemester: (val: string) => void;
  activeTab: string;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onUpdatePemanfaatanTeknologi?: (updated: {
    platformAplikasi: string[];
    perangkatDigital: string[];
    mediaDigital: string[];
  }) => void;
}

export const RPMDocumentSection: React.FC<RPMDocumentSectionProps> = ({
  modul,
  judulModul,
  setJudulModul,
  topikMateri,
  setTopikMateri,
  alokasiWaktu,
  setAlokasiWaktu,
  tahunPelajaran,
  setTahunPelajaran,
  semester,
  setSemester,
  activeTab,
  onUpdateIdentitas,
  onUpdatePemanfaatanTeknologi,
}) => {
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [newPerangkatInput, setNewPerangkatInput] = useState('');
  const [newMediaInput, setNewMediaInput] = useState('');
  // Robust normalization for RPM data to safely handle all array/object shapes
  const { totalJP, count, jpList, formattedIdentityAlokasi } = parseTotalJPAndCount(modul, alokasiWaktu);
  const displayAlokasi = formattedIdentityAlokasi || alokasiWaktu;

  const { idData, dsData, lpData, asData, rbData, lkData, soData } = normalizeRPMData(modul, {
    alokasiWaktu: displayAlokasi,
    topikMateri,
  });

  const resolvedMeetings = getResolvedMeetings(modul, displayAlokasi);

  return (
    <div className="scientific-doc modul-ajar-document space-y-6 text-[12pt] leading-[1.5] text-slate-900 break-words" style={{ fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', serif", fontSize: '12pt', lineHeight: 1.5 }}>
      {/* Header Modul RPM */}
      <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
        <div className="no-print inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[11pt] font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Rencana Pembelajaran Mendalam (RPM) • Deep Learning</span>
        </div>
        <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase text-slate-900 leading-snug">
          {judulModul}
        </h1>
      </div>

      {/* A. INFORMASI UMUM / IDENTITAS */}
      <section id="rpm-info-umum" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-800 no-print" />
            <span>A. Informasi Umum / Identitas Modul</span>
          </h3>
        </div>

        {/* Formal Academic Identitas Table - Titik Dua Sejajar Presisi dengan Isi */}
        <div className="border border-slate-400 rounded-none mb-3 overflow-hidden bg-white shadow-2xs print:shadow-none">
          <table className="w-full text-left text-[11pt] sm:text-[12pt] leading-[1.5] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '230px' }} />
              <col style={{ width: '32px' }} />
              <col style={{ width: 'auto' }} />
            </colgroup>
            <tbody className="divide-y divide-slate-400">
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Nama Satuan Pendidikan</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words font-bold align-top">{modul.identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Penyusun / Guru</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words font-bold align-top">{modul.identitas.namaGuru}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Tahun Pelajaran / Semester</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words align-top">{tahunPelajaran} / Semester {semester}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Fase / Kelas</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words align-top">{modul.identitas.fase} / Kelas {modul.identitas.kelas}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Mata Pelajaran</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 font-bold text-black break-words align-top">{modul.identitas.mataPelajaran}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Elemen</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words align-top">{modul.elemen || (modul as any).elemen || '-'}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Topik / Materi</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 text-black break-words font-semibold align-top">{topikMateri}</td>
              </tr>
              <tr>
                <td className="w-[230px] p-2.5 font-bold bg-slate-100 border-r border-slate-400 text-black align-top">Alokasi Waktu</td>
                <td className="w-8 p-2.5 text-center font-bold text-black border-r border-slate-400 align-top select-none">:</td>
                <td className="p-2.5 font-bold text-black break-words align-top">{displayAlokasi}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Screen Only: Form Inputs for Editing */}
        <div className="no-print bg-white p-4 rounded-lg border border-slate-300 space-y-3 text-[12pt] leading-[1.5]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                Judul Modul (Dapat Diedit Manual):
              </label>
              <input
                type="text"
                value={judulModul}
                onChange={(e) => setJudulModul(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 text-[12pt]"
                placeholder="Masukkan Judul Modul..."
              />
            </div>

            <div>
              <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                Penyusun:
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-[12pt]">
                {modul.identitas.namaGuru}
              </div>
            </div>

            <div>
              <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                Nama Satuan Pendidikan:
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-[12pt]">
                {modul.identitas.namaSatuanPendidikan || 'SD Negeri Fatubai'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                  Tahun Pelajaran:
                </label>
                <input
                  type="text"
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 text-[12pt]"
                />
              </div>
              <div>
                <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                  Semester:
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 text-[12pt] cursor-pointer"
                >
                  <option value="1">1 (Ganjil)</option>
                  <option value="2">2 (Genap)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                  Fase / Kelas:
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded font-medium text-slate-900 text-[12pt]">
                  {modul.identitas.fase} / Kelas {modul.identitas.kelas}
                </div>
              </div>
              <div>
                <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                  Mata Pelajaran:
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-[12pt] break-words">
                  {modul.identitas.mataPelajaran}
                </div>
              </div>
            </div>

            <div>
              {(() => {
                const isAgama =
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('agama') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('katolik') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('kristen') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('islam') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('hindu') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('buddha') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('khonghucu') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('pak') ||
                  (modul.identitas?.mataPelajaran || '').toLowerCase().includes('pai');
                const regCpShort = isAgama ? 'BKP 020/2026' : 'BSKAP No. 046/2025';
                return (
                  <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                    Elemen ({regCpShort}):
                  </label>
                );
              })()}
              <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900 text-[12pt] break-words">
                {modul.elemen || (modul as any).elemen || '-'}
              </div>
            </div>

            <div>
              <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                Topik / Materi (Dapat Diedit Manual):
              </label>
              <input
                type="text"
                value={topikMateri}
                onChange={(e) => setTopikMateri(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 text-[12pt]"
                placeholder="Topik materi pembelajaran..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11pt] font-bold text-slate-800 mb-1">
                Alokasi Waktu:
              </label>
              <input
                type="text"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 text-[12pt]"
                placeholder="2 x 35 Menit (1 kali pertemuan)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* B. IDENTIFIKASI - WAJIB DIMULAI DARI HALAMAN 2 */}
      <section id="rpm-identifikasi" className={`space-y-4 print:break-before-page ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-800 no-print" />
            <span>B. Identifikasi</span>
          </h3>
        </div>

        <div className="space-y-3 text-[12pt] leading-[1.5]">
          {/* 1. Identifikasi Murid */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-[12pt]">
              1. Identifikasi Murid:
            </h4>

            <div className="space-y-2 pl-4 text-slate-900">
              <div>
                <strong className="text-slate-900">(a) Kompetensi Awal Murid:</strong>
                <p className="mt-1 text-slate-900 text-justify break-words leading-[1.5]">{idData.kompetensiAwal}</p>
              </div>

              <div>
                <strong className="text-slate-900">(b) Karakteristik Murid:</strong>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(idData.karakteristikMurid || []).map((k, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-900 font-semibold rounded border border-slate-300 text-[11pt] sm:text-[12pt] break-words">
                      {k}
                    </span>
                  ))}
                  {idData.karakteristikMuridCustom && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-semibold rounded border border-slate-300 text-[11pt] sm:text-[12pt] break-words">
                      {idData.karakteristikMuridCustom}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <strong className="text-slate-900">(c) Kebutuhan Murid:</strong>
                <p className="mt-1 text-slate-900 text-justify break-words leading-[1.5]">{idData.kebutuhanMurid}</p>
              </div>
            </div>
          </div>

          {/* 2. Karakteristik Materi */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-[12pt]">
              2. Karakteristik Materi:
            </h4>
            <p className="pl-4 text-slate-900 text-justify break-words leading-[1.5]">
              {idData.karakteristikMateri}
            </p>
          </div>

          {/* 3. Dimensi Profil Lulusan */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 text-[12pt]">
              3. Dimensi Profil Lulusan (Minimal 3 DPL Sesuai Dokumen ATP):
            </h4>
            <div className="pl-4 flex flex-wrap gap-2 pt-1">
              {(idData.dimensiProfilLulusan || []).map((d, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-900 font-bold rounded border border-slate-300 text-[11pt] sm:text-[12pt]">
                  <Award className="w-3.5 h-3.5 text-slate-700 no-print" />
                  <span>{d}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* C. DESAIN PEMBELAJARAN */}
      <section id="rpm-desain" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-800 no-print" />
            <span>C. Desain Pembelajaran</span>
          </h3>
        </div>

        <div className="space-y-3.5 text-[12pt] leading-[1.5]">
          {/* Capaian Pembelajaran */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[12pt]">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0 no-print" />
                <span>1. Capaian Pembelajaran (Berdasarkan Elemen dari TP Terpilih):</span>
              </h4>
              <span className="text-[11pt] font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                Elemen: {modul.elemen || (dsData.capaianPembelajaranPerElemen ? dsData.capaianPembelajaranPerElemen.map((e) => e.elemen).join(' & ') : '-')}
              </span>
            </div>

            {dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0 ? (
              <div className="space-y-2.5">
                {dsData.capaianPembelajaranPerElemen.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-300 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-1 flex-wrap">
                      <span className="font-bold text-slate-900 text-[12pt]">
                        Elemen: {item.elemen}
                      </span>
                    </div>
                    <p className="text-slate-900 leading-[1.5] text-justify whitespace-pre-line text-[12pt] break-words">
                      {item.capaianPembelajaran}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-900 leading-[1.5] text-justify bg-slate-50 p-3 rounded border border-slate-300 whitespace-pre-line text-[12pt] break-words">
                {dsData.capaianPembelajaran}
              </p>
            )}
          </div>

          {/* Tujuan Pembelajaran (FONT NORMAL - TIDAK BOLD SESUAI PERMINTAAN USER) */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[12pt]">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0 no-print" />
              <span>2. Tujuan Pembelajaran:</span>
            </h4>
            <p className="text-slate-900 leading-[1.5] text-justify bg-slate-50 p-3 rounded border border-slate-300 font-normal break-words">
              {dsData.tujuanPembelajaran}
            </p>
          </div>

          {/* Lintas Disiplin Ilmu */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 text-[12pt]">3. Lintas Disiplin Ilmu:</h4>
            <div className="border border-slate-400 rounded overflow-hidden">
              <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th className="p-2.5 w-[30%] border-r border-slate-400 text-center">Mata Pelajaran Terkait</th>
                    <th className="p-2.5 w-[70%] text-center">Keterkaitan Konsep / Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(dsData.lintasDisiplinIlmu || []).map((ld, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">{ld.mataPelajaran}</td>
                      <td className="p-2.5 text-slate-800 text-justify break-words leading-[1.5]">{ld.keterkaitan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Praktik Pedagogis */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 text-[12pt]">4. Praktik Pedagogis:</h4>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 rounded border border-slate-300">
                <span className="text-[11pt] font-bold text-slate-600 uppercase">Model Pembelajaran:</span>
                <p className="font-bold text-slate-900 mt-0.5 break-words">{dsData.praktikPedagogis.modelPembelajaran}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-300 sm:col-span-2">
                <span className="text-[11pt] font-bold text-slate-600 uppercase">Pendekatan Pembelajaran:</span>
                <p className="font-bold text-slate-900 mt-0.5 break-words">{cleanParentheses(dsData.praktikPedagogis.pendekatanPembelajaran)}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-300">
              <span className="text-[11pt] font-bold text-slate-600 uppercase">Metode Pembelajaran:</span>
              <p className="text-slate-900 mt-0.5 break-words">{dsData.praktikPedagogis.metodePembelajaran.join(', ')}</p>
            </div>
          </div>

          {/* 5. Mitra Pembelajaran (Kemitraan) - TERPISAH SEPERTI 1. MITRA INTERNAL, 2. MITRA EKSTERNAL */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 text-[12pt]">
              5. Mitra Pembelajaran (Kemitraan):
            </h4>
            <div className="pl-4 space-y-2 text-slate-900 leading-[1.5]">
              {dsData.mitraPembelajaran.mitraInternal.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">1. Mitra Internal:</span>
                  <p className="pl-4 text-slate-800 text-justify break-words">
                    {dsData.mitraPembelajaran.mitraInternal.join(', ')}
                  </p>
                </div>
              )}
              {dsData.mitraPembelajaran.mitraEksternal.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">
                    {dsData.mitraPembelajaran.mitraInternal.length > 0 ? '2. Mitra Eksternal:' : '1. Mitra Eksternal:'}
                  </span>
                  <p className="pl-4 text-slate-800 text-justify break-words">
                    {dsData.mitraPembelajaran.mitraEksternal.join(', ')}
                  </p>
                </div>
              )}
              {dsData.mitraPembelajaran.mitraInternal.length === 0 && dsData.mitraPembelajaran.mitraEksternal.length === 0 && (
                <p className="text-slate-600 italic">
                  Tidak melibatkan mitra luar/khusus (Pembelajaran mandiri di ruang kelas).
                </p>
              )}
            </div>
          </div>

          {/* 6. Lingkungan Belajar */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 text-[12pt]">
              6. Lingkungan Belajar:
            </h4>
            <div className="pl-4 space-y-2 text-slate-900 leading-[1.5]">
              <div>
                <span className="font-bold text-slate-900 block">1. Lingkungan Fisik:</span>
                <p className="pl-4 text-slate-800 text-justify break-words">
                  {dsData.lingkunganBelajar.lingkunganFisik.join(', ') || '-'}
                  {dsData.lingkunganBelajar.lingkunganFisikDeskripsi && ` (${dsData.lingkunganBelajar.lingkunganFisikDeskripsi})`}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">2. Budaya Belajar:</span>
                <p className="pl-4 text-slate-800 text-justify break-words">
                  {dsData.lingkunganBelajar.budayaBelajar.join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 7. Pemanfaatan Teknologi Digital */}
          <div className="p-4 bg-white rounded border border-slate-300 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-[12pt]">
                <Laptop className="w-4 h-4 text-slate-700 shrink-0 no-print" />
                <span>7. Pemanfaatan Teknologi Digital &amp; Media:</span>
              </h4>
              {onUpdatePemanfaatanTeknologi && (
                <button
                  type="button"
                  onClick={() => setIsEditingTech(!isEditingTech)}
                  className="no-print px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1 cursor-pointer transition-colors"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {isEditingTech ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                      <span>Selesai Edit</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3 h-3 text-teal-700" />
                      <span>Edit / Tambah Manual</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isEditingTech && onUpdatePemanfaatanTeknologi && (
              <div
                className="no-print p-3.5 bg-teal-50/70 border border-teal-300 rounded-xl space-y-3 text-xs"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <p className="text-[11px] text-teal-900 font-semibold">
                  Ketik pada kotak di bawah untuk mengedit item yang sudah ada, menghapus, atau menambahkan Platform, Perangkat, dan Media Pembelajaran secara manual:
                </p>

                {/* 1. Edit Platform & Aplikasi */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    1. Platform &amp; Aplikasi Digital:
                  </label>
                  <div className="space-y-1.5">
                    {dsData.pemanfaatanTeknologi.platformAplikasi.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...dsData.pemanfaatanTeknologi.platformAplikasi];
                            updated[idx] = e.target.value;
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              platformAplikasi: updated,
                            });
                          }}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = dsData.pemanfaatanTeknologi.platformAplikasi.filter((_, i) => i !== idx);
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              platformAplikasi: updated,
                            });
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newPlatformInput}
                        onChange={(e) => setNewPlatformInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newPlatformInput.trim()) {
                              onUpdatePemanfaatanTeknologi({
                                ...dsData.pemanfaatanTeknologi,
                                platformAplikasi: [
                                  ...dsData.pemanfaatanTeknologi.platformAplikasi,
                                  newPlatformInput.trim(),
                                ],
                              });
                              setNewPlatformInput('');
                            }
                          }
                        }}
                        placeholder="Tambah platform/aplikasi manual..."
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-300 rounded bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPlatformInput.trim()) {
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              platformAplikasi: [
                                ...dsData.pemanfaatanTeknologi.platformAplikasi,
                                newPlatformInput.trim(),
                              ],
                            });
                            setNewPlatformInput('');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Edit Perangkat Digital */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    2. Perangkat Digital:
                  </label>
                  <div className="space-y-1.5">
                    {dsData.pemanfaatanTeknologi.perangkatDigital.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...dsData.pemanfaatanTeknologi.perangkatDigital];
                            updated[idx] = e.target.value;
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              perangkatDigital: updated,
                            });
                          }}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = dsData.pemanfaatanTeknologi.perangkatDigital.filter((_, i) => i !== idx);
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              perangkatDigital: updated,
                            });
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newPerangkatInput}
                        onChange={(e) => setNewPerangkatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newPerangkatInput.trim()) {
                              onUpdatePemanfaatanTeknologi({
                                ...dsData.pemanfaatanTeknologi,
                                perangkatDigital: [
                                  ...dsData.pemanfaatanTeknologi.perangkatDigital,
                                  newPerangkatInput.trim(),
                                ],
                              });
                              setNewPerangkatInput('');
                            }
                          }
                        }}
                        placeholder="Tambah perangkat digital manual..."
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-300 rounded bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPerangkatInput.trim()) {
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              perangkatDigital: [
                                ...dsData.pemanfaatanTeknologi.perangkatDigital,
                                newPerangkatInput.trim(),
                              ],
                            });
                            setNewPerangkatInput('');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Edit Media Pembelajaran / Digital */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <label className="font-bold text-slate-800 block text-[11px]">
                    3. Media Pembelajaran / Media Digital:
                  </label>
                  <div className="space-y-1.5">
                    {dsData.pemanfaatanTeknologi.mediaDigital.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...dsData.pemanfaatanTeknologi.mediaDigital];
                            updated[idx] = e.target.value;
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              mediaDigital: updated,
                            });
                          }}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = dsData.pemanfaatanTeknologi.mediaDigital.filter((_, i) => i !== idx);
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              mediaDigital: updated,
                            });
                          }}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newMediaInput}
                        onChange={(e) => setNewMediaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newMediaInput.trim()) {
                              onUpdatePemanfaatanTeknologi({
                                ...dsData.pemanfaatanTeknologi,
                                mediaDigital: [
                                  ...dsData.pemanfaatanTeknologi.mediaDigital,
                                  newMediaInput.trim(),
                                ],
                              });
                              setNewMediaInput('');
                            }
                          }
                        }}
                        placeholder="Tambah media pembelajaran manual..."
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-300 rounded bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newMediaInput.trim()) {
                            onUpdatePemanfaatanTeknologi({
                              ...dsData.pemanfaatanTeknologi,
                              mediaDigital: [
                                ...dsData.pemanfaatanTeknologi.mediaDigital,
                                newMediaInput.trim(),
                              ],
                            });
                            setNewMediaInput('');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pl-4 space-y-2 text-slate-900 leading-[1.5]">
              <div>
                <span className="font-bold text-slate-900 block">1. Platform &amp; Aplikasi Digital:</span>
                <p className="pl-4 text-slate-800 text-justify break-words">
                  {dsData.pemanfaatanTeknologi.platformAplikasi.filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">2. Perangkat Digital:</span>
                <p className="pl-4 text-slate-800 text-justify break-words">
                  {dsData.pemanfaatanTeknologi.perangkatDigital.filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">3. Media Pembelajaran Digital:</span>
                <p className="pl-4 text-slate-800 text-justify break-words">
                  {dsData.pemanfaatanTeknologi.mediaDigital.filter(Boolean).join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. LANGKAH-LANGKAH PEMBELAJARAN */}
      <section id="rpm-langkah" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'inti' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-800 no-print" />
            <span>D. Langkah-Langkah Pembelajaran (Sintaks Deep Learning)</span>
          </h3>
          <span className="text-[11pt] font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
            Total Alokasi: {displayAlokasi}
          </span>
        </div>

        {resolvedMeetings.length > 1 ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/70 border border-amber-300 rounded text-amber-900 text-xs font-semibold">
              📌 <strong>Rangkaian {resolvedMeetings.length} Pertemuan</strong> — Alokasi Waktu Total: {displayAlokasi} (Sesuai Permendikdasmen No. 13 Tahun 2025, 1 JP = 35 Menit)
            </div>
            {resolvedMeetings.map((pert, pIdx) => {
              const pertNo = pert.pertemuanKe || (pIdx + 1);
              const cleanAlokasi = cleanMeetingAlokasi(pert.alokasiWaktu, '2 JP (2 x 35 Menit)', pIdx, modul, displayAlokasi);
              const cleanFokus = cleanMeetingFokus(pert.fokusTP || topikMateri, '-', pIdx, resolvedMeetings.length, topikMateri, dsData.tujuanPembelajaran);
              const timeAlloc = calculateMeetingTimeAllocation(cleanAlokasi, 2);
              return (
              <div
                key={pIdx}
                className="border border-slate-400 rounded overflow-hidden shadow-2xs print:break-before-page break-before-page"
                style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
              >
                <div className="bg-slate-100 p-2.5 sm:p-3 border-b border-slate-400">
                  <div className="font-bold text-slate-950 text-[11pt] sm:text-[12pt] tracking-wide">
                    PERTEMUAN {pertNo}, ALOKASI WAKTU: {cleanAlokasi}
                  </div>
                  <div className="text-[11pt] text-slate-900 mt-1 leading-snug">
                    <span className="font-bold">FOKUS:</span> {cleanFokus}
                  </div>
                </div>
                <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                      <th className="p-2 w-[20%] border-r border-slate-300 text-center">Kegiatan</th>
                      <th className="p-2 w-[65%] border-r border-slate-300 text-center">Deskripsi Kegiatan &amp; Sintaks</th>
                      <th className="p-2 w-[15%] text-center">Alokasi Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr className="align-top">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300">
                        <div>1. Kegiatan Awal</div>
                        <div className="text-[10pt] font-normal text-slate-600 mt-0.5">(Pendahuluan)</div>
                      </td>
                      <td className="p-2 text-slate-800 border-r border-slate-300">
                        <ol className="list-decimal list-outside ml-5 space-y-1 text-slate-800">
                          {(pert.pendahuluan || []).map((step, idx) => (
                            <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(step)}</li>
                          ))}
                        </ol>
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900 align-middle">{timeAlloc.formatAwal}</td>
                    </tr>
                    <tr className="align-top">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300">
                        <div>2. Kegiatan Inti</div>
                        <div className="text-[10pt] font-normal text-slate-600 mt-0.5">({modul.modelPembelajaran || 'Deep Learning'})</div>
                      </td>
                      <td className="p-2 text-slate-800 border-r border-slate-300 space-y-2">
                        {(pert.kegiatanInti || []).map((step, sIdx) => {
                          const badge = step.prinsipPembelajaran ? getPrinsipBadgeInfo(step.prinsipPembelajaran) : null;
                          return (
                            <div key={sIdx} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                              <div className="border-b border-slate-200 pb-1">
                                <span className="font-bold text-sky-800 text-xs">{step.faseSintaks}</span>
                              </div>
                              <div className="text-xs text-slate-800 leading-relaxed">
                                <strong>Guru:</strong> {cleanActivityText(step.aktivitasGuru)}
                              </div>
                              <div className="text-xs text-slate-800 leading-relaxed">
                                <strong>Murid:</strong> {cleanActivityText(step.aktivitasSiswa)}
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1 text-[11pt]">
                                {step.pengalamanBelajar && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-sky-300 bg-sky-50 text-sky-900 font-bold text-[10px] sm:text-xs">
                                    <span>🌟</span>
                                    <span>Pengalaman: {step.pengalamanBelajar}</span>
                                  </span>
                                )}
                                {badge && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-bold text-[10px] sm:text-xs ${badge.bgClass}`}>
                                    <span>{badge.emoji}</span>
                                    <span>Prinsip: {step.prinsipPembelajaran}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900 align-middle">{timeAlloc.formatInti}</td>
                    </tr>
                    <tr className="align-top">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300">
                        <div>3. Kegiatan Akhir</div>
                        <div className="text-[10pt] font-normal text-slate-600 mt-0.5">(Penutup)</div>
                      </td>
                      <td className="p-2 text-slate-800 border-r border-slate-300">
                        <ol className="list-decimal list-outside ml-5 space-y-1 text-slate-800">
                          {(pert.penutup || []).map((step, idx) => (
                            <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(step)}</li>
                          ))}
                        </ol>
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900 align-middle">{timeAlloc.formatAkhir}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );})}
          </div>
        ) : (() => {
          const singleAlloc = cleanMeetingAlokasi(modul.alokasiWaktuPertemuan, displayAlokasi, 0, modul, displayAlokasi);
          const timeAllocSingle = calculateMeetingTimeAllocation(singleAlloc, 2);
          return (
          <div
            className="border border-slate-400 rounded overflow-hidden print:break-before-page break-before-page"
            style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
          >
            <div className="bg-slate-100 p-2.5 sm:p-3 border-b border-slate-400">
              <div className="font-bold text-slate-950 text-[11pt] sm:text-[12pt] tracking-wide">
                PERTEMUAN 1, ALOKASI WAKTU: {singleAlloc}
              </div>
              <div className="text-[11pt] text-slate-900 mt-1 leading-snug">
                <span className="font-bold">FOKUS:</span> {cleanMeetingFokus(topikMateri, '-', 0, 1, topikMateri, dsData.tujuanPembelajaran)}
              </div>
            </div>
            <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2.5 w-[20%] border-r border-slate-400 text-center">Kegiatan</th>
                  <th className="p-2.5 w-[65%] border-r border-slate-400 text-center">Deskripsi Kegiatan &amp; Sintaks Pembelajaran Mendalam</th>
                  <th className="p-2.5 w-[15%] text-center">Alokasi Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* Kegiatan Awal */}
                <tr className="align-top">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">
                    Kegiatan Awal
                  </td>
                  <td className="p-2.5 text-slate-800 border-r border-slate-300 space-y-2 leading-[1.5]">
                    {lpData.kegiatanAwal.deskripsi ? (
                      <p className="text-justify break-words">{lpData.kegiatanAwal.deskripsi}</p>
                    ) : null}
                    {lpData.kegiatanAwal.poinAktivitas && lpData.kegiatanAwal.poinAktivitas.length > 0 && (
                      <ol className="list-decimal list-outside ml-5 space-y-1.5 text-slate-800">
                        {lpData.kegiatanAwal.poinAktivitas.map((p, idx) => (
                          <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(p)}</li>
                        ))}
                      </ol>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-900 align-middle">
                    {timeAllocSingle.formatAwal}
                  </td>
                </tr>

                {/* Kegiatan Inti */}
                <tr className="align-top">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">
                    <div>Kegiatan Inti</div>
                    <div className="text-[11pt] font-normal text-slate-600 mt-0.5 break-words">({lpData.kegiatanInti.modelPembelajaran})</div>
                  </td>
                  <td className="p-2.5 text-slate-800 border-r border-slate-300 space-y-3 leading-[1.5]">
                    {(lpData.kegiatanInti.sintaks || []).map((s: any) => (
                      <div key={s.tahapKe} className="p-3 bg-slate-50 rounded border border-slate-300 space-y-1.5">
                        <div className="border-b border-slate-300 pb-1">
                          <span className="font-bold text-slate-900 text-[12pt]">{s.faseSintaks}</span>
                        </div>
                        {s.aktivitasGuru && s.aktivitasSiswa ? (
                          <div className="space-y-1.5 text-[12pt] leading-[1.5]">
                            <div>
                              <strong className="text-slate-900 font-bold">Aktivitas Guru:</strong>{' '}
                              <span className="text-slate-800 text-justify">{cleanActivityText(s.aktivitasGuru)}</span>
                            </div>
                            <div>
                              <strong className="text-slate-900 font-bold">Aktivitas Murid:</strong>{' '}
                              <span className="text-slate-800 text-justify">{cleanActivityText(s.aktivitasSiswa)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-800 text-[12pt] leading-[1.5] text-justify break-words whitespace-pre-line">{s.aktivitas}</p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1 text-[11pt]">
                          {s.pengalamanBelajar && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-300 bg-sky-50 text-sky-900 font-semibold text-xs shadow-2xs break-words">
                              <span>🌟</span>
                              <span>Pengalaman: {s.pengalamanBelajar}</span>
                            </span>
                          )}
                          {s.prinsipPembelajaran && (() => {
                            const badge = getPrinsipBadgeInfo(s.prinsipPembelajaran);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold text-xs shadow-2xs break-words ${badge.bgClass}`}>
                                <span>{badge.emoji}</span>
                                <span>Prinsip: {s.prinsipPembelajaran}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-900 align-middle">
                    {timeAllocSingle.formatInti}
                  </td>
                </tr>

                {/* Kegiatan Akhir */}
                <tr className="align-top">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300 break-words">
                    Kegiatan Akhir
                  </td>
                  <td className="p-2.5 text-slate-800 border-r border-slate-300 space-y-2 leading-[1.5]">
                    {lpData.kegiatanAkhir.deskripsi ? (
                      <p className="text-justify break-words">{lpData.kegiatanAkhir.deskripsi}</p>
                    ) : null}
                    {lpData.kegiatanAkhir.poinAktivitas && lpData.kegiatanAkhir.poinAktivitas.length > 0 && (
                      <ol className="list-decimal list-outside ml-5 space-y-1.5 text-slate-800">
                        {lpData.kegiatanAkhir.poinAktivitas.map((p, idx) => (
                          <li key={idx} className="text-justify break-words pl-1">{cleanActivityText(p)}</li>
                        ))}
                      </ol>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-900 align-middle">
                    {timeAllocSingle.formatAkhir}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          );
        })()}
      </section>

      {/* E. ASESMEN PEMBELAJARAN */}
      <section id="rpm-asesmen" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'asesmen' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-800 no-print" />
            <span>E. Asesmen Pembelajaran</span>
          </h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-[12pt] leading-[1.5]">
          <div className="p-4 bg-white rounded border border-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-900">1. Diagnostik (Awal):</h4>
            <p className="text-slate-900 font-bold break-words">{asData.diagnostik.bentukTeknik}</p>
            <p className="text-slate-800 text-[11pt] sm:text-[12pt] text-justify break-words">{asData.diagnostik.caraSumber}</p>
          </div>

          <div className="p-4 bg-white rounded border border-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-900">2. Formatif (Proses):</h4>
            <p className="text-slate-900 font-bold break-words">{asData.formatif.bentukTeknik}</p>
            <p className="text-slate-800 text-[11pt] sm:text-[12pt] text-justify break-words">{asData.formatif.caraSumber}</p>
          </div>

          <div className="p-4 bg-white rounded border border-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-900">3. Sumatif (Akhir):</h4>
            <p className="text-slate-900 font-bold break-words">{asData.sumatif.bentukTeknik}</p>
            <p className="text-slate-800 text-[11pt] sm:text-[12pt] text-justify break-words">{asData.sumatif.caraSumber}</p>
          </div>
        </div>

        {/* Lembar Pengesahan / Signature Block - Standar Resmi Kedinasan (Ditempatkan Tepat Setelah Asesmen & Sebelum Lampiran) */}
        <div className="pt-8 border-t-2 border-slate-400 page-avoid-break text-[12pt] leading-[1.5]">
          {onUpdateIdentitas && (
            <div className="no-print mb-4 flex items-center justify-end gap-2 text-xs font-sans">
              <span className="text-slate-600 font-medium">Jabatan Penandatangan:</span>
              <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-md">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateIdentitas({ ...modul.identitas, peranGuru: 'Guru Kelas' })
                  }
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    (modul.identitas.peranGuru || 'Guru Kelas') === 'Guru Kelas'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Klik untuk memilih Guru Kelas"
                >
                  Guru Kelas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateIdentitas({ ...modul.identitas, peranGuru: 'Guru Mata Pelajaran' })
                  }
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    (modul.identitas.peranGuru || 'Guru Kelas') === 'Guru Mata Pelajaran'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Klik untuk memilih Guru Mata Pelajaran"
                >
                  Guru Mata Pelajaran
                </button>
              </div>
            </div>
          )}

          <table className="w-full border-collapse border-none text-[12pt] leading-[1.5] text-slate-900">
            <tbody>
              {/* Baris 1: Mengetahui & Tempat/Tanggal */}
              <tr>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p>Mengetahui,</p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p>
                      {modul.identitas.tempatPenetapan || 'Fatubai'},{' '}
                      {modul.identitas.tanggalPenetapan || new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </td>
              </tr>

              {/* Baris 2: Jabatan Kepala Sekolah & Jabatan Guru Kelas */}
              <tr>
                <td className="w-1/2 border-none p-0 align-top pt-1">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="font-bold">Kepala Sekolah</p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top pt-1">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="font-bold">{modul.identitas.peranGuru || 'Guru Kelas'}</p>
                  </div>
                </td>
              </tr>

              {/* Baris 3: Ruang Tanda Tangan & Nama Lengkap (Sejajar Sempurna) */}
              <tr>
                <td className="w-1/2 border-none p-0 align-bottom h-24 pb-1">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="font-bold underline break-words inline-block">
                      {modul.identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.'}
                    </p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-bottom h-24 pb-1">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="font-bold underline break-words inline-block">
                      {modul.identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}
                    </p>
                  </div>
                </td>
              </tr>

              {/* Baris 4: NIP Kepala Sekolah & NIP Guru (Sejajar Sempurna) */}
              <tr>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="text-slate-700">
                      NIP. {modul.identitas.nipKepalaSekolah || '196709192008011008'}
                    </p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[200px] sm:min-w-[250px]">
                    <p className="text-slate-700">
                      NIP. {modul.identitas.nipGuru || '198603012020121005'}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* LAMPIRAN I: RUBRIK PENILAIAN */}
      <section id="rpm-rubrik" className={`space-y-4 print:break-before-page ${activeTab === 'semua' || activeTab === 'asesmen' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
            Lampiran I: Rubrik Penilaian Lengkap
          </h3>
        </div>

        <div className="border border-slate-400 rounded overflow-hidden">
          <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th className="p-2 w-[5%] text-center border-r border-slate-400">No</th>
                <th className="p-2 w-[20%] border-r border-slate-400 text-center">Aspek Penilaian</th>
                <th className="p-2 w-[21%] border-r border-slate-400 text-center">Kriteria</th>
                <th className="p-2 w-[13.5%] border-r border-slate-400 text-center">Skor 4 (Sangat Baik)</th>
                <th className="p-2 w-[13.5%] border-r border-slate-400 text-center">Skor 3 (Baik)</th>
                <th className="p-2 w-[13.5%] border-r border-slate-400 text-center">Skor 2 (Cukup)</th>
                <th className="p-2 w-[13.5%] text-center">Skor 1 (Kurang)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {(rbData || []).map((r) => (
                <tr key={r.nomor} className="align-top">
                  <td className="p-2 text-center font-bold border-r border-slate-300">{r.nomor}</td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-300 break-words">{r.aspekPenilaian}</td>
                  <td className="p-2 text-slate-800 border-r border-slate-300 text-justify break-words leading-[1.4]">{r.kriteria}</td>
                  <td className="p-2 text-slate-800 border-r border-slate-300 text-justify break-words leading-[1.4]">{r.skor4}</td>
                  <td className="p-2 text-slate-800 border-r border-slate-300 text-justify break-words leading-[1.4]">{r.skor3}</td>
                  <td className="p-2 text-slate-800 border-r border-slate-300 text-justify break-words leading-[1.4]">{r.skor2}</td>
                  <td className="p-2 text-slate-800 text-justify break-words leading-[1.4]">{r.skor1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* LAMPIRAN II: LKPD */}
      <section id="rpm-lkpd" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'lkpd' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
            Lampiran II: Lembar Kerja Murid (LKPD)
          </h3>
        </div>

        <div className="p-4 rounded border border-slate-400 bg-white space-y-3.5 text-[12pt] leading-[1.5]">
          <div className="text-center pb-2.5 border-b border-slate-300 space-y-1">
            <h4 className="text-[13pt] font-bold text-slate-900 uppercase break-words">{lkData.judulLKPD}</h4>
            <p className="text-[11pt] text-slate-700">
              Kelompok: ........................ | Kelas: {modul.identitas.kelas} | Anggota: 1. ................ 2. ................ 3. ................ 4. ................
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-900">Petunjuk Belajar:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-800 pl-2">
              {(lkData.petunjuk || []).map((p, idx) => (
                <li key={idx} className="text-justify break-words">{p}</li>
              ))}
            </ol>
          </div>

          {/* Bagian A: Langkah Kerja */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">A. Langkah Kerja &amp; Pengamatan:</span>
            <div className="border border-slate-400 rounded overflow-hidden">
              <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th className="p-2.5 w-[8%] text-center border-r border-slate-400">No</th>
                    <th className="p-2.5 w-[52%] border-r border-slate-400 text-center">Instruksi Langkah Kerja</th>
                    <th className="p-2.5 w-[40%] text-center">Hasil Pengamatan / Jawaban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(lkData.langkahKerjaAwal || []).map((lk) => (
                    <tr key={lk.nomor} className="align-top">
                      <td className="p-2.5 text-center font-bold border-r border-slate-300">{lk.nomor}</td>
                      <td className="p-2.5 text-slate-900 border-r border-slate-300 text-justify break-words leading-[1.5]">{lk.langkahKerja}</td>
                      <td className="p-2.5 text-slate-600 italic break-words leading-[1.5]">{lk.hasilJawabanPlaceholder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bagian B: Aktivitas Kelompok */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">B. {lkData.kegiatanKelompokJudul}:</span>
            <p className="text-[11pt] text-slate-700 italic pl-2 text-justify break-words">{lkData.kegiatanKelompokInstruksi}</p>
            <div className="space-y-2 pl-2">
              {(lkData.pertanyaanAnalisis || []).map((pa, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-300 space-y-1">
                  <p className="font-bold text-slate-900 text-justify break-words">{idx + 1}. {pa.pertanyaan}</p>
                  <p className="text-slate-600 italic text-[11pt] pl-3 break-words">{pa.hasilPlaceholder}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian C: Refleksi */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">C. Refleksi Diri &amp; Kelompok:</span>
            <div className="space-y-2 pl-2">
              {(lkData.refleksiDiriKelompok || []).map((r, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-300 text-[12pt]">
                  <p className="font-bold text-slate-900 text-justify break-words">• {r.pertanyaan}</p>
                  <p className="text-slate-600 italic text-[11pt] pl-3 pt-1 break-words">{r.hasilPlaceholder}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LAMPIRAN III: SOAL EVALUASI */}
      <section id="rpm-soal" className={`space-y-4 ${activeTab === 'semua' || activeTab === 'lkpd' ? 'block' : 'hidden print:block'}`}>
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
            Lampiran III: Soal Evaluasi Pemahaman Konseptual
          </h3>
        </div>

        <div className="space-y-3 text-[12pt] leading-[1.5]">
          {(soData || []).map((s) => (
            <div key={s.nomor} className="p-3.5 bg-white rounded border border-slate-300 space-y-1.5">
              <p className="font-bold text-slate-900 text-justify break-words">{s.nomor}. {s.pertanyaan}</p>
              <p className="text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-300 text-justify break-words leading-[1.5]">
                <strong className="text-slate-900">Kunci Jawaban / Pembahasan:</strong> {s.kunciJawaban}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
