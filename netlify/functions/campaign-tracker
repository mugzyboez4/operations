// Read proxy for the Audience Development Digital Campaign Tracker (the bible).
// GET /api/campaign-tracker → normalized rows for the Campaign Board page.
// Gated via X-Grid-Password against TRACKER_PASSWORD (env only, no default in code —
// the key lives in Netlify env and the SSO-protected WordPress page, never in this public repo).
// Token from env; base/table overridable via env, defaults to the live tracker.

function readEnv(key){
  try { if (typeof Netlify!=='undefined' && Netlify.env && typeof Netlify.env.get==='function'){ const v=Netlify.env.get(key); if(v) return v; } } catch(e){}
  try { if (typeof process!=='undefined' && process.env && process.env[key]) return process.env[key]; } catch(e){}
  return null;
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'X-Grid-Password, Content-Type',
  'access-control-max-age': '86400'
};

const F = {
  id:'fldfFF6JRZD5f45SC', artists:'fldcMmasfbFotCqbY', artist:'fldjuTRhJjAKxEBln', product:'fldtWtzr59gwyyTAE',
  status:'fldbEaG6W2FLerBVr', budget:'fldX9d6llCY4tYf94', start:'fldWBt79673GPzt0a', link:'fldTQKFfzTH80lsnP',
  phase:'fldRbTnQecLGmCSQI', cat:'fldZ6u9HFnwxbKA3N', sub:'fldwkBeiK9eg2ENIi', lead:'fldqF6hcmiifELmx0',
  agency:'fldY5YNqx3svruFPy', platform:'fldXVdqw5xWmpCE7E', channel:'fldHt1ol3bER8Q9M6'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' });

  const BASE_ID  = readEnv('TRACKER_BASE_ID')  || 'appqjttph4LdciKkq';
  const TABLE_ID = readEnv('TRACKER_TABLE_ID') || 'tbl30upXJiSFbO3BR';
  const PASSWORD = readEnv('TRACKER_PASSWORD');
  const TOKEN    = readEnv('TRACKER_TOKEN') || readEnv('AIRTABLE_TOKEN');

  if (!PASSWORD) return json(500, { error: 'misconfigured', message: 'TRACKER_PASSWORD env var is not set.' });
  if (!TOKEN) return json(500, { error: 'misconfigured', message: 'No Airtable token env var (TRACKER_TOKEN or AIRTABLE_TOKEN).' });
  if ((req.headers.get('x-grid-password') || '') !== PASSWORD) return json(401, { error: 'unauthorized' });

  try {
    const jsonFields = ['id','product','status','budget','start','link','phase','cat','sub','agency','platform','channel'];
    const nameFields = ['artists','artist','lead'];
    const [rows, names] = await Promise.all([
      fetchAll(BASE_ID, TABLE_ID, TOKEN, jsonFields.map(k => F[k]), 'cellFormat=json'),
      // Linked records come back as record IDs in json format; string format returns names.
      fetchAll(BASE_ID, TABLE_ID, TOKEN, nameFields.map(k => F[k]), 'cellFormat=string&timeZone=America%2FLos_Angeles&userLocale=en-us')
    ]);
    const byId = new Map(names.map(r => [r.id, r.fields || {}]));
    return json(200, { rows: rows.map(r => mapRecord(r, byId.get(r.id) || {})), count: rows.length, fetchedAt: new Date().toISOString() });
  } catch (e) {
    if (e && e.airtable) return json(502, { error: 'airtable_error', status: e.status, detail: e.detail });
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
};

async function fetchAll(BASE_ID, TABLE_ID, TOKEN, fieldIds, format){
  const all = [];
  let offset = null, pages = 0;
  const fields = fieldIds.map(f => 'fields%5B%5D=' + f).join('&');
  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100&returnFieldsByFieldId=true&${format}&${fields}${offset ? '&offset=' + encodeURIComponent(offset) : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) { const t = await res.text(); throw { airtable: true, status: res.status, detail: t.substring(0, 400) }; }
    const data = await res.json();
    all.push(...(data.records || []));
    offset = data.offset; pages++;
  } while (offset && pages < 20);
  return all;
}

function mapRecord(r, n){
  const c = r.fields || {};
  const s = v => (v == null ? null : (typeof v === 'object' && !Array.isArray(v) ? (v.name ?? null) : v));
  const split = v => (typeof v === 'string' && v.trim()) ? v.split(/,\s*/).map(x => x.trim()).filter(Boolean) : [];
  const artists = split(n[F.artists]).length ? split(n[F.artists]) : split(n[F.artist]);
  return {
    rid: r.id,
    id: String(c[F.id] || '').trim(),
    artists,
    product: c[F.product] || '',
    status: s(c[F.status]),
    budget: typeof c[F.budget] === 'number' ? c[F.budget] : null,
    start: c[F.start] || null,
    link: c[F.link] || null,
    phase: s(c[F.phase]),
    cat: s(c[F.cat]),
    sub: (Array.isArray(c[F.sub]) ? c[F.sub] : []).map(s).filter(x => x && String(x).trim()),
    lead: split(n[F.lead]),
    agency: c[F.agency] || null,
    platform: c[F.platform] || null,
    channel: c[F.channel] || null
  };
}

function json(status, body){
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS_HEADERS } });
}

export const config = { path: '/api/campaign-tracker' };
