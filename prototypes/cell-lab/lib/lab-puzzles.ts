import type { AntibodyEntry, AssemblyPuzzleData, BookEntry, ElisaSignal, GeneEntry, GeneIcon, LabPuzzle, PromoterSite, RestrictionEnzyme } from './lab-types';
import { generateReads, shuffleReads, flipSomeReads } from './assembly-simulation';

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
  // Short peptide genes (realistic CDS lengths ~70-135 bp)
  { name: 'Magainin 2', fullName: 'Antimicrobial peptide (Xenopus laevis)', length: 72 },
  { name: 'Melittin', fullName: 'Bee venom peptide (Apis mellifera)', length: 84 },
  { name: 'hBD-1', fullName: 'Human β-defensin 1', length: 108 },
  { name: 'LL-37', fullName: 'Cathelicidin antimicrobial peptide', length: 114 },
  { name: 'Cecropin A', fullName: 'Antimicrobial peptide (Hyalophora cecropia)', length: 111 },
  { name: 'Thymosin β4', fullName: 'Actin-sequestering peptide', length: 135 },
  // Small non-coding RNAs (20-30 bp mature sequences)
  { name: 'miR-21', fullName: 'MicroRNA-21 (Homo sapiens)', length: 22 },
  { name: 'let-7a', fullName: 'MicroRNA let-7a (Homo sapiens)', length: 22 },
  { name: 'tRF-Gly', fullName: 'tRNA-derived fragment Gly-GCC', length: 30 },
  { name: 'RyhB', fullName: 'Small RNA RyhB (E. coli)', length: 30 },
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
  'Magainin 2':   'ATGGGTAAACTGATCGCTAAGGGCAAAGGT',
  'Melittin':     'ATGGCGATTCTGAAAATTATTCTGAGTGTG',
  'hBD-1':        'ATGTCCCTGTTTACTTGTGCTTTGGCCATA',
  'LL-37':        'ATGAAAGCCTTGAAACTGATCCTGAGCGTT',
  'Cecropin A':   'ATGAAATGGAAACTGTTCAAAGCTATCGGT',
  'Thymosin β4':  'ATGTCTGACAAACCCGATATGGCTGAGATC',
  // Small non-coding RNA sequences (full mature sequence)
  'miR-21':       'UAGCUUAUCAGACUGAUGUUGA',
  'let-7a':       'UGAGGUAGUAGGUUGUAUAGUU',
  'tRF-Gly':      'GCAUUGGUGGUUCAGUGGUAGAAUUCUCGCC',
  'RyhB':         'GCGAUCAGGAAGACCCUCGCGGAGAACCUGA',
};

/** Standard gel ladder sizes */
export const GEL_LADDER = [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000];

export { GENE_SEQUENCES };

/**
 * Extended gene sequences (~80 bp) for the assembly puzzle.
 * The player assembles overlapping reads, then matches the contig
 * against these partial sequences shown in the reference book.
 */
const ASSEMBLY_GENE_SEQUENCES: Record<string, string> = {
  'GFP':     'ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGC',
  'Insulin': 'ATGTTCGTCAACCAGCACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCT',
  'lacZ-α':  'ATGACCATGATTACGCCAAGCTATTTAGGTGACACTATAGAATACTCAAGCTATGCATCCAACGCGTTGGGAGCTC',
  'kanR':    'ATGAGCCATATTCAACGGGAAACGTCTTGCTCGAGGCCGCGATTAAATTCCAACATGGATGCTGATTTATATGGGT',
  'BFP':     'ATGGTGAGCAAGGGCGAGGAGCTGAACGCCATCAGCGACAACGTCTATATCAAGGCCGACAAGCAGAAGAACGGCA',
  // Small non-coding RNAs (DNA form of mature sequences)
  'miR-21':  'TAGCTTATCAGACTGATGTTGA',
  'let-7a':  'TGAGGTAGTAGGTTGTATAGTT',
  'tRF-Gly': 'GCATTGGTGGTTCAGTGGTAGAATTCTCGCC',
  'RyhB':    'GCGATCAGGAAGACCCTCGCGGAGAACCTGA',
};

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
  'Magainin 2': 'resistance', 'Melittin': 'structural', 'hBD-1': 'resistance',
  'LL-37': 'resistance', 'Cecropin A': 'resistance', 'Thymosin β4': 'structural',
  'miR-21': 'regulator', 'let-7a': 'regulator', 'tRF-Gly': 'regulator', 'RyhB': 'regulator',
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
  'Magainin 2': 'Frog skin antimicrobial; kills bacteria on contact',
  'Melittin': 'Bee venom peptide; disrupts cell membranes',
  'hBD-1': 'Human innate immune defense peptide',
  'LL-37': 'Human antimicrobial peptide; broad-spectrum',
  'Cecropin A': 'Insect antimicrobial; first natural antibiotic peptide',
  'Thymosin β4': 'Wound healing peptide; sequesters actin monomers',
  'miR-21': 'Oncogenic microRNA; silences tumor suppressor genes',
  'let-7a': 'Tumor suppressor microRNA; blocks cell growth',
  'tRF-Gly': 'tRNA fragment; regulates translation under stress',
  'RyhB': 'Bacterial small RNA; controls iron homeostasis',
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
  {
    section: 'instruments', id: 'assembly', name: 'Sequence Assembler', icon: 'assembly',
    measures: 'Reconstructs a full sequence from overlapping reads',
    useWhen: 'You have short reads and need to assemble the original gene',
    thumbnail: 'fragment-pattern',
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
  antibodies?: AntibodyEntry[];
  primers?: Array<{ name: string; description: string; bandBySpecies: Record<string, number> }>;
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

  const antibodyEntries: BookEntry[] = (ref.antibodies ?? []).map(ab => ({
    section: 'antibodies' as const,
    id: ab.name,
    name: ab.name,
    target: ab.target,
    description: ab.description,
    binding: ab.binding,
  }));

  const primerEntries: BookEntry[] = (ref.primers ?? []).map(p => ({
    section: 'primers' as const,
    id: p.name,
    name: p.name,
    description: p.description,
    bandBySpecies: p.bandBySpecies,
  }));

  return [...genes, ...INSTRUMENT_ENTRIES, ...enzymeEntries, ...antibodyEntries, ...primerEntries];
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

/**
 * L5 — Assemble the Sequence
 *
 * Lesson: Introduce shotgun assembly. The player receives short
 * overlapping reads from an unknown ~75 bp gene segment and must
 * find suffix→prefix overlaps to reconstruct the contig. Then
 * match the assembled sequence against reference book entries.
 */

/** Deterministic PRNG-based DNA sequence generator. */
function generateDnaSequence(prefix: string, length: number, seed: number): string {
  let rng = seed;
  const bases = 'ATCG';
  let seq = prefix;
  while (seq.length < length) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    seq += bases[(rng >>> 16) & 3];
  }
  return seq.slice(0, length);
}

function hashGeneName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Extended assembly gene sequences — 20 genes with lengths 75–100 bp.
 * The 5 curated sequences are kept; others are generated from their
 * real 30 bp prefix using a seeded PRNG.
 */
const ASSEMBLY_GENE_LENGTHS: [string, number][] = [
  ['Insulin', 75], ['GFP', 75], ['lacZ-α', 75], ['kanR', 75], ['BFP', 75],
  ['RFP', 80], ['mCherry', 80], ['YFP', 80], ['zeoR', 75],
  ['cmR', 85], ['tetR', 85], ['ampR', 85],
  ['luciferase', 90], ['β-lactamase', 90],
  ['hygR', 95], ['recA', 95],
  ['p53', 100], ['nptII', 80], ['lacI', 100], ['araC', 80],
  // Short peptide genes — assembly length ≈ real gene length
  ['Magainin 2', 72], ['Melittin', 84], ['hBD-1', 100],
  ['LL-37', 100], ['Cecropin A', 100], ['Thymosin β4', 100],
  // Small non-coding RNAs — assembly length = mature sequence length
  ['miR-21', 22], ['let-7a', 22], ['tRF-Gly', 30], ['RyhB', 30],
];

const EXPANDED_ASSEMBLY_SEQUENCES: Record<string, string> = {};
for (const [gene, len] of ASSEMBLY_GENE_LENGTHS) {
  const curated = ASSEMBLY_GENE_SEQUENCES[gene];
  if (curated) {
    EXPANDED_ASSEMBLY_SEQUENCES[gene] = curated.length >= len
      ? curated.slice(0, len)
      : generateDnaSequence(curated, len, hashGeneName(gene));
  } else {
    const prefix = GENE_SEQUENCES[gene] ?? 'ATG';
    EXPANDED_ASSEMBLY_SEQUENCES[gene] = generateDnaSequence(prefix, len, hashGeneName(gene));
  }
}

/** The subset of gene names that have assembly-length sequences. */
const ASSEMBLY_GENE_NAMES = ASSEMBLY_GENE_LENGTHS.map(([name]) => name);
const ASSEMBLY_TARGET = 'Insulin';
const ASSEMBLY_FULL_SEQ = EXPANDED_ASSEMBLY_SEQUENCES[ASSEMBLY_TARGET];
const ASSEMBLY_OVERLAP_K = 8;
const ASSEMBLY_READ_LEN = 25;
const assemblyReads = shuffleReads(
  generateReads(ASSEMBLY_FULL_SEQ, ASSEMBLY_READ_LEN, ASSEMBLY_OVERLAP_K, 42),
  7,
);

const ASSEMBLY_DATA: AssemblyPuzzleData = {
  reads: assemblyReads,
  overlapK: ASSEMBLY_OVERLAP_K,
  targetGene: ASSEMBLY_TARGET,
  fullSequence: ASSEMBLY_FULL_SEQ,
};

export const PUZZLE_ASSEMBLE_SEQUENCE: LabPuzzle = {
  id: 'L5',
  title: 'Assemble the Sequence',
  briefing: 'Sanger sequencing can only read DNA in short stretches. We sheared multiple copies of an unknown gene and sequenced the fragments — but now all we have is a pile of overlapping reads. What was the original sequence, and which gene is it?',
  reference: {
    geneTable: GENE_TABLE,
    geneSequences: EXPANDED_ASSEMBLY_SEQUENCES,
  },
  acceptedAnswers: [ASSEMBLY_TARGET, ASSEMBLY_TARGET.toLowerCase()],
  question: 'Which gene did the reads come from?',
  answerOptions: ASSEMBLY_GENE_NAMES,
  instruments: ['assembly'],
  geneSequences: EXPANDED_ASSEMBLY_SEQUENCES,
  assemblyData: ASSEMBLY_DATA,
};

/**
 * L6 — Reverse Complement Assembly (gentle intro)
 *
 * Lesson: DNA is double-stranded. Sequencing reads can come from either
 * strand. Some reads arrive as the reverse complement and the player
 * must recognize and flip them before they'll overlap correctly.
 *
 * Uses a short 30 bp sRNA (tRF-Gly) with 3 reads of 15 bp, 5 bp overlap,
 * and only 1 read flipped — much gentler than the 75 bp GFP version.
 */
const RC_TARGET = 'tRF-Gly';
const RC_FULL_SEQ = EXPANDED_ASSEMBLY_SEQUENCES[RC_TARGET];
const RC_READ_LEN = 15;
const RC_OVERLAP_K = 5;
const rcReads = shuffleReads(
  flipSomeReads(
    generateReads(RC_FULL_SEQ, RC_READ_LEN, RC_OVERLAP_K, 99),
    31,
  ),
  13,
);

export const PUZZLE_REVERSE_COMPLEMENT_ASSEMBLY: LabPuzzle = {
  id: 'L6',
  title: 'Read Both Strands',
  briefing: 'DNA is double-stranded — sequencing reads can come from either strand. Some of these fragments are reverse complements of the original sequence. You\'ll need to identify which reads are flipped and correct their orientation before the overlaps will line up.',
  reference: {
    geneTable: GENE_TABLE,
    geneSequences: EXPANDED_ASSEMBLY_SEQUENCES,
  },
  acceptedAnswers: [RC_TARGET, RC_TARGET.toLowerCase()],
  question: 'Which gene did the reads come from?',
  answerOptions: ASSEMBLY_GENE_NAMES,
  instruments: ['assembly'],
  geneSequences: EXPANDED_ASSEMBLY_SEQUENCES,
  assemblyData: {
    reads: rcReads,
    overlapK: RC_OVERLAP_K,
    targetGene: RC_TARGET,
    fullSequence: RC_FULL_SEQ,
  },
};

export const PUZZLE_RESTRICTION_MAP: LabPuzzle = {
  id: 'L7',
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
 * L8 — The Mislabeled Cultures
 *
 * Lesson: ELISA as experimental design. Six culture tubes lost their labels.
 * Eight antibodies are available — some highly specific, some cross-reactive
 * with 3-tier binding (strong / weak / none). Budget of 12 wells forces
 * the player to reason about which 2 antibodies create unique fingerprints
 * for all 6 proteins. The sole solution pair is Anti-Globulin + Anti-His-tag.
 */

const ELISA_PROTEINS = ['GFP', 'Insulin', 'Lysozyme', 'Amylase', 'Catalase', 'Albumin'] as const;

/**
 * No monospecific antibodies — every antibody cross-reacts with at least two proteins.
 * Only Anti-Globulin + Anti-His-tag produces unique (signalG, signalH) pairs for all 6.
 * Any other 2-antibody pair has ≥1 collision → mathematically ambiguous → can't finish mapping.
 */
const ELISA_ANTIBODIES: AntibodyEntry[] = [
  {
    name: 'Anti-Globulin',
    target: 'Globular proteins',
    description: 'Polyclonal serum raised against compact globular folds. Binds lysozyme and albumin strongly; insulin weakly due to its small globular structure.',
    binding: { GFP: 'none', Insulin: 'weak', Lysozyme: 'strong', Amylase: 'none', Catalase: 'none', Albumin: 'strong' },
  },
  {
    name: 'Anti-His-tag',
    target: 'Polyhistidine tag',
    description: 'Targets the His₆ purification tag found on recombinant GFP and Insulin. Weak cross-reactivity with catalase (heme-pocket histidines) and albumin (metal-binding histidines).',
    binding: { GFP: 'strong', Insulin: 'strong', Lysozyme: 'none', Amylase: 'none', Catalase: 'weak', Albumin: 'weak' },
  },
  {
    name: 'Anti-Amylase',
    target: 'Amylase',
    description: 'Monoclonal antibody targeting amylase active site. Weak cross-reactivity with catalase due to shared enzymatic motifs.',
    binding: { GFP: 'none', Insulin: 'none', Lysozyme: 'none', Amylase: 'strong', Catalase: 'weak', Albumin: 'none' },
  },
  {
    name: 'Anti-Catalase',
    target: 'Catalase',
    description: 'Monoclonal antibody targeting catalase heme pocket. Weak cross-reactivity with amylase.',
    binding: { GFP: 'none', Insulin: 'none', Lysozyme: 'none', Amylase: 'weak', Catalase: 'strong', Albumin: 'none' },
  },
  {
    name: 'Anti-Enzyme',
    target: 'Enzymatic proteins',
    description: 'Polyclonal serum raised against conserved catalytic domains. Binds lysozyme, amylase, and catalase strongly.',
    binding: { GFP: 'none', Insulin: 'none', Lysozyme: 'strong', Amylase: 'strong', Catalase: 'strong', Albumin: 'none' },
  },
];

const ELISA_BINDING_MATRIX: Record<string, Record<string, ElisaSignal>> = Object.fromEntries(
  ELISA_ANTIBODIES.map(ab => [ab.name, ab.binding])
);

export const PUZZLE_MISLABELED_CULTURES: LabPuzzle = {
  id: 'L8',
  title: 'The Mislabeled Cultures',
  briefing: 'A fridge malfunction melted the label adhesive overnight. Six culture tubes — each producing a different protein — are now unlabeled. Antibodies aren\'t perfectly specific: one that binds strongly to your target may bind weakly to a structurally similar protein. Study the binding profiles in the reference book and design a two-antibody panel that produces a unique signal fingerprint for every tube. You have 12 wells.',
  reference: {
    geneTable: [],
  },
  acceptedAnswers: [],
  question: 'Which tube contains which protein?',
  instruments: ['elisa'],
  answerType: 'mapping',
  answerMappingLabels: ['Tube A', 'Tube B', 'Tube C', 'Tube D', 'Tube E', 'Tube F'],
  answerMappingOptions: [...ELISA_PROTEINS],
  elisaDesign: {
    samples: ['Tube A', 'Tube B', 'Tube C', 'Tube D', 'Tube E', 'Tube F'],
    antibodies: ELISA_ANTIBODIES,
    bindingMatrix: ELISA_BINDING_MATRIX,
    truthMap: {
      'Tube A': 'Albumin',
      'Tube B': 'GFP',
      'Tube C': 'Catalase',
      'Tube D': 'Insulin',
      'Tube E': 'Lysozyme',
      'Tube F': 'Amylase',
    },
    wellBudget: 12,
  },
};

/**
 * L9 — Fingerprint the Strain
 *
 * Lesson: Multi-sample PCR with gel electrophoresis. Five bacterial isolates
 * look identical. Eight primer pairs available — some universal (trap),
 * some shared (trap), some species-specific, and one (gyrB) that gives
 * different band sizes per species. Budget of 6 gel lanes forces strategic
 * primer selection. Optimal strategy: gyrB on all 5 (5 lanes, groups by
 * band size) + stx1 on one E. coli candidate (1 lane) = 6 lanes total.
 */

const PCR_SPECIES = ['E. coli K-12', 'E. coli O157:H7', 'S. aureus MRSA', 'P. aeruginosa', 'B. subtilis'] as const;

/**
 * No single-species silver-bullet primers (mecA/toxA/spo0A removed).
 * Without gyrB, MRSA/Pseudo/Bacillus are indistinguishable — mathematically ambiguous.
 * Optimal path: gyrB×5 (unique sizes for 3 species, E. coli tie at 370) + stx1×1 (breaks tie).
 * Trap primers (16S, lacZ, uidA) look useful but give no species discrimination.
 */
const PCR_PRIMERS: Array<{ name: string; description: string; bandBySpecies: Record<string, number> }> = [
  {
    name: '16S rRNA',
    description: 'Universal bacterial ribosomal marker — amplifies in all bacteria',
    bandBySpecies: { 'E. coli K-12': 1500, 'E. coli O157:H7': 1500, 'S. aureus MRSA': 1500, 'P. aeruginosa': 1500, 'B. subtilis': 1500 },
  },
  {
    name: 'lacZ',
    description: 'β-galactosidase gene (Enterobacteriaceae only)',
    bandBySpecies: { 'E. coli K-12': 520, 'E. coli O157:H7': 520, 'S. aureus MRSA': 0, 'P. aeruginosa': 0, 'B. subtilis': 0 },
  },
  {
    name: 'uidA',
    description: 'β-glucuronidase gene (Enterobacteriaceae only)',
    bandBySpecies: { 'E. coli K-12': 590, 'E. coli O157:H7': 590, 'S. aureus MRSA': 0, 'P. aeruginosa': 0, 'B. subtilis': 0 },
  },
  {
    name: 'gyrB',
    description: 'DNA gyrase subunit B — amplicon size varies by species',
    bandBySpecies: { 'E. coli K-12': 370, 'E. coli O157:H7': 370, 'S. aureus MRSA': 500, 'P. aeruginosa': 630, 'B. subtilis': 440 },
  },
  {
    name: 'stx1',
    description: 'Shiga toxin 1 virulence gene',
    bandBySpecies: { 'E. coli K-12': 0, 'E. coli O157:H7': 380, 'S. aureus MRSA': 0, 'P. aeruginosa': 0, 'B. subtilis': 0 },
  },
];

export const PUZZLE_FINGERPRINT_STRAIN: LabPuzzle = {
  id: 'L9',
  title: 'Fingerprint the Strain',
  briefing: 'Five bacterial isolates arrived from the hospital — they look identical on agar. Two are E. coli strains (one safe, one dangerous), one is MRSA, one is Pseudomonas, and one is Bacillus. You have five primer pairs — each amplifies a different target, and some species produce different-sized bands with the same primer. Design a strategy that gives every sample a unique fingerprint within your lane budget.',
  reference: {
    geneTable: [],
  },
  acceptedAnswers: [],
  question: 'Which sample is which species?',
  instruments: ['pcr', 'gel'],
  answerType: 'mapping',
  answerMappingLabels: ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5'],
  answerMappingOptions: [...PCR_SPECIES],
  samplePcr: {
    samples: ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5'],
    species: [...PCR_SPECIES],
    primers: PCR_PRIMERS,
    truthMap: {
      'Sample 1': 'P. aeruginosa',
      'Sample 2': 'E. coli K-12',
      'Sample 3': 'S. aureus MRSA',
      'Sample 4': 'B. subtilis',
      'Sample 5': 'E. coli O157:H7',
    },
    gelLaneBudget: 6,
  },
};

// ── Promoter Architect site definitions ────────────────────────────────────

// PA1: tutorial activator — footprint 25bp so precision matters against 22bp range
const ACT_TUTORIAL: PromoterSite = { id: 'act-tutorial', label: 'Activator', role: 'activator', footprintBp: 25, color: '#22c55e' };
// PA2/PA3: standard activators
const ACT_BLUE: PromoterSite    = { id: 'act-blue',  label: 'Activator', role: 'activator', footprintBp: 20, color: '#3b82f6' };
const ACT_AMBER: PromoterSite   = { id: 'act-amber', label: 'Activator', role: 'activator', footprintBp: 20, color: '#f59e0b' };
// PA2: broad-range repressor (same range as activators — creates collateral damage on adjacent genes)
const REP_BROAD: PromoterSite   = { id: 'rep-broad', label: 'Repressor', role: 'repressor', footprintBp: 20, color: '#f97316' };
// PA2: short-range silencer — only affects a gene within 12bp, zero collateral damage
const SILENCER: PromoterSite    = { id: 'silencer',  label: 'Silencer',  role: 'repressor', footprintBp: 15, color: '#ef4444', activationRangeOverrideBp: 12 };
// PA3: environment repressor (in siteLibrary, used only in fixedSites of states)
const ENV_REP: PromoterSite     = { id: 'env-rep',   label: 'Env. Repressor', role: 'repressor', footprintBp: 20, color: '#6b7280' };

// PA1 — First Contact (proximity + precision tutorial)
export const PUZZLE_PA1: LabPuzzle = {
  id: 'PA1', title: 'First Contact',
  briefing: 'The gene is dark. Place the activator precisely on the promoter to switch it on.',
  reference: { geneTable: [] },
  acceptedAnswers: [],
  instruments: ['promoter-architect'],
  promoterData: {
    railLengthBp: 120,
    activationRangeBp: 22,
    promoters: [{ positionBp: 60, label: 'Gene A', minExpression: 0.8 }],
    availableSites: [ACT_TUTORIAL],
  },
};

// PA2 — The Crowded Gene (spatial interference + Silencer discovery)
// Activator at A bleeds ~36% into Gene B. Broad repressor near B crushes flanking genes.
// Silencer (range 12bp override) placed on B suppresses it with zero collateral damage.
export const PUZZLE_PA2: LabPuzzle = {
  id: 'PA2', title: 'The Crowded Gene',
  briefing: 'The flanking genes must stay on. The middle gene must stay off. Careful — your activator\'s signal reaches further than you think.',
  reference: { geneTable: [] },
  acceptedAnswers: [],
  instruments: ['promoter-architect'],
  promoterData: {
    railLengthBp: 200,
    activationRangeBp: 55,
    promoters: [
      { positionBp: 50,  label: 'Gene A', minExpression: 0.9 },
      { positionBp: 95,  label: 'Gene B', minExpression: 0, maxExpression: 0.1 },
      { positionBp: 140, label: 'Gene C', minExpression: 0.9 },
    ],
    availableSites: [ACT_BLUE, ACT_AMBER, REP_BROAD, SILENCER],
  },
};

// PA3 — Two States (same circuit, two environments)
// Player places 2 activators once. State 1: env repressor is far away (no effect) — both genes must fire.
// State 2: env repressor clamps Growth to ~22%. Growth target flips to ≤ 25%.
// Insight: the same placement works for both states; trust the environment.
export const PUZZLE_PA3: LabPuzzle = {
  id: 'PA3', title: 'Two States',
  briefing: 'Your circuit runs in two environments. When the safety signal is active, both genes must fire. When it drops out, Growth must go silent or the cell poisons itself.',
  reference: { geneTable: [] },
  acceptedAnswers: [],
  instruments: ['promoter-architect'],
  promoterData: {
    railLengthBp: 300,
    activationRangeBp: 45,
    promoters: [
      { positionBp: 80,  label: 'Survival', minExpression: 0.9 },
      { positionBp: 220, label: 'Growth',   minExpression: 0.9 },
    ],
    availableSites: [ACT_BLUE, ACT_AMBER],
    siteLibrary: [ENV_REP],
    states: [
      {
        label: 'Safety: ON',
        // env repressor at 285 → center 295, dist from Growth(220) = 75 > range 45: no effect
        fixedSites: [{ siteId: 'env-rep', positionBp: 285 }],
      },
      {
        label: 'Safety: OFF',
        // env repressor at 200 → center 210, dist from Growth(220) = 10: score=1-10/45=0.778 → Growth = 1*(1-0.778)=0.222
        fixedSites: [{ siteId: 'env-rep', positionBp: 200 }],
        promoterOverrides: [
          { positionBp: 80,  label: 'Survival', minExpression: 0.9 },
          { positionBp: 220, label: 'Growth',   minExpression: 0, maxExpression: 0.25 },
        ],
      },
    ],
  },
};

export const LAB_PUZZLES = [
  PUZZLE_VERIFY_INSERT,
  PUZZLE_CONTAMINATED_SAMPLE,
  PUZZLE_IDENTIFY_ISOLATE,
  PUZZLE_SIZE_ISNT_EVERYTHING,
  PUZZLE_ASSEMBLE_SEQUENCE,
  PUZZLE_REVERSE_COMPLEMENT_ASSEMBLY,
  PUZZLE_RESTRICTION_MAP,
  PUZZLE_MISLABELED_CULTURES,
  PUZZLE_FINGERPRINT_STRAIN,
  PUZZLE_PA1,
  PUZZLE_PA2,
  PUZZLE_PA3,
];
