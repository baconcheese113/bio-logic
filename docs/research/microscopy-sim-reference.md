# MICROSCOPY SIMULATION REFERENCE
## Hyper-Realistic Golden Age Microbiology Lab Simulator (1880–1910)
### Science & Parameter Reference for Procedural Rendering

**Document Version:** 1.0  
**Companion to:** Culture Plate Simulation Reference  
**Target:** 2D Canvas / WebGL procedural microscopy rendering  

> **Convention:** Values marked with **[E]** are informed estimates where published data is scarce. Values marked with **[H]** are from historical sources. Values without markers are from standard references. Uncertainty ranges given where applicable.

---

# 1. OPTICAL PHYSICS — How a Light Microscope Works (1880s–1910s Era)

## 1.1 Magnification System

### Objective Lenses Available by Era

Ernst Abbe's theoretical work at Zeiss (1870s) and the partnership with Otto Schott (glass chemistry, 1880s) drove rapid improvement across the entire period.

| Era | Objectives Available | Notes |
|---|---|---|
| **1880** | 3×, 7×, ~40× (dry), ~60× (immersion) | Immersion objectives exist but are inconsistent. Most labs use dry objectives only. Homogeneous oil immersion just introduced by Abbe (1878). |
| **1890** | 4×, 10×, 40× (dry), 100× (oil) | Zeiss apochromats available (1886). Oil immersion 100× becomes standard for bacteriology. Leitz, Reichert, and others offer competitive systems. |
| **1900** | 4×, 10×, 20×, 40×, 100× (oil) | Full apochromatic correction widely available at premium price. Achromatic objectives standard. |
| **1910** | Same range, improved correction | Better antireflection, flatness. Still no phase contrast (1934) or fluorescence microscopy (practical ~1930s). |

**Key point for gameplay:** By 1885–1890, the "standard bacteriology set" is: low-power scanning (4× or 5×), medium (10×), high-dry (40×), and oil immersion (100×). Before ~1885, oil immersion may not be available in smaller/rural labs.

### Eyepiece Magnifications

Standard Huygenian eyepieces of the era: **5×, 8×, 10×, 12×, 15×**.  
- Most common working eyepieces: **8× or 10×**
- 15× eyepieces exist but produce empty magnification at high objectives
- Compensating eyepieces (designed for apochromatic objectives): introduced by Zeiss ~1886

### Total Magnification Ranges

| Objective | × 8× Eyepiece | × 10× Eyepiece | Typical Use |
|---|---|---|---|
| 4× | 32× | 40× | Scanning — find specimen area, assess smear quality |
| 10× | 80× | 100× | Low power — survey, WBC/epithelial counting |
| 40× | 320× | 400× | High dry — identify morphology shapes, preliminary ID |
| 100× oil | 800× | 1000× | Oil immersion — definitive bacterial morphology & Gram |

**Maximum useful magnification ≈ 1000× NA**, so 1000× oil (NA ~1.25) gives ~1250× useful. Beyond this is "empty magnification" (bigger but not sharper).

### Field of View Diameter

Field of view (FOV) depends on the eyepiece field number (FN) and objective magnification:

**FOV = FN / M_objective**

Era-appropriate eyepiece field numbers: **FN ≈ 14–18 mm** (Huygenian eyepieces, typically ~16 mm). Modern wide-field eyepieces reach FN 20–26, but those are post-era.

| Objective | FOV (FN=16) | FOV (FN=18) | For Simulation |
|---|---|---|---|
| 4× | 4.0 mm (4000 µm) | 4.5 mm | Use 4000 µm |
| 10× | 1.6 mm (1600 µm) | 1.8 mm | Use 1600 µm |
| 40× | 0.4 mm (400 µm) | 0.45 mm | Use 400 µm |
| 100× oil | 0.16 mm (160 µm) | 0.18 mm | Use **170 µm** |

**For the simulator viewport:** At 1000× oil, the player sees a circle ~170 µm in diameter. A single bacterium (~1 µm) occupies roughly 1/170th of the field diameter. At a viewport of 800 px diameter, 1 µm ≈ 4.7 px.

### Oil Immersion History

- **1840s:** Amici experiments with water immersion
- **1878:** Ernst Abbe introduces homogeneous oil immersion at Zeiss — the key innovation. Cedarwood oil (n ≈ 1.515) matched to glass refractive index. This eliminates the air gap between objective and coverslip, raising NA from ~0.95 (best dry) to ~1.25–1.30.
- **By 1885:** Oil immersion is becoming standard equipment in bacteriology labs
- **1890s onward:** Essential for all bacterial identification work

**What changed with oil immersion:**
- Resolution improved from ~0.35 µm (best dry, NA 0.95) to ~0.22 µm (oil, NA 1.25)
- Individual cocci (~0.8–1.0 µm) became clearly resolved as distinct cells
- Arrangement patterns (chains, clusters, diplococci) became definitively identifiable
- Before oil immersion, bacteriology was severely limited — organisms were visible but fine morphology was blurred

**Gameplay impact:** If simulating a pre-1885 lab, oil immersion may be locked. Player must work with 400× dry maximum — bacteria visible as dots/blobs but arrangements hard to resolve. This is historically accurate frustration.

---

## 1.2 Resolution and Resolving Power

### Abbe Diffraction Limit

**d = λ / (2 × NA)**

Where:
- d = minimum resolvable distance
- λ = wavelength of light (~550 nm for green, peak sensitivity of the eye; era microscopists used white light centered ~550 nm)
- NA = numerical aperture

For game purposes, also consider Rayleigh criterion: **d = 0.61 × λ / NA** (slightly more conservative, ~22% larger than Abbe).

### Practical Resolution at Each Objective

| Objective | NA (era-typical) | Resolution (Abbe, λ=550nm) | Resolution (Rayleigh) | What this means |
|---|---|---|---|---|
| 4× | 0.10 | 2.75 µm | 3.36 µm | Cannot resolve individual bacteria |
| 10× | 0.25 | 1.10 µm | 1.34 µm | Largest bacteria barely visible as dots; can see cell clumps |
| 40× | 0.65 | 0.42 µm | 0.52 µm | Individual bacteria visible; cocci appear as dots, rods show length; arrangements partially resolvable |
| 100× oil | 1.25 | 0.22 µm | 0.27 µm | Full morphological detail; arrangement, shape, Gram color all resolvable |

**Period-specific NAs [H]:**
- Achromatic objectives (standard): NA values ~10–15% lower than above
- Apochromatic Zeiss objectives (premium, post-1886): values as listed above
- A typical 1890s lab might have achromatic 100× oil with NA = 1.0–1.15, giving resolution ~0.24–0.28 µm

### Constraints on What the Player Can See

| Feature | Size | Visible at 400×? | Visible at 1000× oil? |
|---|---|---|---|
| Staphylococcus cluster (whole) | 5–15 µm | Yes, as grape-like blob | Yes, individual cells resolved |
| Individual coccus | 0.8–1.0 µm | Barely — a dot at resolution limit | Yes — round cells clearly visible |
| Rod bacterium (E. coli) | 1.0–3.0 × 0.5 µm | Yes — elongated shape visible | Yes — clear rods, can see width |
| Spirochete (Treponema) | 6–15 × 0.1–0.2 µm | Length visible, width below resolution | Width STILL below resolution — too thin! (This is why darkfield/silver stain needed) |
| Endospore inside rod | 0.5–1.5 µm | Visible as bright refractile body | Clear — can determine position (central, terminal, etc.) |
| Capsule (halo) | 0.5–5 µm | Visible with special stain | Clear halo around cell |
| Metachromatic granules | 0.2–0.5 µm | Not resolvable | At limit — visible as darker spots within cell |
| Flagella | 0.02 µm diameter | NO — far below resolution | NO — requires special flagella stain to make visible (thickens to ~0.2 µm) |

---

## 1.3 Depth of Field

### Depth of Field at Each Magnification

Total depth of field (DOF) combines wave-optical and geometric components:

**DOF ≈ λ/(NA²) + n×e/(M×NA)**

Where λ = wavelength, n = refractive index, e = smallest resolvable distance by eye (~0.2 mm), M = total magnification. For practical era-appropriate estimates:

| Objective | NA | DOF (approximate) | Gameplay Implication |
|---|---|---|---|
| 4× (40× total) | 0.10 | ~55 µm | Very deep — almost everything in focus. Forgiving. |
| 10× (100× total) | 0.25 | ~8.5 µm | Moderate — most of smear in focus |
| 40× (400× total) | 0.65 | ~1.0 µm | Shallow — must focus precisely. Different layers of thick smear can go in/out of focus. |
| 100× oil (1000×) | 1.25 | ~0.25–0.35 µm | **Extremely shallow** — essentially a single plane. Focus is CRITICAL. Slight adjustment moves through specimen layers. |

**Focus Challenge for Player:**
At 1000× oil, DOF is ~0.3 µm. A smear may be 1–5 µm thick (monolayer to multi-layer). The player must find the correct focal plane. In a thick smear, "racking through" will reveal different organisms at different depths.

At 400×, DOF is ~1 µm, so most of a thin smear is in focus simultaneously.

### Condenser Position and DOF

- **Condenser raised (fully focused):** Maximum NA from illumination → highest resolution BUT shallowest DOF and least contrast
- **Condenser slightly lowered:** Reduces effective illumination NA → slightly deeper DOF, better contrast, slightly lower resolution
- **Condenser fully lowered:** Very deep DOF but dramatically reduced resolution and uneven illumination

**Period practice:** Most bacteriologists of the era kept the condenser near the focused position and adjusted the substage diaphragm for contrast rather than condenser height. But technique varied significantly between individuals and labs.

---

## 1.4 Illumination and Contrast

### Illumination Methods

**Before Köhler (pre-1893):**
- **Critical illumination (Nelson illumination):** Light source imaged directly in the specimen plane. Result: image of the flame/lamp filament superimposed on the specimen. Gives bright center, dim edges. Color temperature varies across field. The lamp flame flicker is visible. This was standard pre-1893.
- **Simple flat-mirror illumination:** Concave mirror below condenser collects light from a nearby lamp. Very uneven illumination, bright hot spots.

**Köhler illumination (1893, August Köhler at Zeiss):**
- Light source is focused in the condenser aperture plane, not the specimen plane
- Result: perfectly even illumination across the field of view
- Eliminates: lamp image artifacts, uneven brightness, color gradients
- Requires: field diaphragm (added to microscope design)
- **Adoption was gradual** — many labs continued with critical illumination into 1900s. Elite labs (Koch's, Pasteur's, major hospitals) adopted early.

**Gameplay impact:** If simulating pre-1893 or a rural lab, illumination should be uneven (brighter center, warm-to-dim gradient toward edges). Post-1893 with Köhler, illumination is even.

### Condenser Diaphragm Effects

The substage iris diaphragm (introduced ~1880s on good microscopes) controls the cone of illuminating light:

| Diaphragm Setting | Resolution | Contrast | DOF | Visual Effect |
|---|---|---|---|---|
| Wide open | Maximum | Low (washed out) | Minimum | Bacteria faint against bright background; hard to see Gram color |
| ~70% open (optimal) | Near maximum | Good | Moderate | Best compromise — standard working position |
| Partially closed | Reduced | High | Deeper | Bacteria pop with contrast but edges show diffraction fringes |
| Nearly closed | Very low | Very high | Very deep | Dramatic contrast but severe diffraction artifacts, resolution loss, detail lost |

**For rendering:**
- Wide open: background brightness ~95% of max; bacteria only ~10-15% darker than background
- Optimal (~70%): background ~80%; bacteria well-saturated; background clear
- Closed down: background ~50-60%; bacteria very dark and saturated; visible halo/fringe around objects; slight glow effect

### Aberration Artifacts

**Chromatic Aberration (Longitudinal/Lateral):**
- Achromatic objectives (standard in era): corrected for 2 wavelengths (red + blue). Residual secondary spectrum produces **color fringing** — objects show purple/blue fringe on one side, yellow/green on other.
- At field center: minimal. At field edges: fringing up to 1–3 px at 1000×.
- Apochromatic objectives (premium, post-1886): corrected for 3 wavelengths. Much less fringing.
- **For rendering:** Add subtle RGB offset (1–2 px) at field edges; increase toward periphery.

**Spherical Aberration:**
- Causes slight softness/glow at field edges vs. center
- Worse if coverslip thickness is wrong (standard: 0.17 mm)
- **For rendering:** Apply slight Gaussian blur (σ = 0.5–1.0 px) increasing radially from center

**Field Curvature:**
- Flat-field (Plan) objectives are **post-era** (~1940s+). Period objectives have significant field curvature.
- Result: If center is in focus, edges are slightly out of focus (or vice versa).
- Visible effect: Center sharp, edges soften. ~Outer 20–30% of field diameter shows visible blur.
- **For rendering:** Apply radial blur gradient: center sharp, edge blur σ ≈ 1.5–3 px for achromatic objectives, σ ≈ 0.5–1.5 px for apochromats.

---

## 1.5 Era-Specific Limitations (1880–1910)

### Microscope Manufacturers of the Era

| Manufacturer | Country | Notes |
|---|---|---|
| **Carl Zeiss (Jena)** | Germany | Gold standard after Abbe's work. Apochromats (1886), oil immersion. |
| **Ernst Leitz (Wetzlar)** | Germany | Excellent quality, strong competitor to Zeiss. |
| **C. Reichert (Vienna)** | Austria | High quality, popular in Continental Europe. |
| **R. & J. Beck** | England | Good quality British maker. |
| **Swift & Son** | England | Mid-range, widely used in British Empire. |
| **Watson & Sons** | England | Popular in British clinical labs. |
| **Bausch & Lomb** | USA | Growing American manufacturer. Licensed Zeiss designs. |
| **Spencer Lens Co.** | USA | American market. |

**Quality tiers for gameplay:**
- **Top-tier (Zeiss apochromat):** Best available. Minimal chromatic aberration. Field curvature present. Excellent resolution.
- **Good (Leitz, Reichert, good achromats):** Slight more chromatic aberration. Good resolution. Slightly more field curvature.
- **Basic (standard achromats, older models):** Noticeable color fringing. More spherical aberration. Still usable for bacteriology but harder to get clean images.

### Period vs. Modern: Key Differences for Rendering

| Feature | Period (1880–1910) | Modern |
|---|---|---|
| Field flatness | Curved — edges blurry | Plan-corrected — sharp edge to edge |
| Chromatic correction | Achromatic (2-color) or apochromatic (3-color) | Super-apochromatic, computer-designed |
| Color temperature | Warm — oil lamp or early electric (2200–3000K **[E]**) | Daylight-balanced LED (5500–6500K) |
| Illumination uniformity | Uneven (pre-1893) or even (Köhler) but still some variation | Perfectly even |
| Coating | Uncoated glass — more flare, lower contrast | Multi-coated — high contrast |
| Field of view | Narrow (FN 14–18) | Wide (FN 20–26.5) |
| Overall image | Warmer, softer, more glow, slight vignette, less contrast | Crisp, cool, high contrast, flat field |

**Rendering summary for "period look":**
1. Apply warm color temperature shift (~3000K: multiply R×1.0, G×0.85, B×0.7) **[E]**
2. Add vignetting: darken outer 30% of field progressively (to ~70% brightness at very edge)
3. Add field curvature blur: center sharp, edge σ ≈ 1.5–3 px
4. Add subtle chromatic aberration at edges: R/B channel offset 1–2 px
5. Reduce overall contrast by ~10–15% vs. modern (uncoated glass flare)
6. Optional: very slight warm-tinted lens flare/glow from uncoated elements

---

# 2. SPECIMEN PREPARATION — What Affects the Image

## 2.1 Smear Preparation

### Smear Thickness and Visual Impact

| Quality | Thickness (layers) | What You See | Frequency in Game [E] |
|---|---|---|---|
| **Good thin smear** | Monolayer (1 cell thick) | Individual bacteria clearly separated; background clean; Gram colors distinct; WBCs flat and visible | Target ~40% of player's well-prepared slides |
| **Slightly thick** | 2–3 cells | Some overlap; bacteria still mostly resolvable; slight background haze | ~30% |
| **Thick** | 5–10+ cells | Bacteria piled on each other; deep purple/pink masses; can't distinguish individual cells in thick areas; must find thin edges to read | ~20% |
| **Too thin** | <1 cell per several fields | Clear background; must hunt to find organisms; may see WBCs but very few bacteria | ~10% |

**Visual rendering of thickness:**
- Monolayer: bacteria placed with minimal overlap; background transparency ~95%
- Thick: bacteria overlap extensively; composite opacity approaches 100% in thick regions; individual cell edges lost; color becomes muddy deep purple/pink
- "Feathered edge" technique (spreading smear): creates a gradient from thick to thin. Best area for reading is where background just starts to become clear — the "sweet spot."

### Sample Type Effects on Smear

| Sample Type | Smear Character | Background Elements |
|---|---|---|
| **Liquid broth culture** | Even distribution; pure single organism; very clean background | Almost no background elements — just bacteria |
| **Colony pick** | Can be very thick if too much picked; pure organism | Clean, may have agar fragments if sloppy [E] |
| **Wound swab** | Variable thickness; may be mixed flora; mucus strands | Neutrophils (many), fibrin strands, RBCs, tissue debris, possibly multiple organisms |
| **Sputum** | Thick mucoid areas; variable quality; may be saliva-contaminated | Epithelial cells (squamous = contamination; columnar = lower respiratory), neutrophils, mucus, mixed flora if contaminated |
| **Blood** | RBCs dominate; thin film technique needed | Massive RBCs, WBCs, platelets; bacteria usually very sparse and hard to find |
| **CSF (cerebrospinal fluid)** | Very thin — low cellularity; precious specimen | Few WBCs (neutrophils if bacterial meningitis), very few bacteria; clean background |
| **Urethral discharge** | Moderate cellularity | Neutrophils dominate; intracellular bacteria diagnostically significant |

---

## 2.2 Fixation

### Heat Fixation (Standard Method of the Era)

**Procedure:** Air-dry smear completely → pass slide through Bunsen burner flame 2–3 times (smear side up), ~1 second per pass.

| Fixation Quality | What Happened | Visual Result |
|---|---|---|
| **Correct** | Proteins denatured; cells adhered to glass; structure preserved | Normal morphology; good stain uptake; cells stay on slide through staining |
| **Under-fixed** | Insufficient heat; cells not fully adhered | Cells wash off during staining → sparse, patchy distribution; gaps where cells floated away; remaining cells may stain faintly |
| **Over-fixed / heat damage** | Too much heat; proteins coagulated excessively | Cells appear shrunken, distorted; cocci may look crenated or irregular; rods may curve or bloat; staining may be unusually dark or uneven; background may show brownish heat artifact **[E]** |

**Methanol fixation:** Available in the era but primarily used for blood films (Wright/Giemsa stain). Not standard for bacteriology until later. Some researchers used it; Koch's lab primarily used heat fixation.

### Fixation's Effect on Staining

- Proper fixation: stain penetrates evenly; Gram differentiation clear
- Under-fixation: uneven stain uptake; some cells pale; poor Gram differentiation
- Over-fixation: intense, sometimes uneven staining; cells may resist decolorization (artifactually Gram-positive) **[E]**

---

## 2.3 Gram Staining — Step by Step Physics

### Overview

Developed by Hans Christian Gram (1884), modified by Carl Weigert. THE defining stain for bacteriology from 1884 onward. Hucker modification (standardized procedure) came later (~1921), so era-appropriate procedure has more variability.

### Step 1: Crystal Violet (Primary Stain)

**Application:** Flood slide with crystal violet solution; 1 minute.

**Chemistry:** Crystal violet (a cationic/basic dye, hexamethyl pararosaniline chloride) binds to negatively charged components of ALL bacterial cell walls — both Gram-positive and Gram-negative. At this stage, EVERYTHING is purple.

**Visual after Step 1:**
- All bacteria: deep purple/violet
- Background: light purple (excess dye)
- WBCs: purple
- Everything is purple

**What can go wrong:**
- Too little time (<30 sec): faint staining — subsequent steps may give weak results
- Crystal violet precipitate: crystalline chunks of dye on slide (artifact). Very common. Appear as angular, refractile, deep purple geometric shapes that are NOT bacteria.
- Old or degraded crystal violet: weak staining

### Step 2: Gram's Iodine (Mordant)

**Application:** Drain crystal violet; flood with Gram's iodine (iodine-potassium iodide solution); 1 minute.

**Chemistry:** Iodine interacts with crystal violet to form a large crystal violet-iodine (CV-I) complex inside the cell. This complex is larger than crystal violet alone and becomes trapped in the thick peptidoglycan of Gram-positive cells. In Gram-negative cells (thin peptidoglycan, outer membrane), the complex forms but is not as firmly trapped.

**Visual after Step 2:**
- Everything still appears purple/violet — may appear slightly darker or more blue-purple due to CV-I complex
- No visible differentiation yet

**What can go wrong:**
- Too little time: CV-I complex doesn't fully form → poor differentiation in step 3
- Old iodine (oxidized): ineffective mordanting → inconsistent results

### Step 3: DECOLORIZATION (The Critical Step)

**Application:** Tilt slide; apply 95% ethanol (or acetone-alcohol mixture) dropwise. This is the step where all the difficulty lives.

**Chemistry:** The decolorizer dissolves the outer membrane of Gram-negative bacteria and washes the CV-I complex out through the thin peptidoglycan layer. Gram-positive bacteria have thick peptidoglycan (20–80 nm) that dehydrates and contracts when exposed to alcohol, trapping the CV-I complex.

**Critical timing:**

| Decolorization Duration | Effect |
|---|---|
| 0–5 seconds | Insufficient. Both Gram-positive and Gram-negative retain crystal violet → **everything stays purple** → false Gram-positive result for Gram-negatives |
| **5–15 seconds** | **Correct range for a thin smear.** Gram-negatives decolorize; Gram-positives retain. |
| **10–30 seconds** | **Correct range for a thick smear.** Thicker smears need more time. |
| 15–30+ seconds (thin smear) | Over-decolorization begins. Some Gram-positives start losing crystal violet → appear Gram-variable (patchy purple/pink) or Gram-negative (fully pink) |
| >30 seconds (any smear) | Severe over-decolorization. Most cells lose crystal violet → **everything turns pink** → false Gram-negative for Gram-positives |

**The critical variable is: apply decolorizer until runoff is CLEAR (not purple).** But "clear" is subjective, and the exact moment to stop is a skill that takes practice.

**Visual during decolorization (conceptual — player might see this as a minigame):**
- Immediate: purple dye streams off the slide
- 3–5 sec: runoff still heavily purple
- 8–12 sec: runoff turning pale lavender
- 12–15 sec: runoff clearing — STOP HERE for thin smear
- 20+ sec: runoff clear but damage may be occurring to Gram-positives

**Factors affecting optimal decolorization time:**

| Factor | Effect | Practical Impact |
|---|---|---|
| Smear thickness | Thick smear = more dye to remove = needs longer | 2–3× longer for thick vs. thin |
| Decolorizer type | Acetone (faster, more aggressive) vs. ethanol (slower, gentler) vs. mixture | Acetone: 5–10 sec. Ethanol: 10–30 sec. Acetone-alcohol mix: 8–15 sec. |
| Smear composition | Mucus/protein traps dye | Sputum smears need longer decolorization |
| Temperature | Warmer = faster decolorization | Summer lab vs. winter lab matters **[E]** |
| Culture age | Old cultures (>48 hrs) have thinner cell walls | See next section |

**Culture Age Effects on Gram Staining:**

| Culture Age | Gram-Positive Organisms | Gram-Negative Organisms |
|---|---|---|
| Young (12–18 hrs) | Strongly Gram-positive; resist decolorization well | Strongly Gram-negative; decolorize easily |
| Optimal (18–24 hrs) | Clear Gram-positive | Clear Gram-negative |
| Old (48–72 hrs) | Start becoming Gram-variable — cells dying, cell wall degrades, CV-I leaks out | Still Gram-negative |
| Very old (>72 hrs) | Frankly Gram-variable or Gram-negative | Gram-negative, cells may be lysed/ghostly |

**Notoriously Gram-Variable Organisms:**
- *Bacillus* spp. (especially old cultures — can show mixed purple/pink in same chain)
- *Gardnerella vaginalis* (variable by nature)
- *Clostridium* spp. (especially older cultures)
- *Mycobacterium* spp. (often appear as "ghosts" — faint or unstained on Gram stain due to waxy cell wall)
- *Corynebacterium* (may show uneven staining — some cells darker, some lighter)
- Any Gram-positive organism from old culture, dead cells, or partially treated with antibiotics **[E: In the 1880–1910 era, antibiotic effects not relevant, but old culture is a major source of variability]**

### Step 4: Safranin (Counterstain)

**Application:** Flood with safranin O solution; 30 seconds to 1 minute.

**Chemistry:** Safranin (a cationic red dye) stains everything it contacts pink/red. But Gram-positive cells that still hold the purple CV-I complex are already dark purple — the safranin color is masked. Gram-negative cells that lost their crystal violet take up safranin and appear pink/red.

**Visual after Step 4 (properly stained):**
- Gram-positive bacteria: dark purple/violet (crystal violet retained)
- Gram-negative bacteria: pink to red (safranin counterstain)
- Background: very faint pink (residual safranin) to nearly clear
- WBCs: pink (Gram-negative staining — they decolorize)
- RBCs: pale pink to invisible (thin, little protein to bind dye)
- Epithelial cells: pink cytoplasm, may show faint purple nuclei **[E]**

**What can go wrong:**
- Too little safranin time: Gram-negative bacteria too faint/pale to see
- Too much safranin time: background becomes too pink, obscuring bacteria; not usually a major problem
- Very thick safranin: can partially obscure Gram-positive purple

---

## 2.4 Acid-Fast Staining (Ziehl-Neelsen Method)

### Historical Context
Developed by Franz Ziehl (the carbolfuchsin solution) and Friedrich Neelsen (the procedure), published 1882–1883. Became the standard TB diagnostic stain almost immediately after Koch's discovery of *M. tuberculosis* (1882).

### Procedure

| Step | Reagent | Time | What Happens |
|---|---|---|---|
| 1. Stain | Carbolfuchsin (basic fuchsin + phenol), **heat slide until steaming** | 5 minutes (reapply/reheat if drying) | Phenol + heat drives red dye through waxy mycolic acid cell wall. ALL cells stain red. |
| 2. Decolorize | Acid-alcohol (3% HCl in 95% ethanol) | Until only faintest pink in thin areas (30 sec – 2 min) | Acid-alcohol removes carbolfuchsin from all cells EXCEPT mycobacteria (waxy wall retains) |
| 3. Counterstain | Methylene blue (or malachite green) | 1–2 minutes | Non-acid-fast background cells stain blue |

### Visual Result

| Element | Color | Notes |
|---|---|---|
| Acid-fast bacilli (AFB) | **Bright red to magenta** against blue background | The diagnostic finding |
| Non-acid-fast bacteria | Blue | Blend into background |
| WBCs | Blue | Nuclei darker blue |
| Background | Light blue | From methylene blue wash |
| RBCs | Pale blue or unstained | |

### Sensitivity and Reading Standards

**Clinical standard (modern, but similar principles applied in era):**
- **Positive:** ≥1 AFB per 100 oil immersion fields examined
- **Negative:** No AFB seen after examining at minimum **300 oil immersion fields** (takes 15–20 minutes of scanning)
- In practice, a "strongly positive" sputum may show 10+ AFB per field
- Paucibacillary specimens (early disease, HIV co-infection) may show only 1–2 AFB in 300 fields

**Quantitative reporting (era equivalent):**

| Modern Scale | AFB Count | Era Description [E] |
|---|---|---|
| Negative | 0 per 300 fields | "No tubercle bacilli found" |
| Scanty (±) | 1–2 per 300 fields | "Rare bacilli present" |
| 1+ | 1–9 per 100 fields | "Few bacilli present" |
| 2+ | 1–9 per 10 fields | "Bacilli present" |
| 3+ | 1–9 per field | "Numerous bacilli" |
| 4+ | >9 per field | "Very numerous bacilli" |

**Beaded appearance of TB bacilli:**
*M. tuberculosis* characteristically shows **uneven staining** — alternating stained and unstained segments along the rod, creating a "beaded" or "barred" appearance. This is due to uneven distribution of lipid in the cell wall. This is a key diagnostic feature.

**For rendering:** Draw rod with 3–6 alternating segments of bright red and pale/unstained. Segment length ~0.3–0.5 µm each. Irregularly spaced. **[E]**

---

## 2.5 Other Stains Available in the Era (1880–1910)

### Stains Actively Used

| Stain | Introduced | Use | Visual Result |
|---|---|---|---|
| **Methylene blue (simple stain)** | 1876 (Koch used it) | General-purpose: see all bacteria. Koch's preferred stain for TB before ZN. Quick screen. | All bacteria dark blue against light blue/clear background |
| **Löffler's methylene blue** | 1884 (Löffler) | Enhanced methylene blue (with KOH). Shows metachromatic granules in *Corynebacterium* | Cells blue; **metachromatic granules appear reddish-purple** (metachromasia) |
| **Neisser stain** | ~1903 | Specific for *C. diphtheriae* metachromatic granules | Granules dark blue-black; cell bodies yellow-brown |
| **Albert stain** | ~1920 [at era boundary] | Similar to Neisser for diphtheria | Granules blue-black; cells green |
| **India ink (negative stain)** | Used from ~1890s for capsules | Capsule visualization (pneumococcus, *Klebsiella*, *Cryptococcus*) | Background dark (ink particles); capsule appears as **clear halo** around dark cell; cell itself dark |
| **Nigrosin (negative stain)** | Late 1800s | Capsule visualization, cell morphology without fixation | Similar to India ink — dark background, clear halos |
| **Giemsa stain** | 1904 (Gustav Giemsa) | Blood parasites (malaria), blood cells, *Borrelia* in blood smears | RBCs pink; WBC nuclei dark purple; malaria parasites purple chromatin + blue cytoplasm |
| **Wright stain** | 1902 (James Wright) | Blood cell morphology; similar to Giemsa | Similar to Giemsa |
| **Fontana-Tribondeau (silver stain)** | ~1920s, but silver staining methods from 1900s | Spirochetes (*Treponema pallidum*) | Spirochetes appear dark brown/black against yellow-tan background |
| **Carbolfuchsin (without acid decolorization)** | 1880s | Simple red stain, used by some before Gram stain widely adopted | All bacteria red/magenta |

### Stains NOT Yet Available in the Era

| Stain | Introduced | Why Not Available |
|---|---|---|
| **Fluorescent stains (auramine-rhodamine)** | 1930s–1940s | Fluorescence microscopy not practical yet |
| **Phase contrast** | 1934 (Zernike) | Completely post-era |
| **Wayson stain** | 1920s | Post-era bipolar stain |
| **Periodic acid-Schiff (PAS)** | 1946 | Post-era |
| **Calcofluor white** | 1970s | Post-era; requires UV |

---

# 3. BACTERIAL MORPHOLOGY — What You Actually See

## 3.1 Per-Organism Visual Reference

All descriptions are at **1000× oil immersion after Gram stain** unless otherwise noted.

---

### 1. Staphylococcus aureus

**Cell shape:** Sphere (coccus). Slightly irregular — not perfectly circular. Some cells slightly ovoid.
- Diameter: **0.8–1.2 µm** (mean ~1.0 µm, SD ~0.1 µm)

**Gram reaction:** **Gram-positive** — deep violet/purple
- Color: HSL(270, 65%, 35%) → RGB(89, 31, 148) — dark violet
- Well-stained, high opacity

**Arrangement:** "Grape-like clusters" — the hallmark. Cells divide in random planes, creating irregular 3D clusters that appear as 2D aggregates on the slide.
- Distribution: **~60% in clusters (4–30+ cells), ~25% in pairs/tetrads, ~10% in short chains (3–4), ~5% singles** **[E]**
- Clusters vary from ~4 cells (small) to 20–40+ (large). Typical visible cluster: 8–15 cells.
- Cluster appearance on slide: Because clusters are 3D piled on a 2D slide, cells overlap. Center of cluster appears darker (more layers). Edge cells individually resolvable.

**Special features:**
- No capsule visible on Gram stain (capsule exists but is not visualized)
- No spores. Never.
- Occasional cell division visible — cells slightly elongated with a division furrow

**Density on slide:**
- From colony: Dense — 50–200+ cells per oil immersion field (from a thick smear of colony material)
- From clinical specimen (abscess/wound): 10–100 per field, mixed with abundant neutrophils. Many bacteria may be intracellular (inside WBCs that have phagocytosed them).

**Background (clinical specimen — abscess/wound):**
- Abundant neutrophils (many degenerate/lysed — "pus cells")
- Fibrin strands
- Tissue debris
- RBCs if wound site

---

### 2. Streptococcus pyogenes (Group A Strep)

**Cell shape:** Sphere (coccus), slightly more regular than staphylococci. May appear slightly ovoid with longer axis along chain direction.
- Diameter: **0.6–1.0 µm** (mean ~0.8 µm, SD ~0.08 µm) — slightly smaller than *S. aureus*

**Gram reaction:** **Gram-positive** — deep violet/purple
- Color: same as *S. aureus* — HSL(270, 65%, 35%)

**Arrangement:** **Chains** — the defining feature. Cells divide in one plane and remain attached.
- Chain length: **4–30+ cells** in chains from broth culture; **4–12 cells** more typical from solid culture or clinical specimen
- Chain length distribution (from clinical specimen) **[E]:** ~10% pairs (2), ~25% short chains (3–6), ~45% medium chains (7–15), ~15% long chains (16–30), ~5% singles
- Chains may be straight, curved, or undulating
- Cells within chains are touching or separated by tiny gaps (~0.1–0.2 µm)
- Chain curvature: chains flex and twist; typical radius of curvature 3–10 µm **[E]**

**Special features:**
- Capsule (hyaluronic acid) — not visible on Gram stain
- No spores
- Cells in chains may appear slightly flattened at contact points ("squished" appearance along division plane)

**Density on slide:**
- From throat swab: moderate — 5–30 organisms per field, mixed with many squamous epithelial cells and normal oral flora
- From wound/tissue: abundant organisms with many WBCs

**Background (throat swab):**
- Squamous epithelial cells (large, flat)
- Normal oral flora: mixed Gram-positive cocci, Gram-positive rods, Gram-negative rods
- WBCs (fewer than wound specimens)

---

### 3. Streptococcus pneumoniae (Pneumococcus)

**Cell shape:** **Lancet-shaped diplococcus** — elongated/pointed oval, NOT perfectly round. The classic description is "flame-shaped" or "lancet-shaped."
- Length (along long axis): **0.5–1.25 µm**
- Width: **0.5–0.75 µm**
- Each cell is tapered/pointed at the outer end, broader where it meets its partner

**Gram reaction:** **Gram-positive** — dark violet/purple
- Color: HSL(270, 65%, 35%)
- NOTE: pneumococci autolyse rapidly. Old cultures or specimens held at room temperature may show Gram-variable or Gram-negative staining. This is clinically important.

**Arrangement:** **Diplococci (pairs)** — the hallmark. Pairs oriented with pointed ends facing OUT, flat/broad sides touching.
- Distribution: **~75% diplococci (pairs), ~15% short chains (3–6), ~10% singles** **[E]**
- Characteristic diplococcal shape: two lancet-shaped cells facing each other like a "football" or "candle flame" pair. The pair overall is ~1.5–2.0 µm long.

**Special features:**
- **Capsule:** THE key feature. Thick polysaccharide capsule visible as a **clear unstained halo** around the cell pair on Gram stain if staining conditions are right. More dramatically visible with India ink negative stain (clear halo against dark background).
  - Capsule thickness: **0.5–3.0 µm** depending on serotype and growth conditions
  - On Gram stain: appears as a clear zone between the purple cells and the pink background. May be subtle.
  - With India ink: unmistakable clear halo
- No spores

**Density on slide (sputum):**
- Good sputum specimen: 5–50 per field in purulent areas; mixed with abundant neutrophils
- CSF (meningitis): may be very sparse (1–5 per field) or abundant (>50 per field) depending on severity

**Background (sputum):**
- Neutrophils (many — good quality indicator)
- Mucus strands
- Squamous epithelial cells (contamination indicator)
- Normal flora (if saliva contamination present)

---

### 4. Corynebacterium diphtheriae

**Cell shape:** **Club-shaped rods** (wider at one end than the other). Irregular, pleomorphic.
- Length: **2–6 µm** (highly variable)
- Width: **0.3–0.8 µm**
- One or both ends may be swollen/clubbed
- Cells are characteristically irregular — slightly curved, uneven width, bulging ends

**Gram reaction:** **Gram-positive** — purple, but often **unevenly stained** (characteristic)
- Color: HSL(270, 55%, 40%) — slightly less saturated purple; patchy
- Staining is characteristically irregular: some areas of the cell darker than others
- **Metachromatic (Babes-Ernst) granules:** With Löffler's methylene blue stain, polar granules appear as **dark reddish-purple spots** (metachromasia) at one or both ends of the cell. On Gram stain, these may appear as dense purple spots at poles.

**Arrangement:** THE most distinctive arrangement feature. Cells arranged in characteristic patterns:
- **V-formations and L-formations** (snapping division — cells remain attached at one point and splay apart)
- **Palisade arrangement** ("stack of logs" — cells lined up parallel)
- **Chinese letter pattern** (cells at various angles forming shapes resembling Chinese characters)
- Distribution **[E]:** ~40% V/L formations, ~25% palisade, ~25% Chinese letters, ~10% singles/irregular

**Special features:**
- **Metachromatic granules** (key diagnostic feature): intracellular polyphosphate storage granules
  - 1–4 per cell, at cell poles or scattered
  - On Gram stain: may appear as darker purple spots
  - On Löffler's methylene blue: granules stain reddish-purple (metachromatic)
  - On Neisser stain: granules blue-black, cell body yellow-brown
  - Size: ~0.3–0.5 µm per granule
- No capsule visible
- No spores

**Density on slide:**
- From throat pseudomembrane: abundant — 20–100+ per field
- Background: fibrin, necrotic debris, WBCs, mixed oral flora, epithelial debris from pseudomembrane

---

### 5. Clostridium tetani

**Cell shape:** **Rod with terminal round spore** — the classic "drumstick" or "tennis racket" appearance.
- Vegetative cell: Length **4–8 µm**, Width **0.3–0.5 µm** — slender rod
- Terminal spore: **spherical, 0.5–0.8 µm diameter** — wider than the cell body, giving the drumstick shape
- Spore is at one end (terminal position)

**Gram reaction:** **Gram-positive** (young cultures). Older cultures become **Gram-variable** to **Gram-negative**.
- Vegetative cell color: HSL(270, 55%, 38%) when Gram-positive; HSL(345, 50%, 55%) when Gram-negative
- **Spore: does NOT stain with Gram stain** — appears as a **clear/refractile round body** at the cell terminus. Appears as a bright, unstained circle against the colored rod.

**Arrangement:** Mostly **singles** or **pairs**, occasionally short chains (2–4 cells).
- Distribution **[E]:** ~65% singles, ~25% pairs, ~10% short chains

**Special features:**
- **Terminal drumstick spore** — the hallmark. Not all cells will be sporulated; from a wound specimen, expect ~20–60% of cells showing spores **[E]**
- Spore rendering: draw a clear/pale circle (diameter > rod width) at the terminus of the rod. Refractile — use a subtle bright highlight/halo effect.

**Density on slide:**
- Wound specimens: may be sparse — *C. tetani* is not necessarily abundant at wound sites. 1–10 per field typical. Often mixed flora.
- Clinical note: often diagnosed clinically, not by microscopy

**Background:** Wound debris, mixed anaerobic and aerobic flora, WBCs, tissue fragments

---

### 6. Clostridium perfringens

**Cell shape:** **Large, straight, blunt-ended rods** — "boxcar" shaped. One of the largest common pathogens.
- Length: **4–8 µm** (can be up to 10 µm)
- Width: **0.8–1.5 µm** — fat rods
- Ends are squared-off/blunt, not tapered (unlike most rods)
- Very regular, straight morphology

**Gram reaction:** **Gram-positive** — strongly purple in young cultures; becomes **Gram-variable** in older cultures or tissue specimens.
- Color: HSL(270, 60%, 35%) — strong purple

**Arrangement:** **Singles, pairs, and short chains** (2–4 cells)
- Distribution **[E]:** ~50% singles, ~35% pairs, ~15% short chains
- Chains are straight, cells touching end-to-end

**Special features:**
- **Spores:** *C. perfringens* produces spores RARELY in clinical specimens and on standard media. Subterminal, oval spores may be seen on special sporulation media. In practice, spores are almost never seen on patient specimens — this organism is notable for NOT showing spores despite being a *Clostridium*. **[E: <5% of cells show spores from clinical material]**
- **Capsule:** Prominent capsule present, visible as a clear halo on Gram stain. Capsule width: 0.5–2.0 µm **[E]**
- **No flagella visible** (present but below resolution)

**Density on slide:**
- Gas gangrene specimen: abundant — 20–100+ per field. Characteristically, ABUNDANT bacteria with VERY FEW WBCs (the toxin kills WBCs). This paucity of inflammatory cells despite abundant bacteria is a diagnostic clue.

**Background:** Tissue debris, RBCs, fibrin, notably FEW neutrophils (destroyed by toxin)

---

### 7. Mycobacterium tuberculosis

**NOT visible on Gram stain** — the waxy mycolic acid cell wall resists standard Gram staining. May appear as faint "ghosts" or colorless rods on Gram stain, or not seen at all.

**Acid-fast stain (Ziehl-Neelsen) — this is the required stain:**

**Cell shape:** Slender, slightly curved rods
- Length: **2–4 µm** (can be up to 5–6 µm)
- Width: **0.2–0.5 µm** — thin/slender
- Slightly curved or straight. May appear kinked.

**Acid-fast reaction:** **Positive** — bright red/magenta against blue background
- Cell color: HSL(345, 80%, 48%) → RGB(220, 25, 55) — vivid red-magenta
- Background: HSL(210, 40%, 70%) → RGB(133, 163, 199) — pale blue

**Arrangement:** **Singles, pairs, and small clumps** (cording)
- "Cording" — cells may align in parallel bundles or serpentine cords. This is a key feature of virulent TB strains.
- Distribution **[E]:** ~45% singles, ~25% pairs (parallel/aligned), ~20% small clumps (3–8 cells), ~10% cords (parallel bundles of 5–20+ cells)

**Special features:**
- **Beaded/barred appearance:** Uneven staining with alternating stained (bright red) and unstained (clear) segments. 3–6 segments per rod **[E]**. This is highly characteristic.
- **Cording:** Parallel alignment of multiple bacilli, like strands of rope. Indicates virulent strains.
- No spores, no capsule visible
- **Very slow growing** — in the game, culture results take weeks. Microscopy of clinical sputum is the rapid diagnostic method.

**Density on slide (sputum):**
- Highly variable: see AFB quantitation scale in Section 2.4
- "Paucibacillary" TB: may need to examine 300 fields to find even one bacillus
- Advanced cavitary TB: 10+ per field

**Background (sputum specimen):**
- Neutrophils (stained blue)
- Epithelial cells (blue)
- Mucus strands (pale blue)
- Non-acid-fast bacteria (blue — blend into background)

---

### 8. Neisseria gonorrhoeae (Gonococcus)

**Cell shape:** **Kidney-bean shaped (reniform) diplococci.** Each cell is slightly concave on the inner face.
- Diameter: **0.6–1.0 µm** per cell
- Pair dimensions: ~1.2–1.6 µm across the pair
- Characteristic shape: two coffee-beans or kidney-beans facing each other with concave sides adjacent. Slight gap between cells at the center.

**Gram reaction:** **Gram-negative** — pink/red
- Color: HSL(345, 50%, 58%) → RGB(199, 100, 117) — pink/salmon

**Arrangement:** **Diplococci** — overwhelmingly in pairs
- Distribution **[E]:** ~85% diplococci, ~10% tetrads (paired pairs), ~5% singles
- **CRITICAL:** The diagnostic hallmark is **intracellular diplococci** — pairs of Gram-negative cocci INSIDE neutrophils (within the cytoplasm of WBCs that have phagocytosed them).
  - In a positive urethral smear: ~70–90% of visible gonococci are intracellular **[E]**
  - Some extracellular diplococci are also present

**Special features:**
- **Intracellular location** is THE key diagnostic criterion
- Multiple pairs (5–20+) may be visible within a single neutrophil
- No spores, no capsule on Gram stain, no special structures
- Organism is delicate — rapidly autolyzes. Old specimens may show fewer organisms.

**Density on slide (urethral discharge):**
- Male urethral: abundant — 10–50+ organisms per field (both intra- and extracellular); sensitivity of Gram stain ~95% in symptomatic males
- Female cervical: less abundant — 2–20 per field; sensitivity only ~50–70% **[E]**

**Background (urethral smear):**
- Abundant neutrophils (key — these are the "host" cells containing gonococci)
- Few epithelial cells
- Some mucus

---

### 9. Neisseria meningitidis (Meningococcus)

**Cell shape:** **Kidney-bean shaped diplococci** — identical morphology to *N. gonorrhoeae*
- Diameter: **0.6–1.0 µm** per cell
- Pair dimensions: ~1.2–1.6 µm

**Gram reaction:** **Gram-negative** — pink/red
- Color: same as gonococci — HSL(345, 50%, 58%)

**Arrangement:** **Diplococci** — same as *N. gonorrhoeae*
- Also found intracellularly in WBCs in CSF specimens

**Special features:**
- **Morphologically indistinguishable from *N. gonorrhoeae* by Gram stain alone.** Differentiation is by specimen source (CSF vs. urethral), culture, and clinical context.
- Capsule present but not visible on Gram stain (visible with India ink or specific capsule stains)
- In CSF: organisms may be intracellular (within neutrophils) and extracellular

**Density on slide (CSF):**
- Highly variable: may be very sparse (1–5 per 10 fields) in early/treated meningitis, or abundant (>50 per field) in fulminant disease
- CSF is a LOW-cellularity specimen — there are few total cells per field

**Background (CSF):**
- Neutrophils (increased in bacterial meningitis — normally <5 WBCs per field in CSF)
- Very clean background (CSF is normally crystal-clear)
- RBCs if traumatic tap or subarachnoid hemorrhage
- Minimal debris

---

### 10. Escherichia coli

**Cell shape:** **Straight rod** — medium-sized, classic "rod" morphology
- Length: **1.0–3.0 µm** (mean ~2.0 µm)
- Width: **0.5–1.0 µm** (mean ~0.7 µm)
- Ends: rounded (not blunt like *C. perfringens*, not tapered)

**Gram reaction:** **Gram-negative** — pink/red
- Color: HSL(345, 50%, 58%)

**Arrangement:** Mostly **singles**, some pairs
- Distribution **[E]:** ~70% singles, ~25% pairs (end-to-end), ~5% short chains (3–4 cells)
- Random orientation on slide — no preferred alignment

**Special features:**
- Nothing distinctive by morphology — *E. coli* is the "generic Gram-negative rod." It looks identical to dozens of other enteric bacteria (Klebsiella without capsule, Proteus, Salmonella, Shigella, etc.)
- This is a key gameplay element: **you CANNOT identify *E. coli* by Gram stain alone.** The Gram stain tells you "Gram-negative rod" and culture is needed for speciation.

**Density on slide:**
- From urine (UTI): moderate to abundant, 5–50+ per field
- From blood culture: variable
- From colony: very dense

**Background:** Depends on specimen type. Urine: WBCs, squamous cells if contaminated, RBCs if hemorrhagic.

---

### 11. Klebsiella pneumoniae

**Cell shape:** **Straight rod** — plump, slightly larger than *E. coli*
- Length: **1.0–3.0 µm**
- Width: **0.6–1.2 µm** — fatter than *E. coli*

**Gram reaction:** **Gram-negative** — pink/red
- Color: HSL(345, 50%, 58%)

**Arrangement:** Singles and pairs, similar to *E. coli*

**Special features:**
- **PROMINENT CAPSULE** — the defining microscopic feature. The thick polysaccharide capsule appears as a large, clear, unstained halo around each cell.
  - Capsule thickness: **1.0–5.0 µm** — can be wider than the cell itself!
  - On Gram stain: clear zone around pink rod. The "capsular halo" is often the first thing noticed.
  - With India ink: dramatic clear halo against dark background
  - Capsule may cause cells to appear widely spaced — the clear zone separates cells from each other
- Without the capsule feature, *Klebsiella* looks identical to other enteric Gram-negative rods

**Density on slide (sputum):**
- "Currant jelly sputum" (characteristic of *Klebsiella* pneumonia): abundant organisms, 20–100+ per field; thick bloody mucoid background
- Capsules give the field a "bubbly" or "Swiss cheese" appearance — clear round halos scattered across the field

**Background:** Thick mucus, blood, neutrophils, epithelial cells

---

### 12. Vibrio cholerae

**Cell shape:** **Curved rod** — the classic "comma-shaped" bacillus
- Length: **1.5–3.0 µm** (along the curve)
- Width: **0.3–0.5 µm** — slender
- Curvature: gentle comma or C-shape. Radius of curvature ~2–5 µm **[E]**
- Koch described them as "comma bacilli" — this shape is the hallmark

**Gram reaction:** **Gram-negative** — pink/red
- Color: HSL(345, 50%, 58%)

**Arrangement:** **Singles** predominantly. In stool specimens, may appear in parallel arrays like "schools of fish."
- Distribution **[E]:** ~80% singles, ~15% pairs (end-to-end), ~5% short parallel groups
- "School of fish" arrangement: multiple curved rods aligned with concave sides facing the same direction. Characteristic but not always present.

**Special features:**
- Comma shape is distinctive — differentiate from straight Gram-negative rods
- Very motile (darting motility on wet mount — "shooting star" movement). On a fixed, stained slide this isn't visible, but on a wet mount it's dramatic.
- No capsule, no spores

**Density on slide (stool — "rice water stool"):**
- Very abundant — "rice water" stool from cholera is essentially a pure culture. 50–200+ per field.
- Characteristically, very FEW WBCs (cholera is a non-invasive toxin-mediated disease — enterotoxin, not tissue invasion)

**Background (rice water stool):**
- Mucus flecks
- Epithelial debris
- Very few WBCs (key differentiator from dysentery)
- Minimal RBCs

---

### 13. Treponema pallidum (Syphilis spirochete)

**CRITICAL: NOT visible on standard Gram stain or any standard bright-field stain.**

*T. pallidum* is too thin (~0.1–0.2 µm width) to be resolved by bright-field microscopy, and does not take up standard stains well.

**Visualization methods available in era:**
1. **Darkfield microscopy** (available ~1906 onward; Siedentopf and Zsigmondy ultramicroscope principles). Requires fresh, unfixed, wet-mount specimen.
2. **Silver impregnation stains** (Fontana-Tribondeau, Warthin-Starry — early 1900s and later). These coat the organism with silver deposits, making it thick enough to see.
3. India ink (limited success — spirochete too thin for reliable capsule/negative staining)

**Darkfield appearance:**
- Bright, glowing, corkscrew-shaped organism against dark background
- Length: **6–15 µm**
- Width: **~0.1–0.2 µm** (but appears ~0.3–0.5 µm due to diffraction glow)
- **Coils:** 6–14 tight, regular, evenly-spaced coils
- Coil wavelength (peak-to-peak): **~1.0–1.1 µm**
- Coil amplitude: **~0.2–0.3 µm**
- **Motility:** Characteristic slow rotation and flexion. Corkscrew rotation, back-and-forth flexing, angular movement about the center. This motility pattern helps differentiate from non-pathogenic spirochetes.

**Silver stain appearance:**
- Dark brown to black spirochete against yellow-tan background
- Coiled morphology visible but less crisp than darkfield
- Width appears ~0.3–0.6 µm (silver deposits thicken the apparent diameter)

**Density on specimen:**
- Primary chancre scrapings: moderate — 5–20 per field on darkfield, must search carefully
- Secondary syphilis lesions: more abundant
- Tertiary: very sparse or absent

**Background:** Darkfield — scattered bright particles, occasional cells. Silver stain — yellow-brown tissue with various stained structures.

---

### 14. Bacillus anthracis (Anthrax)

**Cell shape:** **Very large rods** — among the largest pathogenic bacteria
- Length: **4–10 µm** (can form chains much longer)
- Width: **1.0–1.5 µm** — fat rods
- Ends: **squared-off/blunt** — "bamboo stick" or "boxcar" appearance
- Chains have a characteristic appearance where cells are joined end-to-end with small constrictions at junctions, resembling bamboo segments or linked freight cars.

**Gram reaction:** **Gram-positive** — deep purple
- Color: HSL(270, 65%, 35%)

**Arrangement:** **Long chains** — the hallmark arrangement
- Chain length from clinical specimens: **3–20+ cells** in chains. In blood smears from fatal anthrax: may see chains of 3–8 cells.
- From culture: chains can be very long (20–50+ cells)
- Distribution **[E]:** ~10% singles, ~20% pairs/short (2–4), ~50% medium chains (5–15), ~20% long chains (16+)
- Chains are straight to slightly curved, not wavy

**Special features:**
- **Central/subterminal oval endospore** — but spores are usually NOT present in clinical specimens from living patients. Spores form in the presence of oxygen and at lower temperatures — in blood specimens at 37°C, *B. anthracis* is typically non-sporulated.
  - Spore: oval, **1.0–1.5 × 0.7–1.0 µm**, does NOT swell the cell (unlike some other *Bacillus* or *Clostridium* spores). Appears as a clear/refractile oval within the rod.
  - If specimen is from environment/culture: ~20–80% of cells may show spores **[E]**
- **Capsule:** Prominent capsule (poly-D-glutamic acid, not polysaccharide) visible on Gram stain from clinical specimens (blood, tissue). Appears as a clear halo, **0.5–2.0 µm wide** **[E]**.
  - Capsule is a diagnostic feature in blood smears — helps distinguish from non-pathogenic *Bacillus* species
- **"Ground glass" appearance [E]:** Due to the capsule and the even staining, cells may have a slightly translucent quality at edges.
- **No motile** (unlike other *Bacillus* spp. — this helps differentiation on wet mount)

**Density on slide:**
- Blood smear (fatal anthrax): abundant — 10–100+ per field. The blood appears packed with large Gram-positive rods in chains — a dramatic and unmistakable finding.
- Cutaneous anthrax vesicle fluid: moderate

**Background (blood smear):**
- RBCs (dominant, pale pink ghosts on Gram stain)
- WBCs
- The contrast of large purple chains against a sea of pale pink RBCs is very dramatic

---

### 15. Yersinia pestis (Plague)

**Cell shape:** **Plump coccobacillus** (short, fat rod with rounded ends — between a rod and a coccus)
- Length: **1.0–2.0 µm**
- Width: **0.5–0.8 µm**
- Ovoid/egg-shaped. The short, plump shape can be mistaken for cocci.

**Gram reaction:** **Gram-negative** — pink/red
- Color: HSL(345, 50%, 58%)

**Arrangement:** **Singles, pairs, and short chains**
- Distribution **[E]:** ~60% singles, ~30% pairs, ~10% short chains

**Special features:**
- **Bipolar staining** — THE diagnostic hallmark. With Wayson stain, methylene blue, or Giemsa, the poles of the cell stain darkly while the center remains pale, creating a "**safety pin**" or "closed safety pin" appearance.
  - On Gram stain: bipolar staining may be subtle but present. The poles appear slightly darker pink than the center.
  - On methylene blue: much more pronounced. Dark blue poles, pale blue center.
  - Bipolar staining visibility: **clear on methylene blue, subtle on Gram stain** **[E]**

**Density on slide (bubo aspirate):**
- Abundant — 20–100+ per field from bubo aspirate
- From blood (septicemic plague): variable, may be sparse to abundant

**Background (bubo aspirate):**
- Neutrophils (many)
- Fibrin
- Necrotic cell debris
- Bloody — RBCs common

---

## 3.2 Morphology Rendering Parameters

### Shape Primitives

**Cocci (spheres):**
- Render as circles (or very slightly irregular ellipses — add ≤5% random eccentricity for realism)
- Radius = diameter/2 in pixel coordinates
- For "lancet-shaped" (*S. pneumoniae*): use pointed ellipse — taper one end to ~60% width

**Rods (bacilli):**
- Render as rounded rectangles (stadium shapes): rectangle body with hemicircular end caps
- Body rectangle: (length − width) × width
- End caps: semicircles with radius = width/2
- For blunt-ended rods (*B. anthracis*, *C. perfringens*): reduce end cap radius to width × 0.25 — more squared
- For club-shaped (*C. diphtheriae*): make width taper from one end to the other (narrow end = 60–80% of wide end)

**Curved rods (*V. cholerae*):**
- Render rod primitive along a curved path (arc of a circle)
- Arc angle: 30–60° **[E]**. Use 45° as default.
- Curvature radius: 2–5 µm

**Spirochetes (*T. pallidum*):**
- Render as a sine wave or helix projected to 2D
- Wavelength: ~1.0 µm, amplitude: ~0.25 µm, line width: 0.15–0.2 µm
- Number of waves: 6–14

### Rendering Chains

- Place cells sequentially along a gently curved path
- Spacing between cells: 0–0.2 µm (touching to slight gap)
- Chain curvature: use a cubic Bézier curve or sinusoidal path
  - Curvature frequency: 1 complete wave per 10–20 µm of chain length **[E]**
  - Amplitude: 0.5–2.0 µm off the straight line **[E]**
- **Chain length distribution** (sample from geometric distribution):
  - P(n cells in chain) ∝ (1-p)^(n-2) × p for n ≥ 2, where p depends on species
  - *S. pyogenes* from clinical: p ≈ 0.12 (longer chains, mean ~8) **[E]**
  - *S. pyogenes* from culture: p ≈ 0.08 (even longer chains) **[E]**
  - *B. anthracis*: p ≈ 0.10 (mean ~10) **[E]**

### Rendering Clusters (*S. aureus*)

- **3D cluster projection to 2D:** Clusters are 3D aggregates pressed onto a 2D slide.
- Generate cluster as random packing of spheres in 3D, then project to 2D:
  1. Place first cell at origin
  2. For each subsequent cell, place adjacent to a random existing cell at a random 3D angle
  3. Project all centers to XY plane
  4. Cells that overlap in projection: render with depth ordering (back cells first, front cells on top)
  5. Cluster center appears denser (more overlap) than edges
- Cluster size distribution: sample N from range [4, 30], with peak at ~8–12 **[E]**
- **Alternate simplified method:** Place cells in a 2D irregular cluster with random packing:
  1. Place cells at center with slight random offsets
  2. Use a Poisson disc distribution with minimum distance = 0.6 × cell_diameter (cells can slightly overlap)
  3. Overall cluster shape: roughly circular to irregular blob

### Rendering Diplococci (*Neisseria*, *S. pneumoniae*)

**Neisseria-type (kidney-bean):**
- Two circles, each with a concave inner face
- Render each cell as a circle with a small semicircular "bite" taken from the inner side
- Separation between cells: 0.05–0.15 µm
- Axis of pair: random angle

**Pneumococcus-type (lancet):**
- Two elongated, tapered ovals pointing outward
- Each cell is a pointed ellipse: wider at the shared face, tapered at the outer end
- Contact at the broad ends; pointed ends facing out
- Overall pair shape: ~2 µm long, ~1 µm wide

### Intra-Species Variation

Apply random variation to each cell:
- **Size:** Normal distribution with species-specific mean and SD (typically SD = 5–12% of mean) **[E]**
- **Shape:** Minor random perturbation to ellipse axes (±5% width, ±8% length) **[E]**
- **Orientation:** Random rotation (uniform 0–360°) for singles; constrained for chains (aligned with chain direction ±10°)
- **Stain intensity:** Normal distribution of fill opacity, mean 0.85, SD 0.08 **[E]** — some cells darker, some lighter

---

## 3.3 Non-Bacterial Elements Visible on Slides

### White Blood Cells

**Neutrophils (most common in bacterial infections):**
- Diameter: **10–15 µm** (approximately 10–15× the diameter of a coccus)
- Gram-stain appearance:
  - Cytoplasm: pale pink (safranin uptake)
  - Nucleus: dark purple/violet — multilobed (2–5 lobes connected by thin strands). The segmented nucleus is very distinctive.
  - In degenerate/dying neutrophils: nucleus becomes a single dark purple blob or fragments — "pyknotic"
  - Bacteria may be visible WITHIN the cytoplasm (intracellular bacteria — diagnostically important for *N. gonorrhoeae*, *S. aureus*)
- Color: nucleus HSL(270, 60%, 30%), cytoplasm HSL(345, 25%, 80%) **[E]**
- Count per field varies enormously by specimen type and infection severity

**Lymphocytes:**
- Diameter: **7–10 µm**
- Large round purple nucleus that fills most of the cell
- Thin rim of pale blue-pink cytoplasm
- Less common in acute bacterial infection (more in viral or chronic conditions)

**Monocytes/macrophages:**
- Diameter: **12–20 µm**
- Kidney-shaped or folded nucleus, more cytoplasm than lymphocyte
- May contain ingested bacteria or debris

### Red Blood Cells

- Diameter: **6–8 µm** (mean 7.5 µm)
- On Gram stain: pale pink to colorless. Biconcave disc appears as a faint circle with slight central pallor.
- May appear as "ghosts" (barely visible) or as pink circles depending on staining
- In blood smears, RBCs dominate the field and provide useful size reference

### Epithelial Cells

**Squamous epithelial cells (from skin/oral/vaginal surface):**
- Very large: **40–60 µm** — enormous compared to bacteria (50× the size of a coccus)
- Flat, thin, irregular polygonal shape
- Pale pink cytoplasm with small central purple nucleus
- Bacteria may adhere to the surface — "clue cells" (in vaginosis) are squamous cells coated with bacteria
- **Clinical significance:** In sputum, >10 squamous cells per low-power field indicates oral contamination — specimen may be rejected

**Columnar epithelial cells (from respiratory/GI tract):**
- Tall, narrow: ~10–15 µm wide × 20–40 µm tall
- Oval nucleus at base
- Less common to see on routine smears

### Artifacts

| Artifact | Appearance | Cause | How to Distinguish from Bacteria |
|---|---|---|---|
| **Crystal violet precipitate** | Angular, geometric, deep purple chunks/crystals. Refractile. Sharp edges. | Undissolved or precipitated crystal violet | Geometric shape; much larger (5–50 µm); refractile; sharp edges unlike any bacterium |
| **Air bubbles** | Large, round, refractile circles with dark rim and bright center. Newton's rings. | Air trapped under coverslip | Very large (50–500+ µm); perfect circles; rainbow interference rings |
| **Stain precipitate (general)** | Fine granular purple or pink deposits scattered across background | Old reagents, unfiltered stain | Random distribution; not cellular shape; varies in size (0.1–2 µm granules) |
| **Debris/fibrin** | Irregular, stringy, pale pink or colorless strands | Tissue components, mucus | Stringy, no defined cell shape; larger than bacteria; irregular |
| **Lens dirt/immersion oil bubbles** | Dark spots or circles that don't move with stage | Dirty optics | Fixed in field regardless of stage movement; perfectly circular |

---

# 4. THE CHALLENGE OF INTERPRETATION — Where Real Difficulty Lives

## 4.1 Ambiguous Gram Stains

### Commonly Misinterpreted Scenarios

| Scenario | What the Player Sees | The Trap | Correct Interpretation |
|---|---|---|---|
| Old Gram-positive culture | Purple cells mixed with pink cells of the same morphology | "Is it mixed flora?" | **Gram-variable** — old culture losing cell wall integrity. Report as "Gram-variable" with morphology. |
| Over-decolorized staphylococci | Pink cocci in clusters | "Gram-negative cocci?" | *S. aureus* that's been over-decolorized. Compare to internal control (if present) or restain. No Gram-negative organism makes grape clusters. |
| Under-decolorized *E. coli* | Purple rods | "Gram-positive rods?" | *E. coli* (or other GNR) that wasn't properly decolorized. The thick smear area retained crystal violet. Find a thin area to read. |
| *Mycobacterium* on Gram stain | Faint rod-shaped ghosts; barely visible | "Nothing there" / "Artifact" | Mycobacteria resist Gram stain — their waxy wall doesn't retain either dye well. "Ghost cells" = consider AFB stain. |
| Mixed infection specimen | Multiple morphotypes — purple cocci, pink rods, purple rods | "How many organisms?" | Report ALL distinct morphotypes seen. This takes careful systematic examination. |

### Organisms With Reliable Gram-Variable Behavior

| Organism | Why Variable | Approximate Purple:Pink Ratio [E] |
|---|---|---|
| *Gardnerella vaginalis* | Thin cell wall | 50:50 variable — technically Gram-positive but often stains negative |
| *Bacillus* spp. (old culture) | Cell wall degradation with age | 70:30 to 30:70 depending on age |
| *Clostridium* spp. (old culture) | Same mechanism | Similar to *Bacillus* |
| *Mycobacterium* spp. | Waxy wall resists all stains | Usually ghosts — 90%+ unstained |
| *Corynebacterium* spp. | Naturally uneven staining | 80:20 (most cells purple but unevenly) |
| Any dead/dying Gram-positive cell | Wall integrity lost | Individual dead cells stain pink; viable cells purple |

### Quantifying Interpretive Difficulty

In a well-run clinical lab (modern), approximately **5–10%** of Gram stains have significant interpretive difficulty. **[E]** In the 1880–1910 era, with less standardized reagents and technique, this figure would be higher — perhaps **15–25%**. **[E]**

Sources of difficulty:
- Mixed organisms: ~30% of clinical specimens contain 2+ organism types
- Gram-variable staining: ~5–10% of well-prepared slides show some Gram-variability
- Poor specimen quality: ~20–30% of sputum specimens are saliva-contaminated

---

## 4.2 Specimen Quality Issues

### Mixed Flora

A wound specimen with 3+ organisms typically shows:
- Multiple morphotypes visible in the same field: e.g., Gram-positive cocci in clusters + Gram-negative rods + Gram-positive rods
- Different sizes, shapes, and colors intermingled
- May be difficult to determine which organism is the pathogen vs. colonizer
- **Rendering:** Place multiple organism types in the same field with random intermingling. Vary density — one type may predominate.

### Sputum Quality Criteria

The Bartlett/Murray-Washington criteria (modern but principles applied by careful era clinicians):

| Quality Grade | WBC per LPF (10×) | Squamous Epithelial Cells per LPF | Assessment |
|---|---|---|---|
| Good | >25 | <10 | Lower respiratory specimen — suitable for culture |
| Acceptable | >25 | 10–25 | Borderline — interpret with caution |
| Reject (saliva) | <10 | >25 | Oral contamination — request new specimen |

**Visual appearance of contaminated sputum:**
- Numerous large squamous cells (40–60 µm) covering the field
- Mixed oral flora: many different morphotypes of Gram-positive and Gram-negative cocci and rods — essentially a "lawn" of mixed bacteria
- Few WBCs
- This is saliva, not lower respiratory secretion

**Visual appearance of good sputum:**
- Many neutrophils (10–15 µm, segmented nuclei)
- Few squamous cells
- Bacteria, if present, are typically of 1–2 morphotypes (the pathogen)
- Mucus strands visible

---

## 4.3 Look-Alikes and Differential Morphology

### Confusion Matrix by Morphology

**Gram-Positive Cocci in Clusters → Could be:**
- *S. aureus* (most likely)
- *S. epidermidis* or other coagulase-negative staphylococci (identical morphology — cannot distinguish on Gram stain)
- Overdecolorized clusters may suggest Gram-negative cocci, but NO Gram-negative organism makes true grape-like clusters

**Gram-Positive Cocci in Chains → Could be:**
- *S. pyogenes* (Group A Strep)
- *S. agalactiae* (Group B Strep) — identical morphology
- *Enterococcus* spp. — shorter chains, sometimes pairs; cannot reliably distinguish from streptococci on Gram stain
- Other streptococcal species

**Gram-Positive Cocci in Pairs (Diplococci) → Could be:**
- *S. pneumoniae* (lancet-shaped — this is the key differentiator)
- *Enterococcus* (ovoid, not lancet-shaped)
- Other streptococci (can form pairs)

**Gram-Negative Diplococci → Could be:**
- *N. gonorrhoeae* (if intracellular in urethral specimen)
- *N. meningitidis* (if in CSF)
- *Moraxella catarrhalis* (larger, plumper — kidney-bean shape similar)
- *Acinetobacter* (coccobacillus, can look like diplococci)

**Gram-Negative Rods → Could be (many!):**
- *E. coli*, *Klebsiella*, *Proteus*, *Salmonella*, *Shigella*, *Serratia*, *Enterobacter*... — essentially any member of Enterobacteriaceae
- *Pseudomonas* (slightly thinner, may have greenish pigment on culture)
- **Culture is essential — morphology alone cannot speciate Gram-negative rods**
- *Klebsiella* is the exception IF capsule halo is visible

**Gram-Positive Large Rods → Could be:**
- *Bacillus anthracis* (chains, capsule, non-motile)
- *Bacillus cereus/subtilis/other* (identical morphology — motile on wet mount)
- *Clostridium perfringens* (boxcar shape, few spores)
- *Clostridium* spp. (with spores)
- Environmental *Bacillus* contamination (very common)

### How a Skilled Microscopist Differentiates

| Feature | How to Assess | What It Tells You |
|---|---|---|
| Morphology | Exact shape — lancet vs. round vs. kidney-bean | Narrows differential |
| Arrangement | Chains vs. clusters vs. pairs vs. singles | Key grouping clue |
| Intracellular location | Bacteria inside WBCs? | Suggests pathogenicity (especially Neisseria) |
| Capsule | Clear halo visible? | *S. pneumoniae*, *Klebsiella*, *B. anthracis* |
| Spore | Refractile body? Position? | Genus-level clue (*Clostridium*, *Bacillus*) |
| Specimen source | Where did this come from? | Context is essential — same morphology means different things in different specimens |
| Clinical information | Patient symptoms, history | The microscopist always integrates clinical data |

---

## 4.4 Reporting Standards (1880s–1910s)

### Era-Specific Reporting

In the 1880–1910 era, standardized reporting was developing but not formalized:

**Typical format of a microscopy report [H, E]:**
> "Examination of sputum smear, stained by Gram's method: Numerous diplococci of lancet shape, staining by the method of Gram [Gram-positive], observed in great abundance, both free and within leucocytes. A few rod-shaped bacilli, decolorized by Gram's method [Gram-negative], also observed."

**Terminology of the era:**
- "Staining by Gram's method" = Gram-positive
- "Decolorized by Gram's method" = Gram-negative
- "Leucocytes" = WBCs (specifically neutrophils)
- "Bacilli" = rods (not specifically *Bacillus* genus)
- "Cocci" = spheres
- "Diplococci" = pairs
- "Streptococci" = chains (literally "twisted chain of berries" — used both as a descriptive term and a genus name)
- "Staphylococci" = clusters (literally "grape cluster of berries" — descriptive and genus name)
- Koch's postulates were the standard framework for attribution

### Semi-Quantitative Reporting Terminology

| Term | Approximate Count per OIF (1000×) | Notes |
|---|---|---|
| "Rare" / "Scanty" | 1–2 per 10+ fields | Must search to find them |
| "Few" | 1–5 per field | Present but not dominant |
| "Moderate" | 5–20 per field | Consistently visible |
| "Many" / "Numerous" | 20–50 per field | Dominant |
| "Very numerous" / "Abundant" | >50 per field | Packed |

---

# 5. PHOTOREALISTIC RENDERING PARAMETERS

## 5.1 Color Palette — Gram Stain

### Core Stain Colors

| Element | HSL | RGB | Hex | Notes |
|---|---|---|---|---|
| **Gram-positive (crystal violet), well-stained** | H:270 S:65% L:32% | (72, 29, 135) | #481D87 | Deep blue-violet. THE purple of Gram stain. |
| **Gram-positive, moderately stained** | H:270 S:55% L:40% | (97, 46, 158) | #612E9E | Lighter violet — typical working stain |
| **Gram-positive, faintly stained** | H:270 S:40% L:55% | (126, 95, 172) | #7E5FAC | Pale violet — under-stained or old reagents |
| **Gram-negative (safranin), well-stained** | H:345 S:55% L:52% | (195, 75, 97) | #C34B61 | Rose-pink to soft red |
| **Gram-negative, moderately stained** | H:348 S:45% L:60% | (201, 113, 124) | #C9717C | Salmon-pink — typical working stain |
| **Gram-negative, faintly stained** | H:350 S:30% L:72% | (211, 164, 169) | #D3A4A9 | Pale pink — faint |
| **Background (clean, well-stained)** | H:345 S:15% L:92% | (240, 228, 231) | #F0E4E7 | Very faint pink — residual safranin wash |
| **Background (more safranin)** | H:345 S:25% L:85% | (232, 200, 208) | #E8C8D0 | Light pink — more safranin than ideal |
| **Gram-variable cell** | Patchy mix of above | — | — | Render as cell with 40–60% purple fill and 40–60% pink fill in irregular patches |
| **Crystal violet precipitate** | H:275 S:80% L:25% | (55, 13, 115) | #370D73 | Very dark, saturated purple. Angular crystalline shapes. |

### Staining Intensity Variation

Apply to each cell as a multiplier on lightness (L in HSL):
- Well-stained: L × 0.85–1.0 (darker)
- Average: L × 1.0 (baseline)
- Faintly stained: L × 1.1–1.3 (lighter)
- Distribution across a well-prepared slide **[E]:** ~70% average, ~15% well-stained, ~15% faint

### Cell Opacity
- Bacteria: opacity **0.80–0.95** (mostly opaque; some light passes through, especially thin cells)
- Center of cell slightly more opaque than edges (natural optical effect of spherical/cylindrical shape)
- Rendering tip: apply radial gradient — center 95% opacity, edge 80% opacity for cocci; for rods, more uniform with slight edge softening

---

## 5.2 Color Palette — Acid-Fast Stain (Ziehl-Neelsen)

| Element | HSL | RGB | Hex | Notes |
|---|---|---|---|---|
| **AFB-positive (carbolfuchsin)** | H:345 S:80% L:48% | (220, 24, 57) | #DC1839 | Bright vivid red-magenta |
| **AFB beaded segments (stained)** | H:345 S:80% L:48% | (220, 24, 57) | #DC1839 | Same — bright red |
| **AFB beaded gaps (unstained)** | H:345 S:10% L:85% | (221, 213, 216) | #DDD5D8 | Near-white/very pale |
| **Methylene blue counterstain (cells)** | H:210 S:50% L:55% | (70, 120, 185) | #4678B9 | Medium blue |
| **Background** | H:210 S:30% L:78% | (175, 194, 217) | #AFC2D9 | Pale blue wash |
| **Non-AFB bacteria** | H:210 S:45% L:50% | (70, 110, 169) | #466EA9 | Blue — blend with background cells |

---

## 5.3 Scale and Proportions

### Viewport Sizing at 1000× Oil Immersion

The field of view at 1000× oil is ~170 µm diameter.

**Recommended viewport mapping:**

| Viewport Diameter (px) | Scale (px/µm) | 1 µm bacterium = | Notes |
|---|---|---|---|
| 600 px | ~3.5 px/µm | ~3.5 px | Minimum usable. Bacteria very small. |
| 800 px | ~4.7 px/µm | ~4.7 px | Good balance. Bacteria visible but small. |
| 1000 px | ~5.9 px/µm | ~5.9 px | Comfortable viewing. Recommended. |
| 1200 px | ~7.1 px/µm | ~7.1 px | Large viewport — good detail. |

**Recommended: 800–1000 px viewport diameter, yielding ~5–6 px per µm.**

At 5 px/µm:
- Coccus (1 µm) = 5 px diameter — visible as a dot; cluster visible as a cluster
- Rod (2 × 0.7 µm) = 10 × 3.5 px — clearly rod-shaped
- Neutrophil (12 µm) = 60 px — large, dominant feature
- RBC (7.5 µm) = 37.5 px — substantial circle
- Squamous epithelial cell (50 µm) = 250 px — fills 25% of viewport diameter
- Spirochete wavelength (1 µm) = 5 px — individual coils at resolution limit

### Bacteria Visible Per Field

At 170 µm diameter field (area ≈ 22,700 µm²):

| Specimen Type | Bacteria per OIF | WBCs per OIF | Notes |
|---|---|---|---|
| Dense colony smear | 200–1000+ | 0 | Packed |
| Moderate clinical specimen | 10–50 | 5–30 | Typical |
| Sparse (CSF, blood) | 0–5 | 0–10 | Must search many fields |
| Negative specimen | 0 | Variable | Scan 20–100+ fields |

---

## 5.4 Focus and Depth Effects

### Focus Levels

At 1000× oil, DOF ≈ 0.3 µm. Model focus as a continuous z-position parameter:

| Defocus Amount (µm from optimal) | Visual Effect | Gaussian Blur σ (at 5 px/µm) |
|---|---|---|
| 0 (in focus) | Sharp — full detail visible | 0 px |
| ±0.15 µm (within DOF) | Slightly soft — still readable | 0.3–0.5 px |
| ±0.5 µm | Notably blurry — shapes visible, detail lost | 1.5–2.0 px |
| ±1.0 µm | Blurry — cells visible as blobs, no morphology detail | 3.0–4.0 px |
| ±2.0 µm | Very blurry — only large features (cell clumps, WBCs) visible as faint smears | 6.0–8.0 px |
| ±5.0 µm | Out of focus — featureless gray/pink haze | 15+ px |

### "Racking Through" Simulation

When a player adjusts the fine focus knob, they are moving the focal plane through the specimen (z-scan):
- Total specimen thickness: **0.5–5.0 µm** for a smear (monolayer ≈ 0.5–1.5 µm; thick smear ≈ 3–5 µm)
- Fine focus range (era microscope): typically **20–50 µm total travel** per rotation of fine focus knob **[E]**
- Player rotates fine focus → focal plane moves in z → different layers come into/out of focus
- In a thick smear: cells at different z-levels appear as a stack. As player focuses through: top cells sharp (bottom blurry) → all sharp if thin enough → bottom cells sharp (top blurry)

**Rendering approach:**
1. Assign each rendered element a z-position (µm from glass surface)
2. Calculate defocus = |element_z − focal_plane_z|
3. Apply Gaussian blur with σ proportional to defocus (table above)
4. Opacity: reduce slightly with defocus (multiply by 1.0 – 0.1 × defocus_um) **[E]**

### Focus at Other Magnifications

| Magnification | DOF | Focus Difficulty |
|---|---|---|
| 40× | ~55 µm | No challenge — everything in focus |
| 100× | ~8.5 µm | Easy — almost all in focus |
| 400× | ~1.0 µm | Moderate — thin smear OK, thick smear requires focusing |
| 1000× oil | ~0.3 µm | Challenging — must find correct plane, especially in thick smears |

---

## 5.5 Optical Artifacts to Simulate

### Chromatic Aberration

**Lateral (color fringing at field edges):**
- Effect: RGB channels shift outward radially from center
- Achromatic objectives: R/B offset up to **2–3 px** at field edge (at 5 px/µm viewport)
- Apochromatic: **0.5–1 px** offset
- Implementation: shift R channel outward by offset amount; shift B channel inward (or vice versa); G stays centered
- Offset increases with distance from center: `offset = max_offset × (r / R)²` where r = distance from center, R = field radius

### Vignetting

**Natural vignetting from period optics:**
- Center: 100% brightness
- 50% radius: ~95% brightness
- 75% radius: ~85% brightness
- Edge: ~65–75% brightness **[E]**
- Implementation: multiply pixel brightness by `1.0 – vignette_strength × (r/R)²` where vignette_strength ≈ 0.25–0.35

### Newton's Rings (Air Bubbles)

When an air bubble is trapped under the coverslip:
- Appears as concentric colored rings (red, green, blue alternating)
- Central region may be bright or dark depending on thickness
- Diameter: 50–500+ µm (may fill part or all of the field)
- Ring spacing: decreases from center outward
- Implementation: interference pattern with `color = sin(k × r²)` where k controls ring density

### Crystal Violet Precipitate

- Scattered across field as angular, highly saturated purple chunks
- Size: 1–50 µm (variable)
- Shape: angular, geometric (rhomboid, needle-like, or irregular crystalline)
- Color: very dark purple, nearly opaque
- Refractile (bright highlight/glint at edges)
- Frequency: 0–20 per field depending on reagent quality **[E]**

### Field Curvature (Period Objectives)

- Center 60% of field: sharp
- 60–80%: slight blur (σ = 0.5–1.0 px)
- 80–100%: moderate blur (σ = 1.5–3.0 px)
- Implementation: radial blur gradient applied as post-processing pass
- Flat-field (Plan) objectives eliminate this, but these are NOT available in the 1880–1910 era

---

# 6. APPENDIX: Quick-Reference Parameter Tables for Code

## A.1 Organism Morphology Parameters

```javascript
const ORGANISM_MORPHOLOGY = {
  S_aureus: {
    name: "Staphylococcus aureus",
    shape: "coccus",
    width_um: { mean: 1.0, sd: 0.1, min: 0.7, max: 1.3 },
    length_um: null, // coccus — length = width
    gram: "positive",
    color_gram_hsl: { h: 270, s: 65, l: 32 },
    arrangement: ["cluster", "pair", "short_chain", "single"],
    arrangement_weights: [0.60, 0.25, 0.10, 0.05],
    cluster_size: { min: 4, max: 30, peak: 10 },
    chain_length: { min: 3, max: 5 }, // short chains only
    special: [],
    spore: false,
    capsule_visible_gram: false,
    intracellular: false, // can be in WBCs from clinical specimens but not diagnostic
    density_colony_per_oif: { min: 50, max: 500 },
    density_clinical_per_oif: { min: 5, max: 100 },
    notes: "Clusters are 3D-projected to 2D. Center of cluster denser (overlapping cells)."
  },

  S_pyogenes: {
    name: "Streptococcus pyogenes",
    shape: "coccus",
    width_um: { mean: 0.8, sd: 0.08, min: 0.6, max: 1.0 },
    length_um: null,
    gram: "positive",
    color_gram_hsl: { h: 270, s: 65, l: 32 },
    arrangement: ["chain", "short_chain", "pair", "single"],
    arrangement_weights: [0.45, 0.25, 0.20, 0.10],
    chain_length: { min: 4, max: 30, mean: 8, p_terminate: 0.12 },
    chain_curvature_radius_um: { min: 3, max: 10 },
    special: [],
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_colony_per_oif: { min: 50, max: 300 },
    density_clinical_per_oif: { min: 5, max: 50 },
    notes: "Chains may curve. Cells slightly flattened at contact points."
  },

  S_pneumoniae: {
    name: "Streptococcus pneumoniae",
    shape: "lancet_diplococcus",
    width_um: { mean: 0.6, sd: 0.06, min: 0.5, max: 0.75 },
    length_um: { mean: 0.9, sd: 0.1, min: 0.5, max: 1.25 }, // individual cell length
    gram: "positive",
    color_gram_hsl: { h: 270, s: 65, l: 32 },
    arrangement: ["diplococcus", "short_chain", "single"],
    arrangement_weights: [0.75, 0.15, 0.10],
    chain_length: { min: 3, max: 6 },
    special: ["capsule", "lancet_shape"],
    capsule_visible_gram: true,
    capsule_width_um: { min: 0.5, max: 3.0, mean: 1.5 },
    spore: false,
    intracellular: false,
    gram_variable_risk: 0.15, // autolysis in old specimens
    density_colony_per_oif: { min: 30, max: 200 },
    density_clinical_per_oif: { min: 2, max: 50 },
    notes: "Lancet/flame shape: tapered outer ends, broad where cells meet. Capsule = clear halo. Autolysis causes Gram-variability in old specimens."
  },

  C_diphtheriae: {
    name: "Corynebacterium diphtheriae",
    shape: "club_rod",
    width_um: { mean: 0.5, sd: 0.1, min: 0.3, max: 0.8 },
    length_um: { mean: 3.5, sd: 0.8, min: 2.0, max: 6.0 },
    club_taper: 0.7, // narrow end = 70% of wide end width
    gram: "positive",
    color_gram_hsl: { h: 270, s: 55, l: 40 }, // slightly less saturated — uneven staining
    staining_uniformity: 0.6, // 0=perfectly uniform, 1=highly variable [E]
    arrangement: ["v_formation", "palisade", "chinese_letters", "single"],
    arrangement_weights: [0.40, 0.25, 0.25, 0.10],
    special: ["metachromatic_granules", "uneven_staining", "club_shape"],
    granule_count: { min: 1, max: 4 },
    granule_size_um: { mean: 0.35, min: 0.2, max: 0.5 },
    granule_color_gram_hsl: { h: 270, s: 75, l: 22 }, // darker purple spots
    granule_color_loeffler_hsl: { h: 310, s: 60, l: 35 }, // reddish-purple (metachromasia)
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_colony_per_oif: { min: 30, max: 200 },
    density_clinical_per_oif: { min: 20, max: 100 },
    notes: "V/L formations from snapping division. Chinese letters = cells at random angles. Metachromatic granules at poles — key with Löffler's blue."
  },

  C_tetani: {
    name: "Clostridium tetani",
    shape: "rod_terminal_spore",
    width_um: { mean: 0.4, sd: 0.05, min: 0.3, max: 0.5 },
    length_um: { mean: 5.5, sd: 1.0, min: 4.0, max: 8.0 },
    gram: "positive", // young; becomes variable/negative in old cultures
    gram_variable_risk: 0.30,
    color_gram_hsl: { h: 270, s: 55, l: 38 },
    arrangement: ["single", "pair", "short_chain"],
    arrangement_weights: [0.65, 0.25, 0.10],
    special: ["terminal_round_spore"],
    spore: true,
    spore_position: "terminal",
    spore_shape: "round",
    spore_diameter_um: { mean: 0.65, sd: 0.08, min: 0.5, max: 0.8 },
    spore_swells_cell: true, // spore wider than rod — drumstick appearance
    spore_stains: false, // clear/refractile on Gram stain
    sporulation_rate_clinical: 0.40, // 40% of cells show spores [E]
    capsule_visible_gram: false,
    intracellular: false,
    density_clinical_per_oif: { min: 1, max: 15 },
    notes: "Drumstick/tennis racket shape. Terminal round spore wider than cell body. Gram-variable in old cultures. Often sparse in clinical specimens with mixed flora."
  },

  C_perfringens: {
    name: "Clostridium perfringens",
    shape: "boxcar_rod",
    width_um: { mean: 1.1, sd: 0.15, min: 0.8, max: 1.5 },
    length_um: { mean: 5.5, sd: 1.2, min: 4.0, max: 10.0 },
    end_rounding: 0.25, // 0=hemicircle, 1=flat. 0.25 = blunt/squared
    gram: "positive",
    gram_variable_risk: 0.20,
    color_gram_hsl: { h: 270, s: 60, l: 35 },
    arrangement: ["single", "pair", "short_chain"],
    arrangement_weights: [0.50, 0.35, 0.15],
    chain_length: { min: 2, max: 4 },
    special: ["boxcar_shape", "capsule", "rare_spores"],
    spore: true,
    spore_position: "subterminal",
    spore_shape: "oval",
    spore_visible_clinical: 0.05, // <5% show spores from clinical material [E]
    capsule_visible_gram: true,
    capsule_width_um: { min: 0.5, max: 2.0, mean: 1.0 },
    intracellular: false,
    density_clinical_per_oif: { min: 20, max: 200 },
    notes: "Large boxcar rods. Notably FEW WBCs in gas gangrene (toxin kills them). Spores almost never seen clinically."
  },

  M_tuberculosis: {
    name: "Mycobacterium tuberculosis",
    shape: "slender_rod",
    width_um: { mean: 0.35, sd: 0.06, min: 0.2, max: 0.5 },
    length_um: { mean: 3.0, sd: 0.7, min: 2.0, max: 6.0 },
    gram: "none", // does not Gram stain — use acid-fast
    stain_type: "acid_fast",
    color_afb_hsl: { h: 345, s: 80, l: 48 }, // bright red/magenta
    color_background_hsl: { h: 210, s: 40, l: 70 }, // methylene blue background
    arrangement: ["single", "pair", "clump", "cord"],
    arrangement_weights: [0.45, 0.25, 0.20, 0.10],
    special: ["beaded_staining", "cording", "acid_fast"],
    beaded_segments: { min: 3, max: 6 },
    beaded_segment_length_um: { mean: 0.4, min: 0.2, max: 0.6 },
    cord_cell_count: { min: 5, max: 25 },
    spore: false,
    capsule_visible_gram: false,
    density_clinical_per_oif: { min: 0, max: 50 }, // huge range — see AFB scale
    fields_to_examine_negative: 300,
    notes: "Invisible on Gram stain. Beaded = alternating stained/unstained segments. Cording = parallel bundles. Must examine 300 fields before calling negative."
  },

  N_gonorrhoeae: {
    name: "Neisseria gonorrhoeae",
    shape: "kidney_diplococcus",
    width_um: { mean: 0.8, sd: 0.08, min: 0.6, max: 1.0 },
    length_um: null, // coccus-like
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["diplococcus"],
    arrangement_weights: [1.0],
    special: ["intracellular", "kidney_bean_shape"],
    intracellular: true,
    intracellular_rate: 0.80, // ~80% seen inside WBCs [E]
    pairs_per_wbc: { min: 2, max: 25 },
    pair_gap_um: 0.1, // slight gap between kidney-bean halves
    concavity_depth: 0.15, // fraction of radius for inner concavity [E]
    spore: false,
    capsule_visible_gram: false,
    density_clinical_per_oif: { min: 5, max: 100 },
    notes: "KEY: intracellular Gram-negative diplococci within neutrophils. Kidney-bean / coffee-bean shaped pairs with flat/concave inner faces."
  },

  N_meningitidis: {
    name: "Neisseria meningitidis",
    shape: "kidney_diplococcus",
    width_um: { mean: 0.8, sd: 0.08, min: 0.6, max: 1.0 },
    length_um: null,
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["diplococcus"],
    arrangement_weights: [1.0],
    special: ["intracellular", "kidney_bean_shape"],
    intracellular: true,
    intracellular_rate: 0.60, // often both intra- and extracellular in CSF [E]
    pair_gap_um: 0.1,
    concavity_depth: 0.15,
    spore: false,
    capsule_visible_gram: false,
    density_clinical_per_oif: { min: 0, max: 100 }, // highly variable
    notes: "Morphologically identical to N. gonorrhoeae. Differentiated by specimen source (CSF vs. urethral) and culture."
  },

  E_coli: {
    name: "Escherichia coli",
    shape: "rod",
    width_um: { mean: 0.7, sd: 0.08, min: 0.5, max: 1.0 },
    length_um: { mean: 2.0, sd: 0.4, min: 1.0, max: 3.5 },
    end_rounding: 0.0, // 0 = standard hemicircular ends
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["single", "pair", "short_chain"],
    arrangement_weights: [0.70, 0.25, 0.05],
    special: [],
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_clinical_per_oif: { min: 5, max: 100 },
    notes: "Generic Gram-negative rod. Cannot be speciated by morphology — looks identical to Klebsiella (without capsule), Proteus, Salmonella, etc."
  },

  K_pneumoniae: {
    name: "Klebsiella pneumoniae",
    shape: "rod",
    width_um: { mean: 0.9, sd: 0.12, min: 0.6, max: 1.2 },
    length_um: { mean: 2.0, sd: 0.5, min: 1.0, max: 3.5 },
    end_rounding: 0.0,
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["single", "pair"],
    arrangement_weights: [0.65, 0.35],
    special: ["prominent_capsule"],
    capsule_visible_gram: true,
    capsule_width_um: { min: 1.0, max: 5.0, mean: 2.5 },
    spore: false,
    intracellular: false,
    density_clinical_per_oif: { min: 10, max: 200 },
    notes: "Looks like E. coli BUT with a dramatic clear capsular halo. Capsule can be wider than the cell. India ink makes capsule unmistakable."
  },

  V_cholerae: {
    name: "Vibrio cholerae",
    shape: "curved_rod",
    width_um: { mean: 0.4, sd: 0.05, min: 0.3, max: 0.5 },
    length_um: { mean: 2.0, sd: 0.4, min: 1.5, max: 3.0 },
    curvature_arc_degrees: { mean: 45, sd: 10, min: 25, max: 65 },
    curvature_radius_um: { mean: 3.5, min: 2, max: 5 },
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["single", "pair", "parallel_group"],
    arrangement_weights: [0.80, 0.15, 0.05],
    special: ["comma_shape", "school_of_fish"],
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_clinical_per_oif: { min: 50, max: 300 },
    notes: "Comma/C-shaped. 'School of fish' = parallel alignment. Stool specimens: abundant bacteria, very FEW WBCs."
  },

  T_pallidum: {
    name: "Treponema pallidum",
    shape: "spirochete",
    width_um: { mean: 0.15, sd: 0.02, min: 0.1, max: 0.2 },
    length_um: { mean: 10, sd: 2.5, min: 6, max: 15 },
    coil_wavelength_um: 1.05,
    coil_amplitude_um: 0.25,
    coil_count: { min: 6, max: 14, mean: 10 },
    gram: "none", // NOT visible on Gram stain
    stain_type: "darkfield_or_silver",
    color_darkfield: "bright_white_glow", // bright against dark background
    color_silver_hsl: { h: 30, s: 40, l: 25 }, // dark brown on yellow-tan background
    arrangement: ["single"],
    arrangement_weights: [1.0],
    special: ["darkfield_required", "corkscrew_motility", "too_thin_for_brightfield"],
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_clinical_per_oif: { min: 1, max: 25 },
    notes: "INVISIBLE on Gram stain. Requires darkfield (live) or silver stain (fixed). Regular tight coils. Motility is diagnostic (rotation + flexion)."
  },

  B_anthracis: {
    name: "Bacillus anthracis",
    shape: "large_rod",
    width_um: { mean: 1.25, sd: 0.15, min: 1.0, max: 1.5 },
    length_um: { mean: 6.0, sd: 1.5, min: 4.0, max: 10.0 },
    end_rounding: 0.25, // blunt/squared ends — bamboo stick
    gram: "positive",
    color_gram_hsl: { h: 270, s: 65, l: 32 },
    arrangement: ["long_chain", "medium_chain", "short_chain", "pair", "single"],
    arrangement_weights: [0.20, 0.30, 0.20, 0.20, 0.10],
    chain_length: { min: 2, max: 50, mean: 10, p_terminate: 0.10 },
    special: ["bamboo_stick_appearance", "central_spore", "capsule"],
    spore: true,
    spore_position: "central_to_subterminal",
    spore_shape: "oval",
    spore_diameter_um: { mean: 1.0, sd: 0.1 },
    spore_swells_cell: false, // does NOT swell the cell — fits within cell width
    spore_visible_clinical: 0.10, // ~10% in blood specimens (spores form in O2) [E]
    spore_visible_culture: 0.50, // ~50% on culture with oxygen [E]
    capsule_visible_gram: true,
    capsule_width_um: { min: 0.5, max: 2.0, mean: 1.0 },
    intracellular: false,
    density_clinical_per_oif: { min: 10, max: 200 },
    notes: "Very large Gram-positive rods in chains. Bamboo/boxcar junctions. Non-motile (KEY differentiator from other Bacillus spp). Capsule in clinical specimens. Spores rare in blood."
  },

  Y_pestis: {
    name: "Yersinia pestis",
    shape: "coccobacillus",
    width_um: { mean: 0.65, sd: 0.08, min: 0.5, max: 0.8 },
    length_um: { mean: 1.5, sd: 0.3, min: 1.0, max: 2.0 },
    end_rounding: 0.0, // rounded ends
    gram: "negative",
    color_gram_hsl: { h: 345, s: 50, l: 58 },
    arrangement: ["single", "pair", "short_chain"],
    arrangement_weights: [0.60, 0.30, 0.10],
    special: ["bipolar_staining"],
    bipolar_staining_gram: "subtle", // more visible with methylene blue/Wayson
    bipolar_pole_lightness_multiplier: 0.75, // poles 25% darker than center [E]
    bipolar_center_lightness_multiplier: 1.20, // center 20% lighter [E]
    spore: false,
    capsule_visible_gram: false,
    intracellular: false,
    density_clinical_per_oif: { min: 10, max: 200 },
    notes: "Short plump ovoid rod. 'Safety pin' bipolar staining best seen with methylene blue or Wayson stain (post-era). On Gram stain, bipolar effect is subtle. Can be mistaken for cocci."
  }
};
```

---

## A.2 Stain Color Parameters

```javascript
const STAIN_COLORS = {
  gram: {
    positive: {
      well_stained: { h: 270, s: 65, l: 32, rgb: [72, 29, 135], hex: "#481D87" },
      moderate:     { h: 270, s: 55, l: 40, rgb: [97, 46, 158], hex: "#612E9E" },
      faint:        { h: 270, s: 40, l: 55, rgb: [126, 95, 172], hex: "#7E5FAC" },
      opacity: { mean: 0.88, sd: 0.05, min: 0.75, max: 0.95 },
      stroke_color: { h: 270, s: 70, l: 22 }, // slightly darker outline
      stroke_width_fraction: 0.08 // as fraction of cell radius [E]
    },
    negative: {
      well_stained: { h: 345, s: 55, l: 52, rgb: [195, 75, 97], hex: "#C34B61" },
      moderate:     { h: 348, s: 45, l: 60, rgb: [201, 113, 124], hex: "#C9717C" },
      faint:        { h: 350, s: 30, l: 72, rgb: [211, 164, 169], hex: "#D3A4A9" },
      opacity: { mean: 0.82, sd: 0.06, min: 0.70, max: 0.92 },
      stroke_color: { h: 345, s: 60, l: 40 },
      stroke_width_fraction: 0.08
    },
    variable: {
      // For Gram-variable cells: mix of positive and negative
      purple_fraction: { mean: 0.5, sd: 0.2, min: 0.1, max: 0.9 }, // per-cell random
      rendering: "patchy_blend" // irregular patches of purple and pink within one cell
    },
    background: {
      clean:       { h: 345, s: 15, l: 92, rgb: [240, 228, 231], hex: "#F0E4E7" },
      pink_wash:   { h: 345, s: 25, l: 85, rgb: [232, 200, 208], hex: "#E8C8D0" },
      heavy_safranin: { h: 345, s: 30, l: 78, rgb: [224, 182, 192], hex: "#E0B6C0" },
      opacity: 1.0
    },
    precipitate: {
      crystal_violet: { h: 275, s: 80, l: 25, rgb: [55, 13, 115], hex: "#370D73" },
      size_um: { min: 1, max: 50 },
      shape: "angular_crystalline",
      opacity: 0.95,
      refractile: true
    }
  },

  acid_fast: {
    positive: {
      carbolfuchsin: { h: 345, s: 80, l: 48, rgb: [220, 24, 57], hex: "#DC1839" },
      beaded_gap:    { h: 345, s: 10, l: 85, rgb: [221, 213, 216], hex: "#DDD5D8" },
      opacity: 0.90
    },
    counterstain: {
      methylene_blue_cells: { h: 210, s: 50, l: 55, rgb: [70, 120, 185], hex: "#4678B9" },
      methylene_blue_bg:    { h: 210, s: 30, l: 78, rgb: [175, 194, 217], hex: "#AFC2D9" },
      opacity_cells: 0.80,
      opacity_bg: 1.0
    }
  },

  simple_methylene_blue: {
    cells:      { h: 210, s: 60, l: 40, rgb: [41, 82, 163], hex: "#2952A3" },
    background: { h: 210, s: 20, l: 88, rgb: [210, 218, 230], hex: "#D2DAE6" },
    opacity: 0.85
  },

  loeffler_methylene_blue: {
    cells:      { h: 210, s: 60, l: 40, rgb: [41, 82, 163], hex: "#2952A3" },
    metachromatic_granules: { h: 310, s: 60, l: 35, rgb: [143, 36, 117], hex: "#8F2475" },
    background: { h: 210, s: 20, l: 88, rgb: [210, 218, 230], hex: "#D2DAE6" }
  },

  india_ink_negative: {
    background_ink: { h: 0, s: 0, l: 15, rgb: [38, 38, 38], hex: "#262626" },
    capsule_halo:   { h: 0, s: 0, l: 95, rgb: [242, 242, 242], hex: "#F2F2F2" },
    cell_body:      { h: 0, s: 0, l: 20, rgb: [51, 51, 51], hex: "#333333" },
    opacity: 0.95
  },

  darkfield: {
    background: { h: 0, s: 0, l: 2, rgb: [5, 5, 5], hex: "#050505" },
    organism_glow: { h: 55, s: 30, l: 85, rgb: [230, 225, 190], hex: "#E6E1BE" },
    glow_radius_multiplier: 2.5 // apparent size ~2.5× actual due to diffraction glow [E]
  },

  silver_stain: {
    organism:   { h: 30, s: 50, l: 22, rgb: [84, 63, 28], hex: "#543F1C" },
    background: { h: 45, s: 30, l: 75, rgb: [204, 194, 163], hex: "#CCC2A3" }
  }
};
```

---

## A.3 Magnification Parameters

```javascript
const MAGNIFICATION = {
  "4x": {
    objective: 4,
    eyepiece: 10,
    total: 40,
    na: 0.10,
    fov_um: 4000,
    dof_um: 55.0,
    resolution_um: 2.75, // Abbe, λ=550nm
    min_visible_feature_um: 3.5, // Rayleigh
    bacteria_visible: false,
    use: "scanning — find specimen area, assess smear quality",
    oil_required: false
  },
  "10x": {
    objective: 10,
    eyepiece: 10,
    total: 100,
    na: 0.25,
    fov_um: 1600,
    dof_um: 8.5,
    resolution_um: 1.10,
    min_visible_feature_um: 1.35,
    bacteria_visible: "barely — dots only, large clumps visible",
    use: "low power survey — WBC and epithelial cell counting, specimen quality assessment",
    oil_required: false
  },
  "40x": {
    objective: 40,
    eyepiece: 10,
    total: 400,
    na: 0.65,
    fov_um: 400,
    dof_um: 1.0,
    resolution_um: 0.42,
    min_visible_feature_um: 0.52,
    bacteria_visible: "yes — individual cells visible, shapes discernible, arrangements partially resolvable",
    use: "high dry — preliminary morphology, identify cocci vs rods",
    oil_required: false
  },
  "100x_oil": {
    objective: 100,
    eyepiece: 10,
    total: 1000,
    na: 1.25,
    fov_um: 170,
    dof_um: 0.30,
    resolution_um: 0.22,
    min_visible_feature_um: 0.27,
    bacteria_visible: "full detail — morphology, arrangement, Gram color, special features",
    use: "definitive identification — Gram stain reading, AFB examination",
    oil_required: true,
    oil_refractive_index: 1.515 // cedarwood oil, era-appropriate
  }
};
```

---

## A.4 Non-Bacterial Cell Parameters

```javascript
const HOST_CELLS = {
  neutrophil: {
    diameter_um: { mean: 12.5, sd: 1.5, min: 10, max: 15 },
    shape: "irregular_round",
    nucleus: {
      type: "multilobed",
      lobe_count: { min: 2, max: 5, mean: 3 },
      lobe_diameter_um: { mean: 3.0, sd: 0.5 },
      lobe_connection_width_um: 0.5,
      color_gram_hsl: { h: 270, s: 55, l: 28 } // dark purple nucleus
    },
    cytoplasm: {
      color_gram_hsl: { h: 345, s: 20, l: 82 }, // pale pink
      opacity: 0.6
    },
    appearance_degenerate: {
      description: "Pyknotic — nucleus becomes single dark blob; cell swollen; may be lysed (ruptured) with nuclear material spread",
      nucleus_color_hsl: { h: 270, s: 60, l: 20 }, // very dark
      frequency_in_pus: 0.40 // 40% of neutrophils in pus are degenerate [E]
    },
    intracellular_bacteria_capacity: { min: 0, max: 30 } // number of bacteria that fit visually inside
  },

  lymphocyte: {
    diameter_um: { mean: 8.5, sd: 1.0, min: 7, max: 10 },
    shape: "round",
    nucleus: {
      type: "round_single",
      diameter_um_fraction: 0.85, // fills 85% of cell
      color_gram_hsl: { h: 270, s: 55, l: 30 }
    },
    cytoplasm: {
      color_gram_hsl: { h: 220, s: 15, l: 80 }, // very pale blue-pink
      opacity: 0.5,
      width_um: 1.0 // thin rim around nucleus
    }
  },

  monocyte_macrophage: {
    diameter_um: { mean: 16, sd: 2.5, min: 12, max: 22 },
    shape: "irregular_round",
    nucleus: {
      type: "kidney_or_folded",
      color_gram_hsl: { h: 270, s: 50, l: 32 }
    },
    cytoplasm: {
      color_gram_hsl: { h: 345, s: 15, l: 78 },
      opacity: 0.5,
      may_contain: ["bacteria", "debris"] // phagocytosed material
    }
  },

  rbc: {
    diameter_um: { mean: 7.5, sd: 0.5, min: 6.5, max: 8.5 },
    shape: "biconcave_disc", // renders as circle with slight central pallor
    color_gram_hsl: { h: 5, s: 30, l: 78 }, // pale pink
    central_pallor: true,
    central_pallor_diameter_fraction: 0.33, // central 1/3 is slightly lighter
    opacity: 0.4, // quite transparent on Gram stain
    notes: "May appear as faint pink circles or barely visible 'ghosts'. Useful as size reference."
  },

  squamous_epithelial: {
    width_um: { mean: 50, sd: 10, min: 35, max: 70 },
    height_um: { mean: 45, sd: 10, min: 30, max: 60 },
    shape: "irregular_polygon", // 5–7 sided, flat
    nucleus: {
      diameter_um: { mean: 10, sd: 2 },
      position: "central",
      color_gram_hsl: { h: 270, s: 40, l: 35 } // moderate purple
    },
    cytoplasm: {
      color_gram_hsl: { h: 345, s: 20, l: 80 }, // pale pink, very flat
      opacity: 0.3 // very thin and transparent
    },
    surface_bacteria: true, // bacteria may adhere to surface
    significance: "contamination indicator in sputum (>10 per LPF = saliva)"
  },

  columnar_epithelial: {
    width_um: { mean: 12, sd: 2, min: 8, max: 16 },
    height_um: { mean: 30, sd: 5, min: 20, max: 40 },
    shape: "tall_rectangle_rounded",
    nucleus: {
      position: "basal",
      diameter_um: { mean: 8, sd: 1 },
      color_gram_hsl: { h: 270, s: 40, l: 35 }
    },
    cytoplasm: {
      color_gram_hsl: { h: 345, s: 15, l: 82 },
      opacity: 0.35
    },
    significance: "indicates lower respiratory or GI origin (better specimen)"
  }
};
```

---

## A.5 Specimen Quality Parameters

```javascript
const SPECIMEN_QUALITY = {
  sputum_quality: {
    // Murray-Washington / Bartlett criteria (per low-power field, 100× total)
    good: {
      wbc_per_lpf: { min: 25 },
      squamous_per_lpf: { max: 10 },
      description: "Lower respiratory — suitable for culture and interpretation",
      flora_pattern: "1-2 morphotypes predominating"
    },
    borderline: {
      wbc_per_lpf: { min: 10, max: 25 },
      squamous_per_lpf: { min: 10, max: 25 },
      description: "Questionable quality — interpret with caution"
    },
    reject: {
      wbc_per_lpf: { max: 10 },
      squamous_per_lpf: { min: 25 },
      description: "Saliva contamination — request new specimen",
      flora_pattern: "mixed oral flora — many morphotypes"
    }
  },

  // Semi-quantitative bacteria reporting per OIF (1000× oil)
  bacteria_reporting: {
    rare:     { per_oif: { min: 0.01, max: 0.1 }, description: "1 per 10-100 fields examined" },
    few:      { per_oif: { min: 0.1,  max: 5 },   description: "~1-5 per field" },
    moderate: { per_oif: { min: 5,    max: 25 },   description: "~5-25 per field" },
    many:     { per_oif: { min: 25,   max: 50 },   description: "~25-50 per field" },
    abundant: { per_oif: { min: 50 },               description: ">50 per field — packed" }
  },

  wbc_reporting: {
    // Per OIF (1000×)
    none:     { per_oif: 0,   description: "No WBCs" },
    rare:     { per_oif: { min: 0.1, max: 1 } },
    few:      { per_oif: { min: 1, max: 5 } },
    moderate: { per_oif: { min: 5, max: 25 } },
    many:     { per_oif: { min: 25, max: 100 } },
    packed:   { per_oif: { min: 100 }, description: "Purulent — pus" }
  },

  // Mixed flora probability by specimen type [E]
  mixed_flora_probability: {
    colony_pick: 0.0,     // pure unless contaminated
    blood_culture: 0.05,  // usually pure; polymicrobial rare
    csf: 0.05,            // usually single organism
    urine_clean_catch: 0.20, // contamination possible
    wound_swab: 0.50,     // often mixed
    sputum: 0.40,         // contamination + mixed infection common
    throat_swab: 0.90,    // always mixed (normal flora present)
    stool: 0.99           // always mixed (gut flora)
  }
};
```

---

## A.6 Optical Artifact Parameters

```javascript
const OPTICAL_ARTIFACTS = {
  chromatic_aberration: {
    // Lateral color fringing — increases radially from center
    achromatic: {
      max_offset_px: 2.5, // at field edge, at 5px/µm scale
      exponent: 2.0,       // offset = max * (r/R)^exponent
      channels: { r_offset: 1.0, g_offset: 0.0, b_offset: -1.0 } // R outward, B inward
    },
    apochromatic: {
      max_offset_px: 0.8,
      exponent: 2.0,
      channels: { r_offset: 1.0, g_offset: 0.0, b_offset: -1.0 }
    }
  },

  vignetting: {
    // Brightness multiplier as function of radial position
    // brightness = 1.0 - strength * (r/R)^power
    strength: 0.30,  // at edge: 1.0 - 0.30 = 0.70 brightness
    power: 2.0,      // quadratic falloff
    // Result: center=100%, 50% radius=92%, 75% radius=83%, edge=70%
  },

  field_curvature: {
    // Blur increases radially from center (non-Plan objectives)
    achromatic: {
      center_blur_sigma_px: 0.0,
      edge_blur_sigma_px: 2.5,  // at field edge
      transition_start: 0.5,     // starts at 50% of field radius
      power: 2.0
    },
    apochromatic: {
      center_blur_sigma_px: 0.0,
      edge_blur_sigma_px: 1.5,
      transition_start: 0.6,
      power: 2.0
    }
  },

  warm_color_temperature: {
    // Period illumination: oil lamp ~2200K, early electric ~2800K, gas mantle ~2500K
    // Applied as RGB multiplier to simulate warm illumination
    oil_lamp: { r: 1.0, g: 0.78, b: 0.58 },     // warm/golden [E]
    gas_mantle: { r: 1.0, g: 0.82, b: 0.64 },    // slightly less warm [E]
    early_electric: { r: 1.0, g: 0.85, b: 0.70 }, // warmer than modern but less than oil [E]
    modern_led: { r: 1.0, g: 1.0, b: 1.0 }        // neutral reference
  },

  contrast_reduction: {
    // Uncoated glass causes flare/haze, reducing contrast
    uncoated_era: 0.12,   // reduce contrast by 12% [E]
    single_coated: 0.05,  // post-era improvement
    multi_coated: 0.02    // modern
    // Implementation: blend each pixel toward mid-gray by this fraction
  },

  newton_rings: {
    // Air bubble interference pattern
    ring_color_sequence: ["red", "green", "blue"], // simplified
    ring_spacing_decrease_rate: 0.85, // each ring ~85% spacing of previous, from center outward
    bubble_size_um: { min: 50, max: 500 }
  },

  crystal_violet_precipitate: {
    count_per_field: { min: 0, max: 20, mean: 3 }, // [E] depends on reagent quality
    size_um: { min: 1, max: 50 },
    color_hsl: { h: 275, s: 80, l: 25 },
    shape: "angular_polygon", // 4-8 sided irregular polygon
    opacity: 0.95,
    refractile_highlight: true
  },

  stain_granule_background: {
    // Fine granular precipitate in background
    count_per_field: { min: 0, max: 100 }, // depends on reagent quality
    size_um: { min: 0.1, max: 2.0 },
    color_gram_hsl: { h: 270, s: 40, l: 45 }, // purple granules
    opacity: 0.4
  }
};
```

---

## A.7 Focus / Depth-of-Field Parameters

```javascript
const FOCUS_PARAMS = {
  // Defocus-to-blur mapping at 1000× oil, 5 px/µm viewport scale
  blur_curve: {
    // sigma_px = coefficient * |defocus_um|^power
    coefficient: 4.0,
    power: 1.2,
    // Result: 0.3µm defocus → σ≈1.0px, 1.0µm → σ≈4.0px, 2.0µm → σ≈9.2px
  },

  opacity_fade: {
    // Slight opacity reduction with defocus
    // opacity_multiplier = 1.0 - rate * |defocus_um|
    rate: 0.08,
    min_opacity_multiplier: 0.3
  },

  specimen_thickness_um: {
    monolayer: { mean: 0.8, min: 0.5, max: 1.5 },
    thin_smear: { mean: 2.0, min: 1.0, max: 3.0 },
    thick_smear: { mean: 4.0, min: 3.0, max: 8.0 }
  },

  fine_focus_knob: {
    // Travel per full rotation of fine focus knob
    um_per_rotation: 30, // [E] era-typical
    // Player UI: e.g., mouse wheel = fine increments
    um_per_click: 0.2 // suggested increment for mouse wheel [E]
  }
};
```

---

# REFERENCES

## Primary Textbooks and Sources

1. **Murray, P.R., Rosenthal, K.S., Pfaller, M.A.** *Medical Microbiology*, 8th ed. Elsevier, 2016. — Standard reference for bacterial morphology, staining, and clinical microbiology.

2. **Koneman, E.W. et al.** *Color Atlas and Textbook of Diagnostic Microbiology*, 6th ed. Lippincott, 2006. — Definitive photomicrograph atlas and morphology reference.

3. **Winn, W.C. et al.** *Koneman's Color Atlas and Textbook of Diagnostic Microbiology*, 7th ed. Wolters Kluwer, 2017. — Updated morphology and interpretation standards.

4. **Hecht, E.** *Optics*, 5th ed. Pearson, 2017. — Optical physics: diffraction, resolution, aberration, depth of field.

5. **Bradbury, S.** *The Evolution of the Microscope*. Pergamon Press, 1967. — Historical development of microscopes, era-appropriate technology. **[H]**

6. **Ford, B.J.** *The Leeuwenhoek Legacy*. Biopress, 1991. — Historical microscopy. **[H]**

7. **Koch, R.** "Die Aetiologie der Tuberculose." *Berliner Klinische Wochenschrift*, 1882. — Original TB description. **[H]**

8. **Gram, H.C.** "Über die isolirte Färbung der Schizomyceten in Schnitt- und Trockenpräparaten." *Fortschritte der Medicin*, 2:185–189, 1884. — Original Gram stain publication. **[H]**

9. **Köhler, A.** "Ein neues Beleuchtungsverfahren für mikrophotographische Zwecke." *Zeitschrift für wissenschaftliche Mikroskopie*, 10:433–440, 1893. — Köhler illumination. **[H]**

10. **Ziehl, F.** "Zur Färbung des Tuberkelbacillus." *Deutsche Medizinische Wochenschrift*, 1882. — Acid-fast staining. **[H]**

11. **Lennette, E.H., et al.** *Manual of Clinical Microbiology*, various editions. ASM Press. — Clinical laboratory standards.

12. **Bergey's Manual of Systematic Bacteriology**, various editions. — Definitive bacterial taxonomy and morphology descriptions.

13. **CDC Laboratory Training Resources** — Gram stain and AFB stain interpretation guidelines.

14. **Zeiss Archives and Catalogs, 1880–1910** — Historical lens specifications, NA values, microscope designs. **[H]**

## Notes on Data Quality

- **Cell dimensions:** Well-established in literature; values consistent across multiple references. Confidence: HIGH.
- **Color values (HSL/RGB):** Derived from published photomicrographs and the author's assessment of standard stain appearance. These are **approximations** — actual stain color varies with reagent batch, preparation, and illumination. Confidence: MODERATE. Calibrate against published photomicrographs.
- **Arrangement distributions:** Based on published descriptions and clinical experience benchmarks, but exact percentages are **estimates [E]**. Published data on arrangement probability distributions is sparse. Confidence: LOW-MODERATE.
- **Optical artifact magnitudes:** Based on optical theory and published aberration data for period objectives, but specific pixel-level rendering parameters are **estimates [E]** that should be tuned empirically. Confidence: MODERATE.
- **Historical details (microscope brands, dates, practices):** From published histories of microscopy and microbiology. Confidence: HIGH for dates and names; MODERATE for day-to-day laboratory practices of the era.
- **Density/count per field values:** Highly variable in clinical practice. Ranges given are representative but not exhaustive. Confidence: MODERATE.
