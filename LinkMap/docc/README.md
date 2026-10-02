# LinkMap documentation library

`LinkMap.docc` is the single authored Swift-DocC catalog. Its root page curates
Essentials, Start Here, Project and Map, Plan Work, and Collaborate, in that
order. Essentials directly contains How LinkMap Works and one getting-started
article each for web and iOS, including account access and available actions.
There is no Essentials wrapper article or Platforms section. The task sections
directly curate the existing iOS guides; Project and Map are separate pages.
Keep each child in a parent's `## Topics` section; folders
and filenames alone do not define the visible navigator hierarchy.

Write for people using LinkMap. Use the read-only native repository at
`/Library/Developer/Projects/LinkMap-core` to check iOS behavior and this
website project to check web behavior. Keep platform distinctions on the
platform pages and task instructions in their curated sections. Do not publish
implementation details, developer reference, Shared Concepts, or Inventory and
Transaction guidance in this booklet.

Run `python3 scripts/build-documentation.py` from the `LinkMap/` directory. It
builds the catalog with warnings treated as errors and the `/LinkMap` hosting
base path, then checks in the static output. The landing article is served
directly at `/LinkMap/documentation/`, with topics beneath it.
Former `/LinkMap/documentation/ios/` and `/LinkMap/documentation/web/` roots redirect to their
getting-started articles, as do the former platform guide subpages. The former
Essentials wrapper redirects to How LinkMap Works, and `/LinkMap/docs/` still leads to
the library for the native app.
DocC's shared static assets live at the `LinkMap/` project root because DocC's route
base is `/LinkMap`.

Run `python3 tests/documentation.py` to validate the hierarchy, article output,
and local links. For visual verification, serve the parent repository root and open `http://localhost:8000/LinkMap/documentation/`.
