<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import AgglutinationSlide from './AgglutinationSlide.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import { evidence, setBloodType, setRhFactor, setSyphilisAntibodies, setDiphtheriaAntitoxin } from '../../../stores/evidence';
  import { currentCase } from '../../../stores/game-state';

  let currentTest = $state<'anti-a' | 'anti-b' | 'anti-d' | 'syphilis' | 'diphtheria' | null>(null);
  let testResult = $state<'positive' | 'negative'>('negative');
  let lastHoveredInfo = $state<string | null>(null);

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

    <NavigationButtons />
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
</style>
