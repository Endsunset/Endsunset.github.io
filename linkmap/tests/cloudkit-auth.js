// Run from the repository root with JavaScriptCore: jsc tests/cloudkit-auth.js
// No network or Apple credentials are used. SDK promises model session transitions.
const authSource = readFile('cloudkit-auth.js');
let checks = 0;
function assert(value, message) {
  if (!value) throw new Error(message);
  checks++;
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function page(identity = null, delayedSDK = false) {
  const listeners = {};
  const timers = new Map();
  let timer = 0;
  globalThis.setTimeout = fn => { timers.set(++timer, fn); return timer; };
  globalThis.clearTimeout = id => timers.delete(id);
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  const win = globalThis.window = {
    LINKMAP_CLOUDKIT: { apiToken: 'test', containerIdentifier: 'iCloud.test', environment: 'production' },
    addEventListener(type, fn) { (listeners[type] ||= new Set()).add(fn); },
    removeEventListener(type, fn) { listeners[type]?.delete(fn); },
    dispatchEvent(event) { for (const fn of listeners[event.type] || []) fn(event); }
  };
  win.reportCloudKitError = error => { win.lastError = error; return { dismiss() {} }; };
  const tokens = new Map();
  win.localStorage = { getItem: key => tokens.get(key) ?? null, setItem: (key, value) => tokens.set(key, value), removeItem: key => tokens.delete(key) };
  let authConfig;
  let signIn, signOut, failure = false, setups = 0, configurations = 0;
  const container = {
    setUpAuth() { setups++; return failure ? Promise.reject(new Error('offline')) : Promise.resolve(identity); },
    whenUserSignsIn() { return new Promise(resolve => { signIn = resolve; }); },
    whenUserSignsOut() { return new Promise(resolve => { signOut = resolve; }); },
    publicCloudDatabase: { fetchAllRecordZones() { return Promise.resolve({}); } }
  };
  const sdk = {
    configure(config) { authConfig = config; configurations++; assert(config.containers[0].apiTokenAuth.persist, 'persistence retained'); },
    getDefaultContainer() { return container; }
  };
  if (!delayedSDK) win.CloudKit = sdk;
  eval(authSource);
  return { win, timers, tokens, get authConfig() { return authConfig; },
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
  const store = p.authConfig.services.authTokenStore;
  assert(store.getToken('iCloud.test') === null, 'empty persisted token');
  store.putToken('iCloud.test', 'simulated-session');
  assert(p.tokens.get('linkmap.cloudkit.auth.production.iCloud.test') === 'simulated-session', 'existing persistence key retained');
  assert(store.getToken('iCloud.test') === 'simulated-session', 'persisted token readback');
  assert(store.getToken('iCloud.other') === null, 'container token isolation');
  store.putToken('iCloud.test', null);
  assert(store.getToken('iCloud.test') === null && p.tokens.size === 0, 'SDK sign-out removes persisted token');
  assert(p.authConfig.containers[0].apiTokenAuth.signInButton.id === 'apple-sign-in-button', 'sign-in SDK target retained');
  assert(p.authConfig.containers[0].apiTokenAuth.signOutButton.id === 'apple-sign-out-button', 'app sign-out SDK target retained');
  for (let i = 0; i < 2; i++) {
    p.signIn(user); await flush();
    assert(p.win.LinkMapAuth.current.identity === user, 'identity published');
    p.signOut(); await flush();
    assert(p.win.LinkMapAuth.current.identity === null && p.win.LinkMapAuth.current.state === 'signed-out', 'sign-out clears identity and state');
  }
  p.fail(true); await p.win.LinkMapAuth.retry(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'error', 'retry publishes error state');
  assert(p.win.lastError.message === 'offline', 'original failure reaches notification adapter');
  p.fail(false); await p.win.LinkMapAuth.retry(); await flush();
  p.win.dispatchEvent({ type: 'pageshow', persisted: true }); await flush();
  eval(authSource); await flush();
  assert(p.configurations === 1 && p.setups === 4, 'retry/history/duplicate script configure only once');
  // Independent documents model app reload and return from sign-in.
  for (let reload = 0; reload < 3; reload++) {
    p = page(user); await flush();
    assert(p.win.LinkMapAuth.current.state === 'signed-in' && p.setups === 1, 'persisted session restored on each page');
  }
  p = page(null, true);
  assert(p.win.LinkMapAuth.current.state === 'loading', 'wait for SDK');
  p.loadSDK(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'signed-out', 'delayed SDK initializes');
  p = page(null, true);
  for (const fn of [...p.timers.values()]) fn(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'error', 'missing SDK times out');
  p.loadSDK(); await p.win.LinkMapAuth.retry(); await flush();
  assert(p.win.LinkMapAuth.current.state === 'signed-out', 'SDK timeout recovery');
  p.win.LINKMAP_CLOUDKIT = {}; await p.win.LinkMapAuth.retry();
  assert(p.win.LinkMapAuth.current.state === 'unavailable', 'invalid configuration');
  print(`Passed ${checks} authentication assertions.`);
})().catch(error => { print(error.stack); quit(1); });
