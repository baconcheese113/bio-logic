import {
  cellIndex,
  rectArea,
  totalUint16,
  type FilmState,
  type FounderGrid,
  type Rect,
  type SeedingMetrics,
  type TransferMetrics,
  type TransferSnapshot,
} from './streak-types';

interface ProfileStats {
  centerValue: number;
  sideLobeLeft: number;
  sideLobeRight: number;
  sideLobeAverage: number;
  troughDepth: number;
}

export function computeTransferMetrics(snapshot: TransferSnapshot): TransferMetrics {
  const conservationError = snapshot.ledger.loaded.map((loaded, index) => {
    if (loaded <= 0) return 0;
    const tracked =
      snapshot.ledger.filmTotals[index] +
      snapshot.ledger.sectorTotals[index] +
      snapshot.ledger.discarded[index];
    return Math.abs(loaded - tracked) / loaded;
  });

  const lastReport = snapshot.lastStrokeReport;
  const profile =
    lastReport?.strokeCenter && lastReport.strokeDirection && lastReport.dirtyRect
      ? sampleCrossSectionProfile(
          snapshot.film,
          lastReport.strokeCenter,
          lastReport.strokeDirection,
          null,
          Math.max(10, Math.ceil(Math.min(lastReport.dirtyRect.maxX - lastReport.dirtyRect.minX + 1, lastReport.dirtyRect.maxY - lastReport.dirtyRect.minY + 1) * 0.7)),
          Math.max(41, Math.ceil(Math.min(lastReport.dirtyRect.maxX - lastReport.dirtyRect.minX + 1, lastReport.dirtyRect.maxY - lastReport.dirtyRect.minY + 1) * 1.4) * 2 + 1),
        )
      : snapshot.lastProfileRow === null
        ? []
        : sampleFilmProfile(snapshot.film, snapshot.lastProfileRow, null, snapshot.dirtyRect);
  const stats = computeProfileStats(profile);

  return {
    conservationError,
    totalFilm: [...snapshot.ledger.filmTotals],
    totalSector: [...snapshot.ledger.sectorTotals],
    totalDiscarded: [...snapshot.ledger.discarded],
    profile,
    profileCenter: stats.centerValue,
    sideLobeLeft: stats.sideLobeLeft,
    sideLobeRight: stats.sideLobeRight,
    profileFlanks: stats.sideLobeAverage,
    troughDepth: stats.troughDepth,
  };
}

export function computeSeedingMetrics(
  current: FounderGrid,
  previous: FounderGrid | null,
  dirtyRect: Rect | null,
): SeedingMetrics {
  let changedCells = 0;
  if (previous && previous.resolution === current.resolution) {
    for (let speciesIndex = 0; speciesIndex < current.counts.length; speciesIndex += 1) {
      for (let index = 0; index < current.counts[speciesIndex].length; index += 1) {
        if (current.counts[speciesIndex][index] !== previous.counts[speciesIndex][index]) {
          changedCells += 1;
        }
      }
    }
  }

  return {
    founderTotals: current.counts.map((channel) => totalUint16(channel)),
    changedCells,
    deterministic: !previous || founderGridEquals(current, previous),
    haloArea: rectArea(dirtyRect),
  };
}

export function founderGridEquals(a: FounderGrid, b: FounderGrid): boolean {
  if (a.resolution !== b.resolution || a.counts.length !== b.counts.length) return false;

  for (let speciesIndex = 0; speciesIndex < a.counts.length; speciesIndex += 1) {
    const left = a.counts[speciesIndex];
    const right = b.counts[speciesIndex];
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
  }

  return true;
}

export function sampleFilmProfile(
  film: FilmState,
  row: number,
  speciesIndex: number | null = null,
  bounds: Pick<Rect, 'minX' | 'maxX'> | null = null,
): number[] {
  const clampedRow = Math.max(0, Math.min(film.resolution - 1, row));
  const startX = Math.max(0, bounds?.minX ?? 0);
  const endX = Math.min(film.resolution - 1, bounds?.maxX ?? film.resolution - 1);
  const profile = Array.from({ length: endX - startX + 1 }, () => 0);

  for (let x = startX; x <= endX; x += 1) {
    const index = cellIndex(x, clampedRow, film.resolution);
    const profileIndex = x - startX;
    if (speciesIndex === null) {
      let total = 0;
      for (let channelIndex = 0; channelIndex < film.filmMass.length; channelIndex += 1) {
        total += film.filmMass[channelIndex][index];
      }
      profile[profileIndex] = total;
      continue;
    }

    profile[profileIndex] = film.filmMass[speciesIndex]?.[index] ?? 0;
  }

  return profile;
}

export function sampleCrossSectionProfile(
  film: FilmState,
  center: { x: number; y: number },
  direction: { x: number; y: number },
  speciesIndex: number | null,
  halfWidthCells: number,
  samples: number,
): number[] {
  const directionLength = Math.hypot(direction.x, direction.y);
  if (directionLength <= 0) return [];

  const perpX = -direction.y / directionLength;
  const perpY = direction.x / directionLength;
  const profile = Array.from({ length: samples }, () => 0);

  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
    const offsetCells = ((sampleIndex / Math.max(1, samples - 1)) - 0.5) * 2 * halfWidthCells;
    const sampleX = center.x + (perpX * offsetCells) / film.resolution;
    const sampleY = center.y + (perpY * offsetCells) / film.resolution;
    const cellX = Math.floor(sampleX * film.resolution);
    const cellY = Math.floor(sampleY * film.resolution);
    if (cellX < 0 || cellX >= film.resolution || cellY < 0 || cellY >= film.resolution) continue;

    const index = cellIndex(cellX, cellY, film.resolution);
    if (speciesIndex === null) {
      let total = 0;
      for (let channelIndex = 0; channelIndex < film.filmMass.length; channelIndex += 1) {
        total += film.filmMass[channelIndex][index];
      }
      profile[sampleIndex] = total;
      continue;
    }

    profile[sampleIndex] = film.filmMass[speciesIndex]?.[index] ?? 0;
  }

  return profile;
}

export function computeProfileStats(profile: number[]): ProfileStats {
  const centerIndex = Math.floor(profile.length / 2);
  const centerValue = profile[centerIndex] ?? 0;
  const centerExclusion = Math.max(1, Math.floor(profile.length * 0.08));
  let sideLobeLeft = 0;
  let sideLobeRight = 0;

  for (let index = 0; index < Math.max(0, centerIndex - centerExclusion); index += 1) {
    sideLobeLeft = Math.max(sideLobeLeft, profile[index] ?? 0);
  }

  for (let index = Math.min(profile.length - 1, centerIndex + centerExclusion + 1); index < profile.length; index += 1) {
    sideLobeRight = Math.max(sideLobeRight, profile[index] ?? 0);
  }

  const sideLobeAverage = (sideLobeLeft + sideLobeRight) / 2;

  return {
    centerValue,
    sideLobeLeft,
    sideLobeRight,
    sideLobeAverage,
    troughDepth: sideLobeAverage - centerValue,
  };
}
