import type { BookEntry, GeneEntry, GeneIcon, LabPuzzle } from './lab-types';

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
    useWhen: 'You need to check size of a PCR product',
    thumbnail: 'gel-bands',
  },
  {
    section: 'instruments', id: 'sequencer', name: 'Sanger Sequencer', icon: 'sequencer',
    measures: 'Reads the base-by-base DNA sequence',
    useWhen: 'You need exact gene identity',
    thumbnail: 'chromatogram',
  },
];

/** Build visual-first book entries from a puzzle's reference data. */
export function buildBookEntries(ref: {
  geneTable: GeneEntry[];
  geneSequences?: Record<string, string>;
  notes?: string[];
}): BookEntry[] {
  const genes: BookEntry[] = ref.geneTable.map(g => ({
    section: 'genes' as const,
    id: g.name,
    name: g.name,
    fullName: g.fullName,
    length: g.length,
    sequence: ref.geneSequences?.[g.name] ?? '',
    icon: GENE_ICON_MAP[g.name] ?? 'unknown',
    roleLine: GENE_ROLE_LINES[g.name] ?? 'Function not annotated',
  }));

  const caseNotes: BookEntry[] = (ref.notes ?? []).map((bullet, i) => ({
    section: 'case-notes' as const,
    id: `note-${i}`,
    bullet,
  }));

  return [...genes, ...INSTRUMENT_ENTRIES, ...caseNotes];
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
    notes: [
      'Design primers that flank the insert',
      'PCR then gel to measure the band',
      'Match size against the Genes section',
    ],
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
    notes: [
      'Examine the sample with PCR, gel, and sequencer',
      'Genes section lists expected sizes per gene',
    ],
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

export const LAB_PUZZLES = [PUZZLE_VERIFY_INSERT, PUZZLE_CONTAMINATED_SAMPLE];
