"""Refresh shared headers in every checked-in page."""
import re
from site_header import ROOT, START, END, render_header

for page in sorted(ROOT.rglob('index.html')):
    relative = page.relative_to(ROOT)
    # DocC owns every page in its generated output.
    if relative.parts[0] in ('documentation', 'docs'):
        continue
    depth = len(relative.parts) - 1
    prefix = '../' * depth if depth else './'
    source = page.read_text()
    header = render_header(prefix,
                           docs=relative.parts[0] == 'documentation',
                           download=relative.parts[0] == 'download',
                           account=relative.parts[0] == 'account')
    pattern = re.escape(START) + r'.*?' + re.escape(END) if START in source else r'<header\b.*?</header>'
    updated, count = re.subn(pattern, lambda _: header, source, count=1, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected a site header in {relative}')
    page.write_text(updated)
    print(f'Updated {relative}')
