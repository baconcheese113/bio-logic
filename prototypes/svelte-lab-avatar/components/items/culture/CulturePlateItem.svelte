<script lang="ts">
  import type { CulturePlateMeta, Item } from '../../../lib/types';
  import { getCulturePlate } from '../../../lib/types';
  import {
    applyContaminationToFounders,
    buildPickupLoadsFromBiomass,
    cloneSpeciesConfig,
    contaminationBurden,
    createCultureMeta,
    cultureMediumForMediaType,
    ensureContaminantSpecies,
    getSpeciesSourceLabel,
    incubationHoursFromTicks,
    startCultureIncubation,
  } from './codex-culture-bridge';
  import { getWorkbench } from '../../workbench/workbench-context.svelte';
  import {
    drawFilmMap,
    type FilmViewMode,
  } from '../../reference/codex-streak/debug-renderer';
  import { computeGrowth } from '../../reference/codex-streak/growth-engine';
  import { computeRenderMaps } from '../../reference/codex-streak/render-synth';
  import { seedDirtyFounderRegion, seedFounderGrid } from '../../reference/codex-streak/seeding-engine';
  import {
    DEBUG_LOG_DEFAULT,
    DEFAULT_SPECIES,
    SIM,
    createFilmState,
    createFounderGrid,
    createPlateSession,
    createTransferSnapshot,
    rectArea,
    type Action,
    type FilmState,
    type FounderGrid,
    type SpeciesDef,
    type TransferSnapshot,
    type Vec2,
  } from '../../reference/codex-streak/streak-types';
  import { applyTransferAction, replayTransferSession } from '../../reference/codex-streak/transfer-engine';
  import WebGLRenderPlate from '../../reference/codex-streak/WebGLRenderPlate.svelte';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();

  const wb = getWorkbench();
  const resolution = SIM.defaultResolution;
  const filmMode: FilmViewMode = 'total';
  const fallbackSpeciesConfig = cloneSpeciesConfig([DEFAULT_SPECIES[0]]);

  let cellEl = $state<HTMLDivElement | null>(null);
  let transferCanvas = $state<HTMLCanvasElement | null>(null);

  let initialized = false;
  let cultureMeta = $state<CulturePlateMeta | null>(null);
  let transferSnapshot = $state.raw<TransferSnapshot>(createTransferSnapshot(fallbackSpeciesConfig.length, resolution));
  let founderGrid = $state.raw<FounderGrid>(createFounderGrid(fallbackSpeciesConfig.length, resolution));
  let transferVersion = $state(0);

  let lidTiltX = $state(0);
  let lidTiltY = $state(0);
  let holdingQ = $state(false);
  let holdingE = $state(false);

  let isDrawing = $state(false);
  let activePointerId = $state<number | null>(null);
  let lastPoint = $state<Vec2 | null>(null);

  let isPicking = $state(false);
  let activePickupPointerId = $state<number | null>(null);
  let pickupPoints = $state<Vec2[]>([]);

  const plate = $derived(getCulturePlate(item));
  const plateLabel = $derived(plate?.label ?? 'Petri Dish');
  const baseSpeciesConfig = $derived(cultureMeta?.speciesConfig?.length ? cultureMeta.speciesConfig : fallbackSpeciesConfig);
  const sessionMedium = $derived(cultureMeta?.medium ?? cultureMediumForMediaType(plate?.mediaType ?? null));
  const platePhase = $derived(cultureMeta?.phase ?? plate?.phase ?? 'ready');
  const exposure = $derived(Math.min(1, Math.sqrt(lidTiltX ** 2 + lidTiltY ** 2)));
  const transferDirtyRect = $derived.by(() => {
    transferVersion;
    return transferSnapshot.lastStrokeReport?.dirtyRect ?? transferSnapshot.dirtyRect;
  });
  const transferDirtyArea = $derived(rectArea(transferDirtyRect));
  const contaminationLevel = $derived(
    contaminationBurden(cultureMeta?.contaminationEvents ?? 0, cultureMeta?.totalOpenSeconds ?? 0),
  );
  const hasInoculum = $derived(cultureMeta?.actionLog.some((action) => action.type === 'loadSample') ?? false);
  const hasCompletedStroke = $derived(cultureMeta?.actionLog.some((action) => action.type === 'endStroke') ?? false);
  const incubationHours = $derived(
    incubationHoursFromTicks(wb.currentTick, cultureMeta?.incubationStartedAtTick ?? null),
  );
  const showIncubatedRender = $derived(platePhase === 'incubating' || platePhase === 'grown');
  const pickablePlate = $derived(showIncubatedRender && incubationHours >= 6);
  const displaySpeciesConfig = $derived.by(() => {
    if (!showIncubatedRender || contaminationLevel <= 0.02) return cloneSpeciesConfig(baseSpeciesConfig);
    return ensureContaminantSpecies(baseSpeciesConfig);
  });
  const displayFilm = $derived.by(() => expandFilmState(transferSnapshot.film, displaySpeciesConfig.length));
  const displayFounders = $derived.by(() => {
    const expanded = expandFounderGrid(founderGrid, displaySpeciesConfig.length);
    if (!showIncubatedRender) return expanded;
    return applyContaminationToFounders(
      expanded,
      displaySpeciesConfig,
      cultureMeta?.contaminationEvents ?? 0,
      cultureMeta?.totalOpenSeconds ?? 0,
      cultureMeta?.plateSeed ?? 0,
    );
  });
  const biomass = $derived.by(() =>
    computeGrowth(displayFounders, displaySpeciesConfig, sessionMedium, incubationHours, resolution),
  );
  const renderMaps = $derived.by(() =>
    computeRenderMaps(displayFilm, biomass, displaySpeciesConfig, sessionMedium, resolution),
  );
  const heldLoopState = $derived.by(() => {
    const held = wb.heldItem;
    if (!held?.state || held.state.kind !== 'inoculation-loop') return null;
    return held.state;
  });
  const loopHasInoculum = $derived(
    heldLoopState !== null &&
      heldLoopState.volume > 0 &&
      heldLoopState.speciesLoads.length > 0 &&
      heldLoopState.speciesConfig.length > 0,
  );
  const canSterileCrossStreak = $derived(
    heldLoopState !== null &&
      heldLoopState.isSterile &&
      heldLoopState.volume <= 0.001 &&
      heldLoopState.temperature <= 0.3 &&
      hasCompletedStroke,
  );
  const canDeposit = $derived(
    !showIncubatedRender &&
      holdingQ &&
      exposure >= 0.15 &&
      heldLoopState !== null &&
      heldLoopState.temperature <= 0.3 &&
      (loopHasInoculum || canSterileCrossStreak),
  );
  const canPick = $derived(
    pickablePlate &&
      holdingQ &&
      exposure >= 0.15 &&
      heldLoopState !== null &&
      heldLoopState.temperature <= 0.3 &&
      heldLoopState.volume <= 0.001,
  );
  const incubationReady = $derived(
    !showIncubatedRender &&
      cultureMeta !== null &&
      cultureMeta.actionLog.some((action) => action.type === 'endStroke'),
  );
  const plateSummary = $derived.by(() => {
    if (!hasInoculum) {
      return `${plateLabel} - sterile ready plate`;
    }
    if (!showIncubatedRender) {
      return `${plateLabel} - streaked sample`;
    }
    return `${plateLabel} - ${incubationHours.toFixed(1)}h incubation`;
  });
  const lidHint = $derived.by(() => {
    if (!holdingQ) {
      return showIncubatedRender
        ? 'Hold Q and move the mouse to lift the cover for colony pickup.'
        : 'Hold Q and move the mouse to lift the cover before streaking.';
    }
    if (holdingE) {
      return `Cover locked at ${Math.round(exposure * 100)}% open.`;
    }
    if (heldLoopState?.temperature && heldLoopState.temperature > 0.3) {
      return 'Loop is too hot. Let it cool before touching the plate.';
    }
    if (canDeposit) return 'Drag across the dish to streak the plate.';
    if (canPick) return 'Drag the empty loop across grown colonies to pick them up.';
    if (showIncubatedRender && heldLoopState && heldLoopState.volume > 0.001) {
      return 'Use an empty sterile loop to pick colonies from this plate.';
    }
    if (!showIncubatedRender && canSterileCrossStreak) {
      return 'Sterile loop ready. Drag through an earlier streak to pick up and redeposit cells.';
    }
    if (!showIncubatedRender && heldLoopState && heldLoopState.volume <= 0.001) {
      return 'Dip the loop into a sample first, or pick colonies from another plate.';
    }
    if (exposure < 0.15) return 'Open the cover a little more to reach the agar surface.';
    return `Cover ${Math.round(exposure * 100)}% open. Hold E to keep it there.`;
  });

  $effect(() => {
    if (initialized) return;
    if (item.type !== 'empty-dish' || !item.contents) return;

    const existingMeta = item.contents.meta?.kind === 'culture' ? item.contents.meta : null;
    const nextMeta = existingMeta ?? createCultureMeta(
      cultureMediumForMediaType(plate?.mediaType ?? null),
      fallbackSpeciesConfig,
    );

    if (!existingMeta) {
      wb.mutateItem(item.id, (nextItem) => {
        if (nextItem.contents) {
          nextItem.contents.meta = nextMeta;
        }
      });
    }

    cultureMeta = nextMeta;
    rebuildFromMeta(nextMeta);
    initialized = true;
  });

  $effect(() => {
    transferVersion;
    if (!transferCanvas) return;

    drawFilmMap(transferCanvas, transferSnapshot.film, baseSpeciesConfig, {
      mode: filmMode,
      speciesIndex: 0,
      dirtyRect: transferDirtyRect,
      deltaMaps: transferSnapshot.deltaMaps,
    });
  });

  let decayRafId: number | null = null;

  function startDecay() {
    if (decayRafId !== null) return;
    if (lidTiltX === 0 && lidTiltY === 0) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 16.67;
      last = now;
      const decay = Math.pow(0.92, dt);
      lidTiltX *= decay;
      lidTiltY *= decay;
      if (Math.abs(lidTiltX) < 0.005) lidTiltX = 0;
      if (Math.abs(lidTiltY) < 0.005) lidTiltY = 0;
      if (lidTiltX !== 0 || lidTiltY !== 0) {
        decayRafId = requestAnimationFrame(tick);
      } else {
        decayRafId = null;
      }
    };

    decayRafId = requestAnimationFrame(tick);
  }

  $effect(() => () => {
    if (decayRafId !== null) cancelAnimationFrame(decayRafId);
  });

  $effect(() => {
    if (!cultureMeta || !holdingQ || showIncubatedRender) return;

    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 16.67;
      last = now;
      if (exposure > 0.01) {
        cultureMeta.totalOpenSeconds += dt / 60;
        const chancePerFrame = 0.0005 + exposure * 0.002;
        if (Math.random() < chancePerFrame * dt) {
          cultureMeta.contaminationEvents += 1;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  $effect(() => {
    if (!cultureMeta || cultureMeta.phase !== 'incubating') return;
    if (incubationHours < 18) return;
    cultureMeta.phase = 'grown';
    persistCultureMeta();
  });

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.key === 'q' || event.key === 'Q') && !holdingQ && wb.hoveredItemId === item.id) {
      holdingQ = true;
    }
    if ((event.key === 'e' || event.key === 'E') && holdingQ) {
      holdingE = true;
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'q' || event.key === 'Q') {
      holdingQ = false;
      holdingE = false;
      startDecay();
    }
    if (event.key === 'e' || event.key === 'E') {
      holdingE = false;
    }
  }

  function handleWindowPointerMove(event: PointerEvent) {
    if (!holdingQ || holdingE || !cellEl) return;
    const bounds = cellEl.getBoundingClientRect();
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    const reference = Math.max(bounds.width, bounds.height) * 0.75;
    lidTiltX = Math.max(-1, Math.min(1, (event.clientX - cx) / reference));
    lidTiltY = Math.max(-1, Math.min(1, (cy - event.clientY) / reference));
  }

  function handleTransferPointerDown(event: PointerEvent) {
    if (!canDeposit || !cultureMeta) return;
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    const point = toPlatePoint(event, event.currentTarget);
    if (!point) return;
    if (!syncLoopIntoPlate()) return;

    selectedPlateForInteraction();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawing = true;
    activePointerId = event.pointerId;
    lastPoint = point;
    appendAction({ type: 'beginStroke', timestamp: wb.currentTick });
  }

  function handleTransferPointerMove(event: PointerEvent) {
    if (!isDrawing || activePointerId !== event.pointerId || !lastPoint) return;
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    const point = toPlatePoint(event, event.currentTarget);
    if (!point) return;

    appendAction({
      type: 'strokeSegment',
      from: lastPoint,
      to: point,
      pressure: event.pressure > 0 ? event.pressure : 0.58,
      timestamp: wb.currentTick,
    });
    lastPoint = point;
  }

  function handleTransferPointerFinish(event: PointerEvent) {
    if (!isDrawing || activePointerId !== event.pointerId) return;
    finishTransferStroke();
  }

  function handleTransferPointerCancel() {
    if (!isDrawing) return;
    finishTransferStroke();
  }

  function handlePickupPointerDown(event: PointerEvent) {
    if (!canPick) return;
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    const point = toPlatePoint(event, event.currentTarget);
    if (!point) return;

    selectedPlateForInteraction();
    event.currentTarget.setPointerCapture(event.pointerId);
    isPicking = true;
    activePickupPointerId = event.pointerId;
    pickupPoints = [point];
  }

  function handlePickupPointerMove(event: PointerEvent) {
    if (!isPicking || activePickupPointerId !== event.pointerId) return;
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    const point = toPlatePoint(event, event.currentTarget);
    if (!point) return;
    pickupPoints = [...pickupPoints, point];
  }

  function handlePickupPointerFinish(event: PointerEvent) {
    if (!isPicking || activePickupPointerId !== event.pointerId) return;
    finishPickup();
  }

  function handlePickupPointerCancel() {
    if (!isPicking) return;
    finishPickup();
  }

  function finishTransferStroke() {
    appendAction({ type: 'endStroke', timestamp: wb.currentTick });
    syncHeldLoopFromTransfer();
    isDrawing = false;
    activePointerId = null;
    lastPoint = null;
  }

  function finishPickup() {
    if (wb.heldItemId && heldLoopState) {
      const pickupLoads = buildPickupLoadsFromBiomass(
        displaySpeciesConfig,
        biomass.biomass,
        biomass.resolution,
        pickupPoints,
      );
      const totalPickup = pickupLoads.reduce((sum, value) => sum + value, 0);

      if (totalPickup > 0.000001) {
        const dominantIndex = pickupLoads.reduce(
          (bestIndex, value, index, values) => value > values[bestIndex] ? index : bestIndex,
          0,
        );

        wb.mutateItem(wb.heldItemId, (loopItem) => {
          if (loopItem.state?.kind !== 'inoculation-loop') return;
          loopItem.state.volume = 0.35;
          loopItem.state.concentration = 100;
          loopItem.state.isSterile = false;
          loopItem.state.speciesLoads = pickupLoads;
          loopItem.state.speciesConfig = cloneSpeciesConfig(displaySpeciesConfig);
          loopItem.state.sourceLabel = displaySpeciesConfig[dominantIndex]?.name ?? 'Picked colonies';
        });
      }
    }

    isPicking = false;
    activePickupPointerId = null;
    pickupPoints = [];
  }

  function handleStartIncubation() {
    if (!cultureMeta || !incubationReady) return;
    startCultureIncubation(cultureMeta, wb.currentTick);
    persistCultureMeta();
  }

  function rebuildFromMeta(meta: CulturePlateMeta) {
    const species = meta.speciesConfig.length > 0 ? cloneSpeciesConfig(meta.speciesConfig) : fallbackSpeciesConfig;
    meta.speciesConfig = species;

    const session = createPlateSession(species, meta.plateSeed, meta.medium);
    session.actionLog = [...meta.actionLog];
    const snapshot = replayTransferSession(session, resolution, DEBUG_LOG_DEFAULT);
    const seeded = seedFounderGrid(snapshot.film, species, meta.plateSeed);

    transferSnapshot = snapshot;
    founderGrid = seeded.founders;
    transferVersion += 1;
  }

  function appendAction(action: Action) {
    if (!cultureMeta) return;

    cultureMeta.actionLog = [...cultureMeta.actionLog, action];
    applyTransferAction(transferSnapshot, action, cultureMeta.speciesConfig, DEBUG_LOG_DEFAULT);
    transferVersion += 1;

    if (action.type === 'strokeSegment') {
      founderGrid = seedDirtyFounderRegion(
        founderGrid,
        transferSnapshot.film,
        cultureMeta.speciesConfig,
        cultureMeta.plateSeed,
        transferSnapshot.dirtyRect,
      ).founders;
    } else if (action.type === 'endStroke' && cultureMeta.phase === 'ready') {
      cultureMeta.phase = 'streaked';
    }

    persistCultureMeta();
  }

  function syncLoopIntoPlate(): boolean {
    if (!cultureMeta || !heldLoopState) return false;

    if (loopHasInoculum) {
      if (cultureMeta.actionLog.length === 0) {
        cultureMeta.speciesConfig = cloneSpeciesConfig(heldLoopState.speciesConfig);
        rebuildFromMeta(cultureMeta);
      } else if (!sameSpeciesOrder(cultureMeta.speciesConfig, heldLoopState.speciesConfig)) {
        return false;
      }

      appendAction({ type: 'sterilize', timestamp: wb.currentTick });
      appendAction({ type: 'loadSample', speciesLoads: [...heldLoopState.speciesLoads], timestamp: wb.currentTick + 1 });
      return true;
    }

    if (!canSterileCrossStreak) return false;
    appendAction({ type: 'sterilize', timestamp: wb.currentTick });
    return true;
  }

  function syncHeldLoopFromTransfer() {
    if (!wb.heldItemId || !cultureMeta) return;
    const speciesTotals = cultureMeta.speciesConfig.map((_, speciesIndex) =>
      transferSnapshot.loop.sectors.reduce((sum, sector) => sum + sector.load[speciesIndex] + sector.captured[speciesIndex], 0),
    );
    const totalMass = speciesTotals.reduce((sum, value) => sum + value, 0);
    const normalizedLoads = totalMass > 0
      ? speciesTotals.map((value) => value / totalMass)
      : [];

    wb.mutateItem(wb.heldItemId, (loopItem) => {
      if (loopItem.state?.kind !== 'inoculation-loop') return;
      loopItem.state.volume = Math.min(1, totalMass / (SIM.baseSectorLoad * SIM.sectorCount));
      loopItem.state.concentration = totalMass > 0.000001 ? 100 : 0;
      loopItem.state.isSterile = transferSnapshot.loop.isSterile && totalMass <= 0.000001;
      loopItem.state.speciesLoads = normalizedLoads;
      loopItem.state.speciesConfig = cloneSpeciesConfig(cultureMeta.speciesConfig);
      loopItem.state.sourceLabel = normalizedLoads.length > 0
        ? getSpeciesSourceLabel(cultureMeta.speciesConfig, cultureMeta.medium)
        : null;
    });
  }

  function toPlatePoint(event: PointerEvent, canvas: HTMLCanvasElement): Vec2 | null {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    const dx = x - 0.5;
    const dy = y - 0.5;
    if (dx * dx + dy * dy > 0.25) return null;
    return { x, y };
  }

  function expandFilmState(source: FilmState, speciesCount: number): FilmState {
    if (source.filmMass.length === speciesCount) return source;
    const expanded = createFilmState(speciesCount, source.resolution);
    expanded.agarWetness.set(source.agarWetness);
    expanded.depositFluid.set(source.depositFluid);
    expanded.groove.set(source.groove);

    for (let speciesIndex = 0; speciesIndex < Math.min(source.filmMass.length, speciesCount); speciesIndex += 1) {
      expanded.filmMass[speciesIndex].set(source.filmMass[speciesIndex]);
    }

    return expanded;
  }

  function expandFounderGrid(source: FounderGrid, speciesCount: number): FounderGrid {
    if (source.counts.length === speciesCount) return source;
    const expanded = createFounderGrid(speciesCount, source.resolution);

    for (let speciesIndex = 0; speciesIndex < Math.min(source.counts.length, speciesCount); speciesIndex += 1) {
      expanded.counts[speciesIndex].set(source.counts[speciesIndex]);
      expanded.lag[speciesIndex].set(source.lag[speciesIndex]);
      expanded.growthRate[speciesIndex].set(source.growthRate[speciesIndex]);
    }

    return expanded;
  }

  function sameSpeciesOrder(left: readonly SpeciesDef[], right: readonly SpeciesDef[]): boolean {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index]?.id !== right[index]?.id) return false;
    }
    return true;
  }

  function selectedPlateForInteraction() {
    if (wb.hoveredItemId !== item.id) {
      wb.hoveredItemId = item.id;
    }
  }

  function persistCultureMeta() {
    if (!cultureMeta) return;
    wb.mutateItem(item.id, (nextItem) => {
      if (nextItem.contents) {
        nextItem.contents.meta = cultureMeta;
      }
    });
  }
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onpointermove={handleWindowPointerMove}
/>

<div class="plate-root" bind:this={cellEl} data-ref="game-culture-plate">
  <div class="plate-header">
    <span class="phase-chip" data-ref="game-culture-phase">{platePhase}</span>
    <span class="summary" data-ref="game-culture-summary">{plateSummary}</span>
  </div>

  <div class="plate-stage">
    {#if showIncubatedRender}
      <WebGLRenderPlate
        maps={renderMaps}
        medium={sessionMedium}
        preset="observation"
        lighting="grazing"
        ariaLabel="Incubated culture plate"
        canvasClass={`aspect-square w-full rounded-full border border-[var(--brass-dark)] bg-black/35 ${canPick ? 'touch-none cursor-crosshair' : ''}`}
        dataRef="game-culture-grown-canvas"
        onPointerDown={handlePickupPointerDown}
        onPointerMove={handlePickupPointerMove}
        onPointerUp={handlePickupPointerFinish}
        onPointerCancel={handlePickupPointerFinish}
        onLostPointerCapture={handlePickupPointerCancel}
      />
    {:else}
      <canvas
        bind:this={transferCanvas}
        class="transfer-canvas"
        data-ref="game-culture-transfer-canvas"
        width={SIM.displaySize}
        height={SIM.displaySize}
        onpointerdown={handleTransferPointerDown}
        onpointermove={handleTransferPointerMove}
        onpointerup={handleTransferPointerFinish}
        onpointercancel={handleTransferPointerFinish}
        onlostpointercapture={handleTransferPointerCancel}
      ></canvas>
    {/if}

    <div
      class="lid-overlay"
      style:transform={`perspective(420px) rotateX(${lidTiltY * 25}deg) rotateY(${lidTiltX * 25}deg)`}
      style:opacity={1 - exposure * 0.7}
    >
      <div class="lid-hint">{lidHint}</div>
    </div>
  </div>

  <div class="plate-metrics">
    <span data-ref="game-culture-dirty-area">Dirty area {transferDirtyArea}</span>
    <span data-ref="game-culture-contamination">Contam. {(contaminationLevel * 100).toFixed(0)}%</span>
    <span data-ref="game-culture-incubation">{incubationHours.toFixed(1)}h</span>
  </div>

  {#if holdingQ && heldLoopState}
    <div class="pressure-wrap">
      <div class="pressure-track">
        <div class="pressure-fill" style:width={`${wb.pressureLevel * 100}%`}></div>
      </div>
      <span class="pressure-label">
        {wb.pressureLevel > 0.5 ? 'Heavy' : wb.pressureLevel > 0.1 ? 'Light' : 'No'} pressure
      </span>
    </div>
  {/if}

  <div class="plate-actions">
    {#if incubationReady}
      <button class="btn btn-sm btn-primary" data-ref="game-culture-start-incubation" onclick={handleStartIncubation}>
        Incubate 24h
      </button>
    {/if}
    {#if showIncubatedRender}
      <span class="plate-note" data-ref="game-culture-grown-note">
        {#if pickablePlate}
          Use an empty loop to pick colonies.
        {:else}
          Incubating...
        {/if}
      </span>
    {:else}
      <span class="plate-note">
        Transfer view stays live while you streak.
      </span>
    {/if}
  </div>
</div>

<style>
  .plate-root {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    height: 100%;
    padding: 0.5rem 0.35rem 1.2rem;
    color: var(--parchment);
  }

  .plate-header {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
  }

  .phase-chip {
    border: var(--border-thin);
    border-radius: 999px;
    background: var(--bg-medium);
    padding: 0.1rem 0.45rem;
    font-size: 0.58rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--brass);
  }

  .summary {
    min-width: 0;
    text-align: right;
    font-size: 0.58rem;
    line-height: 1.3;
    color: var(--parchment-aged);
  }

  .plate-stage {
    position: relative;
    display: flex;
    width: 100%;
    flex: 1;
    min-height: 0;
    align-items: center;
    justify-content: center;
  }

  .transfer-canvas {
    width: min(100%, 280px);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid var(--brass-dark);
    background: rgba(0, 0, 0, 0.35);
    touch-action: none;
    cursor: crosshair;
  }

  .lid-overlay {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lid-hint {
    width: min(100%, 250px);
    border-radius: 999px;
    background: rgba(226, 223, 215, 0.22);
    border: 1px solid rgba(226, 223, 215, 0.28);
    padding: 0.35rem 0.75rem;
    font-size: 0.62rem;
    line-height: 1.35;
    text-align: center;
    color: rgba(245, 240, 230, 0.92);
    backdrop-filter: blur(2px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .plate-metrics {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem;
    font-size: 0.56rem;
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--parchment-aged);
  }

  .plate-metrics span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pressure-wrap {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .pressure-track {
    width: 88%;
    height: 0.26rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(201, 162, 39, 0.2);
  }

  .pressure-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--brass-dark), var(--brass));
  }

  .pressure-label {
    font-size: 0.58rem;
    color: var(--parchment-aged);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .plate-actions {
    display: flex;
    width: 100%;
    min-height: 1.5rem;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    text-align: center;
  }

  .plate-note {
    font-size: 0.58rem;
    color: var(--parchment-aged);
  }
</style>
