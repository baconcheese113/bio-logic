<script lang="ts">
  import type { Item } from '../../lib/types';
  import { getCulturePlate } from '../../lib/types';
  import { getWorkbench } from '../workbench/workbench-context.svelte';
  import { startCultureIncubation } from './culture/codex-culture-bridge';

  interface Props {
    item: Item;
  }

  interface IncubationTarget {
    id: string;
    label: string;
  }

  let { item }: Props = $props();

  const wb = getWorkbench();

  const targetHours = $derived(item.state?.kind === 'incubator' ? item.state.targetHours : 24);

  const heldPlateTarget = $derived.by((): IncubationTarget | null => {
    const held = wb.heldItem;
    const plate = held ? getCulturePlate(held) : null;
    if (!plate?.meta || plate.meta.phase !== 'streaked') return null;
    return { id: held.id, label: plate.label };
  });

  const benchPlateTarget = $derived.by((): IncubationTarget | null => {
    for (const benchItem of wb.items) {
      if (benchItem.id === item.id || benchItem.id === wb.heldItemId) continue;
      const plate = getCulturePlate(benchItem);
      if (plate?.meta && plate.meta.phase === 'streaked') {
        return { id: benchItem.id, label: plate.label };
      }
    }
    return null;
  });

  const incubationTarget = $derived(heldPlateTarget ?? benchPlateTarget);
  const canIncubate = $derived(incubationTarget !== null);
  const showPrompt = $derived(wb.hoveredItemId === item.id && canIncubate);

  function handleClick() {
    if (!incubationTarget) return;

    wb.mutateItem(incubationTarget.id, (targetItem) => {
      const plate = getCulturePlate(targetItem);
      if (!plate?.meta || plate.meta.phase !== 'streaked') return;
      startCultureIncubation(plate.meta, wb.currentTick, targetHours);
    });

    if (wb.heldItemId === incubationTarget.id) {
      wb.putDown();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex cursor-pointer flex-col items-center gap-1 p-1"
  class:ready={canIncubate}
  onclick={handleClick}
  data-ref={`bench-incubator-${item.id}`}
>
  <svg viewBox="0 0 80 96" aria-hidden="true">
    <rect x="12" y="16" width="56" height="62" rx="6" fill="#47321e" stroke="#8b6914" stroke-width="1.5" />
    <rect x="20" y="26" width="40" height="34" rx="3" fill="#1b1714" stroke="rgba(196, 163, 90, 0.35)" stroke-width="1" />
    <rect x="28" y="66" width="24" height="8" rx="2" fill="#6b5233" stroke="#8b6914" stroke-width="0.8" />
    <path d="M30 12 C24 6, 24 2, 30 -2" fill="none" stroke="rgba(220,180,110,0.7)" stroke-width="3" stroke-linecap="round" />
    <path d="M40 14 C34 8, 34 4, 40 0" fill="none" stroke="rgba(220,180,110,0.8)" stroke-width="3" stroke-linecap="round" />
    <path d="M50 12 C44 6, 44 2, 50 -2" fill="none" stroke="rgba(220,180,110,0.7)" stroke-width="3" stroke-linecap="round" />
  </svg>

  {#if showPrompt}
    <span class="incubator-hint">Incubate {targetHours}h</span>
  {/if}
</div>

<style>
  svg {
    width: 56px;
    height: 72px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  }

  .ready svg {
    filter:
      drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))
      drop-shadow(0 0 8px rgba(220, 180, 110, 0.2));
  }

  .incubator-hint {
    white-space: nowrap;
    font-size: 0.62rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(220, 180, 110, 0.88);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
  }
</style>
