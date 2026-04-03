"""
TEMPO Nav Update — April 2026
Updates nav across ALL non-archive HTML pages.

Nav structure:
  The Mission | The Cycle | Accountability | Pipeline v | Reference v

Pipeline dropdown: Lane Definition, Value vs. Complexity
Reference dropdown: Frameworks, Meetings, Tools, Artists, Archive
"""

import os, re, glob

def make_nav(active_page, prefix=""):
    def tab(href, label, key):
        if active_page == key:
            return f'<span class="active-label">{label}</span>'
        return f'<a href="{prefix}{href}">{label}</a>'

    home = tab("index.html", "The Mission", "home")
    orbit = tab("orbit.html", "The Cycle", "orbit")
    acct = tab("timeline.html", "Accountability", "accountability")

    p = prefix

    pipe_active = active_page.startswith("pipeline")
    pipe_cls = ' class="sndd-b active"' if pipe_active else ' class="sndd-b"'
    pipeline = (
        f'<div class="sndd"><span{pipe_cls}>Pipeline &#9662;</span><div class="sndd-m">'
        f'<a href="{p}lanes.html" style="color:#CDF851;">Lane Definition</a>'
        f'<a href="{p}vcf.html">Value vs. Complexity</a>'
        f'</div></div>'
    )

    ref_active = active_page.startswith("library")
    ref_cls = ' class="sndd-b active"' if ref_active else ' class="sndd-b"'
    reference = (
        f'<div class="sndd"><span{ref_cls}>Reference &#9662;</span><div class="sndd-m">'
        f'<div class="sep-label">Frameworks</div>'
        f'<a href="{p}reference/framework-reference.html">Framework Reference</a>'
        f'<a href="{p}reference/operational-plan.html">How It Runs</a>'
        f'<a href="{p}reference/active-projects-template.html">Active Projects Template</a>'
        f'<a href="{p}reference/handoff-map.html">Handoff Map</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Meetings</div>'
        f'<a href="{p}meetings/goal-brief-2026-03-18.html">Goal Brief &mdash; 3/18</a>'
        f'<a href="{p}meetings/notes-2026-03-16.html">Meeting Notes &mdash; 3/16</a>'
        f'<a href="{p}meetings/goal-brief-2026-03-11.html">Goal Brief &mdash; 3/11</a>'
        f'<a href="{p}meetings/notes-2026-03-04.html">Meeting Notes &mdash; 3/4</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Tools</div>'
        f'<a href="{p}release.html">Release View</a>'
        f'<a href="{p}visibility.html">Visibility (Roster)</a>'
        f'<a href="{p}meetings.html">Meeting Flow</a>'
        f'<a href="{p}insights/index.html">Insights</a>'
        f'<a href="{p}reference/airtable-grid.html">Airtable Grid</a>'
        f'<a href="{p}reference/atlantic-uk.html">Atlantic UK System</a>'
        f'<div class="sep"></div>'
        f'<div class="sep-label">Artists</div>'
        f'<a href="{p}artists/isaia-huron.html">Isaia Huron</a>'
        f'<a href="{p}artists/pixy.html">PIXY</a>'
        f'<a href="{p}artists/room-full-of-mirrors.html">Room Full of Mirrors</a>'
        f'<div class="sep"></div>'
        f'<a href="{p}archive/index.html" style="color:#3E3F41;font-size:10px;">Archive</a>'
        f'</div></div>'
    )

    return (
        f'<nav>\n'
        f'<a href="{p}index.html" class="logo">'
        f'<img src="{p}tempoicon.png" alt="TEMPO" style="height:26px;width:26px;margin-right:8px;border-radius:4px;">'
        f'<span class="l1">RCA</span><span class="l2">&middot;</span><span class="l3">CAMPAIGN OPS</span></a>\n'
        f'<div class="nav-links">\n'
        f'{home}\n{orbit}\n{acct}\n{pipeline}\n{reference}\n'
        f'</div>\n</nav>'
    )


ROOT_PAGES = {
    "index.html": "home",
    "orbit.html": "orbit",
    "timeline.html": "accountability",
    "lanes.html": "pipeline-lanes",
    "vcf.html": "pipeline-vcf",
    "release.html": "library-tools",
    "visibility.html": "library-tools",
    "meetings.html": "library-tools",
}

SUBFOLDER_MAP = {
    "meetings/": ("library-meetings", "../"),
    "artists/": ("library-artists", "../"),
    "reference/": ("library-reference", "../"),
    "insights/": ("library-insights", "../"),
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
    print("TEMPO Nav Update — April 2026")
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
    print("Nav: The Mission | The Cycle | Accountability | Pipeline | Reference")


if __name__ == "__main__":
    main()
