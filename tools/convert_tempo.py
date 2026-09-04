#!/usr/bin/env python3
"""
TEMPO re-skin — normalize every live page onto tempo.css.

The site was already ~85% "paper" aesthetic, but authored against 41 different
token vocabularies with drifted values. This script:

  1. links /tempo.css into <head>
  2. deletes page-level :root blocks (tempo.css supplies canonical + alias tokens)
  3. deletes duplicated Google Fonts @import and universal resets
  4. strips base-layer declarations from body{} (bg, color, font)
  5. remaps every drifted hex to the canonical palette

Archive/ is untouched.
"""
import re, glob, sys, os, json

# ---------------------------------------------------------------- palette map
# Order matters only in that all keys are exact 6-digit hexes, matched case-insensitively.
REMAP = {
    # --- paper / backgrounds -> --bg #F5F2EB
    'F5F4EC': 'F5F2EB', 'F4F3EE': 'F5F2EB', 'EDEAE3': 'F5F2EB', 'F5F3EE': 'F5F2EB',
    'FBF8F2': 'F5F2EB', 'F5F2EA': 'F5F2EB', 'D9D6CE': 'F5F2EB', 'F7F5EF': 'F5F2EB',

    # --- sunken card surfaces -> --card-2 #FAFAF5
    'FAF9F4': 'FAFAF5', 'ECEAE0': 'FAFAF5', 'DEDBD3': 'FAFAF5', 'FAF8F2': 'FAFAF5',

    # --- hairlines -> --border #ECEAE3
    'C8C5BB': 'ECEAE3', 'DBD7CB': 'ECEAE3', 'E4E1DA': 'ECEAE3', 'E9E7DE': 'ECEAE3',
    'E8E2D4': 'ECEAE3', 'E5E2D9': 'ECEAE3',
    # heavier rule -> --rule #D8D4CC
    'DAD7D0': 'D8D4CC', 'D6D2C8': 'D8D4CC',

    # --- muted text -> --fog #888888
    '6B6A62': '888888', '8A8781': '888888', '6B6862': '888888', '6B6776': '888888',
    '726E64': '888888', '8A8576': '888888', '9B9891': '888888', 'A8A49C': '888888',
    '9C968D': '888888', '706B7A': '888888', '847D96': '888888', 'B0A9BE': '888888',
    '9A9A95': '888888',

    # --- secondary ink -> --fg-2 #2A2A2A
    '3E3D36': '2A2A2A', '3D3935': '2A2A2A',

    # --- flame -> #FF4A23
    'B33113': 'FF4A23', 'E8432A': 'FF4A23', 'E8402E': 'FF4A23', 'E2001A': 'FF4A23',
    'D02800': 'FF4A23', 'E53935': 'FF4A23',

    # --- green used as TEXT on paper -> --lime-ink #5F7E1C  (never #CDF851)
    '8FA82A': '5F7E1C', '7E9E1F': '5F7E1C',

    # --- gold used as text -> --gold-ink #9A7B12
    'B58E10': '9A7B12', '8A6708': '9A7B12', 'E8B538': 'E8C547', 'E8B923': 'E8C547',
    'F5C542': 'E8C547',

    # --- teal used as text -> --teal-ink #2C8A88
    '5E8589': '2C8A88', '4FB8B0': '5BC0BE',

    # --- greens
    '1E8465': '1F9D55', '4CAF50': '1F9D55',

    # --- dark-era leftovers on light pages
    '0B0B0B': 'F5F2EB', '0A0A0A': 'F5F2EB', '181818': 'FFFFFF', '171717': 'FFFFFF',
    '1A1A1A': 'FFFFFF', '222222': 'FAFAF5',
    '3E3F41': 'CCCCCC',

    # --- blue one-off theme (jive-onboarding) -> canonical
    '00529F': '2C8A88', '3860BE': '5BC0BE', '00447F': '0F0E0E', '3F6A94': '2A2A2A',
    '7189A3': '888888', '9DACBD': 'CCCCCC',
}
# 3-digit shorthand seen in the wild
SHORT = {'FFF': 'FFFFFF', 'FFF': 'FFFFFF'}

HEX_RE = re.compile(r'#([0-9A-Fa-f]{6})\b')

def remap_hexes(text):
    n = [0]
    def sub(m):
        h = m.group(1).upper()
        if h in REMAP:
            n[0] += 1
            return '#' + REMAP[h]
        return m.group(0)
    return HEX_RE.sub(sub, text), n[0]

# ---------------------------------------------------------------- css surgery
ROOT_RE   = re.compile(r'(?:^|\n)\s*:root\s*\{[^{}]*\}', re.M)
IMPORT_RE = re.compile(r'\s*@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;', re.I)
RESET_RE  = re.compile(r'(?:^|\n)\s*\*\s*(?:,\s*\*::before\s*,\s*\*::after\s*)?\{[^{}]*box-sizing[^{}]*\}', re.M)
BODY_RE   = re.compile(r'(?:^|\n)(\s*)(html\s*,\s*body|body)\s*\{([^{}]*)\}', re.M)

# declarations tempo.css already owns on <body>
BODY_DROP = re.compile(
    r'\s*(?:background(?:-color)?|color|font-family|font-size|line-height'
    r'|-webkit-font-smoothing|-moz-osx-font-smoothing|min-height|margin|padding)\s*:[^;]*;?',
    re.I)

def clean_body(m):
    indent, sel, decls = m.group(1), m.group(2), m.group(3)
    kept = BODY_DROP.sub('', decls).strip().strip(';').strip()
    if not kept:
        return '\n'
    return f'\n{indent}{sel}{{{kept}}}'

def process_style(css):
    css = IMPORT_RE.sub('', css)
    css = ROOT_RE.sub('', css)
    css = RESET_RE.sub('', css)
    css = BODY_RE.sub(clean_body, css)
    css = re.sub(r'\n{3,}', '\n\n', css)
    return css

# ---------------------------------------------------------------- head inject
LINK = '<link rel="stylesheet" href="/tempo.css">'

def inject_link(html, depth):
    if '/tempo.css' in html:
        return html
    if '<head>' in html:
        return html.replace('<head>', '<head>\n' + LINK, 1)
    m = re.search(r'<meta[^>]*viewport[^>]*>', html, re.I)
    if m:
        return html[:m.end()] + '\n' + LINK + html[m.end():]
    return LINK + '\n' + html

# ---------------------------------------------------------------- main
def main():
    pages = sorted(p for p in glob.glob('**/*.html', recursive=True)
                   if not p.startswith('archive/'))
    report = []
    for p in pages:
        src = open(p, encoding='utf-8', errors='replace').read()
        out = src

        # 1. link the stylesheet
        out = inject_link(out, p.count('/'))

        # 2/3/4. clean each inline <style> block
        def style_sub(m):
            return m.group(1) + process_style(m.group(2)) + m.group(3)
        out = re.sub(r'(<style[^>]*>)(.*?)(</style>)', style_sub, out, flags=re.S)

        # drop <style> blocks that are now empty
        out = re.sub(r'<style[^>]*>\s*</style>\s*', '', out)

        # 5. palette remap over the whole document (covers style="" attrs too)
        out, nhex = remap_hexes(out)

        if out != src:
            open(p, 'w', encoding='utf-8').write(out)
        report.append({
            'page': p,
            'before': len(src), 'after': len(out),
            'hexes_remapped': nhex,
            'css_before': sum(len(x) for x in re.findall(r'<style[^>]*>(.*?)</style>', src, re.S)),
            'css_after': sum(len(x) for x in re.findall(r'<style[^>]*>(.*?)</style>', out, re.S)),
        })

    tot_b = sum(r['css_before'] for r in report)
    tot_a = sum(r['css_after'] for r in report)
    print(f"pages: {len(report)}")
    print(f"inline CSS: {tot_b:,} -> {tot_a:,} bytes  ({tot_b - tot_a:,} removed, "
          f"{100*(tot_b-tot_a)/max(tot_b,1):.0f}%)")
    print(f"hexes remapped: {sum(r['hexes_remapped'] for r in report):,}")
    json.dump(report, open('/home/claude/convert-report.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
