required <- c("knitr", "rmarkdown", "dplyr", "tidyr", "ggplot2", "readxl", "writexl", "patchwork", "plotly", "forecast", "pastecs", "TTR", "agricolae", "agridat", "car", "emmeans", "multcomp", "lme4", "lmerTest", "pbkrtest", "lmtest", "fitdistrplus", "vcd", "HistData", "psych", "FactoMineR", "factoextra", "corrplot", "nortest", "MASS")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
if (getRversion() < "4.1.0") stop("R >= 4.1 is required for |>")
if (length(missing)) stop("Install missing packages: ", paste(missing, collapse = ", "))
cat("All required R packages are available.\n")
print(vapply(required, function(x) as.character(packageVersion(x)), character(1)))
sessionInfo()
