(() => {
  'use strict';
  document.querySelectorAll('[data-endsunset-year]').forEach(year => { year.textContent = new Date().getFullYear(); });
  const header = document.querySelector('.endsunset-header');
  if (!header) return;
  const controls = header.querySelector('.endsunset-controls');
  const projects = header.querySelector('.endsunset-projects');
  const projectLink = projects.querySelector('a');
  const toggle = header.querySelector('.endsunset-projects-toggle');
  const menu = header.querySelector('.endsunset-project-menu');
  const searchToggle = header.querySelector('.endsunset-search-toggle');
  const searchPanel = header.querySelector('.endsunset-search-panel');
  const searchForm = searchPanel.querySelector('form');
  const searchInput = searchPanel.querySelector('input');
  const cancel = searchPanel.querySelector('.endsunset-search-cancel');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  let state = 'closed';
  let timer;
  let restoringFocus = false;
  let keyboardNavigation = true;

  function setState(next) {
    clearTimeout(timer);
    state = next;
    header.dataset.navState = next;
    menu.inert = next !== 'projects';
    menu.setAttribute('aria-hidden', String(next !== 'projects'));
    toggle.setAttribute('aria-expanded', String(next === 'projects'));
    toggle.setAttribute('aria-label', next === 'projects' ? 'Hide projects menu' : 'Show projects menu');
    searchPanel.inert = next !== 'search';
    searchPanel.setAttribute('aria-hidden', String(next !== 'search'));
    searchToggle.setAttribute('aria-expanded', String(next === 'search'));
    controls.inert = next === 'search';
  }

  function close(restoreFocus = false) {
    const target = state === 'search' ? searchToggle : projectLink;
    setState('closed');
    if (restoreFocus) {
      restoringFocus = true;
      target.focus();
      restoringFocus = false;
    }
  }

  function openProjects() {
    if (state !== 'search' && !restoringFocus) setState('projects');
  }

  function leaveProjects() {
    if (hover.matches && state === 'projects' && !(keyboardNavigation && projects.contains(document.activeElement))) {
      // Keep a brief bridge when crossing the header/panel boundary.
      timer = setTimeout(() => setState('closed'), 160);
    }
  }

  setState('closed');
  [toggle, menu, searchToggle, searchPanel].forEach(element => { element.hidden = false; });
  toggle.addEventListener('click', () => setState(state === 'projects' ? 'closed' : 'projects'));
  projects.addEventListener('pointerenter', event => {
    if (hover.matches && event.pointerType !== 'touch') openProjects();
  });
  projects.addEventListener('pointerleave', leaveProjects);
  menu.addEventListener('pointerenter', event => {
    if (hover.matches && event.pointerType !== 'touch') openProjects();
  });
  projects.addEventListener('focusin', () => {
    if (keyboardNavigation) openProjects();
  });
  projects.addEventListener('focusout', event => {
    if (state === 'projects' && !projects.contains(event.relatedTarget)) close();
  });
  projects.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && (event.target === projectLink || event.target === toggle)) {
      event.preventDefault();
      openProjects();
      menu.querySelector('a').focus();
    }
  });
  searchToggle.addEventListener('click', () => {
    setState('search');
    searchInput.focus({ preventScroll: true });
  });
  cancel.addEventListener('click', () => close(true));
  searchPanel.addEventListener('focusout', event => {
    if (state === 'search' && !searchPanel.contains(event.relatedTarget)) close();
  });
  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) header.dispatchEvent(new CustomEvent('endsunset-search', { bubbles: true, detail: { query } }));
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) close(searchPanel.contains(document.activeElement));
  });
  document.addEventListener('pointerdown', () => { keyboardNavigation = false; });
  document.addEventListener('keydown', event => {
    keyboardNavigation = true;
    if (event.key === 'Escape' && state !== 'closed') {
      event.preventDefault();
      close(true);
    }
  });
  hover.addEventListener('change', () => {
    if (state === 'projects') close(projects.contains(document.activeElement));
  });
})();
