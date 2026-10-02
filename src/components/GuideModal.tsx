import React from 'react';
import { X, BookOpen, Layers, FileCheck } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Panduan Alur Kurikulum Merdeka</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs text-slate-600 leading-relaxed">
          {/* Header Description */}
          <div className="p-3 rounded bg-blue-50/70 border border-blue-100">
            <h4 className="font-bold text-blue-950 mb-0.5">
              Alur Perangkat Ajar Kurikulum Merdeka (BSKAP No. 046 Tahun 2025):
            </h4>
            <p className="text-[11px] text-slate-700">
              Aplikasi ini memandu guru dari hulu ke hilir secara otomatis, presisi, dan terstruktur sesuai standar Keputusan Kepala BSKAP No. 046 Tahun 2025:
            </p>
          </div>

          {/* 3 Main Stages */}
          <div className="grid md:grid-cols-3 gap-2.5">
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-1.5">1</div>
              <h5 className="font-bold text-slate-900 mb-0.5">Analisis CP ke TP</h5>
              <p className="text-[11px] text-slate-600">
                Teks CP diurai menjadi <strong>Kompetensi (KKO Taksonomi)</strong> dan <strong>Lingkup Materi Spesifik</strong>, lalu diformulasikan menjadi butir-butir TP yang terukur.
              </p>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-1.5">2</div>
              <h5 className="font-bold text-slate-900 mb-0.5">Penyusunan ATP</h5>
              <p className="text-[11px] text-slate-600">
                Disusun menjadi Alur Tujuan Pembelajaran dengan struktur baku <strong>8 Bagian (A sampai H)</strong> lengkap dengan estimasi JP dan materi pokok.
              </p>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1.5">3</div>
              <h5 className="font-bold text-slate-900 mb-0.5">Modul Ajar & LKPD</h5>
              <p className="text-[11px] text-slate-600">
                Ditransformasikan menjadi Modul Ajar lengkap dengan skenario sintaks model, LKPD siap cetak, dan rubrik asesmen autentik.
              </p>
            </div>
          </div>

          {/* Section ATP Breakdown A - H */}
          <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Struktur Standar Dokumen ATP (Bagian A - H):</span>
            </h4>
            <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">A.</span>
                <div>
                  <span className="font-semibold text-slate-800">Identitas: </span>
                  <span className="text-slate-500">Satuan Pendidikan, Guru, Mapel, Fase, Kelas, Tahun Pelajaran</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">B.</span>
                <div>
                  <span className="font-semibold text-slate-800">Elemen: </span>
                  <span className="text-slate-500">Elemen Capaian Pembelajaran mata pelajaran</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">C.</span>
                <div>
                  <span className="font-semibold text-slate-800">Capaian Pembelajaran (CP): </span>
                  <span className="text-slate-500">Teks lengkap deskripsi CP fase/elemen</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">D.</span>
                <div>
                  <span className="font-semibold text-slate-800">Alur Tujuan Pembelajaran (ATP): </span>
                  <span className="text-slate-500">Tabel urutan TP, alokasi JP, semester & Indikator Ketercapaian</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">E.</span>
                <div>
                  <span className="font-semibold text-slate-800">Materi Pokok & Sub-Materi: </span>
                  <span className="text-slate-500">Struktur Bab / Unit pembelajaran</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">F.</span>
                <div>
                  <span className="font-semibold text-slate-800">Dimensi Profil Lulusan (8 DPL): </span>
                  <span className="text-slate-500">Pengembangan 8 Dimensi Profil Lulusan</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">G.</span>
                <div>
                  <span className="font-semibold text-slate-800">Glosarium: </span>
                  <span className="text-slate-500">Kamus istilah penting materi pembelajaran</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-blue-600">H.</span>
                <div>
                  <span className="font-semibold text-slate-800">Daftar Pustaka: </span>
                  <span className="text-slate-500">Buku siswa, buku guru, referensi resmi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Guarantee */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded border border-emerald-200">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h5 className="font-bold text-emerald-900 text-xs">Siap Cetak & Ekspor ke Word (.doc)</h5>
                <p className="text-[11px] text-emerald-700">
                  Setiap dokumen dapat langsung dicetak dengan format kop resmi atau diunduh ke Microsoft Word.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-2xs transition-colors shrink-0"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
