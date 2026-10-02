"""Shared, statically rendered site header (no deployment build required)."""
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- Shared header: edit components/header.html, then run scripts/build-headers.py -->'
END = '<!-- End shared header -->'


def render_header(site_prefix='./', *, docs=False, account=False, download=False):
    markup = Template((ROOT / 'components/header.html').read_text()).substitute(
        site_prefix=site_prefix,
        download_current=' aria-current="page"' if download else '',
        docs_current=' aria-current="page"' if docs and site_prefix == '../' else (' aria-current="true"' if docs else ''),
        account_current=' aria-current="page"' if account else '')
    return START + '\n' + markup.rstrip() + '\n' + END


def render_auth_scripts(site_prefix='../'):
    return f'''  <link rel="stylesheet" href="{site_prefix}components/notification/notification.css">
  <script src="https://cdn.apple-cloudkit.com/ck/2/cloudkit.js" async></script>
  <script src="{site_prefix}components/notification/notification.js" defer></script>
  <script src="{site_prefix}shared/errors/cloudkit-errors.js" defer></script>
  <script src="{site_prefix}cloudkit-config.js" defer></script>
  <script src="{site_prefix}cloudkit-auth.js" defer></script>'''
