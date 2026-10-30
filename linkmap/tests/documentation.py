"""Validate native collections, deep static routes, legacy redirects, and links."""

from html.parser import HTMLParser
import json
import os
from pathlib import Path
import plistlib
from urllib.parse import unquote, urljoin, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "documentation"
CATALOGS = [ROOT / "docc" / name for name in ("LinkMap-iOS.docc", "LinkMap-Web.docc")]
ARTICLES = [article for catalog in CATALOGS for article in catalog.glob("*.md")]
IOS_ARTICLES = {
    "how-linkmap-works", "basic-workflow", "project", "map", "locations",
    "regions-and-layers", "activities", "routes-and-stops", "assignments",
    "sharing", "icloud", "apple-maps", "items", "item-transfers",
    "results-and-reports", "settings-and-imports",
}


class References(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.urls = []
        self.ids = set()
        self.search_urls = []
        self.in_search_entry = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "li" and "data-search-entry" in attrs:
            self.in_search_entry = True
        if tag == "a" and self.in_search_entry:
            self.search_urls.append(attrs["href"])
        self.urls.extend(attrs[key] for key in ("href", "src") if key in attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.urls.append(attrs["content"].split("url=", 1)[1])

    def handle_endtag(self, tag):
        if tag == "li":
            self.in_search_entry = False


def load(route):
    return json.loads((ROOT / "data" / (route.lstrip("/") + ".json")).read_text())


def children(node):
    return {item["title"]: item for item in node.get("children", []) if item.get("path")}


def check_navigation():
    index = json.loads((ROOT / "index" / "index.json").read_text())
    assert index["includedArchiveIdentifiers"] == ["io.github.endsunset.LinkMap.Web", "io.github.endsunset.LinkMap.iOS"]
    [directory] = index["interfaceLanguages"]["swift"]
    assert directory["title"] == "All Collections"
    assert directory["path"] == "/documentation"
    platforms = children(directory)
    assert list(platforms) == ["LinkMap for iOS", "LinkMap for Web"]
    for title, slug in [("LinkMap for iOS", "ios"), ("LinkMap for Web", "web")]:
        assert platforms[title]["type"] == "module", platforms[title]
        assert platforms[title]["path"] == f"/documentation/{slug}"
        page = load(f"/documentation/{slug}")
        assert page["metadata"]["role"] == "collection", page["metadata"]
        assert page["metadata"]["roleHeading"] == "User Guide"
        assert page["hierarchy"]["paths"] == [[]], "Platform must be its own technology root"
        assert page["identifier"]["url"].startswith(f"doc://io.github.endsunset.LinkMap.{ 'iOS' if slug == 'ios' else 'Web' }/")
    ios = platforms["LinkMap for iOS"]
    web = platforms["LinkMap for Web"]
    assert not children(web)
    expected = {
        "Get started": ["How LinkMap Works", "Basic Workflow"],
        "Projects and places": ["Project", "Map", "Locations", "Regions and Layers", "Items"],
        "Plan and follow work": ["Activities", "Routes and Stops", "Assignments", "Item Transfers", "Results and Reports"],
        "Share and sync": ["Sharing", "iCloud", "Maps", "Settings and Imports"],
    }
    groups = {}
    for entry in ios["children"]:
        if entry["type"] == "groupMarker":
            group = entry["title"]
            groups[group] = []
        else:
            groups[group].append(entry["title"])
            assert not children(entry), entry
    assert list(groups) == list(expected)
    assert groups == expected
    landing = load("/documentation")
    assert landing["metadata"]["title"] == "LinkMap Documentation"
    assert landing["metadata"]["role"] == "collection"
    assert [landing["references"][identifier]["url"]
            for section in landing["topicSections"] for identifier in section["identifiers"]] == [
                "/documentation/ios", "/documentation/web"]
    ios_data = load("/documentation/ios")
    assert [section["title"] for section in ios_data["topicSections"]] == list(expected)
    for section in ios_data["topicSections"]:
        assert [ios_data["references"][identifier]["title"]
                for identifier in section["identifiers"]] == expected[section["title"]]
    for article in children(ios).values():
        assert article["path"].startswith("/documentation/ios/")
        assert load(article["path"])["hierarchy"]["paths"] == [[ios_data["identifier"]["url"]]]
    web_data = load("/documentation/web")
    assert "still under development" in web_data["abstract"][0]["text"]
    assert not web_data.get("topicSections")

    def paths(node):
        yield node["path"]
        for child in node.get("children", []):
            if child.get("path"):
                yield from paths(child)

    curated = list(paths(directory))
    assert len(curated) == len(set(curated)) == len(ARTICLES) + 1
    assert set(curated) == {"/documentation", "/documentation/ios", "/documentation/web"} | {
        f"/documentation/ios/{slug}" for slug in IOS_ARTICLES}
    return set(curated)


def check_redirects():
    aliases = {slug: f"ios/{slug}" for slug in IOS_ARTICLES}
    aliases.update({
        "linkmap": "", "ios-platform": "ios", "web-platform": "web",
        "essentials": "ios/how-linkmap-works", "using-linkmap-for-ios": "ios",
        "using-linkmap-on-web": "web", "sign-in": "web", "explore-projects": "web",
        "search-and-coordinates": "web",
    })
    for former, destination in aliases.items():
        page = SITE / former / "index.html"
        target = SITE / destination
        relative = os.path.relpath(target, page.parent) + "/"
        source = page.read_text()
        assert f'content="0; url={relative}"' in source, page
        assert f'rel="canonical" href="{relative}"' in source, page
        assert "window.location.search + window.location.hash" in source, page
        assert (target / "index.html").is_file(), page
        assert 'http-equiv="refresh"' not in (target / "index.html").read_text(), "Redirect chain"
        assert not (ROOT / "data/documentation" / f"{former}.json").exists(), former
    assert 'url=../documentation/' in (ROOT / "docs/index.html").read_text()


def check_render_links(routes):
    """Validate render-data links, including anchors, against static-hosting pages."""
    def anchors(value):
        found = set()
        if isinstance(value, dict):
            if isinstance(value.get("anchor"), str):
                found.add(value["anchor"])
            for child in value.values():
                found.update(anchors(child))
        elif isinstance(value, list):
            for child in value:
                found.update(anchors(child))
        return found

    def check(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == "url" and isinstance(item, str):
                    assert not item.startswith("/linkmap/documentation"), "DocC adds the hosting prefix: " + item
                if key in {"url", "path"} and isinstance(item, str) and item.startswith("/documentation"):
                    parsed = urlsplit(item)
                    route = parsed.path.rstrip("/")
                    assert route in routes, item
                    assert (ROOT / route.lstrip("/") / "index.html").is_file(), item
                    if parsed.fragment:
                        assert unquote(parsed.fragment) in anchors(load(route)) | {"topics", "see-also"}, item
                check(item)
        elif isinstance(value, list):
            for child in value:
                check(child)

    for data in [*(ROOT / "data").rglob("*.json"), ROOT / "index/index.json"]:
        check(json.loads(data.read_text()))


def main():
    assert not (ROOT / "docc/LinkMap.docc").exists()
    for catalog, identifier, display in zip(CATALOGS,
            ["io.github.endsunset.LinkMap.iOS", "io.github.endsunset.LinkMap.Web"], ["iOS", "Web"]):
        info = plistlib.loads((catalog / "Info.plist").read_bytes())
        assert info["CFBundleIdentifier"] == identifier
        assert info["CFBundleDisplayName"] == display
    assert json.loads((ROOT / "theme-settings.json").read_text())["meta"]["title"] == "LinkMap User Guide"
    routes = check_navigation()
    check_redirects()
    check_render_links(routes)
    assert not (SITE / "documentation").exists()
    generated = [page for page in SITE.rglob("index.html") if 'var baseUrl = "/linkmap/"' in page.read_text()]
    assert len(generated) == len(routes)
    for page in generated:
        source = page.read_text()
        assert 'http-equiv="refresh"' not in source, page
        assert 'linkmap-collections' not in source, page
        assert 'aria-label="Documentation collections"' not in source, page
        assert 'data-header-position="inline"' in source, page
    for article in ARTICLES:
        assert not any(term in article.read_text().lower() for term in
                       ("projectzone", "cloudkit", "mapkit", "swiftui", "transaction", "inventory")), article
    for route in routes:
        assert (ROOT / "data" / (route.lstrip("/") + ".json")).is_file(), route
    assert len(list((ROOT / "data/documentation").rglob("*.json"))) + 1 == len(routes)

    missing = []
    pages = [*SITE.rglob("*.html"), ROOT / "docs/index.html"]
    for page in pages:
        parser = References(page.read_text())
        for url in parser.urls:
            resolved = urlsplit(urljoin("https://endsunset.github.io/" + str(page.relative_to(ROOT.parent)), url))
            if resolved.netloc != "endsunset.github.io":
                continue
            path = unquote(resolved.path)
            if path.startswith("/linkmap/"):
                target = ROOT / path.removeprefix("/linkmap/")
            else:
                target = ROOT.parent / path.lstrip("/")
            if not target.is_file() and not (target / "index.html").is_file():
                missing.append(f"{page.relative_to(ROOT)}: {url}")
    assert not missing, "Missing local references:\n" + "\n".join(missing)
    # Site search must retain nested canonical DocC routes after the migration.
    search = References((ROOT.parent / "search/index.html").read_text()).search_urls
    expected_search = {"/linkmap" + route + "/" for route in routes}
    assert expected_search <= set(search), expected_search - set(search)
    assert all(search.count(url) == 1 for url in expected_search)
    print(f"Checked {len(routes)} DocC pages in two independent collections, legacy redirects, and local links.")


if __name__ == "__main__":
    main()
