# RCA Label Operations — File Naming Convention

---

## Pattern

```
RCA_[DocType]_[Topic]_[Date]_v[#].[ext]
```

**Prefix:** Always `RCA_`

**DocType:** What kind of document it is

| DocType | Used For |
|---------|----------|
| `GoalBrief` | Pre-meeting goal briefs |
| `MeetingNotes` | Post-meeting notes |
| `PrepPackage` | Pre-meeting prep packages |
| `SessionHandoff` | Claude session handoff files |
| `ArtistVisibilityDemo` | Interactive artist demo |
| `RolloutGuide` | Implementation rollout guide |
| `CommsPlaybook` | Communications + automation playbook |
| `AirtableGridDemo` | Airtable-faithful grid demo |
| `AtlanticUK_Reference` | Atlantic UK case study |
| `SystemPlan` | System architecture plan (archived) |
| `LifecycleDemo` | Lifecycle demo (archived) |
| `Changelog` | Project changelog |
| `DocumentDirectory` | File inventory |
| `CopilotSetup` | Copilot/agent setup instructions |
| `NamingConvention` | This file |

**Topic:** What it's about (optional — omit if the DocType is specific enough)
- `ActiveProjects` — active projects meeting
- `FeeStructure` — fee structure review
- `AirtableDashboard` — Airtable system work

**Date:** `YYYY-MM-DD` format. Include for dated docs (meetings, handoffs). Omit for living docs (demo, guides, playbooks).

**Version:** `_v[#]` — always present. Increment when updating.

**Archive suffix:** `_ARCHIVED` — append when moving to 04_Archive.

---

## Examples

### When you create a new version:
```
Current:  RCA_RolloutGuide_v1.html
Updated:  RCA_RolloutGuide_v2.html  ← rename the file, update in place
```

### When you create a new meeting doc:
```
RCA_GoalBrief_ActiveProjects_2026-03-11_v1.html
RCA_GoalBrief_ActiveProjects_2026-03-18_v1.html  ← new date, v1
```

### When you revise a meeting doc after the meeting:
```
RCA_MeetingNotes_ActiveProjects_2026-03-04_v5.html  ← current
RCA_MeetingNotes_ActiveProjects_2026-03-04_v6.html  ← if revised again
```

### When you archive a file:
```
Move to 04_Archive, append _ARCHIVED:
RCA_SystemPlan_v4_ARCHIVED.html
```

---

## Folder Rules

| Folder | Versioning | Naming |
|--------|-----------|--------|
| **00_Project_Files** | Living docs — overwrite in place, bump `_v#` | No date (always current) |
| **01_Rollout_Package** | Living docs — overwrite in place, bump `_v#` | No date (always current) |
| **02_Meeting_Docs** | Dated, never overwritten — new file per meeting | Always has `YYYY-MM-DD` |
| **03_Reference** | Rarely changed — bump `_v#` if updated | Date optional |
| **04_Archive** | Never changed — frozen in time | Append `_ARCHIVED` |
| **05_Session_Handoffs** | One per session — never revised | Always has `YYYY-MM-DD` |
