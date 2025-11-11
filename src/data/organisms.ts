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
}

// Answer format configuration for different case types
export interface AnswerFormat {
  type: 'organism-id' | 'blood-type' | 'immunity-status' | 'antibody-detection' | 'antibiotic-choice';
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

// Flatten all cases into single array for game use
export const CASES: Case[] = [
  ...INFECTION_CASES,
  ...BLOOD_TYPING_CASES,
  ...IMMUNITY_CASES,
  ...ANTIBIOTIC_CASES,
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
