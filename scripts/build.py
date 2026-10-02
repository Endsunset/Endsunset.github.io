"""Generate the homepage, Projects, search, and Forms: python3 scripts/build.py."""
import json
import re
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlparse
from site_chrome import render_header, render_footer, project_url

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT / 'content/projects.json').read_text())
slugs = set()
for project in projects:
    slug = project['slug']
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in slugs:
        raise ValueError(f'Invalid or duplicate project slug: {slug}')
    slugs.add(slug)
    if urlparse(project['website']).scheme != 'https':
        raise ValueError(f'Project website must use HTTPS: {slug}')
    if not (ROOT / project['image'].lstrip('/')).is_file():
        raise ValueError(f'Missing project image: {slug}')

def e(value):
    return escape(str(value), quote=True)

def showcase(project):
    return f'''<article class="showcase" id="{e(project['slug'])}" aria-labelledby="{e(project['slug'])}-title">
      <div class="product-heading shell">
        <h2 id="{e(project['slug'])}-title">{e(project['name'])}</h2>
        <p>{e(project['summary'])}</p>
        <a class="button" href="{e(project_url(project))}" aria-label="More about {e(project['name'])}">More <span aria-hidden="true">↗</span></a>
      </div>
      <div class="product-stage"><img class="product-icon" src="{e(project['image'])}" alt="{e(project['image_alt'])}" width="320" height="320"></div>
    </article>'''

content = '<section id="projects" aria-labelledby="projects-title"><h1 class="visually-hidden" id="projects-title">Projects</h1>'
content += ''.join(showcase(project) for project in projects)
content += '</section>'
template = Template((ROOT / 'templates/page.html').read_text())
(ROOT / 'projects').mkdir(exist_ok=True)
(ROOT / 'projects/index.html').write_text(template.substitute(
    title='Endsunset — Projects',
    description='Explore LinkMap. Plan service areas, locations, routes, and supplies in one shared map.',
    page='projects', content=content,
    header=render_header(),
    footer=render_footer(),
))
print(f'Built Projects with {len(projects)} project(s).')
(ROOT / 'index.html').write_text(template.substitute(title='Endsunset', description='Endsunset. A new homepage is on the way.', page='home', content='<section class="placeholder shell"><h1>Endsunset</h1><p>A new homepage is on the way.</p><a class="button" href="/projects/">Explore projects</a></section>', header=render_header(), footer=render_footer()))

from build_search import build_search
build_search(ROOT)

from build_forms import build_forms
build_forms(ROOT)
