// Read-only proxy for the Creative Ticket Types table (Campaign Ops sandbox base).
// GET /api/creative-tickets → returns all rows.
// Password-gated via X-Grid-Password header. The only secret is the token, which
// stays in Netlify env. Base/table IDs are not credentials, so they default here.
// Same pattern as ideas-records.mjs / airtable-records.mjs.

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

export default async (req) => {
  const BASE_ID = readEnv('CT_BASE_ID') || 'appLwUF3H4KjtiRdW';
  const TABLE_ID = readEnv('CT_TABLE_ID') || 'tblWIAkg07zrksJln';
  const PASSWORD = readEnv('GRID_PASSWORD') || readEnv('CT_PASSWORD') || 'RCA2026';
  // Reuse an existing server-side token. Try the dedicated var first, then the
  // tokens the other live pages already use.
  const TOKEN = readEnv('CT_TOKEN') || readEnv('PHASE1_TOKEN') || readEnv('AIRTABLE_TOKEN');

  if (!TOKEN) {
    return jsonResponse(500, { error: 'misconfigured', missing: ['CT_TOKEN / PHASE1_TOKEN / AIRTABLE_TOKEN'] });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
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
      if (pageCount > 20) break;
    } while (offset);

    return jsonResponse(200, { records: allRecords, count: allRecords.length });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

export const config = {
  path: '/api/creative-tickets'
};
