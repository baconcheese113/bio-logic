/**
 * Types for the plate streaking physics simulation.
 * All plate coordinates are normalized 0-1 within the circular plate boundary.
 */

// === Media ===

import type { MediaType } from '../../../lib/types';
export type { MediaType };

export const MEDIA_COLORS: Record<MediaType, { base: string; streak: string; label: string }> = {
  'blood-agar': { base: '#8b3a3a', streak: '#5c2020', label: 'Blood Agar' },
  'gelatin': { base: '#d4b86a', streak: '#b89840', label: 'Gelatin' },
  'nutrient-agar': { base: '#c9b896', streak: '#a89870', label: 'Nutrient Agar' },
};

// === Density Grid (core simulation state) ===

export const GRID_SIZE = 100; // 100x100 cells covering the plate
/** Canonical plate radius in canvas pixels (canvas is PLATE_SIZE×PLATE_SIZE). */
export const PLATE_RADIUS = 185;

export interface DensityGrid {
  /** Bacterial deposit density at each cell. Values 0+ (not capped). */
  cells: Float32Array;
  /** Agar damage at each cell. 0 = intact, >DAMAGE_THRESHOLD = gouged. */
  damage: Float32Array;
  /** Temperature at each cell when last touched by loop. 0 = cool, 1 = just flamed. */
  killZone: Float32Array;
}

export function createDensityGrid(): DensityGrid {
  const n = GRID_SIZE * GRID_SIZE;
  return {
    cells: new Float32Array(n),
    damage: new Float32Array(n),
    killZone: new Float32Array(n),
  };
}

/** Convert normalized plate coords (0-1) to grid indices. Returns -1 if outside plate. */
export function plateToGrid(nx: number, ny: number): { gx: number; gy: number } | null {
  const gx = Math.floor(nx * GRID_SIZE);
  const gy = Math.floor(ny * GRID_SIZE);
  if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
  // Check if inside circular plate (center 0.5, radius 0.5)
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  if (dx * dx + dy * dy > 0.25) return null; // outside plate circle
  return { gx, gy };
}

// === Simulation Constants ===

export const SIM = {
  // Deposit physics
  PRESSURE_LIGHT: 1.0,
  PRESSURE_HEAVY: 2.5,
  DAMAGE_THRESHOLD: 3.0,     // cumulative heavy pressure exceeding this = gouge
  DENSITY_MAX: 0.5,          // hard cap — a cell saturates and takes no more
  // Deposit: bacteria deposited per cell = volume × concentration × DEPOSIT_RATE × modifiers
  // This is independent of how fast volume drains, so Zone 1 is always confluent.
  DEPOSIT_RATE: 0.5,
  // Volume drain: fixed amount consumed per cell regardless of deposit amount.
  // Loop lasts ~1.0/0.005 = 200 cells (≈ 4 passes of 50 cells each = one full Zone 1).
  VOLUME_DRAIN: 0.005,
  // Pickup: fraction of cell density absorbed as volume when crossing an existing deposit.
  PICKUP_VOLUME_RATE: 0.12,

  // Speed normalization — speedNorm is in normalized plate coords per second
  SPEED_REFERENCE: 0.5,      // norm-coords/sec at "normal" sweep speed
  SPEED_MIN_FACTOR: 0.3,     // minimum speed factor (very fast movement)
  SPEED_MAX_FACTOR: 3.0,     // maximum speed factor (very slow/careful movement)

  // Loop temperature
  TEMP_DECAY_PER_FRAME: 0.015, // temperature drops this much per frame of movement
  KILL_THRESHOLD: 0.3,         // temperature above this kills bacteria on contact

  // Contamination
  CONTAM_RATE: 0.002,   // contamination events per frame per unit of lid angle
  CONTAM_BASE: 0.0005,  // base contamination even with lid mostly closed

  // Colony generation thresholds — calibrated to DEPOSIT_RATE=0.5, DENSITY_MAX=0.5
  // Zone 1 (full loop): cells cap at 0.5 and hit confluent easily
  // Zone 2 (pickup ≈0.15 vol, conc≈0.6): deposit ≈0.045/cell → dense near border, isolated far
  // Zone 3 (pickup from Zone 2 ≈0.03 vol, conc≈0.15): deposit ≈0.0023/cell → sparse isolated
  DENSITY_CONFLUENT: 0.20,  // Zone 1 carpet — 1 pass with full loop
  DENSITY_DENSE: 0.02,      // Zone 2 near border — diluted pickup
  DENSITY_ISOLATED: 0.003,  // Zone 3-4 — double-diluted pickup
  DENSITY_NONE: 0.0005,     // background noise threshold

  // Colony spawn probabilities per qualifying grid cell
  COLONY_PROB_CONFLUENT: 0.35,
  COLONY_PROB_DENSE: 0.25,
  COLONY_PROB_ISOLATED: 0.12,

  // Lid physics
  LID_MIN_STREAK: 0.15,     // minimum lid angle to allow streaking
  LID_OPTIMAL: 0.3,         // good balance of access vs contamination

  // Pressure ramp (per frame at ~60fps)
  PRESSURE_RAMP_UP: 0.015,    // ramp up when Shift held (~1.1s to full)
  PRESSURE_RAMP_DOWN: 0.008,  // ramp down when Shift released (~2s to zero — deliberate, like real pressure)
  MIN_STREAK_PRESSURE: 0.05,  // loop must press down to contact agar; at zero it hovers above

  // Lid tilt
  LID_TILT_THRESHOLD: 0.15,   // minimum tilt magnitude to allow streaking
  LID_TILT_DECAY: 0.92,       // per-frame decay factor when Q released
} as const;

// === Colony ===

export interface Colony {
  x: number;
  y: number;
  radius: number;
  color: string;
  hemolysisType: 'alpha' | 'beta' | 'gamma';
  hemolysisRadius: number;
  isContaminant: boolean;
  isIsolated: boolean; // true if no nearby colonies (suitable for picking)
  densityLevel: 'confluent' | 'dense' | 'isolated';
}

// === Colony Colors ===

export const COLONY_COLORS: Record<string, string> = {
  golden: '#daa520',
  white: '#f5f5dc',
  gray: '#a0a0a0',
  green: '#6b8e5a',
  cream: '#fffdd0',
  mucoid: '#e8dcc8',
};

export const CONTAMINANT_COLORS = ['#d4c5a9', '#b8a88a', '#c9c0aa', '#e0d5bf'];

// === Streak Quality (simplified - computed from density grid now) ===

export interface StreakQuality {
  isolatedColonyCount: number;
  contaminantCount: number;
  agarDamagePercent: number;
  killZonePercent: number;
  overallGrade: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  score: number; // 0-100
}
