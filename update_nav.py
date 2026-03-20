"""
TEMPO Nav Update Script
Run from the operations/ directory (the repo root).
Updates nav on all active HTML pages to the new 4-tab structure:
  Home | Orbit | Visibility | Library ▾ (dropdown)

Usage:
  python update_nav.py
"""

import os, re, glob

# New nav HTML generator
def make_nav(active_page, prefix=""):
    """Generate nav HTML. active_page = 'home'|'orbit'|'visibility'|'library-*' """
    
    def tab(href, label, is_active):
        if is_active:
            return f'<span class="active-label">{label}</span>'
        return f'<a href="{prefix}{href}">{label}</a>'
    
    home = tab("index.html", "Home", active_page == "home")
    orbit = tab("orbit.html", "Orbit", active_page == "orbit")
    vis = tab("visibility.html", "Visibility", active_page == "visibility")
    
    # Library dropdown — active if current page is inside it
    lib_active = active_page.startswith("library")
    lib_class = ' class="sndd-b active"' if lib_active else ' class="sndd-b"'
    
    library = f'''<div class="sndd"><span{lib_class}>Library &#9662;</span><div class="sndd-m">\
<a href="{prefix}release.html">Release View</a>\
<a href="{prefix}meetings.html">Meeting Flow</a>\
<a href="{prefix}pipeline.html">Pipeline</a>\
<a href="{prefix}template.html">Template</a>\
<a href="{prefix}artists/isaia-huron.html">Artist &mdash; Isaia Huron</a>\
<a href="{prefix}archive/pilot.html">Archive &mdash; Pilot Overview</a>\
<a href="{prefix}archive/cadence.html">Archive &mdash; Cadence</a>\
<a href="{prefix}archive/rollout.html">Archive &mdash; Rollout</a>\
<a href="{prefix}archive/comms.html">Archive &mdash; Comms</a>\
</div></div>'''

    return f'''<nav>
<a href="{prefix}index.html" class="logo"><span class="l1">RCA</span><span class="l2">&middot;</span><span class="l3">TEMPO</span></a>
<div class="nav-links">
{home}
{orbit}
{vis}
{library}
</div>
</nav>'''

# Nav CSS (same across all pages)
NAV_CSS = """/* TEMPO NAV */
  nav { background:#0F0E0E; border-bottom:1px solid #2A2A2A; padding:0 32px; display:flex; align-items:center; height:44px; position:sticky; top:0; z-index:100; }
  .logo { text-decoration:none; margin-right:24px; display:flex; align-items:center; gap:6px; }
  .l1 { font-size:12px; font-weight:900; letter-spacing:0.18em; text-transform:uppercase; color:#CDF851; }
  .l2 { font-size:11px; color:#3E3F41; }
  .l3 { font-size:11px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:#3E3F41; }
  .nav-links { display:flex; align-items:center; gap:2px; }
  .nav-links a { font-size:11px; font-weight:500; padding:6px 10px; color:#B0A9BE; text-decoration:none; border-bottom:2px solid transparent; }
  .nav-links a:hover { color:#FCFDF8; }
  .active-label { font-size:11px; font-weight:700; padding:6px 10px; color:#CDF851; border-bottom:2px solid #CDF851; }
  .sndd { position:relative; display:inline-block; }
  .sndd-b { font-size:11px; font-weight:500; padding:6px 10px; cursor:pointer; display:inline-block; user-select:none; color:#B0A9BE; border-bottom:2px solid transparent; }
  .sndd-b:hover { color:#FCFDF8; }
  .sndd-b.active { font-weight:700; color:#CDF851; border-bottom:2px solid #CDF851; }
  .sndd-m { display:none; position:absolute; top:100%; left:0; background:#0F0E0E; border:1px solid #2A2A2A; min-width:220px; z-index:10001; padding:4px 0; margin-top:1px; }
  .sndd:hover .sndd-m { display:block; }
  .sndd-m a { display:block; padding:8px 16px; font-size:11px; font-weight:500; color:#B0A9BE; text-decoration:none; }
  .sndd-m a:hover { background:#2A2A2A; color:#FCFDF8; }"""

# Map filenames to their active page identifier
PAGE_MAP = {
    "index.html": ("home", ""),
    "orbit.html": ("orbit", ""),  # skip — already built
    "visibility.html": ("visibility", ""),
    "release.html": ("library-release", ""),
    "meetings.html": ("library-meetings", ""),
    "pipeline.html": ("library-pipeline", ""),
    "template.html": ("library-template", ""),
}

# Subfolder pages
SUBFOLDER_MAP = {
    "meetings/": ("library-meetings", "../"),
    "artists/": ("library-artists", "../"),
    "archive/": ("library-archive", "../"),
    "demos/": ("library-archive", "../"),
}

def update_file(filepath, active_page, prefix):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace nav HTML (between <nav> and </nav>)
    new_nav = make_nav(active_page, prefix)
    content = re.sub(r'<nav>.*?</nav>', new_nav, content, count=1, flags=re.DOTALL)
    
    # Replace or inject nav CSS
    # Try to replace existing nav CSS block
    if '/* TEMPO NAV */' in content:
        content = re.sub(r'/\* TEMPO NAV \*/.*?\.sndd-m a:hover \{[^}]+\}', NAV_CSS, content, flags=re.DOTALL)
    elif '/* SITE NAV' in content:
        content = re.sub(r'/\* SITE NAV.*?\.sndd-m a:hover \{[^}]+\}', NAV_CSS, content, flags=re.DOTALL)
    else:
        # Inject after first <style> tag
        content = content.replace('<style>', f'<style>\n{NAV_CSS}', 1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  Updated: {filepath}")

def main():
    print("TEMPO Nav Update")
    print("=" * 40)
    
    # Root-level pages
    for filename, (active, prefix) in PAGE_MAP.items():
        if filename == "orbit.html":
            continue  # orbit.html is already built with correct nav
        if os.path.exists(filename):
            update_file(filename, active, prefix)
        else:
            print(f"  Skipped (not found): {filename}")
    
    # Subfolder pages
    for folder, (active, prefix) in SUBFOLDER_MAP.items():
        if os.path.exists(folder):
            for filepath in glob.glob(f"{folder}*.html"):
                update_file(filepath, active, prefix)
    
    print()
    print("Done! Verify in browser, then commit + push via GitHub Desktop.")
    print()
    print("New nav structure:")
    print("  Home | Orbit | Visibility | Library ▾")
    print("  Library contains: Release View, Meeting Flow, Pipeline,")
    print("  Template, Artists, Archive items")

if __name__ == "__main__":
    main()
