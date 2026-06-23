// Read + write proxy for the Creator Campaign Index.
// GET  /api/campaigns → all campaigns (grouped client-side)
// POST /api/campaigns → add a campaign (Alexis / team submit form)
// Password-gated via X-Grid-Password. Token/base/table from env, safe defaults.
// Writes require the token to have data.records:write scope.

function readEnv(key){
  try { if (typeof Netlify!=='undefined' && Netlify.env && typeof Netlify.env.get==='function'){ const v=Netlify.env.get(key); if(v) return v; } } catch(e){}
  try { if (typeof process!=='undefined' && process.env && process.env[key]) return process.env[key]; } catch(e){}
  return null;
}

const ALLOWED_PLATFORMS = ['Cobrand','ATG Media','Fortyone','CreatorCore','Other'];
const ALLOWED_TYPES = ['Influencers','TV Edits','Macro','Micro','UGC','Mixed'];
const ALLOWED_STATUS = ['Live','Planned','Wrapped','Paused'];
const ALLOWED_TIERS = ['Group 1 (10M+)','Group 2 (5-10M)','Group 3 (1-5M)','Group 4 (100K-1M)','Group 5 (under 100K)'];

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'X-Grid-Password, Content-Type',
  'access-control-max-age': '86400'
};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const BASE_ID = readEnv('CAMPAIGNS_BASE_ID') || 'appon9XPSAIySM1lA';
  const TABLE_ID = readEnv('CAMPAIGNS_TABLE_ID') || 'tblzGn0Q1hxEzaHXD';
  const PASSWORD = readEnv('CAMPAIGNS_PASSWORD') || 'rca2026';
  const TOKEN = readEnv('CAMPAIGNS_TOKEN') || readEnv('AD_TAGGING_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN');

  if (!TOKEN) return json(500, { error: 'misconfigured', missing: ['no Airtable token env var found'] });

  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== PASSWORD) return json(401, { error: 'unauthorized' });

  if (req.method === 'GET') return handleGet(BASE_ID, TABLE_ID, TOKEN);
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
      if (pages > 10) break;
    } while (offset);

    const campaigns = all
      .filter(r => r.fields && r.fields['Active'] !== false)
      .map(mapRecord);

    return json(200, { campaigns, count: campaigns.length });
  } catch (e) {
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
}

async function handlePost(req, BASE_ID, TABLE_ID, TOKEN){
  let body;
  try { body = await req.json(); } catch(e){ return json(400, { error:'invalid_json' }); }

  const str = (v, max) => (typeof v === 'string' ? v.trim().substring(0, max||300) : '');
  const artist = str(body.artist, 120);
  const song = str(body.song, 160);
  let campaign = str(body.campaign, 160);
  let platform = str(body.platform, 40);
  let type = str(body.type, 40);
  let status = str(body.status, 40);
  let tier = str(body.tier, 40);
  const link = str(body.link, 1000);
  const owner = str(body.owner, 120);
  const startDate = str(body.startDate, 20);
  let budget = (typeof body.budget === 'number') ? body.budget : (body.budget ? Number(String(body.budget).replace(/[^0-9.]/g,'')) : null);
  if (budget !== null && (isNaN(budget) || budget < 0)) budget = null;

  if (!artist) return json(400, { error: 'missing_artist', message: 'Artist is required.' });
  if (platform && !ALLOWED_PLATFORMS.includes(platform)) platform = 'Other';
  if (type && !ALLOWED_TYPES.includes(type)) type = '';
  if (!ALLOWED_STATUS.includes(status)) status = 'Live';
  if (!campaign) campaign = type || 'Campaign';
  if (tier && !ALLOWED_TIERS.includes(tier)) tier = '';

  const fields = { Artist: artist, Campaign: campaign, Status: status, Active: true, Verdict: 'Too early' };
  if (song) fields['Song'] = song;
  if (platform) fields['Platform'] = platform;
  if (type) fields['Type'] = type;
  if (budget !== null) fields['Budget'] = budget;
  if (link) fields['Dashboard Link'] = link;
  if (owner) fields['Owner'] = owner;
  if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) fields['Start Date'] = startDate;
  if (tier) fields['Career Tier'] = tier;

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (res.status === 403) {
      return json(403, { error: 'forbidden_write', message: 'The token can read but not write. Add data.records:write scope to the sandbox token.' });
    }
    if (!res.ok) { const t = await res.text(); return json(502, { error:'airtable_error', status:res.status, detail:t.substring(0,400) }); }
    const data = await res.json();
    return json(200, { campaign: mapRecord(data) });
  } catch (e) {
    return json(500, { error: 'post_failed', message: String(e) });
  }
}

function mapRecord(r){
  return {
    id: r.id,
    artist: r.fields['Artist'] || '',
    song: r.fields['Song'] || '',
    campaign: r.fields['Campaign'] || '',
    platform: r.fields['Platform'] || '',
    type: r.fields['Type'] || '',
    budget: typeof r.fields['Budget'] === 'number' ? r.fields['Budget'] : null,
    status: r.fields['Status'] || '',
    link: r.fields['Dashboard Link'] || '',
    owner: r.fields['Owner'] || '',
    sound: r.fields['Sound Link'] || '',
    flags: r.fields['Notes / Flags'] || '',
    startDate: r.fields['Start Date'] || null,
    views: typeof r.fields['Views'] === 'number' ? r.fields['Views'] : null,
    engRate: typeof r.fields['Engagement Rate'] === 'number' ? r.fields['Engagement Rate'] : null,
    soundCreates: typeof r.fields['Sound Creates'] === 'number' ? r.fields['Sound Creates'] : null,
    streaming: r.fields['Streaming Signal'] || '',
    topCreator: r.fields['Top Creator'] || '',
    verdict: r.fields['Verdict'] || '',
    tier: r.fields['Career Tier'] || '',
    learnings: r.fields['Learnings'] || '',
    reviewed: r.fields['Reviewed'] === true,
    viewsPerStream: typeof r.fields['Views per Stream'] === 'number' ? r.fields['Views per Stream'] : null,
    livePosts: typeof r.fields['Live Posts'] === 'number' ? r.fields['Live Posts'] : null,
    totalEng: typeof r.fields['Total Engagement'] === 'number' ? r.fields['Total Engagement'] : null,
    trend: parseSeries(r.fields['Trend Views']),
    trendEng: parseSeries(r.fields['Trend Eng'])
  };
}

function parseSeries(s){
  if (typeof s !== 'string' || !s.trim()) return null;
  const a = s.split(',').map(x => Number(String(x).trim())).filter(n => !isNaN(n));
  return a.length > 1 ? a : null;
}

function json(status, body){
  return new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store', ...CORS_HEADERS } });
}

export const config = { path: '/api/campaigns' };
