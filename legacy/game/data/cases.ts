/**
 * Case definitions - patient scenarios with correct answers
 * Each case is tied to an era and has appropriate sample types
 */

import type { CaseDefinition, Era, PatientSampleType } from '../types';

// ============================================================================
// Case Database
// ============================================================================

export const CASES: CaseDefinition[] = [
  // ========== CLASSICAL ERA (1880s) ==========
  {
    id: 'strep-throat-1885',
    era: 'classical',
    title: 'The Schoolhouse Outbreak',
    presentation: `A rural schoolteacher brings in her 8-year-old student. The child has had 
a sore throat and fever for 2 days. On examination, you note a fiery red pharynx with 
white exudates on the tonsils. The child's tongue has a white coating with red papillae 
poking through (strawberry tongue). Several other children in the class have similar symptoms.`,
    difficulty: 1,
    availableSamples: ['throat-swab'],
    correctDiagnosis: 'streptococcus-pyogenes',
    correctTreatment: 'penicillin',
    baseReward: 50,
  },
  {
    id: 'wound-infection-1890',
    era: 'classical',
    title: 'The Factory Accident',
    presentation: `A factory worker presents 3 days after lacerating his hand on machinery. 
The wound is red, swollen, and draining thick yellow pus. The surrounding skin is warm 
and there are red streaks extending up his forearm. He has a fever of 39°C. The wound 
was initially cleaned with water from the factory well.`,
    difficulty: 2,
    availableSamples: ['wound-swab', 'blood'],
    correctDiagnosis: 'staphylococcus-aureus',
    correctTreatment: 'nafcillin',
    baseReward: 75,
  },
  {
    id: 'pneumonia-1895',
    era: 'classical',
    title: 'The Miner\'s Cough',
    presentation: `A 45-year-old coal miner presents with sudden onset of high fever, 
shaking chills, and a productive cough with rust-colored sputum. He reports sharp 
chest pain that worsens with breathing. On examination, you hear decreased breath 
sounds and dullness to percussion over the right lower lung. He appears acutely ill.`,
    difficulty: 2,
    availableSamples: ['sputum', 'blood'],
    correctDiagnosis: 'streptococcus-pneumoniae',
    correctTreatment: 'penicillin',
    baseReward: 80,
  },
  {
    id: 'typhoid-1892',
    era: 'classical',
    title: 'The Contaminated Well',
    presentation: `Multiple residents of a boarding house present over 2 weeks with 
similar symptoms: gradual onset of fever, headache, and malaise, progressing to 
sustained high fever. Several patients have "rose spots" on their abdomen and 
report constipation followed by diarrhea. One patient is delirious. All drink 
from the same well located near an old privy.`,
    difficulty: 3,
    availableSamples: ['blood', 'stool'],
    correctDiagnosis: 'salmonella-typhi',
    correctTreatment: 'ciprofloxacin',
    baseReward: 100,
  },
  {
    id: 'anthrax-1888',
    era: 'classical',
    title: 'The Woolsorter\'s Disease',
    presentation: `A textile worker who handles imported wool presents with a 
painless papule on his forearm that has developed into a black eschar surrounded 
by significant edema. He has mild fever and malaise. Two of his coworkers died 
last month from a severe respiratory illness. The wool comes from overseas and 
is not treated before processing.`,
    difficulty: 3,
    availableSamples: ['wound-swab', 'blood'],
    correctDiagnosis: 'bacillus-anthracis',
    correctTreatment: 'penicillin',
    baseReward: 120,
  },
  {
    id: 'tuberculosis-1890',
    era: 'classical',
    title: 'The Wasting Disease',
    presentation: `A young seamstress presents with a 3-month history of progressive 
weight loss, night sweats, and a persistent cough. She has been coughing up blood-tinged 
sputum for the past week. She lives in a crowded tenement and works long hours in a 
poorly ventilated workshop. Her mother died of similar symptoms last year.`,
    difficulty: 3,
    availableSamples: ['sputum'],
    correctDiagnosis: 'mycobacterium-tuberculosis',
    correctTreatment: 'isoniazid-rifampin',
    baseReward: 100,
  },
  
  // ========== GOLDEN AGE ERA (1940s) ==========
  {
    id: 'uti-1945',
    era: 'golden-age',
    title: 'The Returning Soldier',
    presentation: `A 28-year-old soldier recently returned from overseas presents with 
dysuria, urinary frequency, and suprapubic pain for 3 days. His urine is cloudy and 
has a strong odor. He has a low-grade fever. He reports that sanitary conditions 
during his deployment were poor.`,
    difficulty: 1,
    availableSamples: ['urine', 'blood'],
    correctDiagnosis: 'escherichia-coli',
    correctTreatment: 'ciprofloxacin',
    baseReward: 60,
  },
  {
    id: 'burn-infection-1948',
    era: 'golden-age',
    title: 'The Chemical Plant Burns',
    presentation: `A chemical plant worker with extensive burns from an industrial 
accident develops green-tinged purulent drainage from his wounds after 1 week in 
hospital. The drainage has a distinctive fruity odor. Despite treatment with 
penicillin, his fever persists and the wound appears to be worsening.`,
    difficulty: 3,
    availableSamples: ['wound-swab', 'blood'],
    correctDiagnosis: 'pseudomonas-aeruginosa',
    correctTreatment: 'piperacillin-tazobactam',
    baseReward: 100,
  },
  {
    id: 'endocarditis-1950',
    era: 'golden-age',
    title: 'The Damaged Heart',
    presentation: `A 35-year-old woman with a history of rheumatic fever as a child 
presents with 6 weeks of low-grade fever, fatigue, and weight loss. She has a 
new heart murmur. Small, painless red lesions are noted on her palms. Blood 
cultures are pending. She recently had a dental extraction without antibiotic 
prophylaxis.`,
    difficulty: 4,
    availableSamples: ['blood'],
    correctDiagnosis: 'enterococcus-faecalis',
    correctTreatment: 'ampicillin-gentamicin',
    baseReward: 150,
  },
  {
    id: 'tetanus-1942',
    era: 'golden-age',
    title: 'The Rusty Nail',
    presentation: `A farmer presents 7 days after stepping on a rusty nail in his 
barn. He now has difficulty opening his mouth (trismus) and is experiencing 
painful muscle spasms in his neck and back. The wound on his foot appears 
minor but was not properly cleaned. He has never been vaccinated.`,
    difficulty: 2,
    availableSamples: ['wound-swab'],
    correctDiagnosis: 'clostridium-tetani',
    correctTreatment: 'metronidazole',
    baseReward: 90,
  },
];

// ============================================================================
// Case Lookup Helpers
// ============================================================================

export function getCaseById(id: string): CaseDefinition | undefined {
  return CASES.find(c => c.id === id);
}

export function getCasesForEra(era: Era): CaseDefinition[] {
  const eraOrder: Record<Era, number> = {
    'classical': 0,
    'golden-age': 1,
    'molecular': 2,
    'genomic': 3,
    'modern': 4,
  };
  const currentOrder = eraOrder[era];
  return CASES.filter(c => eraOrder[c.era] <= currentOrder);
}

export function getCasesByDifficulty(maxDifficulty: number): CaseDefinition[] {
  return CASES.filter(c => c.difficulty <= maxDifficulty);
}

export function getAvailableSamplesForCase(caseId: string): PatientSampleType[] {
  const caseData = getCaseById(caseId);
  return caseData?.availableSamples ?? [];
}

/** Get a random case appropriate for player's era and reputation */
export function getRandomCase(era: Era, reputation: number): CaseDefinition | undefined {
  const availableCases = getCasesForEra(era);
  
  // Filter by difficulty based on reputation
  // Low rep (0-30): difficulty 1-2
  // Medium rep (31-60): difficulty 1-3
  // High rep (61-100): difficulty 1-5
  let maxDifficulty = 2;
  if (reputation > 60) maxDifficulty = 5;
  else if (reputation > 30) maxDifficulty = 3;
  
  const appropriateCases = availableCases.filter(c => c.difficulty <= maxDifficulty);
  
  if (appropriateCases.length === 0) return undefined;
  
  return appropriateCases[Math.floor(Math.random() * appropriateCases.length)];
}
