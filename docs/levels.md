# Cell Lab — Level Reference

All 32 puzzles across three modes. Each entry covers the concept taught and the UI the player interacts with.

---

## UI Modes Overview

**Strand Builder (levels 1–14)**
Three-panel layout: left sidebar (Parts / Instruments tabs) → centre instrument/cell area → right DNA strand. The sidebar's Parts tab lists draggable/clickable genetic parts; the Instruments tab switches the centre view. The DNA strand is a horizontal row of numbered slots; parts snap into them. Running the simulation plays a scan animation across the strand and shows the Cell View (a glowing circle whose colour and brightness reflect protein output). A condition switcher appears below the cell when multiple signal states exist.

**Circular Plasmid (levels 15–20)**
Left sidebar (Parts tab with part library + hints, Instruments tab) → centre canvas with an SVG ring showing placed parts as arcs. Clicking a part in the sidebar adds it to the ring; parts can be dragged around the ring to reorder, and a red ×  control appears on hover to delete. Below the ring: host badge (🦠 / 🧫), Run / Reset buttons, a molecular animation layer (RNA polymerase travelling the ring, mRNA strands, ribosomes), protein analyzer bar chart, cell-state indicator, and pass/fail check dots.

**Lab Bench (L1–L9 + PA1–PA3)**
Left sidebar (instrument tabs only, no parts) → centre instrument panel → right free-form desk. The desk is a drag-and-drop surface: results appear as moveable cards (PCR tubes 🧪, gel photos ⚡, excised bands 🔬, ELISA result cards 🧫, sample tubes, briefing note, answer sheet). A reference book 📖 can be opened on the desk and flipped through sections (Genes, Instruments, Enzymes, Antibodies, Primers). The centre instrument switches between PCR machine, gel box, Sanger sequencer, restriction digest, ELISA plate reader, sequence assembler, or Promoter Architect rail, depending on which tabs are active.

---

## Strand Builder Levels (1–14)

### 1 — Hello, Cell!
**Concept:** Minimal gene expression. Promoter → gene → terminator.

**UI:** 3-slot strand. Parts library offers constitutive promoter, GFP gene, and terminator. Single test condition (no signals). Running the simulation makes the cell glow green. Pass requires GFP ≥ 1.

---

### 2 — Sugar Switch
**Concept:** Inducible promoter replaces constitutive; cell is only on when the sugar signal is present.

**UI:** 3-slot strand. Parts library adds the sugar-responsive promoter alongside the constitutive one. A condition switcher appears after running: "Sugar" vs "No Sugar" tabs let the player compare both cell states. Pass requires GFP ≥ 1 with sugar and GFP = 0 without.

---

### 3 — Brighter!
**Concept:** Promoter strength and gene copy number amplify output.

**UI:** 7-slot strand. Parts library includes weak (constitutive) and strong promoters, GFP, and terminator. Player must combine a strong promoter or duplicate GFP cassettes to hit GFP ≥ 4. The cell glow radius increases with intensity.

---

### 4 — Dual Color
**Concept:** Two independent expression units on one strand.

**UI:** 7-slot strand. Parts library adds RFP alongside GFP and promoters. Cell view can show overlapping green + red glow. Pass requires GFP ≥ 1 and RFP ≥ 1 simultaneously.

---

### 5 — Exclusive Switch
**Concept:** Repressor protein mediates signal priority; sugar represses toxin output.

**UI:** 9-slot strand. Parts library introduces the repressor gene and toxin (poison) promoter. Four condition tabs appear: Sugar only, Toxin only, Both, Neither. Cell alternates green / red / green / dark across conditions. Tests enforce mutual exclusivity.

---

### 6 — Inverted
**Concept:** NOT gate — signal drives repressor which silences GFP.

**UI:** 7-slot strand. Parts library has sugar promoter, repressible promoter, repressor gene, GFP. Two condition tabs: No Sugar (cell glows) and With Sugar (cell dark). Teaches that repressible promoter is always on unless RepA is present.

---

### 7 — Both Required
**Concept:** AND gate using split GFP — both N-terminal and C-terminal halves must be present to fluoresce.

**UI:** 7-slot strand. Parts library replaces standard GFP with GFP-N and GFP-C genes, each needing its own promoter. Four condition tabs. Cell only glows when both sugar and toxin are present.

---

### 8 — Amplifier
**Concept:** Two-stage relay: a weak sugar signal drives an activator gene, which in turn activates a strong ACTR promoter driving GFP.

**UI:** 6-slot strand. Parts library introduces weak-sugar-promoter, activator gene, activator-responsive promoter (ACTR). Two conditions. Pass requires GFP ≥ 3 with sugar, GFP = 0 without. Cell brightness visibly increases compared to a direct weak-sugar → GFP arrangement.

---

### 9 — NOR Gate
**Concept:** Either signal silences the cell via shared repressor; only baseline (no signals) produces output.

**UI:** 9-slot strand. Parts library includes two promoters (sugar, toxin), repressible promoter, repressor gene, GFP. Four condition tabs. Cell dark in three of four cases; only glows in the "Neither" tab.

---

### 10 — Hidden Product
**Concept:** Non-fluorescent proteins exist; introduces the Protein Detector instrument.

**UI:** 5-slot strand. Parts library includes insulin gene alongside GFP. After running, an Instruments tab button activates the **Protein Detector** overlay on the cell view — a panel listing selectable proteins with detection dots. Player must detect Insulin rather than observing a glow. Two conditions (sugar on/off).

---

### 11 — The Silencer
**Concept:** Read-only circuit analysis — player identifies what a hidden gene produces.

**UI:** 6-slot strand, all slots pre-filled. Hidden genes show as grey "???" blocks. Parts library is empty (no dragging). Protein Detector instrument enabled. Player runs the simulation, opens the detector, and identifies RepA as the hidden product. Two condition tabs reveal the difference.

---

### 12 — Signal Boost
**Concept:** Read-only — identify two hidden proteins in an activator relay.

**UI:** 6-slot strand, pre-filled with two ??? blocks (hiding the activator gene and GFP). Protein Detector lists candidates. Player deduces that CMV → ??? → ACTR → ??? means the first hidden gene makes ActA and the second makes GFP.

---

### 13 — Silent Gene
**Concept:** Debugging — parts are in the wrong order (gene before promoter).

**UI:** 3-slot strand pre-filled with [GFP, Promoter, Terminator] — reversed. Parts library provides the correct three parts. Player must drag them to fix the order: Promoter → GFP → Terminator. Running the broken strand shows a dark cell; fixing it makes it glow.

---

### 14 — The Leak
**Concept:** Debugging — find and remove a second, constitutive expression unit causing always-on glow.

**UI:** 6-slot strand pre-filled with a correct sugar→GFP unit (slots 1–3) and a leaky constitutive→GFP unit (slots 4–6). Parts library offers the correct three parts only. A **Brightness Meter** instrument panel shows a real-time GFP bar even without sugar, flagging the leak. Player identifies and removes the constitutive cassette.

---

## Circular Plasmid Levels (15–20)

### 15 — Balanced Reporters
**Concept:** Bacterial operon: polycistronic transcript with tuned RBS strengths; avoid transcriptional burden.

**UI:** Circular plasmid ring (bacterial host 🦠). Parts library provides two strong promoters, two genes (LacZ / Cat), strong and weak RBS, strong and leaky terminators. After running, the protein analyzer shows LacZ and Cat bars; the cell-state indicator confirms "normal" or "burdened." Pass requires LacZ ≥ 2, Cat in [1, ~LacZ/2], cell not burdened.

---

### 16 — Terminator Tuning
**Concept:** Leaky terminator allows readthrough; IPTG-inducible promoter provides independent Cat boost.

**UI:** Circular plasmid (bacterial). Two condition tabs appear after running: "No IPTG" and "With IPTG." Protein analyzer bars shift between conditions. A flexible linker part is available for spacing. Pass requires Cat low but present at baseline, then high with IPTG.

---

### 17 — Protease Queueing
**Concept:** SsrA degradation tags reduce protein steady-state; stacking too many tagged proteins saturates the ClpXP queue.

**UI:** Circular plasmid (bacterial). Parts library includes three SsrA tag variants (LAA strongest, DAS medium, AAV weak). After running, protein analyzer shows AmyE and CcdB levels. Cell-state indicator warns "burdened" or shows "protease-saturation" in the warning message if the queue overloads. Pass requires AmyE 1–3, CcdB ≤ 2, cell normal.

---

### 18 — The Programmable Repressor
**Concept:** dCas9 + guide RNAs silence multiple target genes simultaneously on toxin signal.

**UI:** Circular plasmid (bacterial). Three pre-filled reporter cassettes (Gene1, Gene2, Gene3) are shown as locked arcs on the ring. Player adds a dCas9 expression unit plus three gRNA parts. Two condition tabs: "No toxin" (all three reporters on) and "Toxin present" (all three silenced). Flexible linker part available for positioning gRNAs on the same transcript.

---

### 19 — The Smart Drug
**Concept:** Eukaryotic AND gate: cancer activator + nutrient promoter drive Drug; healthy-cell signal redirects dCas9-NLS to block Drug.

**UI:** Circular plasmid (eukaryotic 🧫). Parts differ from bacterial: Kozak sequences replace RBS, poly-A signals replace terminators, NLS tag available. Five condition tabs cover all signal combinations. Protein analyzer shows Drug (and optionally CancerActivator, dCas9-NLS). Pass requires Drug produced only under cancer+nutrient, and silenced whenever healthy-marker is present.

---

### 20 — Enhancer Redirection
**Concept:** Eukaryotic enhancer boosts nearest promoter; insulator redirects the loop to a distal promoter.

**UI:** Circular plasmid (eukaryotic). Plasmid ring is mostly pre-filled: enhancer, weak waste promoter, Drug promoter all visible. Parts library contains only one part: the insulator. Player drags it between the enhancer and the waste promoter arc. After running, protein analyzer shows Drug and Waste bars. Pass requires Drug ≥ 1.7, Waste ≤ 1.3.

---

## Lab Bench Levels (L1–L9)

### L1 — Verify the Insert
**Concept:** PCR amplifies the insert region; gel electrophoresis sizes the band; size reveals identity.

**Instruments:** PCR, Gel

**UI:** Desk starts with a plasmid diagram card (pEXP-???), a reference book, and an answer sheet. Player opens the PCR instrument, selects primers flanking the insert, runs PCR → a PCR tube card appears on the desk. Tube is dragged onto the gel well → Gel view shows band position against ladder. Band at ~720 bp. Player checks reference book (Genes section, sort by length) and identifies GFP. Answer typed into the answer sheet card. 3 wrong-guess limit.

---

### L2 — The Contaminated Sample
**Concept:** PCR reveals two bands when a contaminant is present; sequencing distinguishes them.

**Instruments:** PCR, Gel, Sequencer

**UI:** Desk shows the GFP vector card. PCR tube comes back with two bands (720 and 860 bp). Player runs gel — two visible bands. Player clicks the 860 bp band to excise it → an Excised Band card appears on the desk. Excised band is dragged to the Sequencer well → Sequencer view shows a scrollable chromatogram and the first ~30 bases of bla-TEM sequence. Player matches sequence against the reference book's Genes section to identify bla-TEM.

---

### L3 — Identify the Isolate
**Concept:** Clinical pathogen identification via PCR + gel + sequencing on a large unknown insert.

**Instruments:** PCR, Gel, Sequencer

**UI:** Similar to L2 but the insert is 1940 bp (toxA). The single amplified band is large. Gel band is excised, sequenced, and matched to toxA in the reference book. No contaminant bands — one band, one question.

---

### L4 — Size Isn't Everything
**Concept:** Multiple fluorescent proteins cluster in the 680–775 bp range; gel alone cannot distinguish them; sequencer is required.

**Instruments:** PCR, Gel, Sequencer

**UI:** PCR produces a band at 700 bp. Gel shows it between RFP (680) and GFP (720) on the ladder — ambiguous. Player excises the band and sequences it. The chromatogram shows the first 30 bases, which match GFP for the first ~24 chars then diverge — BFP has a different base at position 25. Reference book's Genes section lists all fluorescent proteins with their sequences for comparison. Answer: BFP.

---

### L5 — Assemble the Sequence
**Concept:** Shotgun sequencing produces overlapping short reads; player assembles them into a contig and matches it to a reference gene.

**Instruments:** Sequence Assembler

**UI:** Centre view is the **Assembly Workspace** — a canvas with ~8 read tiles showing 25-character DNA sequences. Player drags reads onto a horizontal assembly rail, aligning overlapping ends. Green overlap indicators appear when a suffix matches the next read's prefix. Completed contig is displayed below. Player compares the assembled 75 bp sequence against reference book sequences (Genes → sequence column) to identify Insulin.

---

### L6 — Read Both Strands
**Concept:** Sequencing reads can come from either DNA strand; some are reverse complements and must be flipped.

**Instruments:** Sequence Assembler

**UI:** Assembly Workspace with a shorter target (30 bp, tRF-Gly). One or more read tiles have a **flip** button (↔) indicating they may be reverse complements. Player flips suspect reads and checks whether their sequence now forms overlaps. A "RC" indicator badge appears on flipped tiles. Once assembled, the contig is matched to the reference book. Multiple-choice answer picker lists all ~30 genes.

---

### L7 — Restriction Map
**Concept:** Restriction digest produces fragment patterns that fingerprint genes; four candidates cluster in the same size range.

**Instruments:** PCR, Gel, Digest

**UI:** Desk shows a plasmid card ("Unverified Vector"). Player PCRs the insert to get a ~1180 bp tube. Tube is dragged to the **Digest** instrument (centre panel): player selects an enzyme, runs the digest → a Digest Tube card appears. Digest tube dragged to gel → fragment pattern visible. Reference book (Enzymes section, then Genes enzyme-site table) lists predicted cut sites per candidate. Player deduces malE by elimination. Multiple choice answer sheet lists four candidate genes.

---

### L8 — The Mislabeled Cultures
**Concept:** ELISA with cross-reactive antibodies; player must choose a 2-antibody panel that produces unique signal fingerprints for all 6 proteins within a 12-well budget.

**Instruments:** ELISA

**UI:** Desk shows six sample tube cards (Tube A–F) and the reference book. Player opens the reference book (Antibodies section) to study binding profiles (strong / weak / none per protein). Player drags a sample tube to the **ELISA** instrument → selects an antibody → runs test → an ELISA result card (signal value) appears on the desk. After running enough combinations, the answer sheet shows a dropdown mapping for each tube. Submitting a wrong mapping clears all experimental results, forcing a new strategy.

---

### L9 — Fingerprint the Strain
**Concept:** Multi-sample PCR: choose primers and samples strategically within a 6-lane gel budget to uniquely identify 5 bacterial species.

**Instruments:** PCR, Gel

**UI:** Desk shows five sample tube cards (Sample 1–5) and the reference book. Player opens the book (Primers section) to study which primers give which band sizes per species. Player drags a sample tube to the **PCR** instrument, selects a primer pair, runs PCR → PCR tube cards accumulate. Tubes are loaded into the gel in batches. Gel shows band positions per species for the chosen primer. Lane budget counter is shown in the Gel instrument header. Answer sheet has a mapping dropdown for each sample. Wrong mapping clears experiments.

---

## Promoter Architect Levels (PA1–PA3)

### PA1 — First Contact
**Concept:** Tutorial — place an activator site within the activation range of a promoter to switch the gene on.

**UI:** Centre view is the **Promoter Architect** — a horizontal DNA rail (120 bp). One gene promoter sits at position 60. Parts library has one site (Activator, 25 bp footprint). Player drags the activator onto the rail and positions it. A shaded activation-range arc (22 bp) radiates from the gene; the activator must overlap it. Expression meter below the gene shows 0–100%. Pass when expression ≥ 80%.

---

### PA2 — The Crowded Gene
**Concept:** Spatial interference — activator signal bleeds into adjacent genes; a broad repressor causes collateral damage; only the short-range Silencer precisely suppresses one gene without affecting neighbours.

**UI:** Promoter Architect rail (200 bp) with three gene promoters (Gene A at 50, Gene B at 95, Gene C at 140). Activation range is 55 bp — wide enough that an activator placed near A or C reaches B. Parts library provides two activators (Blue, Amber, 20 bp footprint), a Broad Repressor (20 bp, full 55 bp range), and a Silencer (15 bp footprint, 12 bp activation range override). Expression meters under each gene must show A ≥ 90%, B ≤ 10%, C ≥ 90%. The Silencer's tight range is shown by a visually shorter arc.

---

### PA3 — Two States
**Concept:** Same activator placement satisfies two environments; an environmental repressor conditionally clamps the Growth gene.

**UI:** Promoter Architect rail (300 bp) with two genes (Survival at 80, Growth at 220). Parts library has two activators. Two **State tabs** (Safety: ON / Safety: OFF) appear above the rail. In State 1 the environmental repressor arc is drawn far from Growth (no effect); in State 2 it shifts close to Growth, suppressing it. Player positions both activators once; the state tabs switch to reveal how the environmental repressor changes results. Pass requires both genes ≥ 90% in State 1, Survival ≥ 90% and Growth ≤ 25% in State 2.
