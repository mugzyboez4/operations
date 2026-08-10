# Campaign Ops Design System

A design system for **RCA Records' Campaign Operations team** — a small group inside RCA building the operating system that moves every artist campaign through five phases (Prep → Plan → Announce → Release → Review) and the gates between them. This kit gives a design agent everything it needs to make new pages, slides, icons, HTML mocks, and one-pagers that look like they came from the same hand.

The shipping system internally calls itself **TEMPO / Campaign Operations**, lives at `mugzyboez4.github.io/operations`, is gated by the password `RCA2026`, and is hand-authored static HTML — no framework, no build system. The aesthetic is deliberately spare: cream paper, hot tomato accents, chartreuse highlights, near-black type, all-caps editorial labels, and one neon gramophone-and-dog brand mark that nods to RCA Victor's "His Master's Voice."

## Sources

- **GitHub repo:** `mugzyboez4/operations` — the live site. All visual decisions here trace back to its hand-authored CSS in `style.css`, `index.html`, `phases.html`, `tracker.html`, and `department-inputs.html`.
- **Adjacent repos** in the same hand (for tonal reference, not visual lift): `mugzyboez4/sync-hub`, `mugzyboez4/rca-internal-comms`, `mugzyboez4/insights`, `mugzyboez4/workspace`.
- **Locked tokens** are pinned in the repo's `CLAUDE.md` — anything below is a faithful read of that file.

This is an *internal* tool. Public RCA branding, label logos, and artist imagery are **out of scope** and not present here. Iconography for the brand is the neon gramophone+dog mark (`assets/logo_neon.png`, also exported as `tempoicon.png`).

---

## Index

| File | What it is |
|------|------------|
| `colors_and_type.css` | All design tokens — CSS variables for color, type, spacing, radii, shadows, plus a small set of semantic utility classes (`.cops-eyebrow`, `.cops-h1`, etc.) |
| `assets/` | Logos, the gramophone+dog mark, neon variants |
| `preview/` | Cards that populate the Design System tab — colors, type, components, brand |
| `ui_kits/campaign-ops/` | High-fidelity recreations of the live site: nav, hero, phase strip, tracker, lizzy gate bar, department inputs table |
| `RCA_BRAND.md` | The **public-facing RCA Records brand** &mdash; wordmark, two-color palette, display-serif + bold-sans type contrast, campaign composition rules. Distinct from Campaign Ops. |
| `SKILL.md` | Cross-compatible Agent Skill spec |

---

## Content Fundamentals

Campaign Ops copy is **declarative, operational, and lightly editorialized.** It is written by a small ops team to be read by every department in a record label — A&R, Creative, Audience Development, Publicity, Radio, Commercial Partnerships, International, Finance — without slowing them down. Tone follows a few hard rules.

### Voice rules (from the repo's `CLAUDE.md`, locked)

- **No personal names.** No titles (SVP, COO, VP). No department heads. The system is the noun, not the person.
- **Minimize editorializing.** If a doc is being sent, the reader already knows the goal — don't restate it. Cut adjectives. Lead with the deliverable.
- **The platform is Microsoft Teams.** Never Slack.
- **Orientation / how-to-read sections are optional and collapsible.** Default state is collapsed.

### Voice in practice

- **Sentence-case running prose**, but **ALL-CAPS for structural labels** (eyebrows, phase numbers, table headers, badge text, nav links). This contrast is the entire visual rhythm.
- **Second person is used sparingly** — "If something on this list affects your team and you don't see your department named, that's a bug — tell us." Never "we" except when describing the team operationally.
- **Imperative voice on actions:** "Clear the gate." "Track artists through the phases." "Move Lizzy / Angel from Phase 1 (Prep) into Phase 2 (Plan)."
- **Em-dashes are load-bearing.** They carry the rhythm: "The system says no — not us." "Working the project post-release — performance analysis, continued momentum."
- **No emoji.** None. Anywhere. Unicode arrows (`→ ← ↓ ↻`) and check/box glyphs (`✓ ☐`) are the only non-letter characters that appear.
- **Numerals always.** "2 of 6 cleared," not "two of six."
- **Dates are written as `Mon DD` or `M.D.YY`** — "May 11 — 22", "9.18.26", "Friday May 22".
- **Pithy taglines & principles** are how the system encodes belief. They appear in a left-border block or pinned footer. Examples:
  - "The system says no — not us."
  - "The system says no, not a person."
  - "Campaign Ops never says no. The system says no. Campaign Ops helps you clear the gate."
  - "Building together."
  - "Until the system is running roster-wide, nothing's built — just prepared."
- **Closes-when patterns** are the most common copy fragment in the system. Every phase, gate, and deliverable has a "Closes when" line stating the literal exit criteria: "Deal signed, artist brief exists, pod assigned, baseline data pulled."

### Word list (in use)

`phase`, `gate`, `roster`, `pod`, `pilot`, `sprint`, `recap`, `language framework`, `cadence`, `front-door`, `operating system`, `brief`, `kickoff`, `lock`, `cleared`, `pending`, `blocked`, `open for input`, `in build`, `scoping`, `locked`, `shipped`, `prerequisite`, `threshold`, `awareness`, `wheel`, `loop`.

### Word list (avoid)

`team`, `we'll`, `let's`, `awesome`, `delight`, `synergize`, individual job titles, emoji.

---

## Visual Foundations

### Palette

The system has **one canvas color and three brand voltages**.

- **Cream paper** `#F5F2EB` is the page background everywhere on the light theme. Cards float as plain white (`#FFFFFF`) directly on top, separated by a hairline `#ECEAE3` border. Sunken/inner panels go to `#FAFAF5`. There is no other neutral surface.
- **Tomato flame** `#FF4A23` is the current-state color — the active phase, the "you are here" pulse, the alert pill, the public-awareness threshold. It is also the **only allowed link/CTA accent on body text** in the light theme.
- **Chartreuse lime** `#CDF851` is the brand voltage — used in the logo's neon, success edges, the "OPERATING SYSTEM" capstone tag, and as the highlight `<span>` color inside the wordmark "Campaign **Ops**." It is **not** used as text on light backgrounds (poor contrast); it shows only against `#0F0E0E` (logo plinth, dark pull-quote blocks).
- **Turquoise teal** `#5BC0BE` and **mustard gold** `#E8C547` are utility states: teal = pilot / next / in-input, gold = in-build / mid-progress / working.

There is also a 5-color **phase chromatic** (one hex per phase) used on phase numbers, top-border accents on phase cells, and the road-map dot ring: `#3E3F41 → #5BC0BE → #E8C547 → #CDF851 → #FF4A23`.

### Type

**Inter is the only typeface**, weights 300–900, with **DM Mono** appearing on a small subset of pages (nav labels in `style.css`, gate node monograms, prereq owner credits in the tracker). Most pages now standardize on Inter for nav too — DM Mono is being phased out.

The type system runs on two contrast moves:

1. **Tight headlines, loose labels.** Display sizes (36–56px) use weight 900 and **-1.5 to -2.5px tracking**. Labels (9–11px) use weight 600–800 and **+1.5 to +3px tracking** and are always uppercase.
2. **One leading on body, one on lead.** Body copy is 13px / 1.55. Lead paragraphs are 15–16px / 1.65. There is no in-between.

Eyebrows always sit above titles; section titles never appear without one.

### Layout

- **Max content width 1180px**, page padding 32px, dropping to 20px below 900px.
- **Tables are first-class layout primitives**, not just data containers — the phase strip is a `<table>`. Phase cells use a **6px colored top border** to indicate the phase chromatic; that top border is the single most identifying element of the system.
- **Threshold strips** sit flush above tables — a tiny horizontal grid of 9px uppercase labels indicating internal vs. public state, with the public cells flipped to `#FFEEE8 / #FF4A23`. This pattern is reused on any "before/after" grid.
- **Dashed dividers (1px dashed `var(--border)`) separate "Closes when" / "Ready to plan?" footer blocks inside cells.**

### Background, surfaces, and depth

- **No gradients.** Anywhere. The road-map SVG uses a flat dot pattern (`#D8D4CC` 1.2px dots on `#F5F2EB`) for ambient texture — that is the closest the system gets.
- **No full-bleed photography.** Imagery in this kit is limited to the brand mark on plinths; everything else is type and geometry.
- **No drop shadows on cards.** Cards are hairline-bordered (`1px solid #ECEAE3`) and float on the cream background. The two exceptions are the fixed `Lizzy` bottom bar (`0 -8px 24px rgba(0,0,0,.06)`) and the nav dropdown (`0 4px 12px rgba(0,0,0,.06)`). Both are deliberately soft and almost invisible.
- **Rings, not shadows, signal active state.** The active gate node uses `box-shadow: 0 0 0 4px rgba(255,74,35,.08)` — a flame-tinted ring at 8% opacity.

### Corners

- **Default corner radius is 0.** Every panel, button, badge, card, table cell, threshold cell is hard-edged. This is the most opinionated single decision in the system.
- **The only rounded element is the logo plinth** (`border-radius: 6–16px`), and image avatars when they appear.
- The Lizzy-gate sticky bar uses a **3px solid teal top border** instead of a radius.

### Borders

- **Hairline `1px solid #ECEAE3` everywhere by default.**
- **2–6px colored top borders** mark phase cells and brand voltage edges (the phase chromatic, the sprint-block flame left border).
- **`3–4px left borders` carry semantic accent:** pilot card → teal, sprint block → flame, principle pull-quote → lime, gate cleared → green clear.
- **Borders never combine with shadows on the same element.**

### Color of imagery

Imagery in the system is **chartreuse-neon on black**, exclusively — a stylized gramophone-and-dog illustration done as if traced in neon tubing, set on a black plinth with a 1.5px lime line keyline 32px from the edge. The dog reads in cream-white; the gramophone horn in lime. No photography, no warm/cool grading question — the only image vocabulary in the system *is* this one mark, rendered as a 32–160px square avatar.

### Animation

The live site uses **almost no animation**.

- **Transitions are `all .15s linear`** on nav links, buttons, and gate checks. No easing functions other than linear.
- **Hover state** = the foreground darkens to `var(--ink)` and a `border-color` appears on what was previously a transparent border. Nothing slides, nothing fades.
- **Press / active state** = the badge inverts (white text on `#0F0E0E`) or a fill becomes filled-checkmark.
- **No bounces, no spring physics, no skeleton loaders.** The system is meant to feel like a printed dashboard that happens to be live.

### Transparency & blur

- **Effectively zero `backdrop-filter` use.** The fixed Lizzy bar at the bottom of the viewport is `background: var(--card)` solid, not blurred. The sticky nav is solid `var(--bg)`.
- **rgba opacity is used only on shadows and the flame ring** — never on text fills, never on borders.

### Hover & press tokens

| State | Action |
|-------|--------|
| Hover (link / nav) | `color: var(--ink)` + `border-color: var(--border)` appears |
| Hover (table row) | `background: #FAFAF5` (card-2) |
| Hover (button) | identical foreground swap; never a translate / scale |
| Active link | `color: var(--flame)` + `border-color: var(--flame)`, weight 600 |
| Checked (gate item) | `.prereq-check.on` → fill flame/clear, white `✓` |
| Focus | none custom; browser default (system focus ring kept) |

### Density

- **Vertical rhythm is 24–32px between sections.** Inside cells, 12–14px between content blocks.
- **Tables use 14px row padding, 12px header padding.**
- **Page header → first content** is 28–32px, marked with a **2px solid black bottom rule** (the only place the system uses a thick rule).

---

## Iconography

Campaign Ops is **text-first by design.** The system has almost no iconography of its own; what it does have follows three strict rules.

1. **The brand mark is the only illustration.** `assets/logo_neon.png` — a neon gramophone-and-dog square on black, lime accents, cream-white dog — appears as the nav logo (32×32, rounded 6px), the password-gate centerpiece (160×160, rounded 16px), and occasionally as a section header avatar. It is **never recolored, cropped, or set on anything other than its own black plinth.**
2. **Unicode glyphs do the work icons usually do.** The system standardizes on:
   - `→` (right arrow) for advancement / "open this" / phase transitions
   - `↓` (down arrow) for gate questions ("Ready to plan? ↓")
   - `↻` (refresh) for the loop / "Feeds the next campaign"
   - `←` (left arrow) for the threshold strip's "← Public" callout
   - `✓` (check) and `☐` (empty box) for gate items
   - `·` (middle dot) as a separator between metadata fragments
   - `&mdash;` (em-dash) as the dominant punctuation rhythm
3. **No emoji.** No icon font. No imported icon set (Lucide, Heroicons, etc.). The visual weight that an icon would carry is instead carried by **9px uppercase letter-spaced labels** and **colored 2–6px borders**.

If a future surface needs a real icon set (e.g. for the proposed Tarek-bot agent UI), substitute **Lucide** at stroke-weight 1.5, color `var(--ink)` on light, `var(--ink)` on dark — and **flag the substitution to the design owner** before shipping. Lucide is not currently sanctioned by the system; this design system loads it from CDN only when explicitly opted into.

---

## UI Kits

One product surface, one kit:

- `ui_kits/campaign-ops/` — the operations site. Includes the nav, password gate, hero, road-map section pattern, 5-phase strip, threshold strip, pilot card, sprint block, gate-tracker with checkable prereqs, department-inputs table, sticky Lizzy gate bar, and footer principle pull-quote. Open `ui_kits/campaign-ops/index.html` to see them in context.

### Components

Exported on the `window` namespace and previewed as cards in the Design System tab:

- **Shell** — composite marketing shell (Nav + Hero + PhaseStrip).
- **Nav** — sticky top nav with the neon logo lockup and phase links.
- **Hero** — display headline, lead, primary/ghost actions, sprint meta.
- **PhaseStrip** — the five-phase threshold row (Prep → Plan → Announce → Release → Review).
- **Tracker** — composite tracker view (PilotCard + GateTracker + DepartmentInputs + LizzyBar).
- **GateTracker** — interactive gate checklist; click prerequisites to clear the gate.
- **DepartmentInputs** — department inputs table with stage tags and gate pills.
- **PilotCard** — pilot-artist summary card.
- **PrincipleBlock** — the three operating-principle statements.
- **LizzyBar** — fixed bottom bar tracking the pilot across all five phases.
- **Footer** — site footer with the neon logo lockup and version meta.

---

## Caveats

- **Fonts:** Inter and DM Mono are loaded from Google Fonts CDN. No `.ttf` files are bundled. If the user wants self-hosted fonts, they should drop the files into `fonts/` and rewrite the `@import` in `colors_and_type.css`.
- **Brand mark:** the included `logo_neon.png` is the production asset from the repo (44 KB) and `logo_glow.png` is the higher-glow variant (354 KB). Both are rasters; no vector source is present in the source repo.
- **No animations** are documented because the source system uses none. If motion is added, it should be `.15s linear` to match the rest of the system.
