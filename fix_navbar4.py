import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

start_marker = """        <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">"""
end_marker = """      </nav>"""

if start_marker in content and end_marker in content:
    # Use split instead of rsplit to get the first nav end
    # Actually wait, there is only one `</nav>`.
    
    parts = content.split(start_marker, 1)
    pre = parts[0]
    rest = start_marker + parts[1]
    
    parts2 = rest.rsplit(end_marker, 1)
    wrapped_content = parts2[0]
    post = end_marker + parts2[1]
    
    # Check if we already have the wrapper inside wrapped_content
    # (my previous scripts might have mangled it)
    
    final_content = pre + "{portalMode === 'guru' && (<div className=\"space-y-2\">\n" + wrapped_content + "</div>)}\n" + post
    
    with open('src/components/Navbar.tsx', 'w') as f:
        f.write(final_content)
    print("Wrapped guru tabs successfully")
else:
    print("Markers not found")
