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
  /** Current page index for desk display */
  page?: number;
}

export interface PcrResult {
  /** Band size in bp (null = no amplification) */
  bandSize: number | null;
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

export interface DeskItem {
  id: string;
  type: 'pcr-tube' | 'gel-photo' | 'reference-book' | 'answer-sheet';
  label: string;
  data: PcrResult | GelResult | ReferenceData | { genes: string[] };
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
}
