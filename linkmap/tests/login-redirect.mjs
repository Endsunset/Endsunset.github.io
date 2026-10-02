// Run from linkmap with node tests/login-redirect.mjs. No Apple credentials needed.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
const signInSource = readFileSync('app/sign-in/sign-in.js', 'utf8');
const sessionSource = readFileSync('app/session.js', 'utf8');
const app = 'https://example.com/linkmap/app/';
for (const [redirect, expected] of [
  [null, app], ['', app], ['../', app],
  ['/linkmap/app/?view=all#sharing', `${app}?view=all#sharing`],
  ['../?view=all#sharing', `${app}?view=all#sharing`],
  ['/linkmap/app/index.html#map', `${app}index.html#map`],
  ['/linkmap/app/account/', `${app}account/`],
  ['../account/?view=session#status', `${app}account/?view=session#status`],
  ['/linkmap/', app], ['/linkmap/documentation/', app], ['/projects/', app],
  ['/linkmap/application/', app], ['https://other.example/linkmap/app/', app],
  ['//other.example/linkmap/app/', app], ['javascript:alert(1)', app], ['http://[', app],
  ['/linkmap/app/sign-in/', app], ['/linkmap/app/sign-in/index.html', app],
  ['/linkmap/app/sign-in/?redirect=/linkmap/app/', app],
  ['/linkmap/app/sign-in/nested/', app]
]) {
  for (const restored of [true, false]) {
    let result;
    const listeners = {};
    const href = `${app}sign-in/${redirect === null ? '' : '?redirect=' + encodeURIComponent(redirect)}`;
    const window = {
      location: { href, replace(value) { result = value; } },
      addEventListener(name, fn) { listeners[name] = fn; },
      LinkMapAuth: { current: { state: restored ? 'signed-in' : 'signed-out' } }
    };
    const elements = {};
    const document = { querySelector(selector) {
      return elements[selector] ||= { dataset: {}, setAttribute() {}, addEventListener() {} };
    } };
    runInNewContext(signInSource, { window, document, URL });
    if (!restored) {
      assert.equal(result, undefined);
      assert.equal(elements['[data-auth-controls]'].hidden, false);
      listeners['linkmap-auth']({ detail: { state: 'signed-in' } });
    }
    assert.equal(result, expected, `return from ${href}`);
  }
}
for (const state of ['loading', 'signed-in', 'signed-out', 'error', 'unavailable']) {
  const listeners = {}, clicks = {};
  const controls = {}, signIn = { addEventListener(name, fn) { clicks[name] = fn; } };
  const window = {
    location: new URL(`${app}?view=all#sharing`),
    LinkMapAuth: { current: { state } },
    addEventListener(name, fn) { listeners[name] = fn; }
  };
  const document = { querySelector() { return controls; }, getElementById() { return signIn; } };
  runInNewContext(sessionSource, { window, document, URL });
  assert.equal(controls.hidden, state !== 'signed-in');
  assert.equal(new URL(signIn.href).pathname, '/linkmap/app/sign-in/');
  assert.equal(new URL(signIn.href).searchParams.get('redirect'), '/linkmap/app/?view=all#sharing');
  listeners['linkmap-auth']({ detail: { state: 'signed-in' } });
  assert.equal(controls.hidden, false);
  listeners['linkmap-auth']({ detail: { state: 'signed-out' } });
  assert.equal(controls.hidden, true);
  window.location.hash = '#updated'; listeners.hashchange();
  assert.equal(new URL(signIn.href).searchParams.get('redirect'), '/linkmap/app/?view=all#updated');
  window.location.search = '?view=changed'; clicks.click();
  assert.equal(new URL(signIn.href).searchParams.get('redirect'), '/linkmap/app/?view=changed#updated');
}
console.log('Passed app-only sign-in returns, restored sessions, account visibility and sign-out UI, and contextual return links.');

const accountSource = readFileSync('app/account/account.js', 'utf8');
for (const restored of [false, true]) {
  const listeners = {}, elements = {}, events = {};
  let retries = 0;
  const user = { nameComponents: { givenName: 'Test', familyName: 'User' } };
  const window = {
    CloudKit: {},
    LinkMapAuth: { current: { state: restored ? 'signed-in' : 'signed-out', identity: restored ? user : null }, retry() { retries++; } },
    addEventListener(name, fn) { listeners[name] = fn; }
  };
  const document = { querySelector(selector) {
    return elements[selector] ||= { dataset: {}, setAttribute() {}, addEventListener(name, fn) { events[selector + name] = fn; } };
  } };
  runInNewContext(accountSource, { window, document });
  assert.equal(elements['[data-account]'].hidden, !restored);
  if (restored) assert.equal(elements['[data-account]'].textContent, 'Test User');
  listeners['linkmap-auth']({ detail: { state: 'signed-in', identity: user } });
  assert.equal(elements['[data-account]'].textContent, 'Test User');
  assert.equal(elements['[data-sign-in-link]'].hidden, true);
  assert.equal(elements['[data-auth-controls]'].hidden, false);
  listeners['linkmap-auth']({ detail: { state: 'signed-out', identity: null } });
  assert.equal(elements['[data-account]'].textContent, '');
  assert.equal(elements['[data-account]'].hidden, true);
  assert.equal(elements['[data-sign-in-link]'].hidden, false);
  listeners['linkmap-auth']({ detail: { state: 'error', identity: null } });
  assert.equal(elements['[data-auth-controls]'].hidden, true);
  assert.equal(elements['[data-auth-retry]'].hidden, false);
  events['[data-auth-retry]click']();
  assert.equal(retries, 1);
}
console.log('Passed account restoration, identity clearing, signed-out access, and retry checks.');
