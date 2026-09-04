#!/usr/bin/env python3
"""
Fourth pass: repair colour inversions left by the dark->paper remap.

Where a surface was #181818 with white text, the palette pass turned the
surface white and left the text white. Anywhere a declaration block pairs a
light background with near-white text (or a dark background with ink text),
flip the text to the opposite end of the ramp. White-on-white is never
intentional, so this is safe to apply blind.
"""
import re, glob, collections

LIGHT_BG = {'#FFFFFF', '#FFF', '#FCFDF8', '#F5F2EB', '#FAFAF5', '#ECEAE3',
            '#FAF9F4', '#D8D4CC', '#CCCCCC', 'WHITE',
            'VAR(--CARD)', 'VAR(--BG)', 'VAR(--CARD-2)', 'VAR(--PAPER)',
            'VAR(--TILE)', 'VAR(--BORDER)', 'VAR(--LINE)', 'VAR(--SURFACE)'}
PALE_FG = {'#FFFFFF', '#FFF', '#FCFDF8', '#FAFAF5', 'WHITE',
           'VAR(--WHITE)', 'VAR(--CARD)', 'VAR(--PAPER)', 'VAR(--BG)'}
DARK_BG = {'#0F0E0E', '#000', '#000000', '#181818', '#1A1A1A', '#212020',
           'BLACK', 'VAR(--INK)', 'VAR(--TEXT)'}
DARK_FG = {'#0F0E0E', '#000', '#000000', '#2A2A2A', 'BLACK',
           'VAR(--INK)', 'VAR(--TEXT)', 'VAR(--FG-2)'}

BG_RE = re.compile(r'background(?:-color)?\s*:\s*([^;!}"]+)', re.I)
FG_RE = re.compile(r'(^|;|\s)color\s*:\s*([^;!}"]+)', re.I)


def norm(v):
    v = v.strip().rstrip(';').strip()
    # take the colour token out of a shorthand like "background:#FFF url(...)"
    m = re.match(r'(#[0-9A-Fa-f]{3,8}|var\([^)]*\)|[a-z]+)', v)
    return (m.group(1) if m else v).upper()


def fix_block(body, stats, tag):
    bgm = BG_RE.search(body)
    fgm = FG_RE.search(body)
    if not bgm or not fgm:
        return body
    bg, fg = norm(bgm.group(1)), norm(fgm.group(2))
    if bg in LIGHT_BG and fg in PALE_FG:
        stats[(tag, 'pale-on-light', bg, fg)] += 1
        return body[:fgm.start(2)] + 'var(--ink)' + body[fgm.end(2):]
    if bg in DARK_BG and fg in DARK_FG:
        stats[(tag, 'ink-on-dark', bg, fg)] += 1
        return body[:fgm.start(2)] + '#FCFDF8' + body[fgm.end(2):]
    return body


def main():
    pages = sorted(p for p in glob.glob('**/*.html', recursive=True)
                   if not p.startswith('archive/'))
    stats = collections.Counter()
    touched = 0
    for p in pages:
        src = open(p, encoding='utf-8', errors='replace').read()

        out = re.sub(r'(<style[^>]*>)(.*?)(</style>)',
                     lambda m: m.group(1) + re.sub(
                         r'([^{}]+)\{([^{}]*)\}',
                         lambda r: r.group(1) + '{' + fix_block(r.group(2), stats, 'css') + '}',
                         m.group(2)) + m.group(3),
                     src, flags=re.S)

        out = re.sub(r'style="([^"]*)"',
                     lambda m: 'style="' + fix_block(m.group(1), stats, 'inline') + '"',
                     out)

        if out != src:
            open(p, 'w', encoding='utf-8').write(out)
            touched += 1

    print(f'pages touched: {touched}')
    for k, n in stats.most_common():
        print(f'  {k[0]:<7} {k[1]:<14} bg={k[2]:<16} fg={k[3]:<12} x{n}')


if __name__ == '__main__':
    main()
