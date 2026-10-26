"""Check the checked-in LinkMap DocC library under the /linkmap/ base path."""

from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "documentation"
LANDING = SITE / "linkmap"
CATALOG = ROOT / "docc" / "LinkMap.docc"


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.urls.extend(attributes[key] for key in ("href", "src") if key in attributes)


def children(node):
    return {item["title"]: item for item in node.get("children", []) if item.get("path")}


def check_navigation():
    index = json.loads((ROOT / "index" / "index.json").read_text())
    assert index["includedArchiveIdentifiers"] == ["io.github.endsunset.LinkMap"]
    [library] = index["interfaceLanguages"]["swift"]
    assert library["path"] == "/documentation"
    expected = {
        "Get started": ["How LinkMap Works", "Basic Workflow"],
        "Projects and places": ["Project", "Map", "Locations", "Regions and Layers"],
        "Plan and follow work": ["Activities", "Routes and Stops", "Assignments"],
        "Share and sync": ["Sharing", "iCloud", "Maps"],
    }
    assert library["title"] == "LinkMap User Guide"
    assert [(entry["type"], entry["title"]) for entry in library["children"]] == [
        ("groupMarker", "Choose your platform"),
        ("collection", "LinkMap for iOS"),
        ("article", "LinkMap for Web"),
    ]
    platforms = children(library)
    ios = platforms["LinkMap for iOS"]
    web = platforms["LinkMap for Web"]
    assert ios["path"] == "/documentation/ios-platform"
    assert web["path"] == "/documentation/web-platform"
    assert not children(web)
    groups = {}
    for entry in ios["children"]:
        if entry["type"] == "groupMarker":
            group = entry["title"]
            groups[group] = []
        else:
            groups[group].append(entry["title"])
            assert not children(entry), f"Unexpected nested curation: {entry['title']}"
    assert list(groups) == list(expected)
    assert groups == expected

    # Each authored page must have one curated path, including the iOS children.
    def paths(node):
        yield node["path"]
        for child in node.get("children", []):
            if child.get("path"):
                yield from paths(child)

    curated = list(paths(library))
    assert len(curated) == len(set(curated)) == len(list(CATALOG.glob("*.md")))
    landing = json.loads((ROOT / "data" / "documentation.json").read_text())
    ios_data = json.loads((ROOT / "data" / "documentation" / "ios-platform.json").read_text())
    web_data = json.loads((ROOT / "data" / "documentation" / "web-platform.json").read_text())
    assert landing["metadata"]["role"] == "collection"
    assert ios_data["metadata"]["role"] == "collectionGroup"
    for collection in (landing, ios_data):
        assert collection["metadata"]["roleHeading"] == "User Guide"
    assert [section["title"] for section in landing["topicSections"]] == ["Choose your platform"]
    assert [landing["references"][identifier]["title"]
            for identifier in landing["topicSections"][0]["identifiers"]] == list(platforms)
    assert [section["title"] for section in ios_data["topicSections"]] == list(expected)
    for section in ios_data["topicSections"]:
        assert [ios_data["references"][identifier]["title"]
                for identifier in section["identifiers"]] == expected[section["title"]]
    for article in children(ios).values():
        data = json.loads((ROOT / "data" / (article["path"].lstrip("/") + ".json")).read_text())
        assert data["hierarchy"]["paths"] == [[landing["identifier"]["url"], ios_data["identifier"]["url"]]]
    assert "still under development" in web_data["abstract"][0]["text"]
    assert not web_data.get("topicSections")


def main():
    check_navigation()
    assert not (SITE / "documentation").exists(), "Duplicated documentation/documentation output"
    assert 'var baseUrl = "/linkmap/"' in (SITE / "index.html").read_text()
    assert 'http-equiv="refresh"' not in (SITE / "index.html").read_text()
    landing = LANDING / "index.html"
    assert landing.is_file()
    assert 'url=../' in landing.read_text()
    assert len([page for page in SITE.rglob("index.html") if 'var baseUrl = "/linkmap/"' in page.read_text()]) == len(list(CATALOG.glob("*.md")))
    assert (ROOT / "data" / "documentation.json").is_file()
    assert not (ROOT / "data" / "documentation" / "linkmap.json").exists()
    assert not (SITE / "linkmap" / "essentials").exists()
    assert 'url=../ios-platform/' in (SITE / "ios" / "index.html").read_text()
    assert 'url=../web-platform/' in (SITE / "web" / "index.html").read_text()
    for former, destination in {
        "essentials": "how-linkmap-works",
        "using-linkmap-for-ios": "ios-platform",
        "using-linkmap-on-web": "web-platform",
        "sign-in": "web-platform",
        "explore-projects": "web-platform",
        "search-and-coordinates": "web-platform",
    }.items():
        assert f'url=../{destination}/' in (SITE / former / "index.html").read_text()
        assert not (ROOT / "data" / "documentation" / f"{former}.json").exists()
    assert not (ROOT / "data" / "documentation" / "ios.json").exists()
    assert not (ROOT / "data" / "documentation" / "web.json").exists()
    assert not any(path.stem in {"reference", "resource-workflows", "ios-cloudkit", "mapkit-js",
                                  "shared-concepts", "projects-and-activities", "places-and-routes",
                                  "collaboration", "platforms", "handbook", "ios-handbook", "web-handbook"}
                   for path in (ROOT / "data" / "documentation").glob("*.json"))
    assert len(list((ROOT / "data" / "documentation").glob("*.json"))) + 1 == len(list(CATALOG.glob("*.md")))
    for article in CATALOG.glob("*.md"):
        assert not any(term in article.read_text().lower() for term in
                       ("projectzone", "cloudkit", "mapkit", "swiftui", "transaction", "inventory")), article
    for data_file in [*(ROOT / "data").rglob("*.json"), ROOT / "index" / "index.json"]:
        assert "/documentation/linkmap" not in data_file.read_text(), data_file
    for entry in (ROOT / "data" / "documentation").glob("*.json"):
        assert (SITE / entry.stem / "index.html").is_file(), entry

    missing = []
    pages = [*SITE.rglob("*.html"), ROOT / "docs" / "index.html"]
    for page in pages:
        parser = References()
        parser.feed(page.read_text())
        for url in parser.urls:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc:
                continue
            path = unquote(parsed.path)
            if not path:
                continue
            if path.startswith("/linkmap/"):
                target = ROOT / path.removeprefix("/linkmap/")
            elif path.startswith("/"):
                continue
            else:
                target = page.parent / path
            if not target.exists() and not (target / "index.html").is_file():
                missing.append(f"{page.relative_to(ROOT)}: {url}")
    assert not missing, "Missing local references:\n" + "\n".join(missing)
    print(f"Checked {len(pages)} pages, one curated navigator, and local references.")


if __name__ == "__main__":
    main()
