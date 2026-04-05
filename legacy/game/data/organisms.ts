/**
 * Organism data - biological properties for each pathogen
 * Used to generate correct observations for cases
 */

import type { Era } from '../types';

// ============================================================================
// Organism Definition
// ============================================================================

export interface Organism {
  id: string;
  name: string;
  commonName: string;
  era: Era; // When this organism was first characterized
  
  // Microscopy properties
  gramStain: 'positive' | 'negative' | 'variable' | 'none';
  morphology: 'cocci' | 'bacilli' | 'coccobacilli' | 'spirochete' | 'pleomorphic';
  arrangement: 'singles' | 'pairs' | 'chains' | 'clusters' | 'tetrads' | 'palisades';
  acidFast: boolean;
  capsule: boolean;
  sporeFormer: boolean;
  motile: boolean;
  
  // Culture properties
  growthRate: 'fast' | 'moderate' | 'slow' | 'none';
  colonyColor: string;
  hemolysis: 'alpha' | 'beta' | 'gamma' | 'none';
  lactoseFermenter: boolean | null; // null = not applicable
  
  // Biochemical properties
  catalase: boolean;
  oxidase: boolean;
  coagulase: boolean | null;
  indole: boolean | null;
  urease: boolean | null;
  
  // Antibiotic sensitivities
  antibioticProfile: {
    penicillin: 'S' | 'I' | 'R';
    ampicillin: 'S' | 'I' | 'R';
    methicillin: 'S' | 'R';
    vancomycin: 'S' | 'I' | 'R';
    ciprofloxacin: 'S' | 'I' | 'R';
    gentamicin: 'S' | 'I' | 'R';
  };
  
  // Clinical info
  diseases: string[];
  transmission: string;
  treatment: string[];
}

// ============================================================================
// Organism Database
// ============================================================================

export const ORGANISMS: Organism[] = [
  // ========== GRAM-POSITIVE COCCI ==========
  {
    id: 'staphylococcus-aureus',
    name: 'Staphylococcus aureus',
    commonName: 'Staph aureus',
    era: 'classical',
    gramStain: 'positive',
    morphology: 'cocci',
    arrangement: 'clusters',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    motile: false,
    growthRate: 'fast',
    colonyColor: 'golden',
    hemolysis: 'beta',
    lactoseFermenter: true,
    catalase: true,
    oxidase: false,
    coagulase: true,
    indole: false,
    urease: true,
    antibioticProfile: {
      penicillin: 'R',
      ampicillin: 'R',
      methicillin: 'S',
      vancomycin: 'S',
      ciprofloxacin: 'S',
      gentamicin: 'S',
    },
    diseases: ['Skin infections', 'Bacteremia', 'Endocarditis', 'Osteomyelitis'],
    transmission: 'Contact, nosocomial',
    treatment: ['Nafcillin', 'Oxacillin', 'Vancomycin (if MRSA)'],
  },
  {
    id: 'streptococcus-pyogenes',
    name: 'Streptococcus pyogenes',
    commonName: 'Group A Strep',
    era: 'classical',
    gramStain: 'positive',
    morphology: 'cocci',
    arrangement: 'chains',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    motile: false,
    growthRate: 'fast',
    colonyColor: 'white',
    hemolysis: 'beta',
    lactoseFermenter: null,
    catalase: false,
    oxidase: false,
    coagulase: null,
    indole: null,
    urease: null,
    antibioticProfile: {
      penicillin: 'S',
      ampicillin: 'S',
      methicillin: 'S',
      vancomycin: 'S',
      ciprofloxacin: 'I',
      gentamicin: 'R',
    },
    diseases: ['Pharyngitis', 'Scarlet fever', 'Cellulitis', 'Necrotizing fasciitis'],
    transmission: 'Respiratory droplets',
    treatment: ['Penicillin', 'Amoxicillin'],
  },
  {
    id: 'streptococcus-pneumoniae',
    name: 'Streptococcus pneumoniae',
    commonName: 'Pneumococcus',
    era: 'classical',
    gramStain: 'positive',
    morphology: 'cocci',
    arrangement: 'pairs',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    motile: false,
    growthRate: 'moderate',
    colonyColor: 'gray',
    hemolysis: 'alpha',
    lactoseFermenter: null,
    catalase: false,
    oxidase: false,
    coagulase: null,
    indole: null,
    urease: null,
    antibioticProfile: {
      penicillin: 'S',
      ampicillin: 'S',
      methicillin: 'S',
      vancomycin: 'S',
      ciprofloxacin: 'S',
      gentamicin: 'R',
    },
    diseases: ['Pneumonia', 'Meningitis', 'Otitis media', 'Sinusitis'],
    transmission: 'Respiratory droplets',
    treatment: ['Penicillin', 'Ceftriaxone'],
  },
  {
    id: 'enterococcus-faecalis',
    name: 'Enterococcus faecalis',
    commonName: 'Enterococcus',
    era: 'golden-age',
    gramStain: 'positive',
    morphology: 'cocci',
    arrangement: 'pairs',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    motile: false,
    growthRate: 'fast',
    colonyColor: 'gray',
    hemolysis: 'gamma',
    lactoseFermenter: null,
    catalase: false,
    oxidase: false,
    coagulase: null,
    indole: null,
    urease: null,
    antibioticProfile: {
      penicillin: 'I',
      ampicillin: 'S',
      methicillin: 'R',
      vancomycin: 'S',
      ciprofloxacin: 'I',
      gentamicin: 'I',
    },
    diseases: ['UTI', 'Bacteremia', 'Endocarditis'],
    transmission: 'Fecal-oral, nosocomial',
    treatment: ['Ampicillin + Gentamicin', 'Vancomycin'],
  },
  
  // ========== GRAM-NEGATIVE BACILLI ==========
  {
    id: 'escherichia-coli',
    name: 'Escherichia coli',
    commonName: 'E. coli',
    era: 'classical',
    gramStain: 'negative',
    morphology: 'bacilli',
    arrangement: 'singles',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    motile: true,
    growthRate: 'fast',
    colonyColor: 'pink',
    hemolysis: 'gamma',
    lactoseFermenter: true,
    catalase: true,
    oxidase: false,
    coagulase: null,
    indole: true,
    urease: false,
    antibioticProfile: {
      penicillin: 'R',
      ampicillin: 'I',
      methicillin: 'R',
      vancomycin: 'R',
      ciprofloxacin: 'S',
      gentamicin: 'S',
    },
    diseases: ['UTI', 'Gastroenteritis', 'Bacteremia', 'Meningitis (neonatal)'],
    transmission: 'Fecal-oral',
    treatment: ['Ciprofloxacin', 'TMP-SMX', 'Ceftriaxone'],
  },
  {
    id: 'pseudomonas-aeruginosa',
    name: 'Pseudomonas aeruginosa',
    commonName: 'Pseudomonas',
    era: 'golden-age',
    gramStain: 'negative',
    morphology: 'bacilli',
    arrangement: 'singles',
    acidFast: false,
    capsule: false,
    sporeFormer: false,
    motile: true,
    growthRate: 'fast',
    colonyColor: 'green',
    hemolysis: 'beta',
    lactoseFermenter: false,
    catalase: true,
    oxidase: true,
    coagulase: null,
    indole: false,
    urease: false,
    antibioticProfile: {
      penicillin: 'R',
      ampicillin: 'R',
      methicillin: 'R',
      vancomycin: 'R',
      ciprofloxacin: 'S',
      gentamicin: 'S',
    },
    diseases: ['Pneumonia (CF patients)', 'Wound infections', 'UTI', 'Bacteremia'],
    transmission: 'Environmental, nosocomial',
    treatment: ['Piperacillin-tazobactam', 'Ciprofloxacin', 'Cefepime'],
  },
  {
    id: 'salmonella-typhi',
    name: 'Salmonella typhi',
    commonName: 'Typhoid',
    era: 'classical',
    gramStain: 'negative',
    morphology: 'bacilli',
    arrangement: 'singles',
    acidFast: false,
    capsule: true,
    sporeFormer: false,
    motile: true,
    growthRate: 'fast',
    colonyColor: 'colorless',
    hemolysis: 'gamma',
    lactoseFermenter: false,
    catalase: true,
    oxidase: false,
    coagulase: null,
    indole: false,
    urease: false,
    antibioticProfile: {
      penicillin: 'R',
      ampicillin: 'S',
      methicillin: 'R',
      vancomycin: 'R',
      ciprofloxacin: 'S',
      gentamicin: 'S',
    },
    diseases: ['Typhoid fever', 'Bacteremia'],
    transmission: 'Fecal-oral (contaminated water/food)',
    treatment: ['Ciprofloxacin', 'Ceftriaxone', 'Azithromycin'],
  },
  
  // ========== GRAM-POSITIVE BACILLI ==========
  {
    id: 'bacillus-anthracis',
    name: 'Bacillus anthracis',
    commonName: 'Anthrax',
    era: 'classical',
    gramStain: 'positive',
    morphology: 'bacilli',
    arrangement: 'chains',
    acidFast: false,
    capsule: true,
    sporeFormer: true,
    motile: false,
    growthRate: 'fast',
    colonyColor: 'gray',
    hemolysis: 'gamma',
    lactoseFermenter: null,
    catalase: true,
    oxidase: false,
    coagulase: null,
    indole: false,
    urease: false,
    antibioticProfile: {
      penicillin: 'S',
      ampicillin: 'S',
      methicillin: 'S',
      vancomycin: 'S',
      ciprofloxacin: 'S',
      gentamicin: 'S',
    },
    diseases: ['Cutaneous anthrax', 'Inhalation anthrax', 'GI anthrax'],
    transmission: 'Spore inhalation, contact with infected animals',
    treatment: ['Ciprofloxacin', 'Doxycycline', 'Penicillin'],
  },
  {
    id: 'clostridium-tetani',
    name: 'Clostridium tetani',
    commonName: 'Tetanus',
    era: 'classical',
    gramStain: 'positive',
    morphology: 'bacilli',
    arrangement: 'singles',
    acidFast: false,
    capsule: false,
    sporeFormer: true,
    motile: true,
    growthRate: 'slow',
    colonyColor: 'gray',
    hemolysis: 'beta',
    lactoseFermenter: null,
    catalase: false,
    oxidase: false,
    coagulase: null,
    indole: false,
    urease: false,
    antibioticProfile: {
      penicillin: 'S',
      ampicillin: 'S',
      methicillin: 'S',
      vancomycin: 'S',
      ciprofloxacin: 'I',
      gentamicin: 'R',
    },
    diseases: ['Tetanus (lockjaw)'],
    transmission: 'Wound contamination with spores',
    treatment: ['Metronidazole', 'Penicillin', 'Tetanus immunoglobulin'],
  },
  
  // ========== ACID-FAST ==========
  {
    id: 'mycobacterium-tuberculosis',
    name: 'Mycobacterium tuberculosis',
    commonName: 'TB',
    era: 'classical',
    gramStain: 'none', // Doesn't gram stain well
    morphology: 'bacilli',
    arrangement: 'singles',
    acidFast: true,
    capsule: false,
    sporeFormer: false,
    motile: false,
    growthRate: 'slow',
    colonyColor: 'cream',
    hemolysis: 'none',
    lactoseFermenter: null,
    catalase: true,
    oxidase: false,
    coagulase: null,
    indole: null,
    urease: null,
    antibioticProfile: {
      penicillin: 'R',
      ampicillin: 'R',
      methicillin: 'R',
      vancomycin: 'R',
      ciprofloxacin: 'I',
      gentamicin: 'R',
    },
    diseases: ['Pulmonary TB', 'Extrapulmonary TB', 'Miliary TB'],
    transmission: 'Respiratory droplets',
    treatment: ['Isoniazid', 'Rifampin', 'Ethambutol', 'Pyrazinamide'],
  },
];

// ============================================================================
// Lookup Helpers
// ============================================================================

export function getOrganismById(id: string): Organism | undefined {
  return ORGANISMS.find(o => o.id === id);
}

export function getOrganismsForEra(era: Era): Organism[] {
  const eraOrder: Record<Era, number> = {
    'classical': 0,
    'golden-age': 1,
    'molecular': 2,
    'genomic': 3,
    'modern': 4,
  };
  const currentOrder = eraOrder[era];
  return ORGANISMS.filter(o => eraOrder[o.era] <= currentOrder);
}

export function getOrganismsByGramStain(stain: 'positive' | 'negative'): Organism[] {
  return ORGANISMS.filter(o => o.gramStain === stain);
}
