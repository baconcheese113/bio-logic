import { get } from 'svelte/store';
import { currentActiveCase } from './active-cases';
import { evidence } from './evidence';
import { 
  addEvidencePhrase, 
  generateMicroscopyPhrase,
  generateAcidFastPhrase,
  generateCapsulePhrase,
  generateSporePhrase,
  generateCulturePhrase,
  generateBiochemicalPhrase,
  generateBloodTypePhrase,
  generateProteinPatternPhrase,
  generatePCRPhrase
} from './evidence-summary';
import { addResult } from './inventory';
import type { GramStain, Shape, Arrangement, Hemolysis, ProteinPattern, GeneTarget } from '../../data/organisms';

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
  
  const phrase = generateMicroscopyPhrase(gramStain, shape, arrangement);
  if (phrase) {
    addEvidencePhrase(activeCase.caseId, phrase, 'microscopy');
    addResult(activeCase.caseId, 'microscopy', 'Microscopy Observation', {
      gramStain,
      shape,
      arrangement
    });
  }
}

export function recordAcidFastObservation(isAcidFast: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateAcidFastPhrase(isAcidFast);
  addEvidencePhrase(activeCase.caseId, phrase, 'microscopy');
  addResult(activeCase.caseId, 'acid-fast-stain', 'Acid-Fast Stain Result', {
    isAcidFast
  });
}

export function recordCapsuleObservation(hasCapsule: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateCapsulePhrase(hasCapsule);
  addEvidencePhrase(activeCase.caseId, phrase, 'microscopy');
  addResult(activeCase.caseId, 'capsule-stain', 'Capsule Stain Result', {
    hasCapsule
  });
}

export function recordSporeObservation(hasSpores: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateSporePhrase(hasSpores);
  addEvidencePhrase(activeCase.caseId, phrase, 'microscopy');
  addResult(activeCase.caseId, 'spore-stain', 'Spore Stain Result', {
    hasSpores
  });
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
  addResult(activeCase.caseId, `culture-${medium}`, `Culture: ${medium === 'blood-agar' ? 'Blood Agar' : 'MacConkey'}`, {
    growth,
    hemolysis
  });
}

// Biochemical tests
export function recordBiochemicalTest(test: 'catalase' | 'coagulase', result: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateBiochemicalPhrase(test, result);
  addEvidencePhrase(activeCase.caseId, phrase, 'biochemical');
  addResult(activeCase.caseId, test, `${test.charAt(0).toUpperCase() + test.slice(1)} Test`, {
    result
  });
}

// Serology
export function recordBloodType(bloodType: string, rhFactor: boolean) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateBloodTypePhrase(bloodType, rhFactor);
  addEvidencePhrase(activeCase.caseId, phrase, 'serology');
  addResult(activeCase.caseId, 'blood-type', 'Blood Typing Result', {
    bloodType,
    rhFactor
  });
}

// Protein electrophoresis
export function recordProteinPattern(pattern: ProteinPattern) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generateProteinPatternPhrase(pattern);
  addEvidencePhrase(activeCase.caseId, phrase, 'electrophoresis');
  addResult(activeCase.caseId, 'protein-electrophoresis', 'Protein Electrophoresis', {
    pattern
  });
}

// PCR
export function recordPCRResult(gene: GeneTarget) {
  const activeCase = get(currentActiveCase);
  if (!activeCase) return;
  
  const phrase = generatePCRPhrase(gene);
  if (phrase) {
    addEvidencePhrase(activeCase.caseId, phrase, 'pcr');
    addResult(activeCase.caseId, 'pcr', `PCR Result: ${gene}`, {
      gene
    });
  }
}

// Helper to check if we should auto-record based on current evidence state
export function shouldAutoRecord(): boolean {
  const activeCase = get(currentActiveCase);
  return activeCase !== null;
}
