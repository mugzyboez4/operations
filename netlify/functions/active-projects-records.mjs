// Read + write proxy for the Active Projects exec cycle.
// GET  /api/active-projects        -> all records {id, artist, tarek, jordan}
// POST /api/active-projects {id,who,text} -> update Tarek or Jordan context on one record
// Password-gated via X-Grid-Password. Token/base/table from env, safe defaults.
// Writes require the token to have data.records:write scope on the base.

function readEnv(key){
  try { if (typeof Netlify!=='undefined' && Netlify.env && typeof Netlify.env.get==='function'){ const v=Netlify.env.get(key); if(v) return v; } } catch(e){}
  try { if (typeof process!=='undefined' && process.env && process.env[key]) return process.env[key]; } catch(e){}
  return null;
}

const FIELD = {
  tarek:  'Tarek \u2014 Context / Updates',
  jordan: 'Jordan \u2014 Context / Updates'
};

export default async (req) => {
  const BASE_ID  = readEnv('ACTIVEPROJECTS_BASE_ID')  || 'appCDKRkljLKSu211';
  const TABLE_ID = readEnv('ACTIVEPROJECTS_TABLE_ID') || 'tblMuzMNUsF7eDajh';
  const PASSWORD = readEnv('ACTIVEPROJECTS_PASSWORD') || readEnv('CAMPAIGNS_PASSWORD') || 'rca2026';
  const TOKEN    = readEnv('ACTIVEPROJECTS_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('CAMPAIGNS_TOKEN') || readEnv('AD_TAGGING_TOKEN') || readEnv('PHASE1_TOKEN');

  if (!TOKEN) return json(500, { error: 'misconfigured', missing: ['no Airtable token env var found'] });

  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) return json(401, { error: 'unauthorized' });

  if (req.method === 'GET')  return handleGet(BASE_ID, TABLE_ID, TOKEN);
  if (req.method === 'POST') return handlePost(req, BASE_ID, TABLE_ID, TOKEN);
  return json(405, { error: 'method_not_allowed' });
};

async function handleGet(BASE_ID, TABLE_ID, TOKEN){
  try {
    const all = [];
    let offset = null, pages = 0;
    do {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}?pageSize=100${offset ? '&offset='+encodeURIComponent(offset) : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      if (!res.ok) { const t = await res.text(); return json(502, { error:'airtable_error', status:res.status, detail:t.substring(0,400) }); }
      const data = await res.json();
      all.push(...(data.records||[]));
      offset = data.offset; pages++;
      if (pages > 5) break;
    } while (offset);

    const records = all.map(r => ({
      id: r.id,
      artist: r.fields['Artist'] || '',
      tarek:  r.fields[FIELD.tarek]  || '',
      jordan: r.fields[FIELD.jordan] || ''
    }));
    return json(200, { records, count: records.length });
  } catch (e) {
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
}

async function handlePost(req, BASE_ID, TABLE_ID, TOKEN){
  let body;
  try { body = await req.json(); } catch(e){ return json(400, { error:'invalid_json' }); }

  const id   = typeof body.id === 'string' ? body.id.trim() : '';
  const who  = typeof body.who === 'string' ? body.who.trim().toLowerCase() : '';
  const text = typeof body.text === 'string' ? body.text.substring(0, 4000) : '';

  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return json(400, { error:'bad_record_id' });
  if (!FIELD[who]) return json(400, { error:'bad_who', message:'who must be "tarek" or "jordan"' });

  const fields = {}; fields[FIELD[who]] = text;

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}/${id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (res.status === 403) return json(403, { error:'forbidden_write', message:'Token can read but not write. Add data.records:write scope on this base.' });
    if (res.status === 404) return json(404, { error:'not_found', message:'Record or base not found for this token.' });
    if (!res.ok) { const t = await res.text(); return json(502, { error:'airtable_error', status:res.status, detail:t.substring(0,400) }); }
    const data = await res.json();
    return json(200, { id: data.id, who, text });
  } catch (e) {
    return json(500, { error: 'post_failed', message: String(e) });
  }
}

function json(status, body){
  return new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store' } });
}

export const config = { path: '/api/active-projects' };
