(() => {
  'use strict';
  document.querySelectorAll('[data-endsunset-year]').forEach(year => { year.textContent = new Date().getFullYear(); });
  const header = document.querySelector('.endsunset-header');
  if (!header) return;
  const controls = header.querySelector('.endsunset-controls');
  const menus = ['projects', 'linkmap'].map(name => {
    const group = header.querySelector(`.endsunset-${name}`);
    return { name, group, trigger: group.querySelector('a, button'), panel: group.querySelector('.endsunset-menu-panel') };
  });
  const searchToggle = header.querySelector('.endsunset-search-toggle');
  const searchPanel = header.querySelector('.endsunset-search-panel');
  const searchInput = searchPanel.querySelector('input');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  let state = 'closed';
  let timer;
  let restoringFocus = false;
  let keyboardNavigation = true;
  let pointerType = 'mouse';

  function setState(next) {
    clearTimeout(timer);
    state = next;
    header.dataset.navState = next;
    menus.forEach(menu => {
      menu.panel.inert = next !== menu.name;
      menu.panel.setAttribute('aria-hidden', String(next !== menu.name));
      menu.trigger.setAttribute('aria-expanded', String(next === menu.name));
    });
    searchPanel.inert = next !== 'search';
    searchPanel.setAttribute('aria-hidden', String(next !== 'search'));
    searchToggle.setAttribute('aria-expanded', String(next === 'search'));
    controls.inert = next === 'search';
  }

  function close(restoreFocus = false) {
    const target = state === 'search' ? searchToggle : menus.find(menu => menu.name === state)?.trigger;
    setState('closed');
    if (restoreFocus && target) {
      restoringFocus = true;
      target.focus();
      restoringFocus = false;
    }
  }

  function openMenu(menu) {
    if (state !== 'search' && !restoringFocus) setState(menu.name);
  }

  setState('closed');
  [searchToggle, searchPanel, menus[1].trigger, ...menus.map(menu => menu.panel)].forEach(element => { element.hidden = false; });
  menus.forEach(menu => {
    const enter = event => {
      if (hover.matches && event.pointerType !== 'touch') openMenu(menu);
    };
    menu.group.addEventListener('pointerenter', enter);
    menu.panel.addEventListener('pointerenter', enter);
    menu.group.addEventListener('pointerleave', () => {
      if (hover.matches && state === menu.name && !(keyboardNavigation && menu.group.contains(document.activeElement))) {
        // Keep a brief bridge when crossing the header/panel boundary.
        timer = setTimeout(() => setState('closed'), 160);
      }
    });
    menu.group.addEventListener('focusin', () => {
      if (keyboardNavigation) openMenu(menu);
    });
    menu.group.addEventListener('focusout', event => {
      if (state === menu.name && !menu.group.contains(event.relatedTarget)) close();
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
        // The link keeps normal mouse/keyboard navigation; first touch reveals it.
        if (event.detail !== 0 && (pointerType === 'touch' || !hover.matches) && state !== menu.name) {
          event.preventDefault();
          openMenu(menu);
        }
      } else {
        setState(state === menu.name ? 'closed' : menu.name);
      }
    });
  });
  searchToggle.addEventListener('click', () => {
    setState('search');
    searchInput.focus({ preventScroll: true });
  });
  searchPanel.addEventListener('focusout', event => {
    if (state === 'search' && !searchPanel.contains(event.relatedTarget)) close();
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) close(searchPanel.contains(document.activeElement));
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
  hover.addEventListener('change', () => {
    const menu = menus.find(menu => menu.name === state);
    if (menu) close(menu.group.contains(document.activeElement));
  });
})();
