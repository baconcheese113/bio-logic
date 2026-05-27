# Malignant — Prototype PRD v3.0

---

## Prototype Goal
Find the heartbeat. Test three core signals in one playable session before building anything else:

1. **Pikmin tension:** does pulling units off defense to carry debris feel like a real gamble?
2. **Spatial placement:** does where you build the PCR station change how you play?
3. **Genome Leakage urgency:** does the countdown make you feel genuine pressure to finish the instrument chain?

If all three signals are positive, the loop has a heartbeat. Build on top of it. If any signal is negative, fix it before adding anything else.

---

## Two Rules
1. Fun first
2. Teaches biotech instruments and biology through play not explanation

---

## The Core Loop

```
Expand to capillary node
→ Build angiogenic sprout (passive nutrients)
→ Split nutrients: Bioreactor (units now) vs instrument chain (better units later)
→ Send units to collect debris from map
→ Carry debris to PCR station (units off defense during transit)
→ PCR outputs to Gel station (timer)
→ Gel outputs gene part
→ Assemble plasmid in editor
→ Deploy via Incubator (vulnerability window)
→ Immune system learns plasmid via Genome Leakage
→ Local debris depletes
→ Must expand to new node
→ Expansion triggers immune response
→ Repeat under increasing pressure
```

Every action feeds the next. No idle states.

---

## Map

### Structure
- Procedurally generated hex grid, approximately 30x20 hexes total
- Top-down god view
- Fog of war from game start — reveals as colony expands
- Founder Cell placed at center of map

### Tile Types
| Tile | Appearance | Function |
|------|-----------|----------|
| Open tissue | Dark base color | Passable, no cost |
| Fibrous tissue | Slightly darker, crosshatch pattern | Requires MMP Flare to colonize |
| Capillary node | Bright red/pink pulsing hex | Build angiogenic sprout here for passive nutrients |
| Debris field | Small white particle cluster | Units collect debris here, finite supply |
| Immune spawn zone | Dark edge tiles | Immune cells enter from here |

### Procedural Generation Rules
- 3-5 capillary nodes scattered across map, none adjacent to Founder Cell
- 4-6 debris fields, at least one near map edge (high risk), one mid-map (medium risk), one within safe zone (low risk, low yield)
- Immune spawn zones on 2-3 map edges, randomized each run
- Natural chokepoints created by fibrous tissue clusters
- Fog of war covers entire map except 3-hex radius around Founder Cell at start

### Apoptotic Start
One debris field pre-revealed 3-4 hexes from Founder Cell. Small yield. Gives player immediate first action without requiring blind expansion.

---

## Resources

### Nutrients (passive, static income)
Generated continuously by angiogenic sprouts built on capillary nodes. Flows to Founder Cell automatically — no routing in prototype. Rate: 10 nutrients/second per active sprout.

Spent on:
- Bioreactor unit production (20 nutrients per unit)
- Building construction (varies)
- MMP Flare expansion (15 nutrients per flare)

### Debris (consumable, finite per field)
Collected by units carrying from debris fields back to PCR station. Each debris field contains 5-8 debris units total. Once depleted, gone permanently.

Spent on:
- PCR station input (1 debris per run)

---

## Units

### One unit type only
Small amber circles. All units are identical in prototype.

**Each unit can be in one of four states:**
- **Idle:** patrol near Founder Cell
- **Combat:** engage immune cells in range automatically
- **Carrying:** transporting debris from field to PCR station — cannot fight during transit
- **Building:** constructing a structure — stationary and cannot fight during construction

Player switches unit states by clicking markers on the map. Units in carrying or building state are visibly distinct (color shift, small icon above them).

### Unit Production
Bioreactor produces one unit every 4 seconds when nutrients are available. Units spawn adjacent to Bioreactor.

### Unit Limit
Maximum 20 units on field simultaneously. Enforced by energy capacity — each Energy Generator supports 5 units. Player starts with one generator (5 unit cap), must build more to increase cap.

### Starting Units
5 units at game start.

---

## Base Buildings

Player places all buildings at game start during a 30-second pre-wave placement phase. Buildings cannot be moved after placement. This is the spatial placement decision being tested.

| Building | Cost | Function | Size |
|----------|------|----------|------|
| Founder Cell | Free, pre-placed | Base/town hall. Lose it, game over. | 1 hex |
| Bioreactor | 50 nutrients | Produces units continuously | 1 hex |
| PCR Station | 30 nutrients | Accepts debris, outputs amplified sample after 15 seconds | 1 hex |
| Gel Station | 30 nutrients | Accepts PCR output, produces gene part after 10 seconds | 1 hex |
| Incubator | 20 nutrients | Integrates new plasmid into units over 8 seconds | 1 hex |
| Energy Generator | 40 nutrients | Increases unit cap by 5 | 1 hex |
| Angiogenic Sprout | 25 nutrients | Built on capillary node, generates passive nutrients | 1 hex |

### Pre-placement Phase
Game starts with 30-second placement window before first immune wave. Player has 150 starting nutrients. Places Bioreactor, PCR Station, Gel Station, Incubator, Energy Generator anywhere in the revealed starting zone. Placement positions are permanent.

**The spatial placement decision being tested:** PCR and Gel stations placed near the debris field mean short carry routes (units available for combat sooner) but buildings are near the map edge and vulnerable to immune attacks. Placed near Founder Cell means long carry routes (units off defense longer) but buildings are safer. This tradeoff should produce genuinely different strategies on different maps.

---

## Chemoattractant Markers

Player directs units by placing markers on the hex grid.

**Harvest marker (blue pulsing dot):** left-click any passable hex. Nearest available idle units (up to 3) break off to collect debris from the nearest debris field, then carry it to the PCR station. Units carrying debris display a small vial icon. Marker evaporates after units complete the task.

**Defend marker (red pulsing dot):** right-click any passable hex. Nearest available idle units (up to 4) move to that location and engage immune cells in range. Marker persists until right-clicked again to remove.

**Retreat marker (yellow pulsing dot):** middle-click or hotkey + click. All units within 5 hexes of marker immediately return toward Founder Cell. Single use, evaporates after 10 seconds.

No unit micro-control. Player directs at zone level only.

---

## Expansion — MMP Flares

Click any fibrous tissue hex adjacent to current colony territory. Nearest 2 combat units move to that hex and begin digestion (8 seconds). Units stationary and cannot fight during digestion. After 8 seconds: hex colonized, fog of war revealed in 2-hex radius around new tile.

Cost: 15 nutrients per flare.

Expanding to a capillary node hex allows building an angiogenic sprout on that hex, adding passive nutrient income.

---

## Instrument Chain

### Physical flow
1. Player places harvest marker near a debris field
2. Units collect debris and carry it to PCR station (visible carrying animation)
3. On arrival at PCR station, debris automatically enters the queue
4. PCR processes for 15 seconds (visible progress animation — single strand duplicating into many strands)
5. Output automatically transfers to Gel station
6. Gel processes for 10 seconds (visible band migrating down a lane in real time)
7. Gel outputs a gene part — appears as a glowing card above the Gel station
8. Player clicks gene part card to add it to the plasmid parts tray

### What the chain teaches without text
- PCR: one debris unit becomes a usable sample (amplification — more from less)
- Gel: band position on the lane tells the player which gene part they got — different debris sources produce bands at different positions, player learns to read band position as a prediction of output

### Gene Parts in Prototype (two only)
| Gene | Gel Band Position | Effect |
|------|------------------|--------|
| SOD | Upper third of lane | Units resist macrophage oxidative attack — macrophages bounce off |
| PD-L1 | Lower third of lane | Units resist T cell targeting — T cells ignore them |

Two gene parts, two immune cell types in prototype. Player must identify which gene counters which threat by reading the gel band and cross-referencing with the reference card (a small always-visible legend in the corner showing band position → gene name → effect icon). No text explanation of why — just band position, gene name, visual effect icon.

---

## Plasmid Editor

Always visible in bottom-right corner. Small panel.

Fixed horizontal rail:
```
[PROMOTER] → [RBS] → [GENE] → [TERMINATOR]
```

Parts tray below rail. Player starts with generic promoter, generic RBS, generic terminator. Gene part (SOD or PD-L1) added to tray after gel output.

Click parts to slot them in order. Invalid placement: slot shakes, part returns. All four slots filled: Deploy button activates.

Live preview beside rail (icon only, no text):
- Effect icon showing what the plasmid does to immune cell interactions
- ATP cost indicator (low/medium/high as colored bar)

Deploy sends plasmid to Incubator queue.

---

## Incubator

When plasmid deployed:
- Units show "rebooting" animation for 8 seconds (dim pulse)
- Units unavailable during integration
- After 8 seconds: units show gene expression indicator (colored ring matching gene type — green for SOD, blue for PD-L1)
- Incubator status shown as small progress bar in bottom-left

---

## Genome Leakage

Visible countdown timer always present in top-center of screen. Starts at 90 seconds.

**What triggers it:** timer counts down continuously from game start. Each time it reaches zero, the immune system spawns a wave adapted to counter the player's current plasmid — if SOD is active, next wave has ROS-resistant macrophages that ignore SOD. If PD-L1 is active, next wave has MHC-restored T cells that ignore PD-L1.

**Resetting it:** completing a full instrument chain and deploying a new plasmid resets the timer to 90 seconds. Player must continuously run the instrument chain to stay ahead of adaptation.

**The urgency signal being tested:** does watching this timer count down while units are slowly carrying debris back to the PCR station create genuine anxiety? Does the player feel the tension between "I need more units on defense" and "I need this gene part before the timer hits zero"?

**Visual:** large countdown in top-center. Pulses red in final 20 seconds. On reaching zero: immune wave spawns immediately with visible counter-plasmid indicator on those units.

---

## Immune Cells

### One enemy type in prototype: Macrophage
- Medium purple irregular circle with 2-3 small circles attached (pseudopods)
- Spawns from immune spawn zones on map edges
- Pathfinds toward nearest player unit or building
- Engulfs player units without correct counter-protein via staged engulfment (4-second animation, player can interrupt with defend marker)
- After Genome Leakage adaptation: macrophages gain a visual indicator showing they are SOD-resistant (red outline) — player must switch to PD-L1 plasmid

### Wave Timing
- Wave 1: 45 seconds after game start — 3 macrophages
- Wave 2: 90 seconds — 5 macrophages
- Wave 3+: every 45 seconds, +2 macrophages per wave
- Genome Leakage adaptation wave: spawns immediately when timer hits zero, independent of wave schedule — 4 adapted macrophages

---

## Win and Loss Conditions

### Win
Survive for 8 minutes (prototype session length). Final wave at 7:30 — 12 macrophages simultaneously. Survive 30 seconds after final wave spawns.

Win screen:
- Time survived
- How many instrument chains completed
- How many Genome Leakage adaptations survived
- Retry button

### Loss
Founder Cell destroyed.

Loss screen:
- Time survived
- Cause of death (plain language): "Macrophages reached the Founder Cell — SOD plasmid was not deployed in time" or "Genome Leakage adaptation overwhelmed the colony — new gene part was needed"
- Genome Leakage log: timeline of when each adaptation occurred
- Retry button

---

## UI Layout

**80% left/center:** hex grid map, full height, fog of war active

**20% right strip (top to bottom):**
- Genome Leakage countdown (large, prominent)
- Instrument chain status: PCR progress → Gel progress → gene part ready indicator
- Plasmid editor rail with parts tray and Deploy button
- Incubator status

**Top bar (thin strip):**
- Game timer (left)
- Unit count / unit cap (center)
- Nutrient income rate (right) — number only, no bar

**Bottom-left:**
- Small legend card: band position icon → gene name → effect icon (always visible, no text explanations)

**No other panels. No modals. No tabs.**

---

## Fog of War

- Entire map covered at start except 3-hex radius around Founder Cell
- Reveals permanently as colony expands (colonized hexes + 2-hex radius around each)
- Immune cells visible when within 3 hexes of any revealed tile
- Debris fields visible when revealed — quantity shown as particle density
- Capillary nodes visible when revealed — show whether sprout has been built

---

## Procedural Generation

Every run generates:
- New capillary node positions (3-5 nodes, none within 6 hexes of Founder Cell)
- New debris field positions (4-6 fields, varying distances from Founder Cell)
- New immune spawn zone positions (2-3 edges)
- New fibrous tissue cluster positions (creating different chokepoints each run)
- Apoptotic Start debris field always within 4 hexes of Founder Cell

Seed displayed on win/loss screen so players can replay the same map.

---

## Visual Language (no external art assets)

All Phaser graphics primitives:

| Element | Visual |
|---------|--------|
| Founder Cell | Large amber circle, slow warm pulse |
| Player units (idle/combat) | Small amber circles |
| Player units (carrying) | Small amber circles with white dot above |
| Player units (building) | Small amber circles with gear icon above |
| Units with SOD | Green ring around unit |
| Units with PD-L1 | Blue ring around unit |
| Macrophage | Medium purple circle with 3 small attached circles |
| Adapted macrophage | Same + red outline |
| Debris field | Cluster of small white particles, count shown as density |
| Capillary node | Bright pink pulsing hexagon |
| Angiogenic sprout | Pink hexagon with amber center dot |
| Bioreactor | Dark amber square with slow pulse |
| PCR Station | Gray square, activates with DNA strand animation during processing |
| Gel Station | Gray square, shows vertical band lane during processing |
| Incubator | Gray square with spiral icon |
| Energy Generator | Gray square with lightning bolt icon |
| Harvest marker | Blue pulsing dot with shrinking opacity ring |
| Defend marker | Red pulsing dot, persistent |
| Retreat marker | Yellow pulsing dot, fades after 10 seconds |
| MMP Flare | Orange starburst on fibrous tile during digestion |
| Fog of war | Dark overlay, semi-transparent at edges of revealed area |
| Open tissue | Dark #0a0f1a base |
| Fibrous tissue | Slightly lighter with subtle crosshatch |
| Colonized tile | Faint amber tint |

---

## Tech Stack
- **Phaser 4:** hex grid, fog of war, unit pathfinding and state machine, immune AI, marker system, MMP Flare animation, PCR/Gel animations, engulfment animations, procedural map generation
- **Svelte 5:** right panel (Genome Leakage timer, instrument chain status, plasmid editor, incubator), top bar, bottom-left legend card, win/loss screens
- **EventBus:** typed Phaser ↔ Svelte — Phaser emits: `debris_collected`, `pcr_complete`, `gel_complete`, `wave_spawned`, `leakage_triggered`, `founder_destroyed` — Svelte emits: `plasmid_deployed`, `marker_placed`, `flare_placed`
- **Vite:** add `prototypes/malignant` to rollup inputs and prototype gallery

---

## Explicitly Excluded from Prototype
- Warburg channel drawing (nutrients flow automatically)
- Lactic acid congestion
- Multiple unit types
- Multiple enemy types (T cells, NK cells, neutrophils)
- ELISA station
- Flow Cytometer
- Restriction Digest
- Sequencer
- Chromatography
- Microarray
- Pheromone Beacons
- Plasmid library (save multiple designs)
- Reference book pages as map collectibles
- Promoter/RBS variations with meaningful differences
- Sound
- Adaptive escalation beyond Genome Leakage

---

## Playwright Verification Tests
1. Units move toward harvest marker placed near debris field
2. Units carrying debris display vial icon and cannot engage immune cells
3. PCR station shows strand duplication animation during processing
4. Gel station shows band migrating down lane during processing
5. Gene part card appears above Gel station on completion
6. Gene part added to plasmid parts tray when card clicked
7. Plasmid Deploy button inactive until all four slots filled
8. Invalid slot placement triggers shake animation
9. Units show gene ring after Incubator integration completes
10. SOD units survive macrophage contact — macrophage bounces
11. Non-SOD units enter staged engulfment on macrophage contact
12. Genome Leakage timer counts down and resets on plasmid deployment
13. Adapted macrophage wave spawns with red outline on timer reaching zero
14. Fog of war reveals correctly as colony expands
15. Capillary node accepts angiogenic sprout, nutrient rate increases
16. MMP Flare colonizes fibrous tile after 8 seconds
17. Win screen appears after 30-second final wave survival
18. Loss screen shows correct cause of death text
19. Procedural map differs between two consecutive runs
20. Retry button resets game with new procedural map

---

## The Three Signals — How to Read Them

After building, play three runs on three different procedural maps before evaluating anything.

**Signal 1 positive:** you feel genuine anxiety when pulling units off defense to carry debris. You catch yourself watching the unit count on defense drop and wanting the carriers to hurry up.

**Signal 2 positive:** on the second run you place the PCR station somewhere different because the map layout made your first-run position feel wrong. The two playthroughs feel meaningfully different.

**Signal 3 positive:** you look at the Genome Leakage timer and feel urgency about the instrument chain that has nothing to do with the wave schedule. You want that gene part ready before the timer hits zero independent of any other pressure.

If all three: ship it to Phase 2.
If any one fails: fix that signal only before adding anything else.
# Malignant - Prototype PRD v4.0 Working Direction

This prototype has pivoted away from the v3 marker-only design. The current playtest direction is:

- Map is a large, pannable 100x100 hex field. The player should not see all controlled territory at once.
- Unit control is RTS-style: left-click/drag-select units, right-click to move/attack/harvest, middle-drag to pan.
- Unit range and active sight are both 3 hexes. Terrain can stay permanently revealed after exploration, but enemies are visible only when standing on an actively visible hex.
- Exploration pressure scales sharply with distance from the Founder Cell. Immune density should rise exponentially as the player pushes outward.
- Macrophages can aggro to sensed units, remember the last known location, and pull nearby macrophages toward that location.
- The HUD should be contextual, not encyclopedic. Details for PCR, Gel, Incubator, plasmid assembly, and building purpose should appear when the related building/result is selected or active.
- Always-on legends should be avoided. Biological meaning should be communicated through map visuals, building details, and direct feedback from experiments.
- Buildings must create real strategic need: sprouts fund growth, bioreactors create units, energy caps units, PCR/Gel/Incubator unlock biological counters, and expansion/building work creates vulnerability.
- Current build direction: Bioreactors queue unit growth over time rather than spawning instantly; build previews use colored hex validity tiles; major lab buildings require wider spacing so base layout is a real spatial decision; victory requires clearing the immune population across the map rather than merely surviving a timer.

The v3 text below is retained as historical context and should be reconciled or replaced before the next full implementation pass.
