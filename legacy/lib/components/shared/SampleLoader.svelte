<script lang="ts">
  import { currentActiveCase } from '../../stores/active-cases';
  import { inventory, type InventoryItem } from '../../stores/inventory';
  import { loadSampleIntoInstrument, clearSampleFromInstrument, instrumentState, type InstrumentType } from '../../stores/instrument-state';
  
  interface Props {
    instrument: InstrumentType;
    onSampleLoaded?: (sample: InventoryItem) => void;
  }
  
  let { instrument, onSampleLoaded }: Props = $props();
  
  // FIX: Access inventory store reactively, not via getSamplesForCase which uses get()
  let availableSamples = $derived(
    $currentActiveCase 
      ? $inventory.items.filter(item => item.caseId === $currentActiveCase.caseId && item.type === 'sample')
      : []
  );
  
  let loadedSampleId = $derived($instrumentState.activeSamples[instrument]);
  
  let loadedSample = $derived(() => {
    if (!loadedSampleId) return null;
    return availableSamples.find(s => s.id === loadedSampleId) || null;
  });
  
  function loadSample(sample: InventoryItem) {
    loadSampleIntoInstrument(instrument, sample.id);
    onSampleLoaded?.(sample);
  }
  
  function changeSample() {
    clearSampleFromInstrument(instrument);
  }
</script>

{#if loadedSample()}
  <div class="sample-loaded-badge">
    <div class="badge-content">
      <span class="sample-icon">🧪</span>
      <div class="sample-info">
        <span class="sample-label">Active Sample:</span>
        <span class="sample-name">{loadedSample()?.displayName}</span>
      </div>
      <button class="change-button" onclick={changeSample}>
        Change Sample
      </button>
    </div>
  </div>
{:else}
  <div class="sample-loader">
    <div class="loader-content">
      {#if availableSamples.length === 0}
        <div class="no-samples">
          <span class="icon">📭</span>
          <h3>No Samples Available</h3>
          <p>Collect a sample from the Sample Selection screen first.</p>
          <p class="hint">Samples added to inventory can be used unlimited times across all instruments.</p>
        </div>
      {:else}
        <div class="sample-selection">
          <h3>Load Sample Into Instrument</h3>
          <p class="instructions">Select a sample from your inventory to analyze:</p>
          <div class="sample-grid">
            {#each availableSamples as sample}
              <button 
                class="sample-button" 
                onclick={() => loadSample(sample)}
              >
                <span class="sample-icon-large">🧪</span>
                <span class="sample-name-large">{sample.displayName}</span>
                {#if sample.activeProcesses && sample.activeProcesses.length > 0}
                  <span class="sample-status processing">
                    ⏳ {sample.activeProcesses[0].processName} ({sample.activeProcesses[0].progress}%)
                  </span>
                {:else}
                  <span class="sample-status available">✓ Available</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sample-loaded-badge {
    background: #1a2a1a;
    border: 2px solid #4a7a4a;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .badge-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sample-icon {
    font-size: 2rem;
  }

  .sample-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sample-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sample-name {
    font-size: 1rem;
    color: #8ab98a;
    font-weight: 600;
  }

  .change-button {
    padding: 0.5rem 1rem;
    background: #3a3a3a;
    border: 1px solid #5a5a5a;
    color: #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .change-button:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
  }

  .sample-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: #0a0a0a;
    border: 2px dashed #3a3a3a;
    border-radius: 8px;
    padding: 2rem;
  }

  .loader-content {
    max-width: 600px;
    text-align: center;
  }

  .no-samples {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .no-samples .icon {
    font-size: 4rem;
    opacity: 0.5;
  }

  .no-samples h3 {
    font-size: 1.5rem;
    color: #ccc;
    margin: 0;
  }

  .no-samples p {
    color: #888;
    margin: 0.25rem 0;
    line-height: 1.6;
  }

  .no-samples .hint {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  }

  .sample-selection h3 {
    font-size: 1.5rem;
    color: #ccc;
    margin: 0 0 0.5rem 0;
  }

  .instructions {
    color: #888;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .sample-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .sample-button {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 1.5rem 1rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.2s;
  }

  .sample-button:hover {
    background: #3a3a3a;
    border-color: #6a9fb5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(106, 159, 181, 0.2);
  }

  .sample-icon-large {
    font-size: 2.5rem;
  }

  .sample-name-large {
    font-size: 1rem;
    color: #ccc;
    font-weight: 600;
  }

  .sample-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-weight: 500;
  }

  .sample-status.available {
    background: #1a3a1a;
    color: #6ab96a;
    border: 1px solid #3a5a3a;
  }

  .sample-status.processing {
    background: #3a3a1a;
    color: #b9b96a;
    border: 1px solid #5a5a3a;
  }
</style>
