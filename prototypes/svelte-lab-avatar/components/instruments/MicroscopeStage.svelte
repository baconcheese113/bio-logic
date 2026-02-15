<script lang="ts">
  import type { Instrument, Sample, MicroscopeFindings, Observation } from '../../../shared/types';
  import { SAMPLE_COLORS, CONDITION_OPACITY } from '../../../shared/types';
  import { getCaseTemplate } from '../../../shared/mock-data';

  interface Props {
    instrument: Instrument;
    samples: Sample[];
    observations: Observation[];
    onRecordObservation?: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;
  }

  let { instrument, samples, observations, onRecordObservation }: Props = $props();
  
  const loadedSample = $derived(samples[0] ?? null);
  
  // Focus state: 0 = blurry, 100 = sharp
  let focusLevel = $state(0);
  let selectedObjective = $state<'10x' | '40x' | '100x'>('10x');
  
  // Get the actual findings for this sample's case
  const caseTemplate = $derived(
    loadedSample 
      ? getCaseTemplate(loadedSample.caseId.replace('case-', ''))
      : null
  );
  
  // The actual microscope findings that should be displayed
  const actualFindings = $derived<MicroscopeFindings | null>(
    caseTemplate?.findings?.microscope ?? null
  );
  
  // Get existing observations for this sample
  const existingObservations = $derived(
    loadedSample
      ? observations.filter(o => o.patientId === loadedSample.patientId && o.instrumentType === 'microscope')
      : []
  );
  
  // Observation selection state
  let selectedGram = $state<string | null>(null);
  let selectedShape = $state<string | null>(null);
  let selectedArrangement = $state<string | null>(null);
  let selectedSpecial = $state<string[]>([]);
  
  // Track which sample we've initialized for (to avoid re-syncing)
  let initializedForSampleId = $state<string | null>(null);
  
  // Initialize selections from existing observations when sample changes
  // Using $effect.pre to run before DOM update and avoid unnecessary re-runs
  $effect.pre(() => {
    const currentSampleId = loadedSample?.id ?? null;
    
    // Only initialize when sample changes
    if (currentSampleId !== initializedForSampleId) {
      initializedForSampleId = currentSampleId;
      
      if (loadedSample) {
        // Get existing observations for this sample
        const sampleObs = observations.filter(
          o => o.patientId === loadedSample.patientId && o.instrumentType === 'microscope'
        );
        
        selectedGram = sampleObs.find(o => o.field === 'gram')?.value ?? null;
        selectedShape = sampleObs.find(o => o.field === 'shape')?.value ?? null;
        selectedArrangement = sampleObs.find(o => o.field === 'arrangement')?.value ?? null;
        
        // Collect special observations
        const special: string[] = [];
        if (sampleObs.find(o => o.field === 'acid-fast')?.value === 'positive') special.push('acid-fast');
        if (sampleObs.find(o => o.field === 'capsule')?.value === 'positive') special.push('capsule');
        if (sampleObs.find(o => o.field === 'spores')?.value === 'positive') special.push('spores');
        selectedSpecial = special;
      } else {
        selectedGram = null;
        selectedShape = null;
        selectedArrangement = null;
        selectedSpecial = [];
      }
    }
  });
  
  const isInFocus = $derived(focusLevel >= 80);
  const canRecord = $derived(isInFocus && selectedGram && selectedShape && selectedArrangement);
  
  // Blur amount based on focus
  const blurAmount = $derived(Math.max(0, (100 - focusLevel) / 10));
  
  function handleFocusWheel(e: WheelEvent) {
    e.preventDefault();
    focusLevel = Math.max(0, Math.min(100, focusLevel + (e.deltaY > 0 ? -5 : 5)));
  }
  
  function adjustFocus(delta: number) {
    focusLevel = Math.max(0, Math.min(100, focusLevel + delta));
  }
  
  function selectObjective(obj: '10x' | '40x' | '100x') {
    selectedObjective = obj;
    // Changing objective throws off focus
    focusLevel = Math.max(0, focusLevel - 30);
  }
  
  function toggleSpecial(val: string) {
    if (selectedSpecial.includes(val)) {
      selectedSpecial = selectedSpecial.filter(s => s !== val);
    } else {
      selectedSpecial = [...selectedSpecial, val];
    }
  }
  
  function recordObservation() {
    if (!loadedSample || !canRecord || !onRecordObservation) return;
    
    // Record each selected observation
    if (selectedGram) {
      onRecordObservation({
        patientId: loadedSample.patientId,
        caseId: loadedSample.caseId,
        patientName: loadedSample.label.split(' - ')[1] || 'Unknown',
        instrumentType: 'microscope',
        field: 'gram',
        value: selectedGram,
      });
    }
    if (selectedShape) {
      onRecordObservation({
        patientId: loadedSample.patientId,
        caseId: loadedSample.caseId,
        patientName: loadedSample.label.split(' - ')[1] || 'Unknown',
        instrumentType: 'microscope',
        field: 'shape',
        value: selectedShape,
      });
    }
    if (selectedArrangement) {
      onRecordObservation({
        patientId: loadedSample.patientId,
        caseId: loadedSample.caseId,
        patientName: loadedSample.label.split(' - ')[1] || 'Unknown',
        instrumentType: 'microscope',
        field: 'arrangement',
        value: selectedArrangement,
      });
    }
    for (const special of selectedSpecial) {
      onRecordObservation({
        patientId: loadedSample.patientId,
        caseId: loadedSample.caseId,
        patientName: loadedSample.label.split(' - ')[1] || 'Unknown',
        instrumentType: 'microscope',
        field: special,
        value: 'positive',
      });
    }
    
    // Keep selections visible - user can change and re-record to update
  }
</script>

<div class="microscope-stage" data-ref="microscope-stage">
  <!-- Left: Visual field (what you see through eyepiece) -->
  <div class="visual-field-container">
    <div class="eyepiece-frame">
      <div 
        class="visual-field" 
        onwheel={handleFocusWheel}
        style:filter="blur({blurAmount}px)"
      >
        {#if loadedSample && isInFocus && actualFindings}
          <!-- Simulated microscope view based on actual case findings -->
          <div class="organism-view">
            {#each Array(12) as _, i}
              <div 
                class="cell {actualFindings.gram === 'positive' ? 'gram-pos' : 'gram-neg'} {actualFindings.shape}"
                style:left="{20 + (i % 4) * 60 + Math.random() * 20}px"
                style:top="{20 + Math.floor(i / 4) * 60 + Math.random() * 20}px"
              ></div>
            {/each}
          </div>
        {:else if loadedSample && isInFocus}
          <!-- Fallback if no findings defined -->
          <div class="organism-view">
            {#each Array(8) as _, i}
              <div 
                class="cell gram-pos cocci"
                style:left="{30 + (i % 4) * 55 + Math.random() * 15}px"
                style:top="{30 + Math.floor(i / 4) * 55 + Math.random() * 15}px"
              ></div>
            {/each}
          </div>
        {:else if loadedSample}
          <div class="blur-hint">Adjust focus wheel →</div>
        {:else}
          <div class="empty-field">No slide loaded</div>
        {/if}
      </div>
      <div class="field-label">View through eyepiece</div>
    </div>
    
    <!-- Focus wheel -->
    <div class="focus-wheel-container">
      <div class="focus-label">Focus</div>
      <div 
        class="focus-wheel"
        onwheel={handleFocusWheel}
      >
        <button class="focus-btn" onclick={() => adjustFocus(10)}>▲</button>
        <div class="focus-indicator">
          <div class="focus-fill" style:height="{focusLevel}%"></div>
        </div>
        <button class="focus-btn" onclick={() => adjustFocus(-10)}>▼</button>
      </div>
      <div class="focus-value">{focusLevel}%</div>
    </div>
  </div>

  <!-- Right: Controls and observation selection -->
  <aside class="controls-panel">
    <!-- Objective selection -->
    <section class="control-section">
      <h4>Objective Lens</h4>
      <div class="objective-row">
        {#each ['10x', '40x', '100x'] as obj}
          <button 
            class="btn btn-sm {selectedObjective === obj ? 'active' : ''}"
            onclick={() => selectObjective(obj as '10x' | '40x' | '100x')}
          >{obj}</button>
        {/each}
      </div>
    </section>

    <!-- Sample info -->
    <section class="control-section">
      <h4>Stage</h4>
      {#if loadedSample}
        <div class="flex items-center gap-sm mb-sm flex-wrap">
          <span class="sample-dot" style:background={SAMPLE_COLORS[loadedSample.type]}></span>
          <span class="text-sm flex-1">{loadedSample.label}</span>
        </div>
        <span class="condition-badge {loadedSample.condition}">{loadedSample.condition}</span>
      {:else}
        <p class="empty-text">Load a stained slide to observe</p>
      {/if}
    </section>

    <!-- Observation selection (only visible when in focus with sample) -->
    {#if loadedSample && isInFocus}
      <section class="control-section observation-section">
        <h4>What do you see?</h4>
        
        <div class="obs-group">
          <span class="obs-label">Gram Stain:</span>
          <div class="obs-options">
            <button class="obs-btn {selectedGram === 'positive' ? 'selected' : ''}" onclick={() => selectedGram = 'positive'}>
              Purple (+)
            </button>
            <button class="obs-btn {selectedGram === 'negative' ? 'selected' : ''}" onclick={() => selectedGram = 'negative'}>
              Pink (-)
            </button>
          </div>
        </div>
        
        <div class="obs-group">
          <span class="obs-label">Shape:</span>
          <div class="obs-options">
            <button class="obs-btn {selectedShape === 'cocci' ? 'selected' : ''}" onclick={() => selectedShape = 'cocci'}>
              Cocci
            </button>
            <button class="obs-btn {selectedShape === 'bacilli' ? 'selected' : ''}" onclick={() => selectedShape = 'bacilli'}>
              Bacilli
            </button>
            <button class="obs-btn {selectedShape === 'spirilla' ? 'selected' : ''}" onclick={() => selectedShape = 'spirilla'}>
              Spirilla
            </button>
          </div>
        </div>
        
        <div class="obs-group">
          <span class="obs-label">Arrangement:</span>
          <div class="obs-options">
            <button class="obs-btn {selectedArrangement === 'singles' ? 'selected' : ''}" onclick={() => selectedArrangement = 'singles'}>
              Singles
            </button>
            <button class="obs-btn {selectedArrangement === 'pairs' ? 'selected' : ''}" onclick={() => selectedArrangement = 'pairs'}>
              Pairs
            </button>
            <button class="obs-btn {selectedArrangement === 'chains' ? 'selected' : ''}" onclick={() => selectedArrangement = 'chains'}>
              Chains
            </button>
            <button class="obs-btn {selectedArrangement === 'clusters' ? 'selected' : ''}" onclick={() => selectedArrangement = 'clusters'}>
              Clusters
            </button>
          </div>
        </div>
        
        <div class="obs-group">
          <span class="obs-label">Special:</span>
          <div class="obs-options">
            <button class="obs-btn {selectedSpecial.includes('acid-fast') ? 'selected' : ''}" onclick={() => toggleSpecial('acid-fast')}>
              Acid-Fast
            </button>
            <button class="obs-btn {selectedSpecial.includes('capsule') ? 'selected' : ''}" onclick={() => toggleSpecial('capsule')}>
              Capsule
            </button>
            <button class="obs-btn {selectedSpecial.includes('spores') ? 'selected' : ''}" onclick={() => toggleSpecial('spores')}>
              Spores
            </button>
          </div>
        </div>
        
        <button 
          class="btn btn-primary record-btn" 
          disabled={!canRecord}
          onclick={recordObservation}
        >
          Record Observation
        </button>
      </section>
    {:else if loadedSample}
      <section class="control-section">
        <p class="empty-text">Adjust focus to observe sample</p>
      </section>
    {/if}
  </aside>
</div>

<style>
  .microscope-stage { 
    display: flex; 
    gap: var(--space-xl); 
    padding: var(--space-xl); 
    max-width: 1000px; 
    width: 100%; 
  }

  .visual-field-container {
    display: flex;
    gap: var(--space-md);
    align-items: center;
  }

  .eyepiece-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .visual-field {
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, #f5f0e6 0%, #d4c4a8 70%, #1a1815 100%);
    border: 8px solid var(--brass);
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4), var(--shadow-lg);
    position: relative;
    overflow: hidden;
    cursor: ns-resize;
    transition: filter 0.2s ease;
  }

  .organism-view {
    position: absolute;
    inset: 20px;
  }

  .cell {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transition: all 0.3s;
  }

  .cell.gram-pos { background: #7b1fa2; border: 1px solid #4a148c; }
  .cell.gram-neg { background: #e91e63; border: 1px solid #880e4f; }
  .cell.bacilli { border-radius: 30%; width: 24px; height: 10px; }
  .cell.spirilla { border-radius: 50%; width: 30px; height: 8px; transform: rotate(15deg); }

  .empty-field, .blur-hint {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--parchment-aged);
    font-style: italic;
    text-align: center;
    padding: var(--space-lg);
  }

  .field-label {
    margin-top: var(--space-sm);
    font-size: 0.75rem;
    color: var(--parchment-aged);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .focus-wheel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  .focus-label {
    font-size: 0.65rem;
    color: var(--parchment-aged);
    text-transform: uppercase;
  }

  .focus-wheel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm);
    background: var(--bg-medium);
    border: var(--border-thin);
    border-radius: 8px;
  }

  .focus-btn {
    width: 32px;
    height: 24px;
    background: var(--bg-light);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--parchment);
    cursor: pointer;
    font-size: 0.7rem;
  }

  .focus-btn:hover { border-color: var(--brass); }
  .focus-btn:active { background: var(--brass-dark); }

  .focus-indicator {
    width: 20px;
    height: 80px;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .focus-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, var(--brass-light) 0%, var(--brass) 100%);
    transition: height 0.1s;
  }

  .focus-value {
    font-size: 0.7rem;
    color: var(--brass);
    font-family: var(--font-mono);
  }

  .controls-panel { 
    flex: 1;
    min-width: 280px;
    max-width: 320px;
    background: var(--bg-dark); 
    border: var(--border-thin); 
    border-radius: 8px; 
    padding: var(--space-md);
    overflow-y: auto;
    max-height: 400px;
  }

  .objective-row {
    display: flex;
    gap: var(--space-xs);
  }

  .btn-sm { 
    padding: var(--space-xs) var(--space-sm); 
    font-size: 0.7rem; 
    flex: 1;
  }

  .observation-section {
    background: var(--bg-medium);
    border-radius: 6px;
    padding: var(--space-sm);
  }

  .obs-group {
    margin-bottom: var(--space-sm);
  }

  .obs-label {
    display: block;
    font-size: 0.7rem;
    color: var(--brass);
    margin-bottom: var(--space-xs);
    text-transform: uppercase;
  }

  .obs-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .obs-btn {
    padding: 4px 8px;
    font-size: 0.7rem;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--parchment);
    cursor: pointer;
    transition: all 0.15s;
  }

  .obs-btn:hover {
    border-color: var(--brass);
  }

  .obs-btn.selected {
    background: var(--brass);
    color: var(--bg-darkest);
    border-color: var(--brass-light);
  }

  .record-btn {
    width: 100%;
    margin-top: var(--space-md);
  }
</style>
