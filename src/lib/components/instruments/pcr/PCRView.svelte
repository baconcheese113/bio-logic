<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import PCRStageView from './PCRStageView.svelte';
  import GelElectrophoresis from './GelElectrophoresis.svelte';
  import PrimerDesigner from './PrimerDesigner.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import { proceedToDiagnosis, currentCase } from '../../../stores/game-state';
  import { setPrimerDesign, setPCRComplete, setEstimatedFragmentSize, addDetectedGene, filteredOrganisms } from '../../../stores/evidence';
  import { GENE_SEQUENCES, type PrimerDesign, type PrimerQuality, type GeneSequenceData } from '../../../../data/organisms';
  import { evaluatePrimerQuality } from '../../../utils/primer-calculations';
  import { get } from 'svelte/store';

  let showDiagnosis = $state(false);
  let pcrStageRef = $state<PCRStageView>();
  let lastHoveredInfo = $state<string | null>(null);
  let isRunning = $state(false);
  let pcrComplete = $state(false);
  let currentCycle = $state(0);
  let currentTemp = $state(25);
  let currentStage = $state<'denaturation' | 'annealing' | 'extension' | 'idle'>('idle');
  
  // Navigation between workflow stages
  let currentWorkflowStage = $state<'design' | 'run' | 'gel'>('design');

  // Gel workflow state
  let gelStep = $state<1 | 2 | 3 | 4>(1); // 1=load, 2=run, 3=view UV
  let gelIsRunning = $state(false);
  let pcrResultMessage = $state<string | null>(null);

  const TOTAL_CYCLES = 25;
  const CYCLE_DURATION = 200; // ms per cycle (fast for demo)

  // Get gene sequence data for this case
  const geneId = $derived($currentCase?.pcrTarget?.geneId);
  const geneData = $derived<GeneSequenceData | null>(
    geneId ? GENE_SEQUENCES.find(g => g.id === geneId) || null : null
  );

  // Initialize primer design with optimal region (user can adjust after)
  let primerDesign = $state<PrimerDesign | null>(null);
  
  // Initialize default positions when gene data loads (one-time initialization)
  $effect(() => {
    if (geneData && !primerDesign) {
      primerDesign = {
        forwardStart: geneData.optimalAmplificationRegion.start,
        forwardLength: 20,
        reverseStart: Math.floor((geneData.optimalAmplificationRegion.start + geneData.optimalAmplificationRegion.end) / 2),
        reverseLength: 20
      };
    }
  });

  // Real-time quality evaluation
  const primerQuality = $derived<PrimerQuality | null>(
    geneData && primerDesign ? evaluatePrimerQuality(geneData.fullSequence, primerDesign) : null
  );

  async function runPCR() {
    if (!primerDesign || !primerQuality) return;
    
    isRunning = true;
    pcrComplete = false;
    currentCycle = 0;
    currentWorkflowStage = 'run';

    // Save primer design to evidence
    setPrimerDesign(primerDesign);

    pcrStageRef?.startCycling();

    for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
      currentCycle = cycle;

      // Denaturation: 94°C
      currentStage = 'denaturation';
      currentTemp = 94;
      await sleep(CYCLE_DURATION / 3);

      // Annealing: Use actual primer Tm (or 55°C default)
      currentStage = 'annealing';
      currentTemp = Math.round((primerQuality.forwardTm + primerQuality.reverseTm) / 2);
      await sleep(CYCLE_DURATION / 3);

      // Extension: 72°C
      currentStage = 'extension';
      currentTemp = 72;
      await sleep(CYCLE_DURATION / 3);
    }

    currentStage = 'idle';
    currentTemp = 25;
    isRunning = false;
    pcrComplete = true;
    setPCRComplete(true);
    
    pcrStageRef?.completeCycling();
  }

  function loadGel() {
    if (!pcrComplete || !primerQuality) return;
    currentWorkflowStage = 'gel';
    gelStep = 1;
  }

  function loadGelSample() {
    if (gelStep !== 1) return;
    gelStep = 2;
  }

  async function runGelElectrophoresis() {
    if (gelStep !== 2 || gelIsRunning) return;
    gelIsRunning = true;
    
    // Simulate 60 min run (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    gelIsRunning = false;
    gelStep = 3;
  }

  function viewUnderUV() {
    if (gelStep !== 3) return;
    gelStep = 4;
  }

  function handleGelComplete(fragmentSize: number) {
    setEstimatedFragmentSize(fragmentSize);
    
    // If a band was detected (fragmentSize > 0), record the gene as detected
    if (fragmentSize > 0 && geneId) {
      // Capture count BEFORE modifying evidence store (non-reactive read)
      const countBefore = get(filteredOrganisms).length;
      
      // Modify evidence
      addDetectedGene(geneId);
      
      // Show result after filtering (use non-reactive reads to avoid effect loops)
      setTimeout(() => {
        const countAfter = get(filteredOrganisms).length;
        const geneName = geneData?.name || geneId;
        
        if (countAfter < countBefore) {
          pcrResultMessage = `✓ ${geneName} DETECTED - Narrowed from ${countBefore} to ${countAfter} organism(s)`;
        } else if (countAfter === 1) {
          pcrResultMessage = `✓ ${geneName} DETECTED - Single organism identified!`;
        } else {
          pcrResultMessage = `✓ ${geneName} DETECTED - Fragment size: ${fragmentSize}bp`;
        }
      }, 100);
    } else {
      const geneName = geneData?.name || geneId || 'Target gene';
      pcrResultMessage = `✗ ${geneName} NOT DETECTED - No amplification`;
    }
  }

  function resetToPrimerDesign() {
    currentWorkflowStage = 'design';
    isRunning = false;
  }

  function resetWorkflow() {
    currentWorkflowStage = 'design';
    isRunning = false;
    pcrComplete = false;
    currentCycle = 0;
    currentTemp = 25;
    currentStage = 'idle';
    
    // Reset primers to default
    if (geneData) {
      const optimalStart = geneData.optimalAmplificationRegion.start;
      const optimalEnd = geneData.optimalAmplificationRegion.end;
      const midpoint = Math.floor((optimalStart + optimalEnd) / 2);
      
      primerDesign = {
        forwardStart: optimalStart,
        forwardLength: 20,
        reverseStart: midpoint,
        reverseLength: 20
      };
    }
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function handleDesignChange(design: PrimerDesign) {
    primerDesign = design;
    pcrStageRef?.loadSample();
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="pcr-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      {#if currentWorkflowStage === 'gel' && primerQuality}
        <GelElectrophoresis 
          {primerQuality}
          step={gelStep}
          isRunning={gelIsRunning}
          onComplete={handleGelComplete}
          onHover={setHoveredInfo}
        />
      {:else}
        <PCRStageView
          bind:this={pcrStageRef}
          {geneData}
          {primerDesign}
          {primerQuality}
          {currentCycle}
          {currentTemp}
          {currentStage}
          workflowStage={currentWorkflowStage}
          onHover={setHoveredInfo}
        />
      {/if}
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
        Diagnosis ({$filteredOrganisms.length})
      </button>
    </div>

    {#if !showDiagnosis}
      <div class="panel-content">
        <!-- Design Stage: Primer Design Controls -->
        {#if currentWorkflowStage === 'design' && geneData && primerDesign}
          <div class="control-group">
            <h3>Primer Design</h3>
            <PrimerDesigner 
              {geneData} 
              {primerDesign}
              onDesignChange={handleDesignChange}
            />
          </div>

          <div class="control-group">
            <h3>Run PCR</h3>
            <button 
              class="action-button primary" 
              disabled={!primerDesign}
              onclick={runPCR}
              onmouseenter={() => setHoveredInfo('run-pcr')}
            >
              Start Thermal Cycling
            </button>
          </div>
        {/if}

        <!-- Run/Gel Stage: Navigation & Status -->
        {#if currentWorkflowStage === 'run' || currentWorkflowStage === 'gel'}
          <div class="control-group">
            {#if currentWorkflowStage === 'run'}
              <h3>PCR Status</h3>

              {#if isRunning}
                <div class="cycling-status">
                  <div class="status-item">
                    <span class="label">Cycle:</span>
                    <span class="value">{currentCycle}/{TOTAL_CYCLES}</span>
                  </div>
                  <div class="status-item">
                    <span class="label">Temperature:</span>
                    <span class="value temp">{currentTemp}°C</span>
                  </div>
                  <div class="status-item">
                    <span class="label">Stage:</span>
                    <span class="value stage">{currentStage}</span>
                  </div>
                </div>
              {:else if pcrComplete}
                <div class="status-complete">
                  <span class="icon">✓</span>
                  <span>PCR Complete - {TOTAL_CYCLES} cycles finished</span>
                </div>
              {/if}

              <button 
                class="action-button primary" 
                disabled={!pcrComplete}
                onclick={loadGel}
                onmouseenter={() => setHoveredInfo('load-gel')}
              >
                Load DNA Gel
              </button>
            {:else}
              <h3>Gel Electrophoresis</h3>

              <button 
                class="action-button primary" 
                class:completed={gelStep > 1}
                disabled={gelStep !== 1}
                onclick={loadGelSample}
                onmouseenter={() => setHoveredInfo('load-gel-sample')}
              >
                {gelStep > 1 ? '✓ Sample Loaded' : '1. Load PCR Product'}
              </button>

              <button 
                class="action-button primary" 
                class:completed={gelStep > 2}
                disabled={gelStep !== 2}
                onclick={runGelElectrophoresis}
                onmouseenter={() => setHoveredInfo('run-gel-electrophoresis')}
              >
                {gelStep === 2 && !gelIsRunning ? '2. Run Gel (100V, 60 min)' :
                 gelIsRunning ? 'Running...' :
                 gelStep > 2 ? '✓ Gel Complete' : '2. Run Gel (100V, 60 min)'}
              </button>

              <button 
                class="action-button primary" 
                class:completed={gelStep > 3}
                disabled={gelStep !== 3}
                onclick={viewUnderUV}
                onmouseenter={() => setHoveredInfo('view-uv-bands')}
              >
                {gelStep > 3 ? '✓ UV Analysis Complete' : '3. View Under UV Light'}
              </button>
              
              {#if pcrResultMessage && gelStep === 4}
                <div class="pcr-result-notification" class:positive={pcrResultMessage.startsWith('✓')}>
                  {pcrResultMessage}
                </div>
              {/if}
            {/if}
          </div>

          <div class="control-group navigation">
            <button 
              class="action-button secondary"
              onclick={resetToPrimerDesign}
            >
              ← Back to Design
            </button>
            <button 
              class="action-button secondary"
              onclick={resetWorkflow}
            >
              ↻ Reset All
            </button>
          </div>
        {/if}

        <NavigationButtons />
      </div>
    {:else}
      <div class="panel-content">
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
  .pcr-view {
    display: flex;
    height: 100%;
    background: #0a0a0a;
  }

  .stage-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .controls-panel {
    width: 320px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
  }

  .panel-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #4a4a4a;
  }

  .tab {
    flex: 1;
    padding: 0.75rem;
    background: #3a3a3a;
    color: #a0a0a0;
    border: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
  }

  .tab:hover {
    background: #4a4a4a;
    color: #e0e0e0;
  }

  .tab.active {
    background: #2a2a2a;
    color: #ffd700;
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  /* Control Groups */
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .control-group h3 {
    margin: 0;
    color: #6a9fb5;
    font-size: 1rem;
    font-weight: 600;
  }

  /* Action Buttons */
  .action-button {
    width: 100%;
    padding: 0.875rem;
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #4a4a4a;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover:not(:disabled) {
    background: #4a4a4a;
    border-color: #6a9fb5;
    transform: translateY(-1px);
  }

  .action-button:disabled {
    background: #2a2a2a;
    color: #666;
    cursor: not-allowed;
    border-color: #3a3a3a;
  }

  .action-button.primary {
    background: #6a9fb5;
    color: #fff;
    border-color: #6a9fb5;
  }

  .action-button.primary:hover:not(:disabled) {
    background: #7ab5cc;
    border-color: #7ab5cc;
  }

  .action-button.primary:disabled {
    background: #3a3a3a;
  }

  /* Status Display */
  .cycling-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #1a1a1a;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .status-item .label {
    color: #888;
  }

  .status-item .value {
    color: #5fb86c;
    font-weight: bold;
  }

  .status-item .value.temp {
    color: #ff6b6b;
  }

  .status-item .value.stage {
    color: #4a9eff;
    text-transform: capitalize;
  }

  /* Status Complete */
  .status-complete {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(95, 184, 108, 0.15);
    border: 2px solid #5fb86c;
    border-radius: 4px;
    color: #5fb86c;
    font-weight: 600;
  }

  .status-complete .icon {
    font-size: 1.2rem;
  }

  /* Navigation Controls */
  .control-group.navigation {
    display: flex;
    gap: 0.5rem;
  }

  .control-group.navigation button {
    flex: 1;
  }

  .action-button.secondary {
    background: #2a2a2a;
    border-color: #3a3a3a;
    color: #aaa;
  }

  .action-button.secondary:hover:not(:disabled) {
    background: #3a3a3a;
    border-color: #4a4a4a;
    color: #e0e0e0;
  }

  /* Diagnosis Tab */
  .match-info {
    color: #ffd700;
    font-weight: bold;
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
  }

  .organism-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .organism-option {
    background: #3a3a3a;
    border: 2px solid #4a4a4a;
    border-radius: 6px;
    padding: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .organism-option:hover {
    background: #4a4a4a;
    border-color: #ffd700;
    transform: translateX(2px);
  }

  .org-name {
    color: #e0e0e0;
    font-weight: bold;
    font-size: 0.95rem;
    font-style: italic;
    margin-bottom: 0.25rem;
  }

  .org-common {
    color: #a0a0a0;
    font-size: 0.85rem;
  }

  .no-matches {
    color: #888;
    font-style: italic;
    padding: 1.5rem;
    text-align: center;
    line-height: 1.5;
  }

  .pcr-result-notification {
    margin-top: 1rem;
    padding: 0.875rem;
    background: #3a2a2a;
    border-left: 4px solid #cc6666;
    border-radius: 4px;
    color: #e0c0c0;
    font-size: 0.9rem;
    line-height: 1.4;
    animation: slideIn 0.3s ease-out;
  }

  .pcr-result-notification.positive {
    background: #2a3a2a;
    border-left-color: #66cc66;
    color: #d0e0d0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
