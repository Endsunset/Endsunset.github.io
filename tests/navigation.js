// Run from repository root using JavaScriptCore: jsc tests/navigation.js
function assert(value, message) { if (!value) throw new Error(message); }
function element() {
  return { hidden: true, events: {}, attrs: {}, addEventListener(name, fn) { this.events[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; }, focus() { document.activeElement = this; } };
}
const toggle = element(), menu = element(), projects = element(), header = element();
projects.contains = target => [projects, toggle, menu].includes(target);
header.querySelector = selector => ({'.endsunset-projects': projects, '.endsunset-projects-toggle': toggle, '.endsunset-project-menu': menu})[selector];
const hover = { matches: true, addEventListener(name, fn) { this.change = fn; } };
let pending;
const window = { matchMedia() { return hover; }, events: {}, addEventListener(name, fn) { this.events[name] = fn; } };
let document = { events: {}, querySelectorAll() { return []; }, querySelector() { return header; }, addEventListener(name, fn) { this.events[name] = fn; } };
function setTimeout(fn) { pending = fn; return 1; }
function clearTimeout() { pending = null; }
load('assets/scripts/navigation.js');
assert(!toggle.hidden && menu.hidden, 'Disclosure enhancement starts closed');
projects.events.pointerenter({pointerType: 'mouse'});
assert(!menu.hidden && toggle.attrs['aria-expanded'] === 'true', 'Desktop hover opens menu');
projects.events.pointerleave(); pending();
assert(menu.hidden, 'Leaving the menu closes it');
projects.events.pointerenter({pointerType: 'mouse'});
menu.focus(); document.events.keydown({key: 'Escape'});
assert(menu.hidden && document.activeElement === toggle, 'Escape closes and restores focus');
hover.matches = false;
projects.events.pointerenter({pointerType: 'touch'});
assert(menu.hidden, 'Touch does not depend on hover');
toggle.events.click(); assert(!menu.hidden, 'Touch disclosure opens');
toggle.events.click(); assert(menu.hidden, 'Touch disclosure closes');
toggle.events.click(); document.events.click({target: {}});
assert(menu.hidden, 'Outside click closes');
toggle.events.click(); projects.events.focusout({relatedTarget: {}});
assert(menu.hidden, 'Tabbing out closes');
toggle.events.click(); hover.change(); assert(menu.hidden, 'Changing input mode closes');
print('Passed desktop hover, touch disclosure, keyboard, dismissal, and input-mode checks.');

const input = element(), controls = element(), status = element();
input.value = '';
const entries = ['LinkMap Plan places routes supplies', 'How LinkMap Works LinkMap documentation', 'Projects Explore projects'].map(textContent => ({textContent, hidden: false}));
document = { getElementById(id) { return {'site-search': input, 'site-search-controls': controls, 'search-status': status}[id]; }, querySelectorAll() { return entries; } };
load('assets/scripts/search.js');
assert(!controls.hidden && status.textContent === '3 destinations', 'Search initializes directory');
input.value = ' LINKMAP documentation '; input.events.input();
assert(entries[0].hidden && !entries[1].hidden && entries[2].hidden, 'Search matches all terms without case sensitivity');
input.value = 'missing'; input.events.input(); assert(status.textContent.startsWith('No results'), 'Search reports no results');
input.value = ''; input.events.input(); assert(entries.every(entry => !entry.hidden), 'Clearing search restores links');
print('Passed search filtering, empty results, and reset checks.');
