# R Programming for Agricultural Data Analysis

**Read the published book:** https://kaumelon.github.io/stat-531/

The public reading edition is deployed from `gh-pages`. Editable Quarto sources are on `codex/quarto-undergraduate-book`. See [PUBLISHING.md](PUBLISHING.md) for publishing updates.

Undergraduate textbook for the supplied seven-module 0+2 practical syllabus, developed from Dr. Pratheesh P. Gopinath's earlier lecture notes. The Quarto edition lives alongside the original bookdown sources and preserves the repository's history. The original rendered book remains in `docs/`; rendering Quarto writes the new edition to `_book/`.

## Open and render

1. Open `agri-r.Rproj` in RStudio. Install R >= 4.1 and Quarto if needed.
2. In the R Console, run `source("scripts/install-packages.R")` once with internet access.
3. Run `source("scripts/check-environment.R")` to check dependencies.
4. In the Terminal, run `quarto render --to html` or `quarto preview`.
5. Open `_book/index.html`. Keep the whole `_book` folder together when sharing the HTML book.

The local CSV and Excel files are ready to use. `source("scripts/generate-data.R")` deliberately recreates simulations with seed 531; it is not needed for ordinary reading or rendering. The book does not download data or install packages during rendering.

Other outputs: `quarto render --to docx`; `quarto render --to pdf` (requires LaTeX). A working report pair is in `practicals/`. The instructor guide, source map, and validation report document the teaching design, migration, and checks actually performed.

## Structure

Fourteen numbered teaching chapters follow seven syllabus modules. The author's detailed original lectures are retained within the chapters, including the illustrated RStudio guide, software discussion, extensive R basics, import and dataset lessons, descriptive statistics, graphics explanations, and full historical time-series examples. New material extends and completes the syllabus. `RETENTION-AUDIT.md` records the directional prose comparison (about 95.5% across nine substantive original lectures); `SOURCE-MAP.md` explains corrections. The original self-assessment tasks are restored in Chapter 2.

Front matter gives a suggested 16-practical sequence and project rubric. Appendices provide a data dictionary, selected solutions, and glossary. Real R datasets and historical series are distinguished from supplied simulations. Unedited original notes remain archived in `source-notes/` with original licence files; no new licence is asserted. Historical time-series CSVs are bundled, so the book does not download them during rendering.

This edition needs the instructor's final subject and institutional review before adoption as a published textbook. It is editable source, not a claim of external peer review. `VALIDATION.md` records which output formats have actually been checked on this machine.

The interactive edition adds current installation screenshots, a serif/blue/gold reading style, and 14 editable browser R laboratories. See INTERACTIVE-EDITION.md. The browser labs use assets/live-r.js; the source ZIP must include assets/ alongside the QMD chapters.
