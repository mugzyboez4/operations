#!/usr/bin/env python3
"""
Second pass: snap the long tail of off-palette hexes onto the canonical palette.

221 near-miss colours survived the explicit remap (#C9C6BE vs #ECEAE3,
#5C7A1A vs #5F7E1C, #E23F1C vs #FF4A23 ...). Rather than enumerate them by
hand, snap by CIELAB distance and report anything too far away for a human
call. Purposeful off-palette colours (data-viz categoricals, partner brand
colours) fall outside the threshold and are left alone.
"""
import re, glob, math, collections, json, sys

CANON = {
    'F5F2EB': 'bg',      'FFFFFF': 'card',     'FAFAF5': 'card-2',
    '0F0E0E': 'ink',     '2A2A2A': 'fg-2',     '888888': 'fog',
    'ECEAE3': 'border',  'D8D4CC': 'rule',     'CCCCCC': 'slate',
    'CDF851': 'lime',    '5F7E1C': 'lime-ink', 'FF4A23': 'flame',
    '5BC0BE': 'teal',    '2C8A88': 'teal-ink', 'E8C547': 'gold',
    '9A7B12': 'gold-ink','4ADE80': 'clear',    'FCFDF8': 'white',
    '1F9D55': 'green',
    'FFF5F2': 'tint-flame', 'F0FDFC': 'tint-teal',
    'FFF8E1': 'tint-gold',  'F0FAD0': 'tint-lime',
}
THRESHOLD = 15.0   # CIE76 deltaE

# Drifted role colours that sit just beyond the threshold but are plainly the
# same role, not a deliberate category colour. Everything NOT listed here and
# beyond the threshold is left alone (partner brands, data-viz categoricals).
FORCE = {
    '166534': '1F9D55', '3E8E5A': '1F9D55', '9BC99B': 'F0FAD0',
    '33401A': '5F7E1C', '4A5A1F': '5F7E1C', '2E5A14': '5F7E1C', 'B4C76F': '5F7E1C',
    'C2361A': 'FF4A23', 'D0342C': 'FF4A23', 'B3300F': 'FF4A23',
    '6B5514': '9A7B12', 'CFB35E': 'E8C547', 'DDC476': 'E8C547', 'F2E2A6': 'FFF8E1',
    '545158': '2A2A2A', '55524B': '2A2A2A', '5A5854': '888888',
    'C6D88A': 'F0FAD0',
}

def srgb_to_lab(hexstr):
    r, g, b = (int(hexstr[i:i+2], 16) / 255 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    x = r*0.4124 + g*0.3576 + b*0.1805
    y = r*0.2126 + g*0.7152 + b*0.0722
    z = r*0.0193 + g*0.1192 + b*0.9505
    xn, yn, zn = 0.95047, 1.0, 1.08883
    def f(t):
        return t ** (1/3) if t > 0.008856 else 7.787*t + 16/116
    fx, fy, fz = f(x/xn), f(y/yn), f(z/zn)
    return (116*fy - 16, 500*(fx - fy), 200*(fy - fz))

CANON_LAB = {h: srgb_to_lab(h) for h in CANON}

def nearest(hexstr):
    lab = srgb_to_lab(hexstr)
    best, bestd = None, 1e9
    for h, l in CANON_LAB.items():
        d = math.dist(lab, l)
        if d < bestd:
            best, bestd = h, d
    return best, bestd

def main():
    apply = '--apply' in sys.argv
    pages = sorted(p for p in glob.glob('**/*.html', recursive=True)
                   if not p.startswith('archive/'))
    snapped = collections.Counter()
    kept = collections.Counter()
    kept_where = collections.defaultdict(set)
    total = 0

    for p in pages:
        src = open(p, encoding='utf-8', errors='replace').read()
        def sub(m):
            nonlocal total
            h = m.group(1).upper()
            if h in CANON:
                return m.group(0)
            if h in FORCE:
                snapped[(h, FORCE[h])] += 1
                total += 1
                return '#' + FORCE[h]
            tgt, d = nearest(h)
            if d <= THRESHOLD:
                snapped[(h, tgt)] += 1
                total += 1
                return '#' + tgt
            kept[h] += 1
            kept_where[h].add(p)
            return m.group(0)
        out = re.sub(r'#([0-9A-Fa-f]{6})\b', sub, src)
        if apply and out != src:
            open(p, 'w', encoding='utf-8').write(out)

    print(f"{'APPLIED' if apply else 'DRY RUN'} — snapped {total} occurrences "
          f"({len(snapped)} distinct colours)")
    for (h, t), n in snapped.most_common(24):
        print(f"  #{h} -> #{t}  {CANON[t]:<10} x{n}")
    print(f"\nleft alone ({sum(kept.values())} occurrences, {len(kept)} distinct) "
          f"— beyond deltaE {THRESHOLD}:")
    for h, n in kept.most_common(30):
        tgt, d = nearest(h)
        print(f"  #{h}  x{n:<3} nearest {CANON[tgt]} dE={d:.0f}   "
              f"{', '.join(sorted(kept_where[h])[:2])}")
    json.dump({'snapped': {f'{a}->{b}': n for (a, b), n in snapped.items()},
               'kept': {h: sorted(kept_where[h]) for h in kept}},
              open('/home/claude/snap-report.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
