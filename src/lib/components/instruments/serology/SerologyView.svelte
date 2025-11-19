<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import AgglutinationSlide from './AgglutinationSlide.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import InventoryPanel from '../../shared/InventoryPanel.svelte';
  import { evidence, setBloodType, setRhFactor, setSyphilisAntibodies, setDiphtheriaAntitoxin } from '../../../stores/evidence';
  import { currentCase } from '../../../stores/game-state';
  import { currentActiveCase } from '../../../stores/active-cases';
  import { getSamplesForCase, type InventoryItem } from '../../../stores/inventory';

  let currentTest = $state<'anti-a' | 'anti-b' | 'anti-d' | 'syphilis' | 'diphtheria' | null>(null);
  let testResult = $state<'positive' | 'negative'>('negative');
  let lastHoveredInfo = $state<string | null>(null);

  // Sample selection state
  let selectedSample = $state<InventoryItem | null>(null);
  let activeTab = $state<'controls' | 'inventory'>('controls');

  // Derive available samples from active case
  let availableSamples = $derived(
    $currentActiveCase ? getSamplesForCase($currentActiveCase.caseId) : []
  );

  function selectSample(sample: InventoryItem) {
    selectedSample = sample;
  }

  function changeSample() {
    selectedSample = null;
  }

  const tests = [
    { value: 'anti-a' as const, label: 'Anti-A Serum', infoKey: 'test-anti-a' },
    { value: 'anti-b' as const, label: 'Anti-B Serum', infoKey: 'test-anti-b' },
    { value: 'anti-d' as const, label: 'Anti-D Serum (Rh)', infoKey: 'test-rh' },
    { value: 'syphilis' as const, label: 'Syphilis (RPR)', infoKey: 'test-syphilis' },
    { value: 'diphtheria' as const, label: 'Diphtheria Antitoxin', infoKey: 'test-diphtheria' },
  ];

  // Track which tests have been run
  let antiAResult = $state<'positive' | 'negative' | null>(null);
  let antiBResult = $state<'positive' | 'negative' | null>(null);

  function selectTest(test: typeof currentTest) {
    currentTest = currentTest === test ? null : test;
    
    // For blood typing cases, simulate correct agglutination based on case answer
    if ($currentCase.answerFormat === 'blood-typing') {
      const correctBloodType = $currentCase.correctAnswer; // e.g., "A+", "O-", "AB+"
      const baseType = correctBloodType.replace('+', '').replace('-', ''); // Strip Rh
      
      if (test === 'anti-a') {
        // Agglutinates if blood has A antigen (A or AB)
        testResult = (baseType === 'A' || baseType === 'AB') ? 'positive' : 'negative';
      } else if (test === 'anti-b') {
        // Agglutinates if blood has B antigen (B or AB)
        testResult = (baseType === 'B' || baseType === 'AB') ? 'positive' : 'negative';
      } else if (test === 'anti-d') {
        // Agglutinates if Rh positive
        testResult = correctBloodType.includes('+') ? 'positive' : 'negative';
      }
    } else if ($currentCase.answerFormat === 'immunity-screening') {
      if (test === 'diphtheria') {
        testResult = $currentCase.correctAnswer === 'immune' ? 'positive' : 'negative';
      }
    } else if ($currentCase.answerFormat === 'syphilis-detection') {
      if (test === 'syphilis') {
        testResult = $currentCase.correctAnswer === 'positive' ? 'positive' : 'negative';
      }
    }
  }

  function recordAntiAResult(result: 'positive' | 'negative') {
    antiAResult = result;
    updateBloodTypeFromTests();
  }

  function recordAntiBResult(result: 'positive' | 'negative') {
    antiBResult = result;
    updateBloodTypeFromTests();
  }

  function updateBloodTypeFromTests() {
    if (antiAResult === null || antiBResult === null) return;
    
    // Determine ABO type from test results
    if (antiAResult === 'positive' && antiBResult === 'positive') {
      setBloodType('AB');
    } else if (antiAResult === 'positive' && antiBResult === 'negative') {
      setBloodType('A');
    } else if (antiAResult === 'negative' && antiBResult === 'positive') {
      setBloodType('B');
    } else {
      setBloodType('O');
    }
  }

  function recordRhFactor(isPositive: boolean) {
    setRhFactor(isPositive);
  }

  function recordSyphilis(hasAntibodies: boolean) {
    setSyphilisAntibodies(hasAntibodies);
  }

  function recordDiphtheria(hasAntitoxin: boolean) {
    setDiphtheriaAntitoxin(hasAntitoxin);
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="serology-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <AgglutinationSlide testType={currentTest} result={testResult} />
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <div class="controls-panel">
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button 
        class="tab-button"
        class:active={activeTab === 'controls'}
        onclick={() => activeTab = 'controls'}
      >
        Controls
      </button>
      <button 
        class="tab-button"
        class:active={activeTab === 'inventory'}
        onclick={() => activeTab = 'inventory'}
      >
        Inventory
      </button>
    </div>

    {#if activeTab === 'controls'}
      <!-- Sample Selection or Active Sample -->
      {#if !selectedSample}
        <div class="sample-selection-prompt">
          <h3>Select Sample</h3>
          <p>Choose a blood sample to test:</p>
          {#if availableSamples.length > 0}
            <div class="sample-list">
              {#each availableSamples as sample}
                <button 
                  class="sample-item"
                  onclick={() => selectSample(sample)}
                >
                  <span class="sample-icon">🩸</span>
                  <span class="sample-name">{sample.type}</span>
                </button>
              {/each}
            </div>
          {:else}
            <p class="no-samples">No samples available. Collect a blood sample first.</p>
          {/if}
        </div>
      {:else}
        <!-- Active Sample Indicator -->
        <div class="active-sample-badge">
          <span>Using: {selectedSample.type}</span>
          <button class="change-sample-btn" onclick={changeSample}>Change Sample</button>
        </div>

        <!-- Test Selection Section -->
        <CollapsibleSection title="Test Selection" isOpen={true}>
      <div class="test-buttons">
        {#each tests as { value, label, infoKey }}
          <button 
            class="test-button" 
            class:active={currentTest === value}
            onclick={() => selectTest(value)}
            onmouseenter={() => setHoveredInfo(infoKey)}
          >
            {label}
          </button>
        {/each}
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Record Results" isOpen={true}>
      {#if currentTest === 'anti-a'}
        <div class="obs-label">Anti-A Serum Result:</div>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button"
            class:active={antiAResult === 'positive'}
            onclick={() => recordAntiAResult('positive')}
            onmouseenter={() => setHoveredInfo('agglutination')}
          >
            Agglutination (+)
          </button>
          <button 
            class="obs-button"
            class:active={antiAResult === 'negative'}
            onclick={() => recordAntiAResult('negative')}
            onmouseenter={() => setHoveredInfo('agglutination')}
          >
            No Agglutination (-)
          </button>
        </div>
        {#if antiAResult !== null}
          <div class="info-hint">
            Now test with Anti-B serum to determine blood type
          </div>
        {/if}

      {:else if currentTest === 'anti-b'}
        <div class="obs-label">Anti-B Serum Result:</div>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button"
            class:active={antiBResult === 'positive'}
            onclick={() => recordAntiBResult('positive')}
            onmouseenter={() => setHoveredInfo('agglutination')}
          >
            Agglutination (+)
          </button>
          <button 
            class="obs-button"
            class:active={antiBResult === 'negative'}
            onclick={() => recordAntiBResult('negative')}
            onmouseenter={() => setHoveredInfo('agglutination')}
          >
            No Agglutination (-)
          </button>
        </div>
        {#if antiBResult !== null && antiAResult === null}
          <div class="info-hint">
            Now test with Anti-A serum to determine blood type
          </div>
        {/if}

      {:else if currentTest === 'anti-d'}
        <div class="obs-label">Anti-D (Rh) Result:</div>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button"
            class:active={$evidence.rhFactor === true}
            onclick={() => recordRhFactor(true)}
            onmouseenter={() => setHoveredInfo('rh-positive')}
          >
            Positive (+)
          </button>
          <button 
            class="obs-button"
            class:active={$evidence.rhFactor === false}
            onclick={() => recordRhFactor(false)}
            onmouseenter={() => setHoveredInfo('rh-negative')}
          >
            Negative (-)
          </button>
        </div>

      {:else if currentTest === 'syphilis'}
        <div class="obs-label">Antibodies Detected:</div>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button"
            class:active={$evidence.syphilisAntibodies === true}
            onclick={() => recordSyphilis(true)}
            onmouseenter={() => setHoveredInfo('syphilis-positive')}
          >
            Positive
          </button>
          <button 
            class="obs-button"
            class:active={$evidence.syphilisAntibodies === false}
            onclick={() => recordSyphilis(false)}
            onmouseenter={() => setHoveredInfo('syphilis-negative')}
          >
            Negative
          </button>
        </div>

      {:else if currentTest === 'diphtheria'}
        <div class="obs-label">Antitoxin Present:</div>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button"
            class:active={$evidence.diphtheriaAntitoxin === true}
            onclick={() => recordDiphtheria(true)}
            onmouseenter={() => setHoveredInfo('diphtheria-immune')}
          >
            Immune
          </button>
          <button 
            class="obs-button"
            class:active={$evidence.diphtheriaAntitoxin === false}
            onclick={() => recordDiphtheria(false)}
            onmouseenter={() => setHoveredInfo('diphtheria-not-immune')}
          >
            Not Immune
          </button>
        </div>

      {:else}
        <div class="info-hint">Select a test above to record results</div>
      {/if}
    </CollapsibleSection>
      {/if}

      <!-- Navigation Section -->
      <NavigationButtons />
    {:else}
      <!-- Inventory Tab -->
      <InventoryPanel />
    {/if}
  </div>
</div>

<style>
  .serology-view {
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
    gap: 0.75rem;
    overflow-y: auto;
  }

  .test-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .test-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .test-button:hover {
    background: #4a4a4a;
  }

  .test-button.active {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .obs-label {
    font-weight: bold;
    margin-bottom: 0.4rem;
    color: #b0b0b0;
    font-size: 0.85rem;
  }

  .obs-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .info-hint {
    text-align: center;
    color: #888;
    font-style: italic;
    padding: 1rem;
    font-size: 0.85rem;
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
  }

  .tab-button {
    flex: 1;
    padding: 0.6rem;
    background: transparent;
    color: #999;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .tab-button:hover {
    background: #333;
    color: #fff;
  }

  .tab-button.active {
    background: #3a7bc8;
    color: #fff;
  }

  /* Sample Selection Prompt */
  .sample-selection-prompt {
    padding: 1.5rem;
    text-align: center;
  }

  .sample-selection-prompt h3 {
    margin-bottom: 0.5rem;
    color: #fff;
  }

  .sample-selection-prompt p {
    color: #999;
    margin-bottom: 1rem;
  }

  .sample-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sample-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #fff;
  }

  .sample-item:hover {
    background: #333;
    border-color: #c83a3a;
    transform: translateX(4px);
  }

  .sample-icon {
    font-size: 1.5rem;
  }

  .sample-name {
    font-size: 0.95rem;
  }

  .no-samples {
    color: #666;
    font-style: italic;
  }

  /* Active Sample Badge */
  .active-sample-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #2a4a2a;
    border: 1px solid #4a7a4a;
    border-radius: 6px;
    margin: 0.5rem;
    color: #fff;
    font-size: 0.9rem;
  }

  .change-sample-btn {
    padding: 0.4rem 0.8rem;
    background: #3a7bc8;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .change-sample-btn:hover {
    background: #4a8bd8;
  }
</style>
