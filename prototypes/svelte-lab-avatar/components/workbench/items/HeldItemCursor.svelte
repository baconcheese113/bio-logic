<!--
  HeldItemCursor.svelte — Custom cursor graphic for held items.

  For the inoculation loop: renders SVG with temperature-accurate wire
  color (red → orange → yellow → silver as it cools) and scales/shadows
  with wb.pressureLevel for tactile "pressing down" feedback.

  For other items: falls back to the item emoji icon.
-->
<script lang="ts">
  import type { Item } from '../../../../shared/types';
  import { ITEM_DEFS } from '../../../../shared/types';
  import { getWorkbench } from '../workbench-context.svelte';

  interface Props { item: Item; }
  let { item }: Props = $props();

  const wb = getWorkbench();

  const loopState = $derived(
    item.state?.kind === 'inoculation-loop' ? item.state : null
  );

  type LoopStatus = 'dirty' | 'sterile' | 'cooling' | 'loaded';
  const status = $derived.by((): LoopStatus => {
    if (!loopState) return 'dirty';
    if (loopState.volume > 0 && loopState.concentration > 0) return 'loaded';
    if (loopState.temperature > 0.3) return 'cooling';
    if (loopState.isSterile) return 'sterile';
    return 'dirty';
  });

  const statusColor: Record<LoopStatus, string> = {
    dirty: '#d06c6c',
    sterile: '#6cba6c',
    cooling: '#e0a840',
    loaded: '#6ca8d0',
  };

  // Wire color follows the heat spectrum: red → orange → yellow → cool silver
  function tempToWireColor(t: number): string {
    if (t <= 0.05) return '#bbbbbb';
    if (t > 0.8)   return `rgb(255,${Math.round(51 + (1 - t) * 85)},0)`;
    if (t > 0.5)   return `rgb(255,${Math.round(136 + (0.8 - t) * 227)},0)`;
    if (t > 0.3)   return 'rgb(255,204,0)';
    return '#bbbbbb';
  }

  const wireColor = $derived(tempToWireColor(loopState?.temperature ?? 0));

  // Pressure shrinks the cursor (pressing down = closer to surface = smaller on screen)
  const pressureScale = $derived(1 - wb.pressureLevel * 0.1);
  const shadowBlur    = $derived(6  + wb.pressureLevel * 10);
  const shadowOffset  = $derived(3  + wb.pressureLevel * 5);
  const shadowAlpha   = $derived(0.5 + wb.pressureLevel * 0.4);
</script>

{#if item.type === 'inoculation-loop'}
  <div
    class="loop-cursor"
    style:transform="scale({pressureScale})"
    style:filter="drop-shadow(0 {shadowOffset}px {shadowBlur}px rgba(0,0,0,{shadowAlpha.toFixed(2)}))"
  >
    <svg viewBox="0 0 50 120">
      <!-- Handle -->
      <rect x="21" y="55" width="8" height="60" rx="3"
        fill="#888" stroke="#666" stroke-width="1" />
      <!-- Neck -->
      <rect x="23" y="32" width="4" height="25" rx="1"
        fill="#aaa" stroke="#888" stroke-width="0.5" />
      <!-- Loop circle — wire color reflects temperature -->
      <circle cx="25" cy="18" r="13" fill="none"
        stroke={wireColor} stroke-width="2.5" />

      {#if loopState && loopState.volume > 0}
        <!-- Inoculum blob sized to remaining volume -->
        <circle cx="25" cy="18" r="{4 + loopState.volume * 5}" fill="rgba(200,180,140,0.7)" />
      {/if}

      {#if loopState && loopState.temperature > 0.1}
        <!-- Heat glow ring -->
        <circle cx="25" cy="18" r="16" fill="none"
          stroke="rgba(255,100,0,{Math.min(0.6, loopState.temperature * 0.7).toFixed(2)})"
          stroke-width="2" class="heat-glow" />
      {/if}
    </svg>
    <span class="status-dot" style:background={statusColor[status]}></span>
  </div>
{:else}
  <span class="text-2xl">{ITEM_DEFS[item.type].icon}</span>
{/if}

<style>
  .loop-cursor {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    /* Scale origin near the loop tip for a natural press-down feel */
    transform-origin: center 20%;
  }

  svg {
    width: 36px;
    height: 86px;
  }

  .heat-glow {
    animation: pulse-heat 0.4s ease-in-out infinite alternate;
  }

  @keyframes pulse-heat {
    from { opacity: 0.4; }
    to   { opacity: 1; }
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
</style>
