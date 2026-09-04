#!/usr/bin/env python3
"""
Third pass: fix colours used as TEXT that only work as fills.

--lime, --teal, --gold and --slate are fill/rule values. Where a rule sets them
as `color:` on a light surface the text is unreadable (lime on white is 1.2:1).
Swap those to the ink variants. Rules that also paint a dark background — the
sec-num badge, .om-dark bands, the utility strip — are left alone, because lime
on ink is the point.
"""
import re, glob, collections

# risky as text on paper -> accessible ink variant
TEXT_FIX = {
    '#CDF851': '#5F7E1C', 'var(--lime)': 'var(--lime-ink)',
    'var(--chartreuse)': 'var(--lime-ink)', 'var(--chart)': 'var(--lime-ink)',
    'var(--chartreuse-bright)': 'var(--lime-ink)',
    '#5BC0BE': '#2C8A88', 'var(--teal)': 'var(--teal-ink)',
    '#E8C547': '#9A7B12', 'var(--gold)': 'var(--gold-ink)',
    'var(--yellow)': 'var(--gold-ink)',
    '#CCCCCC': '#888888', 'var(--slate)': 'var(--fog)',
}
# selectors that legitimately put light ink on a dark ground
DARK_SEL = re.compile(
    r'\.om-dark|\.tm-strip|\.tm-hero|\.sec-num|\.co-band|\.co-strip|\.chip\.solid'
    r'|\.wf-tab\.active|\.tm-btn\.active|\.tn-|\bnav\b|\.hero|\.dark|\.inv|\.band'
    r'|::selection|\.footer-dark|\.solid', re.I)
DARK_BG = re.compile(
    r'background(?:-color)?\s*:\s*(?:#(?:0|1|2|3)[0-9A-Fa-f]{5}|var\(--ink\)|var\(--text\)'
    r'|var\(--flame\)|var\(--lime\)|var\(--chartreuse\)|#FF4A23|#CDF851|black)', re.I)

RULE = re.compile(r'([^{}]+)\{([^{}]*)\}')
COLOR_DECL = re.compile(r'(^|;|\s)(color)\s*:\s*([^;!]+)', re.I)


def fix_css(css, stats):
    def on_rule(m):
        sel, body = m.group(1), m.group(2)
        if DARK_SEL.search(sel) or DARK_BG.search(body):
            return m.group(0)

        def on_color(cm):
            val = cm.group(3).strip()
            key = val if val.startswith('var(') else val.upper()
            if key in TEXT_FIX:
                stats[(key, TEXT_FIX[key])] += 1
                return f'{cm.group(1)}color:{TEXT_FIX[key]}'
            return cm.group(0)

        return sel + '{' + COLOR_DECL.sub(on_color, body) + '}'
    return RULE.sub(on_rule, css)


def fix_inline_attr(html, stats):
    """style="color:#CDF851" on an element with no dark background of its own."""
    def on_attr(m):
        body = m.group(1)
        if DARK_BG.search(body):
            return m.group(0)

        def on_color(cm):
            val = cm.group(3).strip()
            key = val if val.startswith('var(') else val.upper()
            if key in TEXT_FIX:
                stats[(key, TEXT_FIX[key])] += 1
                return f'{cm.group(1)}color:{TEXT_FIX[key]}'
            return cm.group(0)
        return 'style="' + COLOR_DECL.sub(on_color, body) + '"'
    return re.sub(r'style="([^"]*)"', on_attr, html)


def main():
    pages = sorted(p for p in glob.glob('**/*.html', recursive=True)
                   if not p.startswith('archive/'))
    stats = collections.Counter()
    touched = 0
    for p in pages:
        src = open(p, encoding='utf-8', errors='replace').read()
        out = re.sub(r'(<style[^>]*>)(.*?)(</style>)',
                     lambda m: m.group(1) + fix_css(m.group(2), stats) + m.group(3),
                     src, flags=re.S)
        out = fix_inline_attr(out, stats)
        if out != src:
            open(p, 'w', encoding='utf-8').write(out)
            touched += 1
    print(f"pages touched: {touched}")
    for (a, b), n in stats.most_common():
        print(f"  color:{a} -> {b}   x{n}")


if __name__ == '__main__':
    main()
