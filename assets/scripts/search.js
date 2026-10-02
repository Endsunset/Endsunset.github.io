(() => {
  'use strict';
  const input = document.getElementById('site-search');
  const entries = [...document.querySelectorAll('[data-search-entry]')];
  const status = document.getElementById('search-status');
  document.getElementById('site-search-controls').hidden = false;
  function search() {
    const terms = input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let count = 0;
    entries.forEach(entry => {
      entry.hidden = !terms.every(term => entry.textContent.toLocaleLowerCase().includes(term));
      if (!entry.hidden) count++;
    });
    status.textContent = count ? `${count} destination${count === 1 ? '' : 's'}` : 'No results. Try a project or documentation topic.';
  }
  input.addEventListener('input', search);
  search();
})();
