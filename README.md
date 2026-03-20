# TEMPO Site Update — March 18, 2026

## What Changed
- **New page: orbit.html** — The Orbit framework (Hub & Spoke + Stage-Gate + SIPOC)
- **Nav restructured** — Stripped to 3 main tabs + 1 dropdown:
  - **Home** — Landing page
  - **Orbit** — Campaign Ops framework (NEW)
  - **Visibility** — Artist visibility grid
  - **Library ▾** — Dropdown containing everything else:
    - Release View
    - Meeting Flow
    - Pipeline
    - Template
    - Artist pages
    - Archive pages

## How to Deploy

1. **Copy `orbit.html`** into your `operations/` repo folder (same level as `index.html`)

2. **Run the nav update script** from inside the `operations/` folder:
   ```
   cd path/to/operations
   python update_nav.py
   ```
   This will update the nav on every existing HTML page.

3. **Open a few pages in browser** to verify nav looks right

4. **Commit + push** via GitHub Desktop

## Files Included
- `orbit.html` — The Orbit page (ready to drop in)
- `update_nav.py` — Nav update script (run once, then delete)
- `README.md` — This file
