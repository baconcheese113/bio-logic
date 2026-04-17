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

export type BookSection = 'toc' | 'genes' | 'instruments' | 'enzymes' | 'artifacts' | 'case-notes';

export type GeneIcon = 'fluorescent' | 'resistance' | 'regulator' | 'enzyme' | 'structural' | 'unknown';

export type InstrumentIcon = 'pcr' | 'gel' | 'sequencer' | 'spectrophotometer' | 'elisa' | 'digest';

export type ThumbnailKey = 'gel-bands' | 'chromatogram' | 'absorbance-curve' | 'pcr-tube' | 'fragment-pattern';

export type BookEntry =
  | { section: 'genes'; id: string; name: string; fullName?: string; length: number; sequence: string; icon: GeneIcon; roleLine: string }
  | { section: 'instruments'; id: string; name: string; icon: InstrumentIcon; measures: string; useWhen: string; thumbnail: ThumbnailKey }
  | { section: 'enzymes'; id: string; name: string; cutSite: string; fragmentPatternKey: ThumbnailKey }
  | { section: 'artifacts'; id: string; name: string; thumbnail: ThumbnailKey; caption: string }
  | { section: 'case-notes'; id: string; bullet: string };

export interface ReferenceData {
  geneTable: GeneEntry[];
  notes?: string[];
  /** Gene sequences for sequencer reference (gene name → first N bases) */
  geneSequences?: Record<string, string>;
  /** Current page index within the current section (for desk display) */
  page?: number;
  /** Currently open section (for desk display) */
  section?: BookSection;
  /** Whether the book is currently open on the desk */
  open?: boolean;
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
