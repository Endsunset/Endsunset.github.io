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
    return Template((ROOT / 'partials/header.html').read_text()).substitute(project_links=links)


def render_footer(linkmap_prefix=None):
    links = ''
    if linkmap_prefix is not None:
        destinations = [('LinkMap', ''), ('Documentation', 'documentation/'), ('Download for iOS', 'download/'), ('Sign in', 'login/'), ('Account', 'account/'), ('Privacy policy', 'privacy-policy/')]
        links = '<nav class="endsunset-product-links" aria-label="LinkMap destinations">' + ''.join(
            f'<a href="{linkmap_prefix}{path}">{label}</a>' for label, path in destinations) + '</nav>'
    markup = Template((ROOT / 'partials/footer.html').read_text()).substitute(product_links=links)
    return '\n'.join(line.rstrip() for line in markup.splitlines()) + '\n'


def render_assets(prefix='/'):
    return f'<link rel="stylesheet" href="{prefix}assets/styles/site-chrome.css">\n<script src="{prefix}assets/scripts/navigation.js" defer></script>'
