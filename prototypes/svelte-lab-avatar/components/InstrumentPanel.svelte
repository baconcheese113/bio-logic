<script lang="ts">
  import type { Furniture, Sample, GridPosition, Item } from '../../shared/types';
  import { FURNITURE_DEFS, detectWorkbenchMode, getItemIcon, getItemLabel, getCarryingLoad } from '../../shared/types';

  interface Props {
    furniture: Furniture | null;
    samples: Sample[];
    playerPosition: GridPosition;
    carrying: Item[];
    carryCapacity: number;
    onDrop: () => void;
    onPickup: (itemIndex: number) => void;
    onOpen: () => void;
  }

  let { furniture, samples, playerPosition, carrying, carryCapacity, onDrop, onPickup, onOpen }: Props = $props();

  const furnitureSamples = $derived(
    furniture
      ? samples.filter(s =>
          s.location.type === 'furniture' && s.location.furnitureId === furniture.id
        )
      : []
  );

  const isAdjacent = $derived(() => {
    if (!furniture) return false;
    const dx = Math.abs(playerPosition.x - furniture.position.x);
    const dy = Math.abs(playerPosition.y - furniture.position.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
  });

  const def = $derived(furniture ? FURNITURE_DEFS[furniture.type] : null);
  const hasCapacity = $derived(furniture ? furniture.contents.length < (def?.contentCapacity ?? 0) : false);
  const canDrop = $derived(carrying.length > 0 && isAdjacent() && hasCapacity);
  const mode = $derived(furniture?.type === 'workbench' ? detectWorkbenchMode(furniture.contents) : null);
  const playerLoad = $derived(getCarryingLoad(carrying));
  const canPickup = $derived(isAdjacent() && playerLoad < carryCapacity);
</script>

<aside class="sidebar" class:visible={furniture !== null} data-ref="furniture-panel">
  {#if furniture && def}
    <div class="sidebar-header">
      <span class="icon-md">{def.icon}</span>
      <span class="text-brass">{furniture.name}</span>
      {#if mode}
        <span class="mode-badge">{mode}</span>
      {/if}
    </div>

    <div class="sidebar-body">
      <section class="control-section">
        <h4>Contents ({furniture.contents.length}/{def.contentCapacity})</h4>
        {#if furniture.contents.length > 0}
          <ul class="list-none">
            {#each furniture.contents as item, i}
              <li class="flex items-center gap-sm p-sm bg-medium rounded mb-xs">
                <span>{getItemIcon(item)}</span>
                <span class="text-sm">{getItemLabel(item)}</span>
                {#if item.kind !== 'equipment' && canPickup}
                  <button
                    class="pickup-btn"
                    onclick={() => onPickup(i)}
                    title="Pick up"
                  >↑</button>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty-text">Empty</p>
        {/if}
      </section>

      {#if isAdjacent()}
        <span class="adjacent-tag">Within reach</span>
      {/if}

      <section class="control-section">
        <h4>Actions</h4>
        <div class="flex flex-col gap-sm">
          {#if canDrop}
            <button class="btn drop-btn" onclick={onDrop} data-ref="btn-drop-item">
              Place Item Here
            </button>
          {/if}
          <button 
            class="btn" 
            disabled={!isAdjacent()} 
            onclick={onOpen}
            data-ref="btn-open-furniture"
          >
            Open {furniture.type === 'workbench' ? 'Workbench' : furniture.name}
          </button>
        </div>
      </section>
    </div>
  {:else}
    <div class="flex items-center justify-center flex-1 p-lg text-center text-muted">
      <p>Select furniture to view details</p>
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
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .pickup-btn {
    margin-left: auto;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--brass-light);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: bold;
    transition: all 0.15s;
    padding: 0;
  }

  .pickup-btn:hover {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  .drop-btn {
    background: linear-gradient(180deg, var(--status-idle) 0%, #3a6a49 100%) !important;
    border-color: var(--status-idle) !important;
  }
</style>
