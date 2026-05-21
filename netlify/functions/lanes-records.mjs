// Read-only proxy to the Lane Definitions Airtable table.
// Mirrors the ad-tagging-records.mjs / airtable-records.mjs pattern.
// Password gate + server-side token. No PAT ever reaches the browser.
//
// Env vars (Netlify):
//   LANES_BASE_ID     — appLwUF3H4KjtiRdW (Campaign Ops sandbox)
//   LANES_TABLE_NAME  — "Lane Definitions" (or tbl-id, either works)
//   LANES_TOKEN       — Airtable PAT, read-only, scoped to lanes base
//   LANES_PASSWORD    — page password (matches site gate, e.g. RCA2026)

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
  const BASE_ID = readEnv('LANES_BASE_ID');
  const TABLE_NAME = readEnv('LANES_TABLE_NAME') || 'Lane Definitions';
  const TOKEN = readEnv('LANES_TOKEN');
  const PASSWORD = readEnv('LANES_PASSWORD');

  const missing = [];
  if (!BASE_ID) missing.push('LANES_BASE_ID');
  if (!TOKEN) missing.push('LANES_TOKEN');
  if (!PASSWORD) missing.push('LANES_PASSWORD');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate — header must match LANES_PASSWORD
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const apiUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
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
      if (pageCount > 20) break; // safety
    } while (offset);

    return jsonResponse(200, {
      records: allRecords,
      count: allRecords.length,
      table: TABLE_NAME
    });
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
  path: '/api/lanes-records'
};
