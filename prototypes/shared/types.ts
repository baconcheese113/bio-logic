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

export interface CultureFindings {
  growth: boolean;
  hemolysis: HemolysisType;
  colonyColor: ColonyColor;
  lactoseFermenter?: boolean;
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

export interface Observation {
  id: string;
  patientId: string;    // links observation to specific patient
  caseId: string;
  patientName: string;
  instrumentType: InstrumentType;
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
  | { type: 'instrument'; instrumentId: string; slotIndex: number }
  | { type: 'player' }
  | { type: 'storage'; storageId: string };

// === Instruments ===

export type InstrumentType = 
  | 'microscope'
  | 'staining-bench'
  | 'culture-incubator'
  | 'serology-station'
  | 'centrifuge'
  | 'ice-box';

export type InstrumentStatus = 'idle' | 'busy' | 'ready' | 'error';

// === Input Configuration ===
// Defines how samples are loaded into an instrument
// Add new types as instruments are implemented

export type InputConfig =
  | { type: 'stage'; capacity: 1 }           // Microscope: single sample on stage
  | { type: 'slots'; capacity: number }       // Centrifuge: fixed tube slots
  | { type: 'plate' }                         // ELISA/PCR: accepts a prepared plate
  | { type: 'lanes'; capacity: number }       // Gel: samples loaded into lanes
  | { type: 'dish'; capacity: number };       // Culture: petri dishes

export interface SampleSlot {
  index: number;
  sampleId: string | null;
  /** Visual position offset within instrument sprite/element */
  offsetX: number;
  offsetY: number;
}

export interface Instrument {
  id: string;
  type: InstrumentType;
  name: string;
  position: GridPosition;
  status: InstrumentStatus;
  /** How samples are loaded into this instrument */
  inputConfig: InputConfig;
  /** Current sample slots (legacy, replaced by inputConfig) */
  slots: SampleSlot[];
  /** Processing progress (0-100) when busy */
  progress: number;
}

// === Player ===

export interface Player {
  position: GridPosition;
  heldSample: Sample | null;
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
  /** If an instrument occupies this tile */
  instrumentId: string | null;
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
  /** All instruments in the lab */
  instruments: Instrument[];
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
  | { type: 'instrument-clicked'; instrumentId: string }
  | { type: 'tile-clicked'; position: GridPosition }
  | { type: 'sample-picked-up'; sampleId: string }
  | { type: 'sample-dropped'; sampleId: string; instrumentId: string; slotIndex: number }
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

export const INSTRUMENT_ICONS: Record<InstrumentType, string> = {
  'microscope': '🔬',
  'staining-bench': '🧪',
  'culture-incubator': '🦠',
  'serology-station': '💉',
  'centrifuge': '🔄',
  'ice-box': '🧊',
};

export const STATUS_COLORS: Record<InstrumentStatus, string> = {
  'idle': '#4caf50',
  'busy': '#ff9800',
  'ready': '#2196f3',
  'error': '#f44336',
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
