<script lang="ts">
  import type { PlasmidMap, SamplePcrData } from '../lib/lab-types';
  import type { PrimerPlacement } from '../lib/pcr-simulation';
  import { estimateGc, estimateTm, runPcr } from '../lib/pcr-simulation';

  interface Props {
    plasmid?: PlasmidMap;
    samplePcr?: SamplePcrData;
    dragActive?: boolean;
    loadedSample?: string | null;
    onresult: (bandSize: number | null, failReason?: string) => void;
    oneject?: () => void;
  }

  let { plasmid, samplePcr, dragActive = false, loadedSample = null, onresult, oneject }: Props = $props();

  const sampleMode = $derived(!plasmid && !!samplePcr);

  // --- Sample mode state ---
  let selectedPrimer = $state('');

  function runSamplePcr() {
    if (!samplePcr || !loadedSample || !selectedPrimer) return;
    const sampleSpecies = samplePcr.truthMap[loadedSample];
    const primer = samplePcr.primers.find(p => p.name === selectedPrimer);
    const bandSize = primer?.bandBySpecies[sampleSpecies] ?? 0;
    if (bandSize > 0) {
      onresult(bandSize);
    } else {
      onresult(null, 'No amplification');
    }
    selectedPrimer = '';
  }

  // Build linear position map from regions
  const regionPositions = $derived(() => {
    if (!plasmid) return [];
    let offset = 0;
    return plasmid.regions.map(r => {
      const start = offset;
      offset += r.length;
      return { ...r, start, end: offset };
    });
  });

  // Primer state — positions as fraction of total length
  let fwdFrac = $state(0.0);
  let revFrac = $state(1.0);
  let fwdLength = $state(20);
  let revLength = $state(20);
  let dragging = $state<'fwd' | 'rev' | null>(null);
  let mapEl: HTMLDivElement | undefined = $state();

  // Computed primer stats (plasmid mode only)
  const fwdPos = $derived(Math.round(fwdFrac * (plasmid?.totalLength ?? 0)));
  const revPos = $derived(Math.round(revFrac * (plasmid?.totalLength ?? 0)));
  const fwdGc = $derived(estimateGc(fwdPos, plasmid?.totalLength ?? 1));
  const revGc = $derived(estimateGc(revPos, plasmid?.totalLength ?? 1));
  const fwdTm = $derived(Math.round(estimateTm(fwdLength, fwdGc)));
  const revTm = $derived(Math.round(estimateTm(revLength, revGc)));

  function tmStatus(tm: number): string {
    if (tm >= 55 && tm <= 65) return 'good';
    if (tm >= 50 && tm <= 70) return 'warn';
    return 'bad';
  }

  function gcStatus(gc: number): string {
    if (gc >= 0.4 && gc <= 0.6) return 'good';
    if (gc >= 0.3 && gc <= 0.7) return 'warn';
    return 'bad';
  }

  function handlePointerDown(which: 'fwd' | 'rev', e: PointerEvent) {
    dragging = which;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragging || !mapEl) return;
    const rect = mapEl.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (dragging === 'fwd') fwdFrac = frac;
    else revFrac = frac;
  }

  function handlePointerUp() {
    dragging = null;
  }

  function runPcrAction() {
    if (!plasmid) return;
    const fwd: PrimerPlacement = { position: fwdPos, length: fwdLength };
    const rev: PrimerPlacement = { position: revPos, length: revLength };
    const result = runPcr(plasmid, fwd, rev);
    onresult(result.bandSize, result.failReason);
  }

  // Initialize primers to flank first insert region
  $effect(() => {
    if (!plasmid) return;
    const regions = regionPositions();
    const insert = regions.find(r => r.isInsert);
    if (insert) {
      fwdFrac = Math.max(0, insert.start / plasmid.totalLength);
      revFrac = Math.min(1, insert.end / plasmid.totalLength);
    }
  });
</script>

<div class="pcr-panel">
  <h3 class="panel-title">🧬 PCR{sampleMode ? ' — Sample Testing' : ' — Primer Design'}</h3>

  {#if sampleMode && samplePcr}
    <!-- Sample-drop mode -->
    <div class="drop-zone" class:drop-highlight={dragActive && !loadedSample} data-pcr-well>
      {#if loadedSample}
        <div class="loaded-sample">
          <span class="sample-label">{loadedSample}</span>
          <button class="eject-btn" onclick={() => oneject?.()}>✗ Eject</button>
        </div>
      {:else if dragActive}
        <span class="drop-hint">↓ Drop sample tube here</span>
      {:else}
        <span class="drop-empty">Drag a sample tube here</span>
      {/if}
    </div>

    {#if loadedSample}
      <div class="test-controls">
        <select class="primer-select" bind:value={selectedPrimer}>
          <option value="">Select primer pair…</option>
          {#each samplePcr.primers as p}
            <option value={p.name}>{p.name} — {p.description}</option>
          {/each}
        </select>
        <button
          class="run-btn"
          disabled={!selectedPrimer}
          onclick={runSamplePcr}
        >
          ▶ Run PCR
        </button>
      </div>
    {/if}
  {:else if plasmid}

  <!-- Sample drop zone (plasmid mode) -->
  {#if oneject}
    <div class="drop-zone" class:drop-highlight={dragActive && !loadedSample} data-pcr-well>
      {#if loadedSample}
        <div class="loaded-sample">
          <span class="sample-label">✓ {loadedSample}</span>
          <button class="eject-btn" onclick={() => oneject?.()}>✗ Eject</button>
        </div>
      {:else if dragActive}
        <span class="drop-hint">↓ Drop sample tube here</span>
      {:else}
        <span class="drop-empty">Drag a sample tube here to begin</span>
      {/if}
    </div>
  {/if}

  <!-- Plasmid linear map -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="plasmid-map"
    bind:this={mapEl}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
  >
    <!-- Region blocks -->
    {#each regionPositions() as region}
      <div
        class="region"
        class:insert={region.isInsert}
        style:left="{(region.start / plasmid.totalLength) * 100}%"
        style:width="{(region.length / plasmid.totalLength) * 100}%"
        style:--region-color={region.color}
        title="{region.label} ({region.length} bp)"
      >
        <span class="region-label">{region.label}</span>
      </div>
    {/each}

    <!-- Forward primer flag -->
    <button
      class="primer-flag fwd"
      class:dragging={dragging === 'fwd'}
      style:left="{fwdFrac * 100}%"
      onpointerdown={(e) => handlePointerDown('fwd', e)}
      title="Forward primer — drag to position"
    >▶ Fwd</button>

    <!-- Reverse primer flag -->
    <button
      class="primer-flag rev"
      class:dragging={dragging === 'rev'}
      style:left="{revFrac * 100}%"
      onpointerdown={(e) => handlePointerDown('rev', e)}
      title="Reverse primer — drag to position"
    >◀ Rev</button>

    <!-- Amplified region highlight -->
    {#if fwdFrac < revFrac}
      <div
        class="amplified-region"
        style:left="{fwdFrac * 100}%"
        style:width="{(revFrac - fwdFrac) * 100}%"
      ></div>
    {/if}
  </div>

  <!-- Scale bar -->
  <div class="scale-bar">
    <span>0 bp</span>
    <span>{plasmid.totalLength} bp</span>
  </div>

  <!-- Primer stats -->
  <div class="primer-stats">
    <div class="stat-row">
      <span class="stat-heading">▶ Forward</span>
      <span class="stat-item">
        Pos: <span class="stat-val">{fwdPos} bp</span>
      </span>
      <label class="stat-item">
        Length:
        <input type="range" min="16" max="30" bind:value={fwdLength} class="len-slider" />
        <span class="stat-val">{fwdLength}</span>
      </label>
      <span class="stat-item">
        Tm: <span class="stat-val {tmStatus(fwdTm)}">{fwdTm}°C</span>
      </span>
      <span class="stat-item">
        GC: <span class="stat-val {gcStatus(fwdGc)}">{Math.round(fwdGc * 100)}%</span>
      </span>
    </div>
    <div class="stat-row">
      <span class="stat-heading">◀ Reverse</span>
      <span class="stat-item">
        Pos: <span class="stat-val">{revPos} bp</span>
      </span>
      <label class="stat-item">
        Length:
        <input type="range" min="16" max="30" bind:value={revLength} class="len-slider" />
        <span class="stat-val">{revLength}</span>
      </label>
      <span class="stat-item">
        Tm: <span class="stat-val {tmStatus(revTm)}">{revTm}°C</span>
      </span>
      <span class="stat-item">
        GC: <span class="stat-val {gcStatus(revGc)}">{Math.round(revGc * 100)}%</span>
      </span>
    </div>
  </div>

  <button class="run-btn" disabled={!!oneject && !loadedSample} onclick={runPcrAction}>
    ▶ Run PCR
  </button>
  {/if}
</div>

<style>
  .pcr-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 10px;
    flex: 1;
  }

  .panel-title {
    font-family: var(--font-heading);
    font-size: 0.95rem;
    color: var(--parchment);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Plasmid map */
  .plasmid-map {
    position: relative;
    height: 80px;
    background: var(--bg-darkest);
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    overflow: visible;
    touch-action: none;
  }

  .region {
    position: absolute;
    top: 20px;
    height: 30px;
    background: var(--region-color);
    opacity: 0.6;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 2px;
  }

  .region.insert {
    opacity: 0.4;
    border: 2px dashed var(--parchment-aged);
  }

  .region-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--parchment);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    padding: 0 4px;
  }

  /* Primer flags */
  .primer-flag {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    border-radius: 3px;
    cursor: grab;
    z-index: 10;
    border: 1px solid;
    white-space: nowrap;
    user-select: none;
    touch-action: none;
  }

  .primer-flag:active, .primer-flag.dragging {
    cursor: grabbing;
  }

  .primer-flag.fwd {
    background: #22c55e33;
    color: #22c55e;
    border-color: #22c55e;
  }

  .primer-flag.rev {
    background: #ef444433;
    color: #ef4444;
    border-color: #ef4444;
    top: auto;
    bottom: 0;
  }

  .amplified-region {
    position: absolute;
    top: 22px;
    height: 26px;
    background: var(--brass);
    opacity: 0.15;
    border-radius: 2px;
    pointer-events: none;
  }

  /* Scale bar */
  .scale-bar {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--parchment-aged);
    padding: 0 2px;
  }

  /* Primer stats */
  .primer-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment-aged);
  }

  .stat-heading {
    color: var(--parchment);
    font-weight: 600;
    min-width: 70px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-val {
    color: var(--brass);
    font-weight: 600;
  }

  .stat-val.good { color: #22c55e; }
  .stat-val.warn { color: #f59e0b; }
  .stat-val.bad { color: #ef4444; }

  .len-slider {
    width: 60px;
    accent-color: var(--brass);
  }

  /* Run button */
  .run-btn {
    align-self: center;
    padding: 8px 24px;
    border: 1px solid var(--brass-dark);
    border-radius: 8px;
    background: var(--brass-dark);
    color: var(--parchment);
    font-family: var(--font-heading);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 600;
  }

  .run-btn:hover {
    background: var(--brass);
    color: var(--bg-darkest);
  }

  .run-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Sample mode */
  .drop-zone {
    width: 100%;
    max-width: 300px;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--brass-dark);
    border-radius: 8px;
    background: var(--bg-darkest);
    transition: all 0.15s;
  }

  .drop-zone.drop-highlight {
    border-color: var(--brass);
    background: rgba(180, 160, 100, 0.1);
  }

  .drop-hint {
    color: var(--brass);
    font-family: var(--font-heading);
    font-size: 0.85rem;
    animation: pulse 1.2s infinite alternate;
  }

  .drop-empty {
    color: var(--parchment-aged);
    font-size: 0.8rem;
    opacity: 0.6;
  }

  @keyframes pulse {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }

  .loaded-sample {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
  }

  .sample-label {
    font-family: var(--font-heading);
    font-size: 0.9rem;
    color: var(--parchment);
  }

  .eject-btn {
    background: none;
    border: 1px solid var(--brass-dark);
    color: var(--parchment-aged);
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .eject-btn:hover {
    color: #e74c3c;
    border-color: #e74c3c;
  }

  .test-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .primer-select {
    padding: 4px 8px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background: var(--bg-darkest);
    color: var(--parchment);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    cursor: pointer;
    max-width: 250px;
  }
</style>
