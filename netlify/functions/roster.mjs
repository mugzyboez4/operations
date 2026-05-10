// Read-only proxy to the RCA Records (Copy) Airtable base — Roster surface.
// Returns artists with a Weekly Category set, used by /artists/index.html.
// Password-gated via X-Grid-Password header. Token is server-side only.

const BASE_ID = 'appLwUF3H4KjtiRdW';   // RCA Records (Copy)
const TABLE_ID = 'tblV9HXEZ5k6uFXFQ';  // Artists

// Field IDs (stable across renames)
const FLD_NAME            = 'fld8PER8PqVHcZBFh';  // Name (primary)
const FLD_IMAGE           = 'fldRXJGMzyRRbGKEL';  // Image
const FLD_STATUS          = 'fldRuxnxUwfa8QQIJ';  // Status (singleSelect)
const FLD_GENRE           = 'fldSDGCxT3qPRvJD2';  // Genre (singleSelect)
const FLD_SPOTIFY_FOLLOWS = 'fldTmRkJMTQ6eQ4su';  // Spotify Followers (number)
const FLD_SPOTIFY_POP     = 'flde8jQvhgXGh68mC';  // Spotify Popularity (number)
const FLD_SPOTIFY_ID      = 'fld09PGkl0HMmmeHl';  // Spotify ID (text)
const FLD_WEEKLY_CATEGORY = 'fldpEPkN4wh6rMjdu';  // Weekly Category (singleSelect)

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
  if (missing.length > 0) {
    return jsonResponse(500, { error: 'misconfigured', missing });
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  // Password gate
  const provided = req.headers.get('x-grid-password') || '';
  if (provided !== ROSTER_PASSWORD) {
    return jsonResponse(401, { error: 'unauthorized' });
  }

  try {
    const allRecords = [];
    let offset = null;
    let pageCount = 0;
    // Filter: only records where Weekly Category is set (not blank).
    // Airtable formula: NOT({Weekly Category} = '')
    const filterFormula = encodeURIComponent("NOT({Weekly Category} = '')");
    do {
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}` +
        `?pageSize=100&filterByFormula=${filterFormula}&returnFieldsByFieldId=true` +
        (offset ? `&offset=${encodeURIComponent(offset)}` : '');
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
      if (pageCount > 5) break; // safety: roster should never need 500+ records
    } while (offset);

    // Map raw records → clean shape for frontend
    const artists = allRecords.map(r => mapRecord(r));

    return jsonResponse(200, {
      week_label: weekLabel(),
      artists,
      count: artists.length,
      synced_at: new Date().toISOString()
    });
  } catch (e) {
    return jsonResponse(500, { error: 'fetch_failed', message: String(e) });
  }
};

// ───────── helpers ─────────

function mapRecord(r) {
  const f = r.fields || {};
  const imageAtt = (f[FLD_IMAGE] && f[FLD_IMAGE][0]) || null;
  // Spotify image filename → stable CDN URL (better than airtableusercontent which expires).
  // The `filename` on Spotify images is the bare image hash that `i.scdn.co/image/<hash>` serves.
  let imageUrl = null;
  if (imageAtt) {
    const fname = imageAtt.filename || '';
    if (/^ab6[0-9a-f]+$|^c69[0-9a-f]+$/i.test(fname.replace(/\.(jpg|jpeg|png)$/i, ''))) {
      imageUrl = `https://i.scdn.co/image/${fname.replace(/\.(jpg|jpeg|png)$/i, '')}`;
    } else {
      // Fall back to Airtable thumbnail URL (signed, may expire — frontend handles 403 with placeholder)
      imageUrl = (imageAtt.thumbnails && imageAtt.thumbnails.large && imageAtt.thumbnails.large.url) || imageAtt.url;
    }
  }

  const status = f[FLD_STATUS] && f[FLD_STATUS].name;
  const genre = f[FLD_GENRE] && f[FLD_GENRE].name;
  const weeklyCategory = f[FLD_WEEKLY_CATEGORY] && f[FLD_WEEKLY_CATEGORY].name;

  return {
    id: r.id,
    name: f[FLD_NAME] || '(unnamed)',
    image_url: imageUrl,
    status: status || null,
    genre: genre || null,
    spotify_followers: f[FLD_SPOTIFY_FOLLOWS] || null,
    spotify_popularity: f[FLD_SPOTIFY_POP] || null,
    spotify_id: f[FLD_SPOTIFY_ID] || null,
    weekly_category: weeklyCategory || null,
    airtable_url: `https://airtable.com/${BASE_ID}/${TABLE_ID}/${r.id}`
  };
}

function weekLabel() {
  // Compute "Week of MMM DD–DD, YYYY" for current Monday → Sunday
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diffToMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sameMonth = mon.getUTCMonth() === sun.getUTCMonth();
  if (sameMonth) {
    return `${months[mon.getUTCMonth()]} ${mon.getUTCDate()}–${sun.getUTCDate()}, ${sun.getUTCFullYear()}`;
  }
  return `${months[mon.getUTCMonth()]} ${mon.getUTCDate()} – ${months[sun.getUTCMonth()]} ${sun.getUTCDate()}, ${sun.getUTCFullYear()}`;
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
  path: '/api/roster'
};
