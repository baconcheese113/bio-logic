<script lang="ts">
  import * as Phaser from 'phaser';
  import { onMount } from 'svelte';
  import { malignantBus } from './lib/event-bus';
  import { MalignantScene } from './lib/game-scene';
  import type { GeneId, Part, PartKind, UiState } from './lib/types';
  import './malignant.css';

  const parts: Part[] = [
    { id: 'promoter-generic', label: 'Generic Promoter', kind: 'promoter' },
    { id: 'rbs-generic', label: 'Generic RBS', kind: 'rbs' },
    { id: 'terminator-generic', label: 'Generic Terminator', kind: 'terminator' },
  ];

  const geneParts: Record<GeneId, Part> = {
    sod: { id: 'sod', label: 'SOD', kind: 'gene' },
    mmp: { id: 'mmp', label: 'MMP', kind: 'gene' },
    motility: { id: 'motility', label: 'Motility-A', kind: 'gene' },
  };
  const geneEntries: Array<{ id: GeneId; band: number; label: string; summary: string }> = [
    { id: 'motility', band: 290, label: 'Motility-A', summary: 'Increases cell movement speed' },
    { id: 'sod', band: 400, label: 'SOD', summary: 'Neutralizes reactive oxygen species from macrophages' },
    { id: 'mmp', band: 620, label: 'MMP', summary: 'Accelerates fibrous tissue digestion' },
  ];
  const slotOrder: PartKind[] = ['promoter', 'rbs', 'gene', 'terminator'];
  const slotLabels: Record<PartKind, string> = {
    promoter: 'PROMOTER',
    rbs: 'RBS',
    gene: 'GENE',
    terminator: 'TERMINATOR',
  };

  let ui = $state<UiState>({
    time: 0,
    pcr: { status: 'idle', progress: 0 },
    gel: { status: 'idle', progress: 0 },
    pcrQueue: 0,
    gelQueue: 0,
    samplesWaiting: 3,
    waveCountdown: 90,
    gelBand: null,
    gelBands: [],
    currentGene: null,
    availableGenes: [],
    bookReady: false,
    incubator: { status: 'idle', remaining: 0 },
    units: { collectors: 0, combat: 0, sod: 0, mmp: 0, motility: 0 },
    phase: 'playing',
    finalWaveRemaining: 0,
    fibrousRemaining: 2,
    wave: 'None',
    message: 'Collect apoptotic debris, then run the lab chain.',
  });
  let tray = $state<Part[]>(parts);
  let slots = $state<Record<PartKind, Part | null>>({
    promoter: null,
    rbs: null,
    gene: null,
    terminator: null,
  });
  let bookOpen = $state(false);
  let invalidSlot = $state<PartKind | null>(null);
  let selectedPartId = $state<string | null>(null);
  let game: Phaser.Game | null = null;

  const plasmidComplete = $derived(slotOrder.every(slot => slots[slot] !== null));
  const geneUnlocked = $derived(ui.availableGenes.some(gene => tray.some(part => part.id === gene) || slots.gene?.id === gene));
  const trayParts = $derived(tray.filter(part => !Object.values(slots).some(slot => slot?.id === part.id)));
  const activeGeneEntries = $derived(geneEntries.filter(entry => ui.availableGenes.includes(entry.id)));
  const selectedGene = $derived(slots.gene?.id as GeneId | undefined);
  const plasmidEffect = $derived.by(() => {
    if (selectedGene === 'sod') return 'Units resist macrophage ROS attack';
    if (selectedGene === 'mmp') return 'Combat cells digest fibrous tissue faster';
    if (selectedGene === 'motility') return 'Units move faster along hex paths';
    return 'Choose a gene to preview the unit effect';
  });
  const currentTask = $derived.by(() => {
    if (ui.phase === 'final-wave') return 'Keep combat cells between macrophages and the Founder Cell until the timer ends.';
    if (ui.phase !== 'playing') return 'Run complete.';
    if (ui.incubator.status === 'integrating') return 'Wait for the Incubator to finish. Units are rebooting.';
    if (ui.wave !== 'None' && ui.units.sod === 0) return 'A macrophage is active. Use red defend signals near engulfed cells to buy time while the lab finishes SOD.';
    if (ui.units.sod === 0 && ui.waveCountdown <= 20 && !ui.bookReady) return 'Macrophages are close. Keep the lab moving until the 400bp band appears.';
    if (ui.units.sod === 0 && ui.pcrQueue + ui.gelQueue > 0) return 'Samples are queued. PCR copies one vial, Gel reads one copied sample at a time.';
    if (ui.units.sod === 0 && ui.samplesWaiting > 0) return 'Harvest nearby unknown debris. The lab must identify the 400bp SOD sample before macrophages arrive.';
    if (ui.units.sod > 0 && ui.fibrousRemaining > 0) return 'Click fibrous tissue. MMP-marked cells digest it faster, but any combat cell can start.';
    if (ui.units.sod + ui.units.mmp + ui.units.motility > 0 && ui.fibrousRemaining > 0) return 'Harvest more debris or start digesting fibrous tissue with combat cells.';
    if (ui.units.sod > 0 && ui.wave === 'None') return 'The path is open. Combat cells will move to the Pathogen Nest and destroy it if they stay nearby.';
    if (ui.units.sod > 0) return 'Place red defend markers near purple macrophages. SOD-ringed combat cells will counterattack.';
    if (plasmidComplete) return 'Click Deploy to send the completed plasmid to the Incubator.';
    if (geneUnlocked) return 'Select a part, then click the matching plasmid slot. Slots must read promoter, RBS, gene, terminator.';
    if (ui.bookReady) return 'Open the Reference Book and choose a highlighted band match.';
    if (ui.gel.status === 'running') return 'Gel is separating the sample. Watch for the 400bp band.';
    if (ui.pcr.status === 'running') return 'PCR is amplifying the debris sample. Gel starts automatically next.';
    return 'Left-click the glowing white debris node to place a blue harvest marker. A collector will bring it to PCR.';
  });

  onMount(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'malignant-game',
      backgroundColor: '#17120f',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: 1000,
        height: 720,
      },
      scene: [MalignantScene],
    });
    const offUi = malignantBus.on('ui_state', next => {
      ui = next;
    });
    return () => {
      offUi();
      game?.destroy(true);
      game = null;
    };
  });

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = Math.floor(total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function openBook() {
    if (!ui.bookReady) return;
    bookOpen = true;
    malignantBus.emit('game_paused', { paused: true });
  }

  function unlockGene(gene: GeneId) {
    if (!ui.availableGenes.includes(gene)) return;
    if (!tray.some(part => part.id === gene) && slots.gene?.id !== gene) tray = [...tray, geneParts[gene]];
    malignantBus.emit('reference_unlocked', { geneId: gene });
    bookOpen = false;
    malignantBus.emit('game_paused', { paused: false });
  }

  function selectPart(part: Part) {
    selectedPartId = selectedPartId === part.id ? null : part.id;
  }

  function placeSelectedPart(slot: PartKind) {
    const part = tray.find(candidate => candidate.id === selectedPartId);
    if (!part) {
      clearSlot(slot);
      return;
    }
    const firstEmpty = slotOrder.find(candidate => slots[candidate] === null);
    if (part.kind !== slot || firstEmpty !== slot) {
      invalidSlot = slot;
      window.setTimeout(() => {
        invalidSlot = null;
      }, 280);
      return;
    }
    slots = { ...slots, [slot]: part };
    selectedPartId = null;
  }

  function clearSlot(slot: PartKind) {
    slots = { ...slots, [slot]: null };
  }

  function deploy() {
    if (!plasmidComplete || !slots.promoter || !slots.rbs || !slots.gene || !slots.terminator) return;
    malignantBus.emit('plasmid_deployed', {
      promoter: slots.promoter.id,
      rbs: slots.rbs.id,
      gene: slots.gene.id,
      terminator: slots.terminator.id,
    });
  }

  function restart() {
    slots = { promoter: null, rbs: null, gene: null, terminator: null };
    tray = parts;
    bookOpen = false;
    selectedPartId = null;
    malignantBus.emit('game_paused', { paused: false });
    malignantBus.emit('restart_requested', {});
  }
</script>

<svelte:head>
  <title>Malignant Phase 1 Prototype</title>
</svelte:head>

<main class="malignant-shell">
  <header class="top-bar">
    <div>Time {formatTime(ui.time)}</div>
    <div>Collectors {ui.units.collectors} / Combat {ui.units.combat} / SOD {ui.units.sod} / MMP {ui.units.mmp} / MOT {ui.units.motility}</div>
    <div>{ui.phase === 'playing' && ui.waveCountdown > 0 ? `Macrophages ${ui.waveCountdown}s` : ui.wave}</div>
  </header>

  <section class="play-layout" role="application" oncontextmenu={(event) => event.preventDefault()}>
    <div id="malignant-game" class="game-surface" aria-label="Malignant hex battlefield"></div>

    <aside class="lab-strip" aria-label="Lab strip">
      <section class="strip-card">
        <div class="card-title">Instrument Chain</div>
        <div class="instrument-row">
          <span>PCR</span>
          <span>{ui.pcr.status} +{ui.pcrQueue}</span>
        </div>
        <div class="instrument-hint">Copies carried vials</div>
        <div class="progress-track"><span style:width={`${ui.pcr.progress * 100}%`}></span></div>
        <div class="instrument-row">
          <span>GEL</span>
          <span>{ui.gel.status} +{ui.gelQueue}</span>
        </div>
        <div class="instrument-hint">Turns copies into bands</div>
        <div class="progress-track"><span style:width={`${ui.gel.progress * 100}%`}></span></div>
        {#if ui.gelBands.length > 0}
          <div class="band-readout">Bands: {ui.gelBands.map(band => `${band}bp`).join(', ')}</div>
        {/if}
        <button class:pulse={ui.bookReady} disabled={!ui.bookReady} onclick={openBook}>Reference Book</button>
      </section>

      <section class="strip-card plasmid-card">
        <div class="card-title">Plasmid Editor</div>
        <div class="slot-rail">
          {#each slotOrder as slot (slot)}
            <button class:filled={slots[slot]} class:shake={invalidSlot === slot} onclick={() => placeSelectedPart(slot)}>
              <span>{slotLabels[slot]}</span>
              <strong>{slots[slot]?.label ?? 'Empty'}</strong>
            </button>
          {/each}
        </div>
        <div class="part-tray">
          {#each trayParts as part (part.id)}
            <button class:selected={selectedPartId === part.id} onclick={() => selectPart(part)}>{part.label}</button>
          {/each}
        </div>
        <div class="preview">
          <span>Effect: {plasmidEffect}</span>
          <span>ATP Cost: Medium</span>
        </div>
        <button class="deploy" class:pulse={plasmidComplete} disabled={!plasmidComplete} onclick={deploy}>Deploy</button>
      </section>

      <section class="strip-card incubator">
        <div class="card-title">Incubator</div>
        {#if ui.incubator.status === 'integrating'}
          <p>Integrating... {ui.incubator.remaining}s</p>
        {:else if ui.incubator.status === 'complete'}
          <p>Complete</p>
        {:else}
          <p>Idle</p>
        {/if}
      </section>

      <p class="status-line">{ui.message}</p>
      <section class="guide-card" aria-label="Current task">
        <strong>Current task</strong>
        <p>{currentTask}</p>
        <div class="legend">
          <span><i class="blue"></i>Left-click harvest</span>
          <span><i class="red"></i>Right-click defend</span>
          <span><i class="green"></i>Green ring resists macrophages</span>
          <span><i class="amber"></i>Amber notch digests tissue faster</span>
          <span><i class="cyan"></i>Blue trails move faster</span>
        </div>
      </section>
      {#if ui.phase === 'final-wave'}
        <div class="final-timer">{ui.finalWaveRemaining}s</div>
      {/if}
    </aside>
  </section>

  {#if bookOpen}
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reference Book">
      <section class="reference-book">
        <h2>Reference Book</h2>
        {#each geneEntries as entry (entry.id)}
          <button
            class="gene-entry"
            class:highlight={activeGeneEntries.some(active => active.id === entry.id)}
            class:muted={!activeGeneEntries.some(active => active.id === entry.id)}
            onclick={() => unlockGene(entry.id)}
          >
            <strong>{entry.label} - {entry.band}bp</strong>
            <span>{entry.summary}</span>
          </button>
        {/each}
      </section>
    </div>
  {/if}

  {#if ui.phase === 'won' || ui.phase === 'lost'}
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <section class="end-screen">
        {#if ui.phase === 'won'}
          <h2>COLONY SURVIVED</h2>
          <p>Time survived: {formatTime(ui.time)}. Wave reached: Final wave.</p>
          <p>SOD gene neutralized macrophage oxidative attack</p>
        {:else}
          <h2>FOUNDER CELL DESTROYED</h2>
          <p>Macrophages reached the colony - SOD plasmid was not active in time</p>
        {/if}
        <button onclick={restart}>Retry</button>
      </section>
    </div>
  {/if}
</main>
