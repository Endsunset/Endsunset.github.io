"""Render the forms catalog and individual pages using the shared site shell."""
import json
import re
from html import escape
from string import Template
from urllib.parse import urlparse


def build_forms(root):
    forms = json.loads((root / 'content/forms.json').read_text())
    template = Template((root / 'templates/page.html').read_text())
    slugs = set()
    for form in forms:
        slug = form['slug']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in slugs:
            raise ValueError(f'Invalid or duplicate form slug: {slug}')
        slugs.add(slug)
        if urlparse(form['url']).scheme != 'https':
            raise ValueError(f'Form URL must use HTTPS: {slug}')
        if not (root / form['image'].lstrip('/')).is_file():
            raise ValueError(f'Missing form image: {slug}')

    def e(value):
        return escape(str(value), quote=True)

    def render(selected=None):
        rows = ''.join(f'<li data-filter-item><a href="/forms/{e(f["slug"])}/"'
                       + (' aria-current="page"' if selected == f else '')
                       + f'><span>{e(f["name"])}</span><span aria-hidden="true">›</span></a></li>' for f in forms)
        home_current = ' aria-current="page"' if selected is None else ''
        sidebar = f'''<div class="forms-toolbar"><button class="sidebar-toggle" aria-controls="forms-sidebar" aria-expanded="true" hidden>☰ <span>Browse forms</span></button><a href="/forms/">Forms</a></div>
<div class="forms-layout">
  <aside class="forms-sidebar" id="forms-sidebar" aria-label="Forms sidebar">
    <div class="sidebar-heading"><span>Forms</span><button class="sidebar-close" aria-label="Close forms sidebar" hidden>×</button></div>
    <nav class="forms-navigation" aria-label="Forms navigation">
      <a class="forms-overview" href="/forms/"{home_current}>All forms</a>
      <p class="sidebar-label">AVAILABLE FORMS</p><ul>{rows}</ul>
    </nav>
    <div class="forms-filter" hidden><label class="visually-hidden" for="form-filter">Filter forms</label><input id="form-filter" type="search" placeholder="Filter forms" autocomplete="off"><p class="filter-status" role="status" hidden></p></div>
  </aside>'''
        if selected:
            title = selected['name']
            body = f'''<p class="eyebrow"><a href="/forms/">All forms</a> <span aria-hidden="true">/</span> Microsoft Forms</p>
<h1>{e(title)}</h1><p class="forms-intro">Open the form to take part, or scan the QR code on another device.</p>
<a class="button" href="{e(selected['url'])}" target="_blank" rel="noopener noreferrer">Open form <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a>
<a class="qr-link" href="{e(selected['url'])}" target="_blank" rel="noopener noreferrer" aria-label="Open {e(title)} in a new tab"><img class="form-qr" src="{e(selected['image'])}" alt="QR code for {e(title)}" width="1890" height="1890"></a>'''
        else:
            title = 'Forms'
            cards = ''.join(f'''<a class="form-card" href="/forms/{e(f['slug'])}/"><span class="eyebrow">MICROSOFT FORMS</span><h2>{e(f['name'])}</h2><span class="card-action">View form <span aria-hidden="true">↗</span></span></a>''' for f in forms)
            body = f'<p class="eyebrow">TAKE PART</p><h1>Forms</h1><p class="forms-intro">A place for questions, ideas, and participation. Find a form below to get started.</p><div class="forms-cards">{cards}</div>'
        content = sidebar + f'<div class="forms-content" id="form-content" tabindex="-1">{body}</div></div>'
        header = (root / 'partials/header.html').read_text().replace('href="/forms/"', 'href="/forms/" aria-current="page"')
        html = template.substitute(title=e(title + ' — Endsunset'), description=e('Browse forms and take part.' if selected is None else 'Take part in ' + title + '.'), page='forms', content=content, header=header, footer=(root / 'partials/footer.html').read_text())
        html = html.replace('</head>', '<link rel="stylesheet" href="/forms/forms.css">\n  <script src="/forms/sidebar.js" defer></script>\n</head>')
        html = html.replace('href="#main"', 'href="#form-content"')
        target = root / 'forms' / (selected['slug'] if selected else '')
        target.mkdir(parents=True, exist_ok=True)
        (target / 'index.html').write_text(html)

    render()
    for form in forms:
        render(form)
    print(f'Built forms homepage with {len(forms)} form(s).')
