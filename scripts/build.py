"""Generate the homepage, Projects, and search: python3 scripts/build.py."""
import json
import re
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlparse
from site_chrome import render_header, render_footer, render_assets, project_url

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

def project_item(project):
    return f'''<li><a class="project-link" href="{e(project_url(project))}">
      <img src="{e(project['image'])}" alt="" width="128" height="128">
      <span>{e(project['name'])}</span>
    </a></li>'''

content = '''<section class="project-index shell" aria-labelledby="projects-title">
      <div class="project-introduction"><h1 id="projects-title">Projects</h1>
      <p>Explore the things we’re building.</p></div>
      <ul class="project-list">'''
content += ''.join(project_item(project) for project in projects)
content += '</ul></section>'
template = Template((ROOT / 'templates/page.html').read_text())
(ROOT / 'projects').mkdir(exist_ok=True)
(ROOT / 'projects/index.html').write_text(template.substitute(
    title='Endsunset — Projects',
    description='Explore the things we’re building at Endsunset, including LinkMap.',
    page='projects', content=content,
    chrome_assets=render_assets(), header=render_header(),
    footer=render_footer(),
))
print(f'Built Projects with {len(projects)} project(s).')
home_content = '<section aria-labelledby="home-title"><h1 class="visually-hidden" id="home-title">Endsunset</h1>'
home_content += ''.join(showcase(project) for project in projects)
home_content += '</section>'
(ROOT / 'index.html').write_text(template.substitute(
    title='Endsunset',
    description='Discover LinkMap from Endsunset. Plan places, routes, and supplies. Together.',
    page='home', content=home_content, chrome_assets=render_assets(),
    header=render_header(), footer=render_footer(),
))
print(f'Built homepage with {len(projects)} project showcase(s).')

from build_search import build_search
build_search(ROOT)
