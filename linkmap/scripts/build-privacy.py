"""Render the policy's headings, paragraphs, and lists without changing its text."""
from pathlib import Path
import html
import re
from site_header import render_header, render_assets
from site_footer import render_footer

root = Path(__file__).resolve().parents[1]

def inline(text):
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    if re.fullmatch(r'https://[^\s<>]+', text):
        text = f'<a href="{text}">{text}</a>'
    return text

blocks = []
for block in (root / 'privacy-policy.md').read_text().strip().split('\n\n'):
    lines = block.splitlines()
    if all(line.startswith('- ') for line in lines):
        blocks.append('<ul>' + ''.join(f'<li>{inline(line[2:])}</li>' for line in lines) + '</ul>')
    elif block.startswith('# '):
        blocks.append(f'<h1>{inline(block[2:])}</h1>')
    elif block.startswith('## '):
        blocks.append(f'<h2>{inline(block[3:])}</h2>')
    else:
        blocks.append(f'<p>{inline(" ".join(lines))}</p>')

output = root / 'privacy-policy'
output.mkdir(exist_ok=True)
(output / 'index.html').write_text('''<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="How LinkMap stores, shares, and handles your data.">
  <title>Privacy Policy | LinkMap</title>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../policy.css">
''' + render_assets() + '''
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
''' + render_header() + '''
  <main id="main" class="docs-main policy-main" tabindex="-1">
''' + '\n'.join(blocks) + '''
  </main>
  ''' + render_footer() + '''
</body>
</html>
''')
print('Rendered privacy-policy/index.html from privacy-policy.md.')
