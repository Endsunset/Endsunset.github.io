# Contributing to LinkMap Web

This child project contains LinkMap’s public website and browser authentication flow,
served by GitHub Pages at [endsunset.github.io/LinkMap](https://endsunset.github.io/LinkMap/).
For product information, see the website.

## Working locally

Clone the parent repository and serve its root over HTTP:

```sh
git clone https://github.com/Endsunset/Endsunset.github.io.git
cd Endsunset.github.io
python3 -m http.server 8000
```

Open `http://localhost:8000/LinkMap/`. The website uses plain HTML, CSS, and JavaScript without package installation.
Documentation is generated from one checked-in DocC catalog.

Run LinkMap-specific generators and tests from `LinkMap/` (`cd LinkMap`);
the paths below are relative to that directory. These commands also work from
the parent root when prefixed with `LinkMap/`, except the JavaScript simulation
tests, which read fixtures relative to the working directory. Git commands use
the parent repository; `LinkMap/` has no separate Git metadata.

## Project map

| File | Responsibility |
| --- | --- |
| `index.html` | User-facing product content, navigation, and account controls |
| `components/header.html` | Shared header template for all pages |
| `scripts/site_header.py` | Header renderer used by page generators |
| `header.js` | Shared header authentication state |
| `styles.css` | Shared styles and responsive layouts |
| `cloudkit-auth.js` | Shared CloudKit initialization, session state, and error recovery |
| `account/account.js` | Account session UI and authentication retry |
| `login/login.js` | Sign-in UI and redirect to the account page |
| `cloudkit-config.js` | Public configuration for LinkMap’s existing CloudKit integration |
| `privacy-policy.md` | Privacy policy source; rendered to `privacy-policy/index.html` |
| `docc/LinkMap.docc/` | Authored LinkMap documentation library |
| `documentation/` | Checked-in DocC site and landing page |

Apple’s CloudKit JS SDK provides the sign-in and sign-out buttons and manages the
persisted session. The web map supports authenticated Project and Location viewing;
creation and planning remain in the native app. Keep website copy accurate about this boundary.

## Making a contribution

1. Check existing [issues](https://github.com/Endsunset/Endsunset.github.io/issues), or open one
   describing the problem. Discuss larger changes before implementation.
2. Create a branch from `main` and make a focused change. Keep unrelated formatting
   and refactoring out of the patch.
3. Preview your changes and complete the relevant checks below.
4. Open a pull request against `main`. Explain the problem, the resulting behavior,
   and how you verified it. Include desktop and mobile screenshots for visible changes
   and link any related issue.

Useful contributions include clearer product explanations, accessibility improvements,
responsive layout fixes, and authentication reliability. Native features and data
model changes belong in LinkMap-core; coordinate changes that affect both repositories.

## Implementation conventions

- Keep the main website simple; build documentation with Swift-DocC.
- Use semantic HTML, descriptive link labels, visible keyboard focus, and accessible
  status messages. Preserve the existing visual style across screen sizes.
- Use relative page links. Shared authentication scripts use stable `/LinkMap/` paths.
- Keep user-facing copy focused on what people can do and how their data is handled.
- Render account information as text and let Apple’s SDK handle authentication.
  Do not store user credentials or session tokens in application code.
- Use the existing CloudKit integration. Content and layout contributions do not
  require a new container or token. Coordinate configuration changes with the maintainer;
  never commit private keys or account credentials.

## Verification

For content and layout changes, check navigation, local asset loading, keyboard access,
and narrow and wide layouts. Run `git diff --check` before submitting.

For JavaScript changes, run `node --check account/account.js` and
`node --check cloudkit-config.js` and `node --check cloudkit-auth.js` if Node.js is available. Authentication changes
should cover signed-out startup, restored sessions, sign-in, sign-out, repeated
transitions, and SDK or network failures. Confirm account information clears on sign-out.

The dependency-free SDK simulation in `tests/cloudkit-auth.js` covers restoration,
transitions, retries, delayed SDK loading, and pages without account controls. On
macOS, run it from the `LinkMap/` directory with:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/cloudkit-auth.js
```

Local origins may not be authorized for live CloudKit authentication. A local sign-in
failure alone does not indicate a UI regression. Coordinate live authentication checks
with the maintainer on an authorized origin, and state any unverified behavior in the PR.

## Publishing

GitHub Pages serves the parent repository’s `main` branch from `/ (root)`.
LinkMap is published at `/LinkMap/` alongside the existing root website. The
parent root owns `.nojekyll` and deployment settings; keep LinkMap’s `.gitattributes`
scoped here for generated DocC JavaScript. Changes merged into the parent `main`
update both sites after the Pages deployment completes. Review product claims,
links, and authentication behavior before merging. The checked-in DocC output
is the published documentation artifact.

## Reporting a bug

Use [GitHub Issues](https://github.com/Endsunset/Endsunset.github.io/issues). Include the page URL,
browser and device, steps to reproduce, expected behavior, and actual behavior.
Remove personal account details and session tokens from screenshots or logs.

## Updating the documentation

The single `docc/LinkMap.docc` catalog builds a platform overview and curated
task sections for getting started, Projects and the Map, planning, and sharing. The native
LinkMap-core repository is the read-only source of truth for iOS behavior; the
website app is the source for web behavior. Follow
[documentation maintenance](docc/README.md), run
`python3 scripts/build-documentation.py`, and commit source and generated output
together. `/LinkMap/documentation/` enters the generated LinkMap library; former
platform roots redirect to their platform pages.

## Internal page URLs

Follow `AGENTS.md`: page hyperlinks use directory URLs such as `documentation/`
and `privacy-policy/`, backed by `index.html` files. Asset URLs
keep their extensions. Update the rendering scripts alongside generated pages.
Run `python3 scripts/build-privacy.py` after editing the policy source.

## Visual style

Follow [the style guide](guide/style.md) for colors, typography, component accents,
and accessibility. Shared CSS applies the white-surface and red-accent theme
to the homepage and privacy policy. DocC owns documentation navigation and layout;
`docc/doc-theme.css` supplies the guides' light appearance and red accent.

## Authentication and account

`login/` provides Apple’s sign-in button. `login/login.js` observes the shared
session and redirects restored or newly signed-in users to `../account/`.
`header.js` updates the shared account links and hides the homepage hero sign-in
action for a confirmed session. Signed-out links go directly to `login/`.
`cloudkit-auth.js` owns the shared CloudKit session lifecycle and persistence.

`account/` displays authentication status, account identity, Apple’s sign-out
control, and authentication retry. `account/account.js` renders this session UI
without initializing authentication or probing the public database. All pages
restore the same persisted session and refresh it when restored from browser history.

The browser token uses CloudKit’s postMessage callback. The SDK owns popup messages;
application code observes SDK-verified identity rather than window messages.

## Updating the shared header

Edit `components/header.html` and run `python3 scripts/build-headers.py` to refresh
all checked-in website pages. Commit the template and generated HTML together.
The privacy policy generator also uses `scripts/site_header.py`; DocC pages are
separate and skipped by the shared header and footer refresh scripts. Website
navigation is rendered as HTML and works without JavaScript. `header.js` reacts
to verified CloudKit session events on website pages.

Load the SDK, `/LinkMap/cloudkit-config.js`, and `/LinkMap/cloudkit-auth.js` on each
website page, with the configuration and auth scripts deferred in that order. The shared
script calls `setUpAuth()` at startup and on restoration from browser history.
UI scripts listen for `linkmap-auth` and read `window.LinkMapAuth.current` after
subscribing to catch an already published state. Its `{ state, identity }` snapshot
uses `loading`, `signed-in`, `signed-out`, `error`, or `unavailable`; identity is
cleared outside signed-in state. `LinkMapAuth.retry()` repeats session setup without
reconfiguring CloudKit.

The shared header stays at the top while scrolling, with a white blurred surface
and native link dragging disabled. `--header-height` in `styles.css` also controls
documentation sidebar offsets and anchor clearance.
