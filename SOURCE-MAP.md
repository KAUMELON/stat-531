# Source-to-Quarto editorial map

Original project: `F:/PERMANENT ASSETS/MeLON/PG/stat-531/stat-531`.
New edition: `C:/Users/user/Documents/ChatGPT/Books Online`.

All original root Rmd files were read during development, together with the assessment R scripts. Copies are preserved in `source-notes/`. The book is substantively rewritten for undergraduates rather than mechanically renamed.

| Original source | Use in new edition |
|---|---|
| `index.Rmd`, `01.rmd` | Author attribution, emphasis on statistical understanding, new preface and course guide; obsolete syllabus replaced |
| `02.Rmd`, `03.Rmd` | Introduction to statistical computing and R/RStudio; focused and rewritten in Chapter 1 |
| `04.Rmd` | Arithmetic, assignment, vectors, matrices, data frames, indexing, apply concepts; rewritten in Chapters 1–2 with agricultural units, lists, safe functions, and explicit column references |
| `05.Rmd` | Installation versus loading packages; Chapter 1; obsolete biocLite instructions removed |
| `06.Rmd` | Rectangular data entry, CSV import/export, structure inspection; Chapter 3; Excel moved to readxl/writexl, treatment labels kept as columns |
| `07.Rmd` | Built-in datasets and help; PlantGrowth, iris, and Orange used with documented meanings rather than unrelated examples |
| `08.Rmd` | Centre, spread, frequency tables, missing values, functions; Chapter 7; max() corrected, statistical mode separated from mode(), safer class coverage |
| `09.Rmd` | Temperature barplot, colours, boxplot; Chapter 6; labels and whisker explanation corrected, ggplot2, panels, heatmaps, density and interaction added |
| `10.Rmd`, `rain.csv` | Time order, ts frequency, smoothing, decomposition, forecasting; Chapter 10 rebuilt with local agricultural simulation, ARIMA, chronological holdout, baseline and diagnostics |
| `self_assesment/SA1/*.R` | Arithmetic, vector membership, indexing, data export exercises adapted in Chapters 1–3 and solutions; unsafe statement ordering corrected |
| Import/self-assessment DOCX files | Preserved as supplementary author assets; new textbook uses the inspectable Rmd and R sources rather than claiming a DOCX-derived transcription |
| `images/` | Preserved with archived notes; dated screenshots are not used as current installation instructions |

New substantive content: Chapters 4–5 (cleaning and wrangling), Chapter 8 (EDA case study), Chapter 9 (growth), Chapters 11–13 (inference, ANOVA, regression), Chapter 14 (reporting), local datasets, exercises, selected solutions, rubric, and instructor guidance.

Original notes include external links and a separately authored time-series PDF. These are not represented as newly authored source material. Original licence and bibliography files are archived unchanged. No automatic public deployment or licence change has been performed.
