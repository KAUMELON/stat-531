"""Execute each self-contained browser exercise in a fresh R process."""
from pathlib import Path
import re
import subprocess
import tempfile
import os

rscript = os.environ.get('BOOK_RSCRIPT', 'Rscript')
count = 0
for chapter in sorted(Path('.').glob('[0-9][0-9]*-*.qmd')):
    text = chapter.read_text(encoding='utf-8')
    block = text.split('::: {.live-r}', 1)[1].split('\n:::', 1)[0]
    code = re.search(r'```r\n(.*?)\n```', block, re.S).group(1)
    with tempfile.TemporaryDirectory() as directory:
        script = Path(directory) / 'exercise.R'
        script.write_text('options(warn = 2)\npdf(file = NULL)\n' + code, encoding='utf-8')
        result = subprocess.run([rscript, '--vanilla', str(script)], cwd=directory,
                                capture_output=True, text=True)
    if result.returncode:
        raise SystemExit(chapter.name + '\n' + result.stderr)
    count += 1
    print(f'PASS {chapter.name}')
print(f'{count} independent live exercises passed.')
