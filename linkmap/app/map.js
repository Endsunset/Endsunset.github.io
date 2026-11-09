import { visibleLocations, layerBoundaries, regionAtCoordinate } from "./map-view.js";

export function initializeMap(onReady, onSelectLocation = () => {}, onFocusRegion = () => {}) {
  let map;
  let annotations = [];
  let overlays = [];
  let selection;
  let records = { locations: [], regions: [], layers: [], items: [] };
  let context = {};
  let placeHandler = () => {};
  let placeRequestVersion = 0;
  let placeLookup;
  let focusedRegionID;
  let contentPadding = { top: 0, right: 0, bottom: 0, left: 0 };

  // Measure actual overlay geometry, including intermediate animation frames.
  function updatePadding() {
    const canvas = document.getElementById("map");
    if (!map || !canvas.getBoundingClientRect) return;
    const frame = canvas.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const next = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const id of ["app-rail", "app-sidebar", "record-console"]) {
      const element = document.getElementById(id);
      if (!element.getClientRects().length) continue;
      const rect = element.getBoundingClientRect();
      if (mobile) {
        if (id === "app-rail") next.top = Math.max(0, rect.bottom - frame.top);
        else next.bottom = Math.max(next.bottom, frame.bottom - rect.top);
      } else next.left = Math.max(next.left, rect.right - frame.left);
    }
    next.left = Math.min(next.left, Math.max(0, frame.width - 1));
    next.bottom = Math.min(next.bottom, Math.max(0, frame.height - next.top - 1));
    if (Object.keys(next).some(key => next[key] !== contentPadding[key])) {
      contentPadding = next;
      map.padding = new window.mapkit.Padding(next);
    }
  }

  function observeOverlays() {
    if (typeof ResizeObserver === "undefined") return;
    const resize = new ResizeObserver(updatePadding);
    const mutation = new MutationObserver(updatePadding);
    const moving = new Set();
    let frameID;
    const followTransition = () => {
      updatePadding();
      frameID = moving.size ? requestAnimationFrame(followTransition) : null;
    };
    const workspace = document.querySelector(".map-workspace");
    resize.observe(document.getElementById("map"));
    mutation.observe(workspace, { attributes: true, attributeFilter: ["class"] });
    for (const id of ["app-rail", "app-sidebar", "record-console"]) {
      const element = document.getElementById(id);
      resize.observe(element);
      element.addEventListener("transitionrun", event => {
        if (event.target !== element || !["width", "inset-inline-start", "left"].includes(event.propertyName)) return;
        moving.add(element);
        if (!frameID) frameID = requestAnimationFrame(followTransition);
      });
      for (const type of ["transitionend", "transitioncancel"]) element.addEventListener(type, event => {
        if (event.target !== element) return;
        moving.delete(element);
        updatePadding();
      });
      mutation.observe(element, { attributes: true, attributeFilter: ["hidden", "open"] });
    }
    updatePadding();
  }
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();

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
        tintColor: accent(),
        showsCompass: mapkit.FeatureVisibility.Visible,
        showsScale: mapkit.FeatureVisibility.Visible,
        showsMapTypeControl: true,
        showsZoomControl: true,
        showsUserLocationControl: true,
        showsPointsOfInterest: true,
        ...(mapkit.MapFeatureType ? { selectableMapFeatures: Object.values(mapkit.MapFeatureType) } : {}),
        ...(mapkit.PlaceSelectionAccessory ? {
          selectableMapFeatureSelectionAccessory: new mapkit.PlaceSelectionAccessory({ style: "callout" }),
        } : {}),
        isZoomEnabled: true,
        isScrollEnabled: true,
        isRotationEnabled: true,
      });
      map.addEventListener("user-location-error", showError);
      map.addEventListener("select", async event => {
        const version = ++placeRequestVersion;
        const annotation = event.annotation;
        if (annotation?.data?.location) onSelectLocation(annotation.data.location);
        else if (annotation?.data?.place || annotation?.place) placeHandler(annotation.data?.place || annotation.place);
        else if (mapkit.MapFeatureAnnotation && annotation instanceof mapkit.MapFeatureAnnotation && mapkit.PlaceLookup) {
          try {
            placeLookup ||= new mapkit.PlaceLookup();
            const place = await placeLookup.getPlace(annotation);
            if (version === placeRequestVersion) placeHandler(place);
          } catch (error) {
            if (version === placeRequestVersion) window.reportMapKitError(error);
          }
        }
      });
      map.addEventListener("deselect", () => { ++placeRequestVersion; });
      map.addEventListener("region-change-end", () => {
        const regionID = regionAtCoordinate(records, map.region?.center);
        if (regionID !== focusedRegionID) {
          focusedRegionID = regionID;
          onFocusRegion(regionID);
        }
      });
      window.clearTimeout(timeout);
      loading.hidden = true;
      observeOverlays();
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

  function clearGraphics() {
    if (map && annotations.length) map.removeAnnotations(annotations);
    if (map && overlays.length) map.removeOverlays(overlays);
    annotations = [];
    overlays = [];
  }

  function callout(location) {
    return {
      calloutContentForAnnotation() {
        const content = document.createElement("div");
        content.className = "map-record-callout";
        const title = document.createElement("strong");
        title.textContent = location.name || "New Location";
        const description = document.createElement("p");
        description.textContent = location.detail || "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button button-small button-outline";
        button.textContent = "View Location";
        button.addEventListener("click", () => onSelectLocation(location));
        content.append(title, description, button);
        return content;
      },
    };
  }

  function makeOverlay(vertices, selected, area = false) {
    const sdk = window.mapkit;
    const coordinates = vertices.map(point => new sdk.Coordinate(point.latitude, point.longitude));
    const options = { style: new sdk.Style({
      strokeColor: accent(), strokeOpacity: selected ? 1 : 0.45,
      lineWidth: selected ? 3 : 1, fillColor: accent(), fillOpacity: area ? 0.12 : selected ? 0.06 : 0,
      ...(area ? { lineDash: [6, 4] } : {}),
    }) };
    return vertices.length >= 3
      ? new sdk.PolygonOverlay(coordinates, options)
      : new sdk.PolylineOverlay(coordinates, options);
  }

  function fitGraphics() {
    if (!map) return;
    updatePadding();
    const items = [...annotations, ...overlays];
    if (items.length) map.showItems(items, { animate: false, padding: new window.mapkit.Padding({ top: contentPadding.top + 60, right: contentPadding.right + 60, bottom: contentPadding.bottom + 60, left: contentPadding.left + 60 }) });
  }

  function render(fit = false) {
    if (!map) return;
    clearGraphics();
    const sdk = window.mapkit;
    const selectedLevel = records.layers.find(layer => layer.id === context.layerID)?.level || 0;
    const locations = visibleLocations(records, context);
    annotations = locations.filter(location => location.coordinate).map(location => {
      const layer = records.layers.find(layer => layer.id === location.layerID);
      const region = records.regions.find(region => region.id === location.regionID);
      const level = layer?.level || 0;
      const relation = level > selectedLevel ? "above" : level < selectedLevel ? "below" : "current";
      const annotation = new sdk.MarkerAnnotation(new sdk.Coordinate(location.coordinate.latitude, location.coordinate.longitude), {
        title: location.name || "New Location", subtitle: location.detail || "", color: accent(),
        data: { location }, callout: callout(location),
        ...(level ? { glyphText: `${level > selectedLevel ? "↑" : level < selectedLevel ? "↓" : ""}${level}` } : {}),
      });
      // MapKit exposes this text to assistive technology for the layer accessory.
      annotation.accessibilityLabel = [location.name || "New Location", region?.name,
        layer ? `${layer.name || "New Layer"}, level ${level}, ${relation} level` : ""].filter(Boolean).join(" · ");
      return annotation;
    });
    for (const boundary of layerBoundaries(records, context)) {
      overlays.push(makeOverlay(boundary.vertices, boundary.selected));
    }
    const selectedLocation = locations.find(location => location.id === context.locationAreaID);
    if (selectedLocation?.vertices?.length >= 2) overlays.push(makeOverlay(selectedLocation.vertices, true, true));
    if (annotations.length) map.addAnnotations(annotations);
    if (overlays.length) map.addOverlays(overlays);
    if (fit && !selection) fitGraphics();
  }

  return {
    get region() { return map?.region; },
    showSelection(coordinate, place = null) {
      if (!map) return;
      ++placeRequestVersion;
      const sdk = window.mapkit;
      if (selection) map.removeAnnotations([selection]);
      const center = new sdk.Coordinate(coordinate.latitude, coordinate.longitude);
      selection = new sdk.MarkerAnnotation(center, {
        title: place?.name || "Selected coordinate",
        subtitle: place?.formattedAddress || "",
        color: accent(),
        ...(place ? { place, data: { place }, ...(sdk.PlaceSelectionAccessory ? {
          selectionAccessory: new sdk.PlaceSelectionAccessory({ style: "callout" }),
        } : {}) } : {}),
      });
      map.addAnnotation(selection);
      map.setRegionAnimated(new sdk.CoordinateRegion(center, new sdk.CoordinateSpan(0.01, 0.01)),
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    },
    setPlaceSelectionHandler(handler) { placeHandler = handler; },
    clearLocations() {
      records = { locations: [], regions: [], layers: [], items: [] };
      context = {};
      focusedRegionID = undefined;
      clearGraphics();
    },
    setLocations(locations) {
      this.setRecords({ locations, regions: [], layers: [], items: [] });
    },
    setRecords(nextRecords, nextContext = {}, options = {}) {
      records = { locations: [], regions: [], layers: [], items: [], ...nextRecords };
      context = { ...nextContext };
      try {
        render(options.fit !== false);
      } catch (error) {
        clearGraphics();
        showError(error);
      }
    },
    focusLocation(location) {
      if (!map || !location.coordinate) return;
      const sdk = window.mapkit;
      const center = new sdk.Coordinate(location.coordinate.latitude, location.coordinate.longitude);
      map.setRegionAnimated(new sdk.CoordinateRegion(center, new sdk.CoordinateSpan(0.01, 0.01)),
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    },
    showAll() { fitGraphics(); },
  };
}
