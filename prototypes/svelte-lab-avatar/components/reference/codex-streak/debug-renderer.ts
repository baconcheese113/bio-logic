import { clamp01, expandRect, type BiomassState, type FilmState, type FounderGrid, type Rect, type SpeciesDef, type TransferDeltaMaps } from './streak-types';

export type FilmViewMode =
  | 'total'
  | 'species'
  | 'fluid'
  | 'pickup-delta'
  | 'net-delta'
  | 'last-stroke-delta'
  | 'groove';

export type FounderViewMode = 'total' | 'species';

interface FilmRenderOptions {
  mode: FilmViewMode;
  speciesIndex: number;
  dirtyRect?: Rect | null;
  deltaMaps?: TransferDeltaMaps;
}

interface RenderBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface FilmRenderExposure {
  totalMax: number;
  speciesMax: number;
  fluidMax: number;
  grooveMax: number;
  pickupMax: number;
  netMax: number;
  lastStrokeMax: number;
}

interface FounderRenderOptions {
  mode: FounderViewMode;
  speciesIndex: number;
  dirtyRect?: Rect | null;
}

interface ProfileChartOptions {
  centerIndex?: number;
  leftIndex?: number;
  rightIndex?: number;
}

const AGAR_COLOR = hexToRgb('#772120');
const BACKGROUND_COLOR = hexToRgb('#110f0e');
const FLUID_COLOR = hexToRgb('#8fc4d6');
const PICKUP_COLOR = hexToRgb('#74b8c8');
const GRID_COLOR = 'rgba(233, 223, 209, 0.08)';

export function drawFilmMap(
  canvas: HTMLCanvasElement,
  film: FilmState,
  species: SpeciesDef[],
  options: FilmRenderOptions,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  const image = context.createImageData(film.resolution, film.resolution);
  const exposure = computeFilmExposure(film, options, {
    minX: 0,
    minY: 0,
    maxX: film.resolution - 1,
    maxY: film.resolution - 1,
  });

  for (let y = 0; y < film.resolution; y += 1) {
    for (let x = 0; x < film.resolution; x += 1) {
      const index = y * film.resolution + x;
      const nx = (x + 0.5) / film.resolution;
      const ny = (y + 0.5) / film.resolution;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const pixel = index * 4;

      if (dx * dx + dy * dy > 0.25) {
        paintPixel(image.data, pixel, BACKGROUND_COLOR, 255);
        continue;
      }

      const color = resolveFilmColor(film, species, index, options, exposure);
      paintPixel(image.data, pixel, color, 255);
    }
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  paintImage(context, image, canvas.width, canvas.height);

  if (options.dirtyRect) {
    drawDirtyRect(context, canvas.width, canvas.height, film.resolution, options.dirtyRect);
  }
}

export function drawFilmMicroscope(
  canvas: HTMLCanvasElement,
  film: FilmState,
  species: SpeciesDef[],
  options: FilmRenderOptions,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#120f0d';
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!options.dirtyRect) {
    drawEmptyMessage(context, canvas, 'Complete a stroke to inspect the dirty-region microscope');
    return;
  }

  const region = expandRect(options.dirtyRect, 3, film.resolution);
  const width = region.maxX - region.minX + 1;
  const height = region.maxY - region.minY + 1;
  const image = context.createImageData(width, height);
  const exposure = computeFilmExposure(film, options, region);

  for (let localY = 0; localY < height; localY += 1) {
    for (let localX = 0; localX < width; localX += 1) {
      const globalX = region.minX + localX;
      const globalY = region.minY + localY;
      const index = globalY * film.resolution + globalX;
      const pixel = (localY * width + localX) * 4;
      const color = resolveFilmColor(film, species, index, options, exposure);
      paintPixel(image.data, pixel, color, 255);
    }
  }

  paintImage(context, image, canvas.width, canvas.height);
  drawMicroscopeGrid(context, canvas.width, canvas.height, width, height);

  const cropDirtyRect: Rect = {
    minX: options.dirtyRect.minX - region.minX,
    minY: options.dirtyRect.minY - region.minY,
    maxX: options.dirtyRect.maxX - region.minX,
    maxY: options.dirtyRect.maxY - region.minY,
  };
  drawDirtyRect(context, canvas.width, canvas.height, width, cropDirtyRect);
}

export function drawFounderMap(
  canvas: HTMLCanvasElement,
  founders: FounderGrid,
  species: SpeciesDef[],
  options: FounderRenderOptions,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  const image = context.createImageData(founders.resolution, founders.resolution);

  for (let y = 0; y < founders.resolution; y += 1) {
    for (let x = 0; x < founders.resolution; x += 1) {
      const index = y * founders.resolution + x;
      const nx = (x + 0.5) / founders.resolution;
      const ny = (y + 0.5) / founders.resolution;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const pixel = index * 4;

      if (dx * dx + dy * dy > 0.25) {
        paintPixel(image.data, pixel, BACKGROUND_COLOR, 255);
        continue;
      }

      const color = resolveFounderColor(founders, species, index, options);
      paintPixel(image.data, pixel, color, 255);
    }
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  paintImage(context, image, canvas.width, canvas.height);

  if (options.dirtyRect) {
    drawDirtyRect(context, canvas.width, canvas.height, founders.resolution, options.dirtyRect);
  }
}

export function drawProfileChart(
  canvas: HTMLCanvasElement,
  profile: number[],
  options: ProfileChartOptions = {},
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#181512';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = '#8b7355';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(24, canvas.height - 24);
  context.lineTo(canvas.width - 12, canvas.height - 24);
  context.stroke();

  if (profile.length === 0) {
    drawEmptyMessage(context, canvas, 'Finish a stroke to capture a cross-section profile');
    return;
  }

  const maxValue = Math.max(...profile, 0.001);
  context.strokeStyle = '#d4b896';
  context.lineWidth = 2;
  context.beginPath();

  for (let index = 0; index < profile.length; index += 1) {
    const x = 24 + (index / Math.max(1, profile.length - 1)) * (canvas.width - 36);
    const y = canvas.height - 24 - (profile[index] / maxValue) * (canvas.height - 40);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();

  const markerSpecs = [
    { index: options.leftIndex ?? Math.floor(profile.length * 0.25), color: '#74b8c8' },
    { index: options.centerIndex ?? Math.floor(profile.length / 2), color: '#f0d7a6' },
    { index: options.rightIndex ?? Math.floor(profile.length * 0.75), color: '#74b8c8' },
  ];

  for (const marker of markerSpecs) {
    const x = 24 + (marker.index / Math.max(1, profile.length - 1)) * (canvas.width - 36);
    context.strokeStyle = marker.color;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, 12);
    context.lineTo(x, canvas.height - 24);
    context.stroke();
  }
}

function resolveFilmColor(
  film: FilmState,
  species: SpeciesDef[],
  index: number,
  options: FilmRenderOptions,
  exposure: FilmRenderExposure,
): [number, number, number] {
  if (options.mode === 'fluid') {
    const intensity = scaleRelative(film.depositFluid[index], exposure.fluidMax);
    return mixColor(AGAR_COLOR, FLUID_COLOR, intensity);
  }

  if (options.mode === 'groove') {
    const groove = scaleRelative(film.groove[index], exposure.grooveMax);
    return [
      Math.round(AGAR_COLOR[0] * (1 - groove * 0.75)),
      Math.round(AGAR_COLOR[1] * (1 - groove * 0.75)),
      Math.round(AGAR_COLOR[2] * (1 - groove * 0.75)),
    ];
  }

  if (options.mode === 'pickup-delta') {
    const picked = options.deltaMaps?.pickup[options.speciesIndex]?.[index] ?? 0;
    return mixColor(BACKGROUND_COLOR, PICKUP_COLOR, scaleRelative(picked, exposure.pickupMax));
  }

  if (options.mode === 'net-delta') {
    const net = options.deltaMaps?.net[options.speciesIndex]?.[index] ?? 0;
    return resolveSignedDeltaColor(species, options.speciesIndex, net, exposure.netMax);
  }

  if (options.mode === 'last-stroke-delta') {
    const net = options.deltaMaps?.lastStroke[options.speciesIndex]?.[index] ?? 0;
    return resolveSignedDeltaColor(species, options.speciesIndex, net, exposure.lastStrokeMax);
  }

  if (options.mode === 'species') {
    const tint = hexToRgb(species[options.speciesIndex]?.color ?? '#e8dcc8');
    const channel = film.filmMass[options.speciesIndex];
    const intensity = scaleRelative(channel ? channel[index] : 0, exposure.speciesMax);
    const fluidBoost = scaleRelative(film.depositFluid[index], exposure.fluidMax) * 0.12;
    return mixColor(AGAR_COLOR, tint, Math.min(1, intensity + fluidBoost));
  }

  const totals = film.filmMass.map((channel) => channel[index]);
  const total = totals.reduce((sum, value) => sum + value, 0);
  if (total <= 0.0001) {
    return mixColor(AGAR_COLOR, FLUID_COLOR, scaleRelative(film.depositFluid[index], exposure.fluidMax) * 0.15);
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  for (let speciesIndex = 0; speciesIndex < totals.length; speciesIndex += 1) {
    const tint = hexToRgb(species[speciesIndex]?.color ?? '#e8dcc8');
    const weight = totals[speciesIndex] / total;
    red += tint[0] * weight;
    green += tint[1] * weight;
    blue += tint[2] * weight;
  }

  const mixedColor: [number, number, number] = [Math.round(red), Math.round(green), Math.round(blue)];
  const intensity = scaleRelative(total, exposure.totalMax);
  const fluidBoost = scaleRelative(film.depositFluid[index], exposure.fluidMax) * 0.1;
  const grooveShade = scaleRelative(film.groove[index], exposure.grooveMax) * 0.16;
  return mixColor(
    [
      Math.round(AGAR_COLOR[0] * (1 - grooveShade)),
      Math.round(AGAR_COLOR[1] * (1 - grooveShade)),
      Math.round(AGAR_COLOR[2] * (1 - grooveShade)),
    ],
    mixedColor,
    Math.min(1, intensity + fluidBoost),
  );
}

function resolveSignedDeltaColor(
  species: SpeciesDef[],
  speciesIndex: number,
  value: number,
  maxMagnitude: number,
): [number, number, number] {
  if (Math.abs(value) <= 0.000001) return BACKGROUND_COLOR;

  const positiveTint = hexToRgb(species[speciesIndex]?.color ?? '#e8dcc8');
  if (value > 0) {
    return mixColor(BACKGROUND_COLOR, positiveTint, scaleRelative(value, maxMagnitude));
  }

  return mixColor(BACKGROUND_COLOR, PICKUP_COLOR, scaleRelative(Math.abs(value), maxMagnitude));
}

function resolveFounderColor(
  founders: FounderGrid,
  species: SpeciesDef[],
  index: number,
  options: FounderRenderOptions,
): [number, number, number] {
  if (options.mode === 'species') {
    const count = founders.counts[options.speciesIndex]?.[index] ?? 0;
    const tint = hexToRgb(species[options.speciesIndex]?.color ?? '#e8dcc8');
    return mixColor(BACKGROUND_COLOR, tint, Math.min(1, count / 5));
  }

  const totals = founders.counts.map((channel) => channel[index]);
  const total = totals.reduce((sum, value) => sum + value, 0);
  if (total === 0) return BACKGROUND_COLOR;

  let red = 0;
  let green = 0;
  let blue = 0;
  for (let speciesIndex = 0; speciesIndex < totals.length; speciesIndex += 1) {
    const tint = hexToRgb(species[speciesIndex]?.color ?? '#e8dcc8');
    const weight = totals[speciesIndex] / total;
    red += tint[0] * weight;
    green += tint[1] * weight;
    blue += tint[2] * weight;
  }

  return mixColor(BACKGROUND_COLOR, [Math.round(red), Math.round(green), Math.round(blue)], Math.min(1, total / 6));
}

function scaleRelative(value: number, maxValue: number): number {
  if (maxValue <= 0.000001) return 0;
  return Math.max(0, Math.min(1, Math.sqrt(Math.max(0, value) / maxValue)));
}

function computeFilmExposure(
  film: FilmState,
  options: FilmRenderOptions,
  bounds: RenderBounds,
): FilmRenderExposure {
  let totalMax = 0;
  let speciesMax = 0;
  let fluidMax = 0;
  let grooveMax = 0;
  let pickupMax = 0;
  let netMax = 0;
  let lastStrokeMax = 0;

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const index = y * film.resolution + x;
      const nx = (x + 0.5) / film.resolution;
      const ny = (y + 0.5) / film.resolution;
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      if (dx * dx + dy * dy > 0.25) continue;

      let total = 0;
      for (let speciesIndex = 0; speciesIndex < film.filmMass.length; speciesIndex += 1) {
        total += film.filmMass[speciesIndex][index];
      }

      totalMax = Math.max(totalMax, total);
      speciesMax = Math.max(speciesMax, film.filmMass[options.speciesIndex]?.[index] ?? 0);
      fluidMax = Math.max(fluidMax, film.depositFluid[index]);
      grooveMax = Math.max(grooveMax, film.groove[index]);
      pickupMax = Math.max(pickupMax, options.deltaMaps?.pickup[options.speciesIndex]?.[index] ?? 0);
      netMax = Math.max(netMax, Math.abs(options.deltaMaps?.net[options.speciesIndex]?.[index] ?? 0));
      lastStrokeMax = Math.max(lastStrokeMax, Math.abs(options.deltaMaps?.lastStroke[options.speciesIndex]?.[index] ?? 0));
    }
  }

  return {
    totalMax,
    speciesMax,
    fluidMax,
    grooveMax,
    pickupMax,
    netMax,
    lastStrokeMax,
  };
}

function paintImage(
  context: CanvasRenderingContext2D,
  image: ImageData,
  width: number,
  height: number,
  smoothing: boolean = false,
): void {
  const buffer = document.createElement('canvas');
  buffer.width = image.width;
  buffer.height = image.height;
  const bufferContext = buffer.getContext('2d');
  if (!bufferContext) return;

  bufferContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = smoothing;
  context.drawImage(buffer, 0, 0, width, height);
}

function drawDirtyRect(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  resolution: number,
  rect: Rect,
): void {
  const scaleX = canvasWidth / resolution;
  const scaleY = canvasHeight / resolution;
  context.strokeStyle = '#d4b896';
  context.lineWidth = 2;
  context.strokeRect(
    rect.minX * scaleX,
    rect.minY * scaleY,
    (rect.maxX - rect.minX + 1) * scaleX,
    (rect.maxY - rect.minY + 1) * scaleY,
  );
}

function drawMicroscopeGrid(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cellsWide: number,
  cellsHigh: number,
): void {
  context.strokeStyle = GRID_COLOR;
  context.lineWidth = 1;

  for (let x = 1; x < cellsWide; x += 1) {
    const px = (x / cellsWide) * canvasWidth;
    context.beginPath();
    context.moveTo(px, 0);
    context.lineTo(px, canvasHeight);
    context.stroke();
  }

  for (let y = 1; y < cellsHigh; y += 1) {
    const py = (y / cellsHigh) * canvasHeight;
    context.beginPath();
    context.moveTo(0, py);
    context.lineTo(canvasWidth, py);
    context.stroke();
  }
}

function drawEmptyMessage(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  message: string,
): void {
  context.fillStyle = '#e4d7c4';
  context.font = '14px var(--font-mono)';
  context.textAlign = 'center';
  context.fillText(message, canvas.width / 2, canvas.height / 2);
}

function paintPixel(
  pixels: Uint8ClampedArray,
  offset: number,
  color: [number, number, number],
  alpha: number,
): void {
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = alpha;
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
  const mix = Math.max(0, Math.min(1, amount));
  return [
    Math.round(from[0] + (to[0] - from[0]) * mix),
    Math.round(from[1] + (to[1] - from[1]) * mix),
    Math.round(from[2] + (to[2] - from[2]) * mix),
  ];
}

// ── Growth debug rendering ────────────────────────────────────────────────────

export type BiomassViewMode = 'biomass-total' | 'biomass-species' | 'coverage-total' | 'coverage-species';
export type NutrientViewMode = 'nutrient' | 'waste';

interface BiomassRenderOptions {
  mode: BiomassViewMode;
  speciesIndex: number;
  species: SpeciesDef[];
}

interface NutrientRenderOptions {
  mode: NutrientViewMode;
}

const NUTRIENT_COLOR = hexToRgb('#4ade80');  // green = full
const WASTE_COLOR    = hexToRgb('#f87171');  // red = high waste
const COVERAGE_COLOR = hexToRgb('#e0d0a0');  // warm white = covered

/**
 * Draw biomass or coverage heatmap.
 */
export function drawBiomassMap(
  canvas: HTMLCanvasElement,
  state: BiomassState,
  options: BiomassRenderOptions,
): void {
  const res = state.resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgb(${BACKGROUND_COLOR.join(',')})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageData = ctx.createImageData(res, res);
  const pixels = imageData.data;

  for (let cy = 0; cy < res; cy += 1) {
    for (let cx = 0; cx < res; cx += 1) {
      const ci = cy * res + cx;
      let value = 0;
      let color: [number, number, number] = AGAR_COLOR;

      if (options.mode === 'biomass-total') {
        let total = 0;
        for (let si = 0; si < options.species.length; si += 1) total += state.biomass[si][ci];
        value = Math.min(1, total / options.species.length);
        color = COVERAGE_COLOR;
      } else if (options.mode === 'biomass-species') {
        value = Math.min(1, state.biomass[options.speciesIndex]?.[ci] ?? 0);
        color = hexToRgb(options.species[options.speciesIndex]?.color ?? '#ffffff');
      } else if (options.mode === 'coverage-total') {
        value = state.totalCoverage[ci];
        color = COVERAGE_COLOR;
      } else if (options.mode === 'coverage-species') {
        value = state.coverage[options.speciesIndex]?.[ci] ?? 0;
        color = hexToRgb(options.species[options.speciesIndex]?.color ?? '#ffffff');
      }

      const offset = ci * 4;
      const mixed = mixColor(BACKGROUND_COLOR, color, clamp01(Math.sqrt(Math.max(0, value))));
      paintPixel(pixels, offset, mixed, 255);
    }
  }

  paintImage(ctx, imageData, canvas.width, canvas.height, true);
}

/**
 * Draw nutrient or waste field.
 */
export function drawNutrientWasteMap(
  canvas: HTMLCanvasElement,
  state: BiomassState,
  options: NutrientRenderOptions,
): void {
  const res = state.resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgb(${BACKGROUND_COLOR.join(',')})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageData = ctx.createImageData(res, res);
  const pixels = imageData.data;

  // Find max for normalization
  const field = options.mode === 'nutrient' ? state.nutrient : state.waste;
  let maxVal = 0;
  for (let i = 0; i < field.length; i += 1) if (field[i] > maxVal) maxVal = field[i];
  if (maxVal <= 0) maxVal = 1;

  const color = options.mode === 'nutrient' ? NUTRIENT_COLOR : WASTE_COLOR;

  for (let cy = 0; cy < res; cy += 1) {
    for (let cx = 0; cx < res; cx += 1) {
      const ci = cy * res + cx;
      const value = options.mode === 'nutrient'
        ? field[ci]                        // nutrient: 1=green, 0=dark
        : Math.min(1, field[ci] / maxVal); // waste: relative to max

      const offset = ci * 4;
      paintPixel(
        pixels,
        offset,
        mixColor(BACKGROUND_COLOR, color, clamp01(value)),
        255,
      );
    }
  }

  paintImage(ctx, imageData, canvas.width, canvas.height, true);
}
