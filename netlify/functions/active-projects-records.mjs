// Read + write proxy for the Active Projects exec-context base.
// GET   /api/active-projects        → all 12 records (artist, dates, follow-ups, Tarek/Jordan context)
// PATCH /api/active-projects         → body: { recordId, who: 'tarek'|'jordan', context } → updates that person's field
// Password-gated via X-Grid-Password header. Token/base/table live in env, with safe defaults.
// Writing requires the Airtable token to have data.records:write on base appCDKRkljLKSu211.

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

// Field IDs on tblMuzMNUsF7eDajh — written/read by ID so the em-dash field names can't bite us.
const F = {
  artist:    'fld3pSi7kjXA0udS8',
  priority:  'fldaiHgPcqEwfhGgj',
  dates:     'fldBbgSD5z3j98PLg',
  followups: 'fldhlXbHNKFx3N7cI',
  answered:  'fldIsV58ITaffFim3',
  tarek:     'fldhvgyQif8aaCDmE',
  jordan:    'fldYqwomxW6UNfH0L',
  status:    'fldTKYhwA2H9nVnaq'
};

const WHO_FIELD = { tarek: F.tarek, jordan: F.jordan };

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, PATCH, OPTIONS',
  'access-control-allow-headers': 'X-Grid-Password, Content-Type',
  'access-control-max-age': '86400'
};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const BASE_ID  = readEnv('AP_BASE_ID')  || 'appCDKRkljLKSu211';
  const TABLE_ID = readEnv('AP_TABLE_ID') || 'tblMuzMNUsF7eDajh';
  const PASSWORD = readEnv('AP_PASSWORD') || readEnv('GRID_PASSWORD') || 'rca2026';
  // Reuse whichever Airtable token Netlify already holds; AP_TOKEN lets Meg point at a base-scoped one if needed.
  const TOKEN = readEnv('AP_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN') || readEnv('CAMPAIGNS_TOKEN');

  if (!TOKEN) {
    return json(500, { error: 'misconfigured', missing: ['no Airtable token env var found (AP_TOKEN / AIRTABLE_TOKEN / PHASE1_TOKEN / CAMPAIGNS_TOKEN)'] });
  }

  // Password gate — header must match
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) {
    return json(401, { error: 'unauthorized' });
  }

  if (req.method === 'GET')   return handleGet(BASE_ID, TABLE_ID, TOKEN);
  if (req.method === 'PATCH') return handlePatch(req, BASE_ID, TABLE_ID, TOKEN);
  return json(405, { error: 'method_not_allowed' });
};

async function handleGet(baseId, tableId, token) {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}?pageSize=100&returnFieldsByFieldId=true`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const t = await res.text();
      return json(502, { error: 'airtable_error', op: 'read', status: res.status, detail: t.substring(0, 400) });
    }
    const data = await res.json();
    const records = (data.records || []).map(r => ({
      id: r.id,
      artist:   r.fields?.[F.artist]    || '',
      priority: r.fields?.[F.priority]  ?? 9999,
      tarek:    r.fields?.[F.tarek]     || '',
      jordan:   r.fields?.[F.jordan]    || ''
    })).sort((a, b) => a.priority - b.priority);
    return json(200, { records, count: records.length });
  } catch (e) {
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
}

async function handlePatch(req, baseId, tableId, token) {
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'invalid_json' }); }

  const { recordId, who, context } = body || {};
  if (!recordId || typeof recordId !== 'string' || !recordId.startsWith('rec')) {
    return json(400, { error: 'invalid_record_id' });
  }
  const fieldId = WHO_FIELD[String(who).toLowerCase()];
  if (!fieldId) {
    return json(400, { error: 'invalid_who', allowed: ['tarek', 'jordan'] });
  }
  // Allow empty string (clearing a note); cap length so nobody pastes a novel.
  const value = typeof context === 'string' ? context.slice(0, 5000) : '';

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}/${recordId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { [fieldId]: value }, returnFieldsByFieldId: true })
    });
    if (!res.ok) {
      const t = await res.text();
      return json(502, { error: 'airtable_error', op: 'write', status: res.status, detail: t.substring(0, 400) });
    }
    const data = await res.json();
    return json(200, { ok: true, recordId: data.id, who: String(who).toLowerCase() });
  } catch (e) {
    return json(500, { error: 'patch_failed', message: String(e) });
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS_HEADERS }
  });
}

export const config = {
  path: '/api/active-projects'
};
