<!--
  InoculationLoopItem.svelte — Holdable inoculation loop on the workbench grid.

  Click to pick up. While held, move over the burner to sterilize,
  click a sample vial to load inoculum, drag across a plate to streak.
  The loop manages its own status display; all interactions flow
  through the workbench context.

  Temperature passively cools over ~4s via a RAF loop so the player
  must wait before dipping into a sample.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { Item } from '../../../../shared/types';
  import { getWorkbench } from '../workbench-context.svelte';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();

  const wb = getWorkbench();
  const isHeld = $derived(wb.heldItemId === item.id);

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

  // Wire stroke color interpolated through the heat spectrum
  const wireColor = $derived.by(() => {
    const t = loopState?.temperature ?? 0;
    if (t <= 0.05) return '#bbbbbb';
    if (t > 0.8)  return `rgb(255,${Math.round(51 + (1 - t) * 85)},0)`;   // red-orange
    if (t > 0.5)  return `rgb(255,${Math.round(136 + (0.8 - t) * 227)},0)`; // orange-yellow
    if (t > 0.3)  return `rgb(255,${Math.round(200 + (0.5 - t) * 27)},0)`;  // yellow
    return '#bbbbbb';
  });

  // --- Passive cooling RAF ---
  // Triggered when loop becomes hot. Uses untrack() inside the RAF so
  // the effect doesn't re-run on every temperature mutation.
  $effect(() => {
    const isHot = loopState !== null && loopState.temperature > 0;
    if (!isHot) return;

    let rafId: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 16.67;
      last = now;
      let stillHot = false;
      wb.mutateItem(item.id, (it) => {
        if (it.state?.kind === 'inoculation-loop' && it.state.temperature > 0) {
          it.state.temperature = Math.max(0, it.state.temperature - 0.004 * dt);
          stillHot = it.state.temperature > 0;
        }
      });
      if (untrack(() => stillHot)) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  function handleClick() {
    if (isHeld) {
      wb.putDown();
    } else if (!wb.heldItemId) {
      wb.pickUp(item.id);
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col items-center gap-1 cursor-pointer p-1"
  class:held={isHeld}
  onclick={handleClick}
>
  <svg viewBox="0 0 50 120">
    <!-- Handle -->
    <rect x="21" y="55" width="8" height="60" rx="3"
      fill="#888" stroke="#666" stroke-width="1" />
    <!-- Neck -->
    <rect x="23" y="32" width="4" height="25" rx="1"
      fill="#aaa" stroke="#888" stroke-width="0.5" />
    <!-- Loop circle — color reflects temperature -->
    <circle cx="25" cy="18" r="13" fill="none"
      stroke={wireColor} stroke-width="2.5" />

    {#if !isHeld && status === 'loaded'}
      <!-- Inoculum blob sized to volume -->
      <circle cx="25" cy="18" r="{4 + (loopState?.volume ?? 0) * 5}" fill="rgba(200,180,140,0.7)" />
    {/if}

    {#if !isHeld && loopState && loopState.temperature > 0.1}
      <!-- Heat glow ring -->
      <circle cx="25" cy="18" r="15" fill="none"
        stroke="rgba(255,100,0,{Math.min(0.6, loopState.temperature * 0.7)})"
        stroke-width="2" class="heat-glow" />
    {/if}
  </svg>

  {#if !isHeld}
    <span class="status-dot" style:background={statusColor[status]}></span>
  {:else}
    <span class="ghost-label">Held</span>
  {/if}
</div>

<style>
  svg {
    width: 40px;
    height: 96px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    transition: filter 0.2s;
  }

  .held svg {
    opacity: 0.2;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }

  .heat-glow {
    animation: pulse-heat 0.4s ease-in-out infinite alternate;
  }

  @keyframes pulse-heat {
    from { opacity: 0.4; }
    to   { opacity: 1;   }
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .ghost-label {
    font-size: 0.6rem;
    color: rgba(180, 140, 60, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
