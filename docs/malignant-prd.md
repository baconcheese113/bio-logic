# Malignant — Full PRD v2.0

---

## Pitch
Real-time strategy god-game. You play as an intelligent cancer cell lineage expanding through procedurally generated host tissue. Paint chemical signals to direct autonomous units, draw nutrient channels across a hex grid, run biotech instrument chains to identify gene parts, assemble plasmids that determine how your units fight and survive, and outlast an adaptive immune system that learns your plasmids from your destroyed buildings. TAB's expansion tension + Factorio's production chain + real molecular biology as the mechanical backbone.

---

## Two Rules
1. Fun first
2. Biotech instruments and biology concepts taught through play not explanation

---

## Phase 1 Prototype Goal
Build one complete scripted vertical slice validating the core question: **does the player feel smart because a real biotech workflow produced a battlefield advantage?**

The slice: scout encounter → debris drop → PCR → gel → reference book match → plasmid assembly → incubator → resistant units survive toxin → destroy nest.

Nothing outside this slice gets built until this slice is validated as fun.

---

## Core Loop
**Expand** through fog-of-war host tissue using MMP Flares → **Harvest** nutrients via drawn Warburg channels → **Collect** biological debris with units → **Run instrument chains** to identify gene parts → **Assemble plasmids** defining unit combat behavior → **Direct units** via chemoattractant painting → **Survive** adaptive immune escalation that learns your plasmids from destroyed buildings → **Mutate** in response → crescendo to chaos

---

## The Map

### Structure
- Procedurally generated host tissue, top-down god view, hex grid, fog of war
- Founder Cell at center — lose it, game over
- Capillary resource nodes scattered across map as nutrient sources
- Debris fields as gene part sources
- Reference book pages and instrument caches as collectibles
- Pathogen nest as Phase 1 win target

### Tile Porosity (three levels)
| Tile Type | Movement | Expansion Cost | Immune Spike |
|-----------|----------|----------------|--------------|
| Open interstitial space | 100% speed, free | None | None |
| Fibrous tissue | 60% speed | MMP Flare, 15 seconds | Small |
| Dense ECM wall | 30% speed | MMP Flare, 30 seconds | Large |

Map generation guarantees open corridors exist in every direction from the Founder Cell — scouting to find low-resistance paths is a high-value skill.

### Starting Condition — The Apoptotic Start
One pre-placed "Withered Immune Cell" debris node spawns exactly three hexes from the Founder Cell. This represents the host's initial failed attempt to clear the first tumor cell. The player's first task is sending a collector to this node — seeding the first PCR/Gel run before active combat begins. No losses required to start the instrument chain.

---

## The Continuous Verb — Chemoattractant Painting

### Volatile Painting (primary verb)
Left-click or click-drag anywhere on the map to place a chemical signal marker. Markers evaporate after 15 seconds requiring constant repainting as the situation changes. The player is always placing, repositioning, and refreshing markers. Between placements they read instrument outputs, monitor the flow cytometer, and check Genome Leakage alerts.

**Three marker types:**
- **Harvest marker (blue):** pulls collector units toward resource nodes or debris fields
- **Defend marker (red):** pulls combat units toward a threatened location
- **Retreat marker (yellow):** pulls all nearby units back toward the Founder Cell

Markers cost nothing. The constraint is attention — the map is always larger than the player's current focus. Multiple markers of the same type create a gradient — units distribute proportionally across them.

### Pheromone Beacons (automation layer)
Buildable permanent structures placed with right-click at a small resource cost. Provide a constant directional pull of a chosen marker type without evaporating. Used to automate established supply lines and settled defense positions, freeing the player's attention for dynamic crisis response.

**Progression:** early game the player is painting everything manually. Mid game they transition to a beacon network for established routes with volatile painting reserved for emergencies. Late game the beacon network is a strategic asset — immune cells targeting beacons disrupts the automation layer. Natural progression from manual to automated — identical to Factorio's hand-crafting to assembly line transition.

---

## Units

### Overview
Cancer cells are units. Each unit's combat behavior, movement speed, and survival capability comes entirely from its current plasmid expression. Unit type is not a separate choice — it emerges from which genes are in the plasmid.

### Unit Types (emergent from plasmid)
| Unit Type | Required Genes | Behavior | Weakness |
|-----------|---------------|----------|----------|
| Collector | Motility gene + endocytosis receptor | Fast, collects debris and nutrients, fragile in combat | Dies quickly in engulfment |
| Combat | Cytoskeletal remodeling + secreted protease | Slower, can interrupt engulfments, digests ECM | High ATP burden |
| Builder | Adhesion proteins + structural scaffolding | Builds and repairs structures | Cannot fight |
| Hybrid | Motility + protease | Medium speed, collects and fights | Higher burden than either specialist |

Players discover combinations through play — the reference book does not list unit type recipes.

### Unit Production
Continuous output from Bioreactor requiring nutrient channel input. Lost units are gone permanently.

### Plasmid Integration
New plasmids deployed to existing units via Incubator. Units unavailable during integration (8-15 seconds depending on plasmid complexity). This vulnerability window is a core strategic constraint — timing integrations to avoid wave arrivals is a high-skill decision.

### Energy Limit
Total units fielded limited by energy production from Energy Generators. Expanding the base requires building new generators, which requires new territory, which requires more units. TAB's population tension applied to biology.

---

## Base Buildings

| Building | Function | Notes |
|----------|----------|-------|
| Founder Cell | Base/town hall. Contains Internal Lab. Lose it, game over. | Always present |
| Founder Cell Internal Lab | Slow (3x time), expensive (2x reagents) PCR + Gel. Produces two candidates instead of one. Cannot run disambiguation chain or sequencer. | Always available. Safety net — ensures player is never fully locked out of the instrument loop regardless of building losses. |
| Energy Generator | Powers units and buildings in radius. Required for expansion. | Build early and often |
| Bioreactor | Continuous unit production. Requires nutrient channel input. | Primary population building |
| Incubator | Integrates new plasmids into existing units. Creates vulnerability window. | Standard version: 8-15 seconds |
| Incubator (Rapid) | Late game. Faster integration, shorter vulnerability window. | High resource cost |
| PCR Station | Amplifies trace DNA debris into usable quantities (~30 seconds) | Required first step in instrument chain |
| Gel Station | Separates DNA fragments by size (~20 seconds). Produces visual band. | Requires PCR output |
| Restriction Digest Station | Cuts fragments at specific sequences (~30 seconds). Disambiguates similar-sized fragments. | Requires Gel output when ambiguous |
| Sequencer | Direct identification, skips chain (~90 seconds). Rare reagents. | Fast expensive alternative to chain |
| Flow Cytometer Tower | Reveals FSC/SSC scatter plot of cells in radius. Fog of war revealing. | Intelligence building |
| ELISA Station | Detects proteins secreted by immune cells in radius. Reveals cytokine profile and antibody activity. | Intelligence building |
| Chromatography Column | Purifies specific proteins from crude mixtures. Required gate for highest-tier gene parts only. | Late game |
| Microarray Scanner | Reveals which genes immune cells in radius are currently expressing. | Late game |
| Pheromone Beacon | Permanent marker structure of chosen type (harvest/defend/retreat). | Automation layer |

Buildings can be destroyed by immune cells. Destroyed buildings trigger Genome Leakage.

---

## Nutrient Routing — The Warburg Grid

### Drawing Interaction
Click a capillary node, drag across hex tiles to a building or base zone. Channels snap to hex grid edges. Channels can branch and merge.

### Channel Capacity and Congestion
Each channel segment has a maximum flow rate shown as particle density:
- Sparse particles = underutilized
- Dense particles = near capacity
- Backed-up glowing particles = congested

Congested channels shift from blue → purple and begin leaking lactic acid onto adjacent hex tiles. Lactic acid slows units moving through those tiles and raises the Inflammation Index.

### Fixing Congestion
- Draw a parallel branch channel to split flow
- Downgrade a downstream promoter in the plasmid editor to reduce consumption
- Demolish a downstream building temporarily

### The Plasmid-Routing Connection
Overexpressing a protein in the plasmid editor increases ATP consumption of every unit expressing that plasmid. More units expressing a high-burden plasmid = more downstream demand on channel network = upstream congestion. The player experiences metabolic burden as a spatial routing problem not a number in a menu. This is the game's deepest educational insight — plasmid design decisions have physical infrastructure consequences.

### Interaction Frequency
Player redraws or branches channels every 1-3 minutes as expansion creates new nodes and downstream demand increases. Always something to optimize but never so frequent it dominates attention.

---

## Inflammation Index

Single value tracking host tissue alarm state. Displayed as a subtle color shift in the tissue background — pale at low values, increasingly inflamed red at high values. No numeric bar.

**What raises it:**
- Each new hex tile colonized
- ECM digestion events (MMP Flares)
- Channel congestion and lactic acid leakage
- Units dying and releasing intracellular contents
- Buildings destroyed

**What it drives:** speed and intensity of immune escalation. Higher index = shorter time between wave escalations and higher density immune cell spawns.

**Player response:** consolidate rather than expand, reduce channel congestion, downgrade promoter strength to reduce metabolic waste. Sometimes the correct play is to stop expanding and let the index drop before the next push.

---

## Expansion — MMP Flares

Player clicks a frontier hex tile adjacent to current territory to place an MMP Flare. Nearest available combat units are pulled to the flare location via chemoattraction and begin secreting matrix metalloproteinase enzymes to digest the extracellular matrix.

**Digestion timing:**
- Open interstitial space: instant, no flare required
- Fibrous tissue: 15 seconds
- Dense ECM wall: 30 seconds

**During digestion:**
- Committed units stationary and cannot be recalled
- Digestion site vulnerable — immune cells can attack and interrupt
- Immediate local ELISA-visible immune spike (IL-1 cytokine release visible on ELISA readout)

**Expansion friction:**
- Simultaneous MMP Flares on multiple tiles multiply the immune spike proportionally
- ECM digestion near existing immune patrol routes guarantees immediate engagement
- Deep tissue tiles have denser ECM requiring longer digestion
- Some tiles contain host cell populations requiring displacement before digestion — large cytokine burst on displacement

**Why expansion is always a deliberate gamble:** the immune spike is guaranteed and immediate. Player must assess: do I have enough combat units to handle the response? Is the Inflammation Index low enough to absorb a spike? Is the resource node worth the exposure? These are the same questions TAB players ask before pushing into a new area.

---

## Combat — Staged Engulfment

Combat is deterministic. No RNG. No HP bars. Outcome determined entirely by plasmid design matched against immune cell attack mechanism.

### Engagement Sequence

**Step 1 — Surface scan (2 seconds):**
Immune cell contacts player unit and initiates surface protein scan. Animated as the immune cell circling the unit. Duration is fixed — gives the player a brief moment to recognize the engagement before outcome is determined.

**Step 2 — Outcome determination:**

| Match Quality | Result | Engulfment Duration |
|--------------|--------|---------------------|
| Full counter-protein match | Unit survives, immune cell counterattacked | No engulfment |
| Partial match (similar surface charge, wrong protein) | Slow engulfment begins | 12 seconds |
| No match | Full engulfment begins | 8 seconds |
| No match + activated adaptive immune cell | Fast engulfment | 5 seconds |

### Staged Engulfment
Progressive pseudopod animation wrapping around the unit over 5-12 seconds. Player has three options during this window:

**Retreat:** paint a chemorepellent marker at the engulfment location. Unit struggles to break free.
- Success rate high: first 3 seconds
- Success rate medium: 3-6 seconds
- Success rate low: after 6 seconds
- Visible progress indicator on unit showing engulfment completion percentage

**Reinforce:** paint a defend marker adjacent to the engulfment. Nearby combat units with correct counter-proteins are pulled in to attack the immune cell's surface receptors and interrupt engulfment. Requires having combat units within marker range.

**Accept and learn:** let engulfment complete. Unit dies. A data fragment drops at the location containing information about the attack mechanism used. Collector unit retrieves this fragment and routes it to the instrument chain. Every loss becomes an intelligence opportunity.

### Why Staged Engulfment Works Educationally
Engulfment is a real biological process that takes time and can be interrupted — the animation teaches this without explanation. The player learns immune cell killing mechanics by watching engulfments and responding, not by reading a tooltip.

---

## Genome Leakage — The Central Mechanic

When immune cells destroy a player building or eliminate a cluster of units, they extract genetic information from the debris. The immune AI learns the active plasmid combination associated with that building or unit population.

**Timeline:**
- Leakage event occurs
- Genome Leakage alert appears on screen: "Building compromised — immune adaptation in progress — 60 seconds"
- Timer counts down visibly
- At 0: new immune cell variant spawns in next wave with surface receptors specifically designed to recognize and engulf units expressing the compromised plasmid

**Player response options:**
1. Run instrument chain on incoming adapted immune cell (flow cytometer identifies it, ELISA reveals signaling, PCR on captured debris identifies new receptor) — design counter-plasmid
2. Immediately swap compromised plasmid for alternative from existing library
3. Accept temporary vulnerability and reinforce with numbers rather than plasmid optimization

**Why this is the central mechanic:** no plasmid stays effective forever. Every building destroyed, every unit cluster eliminated is a teaching moment for the immune system. The player who turtles behind one optimized plasmid gets countered within minutes. The player who continuously runs instrument chains and maintains a plasmid library survives longest. The arms race is the game.

**Educational payload:** teaches adaptive immunity — the immune system genuinely does learn pathogen surface proteins and generate targeted responses. Player experiences this as a mechanical threat felt through play not explained in a tutorial.

---

## Instrument Chains — The Intelligence Pipeline

### The Core Chain (fast, cheap)
```
Debris collected 
→ PCR Station (~30 seconds, common reagents)
→ Gel Station (~20 seconds, common reagents)
→ Reference Book (player cross-references band size to gene identity)
→ Gene part unlocked
```
Total: ~50 seconds

### The Disambiguation Chain (medium, when gel is ambiguous)
```
Debris 
→ PCR (~30 seconds)
→ Gel (~20 seconds) — ambiguous result, two candidates with similar sizes
→ Restriction Digest Station (~30 seconds)
→ Second Gel run (~20 seconds)
→ Reference Book (unique cut pattern → definitive identification)
→ Gene part unlocked
```
Total: ~100 seconds

### The Fast Expensive Chain
```
Debris 
→ Sequencer (~90 seconds, rare reagents)
→ Gene part unlocked immediately on completion
```
Total: ~90 seconds but costly

**Player chooses chain based on:** current urgency (Genome Leakage timer running?), available reagents, whether the gel result was ambiguous. Learning which chain to run when is the primary skill developing across runs.

### The Educational Demonstration Moment (scripted)
The first time the player completes a gel run, this sequence triggers deliberately:

1. Gel station completes — band appears at 400bp position
2. Reference Book tab auto-pulses with a highlight animation
3. Player opens Reference Book — it auto-scrolls to the gene table
4. The 400bp entry pulses with matching glow: "SOD Gene — 400bp — Neutralizes oxidative stress — counter to macrophage ROS attack"
5. Player drags SOD gene to plasmid editor
6. Deploys via Incubator
7. New units expressing SOD survive macrophage ROS attacks visibly
8. Brief on-screen confirmation: "SOD protein neutralized oxidative damage"

This sequence is the entire educational payload of Phase 1 delivered in one designed moment. It is not emergent — it is explicitly authored.

---

## Flow Cytometer — Readability Design

### First Encounter (Ghost Overlay)
When the first immune cell type enters the flow cytometer's radius, the scatter plot appears with a temporary translucent label over the cluster:

*"Large cells, low complexity → Macrophages"* with axis labels: X = Cell Size, Y = Internal Complexity

After the player has successfully identified that cell type once (by scanning it or completing the instrument chain on its debris), the ghost label disappears. The player must now recognize cluster shapes themselves.

### Progressive Vocabulary
- First encounter: "Cell Size" and "Internal Complexity"
- After 3 successful reads: real terms revealed — "FSC (Forward Scatter)" and "SSC (Side Scatter)" — matching real flow cytometry vocabulary
- Players learn the plot visually first, scientific vocabulary second

### Reference Cluster Signatures
| Cell Type | FSC | SSC | Visual Cluster Shape |
|-----------|-----|-----|---------------------|
| Macrophage | High | Low | Large diffuse cluster, lower-right |
| Neutrophil | Medium | High | Tight cluster, upper-center |
| NK Cell | Medium | Low | Elongated cluster, center-left |
| T Cell | Low | Low | Small tight cluster, lower-left |
| Antibody cloud | N/A | N/A | Diffuse scatter across full plot |

---

## Plasmid Editor — Full Specification

### Visual
Fixed horizontal rail with labeled slots:
```
[PROMOTER] → [RBS] → [GENE] → [TERMINATOR]
```

Parts tray below the rail showing available gene parts unlocked through instrument chains.

### Interaction Rules
- Parts drag from tray to slots
- Parts only snap into correct slot type — gene dragged to promoter slot triggers magnetic rejection animation (part snaps back) plus brief red slot flash
- Slots must be filled in order — cannot place gene before promoter
- All four slots must be filled before Deploy becomes available
- Incomplete plasmid: Deploy button grayed out with tooltip "Incomplete circuit — gene will not express"
- Missing terminator specifically: slot glows amber with warning "Transcript will not terminate — expression will leak"

### Live Preview
As parts are slotted, a sidebar updates in real time:
- Projected protein output (low/medium/high)
- ATP burden cost (shown as a filling bar — green → yellow → red)
- Activation condition (constitutive/inducible — describes trigger)
- Unit effect in plain language: "Units resist macrophage oxidative attack"
- If ATP bar turns red: warning "Metabolic burden exceeds current energy output — reduce promoter strength or build more generators"

### Deploy
"Send to Incubator" button. Adds plasmid design to Incubator queue. Player sees a progress bar as the colony integrates the new DNA. Units in the Incubator are unavailable during integration.

### Plasmid Library
Player maintains multiple saved plasmid designs. Switching a unit population between plasmids requires running through Incubator. Maintaining pre-assembled counter-plasmids for common immune threats is advanced play — the library panel shows all saved designs with their last-used timestamp and whether they've been countered by Genome Leakage.

---

## Gene Parts

### Tier 1 (early game, fast chain)
| Gene | Gel Size | Function | Counter Against |
|------|----------|----------|-----------------|
| SOD | 400bp | Neutralizes reactive oxygen species | Macrophage ROS attack |
| PD-L1 | 680bp | Surface camouflage from T cell recognition | T cell targeting |
| Motility-A | 290bp | Increases unit movement speed | — |
| Endocytosis-R | 510bp | Enables debris collection | — |
| Protease-1 | 620bp | Enables ECM digestion, basic combat | Dense ECM walls |

### Tier 2 (mid game, disambiguation chain)
| Gene | Restriction Pattern | Function | Notes |
|------|--------------------|---------|----|
| Toxin-Inducible Promoter | Unique 3-band | Gene only activates in toxin-rich environment | Saves ATP when toxin absent |
| Charge-Repulsion | Unique 2-band | Negative surface charge repels phagocytes | Partial counter to multiple cell types |
| Complement-Inh | Unique 4-band | Inhibits complement cascade proteins | Late innate / early adaptive |
| MUC1 | Unique 3-band | Mucin coating reduces antibody binding | Counter to antibody floods |

### Tier 3 (late game, sequencer or full disambiguation)
Unlocked through sequencer runs on late-wave immune cell debris. Not listed in the reference book by default — sequencer output reveals them. Examples: multi-function proteins, secreted signaling molecules affecting neighboring units, high-potency evasion proteins defeating adaptive antibody responses.

### Emergent Combinations (undocumented)
Some plasmid combinations produce effects not described in the reference book — emerging from combining gene parts in non-obvious ways. These are the Factorio-discovery moments. Example: Motility-A combined with Protease-1 in the same plasmid produces units that also clear lactic acid from congested channels — biologically plausible, mechanically useful, never explicitly taught.

---

## Reference Book

### Structure
Pages collected from map debris fields and instrument caches. Each page contains:
- Gene name and plain-language biological function
- Gel band size in base pairs
- Restriction cut pattern (number and position of bands produced by each enzyme)
- Which immune cell types express this gene and why
- Counter relationships: "SOD counters macrophage ROS attack because superoxide dismutase neutralizes the reactive oxygen species macrophages secrete"

### Cross-Reference Mode
When the Gel Station is active and showing a result, opening the Reference Book enters Compare Mode — the book highlights all entries matching the current band size. If disambiguation is needed, it shows two candidates and prompts the player to run the restriction digest.

### Persistence
Pages persist across runs. Player genuinely knows gel band sizes for common genes by run 3. Recognizes restriction cut patterns by run 5. Reads flow cytometer scatter plot without hesitation by run 7. Anticipates Genome Leakage counter-plasmid needs before leakage occurs by run 10. The learning is real — player is faster because they actually internalized the biology.

---

## Immune Escalation

### Inflammation Index Drives Escalation
Higher index = shorter time between tiers advancing. Player manages growth rate against immune attention.

### Tier 1 — Innate Response
Macrophages and neutrophils. Non-specific. Slow engulfment (12 seconds with no counter). Flow cytometer scatter plot shows characteristic clusters. Countered by basic surface camouflage proteins. Genome Leakage from tier 1 building losses teaches immune system the most common plasmid in the population.

Scout encounter at game start: one weak macrophage appears near the Founder Cell, attacks briefly, drops debris when killed or when it retreats. Safe enough to survive without any counter-protein. Designed to seed the first instrument chain.

### Tier 2 — Adaptive Response
T cells and NK cells targeting specific surface proteins learned from Genome Leakage. Antibodies flooding tissue near compromised buildings. ELISA detects rising antibody titers 60-90 seconds before they reach units. Microarray reveals what adaptive cells are expressing. Player must have run instrument chains and designed counter-plasmids before this tier or losses accelerate rapidly.

### Tier 3 — Coordinated Assault
Multiple simultaneous cell types from multiple directions. Immune cells actively targeting instrument buildings — destroying ELISA stations and flow cytometers removes the player's intelligence infrastructure at the worst possible moment. Genome Leakage accelerating as buildings fall faster. Wave composition changes faster than a single instrument chain can track — multiple intelligence buildings running simultaneously required. Full chaos. Triage required.

### The Crescendo
Late tier 3 is too much to manage perfectly. The player who built intelligence infrastructure early, has multiple plasmid variants pre-assembled, has flow cytometer and ELISA coverage across the map, and maintains clean Warburg channels survives longest. The player who neglected instrument infrastructure and over-relied on one plasmid collapses fast and immediately understands why — the Genome Leakage log shows exactly when the immune system learned their plasmid and what variant it spawned in response.

---

## Win and Loss Conditions

### Phase 1 Win Condition
**Destroy the pathogen nest.** After nest destruction, survive a 60-second final immune wave. This directly validates the biotech loop: identify threat → engineer counter → push into hostile zone → destroy target.

### Phase 2+ Win Condition
**Secure 60% of active capillary nodes and maintain control for 120 consecutive seconds.** UI shows a progress ring tracking controlled nodes. Timer starts only at 60% threshold. Dropping below threshold resets timer. The final 120 seconds is a hold-the-line crescendo with maximum immune pressure.

### Loss Condition
Founder Cell is destroyed. Game over screen shows:
- Time survived
- Wave reached at death
- Cause of death in plain language: "Macrophages breached the colony — SOD gene was not active"
- Genome Leakage log: timeline of when the immune system learned each plasmid and what variant it generated
- One concrete retry suggestion: "Add SOD to your plasmid before the first macrophage wave"

Player never wonders why they lost.

---

## How Player Improves

### Within a Run
- Early instrument investment compounds — flow cytometer built early means no wave is ever a surprise
- Reference book pages collected early make every instrument chain faster
- Clean Warburg routing early means no congestion crisis mid-game
- Plasmid library built early means Genome Leakage responses take seconds not minutes

### Across Runs
- Reference book pages persist — player knows gel band sizes for common genes by run 3
- Player anticipates Genome Leakage timing by run 5
- Player reads flow cytometer scatter plot without hesitation by run 7
- Player pre-assembles counter-plasmids for all tier 2 threats before tier 2 begins by run 10
- Learning is real — player is faster and more confident because they actually internalized the biology not because a number went up

---

## Interaction Frequency

Every 5-10 seconds: repaint fading chemoattractant markers, pull completed instrument output, respond to engulfment in progress, read flow cytometer scatter plot update.

Every 30-60 seconds: place MMP Flare for expansion, redraw congested Warburg channel branch, queue new instrument chain input, check ELISA readout, assign units to incubator.

Every 2-3 minutes: respond to Genome Leakage alert with instrument chain and counter-plasmid design, push new expansion front, rebuild destroyed intelligence building, redraw Warburg routing for new expansion nodes.

Never idle. Always reading a live system and occasionally steering it.

---

## Tech Stack
- **Phaser 4:** hex grid rendering, unit movement and pathfinding, chemoattractant gradient simulation, staged engulfment animations, Warburg channel particle flow, fog of war, immune cell AI, MMP Flare digestion animation
- **Svelte 5:** plasmid editor, instrument chain UI, ELISA readout panel, flow cytometer scatter plot, reference book with compare mode, Genome Leakage alerts, base building menu, Pheromone Beacon placement
- **EventBus:** typed Phaser ↔ Svelte communication
- **All rendering:** 2D, browser-based, no 3D required

---

## Build Sequence

### Phase 1 Prototype (validate the core loop)
One scripted vertical slice:
1. Founder Cell placed, Apoptotic Start debris node three hexes away
2. Player sends collector via harvest marker — retrieves debris
3. PCR Station processes debris (30 seconds)
4. Gel Station produces 400bp band (20 seconds)
5. Reference Book auto-pulses — player opens it — 400bp entry highlighted — SOD gene identified
6. Player assembles SOD plasmid in editor — promoter → RBS → SOD → terminator
7. Player sends to Incubator — units unavailable 10 seconds
8. Macrophage wave arrives — units without SOD die in 8-second engulfment, units with SOD survive and counterattack visibly
9. Player pushes to pathogen nest using MMP Flares through fibrous tissue
10. Nest destroyed — 60-second final wave — survive — win

No Genome Leakage. No adaptive escalation. No Warburg routing. No fog of war. No flow cytometer. Just the core instrument chain → plasmid → battlefield advantage loop.

**Validation question:** does the player feel smart because a real biotech workflow produced a battlefield advantage? Yes = proceed to Phase 2. No = fix the visualization before building anything else.

### Phase 2 (validate the full RTS loop)
Add chemoattractant painting, Warburg channel drawing, MMP Flare expansion, fog of war, Flow Cytometer Tower, ELISA Station, Genome Leakage, tier 1 and 2 immune escalation, Inflammation Index, Pheromone Beacons.

**Validation question:** does directing units via markers while managing channels, running instrument chains, and responding to Genome Leakage feel like a game worth playing for 30 minutes? Yes = proceed to Phase 3.

### Phase 3 (validate the crescendo)
Add tier 3 escalation, Microarray Scanner, Chromatography Column, full plasmid library system, tier 3 gene parts, Rapid Incubator, node-control win condition, full reference book with 20+ pages, procedural map generation.

**Validation question:** does the late-game feel like TAB's final invasion but with biological decisions replacing tower placement? Yes = ship.

---

## Success Metrics
- Player makes a meaningful decision every 5-10 seconds without prompting
- Player understands why they lost without reading any explanation
- Player immediately wants to retry with a specific change in mind
- Player can explain what PCR does after 3 runs without being told
- Player can read a flow cytometer scatter plot after 5 runs without help
- A non-biologist finishes run 10 faster than run 1 because they actually learned the biology
- The loss screen Genome Leakage log reads like a story of the immune system outsmarting the player — the player nods and says "I see what happened"