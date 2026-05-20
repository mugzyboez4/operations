// Read-only proxy to the RCA AD Tagging Airtable base.
// Mirrors the airtable-records.mjs pattern — password gate + server-side token.
// Accepts ?table=<tableName> query param so a single endpoint can serve multiple tables.

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
  const AD_TAGGING_BASE_ID = readEnv('AD_TAGGING_BASE_ID');
  const AD_TAGGING_TOKEN = readEnv('AD_TAGGING_TOKEN');
  const AD_TAGGING_PASSWORD = readEnv('AD_TAGGING_PASSWORD');

  const missing = [];
  if (!AD_TAGGING_BASE_ID) missing.push('AD_TAGGING_BASE_ID');
  if (!AD_TAGGING_TOKEN) missing.push('AD_TAGGING_TOKEN');
  if (!AD_TAGGING_PASSWORD) missing.push('AD_TAGGING_PASSWORD');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== AD_TAGGING_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  // Table name from query param
  const url = new URL(req.url);
  const tableName = url.searchParams.get('table');
  if (!tableName) {
    return jsonResponse(400, { error: 'missing_table_param' });
  }
  // Whitelist tables to prevent arbitrary table access
  const allowed = ['AD_Team', 'Artist_Tags'];
  if (!allowed.includes(tableName)) {
    return jsonResponse(403, { error: 'table_not_allowed', allowed });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const apiUrl = `https://api.airtable.com/v0/${AD_TAGGING_BASE_ID}/${encodeURIComponent(tableName)}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${AD_TAGGING_TOKEN}` }
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
      if (pageCount > 20) break;
    } while (offset);

    return jsonResponse(200, { records: allRecords, count: allRecords.length, table: tableName });
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
  path: '/api/ad-tagging-records'
};
