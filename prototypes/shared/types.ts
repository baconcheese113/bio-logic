/**
 * Shared types for BioLogic Lab View prototypes
 * Both Svelte-only and Phaser approaches use these identical types
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
  | { type: 'furniture'; furnitureId: string }
  | { type: 'player' }
  | { type: 'storage'; storageId: string };

// === Media Types ===

export type MediaType = 'blood-agar' | 'gelatin' | 'nutrient-agar';

// === Supplies & Equipment (data-driven, types inferred) ===

export const SUPPLIES = {
  'agar-powder': { label: 'Agar Powder', icon: '🫙', size: 1 },
  'gelatin-powder': { label: 'Gelatin Powder', icon: '🫙', size: 1 },
  'beef-extract': { label: 'Beef Extract', icon: '🫙', size: 1 },
  'peptone': { label: 'Peptone', icon: '🫙', size: 1 },
  'defibrinated-blood': { label: 'Defibrinated Blood', icon: '🩸', size: 1 },
  'empty-dish': { label: 'Empty Petri Dish', icon: '🧫', size: 1 },
  'distilled-water': { label: 'Distilled Water', icon: '💧', size: 1 },
} as const;

export type SupplyType = keyof typeof SUPPLIES;

export const EQUIPMENT = {
  'bunsen-burner': { label: 'Bunsen Burner', icon: '🔥', size: 1 },
  'inoculation-loop': { label: 'Inoculation Loop', icon: '〰️', size: 1 },
  'steam-sterilizer': { label: 'Steam Sterilizer', icon: '♨️', size: 2 },
  'flask': { label: 'Laboratory Flask', icon: '⚗️', size: 1 },
  'staining-rack': { label: 'Staining Rack', icon: '🧪', size: 1 },
  'microscope': { label: 'Brass Microscope', icon: '🔬', size: 2 },
  'hand-centrifuge': { label: 'Hand Centrifuge', icon: '🔄', size: 2 },
} as const;

export type EquipmentType = keyof typeof EQUIPMENT;

// === Culture Plate State ===

export type PlatePhase = 'empty' | 'poured' | 'cooling' | 'ready' | 'streaked' | 'incubating' | 'grown';

export interface CulturePlateState {
  id: string;
  mediaType: MediaType | null;
  phase: PlatePhase;
  label: string;
}

// === Items (discriminated union — anything the player can carry or place) ===

export type Item =
  | { kind: 'sample'; sampleId: string }
  | { kind: 'supply'; supplyType: SupplyType; quantity: number }
  | { kind: 'equipment'; equipmentType: EquipmentType }
  | { kind: 'culture-plate'; plate: CulturePlateState };

export function getItemSize(item: Item): number {
  switch (item.kind) {
    case 'sample': return 1;
    case 'supply': return SUPPLIES[item.supplyType].size;
    case 'equipment': return EQUIPMENT[item.equipmentType].size;
    case 'culture-plate': return 1;
  }
}

export function getItemLabel(item: Item): string {
  switch (item.kind) {
    case 'sample': return 'Sample';
    case 'supply': return `${SUPPLIES[item.supplyType].label}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`;
    case 'equipment': return EQUIPMENT[item.equipmentType].label;
    case 'culture-plate': return item.plate.label;
  }
}

export function getItemIcon(item: Item): string {
  switch (item.kind) {
    case 'sample': return '🧪';
    case 'supply': return SUPPLIES[item.supplyType].icon;
    case 'equipment': return EQUIPMENT[item.equipmentType].icon;
    case 'culture-plate': return '🧫';
  }
}

export function getCarryingLoad(items: Item[]): number {
  return items.reduce((sum, item) => sum + getItemSize(item), 0);
}

// === Furniture (world objects that items go on/in) ===

export const FURNITURE_DEFS = {
  'workbench': { label: 'Workbench', icon: '🪵', contentCapacity: 8 },
  'cabinet': { label: 'Reagent Cabinet', icon: '🗄️', contentCapacity: 20 },
  'ice-box': { label: 'Ice Box', icon: '🧊', contentCapacity: 6 },
} as const;

export type FurnitureType = keyof typeof FURNITURE_DEFS;

export interface Furniture {
  id: string;
  type: FurnitureType;
  name: string;
  position: GridPosition;
  contents: Item[];
}

// === Workbench Mode Detection ===

export type WorkbenchMode = 'culture' | 'microscope' | 'staining' | 'general';

export function detectWorkbenchMode(contents: Item[]): WorkbenchMode {
  const has = (t: EquipmentType) => contents.some(i => i.kind === 'equipment' && i.equipmentType === t);
  if (has('microscope')) return 'microscope';
  if (has('bunsen-burner') || has('inoculation-loop')) return 'culture';
  if (has('staining-rack')) return 'staining';
  return 'general';
}

// === Player ===

export interface Player {
  position: GridPosition;
  carrying: Item[];
  carryCapacity: number;
  facing: Direction;
  /** For movement animation */
  isMoving: boolean;
  targetPosition: GridPosition | null;
}

// === Lab Grid ===

export type TileType = 'floor' | 'wall' | 'door' | 'gas-lamp' | 'window' | 'drain' | 'waiting-bench';

export interface LabTile {
  type: TileType;
  walkable: boolean;
  /** If a piece of furniture occupies this tile */
  furnitureId: string | null;
  /** If a patient is sitting on this bench */
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

// === Lab State (main state container) ===

export interface LabState {
  /** Grid dimensions */
  width: number;
  height: number;
  /** 2D array of tiles [y][x] */
  grid: LabTile[][];
  /** All furniture in the lab */
  furniture: Furniture[];
  /** All samples in the lab */
  samples: Sample[];
  /** Player avatar state */
  player: Player;
  /** Camera position/zoom */
  camera: CameraState;
  /** Current game tick */
  currentTick: number;
  /** Is game paused */
  isPaused: boolean;
  /** Game speed multiplier */
  speed: number;
  /** Patients waiting in the waiting room */
  patients: Patient[];
  /** Active cases (patient has had at least one sample collected) */
  activeCases: Case[];
  /** Player's collected observations (notebook) */
  observations: Observation[];
  /** Player stats */
  stats: PlayerStats;
}

export interface PlayerStats {
  livesaved: number;
  livesLost: number;
  casesCompleted: number;
  funds: number;
}

// === Events (for Phaser↔Svelte communication) ===

export type LabEvent = 
  | { type: 'furniture-clicked'; furnitureId: string }
  | { type: 'tile-clicked'; position: GridPosition }
  | { type: 'item-picked-up'; itemIndex: number }
  | { type: 'item-placed'; furnitureId: string }
  | { type: 'speed-changed'; speed: number }
  | { type: 'pause-toggled'; isPaused: boolean };

// === UI Helpers ===

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
