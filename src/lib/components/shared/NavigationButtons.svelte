<script lang="ts">
  import { returnToSampleSelection, returnToInstrumentSelection, goToDiagnosis } from '../../stores/game-state';

  interface Props {
    primaryAction?: () => void;
    primaryLabel?: string;
    showDiagnosis?: boolean;
  }

  let { primaryAction, primaryLabel = 'Proceed to Diagnosis →', showDiagnosis = true }: Props = $props();

  function handlePrimaryAction() {
    if (primaryAction) {
      primaryAction();
    } else {
      goToDiagnosis();
    }
  }
</script>

<div class="action-buttons">
  <button class="secondary-button" onclick={returnToSampleSelection}>
    Change Sample
  </button>
  <button class="secondary-button" onclick={returnToInstrumentSelection}>
    Change Instrument
  </button>
  {#if showDiagnosis}
    <button class="primary-button" onclick={handlePrimaryAction}>
      {primaryLabel}
    </button>
  {/if}
</div>

<style>
  .action-buttons {
    margin-top: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-top: 2px solid #4a4a4a;
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
</style>
