import re

def fix_canvas_view():
    with open('src/components/RPMCanvasView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # The pedagogical matrix block starts with this exact string:
    start_str = """        {/* 4. THE MASTER CENTERPIECE: KANVAS PRINSIP PEMBELAJARAN & PENGALAMAN BELAJAR (CANVA MATRIX) */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border-2 border-indigo-300 shadow-md space-y-5 relative overflow-hidden">"""

    if start_str not in content:
        print("Start string not found")
        return

    start_idx = content.find(start_str)

    # It ends right before "5. KANVAS ALUR LANGKAH PEMBELAJARAN"
    end_str = """        {/* 5. KANVAS ALUR LANGKAH PEMBELAJARAN (VISUAL SINTAKS TIMELINE) */}"""
    end_idx = content.find(end_str, start_idx)

    if end_idx == -1:
        print("End string not found")
        return

    # Delete the pedagogical matrix entirely
    content = content[:start_idx] + content[end_idx:]

    # Now, find the Sintaks Kegiatan Inti table inside Section 5/6 and ensure it renders badge
    target_sintaks = """                  {/* Sintaks Steps Cards */}
              <div className="space-y-2.5 pl-2 sm:pl-8">
                {(lpData.kegiatanInti.sintaks || []).map((s, idx) => {
                  const badge = s.prinsipPembelajaran ? getPrinsipBadgeInfo(s.prinsipPembelajaran) : null;
                  return (
                    <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                          <span className="text-blue-600 uppercase tracking-wider block sm:inline">Tahap {s.tahapKe}:</span> {s.faseSintaks}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[10px]">
                            ✨ {s.pengalamanBelajar || 'Bermakna'}
                          </span>
                          {badge && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${badge.bg} ${badge.text} font-bold text-[10px] rounded border ${badge.border}`}>
                              {badge.icon} {s.prinsipPembelajaran}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed text-justify">
                        <p>{s.aktivitas}</p>
                      </div>
                    </div>
                  );
                })}
              </div>"""

    # It seems the Sintaks Cards are already rendering Pengalaman and Prinsip with badges! Let me verify if they do.
    # Ah! In my `grep -n "activeTab ==="`, nothing was found. So it wasn't a tab.
    # Wait, the user said: "POIN D KANVAS PRINSIP..... TIDAK PERLU ADA, MAKSUD SAYA PRINSIP DAN PENGALAMAN YANG TERDAPAT DALAM SETIAP SINTAK ITU YANG DIBERI BERWARNA DAN ICON, SEBAB SAAT DOWNLOAD PDF, ITU TIDAK TERLIHAT, DAN BAGIAN ITU WAJIB TULIS TERPISAH DISETIAP SINTAK SEBAGAIMANA CONTOH MODUL YANG SAYA KIRIMKAN!"

    # Ah!!! They want the "Prinsip dan Pengalaman" in the *PDF* to be properly visible and separate in each sintaks!
    # Because when they downloaded the PDF before, they couldn't see the colored badges and icons from the Canvas in the PDF, so they want them explicitly written out in the PDF sintaks steps!
    # And they don't want the big "Prinsip" section in the Canvas either (or in the PDF).

    # Let's save the file back
    with open('src/components/RPMCanvasView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_canvas_view()
