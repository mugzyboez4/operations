/* TEMPO re-skin QA — render every live page, screenshot it, and assert the
   design system actually landed: paper background, no low-contrast text,
   Inter everywhere, no leftover dark surfaces, no stylesheet 404s. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/claude/ops-site';
const OUT = '/home/claude/shots';
const BASE = 'http://127.0.0.1:8899';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'archive' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(path.relative(ROOT, p));
  }
  return acc;
}

function lum(rgb) {
  const c = rgb.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function parseRGB(s) {
  const m = s && s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(Number);
  if (p.length > 3 && p[3] === 0) return null;
  return [p[0], p[1], p[2]];
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pages = walk(ROOT).sort();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // sandbox has no egress; block third-party requests so pages settle
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  const results = [];

  for (const rel of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('requestfailed', r => {
      const u = r.url();
      if (u.startsWith(BASE) && /\.(css|js)(\?|$)/.test(u)) errors.push('FAILED ' + u.replace(BASE, ''));
    });
    page.on('response', r => {
      if (r.status() >= 400 && /\.(css|js)(\?|$)/.test(r.url())) {
        errors.push(r.status() + ' ' + r.url().replace(BASE, ''));
      }
    });

    let audit = {};
    try {
      await page.goto(BASE + '/' + rel, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(250);

      audit = await page.evaluate(() => {
        const out = { bodyBg: '', bodyFont: '', lowContrast: [], darkSurfaces: 0, badFonts: [], tempoLinked: false };
        out.tempoLinked = !!document.querySelector('link[href*="tempo.css"], link[href*="shell.css"], link[href*="style.css"]');
        const cs = getComputedStyle(document.body);
        out.bodyBg = cs.backgroundColor;
        out.bodyFont = cs.fontFamily;

        // walk up compositing every translucent layer, so a chip on a 7% tint
        // reports the colour a human actually sees
        function bgOf(el) {
          const stack = [];
          let n = el;
          while (n) {
            const c = getComputedStyle(n).backgroundColor;
            const m = c.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const p = m[1].split(',').map(Number);
              const a = p.length > 3 ? p[3] : 1;
              if (a > 0) {
                stack.push([p[0], p[1], p[2], a]);
                if (a >= 0.999) break;
              }
            }
            n = n.parentElement;
          }
          let out = [255, 255, 255];
          for (let i = stack.length - 1; i >= 0; i--) {
            const [r, g, b, a] = stack[i];
            out = [r * a + out[0] * (1 - a), g * a + out[1] * (1 - a), b * a + out[2] * (1 - a)];
          }
          return 'rgb(' + out.map(Math.round).join(', ') + ')';
        }

        const els = Array.from(document.querySelectorAll('body *'));
        for (const el of els) {
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
          const direct = Array.from(el.childNodes)
            .filter(n => n.nodeType === 3 && n.nodeValue.trim().length > 1);
          if (!direct.length) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          out.lowContrast.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && el.className.toString().slice(0, 40)) || '',
            fg: st.color, bg: bgOf(el),
            text: direct[0].nodeValue.trim().slice(0, 40),
            fontSize: parseFloat(st.fontSize),
            weight: st.fontWeight,
          });
          if (!/Inter|ui-monospace|SF Mono|Consolas|Cascadia|Menlo|monospace|-apple-system|Helvetica|Arial|sans-serif/i.test(st.fontFamily)) {
            out.badFonts.push(st.fontFamily);
          }
        }
        for (const el of els) {
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
          if (m) {
            const [r, g, b] = [+m[1], +m[2], +m[3]];
            const a = m[4] === undefined ? 1 : +m[4];
            const rect = el.getBoundingClientRect();
            if (a > 0.5 && r < 40 && g < 40 && b < 40 && rect.width * rect.height > 200000) out.darkSurfaces++;
          }
        }
        return out;
      });

      await page.screenshot({
        path: path.join(OUT, rel.replace(/[\/]/g, '__') + '.png'),
        fullPage: false,
      });
    } catch (e) {
      errors.push('LOAD ' + e.message.split('\n')[0].slice(0, 120));
    }

    // contrast pass in node
    const bad = [];
    for (const c of (audit.lowContrast || [])) {
      const fg = parseRGB(c.fg), bg = parseRGB(c.bg);
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      const large = c.fontSize >= 24 || (c.fontSize >= 18.66 && +c.weight >= 700);
      const need = large ? 3.0 : 4.5;
      if (ratio < need) bad.push({ ...c, ratio: +ratio.toFixed(2), need });
    }

    results.push({
      page: rel,
      bodyBg: audit.bodyBg,
      tempoLinked: audit.tempoLinked,
      darkSurfaces: audit.darkSurfaces || 0,
      badFonts: [...new Set(audit.badFonts || [])],
      contrastFails: bad.length,
      worst: bad.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 6),
      allBad: bad,
      errors,
    });
    await page.close();
  }

  await browser.close();
  fs.writeFileSync('/home/claude/qa-report.json', JSON.stringify(results, null, 1));

  // summary
  const PAPER = 'rgb(245, 242, 235)';
  const wrongBg = results.filter(r => r.bodyBg !== PAPER);
  const noLink = results.filter(r => !r.tempoLinked);
  const dark = results.filter(r => r.darkSurfaces > 0);
  const fonts = results.filter(r => r.badFonts.length);
  const errs = results.filter(r => r.errors.length);
  const cf = results.filter(r => r.contrastFails > 0).sort((a, b) => b.contrastFails - a.contrastFails);

  console.log(`pages rendered: ${results.length}`);
  console.log(`wrong body background: ${wrongBg.length}` + (wrongBg.length ? ' -> ' + wrongBg.map(r => r.page + ' ' + r.bodyBg).join(', ') : ''));
  console.log(`missing stylesheet link: ${noLink.length}` + (noLink.length ? ' -> ' + noLink.map(r => r.page).join(', ') : ''));
  console.log(`large dark surfaces: ${dark.length}` + (dark.length ? ' -> ' + dark.map(r => r.page).join(', ') : ''));
  console.log(`non-system fonts: ${fonts.length}` + (fonts.length ? ' -> ' + fonts.map(r => r.page + ':' + r.badFonts[0]).join(', ') : ''));
  console.log(`css/js load errors: ${errs.length}` + (errs.length ? ' -> ' + errs.map(r => r.page + ' ' + r.errors[0]).join('; ') : ''));
  console.log(`\npages with contrast failures: ${cf.length}`);
  const pairs = {};
  for (const r of results) for (const w of r.allBad || []) {
    const k = w.fg + ' on ' + w.bg;
    pairs[k] = pairs[k] || { n: 0, ratio: w.ratio, pages: new Set(), sample: w.text, cls: w.cls };
    pairs[k].n++; pairs[k].pages.add(r.page);
  }
  const rows = Object.entries(pairs).sort((a, b) => b[1].n - a[1].n);
  console.log(`distinct failing colour pairs: ${rows.length}`);
  for (const [k, v] of rows.slice(0, 22)) {
    console.log(`  ${String(v.ratio).padStart(5)}:1  x${String(v.n).padEnd(5)} ${v.pages.size} pages   ${k}   .${v.cls}  "${v.sample}"`);
  }
})();
