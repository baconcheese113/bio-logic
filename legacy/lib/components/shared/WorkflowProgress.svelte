<script lang="ts">
  import { 
    activeProcesses, 
    getProcessProgress, 
    isStepDone,
    advanceStep,
    getCurrentStep,
    getWorkflow,
    ticksToDisplay 
  } from '../../../game';
  
  interface Props {
    instrumentId: string;
    showStepList?: boolean;
  }
  
  let { instrumentId, showStepList = false }: Props = $props();
  
  // Get current process for this instrument
  let process = $derived(activeProcesses.current(instrumentId));
  let currentStep = $derived(process ? getCurrentStep(process.id) : null);
  let progress = $derived(process ? getProcessProgress(process.id) : 0);
  let stepDone = $derived(process ? isStepDone(process.id) : false);
  let workflow = $derived(getWorkflow(instrumentId));
  
  // Find current step index in workflow
  let currentStepIndex = $derived(() => {
    if (!workflow || !currentStep) return -1;
    return workflow.steps.findIndex(s => s.id === currentStep.stepId);
  });
  
  function handleAdvance() {
    if (process && stepDone) {
      advanceStep(process.id);
    }
  }
</script>

{#if process}
  <div class="workflow-progress">
    <!-- Current Step -->
    <div class="current-step">
      <span class="step-label">{currentStep?.stepName || 'Processing'}</span>
      {#if process.duration > 0}
        <span class="time-remaining">{ticksToDisplay(process.duration - Math.floor(progress * process.duration / 100))}</span>
      {/if}
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-bar-container">
      <div 
        class="progress-bar" 
        class:complete={stepDone}
        style="width: {progress}%"
      ></div>
    </div>
    
    <!-- Step indicator -->
    {#if stepDone && !process.completed}
      <button class="advance-button" onclick={handleAdvance}>
        Continue →
      </button>
    {:else if stepDone}
      <span class="step-status">✓ Complete</span>
    {:else}
      <span class="step-status">In progress...</span>
    {/if}
    
    <!-- Optional step list -->
    {#if showStepList && workflow}
      <div class="step-list">
        {#each workflow.steps as step, i}
          {@const isCurrent = step.id === currentStep?.stepId}
          {@const isPast = i < currentStepIndex()}
          <div 
            class="step-item" 
            class:current={isCurrent}
            class:past={isPast}
          >
            <span class="step-dot">{isPast ? '✓' : i + 1}</span>
            <span class="step-name">{step.name}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .workflow-progress {
    background: #2a2a2a;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .current-step {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .step-label {
    font-weight: 600;
    color: #e0e0e0;
    font-size: 0.9rem;
  }
  
  .time-remaining {
    color: #ffd700;
    font-size: 0.85rem;
    font-family: monospace;
  }
  
  .progress-bar-container {
    width: 100%;
    height: 8px;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4a7c8c, #6a9fb5);
    transition: width 0.1s linear;
  }
  
  .progress-bar.complete {
    background: linear-gradient(90deg, #4a8c5c, #6ab575);
  }
  
  .step-status {
    display: block;
    text-align: center;
    font-size: 0.8rem;
    color: #888;
  }
  
  .advance-button {
    display: block;
    width: 100%;
    padding: 0.5rem;
    background: #4a8c5c;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .advance-button:hover {
    background: #5a9c6c;
  }
  
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #3a3a3a;
  }
  
  .step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    color: #666;
    font-size: 0.8rem;
  }
  
  .step-item.current {
    color: #6a9fb5;
    font-weight: 600;
  }
  
  .step-item.past {
    color: #4a8c5c;
  }
  
  .step-dot {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #3a3a3a;
    font-size: 0.7rem;
  }
  
  .step-item.current .step-dot {
    background: #4a7c8c;
    color: white;
  }
  
  .step-item.past .step-dot {
    background: #4a8c5c;
    color: white;
  }
  
  .step-name {
    flex: 1;
  }
</style>
