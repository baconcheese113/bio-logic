<script lang="ts">
  import { GENES, PLASMID_SLOT_COUNT, type GeneId } from '../lib/strain-data';
  import { getUsedSlots } from '../lib/simulation-engine';

  interface Props {
    desiredGenes: GeneId[];
    propagatedGenes: GeneId[];
    propagationRemaining: number;
    onChange: (genes: GeneId[]) => void;
  }

  let { desiredGenes, propagatedGenes, propagationRemaining, onChange }: Props = $props();
  let selectedGene = $state<GeneId | null>(null);

  const geneList = $derived(Object.values(GENES));
  const usedSlots = $derived(getUsedSlots(desiredGenes));
  const propagatedSet = $derived(new Set(propagatedGenes));
  const selectedDefinition = $derived(selectedGene ? GENES[selectedGene] : null);
  const canAddSelected = $derived(
    selectedGene !== null &&
    !desiredGenes.includes(selectedGene) &&
    usedSlots + GENES[selectedGene].slotCost <= PLASMID_SLOT_COUNT,
  );
  const dropPreview = $derived.by(() => {
    if (!selectedGene || desiredGenes.includes(selectedGene)) return null;
    const selectedCost = GENES[selectedGene].slotCost;
    if (usedSlots + selectedCost <= PLASMID_SLOT_COUNT) return null;
    return desiredGenes.find(gene => GENES[gene].slotCost >= selectedCost) ?? desiredGenes[0] ?? null;
  });

  function toggleGene(gene: GeneId) {
    selectedGene = gene;
  }

  function removeGene(gene: GeneId) {
    onChange(desiredGenes.filter(current => current !== gene));
  }

  function confirmSelected() {
    if (!selectedGene) return;
    if (desiredGenes.includes(selectedGene)) {
      removeGene(selectedGene);
      selectedGene = null;
      return;
    }

    let next = [...desiredGenes];
    const cost = GENES[selectedGene].slotCost;
    while (getUsedSlots([...next, selectedGene]) > PLASMID_SLOT_COUNT && next.length > 0) {
      const index = next.findIndex(gene => GENES[gene].slotCost >= cost);
      next.splice(index >= 0 ? index : 0, 1);
    }

    onChange([...next, selectedGene]);
    selectedGene = null;
  }

  function arcPath(index: number, total: number): string {
    const start = -90 + (index / total) * 360 + 5;
    const end = -90 + ((index + 1) / total) * 360 - 5;
    const r = 82;
    const sx = 100 + Math.cos((start * Math.PI) / 180) * r;
    const sy = 100 + Math.sin((start * Math.PI) / 180) * r;
    const ex = 100 + Math.cos((end * Math.PI) / 180) * r;
    const ey = 100 + Math.sin((end * Math.PI) / 180) * r;
    return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  }
</script>

<section class="plasmid panel">
  <div class="panel-header">Plasmid Editor</div>
  <div class="editor-body">
    <svg class="map" viewBox="0 0 200 200" role="img" aria-label="Circular plasmid map">
      <circle cx="100" cy="100" r="82" fill="#fff9eb" stroke="#2a261c" stroke-width="2"></circle>
      <circle cx="100" cy="100" r="53" fill="none" stroke="#6f6553" stroke-dasharray="4 5"></circle>
      {#each desiredGenes as gene, index (gene)}
        <path
          d={arcPath(index, Math.max(3, desiredGenes.length))}
          stroke={GENES[gene].color}
          stroke-width={18}
          stroke-linecap="round"
          fill="none"
          opacity={propagatedSet.has(gene) ? 1 : 0.42}
        ></path>
      {/each}
      {#each Array.from({ length: PLASMID_SLOT_COUNT - usedSlots }) as _, index}
        <path
          d={arcPath(index + desiredGenes.length, PLASMID_SLOT_COUNT)}
          stroke="#6f6553"
          stroke-width="7"
          stroke-dasharray="4 5"
          fill="none"
          opacity="0.52"
        ></path>
      {/each}
      <text x="100" y="95" text-anchor="middle" class="slot-count">{usedSlots}/6</text>
      <text x="100" y="115" text-anchor="middle" class="slot-label">slots</text>
    </svg>

    <div class="gene-menu">
      {#each geneList as gene (gene.id)}
        <button
          class:active={desiredGenes.includes(gene.id)}
          class:selected={selectedGene === gene.id}
          class="gene-button"
          type="button"
          onclick={() => toggleGene(gene.id)}
        >
          <span class="swatch" style={`--gene:${gene.color}`}></span>
          <span>{gene.label}</span>
          <span class="cost">{gene.slotCost}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="swap-panel">
    {#if selectedDefinition}
      <div>
        <strong>{selectedDefinition.label}</strong>
        <span>{selectedDefinition.effect}</span>
      </div>
      {#if dropPreview}
        <p class="warning">{GENES[dropPreview].label} will be dropped to fit this gene.</p>
      {:else if !desiredGenes.includes(selectedDefinition.id) && !canAddSelected}
        <p class="warning">No open slots. Remove a gene before adding this one.</p>
      {/if}
      <button class="confirm" type="button" onclick={confirmSelected}>
        {desiredGenes.includes(selectedDefinition.id) ? 'Remove gene' : 'Confirm swap'}
      </button>
    {:else}
      <p>Select a gene arc or library row to preview a swap.</p>
    {/if}
  </div>

  {#if propagationRemaining > 0}
    <div class="propagation">plasmid propagating · {Math.ceil(propagationRemaining)}s</div>
  {/if}
</section>

<style>
  .plasmid {
    background: #fffbf0;
    color: #1f1d18;
    border-color: #2a261c;
  }

  .plasmid :global(.panel-header) {
    background: #efe2c5;
    color: #1f1d18;
    border-color: #6f6553;
  }

  .editor-body {
    display: grid;
    grid-template-columns: minmax(180px, 230px) 1fr;
    gap: 12px;
    padding: 12px;
    align-items: center;
  }

  .map {
    width: 100%;
    max-height: 230px;
  }

  .slot-count {
    font-family: var(--font-heading);
    font-size: 26px;
    fill: #1f1d18;
  }

  .slot-label {
    font-family: var(--font-mono);
    font-size: 11px;
    fill: #6f6553;
  }

  .gene-menu {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .gene-button {
    min-height: 38px;
    display: grid;
    grid-template-columns: 14px 1fr auto;
    align-items: center;
    gap: 7px;
    padding: 7px 8px;
    border: 1px solid #c5b28d;
    border-radius: 6px;
    background: #fff8e8;
    color: #1f1d18;
    font-size: 14px;
    text-align: left;
  }

  .gene-button.active {
    border-color: #2a261c;
    background: #efe2c5;
  }

  .gene-button.selected {
    outline: 2px solid #3a6ac2;
  }

  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--gene);
    border: 1px solid #2a261c;
  }

  .cost {
    font-family: var(--font-mono);
    color: #6f6553;
  }

  .swap-panel {
    min-height: 72px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    margin: 0 12px 12px;
    padding-top: 10px;
    border-top: 1px dashed #6f6553;
    font-size: 14px;
  }

  .swap-panel div {
    display: grid;
    gap: 2px;
  }

  .swap-panel p {
    margin: 0;
    color: #6f6553;
  }

  .warning {
    color: #a8551c;
    font-weight: 700;
  }

  .confirm {
    min-height: 36px;
    border: 1px solid #2a261c;
    border-radius: 6px;
    background: #2f5137;
    color: #fff8e8;
    padding: 7px 12px;
    font-size: 14px;
  }

  .propagation {
    margin: 0 12px 12px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #dfe9ff;
    color: #1f3f7a;
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: center;
  }

  @media (max-width: 940px) {
    .editor-body {
      grid-template-columns: 1fr;
    }
  }
</style>
