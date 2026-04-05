import type {
  CultureFindings,
  CulturePlateMeta,
  MediaType,
  SampleMeta,
} from '../../../lib/types';
import { hashInts, sampleRange } from '../../reference/codex-streak/deterministic-rng';
import {
  DEFAULT_MEDIUM,
  DEFAULT_SPECIES,
  clamp01,
  createPlateSession,
  getSpeciesPhenotype,
  type FounderGrid,
  type PlateMedium,
  type SpeciesDef,
} from '../../reference/codex-streak/streak-types';

const CULTURE_ORGANISM_MAP: Record<string, string> = {
  'staphylococcus-aureus': 'staph-aureus',
  'streptococcus-pyogenes': 'strep-pyogenes',
  'streptococcus-pneumoniae': 'strep-pneumoniae',
  'escherichia-coli': 'e-coli',
  'klebsiella-pneumoniae': 'klebsiella-pneumoniae',
};

const COLONY_COLOR_HEX: Record<CultureFindings['colonyColor'], string> = {
  golden: '#d3ab56',
  white: '#ece6d8',
  gray: '#c9c1b6',
  green: '#9f9a79',
  cream: '#e8ddc9',
  mucoid: '#eadfc8',
  pink: '#e6a0bc',
  colorless: '#d9d1c8',
};

const ENVIRONMENTAL_CONTAMINANT_ID = 'environmental-contaminant';

const ENVIRONMENTAL_CONTAMINANT: SpeciesDef = {
  id: ENVIRONMENTAL_CONTAMINANT_ID,
  name: 'Environmental Flora',
  color: '#d9d3c3',
  lagRange: [4, 8],
  growthRateRange: [0.1, 0.18],
  maxBiomass: 0.74,
  wasteRate: 0.12,
  media: {
    'blood-agar': {
      colonyColorLabel: 'gray-white',
      colonyColor: '#c8c1b6',
      renderColor: '#d2cbc0',
      opacity: 0.74,
      isolatedRadius: [0.005, 0.01],
      hemolysisType: 'gamma',
      hemolysisRatio: 0,
      morphology: 'rough',
      roughness: 0.7,
      sheen: 0.2,
      differentialLabel: null,
    },
    'nutrient-agar': {
      colonyColorLabel: 'gray-white',
      colonyColor: '#cec6b9',
      renderColor: '#d8cfbf',
      opacity: 0.72,
      isolatedRadius: [0.005, 0.01],
      hemolysisType: 'gamma',
      hemolysisRatio: 0,
      morphology: 'rough',
      roughness: 0.68,
      sheen: 0.18,
      differentialLabel: null,
    },
    macconkey: {
      colonyColorLabel: 'colorless',
      colonyColor: '#d8d1c7',
      renderColor: '#e2d9ce',
      opacity: 0.7,
      isolatedRadius: [0.004, 0.009],
      hemolysisType: 'gamma',
      hemolysisRatio: 0,
      morphology: 'rough',
      roughness: 0.65,
      sheen: 0.14,
      differentialLabel: 'Sparse, non-fermenting contaminant',
    },
  },
};

export interface LoopCulturePayload {
  speciesConfig: SpeciesDef[];
  speciesLoads: number[];
  sourceLabel: string;
}

export const CULTURE_TICKS_PER_HOUR = 36000;

export function cultureMediumForMediaType(mediaType: MediaType | null): PlateMedium {
  if (mediaType === 'blood-agar' || mediaType === 'nutrient-agar' || mediaType === 'macconkey') {
    return mediaType;
  }
  return DEFAULT_MEDIUM;
}

export function createCultureMeta(
  medium: PlateMedium,
  speciesConfig: SpeciesDef[],
): CulturePlateMeta {
  const session = createPlateSession(cloneSpeciesConfig(speciesConfig), undefined, medium);
  return {
    kind: 'culture',
    phase: 'ready',
    medium,
    plateSeed: session.plateSeed,
    speciesConfig: session.speciesConfig,
    actionLog: [],
    contaminationEvents: 0,
    totalOpenSeconds: 0,
    incubationStartedAtTick: null,
  };
}

export function cloneSpeciesConfig(speciesConfig: readonly SpeciesDef[]): SpeciesDef[] {
  return speciesConfig.map((species) => ({
    ...species,
    media: { ...species.media },
  }));
}

export function buildLoopPayloadFromSampleMeta(sampleMeta: SampleMeta | undefined): LoopCulturePayload {
  const primarySpecies = resolveSampleSpecies(sampleMeta);
  const speciesConfig = [primarySpecies];
  return {
    speciesConfig,
    speciesLoads: [1],
    sourceLabel: primarySpecies.name,
  };
}

export function ensureContaminantSpecies(speciesConfig: readonly SpeciesDef[]): SpeciesDef[] {
  if (speciesConfig.some((species) => species.id === ENVIRONMENTAL_CONTAMINANT_ID)) {
    return cloneSpeciesConfig(speciesConfig);
  }
  return [...cloneSpeciesConfig(speciesConfig), cloneSpeciesConfig([ENVIRONMENTAL_CONTAMINANT])[0]];
}

export function incubationHoursFromTicks(currentTick: number, startedAtTick: number | null): number {
  if (startedAtTick === null) return 0;
  return Math.max(0, (currentTick - startedAtTick) / CULTURE_TICKS_PER_HOUR);
}

export function startCultureIncubation(meta: CulturePlateMeta, currentTick: number, hours = 24): void {
  const targetHours = Math.max(0, hours);
  meta.incubationStartedAtTick = currentTick - Math.round(targetHours * CULTURE_TICKS_PER_HOUR);
  meta.phase = targetHours >= 18 ? 'grown' : 'incubating';
}

export function contaminationBurden(contaminationEvents: number, totalOpenSeconds: number): number {
  return clamp01(contaminationEvents * 0.035 + totalOpenSeconds * 0.015);
}

export function applyContaminationToFounders(
  founders: FounderGrid,
  speciesConfig: readonly SpeciesDef[],
  contaminationEvents: number,
  totalOpenSeconds: number,
  plateSeed: number,
): FounderGrid {
  const contaminantIndex = speciesConfig.findIndex((species) => species.id === ENVIRONMENTAL_CONTAMINANT_ID);
  if (contaminantIndex < 0) return founders;

  const burden = contaminationBurden(contaminationEvents, totalOpenSeconds);
  if (burden <= 0.02) return founders;

  const next = cloneFounderGrid(founders);
  const channel = next.counts[contaminantIndex];
  const lagChannel = next.lag[contaminantIndex];
  const rateChannel = next.growthRate[contaminantIndex];
  const resolution = founders.resolution;
  const scatterCount = Math.max(1, Math.round(burden * 220));
  const contaminant = speciesConfig[contaminantIndex];

  for (let sampleIndex = 0; sampleIndex < scatterCount; sampleIndex += 1) {
    const baseSeed = hashInts(plateSeed, contaminationEvents, sampleIndex, Math.round(totalOpenSeconds * 10));
    const point = randomPlateCell(baseSeed, resolution);
    if (!point) continue;

    const index = point.y * resolution + point.x;
    channel[index] = Math.min(65535, channel[index] + 1 + (baseSeed & 1));
    lagChannel[index] = sampleRange(contaminant.lagRange[0], contaminant.lagRange[1], baseSeed ^ 0x63c5a1fd);
    rateChannel[index] = sampleRange(contaminant.growthRateRange[0], contaminant.growthRateRange[1], baseSeed ^ 0x1d5b79ef);
  }

  return next;
}

export function buildPickupLoadsFromBiomass(
  speciesConfig: readonly SpeciesDef[],
  biomassChannels: readonly Float32Array[],
  resolution: number,
  points: readonly { x: number; y: number }[],
): number[] {
  const totals = Array.from({ length: speciesConfig.length }, () => 0);

  for (const point of points) {
    const cell = pointToPlateCell(point.x, point.y, resolution);
    if (!cell) continue;

    for (let speciesIndex = 0; speciesIndex < biomassChannels.length; speciesIndex += 1) {
      totals[speciesIndex] += biomassChannels[speciesIndex][cell];
    }
  }

  const totalMass = totals.reduce((sum, value) => sum + value, 0);
  if (totalMass <= 0.000001) {
    return Array.from({ length: speciesConfig.length }, () => 0);
  }

  return totals.map((value) => value / totalMass);
}

function resolveSampleSpecies(sampleMeta: SampleMeta | undefined): SpeciesDef {
  const mappedId = sampleMeta?.organismId ? CULTURE_ORGANISM_MAP[sampleMeta.organismId] : undefined;
  const preset = mappedId ? DEFAULT_SPECIES.find((species) => species.id === mappedId) : undefined;
  if (preset) return cloneSpeciesConfig([preset])[0];
  if (sampleMeta?.cultureFindings) return createProxySpeciesFromFindings(sampleMeta);
  return cloneSpeciesConfig([DEFAULT_SPECIES[0]])[0];
}

function createProxySpeciesFromFindings(sampleMeta: SampleMeta): SpeciesDef {
  const findings = sampleMeta.cultureFindings;
  if (!findings) return cloneSpeciesConfig([DEFAULT_SPECIES[0]])[0];

  const colonyColor = COLONY_COLOR_HEX[findings.colonyColor];
  const isolatedRadius = findings.isolatedRadiusRange ?? [0.012, 0.022];
  const likelyMacGrowth = findings.gramType === 'negative';
  const morphology =
    findings.colonyColor === 'mucoid'
      ? 'mucoid'
      : findings.hemolysis === 'alpha'
        ? 'draughtsman'
        : 'smooth';
  const roughness = morphology === 'mucoid' ? 0.26 : morphology === 'draughtsman' ? 0.68 : 0.42;
  const sheen = morphology === 'mucoid' ? 0.72 : morphology === 'draughtsman' ? 0.18 : 0.46;
  const label = sampleMeta.organismId?.split('-').map(capitalizeWord).join(' ') ?? 'Unknown culture';

  const species: SpeciesDef = {
    id: sampleMeta.organismId ?? 'unknown-culture',
    name: label,
    color: colonyColor,
    lagRange: [2, 5],
    growthRateRange: [0.16, 0.28],
    maxBiomass: 1,
    wasteRate: 0.1,
    media: {
      'blood-agar': {
        colonyColorLabel: findings.colonyColor,
        colonyColor,
        renderColor: colonyColor,
        opacity: 0.86,
        isolatedRadius,
        hemolysisType: findings.hemolysis,
        hemolysisRatio: findings.hemolysis === 'beta' ? 1.5 : findings.hemolysis === 'alpha' ? 1.1 : 0,
        morphology,
        roughness,
        sheen,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: findings.colonyColor,
        colonyColor,
        renderColor: colonyColor,
        opacity: 0.84,
        isolatedRadius,
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology,
        roughness,
        sheen: Math.max(0.14, sheen - 0.06),
        differentialLabel: null,
      },
      macconkey: likelyMacGrowth
        ? {
            colonyColorLabel: findings.lactoseFermenter ? 'pink' : 'colorless',
            colonyColor: findings.lactoseFermenter ? COLONY_COLOR_HEX.pink : COLONY_COLOR_HEX.colorless,
            renderColor: findings.lactoseFermenter ? '#efb3c8' : '#e1d8ce',
            opacity: 0.86,
            isolatedRadius,
            hemolysisType: 'gamma',
            hemolysisRatio: 0,
            morphology: findings.colonyColor === 'mucoid' ? 'mucoid' : 'smooth',
            roughness: findings.colonyColor === 'mucoid' ? 0.26 : 0.4,
            sheen: findings.colonyColor === 'mucoid' ? 0.72 : 0.34,
            differentialLabel: findings.lactoseFermenter ? 'Pink, lactose fermenter' : 'Colorless, non-fermenter',
          }
        : undefined,
    },
  };

  return species;
}

function randomPlateCell(seed: number, resolution: number): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const attemptSeed = hashInts(seed, attempt, resolution);
    const x = Math.floor(((attemptSeed >>> 8) & 0xffff) / 0xffff * resolution);
    const y = Math.floor((((attemptSeed >>> 16) ^ attemptSeed) & 0xffff) / 0xffff * resolution);
    const nx = (x + 0.5) / resolution - 0.5;
    const ny = (y + 0.5) / resolution - 0.5;
    if (nx * nx + ny * ny <= 0.25) {
      return { x: Math.max(0, Math.min(resolution - 1, x)), y: Math.max(0, Math.min(resolution - 1, y)) };
    }
  }
  return null;
}

function pointToPlateCell(x: number, y: number, resolution: number): number | null {
  const clampedX = Math.floor(x * resolution);
  const clampedY = Math.floor(y * resolution);
  if (clampedX < 0 || clampedX >= resolution || clampedY < 0 || clampedY >= resolution) return null;
  const dx = x - 0.5;
  const dy = y - 0.5;
  if (dx * dx + dy * dy > 0.25) return null;
  return clampedY * resolution + clampedX;
}

function cloneFounderGrid(founders: FounderGrid): FounderGrid {
  return {
    resolution: founders.resolution,
    counts: founders.counts.map((channel) => Uint16Array.from(channel)),
    lag: founders.lag.map((channel) => Float32Array.from(channel)),
    growthRate: founders.growthRate.map((channel) => Float32Array.from(channel)),
  };
}

function capitalizeWord(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

export function getSpeciesSourceLabel(speciesConfig: readonly SpeciesDef[], medium: PlateMedium): string {
  const first = speciesConfig[0];
  const phenotype = first ? getSpeciesPhenotype(first, medium) : null;
  if (!first) return 'Unknown culture';
  if (!phenotype) return first.name;
  return `${first.name} (${phenotype.colonyColorLabel})`;
}
