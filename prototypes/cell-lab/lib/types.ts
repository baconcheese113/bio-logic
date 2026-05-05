export type PartCategory = 'promoter' | 'gene' | 'terminator';

export interface BioPart {
  id: string;
  category: PartCategory;
  name: string;
  label: string;
  color: string;
  description: string;
  /** For promoters: which signal activates it (undefined = constitutive) */
  signal?: string;
  /** For promoters: expression strength (1-3) */
  strength?: number;
  /** For genes: the protein product name */
  product?: string;
  /** For promoters: silenced when this protein is present */
  repressedBy?: string;
  /** For promoters: only active when this protein is present */
  activatedBy?: string;
}

export interface PuzzleSignalTest {
  signals: Record<string, boolean>;
  label: string;
  expect: Record<string, { min?: number; max?: number }>;
}

export interface Puzzle {
  id: number;
  title: string;
  goal: string;
  hint: string;
  availablePartIds: string[];
  strandSlots: number;
  tests: PuzzleSignalTest[];
  /** Pre-filled strand for diagnostic puzzles (read-only) */
  prefilled?: (string | null)[];
  /** Hide gene labels in pre-filled strands */
  hiddenGenes?: boolean;
  /** Proteins available in the detector */
  detectableProteins?: string[];
  /** Show brightness meter for these proteins after running */
  brightnessMeter?: string[];
}

export interface SimulationResult {
  proteins: Record<string, number>;
  glowColor: string | null;
  glowIntensity: number;
}

export interface TestResult {
  passed: boolean;
  label: string;
  result: SimulationResult;
}

// ── Unified simulation engine types ─────────────────────────────────

export type HostMode = 'bacterial' | 'eukaryotic';

export type PartType =
  | 'promoter'
  | 'rbs'
  | 'gene'
  | 'linker'
  | 'terminator'
  | 'tag'
  | 'crispr'
  | 'enhancer'
  | 'signal-sequence';

export type Orientation = 'clockwise' | 'counterclockwise';

/** Template part definition used by the new engine and parts library */
export interface PartDef {
  id: string;
  type: PartType;
  name: string;
  label: string;
  color: string;
  description: string;
  validHostModes: HostMode[];
  // Promoter
  rnaPLoadRate?: number;
  signal?: string;
  repressedBy?: string;
  activatedBy?: string;
  // RBS / Kozak
  translationRate?: number;
  // Gene
  product?: string;
  isDCas9?: boolean;
  // Terminator
  readThroughPct?: number;
  mRNAStabilityBonus?: number;
  // Tag
  tagRate?: number;
  tagType?: 'ssrA' | 'degron';
  // gRNA (crispr)
  targetPromoter?: string;
  // Enhancer
  boostFactor?: number;
  // Signal sequence
  destination?: 'nucleus' | 'secretory';
}

/** An instance of a part placed on the circular plasmid */
export interface PlacedPart {
  instanceId: string;
  defId: string;
  orientation: Orientation;
}

export interface EnvironmentState {
  signals: Record<string, number>; // 0–1 concentration
  hostMode: HostMode;
}

export type PartStateKind = 'active' | 'repressed' | 'blocked' | 'read-through' | 'silent' | 'inert';

export interface PartState {
  state: PartStateKind;
  reason?: string;
}

export interface TranscriptionUnit {
  promoterInstanceId: string;
  geneProducts: string[];
  strength: number;
  terminatorInstanceId?: string;
  continuedFromTerminatorInstanceId?: string;
  hasReadThrough: boolean;
  readThroughFraction?: number;
}

export type CellHealthReason = 'transcriptional-load' | 'protease-saturation' | 'toxic-protein';

export interface CellHealth {
  state: 'normal' | 'burdened' | 'toxic' | 'lysed';
  reasons: CellHealthReason[];
}

export interface EngineOutput {
  proteins: Record<string, number>;
  transcripts: Record<string, number>;
  functionalRNAs: Record<string, number>;
  partStates: Record<string, PartState>;
  cellHealth: CellHealth;
  transcriptionUnits: TranscriptionUnit[];
  efficiencyScore: { partCount: number; transcriptionalLoad: number; proteaseLoad: number };
}

// ── Circular puzzle types ────────────────────────────────────────────

export interface CircularExpect {
  proteins?: Record<string, { min?: number; max?: number }>;
  proteinRatio?: { a: string; b: string; min?: number; max?: number };
  cellHealth?: { state?: CellHealth['state']; not?: CellHealth['state'] };
}

export interface CircularPuzzleTest {
  environment: EnvironmentState;
  label: string;
  expect: CircularExpect;
}

export interface CircularPuzzle {
  id: number;
  title: string;
  goal: string;
  hint: string;
  hostMode: HostMode;
  availablePartIds: string[];
  prefilled?: string[];
  tests: CircularPuzzleTest[];
}
