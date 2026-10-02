import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Sparkles,
  School,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  HelpCircle,
  MessageCircle,
  Clock,
  Copy,
  Check,
  Phone,
  RefreshCw,
} from 'lucide-react';
import {
  findAccessRecord,
  findAccessRecordAsync,
  subscribeToSingleAccessCode,
  setActiveSessionCode,
  MASTER_ACCESS_CODE,
  createNewAccessRecord,
  createNewAccessRecordAsync,
  getAllAccessRecords,
  isMasterAccessCode,
  isDeactivatedLegacyCode,
  ADMIN_WA_DISPLAY,
  ADMIN_WA_INTL,
  createAdminWhatsAppLink,
  formatWhatsAppNumber,
  resetCloudCooldown,
} from '../services/accessCodeService';
import { AccessRecord } from '../types';

interface AccessGateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccessUnlock?: (record: AccessRecord) => void;
  onSuccess?: (record: AccessRecord) => void;
  onOpenAdminPanel?: () => void;
  onOpenAdmin?: () => void;
  activeRecord: AccessRecord | null;
}

export const AccessGateModal: React.FC<AccessGateModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock,
  onSuccess,
  onOpenAdminPanel,
  onOpenAdmin,
  activeRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [inputCode, setInputCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [inactiveTargetRecord, setInactiveTargetRecord] = useState<AccessRecord | null>(null);

  // Form registrasi baru
  const [regNamaGuru, setRegNamaGuru] = useState('');
  const [regNipGuru, setRegNipGuru] = useState('');
  const [regJabatan, setRegJabatan] = useState<'Guru Kelas' | 'Guru Mata Pelajaran'>('Guru Kelas');
  const [regNamaSekolah, setRegNamaSekolah] = useState('');
  const [regNomorWA, setRegNomorWA] = useState('');
  const [regFase, setRegFase] = useState<'Fase A' | 'Fase B' | 'Fase C'>('Fase C');
  const [regKelas, setRegKelas] = useState('5');
  const [regNamaKS, setRegNamaKS] = useState('');
  const [regNipKS, setRegNipKS] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<AccessRecord | null>(null);
  const [copiedCodeText, setCopiedCodeText] = useState<string | null>(null);

  // Real-time listener: mendeteksi otomatis saat Admin mengaktifkan kode pendaftar
  React.useEffect(() => {
    if (!newlyCreatedCode?.kodeAkses) return;
    const unsub = subscribeToSingleAccessCode(newlyCreatedCode.kodeAkses, (updated) => {
      if (updated && (updated.isActive || updated.status === 'active')) {
        setNewlyCreatedCode(updated);
        setActiveSessionCode(updated.kodeAkses);
        setSuccessInfo(`Selamat! Kode Akses "${updated.kodeAkses}" telah DISETUJUI & DIAKTIFKAN oleh Admin SIPARTAN! Membuka aplikasi...`);
        const unlockCallback = onSuccessUnlock || onSuccess;
        if (unlockCallback) {
          try {
            unlockCallback(updated);
          } catch (err) {
            console.error('Error applying access record callback:', err);
          }
        }
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      }
    });
    return () => {
      unsub();
    };
  }, [newlyCreatedCode?.kodeAkses, onSuccessUnlock, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleVerifyCode = async (codeToVerify?: string) => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setInactiveTargetRecord(null);
    const target = (codeToVerify || inputCode).toUpperCase().trim();

    if (!target) {
      setErrorMessage('Silakan masukkan kode akses Anda.');
      return;
    }

    if (!target.startsWith('GP-')) {
      setErrorMessage('Format tidak valid. Kode akses SIPARTAN selalu diawali dengan "GP-" (Contoh: GP-XXXX).');
      return;
    }

    if (isDeactivatedLegacyCode(target)) {
      setErrorMessage(
        'Kode akses "GP-86OK" telah dinonaktifkan/kadaluarsa secara permanen dan tidak berlaku lagi. Silakan gunakan Kode Master resmi terbaru (GP-1386) atau ajukan kode akses baru.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      let record = findAccessRecord(target);

      // Jika di penyimpanan lokal belum ditemukan atau belum aktif, periksa langsung ke Cloud Firestore lintas perangkat
      if (!record || !record.isActive) {
        const cloudRecord = await findAccessRecordAsync(target);
        if (cloudRecord) {
          record = cloudRecord;
        }
      }

      if (!record) {
        setErrorMessage(
          `Kode akses "${target}" tidak ditemukan dalam sistem. Pastikan Anda telah mengisi formulir pendaftaran atau cek kembali ketikan kode Anda.`
        );
        return;
      }

      if (!record.isActive || record.status === 'inactive') {
        setErrorMessage(
          `Kode akses "${target}" terdaftar atas nama ${record.namaGuru} (${record.namaSekolah}), namun saat ini BELUM AKTIF. Kode harus diverifikasi dan diaktifkan terlebih dahulu oleh Admin SIPARTAN.`
        );
        setInactiveTargetRecord(record);
        return;
      }

      // Success: Lock session and unlock app!
      setActiveSessionCode(record.kodeAkses);
      if (isMasterAccessCode(record.kodeAkses) || record.isPremiumMaster) {
        setSuccessInfo(
          '👑 Kode Master Pengembang & Admin Terverifikasi! Hak akses penuh master telah diaktifkan tanpa batasan fase, kelas, maupun jabatan.'
        );
      } else {
        setSuccessInfo(`Kode Akses Terverifikasi! Selamat datang, ${record.namaGuru} (${record.namaSekolah || record.namaSatuanPendidikan}). Identitas Anda telah dikunci permanen.`);
      }

      // Call unlock callbacks safely
      const unlockCallback = onSuccessUnlock || onSuccess;
      if (unlockCallback) {
        try {
          unlockCallback(record);
        } catch (err) {
          console.error('Error applying access record callback:', err);
        }
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 450);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memverifikasi kode akses.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regNamaGuru.trim() || !regNamaSekolah.trim()) {
      setErrorMessage('Nama Lengkap Guru dan Nama Sekolah wajib diisi.');
      return;
    }

    if (!regNomorWA.trim()) {
      setErrorMessage('Nomor WhatsApp aktif wajib diisi agar Admin dapat menghubungi dan mengirimkan kode yang telah diaktifkan.');
      return;
    }

    setIsSubmittingReg(true);
    resetCloudCooldown();
    try {
      const created = await createNewAccessRecordAsync({
        namaGuru: regNamaGuru.trim(),
        nipGuru: regNipGuru.trim() || '-',
        jabatan: regJabatan,
        namaSekolah: regNamaSekolah.trim(),
        fase: regFase,
        kelas: regKelas,
        namaKepalaSekolah: regNamaKS.trim() || '-',
        nipKepalaSekolah: regNipKS.trim() || '-',
        nomorHpPendaftar: regNomorWA.trim(),
        sumberPendaftaran: 'Input Langsung',
        autoActivate: false, // Kode TIDAK langsung aktif, tersimpan di Firestore untuk diaktifkan admin
      });

      setNewlyCreatedCode(created);
      setInputCode(created.kodeAkses);
      if (created.cloudSynced === false && created.cloudError) {
        console.warn('Peringatan penyimpanan cloud pendaftaran:', created.cloudError);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan data guru.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeText(label);
    setTimeout(() => setCopiedCodeText(null), 2500);
  };

  const getAdminWhatsAppMessage = (rec: AccessRecord) => {
    return `Halo Admin SIPARTAN (Bapak Roni Hariyanto Bhidju, S. Pd / ${ADMIN_WA_DISPLAY}),\n\nSaya telah mengajukan permohonan kode akses SIPARTAN:\n- Nama Guru: ${rec.namaGuru}\n- NIP Guru: ${rec.nipGuru}\n- Jabatan: ${rec.jabatan} (${rec.fase} - Kelas ${rec.kelas})\n- Satuan Pendidikan: ${rec.namaSekolah}\n- Kepala Sekolah: ${rec.namaKepalaSekolah} (NIP: ${rec.nipKepalaSekolah})\n- Nomor WA Saya: ${rec.nomorHpPendaftar || '-'}\n- Kode Akses Terbit: *${rec.kodeAkses}*\n\nMohon kesediaan Admin untuk memverifikasi dan mengaktifkan kode akses saya. Terima kasih!`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-blue-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Pintu Gerbang Masuk SIPARTAN</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  Keamanan Terpadu
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Sistem Penguncian Identitas & Verifikasi Kode Akses Guru
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {activeRecord ? 'Tutup' : 'Kembali ke Pilihan Portal'}
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'login'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Masuk dengan Kode Akses
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Formulir Pendaftaran Guru
          </button>
        </div>

        {/* Tab 1: Login with Code */}
        {activeTab === 'login' && (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Notification alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2.5 text-red-900 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="font-semibold leading-relaxed">{errorMessage}</div>
                </div>

                {/* Direct WhatsApp button if code is inactive */}
                {inactiveTargetRecord && (
                  <div className="pt-2 border-t border-red-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-red-800">
                      Hubungi Admin untuk proses aktivasi: <strong className="font-mono">{ADMIN_WA_DISPLAY}</strong>
                    </div>
                    <a
                      href={createAdminWhatsAppLink(getAdminWhatsAppMessage(inactiveTargetRecord))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Hubungi Admin via WhatsApp ({ADMIN_WA_DISPLAY})
                    </a>
                  </div>
                )}
              </div>
            )}

            {successInfo && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="font-bold">{successInfo}</div>
              </div>
            )}

            {/* Quick Demo Access Card - 1 Akun Demo Resmi GP-RHB1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AKUN DEMO RESMI:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs sm:text-sm shadow-xs tracking-wider">
                    GP-RHB1
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInputCode('GP-RHB1');
                    setErrorMessage(null);
                    handleVerifyCode('GP-RHB1');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Coba Aplikasi dengan Akun Demo (GP-RHB1)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11.5px] text-emerald-950 leading-relaxed font-medium">
                Akun simulasi publik resmi: Data Satuan Pendidikan &amp; Guru terkunci pada <strong>SD Negeri Fatubai - Roni Hariyanto Bhidju, S. Pd</strong>. Pada akun demo ini, Anda bebas mengeksplorasi <strong>Fase A, Fase B, maupun Fase C</strong> serta seluruh kelas 1–6 (tanpa akses ke Panel Administrator).
              </p>
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-emerald-800 font-semibold">
                  Ingin menggunakan identitas sekolah dan nama Anda sendiri?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Isi Formulir Pendaftaran Guru Baru</span>
                </button>
              </div>
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode();
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Masukkan Kode Akses Anda (Diawali GP-)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMessage(null);
                  }}
                  placeholder="Contoh: GP-RHB1 atau GP-XXXX"
                  className="w-full pl-4 pr-36 py-3.5 text-base font-mono font-black tracking-widest bg-white text-black border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Masuk ke SIPARTAN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Full width button as an alternative for mobile/clear visibility */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk ke SIPARTAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                Setiap kode akses terikat khusus dengan data guru &amp; sekolah untuk melindungi dari pencurian identitas.
              </p>
            </form>

            {/* Information Guidance Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Verifikasi Keaslian & Hak Pakai Aplikasi
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Aplikasi SIPARTAN dilengkapi sistem penguncian identitas. Kode akses resmi diterbitkan setelah pengisian formulir pendaftaran guru dan disetujui oleh pemilik/administrator sistem.
              </p>
            </div>

            {/* Footer options */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Belum punya kode akses? Isi formulir pendaftaran di sini
              </button>

              <div className="flex items-center gap-2">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800 font-medium text-xs cursor-pointer underline"
                  >
                    Bukan Guru? Kembali ke Portal Murid
                  </button>
                )}

                {activeRecord && (isMasterAccessCode(activeRecord.kodeAkses) || activeRecord.isPremiumMaster) && (
                  <button
                    type="button"
                    onClick={onOpenAdminPanel}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Panel Administrator
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Formulir Pendaftaran Guru */}
        {activeTab === 'register' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {newlyCreatedCode ? (
              /* Success / Pending Activation Screen */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-800 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-amber-950">Permohonan Kode Akses Berhasil Diajukan!</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-300 text-amber-950">
                          MENUNGGU AKTIVASI ADMIN
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        Data pendaftaran Anda telah tercatat dengan aman di SIPARTAN.
                        Sesuai standar verifikasi resmi, <strong>kode akses tidak langsung otomatis aktif</strong> dan harus diaktifkan oleh Administrator SIPARTAN.
                      </p>
                    </div>
                  </div>

                  {/* Code Display Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-amber-300 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        Kode Akses Terbitan Anda:
                      </div>
                      <div className="text-xl font-mono font-black text-slate-900 tracking-wider">
                        {newlyCreatedCode.kodeAkses}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newlyCreatedCode.kodeAkses, 'code')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCodeText === 'code' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Details Summary */}
                  <div className="p-3 rounded-lg bg-amber-100/70 border border-amber-200 text-xs space-y-1.5 text-amber-950">
                    <div className="font-bold border-b border-amber-300/60 pb-1 flex items-center justify-between">
                      <span>Rincian Identitas Terikat Permanen:</span>
                      <span className="text-[10px] text-amber-800">Status: Menunggu Aktivasi</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      <div><strong>Nama Guru:</strong> {newlyCreatedCode.namaGuru}</div>
                      <div><strong>NIP Guru:</strong> {newlyCreatedCode.nipGuru}</div>
                      <div><strong>Satuan Pendidikan:</strong> {newlyCreatedCode.namaSekolah}</div>
                      <div><strong>Penugasan:</strong> {newlyCreatedCode.jabatan} ({newlyCreatedCode.fase} - Kelas {newlyCreatedCode.kelas})</div>
                      <div><strong>Kepala Sekolah:</strong> {newlyCreatedCode.namaKepalaSekolah}</div>
                      <div><strong>Nomor WhatsApp Guru:</strong> {newlyCreatedCode.nomorHpPendaftar || '-'}</div>
                    </div>
                  </div>

                  {/* WhatsApp Admin Action Guidance */}
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Langkah Selanjutnya: Hubungi Admin via WhatsApp
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Klik tombol hijau di bawah untuk langsung mengirimkan konfirmasi pendaftaran ke nomor WhatsApp resmi Admin: <strong>{ADMIN_WA_DISPLAY}</strong>.
                      Setelah kode Anda diaktifkan, Admin akan menghubungi dan mengirimkan kode via WhatsApp ke nomor Anda ({newlyCreatedCode.nomorHpPendaftar}).
                    </p>
                    <a
                      href={createAdminWhatsAppLink(getAdminWhatsAppMessage(newlyCreatedCode))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Konfirmasi ke WA Admin ({ADMIN_WA_DISPLAY})</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      disabled={isCheckingActivation}
                      onClick={async () => {
                        if (!newlyCreatedCode) return;
                        setIsCheckingActivation(true);
                        try {
                          const latest = await findAccessRecordAsync(newlyCreatedCode.kodeAkses);
                          if (latest && (latest.isActive || latest.status === 'active')) {
                            setActiveSessionCode(latest.kodeAkses);
                            setNewlyCreatedCode(latest);
                            const cb = onSuccessUnlock || onSuccess;
                            if (cb) cb(latest);
                            setSuccessInfo(`Selamat! Kode akses ${latest.kodeAkses} telah DISETUJUI & DIAKTIFKAN oleh Admin SIPARTAN.`);
                            setTimeout(() => {
                              if (onClose) onClose();
                            }, 1200);
                          } else {
                            alert(`Status Kode Akses "${newlyCreatedCode.kodeAkses}":\nSaat ini masih dalam antrean (Menunggu Verifikasi & Aktivasi oleh Admin SIPARTAN).\n\nJika belum, pastikan Anda telah mengirimkan konfirmasi via WhatsApp ke Admin (Bapak Roni / WA: ${ADMIN_WA_DISPLAY}).`);
                          }
                        } catch (err: any) {
                          alert(`Gagal memeriksa ke Cloud: ${err?.message || 'Koneksi offline'}`);
                        } finally {
                          setIsCheckingActivation(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingActivation ? 'animate-spin' : ''}`} />
                      <span>{isCheckingActivation ? 'Memeriksa ke Cloud Firestore...' : 'Cek Status Aktivasi Sekarang'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewlyCreatedCode(null);
                      setActiveTab('login');
                    }}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ← Buka Menu Masuk ke SIPARTAN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewlyCreatedCode(null);
                      setRegNamaGuru('');
                      setRegNipGuru('');
                      setRegNamaSekolah('');
                      setRegNomorWA('');
                      setRegNamaKS('');
                      setRegNipKS('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Daftar Nama Guru Lain
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    Formulir Permohonan Kode Akses Resmi SIPARTAN
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Data yang Anda masukkan di bawah ini akan <strong>dikunci permanen</strong> pada cover dokumen, lembar ATP, dan Modul Ajar.
                    Setelah diajukan, Administrator SIPARTAN (Bapak Roni / WA: {ADMIN_WA_DISPLAY}) akan memverifikasi dan mengaktifkan kode akses Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Nama Lengkap Guru */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      1. Nama Lengkap Guru (beserta Gelar) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regNamaGuru}
                      onChange={(e) => setRegNamaGuru(e.target.value)}
                      placeholder="Contoh: Yeni Ellu, S.Pd."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-black placeholder:text-slate-400 font-bold"
                    />
                  </div>

                  {/* 2. NIP Guru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      2. NIP Guru (atau - jika Non-PNS)
                    </label>
                    <input
                      type="text"
                      value={regNipGuru}
                      onChange={(e) => setRegNipGuru(e.target.value)}
                      placeholder="Contoh: 19860610 200902 2 004 atau -"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-black placeholder:text-slate-400 font-bold"
                    />
                  </div>

                  {/* 3. Jabatan Guru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      3. Jabatan Guru <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-black focus:border-blue-600 focus:outline-none font-bold"
                    >
                      <option value="Guru Kelas">Guru Kelas</option>
                      <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    </select>
                  </div>

                  {/* 4. Nama Satuan Pendidikan (Sekolah) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      4. Nama Satuan Pendidikan (Nama Sekolah) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regNamaSekolah}
                      onChange={(e) => setRegNamaSekolah(e.target.value)}
                      placeholder="Contoh: UPT SD Negeri 1 Silaut"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-black placeholder:text-slate-400 font-bold"
                    />
                  </div>

                  {/* WhatsApp Guru Input (Wajib) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        5. Nomor WhatsApp Guru (Wajib Aktif) <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        Untuk Menerima Aktivasi dari Admin
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={regNomorWA}
                      onChange={(e) => setRegNomorWA(e.target.value)}
                      placeholder="Contoh: 081234567890 atau 0821xxxxxxxx"
                      className="w-full px-3 py-2 text-xs border border-emerald-400 rounded-lg focus:border-emerald-600 focus:outline-none bg-emerald-50/20 text-black placeholder:text-slate-400 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      *Setelah kode Anda diaktifkan oleh Admin, Admin akan menghubungi dan mengirimkan kode via WhatsApp ke nomor ini.
                    </span>
                  </div>

                  {/* 6. Fase & Pilihan Kelas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      6. Fase yang Diampu <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regFase}
                      onChange={(e) => {
                        const f = e.target.value as any;
                        setRegFase(f);
                        setRegKelas(f === 'Fase A' ? '1' : f === 'Fase B' ? '3' : '5');
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-black focus:border-blue-600 focus:outline-none font-bold"
                    >
                      <option value="Fase C">Fase C (SD Kelas 5 & 6)</option>
                      <option value="Fase B">Fase B (SD Kelas 3 & 4)</option>
                      <option value="Fase A">Fase A (SD Kelas 1 & 2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Pilihan Kelas Target
                    </label>
                    <select
                      value={regKelas}
                      onChange={(e) => setRegKelas(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-black focus:border-blue-600 focus:outline-none font-bold"
                    >
                      {regFase === 'Fase A' && (
                        <>
                          <option value="1">Kelas 1</option>
                          <option value="2">Kelas 2</option>
                        </>
                      )}
                      {regFase === 'Fase B' && (
                        <>
                          <option value="3">Kelas 3</option>
                          <option value="4">Kelas 4</option>
                        </>
                      )}
                      {regFase === 'Fase C' && (
                        <>
                          <option value="5">Kelas 5</option>
                          <option value="6">Kelas 6</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 7. Nama Kepala Sekolah */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      7. Nama Kepala Sekolah (beserta Gelar)
                    </label>
                    <input
                      type="text"
                      value={regNamaKS}
                      onChange={(e) => setRegNamaKS(e.target.value)}
                      placeholder="Contoh: Gusmardi, S.Pd."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-black placeholder:text-slate-400 font-bold"
                    />
                  </div>

                  {/* 8. NIP Kepala Sekolah */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      8. NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={regNipKS}
                      onChange={(e) => setRegNipKS(e.target.value)}
                      placeholder="Contoh: 19700305 199312 1 001 atau -"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-black placeholder:text-slate-400 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    ← Kembali ke Pintu Masuk
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {isSubmittingReg ? 'Mengajukan Permohonan...' : 'Ajukan Permohonan Kode Akses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
