import re

def update_modul_view():
    with open('src/components/ModulAjarView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    target = """<p className="text-justify break-words"><strong className="text-slate-900">Lingkungan Belajar:</strong> {(modul.saranaPrasarana?.lingkunganBelajar || []).join(', ') || '-'}</p>
              </div>"""

    replacement = """<p className="text-justify break-words"><strong className="text-slate-900">Lingkungan Belajar:</strong> {(modul.saranaPrasarana?.lingkunganBelajar || []).join(', ') || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Pemanfaatan Teknologi Digital:</h4>
                <p className="text-justify break-words"><strong className="text-slate-900">Platform/Aplikasi:</strong> {((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.platformAplikasi || []).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Perangkat Digital:</strong> {((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.perangkatDigital || []).join(', ') || '-'}</p>
                <p className="text-justify break-words"><strong className="text-slate-900">Media Digital:</strong> {((modul as any).desainPembelajaranRPM?.pemanfaatanTeknologi?.mediaDigital || []).join(', ') || '-'}</p>
              </div>"""

    if target in content:
        content = content.replace(target, replacement)
    else:
        print("Target not found in ModulAjarView.tsx")

    with open('src/components/ModulAjarView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_modul_view()
