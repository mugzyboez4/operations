// Artist-SAFE read proxy for the Creator Campaign Index.
// GET /api/artist-campaigns → campaigns with ONLY artist-safe fields.
// Deliberately strips Budget, Verdict (Scale/Pivot/Kill), Career Tier, Notes/Flags,
// Owner, Views-per-Stream, Streaming Signal, Learnings, Top Creator — none of that
// ever leaves the server, so a page password can't expose internal data.
// Password-gated via X-Grid-Password. Token/base/table from env, safe defaults.

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

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const BASE_ID  = readEnv('CAMPAIGNS_BASE_ID')  || 'appon9XPSAIySM1lA';
  const TABLE_ID = readEnv('CAMPAIGNS_TABLE_ID') || 'tblzGn0Q1hxEzaHXD';
  const PASSWORD = readEnv('ARTIST_PASSWORD') || readEnv('CAMPAIGNS_PASSWORD') || 'rca2026';
  const TOKEN    = readEnv('CAMPAIGNS_TOKEN') || readEnv('AD_TAGGING_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN');

  if (!TOKEN) return json(500, { error: 'misconfigured', missing: ['no Airtable token env var found'] });

  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) return json(401, { error: 'unauthorized' });

  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' });

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
      if (pages > 10) break;
    } while (offset);

    const campaigns = all
      .filter(r => r.fields && r.fields['Active'] !== false)
      .map(safeMap);

    return json(200, { campaigns, count: campaigns.length });
  } catch (e) {
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
};

// Whitelist mapper — only artist-safe fields are read out. Anything not listed
// here (Budget, Verdict, Career Tier, Notes/Flags, Owner, etc.) never appears.
function safeMap(r){
  const f = r.fields || {};
  return {
    id: r.id,
    artist: f['Artist'] || '',
    song: f['Song'] || '',
    campaign: f['Campaign'] || '',
    type: f['Type'] || '',
    status: f['Status'] || '',
    views: typeof f['Views'] === 'number' ? f['Views'] : null,
    engRate: typeof f['Engagement Rate'] === 'number' ? f['Engagement Rate'] : null,
    startDate: f['Start Date'] || null
  };
}

function json(status, body){
  return new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store', ...CORS_HEADERS } });
}

export const config = { path: '/api/artist-campaigns' };
