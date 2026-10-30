"""Build and merge the independent LinkMap DocC collections for GitHub Pages."""

from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile

from site_header import render_header, render_assets
from site_footer import render_footer


ROOT = Path(__file__).resolve().parents[1]
DOCC = ROOT / "docc"
OUTPUT = ROOT / "documentation"
COLLECTIONS = (("LinkMap-iOS.docc", "ios"), ("LinkMap-Web.docc", "web"))
ASSET_DIRECTORIES = ("css", "js", "data", "index", "img", "images", "videos", "downloads")
ASSET_FILES = ("metadata.json", "theme-settings.json")
DOC_IMAGE_FILES = ("favicon.ico", "favicon.svg", "developer-og.jpg", "developer-og-twitter.jpg")
LEGACY_ROUTES = {
    "linkmap": "",
    "ios-platform": "ios",
    "web-platform": "web",
    "essentials": "ios/how-linkmap-works",
    "using-linkmap-for-ios": "ios",
    "using-linkmap-on-web": "web",
    "sign-in": "web",
    "explore-projects": "web",
    "search-and-coordinates": "web",
}


def redirect(directory: Path, target: Path):
    directory.mkdir(parents=True, exist_ok=True)
    relative = os.path.relpath(target, directory) + "/"
    (directory / "index.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{relative}">
  <script>window.location.replace({json.dumps(relative)} + window.location.search + window.location.hash);</script>
  <noscript><meta http-equiv="refresh" content="0; url={relative}"></noscript>
  <title>LinkMap Documentation</title>
</head>
<body><p><a href="{relative}">Open LinkMap documentation</a></p></body>
</html>
""")


def require_merge_support():
    help_text = subprocess.run(
        ["xcrun", "docc", "merge", "--help"], check=True,
        capture_output=True, text=True,
    ).stdout
    for option in ("--synthesized-landing-page-name", "--synthesized-landing-page-kind",
                   "--synthesized-landing-page-topics-style"):
        if option not in help_text:
            raise RuntimeError(f"Installed DocC lacks {option}; use a toolchain with native archive merging")


def normalize_json(archive):
    """Stabilize JSON keys and the synthesized directory's collection ordering."""
    order = {f"/documentation/{slug}": index for index, (_, slug) in enumerate(COLLECTIONS)}
    for data_file in sorted(archive.rglob("*.json")):
        data = json.loads(data_file.read_text())
        if data_file == archive / "data" / "documentation.json":
            # DocC merges these references from a set. Keep iOS first without
            # changing native collection roles, references, or routes.
            for section in data.get("topicSections", []):
                section["identifiers"].sort(key=lambda identifier: order[data["references"][identifier]["url"]])
        if data_file == archive / "index" / "index.json":
            for nodes in data["interfaceLanguages"].values():
                [directory] = nodes
                directory["children"].sort(key=lambda item: order[item["path"]])
            data["includedArchiveIdentifiers"].sort()
        data_file.write_text(json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def add_website_chrome(documentation):
    shutil.copyfile(DOCC / "doc-theme.css", documentation / "doc-theme.css")
    for page in documentation.rglob("index.html"):
        html = page.read_text()
        if 'var baseUrl = "/linkmap/"' not in html:
            continue
        html = html.replace('data-color-scheme="auto"', 'data-color-scheme="light"')
        html = html.replace('/linkmap/favicon.', '/linkmap/documentation/favicon.')
        html = html.replace(
            "</head>", '<link rel="stylesheet" href="/linkmap/documentation/doc-theme.css">'
            + render_assets() + '</head>',
        )
        # An ordinary link outside DocC remains available after direct loads,
        # refreshes, and client-side navigation, regardless of sidebar scope.
        html = html.replace('<body data-color-scheme="light">',
                            '<body data-color-scheme="light">' + render_header(inline=True))
        html = html.replace('</body>', render_footer() + '</body>')
        page.write_text(html)


def main():
    require_merge_support()
    with tempfile.TemporaryDirectory(prefix="linkmap-docc-") as temporary:
        temporary = Path(temporary)
        archives = []
        for name, slug in COLLECTIONS:
            # Both native catalogs use the same maintained renderer settings.
            catalog = temporary / name
            shutil.copytree(DOCC / name, catalog)
            shutil.copyfile(DOCC / "theme-settings.json", catalog / "theme-settings.json")
            archive = temporary / f"{slug}.doccarchive"
            subprocess.run(
                ["xcrun", "docc", "convert", str(catalog),
                 "--output-path", str(archive), "--hosting-base-path", "/linkmap",
                 "--experimental-transform-for-static-hosting-with-content", "--warnings-as-errors"],
                check=True,
            )
            archives.append(archive)
        merged = temporary / "LinkMap.doccarchive"
        subprocess.run(
            ["xcrun", "docc", "merge", *map(str, archives), "--output-path", str(merged),
             "--synthesized-landing-page-name", "LinkMap Documentation",
             "--synthesized-landing-page-kind", "LinkMap User Guide",
             "--synthesized-landing-page-topics-style", "detailedGrid"],
            check=True,
        )
        for route in ("", "ios", "web"):
            if not (merged / "documentation" / route / "index.html").is_file():
                raise RuntimeError(f"DocC did not generate the collection route: {route}")
        normalize_json(merged)

        documentation = merged / "documentation"
        for name in DOC_IMAGE_FILES:
            shutil.copyfile(merged / name, documentation / name)
        add_website_chrome(documentation)
        aliases = dict(LEGACY_ROUTES)
        for article in (DOCC / "LinkMap-iOS.docc").glob("*.md"):
            if article.name != "iOS.md":
                aliases[article.stem.lower()] = f"ios/{article.stem.lower()}"
        for former, destination in aliases.items():
            redirect(documentation / former, documentation / destination)

        # Publish only generator-owned paths; the product homepage stays intact.
        for name in (*ASSET_DIRECTORIES, *ASSET_FILES, "documentation"):
            destination = ROOT / name
            if destination.is_dir():
                shutil.rmtree(destination)
            elif destination.exists():
                destination.unlink()
            source = merged / name
            if source.is_dir():
                shutil.copytree(source, destination)
            elif source.exists():
                shutil.copyfile(source, destination)

    redirect(ROOT / "docs", OUTPUT)
    print("Built the iOS and Web DocC collections at /linkmap/documentation/")


if __name__ == "__main__":
    main()
