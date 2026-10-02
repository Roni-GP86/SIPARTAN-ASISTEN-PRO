import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# I need to wrap from `<div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">` 
# until right before `</nav>`

start_marker = """        <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">
          <span className="text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1">"""

end_marker = """        </nav>"""

if start_marker in content and end_marker in content:
    parts = content.split(start_marker)
    pre = parts[0]
    rest = start_marker + parts[1]
    
    parts2 = rest.split(end_marker)
    wrapped_content = parts2[0]
    post = end_marker + (end_marker.join(parts2[1:]) if len(parts2) > 1 else "")
    
    final_content = pre + "{portalMode === 'guru' && (<div className=\"space-y-2\">\n" + wrapped_content + "</div>)}\n" + post
    
    with open('src/components/Navbar.tsx', 'w') as f:
        f.write(final_content)
    print("Wrapped guru tabs successfully")
else:
    print("Markers not found")
