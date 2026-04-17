<script lang="ts">
  import type { BookEntry, BookSection } from '../lib/lab-types';

  interface Props {
    entries: BookEntry[];
    section: BookSection;
    page: number;
    onsection: (s: BookSection) => void;
    onpage: (p: number) => void;
  }

  let { entries, section, page, onsection, onpage }: Props = $props();

  const genes = $derived(entries.filter(e => e.section === 'genes'));
  const instruments = $derived(entries.filter(e => e.section === 'instruments'));
  const enzymes = $derived(entries.filter(e => e.section === 'enzymes'));
  const artifacts = $derived(entries.filter(e => e.section === 'artifacts'));
  const caseNotes = $derived(entries.filter(e => e.section === 'case-notes'));

  const GENES_PER_SPREAD = 4;
  const INSTS_PER_SPREAD = 2;

  const sectionPages = $derived.by(() => {
    switch (section) {
      case 'genes': return Math.max(1, Math.ceil(genes.length / GENES_PER_SPREAD));
      case 'instruments': return Math.max(1, Math.ceil(instruments.length / INSTS_PER_SPREAD));
      default: return 1;
    }
  });

  const safePage = $derived(Math.min(Math.max(0, page), sectionPages - 1));

  const SECTIONS: { id: BookSection; label: string; tab: string }[] = [
    { id: 'toc', label: 'Contents', tab: 'TOC' },
    { id: 'genes', label: 'Genes', tab: 'Genes' },
    { id: 'instruments', label: 'Instruments', tab: 'Inst.' },
    { id: 'enzymes', label: 'Enzymes', tab: 'Enz.' },
    { id: 'artifacts', label: 'Artifacts', tab: 'Art.' },
    { id: 'case-notes', label: 'Case Notes', tab: 'Notes' },
  ];

  const SECTION_COUNTS = $derived({
    toc: 0,
    genes: genes.length,
    instruments: instruments.length,
    enzymes: enzymes.length,
    artifacts: artifacts.length,
    'case-notes': caseNotes.length,
  });

  const geneIconSym: Record<string, string> = {
    fluorescent: '✦', resistance: '⛨', regulator: '◎', enzyme: '◈', structural: '▣', unknown: '·',
  };

  const instrumentEmoji: Record<string, string> = {
    pcr: '🧬', gel: '⚡', sequencer: '📊', spectrophotometer: '💡', elisa: '🎨', digest: '✂',
  };

  function jumpTo(s: BookSection) {
    onsection(s);
    onpage(0);
  }
  function prev() { if (safePage > 0) onpage(safePage - 1); }
  function next() { if (safePage < sectionPages - 1) onpage(safePage + 1); }

  const spreadGenes = $derived(genes.slice(safePage * GENES_PER_SPREAD, (safePage + 1) * GENES_PER_SPREAD));
  const leftGenes = $derived(spreadGenes.slice(0, 2));
  const rightGenes = $derived(spreadGenes.slice(2, 4));

  const spreadInsts = $derived(instruments.slice(safePage * INSTS_PER_SPREAD, (safePage + 1) * INSTS_PER_SPREAD));
</script>

{#snippet geneCard(g: Extract<BookEntry, { section: 'genes' }>)}
  <article class="gene-card icon-{g.icon}">
    <header class="gene-head">
      <span class="gene-icon" aria-hidden="true">{geneIconSym[g.icon]}</span>
      <span class="gene-name">{g.name}</span>
      <span class="gene-size">{g.length}bp</span>
    </header>
    {#if g.sequence}
      <div class="gene-seq">{g.sequence.slice(0, 20)}</div>
    {/if}
    <div class="gene-role">{g.roleLine}</div>
  </article>
{/snippet}

{#snippet instThumb(key: string)}
  {#if key === 'gel-bands'}
    <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
      <rect x="2" y="2" width="76" height="32" fill="#1a1a1a" rx="2"/>
      <rect x="8" y="9" width="64" height="2" fill="#8cf08c"/>
      <rect x="8" y="18" width="64" height="3" fill="#8cf08c"/>
      <rect x="8" y="28" width="64" height="2" fill="#8cf08c"/>
    </svg>
  {:else if key === 'chromatogram'}
    <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
      <rect x="2" y="2" width="76" height="32" fill="#1a1a1a" rx="2"/>
      <path d="M4 30 Q 12 10 20 30 Q 28 14 36 30 Q 44 8 52 30 Q 60 16 68 30 Q 74 12 78 30" fill="none" stroke="#4ade80" stroke-width="1.2"/>
      <path d="M4 30 Q 16 18 28 30 Q 40 20 52 30 Q 64 22 78 30" fill="none" stroke="#f87171" stroke-width="1.2"/>
    </svg>
  {:else if key === 'pcr-tube'}
    <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
      <rect x="2" y="2" width="76" height="32" fill="#1a1a1a" rx="2"/>
      <path d="M36 8 L36 24 Q 40 30 44 24 L44 8 Z" fill="none" stroke="#e8c060" stroke-width="1.3"/>
      <path d="M28 18 Q 34 14 40 18 Q 46 22 52 18" fill="none" stroke="#4ade80" stroke-width="1.2"/>
    </svg>
  {:else if key === 'fragment-pattern'}
    <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
      <rect x="2" y="2" width="76" height="32" fill="#1a1a1a" rx="2"/>
      <rect x="8" y="8" width="64" height="2" fill="#8cf08c"/>
      <rect x="8" y="14" width="64" height="2" fill="#8cf08c"/>
      <rect x="8" y="22" width="64" height="3" fill="#8cf08c"/>
      <rect x="8" y="29" width="64" height="2" fill="#8cf08c"/>
    </svg>
  {:else}
    <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
      <rect x="2" y="2" width="76" height="32" fill="#1a1a1a" rx="2"/>
    </svg>
  {/if}
{/snippet}

{#snippet instCard(i: Extract<BookEntry, { section: 'instruments' }>)}
  <article class="inst-card">
    <div class="inst-icon">{instrumentEmoji[i.icon] ?? '·'}</div>
    <h4 class="inst-name">{i.name}</h4>
    <div class="inst-field"><span class="inst-lbl">Measures:</span> {i.measures}</div>
    <div class="inst-field"><span class="inst-lbl">Use when:</span> {i.useWhen}</div>
    <div class="inst-thumb">{@render instThumb(i.thumbnail)}</div>
  </article>
{/snippet}

{#snippet emptySection()}
  <div class="empty">
    <p class="empty-main">No entries yet.</p>
    <p class="empty-sub">Unlocks as you progress.</p>
  </div>
{/snippet}

<div class="book">
  <div class="spread">
    <!-- Left page -->
    <div class="page left">
      {#if section === 'toc'}
        <h3 class="toc-h">The Lab Reference</h3>
        <p class="toc-sub">A working notebook. Tap a section tab or a line on the right →</p>
        <div class="toc-flourish">❦</div>
      {:else if section === 'genes'}
        <div class="gene-grid">
          {#each leftGenes as g (g.id)}
            {#if g.section === 'genes'}{@render geneCard(g)}{/if}
          {/each}
        </div>
      {:else if section === 'instruments'}
        {#if spreadInsts[0] && spreadInsts[0].section === 'instruments'}
          {@render instCard(spreadInsts[0])}
        {/if}
      {:else if section === 'enzymes' || section === 'artifacts'}
        {@render emptySection()}
      {:else if section === 'case-notes'}
        <h4 class="notes-title">Case Notes</h4>
        <ul class="notes-list">
          {#each caseNotes as n (n.id)}
            {#if n.section === 'case-notes'}
              <li>{n.bullet}</li>
            {/if}
          {/each}
          {#if caseNotes.length === 0}
            <li class="empty-sub">No notes for this puzzle.</li>
          {/if}
        </ul>
      {/if}
    </div>

    <!-- Right page -->
    <div class="page right">
      {#if section === 'toc'}
        <ul class="toc-list">
          {#each SECTIONS.filter(s => s.id !== 'toc') as s}
            <li>
              <button class="toc-link" onclick={() => jumpTo(s.id)}>
                <span>{s.label}</span>
                <span class="toc-count">{SECTION_COUNTS[s.id]}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else if section === 'genes'}
        <div class="gene-grid">
          {#each rightGenes as g (g.id)}
            {#if g.section === 'genes'}{@render geneCard(g)}{/if}
          {/each}
        </div>
      {:else if section === 'instruments'}
        {#if spreadInsts[1] && spreadInsts[1].section === 'instruments'}
          {@render instCard(spreadInsts[1])}
        {/if}
      {/if}
      <!-- enzymes/artifacts/case-notes: right page intentionally blank -->
    </div>
  </div>

  <!-- Section tabs on right edge -->
  <div class="tabs">
    {#each SECTIONS as s}
      <button class="tab" class:active={section === s.id} onclick={() => jumpTo(s.id)}>
        {s.tab}
      </button>
    {/each}
  </div>

  <!-- Page nav -->
  <div class="nav">
    <button class="nav-btn" disabled={safePage === 0} onclick={prev} aria-label="Previous page">◀</button>
    <span class="page-num">p. {safePage + 1} / {sectionPages}</span>
    <button class="nav-btn" disabled={safePage >= sectionPages - 1} onclick={next} aria-label="Next page">▶</button>
  </div>
</div>

<style>
  .book {
    width: 640px;
    height: 400px;
    background: #f5ecd9;
    display: grid;
    grid-template-columns: 1fr 56px;
    grid-template-rows: 1fr 30px;
    font-family: Georgia, var(--font-body), serif;
    color: #2a1f12;
    border-radius: 0 6px 6px 0;
    overflow: hidden;
  }

  .spread {
    grid-column: 1;
    grid-row: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    padding: 14px 16px 10px;
    background:
      linear-gradient(to right, rgba(0,0,0,0.06) 0%, transparent 2%, transparent 98%, rgba(0,0,0,0.06) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(120,90,40,0.05) 23px, rgba(120,90,40,0.05) 24px);
  }
  .spread::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 12px;
    bottom: 8px;
    width: 6px;
    transform: translateX(-50%);
    background: linear-gradient(to right, rgba(120,90,40,0.18), rgba(0,0,0,0.08), rgba(120,90,40,0.18));
    pointer-events: none;
  }

  .page {
    padding: 4px 14px 4px 4px;
    overflow: hidden;
  }
  .page.right {
    padding: 4px 4px 4px 14px;
  }

  /* TOC */
  .toc-h {
    font-size: 20px;
    margin: 16px 0 8px;
    color: #3a2a18;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .toc-sub {
    font-size: 13px;
    font-style: italic;
    color: #6a5238;
    margin: 0 0 12px;
    line-height: 1.4;
  }
  .toc-flourish {
    text-align: center;
    font-size: 28px;
    color: #b89968;
    margin-top: 60px;
  }
  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .toc-list li + li { margin-top: 2px; }
  .toc-link {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: transparent;
    border: none;
    border-bottom: 1px dotted rgba(60, 40, 20, 0.3);
    padding: 8px 4px;
    font: inherit;
    font-size: 14px;
    color: #3a2a18;
    cursor: pointer;
    text-align: left;
    font-family: Georgia, serif;
  }
  .toc-link:hover { background: rgba(200, 170, 100, 0.2); }
  .toc-count {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #7a5a38;
    background: rgba(120, 90, 40, 0.08);
    padding: 1px 7px;
    border-radius: 3px;
    min-width: 24px;
    text-align: center;
  }

  /* Gene cards */
  .gene-grid {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    height: 100%;
  }
  .gene-card {
    background: rgba(250, 242, 222, 0.75);
    border: 1px solid rgba(120, 90, 40, 0.25);
    border-left: 3px solid #b89968;
    border-radius: 3px;
    padding: 7px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }
  .gene-card.icon-fluorescent { border-left-color: #5aa85a; }
  .gene-card.icon-resistance { border-left-color: #c77a4e; }
  .gene-card.icon-regulator { border-left-color: #5a85b8; }
  .gene-card.icon-enzyme { border-left-color: #9a6abf; }
  .gene-card.icon-structural { border-left-color: #9a9068; }
  .gene-card.icon-unknown { border-left-color: #888; }

  .gene-head {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .gene-icon {
    font-size: 15px;
    width: 18px;
    text-align: center;
    color: #6a5038;
  }
  .gene-name {
    flex: 1;
    font-weight: 700;
    font-size: 14px;
    color: #2a1f12;
    font-family: Georgia, serif;
    letter-spacing: 0.01em;
  }
  .gene-size {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #6a5038;
    background: rgba(120, 90, 40, 0.1);
    padding: 2px 7px;
    border-radius: 3px;
  }
  .gene-seq {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    letter-spacing: 1.2px;
    color: #3a2a18;
    background: rgba(255, 255, 255, 0.5);
    padding: 3px 6px;
    border-radius: 2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: clip;
  }
  .gene-role {
    font-size: 13px;
    font-style: italic;
    color: #5a4028;
    line-height: 1.3;
    font-family: Georgia, serif;
  }

  /* Instrument card */
  .inst-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 8px 6px;
  }
  .inst-icon {
    font-size: 44px;
    text-align: center;
    line-height: 1;
    margin-top: 6px;
  }
  .inst-name {
    font-size: 16px;
    margin: 0;
    text-align: center;
    font-weight: 700;
    color: #2a1f12;
    font-family: Georgia, serif;
  }
  .inst-field {
    font-size: 13px;
    color: #3a2a18;
    line-height: 1.4;
    font-family: Georgia, serif;
  }
  .inst-lbl {
    font-weight: 700;
    font-variant: small-caps;
    color: #7a5a38;
    margin-right: 4px;
    letter-spacing: 0.04em;
  }
  .inst-thumb {
    margin-top: auto;
    display: flex;
    justify-content: center;
    padding-top: 6px;
  }

  /* Empty placeholder */
  .empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 6px;
  }
  .empty-main {
    font-size: 14px;
    color: #6a5038;
    margin: 0;
    font-family: Georgia, serif;
  }
  .empty-sub {
    font-size: 13px;
    font-style: italic;
    color: #8a7058;
    margin: 0;
    font-family: Georgia, serif;
  }

  /* Case notes */
  .notes-title {
    margin: 4px 0 8px;
    font-size: 16px;
    color: #3a2a18;
    font-family: Georgia, serif;
  }
  .notes-list {
    list-style: disc;
    padding-left: 22px;
    margin: 0;
  }
  .notes-list li {
    font-size: 13px;
    color: #3a2a18;
    line-height: 1.4;
    margin-bottom: 6px;
    font-family: Georgia, serif;
  }

  /* Tabs */
  .tabs {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 0 8px 3px;
    border-left: 1px solid rgba(120, 90, 40, 0.3);
    background: #ebdfbd;
  }
  .tab {
    flex: 1;
    padding: 4px 3px;
    background: #d8c6a0;
    border: 1px solid rgba(120, 90, 40, 0.3);
    border-right: none;
    border-radius: 4px 0 0 4px;
    font: inherit;
    font-size: 12px;
    color: #5a4028;
    cursor: pointer;
    writing-mode: horizontal-tb;
    min-height: 0;
    font-family: Georgia, serif;
  }
  .tab:hover { background: #c8b690; }
  .tab.active {
    background: #f5ecd9;
    color: #2a1f12;
    font-weight: 700;
    box-shadow: inset 3px 0 0 #7a5a38;
  }

  /* Page nav */
  .nav {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-top: 1px solid rgba(120, 90, 40, 0.25);
    background: #ebdfbd;
  }
  .nav-btn {
    width: 26px;
    height: 22px;
    background: #d8c6a0;
    border: 1px solid rgba(120, 90, 40, 0.3);
    border-radius: 3px;
    color: #5a4028;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    line-height: 1;
  }
  .nav-btn:hover:not(:disabled) { background: #c8b690; }
  .nav-btn:disabled { opacity: 0.35; cursor: default; }
  .page-num {
    font-size: 13px;
    font-style: italic;
    color: #6a5038;
    font-family: Georgia, serif;
  }
</style>
