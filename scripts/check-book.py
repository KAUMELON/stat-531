"""Check the rendered book's local links, anchors, images and unresolved references."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_book').resolve()

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = set()
        self.links = []
        self.images = 0
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag in ('img', 'script') and 'src' in attrs:
            self.links.append(attrs['src'])
        if tag == 'img':
            self.images += 1

pages = {p.resolve(): Page(p) for p in root.glob('*.html')}
errors = []
for source in Path('.').glob('*.qmd'):
    if not (root / (source.stem + '.html')).exists():
        errors.append(f'Missing rendered chapter: {source.stem}.html')
for path, page in pages.items():
    text = path.read_text(encoding='utf-8')
    if 'quarto-unresolved-ref' in text:
        errors.append(f'{path.name}: unresolved cross-reference')
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = (root / unquote(url.path).lstrip('/')) if url.path.startswith('/') else (path.parent / unquote(url.path))
        if not url.path:
            target = path
        if target.is_dir():
            target = target / 'index.html'
        target = target.resolve()
        if not target.exists():
            errors.append(f'{path.name}: missing {link}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{path.name}: missing anchor {link}')
report = dict(pages=len(pages), images=sum(p.images for p in pages.values()), errors=errors)
Path('outputs').mkdir(exist_ok=True)
Path('outputs/book-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
raise SystemExit(bool(errors))
