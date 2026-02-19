<!--
  SampleVialItem.svelte — Patient sample vial on the workbench grid.

  Dipping physics:
    Hold sterile loop over vial + apply pressure (Shift) to dip into the sample.
    The pressure threshold represents physically pushing the loop into the liquid.
    Once pressure crosses DIP_THRESHOLD, inoculum loads instantly (single event).
-->
<script lang="ts">
  import type { Item, SampleType } from '../../../../shared/types';
  import { SAMPLE_COLORS } from '../../../../shared/types';
  import { getWorkbench } from '../workbench-context.svelte';

  interface Props { item: Item; }
  let { item }: Props = $props();

  const wb = getWorkbench();

  const sampleColor = $derived(
    item.contents?.substance && item.contents.substance in SAMPLE_COLORS
      ? SAMPLE_COLORS[item.contents.substance as SampleType]
      : '#c4a35a'
  );

  const heldLoopState = $derived.by(() => {
    const h = wb.heldItem;
    if (!h?.state || h.state.kind !== 'inoculation-loop') return null;
    return h.state;
  });

  // True when a sterile empty loop is held anywhere — guides the player to bring it here
  const needsDip = $derived(
    heldLoopState !== null &&
    heldLoopState.isSterile &&
    heldLoopState.volume === 0 &&
    item.contents !== undefined
  );

  const canDip = $derived(
    wb.isHeldOver(item.id) && needsDip
  );

  // Pressure threshold to trigger a dip — moderate press required
  const DIP_THRESHOLD = 0.3;

  const isDipping = $derived(canDip && wb.pressureLevel >= DIP_THRESHOLD);

  // Fire once when pressure crosses the threshold while conditions are met.
  // The $effect resets automatically because canDip becomes false once inoculumLevel > 0.
  let hasDipped = false;
  $effect(() => {
    if (!canDip) {
      hasDipped = false;
      return;
    }
    if (hasDipped || !isDipping || !wb.heldItemId || !item.contents) return;
    hasDipped = true;

    wb.mutateItem(wb.heldItemId, (loop) => {
      loop.state = {
        kind: 'inoculation-loop',
        volume: 1.0,
        concentration: 1.0,
        temperature: loop.state?.kind === 'inoculation-loop' ? loop.state.temperature : 0,
        isSterile: true,
      };
    });
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col items-center gap-1 p-1" class:can-dip={canDip} class:needs-dip={needsDip && !canDip}>
  <svg viewBox="0 0 40 100">
    <!-- Cap -->
    <rect x="13" y="2" width="14" height="8" rx="2"
      fill="#555" stroke="#444" stroke-width="0.5" />
    <!-- Tube body -->
    <rect x="14" y="10" width="12" height="55" rx="1"
      fill="rgba(200,220,240,0.25)" stroke="rgba(150,170,190,0.5)" stroke-width="0.8" />
    <!-- Sample liquid -->
    {#if item.contents}
      {@const fillH = item.contents.volume * 40}
      <rect x="15" y={63 - fillH} width="10" height={fillH} rx="0.5"
        fill={sampleColor} opacity="0.85" />
    {/if}
    <!-- Tube bottom (rounded) -->
    <path d="M14 65 Q14 72 20 72 Q26 72 26 65"
      fill="rgba(200,220,240,0.2)" stroke="rgba(150,170,190,0.4)" stroke-width="0.5" />
    <!-- Graduation marks -->
    {#each [25, 35, 45, 55] as y}
      <line x1="14" y1={y} x2="16" y2={y} stroke="rgba(150,170,190,0.3)" stroke-width="0.3" />
    {/each}

    <!-- Dip ripple when pressure threshold crossed -->
    {#if isDipping}
      <ellipse cx="20" cy={63 - (item.contents?.volume ?? 0) * 40} rx="5" ry="1.5"
        fill="none" stroke={sampleColor} stroke-width="0.8" opacity="0.6" class="ripple" />
    {/if}
  </svg>

  {#if canDip}
    <span class="dip-hint">
      {isDipping ? 'Dipping…' : 'Hold Shift to dip'}
    </span>
  {:else if needsDip}
    <span class="dip-hint needs">Dip loop here</span>
  {/if}
</div>

<style>
  svg {
    width: 30px;
    height: 75px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  .can-dip {
    animation: glow-pulse 0.8s ease-in-out infinite alternate;
  }

  .needs-dip {
    animation: glow-pulse-soft 1.2s ease-in-out infinite alternate;
  }

  @keyframes glow-pulse-soft {
    from { filter: drop-shadow(0 0 3px rgba(255, 200, 80, 0.2)); }
    to   { filter: drop-shadow(0 0 7px rgba(255, 200, 80, 0.5)); }
  }

  @keyframes glow-pulse {
    from { filter: drop-shadow(0 0 4px rgba(100, 180, 255, 0.2)); }
    to   { filter: drop-shadow(0 0 8px rgba(100, 180, 255, 0.5)); }
  }

  .dip-hint {
    font-size: 0.65rem;
    color: rgba(100, 180, 255, 0.8);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
  }

  .dip-hint.needs {
    color: rgba(255, 200, 80, 0.85);
  }

  .ripple {
    animation: ripple-out 0.4s ease-out infinite;
  }

  @keyframes ripple-out {
    from { rx: 3; opacity: 0.8; }
    to   { rx: 6; opacity: 0; }
  }
</style>
