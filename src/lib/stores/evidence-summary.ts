import { writable, derived } from 'svelte/store';
import type { GramStain, Shape, Arrangement, Hemolysis, ProteinPattern, GeneTarget } from '../../data/organisms';

export interface EvidencePhrase {
  id: string;
  text: string;
  source: string; // e.g., 'microscopy', 'culture', 'pcr'
  timestamp: number;
}

interface EvidenceSummaryState {
  caseId: string;
  presentingComplaint: string;
  phrases: EvidencePhrase[];
}

interface AllEvidenceState {
  summaries: Map<string, EvidenceSummaryState>;
}

const initialState: AllEvidenceState = {
  summaries: new Map(),
};

export const evidenceSummaries = writable<AllEvidenceState>(initialState);

// Initialize evidence summary for a case
export function initializeEvidenceSummary(caseId: string, presentingComplaint: string) {
  evidenceSummaries.update(state => {
    const newSummaries = new Map(state.summaries);
    newSummaries.set(caseId, {
      caseId,
      presentingComplaint,
      phrases: [],
    });
    return { summaries: newSummaries };
  });
}

// Add a phrase to the evidence summary
export function addEvidencePhrase(caseId: string, text: string, source: string) {
  evidenceSummaries.update(state => {
    const newSummaries = new Map(state.summaries);
    const summary = newSummaries.get(caseId);
    
    if (!summary) return state;
    
    // Check if phrase already exists to avoid duplicates
    const exists = summary.phrases.some(p => p.text === text && p.source === source);
    if (exists) return state;
    
    const newPhrase: EvidencePhrase = {
      id: `phrase-${Date.now()}-${Math.random()}`,
      text,
      source,
      timestamp: Date.now(),
    };
    
    newSummaries.set(caseId, {
      ...summary,
      phrases: [...summary.phrases, newPhrase],
    });
    
    return { summaries: newSummaries };
  });
}

// Clear evidence summary for a case
export function clearCaseEvidenceSummary(caseId: string) {
  evidenceSummaries.update(state => {
    const newSummaries = new Map(state.summaries);
    newSummaries.delete(caseId);
    return { summaries: newSummaries };
  });
}

// Get evidence summary for a specific case
export const getCaseEvidenceSummary = (caseId: string) => derived(
  evidenceSummaries,
  ($state) => $state.summaries.get(caseId) || null
);

// Helper functions to generate evidence phrases based on test results

export function generateMicroscopyPhrase(
  gramStain: GramStain | null,
  shape: Shape | null,
  arrangement: Arrangement | null
): string {
  const parts: string[] = [];
  
  if (gramStain) {
    parts.push(`Gram-${gramStain}`);
  }
  if (shape) {
    parts.push(shape);
  }
  if (arrangement) {
    parts.push(`in ${arrangement}`);
  }
  
  if (parts.length === 0) return '';
  
  return `${parts.join(' ')} observed`;
}

export function generateAcidFastPhrase(isAcidFast: boolean): string {
  return isAcidFast 
    ? 'acid-fast bacilli detected' 
    : 'no acid-fast bacilli seen';
}

export function generateCapsulePhrase(hasCapsule: boolean): string {
  return hasCapsule 
    ? 'prominent polysaccharide capsule present' 
    : 'no capsule observed';
}

export function generateSporePhrase(hasSpores: boolean): string {
  return hasSpores 
    ? 'endospores detected' 
    : 'no spores observed';
}

export function generateCulturePhrase(
  medium: 'blood-agar' | 'macconkey',
  growth: 'good' | 'poor' | 'none',
  hemolysis?: Hemolysis
): string {
  if (growth === 'none') {
    return `no growth on ${medium === 'blood-agar' ? 'blood agar' : 'MacConkey agar'}`;
  }
  
  const mediumName = medium === 'blood-agar' ? 'blood agar' : 'MacConkey agar';
  const parts = [`grows ${growth} on ${mediumName}`];
  
  if (hemolysis && hemolysis !== 'none') {
    parts.push(`${hemolysis}-hemolytic`);
  }
  
  return parts.join(', ');
}

export function generateBiochemicalPhrase(test: 'catalase' | 'coagulase', result: boolean): string {
  return `${test} ${result ? 'positive' : 'negative'}`;
}

export function generateBloodTypePhrase(bloodType: string, rhFactor: boolean): string {
  return `blood type ${bloodType}${rhFactor ? '+' : '-'}`;
}

export function generateProteinPatternPhrase(pattern: ProteinPattern): string {
  const descriptions: Record<ProteinPattern, string> = {
    'normal': 'normal protein electrophoresis pattern',
    'm-spike': 'monoclonal spike in gamma region detected',
    'beta-gamma-bridge': 'beta-gamma bridging pattern observed',
    'low-albumin': 'decreased albumin levels',
    'polyclonal-gammopathy': 'polyclonal gammopathy present',
  };
  return descriptions[pattern];
}

export function generatePCRPhrase(gene: GeneTarget): string {
  const descriptions: Record<GeneTarget, string> = {
    'mecA': 'mecA gene detected (methicillin resistance)',
    '16S-rRNA': '16S rRNA gene amplified',
    'IS6110': 'IS6110 sequence detected (M. tuberculosis)',
    'HIV-gag': 'HIV gag gene detected',
    'none': '',
  };
  return descriptions[gene];
}
