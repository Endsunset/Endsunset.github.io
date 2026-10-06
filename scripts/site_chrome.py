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


def render_header():
    projects = json.loads((ROOT / 'content/projects.json').read_text())
    links = ''.join(f'<a href="{escape(project_url(p), quote=True)}">{escape(p["name"])}</a>' for p in projects)
    expansion = Template((ROOT / 'partials/header-expansion.html').read_text()).substitute(project_links=links).rstrip()
    return Template((ROOT / 'partials/header.html').read_text()).substitute(expansion=expansion)


def render_footer(product_links=''):
    markup = Template((ROOT / 'partials/footer.html').read_text()).substitute(product_links=product_links)
    return '\n'.join(line.rstrip() for line in markup.splitlines()) + '\n'


def render_assets():
    return '<link rel="stylesheet" href="/assets/styles/site-chrome.css">\n<script src="/assets/scripts/navigation.js" defer></script>'
