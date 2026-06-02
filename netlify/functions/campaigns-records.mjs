// Read proxy for the Creator Campaign Index.
// GET /api/campaigns → all campaigns (grouped client-side).
// Password-gated via X-Grid-Password. Token/base/table from env, with safe defaults
// (base & table IDs are not secrets; password already lives client-side). Reuses the
// existing write-capable PHASE1_TOKEN until a dedicated CAMPAIGNS_TOKEN is set.

function readEnv(key){
  try { if (typeof Netlify!=='undefined' && Netlify.env && typeof Netlify.env.get==='function'){ const v=Netlify.env.get(key); if(v) return v; } } catch(e){}
  try { if (typeof process!=='undefined' && process.env && process.env[key]) return process.env[key]; } catch(e){}
  return null;
}

export default async (req) => {
  const BASE_ID = readEnv('CAMPAIGNS_BASE_ID') || 'appon9XPSAIySM1lA';
  const TABLE_ID = readEnv('CAMPAIGNS_TABLE_ID') || 'tblzGn0Q1hxEzaHXD';
  const PASSWORD = readEnv('CAMPAIGNS_PASSWORD') || 'rca2026';
  // Reuse whichever Airtable token the site already has. AD_TAGGING_TOKEN and
  // AIRTABLE_TOKEN are both known-good on this site; CAMPAIGNS_TOKEN/PHASE1_TOKEN
  // kept as fallbacks. All point at tokens with access to the Campaign Ops Sandbox.
  const TOKEN = readEnv('CAMPAIGNS_TOKEN') || readEnv('AD_TAGGING_TOKEN') || readEnv('AIRTABLE_TOKEN') || readEnv('PHASE1_TOKEN');

  if (!TOKEN) return json(500, { error: 'misconfigured', missing: ['no Airtable token env var found (tried CAMPAIGNS_TOKEN, AD_TAGGING_TOKEN, AIRTABLE_TOKEN, PHASE1_TOKEN)'] });

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
      .map(r => ({
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
        verdict: r.fields['Verdict'] || ''
      }));

    return json(200, { campaigns, count: campaigns.length });
  } catch (e) {
    return json(500, { error: 'fetch_failed', message: String(e) });
  }
};

function json(status, body){
  return new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store' } });
}

export const config = { path: '/api/campaigns' };
