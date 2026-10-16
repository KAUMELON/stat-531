# Run deliberately once before class; never sourced by a chapter.
required <- c("knitr", "rmarkdown", "dplyr", "tidyr", "ggplot2", "readxl", "writexl", "patchwork", "plotly", "forecast", "pastecs", "TTR")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) install.packages(missing, repos = "https://cloud.r-project.org")
