"""Build a static directory enhanced with local, private search."""
import json
from html import escape
from string import Template
from site_chrome import render_header, render_footer, render_assets, project_url


def build_search(root):
    entries = [dict(title='Endsunset', url='/', summary='Endsunset home'), dict(title='Projects', url='/projects/', summary='Explore Endsunset projects')]
    for project in json.loads((root / 'content/projects.json').read_text()):
        entries.append(dict(title=project['name'], url=project_url(project), summary=project['summary']))
    for title, path, summary in [('Download LinkMap', 'download/', 'Get LinkMap for iPhone'), ('LinkMap privacy policy', 'privacy-policy/', 'Storage, sharing, and deletion')]:
        entries.append(dict(title=title, url='/linkmap/' + path, summary=summary))
    for data in sorted((root / 'linkmap/data').rglob('*.json')):
        article = json.loads(data.read_text())
        path = article.get('identifier', {}).get('url', '')
        if article.get('kind') == 'article' and '/documentation' in path:
            route = '/documentation' + ('/' + data.stem if data.parent.name == 'documentation' else '')
            entries.append(dict(title=article['metadata']['title'], url='/linkmap' + route + '/', summary='LinkMap documentation'))
    rows = ''.join(f'<li data-search-entry><a href="{escape(e["url"], quote=True)}">{escape(e["title"])}</a><p>{escape(e["summary"])}</p></li>' for e in entries)
    content = f'''<section class="search-page shell"><h1>Search Endsunset</h1><p>Find projects and documentation.</p><div id="site-search-controls" hidden><label for="site-search">Search this site</label><input id="site-search" type="search" autocomplete="off" placeholder="Search LinkMap, documentation…"><p id="search-status" role="status"></p></div><ul class="search-results">{rows}</ul></section>'''
    page = Template((root / 'templates/page.html').read_text()).substitute(title='Search — Endsunset', description='Search Endsunset projects and documentation.', page='search', content=content, chrome_assets=render_assets(), header=render_header(), footer=render_footer())
    page = page.replace('</head>', '<script src="/assets/scripts/search.js" defer></script>\n</head>')
    (root / 'search').mkdir(exist_ok=True)
    (root / 'search/index.html').write_text(page)
    print(f'Built search with {len(entries)} destinations.')
