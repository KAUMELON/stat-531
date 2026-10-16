# Validation record

Teaching edition developed on 16 October 2026, Asia/Calcutta.

## Environment

- Windows, R 4.5.2, Quarto 1.6.39.
- knitr 1.51, rmarkdown 2.30, dplyr 1.1.4, tidyr 1.3.2, ggplot2 4.0.1.
- readxl 1.4.5, writexl 1.5.4, patchwork 1.3.2, plotly 4.11.0, forecast 9.0.0.
- `scripts/check-environment.R` found every required package.

## Checks performed

- Generated every local teaching CSV and the Excel workbook successfully with `scripts/generate-data.R` and seed 531.
- Rendered the complete 20-page HTML site from the Quarto source, executing the evaluated R chunks. Here “page” means an HTML chapter/document, not a printed sheet.
- Checked chapter availability, local hyperlinks and anchors, image/script paths, and unresolved Quarto cross-references with `scripts/check-book.py`. Its machine-readable results are in `outputs/book-check.json` after running it.
- Inspected the HTML preface, seven-module navigation, responsive text/code layout, and a rendered agricultural scatter plot in the browser. This was a representative visual review, not an exhaustive accessibility audit.
- Rendered the separate R Markdown practical to HTML successfully.
- Converted the Quarto practical to DOCX successfully. Its page layout is **not verified**: the bundled document renderer could not find LibreOffice.
- Attempted the Quarto practical PDF export with automatic TeX package installation disabled. The installed XeLaTeX failed with `Can't get long name for C:\Users\user\AppData`; no successful PDF output is claimed. Full-book PDF and DOCX layouts are not validated.

## Local execution notes

The restricted execution environment required a workspace-local Quarto cache. For those verification commands only, `LOCALAPPDATA` pointed at `.quarto-cache`, and `R_LIBS_USER` explicitly pointed at the existing R 4.5 library. No persistent operating-system setting was changed. Ordinary RStudio usage may not require these overrides.

R emitted startup warnings that the requested `C.UTF-8` locale could not be applied. The HTML computations completed. No chapter-level statistical or execution error was suppressed; Quarto is configured with `error: false` and visible warnings.

The optional internet-download example is deliberately not executed during rendering. Its Rdatasets CSV endpoint is external and can change. Final institutional, agricultural subject-matter, copyright, and external textbook peer review remain the author's editorial steps; successful execution does not claim those reviews have occurred.
