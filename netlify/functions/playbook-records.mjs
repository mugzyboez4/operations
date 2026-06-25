// Public READ-ONLY proxy for the TikTok + Meta "Playbook" table.
// GET /api/playbook-records -> returns the playbook rows with ONLY safe public fields.
//
// Why this exists: the Partner Marketing TikTok+Meta training guide renders this
// table live. Read-only, no editing, no password -- nothing sensitive in page source.
//
// SAFETY: a server-side field whitelist is enforced below. Add a field to SAFE_FIELDS
// only if it is safe to publish to anyone who can read the guide.
//
// The "TikTok + Meta Transition" base (appbI8snP3c7vZM6k) and table ids are not secret,
// so they are hardcoded (overridable via PLAYBOOK_BASE_ID). The Airtable PAT is read
// from AIRTABLE_TOKEN (the master token already set on the site).

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

// Playbook table in the TikTok + Meta Transition base.
const TABLE_ID = 'tbln6QVK1QCLLGEFo';
const DEFAULT_BASE_ID = 'appbI8snP3c7vZM6k';

// The ONLY fields ever returned to the browser. Everything else is dropped.
const SAFE_FIELDS = ['Topic', 'Platform', 'Area', 'How it works', 'Owner going forward', 'Notes'];

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'access-control-max-age': '86400'
};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const BASE_ID = readEnv('PLAYBOOK_BASE_ID') || DEFAULT_BASE_ID;
  const TOKEN = readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN');
  const missing = [];
  if (!BASE_ID) missing.push('PLAYBOOK_BASE_ID');
  if (!TOKEN) missing.push('AIRTABLE_TOKEN');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      if (!res.ok) {
        const errText = await res.text();
        return jsonResponse(502, { error: 'airtable_error', status: res.status, detail: errText.substring(0, 500) });
      }
      const data = await res.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
      pageCount += 1;
      if (pageCount > 5) break;
    } while (offset);

    // Strip to safe fields only. Single-selects come back as { name } -- flatten to a string.
    const safe = allRecords.map((rec) => {
      const out = { id: rec.id, fields: {} };
      for (const key of SAFE_FIELDS) {
        const v = rec.fields ? rec.fields[key] : undefined;
        if (v === undefined || v === null) continue;
        if (typeof v === 'object' && !Array.isArray(v) && typeof v.name === 'string') {
          out.fields[key] = v.name;
        } else {
          out.fields[key] = v;
        }
      }
      return out;
    });

    return jsonResponse(200, { records: safe, count: safe.length });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store', ...CORS_HEADERS
    }
  });
}

export const config = {
  path: '/api/playbook-records'
};
