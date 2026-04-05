/**
 * Shared types for BioLogic Lab View prototypes
 *
 * Taxonomy: Structure > Fixture > Equipment > Consumable
 * See docs/taxonomy.md for full reference.
 */

import type {
  Action as CodexPlateAction,
  PlateMedium as CodexPlateMedium,
  SpeciesDef as CodexSpeciesDef,
} from '../components/reference/codex-streak/streak-types';
import type { ItemType, ItemState } from '../components/workbench/item-defs';
export type { ItemType, ItemState };

// === Grid & Position ===

export interface GridPosition {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

// === Patient Appearance (procedural faces) ===

export interface PatientAppearance {
  faceShape: 'round' | 'oval' | 'square';
  skinTone: string;  // hex color
  eyeStyle: 'normal' | 'tired' | 'worried';
  hairStyle: 'bald' | 'short' | 'long' | 'curly';
  hairColor: string; // hex color
}

export type PatientStatus = 'stable' | 'guarded' | 'declining' | 'critical' | 'treated' | 'worsened' | 'departed';

export interface DiagnosisResult {
  submitted: Diagnosis;
  correct: Diagnosis;
  isCorrect: boolean;
}

export interface Patient {
  id: string;
  caseId: string;
  name: string;
  appearance: PatientAppearance;
  status: PatientStatus;
  synopsis: string;
  availableSamples: SampleType[];
/** Samples already collected from this patient */
  collectedSamples: SampleType[];
/** Ticks remaining before patient leaves */
  patienceTicks: number;
/** Max patience for calculating bar fill */
  maxPatienceTicks: number;
/** Which bench tile the patient occupies */
  benchPosition: GridPosition;
/** Tick when patient arrived */
  arrivedAtTick: number;
/** The correct diagnosis for this case */
  correctDiagnosis: Diagnosis;
/** The correct organism for this case */
  correctOrganism: string;
/** Expected findings when performing tests */
  findings: CaseFindings;
/** Result of player's diagnosis attempt */
  diagnosisResult?: DiagnosisResult;
}

// === Samples ===

export type SampleType =
  | 'blood'
  | 'sputum'
  | 'wound-swab'
  | 'throat-swab'
  | 'urine'
  | 'stool'
  | 'csf'
  | 'slide';

// === Observations ===

type GramResult = 'positive' | 'negative';
type MorphologyShape = 'cocci' | 'bacilli' | 'spirilla' | 'coccobacilli';
type MorphologyArrangement = 'singles' | 'pairs' | 'chains' | 'clusters' | 'tetrads';
export type HemolysisType = 'alpha' | 'beta' | 'gamma';
export type ColonyColor = 'golden' | 'white' | 'gray' | 'green' | 'cream' | 'mucoid' | 'pink' | 'colorless';

export interface MicroscopeFindings {
  gram: GramResult;
  shape: MorphologyShape;
  arrangement: MorphologyArrangement;
  acidFast?: boolean;
  capsule?: boolean;
  spores?: boolean;
}

export type GramType = 'positive' | 'negative';

export interface CultureFindings {
  growth: boolean;
  hemolysis: HemolysisType;
  colonyColor: ColonyColor;
  lactoseFermenter?: boolean;
  gramType: GramType;
  /** Organism-specific isolated colony radius [min, max] in plate-fraction units.
   *  If absent, colony-generator uses its built-in defaults. */
  isolatedRadiusRange?: [number, number];
}

export interface CaseFindings {
  microscope: MicroscopeFindings;
  culture: CultureFindings;
}

export type TreatmentOption =
  | 'carbolic-wash'
  | 'surgical-debridement'
  | 'isolate-patient'
  | 'supportive-care'
  | 'mercury-treatment'
  | 'quinine';

export type OrganismCategory = 'gram-positive' | 'gram-negative' | 'acid-fast' | 'unknown';

export interface Diagnosis {
  organism: string;         // e.g., 'staphylococcus-aureus'
  category: OrganismCategory;
  treatment: TreatmentOption;
}

export interface TreatmentOutcome {
  correct: { result: 'recovered'; message: string; fundsEarned: number };
  partial: { result: 'improved'; message: string; fundsEarned: number };
  wrong: { result: 'worsened'; message: string; fundsEarned: number };
}

export type ObservationSource = 'microscope' | 'culture' | 'staining' | 'serology' | 'general';

export interface Observation {
  id: string;
  patientId: string;    // links observation to specific patient
  caseId: string;
  patientName: string;
  source: ObservationSource;
  field: string;      // e.g., 'gram', 'shape', 'hemolysis'
  value: string;      // e.g., 'positive', 'cocci', 'beta'
  timestamp: number;  // game tick when recorded
}

// === Cases ===

type CaseStatus = 'available' | 'active' | 'submitted' | 'completed';

export interface Case {
  id: string;
  title: string;
  patientName: string;
  synopsis: string;
  status: CaseStatus;
  availableSamples: SampleType[];
  correctOrganism: string;
}

export type SampleCondition = 'fresh' | 'degraded' | 'spoiled';

export interface Sample {
  id: string;
  type: SampleType;
  caseId: string;
/** The patient this sample came from */
  patientId: string;
  condition: SampleCondition;
  collectedAtTick: number;
/** Where the sample currently is */
  location: SampleLocation;
/** For display purposes */
  label: string;
}

export type SampleLocation =
  | { type: 'fixture'; fixtureId: string }
  | { type: 'player' }
  | { type: 'storage'; storageId: string };


// ============================================================
//  SUBSTANCE & CONTAINER SYSTEM
// ============================================================

export type SubstanceType =
  | 'blood' | 'sputum' | 'csf' | 'urine' | 'stool' | 'wound-swab' | 'throat-swab' | 'slide'
  | 'nutrient-agar' | 'blood-agar' | 'gelatin' | 'macconkey'
  | 'agar-powder' | 'gelatin-powder' | 'peptone'
  | 'defibrinated-blood' | 'distilled-water'
  | 'bacteria-culture';

export interface SubstanceContents {
  substance: SubstanceType;
  volume: number;
  sealed: boolean;
  meta?: SubstanceMeta;
}

export interface CulturePlateMeta {
  kind: 'culture';
  phase: PlatePhase;
  medium: CodexPlateMedium;
  plateSeed: number;
  speciesConfig: CodexSpeciesDef[];
  actionLog: CodexPlateAction[];
  contaminationEvents: number;
  totalOpenSeconds: number;
  incubationStartedAtTick: number | null;
}

export interface SampleMeta {
  kind: 'sample';
  patientId: string;
  collectedAtTick: number;
  condition: SampleCondition;
  organismId?: string;
  cultureFindings?: CultureFindings;
}

export interface PreparedMediaMeta {
  kind: 'prepared-media';
  cooledAtTick: number;
}

type SubstanceMeta =
  | CulturePlateMeta
  | SampleMeta
  | PreparedMediaMeta;


// ============================================================
//  RUNTIME ITEM INSTANCES
// ============================================================

export interface Item {
  id: string;
  type: ItemType;
  quantity: number;
  gridPosition?: { col: number; row: number };
  state?: ItemState;
  contents?: SubstanceContents;
}


// ============================================================
//  CULTURE PLATE STATE (backward compat, derivable from Item)
// ============================================================

export type PlatePhase = 'empty' | 'poured' | 'cooling' | 'ready' | 'streaked' | 'incubating' | 'grown';

interface CulturePlateState {
  id: string;
  mediaType: MediaType | null;
  phase: PlatePhase;
  label: string;
  meta: CulturePlateMeta | null;
}

/** Extract CulturePlateState from an Item, or null if not a culture plate */
export function getCulturePlate(item: Item): CulturePlateState | null {
  if (item.type !== 'empty-dish' || !item.contents) return null;
  const meta = item.contents.meta;
  if (meta?.kind === 'culture') {
    const mediaType = (['blood-agar', 'nutrient-agar', 'gelatin', 'macconkey'] as MediaType[]).includes(item.contents.substance as MediaType)
      ? item.contents.substance as MediaType
      : null;
    return { id: item.id, mediaType, phase: meta.phase, label: MEDIA_RECIPES[mediaType ?? 'nutrient-agar'].label, meta };
  }
  if (meta?.kind === 'prepared-media') {
    const mediaType = item.contents.substance as MediaType;
    return { id: item.id, mediaType, phase: 'ready', label: MEDIA_RECIPES[mediaType].label, meta: null };
  }
  return null;
}


// ============================================================
//  MEDIA TYPES & RECIPES
// ============================================================

export type MediaType = 'blood-agar' | 'gelatin' | 'nutrient-agar' | 'macconkey';

const MEDIA_RECIPES = {
  'nutrient-agar': {
    label: 'Nutrient Agar Plate',
    ingredients: ['empty-dish', 'agar-powder', 'peptone'] as ItemType[],
    prepTicks: 300,
  },
  'blood-agar': {
    label: 'Blood Agar Plate',
    ingredients: ['empty-dish', 'agar-powder', 'defibrinated-blood'] as ItemType[],
    prepTicks: 400,
  },
  'gelatin': {
    label: 'Gelatin Plate',
    ingredients: ['empty-dish', 'gelatin-powder', 'peptone'] as ItemType[],
    prepTicks: 250,
  },
  'macconkey': {
    label: 'MacConkey Agar Plate',
    ingredients: ['empty-dish', 'agar-powder', 'peptone'] as ItemType[], // simplified
    prepTicks: 350,
  },
} as const satisfies Record<MediaType, { label: string; ingredients: ItemType[]; prepTicks: number }>;

// === Active Prep (background processing) ===

export interface ActivePrep {
  fixtureId: string;
  mediaType: MediaType;
  startTick: number;
  duration: number;
}


// ============================================================
//  FIXTURE DEFINITIONS
// ============================================================

interface FixtureDef {
  label: string;
  icon: string;
  gridSize: [number, number];
  capacity: number;
  surfaceGrid?: [number, number];
  storageGrid?: [number, number];
  requiresGas?: boolean;
  requiresWater?: boolean;
}

export const FIXTURE_DEFS = {
  'workbench': { label: 'Workbench',       icon: '🪵', gridSize: [2, 1] as [number, number], capacity: 8,  surfaceGrid: [4, 3] as [number, number] },
  'cabinet':   { label: 'Reagent Cabinet', icon: '🗄️', gridSize: [2, 1] as [number, number], capacity: 20, storageGrid: [3, 4] as [number, number] },
  'ice-box':   { label: 'Ice Box',         icon: '🧊', gridSize: [2, 2] as [number, number], capacity: 6,  storageGrid: [2, 2] as [number, number] },
} as const satisfies Record<string, FixtureDef>;

export type FixtureType = keyof typeof FIXTURE_DEFS;

export interface Fixture {
  id: string;
  type: FixtureType;
  name: string;
  position: GridPosition;
  items: Item[];
}



// ============================================================
//  WORKBENCH MODE DETECTION (temporary — removed in Phase 5)
// ============================================================

type WorkbenchMode = 'culture' | 'microscope' | 'staining' | 'prep' | 'general';

export function detectWorkbenchMode(items: Item[]): WorkbenchMode {
  const has = (t: ItemType) => items.some(i => i.type === t);
  if (has('microscope')) return 'microscope';
  if (has('bunsen-burner') && has('inoculation-loop')) return 'culture';
  if (has('staining-rack')) return 'staining';
  if (has('flask') || has('steam-sterilizer')) return 'prep';
  return 'general';
}


// ============================================================
//  PLAYER
// ============================================================

export interface Player {
  position: GridPosition;
  carrying: Item[];
  carryCapacity: number;
  facing: Direction;
  isMoving: boolean;
  targetPosition: GridPosition | null;
}


// ============================================================
//  LAB GRID
// ============================================================

export type TileType = 'floor' | 'wall' | 'door' | 'gas-lamp' | 'window' | 'drain' | 'waiting-bench';

export interface LabTile {
  type: TileType;
  walkable: boolean;
  fixtureId: string | null;
  patientId: string | null;
}

// === Camera ===

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}


// ============================================================
//  LAB STATE (main state container)
// ============================================================

export interface LabState {
  width: number;
  height: number;
  grid: LabTile[][];
  fixtures: Fixture[];
  samples: Sample[];
  player: Player;
  camera: CameraState;
  currentTick: number;
  isPaused: boolean;
  speed: number;
  patients: Patient[];
  activeCases: Case[];
  observations: Observation[];
  stats: PlayerStats;
}

export interface PlayerStats {
  livesaved: number;
  livesLost: number;
  casesCompleted: number;
  funds: number;
}


// ============================================================
//  EVENTS
// ============================================================

// ============================================================
//  UI HELPERS
// ============================================================

export const SAMPLE_COLORS: Record<SampleType, string> = {
  'blood': '#c62828',
  'sputum': '#f9a825',
  'wound-swab': '#e0e0e0',
  'throat-swab': '#ffccbc',
  'urine': '#fff176',
  'stool': '#795548',
  'csf': '#b3e5fc',
  'slide': '#c8a2c8',
};

export const OBSERVATION_ICONS: Record<ObservationSource, string> = {
  'microscope': '🔬',
  'culture': '🦠',
  'staining': '🧪',
  'serology': '💉',
  'general': '📋',
};

export const PATIENCE_BY_STATUS: Record<PatientStatus, number> = {
  'stable': 36000,    // ~1 hour at 1x (10 ticks/sec)
  'guarded': 18000,   // ~30 min
  'declining': 7200,  // ~12 min
  'critical': 2400,   // ~4 min
  'treated': 0,       // resolved - no longer waiting
  'worsened': 0,      // resolved - no longer waiting
  'departed': 0,      // resolved - no longer waiting
};

export const SKIN_TONES = ['#ffe0bd', '#e5c298', '#c68642', '#8d5524', '#5c3317'];
export const HAIR_COLORS = ['#090806', '#2c222b', '#71635a', '#b7a69e', '#d6c4c2', '#cabfb1'];





