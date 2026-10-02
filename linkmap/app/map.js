export function initializeMap(onReady) {
  let map;
  let annotations = [];
  let selection;

  // Public MapKit JS token restricted to endsunset.github.io.
  const token = "eyJraWQiOiI1WVgzNlk5M1U1IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJYMzlBWFBSUkNRIiwiaWF0IjoxNzg5NjQzNzc2LCJvcmlnaW4iOiJlbmRzdW5zZXQuZ2l0aHViLmlvIiwic2NvcGUiOiJtYXBraXRfanMifQ.MOBNygJnZ0geEID4WOPFqLy1Ii_PP2F75MkrFbfs0uGt0b96HsofPygIKIqJgNc5GuFIj0tD98c0ZYDqU6zpPw";
  const loading = document.getElementById("map-loading");
  const timeout = window.setTimeout(() => showError({ status: "Timeout" }), 20000);

  function showError(error) {
    window.clearTimeout(timeout);
    loading.hidden = true;
    window.reportMapKitError(error);
  }

  window.initMapKit = () => {
    try {
      const mapkit = window.mapkit;
      mapkit.addEventListener("error", showError);
      mapkit.addEventListener("load-error", showError);
      map = new mapkit.Map("map", {
        colorScheme: "light",
        tintColor: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
        showsCompass: mapkit.FeatureVisibility.Visible,
        showsScale: mapkit.FeatureVisibility.Visible,
        showsMapTypeControl: true,
        showsZoomControl: true,
        showsUserLocationControl: true,
        showsPointsOfInterest: true,
        isZoomEnabled: true,
        isScrollEnabled: true,
        isRotationEnabled: true,
      });
      map.addEventListener("user-location-error", showError);
      window.clearTimeout(timeout);
      loading.hidden = true;
      onReady();
    } catch (error) {
      showError(error);
    }
  };

  const script = document.createElement("script");
  script.src = "https://cdn.apple-mapkit.com/mk/6/mapkit.core.js";
  script.crossOrigin = "anonymous";
  script.async = true;
  script.dataset.callback = "initMapKit";
  script.dataset.libraries = "full-map,services";
  script.dataset.token = token;
  script.addEventListener("error", showError);
  document.head.append(script);

  return {
    get region() { return map?.region; },
    showSelection(coordinate, place = null) {
      if (!map) return;
      const sdk = window.mapkit;
      if (selection) map.removeAnnotations([selection]);
      const center = new sdk.Coordinate(coordinate.latitude, coordinate.longitude);
      selection = new sdk.MarkerAnnotation(center, {
        title: place?.name || "Selected coordinate",
        subtitle: place?.formattedAddress || "",
        color: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
        ...(place ? { place } : {}),
      });
      map.addAnnotation(selection);
      map.setRegionAnimated(new sdk.CoordinateRegion(center, new sdk.CoordinateSpan(0.01, 0.01)),
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    },
    clearLocations() {
      if (map && annotations.length) map.removeAnnotations(annotations);
      annotations = [];
    },
    setLocations(locations) {
      if (!map) return;
      try {
        this.clearLocations();
        const sdk = window.mapkit;
        const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
        annotations = locations.filter(location => location.coordinate).map(location =>
          new sdk.MarkerAnnotation(new sdk.Coordinate(location.coordinate.latitude, location.coordinate.longitude), {
            title: location.name || "New Location",
            subtitle: location.detail,
            color: accent,
          })
        );
        if (annotations.length && !selection) {
          map.showItems(annotations, { animate: false, padding: new sdk.Padding(60, 60, 60, 60) });
        }
        if (selection && annotations.length) map.addAnnotations(annotations);
      } catch (error) {
        this.clearLocations();
        showError(error);
      }
    }
  };
}
