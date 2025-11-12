<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import ElectrophoresisInstrument from './ElectrophoresisInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import { proceedToDiagnosis, currentCase } from '../../../stores/game-state';
  import { evidence, toggleProteinPattern, setAlbuminLevel, setGlobulinLevel, filteredOrganisms } from '../../../stores/evidence';
  import { CLINICAL_DIAGNOSES } from '../../../../data/clinical-diagnoses';
  import { ANSWER_FORMATS } from '../../../../data/organisms';

  let showDiagnosis = $state(false);
  let showObservationsSection = $state(true);
  let electrophoresisRef = $state<ElectrophoresisInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  let isRunning = $state(false);
  let migrationComplete = $state(false);
  let isStained = $state(false);

  function startElectrophoresis() {
    isRunning = true;
    migrationComplete = false;
    isStained = false;
    electrophoresisRef?.runElectrophoresis();
    // Migration completes after ~4 seconds
    setTimeout(() => {
      isRunning = false;
      migrationComplete = true;
    }, 4500);
  }

  function applyStain() {
    if (!migrationComplete) return;
    isStained = true;
    electrophoresisRef?.applyStain();
  }

  function setHoveredInfo(key: string | null) {
    if (key !== null) {
      lastHoveredInfo = key;
    }
  }
</script>

<div class="electrophoresis-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <ElectrophoresisInstrument bind:this={electrophoresisRef} />
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
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
        {#if ANSWER_FORMATS[$currentCase.answerFormat].type === 'clinical-diagnosis'}
          Diagnosis ({ANSWER_FORMATS[$currentCase.answerFormat].options?.length || 0})
        {:else}
          Diagnosis ({$filteredOrganisms.length})
        {/if}
      </button>
    </div>

    {#if !showDiagnosis}
      <!-- Controls Tab -->
      <div class="panel-content">
        <!-- Run Control - Always visible -->
        <div class="section">
          <div class="section-header-static">
            <span class="section-title">Electrophoresis</span>
          </div>
          <div class="section-content">
            <button 
              class="run-button" 
              disabled={isRunning}
              onclick={startElectrophoresis}
              onmouseenter={() => setHoveredInfo('run-electrophoresis')}
              onmouseleave={() => setHoveredInfo(null)}
            >
              {isRunning ? 'Running...' : 'Run Electrophoresis'}
            </button>
            <div class="help-text">
              Apply electric current to separate proteins by size and charge
            </div>
          </div>
        </div>

        <!-- Staining Control -->
        <div class="section">
          <div class="section-header-static">
            <span class="section-title">Staining</span>
          </div>
          <div class="section-content">
            <button 
              class="run-button" 
              class:ready={migrationComplete && !isStained}
              disabled={!migrationComplete || isStained}
              onclick={applyStain}
              onmouseenter={() => setHoveredInfo('staining-ponceau')}
              onmouseleave={() => setHoveredInfo(null)}
            >
              {isStained ? 'Stained ✓' : migrationComplete ? 'Apply Ponceau S Stain' : 'Complete Migration First'}
            </button>
            <div class="help-text">
              {isStained 
                ? 'Proteins are now visible as blue-purple bands' 
                : 'Staining reveals protein bands (proteins are colorless until stained)'}
            </div>
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
                <div class="obs-label">Protein Pattern:</div>
                <div class="obs-buttons">
                  <button 
                    class="obs-button"
                    class:active={$evidence.proteinPattern === 'normal'}
                    onclick={() => toggleProteinPattern('normal')}
                    onmouseenter={() => setHoveredInfo('protein-pattern-normal')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Normal
                  </button>
                  <button 
                    class="obs-button"
                    class:active={$evidence.proteinPattern === 'm-spike'}
                    onclick={() => toggleProteinPattern('m-spike')}
                    onmouseenter={() => setHoveredInfo('protein-pattern-m-spike')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    M-Spike
                  </button>
                  <button 
                    class="obs-button"
                    class:active={$evidence.proteinPattern === 'beta-gamma-bridge'}
                    onclick={() => toggleProteinPattern('beta-gamma-bridge')}
                    onmouseenter={() => setHoveredInfo('protein-pattern-beta-gamma-bridge')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    β-γ Bridge
                  </button>
                  <button 
                    class="obs-button"
                    class:active={$evidence.proteinPattern === 'low-albumin'}
                    onclick={() => toggleProteinPattern('low-albumin')}
                    onmouseenter={() => setHoveredInfo('protein-pattern-low-albumin')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Low Albumin
                  </button>
                  <button 
                    class="obs-button"
                    class:active={$evidence.proteinPattern === 'polyclonal-gammopathy'}
                    onclick={() => toggleProteinPattern('polyclonal-gammopathy')}
                    onmouseenter={() => setHoveredInfo('protein-pattern-polyclonal')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Polyclonal
                  </button>
                </div>
              </div>

              <div class="observation-group">
                <div class="obs-label">Albumin Level:</div>
                <div class="obs-buttons">
                  <button 
                    class="obs-button small"
                    class:active={$evidence.albuminLevel === 'low'}
                    onclick={() => setAlbuminLevel('low')}
                    onmouseenter={() => setHoveredInfo('albumin-low')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Low
                  </button>
                  <button 
                    class="obs-button small"
                    class:active={$evidence.albuminLevel === 'normal'}
                    onclick={() => setAlbuminLevel('normal')}
                    onmouseenter={() => setHoveredInfo('albumin-normal')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Normal
                  </button>
                  <button 
                    class="obs-button small"
                    class:active={$evidence.albuminLevel === 'high'}
                    onclick={() => setAlbuminLevel('high')}
                    onmouseenter={() => setHoveredInfo('albumin-high')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    High
                  </button>
                </div>
              </div>

              <div class="observation-group">
                <div class="obs-label">Globulin Level:</div>
                <div class="obs-buttons">
                  <button 
                    class="obs-button small"
                    class:active={$evidence.globulinLevel === 'low'}
                    onclick={() => setGlobulinLevel('low')}
                    onmouseenter={() => setHoveredInfo('globulin-low')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Low
                  </button>
                  <button 
                    class="obs-button small"
                    class:active={$evidence.globulinLevel === 'normal'}
                    onclick={() => setGlobulinLevel('normal')}
                    onmouseenter={() => setHoveredInfo('globulin-normal')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    Normal
                  </button>
                  <button 
                    class="obs-button small"
                    class:active={$evidence.globulinLevel === 'high'}
                    onclick={() => setGlobulinLevel('high')}
                    onmouseenter={() => setHoveredInfo('globulin-high')}
                    onmouseleave={() => setHoveredInfo(null)}
                  >
                    High
                  </button>
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
        {#if ANSWER_FORMATS[$currentCase.answerFormat].type === 'clinical-diagnosis'}
          <!-- Show clinical diagnoses for protein cases -->
          <p class="match-info">{ANSWER_FORMATS[$currentCase.answerFormat].options?.length || 0} possible diagnosis(es)</p>
          
          <div class="organism-list">
            {#each (ANSWER_FORMATS[$currentCase.answerFormat].options || []) as diagnosisId}
              {@const diagnosis = CLINICAL_DIAGNOSES.find(d => d.id === diagnosisId)}
              {#if diagnosis}
                <button class="organism-option" onclick={() => proceedToDiagnosis()}>
                  <div class="org-name">{diagnosis.displayName}</div>
                  <div class="org-common">{diagnosis.description}</div>
                </button>
              {/if}
            {/each}
          </div>
        {:else}
          <!-- Show organisms for bacterial cases -->
          <p class="match-info">{$filteredOrganisms.length} matching condition(s)</p>
          
          <div class="organism-list">
            {#each $filteredOrganisms as organism}
              <button class="organism-option" onclick={() => proceedToDiagnosis()}>
                <div class="org-name">{organism.scientificName}</div>
                <div class="org-common">{organism.commonName}</div>
              </button>
            {/each}
            
            {#if $filteredOrganisms.length === 0}
              <div class="no-matches">
                No conditions match your observations.
                Try adjusting your findings.
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .electrophoresis-view {
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

  .run-button {
    width: 100%;
    background: #4a7c59;
    color: #ffffff;
    border: 2px solid #5a8c69;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    transition: all 0.2s;
    margin-bottom: 0.5rem;
  }

  .run-button:not(:disabled):hover {
    background: #5a8c69;
  }

  .run-button.ready {
    background: #4a7c59;
    border-color: #5a8c69;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .run-button:disabled {
    background: #3a3a3a;
    border-color: #5a5a5a;
    color: #808080;
    cursor: not-allowed;
  }

  .help-text {
    font-size: 0.75rem;
    color: #a0a0a0;
    font-style: italic;
    text-align: center;
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
    min-width: 60px;
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
</style>
