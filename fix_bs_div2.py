with open('src/components/BankSoalView.tsx', 'r') as f:
    content = f.read()

bad_end = """          )}
        </div>
      )}

      {/* 4. KUNCI JAWABAN & PEDOMAN PENSKORAN */}"""

good_end = """          )}
        </div>
        </div>
      )}

      {/* 4. KUNCI JAWABAN & PEDOMAN PENSKORAN */}"""

content = content.replace(bad_end, good_end)

with open('src/components/BankSoalView.tsx', 'w') as f:
    f.write(content)
