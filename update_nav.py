"""
TEMPO Nav Update Script — March 2026
Updates nav across ALL non-archive HTML pages.

Nav structure:
  Home | Orbit | Visibility | Insights | Library

Library dropdown sections:
  Reference: Handoff Map, Airtable Grid, Atlantic UK
  Meetings: Goal Briefs + Notes
  Tools: Release View, Meeting Flow, Pipeline, Template
  Artists: Isaia Huron, Room Full of Mirrors
  Archive: Archive Index + key items
"""

import os, re, glob

def make_nav(active_page, prefix=""):
    def tab(href, label, key):
        if active_page == key:
            return f'<span class="active-label">{label}</span>'
        return f'<a href="{prefix}{href}">{label}</a>'

    home = tab("index.html", "Home", "home")
    orbit = tab("orbit.html", "Orbit", "orbit")
    vis = tab("visibility.html", "Visibility", "visibility")
    ins = tab("insights/index.html", "Insights", "insights")

    lib_active = active_page.startswith("library")
    lib_cls = ' class="sndd-b active"' if lib_active else ' class="sndd-b"'
    p = prefix

    library = (
        f'<div class="sndd"><span{lib_cls}>Library &#9662;</span><div class="sndd-m">'
        f'<div class="sep-label">Reference</div>'
        f'<a href="{p}reference/handoff-map.html">Handoff Map</a>'
        f'<a href="{p}reference/airtable-grid.html">Airtable Grid</a>'
        f'<a href="{p}reference/atlantic-uk.html">Atlantic UK System</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Meetings</div>'
        f'<a href="{p}meetings/goal-brief-2026-03-18.html">Goal Brief &mdash; 3/18</a>'
        f'<a href="{p}meetings/notes-2026-03-16.html">Meeting Notes &mdash; 3/16</a>'
        f'<a href="{p}meetings/goal-brief-2026-03-11.html">Goal Brief &mdash; 3/11</a>'
        f'<a href="{p}meetings/notes-2026-03-04.html">Meeting Notes &mdash; 3/4</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Tools</div>'
        f'<a href="{p}release.html">Release View</a>'
        f'<a href="{p}meetings.html">Meeting Flow</a>'
        f'<a href="{p}pipeline.html">Pipeline</a>'
        f'<a href="{p}template.html">Template</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Artists</div>'
        f'<a href="{p}artists/isaia-huron.html">Isaia Huron</a>'
        f'<a href="{p}artists/room-full-of-mirrors.html">Room Full of Mirrors</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Archive</div>'
        f'<a href="{p}archive/index.html">Archive Index</a>'
        f'<a href="{p}archive/pilot.html">Pilot Overview</a>'
        f'<a href="{p}archive/demos/isaia-huron.html">Pilot MVP &mdash; Isaia</a>'
        f'<a href="{p}archive/demo.html">Artist Visibility (v1)</a>'
        f'<a href="{p}archive/cadence.html">Cadence</a>'
        f'<a href="{p}archive/rollout.html">Rollout</a>'
        f'<a href="{p}archive/comms.html">Comms</a>'
        f'<a href="{p}archive/pipeline.html">Pipeline (v1)</a>'
        f'<a href="{p}archive/prep-isaia.html">Prep Package &mdash; Isaia</a>'
        f'</div></div>'
    )

    return (
        f'<nav>\n'
        f'<a href="{p}index.html" class="logo">'
        f'<img src="{p}tempoicon.png" alt="TEMPO" style="height:26px;width:26px;margin-right:8px;border-radius:4px;">'
        f'<span class="l1">RCA</span><span class="l2">&middot;</span><span class="l3">TEMPO</span></a>\n'
        f'<div class="nav-links">\n'
        f'{home}\n{orbit}\n{vis}\n{ins}\n{library}\n'
        f'</div>\n</nav>'
    )


ROOT_PAGES = {
    "index.html": "home",
    "orbit.html": "orbit",
    "visibility.html": "visibility",
    "release.html": "library-tools",
    "meetings.html": "library-tools",
    "pipeline.html": "library-tools",
    "template.html": "library-tools",
}

SUBFOLDER_MAP = {
    "meetings/": ("library-meetings", "../"),
    "artists/": ("library-artists", "../"),
    "reference/": ("library-reference", "../"),
    "insights/": ("insights", "../"),
}


def update_file(filepath, active_page, prefix):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_nav = make_nav(active_page, prefix)

    if '<nav>' in content and '</nav>' in content:
        content = re.sub(r'<nav>.*?</nav>', new_nav, content, count=1, flags=re.DOTALL)
    elif '<nav ' in content:
        content = re.sub(r'<nav [^>]*>.*?</nav>', new_nav, content, count=1, flags=re.DOTALL)
    else:
        content = content.replace('<body>', f'<body>\n{new_nav}', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  OK  {filepath}")


def main():
    print("TEMPO Nav Update — March 2026")
    print("=" * 50)
    count = 0

    for filename, active in ROOT_PAGES.items():
        if os.path.exists(filename):
            update_file(filename, active, "")
            count += 1

    for folder, (active, prefix) in SUBFOLDER_MAP.items():
        if os.path.exists(folder):
            for filepath in sorted(glob.glob(f"{folder}*.html")):
                update_file(filepath, active, prefix)
                count += 1

    print(f"\nUpdated {count} files.")
    print("Nav: Home | Orbit | Visibility | Insights | Library")


if __name__ == "__main__":
    main()
