"""Shared, statically rendered site footer (no deployment build required)."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from site_chrome import render_footer as global_footer

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- site-footer -->'
END = '<!-- /site-footer -->'


def render_footer():
    links = (ROOT / 'components/footer-links.html').read_text().strip()
    markup = global_footer(product_links=links)
    return START + '\n' + markup.rstrip() + '\n' + END
