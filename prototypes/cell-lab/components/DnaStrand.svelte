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
  let dragOverGap = $state<number | null>(null);
  let shakeGap = $state<number | null>(null);

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

  function handleGapDragOver(e: DragEvent, gapIndex: number) {
    if (disabled || isReadonly) return;
    e.preventDefault();
    dragOverGap = gapIndex;
  }

  function handleGapDrop(e: DragEvent, gapIndex: number) {
    if (disabled || isReadonly) return;
    e.preventDefault();
    dragOverGap = null;

    if (dragSourceIndex !== null) {
      // Reorder via gap: remove from source, insert at gap position
      const partId = strand[dragSourceIndex];
      if (!partId) return;
      const next = [...strand];
      next[dragSourceIndex] = null;
      // Compact: remove the null we just created, then splice the part at gapIndex
      const compacted: (string | null)[] = next.filter(p => p !== null);
      const insertAt = Math.min(gapIndex, compacted.length);
      compacted.splice(insertAt, 0, partId);
      // Pad back to original length with nulls
      while (compacted.length < strand.length) compacted.push(null);
      dragSourceIndex = null;
      onupdate(compacted as (string | null)[]);
      return;
    }

    // Drop from library into gap
    const partId = e.dataTransfer?.getData('text/plain');
    if (!partId || !PARTS_MAP.has(partId)) return;

    // Need at least one null to make room
    const nullIdx = strand.lastIndexOf(null);
    if (nullIdx === -1) {
      // Full — shake
      shakeGap = gapIndex;
      setTimeout(() => shakeGap = null, 400);
      return;
    }

    // Remove the rightmost null, then splice part at gapIndex
    const next = [...strand];
    next.splice(nullIdx, 1);
    next.splice(gapIndex, 0, partId);
    onupdate(next);
  }

  function handleDragEnd() {
    dragSourceIndex = null;
    dragOverIndex = null;
    dragOverGap = null;
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
      <!-- Insert gap before each slot -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="insert-gap"
        class:gap-active={dragOverGap === i}
        class:gap-shake={shakeGap === i}
        ondragover={(e) => handleGapDragOver(e, i)}
        ondragleave={() => { dragOverGap = null; }}
        ondrop={(e) => handleGapDrop(e, i)}
      ></div>

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


    {/each}

    <!-- Trailing insert gap after last slot -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="insert-gap"
      class:gap-active={dragOverGap === strand.length}
      class:gap-shake={shakeGap === strand.length}
      ondragover={(e) => handleGapDragOver(e, strand.length)}
      ondragleave={() => { dragOverGap = null; }}
      ondrop={(e) => handleGapDrop(e, strand.length)}
    ></div>
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



  /* ── Insert gap drop zones ────────────────────── */
  .insert-gap {
    width: 22px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 4px;
    cursor: default;
    transition: width 0.2s, background 0.2s, border-color 0.2s;
    position: relative;
  }

  .insert-gap::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--brass-dark);
    transform: translateY(-50%);
    pointer-events: none;
  }

  .insert-gap:hover {
    width: 28px;
    background: rgba(207, 174, 110, 0.1);
  }

  .insert-gap.gap-active {
    width: 32px;
    background: rgba(207, 174, 110, 0.25);
    border: 1px dashed var(--brass);
  }

  .insert-gap.gap-shake {
    animation: shake 0.35s ease;
    background: rgba(239, 68, 68, 0.2);
    border: 1px dashed var(--status-error);
    width: 32px;
  }

  @keyframes shake {
    0%, 100% { translate: 0; }
    20% { translate: -3px; }
    40% { translate: 3px; }
    60% { translate: -2px; }
    80% { translate: 2px; }
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
    transition: border-color 0.35s, background 0.35s, box-shadow 0.35s, opacity 0.35s;
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
    box-shadow: 0 0 8px 1px rgba(207, 174, 110, 0.15);
    cursor: pointer;
  }

  .slot.occupied:hover:not(.disabled) {
    border-color: var(--status-error);
  }

  .slot.drag-source {
    opacity: 0.35;
    transition: opacity 0.1s;
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
