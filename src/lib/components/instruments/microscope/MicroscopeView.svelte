<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import MicroscopeInstrument from '../../MicroscopeInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import { gameState, setFocus, changeStain } from '../../../stores/game-state';
  import type { StainType } from '../../../stores/game-state';
  import { evidence, toggleGramStain, toggleShape, toggleAcidFast, toggleCapsule, toggleSpores } from '../../../stores/evidence';
  import { recordMicroscopyObservation, recordAcidFastObservation, recordCapsuleObservation, recordSporeObservation } from '../../../stores/evidence-integration';
  import { currentActiveCase } from '../../../stores/active-cases';
  import { getSamplesForCase, type InventoryItem } from '../../../stores/inventory';
  let showStainSection = $state(true);
  let showObservationsSection = $state(true);
  let microscopeRef = $state<MicroscopeInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  
  // Sample selection - now samples are unlimited and can be used simultaneously
  let selectedSample = $state<InventoryItem | null>(null);
  
  // Derive available samples from active case (all samples are always available)
  let availableSamples = $derived(
    $currentActiveCase ? getSamplesForCase($currentActiveCase.caseId) : []
  );
  
  // Derive whether to show sample prompt
  let showSamplePrompt = $derived(!selectedSample && availableSamples.length > 0);
  
  function selectSampleForUse(sample: InventoryItem) {
    // Simply load the sample - no status updates needed
    // Samples can be used in multiple instruments simultaneously
    selectedSample = sample;
  }
  
  function changeSample() {
    // Allow selecting a different sample
    selectedSample = null;
  }
  
  // Track what has been recorded to avoid duplicate submissions
  let lastRecordedState = $state<string>('');
  
  // Auto-record observations when evidence changes
  $effect(() => {
    const currentState = JSON.stringify({
      gramStain: $evidence.gramStain,
      shape: $evidence.shape,
      arrangement: $evidence.arrangement,
      acidFast: $evidence.acidFast,
      capsule: $evidence.capsule,
      spores: $evidence.spores
    });
    
    // Record whenever state changes (including removal)
    if (currentState !== lastRecordedState) {
      // Always record main microscopy observation (handles null values for removal)
      recordMicroscopyObservation($evidence.gramStain, $evidence.shape, $evidence.arrangement);
      
      // Record special stains (handles null values for removal)
      recordAcidFastObservation($evidence.acidFast);
      recordCapsuleObservation($evidence.capsule);
      recordSporeObservation($evidence.spores);
      
      lastRecordedState = currentState;
    }
  });

  const stains: { value: StainType; label: string; infoKey: string }[] = [
    { value: 'none', label: 'No Stain', infoKey: 'stain-none' },
    { value: 'gram', label: 'Gram Stain', infoKey: 'stain-gram' },
    { value: 'acid-fast', label: 'Acid-Fast Stain', infoKey: 'stain-acid-fast' },
    { value: 'capsule', label: 'Capsule Stain', infoKey: 'stain-capsule' },
    { value: 'spore', label: 'Spore Stain', infoKey: 'stain-spore' },
  ];

  function handleStainChange(stain: StainType) {
    changeStain(stain);
    microscopeRef?.renderMicroscopeContent();
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="microscope-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <MicroscopeInstrument bind:this={microscopeRef} />
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel 
    tabConfig="controls-inventory" 
    showDiagnosis={false}
  >
        <!-- Sample Selection Prompt -->
        {#if showSamplePrompt && availableSamples.length > 0}
          <div class="sample-prompt">
            <div class="prompt-header">
              <div class="prompt-icon">🧪</div>
              <div class="prompt-title">Select Sample</div>
            </div>
            <p class="prompt-text">Choose a sample from your inventory to examine:</p>
            <div class="sample-list">
              {#each availableSamples as sample}
                <button 
                  class="sample-option"
                  onclick={() => selectSampleForUse(sample)}
                >
                  <span class="sample-icon">🧪</span>
                  <span class="sample-name">{sample.displayName}</span>
                </button>
              {/each}
            </div>
          </div>
        {:else if selectedSample}
          <!-- Currently Using Sample - Simple indicator, no "Done" button -->
          <div class="active-sample">
            <div class="active-sample-header">
              <span class="sample-icon">🔬</span>
              <span>Using: <strong>{selectedSample.displayName}</strong></span>
              <button class="change-button" onclick={changeSample} title="Select a different sample">
                Change Sample
              </button>
            </div>
            <!-- Show active processes if any -->
            {#if selectedSample.activeProcesses && selectedSample.activeProcesses.length > 0}
              <div class="active-processes">
                {#each selectedSample.activeProcesses as process}
                  <div class="process-status">
                    <span class="process-name">{process.processName}</span>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: {process.progress}%"></div>
                    </div>
                    {#if process.timeRemaining}
                      <span class="time-remaining">{process.timeRemaining}</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else if availableSamples.length === 0}
          <!-- No Samples Available -->
          <div class="no-samples-prompt">
            <p>No samples available. Collect a sample first from the Sample Selection screen.</p>
          </div>
        {/if}
        
        <!-- Stain Section - Collapsible -->
        <div class="section">
          <button class="section-header" onclick={() => showStainSection = !showStainSection}>
            <span class="section-title">Stain Type</span>
            <span class="collapse-icon">{showStainSection ? '▼' : '▶'}</span>
          </button>
          {#if showStainSection}
            <div class="section-content">
              <div class="stain-buttons">
                {#each stains as { value, label, infoKey }}
                  <button 
                    class="stain-button" 
                    class:active={$gameState.currentStain === value}
                    onclick={() => handleStainChange(value)}
                    onmouseenter={() => setHoveredInfo(infoKey)}
                  >
                    {label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Focus Control - Always visible -->
        <div class="section">
          <div class="section-header-static">
            <span class="section-title">Focus Depth</span>
          </div>
          <div class="section-content">
            <div class="focus-display">{$gameState.focusDepth}</div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={$gameState.focusDepth}
              oninput={(e) => setFocus(parseInt(e.currentTarget.value))}
            />
          </div>
        </div>

        <!-- Observations Section - Collapsible -->
        <div class="section">
          <button class="section-header" onclick={() => showObservationsSection = !showObservationsSection}>
            <span class="section-title">Record Observations</span>
            <span class="collapse-icon">{showObservationsSection ? '▼' : '▶'}</span>
          </button>
          {#if showObservationsSection}
            <div class="section-content">
              <div class="observation-group">
                <div class="obs-label">Cell Shape:</div>
                <div class="obs-buttons">
                  <button 
                    class="obs-button" 
                    class:active={$evidence.shape === 'cocci'}
                    onclick={() => toggleShape('cocci')}
                    onmouseenter={() => setHoveredInfo('shape-cocci')}
                  >
                    Cocci
                  </button>
                  <button 
                    class="obs-button" 
                    class:active={$evidence.shape === 'bacilli'}
                    onclick={() => toggleShape('bacilli')}
                    onmouseenter={() => setHoveredInfo('shape-bacilli')}
                  >
                    Bacilli
                  </button>
                  <button 
                    class="obs-button" 
                    class:active={$evidence.shape === 'diplococci'}
                    onclick={() => toggleShape('diplococci')}
                    onmouseenter={() => setHoveredInfo('shape-diplococci')}
                  >
                    Diplo
                  </button>
                </div>
              </div>

              <div class="observation-group">
                <div class="obs-label">Special Features:</div>
                <div class="feature-row">
                  <span class="feature-name">Gram Stain:</span>
                  <div class="obs-buttons">
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.gramStain === 'positive'}
                      onclick={() => toggleGramStain('positive')}
                      onmouseenter={() => setHoveredInfo('gram-positive')}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.gramStain === 'negative'}
                      onclick={() => toggleGramStain('negative')}
                      onmouseenter={() => setHoveredInfo('gram-negative')}
                    >
                      -
                    </button>
                  </div>
                </div>
                
                <div class="feature-row">
                  <span class="feature-name">Acid-Fast:</span>
                  <div class="obs-buttons">
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.acidFast === true}
                      onclick={() => toggleAcidFast(true)}
                      onmouseenter={() => setHoveredInfo('acid-fast-pos')}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.acidFast === false}
                      onclick={() => toggleAcidFast(false)}
                      onmouseenter={() => setHoveredInfo('acid-fast-neg')}
                    >
                      -
                    </button>
                  </div>
                </div>
                
                <div class="feature-row">
                  <span class="feature-name">Capsule:</span>
                  <div class="obs-buttons">
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.capsule === true}
                      onclick={() => toggleCapsule(true)}
                      onmouseenter={() => setHoveredInfo('capsule-pos')}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.capsule === false}
                      onclick={() => toggleCapsule(false)}
                      onmouseenter={() => setHoveredInfo('capsule-neg')}
                    >
                      -
                    </button>
                  </div>
                </div>
                
                <div class="feature-row">
                  <span class="feature-name">Spores:</span>
                  <div class="obs-buttons">
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.spores === true}
                      onclick={() => toggleSpores(true)}
                      onmouseenter={() => setHoveredInfo('spores-pos')}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.spores === false}
                      onclick={() => toggleSpores(false)}
                      onmouseenter={() => setHoveredInfo('spores-neg')}
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>

  </InstrumentRightPanel>
</div>

<style>
  .microscope-view {
    width: 100%;
    height: 100%;
    display: flex;
    background: #1a1a1a;
  }

  .stage-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Collapsible Sections */
  .section {
    background: #3a3a3a;
    border: 2px solid #4a4a4a;
    border-radius: 4px;
  }

  .section-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #3a3a3a;
    color: #e0e0e0;
    border: none;
    text-align: left;
    transition: background 0.2s;
  }

  .section-header:hover {
    background: #4a4a4a;
  }

  .section-header-static {
    padding: 0.5rem 0.75rem;
    background: #3a3a3a;
    color: #e0e0e0;
  }

  .section-title {
    font-weight: bold;
    font-size: 0.9rem;
  }

  .collapse-icon {
    color: #a0a0a0;
    font-size: 0.75rem;
  }

  .section-content {
    padding: 0.75rem;
    background: #2a2a2a;
  }

  .stain-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .stain-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .stain-button:hover {
    background: #4a4a4a;
  }

  .stain-button.active {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .focus-display {
    text-align: center;
    font-size: 1rem;
    color: #ffd700;
    margin-bottom: 0.4rem;
  }

  input[type="range"] {
    width: 100%;
  }

  .observation-group {
    margin-bottom: 0.75rem;
  }

  .obs-label {
    font-weight: bold;
    margin-bottom: 0.4rem;
    color: #b0b0b0;
    font-size: 0.85rem;
  }

  .feature-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .feature-name {
    font-size: 0.8rem;
    color: #b0b0b0;
  }

  .obs-buttons {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .obs-button {
    flex: 1;
    min-width: 70px;
    padding: 0.4rem;
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    border-radius: 4px;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .obs-button.small {
    min-width: 35px;
    padding: 0.3rem;
  }

  .obs-button:hover {
    background: #4a4a4a;
  }

  .obs-button.active {
    background: #5a7c9a;
    border-color: #6a8caa;
    color: #ffffff;
  }

  /* Sample Selection Prompt */
  .sample-prompt {
    background: #2a4a5a;
    border: 2px solid #4a6a8a;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .prompt-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .prompt-icon {
    font-size: 1.5rem;
  }
  
  .prompt-title {
    font-size: 1rem;
    font-weight: bold;
    color: #e0e0e0;
  }
  
  .prompt-text {
    color: #b0b0b0;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  
  .sample-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .sample-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #3a3a3a;
    border: 2px solid #5a5a5a;
    border-radius: 4px;
    padding: 0.75rem;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }
  
  .sample-option:hover {
    background: #4a7c59;
    border-color: #5a8c69;
    transform: translateX(2px);
  }
  
  .sample-icon {
    font-size: 1.2rem;
  }
  
  .sample-name {
    font-weight: 600;
    flex: 1;
  }
  
  .active-sample {
    background: #3a5a3a;
    border: 2px solid #5a8c69;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .active-sample-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e0e0e0;
    font-size: 0.9rem;
  }
  
  .change-button {
    margin-left: auto;
    padding: 0.25rem 0.75rem;
    background: #4a6a8a;
    border: 1px solid #5a7a9a;
    border-radius: 3px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .change-button:hover {
    background: #5a7a9a;
    transform: scale(1.05);
  }
  
  .active-processes {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .process-status {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    border-radius: 3px;
    padding: 0.5rem;
  }
  
  .process-name {
    color: #d4af37;
    font-weight: 600;
    font-size: 0.75rem;
    display: block;
    margin-bottom: 0.3rem;
  }
  
  .progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin: 0.3rem 0;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a7c59, #6a9c79);
    transition: width 0.3s ease;
  }
  
  .time-remaining {
    color: #999;
    font-size: 0.7rem;
    display: block;
    margin-top: 0.25rem;
  }
  
  .no-samples-prompt {
    background: #3a3a3a;
    border: 2px solid #5a5a5a;
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
    color: #a0a0a0;
    font-size: 0.85rem;
  }
</style>
