# Run deliberately to refresh the historical examples retained from the author's notes.
# The book itself reads local CSVs and never downloads during a render.
dir.create("data", showWarnings = FALSE)
sources <- data.frame(name = c("kings", "births", "souvenir"),
  url = c("https://robjhyndman.com/tsdldata/misc/kings.dat",
          "https://robjhyndman.com/tsdldata/data/nybirths.dat",
          "https://robjhyndman.com/tsdldata/data/fancy.dat"),
  skip = c(3, 0, 0), expected_n = c(42, 168, 84))
for (i in seq_len(nrow(sources))) {
  raw_path <- file.path("data", paste0("original-", sources$name[i], ".dat"))
  download.file(sources$url[i], raw_path, mode = "wb", quiet = TRUE)
  values <- scan(raw_path, skip = sources$skip[i], quiet = TRUE)
  stopifnot(length(values) == sources$expected_n[i], all(is.finite(values)))
  write.csv(data.frame(value = values),
            file.path("data", paste0("original-", sources$name[i], ".csv")), row.names = FALSE)
}
rain <- read.csv("source-notes/rain.csv")[[1]]
stopifnot(length(rain) == 100, rain[1] == 23.56)
write.csv(data.frame(value = rain), "data/original-rain.csv", row.names = FALSE)
writeLines(c("Historical datasets restored from the author's original examples.",
             paste("Retrieved:", Sys.Date()),
             paste(sources$name, sources$url, sep = ": "),
             "rain: source-notes/rain.csv; original source https://robjhyndman.com/tsdldata/hurst/precip1.dat",
             "Births are in thousands; rain is annual inches; kings are ages at death in years; souvenir is shop sales in Australian dollars.",
             "These are historical teaching datasets, not agricultural field observations."),
           "data/original-series-provenance.txt")
message("Restored historical series with verified lengths: 42, 168, 84, 100.")
