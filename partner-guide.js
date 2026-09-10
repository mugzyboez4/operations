/**
 * Digital Partner Guide — builds the page from the live Google Doc feed.
 *
 * /api/partner-guide returns the doc reduced to h2 (partner) / h3 (subhead) /
 * p / ul / table. This maps that onto the guide's own vocabulary — sections,
 * kickers, POC cards, opp accordions, callouts — so the page keeps its shape
 * while its content comes from the doc.
 *
 * Loaded absolutely so the WordPress copy and this one share one script.
 */
(function () {
  var API = 'https://operations.mugzyboez.co/api/partner-guide';

  // One tab per section of the doc. The regexes also match the headings the
  // pre-restructure doc used, so the page renders either version.
  var VIEWS = [
    { key: 'opps', label: '01 · Opportunities',   match: /opportunit|program|required solution|next step/i },
    { key: 'info', label: '02 · Info',            match: /^info$|flow of communication|features|availability|operations|workflow/i },
    { key: 'ts',   label: '03 · Troubleshooting', match: /troubleshoot|backend access|support/i },
    { key: 'poc',  label: '04 · Contacts',        match: /^contacts?$|flow of communication/i }
  ];

  // Info is the catch-all: a heading none of the other tabs claim lands there,
  // so nothing in the doc goes unrendered.
  function claims(view, name) {
    if (view.match.test(name)) return true;
    if (view.key !== 'info') return false;
    return !VIEWS.some(function (v) {
      return v.key !== 'info' && v.match.test(name);
    });
  }

  var body = document.body;
  var guide = document.getElementById('guide');
  var stat = document.getElementById('livestat');
  var navsets = document.getElementById('navsets');
  var search = document.getElementById('guideSearch');
  var clearBtn = document.getElementById('searchClear');
  var toggleBtn = document.getElementById('toggleAll');
  var searchStatus = document.getElementById('searchStatus');

  fetch(API, { cache: 'no-store' })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) { res.ok ? render(res.j) : fail(res.j); })
    .catch(function (e) { fail({ error: 'unreachable', message: String(e) }); });

  function fail(j) {
    stat.innerHTML = '<span class="bad">Not syncing</span>';
    guide.innerHTML = '<div class="loadmsg">' + (
      j && j.error === 'doc_not_shared'
        ? 'The source doc is not shared. Open it, then Share &rarr; General access &rarr; <b>Anyone with the link &middot; Viewer</b>.'
        : 'Could not reach the doc feed. <code>' + esc(String(j && (j.error || j.message))) + '</code>'
    ) + '</div>';
  }

  /* ------------------------------------------------------------- parsing */

  function render(data) {
    var host = document.createElement('div');
    host.innerHTML = data.html || '';

    // Doc -> [{ name, status, groups: [{ name, nodes }] }]
    var partners = [], partner = null, group = null;
    [].slice.call(host.childNodes).forEach(function (n) {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'H2') {
        partner = { name: n.textContent.trim(), status: null, groups: [] };
        partners.push(partner);
        group = null;
        return;
      }
      if (!partner) return;
      if (n.tagName === 'H3') {
        group = { name: n.textContent.trim(), nodes: [] };
        partner.groups.push(group);
        return;
      }
      // A partnership-status line is the guide's status strip, not body copy.
      if (!group && n.tagName === 'P' && /^status of partnership/i.test(n.textContent)) {
        partner.status = n.innerHTML.replace(/^\s*(status of partnership:?)/i, '<b>$1</b>');
        return;
      }
      if (!group) { group = { name: '', nodes: [] }; partner.groups.push(group); }
      group.nodes.push(n);
    });

    // In the restructured doc the status line is a bullet under Info; it is
    // still the section's status strip, not body copy.
    partners.forEach(function (p) {
      if (p.status) return;
      p.groups.forEach(function (g) {
        g.nodes.forEach(function (n) {
          if (!/^(UL|OL)$/.test(n.tagName || '')) return;
          [].slice.call(n.children).forEach(function (li) {
            if (li.tagName !== 'LI' || p.status) return;
            if (!/^\s*status of partnership/i.test(li.textContent)) return;
            p.status = li.innerHTML.replace(/^\s*(status of partnership:?)/i, '<b>$1</b>');
            li.remove();
          });
        });
      });
    });

    guide.innerHTML = '';
    VIEWS.forEach(function (view, vi) {
      var wrap = document.createElement('div');
      wrap.setAttribute('data-view-group', view.key);

      var banner = document.createElement('div');
      banner.className = 'wf-banner';
      banner.innerHTML = '<span>Workflow ' + view.label + '</span><div class="bar"></div>';
      wrap.appendChild(banner);

      var shown = 0;
      partners.forEach(function (p, pi) {
        var groups = p.groups.filter(function (g) {
          return claims(view, g.name || p.name);
        });
        if (!groups.length) return;
        shown++;
        wrap.appendChild(section(view.key, p, groups, shown));
      });

      if (!shown) wrap.appendChild(el('div', 'loadmsg', 'Nothing in the doc matches this workflow yet.'));
      guide.appendChild(wrap);
      void vi;
    });

    buildTabs();
    buildNav(partners);
    wire();
    setView('opps');

    // Only the partner sections are counted; the doc's cross-partner sections
    // (workflows, next steps) carry no subheads.
    var partnerCount = partners.filter(function (p) {
      return p.groups.some(function (g) { return !!g.name; });
    }).length || partners.length;

    stat.innerHTML = '<b>' + partnerCount + '</b> partners &middot; read live from the doc &middot; synced ' +
      new Date(data.fetchedAt || Date.now()).toLocaleString();
  }

  function section(viewKey, p, groups, num) {
    var sec = document.createElement('section');
    sec.id = viewKey + '-' + slug(p.name);
    sec.setAttribute('data-sec', p.name);

    var head = document.createElement('div');
    head.className = 'sec-head';
    head.innerHTML = '<span class="chev">&darr;</span> <span class="sec-num">' +
      pad(num) + '</span> <h2>' + esc(p.name) + '</h2> ' +
      '<span class="src-chip">Live &middot; Google Doc</span>';
    sec.appendChild(head);

    var bodyEl = document.createElement('div');
    bodyEl.className = 'sec-body';
    if (p.status) bodyEl.appendChild(el('div', 'status-strip', p.status, true));

    groups.forEach(function (g) {
      if (g.name) bodyEl.appendChild(el('div', 'kicker', esc(g.name), true));
      var isContacts = /^contacts?$|flow of communication|contact/i.test(g.name || '');
      // Any deep section reads better as accordions, not one long list.
      var isOpps = /opportunit|program|troubleshoot/i.test(g.name || '');
      g.nodes.forEach(function (n) { renderNode(n, bodyEl, isContacts, isOpps); });
    });

    sec.appendChild(bodyEl);
    return sec;
  }

  function renderNode(node, into, isContacts, isOpps) {
    var tag = node.tagName;

    if (tag === 'UL' || tag === 'OL') {
      var items = [].slice.call(node.children).filter(function (c) { return c.tagName === 'LI'; });

      // "Name <email>" lines under a contacts heading become POC cards.
      if (isContacts) {
        var contacts = items.filter(function (li) { return /[\w.+-]+@[\w.-]+\.\w+/.test(li.textContent); });
        if (contacts.length) {
          var grid = document.createElement('div');
          grid.className = 'poc-grid';
          contacts.forEach(function (li) {
            contactsIn(li).forEach(function (c) { grid.appendChild(pocCard(c)); });
          });
          into.appendChild(grid);
          items = items.filter(function (li) { return contacts.indexOf(li) === -1; });
        }
        // Only a real deadline earns the flame callout; the rest is a plain list.
        var urgent = items.filter(function (li) { return /\b(due|deadline|EOD)\b/i.test(li.textContent); });
        var rest = items.filter(function (li) { return urgent.indexOf(li) === -1; });
        if (rest.length) into.appendChild(listOf(rest));
        urgent.forEach(function (li) { into.appendChild(el('div', 'callout-flame', li.innerHTML, true)); });
        return;
      }

      // Under a programs heading, a bullet with sub-bullets becomes an accordion.
      if (isOpps && items.some(hasNested)) {
        items.forEach(function (li) {
          if (!hasNested(li)) { into.appendChild(listOf([li])); return; }

          // Pitch routes and deadlines are the thing people open the guide
          // for. They stay visible instead of collapsing into an accordion.
          if (/how to pitch|^\s*deadlines?\b/i.test(leadTextOf(li))) {
            into.appendChild(el('div', 'kicker', esc(leadTextOf(li)), true));
            leavesOf(li).forEach(function (leaf) {
              into.appendChild(el('div', 'callout-flame', leaf.innerHTML, true));
            });
            return;
          }

          var nested = [].slice.call(li.children).filter(function (c) { return /^(UL|OL)$/.test(c.tagName); });
          var lead = li.cloneNode(true);
          [].slice.call(lead.children).forEach(function (c) { if (/^(UL|OL)$/.test(c.tagName)) c.remove(); });

          var d = document.createElement('details');
          d.className = 'opp';
          var sum = document.createElement('summary');
          sum.innerHTML = summaryOf(lead);
          var bd = document.createElement('div');
          bd.className = 'opp-body';
          nested.forEach(function (n) { bd.appendChild(n.cloneNode(true)); });
          d.appendChild(sum); d.appendChild(bd);
          into.appendChild(d);
        });
        return;
      }

      into.appendChild(listOf(items));
      return;
    }

    if (tag === 'P') {
      var t = node.textContent.trim();
      if (!t) return;
      if (/^(deadlines?|due)\b/i.test(t) || /\b(due|deadline)\b.*\b(EOD|PT|weekly|Monday|Tuesday|Thursday|Friday)\b/i.test(t)) {
        into.appendChild(el('div', 'callout-flame', node.innerHTML, true));
        return;
      }
      into.appendChild(el('p', '', node.innerHTML, true));
      return;
    }

    into.appendChild(node.cloneNode(true));
  }

  // One bullet often carries more than one person:
  //   POC: Annie Shapiro <a@x.com> + Jordan Ferree <j@x.com>
  //   POC: Emily <e@x.com> (main) + Natalie <n@x.com> (support)
  // Each address is one person; the name is the text just before it and the
  // role is a parenthetical just after it.
  function contactsIn(li) {
    // Restructured doc: one person per bullet, name (and optional role) on the
    // line, address nested beneath it as a mailto link.
    var mails = [].slice.call(li.querySelectorAll('a[href^="mailto:"]'));
    if (mails.length === 1) {
      var lead = li.cloneNode(true);
      [].slice.call(lead.querySelectorAll('ul,ol')).forEach(function (n) { n.remove(); });
      var head = lead.textContent.replace(/\s+/g, ' ').replace(/^\s*POC:\s*/i, '').trim();
      var mail = mails[0].getAttribute('href').replace(/^mailto:/i, '').trim();
      if (head && head.indexOf(mail) === -1) {
        var role = '';
        var rm = /^(.*?)\s+[\u2014\u2013-]\s+(.+)$/.exec(head);
        if (rm) { head = rm[1].trim(); role = rm[2].trim(); }
        return [{ name: head, mail: mail, role: role }];
      }
    }

    var txt = li.textContent.replace(/^\s*POC:\s*/i, '').trim();
    var re = /([\w.+-]+@[\w.-]+\.\w+)/g;
    var out = [], last = 0, m;
    while ((m = re.exec(txt))) {
      var name = txt.slice(last, m.index).replace(/[<(][^<(]*$/, '');
      for (var k = 0; k < 4; k++) {
        name = name
          .replace(/^[\s>)\],;:\u00b7\u2022\-\u2013\u2014]+/, '')
          .replace(/^\([^)]*\)\s*/, '')
          .replace(/^(?:\+|&|and\b|plus\b)\s*/i, '');
      }
      name = name.replace(/[\s<(:]+$/, '').trim();
      var after = txt.slice(m.index + m[1].length, m.index + m[1].length + 40);
      var role = (/^\s*>?\s*\(([^)]{1,24})\)/.exec(after) || [])[1] || '';
      out.push({ name: name, mail: m[1], role: role });
      last = re.lastIndex;
    }
    if (!out.length) {
      var bare = txt.replace(/^[-\u2022\s]+/, '').trim();
      if (bare) out.push({ name: bare, mail: '', role: '' });
    }
    return out;
  }

  function pocCard(c) {
    var card = document.createElement('div');
    card.className = 'poc';
    card.innerHTML = '<div class="poc-name">' + esc(c.name || c.mail) + '</div>' +
      '<div class="poc-role">' + esc(c.role ? 'Point of contact \u00b7 ' + c.role : 'Point of contact') + '</div>' +
      (c.mail ? '<div class="body13"><a href="mailto:' + c.mail + '">' + c.mail + '</a></div>' : '');
    return card;
  }

  function summaryOf(li) {
    var html = li.innerHTML.trim();
    var strong = li.querySelector('strong');
    if (strong && strong.textContent.trim().length > 2) {
      var rest = li.textContent.replace(strong.textContent, '').replace(/^[\s\-–—:]+/, '').trim();
      var chip = rest.split(/[;.]/)[0].trim();
      return esc(strong.textContent.trim()) +
        (chip && chip.length <= 46 ? ' <span class="chip">' + esc(chip) + '</span>' : '');
    }
    var lead = li.textContent.split(/\s+[-–—]\s+|;/)[0].trim();
    return esc(lead.length > 90 ? lead.slice(0, 90) + '…' : lead);
  }

  function listOf(items) {
    var ul = document.createElement('ul');
    items.forEach(function (li) { ul.appendChild(li.cloneNode(true)); });
    return ul;
  }

  // The li's own text, without anything from its nested lists.
  function leadTextOf(li) {
    var lead = li.cloneNode(true);
    [].slice.call(lead.querySelectorAll('ul,ol')).forEach(function (n) { n.remove(); });
    return lead.textContent.replace(/\s+/g, ' ').trim();
  }

  // Every descendant item that carries no list of its own.
  function leavesOf(li) {
    return [].slice.call(li.querySelectorAll('li')).filter(function (n) {
      return !hasNested(n);
    });
  }

  var hasNested = function (li) {
    return [].slice.call(li.children).some(function (c) { return /^(UL|OL)$/.test(c.tagName); });
  };

  /* ------------------------------------------------------------ behaviour */

  /**
   * The page ships with three hardcoded tabs. The tab bar, the hero tab row
   * and the show/hide rules are all rebuilt from VIEWS here, so the tabs and
   * the doc's sections cannot drift apart again.
   */
  function buildTabs() {
    var css = ['body[data-view] [data-view-group]{display:none}'];
    css.push(VIEWS.map(function (v) {
      return 'body[data-view="' + v.key + '"] [data-view-group="' + v.key + '"]';
    }).join(',') + '{display:block}');
    css.push('#navsets > span{display:none!important}');
    css.push(VIEWS.map(function (v) {
      return 'body[data-view="' + v.key + '"] .navset-' + v.key;
    }).join(',') + '{display:flex!important}');
    css.push('#wftabs,#herotabs{display:flex;gap:0;flex-wrap:wrap}');
    css.push('#herotabs{gap:8px}');
    var st = document.createElement('style');
    st.textContent = css.join('\n');
    document.head.appendChild(st);

    var bar = document.getElementById('tabOpps');
    bar = bar && bar.parentNode;
    if (bar) {
      bar.id = 'wftabs';
      bar.innerHTML = VIEWS.map(function (v, i) {
        return '<button id="tab-' + v.key + '" class="wf-tab' + (i === 0 ? ' active' : '') +
          '"' + (i ? ' style="border-left:0"' : '') + '>' + esc(v.label) + '</button>';
      }).join('');
    }

    var hero = document.querySelector('.hero-tab-opps');
    hero = hero && hero.parentNode;
    if (hero) {
      hero.id = 'herotabs';
      hero.innerHTML = VIEWS.map(function (v, i) {
        var color = i === 0 ? 'var(--lime)' : '#FCFDF8';
        return '<button class="wf-tab hero-tab-' + v.key + '" style="border-color:' + color +
          ';color:' + color + '">' + esc(v.label) + '</button>';
      }).join('');
    }
  }

  function buildNav(partners) {
    navsets.innerHTML = VIEWS.map(function (v) {
      return '<span class="navset-' + v.key + '" style="display:flex;gap:18px;flex-wrap:wrap">' +
        partners.map(function (p) {
          return '<a href="#' + v.key + '-' + slug(p.name) + '" class="navlink">' + esc(p.name) + '</a>';
        }).join('') + '</span>';
    }).join('');
  }

  function wire() {
    [].forEach.call(document.querySelectorAll('.sec-head'), function (h) {
      h.addEventListener('click', function () {
        h.parentNode.classList.toggle('closed');
        updateToggleLabel();
      });
    });

    VIEWS.forEach(function (v) {
      bind('tab-' + v.key, v.key);
      hook('.hero-tab-' + v.key, v.key);
    });

    if (toggleBtn) toggleBtn.addEventListener('click', function () {
      var secs = visibleSections();
      var open = secs.some(function (s) { return !s.classList.contains('closed'); });
      secs.forEach(function (s) { s.classList.toggle('closed', open); });
      updateToggleLabel();
    });

    if (search) search.addEventListener('input', function () { runSearch(search.value); });
    if (clearBtn) clearBtn.addEventListener('click', function () { search.value = ''; runSearch(''); });
  }

  function bind(id, v) { var b = document.getElementById(id); if (b) b.addEventListener('click', function () { setView(v); window.scrollTo({ top: 0 }); }); }
  function hook(sel, v) {
    var b = document.querySelector(sel);
    if (b) b.addEventListener('click', function () {
      setView(v);
      var g = document.querySelector('[data-view-group="' + v + '"]');
      if (g) g.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function setView(v) {
    body.setAttribute('data-view', v);
    VIEWS.forEach(function (view) { tab('tab-' + view.key, v === view.key); });
    if (search && search.value) runSearch(search.value);
    updateToggleLabel();
  }
  function tab(id, on) { var b = document.getElementById(id); if (b) b.classList.toggle('active', on); }

  function visibleSections() {
    var v = body.getAttribute('data-view');
    return [].slice.call(document.querySelectorAll('section[data-sec]')).filter(function (s) {
      var g = s.closest('[data-view-group]');
      return g && g.getAttribute('data-view-group') === v;
    });
  }

  function updateToggleLabel() {
    if (!toggleBtn) return;
    var open = visibleSections().some(function (s) { return !s.classList.contains('closed'); });
    toggleBtn.textContent = open ? 'COLLAPSE ALL' : 'EXPAND ALL';
  }

  function runSearch(q) {
    var v = String(q || '').trim().toLowerCase();
    var secs = visibleSections(), hits = 0;
    secs.forEach(function (s) {
      var match = !v || s.textContent.toLowerCase().indexOf(v) !== -1;
      s.style.display = match ? '' : 'none';
      if (match && v) { hits++; s.classList.remove('closed'); }
    });
    if (searchStatus) searchStatus.textContent = v ? (hits + ' section' + (hits === 1 ? '' : 's')) : '';
  }

  /* ----------------------------------------------------------- utilities */

  function el(tag, cls, html, isHtml) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (isHtml) n.innerHTML = html; else n.textContent = html;
    return n;
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
})();
