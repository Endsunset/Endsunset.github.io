"""Endsunset chrome shared by the domain and child-project generators."""
import json
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def project_url(project):
    url = urlsplit(project['website'])
    return url.path if url.netloc == 'endsunset.github.io' else project['website']


def render_header(*, inline=False):
    projects = json.loads((ROOT / 'content/projects.json').read_text())
    links = ''.join(f'<a href="{escape(project_url(p), quote=True)}">{escape(p["name"])}</a>' for p in projects)
    expansion = Template((ROOT / 'partials/header-expansion.html').read_text()).substitute(project_links=links).rstrip()
    position_attribute = ''
    if inline:
        position_attribute = ' data-header-position="inline"'
    return Template((ROOT / 'partials/header.html').read_text()).substitute(
        expansion=expansion, position_attribute=position_attribute,
    )


def render_footer(product_links=''):
    markup = Template((ROOT / 'partials/footer.html').read_text()).substitute(product_links=product_links)
    return '\n'.join(line.rstrip() for line in markup.splitlines()) + '\n'


def render_assets():
    return '<link rel="stylesheet" href="/assets/styles/site-chrome.css">\n<script src="/assets/scripts/navigation.js" defer></script>'


def render_icons():
    """The same favicon and touch icon for all Endsunset documents."""
    return (ROOT / "partials/icons.html").read_text().strip()


def render_head(*, title, description, page_assets=""):
    """Render the shared head, while allowing page-specific resources."""
    return Template((ROOT / "partials/head.html").read_text()).substitute(
        title=escape(title, quote=True),
        description=escape(description, quote=True),
        icons=render_icons(),
        chrome_assets=render_assets(),
        page_assets=page_assets,
    ).rstrip()


def inject_icons(html):
    """Replace preexisting favicon links, then add the shared site icons."""
    import re
    icon_link = re.compile(
        r"""<link\b(?=[^>]*\brel\s*=\s*["'](?:icon|apple-touch-icon|mask-icon)["'])[^>]*>\s*""",
        re.I,
    )
    if "</head>" not in html:
        return html
    return icon_link.sub("", html).replace("</head>", render_icons() + "\n</head>", 1)
