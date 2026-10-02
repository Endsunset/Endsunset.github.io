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
    return START + '\n' + markup.rstrip() + '\n' + END
