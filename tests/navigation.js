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
const mobileToggle = element(), mobilePanel = element(), back = element();
const drilldowns = ['projects', 'linkmap'].map(name => {
  const button = element(); button.dataset.mobileMenu = name; return button;
});
mobilePanel.querySelector = selector => selector === 'button' ? drilldowns[0] : null;
mobilePanel.contains = target => [mobilePanel, ...drilldowns].includes(target);
const menus = ['projects', 'linkmap'].map(name => {
  const group = element(), trigger = element(), panel = element(), link = element();
  group.contains = target => [group, trigger].includes(target);
  group.querySelector = () => trigger;
  panel.querySelector = () => link;
  panel.contains = target => [panel, link].includes(target);
  return {name, group, trigger, panel, link};
});
header.querySelector = selector => ({'.endsunset-expansion': expansion, '.endsunset-search-toggle': searchToggle,
  '.endsunset-menu-toggle': mobileToggle, '.endsunset-mobile-menu': mobilePanel, '.endsunset-menu-back': back,
  ...Object.fromEntries(drilldowns.map(button => ['[data-mobile-menu="' + button.dataset.mobileMenu + '"]', button])),
  '.endsunset-search-panel': searchPanel, '.endsunset-project-menu': menus[0].panel, '.endsunset-linkmap-menu': menus[1].panel,
  ...Object.fromEntries(menus.map(menu => ['.endsunset-' + menu.name, menu.group]))})[selector];
searchPanel.querySelector = () => searchInput;
searchPanel.contains = target => [searchPanel, searchInput].includes(target);
header.contains = target => [header, expansion, controls, searchToggle, mobileToggle, back].includes(target) || mobilePanel.contains(target) || menus.some(menu => menu.group.contains(target) || menu.panel.contains(target)) || searchPanel.contains(target);
let focusable = [searchToggle, mobileToggle, ...drilldowns];
focusable.forEach(item => { item.closest = () => null; item.getClientRects = () => [1]; });
header.querySelectorAll = selector => selector === '[data-mobile-menu]' ? drilldowns : focusable;
const hover = { matches: true, addEventListener(name, fn) { this.change = fn; } };
const mobile = { matches: false, addEventListener(name, fn) { this.change = fn; } };
const classes = new Set();
const window = { events: {}, matchMedia(query) { return query.includes('max-width') ? mobile : hover; }, addEventListener(name, fn) { this.events[name] = fn; } };
const document = { documentElement: {classList: {toggle(name, active) { active ? classes.add(name) : classes.delete(name); }}}, events: {}, querySelectorAll() { return []; }, querySelector() { return header; }, addEventListener(name, fn) { this.events[name] = fn; } };
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
for (const pointerType of ['mouse', 'touch']) {
  hover.matches = pointerType === 'mouse';
  document.events.pointerdown({pointerType});
  for (const menu of menus) {
    header.events.focusout({relatedTarget: {}});
    menu.trigger.focus();
    assert(state() === 'closed', 'Pointer focus waits for first activation');
    const first = click(); menu.trigger.events.click(first);
    assert(first.prevented && state() === menu.name, pointerType + ' first activation opens ' + menu.name);
    const second = click(); menu.trigger.events.click(second);
    assert(!second.prevented, pointerType + ' second activation follows ' + menu.name + ' link');
    const other = menus.find(item => item !== menu);
    const switchClick = click(); other.trigger.events.click(switchClick);
    assert(!switchClick.prevented && state() === menu.name, 'Any open expansion allows navigation to ' + other.name);
  }
}
header.events.pointerleave(); advance(500); assert(state() === 'linkmap', 'Touch is independent of hover exit');
header.events.focusout({relatedTarget: {}});
for (const menu of menus) {
  const modified = click(); modified.metaKey = true; menu.trigger.events.click(modified);
  assert(!modified.prevented && state() === 'closed', 'Modified activation preserves normal link behaviour');
  const keyboardClick = click(0); menu.trigger.events.click(keyboardClick);
  assert(!keyboardClick.prevented, 'Keyboard activation follows normal link');
}
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
mobile.matches = true; hover.matches = false; mobile.change();
assert(state() === 'closed' && document.activeElement === mobileToggle, 'Switch to mobile closes desktop panel and restores visible focus');
mobileToggle.events.click();
assert(state() === 'menu' && !mobilePanel.inert && document.activeElement === drilldowns[0], 'Mobile menu opens and focuses Projects button');
assert(classes.has('endsunset-menu-open') && mobileToggle.attrs['aria-label'] === 'Close menu', 'Mobile overlay locks page scrolling and exposes Close');
header.events.focusout({relatedTarget: null});
assert(state() === 'menu', 'Mobile touch blur does not close the menu before the Close click');
document.events.click({target: {}});
assert(state() === 'menu' && classes.has('endsunset-menu-open'), 'Other mobile taps do not dismiss navigation');
mobileToggle.events.click();
assert(state() === 'closed' && expansion.inert && !classes.has('endsunset-menu-open'), 'Close dismisses menu after touch blur without reopening');
mobileToggle.events.click();
drilldowns[1].events.click();
assert(state() === 'linkmap' && !linkmap.panel.inert && !back.hidden && document.activeElement === back, 'Mobile LinkMap disclosure enters submenu with Back');
header.events.focusout({relatedTarget: null}); document.events.click({target: {}});
assert(state() === 'linkmap', 'Blur and other taps keep mobile submenu open');
mobileToggle.events.click();
assert(state() === 'closed' && expansion.inert && !classes.has('endsunset-menu-open'), 'Close dismisses mobile submenu');
mobileToggle.events.click(); drilldowns[1].events.click();
back.events.click();
assert(state() === 'menu' && document.activeElement === drilldowns[1] && back.hidden, 'Back returns to menu and originating disclosure');
drilldowns[0].events.click();
assert(state() === 'projects' && !projects.panel.inert, 'Mobile Projects disclosure enters submenu');
back.events.click();
focusable[focusable.length - 1].focus(); const tab = key('Tab'); document.events.keydown(tab);
assert(tab.prevented && document.activeElement === focusable[0], 'Mobile Tab wraps within open navigation');
const reverseTab = key('Tab'); reverseTab.shiftKey = true; document.events.keydown(reverseTab);
assert(reverseTab.prevented && document.activeElement === focusable[focusable.length - 1], 'Mobile Shift Tab wraps backwards');
const mobileEscape = key('Escape'); document.events.keydown(mobileEscape);
assert(state() === 'closed' && document.activeElement === mobileToggle && !classes.has('endsunset-menu-open'), 'Mobile Escape closes, unlocks scrolling, and restores focus');
searchToggle.events.click();
assert(state() === 'search' && document.activeElement === searchInput && classes.has('endsunset-menu-open'), 'Mobile Search opens focused overlay');
header.events.focusout({relatedTarget: null}); document.events.click({target: {}});
assert(state() === 'search', 'Input blur and other mobile taps do not dismiss Search');
mobileToggle.events.click();
assert(state() === 'closed' && document.activeElement === searchToggle && !classes.has('endsunset-menu-open'), 'Close button dismisses Search and restores Search focus');
mobileToggle.events.click(); mobile.matches = false; hover.matches = true; mobile.change();
assert(state() === 'closed' && document.activeElement === searchToggle && !classes.has('endsunset-menu-open'), 'Switch to desktop clears mobile overlay and scroll lock');
const css = readFile('assets/styles/components/header.css');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('transition: none'), 'Reduced motion disables transitions');
assert(css.includes('backdrop-filter: blur(5px)') && css.includes('pointer-events: none'), 'Background blurs without intercepting outside interaction');
assert(css.includes('position: fixed; inset: 0 0 auto') && css.includes('touch-action: pan-x') && css.includes('.endsunset-header-spacer'), 'Header stays anchored with reserved layout space and protected touch navigation');
assert(!css.includes('[data-nav-state="search"] .endsunset-controls'), 'Search never hides controls');
print('Passed desktop expansion and mobile menu, submenus, Back, Close, Search, focus wrapping, scroll lock, resize, and reduced motion.');
