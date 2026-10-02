// Run from the repository root with JavaScriptCore: jsc tests/cloudkit-auth.js
// No network or Apple credentials are used. SDK promises model session transitions.
const authSource = readFile('cloudkit-auth.js');
const uiSource = readFile('account/account.js');
let checks = 0;
function assert(value, message) {
  if (!value) throw new Error(message);
  checks++;
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function page(identity = null, controls = true, delayedSDK = false) {
  const listeners = {};
  const timers = new Map();
  let timer = 0;
  globalThis.setTimeout = fn => { timers.set(++timer, fn); return timer; };
  globalThis.clearTimeout = id => timers.delete(id);
  const elements = {};
  globalThis.document = { querySelector(selector) {
    if (!controls) return null;
    return elements[selector] ||= { dataset: {}, setAttribute() {}, addEventListener() {}, hidden: true };
  } };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  const win = globalThis.window = {
    LINKMAP_CLOUDKIT: { apiToken: 'test', containerIdentifier: 'iCloud.test', environment: 'production' },
    addEventListener(type, fn) { (listeners[type] ||= new Set()).add(fn); },
    removeEventListener(type, fn) { listeners[type]?.delete(fn); },
    dispatchEvent(event) { for (const fn of listeners[event.type] || []) fn(event); }
  };
  win.reportCloudKitError = error => { win.lastError = error; return { dismiss() {} }; };
  let signIn, signOut, failure = false, setups = 0, configurations = 0;
  const container = {
    setUpAuth() { setups++; return failure ? Promise.reject(new Error('offline')) : Promise.resolve(identity); },
    whenUserSignsIn() { return new Promise(resolve => { signIn = resolve; }); },
    whenUserSignsOut() { return new Promise(resolve => { signOut = resolve; }); },
    publicCloudDatabase: { fetchAllRecordZones() { return Promise.resolve({}); } }
  };
  const sdk = {
    configure(config) { configurations++; assert(config.containers[0].apiTokenAuth.persist, 'persistence retained'); },
    getDefaultContainer() { return container; }
  };
  if (!delayedSDK) win.CloudKit = sdk;
  eval(authSource);
  eval(uiSource);
  return { win, elements, timers,
    loadSDK() { win.CloudKit = sdk; win.dispatchEvent({ type: 'cloudkitloaded' }); },
    signIn(user) { identity = user; signIn(user); },
    signOut() { identity = null; signOut(); },
    fail(value) { failure = value; },
    get setups() { return setups; }, get configurations() { return configurations; }
  };
}
(async () => {
  const user = { nameComponents: { givenName: 'Test', familyName: 'User' } };
  let p = page(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'signed-out', 'signed-out startup');
  assert(!p.elements['[data-auth-controls]'].hidden && p.elements['[data-account]'].hidden, 'signed-out UI');
  for (let i = 0; i < 2; i++) {
    p.signIn(user); await flush();
    assert(p.win.LinkMapAuth.current.identity === user, 'identity published');
    assert(p.elements['[data-account]'].textContent === 'Test User', 'account UI on sign-in');
    p.signOut(); await flush();
    assert(p.win.LinkMapAuth.current.identity === null && p.elements['[data-account]'].textContent === '', 'sign-out clears identity and UI');
  }
  p.fail(true); await p.win.LinkMapAuth.retry(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'error' && !p.elements['[data-auth-retry]'].hidden, 'error retry UI');
  assert(p.win.lastError.message === 'offline', 'original failure reaches notification adapter');
  p.fail(false); await p.win.LinkMapAuth.retry(); await flush();
  p.win.dispatchEvent({ type: 'pageshow', persisted: true }); await flush();
  eval(authSource); await flush();
  assert(p.configurations === 1 && p.setups === 4, 'retry/history/duplicate script configure only once');
  // Independent documents model navigation, subpage reload, and return to account.
  for (const controls of [false, false, true]) {
    p = page(user, controls); await flush();
    assert(p.win.LinkMapAuth.current.state === 'signed-in' && p.setups === 1, 'persisted session restored on each page');
    eval(uiSource); // Late subscriber reads current state; absent DOM is safe.
    if (controls) assert(p.elements['[data-account]'].textContent === 'Test User', 'late UI consumes snapshot');
  }
  p = page(null, false, true);
  assert(p.win.LinkMapAuth.current.state === 'loading', 'wait for SDK');
  p.loadSDK(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'signed-out', 'delayed SDK initializes');
  p = page(null, false, true);
  for (const fn of [...p.timers.values()]) fn(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'error', 'missing SDK times out');
  p.loadSDK(); await p.win.LinkMapAuth.retry(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'signed-out', 'SDK timeout recovery');
  p.win.LINKMAP_CLOUDKIT = {}; await p.win.LinkMapAuth.retry();
  assert(p.win.LinkMapAuth.current.state === 'unavailable', 'invalid configuration');
  print(`Passed ${checks} authentication assertions.`);
})().catch(error => { print(error.stack); quit(1); });
