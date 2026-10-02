export function createPlaceDetails() {
  const container = document.getElementById('place-detail');
  const summary = document.getElementById('place-summary');
  let detail;
  return {
    show(place) {
      detail?.destroy();
      detail = null;
      container.replaceChildren();
      container.hidden = !place;
      summary.textContent = place
        ? [place.name, place.formattedAddress].filter(Boolean).join(' · ')
        : 'Custom coordinate selected. Search for a place to see its details.';
      if (!place) return;
      try {
        detail = new window.mapkit.PlaceDetail(container, place, { colorScheme: 'light', displaysMap: false });
      } catch (error) {
        container.hidden = true;
        summary.textContent += ' · Additional place details are unavailable. Select the result again to retry.';
        window.reportMapKitError(error);
      }
    },
  };
}
