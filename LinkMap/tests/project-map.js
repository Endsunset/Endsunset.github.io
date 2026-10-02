// Run with JavaScriptCore: jsc tests/project-map.js
// Load the plain ES modules into isolated factories without a build dependency.
function moduleSource(path) {
  return readFile(path).replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
}
let checks = 0;
function assert(ok, message) { if (!ok) throw new Error(message); checks++; }
const flush = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };
const defer = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const timers = new Map();
let timerID = 0;
globalThis.setTimeout = fn => { timers.set(++timerID, fn); return timerID; };
globalThis.clearTimeout = id => timers.delete(id);
globalThis.console = { error() {} };
const record = (id, fields = {}) => ({ recordName: id, fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value }])) });
const privateZone = { zoneName: 'projectZone-a', ownerRecordName: '_defaultOwner' };
const sharedZone = { zoneName: 'shared-zone', ownerRecordName: 'owner-b' };
const calls = [];
let fail = false;
const nextPage = { records: [record('p2', { name: 'Project 2' })], moreComing: false };
const firstPage = { records: [record('p10', { name: 'Project 10' })], moreComing: true, continuationMarker: 'next' };
function db(scope) {
  return {
    async fetchAllRecordZones() {
      return { zones: (scope === 'private' ? [privateZone, { zoneName: '_defaultZone' }] : [sharedZone]).map(zoneID => ({ zoneID })) };
    },
    async performQuery(query, options) {
      calls.push({ scope, query, options });
      if (fail) return { hasErrors: true, errors: [{ ckErrorCode: 'ACCESS_DENIED' }] };
      if (query === firstPage) return nextPage;
      if (query.recordType === 'Location') return { records: [record('l1', { latitude: 0, longitude: 0, project: { recordName: 'p2' } })] };
      return scope === 'private' ? firstPage : { records: [record('p2', { name: 'Project 2' })] };
    }
  };
}
globalThis.window = { LinkMapAuth: { container: { privateCloudDatabase: db('private'), sharedCloudDatabase: db('shared') } } };
const data = new Function(moduleSource('app/cloudkit.js') + '\nreturn { fetchProjectZones, queryRecords };')();
const projectsModule = new Function('fetchProjectZones', 'queryRecords', moduleSource('app/project.js') + '\nreturn { loadProjects };')(data.fetchProjectZones, data.queryRecords);
const locationsModule = new Function('queryRecords', moduleSource('app/location.js') + '\nreturn { loadLocations, locationFromRecord };')(data.queryRecords);
(async () => {
  const projects = await projectsModule.loadProjects();
  assert(projects.length === 2 && projects[0].id === 'p2', 'projects deduplicate and sort naturally');
  assert(projects[0].databaseScope === 'shared' && projects[0].zoneID === sharedZone, 'shared context survives conversion');
  assert(calls.length === 3 && calls[0].options.zoneID === privateZone, 'private default zone excluded and pagination complete');
  assert(calls[1].query === firstPage, 'SDK QueryResponse passed for continuation');
  await locationsModule.loadLocations(projects[0]);
  const query = calls.at(-1);
  assert(query.scope === 'shared' && query.options.zoneID === sharedZone, 'Locations use originating database and owner zone');
  assert(query.query.filterBy[0].fieldName === 'project' && query.query.filterBy[0].fieldValue.value.recordName === 'p2', 'direct Project reference query');
  for (const fields of [{}, { latitude: null, longitude: 1 }, { latitude: '1', longitude: 2 }, { latitude: NaN, longitude: 1 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }]) {
    assert(!locationsModule.locationFromRecord(record('bad', fields)).coordinate, 'malformed coordinates excluded');
  }
  assert(locationsModule.locationFromRecord(record('zero', { latitude: 0, longitude: 0 })).coordinate, 'zero is a real coordinate');
  fail = true;
  let error;
  try { await projectsModule.loadProjects(); } catch (value) { error = value; }
  assert(error?.ckErrorCode === 'ACCESS_DENIED', 'response errors are surfaced');
  assert(timers.size === 0, 'request timers cleaned up');

  // Exercise the actual coordinator with delayed data and map startup.
  let onSelect, onReady, authListener, view, mapLocations = [], clears = 0, notices = 0;
  const pending = [];
  const projectLoads = [];
  window.LinkMapAuth.current = { state: 'signed-in' };
  window.addEventListener = (_, callback) => { authListener = callback; };
  window.reportCloudKitError = () => { notices++; return { dismiss() {} }; };
  const map = { clearLocations() { clears++; mapLocations = []; }, setLocations(locations) { mapLocations = locations; } };
  new Function('loadProjects', 'loadLocations', 'initializeMap', 'createProjectSelector', 'createPlaceSearch', 'createPlaceDetails', 'createCoordinates', moduleSource('app/app.js'))(
    () => { const request = defer(); projectLoads.push(request); return request.promise; },
    project => { const request = defer(); pending.push({ project, ...request }); return request.promise; },
    ready => { onReady = ready; return map; },
    select => { onSelect = select; return { render(value) { view = value; } }; },
    () => ({ ready() {} }), () => ({ show() {} }), () => ({ ready() {}, show() {} })
  );
  assert(view.busy, 'project loading visible');
  projectLoads[0].resolve(projects); await flush();
  assert(view.selectedProject === projects[0] && pending.length === 1, 'first project selected');
  onSelect('p10');
  assert(view.selectedProject.id === 'p10' && mapLocations.length === 0 && clears >= 3, 'switch clears old state immediately');
  const latest = [locationsModule.locationFromRecord(record('new', { latitude: 10, longitude: 20 }))];
  pending[1].resolve(latest); await flush();
  pending[0].resolve([record('stale')]); await flush();
  assert(mapLocations === latest && view.locations === latest, 'late previous response cannot mix projects');
  onReady();
  assert(mapLocations === latest, 'late map initialization displays current page data');
  onSelect('p2'); pending[2].resolve([]); await flush();
  assert(view.message.includes('no Locations') && mapLocations.length === 0, 'empty project clears markers');
  onSelect('p10'); pending[3].reject(new Error('offline')); await flush();
  assert(notices === 1 && view.retryable, 'Location failure shown with retry');
  onSelect('p2');
  authListener({ detail: { state: 'signed-out' } });
  pending[4].resolve(latest); await flush();
  assert(view.signedOut && !view.selectedProject && mapLocations.length === 0, 'sign-out invalidates in-flight data');
  authListener({ detail: { state: 'signed-in' } });
  projectLoads[1].resolve([]); await flush();
  assert(!view.projects.length && view.message.includes('No projects'), 'empty projects handled');
  authListener({ detail: { state: 'signed-in' } });
  projectLoads[2].reject(new Error('offline')); await flush();
  assert(notices === 2 && view.retryable, 'Project failure shown with retry');
  print(`Passed ${checks} project data and coordinator assertions.`);
})().catch(error => { print(error.stack); quit(1); });

// Map rendering and selector use the same production modules with small SDK/DOM doubles.
{
  const nodes = {};
  function element() {
    return { dataset: {}, children: [], addEventListener(type, callback) { this[type] = callback; },
      setAttribute() {}, replaceChildren(...children) { this.children = children; } };
  }
  globalThis.document = { documentElement: {}, getElementById(id) { return nodes[id] ||= element(); },
    createElement: element, head: { append() {} } };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '#b4232c' });
  let instances = 0, displayed = [], errors = 0, centered;
  const mapWindow = { setTimeout, clearTimeout, matchMedia: () => ({ matches: true }), reportMapKitError() { errors++; }, mapkit: {
    addEventListener() {}, FeatureVisibility: { Visible: 1 },
    Map: class {
      constructor() { instances++; }
      addEventListener() {}
      removeAnnotations(items) { displayed = displayed.filter(item => !items.includes(item)); }
      showItems(items) { displayed.push(...items); }
      addAnnotation(item) { displayed.push(item); }
      addAnnotations(items) { displayed.push(...items); }
      setRegionAnimated(region) { centered = region.center; }
    },
    Coordinate: class { constructor(latitude, longitude) { Object.assign(this, { latitude, longitude }); } },
    MarkerAnnotation: class { constructor(coordinate, options) { Object.assign(this, { coordinate }, options); } },
    Padding: class {},
    CoordinateRegion: class { constructor(center) { this.center = center; } },
    CoordinateSpan: class {},
  } };
  const initialize = new Function('window', moduleSource('app/map.js') + '\nreturn initializeMap;')(mapWindow);
  const map = initialize(() => {});
  mapWindow.initMapKit();
  map.setLocations([{ coordinate: { latitude: 0, longitude: 0 }, name: 'A', detail: 'Details' }, { coordinate: null }]);
  assert(displayed.length === 1 && displayed[0].subtitle === 'Details', 'map displays valid Location name and detail');
  map.setLocations([{ coordinate: { latitude: 1, longitude: 2 }, name: 'B', detail: '' }]);
  assert(displayed.length === 1 && displayed[0].title === 'B' && instances === 1, 'replacement removes old annotations without rebuilding map');
  map.clearLocations();
  assert(displayed.length === 0 && errors === 0, 'explicit map clear');
  map.showSelection({ latitude: 0, longitude: 0 }, { name: 'Place', formattedAddress: 'Address' });
  assert(displayed.length === 1 && centered.latitude === 0 && displayed[0].title === 'Place', 'selected place marked and centered');
  map.setLocations([{ coordinate: { latitude: 3, longitude: 4 }, name: 'Project location' }]);
  assert(displayed.length === 2 && centered.latitude === 0, 'project response preserves selected place and viewport');
  map.showSelection({ latitude: 5, longitude: 6 });
  assert(displayed.length === 2 && centered.latitude === 5, 'coordinate replaces only selection marker');
  map.clearLocations();
  assert(displayed.length === 1 && displayed[0].title === 'Selected coordinate', 'project clearing retains independent selection');
  let selected;
  const selector = new Function(moduleSource('app/project-selector.js') + '\nreturn createProjectSelector;')()(id => { selected = id; }, () => {});
  const project = { id: 'a', name: '<b>Project</b>', databaseScope: 'shared' };
  selector.render({ projects: [project], selectedProject: project, message: 'Loading Locations…', busy: true });
  assert(nodes['project-select'].children[0].textContent === '<b>Project</b> · Shared', 'project names are text, not HTML');
  assert(!nodes['project-select'].disabled, 'selector stays available while Locations load');
  nodes['project-select'].change();
  assert(selected === 'a', 'selector reports identity to coordinator');
  selector.render({ projects: [], selectedProject: null, message: 'No projects' });
  assert(nodes['project-select'].disabled, 'empty selector disabled');
  print('Passed map annotation and selector checks.');
}
