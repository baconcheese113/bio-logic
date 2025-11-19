<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import { isCorrectSample, correctOrganism } from '../../../stores/game-state';
  import { evidence, setCatalase, setCoagulase } from '../../../stores/evidence';
  import { currentActiveCase } from '../../../stores/active-cases';
  import { getSamplesForCase, type InventoryItem } from '../../../stores/inventory';
  import '../../../styles/instrument-controls.css';
  
  let showTestsSection = $state(true);
  let showObservationsSection = $state(true);
  let lastHoveredInfo = $state<string | null>(null);
  
  let catalasePerformed = $state(false);
  let catalaseAnimating = $state(false);
  let coagulasePerformed = $state(false);
  let coagulaseAnimating = $state(false);

  // Sample selection state
  let selectedSample = $state<InventoryItem | null>(null);

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

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }

  function performCatalaseTest() {
    catalaseAnimating = true;
    
    setTimeout(() => {
      catalasePerformed = true;
      catalaseAnimating = false;
    }, 1500);
  }

  function performCoagulaseTest() {
    coagulaseAnimating = true;
    
    setTimeout(() => {
      coagulasePerformed = true;
      coagulaseAnimating = false;
    }, 2000);
  }

  function resetTests() {
    catalasePerformed = false;
    catalaseAnimating = false;
    coagulasePerformed = false;
    coagulaseAnimating = false;
  }

  function getCatalaseResult(): boolean | null {
    if (!$isCorrectSample || !catalasePerformed) return null;
    return $correctOrganism?.culture?.catalase ?? null;
  }

  function getCoagulaseResult(): boolean | null {
    if (!$isCorrectSample || !coagulasePerformed) return null;
    return $correctOrganism?.culture?.coagulase ?? null;
  }
</script>

<div class="biochemical-view">
  <!-- Left: Stage Area with Test Visualizations -->
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <div class="tests-container">
        <!-- Catalase Test -->
        <div class="test-display">
          <h3>Catalase Test</h3>
          <div class="test-tube-container">
            <div class="test-slide">
              {#if catalasePerformed && getCatalaseResult() === true}
                <div class="bacteria-sample"></div>
                <div class="bubbles">
                  <div class="bubble" style="left: 45%; top: 60%; animation-delay: 0s;"></div>
                  <div class="bubble" style="left: 55%; top: 65%; animation-delay: 0.2s;"></div>
                  <div class="bubble" style="left: 50%; top: 70%; animation-delay: 0.4s;"></div>
                  <div class="bubble" style="left: 48%; top: 55%; animation-delay: 0.6s;"></div>
                  <div class="bubble" style="left: 52%; top: 58%; animation-delay: 0.8s;"></div>
                </div>
                <div class="reagent-drop catalase-reagent"></div>
              {:else if catalasePerformed && getCatalaseResult() === false}
                <div class="bacteria-sample"></div>
                <div class="reagent-drop catalase-reagent"></div>
                <p class="no-reaction">No bubbles</p>
              {:else if catalaseAnimating}
                <div class="bacteria-sample"></div>
                <div class="reagent-drop catalase-reagent animating"></div>
                <p class="processing">Adding H₂O₂...</p>
              {:else}
                <div class="bacteria-sample ready"></div>
                <p class="instruction">Add hydrogen peroxide</p>
              {/if}
            </div>
          </div>
          <p class="test-description">
            Add H₂O₂ to colonies. Positive = bubbles (O₂ production).
          </p>
        </div>

        <!-- Coagulase Test -->
        <div class="test-display">
          <h3>Coagulase Test</h3>
          <div class="test-tube-container">
            <div class="test-tube">
              {#if coagulasePerformed && getCoagulaseResult() === true}
                <div class="plasma-base"></div>
                <div class="clot">
                  <div class="clot-chunk" style="left: 40%; top: 50%;"></div>
                  <div class="clot-chunk" style="left: 55%; top: 45%;"></div>
                  <div class="clot-chunk" style="left: 48%; top: 60%;"></div>
                </div>
                <p class="positive-result">Clotted</p>
              {:else if coagulasePerformed && getCoagulaseResult() === false}
                <div class="plasma-base liquid"></div>
                <p class="negative-result">Liquid</p>
              {:else if coagulaseAnimating}
                <div class="plasma-base mixing"></div>
                <p class="processing">Incubating...</p>
              {:else}
                <div class="plasma-base"></div>
                <p class="instruction">Add bacterial colony</p>
              {/if}
            </div>
          </div>
          <p class="test-description">
            Mix bacteria with plasma. Positive = clotting (fibrin formation).
          </p>
        </div>
      </div>
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <!-- Right: Controls Panel -->
  <InstrumentRightPanel>
    <!-- Sample Selection or Active Sample -->
    {#if !selectedSample}
      <div class="sample-selection-prompt">
        <h3>Select Sample</h3>
        <p>Choose a sample to analyze:</p>
        {#if availableSamples.length > 0}
          <div class="sample-list">
            {#each availableSamples as sample}
              <button 
                class="sample-item"
                onclick={() => selectSample(sample)}
              >
                <span class="sample-icon">🧪</span>
                <span class="sample-name">{sample.type}</span>
              </button>
            {/each}
          </div>
        {:else}
          <p class="no-samples">No samples available. Collect a sample first.</p>
        {/if}
      </div>
    {:else}
      <!-- Active Sample Indicator -->
      <div class="active-sample-badge">
        <span>Using: {selectedSample.type}</span>
        <button class="change-sample-btn" onclick={changeSample}>Change Sample</button>
      </div>

      <!-- Tests Section -->
      <CollapsibleSection title="Biochemical Tests" bind:isOpen={showTestsSection}>
    <h3>Perform Tests</h3>
    
    <div class="test-buttons">
      <div class="test-button-group">
        <button 
          class="primary-button"
          onclick={performCatalaseTest}
          onmouseenter={() => setHoveredInfo('catalase')}
          disabled={catalasePerformed || catalaseAnimating}
        >
          {catalasePerformed ? 'Catalase Done ✓' : 'Run Catalase Test'}
        </button>
        {#if catalaseAnimating}
          <p class="status-text">Testing...</p>
        {/if}
      </div>

      <div class="test-button-group">
        <button 
          class="primary-button"
          onclick={performCoagulaseTest}
          onmouseenter={() => setHoveredInfo('coagulase')}
          disabled={coagulasePerformed || coagulaseAnimating}
        >
          {coagulasePerformed ? 'Coagulase Done ✓' : 'Run Coagulase Test'}
        </button>
        {#if coagulaseAnimating}
          <p class="status-text">Incubating...</p>
        {/if}
      </div>
    </div>

    {#if catalasePerformed || coagulasePerformed}
      <button class="secondary-button" onclick={resetTests}>
        Reset Tests
      </button>
    {/if}
  </CollapsibleSection>

  <!-- Observations Section -->
  {#if catalasePerformed || coagulasePerformed}
    <CollapsibleSection title="Record Observations" bind:isOpen={showObservationsSection}>
      {#if catalasePerformed}
        <h4>Catalase Result:</h4>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button" 
            class:active={$evidence.catalase === true}
            onclick={() => setCatalase(true)}
            onmouseenter={() => setHoveredInfo('catalase-positive')}
          >
            Positive (+)
          </button>
          <button 
            class="obs-button" 
            class:active={$evidence.catalase === false}
            onclick={() => setCatalase(false)}
            onmouseenter={() => setHoveredInfo('catalase-negative')}
          >
            Negative (−)
          </button>
        </div>
        <p class="info-hint">Bubbles = positive</p>
      {/if}

      {#if coagulasePerformed}
        <h4>Coagulase Result:</h4>
        <div class="obs-buttons-grid">
          <button 
            class="obs-button" 
            class:active={$evidence.coagulase === true}
            onclick={() => setCoagulase(true)}
            onmouseenter={() => setHoveredInfo('coagulase-positive')}
          >
            Positive (+)
          </button>
          <button 
            class="obs-button" 
            class:active={$evidence.coagulase === false}
            onclick={() => setCoagulase(false)}
            onmouseenter={() => setHoveredInfo('coagulase-negative')}
          >
            Negative (−)
          </button>
        </div>
        <p class="info-hint">Clotting = positive</p>
      {/if}
      </CollapsibleSection>
    {/if}
    {/if}
  </InstrumentRightPanel>
</div>

<style>
  .biochemical-view {
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

  .tests-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4rem;
    padding: 2rem;
  }

  .test-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .test-display h3 {
    color: #e0e0e0;
    font-size: 1.5rem;
    margin: 0;
  }

  .test-tube-container {
    width: 250px;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  /* Catalase Test - Slide */
  .test-slide {
    width: 200px;
    height: 120px;
    background: linear-gradient(135deg, #e8f4f8 0%, #d0e8f0 100%);
    border: 3px solid #90b4c0;
    border-radius: 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .bacteria-sample {
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, #f5e6d3 0%, #d4c4a8 100%);
    border-radius: 50%;
    position: absolute;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .bacteria-sample.ready {
    animation: pulse 2s ease-in-out infinite;
  }

  .reagent-drop {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    position: absolute;
    top: 30px;
    opacity: 0.8;
  }

  .catalase-reagent {
    background: radial-gradient(circle, #b8d8e8 0%, #7ab8d8 100%);
  }

  .catalase-reagent.animating {
    animation: dropAndSpread 1.5s ease-out forwards;
  }

  .bubbles {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .bubble {
    width: 12px;
    height: 12px;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(200, 230, 255, 0.4));
    border-radius: 50%;
    position: absolute;
    animation: rise 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  }

  /* Coagulase Test - Test Tube */
  .test-tube {
    width: 80px;
    height: 200px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border: 3px solid #90b4c0;
    border-radius: 0 0 20px 20px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .plasma-base {
    width: 100%;
    height: 70%;
    background: linear-gradient(to bottom, #fff4e6 0%, #ffe6cc 100%);
    position: absolute;
    bottom: 0;
  }

  .plasma-base.liquid {
    animation: slosh 2s ease-in-out infinite;
  }

  .plasma-base.mixing {
    animation: swirl 2s linear infinite;
  }

  .clot {
    position: absolute;
    width: 100%;
    height: 70%;
    bottom: 0;
  }

  .clot-chunk {
    width: 30px;
    height: 25px;
    background: linear-gradient(135deg, #cc9966 0%, #aa7744 100%);
    border-radius: 40% 60% 50% 50%;
    position: absolute;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: settle 1s ease-out forwards;
  }

  .test-description {
    color: #b0b0b0;
    font-size: 0.9rem;
    text-align: center;
    max-width: 250px;
    margin: 0;
  }

  .instruction, .processing, .no-reaction, .positive-result, .negative-result {
    position: absolute;
    bottom: 10px;
    font-size: 0.9rem;
    font-weight: bold;
    margin: 0;
  }

  .instruction {
    color: #7ab8d8;
  }

  .processing {
    color: #f0c040;
    animation: pulse 1s ease-in-out infinite;
  }

  .no-reaction, .negative-result {
    color: #b0b0b0;
  }

  .positive-result {
    color: #90d890;
  }

  .test-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .test-button-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .primary-button, .secondary-button {
    padding: 0.75rem 1rem;
    border: 2px solid #6b8e9f;
    background: linear-gradient(to bottom, #4a6a7a 0%, #3a5a6a 100%);
    color: #e0e0e0;
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    font-family: 'Georgia', serif;
  }

  .primary-button:hover:not(:disabled) {
    background: linear-gradient(to bottom, #5a7a8a 0%, #4a6a7a 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .secondary-button {
    background: linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 100%);
    border-color: #5a5a5a;
  }

  .secondary-button:hover {
    background: linear-gradient(to bottom, #4a4a4a 0%, #3a3a3a 100%);
    transform: translateY(-1px);
  }

  .status-text {
    color: #f0c040;
    font-size: 0.85rem;
    margin: 0;
    text-align: center;
  }

  /* Animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes dropAndSpread {
    0% {
      transform: translateY(-100px) scale(1);
      opacity: 0;
    }
    50% {
      transform: translateY(0) scale(1);
      opacity: 0.8;
    }
    100% {
      transform: translateY(0) scale(2);
      opacity: 0.3;
    }
  }

  @keyframes rise {
    0% {
      transform: translateY(0) scale(1);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-60px) scale(0.5);
      opacity: 0;
    }
  }

  @keyframes settle {
    0% {
      transform: translateY(-20px) rotate(0deg);
      opacity: 0;
    }
    100% {
      transform: translateY(0) rotate(5deg);
      opacity: 1;
    }
  }

  @keyframes slosh {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(2deg); }
    75% { transform: rotate(-2deg); }
  }

  @keyframes swirl {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
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
    border-color: #3a7bc8;
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
