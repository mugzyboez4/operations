// Read-only proxy to the Epic D2C Activations Airtable base.
// Password-gated: only requests bearing the correct X-Grid-Password header are served.
// Token, base ID, table ID, and password live in Netlify env vars — never in client code.

function readEnv(key) {
  // Netlify's new function runtime exposes env via Netlify.env.get(); Node fallback via process.env.
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
  const EPIC_AIRTABLE_BASE_ID = readEnv('EPIC_AIRTABLE_BASE_ID');
  const EPIC_AIRTABLE_TABLE_ID = readEnv('EPIC_AIRTABLE_TABLE_ID');
  const EPIC_AIRTABLE_TOKEN = readEnv('EPIC_AIRTABLE_TOKEN');
  const EPIC_GRID_PASSWORD = readEnv('EPIC_GRID_PASSWORD');

  // Sanity check: bail loudly if env is misconfigured, naming exactly which vars are missing
  const missing = [];
  if (!EPIC_AIRTABLE_BASE_ID) missing.push('EPIC_AIRTABLE_BASE_ID');
  if (!EPIC_AIRTABLE_TABLE_ID) missing.push('EPIC_AIRTABLE_TABLE_ID');
  if (!EPIC_AIRTABLE_TOKEN) missing.push('EPIC_AIRTABLE_TOKEN');
  if (!EPIC_GRID_PASSWORD) missing.push('EPIC_GRID_PASSWORD');
  if (missing.length > 0) {
    // Useful diagnostic about runtime context
    const hasNetlifyGlobal = typeof Netlify !== 'undefined';
    const hasNetlifyEnv = hasNetlifyGlobal && typeof Netlify.env !== 'undefined';
    const hasProcessEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined';
    return jsonResponse(500, {
      error: 'misconfigured',
      missing,
      runtime: { hasNetlifyGlobal, hasNetlifyEnv, hasProcessEnv }
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate — header must match EPIC_GRID_PASSWORD env var
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== EPIC_GRID_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const url = `https://api.airtable.com/v0/${EPIC_AIRTABLE_BASE_ID}/${EPIC_AIRTABLE_TABLE_ID}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${EPIC_AIRTABLE_TOKEN}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        return jsonResponse(502, {
          error: 'airtable_error',
          status: res.status,
          detail: errText.substring(0, 500)
        });
      }
      const data = await res.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
      pageCount += 1;
      if (pageCount > 20) break; // safety: never paginate more than 2000 records
    } while (offset);

    return jsonResponse(200, { records: allRecords, count: allRecords.length });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
}

export const config = {
  path: '/api/records'
};
