// Read-only proxy to the RCA AD Tagging Airtable base.
// Resilient pattern (matches campaigns / creative-tickets fns): hardcoded base + password
// defaults, and a token fallback chain that reuses whatever Airtable token is already
// configured in Netlify — so this works without dedicated AD_TAGGING_* secrets.
// Accepts ?table=<tableName> so one endpoint serves multiple whitelisted tables.

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
  // Base + password have safe defaults; token reuses any existing server-side var.
  const AD_TAGGING_BASE_ID = readEnv('AD_TAGGING_BASE_ID') || 'appB8Ee2okz5JNoef';
  const AD_TAGGING_PASSWORD = readEnv('AD_TAGGING_PASSWORD') || readEnv('GRID_PASSWORD') || 'RCA2026';
  const AD_TAGGING_TOKEN =
    readEnv('AD_TAGGING_TOKEN') ||
    readEnv('AIRTABLE_TOKEN') ||
    readEnv('PHASE1_TOKEN') ||
    readEnv('CT_TOKEN') ||
    readEnv('CAMPAIGNS_TOKEN');

  if (!AD_TAGGING_TOKEN) {
    return jsonResponse(500, { error: 'misconfigured', missing: ['no Airtable token env var found (AD_TAGGING_TOKEN / AIRTABLE_TOKEN / PHASE1_TOKEN)'] });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate — page sends the gate password as X-Grid-Password.
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== AD_TAGGING_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  const url = new URL(req.url);
  const tableName = url.searchParams.get('table');
  if (!tableName) {
    return jsonResponse(400, { error: 'missing_table_param' });
  }
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
          hint: res.status === 403 || res.status === 404
            ? 'The reused token likely does not have the AD Tagging Demo base in scope. Add base appB8Ee2okz5JNoef to the PAT scope, or set a dedicated AD_TAGGING_TOKEN.'
            : undefined,
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
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

export const config = {
  path: '/api/ad-tagging-records'
};
