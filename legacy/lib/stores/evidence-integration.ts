import { get } from 'svelte/store';
import { currentActiveCase } from './active-cases';
import { 
  addEvidencePhrase,
  removeEvidencePhrase,
  generateCulturePhrase,
  generateBiochemicalPhrase,
  generateBloodTypePhrase,
  generateProteinPatternPhrase,
  generatePCRPhrase
} from './evidence-summary';
import { addObservationToItem } from './inventory';
import { instrumentState, type InstrumentType } from './instrument-state';
import type { GramStain, Shape, Arrangement, Hemolysis, ProteinPattern, GeneTarget } from '../../data/organisms';

function addObservationToInstrumentSample(
  instrument: InstrumentType,
  label: string,
  source: string,
  data?: Record<string, unknown>
) {
  const state = get(instrumentState);
  const sampleId = state.activeSamples[instrument];
  if (!sampleId) return;
  addObservationToItem(sampleId, { label, source, data });
}

/**
 * Integration layer between the old evidence system and the new evidence summary system.
 * These functions should be called when observations are made in instruments.
 */

// Microscopy observations
export function recordMicroscopyObservation(
  gramStain: GramStain | null,
  shape: Shape | null,
  arrangement: Arrangement | null
) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  // Record gram stain (replace any existing gram stain evidence)
  if (gramStain) {
    const phrase = `Gram-${gramStain}`;
    addEvidencePhrase(activeCase.caseId, phrase, 'microscopy', 'gramStain');
  } else {
    // Remove gram stain evidence if null
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'gramStain');
  }
  
  // Record shape (replace any existing shape evidence)
  if (shape) {
    addEvidencePhrase(activeCase.caseId, shape, 'microscopy', 'shape');
  } else {
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'shape');
  }
  
  // Record arrangement (replace any existing arrangement evidence)
  if (arrangement) {
    addEvidencePhrase(activeCase.caseId, `in ${arrangement}`, 'microscopy', 'arrangement');
  } else {
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'arrangement');
  }
  
  // Update inventory with complete observation
  if (gramStain || shape || arrangement) {
    addObservationToInstrumentSample(
      'microscope',
      'Microscopy Observation',
      'microscopy',
      { gramStain, shape, arrangement }
    );
  }
}

export function recordAcidFastObservation(isAcidFast: boolean | null) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  if (isAcidFast !== null) {
    const phrase = isAcidFast 
      ? 'acid-fast bacilli' 
      : 'no acid-fast bacilli';
    addEvidencePhrase(activeCase.caseId, phrase, 'microscopy', 'acidFast');
    addObservationToInstrumentSample(
      'microscope',
      'Acid-Fast Stain',
      'microscopy',
      { isAcidFast }
    );
  } else {
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'acidFast');
  }
}

export function recordCapsuleObservation(hasCapsule: boolean | null) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  if (hasCapsule !== null) {
    const phrase = hasCapsule 
      ? 'capsule present' 
      : 'no capsule';
    addEvidencePhrase(activeCase.caseId, phrase, 'microscopy', 'capsule');
    addObservationToInstrumentSample(
      'microscope',
      'Capsule Stain',
      'microscopy',
      { hasCapsule }
    );
  } else {
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'capsule');
  }
}

export function recordSporeObservation(hasSpores: boolean | null) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  if (hasSpores !== null) {
    const phrase = hasSpores 
      ? 'endospores' 
      : 'no spores';
    addEvidencePhrase(activeCase.caseId, phrase, 'microscopy', 'spores');
    addObservationToInstrumentSample(
      'microscope',
      'Spore Stain',
      'microscopy',
      { hasSpores }
    );
  } else {
    removeEvidencePhrase(activeCase.caseId, 'microscopy', 'spores');
  }
}

// Culture observations
export function recordCultureObservation(
  medium: 'blood-agar' | 'macconkey',
  growth: 'good' | 'poor' | 'none',
  hemolysis?: Hemolysis
) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateCulturePhrase(medium, growth, hemolysis);
  addEvidencePhrase(activeCase.caseId, phrase, 'culture');
  addObservationToInstrumentSample(
    'culture',
    `Culture: ${medium === 'blood-agar' ? 'Blood Agar' : 'MacConKey'}`,
    'culture',
    { medium, growth, hemolysis }
  );
}

// Biochemical tests
export function recordBiochemicalTest(test: 'catalase' | 'coagulase', result: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateBiochemicalPhrase(test, result);
  addEvidencePhrase(activeCase.caseId, phrase, 'biochemical');
  addObservationToInstrumentSample(
    'biochemical',
    `${test.charAt(0).toUpperCase() + test.slice(1)} Test`,
    'biochemical',
    { test, result }
  );
}

// Serology
export function recordBloodType(bloodType: string, rhFactor: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateBloodTypePhrase(bloodType, rhFactor);
  addEvidencePhrase(activeCase.caseId, phrase, 'serology');
  addObservationToInstrumentSample(
    'serology',
    'Blood Typing Result',
    'serology',
    { bloodType, rhFactor }
  );
}

// Protein electrophoresis
export function recordProteinPattern(pattern: ProteinPattern) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateProteinPatternPhrase(pattern);
  addEvidencePhrase(activeCase.caseId, phrase, 'electrophoresis');
  addObservationToInstrumentSample(
    'electrophoresis',
    'Protein Electrophoresis',
    'electrophoresis',
    { pattern }
  );
}

// PCR
export function recordPCRResult(gene: GeneTarget) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generatePCRPhrase(gene);
  if (phrase) {
    addEvidencePhrase(activeCase.caseId, phrase, 'pcr');
    addObservationToInstrumentSample(
      'pcr',
      `PCR Result: ${gene}`,
      'pcr',
      { gene }
    );
  }
}

// Helper to check if we should auto-record based on current evidence state
export function shouldAutoRecord(): boolean {
  const activeCase = get(currentActiveCase);
  return activeCase !== null;
}
