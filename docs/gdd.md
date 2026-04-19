# Cell Lab — Prototype GDD

## Core Pitch
A puzzle game where the player engineers yeast cells to do specific things (glow, sense chemicals, produce molecules) by composing real biological parts. The player learns molecular biology — what genes, promoters, and regulatory elements actually do — by seeing them work or fail in a faithful cellular simulation. Witness-shaped: small rule set, compositional difficulty, no hidden information, no gotchas.

## Educational Goal
Player comes out understanding (a) the central dogma at an intuitive level (DNA → RNA → protein → function), (b) what real regulatory elements do (promoters, operators, terminators), and (c) what a handful of core instruments measure and why you'd reach for them. Vocabulary lands by repeated use in context, not by being told.

## The Anti-Logic-Gate Principle
**The single most important design rule.** Every "switch" or "wiring" in the game must be rendered as the *real biological mechanism*, not as an abstract logic symbol. A sugar-responsive promoter is shown as an actual promoter sequence with a binding site for a sugar-sensing transcription factor — not as a box labeled "IF sugar." When the player wires a switch to a gene, they're placing a real promoter upstream of a real coding sequence on a visible DNA strand. The simulation animates transcription and translation happening on that strand. If the player couldn't tell the difference between this game and a generic logic-gate puzzle game, we've failed. The biology has to be *visibly load-bearing* in every interaction.

Practically: the main play surface is a DNA strand the player edits. Parts snap onto it in order (promoter → gene → terminator). The cell around it shows the consequences (proteins being made, glowing, dying). Instruments are tools the player runs on the cell to measure things they can't see directly.

## Core Loop
1. Player sees a goal ("make the cell glow when sugar is present")
2. Player edits a DNA strand by dragging biological parts onto it
3. Player runs the cell — animated simulation shows transcription, translation, and the cell's behavior
4. If the result is wrong, player reasons about why using rules they've learned, possibly running an instrument to gather evidence
5. Player iterates the design until the goal is met
6. Next puzzle introduces a new constraint or composition

## Rules Taught in Order

Each puzzle teaches one new rule. After being taught, the rule is *load-bearing in every later puzzle*.

### Phase 1 — Core Mechanics (Puzzles 1–5)

- **Puzzle 1: "Hello, Cell!"** — Place a glow gene on a DNA strand with a promoter. Cell glows. Teaches: **DNA → protein → function. Promoters drive expression.**
- **Puzzle 2: "Sugar Switch"** — Make the cell glow only when sugar is present. Player swaps the constitutive promoter for a sugar-responsive one. Teaches: **different promoters respond to different signals.**
- **Puzzle 3: "Brighter!"** — Make the cell glow with high intensity. Player can add more copies of the gene OR use a stronger promoter. Both work. Teaches: **expression level is controllable.**
- **Puzzle 4: "Dual Color"** — Glow green and red simultaneously. Player learns each gene needs its own promoter (or they share one and co-express). Teaches: **multi-gene constructs.**
- **Puzzle 5: "Exclusive Switch"** — Green when sugar, red when toxin, never both at once. Player uses a repressor gene that blocks the toxin promoter when expressed. Teaches: **regulation is bidirectional — one signal can activate AND repress.**

### Phase 2 — Regulatory Logic (Puzzles 6–8)

- **Puzzle 6: "Inverted"** — Glow when sugar is ABSENT. Introduces a *repressible promoter* (constitutive, but silenced by the RepA protein). Player wires: sugar-promoter → repressor → TERM → repressible-promoter → GFP → TERM. Sugar drives the repressor, which silences the promoter that would otherwise drive GFP. Teaches: **signal inversion through repression** — one of the most fundamental regulatory motifs.
- **Puzzle 7: "Double Switch"** — Green when sugar present, red when sugar absent. Combines direct activation with inverted repression on the same strand. Teaches: **complementary gene expression from a single signal** — how real cells make binary fate decisions.
- **Puzzle 8: "Both Required"** — Glow only when BOTH sugar AND toxin are present. Introduces split GFP (N-terminal and C-terminal halves). Each half expressed from a different signal-responsive promoter. Only when both halves are present does fluorescence occur. Teaches: **protein complementation as a biological AND gate** — function requires correct molecular assembly, not just expression.

### Phase 3 — Signal Networks (Puzzles 9–11)

- **Puzzle 9: "Activator"** — Introduce an activator gene (ACT) whose protein product (ActA) activates an activator-responsive promoter (ACTR). Player builds a signal relay: CMV → ACT → TERM → ACTR → GFP → TERM. Teaches: **signal transduction and gene regulatory networks.**
- **Puzzle 10: "Amplifier"** — Use a cascade to amplify a weak signal into strong expression. A weak sugar promoter (wGAL, strength 1) drives an activator that turns on a strong activator-responsive promoter (ACTR, strength 3). Only 6 slots — direct approach maxes at GFP 5, cascade achieves 6. Teaches: **biological signal amplification — cascade is mechanically forced, not optional.**
- **Puzzle 11: "NOR Gate"** — Glow only when NEITHER sugar NOR toxin is present. Uses two independent repressor circuits (GAL1 → REP, TOX2 → REP) both feeding into a repressible promoter driving GFP. Introduces TOX2 (a clean toxin promoter without repressedBy, avoiding oscillation). 9 slots, 4 test conditions. Teaches: **combining multiple regulatory inputs into complex logic.**

### Phase 4 — Instruments (Puzzles 12–13)

- **Puzzle 12: "Hidden Product"** — First puzzle where the output is invisible. Goal: make the cell produce insulin when sugar is present. Insulin doesn't glow — player must use the Protein Detector (antibody probes) to verify their design. Budget of 3 probes, 5 possible antibodies. Teaches: **instruments answer questions about invisible things.**
- **Puzzle 13: "Mystery Cell"** — Diagnostic puzzle — given a pre-built construct with hidden gene labels (shown as "???"), use limited probes to determine what it produces. Strand is read-only, prefilled with CMV → INS → TERM → CMV → REP → TERM. Player must identify Insulin and RepA. Reverses the design challenge into analysis. Teaches: **experimental reasoning and hypothesis testing.**

## Anti-Brute-Force Mechanism
Puzzles are templates with 2-4 randomized variants. The puzzle's *shape* is the same each playthrough; the *specific parameters* (which signal molecule, which output, which constraint) shuffle. A player who memorizes "the answer to puzzle 5" finds the answer doesn't work on replay because the variant changed. A player who learned the *reasoning* (use a repressor to make signals exclusive) succeeds on every variant. This is cheap to author — one puzzle template yields multiple replay-resistant instances.

## Instruments
Instruments are introduced when the player needs to see something they can't see directly. Each instrument *answers a specific question*:
- **Protein Detector (implemented):** Uses antibody probes (anti-GFP, anti-RFP, anti-Insulin, anti-RepA, anti-ActA) to test whether a specific protein is present in any simulation test condition. Probing a protein reveals all test results that reference that protein. Budget-limited (e.g., 3 probes per puzzle). Forces the player to hypothesize before probing.
- **Western blot (future):** Quantitative — how much of this protein? Could replace or extend the Protein Detector for puzzles requiring expression-level reasoning.
- **Growth curve (future):** Are the cells alive and dividing? (introduced when toxicity becomes a possible failure mode)
- **Microscope with fluorescent tag (future):** Where in the cell is this protein? (introduced when location matters)
- **Time-course measurement (future):** Is the protein being made and then degraded? (introduced when degradation becomes possible)

Instruments have a budget (e.g., 3 probes per puzzle attempt). The player has to pick which question to ask first. This forces diagnostic reasoning, which is the second skill the game teaches alongside design.

## What's Built

The prototype includes:
- One play surface: a DNA strand the player can drag parts onto (HTML5 drag-and-drop)
- 16 biological parts: constitutive/signal-responsive/repressible/activator-responsive promoters (including weak variant), fluorescent genes (GFP, RFP, split GFP halves), repressor, activator, insulin, terminator
- A cell visualization: Phaser 4 canvas showing a yeast cell with glow color/intensity based on expression, animated transcription scan
- 13 puzzles spanning 4 phases (core mechanics → regulatory logic → signal networks → instruments)
- Protein Detector instrument with antibody probes and budget system
- Read-only prefilled strands with hidden gene labels for diagnostic puzzles
- Rules-based simulation engine with convergence loop supporting repression, activation, split protein complementation, and multi-pass signal cascades

### Transcription Animation
When the player presses "Run Cell," a scan highlight moves left-to-right across the DNA strand slots before showing results. This makes the transcription mechanism *visible* — the player sees the cell "reading" their DNA. Active promoters glow their signal color; genes under active promoters light up; terminators reset. After the scan completes, the cell shows its result. This is not cosmetic — it's the primary teaching tool for reading order and the promoter→gene→terminator grammar.

## Tech
Whatever you have. The simulation can be rules-based, not physics-based: "if promoter X is upstream of gene Y and signal Z is present, gene Y expresses." A small lookup table is fine for the prototype. The visual cell can be a sprite that changes color and animates simply.

## What NOT to Build Yet
- Procedural puzzle variants (anti-brute-force randomization)
- Budget/economy beyond instrument probe counts
- Additional instruments (western blot, growth curve, microscope, time-course)
- Anything that abstracts the DNA strand into a logic diagram. The DNA strand is the play surface. Non-negotiable.

## Validation Test
After building, play puzzles 1-5 yourself. Then have one other person who knows nothing about biology play them. Watch where they get stuck, watch what they say out loud, watch whether they're curious about what the parts do or just mashing buttons. The signal you're looking for: do they spontaneously try things you didn't program a tutorial for? That's the sign the simulation is teaching them something. If they only do exactly what the on-screen prompts say, the simulation isn't speaking to them yet.

## Additional Ideas
- Player receives new entries in their Reference book as they play and complete levels, not always in order. They might need to skip to a different level to finish it before they're awarded with the reference material, or even instruments/parts, needed to complete the puzzle in this level.
- Puzzles where the player needs to search the reference book for something, but purely based off the description. Like, needing to make an anti-venom, so first finding the gene/protein to sequence and then doing a 3d puzzle with the synthesized protein to find something that will bind.