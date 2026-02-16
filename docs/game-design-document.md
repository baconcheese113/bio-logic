# BioLogic: Game Design Document

**Status:** Design Document (Ready for Prototyping)

---

## Vision Statement

**BioLogic** is a lab-building game where your laboratory IS the artifact of your skill. You design, build, and optimize a diagnostic lab that fights disease across 140 years of medical history.

**Core Insight:** Like Kerbal Space Program teaches rocket science by making you fly the rocket, BioLogic teaches medicine and biotech by making you do the work—gather evidence, interpret uncertain results, and manage time/cost tradeoffs under realistic constraints.

**Player Fantasy:** You are a medical detective running your own clinic/lab, from receiving sick patients to solving the case through lab work and interpretation.

**Target Audience:** Ages 10–100, no biology background required. Curious minds who enjoy puzzle games, management sims, or science.

**Learning Goals:**
1. Scientific Thinking: Hypothesis → Test → Interpret → Refine
2. Lab Literacy: What instruments exist, what they do, why they matter
3. Diagnostic Reasoning: How clinicians narrow down possibilities
4. Historical Context: How medicine evolved (era-unlocked instruments)
5. Economic Tradeoffs: Cheap tests first vs. expensive definitive tests

---

## Core Design Philosophy

| Old Mental Model | New Mental Model |
|------------------|------------------|
| Cases are the game, lab is infrastructure | Lab-building is the game, cases are the test |
| Follow the story to unlock tech | Discovery happens when you push limits |
| Grind mastery points to progress | Understanding IS progression |
| Linear progression through eras | Emergent optimization within eras |

**Anti-Rigidity Principles:**
- No single "correct" lab layout—there are tradeoffs
- Multiple valid approaches to the same case
- The game teaches through play, not tutorials
- Understanding proven by using tools correctly, not by grinding

---

## Historical Eras

The player lives the 140-year journey of medical science, understanding not just HOW each tool works, but WHY it was invented and WHAT problems it solved.

| Era | Period | Key Instruments | Vocabulary |
|-----|--------|-----------------|------------|
| **Golden Age** | 1880-1920 | Microscope, Gram stain, Culture plates, Basic serology, Simple biochemical tests | "Consumption," "The grip," "Miasma" |
| **Antibiotic Era** | 1940-1970 | + Expanded biochemicals, Antibiotic susceptibility (Kirby-Bauer), Acid-fast stain | "Wonder drugs," Zone of inhibition |
| **Molecular Era** | 1980-2000 | + PCR, Gel electrophoresis, Sanger sequencing | "DNA fingerprinting," "Amplification" |
| **Modern Era** | 2000+ | + Flow cytometry, ELISA, Mass spectrometry, qPCR | "Biomarkers," "Point-of-care" |

**Era Mechanics:**
- Instruments unlock by era progression
- In-game manual uses era-appropriate language
- Answer banks filtered by era—cannot claim MRSA in 1890 or prescribe vancomycin in 1920

---

## Epidemiological Meta-Layer

Your city has diseases. Your lab fights them. This creates stakes without "game over."

**City-Scale Elements:**
- **Disease Prevalence:** Shows what's out there; changes over time
- **Active Outbreaks:** Real events you can respond to; tests lab capacity
- **Your Impact:** Lives saved, outbreaks contained—visible consequences
- **Unknown Diseases:** Mysterious cases that drive discovery
- **News Feed:** Era-appropriate information (newspapers → telegraph → radio → digital)

**Stakes Through Consequences (Not Game Over):**
- Outbreaks spread if you can't handle case volume
- Death toll rises visibly when you fail
- No "game over"—failure is living with consequences

**Disease as Antagonist:**
- Diseases evolve (antibiotic resistance appears)
- New pathogens emerge unexpectedly
- Your tools become obsolete if you don't advance

---

## Technology Acquisition

| Tier | How Acquired | Examples | Quantity |
|------|--------------|----------|----------|
| **Revolutionary Discoveries** | Story-driven challenges | Germ theory, Gram stain, PCR, antibiotics | 15-25 total |
| **Derived Technologies** | Unlocked in waves; must purchase | RT-PCR, qPCR, ddPCR (after PCR) | 40-60 total |
| **Consumables** | Purchase with funds anytime | Primers, antibody panels, reagent kits | Unlimited |

**Expertise as Speed:** All derived technologies available once base tech exists. Experts use them immediately; novices learn through doing.

---

## Automation & Efficiency Progression

| Stage | Player Activity | Lab Capability |
|-------|-----------------|----------------|
| **Early Game** | Everything manual, one case at a time | Learning each technique hands-on |
| **Mid Game** | Batching, workflow design, assistants | 10+ cases/day, standard protocols |
| **Late Game** | Automation, SOPs, QC oversight | 100+ cases/day, handle edge cases only |
| **End Game** | High-throughput workcells, algorithms | Outbreak-scale response |

**The Mastery → Automation Contract:**
- Must prove understanding before automating (successfully use on multiple cases)
- Once proven: train assistants, add to automated workflows, trust output for routine cases
- Edge cases still require expertise

---

## Lab World Taxonomy

Everything in the lab world falls into one of four categories, from most permanent to most transient:

| Category | Definition | Examples |
|----------|-----------|---------|
| **Structure** | Building architecture — walls, floors, doors, windows | Walls, floors, doors, windows, drain |
| **Fixture** | Permanently installed lab infrastructure — cannot be moved once placed | Built-in workbench, plumbed sink, gas line, fume hood, wall shelving |
| **Equipment** | Movable machinery and tools — can be relocated | Ice box, microscope, steam sterilizer, centrifuge, hand incubator, bunsen burner, inoculation loop |
| **Consumable** | Depletable supplies — used up during workflows | Reagents, stains, empty dishes, media powder, distilled water |

**Placement:**
- Structures define the room shape and cannot be changed after building
- Fixtures occupy floor tiles and may require infrastructure (gas, water)
- Equipment is either `freeStanding` (occupies floor tiles) or `benchtop` (placed on a fixture's work surface)
- Consumables are always `benchtop` — stored on shelving, cabinets, or workbench surfaces

**Containers:** Many items are containers that hold substances (culture plates hold media + bacteria, flasks hold liquid reagents, vials hold patient samples). Containers are a core mechanic — transferring substances between containers drives most lab workflows.

**Samples:** A sample is a substance inside a container (vial, tube, swab transport). The container is the item; the sample is its contents.

All placeable things share `gridSize: [cols, rows]` for spatial placement on either floor tiles or fixture surfaces.

---

## Lab Management & Designer

The lab is a physical space the player builds and manages.

**Core Concept:**
- Top-Down Lab View with grid-based layout
- Fixture and equipment placement affects workflow
- Infrastructure requirements (power, gas, water, ventilation, biosafety)
- Era-Appropriate Labs evolve with technology

**Lab Layout by Era:**

| Feature | Golden Age | Antibiotic Era | Molecular Era | Modern Era |
|---------|------------|----------------|---------------|------------|
| Floor Space | Small clinic room | Dedicated lab wing | Multi-room facility | Automated core lab |
| Power | Gas burners only | 110V limited | 110V/220V everywhere | Uninterruptible power |
| Biosafety | Open benches | Basic ventilation | BSL-2 hoods | BSL-3 suites |
| Storage | Ice boxes | Refrigerator | -20°C freezer | -80°C, LN₂ tanks |
| Contamination Risk | High | Medium | Low | Very Low |

**Lab Management Actions:**
- Buy equipment (costs funds, requires space + prerequisites)
- Place equipment on floor (freestanding) or on fixture surface (benchtop)
- Install fixtures (permanent — choose placement carefully)
- Upgrade infrastructure (power, gas, water, ventilation, biosafety)
- Relocate equipment (costs funds, takes time)
- Decommission equipment (recoup some funds)

---

## Interaction Model & Agent Compatibility

All gameplay must be playable by humans AND coding agents (via Playwright MCP).

**Click-to-Interact Model:**
- Click on instruments in lab view to use them
- No real-time character control
- All interactions are discrete clicks, selections, and form inputs
- No timing-based gameplay

**Prototype Constraint:** All gameplay testable via `mcp_playwright_browser_snapshot` + `mcp_playwright_browser_click`.

---

## Core Gameplay Loop

```
1. CASES ARRIVE (Automatic)
   └── Cases appear in queue throughout game-time

2. TRIAGE
   ├── Review vitals, synopsis, urgency
   └── Accept, Reject, or Defer case

3. COLLECT SAMPLES (uses Sample Volume)
   ├── Choose which samples to take (costs volume)
   └── QNS risk if volume depleted → request redraw

4. RUN TESTS (can interleave multiple cases)
   ├── Select instrument (may need controls)
   ├── Load sample (+ positive/negative controls)
   ├── Configure/run (processing takes game-time)
   └── Retrieve result artifact

5. INTERPRET & RECORD
   ├── Examine result artifact
   ├── Validate controls
   └── Record structured observations

6. MONITOR PATIENT STATUS
   └── Patient may deteriorate if diagnosis delayed

7. ANSWER CLINICAL QUESTIONS
   ├── Select answers from large banks
   └── Optionally attach supporting evidence

8. OUTCOME
   ├── Success → Patient review, reputation, reward
   └── Failure → M&M/Peer Review (educational feedback)

[REPEAT with overlapping cases]
```

---

## Case System

**Case Lifecycle:** `queued` → `triaged` → `active` → `submitted` → `reviewed`

**Triage Decisions:**
- **Accept:** Case moves to active (consumes case slot)
- **Defer:** Case stays in queue (may leave if not accepted in time)
- **Reject:** Case removed (small reputation penalty)

**Patient Status Levels:**

| Status | Description | Time Pressure |
|--------|-------------|---------------|
| 🟢 Stable | Comfortable, vitals normal | Hours to days |
| 🟡 Guarded | Concerning signs, monitoring needed | 12-24h |
| 🟠 Declining | Worsening, intervention needed | 6-12h |
| 🔴 Critical | Immediate action required | 2-4h |
| ⚪ Transferred | Moved to higher care (case failed) | N/A |

**Consequences of Delay:**
- Declining: Time bonus forfeited
- Critical: Must submit NOW or patient transferred
- Transferred: Case failed, major reputation loss, M&M review

---

## Time System

| Requirement | Description |
|-------------|-------------|
| Single Global Clock | ONE clock drives all processing |
| Tick-Based | Internal: ticks (e.g., 10 ticks = 1 second at 1x) |
| Speed Control | Pause, 1x, 2x, 5x, 10x |
| Non-Blocking | Processing in background; player can navigate away |

**Timeline UI (KSP-style Warp):**
- Horizontal track showing next 48-72h
- Event markers for pending results (color-coded by case)
- "Warp to Next Event" button (auto-pauses when result ready)
- Cannot warp past patient deterioration threshold or incoming case arrival

---

## Economy

| Component | Description |
|-----------|-------------|
| Starting Funds | Modest budget (e.g., $10,000) |
| Instrument Purchase | Microscope $500, PCR $15,000, etc. |
| Per-Run Cost | Microscopy $5, culture $20, PCR $50 |
| Sample Collection Cost | Blood draw $10, biopsy $100 |
| Case Rewards | Based on difficulty + time bonus |
| Failure Penalties | Wrong: partial reward; abandoned: no reward |

---

## Sample Volume & Redraw System

Each sample has finite volume. Players manage consumption and may face QNS (Quantity Not Sufficient).

| Sample Type | Typical Volume |
|-------------|----------------|
| Blood (venous) | 10 mL |
| Blood (pediatric) | 3 mL |
| Urine | 50 mL |
| Sputum | 5 mL |
| Wound swab | 1 unit (~2 tests) |
| CSF | 3 mL (precious) |
| Tissue biopsy | 1-5 cm³ |

| Test | Volume Required |
|------|-----------------|
| Microscopy slide | 0.1 mL |
| Culture plate | 0.5 mL |
| Biochemical panel | 1.0 mL |
| PCR reaction | 0.2 mL |
| Flow cytometry | 1.0 mL |
| Histology section | 0.5 cm³ |

**Redraw:** Available but costs time and funds; some samples (CSF, bone marrow) have limited redraw options.

---

## Evidence Model

**Hierarchy:** Case → Sample → Artifact → Observation

| Concept | Description | Mutability |
|---------|-------------|------------|
| **Artifact** | Raw machine output (image, reading, sequence) | Immutable |
| **Observation** | Player's structured interpretation of artifact | Immutable |
| **EvidenceItem** | Union: Artifact OR Observation | — |

**Artifact Types:**
- `slide-image` — Microscope
- `culture-plate-image` — Culture colonies
- `gel-image` — Electrophoresis bands
- `plate-reading` — ELISA OD values
- `scatter-plot` — Flow cytometry
- `sequence-data` — Sanger chromatogram
- `test-result` — Biochemical/serology
- `histology-image` — Tissue sections

**Observation Rules:**
- Every Observation references exactly ONE Artifact
- Structured dropdowns/checkboxes only (NO free text)
- Single artifact may have multiple observations (different fields)
- Observations immutable once submitted

---

## Detailed Laboratory Workflows

Each instrument/assay has a realistic multi-step workflow. If a real lab requires multiple instruments or processing steps, the game requires them too.

### Workflow Categories

| Category | Description | Era |
|----------|-------------|-----|
| **Microscopy** | Sample prep → Staining → Viewing → Observation | All |
| **Culture** | Inoculation → Incubation → Colony reading → Subculture/ID | All |
| **Histopathology** | Grossing → Processing → Embedding → Sectioning → Staining → Viewing | Antibiotic+ |
| **Biochemical** | Inoculation → Incubation → Reading | Antibiotic+ |
| **Serology** | Sample loading → Incubation → Reading | All |
| **Molecular (PCR)** | DNA extraction → Amplification → Detection | Molecular+ |
| **Sequencing** | Template prep → Sequencing reaction → Reading | Molecular+ |
| **Flow Cytometry** | Sample prep → Staining → Acquisition → Gating | Modern |
| **Immunoassay** | Plate setup → Incubation → Reading | Molecular+ |

---

### Microscopy Workflow

**Instruments Required:** Staining Bench, Microscope

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Prepare smear | Staining Bench | Load sample, spread on slide | Instant | Unstained slide |
| 2. Fix | Staining Bench | Heat or methanol fix | 1 min | Fixed slide |
| 3. Stain | Staining Bench | Apply stain (Gram, acid-fast, Wright, etc.) | 5-15 min | Stained slide |
| 4. View | Microscope | Load slide, examine | Instant | `slide-image` artifact |
| 5. Record | Microscope | Select observations | Player-driven | Observation(s) |

**Stain Types:**
- **Gram Stain:** Crystal violet → Iodine → Decolorize → Safranin (differentiates bacteria)
- **Acid-Fast (Ziehl-Neelsen):** Carbolfuchsin + heat → Acid-alcohol → Methylene blue (TB, leprosy)
- **Wright/Giemsa:** Blood cell morphology (hematology, parasites)
- **India Ink:** Capsule staining (Cryptococcus)

---

### Histopathology Workflow (Biopsy Processing)

**Instruments Required:** Grossing Station, Tissue Processor, Embedding Station, Microtome, Staining Bench, Microscope

This is the most complex multi-step workflow, reflecting real surgical pathology.

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Grossing | Grossing Station | Cut tissue to fit cassette, describe gross appearance | 15 min | Cassette with tissue |
| 2. Fixation | Grossing Station | Place in formalin | 6-24h | Fixed tissue |
| 3. Processing | Tissue Processor | Dehydrate → Clear → Infiltrate with paraffin | 8-12h | Processed tissue |
| 4. Embedding | Embedding Station | Orient tissue, pour paraffin block | 30 min | Paraffin block |
| 5. Sectioning | Microtome | Cut 4-5μm sections, float on water bath, mount on slides | 15 min | Unstained sections |
| 6. Staining | Staining Bench | H&E or special stains | 30 min | Stained slide |
| 7. Coverslipping | Staining Bench | Apply coverslip | 5 min | Finished slide |
| 8. View | Microscope | Examine under magnification | Instant | `histology-image` artifact |
| 9. Record | Microscope | Document findings | Player-driven | Observation(s) |

**Special Stains (Histopathology):**
- **H&E (Hematoxylin & Eosin):** Standard tissue stain
- **PAS:** Glycogen, fungi
- **Trichrome:** Collagen, fibrosis
- **Silver stains:** Reticulin, organisms
- **Immunohistochemistry:** Specific protein markers (later eras)

**Why This Matters:**
- Biopsies take 24-48h before results available (realistic time pressure)
- Multiple failure points (poor fixation, bad orientation, thick sections)
- Player learns why surgical pathology takes time

---

### Culture Workflow

**Instruments Required:** Culture Incubator, (optional) Anaerobic Chamber

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Inoculate | Culture Station | Streak sample onto agar plate | 5 min | Inoculated plate |
| 2. Incubate | Incubator | Place in appropriate conditions | 18-72h | Grown plate |
| 3. Read | Culture Station | Examine colonies | Instant | `culture-plate-image` artifact |
| 4. Record | Culture Station | Colony morphology observations | Player-driven | Observation(s) |
| 5. Pick (optional) | Culture Station | Isolate colony | 5 min | `isolated-colony` sample |

**Media Types:**
- **Blood Agar:** General purpose, shows hemolysis
- **Chocolate Agar:** Fastidious organisms (Haemophilus, Neisseria)
- **MacConkey Agar:** Gram-negatives, lactose fermentation
- **Mannitol Salt Agar:** Staphylococci selection
- **Sabouraud Agar:** Fungi (longer incubation)
- **Lowenstein-Jensen:** Mycobacteria (weeks of incubation)

**Incubation Conditions:**
- Aerobic 35°C (most bacteria)
- CO₂ enriched (Streptococcus, Haemophilus)
- Anaerobic (Clostridium, Bacteroides)
- Room temperature (some fungi)

---

### Biochemical Testing Workflow

**Instruments Required:** Biochemical Panel Station

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Inoculate | Biochemical Panel | Load isolated colony into test tubes/wells | 5 min | Inoculated panel |
| 2. Incubate | Biochemical Panel | Allow reactions to develop | 4-18h | Developed panel |
| 3. Read | Biochemical Panel | Interpret color changes | Instant | `test-result` artifact |
| 4. Record | Biochemical Panel | Select results | Player-driven | Observation(s) |

**Common Tests:**
- **Catalase:** Bubbles = positive (Staph vs Strep)
- **Coagulase:** Clot = positive (S. aureus)
- **Oxidase:** Purple = positive (Pseudomonas, Neisseria)
- **Indole:** Red = positive (E. coli)
- **Urease:** Pink = positive (Proteus)
- **Triple Sugar Iron (TSI):** Multiple reactions for Enterobacteriaceae
- **IMViC:** Indole, Methyl Red, Voges-Proskauer, Citrate pattern

---

### Antibiotic Susceptibility Workflow (Kirby-Bauer)

**Instruments Required:** Culture Station, Susceptibility Reader

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Prepare lawn | Culture Station | Spread organism evenly on Mueller-Hinton agar | 5 min | Inoculated plate |
| 2. Apply disks | Culture Station | Place antibiotic disks | 5 min | Plate with disks |
| 3. Incubate | Incubator | Overnight incubation | 16-18h | Zones visible |
| 4. Measure | Susceptibility Reader | Measure zone diameters | 10 min | `test-result` artifact |
| 5. Interpret | Susceptibility Reader | S/I/R based on CLSI standards | Player-driven | Observation(s) |

---

### PCR Workflow

**Instruments Required:** DNA Extraction Station, PCR Thermocycler, Gel Electrophoresis

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Extract DNA | Extraction Station | Lyse cells, purify DNA | 30 min | `extracted-dna` sample |
| 2. Set up reaction | PCR Station | Add template, primers, polymerase, dNTPs | 10 min | Reaction tube |
| 3. Amplify | Thermocycler | 25-40 cycles of denaturation/annealing/extension | 2h | `pcr-amplicon` sample |
| 4. Load gel | Gel Electrophoresis | Add amplicons + ladder to lanes | 10 min | Loaded gel |
| 5. Run gel | Gel Electrophoresis | Apply voltage, DNA migrates | 45 min | Separated bands |
| 6. Image | Gel Electrophoresis | UV or stain visualization | Instant | `gel-image` artifact |
| 7. Interpret | Gel Electrophoresis | Compare band sizes | Player-driven | Observation(s) |

---

### Sanger Sequencing Workflow

**Instruments Required:** PCR Station, Sequencing Prep, Capillary Sequencer

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. PCR amplify | Thermocycler | Generate template | 2h | `pcr-amplicon` sample |
| 2. Purify | Sequencing Prep | Remove primers, dNTPs | 30 min | Purified template |
| 3. Sequencing reaction | Thermocycler | Cycle with dye terminators | 2h | `sequencing-reaction` sample |
| 4. Capillary run | Sequencer | Electrophoresis + laser detection | 1-4h | Raw data |
| 5. Base calling | Sequencer | Software interpretation | Instant | `sequence-data` artifact |
| 6. Analyze | Sequencer | Align, compare to references | Player-driven | Observation(s) |

---

### ELISA Workflow

**Instruments Required:** ELISA Plate Setup Station, Plate Washer, Plate Reader

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Coat plate | Setup Station | Add antigen/antibody to wells | 30 min + overnight | Coated plate |
| 2. Block | Setup Station | Add blocking buffer | 1h | Blocked plate |
| 3. Add samples | Setup Station | Load patient samples + controls | 15 min | Loaded plate |
| 4. Incubate | Incubator | Allow binding | 1-2h | Bound plate |
| 5. Wash | Plate Washer | Remove unbound material | 10 min | Washed plate |
| 6. Add conjugate | Setup Station | Enzyme-linked detection antibody | 1h | Conjugate added |
| 7. Wash | Plate Washer | Remove unbound conjugate | 10 min | Washed plate |
| 8. Add substrate | Setup Station | Colorimetric substrate | 15-30 min | Color developed |
| 9. Read | Plate Reader | Measure OD at wavelength | Instant | `plate-reading` artifact |
| 10. Interpret | Plate Reader | Compare to cutoff, controls | Player-driven | Observation(s) |

---

### Flow Cytometry Workflow

**Instruments Required:** Flow Prep Station, Flow Cytometer

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Prepare cells | Flow Prep | Isolate cells from sample | 30 min | Cell suspension |
| 2. Stain | Flow Prep | Add fluorescent antibodies | 30 min | Stained cells |
| 3. Wash | Flow Prep | Remove unbound antibodies | 15 min | Washed cells |
| 4. Acquire | Cytometer | Run sample, detect events | 5-15 min | Raw FCS data |
| 5. Gate | Cytometer | Define populations | Player-driven | `scatter-plot` artifact |
| 6. Interpret | Cytometer | Identify abnormal populations | Player-driven | Observation(s) |

---

### Serology/Agglutination Workflow

**Instruments Required:** Serology Station

| Step | Instrument | Action | Time | Output |
|------|------------|--------|------|--------|
| 1. Mix | Serology Station | Combine serum + antigen on slide/tube | 5 min | Mixed sample |
| 2. Rotate/incubate | Serology Station | Allow agglutination | 2-15 min | Reaction visible |
| 3. Read | Serology Station | Look for clumping | Instant | `test-result` artifact |
| 4. Record | Serology Station | Positive/negative | Player-driven | Observation(s) |

**Test Types:**
- **Widal Test:** Typhoid fever (Salmonella)
- **RPR/VDRL:** Syphilis screen
- **ASO Titer:** Streptococcal infection
- **Monospot:** Infectious mononucleosis
- **Blood typing:** ABO, Rh

---

### Workflow Summary: Intermediate Products

If a real lab requires two separate instruments, the game requires two.

| Source Instrument | Intermediate Product | Next Instrument | Final Artifact |
|-------------------|---------------------|-----------------|----------------|
| Grossing Station | Cassette with tissue | Tissue Processor | Processed tissue |
| Tissue Processor | Processed tissue | Embedding Station | Paraffin block |
| Embedding Station | Paraffin block | Microtome | Sections on slides |
| Microtome | Unstained sections | Staining Bench | Stained slide |
| DNA Extraction | `extracted-dna` | PCR Thermocycler | `pcr-amplicon` |
| PCR Thermocycler | `pcr-amplicon` | Gel Electrophoresis | `gel-image` |
| PCR Thermocycler | `pcr-amplicon` | Sequencing Prep | `sequencing-reaction` |
| Sequencing Prep | `sequencing-reaction` | Capillary Sequencer | `sequence-data` |
| Culture | Colonies | Colony Pick | `isolated-colony` |
| Culture | `isolated-colony` | Biochemical Panel | `test-result` |
| Culture | `isolated-colony` | Microscope (Gram) | `slide-image` |
| Flow Prep | Stained cells | Flow Cytometer | `scatter-plot` |

---

## Derived Samples & Subculture Tracking

Every derived sample tracks `parentSampleId`, creating ancestry trees:

```
Patient Blood Sample (original)
 ├── Blood Agar Plate #1
 │    ├── Isolated Colony A
 │    │    ├── Gram Stain Slide
 │    │    └── Biochemical Panel
 │    └── Isolated Colony B
 └── Chocolate Agar Plate #2
```

---

## Multi-Instance Instrument System

Players can own multiple physical instances of the same instrument type.

**Instance Properties:**
- Unique instance ID
- Busy/idle status
- Currently loaded samples
- Active run reference

**Selection Flow:**
1. Navigate to instrument type
2. UI shows grid of owned instances with status
3. Select idle instance to use
4. Busy instances show progress (read-only)

---

## Batch/Multiplex Run System

Some instruments support multiple samples from multiple cases in a single run.

| Instrument | Batch Type | Max Positions | Mixed Cases? |
|------------|-----------|---------------|--------------|
| ELISA | plate-96 | 96 | Yes |
| PCR | plate-96 | 96 | Yes |
| Gel Electrophoresis | lanes | 12-20 | Yes |
| Sanger | plate-96 | 96 | Yes |
| Flow Cytometry | queue | 48 | Yes |
| Tissue Processor | rack | 40 cassettes | Yes |

**Position Addressing:**
- ELISA/PCR: Well ID (`A1`, `B3`, `H12`)
- Gel: Lane number (`lane-1`, `lane-12`)
- Flow: Tube number (`tube-1`, `tube-48`)
- Tissue Processor: Cassette slot (`slot-1`, `slot-40`)

---

## Structured Observation System

**Rule:** If a real scientist must interpret output, the player makes a structured Observation.

**ObservationDefinition Properties:**
- Field ID and label
- Input type: `single-select | multi-select | numeric | boolean`
- Options (for selects) with IDs and labels
- Numeric range (min, max, unit)

**Observation Constraints:**
- Single-select: ONE value only
- Multi-select: multiple values allowed
- No conflicting observations (final once recorded)
- Different fields OK on same artifact

---

## Instrument Errors & Control Samples

**Control Types:**

| Type | Purpose |
|------|---------|
| Positive Control | Confirms assay working |
| Negative Control | Confirms no contamination |
| Reagent Blank | Confirms reagents clean |
| Reference Standard | Calibrates quantitative results |

**Error Types:**
- Control Failure: Invalidate run, repeat
- Ambiguous Result: Re-run or confirmatory test
- Technical Failure: Repair or use different instance
- Contamination: Re-run with fresh samples

**Error Frequency (by difficulty):**

| Difficulty | Control Failure Rate | Ambiguous Rate |
|------------|---------------------|----------------|
| Easy | 0% | 5% |
| Medium | 5% | 10% |
| Hard | 10% | 15% |
| Realistic | 15% | 20% |

---

## Clinical Questions & Answering

**Default 4-Question Framework:**
1. **Etiology:** What organism/condition is causing this?
2. **Category:** What kind of pathogen? (Gram-pos, Gram-neg, Virus, Fungus, etc.)
3. **Immediate Action:** What do I do now?
4. **Specific Treatment:** What specific therapy is indicated?

**Evidence Linking (by difficulty):**
- Easy: No linking required
- Medium: Attach at least 1 evidence item
- Hard: Attach at least 2; game validates relevance

**Era-Dependent Answers:** Answer banks filtered by current era.

---

## Treatment Administration & Patient Outcome

**Treatment Flow:**
1. Select recommended treatment
2. Physically administer (era-appropriate interaction)
3. Patient outcome plays out over game-time
4. Success/failure shown with narrative

**Era-Appropriate Treatments:**

| Era | Treatment Types |
|-----|-----------------|
| Golden Age | Surgical debridement, Antiseptic wash, Supportive care |
| Antibiotic Era | Pills, Injections, IV drips |
| Molecular Era | Targeted therapy, Combination regimens |
| Modern Era | Personalized medicine, Immunotherapy |

---

## Stakes & Consequences

**Why Diagnose Correctly?**

| Motivation | How It Works |
|------------|--------------|
| Visible Impact | Lives saved counter, outbreaks contained |
| Patient Outcomes | Narrative consequences |
| Lab Capacity | Better performance → more funds → bigger lab |
| Disease Arms Race | Fall behind → diseases outpace capabilities |

**What Funds Buy:** Instruments, derived technologies, infrastructure, consumables, assistants

**What Funds Do NOT Buy:** Revolutionary discoveries, era progression, mastery

**Fail States (Soft):**

| Failure | Consequence | Recovery |
|---------|-------------|----------|
| Wrong diagnosis | M&M review, patient harm narrative | Learn from review |
| Can't handle volume | Outbreaks spread, visible death toll | Expand capacity |
| Fall behind on research | New diseases you can't diagnose | Pursue Discovery Challenges |

---

## M&M / Peer Review (Failure Education)

When player fails, detailed educational review explains what went wrong.

**Review Components:**
- Diagnosis Comparison: player answer vs. correct
- Evidence Audit: ✅ correct, ❌ wrong, ⚠️ missed
- Artifact Replay: re-view with annotations
- Missed Tests: what should have been run
- Patient Narrative: consequence of error
- Key Learning Points: 2-3 bullet summary

---

## Reference Library

Auto-populates when player acquires compatible artifacts.

**Library-Compatible Items:**
- Primer sets (from PCR runs)
- Reference sequences (from Sanger)
- Reference strains (purchased/earned)
- Antibody panels (from flow cytometry)
- Gel ladders (purchased)

**Scope:** Not required for initial prototype.

---

## UI Screens Required

### Primary Screens (8 total)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **Main Menu** | Start game, load save, settings, credits |
| 2 | **City View** | Epidemiological meta-layer, disease burden, outbreaks, news feed, lab impact |
| 3 | **Lab View** | Top-down grid of instruments, navigation to each station, case queue badge |
| 4 | **Case Triage** | Incoming case queue, review vitals/synopsis, accept/defer/reject |
| 5 | **Case Dashboard** | Active case overview, samples, runs, notebook, patient status, timeline |
| 6 | **Instrument View** | Generic template for all instruments (left: stage, right: controls/inventory/notebook) |
| 7 | **Diagnosis Submission** | Answer clinical questions, link evidence, submit |
| 8 | **M&M Review** | Post-case failure education, evidence audit |

### Secondary Screens (6 total)

| # | Screen | Purpose |
|---|--------|---------|
| 9 | **Lab Designer** | Grid editor for placing/relocating instruments, infrastructure upgrades |
| 10 | **Instrument Catalog** | Browse/purchase instruments, view prerequisites |
| 11 | **Reference Library** | Browse primers, sequences, strains, panels |
| 12 | **Case History** | Review completed cases, notebooks, outcomes |
| 13 | **Discovery Challenge** | Story-driven experiments to unlock revolutionary tech |
| 14 | **Settings/Help** | Game settings, manual, tutorials |

### UI Component Summary

| Component | Used In |
|-----------|---------|
| **Header Bar** | All screens (funds, time, speed, case switcher, era) |
| **Timeline Track** | Case Dashboard, Lab View (pending events, warp) |
| **Inventory Panel** | Instrument View (samples, derived samples, tree view) |
| **Notebook Panel** | Case Dashboard, Instrument View (artifacts, observations) |
| **Observation Form** | Instrument View (structured dropdowns) |
| **Batch Grid/Lane View** | Instrument View for batch instruments (well/lane selection) |
| **Patient Status Badge** | Case Dashboard, Case Switcher |
| **Sample Tree** | Inventory Panel (ancestry visualization) |

### Instrument View Variations

The Instrument View is a template with variations per instrument type:

| Instrument Type | Stage Area (Left) | Right Panel Specifics |
|-----------------|-------------------|----------------------|
| Microscope | Slide image viewer with zoom/pan | Stain selection, observation form |
| Culture | Plate image with colony markers | Media selection, incubation status |
| Biochemical | Panel of test wells with colors | Result reading form |
| Grossing Station | Tissue image, cassette grid | Gross description form |
| Tissue Processor | Rack of cassettes with progress | Processing status |
| Embedding Station | Block mold with tissue orientation | Orientation controls |
| Microtome | Section visualization | Thickness setting |
| PCR | Well plate visual | Primer selection, cycle config |
| Gel | Lane image with band markers | Ladder comparison, band sizing |
| Flow Cytometer | Scatter plot with gating tools | Panel selection, population gates |
| ELISA | 96-well plate heatmap | Cutoff setting, control validation |
| Sequencer | Chromatogram viewer | Sequence alignment tools |

---

## Case Complexity Progression

| Game Stage | Samples | Instruments | Derived Samples | Time Pressure | Precision |
|------------|---------|-------------|-----------------|---------------|-----------|
| Early (Golden Age) | 1 | 1-2 | None | Low | Broad |
| Mid (Antibiotic Era) | 1-2 | 3-4 | Some | Medium | Specific |
| Late (Molecular Era) | 2-3 | 4-6 | Many | High | Molecular |
| End (Modern Era) | 3+ | 6+ | Complex trees | Critical | Genomic |

---

## Vertical Slice Test Cases

| # | Case Name | Era | Key Test |
|---|-----------|-----|----------|
| 1 | Wound Infection | Golden Age | Basic bacterial workflow |
| 2 | Strep Throat | Golden Age | Serology confirmation |
| 3 | TB Suspect | Golden Age | Long incubation, acid-fast staining |
| 4 | MRSA Outbreak | Molecular | PCR workflow, batch, era-gated diagnosis |
| 5 | HIV Screening (Batch) | Molecular | ELISA batch, mixed-case plate |
| 6 | Multiple Myeloma | Modern | Non-infectious, protein electrophoresis |
| 7 | Leukemia Workup | Modern | Flow cytometry, cell populations |
| 8 | Breast Biopsy | Modern | Full histopathology workflow |
| 9 | UTI | Antibiotic | Biochemical panel |
| 10 | Food Poisoning | Antibiotic | Multi-patient batching, outbreak tracing |

---

## Data Model

### Core Entities

#### CaseDefinition
```
id, title, story, era, difficulty, availableSamples, correctConditionId,
questions, reward, timeLimitTicks, requiredReputationToUnlock
```

#### ActiveCase
```
id, caseDefinitionId, status, startedAtTick, samples[], runIds[],
artifactIds[], observations[], answers[]
```

#### Sample
```
id, caseId, type, source, parentSampleId, collectedAtTick, properties
```

#### InstrumentType
```
id, name, description, era, purchaseCost, runCost, processingTicks,
acceptsSampleTypes[], producesSampleTypes[], supportsBatch, batchConfig,
observationDefinitionIds[]
```

#### InstrumentInstance
```
id, instrumentTypeId, status, currentRunId, acquiredAtTick
```

#### Run
```
id, instrumentInstanceId, inputs[], startedAtTick, completedAtTick,
status, retrieved, config, artifactIds[]
```

#### Artifact
```
id, runId, sampleId, caseId, type, positionKey, createdAtTick,
retrievedAtTick, data
```

#### Observation
```
id, artifactId, runId, sampleId, caseId, observationDefinitionId,
value, recordedAtTick, positionKey
```

#### PlayerState
```
funds, reputation, currentEra, ownedInstanceIds[], unlockedInstrumentTypeIds[],
maxActiveCases, completedCaseIds[], activeCaseIds[], libraryItemIds[]
```

---

## Summary

**BioLogic** is a lab-building game where your laboratory fights disease across 140 years of medical history.

**Core Philosophy:**
- The lab IS the game—cases test your capabilities
- Understanding IS progression—experts advance faster
- Consequences create stakes—failures have visible impact without game over

**Key Differentiators:**
- Realistic multi-step workflows (histopathology takes 48h, not instant)
- Every intermediate product tracked (tissue → block → section → slide)
- Era-appropriate limitations and vocabulary
- Agent-playable via Playwright MCP

**First Prototype Target:** Golden Age (1880s) lab with microscopy, culture, staining, and basic serology. Multi-step cases with treatment administration and city-scale impact visibility.

---

## Appendix: Historical Workflow Accuracy Notes

### Golden Age (1880-1920)
- **No refrigeration** — samples processed same-day or iced
- **Flame sterilization** — Bunsen burners, not autoclaves initially
- **Hand-drawn images** — no photography for microscopy initially
- **Limited stains** — Gram stain (1884), Acid-fast (1882), basic dyes

### Antibiotic Era (1940-1970)
- **Refrigerators common** — overnight cultures feasible
- **Photography available** — documentation improves
- **Kirby-Bauer standardized** — zone diameters become meaningful
- **Automated incubators** — temperature control reliable

### Molecular Era (1980-2000)
- **PCR invented (1983)** — revolutionary but manual initially
- **Gel electrophoresis standard** — but manual photography/interpretation
- **Sanger sequencing (1977)** — automated by late 1980s
- **Early flow cytometry** — but expensive, limited availability

### Modern Era (2000+)
- **qPCR/RT-PCR** — real-time quantification
- **Multi-color flow cytometry** — 10+ colors routine
- **Mass spectrometry for ID** — MALDI-TOF revolutionizes microbiology
- **NGS available** — but not yet routine for diagnostics
- **Automation everywhere** — sample tracking, result integration
