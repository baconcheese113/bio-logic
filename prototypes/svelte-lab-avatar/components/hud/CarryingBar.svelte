<script lang="ts">
  import type { Item } from '../../lib/types';
  import { getItemIcon, getItemLabel, getCarryingLoad } from '../workbench/item-defs';

  interface Props {
    carrying: Item[];
    carryCapacity: number;
  }

  let { carrying, carryCapacity }: Props = $props();

  const load = $derived(getCarryingLoad(carrying));
</script>

<div class="sample-hud" class:visible={carrying.length > 0} data-ref="sample-hud">
  {#if carrying.length > 0}
    <div class="panel flex items-center gap-md p-sm rounded-lg shadow-lg">
      <span class="text-xs uppercase text-muted">Carrying ({load}/{carryCapacity}):</span>
      {#each carrying as item}
        <div class="flex items-center gap-sm">
          <span>{getItemIcon(item)}</span>
          <span>{getItemLabel(item)}</span>
        </div>
      {/each}
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
</style>
