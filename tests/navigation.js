// Run from repository root using JavaScriptCore: jsc tests/navigation.js
function assert(value, message) { if (!value) throw new Error(message); }
function element() {
  return { hidden: true, inert: true, dataset: {}, events: {}, attrs: {}, value: '',
    addEventListener(name, fn) { this.events[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus() { document.activeElement = this; this.onFocus?.(); } };
}
const header = element(), controls = element(), searchToggle = element(), searchPanel = element(), searchInput = element();
const menus = ['projects', 'linkmap'].map(name => {
  const group = element(), trigger = element(), panel = element(), link = element();
  group.contains = target => [group, trigger, panel, link].includes(target);
  group.querySelector = selector => selector === 'a, button' ? trigger : panel;
  panel.querySelector = () => link;
  return {name, group, trigger, panel, link};
});
header.querySelector = selector => ({'.endsunset-controls': controls, '.endsunset-search-toggle': searchToggle,
  '.endsunset-search-panel': searchPanel, ...Object.fromEntries(menus.map(menu => ['.endsunset-' + menu.name, menu.group]))})[selector];
searchPanel.querySelector = () => searchInput;
searchPanel.contains = target => [searchPanel, searchInput].includes(target);
header.contains = target => [header, controls, searchToggle].includes(target) || menus.some(menu => menu.group.contains(target)) || searchPanel.contains(target);
const hover = { matches: true, addEventListener(name, fn) { this.change = fn; } };
let pending;
const window = { matchMedia() { return hover; } };
const document = { events: {}, querySelectorAll() { return []; }, querySelector() { return header; }, addEventListener(name, fn) { this.events[name] = fn; } };
function setTimeout(fn) { pending = fn; return 1; }
function clearTimeout() { pending = null; }
function key(key, target) { return {key, target, prevented: false, preventDefault() { this.prevented = true; }}; }
function click(detail = 1) { return {detail, prevented: false, preventDefault() { this.prevented = true; }}; }
load('assets/scripts/navigation.js');
menus.forEach(menu => { menu.trigger.onFocus = () => menu.group.events.focusin(); });
const state = () => header.dataset.navState;
assert(state() === 'closed' && menus.every(menu => menu.panel.inert), 'Starts closed');
for (const menu of menus) {
  assert(!menu.panel.hidden, 'Panels stay rendered for CSS transitions');
  menu.group.events.pointerenter({pointerType: 'mouse'});
  assert(state() === menu.name && !menu.panel.inert && menu.trigger.attrs['aria-expanded'] === 'true', 'Hover opens ' + menu.name);
  menu.group.events.pointerleave(); assert(pending, 'Boundary close delay');
  menu.panel.events.pointerenter({pointerType: 'mouse'}); assert(!pending && state() === menu.name, 'Panel entry cancels close');
  menu.group.events.pointerleave(); pending(); assert(state() === 'closed', 'Pointer exit closes');
  document.events.keydown(key('Tab')); menu.trigger.focus();
  assert(state() === menu.name, 'Keyboard focus opens');
  menu.group.events.pointerleave(); assert(!pending, 'Keyboard focus preserves menu');
  const arrow = key('ArrowDown', menu.trigger); menu.group.events.keydown(arrow);
  assert(arrow.prevented && document.activeElement === menu.link, 'ArrowDown enters panel');
  const escape = key('Escape'); document.events.keydown(escape);
  assert(escape.prevented && state() === 'closed' && document.activeElement === menu.trigger, 'Escape restores trigger without reopening');
  document.activeElement = {};
}
const projects = menus[0], linkmap = menus[1];
const mouseClick = click(); projects.trigger.events.click(mouseClick);
assert(!mouseClick.prevented && state() === 'closed', 'Projects mouse click follows normal link');
hover.matches = false; document.events.pointerdown({pointerType: 'touch'}); projects.trigger.focus();
assert(state() === 'closed', 'Touch focus does not open before tap');
const firstTap = click(); projects.trigger.events.click(firstTap);
assert(firstTap.prevented && state() === 'projects', 'First Projects touch expands');
projects.group.events.pointerleave(); assert(!pending && state() === 'projects', 'Touch exit does not auto-close');
const secondTap = click(); projects.trigger.events.click(secondTap);
assert(!secondTap.prevented, 'Second Projects tap follows link');
document.activeElement = {}; document.events.click({target: {}});
const keyboardClick = click(0); projects.trigger.events.click(keyboardClick);
assert(!keyboardClick.prevented, 'Keyboard activation always follows Projects link');
linkmap.trigger.focus(); linkmap.trigger.events.click(click()); assert(state() === 'linkmap', 'LinkMap touch button opens');
linkmap.trigger.events.click(click()); assert(state() === 'closed', 'LinkMap touch button closes');
hover.matches = true; projects.group.events.pointerenter({pointerType: 'mouse'});
linkmap.group.events.pointerenter({pointerType: 'mouse'}); assert(state() === 'linkmap' && projects.panel.inert, 'Hover switches panels');
linkmap.group.events.focusout({relatedTarget: {}}); assert(state() === 'closed', 'Leaving focus closes panel');
linkmap.group.events.pointerenter({pointerType: 'mouse'}); hover.change(); assert(state() === 'closed', 'Input mode changes close menu');
print('Passed both menus: hover, boundary crossing, keyboard, mobile taps, panel switching, and normal Projects navigation.');

projects.group.events.pointerenter({pointerType: 'mouse'}); projects.group.events.pointerleave();
searchToggle.events.click();
assert(state() === 'search' && !pending && menus.every(menu => menu.panel.inert), 'Search replaces menus and cancels their timer');
assert(document.activeElement === searchInput && controls.inert && !searchPanel.inert, 'Search focuses input and hides normal controls');
linkmap.group.events.pointerenter({pointerType: 'mouse'}); assert(state() === 'search', 'Menu hover does not replace search');
const escape = key('Escape'); document.events.keydown(escape);
assert(escape.prevented && state() === 'closed' && document.activeElement === searchToggle && !controls.inert, 'Escape restores Search focus');
searchToggle.events.click(); searchPanel.events.focusout({relatedTarget: {}}); assert(state() === 'closed', 'Tabbing out closes search');
searchToggle.events.click(); const outside = element(); outside.focus(); document.events.click({target: outside});
assert(state() === 'closed' && document.activeElement === outside, 'Outside click respects new focus');
searchToggle.events.click(); document.events.click({target: {}});
assert(state() === 'closed' && document.activeElement === searchToggle, 'Outside nonfocusable click restores Search focus');
const css = readFile('assets/styles/components/header.css');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('transition: none'), 'Reduced motion disables transitions');
assert(css.includes('visibility 0s 280ms') && css.includes('pointer-events: none'), 'Exit transitions retain panels until hidden');
print('Passed icon Search opening, focus, Escape, outside dismissal, and reduced-motion checks.');
