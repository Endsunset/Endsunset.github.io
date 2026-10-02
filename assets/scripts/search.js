(() => {
  'use strict';
  const input = document.getElementById('site-search');
  const clear = document.getElementById('site-search-clear');
  const entries = [...document.querySelectorAll('[data-search-entry]')];
  const results = document.querySelector('.search-results');
  const status = document.getElementById('search-status');
  const query = new URLSearchParams(window.location.search).get('q') || '';
  input.value = query;
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  let count = 0;
  entries.forEach(entry => {
    entry.hidden = !terms.length || !terms.every(term => entry.textContent.toLocaleLowerCase().includes(term));
    if (!entry.hidden) count++;
  });
  results.hidden = !terms.length;
  status.textContent = !terms.length ? '' : count ? `${count} result${count === 1 ? '' : 's'}` : 'No results. Try a project or documentation topic.';
  function updateClear() { clear.hidden = !input.value; }
  clear.addEventListener('click', () => {
    input.value = '';
    updateClear();
    input.focus();
  });
  input.addEventListener('input', updateClear);
  updateClear();
  // Both forms use native GET submission: Enter navigates to /search/?q=….
})();
