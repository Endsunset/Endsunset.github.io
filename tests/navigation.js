// Run from repository root using JavaScriptCore: jsc tests/navigation.js
function assert(value, message) { if (!value) throw new Error(message); }
function element() {
  return { hidden: true, inert: false, dataset: {}, events: {}, attrs: {}, value: '', scrollHeight: 180,
    style: { setProperty(name, value) { this[name] = value; } },
    addEventListener(name, fn) { this.events[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus() { document.activeElement = this; this.onFocus?.(); } };
}
const header = element(), expansion = element(), controls = element(), searchToggle = element(), searchPanel = element(), searchInput = element();
const menus = ['projects', 'linkmap'].map(name => {
  const group = element(), trigger = element(), panel = element(), link = element();
  group.contains = target => [group, trigger].includes(target);
  group.querySelector = () => trigger;
  panel.querySelector = () => link;
  panel.contains = target => [panel, link].includes(target);
  return {name, group, trigger, panel, link};
});
header.querySelector = selector => ({'.endsunset-expansion': expansion, '.endsunset-search-toggle': searchToggle,
  '.endsunset-search-panel': searchPanel, '.endsunset-project-menu': menus[0].panel, '.endsunset-linkmap-menu': menus[1].panel,
  ...Object.fromEntries(menus.map(menu => ['.endsunset-' + menu.name, menu.group]))})[selector];
searchPanel.querySelector = () => searchInput;
searchPanel.contains = target => [searchPanel, searchInput].includes(target);
header.contains = target => [header, expansion, controls, searchToggle].includes(target) || menus.some(menu => menu.group.contains(target) || menu.panel.contains(target)) || searchPanel.contains(target);
const hover = { matches: true, addEventListener(name, fn) { this.change = fn; } };
const window = { events: {}, matchMedia() { return hover; }, addEventListener(name, fn) { this.events[name] = fn; } };
const document = { events: {}, querySelectorAll() { return []; }, querySelector() { return header; }, addEventListener(name, fn) { this.events[name] = fn; } };
let now = 0, nextTimer = 0;
const timers = new Map();
function setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, {fn, at: now + delay}); return id; }
function clearTimeout(id) { timers.delete(id); }
function advance(ms) {
  now += ms;
  for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
}
function key(key, target) { return {key, target, prevented: false, preventDefault() { this.prevented = true; }}; }
function click(detail = 1) { return {detail, prevented: false, preventDefault() { this.prevented = true; }}; }
function enter(menu) { menu.group.events.pointerenter({pointerType: 'mouse'}); }
load('assets/scripts/navigation.js');
menus.forEach(menu => { menu.trigger.onFocus = () => menu.group.events.focusin(); });
const state = () => header.dataset.navState;
const [projects, linkmap] = menus;
assert(state() === 'closed' && expansion.inert && menus.every(menu => menu.panel.inert), 'Starts closed');
enter(projects); advance(299); assert(state() === 'closed', 'No expansion before 300ms');
advance(1); assert(state() === 'projects' && !expansion.inert, 'Projects opens after 300ms');
assert(expansion.style['--expansion-height'] === '180px', 'Shared area uses active content height');
projects.group.events.pointerleave(); enter(linkmap); advance(150); linkmap.group.events.pointerleave();
advance(300); assert(state() === 'projects', 'Brief hover does not change or dismiss open panel');
enter(linkmap); advance(299); assert(state() === 'projects', 'Switch also waits 300ms');
advance(1); assert(state() === 'linkmap' && projects.panel.inert, 'Switch within shared area');
linkmap.group.events.pointerleave(); advance(500); assert(state() === 'linkmap', 'Leaving trigger for panel keeps expansion open');
header.events.pointerleave(); advance(60); header.events.pointerenter(); advance(200);
assert(state() === 'linkmap', 'Boundary reentry cancels dismissal');
header.events.pointerleave(); advance(120); assert(state() === 'closed', 'Leaving entire header area dismisses');
for (const menu of menus) {
  document.events.keydown(key('Tab')); menu.trigger.focus();
  assert(state() === menu.name, 'Keyboard focus opens ' + menu.name);
  const arrow = key('ArrowDown', menu.trigger); menu.group.events.keydown(arrow);
  assert(arrow.prevented && document.activeElement === menu.link, 'ArrowDown enters panel');
  const escape = key('Escape'); document.events.keydown(escape);
  assert(escape.prevented && state() === 'closed' && document.activeElement === menu.trigger, 'Escape restores trigger without reopening');
  document.activeElement = {};
}
const mouseClick = click(); projects.trigger.events.click(mouseClick);
assert(!mouseClick.prevented, 'Projects mouse click follows normal link');
hover.matches = false; document.events.pointerdown({pointerType: 'touch'}); projects.trigger.focus();
assert(state() === 'closed', 'Touch focus waits for tap');
const firstTap = click(); projects.trigger.events.click(firstTap);
assert(firstTap.prevented && state() === 'projects', 'First Projects tap expands');
header.events.pointerleave(); advance(500); assert(state() === 'projects', 'Touch is independent of hover exit');
const secondTap = click(); projects.trigger.events.click(secondTap);
assert(!secondTap.prevented, 'Second Projects tap follows link');
const keyboardClick = click(0); projects.trigger.events.click(keyboardClick);
assert(!keyboardClick.prevented, 'Keyboard Projects activation follows link');
linkmap.trigger.events.click(click()); assert(state() === 'linkmap', 'LinkMap touch opens');
searchToggle.events.click();
assert(state() === 'search' && document.activeElement === searchInput && !searchPanel.inert, 'Search shares area and focuses input');
assert(!controls.inert && menus.every(menu => !menu.trigger.inert), 'Search keeps all navigation controls available');
hover.matches = true; enter(projects); advance(300);
assert(state() === 'projects' && document.activeElement === projects.trigger && searchPanel.inert, 'Hover can switch from Search without leaving focus in inactive panel');
searchToggle.events.click(); const escape = key('Escape'); document.events.keydown(escape);
assert(state() === 'closed' && document.activeElement === searchToggle && escape.prevented, 'Search Escape restores focus');
searchToggle.events.click(); header.events.focusout({relatedTarget: {}}); assert(state() === 'closed', 'Leaving focus dismisses');
searchToggle.events.click(); const outside = element(); outside.focus(); document.events.click({target: outside});
assert(state() === 'closed' && document.activeElement === outside, 'Outside click preserves new focus');
searchToggle.events.click(); document.events.click({target: {}});
assert(state() === 'closed' && document.activeElement === searchToggle, 'Nonfocusable outside click restores focus');
enter(linkmap); hover.change(); advance(300); assert(state() === 'closed', 'Input mode change cancels pending hover');
searchToggle.events.click(); searchPanel.scrollHeight = 240; window.events.resize();
assert(expansion.style['--expansion-height'] === '240px', 'Shared area updates on viewport resize');
const css = readFile('assets/styles/components/header.css');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('transition: none'), 'Reduced motion disables transitions');
assert(css.includes('backdrop-filter: blur(5px)') && css.includes('pointer-events: none'), 'Background blurs without intercepting outside interaction');
assert(css.includes('position: fixed; inset: 0 0 auto') && css.includes('touch-action: pan-x') && css.includes('.endsunset-header-spacer'), 'Header stays anchored with reserved layout space and protected touch navigation');
assert(!css.includes('[data-nav-state="search"] .endsunset-controls'), 'Search never hides controls');
print('Passed shared expansion: 300ms hover, rapid switching, boundary movement, keyboard, touch, Search focus, outside dismissal, resize, anchored header, blur and reduced motion.');
