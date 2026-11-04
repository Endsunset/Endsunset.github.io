// Run the SDK-double suites on Node: node tests/run.mjs [suite.js ...]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const suites = process.argv.slice(2);
if (!suites.length) suites.push('place-search.js', 'records.js', 'map-view.js', 'project-map.js', 'cloudkit-auth.js', 'error-notifications.js');
let failure;
process.on('unhandledRejection', error => { failure = error; });

for (const suite of suites) {
  const filename = resolve('tests', suite);
  console.log(`Running ${suite}`);
  try {
    const result = runInNewContext(readFileSync(filename, 'utf8'), {
      readFile: path => readFileSync(path, 'utf8'),
      print: (...values) => console.log(...values),
      quit(code = 0) { if (code) throw new Error(`${suite} exited with status ${code}`); },
      console, URL, setTimeout, clearTimeout, AbortController, atob, btoa,
    }, { filename });
    if (result?.then) await result;
    // Each suite uses immediate SDK promises; one event-loop turn drains their work.
    await new Promise(resolve => setImmediate(resolve));
    if (failure) throw failure;
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
    break;
  }
}

if (!process.exitCode && process.argv.length === 2) await import('./login-redirect.mjs');
