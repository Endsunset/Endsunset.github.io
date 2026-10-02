# Map page implementation

`index.html` is the single map page. Native source was inspected read-only in
`LinkMap-core` (ProjectModel, LocationModel, CKUtility+Project/+Location/+Share/
+RecordSupport, MapView, MapViewModel, MapViewModelComponents, MapContentView,
LocationMarker, MapUtility+Geometry and RecordNameFallback).

- `app.js` owns the only `projects`, `selectedProject`, and `locations` state.
  It coordinates authentication, initial selection, loading, retry and rendering.
  Request versions invalidate responses after a switch, sign-out or auth retry.
- `cloudkit.js` reuses `LinkMapAuth.container`, selects private/shared databases,
  enumerates zones and handles query pagination, response errors and timeouts.
- `project.js` loads private `projectZone-` zones and all accepted shared zones,
  queries `Project`, converts `name`, and retains the source database and complete
  zone ID (including owner). As in native code, record-name UUIDs are logical IDs:
  later shared discoveries replace duplicates. Names sort naturally; the first
  project is initially selected.
- `location.js` queries `Location.project EQUALS REFERENCE(project.recordName)`
  in the selected project's database and zone. It converts `name`, `detail`,
  `latitude`, `longitude` and preserves the original record.
- `project-selector.js` renders an accessible native select and loading/empty/error
  status. It reports selection to the coordinator without owning project state.
- `map.js` owns one MapKit instance and its Location annotations. It removes old
  annotations before replacements, fits valid Locations, and retains the existing
  SDK/load/user-location error reporting. Late SDK initialization uses current
  page state. The `full-map` and `services` libraries supply map controls, annotations, search and place cards.
  Search/coordinate selections use a separate marker; project refreshes preserve its viewport.
- `place-search.js` owns debounced autocomplete, full search, cancellation and keyboard-accessible results.
- `place-details.js` replaces and destroys Apple's native PlaceDetail card on selection changes.
- `coordinates.js` validates decimal latitude/longitude pairs, displays them and copies them
  with a manual fallback when clipboard access is unavailable. Comma or whitespace separators
  are accepted; latitude comes first. Custom coordinates clear the previous place card.
- Search and coordinate inspection work independently of iCloud sign-in.
- `app.css` styles the persistent white/red toolbar above the map canvas.
- `../cloudkit-config.js` selects `development` for the existing shared authentication
  setup, without changing the container, public API token or auth behavior.

## Scope and native differences

With no selected assignment or region/layer context, native
`displayedProjectLocations` includes every project Location. The web map follows
that basic view. Location has no standalone type/icon field. Native layer-level
badges, selected-area `vertices` overlays and editing/activity flows are outside
this implementation; web markers use the site red accent and a name/detail callout.
Empty names use native `New Project` / `New Location` display fallbacks.

Missing, nonnumeric, nonfinite and out-of-range coordinates are skipped and counted
in the status, rather than adopting native model defaults of zero for absent fields.
An explicit valid `(0, 0)` remains visible. Empty projects keep the existing viewport.
Query errors are reported with the existing CloudKit notification and a local retry;
they are not presented as empty data. Pagination fetches every batch for both record
types. The native helper currently consumes only the first query batch.

The existing Development schema must allow Project queries and querying the
Location `project` reference, as required by the native queries. This implementation
only reads CloudKit; it does not create zones, records, indexes or shares.

SDK references: [CloudKit performQuery](https://developer.apple.com/documentation/cloudkitjs/cloudkit.database/performquery),
[MapKit libraries](https://developer.apple.com/documentation/mapkitjs/mapkitinitializationoptions/libraries),
[MapKit showItems](https://developer.apple.com/documentation/mapkitjs/map/showitems).

## Verification

Run with JavaScriptCore (`jsc`, or the macOS framework helper at
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`):

```sh
jsc tests/place-search.js
jsc tests/project-map.js
jsc tests/cloudkit-auth.js
jsc tests/error-notifications.js
git diff --check
```

The tests use SDK doubles and no Apple credentials. They cover private/shared
context, pagination, deduplication, direct references, invalid coordinates, query
failures, delayed map startup, rapid switches, sign-out races, empty states,
annotation replacement, selector safety and existing auth/error handling.

Live acceptance requires an authenticated Development account with private and
accepted shared projects on the token's allowed web origin. Verify both project
types, switch quickly while loading, and sign out during a query. Confirm the
correct Location titles/details appear and previous annotations disappear.

Search API references: [Search](https://developer.apple.com/documentation/mapkitjs/search),
[PlaceDetail](https://developer.apple.com/documentation/mapkitjs/placedetail).
Live search acceptance: type a place name, choose a suggestion and result, verify the
marker, center, place card and coordinate pair. Copy and paste that pair, try `0, 0`
and an invalid latitude, and check keyboard navigation and a narrow viewport.
