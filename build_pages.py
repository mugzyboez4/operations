#!/usr/bin/env python3
"""Generate the three bucket task tracker pages"""

TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Campaign Ops — {title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
:root{{--bg:#0F0E0E;--card:#1A1A1A;--w:#FCFDF8;--lime:#CDF851;--flame:#FF4A23;--teal:#5BC0BE;--gold:#E8C547;--fog:#B0A9BE;--slate:#3E3F41;--border:#2A2A2A;--accent:{color}}}
html,body{{background:var(--bg);color:var(--w);font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}}
nav{{display:flex;align-items:center;padding:14px 32px;border-bottom:1px solid var(--border);gap:20px;position:sticky;top:0;background:var(--bg);z-index:50;flex-wrap:wrap}}
nav .logo{{font-size:13px;font-weight:900;letter-spacing:-.5px;text-transform:uppercase}}
nav .logo span{{color:var(--lime)}}
nav a{{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--fog);text-decoration:none;padding:5px 10px;border:1px solid transparent;transition:all .15s}}
nav a:hover{{color:var(--w);border-color:var(--border)}}
nav a.active{{color:var(--accent);border-color:var(--accent)}}

.header{{padding:32px 32px 20px}}
.eyebrow{{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:8px}}
.title{{font-size:48px;font-weight:900;letter-spacing:-2px;line-height:.95;text-transform:uppercase;margin-bottom:8px}}
.sub{{font-size:13px;color:var(--fog);max-width:600px;margin-bottom:20px}}

/* Stats */
.stats{{display:flex;gap:24px;padding:0 32px 20px;border-bottom:1px solid var(--border)}}
.stat .n{{font-size:22px;font-weight:900;letter-spacing:-1px}}
.stat .l{{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:1.5px;text-transform:uppercase;color:var(--fog)}}

/* Task list */
.tasks{{padding:20px 32px}}
.task{{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--card);border:1px solid var(--border);margin-bottom:4px;transition:all .15s}}
.task:hover{{border-color:var(--fog)}}
.task.done{{opacity:.4}}
.task.done .task-name{{text-decoration:line-through;text-decoration-color:var(--slate)}}
.task-check{{width:20px;height:20px;border:2px solid var(--slate);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}}
.task-check:hover{{border-color:var(--accent)}}
.task.done .task-check{{background:var(--accent);border-color:var(--accent)}}
.task.done .task-check::after{{content:'✓';color:var(--bg);font-size:12px;font-weight:900}}
.task-name{{font-size:13px;font-weight:600;flex:1}}
.task-name.editing{{background:var(--bg);padding:4px 8px;outline:1px solid var(--accent);color:var(--w)}}
.task-status{{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;flex-shrink:0}}
.task-status.active{{color:var(--gold);background:#2a2a1a}}
.task-status.next{{color:var(--fog);background:var(--bg)}}
.task-status.blocked{{color:var(--flame);background:#2a1a1a}}
.task-status.done{{color:var(--lime);background:#1a2a1a}}
.task-owner{{font-family:'DM Mono',monospace;font-size:9px;color:var(--fog);flex-shrink:0;width:30px;text-align:center}}
.task-delete{{color:var(--slate);cursor:pointer;font-size:14px;opacity:0;transition:opacity .15s;flex-shrink:0}}
.task:hover .task-delete{{opacity:1}}

/* Add task */
.add-bar{{display:flex;gap:8px;padding:12px 32px 32px}}
.add-input{{flex:1;background:var(--card);border:1px solid var(--border);color:var(--w);padding:10px 14px;font-family:'Inter',sans-serif;font-size:13px;outline:none}}
.add-input:focus{{border-color:var(--accent)}}
.add-input::placeholder{{color:var(--slate)}}
.add-btn{{background:var(--accent);color:var(--bg);border:none;padding:10px 20px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;cursor:pointer}}
.add-btn:hover{{opacity:.8}}
select{{background:var(--card);border:1px solid var(--border);color:var(--fog);padding:10px;font-family:'DM Mono',monospace;font-size:10px;outline:none;cursor:pointer}}

.footer{{padding:24px 32px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:9px;color:var(--slate)}}
.footer .tag{{color:var(--teal);font-style:italic}}
</style>
</head>
<body>

<nav>
  <div class="logo">Campaign <span>Ops</span></div>
  <a href="/">Roadmap</a>
  <a href="/innovation.html" class="{nav_inn}">Innovation</a>
  <a href="/pm.html" class="{nav_pm}">Project Management</a>
  <a href="/systems.html" class="{nav_sys}">Systems</a>
  <a href="/resources.html">Resources</a>
</nav>

<div class="header">
  <div class="eyebrow">Campaign Operations · {bucket_upper}</div>
  <div class="title">{title_display}</div>
  <div class="sub">{description}</div>
</div>

<div class="stats" id="stats"></div>

<div class="tasks" id="tasks"></div>

<div class="add-bar">
  <input class="add-input" id="newTask" placeholder="Add a new task..." onkeydown="if(event.key==='Enter')addTask()">
  <select id="newStatus">
    <option value="active">Active</option>
    <option value="next">Next</option>
    <option value="blocked">Blocked</option>
  </select>
  <select id="newOwner">
    <option value="M">Meg</option>
    <option value="C">Christian</option>
  </select>
  <button class="add-btn" onclick="addTask()">+ Add</button>
</div>

<div class="footer">
  <span>Campaign Operations · {title} · May 2026</span>
  <span class="tag">Building together.</span>
</div>

<script>
const STORAGE_KEY = '{storage_key}';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {default_tasks};

function render() {{
  const el = document.getElementById('tasks');
  const done = tasks.filter(t => t.done).length;
  const active = tasks.filter(t => !t.done && t.status === 'active').length;
  const blocked = tasks.filter(t => !t.done && t.status === 'blocked').length;
  const next = tasks.filter(t => !t.done && t.status === 'next').length;

  document.getElementById('stats').innerHTML = `
    <div class="stat"><div class="n" style="color:var(--lime)">${{done}}</div><div class="l">Done</div></div>
    <div class="stat"><div class="n" style="color:var(--gold)">${{active}}</div><div class="l">Active</div></div>
    <div class="stat"><div class="n" style="color:var(--flame)">${{blocked}}</div><div class="l">Blocked</div></div>
    <div class="stat"><div class="n" style="color:var(--fog)">${{next}}</div><div class="l">Next</div></div>
  `;

  el.innerHTML = tasks.map((t, i) => `
    <div class="task ${{t.done ? 'done' : ''}}" data-i="${{i}}">
      <div class="task-check" onclick="toggle(${{i}})"></div>
      <div class="task-name" contenteditable="true" onblur="rename(${{i}}, this.textContent)">${{t.name}}</div>
      <div class="task-status ${{t.status}}" onclick="cycleStatus(${{i}})">${{t.status.toUpperCase()}}</div>
      <div class="task-owner">${{t.owner}}</div>
      <div class="task-delete" onclick="del(${{i}})">×</div>
    </div>
  `).join('');
}}

function save() {{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }}
function toggle(i) {{ tasks[i].done = !tasks[i].done; if(tasks[i].done) tasks[i].status = 'done'; else tasks[i].status = 'active'; save(); render(); }}
function rename(i, v) {{ tasks[i].name = v.trim(); save(); }}
function del(i) {{ tasks.splice(i, 1); save(); render(); }}
function cycleStatus(i) {{
  const order = ['active','next','blocked'];
  const cur = order.indexOf(tasks[i].status);
  tasks[i].status = order[(cur + 1) % order.length];
  save(); render();
}}
function addTask() {{
  const input = document.getElementById('newTask');
  const status = document.getElementById('newStatus').value;
  const owner = document.getElementById('newOwner').value;
  if (!input.value.trim()) return;
  tasks.unshift({{ name: input.value.trim(), status, owner, done: false }});
  input.value = '';
  save(); render();
}}

render();
</script>
</body>
</html>'''

# ============ INNOVATION ============
innovation_tasks = [
    {"name": "Azure Foundry — API connections for Airtable/Chartmetric", "status": "active", "owner": "M", "done": False},
    {"name": "RDX production access — escalate via Mike Chang → Jacob", "status": "blocked", "owner": "G", "done": False},
    {"name": "Creatorcore — book demo, check Copilot for existing Sony relationship", "status": "next", "owner": "M", "done": False},
    {"name": "Benchmarking — Crawley data feed into Streamlit/Snowflake", "status": "active", "owner": "M", "done": False},
    {"name": "D2C Strategy — 12-month Greenhouse timeline", "status": "next", "owner": "M", "done": False},
    {"name": "Artist Insights V7 — Crawley rules integration", "status": "done", "owner": "M", "done": True},
    {"name": "Spend Intelligence Framework — Layer 3 gap (Console ↔ streaming)", "status": "next", "owner": "M", "done": False},
]

# ============ PROJECT MANAGEMENT ============
pm_tasks = [
    {"name": "Stage-Gate deck — Jordan review this week", "status": "active", "owner": "M", "done": False},
    {"name": "Stage-Gate deck — Fleck presentation (after Jordan)", "status": "next", "owner": "M", "done": False},
    {"name": "Weekly cadence — launch Tue Workability Check (May 12)", "status": "next", "owner": "M", "done": False},
    {"name": "Weekly cadence — launch Mon Foundation Room (May 19)", "status": "next", "owner": "M", "done": False},
    {"name": "DELIVER Wrap — first real Friday population", "status": "next", "owner": "M", "done": False},
    {"name": "Lizzy McAlpine — stage-gate pilot through G1-G4", "status": "active", "owner": "M", "done": False},
    {"name": "Budget framework — Maegan pre-read May 9", "status": "active", "owner": "M", "done": False},
    {"name": "Aud Dev lanes — Tarek conversation (blocked)", "status": "blocked", "owner": "M", "done": False},
    {"name": "Dept workflows — Creative/Niki meeting after lanes ships", "status": "next", "owner": "M", "done": False},
    {"name": "Stage-gate checklist v0 — Marketing, Creative, Radio", "status": "active", "owner": "C", "done": False},
    {"name": "Lane Definition V2 — shipped", "status": "done", "owner": "M", "done": True},
    {"name": "CL Submissions — pilot shipped", "status": "done", "owner": "M", "done": True},
    {"name": "AP Recap system — shipped", "status": "done", "owner": "M", "done": True},
    {"name": "Meeting Design research — shipped", "status": "done", "owner": "M", "done": True},
    {"name": "Meeting templates (Ritual Spine) — shipped", "status": "done", "owner": "M", "done": True},
]

# ============ SYSTEMS ============
systems_tasks = [
    {"name": "Airtable artist detail page rebuild", "status": "active", "owner": "G", "done": False},
    {"name": "Airtable — Phase + Meeting + Gate Status fields", "status": "next", "owner": "G", "done": False},
    {"name": "Airtable — team feedback survey (what do you always need?)", "status": "active", "owner": "G", "done": False},
    {"name": "Val knowledge capture — URGENT before departure", "status": "blocked", "owner": "G", "done": False},
    {"name": "Christian — Airtable view access + backend training", "status": "active", "owner": "C", "done": False},
    {"name": "SharePoint hub — EOD Drop flow", "status": "active", "owner": "G", "done": False},
    {"name": "CARMA Combined Rights Master — Airtable import", "status": "next", "owner": "G", "done": False},
    {"name": "Campaign timelines tool — deployed", "status": "done", "owner": "M", "done": True},
    {"name": "TEMPO site — archive v1, launch v2", "status": "active", "owner": "M", "done": False},
    {"name": "Workability tracking — live Runway connection", "status": "next", "owner": "G", "done": False},
]

import json

pages = [
    {
        'filename': 'innovation.html',
        'title': 'Innovation',
        'title_display': 'INNOV<span style="color:var(--accent)">ATION</span>',
        'bucket_upper': 'INNOVATION',
        'color': '#FF4A23',
        'description': "New capabilities. Foundry, AI agents, RDX, Creatorcore, benchmarking. The stuff that doesn't exist yet.",
        'storage_key': 'camops_innovation',
        'default_tasks': json.dumps(innovation_tasks),
        'nav_inn': 'active', 'nav_pm': '', 'nav_sys': '',
    },
    {
        'filename': 'pm.html',
        'title': 'Project Management',
        'title_display': 'PROJECT<span style="color:var(--accent)"> MGMT</span>',
        'bucket_upper': 'PROJECT MANAGEMENT',
        'color': '#CDF851',
        'description': 'Making work move predictably. Stage-gate rollout, meetings, briefs, lanes, artist lifecycle.',
        'storage_key': 'camops_pm',
        'default_tasks': json.dumps(pm_tasks),
        'nav_inn': '', 'nav_pm': 'active', 'nav_sys': '',
    },
    {
        'filename': 'systems.html',
        'title': 'Systems',
        'title_display': 'SYS<span style="color:var(--accent)">TEMS</span>',
        'bucket_upper': 'SYSTEMS',
        'color': '#5BC0BE',
        'description': 'Infrastructure. Airtable, SharePoint, TEMPO, CARMA, workability tracking. The plumbing that connects everything.',
        'storage_key': 'camops_systems',
        'default_tasks': json.dumps(systems_tasks),
        'nav_inn': '', 'nav_pm': '', 'nav_sys': 'active',
    },
]

for page in pages:
    html = TEMPLATE.format(**page)
    with open(page['filename'], 'w') as f:
        f.write(html)
    print(f"Built {page['filename']} with {len(json.loads(page['default_tasks']))} tasks")

print("Done — all three bucket pages built")
PYEOF