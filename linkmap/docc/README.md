# LinkMap DocC collections

The user guides are independent article-based Swift-DocC collections:

| Catalog | Root | Bundle identifier | Native route |
| --- | --- | --- | --- |
| `LinkMap-iOS.docc` | `iOS.md` | `io.github.endsunset.LinkMap.iOS` | `/linkmap/documentation/ios/` |
| `LinkMap-Web.docc` | `Web.md` | `io.github.endsunset.LinkMap.Web` | `/linkmap/documentation/web/` |

Each root declares `@TechnologyRoot`, so both have the native `collection` role.
They are not Collection Groups underneath an authored LinkMap collection.
Info.plist display names iOS and Web provide stable native route namespaces;
the root article headings provide the full LinkMap for iOS and LinkMap for Web
names. Keep these identities stable. iOS contains the comprehensive user guide;
Web contains a brief development notice.

## Build and hosting

From `linkmap/`, run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/build-documentation.py
```

The generator copies the common `theme-settings.json` into temporary copies of
both catalogs, converts them with warnings as errors and the `/linkmap` hosting
base, then uses native `docc merge` to synthesize LinkMap Documentation at
`/linkmap/documentation/`. The merged archive supplies the pages, references,
collection roles, and combined navigator. Canonical iOS articles live below
`/linkmap/documentation/ios/<article>/`. There is no route-flattening pass.

The compiler was checked with Xcode 27.1 (27A9275). This bundled DocC does not
expose `--version`; its `merge --help` and installed features.json confirm
synthesized landing-page support. A temporary two-catalog archive verified both
native roots and deep static-hosting pages before migration. The build checks
for the required merge options before replacing checked-in output.

DocC's synthesized directory can vary collection order, so the generator fixes
iOS before Web and stabilizes JSON key order. It does not change collection
roles, identifiers, or canonical routes. DocC assets remain at the `linkmap/`
root. Shared website header/footer integration is applied by the generator;
the documentation header remains inline.

## Native navigation

The installed renderer initially scopes its navigator from the loaded URL.
Entering a platform from the merged directory can retain the directory tree;
refreshing an article scopes the navigator to its platform. This accepted native
behavior is tracked in [Swift-DocC-Render issue 1024](https://github.com/swiftlang/swift-docc-render/issues/1024).
Do not patch renderer bundles or add a collection-switching script.

The shared footer’s Documentation link returns to the merged directory. The merged landing article is titled LinkMap Documentation; the native navigator index keeps the directory label All Collections. Do not add a separate directory row above the documentation navigation.

## Authoring and compatibility

Curate each iOS article once, under Get started, Projects and places, Plan and
follow work, or Share and sync. Use native `<doc:...>` links within a catalog.
Use the LinkMap Documentation directory to move between platforms. The footer link remains available on static loads and client-side navigation without
cross-catalog link resolution or renderer changes. Keep Web short until its functionality is ready.

Old flat article URLs, iOS/Web platform pages, introductory aliases, the former
`/documentation/linkmap/` root, and `/linkmap/docs/` have direct redirects.
Preserve these in `build-documentation.py` when changing routes. Legacy redirect
pages carry the original query and fragment with `location.replace`, with a
no-JavaScript meta-refresh fallback; this is separate from native DocC navigation. Keep authored
filenames such as `Apple-Maps.md` stable; its former flat Maps URL redirects to
`/linkmap/documentation/ios/apple-maps/`.

Check iOS instructions against `/Library/Developer/Projects/LinkMap-core`, which
is strictly read-only. Write concise task instructions using app labels. Keep
implementation details, developer reference, and Shared Concepts out of the public
guides. Cover Items, Supply, transfers, returns, Stop distribution, results,
reports, and settings/imports with current app labels and permission/state rules.

The user workflows were checked against `Endsunset/LinkMap-core` at
`b854a5499278852154f40fff7600e72b8f1e6ee6`. Recheck the corresponding views and
lifecycle/resource workflows when the app changes. The native repository remains
read-only; no native code or developer reference is published in this site.

## Verification

Run `PYTHONDONTWRITEBYTECODE=1 python3 scripts/build_search.py` from the parent root to
refresh site search, then run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 tests/documentation.py
```

Also run the parent's `tests/linkmap-integration.py`, `git diff --check`, and a
second documentation build to verify determinism. Serve the parent repository
and test the directory, both platform roots, and direct article URLs. Refresh
an iOS article and verify its focused navigator and footer Documentation link.
Commit catalog/configuration changes, redirects, search, and generated output
together. Do not edit generated HTML or JSON by hand.
