/* Pitches by Artist — Ops HQ tool
 * Static daily-snapshot browser. No API keys: reads pitches_snapshot.json,
 * rebuilt once a day by the Cowork scheduled task from the DISCO pulls.
 * Privacy: same shared Ops HQ team password (curtain-level client gate). */

const PW_HASH = "5509ceb6441705031bf623b2373fe8d7c677a84f502a2d2eba921ba2c867b7ae";
const SESSION_KEY = "pitches-grid-unlocked";
const SNAPSHOT_URL = "https://operations.mugzyboez.co/pitches_snapshot.json";
const UNASSIGNED_LABEL = "— No roster artist —";

let DATA = null;
let selectedKey = null;
let searchTerm = "";

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function unlock() {
  sessionStorage.setItem(SESSION_KEY, "1");
  document.getElementById("gate").style.display = "none";
  document.getElementById("app").classList.add("unlocked");
  boot();
}

document.getElementById("gate-submit").addEventListener("click", async () => {
  const pw = document.getElementById("gate-pw").value;
  const err = document.getElementById("gate-error");
  if (await sha256(pw) === PW_HASH) { unlock(); }
  else { err.textContent = "Incorrect password"; }
});
document.getElementById("gate-pw").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("gate-submit").click();
});
if (sessionStorage.getItem(SESSION_KEY) === "1") unlock();

/* ---------- data ---------- */
async function boot() {
  if (DATA) return;
  const list = document.getElementById("artist-list");
  if (list) list.innerHTML = '<div class="loading">Loading snapshot…</div>';
  try {
    const res = await fetch(SNAPSHOT_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    DATA = await res.json();
  } catch (e) {
    if (list) list.innerHTML = '<div class="loading">Could not load data (' +
      String(e.message || e) + ').<br>Try reloading.</div>';
    return;
  }
  renderMeta();
  renderArtists();
  // restore last selection or default to the top artist
  const saved = sessionStorage.getItem("pitches_selected");
  const exists = saved && (saved === "__UNASSIGNED__" ||
    (DATA.byArtist && DATA.byArtist[saved]));
  selectArtist(exists ? saved : (DATA.artists[0] && DATA.artists[0][0]));
}

function renderMeta() {
  const c = DATA.counts || {};
  const when = DATA.generatedAt ? new Date(DATA.generatedAt) : null;
  const whenStr = when ? when.toLocaleDateString(undefined,
    { month: "short", day: "numeric", year: "numeric" }) +
    " " + when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
  document.getElementById("meta").innerHTML =
    "<strong>" + (c.pitches || 0).toLocaleString() + "</strong> pitches · " +
    "<strong>" + (c.artists || 0).toLocaleString() + "</strong> artists<br>" +
    "Daily snapshot · updated " + whenStr;
}

function visibleArtists() {
  const t = searchTerm.trim().toLowerCase();
  let rows = DATA.artists.slice(); // [key, name, count]
  if (t) rows = rows.filter(r => r[1].toLowerCase().includes(t));
  return rows;
}

function renderArtists() {
  const list = document.getElementById("artist-list");
  const rows = visibleArtists();
  let html = "";
  for (const [key, name, count] of rows) {
    html += '<div class="artist-row" data-key="' + esc(key) + '">' +
      '<span class="nm">' + esc(name) + '</span>' +
      '<span class="pill">' + count + '</span></div>';
  }
  // unassigned bucket pinned at the bottom (only when not filtering it out)
  const un = (DATA.unassigned || []);
  if (un.length && (!searchTerm.trim() || UNASSIGNED_LABEL.toLowerCase().includes(searchTerm.trim().toLowerCase()))) {
    html += '<div class="artist-row unassigned" data-key="__UNASSIGNED__">' +
      '<span class="nm">' + UNASSIGNED_LABEL + '</span>' +
      '<span class="pill">' + un.length + '</span></div>';
  }
  list.innerHTML = html || '<div class="empty">No artists match.</div>';
  list.querySelectorAll(".artist-row").forEach(el =>
    el.addEventListener("click", () => selectArtist(el.dataset.key)));
  highlightActive();
  document.getElementById("artist-count").textContent =
    rows.length + (un.length ? " + 1" : "");
}

function highlightActive() {
  document.querySelectorAll(".artist-row").forEach(el =>
    el.classList.toggle("active", el.dataset.key === selectedKey));
}

function selectArtist(key) {
  if (!key) return;
  selectedKey = key;
  sessionStorage.setItem("pitches_selected", key);
  highlightActive();
  renderPitches();
  const active = document.querySelector(".artist-row.active");
  if (active) active.scrollIntoView({ block: "nearest" });
}

function pitchIdsFor(key) {
  if (key === "__UNASSIGNED__") return DATA.unassigned || [];
  return (DATA.byArtist && DATA.byArtist[key]) || [];
}

function displayName(key) {
  if (key === "__UNASSIGNED__") return UNASSIGNED_LABEL;
  const row = DATA.artists.find(r => r[0] === key);
  return row ? row[1] : key;
}

function renderPitches() {
  const wrap = document.getElementById("pitches-wrap");
  const head = document.getElementById("pitches-head");
  const ids = pitchIdsFor(selectedKey).slice();
  // sort by most recently updated
  ids.sort((a, b) => {
    const ta = (DATA.pitches[a] && DATA.pitches[a][3]) || "";
    const tb = (DATA.pitches[b] && DATA.pitches[b][3]) || "";
    return tb.localeCompare(ta);
  });
  head.innerHTML = esc(displayName(selectedKey)) +
    ' <span class="count">' + ids.length + ' pitch' + (ids.length === 1 ? "" : "es") + '</span>';
  if (!ids.length) { wrap.innerHTML = '<div class="empty">No pitches.</div>'; return; }
  let html = "";
  for (const pid of ids) {
    const p = DATA.pitches[pid];
    if (!p) continue;
    const [name, url, n, ts] = p;
    const when = ts ? new Date(ts).toLocaleDateString(undefined,
      { month: "short", day: "numeric", year: "numeric" }) : "";
    const sub = [n + " track" + (n === 1 ? "" : "s"), when ? "updated " + when : ""]
      .filter(Boolean).join(" · ");
    const open = url
      ? '<a class="btn primary" href="' + esc(url) + '" target="_blank" rel="noopener">Open ↗</a>' +
        '<button class="btn copy" data-url="' + esc(url) + '">Copy link</button>'
      : '<span class="pitch-sub">no link</span>';
    html += '<div class="pitch-row"><div class="pitch-main">' +
      '<div class="pitch-name">' + esc(name) + '</div>' +
      '<div class="pitch-sub">' + sub + '</div></div>' +
      '<div class="pitch-actions">' + open + '</div></div>';
  }
  wrap.innerHTML = html;
  wrap.querySelectorAll(".btn.copy").forEach(btn =>
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.url).then(() => {
        const old = btn.textContent;
        btn.textContent = "Copied"; btn.classList.add("copied");
        setTimeout(() => { btn.textContent = old; btn.classList.remove("copied"); }, 1200);
      });
    }));
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

document.getElementById("artist-search").addEventListener("input", e => {
  searchTerm = e.target.value;
  renderArtists();
});
