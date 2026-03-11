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

All pages must match this locked design system exactly:

| Token | Value |
|-------|-------|
| Font | Inter only (weights 300–900, via Google Fonts) |
| Accent | `#CDF851` (chartreuse) |
| Alert | `#FF4A23` (flame) |
| Background | `#0F0E0E` |
| Cards | `#181818` |
| Borders | `#2A2A2A` |
| Body text | `#B0A9BE` |
| Dim text | `#847D96` |
| Muted | `#3E3F41` |
| White | `#FCFDF8` |
| Labels | 9px / 800 weight / 0.2em letter-spacing / uppercase |

## Content Rules (LOCKED)

- No personal names. No titles (SVP, COO, VP). No department head references.
- Minimize editorialism — if a doc is being sent, the reader knows the goal.
- Platform is **Microsoft Teams**, not Slack.
- Orientation/how-to-read sections should be optional and collapsible.

## Navigation

Every page includes a sticky top nav bar with the "RCA · Operations" brand mark and tabs linking to all major pages. The nav uses dropdown menus (class `sndd`) for grouped items like Meetings and Pipeline. When adding a new page, update the nav bar in all existing pages.

## File Naming Convention

For source documents (not the GitHub Pages site files): `RCA_[DocType]_[Topic]_[Date]_v[#].[ext]`
- Dated docs (meetings, handoffs): include `YYYY-MM-DD`
- Living docs (demos, guides): omit date
- Always include version suffix `_v[#]`
- Archive suffix: `_ARCHIVED`

See `project/naming-convention.md` for the full DocType list and folder rules.
