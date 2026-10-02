# Endsunset

A dependency-free GitHub Pages site with a temporary homepage and a Projects catalogue that presents projects with a full-width product section, short description, brand mark, and direct website link. LinkMap is currently the only project, maintained as a child project in [`linkmap/`](linkmap/README.md) and served at `https://endsunset.github.io/linkmap/`.

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

Projects appear at `/projects/` in catalog order. LinkMap stays at `/linkmap/`.

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

The global header lives in `partials/header.html`; its styles live in
`assets/styles/components/header.css` and its state management in
`assets/scripts/navigation.js`. Projects remains a normal `/projects/` link;
hover, keyboard focus, or the disclosure button opens its panel. Search opens
an empty inline input; Cancel and Escape close it and restore focus. Closed
panels are inert while CSS handles their entrance and exit transitions. Reduced
motion disables transitions.

Search does not navigate or render results yet. Submitting a nonempty query emits
a bubbling `endsunset-search` event from the header with `detail.query`, ready for
a future site-search handler. The existing `/search/` directory remains accessible
by its URL. Run the shared generators after changes, then
`python3 tests/linkmap-integration.py` and the JavaScriptCore navigation tests.
