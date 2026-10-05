import React, { useState } from 'react';
import { ModulAjarDocument, SchoolIdentity } from '../types';
import { 
  Sparkles, 
  BookOpen, 
  Users, 
  Award, 
  Layers, 
  Laptop, 
  CheckCircle2, 
  Clock, 
  Target, 
  Compass, 
  Printer, 
  Download, 
  FileText, 
  Share2, 
  Check, 
  HelpCircle,
  Brain,
  Lightbulb,
  Smile,
  Search,
  Send,
  Eye,
  Building2,
  Calendar,
  GraduationCap,
  Edit2,
  Plus,
  X
} from 'lucide-react';
import { normalizeRPMData, cleanParentheses, getPrinsipBadgeInfo, cleanActivityText, cleanMeetingFokus } from '../utils/rpmUtils';
import { getResolvedMeetings } from '../utils/exportUtils';

interface RPMCanvasViewProps {
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
  onSwitchToDocument?: () => void;
  onPrint?: () => void;
  onDownloadWord?: () => void;
  onDownloadPDF?: () => void;
  onOpenEditIdentity?: () => void;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onUpdatePemanfaatanTeknologi?: (updated: {
    platformAplikasi: string[];
    perangkatDigital: string[];
    mediaDigital: string[];
  }) => void;
}

export const RPMCanvasView: React.FC<RPMCanvasViewProps> = ({
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
  onSwitchToDocument,
  onPrint,
  onDownloadWord,
  onDownloadPDF,
  onOpenEditIdentity,
  onUpdateIdentitas,
  onUpdatePemanfaatanTeknologi,
}) => {
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [newPerangkatInput, setNewPerangkatInput] = useState('');
  const [newMediaInput, setNewMediaInput] = useState('');
  const { idData, dsData, lpData, asData } = normalizeRPMData(modul, {
    alokasiWaktu,
    topikMateri,
  });

  const resolvedMeetings = getResolvedMeetings(modul, alokasiWaktu);
  const [activeMeetingIdx, setActiveMeetingIdx] = useState(0);

  return (
    <div id="rpm-canvas-board-root" className="space-y-6 pb-8 print:p-0 print:m-0">
      {/* Canvas Top Control & Mode Indicator Bar */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-lg border-2 border-indigo-400/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Tampilan Kanvas RPP Mendalam</span>
            </span>
            <span className="text-xs text-indigo-200 font-semibold">
              Desain Visual Sesuai Template Canva &amp; Kerangka Deep Learning
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>🎨 Kanvas Rancangan Pembelajaran Mendalam (RPM Canvas)</span>
          </h2>
          <p className="text-xs text-slate-300">
            Prinsip Pembelajaran (3 Pilar) &amp; Pengalaman Belajar (3 Siklus) divisualisasikan dalam format kanvas matriks interaktif.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onSwitchToDocument && (
            <button
              type="button"
              onClick={onSwitchToDocument}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Beralih ke tampilan format naskah cetak standar Times New Roman"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Format Dokumen Resmi</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs border border-indigo-400"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kanvas</span>
            </button>
          )}

          {onDownloadWord && (
            <button
              type="button"
              onClick={onDownloadWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs border border-blue-400"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>
          )}
        </div>
      </div>

      {/* THE MAIN CANVAS BOARD (CANVA POSTER BOARD LAYOUT) */}
      <div 
        id="rpm-canvas-poster"
        className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-7 md:p-8 space-y-6 shadow-md print:shadow-none print:border-none print:p-0 print:bg-white"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* 1. KANVAS HEADER BANNER */}
        <div className="bg-gradient-to-br from-[#0B1528] via-[#162444] to-[#1E3A8A] text-white rounded-xl p-5 sm:p-6 shadow-md border-2 border-amber-400/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-xs">
                  DEEP LEARNING CANVAS
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-amber-200 border border-amber-300/30 text-[11px] font-bold">
                  {modul.identitas.namaSatuanPendidikan || 'Satuan Pendidikan SD'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                {judulModul}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-xs text-indigo-200 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>{modul.identitas.mataPelajaran.toUpperCase()}</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                  <span>SD / {modul.identitas.fase} - Kelas {modul.identitas.kelas}</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Semester {semester} • TP {tahunPelajaran}</span>
                </span>
              </div>
            </div>

            {/* Quick Meta Badges */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shrink-0 space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-200 font-semibold">Penyusun:</span>
                <span className="text-white font-bold">{modul.identitas.namaGuru}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-200 font-semibold">Alokasi Waktu:</span>
                <span className="text-amber-300 font-bold">{alokasiWaktu}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-200 font-semibold">Model Inti:</span>
                <span className="text-emerald-300 font-bold">{dsData.praktikPedagogis.modelPembelajaran}</span>
              </div>
              {onOpenEditIdentity && (
                <button
                  type="button"
                  onClick={onOpenEditIdentity}
                  className="w-full mt-1.5 px-2 py-1 rounded bg-amber-400/90 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profil &amp; Sekolah</span>
                </button>
              )}
            </div>
          </div>

          {/* Topik Materi Strip */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider">Topik Materi:</span>
              <span className="font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded border border-white/10">
                {topikMateri || modul.identitas.mataPelajaran}
              </span>
            </div>
            {modul.elemen && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-200 font-medium">Elemen Capaian:</span>
                <span className="font-bold text-white">{modul.elemen}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. KANVAS BENTO GRID: IDENTIFIKASI & PROFIL LULUSAN */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card A: Identifikasi Murid & Materi (Col 7) */}
          <div className="md:col-span-7 bg-white rounded-xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                  1. Identifikasi Murid &amp; Materi
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Kesiapan Belajar
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">(a) Kompetensi Awal Murid:</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-justify">
                  {idData.kompetensiAwal}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">(b) Karakteristik &amp; Gaya Belajar Murid:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(idData.karakteristikMurid || []).map((k, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300 text-[11px]">
                      {k}
                    </span>
                  ))}
                  {idData.karakteristikMuridCustom && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300 text-[11px]">
                      {idData.karakteristikMuridCustom}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-0.5">(c) Kebutuhan Murid:</span>
                  <p className="text-slate-700 leading-relaxed text-justify">
                    {idData.kebutuhanMurid}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-0.5">(d) Karakteristik Materi:</span>
                  <p className="text-slate-700 leading-relaxed text-justify">
                    {idData.karakteristikMateri}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: 8 Dimensi Profil Lulusan (Col 5) */}
          <div className="md:col-span-5 bg-white rounded-xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                    2. Dimensi Profil Lulusan
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Target Karakter
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Dimensi profil lulusan yang dikembangkan secara terintegrasi dalam pembelajaran ini:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {(idData.dimensiProfilLulusan || []).map((d, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/80 text-amber-950 font-bold border border-amber-300 text-xs shadow-2xs"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{d}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed mt-2">
              <strong>Fokus Pembiasaan:</strong> Pembentukan karakter unggul melalui olah pikir, olah rasa, olah hati, dan olah raga dalam aktivitas kolaboratif mendalam.
            </div>
          </div>
        </div>

        {/* 3. KANVAS DESAIN PEMBELAJARAN: CP, TP (NORMAL FONT), LINTAS DISIPLIN & PEDAGOGIS */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-wide">
                3. Desain Pembelajaran (Curriculum Design)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              Pilar Kurikulum Merdeka
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Capaian Pembelajaran */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Capaian Pembelajaran (CP)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Elemen: {modul.elemen || '-'}
                </span>
              </div>
              {dsData.capaianPembelajaranPerElemen && dsData.capaianPembelajaranPerElemen.length > 0 ? (
                <div className="space-y-2">
                  {dsData.capaianPembelajaranPerElemen.map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Elemen: {item.elemen}</span>
                      <p className="text-slate-700 text-justify leading-relaxed">{item.capaianPembelajaran}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700 text-justify leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {dsData.capaianPembelajaran}
                </p>
              )}
            </div>

            {/* Tujuan Pembelajaran (FONT NORMAL - NOT BOLD as strictly requested) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  2. Tujuan Pembelajaran (TP)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Target Capaian
                </span>
              </div>
              {/* PENULISAN ISI TUJUAN PEMBELAJARAN JANGAN DIBUAT BOLD: font-normal digunakan */}
              <p className="text-slate-900 text-justify leading-relaxed bg-white p-3 rounded-lg border border-slate-200 font-normal">
                {dsData.tujuanPembelajaran}
              </p>
            </div>
          </div>

          {/* Lintas Disiplin Ilmu Table */}
          <div className="space-y-1.5">
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block">
              3. Lintas Disiplin Ilmu Terkait
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="p-2 w-[30%] border-r border-slate-200">Mata Pelajaran Terkait</th>
                    <th className="p-2 w-[70%]">Keterkaitan Konsep &amp; Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(dsData.lintasDisiplinIlmu || []).map((ld, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{ld.mataPelajaran}</td>
                      <td className="p-2 text-slate-700 leading-relaxed">{ld.keterkaitan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Praktik Pedagogis */}
          <div className="space-y-1.5">
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block">
              4. Praktik Pedagogis
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Model Pembelajaran:</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{dsData.praktikPedagogis.modelPembelajaran}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pendekatan:</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{cleanParentheses(dsData.praktikPedagogis.pendekatanPembelajaran)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Metode Pembelajaran:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{dsData.praktikPedagogis.metodePembelajaran.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* KEMITRAAN PEMBELAJARAN (TERPISAH SEPERTI 1. MITRA INTERNAL, 2. MITRA EKSTERNAL) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                5. Kemitraan Pembelajaran (Mitra Pembelajaran)
              </span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Kolaborasi Ekosistem
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {dsData.mitraPembelajaran.mitraInternal.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Mitra Internal:</span>
                  </div>
                  <div className="pl-6 flex flex-wrap gap-1.5 pt-0.5">
                    {dsData.mitraPembelajaran.mitraInternal.map((mi, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-[11px]">
                        {mi}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dsData.mitraPembelajaran.mitraEksternal.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-black">
                      {dsData.mitraPembelajaran.mitraInternal.length > 0 ? '2' : '1'}
                    </span>
                    <span>Mitra Eksternal:</span>
                  </div>
                  <div className="pl-6 flex flex-wrap gap-1.5 pt-0.5">
                    {dsData.mitraPembelajaran.mitraEksternal.map((me, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold text-[11px]">
                        {me}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dsData.mitraPembelajaran.mitraInternal.length === 0 && dsData.mitraPembelajaran.mitraEksternal.length === 0 && (
                <p className="text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                  Pembelajaran mandiri di kelas (tanpa kemitraan khusus yang dipilih).
                </p>
              )}
            </div>
          </div>

          {/* Lingkungan Belajar & Pemanfaatan Digital */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block">
                6. Lingkungan Belajar
              </span>
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  <strong className="text-slate-900">1. Fisik:</strong> {dsData.lingkunganBelajar.lingkunganFisik.join(', ')}
                  {dsData.lingkunganBelajar.lingkunganFisikDeskripsi && ` (${dsData.lingkunganBelajar.lingkunganFisikDeskripsi})`}
                </p>
                <p className="text-slate-800">
                  <strong className="text-slate-900">2. Budaya:</strong> {dsData.lingkunganBelajar.budayaBelajar.join(', ')}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-slate-600" />
                  <span>7. Pemanfaatan Teknologi Digital &amp; Media</span>
                </span>
                {onUpdatePemanfaatanTeknologi && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTech(!isEditingTech)}
                    className="no-print px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-950 border border-teal-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isEditingTech ? (
                      <>
                        <Check className="w-3 h-3 text-teal-800" />
                        <span>Selesai</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3 text-teal-800" />
                        <span>Edit / Tambah Manual</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditingTech && onUpdatePemanfaatanTeknologi ? (
                <div className="no-print space-y-2.5 bg-white p-2.5 rounded-lg border border-teal-300 text-[11px]">
                  {/* 1. Platform */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">1. Platform / Aplikasi:</span>
                    {dsData.pemanfaatanTeknologi.platformAplikasi.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
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
                          className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
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
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 pt-0.5">
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
                        placeholder="Tambah platform manual..."
                        className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
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
                        className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Perangkat */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-900 block">2. Perangkat Digital:</span>
                    {dsData.pemanfaatanTeknologi.perangkatDigital.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
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
                          className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
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
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 pt-0.5">
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
                        placeholder="Tambah perangkat manual..."
                        className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
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
                        className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Media */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-900 block">3. Media Pembelajaran / Digital:</span>
                    {dsData.pemanfaatanTeknologi.mediaDigital.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
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
                          className="flex-1 px-2 py-1 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-medium"
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
                    <div className="flex items-center gap-1 pt-0.5">
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
                        placeholder="Tambah media manual..."
                        className="flex-1 px-2 py-1 border border-teal-300 rounded bg-white text-slate-900"
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
                        className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  <strong className="text-slate-900">1. Platform:</strong> {dsData.pemanfaatanTeknologi.platformAplikasi.filter(Boolean).join(', ') || '-'}
                </p>
                <p className="text-slate-800">
                  <strong className="text-slate-900">2. Perangkat:</strong> {dsData.pemanfaatanTeknologi.perangkatDigital.filter(Boolean).join(', ') || '-'}
                </p>
                <p className="text-slate-800">
                  <strong className="text-slate-900">3. Media:</strong> {dsData.pemanfaatanTeknologi.mediaDigital.filter(Boolean).join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. KANVAS ALUR LANGKAH PEMBELAJARAN (VISUAL SINTAKS TIMELINE) */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-wide">
                5. Alur Langkah Pembelajaran Mendalam (Sintaks Flow)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              Total Alokasi: {alokasiWaktu}
            </span>
          </div>

          {/* Meeting Switcher Tabs for Multi-Meeting Modules */}
          {resolvedMeetings.length > 1 && (
            <div className="p-2.5 bg-gradient-to-r from-slate-100 to-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilih Pertemuan Pembelajaran ({resolvedMeetings.length} Pertemuan Terjadwal):</span>
                </span>
                <span className="text-[11px] text-indigo-800 font-bold">
                  Aktif: Pertemuan {activeMeetingIdx + 1} dari {resolvedMeetings.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {resolvedMeetings.map((meet, mIdx) => (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => setActiveMeetingIdx(mIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeMeetingIdx === mIdx
                        ? 'bg-indigo-700 text-white shadow-xs font-black'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>Pertemuan {meet.pertemuanKe || (mIdx + 1)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${activeMeetingIdx === mIdx ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                      {meet.alokasiWaktu.split('(')[0].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const currentMeet = resolvedMeetings.length > 1
              ? (resolvedMeetings[activeMeetingIdx] || resolvedMeetings[0])
              : null;

            const meetAwalList = currentMeet
              ? currentMeet.pendahuluan
              : (lpData.kegiatanAwal.poinAktivitas && lpData.kegiatanAwal.poinAktivitas.length > 0 ? lpData.kegiatanAwal.poinAktivitas : [lpData.kegiatanAwal.deskripsi].filter(Boolean));

            const meetIntiList = currentMeet
              ? currentMeet.kegiatanInti
              : lpData.kegiatanInti.sintaks;

            const meetAkhirList = currentMeet
              ? currentMeet.penutup
              : (lpData.kegiatanAkhir.poinAktivitas && lpData.kegiatanAkhir.poinAktivitas.length > 0 ? lpData.kegiatanAkhir.poinAktivitas : [lpData.kegiatanAkhir.deskripsi].filter(Boolean));

            const cleanMeetTitle = currentMeet
              ? `PERTEMUAN ${currentMeet.pertemuanKe || (activeMeetingIdx + 1)} • ALOKASI: ${currentMeet.alokasiWaktu}`
              : `PERTEMUAN 1 • ALOKASI: ${alokasiWaktu}`;

            const cleanMeetFokus = cleanMeetingFokus(
              currentMeet?.fokusTP || topikMateri,
              '-',
              activeMeetingIdx,
              resolvedMeetings.length,
              topikMateri,
              dsData.tujuanPembelajaran
            );

            return (
              <div className="space-y-4">
                {/* Meeting Banner Info */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="font-bold text-slate-950 text-xs sm:text-sm tracking-wide">
                    {cleanMeetTitle}
                  </div>
                  <div className="text-xs text-slate-800">
                    <strong className="text-slate-950">FOKUS:</strong> {cleanMeetFokus}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Step 1: Kegiatan Awal */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs">A</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Kegiatan Awal (Apersepsi &amp; Motivasi Berbantuan Media)</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                        {currentMeet ? '10-15 Menit' : lpData.kegiatanAwal.alokasiMenit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed pl-2 sm:pl-8 space-y-1.5">
                      <ol className="list-decimal list-outside ml-4 space-y-1.5">
                        {meetAwalList.map((p: string, idx: number) => (
                          <li key={idx} className="text-justify leading-relaxed">{cleanActivityText(p)}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Step 2: Kegiatan Inti (Sintaks Flow) */}
                  <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-blue-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">B</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          Kegiatan Inti ({modul.modelPembelajaran || lpData.kegiatanInti.modelPembelajaran})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-900 bg-white px-2.5 py-0.5 rounded border border-blue-300">
                        {currentMeet ? '45-50 Menit' : lpData.kegiatanInti.alokasiMenit}
                      </span>
                    </div>

                    {/* Sintaks Steps Cards */}
                    <div className="space-y-2.5 pl-1 sm:pl-8">
                      {meetIntiList.map((s: any, idx: number) => {
                        const badge = s.prinsipPembelajaran ? getPrinsipBadgeInfo(s.prinsipPembelajaran) : null;
                        return (
                          <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[10px]">
                                  Tahap {s.tahapKe || (idx + 1)}
                                </span>
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {s.faseSintaks}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {s.alokasiMenit || '10 Menit'}
                              </span>
                            </div>

                            {/* Aktivitas Guru dan Murid Terinci */}
                            {s.aktivitasGuru && s.aktivitasSiswa ? (
                              <div className="space-y-2 text-xs">
                                <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200 space-y-0.5">
                                  <strong className="text-blue-950 font-bold block">👤 Aktivitas Guru:</strong>
                                  <p className="text-slate-800 text-justify leading-relaxed">{cleanActivityText(s.aktivitasGuru)}</p>
                                </div>
                                <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-0.5">
                                  <strong className="text-emerald-950 font-bold block">👥 Aktivitas Murid:</strong>
                                  <p className="text-slate-800 text-justify leading-relaxed">{cleanActivityText(s.aktivitasSiswa)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-700 text-justify leading-relaxed">
                                {cleanActivityText(s.aktivitas)}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {s.pengalamanBelajar && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-900 font-bold border border-sky-300 text-[10px]">
                                  <span>🌟</span>
                                  <span>Pengalaman: {s.pengalamanBelajar}</span>
                                </span>
                              )}
                              {s.prinsipPembelajaran && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border text-[10px] ${badge?.bgClass || 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                                  <span>{badge?.emoji || '💡'}</span>
                                  <span>Prinsip: {s.prinsipPembelajaran}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Kegiatan Akhir */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs">C</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Kegiatan Akhir (Refleksi, Evaluasi &amp; Penutup)</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                        {currentMeet ? '10 Menit' : lpData.kegiatanAkhir.alokasiMenit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed pl-2 sm:pl-8 space-y-1.5">
                      <ol className="list-decimal list-outside ml-4 space-y-1.5">
                        {meetAkhirList.map((p: string, idx: number) => (
                          <li key={idx} className="text-justify leading-relaxed">{cleanActivityText(p)}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 6. KANVAS ASESMEN & EVALUASI */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-wide">
                6. Asesmen Pembelajaran Mendalam (Per Pertemuan)
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Evaluasi Berkesinambungan
            </span>
          </div>

          {/* Rencana Asesmen Per Pertemuan Kanvas */}
          <div className="space-y-3">
            {resolvedMeetings.map((pert, pIdx) => {
              const isFirst = pIdx === 0;
              const isLast = pIdx === resolvedMeetings.length - 1;
              const totalM = resolvedMeetings.length;
              const meetAsesmen = pert.asesmenPertemuan || {
                jenisAsesmen: totalM === 1 ? 'Asesmen Diagnostik (Awal), Formatif (Proses) & Sumatif (Lingkup TP)' : isFirst ? 'Asesmen Diagnostik (Awal) & Formatif (Proses)' : isLast ? 'Asesmen Formatif (Presentasi) & Sumatif (Lingkup TP)' : 'Asesmen Formatif (Proses)',
                teknikDanBentuk: isFirst ? 'Tanya Jawab Pemantik Lisan & Observasi Kesiapan Awal + Lembar Observasi Diskusi' : isLast ? 'Rubrik Presentasi Karya Kelompok & Tes Evaluasi Mandiri Tertulis (HOTS)' : 'Penilaian Kinerja Kelompok pada LKPD & Observasi Diskusi',
                instrumen: `Lembar Kerja Peserta Didik (LKPD Aktivitas Pertemuan ${pIdx + 1}) & Lembar Observasi Sikap`,
                buktiBelajar: `Catatan pengisian LKPD Aktivitas Pertemuan ${pIdx + 1} dan keaktifan proses belajar`,
                tindakLanjut: 'Memberikan bimbingan langsung dan umpan balik deskriptif bagi siswa.',
              };

              return (
                <div key={pIdx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                      {pIdx + 1}. ASESMEN PERTEMUAN {pIdx + 1} ({pert.alokasiWaktu || `${(pert as any).alokasiJP || 2} JP`})
                    </span>
                    <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {meetAsesmen.jenisAsesmen}
                    </span>
                  </div>

                  <div className="text-slate-800 space-y-1 pl-1">
                    <p>
                      <strong className="text-slate-900">• Teknik &amp; Bentuk:</strong> {meetAsesmen.teknikDanBentuk}
                    </p>
                    <p>
                      <strong className="text-slate-900">• Instrumen Asesmen:</strong> {meetAsesmen.instrumen}
                    </p>
                    <p>
                      <strong className="text-slate-900">• Bukti Belajar:</strong> {meetAsesmen.buktiBelajar}
                    </p>
                    {meetAsesmen.tindakLanjut && (
                      <p className="text-slate-600 italic">
                        <strong>• Tindak Lanjut:</strong> {meetAsesmen.tindakLanjut}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. LEMBAR PENGESAHAN RESMI (TANDA TANGAN) */}
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 text-xs text-slate-900 space-y-4">
          {onOpenEditIdentity && (
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Lembar Pengesahan &amp; Tanda Tangan:</span>
              <button
                type="button"
                onClick={onOpenEditIdentity}
                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Identitas &amp; Titimangsa</span>
              </button>
            </div>
          )}
          <table className="w-full border-collapse border-none text-xs text-slate-900">
            <tbody>
              {/* Baris 1: Mengetahui & Tempat/Tanggal */}
              <tr>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p>Mengetahui,</p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p>
                      {modul.identitas.tempatPenetapan || modul.identitas.kabupaten || '...................'},{' '}
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
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="font-bold">Kepala Sekolah</p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top pt-1">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="font-bold">{modul.identitas.peranGuru || 'Guru Kelas'}</p>
                  </div>
                </td>
              </tr>

              {/* Baris 3: Ruang Tanda Tangan & Nama Lengkap */}
              <tr>
                <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="font-bold underline break-words inline-block">
                      {modul.identitas.namaKepalaSekolah || '...........................................'}
                    </p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-bottom h-20 pb-1">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="font-bold underline break-words inline-block">
                      {modul.identitas.namaGuru || '...........................................'}
                    </p>
                  </div>
                </td>
              </tr>

              {/* Baris 4: NIP Kepala Sekolah & NIP Guru */}
              <tr>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="text-slate-600">
                      NIP. {modul.identitas.nipKepalaSekolah ? modul.identitas.nipKepalaSekolah : '...........................................'}
                    </p>
                  </div>
                </td>
                <td className="w-1/2 border-none p-0 align-top">
                  <div className="w-fit mx-auto text-left min-w-[180px] sm:min-w-[220px]">
                    <p className="text-slate-600">
                      NIP. {modul.identitas.nipGuru ? modul.identitas.nipGuru : '...........................................'}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
