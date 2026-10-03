(() => {
  'use strict';
  document.querySelectorAll('[data-endsunset-year]').forEach(year => { year.textContent = new Date().getFullYear(); });
  const header = document.querySelector('.endsunset-header');
  if (!header) return;
  const expansion = header.querySelector('.endsunset-expansion');
  const menus = ['projects', 'linkmap'].map(name => {
    const group = header.querySelector(`.endsunset-${name}`);
    return { name, group, trigger: group.querySelector('a, button'), panel: header.querySelector(`.endsunset-${name === 'projects' ? 'project' : name}-menu`) };
  });
  const searchToggle = header.querySelector('.endsunset-search-toggle');
  const searchPanel = header.querySelector('.endsunset-search-panel');
  const searchInput = searchPanel.querySelector('input');
  const panels = [...menus.map(menu => ({ name: menu.name, element: menu.panel })), { name: 'search', element: searchPanel }];
  const hover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  let state = 'closed';
  let hoverTimer;
  let closeTimer;
  let restoringFocus = false;
  let keyboardNavigation = true;
  let pointerType = 'mouse';

  function triggerFor(name) { return name === 'search' ? searchToggle : menus.find(menu => menu.name === name)?.trigger; }
  function focusTrigger(name) {
    restoringFocus = true;
    triggerFor(name)?.focus({ preventScroll: true });
    restoringFocus = false;
  }
  function updateHeight() {
    const active = panels.find(panel => panel.name === state);
    expansion.style.setProperty('--expansion-height', `${active ? active.element.scrollHeight : 0}px`);
  }
  function setState(next) {
    clearTimeout(hoverTimer);
    clearTimeout(closeTimer);
    const previous = panels.find(panel => panel.name === state);
    const moveFocus = next !== state && previous?.element.contains(document.activeElement);
    state = next;
    header.dataset.navState = next;
    expansion.inert = next === 'closed';
    expansion.setAttribute('aria-hidden', String(next === 'closed'));
    panels.forEach(panel => {
      panel.element.inert = next !== panel.name;
      panel.element.setAttribute('aria-hidden', String(next !== panel.name));
    });
    menus.forEach(menu => menu.trigger.setAttribute('aria-expanded', String(next === menu.name)));
    searchToggle.setAttribute('aria-expanded', String(next === 'search'));
    updateHeight();
    if (moveFocus && next !== 'closed') focusTrigger(next);
  }
  function close(restoreFocus = false) {
    const previous = state;
    setState('closed');
    if (restoreFocus) focusTrigger(previous);
  }
  function openMenu(menu) { if (!restoringFocus) setState(menu.name); }

  [expansion, searchToggle, searchPanel, ...menus.map(menu => menu.panel)].forEach(element => { element.hidden = false; });
  setState('closed');
  menus.forEach(menu => {
    menu.group.addEventListener('pointerenter', event => {
      clearTimeout(closeTimer);
      clearTimeout(hoverTimer);
      if (hover.matches && event.pointerType !== 'touch') hoverTimer = setTimeout(() => openMenu(menu), 300);
    });
    menu.group.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    menu.group.addEventListener('focusin', () => {
      if (keyboardNavigation) openMenu(menu);
    });
    menu.group.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && event.target === menu.trigger) {
        event.preventDefault();
        openMenu(menu);
        menu.panel.querySelector('a').focus();
      }
    });
    menu.trigger.addEventListener('click', event => {
      if (menu.name === 'projects') {
        if (event.detail !== 0 && (pointerType === 'touch' || !hover.matches) && state !== menu.name) {
          event.preventDefault();
          openMenu(menu);
        }
      }
    });
  });
  header.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  header.addEventListener('pointerleave', () => {
    clearTimeout(hoverTimer);
    if (hover.matches && state !== 'closed') closeTimer = setTimeout(() => close(header.contains(document.activeElement)), 120);
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) close();
  });
  searchToggle.addEventListener('click', () => {
    setState('search');
    searchInput.focus({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) close(header.contains(document.activeElement));
  });
  document.addEventListener('pointerdown', event => {
    keyboardNavigation = false;
    pointerType = event.pointerType;
  });
  document.addEventListener('keydown', event => {
    keyboardNavigation = true;
    if (event.key === 'Escape' && state !== 'closed') {
      event.preventDefault();
      close(true);
    }
  });
  hover.addEventListener('change', () => close(header.contains(document.activeElement)));
  window.addEventListener('resize', updateHeight);
  if (window.ResizeObserver) {
    const observer = new window.ResizeObserver(updateHeight);
    panels.forEach(panel => observer.observe(panel.element));
  }
})();
