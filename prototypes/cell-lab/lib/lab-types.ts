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

export type BookSection = 'toc' | 'genes' | 'instruments' | 'enzymes' | 'artifacts' | 'antibodies' | 'primers';

export type GeneIcon = 'fluorescent' | 'resistance' | 'regulator' | 'enzyme' | 'structural' | 'unknown';

export type InstrumentIcon = 'pcr' | 'gel' | 'sequencer' | 'spectrophotometer' | 'elisa' | 'digest' | 'assembly';

export type ThumbnailKey = 'gel-bands' | 'chromatogram' | 'absorbance-curve' | 'pcr-tube' | 'fragment-pattern';

export type BookEntry =
  | { section: 'genes'; id: string; name: string; fullName?: string; length: number; sequence: string; icon: GeneIcon; roleLine: string; enzymeSites?: { enzyme: string; sites: number }[] }
  | { section: 'instruments'; id: string; name: string; icon: InstrumentIcon; measures: string; useWhen: string; thumbnail: ThumbnailKey }
  | { section: 'enzymes'; id: string; name: string; fullName: string; organism: string; taxonomy: string[]; optimalTemp: number; discoveredYear: number; fact: string; cutSite: string; cutType: 'blunt' | 'sticky-5' | 'sticky-3'; fragmentPatternKey: ThumbnailKey }
  | { section: 'artifacts'; id: string; name: string; thumbnail: ThumbnailKey; caption: string }
  | { section: 'antibodies'; id: string; name: string; target: string; description: string; binding: Record<string, ElisaSignal> }
  | { section: 'primers'; id: string; name: string; description: string; bandBySpecies: Record<string, number> };

export interface ReferenceData {
  geneTable: GeneEntry[];
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

/** Restriction enzyme for digest instrument */
export interface RestrictionEnzyme {
  name: string;
  fullName: string;
  organism: string;
  taxonomy: string[];
  recognitionSite: string;
  cutDisplay: string;
  cutType: 'blunt' | 'sticky-5' | 'sticky-3';
  optimalTemp: number;
  discoveredYear: number;
  fact: string;
}

/** Result of a restriction digest */
export interface DigestResult {
  enzyme: string;
  fragments: number[];
}

/** Single ELISA well reading */
export interface ElisaWell {
  label: string;
  timepoint: number;
  absorbance: number;
}

/** Single spectrophotometer reading (OD600 + optional product) */
export interface GrowthPoint {
  timepoint: number;
  od600: number;
  productLevel?: number;
}

export type ElisaSignal = 'strong' | 'weak' | 'none';

/** Antibody entry for ELISA puzzle reference book */
export interface AntibodyEntry {
  name: string;
  target: string;
  description: string;
  /** Binding profile: protein name → signal strength */
  binding: Record<string, ElisaSignal>;
}

/** ELISA plate design puzzle — player assigns sample+antibody per well */
export interface ElisaDesignData {
  samples: string[];
  antibodies: AntibodyEntry[];
  /** Binding matrix: antibody name → protein name → signal strength */
  bindingMatrix: Record<string, Record<string, ElisaSignal>>;
  /** Ground truth: sample name → protein name */
  truthMap: Record<string, string>;
  wellBudget: number;
}

/** Well assignment made by the player */
export interface WellAssignment {
  sample: string;
  antibody: string;
}

/** Primer entry for PCR puzzle */
export interface PcrPrimerEntry {
  name: string;
  description: string;
  /** Species name → band size (0 = no amplification) */
  bandBySpecies: Record<string, number>;
}

/** Multi-sample PCR puzzle — player picks sample + primer pair */
export interface SamplePcrData {
  samples: string[];
  species: string[];
  primers: PcrPrimerEntry[];
  /** Ground truth: sample name → species name */
  truthMap: Record<string, string>;
  gelLaneBudget: number;
}

/** Shotgun assembly read */
export interface AssemblyRead {
  id: string;
  sequence: string;
  /** True if the read is currently showing the reverse complement */
  reversed?: boolean;
}

/** Puzzle data for shotgun assembly levels */
export interface AssemblyPuzzleData {
  reads: AssemblyRead[];
  overlapK: number;
  targetGene: string;
  fullSequence: string;
}

export type LabInstrumentType = 'pcr' | 'gel' | 'sequencer' | 'digest' | 'elisa' | 'spectrophotometer' | 'assembly' | 'promoter-architect';

export interface PromoterSite {
  id: string;
  label: string;
  role: 'activator' | 'repressor';
  footprintBp: number;
  color: string;
  /** If set, overrides the puzzle's global activationRangeBp for this site only */
  activationRangeOverrideBp?: number;
}

export interface PlacedSite {
  siteId: string;
  /** Left-edge bp position on rail */
  positionBp: number;
  /** If true: not draggable by player */
  fixed?: boolean;
}

export interface PromoterTarget {
  positionBp: number;
  label: string;
  /** Min expression required (default 0.95) */
  minExpression?: number;
  /** Max expression allowed (no cap by default); used for Gene B ≤ threshold puzzles */
  maxExpression?: number;
}

export interface ConditionalSite {
  site: PromoterSite;
  /** Index into promoters[] to watch */
  unlocksWhenPromoterIndex: number;
  /** Expression threshold to cross for unlock */
  minExpression: number;
}

export interface PromoterPuzzleData {
  railLengthBp: number;
  activationRangeBp: number;
  /** One entry per gene; success = all targets satisfied simultaneously */
  promoters: PromoterTarget[];
  /** Palette items the player can drag */
  availableSites: PromoterSite[];
  /** Site definitions referenced by fixedSites/states but not shown in palette */
  siteLibrary?: PromoterSite[];
  /** Pre-placed, not draggable */
  fixedSites?: PlacedSite[];
  /** default 'linear'; 'sigmoid' for cliff puzzles */
  curveType?: 'linear' | 'sigmoid';
  cooperativeDistBp?: number;
  cooperativeBoost?: number;
  /** Multi-state puzzles: evaluate circuit under each fixed-site config simultaneously */
  states?: Array<{
    label: string;
    fixedSites: PlacedSite[];
    /** Per-state target overrides — replaces data.promoters targets for this state's success check */
    promoterOverrides?: PromoterTarget[];
  }>;
  /** Palette items that unlock when a promoter crosses an expression threshold */
  conditionalSites?: ConditionalSite[];
}

/** Sequencer result displayed as chromatogram */
export interface SequencerResult {
  sequence: string;
}

export interface SampleTubeData {
  sampleName: string;
}

export interface ElisaResultData {
  sample: string;
  antibody: string;
  signal: ElisaSignal;
}

export interface DeskItem {
  id: string;
  type: 'pcr-tube' | 'gel-photo' | 'reference-book' | 'answer-sheet' | 'excised-band' | 'briefing-note' | 'digest-tube' | 'sample-tube' | 'elisa-result';
  label: string;
  data: PcrResult | GelResult | ReferenceData | { genes: string[]; prompt?: string; mappingLabels?: string[]; mappingOptions?: string[] } | ExcisedBandData | { briefing: string } | DigestResult | SampleTubeData | ElisaResultData;
  /** Position on the desk (pixels from top-left) */
  x: number;
  y: number;
}

export interface LabPuzzle {
  id: string;
  title: string;
  briefing: string;
  plasmid?: PlasmidMap;
  reference: ReferenceData;
  /** The actual insert gene name (hidden from player) */
  actualInsert?: GeneEntry;
  /** Flanking bp added by primers outside the insert */
  flankingBp?: number;
  /** Accepted answers (gene names) */
  acceptedAnswers: string[];
  /** Extra bands from contamination when PCR succeeds */
  contaminantBands?: { bp: number; sequence: string; gene: string }[];
  /** Available instruments for this puzzle */
  instruments: LabInstrumentType[];
  /** Gene sequences for reference book (gene name → first N bases) */
  geneSequences?: Record<string, string>;
  /** Custom question for the answer sheet (default: "Identify the insert gene") */
  question?: string;
  /** Override answer-sheet options (default: gene table names) */
  answerOptions?: string[];
  /** Restriction enzymes available for digest instrument */
  enzymes?: RestrictionEnzyme[];
  /** Additional enzymes shown in reference book only (not usable in digest) */
  referenceEnzymes?: RestrictionEnzyme[];
  /** Restriction site positions per enzyme (enzyme name → bp positions) */
  restrictionSites?: Record<string, number[]>;
  /** Candidate genes for digest preview (gene name → { sites per enzyme }) */
  candidateGenes?: { name: string; sites: Record<string, number[]> }[];
  /** Pre-computed ELISA data (old read-only mode) */
  elisaData?: { target: string; wells: ElisaWell[] };
  /** ELISA plate design puzzle data (interactive mode) */
  elisaDesign?: ElisaDesignData;
  /** Growth/OD data for spectrophotometer */
  growthCurve?: GrowthPoint[];
  /** Max spectrophotometer readings (undefined = unlimited) */
  spectBudget?: number;
  /** Multi-sample PCR data */
  samplePcr?: SamplePcrData;
  /** Answer type: 'single' for button click, 'mapping' for assign-each-unknown */
  answerType?: 'single' | 'mapping';
  /** Labels for mapping answers (the unknowns) */
  answerMappingLabels?: string[];
  /** Options for each mapping dropdown */
  answerMappingOptions?: string[];
  /** Starting sample tubes placed on desk at puzzle start */
  startingSamples?: string[];
  /** Shotgun assembly puzzle data */
  assemblyData?: AssemblyPuzzleData;
  /** Promoter Architect puzzle data */
  promoterData?: PromoterPuzzleData;
}
