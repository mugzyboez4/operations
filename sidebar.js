/* ============================================
   TEMPO — Team Notes Sidebar
   Injectable component. Add to any page with:
   <script src="sidebar.js"></script>
   ============================================ */

(function(){

var css = document.createElement('style');
css.textContent = [
'.tn-float{position:fixed;bottom:24px;right:24px;z-index:9998;width:48px;height:48px;border-radius:0;background:#CDF851;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(205,248,81,0.3);transition:transform 0.15s,box-shadow 0.15s;border:none}',
'.tn-float:hover{transform:scale(1.06);box-shadow:0 6px 28px rgba(205,248,81,0.4)}',
'.tn-float svg{width:22px;height:22px;fill:#0F0E0E}',
'.tn-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#FF4A23;color:#FCFDF8;font-size:10px;font-weight:700;font-family:"DM Mono",monospace;display:flex;align-items:center;justify-content:center;border-radius:50%}',
'.tn-panel{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:#0F0E0E;border-left:1px solid #2A2A2A;z-index:9999;transition:right 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column;font-family:"Inter",sans-serif}',
'.tn-panel.open{right:0}',
'.tn-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9998;display:none}',
'.tn-overlay.open{display:block}',
'.tn-head{padding:20px 24px 16px;border-bottom:1px solid #2A2A2A;flex-shrink:0}',
'.tn-head-row{display:flex;align-items:center;justify-content:space-between}',
'.tn-title{font-family:"DM Mono",monospace;font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#CDF851}',
'.tn-close{background:none;border:none;color:#706B7A;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1}',
'.tn-close:hover{color:#FCFDF8}',
'.tn-subtitle{font-size:11px;color:#706B7A;margin-top:6px;line-height:1.5}',
'.tn-add{padding:16px 24px;border-bottom:1px solid #2A2A2A;flex-shrink:0}',
'.tn-input{width:100%;background:#1A1A1A;border:1px solid #2A2A2A;color:#FCFDF8;font-family:"Inter",sans-serif;font-size:13px;padding:10px 14px;resize:none;min-height:60px;transition:border-color 0.2s}',
'.tn-input:focus{outline:none;border-color:#CDF851}',
'.tn-input::placeholder{color:#3E3F41}',
'.tn-add-row{display:flex;margin-top:10px;justify-content:flex-end}',
'.tn-add-btn{background:#CDF851;color:#0F0E0E;border:none;font-family:"DM Mono",monospace;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 16px;cursor:pointer;transition:opacity 0.2s}',
'.tn-add-btn:hover{opacity:0.85}',
'.tn-list{flex:1;overflow-y:auto;padding:8px 0}',
'.tn-empty{padding:40px 24px;text-align:center;color:#3E3F41;font-size:13px;line-height:1.6}',
'.tn-note{padding:14px 24px;border-bottom:1px solid #1A1A1A;cursor:grab;transition:background 0.15s;position:relative}',
'.tn-note:hover{background:#1A1A1A}',
'.tn-note.dragging{opacity:0.5;background:#1A1A1A}',
'.tn-note.drag-over{border-top:2px solid #CDF851}',
'.tn-note-text{font-size:13px;color:#B0A9BE;line-height:1.55;margin-bottom:6px}',
'.tn-note-meta{display:flex;align-items:center;gap:8px}',
'.tn-note-page{font-family:"DM Mono",monospace;font-size:9px;color:#706B7A;letter-spacing:0.5px;background:rgba(176,169,190,0.08);padding:2px 8px}',
'.tn-note-time{font-family:"DM Mono",monospace;font-size:9px;color:#3E3F41;margin-left:auto}',
'.tn-note-del{position:absolute;top:12px;right:20px;background:none;border:none;color:#3E3F41;font-size:14px;cursor:pointer;opacity:0;transition:opacity 0.15s}',
'.tn-note:hover .tn-note-del{opacity:1}',
'.tn-note-del:hover{color:#FF4A23}',
'.tn-foot{padding:12px 24px;border-top:1px solid #2A2A2A;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}',
'.tn-foot-count{font-family:"DM Mono",monospace;font-size:10px;color:#3E3F41}',
'.tn-foot-actions{display:flex;gap:8px}',
'.tn-foot-btn{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;cursor:pointer;transition:all 0.15s;background:none}',
'.tn-export{border:1px solid #2A2A2A;color:#706B7A}',
'.tn-export:hover{border-color:#CDF851;color:#CDF851}',
'.tn-clear{border:1px solid #2A2A2A;color:#706B7A}',
'.tn-clear:hover{border-color:#FF4A23;color:#FF4A23}',
'.tn-send{border:1px solid #CDF851;color:#CDF851;background:none}',
'.tn-send:hover{background:#CDF851;color:#0F0E0E}',
'@media(max-width:500px){.tn-panel{width:100%;right:-100%}}'
].join('\n');
document.head.appendChild(css);

var STORAGE_KEY = 'tempo_team_notes';
var notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
var dragIdx = null;

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }

function getPage(){
  return document.title.replace(/TEMPO\s*[—\-]\s*/,'').trim() || location.pathname.split('/').pop() || 'Home';
}

function timeAgo(ts){
  var d = Date.now() - ts;
  if(d < 60000) return 'just now';
  if(d < 3600000) return Math.floor(d/60000) + 'm ago';
  if(d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

function esc(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

// Build DOM
var float = document.createElement('button');
float.className = 'tn-float';
float.title = 'Team Notes';
float.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg><span class="tn-badge">0</span>';
document.body.appendChild(float);

var overlay = document.createElement('div');
overlay.className = 'tn-overlay';
document.body.appendChild(overlay);

var panel = document.createElement('div');
panel.className = 'tn-panel';
panel.innerHTML =
  '<div class="tn-head">' +
    '<div class="tn-head-row"><span class="tn-title">Team Notes</span><button class="tn-close">&times;</button></div>' +
    '<div class="tn-subtitle">Anything goes. Notes save locally and persist across pages.</div>' +
  '</div>' +
  '<div class="tn-add">' +
    '<textarea class="tn-input" placeholder="What\'s on your mind?"></textarea>' +
    '<div class="tn-add-row"><button class="tn-add-btn">Add Note</button></div>' +
  '</div>' +
  '<div class="tn-list"></div>' +
  '<div class="tn-foot">' +
    '<span class="tn-foot-count">0 notes</span>' +
    '<div class="tn-foot-actions">' +
      '<button class="tn-foot-btn tn-export">Export</button>' +
      '<button class="tn-foot-btn tn-clear">Clear</button>' +
      '<button class="tn-foot-btn tn-send">Send to Team</button>' +
    '</div>' +
  '</div>';
document.body.appendChild(panel);

var badge = float.querySelector('.tn-badge');
var tnClose = panel.querySelector('.tn-close');
var tnInput = panel.querySelector('.tn-input');
var tnAddBtn = panel.querySelector('.tn-add-btn');
var tnList = panel.querySelector('.tn-list');
var tnCount = panel.querySelector('.tn-foot-count');
var tnExport = panel.querySelector('.tn-export');
var tnClearAll = panel.querySelector('.tn-clear');
var tnSend = panel.querySelector('.tn-send');

function render(){
  if(notes.length > 0){ badge.style.display = 'flex'; badge.textContent = notes.length; }
  else { badge.style.display = 'none'; }
  tnCount.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');

  if(notes.length === 0){
    tnList.innerHTML = '<div class="tn-empty">No notes yet.<br>Add one above — it saves automatically.</div>';
    return;
  }

  var html = '';
  for(var i = 0; i < notes.length; i++){
    var n = notes[i];
    html += '<div class="tn-note" draggable="true" data-idx="' + i + '">' +
      '<button class="tn-note-del" data-idx="' + i + '">&times;</button>' +
      '<div class="tn-note-text">' + esc(n.text) + '</div>' +
      '<div class="tn-note-meta">' +
        '<span class="tn-note-page">' + esc(n.page) + '</span>' +
        '<span class="tn-note-time">' + timeAgo(n.ts) + '</span>' +
      '</div></div>';
  }
  tnList.innerHTML = html;

  var cards = tnList.querySelectorAll('.tn-note');
  for(var j = 0; j < cards.length; j++){
    (function(el){
      el.querySelector('.tn-note-del').addEventListener('click', function(e){
        e.stopPropagation();
        notes.splice(+this.dataset.idx, 1);
        save(); render();
      });
      el.addEventListener('dragstart', function(){ dragIdx = +el.dataset.idx; el.classList.add('dragging'); });
      el.addEventListener('dragend', function(){ el.classList.remove('dragging'); dragIdx = null; });
      el.addEventListener('dragover', function(e){ e.preventDefault(); el.classList.add('drag-over'); });
      el.addEventListener('dragleave', function(){ el.classList.remove('drag-over'); });
      el.addEventListener('drop', function(e){
        e.preventDefault(); el.classList.remove('drag-over');
        var toIdx = +el.dataset.idx;
        if(dragIdx !== null && dragIdx !== toIdx){
          var item = notes.splice(dragIdx, 1)[0];
          notes.splice(toIdx, 0, item);
          save(); render();
        }
      });
    })(cards[j]);
  }
}

function toggle(){
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  if(panel.classList.contains('open')){ tnInput.focus(); render(); }
}

function addNote(){
  var text = tnInput.value.trim();
  if(!text) return;
  notes.unshift({ text: text, page: getPage(), ts: Date.now() });
  save(); render();
  tnInput.value = '';
}

function exportNotes(){
  if(notes.length === 0) return;
  var txt = 'TEMPO — Team Notes Export\n' + new Date().toLocaleDateString() + '\n' + '========================================\n\n';
  for(var i = 0; i < notes.length; i++){
    var n = notes[i];
    txt += '[' + n.page + '] ' + new Date(n.ts).toLocaleString() + '\n' + n.text + '\n\n';
  }
  var blob = new Blob([txt], { type: 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tempo-notes-' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
}

function clearAll(){
  if(notes.length === 0) return;
  if(!confirm('Clear all notes? This cannot be undone.')) return;
  notes = []; save(); render();
}

function sendToTeam(){
  if(notes.length === 0) return;
  var origText = tnSend.textContent;
  tnSend.textContent = 'Sending...'; tnSend.style.opacity = '0.5'; tnSend.style.pointerEvents = 'none';
  var fd = new URLSearchParams();
  fd.append('form-name', 'team-notes');
  fd.append('notes', JSON.stringify(notes, null, 2));
  fd.append('page', getPage());
  fd.append('submitted_at', new Date().toISOString());
  fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd.toString() })
  .then(function(r){
    tnSend.style.opacity = '1'; tnSend.style.pointerEvents = 'auto';
    if(r.ok){
      tnSend.textContent = 'Sent!'; tnSend.style.background = '#4ADE80'; tnSend.style.borderColor = '#4ADE80'; tnSend.style.color = '#0F0E0E';
      setTimeout(function(){ tnSend.textContent = origText; tnSend.style.background = ''; tnSend.style.borderColor = '#CDF851'; tnSend.style.color = '#CDF851'; }, 3000);
    } else {
      tnSend.textContent = origText;
      alert('Something went wrong (status ' + r.status + '). Notes are saved locally.');
    }
  })
  .catch(function(){
    tnSend.textContent = origText; tnSend.style.opacity = '1'; tnSend.style.pointerEvents = 'auto';
    alert('Could not connect. Notes are saved locally — nothing is lost.');
  });
}

// Events
float.addEventListener('click', toggle);
overlay.addEventListener('click', toggle);
tnClose.addEventListener('click', toggle);
tnAddBtn.addEventListener('click', addNote);
tnInput.addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); addNote(); } });
tnExport.addEventListener('click', exportNotes);
tnClearAll.addEventListener('click', clearAll);
tnSend.addEventListener('click', sendToTeam);
document.addEventListener('keydown', function(e){ if((e.metaKey || e.ctrlKey) && e.key === 'k'){ e.preventDefault(); toggle(); } });

// Shift up if Orbit feedback float exists
if(document.querySelector('.fb-float')){ float.style.bottom = '84px'; }

render();

})();
