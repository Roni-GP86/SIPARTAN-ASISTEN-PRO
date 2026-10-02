import re

def fix_canvas_view():
    with open('src/components/RPMCanvasView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find CANVA PEDAGOGICAL MATRIX
    start_str = """        <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-indigo-300 shadow-md space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-indigo-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[10px] tracking-wider uppercase">
                  CANVA PEDAGOGICAL MATRIX"""

    if start_str not in content:
        print("Start string not found")
        return

    start_idx = content.find(start_str)

    end_str = """          </div>
        </div>

        {/* 7. KANVAS LANGKAH PEMBELAJARAN & ASESMEN (MATRIX BAWAH) */}"""
    
    end_idx = content.find(end_str, start_idx)

    if end_idx == -1:
        print("End string not found")
        return

    content = content[:start_idx] + """        {/* 6. KANVAS LANGKAH PEMBELAJARAN & ASESMEN (MATRIX BAWAH) */}""" + content[end_idx + len(end_str):]

    # In Kegiatan Inti, we want to highlight Prinsip & Pengalaman Belajar
    # Let's find the Kegiatan Inti table rows
    target_table = """                  {/* Sintaks Kegiatan Inti */}
                  {(lpData.kegiatanInti.sintaks || []).map((s, idx) => {
                    const badge = s.prinsipPembelajaran ? getPrinsipBadgeInfo(s.prinsipPembelajaran) : null;
                    return (
                      <tr key={idx} className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">
                          <span className="text-blue-600 block text-[10px] uppercase tracking-wider mb-0.5">
                            Tahap {s.tahapKe}
                          </span>
                          {s.faseSintaks}
                        </td>
                        <td className="p-2.5 text-slate-700 border-r border-slate-200">
                          <div className="space-y-2 text-xs leading-relaxed">
                            <p>{s.aktivitas}</p>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700 border-r border-slate-200">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-sky-100 text-sky-800 font-semibold text-[11px] rounded-lg border border-sky-200">
                            ✨ {s.pengalamanBelajar || 'Bermakna'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {badge && (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${badge.bg} ${badge.text} font-semibold text-[11px] rounded-lg border ${badge.border}`}>
                              {badge.icon} {s.prinsipPembelajaran}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}"""

    replacement_table = """                  {/* Sintaks Kegiatan Inti */}
                  {(lpData.kegiatanInti.sintaks || []).map((s, idx) => {
                    const badge = s.prinsipPembelajaran ? getPrinsipBadgeInfo(s.prinsipPembelajaran) : null;
                    return (
                      <tr key={idx} className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">
                          <span className="text-blue-600 block text-[10px] uppercase tracking-wider mb-0.5">
                            Tahap {s.tahapKe}
                          </span>
                          {s.faseSintaks}
                        </td>
                        <td className="p-2.5 text-slate-700 border-r border-slate-200">
                          <div className="space-y-2 text-xs leading-relaxed">
                            <p>{s.aktivitas}</p>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700 border-r border-slate-200">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-sky-100 text-sky-800 font-semibold text-[11px] rounded-lg border border-sky-200">
                            ✨ {s.pengalamanBelajar || 'Bermakna'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {badge && (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${badge.bg} ${badge.text} font-semibold text-[11px] rounded-lg border ${badge.border}`}>
                              {badge.icon} {s.prinsipPembelajaran}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}"""

    if target_table in content:
        pass
    else:
        print("Table target not found")

    with open('src/components/RPMCanvasView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_canvas_view()
