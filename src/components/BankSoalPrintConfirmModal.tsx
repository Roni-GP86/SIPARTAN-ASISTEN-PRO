import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  MapPin,
  Layers,
  GraduationCap,
  Building2,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertCircle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { SchoolIdentity, KonfigurasiKisiKisiSoal, TPItem } from '../types';
import { getClassesForFase } from '../utils/classFilterUtils';

export interface BankSoalPrintConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'PRINT' | 'WORD' | 'PDF';
  target: 'kisi-kisi' | 'naskah' | 'kunci';
  identitas: SchoolIdentity;
  konfigurasi: KonfigurasiKisiKisiSoal;
  availableTPs?: TPItem[];
  onConfirm: (
    updatedIdentitas: SchoolIdentity,
    updatedKonfigurasi: KonfigurasiKisiKisiSoal,
    actionType: 'PRINT' | 'WORD' | 'PDF',
    target: 'kisi-kisi' | 'naskah' | 'kunci'
  ) => void;
}

const JENIS_UJIAN_PRESETS = [
  { label: 'Ulangan Harian', jenis: 'Ulangan Harian', title: 'ULANGAN HARIAN' },
  { label: 'Tengah Semester 1 (STS 1)', jenis: 'Tengah Semester 1', title: 'PENILAIAN TENGAH SEMESTER 1' },
  { label: 'Tengah Semester 2 (STS 2)', jenis: 'Tengah Semester 2', title: 'PENILAIAN TENGAH SEMESTER 2' },
  { label: 'Akhir Semester 1 (SAS 1)', jenis: 'Semester 1', title: 'UJIAN SEMESTER 1' },
  { label: 'Akhir Semester 2 (SAT 2)', jenis: 'Semester 2', title: 'UJIAN SEMESTER 2' },
];

export const BankSoalPrintConfirmModal: React.FC<BankSoalPrintConfirmModalProps> = ({
  isOpen,
  onClose,
  actionType,
  target,
  identitas,
  konfigurasi,
  onConfirm,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 4 Baris KOP
  const [kopBaris1, setKopBaris1] = useState(
    identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA'
  );
  const [kopBaris2, setKopBaris2] = useState(
    identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'
  );
  const [kopBaris3, setKopBaris3] = useState(
    identitas.kopBaris3 || identitas.namaSatuanPendidikan?.toUpperCase() || 'SD NEGERI FATUBAI'
  );
  const [kopBaris4, setKopBaris4] = useState(
    identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah'
  );

  // Logo KOP
  const [logoUrl, setLogoUrl] = useState<string>(identitas.logoUrl || '/school_logo.jpg');

  // Identitas Dokumen & Pilihan Guru
  const [mataPelajaran, setMataPelajaran] = useState(
    konfigurasi.mataPelajaran || identitas.mataPelajaran || 'Matematika'
  );
  const [fase, setFase] = useState(identitas.fase || 'Fase C');

  // Kelas Konfirmasi (pilihan kelas spesifik guru)
  const classList = getClassesForFase(fase);
  const initialSingleClass = identitas.kelas
    ? identitas.kelas.includes('&')
      ? identitas.kelas.split('&')[0].trim()
      : identitas.kelas.trim()
    : classList[0] || '5';
  const [selectedKelas, setSelectedKelas] = useState<string>(initialSingleClass);

  // Jenis Ujian & Judul
  const [jenisAsesmen, setJenisAsesmen] = useState<string>(
    konfigurasi.jenisAsesmen || 'Semester 1'
  );
  const [customJudul, setCustomJudul] = useState<string>(
    identitas.jenisUjian || 'UJIAN SEMESTER 1'
  );

  // Titimangsa & Tahun Pelajaran
  const [tempat, setTempat] = useState<string>(identitas.tempatPenetapan || 'Fatubai');
  const [tanggal, setTanggal] = useState<string>(
    konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan || '22 September 2026'
  );
  const [tahunPelajaran, setTahunPelajaran] = useState<string>(
    identitas.tahunPelajaran || '2026/2027'
  );
  const [semester, setSemester] = useState<string>(
    identitas.semester || (jenisAsesmen.includes('2') ? 'Semester 2' : 'Semester 1')
  );

  useEffect(() => {
    if (isOpen) {
      setKopBaris1(identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA');
      setKopBaris2(identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN');
      setKopBaris3(identitas.kopBaris3 || identitas.namaSatuanPendidikan?.toUpperCase() || 'SD NEGERI FATUBAI');
      setKopBaris4(identitas.kopBaris4 || identitas.alamatInstansi || 'ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah');
      setLogoUrl(identitas.logoUrl || '/school_logo.jpg');
      setMataPelajaran(konfigurasi.mataPelajaran || identitas.mataPelajaran || 'Matematika');
      setFase(identitas.fase || 'Fase C');

      const cl = getClassesForFase(identitas.fase || 'Fase C');
      const sc = identitas.kelas
        ? identitas.kelas.includes('&')
          ? identitas.kelas.split('&')[0].trim()
          : identitas.kelas.trim()
        : cl[0] || '5';
      setSelectedKelas(sc);

      setJenisAsesmen(konfigurasi.jenisAsesmen || 'Semester 1');
      setCustomJudul(identitas.jenisUjian || (konfigurasi.jenisAsesmen === 'Semester 1' ? 'UJIAN SEMESTER 1' : konfigurasi.jenisAsesmen.toUpperCase()));
      setTempat(identitas.tempatPenetapan || 'Fatubai');
      setTanggal(konfigurasi.tanggalPelaksanaan || identitas.tanggalPenetapan || '22 September 2026');
      setTahunPelajaran(identitas.tahunPelajaran || '2026/2027');
      setSemester(identitas.semester || 'Semester 1');
    }
  }, [isOpen, identitas, konfigurasi]);

  if (!isOpen) return null;

  // Handle Logo Upload via file reader to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo terlalu besar. Harap unggah file di bawah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setLogoUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetKopToDefault = () => {
    setKopBaris1('PEMERINTAH KABUPATEN TIMOR TENGAH UTARA');
    setKopBaris2('DINAS PENDIDIKAN DAN KEBUDAYAAN');
    setKopBaris3('SD NEGERI FATUBAI');
    setKopBaris4('ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah');
    setLogoUrl('/school_logo.jpg');
    setTempat('Fatubai');
  };

  const handleSelectJenisUjian = (preset: (typeof JENIS_UJIAN_PRESETS)[0]) => {
    setJenisAsesmen(preset.jenis);
    setCustomJudul(preset.title);
    if (preset.jenis.includes('2')) {
      setSemester('Semester 2');
    } else {
      setSemester('Semester 1');
    }
  };

  const handleExecute = () => {
    const resolvedTanggal = tanggal.trim() && !/^[\.\-\s]+$/.test(tanggal.trim()) ? tanggal.trim() : '22 September 2026';
    const resolvedTempat = tempat.trim() || 'Fatubai';
    const schoolUpper = (kopBaris3.trim() || identitas.namaSatuanPendidikan || 'SD NEGERI FATUBAI').toUpperCase();

    const updatedIdentitas: SchoolIdentity = {
      ...identitas,
      kopBaris1: kopBaris1.trim().toUpperCase(),
      kopBaris2: kopBaris2.trim().toUpperCase(),
      kopBaris3: schoolUpper,
      kopBaris4: kopBaris4.trim(),
      logoUrl: logoUrl.trim(),
      namaSatuanPendidikan: schoolUpper,
      alamatInstansi: kopBaris4.replace(/^ALAMAT:\s*/i, '').trim(),
      mataPelajaran: mataPelajaran.trim(),
      kelas: selectedKelas.trim(),
      fase: fase as any,
      semester: semester.trim(),
      tahunPelajaran: tahunPelajaran.trim(),
      tempatPenetapan: resolvedTempat,
      tanggalPenetapan: resolvedTanggal,
      jenisUjian: customJudul.trim().toUpperCase(),
    };

    const updatedKonfigurasi: KonfigurasiKisiKisiSoal = {
      ...konfigurasi,
      mataPelajaran: mataPelajaran.trim(),
      kelas: selectedKelas.trim(),
      fase: fase as any,
      semester: semester.trim() as any,
      tahunPelajaran: tahunPelajaran.trim(),
      jenisAsesmen: jenisAsesmen as any,
      tanggalPelaksanaan: resolvedTanggal,
    };

    onConfirm(updatedIdentitas, updatedKonfigurasi, actionType, target);
    onClose();
  };

  // Orientation Badge Info
  const isLandscape = target === 'kisi-kisi';
  const orientationText = isLandscape ? 'Landscape (Mendatar)' : 'Portrait (Tegak)';
  const targetLabel =
    target === 'kisi-kisi'
      ? 'Matriks Kisi-Kisi Penulisan Soal'
      : target === 'naskah'
      ? 'Naskah Soal Siswa (Tanpa Tanda Tangan)'
      : 'Kunci Jawaban & Rubrik Penskoran';

  const actionText =
    actionType === 'PRINT'
      ? 'Cetak Dokumen Sekarang (Print)'
      : actionType === 'WORD'
      ? 'Unduh Microsoft Word (.doc)'
      : 'Ekspor File PDF Resmi';

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border-2 border-slate-300 my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0B1528] via-slate-900 to-[#1e293b] text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0">
              {actionType === 'PRINT' && <Printer className="w-5 h-5" />}
              {actionType === 'WORD' && <Download className="w-5 h-5" />}
              {actionType === 'PDF' && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-300 text-slate-950">
                  Konfirmasi Dokumen Resmi
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isLandscape
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40'
                      : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  }`}
                >
                  Wajib {orientationText}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Penyelarasan KOP, Pilihan Kelas, &amp; Judul Ujian
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50 text-slate-900 text-xs">
          {/* Petunjuk & Orientasi Wajib */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-[11.5px] text-blue-950 leading-relaxed">
              <span className="font-bold">Standar Format Kedinasan:</span> Dokumen <b>{targetLabel}</b> akan diproses dalam format <b>{orientationText}</b>. Periksa dan lengkapi 4 baris KOP, logo resmi, dan pastikan kelas mengajar guru sudah sesuai sebelum dicetak/diekspor.
            </div>
          </div>

          {/* SECTION 1: 4 BARIS KOP & LOGO RESMI */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                  1. Format 4 Baris KOP Surat &amp; Unggah Logo
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetKopToDefault}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-300 transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                title="Kembalikan ke KOP default Kabupaten Timor Tengah Utara - SD Negeri Fatubai"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset KOP TTU / Fatubai</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Logo Upload Box */}
              <div className="md:col-span-4 bg-slate-50 p-3 rounded-xl border-2 border-dashed border-slate-300 text-center space-y-2.5">
                <span className="font-bold text-[11px] text-slate-700 block">
                  Logo Resmi KOP
                </span>
                <div className="w-20 h-20 mx-auto rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo KOP"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo (.png / .jpg)</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="w-full px-2 py-1 rounded text-[10px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold cursor-pointer"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Line Inputs */}
              <div className="md:col-span-8 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Baris 1 (Pemerintah Kabupaten / Daerah):
                  </label>
                  <input
                    type="text"
                    value={kopBaris1}
                    onChange={(e) => setKopBaris1(e.target.value.toUpperCase())}
                    placeholder="PEMERINTAH KABUPATEN TIMOR TENGAH UTARA"
                    className="w-full px-3 py-1.5 font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Baris 2 (Dinas Pendidikan):
                  </label>
                  <input
                    type="text"
                    value={kopBaris2}
                    onChange={(e) => setKopBaris2(e.target.value.toUpperCase())}
                    placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                    className="w-full px-3 py-1.5 font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Baris 3 (Nama Satuan Pendidikan / Sekolah):
                  </label>
                  <input
                    type="text"
                    value={kopBaris3}
                    onChange={(e) => setKopBaris3(e.target.value.toUpperCase())}
                    placeholder="SD NEGERI FATUBAI"
                    className="w-full px-3 py-1.5 font-black text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Baris 4 (Alamat Lengkap Satuan Pendidikan):
                  </label>
                  <input
                    type="text"
                    value={kopBaris4}
                    onChange={(e) => setKopBaris4(e.target.value)}
                    placeholder="ALAMAT: FATUBAI DESA Oehalo, kecamatan Insana Tengah"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: KONFIRMASI KELAS & PILIHAN UJIAN */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                2. Konfirmasi Pemilihan Kelas &amp; Bentuk Ujian
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pemilihan Kelas Sesuai Jenjang Guru */}
              <div className="space-y-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                <label className="block font-black text-xs text-amber-950">
                  Pilih Tingkat Kelas yang Diampu ({fase}):
                </label>
                <p className="text-[11px] text-amber-900 leading-tight">
                  Pastikan memilih kelas mengajar Anda (contoh: Fase A adalah Kelas 1 atau 2, Fase B adalah Kelas 3 atau 4, Fase C adalah Kelas 5 atau 6):
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {classList.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKelas(k)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                        selectedKelas === k
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Kelas {k}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-semibold">Custom:</span>
                    <input
                      type="text"
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      placeholder="e.g. 5 atau V"
                      className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Pemilihan Bentuk Ujian / Asesmen */}
              <div className="space-y-2 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                <label className="block font-black text-xs text-indigo-950">
                  Jenis Asesmen / Pelaksanaan Ujian:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  {JENIS_UJIAN_PRESETS.map((p) => (
                    <button
                      key={p.jenis}
                      type="button"
                      onClick={() => handleSelectJenisUjian(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                        jenisAsesmen === p.jenis
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mata Pelajaran & Judul Ujian Dinamis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Mata Pelajaran:
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="Contoh: Matematika"
                  className="w-full px-3 py-1.5 font-black text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Nama / Label Ujian (muncul pada judul dokumen):
                </label>
                <input
                  type="text"
                  value={customJudul}
                  onChange={(e) => setCustomJudul(e.target.value)}
                  placeholder="Contoh: UJIAN SEMESTER 1 atau PENILAIAN HARIAN"
                  className="w-full px-3 py-1.5 font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white uppercase"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TITIMANGSA & TAHUN PELAJARAN */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                3. Titimangsa &amp; Tahun Pelajaran
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Tempat Penetapan:
                </label>
                <input
                  type="text"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  placeholder="Fatubai"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Tanggal Pelaksanaan / Titimangsa:
                </label>
                <input
                  type="text"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  placeholder="22 September 2026"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Tahun Pelajaran:
                </label>
                <input
                  type="text"
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW KOP & JUDUL DOKUMEN */}
          <div className="bg-white p-4 rounded-xl border-2 border-slate-400 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Pratinjau KOP &amp; Judul Dokumen Hasil Cetak:
            </span>

            <div className="p-4 bg-slate-50/70 border border-slate-300 rounded-lg text-center font-serif text-black">
              {/* Kop Header */}
              <div className="flex items-center justify-center gap-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain shrink-0"
                  />
                )}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">{kopBaris1}</div>
                  <div className="text-[12px] font-bold uppercase tracking-wider">{kopBaris2}</div>
                  <div className="text-[14px] font-black uppercase tracking-wide">{kopBaris3}</div>
                  <div className="text-[9.5px] italic text-slate-700">{kopBaris4}</div>
                </div>
              </div>

              {/* Garis Ganda Pembatas KOP */}
              <div className="border-b-[2.5px] border-black mt-2.5"></div>
              <div className="border-b border-black mt-0.5 mb-2.5"></div>

              {/* Judul Dokumen Resmi (Sesuai Regulasi: Cukup Judul Utama tanpa mengulang Mapel & Kelas) */}
              <div className="text-xs sm:text-sm font-black uppercase tracking-wide">
                {target === 'kisi-kisi' && 'KISI-KISI SOAL'}
                {target === 'naskah' && 'NASKAH SOAL'}
                {target === 'kunci' && 'KUNCI JAWABAN & PEDOMAN PENSKORAN'}
              </div>
              <div className="text-[10.5px] font-bold text-slate-800 mt-0.5">
                {customJudul} • TAHUN PELAJARAN {tahunPelajaran} • KURIKULUM MERDEKA
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold text-xs cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecute}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
              actionType === 'PRINT'
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : actionType === 'WORD'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {actionType === 'PRINT' && <Printer className="w-4 h-4 text-amber-300" />}
            {actionType === 'WORD' && <Download className="w-4 h-4" />}
            {actionType === 'PDF' && <FileText className="w-4 h-4" />}
            <span>{actionText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
