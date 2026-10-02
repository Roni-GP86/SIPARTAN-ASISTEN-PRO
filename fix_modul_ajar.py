import os
import re

def update_modul_ajar():
    with open('src/components/ModulAjarView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace the content inside `<div className="p-3.5 space-y-3.5 text-[12pt]">` to `</div>`
    # Let's use regex or just string replacement to replace the whole `pertemuan` block.
    
    target_start = """                    <div className="p-3.5 space-y-3.5 text-[12pt]">"""
    target_end = """                    </div>
                  </div>
                ))}
              </div>
            </section>"""
            
    # Need to be very careful. Let's find the exact block.
    start_idx = content.find(target_start)
    if start_idx == -1:
        print("Could not find target_start")
        return
        
    end_idx = content.find(target_end, start_idx)
    if end_idx == -1:
        print("Could not find target_end")
        return
        
    new_block = """                    <div className="p-0 border-t border-slate-300">
                      <table className="w-full text-left text-[11pt] sm:text-[12pt] border-collapse table-fixed">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-300">
                            <th className="p-2.5 w-[25%] border-r border-slate-300 text-center">Tahap Kegiatan</th>
                            <th className="p-2.5 w-[37.5%] border-r border-slate-300 text-center">Aktivitas Guru</th>
                            <th className="p-2.5 w-[37.5%] text-center">Aktivitas Murid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {/* Pendahuluan */}
                          <tr className="align-top">
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                              1. Pendahuluan
                            </td>
                            <td colSpan={2} className="p-2.5 text-slate-800">
                              <ul className="list-decimal list-outside ml-5 space-y-1 text-slate-800 leading-[1.5]">
                                {(pertemuan.pendahuluan || []).map((p, idx) => (
                                  <li key={idx} className="text-justify break-words pl-1">{p}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                          
                          {/* Kegiatan Inti */}
                          {(pertemuan.kegiatanInti || []).map((k, idx) => (
                            <tr key={`inti-${idx}`} className="align-top">
                              <td className="p-2.5 border-r border-slate-300">
                                {idx === 0 && (
                                  <div className="font-bold text-slate-900 mb-1">2. Kegiatan Inti</div>
                                )}
                                <div className="font-semibold text-slate-800 bg-slate-50 p-1.5 border border-slate-200 rounded mt-1 text-center">
                                  Fase: {k.faseSintaks}
                                </div>
                              </td>
                              <td className="p-2.5 text-slate-800 border-r border-slate-300 leading-[1.5] text-justify break-words">
                                {k.aktivitasGuru}
                              </td>
                              <td className="p-2.5 text-slate-800 leading-[1.5] text-justify break-words">
                                {k.aktivitasSiswa}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Penutup */}
                          <tr className="align-top">
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-300">
                              3. Penutup
                            </td>
                            <td colSpan={2} className="p-2.5 text-slate-800">
                              <ul className="list-decimal list-outside ml-5 space-y-1 text-slate-800 leading-[1.5]">
                                {(pertemuan.penutup || []).map((pn, idx) => (
                                  <li key={idx} className="text-justify break-words pl-1">{pn}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        </tbody>
                      </table>
"""
    
    content = content[:start_idx] + new_block + content[end_idx:]
    
    with open('src/components/ModulAjarView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_modul_ajar()
