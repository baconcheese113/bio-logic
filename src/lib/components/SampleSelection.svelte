<script lang="ts">
  import StageArea from './shared/StageArea.svelte';
  import { selectSample, currentCase, gameState } from '../stores/game-state';
  import { addSampleToInventory } from '../stores/inventory';
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

  function handleSelectSample(sampleType: SampleType) {
    // Add sample to inventory with case information
    const caseData = $currentCase;
    const caseIndex = $gameState.currentCaseIndex;
    addSampleToInventory(
      sampleType,
      caseData.id,
      caseData.title,
      caseIndex
    );
    
    // Continue with existing flow
    selectSample(sampleType);
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
</style>
