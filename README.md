# Endsunset

A dependency-free GitHub Pages homepage that presents projects with a full-width product section, short description, brand mark, and direct website link. LinkMap is currently the only project, linking to `https://endsunset.github.io/LinkMap/`.

## Edit and preview

Requires Python 3 with no additional packages:

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Commit the generated `index.html` and `forms/**/index.html` alongside source changes. GitHub Pages publishes the repository directly. Content and navigation work without JavaScript.

## Add a project

1. Add an entry to `content/projects.json` with a unique lowercase, hyphen-separated `slug`, `name`, `summary`, HTTPS `website` URL, `image` path, and `image_alt` text.
2. Place its product mark in `assets/images/`.
3. Run `python3 scripts/build.py`.

Projects appear directly on the homepage in catalog order. No separate project pages or directories are generated.

## Shared structure

- `content/projects.json`: project descriptions, icons, and website links.
- `scripts/build.py`: reusable homepage project rendering.
- `templates/page.html`: document shell and metadata.
- `partials/`: shared header and footer, included at build time.
- `assets/styles/`: responsive styles.
- `assets/images/`: project assets. `linkmap-brandmark.svg` reproduces the header mark in the local `LinkMap/components/header.html` and `LinkMap/styles.css` as an SVG with a white icon background. Its bar proportions and rotation are preserved, with the original dark gray (`#202124`) and red (`#b4232c`) colors. The rotated artwork is centered within a square SVG viewport; the section background remains independent.
- `assets/scripts/main.js`: current copyright year.

Root-relative assets target deployment at `endsunset.github.io`. Existing redirect pages remain available.

## Add a form

1. Add an entry to `content/forms.json` with a unique lowercase, hyphen-separated `slug`, `name`, HTTPS `url`, and QR poster `image` path.
2. Place its QR poster in `forms/assets/`.
3. Run `python3 scripts/build.py` to regenerate the Forms homepage, sidebar rows, and individual form pages.

`forms/forms.css` matches the homepage palette. `forms/sidebar.js` adapts the LinkMap documentation sidebar with a scrolling list, fixed filter, desktop collapse, and full-screen mobile navigation. Form links and pages remain available without JavaScript. Forms open on Microsoft Forms in a new tab.
