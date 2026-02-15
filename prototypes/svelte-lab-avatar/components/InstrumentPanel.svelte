<script lang="ts">
  import type { Instrument, Sample, GridPosition } from '../../shared/types';
  import { INSTRUMENT_ICONS, SAMPLE_COLORS, CONDITION_OPACITY } from '../../shared/types';

  interface Props {
    instrument: Instrument | null;
    samples: Sample[];
    playerPosition: GridPosition;
    heldSample: Sample | null;
    onDrop: () => void;
    onOpen: () => void;
  }

  let { instrument, samples, playerPosition, heldSample, onDrop, onOpen }: Props = $props();

  const instrumentSamples = $derived(
    instrument
      ? samples.filter(s =>
          s.location.type === 'instrument' && s.location.instrumentId === instrument.id
        )
      : []
  );

  const isAdjacent = $derived(() => {
    if (!instrument) return false;
    const dx = Math.abs(playerPosition.x - instrument.position.x);
    const dy = Math.abs(playerPosition.y - instrument.position.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
  });

  const hasEmptySlot = $derived(instrument?.slots.some(s => s.sampleId === null) ?? false);
  const canDrop = $derived(heldSample !== null && isAdjacent() && hasEmptySlot);
</script>

<aside class="sidebar" class:visible={instrument !== null} data-ref="instrument-panel">
  {#if instrument}
    <div class="sidebar-header">
      <span class="icon-md">{INSTRUMENT_ICONS[instrument.type]}</span>
      <span class="text-brass">{instrument.name}</span>
    </div>

    <div class="sidebar-body">
      <section class="control-section">
        <h4>Status</h4>
        <div class="flex items-center gap-sm mb-sm">
          <span class="badge {instrument.status}" data-ref="instrument-status">
            {instrument.status.toUpperCase()}
          </span>
          {#if instrument.status === 'busy'}
            <span class="font-mono text-sm" style:color="var(--status-busy)">{instrument.progress}%</span>
          {/if}
        </div>
        {#if isAdjacent()}
          <span class="adjacent-tag">Within reach</span>
        {/if}
      </section>

      <section class="control-section">
        <h4>Samples ({instrumentSamples.length}/{instrument.slots.length})</h4>
        {#if instrumentSamples.length > 0}
          <ul class="sample-list">
            {#each instrumentSamples as sample}
              <li class="sample-item" data-ref="panel-sample-{sample.id}">
                <span
                  class="sample-dot"
                  style:background={SAMPLE_COLORS[sample.type]}
                  style:opacity={CONDITION_OPACITY[sample.condition]}
                ></span>
                <div class="flex flex-col">
                  <span class="text-sm">{sample.label}</span>
                  <span class="condition-badge {sample.condition}">{sample.condition}</span>
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty-text">No samples loaded</p>
        {/if}
      </section>

      <section class="control-section">
        <h4>Actions</h4>
        <div class="flex flex-col gap-sm">
          {#if canDrop}
            <button class="btn drop-btn" onclick={onDrop} data-ref="btn-drop-sample">
              Drop Sample Here
            </button>
          {/if}
          <button 
            class="btn" 
            disabled={instrument.status === 'busy' || !isAdjacent()} 
            onclick={onOpen}
            data-ref="btn-open-instrument"
          >
            Open Instrument
          </button>
        </div>
      </section>
    </div>
  {:else}
    <div class="flex items-center justify-center flex-1 p-lg text-center text-muted">
      <p>Select an instrument to view details</p>
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    transform: translateX(100%);
    transition: transform 0.2s ease;
  }

  .sidebar.visible {
    transform: translateX(0);
  }

  .adjacent-tag {
    display: inline-block;
    padding: 2px 8px;
    background: var(--status-ready);
    color: white;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .sample-list {
    list-style: none;
  }

  .sample-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    background: var(--bg-medium);
    border-radius: 4px;
    margin-bottom: var(--space-xs);
  }

  .drop-btn {
    background: linear-gradient(180deg, var(--status-idle) 0%, #3a6a49 100%) !important;
    border-color: var(--status-idle) !important;
  }
</style>
