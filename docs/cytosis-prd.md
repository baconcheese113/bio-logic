# Cytosis — Product Requirements Document v0.1

## One-line summary

Asymmetric two-player turn-based strategy game where one player advances a pathology (cancer, infection, autoimmune) and the other plays the body's defenses, on a tissue grid where hidden cells, telegraphed plays, and plasmid-engineered abilities create a hunt-and-counter dynamic.

## Status disclosure

This PRD specifies the framework and the decisions made to date. Several mechanical questions are explicitly open and should be resolved through paper prototyping before final implementation. Sections marked **[OPEN]** are decisions that need playtesting input rather than design assertion. Claude Design should propose options for these rather than treating them as settled.

## Design goals

**Educational goals (in priority order):**
1. Teach plasmid design as a creative engineering activity — composing parts to produce specific cellular behaviors
2. Teach biotech instruments by making them useful in-game tools whose inputs and outputs the player learns by need
3. Teach disease pathology by making each scenario a specific real disease whose mechanisms drive the gameplay constraints

**Fun goals (in priority order):**
1. Create a contest of hidden information, deduction, and bluff between two players
2. Reward creative plasmid design with visible cellular consequences on the board
3. Produce 10-40 minute matches that can tip until the final turns
4. Support asymmetric scenarios where each role plays meaningfully differently

**Constraints:**
- BioRender-style visual aesthetic: clean, scientific, recognizably biological without being photoreal
- No reliance on a written codex; all needed information delivered through visual feedback, single-sentence hover descriptions, and consequence
- No more than 8-12 instruments total across the whole game
- Real biological vocabulary used sparingly; acronyms only when more clarity would be lost than gained
- Onboarding through scenario progression that limits available parts and instruments early

## Core loop

Two players take alternating turns on a shared tissue grid. Each turn a player takes 2-4 actions from a menu of:
- Draw cards (from a deck of biological parts, instruments, and reagents)
- Play a card to commit an effect that resolves after a delay
- Move cells or issue standing orders
- Run an instrument on collected materials
- Open the plasmid editor to compose or modify a plasmid using parts in hand
- Deploy a designed plasmid to one or more controlled cells (deployment mechanism is itself a card type)

All committed plays are visible to the opponent during their charge time. This is the central tension mechanic: any test, attack, or scan you set up gives your opponent advance warning and a window to respond.

A turn ends when actions are spent. After both players have taken a turn, a simultaneous resolution phase occurs: all cells move and act on their standing orders, all charged cards resolve in their scheduled order, environmental effects propagate (gradients, cytokines, immune recruitment).

Matches end when one player achieves their objective threshold or the opposing player's objective is irrecoverably blocked.

## Match structure

**Match length target:** 10-40 minutes, with a typical match expected around 20-25 minutes.

**Phases within a match:** Each scenario has 3-4 phases representing biological stages of the disease. Phase transitions are triggered by objective progress, not by clock. Each phase changes which cards are drawable, which instruments are unlocked, and which environmental pressures dominate. This provides arc and prevents matches from feeling like a treadmill.

Example for tumor-vs-immune scenario:
- **Initiation:** small tumor cell population, limited immune recruitment, low environmental stress
- **Promotion:** tumor population grows, inflammatory signaling rises, immune player gains access to adaptive response cards
- **Progression:** metastatic risk, organ damage accumulates, both players gain access to advanced specialist cards
- **Resolution:** the match either tips to remission, advances to organ failure, or stabilizes (draw)

**Comeback dynamics:** A losing player accumulates a "selection pressure" resource that buys access to higher-tier or random-mutation cards, while the winning player triggers escalating adaptive responses from the opposing system. This ties comeback availability to specific player choices rather than automatic rubber-banding. Specific values **[OPEN]**.

## Player asymmetry

The two roles play substantially differently while remaining balanced.

**Pathology player (tumor as the worked example):**
- Starts with a small cluster of cells in a chosen tissue location
- Cells divide and spread on the board over time
- Wins by reaching organ failure threshold or by surviving N turns at advanced stage
- Has access to evasion cards (downregulate surface markers, secrete immunosuppressive cytokines, generate antigenic decoys, enter dormancy)
- Has access to invasion cards (matrix metalloproteinases, angiogenesis induction, metastatic seeding)
- Generally has the information advantage early (knows where they are) and the information disadvantage late (immune system has learned them)

**Immune player:**
- Starts with a distributed population of immune cells with passive patrol behavior
- Cells move along anatomical pathways (blood vessels, lymphatic channels) by default
- Wins by reducing pathology cell count below threshold for sustained duration (remission)
- Has access to detection cards (antigen tests, surface marker probes, receptor scanning)
- Has access to elimination cards (cytotoxic lysis, phagocytosis, complement activation)
- Has access to amplification cards (recruit more immune cells, raise inflammation, present antigens)
- Generally has the information disadvantage early (must find the threat) and the information advantage late (after antigen recognition)
- Carries a constraint the pathology player doesn't: collateral damage to healthy tissue from indiscriminate attacks, modeled as autoimmune damage that subtracts from their objective progress

**Asymmetric starting conditions for balance:** Scenarios may start the two players at different "levels." For example, the tumor player might begin at stage 3 with established cells, while the immune player begins with full instrument access and a larger initial cell budget. This is the Squad-style asymmetry the player called out — one side has tempo, the other has options.

## The board

**Grid:** Hexagonal grid representing tissue. Size **[OPEN]** but anticipated 15x15 to 20x20 for the default scenario. Smaller grids for tutorial scenarios, larger for advanced multi-organ scenarios.

**Layers:**
- **Cell layer (foreground):** all moving entities, both players' cells, immune patrols, environmental particles
- **Tissue layer (background):** the anatomical features that don't move
- **Organ sub-layer (beneath the grid):** organs are represented as tinted regions or icons beneath the cell movement layer, not as terrain that blocks movement. Cells move freely across organs; organs accumulate damage from cellular events occurring on their tiles.

**Anatomical features:**
- **Organs (3-6 per match):** persistent objectives that accumulate damage. Each organ has a health value and a failure threshold. Specific organs unlock specific cards or instruments when active (e.g., a functioning lymph node grants the immune player extra card draws per turn).
- **Blood vessels:** cells move faster along vessel tiles. Vessels are how cells enter and exit the local tissue. Severing or blocking vessels creates strategic chokepoints.
- **Lymph nodes (1-2 per match):** function as immune player respawn/recruitment points. Threatened or destroyed lymph nodes weaken the immune player's tempo significantly.
- **Tissue zones:** different regions of the board have different baseline properties (oxygen level, pH, nutrient availability) that affect which cells thrive there. These map onto real microenvironment biology.

**Fog of war / hidden information:** Cells of one player are visible to the other only when within detection range of the other player's cells or instruments. Default detection range is short (1-2 tiles). Specific cards extend or block detection.

## Cells

**Cell types:** Each scenario defines its cell types. For the tumor-vs-immune scenario:
- **Pathology side:** tumor cells (cancerous, divide, can express plasmids you design)
- **Immune side:** macrophages, T cells, dendritic cells, NK cells (each with distinct innate behavior; all can express plasmids you design)
- **Neutral:** healthy tissue cells, which immune cards may damage if used indiscriminately

**Cell behavior:** Cells act on standing orders derived from their plasmid expression. Standing orders are issued at the player or group level, not per-cell. A cell expressing a "patrol" plasmid moves toward the nearest detected threat. A cell expressing a "stealth" plasmid downregulates surface markers and avoids movement when enemies are near. The plasmid IS the cell's behavior program.

**Cell death and turnover:** Cells die from attacks, environmental stress, or programmed apoptosis. Dead cells leave debris on the board that can be sampled (a card-draw mechanism for resources). Cell death is also how plasmid material leaks into the environment for the opponent to discover — sampled debris from your dead cells may reveal what plasmids you were running.

## Cards and resources

**Card categories:**
- **Parts cards:** plasmid components (promoters, RBS, genes, terminators, signal peptides, degradation tags). Used in the plasmid editor.
- **Reagent cards:** consumables used by instruments (primers, enzymes, antibodies, vectors). Used when running instruments or deploying plasmids.
- **Sample cards:** biological materials acquired by sampling the board (DNA, RNA, protein, cell debris). Used as inputs to instruments.
- **Instrument cards:** one-time activations of an instrument's capability. Some instruments may also be permanent unlocks rather than card-based **[OPEN]**.
- **Action cards:** scenario-specific cards that bypass normal mechanics. Includes detection abilities, attacks, environmental modifications, defensive countermeasures.

**Library structure (the resolution to the random-vs-designed tension):**
- **Scaffolding library:** baseline parts (generic promoter, generic terminator, common RBS, selectable markers) are always available with a small nutrient cost. The player can always assemble *functional* plasmids.
- **Specialist library:** specific effector genes, regulatory elements, targeting domains come from card draws or sampling. The player's *clever* plasmids depend on what they've acquired.

This means a player who's behind on draws can still build, but a player who's ahead has more creative options.

**Card draw economy:**
- Cards are drawn from a deck unique to the player's scenario role
- Draw rate is biased random: you choose where on the board to sample, sampling location biases which card types you might draw, specific cards within that bias are partly random
- Hand size cap: 7-10 **[OPEN]**

**Telegraphed plays:**
- When a player commits a card with delayed resolution, the card or its effect type becomes visible to the opponent for the duration of its charge time
- Charge time varies by card power; a quick antigen test might charge in 1 turn while a coordinated immune attack might charge in 3
- Both players can play cards during the charge time to block, redirect, or accelerate effects
- This is the central bluff mechanic. Commitment is visible; specific target may not be.

## Plasmid editor

**When the player opens it:** Available at any time but expected to be used 2-4 times per match, not constantly. Functions like Civilization's city management screen — important and occasionally deep, but not the moment-to-moment verb.

**Interface:**
- Linear or circular DNA representation showing the plasmid as a sequence of parts
- Parts library on one side showing what the player has in hand
- Drag parts onto the plasmid sequence to compose
- Live preview showing what the plasmid will do (single-line plain-language description: "produces a protein that kills nearby cells expressing CD47")
- Save designed plasmids to a personal library for reuse across matches

**Complexity expectation:** Plasmids should generally be 3-7 parts long. A "complex plasmid" is one that combines multiple regulatory elements (inducible expression, signal peptides for secretion, multiple genes in an operon, degradation tags for temporal control). The game should reward plasmids that combine elements creatively, not plasmids that just have more parts.

**Deployment:** A completed plasmid is deployed via a vector card (lipofection, viral transduction, electroporation — each with different properties). Deployment targets specific cells or cell groups on the board. The deployment card is consumed. Cells take 1-2 turns to express the new plasmid after deployment, creating a vulnerability window.

**Expression mechanics:**
- A cell can express one plasmid at a time. New deployments replace old ones after the expression window.
- Plasmid expression persists in transfected cells. When those cells divide, daughter cells inherit the plasmid with some probability of loss.
- Expression can be disrupted by opposing cards (immune player can play "interferon response" to silence pathology plasmids in adjacent cells).

## Instruments

**Total instrument roster (target: 8):**
1. **Microscope** — inspect a tile or cell, reveal morphology and gross expression markers
2. **PCR** — amplify a sample of DNA for further use
3. **Gel electrophoresis** — separate DNA by size; identify presence of specific fragments
4. **Sanger sequencer** — read the exact base sequence of an amplified sample
5. **ELISA** — detect and quantify specific proteins in a sample (uses antibody reagent cards to select what to detect)
6. **Western blot** — confirm protein identity in a sample
7. **Flow cytometer** — count and sort cells by surface markers in a sampled tile
8. **Mass spectrometer** — identify unknown molecules in a sample

Each instrument has clear input types (what you can put in) and output types (what you get out). Players learn by playing what each instrument does because they need its outputs to play well.

**Instrument economy:** Some instruments may be permanent unlocks (available every turn) and others may be card-based (single-use). The right split is **[OPEN]** and should be playtested.

**Instrument actions take time:** Most instruments charge for 1-2 turns before producing results. During charge they are visible to the opponent.

## Scenarios

The first release should ship with 3 scenarios that demonstrate the engine's range:

**Scenario 1 — Tumor vs Immune (the flagship):** A solid tumor in a tissue with one primary organ at risk. Tumor player wants organ failure; immune player wants remission. This is the scenario the engine was designed around and should ship most polished.

**Scenario 2 — Viral infection vs Cell defense:** A virus replicating inside host cells. The virus player works at smaller scale (intracellular components, ribosome hijacking, capsid assembly). The cell player manages interferon response, RNAi defenses, apoptotic sacrifice. Demonstrates that the engine supports very different biological scales.

**Scenario 3 — Bacterial competition:** Symmetric scenario where two bacterial colonies compete for the same niche. Both players have access to similar tools (antibiotics, biofilms, conjugative plasmids). Demonstrates the engine supports symmetric play and serves as the cleanest competitive PvP mode.

Each scenario brings its own specialist library of parts and a small set of scenario-specific cards. The core engine is unchanged.

## Onboarding

**Tutorial campaign:** 4-6 single-player scenarios against AI of increasing complexity.

- **Scenario 0a:** One cell, one threat, one plasmid that solves it. Player deploys, watches it work. No opponent. Teaches: deployment, expression visualization.
- **Scenario 0b:** Two threats, two parts, choose. Teaches: plasmid composition basics.
- **Scenario 0c:** Introduce one instrument, require its use to identify what's happening. Teaches: instrument as information tool.
- **Scenario 0d:** First AI opponent on small grid with limited cards. Teaches: telegraphed plays and the contest dynamic.
- **Scenario 0e+:** Expand grid, expand library, introduce additional scenario types.

**Progressive disclosure:** New cards, parts, instruments, and mechanics are introduced one or two at a time. By the end of the campaign the player has encountered the full game vocabulary by need.

**No external codex:** All cards have single-line plain-language descriptions on hover. Real biological names are present but never required for play. A "what is this?" inspect mode shows mechanism in 1-3 sentences when the player clicks a card or board element.

## AI opponent

Required for single-player tutorial and for asynchronous play.

**Tutorial AI:** Scripted behavior tuned to teach. Predictable plays so the player can learn cause and effect.

**Standard AI:** Heuristic-driven opponent with several difficulty levels. Plays the role's strategy roughly correctly. Should not require machine learning.

**Advanced AI [STRETCH]:** Trained or scripted opponent capable of competitive play. Not required for v1.

## Multiplayer

**Local pass-and-play:** Single device, players alternate turns at the screen. Supported in v1.

**Asynchronous online:** Each player takes their turn when they're available; the other receives a notification when it's their turn. Match data persists server-side. Supported in v1.

**Real-time online:** Both players online simultaneously. Useful for tournaments but not strictly required for v1. **[STRETCH]**

## Visual direction

**Reference aesthetic:** BioRender illustrations as the visual North Star. Clean vector-style cell representations. Recognizable cell types by silhouette and color. Anatomical features stylized but accurate.

**Color usage:**
- Each player's cells in a consistent player color (defaults: warm/cool, blue/red)
- Environmental gradients shown as subtle background washes
- Plasmid expression visualized as colored auras or emission particles on cells
- Telegraphed plays shown as visible icons floating over the board with a turn countdown

**UI restraint:** Mini Metro / FTL as references for HUD density. The board is the focus. Cards in hand at the bottom edge. Action budget and turn indicator at the top. Inspect details only when something is clicked. No persistent side panels of data.

## Open mechanical questions

These should be answered through paper prototyping before final implementation:

1. **Action economy specifics:** 2, 3, or 4 actions per turn? Typed actions or generic? Sequential or simultaneous?
2. **Card resolution timing:** Charge times in turns or in actions? Resolution simultaneous or in committed order?
3. **Plasmid-to-cell-behavior mapping:** Exact specification of how expression translates to cell actions on the board.
4. **Grid size and cell counts:** For the default scenario, what board and population size produces matches in the 10-40 minute target range?
5. **Instrument card economy:** Which instruments are permanent unlocks vs single-use cards?
6. **Hand size cap and draw rate:** Calibrated to match length and action economy.
7. **Comeback resource values:** Selection pressure accrual rate and what it buys.
8. **Cell death and debris sampling:** How much information leaks when your cells die?
9. **Organ failure threshold dynamics:** Damage accumulation curve, partial-failure states.
10. **Autoimmune damage modeling:** How much does indiscriminate immune action cost the immune player?

## Production milestones

**Milestone 0 — Paper prototype (1-2 weeks):** Pen and graph paper version with two human players. Goal: validate the core contest is fun and resolve as many open questions as possible. Do not skip this. If the paper version isn't fun, the digital version won't be either.

**Milestone 1 — Digital prototype, single scenario (4-8 weeks):** Tumor-vs-Immune scenario only. Local pass-and-play. Minimal AI. Full plasmid editor. 4-6 instruments. ~30 cards. Goal: validate the digital experience and the educational integration.

**Milestone 2 — Tutorial campaign (4-6 weeks):** All onboarding scenarios. Polish the new-player experience.

**Milestone 3 — Additional scenarios (8-12 weeks):** Viral and bacterial scenarios. Demonstrates engine range.

**Milestone 4 — Online async multiplayer (4-8 weeks):** Server infrastructure, matchmaking, async turn notifications.

**Milestone 5 — Polish and launch:** Art polish, balance pass, marketing.

## Risks

**Highest risk: balance of asymmetric scenarios.** Asymmetric two-player games are historically very hard to balance. This is the primary production risk and warrants the most playtesting investment.

**Second risk: educational integration.** The design intends biology to be taught through play. If players can play well without learning the biology, the educational mission fails. The tutorial campaign is the critical defense against this risk and should be designed with explicit learning checkpoints.

**Third risk: onboarding cliff.** Two-player turn-based strategy with card-driven economy and a plasmid editor has a steep learning curve. The tutorial campaign must succeed at smoothing this; a hard onboarding will collapse retention.

**Fourth risk: scope.** Three scenarios, ~30 cards, 8 instruments, plasmid editor, AI opponent, multiplayer infrastructure, tutorial campaign. This is substantial. Cutting to one scenario for initial launch is a reasonable contingency.

## Out of scope for v1

- Real-time multiplayer
- Player-designed scenarios or custom cards
- Cross-platform progression
- Advanced AI capable of high-level competitive play
- Persistent player progression beyond unlocked scenarios
- Spectator mode, replays, tournament infrastructure

---

That's the PRD. It's enough to brief Claude Design on the concept, the visual direction, the scenario framework, and the milestone structure. The ten open questions in the middle section are the ones I'd push you hard to resolve through paper prototyping before any significant digital build begins. If you skip the paper prototype, hand Claude Design this document with the open questions clearly flagged so they propose options rather than inventing answers.