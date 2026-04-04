# Culture Plate Streaking Prototype — Canonical Plan

## Context

After 10+ failed attempts, this plan builds an isolated prototype in `components/reference/claude-streak/` with a strict 5-layer architecture. Each layer is independently debuggable, validatable, and replaceable.

**Evaluation model** — no incubation button, no mode switches:

```
visiblePlate = render( synth( grow( seed( transferState ), targetTime ) ) )
```

The user streaks, adjusts sliders, loads/sterilizes, and scrubs time. The plate recomputes immediately.

---

## Source of Truth

```ts
interface PlateSession {
  plateSeed: number;
  speciesConfig: SpeciesDef[];
  actionLog: Action[];
  targetTime: number;   // 0–72h slider value
}
```

Every user action appends to `actionLog`:
```ts
type Action =
  | { type: 'loadSample'; speciesLoads: number[]; timestamp: number }
  | { type: 'sterilize'; timestamp: number }
  | { type: 'beginStroke'; timestamp: number }
  | { type: 'strokeSegment'; from: Vec2; to: Vec2; pressure: number; timestamp: number }
  | { type: 'endStroke'; timestamp: number }
```

**Strokes are first-class** in the action log. `beginStroke` / `endStroke` bracket a continuous pointer gesture. This makes fixture capture, logging, and deterministic rebuild easier to reason about — a "stroke" is a named group, not just a sequence of segments.

The action log records species composition at load time (snapshot of slider values). Given `(plateSeed, actionLog, targetTime)`, the full plate is reproducible.

### Slider Semantics

**Live edit mode.** Species proportion sliders set what gets loaded on the *next* `loadSample`. Past actions are not replayed. The action log records the composition that was loaded at each `loadSample` event. This matches real lab behavior — you can't retroactively change what was on the loop.

Deterministic re-evaluation happens internally (action log replay) for fixture capture and regression testing, but there is no "Replay" button in the main UI.

---

## Engine Responsibilities

| Engine | Owns | Outputs | Does NOT touch |
|---|---|---|---|
| **TransferEngine** | Loop sectors, film mass, deposit fluid, agar wetness, grooves, mass ledger | `FilmState` | Seeding, growth, rendering |
| **SeedingEngine** | Deterministic founder realization from film | `FounderGrid` (count fields) | Film, growth, rendering |
| **GrowthEngine** | Biological incubation: biomass, coverage, nutrient, waste over time | `BiomassState` at queried time | Transfer, seeding, render materials |
| **RenderSynth** | Compositing transfer residue + growth → render-facing maps | `RenderMaps` | Biology, display |
| **Renderer** | Shading and pixel output | Canvas pixels | Everything else |

---

## Loop Model: 4 Physical Sectors

The loop wire is modeled as 4 sectors arranged perpendicular to the stroke direction:

```
Sector 0  │ Left outer edge   │  → deposits to left flank
Sector 1  │ Left-center wire  │  → groove zone, reduced deposit
Sector 2  │ Right-center wire │  → groove zone, reduced deposit
Sector 3  │ Right outer edge  │  → deposits to right flank
```

```ts
interface LoopSector {
  load: number[];     // per-species inoculum mass
  fluid: number;      // physical fluid volume
}

interface LoopState {
  sectors: LoopSector[];  // length 4
  isSterile: boolean;
}
```

### Transfer model: fluid film depletion, NOT "running out of bacteria"

The loop does not "run dry" — the fluid film thins, reducing **contact transfer efficiency**:

```
contactEfficiency = baseRate * fluidFactor(sector.fluid) * pressureFactor * speedFactor
```

- `fluidFactor` is high when fluid is thick, low when film is thin — but never zero
- Bacteria concentration in the remaining fluid stays high even as the film thins
- A thin fluid film still carries bacteria but transfers less per stamp
- **Crossing a previous streak refreshes the loop**: picks up both fluid and bacteria, increasing both `sector.fluid` and `sector.load[s]`
- **A sterilized loop** has `load[s] = 0` for all species but picks up from the agar surface when dragged through prior deposits

This means:
- A full loop deposits heavily at first, then gradually less (fluid film depletion)
- But a sterilized loop dragged through a dense prior streak picks up substantial multi-species material
- Redepositing after pickup produces a diluted, remixed streak — correct streak plate behavior

### Sector mechanics per stamp

1. **Pickup** — each sector picks up from its spatial footprint on the agar, proportional to local filmMass and effective wetness (`agarWetness + depositFluid`)
2. **Deposit** — each sector deposits to its footprint, weighted: outer sectors > inner sectors (bimodal pattern). Deposit amount = `contactEfficiency × sector.load[s]`
3. **Remixing** — mild inter-sector equalization: `sector[i].load[s] += remixRate * (avg_neighbors - sector[i].load[s])`
4. **Fluid thinning** — `sector.fluid -= depositFluidLoss` per stamp (the physical film gets thinner)
5. **Groove** — inner sectors (1, 2) write groove damage proportional to pressure

---

## Data Model

### FilmState (transfer output, mutable during streaking)
```ts
interface FilmState {
  resolution: number;                // 512
  filmMass: Float32Array[];          // per-species inoculum [speciesIdx][cell]
  agarWetness: Float32Array;         // baseline moisture (media-dependent, slow)
  depositFluid: Float32Array;        // transient loop fluid on agar (fast decay)
  groove: Float32Array;              // mechanical agar damage
}
```

### FounderGrid (seeding output, frozen per film state)
```ts
interface FounderGrid {
  counts: Uint16Array[];             // per-species founder count per cell
  lag: Float32Array[];               // per-species lag time per cell (deterministic)
  growthRate: Float32Array[];        // per-species rate per cell (deterministic jitter)
}
```

- **Field-based, not entity-based.** A cell with `counts[s] = 5` means 5 CFUs of species s.
- **Founder growth potential is species-defined, not density-modified.** Dense regions just have more founders.
- **No same-species hard-core clearance.** Dense counts survive to produce confluent growth.
- **Anti-blocky rendering**: deterministic subcell jitter applied in RenderSynth (not in the biology). Each cell's visual contribution offset by `jitter = prng(plateSeed, x, y) * 0.5 * cellSize`. **Jitter is spatially coherent**: each cell has a stable jitter position (same seed = same offset) so jitter is visually stable across frames and time scrubbing. Neighboring cells have uncorrelated but individually stable jitter — no white-noise sparkle.

### BiomassState (growth output, computed at queried targetTime)
```ts
interface BiomassState {
  biomass: Float32Array[];           // per-species biomass per cell
  coverage: Float32Array[];          // per-species surface coverage (0–1) — BIOLOGICAL field
  totalCoverage: Float32Array;       // sum across species, capped at 1
  nutrient: Float32Array;            // shared resource (1=full, 0=depleted) — DYNAMIC field
  waste: Float32Array;               // accumulated inhibitor (0=clean, grows) — DYNAMIC field
}
```

**Coverage is biological, not render-only.** Growth engine computes it; it feeds back into growth dynamics (high coverage → reduced growth). RenderSynth reads it for lawn rendering.

**Nutrient and waste are dynamic first-class fields.** They evolve over simulated time via stepped evaluation. They are NOT static carrying capacities.

### RenderMaps
```ts
interface RenderMaps {
  height: Float32Array;
  albedo: Uint8ClampedArray;         // RGBA
  roughness: Float32Array;
  coverage: Float32Array;            // from BiomassState, for lawn mode
  hemolysisAlpha: Float32Array;
  hemolysisBeta: Float32Array;
  wetMask: Float32Array;
  grooveMask: Float32Array;
}
```

### MassLedger (transfer validation)
```ts
interface MassLedger {
  deposited: number[];     // cumulative per species
  pickedUp: number[];      // cumulative per species
  sectorTotals: number[];  // current per species across all sectors
  filmTotals: number[];    // current per species on grid
  fluidDeposited: number;  // cumulative fluid transferred to agar
  fluidPickedUp: number;   // cumulative fluid picked up from agar
}
```

### SpeciesDef
```ts
interface SpeciesDef {
  id: string;
  name: string;
  color: string;
  hemolysisType: 'alpha' | 'beta' | 'gamma';
  isolatedRadius: [number, number];
  lagRange: [number, number];
  growthRateRange: [number, number];
  maxBiomass: number;
  wasteRate: number;
  morphology?: 'smooth' | 'rough' | 'mucoid' | 'spreading';
}
```

---

## Growth Engine

### API (time-queryable)
```ts
function computeGrowth(
  founders: FounderGrid,
  species: SpeciesDef[],
  hours: number,
  resolution: number,
): BiomassState;
```

### Internal: stepped simulation with checkpoint caching

Nutrient depletion and waste accumulation are genuinely time-dependent — they cannot be accurately computed as a closed-form function. The growth engine uses **deterministic stepped simulation** internally while exposing a time-queryable API:

1. On first call for a given founder grid, step from t=0 to `hours` in fixed increments (dt = 0.5h). Store checkpoints every 2h.
2. On subsequent calls, find the nearest checkpoint ≤ `hours` and step forward from there.
3. Cache is invalidated when `FounderGrid` changes (i.e., when film changes trigger re-seeding).
4. Slider scrubbing is fast: typically stepping ≤ 4 increments (2h of growth) from the nearest checkpoint.

**Performance budget**: 512² × 3 species × per-cell arithmetic per step. At ~10 FLOP/cell: 262K × 3 × 10 = ~8M FLOP per step. At 1 GHz effective throughput: ~8ms. Stepping 4 increments: ~32ms. Acceptable for interactive scrubbing; optimizable via Web Worker or GPU later.

### Growth law (per cell, per species, per timestep dt)

```
active_time = currentTime - lag[s][cell]
if founderCounts[s][cell] == 0 or active_time <= 0:
    skip

// Base growth rate (species-defined, not density-modified)
base_rate = founderCounts[s][cell] * growthRate[s][cell]

// Nutrient limitation (Monod-like)
nutrient_factor = nutrient[cell] / (nutrient[cell] + K_NUTRIENT)

// Waste inhibition
waste_factor = 1 / (1 + waste[cell] * K_WASTE)

// Coverage-driven crowding (biological feedback)
crowding_factor = max(0, 1 - totalCoverage[cell])

// Biomass increment
d_biomass = base_rate * nutrient_factor * waste_factor * crowding_factor * dt
biomass[s][cell] = min(biomass[s][cell] + d_biomass, species[s].maxBiomass)

// Coverage (biological, feeds back into crowding)
coverage[s][cell] = smoothstep(biomass[s][cell], COVER_LOW, COVER_HIGH)
totalCoverage[cell] = min(1, sum_s(coverage[s][cell]))

// Nutrient consumption (shared)
nutrient[cell] = max(0, nutrient[cell] - NUTRIENT_K * d_biomass)

// Waste production
waste[cell] += species[s].wasteRate * d_biomass
```

**Spatial spread** (deterministic colony-footprint approximation): After each timestep, active founders are treated as lightweight colony entities with deterministic sub-cell positions, lag, and radius growth. Each colony samples openness and resources around its frontier, expands its radius, and then stamps a smooth footprint into the biomass field. Constraints:
- Per-species: each species grows independently (no species bleeding)
- Deterministic: colony centers, lag, and size jitter come from founder-derived seeds, so repeated replays match
- Merge-friendly: overlapping colony footprints accumulate into continuous biomass/coverage fields rather than staying as isolated founder pixels
- Resource-aware: frontier growth slows as nutrient falls, waste rises, or surrounding coverage closes down
This preserves per-colony growth and natural merging while keeping the queried `BiomassState` field-based.

**At 0h**: All founders are pre-lag. Biomass = 0. Coverage = 0. Nutrient = 1. Waste = 0. Only transfer residue visible.

**Growth V1 is an approximation.** It includes dynamic nutrient and waste fields (not just static carrying capacity), but it is still an approximate scrubbable model, not a full transport solver. Specifically: the stepped simulation uses deterministic colony entities for radius growth and footprint stamping, while nutrient and waste remain shared raster fields with no explicit diffusion. This is sufficient for the POC's goal of producing realistic-looking dilution gradients, merging, and nutrient-limited growth. A more rigorous model (reaction-diffusion PDEs, richer colony mechanics) can replace the internals later without changing the API.

**Deferred** (explicitly not in POC):
- Diffusible inhibitor/toxin fields (per-species diffusion PDEs)
- Contact-dependent growth inhibition
- Species-specific antagonism

---

## Render Synth

Composites transfer residue (always visible) + growth output (scales with time):

**Compositing order** (bottom to top):
1. Agar base (media color)
2. Groove depressions (physical, always visible)
3. Film stain (faint tint from filmMass, visible but faded at high incubation)
4. Colony height from biomass (Gaussian-blurred, subcell-jittered to break grid)
5. Colony albedo (species-colored, proportional to local biomass)
6. Coverage-driven lawn fill (totalCoverage > 0.8 → continuous carpet)
7. Hemolysis halos (α = green/brown, β = clear zone; scale with colony maturity)
8. Wet/specular (agarWetness + depositFluid + mucoid morphology)

---

## UI Controls

```
┌─────────────────────────────────────────────────────────────┐
│  Time: ═══════○════════════════════════════ 0h ────── 72h   │
├─────────────────────────────────────────────────────────────┤
│  S. aureus ───────○───── 40%                                │
│  E. coli   ─────────○─── 60%                                │
│  S. pyogenes ─○──────── 0%                                  │
├─────────────────────────────────────────────────────────────┤
│  [ Load Sample ]  [ Sterilize ]  [ Reset ]                  │
└─────────────────────────────────────────────────────────────┘
```

- **Time slider** (0–72h): scrubs incubation time. Plate recomputes immediately.
- **Species proportion sliders**: set composition for the next `loadSample` action.
- **Load Sample**: loads current slider proportions onto the loop sectors. Records `{ type: 'loadSample', speciesLoads }` in action log.
- **Sterilize Loop**: clears all sector loads to zero. Records `{ type: 'sterilize' }`.
- **Reset**: clears action log, film, founders, everything. Fresh plate.

No Replay button in the main UI. Deterministic re-evaluation is internal only (used by fixture capture and regression testing).

---

## Debug UI Layout

Persistent multi-view. Final render is always visible. Layer views are pinned mini-panels:

```
┌────────────────────────────────┬───────────────┬───────────────┐
│                                │  Film Density  │   Founders    │
│                                │  (per-species  │  (count heat- │
│       Final Plate Render       │   heatmap,     │   map, shows  │
│       (always visible,         │   switchable)  │   dilution    │
│        largest panel)          │                │   gradient)   │
│                                ├───────────────┼───────────────┤
│                                │  Biomass /     │  Nutrient /   │
│                                │  Coverage      │  Waste        │
│                                │  (total or     │  (green=full  │
│                                │   per-species) │   red=gone)   │
├────────────────────────────────┼───────────────┴───────────────┤
│  Loop Sectors:                 │  Grooves / Deposit Fluid /    │
│  [S0: ██▓░] [S1: ███░]        │  Agar Wetness / Render Masks  │
│  [S2: █▓░░] [S3: ▓░░░]        │  (switchable)                 │
│  Mass Ledger: dep=X pk=Y f=Z  │                               │
└────────────────────────────────┴───────────────────────────────┘
```

Each mini-panel has a dropdown: film species A / film species B / film total / deposit fluid / agar wetness / groove / founders A / founders B / biomass A / biomass total / coverage total / nutrient / waste / height / albedo / roughness / hemolysis.

---

## Programmatic Validation (per layer)

Every layer exposes validation metrics — not just visual inspection.

### TransferEngine validation
```ts
interface TransferMetrics {
  massLedger: MassLedger;                    // conservation check
  conservationError: number[];               // |deposited + remaining - initial| per species
  crossSectionProfile: number[];             // deposit density across stroke width (should show center trough + side lobes)
  dirtyRect: { x: number; y: number; w: number; h: number }; // affected region per stroke
  crossStreakRemixRatio: number;             // fraction of loop load that changed species composition after crossing
}
```

### SeedingEngine validation
```ts
interface SeedingMetrics {
  founderCountsPerSpecies: number[];         // total founders per species
  founderConservationRatio: number[];        // founder_mass / film_mass per species (should be proportional)
  determinismCheck: boolean;                 // replay produces identical founders
  untouchedRegionStability: boolean;         // founders outside dirty rect unchanged after new stroke
}
```

### GrowthEngine validation
```ts
interface GrowthMetrics {
  biomassVsTime: number[][];                 // per-species biomass totals at sampled time points
  coverageVsTime: number[][];               // per-species coverage totals over time
  nutrientVsTime: number[];                 // mean nutrient over time
  wasteVsTime: number[];                    // mean waste over time
  confluenceFraction: number;               // fraction of plate area with totalCoverage > 0.8
  isolatedPeakCount: number;                // peaks with coverage < 0.3 in neighborhood
}
```

### RenderSynth validation
```ts
interface RenderMetrics {
  heightHistogram: number[];                // distribution of height values
  coverageHistogram: number[];              // distribution of coverage values
  connectedComponentCount: number;          // discrete colony regions (from thresholded biomass)
  lawnAreaFraction: number;                 // fraction with coverage > 0.8
  grooveVisibilityFraction: number;         // fraction of groove > threshold that's visible in render
  colonySizeDistribution: number[];         // histogram of connected component areas
}
```

These metrics are displayed in the debug panel and can be exported alongside the session JSON for regression testing.

---

## Reference Image Calibration Plan

Primary reference asset:
- [s-aureus-real.png](prototypes/svelte-lab-avatar/components/reference/s-aureus-real.png) — top-down photo of real S. aureus streak plate on blood agar

Only the top-down view matters for calibration. Side-view and PBR renderer are separate concerns.

### Calibration strategy: extract metrics, use as acceptance targets

**Do NOT use reference images as runtime simulation input.** Use them to define quantitative targets for each layer.

**Metrics to extract from s-aureus-real.png:**

| Metric | Target layer |
|---|---|
| Streak width profile (px vs distance along path) | Transfer — validate deposit spread |
| Center-vs-side deposit intensity (cross-section) | Transfer — validate bimodal sector pattern |
| Colony count vs distance from inoculum (zone by zone) | Seeding — validate dilution gradient |
| Colony size distribution (px² per colony) in isolated zones | Growth — validate species-specific sizing |
| Confluent area fraction per zone | Growth — validate merge/lawn emergence |

### Implementation

**Phase 1**: Add a minimal `reference-metrics.ts` utility in `claude-streak/` that:
- Loads `s-aureus-real.png` via `<img>` → Canvas → ImageData
- Segments the plate area (circular mask)
- Thresholds to find streak regions vs agar background
- Computes: streak width at sampled distances, colony count per zone, confluent area fraction
- Outputs metrics as a typed object (not console-only)

This is a one-time calibration tool, not runtime code. It runs in a dev harness or browser console. The extracted values are recorded as calibration constants in `streak-types.ts` and used as acceptance criteria comments.

---

## Deterministic Locality and Dirty Regions

- **Founders per cell**: `rng = splitmix32(hash(plateSeed, speciesIdx, cellX, cellY))`. Touching one cell does not affect others.
- **Time scrubbing**: founders depend only on film (time-independent). Growth depends on `(founders, hours)`. Changing time never changes founders.
- **New strokes**: only change film in the stroke footprint. Only those cells get different founders. Untouched regions are provably unchanged.

**Dirty regions are part of the engine interfaces, not just validation output:**

- `TransferEngine.applyStroke()` returns `dirtyRect: Rect` — the bounding box of cells modified by this stroke.
- `SeedingEngine.seedRegion(film, dirtyRect)` only recomputes founders inside the dirty rect **plus a small halo** (e.g. 3–5 cells) to account for lambda smoothing and spread effects. Untouched cells keep their previous founder counts.
- `GrowthEngine` invalidates checkpoints for the dirty region + halo (for local frontier propagation). Growth outside this expanded region can be reused from cached checkpoints.
- The halo width is a tunable constant (default = founder smoothing radius + frontier reach). Without the halo, seam artifacts can appear at dirty rect boundaries.

This makes incremental updates efficient and provides a provable guarantee that untouched regions are stable.

---

## File Structure

```
components/reference/claude-streak/
├── pipeline-harness.svelte         — Canonical single dashboard route with plate, controls, and per-phase cards
├── streak-types.ts                 — Types, SpeciesDef, SIM constants, calibration targets
├── deterministic-rng.ts            — SplitMix32, hash, deterministic Poisson
├── transfer-engine.ts              — Sector-based loop ↔ film, mass ledger
├── seeding-engine.ts               — Film → founder count grids
├── growth-engine.ts                — Founders × time → biomass/coverage/nutrient/waste
├── render-synth.ts                 — Film + biomass → height/albedo/roughness/hemolysis
├── debug-renderer.ts               — Canvas 2D for all debug views + plate rendering
├── validation.ts                   — Programmatic metrics for all layers
```

The dashboard is the only codex-streak UI entry point: `#/reference/codex-streak/pipeline`.

**The dashboard uses the exact same engine code described here.** Transfer, seeding, and growth remain separate engine layers; only the UI shell is consolidated.

**Resolution remains configurable.** The single dashboard defaults to the working codex resolution, and the engine interfaces still accept resolution as a parameter.

---

## Conventions (from CLAUDE.md and AGENTS.md)

- **Svelte 5 runes** (`$state`, `$derived`, `$effect`). Use `$derived` for computed values. Use `$effect` only for canvas rendering and side effects — never to synchronize state.
- **TypeScript strict** — no `any` types. Types live with the data they describe (in `streak-types.ts`).
- **Tailwind 4** utility classes. Reuse styles from `base.css`.
- **Kebab-case filenames** throughout (`transfer-engine.ts`, not `transferEngine.ts`).
- **Less code is better.** Avoid unnecessary complexity. No `utils.ts` or `helpers.ts` — files named for *why* they exist.
- **SIM constants** in `streak-types.ts`. No magic numbers scattered across files.
- **RAF loops** inside `$effect` with `cancelAnimationFrame` cleanup. Use `untrack()` for reads that shouldn't retrigger.
- **Never start the dev server** — it's already running or the user will start it.
- After making UI changes, verify with Playwright MCP browser tools at `http://localhost:3000`.

---

## Dashboard Strategy

The codex-streak workflow now lives on a **single dashboard route** instead of separate harness pages. The page layout is:

- Hero streak plate with loop status and direct interaction
- One controls rail with species sliders, `Load Sample`, `Sterilize`, `Reset Plate`, incubation slider, and canonical scenarios
- Three phase cards: `Transfer`, `Seeding`, `Growth`

Each phase card stays visible at all times and exposes **collapsible diagnostics** for deeper inspection:

- `Transfer`: transfer view toggle, dirty-region summary, conservation summary
- `Seeding`: founder totals, locality summary, deterministic replay check
- `Growth`: biomass/coverage/nutrient/waste views plus confluence/resource summaries

The workflow is intentionally **live-session only**. No file import/export, mock fixture loading, or separate per-phase routes are required to inspect the pipeline.

---

## Structured Debug Logging

Opt-in structured logging per layer. Not noisy per-pixel spam — summaries at meaningful events.

```ts
// In streak-types.ts
interface DebugLogConfig {
  transfer: boolean;   // log per-stroke summaries
  seeding: boolean;    // log per-seeding summaries
  growth: boolean;     // log per-recomputation summaries
  render: boolean;     // log per-render summaries
  verbose: boolean;    // enable per-stamp / per-cell detail (expensive)
}
```

### What gets logged per layer

**TransferEngine** (per completed stroke, i.e. on `endStroke` — not per segment):
```
[transfer] stroke: deposited=[0.42, 0.18] picked=[0.05, 0.12] sectors=[0.31, 0.28, 0.27, 0.30] conservation=99.2%
```
Per-segment detail is only logged in verbose mode.

**SeedingEngine** (per seeding pass):
```
[seeding] founders: [speciesA=12840, speciesB=5230] cells_touched=18070 determinism=ok
```

**GrowthEngine** (per recomputation):
```
[growth] t=24h steps=48 biomass=[0.34, 0.18] coverage=[0.52, 0.29] nutrient_mean=0.61 waste_mean=0.12 confluence=0.38
```

**RenderSynth** (per render):
```
[render] height_max=0.8 lawn_area=0.35 components=47 groove_visible=0.12
```

Controlled via a `debugLog` toggle in the debug panel. Verbose mode (per-stamp detail) is a separate toggle, off by default.

---

## Phased Implementation

### Phase 1: Transfer Engine + Sector Loop + Debug
**Files**: `streak-types.ts`, `deterministic-rng.ts`, `transfer-engine.ts`, `debug-renderer.ts`, `validation.ts`, `pipeline-harness.svelte`, wire `App.svelte`

**Primary dev surface**: the `Transfer` card inside `pipeline-harness.svelte` at `#/reference/codex-streak/pipeline` — streak directly on the plate, then inspect film density, loop sector bars, and conservation metrics in place.

**Acceptance criteria**:
- [ ] Multi-species sample loaded onto 4 loop sectors
- [ ] Deposits are lower in center of loop contact and pushed outward (sector geometry produces bimodal profile)
- [ ] Streaking through previous streaks remixes species correctly (pickup before deposit; sterilized loop picks up substantial material)
- [ ] Fluid film depletion reduces transfer efficiency gradually (not "running dry")
- [ ] Fresh streaks show transient deposit fluid; old streaks have only baseline agar wetness
- [ ] Cross-section profile validation shows center trough + side lobes
- [ ] Mass ledger conservation error < 5% per species
- [ ] Action log export → import → replay produces identical film (determinism verified)
- [ ] Calibration: streak width profile approximately matches reference image metrics

### Phase 2: Seeding Engine
**Files**: `seeding-engine.ts`, update `pipeline-harness.svelte`, update `debug-renderer.ts`, update `validation.ts`

**Primary dev surface**: the `Seeding` card inside the dashboard — verify founder heatmaps, locality, and deterministic replay against the live transfer state.

**Acceptance criteria**:
- [ ] Deterministic founder map generated from film density per cell
- [ ] Dense film → high founder counts; sparse film → low counts
- [ ] Species composition of founders matches local film composition
- [ ] Same film + same plateSeed = identical founders
- [ ] New stroke only changes founders in affected cells (deterministic locality)
- [ ] Scrubbing time does NOT change founder map
- [ ] No density-dependent founder sizing
- [ ] Founder conservation ratio (founder_mass / film_mass) is consistent across density ranges
- [ ] Calibration: colony count vs distance from inoculum approximately matches reference

### Phase 3: Growth Engine
**Files**: `growth-engine.ts`, update `pipeline-harness.svelte`, update `debug-renderer.ts`, update `validation.ts`

**Primary dev surface**: the `Growth` card inside the dashboard — scrub incubation time and switch between biomass, coverage, nutrient, and waste views without leaving the page.

**Acceptance criteria**:
- [ ] Sparse regions produce isolated biomass peaks at full species-defined size
- [ ] Intermediate regions show partial merge (coverage 0.3–0.8)
- [ ] Dense regions merge into confluent lawn (totalCoverage > 0.8)
- [ ] Nutrient depletes dynamically — dense regions deplete faster, visible in debug
- [ ] Waste accumulates dynamically — inhibits late-stage growth, visible in debug
- [ ] Coverage is biological and feeds back into growth (not just visual)
- [ ] Incubation scrubbing 0h–72h is responsive (< 50ms per slider change)
- [ ] At 0h: biomass = 0 everywhere, only transfer residue visible
- [ ] biomassVsTime curves show lag → linear → saturation shape
- [ ] Calibration: colony size distribution and confluent fraction approximately match reference

### Phase 4: Render Synth + Renderer
**Files**: `render-synth.ts`, `plate-canvas-renderer.ts`, update `pipeline-harness.svelte`, update `validation.ts`

**Primary dev surface**: the canonical dashboard route, keeping final render inputs observable from the same workflow surface.

**Acceptance criteria**:
- [ ] Confluent zones render as continuous carpet (coverage-driven)
- [ ] Isolated zones render as distinct colony shapes (subcell jitter breaks grid)
- [ ] Intermediate zones show visible partial merge
- [ ] Hemolysis halos visible for appropriate species
- [ ] Grooves visible where loop pressed hard
- [ ] Species distinguishable by color
- [ ] Transfer residue (film stain, grooves) visible at all incubation times including 0h
- [ ] Growth-derived height fades in with incubation time
- [ ] Calibration: side-view height silhouette and specular distribution approximate reference

---

## Reuse from Existing Code

| What | Source | How |
|---|---|---|
| Directional kernel geometry | [streak-physics.ts](prototypes/svelte-lab-avatar/components/items/culture/streak-physics.ts) `buildDirectionalSplat()` | Adapt for 4-sector spatial footprints |
| Poisson sampling | [colony-generator.ts](prototypes/svelte-lab-avatar/components/items/culture/colony-generator.ts) `poissonSample()` | Deterministic PRNG version |
| Lambda smoothing | [colony-generator.ts](prototypes/svelte-lab-avatar/components/items/culture/colony-generator.ts) `computeSmoothedLambda()` | Reuse 3×3 averaging |
| Organism data | [organism-defs.ts](prototypes/svelte-lab-avatar/components/items/culture/organism-defs.ts) | Import SpeciesDefs directly |
| Media colors | [simulation-types.ts](prototypes/svelte-lab-avatar/components/items/culture/simulation-types.ts) `MEDIA_COLORS` | Import |
| Grid coordinate math | [simulation-types.ts](prototypes/svelte-lab-avatar/components/items/culture/simulation-types.ts) `plateToGrid()` | Adapt for 512 resolution |

---

## Risks

| Risk | Mitigation |
|---|---|
| 4 sectors too coarse for smooth deposits | Tune sector footprint overlap; increase to 8 if needed (code structure unchanged) |
| Growth checkpoint scrubbing too slow | Profile early; 512² per-cell is ~8ms/step; reduce resolution or add Web Worker |
| Field-based growth looks blocky | Subcell jitter + Gaussian blur in RenderSynth |
| Nutrient/waste dynamics too slow for scrubbing | Checkpoints every 2h; worst case = 4 steps from checkpoint = ~32ms |
| Transfer "fluid depletion" model too subtle | Debug cross-section profile validates bimodal shape; mass ledger validates conservation |
| Reference image metrics are subjective | Start with manual measurement; add image-analysis utility later |
| Full replay is expensive | Action logs are short (~200 segments); transfer replay at 512² is < 100ms for typical sessions |

---

## Remaining Weak Spots

1. **Colony entities are still simplified radial footprints**. They merge much more realistically than the old blur/field model, but they still do not capture branched morphologies, sectoring, or sharply bounded antagonism zones.

2. **Colony picking** (click on an isolated colony) requires connected-component analysis on the biomass field. This is a read-only query, deferred to game integration phase.

3. **Species-specific toxins/inhibitors** are deferred. The global waste field is a first-order approximation. Real zone-of-inhibition behavior requires per-species diffusion fields — significant additional complexity.

4. **Reference image calibration** is manually bootstrapped. Automated image analysis would be more rigorous but is not in the critical path for POC.

---

## What to Build First

1. `streak-types.ts` — all types, SIM constants, calibration targets, DebugLogConfig
2. `deterministic-rng.ts` — SplitMix32 + hash + Poisson
3. `transfer-engine.ts` — 4-sector loop ↔ film with mass ledger + structured logging
4. `validation.ts` — TransferMetrics computation
5. `debug-renderer.ts` — film heatmap + loop sector bars + cross-section profile + mass ledger
6. `pipeline-harness.svelte` — single dashboard with plate, controls, and per-phase cards
7. Wire into `App.svelte`: legacy codex-streak routes redirect to `#/reference/codex-streak/pipeline`

The single dashboard is the **entry point for development** — streak directly on the plate, then inspect transfer, seeding, and growth on one page.

## Verification

After each phase:
1. Open `http://localhost:3000#/reference/codex-streak/pipeline`
2. Interact with the plate / load fixture data
3. Check debug views for expected patterns
4. Check structured log output in console
5. Use Playwright MCP tools to take screenshots for visual regression
