<!--
  CultureWorkbench.svelte — Unified single-screen culture workbench.
  
  The entire prep → streaking flow happens on one screen.
  Left side: flame + sample vial. Right side: petri plate with canvas.
  
  Controls:
  - Hold Q  = "left hand" lid mode — mouse X/Y controls 2D lid tilt
  - Hold E  = explicit loop mode — mouse controls loop position
  - Q+E     = loop priority (loop follows cursor, lid stays)
  - Default = loop mode (same as E held)
  - Release Q = lid drifts back to center (LID_TILT_DECAY per frame)
  - Hold Shift = pressure ramps 0→1 (PRESSURE_RAMP_UP per frame)
  - Release Shift = pressure ramps down (PRESSURE_RAMP_DOWN per frame)
  - Left-click on plate = streak (deposits bacteria from loop)
  - Click sample vial = pick up inoculum (if loop is sterile + cool)
  - Hover loop over flame = sterilize (800ms hold)
-->
<script lang="ts">
  import type { MediaType, DensityGrid } from './streak-types';
  import { MEDIA_COLORS, GRID_SIZE, SIM, createDensityGrid, plateToGrid } from './streak-types';
  import type { Sample, CulturePlateState } from '../../../../shared/types';
  import { SAMPLE_COLORS } from '../../../../shared/types';

  interface Props {
    loadedSample: Sample | null;
    loadedPlate: CulturePlateState | null;
    mediaType: MediaType;
    onStreakComplete: (grid: DensityGrid, contaminationEvents: number) => void;
  }

  let { loadedSample, loadedPlate, mediaType, onStreakComplete }: Props = $props();

  const hasPlate = $derived(loadedPlate !== null);

  // --- Canvas ---
  let plateCanvas: HTMLCanvasElement;
  const PLATE_SIZE = 400;
  const PLATE_RADIUS = 185;
  const PLATE_CENTER = PLATE_SIZE / 2;

  // --- Loop state (internal) ---
  let inoculumLevel = $state(0);
  let loopTemp = $state(0);
  let isFlamed = $state(false);

  // --- Lid state (2D tilt) ---
  let lidTiltX = $state(0); // -1 to 1, horizontal tilt
  let lidTiltY = $state(0); // -1 to 1, vertical tilt (positive = tilted away)
  let totalOpenSeconds = $state(0);
  let holdingLid = $state(false); // Q key held

  // --- Input tracking ---
  let workbenchEl: HTMLDivElement;
  let mouseX = $state(0.5); // normalized 0-1 within workbench
  let mouseY = $state(0.5);
  let loopX = $state(0.5);  // loop cursor position (separate from mouse in lid mode)
  let loopY = $state(0.5);
  let shiftHeld = $state(false);
  let holdingLoop = $state(false); // E key held
  let pressureLevel = $state(0);   // 0-1 smooth ramp
  let isStreaking = $state(false);

  // --- Flame zone ---
  let isOverFlame = $state(false);
  let flameHoldMs = $state(0);
  let flameTimer: ReturnType<typeof setInterval> | null = null;

  // --- Density grid (streaking physics) ---
  let grid = $state(createDensityGrid());
  let contaminationEvents = $state(0);
  let hasAnyDeposit = $state(false);

  // --- Streak interpolation ---
  let lastNormX = 0;
  let lastNormY = 0;
  let lastMoveTime = 0;

  // --- Zone geometry (fractions of workbench) ---
  const ZONES = {
    flame:  { x: 0.02, y: 0.10, w: 0.18, h: 0.80 },
    sample: { x: 0.22, y: 0.30, w: 0.18, h: 0.40 },
    plate:  { x: 0.44, y: 0.02, w: 0.54, h: 0.96 },
  } as const;

  type ActiveZone = 'flame' | 'sample' | 'plate' | 'none';
  let activeZone = $state<ActiveZone>('none');

  function getZone(nx: number, ny: number): ActiveZone {
    for (const [name, z] of Object.entries(ZONES) as [ActiveZone, typeof ZONES.flame][]) {
      if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) return name;
    }
    return 'none';
  }

  // --- Derived state ---
  const isCooling = $derived(loopTemp > SIM.KILL_THRESHOLD);
  const isLoaded = $derived(inoculumLevel > 0);
  const canInoculate = $derived(loadedSample !== null && isFlamed && inoculumLevel === 0 && !isCooling);
  const lidExposure = $derived(Math.min(1, Math.sqrt(lidTiltX * lidTiltX + lidTiltY * lidTiltY)));
  const canStreak = $derived(hasPlate && lidExposure >= SIM.LID_TILT_THRESHOLD && isLoaded);

  const loopStatus = $derived.by(() => {
    if (isLoaded) return 'loaded';
    if (isCooling) return 'cooling';
    if (isFlamed) return 'sterile';
    return 'dirty';
  });

  const hintText = $derived.by(() => {
    if (!hasPlate && !loadedSample) return 'Drop a plate and sample onto the workbench to begin.';
    if (!hasPlate) return 'Drop a culture plate onto the workbench.';
    if (!loadedSample) return 'Drop a sample onto the workbench.';
    if (!isFlamed) return 'Move the loop over the flame to sterilize (hold ~1s).';
    if (isCooling) return 'Loop is hot — wait for it to cool.';
    if (canInoculate) return 'Click the sample vial to pick up inoculum.';
    if (isLoaded && lidExposure < SIM.LID_TILT_THRESHOLD)
      return 'Hold Q and move mouse to tilt lid open, then streak.';
    if (isLoaded) return 'Left-click on plate to streak. Hold Shift for pressure ramp. E = explicit loop control.';
    return '';
  });

  // ========== Canvas helpers ==========

  function canvasToNorm(cx: number, cy: number): { x: number; y: number } {
    return {
      x: (cx - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
      y: (cy - (PLATE_CENTER - PLATE_RADIUS)) / (PLATE_RADIUS * 2),
    };
  }

  function getCanvasPos(e: PointerEvent | MouseEvent): { x: number; y: number } | null {
    if (!plateCanvas) return null;
    const rect = plateCanvas.getBoundingClientRect();
    const scaleX = PLATE_SIZE / rect.width;
    const scaleY = PLATE_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function isInsidePlate(cx: number, cy: number): boolean {
    const dx = cx - PLATE_CENTER;
    const dy = cy - PLATE_CENTER;
    return dx * dx + dy * dy <= PLATE_RADIUS * PLATE_RADIUS;
  }

  function lightenColor(hex: string, pct: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + pct);
    const g = Math.min(255, ((num >> 8) & 0xff) + pct);
    const b = Math.min(255, (num & 0xff) + pct);
    return `rgb(${r},${g},${b})`;
  }

  // ========== Plate canvas rendering ==========

  function redrawPlate() {
    const ctx = plateCanvas?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, PLATE_SIZE, PLATE_SIZE);

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    ctx.restore();

    // Agar base
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    const colors = MEDIA_COLORS[mediaType];
    const grad = ctx.createRadialGradient(
      PLATE_CENTER - 30, PLATE_CENTER - 30, 10,
      PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS,
    );
    grad.addColorStop(0, lightenColor(colors.base, 15));
    grad.addColorStop(1, colors.base);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);
    ctx.restore();

    // Density overlay
    renderDensityOverlay(ctx);

    // Rim
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,180,150,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function renderDensityOverlay(ctx: CanvasRenderingContext2D) {
    const colors = MEDIA_COLORS[mediaType];
    const cellSize = (PLATE_RADIUS * 2) / GRID_SIZE;
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const idx = gy * GRID_SIZE + gx;
        const d = grid.cells[idx];
        const dmg = grid.damage[idx];
        const kill = grid.killZone[idx];
        if (d < 0.001 && dmg < 0.1 && kill < 0.1) continue;
        const cx = (PLATE_CENTER - PLATE_RADIUS) + gx * cellSize;
        const cy = (PLATE_CENTER - PLATE_RADIUS) + gy * cellSize;
        if (d > 0.001) {
          ctx.fillStyle = colors.streak;
          ctx.globalAlpha = Math.min(0.8, d * 2);
          ctx.fillRect(cx, cy, cellSize + 0.5, cellSize + 0.5);
        }
        if (dmg > SIM.DAMAGE_THRESHOLD * 0.5) {
          ctx.fillStyle = 'rgba(30,20,10,0.4)';
          ctx.globalAlpha = Math.min(0.6, dmg / SIM.DAMAGE_THRESHOLD);
          ctx.fillRect(cx, cy, cellSize + 0.5, cellSize + 0.5);
        }
        if (kill > SIM.KILL_THRESHOLD) {
          ctx.fillStyle = 'rgba(255,120,0,0.15)';
          ctx.globalAlpha = kill * 0.3;
          ctx.fillRect(cx, cy, cellSize + 0.5, cellSize + 0.5);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawStreakSegment(fx: number, fy: number, tx: number, ty: number, inoculum: number, pressure: number) {
    const ctx = plateCanvas?.getContext('2d');
    if (!ctx) return;
    const colors = MEDIA_COLORS[mediaType];
    const cfx = fx * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);
    const cfy = fy * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);
    const ct_x = tx * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);
    const ct_y = ty * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);

    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(cfx, cfy);
    ctx.lineTo(ct_x, ct_y);
    ctx.strokeStyle = colors.streak;
    ctx.globalAlpha = 0.2 + Math.min(0.8, inoculum * 0.8);
    ctx.lineWidth = 3.5 + pressure * 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (loopTemp > SIM.KILL_THRESHOLD) {
      ctx.beginPath();
      ctx.moveTo(cfx, cfy);
      ctx.lineTo(ct_x, ct_y);
      ctx.strokeStyle = `rgba(255,100,0,${loopTemp * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (pressure > 0.5) {
      ctx.beginPath();
      ctx.moveTo(cfx, cfy);
      ctx.lineTo(ct_x, ct_y);
      ctx.strokeStyle = `rgba(0,0,0,${pressure * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ========== Event handlers ==========

  function handlePointerMove(e: PointerEvent) {
    if (!workbenchEl) return;
    const rect = workbenchEl.getBoundingClientRect();
    mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    mouseY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Dual-hand control: Q = lid tilt, E = loop, Q+E = loop priority
    const lidMode = holdingLid && !holdingLoop;

    if (lidMode) {
      // Lid mode: mouse controls 2D tilt direction and magnitude
      lidTiltX = (mouseX - 0.5) * 2;
      lidTiltY = (0.5 - mouseY) * 2;
    } else {
      // Loop mode (default, E held, or Q+E): cursor controls loop position
      loopX = mouseX;
      loopY = mouseY;

      const zone = getZone(loopX, loopY);
      activeZone = zone;

      // Flame hover detection
      if (zone === 'flame' && !isOverFlame) {
        isOverFlame = true;
        startFlaming();
      } else if (zone !== 'flame' && isOverFlame) {
        isOverFlame = false;
        stopFlaming();
      }

      // Streak while left-button-down on plate
      if (isStreaking && zone === 'plate') {
        applyStreakMove(e);
      }
    }
  }

  // --- Flame ---
  function startFlaming() {
    flameHoldMs = 0;
    flameTimer = setInterval(() => {
      flameHoldMs += 50;
      if (flameHoldMs >= 800) {
        stopFlaming();
        // Sterilize loop
        inoculumLevel = 0;
        loopTemp = 1.0;
        isFlamed = true;
      }
    }, 50);
  }

  function stopFlaming() {
    flameHoldMs = 0;
    if (flameTimer) { clearInterval(flameTimer); flameTimer = null; }
  }

  // --- Click ---
  function handleClick(e: MouseEvent) {
    // Sample zone: pick up inoculum
    if (activeZone === 'sample' && canInoculate) {
      inoculumLevel = 1.0;
      isFlamed = false;
      return;
    }
  }

  // --- Streak on plate (pointer down/up) ---
  function handlePlatePointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    if (!canStreak) return;
    if (holdingLid && !holdingLoop) return; // in lid mode, don't streak
    const pos = getCanvasPos(e);
    if (!pos || !isInsidePlate(pos.x, pos.y)) return;
    isStreaking = true;
    const norm = canvasToNorm(pos.x, pos.y);
    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = performance.now();
    plateCanvas.setPointerCapture(e.pointerId);
  }

  function handlePlatePointerMove(e: PointerEvent) {
    if (!isStreaking) return;
    applyStreakMove(e);
  }

  function applyStreakMove(e: PointerEvent | MouseEvent) {
    const pos = getCanvasPos(e as PointerEvent);
    if (!pos || !isInsidePlate(pos.x, pos.y)) return;
    const norm = canvasToNorm(pos.x, pos.y);
    const now = performance.now();

    const dx = norm.x - lastNormX;
    const dy = norm.y - lastNormY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = Math.max(1, now - lastMoveTime);
    const speedNorm = (dist / dt) * 1000;
    const speedFactor = Math.max(SIM.SPEED_MIN_FACTOR,
      Math.min(SIM.SPEED_MAX_FACTOR, SIM.SPEED_REFERENCE / Math.max(0.1, speedNorm * 100)));
    const pressureFactor = SIM.PRESSURE_LIGHT + pressureLevel * (SIM.PRESSURE_HEAVY - SIM.PRESSURE_LIGHT);

    const steps = Math.max(1, Math.ceil(dist * GRID_SIZE));
    for (let s = 0; s <= steps; s++) {
      const t = steps > 0 ? s / steps : 0;
      const px = lastNormX + dx * t;
      const py = lastNormY + dy * t;
      const cell = plateToGrid(px, py);
      if (!cell) continue;
      const idx = cell.gy * GRID_SIZE + cell.gx;

      if (loopTemp > 0) loopTemp = Math.max(0, loopTemp - SIM.TEMP_DECAY_PER_FRAME / Math.max(1, steps));
      if (loopTemp > SIM.KILL_THRESHOLD) grid.killZone[idx] = Math.max(grid.killZone[idx], loopTemp);

      if (inoculumLevel > 0 && loopTemp <= SIM.KILL_THRESHOLD) {
        const deposit = inoculumLevel * SIM.DEPOSIT_BASE_RATE * pressureFactor * speedFactor;
        grid.cells[idx] += deposit;
        inoculumLevel = Math.max(0, inoculumLevel - deposit * SIM.DEPLETION_RATE);
      }

      if (grid.cells[idx] > SIM.DENSITY_ISOLATED && loopTemp <= SIM.KILL_THRESHOLD) {
        const pickup = grid.cells[idx] * SIM.PICKUP_RATE;
        inoculumLevel = Math.min(1, inoculumLevel + pickup);
        grid.cells[idx] -= pickup;
      }

      if (pressureLevel > 0.3) grid.damage[idx] += pressureLevel * SIM.PRESSURE_HEAVY * 0.01;
    }

    drawStreakSegment(lastNormX, lastNormY, norm.x, norm.y, inoculumLevel, pressureLevel);
    lastNormX = norm.x;
    lastNormY = norm.y;
    lastMoveTime = now;
    hasAnyDeposit = true;
  }

  function handlePlatePointerUp() {
    isStreaking = false;
  }

  function handlePointerLeave() {
    if (isOverFlame) { isOverFlame = false; stopFlaming(); }
    activeZone = 'none';
  }

  // --- Keyboard ---
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

  // --- Main update loop: lid drift, pressure ramp, contamination ---
  $effect(() => {
    let rafId: number;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min(3, (now - lastTime) / 16.67); // normalize to ~60fps, cap
      lastTime = now;

      // Pressure ramp
      if (shiftHeld) {
        pressureLevel = Math.min(1, pressureLevel + SIM.PRESSURE_RAMP_UP * dt);
      } else if (pressureLevel > 0) {
        pressureLevel = Math.max(0, pressureLevel - SIM.PRESSURE_RAMP_DOWN * dt);
      }

      // Lid drift: when Q not held, tilt decays toward center
      if (!holdingLid && (lidTiltX !== 0 || lidTiltY !== 0)) {
        const decay = Math.pow(SIM.LID_TILT_DECAY, dt);
        lidTiltX *= decay;
        lidTiltY *= decay;
        if (Math.abs(lidTiltX) < 0.005) lidTiltX = 0;
        if (Math.abs(lidTiltY) < 0.005) lidTiltY = 0;
      }

      // Contamination accumulation
      const exposure = Math.min(1, Math.sqrt(lidTiltX * lidTiltX + lidTiltY * lidTiltY));
      if (exposure > 0.01) {
        totalOpenSeconds += dt / 60;
        const chancePerFrame = SIM.CONTAM_BASE + exposure * SIM.CONTAM_RATE;
        if (Math.random() < chancePerFrame * dt) contaminationEvents++;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  // --- Initial plate draw ---
  $effect(() => {
    if (plateCanvas) { mediaType; redrawPlate(); }
  });

  // --- Actions ---
  function handleDone() {
    onStreakComplete(grid, contaminationEvents);
  }

  function handleReset() {
    grid = createDensityGrid();
    contaminationEvents = 0;
    hasAnyDeposit = false;
    inoculumLevel = 0;
    loopTemp = 0;
    isFlamed = false;
    lidTiltX = 0;
    lidTiltY = 0;
    pressureLevel = 0;
    totalOpenSeconds = 0;
    redrawPlate();
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="workbench-layout">
  <div
    class="workbench"
    bind:this={workbenchEl}
    onpointermove={handlePointerMove}
    onclick={handleClick}
    onpointerleave={handlePointerLeave}
    role="application"
    aria-label="Culture workbench"
    style="touch-action: none"
  >
    <div class="bench-surface">

      <!-- Flame zone -->
      <div
        class="zone flame-zone"
        class:zone-active={activeZone === 'flame'}
        style:left="{ZONES.flame.x * 100}%"
        style:top="{ZONES.flame.y * 100}%"
        style:width="{ZONES.flame.w * 100}%"
        style:height="{ZONES.flame.h * 100}%"
      >
        <div class="bunsen-burner">
          <svg viewBox="0 0 60 120" class="burner-svg">
            <rect x="10" y="90" width="40" height="25" rx="3" fill="#6b5233" stroke="#8b6914" stroke-width="1" />
            <rect x="24" y="30" width="12" height="62" fill="#5a4428" stroke="#7a5c2e" stroke-width="1" />
            {#if isOverFlame}
              <ellipse cx="30" cy="22" rx="10" ry="18" fill="rgba(60,120,255,0.6)" class="flame-inner" />
              <ellipse cx="30" cy="18" rx="6" ry="12" fill="rgba(100,180,255,0.8)" class="flame-core" />
            {:else}
              <ellipse cx="30" cy="26" rx="5" ry="8" fill="rgba(60,120,255,0.3)" />
            {/if}
          </svg>
          {#if isOverFlame}
            <div class="flame-progress">
              <div class="flame-fill" style:width="{Math.min(100, (flameHoldMs / 800) * 100)}%"></div>
            </div>
          {/if}
        </div>
        <span class="zone-label">Burner</span>
      </div>

      <!-- Sample zone -->
      <div
        class="zone sample-zone"
        class:zone-active={activeZone === 'sample'}
        class:zone-clickable={canInoculate}
        style:left="{ZONES.sample.x * 100}%"
        style:top="{ZONES.sample.y * 100}%"
        style:width="{ZONES.sample.w * 100}%"
        style:height="{ZONES.sample.h * 100}%"
      >
        {#if loadedSample}
          <div class="sample-vial">
            <div class="vial-body">
              <div class="vial-contents" style:background={SAMPLE_COLORS[loadedSample.type]}></div>
            </div>
            <span class="sample-type-label">{loadedSample.type}</span>
          </div>
        {:else}
          <span class="empty-icon">⊘</span>
        {/if}
        <span class="zone-label">Sample</span>
      </div>

      <!-- Plate zone -->
      <div
        class="zone plate-zone"
        class:zone-active={activeZone === 'plate'}
        style:left="{ZONES.plate.x * 100}%"
        style:top="{ZONES.plate.y * 100}%"
        style:width="{ZONES.plate.w * 100}%"
        style:height="{ZONES.plate.h * 100}%"
      >
        {#if hasPlate}
          <div class="plate-wrapper">
            <canvas
              bind:this={plateCanvas}
              width={PLATE_SIZE}
              height={PLATE_SIZE}
              class="plate-canvas"
              class:lid-blocking={lidExposure < SIM.LID_TILT_THRESHOLD}
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
                style:transform="perspective(400px) rotateX({lidTiltY * 25}deg) rotateY({lidTiltX * 25}deg)"
                style:opacity={1 - lidExposure * 0.7}
              >
                {#if lidExposure < SIM.LID_TILT_THRESHOLD}
                  <span class="lid-hint">Hold Q + move mouse to tilt lid</span>
                {:else}
                  <span class="lid-hint">Lid {Math.round(lidExposure * 100)}% open</span>
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
        <span class="zone-label">Plate</span>
      </div>

      <!-- Loop cursor -->
      <div
        class="loop-cursor"
        class:loop-flaming={isOverFlame}
        class:loop-hot={isCooling}
        class:loop-loaded={isLoaded}
        class:loop-lid-mode={holdingLid && !holdingLoop}
        style:left="{loopX * 100}%"
        style:top="{loopY * 100}%"
      >
        {#if holdingLid}
          <!-- Show hand icon when holding lid -->
          <svg viewBox="0 0 24 28" width="20" height="24">
            <rect x="8" y="0" width="8" height="20" rx="4" fill="rgba(200,180,140,0.6)" stroke="#aaa" stroke-width="1" />
            <rect x="4" y="14" width="16" height="10" rx="3" fill="rgba(200,180,140,0.4)" stroke="#999" stroke-width="0.5" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 40" width="24" height="40">
            <rect x="10" y="18" width="4" height="20" rx="1" fill="#999" />
            <circle cx="12" cy="10" r="7" fill="none" stroke="#bbb" stroke-width="1.5" />
            {#if isLoaded}
              <circle cx="12" cy="10" r="4" fill="rgba(200,180,140,0.7)" />
            {/if}
          </svg>
        {/if}
      </div>
    </div>

    <!-- Status bar -->
    <div class="workbench-status">
      <div class="status-item">
        <span class="status-dot status-{loopStatus}"></span>
        <span>{loopStatus}</span>
      </div>

      {#if loopTemp > 0.05}
        <div class="bar-group">
          <span class="bar-label">Temp</span>
          <div class="mini-bar"><div class="bar-fill temp-fill" style:width="{loopTemp * 100}%"></div></div>
        </div>
      {/if}

      {#if isLoaded}
        <div class="bar-group">
          <span class="bar-label">Load</span>
          <div class="mini-bar"><div class="bar-fill load-fill" style:width="{inoculumLevel * 100}%"></div></div>
        </div>
      {/if}

      {#if lidExposure > 0}
        <div class="bar-group">
          <span class="bar-label">Lid</span>
          <div class="mini-bar"><div class="bar-fill lid-fill" style:width="{lidExposure * 100}%"></div></div>
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
      {#if contaminationEvents > 0}
        <span class="badge contam-badge">{contaminationEvents} contam.</span>
      {/if}

      <div class="status-actions">
        <button class="btn-sm" onclick={handleReset} disabled={isStreaking}>New Plate</button>
        <button class="btn-sm btn-primary" onclick={handleDone} disabled={!hasPlate || !hasAnyDeposit || isStreaking}>
          Done Streaking
        </button>
      </div>
    </div>
  </div>

  <p class="hint-text">{hintText}</p>
</div>

<style>
  .workbench-layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .workbench {
    position: relative;
    width: 100%;
    aspect-ratio: 5 / 3;
    max-width: 800px;
    cursor: none;
  }

  .bench-surface {
    position: relative;
    width: 100%;
    height: 100%;
    background:
      repeating-linear-gradient(
        90deg,
        transparent 0px, rgba(0,0,0,0.03) 2px,
        transparent 4px, rgba(0,0,0,0.02) 8px,
        transparent 12px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0px, rgba(80,50,20,0.08) 40px,
        transparent 80px
      ),
      linear-gradient(180deg, #3d2e1e 0%, #2e2015 40%, #241a10 100%);
    border: 3px solid rgba(140, 110, 50, 0.5);
    border-bottom-width: 4px;
    border-radius: 6px;
    box-shadow:
      var(--shadow-lg),
      inset 0 2px 8px rgba(0,0,0,0.5),
      inset 0 -2px 4px rgba(80,50,20,0.15);
    overflow: hidden;
  }

  /* --- Zones --- */
  .zone {
    position: absolute;
    border: none;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15);
    background: rgba(0,0,0,0.08);
    transition: background 0.2s, box-shadow 0.2s;
  }
  .zone-active {
    background: rgba(180, 140, 60, 0.06);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(0,0,0,0.15), 0 0 6px rgba(180, 140, 60, 0.08);
  }
  .zone-clickable { cursor: pointer !important; }
  .zone-label {
    font-size: 0.8rem;
    color: #c4a35a;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    background: linear-gradient(180deg, #3d3020, #2a2018);
    border: 1px solid rgba(180, 140, 60, 0.25);
    border-radius: 2px;
    padding: 1px 8px;
    position: absolute;
    bottom: 4px;
  }

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
  .plate-zone { overflow: hidden; }
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
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    background: linear-gradient(180deg, #2a2218 0%, #1e1a12 100%);
    border: 1px solid rgba(180, 140, 60, 0.2);
    border-top: 1px solid rgba(180, 140, 60, 0.3);
    border-radius: 0 0 6px 6px;
    flex-wrap: wrap;
  }
  .status-item {
    display: flex; align-items: center; gap: 4px;
    font-size: 0.8rem; text-transform: capitalize; color: var(--parchment-aged);
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .status-dot.status-sterile { background: #6cba6c; }
  .status-dot.status-cooling { background: #e0a840; }
  .status-dot.status-loaded { background: #6ca8d0; }
  .status-dot.status-dirty { background: #d06c6c; }

  .bar-group { display: flex; align-items: center; gap: 3px; }
  .bar-label { font-size: 0.8rem; color: var(--parchment-aged); text-transform: uppercase; }
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

  .status-actions {
    margin-left: auto;
    display: flex;
    gap: var(--space-xs);
  }
  .btn-sm {
    padding: 2px 10px;
    font-size: 0.8rem;
    border: var(--border-thin);
    border-radius: 4px;
    background: var(--bg-medium);
    color: var(--parchment-aged);
    cursor: pointer;
  }
  .btn-sm:hover:not(:disabled) { border-color: var(--brass); }
  .btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-sm.btn-primary {
    background: var(--brass-dark);
    color: var(--parchment);
    border-color: var(--brass);
  }
  .btn-sm.btn-primary:hover:not(:disabled) { background: var(--brass); }

  .hint-text {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }
</style>
