<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import FlowCytometryInstrument from './FlowCytometryInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import { proceedToDiagnosis, currentCase } from '../../../stores/game-state';
  import { evidence, filteredOrganisms } from '../../../stores/evidence';
  import { CLINICAL_DIAGNOSES } from '../../../../data/clinical-diagnoses';
  import { ANSWER_FORMATS } from '../../../../data/organisms';

  let showDiagnosis = $state(false);
  let showObservationsSection = $state(true);
  let cytometerRef = $state<FlowCytometryInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  let isRunning = $state(false);
  let hasRun = $state(false);
  let observations = $state<string[]>([]);

  function startAnalysis() {
    isRunning = true;
    hasRun = true;
    cytometerRef?.runCytometer();
    setTimeout(() => {
      isRunning = false;
    }, 2500);
  }

  function addObservation() {
    const gatedPercentage = cytometerRef?.getGatedPercentage() || 0;
    const observation = `Gate ${observations.length + 1}: ${gatedPercentage.toFixed(1)}% of cells`;
    observations = [...observations, observation];
  }

  function clearObservations() {
    observations = [];
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="flow-cytometry-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <FlowCytometryInstrument bind:this={cytometerRef} />
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
        <!-- Instrument Control -->
        <div class="section">
          <div class="section-header-static">
            <span class="section-title">Flow Cytometer</span>
          </div>
          <div class="section-content vintage-panel">
            <button 
              class="run-button vintage-button" 
              disabled={isRunning}
              onclick={startAnalysis}
              onmouseenter={() => setHoveredInfo('run-cytometer')}
            >
              {isRunning ? 'ANALYZING...' : 'RUN SAMPLE'}
            </button>
            <div class="help-text">
              Analyze cells flowing through laser beam
            </div>
            {#if hasRun}
              <div class="status-indicator">
                <span class="status-light"></span>
                READY
              </div>
            {/if}
          </div>
        </div>

        <!-- Gating Controls -->
        {#if hasRun}
          <div class="section">
            <div class="section-header-static">
              <span class="section-title">Rectangular Gate</span>
            </div>
            <div class="section-content vintage-panel">
              <button 
                class="gate-button vintage-button"
                onclick={addObservation}
                onmouseenter={() => setHoveredInfo('gate-control')}
              >
                RECORD GATE
              </button>
              <div class="help-text">
                Drag gate corners on plot to select cell population
              </div>
            </div>
          </div>

          <!-- Observations Section -->
          <div class="section">
            <button class="section-header" onclick={() => showObservationsSection = !showObservationsSection}>
              <span class="section-title">Observations</span>
              <span class="collapse-icon">{showObservationsSection ? '▼' : '▶'}</span>
            </button>
            {#if showObservationsSection}
              <div class="section-content">
                {#if observations.length === 0}
                  <div class="no-observations">
                    No observations recorded yet. Draw gates and record findings.
                  </div>
                {:else}
                  <div class="observations-list">
                    {#each observations as obs}
                      <div class="observation-item">{obs}</div>
                    {/each}
                  </div>
                  <button 
                    class="clear-button"
                    onclick={clearObservations}
                  >
                    Clear Observations
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Diagnosis Tab -->
      <div class="panel-content">
        <NavigationButtons />
      </div>
    {/if}
  </div>
</div>

<style>
  .flow-cytometry-view {
    display: flex;
    height: 100vh;
    background: #1a1a1a;
  }

  .stage-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .controls-panel {
    width: 400px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-tabs {
    display: flex;
    border-bottom: 2px solid #4a4a4a;
    background: #1a1a1a;
  }

  .tab {
    flex: 1;
    padding: 1rem;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;
  }

  .tab:hover {
    background: #2a2a2a;
    color: #aaa;
  }

  .tab.active {
    color: #6a9fb5;
    border-bottom-color: #6a9fb5;
    background: #2a2a2a;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .section {
    margin-bottom: 1.5rem;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: none;
    color: #ccc;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
  }

  .section-header:hover {
    background: #3a3a3a;
  }

  .section-header-static {
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    color: #ccc;
    font-size: 0.95rem;
    border-bottom: 1px solid #3a3a3a;
  }

  .section-title {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
  }

  .collapse-icon {
    color: #888;
  }

  .section-content {
    padding: 1rem;
  }

  .vintage-panel {
    background: #1a1a1a;
    border: 2px solid #4a4a4a;
    padding: 1.5rem;
  }

  .vintage-button {
    width: 100%;
    padding: 1rem;
    background: #2a2a2a;
    border: 3px solid #6a9fb5;
    color: #6a9fb5;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }

  .vintage-button:hover:not(:disabled) {
    background: #3a3a3a;
    border-color: #8ab9c5;
    color: #8ab9c5;
    box-shadow: 0 0 10px rgba(106, 159, 181, 0.3);
  }

  .vintage-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #4a4a4a;
    color: #666;
  }

  .run-button {
    margin-bottom: 1rem;
  }

  .gate-button {
    margin-bottom: 1rem;
  }

  .help-text {
    color: #888;
    font-size: 0.85rem;
    text-align: center;
    line-height: 1.4;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.5rem;
    background: #0a0a0a;
    border: 1px solid #3a3a3a;
    color: #0f0;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }

  .status-light {
    width: 8px;
    height: 8px;
    background: #0f0;
    border-radius: 50%;
    box-shadow: 0 0 8px #0f0;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .no-observations {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .observations-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .observation-item {
    background: #2a2a2a;
    padding: 0.75rem;
    border-left: 3px solid #6a9fb5;
    color: #ccc;
    font-size: 0.9rem;
  }

  .clear-button {
    width: 100%;
    padding: 0.5rem;
    background: #3a1a1a;
    border: 1px solid #6a4a4a;
    color: #c88;
    cursor: pointer;
    border-radius: 2px;
  }

  .clear-button:hover {
    background: #4a2a2a;
    border-color: #8a6a6a;
  }
</style>
