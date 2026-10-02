import os
import re

with open('src/utils/exportUtils.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix context where `id` is used instead of `identitas`
# E.g., `lockWordData(identitas.peranGuru` but it should be `id` if the function is passing `id`.

# Let's find all occurrences of `identitas.peranGuru`
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'identitas.peranGuru' in line:
        # Check if the surrounding lines use `id.`
        if 'id.' in line or 'id.' in lines[i-1] or 'id.' in lines[i+1]:
            lines[i] = lines[i].replace('identitas.peranGuru', 'id.peranGuru')

# The errors were at 433, 919, 1219 where it used `id.peranGuru` but should be `identitas.peranGuru`
# Because I globally replaced `id.peranGuru` with `identitas.peranGuru`, let's just make sure 433, 919, 1219 use `identitas.peranGuru`.
# Wait, if they ALREADY have `identitas.peranGuru` because of the sed, then the compiler shouldn't fail.
# Ah, the compiler failed BEFORE the `sed`!
# So the `sed` I ran actually FIXED 433, 919, 1219 by making them `identitas.peranGuru`, BUT it broke the ones that ACTUALLY use `id`.

content = '\n'.join(lines)
with open('src/utils/exportUtils.ts', 'w', encoding='utf-8') as f:
    f.write(content)
