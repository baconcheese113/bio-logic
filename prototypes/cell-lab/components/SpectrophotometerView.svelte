<script lang="ts">
  import type { GrowthPoint } from '../lib/lab-types';

  interface Props {
    curve: GrowthPoint[] | undefined;
    budget?: number;
    readings: GrowthPoint[];
    onreading: (point: GrowthPoint) => void;
  }

  let { curve, budget, readings, onreading }: Props = $props();

  let selectedTimepoint = $state<number | null>(null);

  const availableTimepoints = $derived(
    curve?.map(p => p.timepoint) ?? [],
  );
  const usedTimepoints = $derived(new Set(readings.map(r => r.timepoint)));
  const budgetRemaining = $derived(budget != null ? budget - readings.length : Infinity);
  const hasProduct = $derived(readings.some(r => r.productLevel != null));

  const maxOd = $derived(Math.max(...readings.map(r => r.od600), 0.1));
  const maxProduct = $derived(
    hasProduct ? Math.max(...readings.map(r => r.productLevel ?? 0), 0.1) : 0,
  );

  function takeReading() {
    if (selectedTimepoint == null || !curve) return;
    if (budget != null && readings.length >= budget) return;
    if (usedTimepoints.has(selectedTimepoint)) return;

    const point = curve.find(p => p.timepoint === selectedTimepoint);
    if (!point) return;

    onreading(point);
    selectedTimepoint = null;
  }
</script>

<div class="spec-panel">
  <h3 class="panel-title">📊 Spectrophotometer</h3>

  {#if !curve}
    <p class="empty">No spectrophotometer data for this puzzle.</p>
  {:else}
    <div class="controls">
      <select class="time-select" bind:value={selectedTimepoint}>
        <option value={null}>Select timepoint…</option>
        {#each availableTimepoints as tp}
          <option value={tp} disabled={usedTimepoints.has(tp)}>
            {tp}h{usedTimepoints.has(tp) ? ' ✓' : ''}
          </option>
        {/each}
      </select>

      <button
        class="read-btn"
        disabled={selectedTimepoint == null || budgetRemaining <= 0}
        onclick={takeReading}
      >Take Reading</button>

      {#if budget != null}
        <span class="budget" class:low={budgetRemaining <= 1}>
          {budgetRemaining} reading{budgetRemaining !== 1 ? 's' : ''} left
        </span>
      {/if}
    </div>

    {#if readings.length > 0}
      <div class="reading-table">
        <div class="table-header">
          <span class="col-time">Time</span>
          <span class="col-od">OD₆₀₀</span>
          <span class="col-bar"></span>
          {#if hasProduct}
            <span class="col-product">Product</span>
            <span class="col-bar"></span>
          {/if}
        </div>
        {#each readings as r}
          <div class="table-row">
            <span class="col-time">{r.timepoint}h</span>
            <span class="col-od">{r.od600.toFixed(3)}</span>
            <span class="col-bar">
              <span class="bar od-bar" style:width="{(r.od600 / maxOd) * 100}%"></span>
            </span>
            {#if hasProduct}
              <span class="col-product">{(r.productLevel ?? 0).toFixed(2)}</span>
              <span class="col-bar">
                <span class="bar product-bar" style:width="{((r.productLevel ?? 0) / maxProduct) * 100}%"></span>
              </span>
            {/if}
          </div>
        {/each}
      </div>

      <div class="legend-row">
        <span class="legend-item"><span class="swatch od-swatch"></span> OD₆₀₀ (cell density)</span>
        {#if hasProduct}
          <span class="legend-item"><span class="swatch product-swatch"></span> Product (mg/L)</span>
        {/if}
      </div>
    {:else}
      <p class="hint">Select a timepoint and take a reading to begin.</p>
    {/if}
  {/if}
</div>

<style>
  .spec-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 10px;
    flex: 1;
  }

  .panel-title {
    font-family: var(--font-heading);
    font-size: 0.95rem;
    color: var(--parchment);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .time-select {
    padding: 5px 10px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-darkest);
    color: var(--parchment);
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  .read-btn {
    padding: 5px 16px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--brass-dark);
    color: var(--parchment);
    font-family: var(--font-heading);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 600;
  }

  .read-btn:hover:not(:disabled) {
    background: var(--brass);
    color: var(--bg-darkest);
  }

  .read-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .budget {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment-aged);
    padding: 3px 8px;
    background: var(--bg-darkest);
    border-radius: 4px;
  }

  .budget.low {
    color: #ef4444;
  }

  .reading-table {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--bg-darkest);
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    padding: 8px 10px;
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--brass-dark);
    font-family: var(--font-heading);
    font-size: 11px;
    color: var(--parchment-aged);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .table-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .col-time {
    width: 50px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--parchment);
  }

  .col-od {
    width: 60px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--brass);
  }

  .col-product {
    width: 60px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: #5aa85a;
  }

  .col-bar {
    flex: 1;
    min-width: 50px;
    height: 10px;
    position: relative;
  }

  .bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .od-bar { background: var(--brass); }
  .product-bar { background: #5aa85a; }

  .legend-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--parchment-aged);
  }

  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .od-swatch { background: var(--brass); }
  .product-swatch { background: #5aa85a; }

  .empty, .hint {
    font-size: 0.85rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }
</style>
