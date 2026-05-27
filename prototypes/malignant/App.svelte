<script lang="ts">
  import * as Phaser from 'phaser';
  import { onMount } from 'svelte';
  import { malignantBus } from './lib/event-bus';
  import { MalignantScene } from './lib/game-scene';
  import { BenchmarkScene } from './lib/benchmark-scene';
  import type { BuildCommand, GeneId, Part, PartKind, UiState } from './lib/types';
  import './malignant.css';

  const benchmarkMode = new URLSearchParams(window.location.search).get('benchmark') === '1';

  const baseParts: Part[] = [
    { id: 'promoter-generic', label: 'Promoter', kind: 'promoter' },
    { id: 'rbs-generic', label: 'Ribosome Site', kind: 'rbs' },
    { id: 'terminator-generic', label: 'Terminator', kind: 'terminator' },
  ];
  const geneParts: Record<GeneId, Part> = {
    sod: { id: 'sod', label: 'Oxidative Shield Gene', kind: 'gene', gene: 'sod' },
    pdl1: { id: 'pdl1', label: 'Checkpoint Mask Gene', kind: 'gene', gene: 'pdl1' },
  };
  const slotOrder: PartKind[] = ['promoter', 'rbs', 'gene', 'terminator'];
  const setupBuilds: Array<{ command: BuildCommand; label: string; cost: string; icon: string }> = [
    { command: 'bioreactor', label: 'Bioreactor', cost: '50 nutrients', icon: 'cell growth' },
    { command: 'energy', label: 'Energy Generator', cost: '40 nutrients', icon: 'energy cap' },
    { command: 'pcr', label: 'DNA Amplifier', cost: '30 nutrients', icon: 'DNA copy' },
    { command: 'gel', label: 'Band Gel', cost: '30 nutrients', icon: 'DNA bands' },
    { command: 'incubator', label: 'Expression Incubator', cost: '20 nutrients', icon: 'protein' },
  ];
  const fieldBuilds: Array<{ command: BuildCommand; label: string; cost: number; unlock: string; icon: string }> = [
    { command: 'bioreactor', label: 'Bioreactor', cost: 50, unlock: 'troop growth', icon: 'cell growth' },
    { command: 'pcr', label: 'DNA Amplifier', cost: 30, unlock: 'lab chain', icon: 'DNA copy' },
    { command: 'gel', label: 'Band Gel', cost: 30, unlock: 'lab chain', icon: 'DNA bands' },
    { command: 'incubator', label: 'Expression Incubator', cost: 20, unlock: 'lab chain', icon: 'protein' },
    { command: 'colonize', label: 'Expand Tissue', cost: 0, unlock: 'after setup', icon: 'new tissue' },
    { command: 'mmp-flare', label: 'Matrix Digestion Flare', cost: 15, unlock: 'after setup', icon: 'matrix cut' },
    { command: 'sprout', label: 'Angiogenic Sprout', cost: 25, unlock: 'capillary', icon: 'blood supply' },
    { command: 'energy', label: 'Energy Generator', cost: 40, unlock: 'after setup', icon: 'energy cap' },
  ];
  const buildingHelp: Record<BuildCommand, string> = {
    bioreactor: 'Select it, then spend nutrients to spawn units manually',
    energy: 'Raises unit cap by 5',
    pcr: 'Copies DNA from harvested debris into a readable sample',
    gel: 'Separates copied DNA into bands and identifies the useful gene',
    incubator: 'Expresses a completed plasmid as proteins on your units',
    colonize: 'Claim adjacent open or capillary frontier tile',
    'mmp-flare': 'Digest fibrous tile using two units',
    sprout: 'Build on colonized capillary for +10 nutrients per second',
  };
  const geneMeta: Record<GeneId, { name: string; band: 'upper' | 'lower'; icon: string; effect: string }> = {
    sod: { name: 'Oxidative Shield', band: 'upper', icon: 'green-ring', effect: 'green protein ring repels standard macrophages' },
    pdl1: { name: 'Checkpoint Mask', band: 'lower', icon: 'blue-ring', effect: 'blue protein ring masks adapted targeting' },
  };

  let ui = $state<UiState>({
    phase: 'playing',
    time: 0,
    fps: 0,
    nutrients: 150,
    nutrientRate: 0,
    pcr: { status: 'idle', progress: 0 },
    gel: { status: 'idle', progress: 0 },
    pcrQueue: 0,
    gelQueue: 0,
    geneReady: null,
    availableGenes: [],
    activeGene: null,
    incubator: { status: 'idle', remaining: 0 },
    leakageRemaining: 90,
    waveLabel: 'Threat 0/5',
    units: { total: 5, cap: 10, selected: 0, idle: 5, carrying: 0, building: 0, combat: 0, sod: 0, pdl1: 0 },
    markers: { harvest: 0, defend: 0 },
    buildMode: null,
    buildings: { bioreactor: 1, pcr: 0, gel: 0, incubator: 0, energy: 1, sprout: 0 },
    selectedBuilding: null,
    production: { queued: 0, remaining: 0 },
    placement: { remaining: 0, nextBuilding: null, missing: [] },
    message: 'Left-click units to select them. Right-click to move, attack, or harvest.',
    endStats: null,
  });
  let tray = $state<Part[]>(baseParts);
  let slots = $state<Record<PartKind, Part | null>>({ promoter: null, rbs: null, gene: null, terminator: null });
  let selectedPartId = $state<string | null>(null);
  let invalidSlot = $state<PartKind | null>(null);
  let collectedGenes = $state<GeneId[]>([]);
  let game: Phaser.Game | null = null;

  const plasmidComplete = $derived(slotOrder.every(slot => slots[slot] !== null));
  const trayParts = $derived(tray.filter(part => !Object.values(slots).some(slot => slot?.id === part.id)));
  const selectedGene = $derived(slots.gene?.gene ?? null);
  const activeGeneLabel = $derived(ui.activeGene ? geneMeta[ui.activeGene].name : 'No plasmid');
  const leakageDanger = $derived(ui.leakageRemaining <= 20 && ui.phase !== 'placement');
  const deployPreview = $derived.by(() => {
    if (selectedGene === 'sod') return 'Repel engulfing cells';
    if (selectedGene === 'pdl1') return 'Mask adapted targeting';
    return 'No gene';
  });
  const incubatorProgress = $derived(ui.incubator.status === 'integrating' ? (1 - ui.incubator.remaining / 8) * 100 : ui.incubator.status === 'complete' ? 100 : 0);
  const buildMenu = $derived(ui.phase === 'placement' ? setupBuilds : fieldBuilds);
  const activeBuild = $derived(ui.buildMode);
  const setupComplete = $derived(ui.placement.missing.length === 0);
  const cheapestPaidBuild = $derived(Math.min(...fieldBuilds.filter(item => item.cost > 0).map(item => item.cost)));
  const effectiveUnits = $derived(ui.units.total + ui.production.queued);
  const nutrientState = $derived(ui.nutrients < cheapestPaidBuild ? 'danger' : ui.nutrients < 40 ? 'warning' : 'normal');
  const unitState = $derived(effectiveUnits >= ui.units.cap ? 'danger' : effectiveUnits >= ui.units.cap - 2 ? 'warning' : 'normal');
  const showInstrumentHud = $derived(ui.selectedBuilding === 'pcr' || ui.selectedBuilding === 'gel' || ui.geneReady !== null);
  const showPlasmidHud = $derived(ui.selectedBuilding === 'incubator' || ui.geneReady !== null || ui.availableGenes.length > 0);
  const onboardingSteps = $derived.by(() => {
    if (ui.buildings.sprout === 0) {
      return [
        'Left-click units to select them',
        'Right-click destinations, debris, or enemies',
        'Expand tissue toward a capillary node',
        'Build Angiogenic Sprout on the capillary',
      ];
    }
    if (ui.pcrQueue === 0 && ui.gelQueue === 0 && !ui.geneReady) {
      return [
        'Select units, then right-click debris to harvest',
        'Carriers feed the DNA amplifier, then the band gel',
        'Collect the gene card and deploy a plasmid',
      ];
    }
    return [
      'Keep running instrument chains before leakage reaches zero',
      'Build Energy Generators to increase unit cap',
      'Micro selected ranged units away from melee macrophages',
    ];
  });

  onMount(() => {
    const benchmarkStartedAt = performance.now();
    const targetResolution = benchmarkMode
      ? Math.min(2, window.devicePixelRatio || 1)
      : 1;
    game = new Phaser.Game({
      type: Phaser.WEBGL,
      parent: 'malignant-game',
      backgroundColor: '#05070d',
      resolution: targetResolution,
      render: {
        antialias: benchmarkMode,
        powerPreference: 'high-performance',
        roundPixels: !benchmarkMode,
      },
      scale: { mode: Phaser.Scale.RESIZE, width: 1200, height: 760 },
      scene: [benchmarkMode ? BenchmarkScene : MalignantScene],
    });
    const offUi = benchmarkMode
      ? () => {}
      : malignantBus.on('ui_state', next => {
        ui = next;
      });
    const offGene = benchmarkMode
      ? () => {}
      : malignantBus.on('gene_part_collected', payload => {
        collectGenePart(payload.gene);
      });
    const benchmarkTicker = benchmarkMode
      ? window.setInterval(() => {
        if (!game) return;
        const elapsedSeconds = Math.floor((performance.now() - benchmarkStartedAt) / 1000);
        ui = {
          ...ui,
          time: elapsedSeconds,
          fps: Math.round(game.loop.actualFps),
          waveLabel: 'Benchmark mode',
          message: 'Clean Phaser scene. Compare this FPS to gameplay mode to find simulation/render overhead.',
        };
      }, 150)
      : null;
    return () => {
      offUi();
      offGene();
      if (benchmarkTicker) window.clearInterval(benchmarkTicker);
      game?.destroy(true);
      game = null;
    };
  });

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = Math.floor(total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function selectPart(part: Part) {
    selectedPartId = selectedPartId === part.id ? null : part.id;
  }

  function placeSelectedPart(slot: PartKind) {
    const part = tray.find(candidate => candidate.id === selectedPartId);
    if (!part) {
      slots = { ...slots, [slot]: null };
      return;
    }
    const firstEmpty = slotOrder.find(candidate => slots[candidate] === null);
    if (part.kind !== slot || firstEmpty !== slot) {
      invalidSlot = slot;
      window.setTimeout(() => {
        invalidSlot = null;
      }, 260);
      return;
    }
    slots = { ...slots, [slot]: part };
    selectedPartId = null;
  }

  function deploy() {
    if (!plasmidComplete || !slots.promoter || !slots.rbs || !slots.gene?.gene || !slots.terminator) return;
    malignantBus.emit('plasmid_deployed', {
      promoter: slots.promoter.id,
      rbs: slots.rbs.id,
      gene: slots.gene.gene,
      terminator: slots.terminator.id,
    });
    slots = { promoter: null, rbs: null, gene: null, terminator: null };
    tray = baseParts;
    collectedGenes = [];
    selectedPartId = null;
  }

  function collectGenePart(gene: GeneId) {
    if (collectedGenes.includes(gene) || tray.some(part => part.id === gene) || slots.gene?.id === gene) return;
    tray = [...tray, geneParts[gene]];
    collectedGenes = [...collectedGenes, gene];
  }

  function restart() {
    slots = { promoter: null, rbs: null, gene: null, terminator: null };
    tray = baseParts;
    collectedGenes = [];
    selectedPartId = null;
    malignantBus.emit('restart_requested', {});
  }

  function buildDisabled(command: BuildCommand, cost: number | string) {
    if (ui.phase === 'placement') return false;
    if (command === 'energy' && ui.units.cap >= 25) return true;
    if ((command === 'pcr' || command === 'gel' || command === 'incubator') && ui.buildings[command] > 0) return true;
    if (command === 'bioreactor' && ui.production.queued + ui.units.total >= ui.units.cap) return true;
    return typeof cost === 'number' && ui.nutrients < cost;
  }

  function buildStatus(command: BuildCommand, cost: number | string) {
    if (ui.phase === 'placement') return typeof cost === 'string' ? cost : `${cost} nutrients`;
    if (command === 'energy' && ui.units.cap >= 25) return 'unit cap maxed';
    if ((command === 'pcr' || command === 'gel' || command === 'incubator') && ui.buildings[command] > 0) return 'built';
    if (command === 'bioreactor' && ui.production.queued + ui.units.total >= ui.units.cap) return 'unit cap full';
    if (typeof cost === 'number' && ui.nutrients < cost) return `${cost} nutrients`;
    return typeof cost === 'number' && cost > 0 ? `${cost} nutrients` : 'frontier';
  }

  function selectBuild(command: BuildCommand, cost: number | string) {
    if (buildDisabled(command, cost)) return;
    malignantBus.emit('build_selected', { command: activeBuild === command ? null : command });
  }

  function cancelBuild() {
    malignantBus.emit('build_selected', { command: null });
  }

  function autoSetupLab() {
    malignantBus.emit('auto_setup_requested', {});
  }

  function requestUnit() {
    malignantBus.emit('unit_requested', {});
  }
</script>

<svelte:head>
  <title>Malignant Prototype</title>
</svelte:head>

<main class="malignant-shell">
  <header class="top-bar">
    <span>Time {formatTime(ui.time)} / FPS {ui.fps}</span>
    <span>
      <strong class:warning={nutrientState === 'warning'} class:danger={nutrientState === 'danger'}>Nutrients {ui.nutrients} ({ui.nutrientRate}/s)</strong>
      /
      <strong class:warning={unitState === 'warning'} class:danger={unitState === 'danger'}>Units {ui.units.total}{ui.production.queued > 0 ? `+${ui.production.queued}` : ''}/{ui.units.cap}</strong>
    </span>
    <span>{ui.waveLabel} / {ui.units.carrying} carrying</span>
  </header>

  <section class="play-layout" role="application" oncontextmenu={(event) => event.preventDefault()}>
    <div id="malignant-game" class="game-surface" aria-label="Malignant hex battlefield"></div>

    <section class:danger={leakageDanger} class="leakage-overlay" aria-label="Genome Leakage countdown">
      <span>Genome Leakage</span>
      <strong>{ui.leakageRemaining}s</strong>
    </section>

    <aside class="lab-strip" aria-label="Lab strip">
      <section class="strip-card objective-card">
        <div class="card-title">Focus</div>
        <p class="compact">{onboardingSteps[0]}</p>
        <p class="compact">{onboardingSteps[1]}</p>
        {#if ui.phase === 'placement' && !setupComplete}
          <button class="auto-setup" onclick={autoSetupLab}>Start with Default Lab</button>
        {/if}
      </section>

      <section class="strip-card context-card">
        <div class="card-title">Selection</div>
        {#if ui.units.selected > 0}
          <div class="context-grid">
            <span>Units selected</span><strong>{ui.units.selected}</strong>
            <span>Command</span><strong>Right-click map</strong>
          </div>
          <p class="compact">Drag-select or Shift-click for groups. Selected units fire visible yellow projectiles at ranged targets.</p>
        {:else if ui.selectedBuilding === 'bioreactor'}
          <div class="context-grid">
            <span>Type</span><strong>growth building</strong>
            <span>Unit count</span><strong>{ui.units.total}/{ui.units.cap}</strong>
            <span>Queue</span><strong>{ui.production.queued}{ui.production.remaining > 0 ? ` / ${ui.production.remaining}s` : ''}</strong>
            <span>Biology</span><strong>cell division</strong>
            <span>Cost</span><strong>20 nutrients</strong>
          </div>
          <button class="context-action" disabled={ui.nutrients < 20 || ui.units.total + ui.production.queued >= ui.units.cap} onclick={requestUnit}>Queue Unit</button>
        {:else if ui.selectedBuilding === 'energy'}
          <div class="context-grid">
            <span>Type</span><strong>support building</strong>
            <span>Unit cap</span><strong>{ui.units.cap}</strong>
            <span>Biology</span><strong>metabolic capacity</strong>
          </div>
        {:else if ui.selectedBuilding === 'sprout'}
          <div class="context-grid">
            <span>Type</span><strong>economy building</strong>
            <span>Income</span><strong>{ui.nutrientRate}/s</strong>
            <span>Biology</span><strong>angiogenesis</strong>
          </div>
        {:else if ui.selectedBuilding === 'pcr'}
          <div class="context-grid">
            <span>Type</span><strong>instrument building</strong>
            <span>Input</span><strong>{ui.pcrQueue} debris</strong>
            <span>Biology</span><strong>copies DNA from debris</strong>
          </div>
        {:else if ui.selectedBuilding === 'gel'}
          <div class="context-grid">
            <span>Type</span><strong>instrument building</strong>
            <span>Samples</span><strong>{ui.gelQueue}</strong>
            <span>Biology</span><strong>separates DNA bands</strong>
          </div>
          {#if ui.geneReady}
            <p class="compact">{geneMeta[ui.geneReady].name}: {geneMeta[ui.geneReady].effect}</p>
          {/if}
        {:else if ui.selectedBuilding === 'incubator'}
          <div class="context-grid">
            <span>Type</span><strong>expression building</strong>
            <span>Status</span><strong>{ui.incubator.status}</strong>
            <span>Biology</span><strong>protein expression</strong>
          </div>
        {:else}
          <p class="compact">Click a building for details. Push farther from center to find capillaries, but immune density rises fast.</p>
        {/if}
      </section>

      <section class:danger={leakageDanger} class="leakage-card">
        <span>Genome Leakage</span>
        <strong>{ui.leakageRemaining}s</strong>
        <em>{activeGeneLabel}</em>
      </section>

      {#if ui.phase === 'placement'}
        <section class="strip-card">
          <div class="card-title">Placement {ui.placement.remaining}s</div>
          <p class="compact">Next: {ui.placement.nextBuilding ?? 'complete'}</p>
        </section>
      {/if}

      <section class:attract={!activeBuild} class="strip-card build-card">
          <div class="card-title">Build Menu</div>
        <div class="build-grid">
          {#each buildMenu as item (item.command)}
            <button
              class:selected={activeBuild === item.command}
              disabled={buildDisabled(item.command, item.cost)}
              onclick={() => selectBuild(item.command, item.cost)}
            >
              <span class={`build-icon ${item.command}`}></span>
              <strong>{item.label}</strong>
              <small>{item.icon}</small>
              <em>{buildStatus(item.command, item.cost)}</em>
            </button>
          {/each}
        </div>
        <p class="compact build-help">{activeBuild ? buildingHelp[activeBuild] : 'Pick a building to see what it does'}</p>
        {#if activeBuild}
          <button class="cancel-build" onclick={cancelBuild}>Cancel build mode</button>
        {/if}
      </section>

      {#if showInstrumentHud}
        <section class="strip-card systems-card">
          <div class="card-title">Instrument Chain</div>
          <div class="instrument-row"><span>DNA amplifier</span><span>{ui.pcr.status} / {ui.pcrQueue}</span></div>
          <div class="progress-track"><span style:width={`${ui.pcr.progress * 100}%`}></span></div>
          <div class="instrument-row"><span>Gel</span><span>{ui.gel.status} / {ui.gelQueue}</span></div>
          <div class="progress-track gel"><span style:width={`${ui.gel.progress * 100}%`}></span></div>
          {#if ui.geneReady}
            <button class="gene-ready" onclick={() => ui.geneReady && collectGenePart(ui.geneReady)}>
              {geneMeta[ui.geneReady].name} card ready
            </button>
          {/if}
        </section>

      {/if}

      {#if showPlasmidHud}
        <section class="strip-card plasmid-card">
          <div class="card-title">Plasmid Editor</div>
          <div class="slot-rail">
            {#each slotOrder as slot (slot)}
              <button class:filled={slots[slot]} class:shake={invalidSlot === slot} onclick={() => placeSelectedPart(slot)}>
                <span>{slot === 'rbs' ? 'Ribosome site' : slot}</span>
                <strong>{slots[slot]?.label ?? 'EMPTY'}</strong>
              </button>
            {/each}
          </div>
          <div class="part-tray">
            {#each trayParts as part (part.id)}
              <button class:selected={selectedPartId === part.id} onclick={() => selectPart(part)}>{part.label}</button>
            {/each}
          </div>
          <div class="preview">
            <span class={selectedGene === 'sod' ? 'sod-icon' : selectedGene === 'pdl1' ? 'pdl1-icon' : ''}></span>
            <strong>{deployPreview}</strong>
            <i></i>
          </div>
          <button class="deploy" class:pulse={plasmidComplete} disabled={!plasmidComplete} onclick={deploy}>Deploy</button>
        </section>

        <section class="strip-card">
          <div class="card-title">Incubator</div>
          <div class="incubator-bar"><span style:width={`${incubatorProgress}%`}></span></div>
          <p class="compact">{ui.incubator.status === 'integrating' ? `integrating ${ui.incubator.remaining}s` : ui.incubator.status}</p>
        </section>
      {/if}

      <p class="status-line">{ui.message}</p>
    </aside>

  </section>

  {#if ui.phase === 'won' || ui.phase === 'lost'}
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <section class="end-screen">
        <h2>{ui.phase === 'won' ? 'Colony Survived' : 'Founder Cell Destroyed'}</h2>
        <p>Time survived: {formatTime(ui.endStats?.survived ?? ui.time)}</p>
        <p>Instrument chains: {ui.endStats?.chainsCompleted ?? 0}</p>
        <p>Adaptations survived: {ui.endStats?.adaptationsSurvived ?? 0}</p>
        {#if ui.phase === 'lost'}
          <p>{ui.endStats?.cause}</p>
        {/if}
        <p>Seed: {ui.endStats?.seed}</p>
        {#if ui.endStats && ui.endStats.adaptationLog.length > 0}
          <p>Genome Leakage: {ui.endStats.adaptationLog.map(time => formatTime(time)).join(', ')}</p>
        {/if}
        <button onclick={restart}>Retry</button>
      </section>
    </div>
  {/if}
</main>
