# D2C Activations — Schema Specification

**Version:** 1.0 (label-agnostic)
**Purpose:** Single source of truth for D2C activation programming across a 12-month working window.
**Originally built for:** RCA Records (Campaign Operations, May 2026)
**Designed to scale to:** any Sony Music Entertainment label.

---

## What this captures

Every direct-to-consumer activation in one place:

- Official releases (album, single, EP wide releases)
- Merch drops (artist-specific)
- Shop initiatives (storefront campaigns, bundles, seasonal)
- Additional music products (vinyl variants, exclusives, deluxe editions)
- Cultural moments (industry tentpoles, calendar events that drive D2C planning)

---

## Base configuration

- **Base name:** `{Label} D2C Activations` (replace `{Label}` with your label name)
- **Workspace:** Campaign Operations (or label equivalent)
- **Working window:** rolling 12 months — set start month at base creation
- **Color theme:** default; color logic lives in field-level option colors and the `Color Override` field

---

## Table 1: `Activations`

### Fields (in order)

| # | Field Name | Type | Configuration |
|---|------------|------|---------------|
| 1 | **Name** | Single line text (Primary) | Format: `{Artist} — {Initiative}` for artist activations; just `{Initiative}` for shop / cultural moments |
| 2 | **Artist** | Single line text | Leave blank for cultural moments and shop-wide initiatives |
| 3 | **Initiative** | Single line text | The thing happening (e.g. "Anthology Vinyl Pre-Order", "Mother's Day Collection") |
| 4 | **Category** | Single select | See option list below |
| 5 | **Status** | Single select | See option list below |
| 6 | **Acquisition Target** | Checkbox | TRUE if D2C merch rights are not yet secured for this entry. Applies to merch entries only — never to album/single release rows |
| 7 | **Year** | Number (integer) | e.g. 2026 / 2027 |
| 8 | **Month** | Single select | January–December |
| 9 | **Date Text** | Single line text | Free-form: `April 3`, `End of June`, `Q3 launch`, `Mother's Day weekend` |
| 10 | **Notes** | Long text | Bulleted context. What it is · Anchor (album cycle? cultural?) · Partner · Channel · Risks |
| 11 | **Source** | Single select | Department or person submitting the entry |
| 12 | **Color Override** | Single line text | Optional manual hex color for dashboard rendering |
| 13 | **ODA Goal** | Number | Owned data acquisition target (email captures, phone numbers, etc.) — leave blank if not applicable |

---

### Option lists

**Category** (single select):
- Official Releases
- Merch Drop
- Shop Initiative
- Additional Music Product
- Cultural Moment

**Status** (single select):
- Confirmed
- Planned
- Exploring
- Cancelled

**Month** (single select):
- January, February, March, April, May, June, July, August, September, October, November, December

**Source** (single select — customize per label):
- A&R
- Release Planning
- Commercial Partnerships
- D2C / E-commerce
- Shop
- Brand Partnerships
- Other

---

## Naming conventions

- **Name field:** Always populate. This is the primary key used by the dashboard.
  - For an artist activation: `{Artist} — {Initiative}` (em dash, not hyphen)
  - For a shop or cultural moment: just `{Initiative}` (no artist prefix)
  - Examples:
    - `Artist Name — Anthology Vinyl Pre-Order`
    - `Father's Day Collection`
    - `Holiday Bundle Drop`

- **Artist field:** Must match the canonical artist name exactly (case-sensitive). If your label has a roster table elsewhere, this field should match that table's primary key — that makes future linking trivial.

- **Initiative field:** Short, scannable. Avoid duplicating information already in Category.

---

## Validation rules (recommended)

These can be implemented as Airtable views, automations, or human review:

1. **No empty Status.** Every row needs Status set.
2. **Acquisition Target only on merch.** If `Category = Merch Drop` or `Additional Music Product`, Acquisition Target is allowed. Otherwise it must be FALSE.
3. **Month must match Date Text.** If Date Text says "April 3", Month must be April.
4. **ODA Goal optional but useful.** Encourage filling in for any acquisition-driving initiative.
5. **Source must be set.** Tells you who owns the row.

---

## What's NOT in this schema (and why)

Intentional minimum viable schema. Things deliberately left out:

- **Linked roster table.** Artist is a text field, not a link, to keep the schema standalone. Add a linked roster table later if you want artist-level rollups.
- **Channel / Partner fields.** D2C in this schema means the label's own D2C — shop, mailing list, owned email. If you want to track DSP partners or external retailers, add those fields, but they're outside the D2C definition.
- **Budget / spend.** P&L is not Campaign Operations territory. Track elsewhere.
- **Automated status flags.** No formulas yet. Add them once the table has six months of real data and you know what you want flagged.

---

## Migration path to a Sony-owned base

When the data layer moves from a label-workspace Airtable to Sony-enterprise Airtable (or Dataverse), this schema spec is the migration document. The base gets rebuilt from this file — not copy-pasted from the existing UI.

For Dataverse migration, all single-select fields become choice columns and the schema maps 1:1.

---

*Schema v1.0 · D2C Activations · Sony Music Entertainment internal use*
