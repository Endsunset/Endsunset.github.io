// Adapted from LinkMap documentation: scrolling rows and a fixed filter footer.
(() => {
  const sidebar = document.querySelector('#forms-sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  const close = document.querySelector('.sidebar-close');
  const filter = document.querySelector('#form-filter');
  if (!sidebar || !toggle || !close || !filter) return;
  const mobile = matchMedia('(max-width: 700px)');
  const background = [...document.querySelectorAll('.site-header, .site-footer, .forms-toolbar, .forms-content, .skip-link')];
  let open = false;
  let saved;
  try { saved = sessionStorage.getItem('endsunset-forms-sidebar'); } catch {}
  function setOpen(value, remember = false) {
    background.forEach(element => { element.inert = value && mobile.matches; });
    if (!value && sidebar.contains(document.activeElement)) toggle.focus();
    open = value;
    sidebar.inert = !value;
    sidebar.setAttribute('aria-hidden', String(!value));
    document.body.classList.toggle('sidebar-collapsed', !value);
    toggle.setAttribute('aria-expanded', String(value));
    toggle.setAttribute('aria-label', `${value ? 'Hide' : 'Show'} forms sidebar`);
    if (remember) {
      saved = value ? 'open' : 'closed';
      try { sessionStorage.setItem('endsunset-forms-sidebar', saved); } catch {}
    }
    if (value && mobile.matches) close.focus();
  }
  toggle.hidden = close.hidden = false;
  document.querySelector('.forms-filter').hidden = false;
  document.body.classList.add('sidebar-ready');
  setOpen(!mobile.matches && saved !== 'closed');
  toggle.addEventListener('click', () => setOpen(!open, true));
  close.addEventListener('click', () => setOpen(false, true));
  mobile.addEventListener('change', () => setOpen(!mobile.matches && saved !== 'closed'));
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') setOpen(false, true);
    if (event.key === 'Tab' && mobile.matches) {
      const targets = [...sidebar.querySelectorAll('a[href], button, input')].filter(element => element.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  filter.addEventListener('input', () => {
    const rows = [...sidebar.querySelectorAll('[data-filter-item]')];
    const query = filter.value.trim().toLowerCase();
    rows.forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
    const count = rows.filter(row => !row.hidden).length;
    const status = document.querySelector('.filter-status');
    status.hidden = !query;
    status.textContent = count ? `${count} form${count === 1 ? '' : 's'} found` : 'No forms found.';
  });
})();
