<script lang="ts">
  import type { Fixture, GridPosition, Item } from '../../lib/types';
  import { FIXTURE_DEFS, detectWorkbenchMode } from '../../lib/types';
  import { getCarryingLoad, isPortable } from '../workbench/item-defs';
  import ItemSlot from '../ui/ItemSlot.svelte';

  interface Props {
    fixture: Fixture | null;
    playerPosition: GridPosition;
    carrying: Item[];
    carryCapacity: number;
    onDrop: () => void;
    onPickup: (itemIndex: number) => void;
    onOpen: () => void;
  }

  let { fixture, playerPosition, carrying, carryCapacity, onDrop, onPickup, onOpen }: Props = $props();

  const isAdjacent = $derived(() => {
    if (!fixture) return false;
    const dx = Math.abs(playerPosition.x - fixture.position.x);
    const dy = Math.abs(playerPosition.y - fixture.position.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
  });

  const def = $derived(fixture ? FIXTURE_DEFS[fixture.type] : null);
  const hasCapacity = $derived(fixture ? fixture.items.length < (def?.capacity ?? 0) : false);
  const canDrop = $derived(carrying.length > 0 && isAdjacent() && hasCapacity);
  const mode = $derived(fixture?.type === 'workbench' ? detectWorkbenchMode(fixture.items) : null);
  const playerLoad = $derived(getCarryingLoad(carrying));
  const canPickup = $derived(isAdjacent() && playerLoad < carryCapacity);
</script>

<aside class="sidebar" class:visible={fixture !== null} data-ref="fixture-panel">
  {#if fixture && def}
    <div class="sidebar-header">
      <span class="icon-md">{def.icon}</span>
      <span class="text-brass">{fixture.name}</span>
      {#if mode}
        <span class="mode-badge">{mode}</span>
      {/if}
    </div>

    <div class="sidebar-body">
      <section class="control-section">
        <h4>Contents ({fixture.items.length}/{def.capacity})</h4>
        {#if fixture.items.length > 0}
          <ul class="list-none">
            {#each fixture.items as item, i}
              <li class="mb-xs">
                <ItemSlot
                  {item}
                  canPickup={isPortable(item) && canPickup}
                  onPickup={() => onPickup(i)}
                />
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty-text">Empty</p>
        {/if}
      </section>

      {#if isAdjacent()}
        <span class="status-tag bg-status-ready">Within reach</span>
      {/if}

      <section class="control-section">
        <h4>Actions</h4>
        <div class="flex flex-col gap-sm">
          {#if canDrop}
            <button class="btn drop-btn" onclick={onDrop} data-ref="btn-drop-item">
              Place Item Here
            </button>
          {/if}
          {#if fixture.type === 'workbench'}
            <button 
              class="btn" 
              disabled={!isAdjacent()} 
              onclick={onOpen}
              data-ref="btn-open-fixture"
            >
              Open Workbench
            </button>
          {/if}
        </div>
      </section>
    </div>
  {:else}
    <div class="flex items-center justify-center flex-1 p-lg text-center text-muted">
      <p>Select a fixture to view details</p>
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

  .drop-btn {
    background: linear-gradient(180deg, var(--status-idle) 0%, #3a6a49 100%) !important;
    border-color: var(--status-idle) !important;
  }
</style>
