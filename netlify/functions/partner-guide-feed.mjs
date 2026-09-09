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

const DOC_ID = process.env.PARTNER_GUIDE_DOC_ID
  || '1N_4RBccBEz5ndFV67ZEtibpUjPo2ywn50Y_eb91PKFg';

const EXPORT = `https://docs.google.com/document/d/${DOC_ID}/export?format=html`;

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
function emphasise(html, idx) {
  let out = html;
  for (let pass = 0; pass < 4; pass++) {
    const next = out.replace(
      /<span class="([^"]*)"[^>]*>((?:(?!<span\b)[\s\S])*?)<\/span>/gi,
      (whole, cls, inner) => {
        const f = classFlags(idx, cls);
        let t = inner;
        if (f.italic) t = '<em>' + t + '</em>';
        if (f.bold) t = '<strong>' + t + '</strong>';
        return t;
      }
    );
    if (next === out) break;
    out = next;
  }
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
  const BLOCK = /(?:<ul\b[^>]*>[\s\S]*?<\/ul>\s*)+/gi;
  return html.replace(BLOCK, (run) => {
    const lists = [...run.matchAll(/<ul\b([^>]*)>([\s\S]*?)<\/ul>/gi)];
    if (lists.length < 2) return run;

    const levelOf = (attrs) => {
      const m = /lst-kix_[A-Za-z0-9]+-(\d+)/.exec(attrs || '');
      return m ? Number(m[1]) : 0;
    };
    if (!lists.some((l) => levelOf(l[1]) > 0)) return run;

    const items = [];
    for (const l of lists) {
      const lvl = levelOf(l[1]);
      for (const li of l[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        items.push({ lvl, html: li[1] });
      }
    }

    const build = (start, lvl) => {
      let out = '';
      let i = start;
      while (i < items.length && items[i].lvl >= lvl) {
        if (items[i].lvl > lvl) { i++; continue; }
        let j = i + 1;
        while (j < items.length && items[j].lvl > lvl) j++;
        const child = j > i + 1 ? build(i + 1, lvl + 1) : '';
        out += '<li>' + items[i].html + child + '</li>';
        i = j;
      }
      return out ? '<ul>' + out + '</ul>' : '';
    };
    return build(0, 0);
  });
}

function reduce(raw) {
  const idx = styleIndex(raw);
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(raw);
  let s = body ? body[1] : raw;

  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // Google exports document comments as [a]/[b] anchors inside the text, plus
  // a block of comment bodies at the end. Neither belongs in the guide.
  s = s.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '');
  s = s.replace(/<a\b[^>]*href="#cmnt[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  const cmnt = s.search(/<div\b[^>]*>\s*(?:<p\b[^>]*>\s*)?<a\b[^>]*href="#cmnt_ref/i);
  if (cmnt > -1) s = s.slice(0, cmnt);

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
    const res = await fetch(EXPORT, { redirect: 'follow' });
    if (!res.ok) {
      return Response.json(
        { error: 'doc fetch failed: ' + res.status },
        { status: 502, headers: { 'cache-control': 'no-store' } }
      );
    }
    const html = reduce(await res.text());
    return Response.json(
      {
        title: 'Digital Partner Guide',
        html,
        headings: headings(html),
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
