/**
 * Digital Partner Guide — live feed of the shared Google Doc.
 *
 * Fetches the doc's HTML export and reduces it to the small vocabulary the
 * page understands: h2 (partner) / h3 (subhead) / p / ul / ol / table.
 *
 * The export carries no heading tags — the doc styles its headings rather
 * than using Heading 1/2/3 — so headings are recovered from the export's own
 * stylesheet: a partner is a paragraph carrying Google's semantic `title`
 * class, a subhead is a paragraph whose runs are bold AND underlined. Class
 * names (c9, c23, …) are regenerated on every export, so they are never
 * matched against directly.
 *
 * Response: { title, html, headings: [{level, text}], fetchedAt }
 */

/**
 * Doc sources, tried in order. The first is "Digital Partners / Transition",
 * the working doc the partner team edits; its document tabs export as h2
 * partners and its bold-underlined subheads as h3 sections. The second is the
 * restructured guide, kept as a fallback for when the first is unreachable.
 * Set PARTNER_GUIDE_DOC_ID to pin one.
 */
const DOC_IDS = process.env.PARTNER_GUIDE_DOC_ID
  ? [process.env.PARTNER_GUIDE_DOC_ID]
  : [
      '1N_4RBccBEz5ndFV67ZEtibpUjPo2ywn50Y_eb91PKFg',
      '1Q3UtPYqLIYuLgMiYHJa5pUDbmztfEJP9BYSKTc0AoLo'
    ];

const exportUrl = (id) =>
  `https://docs.google.com/document/d/${id}/export?format=html`;

const KEEP = new Set([
  'h2', 'h3', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
  'tr', 'td', 'th', 'a', 'em', 'strong', 'br'
]);

function unwrap(href) {
  if (!href) return '';
  const m = /^https?:\/\/(?:www\.)?google\.com\/url\?q=([^&]+)/.exec(href);
  return m ? decodeURIComponent(m[1]) : href;
}

/** class name -> { bold, underline }, read from the export's own <style> block */
function styleIndex(raw) {
  const css = (/<style[^>]*>([\s\S]*?)<\/style>/i.exec(raw) || [])[1] || '';
  const idx = new Map();
  for (const m of css.matchAll(/\.([A-Za-z0-9_-]+)\{([^}]*)\}/g)) {
    idx.set(m[1], {
      bold: /font-weight:\s*(700|bold)/i.test(m[2]),
      italic: /font-style:\s*italic/i.test(m[2]),
      underline: /text-decoration:\s*underline/i.test(m[2])
    });
  }
  return idx;
}

function classFlags(idx, attrValue) {
  let bold = false;
  let italic = false;
  let underline = false;
  for (const c of (attrValue || '').split(/\s+/)) {
    const s = idx.get(c);
    if (!s) continue;
    if (s.bold) bold = true;
    if (s.italic) italic = true;
    if (s.underline) underline = true;
  }
  return { bold, italic, underline };
}

/**
 * Google carries bold and italic on styled spans rather than <strong>/<em>.
 * The page builds its chips and accordions from the bold lead-in of each
 * item, so the emphasis has to survive as real tags.
 */
function inlineFlags(style) {
  return {
    bold: /font-weight:\s*(?:700|800|900|bold)/i.test(style || ''),
    italic: /font-style:\s*italic/i.test(style || ''),
    underline: /text-decoration:[^;]*underline/i.test(style || '')
  };
}

function emphasise(html, idx) {
  let out = html;
  for (let pass = 0; pass < 6; pass++) {
    const next = out.replace(
      /<span\b([^>]*)>((?:(?!<span\b)[\s\S])*?)<\/span>/gi,
      (whole, attrs, inner) => {
        const cls = (/class\s*=\s*"([^"]*)"/i.exec(attrs) || ['', ''])[1];
        const sty = (/style\s*=\s*"([^"]*)"/i.exec(attrs) || ['', ''])[1];
        const a = classFlags(idx, cls);
        const b = inlineFlags(sty);
        const f = { bold: a.bold || b.bold, italic: a.italic || b.italic };
        let t = inner;
        if (f.italic) t = '<em>' + t + '</em>';
        if (f.bold) t = '<strong>' + t + '</strong>';
        return t;
      }
    );
    if (next === out) break;
    out = next;
  }
  // <b>/<i> from a markdown-imported doc mean the same thing.
  out = out.replace(/<(\/?)b>/gi, '<$1strong>').replace(/<(\/?)i>/gi, '<$1em>');
  return out;
}

const strip = (s) => s.replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function inline(html) {
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
    const n = name.toLowerCase();
    if (!KEEP.has(n)) return '';
    if (tag[1] === '/') return `</${n}>`;
    if (n === 'a') {
      const h = /href\s*=\s*"([^"]*)"/i.exec(attrs) || /href\s*=\s*'([^']*)'/i.exec(attrs);
      const href = unwrap(h ? h[1] : '');
      return href ? `<a href="${href}" target="_blank" rel="noopener">` : '<a>';
    }
    if (n === 'br') return '<br>';
    return `<${n}>`;
  });
}

/**
 * Google emits an indented list as a run of SIBLING <ul> elements, each
 * tagged lst-kix_<listId>-<level>, rather than nesting them. The page builds
 * its accordions from real nesting — an <li> whose children include a <ul> —
 * so the levels have to be turned back into structure before anything else.
 */
function renest(html) {
  const BLOCK = /(?:<(?:ul|ol)\b[^>]*>[\s\S]*?<\/(?:ul|ol)>\s*)+/gi;
  return html.replace(BLOCK, (run) => {
    const lists = [...run.matchAll(/<(ul|ol)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
    if (lists.length < 2) return run;

    const levelOf = (attrs) => {
      const m = /lst-kix_[A-Za-z0-9]+-(\d+)/.exec(attrs || '');
      return m ? Number(m[1]) : 0;
    };
    if (!lists.some((l) => levelOf(l[2]) > 0)) return run;

    const items = [];
    for (const l of lists) {
      const tag = l[1].toLowerCase();
      const lvl = levelOf(l[2]);
      for (const li of l[3].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        items.push({ lvl, tag, html: li[1] });
      }
    }

    const build = (start, lvl) => {
      let out = '';
      let i = start;
      let tag = 'ul';
      while (i < items.length && items[i].lvl >= lvl) {
        if (items[i].lvl > lvl) { i++; continue; }
        tag = items[i].tag;
        let j = i + 1;
        while (j < items.length && items[j].lvl > lvl) j++;
        const child = j > i + 1 ? build(i + 1, lvl + 1) : '';
        out += '<li>' + items[i].html + child + '</li>';
        i = j;
      }
      return out ? '<' + tag + '>' + out + '</' + tag + '>' : '';
    };
    return build(0, 0);
  });
}

function reduce(raw) {
  const idx = styleIndex(raw);
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(raw);
  let s = body ? body[1] : raw;

  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // Google exports document comments as [a]/[b] anchors inside the text, plus
  // a block of comment bodies at the end. Neither belongs in the guide.
  // The block is found before the anchors are stripped — stripping first
  // leaves nothing for the search to match, and the whole thread renders.
  s = s.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '');
  const cmnt = s.search(/<div\b[^>]*>\s*(?:<p\b[^>]*>\s*)?<a\b[^>]*href="#cmnt(_ref)?\d/i);
  if (cmnt > -1) s = s.slice(0, cmnt);
  s = s.replace(/<a\b[^>]*href="#cmnt[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

  s = renest(s);

  // Partner names, so a bold restatement of one is not mistaken for a subhead.
  const partners = new Set();
  for (const m of s.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)) {
    const cls = (/class\s*=\s*"([^"]*)"/i.exec(m[1]) || ['', ''])[1];
    if (/\btitle\b/.test(cls)) {
      const t = strip(m[2]);
      if (t) partners.add(t.toLowerCase());
    }
  }

  // Promote styled paragraphs to headings before any tags are stripped.
  s = s.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (whole, attrs, innerHtml) => {
    const cls = (/class\s*=\s*"([^"]*)"/i.exec(attrs) || ['', ''])[1];
    const text = strip(innerHtml);
    if (!text) return '';

    if (/\btitle\b/.test(cls)) return '<h2>' + text + '</h2>';

    // A subhead: every run in the paragraph is bold, and it is short enough
    // to be a label rather than a sentence. A bold line that merely repeats a
    // partner name stays a paragraph.
    // A line that only restates a partner name is a visual echo, not content.
    if (partners.has(text.toLowerCase())) return '';

    const runs = [...innerHtml.matchAll(/<span class="([^"]*)"/gi)];
    if (runs.length) {
      const flags = runs.map((m) => classFlags(idx, m[1]));
      if (flags.every((f) => f.bold) && text.length <= 120) {
        return '<h3>' + text + '</h3>';
      }
    }
    return '<p>' + innerHtml + '</p>';
  });

  s = emphasise(s, idx);
  s = inline(s);
  s = s.replace(/<(strong|em)>\s*<\/\1>/gi, '');
  s = s.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

/* --------------------------------------------------------- normalisation */

/**
 * Each partner in the doc carries its own set of subheads — VEVO has five,
 * META three, and "Flow of Communication" holds POCs, standing calls and
 * pitch deadlines at once. The page builds four tabs, so every section is
 * re-filed here into Opportunities / Info / Troubleshooting / Contacts and
 * the doc's own subhead is kept as a bold lead-in above what it held.
 *
 * Sections the guide reads whole are left alone.
 */
const SECTIONS = ['Opportunities', 'Info', 'Troubleshooting', 'Contacts'];
const UNTOUCHED = /^(workflows?\b|next steps)/i;

const BUCKET = [
  [/troubleshoot|backend access|support/i, 'Troubleshooting'],
  [/opportunit|program|required solution|pitch/i, 'Opportunities'],
  [/^contacts?$/i, 'Contacts'],
  [/flow of communication/i, 'SPLIT'],
  [/./, 'Info']
];

// The page gives a flame callout to the leaves of a bullet led this way, so
// pitch routes and deadlines keep that treatment once they leave Contacts.
const PITCH_LEAD = 'How to pitch &mdash; routes &amp; deadlines';

// Top-level lists only. A nested list closes a </ul> of its own, so matching
// to the first one truncates the bullet that holds it.
function lists(html) {
  const out = [];
  let depth = 0, start = -1;
  const re = /<(\/?)(ul|ol)>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== '/') { if (depth === 0) start = m.index; depth++; }
    else if (--depth === 0) out.push(html.slice(start, re.lastIndex));
  }
  return out;
}

// One bullet at a time, so a nested list stays with the bullet it hangs off.
function items(listHtml) {
  const inner = listHtml.replace(/^<(ul|ol)>/i, '').replace(/<\/(ul|ol)>$/i, '');
  const out = [];
  let depth = 0, start = -1;
  const re = /<(\/?)(li|ul|ol)>/gi;
  let m;
  while ((m = re.exec(inner))) {
    const close = m[1] === '/', tag = m[2].toLowerCase();
    if (tag === 'li' && !close) { if (depth === 0) start = m.index; depth++; }
    else if (tag === 'li' && close) {
      depth--;
      if (depth === 0) out.push(inner.slice(start, re.lastIndex));
    }
  }
  return out;
}

// A "Flow of Communication" bullet belongs with the people, the pitch routes
// or the standing detail, depending on what it carries.
function fileLine(li) {
  const text = strip(li);
  if (/mailto:/i.test(li) || /^\s*POC\b/i.test(text)) return 'Contacts';
  if (/pitch|submission|slate|\bform\b|\bdue\b|deadline/i.test(text)) return 'Opportunities';
  return 'Info';
}

function normalise(html) {
  const marks = [];
  for (const m of html.matchAll(/<(h2|h3)>([\s\S]*?)<\/\1>/gi)) {
    marks.push({ lvl: m[1] === 'h2' ? 2 : 3, text: strip(m[2]), at: m.index, end: m.index + m[0].length });
  }
  if (!marks.length) return html;

  let out = html.slice(0, marks[0].at);

  for (let i = 0; i < marks.length; i++) {
    const mk = marks[i];
    if (mk.lvl !== 2) continue;

    // Everything up to the next partner.
    let j = i + 1;
    while (j < marks.length && marks[j].lvl === 3) j++;

    if (UNTOUCHED.test(mk.text) || j === i + 1) {
      out += html.slice(mk.at, j < marks.length ? marks[j].at : html.length);
      i = j - 1;
      continue;
    }

    const bucket = {};
    SECTIONS.forEach((s) => { bucket[s] = ''; });

    for (let k = i + 1; k < j; k++) {
      const name = marks[k].text;
      const body = html.slice(marks[k].end, k + 1 < j ? marks[k + 1].at : (j < marks.length ? marks[j].at : html.length));
      const target = (BUCKET.find(([re]) => re.test(name)) || [, 'Info'])[1];

      if (target !== 'SPLIT') {
        // Keep the doc's own label unless it is already the section name.
        const lead = new RegExp('^' + target + ':?$', 'i').test(name)
          ? '' : '<p><strong>' + name.replace(/:\s*$/, '') + '</strong></p>';
        bucket[target] += lead + body;
        continue;
      }

      const spill = { Opportunities: [], Info: [], Contacts: [] };
      let rest = body;
      for (const list of lists(body)) {
        rest = rest.replace(list, '');
        for (const li of items(list)) spill[fileLine(li)].push(li);
      }
      if (spill.Opportunities.length) {
        bucket.Opportunities += '<ul><li><strong>' + PITCH_LEAD + '</strong><ul>' +
          spill.Opportunities.join('') + '</ul></li></ul>';
      }
      for (const key of ['Info', 'Contacts']) {
        if (spill[key].length) bucket[key] += '<ul>' + spill[key].join('') + '</ul>';
      }
      if (strip(rest)) bucket.Info += rest;
    }

    // Whatever sits under the partner name before its first subhead — the
    // status line, a resources link — stays where the page expects it.
    out += '<h2>' + mk.text + '</h2>' + html.slice(mk.end, marks[i + 1].at);
    for (const s of SECTIONS) if (strip(bucket[s])) out += '<h3>' + s + '</h3>' + bucket[s];
    i = j - 1;
  }

  return out;
}

function headings(html) {
  const out = [];
  for (const m of html.matchAll(/<(h2|h3)>([\s\S]*?)<\/\1>/gi)) {
    const text = strip(m[2]).replace(/&amp;/g, '&');
    if (text) out.push({ level: m[1] === 'h2' ? 2 : 3, text });
  }
  return out;
}

export default async () => {
  try {
    let raw = null, used = null, last = 0;
    for (const id of DOC_IDS) {
      const res = await fetch(exportUrl(id), { redirect: 'follow' });
      if (res.ok) {
        const text = await res.text();
        // A doc that is not link-shared answers 200 with a sign-in page.
        if (!/<title>\s*(?:Sign in|Meet Google Drive)/i.test(text)) {
          raw = text; used = id; break;
        }
      }
      last = res.status;
    }
    if (raw === null) {
      return Response.json(
        { error: 'doc fetch failed: ' + last },
        { status: 502, headers: { 'cache-control': 'no-store' } }
      );
    }
    const html = normalise(reduce(raw));
    return Response.json(
      {
        title: 'Digital Partner Guide',
        html,
        headings: headings(html),
        docId: used,
        fetchedAt: new Date().toISOString()
      },
      {
        headers: {
          'cache-control': 'public,max-age=60',
          'access-control-allow-origin': '*'
        }
      }
    );
  } catch (e) {
    return Response.json(
      { error: String((e && e.message) || e) },
      { status: 500, headers: { 'cache-control': 'no-store' } }
    );
  }
};

export const config = { path: '/api/partner-guide' };
