# Endsunset

A dependency-free GitHub Pages site with a temporary homepage and a Projects catalogue that presents projects with a full-width product section, short description, brand mark, and direct website link. LinkMap is currently the only project, maintained as a child project in [`LinkMap/`](LinkMap/README.md) and served at `https://endsunset.github.io/LinkMap/`.

## Edit and preview

Requires Python 3 with no additional packages:

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Commit the generated `index.html`, `projects/index.html`, `search/index.html`, and `forms/**/index.html` alongside source changes. GitHub Pages publishes the repository directly. Content and navigation work without JavaScript.

## Add a project

1. Add an entry to `content/projects.json` with a unique lowercase, hyphen-separated `slug`, `name`, `summary`, HTTPS `website` URL, `image` path, and `image_alt` text.
2. Place its product mark in `assets/images/`.
3. Run `python3 scripts/build.py`.

Projects appear at `/projects/` in catalog order. LinkMap stays at `/LinkMap/`.

## Shared structure

- `content/projects.json`: project descriptions, icons, and website links.
- `scripts/build.py`: homepage, Projects, search, and Forms rendering.
- `templates/page.html`: document shell and metadata.
- `partials/`: shared header and footer, included at build time.
- `assets/styles/`: responsive styles.
- `assets/images/`: project assets. `linkmap-brandmark.svg` reproduces the header mark in the local `LinkMap/components/header.html` and `LinkMap/styles.css` as an SVG with a white icon background. Its bar proportions and rotation are preserved, with the original dark gray (`#202124`) and red (`#b4232c`) colors. The rotated artwork is centered within a square SVG viewport; the section background remains independent.
- `assets/scripts/navigation.js`: shared project-menu interactions and copyright year.
- `scripts/site_chrome.py`: shared rendering, also used by LinkMap generators.
- `assets/styles/site-chrome.css`: scoped domain chrome, independent of project styles.
- `assets/scripts/search.js`: local filtering of the generated site directory. Search queries stay in the browser.

Root-relative assets target deployment at `endsunset.github.io`. Existing redirect pages remain available.

## Add a form

1. Add an entry to `content/forms.json` with a unique lowercase, hyphen-separated `slug`, `name`, HTTPS `url`, and QR poster `image` path.
2. Place its QR poster in `forms/assets/`.
3. Run `python3 scripts/build.py` to regenerate the Forms homepage, sidebar rows, and individual form pages.

`forms/forms.css` matches the homepage palette. `forms/sidebar.js` adapts the LinkMap documentation sidebar with a scrolling list, fixed filter, desktop collapse, and full-screen mobile navigation. Form links and pages remain available without JavaScript. Forms open on Microsoft Forms in a new tab.

## LinkMap child project

`LinkMap/` belongs to this repository and uses the parent Git history and Pages
deployment. Keep its project instructions in `LinkMap/AGENTS.md` and follow
[`LinkMap/README.md`](LinkMap/README.md) for its own generators and checks.
After changing shared chrome, refresh LinkMap from its directory with `python3 scripts/build-headers.py`, `python3 scripts/build-footers.py`, `python3 scripts/build-documentation.py`, and `python3 scripts/build-privacy.py`, then run the parent build to refresh search. The old LinkMap component HTML, styles, and `header.js` remain as inactive source.

Publish this repository's `main` branch from `/ (root)` in GitHub Pages settings.
The root `.nojekyll` serves the checked-in static files directly, including
LinkMap's generated DocC assets. No separate LinkMap workflow or deployment is
required. Serve the parent root to preview both `/` and `/LinkMap/` locally.
Run `python3 tests/linkmap-integration.py` to check both sites' local paths,
LinkMap's generated routes, and child repository metadata.
