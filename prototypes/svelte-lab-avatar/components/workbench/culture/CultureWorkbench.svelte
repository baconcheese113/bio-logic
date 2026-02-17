<!--
  CultureWorkbench.svelte — Culture streaking workbench.

  Uses WorkbenchSurface for generic surface rendering (wood-grain, zones, cursor tracking).
  Delegates physics to behavior modules: bunsen-burner, inoculation-loop, culture-plate.
  Delegates canvas rendering to plate-renderer.

  Controls:
  - Hold Q  = lid mode (mouse tilts lid)
  - Hold E  = explicit loop mode
  - Q+E     = loop priority
  - Shift   = pressure ramp
  - Left-click plate = streak
  - Click sample vial = pick up inoculum
  - Hover flame = sterilize (~1s)
-->
<script lang="ts">
  import type { MediaType, DensityGrid } from './streak-types';
  import { SIM } from './streak-types';
  import type { Sample, CulturePlateState } from '../../../../shared/types';
  import { SAMPLE_COLORS } from '../../../../shared/types';

  import WorkbenchSurface from '../WorkbenchSurface.svelte';
  import type { ZoneDef } from '../items/workbench-types';
  import { createBurnerState, enterFlame, leaveFlame, tickFlame, flameProgress } from '../items/bunsen-burner';
  import { createLoopState, sterilizeLoop, pickupInoculum, loopStatus, canPickup, resetLoop } from '../items/inoculation-loop';
  import {
    createPlateState, lidExposure as getLidExposure, canStreak as getCanStreak,
    setLidTilt, tickLid, applyStreakSegment, resetPlate,
  } from '../items/culture-plate';
  import { redrawPlate, drawStreakSegment } from '../renderers/plate-renderer';

  interface Props {
    loadedSample: Sample | null;
    loadedPlate: CulturePlateState | null;
    mediaType: MediaType;
    onStreakComplete: (grid: DensityGrid, contaminationEvents: number) => void;
  }

  let { loadedSample, loadedPlate, mediaType, onStreakComplete }: Props = $props();

  const hasPlate = $derived(loadedPlate !== null);

  // --- Zone layout ---
  const zones: ZoneDef[] = [
    { id: 'flame',  label: 'Burner', bounds: { x: 0.02, y: 0.10, w: 0.18, h: 0.80 } },
    { id: 'sample', label: 'Sample', bounds: { x: 0.22, y: 0.30, w: 0.18, h: 0.40 } },
    { id: 'plate',  label: 'Plate',  bounds: { x: 0.44, y: 0.02, w: 0.54, h: 0.96 } },
  ];

  // --- Behavior states ---
  let burner = $state(createBurnerState());
  let loop = $state(createLoopState());
  let plate = $state(createPlateState());

  // --- Input tracking ---
  let loopX = $state(0.5);
  let loopY = $state(0.5);
  let holdingLid = $state(false);
  let holdingLoop = $state(false);
  let shiftHeld = $state(false);
  let pressureLevel = $state(0);
  let isStreaking = $state(false);

  // --- Canvas ---
  let plateCanvas = $state<HTMLCanvasElement>();
  const PLATE_SIZE = 400;
  const PLATE_RADIUS = 185;
  const PLATE_CENTER = PLATE_SIZE / 2;

  // --- Streak interpolation ---
  let lastNormX = 0;
  let lastNormY = 0;
  let lastMoveTime = 0;

  // --- Derived ---
  const status = $derived(loopStatus(loop));
  const exposure = $derived(getLidExposure(plate));
  const streakAllowed = $derived(getCanStreak(plate, hasPlate, loop.inoculumLevel));
  const canInoculate = $derived(loadedSample !== null && canPickup(loop));

  const hintText = $derived.by(() => {
    if (!hasPlate && !loadedSample) return 'Drop a plate and sample onto the workbench to begin.';
    if (!hasPlate) return 'Drop a culture plate onto the workbench.';
    if (!loadedSample) return 'Drop a sample onto the workbench.';
    if (!loop.isSterile) return 'Move the loop over the flame to sterilize (hold ~1s).';
    if (status === 'cooling') return 'Loop is hot — wait for it to cool.';
    if (canInoculate) return 'Click the sample vial to pick up inoculum.';
    if (status === 'loaded' && exposure < SIM.LID_TILT_THRESHOLD)
      return 'Hold Q and move mouse to tilt lid open, then streak.';
    if (status === 'loaded') return 'Left-click on plate to streak. Hold Shift for pressure ramp. E = explicit loop control.';
    return '';
  });

  // --- Surface callbacks ---

  function handleCursorMove(nx: number, ny: number, zone: string | null) {
    const lidMode = holdingLid && !holdingLoop;
    if (lidMode) {
      setLidTilt(plate, nx, ny);
    } else {
      loopX = nx;
      loopY = ny;
      if (zone === 'flame' && !burner.isOver) burner = enterFlame(burner);
      else if (zone !== 'flame' && burner.isOver) burner = leaveFlame(burner);
    }
  }

  function handleClick(zone: string | null) {
    if (zone === 'sample' && canInoculate) {
      const result = pickupInoculum(loop);
      if (result) loop = result;
    }
  }

  function handlePointerLeave() {
    if (burner.isOver) burner = leaveFlame(burner);
  }

  function handleTick(dt: number) {
    // Pressure ramp
    if (shiftHeld) {
      pressureLevel = Math.min(1, pressureLevel + SIM.PRESSURE_RAMP_UP * dt);
    } else if (pressureLevel > 0) {
      pressureLevel = Math.max(0, pressureLevel - SIM.PRESSURE_RAMP_DOWN * dt);
    }

    // Flame hold timer
    const flameResult = tickFlame(burner, dt * 16.67);
    burner = flameResult.state;
    if (flameResult.sterilized) loop = sterilizeLoop(loop);

    // Lid physics
    tickLid(plate, dt, holdingLid);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Shift') shiftHeld = true;
    if (e.key === 'q' || e.key === 'Q') holdingLid = true;
    if (e.key === 'e' || e.key === 'E') holdingLoop = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Shift') shiftHeld = false;
    if (e.key === 'q' || e.key === 'Q') holdingLid = false;
    if (e.key === 'e' || e.key === 'E') holdingLoop = false;
  }

  // --- Canvas helpers ---

  function canvasToNorm(cx: number, cy: number) {
    return {
      x: (cx - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
      y: (cy - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
    };
  }

  function getCanvasPos(e: PointerEvent) {
    if (!plateCanvas) return null;
    const rect = plateCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (PLATE_SIZE / rect.width),
      y: (e.clientY - rect.top) * (PLATE_SIZE / rect.height),
    };
  }

  function isInsidePlate(cx: number, cy: number) {
    const dx = cx - PLATE_CENTER;
    const dy = cy - PLATE_CENTER;
    return dx * dx + dy * dy <= PLATE_RADIUS * PLATE_RADIUS;
  }

  // --- Plate streak events ---

  function handlePlatePointerDown(e: PointerEvent) {
    if (e.button !== 0 || !streakAllowed) return;
    if (holdingLid && !holdingLoop) return;
    const pos = getCanvasPos(e);
    if (!pos || !isInsidePlate(pos.x, pos.y)) return;
    isStreaking = true;
    const norm = canvasToNorm(pos.x, pos.y);
    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = performance.now();
    plateCanvas!.setPointerCapture(e.pointerId);
  }

  function handlePlatePointerMove(e: PointerEvent) {
    if (!isStreaking) return;
    const pos = getCanvasPos(e);
    if (!pos || !isInsidePlate(pos.x, pos.y)) return;
    const norm = canvasToNorm(pos.x, pos.y);
    const now = performance.now();

    const dx = norm.x - lastNormX;
    const dy = norm.y - lastNormY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = Math.max(1, now - lastMoveTime);
    const speedNorm = (dist / dt) * 1000;

    // Apply streak physics via behavior module
    const result = applyStreakSegment(
      plate,
      { x: lastNormX, y: lastNormY },
      { x: norm.x, y: norm.y },
      loop.inoculumLevel, loop.temperature, pressureLevel, speedNorm,
    );
    loop.inoculumLevel = result.inoculumLevel;
    loop.temperature = result.temperature;

    // Draw visual streak via renderer
    const ctx = plateCanvas?.getContext('2d');
    if (ctx) {
      drawStreakSegment(
        ctx, PLATE_SIZE, PLATE_RADIUS,
        { x: lastNormX, y: lastNormY }, { x: norm.x, y: norm.y },
        loop.inoculumLevel, pressureLevel, loop.temperature, mediaType,
      );
    }

    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = now;
  }

  function handlePlatePointerUp() {
    isStreaking = false;
  }

  // --- Initial plate draw ---
  $effect(() => {
    if (plateCanvas) {
      const ctx = plateCanvas.getContext('2d');
      if (ctx) redrawPlate(ctx, PLATE_SIZE, PLATE_RADIUS, mediaType, plate.grid);
    }
  });

  // --- Actions ---
  function handleDone() {
    onStreakComplete(plate.grid, plate.contaminationEvents);
  }

  function handleReset() {
    resetPlate(plate);
    loop = resetLoop();
    pressureLevel = 0;
    const ctx = plateCanvas?.getContext('2d');
    if (ctx) redrawPlate(ctx, PLATE_SIZE, PLATE_RADIUS, mediaType, plate.grid);
  }
</script>

<WorkbenchSurface
  {zones}
  hint={hintText}
  onCursorMove={handleCursorMove}
  onClick={handleClick}
  onPointerLeave={handlePointerLeave}
  onTick={handleTick}
  onKeyDown={handleKeyDown}
  onKeyUp={handleKeyUp}
>
  {#snippet zoneContent(zoneId)}
    {#if zoneId === 'flame'}
      <div class="bunsen-burner">
        <svg viewBox="0 0 60 120" class="burner-svg">
          <rect x="10" y="90" width="40" height="25" rx="3" fill="#6b5233" stroke="#8b6914" stroke-width="1" />
          <rect x="24" y="30" width="12" height="62" fill="#5a4428" stroke="#7a5c2e" stroke-width="1" />
          {#if burner.isOver}
            <ellipse cx="30" cy="22" rx="10" ry="18" fill="rgba(60,120,255,0.6)" class="flame-inner" />
            <ellipse cx="30" cy="18" rx="6" ry="12" fill="rgba(100,180,255,0.8)" class="flame-core" />
          {:else}
            <ellipse cx="30" cy="26" rx="5" ry="8" fill="rgba(60,120,255,0.3)" />
          {/if}
        </svg>
        {#if burner.isOver}
          <div class="flame-progress">
            <div class="flame-fill" style:width="{flameProgress(burner) * 100}%"></div>
          </div>
        {/if}
      </div>

    {:else if zoneId === 'sample'}
      {#if loadedSample}
        <div class="sample-vial" style:cursor={canInoculate ? 'pointer' : 'inherit'}>
          <div class="vial-body">
            <div class="vial-contents" style:background={SAMPLE_COLORS[loadedSample.type]}></div>
          </div>
          <span class="sample-type-label">{loadedSample.type}</span>
        </div>
      {:else}
        <span class="empty-icon">⊘</span>
      {/if}

    {:else if zoneId === 'plate'}
      {#if hasPlate}
        <div class="plate-wrapper">
          <canvas
            bind:this={plateCanvas}
            width={PLATE_SIZE}
            height={PLATE_SIZE}
            class="plate-canvas"
            class:lid-blocking={exposure < SIM.LID_TILT_THRESHOLD}
            style="touch-action: none"
            onpointerdown={handlePlatePointerDown}
            onpointermove={handlePlatePointerMove}
            onpointerup={handlePlatePointerUp}
            onpointerleave={handlePlatePointerUp}
          ></canvas>

          <!-- 3D tilting lid -->
          <div class="lid-wrapper">
            <div
              class="lid-disc"
              style:transform="perspective(400px) rotateX({plate.lidTiltY * 25}deg) rotateY({plate.lidTiltX * 25}deg)"
              style:opacity={1 - exposure * 0.7}
            >
              {#if exposure < SIM.LID_TILT_THRESHOLD}
                <span class="lid-hint">Hold Q + move mouse to tilt lid</span>
              {:else}
                <span class="lid-hint">Lid {Math.round(exposure * 100)}% open</span>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="plate-empty">
          <span class="empty-icon">🧫</span>
          <span class="empty-label">No plate</span>
        </div>
      {/if}
    {/if}
  {/snippet}

  {#snippet cursor()}
    <div
      class="loop-cursor"
      class:loop-flaming={burner.isOver}
      class:loop-hot={status === 'cooling'}
      class:loop-loaded={status === 'loaded'}
      class:loop-lid-mode={holdingLid && !holdingLoop}
      style:left="{loopX * 100}%"
      style:top="{loopY * 100}%"
    >
      {#if holdingLid}
        <svg viewBox="0 0 24 28" width="20" height="24">
          <rect x="8" y="0" width="8" height="20" rx="4" fill="rgba(200,180,140,0.6)" stroke="#aaa" stroke-width="1" />
          <rect x="4" y="14" width="16" height="10" rx="3" fill="rgba(200,180,140,0.4)" stroke="#999" stroke-width="0.5" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 40" width="24" height="40">
          <rect x="10" y="18" width="4" height="20" rx="1" fill="#999" />
          <circle cx="12" cy="10" r="7" fill="none" stroke="#bbb" stroke-width="1.5" />
          {#if status === 'loaded'}
            <circle cx="12" cy="10" r="4" fill="rgba(200,180,140,0.7)" />
          {/if}
        </svg>
      {/if}
    </div>
  {/snippet}

  {#snippet statusBar()}
    <div class="flex items-center gap-sm p-xs flex-wrap workbench-status">
      <div class="flex items-center gap-1 text-xs capitalize text-parchment-aged">
        <span class="status-dot status-{status}"></span>
        <span>{status}</span>
      </div>

      {#if loop.temperature > 0.05}
        <div class="flex items-center gap-0.75">
          <span class="text-xs text-parchment-aged uppercase">Temp</span>
          <div class="mini-bar"><div class="bar-fill temp-fill" style:width="{loop.temperature * 100}%"></div></div>
        </div>
      {/if}

      {#if status === 'loaded'}
        <div class="flex items-center gap-0.75">
          <span class="text-xs text-parchment-aged uppercase">Load</span>
          <div class="mini-bar"><div class="bar-fill load-fill" style:width="{loop.inoculumLevel * 100}%"></div></div>
        </div>
      {/if}

      {#if exposure > 0}
        <div class="flex items-center gap-0.75">
          <span class="text-xs text-parchment-aged uppercase">Lid</span>
          <div class="mini-bar"><div class="bar-fill lid-fill" style:width="{exposure * 100}%"></div></div>
        </div>
      {/if}

      {#if pressureLevel > 0.05}
        <span class="badge pressure-badge">PRESSURE {Math.round(pressureLevel * 100)}%</span>
      {/if}
      {#if holdingLid && !holdingLoop}
        <span class="badge lid-badge">LID (Q)</span>
      {/if}
      {#if holdingLoop}
        <span class="badge loop-badge">LOOP (E)</span>
      {/if}
      {#if plate.contaminationEvents > 0}
        <span class="badge contam-badge">{plate.contaminationEvents} contam.</span>
      {/if}

      <div class="ml-auto flex gap-xs">
        <button class="btn-sm" onclick={handleReset} disabled={isStreaking}>New Plate</button>
        <button class="btn-sm btn-primary" onclick={handleDone} disabled={!hasPlate || !plate.hasAnyDeposit || isStreaking}>
          Done Streaking
        </button>
      </div>
    </div>
  {/snippet}
</WorkbenchSurface>

<style>
  /* --- Flame --- */
  .bunsen-burner { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .burner-svg { width: 45px; height: 90px; }
  .flame-inner { animation: flicker 0.15s ease-in-out infinite alternate; }
  .flame-core { animation: flicker 0.1s ease-in-out infinite alternate-reverse; }
  @keyframes flicker { from { opacity: 0.7; transform: scaleX(0.95); } to { opacity: 1; transform: scaleX(1.05); } }
  .flame-progress { width: 36px; height: 3px; background: var(--bg-dark); border-radius: 2px; overflow: hidden; }
  .flame-fill { height: 100%; background: linear-gradient(90deg, #4488ff, #88bbff); transition: width 0.05s; }

  /* --- Sample vial --- */
  .sample-vial { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .vial-body {
    width: 26px; height: 55px;
    background: rgba(200,200,210,0.15);
    border: 1px solid rgba(200,200,210,0.3);
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    position: relative;
  }
  .vial-contents {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 70%; border-radius: 0 0 9px 9px; opacity: 0.8;
  }
  .sample-type-label { font-size: 0.8rem; color: var(--parchment-aged); text-transform: capitalize; }
  .empty-icon { font-size: 1.8rem; color: var(--parchment-aged); opacity: 0.15; }

  /* --- Plate --- */
  .plate-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    opacity: 0.25;
  }
  .plate-empty .empty-icon { font-size: 3rem; }
  .empty-label {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .plate-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .plate-canvas {
    width: min(95%, 340px);
    height: auto;
    aspect-ratio: 1;
    border-radius: 50%;
    cursor: crosshair;
    box-shadow: var(--shadow-md), 0 0 12px rgba(0,0,0,0.3), 0 0 1px rgba(180, 140, 60, 0.15);
  }
  .plate-canvas.lid-blocking { cursor: not-allowed; filter: brightness(0.6); }
  .lid-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 2;
  }
  .lid-disc {
    width: min(95%, 340px);
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
    font-size: 0.8rem;
    color: rgba(255,255,255,0.65);
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    text-align: center;
    padding: var(--space-sm);
  }

  /* --- Loop cursor --- */
  .loop-cursor {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, -80%);
    transition: filter 0.15s;
    z-index: 10;
  }
  .loop-flaming { filter: drop-shadow(0 0 8px #4488ff) drop-shadow(0 0 16px #2266dd); }
  .loop-hot { filter: drop-shadow(0 0 6px #ff6600); }
  .loop-loaded svg circle:last-child { filter: drop-shadow(0 0 3px rgba(200,180,140,0.6)); }
  .loop-lid-mode { filter: drop-shadow(0 0 4px rgba(200,180,140,0.5)); }

  /* --- Status bar --- */
  .workbench-status {
    background: linear-gradient(180deg, #2a2218 0%, #1e1a12 100%);
    border: 1px solid rgba(180, 140, 60, 0.2);
    border-top: 1px solid rgba(180, 140, 60, 0.3);
    border-radius: 0 0 6px 6px;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .status-dot.status-sterile { background: #6cba6c; }
  .status-dot.status-cooling { background: #e0a840; }
  .status-dot.status-loaded { background: #6ca8d0; }
  .status-dot.status-dirty { background: #d06c6c; }

  .mini-bar { width: 42px; height: 4px; background: var(--bg-medium); border-radius: 2px; overflow: hidden; }
  .bar-fill { height: 100%; transition: width 0.1s; }
  .temp-fill { background: linear-gradient(90deg, #ff6600, #ff3300); }
  .load-fill { background: linear-gradient(90deg, var(--brass-dark), var(--brass-light)); }
  .lid-fill { background: linear-gradient(90deg, #5588aa, #88ccee); }

  .badge {
    font-size: 0.8rem;
    padding: 1px 6px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pressure-badge { background: #4a3a1a; color: #e0a840; }
  .lid-badge { background: #2a3a4a; color: #88bbdd; }
  .loop-badge { background: #2a4a2a; color: #88dd88; }
  .contam-badge { background: #4a2a2a; color: #d06c6c; }
</style>
