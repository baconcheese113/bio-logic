// Types live with the data they describe
export type SampleType = 
  | 'blood' 
  | 'sputum' 
  | 'throat-swab' 
  | 'stool' 
  | 'wound' 
  | 'csf' 
  | 'urine'
  | 'tissue';

export type GramStain = 'positive' | 'negative' | 'variable';
export type Shape = 'cocci' | 'bacilli' | 'spirochete' | 'diplococci' | 'coccobacilli';
export type Arrangement = 'chains' | 'clusters' | 'pairs' | 'single' | 'palisades';
export type Hemolysis = 'alpha' | 'beta' | 'gamma' | 'none';
export type ColonyColor = 'golden' | 'white' | 'gray' | 'pink' | 'colorless' | 'none';

// Protein electrophoresis types
export type ProteinPattern = 
  | 'normal'
  | 'm-spike' // Multiple myeloma
  | 'beta-gamma-bridge' // Cirrhosis
  | 'low-albumin' // Nephrotic syndrome
  | 'polyclonal-gammopathy'; // Chronic inflammation

export type AlbuminLevel = 'low' | 'normal' | 'high';
export type GlobulinLevel = 'low' | 'normal' | 'high';

// Densitometer reading - percentage of total protein in each region
export interface DensitometerReading {
  albumin: number; // Normal: 52-68%
  alpha1: number; // Normal: 2.4-5%
  alpha2: number; // Normal: 5.1-11%
  beta: number; // Normal: 7.5-15%
  gamma: number; // Normal: 10-21%
}

// PCR and DNA electrophoresis types
export type GeneTarget = 
  | 'mecA'        // MRSA detection (methicillin resistance)
  | '16S-rRNA'    // Universal bacterial marker
  | 'IS6110'      // TB-specific insertion sequence
  | 'HIV-gag'     // HIV viral gene
  | 'none';       // No PCR performed

// Epic 11: Gene sequences for interactive primer design
export interface GeneSequenceData {
  id: GeneTarget;
  name: string;
  fullSequence: string; // 500bp actual DNA sequence
  description: string;
  optimalAmplificationRegion: {
    start: number; // 0-based position
    end: number;
    expectedSize: number;
  };
  suggestedForwardRange: { min: number; max: number };
  suggestedReverseRange: { min: number; max: number };
}

// Player's custom primer design
export interface PrimerDesign {
  forwardStart: number;   // Position in sequence (0-based)
  forwardLength: number;  // 18-25bp
  reverseStart: number;   
  reverseLength: number;
}

// Quality evaluation of primer design
export interface PrimerQuality {
  forwardTm: number;
  reverseTm: number;
  tmMatch: boolean;
  tmDifference: number;
  
  forwardGC: number;
  reverseGC: number;
  gcContentGood: boolean;
  
  selfComplementarity: number; // 0-10 score
  selfCompGood: boolean;
  
  hasHairpins: boolean;
  hairpinDetails?: Array<{
    primer: 'forward' | 'reverse';
    position: number;
    stemLength: number;
  }>;
  
  productSize: number;
  productSizeGood: boolean;
  
  overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'fail';
  canAmplify: boolean;
  expectedBandPattern: 'clean' | 'weak' | 'smeared' | 'dimers' | 'none';
}

export interface PCRTarget {
  geneId: GeneTarget;
  description: string;
}

// Sanger Sequencing types
export type DdNTPType = 'ddATP' | 'ddTTP' | 'ddGTP' | 'ddCTP';

export interface SangerSequenceData {
  id: string;
  name: string;
  description: string;
  templateSequence: string; // The DNA sequence to be read (50-100bp)
  primerBindingSite: number; // Where the sequencing primer binds
  readableRegion: {
    start: number;
    end: number;
  };
}

export interface SangerReactionSetup {
  templatePrepared: boolean;
  primerAdded: boolean;
  selectedDdNTPs: DdNTPType[];
  polymeraseAdded: boolean;
}

// Flow Cytometry types (1970s Cytofluorograph 4800A)
// Standard cell types with fixed scatter properties
export type CellTypeName = 
  | 'debris' 
  | 'rbc' 
  | 'lymphocyte' 
  | 'monocyte' 
  | 'neutrophil' 
  | 'epithelial'
  | 'bacteria-cocci'
  | 'bacteria-bacilli';

export interface StandardCellType {
  name: string;
  forwardScatterMean: number;
  sideScatterMean: number;
  stdDevFSC: number;
  stdDevSSC: number;
  outlierPercentage: number;
}

// Standard cell types - same FSC/SSC regardless of sample
export const CELL_TYPES: Record<CellTypeName, StandardCellType> = {
  'debris': { name: 'Debris/Dead Cells', forwardScatterMean: 10, sideScatterMean: 12, stdDevFSC: 2.5, stdDevSSC: 3, outlierPercentage: 8 },
  'rbc': { name: 'Red Blood Cells', forwardScatterMean: 20, sideScatterMean: 10, stdDevFSC: 3, stdDevSSC: 2, outlierPercentage: 2 },
  'lymphocyte': { name: 'Lymphocytes', forwardScatterMean: 48, sideScatterMean: 30, stdDevFSC: 6, stdDevSSC: 8, outlierPercentage: 4 },
  'monocyte': { name: 'Monocytes', forwardScatterMean: 63, sideScatterMean: 50, stdDevFSC: 7, stdDevSSC: 9, outlierPercentage: 5 },
  'neutrophil': { name: 'Neutrophils', forwardScatterMean: 68, sideScatterMean: 75, stdDevFSC: 8, stdDevSSC: 10, outlierPercentage: 5 },
  'epithelial': { name: 'Epithelial Cells', forwardScatterMean: 52, sideScatterMean: 42, stdDevFSC: 7, stdDevSSC: 8, outlierPercentage: 6 },
  'bacteria-cocci': { name: 'Bacterial Cocci', forwardScatterMean: 18, sideScatterMean: 22, stdDevFSC: 4, stdDevSSC: 4.5, outlierPercentage: 3 },
  'bacteria-bacilli': { name: 'Bacterial Bacilli', forwardScatterMean: 25, sideScatterMean: 20, stdDevFSC: 5, stdDevSSC: 4, outlierPercentage: 3 },
};

// What actually varies: which cells appear and their percentages
export interface FlowCytometryProperties {
  populations: { type: CellTypeName; percentage: number }[];
  clinicalContext: string;
}

export interface CultureProperties {
  bloodAgar: {
    growthQuality: 'good' | 'poor' | 'none';
    colonyColor: ColonyColor;
    hemolysis: Hemolysis;
  };
  macConkey: {
    growthQuality: 'good' | 'poor' | 'none';
    colonyColor: ColonyColor;
    lactoseFermenter: boolean;
  };
  catalase: boolean;
  coagulase: boolean;
}

export interface SerologyProperties {
  producesAntibodies: boolean; // Does infection create detectable antibodies?
  canTypeSera?: boolean; // Can be used for serotyping (like Salmonella)
}

export type AntibioticSensitivity = 'resistant' | 'intermediate' | 'sensitive';

// Helper function to infer sensitivity from zone size
export function getAntibioticSensitivity(zoneSize: number): AntibioticSensitivity {
  if (zoneSize <= 12) return 'resistant';
  if (zoneSize <= 18) return 'intermediate';
  return 'sensitive';
}

export interface AntibioticProperties {
  penicillin: number; // Zone diameter in mm
  streptomycin: number;
  tetracycline: number;
  chloramphenicol: number;
  erythromycin: number;
}

export interface ProteinElectrophoresisProperties {
  pattern: ProteinPattern;
  densitometer: DensitometerReading;
  clinicalContext: string; // What disease/condition this represents
}

export interface Organism {
  id: string;
  scientificName: string;
  commonName: string;
  gramStain: GramStain;
  acidFast: boolean; // For Ziehl-Neelsen stain
  capsule: boolean; // For capsule stain
  sporeFormer: boolean; // For spore stain
  shape: Shape;
  arrangement: Arrangement;
  notes: string;
  culture?: CultureProperties; // Optional for now
  serology?: SerologyProperties; // Optional for now
  antibiotics?: AntibioticProperties; // Optional for now
  proteinElectrophoresis?: ProteinElectrophoresisProperties; // For protein pattern cases
  pcrMarkers?: GeneTarget[]; // Genes this organism has (for PCR detection)
  expectedPCRSizes?: Partial<Record<GeneTarget, number>>; // Expected fragment sizes in bp
  flowCytometry?: FlowCytometryProperties; // For cell population analysis
}

// Answer format configuration for different case types
export interface AnswerFormat {
  type: 'organism-id' | 'blood-type' | 'immunity-status' | 'antibody-detection' | 'antibiotic-choice' | 'clinical-diagnosis';
  options?: string[];
}

export const ANSWER_FORMATS: Record<string, AnswerFormat> = {
  'organism-identification': {
    type: 'organism-id',
  },
  'blood-typing': {
    type: 'blood-type',
    options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  'immunity-screening': {
    type: 'immunity-status',
    options: ['immune', 'not-immune']
  },
  'syphilis-detection': {
    type: 'antibody-detection',
    options: ['positive', 'negative']
  },
  'antibiotic-selection': {
    type: 'antibiotic-choice',
    options: ['penicillin', 'streptomycin', 'tetracycline', 'chloramphenicol', 'erythromycin']
  },
  'clinical-diagnosis': {
    type: 'clinical-diagnosis',
    options: ['multiple-myeloma', 'liver-cirrhosis', 'nephrotic-syndrome', 'chronic-inflammation', 'normal-serum']
  }
};

export interface Case {
  id: string;
  title: string;
  story: string;
  correctSampleType: SampleType;
  answerFormat: keyof typeof ANSWER_FORMATS;
  correctAnswer: string;
  bestAntibiotic?: string; // For antibiotic-selection cases
  pcrTarget?: PCRTarget;    // For gene-detection cases
}

// Epic 0+1+3+4: Expanded organisms with multiple stain types
export const ORGANISMS: Organism[] = [
  {
    id: 'strep_pyogenes',
    scientificName: 'Streptococcus pyogenes',
    commonName: 'Group A Streptococcus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'cocci',
    arrangement: 'chains',
    notes: 'Gram-positive cocci in chains, beta-hemolytic on blood agar',
    culture: {
      bloodAgar: {
        growthQuality: 'good',
        colonyColor: 'gray',
        hemolysis: 'beta',
      },
      macConkey: {
        growthQuality: 'none',
        colonyColor: 'none',
        lactoseFermenter: false,
      },
      catalase: false,
      coagulase: false,
    },
    antibiotics: {
      penicillin: 30, // Highly sensitive, still first-line
      streptomycin: 16,
      tetracycline: 24,
      chloramphenicol: 26,
      erythromycin: 27,
    },
    flowCytometry: {
      populations: [
        { type: 'bacteria-cocci', percentage: 45 },
        { type: 'neutrophil', percentage: 35 },
        { type: 'debris', percentage: 20 },
      ],
      clinicalContext: 'Bacterial throat infection showing small bacterial cocci with elevated neutrophil response',
    },
  },
  {
    id: 'staph_aureus',
    scientificName: 'Staphylococcus aureus',
    commonName: 'Golden Staph',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'cocci',
    arrangement: 'clusters',
    notes: 'Gram-positive cocci in grape-like clusters, catalase positive, coagulase positive',
    culture: {
      bloodAgar: {
        growthQuality: 'good',
        colonyColor: 'golden',
        hemolysis: 'beta',
      },
      macConkey: {
        growthQuality: 'none',
        colonyColor: 'none',
        lactoseFermenter: false,
      },
      catalase: true,
      coagulase: true,
    },
    antibiotics: {
      penicillin: 28, // Early strains sensitive
      streptomycin: 8, // Naturally resistant
      tetracycline: 25,
      chloramphenicol: 22,
      erythromycin: 24,
    },
    pcrMarkers: ['16S-rRNA'], // All bacteria have this
    expectedPCRSizes: {
      '16S-rRNA': 1500,
    },
  },
  {
    id: 'staph_aureus_mrsa',
    scientificName: 'Staphylococcus aureus (MRSA)',
    commonName: 'Methicillin-Resistant Staph',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'cocci',
    arrangement: 'clusters',
    notes: 'MRSA - Gram-positive cocci in clusters, catalase positive, coagulase positive, carries mecA resistance gene',
    culture: {
      bloodAgar: {
        growthQuality: 'good',
        colonyColor: 'golden',
        hemolysis: 'beta',
      },
      macConkey: {
        growthQuality: 'none',
        colonyColor: 'none',
        lactoseFermenter: false,
      },
      catalase: true,
      coagulase: true,
    },
    antibiotics: {
      penicillin: 0, // Resistant
      streptomycin: 8, // Naturally resistant
      tetracycline: 25,
      chloramphenicol: 22,
      erythromycin: 24,
    },
    pcrMarkers: ['mecA', '16S-rRNA'], // Has mecA resistance gene
    expectedPCRSizes: {
      'mecA': 310,
      '16S-rRNA': 1500,
    },
  },
  {
    id: 'e_coli',
    scientificName: 'Escherichia coli',
    commonName: 'E. coli',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative rod, lactose fermenter, common intestinal flora',
    culture: {
      bloodAgar: {
        growthQuality: 'good',
        colonyColor: 'gray',
        hemolysis: 'gamma',
      },
      macConkey: {
        growthQuality: 'good',
        colonyColor: 'pink',
        lactoseFermenter: true,
      },
      catalase: true,
      coagulase: false,
    },
    antibiotics: {
      penicillin: 10, // Gram-negative, less susceptible
      streptomycin: 22, // Aminoglycosides work on Gram-neg
      tetracycline: 26, // Broad-spectrum
      chloramphenicol: 24,
      erythromycin: 8, // Macrolides poor against Gram-neg
    },
  },
  {
    id: 'n_gonorrhoeae',
    scientificName: 'Neisseria gonorrhoeae',
    commonName: 'Gonococcus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'diplococci',
    arrangement: 'pairs',
    notes: 'Gram-negative diplococci, kidney bean-shaped pairs, oxidase positive',
    antibiotics: {
      penicillin: 26, // Early strains sensitive
      streptomycin: 16,
      tetracycline: 28,
      chloramphenicol: 24,
      erythromycin: 18,
    },
  },
  {
    id: 'm_tuberculosis',
    scientificName: 'Mycobacterium tuberculosis',
    commonName: 'TB bacillus',
    gramStain: 'variable',
    acidFast: true,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Acid-fast bacilli, beaded or cord-like appearance, extremely slow growing',
    antibiotics: {
      penicillin: 0, // Waxy cell wall resistant
      streptomycin: 20, // First effective TB treatment!
      tetracycline: 14,
      chloramphenicol: 6,
      erythromycin: 7,
    },
    pcrMarkers: ['IS6110', '16S-rRNA'], // IS6110 unique to M. tuberculosis complex
    expectedPCRSizes: {
      'IS6110': 245,
      '16S-rRNA': 1500,
    },
  },
  {
    id: 'c_tetani',
    scientificName: 'Clostridium tetani',
    commonName: 'Tetanus bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: true,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-positive rod with terminal round spore (drumstick appearance), obligate anaerobe',
    antibiotics: {
      penicillin: 30, // Good anaerobic coverage
      streptomycin: 0, // Aminoglycosides need oxygen
      tetracycline: 27,
      chloramphenicol: 25,
      erythromycin: 24,
    },
  },
  {
    id: 'v_cholerae',
    scientificName: 'Vibrio cholerae',
    commonName: 'Cholera vibrio',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative curved rod (comma-shaped), rapid darting motility',
    antibiotics: {
      penicillin: 10,
      streptomycin: 21,
      tetracycline: 29, // Very effective
      chloramphenicol: 26,
      erythromycin: 16,
    },
  },
  {
    id: 's_typhi',
    scientificName: 'Salmonella typhi',
    commonName: 'Typhoid bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative rod, motile, non-lactose fermenter, grows on MacConkey agar',
    antibiotics: {
      penicillin: 0,
      streptomycin: 19,
      tetracycline: 23,
      chloramphenicol: 28, // Historically used for typhoid
      erythromycin: 8,
    },
  },
  {
    id: 'c_diphtheriae',
    scientificName: 'Corynebacterium diphtheriae',
    commonName: 'Diphtheria bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'palisades',
    notes: 'Gram-positive club-shaped rod in palisades or Chinese letter arrangement, metachromatic granules',
    antibiotics: {
      penicillin: 32, // Highly effective
      streptomycin: 15,
      tetracycline: 24,
      chloramphenicol: 23,
      erythromycin: 27,
    },
  },
  {
    id: 'k_pneumoniae',
    scientificName: 'Klebsiella pneumoniae',
    commonName: 'Friedländer bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative rod with prominent capsule, non-motile, mucoid colonies',
    antibiotics: {
      penicillin: 8, // Beta-lactamase producer
      streptomycin: 20,
      tetracycline: 22,
      chloramphenicol: 24,
      erythromycin: 9,
    },
  },
  {
    id: 'p_aeruginosa',
    scientificName: 'Pseudomonas aeruginosa',
    commonName: 'Blue-green pus organism',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative rod, produces blue-green pyocyanin pigment, sweet grape-like odor, oxidase positive',
    antibiotics: {
      penicillin: 0, // Naturally resistant
      streptomycin: 15,
      tetracycline: 9, // Often resistant
      chloramphenicol: 8,
      erythromycin: 0, // Completely resistant
    },
  },
  {
    id: 'b_anthracis',
    scientificName: 'Bacillus anthracis',
    commonName: 'Anthrax bacillus',
    gramStain: 'positive',
    acidFast: false,
    capsule: true,
    sporeFormer: true,
    shape: 'bacilli',
    arrangement: 'chains',
    notes: 'Large Gram-positive rod in chains (boxcar or bamboo rod appearance), capsule, central spores',
    antibiotics: {
      penicillin: 28,
      streptomycin: 17,
      tetracycline: 26,
      chloramphenicol: 24,
      erythromycin: 22,
    },
  },
  {
    id: 's_dysenteriae',
    scientificName: 'Shigella dysenteriae',
    commonName: 'Shiga bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'bacilli',
    arrangement: 'single',
    notes: 'Gram-negative rod, non-motile, non-lactose fermenter, very low infectious dose',
    antibiotics: {
      penicillin: 0,
      streptomycin: 22,
      tetracycline: 27,
      chloramphenicol: 25,
      erythromycin: 9,
    },
  },
  {
    id: 'y_pestis',
    scientificName: 'Yersinia pestis',
    commonName: 'Plague bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    shape: 'coccobacilli',
    arrangement: 'single',
    notes: 'Gram-negative coccobacillus with bipolar staining (safety pin appearance), non-motile',
    antibiotics: {
      penicillin: 18,
      streptomycin: 24, // Historically used for plague
      tetracycline: 28,
      chloramphenicol: 26,
      erythromycin: 16,
    },
  },
  {
    id: 'strep_pneumoniae',
    scientificName: 'Streptococcus pneumoniae',
    commonName: 'Pneumococcus',
    gramStain: 'positive',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'diplococci',
    arrangement: 'pairs',
    notes: 'Gram-positive lancet-shaped diplococci, polysaccharide capsule, alpha-hemolytic, bile soluble',
    culture: {
      bloodAgar: {
        growthQuality: 'good',
        colonyColor: 'gray',
        hemolysis: 'alpha',
      },
      macConkey: {
        growthQuality: 'none',
        colonyColor: 'none',
        lactoseFermenter: false,
      },
      catalase: false,
      coagulase: false,
    },
    antibiotics: {
      penicillin: 29, // Gold standard treatment
      streptomycin: 14,
      tetracycline: 23,
      chloramphenicol: 25,
      erythromycin: 26,
    },
  },
  {
    id: 'h_influenzae',
    scientificName: 'Haemophilus influenzae',
    commonName: 'Pfeiffer bacillus',
    gramStain: 'negative',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    shape: 'coccobacilli',
    arrangement: 'single',
    notes: 'Small Gram-negative coccobacillus, pleomorphic, requires X and V factors (chocolate agar)',
    antibiotics: {
      penicillin: 12, // Beta-lactamase common
      streptomycin: 15,
      tetracycline: 25,
      chloramphenicol: 29, // Effective for meningitis
      erythromycin: 17,
    },
  },
];

// Case builder helpers to avoid repetition
function createInfectionCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  sampleType: SampleType;
  organism: string;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: c.sampleType,
    answerFormat: 'organism-identification' as const,
    correctAnswer: c.organism,
  }));
}

function createBloodTypingCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  bloodType: string;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: 'blood' as const,
    answerFormat: 'blood-typing' as const,
    correctAnswer: c.bloodType,
  }));
}

function createImmunityCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  hasImmunity: boolean;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: 'blood' as const,
    answerFormat: 'immunity-screening' as const,
    correctAnswer: c.hasImmunity ? 'immune' : 'not-immune',
  }));
}

function createClinicalDiagnosisCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  diagnosis: string;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: 'blood' as const,
    answerFormat: 'clinical-diagnosis' as const,
    correctAnswer: c.diagnosis,
  }));
}

// Epic 3+4: Multiple cases for variety
const INFECTION_CASES = createInfectionCases([
  {
    id: 'case_001',
    title: 'Factory Worker Fever',
    story: 'Steel mill worker, age 38. High fever (3 days), severe sore throat, difficulty swallowing. No recent travel.',
    sampleType: 'throat-swab',
    organism: 'strep_pyogenes',
  },
  {
    id: 'case_002',
    title: 'Infected Wound',
    story: 'Dockworker, age 45. Deep laceration on forearm from rusty metal (5 days ago). Wound is red, swollen, producing thick golden-yellow pus. Patient has fever and the infection is spreading. The wound culture will help identify the pathogen and guide treatment.',
    sampleType: 'wound',
    organism: 'staph_aureus',
  },
  {
    id: 'case_003',
    title: 'Severe Diarrhea',
    story: 'Restaurant cook, age 28. Watery diarrhea (2 days), abdominal cramps, vomiting. Several coworkers ill.',
    sampleType: 'stool',
    organism: 'e_coli',
  },
  {
    id: 'case_004',
    title: 'Urethral Discharge',
    story: 'Sailor, age 24. Painful urination, purulent discharge (3 days). Recent shore leave.',
    sampleType: 'urine',
    organism: 'n_gonorrhoeae',
  },
  {
    id: 'case_005',
    title: 'Chronic Cough',
    story: 'Textile worker, age 52. Persistent cough (3 months), night sweats, weight loss, blood in sputum.',
    sampleType: 'sputum',
    organism: 'm_tuberculosis',
  },
  {
    id: 'case_006',
    title: 'Rusty Nail Injury',
    story: 'Farmhand, age 35. Stepped on rusty nail (7 days ago). Now jaw stiffness, difficulty opening mouth, muscle spasms.',
    sampleType: 'wound',
    organism: 'c_tetani',
  },
  {
    id: 'case_007',
    title: 'Rice-Water Stools',
    story: 'Immigrant laborer, age 29. Sudden onset severe watery diarrhea (1 day), vomiting, severe dehydration. Recently arrived by ship.',
    sampleType: 'stool',
    organism: 'v_cholerae',
  },
  {
    id: 'case_008',
    title: 'Sustained Fever',
    story: 'Boarding house resident, age 33. High fever (10 days), rose-colored spots on abdomen, confusion, constipation.',
    sampleType: 'blood',
    organism: 's_typhi',
  },
  {
    id: 'case_009',
    title: 'Throat Membrane',
    story: 'Schoolchild, age 8. Sore throat (4 days), thick gray membrane in throat, difficulty breathing, bull neck appearance.',
    sampleType: 'throat-swab',
    organism: 'c_diphtheriae',
  },
  {
    id: 'case_010',
    title: 'Pneumonia',
    story: 'Alcoholic vagrant, age 58. Sudden fever, productive cough with thick mucoid sputum (currant jelly), shortness of breath.',
    sampleType: 'sputum',
    organism: 'k_pneumoniae',
  },
  {
    id: 'case_011',
    title: 'Burn Infection',
    story: 'Factory fire victim, age 42. Severe burns (8 days ago), now green-blue discharge from wounds, sweet smell, high fever.',
    sampleType: 'wound',
    organism: 'p_aeruginosa',
  },
  {
    id: 'case_012',
    title: 'Woolsorter Disease',
    story: 'Wool mill worker, age 44. Black painless skin lesion on arm (5 days), surrounding swelling, fever, malaise.',
    sampleType: 'tissue',
    organism: 'b_anthracis',
  },
  {
    id: 'case_013',
    title: 'Bloody Flux',
    story: 'Tenement resident, age 26. Severe bloody diarrhea (3 days), abdominal cramps, fever. Children in building also ill.',
    sampleType: 'stool',
    organism: 's_dysenteriae',
  },
  {
    id: 'case_014',
    title: 'Bubonic Affliction',
    story: 'Wharf rat catcher, age 31. High fever (2 days), painful swollen lymph nodes in groin, black fingers, confusion.',
    sampleType: 'blood',
    organism: 'y_pestis',
  },
  {
    id: 'case_015',
    title: 'Lobar Pneumonia',
    story: 'Coal miner, age 49. Sudden fever with shaking chills, rust-colored sputum, chest pain when breathing.',
    sampleType: 'sputum',
    organism: 'strep_pneumoniae',
  },
  {
    id: 'case_016',
    title: 'Child Meningitis',
    story: 'Orphanage child, age 4. High fever (2 days), stiff neck, vomiting, lethargy, bulging fontanelle.',
    sampleType: 'csf',
    organism: 'h_influenzae',
  },
  {
    id: 'case_017',
    title: 'Skin Abscess Mystery',
    story: 'Butcher, age 37. Large painful boil on neck (4 days), producing creamy pus. Under the microscope you see Gram-positive cocci... but are they Staphylococcus or Streptococcus? Culture and biochemical tests will reveal the truth.',
    sampleType: 'wound',
    organism: 'staph_aureus',
  },
]);

// Epic 8: Blood typing cases
const BLOOD_TYPING_CASES = createBloodTypingCases([
  {
    id: 'case_blood_001',
    title: 'Factory Accident Transfusion',
    story: 'Steel mill worker, age 42. Crushed hand in machinery accident - severe blood loss. Emergency transfusion needed. Doctor orders blood typing before transfusion to prevent fatal reaction. Patient conscious but pale, rapid pulse.',
    bloodType: 'A+',
  },
  {
    id: 'case_blood_002',
    title: 'Surgical Preparation',
    story: 'Pregnant woman, age 28. Scheduled for emergency cesarean section due to placental complications. Hospital requires blood type on file before surgery in case transfusion needed. Patient stable but anxious.',
    bloodType: 'O-',
  },
  {
    id: 'case_blood_003',
    title: 'Emergency Room Trauma',
    story: 'Railway worker, age 35. Fell from platform, multiple fractures and internal bleeding suspected. Blood bank needs type and crossmatch urgently. Patient semiconscious, bleeding internally.',
    bloodType: 'B+',
  },
]);

// Epic 8: Immunity screening cases
const IMMUNITY_CASES = createImmunityCases([
  {
    id: 'case_immunity_001',
    title: 'Railroad Employment Screening',
    story: 'Job applicant, age 24. Railroad company requires proof of diphtheria immunity for all workers (close quarters in camps). Applicant claims vaccination as child in Germany. Schick test will confirm protection.',
    hasImmunity: true,
  },
  {
    id: 'case_immunity_002',
    title: 'School Enrollment Check',
    story: 'Immigrant child, age 7. Public school requires diphtheria immunity verification before enrollment. Family arrived from Italy last month, no vaccination records. Recent diphtheria outbreak in tenement district.',
    hasImmunity: false,
  },
  {
    id: 'case_immunity_003',
    title: 'Factory Worker Medical',
    story: 'Textile mill worker, age 19. Annual health examination required by state labor board. Diphtheria antitoxin test ordered due to crowded working conditions. Worker reports no serious childhood illnesses.',
    hasImmunity: true,
  },
]);

// Epic 9: Antibiotic treatment selection cases
function createAntibioticCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  sampleType: SampleType;
  organism: string;
  bestAntibiotic: string;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: c.sampleType,
    answerFormat: 'antibiotic-selection' as const,
    correctAnswer: c.organism, // Organism ID for culturing
    bestAntibiotic: c.bestAntibiotic, // Best antibiotic for diagnosis
  }));
}

const ANTIBIOTIC_CASES = createAntibioticCases([
  {
    id: 'case_antibiotic_001',
    title: 'Post-Surgical Infection',
    story: 'Patient, age 52. Appendectomy performed 4 days ago. Surgical site now red, swollen, draining thick golden pus. Fever 101°F. Culture shows Gram-positive cocci in clusters, catalase positive, coagulase positive. Sensitivity testing required to select best antibiotic - some strains developing penicillin resistance.',
    sampleType: 'wound',
    organism: 'staph_aureus',
    bestAntibiotic: 'penicillin', // This strain still sensitive (28mm zone)
  },
  {
    id: 'case_antibiotic_002',
    title: 'Resistant Pneumonia',
    story: 'Hospital patient, age 67. Severe pneumonia not responding to initial penicillin treatment. Coughing bloody sputum, high fever, chest pain. Culture shows Gram-negative rod producing blue-green pigment, sweet grape-like odor. This organism notoriously resistant to many antibiotics - test all available options.',
    sampleType: 'sputum',
    organism: 'p_aeruginosa',
    bestAntibiotic: 'streptomycin', // Only one with intermediate sensitivity (15mm)
  },
  {
    id: 'case_antibiotic_003',
    title: 'Tuberculosis Treatment',
    story: 'Sanatorium patient, age 41. Chronic cough (6 months), night sweats, weight loss, bloody sputum. Microscopy confirms acid-fast bacilli. Before streptomycin (1943), TB was incurable. Now sensitivity testing can confirm this revolutionary treatment will work for this patient.',
    sampleType: 'sputum',
    organism: 'm_tuberculosis',
    bestAntibiotic: 'streptomycin', // First effective TB treatment (20mm zone)
  },
  {
    id: 'case_antibiotic_004',
    title: 'Neonatal Meningitis',
    story: 'Newborn infant, age 8 days. Lethargic, refusing to feed, bulging fontanelle, fever 103°F. CSF sample shows increased white cells. Culture reveals Gram-positive diplococci with prominent capsule, alpha-hemolytic. Penicillin is first-line treatment for pneumococcal meningitis - confirm sensitivity before starting.',
    sampleType: 'csf',
    organism: 'strep_pneumoniae',
    bestAntibiotic: 'penicillin', // Best for pneumococcal meningitis, 29mm zone
  },
]);

// Epic 10: Clinical diagnosis cases for protein electrophoresis
const CLINICAL_DIAGNOSIS_CASES = createClinicalDiagnosisCases([
  {
    id: 'case_protein_001',
    title: 'Bone Pain and Anemia',
    story: 'Patient, age 68. Complains of severe back pain for 3 months, fatigue, weight loss. Lab shows anemia, elevated calcium, kidney dysfunction. Protein electrophoresis ordered to investigate abnormal protein production.',
    diagnosis: 'multiple-myeloma',
  },
  {
    id: 'case_protein_002',
    title: 'Chronic Alcohol Use',
    story: 'Patient, age 54. Long history of heavy drinking. Presents with jaundice, swollen abdomen (ascites), spider angiomas on chest. Liver function severely impaired. Protein electrophoresis to assess liver synthetic function.',
    diagnosis: 'liver-cirrhosis',
  },
  {
    id: 'case_protein_003',
    title: 'Severe Swelling',
    story: 'Patient, age 42. Massive swelling in legs and face, foamy urine, high cholesterol. Urine test shows severe protein loss. Protein electrophoresis to characterize protein loss pattern.',
    diagnosis: 'nephrotic-syndrome',
  },
  {
    id: 'case_protein_004',
    title: 'Chronic Osteomyelitis',
    story: 'Patient, age 51. Chronic bone infection (osteomyelitis) for 2 years despite antibiotics. Recurrent fevers, elevated inflammatory markers. Protein electrophoresis to assess chronic immune response.',
    diagnosis: 'chronic-inflammation',
  },
  {
    id: 'case_protein_005',
    title: 'Routine Physical',
    story: 'Patient, age 35. Annual health screening, no complaints. All labs normal. Protein electrophoresis ordered as part of comprehensive metabolic panel for baseline comparison.',
    diagnosis: 'normal-serum',
  }
]);

// Epic 11: Gene sequences for interactive primer design
export const GENE_SEQUENCES: GeneSequenceData[] = [
  {
    id: 'mecA',
    name: 'mecA (Methicillin Resistance Gene)',
    // Actual mecA gene sequence (500bp region)
    fullSequence: 
      'ATGAAAAAAAAAATAAAAGAAGTAGATGCTCAATATGTATCCGATAAAAATAATTGAGTCAGAAGTTTTTTTGATATTACAGAGGATTACAGCTTATTTTAGAGTTAACGCTTGCAACCGAGTAACATAGGGTAAAATATTGATAAGTATTATCGTATGTATTAGAGTAAAAGTACTGTTTGAAGCAGCTAGACTTACTATTACTGTAGAAATGACTGAACGTCCGATAAATTTTCCGATAATATTGTGGCACCTGCTCATAAAGCTCTTTTTGATTTTTATGGTTTAGATACTAATTATCCTGTTCCTATTCATTTGATTCGAAAAAGATTGAAAGGATGATAAAGGTTTATTTACCCACAATACAGGAATATGCTTATTTTAGCGGTTCGAACAGGATTGATCGATATCAACATTAATAACCCAATTCCACATTGTTTCGGTCTAAACAGTTAGAAATAATTCTTGATTTATTGGCACTTGTAATTACTACAGGTAATAAT',
    description: 'Confers resistance to methicillin and other beta-lactam antibiotics in Staphylococcus aureus',
    optimalAmplificationRegion: {
      start: 190,
      end: 500,
      expectedSize: 310,
    },
    // Forward: 180-220 has good 40-60% GC options (e.g., pos 180, 202-220)
    // Reverse: 460-480 has better GC than 480+ (which is too AT-rich)
    suggestedForwardRange: { min: 180, max: 220 },
    suggestedReverseRange: { min: 460, max: 480 },
  },
  {
    id: 'IS6110',
    name: 'IS6110 (TB Insertion Sequence)',
    // Actual IS6110 sequence (500bp region)
    fullSequence:
      'CGGGCGTGGCGGTCGTGGTATGGTGGACCGTAACGGGTCGGGCCCGGTGACCGTTGACGTTCGCGTGACGCGCGGCACGCTGTACCCGCCGAGTCGACTTCCGGTAACGCCGACGAAGACAACCCGGGTGGTACCGGGCGAGGAACCGGGTCACGGGTTCGGGTCATGGCCCGGGACCGCCGCTGGCCCAACCGCTCGACGGGTCCGATGTCGAACGTCGGCGACGCACGGCCGGTGGCGAACACCGCCGAAGCCCTGCGAGCGTAGGCGTCGGTGACAAAGGCCACGTAGGCGAACCTGCCGCTGGTCTCGATGCCGCCCGCGAACACGGTGAAGCGTGGCAACCGGTATAGCGTAGGGGTCGGTCCCGGCCTCGTCCAGCGCCGCTTCGGCCCCGGCGATGGCCGGTTCATCCTCGACGGTGTCGATGTCACCGCGGGCCTTCATGACGAACCCGTCACCCCGCCCGGCGGCACCCCGGTAGCCGGC',
    description: 'Insertion element specific to Mycobacterium tuberculosis complex, used for TB diagnosis',
    optimalAmplificationRegion: {
      start: 155,
      end: 400,
      expectedSize: 245,
    },
    // IS6110 is extremely GC-rich overall (>65% throughout)
    // Forward: Using positions 105-145 (60-75% GC range - closest to acceptable we can get)
    // Reverse: 370-400 region maintains high GC but is best available
    // Note: Players will need to optimize carefully - this gene is challenging!
    suggestedForwardRange: { min: 105, max: 145 },
    suggestedReverseRange: { min: 370, max: 400 },
  },
  {
    id: '16S-rRNA',
    name: '16S rRNA (Universal Bacterial Marker)',
    // Universal 16S sequence region
    fullSequence:
      'AGAGTTTGATCCTGGCTCAGATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAACGGTAACAGGAAGAAGCTTGCTTCTTTGCTGACGAGTGGCGGACGGGTGAGTAATGTCTGGGAAACTGCCTGATGGAGGGGGATAACTACTGGAAACGGTAGCTAATACCGCATAACGTCGCAAGACCAAAGAGGGGGACCTTCGGGCCTCTTGCCATCGGATGTGCCCAGATGGGATTAGCTAGTAGGTGGGGTAACGGCTCACCTAGGCGACGATCCCTAGCTGGTCTGAGAGGATGACCAGCCACACTGGAACTGAGACACGGTCCAGACTCCTACGGGAGGCAGCAGTGGGGAATATTGCACAATGGGCGCAAGCCTGATGCAGCCATGCCGCGTGTATGAAGAAGGCCTTCGGGTTGTAAAGTACTTTCAGCGGGGAGGAAGGGAGTAAAGTTAATACCTTTGCTCATTGACGTTACCCGCAGAAGAAGCACCGGCTAACTCCGTGCCAGCAGCCGCGGTAATACGGAGGGTGCAAGCGTTAATCGGAATTACTGGGCGTAAAGCGCACGCAGGCGGTTTGTTACGT',
    description: 'Conserved ribosomal RNA gene present in all bacteria, used for broad bacterial detection',
    optimalAmplificationRegion: {
      start: 0,
      end: 500,
      expectedSize: 500,
    },
    // Forward: 0-12 has excellent 45-55% GC range (ideal for primers)
    // Reverse: 470-490 has good 50-60% GC range
    suggestedForwardRange: { min: 0, max: 12 },
    suggestedReverseRange: { min: 470, max: 490 },
  },
];

// Epic 11: PCR cases using organism-identification (PCR provides evidence, not answer)
function createPCROrganismCases(cases: Array<{
  id: string;
  title: string;
  story: string;
  sampleType: SampleType;
  organism: string;
  targetGene: GeneTarget;
}>): Case[] {
  return cases.map(c => ({
    id: c.id,
    title: c.title,
    story: c.story,
    correctSampleType: c.sampleType,
    answerFormat: 'organism-identification' as const,
    correctAnswer: c.organism,
    pcrTarget: {
      geneId: c.targetGene,
      description: `PCR target for ${c.organism} identification`,
    },
  }));
}

const PCR_ORGANISM_CASES = createPCROrganismCases([
  {
    id: 'case_pcr_001',
    title: 'Hospital-Acquired MRSA',
    story: `University Hospital, 1987. Post-surgical wound infection not responding to methicillin. 
    Culture shows Staph aureus - golden colonies, beta-hemolysis, catalase and coagulase positive. 
    But is it regular Staph or MRSA?
    
    Dr. Martinez: "The mecA gene codes for altered penicillin-binding protein. If present, this is 
    MRSA and we need vancomycin. PCR can detect it in 6 hours vs 24 hours for disk diffusion. 
    Use microscopy and culture to confirm it's Staph aureus, then design primers to detect mecA resistance gene."`,
    sampleType: 'wound',
    organism: 'staph_aureus_mrsa',
    targetGene: 'mecA',
  },
  {
    id: 'case_pcr_002',
    title: 'Suspected Tuberculosis',
    story: `Public Health Clinic, 1990. Patient with 8-week cough, night sweats, weight loss, hemoptysis. 
    Sputum smear shows acid-fast bacilli - strong presumptive evidence of TB. But TB culture takes 6-8 weeks!
    
    PCR for IS6110 insertion sequence (unique to M. tuberculosis) can confirm in one day. IS6110 has 
    10-20 copies per TB genome, making it highly sensitive. Combine acid-fast stain with PCR for rapid diagnosis.`,
    sampleType: 'sputum',
    organism: 'm_tuberculosis',
    targetGene: 'IS6110',
  },
]);

// Flatten all cases into single array for game use
export const CASES: Case[] = [
  ...INFECTION_CASES,
  ...BLOOD_TYPING_CASES,
  ...IMMUNITY_CASES,
  ...ANTIBIOTIC_CASES,
  ...CLINICAL_DIAGNOSIS_CASES,
  ...PCR_ORGANISM_CASES,
];

// Epic 4: Background material visible for each sample type
// When wrong sample is selected, only background cells are visible (no bacteria)
export type SampleBackground = 
  | 'blood-cells'      // Red blood cells, occasional white blood cells
  | 'epithelial-cells' // Squamous/columnar epithelial cells
  | 'fecal-matter'     // Undigested food particles, plant fibers
  | 'pus-cells'        // Neutrophils, cellular debris
  | 'clear-fluid';     // Nearly empty, just a few cells

export const SAMPLE_BACKGROUNDS: Record<SampleType, SampleBackground> = {
  'blood': 'blood-cells',
  'sputum': 'epithelial-cells',
  'throat-swab': 'epithelial-cells',
  'stool': 'fecal-matter',
  'wound': 'pus-cells',
  'csf': 'clear-fluid',
  'urine': 'clear-fluid',
  'tissue': 'epithelial-cells',
};
