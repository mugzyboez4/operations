// Read-only proxy to the Active Projects Cockpit Airtable base.
// Assembles 4 tables (Artists, AP Items, Artist KPIs, RR Releases) into a single
// JSON shape consumable by /cockpit.html. Password-gated via X-Grid-Password header.
//
// Env vars (set in Netlify):
//   AIRTABLE_TOKEN     - Airtable PAT with read access to the Cockpit base
//   COCKPIT_BASE_ID    - Base ID, e.g. app2RsHO0Erdgrl22
//   GRID_PASSWORD      - shared secret matching the X-Grid-Password header

function readEnv(key) {
  try {
    if (typeof Netlify !== 'undefined' && Netlify.env && typeof Netlify.env.get === 'function') {
      const v = Netlify.env.get(key);
      if (v) return v;
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return null;
}

// Hard-coded table IDs from the Cockpit base. If the base changes, update here.
const TABLE_IDS = {
  artists:  'tblMoNqrlZinkDdA8',
  apItems:  'tbl42n24W4caqEwv8',
  kpis:     'tblM3CFSHqneZXCFw',
  releases: 'tblkFycjJThhC3yOy',
};

const SECTIONS = [
  { name: 'Upcoming / Recent Releases', short: 'S1', label: 'Section 01 \u00b7 Upcoming / Recent Releases' },
  { name: 'Campaigns',                  short: 'S2', label: 'Section 02 \u00b7 Campaigns' },
  { name: 'Early Check-ins',            short: 'S3', label: 'Section 03 \u00b7 Early Check-ins' },
  { name: 'Trending',                   short: 'S4', label: 'Section 04 \u00b7 Trending' },
];

const PHASE_MAP = {
  'Prep': 'prep',
  'Plan': 'plan',
  'Announce': 'announce',
  'Release': 'release',
  'Review': 'review',
};

async function fetchAllRecords(baseId, tableId, token) {
  const out = [];
  let offset = null;
  let pageCount = 0;
  do {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`airtable ${tableId} ${res.status}: ${txt.substring(0, 200)}`);
    }
    const data = await res.json();
    out.push(...(data.records || []));
    offset = data.offset;
    pageCount += 1;
    if (pageCount > 20) break;
  } while (offset);
  return out;
}

function formatDate(iso) {
  // ISO "2026-06-05" → "Jun 5"
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m[2],10)-1];
  return `${month} ${parseInt(m[3],10)}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function buildCockpit(artists, items, kpis, releases) {
  // Group items by artist name + week (use latest week's items per artist)
  const itemsByArtist = {};
  let latestWeek = null;
  for (const r of items) {
    const f = r.fields || {};
    if (!f['Artist Name'] || !f['Item']) continue;
    if (f['Week'] && (!latestWeek || f['Week'] > latestWeek)) latestWeek = f['Week'];
  }
  for (const r of items) {
    const f = r.fields || {};
    const name = f['Artist Name'];
    if (!name || !f['Item']) continue;
    // Only include items for the latest week (or all if no week)
    if (latestWeek && f['Week'] && f['Week'] !== latestWeek) continue;
    if (!itemsByArtist[name]) itemsByArtist[name] = [];
    itemsByArtist[name].push({
      text: f['Item'],
      owner: f['Owner'] || '',
      order: f['Order'] || 0,
    });
  }
  for (const k of Object.keys(itemsByArtist)) {
    itemsByArtist[k].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Group KPIs by artist (latest week)
  const kpisByArtist = {};
  let latestKpiWeek = null;
  for (const r of kpis) {
    const f = r.fields || {};
    if (f['Week'] && (!latestKpiWeek || f['Week'] > latestKpiWeek)) latestKpiWeek = f['Week'];
  }
  for (const r of kpis) {
    const f = r.fields || {};
    const name = f['Artist Name'];
    if (!name || !f['Label']) continue;
    if (latestKpiWeek && f['Week'] && f['Week'] !== latestKpiWeek) continue;
    if (!kpisByArtist[name]) kpisByArtist[name] = [];
    kpisByArtist[name].push({
      label: f['Label'],
      value: f['Value'] || null,
      meta: f['Meta'] || '',
      order: f['Display Order'] || 0,
    });
  }
  for (const k of Object.keys(kpisByArtist)) {
    kpisByArtist[k].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Build timeline from RR Releases (one event per Pre-Order + one per Release Date)
  const timelineByArtist = {};
  for (const r of releases) {
    const f = r.fields || {};
    const name = f['Artist Name'];
    if (!name) continue;
    if (!timelineByArtist[name]) timelineByArtist[name] = [];
    const focus = f['Focus Track'] ? ' \u2b50' : '';
    if (f['Pre-Order Date']) {
      timelineByArtist[name].push({
        sortKey: f['Pre-Order Date'],
        date: formatDate(f['Pre-Order Date']),
        label: 'Pre-order: ' + (f['Title'] || ''),
      });
    }
    if (f['Release Date']) {
      timelineByArtist[name].push({
        sortKey: f['Release Date'],
        date: formatDate(f['Release Date']),
        label: (f['Title'] || 'Release') + focus,
      });
    }
  }
  // Add Today anchor + dedupe + sort each artist's timeline
  const today = todayISO();
  for (const name of Object.keys(timelineByArtist)) {
    timelineByArtist[name].push({
      sortKey: today,
      date: formatDate(today),
      label: 'Today \u00b7 AP',
      today: true,
    });
    // dedupe by sortKey+label
    const seen = new Set();
    timelineByArtist[name] = timelineByArtist[name].filter(ev => {
      const k = ev.sortKey + '|' + ev.label;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    timelineByArtist[name].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    // strip sortKey from output
    timelineByArtist[name] = timelineByArtist[name].map(ev => ({
      date: ev.date,
      label: ev.label,
      today: !!ev.today,
    }));
  }

  // Build sections with artists
  const sections = SECTIONS.map(s => ({ label: s.label, short: s.short, artists: [] }));

  // Filter active artists, sort by Section + Section Order
  const active = artists
    .filter(a => (a.fields || {})['Active'] !== false)
    .sort((a, b) => {
      const fa = a.fields || {};
      const fb = b.fields || {};
      const sa = SECTIONS.findIndex(s => s.name === fa['Section']);
      const sb = SECTIONS.findIndex(s => s.name === fb['Section']);
      if (sa !== sb) return sa - sb;
      return (fa['Section Order'] || 99) - (fb['Section Order'] || 99);
    });

  for (const a of active) {
    const f = a.fields || {};
    const name = f['Artist Name'];
    const secIdx = SECTIONS.findIndex(s => s.name === f['Section']);
    if (!name || secIdx < 0) continue;

    const timeline = timelineByArtist[name] || [{
      date: formatDate(today),
      label: 'Today \u00b7 AP',
      today: true,
    }];

    sections[secIdx].artists.push({
      name: name,
      preserve: !!f['Preserve Casing'],
      phase: PHASE_MAP[f['Phase']] || 'none',
      items: itemsByArtist[name] || [],
      kpis: kpisByArtist[name] || [],
      timeline: timeline,
      notes: f['Notes'] || '',
    });
  }

  return {
    sections: sections,
    week: latestWeek,
    kpi_week: latestKpiWeek,
    generated_at: new Date().toISOString(),
  };
}

export default async (req) => {
  const TOKEN = readEnv('AIRTABLE_TOKEN');
  const BASE  = readEnv('COCKPIT_BASE_ID') || 'app2RsHO0Erdgrl22';
  const PWD   = readEnv('GRID_PASSWORD');

  const missing = [];
  if (!TOKEN) missing.push('AIRTABLE_TOKEN');
  if (!BASE)  missing.push('COCKPIT_BASE_ID');
  if (!PWD)   missing.push('GRID_PASSWORD');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PWD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    const [artists, items, kpis, releases] = await Promise.all([
      fetchAllRecords(BASE, TABLE_IDS.artists,  TOKEN),
      fetchAllRecords(BASE, TABLE_IDS.apItems,  TOKEN),
      fetchAllRecords(BASE, TABLE_IDS.kpis,     TOKEN),
      fetchAllRecords(BASE, TABLE_IDS.releases, TOKEN),
    ]);

    const payload = buildCockpit(artists, items, kpis, releases);
    return jsonResponse(200, payload);
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export const config = {
  path: '/api/cockpit-data',
};
