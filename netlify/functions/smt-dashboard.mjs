// Read-only proxy to Airtable for the SMT Dashboard.
// Reads Artists with smt_briefing field populated. Returns structured card data
// for the executive dashboard at /smt/live/.
//
// Password-gated via X-Grid-Password header. Token is server-side only.

const BASE_ID = 'appLwUF3H4KjtiRdW';   // RCA Records (Copy)
const TABLE_ID = 'tblV9HXEZ5k6uFXFQ';  // Artists

// Field IDs (stable across renames)
const FLD_NAME            = 'fld8PER8PqVHcZBFh';  // Name (primary)
const FLD_IMAGE           = 'fldRXJGMzyRRbGKEL';  // Image
const FLD_PHASE           = 'fldAQqe7HO3N9dBS1';  // Phase (singleSelect: Prep/Plan/Announce/Release/Review)
const FLD_RELEASE_CONFIG  = 'fldPJCxHCqOHu6Bu5';  // Release Config (text)
const FLD_AGENDA_NOTES    = 'fldU72qNnZIaiUvIg';  // Agenda Notes (multilineText) - fallback for issues
const FLD_SMT_BRIEFING    = 'SMT Briefing';       // NEW (Meg needs to add this) — JSON blob with full card data
const FLD_SMT_ORDER       = 'SMT Order';          // NEW — display order on dashboard (number)

// Phase rename map: old singleSelect values → new dashboard labels (per Jordan 5/12 directive)
const PHASE_MAP = {
  'Prep': 'PREP',
  'Plan': 'PLAN',
  'Announce': 'LAUNCH',  // Jordan rename pending
  'Release': 'RELEASE',
  'Review': 'ACTIVE',    // Jordan rename pending
};

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

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  const AIRTABLE_TOKEN = readEnv('AIRTABLE_TOKEN');
  const ROSTER_PASSWORD = readEnv('ROSTER_PASSWORD');

  const missing = [];
  if (!AIRTABLE_TOKEN) missing.push('AIRTABLE_TOKEN');
  if (!ROSTER_PASSWORD) missing.push('ROSTER_PASSWORD');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== ROSTER_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    // Fetch records where "SMT Briefing" field is non-empty.
    // Note: filter uses field NAMES (not IDs) because Airtable's filterByFormula needs names.
    const filterFormula = encodeURIComponent("NOT({SMT Briefing} = '')");
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}` +
      `?pageSize=20&filterByFormula=${filterFormula}` +
      `&sort[0][field]=SMT Order&sort[0][direction]=asc`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse(502, {
        error: 'airtable_error',
        status: res.status,
        detail: errText.substring(0, 500),
        hint: "Likely missing 'SMT Briefing' or 'SMT Order' field on Artists table. See setup doc."
      });
    }

    const data = await res.json();
    const cards = (data.records || []).map(parseRecord).filter(Boolean);

    // Compute phase counts for the top strip
    const phaseCounts = { PREP: 0, PLAN: 0, LAUNCH: 0, RELEASE: 0, ACTIVE: 0 };
    cards.forEach(c => {
      if (phaseCounts[c.phase] !== undefined) phaseCounts[c.phase]++;
    });

    return jsonResponse(200, {
      generated: new Date().toISOString(),
      count: cards.length,
      phase_counts: phaseCounts,
      cards
    });

  } catch (e) {
    return jsonResponse(500, { error: 'function_error', detail: String(e) });
  }
};

function parseRecord(r) {
  const f = r.fields || {};
  let briefing = {};
  try {
    briefing = JSON.parse(f['SMT Briefing'] || '{}');
  } catch (e) {
    briefing = { parse_error: String(e) };
  }

  const rawPhase = f['Phase'] || briefing.phase || '';
  const phase = PHASE_MAP[rawPhase] || rawPhase.toUpperCase() || 'PLAN';

  // Photo: take first attachment, prefer 'large' thumbnail
  let photo = null;
  if (Array.isArray(f['Image']) && f['Image'][0]) {
    const att = f['Image'][0];
    photo = att.thumbnails?.large?.url || att.url || null;
  }

  return {
    id: r.id,
    name: f['Name'] || '',
    photo,
    phase,
    project: briefing.project || f['Release Config'] || '',
    project_meta: briefing.project_meta || '',
    big_stat: briefing.big_stat || null,  // { value, label }
    results: briefing.results || [],       // [[value, label], ...]
    issues: briefing.issues || [],         // ["...", ...]
    order: f['SMT Order'] || 99
  };
}

export const config = {
  path: '/api/smt-dashboard'
};
