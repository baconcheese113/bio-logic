<script lang="ts">
  import type { Colony, MediaType } from './simulation-types';
  import { MEDIA_COLORS, PLATE_RADIUS, GRID_SIZE, SIM } from './simulation-types';
  import { lightenColor } from './plate-renderer';

  interface Props {
    colonies: Colony[];
    mediaType: MediaType;
    /** Raw density grid cells for wet streak film (t=0 physical marks, fades over 16h). */
    streakGrid?: Float32Array;
    /** Current incubation hours — drives streak film fade and stipple sigmoid. */
    incubationHours?: number;
    pickingEnabled?: boolean;
    onColonyPicked?: (colony: Colony) => void;
  }

  let { colonies, mediaType, streakGrid, incubationHours = 0, pickingEnabled = false, onColonyPicked }: Props = $props();

  let canvas: HTMLCanvasElement;
  let selectedColonyIndex = $state<number | null>(null);
  let hoveredColonyIndex = $state<number | null>(null);

  const PLATE_SIZE = 400;
  const PLATE_CENTER = PLATE_SIZE / 2;

  const selectedColony = $derived(
    selectedColonyIndex !== null ? colonies[selectedColonyIndex] ?? null : null
  );

  function colonyToCanvas(colony: Colony): { cx: number; cy: number; r: number } {
    return {
      cx: colony.x * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS),
      cy: colony.y * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS),
      r: Math.max(2, colony.radius * PLATE_RADIUS * 2),
    };
  }

  function findColonyAt(canvasX: number, canvasY: number): number | null {
    // Search in reverse so topmost colonies are found first
    for (let i = colonies.length - 1; i >= 0; i--) {
      const { cx, cy, r } = colonyToCanvas(colonies[i]);
      const hitRadius = Math.max(r + 4, 8); // minimum hit area
      const dx = canvasX - cx;
      const dy = canvasY - cy;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return i;
      }
    }
    return null;
  }

  function getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = PLATE_SIZE / rect.width;
    const scaleY = PLATE_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleClick(e: MouseEvent) {
    if (!pickingEnabled) return;
    const pos = getCanvasPos(e);
    const idx = findColonyAt(pos.x, pos.y);
    if (idx !== null) {
      selectedColonyIndex = idx;
      onColonyPicked?.(colonies[idx]);
    } else {
      selectedColonyIndex = null;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!pickingEnabled) return;
    const pos = getCanvasPos(e);
    hoveredColonyIndex = findColonyAt(pos.x, pos.y);
  }

  function handleMouseLeave() {
    hoveredColonyIndex = null;
  }

  const COVER_SIZE = 256;
  // Rasterize dense colony coverage into a 256×256 float grid.
  // B(x,y) = max growthFactor of any dense seed whose coverageRadius disc contains (x,y).
  // MAX aggregation (not additive) decouples B from seed count — prevents saturating
  // to 1.0 before bacteria have actually grown, giving a time-correct 0→1 transition.
  function computeCoverageField(cols: Colony[]): Float32Array {
    const B = new Float32Array(COVER_SIZE * COVER_SIZE);
    for (const c of cols) {
      if (c.densityLevel !== 'dense') continue;
      const cx = c.x * COVER_SIZE;
      const cy = c.y * COVER_SIZE;
      const r = c.coverageRadius * COVER_SIZE; // uncapped spread radius
      if (r < 0.5) continue; // truly sub-pixel — bacteria not yet spread
      const rSq = r * r;
      const gf = c.growthFactor;
      const x0 = Math.max(0, Math.floor(cx - r));
      const x1 = Math.min(COVER_SIZE - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r));
      const y1 = Math.min(COVER_SIZE - 1, Math.ceil(cy + r));
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const dx = px + 0.5 - cx;
          const dy = py + 0.5 - cy;
          if (dx * dx + dy * dy <= rSq) {
            // MAX: B tracks how "grown" the fastest seed covering this pixel is.
            // Lawn appears when the fastest nearby colony has grown substantially.
            if (gf > B[py * COVER_SIZE + px]) B[py * COVER_SIZE + px] = gf;
          }
        }
      }
    }
    return B;
  }

  function renderColonies() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PLATE_SIZE, PLATE_SIZE);

    // --- Plate shadow ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    ctx.restore();

    // --- Plate background (agar) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    const colors = MEDIA_COLORS[mediaType];
    const grad = ctx.createRadialGradient(
      PLATE_CENTER - 30, PLATE_CENTER - 30, 10,
      PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS
    );
    grad.addColorStop(0, lightenColor(colors.base, 20));
    grad.addColorStop(0.7, colors.base);
    grad.addColorStop(1, lightenColor(colors.base, -10));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);

    // --- Wet streak film (physical agar disruption, visible at t=0, fades by 16h) ---
    // Represents the moist track left by the loop on agar before colonies form.
    // Color is muted warm-tan (agar disruption) — not the colony color.
    const filmFade = Math.max(0, 1 - incubationHours / 16);
    if (streakGrid && filmFade > 0.01) {
      const cellW = (PLATE_RADIUS * 2) / GRID_SIZE;
      const plateLeft = PLATE_CENTER - PLATE_RADIUS;
      const plateTop  = PLATE_CENTER - PLATE_RADIUS;
      ctx.fillStyle = 'rgb(160, 130, 100)';
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const d = streakGrid[gy * GRID_SIZE + gx];
          if (d < SIM.DENSITY_NONE) continue;
          const filmAlpha = Math.min(0.40, d / 0.15) * filmFade;
          if (filmAlpha < 0.01) continue;
          ctx.globalAlpha = filmAlpha;
          ctx.fillRect(plateLeft + gx * cellW, plateTop + gy * cellW, cellW + 0.5, cellW + 0.5);
        }
      }
      ctx.globalAlpha = 1;
    }

    // --- Hemolysis zones (clearing effect for beta, greenish for alpha) ---
    for (const colony of colonies) {
      if (colony.densityLevel === 'confluent') continue;
      if (colony.hemolysisType === 'gamma' || colony.hemolysisRadius <= 0) continue;
      const { cx, cy, r } = colonyToCanvas(colony);
      const hr = colony.hemolysisRadius * PLATE_RADIUS * 2;

      if (colony.hemolysisType === 'beta') {
        // Beta: radial gradient clearing — blood lysed, revealing lighter agar
        const hemoGrad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, hr);
        hemoGrad.addColorStop(0, 'rgba(210, 190, 150, 0.55)');
        hemoGrad.addColorStop(1, 'rgba(210, 190, 150, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, hr, 0, Math.PI * 2);
        ctx.fillStyle = hemoGrad;
        ctx.fill();
      } else {
        // Alpha: partial hemolysis — blood turns greenish-brown.
        // Render as a desaturation ring (olive tone replaces the red) rather than an additive blob.
        const alphaGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, hr);
        alphaGrad.addColorStop(0, 'rgba(155, 130, 80, 0.50)');
        alphaGrad.addColorStop(1, 'rgba(155, 130, 80, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, hr, 0, Math.PI * 2);
        ctx.fillStyle = alphaGrad;
        ctx.fill();
      }
    }

    // --- Colony bodies (isolated — matte opaque with irregular edges) ---
    for (let i = 0; i < colonies.length; i++) {
      const colony = colonies[i];
      if (colony.densityLevel === 'confluent') continue;
      // Dense colonies are rendered in the stipple pass below.
      if (colony.densityLevel === 'dense') continue;

      // Sigmoid fade-in: invisible early, smoothly appears as the colony grows.
      // smoothstep(0.10, 0.40, gf): starts at gf≈0.10 (~2h), fully visible at gf≈0.40 (~12h).
      const tAlpha = Math.max(0, Math.min(1, (colony.growthFactor - 0.10) / 0.30));
      const alpha = tAlpha * tAlpha * (3 - 2 * tAlpha);
      if (alpha < 0.02) continue;

      const { cx, cy, r } = colonyToCanvas(colony);
      ctx.globalAlpha = alpha;

      // Soft drop shadow (drawn first so it sits behind the colony body).
      ctx.beginPath();
      ctx.ellipse(cx + 0.9, cy + 1.2, r * 0.90, r * 0.70, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fill();

      // Irregular 10-point polygon — deterministic per-colony via position hash.
      // Small jitter (±6.5%) breaks the perfect-circle look without being distracting.
      ctx.beginPath();
      const hA = colony.x * 2345.6 + colony.y * 8901.2;
      for (let vi = 0; vi <= 10; vi++) {
        const theta = (vi / 10) * Math.PI * 2;
        const vr = r * (1 + Math.sin(hA + vi * 567.3) * 0.065);
        if (vi === 0) ctx.moveTo(cx + Math.cos(theta) * vr, cy + Math.sin(theta) * vr);
        else ctx.lineTo(cx + Math.cos(theta) * vr, cy + Math.sin(theta) * vr);
      }
      ctx.closePath();

      // Matte opaque body — flat fill, NO radial gradient fading to transparent (that reads as glow).
      ctx.fillStyle = colony.color;
      ctx.fill();

      // Darker rim (1px stroke) — defines edge without creating a light halo at perimeter.
      ctx.strokeStyle = lightenColor(colony.color, -22);
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Small opaque specular highlight (top-left ellipse).
      // NOT a gradient-to-transparent — that would read as glow.
      if (r >= 4) {
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.28, cy - r * 0.28, r * 0.20, r * 0.13, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Hover highlight
      if (pickingEnabled && i === hoveredColonyIndex && i !== selectedColonyIndex) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 184, 150, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Selected highlight
      if (i === selectedColonyIndex) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = colony.isIsolated
          ? 'rgba(108, 186, 108, 0.9)'
          : 'rgba(208, 108, 108, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = colony.isIsolated
          ? 'rgba(108, 186, 108, 0.3)'
          : 'rgba(208, 108, 108, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // --- Dense lawn background (matte flat fill, NO blur, NO glow) ---
    // B(x,y) = max growthFactor of covering dense seeds (time-varying via coverageRadius).
    // smoothstep(0.40, 0.80): starts at gf~0.40 (~14h), full at gf~0.80 (~20h).
    // Max alpha 75% — stipple dots painted above add the grain texture.
    {
      const B = computeCoverageField(colonies);
      const lawnColor = colonies.find(c => !c.isContaminant)?.color ?? '#fffdd0';
      const cellW = (PLATE_RADIUS * 2) / COVER_SIZE;
      const plateLeft = PLATE_CENTER - PLATE_RADIUS;
      const plateTop  = PLATE_CENTER - PLATE_RADIUS;
      const lawnCanvas = new OffscreenCanvas(PLATE_SIZE, PLATE_SIZE);
      const lctx = lawnCanvas.getContext('2d')!;
      lctx.fillStyle = lawnColor;
      for (let gy = 0; gy < COVER_SIZE; gy++) {
        for (let gx = 0; gx < COVER_SIZE; gx++) {
          const b = B[gy * COVER_SIZE + gx];
          if (b < 0.40) continue;
          const t = Math.max(0, Math.min(1, (b - 0.40) / 0.40));
          const alpha = t * t * (3 - 2 * t) * 0.75;
          if (alpha < 0.02) continue;
          lctx.globalAlpha = alpha;
          lctx.fillRect(plateLeft + gx * cellW, plateTop + gy * cellW, cellW + 0.5, cellW + 0.5);
        }
      }
      // No blur — matte fill. Real dense growth is opaque, not emissive.
      ctx.globalAlpha = 0.88;
      ctx.drawImage(lawnCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    // --- Dense stipple grain (1.2px dots, sigmoid opacity = smooth fade-in) ---
    // sigmoid(gf, center=0.45, k=10): invisible at 0h, 11% at 8h, 48% at 12h, full at 20h.
    // Each dot is tiny — the aggregate of hundreds creates high-frequency grain texture.
    {
      const denseColor = colonies.find(c => c.densityLevel === 'dense' && !c.isContaminant)?.color;
      if (denseColor) {
        ctx.fillStyle = denseColor;
        for (const colony of colonies) {
          if (colony.densityLevel !== 'dense') continue;
          const opacity = 1 / (1 + Math.exp(-10 * (colony.growthFactor - 0.45)));
          if (opacity < 0.04) continue;
          ctx.globalAlpha = opacity;
          const dcx = colony.x * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);
          const dcy = colony.y * PLATE_RADIUS * 2 + (PLATE_CENTER - PLATE_RADIUS);
          ctx.beginPath();
          ctx.arc(dcx, dcy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    // --- Glossy sheen (wet agar surface) ---
    const sheenGrad = ctx.createRadialGradient(
      PLATE_CENTER - 50, PLATE_CENTER - 50, 10,
      PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS
    );
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    sheenGrad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);

    ctx.restore();

    // --- 3D plate rim ---
    // Outer shadow
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Main rim
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180, 170, 155, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  $effect(() => {
    if (canvas) {
      colonies;
      mediaType;
      streakGrid;
      incubationHours;
      selectedColonyIndex;
      hoveredColonyIndex;
      renderColonies();
    }
  });
</script>

<div class="flex flex-col items-center gap-sm">
  <canvas
    bind:this={canvas}
    width={PLATE_SIZE}
    height={PLATE_SIZE}
    class="plate-canvas"
    class:picking={pickingEnabled}
    onclick={handleClick}
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
  ></canvas>

  {#if pickingEnabled && selectedColony}
    <div class="flex items-center gap-sm py-xs px-md rounded-md font-semibold text-sm" class:pick-pure={selectedColony.isIsolated} class:pick-mixed={!selectedColony.isIsolated}>
      {#if selectedColony.isContaminant}
        <span class="text-lg">⚠</span>
        <span>Contaminant colony — not the target organism</span>
      {:else if selectedColony.isIsolated}
        <span class="text-lg">✓</span>
        <span>Isolated colony — pure culture</span>
      {:else}
        <span class="text-lg">✗</span>
        <span>Confluent zone — mixed culture</span>
      {/if}
    </div>
  {:else if pickingEnabled}
    <p class="text-sm italic m-0 text-parchment-aged">Click a colony to pick it for subculture or staining.</p>
  {/if}

  <div class="text-xs uppercase tracking-widest text-parchment-aged">{MEDIA_COLORS[mediaType].label} — After Incubation</div>
</div>

<style>
  .plate-canvas {
    /* Internal resolution is 400×400 for picking accuracy, but CSS-scales to fit */
    width: 100%;
    max-width: 280px;
    height: auto;
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: var(--shadow-lg), 0 0 20px rgba(0, 0, 0, 0.4);
  }

  .plate-canvas.picking {
    cursor: crosshair;
  }

  .pick-pure {
    background: #1a3a1a;
    color: #6cba6c;
    border: 1px solid #2a5a2a;
  }

  .pick-mixed {
    background: #3a1a1a;
    color: #d06c6c;
    border: 1px solid #5a2a2a;
  }
</style>
