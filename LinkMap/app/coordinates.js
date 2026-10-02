export function parseCoordinates(value) {
  const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const match = value.trim().match(new RegExp(`^(${number})(?:\\s*,\\s*|\\s+)(${number})$`));
  if (!match) return null;
  const latitude = Number(match[1]), longitude = Number(match[2]);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
}

export function createCoordinates(onSelect) {
  const input = document.getElementById('coordinate-input');
  const copy = document.getElementById('coordinate-copy');
  const status = document.getElementById('coordinate-status');
  let revision = 0;
  const format = coordinate => `${coordinate.latitude}, ${coordinate.longitude}`;
  input.addEventListener('input', () => {
    revision++;
    input.removeAttribute('aria-invalid');
    copy.disabled = !parseCoordinates(input.value);
    status.textContent = 'Latitude −90 to 90; longitude −180 to 180.';
  });
  document.getElementById('coordinate-form').addEventListener('submit', event => {
    event.preventDefault();
    const coordinate = parseCoordinates(input.value);
    if (!coordinate) {
      input.setAttribute('aria-invalid', 'true');
      status.textContent = 'Enter latitude (−90 to 90), then longitude (−180 to 180), separated by a comma or space.';
      input.focus();
      return;
    }
    revision++;
    onSelect(coordinate);
    input.value = format(coordinate);
    copy.disabled = false;
    status.textContent = 'Coordinate displayed on the map.';
  });
  copy.addEventListener('click', async () => {
    const coordinate = parseCoordinates(input.value);
    if (!coordinate) return;
    const version = revision;
    try {
      await navigator.clipboard.writeText(format(coordinate));
      if (version === revision) status.textContent = 'Coordinate copied.';
    } catch {
      if (version !== revision) return;
      input.focus();
      input.select();
      status.textContent = 'Copy unavailable. The coordinate is selected; use your device’s Copy command.';
    }
  });
  return {
    ready() {
      input.disabled = false;
      document.getElementById('coordinate-show').disabled = false;
    },
    show(coordinate) {
      revision++;
      input.value = format(coordinate);
      input.removeAttribute('aria-invalid');
      copy.disabled = false;
      status.textContent = 'Selected place’s latitude and longitude.';
    },
  };
}
