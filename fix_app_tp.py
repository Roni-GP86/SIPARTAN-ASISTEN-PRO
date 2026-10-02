import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_tp = """        daftarTP: docToPublish.konfigurasi.selectedTPCodes.map((kode) => {
          const tpObj = tpList.find(t => t.kodeTP === kode);
          return {
            kodeTP: kode,
            rumusanTP: tpObj?.rumusanTP || '',
            lingkupMateri: tpObj?.lingkupMateri || '',
            elemen: tpObj?.elemen || 'Semua Elemen'
          };
        }),"""

new_tp = """        daftarTP: Array.from(new Set(docToPublish.tabelKisiKisi.map(k => k.kodeTP))).map(kode => {
          const row = docToPublish.tabelKisiKisi.find(k => k.kodeTP === kode);
          return {
            kodeTP: kode,
            rumusanTP: row?.tujuanPembelajaran || '',
            lingkupMateri: row?.lingkupMateri || '',
            elemen: row?.elemen || 'Semua Elemen'
          };
        }),"""

content = content.replace(old_tp, new_tp)

with open('src/App.tsx', 'w') as f:
    f.write(content)
