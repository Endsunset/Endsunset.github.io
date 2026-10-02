// Run from repository root with node tests/search.mjs.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync('assets/scripts/search.js', 'utf8');
for (const [query, count] of [['', 0], ['linkmap', 2], [' LINKMAP documentation ', 1], ['missing', 0], ['<script>alert(1)</script>', 0], ['地图 & places', 0]]) {
  const input = {value: '', events: {}, addEventListener(name, fn) {this.events[name] = fn;}, focus() {this.focused = true;}};
  const clear = {events: {}, addEventListener(name, fn) {this.events[name] = fn;}};
  const results = {}, status = {};
  const entries = ['LinkMap Plan places', 'How LinkMap Works LinkMap documentation', 'Projects Explore projects'].map(textContent => ({textContent}));
  const params = new URLSearchParams({q: query});
  const window = {location: {search: '?' + params}};
  const document = {
    getElementById(id) {return {'site-search': input, 'site-search-clear': clear, 'search-status': status}[id];},
    querySelector() {return results;}, querySelectorAll() {return entries;}
  };
  runInNewContext(source, {window, document, URLSearchParams});
  assert.equal(input.value, query);
  assert.equal(entries.filter(entry => !entry.hidden).length, count);
  assert.equal(results.hidden, !query.trim());
  assert.equal(status.textContent, !query.trim() ? '' : count ? `${count} result${count === 1 ? '' : 's'}` : 'No results. Try a project or documentation topic.');
  assert.equal(clear.hidden, !query);
  input.value = 'changed query'; input.events.input(); assert.equal(clear.hidden, false);
  clear.events.click(); assert.equal(input.value, ''); assert.equal(clear.hidden, true); assert.equal(input.focused, true);
}
const header = readFileSync('partials/header.html', 'utf8');
const searchPage = readFileSync('search/index.html', 'utf8');
for (const html of [header, searchPage]) {
  assert.match(html, /role="search"[^>]*action="\/search\/" method="get"/);
  assert.match(html, /name="q" type="search"|name="q"/);
}
assert.ok(!header.includes('endsunset-search-cancel'));
assert.ok(!header.includes('endsunset-projects-toggle'));
assert.match(searchPage, /id="site-search-clear" type="button" aria-label="Clear search"/);
// Native GET forms encode the current input on every Enter and replace old query parameters.
for (const query of ['LinkMap', 'new query & spaces', '地图']) {
  const target = new URL('/search/', 'https://endsunset.github.io');
  target.search = new URLSearchParams({q: query});
  assert.equal(target.pathname, '/search/');
  assert.equal(target.searchParams.get('q'), query);
  assert.equal([...target.searchParams].length, 1);
}
console.log('Passed URL-driven results, empty state, query encoding, repeated native GET submissions, and clear-button checks.');
