with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines) - 1, -1, -1):
    if lines[i].strip() == "</div>":
        lines.insert(i, "      </>\n")
        lines.insert(i+1, "      )}\n")
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
