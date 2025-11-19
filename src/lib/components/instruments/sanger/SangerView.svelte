<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import SangerInstrument from './SangerInstrument.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import type { DdNTPType } from '../../../../data/organisms';
  let sangerRef = $state<SangerInstrument>();
  let lastHoveredInfo = $state<string | null>(null);
  
  // Workflow stages
  let currentStage = $state<'preparation' | 'reaction-setup' | 'thermal-cycling' | 'gel-loading' | 'gel-running' | 'sequence-reading'>('preparation');
  
  // Preparation stage
  let templatePrepared = $state(false);
  
  // Reaction setup stage
  let primerAdded = $state(false);
  let selectedDdNTPs = $state<DdNTPType[]>([]);
  let polymeraseAdded = $state(false);
  
  // Thermal cycling stage
  let isCycling = $state(false);
  let currentCycle = $state(0);
  const TOTAL_CYCLES = 25;
  
  // Gel electrophoresis stage
  let gelLoaded = $state(false);
  let gelRunning = $state(false);
  let gelComplete = $state(false);
  
  // Sequence reading
  let sequenceRevealed = $state(false);

  function prepareTemplate() {
    templatePrepared = true;
    sangerRef?.showTemplatePrepared();
  }

  function advanceToReactionSetup() {
    if (!templatePrepared) return;
    currentStage = 'reaction-setup';
  }

  function addPrimer() {
    primerAdded = true;
    sangerRef?.showPrimerAdded();
  }

  function toggleDdNTP(ddntp: DdNTPType) {
    if (selectedDdNTPs.includes(ddntp)) {
      selectedDdNTPs = selectedDdNTPs.filter(d => d !== ddntp);
    } else {
      selectedDdNTPs = [...selectedDdNTPs, ddntp];
    }
    sangerRef?.updateDdNTPs(selectedDdNTPs);
  }

  function addPolymerase() {
    polymeraseAdded = true;
    sangerRef?.showPolymeraseAdded();
  }

  async function startThermalCycling() {
    if (!primerAdded || selectedDdNTPs.length === 0 || !polymeraseAdded) return;
    
    currentStage = 'thermal-cycling';
    isCycling = true;
    currentCycle = 0;
    
    sangerRef?.startCycling();
    
    // Simulate thermal cycling
    for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
      currentCycle = cycle;
      await sleep(100); // Fast cycling for demo
    }
    
    isCycling = false;
    sangerRef?.completeCycling();
  }

  function advanceToGelLoading() {
    if (currentCycle < TOTAL_CYCLES) return;
    currentStage = 'gel-loading';
  }

  function loadGel() {
    gelLoaded = true;
    sangerRef?.loadGel();
  }

  async function runGel() {
    if (!gelLoaded) return;
    
    currentStage = 'gel-running';
    gelRunning = true;
    sangerRef?.startGelRun();
    
    // Simulate gel running time (3 seconds)
    await sleep(3000);
    
    gelRunning = false;
    gelComplete = true;
    sangerRef?.completeGelRun();
  }

  function advanceToSequenceReading() {
    if (!gelComplete) return;
    currentStage = 'sequence-reading';
  }

  function revealSequence() {
    sequenceRevealed = true;
    sangerRef?.revealSequence();
  }

  function resetWorkflow() {
    currentStage = 'preparation';
    templatePrepared = false;
    primerAdded = false;
    selectedDdNTPs = [];
    polymeraseAdded = false;
    isCycling = false;
    currentCycle = 0;
    gelLoaded = false;
    gelRunning = false;
    gelComplete = false;
    sequenceRevealed = false;
    sangerRef?.reset();
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="sanger-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <SangerInstrument 
        bind:this={sangerRef}
        {currentStage}
        {selectedDdNTPs}
      />
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel 
    tabConfig="controls-inventory" 
    showDiagnosis={false}
  >
        <!-- Preparation Stage -->
        {#if currentStage === 'preparation'}
          <div class="control-group">
            <h3>Template Preparation</h3>
            <button 
              class="action-button primary" 
              class:completed={templatePrepared}
              disabled={templatePrepared}
              onclick={prepareTemplate}
              onmouseenter={() => setHoveredInfo('prepare-template')}
            >
              {templatePrepared ? '✓ Template Prepared' : 'Prepare DNA Template'}
            </button>
            <div class="help-text">
              Denature and purify the DNA template for sequencing
            </div>
          </div>

          <div class="control-group">
            <button 
              class="action-button primary"
              disabled={!templatePrepared}
              onclick={advanceToReactionSetup}
            >
              Next: Setup Reaction →
            </button>
          </div>
        {/if}

        <!-- Reaction Setup Stage -->
        {#if currentStage === 'reaction-setup'}
          <div class="control-group">
            <h3>Reaction Components</h3>
            
            <button 
              class="action-button" 
              class:completed={primerAdded}
              disabled={primerAdded}
              onclick={addPrimer}
              onmouseenter={() => setHoveredInfo('add-primer')}
            >
              {primerAdded ? '✓ Primer Added' : 'Add Sequencing Primer'}
            </button>

            <button 
              class="action-button" 
              class:completed={polymeraseAdded}
              disabled={polymeraseAdded}
              onclick={addPolymerase}
              onmouseenter={() => setHoveredInfo('add-polymerase')}
            >
              {polymeraseAdded ? '✓ DNA Polymerase Added' : 'Add DNA Polymerase'}
            </button>
          </div>

          <div class="control-group">
            <h3>Chain Terminators (ddNTPs)</h3>
            <div class="help-text">
              Select fluorescent dideoxynucleotides - each stops DNA synthesis at specific bases
            </div>
            
            <div class="ddntp-grid">
              <button 
                class="ddntp-button"
                class:selected={selectedDdNTPs.includes('ddATP')}
                onclick={() => toggleDdNTP('ddATP')}
                onmouseenter={() => setHoveredInfo('ddatp')}
              >
                <div class="ddntp-label" style="color: #00ff00;">ddATP</div>
                <div class="ddntp-desc">Green</div>
              </button>

              <button 
                class="ddntp-button"
                class:selected={selectedDdNTPs.includes('ddTTP')}
                onclick={() => toggleDdNTP('ddTTP')}
                onmouseenter={() => setHoveredInfo('ddttp')}
              >
                <div class="ddntp-label" style="color: #ff0000;">ddTTP</div>
                <div class="ddntp-desc">Red</div>
              </button>

              <button 
                class="ddntp-button"
                class:selected={selectedDdNTPs.includes('ddGTP')}
                onclick={() => toggleDdNTP('ddGTP')}
                onmouseenter={() => setHoveredInfo('ddgtp')}
              >
                <div class="ddntp-label" style="color: #000000;">ddGTP</div>
                <div class="ddntp-desc">Black</div>
              </button>

              <button 
                class="ddntp-button"
                class:selected={selectedDdNTPs.includes('ddCTP')}
                onclick={() => toggleDdNTP('ddCTP')}
                onmouseenter={() => setHoveredInfo('ddctp')}
              >
                <div class="ddntp-label" style="color: #0000ff;">ddCTP</div>
                <div class="ddntp-desc">Blue</div>
              </button>
            </div>
          </div>

          <div class="control-group">
            <button 
              class="action-button primary"
              disabled={!primerAdded || selectedDdNTPs.length === 0 || !polymeraseAdded}
              onclick={startThermalCycling}
            >
              Start Thermal Cycling →
            </button>
          </div>
        {/if}

        <!-- Thermal Cycling Stage -->
        {#if currentStage === 'thermal-cycling'}
          <div class="control-group">
            <h3>Thermal Cycling</h3>
            
            {#if isCycling}
              <div class="cycling-status">
                <div class="status-item">
                  <span class="label">Cycle:</span>
                  <span class="value">{currentCycle}/{TOTAL_CYCLES}</span>
                </div>
                <div class="status-item">
                  <span class="label">Status:</span>
                  <span class="value">Running...</span>
                </div>
              </div>
            {:else}
              <div class="status-complete">
                <span class="icon">✓</span>
                <span>Cycling Complete - {TOTAL_CYCLES} cycles finished</span>
              </div>
            {/if}
          </div>

          <div class="control-group">
            <button 
              class="action-button primary"
              disabled={isCycling}
              onclick={advanceToGelLoading}
            >
              Next: Load Gel →
            </button>
          </div>
        {/if}

        <!-- Gel Loading Stage -->
        {#if currentStage === 'gel-loading'}
          <div class="control-group">
            <h3>Gel Electrophoresis</h3>
            
            <button 
              class="action-button" 
              class:completed={gelLoaded}
              disabled={gelLoaded}
              onclick={loadGel}
              onmouseenter={() => setHoveredInfo('load-gel')}
            >
              {gelLoaded ? '✓ Sample Loaded' : 'Load Sequencing Products'}
            </button>

            <button 
              class="action-button primary"
              disabled={!gelLoaded}
              onclick={runGel}
              onmouseenter={() => setHoveredInfo('run-gel')}
            >
              Run Gel Electrophoresis
            </button>
          </div>
        {/if}

        <!-- Gel Running Stage -->
        {#if currentStage === 'gel-running'}
          <div class="control-group">
            <h3>Gel Electrophoresis</h3>
            
            {#if gelRunning}
              <div class="status-running">
                <span>Running gel...</span>
                <span class="spinner">⚡</span>
              </div>
            {:else}
              <div class="status-complete">
                <span class="icon">✓</span>
                <span>Gel Run Complete</span>
              </div>
            {/if}
          </div>

          <div class="control-group">
            <button 
              class="action-button primary"
              disabled={gelRunning}
              onclick={advanceToSequenceReading}
            >
              Next: Read Sequence →
            </button>
          </div>
        {/if}

        <!-- Sequence Reading Stage -->
        {#if currentStage === 'sequence-reading'}
          <div class="control-group">
            <h3>Sequence Analysis</h3>
            
            <button 
              class="action-button primary" 
              disabled={sequenceRevealed}
              onclick={revealSequence}
              onmouseenter={() => setHoveredInfo('reveal-sequence')}
            >
              {sequenceRevealed ? '✓ Sequence Revealed' : 'Reveal DNA Sequence'}
            </button>

            <div class="help-text">
              Read the sequence from bottom to top, using the colored bands
            </div>
          </div>
        {/if}

        <!-- Common Controls -->
        <div class="control-group navigation">
          <button 
            class="action-button secondary"
            onclick={resetWorkflow}
          >
            ↻ Reset Workflow
          </button>
        </div>

  </InstrumentRightPanel>
</div>

<style>
  .sanger-view {
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

  .help-text {
    color: #888;
    font-size: 0.85rem;
    font-style: italic;
    line-height: 1.4;
  }

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

  .action-button.completed {
    background: rgba(95, 184, 108, 0.15);
    border-color: #5fb86c;
    color: #5fb86c;
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

  /* ddNTP Selection Grid */
  .ddntp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .ddntp-button {
    padding: 0.875rem;
    background: #1a1a1a;
    border: 2px solid #3a3a3a;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .ddntp-button:hover {
    border-color: #5a5a5a;
    background: #2a2a2a;
  }

  .ddntp-button.selected {
    border-color: #6a9fb5;
    background: #2a3a3a;
    box-shadow: 0 0 10px rgba(106, 159, 181, 0.3);
  }

  .ddntp-label {
    font-size: 1.1rem;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.25rem;
  }

  .ddntp-desc {
    font-size: 0.8rem;
    color: #888;
  }

  /* Status Displays */
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

  .status-running {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(106, 159, 181, 0.15);
    border: 2px solid #6a9fb5;
    border-radius: 4px;
    color: #6a9fb5;
    font-weight: 600;
  }

  .spinner {
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Navigation */
  .control-group.navigation {
    margin-top: auto;
  }
</style>
