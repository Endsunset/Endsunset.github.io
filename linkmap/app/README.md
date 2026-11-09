# Map viewing

`index.html` is the LinkMap web map. The native `Endsunset/LinkMap-core` repository
was inspected read-only: map content/view-model components, Location markers,
search, Location/Region/Layer/Item detail consoles, record models and CloudKit
conversion/query helpers. Changes belong to this web app only.

## Viewing behavior

- A persistent sidebar stacks LinkMap, Search and Project. The two buttons open one
  borderless, full-height desktop column over the map at a time; choosing the active button again closes that panel.
  Search opens by default on desktop. Mobile starts with both panels closed to
  leave the map visible, and choosing a Project closes its panel.
- The button beside LinkMap collapses navigation to the expand button and Search/Project
  icons, with Help available at the bottom. Expansion and collapse animate together
  with the adjacent columns (unless reduced motion is enabled). The map canvas fills
  the workspace; MapKit padding tracks the actual overlays, including mobile sheets.
  Those icons still open the same overlay panels; expanding restores the labels.
- The project sidebar lists private and accepted shared projects, with project-name
  search, active selection, Refresh map data, retry and sign-in states. Projects sort by creation
  date descending, then natural name. Shared discoveries replace duplicate IDs.
- Project, Locations, Regions, Layers and Items open a modeless detail panel beside
  the sidebar, over the map. At narrower desktop widths, details take the sidebar's
  space; on mobile they use a bottom sheet.
  Back returns through related records. Selecting another marker replaces its
  detail, and the map remains interactive. On mobile, search panels give their
  space to the map while a record Console is open.
- Location details show the saved name, Project, Region/Layer context, About description,
  latitude and longitude, saved area vertex count, and Apple Maps Directions. Records without
  valid coordinates remain available in Project lists.
- The map stays at ground level (0), displaying unlayered and level-zero Locations
  and their saved outlines. Higher and lower levels remain available as read-only
  records in Project details, but inspecting them does not switch the map level.
  The bottom Layer/Map-level toolbar is removed.
- Search Maps uses Apple autocomplete; choosing a suggestion opens its first valid
  resolved place, as native search does. Submitting text offers a list of results.
  Map features and search markers use MapKit's place selection callout. Selecting a
  map feature looks up its Place for the inspector, with stale lookups discarded.
- Search contains only Apple place search and selected place details. Project-record
  search and coordinate entry/copy controls are removed.
- Apple search and PlaceDetail work without iCloud sign-in. Project switches preserve
  an independent selected Apple place. Selecting an Apple map item reveals Search
  and dismisses project details.

There are no record editing, creation, deletion, relocation or vertex-drawing
controls. Vertices are rendered from saved records only. Activity, Assignment,
Route and inventory-transaction workflows remain outside this map-viewing scope.

## Data and modules

`app.js` owns project selection, all loaded collections, map context and request
versions. Switching projects, signing out or retrying invalidates old responses
and clears project graphics and Console details. Collections publish together;
a failed collection produces a retry state instead of partial project data.

`cloudkit.js` reuses `LinkMapAuth.container`, enumerates private `projectZone-`
zones and all accepted shared zones, and preserves the selected database and full
zone owner when querying. Every collection uses pagination and the direct
`project EQUALS REFERENCE(project.recordName)` predicate. No records, zones,
indexes or shares are written.

`records.js` and `location.js` normalize Location, Region, Layer and Item records.
The Location description field is `description`; optional `region`/`layer` fields
are references. `vertices` is the native JSONEncoder coordinate array in CloudKit
BYTES (base64). Malformed payloads are ignored rather than joining damaged areas.
Missing, nonnumeric, nonfinite or out-of-range coordinates are excluded from map
markers and counted in the status. Explicit `(0, 0)` remains valid.

`map-view.js` holds pure visibility and geometry functions. `map.js` owns one
MapKit instance and replaces project annotations/overlays without rebuilding it.
`record-console.js` handles read-only detail navigation; `project-selector.js` renders the
project list. `sidebar.js` owns the Search/Projects panels and responsive navigation.
`place-search.js` and `place-details.js` handle Apple place services.

The existing authentication container and public origin-restricted MapKit token are
unchanged. CloudKit uses the Production environment. The Production schema must
permit queries for the four collection types and their `project` references.

## Verification

From `linkmap/`, run:

```sh
node tests/run.mjs
python3 tests/browser-map.py
git diff --check
```

The Node suites require no dependencies or Apple credentials. They cover queries,
pagination, private/shared context, schema conversion, malformed coordinates and
vertices, geometry, map accessories, stale responses, project switching, search,
sidebar selection, authentication and error handling. The browser test requires
Python Playwright and Chromium; it serves the site locally with SDK doubles and
checks desktop/mobile viewing, Console navigation, search, overlays and races.

Live Apple acceptance still requires the token's allowed origin and a signed-in
Production account with private and accepted shared projects. Confirm actual
map tiles, place callouts, saved areas, Layer levels and shared-zone records there.
SDK doubles cannot verify remote permissions, schema indexes or Apple's rendering.

## Routes

`/linkmap/` stays the product homepage. Open web app leads to `/linkmap/app/`;
sign-in and account management stay in `app/sign-in/` and `app/account/`.
App pages omit the shared Endsunset website header and footer.
