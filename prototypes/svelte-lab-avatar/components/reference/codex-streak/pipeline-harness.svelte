<script lang="ts">
  import {
    drawBiomassMap,
    drawFilmMap,
    drawFounderMap,
    drawNutrientWasteMap,
    drawRenderMap,
    type BiomassViewMode,
    type FilmViewMode,
    type FounderViewMode,
    type NutrientViewMode,
    type RenderViewMode,
  } from './debug-renderer';
  import { computeGrowth } from './growth-engine';
  import { computeRenderMaps } from './render-synth';
  import { seedDirtyFounderRegion, seedFounderGrid } from './seeding-engine';
  import {
    applyTransferAction,
    CANONICAL_TRANSFER_SCENARIOS,
    createCanonicalTransferSession,
    replayTransferSession,
  } from './transfer-engine';
  import {
    DEBUG_LOG_DEFAULT,
    DEFAULT_SPECIES,
    SIM,
    createPlateSession,
    createTransferSnapshot,
    normalizeSpeciesLoads,
    rectArea,
    type FounderGrid,
    type Rect,
    type SeedingMetrics,
    type SpeciesDef,
    type TransferMetrics,
    type TransferScenarioId,
    type Vec2,
  } from './streak-types';
  import {
    computeSeedingMetrics,
    computeTransferMetrics,
    founderGridEquals,
  } from './validation';

  type GrowthPanelMode = BiomassViewMode | NutrientViewMode;

  const speciesConfig: SpeciesDef[] = DEFAULT_SPECIES.map((species) => ({ ...species }));
  const resolution = SIM.defaultResolution;

  const initialSession = createPlateSession(speciesConfig);
  const initialSnapshot = createTransferSnapshot(speciesConfig.length, resolution);
  const initialSeeded = seedFounderGrid(initialSnapshot.film, speciesConfig, initialSession.plateSeed);

  let session = $state(initialSession);
  let transferSnapshot = $state.raw(initialSnapshot);
  let founderGrid = $state.raw<FounderGrid>(initialSeeded.founders);
  let biomassFounders = $state.raw<FounderGrid>(initialSeeded.founders);

  let sliderValues = $state<number[]>([45, 35, 20]);
  let selectedScenarioId = $state<TransferScenarioId | null>(null);
  let selectedSpeciesIndex = $state(0);
  let filmMode = $state<FilmViewMode>('total');
  let founderMode = $state<FounderViewMode>('total');
  let growthMode = $state<GrowthPanelMode>('coverage-total');
  let renderMode = $state<RenderViewMode>('shaded');
  let seedingMetrics = $state<SeedingMetrics>(
    createSeedingMetrics(initialSeeded.founders, null, initialSeeded.dirtyRect),
  );

  let isDrawing = $state(false);
  let activePointerId = $state<number | null>(null);
  let lastPoint = $state<Vec2 | null>(null);

  let transferVersion = $state(0);
  let founderVersion = $state(0);

  let plateCanvas: HTMLCanvasElement | null = null;
  let filmCanvas: HTMLCanvasElement | null = null;
  let founderCanvas: HTMLCanvasElement | null = null;
  let growthCanvas: HTMLCanvasElement | null = null;
  let renderCanvas: HTMLCanvasElement | null = null;

  const loadPreview = $derived(normalizeSpeciesLoads(sliderValues, speciesConfig.length));
  const selectedSpecies = $derived(speciesConfig[selectedSpeciesIndex] ?? speciesConfig[0]);
  const transferDirtyRect = $derived.by(() => {
    transferVersion;
    return transferSnapshot.lastStrokeReport?.dirtyRect ?? transferSnapshot.dirtyRect;
  });
  const transferDirtyArea = $derived(rectArea(transferDirtyRect));
  const transferStatus = $derived.by(() => {
    transferVersion;
    return isDrawing ? 'Streaking' : transferSnapshot.loop.isSterile ? 'Sterile' : 'Loaded';
  });
  const selectedScenario = $derived(
    selectedScenarioId
      ? CANONICAL_TRANSFER_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) ?? null
      : null,
  );
  const transferMetrics = $derived.by<TransferMetrics>(() => {
    transferVersion;
    return computeTransferMetrics(transferSnapshot);
  });
  const maxConservationError = $derived.by(() => {
    transferVersion;
    let maxValue = 0;
    for (const value of transferMetrics.conservationError) {
      if (value > maxValue) maxValue = value;
    }
    return maxValue;
  });
  const totalFounders = $derived.by(() => {
    let total = 0;
    for (const value of seedingMetrics.founderTotals) total += value;
    return total;
  });
  const biomass = $derived.by(() =>
    computeGrowth(biomassFounders, speciesConfig, session.targetTime, resolution),
  );
  const renderMaps = $derived.by(() => {
    transferVersion;
    const currentBiomass = biomass;
    return computeRenderMaps(transferSnapshot.film, currentBiomass, speciesConfig, resolution);
  });
  const growthStats = $derived.by(() => {
    const cellCount = biomass.totalCoverage.length;
    let confluentCells = 0;
    let nutrientSum = 0;
    let wasteSum = 0;

    for (let index = 0; index < cellCount; index += 1) {
      if (biomass.totalCoverage[index] > 0.8) confluentCells += 1;
      nutrientSum += biomass.nutrient[index];
      wasteSum += biomass.waste[index];
    }

    return {
      confluence: confluentCells / Math.max(1, cellCount),
      nutrientMean: nutrientSum / Math.max(1, cellCount),
      wasteMean: wasteSum / Math.max(1, cellCount),
    };
  });
  const renderStats = $derived.by(() => {
    const maps = renderMaps;
    let insideCells = 0;
    let heightPeak = 0;
    let roughnessSum = 0;
    let wetSum = 0;
    let alphaCells = 0;
    let betaCells = 0;

    for (let index = 0; index < maps.height.length; index += 1) {
      if (maps.albedo[index * 4 + 3] === 0) continue;

      insideCells += 1;
      if (maps.height[index] > heightPeak) heightPeak = maps.height[index];
      roughnessSum += maps.roughness[index];
      wetSum += maps.wetMask[index];
      if (maps.hemolysisAlpha[index] > 0.05) alphaCells += 1;
      if (maps.hemolysisBeta[index] > 0.05) betaCells += 1;
    }

    return {
      heightPeak,
      roughnessMean: roughnessSum / Math.max(1, insideCells),
      wetMean: wetSum / Math.max(1, insideCells),
      alphaCells,
      betaCells,
    };
  });
  const sectorRows = $derived.by(() => {
    transferVersion;
    return transferSnapshot.loop.sectors.map((sector, index) => {
      const combinedLoad = sector.load.map((value, speciesIndex) => value + sector.captured[speciesIndex]);
      const totalLoad = combinedLoad.reduce((sum, value) => sum + value, 0);
      return {
        index,
        fluid: sector.fluid,
        segments: combinedLoad.map((value, speciesIndex) => ({
          speciesIndex,
          value,
          width: totalLoad > 0 ? (value / totalLoad) * 100 : 0,
        })),
      };
    });
  });

  $effect(() => {
    transferVersion;
    selectedSpeciesIndex;
    if (!plateCanvas) return;

    drawFilmMap(plateCanvas, transferSnapshot.film, speciesConfig, {
      mode: 'total',
      speciesIndex: selectedSpeciesIndex,
      dirtyRect: transferDirtyRect,
      deltaMaps: transferSnapshot.deltaMaps,
    });
  });

  $effect(() => {
    transferVersion;
    filmMode;
    selectedSpeciesIndex;
    if (!filmCanvas) return;

    drawFilmMap(filmCanvas, transferSnapshot.film, speciesConfig, {
      mode: filmMode,
      speciesIndex: selectedSpeciesIndex,
      dirtyRect: transferDirtyRect,
      deltaMaps: transferSnapshot.deltaMaps,
    });
  });

  $effect(() => {
    founderVersion;
    founderMode;
    selectedSpeciesIndex;
    if (!founderCanvas) return;

    drawFounderMap(founderCanvas, founderGrid, speciesConfig, {
      mode: founderMode,
      speciesIndex: selectedSpeciesIndex,
      dirtyRect: transferDirtyRect,
    });
  });

  $effect(() => {
    const currentBiomass = biomass;
    const mode = growthMode;
    const speciesIndex = selectedSpeciesIndex;
    if (!growthCanvas) return;

    if (isNutrientMode(mode)) {
      drawNutrientWasteMap(growthCanvas, currentBiomass, { mode });
      return;
    }

    drawBiomassMap(growthCanvas, currentBiomass, {
      mode,
      speciesIndex,
      species: speciesConfig,
    });
  });

  $effect(() => {
    const maps = renderMaps;
    const mode = renderMode;
    if (!renderCanvas) return;

    drawRenderMap(renderCanvas, maps, { mode });
  });

  function handleLoadSample() {
    selectedScenarioId = null;
    appendAction({
      type: 'loadSample',
      speciesLoads: loadPreview,
      timestamp: Date.now(),
    });
  }

  function handleSterilize() {
    selectedScenarioId = null;
    appendAction({
      type: 'sterilize',
      timestamp: Date.now(),
    });
  }

  function handleReset() {
    selectedScenarioId = null;
    const nextSession = createPlateSession(speciesConfig);
    const nextSnapshot = createTransferSnapshot(speciesConfig.length, resolution);
    const nextSeeded = seedFounderGrid(nextSnapshot.film, speciesConfig, nextSession.plateSeed);

    session = nextSession;
    transferSnapshot = nextSnapshot;
    sliderValues = [45, 35, 20];
    commitFounders(nextSeeded.founders, null, nextSeeded.dirtyRect);
    biomassFounders = nextSeeded.founders;
    transferVersion += 1;
    isDrawing = false;
    activePointerId = null;
    lastPoint = null;
  }

  function handleScenario(id: TransferScenarioId) {
    selectedScenarioId = id;
    const nextSession = createCanonicalTransferSession(speciesConfig, id);
    const nextSnapshot = replayTransferSession(nextSession, resolution, DEBUG_LOG_DEFAULT);
    const nextSeeded = seedFounderGrid(nextSnapshot.film, speciesConfig, nextSession.plateSeed);

    session = nextSession;
    transferSnapshot = nextSnapshot;
    commitFounders(nextSeeded.founders, null, nextSeeded.dirtyRect);
    biomassFounders = nextSeeded.founders;
    transferVersion += 1;
  }

  function handlePointerDown(event: PointerEvent) {
    if (!plateCanvas) return;
    const point = toPlatePoint(event, plateCanvas);
    if (!point) return;

    selectedScenarioId = null;
    plateCanvas.setPointerCapture(event.pointerId);
    isDrawing = true;
    activePointerId = event.pointerId;
    lastPoint = point;
    appendAction({ type: 'beginStroke', timestamp: Date.now() });
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isDrawing || activePointerId !== event.pointerId || !lastPoint || !plateCanvas) return;
    const point = toPlatePoint(event, plateCanvas);
    if (!point) return;

    appendAction({
      type: 'strokeSegment',
      from: lastPoint,
      to: point,
      pressure: event.pressure > 0 ? event.pressure : 0.58,
      timestamp: Date.now(),
    });
    lastPoint = point;
  }

  function handlePointerFinish(event: PointerEvent) {
    if (!isDrawing || activePointerId !== event.pointerId) return;
    finishStroke();
  }

  function handlePointerCancel() {
    if (!isDrawing) return;
    finishStroke();
  }

  function appendAction(action: Parameters<typeof applyTransferAction>[1]) {
    session.actionLog.push(action);
    applyTransferAction(transferSnapshot, action, speciesConfig, DEBUG_LOG_DEFAULT);
    transferVersion += 1;

    if (action.type === 'strokeSegment') {
      const previous = founderGrid;
      const seeded = seedDirtyFounderRegion(
        founderGrid,
        transferSnapshot.film,
        speciesConfig,
        session.plateSeed,
        transferSnapshot.dirtyRect,
      );
      commitFounders(seeded.founders, previous, seeded.dirtyRect);
    }

    if (action.type === 'endStroke') {
      biomassFounders = founderGrid;
    }
  }

  function commitFounders(nextFounders: FounderGrid, previous: FounderGrid | null, dirtyRect: Rect | null) {
    founderGrid = nextFounders;
    seedingMetrics = createSeedingMetrics(nextFounders, previous, dirtyRect);
    founderVersion += 1;
  }

  function createSeedingMetrics(current: FounderGrid, previous: FounderGrid | null, dirtyRect: Rect | null): SeedingMetrics {
    const replayed = seedFounderGrid(transferSnapshot.film, speciesConfig, session.plateSeed);
    return {
      ...computeSeedingMetrics(current, previous, dirtyRect),
      deterministic: founderGridEquals(current, replayed.founders),
    };
  }

  function finishStroke() {
    appendAction({ type: 'endStroke', timestamp: Date.now() });
    isDrawing = false;
    activePointerId = null;
    lastPoint = null;
  }

  function toPlatePoint(event: PointerEvent, canvas: HTMLCanvasElement): Vec2 | null {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }

  function isNutrientMode(mode: GrowthPanelMode): mode is NutrientViewMode {
    return mode === 'nutrient' || mode === 'waste';
  }

  function formatDecimal(value: number): string {
    return value.toFixed(3);
  }

  function formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  function transferViewLabel(mode: FilmViewMode): string {
    switch (mode) {
      case 'species':
        return `${selectedSpecies.name} film`;
      case 'fluid':
        return 'deposit fluid';
      case 'groove':
        return 'groove';
      case 'pickup-delta':
        return 'pickup delta';
      case 'net-delta':
        return 'net delta';
      case 'last-stroke-delta':
        return 'stroke delta';
      default:
        return 'total film';
    }
  }

  function founderViewLabel(mode: FounderViewMode): string {
    return mode === 'species' ? `${selectedSpecies.name} founders` : 'total founders';
  }

  function growthViewLabel(mode: GrowthPanelMode): string {
    switch (mode) {
      case 'biomass-total':
        return 'total biomass';
      case 'biomass-species':
        return `${selectedSpecies.name} biomass`;
      case 'coverage-total':
        return 'total coverage';
      case 'coverage-species':
        return `${selectedSpecies.name} coverage`;
      case 'nutrient':
        return 'nutrient';
      case 'waste':
        return 'waste';
    }
  }

  function renderViewLabel(mode: RenderViewMode): string {
    switch (mode) {
      case 'height':
        return 'height';
      case 'albedo':
        return 'albedo';
      case 'roughness':
        return 'roughness';
      case 'wet':
        return 'wet mask';
      case 'groove':
        return 'groove mask';
      case 'hemolysis':
        return 'hemolysis';
      case 'shaded':
      default:
        return 'shaded';
    }
  }
</script>

<div
  class="min-h-screen bg-[var(--bg-darkest)] text-[var(--parchment)]"
  data-ref="codex-streak-dashboard"
>
  <div class="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 lg:px-6">
    <header class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brass-dark)] bg-[linear-gradient(180deg,rgba(58,53,46,0.92),rgba(26,24,21,0.96))] px-5 py-4">
      <div class="space-y-1">
        <p class="font-[var(--font-heading)] text-xs uppercase tracking-[0.3em] text-[var(--brass)]">Codex Streak</p>
        <h1 class="font-[var(--font-heading)] text-2xl text-[var(--parchment)]">Single Dashboard</h1>
        <p class="text-sm text-[var(--parchment-aged)]">
          Streak once, then inspect transfer, seeding, growth, and render without leaving the page.
        </p>
      </div>

      <nav class="flex flex-wrap gap-2">
        <a class="btn btn-sm" href="#/">Back to Lab</a>
        <a class="btn btn-sm btn-primary" href="#/reference">Reference</a>
      </nav>
    </header>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_340px]">
      <section class="panel overflow-hidden" data-ref="streak-plate-card">
        <div class="panel-header flex items-center justify-between gap-3">
          <span>Streak Plate</span>
          <span
            class={[
              'rounded-full px-2.5 py-0.5 text-xs uppercase tracking-[0.18em]',
              isDrawing ? 'bg-[var(--status-busy)] text-[var(--bg-darkest)]' : 'bg-[var(--bg-medium)] text-[var(--parchment-aged)]',
            ]}
          >
            {transferStatus}
          </span>
        </div>

        <div class="space-y-4 bg-[var(--bg-dark)] p-4">
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--parchment-aged)]">
            <p class="max-w-2xl">
              Drag directly on the plate. Each completed stroke updates the founder snapshot, the growth simulation, and the render maps.
            </p>
            <div class="flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em]">
              <span>Scenario: <span class="text-[var(--parchment)]">{selectedScenario?.name ?? 'Live session'}</span></span>
              <span>Time: <span class="text-[var(--parchment)]">{session.targetTime}h</span></span>
            </div>
          </div>

          <div class="rounded-2xl border border-[var(--brass-dark)] bg-[radial-gradient(circle_at_top,#633231,#2b1b1a_60%,#120f0d)] p-3">
            <canvas
              bind:this={plateCanvas}
              aria-label="Streak plate"
              class="no-select aspect-square w-full touch-none rounded-xl border border-[var(--brass-dark)] bg-black/50"
              data-ref="codex-plate-canvas"
              width={SIM.displaySize}
              height={SIM.displaySize}
              onpointerdown={handlePointerDown}
              onpointermove={handlePointerMove}
              onpointerup={handlePointerFinish}
              onpointercancel={handlePointerFinish}
              onlostpointercapture={handlePointerCancel}
            ></canvas>
          </div>

          <div class="grid gap-2 sm:grid-cols-4">
            {#each sectorRows as sector (sector.index)}
              <div class="rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-medium)]/60 p-2">
                <div class="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.18em] text-[var(--parchment-aged)]">
                  <span>Sector {sector.index + 1}</span>
                  <span>{formatDecimal(sector.fluid)}</span>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-darkest)]">
                  <div class="flex h-full">
                    {#each sector.segments as segment (`sector-${sector.index}-${segment.speciesIndex}`)}
                      <div
                        class="h-full"
                        style={`width:${segment.width}%;background:${speciesConfig[segment.speciesIndex].color}`}
                      ></div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <aside class="space-y-4">
        <section class="panel overflow-hidden">
          <div class="panel-header">Controls</div>
          <div class="space-y-4 bg-[var(--bg-dark)] p-4">
            <div class="space-y-3">
              {#each speciesConfig as species, index (species.id)}
                <div class="space-y-1">
                  <div class="flex items-center justify-between gap-3 text-xs text-[var(--parchment-aged)]">
                    <span class="flex items-center gap-2">
                      <span class="inline-block h-2 w-2 rounded-full" style={`background:${species.color}`}></span>
                      {species.name}
                    </span>
                    <span class="font-[var(--font-mono)] text-[var(--parchment)]">{Math.round(loadPreview[index] * 100)}%</span>
                  </div>
                  <input
                    class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--bg-medium)] accent-[var(--brass)]"
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValues[index]}
                    oninput={(event) => {
                      sliderValues[index] = Number((event.currentTarget as HTMLInputElement).value);
                    }}
                  />
                </div>
              {/each}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button class="btn" onclick={handleLoadSample}>Load Sample</button>
              <button class="btn" onclick={handleSterilize}>Sterilize</button>
              <button class="btn col-span-2" onclick={handleReset}>Reset Plate</button>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-[var(--font-heading)] uppercase tracking-[0.14em] text-[var(--brass)]">Incubation</span>
                <span class="font-[var(--font-mono)] text-[var(--parchment)]" data-ref="incubation-hours">{session.targetTime}h</span>
              </div>
              <input
                class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--bg-medium)] accent-[var(--brass)]"
                data-ref="incubation-slider"
                type="range"
                min="0"
                max="72"
                step="0.5"
                value={session.targetTime}
                oninput={(event) => {
                  session.targetTime = Number((event.currentTarget as HTMLInputElement).value);
                }}
              />
              <div class="flex justify-between text-xs text-[var(--parchment-aged)]">
                <span>0h</span>
                <span>72h</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel overflow-hidden">
          <div class="panel-header">Quick Scenarios</div>
          <div class="space-y-2 bg-[var(--bg-dark)] p-3">
            {#each CANONICAL_TRANSFER_SCENARIOS as scenario (scenario.id)}
              <button
                class={[
                  'w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                  selectedScenarioId === scenario.id
                    ? 'border-[var(--brass)] bg-[var(--bg-medium)] text-[var(--parchment)]'
                    : 'border-[var(--brass-dark)] bg-[var(--bg-darkest)]/60 text-[var(--parchment-aged)] hover:border-[var(--brass)]/60',
                ]}
                onclick={() => handleScenario(scenario.id)}
              >
                <p class="font-[var(--font-heading)] uppercase tracking-[0.14em] text-[var(--brass)]">{scenario.name}</p>
                <p class="mt-1">{scenario.description}</p>
              </button>
            {/each}
          </div>
        </section>
      </aside>
    </div>

    <div class="grid gap-4 xl:grid-cols-4">
      <section class="panel overflow-hidden" data-ref="transfer-card">
        <div class="panel-header">Transfer</div>
        <div class="space-y-3 bg-[var(--bg-dark)] p-4">
          <canvas
            bind:this={filmCanvas}
            class="aspect-square w-full rounded-xl border border-[var(--brass-dark)] bg-black/40"
            width={SIM.displaySize}
            height={SIM.displaySize}
          ></canvas>

          <div class="grid gap-2 text-xs text-[var(--parchment-aged)] sm:grid-cols-3">
            <div>View: <span class="text-[var(--parchment)]" data-ref="transfer-view-label">{transferViewLabel(filmMode)}</span></div>
            <div>Dirty area: <span class="text-[var(--parchment)]" data-ref="transfer-dirty-area">{transferDirtyArea}</span></div>
            <div>Max error: <span class="text-[var(--parchment)]" data-ref="transfer-max-error">{formatPercent(maxConservationError)}</span></div>
          </div>

          <details class="rounded-xl border border-[var(--brass-dark)] bg-[var(--bg-medium)]/45">
            <summary class="cursor-pointer px-3 py-2 font-[var(--font-heading)] text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
              Diagnostics
            </summary>
            <div class="space-y-3 border-t border-[var(--brass-dark)] p-3">
              <div class="flex flex-wrap gap-1.5">
                <button class={['btn btn-sm', filmMode === 'total' && 'active']} onclick={() => filmMode = 'total'}>Total</button>
                <button class={['btn btn-sm', filmMode === 'species' && 'active']} onclick={() => filmMode = 'species'}>Species</button>
                <button class={['btn btn-sm', filmMode === 'fluid' && 'active']} onclick={() => filmMode = 'fluid'}>Fluid</button>
                <button class={['btn btn-sm', filmMode === 'groove' && 'active']} onclick={() => filmMode = 'groove'}>Groove</button>
                <button class={['btn btn-sm', filmMode === 'last-stroke-delta' && 'active']} onclick={() => filmMode = 'last-stroke-delta'}>Delta</button>
              </div>

              <label class="flex items-center gap-3 text-sm text-[var(--parchment-aged)]">
                <span class="min-w-24 font-[var(--font-heading)] uppercase tracking-[0.14em] text-[var(--brass)]">Species</span>
                <select class="select max-w-52" bind:value={selectedSpeciesIndex}>
                  {#each speciesConfig as species, index (species.id)}
                    <option value={index}>{species.name}</option>
                  {/each}
                </select>
              </label>

              <div class="grid gap-2 text-sm text-[var(--parchment-aged)]">
                {#each transferMetrics.conservationError as value, index (`transfer-error-${index}`)}
                  <div class="flex items-center justify-between gap-3 rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                    <span class="flex items-center gap-2">
                      <span class="inline-block h-2 w-2 rounded-full" style={`background:${speciesConfig[index].color}`}></span>
                      {speciesConfig[index].name}
                    </span>
                    <span class="font-[var(--font-mono)] text-[var(--parchment)]">{formatPercent(value)}</span>
                  </div>
                {/each}
              </div>
            </div>
          </details>
        </div>
      </section>

      <section class="panel overflow-hidden" data-ref="seeding-card">
        <div class="panel-header">Seeding</div>
        <div class="space-y-3 bg-[var(--bg-dark)] p-4">
          <canvas
            bind:this={founderCanvas}
            class="aspect-square w-full rounded-xl border border-[var(--brass-dark)] bg-black/40"
            width={SIM.displaySize}
            height={SIM.displaySize}
          ></canvas>

          <div class="grid gap-2 text-xs text-[var(--parchment-aged)] sm:grid-cols-3">
            <div>View: <span class="text-[var(--parchment)]" data-ref="founder-view-label">{founderViewLabel(founderMode)}</span></div>
            <div>Founders: <span class="text-[var(--parchment)]" data-ref="founder-total">{totalFounders}</span></div>
            <div>Changed cells: <span class="text-[var(--parchment)]" data-ref="founder-changed-cells">{seedingMetrics.changedCells}</span></div>
          </div>

          <details class="rounded-xl border border-[var(--brass-dark)] bg-[var(--bg-medium)]/45">
            <summary class="cursor-pointer px-3 py-2 font-[var(--font-heading)] text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
              Diagnostics
            </summary>
            <div class="space-y-3 border-t border-[var(--brass-dark)] p-3">
              <div class="flex flex-wrap gap-1.5">
                <button class={['btn btn-sm', founderMode === 'total' && 'active']} onclick={() => founderMode = 'total'}>Total</button>
                <button class={['btn btn-sm', founderMode === 'species' && 'active']} onclick={() => founderMode = 'species'}>Species</button>
              </div>

              <label class="flex items-center gap-3 text-sm text-[var(--parchment-aged)]">
                <span class="min-w-24 font-[var(--font-heading)] uppercase tracking-[0.14em] text-[var(--brass)]">Species</span>
                <select class="select max-w-52" bind:value={selectedSpeciesIndex}>
                  {#each speciesConfig as species, index (species.id)}
                    <option value={index}>{species.name}</option>
                  {/each}
                </select>
              </label>

              <div class="grid gap-2 text-sm text-[var(--parchment-aged)]">
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Dirty-region halo</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{seedingMetrics.haloArea}</span>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Deterministic replay</span>
                  <span class={seedingMetrics.deterministic ? 'font-[var(--font-mono)] text-emerald-300' : 'font-[var(--font-mono)] text-amber-300'}>
                    {seedingMetrics.deterministic ? 'Match' : 'Mismatch'}
                  </span>
                </div>
                {#each seedingMetrics.founderTotals as value, index (`founder-total-${index}`)}
                  <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                    <span class="flex items-center gap-2">
                      <span class="inline-block h-2 w-2 rounded-full" style={`background:${speciesConfig[index].color}`}></span>
                      {speciesConfig[index].name}
                    </span>
                    <span class="font-[var(--font-mono)] text-[var(--parchment)]">{value}</span>
                  </div>
                {/each}
              </div>
            </div>
          </details>
        </div>
      </section>

      <section class="panel overflow-hidden" data-ref="growth-card">
        <div class="panel-header">Growth</div>
        <div class="space-y-3 bg-[var(--bg-dark)] p-4">
          <canvas
            bind:this={growthCanvas}
            class="aspect-square w-full rounded-xl border border-[var(--brass-dark)] bg-black/40"
            width={SIM.displaySize}
            height={SIM.displaySize}
          ></canvas>

          <div class="grid gap-2 text-xs text-[var(--parchment-aged)] sm:grid-cols-3">
            <div>View: <span class="text-[var(--parchment)]" data-ref="growth-view-label">{growthViewLabel(growthMode)}</span></div>
            <div>Confluence: <span class="text-[var(--parchment)]" data-ref="growth-confluence">{formatPercent(growthStats.confluence)}</span></div>
            <div>Nutrient: <span class="text-[var(--parchment)]" data-ref="growth-nutrient">{formatDecimal(growthStats.nutrientMean)}</span></div>
          </div>

          <details class="rounded-xl border border-[var(--brass-dark)] bg-[var(--bg-medium)]/45">
            <summary class="cursor-pointer px-3 py-2 font-[var(--font-heading)] text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
              Diagnostics
            </summary>
            <div class="space-y-3 border-t border-[var(--brass-dark)] p-3">
              <div class="flex flex-wrap gap-1.5">
                <button class={['btn btn-sm', growthMode === 'biomass-total' && 'active']} onclick={() => growthMode = 'biomass-total'}>Biomass</button>
                <button class={['btn btn-sm', growthMode === 'biomass-species' && 'active']} onclick={() => growthMode = 'biomass-species'}>Species Biomass</button>
                <button class={['btn btn-sm', growthMode === 'coverage-total' && 'active']} onclick={() => growthMode = 'coverage-total'}>Coverage</button>
                <button class={['btn btn-sm', growthMode === 'coverage-species' && 'active']} onclick={() => growthMode = 'coverage-species'}>Species Coverage</button>
                <button class={['btn btn-sm', growthMode === 'nutrient' && 'active']} onclick={() => growthMode = 'nutrient'}>Nutrient</button>
                <button class={['btn btn-sm', growthMode === 'waste' && 'active']} onclick={() => growthMode = 'waste'}>Waste</button>
              </div>

              <label class="flex items-center gap-3 text-sm text-[var(--parchment-aged)]">
                <span class="min-w-24 font-[var(--font-heading)] uppercase tracking-[0.14em] text-[var(--brass)]">Species</span>
                <select class="select max-w-52" bind:value={selectedSpeciesIndex}>
                  {#each speciesConfig as species, index (species.id)}
                    <option value={index}>{species.name}</option>
                  {/each}
                </select>
              </label>

              <div class="grid gap-2 text-sm text-[var(--parchment-aged)]">
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Waste mean</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{formatDecimal(growthStats.wasteMean)}</span>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Selected species</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{selectedSpecies.name}</span>
                </div>
                <div class="rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2 text-xs text-[var(--parchment-aged)]">
                  Growth only re-snapshots founders on completed strokes, so incubation scrubbing stays responsive while you draw.
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      <section class="panel overflow-hidden" data-ref="render-card">
        <div class="panel-header">Render</div>
        <div class="space-y-3 bg-[var(--bg-dark)] p-4">
          <canvas
            bind:this={renderCanvas}
            class="aspect-square w-full rounded-xl border border-[var(--brass-dark)] bg-black/40"
            data-ref="render-canvas"
            width={SIM.displaySize}
            height={SIM.displaySize}
          ></canvas>

          <div class="grid gap-2 text-xs text-[var(--parchment-aged)] sm:grid-cols-3">
            <div>View: <span class="text-[var(--parchment)]" data-ref="render-view-label">{renderViewLabel(renderMode)}</span></div>
            <div>Height peak: <span class="text-[var(--parchment)]" data-ref="render-height-peak">{formatDecimal(renderStats.heightPeak)}</span></div>
            <div>Wet mean: <span class="text-[var(--parchment)]" data-ref="render-wet-mean">{formatDecimal(renderStats.wetMean)}</span></div>
          </div>

          <details class="rounded-xl border border-[var(--brass-dark)] bg-[var(--bg-medium)]/45">
            <summary class="cursor-pointer px-3 py-2 font-[var(--font-heading)] text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
              Diagnostics
            </summary>
            <div class="space-y-3 border-t border-[var(--brass-dark)] p-3">
              <div class="flex flex-wrap gap-1.5">
                <button class={['btn btn-sm', renderMode === 'shaded' && 'active']} onclick={() => renderMode = 'shaded'}>Shaded</button>
                <button class={['btn btn-sm', renderMode === 'height' && 'active']} onclick={() => renderMode = 'height'}>Height</button>
                <button class={['btn btn-sm', renderMode === 'albedo' && 'active']} onclick={() => renderMode = 'albedo'}>Albedo</button>
                <button class={['btn btn-sm', renderMode === 'roughness' && 'active']} onclick={() => renderMode = 'roughness'}>Roughness</button>
                <button class={['btn btn-sm', renderMode === 'wet' && 'active']} onclick={() => renderMode = 'wet'}>Wet</button>
                <button class={['btn btn-sm', renderMode === 'groove' && 'active']} onclick={() => renderMode = 'groove'}>Groove</button>
                <button class={['btn btn-sm', renderMode === 'hemolysis' && 'active']} onclick={() => renderMode = 'hemolysis'}>Hemolysis</button>
              </div>

              <div class="grid gap-2 text-sm text-[var(--parchment-aged)]">
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Roughness mean</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{formatDecimal(renderStats.roughnessMean)}</span>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Beta halo cells</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{renderStats.betaCells}</span>
                </div>
                <div class="flex items-center justify-between rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2">
                  <span>Alpha halo cells</span>
                  <span class="font-[var(--font-mono)] text-[var(--parchment)]">{renderStats.alphaCells}</span>
                </div>
                <div class="rounded-lg border border-[var(--brass-dark)] bg-[var(--bg-darkest)]/70 px-3 py-2 text-xs text-[var(--parchment-aged)]">
                  RenderSynth stays downstream of the biology: wetness and grooves come from transfer, while height and hemolysis only emerge from grown coverage.
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  </div>
</div>
