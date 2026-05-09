// Read-only proxy to the RCA D2C Activations Airtable base.
// Password-gated: only requests bearing the correct X-Grid-Password header are served.
// Token, base ID, table ID, and password live in Netlify env vars — never in client code.

export default async (req) => {
  const AIRTABLE_BASE_ID = Netlify.env.get('AIRTABLE_BASE_ID');
  const AIRTABLE_TABLE_ID = Netlify.env.get('AIRTABLE_TABLE_ID');
  const AIRTABLE_TOKEN = Netlify.env.get('AIRTABLE_TOKEN');
  const GRID_PASSWORD = Netlify.env.get('GRID_PASSWORD');

  // Sanity check: bail loudly if env is misconfigured
  if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID || !AIRTABLE_TOKEN || !GRID_PASSWORD) {
    return jsonResponse(500, {
      error: 'misconfigured',
      detail: 'Server is missing required env vars (AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID / AIRTABLE_TOKEN / GRID_PASSWORD)'
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate — header must match GRID_PASSWORD env var
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== GRID_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
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
