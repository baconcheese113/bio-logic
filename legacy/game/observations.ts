/**
 * Observation field definitions - structured data for each instrument type
 * Players select from predefined options (multiple choice) wherever possible
 */

import type { ObservationCategory, ObservationField, InstrumentType } from './types';

// ============================================================================
// Microscopy Observations
// ============================================================================

export const MICROSCOPY_FIELDS: ObservationField[] = [
  {
    id: 'gram-stain',
    category: 'staining',
    label: 'Gram Stain Result',
    type: 'select',
    options: ['Gram-positive (purple)', 'Gram-negative (pink)', 'Variable', 'No bacteria seen'],
  },
  {
    id: 'morphology',
    category: 'morphology',
    label: 'Cell Shape',
    type: 'select',
    options: ['Cocci (round)', 'Bacilli (rod)', 'Coccobacilli', 'Spirochete', 'Pleomorphic'],
  },
  {
    id: 'arrangement',
    category: 'morphology',
    label: 'Cell Arrangement',
    type: 'select',
    options: ['Singles', 'Pairs (diplococci)', 'Chains', 'Clusters', 'Tetrads', 'Palisades'],
  },
  {
    id: 'acid-fast',
    category: 'staining',
    label: 'Acid-Fast Stain',
    type: 'select',
    options: ['Acid-fast positive (red)', 'Acid-fast negative (blue)', 'Not performed'],
  },
  {
    id: 'capsule',
    category: 'morphology',
    label: 'Capsule Present',
    type: 'select',
    options: ['Capsule visible', 'No capsule', 'Uncertain'],
  },
  {
    id: 'spores',
    category: 'morphology',
    label: 'Spore Formation',
    type: 'select',
    options: ['Endospores present', 'No spores', 'Not applicable'],
  },
  {
    id: 'motility',
    category: 'morphology',
    label: 'Motility',
    type: 'select',
    options: ['Motile', 'Non-motile', 'Cannot determine'],
  },
];

// ============================================================================
// Culture Observations
// ============================================================================

export const CULTURE_FIELDS: ObservationField[] = [
  {
    id: 'growth',
    category: 'growth',
    label: 'Growth Present',
    type: 'select',
    options: ['Heavy growth', 'Moderate growth', 'Light growth', 'No growth'],
  },
  {
    id: 'colony-color',
    category: 'growth',
    label: 'Colony Color',
    type: 'select',
    options: ['White/cream', 'Yellow', 'Golden', 'Gray', 'Green', 'Pigmented other'],
  },
  {
    id: 'colony-shape',
    category: 'growth',
    label: 'Colony Morphology',
    type: 'select',
    options: ['Round/circular', 'Irregular', 'Filamentous', 'Rhizoid', 'Punctiform'],
  },
  {
    id: 'hemolysis',
    category: 'growth',
    label: 'Hemolysis (Blood Agar)',
    type: 'select',
    options: ['Beta (complete clearing)', 'Alpha (green zone)', 'Gamma (no hemolysis)', 'Not on blood agar'],
  },
  {
    id: 'lactose-fermentation',
    category: 'growth',
    label: 'Lactose Fermentation (MacConkey)',
    type: 'select',
    options: ['Lactose fermenter (pink)', 'Non-lactose fermenter (colorless)', 'Not on MacConkey'],
  },
  {
    id: 'odor',
    category: 'growth',
    label: 'Odor',
    type: 'select',
    options: ['No distinct odor', 'Fruity/sweet', 'Foul/putrid', 'Earthy', 'Ammonia-like'],
  },
];

// ============================================================================
// Biochemical Test Observations
// ============================================================================

export const BIOCHEMICAL_FIELDS: ObservationField[] = [
  {
    id: 'catalase',
    category: 'biochemical',
    label: 'Catalase Test',
    type: 'select',
    options: ['Positive (bubbles)', 'Negative (no bubbles)', 'Not performed'],
  },
  {
    id: 'oxidase',
    category: 'biochemical',
    label: 'Oxidase Test',
    type: 'select',
    options: ['Positive (purple)', 'Negative (no color)', 'Not performed'],
  },
  {
    id: 'coagulase',
    category: 'biochemical',
    label: 'Coagulase Test',
    type: 'select',
    options: ['Positive (clumping)', 'Negative (no clumping)', 'Not performed'],
  },
  {
    id: 'indole',
    category: 'biochemical',
    label: 'Indole Test',
    type: 'select',
    options: ['Positive (red ring)', 'Negative (yellow)', 'Not performed'],
  },
  {
    id: 'urease',
    category: 'biochemical',
    label: 'Urease Test',
    type: 'select',
    options: ['Positive (pink)', 'Negative (yellow)', 'Not performed'],
  },
  {
    id: 'citrate',
    category: 'biochemical',
    label: 'Citrate Utilization',
    type: 'select',
    options: ['Positive (blue)', 'Negative (green)', 'Not performed'],
  },
  {
    id: 'h2s',
    category: 'biochemical',
    label: 'H₂S Production',
    type: 'select',
    options: ['Positive (black)', 'Negative (no black)', 'Not performed'],
  },
  {
    id: 'motility-test',
    category: 'biochemical',
    label: 'Motility (SIM)',
    type: 'select',
    options: ['Motile (diffuse growth)', 'Non-motile (stab line only)', 'Not performed'],
  },
];

// ============================================================================
// Serology Observations
// ============================================================================

export const SEROLOGY_FIELDS: ObservationField[] = [
  {
    id: 'agglutination',
    category: 'serological',
    label: 'Agglutination',
    type: 'select',
    options: ['Strong agglutination', 'Weak agglutination', 'No agglutination'],
  },
  {
    id: 'blood-type-abo',
    category: 'serological',
    label: 'ABO Blood Type',
    type: 'select',
    options: ['Type A', 'Type B', 'Type AB', 'Type O', 'Not tested'],
  },
  {
    id: 'blood-type-rh',
    category: 'serological',
    label: 'Rh Factor',
    type: 'select',
    options: ['Rh positive', 'Rh negative', 'Not tested'],
  },
  {
    id: 'antibody-titer',
    category: 'serological',
    label: 'Antibody Titer',
    type: 'select',
    options: ['High (≥1:160)', 'Moderate (1:40-1:80)', 'Low (1:10-1:20)', 'Negative (<1:10)'],
  },
];

// ============================================================================
// Antibiotic Sensitivity Observations
// ============================================================================

export const ANTIBIOTIC_FIELDS: ObservationField[] = [
  {
    id: 'penicillin-sensitivity',
    category: 'biochemical',
    label: 'Penicillin',
    type: 'select',
    options: ['Sensitive (S)', 'Intermediate (I)', 'Resistant (R)', 'Not tested'],
  },
  {
    id: 'ampicillin-sensitivity',
    category: 'biochemical',
    label: 'Ampicillin',
    type: 'select',
    options: ['Sensitive (S)', 'Intermediate (I)', 'Resistant (R)', 'Not tested'],
  },
  {
    id: 'methicillin-sensitivity',
    category: 'biochemical',
    label: 'Methicillin/Oxacillin',
    type: 'select',
    options: ['Sensitive (S)', 'Resistant (R - MRSA)', 'Not tested'],
  },
  {
    id: 'vancomycin-sensitivity',
    category: 'biochemical',
    label: 'Vancomycin',
    type: 'select',
    options: ['Sensitive (S)', 'Intermediate (I)', 'Resistant (R - VRE)', 'Not tested'],
  },
  {
    id: 'ciprofloxacin-sensitivity',
    category: 'biochemical',
    label: 'Ciprofloxacin',
    type: 'select',
    options: ['Sensitive (S)', 'Intermediate (I)', 'Resistant (R)', 'Not tested'],
  },
  {
    id: 'gentamicin-sensitivity',
    category: 'biochemical',
    label: 'Gentamicin',
    type: 'select',
    options: ['Sensitive (S)', 'Intermediate (I)', 'Resistant (R)', 'Not tested'],
  },
];

// ============================================================================
// PCR / Molecular Observations
// ============================================================================

export const PCR_FIELDS: ObservationField[] = [
  {
    id: 'pcr-result',
    category: 'molecular',
    label: 'PCR Result',
    type: 'select',
    options: ['Positive (band present)', 'Negative (no band)', 'Invalid (no control)', 'Multiple bands'],
  },
  {
    id: 'band-size',
    category: 'molecular',
    label: 'Band Size (bp)',
    type: 'select',
    options: ['<200 bp', '200-500 bp', '500-1000 bp', '1000-2000 bp', '>2000 bp', 'Multiple sizes'],
  },
  {
    id: 'band-intensity',
    category: 'molecular',
    label: 'Band Intensity',
    type: 'select',
    options: ['Strong', 'Moderate', 'Weak', 'Not visible'],
  },
];

// ============================================================================
// Electrophoresis Observations
// ============================================================================

export const ELECTROPHORESIS_FIELDS: ObservationField[] = [
  {
    id: 'protein-pattern',
    category: 'molecular',
    label: 'Protein Pattern',
    type: 'select',
    options: ['Normal', 'Monoclonal spike', 'Polyclonal increase', 'Decreased albumin', 'Abnormal other'],
  },
  {
    id: 'gamma-region',
    category: 'molecular',
    label: 'Gamma Region',
    type: 'select',
    options: ['Normal', 'Increased', 'Decreased', 'M-spike present'],
  },
  {
    id: 'albumin-level',
    category: 'molecular',
    label: 'Albumin',
    type: 'select',
    options: ['Normal', 'Decreased', 'Increased'],
  },
];

// ============================================================================
// ELISA Observations
// ============================================================================

export const ELISA_FIELDS: ObservationField[] = [
  {
    id: 'elisa-result',
    category: 'serological',
    label: 'ELISA Result',
    type: 'select',
    options: ['Positive', 'Negative', 'Indeterminate', 'Invalid'],
  },
  {
    id: 'od-value',
    category: 'serological',
    label: 'Optical Density',
    type: 'select',
    options: ['High (>2.0)', 'Moderate (1.0-2.0)', 'Low (0.5-1.0)', 'Negative (<0.5)'],
  },
  {
    id: 'antigen-detected',
    category: 'serological',
    label: 'Antigen/Antibody',
    type: 'select',
    options: ['Target detected', 'Not detected', 'Cross-reactivity possible'],
  },
];

// ============================================================================
// Flow Cytometry Observations
// ============================================================================

export const FLOW_CYTOMETRY_FIELDS: ObservationField[] = [
  {
    id: 'cell-population',
    category: 'cellular',
    label: 'Dominant Cell Population',
    type: 'select',
    options: ['Lymphocytes', 'Monocytes', 'Granulocytes', 'Blasts', 'Mixed'],
  },
  {
    id: 'cd4-cd8-ratio',
    category: 'cellular',
    label: 'CD4/CD8 Ratio',
    type: 'select',
    options: ['Normal (1.0-2.5)', 'Inverted (<1.0)', 'Elevated (>2.5)', 'Not measured'],
  },
  {
    id: 'abnormal-markers',
    category: 'cellular',
    label: 'Abnormal Markers',
    type: 'multi-select',
    options: ['CD34+', 'CD10+', 'CD19+', 'CD20+', 'CD38+', 'None detected'],
  },
  {
    id: 'clonality',
    category: 'cellular',
    label: 'B-cell Clonality',
    type: 'select',
    options: ['Polyclonal (normal)', 'Monoclonal (abnormal)', 'Not assessed'],
  },
];

// ============================================================================
// Sanger Sequencing Observations
// ============================================================================

export const SANGER_FIELDS: ObservationField[] = [
  {
    id: 'sequence-quality',
    category: 'molecular',
    label: 'Sequence Quality',
    type: 'select',
    options: ['High quality', 'Acceptable', 'Poor quality', 'Failed'],
  },
  {
    id: 'mutation-detected',
    category: 'molecular',
    label: 'Mutation Status',
    type: 'select',
    options: ['Wild type', 'Mutation detected', 'Variant of unknown significance', 'Multiple mutations'],
  },
  {
    id: 'species-match',
    category: 'molecular',
    label: 'Species Identification',
    type: 'text', // Free text for BLAST-like matching
  },
];

// ============================================================================
// Field Lookup by Instrument Type
// ============================================================================

export const OBSERVATION_FIELDS_BY_INSTRUMENT: Record<InstrumentType, ObservationField[]> = {
  'microscope': MICROSCOPY_FIELDS,
  'culture-plate': CULTURE_FIELDS,
  'biochemical-panel': [...BIOCHEMICAL_FIELDS, ...ANTIBIOTIC_FIELDS],
  'serology-slide': SEROLOGY_FIELDS,
  'electrophoresis': ELECTROPHORESIS_FIELDS,
  'pcr-thermocycler': [], // PCR produces amplicon, observation is on gel
  'gel-imager': PCR_FIELDS,
  'sanger-sequencer': SANGER_FIELDS,
  'elisa-reader': ELISA_FIELDS,
  'flow-cytometer': FLOW_CYTOMETRY_FIELDS,
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Get all observation fields for an instrument type */
export function getFieldsForInstrument(type: InstrumentType): ObservationField[] {
  return OBSERVATION_FIELDS_BY_INSTRUMENT[type] ?? [];
}

/** Get a specific field by ID */
export function getFieldById(fieldId: string): ObservationField | undefined {
  const allFields = [
    ...MICROSCOPY_FIELDS,
    ...CULTURE_FIELDS,
    ...BIOCHEMICAL_FIELDS,
    ...ANTIBIOTIC_FIELDS,
    ...SEROLOGY_FIELDS,
    ...PCR_FIELDS,
    ...ELECTROPHORESIS_FIELDS,
    ...ELISA_FIELDS,
    ...FLOW_CYTOMETRY_FIELDS,
    ...SANGER_FIELDS,
  ];
  return allFields.find(f => f.id === fieldId);
}

/** Get fields by category */
export function getFieldsByCategory(category: ObservationCategory): ObservationField[] {
  const allFields = [
    ...MICROSCOPY_FIELDS,
    ...CULTURE_FIELDS,
    ...BIOCHEMICAL_FIELDS,
    ...ANTIBIOTIC_FIELDS,
    ...SEROLOGY_FIELDS,
    ...PCR_FIELDS,
    ...ELECTROPHORESIS_FIELDS,
    ...ELISA_FIELDS,
    ...FLOW_CYTOMETRY_FIELDS,
    ...SANGER_FIELDS,
  ];
  return allFields.filter(f => f.category === category);
}
