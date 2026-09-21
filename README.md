# Endsunset

A dependency-free, product-focused website for GitHub Pages. Inspired by the spacious typography and stacked product presentations of Apple's homepage, with an independent sunset-inspired identity.

## Pages

- `/` — Endsunset introduction, project showcases, and about section.
- `/projects/` — project collection.
- `/projects/linkmap/` — LinkMap product page.
- `https://endsunset.github.io/LinkMap/` — LinkMap's separate website; this repository does not replace that application.

## Edit and preview

Requires Python 3, with no packages to install:

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Commit the generated HTML alongside source changes. GitHub Pages can publish the repository directly; no server-side code or deployment build is required. Pages include their content and navigation in HTML, so JavaScript is optional.

## Add a project

1. Add an entry to `content/projects.json`, using LinkMap as the example. Give it a unique lowercase, hyphen-separated `slug`, a website URL, product copy, illustration path and alt text, and `details` entries.
2. Place its illustration in `assets/images/`.
3. Run `python3 scripts/build.py`.

The project appears on the homepage and Projects index and gets a page at `/projects/<slug>/`. Catalog order determines showcase order. If removing or renaming a project, remove its old generated directory in `projects/` as well.

## Shared structure

- `content/projects.json`: project content and outbound URLs.
- `scripts/build.py`: reusable showcase and product page rendering.
- `templates/page.html`: document shell and metadata.
- `partials/`: shared header and footer, included at build time.
- `assets/styles/`: responsive design and shared component styles.
- `assets/images/`: original SVG artwork; LinkMap's map is an illustration, not an application screenshot.
- `assets/scripts/main.js`: progressive enhancement for the current year and active navigation.

Root-relative assets target deployment at `endsunset.github.io`. Existing redirect pages remain available.
