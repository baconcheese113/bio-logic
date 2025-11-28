/**
 * Sample compatibility system for realistic instrument-sample interactions.
 * Defines which sample types can be used with which instruments.
 */

// Instrument types (matching instrument-state.ts)
export type InstrumentType = 'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'sanger' | 'elisa' | 'flow-cytometry' | 'plate-reader';

// Base sample types (collected from patient)
export type BaseSampleType = 
  | 'blood'
  | 'sputum'
  | 'throat-swab'
  | 'stool'
  | 'wound'
  | 'csf'
  | 'urine'
  | 'tissue';

// Processed sample types (output from instruments)
export type ProcessedSampleType =
  | 'culture-plate'
  | 'pcr-amplicon'
  | 'bacterial-isolate'
  | 'protein-sample'
  | 'dna-extract'
  | 'rna-extract'
  | 'gene-sequence';

export type SampleItemType = BaseSampleType | ProcessedSampleType;

/**
 * Map of instruments to their compatible sample types.
 * An instrument can accept base samples and/or processed samples from other instruments.
 */
export const INSTRUMENT_COMPATIBLE_SAMPLES: Record<InstrumentType, SampleItemType[]> = {
  // Microscope: accepts most base samples that can be smeared on a slide
  'microscope': [
    'blood',
    'sputum',
    'throat-swab',
    'stool',
    'wound',
    'csf',
    'urine',
    'tissue',
    'culture-plate', // can examine colonies under microscope
  ],
  
  // Culture: accepts samples that contain bacteria
  'culture': [
    'blood',
    'sputum',
    'throat-swab',
    'stool',
    'wound',
    'csf',
    'urine',
    'tissue',
  ],
  
  // Biochemical tests: requires cultured bacterial isolate
  'biochemical': [
    'culture-plate',
    'bacterial-isolate',
  ],
  
  // Serology: blood tests only
  'serology': [
    'blood',
  ],
  
  // PCR: requires DNA/RNA and now gene sequences for primer design
  'pcr': [
    'blood',
    'sputum',
    'throat-swab',
    'csf',
    'tissue',
    'dna-extract',
    'rna-extract',
    'gene-sequence', // Used to set the target gene
  ],
  
  // Gel Electrophoresis: requires PCR product or DNA/protein samples
  'electrophoresis': [
    'pcr-amplicon',
    'dna-extract',
    'protein-sample',
  ],
  
  // Sanger Sequencing: requires PCR product or purified DNA
  'sanger': [
    'pcr-amplicon',
    'dna-extract',
    'blood',
    'sputum',
    'throat-swab',
    'stool',
    'wound',
    'csf',
    'urine',
    'tissue',
  ],
  
  // ELISA: serum/plasma samples
  'elisa': [
    'blood',
    'csf',
  ],
  
  // Plate Reader: requires prepared ELISA plate (not a patient sample)
  'plate-reader': [
    // This would typically be an internal step after ELISA plate preparation
    // Not directly accepting patient samples
  ],
  
  // Flow Cytometry: blood/tissue samples with cells
  'flow-cytometry': [
    'blood',
    'tissue',
    'csf',
  ],
};

/**
 * Check if a sample type is compatible with an instrument.
 */
export function isSampleCompatible(
  sampleType: string,
  instrument: InstrumentType
): boolean {
  const compatibleTypes = INSTRUMENT_COMPATIBLE_SAMPLES[instrument];
  return compatibleTypes.includes(sampleType as SampleItemType);
}

/**
 * Get all compatible sample types for an instrument.
 */
export function getCompatibleSampleTypes(instrument: InstrumentType): SampleItemType[] {
  return INSTRUMENT_COMPATIBLE_SAMPLES[instrument];
}

/**
 * Get human-readable reason why a sample is incompatible (for UI feedback).
 */
export function getIncompatibilityReason(
  sampleType: string,
  instrument: InstrumentType
): string {
  if (isSampleCompatible(sampleType, instrument)) {
    return '';
  }
  
  const reasons: Record<InstrumentType, string> = {
    'microscope': 'This sample type cannot be examined under a microscope.',
    'culture': 'This sample cannot be cultured directly.',
    'biochemical': 'Biochemical tests require a bacterial isolate from a culture plate.',
    'serology': 'Serology tests require a blood sample.',
    'pcr': 'PCR requires a sample containing DNA or RNA.',
    'electrophoresis': 'Electrophoresis requires PCR amplicons or purified DNA/protein.',
    'sanger': 'Sanger sequencing requires PCR amplicons or purified DNA.',
    'elisa': 'ELISA requires serum or plasma from blood.',
    'plate-reader': 'Plate reader requires a prepared ELISA plate.',
    'flow-cytometry': 'Flow cytometry requires cells from blood or tissue.',
  };
  
  return reasons[instrument] || 'This sample is not compatible with this instrument.';
}
