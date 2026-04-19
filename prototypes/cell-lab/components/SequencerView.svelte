<script lang="ts">
  import type { ExcisedBandData } from '../lib/lab-types';

  interface Props {
    loadedBand: ExcisedBandData | null;
    dragActive?: boolean;
  }

  let { loadedBand, dragActive = false }: Props = $props();

  const BASES = ['A', 'T', 'G', 'C'] as const;
  const BASE_COLORS: Record<string, string> = {
    A: '#22c55e',
    T: '#ef4444',
    G: '#a3a3a3',
    C: '#3b82f6',
  };

  let calledBases = $state<string[]>([]);

  /**
   * Build lane data: for each base (A/T/G/C), find positions in
   * the sequence where that base occurs. Each position maps to
   * a vertical location on the gel (lower position = shorter fragment = bottom).
   */
  const lanes = $derived.by(() => {
    if (!loadedBand) return [];
    const seq = loadedBand.sequence;
    return BASES.map(base => ({
      base,
      color: BASE_COLORS[base],
      /** Sequence positions (0-indexed) where this base occurs */
      positions: seq.split('').reduce<number[]>((acc, ch, i) => {
        if (ch === base) acc.push(i);
        return acc;
      }, []),
    }));
  });

  /** The next expected position in the sequence (lowest uncalled) */
  const nextPosition = $derived(calledBases.length);

  function callBand(base: string, position: number) {
    if (position !== nextPosition) return;
    calledBases = [...calledBases, base];
  }

  function undoBase() {
    calledBases = calledBases.slice(0, -1);
  }

  function clearBases() {
    calledBases = [];
  }

  function handleGelKeydown(e: KeyboardEvent) {
    if (!loadedBand) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      undoBase();
      return;
    }

    const upper = e.key.toUpperCase();
    if (upper === 'A' || upper === 'T' || upper === 'G' || upper === 'C') {
      e.preventDefault();
      callBand(upper, nextPosition);
    }
  }

  /** Convert a sequence position to a vertical % (0=top, 100=bottom).
   *  Position 0 (shortest fragment) is at the bottom, last position at top. */
  function bandTop(position: number, total: number): number {
    return (1 - position / (total - 1)) * 100;
  }

  const isDone = $derived(loadedBand ? calledBases.length >= loadedBand.sequence.length : false);
</script>

<div class="seq-panel">
  <h3 class="panel-title">🧬 Sanger Sequencer</h3>

  <!-- Input slot -->
  <div
    class="seq-input"
    class:seq-highlight={dragActive}
    data-seq-well
  >
    {#if loadedBand}
      <span class="seq-loaded">✓ Sample loaded — {loadedBand.sourceLabel}</span>
    {:else if dragActive}
      <span class="seq-drop">↓ Drop excised band here</span>
    {:else}
      <span class="seq-empty">Excise a band from the gel, then drag it here</span>
    {/if}
  </div>

  {#if loadedBand}
    <p class="seq-hint">Read bottom-to-top. Press A/T/G/C to call bases, Backspace to undo, or click bands directly.</p>

    <!-- 4-lane Sanger gel -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="sanger-gel-wrap"
      role="application"
      aria-label="Sanger gel keyboard controls"
      tabindex="0"
      onkeydown={handleGelKeydown}
    >
      <div class="sanger-gel">
        {#each lanes as lane}
          <div class="sanger-lane">
            <div class="lane-header" style:color={lane.color}>{lane.base}</div>
            <div class="lane-track">
              {#each lane.positions as pos}
                {@const top = bandTop(pos, loadedBand.sequence.length)}
                {@const isCalled = pos < nextPosition}
                {@const isNext = pos === nextPosition}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="sanger-band"
                  class:called={isCalled}
                  class:next={isNext}
                  style:top="{top}%"
                  style:background={lane.color}
                  onclick={() => callBand(lane.base, pos)}
                ></div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Position marker showing where the read cursor is -->
      {#if !isDone}
        <div
          class="read-cursor"
          style:top="{bandTop(nextPosition, loadedBand.sequence.length)}%"
        ></div>
      {/if}
    </div>

    <!-- Controls -->
    <div class="call-controls">
      <div class="call-actions">
        <button class="call-action-btn" onclick={undoBase} disabled={calledBases.length === 0}>⌫ Undo</button>
        <button class="call-action-btn" onclick={clearBases} disabled={calledBases.length === 0}>✕ Clear</button>
      </div>
    </div>

    <!-- Called sequence display -->
    {#if calledBases.length > 0}
      <div class="called-seq">
        <span class="called-label">Called ({calledBases.length}/{loadedBand.sequence.length}):</span>
        <code class="called-text">
          {#each calledBases as base}<span style:color={BASE_COLORS[base]}>{base}</span>{/each}
        </code>
      </div>
    {/if}
  {:else}
    <div class="seq-placeholder">
      <p>No sample loaded. Load a gel-excised band to run sequencing reactions.</p>
    </div>
  {/if}
</div>

<style>
  .seq-panel {
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

  .seq-hint {
    font-family: var(--font-body);
    font-size: 0.7rem;
    color: var(--parchment-aged);
    font-style: italic;
    text-align: center;
    margin: 0;
  }

  .seq-input {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border: 1px dashed var(--brass-dark);
    border-radius: 6px;
    min-height: 36px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--parchment-aged);
    opacity: 0.6;
  }

  .seq-highlight {
    border-color: var(--brass);
    opacity: 1;
    animation: seq-pulse 1s ease-in-out infinite;
  }

  @keyframes seq-pulse {
    0%, 100% { box-shadow: 0 0 4px rgba(181, 148, 90, 0.3); }
    50% { box-shadow: 0 0 12px rgba(181, 148, 90, 0.6); }
  }

  .seq-loaded { color: var(--parchment); opacity: 1; }
  .seq-drop { color: var(--brass); }
  .seq-empty { opacity: 0.8; font-style: italic; }

  /* 4-lane Sanger gel */
  .sanger-gel-wrap {
    position: relative;
    flex: 1;
    min-height: 300px;
    outline: none;
  }

  .sanger-gel-wrap:focus-visible {
    box-shadow: 0 0 0 2px rgba(181, 148, 90, 0.6);
    border-radius: 8px;
  }

  .sanger-gel {
    display: flex;
    gap: 2px;
    height: 100%;
    background: #0a0a0a;
    border: 2px solid var(--brass-dark);
    border-radius: 6px;
    padding: 4px;
  }

  .sanger-lane {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .lane-header {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .lane-track {
    position: relative;
    flex: 1;
    margin: 4px 0;
  }

  .sanger-band {
    position: absolute;
    left: 15%;
    width: 70%;
    height: 3px;
    border-radius: 1px;
    transform: translateY(-50%);
    opacity: 0.8;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s;
  }

  .sanger-band:hover:not(.called) {
    opacity: 1;
    box-shadow: 0 0 8px currentColor;
  }

  .sanger-band.called {
    opacity: 0.15;
    cursor: default;
  }

  .sanger-band.next {
    opacity: 1;
    box-shadow: 0 0 6px currentColor;
    height: 4px;
  }

  /* Read cursor line */
  .read-cursor {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
    pointer-events: none;
    transform: translateY(-50%);
    /* offset for header + padding */
    top: calc(28px + 4px);
  }

  /* Controls */
  .call-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .call-actions {
    display: flex;
    gap: 6px;
  }

  .call-action-btn {
    padding: 4px 10px;
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    background: var(--bg-dark);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    cursor: pointer;
  }

  .call-action-btn:hover:not(:disabled) {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .call-action-btn:disabled { opacity: 0.3; cursor: default; }

  /* Called sequence */
  .called-seq {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 10px;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
  }

  .called-label {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--parchment-aged);
    white-space: nowrap;
  }

  .called-text {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    word-break: break-all;
    letter-spacing: 0.1em;
  }

  .seq-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 120px;
  }

  .seq-placeholder p {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
    text-align: center;
    margin: 0;
  }
</style>
