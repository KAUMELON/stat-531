"""Stage only the rendered textbook and its public reading resources for Pages."""
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parent.parent
source = root / '_book'
target = root / (sys.argv[1] if len(sys.argv) > 1 else 'output/github-pages')
target = target.resolve()
if not target.is_relative_to(root / 'output') or target.exists():
    raise SystemExit('Choose a new staging folder inside output/.')
if not (source / 'index.html').exists():
    raise SystemExit('Render the book with quarto render --to html first.')
target.mkdir(parents=True)
folders = {'assets', 'data', 'images', 'practicals', 'site_libs'}
for item in source.iterdir():
    if item.is_symlink():
        raise SystemExit('Symlink in rendered book: ' + item.name)
    if item.is_file() and (item.suffix in {'.html', '.css'} or item.name == 'search.json'):
        shutil.copy2(item, target / item.name)
    elif item.is_dir() and (item.name in folders or item.name.endswith('_files')):
        if any(p.is_symlink() for p in item.rglob('*')):
            raise SystemExit('Symlink in reading resources: ' + item.name)
        shutil.copytree(item, target / item.name)
(target / '.nojekyll').write_text('', encoding='utf-8')
shutil.copy2(root / 'LICENSE', target / 'LICENSE')
files = [p for p in target.rglob('*') if p.is_file()]
print(f'Staged {len(files)} public book files ({sum(p.stat().st_size for p in files) / 1024**2:.1f} MiB): {target}')
