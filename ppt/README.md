# Chapter slide decks

One PowerPoint deck per chapter of *R Programming for Agricultural Data Analysis*, for teaching and for recording video lectures.

- **Speaker notes are narration scripts.** Every slide has a spoken-style script in its notes (about 14,900 words, roughly 105 minutes at a normal speaking pace). In PowerPoint, use *Slide Show › Record* and read the notes, or export the notes for a teleprompter.
- Each deck follows the same structure: title, learning outcomes, sections, worked code, the chapter's practical, its live R laboratory, and a chapter review.
- Numbers quoted on slides were checked against the book's datasets in R. Code on slides is a teaching excerpt; the full, runnable code is in the chapter.

| Deck | Chapter |
|---|---|
| Ch01 | Getting started with R |
| Ch02 | Objects, data structures, and functions |
| Ch03 | Importing, validating, and exporting data |
| Ch04 | Cleaning agricultural observations |
| Ch05 | Transforming and summarizing data with dplyr |
| Ch06 | Visualizing agricultural data |
| Ch07 | Describing agricultural variation |
| Ch08 | An exploratory study of crop yield |
| Ch09 | Modelling crop growth |
| Ch10 | Agricultural time series and forecasting |
| Ch11 | Hypothesis tests and confidence intervals |
| Ch12 | Comparing treatments with analysis of variance |
| Ch13 | Designing and analysing field experiments |
| Ch14 | Correlation and regression for agricultural prediction |
| Ch15 | Reproducible reports with R Markdown and Quarto |
| Ch16 | Vibe coding: writing R with an AI assistant |

## Editing and rebuilding

The decks are generated from `src/`: `engine.js` holds the shared design (navy, gold and green palette; Cambria headings, Calibri body, Courier New code) and `chNN.js` holds each chapter's slide content and narration. Edit a chapter file, then rebuild:

```bash
cd ppt
npm install          # once
npm run build        # all chapters
node src/build.js 13 # one chapter
```

Small text edits can also be made directly in PowerPoint; the slides use real text boxes, tables and native charts. Edits made in PowerPoint are overwritten if the deck is rebuilt from `src/`.
