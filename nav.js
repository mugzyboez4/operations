// Shared nav for all Campaign Ops pages
function renderNav(activePage) {
  const pages = [
    {id:'roadmap', label:'Roadmap', href:'/'},
    {id:'innovation', label:'Innovation', href:'/innovation.html'},
    {id:'pm', label:'Project Management', href:'/pm.html'},
    {id:'systems', label:'Systems', href:'/systems.html'},
    {id:'resources', label:'Resources', href:'/resources.html'},
  ];
  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="logo">Campaign <span>Ops</span></div>
    ${pages.map(p => `<a href="${p.href}" class="${p.id === activePage ? 'active' : ''}">${p.label}</a>`).join('')}
  `;
  document.body.prepend(nav);
}
