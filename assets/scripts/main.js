// Content and navigation are rendered at build time and work without JavaScript.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
for (const link of document.querySelectorAll('[data-nav]')) {
  if (link.dataset.nav === document.body.dataset.page) {
    link.setAttribute('aria-current', document.body.dataset.page === 'home' || location.pathname === '/projects/' ? 'page' : 'true');
  }
}
