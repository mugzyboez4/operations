/* ============================================
   TEMPO — Team Notes Sidebar
   Injectable component. Add to any page with:
   <script src="sidebar.js"></script>
   ============================================ */

(function(){

// === STYLES ===
const css = document.createElement('style');
css.textContent = `
.tn-float{position:fixed;bottom:24px;right:24px;z-index:9998;width:48px;height:48px;border-radius:0;background:#CDF851;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(205,248,81,0.3);transition:transform 0.15s,box-shadow 0.15s;border:none}
.tn-float:hover{transform:scale(1.06);box-shadow:0 6px 28px rgba(205,248,81,0.4)}
.tn-float svg{width:22px;height:22px;fill:#0F0E0E}
.tn-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#FF4A23;color:#FCFDF8;font-size:10px;font-weight:700;font-family:'DM Mono',monospace;display:flex;align-items:center;justify-content:center;border-radius:50%;display:none}

/* PANEL */
.tn-panel{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:#0F0E0E;border-left:1px solid #2A2A2A;z-index:9999;transition:right 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column;font-family:'Inter',sans-serif}
.tn-panel.open{right:0}
.tn-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9998;display:none}
.tn-overlay.open{display:block}

/* HEADER */
.tn-head{padding:20px 24px 16px;border-bottom:1px solid #2A2A2A;flex-shrink:0}
.tn-head-row{display:flex;align-items:center;justify-content:space-between}
.tn-title{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#CDF851}
.tn-close{background:none;border:none;color:#706B7A;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1}
.tn-close:hover{color:#FCFDF8}
.tn-subtitle{font-size:11px;color:#706B7A;margin-top:6px;line-height:1.5}

/* ADD FORM */
.tn-add{padding:16px 24px;border-bottom:1px solid #2A2A2A;flex-shrink:0}
.tn-input{width:100%;background:#1A1A1A;border:1px solid #2A2A2A;color:#FCFDF8;font-family:'Inter',sans-serif;font-size:13px;padding:10px 14px;resize:none;min-height:60px;transition:border-color 0.2s}
.tn-input:focus{outline:none;border-color:#CDF851}
.tn-input::placeholder{color:#3E3F41}
.tn-add-row{display:flex;gap:8px;margin-top:10px;align-items:center}
.tn-tag-select{background:#1A1A1A;border:1px solid #2A2A2A;color:#B0A9BE;font-family:'DM Mono',monospace;font-size:10px;padding:6px 10px;letter-spacing:0.5px;cursor:pointer;appearance:none;-webkit-appearance:none}
.tn-tag-select:focus{outline:none;border-color:#CDF851}
.tn-add-btn{background:#CDF851;color:#0F0E0E;border:none;font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 16px;cursor:pointer;transition:opacity 0.2s;margin-left:auto}
.tn-add-btn:hover{opacity:0.85}

/* FILTERS */
.tn-filters{padding:10px 24px;display:flex;gap:6px;border-bottom:1px solid #2A2A2A;flex-shrink:0;flex-wrap:wrap}
.tn-filter{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;background:#1A1A1A;color:#706B7A;border:1px solid #2A2A2A;cursor:pointer;transition:all 0.15s}
.tn-filter:hover{border-color:#706B7A}
.tn-filter.active{background:rgba(205,248,81,0.08);color:#CDF851;border-color:rgba(205,248,81,0.2)}

/* NOTES LIST */
.tn-list{flex:1;overflow-y:auto;padding:8px 0}
.tn-empty{padding:40px 24px;text-align:center;color:#3E3F41;font-size:13px;line-height:1.6}

/* NOTE CARD */
.tn-note{padding:14px 24px;border-bottom:1px solid #1A1A1A;cursor:grab;transition:background 0.15s;position:relative}
.tn-note:hover{background:#1A1A1A}
.tn-note.dragging{opacity:0.5;background:#1A1A1A}
.tn-note.drag-over{border-top:2px solid #CDF851}
.tn-note-text{font-size:13px;color:#B0A9BE;line-height:1.55;margin-bottom:6px}
.tn-note-meta{display:flex;align-items:center;gap:8px}
.tn-note-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:2px 8px}
.tn-note-tag.question{background:rgba(255,179,71,0.1);color:#FFB347}
.tn-note-tag.idea{background:rgba(91,192,190,0.1);color:#5BC0BE}
.tn-note-tag.flag{background:rgba(255,74,35,0.1);color:#FF4A23}
.tn-note-tag.general{background:rgba(176,169,190,0.08);color:#706B7A}
.tn-note-tag.feedback{background:rgba(205,248,81,0.08);color:#CDF851}
.tn-note-page{font-family:'DM Mono',monospace;font-size:9px;color:#3E3F41;letter-spacing:0.5px}
.tn-note-time{font-family:'DM Mono',monospace;font-size:9px;color:#3E3F41;margin-left:auto}
.tn-note-del{position:absolute;top:12px;right:20px;background:none;border:none;color:#3E3F41;font-size:14px;cursor:pointer;opacity:0;transition:opacity 0.15s}
.tn-note:hover .tn-note-del{opacity:1}
.tn-note-del:hover{color:#FF4A23}

/* FOOTER */
.tn-foot{padding:12px 24px;border-top:1px solid #2A2A2A;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.tn-foot-count{font-family:'DM Mono',monospace;font-size:10px;color:#3E3F41}
.tn-foot-actions{display:flex;gap:8px}
.tn-foot-btn{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;cursor:pointer;transition:all 0.15s;background:none}
.tn-export{border:1px solid #2A2A2A;color:#706B7A}
.tn-export:hover{border-color:#CDF851;color:#CDF851}
.tn-clear{border:1px solid #2A2A2A;color:#706B7A}
.tn-clear:hover{border-color:#FF4A23;color:#FF4A23}
.tn-send{border:1px solid #CDF851;color:#CDF851;background:none}
.tn-send:hover{background:#CDF851;color:#0F0E0E}

@media(max-width:500px){.tn-panel{width:100%;right:-100%}}
`;
document.head.appendChild(css);

// === STATE ===
const STORAGE_KEY = 'tempo_team_notes';
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let filter = 'all';
let dragIdx = null;

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
function getPage(){ return document.title.replace('TEMPO — ','').replace('TEMPO —','').trim() || location.pathname.split('/').pop() || 'Home'; }
function timeAgo(ts){
  const d=Date.now()-ts;
  if(d<60000) return 'just now';
  if(d<3600000) return Math.floor(d/60000)+'m ago';
  if(d<86400000) return Math.floor(d/3600000)+'h ago';
  return Math.floor(d/86400000)+'d ago';
}

// === BUILD DOM ===
// Float button
const float = document.createElement('button');
float.className='tn-float';
float.title='Team Notes';
float.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg><span class="tn-badge" id="tnBadge">0</span>';
document.body.appendChild(float);

// Overlay
const overlay = document.createElement('div');
overlay.className='tn-overlay';
document.body.appendChild(overlay);

// Panel
const panel = document.createElement('div');
panel.className='tn-panel';
panel.innerHTML=`
<div class="tn-head">
  <div class="tn-head-row"><span class="tn-title">Team Notes</span><button class="tn-close" id="tnClose">&times;</button></div>
  <div class="tn-subtitle">Your workspace. Drag to reorder. Notes save locally and persist across pages.</div>
</div>
<div class="tn-add">
  <textarea class="tn-input" id="tnInput" placeholder="What's on your mind? Questions, ideas, flags — anything."></textarea>
  <div class="tn-add-row">
    <select class="tn-tag-select" id="tnTag">
      <option value="general">General</option>
      <option value="question">Question</option>
      <option value="idea">Idea</option>
      <option value="feedback">Feedback</option>
      <option value="flag">Flag</option>
    </select>
    <button class="tn-add-btn" id="tnAddBtn">Add Note</button>
  </div>
</div>
<div class="tn-filters" id="tnFilters">
  <button class="tn-filter active" data-f="all">All</button>
  <button class="tn-filter" data-f="question">Questions</button>
  <button class="tn-filter" data-f="idea">Ideas</button>
  <button class="tn-filter" data-f="feedback">Feedback</button>
  <button class="tn-filter" data-f="flag">Flags</button>
</div>
<div class="tn-list" id="tnList"></div>
<div class="tn-foot">
  <span class="tn-foot-count" id="tnCount">0 notes</span>
  <div class="tn-foot-actions">
    <button class="tn-foot-btn tn-export" id="tnExport">Export</button>
    <button class="tn-foot-btn tn-clear" id="tnClearAll">Clear</button>
    <button class="tn-foot-btn tn-send" id="tnSend">Send to Team</button>
  </div>
</div>`;
document.body.appendChild(panel);

// === RENDER ===
function render(){
  const list = document.getElementById('tnList');
  const filtered = filter==='all' ? notes : notes.filter(n=>n.tag===filter);
  const badge = document.getElementById('tnBadge');
  const count = document.getElementById('tnCount');

  if(notes.length>0){badge.style.display='flex';badge.textContent=notes.length;}
  else{badge.style.display='none';}
  count.textContent=notes.length+(notes.length===1?' note':' notes');

  if(filtered.length===0){
    list.innerHTML='<div class="tn-empty">'+(notes.length===0?'No notes yet.<br>Add one above — it saves automatically.':'No notes in this filter.')+'</div>';
    return;
  }

  list.innerHTML=filtered.map((n,i)=>{
    const realIdx=notes.indexOf(n);
    return `<div class="tn-note" draggable="true" data-idx="${realIdx}">
      <button class="tn-note-del" onclick="window._tnDel(${realIdx})">&times;</button>
      <div class="tn-note-text">${esc(n.text)}</div>
      <div class="tn-note-meta">
        <span class="tn-note-tag ${n.tag}">${n.tag}</span>
        <span class="tn-note-page">${esc(n.page)}</span>
        <span class="tn-note-time">${timeAgo(n.ts)}</span>
      </div>
    </div>`;
  }).join('');

  // Drag handlers
  list.querySelectorAll('.tn-note').forEach(el=>{
    el.addEventListener('dragstart',e=>{dragIdx=+el.dataset.idx;el.classList.add('dragging')});
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');dragIdx=null;list.querySelectorAll('.tn-note').forEach(n=>n.classList.remove('drag-over'))});
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over')});
    el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
    el.addEventListener('drop',e=>{
      e.preventDefault();el.classList.remove('drag-over');
      const toIdx=+el.dataset.idx;
      if(dragIdx!==null&&dragIdx!==toIdx){
        const item=notes.splice(dragIdx,1)[0];
        notes.splice(toIdx,0,item);
        save();render();
      }
    });
  });
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}

// === ACTIONS ===
window._tnDel=function(idx){notes.splice(idx,1);save();render();};

function addNote(){
  const input=document.getElementById('tnInput');
  const tag=document.getElementById('tnTag');
  const text=input.value.trim();
  if(!text)return;
  notes.unshift({text,tag:tag.value,page:getPage(),ts:Date.now()});
  save();render();
  input.value='';
  tag.value='general';
}

function toggle(){
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  if(panel.classList.contains('open')) document.getElementById('tnInput').focus();
}

function exportNotes(){
  if(notes.length===0)return;
  let txt='TEMPO — Team Notes Export\n'+new Date().toLocaleDateString()+'\n'+'='.repeat(40)+'\n\n';
  notes.forEach((n,i)=>{
    txt+=`[${n.tag.toUpperCase()}] ${n.page}\n${n.text}\n${new Date(n.ts).toLocaleString()}\n\n`;
  });
  const blob=new Blob([txt],{type:'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='tempo-notes-'+new Date().toISOString().slice(0,10)+'.txt';
  a.click();
}

function clearAll(){
  if(notes.length===0)return;
  if(!confirm('Clear all notes? This cannot be undone.'))return;
  notes=[];save();render();
}

function sendToTeam(){
  if(notes.length===0)return;
  // Build a form submission via Netlify
  const form=document.createElement('form');
  form.method='POST';form.action='/';form.style.display='none';
  form.setAttribute('data-netlify','true');
  form.setAttribute('name','team-notes');
  const h=document.createElement('input');h.type='hidden';h.name='form-name';h.value='team-notes';form.appendChild(h);
  const d=document.createElement('input');d.type='hidden';d.name='notes';d.value=JSON.stringify(notes,null,2);form.appendChild(d);
  const p=document.createElement('input');p.type='hidden';p.name='page';p.value=getPage();form.appendChild(p);
  document.body.appendChild(form);
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()})
  .then(()=>{alert('Notes sent to the team! They\'ll still be here in your sidebar.');form.remove();})
  .catch(()=>{alert('Couldn\'t send right now — your notes are saved locally. Try again later.');form.remove();});
}

// === EVENT LISTENERS ===
float.addEventListener('click',toggle);
overlay.addEventListener('click',toggle);
document.getElementById('tnClose').addEventListener('click',toggle);
document.getElementById('tnAddBtn').addEventListener('click',addNote);
document.getElementById('tnInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addNote();}});
document.getElementById('tnExport').addEventListener('click',exportNotes);
document.getElementById('tnClearAll').addEventListener('click',clearAll);
document.getElementById('tnSend').addEventListener('click',sendToTeam);

document.getElementById('tnFilters').addEventListener('click',e=>{
  const btn=e.target.closest('.tn-filter');
  if(!btn)return;
  filter=btn.dataset.f;
  document.querySelectorAll('.tn-filter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render();
});

// Keyboard shortcut: Cmd/Ctrl + K to toggle
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();toggle();}});

// Init
render();

})();
