# Strain — Prototype PRD v0.2
**Lab Bench Split**

---

## One-Line Pitch
A real-time immunology survival game where you engineer a bacterial colony's gene circuits to counter an escalating adaptive immune response, split between a live tissue battlefield and a lab bench for plasmid editing and instrument diagnosis.

---

## The Three Questions
- **What am I doing?** Keeping my bacterial colony alive inside host tissue by swapping gene circuits in my plasmid to counter whatever immune cell type is currently attacking.
- **What's stopping me?** I only have limited plasmid slots so I can't counter every threat simultaneously. The immune system adapts — whatever I used to counter the last wave gets overwhelmed by the next one.
- **How do I improve?** Learning which gene counters which immune cell, learning to read instrument signals fast enough to prepare before the next escalation hits, and learning to configure plasmids that handle two simultaneous threats with minimal slots.

---

## Screen Layout

**Left half — Tissue Battle (live)**
Real-time view of host tissue. Bacterial colony in center. Immune cells advancing from edges. All interactions visible in real time. Player watches this to understand what's happening.

**Center strip — Cytokine Signal Bridge**
A narrow vertical strip between left and right panels. Shows live molecular signals passing between battlefield and lab — animated particles flowing right when the player samples tissue, flowing left when a plasmid change propagates back to the colony. This strip is the visual proof that the two panels are one connected system, not two separate minigames.

**Right half — Lab Bench (strategy)**
Plasmid editor at top. Instrument readouts below. Sample tube tray at bottom. Player looks here to understand why something is happening and what to do about it.

**Bottom bar — minimal**
Left: wave indicator showing current active immune cell type icons and a countdown to next escalation. Center: plasmid slot usage (e.g. 4/6 slots used). Right: Founder Cell status shown as an illustrated bacterium — healthy it glows with active flagella, stressed it dims, critical it shows membrane damage. No bars anywhere.

---

## Visual Aesthetic
BioRender-style biological illustration throughout. Not abstract shapes.

- Bacteria: elongated rods with visible surface proteins as small colored spike clusters, fimbriae, capsule shown as a halo when expressed
- Neutrophils: multi-lobed purple nucleus, granular cytoplasm, characteristic kidney-bean nuclear shape
- Macrophages: large irregular blobby shape, visible pseudopods actively engulfing bacteria at edges
- Antibodies: Y-shaped proteins floating in tissue space, tagging bacteria with mismatched surface proteins
- Biofilm: semi-transparent green barrier layer over colony edge facing neutrophil advance
- Tissue background: warm pink-red with visible extracellular matrix texture
- Plasmid: real circular DNA diagram with colored arc segments for each gene, restriction sites marked, looks like a genetics textbook figure
- ELISA: 96-well plate with colored wells showing signal intensity gradients
- PCR: gel band image showing band positions against ladder

---

## The Bacterial Colony

Colony occupies a region of the tissue view. Individual bacteria are visible as illustrated rods. The colony as a whole behaves as one organism — gene expression shown as visible effects across all bacteria simultaneously.

**Founder Cell:** one distinct bacterium at colony center, slightly larger, always visible. Its visual state is the only health signal. Healthy: warm glow, active flagella movement. Stressed: dims, flagella slow. Critical: membrane irregularity, surface proteins fading. Dead: burst animation, game over.

Colony does not auto-expand in this prototype. Expansion is a future layer. For now the colony holds a fixed region and the game is purely about surviving waves with correct gene configuration.

---

## Immune Cell Types (Prototype: 3 types)

**Neutrophils**
- Visual: small fast-moving cells with multi-lobed purple nucleus, swarm behavior
- Behavior: advance quickly in groups toward colony edge, attack surface proteins directly
- Counter: Biofilm gene — creates visible barrier layer that slows neutrophil advance and reduces attack rate
- If uncountered: neutrophils breach colony edge, bacteria at perimeter start dying visibly

**Macrophages**
- Visual: large irregular cells, slow-moving, visible pseudopods
- Behavior: advance slowly but each one engulfs multiple bacteria on contact — visible engulfment animation
- Counter: Capsule gene — surrounds bacteria with polysaccharide halo that resists phagocytosis, macrophages shown bouncing off capsulated bacteria
- If uncountered: macrophages engulf bacteria one by one, colony shrinks from edges inward

**Antibody Wave**
- Visual: Y-shaped proteins flooding tissue space from blood vessel direction
- Behavior: antibodies tag bacteria whose surface proteins match the current antibody profile — tagged bacteria glow red and become targets for rapid neutrophil clearance
- Counter: SurfaceSwitch gene — bacteria visibly change surface protein color, antibodies no longer bind, tagging stops
- If uncountered: tagged bacteria are rapidly cleared, colony loses cells faster than any other wave type

---

## Rock/Paper/Scissors Dynamic

Three threats, three counters. The prototype has exactly this many — enough to create genuine dilemmas without overwhelming scope.

| Threat | Counter Gene | Slot Cost |
|--------|-------------|-----------|
| Neutrophil swarm | Biofilm | 2 slots |
| Macrophage advance | Capsule | 2 slots |
| Antibody flood | SurfaceSwitch | 2 slots |

Six plasmid slots total. Each counter costs 2 slots. The player can run a maximum of 3 counters simultaneously — exactly enough to handle all three threats at once, but only if they use no other genes. This creates the dilemma: add a fourth gene type (FastGrow, ComplementInh, Mucin++) and lose one counter slot, meaning one threat type will partially breach.

The immune system never sends the same two consecutive wave types. It reads what killed its cells and escalates with the counter. Biofilm held the neutrophils — next wave adds macrophages. Player holds both with Biofilm + Capsule — next wave adds antibody flood. Player is now at 6/6 slots with no room for anything else. Any additional gene they want requires dropping a counter. That's the late-game pressure point.

---

## Plasmid Editor (Right Panel, Top)

Circular DNA diagram. Colored arc segments representing active genes. Empty arc slots shown as dashed outlines.

**Interaction:** player clicks an empty slot or an existing gene arc to open a swap menu. Menu shows available genes with slot costs, current slot usage, and a preview showing which gene would be dropped if they add the new one. Player confirms swap. The change propagates — animated over 5 seconds as the cytokine strip shows particles flowing left back to the colony, and the bacteria visibly update their expressed proteins.

**Gene propagation delay:** swaps don't take effect instantly. 5-second propagation window representing cell division carrying the new plasmid. This creates a strategic window — if a wave hits during propagation you're vulnerable. Players learn to swap before waves, not during them.

**Available genes in prototype:**

| Gene | Effect | Slot Cost |
|------|--------|-----------|
| Biofilm | Slows neutrophil advance, reduces attack rate | 2 |
| Capsule | Resists macrophage phagocytosis | 2 |
| SurfaceSwitch | Evades antibody targeting | 2 |
| FastGrow | Colony recovers lost cells faster | 1 |
| ComplementInh | Reduces complement cascade damage (passive) | 1 |
| Mucin++ | Reduces all threat advance rates slightly | 2 |

FastGrow and ComplementInh cost 1 slot — they're utility genes that fit in the gaps when the player has spare slots. They reward efficient plasmid design.

---

## Instrument Bay (Right Panel, Bottom)

Three instrument slots stacked vertically. Each slot accepts a sample tube dragged from the sample tray.

**Sample tray:** three sample tubes always available at bottom of right panel. Player drags a tube to an instrument slot to run it. Running an instrument takes 8 seconds (shown as a progress animation on the instrument). Result appears as a realistic readout. Tube is consumed — new tube appears in tray after 20 seconds.

**Instruments in prototype (2 of 3 slots active):**

**ELISA — Cytokine Panel**
Shows a 96-well plate with colored signal intensities. Relevant wells are highlighted. Result tells the player the molecular profile of the current immune response — which cytokines are elevated. This tells them which immune cell type is being recruited for the NEXT wave, not the current one. The player has to interpret the cytokine pattern themselves using the reference card (a small always-visible legend showing cytokine → cell type relationships). IL-8 elevated means neutrophil recruitment. IL-4 elevated means antibody class switching. TGF-β elevated means macrophage M2 polarization. The result is never a tooltip that says "neutrophils incoming" — it shows the cytokine data and the player connects it to the threat type.

**PCR — Surface Antigen Profile**
Shows a gel band image. Tells the player which surface antigen the current antibody wave is targeting. If the player has SurfaceSwitch active, the PCR also shows whether their switched surface protein is being recognized yet — if a new antibody profile appears against the switched antigen, the player knows SurfaceSwitch is about to fail and needs a backup plan. This is the instrument that makes SurfaceSwitch strategically interesting rather than a permanent solution.

**Third slot — empty in prototype**
Reserved. Shows "instrument bay empty — drag sample to run." This slot is where Western blot or mass spec would go in a future build.

---

## Wave System

Waves are continuous pressure, not discrete attacks. Immune cells are always present and always advancing. The wave system controls which cell types are present and in what numbers.

**Escalation:** every 45 seconds, the immune system adds a new cell type or increases the number of an existing type. The bottom bar countdown shows time to next escalation. This is the player's prep window — they should be using instruments and swapping genes before the escalation hits, not reacting after.

**Wave progression (prototype):**
- Wave 1: neutrophil swarm only. Simple. Player learns Biofilm.
- Wave 2: neutrophils + macrophages. Player must split slots between two counters.
- Wave 3: all three threat types simultaneously. Player is at slot limit. Any additional gene requires dropping a counter.
- Wave 4+: numbers increase. More neutrophils, faster macrophages, antibody flood density increases. Same three types, higher pressure. Player survives by optimizing — finding the 6-slot configuration that handles all three at minimum cost, leaving room for utility genes.

**Adaptive escalation (stretch goal for prototype):** if the player's Biofilm successfully holds neutrophils for two consecutive waves, the next escalation sends macrophages instead of more neutrophils. The immune system is reading what's working. This makes the game feel alive and prevents memorizing a fixed sequence. Only implement if core loop is working.

---

## Loss Conditions

**Founder Cell death:** any immune cell reaches and contacts the Founder Cell directly. Burst animation, game over screen showing which threat breached, which counter gene would have prevented it, and time survived.

**Colony collapse:** colony loses 80% of visible bacteria to engulfment or clearance. Founder Cell has nothing left to protect it. Game over with same informative end screen.

**No health bars.** The Founder Cell illustration and the visible colony density are the only health signals.

---

## Game Over Screen

Shows:
- Time survived
- Wave reached
- Cause of death in plain language: "Macrophages breached the colony — Capsule gene was not active"
- One sentence on what to try next: "Add Capsule to your plasmid before Wave 2"

This is the KSP autopsy moment. The player understands exactly what happened and exactly what to change. They hit retry immediately.

---

## What Is NOT In This Prototype

- Colony expansion
- Multiple colony clusters
- Resource nodes or nutrient system
- Third instrument slot
- Adaptive escalation (optional stretch)
- Sound
- Narrative framing or patient cases
- Disease progression
- Art beyond BioRender-style illustrated shapes — no pixel art, no 3D
- Save/load
- Difficulty settings
- Tutorial text beyond the reference card legend

---

## Tech Stack

- Phaser 4: tissue battle (left panel), immune cell movement, colony rendering, engulfment animations, cytokine strip particle flow
- Svelte 5: plasmid editor (right panel), instrument bay, sample tube drag-and-drop, bottom bar
- EventBus: typed Phaser ↔ Svelte communication
- All immune cell and bacteria rendering: Phaser sprites or canvas drawing using biological shapes — not placeholder rectangles
- Target: playable in browser, single screen, no server required

---

## Validation Test

After building, run one playtest with one non-biologist. Watch for three things:

1. Do they understand without being told that the left panel is the problem and the right panel is the solution?
2. Do they swap genes in response to what they see on the battlefield, or do they swap randomly?
3. After losing, do they immediately identify what they would change on the next run?

If yes to all three: the loop works. Add instruments, adaptive escalation, and expansion next.

If no to question 1: the cytokine strip connection between panels needs stronger visual communication.

If no to question 2: the counter relationships (neutrophil → biofilm, macrophage → capsule) aren't legible enough from the battle view alone. Add clearer visual feedback on what's working and what isn't.

If no to question 3: the game over screen isn't informative enough. Make the cause of death more explicit.

---

## Success Metric

Player loses at wave 3 or later, reads the game over screen, says "oh I needed capsule earlier," and starts a new run with a different plasmid configuration within 30 seconds. That loop — lose, understand, retry with a specific change in mind — is the entire game at prototype stage.