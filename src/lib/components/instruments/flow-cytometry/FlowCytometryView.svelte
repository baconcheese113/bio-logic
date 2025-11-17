<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import FlowCytometryInstrument from './FlowCytometryInstrument.svelte';
  import FlowCytometryReferenceCard from './FlowCytometryReferenceCard.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import { currentCase } from '../../../stores/game-state';
  import { filteredOrganisms, addFlowCytometryPopulation, type FlowCytometryPopulationType } from '../../../stores/evidence';
  import { ANSWER_FORMATS } from '../../../../data/organisms';
  import { CLINICAL_DIAGNOSES } from '../../../../data/clinical-diagnoses';
  import { get } from 'svelte/store';

  let showDiagnosis = $state(false);
  let showObservationsSection = $state(true);
  let showMeasurementSection = $state(true);
  let showResultsSection = $state(true);
  let showInterpretationSection = $state(true);
  let cytometerRef = $state<FlowCytometryInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  let isRunning = $state(false);
  let hasRun = $state(false);
  let measurements = $state<{ count: number; percentage: number; meanFSC: number; meanSSC: number } | null>(null);
  let observations = $state<string[]>([]);

  function startAnalysis() {
    isRunning = true;
    hasRun = true;
    measurements = null; // Clear previous measurements
    cytometerRef?.runCytometer();
    setTimeout(() => {
      isRunning = false;
    }, 2500);
  }

  function measureGatedPopulation() {
    measurements = cytometerRef?.getGatedMeasurements() || null;
  }

  function interpretPopulation(popType: FlowCytometryPopulationType) {
    if (!measurements) return;

    // Record to evidence store
    const countBefore = get(filteredOrganisms).length;
    addFlowCytometryPopulation(popType);
    
    // Store measurements for observation (they'll be cleared after)
    const currentMeasurements = measurements;
    
    // Wait briefly for evidence to update
    setTimeout(() => {
      const countAfter = get(filteredOrganisms).length;
      
      // Create observation with interpretation
      const cellTypeNames: Record<FlowCytometryPopulationType, string> = {
        bacteria: 'Bacterial Cells',
        wbc: 'White Blood Cells',
        debris: 'Debris/Dead Cells',
        epithelial: 'Epithelial Cells'
      };
      
      let observation = `Gate ${observations.length + 1}: ${cellTypeNames[popType]} - ${currentMeasurements.count} cells (${currentMeasurements.percentage.toFixed(1)}%), FSC: ${currentMeasurements.meanFSC}, SSC: ${currentMeasurements.meanSSC}`;
      
      if (countBefore !== countAfter) {
        observation += ` → Narrowed from ${countBefore} to ${countAfter} organism(s)`;
      }
      
      observations = [...observations, observation];
      measurements = null; // Clear measurements after interpretation
    }, 100);
  }

  function clearObservations() {
    observations = [];
    measurements = null;
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
          <!-- Reference Card -->
          <FlowCytometryReferenceCard />

          <div class="section">
            <button class="section-header" onclick={() => showMeasurementSection = !showMeasurementSection}>
              <span class="section-title">Measurement</span>
              <span class="collapse-icon">{showMeasurementSection ? '▼' : '▶'}</span>
            </button>
            {#if showMeasurementSection}
              <div class="section-content vintage-panel">
                <button 
                  class="gate-button vintage-button"
                  onclick={measureGatedPopulation}
                  onmouseenter={() => setHoveredInfo('gate-control')}
                >
                  MEASURE GATED POPULATION
                </button>
                <div class="help-text">
                  Drag gate corners on plot to select cells, then measure
                </div>
              </div>
            {/if}
          </div>

          <!-- Measurement Results and Interpretation -->
          {#if measurements}
            <div class="section">
              <button class="section-header" onclick={() => showResultsSection = !showResultsSection}>
                <span class="section-title">Measurement Results</span>
                <span class="collapse-icon">{showResultsSection ? '▼' : '▶'}</span>
              </button>
              {#if showResultsSection}
                <div class="section-content vintage-panel">
                  <div class="measurement-stats">
                    <div class="stat-row">
                      <span class="stat-label">Cell Count:</span>
                      <span class="stat-value">{measurements.count}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Percentage:</span>
                      <span class="stat-value">{measurements.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Mean FSC:</span>
                      <span class="stat-value">{measurements.meanFSC}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Mean SSC:</span>
                      <span class="stat-value">{measurements.meanSSC}</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <div class="section">
              <button class="section-header" onclick={() => showInterpretationSection = !showInterpretationSection}>
                <span class="section-title">Interpretation</span>
                <span class="collapse-icon">{showInterpretationSection ? '▼' : '▶'}</span>
              </button>
              {#if showInterpretationSection}
                <div class="section-content vintage-panel">
                  <div class="help-text">
                    Based on scatter properties, classify this population:
                  </div>
                  <div class="interpretation-buttons">
                    <button 
                      class="interpret-button vintage-button"
                      onclick={() => interpretPopulation('bacteria')}
                    >
                      Bacterial Cells
                    </button>
                    <button 
                      class="interpret-button vintage-button"
                      onclick={() => interpretPopulation('wbc')}
                    >
                      White Blood Cells
                    </button>
                    <button 
                      class="interpret-button vintage-button"
                      onclick={() => interpretPopulation('debris')}
                    >
                      Debris/Dead Cells
                    </button>
                    <button 
                      class="interpret-button vintage-button"
                      onclick={() => interpretPopulation('epithelial')}
                    >
                      Epithelial Cells
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

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

      <NavigationButtons />
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
                <div class="organism-option">
                  <div class="org-name">{diagnosis.displayName}</div>
                  <div class="org-common">{diagnosis.description}</div>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <!-- Show organisms for bacterial cases -->
          <p class="match-info">{$filteredOrganisms.length} matching organism(s)</p>
          
          <div class="organism-list">
            {#each $filteredOrganisms as organism}
              <div class="organism-option">
                <div class="org-name">{organism.scientificName}</div>
                <div class="org-common">{organism.commonName}</div>
              </div>
            {/each}
            
            {#if $filteredOrganisms.length === 0}
              <div class="no-matches">
                No organisms match your observations.
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
    gap: 0.5rem;
  }

  .tab {
    flex: 1;
    padding: 0.75rem 1rem;
    background: #3a3a3a;
    color: #a0a0a0;
    border: 2px solid #4a4a4a;
    border-radius: 4px 4px 0 0;
    font-size: 0.85rem;
    cursor: pointer;
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
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    min-height: 0;
  }

  .panel-content > * {
    margin-bottom: 0.5rem;
  }

  .panel-content > *:last-child {
    margin-bottom: 0;
  }

  .section {
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
    padding: 0.75rem;
  }

  .vintage-panel {
    background: #1a1a1a;
    border: 2px solid #4a4a4a;
    padding: 0.75rem;
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
    margin-bottom: 0.5rem;
  }

  .gate-button {
    margin-bottom: 0.5rem;
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

  .measurement-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-family: 'Courier New', monospace;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: #0a0a0a;
    border: 1px solid #3a3a3a;
  }

  .stat-label {
    color: #888;
    font-size: 0.9rem;
  }

  .stat-value {
    color: #6a9fb5;
    font-weight: bold;
    font-size: 1rem;
  }

  .interpretation-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .interpret-button {
    padding: 0.75rem;
    background: #1a1a1a;
    border: 2px solid #5a8a5a;
    color: #8ab98a;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }

  .interpret-button:hover {
    background: #2a3a2a;
    border-color: #7ab97a;
    color: #9ac99a;
    box-shadow: 0 0 8px rgba(90, 138, 90, 0.3);
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
    cursor: pointer;
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

