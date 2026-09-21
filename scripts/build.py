"""Generate the static GitHub Pages site: python3 scripts/build.py."""
import json
import re
from urllib.parse import urlparse
from html import escape
from pathlib import Path
from string import Template

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
template = Template((ROOT / 'templates/page.html').read_text())

def e(value):
    return escape(str(value), quote=True)

def actions(p):
    return f'<div class="actions"><a class="button" href="/projects/{e(p["slug"])}/">Learn more <span aria-hidden="true">↗</span></a><a class="text-link" href="{e(p["website"])}">Visit website <span aria-hidden="true">↗</span></a></div>'

def visual(p):
    return f'<img class="product-visual" src="{e(p["image"])}" alt="{e(p["image_alt"])}" width="1100" height="530">'

def showcase(p):
    return f'''<article class="showcase shell"><div class="section-label"><span>THE PROJECTS</span><span>{e(p['category'])}</span></div>
    <div class="product-heading"><span class="eyebrow">MADE BY ENDSUNSET</span><h2>{e(p['name'])}</h2><p>{e(p['headline']).replace(chr(10), '<br>')}</p>{actions(p)}</div>{visual(p)}</article>'''

def write(path, title, description, page, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(template.substitute(title=e(title), description=e(description), page=page, content=content,
        header=(ROOT / 'partials/header.html').read_text().replace(f'data-nav="{page}"', f'data-nav="{page}" aria-current="{"page" if path in ("index.html", "projects/index.html") else "true"}"'), footer=(ROOT / 'partials/footer.html').read_text()))

home = '''<section class="home-hero"><div class="hero-copy"><p class="eyebrow">INDEPENDENT IDEAS. REAL-WORLD PURPOSE.</p><h1>A little curiosity.<br>A world of possibility.</h1><p class="hero-description">Welcome to Endsunset. A home for thoughtful projects<br class="desktop-break"> that connect ideas with everyday life.</p><a class="button dark" href="/projects/">Explore the projects <span aria-hidden="true">↗</span></a></div><div class="sunset" aria-hidden="true"><div class="sun"></div><div class="horizon"></div></div><div class="hero-note"><span>IDEAS INTO SOMETHING REAL</span><span>SCROLL TO EXPLORE ↓</span></div></section>'''
home += ''.join(showcase(p) for p in projects)
home += '''<section id="about" class="about shell"><p class="eyebrow">THE IDEA BEHIND ENDSUNSET</p><h2>Stay curious.<br>Make something meaningful.</h2><div class="about-copy"><p>Endsunset is a home for independent projects, born from curiosity and built with purpose. Each one explores a different way to make everyday life a little better.</p><a class="text-link" href="https://github.com/Endsunset">Follow the work on GitHub <span aria-hidden="true">↗</span></a></div></section>'''
write('index.html', 'Endsunset — Ideas into something real', 'Thoughtful independent projects by Endsunset. Explore LinkMap and discover ideas with real-world purpose.', 'home', home)
index = '''<section class="page-intro shell"><p class="eyebrow">MADE BY ENDSUNSET</p><h1>Ideas with a purpose.</h1><p>Explore the projects. Find something that connects with you.</p></section>'''
index += ''.join(showcase(p) for p in projects)
write('projects/index.html', 'Projects — Endsunset', 'Explore projects by Endsunset, starting with LinkMap.', 'projects', index)
for p in projects:
    details = ''.join(f'<article><span class="detail-number">0{i}</span><h3>{e(d["title"])}</h3><p>{e(d["text"])}</p></article>' for i, d in enumerate(p['details'], 1))
    content = f'''<div class="product-nav shell"><a href="/projects/">← All projects</a><span>{e(p['name'])}</span><a class="text-link" href="{e(p['website'])}">Visit website ↗</a></div>
    <section class="product-hero shell"><p class="eyebrow">{e(p['category'])}</p><h1>{e(p['name'])}</h1><h2>{e(p['headline']).replace(chr(10), '<br>')}</h2><p class="product-summary">{e(p['summary'])}</p><a class="button" href="{e(p['website'])}">Visit {e(p['name'])} <span aria-hidden="true">↗</span></a>{visual(p)}<p class="image-caption">An illustration of connection. A project built around community.</p></section>
    <section class="product-story shell"><p class="eyebrow">THE PURPOSE</p><h2>{e(p['intro_title'])}</h2><p class="story-copy">{e(p['intro'])}</p><div class="details">{details}</div></section>
    <section class="closing"><p class="eyebrow">TAKE A CLOSER LOOK</p><h2>Meet {e(p['name'])}.</h2><p>Discover the project on its own website.</p><a class="button dark" href="{e(p['website'])}">Visit {e(p['name'])} ↗</a></section>'''
    write(f'projects/{p["slug"]}/index.html', f'{p["name"]} — Endsunset', p['summary'], 'projects', content)
print(f'Built homepage, Projects index, and {len(projects)} product page(s).')
