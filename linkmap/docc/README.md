# LinkMap user guide

`LinkMap.docc` is the single authored Swift-DocC catalog. Its root API collection
separates LinkMap for iOS and LinkMap for Web. The iOS collection curates Get
started, Projects and places, Plan and follow work, and Share and sync. The Web
page briefly explains that the Web App is still under development.

Keep one curated parent per article in `## Topics`; use inline links for related
reading. Keep existing filenames so published URLs remain stable. In particular,
Maps retains `Apple-Maps.md` and `/documentation/apple-maps/`.

Write for people using LinkMap: introduce the task, state any permission or
Activity-state requirement, then give numbered steps using the app's labels.
Use concise explanations, quiet system typography, and DocC's responsive layout,
in the spirit of Apple's user guides. Keep implementation details, developer
reference, Shared Concepts, and Inventory and Transaction guidance out.

Check iOS behavior against `/Library/Developer/Projects/LinkMap-core`. That
repository is read-only. All guide changes belong in this website repository.
Do not present unfinished Web App behavior as supported iOS instructions.

From `linkmap/`, run `PYTHONDONTWRITEBYTECODE=1 python3 scripts/build-documentation.py`.
The build treats warnings as errors and uses the `/linkmap` hosting base path.
Commit the generated static output with its source. The landing collection is
served at `/linkmap/documentation/`. Its source heading metadata supplies the
user-facing User Guide label on collection pages.

Preserve the former platform and introductory redirects, and `/linkmap/docs/`.
DocC's shared static assets live at the `linkmap/` root. Do not edit generated
HTML or JSON by hand.

Run `PYTHONDONTWRITEBYTECODE=1 python3 tests/documentation.py` and the parent
`tests/linkmap-integration.py`, then build again to check determinism. For visual
verification, serve the parent repository root and open
`http://localhost:8000/linkmap/documentation/` on wide and narrow viewports.
