// Types live with the data they describe
export interface Organism {
  id: string;
  scientificName: string;
  commonName: string;
  gramStain: 'positive' | 'negative' | 'variable';
  shape: 'cocci' | 'bacilli' | 'spirochete' | 'diplococci';
  arrangement: 'chains' | 'clusters' | 'pairs' | 'single';
  notes: string;
}

export interface Case {
  id: string;
  title: string;
  organismId: string;
  story: string;
}

// Epic 0+1: Single organism for minimal diagnostic loop
export const ORGANISMS: Organism[] = [
  {
    id: 'strep_pyogenes',
    scientificName: 'Streptococcus pyogenes',
    commonName: 'Group A Streptococcus',
    gramStain: 'positive',
    shape: 'cocci',
    arrangement: 'chains',
    notes: 'Common in throat infections, scarlet fever, rheumatic fever',
  },
];

// Epic 0+1: Single fixed case
export const CASES: Case[] = [
  {
    id: 'case_001',
    title: 'Factory Worker Fever',
    organismId: 'strep_pyogenes',
    story:
      'Steel mill worker, age 38. High fever (3 days), severe sore throat, difficulty swallowing. No recent travel.',
  },
];
