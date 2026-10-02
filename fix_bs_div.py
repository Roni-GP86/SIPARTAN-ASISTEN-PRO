with open('src/components/BankSoalView.tsx', 'r') as f:
    content = f.read()

bad_str = """          </div>
        </div>
        </div>
      )}

      {/* 2. MATRIKS KISI-KISI SOAL (Format Resmi 9 Kolom) */}"""

good_str = """          </div>
        </div>
      )}

      {/* 2. MATRIKS KISI-KISI SOAL (Format Resmi 9 Kolom) */}"""

content = content.replace(bad_str, good_str)

with open('src/components/BankSoalView.tsx', 'w') as f:
    f.write(content)
