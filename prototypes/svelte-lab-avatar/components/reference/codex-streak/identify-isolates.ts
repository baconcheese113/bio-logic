import {
  clamp01,
  createRect,
  expandRect,
  getHemolysisLabel,
  getSpeciesMorphologyLabel,
  getSpeciesPhenotype,
  type BiomassState,
  type InspectionLightMode,
  type InspectionSnapshot,
  type IsolateCandidate,
  type PlateMedium,
  type Rect,
  type RenderMaps,
  type SpeciesDef,
  type Vec2,
} from './streak-types';

interface ComponentCell {
  x: number;
  y: number;
  index: number;
}

interface ComponentSummary {
  cells: ComponentCell[];
  bounds: Rect;
  centroid: Vec2;
  dominantSpeciesIndex: number;
  dominantSpeciesSignal: number;
  totalSignal: number;
  areaCells: number;
}

const COVERAGE_THRESHOLD = 0.12;

export function identifyIsolatedCandidates(
  biomass: BiomassState,
  renderMaps: RenderMaps,
  species: SpeciesDef[],
  medium: PlateMedium,
): IsolateCandidate[] {
  const components = collectComponents(biomass, species.length);
  const candidates: IsolateCandidate[] = [];

  for (const component of components) {
    const dominantSpecies = species[component.dominantSpeciesIndex];
    const phenotype = getSpeciesPhenotype(dominantSpecies, medium);
    if (!phenotype) continue;

    const purity = component.dominantSpeciesSignal / Math.max(0.0001, component.totalSignal);
    const colonyRadiusCells = Math.sqrt(component.areaCells / Math.PI);
    const colonyDiameterMm = cellsToMillimeters(colonyRadiusCells * 2, biomass.resolution);
    const expectedRadiusMin = phenotype.isolatedRadius[0] * biomass.resolution;
    const expectedRadiusMax = phenotype.isolatedRadius[1] * biomass.resolution;
    const expectedRadiusMean = (expectedRadiusMin + expectedRadiusMax) * 0.5;
    const sizeMatch =
      colonyRadiusCells <= expectedRadiusMean
        ? clamp01(colonyRadiusCells / Math.max(0.001, expectedRadiusMean))
        : clamp01(1 - (colonyRadiusCells - expectedRadiusMean) / Math.max(0.001, expectedRadiusMax * 1.5));
    const surroundingCrowding = sampleSurroundingCrowding(biomass, component.bounds, component.cells);
    const separation = clamp01(1 - surroundingCrowding);
    const localHemolysisSignal = sampleLocalHemolysis(renderMaps, component.bounds);
    const crowded =
      colonyRadiusCells > expectedRadiusMax * 1.75 ||
      separation < 0.45 ||
      purity < 0.72 ||
      component.areaCells > Math.PI * expectedRadiusMax * expectedRadiusMax * 3.2;
    let confidence = clamp01(purity * 0.42 + separation * 0.34 + sizeMatch * 0.24);
    if (crowded) {
      confidence *= 0.55;
    }

    candidates.push({
      id: `${dominantSpecies.id}-${Math.round(component.centroid.x * 1000)}-${Math.round(component.centroid.y * 1000)}`,
      center: component.centroid,
      bounds: createInspectionBounds(component.bounds, biomass.resolution, expectedRadiusMax),
      dominantSpeciesId: dominantSpecies.id,
      dominantSpeciesName: dominantSpecies.name,
      dominantSpeciesIndex: component.dominantSpeciesIndex,
      purity,
      confidence,
      crowded,
      colonyRadiusCells,
      colonyDiameterMm,
      localHemolysisSignal,
      hemolysisLabel: getHemolysisLabel(phenotype.hemolysisType),
      morphologyLabel: getSpeciesMorphologyLabel(phenotype.morphology),
      colonyColorLabel: phenotype.colonyColorLabel,
      differentialLabel: phenotype.differentialLabel,
      transmittedLightRecommended:
        medium === 'blood-agar' && phenotype.hemolysisType !== 'gamma' && localHemolysisSignal > 0.03,
    });
  }

  return candidates
    .sort((left, right) => right.confidence - left.confidence || right.purity - left.purity)
    .slice(0, 12);
}

export function createInspectionSnapshot(
  candidate: IsolateCandidate,
  medium: PlateMedium,
  lightMode: InspectionLightMode,
): InspectionSnapshot {
  const observationLines = [
    `${candidate.dominantSpeciesName} candidate`,
    `${candidate.colonyColorLabel} ${candidate.morphologyLabel} colony, ~${candidate.colonyDiameterMm.toFixed(1)} mm diameter`,
    `${candidate.hemolysisLabel}${candidate.differentialLabel ? `, ${candidate.differentialLabel.toLowerCase()}` : ''}`,
    candidate.crowded
      ? `Crowded growth nearby, confidence ${Math.round(candidate.confidence * 100)}%`
      : `Well-isolated region, confidence ${Math.round(candidate.confidence * 100)}%`,
  ];

  return {
    candidateId: candidate.id,
    medium,
    lightMode,
    bounds: candidate.bounds,
    title: `${candidate.dominantSpeciesName} inspection`,
    observationLines,
  };
}

function collectComponents(
  biomass: BiomassState,
  speciesCount: number,
): ComponentSummary[] {
  const resolution = biomass.resolution;
  const visited = new Uint8Array(resolution * resolution);
  const components: ComponentSummary[] = [];

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const startIndex = y * resolution + x;
      if (visited[startIndex] === 1 || !isInsidePlateCell(x, y, resolution)) continue;
      if (biomass.totalCoverage[startIndex] < COVERAGE_THRESHOLD) continue;

      const queue: ComponentCell[] = [{ x, y, index: startIndex }];
      const cells: ComponentCell[] = [];
      visited[startIndex] = 1;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let weightedX = 0;
      let weightedY = 0;
      let totalSignal = 0;
      const speciesSignals = Array.from({ length: speciesCount }, () => 0);

      for (let head = 0; head < queue.length; head += 1) {
        const current = queue[head];
        const signal = biomass.totalCoverage[current.index];
        cells.push(current);
        minX = Math.min(minX, current.x);
        minY = Math.min(minY, current.y);
        maxX = Math.max(maxX, current.x);
        maxY = Math.max(maxY, current.y);
        weightedX += ((current.x + 0.5) / resolution) * signal;
        weightedY += ((current.y + 0.5) / resolution) * signal;
        totalSignal += signal;

        for (let speciesIndex = 0; speciesIndex < speciesCount; speciesIndex += 1) {
          speciesSignals[speciesIndex] += biomass.coverage[speciesIndex][current.index] ?? 0;
        }

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) continue;

            const nextX = current.x + offsetX;
            const nextY = current.y + offsetY;
            if (
              nextX < 0 ||
              nextX >= resolution ||
              nextY < 0 ||
              nextY >= resolution ||
              !isInsidePlateCell(nextX, nextY, resolution)
            ) {
              continue;
            }

            const nextIndex = nextY * resolution + nextX;
            if (visited[nextIndex] === 1 || biomass.totalCoverage[nextIndex] < COVERAGE_THRESHOLD) continue;

            visited[nextIndex] = 1;
            queue.push({ x: nextX, y: nextY, index: nextIndex });
          }
        }
      }

      let dominantSpeciesIndex = 0;
      for (let speciesIndex = 1; speciesIndex < speciesSignals.length; speciesIndex += 1) {
        if (speciesSignals[speciesIndex] > speciesSignals[dominantSpeciesIndex]) {
          dominantSpeciesIndex = speciesIndex;
        }
      }

      components.push({
        cells,
        bounds: createRect(minX, minY, maxX, maxY),
        centroid: {
          x: weightedX / Math.max(0.0001, totalSignal),
          y: weightedY / Math.max(0.0001, totalSignal),
        },
        dominantSpeciesIndex,
        dominantSpeciesSignal: speciesSignals[dominantSpeciesIndex],
        totalSignal,
        areaCells: cells.length,
      });
    }
  }

  return components;
}

function sampleSurroundingCrowding(
  biomass: BiomassState,
  bounds: Rect,
  componentCells: ComponentCell[],
): number {
  const expanded = expandRect(bounds, 6, biomass.resolution);
  const cellSet = new Set<number>(componentCells.map((cell) => cell.index));
  let sum = 0;
  let count = 0;

  for (let y = expanded.minY; y <= expanded.maxY; y += 1) {
    for (let x = expanded.minX; x <= expanded.maxX; x += 1) {
      const index = y * biomass.resolution + x;
      if (!isInsidePlateCell(x, y, biomass.resolution) || cellSet.has(index)) continue;
      sum += biomass.totalCoverage[index];
      count += 1;
    }
  }

  return count === 0 ? 0 : sum / count;
}

function sampleLocalHemolysis(
  renderMaps: RenderMaps,
  bounds: Rect,
): number {
  const expanded = expandRect(bounds, 5, renderMaps.resolution);
  let sum = 0;
  let count = 0;
  let maxSignal = 0;

  for (let y = expanded.minY; y <= expanded.maxY; y += 1) {
    for (let x = expanded.minX; x <= expanded.maxX; x += 1) {
      const index = y * renderMaps.resolution + x;
      const signal = Math.max(renderMaps.hemolysisAlpha[index], renderMaps.hemolysisBeta[index]);
      sum += signal;
      count += 1;
      if (signal > maxSignal) maxSignal = signal;
    }
  }

  if (count === 0) return 0;
  return maxSignal * 0.7 + (sum / count) * 0.3;
}

function createInspectionBounds(
  bounds: Rect,
  resolution: number,
  expectedRadiusMax: number,
): Rect {
  const padding = Math.max(8, Math.round(expectedRadiusMax * 3));
  return expandRect(bounds, padding, resolution);
}

function cellsToMillimeters(cellDiameter: number, resolution: number): number {
  return (cellDiameter / resolution) * 45;
}

function isInsidePlateCell(x: number, y: number, resolution: number): boolean {
  const nx = (x + 0.5) / resolution - 0.5;
  const ny = (y + 0.5) / resolution - 0.5;
  return nx * nx + ny * ny <= 0.25;
}
