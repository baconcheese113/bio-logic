<script lang="ts">
  import StageArea from './StageArea.svelte';
  import MicroscopeInstrument from './MicroscopeInstrument.svelte';
  import { gameState, returnToSampleSelection, proceedToDiagnosis, setFocus, changeStain } from '../stores/game-state';
  import type { StainType } from '../stores/game-state';
  import { evidence, toggleGramStain, toggleShape, toggleAcidFast, toggleCapsule, toggleSpores, filteredOrganisms } from '../stores/evidence';

  let showDiagnosis = $state(false);
  let showStainSection = $state(true);
  let showObservationsSection = $state(true);
  let microscopeRef = $state<MicroscopeInstrument>();
  let hoveredInfo = $state<keyof typeof infoContent | null>(null);
  let lastHoveredInfo = $state<keyof typeof infoContent | null>(null);

  const stains: { value: StainType; label: string; infoKey: keyof typeof infoContent }[] = [
    { value: 'none', label: 'No Stain', infoKey: 'stain-none' },
    { value: 'gram', label: 'Gram Stain', infoKey: 'stain-gram' },
    { value: 'acid-fast', label: 'Acid-Fast Stain', infoKey: 'stain-acid-fast' },
    { value: 'capsule', label: 'Capsule Stain', infoKey: 'stain-capsule' },
    { value: 'spore', label: 'Spore Stain', infoKey: 'stain-spore' },
  ];

  const infoContent = {
    'stain-none': { title: 'No Stain', text: 'Bacteria are nearly transparent without staining, showing only basic cellular outlines.' },
    'stain-gram': { title: 'Gram Stain', text: 'Gram-positive bacteria appear purple (thick cell wall). Gram-negative appear pink/red (thin cell wall).' },
    'stain-acid-fast': { title: 'Acid-Fast Stain', text: 'Acid-fast positive bacteria retain red/pink dye (waxy mycolic acids). Negative bacteria appear blue.' },
    'stain-capsule': { title: 'Capsule Stain', text: 'Capsules appear as clear halos surrounding bacteria against a dark background.' },
    'stain-spore': { title: 'Spore Stain', text: 'Endospores appear as bright green oval structures inside or outside bacterial cells.' },
    'shape-cocci': { title: 'Cocci', text: 'Round or spherical bacterial cells.' },
    'shape-bacilli': { title: 'Bacilli', text: 'Rod-shaped bacterial cells, longer than they are wide.' },
    'shape-diplococci': { title: 'Diplococci', text: 'Bacteria occurring in pairs of spherical cells.' },
    'gram-positive': { title: 'Gram Positive (+)', text: 'Purple/violet color after Gram staining indicates thick peptidoglycan layer.' },
    'gram-negative': { title: 'Gram Negative (−)', text: 'Pink/red color after Gram staining indicates thin peptidoglycan layer.' },
    'acid-fast-pos': { title: 'Acid-Fast Positive', text: 'Red/pink color indicates presence of waxy mycolic acids in cell wall.' },
    'acid-fast-neg': { title: 'Acid-Fast Negative', text: 'Blue color indicates absence of mycolic acids.' },
    'capsule-pos': { title: 'Capsule Present', text: 'Clear halo visible around stained bacteria.' },
    'capsule-neg': { title: 'No Capsule', text: 'No clear halo around bacteria.' },
    'spores-pos': { title: 'Spores Present', text: 'Green oval endospores visible inside or outside cells.' },
    'spores-neg': { title: 'No Spores', text: 'No green oval structures visible.' },
  };

  function handleStainChange(stain: StainType) {
    changeStain(stain);
    microscopeRef?.refreshMicroscopeView();
  }

  function setHoveredInfo(key: keyof typeof infoContent | null) {
    hoveredInfo = key;
    if (key !== null) {
      lastHoveredInfo = key;
    }
  }
</script>

<div class="microscope-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <MicroscopeInstrument bind:this={microscopeRef} />
    </StageArea>

    <!-- Info Panel -->
    <div class="info-panel">
      {#if lastHoveredInfo && infoContent[lastHoveredInfo]}
        <div class="info-content">
          <h4>{infoContent[lastHoveredInfo].title}</h4>
          <p>{infoContent[lastHoveredInfo].text}</p>
        </div>
      {:else}
        <div class="info-placeholder">
          Hover over controls to learn more
        </div>
      {/if}
    </div>
  </div>

  <div class="controls-panel">
    <div class="panel-tabs">
      <button 
        class="tab" 
        class:active={!showDiagnosis}
        onclick={() => showDiagnosis = false}
      >
        Controls
      </button>
      <button 
        class="tab" 
        class:active={showDiagnosis}
        onclick={() => showDiagnosis = true}
      >
        Diagnosis ({$filteredOrganisms.length})
      </button>
    </div>

    {#if !showDiagnosis}
      <!-- Controls Tab -->
      <div class="panel-content">
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
                    onmouseleave={() => setHoveredInfo(null)}
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
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Cocci
                  </button>
                  <button 
                    class="obs-button" 
                    class:active={$evidence.shape === 'bacilli'}
                    onclick={() => toggleShape('bacilli')}
                    onmouseenter={() => setHoveredInfo('shape-bacilli')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Bacilli
                  </button>
                  <button 
                    class="obs-button" 
                    class:active={$evidence.shape === 'diplococci'}
                    onclick={() => toggleShape('diplococci')}
                    onmouseenter={() => setHoveredInfo('shape-diplococci')}
                    onmouseleave={() => setHoveredInfo(null)}
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
                      onmouseleave={() => setHoveredInfo(null)}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.gramStain === 'negative'}
                      onclick={() => toggleGramStain('negative')}
                      onmouseenter={() => setHoveredInfo('gram-negative')}
                      onmouseleave={() => setHoveredInfo(null)}
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
                      onclick={toggleAcidFast}
                      onmouseenter={() => setHoveredInfo('acid-fast-pos')}
                      onmouseleave={() => setHoveredInfo(null)}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.acidFast === false}
                      onclick={toggleAcidFast}
                      onmouseenter={() => setHoveredInfo('acid-fast-neg')}
                      onmouseleave={() => setHoveredInfo(null)}
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
                      onclick={toggleCapsule}
                      onmouseenter={() => setHoveredInfo('capsule-pos')}
                      onmouseleave={() => setHoveredInfo(null)}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.capsule === false}
                      onclick={toggleCapsule}
                      onmouseenter={() => setHoveredInfo('capsule-neg')}
                      onmouseleave={() => setHoveredInfo(null)}
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
                      onclick={toggleSpores}
                      onmouseenter={() => setHoveredInfo('spores-pos')}
                      onmouseleave={() => setHoveredInfo(null)}
                    >
                      +
                    </button>
                    <button 
                      class="obs-button small" 
                      class:active={$evidence.spores === false}
                      onclick={toggleSpores}
                      onmouseenter={() => setHoveredInfo('spores-neg')}
                      onmouseleave={() => setHoveredInfo(null)}
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <div class="action-buttons">
          <button class="secondary-button" onclick={returnToSampleSelection}>
            Change Sample
          </button>
        </div>
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
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab {
    flex: 1;
    padding: 0.5rem;
    background: #3a3a3a;
    color: #a0a0a0;
    border: 2px solid #4a4a4a;
    border-radius: 4px 4px 0 0;
    font-size: 0.85rem;
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

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: auto;
  }

  .secondary-button {
    padding: 0.75rem;
    font-size: 0.95rem;
    border-radius: 4px;
    border: 2px solid #5a5a5a;
    background: #3a3a3a;
    color: #e0e0e0;
    transition: all 0.2s;
  }

  .secondary-button:hover {
    background: #4a4a4a;
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

  .info-panel {
    background: #2a2a2a;
    border-top: 2px solid #4a4a4a;
    padding: 1rem 2rem;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .info-content {
    width: 100%;
    max-width: 1200px;
    text-align: center;
  }

  .info-content h4 {
    font-size: 1rem;
    color: #ffd700;
    margin: 0 0 0.5rem 0;
    font-weight: bold;
  }

  .info-content p {
    font-size: 0.95rem;
    color: #c0c0c0;
    margin: 0;
    line-height: 1.5;
  }

  .info-placeholder {
    width: 100%;
    text-align: center;
    color: #666;
    font-style: italic;
    font-size: 0.9rem;
  }
</style>
