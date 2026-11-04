// CloudKit schema and read-only collection loading, using the production models.
function source(path) {
  return readFile(path).replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
}
let checks = 0;
function assert(value, message) { if (!value) throw new Error(message); checks++; }
const record = (recordName, fields = {}, extra = {}) => ({ recordName, ...extra,
  fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value }])) });
const reference = recordName => ({ recordName });
const zoneID = { zoneName: 'projectZone-shared', ownerRecordName: 'other-owner' };
const project = { id: 'project-id', databaseScope: 'shared', zoneID };
const points = [{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 2 }, { latitude: 2, longitude: 0 }];
const encoded = btoa(JSON.stringify(points));
const fixture = {
  Location: [record('location-id', { name: ' Entrance ', description: 'Native description', detail: 'Wrong field',
    project: reference(project.id), region: reference('region-id'), layer: reference('layer-id'),
    latitude: 0, longitude: 0, vertices: encoded })],
  Region: [record('region-id', { name: '<b>Building</b>', project: reference(project.id) })],
  Layer: [record('layer-two', { name: 'Floor 2', level: 2, project: reference(project.id), region: reference('region-id') }),
    record('layer-id', { name: 'Basement', level: -1, project: reference(project.id), region: reference('region-id') })],
  Item: [record('item10', { name: 'Item 10', project: reference(project.id) }),
    record('item2', { name: 'Item 2', project: reference(project.id) })],
};
const requests = [];
let failType;
async function queryRecords(scope, zone, type, filterBy) {
  requests.push({ scope, zone, type, filterBy });
  if (type === failType) throw new Error('Unavailable collection');
  return fixture[type];
}
const locations = new Function('queryRecords', source('app/location.js') + '\nreturn { loadLocations, locationFromRecord, decodeVertices, referenceID };')(queryRecords);
const records = new Function('queryRecords', 'loadLocations', 'referenceID', source('app/records.js') + '\nreturn { loadProjectRecords, regionFromRecord, layerFromRecord, itemFromRecord };')(queryRecords, locations.loadLocations, locations.referenceID);

(async () => {
  const data = await records.loadProjectRecords(project);
  assert(requests.length === 4 && new Set(requests.map(request => request.type)).size === 4, 'all foundation record types are queried once');
  for (const request of requests) {
    assert(request.scope === 'shared' && request.zone === zoneID, request.type + ' retains shared database and zone owner');
    const filter = request.filterBy[0];
    assert(filter.fieldName === 'project' && filter.comparator === 'EQUALS' && filter.fieldValue.type === 'REFERENCE'
      && filter.fieldValue.value.recordName === project.id, request.type + ' uses direct project reference');
  }
  const location = data.locations[0];
  assert(location.name === 'Entrance' && location.detail === 'Native description', 'description is read from native schema, rather than legacy detail');
  assert(location.coordinate.latitude === 0 && location.coordinate.longitude === 0, 'explicit origin coordinate remains valid');
  assert(location.regionID === 'region-id' && location.layerID === 'layer-id' && location.projectID === project.id, 'relationships retain exact record identities');
  assert(location.vertices.length === 3 && location.vertices[1].longitude === 2, 'native base64 BYTES vertices decode');
  assert(location.record === fixture.Location[0], 'original record remains available without mutation');
  assert(data.regions[0].name === '<b>Building</b>', 'model preserves text for safe DOM rendering');
  assert(data.layers[0].level === -1 && data.layers[1].level === 2 && data.layers[0].regionID === 'region-id', 'layer levels and relationship are retained with native ordering');
  assert(data.items.map(item => item.id).join(',') === 'item2,item10', 'Item definitions sort naturally');
  assert(records.layerFromRecord(record('bad', { level: 2.5 })).level === 0, 'malformed level falls back to Map');
  assert(records.regionFromRecord(record('empty')).name === '', 'unnamed record allows native display fallback');
  assert(records.itemFromRecord(record('i', { name: 'Item' })).type === 'Item', 'Item stays a distinct catalog record');
  for (const fields of [{}, { latitude: '0', longitude: 0 }, { latitude: null, longitude: 0 },
    { latitude: Infinity, longitude: 0 }, { latitude: -91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
    assert(!locations.locationFromRecord(record('invalid', fields)).coordinate, 'invalid coordinate excluded');
  }
  for (const value of [undefined, '', 'not-base64', btoa('{}'), btoa('[{"latitude":999,"longitude":0}]'),
    btoa('[{"latitude":0,"longitude":0},null]')]) {
    assert(locations.decodeVertices(value).length === 0, 'damaged vertices do not create misleading polygon');
  }
  const bytes = Uint8Array.from(JSON.stringify(points), char => char.charCodeAt(0));
  assert(locations.decodeVertices(bytes).length === 3 && locations.decodeVertices(bytes.buffer).length === 3, 'binary payload forms are supported');
  failType = 'Layer';
  let failed = false;
  try { await records.loadProjectRecords(project); } catch { failed = true; }
  assert(failed, 'missing collection rejects whole project load instead of silently presenting partial data');
  print(`Passed ${checks} schema and project-record assertions.`);
})().catch(error => { print(error.stack); quit(1); });
