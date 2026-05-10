// Read-only proxy for a single artist's full detail (Active Projects pages).
// Returns one artist's record + last 5 Artist Updates + upcoming/recent Artist Events.
// Password-gated via X-Grid-Password header.

const BASE_ID = 'appLwUF3H4KjtiRdW';      // RCA Records (Copy)
const ARTISTS_TABLE = 'tblV9HXEZ5k6uFXFQ';
const UPDATES_TABLE = 'tbldiEvSLqvn1wi01'; // Artist Update Log
const EVENTS_TABLE  = 'tblgk7XV126K6S07z'; // Artist Events
const ACTIONS_TABLE = 'tbl7bu0rq60d5vQrY'; // Action Items

// ── ARTISTS field IDs ──
const A = {
  name: 'fld8PER8PqVHcZBFh',
  image: 'fldRXJGMzyRRbGKEL',
  status: 'fldRuxnxUwfa8QQIJ',
  genre: 'fldSDGCxT3qPRvJD2',
  spotifyFollowers: 'fldTmRkJMTQ6eQ4su',
  spotifyPopularity: 'flde8jQvhgXGh68mC',
  spotifyId: 'fld09PGkl0HMmmeHl',
  spotifyUrl: 'fldb7yAeWpReQsF3W',
  airUrl: 'fldn9lzWlAtmO6MmH',
  instagramUrl: 'fldEXwoNKJ6VAOru0',
  tiktokUrl: 'fldKG3N5XUQN17Dmb',
  youtubeUrl: 'fldyH5ADysia8ZN6e',
  bio: 'fldciE4yVDmQfzWre',
  weeklyCategory: 'fldpEPkN4wh6rMjdu',
};

// ── ARTIST UPDATE LOG field IDs ──
const U = {
  name: 'fldHjgP6N49cHwBE6',
  artist: 'fld0ETFs2HZ6TiLHD',
  recap: 'flduD8pmW7A4PHZV0',
  subject: 'fldBL4AEjdFiD3NKz',
  created: 'flduGrkyPmKy448xz',
  sentBy: 'fldqk5nnq2Ntwu89a',
  sentTo: 'fld5Ll7KFjUmSVW0q',
};

// ── ARTIST EVENTS field IDs ──
const E = {
  name: 'fldwoU7PRpktOvZwF',
  title: 'fldQDZQrIba1iLxS6',
  artist: 'fldQd3KpieGRhbG36',
  startDate: 'fldtIrSPI07qPopRf',
  type: 'fldF4Vxx1e8Lb23cT',
  status: 'fldYQAC96fYveyehc',
  location: 'fldFnroSKqq3qhnZE',
  isFuture: 'fld3uhXEluSoWXrww',
  description: 'fldlmAv1NWXzT6jBQ',
};

// ── ACTION ITEMS field IDs ──
const X = {
  item: 'fldy6PZ5MTj5CUD7x',
  type: 'fldCtCKQerGIdyWWq',
  status: 'fldVroldUPRrS8R0F',
  timing: 'fldiHgumGH3HuWD2d',
  artist: 'fldbKrYrbZjFIsmQD',
  owner: 'fld0svO7fVb5Ik5fZ',
  source: 'fldJD04Ee2yKOSdhe',
  meetingDate: 'fldPx4qFnMrb6X9dm',
  notes: 'fldcso1fCrnwL7vLL',
  created: 'fldEDLNhHHVSRBuBz',
};

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
  const AIRTABLE_TOKEN = readEnv('AIRTABLE_TOKEN');
  const ROSTER_PASSWORD = readEnv('ROSTER_PASSWORD');

  const missing = [];
  if (!AIRTABLE_TOKEN) missing.push('AIRTABLE_TOKEN');
  if (!ROSTER_PASSWORD) missing.push('ROSTER_PASSWORD');
  if (missing.length > 0) return jsonResponse(500, { error: 'misconfigured', missing });

  if (req.method !== 'GET') return jsonResponse(405, { error: 'method_not_allowed' });

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== ROSTER_PASSWORD) return jsonResponse(401, { error: 'unauthorized' });

  // Parse query string
  const url = new URL(req.url);
  const artistId = url.searchParams.get('id');
  if (!artistId || !/^rec[A-Za-z0-9]{14}$/.test(artistId)) {
    return jsonResponse(400, { error: 'invalid_or_missing_id', detail: 'Provide ?id=recXXXXXXXXXXXXXX' });
  }

  try {
    // First fetch the artist (we need the name for the related-records filter)
    const artistRes = await fetchArtist(artistId, AIRTABLE_TOKEN);
    if (artistRes.error) return jsonResponse(artistRes.status || 502, artistRes);
    const artistName = artistRes.artist.name;

    // Then fetch related records in parallel using the name as filter
    const [updates, events, actionItems] = await Promise.all([
      fetchUpdates(artistName, AIRTABLE_TOKEN),
      fetchEvents(artistName, AIRTABLE_TOKEN),
      fetchActionItems(artistName, AIRTABLE_TOKEN),
    ]);

    return jsonResponse(200, {
      artist: artistRes.artist,
      updates,
      events,
      action_items: actionItems,
      synced_at: new Date().toISOString(),
    });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

// ───────── fetchers ─────────

async function fetchArtist(id, token) {
  const u = `https://api.airtable.com/v0/${BASE_ID}/${ARTISTS_TABLE}/${id}?returnFieldsByFieldId=true`;
  const res = await fetch(u, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    return { error: 'airtable_error', status: res.status, detail: text.substring(0, 500) };
  }
  const data = await res.json();
  return { artist: mapArtist(data) };
}

async function fetchUpdates(artistName, token) {
  if (!artistName) return [];
  // Filter: artist name appears in the joined Artist link field.
  // Linked-record fields return the linked records' primary field (name) when used in formulas,
  // not their record IDs — so we filter by name. Names are unique enough on the RCA roster.
  const formula = `FIND("${escFormula(artistName)}", ARRAYJOIN({Artist}, ", ")) > 0`;
  const u = `https://api.airtable.com/v0/${BASE_ID}/${UPDATES_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}` +
    `&sort[0][field]=Created&sort[0][direction]=desc&pageSize=8` +
    `&returnFieldsByFieldId=true`;
  try {
    const res = await fetch(u, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      // Don't silently swallow — log shape so we can debug
      const txt = await res.text();
      console.error(`Updates fetch failed: ${res.status}: ${txt.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    return (data.records || []).map(mapUpdate);
  } catch (e) {
    console.error('Updates fetch error:', e);
    return [];
  }
}

async function fetchEvents(artistName, token) {
  if (!artistName) return [];
  const formula = `FIND("${escFormula(artistName)}", ARRAYJOIN({Artist}, ", ")) > 0`;
  const u = `https://api.airtable.com/v0/${BASE_ID}/${EVENTS_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}` +
    `&sort[0][field]=Start Date&sort[0][direction]=desc&pageSize=20` +
    `&returnFieldsByFieldId=true`;
  try {
    const res = await fetch(u, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Events fetch failed: ${res.status}: ${txt.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    return (data.records || []).map(mapEvent);
  } catch (e) {
    console.error('Events fetch error:', e);
    return [];
  }
}

async function fetchActionItems(artistName, token) {
  if (!artistName) return [];
  // Filter: Related Artist link contains this name. Action Items table uses "Related Artist" field name.
  const formula = `FIND("${escFormula(artistName)}", ARRAYJOIN({Related Artist}, ", ")) > 0`;
  const u = `https://api.airtable.com/v0/${BASE_ID}/${ACTIONS_TABLE}` +
    `?filterByFormula=${encodeURIComponent(formula)}` +
    `&sort[0][field]=Created&sort[0][direction]=desc&pageSize=50` +
    `&returnFieldsByFieldId=true`;
  try {
    const res = await fetch(u, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Action items fetch failed: ${res.status}: ${txt.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    return (data.records || []).map(mapActionItem);
  } catch (e) {
    console.error('Action items fetch error:', e);
    return [];
  }
}

function escFormula(s) {
  // Inside a double-quoted Airtable formula string, escape literal double quotes.
  // Most artist names don't contain ", but be safe.
  return String(s).replace(/"/g, '\\"');
}

// ───────── mappers ─────────

function mapArtist(r) {
  const f = r.fields || {};
  const imageAtt = (f[A.image] && f[A.image][0]) || null;
  let imageUrl = null;
  if (imageAtt) {
    const fname = (imageAtt.filename || '').replace(/\.(jpg|jpeg|png)$/i, '');
    if (/^ab6[0-9a-f]+$|^c69[0-9a-f]+$/i.test(fname)) {
      imageUrl = `https://i.scdn.co/image/${fname}`;
    } else {
      imageUrl = (imageAtt.thumbnails && imageAtt.thumbnails.large && imageAtt.thumbnails.large.url) || imageAtt.url;
    }
  }
  return {
    id: r.id,
    name: f[A.name] || '(unnamed)',
    image_url: imageUrl,
    status: extractSelect(f[A.status]),
    genre: extractSelect(f[A.genre]),
    spotify_followers: f[A.spotifyFollowers] || null,
    spotify_popularity: f[A.spotifyPopularity] || null,
    spotify_id: f[A.spotifyId] || null,
    spotify_url: f[A.spotifyUrl] || null,
    air_url: f[A.airUrl] || null,
    instagram_url: f[A.instagramUrl] || null,
    tiktok_url: f[A.tiktokUrl] || null,
    youtube_url: f[A.youtubeUrl] || null,
    bio: f[A.bio] || null,
    weekly_category: extractSelect(f[A.weeklyCategory]),
    airtable_url: `https://airtable.com/${BASE_ID}/${ARTISTS_TABLE}/${r.id}`,
  };
}

function mapUpdate(r) {
  const f = r.fields || {};
  return {
    id: r.id,
    name: f[U.name] || '',
    subject: f[U.subject] || null,
    recap: f[U.recap] || null,
    created: f[U.created] || null,
    sent_by: f[U.sentBy] && f[U.sentBy].name ? f[U.sentBy].name : null,
    sent_to: f[U.sentTo] || null,
  };
}

function mapEvent(r) {
  const f = r.fields || {};
  return {
    id: r.id,
    name: f[E.name] || f[E.title] || '(untitled)',
    title: f[E.title] || null,
    start_date: f[E.startDate] || null,
    type: extractSelect(f[E.type]),
    status: extractSelect(f[E.status]),
    location: f[E.location] || null,
    description: f[E.description] || null,
    is_future: f[E.isFuture] === 1 || f[E.isFuture] === true || f[E.isFuture] === '✅',
  };
}

function mapActionItem(r) {
  const f = r.fields || {};
  return {
    id: r.id,
    item: f[X.item] || '',
    type: extractSelect(f[X.type]),
    status: extractSelect(f[X.status]),
    timing: extractSelect(f[X.timing]),
    owner: f[X.owner] || null,
    source: f[X.source] || null,
    meeting_date: f[X.meetingDate] || null,
    notes: f[X.notes] || null,
    created: f[X.created] || null,
  };
}

function extractSelect(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if (v.name) return v.name;
    if (Array.isArray(v) && v.length > 0) {
      const first = v[0];
      if (typeof first === 'string') return first;
      if (first && first.name) return first.name;
    }
  }
  return null;
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const config = {
  path: '/api/artist',
};
