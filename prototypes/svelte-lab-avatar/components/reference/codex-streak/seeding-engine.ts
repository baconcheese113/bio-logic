import { hashInts, samplePoisson, sampleRange } from './deterministic-rng';
import {
  SIM,
  type FilmState,
  type FounderGrid,
  type Rect,
  type SpeciesDef,
  createFounderGrid,
  createRect,
  expandRect,
} from './streak-types';

interface SeedResult {
  founders: FounderGrid;
  dirtyRect: Rect;
}

export function seedFounderGrid(
  film: FilmState,
  species: SpeciesDef[],
  plateSeed: number,
): SeedResult {
  const founders = createFounderGrid(species.length, film.resolution);
  const dirtyRect = createRect(0, 0, film.resolution - 1, film.resolution - 1);
  fillFounderRegion(founders, film, species, plateSeed, dirtyRect);
  return { founders, dirtyRect };
}

export function seedDirtyFounderRegion(
  current: FounderGrid | null,
  film: FilmState,
  species: SpeciesDef[],
  plateSeed: number,
  dirtyRect: Rect | null,
): SeedResult {
  if (!current || current.resolution !== film.resolution || !dirtyRect) {
    return seedFounderGrid(film, species, plateSeed);
  }

  const next = cloneFounderGrid(current);
  const expanded = expandRect(dirtyRect, SIM.founderHalo, film.resolution);
  fillFounderRegion(next, film, species, plateSeed, expanded);
  return { founders: next, dirtyRect: expanded };
}

function cloneFounderGrid(founders: FounderGrid): FounderGrid {
  return {
    resolution: founders.resolution,
    counts: founders.counts.map((channel) => Uint16Array.from(channel)),
    lag: founders.lag.map((channel) => Float32Array.from(channel)),
    growthRate: founders.growthRate.map((channel) => Float32Array.from(channel)),
  };
}

function fillFounderRegion(
  founders: FounderGrid,
  film: FilmState,
  species: SpeciesDef[],
  plateSeed: number,
  region: Rect,
): void {
  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const nx = (x + 0.5) / film.resolution;
      const ny = (y + 0.5) / film.resolution;
      const plateDx = nx - 0.5;
      const plateDy = ny - 0.5;
      const insidePlate = plateDx * plateDx + plateDy * plateDy <= 0.25;
      const index = y * film.resolution + x;

      for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
        if (!insidePlate) {
          founders.counts[speciesIndex][index] = 0;
          founders.lag[speciesIndex][index] = 0;
          founders.growthRate[speciesIndex][index] = 0;
          continue;
        }

        const lambda = computeLambda(film, speciesIndex, x, y);
        if (lambda <= SIM.founderMinLambda) {
          founders.counts[speciesIndex][index] = 0;
          founders.lag[speciesIndex][index] = 0;
          founders.growthRate[speciesIndex][index] = 0;
          continue;
        }

        const baseSeed = hashInts(plateSeed, speciesIndex, x, y);
        founders.counts[speciesIndex][index] = samplePoisson(lambda, baseSeed);
        founders.lag[speciesIndex][index] = sampleRange(species[speciesIndex].lagRange[0], species[speciesIndex].lagRange[1], baseSeed ^ 0x68bc21eb);
        founders.growthRate[speciesIndex][index] = sampleRange(
          species[speciesIndex].growthRateRange[0],
          species[speciesIndex].growthRateRange[1],
          baseSeed ^ 0x02e5be93,
        );
      }
    }
  }
}

function computeLambda(
  film: FilmState,
  speciesIndex: number,
  centerX: number,
  centerY: number,
): number {
  const resolution = film.resolution;
  const radius = SIM.founderSmoothKernel;
  let total = 0;
  let count = 0;

  for (let y = Math.max(0, centerY - radius); y <= Math.min(resolution - 1, centerY + radius); y += 1) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(resolution - 1, centerX + radius); x += 1) {
      const index = y * resolution + x;
      total += film.filmMass[speciesIndex][index];
      count += 1;
    }
  }

  if (count === 0) return 0;
  const centerIndex = centerY * resolution + centerX;
  const smoothedMass = total / count;
  const wetBoost = 1 + film.depositFluid[centerIndex] * 0.8 + film.groove[centerIndex] * 0.25;
  const linearLambda = smoothedMass * SIM.founderScale * wetBoost;
  const softenedLambda = Math.sqrt(Math.max(0, linearLambda)) * SIM.founderResponseGain;
  return Math.min(SIM.founderLambdaMax, softenedLambda);
}
