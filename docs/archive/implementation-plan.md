# BioLogic Prototype Implementation Plan

**Goal:** Validate the "Lab IS the Game" concept with a fully-playable Golden Age (1880s) lab experience.

**Success Criteria:**
1. Multiple instruments required to solve cases
2. Observations feel engaging and meaningful
3. Treatment administration creates satisfying closure
4. City-scale impact is visible and motivating
5. Fully playable by Playwright MCP agents (snapshot + click)

---

## Epic 0: Foundation & Architecture Reset

**Objective:** Clean slate with Svelte 5 runes, proper state architecture, and agent-compatible UI patterns.

**Deliverables:**
- Fresh Svelte 5 project with TypeScript
- Global clock system (tick-based, pause/speed controls, Frostpunk-style event timeline)
- Clock shows upcoming scheduled events (culture ready, patient status change, etc.)
- Player can click to jump ahead to any event time
- Core type definitions (Case, Sample, Artifact, Observation)
- Basic app shell with view routing
- CSS foundation with era-appropriate styling (1880s aesthetic)

**Key Decisions:**
- All state via `$state`, `$derived`, `$effect` — NO legacy stores
- All UI elements must have stable `data-ref` attributes for Playwright
- No real-time interactions — everything is click/select based

**Done When:**
- App loads with clock display
- Can pause/resume/change speed
- Agent can take snapshot and see structured elements

---

## Epic 1: Lab View & Instrument Navigation

**Objective:** Clickable lab layout where player navigates between stations.

**Deliverables:**
- Lab view component showing all Golden Age instruments as clickable tiles
- Visual state indicators (idle, in-use, ready for pickup)
- Click instrument → navigate to instrument view
- Era-appropriate lab aesthetic (wooden benches, gas burners, etc.)

**Instruments to Include (Golden Age 1880s):**
- Microscope (with Gram stain, Acid-fast stain capabilities)
- Culture Station (blood agar, nutrient agar plates)
- Staining Bench (reagent application)
- Serology Station (agglutination tests)
- Centrifuge (sample preparation)
- Patient Bay (where patients wait/receive treatment)

**Done When:**
- Lab view shows all 6 stations
- Each station clickable and navigable
- Agent can snapshot lab and click any station

---

## Epic 2: Case System & Patient Presentation

**Objective:** Cases arrive, player triages, and patient status is tracked.

**Deliverables:**
- Case queue with incoming cases
- Triage UI (Accept/Defer/Reject)
- Active case list with status badges
- Case context switching
- Patient status tracking (Stable → Guarded → Declining → Critical)
- Case data structure with symptoms, correct diagnosis, required evidence

**Hardcoded Cases (3-4 for prototype):**
1. Wound infection (Staphylococcus aureus) — requires microscopy + culture
2. Sore throat (Streptococcus pyogenes) — requires microscopy + serology
3. Consumption/TB suspect (Mycobacterium tuberculosis) — requires acid-fast stain + culture
4. Food poisoning outbreak (Salmonella) — requires culture + biochemical

**Done When:**
- Cases appear in queue over time
- Can accept case and see patient details
- Patient status changes over game-time
- Agent can triage cases via clicks

---

## Epic 3: Sample Collection & Inventory

**Objective:** Collect samples from patients, manage in inventory, use across instruments.

**Deliverables:**
- Sample collection UI (from patient bay)
- Per-case inventory showing collected samples
- Sample volume tracking (optional for prototype, can simplify)
- Sample badges that can be loaded into instruments

**Sample Types (Golden Age):**
- Wound swab
- Throat swab
- Sputum
- Blood
- Stool

**Done When:**
- Can collect sample from active case patient
- Samples appear in case inventory
- Samples can be selected for use in instruments
- Agent can collect and select samples

---

## Epic 4: Microscope Instrument

**Objective:** Fully functional microscope with staining and observation recording.

**Deliverables:**
- Microscope view with slide visualization
- Stain selection (Gram, Acid-fast, simple)
- Visual representation of bacteria under microscope
- Observation recording panel (structured dropdowns):
  - Shape (cocci, bacilli, spirochete, etc.)
  - Arrangement (clusters, chains, pairs, singles)
  - Gram reaction (positive, negative, variable)
  - Special features (spores, capsules, acid-fast)
- Artifact creation (slide image saved to case)

**Done When:**
- Can load sample, apply stain, view result
- Visual shows correct bacteria for the case
- Can record observations via dropdowns
- Artifact saved to case notebook
- Agent can perform complete microscopy workflow

---

## Epic 5: Culture Station

**Objective:** Plate samples, incubate, observe colony characteristics.

**Deliverables:**
- Culture station view
- Plate type selection (blood agar, nutrient agar)
- Incubation timer (24h game-time via global clock)
- Colony visualization after incubation
- Colony observation recording:
  - Colony size
  - Colony color/pigment
  - Hemolysis pattern (alpha, beta, gamma)
  - Colony morphology

**Done When:**
- Can plate sample and start incubation
- Timeline shows pending culture result
- After 24h, can examine colonies
- Colony visuals match organism
- Agent can plate, wait, and observe

---

## Epic 6: Additional Golden Age Instruments

**Objective:** Complete the instrument set for multi-step diagnosis.

**Deliverables:**

**6a: Staining Bench**
- Apply various stains to prepared samples
- Gram stain procedure (crystal violet → iodine → decolorize → safranin)
- Acid-fast stain (Ziehl-Neelsen)
- Stained sample → ready for microscope

**6b: Serology Station**
- Agglutination tests
- Mix sample with antisera
- Visual result (clumping = positive)
- Record agglutination observations

**6c: Basic Biochemical Tests**
- Catalase test (H₂O₂ → bubbles)
- Oxidase test (color change)
- Indole test
- Quick visual results

**Done When:**
- Each instrument functional and integrated
- Multi-instrument workflows possible
- Agent can use all instruments

---

## Epic 7: Lab Notebook & Evidence System

**Objective:** Unified notebook showing all artifacts and observations per case.

**Deliverables:**
- Notebook view accessible from case context
- Chronological list of:
  - Artifacts produced (slide images, culture photos)
  - Observations recorded
  - Tests run
- Evidence can be selected when answering questions
- Filter by sample or instrument type

**Done When:**
- All artifacts/observations appear in notebook
- Can browse evidence for current case
- Can select evidence for diagnosis support
- Agent can review notebook contents

---

## Epic 8: Diagnosis Submission

**Objective:** 4-question diagnosis with evidence linking.

**Deliverables:**
- Diagnosis view with 4 questions:
  1. Etiology (What organism?)
  2. Category (What type?)
  3. Immediate Action (What do now?)
  4. Treatment (What to give?)
- Answer banks (era-appropriate, filterable)
- Evidence linking (select supporting observations)
- Submit button

**Done When:**
- Can answer all 4 questions
- Can attach evidence to answers
- Submit triggers outcome evaluation
- Agent can complete diagnosis flow

---

## Epic 9: Treatment Administration

**Objective:** Player physically administers treatment, sees patient outcome.

**Deliverables:**
- Treatment selection based on Question #4 answer
- Treatment administration UI (era-appropriate):
  - Apply antiseptic wash
  - Apply carbolic dressing
  - Give tincture/medicine
- Patient outcome sequence (Day 1, Day 3, Day 7 narrative)
- Outcome display (Recovered / Worsened / Died)
- Lives saved counter update

**Done When:**
- Can administer treatment after diagnosis
- Patient outcome plays out over time
- Visual feedback on treatment effect
- City impact counter updates
- Agent can administer treatment

---

## Epic 10: M&M Review (Failure Feedback)

**Objective:** Educational feedback when diagnosis is wrong.

**Deliverables:**
- M&M review screen triggered on wrong diagnosis
- Side-by-side comparison (player answer vs correct)
- Evidence audit (what was correct, wrong, missed)
- Key learning points (2-3 bullets)
- Patient outcome narrative (consequence of error)

**Done When:**
- Wrong diagnosis triggers M&M review
- Review is educational, not punitive
- Player understands what they missed
- Agent can read M&M review content

---

## Epic 11: City Meta-Layer & Impact Visibility

**Objective:** Show player's impact on city health.

**Deliverables:**
- City overview panel (accessible from lab)
- Disease burden bars (per disease type)
- Patient counter / Lives saved counter
- District alerts (optional for prototype)
- Era-appropriate news feed

**Done When:**
- City panel shows cumulative impact
- Successful cases update counters
- Failed cases show negative impact
- Creates sense of purpose and stakes

---

## Epic 12: Polish & Agent Testing

**Objective:** Ensure full game is playable by Playwright MCP.

**Deliverables:**
- All interactive elements have `data-ref` attributes
- Snapshot produces readable accessibility tree
- No timing-dependent interactions
- Test suite of agent playthroughs
- Bug fixes from agent testing

**Done When:**
- Agent can play complete case from triage to outcome
- Agent can handle all 4 prototype cases
- No interactions require human-only input

---

## In Scope for Prototype

- Lab grid placement / building (simplified 2D grid)
- Multiple instrument instances (purchase duplicates)
- Economy (funds, purchasing instruments/consumables)
- 2 Eras: Golden Age (1880s) + Antibiotic Era (1940s)
- Discovery Challenges (unlock era transitions)

## Out of Scope for Prototype

- Assistants / Automation
- Full epidemiological simulation
- 3D Overcooked-style world
- Multiplayer
- Save/Load

---

## Testing Requirements

**CRITICAL:** No Epic is complete until validated in the real browser.

Every change must be tested using Playwright MCP browser tools:
1. `mcp_playwright_browser_navigate` to http://localhost:3000
2. `mcp_playwright_browser_snapshot` to verify UI structure
3. `mcp_playwright_browser_click` to test interactions
4. `mcp_playwright_browser_take_screenshot` for visual verification

This ensures:
- All elements have proper `data-ref` attributes
- Agent-compatible interactions work correctly
- No timing-dependent or broken UI states

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Too many instruments to build | Start with Microscope + Culture, add others incrementally |
| Treatment admin too complex | Simple click-to-apply, skip physical simulation |
| Agent can't navigate UI | Test with Playwright after each Epic |
| Cases too easy/hard | Tune after playtesting |
| Era aesthetic too expensive | Use CSS theming, minimal custom art |

---

## Definition of Done (Prototype Complete)

- [ ] 4 cases playable from triage to outcome
- [ ] All Golden Age instruments functional
- [ ] Multi-instrument workflows required for diagnosis
- [ ] Treatment administration with visible outcome
- [ ] M&M review for failures
- [ ] City impact visible
- [ ] Agent can complete full gameplay loop
- [ ] Core loop is FUN (subjective but essential)
