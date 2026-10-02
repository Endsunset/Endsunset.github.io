"""Shared, statically rendered site footer (no deployment build required)."""
from pathlib import Path
from html import escape
from string import Template
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from site_chrome import render_footer as global_footer

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- Shared footer: edit ../partials/footer.html, then run scripts/build-footers.py -->'
END = '<!-- End shared footer -->'


def render_footer(site_prefix='./'):
    links = Template((ROOT / 'components/footer-links.html').read_text()).substitute(
        site_prefix=escape(site_prefix, quote=True)
    ).strip()
    markup = global_footer(product_links=links)
    return START + '\n' + markup.rstrip() + '\n' + END
