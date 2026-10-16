"""Copy generated book, lecture and presentation files into protected function assets.

Run after rendering the Quarto book and preparing the existing course assets.
Firebase Hosting explicitly ignores the original generated public directories.
"""
from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1]
for name in ['books','audio','decks']:
 source=root/'public'/name
 if not source.is_dir():raise SystemExit(f'Generate {source} before deployment')
 shutil.copytree(source,root/'functions/assets'/name,dirs_exist_ok=True)
config=(root/'public/firebase-config.js').read_text(encoding='utf-8-sig').split('=',1)[1].strip().rstrip(';')
(root/'functions/content/web-config.json').write_text(json.dumps(json.loads(config)),encoding='utf-8')
print('Prepared private books, audio and PowerPoints. Hosting must keep these directories excluded.')
