# RCA Label Operations & Communications — Changelog

---

## March 9, 2026 — Session 4: Design System Lock + Meeting Notes → Airtable

### Context
Continued from Session 3. Focus shifted to: (1) locking the design system to match existing goal briefs/prep packages, (2) answering Jordan's question about scaling meeting notes into Airtable, and (3) producing this week's goal brief as proof of the system working.

### Key Decisions
- **Design system permanently locked** to goal brief aesthetic (Inter, #CDF851 chartreuse, #0F0E0E). Previous versions used Bebas Neue / Barlow / red (#E2001A) — all three deliverables reskinned. Stored in memory as LOCKED.
- **Document rules stored in memory** as LOCKED: no names, no titles, no editorial, Teams not Slack, orientation optional/collapsible.
- **Meeting notes and Airtable coexist.** Notes are the human-readable version; Airtable is the system-readable version. One feeds the other. AT→ tags show the mapping.
- **Goal briefs can be auto-populated from Airtable.** Overdue actions, open questions, calendar events, and first-week data checks all surface automatically. The 3/11 goal brief demonstrates this.
- **Artist name correction:** Thames → Tems (applied across all files).

### Files Produced

| File | Type | Status | Purpose |
|------|------|--------|---------|
| `ActiveProjects_MeetingNotes_2026-03-04_V5.html` | Meeting notes | **Current — Final** | V5 of March 4 meeting notes with AT→ Airtable mapping tags on every section. Includes Airtable Translation Summary showing record counts per table. |
| `GoalBrief_ActiveProjects_2026-03-11.html` | Goal brief | **Current — Final** | This week's goal brief, pre-populated from what the Airtable system would auto-surface: 3 overdue actions, 8 open questions, 6 calendar events, 2 first-week data checks. Same 11 artists. |
| `rca_artist_visibility_v2.html` | Interactive demo | **Current — Final** | Reskinned to goal brief aesthetic. Orient banner fixed (moved from absolute to flow). |
| `rca_rollout_guide.html` | Document | **Current — Final** | Reskinned + new "Meeting Notes → Airtable" section with visual flow (4 steps), section-by-section mapping table, and 3-phase implementation path (manual → form → transcript extraction). |
| `rca_comms_playbook.html` | Document | **Current — Final** | Reskinned. All Slack → Teams. Editorial trimmed. Names/titles removed. |
| `rca_changelog.md` | Project file | **Current** | This file. |
| `rca_document_directory.md` | Project file | **Current** | Full file inventory with design system reference. |

### Iteration Path (This Session)
1. Audited all 3 deliverables for design uniformity → found hero-sub, h3 margin, missing color vars
2. Reskinned all 3 from Bebas/Barlow/red → Inter/chartreuse/#0F0E0E to match goal brief
3. Removed all remaining names, titles, editorial across all files
4. Fixed orient banner clipping hero in demo (absolute → flow)
5. Locked design system + document rules in memory (LOCKED status)
6. Built Meeting Notes V5 with AT→ tags showing Airtable mapping
7. Added "Meeting Notes → Airtable" section to rollout guide (visual + procedural)
8. Built this week's goal brief (3/11) as proof of auto-population from system
9. Corrected Thames → Tems across all files
10. Updated changelog + document directory

### Memory Edits Saved
1. RCA Visibility System — 3 matched deliverables, status, Teams, uniform style
2. Design system (LOCKED) — Inter, #CDF851, #FF4A23, #0F0E0E, full palette, label sizing
3. Document rules (LOCKED) — No names/titles, no editorial, Teams, orientation optional
4. Existing Airtable base structure — tables, interfaces, data source corrections

---

## March 9, 2026 — Session 3: Airtable System Demo + Rollout Package

### Context
Jordan's directive from earlier today: "just start doing it." Scott's departure created a vacuum for ERN readiness work. This session shifted from planning to building — the focus was creating a demo Jordan can interact with, plus the operational docs to back it up.

### Key Decisions
- **Presentation format:** Interactive HTML demo, not a deck or document. Jordan should sit down, click around, and forget he's looking at a mockup.
- **Artist-focused, not system-focused.** The centerpiece is "pick an artist, see everything" — not a table of data.
- **5 real RCA artists** used as demo data: Myles Smith (Setup), SZA (Pre-Release), Doja Cat (Release Week), Khalid (Post-Release), H.E.R. (Catalog).
- **Existing Airtable sections baked in.** Team, Calendar, Releases, Partner Updates pulled from the current base structure so Jordan sees extension, not replacement.
- **Design system locked to goal brief aesthetic.** Inter only, #CDF851 chartreuse accent, #FF4A23 flame alert, #0F0E0E background. All docs uniform. No Bebas Neue, no Barlow, no red accent — ever.
- **Microsoft Teams everywhere.** Not Slack.
- **No names, no titles, no department head references** in any Jordan-facing doc.
- **Minimize editorialism.** If it's being sent, the reader knows the goal.

### Files Produced

| File | Type | Status | Purpose |
|------|------|--------|---------|
| `rca_artist_visibility_v2.html` | Interactive HTML | **Current — Final** | Artist-focused demo for Jordan. 5 artists, lifecycle phases, clickable stat filters, collapsible depts, Airtable sections. |
| `rca_airtable_demo.html` | Interactive HTML | **Current — Companion** | Airtable-faithful grid version. Table tabs, view sidebar, toolbar, row expansion. More complex, used as reference. |
| `rca_rollout_guide.html` | Interactive HTML | **Current — Final** | 3-phase implementation plan. Build order, department onboarding waves, risk mitigation, success metrics, Week 1 action plan. |
| `rca_comms_playbook.html` | Interactive HTML | **Current — Final** | Announcement strategy, audience segmentation, communication timeline, message templates (4), training plan, FAQ (7), automation guide (5 Phase 2 + 4 Phase 3). |
| `atlantic_uk_reference_clean.html` | Interactive HTML | **Current — Leave-behind** | Cleaned Atlantic Records UK case study. No Label Ops naming, fill-in fields populated with RCA systems. Only used if asked for precedent. |

### Files Superseded (from earlier today)

| File | Superseded By | Reason |
|------|---------------|--------|
| `rca_airtable_system_plan.html` | `rca_artist_visibility_v2.html` | V1 — basic system plan |
| `rca_airtable_system_plan_v3.html` | `rca_artist_visibility_v2.html` | V3 — added interactive 12-dept view |
| `rca_airtable_system_plan_v4.html` | `rca_artist_visibility_v2.html` | V4 — added lifecycle phases |
| `rca_system_lifecycle_v4.html` | `rca_artist_visibility_v2.html` | Dark-mode interface version — replaced by artist-focused approach |

### Iteration Path (This Session)
1. Started with 5 strategic options for presenting to Jordan → chose "Ask Me Anything" demo backed by lifecycle grid
2. Built dark-mode interface (IBM Plex Sans) → too much like a product, not enough like Airtable
3. Rebuilt as Airtable-faithful UI → too complex for the meeting, lacked RCA aesthetic
4. Simplified to artist-focused layout with RCA red/black brand → right structure
5. Added real RCA artists, bigger/lighter text, optional orientation, visible % calculation
6. Fixed catalog % logic (maintenance items → "Ongoing:" in done column)
7. Baked in existing Airtable sections (Team, Calendar, Releases, Partners)
8. Made stat boxes clickable filters (auto-expand on Blocked/Blockers)
9. Fixed Data Sources (CARMA for contacts, sample clearance report for clearances, removed Expenses row)
10. Reskinned all 3 docs to match goal brief aesthetic (Inter, chartreuse, #0F0E0E)
11. Removed all names, titles, editorial language
12. Fixed orient banner clipping hero (moved from absolute positioning into scroll flow)

### Data Source Corrections Applied
- External contacts: ~~Outlook (M365)~~ → CARMA
- Clearance, samples: ~~Email + BLA files~~ → Sample clearance report, side artist chart
- Expenses/approvals row: Removed (HR, not team-facing)

### [VERIFY] Items Still Open
- Unknown fields #6 and #7 (Artwork Status, Credits/Splits) — inferred, not confirmed
- Atmos Decision ownership (A&R / Production)
- Cover/VSC initiation (who initiates — undefined)
- A&R Paperwork flow back to Runway
- GRPS → Runway relationship (may go through GOLD)
- ERN Runway field names ("Credits field," "Master Status")

### Open Items
- [ ] Jordan follow-up meeting — schedule for this week
- [ ] ERN readiness checklist — build in Airtable or spreadsheet (Week 1 action)
- [ ] Run checklist against next 2 upcoming releases
- [ ] Wave 1 department contacts identified (A&R, Production, Legal)
- [ ] Resolve all [VERIFY] items against Runway UI
- [ ] Jordan's question: How to scale meeting notes into Airtable — needs response

---

## March 9, 2026 — Session 2: Atlantic UK Case Study + Dashboard Iteration

*(See Session_Handoff_Airtable_Jordan_Dashboard_Mar9.md for full detail)*

Split the Atlantic UK HTML into two docs (RCA system plan + cleaned reference). Built 4 iterations of the system plan (V1–V4) before pivoting to the artist-focused demo approach in Session 3.

---

## March 9, 2026 — Session 1: DDEX Pipeline + Jordan Outreach

*(See Session_Handoff_DDEX_Jordan_Mar9.md for full detail)*

Jordan said "just start doing it." Scott departed. ERN readiness checklist identified as the Trojan Horse entry point.
