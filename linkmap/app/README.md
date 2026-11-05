# Map viewing

`index.html` is the LinkMap web map. The native `Endsunset/LinkMap-core` repository
was inspected read-only: map content/view-model components, Location markers,
search, Location/Region/Layer/Item detail consoles, record models and CloudKit
conversion/query helpers. Changes belong to this web app only.

## Viewing behavior

- A persistent navigation rail has Search and Projects buttons. They open one
  sidebar panel at a time; choosing the active button again closes that panel.
  Search opens by default on desktop. Mobile starts with both panels closed to
  leave the map visible, and choosing a Project closes its panel.
- The project sidebar lists private and accepted shared projects, with project-name
  search, active selection, Refresh map data, retry and sign-in states. Projects sort by creation
  date descending, then natural name. Shared discoveries replace duplicate IDs.
- Project, Locations, Regions, Layers and Items open a modeless detail panel beside
  the sidebar and map. At narrower desktop widths, details take the sidebar's
  space; on mobile they use a bottom sheet.
  Back returns through related records. Selecting another marker replaces its
  detail, and the map remains interactive. On mobile, search panels give their
  space to the map while a record Console is open.
- Location details show the saved name, Project, Region/Layer context, About description,
  latitude and longitude, saved area vertex count, and Apple Maps Directions. Records without
  valid coordinates remain available in lists and search.
- Location markers open the Console and show a level accessory for nonzero Layers.
  Above/below arrows compare that level to the selected Layer's level.
- Layer outlines are convex hulls of their Locations' saved vertices, falling back
  to each Location point when it has no saved area. The hull uses Mercator geometry
  and cuts the largest longitude gap to handle areas crossing the antimeridian.
  Two points draw a line; three or more draw a polygon. Inspecting a Location also
  displays its saved area, without modifying its vertices. Outlines follow the
  Layers referenced by displayed Locations; the selected Layer draws last.
- As in native project viewing, focusing a Region alone keeps all Locations.
  Selecting a Layer with a Region shows Locations whose own Region matches it,
  including other levels and unlayered Locations. The focused Region's selector
  orders Layers by descending level with Map (Level 0) between positive and negative
  levels. Returning to Map clears the Layer while retaining Region focus.
  Show all resets the context and fits the project map.
- Moving the map center into a Layer outline focuses its Region. A selected Layer
  retains its context until another Layer or Map is chosen.
- Search Maps uses Apple autocomplete; choosing a suggestion opens its first valid
  resolved place, as native search does. Submitting text offers a list of results.
  Map features and search markers use MapKit's place selection callout. Selecting a
  map feature looks up its Place for the inspector, with stale lookups discarded.
- Project record search matches names, Location descriptions and Region/Layer
  context, and opens the same Console views. Results support keyboard navigation.
- Apple search, PlaceDetail and decimal coordinate inspection work without iCloud
  sign-in. Project switches preserve an independent selected Apple place.
  Selecting an Apple map item reveals Search and dismisses project details.

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
`place-search.js`, `place-details.js` and `coordinates.js` handle Apple's
services and the independent coordinate selection.

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
