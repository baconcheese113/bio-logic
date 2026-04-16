<script lang="ts">
  import { GEL_LADDER } from '../lib/lab-puzzles';
  import type { GelLane } from '../lib/lab-types';

  interface Props {
    lanes: GelLane[];
    wellCount?: number;
    dragActive?: boolean;
  }

  let { lanes, wellCount = 5, dragActive = false }: Props = $props();

  const maxBp = Math.max(...GEL_LADDER);
  const minBp = Math.min(...GEL_LADDER);

  function bandY(bp: number): number {
    const logMax = Math.log(maxBp);
    const logMin = Math.log(minBp);
    const logBp = Math.log(Math.max(bp, minBp));
    return ((logMax - logBp) / (logMax - logMin)) * 100;
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
            <div class="gel-band" style:top="{bandY(bp)}%">
              <div class="band-line sample-line"></div>
            </div>
          {/each}
        {/if}
      </div>
    {/each}
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
    font-size: 0.6rem;
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
    display: flex;
    gap: 2px;
    background: #0a0a0a;
    border: 2px solid var(--brass-dark);
    border-radius: 6px;
    padding: 16px 10px;
    flex: 1;
    min-height: 200px;
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
    font-size: 0.45rem;
    color: rgba(200, 200, 200, 0.4);
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
    height: 4px;
    background: rgba(120, 255, 120, 0.7);
    box-shadow: 0 0 8px rgba(120, 255, 120, 0.3);
  }

  .gel-hint {
    text-align: center;
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }
</style>
