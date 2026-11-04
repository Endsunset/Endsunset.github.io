// Run with node tests/run.mjs project-map.js.
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
const record = (id, fields = {}, extra = {}) => ({ recordName: id, ...extra, fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value }])) });
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
globalThis.window = { matchMedia: () => ({ matches: false }), LinkMapAuth: { container: { privateCloudDatabase: db('private'), sharedCloudDatabase: db('shared') } } };
const data = new Function(moduleSource('app/cloudkit.js') + '\nreturn { fetchProjectZones, queryRecords };')();
const projectsModule = new Function('fetchProjectZones', 'queryRecords', moduleSource('app/project.js') + '\nreturn { loadProjects };')(data.fetchProjectZones, data.queryRecords);
const locationsModule = new Function('queryRecords', moduleSource('app/location.js') + '\nreturn { loadLocations, locationFromRecord };')(data.queryRecords);
const geometry = new Function(moduleSource('app/map-view.js') + '\nreturn { visibleLocations };')();
function element() {
  const attributes = {};
  return { dataset: {}, children: [], value: '', hidden: false, isConnected: true,
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, callback) { this[type] = callback; },
    setAttribute(name, value) { attributes[name] = value; }, getAttribute(name) { return attributes[name]; },
    append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
    querySelector() { return this.querySelectorAll()[0]; },
    querySelectorAll() { return this.children.flatMap(child => child.tag === 'button' ? [child] : child.querySelectorAll()); },
    focus() { document.activeElement = this; } };
}
const nodes = {};
globalThis.document = { getElementById(id) { return nodes[id] ||= element(); }, createElement(tag) { return {...element(), tag}; } };
const empty = () => ({ locations: [], regions: [], layers: [], items: [] });
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
  fail = true;
  let error;
  try { await projectsModule.loadProjects(); } catch (value) { error = value; }
  assert(error?.ckErrorCode === 'ACCESS_DENIED', 'response errors are surfaced');
  assert(timers.size === 0, 'request timers cleaned up');

  // Exercise coordinator request races across all record collections and late SDK readiness.
  let onSelect, onReady, onMarker, authListener, view, mapRecords = empty(), mapContext, clears = 0, notices = 0, closes = 0, opened, focused;
  const pending = [], projectLoads = [];
  window.LinkMapAuth.current = { state: 'signed-in' };
  window.addEventListener = (_, callback) => { authListener = callback; };
  window.reportCloudKitError = () => { notices++; return { dismiss() {} }; };
  const map = {
    clearLocations() { clears++; mapRecords = empty(); },
    setRecords(records, context) { mapRecords = records; mapContext = context; },
    setPlaceSelectionHandler() {}, showAll() {}, focusLocation(location) { focused = location; },
  };
  new Function('loadProjects', 'loadProjectRecords', 'visibleLocations', 'initializeMap', 'createProjectSelector', 'createPlaceSearch', 'createPlaceDetails', 'createCoordinates', 'createRecordConsole', 'recordLabel', moduleSource('app/app.js'))(
    () => { const request = defer(); projectLoads.push(request); return request.promise; },
    project => { const request = defer(); pending.push({ project, ...request }); return request.promise; },
    geometry.visibleLocations,
    (ready, marker) => { onReady = ready; onMarker = marker; return map; },
    select => { onSelect = select; return { render(value) { view = value; } }; },
    () => ({ ready() {}, cancel() {} }), () => ({ show() {} }), () => ({ ready() {}, show() {} }),
    () => ({ open(kind, record) { opened = {kind,record}; }, close() { closes++; } }),
    record => record.name || `New ${record.type || 'Project'}`
  );
  assert(view.busy, 'project loading visible');
  projectLoads[0].resolve(projects); await flush();
  assert(view.selectedProject === projects[0] && pending.length === 1, 'first project selected');
  onSelect('p10');
  assert(view.selectedProject.id === 'p10' && !mapRecords.locations.length && clears >= 3, 'switch clears old data immediately');
  const location = locationsModule.locationFromRecord(record('new', { name: 'Front door', description: 'Accessible entry', latitude: 10, longitude: 20, region: {recordName:'r'}, layer:{recordName:'l'} }));
  const latest = {...empty(), locations:[location], regions:[{id:'r',type:'Region',name:'Building'}], layers:[{id:'l',type:'Layer',name:'Floor 1',level:1,regionID:'r'}]};
  pending[1].resolve(latest); await flush();
  pending[0].resolve({...empty(), locations:[{id:'stale'}]}); await flush();
  assert(mapRecords === latest && view.records === latest, 'late previous response cannot mix any project records');
  onReady();
  assert(mapRecords === latest, 'late map initialization displays current page data');
  onMarker(location);
  assert(opened.kind === 'Location' && opened.record === location && mapContext.locationAreaID === 'new', 'marker opens detail and saved Location area');
  assert(mapContext.layerID === 'l' && mapContext.regionID === 'r', 'Location inspection supplies native layer context');
  nodes['record-query'].value = 'accessible building'; nodes['record-query'].input();
  assert(nodes['record-results'].children.length === 1, 'project search matches native detail and Region context');
  nodes['record-results'].querySelector().click();
  assert(focused === location && opened.record === location, 'project search selection focuses Location and opens console');
  nodes['layer-select'].value = ''; nodes['layer-select'].change();
  assert(mapContext.layerID === null && mapContext.regionID === 'r', 'Map level preserves focused Region');
  nodes['map-show-all'].click();
  assert(mapContext.layerID === null && mapContext.regionID === null && mapContext.locationAreaID === null, 'Show all resets area and layer scope');
  onSelect('p2'); pending[2].resolve(empty()); await flush();
  assert(view.message.includes('0 Locations') && !mapRecords.locations.length, 'empty project clears markers and shows empty counts');
  onSelect('p10'); pending[3].reject(new Error('offline')); await flush();
  assert(notices === 1 && view.retryable && nodes['record-query'].disabled, 'collection failure shown with retry and no partial search');
  onSelect('p2');
  authListener({ detail: { state: 'signed-out' } });
  pending[4].resolve(latest); await flush();
  assert(view.signedOut && !view.selectedProject && !mapRecords.locations.length && closes >= 4, 'sign-out invalidates in-flight data and closes stale console');
  assert(nodes['record-query'].disabled && nodes['project-console'].disabled, 'signed-out project viewing controls disabled');
  authListener({ detail: { state: 'signed-in' } });
  projectLoads[1].resolve([]); await flush();
  assert(!view.projects.length && view.message.includes('No projects'), 'empty projects handled');
  authListener({ detail: { state: 'signed-in' } });
  projectLoads[2].reject(new Error('offline')); await flush();
  assert(notices === 2 && view.retryable, 'Project failure shown with retry');

  let selected;
  const selector = new Function(moduleSource('app/project-selector.js') + '\nreturn createProjectSelector;')()(id => { selected = id; }, () => {});
  const project = { id: 'a', name: '<b>Project</b>', databaseScope: 'shared' };
  selector.render({ projects: [project], selectedProject: project, message: 'Loading records…', busy: true });
  const choice = nodes['project-list'].querySelector();
  assert(choice.textContent === '<b>Project</b>' && choice.children[0].textContent === 'Shared', 'project names and sharing labels render as text');
  assert(choice.getAttribute('aria-current') === 'true' && !nodes['project-filter'].disabled, 'selected sidebar project communicated accessibly during loading');
  choice.click();
  assert(selected === 'a', 'sidebar reports selection identity to coordinator');
  nodes['project-filter'].value = 'missing'; nodes['project-filter'].input();
  assert(nodes['project-list'].children[0].textContent === 'No matching projects.', 'project filter explains no matches');
  selector.render({ projects: [], selectedProject: null, message: 'No projects' });
  assert(nodes['project-filter'].disabled, 'empty project filter disabled');
  print(`Passed ${checks} project query, coordinator, and sidebar assertions.`);
})().catch(error => { print(error.stack); quit(1); });
