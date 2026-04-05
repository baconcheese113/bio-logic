import { hashInts, sampleRange } from './deterministic-rng';
import {
  SIM,
  clamp01,
  createBiomassState,
  type BiomassState,
  type FounderGrid,
  type PlateMedium,
  type SpeciesDef,
  type SpeciesMorphology,
  getSpeciesPhenotype,
} from './streak-types';

interface GrowthCache {
  cacheKey: string;
  colonies: ColonySeed[];
  checkpoints: Map<number, GrowthSimulationState>;
}

interface GrowthSimulationState {
  biomassState: BiomassState;
  radii: Float32Array;
}

interface ColonySeed {
  speciesIndex: number;
  x: number;
  y: number;
  lag: number;
  radialRate: number;
  maxRadius: number;
  biomassScale: number;
  morphology: SpeciesMorphology;
  edgeIrregularity: number;
  textureStrength: number;
  centerDepression: number;
  ridgeCount: number;
  shapePhase: number;
}

interface FrontierSample {
  openSpace: number;
  nutrientMean: number;
  wasteMean: number;
}

let cache: GrowthCache | null = null;

export function computeGrowth(
  founders: FounderGrid,
  species: SpeciesDef[],
  medium: PlateMedium,
  hours: number,
  resolution: number = SIM.defaultResolution,
): BiomassState {
  if (hours <= 0) return createBiomassState(species.length, resolution);

  const growthCache = ensureCache(founders, species, medium, resolution);
  const interval = SIM.checkpointInterval;
  const nearestCheckpointHour = Math.floor(hours / interval) * interval;
  let simulation = getOrBuildCheckpoint(growthCache, species, resolution, nearestCheckpointHour);

  simulation = stepForward(
    cloneSimulationState(simulation),
    growthCache.colonies,
    species,
    nearestCheckpointHour,
    hours,
  );

  return simulation.biomassState;
}

function ensureCache(
  founders: FounderGrid,
  species: SpeciesDef[],
  medium: PlateMedium,
  resolution: number,
): GrowthCache {
  const key = `${medium}:${species.map((entry) => entry.id).join('|')}:${foundersKey(founders)}`;
  if (!cache || cache.cacheKey !== key) {
    cache = {
      cacheKey: key,
      colonies: buildColonies(founders, species, medium, resolution),
      checkpoints: new Map(),
    };
  }

  return cache;
}

function getOrBuildCheckpoint(
  growthCache: GrowthCache,
  species: SpeciesDef[],
  resolution: number,
  targetHour: number,
): GrowthSimulationState {
  if (targetHour === 0) {
    return createSimulationState(species.length, resolution, growthCache.colonies.length);
  }

  const cached = growthCache.checkpoints.get(targetHour);
  if (cached) return cached;

  const previousHour = targetHour - SIM.checkpointInterval;
  const previous = getOrBuildCheckpoint(growthCache, species, resolution, previousHour);
  const next = stepForward(
    cloneSimulationState(previous),
    growthCache.colonies,
    species,
    previousHour,
    targetHour,
  );

  growthCache.checkpoints.set(targetHour, next);
  return next;
}

function stepForward(
  state: GrowthSimulationState,
  colonies: ColonySeed[],
  species: SpeciesDef[],
  fromHours: number,
  toHours: number,
): GrowthSimulationState {
  let time = fromHours;

  while (time < toHours - 1e-9) {
    const dt = Math.min(SIM.growthDt, toHours - time);
    time += dt;
    growStep(state, colonies, species, time, dt);
  }

  return state;
}

function growStep(
  state: GrowthSimulationState,
  colonies: ColonySeed[],
  species: SpeciesDef[],
  currentTime: number,
  dt: number,
): void {
  const previous = state.biomassState;
  const nextRadii = Float32Array.from(state.radii);

  for (let colonyIndex = 0; colonyIndex < colonies.length; colonyIndex += 1) {
    const colony = colonies[colonyIndex];
    if (currentTime <= colony.lag) continue;

    const frontier = sampleFrontier(previous, colony, nextRadii[colonyIndex]);
    const resourceFactor = computeResourceFactor(frontier.nutrientMean, frontier.wasteMean);
    const opennessFactor = 0.2 + frontier.openSpace * 0.8;
    const dRadius = colony.radialRate * resourceFactor * opennessFactor * dt;
    nextRadii[colonyIndex] = Math.min(colony.maxRadius, nextRadii[colonyIndex] + dRadius);
  }

  state.radii = nextRadii;
  state.biomassState = rasterizeColonies(previous, colonies, nextRadii, species, dt);
}

function rasterizeColonies(
  previous: BiomassState,
  colonies: ColonySeed[],
  radii: Float32Array,
  species: SpeciesDef[],
  dt: number,
): BiomassState {
  const next = createBiomassState(species.length, previous.resolution);
  const cellCount = previous.resolution * previous.resolution;

  for (let colonyIndex = 0; colonyIndex < colonies.length; colonyIndex += 1) {
    const radius = radii[colonyIndex];
    if (radius <= 0.01) continue;
    stampColony(next.biomass[colonies[colonyIndex].speciesIndex], previous.resolution, colonies[colonyIndex], radius);
  }

  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const biomass = next.biomass[speciesIndex];
    const coverage = next.coverage[speciesIndex];

    for (let index = 0; index < cellCount; index += 1) {
      biomass[index] = Math.min(species[speciesIndex].maxBiomass, biomass[index]);
      coverage[index] = smoothstep(biomass[index], SIM.coverLow, SIM.coverHigh);
      next.totalCoverage[index] = Math.min(1, next.totalCoverage[index] + coverage[index]);
    }
  }

  for (let index = 0; index < cellCount; index += 1) {
    let nutrientActivity = 0;
    let wasteLevel = previous.waste[index];

    for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
      const biomassDelta = Math.max(0, next.biomass[speciesIndex][index] - previous.biomass[speciesIndex][index]);
      const maintenance = next.coverage[speciesIndex][index] * SIM.colonyMaintenanceRate * dt;
      const activity = biomassDelta + maintenance;
      nutrientActivity += activity;
      wasteLevel += activity * species[speciesIndex].wasteRate * SIM.colonyWasteYield;
    }

    next.nutrient[index] = Math.max(0, previous.nutrient[index] - nutrientActivity * SIM.nutrientConsumption);
    next.waste[index] = wasteLevel;
  }

  return next;
}

function stampColony(
  channel: Float32Array,
  resolution: number,
  colony: ColonySeed,
  radius: number,
): void {
  const edgeSoftness = SIM.colonyStampSoftness;
  const reach = radius + edgeSoftness;
  const minX = Math.max(0, Math.floor(colony.x - reach));
  const maxX = Math.min(resolution - 1, Math.ceil(colony.x + reach));
  const minY = Math.max(0, Math.floor(colony.y - reach));
  const maxY = Math.min(resolution - 1, Math.ceil(colony.y + reach));
  const growthFraction = clamp01(radius / Math.max(radius, colony.maxRadius));
  const amplitude =
    colony.biomassScale *
    morphologyAmplitude(colony.morphology) *
    (0.28 + 0.72 * growthFraction);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - colony.x;
      const dy = y + 0.5 - colony.y;
      const distance = Math.hypot(dx, dy);
      if (distance > reach || !isInsidePlateCell(x, y, resolution)) continue;

      const angle = Math.atan2(dy, dx);
      const edgeWave = 0.5 + 0.5 * Math.sin(angle * colony.ridgeCount + colony.shapePhase);
      const effectiveRadius =
        radius *
        (1 + colony.edgeIrregularity * ((edgeWave - 0.5) * 0.44));
      const normalized = distance / Math.max(0.75, effectiveRadius);
      const core = clamp01(1 - normalized);
      const skirt = clamp01((reach - distance) / Math.max(0.001, edgeSoftness));
      const centerMask = clamp01(1 - normalized / 0.55);
      const centerDip = colony.centerDepression * growthFraction * centerMask * centerMask;
      const rimBoost =
        clamp01(1 - Math.abs(normalized - 0.72) / 0.18) *
        colony.centerDepression *
        growthFraction *
        0.34;
      const grainNoise = pseudoNoise2d(
        (x + 0.5) * 0.82 + colony.shapePhase,
        (y + 0.5) * 0.82 - colony.shapePhase,
      );
      const grain =
        1 -
        colony.textureStrength *
          (0.18 + Math.max(0, grainNoise - 0.45) * 0.28);
      const colonyBody = Math.max(0, core * core * (1 - centerDip) + rimBoost);
      const contribution = amplitude * Math.max(colonyBody * grain, skirt * 0.18);
      if (contribution <= 1e-6) continue;

      channel[y * resolution + x] += contribution;
    }
  }
}

function sampleFrontier(
  state: BiomassState,
  colony: ColonySeed,
  radius: number,
): FrontierSample {
  const resolution = state.resolution;
  const sampleRadius = Math.max(0.85, radius + 0.65);
  let openSpace = 0;
  let nutrientMean = 0;
  let wasteMean = 0;
  let sampleCount = 0;

  for (let sampleIndex = 0; sampleIndex < SIM.colonyFrontierSamples; sampleIndex += 1) {
    const angle = (sampleIndex / SIM.colonyFrontierSamples) * Math.PI * 2;
    const sampleX = colony.x + Math.cos(angle) * sampleRadius;
    const sampleY = colony.y + Math.sin(angle) * sampleRadius;
    const cellX = Math.floor(sampleX);
    const cellY = Math.floor(sampleY);

    if (
      cellX < 0 ||
      cellX >= resolution ||
      cellY < 0 ||
      cellY >= resolution ||
      !isInsidePlateCell(cellX, cellY, resolution)
    ) {
      continue;
    }

    const cellIndex = cellY * resolution + cellX;
    openSpace += clamp01(1 - state.totalCoverage[cellIndex]);
    nutrientMean += state.nutrient[cellIndex];
    wasteMean += state.waste[cellIndex];
    sampleCount += 1;
  }

  if (sampleCount === 0) {
    const centerX = Math.max(0, Math.min(resolution - 1, Math.floor(colony.x)));
    const centerY = Math.max(0, Math.min(resolution - 1, Math.floor(colony.y)));
    const centerIndex = centerY * resolution + centerX;
    return {
      openSpace: clamp01(1 - state.totalCoverage[centerIndex]),
      nutrientMean: state.nutrient[centerIndex],
      wasteMean: state.waste[centerIndex],
    };
  }

  return {
    openSpace: openSpace / sampleCount,
    nutrientMean: nutrientMean / sampleCount,
    wasteMean: wasteMean / sampleCount,
  };
}

function buildColonies(
  founders: FounderGrid,
  species: SpeciesDef[],
  medium: PlateMedium,
  resolution: number,
): ColonySeed[] {
  const colonies: ColonySeed[] = [];

  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const speciesDef = species[speciesIndex];
    const phenotype = getSpeciesPhenotype(speciesDef, medium);
    if (!phenotype) continue;
    const founderCounts = founders.counts[speciesIndex];
    const founderLag = founders.lag[speciesIndex];
    const founderRate = founders.growthRate[speciesIndex];
    const morphologyRadius = getMorphologyRadiusMultiplier(phenotype.morphology);
    const stampProfile = getMorphologyStampProfile(phenotype.morphology);

    for (let index = 0; index < founderCounts.length; index += 1) {
      const count = founderCounts[index];
      if (count === 0) continue;

      const baseX = index % resolution;
      const baseY = Math.floor(index / resolution);

      for (let founderIndex = 0; founderIndex < count; founderIndex += 1) {
        const seed = hashInts(
          speciesIndex,
          index,
          founderIndex,
          count,
          Math.round(founderLag[index] * 1000),
          Math.round(founderRate[index] * 1000),
        );
        const angle = sampleRange(0, Math.PI * 2, seed ^ 0x2a3b1c4d);
        const jitterRadius = sampleRange(0.05, SIM.colonyJitterRadius, seed ^ 0x8d1f3a61);
        const x = baseX + 0.5 + Math.cos(angle) * jitterRadius;
        const y = baseY + 0.5 + Math.sin(angle) * jitterRadius;

        if (!isInsidePlatePoint(x, y, resolution)) continue;

        const maxRadius =
          sampleRange(
            phenotype.isolatedRadius[0] * resolution,
            phenotype.isolatedRadius[1] * resolution,
            seed ^ 0x31d7f12b,
          ) * morphologyRadius;
        const radialRate =
          Math.max(0.01, maxRadius * founderRate[index] * SIM.colonyRadialRateScale) *
          sampleRange(0.9, 1.12, seed ^ 0x5bc17a9d);

        colonies.push({
          speciesIndex,
          x,
          y,
          lag: founderLag[index],
          radialRate,
          maxRadius,
          biomassScale: sampleRange(0.88, 1.08, seed ^ 0x6c8f2d11),
          morphology: phenotype.morphology,
          edgeIrregularity:
            stampProfile.edgeIrregularity *
            sampleRange(0.86, 1.16, seed ^ 0x71bc0f53),
          textureStrength:
            stampProfile.textureStrength *
            sampleRange(0.88, 1.14, seed ^ 0x0bc142f7),
          centerDepression:
            stampProfile.centerDepression *
            sampleRange(0.92, 1.08, seed ^ 0x5f2a3bc1),
          ridgeCount: Math.max(
            2,
            Math.round(
              sampleRange(
                stampProfile.ridgeCount - 0.75,
                stampProfile.ridgeCount + 0.75,
                seed ^ 0x4a2fb191,
              ),
            ),
          ),
          shapePhase: sampleRange(0, Math.PI * 2, seed ^ 0x9a6c32bf),
        });
      }
    }
  }

  return colonies;
}

function foundersKey(founders: FounderGrid): string {
  let hash = 2166136261 >>> 0;

  for (let speciesIndex = 0; speciesIndex < founders.counts.length; speciesIndex += 1) {
    const counts = founders.counts[speciesIndex];
    const lag = founders.lag[speciesIndex];
    const growthRate = founders.growthRate[speciesIndex];

    for (let index = 0; index < counts.length; index += 1) {
      hash ^= counts[index] >>> 0;
      hash = Math.imul(hash, 16777619) >>> 0;
      hash ^= Math.round(lag[index] * 100) >>> 0;
      hash = Math.imul(hash, 16777619) >>> 0;
      hash ^= Math.round(growthRate[index] * 1000) >>> 0;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
  }

  return hash.toString(16);
}

function getMorphologyRadiusMultiplier(morphology: SpeciesMorphology | undefined): number {
  switch (morphology) {
    case 'spreading':
      return 1.25;
    case 'mucoid':
      return 1.12;
    case 'rough':
      return 0.92;
    case 'draughtsman':
      return 0.88;
    default:
      return 1;
  }
}

function morphologyAmplitude(morphology: SpeciesMorphology): number {
  switch (morphology) {
    case 'mucoid':
      return 1.08;
    case 'rough':
      return 0.92;
    case 'draughtsman':
      return 0.9;
    default:
      return 1;
  }
}

function getMorphologyStampProfile(
  morphology: SpeciesMorphology,
): {
  edgeIrregularity: number;
  textureStrength: number;
  centerDepression: number;
  ridgeCount: number;
} {
  switch (morphology) {
    case 'rough':
      return {
        edgeIrregularity: 0.26,
        textureStrength: 0.22,
        centerDepression: 0.04,
        ridgeCount: 5,
      };
    case 'mucoid':
      return {
        edgeIrregularity: 0.05,
        textureStrength: 0.03,
        centerDepression: 0,
        ridgeCount: 3,
      };
    case 'draughtsman':
      return {
        edgeIrregularity: 0.14,
        textureStrength: 0.1,
        centerDepression: 0.46,
        ridgeCount: 4,
      };
    case 'spreading':
      return {
        edgeIrregularity: 0.18,
        textureStrength: 0.08,
        centerDepression: 0,
        ridgeCount: 6,
      };
    case 'smooth':
    default:
      return {
        edgeIrregularity: 0.07,
        textureStrength: 0.05,
        centerDepression: 0,
        ridgeCount: 3,
      };
  }
}

function pseudoNoise2d(x: number, y: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function createSimulationState(
  speciesCount: number,
  resolution: number,
  colonyCount: number,
): GrowthSimulationState {
  return {
    biomassState: createBiomassState(speciesCount, resolution),
    radii: new Float32Array(colonyCount),
  };
}

function cloneSimulationState(state: GrowthSimulationState): GrowthSimulationState {
  return {
    biomassState: cloneBiomassState(state.biomassState),
    radii: Float32Array.from(state.radii),
  };
}

function cloneBiomassState(state: BiomassState): BiomassState {
  return {
    resolution: state.resolution,
    biomass: state.biomass.map((channel) => Float32Array.from(channel)),
    coverage: state.coverage.map((channel) => Float32Array.from(channel)),
    totalCoverage: Float32Array.from(state.totalCoverage),
    nutrient: Float32Array.from(state.nutrient),
    waste: Float32Array.from(state.waste),
  };
}

function computeResourceFactor(nutrient: number, waste: number): number {
  const nutrientFactor = nutrient / (nutrient + SIM.kNutrient);
  const wasteFactor = 1 / (1 + waste * SIM.kWaste);
  return nutrientFactor * wasteFactor;
}

function smoothstep(value: number, edge0: number, edge1: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function isInsidePlateCell(x: number, y: number, resolution: number): boolean {
  return isInsidePlatePoint(x + 0.5, y + 0.5, resolution);
}

function isInsidePlatePoint(x: number, y: number, resolution: number): boolean {
  const nx = x / resolution - 0.5;
  const ny = y / resolution - 0.5;
  return nx * nx + ny * ny <= 0.25;
}
