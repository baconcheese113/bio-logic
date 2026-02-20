/**
 * Culture plate behavior: density grid, lid physics, streak application.
 * All state mutations are explicit — call the functions, read the results.
 *
 * Conservation model:
 *   The loop carries a finite film of bacteria (volume × concentration).
 *   Each step drains a fraction of remaining volume (exponential decay).
 *   Bacteria deposited = drained volume × concentration — no creation from nothing.
 *   Pickup transfers bacteria from grid to loop, conserving mass exactly.
 */

import type { DensityGrid } from './simulation-types';
import { GRID_SIZE, SIM, createDensityGrid, plateToGrid } from './simulation-types';

// Precomputed circular Gaussian splat kernel — radius 2 grid cells, σ=1.2.
// Replaces the 3-cell perpendicular band: 13-cell smooth footprint that matches
// the finite contact area of a real inoculation loop pressed onto agar.
// Deposit is naturally smoothed at source — no post-hoc blur needed.
const SPLAT_RADIUS = 2;
const SPLAT_KERNEL: ReadonlyArray<{ readonly dgx: number; readonly dgy: number; readonly weight: number }> = (() => {
  const sigma = 1.2;
  const entries: Array<{ dgx: number; dgy: number; weight: number }> = [];
  let total = 0;
  for (let dgy = -SPLAT_RADIUS; dgy <= SPLAT_RADIUS; dgy++) {
    for (let dgx = -SPLAT_RADIUS; dgx <= SPLAT_RADIUS; dgx++) {
      if (dgx * dgx + dgy * dgy > SPLAT_RADIUS * SPLAT_RADIUS) continue;
      const w = Math.exp(-(dgx * dgx + dgy * dgy) / (2 * sigma * sigma));
      entries.push({ dgx, dgy, weight: w });
      total += w;
    }
  }
  return entries.map(e => ({ dgx: e.dgx, dgy: e.dgy, weight: e.weight / total }));
})();

interface PlateState {
  grid: DensityGrid;
  lidTiltX: number;
  lidTiltY: number;
  totalOpenSeconds: number;
  contaminationEvents: number;
  hasAnyDeposit: boolean;
  /** Total bacteria loaded from patient sample (set on first deposit). */
  initialBacteriaLoaded: number;
  /** Running sum of all bacteria on the grid. */
  totalGridBacteria: number;
}

export function createPlateState(): PlateState {
  return {
    grid: createDensityGrid(),
    lidTiltX: 0,
    lidTiltY: 0,
    totalOpenSeconds: 0,
    contaminationEvents: 0,
    hasAnyDeposit: false,
    initialBacteriaLoaded: 0,
    totalGridBacteria: 0,
  };
}

/**
 * Apply streak physics along a segment. Mutates grid.
 *
 * Exponential drain model:
 *   Each step, `drain = volume × DRAIN_FRACTION × pressure × speed`.
 *   bacteria = drain × concentration (conservative — only what left the loop).
 *   Bacteria are distributed across a 3-cell-wide band perpendicular to movement
 *   (groove center + two ridges).
 *
 * Returns updated loop volume, concentration, and temperature.
 */
export function applyStreakSegment(
  state: PlateState,
  from: { x: number; y: number },
  to: { x: number; y: number },
  loopVolume: number,
  loopConcentration: number,
  loopTemp: number,
  pressure: number,
  speedNorm: number,
): { volume: number; concentration: number; temperature: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Slow movement = more volume transferred per cell (loop lingers)
  const speedFactor = Math.max(
    SIM.SPEED_MIN_FACTOR,
    Math.min(SIM.SPEED_MAX_FACTOR, SIM.SPEED_REFERENCE / Math.max(0.01, speedNorm)),
  );
  const pressureFactor = SIM.PRESSURE_LIGHT + pressure * (SIM.PRESSURE_HEAVY - SIM.PRESSURE_LIGHT);

  let volume = loopVolume;
  let concentration = loopConcentration;
  let temp = loopTemp;

  // Record initial bacteria on first loaded deposit
  if (state.initialBacteriaLoaded === 0 && volume > 0 && concentration > 0) {
    state.initialBacteriaLoaded = volume * concentration;
  }

  const steps = Math.max(1, Math.ceil(dist * GRID_SIZE));
  for (let s = 0; s <= steps; s++) {
    const t = steps > 0 ? s / steps : 0;
    const px = from.x + dx * t;
    const py = from.y + dy * t;
    const centerCell = plateToGrid(px, py);
    if (!centerCell) continue;
    const centerIdx = centerCell.gy * GRID_SIZE + centerCell.gx;

    // Temperature decay during movement
    if (temp > 0) temp = Math.max(0, temp - SIM.TEMP_DECAY_PER_FRAME / Math.max(1, steps));
    if (temp > SIM.KILL_THRESHOLD) state.grid.killZone[centerIdx] = Math.max(state.grid.killZone[centerIdx], temp);

    if (temp <= SIM.KILL_THRESHOLD) {
      // --- Deposit: exponential fractional drain ---
      if (volume > 0) {
        const drainRate = SIM.DRAIN_FRACTION * pressureFactor * speedFactor;
        const drain = volume * drainRate;
        const bacteria = drain * concentration;

        // Gaussian splat: distribute bacteria across kernel footprint.
        // Conservation: only drain the volume that corresponds to bacteria
        // that actually landed on agar (can't vanish into saturated cells).
        let totalDeposited = 0;
        const { gx: cgx, gy: cgy } = centerCell;
        for (const { dgx, dgy, weight } of SPLAT_KERNEL) {
          const nx = cgx + dgx, ny = cgy + dgy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          const idx = ny * GRID_SIZE + nx;
          const headroom = Math.max(0, SIM.DENSITY_MAX - state.grid.cells[idx]);
          const deposited = Math.min(bacteria * weight, headroom);
          state.grid.cells[idx] += deposited;
          totalDeposited += deposited;
          if (dgx === 0 && dgy === 0) state.grid.damage[idx] += SIM.LOOP_GROOVE_DAMAGE;
        }
        volume -= concentration > 0 ? totalDeposited / concentration : drain;
      }

      // --- Pickup: conservative transfer across Gaussian kernel footprint ---
      // Sampling the same 13-cell footprint as deposit creates a wide "combed" band
      // when crossing a dense streak, matching the physical loop contact area.
      {
        let totalPickedUp = 0;
        const pkx = centerCell.gx, pky = centerCell.gy;
        for (const { dgx, dgy, weight } of SPLAT_KERNEL) {
          const nx = pkx + dgx, ny = pky + dgy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          const pidx = ny * GRID_SIZE + nx;
          if (state.grid.cells[pidx] <= SIM.DENSITY_ISOLATED) continue;
          const picked = state.grid.cells[pidx] * SIM.PICKUP_FRACTION * weight;
          state.grid.cells[pidx] -= picked;
          totalPickedUp += picked;
        }
        if (totalPickedUp > 0) {
          const loopBacteria = volume * concentration + totalPickedUp;
          volume = Math.min(1, volume + totalPickedUp * SIM.PICKUP_VOLUME_FACTOR);
          concentration = volume > 0 ? loopBacteria / volume : 0;
        }
      }
    }

    // Agar damage from heavy pressure
    if (pressure > 0.3) state.grid.damage[centerIdx] += pressure * SIM.PRESSURE_HEAVY * 0.01;
  }

  state.hasAnyDeposit = true;

  // Update running grid total
  let gridSum = 0;
  const cells = state.grid.cells;
  for (let i = 0, len = cells.length; i < len; i++) gridSum += cells[i];
  state.totalGridBacteria = gridSum;

  return { volume, concentration, temperature: temp };
}
