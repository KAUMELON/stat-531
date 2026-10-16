"""Package editable Quarto sources and the rendered reading edition."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

out = Path('output')
out.mkdir(exist_ok=True)
with ZipFile(out / 'r-agriculture-quarto-source.zip', 'w', ZIP_DEFLATED) as archive:
    for pattern in ('*.qmd', '*.md', '*.css', '*.Rproj', '_quarto.yml', '.gitignore'):
        for path in Path('.').glob(pattern):
            archive.write(path, path.as_posix())
    for folder in ('assets', 'data', 'images', 'scripts', 'practicals', 'source-notes'):
        for path in Path(folder).rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts:
                archive.write(path, path.as_posix())
with ZipFile(out / 'r-agriculture-html.zip', 'w', ZIP_DEFLATED) as archive:
    for path in Path('_book').rglob('*'):
        if path.is_file():
            archive.write(path, path.relative_to('_book').as_posix())
print('Created editable Quarto source and rendered HTML ZIPs.')
