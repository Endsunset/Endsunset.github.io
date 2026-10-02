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
Keep fragments when linking to a section.

Back each clean URL with a directory containing `index.html`; do not simply remove
an extension without providing a working destination. Asset references such as
CSS and JavaScript retain their extensions. Preserve external URLs as provided by
their owners.

Apply this convention to website generators. DocC owns its generated internal
links and static-hosting URLs. After changing links, verify local destinations
and fragments, and run `git diff --check`.

## Documentation

Documentation source lives in the single `docc/LinkMap.docc` catalog. Run
`python3 scripts/build-documentation.py` to regenerate the checked-in
`documentation/` static site. Curate its visible hierarchy with `## Topics`:
Essentials, Start Here, Project and Map, Plan Work, and Collaborate, in that
order. Essentials directly contains How LinkMap Works, LinkMap for Web, and
LinkMap for iOS. Keep one getting-started article per platform, including
account access and available actions; do not add a Platforms section. Curate
the existing iOS task pages directly under the landing page's task sections.
Project and Map are separate curated pages with their own children. The DocC landing
article is served directly at `/linkmap/documentation/`.
Write the public documentation as a user booklet: explain what readers can do
in LinkMap and how to do it. Keep implementation details, developer reference,
Swift symbols, CloudKit and MapKit internals, and `projectZone` out of the
published library. Leave Inventory and Transaction guidance out for now.
Preserve useful user instructions. Keep Shared Concepts and its former articles
out of the published library.
Do not edit generated files directly. The build leaves redirects at the former
platform roots and at `/linkmap/docs/` for the native app's current link.
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
