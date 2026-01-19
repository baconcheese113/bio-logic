/**
 * Core game engine types - single source of truth
 * Types are inferred from data structures wherever possible
 */

// ============================================================================
// TIME & PROGRESSION
// ============================================================================

export type Era = 'classical' | 'golden-age' | 'molecular' | 'genomic' | 'modern';

export const ERA_CONFIG = {
  'classical': { year: 1880, name: 'Classical Microbiology', order: 0 },
  'golden-age': { year: 1940, name: 'Golden Age of Antibiotics', order: 1 },
  'molecular': { year: 1970, name: 'Molecular Biology Era', order: 2 },
  'genomic': { year: 1995, name: 'Genomic Revolution', order: 3 },
  'modern': { year: 2020, name: 'Modern Diagnostics', order: 4 },
} as const;

// ============================================================================
// INSTRUMENTS
// ============================================================================

export type InstrumentType = 
  | 'microscope' 
  | 'culture-plate' 
  | 'biochemical-panel'
  | 'serology-slide'
  | 'electrophoresis'
  | 'pcr-thermocycler'
  | 'gel-imager'
  | 'sanger-sequencer'
  | 'elisa-reader'
  | 'flow-cytometer';

export type InstrumentStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'error';

export interface InstrumentConfig {
  type: InstrumentType;
  name: string;
  era: Era;
  processingTicks: number; // How long processing takes in game ticks
  cost: number; // Cost to purchase this instrument
  accepts: SampleType[]; // What sample types can be loaded
  produces: SampleType[]; // What sample types it can output
}

export interface InstrumentInstance {
  id: string;
  type: InstrumentType;
  status: InstrumentStatus;
  loadedItemId: string | null; // InventoryItem.id
  startTick: number | null;
  output: InstrumentOutput | null;
}

export interface InstrumentOutput {
  itemId: string; // New inventory item created
  observations: Observation[];
}

// ============================================================================
// SAMPLES & INVENTORY
// ============================================================================

// Base patient sample types (collected from patient)
export type PatientSampleType = 
  | 'blood' 
  | 'sputum' 
  | 'throat-swab' 
  | 'stool' 
  | 'wound-swab' 
  | 'csf' 
  | 'urine' 
  | 'tissue';

// Derived sample types (produced by instruments)
export type DerivedSampleType = 
  | 'culture-isolate'
  | 'gram-slide'
  | 'pcr-amplicon'
  | 'dna-extract'
  | 'protein-extract'
  | 'sequence-data';

export type SampleType = PatientSampleType | DerivedSampleType;

// Sample quality affects result clarity and observation confidence
export type SampleQuality = 'fresh' | 'fair' | 'poor' | 'spoiled';

export interface SampleQualityEffects {
  observationModifier: number; // Multiplier for observation confidence
  contaminationRisk: number; // 0-1, chance of false positive artifacts
  degradationRate: number; // How fast quality degrades per 100 ticks
}

export const SAMPLE_QUALITY_EFFECTS: Record<SampleQuality, SampleQualityEffects> = {
  'fresh': {
    observationModifier: 1.0,
    contaminationRisk: 0.02,
    degradationRate: 0.01,
  },
  'fair': {
    observationModifier: 0.8,
    contaminationRisk: 0.08,
    degradationRate: 0.02,
  },
  'poor': {
    observationModifier: 0.5,
    contaminationRisk: 0.20,
    degradationRate: 0.05,
  },
  'spoiled': {
    observationModifier: 0.1,
    contaminationRisk: 0.50,
    degradationRate: 0.10,
  },
};

export interface InventoryItem {
  id: string;
  caseId: string;
  type: SampleType;
  quality: SampleQuality; // Sample quality affects results
  sourceInstrumentId: string | null; // null for patient samples
  createdAtTick: number;
  usedInInstruments: string[]; // InstrumentInstance.ids currently using this
  data: Record<string, unknown>; // Instrument-specific result data
}

// Cost per sample type (realistic based on era)
export const SAMPLE_COSTS: Record<PatientSampleType, number> = {
  'blood': 5,
  'sputum': 2,
  'throat-swab': 2,
  'stool': 3,
  'wound-swab': 2,
  'csf': 15, // Lumbar puncture - expensive/risky
  'urine': 1,
  'tissue': 20, // Biopsy - expensive
};

// ============================================================================
// OBSERVATIONS (Structured data from instruments)
// ============================================================================

export type ObservationCategory = 
  | 'morphology'
  | 'staining'
  | 'growth'
  | 'biochemical'
  | 'serological'
  | 'molecular'
  | 'cellular';

export interface ObservationField {
  id: string;
  category: ObservationCategory;
  label: string;
  type: 'select' | 'multi-select' | 'number' | 'text';
  options?: string[]; // For select/multi-select
  unit?: string; // For number fields
}

export interface Observation {
  fieldId: string;
  value: string | string[] | number;
  instrumentId: string;
  tick: number;
}

// ============================================================================
// CASES
// ============================================================================

export type CaseStatus = 'available' | 'active' | 'submitted' | 'completed' | 'failed';

export interface CaseDefinition {
  id: string;
  era: Era;
  title: string;
  presentation: string; // Patient history, symptoms
  difficulty: 1 | 2 | 3 | 4 | 5;
  availableSamples: PatientSampleType[];
  correctDiagnosis: string;
  correctTreatment?: string;
  geneticFactors?: string[];
  baseReward: number;
  timeLimit?: number; // Optional time pressure in ticks
}

export interface ActiveCase {
  id: string; // Unique instance id
  definitionId: string; // References CaseDefinition.id
  status: CaseStatus;
  startedAtTick: number;
  observations: Observation[];
  samplesTaken: { type: PatientSampleType; cost: number }[];
}

export interface CaseSubmission {
  diagnosis: string;
  treatment?: string;
  geneticFactors?: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface CaseResult {
  caseId: string;
  correct: boolean;
  diagnosisCorrect: boolean;
  treatmentCorrect: boolean;
  geneticFactorsCorrect: boolean;
  reputationChange: number;
  fundsChange: number;
  lawsuit: LawsuitResult | null;
}

// ============================================================================
// PROGRESSION & CONSEQUENCES
// ============================================================================

export interface LawsuitResult {
  severity: 'minor' | 'major' | 'catastrophic';
  reason: string;
  fundsPenalty: number;
  reputationPenalty: number;
}

export interface PlayerState {
  reputation: number; // 0-100, affects case availability
  funds: number;
  currentEra: Era;
  ownedInstruments: InstrumentType[];
  completedCases: number;
  failedCases: number;
  lawsuits: LawsuitResult[];
}

export interface TechTreeNode {
  instrumentType: InstrumentType;
  era: Era;
  cost: number;
  requires: InstrumentType[]; // Must own these first
  description: string;
}

// ============================================================================
// GAME STATE (top-level)
// ============================================================================

export interface GameState {
  tick: number;
  speed: number; // Multiplier: 0 = paused, 1 = normal, 2 = fast
  player: PlayerState;
  activeCases: ActiveCase[];
  instruments: InstrumentInstance[];
  inventory: InventoryItem[];
}
