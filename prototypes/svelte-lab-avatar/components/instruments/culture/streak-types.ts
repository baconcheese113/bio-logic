/**
 * Types for the plate streaking physics simulation.
 * All plate coordinates are normalized 0-1 within the circular plate boundary.
 */

// === Media ===

export type MediaType = 'blood-agar' | 'macconkey' | 'nutrient-agar';

export const MEDIA_COLORS: Record<MediaType, { base: string; streak: string; label: string }> = {
  'blood-agar': { base: '#8b3a3a', streak: '#5c2020', label: 'Blood Agar' },
  'macconkey': { base: '#c97b8b', streak: '#a05a6a', label: 'MacConkey' },
  'nutrient-agar': { base: '#c9b896', streak: '#a89870', label: 'Nutrient Agar' },
};

// === Density Grid (core simulation state) ===

export const GRID_SIZE = 100; // 100x100 cells covering the plate

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

// === Loop State ===

export interface LoopState {
  inoculumLevel: number; // 0-1, how much bacteria is on the loop
  temperature: number;   // 0-1, 1.0 = just flamed (kills bacteria on contact), decays over time
  isFlamed: boolean;     // whether the loop has been sterilized since last use
}

// === Lid State ===

export interface LidState {
  tiltX: number;             // -1 to 1, horizontal tilt
  tiltY: number;             // -1 to 1, vertical tilt (positive = tilted away)
  totalOpenSeconds: number;  // accumulated time × exposure magnitude
}

// === Simulation Constants ===

export const SIM = {
  // Deposit physics
  PRESSURE_LIGHT: 1.0,
  PRESSURE_HEAVY: 2.5,
  DAMAGE_THRESHOLD: 3.0,     // cumulative heavy pressure exceeding this = gouge
  DEPOSIT_BASE_RATE: 0.02,   // base deposit per frame at normal speed
  DEPLETION_RATE: 0.85,      // fraction of deposit removed from loop each frame
  PICKUP_RATE: 0.05,         // fraction of existing density picked up when crossing

  // Speed normalization
  SPEED_REFERENCE: 5.0,      // pixels/frame at "normal" speed (normalized coords)
  SPEED_MIN_FACTOR: 0.3,     // minimum speed factor (very fast movement)
  SPEED_MAX_FACTOR: 3.0,     // maximum speed factor (very slow movement)

  // Loop temperature
  TEMP_DECAY_PER_FRAME: 0.015, // temperature drops this much per frame of movement
  KILL_THRESHOLD: 0.3,         // temperature above this kills bacteria on contact

  // Contamination
  CONTAM_RATE: 0.002,   // contamination events per frame per unit of lid angle
  CONTAM_BASE: 0.0005,  // base contamination even with lid mostly closed

  // Colony generation thresholds
  DENSITY_CONFLUENT: 0.5,   // above this = confluent growth
  DENSITY_DENSE: 0.15,      // above this = dense colonies
  DENSITY_ISOLATED: 0.02,   // above this = isolated colonies (the goal)
  DENSITY_NONE: 0.005,      // below this = no growth

  // Lid physics
  LID_MIN_STREAK: 0.15,     // minimum lid angle to allow streaking
  LID_OPTIMAL: 0.3,         // good balance of access vs contamination

  // Pressure ramp (per frame at ~60fps)
  PRESSURE_RAMP_UP: 0.015,    // ramp up when Shift held (~1.1s to full)
  PRESSURE_RAMP_DOWN: 0.025,  // ramp down when Shift released (~0.67s to zero)

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

// === Culture Phase ===

export type CulturePhase = 'prep' | 'streaking' | 'incubating' | 'reading' | 'picking';

// === Workbench Zones ===

export type WorkbenchZone = 'flame' | 'sample' | 'plate' | 'none';

export interface WorkbenchLayout {
  flameRect: { x: number; y: number; w: number; h: number };
  sampleRect: { x: number; y: number; w: number; h: number };
  plateRect: { x: number; y: number; w: number; h: number };
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
