# Cytosis — Authoritative Design Document v1.0

**Status: This is the single source of truth.** It supersedes the v0.1 PRD, the system taxonomy doc, and the foundational systems spec. Where those documents disagreed, this document picks one answer. Where they left questions open, this document closes them. Codex and any designer should build against this and nothing else. If something here needs to change, change it *here* and re-issue, rather than deciding ad hoc in a build pass.

The cardinal rule that explains every decision below: **plasmid design is the heart of the game.** Every system either feeds the plasmid loop (gives the player parts, or a reason to engineer), creates a reason to investigate (so engineering has a target), or gives engineering an edge over brute force. If a proposed feature does none of those three, it does not belong.

---

## 1. What the game is

Cytosis is an asymmetric, turn-based, hidden-information strategy game. One player advances a pathology (cancer is the flagship and only fully-built scenario for now); the other plays the body's defenses. They share a tissue grid. The pathology player hides and adapts; the immune player investigates, identifies, and engineers cells to counter what they find. The contest is a cat-and-mouse of concealment versus discovery, resolved through engineered cell behavior.

Educational goals, in priority order: (1) plasmid design as creative engineering, (2) biotech instruments learned by need, (3) cancer pathology learned by watching it happen. Fun comes first; the biology is taught as a *consequence* of well-designed systems, never through text walls or a codex.

---

## 2. The canonical taxonomy — what exists where

This is the category split that must never blur again. Every game object is exactly one of these.

**Cards in hand** are only two kinds:
- **Instruments** — reusable investigation tools (microscope, antigen scan, PCR, ELISA, etc.). They reveal board state. They are not consumed on use; they cost an action.
- **Deployable plasmids** — constructs the player authored in the editor. Playing one deploys an engineered behavior to a target cell or region. Consumed on deployment plus costs an action and a vector.

There are **no standalone attack cards.** Killing, evasion, invasion, proliferation, and infection are *cell behaviors* that happen during resolution — either from weak innate biology or from a deployed plasmid. "Cytotoxic burst" as a draw-and-win card is gone for good.

**Parts** are not cards. They are limited inventory ingredients used only inside the plasmid editor. They are collected from debris and investigation (see Economy). The promoter part includes its trigger condition (a hypoxia promoter is the "sensor" for hypoxia — there is no separate sensor category).

**Tile states** are board properties, never cards: hypoxia, inflammation, damage, matrix openness. A tile state only exists in the build if it changes a decision.

**Cell behaviors** happen during the resolution phase. Cells have health, attack, and movement. They execute innate behavior or their deployed plasmid program. The player's agency is in investigation, plasmid design, deployment, and choosing targets/regions — not in puppeteering individual cells.

---

## 3. The cell stat model (the foundational primitive)

Every cell is an entity with numeric stats that all other systems read and modify. This is the substrate; it must exist before combat, movement, tile effects, or plasmid behavior can mean anything.

A `Cell` has: id; owner (immune | pathology | neutral); kind (macrophage, tcell, tumor, healthy); health (current) and maxHealth; attack (damage per resolution beat to one valid target); movement (tiles per resolution); position; markers (array of marker ids it expresses); identityState (unknown | morphology_seen | markers_seen | confirmed); plasmid (deployed program or null).

Combat: an attacking cell subtracts its `attack` from a valid target's `health`. Health ≤ 0 kills the cell; it is removed and leaves debris on its tile. Movement: a cell moves up to `movement` tiles toward its objective per resolution beat.

Baseline starting stats (provisional, tune in playtest): macrophage health 3 / attack 1 / movement 1; T cell health 2 / attack 1 / movement 2 but no useful innate targeting (must be programmed); tumor health 4 / attack 0 / movement 0 (tumors proliferate rather than attack); healthy cell health 2 / attack 0 / movement 0.

---

## 4. Innate behavior (the early-game floor)

Cells act autonomously each resolution so the board is self-driving with zero plasmids deployed and the early game is never empty. This is what lets us have no standalone attack cards.

- **Macrophage:** if adjacent to a *confirmed* tumor cell, move to it and attack. Otherwise patrol toward nearest unexplored/vessel tile. Macrophages can ONLY attack confirmed targets — never unknown or merely morphology-seen cells. This is the rule that makes investigation mechanically necessary.
- **T cell:** does nothing useful innately; must be given a targeting plasmid. This is a built-in reason to use the editor.
- **Tumor:** chance each resolution to divide into an adjacent empty tile. New tumor cells start `unknown` with the scenario's default tumor marker.
- **Healthy:** mostly stationary; may slowly repair adjacent organ damage.

Acceptance: a match with zero plasmids and only "end turn" still progresses to organ failure on its own; a macrophage attacks a confirmed tumor but ignores an unknown cell.

---

## 5. Identity, investigation, and why you don't dump your hand

Every non-player cell starts `unknown` — an ambiguous silhouette; you cannot tell tumor from healthy. Instruments advance identity along different axes and each shows a *different on-board result*:

- **Microscope** (cheap, 1 action): → `morphology_seen`. Reveals SHAPE. Smooth/round reads as probably-healthy; lumpy/dark/dividing reads as suspicious. A hint, not a target. No markers, no confirmation.
- **Antigen scan** (1 action): → `markers_seen`. Reveals surface MARKERS (marker dots on the cell). Tells you whether a marker-targeting plasmid will bind. Defeated by evasion (a suspicious cell may show no markers).
- **PCR** (1 action, requires target already `morphology_seen` or a debris tile): → `confirmed`. Confirms tumor-vs-healthy GENOTYPE regardless of surface markers. Ground truth. This is what lets innate macrophages attack and what makes safe targeting possible.

The **sequencing dependency is the core hand-management mechanic.** PCR is gated on having looked first, so you can't blindly confirm everything — you triage with the cheap microscope, then spend the more valuable PCR only on cells that looked wrong. That is the reason to hold a card instead of dumping your whole hand turn one. Combined with the 3-action cap (Section 11), you cannot play a full hand in a turn anyway.

Each instrument produces a visibly distinct result (shape vs marker-dots vs confirmation badge), which is also how the player learns what each instrument measures without text.

---

## 6. Markers (the targeting layer, kept small)

Each scenario defines a small fixed set of possible markers — for cancer, 3-4 total (e.g. tumor_marker_A, tumor_marker_B, self_marker, evasion_marker). Markers are cell properties, not cards and not inventory parts. Antigen scan reveals which a cell carries.

Plasmids reference markers abstractly: a "tumor-marker-responsive promoter" fires against whatever tumor marker is in play this match. The player builds "respond to confirmed tumor marker," not a specific id. This keeps the part library tiny while supporting per-match variation, and it answers the worry about needing one part per biomarker — you never do.

---

## 7. The economy (where parts come from)

This is the loop that gives the editor a reason to exist and prevents plasmid spam. It is grounded in real biology: cells get genetic material from the environment (cell-free DNA/RNA released on lysis) and from sampling.

- When any cell dies, its tile gains **debris** (free genetic material).
- Running an instrument on a debris tile **extracts a typed part** into a visible **inventory** (PCR on debris → a gene part; other instruments → other part types). Confirming a living cell may also yield a part.
- The inventory is a small tray, organized by part category, showing held parts and counts.
- Building a plasmid **consumes** the parts used. You cannot build with parts you don't hold.
- Deploying a plasmid consumes a **vector** (slowly regenerating) plus an action.

This closes the loop: investigate → collect parts → engineer plasmid → deploy → cells execute. Investigation is required (it's the only source of parts), the editor is the power source, and plasmids can't be spammed because parts and vectors are finite.

---

## 8. The plasmid editor (the heart) and why design is fun

**Grammar, collapsed to the minimum that's biologically honest:**

`promoter → [optional logic + second promoter] → gene → [optional control] → terminator`

- **Promoter** includes the trigger condition (always-on, hypoxia-responsive, stress-responsive, tumor-marker-responsive). The promoter IS the sensor. There is no separate sensor category.
- **Gene/payload:** what it does (cytotoxic-against-target, recruitment signal, CD47 silencer, marker restorer, decoy shedder, apoptosis payload, matrix protease, etc.).
- **Terminator:** ends the construct.
- **Logic** (AND/OR/NOT): optional, advanced, hidden until unlocked. Combines two promoters for multi-condition triggers. Never shown to new players.
- **Control** (degradation/timing): optional.

**Editor UX:** opens showing only promoter/gene/terminator categories with a left-column category selector. Click a category, see only that category's parts, and within it only parts you hold in inventory (others locked with "discover via instruments"). Construct assembles on the right with a live valid/invalid parse badge and a one-line plain-language behavior summary. Logic and control categories appear only after unlock. Never show 20 flat parts.

**The goal-anchoring fix — this is what made cell-lab fun and what's been missing.** The current sandbox-with-no-prompt is paralyzing. When the player opens the editor in the context of a confirmed board situation, show a **build-target prompt** derived from actual board state, e.g. "This tumor is hiding from your cells — build something that forces a marker or kills it directly," or "Your cells are weak in this low-oxygen cluster — build something that works in hypoxia." The investigation produces the prompt; the editor solves it. This turns the open-ended editor into the constraint-satisfaction puzzle that made cell-lab engaging, while keeping it integrated with the board.

**Deployment & expression:** deploying targets a cell or region; the plasmid takes 1-2 resolution beats to express (a vulnerability window). A cell expresses one plasmid at a time; new deployments replace old after the window. Expression persists through division with some probability of loss. Deployed plasmids visibly change the target cell's behavior on the board — that visible change is how the player confirms their design works.

---

## 9. Pathology mechanics (cancer), each a visible verb

Cancer is taught by watching its mechanisms happen, each with a recognizable visual signature, each as a pathology-player plasmid or innate behavior:

- **Proliferation** (innate): tumor cells divide into adjacent tiles; local crowding and organ pressure rise.
- **Angiogenesis:** vessels visibly grow toward the tumor cluster, feeding it. Begins *early* (correcting the earlier mistake of treating it as late-game) — a small tumor induces local vessels to grow beyond its initial nutrient limit.
- **Immune evasion** (flagship hidden-info mechanic): an affected tumor cell reads as *suspicious under microscope* but shows *no targetable marker under antigen scan*, while PCR still confirms it's a tumor. This forces the central dilemma — you know it's malignant but can't cleanly target it. The answer is to engineer a marker-restorer plasmid (force re-expression) or a genotype-confirmed kill. Variants: marker loss, MHC suppression, antigen drift (marker changes over time, invalidating stale intel).
- **Invasion:** matrix tiles visibly degrade into passable tiles; tumor gains movement routes.
- **Metastasis:** a tumor cell enters a vessel and re-emerges several tiles away, creating a new hidden threat region.
- **Microenvironment shaping:** the tumor produces hypoxia/acidity in surrounding tiles, creating immune-suppressed sanctuaries (see tile states).

**Stages map to phases (Section 12):** localized → regional → systemic, mirroring real cancer staging.

---

## 10. Tile states (consequence before visual)

A tile state is built only after its decision-changing consequence is defined. The first and currently only fully-specified one:

- **Hypoxia:** immune cells on hypoxic tiles have reduced attack and movement (e.g. halved). Tumor cells are unaffected. Hypoxic regions become tumor sanctuaries the immune player must avoid or re-oxygenate. This now has a substrate to act on because cells have attack/movement stats. Rendered with a clear blue tint — but only because it now matters.

Acidity, inflammation, matrix openness, and damage are defined the same way later: specify the decision each changes, then build and render it. Do not render tile states that don't yet change a decision.

---

## 11. Action economy, turns, and resolution (locked answers to former open questions)

- **Actions per turn: 3, generic** (any action — draw, run instrument, open editor, deploy — costs from the same pool of 3). Locked. This is the constraint that makes "what do I spend my 3 on" the core turn decision.
- **Drawing costs 1 action.** You choose where to sample; location biases what part/instrument you might draw (biased-random).
- **Hand size cap: 8.** Locked (was 7-10 open).
- **Telegraphed plays: kept.** When you commit a plasmid deployment or a charging instrument, its *category* (not its exact target/payload) becomes visible to the opponent for its charge time (1-2 beats), creating the bluff layer. This was in the original PRD, got stripped during simplification, and is hereby restored as a v1 mechanic — it is the central hidden-information tension and the design is weaker without it.
- **Resolution is a slow, narrated, sequential phase.** Between turns, each committed action and each cell behavior plays out one at a time: dim everything except the acting cell/tile, show a clear color-framed label of which side is acting (immune blue / pathology red), animate the single action over ~1.5s, pause, advance. The player watches a readable film of consequences, not a blink-and-miss state delta. This is also where biology teaching lands, so it must be legible.

---

## 12. Phase, derived from visible state (no info leak)

Phase is computed purely from already-visible board metrics, so showing it leaks nothing hidden and it teaches cancer staging:
- **Initiation:** few confirmed tumor cells, low organ damage.
- **Progression:** tumor count/spread above threshold, or organ damage rising.
- **Resolution:** near a win/loss threshold for either side.

Shown with a one-word label and a plain-language hover ("Early — small localized tumor"). Derived from revealed tumor count and organ damage only.

---

## 13. Win/loss and scoring (locked, and must be legible)

- **Immune wins (remission):** confirmed tumor cell count held below a threshold for N consecutive rounds (not instant extermination — sustained control). Provisional: below 10% of peak tumor population for 3 rounds.
- **Pathology wins (organ failure):** cumulative organ damage across organ tiles reaches the failure threshold. Provisional: 12 damage across organs.
- **Causation must be visible.** Every point of organ damage and remission progress logs its source tile. Tiles contributing to organ failure show a pulsing warning marker; hovering a progress bar highlights the exact contributing tiles with connecting tethers. The bar is a summary of a story the board is already telling. The round-2-mystery-fill bug traces to scoring that wasn't sourced — every score change must name its cause.
- **Autoimmune damage** is the immune player's core constraint: attacking an unconfirmed cell that turns out healthy raises inflammation, damages organ tiles, and subtracts from remission. This is *why* investigation matters and why the marker-confirmation rule exists.

---

## 14. The board (locked)

- **Grid: 8 columns × 6 rows** for the default cancer scenario. Locked (was 15-20 open). Small enough that every tile matters and the whole strategic state is visible at once; this is Mini Metro, not Civilization.
- **Tile types** are visually distinct via BioRender-style art, no text labels on tiles: matrix (fibrous mesh), vessel (blood-vessel texture), organ (soft tissue mass, accumulates damage), lymph (node structure, immune recruitment point). Fogged tiles are clearly differentiated (heavier haze, desaturated) from revealed-but-empty tiles.
- **Organs** sit beneath the cell layer; cells move freely over them; they accumulate damage and are the pathology player's target.
- **Lymph nodes** are immune recruitment points; threatening them weakens immune tempo.

---

## 15. Visual language (lock to BioRender)

The BioRender art pipeline is the primary teaching tool and must be shown off. Cells are rendered illustrations, not dots — a healthy cell looks visibly different from a lumpy tumor cell; a macrophage looks like a macrophage; instrument cards show their real illustration (microscope, thermocycler). This teaches morphology and identity with zero jargon. Plasmid expression shows as a colored aura/behavior change on the cell. Telegraphed plays show as floating category icons with a countdown. UI restraint throughout: board is the focus, cards in a bottom tray (with hover-zoom and responsive layout for large hands on small screens), 3-actions/round/phase grouped near the End button so turn-flow reads as one unit.

---

## 16. Onboarding (the step that keeps getting skipped)

Two things, in order:

**First: a paper or minimal-digital validation of the core contest before further polish.** The original PRD's Milestone 0 — validate that investigate → engineer → deploy → counter is *fun* — was never done, which is why foundational questions kept resurfacing. Before building more systems on top, confirm the loop is fun at minimal scale (one confirmed-tumor dilemma, one evasion mechanic, one plasmid that solves it, hypoxia as the one tile effect). If that core isn't fun, no amount of additional systems fixes it.

**Then: a constrained tutorial campaign** that introduces verbs through scarcity. Scenario 0a: one cell, one threat, one plasmid that solves it, no opponent. 0b: two threats, two parts, choose. 0c: one instrument, required to identify. 0d: first AI opponent, telegraphed plays. New players start with a tiny hand and tiny part library; both grow as scenarios introduce one or two new pieces at a time. No codex; single-line hovers and an optional "what is this?" inspect for vocabulary.

---

## 17. Scope discipline for v1

Cancer scenario only, fully built and balanced, before viral or bacterial. Viral exists as a stub but is explicitly deferred — do not invest in it until cancer's loop is fun and balanced. Local pass-and-play and a scripted/heuristic AI for single-player; no real-time multiplayer, no advanced AI, no player-made content in v1.

---

## 18. Implementation order (dependency chain — do not reorder)

Each step has an acceptance test; pass it before the next. Report a failing test rather than working around it. This ordering exists because past passes built effects before the primitives they act on, leaving features floating.

1. **Cell stats** (health/attack/movement) — substrate for everything. *Test: a 3-health cell dies in exactly three 1-damage hits; a 1-movement cell moves exactly one tile/beat; dying cells leave debris.*
2. **Innate behavior** — needs stats; makes the board self-driving and removes the need for attack cards. *Test: zero-plasmid match still reaches organ failure; macrophage attacks a confirmed tumor, ignores an unknown cell.*
3. **Identity states + sequential investigation** — needs the confirmed-target rule; makes instruments distinct and hand-management real. *Test: all non-player cells start as identical unknown silhouettes; microscope/antigen/PCR each produce a visibly different result; PCR cannot target an unknown cell; a 5-card hand can't be fully played in a 3-action turn.*
4. **Markers** — needs identity; the targeting layer. *Test: scenario loads with 3-4 markers; antigen scan reveals which a cell carries; a tumor-marker-responsive plasmid works against the match's marker without the player picking an id.*
5. **Parts economy from debris** — needs cell death and investigation; feeds the editor. *Test: killing a cell leaves debris; an instrument on debris adds a typed part to a visible inventory; the editor only allows building with held parts and decrements them on creation.*
6. **Simplified grammar + goal-anchored editor** — needs parts and markers; makes design fun. *Test: editor shows only promoter/gene/terminator (logic hidden) with category navigation and inventory-gated parts; opening it in a confirmed board context shows a build-target prompt derived from real board state; valid/invalid parse works; creation consumes parts.*
7. **Evasion mechanic** — needs markers + editor; creates the central dilemma. *Test: an evasive tumor reads suspicious under microscope, shows no marker under antigen scan, confirms as tumor under PCR; a marker-restorer plasmid then enables a clean kill.*
8. **Hypoxia on stats** — needs attack/movement. *Test: an immune cell's effective attack/movement drop on a hypoxic tile and restore off it; a tumor in hypoxia is measurably harder to clear.*
9. **Telegraphed plays + narrated resolution** — the hidden-info and legibility layer. *Test: committing a deployment shows its category to the opponent for its charge time without revealing exact target; resolution plays one labeled, color-framed beat at a time, readably.*
10. **Causation-visible scoring + phase from visible state** — legibility, last. *Test: every score change logs a source tile and is highlightable from the bar; phase changes only from visible metrics.*

---

## 19. The locked answers to the original ten open questions

For the record, so they are never re-debated:

1. **Action economy:** 3 generic actions per turn, sequential commit, slow narrated resolution.
2. **Card resolution timing:** charge times in beats (1-2); resolution sequential and narrated, not simultaneous.
3. **Plasmid-to-behavior mapping:** plasmid sets the cell's resolution behavior (trigger from promoter, effect from gene); takes 1-2 beats to express.
4. **Grid and counts:** 8×6; ~15-25 cells, mostly healthy, a few hidden tumors.
5. **Instrument economy:** instruments are reusable cards costing an action, not single-use consumables.
6. **Hand cap and draw:** cap 8; drawing costs an action; biased-random by sample location.
7. **Comeback:** losing pathology player accrues selection pressure that unlocks evasion/mutation options tied to choices (not auto rubber-band); deferred to post-core-validation tuning.
8. **Debris info leak:** dead cells leave debris; sampling debris yields parts and can reveal what plasmid the cell ran.
9. **Organ failure dynamics:** cumulative damage to a threshold (provisional 12), partial damage visible per-organ tile.
10. **Autoimmune damage:** attacking unconfirmed cells that prove healthy raises inflammation, damages organs, subtracts from remission — the immune player's core constraint.

---

## 20. The one rule that prevents the next oscillation

Before building any feature, check it against the cardinal rule: does it feed the plasmid loop, create a reason to investigate, or give engineering an edge over brute force? If not, it doesn't get built. And before adding any new system, confirm the primitives it acts on already exist (per the dependency chain). Effects before primitives is the failure pattern that caused most of the rework; this document exists to stop it.