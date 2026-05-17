<script lang="ts">
  import type { BioPart } from '../lib/types';

  type PartLike = { id: string; name: string; label: string; color: string; description: string; category?: string; type?: string; count?: number };

  interface Props {
    parts: (BioPart | PartLike)[];
    disabled?: boolean;
    onadd?: (partId: string) => void;
    compact?: boolean;
  }

  let { parts, disabled = false, onadd, compact = false }: Props = $props();

  function handleDragStart(e: DragEvent, partId: string) {
    if (disabled || !e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', partId);
    e.dataTransfer.effectAllowed = 'copy';
  }

  const categoryIcon: Record<string, string> = {
    promoter: '→',
    gene: '◆',
    linker: 'L',
    terminator: '⊣',
    rbs: 'R',
    tag: 'T',
    crispr: '✂',
    enhancer: '⬡',
    insulator: '|',
    'signal-sequence': 'S',
  };

  function getKind(p: PartLike): string {
    return (p as BioPart).category ?? (p as PartLike).type ?? '';
  }
</script>

<div class="library">
  <h3 class="library-title">Parts Library</h3>
  <div class="parts-list">
    {#each parts as part}
      <button
        class="lib-part"
        class:compact
        class:disabled
        draggable={!disabled}
        ondragstart={(e) => handleDragStart(e, part.id)}
        onclick={() => !disabled && onadd?.(part.id)}
        style:--c={part.color}
        title={part.description}
      >
        <span class="part-icon">{categoryIcon[getKind(part)] ?? '?'}</span>
        <div class="part-text">
          <span class="part-label">{part.label}</span>
          <span class="part-name" class:compact>{part.name}</span>
        </div>
        {#if part.count !== undefined && part.count > 1}
          <span class="count-badge">×{part.count}</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .library {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .library-title {
    font-family: var(--font-heading);
    color: var(--parchment);
    font-size: 0.85rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .parts-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lib-part {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--bg-light);
    border-left: 3px solid var(--c);
    border-radius: 6px;
    background: var(--bg-medium);
    cursor: grab;
    transition: border-color 0.15s, background 0.15s;
    user-select: none;
    color: inherit;
    font: inherit;
    text-align: left;
    width: 100%;
  }

  .lib-part.compact {
    padding: 7px 10px;
    gap: 8px;
  }

  .lib-part:hover:not(.disabled) {
    border-color: var(--c);
    background: var(--bg-light);
  }

  .lib-part:focus {
    outline: none;
  }

  .lib-part:focus-visible {
    outline: 2px solid var(--brass);
    outline-offset: 1px;
  }

  .lib-part:active:not(.disabled) {
    cursor: grabbing;
  }

  .lib-part.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .part-icon {
    font-size: 1.1rem;
    color: var(--c);
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .part-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .part-label {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--c);
    font-size: 0.85rem;
  }

  .part-name {
    color: var(--parchment-aged);
    font-size: 0.72rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .part-name.compact {
    font-size: 0.69rem;
    opacity: 0.9;
  }

  .count-badge {
    margin-left: auto;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--parchment-aged);
    background: var(--bg-light);
    border: 1px solid var(--bg-light);
    border-radius: 4px;
    padding: 1px 5px;
    flex-shrink: 0;
  }
</style>
