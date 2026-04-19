import type { BookEntry, GeneEntry, GeneIcon, LabPuzzle, RestrictionEnzyme } from './lab-types';

/** 30+ genes with unique lengths (rounded to 20 bp) for the reference table */
const GENE_TABLE: GeneEntry[] = [
  { name: 'Insulin', fullName: 'Insulin precursor', length: 340 },
  { name: 'lacZ-α', fullName: 'β-galactosidase alpha fragment', length: 400 },
  { name: 'GFP', fullName: 'Green Fluorescent Protein', length: 720 },
  { name: 'RFP', fullName: 'Red Fluorescent Protein (DsRed)', length: 680 },
  { name: 'mCherry', fullName: 'Monomeric Cherry fluorescent protein', length: 740 },
  { name: 'BFP', fullName: 'Blue Fluorescent Protein', length: 700 },
  { name: 'YFP', fullName: 'Yellow Fluorescent Protein', length: 775 },
  { name: 'luciferase', fullName: 'Firefly luciferase (Photinus pyralis)', length: 1660 },
  { name: 'β-lactamase', fullName: 'β-lactamase class A (generic)', length: 860 },
  { name: 'kanR', fullName: 'Aminoglycoside phosphotransferase', length: 800 },
  { name: 'cmR', fullName: 'Chloramphenicol acetyltransferase', length: 660 },
  { name: 'tetR', fullName: 'Tetracycline repressor protein', length: 1200 },
  { name: 'ampR', fullName: 'Ampicillin resistance protein', length: 880 },
  { name: 'hygR', fullName: 'Hygromycin B phosphotransferase', length: 1020 },
  { name: 'zeoR', fullName: 'Zeocin resistance protein (Sh ble)', length: 380 },
  { name: 'gyrB', fullName: 'DNA gyrase subunit B', length: 2400 },
  { name: 'recA', fullName: 'Recombinase A', length: 1060 },
  { name: 'p53', fullName: 'Tumor protein p53', length: 1180 },
  { name: 'myc', fullName: 'Myc proto-oncogene protein', length: 1320 },
  { name: 'BRCA1', fullName: 'Breast cancer type 1 susceptibility protein', length: 5600 },
  { name: 'lacI', fullName: 'Lac repressor', length: 1080 },
  { name: 'araC', fullName: 'Arabinose operon regulatory protein', length: 920 },
  { name: 'trpE', fullName: 'Anthranilate synthase component I', length: 1540 },
  { name: 'galK', fullName: 'Galactokinase', length: 1160 },
  { name: 'phoA', fullName: 'Alkaline phosphatase', length: 1400 },
  { name: 'malE', fullName: 'Maltose-binding periplasmic protein', length: 1180 },
  { name: 'ompF', fullName: 'Outer membrane porin F', length: 1080 },
  { name: 'dnaK', fullName: 'Chaperone protein DnaK (Hsp70)', length: 1920 },
  { name: 'groEL', fullName: 'Chaperonin GroEL (Hsp60)', length: 1640 },
  { name: 'rpoB', fullName: 'RNA polymerase subunit beta', length: 4140 },
  { name: 'toxA', fullName: 'Exotoxin A (Pseudomonas)', length: 1940 },
  { name: 'invA', fullName: 'Invasin A (Salmonella)', length: 2160 },
  { name: 'bla-TEM', fullName: 'β-lactamase TEM-1', length: 860 },
  { name: 'CAT', fullName: 'Chloramphenicol acetyltransferase (type I)', length: 620 },
  { name: 'nptII', fullName: 'Neomycin phosphotransferase II', length: 795 },
];

/** First 30 bases of each gene (for sequencer reference) */
const GENE_SEQUENCES: Record<string, string> = {
  'Insulin':      'ATGTTCGTCAACCAGCACCTGTGCGGCTCA',
  'lacZ-α':       'ATGACCATGATTACGCCAAGCTATTTAGGT',
  'GFP':          'ATGGTGAGCAAGGGCGAGGAGCTGTTCACC',
  'RFP':          'ATGGCCTCCTCCGAGGACGTCATCAAGGAG',
  'mCherry':      'ATGGTGAGCAAGGGCGAGGAGGATAACATG',
  'BFP':          'ATGGTGAGCAAGGGCGAGGAGCTGAACGCC',
  'YFP':          'ATGGTGAGCAAGGGCGAGGAGCTGTTCGCC',
  'luciferase':   'ATGGAAGACGCCAAAAACATAAAGAAAGGCC',
  'β-lactamase':  'ATGAGTATTCAACATTTCCGTGTCGCCCTT',
  'kanR':         'ATGAGCCATATTCAACGGGAAACGTCTTGC',
  'cmR':          'ATGGAGAAAAAAATCACTGGATATACCACCG',
  'tetR':         'ATGTCTAGATTAGATAAAAGTAAAGTGATT',
  'ampR':         'ATGAGTCATTTTTCTACTGCGGCCGCATGA',
  'hygR':         'ATGAAAAAGCCTGAACTCACCGCGACGTCT',
  'zeoR':         'ATGGCCAAGTTGACCAGTGCCGTTCCGGTG',
  'gyrB':         'ATGTCGAATTCTTATGACTCCTCCAGTATC',
  'recA':         'ATGGCTATCGACGAAAACAAACAGAAAGCG',
  'p53':          'ATGGAGGAGCCGCAGTCAGATCCTAGCGGA',
  'myc':          'ATGCCCCTCAACGTTAGCTTCACCAACAGG',
  'BRCA1':        'ATGGATTTATCTGCTCTTCGCGTTGAAGAA',
  'lacI':         'ATGAAACCAGTAACGTTATACGATGTCGCA',
  'araC':         'ATGGCTGAATCGATAGGTTCACTGCCCGCT',
  'trpE':         'ATGCAAACACAAAAACCGACTCTCGAACTG',
  'galK':         'ATGAGTCTGAAAGAAAAAACACAATCTCTG',
  'phoA':         'ATGAAACAAAGCACTATTGCACTGGCACTC',
  'malE':         'ATGAAAATAAAAACAGGTGCACGCATCCTC',
  'ompF':         'ATGAATCGTATTACCGCCATGCTGATGGCG',
  'dnaK':         'ATGGGTAAAATAATTGGTATCGACCTGGGT',
  'groEL':        'ATGGCAGCTAAAGACGTAAAATTCGGTAAC',
  'rpoB':         'ATGGTTTACTCCTATACCGAGAAAGCGTCC',
  'toxA':         'ATGGCTTGGAAACCTCTCGCAATGCTTGCC',
  'invA':         'ATGACAGCGTCGCTGCATCAGGATCTGCTG',
  'bla-TEM':      'ATGAGTCATTTTTCTACTGCGGCAGCATGA',
  'CAT':          'ATGGAGAAAAAAATCACTGGATACACCACCC',
  'nptII':        'ATGATTGAACAAGATGGATTGCACGCAGGT',
};

/** Standard gel ladder sizes */
export const GEL_LADDER = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000];

export { GENE_SEQUENCES };

/** Infer a function-category icon from a gene name. Falls back to 'unknown'. */
const GENE_ICON_MAP: Record<string, GeneIcon> = {
  'Insulin': 'structural',
  'lacZ-α': 'enzyme',
  'GFP': 'fluorescent', 'RFP': 'fluorescent', 'mCherry': 'fluorescent', 'BFP': 'fluorescent', 'YFP': 'fluorescent',
  'luciferase': 'enzyme',
  'β-lactamase': 'resistance', 'kanR': 'resistance', 'cmR': 'resistance', 'ampR': 'resistance',
  'hygR': 'resistance', 'zeoR': 'resistance', 'bla-TEM': 'resistance', 'CAT': 'resistance', 'nptII': 'resistance',
  'tetR': 'regulator', 'lacI': 'regulator', 'araC': 'regulator', 'p53': 'regulator', 'myc': 'regulator',
  'gyrB': 'enzyme', 'recA': 'enzyme', 'trpE': 'enzyme', 'galK': 'enzyme', 'phoA': 'enzyme', 'rpoB': 'enzyme',
  'BRCA1': 'structural', 'malE': 'structural', 'ompF': 'structural', 'dnaK': 'structural', 'groEL': 'structural',
  'toxA': 'structural', 'invA': 'structural',
};

/** Short (≤10-word) role line for each gene. Shown on the book's gene card. */
const GENE_ROLE_LINES: Record<string, string> = {
  'Insulin': 'Human hormone, regulates blood sugar',
  'lacZ-α': 'Enzyme fragment for blue-white screening',
  'GFP': 'Glows green under UV light',
  'RFP': 'Glows red under UV light',
  'mCherry': 'Bright red fluorescent tag',
  'BFP': 'Glows blue under UV light',
  'YFP': 'Glows yellow under UV light',
  'luciferase': 'Makes light with luciferin substrate',
  'β-lactamase': 'Destroys β-lactam antibiotics like penicillin',
  'kanR': 'Confers kanamycin antibiotic resistance',
  'cmR': 'Confers chloramphenicol antibiotic resistance',
  'tetR': 'Represses genes unless tetracycline present',
  'ampR': 'Confers ampicillin antibiotic resistance',
  'hygR': 'Confers hygromycin antibiotic resistance',
  'zeoR': 'Confers zeocin antibiotic resistance',
  'gyrB': 'DNA gyrase; species identification marker',
  'recA': 'DNA repair and recombination enzyme',
  'p53': 'Tumor suppressor; guardian of the genome',
  'myc': 'Proto-oncogene; drives cell proliferation',
  'BRCA1': 'DNA repair; cancer susceptibility gene',
  'lacI': 'Represses lac operon without lactose',
  'araC': 'Regulates arabinose metabolism genes',
  'trpE': 'Tryptophan biosynthesis enzyme',
  'galK': 'Galactose metabolism enzyme',
  'phoA': 'Alkaline phosphatase; reporter gene',
  'malE': 'Maltose-binding; common fusion tag',
  'ompF': 'Outer membrane porin protein',
  'dnaK': 'Heat-shock chaperone (Hsp70)',
  'groEL': 'Heat-shock chaperone (Hsp60)',
  'rpoB': 'RNA polymerase core subunit',
  'toxA': 'Pseudomonas exotoxin; pathogenicity marker',
  'invA': 'Salmonella invasin; pathogenicity marker',
  'bla-TEM': 'Classic β-lactamase; ampicillin resistance',
  'CAT': 'Chloramphenicol resistance enzyme',
  'nptII': 'Neomycin/kanamycin resistance (eukaryotes)',
};

/** Instrument reference entries. Shared across all puzzles. */
const INSTRUMENT_ENTRIES: BookEntry[] = [
  {
    section: 'instruments', id: 'pcr', name: 'PCR Machine', icon: 'pcr',
    measures: 'Amplifies DNA between two chosen primers',
    useWhen: 'You need to copy or detect a specific gene',
    thumbnail: 'pcr-tube',
  },
  {
    section: 'instruments', id: 'gel', name: 'Gel Electrophoresis', icon: 'gel',
    measures: 'Separates DNA fragments by size',
    useWhen: 'You need to check size of a PCR product or digest',
    thumbnail: 'gel-bands',
  },
  {
    section: 'instruments', id: 'sequencer', name: 'Sanger Sequencer', icon: 'sequencer',
    measures: 'Reads the base-by-base DNA sequence',
    useWhen: 'You need exact gene identity',
    thumbnail: 'chromatogram',
  },
  {
    section: 'instruments', id: 'digest', name: 'Restriction Digest', icon: 'digest',
    measures: 'Cuts DNA at specific recognition sequences',
    useWhen: 'You need to distinguish genes by internal cut sites',
    thumbnail: 'fragment-pattern',
  },
  {
    section: 'instruments', id: 'elisa', name: 'ELISA Plate Reader', icon: 'elisa',
    measures: 'Detects specific proteins using antibodies',
    useWhen: 'You need to identify which samples contain which protein',
    thumbnail: 'absorbance-curve',
  },
  {
    section: 'instruments', id: 'spectrophotometer', name: 'Spectrophotometer', icon: 'spectrophotometer',
    measures: 'Measures cell density via OD₆₀₀ absorbance',
    useWhen: 'You need to monitor bacterial growth',
    thumbnail: 'absorbance-curve',
  },
];

/** Build visual-first book entries from a puzzle's reference data. */
/** Deterministic pseudo-random site count for genes without explicit data */
function estimateSiteCount(gene: string, length: number, enzyme: string): number {
  let hash = 0;
  const key = gene + ':' + enzyme;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  // Expected ~1 site per 4096 bp for a 6-base cutter
  const p = length / 4096;
  const r = ((hash >>> 0) % 1000) / 1000;
  if (p < 0.3) return r < p ? 1 : 0;
  if (p < 0.8) return r < p * 0.6 ? 1 : 0;
  return r < 0.15 ? 0 : r < 0.75 ? 1 : 2;
}

export function buildBookEntries(ref: {
  geneTable: GeneEntry[];
  geneSequences?: Record<string, string>;
  enzymes?: RestrictionEnzyme[];
  referenceEnzymes?: RestrictionEnzyme[];
}): BookEntry[] {
  // Combine functional + reference-only enzymes for gene site estimates
  const allEnzymes = [...(ref.enzymes ?? []), ...(ref.referenceEnzymes ?? [])];

  // Collect known data from L5 candidate sites
  const knownSites = new Map<string, Map<string, number>>();
  for (const [gene, enzSites] of Object.entries(L5_INSERT_SITES)) {
    for (const [eName, positions] of Object.entries(enzSites)) {
      if (!knownSites.has(gene)) knownSites.set(gene, new Map());
      knownSites.get(gene)!.set(eName, positions.length);
    }
  }

  // For every gene, compute enzyme site counts (known or estimated)
  const geneEnzymeSites = new Map<string, { enzyme: string; sites: number }[]>();
  if (allEnzymes.length > 0) {
    for (const g of ref.geneTable) {
      const sites: { enzyme: string; sites: number }[] = [];
      for (const e of allEnzymes) {
        const known = knownSites.get(g.name)?.get(e.name);
        sites.push({ enzyme: e.name, sites: known ?? estimateSiteCount(g.name, g.length, e.name) });
      }
      geneEnzymeSites.set(g.name, sites);
    }
  }

  const genes: BookEntry[] = ref.geneTable.map(g => ({
    section: 'genes' as const,
    id: g.name,
    name: g.name,
    fullName: g.fullName,
    length: g.length,
    sequence: ref.geneSequences?.[g.name] ?? '',
    icon: GENE_ICON_MAP[g.name] ?? 'unknown',
    roleLine: GENE_ROLE_LINES[g.name] ?? 'Function not annotated',
    enzymeSites: geneEnzymeSites.get(g.name),
  }));

  const enzymeEntries: BookEntry[] = allEnzymes.map(e => ({
    section: 'enzymes' as const,
    id: e.name,
    name: e.name,
    fullName: e.fullName,
    organism: e.organism,
    taxonomy: e.taxonomy,
    optimalTemp: e.optimalTemp,
    discoveredYear: e.discoveredYear,
    fact: e.fact,
    cutSite: e.cutDisplay,
    cutType: e.cutType,
    fragmentPatternKey: 'fragment-pattern' as const,
  }));

  return [...genes, ...INSTRUMENT_ENTRIES, ...enzymeEntries];
}

export const PUZZLE_VERIFY_INSERT: LabPuzzle = {
  id: 'L1',
  title: 'Verify the Insert',
  briefing: 'A colleague shipped a plasmid labeled "insulin expression vector." The lab has a history of mislabeling. Confirm what\'s actually in the insert slot.',
  plasmid: {
    name: 'pEXP-???',
    totalLength: 3200,
    regions: [
      { label: 'CMV Promoter', length: 600, color: '#3b82f6' },
      { label: '??? INSERT', length: 720, isInsert: true, color: '#9ca3af' },
      { label: 'Terminator', length: 250, color: '#6b7280' },
      { label: 'ampR', length: 880, color: '#f59e0b' },
      { label: 'ori', length: 750, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
  },
  actualInsert: { name: 'GFP', length: 720 },
  flankingBp: 40,
  acceptedAnswers: ['GFP', 'gfp'],
  instruments: ['pcr', 'gel'],
};

export const PUZZLE_CONTAMINATED_SAMPLE: LabPuzzle = {
  id: 'L2',
  title: 'The Contaminated Sample',
  briefing: 'A frozen stock of the GFP expression vector has been pulled for routine amplification, but quality-control flagged it as potentially compromised. Determine whether there is a contaminant — and if so, identify it.',
  plasmid: {
    name: 'pEXP-GFP (contaminated)',
    totalLength: 3200,
    regions: [
      { label: 'CMV Promoter', length: 600, color: '#3b82f6' },
      { label: 'GFP INSERT', length: 720, isInsert: true, color: '#22c55e' },
      { label: 'Terminator', length: 250, color: '#6b7280' },
      { label: 'ampR', length: 880, color: '#f59e0b' },
      { label: 'ori', length: 750, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
  },
  actualInsert: { name: 'GFP', length: 720 },
  flankingBp: 40,
  acceptedAnswers: ['bla-TEM', 'bla-tem', 'BLA-TEM'],
  /** Contaminant plasmid has same backbone, different insert → same primers amplify both */
  contaminantBands: [
    { bp: 860, sequence: GENE_SEQUENCES['bla-TEM'], gene: 'bla-TEM' },
  ],
  instruments: ['pcr', 'gel', 'sequencer'],
  geneSequences: GENE_SEQUENCES,
};

export const PUZZLE_IDENTIFY_ISOLATE: LabPuzzle = {
  id: 'L3',
  title: 'Identify the Isolate',
  briefing: 'A clinical partner sent an unknown bacterial isolate for screening. Determine the most likely marker driving the pathogenic profile.',
  plasmid: {
    name: 'clinical-isolate-fragment',
    totalLength: 4500,
    regions: [
      { label: 'Promoter Region', length: 640, color: '#3b82f6' },
      { label: 'Unknown Marker', length: 1940, isInsert: true, color: '#ef4444' },
      { label: 'Terminator', length: 260, color: '#6b7280' },
      { label: 'resistance cassette', length: 880, color: '#f59e0b' },
      { label: 'rep origin', length: 780, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
  },
  actualInsert: { name: 'GFP', length: 720 },
  flankingBp: 40,
  acceptedAnswers: ['toxA', 'ToxA', 'TOXA'],
  contaminantBands: [
    { bp: 1940, sequence: GENE_SEQUENCES['toxA'], gene: 'toxA' },
  ],
  instruments: ['pcr', 'gel', 'sequencer'],
  geneSequences: GENE_SEQUENCES,
};

/**
 * L4 — Size Isn't Everything
 *
 * Lesson: Gel electrophoresis has limited resolution. Multiple genes have
 * similar sizes (~680–740 bp range). The player must use the sequencer to
 * definitively identify the insert rather than guessing by size alone.
 *
 * BFP (700) sits among RFP (680), GFP (720), mCherry (740), YFP (775).
 * Guessing GFP (the closest common one) is wrong. BFP and GFP share
 * their first 24 bases, so the player must read far enough on the
 * sequencer to see the divergence.
 */
export const PUZZLE_SIZE_ISNT_EVERYTHING: LabPuzzle = {
  id: 'L4',
  title: 'Size Isn\'t Everything',
  briefing: 'This fluorescent reporter vector was found unlabeled in the freezer. Multiple fluorescent proteins have similar sizes. Determine exactly which one is in the insert slot.',
  plasmid: {
    name: 'pFLUOR-???',
    totalLength: 3000,
    regions: [
      { label: 'Promoter', length: 580, color: '#3b82f6' },
      { label: '??? INSERT', length: 700, isInsert: true, color: '#9ca3af' },
      { label: 'Terminator', length: 240, color: '#6b7280' },
      { label: 'kanR', length: 800, color: '#f59e0b' },
      { label: 'ori', length: 680, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
  },
  actualInsert: { name: 'BFP', length: 700 },
  flankingBp: 40,
  acceptedAnswers: ['BFP', 'bfp'],
  instruments: ['pcr', 'gel', 'sequencer'],
  geneSequences: GENE_SEQUENCES,
};

/**
 * L5 — Restriction Map
 *
 * Lesson: Multiple genes can land in the same size range on a gel.
 * Restriction digest reveals internal cut-site differences.
 *
 * Four candidates cluster around 1060–1180 bp: recA (1060), lacI (1080),
 * galK (1160), malE (1180). The actual insert is malE.
 *
 * Each enzyme's predicted fragment pattern differs across candidates.
 * The player opens the Enzymes section, compares predictions, picks a
 * discriminating enzyme, runs the digest, gels the result, and matches
 * the observed pattern to one candidate.
 *
 * The digest operates on the INSERT only (as if the player PCR'd the
 * insert first, then digests that linear fragment). All cut positions
 * are relative to the insert start (position 0). Fragment sizes sum
 * to each candidate's insert length.
 *
 * Insert-internal cut sites per candidate (positions relative to insert start):
 *   malE (1180 bp): EcoRI @ 300
 *   p53  (1180 bp): BamHI @ 480
 *   galK (1160 bp): HindIII @ 230, EcoRI @ 580
 *   lacI (1080 bp): HindIII @ 380, XhoI @ 140
 */

/** Insert lengths per candidate */
const L5_INSERT_LENGTHS: Record<string, number> = {
  'malE': 1180,
  'p53':  1180,
  'galK': 1160,
  'lacI': 1080,
};

/** Insert-internal cut sites per candidate (positions relative to insert start) */
const L5_INSERT_SITES: Record<string, Record<string, number[]>> = {
  'malE':  { 'EcoRI': [300],  'BamHI': [],    'HindIII': [],    'XhoI': [] },
  'p53':   { 'EcoRI': [],     'BamHI': [480], 'HindIII': [],    'XhoI': [] },
  'galK':  { 'EcoRI': [580],  'BamHI': [],    'HindIII': [230], 'XhoI': [] },
  'lacI':  { 'EcoRI': [],     'BamHI': [],    'HindIII': [380], 'XhoI': [140] },
};

const L5_CANDIDATES = ['malE', 'p53', 'galK', 'lacI'];

const RESTRICTION_ENZYMES: RestrictionEnzyme[] = [
  {
    name: 'EcoRI',
    fullName: 'Eco Restriction enzyme I',
    organism: 'Escherichia coli RY13',
    taxonomy: ['Bacteria', 'Proteobacteria', 'Gammaproteobacteria'],
    recognitionSite: 'GAATTC',
    cutDisplay: 'G↓AATTC',
    cutType: 'sticky-5',
    optimalTemp: 37,
    discoveredYear: 1972,
    fact: 'First commercially available restriction enzyme',
  },
  {
    name: 'BamHI',
    fullName: 'Bam Restriction enzyme HI',
    organism: 'Bacillus amyloliquefaciens H',
    taxonomy: ['Bacteria', 'Firmicutes', 'Bacilli'],
    recognitionSite: 'GGATCC',
    cutDisplay: 'G↓GATCC',
    cutType: 'sticky-5',
    optimalTemp: 37,
    discoveredYear: 1977,
    fact: 'Widely used for cloning due to compatible sticky ends',
  },
  {
    name: 'HindIII',
    fullName: 'Hind Restriction enzyme III',
    organism: 'Haemophilus influenzae Rd',
    taxonomy: ['Bacteria', 'Proteobacteria', 'Gammaproteobacteria'],
    recognitionSite: 'AAGCTT',
    cutDisplay: 'A↓AGCTT',
    cutType: 'sticky-5',
    optimalTemp: 37,
    discoveredYear: 1970,
    fact: 'Helped earn Hamilton Smith the 1978 Nobel Prize',
  },
  {
    name: 'XhoI',
    fullName: 'Xho Restriction enzyme I',
    organism: 'Xanthomonas holcicola',
    taxonomy: ['Bacteria', 'Proteobacteria', 'Gammaproteobacteria'],
    recognitionSite: 'CTCGAG',
    cutDisplay: 'C↓TCGAG',
    cutType: 'sticky-5',
    optimalTemp: 37,
    discoveredYear: 1978,
    fact: 'Common in expression vector multiple-cloning sites',
  },
];

/** Reference-only enzyme (not usable in L5 digest) */
const REFERENCE_ONLY_ENZYMES: RestrictionEnzyme[] = [
  {
    name: 'SmaI',
    fullName: 'Sma Restriction enzyme I',
    organism: 'Serratia marcescens',
    taxonomy: ['Bacteria', 'Proteobacteria', 'Gammaproteobacteria'],
    recognitionSite: 'CCCGGG',
    cutDisplay: 'CCC↓GGG',
    cutType: 'blunt',
    optimalTemp: 25,
    discoveredYear: 1978,
    fact: 'Temperature-sensitive — exhibits star activity at 37°C',
  },
];

export const PUZZLE_RESTRICTION_MAP: LabPuzzle = {
  id: 'L5',
  title: 'Restriction Map',
  briefing: 'A contract manufacturer shipped gene-therapy vectors labeled as p53 delivery constructs. Your QC lab must independently verify the insert identity before release.',
  plasmid: {
    name: 'Unverified Vector',
    totalLength: 3700,
    regions: [
      { label: 'CMV Promoter', length: 620, color: '#3b82f6' },
      { label: '??? INSERT', length: 1180, isInsert: true, color: '#9ca3af' },
      { label: 'Terminator', length: 300, color: '#6b7280' },
      { label: 'ampR', length: 880, color: '#f59e0b' },
      { label: 'ori', length: 720, color: '#8b5cf6' },
    ],
  },
  reference: {
    geneTable: GENE_TABLE,
  },
  actualInsert: { name: 'malE', length: 1180 },
  flankingBp: 40,
  acceptedAnswers: ['malE', 'male', 'MALE'],
  instruments: ['pcr', 'gel', 'digest'],
  enzymes: RESTRICTION_ENZYMES,
  referenceEnzymes: REFERENCE_ONLY_ENZYMES,
  startingSamples: ['Unverified p53 Vector'],
  restrictionSites: {
    // Actual sites for malE insert (positions relative to insert start)
    'EcoRI': [300],
    'BamHI': [],
    'HindIII': [],
    'XhoI': [],
  },
  candidateGenes: L5_CANDIDATES.map(gene => ({
    name: gene,
    sites: L5_INSERT_SITES[gene],
  })),
};

/**
 * L6 — The Mislabeled Cultures
 *
 * Lesson: Introduce ELISA as an experimental design tool. Four culture
 * tubes lost their labels. Player designs an ELISA plate, picking which
 * sample + antibody combo goes in each well. Budget of 8 wells forces
 * strategic testing instead of brute-force (which needs 16).
 */
export const PUZZLE_MISLABELED_CULTURES: LabPuzzle = {
  id: 'L6',
  title: 'The Mislabeled Cultures',
  briefing: 'A fridge malfunction melted the label adhesive overnight. Four culture tubes — each producing a different protein — are now unlabeled. Use the ELISA plate reader to figure out which tube is which.',
  reference: {
    geneTable: [],
  },
  acceptedAnswers: [],
  question: 'Which tube contains which protein?',
  instruments: ['elisa'],
  answerType: 'mapping',
  answerMappingLabels: ['Tube A', 'Tube B', 'Tube C', 'Tube D'],
  answerMappingOptions: ['Insulin', 'GFP', 'Amylase', 'Lysozyme'],
  elisaDesign: {
    samples: ['Tube A', 'Tube B', 'Tube C', 'Tube D'],
    antibodies: ['Insulin', 'GFP', 'Amylase', 'Lysozyme'],
    truthMap: {
      'Tube A': 'GFP',
      'Tube B': 'Insulin',
      'Tube C': 'Lysozyme',
      'Tube D': 'Amylase',
    },
    wellBudget: 8,
  },
};

/**
 * L7 — Fingerprint the Strain
 *
 * Lesson: Multi-sample PCR. Three bacterial samples look identical.
 * Player runs species-specific PCR + gel to identify each strain.
 * Budget of 5 gel lanes forces strategic primer selection.
 */
export const PUZZLE_FINGERPRINT_STRAIN: LabPuzzle = {
  id: 'L7',
  title: 'Fingerprint the Strain',
  briefing: 'Three bacterial isolates arrived from the hospital. They look identical on agar. One is safe E. coli K-12, one is MRSA, one is Pseudomonas. Identify each sample before the wrong one gets into the teaching lab.',
  reference: {
    geneTable: [],
  },
  acceptedAnswers: [],
  question: 'Which sample is which species?',
  instruments: ['pcr', 'gel'],
  answerType: 'mapping',
  answerMappingLabels: ['Sample 1', 'Sample 2', 'Sample 3'],
  answerMappingOptions: ['E. coli K-12', 'S. aureus MRSA', 'P. aeruginosa'],
  samplePcr: {
    samples: ['Sample 1', 'Sample 2', 'Sample 3'],
    species: ['E. coli K-12', 'S. aureus MRSA', 'P. aeruginosa'],
    primers: [
      { name: 'lacZ', description: 'β-galactosidase (E. coli)', bandSize: 520 },
      { name: 'mecA', description: 'Methicillin resistance (MRSA)', bandSize: 310 },
      { name: 'toxA', description: 'Exotoxin A (Pseudomonas)', bandSize: 680 },
      { name: '16S rRNA', description: 'Universal bacterial marker', bandSize: 1500 },
    ],
    genePresence: {
      'E. coli K-12': ['lacZ', '16S rRNA'],
      'S. aureus MRSA': ['mecA', '16S rRNA'],
      'P. aeruginosa': ['toxA', '16S rRNA'],
    },
    truthMap: {
      'Sample 1': 'S. aureus MRSA',
      'Sample 2': 'P. aeruginosa',
      'Sample 3': 'E. coli K-12',
    },
    gelLaneBudget: 5,
  },
};

export const LAB_PUZZLES = [
  PUZZLE_VERIFY_INSERT,
  PUZZLE_CONTAMINATED_SAMPLE,
  PUZZLE_IDENTIFY_ISOLATE,
  PUZZLE_SIZE_ISNT_EVERYTHING,
  PUZZLE_RESTRICTION_MAP,
  PUZZLE_MISLABELED_CULTURES,
  PUZZLE_FINGERPRINT_STRAIN,
];
