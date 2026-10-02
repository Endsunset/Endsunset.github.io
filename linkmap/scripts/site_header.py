"""Shared, statically rendered site header (no deployment build required)."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from site_chrome import render_header as global_header, render_assets

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- site-header -->'
END = '<!-- /site-header -->'


def render_header():
    return START + '\n' + global_header().rstrip() + '\n' + END
