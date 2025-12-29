# Instrument Design Pattern

## Overview

All instruments in Bio-Logic follow a standardized input/output pattern to ensure:
1. **Isolation**: Each instrument is self-contained with clear boundaries
2. **Realism**: Mimics the actual workflow of real laboratory instruments
3. **Clarity**: Easy to understand what goes in and what comes out
4. **Modularity**: Instruments can be added/modified independently

## Core Principle

```
INPUT → CONFIGURATION → PROCESSING → OBSERVATION → OUTPUT
```

Each instrument follows this workflow:
1. **Receive Input**: Get a sample and case context
2. **User Configuration**: Player sets instrument-specific parameters
3. **Processing**: Instrument runs (with animations/delays for realism)
4. **Observation**: Player views and interprets raw results
5. **Output**: Evidence is recorded for diagnosis

## Instrument Structure

### 1. Input (What the instrument receives)

```typescript
interface InstrumentInput {
  sampleType: SampleType;      // What sample is being analyzed
  caseId: string;               // Current case context
  isCorrectSample: boolean;     // Whether this sample is appropriate
}
```

**Example**: Electrophoresis receives a serum sample from a patient with suspected Multiple Myeloma.

### 2. Configuration (User settings)

```typescript
interface InstrumentConfiguration {
  settings: Record<string, unknown>;  // Instrument-specific settings
  actions: string[];                  // Available actions
}
```

**Example**: 
- Microscope: stain type, magnification, focus depth
- Electrophoresis: voltage, run time, buffer type
- PCR: primer design, annealing temperature, cycles

### 3. Processing (The instrument runs)

The processing phase should:
- Be **realistic**: Use actual time delays or animations
- Be **interactive**: Show progress (e.g., thermal cycling, gel migration)
- Be **observable**: Player can see what's happening
- **Not** automatically interpret results

**Example**: Electrophoresis migration animation shows proteins separating over ~4 seconds.

### 4. Observation (Player interprets results)

The instrument presents **raw data** that the player must interpret:
- Microscope: Cell shapes and colors (player identifies morphology)
- Electrophoresis: Protein band patterns (player categorizes pattern)
- PCR Gel: Band positions (player measures fragment size)

**Key**: The instrument doesn't tell you "this is Multiple Myeloma" - it shows you the M-spike pattern that YOU recognize.

### 5. Output (Evidence for diagnosis)

```typescript
interface InstrumentOutput {
  isComplete: boolean;           // Has the instrument finished?
  observations: Record<string, unknown>;  // Raw observable data
  visualState: Record<string, unknown>;   // Visual rendering state
  evidence?: Record<string, unknown>;     // Recorded evidence
}
```

**Example**: After observing the electrophoresis gel, player records:
- Pattern: "M-spike"
- Albumin level: "Normal"
- Globulin level: "High"

## Workflow Stages

Every instrument goes through these stages:

```typescript
type InstrumentStage = 
  | 'setup'        // Initial configuration
  | 'prepare'      // Sample preparation
  | 'process'      // Main processing (running)
  | 'observe'      // Viewing results
  | 'complete';    // Finished
```

### Stage Transitions

```
setup → prepare → process → observe → complete
  ↑                                       ↓
  └───────────── reset ─────────────────┘
```

## Example: Gel Electrophoresis

### Input
```typescript
{
  sampleType: 'blood',  // Patient serum sample
  caseId: 'case-23',
  isCorrectSample: true
}
```

### Configuration
```typescript
{
  settings: {
    voltage: 120,
    runTime: 90,  // minutes
    bufferType: 'tris-glycine'
  },
  actions: ['load', 'run', 'stain', 'visualize']
}
```

### Processing Steps
1. **Load** (`prepare` stage): Sample loaded into gel
2. **Run** (`process` stage): Electric current applied, proteins migrate (4s animation)
3. **Stain** (`observe` stage): Apply Ponceau S stain to visualize proteins
4. **Visualize** (`observe` stage): View band pattern and record observations

### Output
```typescript
{
  isComplete: true,
  observations: {
    bandPattern: 'm-spike',
    albuminLevel: 'normal',
    globulinLevel: 'high',
    densitometerData: {
      albumin: 58,
      alpha1: 3.2,
      alpha2: 7.8,
      beta: 10.5,
      gamma: 20.5  // Elevated!
    }
  },
  visualState: {
    bandsVisible: true,
    isStained: true,
    migrationComplete: true
  },
  evidence: {
    proteinPattern: 'm-spike',
    albuminLevel: 'normal',
    globulinLevel: 'high'
  }
}
```

### Player Experience
1. Player clicks "Run Electrophoresis" → proteins start migrating
2. Migration completes → "Apply Stain" button becomes available
3. Player applies stain → protein bands become visible
4. Player observes the pattern → records "M-spike" as evidence
5. This evidence filters the diagnosis list to conditions with M-spike patterns

## Example: PCR Workflow

### Input
```typescript
{
  sampleType: 'blood',
  caseId: 'mrsa-case',
  isCorrectSample: true
}
```

### Configuration
```typescript
{
  settings: {
    targetGene: 'mecA',  // MRSA resistance gene
    primerDesign: {
      forwardStart: 50,
      forwardLength: 20,
      reverseStart: 250,
      reverseLength: 20
    },
    cycles: 25,
    annealingTemp: 55
  },
  actions: ['design-primers', 'run-pcr', 'load-gel', 'run-gel', 'visualize']
}
```

### Processing Steps
1. **Design Primers** (`setup` stage): Player designs primers on sequence
2. **Run PCR** (`process` stage): Thermal cycling (25 cycles, ~5s total)
3. **Load Gel** (`prepare` stage): Load PCR product into gel lanes
4. **Run Gel** (`process` stage): Electrophoresis separates DNA by size
5. **Visualize** (`observe` stage): UV light reveals DNA bands

### Output
```typescript
{
  isComplete: true,
  observations: {
    amplificationSuccess: true,
    bandSize: 200,  // bp
    bandIntensity: 'strong',
    primerQuality: 'excellent'
  },
  visualState: {
    pcrComplete: true,
    gelRunComplete: true,
    bandVisible: true
  },
  evidence: {
    mecADetected: true,
    genePresent: 'mecA'
  }
}
```

## Design Principles

### DO:
✅ Make each step **player-initiated** (click to apply stain, click to run)
✅ Show **realistic workflows** (stain before viewing, run before reading)
✅ Present **raw data** (band patterns, not interpretations)
✅ Use **visual feedback** (animations, color changes)
✅ Require **player interpretation** (you identify the M-spike)
✅ Isolate **instrument logic** from game state

### DON'T:
❌ Auto-advance through steps (player controls pacing)
❌ Automatically interpret results (that's the player's job)
❌ Mix instrument state with global game state
❌ Skip realistic steps for convenience
❌ Tell the player the answer
❌ Make assumptions about what player wants to do next

## Implementation Pattern

### Component Structure
```
InstrumentView.svelte           // UI container with controls
  ├── InstrumentComponent.svelte // Visual representation (Phaser, Canvas, SVG)
  ├── ControlPanel.svelte        // User controls for configuration
  └── ObservationPanel.svelte    // Record evidence from observations
```

### State Management
```typescript
// Instrument state is LOCAL to the instrument component
let instrumentState = $state<InstrumentState>({
  stage: 'setup',
  input: {...},
  configuration: {...},
  output: {...},
  isProcessing: false,
  progress: 0
});

// Evidence is recorded to GLOBAL store when player confirms observations
function recordEvidence() {
  addEvidence({
    proteinPattern: instrumentState.output.observations.bandPattern
  });
}
```

### Key Pattern
1. **Local state**: Instrument maintains its own state
2. **Global evidence**: Only confirmed observations go to evidence store
3. **No cross-contamination**: Instrument doesn't know about other instruments
4. **Clear boundaries**: Input/output interfaces are well-defined

## Benefits

1. **Historical Accuracy**: Each instrument works like it did in its era
2. **Educational Value**: Players learn real laboratory workflows
3. **Modularity**: Easy to add new instruments without affecting others
4. **Testability**: Clear inputs and outputs make testing straightforward
5. **Maintainability**: Each instrument is self-contained
6. **Player Agency**: Player controls every step, no hand-holding

## Future Extensions

### Equipment Variations
Different models of the same instrument type could have:
- Different capabilities (resolution, speed, accuracy)
- Different costs
- Different failure rates
- Historical progression (1950s vs 2020s electrophoresis)

### Advanced Features
- **Contamination**: Random chance of contaminated results
- **Equipment Degradation**: Instruments need maintenance
- **Sample Quality**: Poor samples give ambiguous results
- **Time Pressure**: Realistic assay durations

### New Instrument Types
Each follows the same pattern:
- MALDI-TOF Mass Spec
- Flow Cytometry
- Western Blot
- Sanger Sequencing
- Next-Gen Sequencing

All use: INPUT → CONFIG → PROCESS → OBSERVE → OUTPUT

## Migration Guide

### Refactoring Existing Instruments

1. **Identify current state**
   - What inputs does it use?
   - What can the user configure?
   - What processing happens?
   - What outputs are produced?

2. **Define types**
   ```typescript
   interface MyInstrumentConfiguration extends InstrumentConfiguration { ... }
   interface MyInstrumentOutput extends InstrumentOutput { ... }
   ```

3. **Separate concerns**
   - Move visual logic to instrument component
   - Move controls to control panel
   - Move evidence recording to observation panel

4. **Follow the workflow**
   - Ensure stages progress logically
   - Each action advances the stage
   - No skipping required steps

5. **Test the isolation**
   - Can the instrument work independently?
   - Are inputs/outputs clear?
   - Is state properly encapsulated?

## Summary

**Every instrument is a black box with:**
- Clear **inputs** (sample + configuration)
- Realistic **processing** (visible workflow)
- Observable **outputs** (raw data for interpretation)
- Recorded **evidence** (player's observations)

This creates a consistent, educational, and maintainable system where each instrument feels like a real laboratory tool with clear boundaries and realistic behavior.
