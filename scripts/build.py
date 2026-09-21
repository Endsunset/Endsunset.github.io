"""Generate the static homepage: python3 scripts/build.py."""
import json
import re
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlparse

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
        raise ValueError(f'Missing illustration: {slug}')

def e(value):
    return escape(str(value), quote=True)

def showcase(project):
    return f'''<article class="showcase shell" id="{e(project['slug'])}" aria-labelledby="{e(project['slug'])}-title">
      <div class="product-heading">
        <h2 id="{e(project['slug'])}-title">{e(project['name'])}</h2>
        <p>{e(project['summary'])}</p>
        <a class="button" href="{e(project['website'])}">Visit {e(project['name'])} <span aria-hidden="true">↗</span></a>
      </div>
      <img class="product-visual" src="{e(project['image'])}" alt="{e(project['image_alt'])}" width="1100" height="530">
    </article>'''

content = '<section id="projects" aria-labelledby="projects-title"><h1 class="section-title shell" id="projects-title">Projects</h1>'
content += ''.join(showcase(project) for project in projects)
content += '</section>'
template = Template((ROOT / 'templates/page.html').read_text())
(ROOT / 'index.html').write_text(template.substitute(
    title='Endsunset — Projects',
    description='Explore LinkMap, a project for organizing feeding activities for people experiencing homelessness.',
    page='home', content=content,
    header=(ROOT / 'partials/header.html').read_text(),
    footer=(ROOT / 'partials/footer.html').read_text(),
))
print(f'Built homepage with {len(projects)} project(s).')
