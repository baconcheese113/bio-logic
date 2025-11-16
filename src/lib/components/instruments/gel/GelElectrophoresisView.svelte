<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import GelElectrophoresis from '../pcr/GelElectrophoresis.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import { currentCase, gameState } from '../../../stores/game-state';
  import { inventory, gelResults, addGelResultToInventory } from '../../../stores/inventory';
  import { addDetectedGene, setEstimatedFragmentSize } from '../../../stores/evidence';
  import type { PrimerQuality } from '../../../../data/organisms';
  
  // Get the most recent gel result for this case or create a mock one for testing
  const mockPrimerQuality: PrimerQuality = {
    forwardTm: 60,
    reverseTm: 61,
    tmMatch: true,
    tmDifference: 1,
    forwardGC: 50,
    reverseGC: 52,
    gcContentGood: true,
    selfComplementarity: 2,
    selfCompGood: true,
    hasHairpins: false,
    productSize: 250,
    productSizeGood: true,
    overallQuality: 'excellent',
    canAmplify: true,
    expectedBandPattern: 'clean'
  };
  
  let gelStep = $state<1 | 2 | 3 | 4>(1);
  let gelIsRunning = $state(false);
  let resultSaved = $state(false);
  
  function loadGel() {
    gelStep = 2;
  }
  
  async function runGel() {
    gelIsRunning = true;
    gelStep = 2;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    gelIsRunning = false;
    gelStep = 3;
  }
  
  function viewUnderUV() {
    gelStep = 4;
  }
  
  function handleGelComplete(fragmentSize: number) {
    if (resultSaved) return;
    
    const caseData = $currentCase;
    const caseIndex = $gameState.currentCaseIndex;
    
    // Add result to inventory
    addGelResultToInventory(
      caseData.id,
      caseData.title,
      caseIndex,
      fragmentSize,
      { forwardStart: 0, forwardLength: 20, reverseStart: 230, reverseLength: 20 },
      caseData.pcrTarget?.geneId || 'unknown'
    );
    
    // Add to evidence
    setEstimatedFragmentSize(fragmentSize);
    if (caseData.pcrTarget?.geneId) {
      addDetectedGene(caseData.pcrTarget.geneId);
    }
    
    resultSaved = true;
  }
  
  function resetGel() {
    gelStep = 1;
    gelIsRunning = false;
    resultSaved = false;
  }
</script>

<StageArea showCaseHeader={true}>
  <div class="gel-container">
    <div class="header">
      <h2>DNA Gel Electrophoresis</h2>
      <p class="description">
        Separate and visualize DNA fragments by size using an electric field
      </p>
    </div>
    
    <div class="gel-viewport">
      <GelElectrophoresis 
        primerQuality={mockPrimerQuality}
        step={gelStep}
        isRunning={gelIsRunning}
        onComplete={handleGelComplete}
      />
    </div>
    
    <div class="controls">
      {#if gelStep === 1}
        <button class="control-button primary" onclick={loadGel}>
          Load Sample into Gel
        </button>
      {:else if gelStep === 2 && !gelIsRunning}
        <button class="control-button primary" onclick={runGel}>
          Run Electrophoresis
        </button>
      {:else if gelStep === 3}
        <button class="control-button primary" onclick={viewUnderUV}>
          View Under UV Light
        </button>
      {:else if gelStep === 4}
        <div class="result-info">
          <p>✓ Result saved to inventory</p>
          <button class="control-button" onclick={resetGel}>
            Run Another Gel
          </button>
        </div>
      {/if}
    </div>
    
    <NavigationButtons />
  </div>
</StageArea>

<style>
  .gel-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 2rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .header h2 {
    color: #e0e0e0;
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
  }
  
  .description {
    color: #a0a0a0;
    font-size: 1rem;
    margin: 0;
  }
  
  .gel-viewport {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 450px;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
  }
  
  .control-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
  }
  
  .control-button.primary {
    background: #4a7c59;
    border-color: #5a8c69;
  }
  
  .control-button.primary:hover {
    background: #5a8c69;
    border-color: #6a9c79;
  }
  
  .result-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .result-info p {
    color: #4a7c59;
    font-size: 1.2rem;
    margin: 0;
  }
</style>
