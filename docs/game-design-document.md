# BioLogic: Game Design Document

**Status:** Design Document (Ready for Prototyping)

---

## Vision Statement

**BioLogic** is a lab-building game where your laboratory IS the artifact of your skill. You design, build, and optimize a diagnostic lab that fights disease across 140 years of medical history. Cases test your lab's capabilities. Efficiency is discovered through play, not prescribed. Discovery drives progression.

**The Core Insight:** In Factorio, you build a factory to launch a rocket. In BioLogic, you build a lab to fight disease. The lab IS the game. Cases are the test of your lab. The better you understand the science, the better your lab performs.

**Like Kerbal Space Program teaches rocket science by making you fly the rocket, BioLogic teaches medicine and biotech by making you do the work:** gather evidence, interpret uncertain results, and manage time/cost tradeoffs under realistic constraints. But more than that—you build the infrastructure that makes diagnosis possible at scale.

**Historical Journey:**
The player doesn't just use modern tools—they LIVE the 140-year journey of medical science. Starting in the 1880s with basic microscopy, progressing through germ theory, antibiotics, molecular biology, and genomics. Each era presents unique challenges, technologies, and ways of thinking. The player understands not just HOW each tool works, but WHY it was invented and WHAT problems it solved.

**Primary Learning Goal:** 
The player must deeply understand the purpose, history, and operation of every instrument/assay/test/algorithm before they can automate it or add it to a workflow. This isn't grinding—it's proving comprehension. An expert player who already understands PCR can progress faster than a novice, because understanding IS the progression mechanic.

**Specialties You Emulate:**
- **Infectious Disease / Microbiology Lab:** Gram stains, culture plates, biochemical tests, susceptibility testing, ELISAs, PCR to identify pathogens and choose antibiotics
- **Oncology / Hematopathology Team:** Microscopy, immunohistochemistry, flow cytometry, molecular tests to classify cancers and guide therapy
- **Radiology / Physiology Workflow:** Imaging outputs and monitoring to narrow differential diagnoses
- **Genetics / Molecular Diagnostics + Bioinformatics:** Sanger/NGS-style sequencing artifacts and analysis algorithms (alignment, variant calling/annotation, phylogenetics/outbreak clustering, GWAS/polygenic-risk when relevant) to translate biological data into clinical meaning

**Build Targets Mirror Real Labs:**
- Instruments produce concrete artifacts (images, plates, gels, plots, sequences, numeric readouts)
- Interpretation layers (structured observations and analysis algorithms) convert artifacts into decisions
- The player connects the dots to reach a diagnosis the "doctor" can act on

---

## Game Design

### Player Fantasy & Learning Goals

**Player Fantasy:**
- You are a medical detective running your own clinic/lab
- From receiving sick patients to solving the case through lab work and interpretation
- Like Kerbal Space Program for biology: learn real science through playful failure and iteration
- "I diagnosed a patient with TB using just a microscope and culture!" feeling

**Target Audience:**
- Ages 10–100, no biology background required
- Curious minds who enjoy puzzle games, management sims, or science
- Medical/science students looking for engaging practice

**Learning Goals:**
1. **Scientific Thinking:** Hypothesis → Test → Interpret → Refine
2. **Lab Literacy:** What instruments exist, what they actually do, why they matter
3. **Diagnostic Reasoning:** How clinicians narrow down possibilities systematically
4. **Historical Context:** How medicine evolved (era-unlocked instruments)
5. **Economic Tradeoffs:** Cheap tests first vs. expensive definitive tests

**Core Emotional Loop:**
- Curiosity (what's wrong?) → Investigation (run tests) → Interpretation (what does this mean?) → Satisfaction (solved it!) or Failure (learn and retry)

---

### Core Design Philosophy

**"The Lab IS The Game"**

This is the fundamental reframe from earlier designs. The lab is not infrastructure supporting cases—the lab is the artifact of your skill. Cases test your lab.

| Old Mental Model | New Mental Model |
|------------------|------------------|
| Cases are the game, lab is infrastructure | Lab-building is the game, cases are the test |
| Follow the story to unlock tech | Discovery happens when you push limits |
| Grind mastery points to progress | Understanding IS progression |
| Linear progression through eras | Emergent optimization within eras |

**What This Means In Practice:**
- You design your lab, optimize it, expand it
- Cases challenge your lab: Can it handle this? Fast enough? Accurately enough?
- You encounter cases your current lab can't solve → THAT drives research
- Efficiency is discovered through play, not prescribed by the designer
- Expert players progress faster because they understand the science

**Anti-Rigidity Principles:**
- No single "correct" lab layout—there are tradeoffs
- Multiple valid approaches to the same case
- Player agency over HOW to build and optimize
- The game teaches through play, not tutorials
- Understanding can be proven by using tools correctly, not by grinding

---

### Epidemiological Meta-Layer

Your city has diseases. Your lab fights them. This creates stakes without "game over."

**City View (Meta-layer):**
```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR CITY (Meta-layer)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DISEASE BURDEN:                YOUR LAB'S IMPACT:          │
│  ├── Wound Sepsis: ████████░░    Patients treated: 47        │
│  ├── Consumption: ██████░░░░      Lives saved: ~23            │
│  ├── Cholera: ███░░░░░░░         Outbreaks contained: 1      │
│  └── [Unknown]: █░░░░░░░░░       ← Next discovery target    │
│                                                             │
│  DISTRICT ALERTS:                                           │
│  ⚠️ Factory District: Typhoid suspected (12 cases)           │
│     → Your lab could help IF you had culture capacity       │
│                                                             │
│  NEWS FEED: (era-appropriate)                               │
│  📰 "Mysterious illness strikes tenement block"              │
│  📰 "Dr. Koch arrives to inspect city sanitation"            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why City-Scale?**
- More realistic impact for a single lab
- Player actions have visible, proportional consequences
- Scales up in later eras (city → region → national reference lab)
- Creates neighborhood/district familiarity

| Element | Function |
|---------|----------|
| **Disease Prevalence** | Shows what's out there; changes over time and with your impact |
| **Active Outbreaks** | Real events you can respond to; tests lab capacity |
| **Your Impact** | Lives saved, outbreaks contained—visible consequence of good work |
| **Unknown Diseases** | Mysterious cases that drive discovery; player diagnoses to "unlock" the disease name |
| **News Feed** | Era-appropriate information (newspapers → telegraph → radio → digital); upgradeable accuracy |

**Stakes Through Consequences (Not Game Over):**
- Outbreaks spread if you can't handle the case volume
- Death toll rises visibly when you fail
- Success shows lives saved, communities protected
- The world keeps going—you do better next time
- **No "game over"—failure is living with consequences**

**Disease as Antagonist:**
- Diseases evolve (antibiotic resistance appears)
- New pathogens emerge unexpectedly
- Your tools become obsolete if you don't advance
- The "enemy" adapts to your strategies (arms race)

**Historical Disease Discovery:**
Some cases present as "Unknown Illness" with only symptoms. Successfully diagnosing the cause unlocks:
- The disease name in your compendium
- Understanding of transmission/treatment
- Potentially a Discovery Challenge to find a cure/test

---

### Technology Acquisition (Three Tiers)

Not everything should be a hand-crafted discovery challenge. That doesn't scale. Instead:

| Tier | How Acquired | Examples | Quantity |
|------|--------------|----------|----------|
| **Revolutionary Discoveries** | Story-driven discovery challenges | Germ theory, Gram stain, PCR, antibiotics | 15-25 total |
| **Derived Technologies** | Unlocked in waves with base tech; must purchase | RT-PCR, qPCR, ddPCR (after PCR discovery) | 40-60 total |
| **Consumables & Variants** | Purchase with funds anytime | Specific primers, antibody panels, reagent kits | Unlimited |

**Revolutionary Discoveries (Tier 1):**
- Hand-crafted story moments (15-25 across the game)
- Each is a playable experiment/puzzle
- Success unlocks a new paradigm of technology
- Cannot be skipped or purchased
- Example: "You're investigating why some wounds fester. You notice tiny organisms under the microscope..."

**Derived Technologies (Tier 2):**
- Available once the base tech is discovered
- Must be purchased with funds
- Expert players can use them immediately if they understand them
- Novice players need to experiment/learn
- Example: After discovering PCR, RT-PCR and qPCR become purchasable

**Consumables (Tier 3):**
- Always available for purchase within your era
- Operational costs for running tests
- Variety and customization
- Example: Different primer sets, culture media types, staining kits

**Expertise as Speed:**
- All derived technologies are available once base tech exists
- An expert who knows qPCR can use it immediately after purchase
- A novice needs to learn—but through DOING, not tutorials
- Understanding IS the gate, not arbitrary grind

---

### Automation & Efficiency Progression

Manual skill is the early game. Automation is the reward for mastery. Throughput scaling is THE progression mechanic.

**Progression Through Efficiency:**

| Stage | Player Activity | Lab Capability |
|-------|-----------------|----------------|
| **Early Game** | Everything manual, one case at a time | Learning each technique hands-on |
| **Mid Game** | Batching, workflow design, assistants | 10+ cases/day, standard protocols |
| **Late Game** | Automation, SOPs, QC oversight | 100+ cases/day, handle edge cases only |
| **End Game** | High-throughput workcells, algorithms | Outbreak-scale response |

**The Mastery → Automation Contract:**
- You MUST prove you understand a technique before automating it
- Proof = successfully using it on multiple cases, correct observations
- Once proven, you can:
  - Train an assistant to run the protocol
  - Add it to an automated workflow
  - Trust the output without manual review (for routine cases)
- Edge cases still require your expertise

**What Makes Each Era Challenging:**
This needs historical research, but the principle:
- Each era had its own bottlenecks and challenges
- Automation wasn't always available—what DID scientists do?
- The game should reflect those real constraints
- As technology advances, new forms of efficiency become possible

**Historical Efficiency (Research Needed):**

| Era | Bottleneck | Efficiency Options |
|-----|------------|-------------------|
| Golden Age | Everything manual, no standards | Trained assistants, standardized protocols |
| Antibiotic Era | Culture incubation time, manual testing | Batch processing, better media |
| Molecular Era | Reaction setup, gel imaging | Thermocyclers, digital imaging |
| Modern Era | Data analysis, interpretation | Automation, algorithms, AI |

**Player Agency in Optimization:**
- No single "correct" workflow
- Players discover what works through experimentation
- Efficiency is its own reward (handle more cases → more impact → more funds)
- Like Factorio: the ratios aren't told to you, you figure them out

---

### Lab Management & Designer

The lab is a physical space the player builds and manages. Instruments aren't just available—they must be purchased, placed, and sometimes maintained.

**Core Concept:**
- **Top-Down Lab View:** Player sees their lab from above, with a grid-based layout
- **Instrument Placement:** Purchased instruments are placed in the lab; position affects workflow
- **Infrastructure Requirements:** Some instruments require power outlets, ventilation, biosafety hoods, etc.
- **Era-Appropriate Labs:** Lab environment evolves with technology era (wooden benches → laminar flow hoods)

**Lab Layout System:**

| Feature | Golden Age | Antibiotic Era | Molecular Era | Modern Era |
|---------|------------|----------------|---------------|------------|
| **Floor Space** | Small clinic room | Dedicated lab wing | Multi-room facility | Automated core lab |
| **Power** | Gas burners only | 110V outlets limited | 110V/220V everywhere | Uninterruptible power |
| **Biosafety** | Open benches | Basic ventilation | BSL-2 hoods | BSL-3 suites (upgradable) |
| **Storage** | Ice boxes | Refrigerator | -20°C freezer | -80°C, LN2 tanks |
| **Contamination Risk** | High | Medium | Low | Very Low (if maintained) |

**Instrument Placement Rules:**
- Instruments occupy grid cells (1x1 for microscope, 2x1 for flow cytometer, etc.)
- Some instruments require adjacency (PCR thermocycler near gel station)
- Heavy instruments can't be moved once placed (or cost funds to relocate)
- Upgrades (biosafety hood, ventilation) unlock placement of certain instruments

**Lab Management Actions:**
- **Buy Instrument:** From catalog, costs funds, requires space + prerequisites
- **Place Instrument:** Drag to empty grid cell that meets requirements
- **Upgrade Infrastructure:** Add power, ventilation, biosafety to zones
- **Relocate Instrument:** Move to different cell (costs funds, takes time)
- **Decommission Instrument:** Remove old equipment (recoup some funds)

**Contamination & Environment:**
- Improper placement can increase contamination risk
- Contaminated samples may give false results
- Era-appropriate controls help (Golden Age: flame sterilization; Modern: UV hoods)
- Future consideration: maintenance schedules, calibration

**UI Concept (Lab Designer View):**
```
┌────────────────────────────────────────────────────────┐
│ LAB DESIGNER                    [💰 $12,500] [Era: 2] │
├────────────────────────────────────────────────────────┤
│ ┌──────┬──────┬──────┬──────┬──────┬──────┐          │
│ │ HOOD │ HOOD │      │      │ SINK │ SINK │          │
│ ├──────┼──────┼──────┼──────┼──────┼──────┤          │
│ │ 🔬   │      │ 🧫   │ 🧫   │      │ ❄️   │          │
│ │Micro │ OPEN │Cult-1│Cult-2│ OPEN │Fridge│          │
│ ├──────┼──────┼──────┼──────┼──────┼──────┤          │
│ │      │ 🧪   │ 🧪   │      │      │      │          │
│ │ OPEN │PCR-1 │ GEL  │ OPEN │ OPEN │ OPEN │          │
│ └──────┴──────┴──────┴──────┴──────┴──────┘          │
│                                                        │
│ [Buy Instrument ▼]  [Upgrade Zone]  [📋 Catalog]      │
└────────────────────────────────────────────────────────┘
```

**Why Lab Management?**
- Supports long-term vision (3D Overcooked-style world)
- Creates meaningful progression (lab grows with reputation)
- Adds strategic layer (layout optimization)
- Historically accurate (labs evolved dramatically over time)

---

### Interaction Model & Agent Compatibility

The game must be playable by both humans AND coding agents (via Playwright MCP).

**Click-to-Interact Model:**
- Player clicks on instruments in the lab view to use them
- No real-time character control (avatar walks automatically if needed)
- All interactions are discrete clicks, selections, and form inputs
- No timing-based gameplay that would break agent control

**Why This Matters:**
- Playwright MCP can take snapshots and click elements
- Agents can't handle real-time WASD movement or physics
- Turn-based/click-based allows agents to play the full game
- Human players still get satisfying interactions

**Lab Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│ LAB VIEW (1885)                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [🔬 Microscope]     [🧫 Culture Station]                  │
│   "Idle"              "Incubating (18h left)"               │
│                                                              │
│   [🧪 Staining Bench] [⚗️ Reagent Shelf]                    │
│   "Ready"             "Gram stain, Antiseptic"              │
│                                                              │
│   [🛏️ Patient Bay]   [📋 Case Board]                       │
│   "2 patients"        "3 active cases"                      │
│                                                              │
│   Click any station to interact                              │
└─────────────────────────────────────────────────────────────┘
```

**Interaction Patterns:**
| Action | Human | Agent (Playwright) |
|--------|-------|-------------------|
| Select instrument | Click instrument tile | `browser_click(ref="microscope-tile")` |
| Load sample | Drag sample badge OR click dropdown | `browser_click(ref="sample-dropdown")` |
| Make observation | Select from dropdown | `browser_select_option(ref="shape-select")` |
| Submit diagnosis | Fill form, click submit | `browser_fill_form(...)` |

**Prototype Constraint:**
All gameplay must be testable via `mcp_playwright_browser_snapshot` + `mcp_playwright_browser_click`. If an interaction can't be captured in a snapshot and executed with a click, it needs redesign.

---

### Core Gameplay Loop

Supports multiple cases simultaneously with automatic case arrival and triage. Cases arrive throughout the day; player decides which to accept based on triage. Patient status can deteriorate if player is too slow.

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE GAMEPLAY LOOP                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CASES ARRIVE (Automatic)                                 │
│     └── Cases appear in queue throughout game-time           │
│                                                              │
│  2. TRIAGE                                                   │
│     ├── Review vitals, synopsis, urgency                     │
│     └── Accept, Reject, or Defer case                        │
│                                                              │
│  3. COLLECT SAMPLES (uses Sample Volume)                     │
│     ├── Choose which samples to take (costs volume)          │
│     └── QNS risk if volume depleted → request redraw         │
│                                                              │
│  4. RUN TESTS (can interleave multiple cases here)          │
│     ├── Select instrument (may need controls)                │
│     ├── Load sample (+ positive/negative controls)           │
│     ├── Configure/run (processing takes game-time)           │
│     └── Collect result artifact                              │
│                                                              │
│  5. INTERPRET & RECORD                                       │
│     ├── Examine result artifact (gel, plate, slide, etc.)   │
│     ├── Validate controls (were pos/neg correct?)            │
│     └── Record observations in lab notebook                  │
│                                                              │
│  6. MONITOR PATIENT STATUS                                   │
│     └── Patient may deteriorate if diagnosis delayed         │
│                                                              │
│  7. ANSWER CLINICAL QUESTIONS                                │
│     ├── Select answers from large banks                      │
│     └── Optionally attach supporting evidence (anti-guessing)│
│                                                              │
│  8. OUTCOME                                                  │
│     ├── Success → Patient review, reputation, reward         │
│     └── Failure → M&M/Peer Review (educational feedback)     │
│                                                              │
│  [REPEAT with overlapping cases]                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Steps 3-5 can be interleaved across multiple active cases. While culture plate A incubates (24h game-time), run microscopy on case B.

---

### Case System Requirements

Cases arrive automatically. Player triages incoming cases and monitors patient status.

| Requirement | Description |
|-------------|-------------|
| **Automatic Case Arrival** | Cases appear in queue throughout game-time (not player-initiated) |
| **Triage System** | Player reviews incoming cases and decides: Accept, Reject, or Defer |
| **Multiple Active Cases** | Player can have N cases in-flight simultaneously (start with max 3, unlock more) |
| **Case Switching** | Quick switch between active cases; UI shows active case list with status badges |
| **Per-Case Context** | All data is scoped to a case: samples, runs, results, observations, answers |
| **Case Lifecycle** | `queued` → `triaged` → `active` → `submitted` → `reviewed` |
| **Patient Status** | Patient condition tracked; can deteriorate if diagnosis delayed |
| **Case Abandonment** | Player can abandon (reputation penalty) |

**Automatic Case Arrival:**
- Cases enter queue at semi-random intervals based on time of day and reputation
- Higher reputation = more complex cases offered
- Queue has limited slots (3-5); oldest cases may leave if not triaged
- Visual indicator: "3 cases waiting" badge

**Triage System:**

```
┌─────────────────────────────────────────────────────────────┐
│ INCOMING CASES                                   [3 waiting]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 URGENT: Factory Worker, 35yo male                   │ │
│ │ Chief Complaint: Festering wound, 4 days               │ │
│ │ Vitals: Temp 101°F, HR 95, BP 130/85                  │ │
│ │ Synopsis: Machinery injury with purulent drainage      │ │
│ │                                                         │ │
│ │ Urgency: ████████░░ High                               │ │
│ │ Complexity: ██░░░░░░░░ Low                             │ │
│ │ Expected Time: ~2h                                      │ │
│ │                                                         │ │
│ │ [Accept Case]  [Defer (stays in queue)]  [Reject]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟡 ROUTINE: Office Worker, 28yo female                 │ │
│ │ Chief Complaint: Painful urination, 3 days             │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Triage Decisions:**

| Action | Effect |
|--------|--------|
| **Accept** | Case moves to active; starts consuming one of your case slots |
| **Defer** | Case stays in queue; may leave if not accepted within time limit |
| **Reject** | Case removed from queue; small reputation penalty (refused patient) |

**Case State Must Include:**
- All collected samples (with remaining volume)
- All runs performed (with results)
- All observations recorded
- All questions answered (with optional supporting evidence)
- Time tracking (start time, elapsed)
- Patient status (stable, declining, critical)

---

### Real-Time Patient Status

Patients aren't static. Their condition can change during the case, creating time pressure and consequences for slow diagnosis.

**Patient Status Levels:**

| Status | Icon | Description | Time Pressure |
|--------|------|-------------|---------------|
| **Stable** | 🟢 | Patient comfortable, vitals normal | Low — hours to days |
| **Guarded** | 🟡 | Some concerning signs, monitoring needed | Medium — 12-24h |
| **Declining** | 🟠 | Condition worsening, intervention needed | High — 6-12h |
| **Critical** | 🔴 | Immediate action required | Urgent — 2-4h |
| **Transferred** | ⚪ | Patient moved to higher care (case failed) | N/A |

**Status Progression:**
- Each case has a **deterioration schedule** (hidden from player)
- Example: Wound infection starts Stable → Guarded at +12h → Declining at +24h → Critical at +36h
- More severe infections progress faster
- Some conditions are stable indefinitely (routine screening)

**Status Change Triggers:**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ PATIENT STATUS CHANGE                                    │
├─────────────────────────────────────────────────────────────┤
│ Case #3: Wound Infection                                    │
│                                                              │
│ Status changed: 🟢 Stable → 🟡 Guarded                       │
│                                                              │
│ "Patient is developing a fever. Wound appears more          │
│  erythematous. Lab results are needed soon."                │
│                                                              │
│ Time to Critical: ~18h                                       │
│                                                              │
│              [View Case]  [Dismiss]                          │
└─────────────────────────────────────────────────────────────┘
```

**Consequences of Delay:**

| If Status Reaches... | Consequence |
|----------------------|-------------|
| **Declining** | Time bonus forfeited; warning in case notes |
| **Critical** | Must submit diagnosis NOW or patient transferred |
| **Transferred** | Case failed; major reputation loss; M&M review |

**Patient Status in UI:**
- Active case list shows status icon next to each case
- Timeline shows patient status warnings: "⚠️ Patient A declining in ~6h"
- Cannot warp past status transitions (forces player attention)
- Notebook shows patient status changes as entries

**Status Display (Case Header):**

```
┌─────────────────────────────────────────────────────────────┐
│ CASE #3: Wound Infection          [🟡 GUARDED]  [⏱️ +14h]  │
│ Factory Worker, 35yo male                                   │
│                                                              │
│ Status: Patient developing fever, wound more inflamed       │
│ Next transition: Declining in ~8h if no diagnosis           │
└─────────────────────────────────────────────────────────────┘
```

**Design Philosophy:**
- Not meant to be punishing — most cases have generous time
- Creates realistic urgency (sepsis progresses, stable UTI doesn't)
- Rewards efficient workflows and parallel processing
- Teaches triage prioritization

**Difficulty Modifiers:**

| Difficulty | Deterioration Speed | Warning Time |
|------------|---------------------|--------------|
| Easy | 0.5x (slower) | Early warnings |
| Medium | 1.0x (normal) | Standard warnings |
| Hard | 1.5x (faster) | Late warnings |
| Realistic | 2.0x (aggressive) | Minimal warnings |

---

### Time System Requirements

| Requirement | Description |
|-------------|-------------|
| **Single Global Clock** | ONE clock drives all processing (no parallel/conflicting time systems) |
| **Tick-Based** | Internal representation: ticks (e.g., 10 ticks = 1 second at 1x speed) |
| **Speed Control** | Pause, 1x, 2x, 5x, 10x speeds |
| **All Processing Uses Clock** | Culture incubation, PCR cycles, electrophoresis, etc. all subscribe to same clock |
| **UI Display** | Show current game-time (Day 1, 14:32) and speed indicator |
| **Non-Blocking** | Processing happens in background; player can navigate away |

**Time Costs (examples):**
- Microscopy: instant (just staining prep)
- Culture plate incubation: 24h game-time
- PCR: 2h game-time (25 cycles)
- Electrophoresis: 1h game-time
- Serology: 30min game-time

---

### Timeline UI & Warp System

Inspired by Kerbal Space Program's time warp. Players need visibility into upcoming events and the ability to skip idle time efficiently.

**Timeline Track (Always Visible):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIMELINE                                          [⏸] [1x] [2x] [>>]   │
├─────────────────────────────────────────────────────────────────────────┤
│ NOW                                                             +48h   │
│  │                                                                │    │
│  ├──────┬────────────┬─────────────────────┬───────────────────┬─┤    │
│  │ 🧫   │     🧪     │         🧬          │        📧         │ │    │
│  │Cult  │    PCR     │       Sanger        │    New Case?      │ │    │
│  │2h    │    4h      │         18h         │       24h         │ │    │
│  └──────┴────────────┴─────────────────────┴───────────────────┴─┘    │
│                                                                        │
│                              [⏩ Warp to Next Event]                   │
└────────────────────────────────────────────────────────────────────────┘
```

**Timeline Features:**

| Feature | Description |
|---------|-------------|
| **Horizontal Track** | Shows next 48-72 hours of game-time |
| **Event Markers** | Icons for pending results (🧫 culture, 🧪 PCR, 🧬 sequencer, etc.) |
| **Case Color Coding** | Each event colored by its case (helps track multi-case workflows) |
| **Hover Details** | Mouseover event → shows "Blood Agar Plate #2, Case: Wound Infection, ETA: 4h 23m" |
| **Click to Focus** | Click event → navigate to that instrument/case |

**Warp to Next Event:**
- **Button:** "⏩ Warp to Next Event" prominently displayed
- **Action:** Instantly advances game-clock to when next event completes
- **Auto-Pause:** Game pauses automatically when result is ready
- **Notification:** Toast appears: "Culture plate ready for retrieval"

**Warp Restrictions:**
- Cannot warp if patient status is critical (forces player attention)
- Cannot warp past incoming case arrival (must triage first)
- Warp button disabled if nothing is pending

**Why This Matters:**
- No boring waiting (unlike real lab work!)
- Player always knows what's cooking
- Efficient time management gameplay
- Prepares for multi-case juggling complexity

**Integration with Patient Status:**
- If patient is deteriorating, timeline shows warning marker
- "⚠️ Patient A stable for ~6h" indicator
- Cannot warp past deterioration threshold without addressing patient

---

### Economy Requirements

Funds are the operational currency for running your lab.

| Component | Description |
|-----------|-------------|
| **Starting Funds** | Player begins with modest budget (e.g., $10,000) |
| **Instrument Purchase** | Buy instruments to unlock them (microscope $500, PCR $15,000, etc.) |
| **Per-Run Cost** | Each test costs money (reagents/consumables): microscopy $5, culture $20, PCR $50 |
| **Sample Collection Cost** | Some samples have collection cost (blood draw $10, biopsy $100) |
| **Case Rewards** | Successful diagnosis pays (based on case difficulty + time bonus) |
| **Failure Penalties** | Wrong diagnosis: partial reward; abandoned case: no reward |

**Economy Visibility:**
- Current funds always visible in header
- Cost preview before any action
- Post-case breakdown: "Earned $500, Spent $127 on tests = Net $373"

---

### Sample Volume & Redraw System

Samples are finite resources with realistic volumes. Players must manage sample consumption and may face QNS (Quantity Not Sufficient) situations.

**Core Concept:**
- Each sample has a **total volume** when collected (e.g., 10mL blood draw)
- Each test **consumes** a portion of that volume
- When volume is depleted, sample is **QNS** — no more tests possible from it
- Player may **request redraw** from patient (costs time, may not be possible)

**Sample Volume Examples:**

| Sample Type | Typical Volume | Notes |
|-------------|----------------|-------|
| Blood (venous draw) | 10 mL | Standard adult draw |
| Blood (pediatric) | 3 mL | Limited collection |
| Urine (clean-catch) | 50 mL | Plentiful |
| Sputum | 5 mL | Variable quality |
| Wound swab | 1 unit | Not measured in mL; 1 unit = ~2 tests |
| CSF (spinal fluid) | 3 mL | Precious, limited redraw |
| Bone marrow | 2 mL | Painful procedure, limited |

**Test Volume Consumption:**

| Test | Volume Required | Notes |
|------|-----------------|-------|
| Microscopy slide | 0.1 mL | Very efficient |
| Culture plate | 0.5 mL | Inoculation loop |
| Biochemical panel | 1.0 mL | Multiple reactions |
| PCR reaction | 0.2 mL | Small aliquot |
| ELISA well | 0.1 mL | Per well |
| Flow cytometry | 1.0 mL | Needs cell count |
| Sanger sequencing | 0.3 mL | After PCR amplification |

**QNS Workflow:**
```
┌─────────────────────────────────────────────────┐
│ Sample: Blood #1                                │
│ Volume: 1.2 mL / 10 mL remaining               │
│ ████░░░░░░░░░░░░░░░░ 12%                       │
├─────────────────────────────────────────────────┤
│ Tests Performed:                                │
│  • Microscopy (0.1 mL)                         │
│  • Culture x2 (1.0 mL)                         │
│  • Biochemical (1.0 mL)                        │
│  • Flow cytometry (6.7 mL)                     │
├─────────────────────────────────────────────────┤
│ [Request Redraw]  ⚠️ Low volume warning         │
└─────────────────────────────────────────────────┘
```

**Redraw Mechanics:**

| Era | Redraw Cost | Delay | Risk |
|-----|-------------|-------|------|
| Golden Age | $5 | 4h | Patient may refuse |
| Antibiotic Era | $10 | 2h | Minor patient discomfort |
| Molecular Era | $15 | 1h | Generally available |
| Modern Era | $20 | 30min | On-demand, but expensive |

**Why Sample Volume?**
- Teaches real lab constraints (CSF is precious!)
- Creates strategic planning (which tests are essential?)
- Adds consequence to wasteful testing
- Differentiates sample types (blood plentiful, CSF limited)

**Design Note:** Volume tracking is PER SAMPLE, not global. Each Blood Sample #1, Blood Sample #2 tracks its own remaining volume.

---

### Identity & Referencing (IDs)

Consistent ID naming strategy across all entities.

All entities require unique identifiers. We distinguish between two categories:

| Category | Description | Format | Examples |
|----------|-------------|--------|----------|
| **Definition IDs** | Static, authored content (cases, organisms, instruments, observation fields) | Human-readable, namespaced | `case_def:scarlet-fever-1912`, `organism:streptococcus-pyogenes`, `instrument_type:microscope`, `obs_def:gram-stain` |
| **Runtime IDs** | Dynamic, session-generated (runs, samples, observations, instances) | Opaque, auto-generated | `run:01J7X...`, `sample:01J7Y...`, `obs:01J7Z...` |

**ID Rules:**
1. **Definition IDs** are hand-authored, stable across sessions, and appear in code/data files
2. **Runtime IDs** are generated at creation time (UUIDs or similar) and never hardcoded
3. **References between entities use the appropriate ID type** — e.g., `Run.instrumentTypeId` references a definition ID, `Run.id` is a runtime ID
4. **Namespace prefixes are optional in code** but required in documentation for clarity

**Field Naming Convention:**
- Fields referencing definitions: `<entity>DefinitionId` (e.g., `caseDefinitionId`, `instrumentTypeId`, `observationDefinitionId`)
- Fields referencing runtime entities: `<entity>Id` (e.g., `runId`, `sampleId`, `artifactId`)

---

### Lab Notebook Requirements

Notebook entries are now structured Observations (dropdowns/multi-select), not free text.

The **Lab Notebook** is the player's evidence log for each case.

| Requirement | Description |
|-------------|-------------|
| **Per-Case Notebook** | Each case has its own notebook |
| **Auto-Recorded Runs** | When a test completes, entry is auto-added with: timestamp, instrument, sample, result artifact |
| **Structured Observations** | Player records observations using predefined dropdowns/checkboxes (NO free text) |
| **Searchable/Filterable** | Filter by instrument, sample, date |
| **Evidence IDs** | Each artifact and observation has a unique ID for reference |
| **Notebook Survives** | Even after case completion, notebook is viewable (case history) |

**Notebook Entry Structure:**
```
Entry #12
─────────
Timestamp: Day 1, 10:15
Instrument: Microscope
Sample: Wound Swab #1
Artifact: [Slide image - view details]
Observations:
  Gram Stain: ✓ Gram-positive (selected from dropdown)
  Shape: ✓ Cocci (selected from dropdown)
  Arrangement: ✓ Clusters (selected from dropdown)
```

---

### Evidence Model

Clear hierarchy from Case → Sample → Artifact/Observation. Artifacts are static machine outputs; Observations are player interpretations.

**Evidence Hierarchy:**

```
Case
 └── Sample (blood, wound swab, sputum, etc.)
      └── Artifact (produced by running sample through instrument)
           └── Observation (player's interpretation of the artifact)
```

**Real-World Example:** Player takes a blood sample from a patient, streaks it across 5 culture plates, runs different tests on each. Each plate produces an artifact. Player observes and interprets each artifact separately. All artifacts and observations trace back to the original blood sample, and ultimately to the case.

**Multi-Case Batching Example:** Player runs ELISA against 3 blood samples from 3 different cases simultaneously. Each sample → artifact association is preserved. The run spans multiple cases, but artifacts are always tied to their source sample (and thus their case).

**Core Definitions:**

| Concept | What It Is | Linked To | Mutability |
|---------|------------|-----------|------------|
| **Artifact** | Raw machine output (image, numeric reading, sequence data) | Sample (and thus Case) | **Immutable** |
| **Observation** | Player's interpretation of an artifact | Artifact (and thus Sample/Case) | **Immutable** |
| **EvidenceItem** | Union type: either an Artifact or an Observation | — | — |

**When Does the Player Make an Observation?**
- **Required:** If a real scientist must interpret the output (e.g., reading a gel, identifying colony morphology, interpreting a scatter plot)
- **Not Required:** If the machine produces an unambiguous numeric/boolean result (e.g., ELISA OD reading, biochemical test color change)

**Artifact Types (per instrument):**
- `slide-image` — Microscope: stained slide visualization (requires interpretation)
- `culture-plate-image` — Culture: colony morphology photo (requires interpretation)
- `gel-image` — Electrophoresis/PCR: band pattern (requires interpretation)
- `plate-reading` — ELISA: 96-well OD values (numeric; usually unambiguous)
- `scatter-plot` — Flow Cytometry: dot plot + gating (requires interpretation)
- `sequence-data` — Sanger: base calls + chromatogram (requires interpretation)
- `test-result` — Biochemical/Serology: positive/negative/numeric (usually unambiguous)

**Observation Rules:**
- Every Observation references exactly ONE Artifact (via `artifactId`)
- Observations use structured dropdowns/multi-select only (NO free text)
- A single Artifact may have multiple Observations (different aspects being recorded)
- Observations are immutable: once submitted, cannot be edited (create a new one instead)
- The notebook can filter by sample or case for easier review

**Why Immutable?**
- Reflects real lab practice: you can't unsee a result
- Prevents retroactive "fixing" of evidence to match diagnosis
- Audit trail: all evidence is permanent record

**Filtering:**
- Notebook shows all artifacts/observations for a case by default
- Player can filter by sample to see just that sample's test results
- Useful when multiple samples exist (e.g., wound swab, blood, urine all from same patient)

---

### Artifact Retrieval Mechanics

After an instrument run completes, the player must actively retrieve the artifact. This mirrors real lab practice where results don't magically appear—someone has to go get them.

**Retrieval is Required:**
- When a run completes, the artifact exists but is not yet in the player's notebook
- Player must navigate to the instrument and perform a retrieval action
- Only after retrieval can they view the artifact and make observations
- Unretrieved artifacts show a notification badge on the instrument

**Why Active Retrieval?**
- Realism: lab techs physically retrieve gels, plates, printouts
- Pacing: creates natural checkpoints in gameplay
- Awareness: player must track what's cooking where
- Future 3D world: player physically walks to instrument and picks up result

**Retrieval Actions (Instrument-Specific):**

| Instrument | Processing Output | Retrieval Action | Artifact Type |
|------------|------------------|------------------|---------------|
| Microscope | Stained slide | "Remove slide" | `slide-image` |
| Culture | Incubated plate | "Open incubator" → "Remove plate" | `culture-plate-image` |
| Biochemical | Color reactions | "Read results" | `test-result` |
| Serology | Agglutination wells | "Read wells" | `test-result` |
| ELISA | 96-well plate | "Read plate" (into plate reader) | `plate-reading` |
| PCR | Amplified DNA | "Remove PCR tubes" → "Load gel" | (intermediate) |
| Gel Electrophoresis | Migration complete | "Photograph gel" | `gel-image` |
| Sanger | Sequencing complete | "Export chromatogram" | `sequence-data` |
| Flow Cytometry | Acquisition complete | "Export plot" | `scatter-plot` |

**Multi-Step Workflows:**
Some instruments produce intermediate outputs that feed into another instrument:
- PCR → produces amplified DNA → player loads into gel electrophoresis → gel produces `gel-image` artifact
- Culture → produces colonies → player can subculture, gram stain, or run biochemicals

**Artifact Persistence:**
- Artifacts are ready indefinitely once the run completes (no degradation)
- Player can retrieve at their convenience (no time pressure)
- This simplifies gameplay while still requiring active retrieval

**Retrieval UI:**
- Instrument shows "Run Complete ✓" status with glowing indicator
- "Retrieve Result" button appears when run is done
- Player clicks → artifact is created and added to case notebook
- For batch runs: retrieve produces artifacts for all samples in the batch (realistic for plate readers, gel imagers)

---

### Intermediate Products & Multi-Instrument Workflows

Every instrument produces realistic outputs. Some outputs are intermediate products that require further processing by another instrument.

**Design Principle:** If a real lab requires two separate instruments, the game requires two separate instruments.

**Intermediate Product Workflows:**

| Source Instrument | Intermediate Product | Next Instrument | Final Artifact |
|-------------------|---------------------|-----------------|----------------|
| PCR Thermocycler | Amplified DNA (tubes) | Gel Electrophoresis | `gel-image` |
| Culture Plate | Isolated colonies | Microscope (Gram stain) | `slide-image` |
| Culture Plate | Isolated colonies | Biochemical Panel | `test-result` |
| Culture Plate | Isolated colonies | Subculture (new plate) | `culture-plate-image` |
| Sanger Prep | Sequencing reaction | Capillary Sequencer | `sequence-data` |

**How Intermediate Products Work:**

1. **PCR → Gel Example:**
   - Player runs PCR with sample + primers → PCR completes
   - Player retrieves "PCR tubes" (intermediate product, not a final artifact)
   - PCR tubes appear in inventory as a derived sample type: `pcr-amplicon`
   - Player navigates to Gel Electrophoresis → loads `pcr-amplicon` into lane
   - Gel runs → player retrieves → `gel-image` artifact created

2. **Culture → Subculture Example:**
   - Player incubates original sample on blood agar → colonies grow
   - Player retrieves plate → `culture-plate-image` artifact
   - Player can "Pick colony" → creates derived sample: `isolated-colony`
   - Player loads `isolated-colony` into new plate → subculture workflow

**Intermediate Product Types (SampleType enum additions):**
- `pcr-amplicon` — Output of PCR, input to gel electrophoresis
- `isolated-colony` — Picked from culture plate, input to biochemical/microscope/subculture
- `sequencing-reaction` — Output of Sanger prep, input to capillary sequencer
- `stained-slide` — Output of staining, input to microscope viewing

**Why This Matters:**
- Teaches real lab workflow (not magic black boxes)
- Creates multi-step puzzle gameplay
- Enables meaningful resource management (one PCR product can be split across multiple gel lanes)
- Prepares for 3D world where player physically moves samples between stations

---

### Derived Samples & Subculture Tracking

When player creates derived samples (subcultures, isolated colonies, etc.), the game tracks ancestry and provides UI to navigate the sample tree.

**Sample Ancestry:**
Every derived sample tracks its `parentSampleId`, creating a tree:

```
Patient Blood Sample (original)
 ├── Blood Agar Plate #1 (subculture)
 │    ├── Isolated Colony A (picked)
 │    │    ├── Gram Stain Slide (derived)
 │    │    └── Biochemical Panel (derived)
 │    └── Isolated Colony B (picked)
 │         └── MacConkey Plate (subculture)
 └── Chocolate Agar Plate #2 (subculture)
      └── Isolated Colony C (picked)
```

**Subculture Tracking UI:**

- **Sample Tree View:** Collapsible tree in the Inventory Panel showing ancestry
- **Breadcrumb Trail:** When viewing a derived sample, show path: `Blood → Plate #1 → Colony A`
- **Color Coding:** Different sample types have distinct colors/icons
- **Hover Tooltip:** Mouseover any sample shows its full lineage

**UI Mockup (Inventory Panel):**
```
┌─────────────────────────────────────┐
│ SAMPLES (Case #1)              [🔍] │
├─────────────────────────────────────┤
│ ▼ 🩸 Blood Sample                   │
│   ├── 🧫 Blood Agar #1 (24h done)   │
│   │   ├── 🔬 Colony A               │
│   │   │   └── 📋 Biochem results    │
│   │   └── 🔬 Colony B               │
│   └── 🧫 Choc Agar #2 (incubating)  │
│ ▼ 🧪 Wound Swab                     │
│   └── 🧫 MacConkey #3 (24h done)    │
└─────────────────────────────────────┘
```

**Why Track Ancestry?**
- Real labs track chain of custody
- Helps player remember which colony came from which plate
- Enables "compare colony A vs colony B" workflows
- Supports outbreak tracing (which patient sample led to which finding)

**Derived Sample Creation Actions:**

| Source | Action | Creates |
|--------|--------|---------|
| Patient sample | "Streak to plate" | Culture plate (subculture) |
| Culture plate | "Pick colony" | Isolated colony |
| Isolated colony | "Gram stain" | Stained slide |
| Isolated colony | "Subculture" | New culture plate |
| PCR tubes | "Load gel lane" | Gel lane sample |

---

### Clinical Questions & Answering

**Default 4-Question Framework:**

- **Etiology** (What is it?)  
  "What organism/condition is causing this patient's illness?"  
  Large answer bank (~50+ options per category)

- **Category** (What kind of thing?)  
  "What category does this pathogen belong to?"  
  (Gram-positive bacteria, Gram-negative bacteria, Virus, Fungus, Parasite, Non-infectious)

- **Immediate Action** (What do I do now?)  
  "What is the most appropriate immediate action?"  
  (Broad-spectrum antibiotics, Isolate patient, Surgical consult, etc.)

- **Specific Diagnosis/Treatment**  
  "What specific treatment or further testing is indicated?"  
   (Vancomycin, Penicillin, Chest X-ray, Lumbar puncture, etc.)

**Answering Flow (Papers, Please Style):**
- Player reviews their notebook: artifacts they've collected, observations they've recorded
- Player selects an answer from the answer bank
- **Optionally**, the game asks player to attach 1-2 supporting evidence items (EvidenceLinks)
- This is NOT academic citation — it's "show me why you think this"
- Purpose: reduces guessing, teaches reasoning, helps player reflect on their logic

**Evidence Linking Options (configurable per difficulty/era):**
- **Easy mode:** No evidence linking required — just pick your answer
- **Medium mode:** Attach at least 1 evidence item per question
- **Hard mode:** Attach at least 2 evidence items; game validates relevance

**Evidence Linking UI:**
```
┌─────────────────────────────────────────────────────┐
│ Question: What organism is causing this infection?  │
├─────────────────────────────────────────────────────┤
│ Your Answer: [▼ Staphylococcus aureus           ]  │
│                                                     │
│ Supporting Evidence (pick 1-2):                     │
│ ☐ Obs #3: Gram-positive cocci in clusters          │
│ ☐ Obs #5: Catalase-positive                        │
│ ☐ Obs #7: Coagulase-positive                       │
│ ☐ Artifact #2: Blood agar hemolysis pattern        │
│                                                     │
│              [Cancel]  [Submit Answer]              │
└─────────────────────────────────────────────────────┘
```

**Case-Specific Question Sets:**
- Oncology cases: "What cell population is abnormal?" + standard questions
- Genetics cases: "What mutation is present?" + inheritance pattern
- Outbreak cases: "What is the likely source?" + contact tracing

---

### Treatment Administration & Patient Outcome

Diagnosing isn't enough—the player administers treatment and sees the result on the patient.

**Treatment Flow:**
1. Player selects recommended treatment (Question #4)
2. Player physically administers treatment (era-appropriate interaction)
3. Patient outcome plays out over game-time
4. Success/failure shown with narrative and visible consequence

**Treatment Interactions (Era-Appropriate):**

| Era | Treatment Types | Player Action |
|-----|-----------------|---------------|
| **Golden Age** | Surgical debridement, Antiseptic wash, Carbolic spray, Supportive care | Click to apply dressing, pour antiseptic, give tincture |
| **Antibiotic Era** | Pills, Injections, IV drips | Click to inject, give pills, hang IV bag |
| **Molecular Era** | Targeted therapy, Combination regimens | Select dosing, manage side effects |
| **Modern Era** | Personalized medicine, Immunotherapy | Configure treatment protocol |

**Why Physical Administration?**
- Creates satisfying closure to case
- Connects diagnosis to consequence
- Prepares for 3D Overcooked-style future
- Makes treatment choice feel weighty

**Patient Outcome Visibility:**
```
┌─────────────────────────────────────────────────────────────┐
│ TREATMENT ADMINISTERED                                       │
├─────────────────────────────────────────────────────────────┤
│ Patient: Factory Worker, 35yo                               │
│ Diagnosis: Staphylococcus aureus wound infection            │
│ Treatment: Antiseptic wash + Carbolic dressing              │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Day 1: Wound cleaned, dressing applied                  │ │
│ │ Day 3: Swelling reduced, fever breaking                 │ │
│ │ Day 7: Wound healing, patient discharged ✓              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Outcome: RECOVERED                                           │
│ Lives Saved: +1                                              │
│ Funds Earned: $75                                            │
└─────────────────────────────────────────────────────────────┘
```

**Wrong Treatment Consequences:**
- Patient doesn't improve or worsens
- May require follow-up case (same patient returns)
- M&M review explains what treatment would have worked

---

### Realism-by-Era

Era affects available instruments AND available diagnosis answers.

| Era | Period | Instruments Available | Vocabulary/Hints |
|-----|--------|----------------------|------------------|
| **Golden Age** | 1880-1920 | Microscope, Gram stain, Culture plates (blood/nutrient agar), Basic serology (agglutination), Simple biochemical tests (oxidase, indole), Centrifuge | "Consumption," "The grip," "Miasma" |
| **Antibiotic Era** | 1940-1970 | + Expanded biochemical tests, Antibiotic susceptibility (Kirby-Bauer), Acid-fast stain | "Wonder drugs," Zone of inhibition |
| **Molecular Era** | 1980-2000 | + PCR, Gel electrophoresis, Sanger sequencing | "DNA fingerprinting," "Amplification" |
| **Modern Era** | 2000+ | + Flow cytometry, ELISA, Mass spectrometry, qPCR | "Biomarkers," "Point-of-care" |

**Era Mechanics:**
- Instruments unlock by era progression (or purchase in sandbox mode)
- In-game manual and hints use era-appropriate language
- Some cases REQUIRE era-specific instruments (TB case needs acid-fast staining at minimum)
- Answer banks are filtered by era — cannot claim MRSA in 1890, cannot prescribe vancomycin in 1920

**Era-Dependent Diagnosis Examples:**

| Era | Available Etiology Answers | Available Treatment Answers |
|-----|---------------------------|----------------------------|
| **Golden Age (1880-1920)** | Streptococcus, Staphylococcus, "Unknown organism" | Surgical debridement, Antiseptic wash, Supportive care |
| **Antibiotic Era (1940-1970)** | + Specific species, Resistant strains | Penicillin, Streptomycin, Tetracycline, Chloramphenicol |
| **Molecular Era (1980-2000)** | + MRSA, HIV subtypes | + Vancomycin, Ciprofloxacin, Azithromycin |
| **Modern Era (2000+)** | + Molecular markers, CA-MRSA vs HA-MRSA | + Linezolid, Daptomycin, Rapid diagnostics |

---

### Multi-Instance Instrument System

**Requirements:**
- Player can own **multiple physical instances** of the same instrument type
  - Example: 2× PCR Thermocyclers, 3× Culture Incubators, 1× Microscope
- Each instance has:
  - Unique instance ID (e.g., `pcr-001`, `pcr-002`)
  - Busy/idle status
  - Currently loaded samples (if any)
  - Active run reference (if processing)
- **Instrument Selection Flow:**
  1. Player navigates to instrument type (e.g., "PCR")
  2. UI shows grid of owned instances with status badges
  3. Player selects an idle instance to use
  4. Busy instances show progress; can view read-only
- **Purchase Requirements:**
  - Reputation threshold must be met (instrument type unlocked)
  - Sufficient funds to purchase
  - Some instruments start with 1 free instance (e.g., microscope)
- **Processing:** Each instance runs independently; PCR #1 busy doesn't block PCR #2

**Why This Matters:**
- Core "clinic management" fantasy
- Enables parallel workflow optimization
- Prepares for future 3D world (instances = physical objects)
- Creates meaningful upgrade choices

---

### Instrument Errors & Control Samples

Real lab instruments sometimes fail or give ambiguous results. Players must use controls to validate their results.

**Why Errors & Controls?**
- Real labs use positive and negative controls on every run
- Teaches critical thinking: "Is this result valid?"
- Prevents blind trust in machine output
- Creates interesting failure modes beyond "wrong diagnosis"

**Control Sample Types:**

| Control Type | Purpose | Example |
|--------------|---------|---------|
| **Positive Control** | Confirms assay is working (should give positive result) | Known S. aureus on culture, known HIV+ serum on ELISA |
| **Negative Control** | Confirms no contamination (should give negative result) | Sterile water on PCR, known HIV- serum on ELISA |
| **Reagent Blank** | Confirms reagents aren't contaminated | Buffer only through assay |
| **Reference Standard** | Calibrates quantitative results | Known concentration standard |

**Instrument Error Types:**

| Error Type | Cause | Player Action |
|------------|-------|---------------|
| **Control Failure** | Pos control negative OR neg control positive | Invalidate run, repeat |
| **Ambiguous Result** | Reading is borderline (e.g., ELISA OD near cutoff) | Re-run or confirmatory test |
| **Technical Failure** | Instrument malfunction (rare) | Repair or use different instance |
| **Contamination** | Cross-contamination between wells/lanes | Re-run with fresh samples |
| **Degraded Sample** | Sample stored too long or wrong conditions | Request redraw |

**Control Validation Workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│ RUN COMPLETE: ELISA Plate #1                                │
├─────────────────────────────────────────────────────────────┤
│ Controls:                                                   │
│  ✅ Positive Control (A1): OD 2.8 — VALID                   │
│  ✅ Negative Control (A2): OD 0.03 — VALID                  │
│                                                             │
│ Controls validated. Results are interpretable.              │
├─────────────────────────────────────────────────────────────┤
│ Patient Samples:                                            │
│  • A3 (Case #1): OD 0.08 — Negative                        │
│  • A4 (Case #2): OD 2.1 — Positive                         │
│  • A5 (Case #3): OD 0.45 — ⚠️ Borderline (retest advised)  │
└─────────────────────────────────────────────────────────────┘
```

**Control Failure Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ RUN COMPLETE: PCR Plate #1                                  │
├─────────────────────────────────────────────────────────────┤
│ Controls:                                                   │
│  ❌ Positive Control (A1): No band — FAILED                 │
│  ✅ Negative Control (A2): No band — Valid                  │
│                                                             │
│ ⚠️ CONTROL FAILURE: Positive control did not amplify.       │
│    Results cannot be trusted. Possible causes:              │
│    • Enzyme degraded                                        │
│    • Wrong cycling conditions                               │
│    • Primer issue                                           │
│                                                             │
│ [Discard Run]  [Review Anyway (risky)]                      │
└─────────────────────────────────────────────────────────────┘
```

**Error Frequency (Configurable per difficulty):**

| Difficulty | Control Failure Rate | Ambiguous Result Rate |
|------------|---------------------|----------------------|
| Easy | 0% (controls always work) | 5% |
| Medium | 5% | 10% |
| Hard | 10% | 15% |
| Realistic | 15% | 20% |

**Control Sample Source:**
- **Purchased from Store:** Reference strains, known positive/negative sera
- **From Reference Library:** Previously validated controls
- **Auto-Added:** Some instruments auto-load controls in designated wells

**Era Considerations:**
- **Golden Age:** No standardized controls; higher false positive/negative rates
- **Modern Era:** Automated quality control; controls are routine

---

### Batch/Multiplex Run System

**Requirements:**
- Some instruments support loading **multiple samples from multiple cases** in a single run
- Batch configuration is instrument-specific:
  - **ELISA:** 96-well plate, assign samples to wells, all wells same assay
  - **PCR:** 96-well plate, same primer set for all wells
  - **Gel Electrophoresis:** 12-20 lanes, different amplicons per lane
  - **Sanger Sequencing:** 96-well plate, different samples per well
  - **Flow Cytometry:** Serial queue, processes one-by-one but batched
  - **Protein Electrophoresis:** 8-12 lanes, different patient samples
- **Batch Setup UI:**
  - Visual representation of plate/lanes/queue
  - Drag samples from inventory to positions
  - Each sample labeled with case badge (color-coded)
  - "Start Run" validates configuration before launching
- **Batch Results:**
  - Produces per-sample artifacts within single run
  - Each artifact knows its position within the batch
  - Can filter notebook by case to see only that case's artifacts
- **Mixed-Case Batching:**
  - Allowed for most batch instruments
  - Enables efficient resource usage ("wait for more samples to fill plate")
  - Creates interesting decisions (run partial plate now vs. wait?)

**Position Addressing (Instrument-Specific):**

Position keys are human-readable identifiers that match the physical layout of each instrument. NOT standardized across instruments—each uses what's realistic for that equipment.

| Instrument | Position Format | Examples | Notes |
|------------|----------------|----------|-------|
| ELISA | Well ID (row+col) | `A1`, `B3`, `H12` | 96-well plate (8 rows × 12 cols) |
| PCR | Well ID (row+col) | `A1`, `B3`, `H12` | Same 96-well format |
| Gel Electrophoresis | Lane number | `lane-1`, `lane-12` | Linear lanes, numbered |
| Sanger | Well ID (row+col) | `A1`, `B3`, `H12` | 96-well plate |
| Flow Cytometry | Tube number | `tube-1`, `tube-48` | Serial queue |
| Protein Electrophoresis | Lane number | `lane-1`, `lane-8` | Linear lanes |
| Serology | Slide number | `slide-1`, `slide-4` | Small batch |

**Batch Realism Matrix:**

| Instrument | Batch? | Type | Max | Mixed Cases? | Uniform Config? |
|------------|--------|------|-----|--------------|-----------------|
| Microscope | No | — | 1 | — | — |
| Culture Plate | No* | — | 1 | — | — |
| Biochemical Panel | No | — | 1 | — | — |
| Serology | Partial | slides | 4-8 | Yes | No |
| **ELISA** | **Yes** | plate-96 | 96 | Yes | Yes |
| **PCR** | **Yes** | plate-96 | 96 | Yes | Yes |
| **Gel Electrophoresis** | **Yes** | lanes | 12-20 | Yes | No |
| **Sanger Sequencing** | **Yes** | plate-96 | 96 | Yes | No |
| **Flow Cytometry** | **Yes** | queue | 48 | Yes | No |
| **Protein Electrophoresis** | **Yes** | lanes | 8-12 | Yes | No |

*Culture plates are per-sample, but multiple plates incubate in parallel (inventory management, not batch run)

---

### Structured Observation System

**Rule:** If a real scientist must interpret the output, the game requires the player to make a structured Observation.

**Requirements:**
- Each instrument type defines `ObservationDefinition[]`:
  - Field ID (e.g., `gram-stain`, `hemolysis`, `pcr-band-size`)
  - Field label (e.g., "Gram Stain Result", "Hemolysis Type")
  - Input type: `single-select | multi-select | numeric | boolean`
  - Options (for selects): predefined list with IDs and labels
  - Numeric range (for numeric): min, max, unit
- **Player Workflow:**
  - View result artifact (gel image, plate, slide, etc.)
  - Open observation form (auto-populated from ObservationDefinition)
  - Select values from dropdowns/checkboxes (never type free text)
  - Confirm → creates immutable Observation entity
- **Observation Entity:**
  ```
  {
    id: "obs:01J...",              // Runtime ID
    artifactId: "artifact:01J...",  // References the Artifact being interpreted
    runId: "run:01J...",
    sampleId: "sample:01J...",
    caseId: "case:01J...",
    observationDefinitionId: "obs_def:gram-stain",  // Definition ID
    value: "positive",             // or ["chains", "pairs"] for multi-select
    recordedAtTick: 14523,
    positionKey: "A3"              // for batch runs (well/lane/slot identifier)
  }
  ```
- Observations are era-independent — options are always the same, but what you can conclude varies by era

**Observation Constraints:**
- **Single-select fields:** Player can only choose ONE value (e.g., Gram stain = positive OR negative, not both)
- **Multi-select fields:** Player can choose multiple values (e.g., Arrangement = chains AND pairs)
- **No conflicting observations:** Once recorded, an observation is final. Player cannot record a second observation for the same field on the same artifact.
- **Different fields OK:** Player CAN record multiple observations on an artifact if they're different fields (e.g., Gram stain observation + Shape observation)

**Example: Microscope Observation Form**
```
┌────────────────────────────────────────┐
│ Record Microscope Observations        │
├────────────────────────────────────────┤
│ Gram Stain: [▼ Select...]  (one only) │
│   ○ Gram-positive                      │
│   ○ Gram-negative                      │
│   ○ Variable                           │
│                                        │
│ Shape: [▼ Select...]  (one only)      │
│   ○ Cocci                              │
│   ○ Bacilli                            │
│   ○ Spirochete                         │
│   ○ Diplococci                         │
│   ○ Coccobacilli                       │
│                                        │
│ Arrangement: [☐ multi-select]         │
│   ☐ Chains                             │
│   ☐ Clusters                           │
│   ☐ Pairs                              │
│   ☐ Single                             │
│   ☐ Palisades                          │
│                                        │
│        [Cancel]  [Record]              │
└────────────────────────────────────────┘
```

**Why This Matters:**
- Prevents guessing by typing random text
- Enables programmatic answer validation
- No conflicting data = clear audit trail
- Structured data enables hints, statistics, AI assistance
- Matches real lab workflow (structured reporting)

---

### Artifact Viewer vs Observation Panel

Artifacts and observations are conceptually separate UI areas. Artifacts are static records you examine; observations are your interpretations that you create.

**Artifact Viewer:**
- Dedicated area showing the artifact itself (image, plot, readout)
- Completely static — player cannot modify the artifact
- Zoom, pan, adjust contrast for images (viewing only)
- Artifacts persist permanently in the case record
- Click artifact → opens full-screen view for detailed examination

**Observation Panel:**
- Separate panel where player records their interpretation
- Opens when player clicks "Record Observation" on an artifact
- Structured form with dropdowns/checkboxes (no free text)
- Multiple observations can be made on a single artifact (different aspects)
- Each observation is timestamped and immutable

**UI Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│ ARTIFACT VIEWER (left)          │ OBSERVATION PANEL (right) │
├─────────────────────────────────┼───────────────────────────┤
│                                 │ Artifact: Slide #3        │
│   [Gram stain slide image]      │ Sample: Blood             │
│                                 │                           │
│   Zoom: [−] [+]  Contrast: [─]  │ Previous Observations:    │
│                                 │ • Gram-positive (10:15)   │
│                                 │                           │
│                                 │ [Record New Observation]  │
│                                 │                           │
│                                 │ ─────────────────────────│
│                                 │ Observation Form:         │
│                                 │ Shape: [▼ Cocci       ]   │
│                                 │ Arrangement: [▼ Clusters] │
│                                 │                           │
│                                 │ [Cancel] [Submit]         │
└─────────────────────────────────┴───────────────────────────┘
```

**Why Separate?**
- Artifacts = facts (what the machine produced)
- Observations = interpretations (what you think it means)
- Prevents confusion between "what I saw" and "what I concluded"
- Real labs keep these conceptually separate too

---

### Right Panel Dynamics (Batch/Multiplex)

When working with batch instruments (ELISA plates, gel lanes, PCR wells), the right panel content is **context-sensitive** based on what the player has selected on the left.

**Core Behavior:**
- **Nothing selected:** Right panel shows run summary (all samples, all controls)
- **Single well/lane selected:** Right panel shows that specific sample's details
- **Multiple wells selected:** Right panel shows comparison view or bulk actions

**Selection Modes:**

| Selection | Right Panel Shows |
|-----------|-------------------|
| None | Run overview, control validation, all sample summary |
| Single well (A3) | Sample details, artifact, observation form |
| Row (A1-A12) | All samples in row, bulk observation option |
| Column (A1-H1) | All samples in column, comparison view |
| Multi-select | Selected samples only, comparison or bulk actions |

**Single Selection UI (Well A3 selected):**

```
┌─────────────────────────────────────────────────────────────┐
│ ELISA PLATE                      │ WELL A3 DETAILS          │
├─────────────────────────────────┼───────────────────────────┤
│                                 │ Sample: Blood #2          │
│ [A1] [A2] [A3*] [A4] ...       │ Case: #4 (HIV Screening)  │
│ [B1] [B2] [B3]  [B4] ...       │                           │
│  ...                            │ OD Reading: 2.41          │
│                                 │ Cutoff: 0.35              │
│  * = selected                   │ Result: ⚠️ POSITIVE       │
│                                 │                           │
│ [Select Row] [Select Column]    │ [Record Observation]      │
│                                 │ [View in Context]         │
│                                 │                           │
│                                 │ Previous Observations:    │
│                                 │  (none)                   │
└─────────────────────────────────┴───────────────────────────┘
```

**Multi-Selection UI (Wells A3, B3, C3 selected):**

```
┌─────────────────────────────────────────────────────────────┐
│ ELISA PLATE                      │ SELECTED: 3 WELLS        │
├─────────────────────────────────┼───────────────────────────┤
│                                 │ A3: Blood #2 (Case #4)    │
│ [A1] [A2] [A3*] [A4] ...       │     OD 2.41 → Positive    │
│ [B1] [B2] [B3*] [B4] ...       │                           │
│ [C1] [C2] [C3*] [C4] ...       │ B3: Blood #5 (Case #7)    │
│  ...                            │     OD 0.08 → Negative    │
│                                 │                           │
│  * = selected                   │ C3: Blood #8 (Case #9)    │
│                                 │     OD 0.12 → Negative    │
│                                 │                           │
│ [Clear Selection]               │ [Bulk Record Observation] │
│                                 │ [Export Selected]         │
└─────────────────────────────────┴───────────────────────────┘
```

**Gel Electrophoresis Example:**

```
┌─────────────────────────────────────────────────────────────┐
│ GEL IMAGE                        │ LANE 3 DETAILS           │
├─────────────────────────────────┼───────────────────────────┤
│ L  1  2 [3] 4  5  6  7  8  9   │ Sample: PCR Product #2    │
│ ── ── ── ── ── ── ── ── ── ── │ Case: #3 (MRSA Outbreak)  │
│ █  █        █        █  █     │ Patient: Patient A        │
│ █     █     █        █         │                           │
│ █     █     █              █   │ Bands Detected:           │
│ █           █                  │  • ~500 bp (mecA target)  │
│ █                              │                           │
│                                 │ [Record Observation]      │
│ [3] = selected lane             │ [Compare to Ladder]       │
└─────────────────────────────────┴───────────────────────────┘
```

**Why Dynamic Right Panel?**
- Natural workflow: click what you're interested in, see relevant details
- Reduces cognitive load (don't show everything at once)
- Enables efficient batch workflows
- Mirrors real lab software (plate readers have this pattern)

**Implementation Notes:**
- Selection state is local to the instrument view
- Multi-select via Ctrl+Click or drag selection
- Right panel animates smoothly between contexts
- Keyboard navigation: arrow keys move selection, Enter opens observation form

---

### Reference Library (Cross-Case Reuse)

Reference Library auto-populates when player acquires compatible artifacts.

**Motivation:**
- Real labs maintain reference strains, validated primers, and control sequences
- Player should be able to build up reusable resources over time
- Enables comparison workflows ("compare unknown to reference")

**Auto-Population:**
When a player retrieves an artifact that is compatible with the Reference Library, it is **automatically stored** in the library. No manual promotion needed.

**Library-Compatible Artifacts:**

| Item Type | Source | Auto-Added When |
|-----------|--------|-----------------|
| **Primer Set** | PCR run config | Player runs PCR with custom primers |
| **Reference Sequence** | Sanger sequencing | Player sequences a known reference strain |
| **Reference Strain** | Case reward / purchase | Purchased from store or earned as reward |
| **Antibody Panel** | Flow cytometry config | Player creates and uses a panel |
| **Gel Ladder** | Store purchase | Player buys molecular weight ladder |

**Reference Library Rules:**
- **Auto-population:** Compatible artifacts are added automatically on retrieval
- **Provenance tracked:** Library item shows which case/run it came from
- **Can be used in new cases:** Select from library instead of case inventory
- **Library items are templates:** Once in library, treated as reusable (doesn't consume original)
- **No patient sample sharing:** Only primers/sequences/configurations, NOT patient samples

**UI Implications:**
- Library panel accessible from lab view (shows all collected items)
- Toast notification when new item auto-added: "Primer set added to Reference Library"
- When setting up PCR/sequencing, dropdown includes "Load from Library" options
- Tooltips explain what Reference Library items are and how to use them

**Scope Limit:** Reference Library is NOT required for the initial prototype. Implement after core loop is validated.

---

### Era-Dependent Clinical Claims

**Requirements:**
- Answer banks for clinical questions are **filtered by current era**
- Earlier eras have fewer available diagnoses/treatments
- UI enforces this: answer dropdown only shows era-appropriate options
- Some eras allow "Unknown" as valid answer (before discovery)

**Examples of Era Gating:**

**Case: Wound Infection with Gram-positive cocci in clusters**

| Era | Available Etiology Answers | Why |
|-----|---------------------------|-----|
| Golden Age (1890) | Staphylococcus, Streptococcus, "Pus-forming organism" | Species known but no resistance concept |
| Antibiotic Era (1950) | S. aureus, S. epidermidis, "Penicillin-resistant Staph" | Can observe penicillin resistance |
| Molecular Era (1985) | + MRSA (methicillin-resistant S. aureus) | Can confirm with PCR mecA gene |
| Modern Era (2010) | + CA-MRSA, HA-MRSA, "PVL-positive S. aureus" | Molecular subtypes available |

**Case: HIV screening**

| Era | Available Answers | Why |
|-----|-------------------|-----|
| Golden Age (1890) | Not available as case | HIV not yet emerged |
| Antibiotic Era (1950) | Not available as case | HIV not yet emerged |
| Molecular Era (1985) | "HTLV-III/LAV virus", "HIV-1" | Early names; HIV-2 not distinguished |
| Modern Era (2010) | HIV-1 subtype A/B/C/etc., HIV-2, "Antiretroviral resistance profile" | Full molecular characterization |

**Treatment Era Gating:**
- 1890: Surgical debridement, supportive care only
- 1940: + Penicillin, sulfonamides
- 1960: + Methicillin, cephalosporins
- 1985: + Vancomycin, fluoroquinolones
- 2010: + Linezolid, daptomycin, rapid diagnostics

---

### Stakes, Motivation & Consequences

**The Problem With Reputation Gates:**
Reputation as a progression gate creates grinding, not learning. The new model: **understanding IS progression, consequences create stakes.**

**Why Diagnose Correctly?**

| Motivation | How It Works |
|------------|--------------|
| **Visible Impact** | Lives saved counter, outbreaks contained, community health improves |
| **Patient Outcomes** | Narrative consequences—success = recovery, failure = suffering (shown in M&M review) |
| **Lab Capacity** | Better performance → more funds → bigger lab → handle more cases → more impact |
| **Disease Arms Race** | Fail to keep up → diseases outpace your capabilities → more outbreaks |
| **Discovery Access** | Bridge cases (unsolvable with current tech) only appear when you're handling current cases well |

**What Funds Buy:**
- Instruments and derived technologies (Tier 2-3)
- Lab infrastructure upgrades
- Additional instrument instances
- Consumables and reagents
- Assistants (after proving mastery)

**What Funds Do NOT Buy:**
- Revolutionary discoveries (those are story-driven)
- Era progression (that comes from Discovery Challenges)
- Mastery (that comes from doing)

**Fail States (Soft, Not Game Over):**

| Failure | Consequence | Recovery |
|---------|-------------|----------|
| Wrong diagnosis | M&M review, patient harm narrative, outbreak may spread | Learn from review, handle future cases better |
| Can't handle case volume | Outbreaks spread, visible death toll, community suffers | Expand lab capacity, improve efficiency |
| Fall behind on research | New diseases you can't diagnose, obsolete tools | Pursue Discovery Challenges |
| Abandon case | Case leaves, someone else handles it, minor reputation loss | Case goes to queue |

**No "Game Over":** The world keeps turning. You can always recover. Punishment is educational (M&M review) and consequential (visible impact), not exclusionary.

**Progression Flow:**
```
Handle cases well → Earn funds
                  → Expand lab capacity
                  → Handle MORE cases
                  → Greater impact on disease
                  → Encounter unsolvable cases (Bridge Cases)
                  → Discovery Challenges unlock new tech
                  → New era of capabilities
                  → Repeat at larger scale
```

**Expert Player Advantage:**
- Experts understand the science → diagnose faster/cheaper
- Faster diagnosis → handle more cases → earn more funds
- Understanding = efficiency = progression speed
- No arbitrary gates—prove expertise by DOING

---

### M&M / Peer Review (Failure Education)

When a player fails a case, they receive a detailed educational review explaining what went wrong. Named after real medical M&M (Morbidity & Mortality) conferences.

**Purpose:**
- Turn failures into learning opportunities
- Show EXACTLY where the player went wrong
- Highlight missed evidence, misinterpretations, or wrong conclusions
- Make failure feel fair ("Oh, I missed THAT!")

**M&M Review Screen:**

```
┌─────────────────────────────────────────────────────────────┐
│ M&M REVIEW: Case #7 - Wound Infection                       │
│ Outcome: INCORRECT DIAGNOSIS                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Your Diagnosis: Streptococcus pyogenes                      │
│ Correct Answer: Staphylococcus aureus                       │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ EVIDENCE REVIEW                                              │
│                                                              │
│ ✅ Gram Stain: You correctly observed gram-positive cocci   │
│                                                              │
│ ❌ Arrangement: You selected "Chains"                        │
│    → Actual arrangement was "Clusters"                       │
│    → [View Slide Again] — Note the grape-like clustering    │
│                                                              │
│ ⚠️ Missed Evidence: You did not run catalase test           │
│    → Catalase-positive = Staphylococcus                     │
│    → Catalase-negative = Streptococcus                      │
│    → This would have distinguished the two                  │
│                                                              │
│ ⚠️ Missed Evidence: Culture showed golden pigment           │
│    → Classic S. aureus characteristic                       │
│    → You recorded hemolysis but not colony color            │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ PATIENT OUTCOME                                              │
│                                                              │
│ "The patient received inappropriate treatment for            │
│  Strep throat. The wound infection worsened, requiring      │
│  surgical intervention. Patient recovered after 2 weeks."   │
│                                                              │
│ Reputation: -15                                              │
│ Funds: +$50 (partial, case attempted)                        │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ KEY LEARNING POINTS                                          │
│                                                              │
│ 1. "Clusters" suggest Staphylococcus; "Chains" suggest      │
│    Streptococcus — arrangement is crucial!                  │
│                                                              │
│ 2. When gram-positive cocci are seen, ALWAYS run catalase   │
│    as a differentiating test.                               │
│                                                              │
│ 3. Colony pigment on blood agar is a key observation —      │
│    don't skip morphology details.                           │
│                                                              │
│              [Review Notebook]  [Return to Lab]              │
└─────────────────────────────────────────────────────────────┘
```

**M&M Review Components:**

| Section | Content |
|---------|---------|
| **Diagnosis Comparison** | Side-by-side: what player said vs. correct answer |
| **Evidence Audit** | Line-by-line review of observations (✅ correct, ❌ wrong, ⚠️ missed) |
| **Artifact Replay** | Links to re-view original slides, gels, plates with annotations |
| **Missed Tests** | Tests the player should have run but didn't |
| **Patient Narrative** | Story outcome showing consequence of error |
| **Key Learning Points** | 2-3 bullet points summarizing the lesson |

**Educational Annotations:**
- Wrong observations show the correct answer with explanation
- Missed artifacts highlighted: "You had this data but didn't record it"
- Clickable links to re-examine artifacts with "red ink" annotations
- References to in-game manual entries for review

**Severity Levels:**

| Outcome | M&M Severity | Reputation Loss |
|---------|--------------|-----------------|
| Partially correct | Brief review | -5 to -10 |
| Wrong diagnosis | Full M&M | -15 to -25 |
| Dangerous error | Extended M&M with patient harm narrative | -25 to -40 |
| Abandoned case | No M&M (just penalty) | -10 |

**Why M&M Review?**
- Real medical education uses case reviews
- Players learn from mistakes, not just successes
- Failure feels constructive, not punitive
- Increases retention of diagnostic concepts

---

### UX Requirements

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [🏥 Cases: 2/3] [💰 $8,432] [⏰ Day 2, 14:32] [⏸ ⏩ 1x 2x] │
│ [Case #1: Wound ▼] [⭐ Rep: 157/200 to Molecular Era]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────┐  ┌─────────────────────────────┐│
│  │                      │  │ Controls Tab / Inventory Tab││
│  │    INSTRUMENT        │  │ / Notebook Tab              ││
│  │    STAGE AREA        │  │                             ││
│  │    (Left ~60%)       │  │    RIGHT PANEL (~40%)       ││
│  │                      │  │                             ││
│  │                      │  │  [Current Case Filter: ✓]   ││
│  └──────────────────────┘  └─────────────────────────────┘│
│                                                            │
│ [← Back to Lab]                              [Next Step →] │
└────────────────────────────────────────────────────────────┘
```

**UX Elements:**
- **Case Switcher:** Header dropdown showing all active cases with status badges
- **Reputation Display:** Progress bar to next unlock
- **Case Filter Toggle:** Inventory/notebook can show "current case only" or "all cases"
- **Instrument Instance Grid:** When entering instrument type, show all owned instances with busy/idle status
- **Batch Setup UI:** For batch-capable instruments, plate/lane visual editor

**UX Principles:**
- **Minimal Friction:** 1-2 clicks to perform any common action
- **Teaches by Doing:** Info panels appear on hover, not modal tutorials
- **Clear Feedback:** Actions have visible results (animation, sound, state change)
- **Always Escapable:** Can always navigate back to lab/case list
- **Non-Blocking:** Long processes show progress but don't lock UI

**Contextual Tooltips (Everywhere):**
- Nearly every UI element has a hover tooltip
- Single sentence explaining what the element is/does
- Teaches without interrupting flow
- Examples: "Blood sample from patient", "Incubating (18h remaining)", "Gram-positive cocci"
- Content is authored separately from code (data file)

**Instrument View Pattern:**
- Left: Visual representation (interactive where appropriate)
- Right: Controls (run, configure) + Inventory (load sample) + Notebook (record observations)
- Hover info panel for learning

---

### Case Complexity Progression

Cases become more complex as player progresses through eras, matching technological advancement and player skill growth.

**Early Game (Golden Age, 1880-1920):**
- Simple cases: one sample, one or two instruments
- Limited diagnostic vocabulary (can't name specific strains)
- Treatment options limited (no antibiotics)
- Example: "Wound infection" → Microscope → Gram stain → "Gram-positive cocci in clusters" → Supportive care

**Mid Game (Antibiotic Era, 1940-1970):**
- Moderate complexity: multiple samples, 3-4 instruments
- Can identify specific organisms via biochemical tests
- Antibiotic susceptibility testing becomes relevant
- Example: "UTI" → Microscope + Culture + Biochemical panel → Identify E. coli → Prescribe appropriate antibiotic

**Late Game (Molecular Era, 1980-2000):**
- Complex cases: batch processing, multi-step molecular workflows
- PCR enables resistance gene detection
- Outbreak tracing becomes possible
- Example: "MRSA outbreak" → Culture + PCR for mecA gene → Confirm resistance → Trace source

**End Game (Modern Era, 2000+):**
- Highly complex: non-infectious diagnoses, cancer workups, genetic analysis
- Flow cytometry for cell populations
- Sequencing for mutations
- Multiple simultaneous cases requiring resource management
- Example: "Leukemia workup" → Flow cytometry → Identify abnormal population → Classify subtype → Guide therapy

**Complexity Dimensions:**

| Dimension | Early | Mid | Late | End |
|-----------|-------|-----|------|-----|
| Samples per case | 1 | 1-2 | 2-3 | 3+ |
| Instruments required | 1-2 | 3-4 | 4-6 | 6+ |
| Derived samples | None | Some | Many | Complex trees |
| Time pressure | Low | Medium | High | Critical |
| Diagnostic precision | Broad | Specific | Molecular | Genomic |
| Treatment options | Few | Many | Targeted | Personalized |

---

### Content Requirements (Vertical Slice Test Suite)

Cases designed to test edge cases and instrument categories, not just bacterial diagnosis.

**Target:** 8-10 playable cases that validate the full system architecture.

**Vertical Slice Test Suite Cases:**

| # | Case Name | Era | Samples | Required Instruments | Questions | Edge Case Tested |
|---|-----------|-----|---------|---------------------|-----------|------------------|
| 1 | **Wound Infection** | Golden Age | wound-swab | Microscope, Culture | Standard 4 | Basic bacterial workflow; earliest era limitations |
| 2 | **Strep Throat** | Golden Age | throat-swab | Microscope, Culture, Serology | Standard 4 | Serology confirmation; rapid test |
| 3 | **TB Suspect** | Golden Age | sputum | Microscope (acid-fast), Culture | Standard 4 | Long incubation; special staining |
| 4 | **MRSA Outbreak** | Molecular Era | wound-swab, blood | Microscope, Culture, PCR | Standard 4 + "Resistance?" | PCR workflow; era-gated diagnosis; batch PCR |
| 5 | **HIV Screening (Batch)** | Molecular Era | blood (×4 patients) | ELISA, Serology | Standard 4 | ELISA batch setup; mixed-case plate; confirmatory testing |
| 6 | **Multiple Myeloma** | Modern | blood, protein | Protein Electrophoresis, Flow | "Condition?", "Cell pop?", Action, Treatment | Non-infectious; protein pattern; flow gating |
| 7 | **Leukemia Workup** | Modern | blood | Flow Cytometry | "Cell pop?", Category, Action, Specific | Flow cytometry serial queue; cell populations |
| 8 | **Genetic Mutation** | Modern | blood, dna | PCR, Sanger Sequencing | "Mutation?", "Inheritance?", Action | Multi-step molecular; sequence reading; batch lanes |
| 9 | **UTI (Batch Partner)** | Antibiotic Era | urine | Microscope, Culture, Biochemical | Standard 4 | Biochemical panel; pairs with #1 for culture batching |
| 10 | **Food Poisoning** | Antibiotic Era | stool (×3 patients) | Culture, Serology | "Organism?", "Source?", Action | Multi-patient batching; outbreak tracing question |

**Case Details:**

**Case 1: Wound Infection**
- Era: Golden Age (1890)
- Why: Baseline bacterial case; tests core loop; era-appropriate answers only (no antibiotics)

**Case 4: MRSA Outbreak**
- Era: Molecular Era (1985)
- Why: Tests PCR batch capability; era-dependent answer (can claim MRSA only in this era+); validates molecular workflow

**Case 5: HIV Screening (Batch)**
- Era: Molecular Era (1985)
- Why: Tests ELISA 96-well batch; mixed-case plate (4 different patient cases); confirmatory Western blot

**Case 6: Multiple Myeloma**
- Era: Modern (2010)
- Why: Non-bacterial diagnosis; protein electrophoresis pattern recognition; flow cytometry for plasma cells; different question set

**Case 10: Food Poisoning Outbreak**
- Era: Antibiotic Era (1960)
- Why: Tests multi-patient batching (3 stool cultures); outbreak tracing question type ("What is the likely source?")

**Out of Scope for Prototype:**
- Procedural case generation
- Multiplayer
- 3D overcooked-style world (future vision)

---

### Detailed Case Walkthroughs

**Purpose:** Think through the complete player experience for representative cases across different eras. These walkthroughs validate the game mechanics and identify edge cases.

---

#### Walkthrough 1: Wound Infection (Golden Age, 1890)

**Patient Presentation:**
> "A 35-year-old factory worker presents with a festering wound on his forearm. The wound occurred 4 days ago from a piece of machinery. The area is red, swollen, and producing thick yellow pus. He has a fever of 101°F."

**Available Instruments:** Microscope, Culture plates (blood agar)

**Player Actions:**

1. **Accept Case** — Player reads presentation, notes wound + pus + fever suggests bacterial infection
2. **Collect Sample** — Player selects "Wound swab" from available samples ($5 cost)
3. **Navigate to Microscope** — Player goes to lab, clicks Microscope
4. **Load Sample** — Drag wound swab from inventory to microscope stage
5. **Apply Gram Stain** — Select "Gram stain" from stain options
6. **View Result** — See purple clusters of round cells
7. **Record Observation:**
   - Gram Stain: `Gram-positive` (single-select)
   - Shape: `Cocci` (single-select)
   - Arrangement: `Clusters` (multi-select, could also see `pairs`)
8. **Think:** "Gram-positive cocci in clusters... that's Staphylococcus"
9. **Start Culture** — Navigate to Culture, streak wound swab onto Blood Agar
10. **Wait** — 24h game-time for incubation (player can speed up time or work other cases)
11. **Retrieve Plate** — See golden-yellow colonies with beta hemolysis
12. **Record Observation:**
    - Colony Color: `Golden/Yellow`
    - Hemolysis: `Beta (complete)`
13. **Answer Questions:**
    - Etiology: "Staphylococcus" (can't say "aureus" confidently in 1890)
    - Category: "Gram-positive bacteria"
    - Action: "Surgical debridement and drainage"
    - Treatment: "Antiseptic wound care" (no antibiotics available!)
14. **Submit** — Patient outcome: "Wound was drained and cleaned. Patient recovered after several weeks."

**Key Learning Moments:**
- Gram stain interpretation
- Colony morphology reading
- Era limitation: no antibiotics, limited species identification

**Time to Complete:** ~30 min real-time (if not speeding up clock)

---

#### Walkthrough 2: UTI with Antibiotic Selection (Antibiotic Era, 1955)

**Patient Presentation:**
> "A 28-year-old woman presents with painful urination, frequency, and urgency for 3 days. Her urine appears cloudy. Temperature 100.2°F. No flank pain."

**Available Instruments:** Microscope, Culture, Biochemical Panel, Antibiotic Susceptibility

**Player Actions:**

1. **Accept Case** — Classic UTI presentation
2. **Collect Sample** — "Clean-catch urine" ($8 cost)
3. **Microscope** — Gram stain urine sediment
4. **Record Observation:**
   - Gram Stain: `Gram-negative`
   - Shape: `Bacilli` (rods)
   - Arrangement: `Single`
   - Also note: `Many white blood cells` (indicates infection)
5. **Think:** "Gram-negative rods in urine = probably E. coli or similar"
6. **Culture** — Streak onto MacConkey agar (selective for gram-negatives)
7. **Wait 24h** — Colonies grow
8. **Retrieve Plate** — See pink/red colonies (lactose fermenter)
9. **Record:** Colony appearance suggests E. coli
10. **Pick Colony** — Create derived sample: `isolated-colony`
11. **Run Biochemical Panel** — Load colony into biochemical tests
12. **Wait 4h** — Tests develop
13. **Record Biochemical Results:**
    - Indole: `Positive`
    - Methyl Red: `Positive`
    - Voges-Proskauer: `Negative`
    - Citrate: `Negative`
    - (Classic E. coli pattern)
14. **Run Susceptibility** — Load colony onto Mueller-Hinton with antibiotic disks
15. **Wait 18h** — Zones develop
16. **Record Susceptibility:**
    - Ampicillin: `Sensitive` (large zone)
    - Tetracycline: `Sensitive`
    - Streptomycin: `Sensitive`
17. **Answer Questions:**
    - Etiology: "Escherichia coli"
    - Category: "Gram-negative bacteria"
    - Action: "Prescribe oral antibiotics"
    - Treatment: "Ampicillin" (cheapest effective option)
18. **Submit** — Patient cured in 7 days

**Key Learning Moments:**
- Biochemical test interpretation (IMViC pattern)
- Antibiotic susceptibility reading (zone sizes)
- Cost-effective treatment selection

**Time to Complete:** ~45 min real-time

---

#### Walkthrough 3: MRSA Outbreak Investigation (Molecular Era, 1995)

**Patient Presentation:**
> "Three patients in the surgical ward have developed wound infections post-operatively within the past week. All have similar presentations: red, swollen surgical sites with purulent drainage. Initial cultures show Staphylococcus aureus, but standard antibiotics aren't working."

**Available Instruments:** Microscope, Culture, Biochemical, PCR, Gel Electrophoresis, Susceptibility Testing

**Player Actions:**

1. **Accept Case** — Note: 3 patients, possible outbreak, antibiotic failure
2. **Collect Samples** — Wound swabs from all 3 patients ($5 × 3 = $15)
3. **Batch Culture Setup** — Load all 3 swabs onto separate sections of same Blood Agar plate
4. **Wait 24h** — Golden colonies on all three
5. **Quick Gram Stain** — Confirm gram-positive cocci in clusters (all 3)
6. **Run Susceptibility** — Test Patient 1's isolate
7. **Record:** Resistant to methicillin, oxacillin! Only vancomycin works.
8. **Think:** "Methicillin-resistant S. aureus (MRSA)... need to confirm with PCR"
9. **Pick Colonies** — Create 3 isolated-colony samples
10. **Set Up PCR** — This is the key molecular step:
    - Select primers: "mecA gene detection" (from Reference Library)
    - Load all 3 colonies into PCR wells (batch run)
    - Configure: 35 cycles, appropriate temperatures
11. **Run PCR** — 2h processing time
12. **Retrieve PCR Tubes** — Get `pcr-amplicon` (intermediate product!)
13. **Load Gel** — Put PCR products in gel lanes 1-3, plus ladder in lane 4
14. **Run Gel Electrophoresis** — 1h
15. **Photograph Gel** — See bands at ~500bp in ALL THREE samples
16. **Record Observation:**
    - mecA Band: `Present` (for each sample)
    - Band Size: `~500 bp` (matches expected mecA amplicon)
17. **Interpretation:** All 3 patients have MRSA with mecA gene
18. **Answer Questions:**
    - Etiology: "Methicillin-resistant Staphylococcus aureus (MRSA)"
    - Category: "Gram-positive bacteria"
    - Action: "Isolate all patients, contact precautions, investigate source"
    - Resistance: "mecA-positive, vancomycin only"
    - Source Investigation: "Check surgical staff, shared equipment"
19. **Submit** — Outbreak contained, source identified as contaminated surgical instruments

**Key Learning Moments:**
- Batch processing efficiency
- PCR → Gel workflow (two separate instruments)
- Molecular confirmation of resistance
- Outbreak investigation mindset

**Time to Complete:** ~1.5h real-time

---

#### Walkthrough 4: Leukemia Workup (Modern Era, 2015)

**Patient Presentation:**
> "A 45-year-old man presents with fatigue, easy bruising, and recurrent infections over 2 months. CBC shows WBC 85,000 (extremely elevated), with 70% blasts. Platelets 45,000 (low). Hemoglobin 9.2 (low)."

**Available Instruments:** Microscope, Flow Cytometry, Protein Electrophoresis, PCR, Sanger Sequencing

**Player Actions:**

1. **Accept Case** — Very different from infection cases! Hematologic malignancy.
2. **Review Presentation** — High WBC with blasts = acute leukemia. Need to classify it.
3. **Collect Sample** — "Peripheral blood" ($10) and "Bone marrow aspirate" ($50)
4. **Microscope First** — Wright stain on blood smear
5. **Record Observation:**
   - Cell Type: `Blasts` (immature cells)
   - Blast Percentage: `70%`
   - Auer Rods: `Present` (key finding!)
   - Note: Auer rods suggest myeloid lineage
6. **Think:** "Auer rods = AML (Acute Myeloid Leukemia), but which subtype?"
7. **Flow Cytometry** — The main diagnostic tool for leukemia
8. **Set Up Flow Panel:**
   - Load bone marrow sample
   - Select antibody panel: CD34, CD117, CD13, CD33, HLA-DR, MPO
   - (These markers identify myeloid vs lymphoid lineage)
9. **Run Flow** — 30 min acquisition
10. **Retrieve Scatter Plot** — See population of cells
11. **Gate the Blast Population** — Draw gate around abnormal cells
12. **Record Observations:**
    - CD34: `Positive` (immature)
    - CD117: `Positive` (myeloid stem cell marker)
    - CD13: `Positive` (myeloid)
    - CD33: `Positive` (myeloid)
    - HLA-DR: `Positive`
    - MPO: `Positive` (myeloperoxidase = definitive myeloid)
13. **Think:** "Classic AML immunophenotype. But need cytogenetics for prognosis."
14. **PCR for Fusion Genes** — Check for common AML translocations
15. **Run with primers for:** PML-RARA, AML1-ETO, CBFB-MYH11
16. **Gel Result:** Band present for AML1-ETO fusion!
17. **Interpretation:** t(8;21) translocation = AML with favorable prognosis
18. **Answer Questions:**
    - Condition: "Acute Myeloid Leukemia"
    - Cell Population: "CD34+/CD117+/CD13+/CD33+ myeloblasts"
    - Subtype: "AML with t(8;21); RUNX1-RUNX1T1" (favorable risk)
    - Action: "Induction chemotherapy"
    - Treatment: "Cytarabine + anthracycline (7+3 regimen)"
19. **Submit** — Patient achieves remission after induction

**Key Learning Moments:**
- Completely different diagnostic approach (not infectious!)
- Flow cytometry panel design and interpretation
- Blast gating technique
- Molecular prognostic markers
- Integrated diagnosis (morphology + flow + molecular)

**Time to Complete:** ~2h real-time

---

#### Walkthrough 5: Multi-Patient HIV Screening (Molecular Era, 1990)

**Patient Presentation:**
> "Four patients from a high-risk population require HIV screening. Patient A: IV drug user. Patient B: Blood transfusion recipient (1985). Patient C: Healthcare worker with needlestick. Patient D: Spouse of known HIV+ person."

**Available Instruments:** ELISA (96-well), Serology (Western Blot for confirmation)

**Player Actions:**

1. **Accept Multiple Cases** — 4 separate case files, can batch test
2. **Collect Samples** — Blood from all 4 patients ($10 × 4 = $40)
3. **Set Up ELISA Batch** — This showcases batch mechanics:
   - Open ELISA plate view (96 wells)
   - Drag Patient A blood → Well A1
   - Drag Patient B blood → Well A2
   - Drag Patient C blood → Well A3
   - Drag Patient D blood → Well A4
   - Add positive control → Well A5
   - Add negative control → Well A6
4. **Configure ELISA:**
   - Select assay: "HIV-1/2 Antibody Screen"
   - All wells share same assay (uniform config)
5. **Run ELISA** — 3h total (coating, blocking, sample, enzyme, substrate)
6. **Read Plate** — Retrieve `plate-reading` artifact
7. **View Results:**
   - A1 (Patient A): OD = 2.4 (HIGH - above cutoff)
   - A2 (Patient B): OD = 1.8 (HIGH - above cutoff)
   - A3 (Patient C): OD = 0.1 (LOW - negative)
   - A4 (Patient D): OD = 0.3 (LOW - negative)
   - A5 (Pos Control): OD = 2.8 (Valid)
   - A6 (Neg Control): OD = 0.05 (Valid)
8. **Record Per-Patient:**
   - Patient A: `Screen Positive`
   - Patient B: `Screen Positive`
   - Patient C: `Screen Negative`
   - Patient D: `Screen Negative`
9. **Confirmatory Testing** — ELISA positives need Western Blot confirmation
10. **Run Western Blot** — For Patients A and B
11. **Results:**
    - Patient A: gp160, gp120, gp41, p24 bands = CONFIRMED POSITIVE
    - Patient B: Only p24 band = INDETERMINATE (need follow-up)
12. **Answer Questions (Per Patient):**

    **Patient A:**
    - Diagnosis: "HIV-1 Infection Confirmed"
    - Action: "CD4 count, viral load, initiate counseling"
    
    **Patient B:**
    - Diagnosis: "HIV Indeterminate - requires follow-up testing"
    - Action: "Repeat testing in 2-4 weeks, PCR if available"
    
    **Patient C:**
    - Diagnosis: "HIV Negative"
    - Action: "Post-exposure prophylaxis complete, continue monitoring"
    
    **Patient D:**
    - Diagnosis: "HIV Negative"
    - Action: "Continue safe practices, retest in 3 months"

**Key Learning Moments:**
- Batch ELISA setup (efficiency!)
- Controls matter (validation)
- Screening vs. confirmation distinction
- Indeterminate results exist (not everything is yes/no)
- Each patient gets individual outcome

**Time to Complete:** ~1h real-time (mostly ELISA wait time)

---

## Data Model

**MAJOR CHANGES:**
- Instrument split into `InstrumentType` (definition) and `InstrumentInstance` (owned copy)
- Run supports batch via `RunInput[]` array
- NotebookEntry replaced by structured `Observation`
- Added `ObservationDefinition`, `BatchConfig`, `AnswerBank`

### Core Entities (Names + Fields Only)

**ID Naming Convention:**
- Definition IDs: human-readable, namespaced (e.g., `case_def:scarlet-fever-1912`)
- Runtime IDs: opaque, auto-generated (e.g., `run:01J7X...`)
- Reference fields use `<entity>DefinitionId` or `<entity>Id` accordingly

#### CaseDefinition
```
id: string                     // Definition ID: "case_def:wound-infection-1890"
title: string
story: string
era: Era
difficulty: 'easy' | 'medium' | 'hard'
availableSamples: SampleType[]
correctConditionId: string     // Definition ID: "organism:staph-aureus"
questions: CaseQuestion[]
reward: { funds: number, reputation: number }
timeLimitTicks: number | null
requiredReputationToUnlock: number
```

#### ActiveCase
```
id: string                     // Runtime ID: "case:01J..."
caseDefinitionId: string       // Reference to CaseDefinition.id
status: 'active' | 'submitted' | 'reviewed' | 'abandoned'
startedAtTick: number
samples: Sample[]              // all samples for this case
runIds: string[]               // references to Runs (may be shared with other cases in batch)
artifactIds: string[]          // references to Artifacts produced for this case
observations: Observation[]    // structured observations for this case
answers: CaseAnswer[]
```

#### Sample
```
id: string                     // Runtime ID: "sample:01J..."
caseId: string                 // Reference to ActiveCase.id
type: SampleType
source: 'patient' | 'derived'
parentSampleId: string | null  // Reference to parent Sample.id (if derived)
collectedAtTick: number
properties: Record<string, unknown>  // organism/condition data for simulation
```

#### InstrumentType
```
id: string                     // Definition ID: "instrument_type:pcr"
name: string
description: string
era: Era
purchaseCost: number
runCost: number
processingTicks: number
acceptsSampleTypes: SampleType[]
producesSampleTypes: SampleType[]
supportsBatch: boolean
batchConfig: BatchConfig | null
observationDefinitionIds: string[]   // References to ObservationDefinition.id
```

#### BatchConfig
```
type: 'plate-96' | 'plate-384' | 'lanes' | 'queue'
maxPositions: number
positionLabel: string              // 'well', 'lane', 'slot'
allowMixedCases: boolean
requiresUniformConfig: boolean     // e.g., PCR needs same primers for all wells
```

#### InstrumentInstance
```
id: string                         // Runtime ID: "instance:01J..."
instrumentTypeId: string           // Reference to InstrumentType.id
ownerId: 'player'
status: 'idle' | 'busy' | 'maintenance'
currentRunId: string | null        // Reference to Run.id
acquiredAtTick: number
```

#### Run
```
id: string                         // Runtime ID: "run:01J..."
instrumentInstanceId: string       // Reference to InstrumentInstance.id
inputs: RunInput[]                 // SUPPORTS BATCH: multiple samples
startedAtTick: number
completedAtTick: number | null
status: 'configuring' | 'running' | 'completed' | 'failed'
retrieved: boolean                 // Has player collected the result?
config: Record<string, unknown>    // instrument-specific (primers, stains, etc.)
artifactIds: string[]              // References to Artifacts produced by this run (populated on retrieval)
```

#### RunInput
```
sampleId: string                   // Reference to Sample.id
caseId: string                     // Denormalized for quick lookup
positionKey: string | null         // Instrument-specific position (e.g., "A3", "lane-5", null for non-batch)
```

#### Artifact
```
id: string                         // Runtime ID: "artifact:01J..."
runId: string                      // Reference to Run.id
sampleId: string                   // Reference to Sample.id (the sample this artifact came from)
caseId: string                     // Denormalized for quick lookup
type: ArtifactType                 // Instrument-specific type
positionKey: string | null         // Same position as RunInput (e.g., "A3", "lane-5")
createdAtTick: number              // When run completed
retrievedAtTick: number | null     // When player retrieved it (null if not yet retrieved)
data: Record<string, unknown>      // Immutable machine-generated payload
```

**ArtifactType enum:**
- `slide-image` — Microscope output
- `culture-plate-image` — Culture colony morphology
- `gel-image` — Electrophoresis/PCR band pattern
- `plate-reading` — ELISA OD values (96-well matrix)
- `scatter-plot` — Flow cytometry dot plot
- `sequence-data` — Sanger base calls + chromatogram
- `test-result` — Biochemical/serology positive/negative/numeric

#### ObservationDefinition
```
id: string                         // Definition ID: "obs_def:gram-stain"
instrumentTypeId: string           // Reference to InstrumentType.id
label: string                      // "Gram Stain Result"
inputType: 'single-select' | 'multi-select' | 'numeric' | 'boolean'
options: ObservationOption[] | null  // for select types
numericRange: { min: number, max: number, unit: string } | null
```

#### ObservationOption
```
id: string                         // Definition ID: "obs_opt:gram-positive"
label: string
description: string | null
```

#### Observation
```
id: string                         // Runtime ID: "obs:01J..."
artifactId: string                 // Reference to Artifact.id (what is being interpreted)
runId: string                      // Reference to Run.id
sampleId: string                   // Reference to Sample.id
caseId: string                     // Denormalized for quick lookup
observationDefinitionId: string    // Reference to ObservationDefinition.id
value: string | string[] | number | boolean  // depends on inputType
recordedAtTick: number
positionKey: string | null         // well/lane/slot for batch runs (e.g., "A3", "lane-5")
```

#### EvidenceItem (Union Type)
```
// An EvidenceItem is either an Artifact OR an Observation
// Used for evidence linking when answering questions
type EvidenceItem = Artifact | Observation
```

#### CaseQuestion
```
id: string                         // Definition ID within case: "q:etiology"
questionType: 'etiology' | 'category' | 'action' | 'specific' | 'custom'
prompt: string
answerBankId: string               // Reference to AnswerBank.id
requiredEvidenceCount: number      // 0 = optional, 1-2 = lightweight linking
```

#### AnswerBank
```
id: string                         // Definition ID: "answer_bank:organisms"
questionType: string
answers: AnswerOption[]
```

#### AnswerOption
```
id: string                         // Definition ID: "answer:strep-pyogenes"
label: string
description: string | null
availableFromEra: Era
correctForConditionIds: string[]   // References to condition Definition IDs
```

#### CaseAnswer
```
questionId: string                 // Reference to CaseQuestion.id
selectedAnswerId: string           // Reference to AnswerOption.id
linkedEvidenceIds: string[]        // Optional: Artifact.id or Observation.id references (evidence linking)
submittedAtTick: number
isCorrect: boolean | null
```

#### PlayerState
```
funds: number
reputation: number
currentEra: Era
ownedInstanceIds: string[]         // References to InstrumentInstance.id
unlockedInstrumentTypeIds: string[]  // References to InstrumentType.id
maxActiveCases: number
completedCaseIds: string[]
activeCaseIds: string[]
libraryItemIds: string[]           // References to LibraryItem.id
```

#### LibraryItem
```
id: string                         // Runtime ID: "lib:01J..."
type: 'primer-set' | 'reference-sequence' | 'reference-strain' | 'antibody-panel'
name: string                       // Player-assigned name
data: Record<string, unknown>      // Type-specific payload
sourceArtifactId: string | null    // Reference to Artifact.id (if promoted from case)
sourceCaseId: string | null        // Reference to ActiveCase.id (provenance)
createdAtTick: number
```

### Relationships Diagram

**Evidence Hierarchy:** Case → Sample → Artifact → Observation

```
PlayerState
    │
    ├── owns → InstrumentInstance[]
    │                │
    │                └── of type → InstrumentType
    │                                   │
    │                                   └── has → ObservationDefinition[]
    │
    ├── has → LibraryItem[]
    │              │
    │              └── promoted from → Artifact (optional provenance)
    │
    └── has → ActiveCase[]
                  │
                  ├── from → CaseDefinition
                  │               │
                  │               └── has → CaseQuestion[]
                  │                              │
                  │                              └── uses → AnswerBank
                  │
                  ├── contains → Sample[]  ─────────────────┐
                  │                                         │
                  │                                         ▼
                  ├── participates in → Run[] ──────→ Artifact[]
                  │     (via RunInput with positionKey)      │
                  │                                          │
                  │                                          ▼
                  ├── contains → Observation[] ◀──── interprets
                  │
                  └── contains → CaseAnswer[]
                                     │
                                     └── links → EvidenceItem[] (Artifact | Observation)
```

**Key Relationships:**
- Sample belongs to Case
- Artifact belongs to Sample (and thus Case) — via `sampleId`
- Observation interprets an Artifact (and thus belongs to Sample/Case) — via `artifactId`
- For batch runs: multiple samples from different cases can be in one Run, but each Artifact is tied to its source Sample

---

## Summary

**BioLogic** is a lab-building game where your laboratory fights disease across 140 years of medical history.

**The Core Philosophy:**
- **The lab IS the game.** You design, build, and optimize it. Cases test your lab's capabilities.
- **Discovery drives progression.** You encounter unsolvable cases → pursue research → unlock new technology.
- **Understanding IS the gate.** Expert players progress faster because they know the science, not because they grind.
- **Consequences, not game over.** Failures have visible impact (outbreaks spread, lives lost) but you can always recover.

**What Players Do:**
- **Build a diagnostic lab** from scratch, starting in the 1880s
- **Progress through 140 years** of medical history via Discovery Challenges
- **Handle cases at scale** — efficiency and throughput matter
- **Fight disease globally** — the epidemiological meta-layer shows your impact
- **Master every instrument** before automating it
- **Prove understanding** by using tools correctly, not by grinding points

**Key Systems:**
- **Epidemiological Meta-Layer:** The world has diseases; your lab fights them; visible impact on lives saved
- **Technology Acquisition Tiers:** Revolutionary Discoveries (story), Derived Tech (purchase), Consumables (operational)
- **Automation Progression:** Manual → Batching → Assistants → High-throughput workcells
- **Lab Management:** Grid-based placement, infrastructure requirements, era-appropriate environments
- **Timeline UI:** KSP-style warp to next event, case juggling
- **M&M Review:** Educational failure feedback

**Evidence Model:**
- **Artifact** = immutable machine output (image, reading, sequence)
- **Observation** = player interpretation (structured dropdown only)
- **EvidenceItem** = either an Artifact or Observation

**Historical Journey:**
- Start in the 1880s with basic microscopy
- Live through germ theory, antibiotics, molecular biology, genomics
- Understand WHY each tool was invented and WHAT problem it solved
- Experience the challenges of each era authentically

**Core Technical Principles:**
- ONE global clock (Svelte 5 runes)
- ONE state system (Svelte 5 runes — NO legacy stores)
- Types live with data
- No duplicate concepts
- Simple > Clever

---

## Prototype Learnings (From Previous Iteration)

**What Worked:**
- Making observations was engaging
- Using multiple instruments per case was compelling gameplay
- Clean separation of inputs/outputs from instruments

**What Didn't Work:**
- Just clicking buttons to run instruments wasn't engaging
- Single instrument (microscope only) didn't validate the concept
- Direct player interaction was only marginally better than button-clicking

**Design Implications:**
- Prototype needs ALL Golden Age instruments, not just microscope
- Cases must require multiple instruments to solve
- Lab should be visually representative of the era
- Observation system is core—invest in making it satisfying
- Treatment administration adds closure and consequence

**First Prototype Target:** 
Golden Age (1880s) lab with multiple instruments, multi-step cases, treatment administration, and city-scale impact visibility. Must be fully playable by Playwright MCP agents.
