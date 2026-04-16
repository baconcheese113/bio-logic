<script lang="ts">
  import type { DeskItem, PcrResult, GelResult, ReferenceData } from '../lib/lab-types';
  import { GEL_LADDER } from '../lib/lab-puzzles';

  interface Props {
    items: DeskItem[];
    onmove: (id: string, x: number, y: number) => void;
    ontubegrab: (tubeId: string, e: PointerEvent) => void;
    onanswer: (gene: string) => void;
    onpageflip: (id: string, dir: 1 | -1) => void;
    wrongGuesses: Set<string>;
    maxGuesses: number;
    draggedTubeId?: string | null;
  }

  let { items, onmove, ontubegrab, onanswer, onpageflip, wrongGuesses, maxGuesses, draggedTubeId = null }: Props = $props();

  let deskEl: HTMLDivElement | undefined = $state();
  let dragging = $state<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const guessesLeft = $derived(maxGuesses - wrongGuesses.size);

  function startDrag(id: string, e: PointerEvent) {
    // Don't start drag from interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select')) return;
    const item = items.find(d => d.id === id);
    if (!item || !deskEl) return;

    // PCR tubes with bands are grabbed for instrument loading
    if (item.type === 'pcr-tube' && isPcr(item.data) && item.data.bandSize) {
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

  function isRef(data: DeskItem['data']): data is ReferenceData & { page?: number } {
    return 'geneTable' in data;
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
          {item.type === 'pcr-tube' ? '🧪' : item.type === 'gel-photo' ? '⚡' : item.type === 'reference-book' ? '📖' : '📝'}
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
                  <div class="gel-band sample-band" style:top="{bandY(bp)}%" title="{bp} bp"></div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Reference Book pages -->
      {#if item.type === 'reference-book' && isRef(item.data)}
        {@const page = (item.data as ReferenceData & { page?: number }).page ?? 0}
        {@const perPage = 12}
        {@const totalPages = Math.ceil(item.data.geneTable.length / perPage)}
        {@const pageGenes = item.data.geneTable.slice(page * perPage, (page + 1) * perPage)}
        <div class="card-body book-card">
          <div class="book-page">
            {#if item.data.notes && page === 0}
              <div class="book-notes">
                {#each item.data.notes as note}
                  <p class="book-note">📌 {note}</p>
                {/each}
              </div>
              <hr class="book-divider" />
            {/if}
            <table class="gene-tbl">
              <thead><tr><th>Gene</th><th>bp</th></tr></thead>
              <tbody>
                {#each pageGenes as gene}
                  <tr><td>{gene.name}</td><td>{gene.length}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="page-nav">
            <button class="page-btn" disabled={page <= 0} onclick={() => onpageflip(item.id, -1)}>◀</button>
            <span class="page-num">p. {page + 1} / {totalPages}</span>
            <button class="page-btn" disabled={page >= totalPages - 1} onclick={() => onpageflip(item.id, 1)}>▶</button>
          </div>
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

  /* Book card */
  .book-card {
    background: #f5f0e0;
    border-radius: 0 0 6px 6px;
    padding: 0;
    overflow: hidden;
  }

  .book-page {
    padding: 12px 14px 8px;
    min-height: 180px;
    background:
      linear-gradient(to right, rgba(0,0,0,0.05) 0%, transparent 3%, transparent 97%, rgba(0,0,0,0.05) 100%),
      repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.04) 23px, rgba(0,0,0,0.04) 24px);
  }

  .book-divider {
    border: none;
    border-top: 1px solid rgba(0,0,0,0.12);
    margin: 6px 0;
  }

  .book-notes {
    margin-bottom: 4px;
  }

  .book-note {
    font-size: 0.7rem;
    color: #5a4a3a;
    margin: 0 0 4px;
    line-height: 1.5;
    font-style: italic;
    font-family: var(--font-body);
  }

  .gene-tbl {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.7rem;
  }

  .gene-tbl th {
    text-align: left;
    color: #6a5a4a;
    border-bottom: 1px solid rgba(0,0,0,0.15);
    padding: 2px 6px;
    font-size: 0.65rem;
    font-weight: 700;
  }

  .gene-tbl td {
    padding: 2px 6px;
    color: #2a2a2a;
  }

  .gene-tbl tbody tr:nth-child(even) {
    background: rgba(0, 0, 0, 0.03);
  }

  .page-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 6px 0;
    background: #e8e0d0;
    border-top: 1px solid rgba(0,0,0,0.1);
  }

  .page-btn {
    background: #d8d0c0;
    border: 1px solid rgba(0,0,0,0.15);
    color: #5a4a3a;
    padding: 3px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .page-btn:hover:not(:disabled) {
    background: #c8c0b0;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .page-num {
    font-family: var(--font-body);
    font-size: 0.7rem;
    color: #6a5a4a;
    font-style: italic;
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
