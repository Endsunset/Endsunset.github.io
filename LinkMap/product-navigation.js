(() => {
  "use strict";
  const accountLink = document.querySelector('.endsunset-product-links a[href$="account/"]');
  if (!accountLink) return;
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

  function updateAuth(detail) {
    if (detail.state === 'loading') return;
    const signedIn = detail.state === 'signed-in';
    document.querySelectorAll('[data-account-link]').forEach(link => { link.hidden = !signedIn; });
    document.querySelectorAll('[data-header-sign-in]').forEach(link => { link.hidden = signedIn; });
  }
  window.addEventListener('linkmap-auth', event => updateAuth(event.detail));
  if (window.LinkMapAuth) updateAuth(window.LinkMapAuth.current);
})();
