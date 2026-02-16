<script lang="ts">
  import type { HeldItem } from '../../shared/types';
  import { SAMPLE_COLORS, CONDITION_OPACITY } from '../../shared/types';

  interface Props {
    heldItem: HeldItem | null;
  }

  let { heldItem }: Props = $props();
</script>

<div class="sample-hud" class:visible={heldItem !== null} data-ref="sample-hud">
  {#if heldItem?.kind === 'sample'}
    {@const sample = heldItem.sample}
    <div class="hud-content panel flex items-center gap-md p-sm">
      <span class="text-xs uppercase text-muted">Carrying:</span>
      <div class="flex items-center gap-sm">
        <span 
          class="sample-dot"
          style:background={SAMPLE_COLORS[sample.type]}
          style:opacity={CONDITION_OPACITY[sample.condition]}
        ></span>
        <span data-ref="held-sample">{sample.label}</span>
        <span class="condition-badge {sample.condition}">{sample.condition}</span>
      </div>
    </div>
  {:else if heldItem?.kind === 'plate'}
    {@const plate = heldItem.plate}
    <div class="hud-content panel flex items-center gap-md p-sm">
      <span class="text-xs uppercase text-muted">Carrying:</span>
      <div class="flex items-center gap-sm">
        <span class="plate-icon">🧫</span>
        <span data-ref="held-plate">{plate.label}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .sample-hud {
    position: absolute;
    bottom: var(--space-md);
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    transition: transform 0.2s ease;
    z-index: 100;
  }

  .sample-hud.visible {
    transform: translateX(-50%) translateY(0);
  }

  .hud-content {
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
  }

  .plate-icon {
    font-size: 1.2rem;
  }
</style>
