import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Restore the original state by removing my first patch
# First, let's find the `PILIH RUANG APLIKASI:` block.

# My previous patch inserted:
# {portalMode === 'guru' && (
#           <div className="space-y-2">
#             <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">

start_str = """        {portalMode === 'guru' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">
          <span className="text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1">"""

if start_str in content:
    content = content.replace(start_str, """        <div className="flex items-center justify-between px-2 mb-1.5 mt-0.5">
          <span className="text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1">""")
    print("Reverted start string")

end_str_bad = """          {savedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs border border-amber-300">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    )}"""
end_str_good = """          {savedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs border border-amber-300">
              {savedCount}
            </span>
          )}
        </button>"""

if end_str_bad in content:
    content = content.replace(end_str_bad, end_str_good)
    print("Reverted end string")

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
