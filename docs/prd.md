# Cell Lab — Full PRD

---

## The One-Sentence Pitch

A disease-repair simulator where players diagnose broken cells using real biotech instruments, fix the underlying genetic cause, and watch the mechanism visibly recover — structured like Car Mechanic Simulator, reasoned like Case of the Golden Idol.

---

## What This Game Is

You receive a patient with a cellular disease. The disease has a genetic cause. You have a bench full of instruments and a plasmid editor. You use instruments to figure out what's broken, you fix the plasmid, you use instruments to verify the fix, and you watch the cell recover. That's the whole game. Every case is a variation on that loop at increasing complexity.

The educational payload is embedded in the loop: you cannot diagnose without understanding what each instrument reveals, and you cannot fix without understanding what each plasmid element does. The game never teaches these things directly. You learn them by needing them.

---

## Why This Works: The Reasoning

**The read/write loop is the natural shape of the domain.** Real molecular biology is exactly this — instruments tell you what's happening in a cell, genetic tools let you change what's happening, instruments confirm the change worked. Every other educational framing we tried (factory game, deckbuilder, Strange Horticulture clone, walking scientist) imposed an external game structure onto the domain. This one uses the domain's own structure as the game.

**Disease framing solves every motivation problem.** "Make this cell glow" has no stakes. "This patient's cells are destroying themselves because of a frameshift mutation in TYR" has immediate human stakes. The transformation from broken to fixed is emotionally legible. The patient vitality score going from 38/100 to 84/100 is the dyno test, the benchmark, the moment everything you did gets evaluated. This is what CMS has that pure puzzle games don't.

**Instruments as evidence, not procedures.** The failure mode of every previous prototype was treating instruments as steps to execute. The correct framing: instruments answer questions. The gel answers "how big is this fragment." The sequencer answers "what is this sequence." The ELISA answers "how much of this protein is present." The player's job is to figure out which question to ask next given what they already know — which is Case of the Golden Idol's deduction loop applied to biology.

**One simulation engine connecting both sides.** Currently plasmid design and instruments are two disconnected systems. They need to be one. The plasmid defines the cell's complete state. Every instrument reads from that same state. Change the plasmid, every instrument readout changes. This is what makes it feel like one game instead of two minigames stapled together. It's also what makes the fix feel real — when you correct the frameshift and run the gel again, the band is in the right place because the simulation updated, not because the game scripted a success state.

**Papers Please UI, not walking scientist.** Three months of prototyping already proved that physical transportation is busywork. The desk-based UI where instruments are panels and samples are draggable cards is correct. The problem isn't the UI structure, it's that individual instrument interactions currently feel like form submission. The fix is not more physicality — it's one real decision per instrument with immediate visible feedback.

---

## The Simulation Engine

This is the foundation everything else builds on. Get this right first.

**The cell state is derived entirely from the plasmid.** Given a plasmid definition (ordered list of parts with properties), the engine computes: which proteins are expressed, at what levels, in which conditions, with which modifications. This is rules-based, not physics-based. Fast, deterministic, inspectable.

**Every instrument reads from cell state.** The gel doesn't run a separate simulation — it reads the protein/DNA sizes the engine already computed and renders them as band positions. The ELISA reads the protein concentration the engine computed and renders it as color intensity. The sequencer reads the DNA sequence the engine computed and renders it as a chromatogram. One source of truth, multiple readout formats.

**Cell state drives the visualization.** The cell view is not a separate animation system. It reads the same engine output: protein localization determines where particles appear, expression levels determine particle density and speed, disease phenotype (aggregates, membrane damage, metabolic failure) is derived from what the engine computes is going wrong. Fix the plasmid, the engine recomputes, the visualization updates, the instruments update. Everything changes together because everything reads from one place.

**Disease states are engine-computed, not scripted.** Each disease case defines: the wild-type (correct) plasmid, the mutant (broken) plasmid, and the phenotype rules that derive from the difference. The engine computes what's wrong from the plasmid definition, not from a hardcoded "sick cell" animation. This means procedural case generation is possible later — combine any mutation type with any gene with any phenotype rule and get a valid case.

---

## The Core Loop In Detail

**Case briefing.** Player receives a patient file: name, symptoms in plain English, cell type affected, severity. One paragraph maximum. Stakes are human and immediate. The cell view shows the current state — visibly wrong in a specific way that corresponds to the disease mechanism. Misfold aggregates cluster in the cytoplasm. The membrane is dim and sluggish. Particle production is sparse.

**Open investigation.** Player has a full bench. All instruments are available. No predetermined sequence of steps. Each instrument requires valid inputs to run — you cannot run a gel without something to load, you cannot sequence without an amplified product. The input requirements are the puzzle structure. Player builds up evidence on the workspace as draggable result cards.

**Diagnosis.** Player identifies what's broken using instrument evidence. The answer is not multiple choice from a list. The answer emerges from evidence — the gel shows a band at the wrong size, the sequencer shows an insertion at position 127, the player concludes: frameshift mutation in TYR gene. This is the CotGI word-bank mechanic: the vocabulary of the answer is unlocked by the evidence collected, not available upfront.

**Fix.** Player opens the plasmid editor. The broken element is visible (flagged, but not automatically fixed — the player has to make the correct edit). Player drags the correct wild-type gene into the slot. The engine recomputes. The right side of the split view updates to show the predicted healthy state.

**Verify.** Player runs at least one instrument on the fixed design to confirm. The gel now shows a band at the correct position. The protein detector shows the correct protein at the correct level. This step is required — the game does not accept a plasmid edit as the final answer, only an instrument-verified plasmid edit. This is the step that teaches "how do you know your fix worked" which is real science.

**Treatment.** Player applies the fixed construct. The cell view runs the mechanism visibly: RNA polymerase traverses the corrected strand, mRNA is produced, ribosomes translate it, the correct protein appears, the disease phenotype resolves. The aggregates clear. The membrane brightens. Particle production increases. Patient vitality ticks from 38 to 84. This is the dyno test moment. This is CMS's engine turning over.

---

## Instrument Design

Each instrument has: one real decision, one immediate visible output, zero form-filling.

**Gel electrophoresis.** Player loads sample tubes into lane slots by dragging. Clicks Run. Bands migrate in real time — player can see them moving. Budget: lane count limited per case. The decision is which samples to load in which order given limited lanes. The output is a band pattern the player reads against the ladder to determine fragment sizes. This is already the closest to working in the current prototype.

**PCR.** Player selects a primer pair from the reference book. No temperature parameters, no cycle counts — those are fixed and automatic. The decision is primer selection: which region of the DNA to amplify. Wrong primers produce no band or the wrong band. Right primers produce the amplicon you need for downstream steps. The reference book shows primer targets as sequence positions, not abstract names, so the player has to reason about which region is relevant.

**Sequencer.** First encounter: player manually aligns overlapping reads as blocks (not individual nucleotides). Block-level alignment, not character-level — the player sees overlap regions highlighted and snaps blocks together by logic, not by scanning 75 characters. After completing the first manual alignment, the player unlocks the alignment algorithm as a permanent upgrade. Future sequencing runs are auto-aligned; the player's job shifts to interpreting the assembled sequence, not producing it.

**Restriction digest.** Player selects an enzyme from the reference book. The decision is which enzyme is *informative* for distinguishing between candidate genes — some cut everywhere (useless smear), some don't cut at all (single band, no information), the right enzyme produces a pattern that discriminates between candidates. Bad enzyme choices give immediate feedback: "no cut detected" or "too many fragments to resolve." Good enzyme choice gives a clean discriminating pattern.

**ELISA.** A simplified 6-well plate (not 96). Player selects which antibody to test with. Wells change color intensity based on protein concentration — darker means more. The decision is which antibody reveals the relevant protein. Wrong antibody produces uniform low signal (uninformative) or cross-reactive noise. Right antibody produces a gradient that tells the player what they need to know. Budget: antibody selections limited per case.

**Protein detector** (simplified western for early cases). Player selects one antibody probe. Binary result: detected or not detected. Used in early cases before the full ELISA is available. Teaches the concept that invisible proteins can be detected with specific antibodies, before the quantitative complexity of ELISA is introduced.

**Reference book.** Always accessible. Organized by section: Genes (sequence, size, function), Primers (target region, expected amplicon size), Enzymes (cut site, predicted fragments per gene), Antibodies (target protein, cross-reactivity). The book doesn't give answers — it gives the information needed to reason toward answers. A player who reads the enzyme section carefully can predict which enzyme will be informative before running it. This is the skill the game is teaching.

---

## The Plasmid Editor

The plasmid editor is a horizontal strand of slots. Parts are tokens with distinct shapes: promoters are rightward arrows, genes are diamonds, terminators are flat bars, tags are small circles, RBS are small triangles.

The broken plasmid is pre-loaded with the disease mutation visible — a flagged token, a missing slot, a misplaced element. The parts tray below contains available replacement parts including the correct wild-type version.

The engine runs a live preview: as the player edits the strand, the Digital Twin on the right updates in real time. Not instant — a brief 2-second computation animation (RNA polymerase traversal) before the new state appears. This makes the connection between design and outcome feel mechanical rather than instantaneous, which is more satisfying and more accurate.

The editor is not a design-from-scratch tool in early cases. The player is repairing a broken construct, not building from nothing. Design-from-scratch emerges in later cases once the player has internalized the rules through repair work. This is the debugging-before-designing progression that keeps early cases tractable.

---

## The Cell Visualization

The cell view is the game's emotional core. It must show the mechanism, not represent it abstractly.

**Sick state:** The cell is visibly wrong in a disease-specific way. For a misfolding disease: dim sluggish particles, red aggregate clusters visible in cytoplasm, membrane irregular. For an expression deficiency: sparse particles, correct-colored but few, appropriate organelle dim. For a toxic overexpression: dense chaotic particles, membrane stress indicators, red border pulse. Each disease phenotype is derived from the engine — the visualization reads what's computed to be wrong and renders it.

**The mechanism running:** When the player clicks Run after a fix, the animation plays: RNA polymerase (a small visible object) moves along the strand left to right. mRNA strands emerge and drift toward ribosomes. Ribosomes translate and release proteins. Proteins move to their correct cellular location. For a corrected misfolding disease: proteins fold correctly (visualized as clean compact shapes instead of tangled aggregates) and integrate into the membrane. The membrane brightens. Particle production normalizes.

**Healthy state:** The cell after a successful fix is visibly alive. Particles move with purpose, density, and speed. The membrane pulses rhythmically. The patient vitality number ticks up over 3-4 seconds, not instantly. This delay is intentional — it lets the player watch the mechanism work before seeing the score. The score is the confirmation of what they already saw happening.

**The split view:** During the CAD step, the screen shows broken cell left and predicted-fixed cell right simultaneously. This is the S2 wireframe. The right side updates live as the player edits the strand. The player can see whether their proposed fix will resolve the phenotype before committing to it. This is not cheating — it's the digital twin concept, which is a real tool real scientists use. It teaches the player to read the cell visualization by making the prediction explicit and then confirming it through instrument verification.

---

## Case Structure and Difficulty Curve

**Case 1 — Enzyme Deficiency (Tutorial).**
Gene is simply missing from the plasmid. Slot is visibly empty. Parts tray contains the correct gene. Player places it, runs the protein detector to verify it's expressed, applies treatment. Teaches: promoter-gene-terminator structure, protein detector, the basic loop. No diagnosis required — the missing slot is obvious.

**Case 2 — Wrong Promoter.**
Gene is present but uses a constitutive promoter when it needs to be inducible. Cell expresses the protein constantly, causing toxicity. Player uses growth curve (spectrophotometer over time) to see cells dying. Identifies the promoter as the problem. Swaps to inducible promoter. Verifies with gel (band present but only with inducer). Teaches: promoter types, toxicity from overexpression, growth curve readout.

**Case 3 — Point Mutation.**
Gene is present, promoter is correct, but the gene has a single base substitution causing misfolding. Gel shows a band at the correct size — nothing obvious wrong. Sequencer required to find the mutation. Player sequences the gene, compares to the reference, finds the substitution. Swaps to wild-type gene. Teaches: sequencing, that size-correct doesn't mean sequence-correct, the limitation of gel alone.

**Case 4 — Contaminant Insert.**
Plasmid contains an extra gene that shouldn't be there, consuming cellular resources and producing a toxic protein. Gel shows extra bands. Restriction digest identifies the contaminant. Player removes the extra cassette. Teaches: restriction digest, multi-band interpretation, resource competition between genes.

**Case 5 — Regulatory Failure.**
The gene is correct but the repressor circuit upstream is misfiring — the gene is always on instead of signal-responsive. ELISA shows protein present under all conditions when it should only be present in one. Player traces the circuit, finds the broken repressor element, repairs the regulatory logic. Teaches: ELISA quantitation across conditions, regulatory circuits, signal-responsive expression.

Cases 6-20: combinations of the above failure modes at increasing complexity. Two broken elements requiring both to be fixed. Mutations that mimic normal expression but at wrong levels. Regulatory circuits with emergent behavior. Cancer case: oncogene stuck on AND tumor suppressor knocked out — two simultaneous failures requiring separate diagnoses and a coordinated fix.

---

## Anti-Brute-Force Mechanisms

**Cases are procedurally varied.** Each case is a template (mutation type + gene + phenotype) with randomized parameters. The specific mutation position, the specific gene affected, the specific instruments that are most informative — these vary each playthrough. A player who memorizes "case 3 answer is TYR" finds a different gene next time. The reasoning transfers, the answer doesn't.

**The answer is assembled from evidence, not selected from a list.** Following CotGI's word bank: the gene name that appears in the answer field is unlocked only after the player has sequenced something that reveals it. The enzyme name is unlocked only after the player has run a digest that implicates it. The player cannot answer "TYR frameshift at position 127" without having sequenced something that showed position 127. Guessing is impossible because guessing requires vocabulary the player hasn't earned yet.

**Instrument budget.** Each case has a limited budget of instrument runs. Not severely limited — generous enough that a reasoning player never runs out — but tight enough that running every instrument in random order fails. The player who thinks before acting has budget to spare. The player who acts randomly runs out before reaching a conclusion.

**Wrong fixes are informative, not punishing.** If the player fixes the wrong thing, the instruments after the fix show a specific pattern that tells them what they got wrong. The cell improves partially but not fully. The gel shows improvement in one band but a remaining anomaly. The patient vitality goes up slightly but not to passing threshold. The player learns from the partial fix. No hard reset, no lost progress — just information that refines the next attempt.

---

## UI Structure

**Top half: active instrument panel.** Switches between instrument views based on which instrument tab is selected. Each instrument panel feels like looking at a real piece of equipment — gel box with physical-looking lanes and UV illumination, PCR readout showing cycle completion, sequencer showing chromatogram output. The interaction within each panel is the one real decision that instrument requires.

**Bottom half: workspace desk.** Sample tubes, result cards, reference book, answer sheet. Items are draggable. The desk accumulates evidence as the investigation proceeds. The reference book is always accessible and flippable. The answer sheet starts empty and populates as the player unlocks vocabulary through evidence collection.

**Left sidebar: instrument tabs + plasmid editor toggle.** Switching tabs changes the top instrument panel. Plasmid editor toggle replaces the top half with the split CAD view (broken left, digital twin right).

**Persistent bottom bar: patient vitality.** Always visible. Shows current vitality, trajectory (stable / declining / critical), and predicted vitality if current fix succeeds. This keeps stakes visible at all times without interrupting the investigation flow.

**No hints button.** Hints are replaced by the reference book and by informative failure states. If the player is stuck, running an instrument gives them information. Running another instrument gives them more. The game always has a next action available that produces useful information.

---

## What Gets Built, In Order

**Phase 1: unified simulation engine.** One engine that computes cell state from plasmid definition. Gel, protein detector, and growth curve all read from this engine. Plasmid editor writes to it. This is the foundation. Nothing else is built until this exists and is verified to work consistently across all existing levels.

**Phase 2: Case 1 end-to-end.** Single disease case, complete loop. Patient briefing → sick cell visualization → bench with protein detector and gel → plasmid editor with missing gene → fix → verify with protein detector → treatment animation → vitality score. No other cases, no other instruments. Just this loop working and feeling good. Run one playtest. If the transformation moment lands, proceed. If it doesn't, fix the visualization before building anything else.

**Phase 3: Case 2 and 3.** Two more cases, each adding one new instrument (growth curve for Case 2, sequencer with manual alignment for Case 3). Validate that the instrument additions feel like natural tools rather than new puzzles to learn. Playtest after each case.

**Phase 4: procedural variation.** Once three cases work and feel good, implement the template-and-parameters system so each case generates variants. This is when replay resistance is added. Not before.

**Phase 5: remaining instruments and cases.** Restriction digest, ELISA, additional cases up the complexity curve. Each instrument introduced when a case requires it — never added to the available pool before a case makes the player need it.

**Phase 6: upgrade store.** Alignment algorithm unlock, band-caller unlock, automated controls for instruments the player has mastered. This is late-game progression, not early-game friction reduction.

---

## What This Game Is Not

Not a factory game. Automation and throughput are irrelevant — one cell, one patient, one problem at a time.

Not a deckbuilder. No random draws, no card combinations, no opponent. The challenge is deduction, not optimization under randomness.

Not a walking simulator. Physical transportation is not gameplay. The Papers Please desk is correct.

Not a quiz. The game never asks "what does a gel electrophoresis measure." It puts the player in a situation where they need to know what a gel measures to solve their problem. The knowledge is acquired through use, not through testing.

Not a tutorial that becomes a game. The game is the same structure from case 1 to case 20. The cases get harder because the problems get more complex, not because new game systems are layered on top. The core loop never changes.

---

## Success Metrics

A player who completes 10 cases should be able to, without prompting:
- Explain what a gel band position tells you
- Explain why you'd sequence something after getting a gel result
- Explain the difference between a promoter and a gene
- Explain why a correct-sized band doesn't rule out a mutation

These are not quiz answers. They're intuitions built through repeated use of the read/write loop. If a player can explain these things, the game worked. If they can't, it didn't, regardless of how many cases they completed.

The test: after 10 cases, ask the player "if a patient's cells are producing a protein but it's the wrong size, what would you do first?" A player who has internalized the game answers "sequence it to find the mutation." A player who hasn't says "I don't know." Run this test after every major build milestone.