# Endsunset

A dependency-free GitHub Pages homepage that presents projects with a full-width product section, short description, app icon, and direct website link. LinkMap is currently the only project, linking to `https://endsunset.github.io/LinkMap/`.

## Edit and preview

Requires Python 3 with no additional packages:

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Commit the generated `index.html` alongside source changes. GitHub Pages publishes the repository directly. Content and navigation work without JavaScript.

## Add a project

1. Add an entry to `content/projects.json` with a unique lowercase, hyphen-separated `slug`, `name`, `summary`, HTTPS `website` URL, `image` path, and `image_alt` text.
2. Place its product icon in `assets/images/`.
3. Run `python3 scripts/build.py`.

Projects appear directly on the homepage in catalog order. No separate project pages or directories are generated.

## Shared structure

- `content/projects.json`: project descriptions, icons, and website links.
- `scripts/build.py`: reusable homepage project rendering.
- `templates/page.html`: document shell and metadata.
- `partials/`: shared header and footer, included at build time.
- `assets/styles/`: responsive styles.
- `assets/images/`: project assets. `linkmap-icon.png` is the original 1024px app icon copied unchanged from `LinkMap-core/LinkMap/Assets.xcassets/AppIcon.appiconset/`.
- `assets/scripts/main.js`: current copyright year.

Root-relative assets target deployment at `endsunset.github.io`. Existing redirect pages remain available.
