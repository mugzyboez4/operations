/* @ds-bundle: {"format":4,"namespace":"CampaignOpsDesignSystem_019e19","components":[{"name":"Nav","sourcePath":"ui_kits/campaign-ops/Shell.jsx"},{"name":"Hero","sourcePath":"ui_kits/campaign-ops/Shell.jsx"},{"name":"PhaseStrip","sourcePath":"ui_kits/campaign-ops/Shell.jsx"},{"name":"Shell","sourcePath":"ui_kits/campaign-ops/Shell.jsx"},{"name":"GateTracker","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"DepartmentInputs","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"PilotCard","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"PrincipleBlock","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"LizzyBar","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"Footer","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"},{"name":"Tracker","sourcePath":"ui_kits/campaign-ops/Tracker.jsx"}],"sourceHashes":{"ui_kits/campaign-ops/Shell.jsx":"a9a1307c2c59","ui_kits/campaign-ops/Tracker.jsx":"c1f633d2e9ef"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CampaignOpsDesignSystem_019e19 = window.CampaignOpsDesignSystem_019e19 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/campaign-ops/Shell.jsx
try { (() => {
/* global React */

function Nav({
  active = 'roadmap',
  onNav
}) {
  const links = [['roadmap', 'Roadmap'], ['phases', 'Phases'], ['inputs', 'Department Inputs'], ['tracker', 'Tracker'], ['resources', 'Resources']];
  return /*#__PURE__*/React.createElement("nav", {
    className: "cops-nav"
  }, /*#__PURE__*/React.createElement("a", {
    className: "cops-logo",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav && onNav('roadmap');
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo_neon.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", null, "Campaign ", /*#__PURE__*/React.createElement("em", null, "Ops"))), /*#__PURE__*/React.createElement("div", {
    className: "cops-nav-links"
  }, links.map(([id, label]) => /*#__PURE__*/React.createElement("a", {
    key: id,
    href: `#${id}`,
    className: `cops-nav-link${active === id ? ' is-active' : ''}`,
    onClick: e => {
      e.preventDefault();
      onNav && onNav(id);
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "cops-nav-end"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "RCA / 2026")));
}
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-eyebrow"
  }, "Campaign Ops \xB7 Internal Operating System"), /*#__PURE__*/React.createElement("h1", {
    className: "cops-display"
  }, "Every campaign,", /*#__PURE__*/React.createElement("br", null), "five phases,", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "tint-flame"
  }, "one tracker.")), /*#__PURE__*/React.createElement("p", {
    className: "cops-lead",
    style: {
      maxWidth: 640,
      marginTop: 24
    }
  }, "A shared rhythm for RCA campaigns \u2014 from Prep through Review. The system says no \u2014 not us. Campaign Ops helps you clear the gate."), /*#__PURE__*/React.createElement("div", {
    className: "cops-hero-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "cops-btn cops-btn-primary"
  }, "Open Live Tracker \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "cops-btn cops-btn-ghost"
  }, "View Roadmap")), /*#__PURE__*/React.createElement("div", {
    className: "cops-hero-meta"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Sprint 1"), " \xB7 May 11 \u2014 22"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Pilot: ", /*#__PURE__*/React.createElement("strong", null, "Lizzy McAlpine \u2014 Angel")), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Street date: ", /*#__PURE__*/React.createElement("strong", null, "9.18.26"))));
}
function PhaseStrip({
  current = 2
}) {
  const phases = [{
    n: '01',
    name: 'PREP',
    q: 'Ready to plan?',
    color: 'var(--phase-01)',
    sub: 'Internal'
  }, {
    n: '02',
    name: 'PLAN',
    q: 'Ready to announce?',
    color: 'var(--phase-02)',
    sub: 'Internal'
  }, {
    n: '03',
    name: 'ANNOUNCE',
    q: 'Ready to release?',
    color: 'var(--phase-03)',
    sub: 'Public'
  }, {
    n: '04',
    name: 'RELEASE',
    q: 'Ready to review?',
    color: 'var(--phase-04)',
    sub: 'Public'
  }, {
    n: '05',
    name: 'REVIEW',
    q: 'Feeds the next',
    color: 'var(--phase-05)',
    sub: 'Public'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-eyebrow"
  }, "The five phases"), /*#__PURE__*/React.createElement("h2", {
    className: "cops-h2"
  }, "Prep \u2192 Plan \u2192 Announce \u2192 Release \u2192 Review"), /*#__PURE__*/React.createElement("div", {
    className: "cops-threshold"
  }, phases.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `cops-threshold-cell ${p.sub === 'Public' ? 'is-public' : ''}`
  }, i === 2 && /*#__PURE__*/React.createElement("span", null, "\u2190 Public"), i !== 2 && p.sub))), /*#__PURE__*/React.createElement("div", {
    className: "cops-phase-row"
  }, phases.map((p, i) => {
    const idx = i + 1;
    const state = idx < current ? 'done' : idx === current ? 'now' : '';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: `cops-phase-cell ${state}`,
      style: {
        borderTopColor: p.color
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "cops-phase-num",
      style: {
        color: p.color
      }
    }, p.n), /*#__PURE__*/React.createElement("div", {
      className: "cops-phase-name"
    }, p.name), /*#__PURE__*/React.createElement("div", {
      className: "cops-phase-body"
    }, idx === 1 && 'Scope, brief, baseline data, pod assigned.', idx === 2 && 'Build the plan. Lock the projection. Pre-announce moves.', idx === 3 && 'Announce day. Coordinated content drop, partner alignment.', idx === 4 && 'Release week. Live performance window, retail surge.', idx === 5 && 'Recap. Numbers in. Performance analysis. Feeds the next.'), /*#__PURE__*/React.createElement("div", {
      className: "cops-phase-foot"
    }, idx === 5 ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u21BA ", p.q) : /*#__PURE__*/React.createElement(React.Fragment, null, "\u2193 ", p.q)));
  })));
}

// Composite marketing shell: nav + hero + phase strip.
function Shell({
  active = 'roadmap',
  onNav,
  current = 2
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Nav, {
    active: active,
    onNav: onNav
  }), /*#__PURE__*/React.createElement("main", {
    className: "cops-page"
  }, /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(PhaseStrip, {
    current: current
  })));
}
Object.assign(__ds_scope, { Nav, Hero, PhaseStrip, Shell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/campaign-ops/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/campaign-ops/Tracker.jsx
try { (() => {
/* global React */
const {
  useState: useStateGT
} = React;
function GateTracker() {
  const [items, setItems] = useStateGT([{
    id: 1,
    owner: 'A&R',
    t: 'Artist + format + approximate timing confirmed',
    on: true
  }, {
    id: 2,
    owner: 'Audience Development',
    t: 'Audience baseline + comparable artist set pulled',
    on: true
  }, {
    id: 3,
    owner: 'Commercial Partnerships',
    t: 'Physical projection requested and returned',
    on: false
  }, {
    id: 4,
    owner: 'Campaign Ops',
    t: 'Historical spend pulled for artist or comparables',
    on: false
  }, {
    id: 5,
    owner: 'Creative',
    t: 'Visual identity brief sent and acknowledged',
    on: false
  }, {
    id: 6,
    owner: 'Publicity',
    t: 'Earned strategy reviewed against announce date',
    on: false
  }]);
  const cleared = items.filter(i => i.on).length;
  const pct = Math.round(cleared / items.length * 100);
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-eyebrow"
  }, "Gate 2 \xB7 Plan \u2192 Announce"), /*#__PURE__*/React.createElement("h2", {
    className: "cops-h2"
  }, "Clear the gate, then announce."), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-n"
  }, "1", /*#__PURE__*/React.createElement("span", null, "/4")), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-l"
  }, "Gates Cleared")), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-n"
  }, cleared, /*#__PURE__*/React.createElement("span", null, "/", items.length)), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-l"
  }, "Prerequisites")), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-n"
  }, pct, /*#__PURE__*/React.createElement("span", null, "%")), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-l"
  }, "Complete")), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-n tint-flame",
    style: {
      fontSize: 18
    }
  }, "PLAN"), /*#__PURE__*/React.createElement("div", {
    className: "cops-stat-l"
  }, "Current Phase"))), /*#__PURE__*/React.createElement("div", {
    className: "cops-prereqs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-prereqs-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "Prerequisites \u2014 check to clear"), /*#__PURE__*/React.createElement("span", {
    className: "cops-mono tint-flame"
  }, cleared, " of ", items.length, " cleared")), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    className: `cops-prereq ${it.on ? 'is-on' : ''}`,
    onClick: () => setItems(items.map(x => x.id === it.id ? {
      ...x,
      on: !x.on
    } : x))
  }, /*#__PURE__*/React.createElement("span", {
    className: `cops-check ${it.on ? 'is-on' : ''}`
  }, it.on ? '✓' : ''), /*#__PURE__*/React.createElement("div", {
    className: "cops-prereq-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-prereq-t"
  }, it.t), /*#__PURE__*/React.createElement("div", {
    className: "cops-prereq-o"
  }, it.owner)))), /*#__PURE__*/React.createElement("div", {
    className: "cops-prereq-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "Closes when"), /*#__PURE__*/React.createElement("p", {
    className: "cops-body-sm"
  }, "Plan locked, projection signed off, language framework drafted, A&R + Creative + Audience Development jointly cleared."))));
}
function DepartmentInputs() {
  const rows = [['A&R', 'Scoping', 'Phase 1 brief', 'Cleared'], ['Audience Development', 'Open for Input', 'Baseline + comparables', 'Pending'], ['Creative', 'In Build', 'Identity brief v2', 'Pending'], ['Publicity', 'Scoping', 'Earned strategy 1-pg', 'Pending'], ['Commercial Partnerships', 'Locked', 'Physical projection', 'Cleared'], ['Radio', 'Open for Input', 'Format read & timing', 'Pending'], ['International', 'Scoping', 'Territory priority list', 'Pending'], ['Finance', 'In Build', 'Budget v0 against P&L', 'Pending']];
  const tagClass = s => 'cops-stage ' + (s === 'Scoping' ? 'is-scoping' : s === 'In Build' ? 'is-build' : s === 'Open for Input' ? 'is-input' : s === 'Locked' ? 'is-locked' : 'is-shipped');
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-eyebrow"
  }, "Department inputs \xB7 Phase 2"), /*#__PURE__*/React.createElement("h2", {
    className: "cops-h2"
  }, "Who owes what, where it sits."), /*#__PURE__*/React.createElement("table", {
    className: "cops-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Department"), /*#__PURE__*/React.createElement("th", null, "Stage"), /*#__PURE__*/React.createElement("th", null, "Deliverable"), /*#__PURE__*/React.createElement("th", null, "Gate 2"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, r[0])), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: tagClass(r[1])
  }, r[1])), /*#__PURE__*/React.createElement("td", null, r[2]), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `cops-gate-pill ${r[3] === 'Cleared' ? 'is-cleared' : ''}`
  }, r[3] === 'Cleared' ? '✓ ' : '', r[3].toUpperCase())))))));
}
function PilotCard() {
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-eyebrow"
  }, "Pilot artist"), /*#__PURE__*/React.createElement("h2", {
    className: "cops-h2"
  }, "Lizzy McAlpine \u2014 Angel"), /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot-name"
  }, "RCA / Alt"), /*#__PURE__*/React.createElement("div", {
    className: "cops-mono"
  }, "Street date 9.18.26 \xB7 Format: LP/D")), /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot-gate"
  }, "PHASE 2 \xB7 PLAN \xB7 2 of 6")), /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cops-body"
  }, "Lizzy moves from Phase 1 (Prep) into Phase 2 (Plan) this sprint. The full prerequisites checklist sits on the tracker. Closes when plan is locked.")), /*#__PURE__*/React.createElement("div", {
    className: "cops-pilot-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "\u2193 Phase 3 unlocks when"), /*#__PURE__*/React.createElement("span", {
    className: "cops-body-sm"
  }, "All six prereqs cleared, projection signed off, brief acknowledged by Creative."))));
}
function PrincipleBlock() {
  return /*#__PURE__*/React.createElement("section", {
    className: "cops-principles"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-principle"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "Principle 01"), /*#__PURE__*/React.createElement("p", null, "Campaign Ops never says no. ", /*#__PURE__*/React.createElement("strong", null, "The system says no."), " Campaign Ops helps you clear the gate.")), /*#__PURE__*/React.createElement("div", {
    className: "cops-principle"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "Principle 02"), /*#__PURE__*/React.createElement("p", null, "Until the system is running roster-wide, ", /*#__PURE__*/React.createElement("strong", null, "nothing's built \u2014 just prepared."))), /*#__PURE__*/React.createElement("div", {
    className: "cops-principle"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "Principle 03"), /*#__PURE__*/React.createElement("p", null, "Closes when the literal exit criteria are met \u2014 ", /*#__PURE__*/React.createElement("strong", null, "not when it feels done."))));
}
function LizzyBar({
  cleared = 2
}) {
  const phases = ['PREP', 'PLAN', 'ANNOUNCE', 'RELEASE', 'REVIEW'];
  return /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-name"
  }, "Lizzy McAlpine"), /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-sub"
  }, "Phases Pilot \xB7 Angel")), /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-gates"
  }, phases.map((p, i) => {
    const state = i + 1 < cleared ? 'done' : i + 1 === cleared ? 'work' : '';
    return /*#__PURE__*/React.createElement("div", {
      key: p,
      className: `cops-lizzy-g ${state}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "cops-lizzy-gn"
    }, "0", i + 1, " \xB7 ", p), /*#__PURE__*/React.createElement("div", {
      className: "cops-lizzy-gq"
    }, state === 'done' && 'Cleared', state === 'work' && 'In progress', !state && i + 1 === cleared + 1 && 'Next', !state && i + 1 > cleared + 1 && '—'));
  })), /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-pct"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-pn"
  }, cleared, "/5"), /*#__PURE__*/React.createElement("div", {
    className: "cops-lizzy-pl"
  }, "Phases")));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "cops-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cops-footer-row"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo_neon.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "cops-footer-name"
  }, "Campaign ", /*#__PURE__*/React.createElement("span", null, "Ops")), /*#__PURE__*/React.createElement("div", {
    className: "cops-mono"
  }, "RCA Records \xB7 Building together \xB7 Internal use only")), /*#__PURE__*/React.createElement("div", {
    className: "cops-footer-end"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cops-mono"
  }, "v0.4 \xB7 Sprint 1"))));
}

// Composite tracker view: pilot card + gate checklist + department inputs.
function Tracker({
  cleared = 2
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("main", {
    className: "cops-page"
  }, /*#__PURE__*/React.createElement(PilotCard, null), /*#__PURE__*/React.createElement(GateTracker, null), /*#__PURE__*/React.createElement(DepartmentInputs, null), /*#__PURE__*/React.createElement(PrincipleBlock, null)), /*#__PURE__*/React.createElement(LizzyBar, {
    cleared: cleared
  }));
}
Object.assign(__ds_scope, { GateTracker, DepartmentInputs, PilotCard, PrincipleBlock, LizzyBar, Footer, Tracker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/campaign-ops/Tracker.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Nav = __ds_scope.Nav;

__ds_ns.Hero = __ds_scope.Hero;

__ds_ns.PhaseStrip = __ds_scope.PhaseStrip;

__ds_ns.Shell = __ds_scope.Shell;

__ds_ns.GateTracker = __ds_scope.GateTracker;

__ds_ns.DepartmentInputs = __ds_scope.DepartmentInputs;

__ds_ns.PilotCard = __ds_scope.PilotCard;

__ds_ns.PrincipleBlock = __ds_scope.PrincipleBlock;

__ds_ns.LizzyBar = __ds_scope.LizzyBar;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Tracker = __ds_scope.Tracker;

})();
