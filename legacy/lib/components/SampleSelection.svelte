<script lang="ts">
  import StageArea from './shared/StageArea.svelte';
  import { selectSample } from '../stores/game-state';
  import { currentActiveCase } from '../stores/active-cases';
  import { addSample, replaceSample } from '../stores/inventory';
  import type { SampleType } from '../../data/organisms';

  const sampleTypes: { type: SampleType; label: string }[] = [
    { type: 'blood', label: 'Blood Culture' },
    { type: 'sputum', label: 'Sputum Sample' },
    { type: 'throat-swab', label: 'Throat Swab' },
    { type: 'stool', label: 'Stool Sample' },
    { type: 'wound', label: 'Wound Swab' },
    { type: 'csf', label: 'Cerebrospinal Fluid' },
    { type: 'urine', label: 'Urine Sample' },
    { type: 'tissue', label: 'Tissue Biopsy' },
  ];
  
  let showReplaceDialog = $state(false);
  let pendingSampleType = $state<SampleType | null>(null);

  function handleSelectSample(sampleType: SampleType) {
    if (!$currentActiveCase) {
      console.error('No active case');
      return;
    }
    
    // Try to add sample to inventory
    const added = addSample($currentActiveCase.caseId, sampleType);
    
    if (!added) {
      // Sample already exists, show confirmation dialog
      pendingSampleType = sampleType;
      showReplaceDialog = true;
    } else {
      // Sample added successfully, proceed to instrument selection
      selectSample(sampleType);
    }
  }
  
  function confirmReplace() {
    if (!$currentActiveCase || !pendingSampleType) return;
    
    replaceSample($currentActiveCase.caseId, pendingSampleType);
    selectSample(pendingSampleType);
    showReplaceDialog = false;
    pendingSampleType = null;
  }
  
  function cancelReplace() {
    showReplaceDialog = false;
    pendingSampleType = null;
  }
</script>

<StageArea showCaseHeader={true}>
  <div class="sample-selection">
    <div class="content">
      <h2>Select Sample Type</h2>
      <p class="instructions">
        Choose which type of sample you would like to examine under the microscope.
      </p>
      <div class="sample-grid">
        {#each sampleTypes as { type, label }}
          <button class="sample-button" onclick={() => handleSelectSample(type)}>
            {label}
          </button>
        {/each}
      </div>
    </div>
  </div>
  
  {#if showReplaceDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={cancelReplace}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="modal-dialog" onclick={(e) => e.stopPropagation()}>
        <h3>Replace Existing Sample?</h3>
        <p>
          A sample of this type already exists in your inventory for this case.
          Do you want to replace it with a new sample?
        </p>
        <div class="modal-buttons">
          <button class="btn-cancel" onclick={cancelReplace}>Cancel</button>
          <button class="btn-confirm" onclick={confirmReplace}>Replace</button>
        </div>
      </div>
    </div>
  {/if}
</StageArea>

<style>
  .sample-selection {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .content {
    max-width: 900px;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 3rem;
  }

  h2 {
    font-size: 2rem;
    margin: 0 0 1rem 0;
    color: #e0e0e0;
  }

  .instructions {
    font-size: 1.1rem;
    color: #a0a0a0;
    margin-bottom: 2rem;
  }

  .sample-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .sample-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 1.5rem 1rem;
    font-size: 1.1rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .sample-button:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .modal-dialog {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 2rem;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  
  .modal-dialog h3 {
    margin: 0 0 1rem 0;
    color: #e0e0e0;
    font-size: 1.3rem;
  }
  
  .modal-dialog p {
    margin: 0 0 1.5rem 0;
    color: #b0b0b0;
    line-height: 1.6;
  }
  
  .modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  .btn-cancel, .btn-confirm {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-cancel {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
  }
  
  .btn-cancel:hover {
    background: #4a4a4a;
  }
  
  .btn-confirm {
    background: #4a7c59;
    color: white;
    border: 2px solid #5a8c69;
  }
  
  .btn-confirm:hover {
    background: #5a8c69;
  }
</style>
