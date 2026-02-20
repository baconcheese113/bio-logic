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

  // Perpendicular direction for wide-band deposit
  const perpScale = 1 / GRID_SIZE;
  const perpX = dist > 0.0001 ? (-dy / dist) * perpScale : 0;
  const perpY = dist > 0.0001 ? (dx / dist) * perpScale : 0;

  const bandOffsets = [
    { ox: 0, oy: 0, weight: SIM.LOOP_GROOVE_WEIGHT, isCenter: true },
    { ox: -perpX, oy: -perpY, weight: SIM.LOOP_EDGE_WEIGHT, isCenter: false },
    { ox: perpX, oy: perpY, weight: SIM.LOOP_EDGE_WEIGHT, isCenter: false },
  ];

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
        volume -= drain;

        // Distribute bacteria across 3-cell band
        for (const off of bandOffsets) {
          const cell = plateToGrid(px + off.ox, py + off.oy);
          if (!cell) continue;
          const idx = cell.gy * GRID_SIZE + cell.gx;
          const cellBacteria = bacteria * off.weight;
          const headroom = Math.max(0, SIM.DENSITY_MAX - state.grid.cells[idx]);
          state.grid.cells[idx] += Math.min(cellBacteria, headroom);

          if (off.isCenter) {
            state.grid.damage[idx] += SIM.LOOP_GROOVE_DAMAGE;
          }
        }
      }

      // --- Pickup: conservative transfer from grid to loop ---
      if (state.grid.cells[centerIdx] > SIM.DENSITY_ISOLATED) {
        const bacteriaPickedUp = state.grid.cells[centerIdx] * SIM.PICKUP_FRACTION;
        state.grid.cells[centerIdx] -= bacteriaPickedUp;

        const loopBacteria = volume * concentration + bacteriaPickedUp;
        volume = Math.min(1, volume + bacteriaPickedUp * SIM.PICKUP_VOLUME_FACTOR);
        concentration = volume > 0 ? loopBacteria / volume : 0;
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
