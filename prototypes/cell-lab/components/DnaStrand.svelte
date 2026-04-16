<script lang="ts">
  import { PARTS_MAP } from '../lib/parts';

  interface Props {
    strand: (string | null)[];
    onupdate: (strand: (string | null)[]) => void;
    disabled?: boolean;
    scanIndex?: number;
    readonly?: boolean;
    hiddenGenes?: boolean;
  }

  let { strand, onupdate, disabled = false, scanIndex = -1, readonly: isReadonly = false, hiddenGenes = false }: Props = $props();

  let dragOverIndex = $state<number | null>(null);
  let dragSourceIndex = $state<number | null>(null);

  function handleDragStart(e: DragEvent, index: number) {
    if (disabled || isReadonly || !e.dataTransfer) return;
    dragSourceIndex = index;
    e.dataTransfer.setData('text/plain', strand[index]!);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: DragEvent, index: number) {
    if (disabled || isReadonly) return;
    // Allow drop on empty slots (from library) or any slot (for reorder)
    if (dragSourceIndex === null && strand[index] !== null) return;
    e.preventDefault();
    dragOverIndex = index;
  }

  function handleDrop(e: DragEvent, index: number) {
    if (disabled || isReadonly) return;
    e.preventDefault();
    dragOverIndex = null;
    const next = [...strand];

    if (dragSourceIndex !== null) {
      // Reorder: swap source and target
      [next[dragSourceIndex], next[index]] = [next[index], next[dragSourceIndex]];
      dragSourceIndex = null;
      onupdate(next);
      return;
    }

    // Drop from library
    const partId = e.dataTransfer?.getData('text/plain');
    if (!partId || !PARTS_MAP.has(partId)) return;
    next[index] = partId;
    onupdate(next);
  }

  function handleDragEnd() {
    dragSourceIndex = null;
    dragOverIndex = null;
  }

  function removePart(index: number) {
    if (disabled || isReadonly) return;
    const next = [...strand];
    next[index] = null;
    onupdate(next);
  }
</script>

<div class="strand-editor">
  <!-- 5'→3' direction label -->
  <span class="direction-label">5′</span>

  <div class="backbone">
    {#each strand as partId, i}
      <button
        class="slot"
        class:occupied={partId !== null}
        class:drag-over={dragOverIndex === i}
        class:drag-source={dragSourceIndex === i}
        class:disabled
        class:scan-active={scanIndex === i}
        class:scan-passed={scanIndex > i && scanIndex >= 0}
        style:--c={partId ? PARTS_MAP.get(partId)?.color : undefined}
        draggable={!!partId && !disabled && !isReadonly}
        ondragstart={(e) => handleDragStart(e, i)}
        ondragover={(e) => handleDragOver(e, i)}
        ondragleave={() => { dragOverIndex = null; }}
        ondrop={(e) => handleDrop(e, i)}
        ondragend={handleDragEnd}
        onclick={() => partId && removePart(i)}
        title={partId ? `${PARTS_MAP.get(partId)?.name} — drag to reorder, click to remove` : `Slot ${i + 1} — drop a part here`}
      >
        {#if partId}
          {@const part = PARTS_MAP.get(partId)}
          {@const hideLabel = hiddenGenes && part?.category === 'gene'}
          <div class="part-chip" style:--c={hideLabel ? '#9ca3af' : part?.color}>
            <span class="chip-cat">{hideLabel ? '???' : part?.category.slice(0, 4)}</span>
            <span class="chip-label">{hideLabel ? '?' : part?.label}</span>
          </div>
        {:else}
          <span class="slot-num">{i + 1}</span>
        {/if}
      </button>

      {#if i < strand.length - 1}
        <div class="connector"></div>
      {/if}
    {/each}
  </div>

  <span class="direction-label">3′</span>
</div>

<style>
  .strand-editor {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .direction-label {
    font-family: var(--font-mono);
    color: var(--brass);
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .backbone {
    display: flex;
    align-items: center;
    gap: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .connector {
    width: 18px;
    height: 3px;
    background: var(--brass-dark);
    flex-shrink: 0;
  }

  .slot {
    width: 72px;
    height: 64px;
    border: 2px dashed var(--brass-dark);
    border-radius: 8px;
    background: var(--bg-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    flex-shrink: 0;
    padding: 0;
    color: inherit;
    font: inherit;
  }

  .slot:hover:not(.disabled) {
    border-color: var(--brass-light);
  }

  .slot.drag-over {
    border-color: var(--brass);
    background: var(--bg-light);
  }

  .slot.occupied {
    border-style: solid;
    border-color: var(--brass-dark);
    cursor: pointer;
  }

  .slot.occupied:hover:not(.disabled) {
    border-color: var(--status-error);
  }

  .slot.drag-source {
    opacity: 0.35;
  }

  .slot.disabled {
    opacity: 0.6;
    cursor: default;
  }

  .slot-num {
    color: var(--parchment-aged);
    opacity: 0.3;
    font-size: 0.8rem;
  }

  /* Transcription scan animation */
  .slot.scan-active {
    border-color: var(--brass-light);
    box-shadow: 0 0 14px 3px var(--brass-light);
    transition: box-shadow 0.1s, border-color 0.1s;
  }

  .slot.scan-active.occupied {
    box-shadow: 0 0 14px 3px var(--c, var(--brass-light));
    border-color: var(--c, var(--brass-light));
  }

  .slot.scan-passed {
    opacity: 0.55;
    transition: opacity 0.3s;
  }

  .part-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: var(--c);
  }

  .chip-cat {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .chip-label {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.95rem;
  }
</style>
