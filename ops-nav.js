/* Campaign Ops (WordPress) — shared nav bar.

   Add to any Campaign Ops WordPress page with:
     <script src="https://operations.mugzyboez.co/ops-nav.js" defer></script>

   Markup uses tempo.css classes (.tm-nav / .tm-brand / .tm-link), which every
   Campaign Ops page already loads, so this file carries no palette of its own.
   Opt out on a single page with:
     <script src="https://operations.mugzyboez.co/ops-nav.js" data-no-nav defer></script>

   The WordPress pages answer on two paths — /scheduling/ and /html/scheduling/
   are the same page — so the current-page match normalises both. */
(function () {

  var LINKS = [
    ["/hq/", "HQ"],
    ["/roadmap/", "Roadmap"],
    ["/coverage/", "Artist coverage"],
    ["/scheduling/", "Scheduling"],
    ["/digital-partner-guide/", "Partner guide"]
  ];

  /* "/html/scheduling/" and "/scheduling" both reduce to "scheduling".
     The site root and /hq/ both reduce to "hq". */
  function slug(path) {
    var p = String(path || "")
      .replace(/\.html$/, "")
      .replace(/^\/html\//, "/")
      .replace(/\/+$/, "");
    p = p.slice(p.lastIndexOf("/") + 1);
    return p === "" ? "hq" : p;
  }

  function embedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  /* tempo.css sticks .tm-nav under the utility strip the TEMPO site has and
     WordPress does not. Sit under the admin bar when one is showing, and flush
     to the top when it is not. */
  function offset() {
    var bar = document.getElementById("wpadminbar");
    if (!bar) return 0;
    var fixed = window.getComputedStyle(bar).position === "fixed";
    return fixed ? bar.offsetHeight : 0;
  }

  function styles() {
    if (document.getElementById("ops-nav-css")) return;
    var s = document.createElement("style");
    s.id = "ops-nav-css";
    s.textContent = [
      /* Present mode on the scheduling page hides page chrome — hide the nav too. */
      "body:has(#sched-root.present) .ops-nav{display:none}",
      "@media print{.ops-nav{display:none}}",
      ".ops-nav .tm-links{margin-left:auto}"
    ].join("");
    document.head.appendChild(s);
  }

  function build() {
    var me = document.currentScript ||
             document.querySelector('script[src*="ops-nav.js"]');
    if (me && me.hasAttribute("data-no-nav")) return;
    if (embedded()) return;                        // don't stack inside an iframe
    if (document.querySelector(".tm-nav")) return; // page brings its own

    var here = slug(location.pathname);

    var links = LINKS.map(function (l) {
      var on = slug(l[0]) === here ? " on" : "";
      return '<a class="tm-link' + on + '" href="' + l[0] + '">' + l[1] + "</a>";
    }).join("");

    var bar = document.createElement("nav");
    bar.className = "tm-nav ops-nav";
    bar.setAttribute("aria-label", "Campaign Ops");
    bar.style.top = offset() + "px";
    bar.innerHTML =
      '<div class="in">' +
        '<a class="tm-brand" href="/hq/">' +
          '<span class="tm-mark">C</span>' +
          '<span class="tm-word">Campaign <span>Ops</span></span>' +
        "</a>" +
        '<div class="tm-links">' + links + "</div>" +
      "</div>";

    styles();
    document.body.insertBefore(bar, document.body.firstChild);

    /* The admin bar changes height at the 782px breakpoint. */
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { bar.style.top = offset() + "px"; }, 150);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
