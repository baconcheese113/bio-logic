<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import MicroscopeInstrument from '../../MicroscopeInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import { gameState, setFocus, changeStain, type StainType } from '../../../stores/game-state';
  import { evidence, toggleGramStain, toggleShape, toggleAcidFast, toggleCapsule, toggleSpores } from '../../../stores/evidence';
  import { recordMicroscopyObservation, recordAcidFastObservation, recordCapsuleObservation, recordSporeObservation } from '../../../stores/evidence-integration';
  import { createInstrumentHelpers } from '../../../stores/instrument-helpers';
  import type { InventoryItem } from '../../../stores/inventory';
  
  const { hasSampleLoaded, clearSample, tryLoadPendingSample } = createInstrumentHelpers('microscope');
  
  let showStainSection = $state(true);
  let showObservationsSection = $state(true);
  let microscopeRef = $state<MicroscopeInstrument>();
  let rightPanelRef = $state<InstrumentRightPanel>();
  let lastHoveredInfo = $state<string | null>(null);
  let pendingSample = $state<InventoryItem | null>(null);
  
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
  
  function handleSampleSelected(sample: InventoryItem | null) {
    pendingSample = sample;
  }
  
  function handleStageClick() {
    if (!pendingSample) {
      rightPanelRef?.openInventoryForSample('microscope');
      return;
    }
    
    if (tryLoadPendingSample(pendingSample)) {
      rightPanelRef?.clearPendingSample();
      pendingSample = null;
    }
  }
  
  function clearCurrentSample() {
    clearSample();
    changeStain('none');
    setFocus(0);
  }
</script>

<div class="microscope-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      {#if $hasSampleLoaded}
        <MicroscopeInstrument bind:this={microscopeRef} />
      {:else}
        <!-- Empty microscope with clickable sample stage -->
        <div class="empty-microscope">
          <div class="microscope-body">
            <svg viewBox="0 0 500 500" class="microscope-svg">
              <!-- Simplified microscope illustration -->
              <circle cx="250" cy="250" r="120" fill="#3a3a3a" stroke="#666" stroke-width="2" />
              <circle cx="250" cy="250" r="100" fill="#1a1a1a" />
              
              <!-- Clickable sample stage area -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <g class="sample-stage-clickable" onclick={handleStageClick}>
                <rect x="200" y="350" width="100" height="40" rx="4" fill="#4a4a4a" stroke="#666" stroke-width="2" />
                <text x="250" y="375" text-anchor="middle" fill="#aaa" font-size="14" font-weight="bold">
                  Sample Stage
                </text>
                <circle cx="250" cy="415" r="15" fill="#5a7c59" opacity="0.8">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="250" y="420" text-anchor="middle" fill="white" font-size="16">+</text>
              </g>
            </svg>
            <div class="instruction-overlay">
              <p class="hint">Click the sample stage to load a sample</p>
            </div>
          </div>
        </div>
      {/if}
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel 
    bind:this={rightPanelRef}
    tabConfig="controls-inventory" 
    showDiagnosis={false}
    instrument="microscope"
    onSampleSelected={handleSampleSelected}
  >
        {#if !$hasSampleLoaded}
          <div class="instructions-panel">
            <div class="sample-status empty">
              <span class="sample-indicator">⚠️ No sample loaded</span>
              <p class="hint">Click the sample stage to load a sample from inventory</p>
            </div>
            <h3>Optical Microscope</h3>
            <p>Load a sample from your inventory to begin microscopy analysis.</p>
            <div class="info-box">
              <strong>Available Stains:</strong>
              <ul>
                <li>Gram Stain - Identify cell wall type</li>
                <li>Acid-Fast Stain - Detect mycolic acids</li>
                <li>Capsule Stain - Visualize capsules</li>
                <li>Spore Stain - Reveal endospores</li>
              </ul>
            </div>
          </div>
        {:else}
          <!-- Sample Status -->
          <div class="sample-status">
            <span class="sample-indicator">📋 Sample loaded</span>
            <button class="text-button" onclick={clearCurrentSample}>
              Change Sample
            </button>
          </div>
          
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
        {/if}
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

  .instructions-panel {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .instructions-panel h3 {
    color: #6a9fb5;
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .instructions-panel p {
    color: #ccc;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .info-box {
    background: #1a1a1a;
    border-left: 3px solid #6a9fb5;
    padding: 1rem;
    border-radius: 4px;
  }

  .info-box strong {
    color: #8ab9c5;
    display: block;
    margin-bottom: 0.5rem;
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #aaa;
  }

  .info-box li {
    margin-bottom: 0.25rem;
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
    cursor: pointer;
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
    cursor: pointer;
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
    cursor: pointer;
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
  
  /* Empty microscope styles */
  .empty-microscope {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .microscope-body {
    position: relative;
    width: 500px;
    height: 500px;
  }
  
  .microscope-svg {
    width: 100%;
    height: 100%;
  }
  
  .sample-stage-clickable {
    cursor: pointer;
    transition: opacity 0.3s;
  }
  
  .sample-stage-clickable:hover {
    opacity: 0.8;
  }
  
  .sample-stage-clickable:hover rect {
    fill: #5a5a5a;
  }
  
  .instruction-overlay {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: 1px solid #4a7c59;
  }
  
  .sample-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(74, 124, 140, 0.15);
    border: 1px solid rgba(74, 124, 140, 0.3);
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .sample-status.empty {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .sample-indicator {
    color: #8ab4d8;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .text-button {
    background: none;
    border: none;
    color: #6a9fb5;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.85rem;
  }
  
  .text-button:hover {
    color: #8ab4d8;
  }
  
  .sample-status .hint {
    color: #888;
    font-size: 0.8rem;
    margin: 0;
  }
  
  .instruction-overlay .hint {
    margin: 0;
    color: #8ac98a;
    font-size: 0.95rem;
    font-weight: 600;
  }
</style>
