import React, { useState, useRef } from 'react';
import { SchoolIdentity, AccessRecord } from '../types';
import { isMasterAccessCode } from '../services/accessCodeService';
import {
  User,
  GraduationCap,
  Calendar,
  X,
  Building,
  Clock,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  MapPin,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  Save,
  PenLine,
} from 'lucide-react';

interface SchoolIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  onSave?: (updated: SchoolIdentity) => void;
  activeAccessRecord?: AccessRecord | null;
  onOpenAccessGate?: () => void;
  defaultTab?: 'profil' | 'logo';
}

export const SchoolIdentityModal: React.FC<SchoolIdentityModalProps> = ({
  isOpen,
  onClose,
  identitas,
  onSave,
  activeAccessRecord,
  onOpenAccessGate,
  defaultTab = 'profil',
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'logo'>(defaultTab);
  const [logoState, setLogoState] = useState<string>(identitas.logoUrl || '');
  const [kopBaris1, setKopBaris1] = useState<string>(
    identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA'
  );
  const [kopBaris2, setKopBaris2] = useState<string>(
    identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'
  );
  const schoolName = identitas.namaSatuanPendidikan || 'SD Negeri Fatubai';
  const [alamatInstansi, setAlamatInstansi] = useState<string>(
    identitas.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713'
  );
  const [kabupaten, setKabupaten] = useState<string>(
    identitas.kabupaten || 'Timor Tengah Utara'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setLogoState(identitas.logoUrl || '');
      setKopBaris1(identitas.kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA');
      setKopBaris2(identitas.kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN');
      setAlamatInstansi(identitas.alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713');
      setKabupaten(identitas.kabupaten || 'Timor Tengah Utara');
    }
  }, [isOpen, identitas]);

  if (!isOpen) return null;

  const alamatLengkap = alamatInstansi || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713';

  const handleSaveData = (customOverrides?: Partial<SchoolIdentity>) => {
    const cleanKop1 = (customOverrides?.kopBaris1 ?? kopBaris1).trim() || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA';
    const cleanKop2 = (customOverrides?.kopBaris2 ?? kopBaris2).trim() || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
    const cleanAlamat = (customOverrides?.alamatInstansi ?? alamatInstansi).trim() || 'Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713';
    const cleanLogo = customOverrides?.logoUrl !== undefined ? customOverrides.logoUrl : (logoState || undefined);
    const cleanKop4 = cleanAlamat.toLowerCase().startsWith('alamat:') ? cleanAlamat : `Alamat: ${cleanAlamat}`;

    const updated: SchoolIdentity = {
      ...identitas,
      logoUrl: cleanLogo,
      kopBaris1: cleanKop1,
      kopBaris2: cleanKop2,
      kopBaris3: schoolName.toUpperCase(),
      kopBaris4: cleanKop4,
      alamatInstansi: cleanAlamat,
      kabupaten: (customOverrides?.kabupaten ?? kabupaten).trim() || identitas.kabupaten || 'Timor Tengah Utara',
      ...customOverrides,
    };

    if (onSave) {
      onSave(updated);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const processFile = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setErrorMessage('Format berkas harus berupa JPG, JPEG, atau PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas logo maksimal 5 MB.');
      return;
    }
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimalisasi ukuran akademis: proporsional max 500x500 px agar jernih saat cetak namun hemat memori
        const maxDim = 500;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type.includes('png');
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92);
          setLogoState(dataUrl);
          handleSaveData({ logoUrl: dataUrl });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveLogo = () => {
    setLogoState('');
    handleSaveData({ logoUrl: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0B1528] via-indigo-950 to-blue-900 p-4 text-white flex items-center justify-between border-b-2 border-amber-500/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
                  Profil Satuan Pendidikan &amp; Kop Surat Resmi
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  RESMI TTU
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Data resmi kop surat, cover dokumen, dan identitas kurikulum SIPARTAN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/90 px-4 pt-2.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t-2 border-x ${
              activeTab === 'profil'
                ? 'bg-white text-slate-900 border-slate-200 border-b-transparent shadow-xs font-black'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Profil Satuan Pendidikan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t-2 border-x relative ${
              activeTab === 'logo'
                ? 'bg-white text-slate-900 border-slate-200 border-b-transparent shadow-xs font-black'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Unggah Logo &amp; Kop Surat</span>
            {logoState ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                Atur
              </span>
            )}
          </button>
        </div>

        {/* Toast Notifikasi Berhasil Simpan */}
        {saveToast && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1 shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Logo dan kop surat resmi berhasil diperbarui serta disinkronkan ke seluruh dokumen!</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Tersimpan</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'profil' ? (
            /* TAB 1: PROFIL SATUAN PENDIDIKAN */
            <div className="space-y-4">
              {/* Security Lock Banner */}
              <div className="bg-amber-50 border-2 border-amber-300/80 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 text-amber-950">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-950 font-bold flex items-center gap-1.5">
                      <span>Perlindungan Keaslian Dokumen: Terkunci Permanen</span>
                      {activeAccessRecord?.kodeAkses && (
                        <span className="font-mono font-black text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded text-[10px] border border-amber-400">
                          {activeAccessRecord.kodeAkses}
                        </span>
                      )}
                    </strong>
                    <p className="text-[11px] text-amber-900 leading-snug mt-1">
                      Nama sekolah, alamat instansi, guru, jabatan, NIP, dan kepala sekolah dikunci permanen sesuai regulasi resmi demi menjaga keabsahan berkas kurikulum di lingkungan Dinas Pendidikan dan Kebudayaan Kab. Timor Tengah Utara.
                    </p>
                  </div>
                </div>

                {onOpenAccessGate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAccessGate();
                    }}
                    className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Ganti Kode
                  </button>
                )}
              </div>

              {/* Shortcut Card: Logo Satuan Pendidikan */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/60 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {logoState ? (
                    <img
                      src={logoState}
                      alt="Logo Sekolah"
                      className="w-12 h-12 object-contain rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border-2 border-dashed border-blue-300 bg-white flex items-center justify-center text-blue-500">
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {logoState ? 'Logo Resmi Satuan Pendidikan Aktif' : 'Logo Belum Diunggah (Format Standar Teks)'}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {logoState
                        ? 'Logo tampil otomatis pada Kop Surat, Naskah Ujian, Laporan CBT PDF, dan Cover Dokumen.'
                        : 'Unggah file JPG atau PNG logo sekolah untuk disematkan pada kop dan cover secara akademis.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('logo')}
                  className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoState ? 'Ubah Logo' : 'Unggah Logo'}</span>
                </button>
              </div>

              {/* Section: Profil Sekolah & Alamat Lengkap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Identitas Satuan Pendidikan &amp; Wilayah Dinas</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" /> Terverifikasi
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        Nama Satuan Pendidikan / Sekolah
                      </span>
                      <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Terkunci Sesuai Data Profil
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 block">{schoolName}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-3 text-xs">
                    {/* Alamat Instansi Lengkap (Bisa Diedit) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] uppercase font-bold text-slate-700 tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>Alamat Instansi Lengkap Satuan Pendidikan</span>
                        </label>
                        <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 flex items-center gap-0.5">
                          <PenLine className="w-2.5 h-2.5" /> Bisa Diedit
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={alamatInstansi}
                        onChange={(e) => setAlamatInstansi(e.target.value)}
                        placeholder="Contoh: Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713"
                        className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs resize-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        Alamat ini otomatis tercetak pada kop surat resmi, cover, dan seluruh dokumen perangkat ajar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Pemerintah Daerah (Baris 1 Kop) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                            Pemerintah Daerah (Kop Baris 1)
                          </label>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                            Bisa Edit
                          </span>
                        </div>
                        <input
                          type="text"
                          value={kopBaris1}
                          onChange={(e) => setKopBaris1(e.target.value)}
                          placeholder="PEMERINTAH KABUPATEN TIMOR TENGAH UTARA"
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 uppercase transition-all shadow-2xs"
                        />
                      </div>

                      {/* Dinas Pendidikan (Baris 2 Kop) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                            Dinas Pembina (Kop Baris 2)
                          </label>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                            Bisa Edit
                          </span>
                        </div>
                        <input
                          type="text"
                          value={kopBaris2}
                          onChange={(e) => setKopBaris2(e.target.value)}
                          placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 uppercase transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveData()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan Alamat &amp; Instansi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Data Penyusun Guru */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Data Penyusun / Penandatangan Dokumen</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-amber-700" /> Terkunci Permanen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Jabatan Guru</span>
                    <span className="text-xs font-black text-slate-900">{identitas.peranGuru || 'Guru Kelas'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">NIP Guru</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{identitas.nipGuru || '-'}</span>
                  </div>
                  <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Nama Guru (beserta Gelar)</span>
                    <span className="text-sm font-black text-slate-900">{identitas.namaGuru || 'Roni Hariyanto Bhidju, S.Pd'}</span>
                  </div>
                </div>
              </div>

              {/* Section: Kepala Satuan Pendidikan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kepala Satuan Pendidikan (Pimpinan)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-amber-700" /> Terkunci Permanen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Nama Kepala Sekolah</span>
                    <span className="text-xs font-black text-slate-900">{identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">NIP Kepala Sekolah</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{identitas.nipKepalaSekolah || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section: Tahun Pelajaran & Alokasi Waktu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ketetapan Tahun Pelajaran &amp; Alokasi Regulasi</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" /> Regulasi 2025/2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Tahun Pelajaran &amp; Semester</span>
                    <span className="text-xs font-black text-slate-900">
                      {identitas.tahunPelajaran || '2026/2027'} • Semester {identitas.semester || '1 (Ganjil)'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Fase &amp; Kelas Terdaftar</span>
                    <span className="text-xs font-black text-slate-900">
                      {identitas.fase} • Kelas {identitas.kelas}
                    </span>
                  </div>
                  <div className="sm:col-span-2 p-3 bg-emerald-50/80 rounded-xl border border-emerald-300">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        Alokasi Waktu Intrakurikuler (Permendikdasmen No. 13 Tahun 2025)
                      </span>
                      <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-200 px-1.5 py-0.2 rounded">
                        Standar Resmi
                      </span>
                    </div>
                    <div className="font-bold text-xs text-emerald-950">
                      {identitas.alokasiWaktuTotal || '180 JP / Tahun (5 JP/Minggu @ 35 Menit)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: UNGGAH LOGO & PRATINJAU KOP SURAT */
            <div className="space-y-4">
              {/* Uploader Card */}
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Unggah Logo Resmi Satuan Pendidikan
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Format didukung: <strong>JPG, JPEG, atau PNG</strong> (Maksimal 5 MB)
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" /> Ukuran Akademis Otomatis
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                      : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-2">
                    {logoState ? (
                      <div className="relative group">
                        <img
                          src={logoState}
                          alt="Pratinjau Logo"
                          className="w-20 h-20 object-contain rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                          Ganti
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {logoState
                          ? 'Klik atau seret file gambar baru untuk mengganti logo'
                          : 'Klik untuk memilih berkas logo atau seret ke area ini'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Logo otomatis dioptimasi ke dimensi standar Kop (~21 mm / 75 px) dan Cover (~28 mm / 100 px).
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Tombol Aksi Logo */}
                {logoState && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Logo resmi aktif &amp; disinkronkan</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* FORM PENGATURAN TEKS KOP DOKUMEN RESMI (4 BARIS) */}
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <PenLine className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Pengaturan Teks Kop Dokumen Resmi (4 Baris)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Sesuaikan nama pemerintah daerah, dinas, dan alamat instansi agar relevan dengan satuan pendidikan Anda.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Sinkron Seluruh Dokumen
                  </span>
                </div>

                <div className="space-y-3">
                  {/* BARIS 1: PEMERINTAH DAERAH (BISA EDIT) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">1</span>
                        <span>Baris Pertama Kop: Pemerintah Daerah (Kabupaten / Kota)</span>
                      </label>
                      <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                        <PenLine className="w-2.5 h-2.5" /> Bisa Diedit
                      </span>
                    </div>
                    <input
                      type="text"
                      value={kopBaris1}
                      onChange={(e) => setKopBaris1(e.target.value)}
                      placeholder="Contoh: PEMERINTAH KABUPATEN TIMOR TENGAH UTARA"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 uppercase transition-all shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500">
                      Teks baris pertama kop dokumen resmi (misal: <em>PEMERINTAH KABUPATEN TIMOR TENGAH UTARA</em>).
                    </p>
                  </div>

                  {/* BARIS 2: DINAS PENDIDIKAN (BISA EDIT) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">2</span>
                        <span>Baris Kedua Kop: Dinas / Lembaga Pembina</span>
                      </label>
                      <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                        <PenLine className="w-2.5 h-2.5" /> Bisa Diedit
                      </span>
                    </div>
                    <input
                      type="text"
                      value={kopBaris2}
                      onChange={(e) => setKopBaris2(e.target.value)}
                      placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 uppercase transition-all shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500">
                      Teks baris kedua kop dokumen resmi (misal: <em>DINAS PENDIDIKAN DAN KEBUDAYAAN</em>).
                    </p>
                  </div>

                  {/* BARIS 3: NAMA SEKOLAH (TERKUNCI SESUAI DATA PROFIL / TIDAK BISA EDIT) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">3</span>
                        <span>Baris Ketiga Kop: Nama Satuan Pendidikan</span>
                      </label>
                      <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Terkunci Sesuai Data Profil
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={schoolName.toUpperCase()}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 text-xs font-black text-slate-700 bg-slate-100/90 rounded-lg border border-slate-300 uppercase cursor-not-allowed shadow-2xs select-none"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-amber-800/90 italic">
                      Nama sekolah terkunci permanen sesuai profil hak akses akun guru demi integritas dokumen resmi.
                    </p>
                  </div>

                  {/* BARIS 4: ALAMAT INSTANSI (BISA DIEDIT) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">4</span>
                        <span>Baris Keempat Kop: Alamat Instansi Lengkap</span>
                      </label>
                      <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                        <PenLine className="w-2.5 h-2.5" /> Bisa Diedit
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={alamatInstansi}
                      onChange={(e) => setAlamatInstansi(e.target.value)}
                      placeholder="Contoh: Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713"
                      className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white rounded-lg border border-slate-300 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs resize-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      Alamat lengkap instansi yang dicetak pada baris keempat kop dan cover dokumen.
                    </p>
                  </div>

                  {/* TOMBOL SIMPAN PENGATURAN KOP */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveData()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan Kop Dokumen</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW 1: KOP SURAT RESMI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pratinjau Kop Surat Resmi (Standar Dokumen &amp; Laporan PDF)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Ukuran Akademis: ~21 mm
                  </span>
                </div>

                <div className="bg-white rounded-xl border-2 border-slate-300 p-4 shadow-sm text-center font-serif text-slate-900 relative">
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {/* Logo Kolom Kiri */}
                    <div className="shrink-0 w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
                      {logoState ? (
                        <img
                          src={logoState}
                          alt="Logo Kop"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                          <Building className="w-5 h-5 opacity-40" />
                          <span className="text-[8px] font-sans font-medium text-slate-400 mt-0.5">Logo</span>
                        </div>
                      )}
                    </div>

                    {/* 4 Baris Kop Surat Resmi Sesuai Permintaan */}
                    <div className="space-y-0.5 text-center flex-1 max-w-lg">
                      <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 leading-tight">
                        {kopBaris1 || 'PEMERINTAH KABUPATEN TIMOR TENGAH UTARA'}
                      </h4>
                      <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 leading-tight">
                        {kopBaris2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                      </h4>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950 leading-tight pt-0.5">
                        {schoolName}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-normal text-slate-700 leading-tight pt-0.5">
                        {alamatInstansi ? (alamatInstansi.toLowerCase().startsWith('alamat:') ? alamatInstansi : `Alamat: ${alamatInstansi}`) : 'Alamat: Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713'}
                      </p>
                    </div>
                  </div>

                  {/* Garis Ganda Resmi (Double Line) */}
                  <div className="pt-3 pb-1">
                    <div className="h-0.5 bg-slate-900 w-full" />
                    <div className="h-px bg-slate-400 w-full mt-0.5" />
                  </div>

                  <p className="text-[9.5px] font-sans text-slate-500 italic mt-1">
                    *Tercetak otomatis pada seluruh lembar KKTP, ATP, Modul Ajar, Prota, Promes, Naskah Soal, dan Rekapitulasi CBT PDF.
                  </p>
                </div>
              </div>

              {/* LIVE PREVIEW 2: COVER DOKUMEN RESMI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pratinjau Halaman Cover Dokumen</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Ukuran Cover: ~28 mm
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center font-serif space-y-2 max-w-md mx-auto">
                  {/* Logo Terpusat pada Cover */}
                  <div className="flex justify-center">
                    {logoState ? (
                      <img
                        src={logoState}
                        alt="Logo Cover"
                        className="w-14 h-14 object-contain drop-shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 text-xs">
                        Logo
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    ANALISIS CAPAIAN PEMBELAJARAN KE TUJUAN PEMBELAJARAN
                  </h4>
                  <p className="text-[11px] font-bold text-blue-900 uppercase">
                    {identitas.mataPelajaran || 'MATEMATIKA'} — {identitas.fase} (KELAS {identitas.kelas})
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 uppercase pt-1 border-t border-slate-200">
                    {schoolName} • TAHUN {identitas.tahunPelajaran}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">
              Alamat: <strong className="text-slate-800">Fatubai, Desa Oehalo, Kec. Insana Tengah - 856713</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'logo' && (
              <button
                type="button"
                onClick={() => {
                  if (onSave) {
                    onSave({
                      ...identitas,
                      logoUrl: logoState || undefined,
                      alamatInstansi: alamatLengkap,
                      kabupaten: kabupaten,
                    });
                  }
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2500);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Logo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
