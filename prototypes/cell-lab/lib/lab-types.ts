/** Types for multi-instrument investigative puzzles */

export interface PlasmidRegion {
  label: string;
  /** Length in bp */
  length: number;
  /** Whether this region is the unknown insert */
  isInsert?: boolean;
  /** Display color */
  color: string;
}

export interface PlasmidMap {
  name: string;
  totalLength: number;
  regions: PlasmidRegion[];
}

export interface GeneEntry {
  name: string;
  fullName?: string;
  /** Length in bp, rounded to nearest 20 */
  length: number;
}

export interface PrimerSet {
  name: string;
  forwardSeq: string;
  reverseSeq: string;
}

export interface ReferenceData {
  geneTable: GeneEntry[];
  notes?: string[];
  /** Gene sequences for sequencer reference (gene name → first N bases) */
  geneSequences?: Record<string, string>;
  /** Current page index for desk display */
  page?: number;
}

export interface PcrResult {
  /** Band size in bp (null = no amplification) */
  bandSize: number | null;
  /** Extra bands from contamination */
  extraBands?: number[];
  /** Why it failed, if it did */
  failReason?: string;
}

export interface GelLane {
  label: string;
  /** Band sizes in bp */
  bands: number[];
}

export interface GelResult {
  lanes: GelLane[];
  /** Ladder sizes for the left lane */
  ladder: number[];
}

/** Excised gel band carrying hidden sequence data */
export interface ExcisedBandData {
  bandBp: number;
  sequence: string;
  sourceLabel: string;
}

/** Sequencer result displayed as chromatogram */
export interface SequencerResult {
  sequence: string;
}

export interface DeskItem {
  id: string;
  type: 'pcr-tube' | 'gel-photo' | 'reference-book' | 'answer-sheet' | 'excised-band';
  label: string;
  data: PcrResult | GelResult | ReferenceData | { genes: string[] } | ExcisedBandData;
  /** Position on the desk (pixels from top-left) */
  x: number;
  y: number;
}

export interface LabPuzzle {
  id: string;
  title: string;
  briefing: string;
  plasmid: PlasmidMap;
  reference: ReferenceData;
  /** The actual insert gene name (hidden from player) */
  actualInsert: GeneEntry;
  /** Flanking bp added by primers outside the insert */
  flankingBp: number;
  /** Accepted answers (gene names) */
  acceptedAnswers: string[];
  /** Extra bands from contamination when PCR succeeds */
  contaminantBands?: { bp: number; sequence: string; gene: string }[];
  /** Available instruments for this puzzle */
  instruments: ('pcr' | 'gel' | 'sequencer')[];
  /** Gene sequences for reference book (gene name → first N bases) */
  geneSequences?: Record<string, string>;
}
