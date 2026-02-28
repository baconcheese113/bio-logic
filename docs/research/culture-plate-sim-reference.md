# Culture Plate Simulation — Microbiological Reference Manual
## Comprehensive Science & Parameter Reference for Lab Simulator

---

# 1. STREAKING PHYSICS — Bacterial Transfer Model

## 1.1 Mechanism of Transfer

The transfer of bacteria from a wire loop to agar is primarily a **thin-film capillary transfer** process. When a calibrated loop is dipped into a liquid culture, surface tension holds a thin meniscus of liquid within the loop. A standard 1 µL loop (roughly 3 mm inner diameter) holds approximately **1 µL** of liquid; a 10 µL loop holds approximately **10 µL**.

When the loop contacts agar, the liquid film bridges from loop to agar surface. As the loop moves, it deposits a trail of liquid that is drawn out of the loop by capillary adhesion to the wet agar surface. This is **not** mechanical smearing — it is film drainage. The agar surface is slightly moist (~1.5% surface water layer), which helps the liquid film "wick" from the loop.

**Key physics**: The loop acts as a reservoir that drains exponentially. Each unit of linear distance traversed deposits a fraction of the remaining volume. This is well-approximated by first-order kinetics, but with important caveats (see §1.2).

## 1.2 Depletion Model

Your exponential drain model is a reasonable first approximation, but the real behavior has **two regimes**:

### Regime 1: Wet Film Phase (first ~10-20 mm of streaking)
- The loop carries a visible meniscus of liquid
- Deposition is relatively heavy and uniform
- The film breaks into droplets/rivulets as it thins
- **Model**: Roughly constant deposition rate

### Regime 2: Contact Transfer Phase (remaining distance)
- Liquid film is exhausted; transfer becomes contact-mediated
- Bacteria transfer by mechanical adhesion/release at the loop-agar interface
- Depletion follows approximately first-order kinetics
- **Model**: Exponential decay with a much lower coefficient

### Combined Model
```
if distance < d_wet:
    deposited(x) = C_initial × V_wet_rate           # ~constant heavy deposit
else:
    deposited(x) = C_residual × exp(-λ × (x - d_wet))  # exponential decay
```

**There is no sharp "runs dry" threshold** — the loop retains trace bacteria in surface scratches and on the wire itself. Even after extended streaking, a loop will still deposit *some* cells, though at vanishingly low levels.

### Published Data Points (best available estimates)

| Parameter | Value | Source/Notes |
|---|---|---|
| Standard 1 µL loop volume | 1.0 µL ± 0.1 | Calibrated loop spec (CLSI) |
| Standard 10 µL loop volume | 10 µL ± 1 | Calibrated loop spec |
| Turbid overnight culture density | 10⁸–10⁹ CFU/mL | E. coli in LB at 37°C |
| Initial CFU on 1 µL loop | ~10⁵ (from 10⁸/mL culture) | Volume × concentration |
| Initial CFU on 10 µL loop | ~10⁶ (from 10⁸/mL culture) | Volume × concentration |
| Wet film phase length | ~10-20 mm | Estimated from practice |
| Depletion half-distance (exponential phase) | ~15-30 mm | Estimated; not precisely published |
| Fraction deposited per mm (wet phase) | ~2-5% of current load | Estimated |
| Fraction deposited per mm (dry phase) | ~0.5-2% of current load | Estimated |

> **Honesty note**: There is essentially **no published quantitative model** of streak plate depletion kinetics. The four-quadrant streak technique works empirically — it was developed by practice, not by mathematical optimization. The exponential drain with the parameters above represents the best informed estimate, derived from the fact that 4 streaking zones reliably yield ~3 log₁₀ reductions across the plate.

## 1.3 Re-Streaking / Cross-Hatch Pickup

When the loop passes through an existing streak:

- **Pickup efficiency**: Approximately **1-10%** of deposited bacteria at that point are picked up
- Pickup depends heavily on **agar moisture** — wetter surfaces yield higher pickup
- Fresh deposits (< 1 hour old, pre-incubation) are picked up much more easily than established ones
- Once colonies have begun to grow (>4h at 37°C), pickup becomes *much* less efficient because cells are anchored in extracellular matrix
- **Your 25% figure is high** for most scenarios. Recommend: 5-15% for fresh wet deposits, 1-5% for partially dried deposits

### For simulation:
```
pickup_fraction = base_pickup × moisture_factor × age_factor
where:
  base_pickup = 0.08  (8%)
  moisture_factor = 1.0 (fresh) → 0.3 (dried, >30 min)
  age_factor = 1.0 (pre-incubation) → 0.1 (>4h growth)
```

## 1.4 Pressure Effects

| Pressure Level | Loop Contact Width | Deposition Rate | Agar Effect |
|---|---|---|---|
| Very light (skating) | ~0.1 mm (wire only) | Minimal — loop may skip | No damage |
| Light | ~0.3-0.5 mm | Normal thin streak | No damage |
| Medium (standard) | ~0.5-1.0 mm | Normal — optimal | Minor surface compression |
| Heavy | ~1.5-2.0 mm | Increased width, faster drain | Visible groove/score |
| Gouging | >2.0 mm | Very heavy, loop digs in | Agar torn/gouged — broken surface |

- **Minimum contact threshold**: ~0.01 N (wire must touch surface)
- **Gouge threshold**: ~0.3-0.5 N (depends on agar concentration; 1.5% agar gouges more easily than 2%)
- Gouging creates subsurface growth channels where colonies grow *in* the agar rather than on top — appears as a thick opaque line after incubation

## 1.5 Speed Effects

- **Slow streaking** (~5-10 mm/s): More deposition per unit distance, wider streak
- **Normal streaking** (~20-50 mm/s): Standard deposition
- **Fast streaking** (>100 mm/s): Less deposition per unit distance; the loop "skips" over the surface at very high speeds
- Relationship is approximately **inversely proportional** to speed within the normal range: `deposit ∝ 1/velocity`
- At very high speeds, mechanical bouncing introduces stochasticity

## 1.6 Kill Zone / Flame Sterilization

When the loop passes over a previously flamed area:
- **Heat-killed bacteria on the agar surface are effectively absent** — flaming sterilizes the loop, not the agar
- However, if you're modeling a scenario where alcohol or a flame was applied directly to the agar, killed cells are denatured protein debris
- Dead cell debris **cannot** be meaningfully picked up and restreaked — they won't form colonies
- Dead cells do NOT act as viable deposits

## 1.7 Edge Cases / Gotchas

1. **Loop cooling**: A just-flamed loop must cool before touching agar or it kills bacteria on contact. If the loop contacts agar while hot, a ~2-3 mm radius kill zone is created
2. **Agar surface moisture**: Freshly poured plates with condensation give very different streaking behavior — the wet film on the surface causes bacteria to slide and spread, not deposit in clean lines
3. **Loop angle**: A loop held at 30° to the surface gives a wider streak than at 60°
4. **Disposable plastic loops vs. metal wire loops**: Plastic loops have thicker cross-sections and produce wider streaks. They also flex, which affects pressure consistency

---

# 2. GROWTH SIMULATION — From Deposition to Mature Colony

## 2.1 Growth Phases on Solid Media at 35-37°C

Colony growth on solid agar differs fundamentally from liquid culture:
- In liquid: all cells access nutrients equally → classic sigmoidal curve
- On agar: only cells at the **colony periphery** are in the active growth zone; interior cells are nutrient-limited
- Result: after an initial exponential phase, colony **radius** expands linearly with time (not exponentially)

### Colony Timeline (single cell → visible colony)

| Time (h) | Event | Colony Size |
|---|---|---|
| 0-1 | Lag phase — cell rehydrates, repairs, adapts | Single cell (~1 µm) |
| 1-3 | First divisions begin | 2-8 cells (invisible) |
| 3-6 | Microcolony forms, still invisible to naked eye | ~100-1000 cells, <50 µm |
| 6-8 | Microcolony visible under magnification | ~0.05-0.1 mm |
| 8-12 | Colony becomes visible to naked eye | ~0.1-0.5 mm |
| 12-18 | Active growth, morphology developing | 0.5-1.5 mm |
| 18-24 | Standard read time for most organisms | 1-4 mm (species-dependent) |
| 24-48 | Continued growth, pigments intensify | 2-6 mm |
| 48-72 | Growth slows, some colonies may spread | 3-8+ mm |

## 2.2 Organism-Specific Growth Parameters

### Parameter Table: Growth at 37°C on Blood Agar (5% sheep blood)

| Organism | Lag (h) | Doubling Time | Colony at 24h (mm) | Colony at 48h (mm) | Speed Class |
|---|---|---|---|---|---|
| E. coli | 1-2 | ~20 min (liquid) | 2-4 | 3-5 | Fast |
| S. aureus | 1-2 | ~30 min | 1-3 | 2-4 | Fast |
| K. pneumoniae | 1-2 | ~25 min | 3-5 (mucoid) | 4-7 | Fast |
| P. aeruginosa | 1-2 | ~30 min | 2-4 | 3-6+ (spreading) | Fast |
| S. pyogenes | 2-4 | ~45-60 min | 0.5-1 | 1-2 | Moderate |
| S. pneumoniae | 2-4 | ~40-50 min | 0.5-1.5 | 1-2 (autolysis starts) | Moderate |
| E. faecalis | 1-3 | ~30-40 min | 1-2 | 2-3 | Moderate |
| S. epidermidis | 2-3 | ~35-45 min | 1-2 | 2-3 | Moderate |
| C. albicans | 2-4 | ~90-120 min | 1-2 | 2-4 (can filament) | Slow |
| H. influenzae | 3-6 | ~45-60 min | 0.5-1 (choc only) | 1-1.5 | Slow |
| N. meningitidis | 4-8 | ~45-60 min | 0.5-1 | 1-2 | Slow |
| Proteus mirabilis | 1-2 | ~25 min | **Swarms entire plate** | Full plate | Swarmer |

### Growth Model for Simulation

Use a **two-phase model** per colony:

**Phase 1 — Exponential** (colony area grows exponentially):
```
area(t) = A₀ × 2^((t - t_lag) / t_double)    for t < t_transition
```

**Phase 2 — Linear radial expansion** (colony radius grows linearly):
```
radius(t) = r_transition + v_radial × (t - t_transition)   for t ≥ t_transition
```

- `t_transition` ≈ 6-10 hours (when colony reaches ~0.05-0.1 mm radius)
- `v_radial` ≈ 20-80 µm/h for E. coli on minimal media; up to 100-200 µm/h on rich media
- Eventually limited by nutrient depletion in surrounding agar

## 2.3 Density → Colony Formation

| Deposited CFU at a spot | Result |
|---|---|
| 0 | No growth |
| 1 | Single isolated colony |
| 2-5 | May form 1-3 colonies very close together, or merge into one |
| 5-20 | Likely merge into single larger colony |
| 20-100 | Confluent patch, but still distinguishable from lawn |
| 100-500 | Semi-confluent — indistinguishable individual colonies |
| >500 per mm² | Confluent lawn |

**Threshold for lawn formation**: approximately **10⁴-10⁵ CFU per plate** (90mm plate) when evenly distributed produces a confluent lawn.

## 2.4 Colony Morphology Over Time

### S. aureus (on Blood Agar, 37°C)
| Time | Appearance |
|---|---|
| 6h | Pinpoint, translucent, barely visible |
| 8h | ~0.3 mm, translucent, slight dome |
| 12h | 0.5-1 mm, becoming opaque, cream/white |
| 18h | 1-2 mm, opaque, cream-yellow, convex dome, β-hemolysis zone appearing |
| 24h | 1-3 mm, golden-yellow, opaque, smooth, convex, clear β-hemolysis zone (1-2 mm wide) |
| 48h | 2-4 mm, deeper golden color, hemolysis zone wider |

### E. coli (on Blood Agar, 37°C)
| Time | Appearance |
|---|---|
| 6h | Pinpoint, translucent |
| 12h | 1-2 mm, grey-white, moist, slightly raised |
| 24h | 2-4 mm, grey-white, circular, moist, opaque, slight β-hemolysis |
| 48h | 3-5 mm, flatter, drier, more opaque |

### Klebsiella pneumoniae
| Time | Appearance |
|---|---|
| 12h | 1-2 mm, already visibly mucoid/glistening |
| 24h | 3-5 mm, very mucoid/wet, raised, grey-white, string test positive |
| 48h | 5-7+ mm, extremely mucoid, may coalesce with neighbors |

## 2.5 Swarming Organisms

### Proteus mirabilis
- Swarming on 1.5% agar begins after ~4-6 hours of stationary growth at the inoculation point
- Colony expands in **concentric rings** (bull's-eye pattern) — alternating swarming and consolidation
- Each swarming phase: cells elongate 10-80× normal length, become hyperflagellated, move in rafts across the surface at rates of ~2-10 mm/h
- Consolidation: cells de-differentiate back to short rods, divide, then swarm again
- **One strain can cover an entire 90mm plate within 18-24 hours**
- Ring width: ~2-5 mm per swarming cycle
- Ring period: ~2-4 hours per cycle
- **Inhibited by bile salts** (why Proteus doesn't swarm on MacConkey)

### P. aeruginosa
- Produces diffusible pigments (pyocyanin = blue-green, pyoverdine = yellow-green)
- On blood agar: colonies may have a metallic sheen, flat spreading morphology
- Swarming is flagella-dependent, occurs on soft agar (0.5-0.7% for swimming, 0.5-1.5% for swarming)
- On standard 1.5% blood agar: spreading is moderate, not as dramatic as Proteus
- Produces fruity (grape-like) odor

## 2.6 Hemolysis Zone Development

| Type | First Visible | Zone Width at 24h | Continues After Growth Stops? |
|---|---|---|---|
| β (S. pyogenes) | 8-12h | 2-4 mm | Yes — hemolysins continue diffusing |
| β (S. aureus) | 10-14h | 1-2 mm | Slightly |
| α (S. pneumoniae) | 8-12h | 1-2 mm | Minimal |
| γ (E. faecalis) | N/A | 0 | N/A |

- β-hemolysis zone radius grows proportionally to colony size initially, then can exceed it as hemolysins diffuse outward
- For S. pyogenes: hemolysis zone is typically **2-3× colony diameter**
- For S. aureus: hemolysis zone is typically **1-1.5× colony diameter**
- α-hemolysis zones are generally narrower: **0.5-1× colony diameter**
- Hemolysis is more visible in subsurface/stabbed areas (SLO is oxygen-labile)

## 2.7 Mixed Culture Competition

- Faster growers generally dominate and can physically overgrow slower organisms
- Some organisms produce **bacteriocins** that actively kill competitors
- P. aeruginosa produces pyocyanin which inhibits S. aureus
- On a mixed plate, fast growers (E. coli, Klebsiella) outcompete streptococci for space and nutrients
- **For simulation**: model as Voronoi-like space competition where growth rate determines territory

## 2.8 Environmental Effects

| Factor | Effect on Growth | Effect on Morphology |
|---|---|---|
| 25°C vs 37°C | 2-4× slower growth | Smaller colonies, may enhance pigment (S. marcescens) |
| 42°C | Most organisms slower or no growth; thermophiles grow | Selective for some species |
| 5% CO₂ | Enhances capnophilic organisms (Neisseria, Streptococcus) | S. pneumoniae colonies larger with CO₂ |
| Anaerobic | Required for strict anaerobes; enhances SLO hemolysis | β-hemolysis more visible |
| Humidity | Prevents desiccation of agar and colonies | Dry incubator → smaller, drier colonies |

---

# 3. AGAR MEDIA — Differential and Selective Behavior

## 3.1 Blood Agar (5% Sheep Blood Agar)

### Science
- Base: peptone, tryptose, NaCl, agar
- 5% defibrinated sheep blood added at 45-50°C after autoclaving
- Blood provides hemin (X factor), NAD (V factor - partially), and enriched nutrients
- Hemolysis is caused by bacterial **hemolysins** (exotoxins) that lyse RBCs

### Hemolysis Mechanisms
- **α-hemolysis**: Bacterial H₂O₂ oxidizes hemoglobin → **methemoglobin** (green/brown). RBC membranes remain largely intact. Partial destruction.
- **β-hemolysis**: Streptolysin O (oxygen-labile, works subsurface) and Streptolysin S (oxygen-stable, works on surface) form pores in RBC membranes via cholesterol binding → complete lysis → hemoglobin fully degraded to colorless products → clear zone.
- **γ-hemolysis**: No hemolytic activity. No color change.

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated plate | Cherry-red, opaque, glossy surface | RGB ~(160, 40, 40) / HSL(0°, 60%, 39%) |
| Streaked surface | Slightly lighter/thinner where loop disturbed surface | Slight lightening of red |
| β-hemolysis zone | Clear, transparent — can see through to light source | RGB ~(200, 180, 140) — amber/straw of base agar |
| α-hemolysis zone | Green-grey to brownish-green, translucent | RGB ~(100, 110, 80) — olive-green tint |
| No hemolysis (γ) | Unchanged cherry-red | Same as base |
| Extended incubation (48h+) | Blood darkens slightly, becomes more brown-red | Slight shift toward brown |

### Condensation
- Fresh plates in a warm incubator develop water droplets on the inner lid surface
- Incubate plates **inverted** (agar-side up) to prevent condensation dripping onto colonies

## 3.2 MacConkey Agar

### Science
- Contains lactose, bile salts, crystal violet, neutral red (pH indicator), peptone, NaCl, agar
- **Selective**: Crystal violet + bile salts inhibit Gram-positive organisms
- **Differential**: Lactose fermentation → acid production → pH drop below 6.8 → neutral red turns pink/red

### Colony Appearances
| Organism | Lac Fermentation | Colony Color | Halo | Texture |
|---|---|---|---|---|
| E. coli | Strong | Bright pink-red | Pink halo (bile salt ppt) | Flat, dry, 2-3 mm |
| Klebsiella | Strong | Pink | Mucoid/wet | Very mucoid, 3-5 mm, sticky |
| Enterobacter | Moderate-weak | Pink (paler) | None/slight | Slightly mucoid |
| Salmonella | None | Colorless/transparent | None | Smooth, 2-3 mm |
| Shigella | None | Colorless/transparent | None | Smooth, small |
| Proteus | None | Colorless (pale) | None | Non-swarming (bile salts inhibit) |
| P. aeruginosa | None | Colorless/translucent | None | Flat, irregular |
| Serratia | Slow/weak | Pale pink (late) | None | May develop red pigment |

### Timeline
- Colony color differentiation visible by **12-18 hours**
- Strong fermenters (E. coli) show color by ~10-14h
- Slow fermenters may take 24-36h to show definitive pink

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated plate | Light amber/tan, slightly translucent | RGB ~(210, 180, 140) |
| Lac+ colonies | Bright pink to dark red | RGB ~(220, 60, 80) |
| Lac+ with halo | Pink colony + cloudy pink ring in agar | Diffuse pink surrounding colony |
| Lac- colonies | Colorless to very pale, transparent | Near-colorless, let agar color show |
| Mucoid Lac+ (Klebsiella) | Wet/glistening pink dome | Very shiny, raised, sticky-looking |

## 3.3 Nutrient Agar

### Science
- Simplest general-purpose medium: beef extract, peptone, NaCl, agar
- Non-selective, non-differential
- Supports growth of most non-fastidious organisms

### Organisms That Grow Poorly/Not at All
- Haemophilus influenzae (requires X and V factors)
- Neisseria spp. (requires enriched medium)
- Streptococcus pneumoniae (poor growth without blood)
- Strict anaerobes

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated | Pale amber, translucent, slightly yellowish | RGB ~(220, 200, 160) |
| E. coli colony | Grey-white, circular, moist, 2-3 mm | Off-white/cream |
| S. aureus colony | Cream to golden-yellow, opaque, 1-3 mm | Golden when pigmented |
| P. aeruginosa | May show green pigment diffusing into agar | Blue-green diffuse pigment |

## 3.4 Chocolate Agar

### Science
- Blood agar heated to **80°C** → RBCs lyse → releases hemin (X factor) and NAD (V factor)
- The "chocolate" brown color comes from denatured hemoglobin
- Required for **Haemophilus influenzae** and **Neisseria meningitidis/gonorrhoeae**
- Not differential — no hemolysis patterns visible (blood already lysed)

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated | Dark chocolate brown, opaque, slightly glossy | RGB ~(90, 55, 35) |
| H. influenzae | Tiny (0.5-1 mm), translucent, dewdrop-like | Very faint grey on brown |
| Neisseria | Grey-brown, moist, 1-2 mm | Slightly raised, shiny |
| S. aureus | Golden-yellow (if it grows) | Visible against dark background |

## 3.5 Mueller-Hinton Agar

### Science
- Specifically formulated for antibiotic susceptibility testing (AST)
- Standardized composition: beef infusion, casein hydrolysate, starch, agar
- Low in sulfonamide/trimethoprim inhibitors; controlled cation content
- Starch absorbs toxic metabolites
- **Not differential** — no indicators

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated | Light straw/amber, nearly colorless, translucent | RGB ~(225, 210, 170) |
| Bacterial lawn | Uniform haze across surface | Slight opacity increase |
| Zones of inhibition | Clear circles around antibiotic discs | See-through to agar color |

## 3.6 Mannitol Salt Agar (MSA)

### Science
- Contains **7.5% NaCl** (vs typical 0.5%) — inhibits nearly all bacteria except staphylococci
- Differential sugar: **mannitol**; pH indicator: **phenol red**
- S. aureus ferments mannitol → acid → phenol red turns yellow
- Coagulase-negative staphylococci (CoNS) do NOT ferment mannitol → medium stays pink/red

### Visual Appearance
| Property | Description | Approximate Color |
|---|---|---|
| Uninoculated | Light red to red-orange (phenol red at pH 7.4) | RGB ~(210, 120, 90) |
| S. aureus colony | Yellow colonies with yellow halo in surrounding agar | Colony: RGB ~(220, 200, 60); halo: yellow zone |
| S. epidermidis colony | Small pink-red colonies, no color change | Colony: RGB ~(180, 90, 90); media unchanged |
| Non-staphylococci | No growth or very poor growth | N/A |

### Gotcha
Phenol red: **yellow below pH 6.8**, **red above pH 8.4**, red-orange at neutral. The yellow halo around S. aureus is the acid diffusion zone.

---

# 4. PHOTOREALISTIC RENDERING PARAMETERS

## 4.1 Colony Appearance Master Table (24h, Blood Agar)

| Organism | Color (HSL estimate) | Opacity | Surface | Edge | Elevation | Size (mm) | Hemolysis |
|---|---|---|---|---|---|---|---|
| S. aureus | (45°, 70%, 55%) golden | Opaque | Smooth, glistening | Entire | Convex/dome | 1-3 | β clear |
| E. coli | (40°, 5%, 70%) grey-white | Opaque | Smooth, moist | Entire | Slightly raised | 2-4 | Slight β or γ |
| K. pneumoniae | (40°, 5%, 75%) grey-white | Translucent | Mucoid, very glistening | Entire | Raised, dome | 3-5 | γ |
| P. aeruginosa | (160°, 15%, 50%) grey-green | Translucent | Moist, metallic sheen | Irregular | Flat-raised | 2-4 | β (some strains) |
| S. pyogenes | (0°, 0%, 80%) translucent white | Translucent | Matte, dry | Entire | Low convex | 0.5-1 | β wide zone |
| S. pneumoniae | (0°, 0%, 75%) translucent | Translucent | Moist, mucoid | Entire | Raised with central dimple (draughtsman) | 0.5-1.5 | α green |
| E. faecalis | (40°, 5%, 75%) grey-white | Opaque | Smooth | Entire | Convex | 1-2 | γ (→weak α at 48h) |
| S. epidermidis | (0°, 0%, 85%) white | Opaque | Smooth | Entire | Convex | 1-2 | γ |
| C. albicans | (45°, 15%, 80%) cream | Opaque | Smooth, pasty | Entire | Convex | 1-2 | γ |

## 4.2 Colony 3D Profile

| Morphology | Height:Diameter | Description | Examples |
|---|---|---|---|
| Flat | ~1:50 | Nearly flush with agar | P. aeruginosa, E. coli (older) |
| Raised | ~1:15 | Slightly elevated | E. coli (fresh), Enterobacter |
| Convex | ~1:5 to 1:3 | Dome-shaped | S. aureus, S. epidermidis |
| Pulvinate | ~1:2 | Very high dome | Klebsiella (mucoid) |
| Umbonate | ~1:4 with central peak | Bump in center | Some Bacillus spp. |
| Crateriform/draughtsman | ~1:5 with central depression | Donut-shaped | S. pneumoniae (due to autolysis) |

### Specular Highlights
- **Mucoid colonies** (Klebsiella, some Pneumococcus): Wet/glistening surface → strong specular highlight, almost mirror-like reflection. Highlight is typically white, oval, offset from center based on light angle
- **Matte/dry colonies** (S. pyogenes, Bacillus): Minimal specular, diffuse reflection
- **Standard smooth colonies** (S. aureus, E. coli): Moderate specular, slightly glossy
- **Height-to-diameter ratio** for typical S. aureus dome: ~0.3-0.5 mm height for 2mm diameter → ratio ~1:4 to 1:6

## 4.3 Confluent Growth (Lawn) Appearance

| Organism | Lawn Color | Texture | Special Features |
|---|---|---|---|
| S. aureus | Cream-golden sheet | Smooth, slightly glossy | Hemolysis zone visible at lawn edges |
| E. coli | Grey-white opaque film | Smooth, matte to slightly moist | Uniform opacity |
| P. aeruginosa | Grey-green with diffuse pigment | Moist, slightly metallic | Green pyocyanin diffuses into agar beneath; grape odor |
| K. pneumoniae | Grey-white, very mucoid | Extremely wet/glistening | Stringy if touched; entire surface appears wet |
| Proteus | Thin spreading film with terraces | Wavy concentric rings | Characteristic bull's-eye pattern |

## 4.4 Agar Surface Appearance

### Fresh Blood Agar Under Lab Lighting
- **Surface finish**: Semi-glossy, like wet gelatin
- **Color**: Rich cherry-red, with very slight translucency at edges
- **Surface texture**: Smooth but not perfectly flat — may have very faint ripples from pouring
- **Streaked area**: Loop leaves a faintly visible track even before incubation — slight surface disruption creates a matte line on the glossy surface
- **Scratched/gouged area**: White-ish line where agar is mechanically disrupted, exposing opaque interior
- **Condensation**: Small water droplets on lid, typically 0.5-2mm diameter, randomly distributed, more dense at plate periphery

### Agar Color Changes During Incubation
- Fresh: bright cherry-red
- 24h at 37°C: very slight darkening (hemoglobin oxidation at surface)
- 48h+: slight brown tint developing, especially in unstreaked areas
- Extended storage: progressively more brown-red

## 4.5 Time-Lapse Milestones

| Milestone | Time (h) at 37°C | Notes |
|---|---|---|
| Colonies first visible (naked eye) | 6-10 | ~0.1 mm; need oblique light |
| Colonies clearly visible | 10-14 | ~0.3-0.5 mm |
| β-hemolysis zones visible | 10-14 | Clear ring around colony |
| α-hemolysis green tint visible | 10-14 | Subtle green discoloration |
| S. aureus golden pigment | 18-24 | Develops gradually; more intense at 48h |
| P. aeruginosa green pigment | 18-24 | Pyocyanin diffuses into agar |
| Proteus first swarming ring | 4-6 | First ring of motility |
| Klebsiella mucoid visible | 12-18 | Wet/shiny dome appearance |
| S. pneumoniae autolysis dimple | 24-48 | Central collapse of colony |

## 4.6 Hemolysis Zone Rendering Details

### β-hemolysis (clear zone)
- The zone is truly **transparent** — the agar beneath is visible
- Color of zone = color of base agar without blood ≈ light amber/straw
- **Boundary**: relatively sharp for S. pyogenes (2-4 mm wide zone), slightly more diffuse for S. aureus
- Zone extends both *around* and *under* the colony
- If colony is lifted: clear circle beneath

### α-hemolysis (green zone)
- The zone is **translucent** with a distinct green-brown tint
- Methemoglobin creates an olive-green to brownish-green color
- **Boundary**: moderately diffuse — gradual transition from green to red
- More visible when viewed with transmitted light (hold plate up to light)
- Color: approximately HSL(80°, 25%, 40%) — muted olive-green

### Rendering Approach
```
β-hemolysis: Draw clear ring, color = base_agar_without_blood, opacity = 0.7-0.9
  Boundary: sharp Gaussian edge, σ ≈ 0.2mm
  
α-hemolysis: Draw green-tinted ring, color = olive_green, opacity = 0.5-0.7
  Boundary: softer Gaussian edge, σ ≈ 0.5mm
  Blend: multiply hemolysis color with underlying blood agar color
```

## 4.7 Photographic Reference Descriptions

### Key references from clinical microbiology atlases:

**S. aureus on blood agar** (Koneman's Color Atlas, ASM Color Atlas):
Golden-yellow smooth dome colonies 1-3mm, surrounded by 1-2mm clear β-hemolysis zones. Colony is opaque with a slight sheen. Against the red agar background, the gold-on-red-with-clear-halo is one of the most iconic images in clinical microbiology.

**S. pyogenes on blood agar**:
Small (0.5-1mm) translucent/grey pinpoint colonies, each surrounded by a large (2-4mm) clear β-hemolysis zone — the zone is dramatically larger than the colony itself. The plate may look more clear than red if growth is heavy.

**S. pneumoniae on blood agar**:
Small mucoid colonies with characteristic "draughtsman" (checker piece) morphology — raised edges with depressed center due to autolysis. Surrounded by green α-hemolysis zone. Colonies may appear watery/glistening.

**E. coli on MacConkey**:
Bright pink-red dry colonies, 2-3mm, with a surrounding pink halo from bile salt precipitation. Non-mucoid. The plate in areas of heavy growth turns uniformly pink-red.

**Klebsiella on MacConkey**:
Large mucoid pink domes, 3-5mm, extremely wet-looking. If you tilt the plate, the colonies appear to be dripping. String test: touching with loop and pulling draws a string of mucoid material.

---

# APPENDIX A: Quick-Reference Parameter Tables for Code

## A.1 Streaking Parameters
```javascript
const STREAK_PARAMS = {
  loop_volume_uL: 1.0,
  culture_density_CFU_per_mL: 1e8,
  initial_CFU: 1e5,
  wet_phase_distance_mm: 15,
  wet_phase_deposit_fraction: 0.03,    // per mm
  dry_phase_deposit_fraction: 0.01,    // per mm (exponential)
  pickup_fraction_fresh: 0.08,
  pickup_fraction_dried: 0.03,
  min_pressure_contact: 0.01,          // Newtons
  gouge_pressure_threshold: 0.35,      // Newtons
  speed_reference_mm_per_s: 30,        // "normal" speed
  deposit_vs_speed: "inverse_proportional"
};
```

## A.2 Growth Parameters
```javascript
const GROWTH_PARAMS = {
  "S_aureus":    { lag_h:1.5, doubleTime_min:30,  size24h_mm:2.0, size48h_mm:3.5, hemolysis:"beta",  hemoZoneRatio:1.3 },
  "E_coli":      { lag_h:1.5, doubleTime_min:20,  size24h_mm:3.0, size48h_mm:4.5, hemolysis:"beta_weak", hemoZoneRatio:1.1 },
  "K_pneumoniae":{ lag_h:1.5, doubleTime_min:25,  size24h_mm:4.0, size48h_mm:6.0, hemolysis:"gamma", hemoZoneRatio:0 },
  "P_aeruginosa":{ lag_h:1.5, doubleTime_min:30,  size24h_mm:3.0, size48h_mm:5.0, hemolysis:"beta",  hemoZoneRatio:1.2 },
  "S_pyogenes":  { lag_h:3.0, doubleTime_min:50,  size24h_mm:0.8, size48h_mm:1.5, hemolysis:"beta",  hemoZoneRatio:3.0 },
  "S_pneumoniae":{ lag_h:3.0, doubleTime_min:45,  size24h_mm:1.0, size48h_mm:1.5, hemolysis:"alpha", hemoZoneRatio:1.0 },
  "E_faecalis":  { lag_h:2.0, doubleTime_min:35,  size24h_mm:1.5, size48h_mm:2.5, hemolysis:"gamma", hemoZoneRatio:0 },
  "S_epidermidis":{ lag_h:2.5, doubleTime_min:40, size24h_mm:1.5, size48h_mm:2.5, hemolysis:"gamma", hemoZoneRatio:0 },
  "C_albicans":  { lag_h:3.0, doubleTime_min:100, size24h_mm:1.5, size48h_mm:3.0, hemolysis:"gamma", hemoZoneRatio:0 }
};
```

## A.3 Media Color Table
```javascript
const MEDIA_COLORS = {
  blood_agar:    { base: "#A02828", hemolysis_beta: "#C8B48C", hemolysis_alpha: "#6E7A50" },
  macconkey:     { base: "#D2B48C", lac_positive: "#DC3C50", lac_negative: "#D2C8B4" },
  nutrient_agar: { base: "#DCC8A0" },
  chocolate:     { base: "#5A3723" },
  mueller_hinton:{ base: "#E1D2AA" },
  MSA:           { base: "#D27856", mannitol_pos: "#DCC83C", mannitol_neg: "#D27856" }
};
```

## A.4 Colony Visual Properties
```javascript
const COLONY_VISUALS = {
  "S_aureus":     { color:"#D4A840", opacity:0.95, surface:"smooth_glossy",  edge:"entire",     elevation:"convex",    specular:0.6 },
  "E_coli":       { color:"#B8B4A8", opacity:0.90, surface:"smooth_moist",   edge:"entire",     elevation:"raised",    specular:0.4 },
  "K_pneumoniae": { color:"#C0BCA8", opacity:0.80, surface:"mucoid_glossy",  edge:"entire",     elevation:"pulvinate", specular:0.9 },
  "P_aeruginosa": { color:"#7A9878", opacity:0.75, surface:"moist_metallic", edge:"irregular",  elevation:"flat",      specular:0.5 },
  "S_pyogenes":   { color:"#D0CCC8", opacity:0.50, surface:"matte_dry",      edge:"entire",     elevation:"low_convex",specular:0.15 },
  "S_pneumoniae": { color:"#C8C4B8", opacity:0.55, surface:"mucoid_moist",   edge:"entire",     elevation:"umbilicate",specular:0.7 },
  "E_faecalis":   { color:"#C0BCA8", opacity:0.85, surface:"smooth",         edge:"entire",     elevation:"convex",    specular:0.35 },
  "S_epidermidis":{ color:"#E0DCD4", opacity:0.90, surface:"smooth",         edge:"entire",     elevation:"convex",    specular:0.35 },
  "C_albicans":   { color:"#E0D8C4", opacity:0.90, surface:"smooth_pasty",   edge:"entire",     elevation:"convex",    specular:0.3  }
};
```

---

# APPENDIX B: Key Edge Cases and Gotchas

1. **S. pneumoniae autolysis**: Colonies self-destruct after 24-48h, developing a central depression ("draughtsman" shape). Older colonies may partially dissolve. This is unique and distinctive.

2. **P. aeruginosa pigment**: Pyocyanin (blue-green) is a diffusible pigment that stains the agar, not just the colony. The entire plate may turn green-blue around heavy growth areas. This is medium-dependent: more visible on non-blood media.

3. **Proteus swarming**: On blood agar, Proteus will swarm across the entire plate obscuring other organisms. On MacConkey, bile salts inhibit swarming — Proteus grows as discrete non-swarming colonies.

4. **Klebsiella string test**: If you model interactivity, mucoid Klebsiella colonies should "string" when pulled with a loop — a viscous thread extending 5+ mm.

5. **MRSA vs MSSA**: MRSA often produces smaller, whiter, less hemolytic colonies compared to the classic golden β-hemolytic MSSA. This is clinically important.

6. **C. albicans**: Not a bacterium — it's a yeast. Colonies are larger, creamier, and have a distinctive pasty/buttery texture. At 48-72h on certain media, it can produce pseudohyphae visible as fringed colony edges.

7. **Blood agar blood concentration**: Standard is 5%. Lower concentration (2-3%) shows weaker hemolysis; higher (7-10%) shows hemolysis more dramatically. The color difference is significant.

8. **Satellite phenomenon**: H. influenzae growing near S. aureus on blood agar shows larger colonies immediately adjacent to S. aureus (which provides V factor via NADase leakage). This is a classic diagnostic observation.

9. **Double-zone hemolysis**: Clostridium perfringens produces a characteristic "target" pattern — inner zone of complete β-hemolysis surrounded by a larger zone of partial hemolysis (due to θ-toxin and α-toxin respectively).

10. **Colony counting accuracy**: At >300 colonies per plate, counts become unreliable due to overlap. At <30, statistical significance is low. The ideal range for counting is 30-300 CFU/plate.

---

# REFERENCES

Primary textbook sources for validation:
- Koneman's Color Atlas and Textbook of Diagnostic Microbiology (7th ed.)
- ASM's Color Atlas of Medical Bacteriology (2nd ed.)
- Murray, Rosenthal, Pfaller — Medical Microbiology (9th ed.)
- Mahon, Lehman, Manuselis — Textbook of Diagnostic Microbiology (6th ed.)
- CLSI M100 (antimicrobial susceptibility standards)

Key papers cited in this document:
- Warren et al. (2019) "Spatiotemporal establishment of dense bacterial colonies growing on hard agar" eLife 8:e41093
- Pirt (1967) "A kinetic study of the mode of growth of surface colonies" J. Gen. Microbiol. 47:181
- Fujikawa et al. (2004) "Modeling surface growth of E. coli on agar plates" Appl Environ Microbiol
- Belas (1998) "Characterization of P. mirabilis precocious swarming mutants" J. Bacteriol.
- Rolfe et al. (2019) "Lag phase is a dynamic, organized, adaptive period" J. Bacteriol. 194:686
