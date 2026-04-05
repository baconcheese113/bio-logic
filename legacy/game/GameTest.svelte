<!--
  GameTest.svelte - Minimal test UI for the game engine
  Tests: clock, cases, inventory, instruments, progression
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    // Clock
    gameClock,
    pause,
    resume,
    setSpeed,
    ticksToDisplay,
    
    // Instruments
    INSTRUMENT_CONFIGS,
    allInstruments,
    createInstrument,
    loadInstrument,
    startProcessing,
    updateInstrumentStatus,
    getInstrumentProgress,
    collectResults,
    
    // Inventory
    inventory,
    collectPatientSample,
    markInUse,
    markNotInUse,
    getSampleDisplayName,
    getQualityColor,
    getQualityLabel,
    
    // Cases
    cases,
    acceptCase,
    recordObservation,
    getObservations,
    submitCase,
    
    // Progression
    progression,
    adjustFunds,
    applyCaseResult,
    purchaseInstrument,
    
    // Data
    CASES,
    getOrganismById,
    
    // Types
    type PatientSampleType,
    type InstrumentType,
    type CaseSubmission,
  } from './index';
  
  // ============================================================================
  // Local State
  // ============================================================================
  
  let activeCaseInstance = $state<ReturnType<typeof cases.getById> | null>(null);
  let logs = $state<string[]>([]);
  
  function log(msg: string) {
    const timestamp = `[${gameClock.tick}]`;
    logs = [...logs.slice(-50), `${timestamp} ${msg}`];
  }
  
  // ============================================================================
  // Reactive Updates
  // ============================================================================
  
  // Update instrument statuses on each tick
  $effect(() => {
    void gameClock.tick; // Subscribe to tick
    for (const inst of allInstruments.list) {
      if (inst.status === 'processing') {
        updateInstrumentStatus(inst.id);
      }
    }
  });
  
  // ============================================================================
  // Actions
  // ============================================================================
  
  function handleAcceptCase(caseDefId: string) {
    const result = acceptCase(caseDefId);
    if (result) {
      activeCaseInstance = result;
      log(`Accepted case: ${caseDefId} → instance ${result.id}`);
    }
  }
  
  function handleCollectSample(type: PatientSampleType) {
    if (!activeCaseInstance) return;
    const sample = collectPatientSample(activeCaseInstance.id, type);
    adjustFunds(-5); // Sample cost
    log(`Collected ${type} sample → ${sample.id}`);
  }
  
  function handleCreateInstrument(type: InstrumentType) {
    const inst = createInstrument(type);
    log(`Created instrument: ${type} → ${inst.id}`);
  }
  
  function handleLoadSample(instrumentId: string, sampleId: string) {
    const success = loadInstrument(instrumentId, sampleId);
    if (success) {
      markInUse(sampleId, instrumentId);
      log(`Loaded sample ${sampleId} into ${instrumentId}`);
    }
  }
  
  function handleStartProcessing(instrumentId: string) {
    const success = startProcessing(instrumentId);
    if (success) {
      log(`Started processing on ${instrumentId}`);
    }
  }
  
  function handleCollectResults(instrumentId: string) {
    const inst = allInstruments.getById(instrumentId);
    if (inst?.loadedItemId) {
      markNotInUse(inst.loadedItemId, instrumentId);
    }
    const output = collectResults(instrumentId);
    log(`Collected results from ${instrumentId}: ${output ? 'success' : 'none'}`);
  }
  
  function handleRecordObservation(fieldId: string, value: string) {
    if (!activeCaseInstance) return;
    const inst = allInstruments.list[0];
    recordObservation(activeCaseInstance.id, fieldId, value, inst?.id ?? 'manual');
    log(`Recorded observation: ${fieldId} = ${value}`);
  }
  
  function handleSubmitCase(diagnosis: string, treatment?: string) {
    if (!activeCaseInstance) return;
    
    const submission: CaseSubmission = {
      diagnosis,
      treatment,
      confidence: 'medium',
    };
    
    const result = submitCase(activeCaseInstance.id, submission);
    if (result) {
      applyCaseResult(result);
      log(`Submitted case! Correct: ${result.correct}, Rep: ${result.reputationChange}, Funds: ${result.fundsChange}`);
      log(`  Diagnosis: ${result.diagnosisCorrect ? '✓' : '✗'}, Treatment: ${result.treatmentCorrect ? '✓' : '✗'}`);
      if (result.lawsuit) {
        log(`⚠️ LAWSUIT: ${result.lawsuit.reason} (-${result.lawsuit.fundsPenalty} funds)`);
      }
      activeCaseInstance = null;
    }
  }
  
  function handlePurchaseInstrument(type: InstrumentType) {
    const success = purchaseInstrument(type);
    log(`Purchase ${type}: ${success ? 'success' : 'failed'}`);
  }
  
  // ============================================================================
  // Init
  // ============================================================================
  
  onMount(() => {
    log('Game engine initialized');
    // Create starter microscope
    createInstrument('microscope');
    log('Created starter microscope');
  });
</script>

<div class="test-container">
  <h1>🧪 Game Engine Test</h1>
  
  <!-- Clock & Stats -->
  <section class="panel">
    <h2>⏱️ Clock & Player Stats</h2>
    <div class="stats-grid">
      <div>
        <strong>Tick:</strong> {gameClock.tick} ({ticksToDisplay(gameClock.tick)})
      </div>
      <div>
        <strong>Speed:</strong> {gameClock.speed}x
        <button onclick={() => pause()}>⏸</button>
        <button onclick={() => resume(1)}>1x</button>
        <button onclick={() => setSpeed(5)}>5x</button>
        <button onclick={() => setSpeed(10)}>10x</button>
      </div>
      <div>
        <strong>Reputation:</strong> {progression.reputation}
      </div>
      <div>
        <strong>Funds:</strong> ${progression.funds}
      </div>
      <div>
        <strong>Era:</strong> {progression.era}
      </div>
      <div>
        <strong>Instruments:</strong> {progression.ownedInstruments.join(', ')}
      </div>
    </div>
  </section>
  
  <!-- Available Cases -->
  <section class="panel">
    <h2>📋 Available Cases</h2>
    <div class="case-list">
      {#each CASES.slice(0, 5) as caseDef}
        <div class="case-card">
          <strong>{caseDef.title}</strong>
          <span class="badge">Era: {caseDef.era}</span>
          <span class="badge">Diff: {caseDef.difficulty}</span>
          <span class="badge">Reward: ${caseDef.baseReward}</span>
          <button 
            onclick={() => handleAcceptCase(caseDef.id)}
            disabled={!!activeCaseInstance}
          >
            Accept
          </button>
        </div>
      {/each}
    </div>
  </section>
  
  <!-- Active Case -->
  {#if activeCaseInstance}
    {@const caseDef = CASES.find(c => c.id === activeCaseInstance!.definitionId)}
    <section class="panel active-case">
      <h2>🔬 Active Case: {caseDef?.title}</h2>
      <p class="presentation">{caseDef?.presentation}</p>
      
      <h3>Collect Samples</h3>
      <div class="button-row">
        {#each caseDef?.availableSamples ?? [] as sampleType}
          <button onclick={() => handleCollectSample(sampleType)}>
            + {getSampleDisplayName(sampleType)}
          </button>
        {/each}
      </div>
      
      <h3>Case Inventory ({inventory.forCase(activeCaseInstance.id).length} items)</h3>
      <ul>
        {#each inventory.forCase(activeCaseInstance.id) as item}
          <li>
            {getSampleDisplayName(item.type)} 
            <span class="quality-badge" style="background: {getQualityColor(item.quality)}">
              {getQualityLabel(item.quality)}
            </span>
            <span class="id">({item.id.slice(0, 12)}...)</span>
            {#if item.usedInInstruments.length > 0}
              <span class="badge">In use: {item.usedInInstruments.join(', ')}</span>
            {/if}
          </li>
        {/each}
      </ul>
      
      <h3>Record Observation (Player Notes)</h3>
      <div class="button-row">
        <button onclick={() => handleRecordObservation('gram-stain', 'Gram-positive (purple)')}>
          Note: Gram+
        </button>
        <button onclick={() => handleRecordObservation('gram-stain', 'Gram-negative (pink)')}>
          Note: Gram-
        </button>
        <button onclick={() => handleRecordObservation('morphology', 'Cocci (round)')}>
          Note: Cocci
        </button>
        <button onclick={() => handleRecordObservation('morphology', 'Bacilli (rod)')}>
          Note: Bacilli
        </button>
      </div>
      
      <h3>Your Observations ({getObservations(activeCaseInstance.id).length})</h3>
      <ul>
        {#each getObservations(activeCaseInstance.id) as obs}
          <li>{obs.fieldId}: <strong>{obs.value}</strong></li>
        {/each}
      </ul>
      
      <h3>Submit Diagnosis</h3>
      {#if caseDef}
      {@const organism = getOrganismById(caseDef.correctDiagnosis)}
      <div class="button-row">
        <button 
          class="correct"
          onclick={() => handleSubmitCase(caseDef?.correctDiagnosis ?? '', caseDef?.correctTreatment)}
        >
          ✓ {organism?.name ?? caseDef?.correctDiagnosis} + {caseDef?.correctTreatment ?? 'no treatment'}
        </button>
        <button 
          class="incorrect"
          onclick={() => handleSubmitCase('wrong-answer', 'wrong-treatment')}
        >
          ✗ Wrong Answer (test penalty)
        </button>
      </div>
      {/if}
    </section>
  {/if}
  
  <!-- Instruments -->
  <section class="panel">
    <h2>🔧 Instruments ({allInstruments.list.length})</h2>
    
    <div class="button-row">
      <button onclick={() => handleCreateInstrument('microscope')}>+ Microscope</button>
      <button onclick={() => handleCreateInstrument('culture-plate')}>+ Culture Plate</button>
    </div>
    
    <div class="instrument-list">
      {#each allInstruments.list as inst}
        {@const config = INSTRUMENT_CONFIGS[inst.type]}
        <div class="instrument-card">
          <strong>{config.name}</strong>
          <span class="badge">{inst.status}</span>
          
          {#if inst.status === 'processing'}
            <div class="progress-bar">
              <div class="fill" style="width: {getInstrumentProgress(inst.id)}%"></div>
            </div>
            <span>{Math.round(getInstrumentProgress(inst.id))}%</span>
          {/if}
          
          {#if inst.status === 'idle' && activeCaseInstance}
            <select onchange={(e) => {
              const target = e.target as HTMLSelectElement;
              if (target.value) handleLoadSample(inst.id, target.value);
            }}>
              <option value="">Load sample...</option>
              {#each inventory.forCase(activeCaseInstance.id) as item}
                <option value={item.id}>{getSampleDisplayName(item.type)}</option>
              {/each}
            </select>
          {/if}
          
          {#if inst.status === 'loading'}
            <button onclick={() => handleStartProcessing(inst.id)}>▶ Start</button>
          {/if}
          
          {#if inst.status === 'complete'}
            <button onclick={() => handleCollectResults(inst.id)}>📥 Collect</button>
          {/if}
        </div>
      {/each}
    </div>
  </section>
  
  <!-- Tech Tree -->
  <section class="panel">
    <h2>🌳 Tech Tree</h2>
    <div class="button-row">
      {#each progression.availableInstruments() as node}
        {@const canBuy = progression.canPurchase(node.instrumentType)}
        <button 
          onclick={() => handlePurchaseInstrument(node.instrumentType)}
          disabled={!canBuy.canPurchase}
          title={canBuy.reason ?? ''}
        >
          {node.instrumentType} (${node.cost})
        </button>
      {/each}
    </div>
  </section>
  
  <!-- Completed Cases -->
  <section class="panel">
    <h2>📊 Completed Cases ({cases.completed.length})</h2>
    <ul>
      {#each cases.completed as result}
        <li class:correct={result.correct} class:incorrect={!result.correct}>
          {result.caseId.slice(0, 20)}... 
          → {result.correct ? '✓' : '✗'}
          Rep: {result.reputationChange > 0 ? '+' : ''}{result.reputationChange}
          Funds: {result.fundsChange > 0 ? '+' : ''}{result.fundsChange}
        </li>
      {/each}
    </ul>
  </section>
  
  <!-- Log -->
  <section class="panel log">
    <h2>📜 Event Log</h2>
    <div class="log-content">
      {#each logs as entry}
        <div>{entry}</div>
      {/each}
    </div>
  </section>
</div>

<style>
  .test-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .panel {
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .panel h2 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    color: #88c0d0;
  }
  
  .panel h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 0.9rem;
    color: #81a1c1;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
  }
  
  .case-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .case-card, .instrument-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #16213e;
    border-radius: 4px;
  }
  
  .badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
    background: #2d4a7c;
    border-radius: 3px;
    color: #a3be8c;
  }
  
  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.4rem 0.75rem;
    border: none;
    border-radius: 4px;
    background: #4c566a;
    color: #eceff4;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  button:hover:not(:disabled) {
    background: #5e81ac;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  button.correct {
    background: #2e7d32;
  }
  
  button.incorrect {
    background: #c62828;
  }
  
  select {
    padding: 0.3rem;
    border-radius: 4px;
    background: #3b4252;
    color: #eceff4;
    border: 1px solid #4c566a;
  }
  
  .presentation {
    font-size: 0.9rem;
    color: #d8dee9;
    line-height: 1.5;
    background: #0f0f23;
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
  }
  
  .id {
    font-size: 0.7rem;
    color: #4c566a;
  }
  
  .quality-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    color: white;
    font-weight: 600;
    margin-left: 0.25rem;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin: 0.25rem 0;
  }
  
  li.correct {
    color: #a3be8c;
  }
  
  li.incorrect {
    color: #bf616a;
  }
  
  .progress-bar {
    width: 100px;
    height: 8px;
    background: #2e3440;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-bar .fill {
    height: 100%;
    background: #88c0d0;
    transition: width 0.1s;
  }
  
  .log {
    max-height: 200px;
    overflow: hidden;
  }
  
  .log-content {
    font-family: monospace;
    font-size: 0.75rem;
    color: #8fbcbb;
    max-height: 150px;
    overflow-y: auto;
  }
  
  .active-case {
    border-color: #88c0d0;
  }
  
  .instrument-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
</style>
