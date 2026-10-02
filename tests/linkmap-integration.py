"""Check the parent static site and LinkMap's /linkmap/ deployment paths."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "linkmap"
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
            target in [ROOT / "index.html", ROOT / "projects/index.html", ROOT / "search/index.html"]
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
             ROOT / "redirect_wechat.html"]
    for page in pages:
        for url in Page(page.read_text()).urls:
            check_url(page, url, fragments=True)
    for style in [*PROJECT.rglob("*.css"), *(ROOT / "assets").rglob("*.css")]:
        for url in re.findall(r"url\(\s*['\"]?([^)'\"\s]+)", style.read_text()):
            check_url(style, url)
    for module in (PROJECT / "app").glob("*.js"):
        for url in re.findall(r'from\s+["\']([^"\']+)', module.read_text()):
            check_url(module, url)

    # Authentication and website chrome have distinct page scopes.
    assert "linkmap" in {p.name for p in ROOT.iterdir()}
    assert "LinkMap" not in {p.name for p in ROOT.iterdir()}
    assert not (PROJECT / "login").exists()
    assert not (PROJECT / "account").exists()
    entry = (PROJECT / "index.html").read_text()
    assert 'http-equiv="refresh"' not in entry
    assert 'href="https://endsunset.github.io/linkmap/"' in entry
    assert 'href="app/">Open web app</a>' in entry
    for page in pages:
        source = page.read_text()
        in_app = page.is_relative_to(PROJECT / "app")
        if in_app:
            assert "endsunset-header" not in source and "endsunset-footer" not in source
            assert "cloudkit-auth.js" in source and "cloudkit-config.js" in source
        else:
            assert not re.search(r"cloudkit(?:-auth|-config|\.js)|apple-sign-(?:in|out)-button|data-account-link|data-header-sign-in", source), page
            assert not any("/sign-in/" in url or "login/" in url or "account/" in url for url in Page(source).urls), page
        # Redirects intentionally have no website chrome.
        if not in_app and 'http-equiv="refresh"' not in source and page not in [ROOT / "redirect.html", ROOT / "redirect_wechat.html"]:
            assert "endsunset-header" in source and "endsunset-footer" in source, page
    assert 'id="apple-sign-out-button"' in (PROJECT / "app/account/index.html").read_text()
    assert 'id="apple-sign-in-button"' in (PROJECT / "app/sign-in/index.html").read_text()

    assert 'href="account/"' in (PROJECT / "app/index.html").read_text()

    # DocC JSON paths are relative to its /linkmap/ hosting base at runtime.
    for data in [*(PROJECT / "data").rglob("*.json"), PROJECT / "index" / "index.json"]:
        def check(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key in ("url", "path") and isinstance(item, str) and item.startswith("/documentation"):
                        check_url(PROJECT / "index.html", "/linkmap" + item)
                    check(item)
            elif isinstance(value, list):
                for item in value:
                    check(item)
        check(json.loads(data.read_text()))
    print(f"Checked {len(pages)} pages, CSS assets, app imports, DocC routes, and repository metadata.")


if __name__ == "__main__":
    main()
