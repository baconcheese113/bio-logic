export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type HemolysisType = 'alpha' | 'beta' | 'gamma';
export type SpeciesMorphology = 'smooth' | 'rough' | 'mucoid' | 'spreading';

export interface SpeciesDef {
  id: string;
  name: string;
  color: string;
  renderColor?: string;
  hemolysisType: HemolysisType;
  isolatedRadius: [number, number];
  lagRange: [number, number];
  growthRateRange: [number, number];
  maxBiomass: number;
  wasteRate: number;
  morphology?: SpeciesMorphology;
}

export type Action =
  | { type: 'loadSample'; speciesLoads: number[]; timestamp: number }
  | { type: 'sterilize'; timestamp: number }
  | { type: 'beginStroke'; timestamp: number }
  | { type: 'strokeSegment'; from: Vec2; to: Vec2; pressure: number; timestamp: number }
  | { type: 'endStroke'; timestamp: number };

export interface PlateSession {
  plateSeed: number;
  speciesConfig: SpeciesDef[];
  actionLog: Action[];
  targetTime: number;
}

export interface LoopSector {
  load: number[];
  captured: number[];
  fluid: number;
}

export interface LoopState {
  sectors: LoopSector[];
  isSterile: boolean;
}

export interface TransferDeltaMaps {
  pickup: Float32Array[];
  net: Float32Array[];
  lastStroke: Float32Array[];
}

export interface FilmState {
  resolution: number;
  filmMass: Float32Array[];
  agarWetness: Float32Array;
  depositFluid: Float32Array;
  groove: Float32Array;
}

export interface FounderGrid {
  resolution: number;
  counts: Uint16Array[];
  lag: Float32Array[];
  growthRate: Float32Array[];
}

export interface MassLedger {
  loaded: number[];
  deposited: number[];
  pickedUp: number[];
  discarded: number[];
  sectorTotals: number[];
  filmTotals: number[];
  fluidDeposited: number;
  fluidPickedUp: number;
  fluidDiscarded: number;
}

export interface StrokeProfile {
  speciesIndex: number;
  values: number[];
  centerValue: number;
  sideLobeLeft: number;
  sideLobeRight: number;
  sideLobeAverage: number;
  troughDepth: number;
}

export interface StrokeDiagnostics {
  strokeIndex: number;
  startedAt: number;
  completedAt: number;
  dirtyRect: Rect | null;
  dirtyArea: number;
  strokeCenter: Vec2 | null;
  strokeDirection: Vec2 | null;
  deposited: number[];
  pickedUp: number[];
  net: number[];
  remainingSectorLoads: number[][];
  remainingLoopFluid: number[];
  profiles: StrokeProfile[];
}

export interface ActiveStrokeDiagnostics {
  strokeIndex: number;
  startedAt: number;
  dirtyRect: Rect | null;
  centerSum: Vec2;
  directionSum: Vec2;
  segmentCount: number;
  deposited: number[];
  pickedUp: number[];
  netDelta: Float32Array[];
}

export interface TransferSnapshot {
  film: FilmState;
  loop: LoopState;
  ledger: MassLedger;
  deltaMaps: TransferDeltaMaps;
  dirtyRect: Rect | null;
  strokeActive: boolean;
  activeStroke: ActiveStrokeDiagnostics | null;
  strokeReports: StrokeDiagnostics[];
  lastStrokeReport: StrokeDiagnostics | null;
  lastProfileRow: number | null;
}

export interface DebugLogConfig {
  transfer: boolean;
  seeding: boolean;
  growth: boolean;
  render: boolean;
  verbose: boolean;
}

export interface TransferMetrics {
  conservationError: number[];
  totalFilm: number[];
  totalSector: number[];
  totalDiscarded: number[];
  profile: number[];
  profileCenter: number;
  sideLobeLeft: number;
  sideLobeRight: number;
  profileFlanks: number;
  troughDepth: number;
}

export interface SeedingMetrics {
  founderTotals: number[];
  changedCells: number;
  deterministic: boolean;
  haloArea: number;
}

export type TransferScenarioId =
  | 'balanced-three-species'
  | 'dominant-minor-species'
  | 'sterile-cross-smear'
  | 'reload-through-prior-region';

export interface TransferScenario {
  id: TransferScenarioId;
  name: string;
  description: string;
  recommendedSpeciesIndex: number;
}

export const SIM = {
  defaultResolution: 160,
  displaySize: 360,
  sectorCount: 4,
  sectorOffsets: [-0.028, -0.009, 0.009, 0.028],
  sectorDepositBias: [1.72, 0.1, 0.1, 1.72],
  sectorPickupBias: [1, 1.52, 1.52, 1],
  sectorGrooveBias: [0.2, 0.96, 0.96, 0.2],
  baseSectorLoad: 0.84,
  loopFluidBaseline: 0.22,
  stampSpacing: 0.008,
  pickupRadius: 0.016,
  depositRadius: 0.018,
  pickupOffsetScale: 0.65,
  depositOffsetScale: 1,
  depositRingCenter: 0.8,
  depositRingWidth: 0.11,
  depositRate: 0.05,
  pickupRate: 0.28,
  contactExchangeGain: 2.4,
  overlapExchangeReference: 0.0001,
  overlapPickupBoost: 5.5,
  overlapReleaseBoost: 0.45,
  overlapFilmShiftRate: 1.6,
  loopCarryRetention: 0.99,
  depletedLoopPickupBoost: 3.4,
  fluidDepositRate: 0.018,
  fluidPickupRate: 0.24,
  agarFluidPickupRate: 0.022,
  minLoopFluid: 0.01,
  minAgarWetness: 0.08,
  fluidTransferK: 0.08,
  fluidDecay: 0.989,
  grooveStrength: 0.085,
  remixRate: 0.12,
  founderHalo: 4,
  founderScale: 6500,
  founderLambdaMax: 8,
  founderMinLambda: 0.0025, // keep faint late streaks capable of seeding sparse isolated founders
  founderResponseGain: 1.8, // compress dense bands while preserving sparse late-streak founders
  founderSmoothKernel: 1,
  // Growth constants
  growthDt: 0.5,            // simulation timestep in hours
  checkpointInterval: 2,    // store checkpoint every N hours
  kNutrient: 0.3,           // Monod half-saturation constant
  kWaste: 2.0,              // waste inhibition coefficient
  nutrientConsumption: 0.4, // nutrient consumed per unit biomass
  coverLow: 0.1,            // biomass at coverage = 0
  coverHigh: 0.8,           // biomass at coverage = 1
  colonyRadialRateScale: 0.1,    // converts founder growth rate into colony radius growth per hour
  colonyJitterRadius: 0.38,      // max sub-cell founder jitter in cell units
  colonyStampSoftness: 0.9,      // soft edge width for a stamped colony footprint in cells
  colonyFrontierSamples: 12,     // radial samples used to sense local openness/resources
  colonyMaintenanceRate: 0.05,   // ongoing metabolic draw from established colony coverage
  colonyWasteYield: 0.8,         // waste produced per unit colony activity
} as const;

export const DEFAULT_SPECIES = [
  {
    id: 'staph-aureus',
    name: 'S. aureus',
    color: '#d9b25f',
    renderColor: '#e3d1a1',
    hemolysisType: 'beta',
    isolatedRadius: [0.018, 0.028],
    lagRange: [2, 5],
    growthRateRange: [0.18, 0.3],
    maxBiomass: 1,
    wasteRate: 0.11,
    morphology: 'smooth',
  },
  {
    id: 'e-coli',
    name: 'E. coli',
    color: '#cdd4d8',
    renderColor: '#d8d1c2',
    hemolysisType: 'gamma',
    isolatedRadius: [0.015, 0.024],
    lagRange: [1.5, 4],
    growthRateRange: [0.2, 0.32],
    maxBiomass: 1,
    wasteRate: 0.08,
    morphology: 'smooth',
  },
  {
    id: 'strep-pyogenes',
    name: 'S. pyogenes',
    color: '#d4d0c6',
    renderColor: '#e6dccf',
    hemolysisType: 'beta',
    isolatedRadius: [0.009, 0.015],
    lagRange: [2.5, 6],
    growthRateRange: [0.15, 0.24],
    maxBiomass: 1,
    wasteRate: 0.13,
    morphology: 'rough',
  },
] satisfies SpeciesDef[];

export const DEBUG_LOG_DEFAULT: DebugLogConfig = {
  transfer: false,
  seeding: false,
  growth: false,
  render: false,
  verbose: false,
};

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function createRect(minX: number, minY: number, maxX: number, maxY: number): Rect {
  return { minX, minY, maxX, maxY };
}

function cloneRect(rect: Rect | null): Rect | null {
  return rect ? { ...rect } : null;
}

export function expandRect(rect: Rect, amount: number, resolution: number): Rect {
  return {
    minX: Math.max(0, rect.minX - amount),
    minY: Math.max(0, rect.minY - amount),
    maxX: Math.min(resolution - 1, rect.maxX + amount),
    maxY: Math.min(resolution - 1, rect.maxY + amount),
  };
}

export function unionRect(a: Rect | null, b: Rect | null): Rect | null {
  if (!a) return cloneRect(b);
  if (!b) return cloneRect(a);
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function rectArea(rect: Rect | null): number {
  if (!rect) return 0;
  return (rect.maxX - rect.minX + 1) * (rect.maxY - rect.minY + 1);
}

export function randomPlateSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function createPlateSession(
  speciesConfig: SpeciesDef[] = DEFAULT_SPECIES,
  plateSeed = randomPlateSeed(),
): PlateSession {
  return {
    plateSeed,
    speciesConfig,
    actionLog: [],
    targetTime: 24,
  };
}

function createLoopState(speciesCount: number): LoopState {
  return {
    sectors: Array.from({ length: SIM.sectorCount }, () => ({
      load: Array.from({ length: speciesCount }, () => 0),
      captured: Array.from({ length: speciesCount }, () => 0),
      fluid: 0,
    })),
    isSterile: true,
  };
}

export function createFilmState(speciesCount: number, resolution: number = SIM.defaultResolution): FilmState {
  const cellCount = resolution * resolution;
  return {
    resolution,
    filmMass: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
    agarWetness: new Float32Array(cellCount).fill(0.18),
    depositFluid: new Float32Array(cellCount),
    groove: new Float32Array(cellCount),
  };
}

export function createFounderGrid(speciesCount: number, resolution: number = SIM.defaultResolution): FounderGrid {
  const cellCount = resolution * resolution;
  return {
    resolution,
    counts: Array.from({ length: speciesCount }, () => new Uint16Array(cellCount)),
    lag: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
    growthRate: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
  };
}

function createMassLedger(speciesCount: number): MassLedger {
  return {
    loaded: Array.from({ length: speciesCount }, () => 0),
    deposited: Array.from({ length: speciesCount }, () => 0),
    pickedUp: Array.from({ length: speciesCount }, () => 0),
    discarded: Array.from({ length: speciesCount }, () => 0),
    sectorTotals: Array.from({ length: speciesCount }, () => 0),
    filmTotals: Array.from({ length: speciesCount }, () => 0),
    fluidDeposited: 0,
    fluidPickedUp: 0,
    fluidDiscarded: 0,
  };
}

function createTransferDeltaMaps(
  speciesCount: number,
  resolution: number,
): TransferDeltaMaps {
  const cellCount = resolution * resolution;
  const channels = () => Array.from({ length: speciesCount }, () => new Float32Array(cellCount));

  return {
    pickup: channels(),
    net: channels(),
    lastStroke: channels(),
  };
}

export function createTransferSnapshot(
  speciesCount: number,
  resolution: number = SIM.defaultResolution,
): TransferSnapshot {
  return {
    film: createFilmState(speciesCount, resolution),
    loop: createLoopState(speciesCount),
    ledger: createMassLedger(speciesCount),
    deltaMaps: createTransferDeltaMaps(speciesCount, resolution),
    dirtyRect: null,
    strokeActive: false,
    activeStroke: null,
    strokeReports: [],
    lastStrokeReport: null,
    lastProfileRow: null,
  };
}

export function pointToCell(point: Vec2, resolution: number): Vec2 | null {
  const gx = Math.floor(point.x * resolution);
  const gy = Math.floor(point.y * resolution);
  if (gx < 0 || gx >= resolution || gy < 0 || gy >= resolution) return null;
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  if (dx * dx + dy * dy > 0.25) return null;
  return { x: gx, y: gy };
}

export function cellIndex(x: number, y: number, resolution: number): number {
  return y * resolution + x;
}

export function normalizeSpeciesLoads(values: number[], speciesCount: number): number[] {
  const safe = Array.from({ length: speciesCount }, (_, index) => Math.max(0, values[index] ?? 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return Array.from({ length: speciesCount }, () => 1 / speciesCount);
  }
  return safe.map((value) => value / total);
}

export function totalFloat32(values: Float32Array): number {
  let total = 0;
  for (let index = 0; index < values.length; index += 1) total += values[index];
  return total;
}

export function totalUint16(values: Uint16Array): number {
  let total = 0;
  for (let index = 0; index < values.length; index += 1) total += values[index];
  return total;
}

// ── Growth ──────────────────────────────────────────────────────────────────

export interface BiomassState {
  resolution: number;
  biomass: Float32Array[];       // per-species per-cell
  coverage: Float32Array[];      // biological coverage 0–1, feeds back into crowding
  totalCoverage: Float32Array;   // sum across species, capped at 1
  nutrient: Float32Array;        // shared resource: 1=full, 0=depleted
  waste: Float32Array;           // accumulated inhibitor: 0=clean, grows over time
}

export function createBiomassState(speciesCount: number, resolution: number = SIM.defaultResolution): BiomassState {
  const cellCount = resolution * resolution;
  return {
    resolution,
    biomass: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
    coverage: Array.from({ length: speciesCount }, () => new Float32Array(cellCount)),
    totalCoverage: new Float32Array(cellCount),
    nutrient: new Float32Array(cellCount).fill(1),
    waste: new Float32Array(cellCount),
  };
}

export interface RenderMaps {
  resolution: number;
  height: Float32Array;
  albedo: Uint8ClampedArray;
  roughness: Float32Array;
  wetMask: Float32Array;
  grooveMask: Float32Array;
  hemolysisAlpha: Float32Array;
  hemolysisBeta: Float32Array;
}

export function createRenderMaps(resolution: number = SIM.defaultResolution): RenderMaps {
  const cellCount = resolution * resolution;
  return {
    resolution,
    height: new Float32Array(cellCount),
    albedo: new Uint8ClampedArray(cellCount * 4),
    roughness: new Float32Array(cellCount),
    wetMask: new Float32Array(cellCount),
    grooveMask: new Float32Array(cellCount),
    hemolysisAlpha: new Float32Array(cellCount),
    hemolysisBeta: new Float32Array(cellCount),
  };
}
