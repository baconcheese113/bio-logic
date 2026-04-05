# Bio-Logic Game Engine

> Isolated game engine in `src/game/` - do not import from `src/lib/` or `src/data/`

## Architecture Overview

```
src/game/
├── index.ts              # Main exports + resetGame()
├── types.ts              # All type definitions (single source of truth)
├── clock.svelte.ts       # Game time (tick-based)
├── instruments.svelte.ts # Instrument factory & state machines
├── inventory.svelte.ts   # Unified sample/result tracking
├── cases.svelte.ts       # Case lifecycle & scoring
├── progression.svelte.ts # Reputation, funds, tech tree, lawsuits
├── observations.ts       # Structured observation field definitions ✓
├── README.md             # This file
└── data/                 # Game data ✓
    ├── index.ts          # Data exports
    ├── cases.ts          # 10 case definitions (classical + golden-age)
    └── organisms.ts      # 10 organism definitions with full properties
```

## Core Concepts

### 1. Game Clock (`clock.svelte.ts`)
- **Tick-based time**: 10 ticks/second at 1x speed
- **Speed control**: 0 = paused, 1 = normal, 2+ = fast forward
- Instruments read `gameClock.tick` to compute progress
- Use `$effect` ONLY for the `setInterval` side effect

### 2. Instruments (`instruments.svelte.ts`)
- **Isolated state machines**: Each instance is independent
- **States**: `idle` → `loading` → `processing` → `complete`
- **Multiple instances**: Player can own multiple of same type
- **Config-driven**: `INSTRUMENT_CONFIGS` defines processing time, era, costs, compatible samples

### 3. Inventory (`inventory.svelte.ts`)
- **Single source of truth** for all samples and derived products
- **Usage tracking**: `usedInInstruments: string[]` tracks where each sample is loaded
- **No duplication**: Same sample can be in multiple instruments simultaneously
- **Patient samples**: Collected from case, cost funds
- **Derived samples**: Created by instruments (culture isolate, PCR amplicon, etc.)

### 4. Cases (`cases.svelte.ts`)
- **Per-case observations**: Structured data, not global
- **Atomic submission**: All fields submitted at once
- **Scoring**: 50% penalty per wrong field, confidence modifier
- **Lawsuits**: Probability based on era × severity

### 5. Progression (`progression.svelte.ts`)
- **Reputation**: 0-100, gates era advancement (need 60+ to progress)
- **Funds**: Used to buy instruments and samples
- **Tech tree**: Instruments unlock in order with prerequisites
- **Eras**: classical → golden-age → molecular → genomic → modern

## Era Timeline

| Era | Year | Key Instruments |
|-----|------|-----------------|
| Classical | 1880 | Microscope, Culture plates |
| Golden Age | 1940 | Biochemical panels, Serology |
| Molecular | 1970 | Electrophoresis, PCR, ELISA |
| Genomic | 1995 | Sanger sequencing |
| Modern | 2020 | Flow cytometry, NGS |

## Sample Flow

```
Patient Sample (blood, sputum, etc.)
    ↓
┌───────────────────────────────────────────┐
│ Microscope → Gram slide (observation)     │
│ Culture Plate → Culture isolate           │
│ PCR Thermocycler → PCR amplicon           │
│ Sanger Sequencer → Sequence data          │
└───────────────────────────────────────────┘
    ↓
Observations recorded per case
    ↓
Submit diagnosis + treatment + genetic factors
    ↓
Scoring → Reputation/Funds change → Possible lawsuit
```

## Observation System (Structured Data)

Observations are **multiple choice** wherever possible (like microscopy in the current app).
Each instrument type defines its observation fields:

```typescript
// Example: Microscope observations
{
  fieldId: 'gram-stain',
  category: 'staining',
  label: 'Gram Stain Result',
  type: 'select',
  options: ['Gram-positive', 'Gram-negative', 'Variable', 'Not applicable']
}
```

Player must interpret what they see and select the correct option.

## Key Design Principles

1. **Less code is better** - Avoid unnecessary abstraction
2. **Single source of truth** - Types inferred from data, no duplication
3. **Svelte 5 runes** - Use `$state`, `$derived`; avoid `$effect` for state sync
4. **Isolated modules** - Game engine has no dependencies on src/lib/
5. **Realistic mechanics** - Sample costs, lawsuit probabilities, era-appropriate tools

## TODO

- [ ] Add expected observations to organisms (what microscopy/culture results to show)
- [ ] Create diagnosis validator (compare player observations to expected)
- [ ] Build UI components that consume this engine
- [ ] Add more cases for molecular, genomic, modern eras
- [ ] Add viral/parasitic organisms
- [ ] Add instrument-specific rendering logic

## Current Status

### Completed ✓
- Core types (`types.ts`)
- Game clock with tick-based time (`clock.svelte.ts`)
- Instrument factory with isolated state machines (`instruments.svelte.ts`)
- Unified inventory with usage tracking (`inventory.svelte.ts`)
- Case manager with per-case observations (`cases.svelte.ts`)
- Progression system with tech tree and lawsuits (`progression.svelte.ts`)
- Observation field definitions for all instrument types (`observations.ts`)
- 10 case definitions spanning classical and golden-age eras (`data/cases.ts`)
- 10 organism definitions with full biological properties (`data/organisms.ts`)

### Next Steps
1. **Expected observations**: Link organisms to expected observation values so we can validate player answers
2. **Diagnosis validator**: Compare what player observed vs what they should observe for the correct organism
3. **Simple test UI**: Minimal Svelte component to test the game loop end-to-end

## Usage Example

```typescript
import { 
  gameClock, 
  cases, 
  progression, 
  inventory,
  createInstrument,
  acceptCase,
  collectPatientSample,
  loadInstrument,
  startProcessing
} from '../game';

// Accept a case
const activeCase = acceptCase('strep-throat-001');

// Collect a sample (costs funds)
const sample = collectPatientSample(activeCase.id, 'throat-swab');

// Create and use an instrument
const microscope = createInstrument('microscope');
loadInstrument(microscope.id, sample.id);
startProcessing(microscope.id);

// Record observations (structured data)
recordObservation(activeCase.id, 'gram-stain', 'Gram-positive', microscope.id);
recordObservation(activeCase.id, 'morphology', 'cocci-chains', microscope.id);

// Submit diagnosis
const result = submitCase(activeCase.id, {
  diagnosis: 'streptococcus-pyogenes',
  treatment: 'penicillin',
  confidence: 'high'
});

// Apply results to player
applyCaseResult(result);
```
