import { writable, derived } from 'svelte/store';
import type { GameCase, ActiveCase, CaseStatus } from '../../data/case-types';
import { clearEvidence } from './evidence';

export interface ActiveCasesState {
  cases: ActiveCase[];
  currentCaseId: string | null; // Currently viewed/active case
}

const initialState: ActiveCasesState = {
  cases: [],
  currentCaseId: null,
};

export const activeCases = writable<ActiveCasesState>(initialState);

// Derived store for current active case
export const currentActiveCase = derived(
  activeCases,
  ($activeCases) => {
    if (!$activeCases.currentCaseId) return null;
    return $activeCases.cases.find(c => c.case.id === $activeCases.currentCaseId) || null;
  }
);

// Derived store for cases by status
export const casesByStatus = derived(
  activeCases,
  ($activeCases) => {
    const grouped: Record<CaseStatus, ActiveCase[]> = {
      'available': [],
      'accepted': [],
      'awaiting-results': [],
      'ready-for-diagnosis': [],
      'completed': [],
      'failed': [],
    };
    
    $activeCases.cases.forEach(activeCase => {
      grouped[activeCase.status].push(activeCase);
    });
    
    return grouped;
  }
);

// Helper functions
export function acceptCase(gameCase: GameCase) {
  activeCases.update(state => {
    const activeCase: ActiveCase = {
      case: gameCase,
      status: 'accepted',
      acceptedAt: Date.now(),
      evidenceCollected: {},
      answersSubmitted: {},
    };
    
    return {
      cases: [...state.cases, activeCase],
      currentCaseId: gameCase.id,
    };
  });
}

export function switchToCase(caseId: string) {
  activeCases.update(state => ({
    ...state,
    currentCaseId: caseId,
  }));
  
  // Clear evidence when switching cases
  clearEvidence();
}

export function updateCaseStatus(caseId: string, status: CaseStatus) {
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => 
      c.case.id === caseId ? { ...c, status } : c
    ),
  }));
}

export function updateCaseEvidence(caseId: string, evidence: Record<string, unknown>) {
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => 
      c.case.id === caseId 
        ? { ...c, evidenceCollected: { ...c.evidenceCollected, ...evidence } }
        : c
    ),
  }));
}

export function submitCaseAnswer(caseId: string, questionId: string, answer: string) {
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => 
      c.case.id === caseId 
        ? { 
            ...c, 
            answersSubmitted: { ...c.answersSubmitted, [questionId]: answer }
          }
        : c
    ),
  }));
}

export function completeCase(caseId: string, score: number, feedback: string) {
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => 
      c.case.id === caseId 
        ? { 
            ...c, 
            status: 'completed',
            completedAt: Date.now(),
            score,
            feedback,
          }
        : c
    ),
  }));
}

export function removeCase(caseId: string) {
  activeCases.update(state => {
    const newCases = state.cases.filter(c => c.case.id !== caseId);
    const newCurrentId = state.currentCaseId === caseId
      ? (newCases.length > 0 ? newCases[0].case.id : null)
      : state.currentCaseId;
    
    return {
      cases: newCases,
      currentCaseId: newCurrentId,
    };
  });
}

export function addProcessingJob(
  caseId: string,
  instrumentType: string,
  duration: number
) {
  const startedAt = Date.now();
  const completesAt = startedAt + (duration * 1000);
  
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => {
      if (c.case.id !== caseId) return c;
      
      const newJob = {
        instrumentType,
        startedAt,
        completesAt,
        status: 'running' as const,
      };
      
      return {
        ...c,
        processingJobs: [...(c.processingJobs || []), newJob],
        status: 'awaiting-results' as CaseStatus,
      };
    }),
  }));
}

export function checkProcessingJobs() {
  const now = Date.now();
  
  activeCases.update(state => ({
    ...state,
    cases: state.cases.map(c => {
      if (!c.processingJobs || c.processingJobs.length === 0) return c;
      
      const updatedJobs = c.processingJobs.map(job => 
        job.status === 'running' && now >= job.completesAt
          ? { ...job, status: 'complete' as const }
          : job
      );
      
      const allComplete = updatedJobs.every(j => j.status === 'complete');
      const anyComplete = updatedJobs.some(j => j.status === 'complete' && 
        c.processingJobs!.find(orig => orig.instrumentType === j.instrumentType)?.status === 'running'
      );
      
      return {
        ...c,
        processingJobs: updatedJobs,
        status: allComplete && c.status === 'awaiting-results' 
          ? 'ready-for-diagnosis' as CaseStatus
          : c.status,
      };
    }),
  }));
}

// Check processing jobs every second
if (typeof window !== 'undefined') {
  setInterval(checkProcessingJobs, 1000);
}
