(() => {
  "use strict";
  const header = document.querySelector('.site-header');
  // Suppress native link/selection dragging without blocking clicks or touch scrolling.
  header.addEventListener('dragstart', event => event.preventDefault());
  const menu = header.querySelector('.mobile-navigation');
  const menuToggle = header.querySelector('.mobile-menu-toggle');
  const mobile = window.matchMedia('(max-width: 760px)');

  function positionMenu() {
    menu.style.setProperty('--menu-top', `${header.getBoundingClientRect().bottom}px`);
  }
  menu.addEventListener('beforetoggle', event => {
    const open = event.newState === 'open';
    if (open) positionMenu();
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') menuToggle.focus();
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) menu.hidePopover();
  });
  window.addEventListener('resize', positionMenu);
  window.addEventListener('scroll', positionMenu, { passive: true });
  mobile.addEventListener('change', () => {
    if (!mobile.matches && menu.matches(':popover-open')) menu.hidePopover();
  });

})();
