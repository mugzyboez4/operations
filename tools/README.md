# TEMPO re-skin — migration tooling

One-shot scripts used to move the site onto `/tempo.css`, kept for audit.
They are idempotent but there is no reason to run them again.

| script | what it did |
|---|---|
| `convert_tempo.py` | linked tempo.css, deleted page-level `:root` blocks, universal resets and duplicated font imports, stripped base declarations from `body{}` |
| `snap_palette.py` | snapped 176 drifted colours onto the canonical palette by CIELAB distance; left deliberate category colours alone |
| `fix_contrast.py` | swapped fill-only colours (lime, teal, gold, slate) used as text to their ink variants |
| `fix_inversions.py` | repaired white-on-white left by the dark→paper surface remap |
| `qa.js` | Playwright pass: renders every live page, screenshots it, and reports background, font, contrast and stylesheet failures |

## Running QA

```
python3 -m http.server 8899        # from the repo root
node tools/qa.js                   # needs `npm i playwright`
```
