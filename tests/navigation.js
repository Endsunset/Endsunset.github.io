// Run from repository root using JavaScriptCore: jsc tests/navigation.js
function assert(value, message) { if (!value) throw new Error(message); }
function element() {
  return { hidden: true, inert: true, dataset: {}, events: {}, attrs: {}, value: '',
    addEventListener(name, fn) { this.events[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus() { document.activeElement = this; this.onFocus?.(); } };
}
const toggle = element(), menu = element(), projects = element(), header = element();
const projectLink = element(), menuLink = element(), navControls = element();
const searchToggle = element(), searchPanel = element(), searchForm = element(), searchInput = element(), cancel = element();
projects.contains = target => [projects, projectLink, toggle, menu, menuLink].includes(target);
searchPanel.contains = target => [searchPanel, searchForm, searchInput, cancel].includes(target);
header.contains = target => [header, navControls, searchToggle].includes(target) || projects.contains(target) || searchPanel.contains(target);
projects.querySelector = () => projectLink;
menu.querySelector = () => menuLink;
searchPanel.querySelector = selector => ({form: searchForm, input: searchInput, '.endsunset-search-cancel': cancel})[selector];
header.querySelector = selector => ({'.endsunset-controls': navControls, '.endsunset-projects': projects,
  '.endsunset-projects-toggle': toggle, '.endsunset-project-menu': menu,
  '.endsunset-search-toggle': searchToggle, '.endsunset-search-panel': searchPanel})[selector];
const dispatched = [];
header.dispatchEvent = event => dispatched.push(event);
const hover = { matches: true, addEventListener(name, fn) { this.change = fn; } };
let pending;
const window = { matchMedia() { return hover; } };
let document = { events: {}, querySelectorAll() { return []; }, querySelector() { return header; }, addEventListener(name, fn) { this.events[name] = fn; } };
function setTimeout(fn) { pending = fn; return 1; }
function clearTimeout() { pending = null; }
class CustomEvent { constructor(type, options) { this.type = type; Object.assign(this, options); } }
function key(key, target) { return { key, target, prevented: false, preventDefault() { this.prevented = true; } }; }
load('assets/scripts/navigation.js');
projectLink.onFocus = toggle.onFocus = () => projects.events.focusin();
const state = () => header.dataset.navState;
assert(state() === 'closed' && menu.inert && searchPanel.inert, 'Enhancement starts closed');
assert(!menu.hidden && !searchPanel.hidden && !toggle.hidden && !searchToggle.hidden, 'Panels stay rendered for CSS transitions');
assert(!projectLink.events.click, 'Projects remains a normal clickable link');
projects.events.pointerenter({pointerType: 'mouse'});
assert(state() === 'projects' && !menu.inert && toggle.attrs['aria-expanded'] === 'true', 'Desktop hover opens menu');
projects.events.pointerleave(); assert(pending && state() === 'projects', 'Pointer exit waits briefly');
menu.events.pointerenter({pointerType: 'mouse'});
assert(!pending && state() === 'projects', 'Entering panel cancels boundary close');
projects.events.pointerleave(); pending();
assert(state() === 'closed' && menu.inert, 'Leaving trigger and panel closes menu');
document.events.keydown(key('Tab'));
projectLink.focus(); assert(state() === 'projects', 'Keyboard focus opens menu');
projects.events.pointerleave(); assert(!pending, 'Keyboard focus keeps menu open');
const arrow = key('ArrowDown', projectLink); projects.events.keydown(arrow);
assert(arrow.prevented && document.activeElement === menuLink, 'ArrowDown enters project links');
const escape = key('Escape'); document.events.keydown(escape);
assert(escape.prevented && state() === 'closed' && document.activeElement === projectLink, 'Escape restores link focus without reopening');
hover.matches = false;
document.events.pointerdown(); toggle.focus();
assert(state() === 'closed', 'Touch focus does not open before the tap handler');
projects.events.pointerenter({pointerType: 'touch'}); assert(state() === 'closed', 'Touch does not rely on hover');
toggle.events.click(); assert(state() === 'projects', 'Touch disclosure opens on the first tap');
projects.events.pointerleave(); assert(!pending && state() === 'projects', 'Touch pointer exit does not immediately dismiss the menu');
toggle.events.click(); assert(state() === 'closed', 'Touch disclosure closes on the next tap');
toggle.events.click(); document.activeElement = {}; document.events.click({target: {}});
assert(state() === 'closed', 'Outside click closes Projects');
toggle.events.click(); projects.events.focusout({relatedTarget: {}});
assert(state() === 'closed', 'Focus leaving Projects closes menu');
toggle.events.click(); hover.change(); assert(state() === 'closed', 'Input mode changes close Projects');
print('Passed Projects hover, boundary crossing, normal link, keyboard, touch, and dismissal checks.');

hover.matches = true; projects.events.pointerenter({pointerType: 'mouse'});
projects.events.pointerleave(); assert(pending, 'Pending hover dismissal');
searchToggle.events.click();
assert(state() === 'search' && !pending && menu.inert && !searchPanel.inert, 'Search replaces Projects and cancels its timer');
assert(document.activeElement === searchInput && navControls.inert, 'Search focuses input and removes normal controls from focus order');
projects.events.pointerenter({pointerType: 'mouse'}); assert(state() === 'search', 'Hover cannot replace active search');
searchPanel.events.focusout({relatedTarget: cancel}); assert(state() === 'search', 'Focus can move to Cancel');
let submits = 0;
searchForm.events.submit({preventDefault() { submits++; }});
assert(submits === 1 && dispatched.length === 0, 'Empty submission does not navigate or show results');
searchInput.value = '  LinkMap  ';
searchForm.events.submit({preventDefault() { submits++; }});
assert(submits === 2 && dispatched[0].type === 'endsunset-search' && dispatched[0].detail.query === 'LinkMap', 'Search has an event hook without navigation or results');
const searchEscape = key('Escape'); document.events.keydown(searchEscape);
assert(searchEscape.prevented && state() === 'closed' && document.activeElement === searchToggle && !navControls.inert, 'Escape restores Search control and normal navigation');
searchToggle.events.click(); cancel.events.click();
assert(state() === 'closed' && document.activeElement === searchToggle, 'Cancel restores Search focus');
searchToggle.events.click(); searchPanel.events.focusout({relatedTarget: {}});
assert(state() === 'closed', 'Tabbing beyond search closes it');
searchToggle.events.click(); const outside = element(); outside.focus(); document.events.click({target: outside});
assert(state() === 'closed' && document.activeElement === outside, 'Outside click respects newly focused controls');
searchToggle.events.click(); document.events.click({target: {}});
assert(state() === 'closed' && document.activeElement === searchToggle, 'Closing via a nonfocusable outside target restores focus');
const idleEscape = key('Escape'); document.events.keydown(idleEscape);
assert(!idleEscape.prevented, 'Closed navigation does not consume Escape');
const css = readFile('assets/styles/components/header.css');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('transition: none'), 'Reduced motion disables header transitions');
assert(css.includes('visibility 0s 280ms') && css.includes('pointer-events: none'), 'Closed panels can animate before visibility is removed');
print('Passed search focus, submission hook, Escape, Cancel, outside focus, transitions, and reduced-motion checks.');

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
