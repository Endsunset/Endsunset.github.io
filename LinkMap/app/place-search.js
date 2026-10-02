export function createPlaceSearch(onSelect, getRegion) {
  const input = document.getElementById('place-query');
  const results = document.getElementById('place-results');
  const status = document.getElementById('search-status');
  let service, timer, controller, version = 0;
  function cancel() {
    version++;
    clearTimeout(timer);
    controller?.abort();
    results.replaceChildren();
    results.hidden = true;
    status.textContent = 'Search for a place or address.';
  }
  function render(items, suggestions) {
    results.replaceChildren();
    results.hidden = !items.length;
    for (const item of items) {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'place-result';
      button.textContent = suggestions ? item.displayLines.join(' · ')
        : [item.name, item.formattedAddress].filter(Boolean).join(' · ');
      button.addEventListener('click', () => {
        if (suggestions) {
          input.value = item.displayLines.join(', ');
          request(item, false);
        } else {
          cancel();
          input.value = item.name || item.formattedAddress || '';
          onSelect(item);
          status.textContent = `${item.name || 'Place'} selected. Details and coordinates updated.`;
          input.focus();
        }
      });
      row.append(button);
      results.append(row);
    }
  }
  async function request(query, suggestions) {
    cancel();
    if (!service || (typeof query === 'string' && !query.trim())) return;
    const current = version;
    controller = new AbortController();
    status.textContent = suggestions ? 'Finding suggestions…' : 'Searching places…';
    try {
      const options = { region: getRegion(), signal: controller.signal };
      const response = await (suggestions ? service.autocomplete(query, options) : service.search(query, options));
      if (current !== version) return;
      const items = suggestions ? response.results : response.places.filter(place =>
        place.coordinate && Number.isFinite(place.coordinate.latitude) && Number.isFinite(place.coordinate.longitude)
        && Math.abs(place.coordinate.latitude) <= 90 && Math.abs(place.coordinate.longitude) <= 180);
      render(items, suggestions);
      status.textContent = items.length
        ? `${items.length} ${suggestions ? 'suggestions' : 'results'}. Choose a place${suggestions ? ' to search' : ' to view details'}.`
        : 'No places found. Try another name or address.';
      if (!suggestions && items.length) results.querySelector('button').focus();
    } catch (error) {
      if (current !== version) return;
      status.textContent = 'Search unavailable. Try searching again.';
      window.reportMapKitError(error);
    }
  }
  input.addEventListener('input', () => {
    cancel();
    if (input.value.trim()) timer = setTimeout(() => request(input.value.trim(), true), 250);
  });
  document.getElementById('place-search-form').addEventListener('submit', event => {
    event.preventDefault();
    request(input.value.trim(), false);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && !results.hidden) {
      event.preventDefault();
      results.querySelector('button')?.focus();
    }
    if (event.key === 'Escape') cancel();
  });
  results.addEventListener('keydown', event => {
    const buttons = [...results.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key === 'Escape') { cancel(); input.focus(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
    }
  });
  return {
    cancel,
    ready() {
      service = new window.mapkit.Search();
      input.disabled = false;
      document.getElementById('place-search-submit').disabled = false;
      status.textContent = 'Search for a place or address.';
    },
  };
}
