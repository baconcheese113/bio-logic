<!--
  FurnitureTile — renders a piece of furniture on the lab grid.
  Shows icon from FURNITURE_DEFS + equipment icons from contents.
-->
<script lang="ts">
  import type { Furniture, GridPosition, Item } from '../../shared/types';
  import { FURNITURE_DEFS, detectWorkbenchMode, getItemIcon } from '../../shared/types';

  interface Props {
    furniture: Furniture;
    tileSize: number;
    isSelected: boolean;
    playerPosition: GridPosition;
    playerHasItem: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    onItemDrop: () => void;
  }

  let { furniture, tileSize, isSelected, playerPosition, playerHasItem, onClick, onDoubleClick, onItemDrop }: Props = $props();

  const def = $derived(FURNITURE_DEFS[furniture.type]);
  const icon = $derived(def.icon);
  const mode = $derived(furniture.type === 'workbench' ? detectWorkbenchMode(furniture.contents) : null);

  const isAdjacent = $derived(() => {
    const dx = Math.abs(playerPosition.x - furniture.position.x);
    const dy = Math.abs(playerPosition.y - furniture.position.y);
    return dx <= 1 && dy <= 1 && (dx + dy > 0 || dx === dy);
  });

  const hasCapacity = $derived(furniture.contents.length < def.contentCapacity);
  const canDrop = $derived(playerHasItem && isAdjacent() && hasCapacity && furniture.type !== 'cabinet');

  const equipmentIcons = $derived(
    furniture.contents
      .filter((i): i is Item & { kind: 'equipment' } => i.kind === 'equipment')
      .map(i => getItemIcon(i))
      .slice(0, 3)
  );

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    canDrop ? onItemDrop() : onClick();
  }
</script>

<button
  class="tile"
  class:selected={isSelected}
  class:adjacent={isAdjacent()}
  class:can-drop={canDrop}
  style:left="{furniture.position.x * tileSize}px"
  style:top="{furniture.position.y * tileSize}px"
  style:width="{tileSize}px"
  style:height="{tileSize}px"
  onclick={handleClick}
  ondblclick={(e) => { e.stopPropagation(); onDoubleClick(); }}
  data-ref="furniture-{furniture.id}"
>
  <span class="text-[1.75rem]">{icon}</span>

  {#if mode}
    <span class="mode-tag">{mode}</span>
  {/if}

  <div class="absolute bottom-[6px] flex gap-[2px] items-center">
    {#each equipmentIcons as eqIcon}
      <span class="text-[0.85rem]">{eqIcon}</span>
    {/each}
    {#if canDrop}<span class="drop-slot">+</span>{/if}
  </div>
</button>

<style>
  .tile {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border: 2px solid var(--brass-dark);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    font-family: inherit;
  }
  .tile:hover { border-color: var(--brass); transform: scale(1.05); z-index: 10; }
  .tile.selected { border-color: var(--brass-light); box-shadow: 0 0 12px rgba(184, 149, 110, 0.5); z-index: 11; }
  .tile.adjacent { border-color: var(--status-ready); }
  .tile.can-drop { border-color: var(--status-idle); animation: pulse-drop 0.5s ease-in-out infinite alternate; }

  @keyframes pulse-drop { 0% { box-shadow: 0 0 4px rgba(74, 124, 89, 0.5); } 100% { box-shadow: 0 0 12px rgba(74, 124, 89, 0.8); } }

  .mode-tag {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brass);
    background: var(--bg-darkest);
    padding: 1px 3px;
    border-radius: 2px;
    opacity: 0.8;
  }

  .drop-slot { 
    width: 14px; 
    height: 14px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border: 2px dashed var(--status-idle); 
    border-radius: 50%; 
    color: var(--status-idle); 
    font-size: 0.8rem; 
    font-weight: bold; 
  }
</style>
