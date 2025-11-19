<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import MicroscopeInstrument from '../../MicroscopeInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import InventoryPanel from '../../shared/InventoryPanel.svelte';
  import { gameState, proceedToDiagnosis, setFocus, changeStain } from '../../../stores/game-state';
  import type { StainType } from '../../../stores/game-state';
  import { evidence, toggleGramStain, toggleShape, toggleAcidFast, toggleCapsule, toggleSpores, toggleArrangement, filteredOrganisms } from '../../../stores/evidence';
  import { recordMicroscopyObservation, recordAcidFastObservation, recordCapsuleObservation, recordSporeObservation } from '../../../stores/evidence-integration';
  import { currentActiveCase } from '../../../stores/active-cases';
  import { getAvailableSamples, updateSampleStatus, type InventoryItem } from '../../../stores/inventory';

  let showDiagnosis = $state(false);
  let showInventory = $state(false);
  let showStainSection = $state(true);
  let showObservationsSection = $state(true);
  let microscopeRef = $state<MicroscopeInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  
  // Sample selection
  let selectedSample = $state<InventoryItem | null>(null);
  
  // Derive available samples from active case
  let availableSamples = $derived(
    $currentActiveCase ? getAvailableSamples($currentActiveCase.caseId) : []
  );
  
  // Derive whether to show sample prompt
  let showSamplePrompt = $derived(!selectedSample && availableSamples.length > 0);
  
  function selectSampleForUse(sample: InventoryItem) {
    // Release previous sample if any
    if (selectedSample) {
      updateSampleStatus(selectedSample.id, 'available');
    }
    
    // Mark new sample as in use
    updateSampleStatus(sample.id, 'in-use', 'microscope');
    selectedSample = sample;
    showSamplePrompt = false;
    
    // Update available samples list
    if ($currentActiveCase) {
      availableSamples = getAvailableSamples($currentActiveCase.caseId);
    }
  }
  
  function releaseSample() {
    if (selectedSample) {
      updateSampleStatus(selectedSample.id, 'processed');
      selectedSample = null;
      showSamplePrompt = true;
      
      // Update available samples list
      if ($currentActiveCase) {
        availableSamples = getAvailableSamples($currentActiveCase.caseId);
      }
    }
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

  <div class="controls-panel">
    <div class="panel-tabs">
      <button 
        class="tab" 
        class:active={!showDiagnosis && !showInventory}
        onclick={() => { showDiagnosis = false; showInventory = false; }}
      >
        Controls
      </button>
      <button 
        class="tab" 
        class:active={showInventory}
        onclick={() => { showInventory = true; showDiagnosis = false; }}
      >
        Inventory
      </button>
      <button 
        class="tab" 
        class:active={showDiagnosis}
        onclick={() => { showDiagnosis = true; showInventory = false; }}
      >
        Diagnosis ({$filteredOrganisms.length})
      </button>
    </div>

    {#if showInventory}
      <!-- Inventory Tab -->
      <InventoryPanel />
    {:else if !showDiagnosis}
      <!-- Controls Tab -->
      <div class="panel-content">
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
          <!-- Currently Using Sample -->
          <div class="active-sample">
            <div class="active-sample-header">
              <span class="sample-icon">🔬</span>
              <span>Using: <strong>{selectedSample.displayName}</strong></span>
              <button class="release-button" onclick={releaseSample} title="Mark as processed and release">
                ✓ Done
              </button>
            </div>
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

        <NavigationButtons />
      </div>
    {:else}
      <!-- Diagnosis Tab -->
      <div class="panel-content diagnosis-content">
        <p class="match-info">{$filteredOrganisms.length} matching organism(s)</p>
        
        <div class="organism-list">
          {#each $filteredOrganisms as organism}
            <button class="organism-option" onclick={() => proceedToDiagnosis()}>
              <div class="org-name">{organism.scientificName}</div>
              <div class="org-common">{organism.commonName}</div>
            </button>
          {/each}
          
          {#if $filteredOrganisms.length === 0}
            <div class="no-matches">
              No organisms match your observations.
              Try adjusting your findings.
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
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

  .controls-panel {
    width: 280px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .panel-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .tab {
    flex: 1;
    padding: 0.5rem 0.25rem;
    background: #3a3a3a;
    color: #a0a0a0;
    border: 2px solid #4a4a4a;
    border-radius: 4px 4px 0 0;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .tab:hover {
    background: #4a4a4a;
    color: #e0e0e0;
  }

  .tab.active {
    background: #2a2a2a;
    color: #ffd700;
    border-bottom-color: #2a2a2a;
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    flex: 1;
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

  /* Diagnosis Tab */
  .diagnosis-content {
    overflow-y: auto;
  }

  .match-info {
    font-size: 0.9rem;
    color: #ffd700;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .organism-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .organism-option {
    background: #3a3a3a;
    border: 2px solid #5a5a5a;
    border-radius: 4px;
    padding: 0.75rem;
    text-align: left;
    transition: all 0.2s;
  }

  .organism-option:hover {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .org-name {
    font-weight: bold;
    font-style: italic;
    color: #e0e0e0;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }

  .org-common {
    color: #a0a0a0;
    font-size: 0.8rem;
  }

  .no-matches {
    text-align: center;
    color: #a0a0a0;
    padding: 1.5rem;
    font-style: italic;
    font-size: 0.85rem;
  }
  
  /* Record Observation Section */
  .record-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #4a4a4a;
  }
  
  .record-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(to bottom, #4a7c59, #3a6c49);
    color: white;
    border: 2px solid #5a8c69;
    border-radius: 4px;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .record-button:hover:not(:disabled) {
    background: linear-gradient(to bottom, #5a8c69, #4a7c59);
    border-color: #6a9c79;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(74, 124, 89, 0.4);
  }
  
  .record-button:disabled {
    background: #3a3a3a;
    border-color: #4a4a4a;
    color: #666;
    cursor: not-allowed;
    transform: none;
  }
  
  .recorded-indicator {
    margin-top: 0.5rem;
    text-align: center;
    color: #8fc98f;
    font-size: 0.85rem;
    font-weight: 600;
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
  
  .release-button {
    margin-left: auto;
    padding: 0.25rem 0.75rem;
    background: #4a7c59;
    border: 1px solid #5a8c69;
    border-radius: 3px;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .release-button:hover {
    background: #5a8c69;
    transform: scale(1.05);
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
