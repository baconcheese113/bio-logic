import { get } from 'svelte/store';
import { currentActiveCase } from './active-cases';
import { evidence } from './evidence';
import { 
  addEvidencePhrase,
  removeEvidencePhrase,
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
    addResult(activeCase.caseId, 'microscopy', 'Microscopy Observation', {
      gramStain,
      shape,
      arrangement
    });
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
    addResult(activeCase.caseId, 'acid-fast-stain', 'Acid-Fast Stain', {
      isAcidFast
    });
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
    addResult(activeCase.caseId, 'capsule-stain', 'Capsule Stain', {
      hasCapsule
    });
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
    addResult(activeCase.caseId, 'spore-stain', 'Spore Stain', {
      hasSpores
    });
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
