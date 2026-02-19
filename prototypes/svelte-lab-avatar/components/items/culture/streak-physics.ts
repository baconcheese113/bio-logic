/**
 * Culture plate behavior: density grid, lid physics, streak application.
 * All state mutations are explicit — call the functions, read the results.
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
}

export function createPlateState(): PlateState {
  return {
    grid: createDensityGrid(),
    lidTiltX: 0,
    lidTiltY: 0,
    totalOpenSeconds: 0,
    contaminationEvents: 0,
    hasAnyDeposit: false,
  };
}

/**
 * Apply streak physics along a segment. Mutates grid.
 *
 * Fluid model:
 *   The loop carries a thin film of liquid (volume) at some bacterial concentration.
 *   Each step, a fraction of the remaining volume transfers to the agar — like ink on a pen nib.
 *   The bacteria deposited = transferred_volume × concentration.
 *   Volume depletes; concentration stays constant until zone-crossing pickup mixes in dilute fluid.
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
  // Fast movement = less volume per cell (skims the surface)
  const speedFactor = Math.max(
    SIM.SPEED_MIN_FACTOR,
    Math.min(SIM.SPEED_MAX_FACTOR, SIM.SPEED_REFERENCE / Math.max(0.01, speedNorm)),
  );
  const pressureFactor = SIM.PRESSURE_LIGHT + pressure * (SIM.PRESSURE_HEAVY - SIM.PRESSURE_LIGHT);

  let volume = loopVolume;
  let concentration = loopConcentration;
  let temp = loopTemp;

  const steps = Math.max(1, Math.ceil(dist * GRID_SIZE));
  for (let s = 0; s <= steps; s++) {
    const t = steps > 0 ? s / steps : 0;
    const px = from.x + dx * t;
    const py = from.y + dy * t;
    const cell = plateToGrid(px, py);
    if (!cell) continue;
    const idx = cell.gy * GRID_SIZE + cell.gx;

    // Temperature decay during movement
    if (temp > 0) temp = Math.max(0, temp - SIM.TEMP_DECAY_PER_FRAME / Math.max(1, steps));
    if (temp > SIM.KILL_THRESHOLD) state.grid.killZone[idx] = Math.max(state.grid.killZone[idx], temp);

    if (temp <= SIM.KILL_THRESHOLD) {
      // --- Deposit: bacteria deposited scales with current volume × concentration ---
      // Volume drains at a flat fixed rate (like pen ink) independent of deposit amount.
      // This lets Zone 1 be confluent while still allowing the loop to last ~200 cells.
      if (volume > 0) {
        const bacteria = volume * concentration * SIM.DEPOSIT_RATE * pressureFactor * speedFactor;
        const headroom = Math.max(0, SIM.DENSITY_MAX - state.grid.cells[idx]);
        state.grid.cells[idx] += Math.min(bacteria, headroom);
        volume = Math.max(0, volume - SIM.VOLUME_DRAIN);
        // concentration unchanged — film thins uniformly
      }

      // --- Pickup: crossing existing deposit loads a thin film of dilute fluid ---
      if (state.grid.cells[idx] > SIM.DENSITY_ISOLATED) {
        const pickupVolume = state.grid.cells[idx] * SIM.PICKUP_VOLUME_RATE;
        const pickupConc = state.grid.cells[idx] / SIM.DENSITY_MAX;
        const newVolume = volume + pickupVolume;
        concentration = newVolume > 0
          ? (volume * concentration + pickupVolume * pickupConc) / newVolume
          : 0;
        volume = Math.min(1, newVolume);
        state.grid.cells[idx] -= pickupVolume;
      }
    }

    // Agar damage from heavy pressure
    if (pressure > 0.3) state.grid.damage[idx] += pressure * SIM.PRESSURE_HEAVY * 0.01;
  }

  state.hasAnyDeposit = true;

  return { volume, concentration, temperature: temp };
}

