<!--
  CulturePlateItem.svelte — Culture plate on the workbench grid.

  Phases:
    streaking  — interactive plate: tilt lid (Q), lock lid (E), streak with loop
    colonies   — shows ColonyPlateView after "Done Streaking" is clicked

  Controls (streaking phase):
    Q hold      = enter lid-tilt mode; mouse position controls tilt angle
    Q + E hold  = lock lid at current tilt (E acts as a clamp)
    Q release   = lid decays back to closed
    Shift hold  = ramp pressure (via workbench context)
    Pointer on dish = streak while loop is held + lid open + inoculum present

  Physics reuse: streak-physics.ts (density grid, applyStreakSegment)
  Render reuse : plate-renderer.ts (redrawPlate, drawStreakSegment)
  Colony reuse : colony-generator.ts + ColonyView.svelte
-->
<script lang="ts">
  import type { Item, CultureFindings, MediaType } from '../../../lib/types';
  import { getCulturePlate } from '../../../lib/types';
  import { MEDIA_COLORS, SIM, GRID_SIZE, PLATE_RADIUS } from './simulation-types';
  import type { Colony } from './simulation-types';
  import { getWorkbench } from '../../workbench/workbench-context.svelte';
  import { createPlateState, applyStreakSegment } from './streak-physics';
  import { redrawPlate, drawStreakSegment } from './plate-renderer';
  import { generateColoniesFromGrid, computeGridQuality } from './colony-generator';
  import type { StreakQuality } from './colony-generator';
  import ColonyView from './ColonyView.svelte';

  interface Props { item: Item; }
  let { item }: Props = $props();

  const wb = getWorkbench();
  const plate = $derived(getCulturePlate(item));
  const mediaType = $derived<MediaType>(plate?.mediaType ?? 'nutrient-agar');
  const mediaColor = $derived(MEDIA_COLORS[mediaType].base);

  // --- Canvas constants ---
  const PLATE_SIZE = 400;
  const PLATE_CENTER = PLATE_SIZE / 2;

    let cellEl = $state<HTMLDivElement>();
  let plateCanvas = $state<HTMLCanvasElement>();
  let debugCanvas = $state<HTMLCanvasElement>();
  let showDebug = $state(false);

  function renderDebugOverlay() {
    if (!debugCanvas) return;
    const ctx = debugCanvas.getContext('2d');
    if (!ctx) return;
    const scale = PLATE_SIZE / GRID_SIZE; // 4px per grid cell
    const imageData = ctx.createImageData(PLATE_SIZE, PLATE_SIZE);
    const d = imageData.data;
    const cells = plateState.grid.cells;
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const density = cells[gy * GRID_SIZE + gx];
        if (density < SIM.DENSITY_NONE) continue;
        const t = Math.min(1, density / SIM.DENSITY_MAX);
        // blue → cyan → green → yellow → red
        let r = 0, g = 0, b = 0;
        if (t < 0.25)      { r = 0;   g = Math.round(t / 0.25 * 255); b = 255; }
        else if (t < 0.5)  { r = 0;   g = 255; b = Math.round((1 - (t - 0.25) / 0.25) * 255); }
        else if (t < 0.75) { r = Math.round((t - 0.5) / 0.25 * 255); g = 255; b = 0; }
        else               { r = 255; g = Math.round((1 - (t - 0.75) / 0.25) * 255); b = 0; }
        const baseX = Math.floor(gx * scale);
        const baseY = Math.floor(gy * scale);
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const idx = ((baseY + py) * PLATE_SIZE + (baseX + px)) * 4;
            d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 200;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // --- Plate physics state (local to this component) ---
  let plateState = $state(createPlateState());

  // --- Phase ---
  type PlatePhase = 'streaking' | 'colonies';
  let phase = $state<PlatePhase>('streaking');
  let colonies = $state<Colony[]>([]);
  let snappedFindings = $state<CultureFindings | null>(null);
  let quality = $state<StreakQuality | null>(null);

  // --- Lid tilt ---
  let lidTiltX = $state(0);
  let lidTiltY = $state(0);
  let holdingQ = $state(false);
  let holdingE = $state(false);

  const exposure = $derived(Math.min(1, Math.sqrt(lidTiltX ** 2 + lidTiltY ** 2)));

  // --- Held loop ---
  const heldLoopState = $derived.by(() => {
    const h = wb.heldItem;
    if (!h?.state || h.state.kind !== 'inoculation-loop') return null;
    return h.state;
  });

  const canStreak = $derived(
    holdingQ &&
    exposure >= SIM.LID_MIN_STREAK &&
    heldLoopState !== null &&
    heldLoopState.temperature <= SIM.KILL_THRESHOLD &&
    wb.pressureLevel >= SIM.MIN_STREAK_PRESSURE   // loop must press down to contact agar
  );

  // --- Streak tracking (plain vars — no reactivity needed) ---
  let isOverDish = false;
  let lastNormX = 0;
  let lastNormY = 0;
  let lastMoveTime = 0;

  // --- Init canvas on mount ---
  $effect(() => {
    if (!plateCanvas) return;
    const ctx = plateCanvas.getContext('2d');
    if (ctx) redrawPlate(ctx, PLATE_SIZE, PLATE_RADIUS, mediaType, plateState.grid);
  });

  // --- Canvas coordinate helpers ---
  function getCanvasPos(e: PointerEvent): { x: number; y: number } | null {
    if (!plateCanvas) return null;
    const r = plateCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (PLATE_SIZE / r.width),
      y: (e.clientY - r.top) * (PLATE_SIZE / r.height),
    };
  }

  function canvasToNorm(cx: number, cy: number) {
    return {
      x: (cx - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
      y: (cy - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
    };
  }

  function isInsidePlate(cx: number, cy: number): boolean {
    const dx = cx - PLATE_CENTER;
    const dy = cy - PLATE_CENTER;
    return dx * dx + dy * dy <= PLATE_RADIUS * PLATE_RADIUS;
  }

  // --- Streak pointer events (proximity-based — no click required) ---
  function handleDishPointerEnter(e: PointerEvent) {
    // Initialize tracking position so the first move has a valid "from" point
    const pos = getCanvasPos(e);
    if (!pos) return;
    const norm = canvasToNorm(pos.x, pos.y);
    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = performance.now();
    isOverDish = true;
  }

  function handleDishPointerMove(e: PointerEvent) {
    if (!isOverDish || !wb.heldItemId || !heldLoopState) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    const norm = canvasToNorm(pos.x, pos.y);
    const now = performance.now();

    const dx = norm.x - lastNormX;
    const dy = norm.y - lastNormY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dtMs = Math.max(1, now - lastMoveTime);
    const speedNorm = (dist / dtMs) * 1000;

    // Streak fires automatically whenever conditions are met — no click required
    if (canStreak && dist > 0 && isInsidePlate(pos.x, pos.y)) {
      const result = applyStreakSegment(
        plateState,
        { x: lastNormX, y: lastNormY },
        { x: norm.x, y: norm.y },
        heldLoopState.volume,
        heldLoopState.concentration,
        heldLoopState.temperature,
        wb.pressureLevel,
        speedNorm,
      );

      wb.mutateItem(wb.heldItemId, (loop) => {
        if (loop.state?.kind === 'inoculation-loop') {
          loop.state.volume = result.volume;
          loop.state.concentration = result.concentration;
          loop.state.temperature = result.temperature;
        }
      });

      const ctx = plateCanvas?.getContext('2d');
      if (ctx) {
        drawStreakSegment(
          ctx, PLATE_SIZE, PLATE_RADIUS,
          { x: lastNormX, y: lastNormY }, { x: norm.x, y: norm.y },
          result.volume * result.concentration, wb.pressureLevel, heldLoopState.temperature, mediaType,
        );
      }

      if (showDebug) renderDebugOverlay();
    }

    // Always update tracking so re-entry has a correct start position
    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = now;
  }

  function handleDishPointerLeave() {
    isOverDish = false;
  }

  // --- Global pointer move for lid tilting ---
  function handleWindowPointerMove(e: PointerEvent) {
    // Only update tilt when Q held AND E not held (E clamps the lid position).
    // Use the tile center as origin and a larger reference radius so dragging
    // outside the tile gives fine-grained control anywhere on screen.
    if (holdingQ && !holdingE && cellEl) {
      const r = cellEl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const ref = Math.max(r.width, r.height) * 0.75;
      lidTiltX = Math.max(-1, Math.min(1, (e.clientX - cx) / ref));
      lidTiltY = Math.max(-1, Math.min(1, (cy - e.clientY) / ref));
    }
  }

  // --- Key handlers ---
  function handleKeyDown(e: KeyboardEvent) {
    // Q requires hovering the plate to enter lid-tilt mode
    if ((e.key === 'q' || e.key === 'Q') && !holdingQ && wb.hoveredItemId === item.id) {
      holdingQ = true;
    }
    // E freezes the lid regardless of mouse position — once Q is held the player
    // may have dragged the mouse far from the tile
    if ((e.key === 'e' || e.key === 'E') && holdingQ) {
      holdingE = true;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'q' || e.key === 'Q') {
      holdingQ = false;
      holdingE = false; // releasing Q also drops the E clamp
      startDecay();
    }
    if (e.key === 'e' || e.key === 'E') {
      holdingE = false;
    }
  }

  // --- Lid decay RAF (imperative — not reactive) ---
  let decayRafId: number | null = null;

  function startDecay() {
    if (decayRafId !== null) return;
    if (lidTiltX === 0 && lidTiltY === 0) return;
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 16.67;
      last = now;
      const decay = Math.pow(SIM.LID_TILT_DECAY, dt);
      lidTiltX *= decay;
      lidTiltY *= decay;
      if (Math.abs(lidTiltX) < 0.005) lidTiltX = 0;
      if (Math.abs(lidTiltY) < 0.005) lidTiltY = 0;
      if (lidTiltX !== 0 || lidTiltY !== 0) {
        decayRafId = requestAnimationFrame(tick);
      } else {
        decayRafId = null;
      }
    }

    decayRafId = requestAnimationFrame(tick);
  }

  $effect(() => () => {
    if (decayRafId !== null) cancelAnimationFrame(decayRafId);
  });

  // --- Contamination accumulation while lid is held open ---
  // Runs as a RAF while Q is held so exposure time and random events accumulate.
  $effect(() => {
    if (!holdingQ) return;
    let rafId: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 16.67;
      last = now;
      const exp = exposure; // read current derived value each frame
      if (exp > 0.01) {
        plateState.totalOpenSeconds += dt / 60;
        const chancePerFrame = SIM.CONTAM_BASE + exp * SIM.CONTAM_RATE;
        if (Math.random() < chancePerFrame * dt) plateState.contaminationEvents++;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  // --- Lid hint text ---
  const lidHint = $derived.by(() => {
    if (!holdingQ) return 'Hold Q + move mouse to tilt lid';
    if (holdingE)  return `Lid locked at ${Math.round(exposure * 100)}% · Release E to adjust`;
    // Ready to streak but no pressure yet
    if (heldLoopState && heldLoopState.temperature <= SIM.KILL_THRESHOLD && exposure >= SIM.LID_MIN_STREAK && wb.pressureLevel < SIM.MIN_STREAK_PRESSURE) {
      return 'Hold Shift to press loop into agar';
    }
    return `Lid ${Math.round(exposure * 100)}% open · Hold E to lock`;
  });

  // --- Done → generate colonies immediately ---
  const TEST_FINDINGS: CultureFindings = {
    growth: true,
    gramType: 'positive',
    colonyColor: 'cream',
    hemolysis: 'beta',
  };

  function handleDone() {
    const findings = TEST_FINDINGS;
    snappedFindings = findings;
    colonies = generateColoniesFromGrid({
      grid: plateState.grid,
      findings,
      mediaType,
      contaminationEvents: plateState.contaminationEvents,
      lidExposure: plateState.totalOpenSeconds,
    });
    quality = computeGridQuality(plateState.grid, colonies);
    phase = 'colonies';
  }

  function handleBack() {
    snappedFindings = null;
    quality = null;
    plateState = createPlateState();
    const ctx = plateCanvas?.getContext('2d');
    if (ctx) redrawPlate(ctx, PLATE_SIZE, PLATE_RADIUS, mediaType, plateState.grid);
    colonies = [];
    phase = 'streaking';
  }
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
  onpointermove={handleWindowPointerMove}
/>

<div class="relative flex flex-col items-center justify-center w-full h-full gap-1 pb-6" bind:this={cellEl}>
  {#if phase === 'streaking'}
    <div class="relative flex items-center justify-center w-full flex-1 min-h-0">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="dish"
                onpointerenter={handleDishPointerEnter}
        onpointermove={handleDishPointerMove}
        onpointerleave={handleDishPointerLeave}
        style:touch-action="none"
      >
        {#if plate && plate.phase !== 'empty'}
          <div class="media" style:background={mediaColor}></div>
        {/if}
        <canvas
          bind:this={plateCanvas}
          width={PLATE_SIZE}
          height={PLATE_SIZE}
          class="streak-canvas"
        ></canvas>
        {#if showDebug}
          <canvas
            bind:this={debugCanvas}
            width={PLATE_SIZE}
            height={PLATE_SIZE}
            class="streak-canvas debug-overlay"
          ></canvas>
        {/if}
      </div>

      <!-- 3D tilting lid overlay -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style:z-index="2">
        <div
          class="lid-disc"
          style:transform="perspective(400px) rotateX({lidTiltY * 25}deg) rotateY({lidTiltX * 25}deg)"
          style:opacity={1 - exposure * 0.7}
        >
          <span class="text-xs text-center select-none lid-hint">{lidHint}</span>
        </div>
      </div>
    </div>

    <!-- Pressure indicator — shown when Q held with loop -->
    {#if holdingQ && heldLoopState}
      <div class="flex flex-col items-center gap-0.5 pointer-events-none">
        <div class="pressure-track">
          <div class="pressure-fill" style:width="{wb.pressureLevel * 100}%"></div>
        </div>
        <span class="text-parchment-aged whitespace-nowrap pressure-label">
          {wb.pressureLevel > 0.5 ? 'Heavy' : wb.pressureLevel > 0.1 ? 'Light' : 'No'} pressure
          {#if heldLoopState.temperature > SIM.KILL_THRESHOLD}
            · Too hot — wait to cool
          {:else if exposure < SIM.LID_MIN_STREAK}
            · Open lid more
          {:else if heldLoopState.volume === 0}
            · Cross a streak to pick up
          {/if}
        </span>
      </div>
    {/if}

    {#if plateState.hasAnyDeposit}
      <button class="btn-sm btn-primary" onclick={handleDone}>
        Done Streaking →
      </button>
    {/if}
    <button
      class="btn-sm debug-toggle"
      class:active={showDebug}
      onclick={() => { showDebug = !showDebug; if (showDebug) renderDebugOverlay(); }}
    >density</button>
{#if showDebug}
      <div class="debug-stats">
        Grid: {plateState.totalGridBacteria.toFixed(1)}
        | Loop: {(heldLoopState ? heldLoopState.volume * heldLoopState.concentration : 0).toFixed(1)}
        | Init: {plateState.initialBacteriaLoaded.toFixed(1)}
        | Contam: {plateState.contaminationEvents}
      </div>
    {/if}

  {:else}
    <!-- Colony view -->
    <div class="flex flex-col items-center justify-center gap-1 w-full h-full overflow-hidden">
      <ColonyView {colonies} {mediaType} grid={plateState.grid} findings={snappedFindings ?? undefined} />
      {#if quality}
        <div class="quality-badge grade-{quality.overallGrade}">
          {quality.overallGrade} · {quality.isolatedColonyCount} isolated
        </div>
      {/if}
      <button class="btn-sm" onclick={handleBack}>← New Plate</button>
    </div>
  {/if}
</div>

<style>
  .quality-badge {
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.3);
    color: #ccc;
  }
  .quality-badge.grade-excellent { color: #6cbf6c; }
  .quality-badge.grade-good      { color: #a8d060; }
  .quality-badge.grade-fair      { color: #d4b84a; }
  .quality-badge.grade-poor      { color: #d07050; }
  .quality-badge.grade-none      { color: #888; }

  .dish {
    width: min(90%, 280px);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2px solid rgba(180, 160, 120, 0.5);
    background: #e8e0d0;
    position: relative;
    overflow: hidden;
    box-shadow:
      var(--shadow-md),
      0 0 12px rgba(0,0,0,0.3),
      0 0 1px rgba(180, 140, 60, 0.15),
      inset 0 2px 4px rgba(0, 0, 0, 0.15),
      inset 0 -1px 2px rgba(255, 255, 255, 0.1);
  }

  .media {
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    opacity: 0.85;
  }

  /* Canvas fills the dish responsively; internal resolution stays 400×400 */
  .streak-canvas {
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    width: calc(100% - 6px);
    height: calc(100% - 6px);
    pointer-events: none;
  }

  .debug-overlay {
    opacity: 0.65;
    mix-blend-mode: screen;
  }

  .debug-toggle {
    font-size: 0.6rem;
    opacity: 0.4;
    padding: 1px 6px;
    letter-spacing: 0.08em;
  }

  .debug-toggle.active {
    opacity: 1;
    color: #6cba6c;
  }

  .debug-stats {
    font-size: 0.55rem;
    font-family: monospace;
    color: #6cba6c;
    opacity: 0.8;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .lid-disc {
    width: min(90%, 280px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%,
      rgba(180, 170, 155, 0.88),
      rgba(140, 130, 115, 0.78)
    );
    border: 2px solid rgba(180, 150, 80, 0.35);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.08s, opacity 0.08s;
  }

  .lid-hint {
    color: rgba(255,255,255,0.65);
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    padding: var(--space-sm);
  }

  .pressure-track {
    width: 80px;
    height: 4px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 2px;
    overflow: hidden;
  }

  .pressure-fill {
    height: 100%;
    background: linear-gradient(90deg, #6cba6c, #e0a840, #d06c6c);
    border-radius: 2px;
    transition: width 0.05s;
  }

  .pressure-label {
    font-size: 0.65rem;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }
</style>
