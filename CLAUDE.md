# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RCA Records "Cross-Department Visibility System" — a set of static HTML pages hosted via GitHub Pages at https://mugzyboez4.github.io/operations/. The site presents an operational framework for cross-department artist visibility built on top of an existing Airtable base.

There is no build system, no framework, no package manager. All files are hand-authored HTML with inline CSS and JavaScript. To preview, open any `.html` file in a browser.

## Architecture

- `index.html` — Landing page and navigation hub linking to all other pages
- `cadence.html` — Weekly operational cycle documentation
- `demo.html` — Interactive artist visibility demo (5 real RCA artists across lifecycle stages, clickable stat filters, collapsible departments)
- `rollout.html` — 3-phase implementation plan
- `comms.html` — Communications playbook (announcement strategy, templates, FAQ, automation guide)
- `prep-isaia.html` — Artist prep package prototype (4-tab layout)
- `meetings/` — Dated meeting docs: goal briefs and meeting notes with AT→ Airtable mapping tags
- `reference/` — Companion demos and leave-behind docs (Airtable grid demo, Atlantic UK case study)
- `project/` — Internal project files: changelog, naming conventions, document directory

## Design System (LOCKED)

All pages link `/tempo.css` and must match this locked design system exactly.
Do not add a `:root` block to a page — tempo.css owns the tokens, and it also
aliases every legacy name (`--chartreuse`, `--paper`, `--muted`, `--disp`, …)
onto the canonical values.

| Token | Value | Notes |
|-------|-------|-------|
| Font | Inter only (300–900, via Google Fonts) | `--font-sans`; `--font-mono` is the system mono stack |
| Background | `#F5F2EB` | paper stock |
| Cards | `#FFFFFF` / `#FAFAF5` | `--card` / `--card-2` |
| Ink | `#0F0E0E` | `--ink` |
| Secondary ink | `#2A2A2A` | `--fg-2` |
| Muted | `#6E6A63` | `--fog` |
| Borders | `#ECEAE3` | `--border`; `--rule` `#D8D4CC` for heavier rules |
| Accent | `#CDF851` (chartreuse) | **fill only** — never text on paper |
| Accent as text | `#55711A` | `--lime-ink` |
| Alert | `#D93A13` (flame) | links, eyebrows, active tab; `#FF4A23` on ink grounds |
| Teal / gold | `#5BC0BE` / `#E8C547` | text variants `--teal-ink` `#257471`, `--gold-ink` `#8A6E0E` |
| Labels | 9px / 700 weight / 1.5px letter-spacing / uppercase | |

Dark bands still exist (heroes, section badges, utility strip). Put `.om-dark`
on any panel sitting on `--ink` so links and accents flip correctly.

Accessibility: every accent clears WCAG AA for small text on paper except
`--flame` (4.11:1) — going further reads brick rather than flame. On ink
grounds the darker values invert the problem; add a "dark-ground accent"
style block at the end of the page, as the existing dark bands do.

## Shared files

- `tempo.css` — the design system. All tokens, chrome and components live here.
- `shell.js` — injects the utility strip and nav on every page.
- `shell.css` / `style.css` — deprecated shims that import tempo.css. Don't add rules.
- `sidebar.js` — optional team-notes panel.
- `tools/` — one-shot migration scripts and the Playwright QA pass (`node tools/qa.js`).

## Content Rules (LOCKED)

- No personal names. No titles (SVP, COO, VP). No department head references.
- Minimize editorialism — if a doc is being sent, the reader knows the goal.
- Platform is **Microsoft Teams**, not Slack.
- Orientation/how-to-read sections should be optional and collapsible.

## Navigation

Nav is injected by `shell.js` — a black utility strip plus a paper nav bar with the
"Campaign Ops" brand mark. Add a new page by editing the `LINKS` array in
`shell.js`; do not hand-author `<nav>` markup on new pages. Opt out on an
embedded page with `<script src="/shell.js" data-no-strip></script>`.

## File Naming Convention

For source documents (not the GitHub Pages site files): `RCA_[DocType]_[Topic]_[Date]_v[#].[ext]`
- Dated docs (meetings, handoffs): include `YYYY-MM-DD`
- Living docs (demos, guides): omit date
- Always include version suffix `_v[#]`
- Archive suffix: `_ARCHIVED`

See `project/naming-convention.md` for the full DocType list and folder rules.
