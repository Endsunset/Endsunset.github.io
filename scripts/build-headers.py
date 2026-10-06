"""Refresh only shared header chrome, including generated DocC pages.

Run after editing the header partials without rebuilding page content.
"""
import re
from site_chrome import ROOT, render_header

# Include the backdrop and spacer owned by the header component.
PATTERN = re.compile(
    r'<header class="endsunset-header".*?</header>'
    r'\s*<div class="endsunset-backdrop"[^>]*></div>'
    r'\s*<div class="endsunset-header-spacer"[^>]*></div>',
    re.S,
)


def main():
    header = render_header().rstrip()
    count = 0
    for page in sorted(ROOT.rglob('index.html')):
        source = page.read_text()
        if '<header class="endsunset-header"' not in source:
            continue
        updated, matches = PATTERN.subn(lambda _: header, source)
        if matches != 1:
            raise ValueError(f'Expected one complete shared header in {page.relative_to(ROOT)}')
        if updated != source:
            page.write_text(updated)
        count += 1
    print(f'Refreshed shared headers in {count} pages.')


if __name__ == '__main__':
    main()
