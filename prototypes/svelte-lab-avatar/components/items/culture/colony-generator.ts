/**
 * Colony generation from density grid.
 * Pure functions: density grid + culture findings → colony positions.
 */

import type { DensityGrid, Colony, ColonySeed, StreakQuality, MediaType } from './simulation-types';
import type { CultureFindings } from '../../../lib/types';
import { GRID_SIZE, SIM, COLONY_COLORS, CONTAMINANT_COLORS } from './simulation-types';

// === Colony Generation from Density Grid ===

interface ColonyGenParams {
  grid: DensityGrid;
  findings: CultureFindings;
  mediaType: MediaType;
  contaminationEvents: number;
  lidExposure: number; // totalOpenSeconds from lid state
}

// Seeding constants — kept together to make tuning easy.
const LAMBDA_SCALE = 50;  // density 0.04 → λ=2; density 0.20 → λ=10
const LAMBDA_MAX   = 10;  // cap to bound total seed count per cell
const CROWDING_K   = 0.15; // r_max suppression factor per unit λ

/** Smooth λ(x,y) from 3×3 average density × LAMBDA_SCALE.
 * Replaces the hard dense/isolated threshold split — λ now varies continuously
 * so seed count and r_cap change gradually across the streak gradient. */
function computeSmoothedLambda(grid: DensityGrid): Float32Array {
  const out = new Float32Array(GRID_SIZE * GRID_SIZE);
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      let sum = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = gy + dy, nx = gx + dx;
          if (ny < 0 || ny >= GRID_SIZE || nx < 0 || nx >= GRID_SIZE) continue;
          sum += grid.cells[ny * GRID_SIZE + nx];
          count++;
        }
      }
      out[gy * GRID_SIZE + gx] = Math.min(LAMBDA_MAX, (sum / count) * LAMBDA_SCALE);
    }
  }
  return out;
}

/**
 * Generate stable seed positions from the density grid.
 * Seeds are time-independent; call computeColoniesAtTime(seeds, hours) to get
 * Colony[] at any incubation duration. This separation makes real-time growth
 * trivial: just increment hours and re-derive colonies.
 *
 * Dense tier: many seeds with small r_max placed near grid spacing.
 *   applyCollisionLimitedRadius() will pack them into a microcolony grid.
 * Isolated tier: few seeds with organism-specific r_max, well separated.
 * Confluent tier: skipped — the lawn OffscreenCanvas renders those regions.
 */
export function generateSeedsFromGrid(params: ColonyGenParams): ColonySeed[] {
  const { grid, findings, mediaType, contaminationEvents } = params;
  const targetGrows = canGrowOnMedia(findings, mediaType);
  const colonyColor = COLONY_COLORS[findings.colonyColor] ?? COLONY_COLORS.cream;
  const [iMin, iMax] = findings.isolatedRadiusRange ?? [0.014, 0.023];

  const seeds: ColonySeed[] = [];
  const lambdaField = computeSmoothedLambda(grid);
  // midR: typical colony radius at low density (shrinks as lambda rises).
  const midR = (iMin + iMax) / 2;

  if (targetGrows) {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const idx = gy * GRID_SIZE + gx;
        if (grid.damage[idx] > SIM.DAMAGE_THRESHOLD) continue;
        if (grid.killZone[idx] > SIM.KILL_THRESHOLD) continue;

        // λ varies continuously from 0 (empty) to LAMBDA_MAX (saturated streak).
        // No hard dense/isolated split — r_cap and seed count both depend smoothly on λ.
        const lambda = lambdaField[idx];
        if (lambda < 0.05) continue;

        const n = poissonSample(lambda);
        if (n === 0) continue;

        // densityLevel drives rendering only; it no longer gates seed count.
        const densityLevel: Colony['densityLevel'] = lambda > 2 ? 'dense' : 'isolated';
        // r_base = midR / (1 + CROWDING_K × λ): large in sparse zones, small in dense zones.
        // At λ=1: ÷1.15. At λ=6: ÷1.9. At λ=10: ÷2.5.
        const r_base = midR / (1 + CROWDING_K * lambda);

        const cellLeft = gx / GRID_SIZE;
        const cellTop  = gy / GRID_SIZE;
        const cellSize = 1 / GRID_SIZE;

        for (let s = 0; s < n; s++) {
          const sx = cellLeft + Math.random() * cellSize;
          const sy = cellTop  + Math.random() * cellSize;
          const pdx = sx - 0.5, pdy = sy - 0.5;
          if (pdx * pdx + pdy * pdy > 0.24) continue;

          const r_max = r_base * (0.75 + Math.random() * 0.5);
          seeds.push({
            x: sx, y: sy, r_max,
            lag: 2 + Math.random() * 6,
            growthRate: 0.18 + Math.random() * 0.10,
            densityLevel,
            color: colonyColor,
            hemolysisType: findings.hemolysis,
            isContaminant: false,
          });
        }
      }
    }
  }

  for (let i = 0; i < contaminationEvents; i++) {
    let cx: number, cy: number;
    do {
      cx = 0.1 + Math.random() * 0.8;
      cy = 0.1 + Math.random() * 0.8;
    } while ((cx - 0.5) ** 2 + (cy - 0.5) ** 2 > 0.2);

    seeds.push({
      x: cx, y: cy,
      r_max: 0.004 + Math.random() * 0.006,
      lag: 1 + Math.random() * 3,
      growthRate: 0.20 + Math.random() * 0.10,
      densityLevel: 'isolated',
      color: CONTAMINANT_COLORS[Math.floor(Math.random() * CONTAMINANT_COLORS.length)],
      hemolysisType: 'gamma',
      isContaminant: true,
    });
  }

  const filtered = applyHardCoreFilterSeeds(seeds);

  const dense = filtered.filter(s => s.densityLevel === 'dense').length;
  const isolated = filtered.filter(s => !s.isContaminant && s.densityLevel === 'isolated').length;
  const maxDensity = Math.max(...Array.from<number>(grid.cells));
  console.log(`[seeds] gridMax=${maxDensity.toFixed(4)} | dense:${dense} iso:${isolated}`);

  return filtered;
}

/**
 * Compute Colony[] at a given incubation time from stable seeds.
 * Call this inside a $derived to make incubation time-reactive with zero extra work.
 *
 * Growth follows a logistic curve:
 *   ~0.1 at 8h (just visible), ~0.5 at 17h, ~0.85 at 24h, ~0.97 at 36h
 */
export function computeColoniesAtTime(seeds: ColonySeed[], hours: number): Colony[] {
  // Per-seed logistic growth with individual lag phase and rate.
  // r(t) = r_max × 1 / (1 + exp(-k × (t - lag - midpoint)))
  // midpoint offset of 8h gives ~50% size at (lag + 8h), matches typical 18–24h incubation.
  const colonies: Colony[] = seeds.map(s => {
    const t = Math.max(0, hours - s.lag);
    const gf = 1 / (1 + Math.exp(-s.growthRate * (t - 8)));
    const r = Math.max(0.001, s.r_max * gf);
    // Coverage radius for dense seeds: uncapped growth × 4× spread.
    // At full growth, this disc covers the territory between neighboring seeds,
    // merging the B(t) field into a continuous lawn by ~20-24h.
    const coverageRadius = s.densityLevel === 'dense' ? s.r_max * gf * 4.0 : r;
    const hemolysisRadius = s.hemolysisType === 'gamma' ? 0 : r * (s.hemolysisType === 'beta' ? 2.0 : 1.5);
    return {
      x: s.x, y: s.y,
      radius: r,
      coverageRadius,
      growthFactor: gf,
      color: s.color,
      hemolysisType: s.hemolysisType,
      hemolysisRadius,
      isContaminant: s.isContaminant,
      isIsolated: false,
      densityLevel: s.densityLevel,
    };
  });
  applyCollisionLimitedRadius(colonies);
  markIsolation(colonies);
  return colonies;
}

function canGrowOnMedia(findings: CultureFindings, _mediaType: MediaType): boolean {
  return findings.growth;
}

/** Sample from a Poisson distribution using Knuth's algorithm (good for small λ). */
function poissonSample(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

/** Greedy hard-core filter on seeds using r_max as notional radius.
 * Dense seeds allow very tight packing (clearance=0.001) so they form a
 * microcolony grid. Isolated seeds enforce realistic separation. */
function applyHardCoreFilterSeeds(seeds: ColonySeed[]): ColonySeed[] {
  const accepted: ColonySeed[] = [];
  for (const s of seeds) {
    const clearance = s.densityLevel === 'dense' ? 0.001 : 0.014;
    let tooClose = false;
    for (const other of accepted) {
      const dx = s.x - other.x;
      const dy = s.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < s.r_max + other.r_max + clearance) { tooClose = true; break; }
    }
    if (!tooClose) accepted.push(s);
  }
  return accepted;
}

/** Cap each colony radius using surface gap to k=6 nearest neighbors.
 * Returns variable sizes in dense regions (Voronoi-like territory) rather than
 * uniform circles from nearest-only clamping. */
function applyCollisionLimitedRadius(colonies: Colony[]): void {
  const K = 6; // neighbors to check
  for (let i = 0; i < colonies.length; i++) {
    const ci = colonies[i];
    // Dense colonies can be tiny (sub-pixel) — their lawn overlay carries the visual.
    // Isolated colonies need a visible floor so players can click on them.
    const MIN_RADIUS = ci.densityLevel === 'dense' ? 0.001 : 0.003;
    // Collect k nearest gap values
    const gaps: number[] = [];
    for (let j = 0; j < colonies.length; j++) {
      if (i === j) continue;
      const cj = colonies[j];
      const dx = ci.x - cj.x;
      const dy = ci.y - cj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      gaps.push(dist - cj.radius);
      if (gaps.length > K) {
        // Keep only K smallest — insertion sort trick
        gaps.sort((a, b) => a - b);
        gaps.length = K;
      }
    }
    if (gaps.length > 0) {
      // Use the tightest gap among k-nearest to limit radius
      const tightest = gaps[0];
      ci.radius = Math.max(MIN_RADIUS, Math.min(ci.radius, tightest * 0.5));
      if (ci.hemolysisRadius > 0) {
        const scale = ci.hemolysisType === 'beta' ? 2.0 : 1.5;
        ci.hemolysisRadius = ci.radius * scale;
      }
    }
  }
}

/** Mark colonies as isolated if they have no neighbors within a threshold distance */
function markIsolation(colonies: Colony[]) {
  const ISOLATION_DIST = 0.04; // minimum distance to be considered isolated
  const ISOLATION_DIST_SQ = ISOLATION_DIST * ISOLATION_DIST;

  for (let i = 0; i < colonies.length; i++) {
    const c = colonies[i];
    if (c.densityLevel === 'confluent') {
      c.isIsolated = false;
      continue;
    }

    let isolated = true;
    for (let j = 0; j < colonies.length; j++) {
      if (i === j) continue;
      const other = colonies[j];
      const dx = c.x - other.x;
      const dy = c.y - other.y;
      if (dx * dx + dy * dy < ISOLATION_DIST_SQ) {
        isolated = false;
        break;
      }
    }
    c.isIsolated = isolated;
  }
}

// === Quality Scoring from Density Grid ===

export function computeGridQuality(
  grid: DensityGrid,
  colonies: Colony[],
): StreakQuality {
  let damagedCells = 0;
  let killZoneCells = 0;
  let plateCells = 0;

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const nx = (gx + 0.5) / GRID_SIZE;
      const ny = (gy + 0.5) / GRID_SIZE;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      if (dx * dx + dy * dy > 0.25) continue;

      plateCells++;
      const idx = gy * GRID_SIZE + gx;
      if (grid.damage[idx] > SIM.DAMAGE_THRESHOLD) damagedCells++;
      if (grid.killZone[idx] > SIM.KILL_THRESHOLD) killZoneCells++;
    }
  }

  const isolatedCount = colonies.filter(c => c.isIsolated && !c.isContaminant).length;
  const contaminantCount = colonies.filter(c => c.isContaminant).length;
  const agarDamagePercent = plateCells > 0 ? (damagedCells / plateCells) * 100 : 0;
  const killZonePercent = plateCells > 0 ? (killZoneCells / plateCells) * 100 : 0;

  // Score: primarily based on isolated colonies
  let score = 0;
  if (isolatedCount >= 10) score += 50;
  else if (isolatedCount >= 5) score += 40;
  else if (isolatedCount >= 2) score += 25;
  else if (isolatedCount >= 1) score += 10;

  // Penalty for contamination
  score -= Math.min(20, contaminantCount * 4);

  // Penalty for agar damage
  score -= Math.min(15, Math.round(agarDamagePercent * 3));

  // Penalty for kill zones
  score -= Math.min(10, Math.round(killZonePercent * 2));

  // Bonus for clean technique (low contamination + good isolation)
  if (contaminantCount === 0 && isolatedCount >= 5) score += 15;

  score = Math.max(0, Math.min(100, score));

  let overallGrade: StreakQuality['overallGrade'];
  if (score >= 80) overallGrade = 'excellent';
  else if (score >= 60) overallGrade = 'good';
  else if (score >= 40) overallGrade = 'fair';
  else if (score > 0) overallGrade = 'poor';
  else overallGrade = 'none';

  return {
    isolatedColonyCount: isolatedCount,
    contaminantCount,
    agarDamagePercent: Math.round(agarDamagePercent * 10) / 10,
    killZonePercent: Math.round(killZonePercent * 10) / 10,
    overallGrade,
    score,
  };
}
