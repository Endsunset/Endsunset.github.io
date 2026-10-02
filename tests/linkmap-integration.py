"""Check the parent static site and LinkMap's /LinkMap/ deployment paths."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "LinkMap"
ORIGIN = "https://endsunset.github.io"


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.urls = []
        self.ids = set()
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.ids.update([attrs["id"]] if "id" in attrs else [])
        self.urls.extend(attrs[key] for key in ("href", "src", "action") if key in attrs)
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.urls.append(attrs["content"].split("url=", 1)[1])


def check_url(source, url, *, fragments=False):
    resolved = urlsplit(urljoin(f"{ORIGIN}/{source.relative_to(ROOT)}", url))
    if resolved.scheme != "https" or resolved.netloc != "endsunset.github.io":
        return
    path = unquote(resolved.path).lstrip("/")
    target = ROOT / path
    if target.is_dir():
        target /= "index.html"
    assert target.is_file(), f"{source.relative_to(ROOT)}: missing {url}"
    if source.is_relative_to(PROJECT):
        assert target.resolve().is_relative_to(PROJECT) or (
            target.resolve().is_relative_to(ROOT / "assets") or
            target in [ROOT / "index.html", ROOT / "projects/index.html", ROOT / "search/index.html", ROOT / "forms/index.html"]
        ), f"Unexpected LinkMap destination: {url}"
    if fragments and resolved.fragment and target.suffix == ".html":
        # DocC renders article headings at runtime from its JSON data.
        if target.is_relative_to(PROJECT / "documentation"):
            return
        assert unquote(resolved.fragment) in Page(target.read_text()).ids, (
            f"{source.relative_to(ROOT)}: missing fragment {url}"
        )


def main():
    assert (ROOT / ".git").exists()
    assert (ROOT / ".nojekyll").is_file()
    assert (PROJECT / "AGENTS.md").is_file()
    assert (PROJECT / "README.md").is_file()
    for directory in [PROJECT, *[p for p in PROJECT.rglob("*") if p.is_dir()]]:
        for name in (".git", ".gitmodules", ".github", ".nojekyll", ".gitignore", "CNAME", "_config.yml"):
            assert not (directory / name).exists(), f"Conflicting child metadata: {directory / name}"

    pages = [*PROJECT.rglob("index.html"), ROOT / "index.html", ROOT / "projects/index.html", ROOT / "search/index.html", ROOT / "redirect.html",
             ROOT / "redirect_wechat.html", *(ROOT / "forms").rglob("*.html")]
    for page in pages:
        for url in Page(page.read_text()).urls:
            check_url(page, url, fragments=True)
    for style in [*PROJECT.rglob("*.css"), *(ROOT / "assets").rglob("*.css"),
                  *(ROOT / "forms").rglob("*.css")]:
        for url in re.findall(r"url\(\s*['\"]?([^)'\"\s]+)", style.read_text()):
            check_url(style, url)
    for module in (PROJECT / "app").glob("*.js"):
        for url in re.findall(r'from\s+["\']([^"\']+)', module.read_text()):
            check_url(module, url)

    # DocC JSON paths are relative to its /LinkMap/ hosting base at runtime.
    for data in [*(PROJECT / "data").rglob("*.json"), PROJECT / "index" / "index.json"]:
        def check(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key in ("url", "path") and isinstance(item, str) and item.startswith("/documentation"):
                        check_url(PROJECT / "index.html", "/LinkMap" + item)
                    check(item)
            elif isinstance(value, list):
                for item in value:
                    check(item)
        check(json.loads(data.read_text()))
    print(f"Checked {len(pages)} pages, CSS assets, app imports, DocC routes, and repository metadata.")


if __name__ == "__main__":
    main()
