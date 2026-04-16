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
