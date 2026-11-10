"""Refresh shared favicon links in checked-in HTML, including specialized pages."""
from site_chrome import ROOT, inject_icons


def refresh_head_icons(root=ROOT):
    count = 0
    for page in sorted(root.rglob("*.html")):
        if page.is_relative_to(root / "partials") or page.is_relative_to(root / "templates"):
            continue
        old = page.read_text()
        new = inject_icons(old)
        if old != new:
            page.write_text(new)
            count += 1
    return count


if __name__ == "__main__":
    print(f"Refreshed icons in {refresh_head_icons()} HTML documents.")
