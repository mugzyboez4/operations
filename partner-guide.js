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
  // `fallback` marks the tab that also takes any section no other tab claims,
  // so nothing in the doc goes unrendered.
  var VIEWS = [
    { key: 'flow', label: '01 · Workflows',       cross: true },
    { key: 'opps', label: '02 · Opportunities',   match: /opportunit|program|required solution|next step/i },
    { key: 'info', label: '03 · Info',            match: /^info$|flow of communication|features|availability|operations/i, fallback: true },
    { key: 'ts',   label: '04 · Troubleshooting', match: /troubleshoot|backend access|support/i },
    { key: 'poc',  label: '05 · Contacts',        match: /^contacts?$|flow of communication/i }
  ];

  // The doc's cross-partner workflow section. It drives the first tab and is
  // kept out of every partner tab.
  var CROSS = /^workflows?\b/i;

  // Filled as the workflow cards are built; the nav links off it.
  var FLOW_INDEX = [];

  function claims(view, name) {
    if (!view.match) return false;
    if (view.match.test(name)) return true;
    if (!view.fallback) return false;
    return !VIEWS.some(function (other) {
      return other !== view && other.match && other.match.test(name);
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

    // The workflows section is cross-partner: it becomes tab 01 and is
    // removed from the partner list so it cannot also land in a partner tab.
    var flows = partners.filter(function (p) { return CROSS.test(p.name); });
    partners = partners.filter(function (p) { return flows.indexOf(p) === -1; });

    guide.innerHTML = '';
    FLOW_INDEX = [];
    VIEWS.forEach(function (view, vi) {
      var wrap = document.createElement('div');
      wrap.setAttribute('data-view-group', view.key);

      var banner = document.createElement('div');
      banner.className = 'wf-banner';
      banner.innerHTML = '<span>' + esc(view.label) + '</span><div class="bar"></div>';
      wrap.appendChild(banner);

      if (view.cross) {
        renderFlows(wrap, flows);
        guide.appendChild(wrap);
        return;
      }

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
    buildNav(partners, flows);
    wire();
    setView('flow');

    // Only the partner sections are counted; the doc's cross-partner sections
    // (workflows, next steps) carry no subheads.
    void flows;
    var partnerCount = partners.filter(function (p) {
      return p.groups.some(function (g) { return !!g.name; });
    }).length || partners.length;

    stat.innerHTML = '<b>' + partnerCount + '</b> partners &middot; read live from the doc &middot; synced ' +
      new Date(data.fetchedAt || Date.now()).toLocaleString();
  }

  /* ------------------------------------------------------- workflows tab */

  /**
   * The doc's cross-partner workflows. Each top-level bullet is one workflow
   * ("Workflow 2: Escalation"); its nested bullets are the steps. Steps are
   * numbered here rather than in the doc, and a step the doc wrote as "2.a"
   * renders as a sub-step of 2 instead of taking a number of its own.
   */
  function renderFlows(wrap, flows) {
    var made = 0;
    flows.forEach(function (p) {
      p.groups.forEach(function (g) {
        if (g.name) wrap.appendChild(el('div', 'kicker', esc(g.name), true));
        g.nodes.forEach(function (n) {
          var tag = n.tagName;
          if (tag === 'P') { wrap.appendChild(el('div', 'flow-note', n.innerHTML, true)); return; }
          if (!/^(UL|OL)$/.test(tag || '')) { wrap.appendChild(n.cloneNode(true)); return; }
          var grid = document.createElement('div');
          grid.className = 'flow-grid';
          [].slice.call(n.children).forEach(function (li) {
            if (li.tagName !== 'LI') return;
            grid.appendChild(flowCard(li, ++made));
          });
          wrap.appendChild(grid);
        });
      });
    });
    if (!made) wrap.appendChild(el('div', 'loadmsg', 'No cross-partner workflows in the doc yet.'));
  }

  function flowCard(li, num) {
    var title = leadTextOf(li);
    var m = /^workflows?\s*(\d+)\s*[:.–—-]\s*(.+)$/i.exec(title);
    var badge = m ? pad(Number(m[1])) : pad(num);
    var name = (m ? m[2] : title).trim();

    var card = document.createElement('section');
    card.className = 'flow-card';
    card.id = 'flow-' + slug(name);
    card.setAttribute('data-sec', name);
    FLOW_INDEX.push({ id: card.id, name: name });

    card.appendChild(el('div', 'flow-head',
      '<span class="flow-num">' + esc(badge) + '</span><h2>' + esc(name) + '</h2>', true));

    var steps = document.createElement('div');
    steps.className = 'flow-steps';
    var n = 0;
    [].slice.call(li.children).forEach(function (child) {
      if (!/^(UL|OL)$/.test(child.tagName || '')) return;
      [].slice.call(child.children).forEach(function (s) {
        if (s.tagName !== 'LI') return;
        var c = s.cloneNode(true);
        [].slice.call(c.querySelectorAll('ul,ol')).forEach(function (x) { x.remove(); });
        var sub = /^\s*(\d+)\s*\.\s*([a-z])\b[\s.)]*/i.exec(c.textContent);
        var mark, html = c.innerHTML;
        if (sub) {
          mark = sub[1] + sub[2].toLowerCase();
          html = html.replace(/^\s*(?:<[^>]+>\s*)*?\d+\s*\.\s*[a-z]\b[\s.)]*/i, function (hit) {
            return hit.replace(/\d+\s*\.\s*[a-z]\b[\s.)]*$/i, '');
          });
        } else {
          n++; mark = pad(n);
        }
        steps.appendChild(el('div', 'flow-step' + (sub ? ' sub' : ''),
          '<span class="flow-mark">' + esc(mark) + '</span>' +
          '<span class="flow-text">' + html + '</span>', true));
      });
    });
    card.appendChild(steps);
    return card;
  }

  function section(viewKey, p, groups, num) {
    var sec = document.createElement('section');
    sec.id = viewKey + '-' + slug(p.name);
    sec.setAttribute('data-sec', p.name);

    var head = document.createElement('div');
    head.className = 'sec-head';
    head.innerHTML = '<span class="chev">&darr;</span> <span class="sec-num">' +
      pad(num) + '</span> <h2>' + esc(p.name) + '</h2>';
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
        var rm = /^(.*?)\s+[—–-]\s+(.+)$/.exec(head);
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
          .replace(/^[\s>)\],;:·•\-–—]+/, '')
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
      var bare = txt.replace(/^[-•\s]+/, '').trim();
      if (bare) out.push({ name: bare, mail: '', role: '' });
    }
    return out;
  }

  function pocCard(c) {
    var card = document.createElement('div');
    card.className = 'poc';
    card.innerHTML = '<div class="poc-name">' + esc(c.name || c.mail) + '</div>' +
      '<div class="poc-role">' + esc(c.role ? 'Point of contact · ' + c.role : 'Point of contact') + '</div>' +
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
  var FLOW_CSS = [
    '.flow-note{background:var(--card);border-left:3px solid var(--flame);padding:14px 18px;',
    '  font-size:13px;line-height:1.55;color:var(--fg-2);margin-bottom:28px;max-width:78ch}',
    '.flow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:20px;align-items:start}',
    '.flow-card{background:var(--card);border:1px solid var(--border);border-top:3px solid var(--lime);padding:22px 24px 6px}',
    '.flow-head{display:flex;align-items:baseline;gap:12px;cursor:pointer;margin-bottom:14px}',
    '.flow-num{font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--flame)}',
    '.flow-head h2{font-size:20px;font-weight:900;letter-spacing:-.5px;line-height:1.1;',
    '  text-transform:uppercase;color:var(--ink)}',
    '.flow-steps{border-top:1px solid var(--border)}',
    '.flow-card.closed .flow-steps{display:none}',
    '.flow-step{display:flex;gap:12px;padding:11px 2px;border-bottom:1px solid var(--border)}',
    '.flow-step:last-child{border-bottom:0}',
    '.flow-step.sub{padding-left:26px;background:var(--card-2)}',
    '.flow-mark{font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--fog);',
    '  min-width:24px;padding-top:3px}',
    '.flow-step.sub .flow-mark{color:var(--flame)}',
    '.flow-text{font-size:13px;line-height:1.55;color:var(--ink)}',
    '.flow-text p{margin:0}',
    '@media(max-width:640px){.flow-grid{grid-template-columns:1fr}}'
  ].join('\n');

  function buildTabs() {
    var css = ['body[data-view] [data-view-group]{display:none}'];
    css.push(VIEWS.map(function (v) {
      return 'body[data-view="' + v.key + '"] [data-view-group="' + v.key + '"]';
    }).join(',') + '{display:block}');
    css.push('#navsets > span{display:none!important}');
    css.push(VIEWS.map(function (v) {
      return 'body[data-view="' + v.key + '"] .navset-' + v.key;
    }).join(',') + '{display:flex!important}');
    css.push(FLOW_CSS);
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
      var links = v.cross
        ? FLOW_INDEX.map(function (f) {
            return '<a href="#' + f.id + '" class="navlink">' + esc(f.name) + '</a>';
          })
        : partners.map(function (p) {
            return '<a href="#' + v.key + '-' + slug(p.name) + '" class="navlink">' + esc(p.name) + '</a>';
          });
      return '<span class="navset-' + v.key + '" style="display:flex;gap:18px;flex-wrap:wrap">' +
        links.join('') + '</span>';
    }).join('');
  }

  function wire() {
    [].forEach.call(document.querySelectorAll('.sec-head, .flow-head'), function (h) {
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
    // Always re-run, including for an empty box: sections hidden by an earlier
    // query on this tab stay hidden otherwise.
    runSearch(search ? search.value : '');
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
    var view = body.getAttribute('data-view');
    var hits = 0;
    // Every section, not just the visible tab's — filtering only what is on
    // screen leaves the other tabs holding stale hidden sections.
    [].slice.call(document.querySelectorAll('section[data-sec]')).forEach(function (s) {
      var match = !v || s.textContent.toLowerCase().indexOf(v) !== -1;
      s.style.display = match ? '' : 'none';
      if (!match || !v) return;
      s.classList.remove('closed');
      var g = s.closest('[data-view-group]');
      if (g && g.getAttribute('data-view-group') === view) hits++;
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
