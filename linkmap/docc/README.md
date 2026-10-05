# LinkMap documentation library

`LinkMap.docc` is the single authored Swift-DocC catalog. Its root page curates
Essentials, Concepts, Platforms, Collaboration, and Services, in that order.
Essentials contains How LinkMap Works and Basic Workflow. Concepts directly
curates the existing Project, Map, and work-planning guides. Platforms contains
the iOS and web guides; Collaboration contains Sharing. Services explains how
LinkMap uses iCloud and map providers in user-facing language. The Maps
guide retains the `Apple-Maps.md` filename and `/documentation/apple-maps/` route
so existing links continue to work.
There is no Essentials wrapper article. Each article has one curated parent;
use inline links for related concepts rather than duplicating navigator entries.
Keep each child in a parent's `## Topics` section; folders
and filenames alone do not define the visible navigator hierarchy.

Write for people using LinkMap. Use the read-only native repository at
`/Library/Developer/Projects/LinkMap-core` to check iOS behavior and this
website project to check web behavior. Keep platform distinctions on the
platform pages and task instructions in their curated sections. Do not publish
implementation details, developer reference, Shared Concepts, or Inventory and
Transaction guidance in this booklet.

Run `python3 scripts/build-documentation.py` from the `linkmap/` directory. It
builds the catalog with warnings treated as errors and the `/linkmap` hosting
base path, then checks in the static output. The landing article is served
directly at `/linkmap/documentation/`, with topics beneath it.
Former `/linkmap/documentation/ios/` and `/linkmap/documentation/web/` roots redirect to their
getting-started articles, as do the former platform guide subpages. The former
Essentials wrapper redirects to How LinkMap Works, and `/linkmap/docs/` still leads to
the library for the native app.
DocC's shared static assets live at the `linkmap/` project root because DocC's route
base is `/linkmap`.

Run `python3 tests/documentation.py` to validate the hierarchy, article output,
and local links. For visual verification, serve the parent repository root and open `http://localhost:8000/linkmap/documentation/`.
