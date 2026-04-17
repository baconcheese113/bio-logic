<script lang="ts">
  import type { DeskItem, PcrResult, GelResult, ExcisedBandData } from '../lib/lab-types';
  import { GEL_LADDER } from '../lib/lab-puzzles';

  interface Props {
    items: DeskItem[];
    onmove: (id: string, x: number, y: number) => void;
    ontubegrab: (tubeId: string, e: PointerEvent) => void;
    onanswer: (gene: string) => void;
    onbookopen: (id: string) => void;
    wrongGuesses: Set<string>;
    maxGuesses: number;
    draggedTubeId?: string | null;
  }

  let { items, onmove, ontubegrab, onanswer, onbookopen, wrongGuesses, maxGuesses, draggedTubeId = null }: Props = $props();

  let deskEl: HTMLDivElement | undefined = $state();
  let dragging = $state<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const guessesLeft = $derived(maxGuesses - wrongGuesses.size);

  function startDrag(id: string, e: PointerEvent) {
    // Don't start drag from interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select')) return;
    const item = items.find(d => d.id === id);
    if (!item || !deskEl) return;

    // PCR tubes with bands and excised bands are grabbed for instrument loading / repositioning
    if (item.type === 'pcr-tube' && isPcr(item.data) && item.data.bandSize) {
      ontubegrab(item.id, e);
      return;
    }
    if (item.type === 'excised-band') {
      ontubegrab(item.id, e);
      return;
    }

    const rect = deskEl.getBoundingClientRect();
    dragging = { id, offsetX: e.clientX - rect.left - item.x, offsetY: e.clientY - rect.top - item.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !deskEl) return;
    const rect = deskEl.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragging.offsetX);
    const y = Math.max(0, e.clientY - rect.top - dragging.offsetY);
    onmove(dragging.id, x, y);
  }

  function onPointerUp() {
    dragging = null;
  }

  function isPcr(data: DeskItem['data']): data is PcrResult {
    return 'bandSize' in data || 'failReason' in data;
  }

  function isGel(data: DeskItem['data']): data is GelResult {
    return 'lanes' in data && 'ladder' in data;
  }

  function isExcised(data: DeskItem['data']): data is ExcisedBandData {
    return 'bandBp' in data && 'sequence' in data;
  }

  function isAnswerSheet(data: DeskItem['data']): data is { genes: string[] } {
    return 'genes' in data;
  }

  // Gel band position helper (log scale)
  const maxBp = Math.max(...GEL_LADDER);
  const minBp = Math.min(...GEL_LADDER);
  function bandY(bp: number): number {
    const logMax = Math.log(maxBp);
    const logMin = Math.log(minBp);
    const logBp = Math.log(Math.max(bp, minBp));
    return (1 - (logBp - logMin) / (logMax - logMin)) * 100;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="desk"
  bind:this={deskEl}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
>
  {#each items as item (item.id)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="desk-item"
      class:dragging={dragging?.id === item.id}
      class:dragged-away={draggedTubeId === item.id}
      style:left="{item.x}px"
      style:top="{item.y}px"
      onpointerdown={(e) => startDrag(item.id, e)}
    >
      <!-- Title bar -->
      <div class="item-title-bar">
        <span class="item-icon">
          {item.type === 'pcr-tube' ? '🧪' : item.type === 'gel-photo' ? '⚡' : item.type === 'reference-book' ? '📖' : item.type === 'excised-band' ? '🔬' : '📝'}
        </span>
        <span class="item-label">{item.label}</span>
      </div>

      <!-- PCR Tube card -->
      {#if item.type === 'pcr-tube' && isPcr(item.data)}
        <div class="card-body pcr-card">
          {#if item.data.bandSize}
            <span class="pcr-status">Amplified DNA</span>
          {:else}
            <span class="pcr-fail">✗ {item.data.failReason}</span>
          {/if}
        </div>
      {/if}

      <!-- Gel Photo card -->
      {#if item.type === 'gel-photo' && isGel(item.data)}
        <div class="card-body gel-card">
          <div class="mini-gel">
            <div class="gel-lane ladder">
              {#each item.data.ladder as size}
                <div class="gel-band ladder-band" style:top="{bandY(size)}%">
                  <span class="gel-bp">{size}</span>
                </div>
              {/each}
            </div>
            {#each item.data.lanes as lane}
              <div class="gel-lane sample">
                <span class="lane-lbl">{lane.label}</span>
                {#each lane.bands as bp}
                  <div class="gel-band sample-band" style:top="{bandY(bp)}%"></div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Reference Book (closed card — click to open) -->
      {#if item.type === 'reference-book'}
        <div class="card-body book-closed">
          <button
            class="book-open-btn"
            onpointerdown={(e) => e.stopPropagation()}
            onclick={() => onbookopen(item.id)}
          >Open Reference Book</button>
        </div>
      {/if}

      <!-- Excised Band card -->
      {#if item.type === 'excised-band' && isExcised(item.data)}
        <div class="card-body pcr-card">
          <span class="pcr-status">Excised gel band</span>
        </div>
      {/if}

      <!-- Answer Sheet -->
      {#if item.type === 'answer-sheet' && isAnswerSheet(item.data)}
        <div class="card-body answer-card">
          <p class="answer-prompt">Identify the insert gene ({guessesLeft} guess{guessesLeft === 1 ? '' : 'es'} left):</p>
          <div class="gene-grid">
            {#each item.data.genes as gene}
              <button
                class="gene-btn"
                class:wrong={wrongGuesses.has(gene)}
                disabled={wrongGuesses.has(gene) || guessesLeft <= 0}
                onclick={() => onanswer(gene)}
              >{wrongGuesses.has(gene) ? '✗' : ''} {gene}</button>
            {/each}
          </div>
          {#if guessesLeft <= 0}
            <p class="guesses-exhausted">No guesses remaining. Reset the puzzle to try again.</p>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if items.length === 0}
    <p class="desk-empty">Run an instrument to see results here. Drag items to arrange them.</p>
  {/if}
</div>

<style>
  .desk {
    position: relative;
    flex: 1;
    background:
      linear-gradient(var(--bg-medium) 1px, transparent 1px),
      linear-gradient(90deg, var(--bg-medium) 1px, transparent 1px);
    background-size: 40px 40px;
    background-color: var(--bg-darkest);
    border-top: 2px solid var(--brass-dark);
    overflow: hidden;
    touch-action: none;
    min-height: 0;
  }

  .desk-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--parchment-aged);
    font-style: italic;
    font-size: 0.85rem;
    pointer-events: none;
    margin: 0;
  }

  .desk-item {
    position: absolute;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    cursor: grab;
    user-select: none;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
    min-width: 140px;
    max-width: 280px;
  }

  .desk-item.dragging {
    cursor: grabbing;
    z-index: 50;
    box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.6);
  }

  .desk-item.dragged-away {
    opacity: 0.3;
    pointer-events: none;
  }

  .item-title-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-medium);
    border-bottom: 1px solid var(--brass-dark);
    border-radius: 6px 6px 0 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--parchment);
  }

  .card-body {
    padding: 8px 10px;
  }

  /* PCR card */
  .pcr-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .pcr-status {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: #22c55e;
  }

  .pcr-fail {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: #f87171;
  }


  /* Gel card */
  .mini-gel {
    display: flex;
    gap: 2px;
    background: #111;
    border-radius: 4px;
    padding: 4px 6px;
    height: 160px;
  }

  .gel-lane {
    position: relative;
    flex: 1;
    min-width: 36px;
  }

  .lane-lbl {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    color: var(--parchment-aged);
    text-align: center;
    display: block;
    margin-bottom: 2px;
  }

  .gel-band {
    position: absolute;
    left: 10%;
    width: 80%;
    height: 3px;
    border-radius: 1px;
    transform: translateY(-50%);
  }

  .ladder-band {
    background: rgba(200, 200, 200, 0.4);
    height: 2px;
  }

  .gel-bp {
    position: absolute;
    right: 105%;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 0.45rem;
    color: rgba(200, 200, 200, 0.5);
    white-space: nowrap;
  }

  .sample-band {
    background: rgba(120, 255, 120, 0.7);
    height: 4px;
    box-shadow: 0 0 6px rgba(120, 255, 120, 0.3);
  }

  /* Book closed card */
  .book-closed {
    display: flex;
    justify-content: center;
    padding: 10px;
  }

  .book-open-btn {
    background: #d8c6a0;
    border: 1px solid rgba(120, 90, 40, 0.4);
    color: #3a2a18;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: Georgia, serif;
  }

  .book-open-btn:hover {
    background: #c8b690;
  }

  /* Answer sheet */
  .answer-card {
    max-height: 240px;
    overflow-y: auto;
  }

  .answer-prompt {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    color: var(--parchment);
    margin: 0 0 6px;
  }

  .gene-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .gene-btn {
    padding: 3px 8px;
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    background: var(--bg-medium);
    color: var(--parchment);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    cursor: pointer;
    transition: all 0.1s;
  }

  .gene-btn:hover:not(:disabled) {
    border-color: var(--brass);
    background: var(--brass-dark);
    color: var(--parchment);
  }

  .gene-btn.wrong {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
    opacity: 0.5;
    text-decoration: line-through;
  }

  .gene-btn:disabled:not(.wrong) {
    opacity: 0.3;
    cursor: default;
  }

  .guesses-exhausted {
    font-size: 0.7rem;
    color: #f87171;
    margin: 8px 0 0;
    font-style: italic;
  }
</style>
