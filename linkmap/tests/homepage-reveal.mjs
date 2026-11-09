import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../homepage.js', import.meta.url), 'utf8');
function setup({ reduced = false, supported = true, width = 1200 } = {}) {
  let scroll = 0, callback, motionChange, focus, queued, resizeObserver;
  const events = {}, observed = new Set();
  function element(names = []) {
    const classes = new Set(names), attributes = {};
    return { classes, attributes, style: {},
      classList: { contains: n => classes.has(n), add: (...ns) => ns.forEach(n => classes.add(n)), remove: (...ns) => ns.forEach(n => classes.delete(n)), toggle: (n, on) => on ? classes.add(n) : classes.delete(n) },
      setAttribute(n, v) { attributes[n] = v; },
    };
  }
  const stops = [100, 1000, 2100].map((top, i) => {
    const stop = element(i === 0 ? ['story-heading'] : i === 1 ? ['story-row'] : ['story-row', 'story-row-reverse']);
    stop.getBoundingClientRect = () => ({ top: top - scroll, left: i === 1 ? 650 : 100, width: i === 0 ? 900 : 500 });
    stop.closest = () => stop;
    stop.querySelector = () => i ? stop : null;
    return stop;
  });
  const track = element(), progress = element(), nodes = { replaceChildren(...children) { this.children = children; } };
  // Deterministic monotonic arc model; browser geometry is a separate visual check.
  progress.getTotalLength = () => 4000;
  progress.getPointAtLength = length => ({ y: length });
  const svg = element();
  svg.querySelector = name => ({ '.journey-track': track, '.journey-progress': progress, '.journey-nodes': nodes })[name];
  const journey = element();
  journey.getBoundingClientRect = () => ({ top: -scroll, left: 0, width: window.innerWidth, height: 4000 });
  journey.querySelector = () => svg;
  journey.querySelectorAll = () => stops;
  journey.addEventListener = (_, cb) => { focus = cb; };
  class Observer {
    constructor(cb, opts) { callback = cb; assert.equal(opts.threshold, 0.2); }
    observe(e) { observed.add(e); }
    unobserve(e) { observed.delete(e); }
    disconnect() { observed.clear(); }
  }
  class Resize { constructor(cb) { resizeObserver = cb; } observe() {} }
  const motion = { matches: reduced, addEventListener: (_, cb) => { motionChange = cb; } };
  const window = { innerHeight: 800, innerWidth: width, matchMedia: () => motion,
    addEventListener: (name, cb) => { events[name] = cb; }, ResizeObserver: Resize };
  if (supported) window.IntersectionObserver = Observer;
  runInNewContext(source, { window, IntersectionObserver: Observer, ResizeObserver: Resize,
    requestAnimationFrame: cb => { queued = cb; return 1; },
    document: { querySelectorAll: () => [journey] } });
  const flush = () => { const cb = queued; queued = null; cb?.(); };
  return { stops, observed, progress, track, nodes, svg,
    enter: (index, ratio = .2) => { callback([{ target: stops[index], isIntersecting: true, intersectionRatio: ratio }]); flush(); },
    scroll: y => { scroll = y; events.scroll(); flush(); },
    resize: w => { window.innerWidth = w; resizeObserver(); flush(); },
    focus: () => focus({ target: { closest: () => stops[2] } }),
    reduce: () => { motion.matches = true; motionChange({ matches: true }); flush(); },
  };
}
for (const options of [{ reduced: true }, { supported: false }]) {
  const s = setup(options);
  assert.equal(s.observed.size, 0);
  assert(s.stops.every(e => !e.classes.has('journey-pending')));
  assert.equal(+s.progress.style.strokeDashoffset, 0, 'Fallback shows the entire route');
}
const s = setup();
assert.equal(s.stops[0].classes.has('journey-pending'), false);
assert.equal(s.observed.size, 2);
s.enter(1);
assert(s.stops[1].classes.has('journey-pending'), 'Text waits until the path reaches its node');
s.scroll(700);
assert(!s.stops[1].classes.has('journey-pending'));
assert(!s.observed.has(s.stops[1]), 'Each reveal is observed only once');
const drawn = +s.progress.style.strokeDashoffset;
s.scroll(0);
assert.equal(+s.progress.style.strokeDashoffset, drawn, 'Reverse scrolling never erases the route');
s.focus();
assert(!s.stops[2].classes.has('journey-pending'));
assert(!s.stops[2].classes.has('journey-ready'), 'Keyboard focus removes delays');
assert.equal(s.track.attributes.d, s.progress.attributes.d);
assert.equal((s.track.attributes.d.match(/M /g) || []).length, 1, 'No disconnected subpaths');
assert(s.track.attributes.d.startsWith('M 400 136'), 'Section starts one-third into its left-aligned heading');
assert(s.track.attributes.d.includes(' H '), 'Desktop crossings have truly horizontal runs');
assert(s.track.attributes.d.includes(' Q '), 'Turns use rounded corners');
assert(s.track.attributes.d.includes('983.3333333333333'), 'Right-column route is one-third from the right');
assert(s.track.attributes.d.includes('266.66666666666663'), 'Left-column route is one-third from the left');
s.resize(390);
assert(s.track.attributes.d.startsWith('M 18'));
assert(!s.track.attributes.d.includes(' H '), 'Mobile route stays vertical at the edge');
const changed = setup();
changed.reduce();
assert.equal(changed.observed.size, 0);
assert(changed.stops.every(e => !e.classes.has('journey-pending')));
assert.equal(+changed.progress.style.strokeDashoffset, 0);
console.log('Passed node-gated reveals, one-time observation, continuous geometry, reverse scroll, mobile resize, focus, observer fallback and reduced-motion checks.');
