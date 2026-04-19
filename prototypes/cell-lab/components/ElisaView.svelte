<script lang="ts">
  import type { ElisaDesignData } from '../lib/lab-types';

  interface Props {
    design: ElisaDesignData;
    dragActive: boolean;
    loadedSample: string | null;
    ontest: (sample: string, antibody: string) => void;
    oneject: () => void;
  }

  let { design, dragActive, loadedSample, ontest, oneject }: Props = $props();

  let selectedAntibody = $state('');
  let testsUsed = $state(0);
  let resultLog = $state<Array<{ sample: string; antibody: string; positive: boolean }>>([]);

  const testsRemaining = $derived(design.wellBudget - testsUsed);

  function runTest() {
    if (!loadedSample || !selectedAntibody || testsRemaining <= 0) return;
    const positive = design.truthMap[loadedSample] === selectedAntibody;
    resultLog = [...resultLog, { sample: loadedSample, antibody: selectedAntibody, positive }];
    testsUsed++;
    ontest(loadedSample, selectedAntibody);
    selectedAntibody = '';
  }
</script>

<div class="elisa-panel">
  <h3 class="panel-title">🧫 ELISA Plate Reader</h3>

  <!-- Drop zone -->
  <div class="drop-zone" class:drop-highlight={dragActive && !loadedSample} data-elisa-well>
    {#if loadedSample}
      <div class="loaded-sample">
        <span class="sample-label">{loadedSample}</span>
        <button class="eject-btn" onclick={oneject}>✗ Eject</button>
      </div>
    {:else if dragActive}
      <span class="drop-hint">↓ Drop sample tube here</span>
    {:else}
      <span class="drop-empty">Drag a sample tube here</span>
    {/if}
  </div>

  <!-- Antibody selection + run -->
  {#if loadedSample}
    <div class="test-controls">
      <select
        class="ab-select"
        bind:value={selectedAntibody}
        disabled={testsRemaining <= 0}
      >
        <option value="">Select antibody…</option>
        {#each design.antibodies as ab}
          <option value={ab}>{ab}</option>
        {/each}
      </select>
      <button
        class="run-btn"
        disabled={!selectedAntibody || testsRemaining <= 0}
        onclick={runTest}
      >
        ▶ Test
      </button>
    </div>
  {/if}

  <span class="budget">Tests remaining: {testsRemaining} / {design.wellBudget}</span>

  <!-- Result log -->
  {#if resultLog.length > 0}
    <div class="result-log">
      {#each resultLog as r}
        <div class="result-row" class:positive={r.positive}>
          <span>{r.sample} + {r.antibody}</span>
          <span class="result-icon">{r.positive ? '✓ Positive' : '— Negative'}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .elisa-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 10px;
    flex: 1;
    align-items: center;
  }

  .panel-title {
    font-family: var(--font-heading);
    font-size: 0.95rem;
    color: var(--parchment);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    align-self: flex-start;
  }

  .drop-zone {
    width: 100%;
    max-width: 300px;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--brass-dark);
    border-radius: 8px;
    background: var(--bg-darkest);
    transition: all 0.15s;
  }

  .drop-zone.drop-highlight {
    border-color: var(--brass);
    background: rgba(180, 160, 100, 0.1);
  }

  .drop-hint {
    color: var(--brass);
    font-family: var(--font-heading);
    font-size: 0.85rem;
    animation: pulse 1.2s infinite alternate;
  }

  .drop-empty {
    color: var(--parchment-aged);
    font-size: 0.8rem;
    opacity: 0.6;
  }

  @keyframes pulse {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }

  .loaded-sample {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
  }

  .sample-label {
    font-family: var(--font-heading);
    font-size: 0.9rem;
    color: var(--parchment);
  }

  .eject-btn {
    background: none;
    border: 1px solid var(--brass-dark);
    color: var(--parchment-aged);
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .eject-btn:hover {
    color: #e74c3c;
    border-color: #e74c3c;
  }

  .test-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ab-select {
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    background: var(--bg-darkest);
    color: var(--parchment);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    cursor: pointer;
  }

  .run-btn {
    padding: 6px 16px;
    border: 1px solid var(--brass-dark);
    border-radius: 8px;
    background: var(--brass-dark);
    color: var(--parchment);
    font-family: var(--font-heading);
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
  }

  .run-btn:hover:not(:disabled) {
    background: var(--brass);
    color: var(--bg-darkest);
  }

  .run-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .budget {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment-aged);
  }

  .result-log {
    width: 100%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .result-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background: var(--bg-darkest);
    border-radius: 4px;
    color: var(--parchment-aged);
  }

  .result-row.positive {
    color: rgb(215, 200, 60);
  }

  .result-icon {
    font-weight: 600;
  }
</style>
