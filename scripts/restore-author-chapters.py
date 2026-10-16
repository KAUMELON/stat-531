"""Restore the author's substantive lectures into the reading chapters.

The archive is immutable. Corrections here are explicit and reproducible.
Run once against the first teaching draft; it is preserved in qa/first-draft/.
"""
from pathlib import Path
import re, shutil, difflib, json

root = Path(__file__).resolve().parent.parent
archive = root / 'source-notes'
backup = root / 'qa' / 'first-draft'
if not (backup / '01-getting-started.qmd').exists() and 'fig-original-03' in (root / '01-getting-started.qmd').read_text(encoding='utf-8'):
    raise SystemExit('This edition is already restored. Preserve it; the original first-draft snapshots are needed to repeat the editorial migration.')
backup.mkdir(parents=True, exist_ok=True)
chapters = list(root.glob('[0-9][0-9]-*.qmd'))
for p in chapters:
    if not (backup / p.name).exists():
        shutil.copy2(p, backup / p.name)

image_paths = {p.relative_to(root).as_posix().lower(): p.relative_to(root).as_posix()
               for p in (root / 'images').rglob('*') if p.is_file()}
converted = {}

def convert(name):
    text = (archive / name).read_text(encoding='utf-8-sig')
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    text = re.sub(r'^# [^\n]*\n', '', text, count=1)
    text = re.sub(r'```\{block2[^\n]*\}\s*\n(.*?)\n```',
                  lambda m: '::: {.callout-note}\n' + m[1].strip() + '\n:::', text, flags=re.S)
    for old,new in {'rbase':'sec-language','dataset':'sec-datasets','import':'sec-import','freq':'sec-freq'}.items():
        text = text.replace('\\@ref('+old+')', '@'+new).replace('{#'+old+'}', '{#'+new+'}')
    text = re.sub(r'(Section|Chapter)@', r'\1 @', text)
    # Keep labels unique across the merged book and migrate figure references.
    prefix = Path(name).stem
    counter = 0
    def chunk(m):
        nonlocal counter
        counter += 1
        spec = m[1].strip()
        bits = spec.split(',', 1)
        label = bits[0].strip()
        opts = (',' + bits[1]) if len(bits) > 1 else ''
        if '=' in label:
            opts = ',' + spec
            label = ''
        newlabel = 'fig-original-'+prefix+'-'+label if label else 'original-'+prefix+'-'+str(counter)
        return '```{r '+newlabel+opts+'}'
    text = re.sub(r'```\{r\s*([^}\n]*)\}', chunk, text)
    def image_case(m):
        return image_paths.get(m[0].lower(), m[0])
    text = re.sub(r'images/[^\s"\')]+\.(?:png|PNG|jpg|jpeg)', image_case, text)
    text = text.replace('\\@ref(fig:rstudio2)', '@fig-original-03-rstudio2')
    text = text.replace('\\@ref(fig:box)', '@fig-original-09-box')
    converted[name] = text.strip()
    return text.strip()

intro = convert('02.Rmd')
intro = intro.replace('but as of yet, is not\nheavily utilized by researchers in agricultural disciplines.',
                      'and is widely used in agricultural teaching and research.')
intro = intro.replace('I believe that, there is no\nneed for agricultural scientist and students to learn R as a programming\nlanguage, as majority of you would like to have their data analyzed and\nmake inference from it.',
                      'Agricultural scientists and students need not become professional software developers, but they should learn enough programming to understand, adapt, and reproduce their analyses.')
intro = intro.replace('Most of the software available for data\nanalysis are proprietary or lack a simple user interface.',
                      'Statistical software differs in cost, licensing, interface, and analytical capabilities.')

studio = convert('03.Rmd')
studio = studio.replace('multivariate data analysis', 'agricultural data analysis')
studio = studio.replace('This is where we are going to type our single call function to start our app for data analysis.',
                        'We will use the Console to run and inspect the commands developed in this book.')
studio = studio.replace('R studio is GUI for R, so keep this in mind.', 'RStudio is an integrated development environment for R, so keep this distinction in mind.')
studio = studio.replace('**Click on "Download R-4.3.1 for windows" link to download the R executable (.exe) file**.(By the time of writing this manual R version was 4.3.1, it may change in future)',
                        '**Click the download link for the current R release for Windows.** The retained screenshots show R 4.3.1 from the original notes; use the version offered by CRAN, rather than searching for that historical release.')
studio = '::: {.callout-note title="Using the illustrated installation guide"}\nThe original step-by-step screenshots are retained below. They illustrate the installation sequence; release numbers, button wording, and screen layout may differ on your computer. Use the official download links given in the text.\n:::\n\n' + studio

packages = convert('05.Rmd')
start = packages.index('### From Bioconductor')
end = packages.index('### From github', start)
packages = packages[:start] + '''### From Bioconductor

Bioconductor provides packages for biological data analysis. The original notes used `biocLite()`. That installation mechanism has been replaced by `BiocManager`. The distinction between installing its manager and installing a selected package remains useful.

```{r}
#| eval: false
if (!requireNamespace("BiocManager", quietly = TRUE)) {
  install.packages("BiocManager")
}
BiocManager::install(c("GenomicFeatures", "AnnotationDbi"))
```

Consult the [official Bioconductor installation guide](https://www.bioconductor.org/install/) for compatibility with your R version. These optional examples are not executed while building the textbook.

''' + packages[end:]
packages = re.sub(r'R is distributed with fifteen "base packages":.*?\n\n',
                  'The standard installation contains base packages for essential language, statistical, graphics, and utility functions. The exact installed list can be inspected with `installed.packages()`.\n\n', packages, flags=re.S)
packages = packages.replace('After running the previous R code, all packages in the vector my_packages are loaded to R.',
                             'After running the code, inspect the returned logical values: `require()` returns FALSE for packages it could not load. Do not assume that every package loaded successfully.')

basics = convert('04.Rmd')
basics = basics.replace('# What is the class of friends_data? --> matrix', '# What is the class of friends_data? --> data.frame')
basics += '\n\n```{r}\n# Close the final attach() demonstration before continuing.\ndetach(friends_data)\n```\n\nThe `attach()` examples explain commands encountered in existing scripts. In new analyses, prefer `friends_data$age`, `with(friends_data, mean(age))`, or a function with a `data =` argument. These make the variable source explicit and avoid masking another object with the same name.'

imports = convert('06.Rmd')
imports = imports.replace('-   Use the first column as row names. Generally rows represent\n    observations.',
                          '-   Keep a unique observation identifier in an ordinary column. Generally rows represent observations; an identifier need not be assigned as R row names.')
imports = imports.replace('-   Make sure each row name is unique. But this is not in case of\n    analysis of experiments , there each row name is treatment name,\n    which should be repeated for each replication',
                          '-   Make each observation identifier unique. In experiments, treatment labels should repeat across replicates in a separate treatment column; treatment names are not unique plot identifiers.')
imports = imports.replace('Only underscore can be used.', 'Letters, digits, underscores, and dots can be used in ordinary syntactic names; a simple naming convention is easier to maintain.')
imports = imports.replace('Good format: 01/01/2016. Bad format: 01/01/16.', 'Prefer an unambiguous ISO date such as 2016-01-01 and retain all four digits of the year.')
imports = imports.replace('Petal_length', 'Petal_length')
imports = imports.replace('To import from xlsx file, we need the package xlsx',
                          'Excel import requires an additional package. The original `xlsx` example is retained as an optional alternative; the worked agricultural import below uses `readxl`, which does not require Java.')
imports = imports.replace('### Function to access variables easily', '### Understanding attach() and detach() in existing scripts')
imports += '\n\nIn the example above, `attach()` temporarily copies names onto the search path. Editing the original data frame afterwards can leave those attached values out of date. Use explicit column references in your practical submissions.'

datasets = '## Datasets in R {#sec-datasets}\n\n' + convert('07.Rmd')
datasets = datasets.replace('Each rat received', 'Each guinea pig received')
datasets = datasets.replace('two distinct treatment conditions and a control condition (as determined by the dry weight of plants).',
                            'two treatment conditions and a control condition, measured as plant dry weight. The group codes do not specify fertilizer names or application rates.')

description = convert('08.Rmd')
description = description.replace('Maximum|maximum()', 'Maximum|max()')
description = description.replace('require(modeest)', '''# The optional modeest::mfv() has a base-R equivalent for this lesson.
mfv <- function(x) {
  x <- x[!is.na(x)]
  if (!length(x)) return(x)
  values <- unique(x)
  counts <- tabulate(match(x, values))
  values[counts == max(counts)]
}''')
description = description.replace('It is 45', 'Verify it from `sum(survey_data <= 8)`; the result depends on the simulated sample')
description = description.replace('*This section is just for your information*. I don\'t want to go deep in to programming part, as we are concentrating only on data analysis. If you are not interested you can skip this section.',
                                   'This section extends the data-analysis examples into a reusable function. Read the calculation first, then see how the same steps are collected into one named operation. You do not need advanced programming to benefit from a small, clearly written function.')
# Replace the unsafe hand-rounded boundaries while retaining the teaching steps.
description = re.sub(r'#Determine the class width.*?# Generate frequency table of classes', '''# Equal-width boundaries must include every observed value.
class_width <- (max(data) - min(data)) / n_class
breaks <- seq(min(data), max(data), length.out = n_class + 1)
data.cut <- cut(data, breaks = breaks, right = FALSE, include.lowest = TRUE)

# Generate frequency table of classes''', description, count=1, flags=re.S)
description = re.sub(r'  N<- length\(x\).*?  data.freq\n', '''  x <- x[is.finite(x)]
  if (!length(x)) stop("No finite observations")
  if (length(unique(x)) == 1) return(table(x))
  N <- length(x)
  n_class <- ceiling(1 + 3.322 * log(N, base = 10))
  breaks <- seq(min(x), max(x), length.out = n_class + 1)
  data.cut <- cut(x, breaks, right = FALSE, include.lowest = TRUE)
  data.freq <- table(data.cut)
  stopifnot(sum(data.freq) == N)
  data.freq
''', description, count=1, flags=re.S)
description += '\n\nThe boundary calculation above keeps the original Sturges-rule demonstration but ensures that the largest observation is counted. Rounding class boundaries too early can silently omit observations. Also, `mode()` in base R reports storage mode; it does not calculate the most frequent observation. The helper returns all tied most frequent values.'

graphics = convert('09.Rmd')
graphics = graphics.replace('xlab = "Degree Celsius",\nylab = "Day",', 'xlab = "Day",\nylab = "Maximum temperature (degrees Celsius)",')
graphics = graphics.replace('Each quartile\'s whiskers lead to the minimum or maximum.',
                            'In the usual R convention, whiskers extend to the most extreme observations within 1.5 IQR of the hinges. Observations outside them are drawn separately; whiskers need not reach the sample minimum and maximum.')
graphics = graphics.replace('In a boxplot the minimum value is the value which is equal to $Q_{1}- 1.5\\times IQR$',
                            'The lower outlier fence is $Q_1 - 1.5\\times IQR$. It is a threshold, not the sample minimum. The lower whisker reaches the smallest observed value within that fence. The upper fence is $Q_3 + 1.5\\times IQR$. The retained illustration should be read with this distinction in mind.')

times = convert('10.Rmd')
for var, url, skip in [('kings','misc/kings.dat',3),('births','data/nybirths.dat',0),('souvenir','data/fancy.dat',0),('rain','hurst/precip1.dat',1)]:
    times = re.sub(var+r'\s*<-\s*scan\("http://robjhyndman.com/tsdldata/'+re.escape(url)+r'"[^\n]*',
                   var+' <- read.csv("data/original-'+var+'.csv")$value', times)
times = times.replace('Download `birth.csv` file form first section', 'Use the bundled `data/original-births.csv` file described in the first section')
times = times.replace('There is no universally accepted method for selecting the ideal α value.',
                       'There is no single alpha value suitable for every series; estimation and forecast evaluation are needed.')
times = times.replace('Here’s how to do it:', 'Here is how to do it:')
times = times.replace('F_{t+m} = (l_t + mb_t)s_{t-m}', 'F_{t+m} = (l_t + mb_t)s_{t-s+1+((m-1)\\bmod s)}')
times = times.replace('though they slightly prioritize recent data.', 'giving a small weight to the latest observation and substantial weight to the previous level estimate.')
times = times.replace("By default, the function generates forecasts for the same time range as the original series—in this case, London's rainfall data from 1813 to 1912.",
                       'The fitted component contains in-sample one-step-ahead fitted values; future forecasts require an additional predict or forecast call.')
times = times.replace("By default, the function generates forecasts for the same time range as the original time series—in this case, London's rainfall data from 1813 to 1912.",
                       'Its fitted component contains in-sample fitted values; it is not a vector of future forecasts.')
times = times.replace('rainseriesforecasts', 'rainforecast')
# The final example originally repeated SSE rather than setting l.start.
last = times.rfind('rainforecast$SSE')
times = times[:last] + 'HoltWinters(rainseries, beta = FALSE, gamma = FALSE, l.start = 23.56)' + times[last+len('rainforecast$SSE'):]
times = '''The detailed examples from the original time-series chapter are retained: English kings, monthly births, souvenir sales, and London rainfall. They teach time-series structure before the agricultural weather application. Local copies are supplied so a classroom render does not depend on a live download. These are historical series, not simulated agricultural observations. The data appendix records the original sources and units.\n\n''' + times
times = times.replace('the number of births per month in New York city, from January 1946 to December 1959',
                       'monthly births in New York City, in thousands, from January 1946 to December 1959')
times = times.replace('The estimated seasonal factors for the months from January to December indicate consistent patterns across each year. Notably, July has the highest seasonal factor at approximately 1.46, suggesting a peak in births during that month. Conversely, February has the lowest seasonal factor at around -2.08, indicating a trough in births during this time of year.',
                       'Inspect the twelve seasonal factors returned by the decomposition. Their scale is thousands of births. Positive factors identify months above the estimated trend and negative factors identify months below it; compare `tapply(birthstscomp$seasonal, cycle(birthsts), mean)` rather than relying on a remembered month or value.')

def nest(text):
    return re.sub(r'^(#{2,5}) ', r'#\1 ', text, flags=re.M)

intro = '::: {.callout-note title="Statistical software in context"}\nThe following overview retains the original lecture discussion. Product histories and dated examples provide context; use current official documentation for installation, ownership, licence terms, and supported features. Our course calculations use R.\n:::\n\n' + intro
intro = intro.replace('We will be discussing this package towards last session.', 'The package is an additional agricultural resource; the core lessons below also show the underlying R calculations.')

spines = {
 '01-getting-started.qmd': [('02.Rmd',intro), ('03.Rmd','## R and RStudio: the illustrated guide\n\n'+nest(studio)), ('05.Rmd','## Packages and libraries\n\n'+nest(packages))],
 '02-r-language.qmd': [('04.Rmd',basics)],
 '03-data-import.qmd': [('06.Rmd',imports),('07.Rmd',datasets)],
 '06-visualization.qmd': [('09.Rmd',graphics)],
 '07-descriptive.qmd': [('08.Rmd',description)],
 '10-time-series.qmd': [('10.Rmd',times)],
}

def demote(text):
    # Nest the first draft as an application section without duplicate top-level chapters.
    return re.sub(r'^(#{2,5}) ', r'#\1 ', text, flags=re.M)

def words(text):
    text = re.sub(r'```.*?```', '', text, flags=re.S)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())

report=[]
for dest, sources in spines.items():
    draft=(backup/dest).read_text(encoding='utf-8')
    title, body=draft.split('\n',1)
    learning=re.search(r'^\s*## Learning outcomes\n.*?(?=\n## )', body, flags=re.S)
    outcomes=learning[0].strip() if learning else ''
    body=re.sub(r'^\s*## Learning outcomes\n.*?(?=\n## )', '', body, count=1, flags=re.S)
    content=title+'\n\n'+outcomes+'\n\n'+ '\n\n'.join(s for _,s in sources)
    content+='\n\n## Agricultural applications, interpretation, and further practice\n\n'+demote(body.strip())+'\n'
    (root/dest).write_text(content,encoding='utf-8')
    for source,adapted in sources:
        original=(archive/source).read_text(encoding='utf-8-sig')
        a,b=words(original), words(adapted)
        matches=sum(m.size for m in difflib.SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks())
        report.append(dict(source=source,chapter=dest,original_prose_words=len(a),retained_matching_words=matches,
                           matched_prose_percent=round(100*matches/max(1,len(a)),1)))

(root/'outputs').mkdir(exist_ok=True)
(root/'outputs/retention-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
lines=['# Original-content retention audit','','This audit compares the prose word sequence of each original substantive lecture with its adapted reading-chapter text. Code, comments, and punctuation are excluded. Matching words are measured directionally against the original; this is an editorial traceability measure, not a quality score.','','| Original lecture | Reading chapter | Original prose words | Matching prose retained |','|---|---|---:|---:|']
for r in report:
    lines.append(f"| `{r['source']}` | `{r['chapter']}` | {r['original_prose_words']} | {r['matched_prose_percent']}% |")
total=sum(r['original_prose_words'] for r in report)
matched=sum(r['retained_matching_words'] for r in report)
lines+=['',f'Across these nine substantive lectures, {matched:,} of {total:,} original prose words match in sequence ({100*matched/total:.1f}%). The old syllabus is replaced by the supplied seven-module syllabus. Front matter is updated separately. Corrections and additions are documented in SOURCE-MAP.md.']
(root/'RETENTION-AUDIT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
