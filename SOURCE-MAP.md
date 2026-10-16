# Source-to-Quarto editorial map

Original project: `F:/PERMANENT ASSETS/MeLON/PG/stat-531/stat-531`.
New edition: `C:/Users/user/Documents/ChatGPT/Books Online`.

The revised reading chapters retain the author's original lecture text, examples, and illustrations. The previous condensed draft is preserved locally in `qa/first-draft/`, not used as a replacement for those lectures. Unedited originals remain in `source-notes/`. `RETENTION-AUDIT.md` records about 95.5% matching prose across the nine substantive lectures, excluding code; this is a traceability measure rather than a quality score.

| Original source | Use in new edition |
|---|---|
| `index.Rmd`, `01.rmd` | Author attribution, statistical emphasis, and preface carried forward; superseded syllabus replaced by the supplied seven-module undergraduate syllabus. |
| `02.Rmd`, `03.Rmd` | Chapter 1 retains the detailed statistical-software overview, R/RStudio explanations, all four panes, illustrated Windows installation sequence, and original screenshots. Historical product descriptions and release numbers are identified as context. The statement discouraging programming is updated to fit this course. |
| `04.Rmd` | Chapter 2 retains arithmetic, functions, assignment, vectors, indexing, extensive matrix operations, data frames, selection, extending tables, and apply examples. Original worked commands remain; lists and agricultural functions extend them. The data-frame class comment and attach cleanup are corrected. |
| `05.Rmd` | Chapter 1 retains packages, repositories, installation/loading/update distinctions, GitHub examples, and illustrated installation steps. BiocManager replaces obsolete biocLite instructions. Failed require() calls are not described as successful loading. |
| `06.Rmd` | Chapter 3 retains spreadsheet preparation, naming conventions, CSV discussion, illustrated save/import steps, import commands, variable selection, attach/detach, str, and View. Identifiers are corrected to ordinary columns. readxl/writexl extend the original optional xlsx example. |
| `07.Rmd` | Chapter 3 retains the original walkthrough of mtcars, iris, ToothGrowth, PlantGrowth, and USArrests. The guinea-pig description is corrected; treatment meanings are not invented. |
| `08.Rmd` | Chapter 7 retains the iris walkthrough, function table, centre/spread, sapply, pastecs, missing values, household frequency example, cumulative frequencies, Sturges-rule construction, and reusable-function lesson. max(), statistical mode, and class-boundary coverage are corrected. |
| `09.Rmd` | Chapter 6 retains the temperature barplot, customization, colour theory/table/picker illustration, and boxplot illustration/explanation. Axis labels and fences/whiskers are corrected. Missing base-R histogram, scatter, pie, and boxplot examples are completed before ggplot2. |
| `10.Rmd`, `rain.csv` | Chapter 10 retains the full kings, births, souvenir, and rainfall walkthrough: ts setup, plotted interpretations, transformation, moving averages, decomposition, seasonal adjustment, smoothing formulas, and rainfall fit. Local historical CSVs replace live scan calls. Seasonal indexing and fitted-versus-future language are corrected. Agricultural ARIMA and holdout evaluation follow the original lesson. |
| `self_assesment/SA1/*.R` | Arithmetic, vector membership, indexing, data export exercises adapted in Chapters 1–3 and solutions; unsafe statement ordering corrected |
| `self assesment1.docx` | Read directly; its eleven tasks are restored in Chapter 2 with clarifications about units, filtering, and numeric versus categorical summaries. |
| `Importing data files in R.docx` | Read directly; its preparation and CSV-import content overlaps 06.Rmd and is retained through Chapter 3 rather than duplicated. |
| `images/` | Original installation, data-import, colour, and boxplot illustrations are restored in the reading edition. Dated interfaces are identified and path capitalization is repaired for hosting. |

New substantive content in Chapters 4–5 (cleaning/wrangling), Chapter 8 (EDA), Chapter 9 (growth), Chapters 11–13 (inference/ANOVA/regression), and Chapter 14 (reporting) is expanded with explanations, worked calculations, interpretation, design limitations, and practice. Supporting datasets, solutions, rubric, glossary, and instructor guidance remain.

Technical migration includes unique chunk names, Quarto cross-references, callouts replacing bookdown block2 chunks, portable local data reads, and actual image filename capitalization. The original archive is unedited. Original licence, bibliography, and source attributions remain; no new licence is asserted. The separately authored time-series PDF is not represented as newly authored textbook content. Sites publication is recorded in PUBLISHING.md; no GitHub Pages publication is claimed.
