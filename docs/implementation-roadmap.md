# Implementation Roadmap

High-level epic breakdown for building the BioLogic playground prototype. Each epic adds one major playable feature or capability.

---

## Phase 1: Foundation (Epics 0-3)
**Goal:** Prove the core diagnostic loop works

### Epic 0: Project Setup
- Initialize project structure and build system
- Set up TypeScript, Phaser, and development environment
- Define data schemas and interfaces
- Basic rendering pipeline functional

### Epic 1: Minimal Diagnostic Loop
- Single fixed case with pre-stained sample
- Microscope viewer displays sample
- Reference manual with one organism
- Diagnosis submission and feedback
- **Playable:** Complete one diagnosis end-to-end

### Epic 2: Staining Mechanic
- Unstained sample view
- Apply Gram stain button
- Visual transformation when stained
- **Playable:** Staining reveals information

### Epic 3: Multiple Organisms
- Add 4 more organisms (total 5)
- Expand reference manual
- Random case generation
- **Playable:** Diagnostic challenge with variety

---

## Phase 2: Strategic Depth (Epics 4-7)
**Goal:** Add player decision-making layers

### Epic 4: Sample Selection
- Case presentation screen with patient story
- Player chooses sample type
- Wrong sample = no diagnostic info
- **Playable:** Pre-test strategic decision

### Epic 5: Sample Quality
- Quality levels (Fresh/Fair/Poor/Spoiled)
- Visual artifacts and degradation
- **Playable:** Recognize good vs bad data

### Epic 6: Microscopy Controls
- Zoom levels (40×, 100×, 400×, 1000×)
- Focus slider with blur effect
- **Playable:** Interactive observation

### Epic 7: Additional Stains
- Acid-fast stain (TB)
- Giemsa stain (malaria)
- Stain selection UI
- **Playable:** Choose appropriate stain

---

## Phase 3: Realism & Complexity (Epics 8-12)
**Goal:** Add realistic constraints and challenges

### Epic 8: Contamination System
- Carefulness slider per test
- Contamination chance based on settings
- Visual contamination artifacts
- **Playable:** Risk/reward speed vs accuracy

### Epic 9: Equipment System
- Zeiss Standard Microscope as equipment object
- Basic equipment stats (magnification, resolution)
- Foundation for future equipment variety
- **Playable:** Equipment context visible to player

### Epic 10: Clinical Context Reasoning
- Same organism in different sample types
- Normal flora vs pathogenic context
- Cases require reasoning beyond identification
- **Playable:** Context-dependent diagnosis

### Epic 11: Ambiguous Cases
- Multiple valid interpretations
- Differential diagnosis scenarios
- Follow-up testing needed
- **Playable:** Complex diagnostic reasoning

### Epic 12: Multi-Sample Cases
- Cases with multiple sample types available
- Player can request additional samples
- Sequential testing strategy
- **Playable:** Comprehensive investigation

---

## Phase 4: Polish & Content (Epics 13-17)
**Goal:** Expand content and improve experience

### Epic 13: Expanded Organism Library
- Add 10-15 more organisms
- Diverse morphologies and contexts
- Agricultural and environmental samples
- **Playable:** Much greater variety

### Epic 14: Case Narrative System
- Rich patient stories
- Historical context (1920s setting)
- Multiple case types (human, agricultural, veterinary)
- **Playable:** Immersive case presentations

### Epic 15: Reference Manual Enhancement
- Searchable interface
- Organized by characteristics
- Educational notes and context
- **Playable:** Better diagnostic workflow

### Epic 16: Feedback & Education
- Detailed explanations after diagnosis
- Learn why answer was correct/wrong
- Historical notes about organisms
- **Playable:** Educational value

### Epic 17: Visual Polish
- Scientific illustration aesthetic
- UI/UX refinement
- Animations and transitions
- **Playable:** Professional feel

---

## Phase 5: Advanced Features (Epics 18-20)
**Goal:** Add sophisticated mechanics

### Epic 18: Culture & Incubation
- Time-delayed culture results
- Choose culture medium
- Colony morphology observation
- **Playable:** Long-term diagnostic strategy

### Epic 19: Equipment Degradation
- Lenses get dirty over time
- Maintenance mechanic
- Visual quality degradation
- **Playable:** Equipment care matters

### Epic 20: Advanced Diagnostics Preview
- Basic gel electrophoresis (PCR placeholder)
- Simple ELISA simulation
- Preview of future eras
- **Playable:** Glimpse of progression

---

## Beyond Playground
**Future work not in current scope:**

- Economic system (money, reagent costs, daily cycle)
- Time pressure (real-time work day)
- Lab progression (kitchen → basement → professional lab)
- Historical era transitions (1950s, 1980s, 2000s, 2020s)
- Real data API integration (NCBI BLAST, etc.)
- Additional assay types (Western blot, flow cytometry, sequencing)
- Computational bioinformatics tools
- Multi-omics analysis

---

**Flexible approach:** Epics can be reordered, combined, or skipped based on learning and priorities. Each should deliver independently testable value.
