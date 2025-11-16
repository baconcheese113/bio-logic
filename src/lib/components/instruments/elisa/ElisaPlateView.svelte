<script lang="ts">
  import StageArea from '../../shared/StageArea.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import NavigationButtons from '../../shared/NavigationButtons.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import ElisaPlate from './ElisaPlate.svelte';
  import { instrumentState, initializeElisaPlate, setElisaStep, updateElisaWell } from '../../../stores/instrument-state';
  import { gameState } from '../../../stores/game-state';
  import type { ElisaStep } from '../../../../data/organisms';

  let lastHoveredInfo = $state<string | null>(null);

  // Initialize plate on mount if not already prepared
  $effect(() => {
    if (!$instrumentState.elisa.platePrepared) {
      initializeElisaPlate();
    }
  });

  function handleStepChange(step: ElisaStep) {
    setElisaStep(step);
  }

  function performCurrentStep() {
    const step = $instrumentState.elisa.currentStep;
    const wells = $instrumentState.elisa.wells;
    
    // Apply the current step to all wells
    wells.forEach((well, index) => {
      switch (step) {
        case 'coating':
          updateElisaWell(index, { coated: true });
          break;
        case 'blocking':
          if (well.coated) {
            updateElisaWell(index, { blocked: true });
          }
          break;
        case 'sample':
          if (well.coated && well.blocked) {
            updateElisaWell(index, { sampleAdded: true });
          }
          break;
        case 'enzyme':
          if (well.sampleAdded) {
            updateElisaWell(index, { enzymeAdded: true });
          }
          break;
        case 'substrate':
          if (well.enzymeAdded) {
            updateElisaWell(index, { substrateAdded: true });
          }
          break;
      }
    });
  }

  function goToPlateReader() {
    // Navigate to plate reader phase
    gameState.update(state => ({
      ...state,
      gamePhase: 'plate-reader',
      lastInstrumentPhase: 'plate-reader',
    }));
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }

  // Check if current step is complete
  const isStepComplete = $derived(() => {
    const step = $instrumentState.elisa.currentStep;
    const wells = $instrumentState.elisa.wells;
    
    if (wells.length === 0) return false;
    
    switch (step) {
      case 'coating':
        return wells.every(w => w.coated);
      case 'blocking':
        return wells.every(w => w.blocked);
      case 'sample':
        return wells.every(w => w.sampleAdded);
      case 'enzyme':
        return wells.every(w => w.enzymeAdded);
      case 'substrate':
        return wells.every(w => w.substrateAdded);
      default:
        return false;
    }
  });

  const canReadPlate = $derived(
    $instrumentState.elisa.wells.length > 0 && 
    $instrumentState.elisa.wells.every(w => w.substrateAdded)
  );
</script>

<div class="elisa-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <ElisaPlate />
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <div class="controls-panel">
    <CollapsibleSection title="ELISA Protocol (1971)" isOpen={true}>
      <div class="protocol-info">
        <p class="vintage-text">Engvall & Perlmann Method</p>
        <p class="step-description">
          Enzyme-Linked Immunosorbent Assay for antibody detection
        </p>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Procedure Steps" isOpen={true}>
      <div class="step-buttons">
        <button 
          class="step-button"
          class:active={$instrumentState.elisa.currentStep === 'coating'}
          class:complete={isStepComplete() && $instrumentState.elisa.currentStep === 'coating'}
          onclick={() => handleStepChange('coating')}
          onmouseenter={() => setHoveredInfo('coating-step')}
        >
          1. Coat Wells
        </button>
        <button 
          class="step-button"
          class:active={$instrumentState.elisa.currentStep === 'blocking'}
          class:complete={isStepComplete() && $instrumentState.elisa.currentStep === 'blocking'}
          onclick={() => handleStepChange('blocking')}
          onmouseenter={() => setHoveredInfo('blocking-step')}
        >
          2. Block Wells
        </button>
        <button 
          class="step-button"
          class:active={$instrumentState.elisa.currentStep === 'sample'}
          class:complete={isStepComplete() && $instrumentState.elisa.currentStep === 'sample'}
          onclick={() => handleStepChange('sample')}
          onmouseenter={() => setHoveredInfo('sample-step')}
        >
          3. Add Sample
        </button>
        <button 
          class="step-button"
          class:active={$instrumentState.elisa.currentStep === 'enzyme'}
          class:complete={isStepComplete() && $instrumentState.elisa.currentStep === 'enzyme'}
          onclick={() => handleStepChange('enzyme')}
          onmouseenter={() => setHoveredInfo('enzyme-step')}
        >
          4. Add Enzyme
        </button>
        <button 
          class="step-button"
          class:active={$instrumentState.elisa.currentStep === 'substrate'}
          class:complete={isStepComplete() && $instrumentState.elisa.currentStep === 'substrate'}
          onclick={() => handleStepChange('substrate')}
          onmouseenter={() => setHoveredInfo('substrate-step')}
        >
          5. Add Substrate
        </button>
      </div>

      <button 
        class="perform-button"
        onclick={() => performCurrentStep()}
        onmouseenter={() => setHoveredInfo('elisa-overview')}
      >
        Perform Step: {$instrumentState.elisa.currentStep}
      </button>
    </CollapsibleSection>

    <CollapsibleSection title="Plate Reader" isOpen={true}>
      <div class="reader-section">
        <p class="info-text">
          Color development complete. Transfer plate to spectrophotometer.
        </p>
        <button 
          class="reader-button"
          disabled={!canReadPlate}
          onclick={() => goToPlateReader()}
          onmouseenter={() => setHoveredInfo('plate-reader')}
        >
          → Use Plate Reader
        </button>
      </div>
    </CollapsibleSection>

    <NavigationButtons />
  </div>
</div>

<style>
  .elisa-view {
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

  .protocol-info {
    padding: 0.5rem 0;
  }

  .vintage-text {
    color: #8a9fb5;
    font-style: italic;
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
  }

  .step-description {
    color: #b0b0b0;
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .step-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .step-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: all 0.2s;
    text-align: left;
  }

  .step-button:hover {
    background: #4a4a4a;
  }

  .step-button.active {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .step-button.complete {
    background: #3a5a4a;
    border-color: #4a6a5a;
  }

  .perform-button {
    background: #5a6a7a;
    color: #fff;
    border: 2px solid #6a7a8a;
    padding: 0.7rem;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    font-weight: bold;
    transition: all 0.2s;
  }

  .perform-button:hover {
    background: #6a7a8a;
  }

  .reader-section {
    padding: 0.5rem 0;
  }

  .info-text {
    color: #b0b0b0;
    margin: 0 0 0.75rem 0;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .reader-button {
    background: #6a5a9f;
    color: #fff;
    border: 2px solid #7a6aaf;
    padding: 0.7rem;
    border-radius: 4px;
    font-size: 0.9rem;
    width: 100%;
    font-weight: bold;
    transition: all 0.2s;
  }

  .reader-button:hover:not(:disabled) {
    background: #7a6aaf;
  }

  .reader-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
