<!--
  BunsenBurnerItem.svelte — Interactive Bunsen burner on the workbench grid.

  Self-contained: click toggles flame on/off.

  Heating physics:
    The loop tip needs to be near the flame, not just anywhere over the tile.
    The flame occupies the top ~40% of the tile (top of the SVG).
    hoverNormY < 0.45 means the cursor is in that region.

    While the loop tip is in the flame:
      temperature += HEAT_RATE * dt  (~1.5s from cold to full heat)
      inoculumLevel → 0 immediately (flame burns off any inoculum)
      isSterile = true once temperature ≥ STERILIZE_TEMP

    Cooling is handled passively by InoculationLoopItem's RAF.
    The progress bar reflects the loop's current temperature (not a separate timer).
-->
<script lang="ts">
  import type { Item } from '../../lib/types';
  import { getWorkbench } from '../workbench/workbench-context.svelte';

  interface Props { item: Item; }
  let { item }: Props = $props();

  const wb = getWorkbench();

  const isLit = $derived(
    item.state?.kind === 'bunsen-burner' ? item.state.lit : true
  );

  function toggle() {
    if (wb.heldItemId) return; // don't toggle while holding something
    wb.mutateItem(item.id, (it) => {
      it.state = { kind: 'bunsen-burner', lit: !isLit };
    });
  }

  // --- Flame zone detection ---
  // The flame sits in the top portion of the burner SVG.
  // hoverNormY < 0.45 means the cursor (and the loop tip above it) is near the flame.
  const loopInFlame = $derived(
    isLit &&
    wb.isHeldOver(item.id) &&
    wb.isHolding('inoculation-loop') &&
    wb.hoverNormY < 0.45
  );

  const HEAT_RATE = 0.012;       // temperature gain per frame (~1.4s from 0 to 1)
  const STERILIZE_TEMP = 0.85;   // temperature at which the loop is considered sterile

  // Current loop temperature (for progress display)
  const loopTemp = $derived.by(() => {
    const h = wb.heldItem;
    if (!h?.state || h.state.kind !== 'inoculation-loop') return 0;
    return h.state.temperature;
  });

  // --- Progressive heating while loop tip is in the flame ---
  $effect(() => {
    if (!loopInFlame || !wb.heldItemId) return;

    let rafId: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 16.67;
      last = now;

      wb.mutateItem(wb.heldItemId!, (loop) => {
        if (loop.state?.kind !== 'inoculation-loop') return;
        // Flame burns off all liquid instantly
        if (loop.state.volume > 0) { loop.state.volume = 0; loop.state.concentration = 0; }
        // Progressively heat the wire
        loop.state.temperature = Math.min(1.0, loop.state.temperature + HEAT_RATE * dt);
        // Mark sterile once hot enough
        if (loop.state.temperature >= STERILIZE_TEMP) loop.state.isSterile = true;
      });

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col items-center gap-1 cursor-pointer p-1" onclick={toggle}>
  <svg viewBox="0 0 80 140">
    <!-- Base -->
    <rect x="10" y="110" width="60" height="26" rx="4"
      fill="#5a4428" stroke="#8b6914" stroke-width="1.5" />
    <rect x="16" y="114" width="48" height="18" rx="2"
      fill="none" stroke="rgba(140,110,50,0.3)" stroke-width="0.5" />

    <!-- Column -->
    <rect x="32" y="38" width="16" height="74" rx="2"
      fill="#4a3820" stroke="#6b5233" stroke-width="1" />

    <!-- Gas knob -->
    <circle cx="52" cy="90" r="5" fill="#6b5233" stroke="#8b6914" stroke-width="1" />
    <line x1="52" y1="87" x2="52" y2={isLit ? "85" : "90"} stroke="#c4a35a" stroke-width="1.5" />

    <!-- Burner head -->
    <rect x="26" y="34" width="28" height="8" rx="2"
      fill="#5a4428" stroke="#8b6914" stroke-width="1" />
    <ellipse cx="40" cy="34" rx="14" ry="3"
      fill="#4a3820" stroke="#6b5233" stroke-width="0.5" />

    <!-- Flame -->
    {#if isLit}
      <!-- Outer flame — pulses brighter when loop is heating -->
      <ellipse cx="40" cy="20" rx="12" ry="20"
        fill={loopInFlame ? "rgba(80,150,255,0.7)" : "rgba(60,120,255,0.5)"}
        class="flame-outer" />
      <!-- Inner flame -->
      <ellipse cx="40" cy="18" rx="7" ry="14"
        fill="rgba(100,180,255,0.7)" class="flame-inner" />
      <!-- Core -->
      <ellipse cx="40" cy="22" rx="4" ry="8"
        fill="rgba(180,220,255,0.9)" class="flame-core" />
    {:else}
      <!-- Pilot light -->
      <ellipse cx="40" cy="30" rx="3" ry="5"
        fill="rgba(60,120,255,0.2)" />
    {/if}
  </svg>

  <!-- Temperature progress bar — shows held loop's heat level -->
  {#if wb.isHeldOver(item.id) && wb.isHolding('inoculation-loop') && loopTemp > 0}
    <div class="progress-bar">
      <div class="progress-fill" style:width="{loopTemp * 100}%"></div>
    </div>
  {/if}

  <!-- Hint text -->
  {#if wb.isHeldOver(item.id) && wb.isHolding('inoculation-loop')}
    <span class="heat-hint">
      {#if !isLit}
        Burner is off
      {:else if loopTemp >= STERILIZE_TEMP}
        Sterile — move away to cool
      {:else if loopInFlame}
        Heating…
      {:else}
        Move loop to flame (top)
      {/if}
    </span>
  {/if}
</div>

<style>
  svg {
    width: 60px;
    height: 105px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  .flame-outer {
    animation: flicker 0.2s ease-in-out infinite alternate;
  }
  .flame-inner {
    animation: flicker 0.15s ease-in-out infinite alternate-reverse;
  }
  .flame-core {
    animation: flicker 0.1s ease-in-out infinite alternate;
  }

  @keyframes flicker {
    from { opacity: 0.7; transform: scaleX(0.94); }
    to   { opacity: 1;   transform: scaleX(1.06); }
  }

  .progress-bar {
    width: 48px;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #60a0ff, #ffcc00, #ff6600);
    border-radius: 2px;
    transition: width 0.05s linear;
  }

  .heat-hint {
    font-size: 0.6rem;
    color: rgba(180, 160, 100, 0.7);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
