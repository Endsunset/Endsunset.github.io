(() => {
  'use strict';
  document.querySelectorAll('[data-endsunset-year]').forEach(year => { year.textContent = new Date().getFullYear(); });
  const header = document.querySelector('.endsunset-header');
  if (!header) return;
  const projects = header.querySelector('.endsunset-projects');
  const toggle = header.querySelector('.endsunset-projects-toggle');
  const menu = header.querySelector('.endsunset-project-menu');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  let timer;
  function setOpen(open) {
    clearTimeout(timer);
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Hide projects menu' : 'Show projects menu');
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  projects.addEventListener('pointerenter', event => {
    if (hover.matches && event.pointerType !== 'touch') setOpen(true);
  });
  projects.addEventListener('pointerleave', () => {
    if (hover.matches && !projects.contains(document.activeElement)) timer = setTimeout(() => setOpen(false), 180);
  });
  projects.addEventListener('focusout', event => {
    if (!projects.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!projects.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
  });
  hover.addEventListener('change', () => setOpen(false));
})();
