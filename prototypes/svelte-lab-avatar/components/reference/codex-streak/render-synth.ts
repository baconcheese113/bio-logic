import {
  clamp01,
  createRenderMaps,
  getMediumDef,
  getSpeciesPhenotype,
  type BiomassState,
  type FilmState,
  type PlateMedium,
  type RenderMaps,
  type SpeciesDef,
  type SpeciesMorphology,
} from './streak-types';

const AGAR_ROUGHNESS = 0.62;
const COLONY_BASE_COLOR: [number, number, number] = [223, 210, 190];
const GROOVE_SHADOW_COLOR: [number, number, number] = [58, 28, 24];

interface MorphologyProfile {
  morphology: SpeciesMorphology;
  color: [number, number, number];
  opacity: number;
  heightMultiplier: number;
  roughness: number;
  sheen: number;
}

export function computeRenderMaps(
  film: FilmState,
  biomass: BiomassState,
  species: SpeciesDef[],
  medium: PlateMedium,
  resolution: number = film.resolution,
): RenderMaps {
  if (film.resolution !== biomass.resolution) {
    throw new Error('RenderSynth requires matching film and biomass resolutions.');
  }
  if (resolution !== film.resolution) {
    throw new Error('RenderSynth v1 does not resample between resolutions.');
  }

  const mediumDef = getMediumDef(medium);
  const maps = createRenderMaps(resolution);
  const rawAlphaHemolysis = new Float32Array(resolution * resolution);
  const rawBetaHemolysis = new Float32Array(resolution * resolution);

  if (mediumDef.supportsHemolysis) {
    stampHemolysisHalos(rawAlphaHemolysis, rawBetaHemolysis, biomass, species, medium, resolution);
  }

  const agarColor = hexToRgb(mediumDef.agarColor);
  const transferResidueColor = hexToRgb(mediumDef.transferResidueColor);
  const wetHighlightColor = hexToRgb(mediumDef.wetHighlightColor);
  const betaHemolysisColor = hexToRgb(mediumDef.betaHemolysisColor);
  const alphaHemolysisColor = hexToRgb(mediumDef.alphaHemolysisColor);

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

      const coverageSignal = smoothstep(totalCoverage, 0.025, 0.92);
      const biomassSignal = smoothstep(totalBiomass / Math.max(1, species.length), 0.015, 0.7);
      const colonySignal = clamp01(coverageSignal * 0.78 + biomassSignal * 0.22);
      const transferResidue = clamp01(Math.sqrt(Math.max(0, totalFilmMass * 20)));
      const morphology = computeMorphologyProfile(biomass, film, species, medium, index, totalBiomass, totalFilmMass);
      const perimeterExposure = computePerimeterExposure(biomass.totalCoverage, x, y, resolution);
      const interiorSignal = clamp01(colonySignal - perimeterExposure * 0.55);
      const centerDepression = computeMorphologyCenterDepression(morphology.morphology, interiorSignal);
      const rimSignal = computeMorphologyRimSignal(morphology.morphology, perimeterExposure);
      const textureNoise = pseudoNoise2d(
        x * 0.82 + getMorphologyNoiseSeed(morphology.morphology),
        y * 0.82 - getMorphologyNoiseSeed(morphology.morphology),
      );
      const height = clamp01(
        colonySignal * (0.032 + morphology.heightMultiplier * 0.18) -
          centerDepression * 0.055 +
          rimSignal * 0.028,
      );

      maps.height[index] = height;
      maps.wetMask[index] = wetMask;
      maps.grooveMask[index] = grooveMask;

      const exteriorFactor = clamp01(1 - totalCoverage * 0.9);
      maps.hemolysisAlpha[index] = mediumDef.supportsHemolysis
        ? clamp01(rawAlphaHemolysis[index] * exteriorFactor * 0.42)
        : 0;
      maps.hemolysisBeta[index] = mediumDef.supportsHemolysis
        ? clamp01(rawBetaHemolysis[index] * exteriorFactor * 0.52)
        : 0;
      maps.roughness[index] = clamp01(
        AGAR_ROUGHNESS * (1 - colonySignal) +
          morphology.roughness * colonySignal -
          (textureNoise - 0.5) * getMorphologyRoughnessVariance(morphology.morphology) * colonySignal -
          wetMask * (0.09 + morphology.sheen * 0.05) +
          grooveMask * 0.05,
      );

      let surfaceColor = agarColor;
      surfaceColor = mixColor(surfaceColor, betaHemolysisColor, maps.hemolysisBeta[index] * 0.32);
      surfaceColor = mixColor(surfaceColor, alphaHemolysisColor, maps.hemolysisAlpha[index] * 0.28);

      const filmTint = computeFilmTint(film, species, index);
      if (transferResidue > 0.001) {
        const residueColor = mixColor(transferResidueColor, filmTint, 0.35);
        surfaceColor = mixColor(surfaceColor, residueColor, transferResidue * (1 - colonySignal) * 0.24);
      }

      const colonyColor = mixColor(
        COLONY_BASE_COLOR,
        morphology.color,
        getMorphologyTintStrength(morphology.morphology, medium),
      );
      const colonyBlend = clamp01(colonySignal * (0.2 + morphology.opacity * 0.9));
      const textureShadow = clamp01(
        (0.6 - textureNoise) * getMorphologyShadowStrength(morphology.morphology) +
          centerDepression * 0.8,
      );
      const textureHighlight = clamp01(
        (textureNoise - 0.38) * getMorphologyHighlightStrength(morphology.morphology) +
          rimSignal * 0.5 +
          wetMask * morphology.sheen * 0.16,
      );
      const colonyShadowColor = mixColor(colonyColor, GROOVE_SHADOW_COLOR, 0.5);

      surfaceColor = mixColor(surfaceColor, colonyColor, colonyBlend);
      surfaceColor = mixColor(surfaceColor, colonyShadowColor, colonyBlend * textureShadow * 0.24);
      surfaceColor = mixColor(
        surfaceColor,
        wetHighlightColor,
        colonyBlend * textureHighlight * (0.08 + morphology.sheen * 0.14),
      );
      surfaceColor = mixColor(surfaceColor, GROOVE_SHADOW_COLOR, grooveMask * (0.1 + colonySignal * 0.04));
      surfaceColor = mixColor(surfaceColor, wetHighlightColor, wetMask * (0.03 + morphology.sheen * 0.08));

      maps.albedo[albedoOffset] = surfaceColor[0];
      maps.albedo[albedoOffset + 1] = surfaceColor[1];
      maps.albedo[albedoOffset + 2] = surfaceColor[2];
      maps.albedo[albedoOffset + 3] = 255;
    }
  }

  return maps;
}

function computeMorphologyProfile(
  biomass: BiomassState,
  film: FilmState,
  species: SpeciesDef[],
  medium: PlateMedium,
  index: number,
  totalBiomass: number,
  totalFilmMass: number,
): MorphologyProfile {
  const weightDenominator = totalBiomass > 0.000001 ? totalBiomass : totalFilmMass;
  if (weightDenominator <= 0.000001) {
    return {
      morphology: 'smooth',
      color: COLONY_BASE_COLOR,
      opacity: 0.75,
      heightMultiplier: 1,
      roughness: AGAR_ROUGHNESS,
      sheen: 0.3,
    };
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  let opacity = 0;
  let heightMultiplier = 0;
  let roughness = 0;
  let sheen = 0;
  let morphology: SpeciesMorphology | null = null;
  let dominantWeight = 0;

  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const sourceWeight =
      totalBiomass > 0.000001
        ? biomass.biomass[speciesIndex][index] ?? 0
        : film.filmMass[speciesIndex][index] ?? 0;
    if (sourceWeight <= 0) continue;

    const weight = sourceWeight / weightDenominator;
    const phenotype = getSpeciesPhenotype(species[speciesIndex], medium);
    const color = phenotype
      ? hexToRgb(phenotype.renderColor)
      : mixColor(COLONY_BASE_COLOR, hexToRgb(species[speciesIndex].color), 0.35);

    red += color[0] * weight;
    green += color[1] * weight;
    blue += color[2] * weight;
    opacity += (phenotype?.opacity ?? 0.72) * weight;
    heightMultiplier += getMorphologyHeightMultiplier(phenotype?.morphology) * weight;
    roughness += (phenotype?.roughness ?? AGAR_ROUGHNESS) * weight;
    sheen += (phenotype?.sheen ?? 0.3) * weight;
    if (weight > dominantWeight && phenotype?.morphology) {
      dominantWeight = weight;
      morphology = phenotype.morphology;
    }
  }

  return {
    morphology: morphology ?? 'smooth',
    color: [Math.round(red), Math.round(green), Math.round(blue)],
    opacity: opacity || 0.75,
    heightMultiplier: heightMultiplier || 1,
    roughness: roughness || AGAR_ROUGHNESS,
    sheen: sheen || 0.3,
  };
}

function computeFilmTint(
  film: FilmState,
  species: SpeciesDef[],
  index: number,
): [number, number, number] {
  let totalFilmMass = 0;
  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    totalFilmMass += film.filmMass[speciesIndex][index] ?? 0;
  }

  if (totalFilmMass <= 0.000001) {
    return COLONY_BASE_COLOR;
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const mass = film.filmMass[speciesIndex][index] ?? 0;
    if (mass <= 0) continue;
    const weight = mass / totalFilmMass;
    const tint = hexToRgb(species[speciesIndex].color);
    red += tint[0] * weight;
    green += tint[1] * weight;
    blue += tint[2] * weight;
  }

  return [Math.round(red), Math.round(green), Math.round(blue)];
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
  medium: PlateMedium,
  resolution: number,
): void {
  for (let speciesIndex = 0; speciesIndex < species.length; speciesIndex += 1) {
    const phenotype = getSpeciesPhenotype(species[speciesIndex], medium);
    if (!phenotype || phenotype.hemolysisType === 'gamma') continue;

    const coverage = biomass.coverage[speciesIndex];
    const reach = Math.max(2, Math.round(phenotype.isolatedRadius[1] * resolution * phenotype.hemolysisRatio));
    const innerRadius = reach * (phenotype.hemolysisType === 'beta' ? 0.44 : 0.56);
    const target = phenotype.hemolysisType === 'beta' ? rawBetaHemolysis : rawAlphaHemolysis;

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
      return 1.18;
    case 'rough':
      return 0.92;
    case 'spreading':
      return 0.76;
    case 'draughtsman':
      return 0.84;
    default:
      return 1;
  }
}

function getMorphologyTintStrength(
  morphology: SpeciesMorphology,
  medium: PlateMedium,
): number {
  if (medium === 'macconkey') {
    return morphology === 'mucoid' ? 0.86 : 0.8;
  }

  switch (morphology) {
    case 'rough':
      return 0.76;
    case 'draughtsman':
      return 0.72;
    case 'mucoid':
      return 0.88;
    default:
      return 0.84;
  }
}

function getMorphologyShadowStrength(morphology: SpeciesMorphology): number {
  switch (morphology) {
    case 'rough':
      return 0.7;
    case 'draughtsman':
      return 0.5;
    case 'mucoid':
      return 0.2;
    default:
      return 0.32;
  }
}

function getMorphologyHighlightStrength(morphology: SpeciesMorphology): number {
  switch (morphology) {
    case 'mucoid':
      return 0.68;
    case 'smooth':
      return 0.32;
    case 'draughtsman':
      return 0.18;
    case 'rough':
      return 0.14;
    case 'spreading':
      return 0.22;
    default:
      return 0.28;
  }
}

function getMorphologyRoughnessVariance(morphology: SpeciesMorphology): number {
  switch (morphology) {
    case 'rough':
      return 0.2;
    case 'draughtsman':
      return 0.12;
    case 'mucoid':
      return 0.06;
    default:
      return 0.09;
  }
}

function computeMorphologyCenterDepression(
  morphology: SpeciesMorphology,
  interiorSignal: number,
): number {
  if (morphology !== 'draughtsman') return 0;
  return interiorSignal * interiorSignal;
}

function computeMorphologyRimSignal(
  morphology: SpeciesMorphology,
  perimeterExposure: number,
): number {
  if (morphology !== 'draughtsman') return 0;
  return clamp01(perimeterExposure * 1.4);
}

function getMorphologyNoiseSeed(morphology: SpeciesMorphology): number {
  switch (morphology) {
    case 'rough':
      return 7.3;
    case 'draughtsman':
      return 19.7;
    case 'mucoid':
      return 31.1;
    case 'spreading':
      return 43.9;
    case 'smooth':
    default:
      return 3.1;
  }
}

function pseudoNoise2d(x: number, y: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return value - Math.floor(value);
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

  return sampleCount === 0 ? 0 : exposure / sampleCount;
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
