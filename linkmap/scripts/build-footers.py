"""Refresh the shared footer in every checked-in page."""
import re
from site_footer import ROOT, START, END, render_footer

for page in sorted(ROOT.rglob('index.html')):
    relative = page.relative_to(ROOT)
    # DocC owns every page in its generated output.
    if relative.parts[0] in ('app', 'documentation', 'docs'):
        continue
    depth = len(relative.parts) - 1
    footer = render_footer('../' * depth if depth else './')
    source = page.read_text().replace("edit components/footer.html", "edit ../partials/footer.html")
    replacement = footer
    if START in source:
        pattern = re.escape(START) + r'.*?' + re.escape(END)
    elif re.search(r'<footer\b', source):
        pattern = r'<footer\b.*?</footer>'
    else:
        pattern = r'(?=</body>)'
        replacement += '\n'
    updated, count = re.subn(pattern, lambda _: replacement, source, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected one footer or body closing tag in {relative}')
    page.write_text(updated)
    print(f'Updated {relative}')
