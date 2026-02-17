/**
 * Culture plate behavior: density grid, lid physics, streak application.
 * All state mutations are explicit — call the functions, read the results.
 */

import type { DensityGrid } from '../culture/streak-types';
import { GRID_SIZE, SIM, createDensityGrid, plateToGrid } from '../culture/streak-types';

export interface PlateState {
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

/** Lid exposure magnitude (0-1) */
export function lidExposure(state: PlateState): number {
  return Math.min(1, Math.sqrt(state.lidTiltX ** 2 + state.lidTiltY ** 2));
}

/** Whether conditions allow streaking */
export function canStreak(state: PlateState, hasPlate: boolean, inoculumLevel: number): boolean {
  return hasPlate && lidExposure(state) >= SIM.LID_TILT_THRESHOLD && inoculumLevel > 0;
}

/** Set lid tilt from normalized mouse position (called when Q held) */
export function setLidTilt(state: PlateState, mouseX: number, mouseY: number): void {
  state.lidTiltX = (mouseX - 0.5) * 2;
  state.lidTiltY = (0.5 - mouseY) * 2;
}

/** Tick lid physics: decay tilt when Q released, accumulate contamination */
export function tickLid(state: PlateState, dt: number, holdingLid: boolean): void {
  // Tilt decay when Q not held
  if (!holdingLid && (state.lidTiltX !== 0 || state.lidTiltY !== 0)) {
    const decay = Math.pow(SIM.LID_TILT_DECAY, dt);
    state.lidTiltX *= decay;
    state.lidTiltY *= decay;
    if (Math.abs(state.lidTiltX) < 0.005) state.lidTiltX = 0;
    if (Math.abs(state.lidTiltY) < 0.005) state.lidTiltY = 0;
  }

  // Contamination accumulation
  const exposure = lidExposure(state);
  if (exposure > 0.01) {
    state.totalOpenSeconds += dt / 60;
    const chancePerFrame = SIM.CONTAM_BASE + exposure * SIM.CONTAM_RATE;
    if (Math.random() < chancePerFrame * dt) state.contaminationEvents++;
  }
}

/**
 * Apply streak physics along a segment. Mutates grid.
 * Returns updated inoculum level and temperature for the loop.
 */
export function applyStreakSegment(
  state: PlateState,
  from: { x: number; y: number },
  to: { x: number; y: number },
  loopInoculum: number,
  loopTemp: number,
  pressure: number,
  speedNorm: number,
): { inoculumLevel: number; temperature: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const speedFactor = Math.max(
    SIM.SPEED_MIN_FACTOR,
    Math.min(SIM.SPEED_MAX_FACTOR, SIM.SPEED_REFERENCE / Math.max(0.1, speedNorm * 100)),
  );
  const pressureFactor = SIM.PRESSURE_LIGHT + pressure * (SIM.PRESSURE_HEAVY - SIM.PRESSURE_LIGHT);

  let inoculum = loopInoculum;
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

    // Deposit bacteria
    if (inoculum > 0 && temp <= SIM.KILL_THRESHOLD) {
      const deposit = inoculum * SIM.DEPOSIT_BASE_RATE * pressureFactor * speedFactor;
      state.grid.cells[idx] += deposit;
      inoculum = Math.max(0, inoculum - deposit * SIM.DEPLETION_RATE);
    }

    // Pick up bacteria from existing deposit
    if (state.grid.cells[idx] > SIM.DENSITY_ISOLATED && temp <= SIM.KILL_THRESHOLD) {
      const pickup = state.grid.cells[idx] * SIM.PICKUP_RATE;
      inoculum = Math.min(1, inoculum + pickup);
      state.grid.cells[idx] -= pickup;
    }

    // Agar damage from pressure
    if (pressure > 0.3) state.grid.damage[idx] += pressure * SIM.PRESSURE_HEAVY * 0.01;
  }

  state.hasAnyDeposit = true;
  return { inoculumLevel: inoculum, temperature: temp };
}

/** Reset plate to empty initial state */
export function resetPlate(state: PlateState): void {
  state.grid = createDensityGrid();
  state.contaminationEvents = 0;
  state.hasAnyDeposit = false;
  state.lidTiltX = 0;
  state.lidTiltY = 0;
  state.totalOpenSeconds = 0;
}
