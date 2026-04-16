<script lang="ts">
  import type { SimulationResult } from '../lib/types';

  interface Props {
    detectableProteins: string[];
    simulationResults: SimulationResult[];
    onprobe: (protein: string) => void;
  }

  let { detectableProteins, simulationResults, onprobe }: Props = $props();

  let probed = $state<Map<string, { found: boolean; amount: number }>>(new Map());

  function probe(protein: string) {
    if (probed.has(protein)) return;

    // Check across all simulation results for this protein
    let maxAmount = 0;
    for (const result of simulationResults) {
      const amount = result.proteins[protein] ?? 0;
      if (amount > maxAmount) maxAmount = amount;
    }

    probed.set(protein, { found: maxAmount > 0, amount: maxAmount });
    probed = new Map(probed);
    onprobe(protein);
  }

  const PROTEIN_COLORS: Record<string, string> = {
    GFP: '#22c55e',
    RFP: '#ef4444',
    Insulin: '#8b5cf6',
    RepA: '#a855f7',
    ActA: '#06b6d4',
  };
</script>

<div class="instrument-panel">
  <h3 class="panel-title">🔬 Protein Detector</h3>

  <div class="probe-grid">
    {#each detectableProteins as protein}
      {@const result = probed.get(protein)}
      {@const color = PROTEIN_COLORS[protein] ?? '#9ca3af'}
      <button
        class="probe-btn"
        class:probed={!!result}
        class:found={result?.found}
        class:not-found={result && !result.found}
        disabled={!!result}
        onclick={() => probe(protein)}
        style:--c={color}
      >
        {#if result}
          {#if result.found}
            <span class="probe-icon">✓</span>
            <span class="probe-name">{protein}</span>
            <span class="probe-result">DETECTED</span>
          {:else}
            <span class="probe-icon">✗</span>
            <span class="probe-name">{protein}</span>
            <span class="probe-result">not found</span>
          {/if}
        {:else}
          <span class="probe-icon">?</span>
          <span class="probe-name">anti-{protein}</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .instrument-panel {
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 420px;
  }

  .panel-title {
    font-family: var(--font-heading);
    font-size: 0.9rem;
    margin: 0;
    color: var(--parchment);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .probe-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .probe-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-dark);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .probe-btn:hover:not(:disabled) {
    border-color: var(--c);
    color: var(--parchment);
    background: var(--bg-light);
  }

  .probe-btn:disabled {
    cursor: default;
  }

  .probe-btn.found {
    border-color: var(--c);
    background: rgba(74, 124, 89, 0.2);
    color: var(--c);
  }

  .probe-btn.not-found {
    border-color: var(--brass-dark);
    opacity: 0.5;
    color: var(--parchment-aged);
  }

  .probe-icon {
    font-size: 0.9rem;
  }

  .probe-name {
    font-weight: 600;
  }

  .probe-result {
    font-size: 0.7rem;
    opacity: 0.8;
  }
</style>
