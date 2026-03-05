<!--
  WorkbenchGrid.svelte — Interactive workbench surface.

  Renders a wood-grain CSS grid where items occupy fixed cells.
  Tracks pointer position and manages the held-item cursor overlay.
  Items handle their own interactions via the workbench context —
  this component just provides the surface and event plumbing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { GridPlacement } from './item-defs';
  import { getWorkbench } from './workbench-context.svelte';
  import type { Item } from '../../lib/types';
  import { ITEM_DEFS, getItemLabel } from './item-defs';

  interface Props {
    gridCols: number;
    gridRows: number;
    placements: GridPlacement[];
    itemContent: Snippet<[GridPlacement]>;
    heldContent?: Snippet<[Item]>;
    statusBar?: Snippet;
    hint?: string;
  }

  let {
    gridCols,
    gridRows,
    placements,
    itemContent,
    heldContent,
    statusBar,
    hint = '',
  }: Props = $props();

  const wb = getWorkbench();

  // Pointer position in px relative to the surface (for cursor overlay)
  let surfaceEl = $state<HTMLDivElement>();
  let pointerX = $state(0);
  let pointerY = $state(0);

  function handlePointerMove(e: PointerEvent) {
    if (!surfaceEl) return;
    const rect = surfaceEl.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
  }

  function handlePointerLeave() {
    wb.hoveredItemId = null;
    wb.mouseDown = false;
  }

  function handleSurfaceClick() {
    // Clicking empty space while holding → put down
    if (wb.heldItemId && !wb.hoveredItemId) {
      wb.putDown();
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && wb.heldItemId) wb.putDown();
  }}
/>

<div class="flex flex-col gap-sm">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="workbench no-select"
    role="application"
    aria-label="Workbench surface"
    style:cursor={wb.heldItemId ? 'none' : undefined}
  >
    <div
      class="bench-surface"
      bind:this={surfaceEl}
      style:--grid-cols={gridCols}
      style:--grid-rows={gridRows}
      onpointermove={handlePointerMove}
      onpointerleave={handlePointerLeave}
      onpointerdown={() => { wb.mouseDown = true; }}
      onpointerup={() => { wb.mouseDown = false; }}
      onpointercancel={() => { wb.mouseDown = false; }}
      onclick={handleSurfaceClick}
    >
      <!-- Empty grid cells -->
      {#each { length: gridCols * gridRows } as _, i}
        <div
          class="grid-cell"
          style:grid-column={(i % gridCols) + 1}
          style:grid-row={Math.floor(i / gridCols) + 1}
        ></div>
      {/each}

      <!-- Placed items -->
      {#each placements as placement (placement.item.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="grid-item"
          class:hovered={wb.hoveredItemId === placement.item.id && wb.heldItemId !== placement.item.id}
          class:interaction-target={wb.heldItemId !== null && wb.hoveredItemId === placement.item.id && wb.heldItemId !== placement.item.id}
          style:grid-column="{placement.col + 1} / span {placement.cols}"
          style:grid-row="{placement.row + 1} / span {placement.rows}"
          onpointerenter={(e) => {
            wb.hoveredItemId = placement.item.id;
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            wb.hoverNormY = r.height > 0 ? (e.clientY - r.top) / r.height : 0;
          }}
          onpointermove={(e) => {
            if (wb.hoveredItemId !== placement.item.id) return;
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            wb.hoverNormY = r.height > 0 ? (e.clientY - r.top) / r.height : 0;
          }}
          onpointerleave={() => { if (wb.hoveredItemId === placement.item.id) wb.hoveredItemId = null; }}
        >
          {@render itemContent(placement)}

          <!-- Name tag -->
          <span class="name-tag">{getItemLabel(placement.item)}</span>

          <!-- Held-item badge when hovering over this tile -->
          {#if wb.heldItemId && wb.hoveredItemId === placement.item.id && wb.heldItemId !== placement.item.id}
            <span class="held-badge">{ITEM_DEFS[wb.heldItem!.type].icon}</span>
          {/if}
        </div>
      {/each}

      <!-- Held item cursor (follows pointer) -->
      {#if wb.heldItem}
        <div
          class="held-cursor"
          style:left="{pointerX}px"
          style:top="{pointerY}px"
        >
          {#if heldContent}
            {@render heldContent(wb.heldItem)}
          {:else}
            <span class="text-2xl">{ITEM_DEFS[wb.heldItem.type].icon}</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Status bar -->
    {#if statusBar}
      {@render statusBar()}
    {/if}
  </div>

  {#if hint}
    <p class="text-xs text-parchment-aged italic m-0">{hint}</p>
  {/if}
</div>

<style>
  .workbench {
    position: relative;
    width: 100%;
    max-width: 800px;
  }

  .bench-surface {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--grid-cols), 1fr);
    grid-template-rows: repeat(var(--grid-rows), 1fr);
    aspect-ratio: calc(var(--grid-cols) / var(--grid-rows));
    gap: 4px;
    padding: 12px;
    background:
      repeating-linear-gradient(
        90deg,
        transparent 0px, rgba(0,0,0,0.03) 2px,
        transparent 4px, rgba(0,0,0,0.02) 8px,
        transparent 12px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0px, rgba(80,50,20,0.08) 40px,
        transparent 80px
      ),
      linear-gradient(180deg, #3d2e1e 0%, #2e2015 40%, #241a10 100%);
    border: 3px solid rgba(140, 110, 50, 0.5);
    border-bottom-width: 4px;
    border-radius: 6px;
    box-shadow:
      var(--shadow-lg),
      inset 0 2px 8px rgba(0,0,0,0.5),
      inset 0 -2px 4px rgba(80,50,20,0.15);
  }

  .grid-cell {
    border-radius: 4px;
    min-height: 80px;
  }

  .grid-item {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.08);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15);
    transition: background 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .grid-item:hover,
  .grid-item.hovered {
    background: rgba(180, 140, 60, 0.06);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15), 0 0 6px rgba(180, 140, 60, 0.08);
  }

  .grid-item.interaction-target {
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15), 0 0 12px rgba(100, 180, 255, 0.15);
    background: rgba(100, 180, 255, 0.04);
  }

  /* Brass nameplate pinned to bottom of cell */
  .name-tag {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
    color: #c4a35a;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    background: linear-gradient(180deg, #3d3020, #2a2018);
    border: 1px solid rgba(180, 140, 60, 0.25);
    border-radius: 2px;
    padding: 1px 8px;
    white-space: nowrap;
    pointer-events: none;
  }

  /* Held-item icon badge in top-right corner */
  .held-badge {
    position: absolute;
    top: 3px;
    right: 4px;
    font-size: 0.85rem;
    pointer-events: none;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
    animation: badge-pulse 0.6s ease-in-out infinite alternate;
  }

  @keyframes badge-pulse {
    from { opacity: 0.6; }
    to   { opacity: 1; }
  }

  /* Floating cursor when holding an item */
  .held-cursor {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, calc(-50% + 34px));
    z-index: 20;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
    opacity: 0.9;
  }
</style>
