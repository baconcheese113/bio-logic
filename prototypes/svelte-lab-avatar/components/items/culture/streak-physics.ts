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

/** Grid size the physics constants were tuned for — used to normalise per-step drain/pickup. */
const REFERENCE_GRID = 100;
/** Number of lateral positions tracked across the loop's contact width. */
const LOOP_PROFILE_SIZE = 16;

interface PhysicsTuning {
  drainFraction: number;
  pickupFraction: number;
  pickupVolumeFactor: number;
  densityMax: number;
  equalizeRate: number;
  initialConcentration: number;
  grooveStrength: number;
  ridgeDistance: number;
  ridgeWidth: number;
  pickupThreshold: number;
}

function defaultPhysics(): PhysicsTuning {
  return {
    drainFraction: SIM.DRAIN_FRACTION,
    pickupFraction: SIM.PICKUP_FRACTION,
    pickupVolumeFactor: SIM.PICKUP_VOLUME_FACTOR,
    densityMax: SIM.DENSITY_MAX,
    equalizeRate: 0.15,
    initialConcentration: 100,
    grooveStrength: 0.7,
    ridgeDistance: 1.0,
    ridgeWidth: 1.0,
    pickupThreshold: SIM.DENSITY_ISOLATED,
  };
}

// Base kernel shape values (at GRID_SIZE=300)
const KERNEL_BASE_RIDGE_DIST = 2.4;
const KERNEL_PRESSURE_RIDGE_DIST = 2.1;
const KERNEL_BASE_RIDGE_WIDTH = 1.8;
const KERNEL_PRESSURE_RIDGE_WIDTH = 0.9;
const KERNEL_GROOVE_SIGMA = 0.9;

/**
 * Directional splat kernel for realistic streaking.
 * 
 * Physics model:
 *   - Loop is a wire that creates a pressure footprint on agar
 *   - At light pressure: narrow center groove (~0.5-1.0mm) with faint ridges
 *   - At heavy pressure: wide contact footprint (~1.5-2.0mm) that can displace bacteria to sides
 *   - Direction of movement matters:
 *     * Leading edge: touches fresh dense agar, can pick up more
 *     * Trailing edge: leaves a wake, sensitive to pressure ridge formation
 *     * Perpendicular ridges: bacteria redistributed by groove displacement under heavy pressure
 */

interface SplatKernelEntry {
  readonly dgx: number;
  readonly dgy: number;
  readonly depositWeight: number;  // how much bacteria is left at this cell
  readonly pickupWeight: number;   // how much bacteria is picked up (trailing edge picks more)
  readonly displaceWeight: number; // sideways displacement factor (only for heavy pressure)
}

type SplatKernel = ReadonlyArray<SplatKernelEntry>;

/**
 * Build a bimodal directional splat kernel.
 * 
 * The inoculation loop wire drags through agar, creating:
 *   - A groove at center (wire contact) where bacteria are displaced outward
 *   - Two ridges on either side where bacteria accumulate (higher density)
 *   - Asymmetric front/back: leading edge contacts fresh agar, trailing edge drags
 * 
 * The deposit profile perpendicular to movement is bimodal (double-humped),
 * NOT Gaussian. This matches the real physical behavior of a wire loop.
 * 
 * @param dirX, dirY — normalized movement direction (0,0 means stationary)
 * @param pressure — 0-1, scales kernel size (heavy pressure = wider contact area)
 */
function buildDirectionalSplat(
  dirX: number, dirY: number, pressure: number,
  grooveStrength: number, ridgeDistScale: number, ridgeWidthScale: number,
): SplatKernel {
  const entries: Array<SplatKernelEntry> = [];

  // Pressure-scaled footprint
  const baseRadius = 6;
  const pressureRadius = 3 + pressure * 4.5;
  const maxR = Math.ceil(baseRadius + pressureRadius);

  const ridgeDist = (KERNEL_BASE_RIDGE_DIST + pressure * KERNEL_PRESSURE_RIDGE_DIST) * ridgeDistScale;
  const ridgeWidth = (KERNEL_BASE_RIDGE_WIDTH + pressure * KERNEL_PRESSURE_RIDGE_WIDTH) * ridgeWidthScale;

  // Parallel (along movement) spread
  const sigma_par = 3.0 + pressure * 0.9;

  let depTotal = 0, pickTotal = 0;

  for (let dy = -maxR; dy <= maxR; dy++) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      let parComponent: number, perpComponent: number;
      if (dirX * dirX + dirY * dirY > 0.01) {
        parComponent = dx * dirX + dy * dirY;
        perpComponent = -dx * dirY + dy * dirX;
      } else {
        parComponent = 0;
        perpComponent = Math.sqrt(dx * dx + dy * dy);
      }

      // Along-movement Gaussian envelope
      const gaussPar = Math.exp(-(parComponent * parComponent) / (2 * sigma_par * sigma_par));

      // Perpendicular: bimodal (two ridges) — sum of two Gaussians offset from center
      // Each ridge is at ±ridgeDist from center
      const leftRidge = Math.exp(-((perpComponent + ridgeDist) ** 2) / (2 * ridgeWidth * ridgeWidth));
      const rightRidge = Math.exp(-((perpComponent - ridgeDist) ** 2) / (2 * ridgeWidth * ridgeWidth));
      const bimodal = leftRidge + rightRidge;

      // Center groove suppression: reduce deposit right at center
      // Wire physically displaces bacteria outward from its contact line
      const grooveSuppression = 1 - grooveStrength * Math.exp(-(perpComponent * perpComponent) / (2 * KERNEL_GROOVE_SIGMA * KERNEL_GROOVE_SIGMA));

      const w = gaussPar * bimodal * grooveSuppression;
      if (w < 0.01) continue;

      // Asymmetric deposit: leading edge deposits slightly more
      const depositWeight = w * (1 + parComponent * 0.15);

      // Pickup: trailing edge picks up more
      const pickupWeight = w * (1 + (-parComponent) * 0.2);

      entries.push({ dgx: dx, dgy: dy, depositWeight, pickupWeight, displaceWeight: 0 });
      depTotal += Math.max(0, depositWeight);
      pickTotal += pickupWeight;
    }
  }

  // Normalize weights
  return entries.map(e => ({
    dgx: e.dgx,
    dgy: e.dgy,
    depositWeight: depTotal > 0 ? e.depositWeight / depTotal : 0,
    pickupWeight: pickTotal > 0 ? e.pickupWeight / pickTotal : 0,
    displaceWeight: 0,
  }));
}

// Kernel cache — keyed by (dirX, dirY, pressure, kernel shape params) rounded to 0.1
const KERNEL_CACHE = new Map<string, SplatKernel>();

function getCachedKernel(
  dirX: number, dirY: number, pressure: number,
  grooveStrength: number, ridgeDistScale: number, ridgeWidthScale: number,
): SplatKernel {
  const key = `${Math.round(dirX * 10)},${Math.round(dirY * 10)},${Math.round(pressure * 10)},${Math.round(grooveStrength * 10)},${Math.round(ridgeDistScale * 10)},${Math.round(ridgeWidthScale * 10)}`;
  if (!KERNEL_CACHE.has(key)) {
    KERNEL_CACHE.set(key, buildDirectionalSplat(dirX, dirY, pressure, grooveStrength, ridgeDistScale, ridgeWidthScale));
  }
  return KERNEL_CACHE.get(key)!;
}

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

// Half-width (in kernel grid cells) used for profile bucket mapping.
// Should cover the max kernel extent — matches pressureRadius up to pressure=1.
const PROFILE_HALF_WIDTH = 15;

/**
 * Apply streak physics along a segment. Mutates grid.
 *
 * Exponential drain model:
 *   Each step, `drain = volume × DRAIN_FRACTION × pressure × speed`.
 *   bacteria = drain × concentration (conservative — only what left the loop).
 *
 * Per-pixel loop profile:
 *   loopProfile is a 16-element Float32Array (sums to 1) representing the fractional
 *   distribution of bacteria across the loop's lateral width. Deposition at each kernel
 *   cell is scaled by the profile value at that cell's perpendicular position, then
 *   renormalized — so total deposit is unchanged (mass conserved).
 *
 *   Pickup accumulates per-bucket, updating the profile to reflect what the loop
 *   picked up from the agar. Lateral equalization (1D diffusion) is applied after
 *   each segment — density slowly spreads across the loop width.
 *
 * Returns updated loop volume, concentration, temperature, and profile.
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
  loopProfile: Float32Array,
  physics: PhysicsTuning = defaultPhysics(),
): { volume: number; concentration: number; temperature: number; profile: Float32Array; deposited: number; pickedUp: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normalize movement direction for splat biasing
  let dirX = 0, dirY = 0;
  if (dist > 0.001) {
    dirX = dx / dist;
    dirY = dy / dist;
  }

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

  // Get directional kernel for this movement
    const kernel = getCachedKernel(dirX, dirY, pressure, physics.grooveStrength, physics.ridgeDistance, physics.ridgeWidth);
  // Pre-compute profile buckets for each kernel entry (direction-dependent, so done once)
  const entryBuckets = new Int32Array(kernel.length);
  for (let ei = 0; ei < kernel.length; ei++) {
    const entry = kernel[ei];
    const perp = -entry.dgx * dirY + entry.dgy * dirX;
    entryBuckets[ei] = Math.max(0, Math.min(LOOP_PROFILE_SIZE - 1,
      Math.floor((perp + PROFILE_HALF_WIDTH) / (2 * PROFILE_HALF_WIDTH) * LOOP_PROFILE_SIZE)));
  }

  // Pickup profile accumulator — tracks where on the loop bacteria was picked up from agar
  const pickupAccum = new Float32Array(LOOP_PROFILE_SIZE);
  let pickupAccumTotal = 0;
  let segmentDeposited = 0;

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
      // --- Deposit: profile-weighted, renormalized for mass conservation ---
      if (volume > 0) {
        // Scale drain per step so total depletion over a crossing is resolution-independent.
        // Physics were tuned at REFERENCE_GRID (100); at higher grids there are more steps.
        const resScale = REFERENCE_GRID / GRID_SIZE;
        const drainRate = physics.drainFraction * pressureFactor * speedFactor * resScale;
        // Logarithmic drain: volume² makes the loop deplete as 1/(1+t)
        // instead of exp(-t), so bacteria stretches much further
        const drain = volume * volume * drainRate;
        const bacteria = drain * concentration;

        const { gx: cgx, gy: cgy } = centerCell;

        // Compute profile-weighted deposit amounts for each kernel entry
        const weightedDeposits = new Float32Array(kernel.length);
        let weightedTotal = 0;
        for (let ei = 0; ei < kernel.length; ei++) {
          const w = Math.max(0, kernel[ei].depositWeight) * loopProfile[entryBuckets[ei]] * LOOP_PROFILE_SIZE;
          weightedDeposits[ei] = w;
          weightedTotal += w;
        }

        // Deposit using profile-weighted, renormalized weights (total bacteria unchanged)
        let totalDeposited = 0;
        for (let ei = 0; ei < kernel.length; ei++) {
          const entry = kernel[ei];
          const nx = cgx + entry.dgx, ny = cgy + entry.dgy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          const idx = ny * GRID_SIZE + nx;

          const normalizedWeight = weightedTotal > 0 ? weightedDeposits[ei] / weightedTotal : entry.depositWeight;
          const headroom = Math.max(0, physics.densityMax - state.grid.cells[idx]);
          const deposited = Math.min(bacteria * normalizedWeight, headroom);
          state.grid.cells[idx] += deposited;
          totalDeposited += deposited;

          // Center cell gets groove damage
          if (entry.dgx === 0 && entry.dgy === 0) {
            state.grid.damage[idx] += SIM.LOOP_GROOVE_DAMAGE * (1 + pressure * 0.5);
          }
        }

        segmentDeposited += totalDeposited;
        volume -= concentration > 0 ? totalDeposited / concentration : drain;
      }

      // --- Pickup: conservative transfer + accumulate into profile buckets ---
      {
        let totalPickedUp = 0;
        const pkx = centerCell.gx, pky = centerCell.gy;

        for (let ei = 0; ei < kernel.length; ei++) {
          const entry = kernel[ei];
          const nx = pkx + entry.dgx, ny = pky + entry.dgy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          const pidx = ny * GRID_SIZE + nx;

          if (state.grid.cells[pidx] <= physics.pickupThreshold) continue;

          const picked = state.grid.cells[pidx] * physics.pickupFraction * entry.pickupWeight;
          state.grid.cells[pidx] -= picked;
          totalPickedUp += picked;
          pickupAccum[entryBuckets[ei]] += picked;
          pickupAccumTotal += picked;
        }

        if (totalPickedUp > 0) {
          const loopBacteria = volume * concentration + totalPickedUp;
          volume = Math.min(1, volume + totalPickedUp * physics.pickupVolumeFactor);
          concentration = volume > 0 ? loopBacteria / volume : 0;
        }
      }
    }

    // Agar damage from heavy pressure (cumulative)
    if (pressure > 0.3) state.grid.damage[centerIdx] += pressure * SIM.PRESSURE_HEAVY * 0.01;
  }

  state.hasAnyDeposit = true;

  // Update running grid total
  let gridSum = 0;
  const cells = state.grid.cells;
  for (let i = 0, len = cells.length; i < len; i++) gridSum += cells[i];
  state.totalGridBacteria = gridSum;

  // --- Update profile: blend with pickup distribution, then laterally equalize ---
  const totalRemaining = volume * concentration;
  const alpha = pickupAccumTotal / Math.max(1e-6, totalRemaining + pickupAccumTotal);

  const newProfile = new Float32Array(LOOP_PROFILE_SIZE);
  for (let i = 0; i < LOOP_PROFILE_SIZE; i++) {
    const pickupFrac = pickupAccumTotal > 0 ? pickupAccum[i] / pickupAccumTotal : 1 / LOOP_PROFILE_SIZE;
    newProfile[i] = loopProfile[i] * (1 - alpha) + pickupFrac * alpha;
  }

  // Lateral equalization: 1D box blur — models capillary spread across loop wire.
  // Box blur preserves sum (mass conserved).
  const blurred = new Float32Array(LOOP_PROFILE_SIZE);
  for (let i = 0; i < LOOP_PROFILE_SIZE; i++) {
    const lo = Math.max(0, i - 1), hi = Math.min(LOOP_PROFILE_SIZE - 1, i + 1);
    blurred[i] = (newProfile[lo] + newProfile[i] + newProfile[hi]) / 3;
  }
  for (let i = 0; i < LOOP_PROFILE_SIZE; i++) {
    newProfile[i] = newProfile[i] * (1 - physics.equalizeRate) + blurred[i] * physics.equalizeRate;
  }

  // Normalize to sum = 1
  let pSum = 0;
  for (let i = 0; i < LOOP_PROFILE_SIZE; i++) pSum += newProfile[i];
  if (pSum > 1e-6) for (let i = 0; i < LOOP_PROFILE_SIZE; i++) newProfile[i] /= pSum;

  return { volume, concentration, temperature: temp, profile: newProfile, deposited: segmentDeposited, pickedUp: pickupAccumTotal };
}
