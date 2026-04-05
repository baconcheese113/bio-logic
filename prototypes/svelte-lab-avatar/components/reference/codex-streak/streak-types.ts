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

export type PlateMedium = 'blood-agar' | 'nutrient-agar' | 'macconkey';
export type HemolysisType = 'alpha' | 'beta' | 'gamma';
export type SpeciesMorphology = 'smooth' | 'rough' | 'mucoid' | 'spreading' | 'draughtsman';
export type InspectionLightMode = 'surface' | 'transmitted';

export interface MediumDef {
  id: PlateMedium;
  name: string;
  description: string;
  agarColor: string;
  agarShadowColor: string;
  transferResidueColor: string;
  wetHighlightColor: string;
  betaHemolysisColor: string;
  alphaHemolysisColor: string;
  supportsHemolysis: boolean;
}

export interface SpeciesPhenotype {
  colonyColorLabel: string;
  colonyColor: string;
  renderColor: string;
  opacity: number;
  isolatedRadius: [number, number];
  hemolysisType: HemolysisType;
  hemolysisRatio: number;
  morphology: SpeciesMorphology;
  roughness: number;
  sheen: number;
  differentialLabel: string | null;
}

export interface SpeciesDef {
  id: string;
  name: string;
  color: string;
  lagRange: [number, number];
  growthRateRange: [number, number];
  maxBiomass: number;
  wasteRate: number;
  media: Partial<Record<PlateMedium, SpeciesPhenotype>>;
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
  medium: PlateMedium;
  actionLog: Action[];
  targetTime: number;
}

export interface IsolateCandidate {
  id: string;
  center: Vec2;
  bounds: Rect;
  dominantSpeciesId: string;
  dominantSpeciesName: string;
  dominantSpeciesIndex: number;
  purity: number;
  confidence: number;
  crowded: boolean;
  colonyRadiusCells: number;
  colonyDiameterMm: number;
  localHemolysisSignal: number;
  hemolysisLabel: string;
  morphologyLabel: string;
  colonyColorLabel: string;
  differentialLabel: string | null;
  transmittedLightRecommended: boolean;
}

export interface InspectionSnapshot {
  candidateId: string;
  medium: PlateMedium;
  lightMode: InspectionLightMode;
  bounds: Rect;
  title: string;
  observationLines: string[];
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

export interface IdentificationMetrics {
  candidateCount: number;
  highConfidenceCount: number;
  crowdedCount: number;
  meanPurity: number;
  maxConfidence: number;
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

export const DEFAULT_MEDIUM: PlateMedium = 'blood-agar';

export const PLATE_MEDIA: readonly MediumDef[] = [
  {
    id: 'blood-agar',
    name: 'Blood Agar',
    description: 'Differential medium for hemolysis and primary isolation.',
    agarColor: '#772120',
    agarShadowColor: '#4a1615',
    transferResidueColor: '#8a4038',
    wetHighlightColor: '#c0a08f',
    betaHemolysisColor: '#d5bc98',
    alphaHemolysisColor: '#7f6958',
    supportsHemolysis: true,
  },
  {
    id: 'nutrient-agar',
    name: 'Nutrient Agar',
    description: 'General-purpose medium with no blood-cell hemolysis readout.',
    agarColor: '#8a7246',
    agarShadowColor: '#5a4727',
    transferResidueColor: '#9f8357',
    wetHighlightColor: '#dac59d',
    betaHemolysisColor: '#8a7246',
    alphaHemolysisColor: '#8a7246',
    supportsHemolysis: false,
  },
  {
    id: 'macconkey',
    name: 'MacConkey',
    description: 'Selective and differential medium for gram-negative enterics.',
    agarColor: '#8d4a63',
    agarShadowColor: '#612b43',
    transferResidueColor: '#9d5d76',
    wetHighlightColor: '#ddb5c0',
    betaHemolysisColor: '#8d4a63',
    alphaHemolysisColor: '#8d4a63',
    supportsHemolysis: false,
  },
] as const;

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
    lagRange: [2, 5],
    growthRateRange: [0.18, 0.3],
    maxBiomass: 1.02,
    wasteRate: 0.11,
    media: {
      'blood-agar': {
        colonyColorLabel: 'golden',
        colonyColor: '#d1b05a',
        renderColor: '#d3ab56',
        opacity: 0.9,
        isolatedRadius: [0.016, 0.028],
        hemolysisType: 'beta',
        hemolysisRatio: 1.35,
        morphology: 'smooth',
        roughness: 0.38,
        sheen: 0.58,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: 'golden',
        colonyColor: '#cfb468',
        renderColor: '#d8bb76',
        opacity: 0.88,
        isolatedRadius: [0.014, 0.025],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'smooth',
        roughness: 0.36,
        sheen: 0.54,
        differentialLabel: null,
      },
    },
  },
  {
    id: 'strep-pyogenes',
    name: 'S. pyogenes',
    color: '#d9d3c3',
    lagRange: [2.5, 6],
    growthRateRange: [0.15, 0.24],
    maxBiomass: 0.96,
    wasteRate: 0.13,
    media: {
      'blood-agar': {
        colonyColorLabel: 'gray-white',
        colonyColor: '#c8c1b6',
        renderColor: '#cfc9bd',
        opacity: 0.82,
        isolatedRadius: [0.006, 0.011],
        hemolysisType: 'beta',
        hemolysisRatio: 2.1,
        morphology: 'rough',
        roughness: 0.74,
        sheen: 0.24,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: 'gray',
        colonyColor: '#c3bbaf',
        renderColor: '#d2c8bb',
        opacity: 0.8,
        isolatedRadius: [0.005, 0.009],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'rough',
        roughness: 0.72,
        sheen: 0.2,
        differentialLabel: null,
      },
    },
  },
  {
    id: 'strep-pneumoniae',
    name: 'S. pneumoniae',
    color: '#c2bfba',
    lagRange: [3, 6.5],
    growthRateRange: [0.12, 0.22],
    maxBiomass: 0.9,
    wasteRate: 0.12,
    media: {
      'blood-agar': {
        colonyColorLabel: 'gray-green',
        colonyColor: '#b8ae98',
        renderColor: '#b9ae96',
        opacity: 0.74,
        isolatedRadius: [0.007, 0.012],
        hemolysisType: 'alpha',
        hemolysisRatio: 1.25,
        morphology: 'draughtsman',
        roughness: 0.69,
        sheen: 0.16,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: 'gray',
        colonyColor: '#bbb3a5',
        renderColor: '#c7bbad',
        opacity: 0.72,
        isolatedRadius: [0.006, 0.011],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'draughtsman',
        roughness: 0.68,
        sheen: 0.14,
        differentialLabel: null,
      },
    },
  },
  {
    id: 'e-coli',
    name: 'E. coli',
    color: '#d7d8d3',
    lagRange: [1.5, 4],
    growthRateRange: [0.2, 0.32],
    maxBiomass: 1,
    wasteRate: 0.08,
    media: {
      'blood-agar': {
        colonyColorLabel: 'gray-white',
        colonyColor: '#d6d0c8',
        renderColor: '#ddd6ce',
        opacity: 0.84,
        isolatedRadius: [0.014, 0.024],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'smooth',
        roughness: 0.4,
        sheen: 0.44,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: 'gray',
        colonyColor: '#ccc6bc',
        renderColor: '#d2cbc0',
        opacity: 0.82,
        isolatedRadius: [0.013, 0.022],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'smooth',
        roughness: 0.42,
        sheen: 0.4,
        differentialLabel: null,
      },
      macconkey: {
        colonyColorLabel: 'pink',
        colonyColor: '#d36e8c',
        renderColor: '#f0afc3',
        opacity: 0.86,
        isolatedRadius: [0.013, 0.023],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'smooth',
        roughness: 0.44,
        sheen: 0.34,
        differentialLabel: 'Pink, lactose fermenter',
      },
    },
  },
  {
    id: 'klebsiella-pneumoniae',
    name: 'K. pneumoniae',
    color: '#d5b5d1',
    lagRange: [2, 4.5],
    growthRateRange: [0.18, 0.28],
    maxBiomass: 1.08,
    wasteRate: 0.09,
    media: {
      'blood-agar': {
        colonyColorLabel: 'cream-mucoid',
        colonyColor: '#e1d3b7',
        renderColor: '#ead9ba',
        opacity: 0.92,
        isolatedRadius: [0.02, 0.033],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'mucoid',
        roughness: 0.28,
        sheen: 0.68,
        differentialLabel: null,
      },
      'nutrient-agar': {
        colonyColorLabel: 'cream-mucoid',
        colonyColor: '#d8cbb3',
        renderColor: '#dfd1bb',
        opacity: 0.9,
        isolatedRadius: [0.018, 0.03],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'mucoid',
        roughness: 0.27,
        sheen: 0.64,
        differentialLabel: null,
      },
      macconkey: {
        colonyColorLabel: 'pink mucoid',
        colonyColor: '#d07aa7',
        renderColor: '#ebb7cf',
        opacity: 0.94,
        isolatedRadius: [0.02, 0.033],
        hemolysisType: 'gamma',
        hemolysisRatio: 0,
        morphology: 'mucoid',
        roughness: 0.25,
        sheen: 0.72,
        differentialLabel: 'Pink mucoid, lactose fermenter',
      },
    },
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
  plateSeed: number | undefined = randomPlateSeed(),
  medium: PlateMedium = DEFAULT_MEDIUM,
): PlateSession {
  return {
    plateSeed: plateSeed ?? randomPlateSeed(),
    speciesConfig,
    medium,
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

export function getMediumDef(medium: PlateMedium): MediumDef {
  const profile = PLATE_MEDIA.find((entry) => entry.id === medium);
  if (!profile) {
    throw new Error(`Unknown plate medium: ${medium}`);
  }
  return profile;
}

export function getSpeciesPhenotype(
  species: SpeciesDef,
  medium: PlateMedium,
): SpeciesPhenotype | null {
  return species.media[medium] ?? null;
}

export function getSpeciesMorphologyLabel(morphology: SpeciesMorphology): string {
  switch (morphology) {
    case 'smooth':
      return 'smooth';
    case 'rough':
      return 'rough';
    case 'mucoid':
      return 'mucoid';
    case 'spreading':
      return 'spreading';
    case 'draughtsman':
      return 'draughtsman-like';
  }
}

export function getHemolysisLabel(hemolysisType: HemolysisType): string {
  switch (hemolysisType) {
    case 'alpha':
      return 'alpha hemolysis';
    case 'beta':
      return 'beta hemolysis';
    case 'gamma':
    default:
      return 'no hemolysis';
  }
}
