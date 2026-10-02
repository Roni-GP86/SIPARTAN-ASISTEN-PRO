import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  GraduationCap,
  Award,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { StudentInfo, ExamSubmission } from '../types';
import {
  getStudentList,
  saveStudentList,
  addStudent,
  updateStudent,
  deleteStudent,
  resetToDefaultStudentList,
  parseCSVData,
  fetchStudentListFromFirestore,
  subscribeToStudentListFromFirestore,
} from '../services/studentService';
import { getAllExamSubmissions } from '../services/examService';
import { sounds } from '../utils/audioEffects';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle?: string;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  classNameTitle = 'Kelas VI (Enam) - SD Negeri Fatubai',
}) => {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentInfo | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<{ id: string; nama: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      const unsub = subscribeToStudentListFromFirestore((updatedList) => {
        setStudents(updatedList);
      });
      return () => unsub();
    }
  }, [isOpen]);

  const loadData = async () => {
    const list = getStudentList();
    setStudents(list);
    // Muat data murid dari cloud di background
    fetchStudentListFromFirestore().then((cloudList) => {
      if (cloudList && cloudList.length > 0) {
        setStudents(cloudList);
      }
    }).catch(() => {});
    try {
      const subs = await getAllExamSubmissions();
      setSubmissions(subs);
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    sounds.playSelect();
    if (editingStudent) {
      const updated = updateStudent(editingStudent.id, {
        nama: formNama.trim(),
        nisn: formNisn.trim() || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
      setStudents(updated);
      setEditingStudent(null);
      showToast(`Data murid ${formNama} berhasil diperbarui!`);
    } else {
      const updated = addStudent({
        nama: formNama.trim(),
        nisn: formNisn.trim() || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
      setStudents(updated);
      setShowAddForm(false);
      showToast(`Murid baru ${formNama} berhasil ditambahkan!`);
    }

    setFormNama('');
    setFormNisn('');
  };

  const handleDelete = (id: string, nama: string) => {
    setDeleteTargetStudent({ id, nama });
  };

  const confirmDeleteStudent = () => {
    if (!deleteTargetStudent) return;
    sounds.playDoubt();
    const updated = deleteStudent(deleteTargetStudent.id);
    setStudents(updated);
    showToast(`Murid ${deleteTargetStudent.nama} telah dihapus.`);
    setDeleteTargetStudent(null);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmResetStudents = () => {
    sounds.playSelect();
    const updated = resetToDefaultStudentList();
    setStudents(updated);
    showToast('Daftar murid berhasil direset ke standar kelas (12 Murid).');
    setShowResetConfirm(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCSVData(content);
        if (parsed.length > 0) {
          sounds.playSelect();
          const merged = [...students];
          parsed.forEach((p) => {
            if (!merged.some((m) => m.nisn === p.nisn && m.nama.toLowerCase() === p.nama.toLowerCase())) {
              merged.push(p);
            }
          });
          saveStudentList(merged);
          setStudents(merged);
          showToast(`Berhasil mengimpor ${parsed.length} data murid dari file CSV!`);
        } else {
          alert('Format file CSV tidak sesuai atau data kosong.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    sounds.playClick();
    const csvRows = ['NO,NIS,NISN,NAMA_SISWA'];
    students.forEach((s, idx) => {
      csvRows.push(`${idx + 1},"${s.nis || ''}","${s.nisn}","${s.nama}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daftar_Murid_${classNameTitle.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStudentStats = (nisn: string, nama: string) => {
    const studentSubs = submissions.filter(
      (s) => s.nisn === nisn || s.namaSiswa.toLowerCase() === nama.toLowerCase()
    );
    const count = studentSubs.length;
    const avgScore = count > 0 ? Math.round(studentSubs.reduce((acc, c) => acc + c.nilaiAkhir, 0) / count) : null;
    return { count, avgScore };
  };

  // Avatar colors
  const avatarColors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-sky-600',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0B1528] border-2 border-amber-500/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100 ring-4 ring-amber-500/20 my-auto animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#070e1c] via-[#0F2042] to-[#070e1c] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-2xl shadow-inner">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Manajemen Data Peserta Didik
                </span>
                <span className="text-xs text-slate-400 font-bold">• {students.length} Siswa Terdaftar</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Daftar Murid di Ruang Guru</span>
                <span className="text-sm font-semibold text-amber-400">({classNameTitle})</span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-3.5 bg-[#070e1c] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid berdasarkan Nama atau NISN..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B1528] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                sounds.playSelect();
                setEditingStudent(null);
                setFormNama('');
                setFormNisn('');
                setShowAddForm(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Murid</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Impor CSV</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handleReset}
              title="Reset ke murid bawaan SD Negeri Fatubai"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal / Inline Form for Add & Edit */}
        {(showAddForm || editingStudent) && (
          <form
            onSubmit={handleSaveStudent}
            className="p-4 bg-[#0E1C38] border-b border-amber-500/30 flex flex-wrap items-center gap-3 shrink-0 animate-in slide-in-from-top-2"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                Nama Lengkap Siswa *
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Maria Goreti Obe"
                className="w-full px-3 py-1.5 rounded-lg bg-[#070e1c] border border-slate-700 text-xs font-bold text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="w-48">
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                NISN (10 Digit)
              </label>
              <input
                type="text"
                value={formNisn}
                onChange={(e) => setFormNisn(e.target.value)}
                placeholder="Contoh: 0134589212"
                className="w-full px-3 py-1.5 rounded-lg bg-[#070e1c] border border-slate-700 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="flex items-end gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                {editingStudent ? 'Simpan Perubahan' : 'Tambahkan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStudent(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Student Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#081020]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="font-bold text-sm">Tidak ada nama murid yang cocok dengan pencarian.</p>
              <p className="text-xs text-slate-500">Ketik nama lain atau klik tombol "Tambah Murid".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredStudents.map((stu, index) => {
                const stats = getStudentStats(stu.nisn, stu.nama);
                const colorGradient = avatarColors[index % avatarColors.length];
                const initials = stu.nama
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={stu.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1E3A] to-[#0A162C] border-2 border-slate-700/60 hover:border-amber-500/60 shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top corner subtle sheen */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

                    <div className="flex items-start gap-3.5 mb-3">
                      {/* Avatar with initial */}
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorGradient} text-white font-black text-lg flex items-center justify-center shadow-md shrink-0 border border-white/20`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-amber-300 border border-slate-700">
                            Absen #{index + 1}
                          </span>
                        </div>
                        <h4 className="font-black text-white text-sm sm:text-base leading-snug group-hover:text-amber-300 transition-colors truncate mt-0.5">
                          {stu.nama}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          {stu.nis && stu.nisn && stu.nis !== stu.nisn ? (
                            <span>
                              NIS: <span className="text-slate-300 font-bold">{stu.nis}</span> • NISN: <span className="text-slate-300 font-bold">{stu.nisn}</span>
                            </span>
                          ) : stu.nis ? (
                            <span>
                              NIS: <span className="text-slate-300 font-bold">{stu.nis}</span>
                            </span>
                          ) : (
                            <span>
                              NISN: <span className="text-slate-300 font-bold">{stu.nisn}</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Progress / Exam Stats Pill */}
                    <div className="p-2.5 rounded-xl bg-[#070e1c] border border-slate-800/80 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Riwayat Ujian:</span>
                      </div>
                      <div className="font-extrabold text-slate-200">
                        {stats.count > 0 ? (
                          <span className="text-emerald-400 font-black">
                            {stats.count} Selesai • Rata-rata: {stats.avgScore}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Belum Mengikuti</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-medium text-slate-500">
                        SDN Fatubai
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setEditingStudent(stu);
                            setFormNama(stu.nama);
                            setFormNisn(stu.nisn);
                            setShowAddForm(false);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(stu.id, stu.nama)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 sm:p-4 bg-[#070e1c] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Data murid tersinkronisasi otomatis dengan <strong>Ruang Murid</strong> untuk pengerjaan CBT &amp; Ulangan Harian.
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs cursor-pointer transition-colors border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal: Hapus Murid */}
      {deleteTargetStudent && (
        <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#0B1528] rounded-2xl shadow-2xl border-2 border-rose-500/80 w-full max-w-md p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-scale-up text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Konfirmasi Hapus Murid</h4>
                <p className="text-xs text-slate-400">Tindakan ini menghapus murid dari daftar kelas</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs space-y-2 text-slate-200">
              <p className="font-medium">Apakah Anda yakin ingin menghapus data murid berikut?</p>
              <div className="font-bold text-amber-300 bg-[#070e1c] p-2.5 rounded-lg border border-slate-800">
                {deleteTargetStudent.nama}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Murid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Reset Murid Standar */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#0B1528] rounded-2xl shadow-2xl border-2 border-amber-500/80 w-full max-w-md p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-scale-up text-slate-100">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Konfirmasi Reset Daftar Murid</h4>
                <p className="text-xs text-slate-400">Kembalikan ke susunan standar kelas</p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs space-y-2 text-slate-200">
              <p className="font-medium">
                Kembalikan daftar ke data murid standar <strong>SD Negeri Fatubai (12 Murid)</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmResetStudents}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ya, Reset ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
