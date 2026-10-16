# R Programming for Agricultural Data Analysis

Undergraduate textbook for the supplied seven-module 0+2 practical syllabus, developed from Dr. Pratheesh P. Gopinath's earlier lecture notes. This is a separate Quarto project; the original bookdown checkout is unchanged.

## Open and render

1. Open `agri-r.Rproj` in RStudio. Install R >= 4.1 and Quarto if needed.
2. In the R Console, run `source("scripts/install-packages.R")` once with internet access.
3. Run `source("scripts/check-environment.R")` to check dependencies.
4. In the Terminal, run `quarto render --to html` or `quarto preview`.
5. Open `_book/index.html`. Keep the whole `_book` folder together when sharing the HTML book.

The local CSV and Excel files are ready to use. `source("scripts/generate-data.R")` deliberately recreates simulations with seed 531; it is not needed for ordinary reading or rendering. The book does not download data or install packages during rendering.

Other outputs: `quarto render --to docx`; `quarto render --to pdf` (requires LaTeX). A working report pair is in `practicals/`. The instructor guide, source map, and validation report document the teaching design, migration, and checks actually performed.

## Structure

Fourteen numbered teaching chapters follow seven syllabus modules. Front matter gives a suggested 16-practical sequence and project rubric. Appendices provide a data dictionary and selected solutions. Real R datasets are distinguished from supplied simulations. Original notes are archived in `source-notes/` with original licence files; no new licence is asserted.

This edition needs the instructor's final subject and institutional review before adoption as a published textbook. It is editable source, not a claim of external peer review. `VALIDATION.md` records which output formats have actually been checked on this machine.
