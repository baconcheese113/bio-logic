<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { ElisaDesignData, ElisaSignal } from '../lib/lab-types';

  interface Props {
    design: ElisaDesignData;
    dragActive: boolean;
    loadedSample: string | null;
    ontest: (sample: string, antibody: string, signal: ElisaSignal) => void;
    oneject: () => void;
  }

  let { design, dragActive, loadedSample, ontest, oneject }: Props = $props();

  let selectedAntibody = $state('');
  let testsUsed = $state(0);
  let resultLog = $state<Array<{ sample: string; antibody: string; signal: ElisaSignal }>>([]);
  let developing = $state<{ sample: string; antibody: string; signal: ElisaSignal } | null>(null);

  const testsRemaining = $derived(design.wellBudget - testsUsed);

  const OD_LABELS: Record<ElisaSignal, string> = {
    strong: 'Strong (OD ≈ 2.8)',
    weak: 'Weak (OD ≈ 0.9)',
    none: 'Negative (OD ≈ 0.05)',
  };
  const OD_COLORS: Record<ElisaSignal, string> = {
    strong: '#e8c422',
    weak: '#a09050',
    none: '#5a5040',
  };
  // Strong signal develops fast — like a robust immunoreaction; weak is slow and uncertain
  const DEVELOP_MS: Record<ElisaSignal, number> = {
    strong: 900,
    weak: 2800,
    none: 400,
  };

  function runTest() {
    if (!loadedSample || !selectedAntibody || testsRemaining <= 0 || developing) return;
    const protein = design.truthMap[loadedSample];
    const signal: ElisaSignal = design.bindingMatrix[selectedAntibody]?.[protein] ?? 'none';
    const entry = { sample: loadedSample, antibody: selectedAntibody, signal };

    developing = entry;
    testsUsed++;
    selectedAntibody = '';

    setTimeout(() => {
      resultLog = [...resultLog, entry];
      ontest(entry.sample, entry.antibody, entry.signal);
      developing = null;
    }, DEVELOP_MS[signal]);
  }
</script>

<div class="elisa-panel">
  <h3 class="panel-title">🧫 ELISA Plate Reader</h3>

  <!-- Drop zone -->
  <div class="drop-zone" class:drop-highlight={dragActive && !loadedSample} data-elisa-well>
    {#if loadedSample}
      <div class="loaded-sample" in:fly={{ y: -8, duration: 180 }}>
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
    <div class="test-controls" in:fly={{ y: 6, duration: 150 }}>
      <select
        class="ab-select"
        bind:value={selectedAntibody}
        disabled={testsRemaining <= 0 || !!developing}
      >
        <option value="">Select antibody…</option>
        {#each design.antibodies as ab}
          <option value={ab.name}>{ab.name}</option>
        {/each}
      </select>
      <button
        class="run-btn"
        disabled={!selectedAntibody || testsRemaining <= 0 || !!developing}
        onclick={runTest}
      >
        ▶ Test
      </button>
    </div>
  {/if}

  <span class="budget">Tests remaining: {testsRemaining} / {design.wellBudget}</span>

  <!-- Developing well — shown while reaction is running -->
  {#if developing}
    <div class="current-reaction" transition:fly={{ y: -4, duration: 150 }}>
      <div class="well-dish">
        <div
          class="well-fill"
          style:background={OD_COLORS[developing.signal]}
          style:animation-duration="{DEVELOP_MS[developing.signal]}ms"
        ></div>
      </div>
      <div class="reaction-info">
        <span class="reaction-label">DEVELOPING</span>
        <span class="reaction-detail">{developing.sample} × {developing.antibody}</span>
      </div>
    </div>
  {/if}

  <!-- Result log -->
  {#if resultLog.length > 0}
    <div class="result-log">
      {#each resultLog as r (r.sample + r.antibody)}
        <div class="result-row" in:fly={{ y: 8, duration: 200 }}>
          <span class="well-dot" style:background={OD_COLORS[r.signal]}></span>
          <span class="result-pair">{r.sample} + {r.antibody}</span>
          <span class="result-signal" style:color={OD_COLORS[r.signal]}>{OD_LABELS[r.signal]}</span>
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

  /* Developing well */
  .current-reaction {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    background: var(--bg-darkest);
    border: 1px solid var(--brass-dark);
    border-radius: 8px;
    width: 100%;
    max-width: 300px;
  }

  .well-dish {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--brass-dark);
    background: var(--bg-darkest);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }

  .well-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 0%;
    animation: fill-up ease-in forwards;
    /* animation-duration set inline per signal strength */
  }

  @keyframes fill-up {
    from { height: 0%; opacity: 0.7; }
    to   { height: 100%; opacity: 1; }
  }

  .reaction-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .reaction-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--brass);
    letter-spacing: 0.12em;
    animation: blink 1s ease-in-out infinite;
  }

  .reaction-detail {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }

  /* Result log */
  .result-log {
    width: 100%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .result-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background: var(--bg-darkest);
    border-radius: 4px;
    color: var(--parchment-aged);
  }

  .well-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .result-pair {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-signal {
    font-weight: 600;
    white-space: nowrap;
    font-size: 0.7rem;
  }
</style>
