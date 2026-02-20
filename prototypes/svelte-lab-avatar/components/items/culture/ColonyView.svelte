<script lang="ts">
  import type { Colony, MediaType, DensityGrid } from './simulation-types';
  import type { CultureFindings } from '../../../lib/types';
  import { MEDIA_COLORS, GRID_SIZE, SIM, PLATE_RADIUS, COLONY_COLORS } from './simulation-types';
  import { lightenColor } from './plate-renderer';

  interface Props {
    colonies: Colony[];
    mediaType: MediaType;
    grid?: DensityGrid;
    findings?: CultureFindings;
    pickingEnabled?: boolean;
    onColonyPicked?: (colony: Colony) => void;
  }

  let { colonies, mediaType, grid, findings, pickingEnabled = false, onColonyPicked }: Props = $props();

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

    // --- Confluent lawn (offscreen + blur for smooth edges) ---
    if (grid) {
      const cellPx = (PLATE_RADIUS * 2) / GRID_SIZE;
      const plateLeft = PLATE_CENTER - PLATE_RADIUS;
      const plateTop = PLATE_CENTER - PLATE_RADIUS;
      const cellR = cellPx * 0.72;

      if (findings) {
        const cColor = COLONY_COLORS[findings.colonyColor] ?? '#fffdd0';
        const offscreen = new OffscreenCanvas(PLATE_SIZE, PLATE_SIZE);
        const octx = offscreen.getContext('2d')!;
        octx.fillStyle = cColor;
        octx.beginPath();
        for (let gy = 0; gy < GRID_SIZE; gy++) {
          for (let gx = 0; gx < GRID_SIZE; gx++) {
            if (grid.cells[gy * GRID_SIZE + gx] < SIM.DENSITY_CONFLUENT) continue;
            const cx = plateLeft + (gx + 0.5) * cellPx;
            const cy = plateTop + (gy + 0.5) * cellPx;
            octx.moveTo(cx + cellR, cy);
            octx.arc(cx, cy, cellR, 0, Math.PI * 2);
          }
        }
        octx.fill();

        // Composite with slight blur to soften grid edges
        ctx.globalAlpha = 0.93;
        ctx.filter = 'blur(1.5px)';
        ctx.drawImage(offscreen, 0, 0);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      }

      // Dense (non-confluent) cells: faint darkening to hint at streak path
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const d = grid.cells[gy * GRID_SIZE + gx];
          if (d < SIM.DENSITY_DENSE || d >= SIM.DENSITY_CONFLUENT) continue;
          ctx.fillRect(
            plateLeft + gx * cellPx,
            plateTop + gy * cellPx,
            Math.ceil(cellPx) + 1,
            Math.ceil(cellPx) + 1
          );
        }
      }
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
        // Alpha: subtle greenish discoloration
        ctx.beginPath();
        ctx.arc(cx, cy, hr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 140, 100, 0.25)';
        ctx.fill();
      }
    }

    // --- Colony bodies (dense & isolated — opaque 3D circles) ---
    for (let i = 0; i < colonies.length; i++) {
      const colony = colonies[i];
      if (colony.densityLevel === 'confluent') continue;
      const { cx, cy, r } = colonyToCanvas(colony);

      // Colony body — opaque filled circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = colony.color;
      ctx.fill();

      // Subtle drop shadow
      ctx.beginPath();
      ctx.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Specular highlight (only on colonies large enough to see it)
      if (r >= 3) {
        const hlR = r * 0.4;
        const hlX = cx - r * 0.22;
        const hlY = cy - r * 0.22;
        const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
        hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = hlGrad;
        ctx.fillRect(hlX - hlR, hlY - hlR, hlR * 2, hlR * 2);
      }

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
      grid;
      findings;
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
