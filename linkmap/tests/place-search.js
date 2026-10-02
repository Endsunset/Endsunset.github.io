// Run with JavaScriptCore: jsc tests/place-search.js
let checks = 0;
function assert(value, message) { if (!value) throw Error(message); checks++; }
function source(path) { return readFile(path).replace(/^export /gm, ''); }
function element() {
  return { value: '', disabled: true, hidden: true, children: [], handlers: {}, attrs: {},
    addEventListener(type, fn) { this.handlers[type] = fn; },
    fire(type, values = {}) { return this.handlers[type]?.({ preventDefault() {}, ...values }); },
    setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; },
    append(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
    querySelectorAll() { return this.children.map(row => row.children[0]); },
    querySelector() { return this.querySelectorAll()[0]; },
    focus() { document.activeElement = this; }, select() { this.selected = true; },
  };
}
const nodes = {};
globalThis.document = { getElementById(id) { return nodes[id] ||= element(); }, createElement: element };
let timer;
globalThis.setTimeout = fn => { timer = fn; return 1; };
globalThis.clearTimeout = () => { timer = null; };
globalThis.AbortController = class { constructor() { this.signal = {}; } abort() { this.signal.aborted = true; } };
const requests = [];
let notices = 0, destroyed = 0, cards = [];
globalThis.window = { reportMapKitError() { notices++; }, mapkit: {
  Search: class {
    autocomplete(query, options) { return this.search(query, options); }
    search(query, options) { return new Promise((resolve, reject) => requests.push({query, options, resolve, reject})); }
  },
  PlaceDetail: class { constructor(container, place, options) { cards.push({ place, options }); } destroy() { destroyed++; } },
} };
const coordinates = new Function(source('app/coordinates.js') + ';return {parseCoordinates, createCoordinates};')();
for (const value of ['0, 0', '-90, 180', '+90 -180', ' .5, -.25 ', '37.3349, -122.0090']) {
  assert(coordinates.parseCoordinates(value), 'valid pair: ' + value);
}
for (const value of ['', '1,', ',2', '91, 0', '0, -181', 'NaN, 2', '1,2,3', '1x,2', '0x10, 0', '(1,2)']) {
  assert(!coordinates.parseCoordinates(value), 'invalid pair: ' + value);
}
let selectedCoordinate, selectedPlace;
const coordinateUI = coordinates.createCoordinates(value => { selectedCoordinate = value; });
coordinateUI.ready();
const input = nodes['coordinate-input'];
input.value = '91, 2'; nodes['coordinate-form'].fire('submit');
assert(!selectedCoordinate && input.attrs['aria-invalid'] === 'true', 'invalid coordinate does not move map');
input.value = '0, 0'; input.fire('input'); nodes['coordinate-form'].fire('submit');
assert(selectedCoordinate.latitude === 0 && !nodes['coordinate-copy'].disabled, 'zero coordinate selectable');
const search = new Function(source('app/place-search.js') + ';return createPlaceSearch;')()(place => { selectedPlace = place; }, () => 'region');
const details = new Function(source('app/place-details.js') + ';return createPlaceDetails;')()();
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
(async () => {
  search.ready();
  nodes['place-query'].value = 'old'; nodes['place-query'].fire('input'); timer();
  nodes['place-query'].value = 'new'; nodes['place-query'].fire('input'); timer();
  assert(requests[0].options.signal.aborted, 'typing cancels previous request');
  requests[1].resolve({ results: [{displayLines: ['New place']}] }); await flush();
  requests[0].resolve({ results: [{displayLines: ['Stale place']}] }); await flush();
  assert(nodes['place-results'].querySelector().textContent === 'New place', 'stale suggestions discarded');
  nodes['place-results'].querySelector().fire('click');
  assert(requests[2].query.displayLines[0] === 'New place', 'suggestion object passed to search');
  const place = {name: '<b>Place</b>', coordinate: {latitude: 0, longitude: 0}, formattedAddress: 'Address'};
  requests[2].resolve({ places: [place, {coordinate: {latitude: 100, longitude: 1}}] }); await flush();
  assert(nodes['place-results'].children.length === 1, 'invalid result coordinates excluded');
  nodes['place-results'].querySelector().fire('click');
  assert(selectedPlace === place && nodes['place-results'].hidden, 'result selection returns full place and closes list');
  details.show(place); details.show({...place, name: 'Second'});
  assert(destroyed === 1 && cards.length === 2 && !cards[0].options.displaysMap, 'place card replaced without leaked instances');
  details.show(null);
  assert(destroyed === 2 && nodes['place-detail'].hidden, 'coordinate selection clears place card');
  nodes['place-query'].value = 'error'; nodes['place-search-form'].fire('submit');
  requests[3].reject(Error('offline')); await flush();
  assert(notices === 1 && nodes['search-status'].textContent.includes('Try'), 'search error supports retry');
  nodes['place-search-form'].fire('submit'); search.cancel();
  requests[4].resolve({places: [place]}); await flush();
  assert(nodes['place-results'].hidden, 'canceled search cannot replace coordinate selection');
  coordinateUI.show(place.coordinate);
  let copied;
  globalThis.navigator = {clipboard: {async writeText(text) { copied = text; }}};
  await nodes['coordinate-copy'].fire('click');
  assert(copied === '0, 0' && nodes['coordinate-status'].textContent === 'Coordinate copied.', 'copy uses displayed pair');
  navigator.clipboard.writeText = async () => { throw Error('denied'); };
  await nodes['coordinate-copy'].fire('click');
  assert(input.selected && nodes['coordinate-status'].textContent.includes('Copy unavailable'), 'clipboard denial gives manual fallback');
  print(`Passed ${checks} search, coordinate and detail assertions.`);
})().catch(error => { print(error.stack); quit(1); });
