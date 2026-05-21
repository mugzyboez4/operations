// Read + write proxy for the Phase 1 Priorities table.
// GET  /api/phase-1-records           → returns all records (sorted by Order)
// PATCH /api/phase-1-records          → body: { recordId, status }  → updates that record's Status field
// Password-gated via X-Grid-Password header. Token, base, table live in env vars.

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

const ALLOWED_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked', 'N/A'];

export default async (req) => {
  const BASE_ID = readEnv('PHASE1_BASE_ID');
  const TABLE_ID = readEnv('PHASE1_TABLE_ID');
  const TOKEN = readEnv('PHASE1_TOKEN');
  const PASSWORD = readEnv('PHASE1_PASSWORD');

  const missing = [];
  if (!BASE_ID) missing.push('PHASE1_BASE_ID');
  if (!TABLE_ID) missing.push('PHASE1_TABLE_ID');
  if (!TOKEN) missing.push('PHASE1_TOKEN');
  if (!PASSWORD) missing.push('PHASE1_PASSWORD');
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(BASE_ID, TABLE_ID, TOKEN);
  }
  if (req.method === 'PATCH') {
    return handlePatch(req, BASE_ID, TABLE_ID, TOKEN);
  }
  return jsonResponse(405, { error: 'method_not_allowed' });
};

async function handleGet(baseId, tableId, token) {
  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      if (pageCount > 5) break;
    } while (offset);

    // Sort by Order field client-side (Airtable doesn't guarantee server-side order without a view)
    allRecords.sort((a, b) => {
      const ao = a.fields?.Order ?? 9999;
      const bo = b.fields?.Order ?? 9999;
      return ao - bo;
    });

    return jsonResponse(200, { records: allRecords, count: allRecords.length });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
}

async function handlePatch(req, baseId, tableId, token) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return jsonResponse(400, { error: 'invalid_json' });
  }
  const { recordId, status } = body || {};
  if (!recordId || typeof recordId !== 'string' || !recordId.startsWith('rec')) {
    return jsonResponse(400, { error: 'invalid_record_id' });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return jsonResponse(400, { error: 'invalid_status', allowed: ALLOWED_STATUSES });
  }

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: { Status: status } })
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
    return jsonResponse(200, { record: data });
  } catch (e) {
    return jsonResponse(500, { error: 'patch_failed', message: String(e) });
  }
}

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
  path: '/api/phase-1-records'
};
