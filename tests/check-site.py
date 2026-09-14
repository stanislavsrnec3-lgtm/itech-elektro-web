"""Static checks; no network requests and no form submissions."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://itechelektro.cz/'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = []
        self.links = []
        self.images = []
        self.labels = []
        self.nav_links = []
        self.realization_links = []
        self.service_cards = []
        self.in_main_nav = False
        self.section_id = None
        self.canonical = []
        self.h1 = 0
        self.title = ''
        self.description = ''
        self.json_blocks = []
        self.capture = None
        self.buffer = ''
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'nav' and attrs.get('id') == 'main-nav':
            self.in_main_nav = True
        if tag == 'section':
            self.section_id = attrs.get('id')
        if tag == 'a' and self.in_main_nav:
            self.nav_links.append(attrs.get('href', ''))
        if tag == 'a' and self.section_id == 'realizace':
            self.realization_links.append(attrs)
        if tag == 'article' and 'service-card' in attrs.get('class', '').split():
            self.service_cards.append(attrs.get('class'))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('a', 'link') and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag in ('img', 'script') and 'src' in attrs:
            self.links.append(attrs['src'])
        if tag == 'img':
            self.images.append(attrs)
        if tag == 'label' and 'for' in attrs:
            self.labels.append(attrs['for'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = attrs.get('content', '')
        if tag == 'title' or (tag == 'script' and attrs.get('type') == 'application/ld+json'):
            self.capture = tag
            self.buffer = ''

    def handle_data(self, data):
        if self.capture:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag == 'nav':
            self.in_main_nav = False
        if tag == 'section':
            self.section_id = None
        if tag == self.capture:
            if tag == 'script':
                self.json_blocks.append(json.loads(self.buffer))
            else:
                self.title = self.buffer.strip()
            self.capture = None


pages = {p.name: Page(p) for p in ROOT.glob('*.html')}
errors = []
link_count = 0
for name, page in pages.items():
    expected = BASE if name == 'index.html' else BASE + name
    if page.h1 != 1:
        errors.append(f'{name}: expected one H1, got {page.h1}')
    if page.canonical != [expected]:
        errors.append(f'{name}: incorrect canonical {page.canonical}')
    if len(page.ids) != len(set(page.ids)):
        errors.append(f'{name}: duplicate IDs')
    if not page.title or not page.description or not page.json_blocks:
        errors.append(f'{name}: missing metadata')
    if 'main-content' not in page.ids:
        errors.append(f'{name}: missing skip-link target')
    nav_targets = [(urlsplit(link).path, urlsplit(link).fragment) for link in page.nav_links]
    expected_nav = [('index.html', anchor) for anchor in ('rozcestnik', 'realizace', 'o-firme', 'kontakt')]
    if nav_targets != expected_nav:
        errors.append(f'{name}: inconsistent main navigation or separately promoted service')
    for label in page.labels:
        if label not in page.ids:
            errors.append(f'{name}: label target missing: {label}')
    for img in page.images:
        if not all(key in img for key in ('alt', 'width', 'height')):
            errors.append(f'{name}: image missing alt/dimensions: {img.get("src")}')
    for link in page.links:
        resolved = urlsplit(urljoin(BASE + name, link))
        if resolved.scheme not in ('http', 'https') or resolved.netloc != 'itechelektro.cz':
            continue
        path = unquote(resolved.path).lstrip('/') or 'index.html'
        target = ROOT / path
        link_count += 1
        if not target.is_file():
            errors.append(f'{name}: broken local link {link}')
        elif resolved.fragment and path in pages and unquote(resolved.fragment) not in pages[path].ids:
            errors.append(f'{name}: broken fragment {link}')

ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
home = pages['index.html']
review_url = 'https://www.nejremeslnici.cz/profil/72179-stanislav-srnec-itech-elektro#reviews'
review_links = [link for link in home.realization_links if link.get('href') == review_url]
if len(review_links) != 1 or review_links[0].get('target') != '_blank' or not {'noopener', 'noreferrer'}.issubset(review_links[0].get('rel', '').split()):
    errors.append('Homepage: missing or incorrectly configured customer review link beside realizations')
if home.service_cards != ['service-card'] * 6:
    errors.append('Homepage: expected six equally styled service cards')
if 'hvi-hromosvody.html' not in home.links:
    errors.append('Homepage: DEHN service page is no longer linked')
tree = ET.parse(ROOT / 'sitemap.xml')
urls = [e.text for e in tree.findall('s:url/s:loc', ns)]
expected_urls = {BASE if p == 'index.html' else BASE + p for p in pages}
if set(urls) != expected_urls or len(urls) != len(expected_urls):
    errors.append('Sitemap does not contain exactly all site pages')
if len({p.title for p in pages.values()}) != len(pages):
    errors.append('Duplicate page titles')
if len({p.description for p in pages.values()}) != len(pages):
    errors.append('Duplicate page descriptions')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} pages, {link_count} internal links/assets, JSON-LD, unique metadata, labels, image dimensions, shared navigation, equal service cards, reviews link and complete sitemap.')
