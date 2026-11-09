import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../homepage.js', import.meta.url), 'utf8');
function setup({ reduced = false, supported = true } = {}) {
  const elements = [100, 1000, 1400].map(top => {
    const classes = new Set();
    return {
      classes,
      classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
      getBoundingClientRect: () => ({ top }),
      closest: () => classes.has('reveal-pending') ? elements.find(e => e.classes === classes) : null,
    };
  });
  const observed = new Set();
  let callback, motionChange, focus;
  class Observer {
    constructor(cb, options) { callback = cb; assert.equal(options.threshold, 0.2); }
    observe(element) { observed.add(element); }
    unobserve(element) { observed.delete(element); }
    disconnect() { observed.clear(); }
  }
  const window = { innerHeight: 800, matchMedia: () => ({ matches: reduced, addEventListener: (_, cb) => { motionChange = cb; } }) };
  if (supported) window.IntersectionObserver = Observer;
  runInNewContext(source, { window, IntersectionObserver: Observer, document: {
    querySelectorAll: () => elements, addEventListener: (_, cb) => { focus = cb; },
  } });
  return { elements, observed, enter: ratio => callback([{ target: elements[1], isIntersecting: true, intersectionRatio: ratio }]), reduce: () => motionChange({ matches: true }), focus: () => focus({ target: elements[2] }) };
}
for (const options of [{ reduced: true }, { supported: false }]) {
  const state = setup(options);
  assert.equal(state.observed.size, 0);
  assert(state.elements.every(e => e.classes.size === 0));
}
const state = setup();
assert.equal(state.elements[0].classes.size, 0, 'Already visible content stays visible');
assert.equal(state.observed.size, 2);
state.enter(0.1);
assert(state.elements[1].classes.has('reveal-pending'));
state.enter(0.2);
assert(!state.elements[1].classes.has('reveal-pending'));
assert(!state.observed.has(state.elements[1]), 'Revealed elements stop being observed');
state.focus();
assert(!state.elements[2].classes.has('reveal-pending'), 'Keyboard focus reveals content immediately');
const changed = setup();
changed.reduce();
assert.equal(changed.observed.size, 0);
assert(changed.elements.every(e => e.classes.size === 0));
console.log('Passed reveal threshold, one-time observation, focus, restored position, missing observer, and reduced-motion checks.');
