<script lang="ts">
  import {
    instrumentState,
    clearSampleFromInstrument,
    type InstrumentType,
  } from "../../stores/instrument-state";
  import { inventory } from "../../stores/inventory";
  import {
    getInstrumentProcess,
    isProcessComplete,
    getProcessProgress,
    cancelProcess,
  } from "../../stores/timer-service";

  interface Props {
    instrument: InstrumentType;
    onClear?: () => void; // Optional callback for additional cleanup
  }

  let { instrument, onClear }: Props = $props();

  let loadedSampleId = $derived($instrumentState.activeSamples[instrument]);
  
  // Check timer-service for active process
  const activeProcess = $derived(getInstrumentProcess(instrument));
  const isProcessing = $derived(activeProcess && !isProcessComplete(activeProcess));
  const progress = $derived(activeProcess ? getProcessProgress(activeProcess) : 0);

  let loadedSample = $derived(() => {
    if (!loadedSampleId) return null;
    return $inventory.items.find((s) => s.id === loadedSampleId) || null;
  });

  function handleClear() {
    if (isProcessing && activeProcess) {
      // Cancel process and clear sample
      cancelProcess(activeProcess.id);
    }
    clearSampleFromInstrument(instrument);
    onClear?.();
  }
</script>

{#if loadedSample()}
  <div class="sample-badge">
    <div class="badge-header">
      <span class="badge-label">Loaded Sample</span>
    </div>
    <div class="badge-content">
      <span class="sample-icon">🧪</span>
      <div class="sample-info">
        <span class="sample-name">{loadedSample()?.displayName}</span>
        {#if isProcessing && activeProcess}
          <span class="sample-status">
            {activeProcess.processName} ({progress}%)
          </span>
        {/if}
      </div>
      <button
        class="clear-button"
        class:cancel-mode={isProcessing}
        onclick={handleClear}
      >
        {isProcessing ? "⚠️ Cancel" : "Clear"}
      </button>
    </div>
  </div>
{/if}

<style>
  .sample-badge {
    background: #1a2a1a;
    border: 2px solid #4a7a4a;
    border-radius: 6px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .badge-header {
    background: #2a3a2a;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #3a5a3a;
  }

  .badge-label {
    font-size: 0.75rem;
    color: #8ab98a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .badge-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .sample-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .sample-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .sample-name {
    font-size: 0.95rem;
    color: #8ab98a;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sample-status {
    font-size: 0.8rem;
    color: #6a9a6a;
  }

  .clear-button {
    padding: 0.4rem 0.75rem;
    background: #3a3a3a;
    border: 1px solid #5a5a5a;
    color: #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .clear-button:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
  }

  .clear-button.cancel-mode {
    background: #3a1a1a;
    border-color: #7a4a4a;
    color: #f88;
  }

  .clear-button.cancel-mode:hover {
    background: #4a2a2a;
    border-color: #9a6a6a;
  }
</style>
