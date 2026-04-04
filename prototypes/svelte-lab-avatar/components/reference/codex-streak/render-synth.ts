import {
  clamp01,
  createRenderMaps,
  type BiomassState,
  type FilmState,
  type RenderMaps,
  type SpeciesDef,
  type SpeciesMorphology,
} from './streak-types';

const AGAR_COLOR: [number, number, number] = [119, 33, 32];
const TRANSFER_STAIN_COLOR: [number, number, number] = [138, 64, 56];
const COLONY_BASE_COLOR: [number, number, number] = [232, 223, 196];
const BETA_HEMOLYSIS_COLOR: [number, number, number] = [172, 120, 105];
const ALPHA_HEMOLYSIS_COLOR: [number, number, number] = [120, 98, 76];
const WET_HIGHLIGHT_COLOR: [number, number, number] = [188, 162, 150];
const GROOVE_SHADOW_COLOR: [number, number, number] = [63, 24, 22];
const AGAR_ROUGHNESS = 0.62;

export function computeRenderMaps(
  film: FilmState,
  biomass: BiomassState,
  species: SpeciesDef[],
  resolution: number = film.resolution,
): RenderMaps {
  if (film.resolution !== biomass.resolution) {
    throw new Error('RenderSynth requires matching film and biomass resolutions.');
  }
  if (resolution !== film.resolution) {
    throw new Error('RenderSynth v1 does not resample between resolutions.');
  }

  const maps = createRenderMaps(resolution);
  const rawAlphaHemolysis = new Float32Array(resolution * resolution);
  const rawBetaHemolysis = new Float32Array(resolution * resolution);

  stampHemolysisHalos(rawAlphaHemolysis, rawBetaHemolysis, biomass, species, resolution);

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const index = y * resolution + x;
      const albedoOffset = index * 4;

      if (!isInsidePlateCell(x, y, resolution)) {
        maps.albedo[albedoOffset] = 0;
        maps.albedo[albedoOffset + 1] = 0;
        maps.albedo[albedoOffset + 2] = 0;
        maps.albedo[albedoOffset + 3] = 0;
        continue;
      }

      const wetMask = computeWetMask(film, index);
      const grooveMask = clamp01(film.groove[index]);
      const totalCoverage = biomass.totalCoverage[index];

      let totalBiomass = 0;
      let totalFilmMass = 0;
      for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
        totalBiomass += biomass.biomass[speciesIndex][index] ?? 0;
        totalFilmMass += film.filmMass[speciesIndex][index] ?? 0;
      }

      const coverageSignal = smoothstep(totalCoverage, 0.025, 0.9);
      const biomassSignal = smoothstep(totalBiomass / Math.max(1, species.length), 0.02, 0.7);
      const colonySignal = clamp01(coverageSignal * 0.76 + biomassSignal * 0.24);
      const transferResidue = clamp01(Math.sqrt(Math.max(0, totalFilmMass * 24)));
      const morphology = computeMorphologyProfile(film, biomass, species, index, totalBiomass, totalFilmMass);
      const height = clamp01(colonySignal * (0.085 + morphology.heightMultiplier * 0.16));

      maps.height[index] = height;
      maps.wetMask[index] = wetMask;
      maps.grooveMask[index] = grooveMask;
      const exteriorFactor = clamp01(1 - totalCoverage * 0.92);
      maps.hemolysisAlpha[index] = clamp01(rawAlphaHemolysis[index] * exteriorFactor * 0.48);
      maps.hemolysisBeta[index] = clamp01(rawBetaHemolysis[index] * exteriorFactor * 0.58);
      maps.roughness[index] = clamp01(
        AGAR_ROUGHNESS * (1 - colonySignal) +
          morphology.roughness * colonySignal -
          wetMask * 0.14 +
          grooveMask * 0.05,
      );

      let agarColor = mixColor(AGAR_COLOR, BETA_HEMOLYSIS_COLOR, maps.hemolysisBeta[index] * 0.34);
      agarColor = mixColor(agarColor, ALPHA_HEMOLYSIS_COLOR, maps.hemolysisAlpha[index] * 0.26);

      const colonyColor = mixColor(COLONY_BASE_COLOR, morphology.color, 0.34);
      let surfaceColor = mixColor(agarColor, TRANSFER_STAIN_COLOR, transferResidue * (1 - colonySignal) * 0.1);
      surfaceColor = mixColor(surfaceColor, colonyColor, colonySignal * 0.86);
      surfaceColor = mixColor(surfaceColor, GROOVE_SHADOW_COLOR, grooveMask * (0.08 + colonySignal * 0.04));
      surfaceColor = mixColor(surfaceColor, WET_HIGHLIGHT_COLOR, wetMask * (0.02 + (1 - colonySignal) * 0.03));

      maps.albedo[albedoOffset] = surfaceColor[0];
      maps.albedo[albedoOffset + 1] = surfaceColor[1];
      maps.albedo[albedoOffset + 2] = surfaceColor[2];
      maps.albedo[albedoOffset + 3] = 255;
    }
  }

  return maps;
}

interface MorphologyProfile {
  color: [number, number, number];
  heightMultiplier: number;
  roughness: number;
}

function computeMorphologyProfile(
  film: FilmState,
  biomass: BiomassState,
  species: SpeciesDef[],
  index: number,
  totalBiomass: number,
  totalFilmMass: number,
): MorphologyProfile {
  const weightDenominator = totalBiomass > 0.000001 ? totalBiomass : totalFilmMass;
  if (weightDenominator <= 0.000001) {
    return {
      color: AGAR_COLOR,
      heightMultiplier: 1,
      roughness: AGAR_ROUGHNESS,
    };
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  let heightMultiplier = 0;
  let roughness = 0;

  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const sourceWeight =
      totalBiomass > 0.000001
        ? biomass.biomass[speciesIndex][index] ?? 0
        : film.filmMass[speciesIndex][index] ?? 0;
    if (sourceWeight <= 0) continue;

    const weight = sourceWeight / weightDenominator;
    const color = hexToRgb(species[speciesIndex].renderColor ?? species[speciesIndex].color);
    red += color[0] * weight;
    green += color[1] * weight;
    blue += color[2] * weight;
    heightMultiplier += getMorphologyHeightMultiplier(species[speciesIndex].morphology) * weight;
    roughness += getMorphologyRoughness(species[speciesIndex].morphology) * weight;
  }

  return {
    color: [Math.round(red), Math.round(green), Math.round(blue)],
    heightMultiplier: heightMultiplier || 1,
    roughness: roughness || AGAR_ROUGHNESS,
  };
}

function computeWetMask(film: FilmState, index: number): number {
  const depositWetness = Math.sqrt(clamp01(film.depositFluid[index] * 18));
  const residualWetness = clamp01((film.agarWetness[index] - 0.14) * 2.5);
  return clamp01(depositWetness * 0.92 + residualWetness * 0.35);
}

function stampHemolysisHalos(
  rawAlphaHemolysis: Float32Array,
  rawBetaHemolysis: Float32Array,
  biomass: BiomassState,
  species: SpeciesDef[],
  resolution: number,
): void {
  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const hemolysisType = species[speciesIndex].hemolysisType;
    if (hemolysisType === 'gamma') continue;

    const coverage = biomass.coverage[speciesIndex];
    const reach =
      hemolysisType === 'beta'
        ? Math.max(2, Math.round(species[speciesIndex].isolatedRadius[1] * resolution * 1.55))
        : Math.max(2, Math.round(species[speciesIndex].isolatedRadius[1] * resolution * 1.2));
    const innerRadius = reach * (hemolysisType === 'beta' ? 0.48 : 0.56);
    const target = hemolysisType === 'beta' ? rawBetaHemolysis : rawAlphaHemolysis;

    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const sourceIndex = y * resolution + x;
        const sourceCoverage = coverage[sourceIndex] ?? 0;
        const perimeterExposure = computePerimeterExposure(coverage, x, y, resolution);
        if (sourceCoverage < 0.08 || perimeterExposure < 0.08 || !isInsidePlateCell(x, y, resolution)) continue;

        const minX = Math.max(0, x - reach);
        const maxX = Math.min(resolution - 1, x + reach);
        const minY = Math.max(0, y - reach);
        const maxY = Math.min(resolution - 1, y + reach);

        for (let stampY = minY; stampY <= maxY; stampY += 1) {
          for (let stampX = minX; stampX <= maxX; stampX += 1) {
            if (!isInsidePlateCell(stampX, stampY, resolution)) continue;

            const dx = stampX - x;
            const dy = stampY - y;
            const distance = Math.hypot(dx, dy);
            if (distance > reach) continue;

            const edgeFade = clamp01((reach - distance) / Math.max(0.0001, reach - innerRadius));
            const ringOpen = distance <= innerRadius ? distance / Math.max(0.75, innerRadius) : 1;
            const maturity = smoothstep(sourceCoverage, 0.08, 0.65);
            const contribution = maturity * perimeterExposure * edgeFade * ringOpen;
            const targetIndex = stampY * resolution + stampX;
            if (contribution > target[targetIndex]) {
              target[targetIndex] = contribution;
            }
          }
        }
      }
    }
  }
}

function getMorphologyHeightMultiplier(morphology: SpeciesMorphology | undefined): number {
  switch (morphology) {
    case 'mucoid':
      return 1.2;
    case 'rough':
      return 0.9;
    case 'spreading':
      return 0.78;
    default:
      return 1;
  }
}

function getMorphologyRoughness(morphology: SpeciesMorphology | undefined): number {
  switch (morphology) {
    case 'mucoid':
      return 0.28;
    case 'rough':
      return 0.76;
    case 'spreading':
      return 0.52;
    default:
      return 0.42;
  }
}

function computePerimeterExposure(
  coverage: Float32Array,
  x: number,
  y: number,
  resolution: number,
): number {
  let exposure = 0;
  let sampleCount = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) continue;

      const sampleX = x + offsetX;
      const sampleY = y + offsetY;
      if (
        sampleX < 0 ||
        sampleX >= resolution ||
        sampleY < 0 ||
        sampleY >= resolution ||
        !isInsidePlateCell(sampleX, sampleY, resolution)
      ) {
        continue;
      }

      exposure += clamp01(1 - coverage[sampleY * resolution + sampleX]);
      sampleCount += 1;
    }
  }

  if (sampleCount === 0) {
    return 0;
  }

  return exposure / sampleCount;
}

function smoothstep(value: number, edge0: number, edge1: number): number {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function isInsidePlateCell(x: number, y: number, resolution: number): boolean {
  const nx = (x + 0.5) / resolution - 0.5;
  const ny = (y + 0.5) / resolution - 0.5;
  return nx * nx + ny * ny <= 0.25;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  amount: number,
): [number, number, number] {
  const mix = clamp01(amount);
  return [
    Math.round(from[0] + (to[0] - from[0]) * mix),
    Math.round(from[1] + (to[1] - from[1]) * mix),
    Math.round(from[2] + (to[2] - from[2]) * mix),
  ];
}
