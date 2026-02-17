/**
 * Shared types for BioLogic Lab View prototypes
 *
 * Taxonomy: Structure > Fixture > Equipment > Consumable
 * See docs/taxonomy.md for full reference.
 */

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

export type GramResult = 'positive' | 'negative';
export type MorphologyShape = 'cocci' | 'bacilli' | 'spirilla' | 'coccobacilli';
export type MorphologyArrangement = 'singles' | 'pairs' | 'chains' | 'clusters' | 'tetrads';
export type HemolysisType = 'alpha' | 'beta' | 'gamma';
export type ColonyColor = 'golden' | 'white' | 'gray' | 'green' | 'cream' | 'mucoid';

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

export type CaseStatus = 'available' | 'active' | 'submitted' | 'completed';

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
  | 'blood' | 'sputum' | 'csf' | 'urine' | 'stool'
  | 'nutrient-agar' | 'blood-agar' | 'gelatin'
  | 'agar-powder' | 'gelatin-powder' | 'peptone'
  | 'defibrinated-blood' | 'distilled-water'
  | 'bacteria-culture';

export interface ContainerDef {
  capacity: number;
  acceptedSubstances: SubstanceType[];
  sealable: boolean;
}

export interface SubstanceContents {
  substance: SubstanceType;
  volume: number;
  sealed: boolean;
  meta?: SubstanceMeta;
}

export type SubstanceMeta =
  | { kind: 'culture'; organismId: string; phase: PlatePhase; densityGrid?: number[][] }
  | { kind: 'sample'; patientId: string; collectedAtTick: number; condition: SampleCondition }
  | { kind: 'prepared-media'; cooledAtTick: number };


// ============================================================
//  ITEM DEFINITION REGISTRY
// ============================================================

export interface ItemDef {
  label: string;
  icon: string;
  gridSize: [number, number];
  placement: 'benchtop' | 'freeStanding';
  maxStack: number;
  consumable: boolean;
  portable: boolean;
  container?: ContainerDef;
}

export const ITEM_DEFS = {
  // Equipment — reusable, stays on benches
  'bunsen-burner':    { label: 'Bunsen Burner',    icon: '🔥', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'inoculation-loop': { label: 'Inoculation Loop', icon: '〰️', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'microscope':       { label: 'Brass Microscope',  icon: '🔬', gridSize: [2, 2] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'hand-centrifuge':  { label: 'Hand Centrifuge',   icon: '🔄', gridSize: [2, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'staining-rack':    { label: 'Staining Rack',     icon: '🧪', gridSize: [2, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'steam-sterilizer': { label: 'Steam Sterilizer',  icon: '♨️', gridSize: [2, 2] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'flask':            { label: 'Laboratory Flask',   icon: '⚗️', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: true,
                        container: { capacity: 5, acceptedSubstances: ['distilled-water', 'nutrient-agar', 'blood-agar', 'gelatin'] as SubstanceType[], sealable: true } },

  // Containers — hold substances, portable
  'empty-dish':       { label: 'Petri Dish',         icon: '🧫', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 5, consumable: false, portable: true,
                        container: { capacity: 1, acceptedSubstances: ['nutrient-agar', 'blood-agar', 'gelatin', 'bacteria-culture'] as SubstanceType[], sealable: true } },
  'sample-vial':      { label: 'Sample Vial',        icon: '🧪', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: true,
                        container: { capacity: 1, acceptedSubstances: ['blood', 'sputum', 'csf', 'urine', 'stool'] as SubstanceType[], sealable: true } },

  // Consumables — depletable supplies, portable
  'agar-powder':        { label: 'Agar Powder',        icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'gelatin-powder':     { label: 'Gelatin Powder',      icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'beef-extract':       { label: 'Beef Extract',        icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'peptone':            { label: 'Peptone',              icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'defibrinated-blood': { label: 'Defibrinated Blood',  icon: '🩸', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'distilled-water':    { label: 'Distilled Water',      icon: '💧', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
} as const satisfies Record<string, ItemDef>;

export type ItemType = keyof typeof ITEM_DEFS;


// ============================================================
//  RUNTIME ITEM INSTANCES
// ============================================================

export interface Item {
  id: string;
  type: ItemType;
  quantity: number;
  state?: ItemState;
  contents?: SubstanceContents;
}

export type ItemState =
  | { kind: 'microscope'; loadedSlideId: string | null; focusLevel: number }
  | { kind: 'bunsen-burner'; lit: boolean }
  | { kind: 'staining-rack'; loadedSlides: string[]; currentStain: string | null }
  | { kind: 'centrifuge'; loadedVials: string[]; spinning: boolean; rpm: number };


// ============================================================
//  CULTURE PLATE STATE (backward compat, derivable from Item)
// ============================================================

export type PlatePhase = 'empty' | 'poured' | 'cooling' | 'ready' | 'streaked' | 'incubating' | 'grown';

export interface CulturePlateState {
  id: string;
  mediaType: MediaType | null;
  phase: PlatePhase;
  label: string;
}

/** Extract CulturePlateState from an Item, or null if not a culture plate */
export function getCulturePlate(item: Item): CulturePlateState | null {
  if (item.type !== 'empty-dish' || !item.contents) return null;
  const meta = item.contents.meta;
  if (meta?.kind === 'culture') {
    const mediaType = (['blood-agar', 'nutrient-agar', 'gelatin'] as MediaType[]).includes(item.contents.substance as MediaType)
      ? item.contents.substance as MediaType
      : null;
    return { id: item.id, mediaType, phase: meta.phase, label: MEDIA_RECIPES[mediaType ?? 'nutrient-agar'].label };
  }
  if (meta?.kind === 'prepared-media') {
    const mediaType = item.contents.substance as MediaType;
    return { id: item.id, mediaType, phase: 'ready', label: MEDIA_RECIPES[mediaType].label };
  }
  return null;
}


// ============================================================
//  MEDIA TYPES & RECIPES
// ============================================================

export type MediaType = 'blood-agar' | 'gelatin' | 'nutrient-agar';

export const MEDIA_RECIPES = {
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
} as const satisfies Record<MediaType, { label: string; ingredients: ItemType[]; prepTicks: number }>;

/** Check which recipes can be made from the items on a fixture */
export function getAvailableRecipes(items: Item[]): MediaType[] {
  const typeSet = new Set(items.filter(i => ITEM_DEFS[i.type].consumable || i.type === 'empty-dish').map(i => i.type));
  return (Object.entries(MEDIA_RECIPES) as [MediaType, typeof MEDIA_RECIPES[MediaType]][])
    .filter(([, recipe]) => recipe.ingredients.every(ing => typeSet.has(ing)))
    .map(([type]) => type);
}

/** Remove recipe ingredients from an items array, returning new array */
export function consumeRecipeIngredients(items: Item[], mediaType: MediaType): Item[] {
  const recipe = MEDIA_RECIPES[mediaType];
  const remaining = [...items];
  for (const ingredient of recipe.ingredients) {
    const idx = remaining.findIndex(i => i.type === ingredient);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return remaining;
}

// === Active Prep (background processing) ===

export interface ActivePrep {
  fixtureId: string;
  mediaType: MediaType;
  startTick: number;
  duration: number;
}


// ============================================================
//  FIXTURE DEFINITIONS (replaces FURNITURE_DEFS)
// ============================================================

export interface FixtureDef {
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
  'workbench': { label: 'Workbench',       icon: '🪵', gridSize: [2, 1] as [number, number], capacity: 8,  surfaceGrid: [4, 2] as [number, number] },
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

// Backward-compat aliases (will be removed after all refs migrate)
/** @deprecated Use Fixture instead */
export type Furniture = Fixture;
/** @deprecated Use FIXTURE_DEFS instead */
export const FURNITURE_DEFS = FIXTURE_DEFS;


// ============================================================
//  WORKBENCH MODE DETECTION (temporary — removed in Phase 5)
// ============================================================

export type WorkbenchMode = 'culture' | 'microscope' | 'staining' | 'prep' | 'general';

export function detectWorkbenchMode(items: Item[]): WorkbenchMode {
  const has = (t: ItemType) => items.some(i => i.type === t);
  if (has('microscope')) return 'microscope';
  if (has('bunsen-burner') || has('inoculation-loop')) return 'culture';
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

export type LabEvent =
  | { type: 'fixture-clicked'; fixtureId: string }
  | { type: 'tile-clicked'; position: GridPosition }
  | { type: 'item-picked-up'; itemIndex: number }
  | { type: 'item-placed'; fixtureId: string }
  | { type: 'speed-changed'; speed: number }
  | { type: 'pause-toggled'; isPaused: boolean };


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

export const CONDITION_OPACITY: Record<SampleCondition, number> = {
  'fresh': 1.0,
  'degraded': 0.6,
  'spoiled': 0.3,
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


// ============================================================
//  ITEM HELPER FUNCTIONS
// ============================================================

export function getItemDef(item: Item): ItemDef {
  return ITEM_DEFS[item.type];
}

export function getItemIcon(item: Item): string {
  return ITEM_DEFS[item.type].icon;
}

export function getItemLabel(item: Item): string {
  const def = ITEM_DEFS[item.type];
  const plate = getCulturePlate(item);
  if (plate) return plate.label;
  if (item.quantity > 1) return `${def.label} ×${item.quantity}`;
  return def.label;
}

export function getItemSize(item: Item): number {
  return ITEM_DEFS[item.type].gridSize[0];
}

export function getCarryingLoad(items: Item[]): number {
  return items.reduce((sum, item) => sum + getItemSize(item), 0);
}

export function isPortable(item: Item): boolean {
  return ITEM_DEFS[item.type].portable;
}

export function isContainer(item: Item): boolean {
  return !!(ITEM_DEFS[item.type] as ItemDef).container;
}

export function isCulturePlate(item: Item): boolean {
  return item.type === 'empty-dish' && !!item.contents;
}
