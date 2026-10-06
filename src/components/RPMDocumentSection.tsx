import React, { useState } from 'react';
import { ModulAjarDocument, SchoolIdentity } from '../types';
import { BookOpen, Users, Award, Layers, Sparkles, Laptop, CheckCircle2, Lock, Edit2, Plus, X, Check, FileText, Palette, Copy } from 'lucide-react';
import { normalizeRPMData, cleanParentheses, getPrinsipBadgeInfo, getPengalamanBadgeInfo, cleanMeetingAlokasi, cleanMeetingFokus, parseTotalJPAndCount, calculateMeetingTimeAllocation, cleanActivityText } from '../utils/rpmUtils';
import { getResolvedMeetings } from '../utils/exportUtils';
import { LKPDVisualPromptModal } from './LKPDVisualPromptModal';
import { generateLKPDVisualPrompt, generateFullModuleLKPDVisualPrompt } from '../utils/lkpdPromptGenerator';
import { getLKPDMeetingStyle } from '../utils/lkpdStyleUtils';

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
  onOpenEditIdentity?: () => void;
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
  onOpenEditIdentity,
  onUpdateIdentitas,
  onUpdatePemanfaatanTeknologi,
}) => {
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [newPerangkatInput, setNewPerangkatInput] = useState('');
  const [newMediaInput, setNewMediaInput] = useState('');

  // Modal State Generator Prompt Visual LKPD (Gemini AI / Gems / Canva)
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptModalTitle, setPromptModalTitle] = useState('');
  const [promptModalText, setPromptModalText] = useState('');
  const [promptModalPertemuan, setPromptModalPertemuan] = useState<number | undefined>();
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
          {onOpenEditIdentity && (
            <button
              type="button"
              onClick={onOpenEditIdentity}
              className="no-print px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Edit Identitas &amp; Guru</span>
            </button>
          )}
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

          {/* 6. Lingkungan Belajar (Dimulai dari Halaman Baru) */}
          <div
            className="p-4 bg-white rounded border border-slate-300 space-y-2 print:break-before-page break-before-page"
            style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
          >
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

                {/* 3. Kegiatan Akhir */}
                <tr className="align-top">
                  <td className="p-2.5 font-bold bg-slate-50 border-r border-slate-300 break-words">
                    Kegiatan Akhir (Penutup)
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

        {/* 1. RENCANA ASESMEN LENGKAP PER PERTEMUAN */}
        <div className="p-4 bg-white rounded border border-slate-300 text-[12pt] space-y-3.5 leading-[1.5]">
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-base">
              1. Rencana Asesmen Komprehensif Per Pertemuan
            </h4>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 no-print">
              Tersusun Sistematis Per Sesi
            </span>
          </div>

          <div className="space-y-3.5">
            {resolvedMeetings.map((pert, pIdx) => {
              const isFirst = pIdx === 0;
              const isLast = pIdx === resolvedMeetings.length - 1;
              const totalM = resolvedMeetings.length;
              const defaultPlan = pert.asesmenPertemuan || {
                jenisAsesmen: totalM === 1 ? 'Asesmen Diagnostik (Awal), Formatif (Proses) & Sumatif (Lingkup TP)' : isFirst ? 'Asesmen Diagnostik (Awal) & Formatif (Proses)' : isLast ? 'Asesmen Formatif (Presentasi) & Sumatif (Lingkup TP)' : 'Asesmen Formatif (Proses)',
                teknikDanBentuk: isFirst ? 'Tanya Jawab Pemantik Lisan & Observasi Kesiapan Awal + Lembar Observasi Diskusi' : isLast ? 'Rubrik Presentasi Karya Kelompok & Tes Evaluasi Mandiri Tertulis (HOTS)' : 'Penilaian Kinerja Kelompok pada LKPD & Observasi Diskusi',
                instrumen: `Lembar Kerja Peserta Didik (LKPD Aktivitas Pertemuan ${pIdx + 1}) & Lembar Observasi Sikap`,
                buktiBelajar: `Catatan pengisian LKPD Aktivitas Pertemuan ${pIdx + 1} dan keaktifan proses belajar`,
                tindakLanjut: 'Memberikan bimbingan langsung dan umpan balik deskriptif bagi siswa.',
              };

              return (
                <div key={pIdx} className="p-3 bg-slate-50/90 rounded border border-slate-300 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1">
                    <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[11pt]">
                      {pIdx + 1}. ASESMEN PERTEMUAN {pIdx + 1} ({pert.alokasiWaktu || `${(pert as any).alokasiJP || 2} JP`}):
                    </h5>
                    <span className="text-[10pt] font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {defaultPlan.jenisAsesmen}
                    </span>
                  </div>

                  {totalM === 1 ? (
                    <div className="space-y-2 pl-2 text-slate-800 text-[11pt]">
                      <div>
                        <p className="font-bold text-slate-900">a. Asesmen Diagnostik (Awal Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Tanya Jawab Lisan Pemantik &amp; Observasi Kesiapan Awal</li>
                          <li><strong>Instrumen Asesmen:</strong> Pertanyaan Pemantik Konseptual &amp; Catatan Awal Guru</li>
                          <li><strong>Bukti Belajar:</strong> Respon lisan aktif dan pemahaman prasyarat murid</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">b. Asesmen Formatif (Proses Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Observasi Kinerja Kelompok pada LKPD &amp; Umpan Balik Langsung</li>
                          <li><strong>Instrumen Asesmen:</strong> Lembar Kerja Peserta Didik (LKPD Terpadu) &amp; Rubrik KKTP</li>
                          <li><strong>Bukti Belajar:</strong> Hasil pengerjaan lembar kerja dan keaktifan diskusi kelompok</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">c. Asesmen Sumatif (Lingkup Tujuan Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Tes Mandiri Tertulis (HOTS) &amp; Refleksi Akhir TP</li>
                          <li><strong>Instrumen Asesmen:</strong> Lembar Soal Penalaran Konseptual (Pilihan Ganda &amp; Uraian)</li>
                          <li><strong>Bukti Belajar:</strong> Skor lembar evaluasi mandiri siswa</li>
                          <li><strong>Tindak Lanjut:</strong> Pemetaan ketuntasan KKTP untuk pengayaan/remedial</li>
                        </ul>
                      </div>
                    </div>
                  ) : isFirst ? (
                    <div className="space-y-2 pl-2 text-slate-800 text-[11pt]">
                      <div>
                        <p className="font-bold text-slate-900">a. Asesmen Diagnostik (Awal Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Tanya Jawab Pemantik Apersepsi Lisan &amp; Pengamatan Minat Belajar</li>
                          <li><strong>Instrumen Asesmen:</strong> 3 Butir Pertanyaan Apersepsi Kontekstual &amp; Catatan Kesiapan Murid</li>
                          <li><strong>Bukti Belajar:</strong> Respon lisan langsung murid dalam menanggapi stimulus materi</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">b. Asesmen Formatif (Proses Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Observasi Keterlibatan Diskusi &amp; Penilaian Kinerja Eksplorasi Awal</li>
                          <li><strong>Instrumen Asesmen:</strong> LKPD Aktivitas Pertemuan 1 (Orientasi Masalah &amp; Eksplorasi Konsep) &amp; Lembar Observasi Sikap</li>
                          <li><strong>Bukti Belajar:</strong> Hasil pengisian lembar kerja kelompok Pertemuan 1 dan catatan pengamatan guru</li>
                          <li><strong>Tindak Lanjut:</strong> Memetakan kelompok butuh perancah bimbingan langsung vs kelompok mandiri</li>
                        </ul>
                      </div>
                    </div>
                  ) : isLast ? (
                    <div className="space-y-2 pl-2 text-slate-800 text-[11pt]">
                      <div>
                        <p className="font-bold text-slate-900">a. Asesmen Formatif (Presentasi &amp; Refleksi):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Unjuk Kerja Presentasi Kelompok &amp; Lembar Refleksi Pembelajaran Bermakna</li>
                          <li><strong>Instrumen Asesmen:</strong> Rubrik Penilaian Presentasi Karya &amp; Lembar Refleksi Diri Siswa</li>
                          <li><strong>Bukti Belajar:</strong> Performa presentasi santun, karya laporan kelompok, dan lembar refleksi bermakna</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">b. Asesmen Sumatif (Lingkup Tujuan Pembelajaran):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Tes Tertulis Evaluasi Mandiri (Penalaran Tingkat Tinggi / HOTS)</li>
                          <li><strong>Instrumen Asesmen:</strong> Paket Tes Evaluasi Akhir TP (Pilihan Ganda &amp; Uraian Pemecahan Masalah)</li>
                          <li><strong>Bukti Belajar:</strong> Lembar jawaban tes evaluasi mandiri murid</li>
                          <li><strong>Tindak Lanjut:</strong> Menetapkan ketercapaian KKTP rapor, pengayaan bagi yang tuntas, dan remedial bagi yang belum tuntas</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pl-2 text-slate-800 text-[11pt]">
                      <div>
                        <p className="font-bold text-slate-900">a. Asesmen Formatif (Proses Pembelajaran Berkelanjutan):</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-3 text-slate-700">
                          <li><strong>Teknik &amp; Bentuk:</strong> Penilaian Kinerja Kolaboratif &amp; Observasi Penyelidikan Mandiri</li>
                          <li><strong>Instrumen Asesmen:</strong> LKPD Aktivitas Pertemuan {pIdx + 1} (Penyelidikan / Pengolahan Solusi) &amp; Lembar Ceklis Diskusi</li>
                          <li><strong>Bukti Belajar:</strong> Catatan data temuan penyelidikan pada LKPD Pertemuan {pIdx + 1} dan keaktifan interaksi kelompok</li>
                          <li><strong>Tindak Lanjut:</strong> Umpan balik deskriptif (descriptive feedback) seketika dari guru saat pendampingan</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lembar Pengesahan / Signature Block - Standar Resmi Kedinasan (Ditempatkan Tepat Setelah Asesmen & Sebelum Lampiran) */}
        <div className="pt-8 border-t-2 border-slate-400 page-avoid-break text-[12pt] leading-[1.5]">
          <div className="no-print mb-4 flex items-center justify-between flex-wrap gap-2 text-xs font-sans">
            {onOpenEditIdentity && (
              <button
                type="button"
                onClick={onOpenEditIdentity}
                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Identitas &amp; Titimangsa</span>
              </button>
            )}

            {onUpdateIdentitas && (
              <div className="flex items-center gap-2 ml-auto">
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
          </div>

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
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded border-l-4 border-slate-800 flex-wrap gap-2">
          <h3 className="text-[12pt] font-bold uppercase tracking-wider text-slate-900">
            Lampiran II: Lembar Kerja Murid (LKPD Berkelompok)
          </h3>
          <button
            type="button"
            onClick={() => {
              const fullPrompt = generateFullModuleLKPDVisualPrompt(
                lkData.aktivitasPerPertemuan?.length || 1,
                topikMateri,
                modul.identitas.mataPelajaran,
                modul.identitas.kelas,
                modul.identitas.fase,
                modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                (lkData.aktivitasPerPertemuan || []).map((sub: any, idx: number) => ({
                  judulAktivitas: sub.judulAktivitas || `Aktivitas Pertemuan ${idx + 1}`,
                  pertemuanKe: sub.pertemuanKe || idx + 1,
                  topikMateri,
                  mataPelajaran: modul.identitas.mataPelajaran,
                  kelas: modul.identitas.kelas,
                  fase: modul.identitas.fase,
                  modelPembelajaran: modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                  fokusTarget: sub.fokusTarget || `Mempelajari konsep ${topikMateri}`,
                  petunjukAktivitas: sub.petunjukAktivitas,
                  langkahKerja: sub.langkahKerja,
                  pertanyaanPemantik: sub.pertanyaanPemantik,
                  refleksiSesi: sub.refleksiSesi,
                  namaSekolah: modul.identitas.namaSatuanPendidikan,
                }))
              );
              setPromptModalTitle(`Paket Prompt Desain Visual LKPD (${(lkData.aktivitasPerPertemuan || []).length} Pertemuan)`);
              setPromptModalText(fullPrompt);
              setPromptModalPertemuan(undefined);
              setPromptModalOpen(true);
            }}
            className="no-print px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Salin Prompt Desain Grafis LKPD untuk Google Gemini / Gems / Canva"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>✨ Prompt Desain Visual LKPD (Gemini AI / Gems)</span>
          </button>
        </div>

        <div className="p-5 rounded-xl border-2 border-slate-800 bg-white space-y-4 font-serif text-[12pt] leading-[1.6] text-slate-900 shadow-2xs">
          <div className="text-center pb-3 border-b-2 border-slate-800 space-y-2">
            <h4 className="text-[14pt] font-bold text-slate-900 uppercase tracking-wide font-serif leading-tight">{lkData.judulLKPD}</h4>
            
            {/* Box Identitas Kelompok Resmi (Maksimal 6 Siswa) */}
            <div className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-400 text-[12pt] space-y-2 font-serif text-left">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-[11pt] font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-800" />
                  <span>IDENTITAS KELOMPOK BELAJAR (MAKSIMAL 6 SISWA)</span>
                </span>
                <span className="text-[10pt] font-normal text-slate-700 italic">
                  Format Resmi Kertas A4
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pb-2 border-b border-slate-300 text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold min-w-[130px]">Nama Kelompok:</span>
                  <span className="text-slate-600 tracking-wider">.....................................................</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold min-w-[130px]">Hari / Tanggal:</span>
                  <span className="text-slate-600 tracking-wider">.....................................................</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold min-w-[130px]">Mata Pelajaran:</span>
                  <span>{modul.identitas.mataPelajaran}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold min-w-[130px]">Kelas / Fase:</span>
                  <span>Kelas {modul.identitas.kelas} ({modul.identitas.fase})</span>
                </div>
              </div>

              <div className="pt-0.5">
                <span className="font-bold block mb-1 text-[11pt]">Anggota Kelompok (Maksimal 6 Siswa):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-slate-800 text-[11pt]">
                  <div>1. ........................................ <strong>(Ketua)</strong></div>
                  <div>4. ........................................</div>
                  <div>2. ........................................</div>
                  <div>5. ........................................</div>
                  <div>3. ........................................</div>
                  <div>6. ........................................</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-900">Petunjuk Belajar Berkelompok:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-800 pl-2">
              {(lkData.petunjuk || []).map((p, idx) => (
                <li key={idx} className="text-justify break-words">{p}</li>
              ))}
            </ol>
          </div>

          {/* Bagian A: Langkah Kerja */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">A. Langkah Kerja &amp; Pengamatan Kelompok:</span>
            <div className="border border-slate-500 rounded overflow-hidden">
              <table className="w-full text-left text-[12pt] border-collapse table-fixed font-serif">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-500">
                    <th className="p-2.5 w-[8%] text-center border-r border-slate-500">No</th>
                    <th className="p-2.5 w-[47%] border-r border-slate-500 text-center">Instruksi Langkah Kerja</th>
                    <th className="p-2.5 w-[45%] text-center">Hasil Pengamatan / Jawaban Kelompok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {(lkData.langkahKerjaAwal || []).map((lk) => (
                    <tr key={lk.nomor} className="align-top">
                      <td className="p-2.5 text-center font-bold border-r border-slate-400">{lk.nomor}</td>
                      <td className="p-2.5 text-slate-900 border-r border-slate-400 text-justify break-words leading-[1.6]">{lk.langkahKerja}</td>
                      <td className="p-3 text-slate-600 italic break-words leading-[1.8] min-h-[80px]">
                        <div>{lk.hasilJawabanPlaceholder || 'Tuliskan hasil pengamatan lengkap kelompok di sini...'}</div>
                        <div className="pt-2 text-slate-400 border-t border-dotted border-slate-300 mt-2">
                          ...................................................................................................................
                          <br />
                          ...................................................................................................................
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bagian B: Aktivitas Kelompok */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">B. {lkData.kegiatanKelompokJudul}:</span>
            <p className="text-[12pt] text-slate-800 italic pl-2 text-justify break-words">{lkData.kegiatanKelompokInstruksi}</p>
             <div className="space-y-3 pl-2">
              {(lkData.pertanyaanAnalisis || []).map((pa, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/50 rounded border border-slate-400 space-y-2">
                  <p className="font-bold text-slate-900 text-justify break-words">{idx + 1}. {pa.pertanyaan}</p>
                  <div className="p-3.5 bg-white rounded-lg border border-slate-400 text-slate-600 italic text-[11pt] space-y-2 min-h-[110px] shadow-3xs">
                    <p>Jawaban Kelompok: {pa.hasilPlaceholder}</p>
                    <div className="text-slate-400 font-sans text-[10pt] leading-loose pt-1">
                      ...................................................................................................................................................
                      <br />
                      ...................................................................................................................................................
                      <br />
                      ...................................................................................................................................................
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian C: Refleksi */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900">C. Refleksi Diri &amp; Kelompok:</span>
            <div className="space-y-2.5 pl-2">
              {(lkData.refleksiDiriKelompok || []).map((r, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/50 rounded border border-slate-400 text-[12pt] space-y-1.5">
                  <p className="font-bold text-slate-900 text-justify break-words">• {r.pertanyaan}</p>
                  <div className="p-2 bg-white rounded border border-slate-300 text-slate-600 italic text-[11pt]">
                    Tanggapan Kelompok: {r.hasilPlaceholder}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian D: Rincian Aktivitas LKPD Per Pertemuan */}
          {lkData.aktivitasPerPertemuan && lkData.aktivitasPerPertemuan.length > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 text-[13pt] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-900" />
                  <span>D. Rangkaian Lembar Kerja Peserta Didik (LKPD) Per Pertemuan ({lkData.aktivitasPerPertemuan.length} Pertemuan):</span>
                </span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-400">
                  Format Kertas A4 Siap Cetak
                </span>
              </div>

              <div className="space-y-6">
                {lkData.aktivitasPerPertemuan.map((sub: any, sIdx: number) => {
                  const pertNo = sub.pertemuanKe || sIdx + 1;
                  const theme = getLKPDMeetingStyle(pertNo, modul.identitas.mataPelajaran);
                  return (
                  <div key={sIdx} className={`${theme.cardContainerClass} page-break-inside-avoid`}>
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded flex items-center gap-1">
                          <span>{theme.icon}</span>
                          <span>Pertemuan {pertNo}</span>
                        </span>
                        <h5 className="font-bold text-slate-900 text-[14pt] font-serif">
                          {sub.judulAktivitas}
                        </h5>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const pText = generateLKPDVisualPrompt({
                            judulAktivitas: sub.judulAktivitas,
                            pertemuanKe: pertNo,
                            topikMateri,
                            mataPelajaran: modul.identitas.mataPelajaran,
                            kelas: modul.identitas.kelas,
                            fase: modul.identitas.fase,
                            modelPembelajaran: modul.modelPembelajaran || 'Problem Based Learning (PBL)',
                            fokusTarget: sub.fokusTarget,
                            petunjukAktivitas: sub.petunjukAktivitas,
                            langkahKerja: sub.langkahKerja,
                            pertanyaanPemantik: sub.pertanyaanPemantik,
                            refleksiSesi: sub.refleksiSesi,
                            namaSekolah: modul.identitas.namaSatuanPendidikan,
                          });
                          setPromptModalTitle(`Prompt Visual LKPD Pertemuan ${pertNo}`);
                          setPromptModalText(pText);
                          setPromptModalPertemuan(pertNo);
                          setPromptModalOpen(true);
                        }}
                        className="no-print px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs font-sans"
                        title="Salin Prompt AI untuk Lembar Kerja Pertemuan Ini"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Prompt Visual Pertemuan {pertNo}</span>
                      </button>
                    </div>

                    {/* Box Identitas Kelompok Pertemuan (Maksimal 6 Siswa) */}
                    <div className="p-3 bg-slate-50/50 rounded border border-slate-400 text-[11pt] space-y-1.5 font-serif text-slate-900">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-300 font-bold">
                        <span>IDENTITAS KELOMPOK PERTEMUAN {pertNo} (MAKSIMAL 6 SISWA)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pb-1 border-b border-slate-300">
                        <div><strong>Nama Kelompok:</strong> ........................................</div>
                        <div><strong>Hari / Tanggal:</strong> ........................................</div>
                        <div><strong>Mata Pelajaran:</strong> {modul.identitas.mataPelajaran}</div>
                        <div><strong>Kelas / Pertemuan:</strong> Kelas {modul.identitas.kelas} (Pertemuan Ke-{pertNo})</div>
                      </div>
                      <div className="pt-0.5">
                        <strong className="block mb-1 text-[10.5pt]">Anggota Kelompok (Maksimal 6 Siswa):</strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-[10.5pt]">
                          <div>1. ................................ <strong>(Ketua)</strong></div>
                          <div>4. ................................</div>
                          <div>2. ................................</div>
                          <div>5. ................................</div>
                          <div>3. ................................</div>
                          <div>6. ................................</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[12pt] text-slate-900 space-y-2">
                      <p>
                        <strong>Fokus Target Pembelajaran:</strong> {sub.fokusTarget}
                      </p>
                      <div>
                        <strong className="block mb-1">Petunjuk Aktivitas Kelompok (Ramah Anak):</strong>
                        <ol className="list-decimal list-outside ml-5 space-y-1 text-slate-800">
                          {(sub.petunjukAktivitas || []).map((pt: string, pIdx: number) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {sub.langkahKerja && sub.langkahKerja.length > 0 && (
                      <div className="overflow-x-auto rounded border border-slate-400">
                        <table className="w-full text-left text-[12pt] bg-white font-serif border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                              <th className="p-2.5 w-10 text-center border-r border-slate-400">No</th>
                              <th className="p-2.5 border-r border-slate-400">Langkah Penyelidikan Kelompok</th>
                              <th className="p-2.5 w-1/2 text-center">Hasil Pengamatan / Jawaban Kelompok</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300">
                            {sub.langkahKerja.map((step: any, stIdx: number) => (
                              <tr key={stIdx} className="align-top">
                                <td className="p-2.5 text-center font-bold border-r border-slate-300">{step.nomor || (stIdx + 1)}</td>
                                <td className="p-2.5 text-slate-900 border-r border-slate-300 text-justify">{step.langkahKerja}</td>
                                <td className="p-3 text-slate-600 italic min-h-[70px]">
                                  <div>{step.hasilJawabanPlaceholder || '................................'}</div>
                                  <div className="pt-2 text-slate-400 border-t border-dotted border-slate-200 mt-2">
                                    ........................................................................................
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {sub.pertanyaanPemantik && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-400 text-[12pt] text-slate-900 space-y-2 min-h-[110px] shadow-3xs">
                        <strong>Pertanyaan Diskusi Kelompok:</strong>
                        <p className="italic pl-1 text-slate-800 font-serif">{sub.pertanyaanPemantik}</p>
                        <div className="text-slate-400 font-sans text-[10pt] leading-loose pt-1">
                          ...................................................................................................................................................
                          <br />
                          ...................................................................................................................................................
                          <br />
                          ...................................................................................................................................................
                        </div>
                      </div>
                    )}
                    {sub.refleksiSesi && (
                      <div className="p-3 bg-slate-50/80 rounded border border-slate-300 text-[12pt] text-slate-900 space-y-1">
                        <strong>Refleksi Pembelajaran Kelompok:</strong>
                        <p className="italic pl-1 text-slate-800">{sub.refleksiSesi}</p>
                      </div>
                    )}
                  </div>
                );})}
              </div>
            </div>
          )}
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

      {/* Modal Generator Prompt Visual LKPD AI */}
      <LKPDVisualPromptModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        title={promptModalTitle}
        pertemuanKe={promptModalPertemuan}
        promptText={promptModalText}
        topikMateri={topikMateri}
        mataPelajaran={modul.identitas.mataPelajaran}
      />
    </div>
  );
};
