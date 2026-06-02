// Read + write proxy for the Ideas Board table.
// GET  /api/ideas   → returns all posts (newest first)
// POST /api/ideas   → body: { idea, from }  → creates a new post
// Password-gated via X-Grid-Password header. Token, base, table live in env vars.
// Same pattern as phase-1-records.mjs — server-side token, never in client code.

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

const MAX_IDEA = 2000;
const MAX_FROM = 80;
const ALLOWED_TOPICS = ['An idea', 'A frustration', 'Something working', 'A question', 'Thinking out loud'];

export default async (req) => {
  // Reuse-friendly config. Env vars win if set; otherwise sensible defaults.
  // Base IDs and table IDs are NOT credentials, and the gate password already
  // lives in the client — so they can default here safely. The only true secret
  // is TOKEN, which stays in Netlify env. We reuse the existing write-capable
  // PHASE1_TOKEN until a dedicated IDEAS_TOKEN is set. NOTE: the board's DATA
  // lives in its own base (below), isolated from the Phase 1 / Jordan-facing base.
  const BASE_ID = readEnv('IDEAS_BASE_ID') || 'appOqoMYUnnPGppHF';
  const TABLE_ID = readEnv('IDEAS_TABLE_ID') || 'tblQ7Ql1cK89c1p71';
  const PASSWORD = readEnv('IDEAS_PASSWORD') || 'rca2026';
  const TOKEN = readEnv('IDEAS_TOKEN') || readEnv('AD_TAGGING_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN');

  if (!TOKEN) {
    return jsonResponse(500, { error: 'misconfigured', missing: ['IDEAS_TOKEN or PHASE1_TOKEN'] });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(BASE_ID, TABLE_ID, TOKEN);
  }
  if (req.method === 'POST') {
    return handlePost(req, BASE_ID, TABLE_ID, TOKEN);
  }
  return jsonResponse(405, { error: 'method_not_allowed' });
};

async function handleGet(baseId, tableId, token) {
  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    do {
      const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}?pageSize=100${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const errText = await res.text();
        return jsonResponse(502, { error: 'airtable_error', status: res.status, detail: errText.substring(0, 500) });
      }
      const data = await res.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
      pageCount += 1;
      if (pageCount > 10) break;
    } while (offset);

    // Newest first by createdTime
    allRecords.sort((a, b) => {
      const at = new Date(a.createdTime || 0).getTime();
      const bt = new Date(b.createdTime || 0).getTime();
      return bt - at;
    });

    // Only surface the fields the board needs — never leak anything else
    const posts = allRecords.map(r => ({
      id: r.id,
      idea: r.fields?.Idea || '',
      from: (r.fields?.From || '').trim() || 'anonymous',
      topic: r.fields?.Topic || '',
      created: r.createdTime || null
    }));

    return jsonResponse(200, { posts, count: posts.length });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
}

async function handlePost(req, baseId, tableId, token) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  let idea = (body && typeof body.idea === 'string') ? body.idea.trim() : '';
  let from = (body && typeof body.from === 'string') ? body.from.trim() : '';
  let topic = (body && typeof body.topic === 'string') ? body.topic.trim() : '';

  if (!idea) {
    return jsonResponse(400, { error: 'empty_idea' });
  }
  if (idea.length > MAX_IDEA) idea = idea.substring(0, MAX_IDEA);
  if (from.length > MAX_FROM) from = from.substring(0, MAX_FROM);
  if (!from) from = 'anonymous';
  if (!ALLOWED_TOPICS.includes(topic)) topic = '';

  const fields = { Idea: idea, From: from };
  if (topic) fields.Topic = topic;

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableId)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse(502, { error: 'airtable_error', status: res.status, detail: errText.substring(0, 500) });
    }
    const data = await res.json();
    return jsonResponse(200, {
      post: {
        id: data.id,
        idea: data.fields?.Idea || idea,
        from: (data.fields?.From || from).trim() || 'anonymous',
        topic: data.fields?.Topic || topic || '',
        created: data.createdTime || new Date().toISOString()
      }
    });
  } catch (e) {
    return jsonResponse(500, { error: 'post_failed', message: String(e) });
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

export const config = {
  path: '/api/ideas'
};
