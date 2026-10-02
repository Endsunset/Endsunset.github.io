"""Shared, statically rendered site header (no deployment build required)."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from site_chrome import render_header as global_header, render_assets

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- Shared header: edit ../partials/header.html, then run scripts/build-headers.py -->'
END = '<!-- End shared header -->'


def render_header(site_prefix='./', *, docs=False, account=False, download=False):
    markup = render_assets() + "\n" + global_header()
    markup += f'\n<script src="{site_prefix}product-navigation.js" defer></script>'
    return START + '\n' + markup.rstrip() + '\n' + END


def render_auth_scripts(site_prefix='../'):
    return f'''  <link rel="stylesheet" href="{site_prefix}components/notification/notification.css">
  <script src="https://cdn.apple-cloudkit.com/ck/2/cloudkit.js" async></script>
  <script src="{site_prefix}components/notification/notification.js" defer></script>
  <script src="{site_prefix}shared/errors/cloudkit-errors.js" defer></script>
  <script src="{site_prefix}cloudkit-config.js" defer></script>
  <script src="{site_prefix}cloudkit-auth.js" defer></script>'''
