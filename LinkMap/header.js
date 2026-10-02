(() => {
  "use strict";
  const header = document.querySelector('.site-header');
  // Suppress native link/selection dragging without blocking clicks or touch scrolling.
  header.addEventListener('dragstart', event => event.preventDefault());
  const accountLink = header.querySelector('[data-account-link]');
  const menu = header.querySelector('.mobile-navigation');
  const menuToggle = header.querySelector('.mobile-menu-toggle');
  const mobile = window.matchMedia('(max-width: 760px)');

  // Include every sign-in action, including those below this header.
  function updateSignInLinks() {
    const login = new URL(accountLink.getAttribute('href').replace(/account\/$/, 'login/'), window.location.href);
    if (window.location.pathname === login.pathname) return;
    const redirect = window.location.pathname + window.location.search + window.location.hash;
    document.querySelectorAll('a[href]').forEach(link => {
      const target = new URL(link.getAttribute('href'), window.location.href);
      if (target.origin !== login.origin || target.pathname !== login.pathname) return;
      target.searchParams.set('redirect', redirect);
      link.setAttribute('href', link.getAttribute('href').split(/[?#]/)[0] + target.search + target.hash);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateSignInLinks);
  else updateSignInLinks();
  window.addEventListener('hashchange', updateSignInLinks);
  document.addEventListener('click', updateSignInLinks, true);

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

  function updateAuth(detail) {
    if (detail.state === 'loading') return;
    const signedIn = detail.state === 'signed-in';
    accountLink.hidden = !signedIn;
    document.querySelectorAll('[data-header-sign-in]').forEach(link => { link.hidden = signedIn; });
  }
  window.addEventListener('linkmap-auth', event => updateAuth(event.detail));
  if (window.LinkMapAuth) updateAuth(window.LinkMapAuth.current);
})();
