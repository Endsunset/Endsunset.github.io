// Run with JavaScriptCore: jsc tests/error-notifications.js
let checks = 0;
function assert(ok, message) { if (!ok) throw new Error(message); checks++; }
const fixtures = [{"BadRequest": "The service returned a bad request response when initializing.", "MalformedResponse": "The service returned a malformed response when initializing.", "NetworkError": "MapKit JS encountered a network error during initialization.", "Timeout": "The service timed out when initializing.", "TooManyRequests": "The Maps ID for the authorization token provided exceeded its allowed daily usage.", "Unauthorized": "The provided authorization token is invalid.", "Unknown": "MapKit JS encountered an unknown error during initialization."}, {"ACCESS_DENIED": "You don’t have permission to access the endpoint, record, zone, or database.", "ATOMIC_ERROR": "An atomic batch operation failed.", "AUTH_PERSIST_ERROR": "The authentication state could not be persisted.", "AUTHENTICATION_FAILED": "Authentication was rejected.", "AUTHENTICATION_REQUIRED": "The request requires authentication but none was provided.", "BAD_REQUEST": "The request was not valid.", "CONFIGURATION_ERROR": "CloudKit JS configuration error.", "CONFLICT": "The recordChangeTag value expired. (Retry the request with the latest tag.)", "EXISTS": "The resource that you attempted to create already exists.", "INTERNAL_ERROR": "An internal error occurred.", "INVALID_ARGUMENTS": "The parameters you provided for this method are invalid.", "NETWORK_ERROR": "A network error occurred.", "NOT_FOUND": "The resource was not found.", "QUOTA_EXCEEDED": "If accessing the public database, you exceeded the app’s quota. If accessing the private database, you exceeded the user’s iCloud quota.", "SERVICE_UNAVAILABLE": "The CloudKit service could not be reached.", "SHARE_UI_TIMEOUT": "The share UI failed to load and timed out.", "SIGN_IN_FAILED": "The user failed to sign in.", "THROTTLED": "The request was throttled. Try the request again later.", "TRY_AGAIN_LATER": "An internal error occurred. Try the request again.", "UNEXPECTED_SERVER_RESPONSE": "CloudKit JS was not able to decode the server response.", "UNIQUE_FIELD_ERROR": "The server rejected the request because there was a conflict with a unique field.", "UNKNOWN_ERROR": "An unknown error occurred.", "VALIDATING_REFERENCE_ERROR": "The request violates a validating reference constraint.", "ZONE_NOT_FOUND": "The zone specified in the request was not found."}];
const logs = [];
globalThis.console = { error(...args) { logs.push(args); } };
let last, dismissed = 0, reloaded = 0;
globalThis.window = { showErrorNotification(options) { last = options; return { dismiss() { dismissed++; } }; }, location: { reload() { reloaded++; } } };
eval(readFile('shared/errors/mapkit-errors.js'));
eval(readFile('shared/errors/cloudkit-errors.js'));
for (const [code, message] of Object.entries(fixtures[0])) {
  for (const status of [code, code.replace(/([a-z])([A-Z])/g, '$1 $2')]) {
    window.reportMapKitError({ status });
    assert(last.code === code && last.message === message, 'MapKit ' + status);
  }
}
for (const [code, message] of Object.entries(fixtures[1])) {
  const error = { ckErrorCode: code, reason: 'technical details', retryAfter: 30 };
  if (code === 'AUTH_PERSIST_ERROR') delete error.reason;
  window.reportCloudKitError(error);
  assert(last.code === code && last.message === message, 'CloudKit ' + code);
  assert(logs.at(-1)[1] === error, 'original error logged');
}
for (const error of [null, {}, new Error('internal'), { ckErrorCode: 'NEW_CODE' }]) {
  window.reportCloudKitError(error);
  assert(last.code === 'UNKNOWN_ERROR', 'CloudKit fallback');
  window.reportMapKitError(error);
  assert(last.code === 'Unknown', 'MapKit fallback');
}
window.reportCloudKitError({ serverErrorCode: 'THROTTLED' });
assert(last.code === 'THROTTLED', 'server fallback');
window.reportCloudKitError({ ckErrorCode: 'AUTH_PERSIST_ERROR', reason: 'Browser storage is unavailable.' });
assert(last.message === 'Browser storage is unavailable.', 'useful persistence reason');
window.reportCloudKitError({ ckErrorCode: 'AUTH_PERSIST_ERROR', reason: { secret: true } });
assert(last.message === fixtures[1].AUTH_PERSIST_ERROR, 'no raw objects');
last.onRetry();
assert(reloaded === 1, 'missing SDK retry reloads');
// Minimal DOM checks exercise safe text rendering, host reuse and owned dismissal.
const nodes = [];
function element() { return { children: [], dataset: {}, setAttribute() {}, addEventListener(type, fn) { this[type] = fn; }, append(...items) { this.children.push(...items); }, remove() { this.removed = true; } }; }
globalThis.document = { createElement() { const node = element(); nodes.push(node); return node; }, querySelector(selector) { return selector === '.error-notifications' ? nodes.find(n => n.className === 'error-notifications') : null; }, body: element() };
eval(readFile('components/notification/notification.js'));
const handle = window.showErrorNotification({ title: 'Test', code: 'ERROR', message: '<img onerror=bad>' });
assert(nodes[1].textContent === 'Test: ERROR: <img onerror=bad>', 'message rendered as text');
nodes[2].click();
assert(reloaded === 2, 'default retry reloads');
window.showErrorNotification({ message: 'Second' });
assert(document.body.children.length === 1, 'single shared host');
handle.dismiss();
assert(nodes[0].removed && !nodes[4].removed, 'dismiss only owned notice');
print(`Passed ${checks} error notification assertions.`);
const mapEvents = {}, locationEvents = {};
let timer, script, reports = [];
const loading = { hidden: false };
window.setTimeout = fn => { timer = fn; return 1; };
window.clearTimeout = () => {};
window.reportMapKitError = error => { reports.push(error); };
document.getElementById = () => loading;
document.head = { append(value) { script = value; } };
globalThis.getComputedStyle = () => ({ getPropertyValue() { return '#b4232c'; } });
window.mapkit = { addEventListener(type, fn) { mapEvents[type] = fn; }, FeatureVisibility: { Visible: 1 }, Map: class { addEventListener(type, fn) { locationEvents[type] = fn; } } };
eval(readFile('app/map.js').replace('export function', 'function') + '\ninitializeMap(() => {});');
window.initMapKit();
assert(loading.hidden && reports.length === 0, 'successful map stays clear');
for (const type of ['error', 'load-error']) {
  const event = { status: 'Unauthorized', type };
  mapEvents[type](event);
  assert(reports.at(-1) === event, type + ' original event forwarded');
}
const locationError = { code: 1 };
locationEvents['user-location-error'](locationError);
assert(reports.at(-1) === locationError, 'location error forwarded');
script.error({ type: 'error' });
assert(reports.at(-1).type === 'error', 'SDK load failure forwarded');
timer();
assert(reports.at(-1).status === 'Timeout', 'watchdog timeout forwarded');
window.mapkit.Map = class { constructor() { throw new Error('map construction failed'); } };
window.initMapKit();
assert(reports.at(-1).message === 'map construction failed', 'constructor failure forwarded');
print(`Passed ${checks} total error and MapKit assertions.`);
