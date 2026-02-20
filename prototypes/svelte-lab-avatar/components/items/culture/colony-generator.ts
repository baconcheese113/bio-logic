/**
 * Colony generation from density grid.
 * Pure functions: density grid + culture findings → colony positions.
 */

import type { DensityGrid, Colony, StreakQuality, MediaType } from './simulation-types';
import type { CultureFindings } from '../../../lib/types';
import { GRID_SIZE, SIM, COLONY_COLORS, CONTAMINANT_COLORS } from './simulation-types';

export type { StreakQuality };

// === Colony Generation from Density Grid ===

interface ColonyGenParams {
  grid: DensityGrid;
  findings: CultureFindings;
  mediaType: MediaType;
  contaminationEvents: number;
  lidExposure: number; // totalOpenSeconds from lid state
}

export function generateColoniesFromGrid(params: ColonyGenParams): Colony[] {
  const { grid, findings, mediaType, contaminationEvents } = params;

  // MacConkey selectivity: gram-positive organisms don't grow
  const targetGrows = canGrowOnMedia(findings, mediaType);
  const colonyColor = COLONY_COLORS[findings.colonyColor] ?? COLONY_COLORS.cream;

  const colonies: Colony[] = [];

  if (targetGrows) {
    // Scan density grid and place colonies based on density thresholds
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const idx = gy * GRID_SIZE + gx;
        const density = grid.cells[idx];
        const damage = grid.damage[idx];
        const killed = grid.killZone[idx];

        // No growth on damaged agar or kill zones
        if (damage > SIM.DAMAGE_THRESHOLD) continue;
        if (killed > SIM.KILL_THRESHOLD) continue;
        if (density < SIM.DENSITY_NONE) continue;

        // Convert grid coords to normalized plate coords
        const nx = (gx + 0.5) / GRID_SIZE;
        const ny = (gy + 0.5) / GRID_SIZE;

        // Check inside plate circle
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        if (dx * dx + dy * dy > 0.24) continue; // slightly inside rim

        if (density >= SIM.DENSITY_CONFLUENT) {
          // Confluent: place almost every qualifying cell (thin slightly to avoid overlap)
          if (Math.random() < SIM.COLONY_PROB_CONFLUENT) {
            colonies.push(createColony(nx, ny, density, colonyColor, findings, 'confluent'));
          }
        } else if (density >= SIM.DENSITY_DENSE) {
          if (Math.random() < SIM.COLONY_PROB_DENSE) {
            colonies.push(createColony(nx, ny, density, colonyColor, findings, 'dense'));
          }
        } else if (density >= SIM.DENSITY_ISOLATED) {
          if (Math.random() < SIM.COLONY_PROB_ISOLATED) {
            colonies.push(createColony(nx, ny, density, colonyColor, findings, 'isolated'));
          }
        }
      }
    }
  }

  // Place contaminant colonies (these grow regardless of media selectivity)
  for (let i = 0; i < contaminationEvents; i++) {
    // Random position inside plate
    let cx: number, cy: number;
    do {
      cx = 0.1 + Math.random() * 0.8;
      cy = 0.1 + Math.random() * 0.8;
    } while ((cx - 0.5) ** 2 + (cy - 0.5) ** 2 > 0.2);

    colonies.push({
      x: cx,
      y: cy,
      radius: 0.004 + Math.random() * 0.006,
      color: CONTAMINANT_COLORS[Math.floor(Math.random() * CONTAMINANT_COLORS.length)],
      hemolysisType: 'gamma',
      hemolysisRadius: 0,
      isContaminant: true,
      isIsolated: true, // contaminants are usually isolated
      densityLevel: 'isolated',
    });
  }

  // Mark isolation status based on proximity
  markIsolation(colonies);

  const confluent = colonies.filter(c => c.densityLevel === 'confluent').length;
  const dense = colonies.filter(c => c.densityLevel === 'dense').length;
  const isolated = colonies.filter(c => c.densityLevel === 'isolated').length;
  const maxDensity = Math.max(...Array.from<number>(grid.cells));
  const cellsAboveConfluent = Array.from<number>(grid.cells).filter(v => v >= SIM.DENSITY_CONFLUENT).length;
  const cellsAboveDense = Array.from<number>(grid.cells).filter(v => v >= SIM.DENSITY_DENSE).length;
  const cellsAboveIsolated = Array.from<number>(grid.cells).filter(v => v >= SIM.DENSITY_ISOLATED).length;
  console.log(`[colonies] gridMax=${maxDensity.toFixed(4)} | cells≥confluent:${cellsAboveConfluent} ≥dense:${cellsAboveDense} ≥isolated:${cellsAboveIsolated} | colonies: confluent=${confluent} dense=${dense} isolated=${isolated}`);

  return colonies;
}

function canGrowOnMedia(findings: CultureFindings, _mediaType: MediaType): boolean {
  return findings.growth;
}

function createColony(
  nx: number,
  ny: number,
  _density: number,
  color: string,
  findings: CultureFindings,
  level: Colony['densityLevel'],
): Colony {
  // Confluent/dense colonies stay close to the streak line; isolated spread more freely.
  const jitterRange = level === 'confluent' ? 0.004 : level === 'dense' ? 0.008 : 0.02;
  const jitterX = (Math.random() - 0.5) * jitterRange;
  const jitterY = (Math.random() - 0.5) * jitterRange;

  // Size scales with density level.
  // Values are in plate-fraction units; multiply by PLATE_RADIUS*2 (~360px) for canvas px.
  // Real S. aureus: ~1-2mm on 90mm plate ≈ 4-8px at 360px canvas diameter.
  let baseRadius: number;
  if (level === 'confluent') {
    baseRadius = 0.003 + Math.random() * 0.002;  // 1.1–1.9px canvas — tiny, approach full lawn
  } else if (level === 'dense') {
    baseRadius = 0.005 + Math.random() * 0.003;  // 1.9–3.0px canvas — slightly larger, still packed
  } else {
    baseRadius = 0.014 + Math.random() * 0.009;  // 5.2–8.5px canvas — large clearly individual
  }

  const hemolysisRadius = findings.hemolysis === 'gamma'
    ? 0
    : baseRadius * (findings.hemolysis === 'beta' ? 2.0 : 1.5);

  return {
    x: nx + jitterX,
    y: ny + jitterY,
    radius: baseRadius,
    color,
    hemolysisType: findings.hemolysis,
    hemolysisRadius,
    isContaminant: false,
    isIsolated: false, // will be computed by markIsolation
    densityLevel: level,
  };
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
