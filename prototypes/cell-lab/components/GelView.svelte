<script lang="ts">
  import { GEL_LADDER } from '../lib/lab-puzzles';
  import type { GelLane } from '../lib/lab-types';

  interface Props {
    lanes: GelLane[];
    wellCount?: number;
    dragActive?: boolean;
    excisedBands?: Set<string>;
    onexcise?: (laneIndex: number, bandBp: number) => void;
  }

  let { lanes, wellCount = 5, dragActive = false, excisedBands, onexcise }: Props = $props();

  const maxBp = Math.max(...GEL_LADDER);
  const minBp = Math.min(...GEL_LADDER);

  function bandY(bp: number): number {
    const logMax = Math.log(maxBp);
    const logMin = Math.log(minBp);
    const logBp = Math.log(Math.max(bp, minBp));
    return ((logMax - logBp) / (logMax - logMin)) * 100;
  }

  function bandKey(laneIdx: number, bp: number) {
    return `${laneIdx}-${bp}`;
  }

  /** Band thickness varies by size — larger fragments appear slightly thicker */
  function bandHeight(bp: number): number {
    const log = Math.log(bp);
    const logMin = Math.log(100);
    const logMax = Math.log(5000);
    return 2 + 4 * ((log - logMin) / (logMax - logMin));
  }
</script>

<div class="gel-panel">
  <h3 class="panel-title">⚡ Gel Electrophoresis</h3>

  <!-- Wells (loading slots) -->
  <div class="wells-row">
    <div class="well well-ladder">L</div>
    {#each Array(wellCount) as _, i}
      {@const lane = lanes[i]}
      {#if lane}
        <div class="well well-filled">
          <span class="well-text">{lane.label}</span>
        </div>
      {:else}
        <div
          class="well well-empty"
          class:well-highlight={dragActive}
          data-gel-well
        >
          {#if dragActive}
            <span class="well-text drop-hint">↓</span>
          {:else}
            <span class="well-text">{i + 1}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Gel image -->
  <div class="gel-image">
    <div class="gel-inner">
      <!-- Horizontal guide lines spanning full width at ladder positions -->
      {#each GEL_LADDER as size}
        <div class="gel-guide" style:top="{bandY(size)}%"></div>
      {/each}
      <div class="gel-lane">
        {#each GEL_LADDER as size}
          <div class="gel-band" style:top="{bandY(size)}%">
            <span class="band-bp">{size}</span>
            <div class="band-line ladder-line"></div>
          </div>
        {/each}
      </div>
      {#each Array(wellCount) as _, i}
        <div class="gel-lane">
          {#if lanes[i]}
            {#each lanes[i].bands as bp}
              {@const key = bandKey(i, bp)}
              {@const isExcised = excisedBands?.has(key)}
              {#if isExcised}
                <div class="gel-band" style:top="{bandY(bp)}%">
                  <div class="band-line excised-line" style:height="{bandHeight(bp)}px"></div>
                </div>
              {:else}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="gel-band"
                  class:clickable={!!onexcise}
                  style:top="{bandY(bp)}%"
                  onclick={() => onexcise?.(i, bp)}
                  title={onexcise ? `Click to excise band` : undefined}
                >
                  <div class="band-line sample-line" style:height="{bandHeight(bp)}px"></div>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if lanes.length === 0}
    <p class="gel-hint">Drag PCR tubes into the wells above to visualize DNA fragments.</p>
  {/if}
</div>

<style>
  .gel-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 10px;
    flex: 1;
    width: 100%;
  }

  .panel-title {
    font-family: var(--font-heading);
    font-size: 1rem;
    color: var(--parchment);
    margin: 0;
    text-align: center;
  }

  /* Wells */
  .wells-row {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .well {
    width: 54px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .well-ladder {
    background: var(--bg-darkest);
    border: 1px solid var(--brass-dark);
    color: var(--parchment-aged);
    font-weight: 700;
  }

  .well-filled {
    background: var(--bg-darkest);
    border: 1px solid var(--brass);
    color: var(--parchment);
  }

  .well-empty {
    background: transparent;
    border: 1px dashed var(--brass-dark);
    color: var(--parchment-aged);
    opacity: 0.5;
  }

  .well-highlight {
    border-color: var(--brass);
    opacity: 1;
    animation: well-pulse 1s ease-in-out infinite;
  }

  .well-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 48px;
  }

  .drop-hint {
    font-size: 0.85rem;
    color: var(--brass);
  }

  @keyframes well-pulse {
    0%, 100% { box-shadow: 0 0 4px rgba(181, 148, 90, 0.3); }
    50% { box-shadow: 0 0 12px rgba(181, 148, 90, 0.6); }
  }

  /* Gel image */
  .gel-image {
    background: #0a0a0a;
    border: 2px solid var(--brass-dark);
    border-radius: 6px;
    padding: 16px 10px;
    padding-left: 44px;
    flex: 1;
    min-height: 200px;
    display: flex;
  }

  .gel-inner {
    position: relative;
    display: flex;
    gap: 2px;
    flex: 1;
  }

  .gel-guide {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(200, 200, 200, 0.08);
    transform: translateY(-50%);
    pointer-events: none;
  }

  .gel-lane {
    position: relative;
    flex: 1;
  }

  .gel-band {
    position: absolute;
    left: 0;
    width: 100%;
    display: flex;
    align-items: center;
    transform: translateY(-50%);
  }

  .band-bp {
    position: absolute;
    right: 105%;
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(200, 200, 200, 0.65);
    white-space: nowrap;
  }

  .band-line {
    width: 80%;
    margin: 0 10%;
    border-radius: 1px;
  }

  .ladder-line {
    height: 2px;
    background: rgba(200, 200, 200, 0.35);
  }

  .sample-line {
    background: rgba(120, 255, 120, 0.7);
    box-shadow: 0 0 8px rgba(120, 255, 120, 0.3);
  }

  .excised-line {
    background: transparent;
    border: 1px dashed rgba(200, 200, 200, 0.25);
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover .sample-line {
    background: rgba(180, 255, 180, 1);
    box-shadow: 0 0 14px rgba(120, 255, 120, 0.6);
  }

  .gel-hint {
    text-align: center;
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }
</style>
