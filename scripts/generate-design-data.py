"""Generate the simulated teaching datasets used in the experimental-design,
cleaning, and inference additions (seed 531).

These are educational constructions, not results from a real trial.
Run from the project root:  python scripts/generate-design-data.py
The CSV files are already supplied in data/; rerunning recreates them.
"""
import csv
import numpy as np

rng = np.random.default_rng(531)


def write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_NONNUMERIC)
        w.writerow(header)
        w.writerows(rows)


# 1. CRD: pot experiment, five nitrogen levels, four pots each
levels = ["N0", "N40", "N80", "N120", "N160"]
means = [18.2, 22.5, 26.1, 28.0, 28.6]  # g dry matter per pot
rows, pot = [], 1
order = rng.permutation(np.repeat(np.arange(5), 4))  # random allocation
for t in order:
    rows.append([f"POT{pot:02d}", levels[t], round(float(means[t] + rng.normal(0, 1.6)), 1)])
    pot += 1
write("data/crd.csv", ["pot_id", "nitrogen", "dry_matter_g_pot"], rows)

# 2. RCBD: six rice varieties in four blocks
varieties = ["V1", "V2", "V3", "V4", "V5", "V6"]  # generic labels, not real cultivars
v_eff = [5.6, 4.9, 5.1, 5.3, 4.6, 5.0]  # t/ha
b_eff = [0.35, 0.10, -0.15, -0.30]
rows, plot = [], 1
for b in range(4):
    for v in rng.permutation(6):
        y = v_eff[v] + b_eff[b] + rng.normal(0, 0.22)
        rows.append([f"R{plot:02d}", b + 1, varieties[v], round(float(y), 2)])
        plot += 1
write("data/rcbd_varieties.csv", ["plot_id", "block", "variety", "yield_t_ha"], rows)

# 3. Latin square: five weed-management treatments, 5 rows x 5 columns
trts = ["Hand weeding", "Pre-emergence", "Post-emergence", "Mulch", "Unweeded"]
t_eff = [4.4, 4.1, 4.0, 3.8, 2.9]
base = np.array([[(r + c) % 5 for c in range(5)] for r in range(5)])
base = base[rng.permutation(5)][:, rng.permutation(5)]
row_eff = np.linspace(0.4, -0.4, 5)   # fertility gradient down the slope
col_eff = np.linspace(-0.25, 0.25, 5)  # irrigation-channel gradient across
rows, plot = [], 1
for r in range(5):
    for c in range(5):
        t = base[r, c]
        y = t_eff[t] + row_eff[r] + col_eff[c] + rng.normal(0, 0.18)
        rows.append([f"L{plot:02d}", r + 1, c + 1, trts[t], round(float(y), 2)])
        plot += 1
write("data/latin_square.csv", ["plot_id", "row", "column", "treatment", "yield_t_ha"], rows)

# 4. Factorial RCBD: 3 nitrogen levels x 2 varieties in 4 blocks
n_levels = ["N0", "N60", "N120"]
vars2 = ["Tall", "Dwarf"]
cell = {("N0", "Tall"): 3.0, ("N60", "Tall"): 3.8, ("N120", "Tall"): 4.0,
        ("N0", "Dwarf"): 3.1, ("N60", "Dwarf"): 4.4, ("N120", "Dwarf"): 5.3}
b4 = [0.25, 0.05, -0.1, -0.2]
rows, plot = [], 1
combos = [(n, v) for n in n_levels for v in vars2]
for b in range(4):
    for k in rng.permutation(len(combos)):
        n, v = combos[k]
        y = cell[(n, v)] + b4[b] + rng.normal(0, 0.2)
        rows.append([f"F{plot:02d}", b + 1, n, v, round(float(y), 2)])
        plot += 1
write("data/factorial_rcbd.csv", ["plot_id", "block", "nitrogen", "variety", "yield_t_ha"], rows)

# 5. Split plot: irrigation on main plots, nitrogen on subplots, 3 blocks
irr = ["I1", "I2", "I3"]          # irrigation schedules (main plots)
nit = ["N0", "N50", "N100", "N150"]  # subplots
irr_eff = {"I1": -0.6, "I2": 0.0, "I3": 0.35}
nit_eff = {"N0": -0.9, "N50": 0.0, "N100": 0.55, "N150": 0.7}
inter = {("I1", "N150"): -0.35, ("I1", "N100"): -0.2, ("I3", "N150"): 0.2}
b3 = [0.3, 0.0, -0.3]
rows, plot = [], 1
for b in range(3):
    for i in rng.permutation(3):
        whole = rng.normal(0, 0.25)  # main-plot error
        for n in rng.permutation(4):
            I, N = irr[i], nit[n]
            y = 4.8 + b3[b] + irr_eff[I] + nit_eff[N] + inter.get((I, N), 0) + whole + rng.normal(0, 0.15)
            rows.append([f"S{plot:02d}", b + 1, I, N, round(float(y), 2)])
            plot += 1
write("data/split_plot.csv", ["plot_id", "block", "irrigation", "nitrogen", "yield_t_ha"], rows)

# 6. Counts for a square-root transformation: aphids per plant, CRD
ins = ["Control", "Neem oil", "Insecticide A", "Insecticide B", "Insecticide C"]
lam = [42, 18, 6, 9, 3]
rows, k = [], 1
for t in range(5):
    for r in range(5):
        rows.append([f"A{k:02d}", ins[t], int(rng.poisson(lam[t] * rng.gamma(8, 1 / 8)))])
        k += 1
write("data/aphid_counts.csv", ["plant_id", "treatment", "aphids_per_plant"], rows)

# 7. Percentages for an angular transformation: germination of 50 seeds
st = ["Untreated", "Hot water", "GA3", "KNO3"]
p = [0.58, 0.74, 0.92, 0.84]
rows, k = [], 1
for t in range(4):
    for r in range(4):
        g = int(rng.binomial(50, p[t]))
        rows.append([f"G{k:02d}", st[t], r + 1, 50, g, round(100 * g / 50, 1)])
        k += 1
write("data/germination.csv", ["tray_id", "seed_treatment", "replicate", "seeds_sown",
                               "seeds_germinated", "germination_pct"], rows)

print("done")
