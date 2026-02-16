Read [](file:///c%3A/Users/bacon/Documents/WebDev/Personal/bio-games/bio-logic/docs/implementation-plan.md)

Using "Create File"

I can't create files right now. Here's the complete implementation plan — you can save it to `docs/mvp-gameplay-loop.md`:

```markdown
# MVP Gameplay Loop Implementation Plan

**Goal:** Build the simplest complete gameplay loop for BioLogic prototype.

**Loop:** Accept case → Collect sample → Stain → View under microscope → Record observation → Submit diagnosis → See outcome.

**Case:** Wound Infection (Golden Age) — Gram-positive cocci in clusters = *Staphylococcus aureus*

---

## Current Prototype State

The prototype in `prototypes/svelte-lab-avatar/` has:

| Component | Status | Capabilities |
|-----------|--------|--------------|
| `App.svelte` | ✅ Working | Lab state, tick simulation, sample degradation, player movement, sample pickup/drop |
| `LabGrid.svelte` | ✅ Working | 8x6 tile grid, zoom/pan, renders instruments and player |
| `ClockBar.svelte` | ✅ Working | Time display, pause/speed controls (1x/2x/5x/10x), era badge |
| `InstrumentTile.svelte` | ✅ Working | Clickable instruments, sample slots, status indicators, double-click for detail |
| `InstrumentDetailView.svelte` | ✅ Working | Fullscreen modal wrapper, routes to instrument-specific UIs |
| `MicroscopeStage.svelte` | ⚠️ Visual Only | Shows microscope parts, stub buttons (no functionality) |
| `PlayerAvatar.svelte` | ✅ Working | Player position and facing direction |
| `SampleHUD.svelte` | ✅ Working | Shows currently held sample |

**What's Missing:**
- Case system (no cases exist)
- Sample collection from cases
- Staining workflow (placeholder only)
- Microscope observation recording
- Artifact/Observation data structures
- Diagnosis submission
- Outcome/feedback

---

## Phase 0: Adjacency Check for Detail View

**Problem:** Player can double-click distant instruments to open detail view.

**Fix:** In `App.svelte`, update `handleInstrumentDoubleClick` to check `isAdjacent(playerPosition, instrumentPosition)` before opening.

**Files to modify:**
- `prototypes/svelte-lab-avatar/App.svelte`

**Verification:** 
- Double-click distant instrument → nothing happens
- Walk adjacent to instrument → double-click → detail view opens

---

## Phase 1: Case System + Triage

**Goal:** Player sees a case and accepts it.

### Types to Add (`prototypes/shared/types.ts`)

```typescript
type CaseStatus = 'available' | 'active' | 'submitted' | 'completed';

interface Case {
  id: string;
  title: string;
  patientName: string;
  synopsis: string;           // Brief patient complaint
  status: CaseStatus;
  availableSamples: SampleType[];  // What can be collected
  correctOrganism: string;    // For checking answer
}
```

### State Changes (`prototypes/shared/types.ts`)

Add to `LabState`:
```typescript
activeCase: Case | null;
pendingCase: Case | null;  // Case waiting to be triaged
```

### New Component

**`CaseTriage.svelte`** — Overlay when `pendingCase` exists and `activeCase` is null:
- Shows patient name, synopsis
- "Accept Case" button → moves case to `activeCase`
- Closes overlay

### Mock Data

Add ONE hardcoded case to `mock-data.ts`:
```typescript
const WOUND_INFECTION_CASE: Case = {
  id: 'case-wound-001',
  title: 'Wound Infection',
  patientName: 'Thomas Miller',
  synopsis: 'Factory worker, 34. Deep laceration on forearm from machinery 3 days ago. Wound now red, swollen, with purulent discharge. Fever 101°F.',
  status: 'available',
  availableSamples: ['wound-swab'],
  correctOrganism: 'staphylococcus-aureus',
};
```

### Files to Create/Modify
- types.ts — add Case type, update LabState
- mock-data.ts — add case data, set pendingCase
- `prototypes/svelte-lab-avatar/components/CaseTriage.svelte` — new
- App.svelte — render CaseTriage when pendingCase exists

### Verification
- Game starts → triage overlay shows patient info
- Click "Accept Case" → overlay closes
- `labState.activeCase` is now set

---

## Phase 2: Sample Collection

**Goal:** Player collects wound swab from the active case.

### Approach

Add a "Patient Bay" instrument to the lab grid. When player is adjacent and double-clicks:
- If `activeCase` exists and has `availableSamples`
- Show available samples to collect
- Click sample → player picks it up (uses existing `heldSample` system)
- Sample is linked to `caseId`

### Files to Create/Modify
- types.ts — add `'patient-bay'` to InstrumentType
- mock-data.ts — add patient-bay instrument to grid
- `prototypes/svelte-lab-avatar/components/instruments/PatientBay.svelte` — new
- InstrumentDetailView.svelte — route to PatientBay

### Verification
- Accept case → walk to patient bay → double-click
- See available sample (wound-swab)
- Click → player now holds wound-swab sample
- Sample shows in SampleHUD with case info

---

## Phase 3: Staining Bench Workflow

**Goal:** Load wound swab → Apply Gram stain → Produce stained slide.

### Workflow Steps

1. Load sample onto bench (drop from player hand)
2. Click "Apply Gram Stain" button
3. Processing begins (uses tick system, ~30 ticks = 3 seconds at 1x)
4. When done: produces `slide` sample with `parentSampleId` pointing to wound-swab
5. Player picks up the stained slide

### Types to Add

Add to SampleType: `| 'slide'`

### Files to Create/Modify
- types.ts — add 'slide' to SampleType
- `prototypes/svelte-lab-avatar/components/instruments/StainingBench.svelte` — new
- InstrumentDetailView.svelte — route to StainingBench
- App.svelte — handle sample creation when staining completes

### Verification
- Carry wound-swab to staining bench → double-click → enter detail view
- Drop sample onto bench
- Click "Apply Gram Stain" → progress bar advances
- When done: "Stained Slide Ready" appears
- Click pickup → player now holds slide sample

---

## Phase 4: Microscope Observation

**Goal:** View stained slide → Record structured observation.

### Updates to MicroscopeStage.svelte

1. **Slide Loading:** Click stage while holding slide → loads it
2. **Viewing Area:** Show simulated microscope image (Gram+ cocci in clusters)
3. **Observation Form:** Dropdowns:
   - Gram Reaction: `positive | negative | variable | not-applicable`
   - Morphology: `cocci | bacilli | coccobacilli | spirochete | none-seen`
   - Arrangement: `clusters | chains | pairs | singles | mixed`
4. **Record Button:** Saves observation to case

### Types to Add

```typescript
interface Observation {
  id: string;
  caseId: string;
  sampleId: string;
  instrumentType: InstrumentType;
  recordedAtTick: number;
  fields: {
    gramReaction?: 'positive' | 'negative' | 'variable' | 'not-applicable';
    morphology?: 'cocci' | 'bacilli' | 'coccobacilli' | 'spirochete' | 'none-seen';
    arrangement?: 'clusters' | 'chains' | 'pairs' | 'singles' | 'mixed';
  };
}
```

Add to LabState: `observations: Observation[];`

### Files to Modify
- types.ts — add Observation type, update LabState
- mock-data.ts — initialize observations: []
- MicroscopeStage.svelte — add functionality
- App.svelte — handler for recording observations

### Verification
- Carry stained slide to microscope → load onto stage
- See microscope image
- Select dropdowns → click "Record Observation"
- Observation saved to `labState.observations`

---

## Phase 5: Diagnosis Submission

**Goal:** Answer "What organism is causing this?"

### New Component

**`DiagnosisSubmission.svelte`** — Modal with:
- Question: "What is the causative organism?"
- Dropdown: `staphylococcus-aureus`, `streptococcus-pyogenes`, etc.
- Evidence summary: Shows recorded observations
- "Submit Diagnosis" button

### Types to Add

```typescript
interface DiagnosisAnswer {
  caseId: string;
  selectedOrganism: string;
  submittedAtTick: number;
  isCorrect: boolean;
}
```

Add to LabState: `submittedDiagnosis: DiagnosisAnswer | null;`

### Files to Create/Modify
- types.ts — add DiagnosisAnswer, update LabState
- `prototypes/svelte-lab-avatar/components/DiagnosisSubmission.svelte` — new
- App.svelte — show modal, handle submission

### Verification
- Click "Submit Diagnosis" (add button to UI)
- Modal shows observation evidence
- Select organism → Submit
- Answer stored in state

---

## Phase 6: Outcome

**Goal:** See if diagnosis was correct, complete the loop.

### New Component

**`CaseOutcome.svelte`** — Overlay after diagnosis:
- Correct: "Correct! The patient had *Staphylococcus aureus*."
- Wrong: "Incorrect. The correct answer was *Staphylococcus aureus*."
- "Continue" button → clears case, returns to start

### State Changes on Continue
- Set `activeCase` to null
- Clear `submittedDiagnosis`
- Clear `observations`
- Optionally set new `pendingCase`

### Files to Create/Modify
- `prototypes/svelte-lab-avatar/components/CaseOutcome.svelte` — new
- App.svelte — show outcome, handle continue

### Verification
- Correct diagnosis → "Correct!" shown
- Wrong diagnosis → "Incorrect" with correct answer
- Continue → back to start
- Full loop complete

---

## File Summary

### New Files to Create
| File | Phase |
|------|-------|
| `components/CaseTriage.svelte` | 1 |
| `components/instruments/PatientBay.svelte` | 2 |
| `components/instruments/StainingBench.svelte` | 3 |
| `components/DiagnosisSubmission.svelte` | 5 |
| `components/CaseOutcome.svelte` | 6 |

### Files to Modify
| File | Phases |
|------|--------|
| types.ts | 1, 3, 4, 5 |
| mock-data.ts | 1, 2, 4 |
| App.svelte | 0, 1, 2, 3, 4, 5, 6 |
| `components/InstrumentDetailView.svelte` | 2, 3 |
| `components/instruments/MicroscopeStage.svelte` | 4 |

---

## Not In This MVP

- Multiple cases / case queue
- Patient deterioration / time pressure
- Economy (funds, costs)
- Culture workflow / Serology workflow
- City view / epidemiology
- M&M review details
- Save/load
```

Would you like me to output this differently, or should I proceed with implementing Phase 0 (adjacency fix)?Would you like me to output this differently, or should I proceed with implementing Phase 0 (adjacency fix)?