"""Shared, statically rendered site footer (no deployment build required)."""
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- Shared footer: edit components/footer.html, then run scripts/build-footers.py -->'
END = '<!-- End shared footer -->'


def render_footer(site_prefix='./'):
    markup = Template((ROOT / 'components/footer.html').read_text()).substitute(
        site_prefix=site_prefix)
    return START + '\n' + markup.rstrip() + '\n' + END
