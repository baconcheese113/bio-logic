/**
 * Pure canvas rendering functions for culture plates.
 * Extracted from CultureWorkbench for reuse across workbench configurations.
 */

import type { DensityGrid, MediaType } from '../culture/streak-types';
import { MEDIA_COLORS, GRID_SIZE, SIM } from '../culture/streak-types';

export function lightenColor(hex: string, pct: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + pct);
  const g = Math.min(255, ((num >> 8) & 0xff) + pct);
  const b = Math.min(255, (num & 0xff) + pct);
  return `rgb(${r},${g},${b})`;
}

/** Draw complete plate (agar base + density overlay + rim) */
export function redrawPlate(
  ctx: CanvasRenderingContext2D,
  size: number,
  radius: number,
  mediaType: MediaType,
  grid: DensityGrid,
): void {
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);

  // Shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.restore();

  // Agar base
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  const colors = MEDIA_COLORS[mediaType];
  const grad = ctx.createRadialGradient(
    center - 30, center - 30, 10,
    center, center, radius,
  );
  grad.addColorStop(0, lightenColor(colors.base, 15));
  grad.addColorStop(1, colors.base);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  // Density overlay
  renderDensityOverlay(ctx, size, radius, grid, mediaType);

  // Rim
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,180,150,0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** Render bacteria density heatmap over the plate */
export function renderDensityOverlay(
  ctx: CanvasRenderingContext2D,
  size: number,
  radius: number,
  grid: DensityGrid,
  mediaType: MediaType,
): void {
  const center = size / 2;
  const colors = MEDIA_COLORS[mediaType];
  const cellSize = (radius * 2) / GRID_SIZE;

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const idx = gy * GRID_SIZE + gx;
      const d = grid.cells[idx];
      const dmg = grid.damage[idx];
      const kill = grid.killZone[idx];
      if (d < 0.001 && dmg < 0.1 && kill < 0.1) continue;

      const cx = (center - radius) + gx * cellSize;
      const cy = (center - radius) + gy * cellSize;

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

/** Draw a visible streak line between two normalized plate coordinates */
export function drawStreakSegment(
  ctx: CanvasRenderingContext2D,
  size: number,
  radius: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  inoculum: number,
  pressure: number,
  loopTemp: number,
  mediaType: MediaType,
): void {
  const center = size / 2;
  const colors = MEDIA_COLORS[mediaType];
  const cfx = from.x * radius * 2 + (center - radius);
  const cfy = from.y * radius * 2 + (center - radius);
  const ctx_x = to.x * radius * 2 + (center - radius);
  const ctx_y = to.y * radius * 2 + (center - radius);

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  // Main streak
  ctx.beginPath();
  ctx.moveTo(cfx, cfy);
  ctx.lineTo(ctx_x, ctx_y);
  ctx.strokeStyle = colors.streak;
  ctx.globalAlpha = 0.2 + Math.min(0.8, inoculum * 0.8);
  ctx.lineWidth = 3.5 + pressure * 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Hot loop trace
  if (loopTemp > SIM.KILL_THRESHOLD) {
    ctx.beginPath();
    ctx.moveTo(cfx, cfy);
    ctx.lineTo(ctx_x, ctx_y);
    ctx.strokeStyle = `rgba(255,100,0,${loopTemp * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Pressure damage indicator
  if (pressure > 0.5) {
    ctx.beginPath();
    ctx.moveTo(cfx, cfy);
    ctx.lineTo(ctx_x, ctx_y);
    ctx.strokeStyle = `rgba(0,0,0,${pressure * 0.15})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}
