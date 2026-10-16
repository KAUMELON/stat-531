# Reproducible SIMULATED teaching datasets. No real agronomic findings.
set.seed(531)
dir.create("data", showWarnings = FALSE)
write_data <- function(x, name) write.csv(x, file.path("data", name), row.names = FALSE, na = "NA")
crop <- expand.grid(replicate = 1:2, variety = c("A", "B"),
                    treatment = c("Control", "Compost", "Mineral"), block = 1:5,
                    KEEP.OUT.ATTRS = FALSE, stringsAsFactors = FALSE)
crop$plot_id <- sprintf("P%03d", seq_len(nrow(crop)))
crop$nitrogen_kg_ha <- round(c(Control = 25, Compost = 65, Mineral = 100)[crop$treatment] + rnorm(60, 0, 4), 1)
crop$rainfall_mm <- round(runif(60, 500, 800), 1)
crop$yield_t_ha <- round(2.3 + .016 * crop$nitrogen_kg_ha +
  .002 * (crop$rainfall_mm - 500) + .3 * (crop$variety == "B") +
  c(-.3, -.1, 0, .15, .25)[crop$block] + rnorm(60, 0, .3), 2)
crop <- crop[, c("plot_id", "block", "treatment", "variety", "replicate",
                 "nitrogen_kg_ha", "rainfall_mm", "yield_t_ha")]
write_data(crop, "crop_trial.csv")
writexl::write_xlsx(list(trial = crop), "data/crop_trial.xlsx")
dirty <- crop
dirty$yield_t_ha[c(7, 23)] <- NA
dirty$yield_t_ha[10] <- crop$yield_t_ha[10] * 10
dirty$treatment[1] <- " control "
dirty <- rbind(dirty, dirty[5, ])
write_data(dirty, "crop_dirty.csv")
write_data(data.frame(plot_id = "P010", correct_yield_t_ha = crop$yield_t_ha[10],
                      reason = "Teaching ledger: decimal place verified against simulated source"), "corrections.csv")
soil <- data.frame(plot_id = crop$plot_id,
                   soil_class = rep(c("Sandy loam", "Loam", "Clay loam"), 20),
                   ph = round(runif(60, 5.3, 7.3), 2),
                   available_n_mg_kg = round(25 + .2 * crop$nitrogen_kg_ha + rnorm(60, 0, 4), 1),
                   available_p_mg_kg = round(runif(60, 8, 30), 1),
                   available_k_mg_kg = round(runif(60, 70, 190), 1))
write_data(soil, "soil.csv")
month <- seq_len(120)
weather <- data.frame(date = seq(as.Date("2015-01-01"), by = "month", length.out = 120),
                       rain_mm = round(170 + .15 * month + 100 * sin(2 * pi * (month - 4) / 12) + rnorm(120, 0, 15), 1),
                       temp_c = round(26 + 3 * sin(2 * pi * (month - 1) / 12) + rnorm(120, 0, .5), 1))
write_data(weather, "weather.csv")
growth <- expand.grid(day = seq(10, 120, 10), replicate = 1:3)
growth$quadrat_id <- sprintf("Q%02d", seq_len(nrow(growth)))
growth$biomass_g_m2 <- round(1000 / (1 + exp(-.07 * (growth$day - 50))) + rnorm(36, 0, 15), 1)
write_data(growth[, c("quadrat_id", "day", "biomass_g_m2")], "growth.csv")
before <- round(rnorm(20, 40, 6), 1)
write_data(data.frame(plot_id = sprintf("S%02d", 1:20), before_mg_kg = before,
                      after_mg_kg = round(before + rnorm(20, 5, 3), 1)), "paired_soil.csv")
pest <- data.frame(plot_id = sprintf("I%03d", 1:120), treatment = rep(c("Control", "IPM"), each = 60))
pest$infested <- ifelse(runif(120) < ifelse(pest$treatment == "Control", .6, .3), "Yes", "No")
write_data(pest, "pest.csv")
rcbd <- expand.grid(treatment = c("Control", "Compost", "Mineral"), block = 1:6, stringsAsFactors = FALSE)
rcbd$plot_id <- sprintf("B%02d", 1:18)
rcbd$yield_t_ha <- round(3 + c(Control = 0, Compost = .5, Mineral = .9)[rcbd$treatment] +
  c(-.5, -.3, -.1, .1, .3, .5)[rcbd$block] + rnorm(18, 0, .2), 2)
write_data(rcbd, "rcbd.csv")
farm <- data.frame(farm_id = sprintf("F%03d", 1:100), nitrogen_kg_ha = round(runif(100, 30, 130), 1),
                    rainfall_mm = round(runif(100, 450, 850), 1))
farm$yield_t_ha <- round(1.8 + .018 * farm$nitrogen_kg_ha + .002 * farm$rainfall_mm + rnorm(100, 0, .35), 2)
write_data(farm, "farm_yield.csv")
message("Generated labelled teaching simulations in data/.")
