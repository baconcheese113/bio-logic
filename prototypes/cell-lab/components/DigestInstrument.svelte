<script lang="ts">
  import type { PlasmidMap, RestrictionEnzyme } from '../lib/lab-types';
  import { computeFragments } from '../lib/digest-simulation';

  interface CandidateGene {
    name: string;
    sites: Record<string, number[]>;
  }

  interface Props {
    plasmid: PlasmidMap;
    enzymes: RestrictionEnzyme[];
    restrictionSites: Record<string, number[]>;
    insertLength?: number;
    candidateGenes?: CandidateGene[];
    dragActive?: boolean;
    loadedTube?: string | null;
    oneject?: () => void;
    onresult: (enzyme: string, fragments: number[]) => void;
  }

  let { plasmid, enzymes, restrictionSites, insertLength, candidateGenes, dragActive = false, loadedTube = null, oneject, onresult }: Props = $props();

  /** When loadedTube is required (oneject provided), digest only works when loaded */
  const requiresLoading = $derived(!!oneject);

  /** When insertLength is set, digest operates on the insert only */
  const substrateLength = $derived(insertLength ?? plasmid.totalLength);

  let selectedEnzyme = $state<string | null>(null);
  let previewGene = $state<string | null>(null);

  /** Preview sites come from the selected candidate gene; actual digest uses real restriction sites */
  const previewSites = $derived(
    selectedEnzyme && previewGene
      ? (candidateGenes?.find(g => g.name === previewGene)?.sites[selectedEnzyme] ?? [])
      : [],
  );

  const selectedEnzymeData = $derived(
    enzymes.find(e => e.name === selectedEnzyme),
  );

  const regionPositions = $derived(() => {
    let offset = 0;
    return plasmid.regions.map(r => {
      const start = offset;
      offset += r.length;
      return { ...r, start, end: offset };
    });
  });

  function runDigest() {
    if (!selectedEnzyme) return;
    // Actual digest always uses the real restriction sites (hidden from player)
    const actualSites = restrictionSites[selectedEnzyme] ?? [];
    const fragments = computeFragments(substrateLength, actualSites);
    onresult(selectedEnzyme, fragments);
  }
</script>

<div class="digest-panel">
  <h3 class="panel-title">✂️ Restriction Digest</h3>

  <!-- Sample drop zone -->
  {#if requiresLoading}
    <div class="drop-zone" class:drop-highlight={dragActive && !loadedTube} data-digest-well>
      {#if loadedTube}
        <div class="loaded-sample">
          <span class="sample-label">✓ {loadedTube}</span>
          <button class="eject-btn" onclick={() => oneject?.()}>✗ Eject</button>
        </div>
      {:else if dragActive}
        <span class="drop-hint">↓ Drop PCR product here</span>
      {:else}
        <span class="drop-empty">Drag a PCR product tube here to digest</span>
      {/if}
    </div>
  {/if}

  {#if !requiresLoading || loadedTube}
    <!-- Substrate map -->
    {#if insertLength}
      <!-- Insert-only view: digest operates on the PCR-amplified insert -->
      <div class="plasmid-map">
        <div
          class="region insert"
          style:left="0%"
          style:width="100%"
          style:--region-color="#9ca3af"
          title="Insert ({insertLength} bp)"
        >
          <span class="region-label">Insert ({insertLength} bp)</span>
        </div>

        {#each previewSites as pos}
          <div
            class="cut-marker"
            style:left="{(pos / insertLength) * 100}%"
            title="Cut at {pos} bp"
          ></div>
        {/each}
      </div>

      <div class="scale-bar">
        <span>0 bp</span>
        <span>{insertLength} bp</span>
      </div>
    {:else}
      <!-- Full plasmid view -->
      <div class="plasmid-map">
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

        {#each previewSites as pos}
          <div
            class="cut-marker"
            style:left="{(pos / plasmid.totalLength) * 100}%"
            title="Cut at {pos} bp"
          ></div>
        {/each}
      </div>

      <div class="scale-bar">
        <span>0 bp</span>
        <span>{plasmid.totalLength} bp</span>
      </div>
    {/if}

    <!-- Enzyme picker -->
    <div class="enzyme-picker">
      <span class="picker-label">Select enzyme:</span>
      <div class="enzyme-btns">
        {#each enzymes as enzyme}
          <button
            class="enzyme-btn"
            class:active={selectedEnzyme === enzyme.name}
            onclick={() => selectedEnzyme = enzyme.name}
          >{enzyme.name}</button>
        {/each}
      </div>
    </div>

    {#if candidateGenes && candidateGenes.length > 0}
      <div class="gene-selector">
        <span class="picker-label">Preview gene:</span>
        <select class="gene-select" bind:value={previewGene}>
          <option value={null}>— Select a gene —</option>
          {#each candidateGenes as gene}
            <option value={gene.name}>{gene.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if selectedEnzymeData && previewGene}
      <div class="enzyme-info">
        <span class="cut-site">{selectedEnzymeData.cutDisplay}</span>
        <span class="site-count">
          {previewSites.length} cut site{previewSites.length !== 1 ? 's' : ''} on {previewGene}
        </span>
      </div>
    {:else if selectedEnzymeData}
      <div class="enzyme-info">
        <span class="cut-site">{selectedEnzymeData.cutDisplay}</span>
        <span class="site-count hint">Choose a gene to preview cut pattern</span>
      </div>
    {/if}

    <button class="run-btn" disabled={!selectedEnzyme} onclick={runDigest}>
      ▶ Run Digest
    </button>
  {/if}
</div>

<style>
  .digest-panel {
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

  .drop-zone {
    border: 2px dashed var(--brass-dark);
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, background 0.15s;
    color: var(--brass-light);
    font-size: 0.8rem;
  }

  .drop-zone.drop-highlight {
    border-color: var(--accent-blue);
    background: rgba(59, 130, 246, 0.08);
  }

  .loaded-sample {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sample-label {
    color: var(--parchment);
    font-weight: 600;
  }

  .eject-btn {
    background: none;
    border: 1px solid var(--brass-dark);
    color: var(--brass-light);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .drop-hint {
    color: var(--accent-blue);
    font-weight: 600;
  }

  .drop-empty {
    opacity: 0.6;
  }

  .drop-zone {
    border: 2px dashed var(--brass-dark);
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, background 0.15s;
    color: var(--brass-light);
    font-size: 0.8rem;
  }

  .drop-zone.drop-highlight {
    border-color: var(--accent-blue);
    background: rgba(59, 130, 246, 0.08);
  }

  .loaded-sample {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sample-label {
    color: var(--parchment);
    font-weight: 600;
  }

  .eject-btn {
    background: none;
    border: 1px solid var(--brass-dark);
    color: var(--brass-light);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .drop-hint {
    color: var(--accent-blue);
    font-weight: 600;
  }

  .drop-empty {
    opacity: 0.6;
  }

  .plasmid-map {
    position: relative;
    height: 80px;
    background: var(--bg-darkest);
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    overflow: visible;
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

  .cut-marker {
    position: absolute;
    top: 8px;
    width: 2px;
    height: 54px;
    background: #ef4444;
    transform: translateX(-1px);
    pointer-events: none;
  }

  .cut-marker::before {
    content: '✂';
    position: absolute;
    top: -14px;
    left: -6px;
    font-size: 12px;
    color: #ef4444;
  }

  .scale-bar {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--parchment-aged);
    padding: 0 2px;
  }

  .enzyme-picker {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .picker-label {
    font-family: var(--font-heading);
    font-size: 0.8rem;
    color: var(--parchment-aged);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .enzyme-btns {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .enzyme-btn {
    padding: 5px 12px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .enzyme-btn:hover {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .enzyme-btn.active {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }

  .enzyme-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 12px;
    background: var(--bg-darkest);
    border-radius: 6px;
  }

  .cut-site {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--brass);
    font-weight: 600;
    letter-spacing: 1px;
  }

  .site-count {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment-aged);
  }

  .site-count.hint {
    font-style: italic;
    opacity: 0.7;
  }

  .gene-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gene-select {
    padding: 4px 8px;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-darkest);
    color: var(--parchment);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    cursor: pointer;
  }

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

  .run-btn:hover:not(:disabled) {
    background: var(--brass);
    color: var(--bg-darkest);
  }

  .run-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
