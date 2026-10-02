"""Refresh shared headers in every checked-in page."""
import re
from site_header import ROOT, START, END, render_header, render_assets

for page in sorted(ROOT.rglob('index.html')):
    relative = page.relative_to(ROOT)
    # DocC owns every page in its generated output.
    if relative.parts[0] in ('app', 'documentation', 'docs'):
        continue
    source = page.read_text()
    header = render_header()
    pattern = re.escape(START) + r'.*?' + re.escape(END) if START in source else r'<header\b.*?</header>'
    updated, count = re.subn(pattern, lambda _: header, source, count=1, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected a site header in {relative}')
    assets = render_assets()
    if '/assets/styles/site-chrome.css' not in updated:
        updated = updated.replace('</head>', assets + '\n</head>', 1)
    page.write_text(updated)
    print(f'Updated {relative}')
