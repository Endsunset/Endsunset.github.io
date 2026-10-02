"""Build the single LinkMap DocC library for GitHub Pages."""

from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile

from site_header import render_auth_scripts, render_header
from site_footer import render_footer


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "docc" / "LinkMap.docc"
OUTPUT = ROOT / "documentation"
ASSET_DIRECTORIES = ("css", "js", "data", "index", "img", "images", "videos", "downloads")
ASSET_FILES = ("metadata.json", "theme-settings.json")
DOC_IMAGE_FILES = ("favicon.ico", "favicon.svg", "developer-og.jpg", "developer-og-twitter.jpg")
DOCC_ROUTE = "/documentation/linkmap"
PUBLIC_ROUTE = "/documentation"


def public_route(value):
    """Remove DocC's module segment from navigable paths in render JSON."""
    if isinstance(value, str):
        if value == DOCC_ROUTE or value.startswith(DOCC_ROUTE + "/"):
            return PUBLIC_ROUTE + value[len(DOCC_ROUTE):]
        return value
    if isinstance(value, list):
        return [public_route(item) for item in value]
    if isinstance(value, dict):
        return {key: public_route(item) for key, item in value.items()}
    return value


def redirect(directory: Path, target: Path):
    directory.mkdir(parents=True, exist_ok=True)
    relative = os.path.relpath(target, directory) + "/"
    (directory / "index.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url={relative}">
  <link rel="canonical" href="{relative}">
  <title>LinkMap Documentation</title>
</head>
<body><p><a href="{relative}">Open LinkMap documentation</a></p></body>
</html>
""")


def main():
    with tempfile.TemporaryDirectory(prefix="linkmap-docc-") as temporary:
        temporary = Path(temporary)
        archive = temporary / "archive"
        subprocess.run(
            ["xcrun", "docc", "convert", str(CATALOG),
             "--fallback-display-name", "LinkMap",
             "--fallback-bundle-identifier", "io.github.endsunset.LinkMap",
             "--output-path", str(archive),
             "--hosting-base-path", "/LinkMap",
             "--experimental-transform-for-static-hosting-with-content",
             "--warnings-as-errors"],
            check=True,
        )
        landing = archive / "documentation" / "linkmap"
        if not (landing / "index.html").is_file():
            raise RuntimeError("DocC did not create the LinkMap landing page")

        staged = temporary / "staged"
        documentation = staged / "documentation"
        documentation.mkdir(parents=True)
        shutil.copytree(landing, documentation, dirs_exist_ok=True)
        for directory in ASSET_DIRECTORIES:
            source = archive / directory
            if source.exists():
                shutil.copytree(source, staged / directory)
        for name in ASSET_FILES:
            source = archive / name
            if source.exists():
                shutil.copyfile(source, staged / name)

        # The renderer maps a public route to a JSON file in /data. Move the
        # module's data to match /documentation/ and its child routes.
        data = staged / "data" / "documentation"
        shutil.move(data / "linkmap.json", staged / "data" / "documentation.json")
        for item in (data / "linkmap").iterdir():
            shutil.move(item, data / item.name)
        (data / "linkmap").rmdir()

        # Keep render references and the navigator on the same public routes.
        # DocC's key order varies between builds; stable JSON avoids churn.
        for data_file in staged.rglob("*.json"):
            data_file.write_text(json.dumps(
                public_route(json.loads(data_file.read_text())), ensure_ascii=False,
                sort_keys=True, separators=(",", ":"),
            ))

        shutil.copyfile(ROOT / "docc" / "doc-theme.css", documentation / "doc-theme.css")
        for name in DOC_IMAGE_FILES:
            shutil.copyfile(archive / name, documentation / name)
        redirect(documentation / "linkmap", documentation)
        # Former platform roots lead to their pages in this one library.
        redirect(documentation / "ios", documentation / "ios-platform")
        redirect(documentation / "web", documentation / "web-platform")
        # Keep bookmarks working after consolidating introductory articles.
        for former, destination in {
            "essentials": "how-linkmap-works",
            "using-linkmap-for-ios": "ios-platform",
            "using-linkmap-on-web": "web-platform",
            "sign-in": "web-platform",
            "explore-projects": "web-platform",
            "search-and-coordinates": "web-platform",
        }.items():
            redirect(documentation / former, documentation / destination)

        for page in documentation.rglob("*.html"):
            html = page.read_text()
            if 'var baseUrl = "/LinkMap/"' not in html:
                continue
            prefix = "../" * len(page.relative_to(staged).parts[:-1])
            html = html.replace('data-color-scheme="auto"', 'data-color-scheme="light"')
            html = html.replace('/LinkMap/favicon.', '/LinkMap/documentation/favicon.')
            html = html.replace('/documentation/linkmap/', '/documentation/')
            html = html.replace('<p>API Collection</p>', '<p>LinkMap Guide</p>')
            html = html.replace(
                "</head>",
                f'<link rel="stylesheet" href="/LinkMap/documentation/doc-theme.css">'
                f'<link rel="stylesheet" href="{prefix}components/site-chrome.css">'
                f'{render_auth_scripts(prefix)}</head>',
            )
            html = html.replace('<body data-color-scheme="light">',
                                '<body data-color-scheme="light">' + render_header(prefix, docs=True))
            html = html.replace('</body>', render_footer(prefix) + '</body>')
            page.write_text(html)

        # Replace only paths owned by this generator, preserving website pages.
        for name in (*ASSET_DIRECTORIES, *ASSET_FILES, "documentation"):
            destination = ROOT / name
            if destination.is_dir():
                shutil.rmtree(destination)
            elif destination.exists():
                destination.unlink()
            source = staged / name
            if source.is_dir():
                shutil.copytree(source, destination)
            elif source.exists():
                shutil.copyfile(source, destination)

    # The current iOS app still opens /docs/.
    redirect(ROOT / "docs", OUTPUT)
    print("Built the LinkMap DocC library at /LinkMap/documentation/")


if __name__ == "__main__":
    main()
