<script lang="ts">
  import type { Colony, MediaType, DensityGrid } from './simulation-types';
  import type { CultureFindings } from '../../../lib/types';
  import { MEDIA_COLORS, COLONY_COLORS, GRID_SIZE, SIM, PLATE_RADIUS } from './simulation-types';
  import { lightenColor, hexToRgba } from './plate-renderer';

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
      r: Math.max(3, colony.radius * PLATE_RADIUS * 2),
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

    // Plate shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    ctx.restore();

    // Plate background
    ctx.save();
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    const colors = MEDIA_COLORS[mediaType];
    const grad = ctx.createRadialGradient(
      PLATE_CENTER - 30, PLATE_CENTER - 30, 10,
      PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS
    );
    grad.addColorStop(0, lightenColor(colors.base, 15));
    grad.addColorStop(1, colors.base);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);

    // Grid-based confluent carpet — renders a true solid lawn from density data
    if (grid && findings) {
      const baseColor = COLONY_COLORS[findings.colonyColor] ?? COLONY_COLORS['cream'];
      const cellPx = (PLATE_RADIUS * 2) / GRID_SIZE;
      const plateLeft = PLATE_CENTER - PLATE_RADIUS;
      const plateTop = PLATE_CENTER - PLATE_RADIUS;
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.92;
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          const density = grid.cells[gy * GRID_SIZE + gx];
          if (density < SIM.DENSITY_CONFLUENT) continue;
          ctx.fillRect(
            plateLeft + gx * cellPx,
            plateTop + gy * cellPx,
            Math.ceil(cellPx) + 1,
            Math.ceil(cellPx) + 1
          );
        }
      }
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }

    // Draw hemolysis zones first
    for (const colony of colonies) {
      if (colony.densityLevel === 'confluent' && grid) continue; // confluent hemolysis shown via carpet
      const { cx, cy } = colonyToCanvas(colony);
      if (colony.hemolysisType !== 'gamma' && colony.hemolysisRadius > 0) {
        const hr = colony.hemolysisRadius * PLATE_RADIUS * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, hr, 0, Math.PI * 2);
        ctx.fillStyle = colony.hemolysisType === 'beta'
          ? 'rgba(200, 180, 160, 0.4)'
          : 'rgba(120, 140, 100, 0.3)';
        ctx.fill();
      }
    }

    // Draw colony bodies
    for (let i = 0; i < colonies.length; i++) {
      const colony = colonies[i];
      if (colony.densityLevel === 'confluent' && grid) continue; // rendered as pixel carpet above
      const { cx, cy, r } = colonyToCanvas(colony);

      if (colony.densityLevel === 'confluent') {
        // Flat matte fill fallback when no grid
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = colony.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // Soft organic blob — radial gradient fading to transparent, no hard edge
        const blobR = r * 2.2;
        const blobGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, blobR);
        const peakAlpha = colony.densityLevel === 'isolated' ? 0.95 : 0.80;
        blobGrad.addColorStop(0,   hexToRgba(colony.color, peakAlpha));
        blobGrad.addColorStop(0.45, hexToRgba(colony.color, peakAlpha * 0.75));
        blobGrad.addColorStop(1,   hexToRgba(colony.color, 0));
        ctx.fillStyle = blobGrad;
        ctx.fillRect(cx - blobR, cy - blobR, blobR * 2, blobR * 2);
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
          ? 'rgba(108, 186, 108, 0.9)'  // green for pure/isolated
          : 'rgba(208, 108, 108, 0.9)'; // red for mixed/confluent
        ctx.lineWidth = 2;
        ctx.stroke();

        // Second ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = colony.isIsolated
          ? 'rgba(108, 186, 108, 0.3)'
          : 'rgba(208, 108, 108, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();

    // Plate rim
    ctx.beginPath();
    ctx.arc(PLATE_CENTER, PLATE_CENTER, PLATE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 180, 150, 0.3)';
    ctx.lineWidth = 3;
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
