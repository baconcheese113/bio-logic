/**
 * Types for the plate streaking physics simulation.
 * All plate coordinates are normalized 0-1 within the circular plate boundary.
 */

// === Media ===

import type { MediaType } from '../../../lib/types';
export type { MediaType };

export const MEDIA_COLORS: Record<MediaType, { base: string; streak: string; label: string }> = {
  'blood-agar':    { base: '#991d1d', streak: '#4a0e0e', label: 'Blood Agar' },
  'gelatin':       { base: '#d4b86a', streak: '#b89840', label: 'Gelatin' },
  'nutrient-agar': { base: '#c9b896', streak: '#a89870', label: 'Nutrient Agar' },
  'macconkey':     { base: '#e8b4a0', streak: '#c47860', label: 'MacConkey Agar' },
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

  // Fractional drain: each step transfers this fraction of remaining volume to agar.
  // Gives exponential decay — heavy deposit at start, rapidly diminishing.
  // bacteria_deposited = drain × concentration (conservative by construction).
  // 0.004 keeps enough bacteria for ~4 zone-1 strokes before trailing off.
  DRAIN_FRACTION: 0.004,

  // Pickup: fraction of cell density picked up when loop crosses existing deposit.
  // 0.25 creates a visible combed reduction band when crossing the initial dense streak.
  PICKUP_FRACTION: 0.25,
  // How much "volume" each unit of picked-up bacteria adds to loop load.
  // 1.0: each unit picked up refills the loop by 1 unit of volume —
  // means the loop loads up fast in dense regions, producing a visible diluted trail.
  PICKUP_VOLUME_FACTOR: 1.0,

  // Wide-band deposit: replaced by Gaussian splat kernel in streak-physics.ts
  LOOP_GROOVE_DAMAGE: 0.003,  // faint agar scoring from wire drag on center cell

  // Speed normalization — speedNorm is in normalized plate coords per second
  SPEED_REFERENCE: 0.5,      // norm-coords/sec at "normal" sweep speed
  SPEED_MIN_FACTOR: 0.3,     // minimum speed factor (very fast movement)
  SPEED_MAX_FACTOR: 1.8,     // maximum speed factor (very slow/careful movement)

  // Loop temperature
  TEMP_DECAY_PER_FRAME: 0.015, // temperature drops this much per frame of movement
  KILL_THRESHOLD: 0.3,         // temperature above this kills bacteria on contact

  // Contamination
  CONTAM_RATE: 0.002,   // contamination events per frame per unit of lid angle
  CONTAM_BASE: 0.0005,  // base contamination even with lid mostly closed

  // Colony generation thresholds — calibrated to DRAIN_FRACTION=0.005, concentration=100
  // Zone 1 (full loop): exponential decay, cells reach confluent easily
  // Zone 2 (pickup from zone 1): much less volume, moderate deposit
  // Zone 3 (pickup from zone 2): sparse isolated colonies
  DENSITY_CONFLUENT: 0.20,  // Zone 1 carpet — 1 pass with full loop
  DENSITY_DENSE: 0.02,      // Zone 2 near border — diluted pickup
  DENSITY_ISOLATED: 0.003,  // Zone 3-4 — double-diluted pickup
  DENSITY_NONE: 0.0005,     // background noise threshold

  // Colony spawn probability for isolated tier (sparse cells only).
  // Confluent + dense regions are rendered as continuous tinted mass, not circles.
  COLONY_PROB_ISOLATED: 0.15,

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
  /** Growth-factor-scaled influence radius for the dense lawn overlay — NOT collision-capped.
   * Evolves with incubation time so the lawn visibly emerges as bacteria spread. */
  coverageRadius: number;
  /** Per-seed logistic growth factor at current incubation time (0→1). Used by lawn overlay. */
  growthFactor: number;
  color: string;
  hemolysisType: 'alpha' | 'beta' | 'gamma';
  hemolysisRadius: number;
  isContaminant: boolean;
  isIsolated: boolean; // true if no nearby colonies (suitable for picking)
  densityLevel: 'confluent' | 'dense' | 'isolated';
}

/** A placed bacterial seed. Radius grows over incubation time via logistic curve.
 * Seeds are immutable after placement; colonies are computed at render time from
 * (seeds, incubationHours) so the same seeds can be re-rendered at any time point. */
export interface ColonySeed {
  x: number;
  y: number;
  /** Maximum radius this colony can reach at full incubation (plate-fraction). */
  r_max: number;
  /** Lag phase duration in hours — growth doesn't start until t > lag. */
  lag: number;
  /** Logistic growth rate (k). Higher = faster colony expansion after lag. */
  growthRate: number;
  densityLevel: Colony['densityLevel'];
  color: string;
  hemolysisType: Colony['hemolysisType'];
  isContaminant: boolean;
}

// === Colony Colors ===

export const COLONY_COLORS: Record<string, string> = {
  golden:    '#daa520',
  white:     '#f5f5dc',
  gray:      '#a8a8a0',
  green:     '#6b8e5a',
  cream:     '#fffdd0',
  mucoid:    '#e8dcc8',
  pink:      '#e8648a',  // MacConkey lactose fermenters
  colorless: '#e4dcd2',  // non-fermenters on MacConkey (near-agar tone)
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
