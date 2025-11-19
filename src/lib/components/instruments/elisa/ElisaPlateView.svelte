<script lang="ts">
  import { onMount } from 'svelte';
  import StageArea from '../../shared/StageArea.svelte';
  import HoverInfoPanel from '../../shared/HoverInfoPanel.svelte';
  import InstrumentRightPanel from '../../shared/InstrumentRightPanel.svelte';
  import CollapsibleSection from '../../shared/CollapsibleSection.svelte';
  import ElisaPlate from './ElisaPlate.svelte';
  import { instrumentState, initializeElisaPlate, setElisaStep, updateElisaWell } from '../../../stores/instrument-state';
  import { gameState } from '../../../stores/game-state';
  import type { ElisaStep } from '../../../../data/organisms';

  let lastHoveredInfo = $state<string | null>(null);
  let isAnimating = $state(false);
  let washingStep = $state(false);

  // Initialize plate on mount if not already prepared
  onMount(() => {
    if (!$instrumentState.elisa.platePrepared) {
      initializeElisaPlate();
      setElisaStep('coating');
    }
  });

  // Sequential step order
  const steps: ElisaStep[] = ['coating', 'blocking', 'sample', 'enzyme', 'substrate'];
  
  // Track which steps have been completed
  const stepCompleted = $derived(() => {
    const wells = $instrumentState.elisa.wells;
    if (wells.length === 0) return { coating: false, blocking: false, sample: false, enzyme: false, substrate: false };
    
    return {
      coating: wells.every(w => w.coated),
      blocking: wells.every(w => w.blocked),
      sample: wells.every(w => w.sampleAdded),
      enzyme: wells.every(w => w.enzymeAdded),
      substrate: wells.every(w => w.substrateAdded),
    };
  });

  // Check if a step can be performed (sequential - previous steps must be complete)
  function canPerformStep(step: ElisaStep): boolean {
    const stepIndex = steps.indexOf(step);
    if (stepIndex === 0) return true; // First step always available
    
    // Check if previous step is completed
    const prevStep = steps[stepIndex - 1];
    const completed = stepCompleted();
    return prevStep in completed ? completed[prevStep as keyof typeof completed] : false;
  }

  async function performStep(step: ElisaStep) {
    if (isAnimating || !canPerformStep(step)) return;
    
    setElisaStep(step);
    isAnimating = true;
    
    const wells = $instrumentState.elisa.wells;
    
    // Perform the step with animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
    
    // Show washing animation between steps (except for coating and substrate)
    if (step !== 'coating' && step !== 'substrate') {
      washingStep = true;
      await new Promise(resolve => setTimeout(resolve, 1200));
      washingStep = false;
    }
    
    isAnimating = false;
    
    // Auto-advance to next step if not the last
    const nextStepIndex = steps.indexOf(step) + 1;
    if (nextStepIndex < steps.length) {
      setElisaStep(steps[nextStepIndex]);
    }
  }

  function goToPlateReader() {
    gameState.update(state => ({
      ...state,
      gamePhase: 'plate-reader',
      lastInstrumentPhase: 'plate-reader',
    }));
  }

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }

  const canReadPlate = $derived(
    $instrumentState.elisa.wells.length > 0 && 
    $instrumentState.elisa.wells.every(w => w.substrateAdded)
  );
</script>

<div class="elisa-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <div class="plate-area">
        <ElisaPlate />
        {#if washingStep}
          <div class="washing-overlay">
            <div class="washing-effect">
              <div class="water-stream"></div>
              <div class="water-stream" style="left: 30%; animation-delay: 0.2s;"></div>
              <div class="water-stream" style="left: 50%; animation-delay: 0.4s;"></div>
              <div class="water-stream" style="left: 70%; animation-delay: 0.1s;"></div>
              <p class="washing-text">Washing plate...</p>
            </div>
          </div>
        {/if}
      </div>
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel tabConfig="controls-inventory" showDiagnosis={false}>
    <CollapsibleSection title="ELISA Protocol (1971)" isOpen={true}>
      <div class="protocol-info">
        <p class="vintage-text">Engvall & Perlmann Method</p>
        <p class="step-description">
          Enzyme-Linked Immunosorbent Assay for antibody detection
        </p>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Procedure Steps" isOpen={true}>
      <div class="sequential-steps">
        <button 
          class="action-button"
          class:completed={stepCompleted().coating}
          class:active={$instrumentState.elisa.currentStep === 'coating' && !stepCompleted().coating}
          disabled={!canPerformStep('coating') || stepCompleted().coating || isAnimating}
          onclick={() => performStep('coating')}
          onmouseenter={() => setHoveredInfo('coating-step')}
        >
          <span class="step-number">1</span>
          <span class="step-text">Coat Wells</span>
          {#if stepCompleted().coating}
            <span class="checkmark">✓</span>
          {/if}
        </button>

        <button 
          class="action-button"
          class:completed={stepCompleted().blocking}
          class:active={$instrumentState.elisa.currentStep === 'blocking' && !stepCompleted().blocking}
          disabled={!canPerformStep('blocking') || stepCompleted().blocking || isAnimating}
          onclick={() => performStep('blocking')}
          onmouseenter={() => setHoveredInfo('blocking-step')}
        >
          <span class="step-number">2</span>
          <span class="step-text">Block Wells</span>
          {#if stepCompleted().blocking}
            <span class="checkmark">✓</span>
          {/if}
        </button>

        <button 
          class="action-button"
          class:completed={stepCompleted().sample}
          class:active={$instrumentState.elisa.currentStep === 'sample' && !stepCompleted().sample}
          disabled={!canPerformStep('sample') || stepCompleted().sample || isAnimating}
          onclick={() => performStep('sample')}
          onmouseenter={() => setHoveredInfo('sample-step')}
        >
          <span class="step-number">3</span>
          <span class="step-text">Add Sample</span>
          {#if stepCompleted().sample}
            <span class="checkmark">✓</span>
          {/if}
        </button>

        <button 
          class="action-button"
          class:completed={stepCompleted().enzyme}
          class:active={$instrumentState.elisa.currentStep === 'enzyme' && !stepCompleted().enzyme}
          disabled={!canPerformStep('enzyme') || stepCompleted().enzyme || isAnimating}
          onclick={() => performStep('enzyme')}
          onmouseenter={() => setHoveredInfo('enzyme-step')}
        >
          <span class="step-number">4</span>
          <span class="step-text">Add Enzyme</span>
          {#if stepCompleted().enzyme}
            <span class="checkmark">✓</span>
          {/if}
        </button>

        <button 
          class="action-button"
          class:completed={stepCompleted().substrate}
          class:active={$instrumentState.elisa.currentStep === 'substrate' && !stepCompleted().substrate}
          disabled={!canPerformStep('substrate') || stepCompleted().substrate || isAnimating}
          onclick={() => performStep('substrate')}
          onmouseenter={() => setHoveredInfo('substrate-step')}
        >
          <span class="step-number">5</span>
          <span class="step-text">Add Substrate</span>
          {#if stepCompleted().substrate}
            <span class="checkmark">✓</span>
          {/if}
        </button>
      </div>

      {#if isAnimating}
        <div class="status-message animating">
          Performing step...
        </div>
      {/if}
    </CollapsibleSection>

    <CollapsibleSection title="Plate Reader" isOpen={true}>
      <div class="reader-section">
        <p class="info-text">
          {#if canReadPlate}
            ✓ Color development complete. Transfer plate to spectrophotometer.
          {:else}
            Complete all steps to proceed to plate reader.
          {/if}
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
  </InstrumentRightPanel>
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

  .plate-area {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .washing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(100, 150, 200, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .washing-effect {
    position: relative;
    width: 80%;
    height: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .water-stream {
    position: absolute;
    top: 0;
    left: 20%;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, rgba(150, 200, 255, 0.8), rgba(150, 200, 255, 0));
    animation: waterFlow 0.8s ease-in-out infinite;
  }

  @keyframes waterFlow {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(100%);
      opacity: 0;
    }
  }

  .washing-text {
    color: #fff;
    font-size: 1.5rem;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    z-index: 11;
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

  .sequential-steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.8rem;
    border-radius: 6px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
    position: relative;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button:not(:disabled):hover {
    background: #4a4a4a;
    transform: translateX(4px);
  }

  .action-button.active {
    background: #4a7c59;
    border-color: #5a8c69;
    box-shadow: 0 0 12px rgba(74, 124, 89, 0.4);
  }

  .action-button.completed {
    background: #3a5a4a;
    border-color: #4a6a5a;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    font-weight: bold;
    flex-shrink: 0;
  }

  .action-button.completed .step-number {
    background: rgba(100, 200, 100, 0.3);
  }

  .step-text {
    flex: 1;
    text-align: left;
  }

  .checkmark {
    color: #6ad76a;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .status-message {
    text-align: center;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .status-message.animating {
    background: rgba(74, 124, 89, 0.2);
    color: #6ad76a;
    border: 1px solid rgba(74, 124, 89, 0.4);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
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
    transform: scale(1.02);
  }

  .reader-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
