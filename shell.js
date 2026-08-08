/* Campaign Ops — shared shell: nav strip + "view as department" mode */
(function(){
  var d=document.documentElement;
  var EMB=false; try{EMB=window.self!==window.top;}catch(e){EMB=true;}
  if(EMB) d.classList.add('co-embedded');
  var DEPTS=[["","All departments"],["leads","Campaign Leads"],["creative","Creative"],
    ["auddev","Audience Dev"],["support","Support"],["ops","Campaign Ops"],["release","Release Planning"]];
  function get(){try{return localStorage.getItem('co_dept')||''}catch(e){return ''}}
  function apply(v){
    if(v) d.setAttribute('data-co-view',v); else d.removeAttribute('data-co-view');
    var s=document.getElementById('coDeptSel'); if(s&&s.value!==v) s.value=v;
    if(typeof window.CO_DEPT_HOOK==='function'){try{window.CO_DEPT_HOOK(v)}catch(e){}}
    try{document.dispatchEvent(new CustomEvent('co:dept',{detail:v}))}catch(e){}
  }
  function set(v){try{localStorage.setItem('co_dept',v)}catch(e){} apply(v);}
  function build(){
    var me=document.currentScript||document.querySelector('script[src*="shell.js"]');
    if(me&&me.hasAttribute('data-no-strip')) return;
    if(document.querySelector('.co-shell')) return;
    var here=location.pathname.replace(/\.html$/,'');
    var links=[["/","Home"],["/budget-approvals","Budget Approvals"],["/dept-workflows","Workflows"],
      ["/deadline-tracker","Deadlines"],["/pitchdecks/","Pitch Decks"],["/pilot/tool.html","Airtable Pilot"]];
    var nav=links.map(function(l){
      var on=(here===l[0]||here===l[0].replace(/\/$/,'')||(l[0]!=="/"&&here.indexOf(l[0].replace(/\/$/,''))===0))?' on':'';
      return '<a class="co-link'+on+'" href="'+l[0]+'">'+l[1]+'</a>';}).join('');
    var el=document.createElement('div'); el.className='co-shell';
    el.innerHTML='<a class="co-brand" href="/">Campaign <em>Ops</em></a>'+
      '<nav class="co-nav">'+nav+'</nav>'+
      '<label class="co-view">View as <select id="coDeptSel">'+
      DEPTS.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('')+
      '</select></label>';
    document.body.insertBefore(el,document.body.firstChild);
    el.querySelector('#coDeptSel').addEventListener('change',function(){set(this.value)});
  }
  function init(){build();apply(get());}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('storage',function(e){if(e.key==='co_dept') apply(e.newValue||'');});
})();
