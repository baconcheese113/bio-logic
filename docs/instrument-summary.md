# Instrument System Summary

## Overview

This implementation provides a standardized framework for creating laboratory instruments in Bio-Logic with clear input/output isolation and realistic workflows.

## Files Created

### 1. Type Definitions
**`/src/lib/types/instrument.ts`**
- Core interfaces for all instruments
- Standard workflow stages
- Example implementations for specific instruments (Electrophoresis, PCR, Microscope)

### 2. Base Utilities
**`/src/lib/utils/instrument-base.ts`**
- Reusable functions for creating instrument state
- Stage transition helpers
- Processing simulators for realistic delays
- Workflow execution utilities

### 3. Documentation
**`/docs/instrument-pattern.md`**
- Comprehensive guide to the instrument design pattern
- Design principles (DOs and DON'Ts)
- Implementation guidelines
- Migration guide for existing instruments

**`/docs/instrument-example.md`**
- Complete step-by-step example
- Implements a culture plate instrument
- Shows all workflow stages
- Demonstrates best practices

## Core Concept

Every instrument follows this workflow:

```
INPUT → CONFIGURATION → PROCESSING → OBSERVATION → OUTPUT
```

### Workflow Stages

1. **Setup**: Configure instrument settings
2. **Prepare**: Prepare sample for analysis
3. **Process**: Instrument runs (with realistic delays/animations)
4. **Observe**: Player views and interprets raw results
5. **Complete**: Evidence recorded for diagnosis

## Key Principles

### ✅ DO:
- Make each step player-initiated
- Show realistic workflows
- Present raw data (not interpretations)
- Use visual feedback
- Require player interpretation
- Isolate instrument logic

### ❌ DON'T:
- Auto-advance through steps
- Automatically interpret results
- Mix instrument state with game state
- Skip realistic steps
- Tell the player the answer
- Make assumptions about player intentions

## Example Usage

### Define Types
```typescript
interface MyInstrumentConfiguration extends InstrumentConfiguration {
  settings: {
    // Instrument-specific settings
  };
  actions: string[];
}
```

### Create State
```typescript
let state = createInstrumentState(input, config, output);
```

### Implement Actions
```typescript
function runInstrument() {
  state.isProcessing = true;
  await simulateProcessing();
  state.isProcessing = false;
  state.stage = transitionStage(state.stage, 'next');
}
```

## Benefits

1. **Historical Accuracy**: Each instrument works like it did in its era
2. **Educational Value**: Players learn real laboratory workflows
3. **Modularity**: Easy to add instruments without affecting others
4. **Testability**: Clear inputs/outputs make testing straightforward
5. **Maintainability**: Self-contained, easy to modify
6. **Player Agency**: Player controls every step

## Current Status

### ✅ Completed:
- Type system for instruments
- Base utility functions
- Comprehensive documentation
- Example implementation
- Verification with existing instruments

### Verified Working:
- Gel Electrophoresis follows the pattern correctly
- Clear workflow stages (run → migrate → stain → observe)
- Player-controlled progression
- Realistic delays and animations

## Integration

Existing instruments already partially follow this pattern. Future work:

1. **Gradual Migration**: Update instruments one by one
2. **Maintain Compatibility**: No breaking changes to existing functionality
3. **Enhance Consistency**: Apply pattern uniformly across all instruments

## Next Steps

### Immediate:
- [ ] Refactor one existing instrument as a complete example
- [ ] Create instrument catalog/registry
- [ ] Add instrument state persistence

### Future:
- [ ] Equipment variations (different models, eras)
- [ ] Contamination risk system
- [ ] Equipment degradation/maintenance
- [ ] Advanced features (sample quality, time pressure)

## For Developers

### Adding a New Instrument:

1. Define types extending base interfaces
2. Create component with stage-based UI
3. Implement workflow actions
4. Add visual feedback
5. Integrate with evidence store
6. Test each stage independently

### Example Structure:
```
InstrumentView.svelte           // Main container
  ├── InstrumentComponent.svelte // Visual (Phaser/Canvas)
  ├── ControlPanel.svelte        // User controls
  └── ObservationPanel.svelte    // Record evidence
```

## Resources

- **Type Reference**: `/src/lib/types/instrument.ts`
- **Utilities**: `/src/lib/utils/instrument-base.ts`
- **Design Guide**: `/docs/instrument-pattern.md`
- **Example**: `/docs/instrument-example.md`

## Philosophy

> "Every instrument is a black box with clear inputs, realistic processing, and observable outputs. The player interprets raw data - the instrument never tells you the answer."

This creates an educational, engaging experience where mastery comes from understanding how real laboratory tools work, not from memorizing game mechanics.
