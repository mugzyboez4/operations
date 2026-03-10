# RCA Label Operations & Communications — Document Directory

**Last updated:** March 9, 2026 (Session 4)

---

## Design System (LOCKED)

| Token | Value |
|-------|-------|
| Font | Inter only (300–900 weights) |
| Accent | #CDF851 (chartreuse) |
| Alert | #FF4A23 (flame) |
| Background | #0F0E0E |
| Cards | #181818 |
| Borders | #2A2A2A |
| Body text | #B0A9BE |
| Dim text | #847D96 |
| Muted | #3E3F41 |
| White | #FCFDF8 |
| Labels | 9px / 800 weight / 0.2em letter-spacing / uppercase |
| Platform | Microsoft Teams (not Slack) |

**Rules:** No names. No titles (SVP/COO/VP). No department head references. Minimize editorialism. Orientation framework optional/collapsible.

---

## Current Files — Jordan Package

These are the final deliverables for Jordan. All uniform in style.

| # | File | Type | Purpose | Status |
|---|------|------|---------|--------|
| 1 | `rca_artist_visibility_v2.html` | Interactive demo | Artist-focused visibility system. 5 real RCA artists (Myles Smith, SZA, Doja Cat, Khalid, H.E.R.) at different lifecycle stages. Clickable stat filters, collapsible depts, Airtable sections (Team, Calendar, Releases, Partners). | **Final** |
| 2 | `rca_rollout_guide.html` | Document | 3-phase implementation plan. Build order (7 steps), department onboarding waves (3), risk mitigation (5), success metrics (7), Week 1 action plan (5 days), Meeting Notes → Airtable section (visual flow + procedural + 3-phase path). | **Final** |
| 3 | `rca_comms_playbook.html` | Document | Announcement strategy, communication timeline, 4 audience segments, 4 message templates, training plan (7 resources), FAQ (7 questions), automation guide (5 Phase 2 + 4 Phase 3 integrations). | **Final** |

## Current Files — Meeting Docs (with Airtable Integration)

| # | File | Type | Purpose | Status |
|---|------|------|---------|--------|
| 4 | `GoalBrief_ActiveProjects_2026-03-11.html` | Goal brief | This week's Active Projects goal brief. Pre-populated from Airtable: 3 overdue actions, 8 open questions, 6 calendar events, 2 first-week data checks. Same 11 artists. AT→ source tags throughout. | **Final** |
| 5 | `ActiveProjects_MeetingNotes_2026-03-04_V5.html` | Meeting notes | March 4 meeting notes with AT→ Airtable mapping tags on every section. Includes Airtable Translation Summary showing ~18 calendar events, 11 update log records, 9 action items, 4 dept status flags, 8 outstanding questions. | **Final** |

## Current Files — Reference / Leave-Behind

| # | File | Type | Purpose | Status |
|---|------|------|---------|--------|
| 6 | `rca_airtable_demo.html` | Interactive demo | Airtable-faithful grid version with table tabs, view sidebar, toolbar, phase filters, row expansion. More complex — companion to the artist demo. | **Current** |
| 7 | `atlantic_uk_reference_clean.html` | Document | Atlantic Records UK case study. Cleaned (no Label Ops naming, RCA systems populated). Only pulled out if asked "has anyone done this?" | **Current** |

## Superseded Files (Do Not Use)

| File | Replaced By | Date |
|------|-------------|------|
| `rca_airtable_system_plan.html` | `rca_artist_visibility_v2.html` | Mar 9 |
| `rca_airtable_system_plan_v3.html` | `rca_artist_visibility_v2.html` | Mar 9 |
| `rca_airtable_system_plan_v4.html` | `rca_artist_visibility_v2.html` | Mar 9 |
| `rca_system_lifecycle_v4.html` | `rca_artist_visibility_v2.html` | Mar 9 |
| `rca_implementation_rollout.docx` | `rca_rollout_guide.html` | Mar 9 |
| `GoalBrief_ActiveProjects_V2.html` | `GoalBrief_ActiveProjects_2026-03-11.html` | Mar 9 |
| `ActiveProjects_MeetingNotes_V4.html` | `ActiveProjects_MeetingNotes_2026-03-04_V5.html` | Mar 9 |

## Session Handoff Files

| File | Covers | Date |
|------|--------|------|
| `Session_Handoff_DDEX_Jordan_Mar9.md` | DDEX pipeline + Jordan outreach. Jordan's "just start doing it" directive. Scott's departure. | Mar 9 |
| `Session_Handoff_Airtable_Jordan_Dashboard_Mar9.md` | Atlantic UK split, 4 iterations of system plan, design decisions, [VERIFY] items. | Mar 9 |

## Other RCA Documents (Prior Sessions)

| File | Type | Purpose |
|------|------|---------|
| `GoalBrief_FeeStructure_KarenMeg_v2.html` | Goal brief | Fee structure review working session. **Design system source of truth** — this is the aesthetic all docs match. |
| `GoalBrief_ActiveProjects_V2.html` | Goal brief | Original Active Projects goal brief for 3/4. Superseded by 3/11 version with AT→ tags. |
| `ActiveProjects_MeetingNotes_V4.html` | Meeting notes | Original March 4 meeting notes. Superseded by V5 with Airtable mapping. |

---

## Existing Airtable Base Structure

For reference — what's already built in the RCA Airtable:

**Tables/Data:**
- Artist profiles (image, social links, one sheet, team roster)
- Calendar (events with type pills: Track Release, Tour Date, Promo, Press, Hold, Announce; status pills: Planning, Confirmed)
- Releases (upcoming + catalog, dates, listening links)
- Partner Updates (opportunity, deliverables, partner)
- Artist Update Log (date + recap)

**Department Sidebar Interfaces:**
Marketing, Creative, Digital, Commercial Partnerships, Physical Tracker, Global Brand Partnerships, Press, Release Planning, Finance, Budget Requests

**Main Interface Structure (per artist):**
Artist name → Image + Social Links → Artist Team (by role type) → Partner Updates → Artist Update Log → Calendar (with filters) → Tour dates → Releases (Upcoming / All)

**RCA Systems Referenced:**
GRPS, CARMA, SAP, Concur, Release Runway, Outlook

**Data Source Corrections (applied Mar 9):**
- External contacts → CARMA (not Outlook)
- Clearance/samples → Sample clearance report + side artist chart (not email/BLA files)
- Expenses row → removed (HR, not team-facing)
