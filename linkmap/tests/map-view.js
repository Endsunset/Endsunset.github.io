// Run with node tests/run.mjs map-view.js
let checks = 0;
function assert(value, message) { if (!value) throw new Error(message); checks++; }
const source = path => readFile(path).replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const geometry = new Function(source('app/map-view.js') + '\nreturn {convexHull, visibleLocations, layerBoundaries, regionAtCoordinate};')();
const point = (latitude, longitude) => ({ latitude, longitude });
const records = {
  regions: [{id: 'r1'}, {id: 'r2'}],
  layers: [{id: 'l1', regionID: 'r1', level: 1}, {id: 'l2', regionID: 'r1', level: 2}, {id: 'l3', regionID: 'r2', level: -1}],
  locations: [
    {id: 'a', name: '<One>', coordinate: point(0, 0), regionID: 'r1', layerID: 'l1', vertices: [point(0, 0), point(0, 2), point(2, 2), point(2, 0)]},
    {id: 'b', coordinate: point(1, 1), regionID: 'r1', layerID: 'l2', vertices: []},
    {id: 'c', coordinate: point(4, 4), regionID: 'r1', layerID: null, vertices: []},
    {id: 'd', coordinate: point(10, 10), regionID: 'r2', layerID: 'l3', vertices: []},
  ], items: [],
};
assert(geometry.visibleLocations(records, {regionID: 'r1'}).length === 4, 'focused region alone keeps all locations');
assert(geometry.visibleLocations(records, {layerID: 'l1'}).length === 3, 'selected layer filters by location region, retaining other levels and unlayered places');
assert(geometry.visibleLocations(records, {layerID: 'missing'}).length === 4, 'unknown layer falls back to ordinary scope');
assert(geometry.convexHull([point(0, 0), point(0, 2), point(2, 0), point(.5, .5), point(0, 0)]).length === 3, 'hull removes interior and duplicate points');
assert(geometry.convexHull([point(0, 0), point(0, 1), point(0, 2)]).length === 2, 'collinear area remains a line');
assert(geometry.convexHull([point(100, 0), point(0, 0)]).length === 1, 'invalid coordinates cannot corrupt hull');
assert(geometry.layerBoundaries(records).length === 1, 'layers without two distinct boundary points have no outline');
assert(geometry.layerBoundaries(records)[0].vertices.length === 4, 'saved vertices define layer boundary before location point');
const outlined = { ...records, locations: records.locations.map(location => location.id === 'b'
  ? {...location, vertices: [point(0, 0), point(0, 2), point(2, 0)]}
  : location.id === 'd' ? {...location, vertices: [point(10, 10), point(10, 12), point(12, 10)]} : location) };
assert(geometry.layerBoundaries(outlined).length === 3, 'Map context keeps every referenced Layer outline');
const scopedBoundaries = geometry.layerBoundaries(outlined, {layerID: 'l1'});
assert(scopedBoundaries.length === 2 && !scopedBoundaries.some(boundary => boundary.layer.id === 'l3'),
  'selected Layer hides outlines outside the displayed Location region');
assert(scopedBoundaries.at(-1).layer.id === 'l1' && scopedBoundaries.at(-1).selected,
  'selected Layer draws last so overlapping outlines cannot cover its highlight');
assert(geometry.regionAtCoordinate(records, point(1, 1)) === 'r1', 'map center identifies enclosing layer region');
assert(geometry.regionAtCoordinate(records, point(5, 5)) === null, 'outside center has no focused region');
const crossing = { ...records, layers: [{id: 'date', regionID: 'cross'}], locations: [{layerID: 'date', vertices: [point(-1, 179), point(-1, -179), point(1, -179), point(1, 179)]}] };
assert(geometry.regionAtCoordinate(crossing, point(0, 180)) === 'cross', 'antimeridian region encloses longitude 180');
assert(geometry.regionAtCoordinate(crossing, point(0, 0)) === null, 'antimeridian boundary does not enclose the rest of the world');

function node() {
  return {dataset: {}, children: [], addEventListener(name, fn) { this[name] = fn; }, append(...values) { this.children.push(...values); }};
}
const listeners = {};
let annotations = [], overlays = [], centered, fitted, selected, focused, mapOptions;
const lookups = [], errors = [];
const document = {documentElement: {}, getElementById: node, createElement: node, head: {append() {}}};
const window = {setTimeout: () => 1, clearTimeout() {}, matchMedia: () => ({matches: true}), reportMapKitError(error) { errors.push(error); }, mapkit: {
  addEventListener() {}, FeatureVisibility: {Visible: 1},
  MapFeatureType: {PointOfInterest: 'point-of-interest', Territory: 'territory', PhysicalFeature: 'physical-feature'},
  MapFeatureAnnotation: class {constructor(name) {this.name = name;}},
  PlaceSelectionAccessory: class {constructor(options) {this.options = options;}},
  PlaceLookup: class {getPlace(annotation) {return new Promise((resolve, reject) => lookups.push({annotation, resolve, reject}));}},
  Coordinate: class {constructor(latitude, longitude) {Object.assign(this, {latitude, longitude});}},
  CoordinateRegion: class {constructor(center) {this.center = center;}}, CoordinateSpan: class {}, Padding: class {},
  MarkerAnnotation: class {constructor(coordinate, options) {Object.assign(this, {coordinate}, options);}},
  Style: class {constructor(options) {Object.assign(this, options);}},
  PolygonOverlay: class {constructor(vertices, options) {Object.assign(this, {vertices}, options);}},
  PolylineOverlay: class {constructor(vertices, options) {Object.assign(this, {vertices}, options);}},
  Map: class {
    constructor(id, options) {mapOptions = options; this.region = {center: point(1, 1)};}
    addEventListener(name, fn) {listeners[name] = fn;}
    addAnnotation(value) {annotations.push(value);}
    addAnnotations(values) {annotations.push(...values);}
    removeAnnotations(values) {annotations = annotations.filter(value => !values.includes(value));}
    addOverlays(values) {overlays.push(...values);}
    removeOverlays(values) {overlays = overlays.filter(value => !values.includes(value));}
    showItems(values) {fitted = values;}
    setRegionAnimated(region) {centered = region.center;}
  },
}};
const createMap = new Function('window', 'document', 'getComputedStyle', ...Object.keys(geometry), source('app/map.js') + '\nreturn initializeMap;')(
  window, document, () => ({getPropertyValue: () => '#b4232c'}), ...Object.values(geometry));
const map = createMap(() => {}, location => {selected = location;}, region => {focused = region;});
map.setRecords(records);
window.initMapKit();
assert(mapOptions.selectableMapFeatures.length === 3, 'POIs, territories and physical features are selectable');
assert(mapOptions.selectableMapFeatureSelectionAccessory.options.style === 'callout', 'map features use native place callout accessory');
map.setRecords(records, {layerID: 'l1', locationAreaID: 'a'});
assert(annotations.length === 3 && overlays.length === 2, 'selected layer region renders markers, hull, and selected saved area');
assert(annotations[1].glyphText === '↑2', 'accessory distinguishes level above current level');
listeners.select({annotation: annotations[0]});
assert(selected.id === 'a', 'marker selects its Location for the console');
const callout = annotations[0].callout.calloutContentForAnnotation();
assert(callout.children[0].textContent === '<One>', 'record callout uses text instead of HTML');
selected = null;
callout.children[2].click();
assert(selected.id === 'a', 'callout accessory opens Location console');
listeners['region-change-end']();
assert(focused === 'r1', 'viewport focus reports region containment');
map.showSelection(point(20, 20), {name: 'Place'});
const selectedPlaceAnnotation = annotations.at(-1);
let selectedPlace;
map.setPlaceSelectionHandler(place => {selectedPlace = place;});
listeners.select({annotation: selectedPlaceAnnotation});
assert(selectedPlace.name === 'Place', 'place accessory supports Apple place detail presentation');
assert(selectedPlaceAnnotation.selectionAccessory.options.style === 'callout', 'search place annotation uses native place callout accessory');
map.setRecords({locations: [], regions: [], layers: [], items: []});
assert(annotations.length === 1 && annotations[0] === selectedPlaceAnnotation && overlays.length === 0, 'project switch clears old overlays and markers while retaining search place');
map.setRecords(records, {}, {fit: false});
map.focusLocation(records.locations[0]);
assert(centered.latitude === 0 && centered.longitude === 0, 'Location focus accepts explicit zero coordinates');
map.showAll();
assert(fitted.length === 5, 'show all fits project markers and layer outlines');
map.setRecords(outlined, {layerID: 'l1', locationAreaID: 'd'}, {fit: false});
assert(overlays.length === 2, 'hidden Location area cannot remain visible outside selected Layer region');
map.clearLocations();
assert(overlays.length === 0 && annotations.length === 1, 'sign-out clears every project graphic');
(async () => {
  const first = new window.mapkit.MapFeatureAnnotation('First POI');
  const second = new window.mapkit.MapFeatureAnnotation('Second POI');
  const firstRequest = listeners.select({annotation: first});
  const secondRequest = listeners.select({annotation: second});
  assert(lookups[0].annotation === first && lookups[1].annotation === second, 'POI selection resolves actual MapFeatureAnnotation through PlaceLookup');
  lookups[1].resolve({name: 'Second POI place', coordinate: point(3, 4)});
  await secondRequest;
  lookups[0].resolve({name: 'Stale POI place'});
  await firstRequest;
  assert(selectedPlace.name === 'Second POI place', 'late previous POI lookup cannot replace current place details');
  const deselectedRequest = listeners.select({annotation: first});
  listeners.deselect();
  lookups[2].resolve({name: 'Deselected POI place'});
  await deselectedRequest;
  assert(selectedPlace.name === 'Second POI place', 'deselected POI lookup cannot reopen stale details');
  const markerRequest = listeners.select({annotation: first});
  listeners.select({annotation: {data: {location: records.locations[0]}}});
  lookups[3].resolve({name: 'POI behind Location'});
  await markerRequest;
  assert(selectedPlace.name === 'Second POI place' && selected.id === 'a', 'Location selection invalidates pending POI details');
  const coordinateRequest = listeners.select({annotation: first});
  map.showSelection(point(0, 0));
  lookups[4].resolve({name: 'POI behind coordinate'});
  await coordinateRequest;
  assert(selectedPlace.name === 'Second POI place', 'programmatic coordinate or search selection invalidates pending POI details');
  const failureRequest = listeners.select({annotation: first});
  const failure = new Error('POI unavailable');
  lookups[5].reject(failure);
  await failureRequest;
  assert(errors.length === 1 && errors[0] === failure, 'current POI failure is surfaced through MapKit notification');
  const staleFailureRequest = listeners.select({annotation: first});
  listeners.deselect();
  lookups[6].reject(new Error('Previous POI unavailable'));
  await staleFailureRequest;
  assert(errors.length === 1, 'stale POI failure does not interrupt current selection');
  print(`Passed ${checks} map geometry, accessory and overlay assertions.`);
})().catch(error => {print(error.stack); quit(1);});
