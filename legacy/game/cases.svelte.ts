/**
 * Case manager - handles case lifecycle, observations, and submission scoring
 * Each case tracks its own observations (structured data)
 */

import { gameClock } from './clock.svelte';
import { clearCaseInventory } from './inventory.svelte';
import { CASES } from './data/cases';
import { ERA_CONFIG } from './types';
import type { 
  ActiveCase, 
  CaseDefinition, 
  CaseSubmission, 
  CaseResult,
  Observation,
  LawsuitResult,
  Era
} from './types';

// ============================================================================
// State
// ============================================================================

let activeCases = $state<ActiveCase[]>([]);
let completedCaseResults = $state<CaseResult[]>([]);
let caseCounter = 0;

function generateCaseInstanceId(definitionId: string): string {
  return `${definitionId}-${++caseCounter}-${Date.now()}`;
}

// ============================================================================
// Case Definition Lookup (uses data/cases.ts as source of truth)
// ============================================================================

export function getCaseDefinition(id: string): CaseDefinition | undefined {
  return CASES.find(c => c.id === id);
}

export function getCasesForEra(era: Era): CaseDefinition[] {
  const eraOrder = ERA_CONFIG[era].order;
  return CASES.filter(c => ERA_CONFIG[c.era].order <= eraOrder);
}

// ============================================================================
// Public API - Active Cases
// ============================================================================

export const cases = {
  get active() { return activeCases; },
  get completed() { return completedCaseResults; },
  
  getById(instanceId: string): ActiveCase | undefined {
    return activeCases.find(c => c.id === instanceId);
  },
  
  getDefinition(instanceId: string): CaseDefinition | undefined {
    const activeCase = activeCases.find(c => c.id === instanceId);
    if (!activeCase) return undefined;
    return getCaseDefinition(activeCase.definitionId);
  },
};

// ============================================================================
// Case Lifecycle
// ============================================================================

/** Accept a new case from available cases */
export function acceptCase(definitionId: string): ActiveCase | null {
  const definition = getCaseDefinition(definitionId);
  if (!definition) return null;
  
  const activeCase: ActiveCase = {
    id: generateCaseInstanceId(definitionId),
    definitionId,
    status: 'active',
    startedAtTick: gameClock.tick,
    observations: [],
    samplesTaken: [],
  };
  
  activeCases.push(activeCase);
  return activeCase;
}

/** Abandon a case (gives up, small reputation penalty) */
export function abandonCase(instanceId: string): boolean {
  const index = activeCases.findIndex(c => c.id === instanceId);
  if (index === -1) return false;
  
  const activeCase = activeCases[index];
  activeCase.status = 'failed';
  
  // Clean up inventory
  clearCaseInventory(instanceId);
  
  // Remove from active
  activeCases.splice(index, 1);
  
  return true;
}

// ============================================================================
// Observations (Structured Evidence)
// ============================================================================

/** Record an observation for a case */
export function recordObservation(
  caseId: string,
  fieldId: string,
  value: string | string[] | number,
  instrumentId: string
): boolean {
  const activeCase = activeCases.find(c => c.id === caseId);
  if (!activeCase) return false;
  
  const observation: Observation = {
    fieldId,
    value,
    instrumentId,
    tick: gameClock.tick,
  };
  
  // Replace existing observation for same field, or add new
  const existingIndex = activeCase.observations.findIndex(o => o.fieldId === fieldId);
  if (existingIndex !== -1) {
    activeCase.observations[existingIndex] = observation;
  } else {
    activeCase.observations.push(observation);
  }
  
  return true;
}

/** Get all observations for a case */
export function getObservations(caseId: string): Observation[] {
  const activeCase = activeCases.find(c => c.id === caseId);
  return activeCase?.observations ?? [];
}

/** Get observation by field ID */
export function getObservation(caseId: string, fieldId: string): Observation | undefined {
  const activeCase = activeCases.find(c => c.id === caseId);
  return activeCase?.observations.find(o => o.fieldId === fieldId);
}

// ============================================================================
// Sample Cost Tracking
// ============================================================================

/** Record that a sample was taken (for cost tracking) */
export function recordSampleTaken(
  caseId: string, 
  type: string, 
  cost: number
): boolean {
  const activeCase = activeCases.find(c => c.id === caseId);
  if (!activeCase) return false;
  
  activeCase.samplesTaken.push({ type: type as never, cost });
  return true;
}

/** Get total sample costs for a case */
export function getTotalSampleCost(caseId: string): number {
  const activeCase = activeCases.find(c => c.id === caseId);
  if (!activeCase) return 0;
  
  return activeCase.samplesTaken.reduce((sum, s) => sum + s.cost, 0);
}

// ============================================================================
// Case Submission & Scoring
// ============================================================================

/** Submit a case for scoring - all fields at once */
export function submitCase(
  caseId: string, 
  submission: CaseSubmission
): CaseResult | null {
  const activeCase = activeCases.find(c => c.id === caseId);
  if (!activeCase) return null;
  
  const definition = getCaseDefinition(activeCase.definitionId);
  if (!definition) return null;
  
  // Score each field
  const diagnosisCorrect = submission.diagnosis === definition.correctDiagnosis;
  const treatmentCorrect = definition.correctTreatment 
    ? submission.treatment === definition.correctTreatment 
    : true;
  const geneticFactorsCorrect = definition.geneticFactors
    ? arraysEqual(submission.geneticFactors ?? [], definition.geneticFactors)
    : true;
  
  const allCorrect = diagnosisCorrect && treatmentCorrect && geneticFactorsCorrect;
  
  // Calculate rewards/penalties
  const baseReward = definition.baseReward;
  const sampleCosts = getTotalSampleCost(caseId);
  
  let reputationChange = 0;
  let fundsChange = -sampleCosts; // Always deduct sample costs
  let lawsuit: LawsuitResult | null = null;
  
  if (allCorrect) {
    // Success! Full reward
    reputationChange = 5 + definition.difficulty * 2;
    fundsChange += baseReward;
  } else {
    // Partial or complete failure
    let wrongFields = 0;
    if (!diagnosisCorrect) wrongFields++;
    if (!treatmentCorrect) wrongFields++;
    if (!geneticFactorsCorrect) wrongFields++;
    
    // 50% penalty per wrong field
    const penaltyMultiplier = wrongFields * 0.5;
    reputationChange = -Math.floor(5 * penaltyMultiplier);
    
    // Reduced reward
    fundsChange += Math.floor(baseReward * (1 - penaltyMultiplier));
    
    // Lawsuit check for bad diagnosis (especially if treatment wrong)
    if (!diagnosisCorrect) {
      lawsuit = evaluateLawsuit(definition, submission, diagnosisCorrect, treatmentCorrect);
    }
  }
  
  // Apply confidence modifier
  if (submission.confidence === 'high' && allCorrect) {
    reputationChange = Math.floor(reputationChange * 1.2);
  } else if (submission.confidence === 'high' && !allCorrect) {
    reputationChange = Math.floor(reputationChange * 1.5); // Worse penalty for overconfidence
  }
  
  const result: CaseResult = {
    caseId,
    correct: allCorrect,
    diagnosisCorrect,
    treatmentCorrect,
    geneticFactorsCorrect,
    reputationChange,
    fundsChange,
    lawsuit,
  };
  
  // Update case status
  activeCase.status = allCorrect ? 'completed' : 'failed';
  
  // Move to completed
  completedCaseResults.push(result);
  
  // Remove from active
  const index = activeCases.findIndex(c => c.id === caseId);
  if (index !== -1) {
    activeCases.splice(index, 1);
  }
  
  // Clean up inventory
  clearCaseInventory(caseId);
  
  return result;
}

// ============================================================================
// Lawsuit Evaluation
// ============================================================================

function evaluateLawsuit(
  definition: CaseDefinition,
  _submission: CaseSubmission,
  diagnosisCorrect: boolean,
  treatmentCorrect: boolean
): LawsuitResult | null {
  // No lawsuit if diagnosis was correct
  if (diagnosisCorrect) return null;
  
  // Higher difficulty cases = more serious consequences
  const severity = definition.difficulty >= 4 ? 'catastrophic' 
    : definition.difficulty >= 2 ? 'major' 
    : 'minor';
  
  // Era affects lawsuit culture
  const eraMultiplier = {
    'classical': 0.2, // Fewer lawsuits in 1880s
    'golden-age': 0.5,
    'molecular': 0.8,
    'genomic': 1.0,
    'modern': 1.2, // Most litigious
  }[definition.era];
  
  // Random chance based on severity
  const lawsuitChance = {
    'minor': 0.1,
    'major': 0.3,
    'catastrophic': 0.6,
  }[severity] * eraMultiplier;
  
  if (Math.random() > lawsuitChance) return null;
  
  // Calculate penalties
  const basePenalty = definition.baseReward * 2;
  const severityMultiplier = {
    'minor': 1,
    'major': 3,
    'catastrophic': 10,
  }[severity];
  
  return {
    severity,
    reason: !treatmentCorrect 
      ? 'Incorrect treatment led to patient harm'
      : 'Misdiagnosis delayed proper treatment',
    fundsPenalty: Math.floor(basePenalty * severityMultiplier * eraMultiplier),
    reputationPenalty: Math.floor(10 * severityMultiplier),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

// ============================================================================
// Reset
// ============================================================================

export function resetCases() {
  activeCases = [];
  completedCaseResults = [];
  caseCounter = 0;
}
