/* TEMPO — shared site shell: utility strip + brand + nav + "view as department".
   Chrome markup uses tempo.css classes (.tm-*). Include tempo.css on the page.
   Opt out of the injected chrome with: <script src="/shell.js" data-no-strip></script> */
(function(){
  var d = document.documentElement;
  var EMB = false; try { EMB = window.self !== window.top; } catch(e) { EMB = true; }
  if (EMB) d.classList.add('tm-embedded');

  var DEPTS = [["","All departments"],["leads","Campaign Leads"],["creative","Creative"],
    ["auddev","Audience Dev"],["support","Support"],["ops","Campaign Ops"],["release","Release Planning"]];

  var LINKS = [["/","Home"],["/active-projects.html","Active Projects"],
    ["/budget-approvals.html","Budget Approvals"],["/dept-workflows.html","Workflows"],
    ["/deadline-tracker.html","Deadlines"],["/campaigns.html","Campaigns"],
    ["/pitchdecks/","Pitch Decks"],["/pilot/tool.html","Airtable Pilot"],
    ["/sitemap.html","Sitemap"]];

  function get(){ try { return localStorage.getItem('co_dept') || ''; } catch(e) { return ''; } }
  function apply(v){
    if (v) d.setAttribute('data-co-view', v); else d.removeAttribute('data-co-view');
    var s = document.getElementById('coDeptSel');
    if (s && s.value !== v) s.value = v;
    if (typeof window.CO_DEPT_HOOK === 'function') { try { window.CO_DEPT_HOOK(v); } catch(e){} }
    try { document.dispatchEvent(new CustomEvent('co:dept', {detail: v})); } catch(e){}
  }
  function set(v){ try { localStorage.setItem('co_dept', v); } catch(e){} apply(v); }

  function build(){
    var me = document.currentScript || document.querySelector('script[src*="shell.js"]');
    if (me && me.hasAttribute('data-no-strip')) return;
    if (document.querySelector('.tm-strip')) return;
    if (EMB) return;

    var here = location.pathname.replace(/\.html$/, '');
    var nav = LINKS.map(function(l){
      var base = l[0].replace(/\.html$/, '').replace(/\/$/, '');
      var on = (here === base || (base && base !== '' && here.indexOf(base) === 0)) ? ' on' : '';
      if (l[0] === '/' && here !== '' && here !== '/') on = '';
      return '<a class="tm-link' + on + '" href="' + l[0] + '">' + l[1] + '</a>';
    }).join('');

    var strip = document.createElement('div');
    strip.className = 'tm-strip';
    strip.innerHTML =
      '<span>RCA Records &middot; Sony Music</span>' +
      '<span class="sep">|</span><span class="conf">Internal only</span>' +
      '<label class="right">View as <select id="coDeptSel">' +
      DEPTS.map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') +
      '</select></label>';

    var bar = document.createElement('nav');
    bar.className = 'tm-nav';
    bar.innerHTML =
      '<div class="in">' +
        '<a class="tm-brand" href="/">' +
          '<span class="tm-mark">C</span>' +
          '<span class="tm-word">Campaign <span>Ops</span></span>' +
        '</a>' +
        '<div class="tm-links">' + nav + '</div>' +
      '</div>';

    var first = document.body.firstChild;
    document.body.insertBefore(bar, first);
    document.body.insertBefore(strip, bar);
    strip.querySelector('#coDeptSel').addEventListener('change', function(){ set(this.value); });
  }

  function init(){ build(); apply(get()); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('storage', function(e){ if (e.key === 'co_dept') apply(e.newValue || ''); });
})();
