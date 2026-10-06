# Endsunset

A dependency-free GitHub Pages site with a homepage showcase and a simple Projects index. The homepage presents projects with a full-width product section, short description, brand mark, and direct website link. `/projects/` lists linked project icons and names in a spacious row that wraps as more projects are added. LinkMap is currently the only project, maintained as a child project in [`linkmap/`](linkmap/README.md) and served at `https://endsunset.github.io/linkmap/`.

## Edit and preview

Requires Python 3 with no additional packages:

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Commit the generated `index.html`, `projects/index.html`, and `search/index.html` alongside source changes. GitHub Pages publishes the repository directly. Content and navigation work without JavaScript.

## Add a project

1. Add an entry to `content/projects.json` with a unique lowercase, hyphen-separated `slug`, `name`, `summary`, HTTPS `website` URL, `image` path, and `image_alt` text.
2. Place its product mark in `assets/images/`.
3. Run `python3 scripts/build.py`.

Projects appear in both the homepage showcase and `/projects/` index in catalog order. LinkMap stays at `/linkmap/`.

## Shared structure

- `content/projects.json`: project descriptions, icons, and website links.
- `scripts/build.py`: homepage, Projects, and search rendering.
- `templates/page.html`: document shell and metadata.
- `partials/`: shared header and footer, included at build time.
- `assets/styles/`: responsive styles.
- `assets/images/`: project assets. `linkmap-brandmark.svg` preserves the original LinkMap three-bar mark as an SVG with a white icon background. Its bar proportions and rotation are preserved, with the original dark gray (`#202124`) and red (`#b4232c`) colors. The rotated artwork is centered within a square SVG viewport; the section background remains independent.
- `assets/scripts/navigation.js`: shared animated Projects and inline Search states,
  keyboard/touch interactions, and copyright year.
- `scripts/site_chrome.py`: shared rendering, also used by LinkMap generators.
- `assets/styles/site-chrome.css`: scoped domain chrome, independent of project styles.
- `assets/scripts/search.js`: local filtering of the generated site directory. Search queries stay in the browser.

Root-relative assets target deployment at `endsunset.github.io`. Existing redirect pages remain available.

## LinkMap child project

`linkmap/` belongs to this repository and uses the parent Git history and Pages
deployment. Keep its project instructions in `linkmap/AGENTS.md` and follow
[`linkmap/README.md`](linkmap/README.md) for its own generators and checks.
After changing shared chrome, refresh LinkMap from its directory with `python3 scripts/build-headers.py`, `python3 scripts/build-footers.py`, `python3 scripts/build-documentation.py`, and `python3 scripts/build-privacy.py`, then run the parent build to refresh search.

Publish this repository's `main` branch from `/ (root)` in GitHub Pages settings.
The root `.nojekyll` serves the checked-in static files directly, including
LinkMap's generated DocC assets. No separate LinkMap workflow or deployment is
required. Serve the parent root to preview both `/` and `/linkmap/` locally.
Run `python3 tests/linkmap-integration.py` to check both sites' local paths,
LinkMap's generated routes, and child repository metadata.

## Header interactions

The global header lives in `partials/header.html`, which includes
`partials/header-expansion.html` through `scripts/site_chrome.py`. The expansion
partial owns the mobile menu, Projects, LinkMap, and Search panels; project links
come from `content/projects.json`. Run `python3 scripts/build-headers.py` to
refresh the complete header on every page that uses it, including DocC pages,
without rebuilding page content. Both full page builds and this refresh use the
same renderer. Its styles live in
`assets/styles/components/header.css` and its state management in
`assets/scripts/navigation.js`. Projects, LinkMap, and Search use one shared expansion area. Projects and
LinkMap expand after 0.3 seconds of pointer hover, or immediately on keyboard
focus. Switching triggers keeps the area open until the pointer leaves the header
and expansion. Search keeps the navigation controls visible. An open expansion
blurs the page behind it. The fixed header reserves its normal layout space;
vertical touch drags on the navigation bar do not scroll the page. The header's
Projects and LinkMap links open their panels on the first click or tap when the
expansion is closed. If any expansion is already open, they navigate to
`/projects/` and `/linkmap/` respectively. Keyboard activation and modified clicks
retain normal link behaviour.
The header is 44px high on desktop and 48px on mobile, with a 980px content width
with Projects and LinkMap grouped beside the brand on the left and Search on the right.
On mobile, Search and a two-line menu button sit beside the brand. The menu opens
a full-height navigation panel with Projects and LinkMap buttons that open
their submenus. Page links appear within those submenus. Back returns to the main menu and the menu button
becomes Close. Search uses the same full-height expansion. Open mobile navigation
locks page scrolling, keeps keyboard focus inside the header, and closes with
the Close button, Escape, or when switching to desktop. Tapping elsewhere or
blurring a control does not dismiss mobile navigation. Without JavaScript, the direct header links
remain available.
Escape or leaving the header closes its active panel. Closed panels are inert
while CSS handles transitions; reduced motion disables them.

The search-symbol button opens an empty inline input without Cancel or a clear
button. Enter submits a native GET form to `/search/?q=...`. The results page uses
`assets/scripts/search.js` to read the query and filter its generated directory.
Its search bar has a clear button; every Enter submits the edited query as new
URL parameters. Empty queries show no results or empty-results message.
Run the shared generators after changes, then `python3 tests/linkmap-integration.py`,
the JavaScriptCore navigation tests, and `node tests/search.mjs`.
