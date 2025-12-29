# Example: Implementing a New Instrument

This guide shows how to implement a new instrument using the standardized input/output pattern.

## Example: Simple Culture Plate Instrument

Let's create a basic bacterial culture plate instrument that follows the standard workflow.

### Step 1: Define the Types

```typescript
// In your instrument file or a types file
import type {
  InstrumentConfiguration,
  InstrumentOutput,
  InstrumentInput,
  InstrumentState,
} from '../types/instrument';

interface CulturePlateConfiguration extends InstrumentConfiguration {
  settings: {
    mediaType: 'blood-agar' | 'macconkey';
    incubationTemp: number;
    incubationTime: number; // in hours
  };
  actions: ('select-media' | 'streak' | 'incubate' | 'observe')[];
}

interface CulturePlateOutput extends InstrumentOutput {
  observations: {
    colonyCount: number | null;
    colonyColor: 'golden' | 'white' | 'pink' | 'none';
    hemolysis: 'alpha' | 'beta' | 'gamma' | 'none';
    growthQuality: 'none' | 'poor' | 'good';
  };
  visualState: {
    mediaSelected: boolean;
    isStreaked: boolean;
    isIncubating: boolean;
    coloniesVisible: boolean;
    colonyPositions?: Array<{ left: number; top: number }>;
  };
}
```

### Step 2: Create the Component State

```svelte
<script lang="ts">
  import { createInstrumentState, transitionStage } from '../utils/instrument-base';
  import type { InstrumentInput } from '../types/instrument';
  
  // Props (inputs from parent)
  export let input: InstrumentInput;
  
  // Initialize instrument state
  let state = $state<InstrumentState>(
    createInstrumentState<CulturePlateConfiguration, CulturePlateOutput>(
      input,
      {
        settings: {
          mediaType: 'blood-agar',
          incubationTemp: 37,
          incubationTime: 24,
        },
        actions: ['select-media', 'streak', 'incubate', 'observe'],
      },
      {
        isComplete: false,
        observations: {
          colonyCount: null,
          colonyColor: 'none',
          hemolysis: 'none',
          growthQuality: 'none',
        },
        visualState: {
          mediaSelected: false,
          isStreaked: false,
          isIncubating: false,
          coloniesVisible: false,
        },
      }
    )
  );
</script>
```

### Step 3: Implement the Workflow Actions

```svelte
<script lang="ts">
  // ... previous code ...
  
  // Action 1: Select Media
  function selectMedia(mediaType: 'blood-agar' | 'macconkey') {
    state.configuration.settings.mediaType = mediaType;
    state.output.visualState.mediaSelected = true;
    state.stage = transitionStage(state.stage, 'next'); // setup → prepare
  }
  
  // Action 2: Streak Plate
  function streakPlate() {
    if (!state.output.visualState.mediaSelected) return;
    
    state.output.visualState.isStreaked = true;
    state.stage = transitionStage(state.stage, 'next'); // prepare → process
  }
  
  // Action 3: Incubate
  async function incubate() {
    if (!state.output.visualState.isStreaked) return;
    
    state.isProcessing = true;
    state.output.visualState.isIncubating = true;
    
    // Simulate incubation time (scaled down for gameplay)
    const incubationDuration = state.configuration.settings.incubationTime * 100; // ms per hour
    
    await simulateIncubation(incubationDuration);
    
    // After incubation, colonies become visible
    state.output.visualState.isIncubating = false;
    state.output.visualState.coloniesVisible = true;
    state.isProcessing = false;
    state.stage = transitionStage(state.stage, 'next'); // process → observe
    
    // Generate colony data based on sample
    generateColonies();
  }
  
  async function simulateIncubation(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
  
  // Action 4: Generate Colonies (happens after incubation)
  function generateColonies() {
    // This would normally be based on the organism in the sample
    // For this example, we'll use mock data
    if (state.input.isCorrectSample) {
      state.output.observations = {
        colonyCount: 50,
        colonyColor: 'golden',
        hemolysis: 'beta',
        growthQuality: 'good',
      };
    } else {
      state.output.observations = {
        colonyCount: 5,
        colonyColor: 'white',
        hemolysis: 'gamma',
        growthQuality: 'poor',
      };
    }
    
    // Generate fixed colony positions (stored in visualState)
    // This ensures colonies don't move on re-renders
    const colonyCount = state.output.observations.colonyCount || 0;
    state.output.visualState.colonyPositions = Array.from({ length: colonyCount }, () => ({
      left: Math.random() * 80 + 10,
      top: Math.random() * 80 + 10,
    }));
  }
  
  // Action 5: Record Evidence
  function recordEvidence() {
    state.output.isComplete = true;
    state.output.evidence = { ...state.output.observations };
    state.stage = transitionStage(state.stage, 'next'); // observe → complete
    
    // Dispatch event to parent to record in evidence store
    // (or call evidence store directly)
  }
</script>
```

### Step 4: Create the UI

```svelte
<div class="culture-plate-instrument">
  <!-- Stage: Setup - Select Media -->
  {#if state.stage === 'setup'}
    <div class="setup-panel">
      <h3>Select Culture Media</h3>
      <button 
        onclick={() => selectMedia('blood-agar')}
        class:selected={state.configuration.settings.mediaType === 'blood-agar'}
      >
        Blood Agar
      </button>
      <button 
        onclick={() => selectMedia('macconkey')}
        class:selected={state.configuration.settings.mediaType === 'macconkey'}
      >
        MacConkey Agar
      </button>
    </div>
  {/if}
  
  <!-- Stage: Prepare - Streak Plate -->
  {#if state.stage === 'prepare'}
    <div class="prepare-panel">
      <div class="petri-dish">
        {#if state.output.visualState.mediaSelected}
          <div class="media {state.configuration.settings.mediaType}">
            {#if state.output.visualState.isStreaked}
              <div class="streak-marks"></div>
            {/if}
          </div>
        {/if}
      </div>
      
      <button 
        onclick={streakPlate}
        disabled={!state.output.visualState.mediaSelected || state.output.visualState.isStreaked}
      >
        {state.output.visualState.isStreaked ? 'Streaked ✓' : 'Streak Sample'}
      </button>
    </div>
  {/if}
  
  <!-- Stage: Process - Incubate -->
  {#if state.stage === 'process'}
    <div class="process-panel">
      <div class="incubator">
        <div class="temperature-display">
          {state.configuration.settings.incubationTemp}°C
        </div>
        
        <div class="petri-dish">
          <div class="media {state.configuration.settings.mediaType}">
            {#if state.output.visualState.isStreaked}
              <div class="streak-marks"></div>
            {/if}
          </div>
        </div>
        
        {#if state.output.visualState.isIncubating}
          <div class="incubating-indicator">
            Incubating... {state.configuration.settings.incubationTime}h
          </div>
        {/if}
      </div>
      
      <button 
        onclick={incubate}
        disabled={state.isProcessing || state.output.visualState.coloniesVisible}
      >
        {state.output.visualState.isIncubating ? 'Incubating...' : 
         state.output.visualState.coloniesVisible ? 'Incubation Complete ✓' : 
         'Start Incubation'}
      </button>
    </div>
  {/if}
  
  <!-- Stage: Observe - View Colonies -->
  {#if state.stage === 'observe'}
    <div class="observe-panel">
      <div class="petri-dish enlarged">
        <div class="media {state.configuration.settings.mediaType}">
          {#if state.output.visualState.coloniesVisible && state.output.visualState.colonyPositions}
            <div class="colonies">
              <!-- Render colonies using fixed positions -->
              {#each state.output.visualState.colonyPositions as position, i}
                <div 
                  class="colony {state.output.observations.colonyColor}"
                  style="left: {position.left}%; top: {position.top}%"
                ></div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      
      <div class="observations">
        <h3>Record Observations</h3>
        
        <div class="observation-group">
          <label>Colony Color:</label>
          <div class="options">
            <button 
              class:selected={state.output.observations.colonyColor === 'golden'}
              onclick={() => state.output.observations.colonyColor = 'golden'}
            >
              Golden
            </button>
            <button 
              class:selected={state.output.observations.colonyColor === 'white'}
              onclick={() => state.output.observations.colonyColor = 'white'}
            >
              White
            </button>
            <button 
              class:selected={state.output.observations.colonyColor === 'pink'}
              onclick={() => state.output.observations.colonyColor = 'pink'}
            >
              Pink
            </button>
          </div>
        </div>
        
        <div class="observation-group">
          <label>Hemolysis:</label>
          <div class="options">
            <button 
              class:selected={state.output.observations.hemolysis === 'alpha'}
              onclick={() => state.output.observations.hemolysis = 'alpha'}
            >
              Alpha (partial)
            </button>
            <button 
              class:selected={state.output.observations.hemolysis === 'beta'}
              onclick={() => state.output.observations.hemolysis = 'beta'}
            >
              Beta (complete)
            </button>
            <button 
              class:selected={state.output.observations.hemolysis === 'gamma'}
              onclick={() => state.output.observations.hemolysis = 'gamma'}
            >
              Gamma (none)
            </button>
          </div>
        </div>
        
        <button onclick={recordEvidence} class="primary">
          Record Evidence
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Stage: Complete -->
  {#if state.stage === 'complete'}
    <div class="complete-panel">
      <h3>✓ Culture Complete</h3>
      <p>Evidence recorded. Proceed to diagnosis or run another test.</p>
    </div>
  {/if}
</div>

<style>
  .culture-plate-instrument {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .petri-dish {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 3px solid #333;
    position: relative;
    overflow: hidden;
  }
  
  .petri-dish.enlarged {
    width: 300px;
    height: 300px;
  }
  
  .media {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .media.blood-agar {
    background: #8b2e2e;
  }
  
  .media.macconkey {
    background: #d4a9a9;
  }
  
  .colony {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .colony.golden {
    background: #ffd700;
  }
  
  .colony.white {
    background: #f0f0f0;
  }
  
  .colony.pink {
    background: #ff69b4;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    margin: 0.5rem;
    border: 2px solid #333;
    background: #f0f0f0;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover:not(:disabled) {
    background: #e0e0e0;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  button.selected {
    background: #4a7c59;
    color: white;
  }
  
  button.primary {
    background: #4a7c59;
    color: white;
    font-weight: bold;
  }
</style>
```

## Key Points Demonstrated

### 1. Clear Stage Progression
```
setup → prepare → process → observe → complete
```
Each stage has specific UI and actions available.

### 2. State Isolation
- All instrument state is local to the component
- Only recorded evidence goes to global store
- No cross-contamination with other instruments

### 3. User Control
- Player initiates each action
- No auto-advancement between stages
- Clear visual feedback for each state

### 4. Realistic Workflow
- Select media (configuration)
- Streak sample (preparation)
- Incubate (processing with delay)
- Observe colonies (interpretation)
- Record evidence (output)

### 5. Visual Feedback
- Petri dish changes appearance based on state
- Colonies appear after incubation
- Buttons show current state (disabled, selected, etc.)

## Integration with Game

### Parent Component Usage

```svelte
<script lang="ts">
  import CulturePlateInstrument from './CulturePlateInstrument.svelte';
  import { currentCase, selectedSample } from '../stores/game-state';
  
  // Create input for instrument
  const instrumentInput = {
    sampleType: $selectedSample,
    caseId: $currentCase.id,
    isCorrectSample: $selectedSample === $currentCase.correctSampleType,
  };
</script>

<CulturePlateInstrument input={instrumentInput} />
```

### Recording Evidence

When the player clicks "Record Evidence", the instrument emits an event or directly updates the evidence store:

```typescript
import { addEvidence } from '../stores/evidence';

function recordEvidence() {
  state.output.isComplete = true;
  state.output.evidence = { ...state.output.observations };
  
  // Add to global evidence store
  addEvidence({
    instrumentType: 'culture-plate',
    colonyColor: state.output.observations.colonyColor,
    hemolysis: state.output.observations.hemolysis,
    growthQuality: state.output.observations.growthQuality,
  });
  
  state.stage = 'complete';
}
```

## Benefits of This Pattern

1. **Modular**: Each instrument is self-contained
2. **Testable**: Clear inputs and outputs make testing straightforward
3. **Maintainable**: Easy to modify one instrument without affecting others
4. **Educational**: Mimics real laboratory workflow
5. **Extensible**: Easy to add new instruments following the same pattern

## Next Steps

- Add animations for incubation process
- Implement contamination risk mechanic
- Add equipment variations (different incubators)
- Create reference cards for colony identification
- Add sound effects for realism

This pattern can be applied to any instrument in the game, ensuring consistency and quality across all laboratory tools.
