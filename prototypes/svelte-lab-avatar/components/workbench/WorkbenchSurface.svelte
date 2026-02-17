<!--
  WorkbenchSurface.svelte — Generic reusable workbench surface.

  Renders the wood-grain surface, positioned zones with labels,
  a tool cursor, and a status bar. All workbench-specific content
  (burner SVG, plate canvas, status items) is provided by the parent via snippets.

  Handles: cursor tracking, zone hit-testing, RAF tick loop, keyboard forwarding.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ZoneDef } from './items/workbench-types';
  import { hitTestZones } from './items/workbench-types';

  interface Props {
    zones: ZoneDef[];
    zoneContent: Snippet<[string]>;
    cursor: Snippet;
    statusBar: Snippet;
    hint?: string;
    onCursorMove?: (nx: number, ny: number, zone: string | null) => void;
    onClick?: (zone: string | null) => void;
    onPointerLeave?: () => void;
    onTick?: (dt: number) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
  }

  let {
    zones,
    zoneContent,
    cursor,
    statusBar,
    hint = '',
    onCursorMove,
    onClick,
    onPointerLeave: onPointerLeaveProp,
    onTick,
    onKeyDown: onKeyDownProp,
    onKeyUp: onKeyUpProp,
  }: Props = $props();

  let surfaceEl: HTMLDivElement;
  let activeZone = $state<string | null>(null);

  function handlePointerMove(e: PointerEvent) {
    if (!surfaceEl) return;
    const rect = surfaceEl.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    activeZone = hitTestZones(zones, nx, ny);
    onCursorMove?.(nx, ny, activeZone);
  }

  function handleClick() {
    onClick?.(activeZone);
  }

  function handlePointerLeave() {
    activeZone = null;
    onPointerLeaveProp?.();
  }

  // RAF tick loop
  $effect(() => {
    if (!onTick) return;
    let rafId: number;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min(3, (now - lastTime) / 16.67);
      lastTime = now;
      onTick!(dt);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<svelte:window
  onkeydown={(e) => onKeyDownProp?.(e)}
  onkeyup={(e) => onKeyUpProp?.(e)}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="flex flex-col gap-sm">
  <div
    class="workbench"
    bind:this={surfaceEl}
    onpointermove={handlePointerMove}
    onclick={handleClick}
    onpointerleave={handlePointerLeave}
    role="application"
    aria-label="Workbench surface"
    style="touch-action: none"
  >
    <div class="bench-surface">
      {#each zones as zone}
        <div
          class="zone"
          class:zone-active={activeZone === zone.id}
          style:left="{zone.bounds.x * 100}%"
          style:top="{zone.bounds.y * 100}%"
          style:width="{zone.bounds.w * 100}%"
          style:height="{zone.bounds.h * 100}%"
        >
          {@render zoneContent(zone.id)}
          <span class="zone-label">{zone.label}</span>
        </div>
      {/each}

      {@render cursor()}
    </div>

    {@render statusBar()}
  </div>

  {#if hint}
    <p class="text-xs text-parchment-aged italic m-0">{hint}</p>
  {/if}
</div>

<style>
  .workbench {
    position: relative;
    width: 100%;
    aspect-ratio: 5 / 3;
    max-width: 800px;
    cursor: none;
  }

  .bench-surface {
    position: relative;
    width: 100%;
    height: 100%;
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
    overflow: hidden;
  }

  /* --- Zones --- */
  .zone {
    position: absolute;
    border: none;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15);
    background: rgba(0,0,0,0.08);
    transition: background 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }
  .zone-active {
    background: rgba(180, 140, 60, 0.06);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15), 0 0 6px rgba(180, 140, 60, 0.08);
  }
  .zone-label {
    font-size: 0.8rem;
    color: #c4a35a;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    background: linear-gradient(180deg, #3d3020, #2a2018);
    border: 1px solid rgba(180, 140, 60, 0.25);
    border-radius: 2px;
    padding: 1px 8px;
    position: absolute;
    bottom: 4px;
  }
</style>
