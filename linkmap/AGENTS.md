# LinkMap project instructions

LinkMap is a child project of the parent Endsunset.github.io repository. Keep
these instructions here. Run LinkMap generators and tests from this directory;
Git history, ignore rules, and Pages deployment belong to the parent repository.
Do not introduce nested Git metadata or a separate deployment workflow.

## Product homepage and app routes

`/linkmap/` is permanently the LinkMap product homepage. `index.html` must render
the existing product page directly; never replace it with a redirect to `app/`
in HTML, JavaScript, configuration, or a generator. Preserve its current design.
Users open `/linkmap/app/` only through an explicit app action such as Open web app.
Keep sign-in and account management under `app/sign-in/` and `app/account/`;
documentation remains under `documentation/`.

## HTML links

Use clean URLs for internal page links in authored HTML. Do not end page hyperlinks with
`.html` or `.md`: link to `documentation/` and `privacy-policy/` instead.
Omit `index.html` from hyperlinks too: use the folder URL (`./`, `../`, or
`documentation/`), which automatically serves its index page.
Use relative paths so the site works under the GitHub Pages `/linkmap/` base path.
Shared/generated chrome uses canonical `/linkmap/` destination paths and the
domain assets under `/assets/`, regardless of page depth. Keep fragments when
linking to a section.

Back each clean URL with a directory containing `index.html`; do not simply remove
an extension without providing a working destination. Asset references such as
CSS and JavaScript retain their extensions. Preserve external URLs as provided by
their owners.

Apply this convention to website generators. DocC owns its generated internal
links and static-hosting URLs. After changing links, verify local destinations
and fragments, and run `git diff --check`.

## Documentation

Documentation has two independent catalogs: `docc/LinkMap-iOS.docc` and
`docc/LinkMap-Web.docc`. Each has its own Info.plist bundle identifier and an
explicit `@TechnologyRoot`. The short display names iOS and Web define native
route namespaces; the authored headings supply the full platform titles.
Run `python3 scripts/build-documentation.py` to convert both catalogs, merge
with native `docc merge`, and regenerate the checked-in static site. Do not
replace this with nested Collection Groups or a separate documentation framework.
`/linkmap/documentation/` is DocC's synthesized All Collections directory;
`/linkmap/documentation/ios/` and `/web/` are independent collection roots.
Curate iOS tasks in this order: Get started, Projects and places, Plan and follow
work, Share and sync. Web remains a brief under-development collection.
Keep the renderer native. The installed renderer scopes the sidebar differently
on client-side entry versus a deep refresh; this is an accepted limitation.
Retain the ordinary All Collections link in the generated documentation chrome.
Do not add a collection-switching script or patch DocC's JavaScript bundles.
Preserve old flat article/platform URLs with direct redirects in the generator.
Do not flatten or rewrite the native collection routes, roles, or identifiers.
Rebuild parent site search after documentation changes; its generator derives
routes from render-data paths, including nested collection directories.
Write a user guide using current app labels, numbered steps, and relevant
permission and Activity-state requirements. Keep implementation details,
developer reference, Swift symbols, CloudKit and MapKit internals, `projectZone`,
and Shared Concepts out of the guide. Include user-facing Items, Item transfers,
Supply, returns, Stop distribution, results, reports, and settings/import guidance.
Explain current permissions, Activity-state requirements, and save/recovery behavior
without exposing persistence implementation details.
Edit catalog sources, shared `docc/theme-settings.json`, `docc/doc-theme.css`,
or the generator; never hand-edit generated HTML or JSON. Commit generated
output with source. Verify native collection metadata, deep static routes,
redirects, shared chrome, local links, search, and deterministic regeneration.
The build also preserves `/linkmap/docs/` for existing native app links.
The privacy policy source remains in
`privacy-policy.md`; regenerate its public page with `python3 scripts/build-privacy.py`.
Commit generated pages with their source changes. No deployment build is required.

Treat `/Library/Developer/Projects/LinkMap-core` as read-only when referencing native
app code or documentation. Make LinkMap web changes in this child project only.

## Visual style

Follow `guide/style.md` for all web UI changes. Use white backgrounds throughout
and red accents for emphasis, actions, and trailing badge or active-state edges.

## Commit and push

Unless the user explicitly specifies otherwise, commit and push completed changes
after the relevant verification passes. Stage only files belonging to the requested
work, use a descriptive commit message, and push to the current branch's configured
remote. Do not include unrelated local changes or force-push. Report the commit and
push result when finished.
