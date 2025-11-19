import { writable, derived } from 'svelte/store';
import type { Case } from '../../data/organisms';

export interface ActiveCase {
  caseId: string;
  caseIndex: number;
  startTime: number;
  isComplete: boolean;
}

interface ActiveCasesState {
  activeCases: ActiveCase[];
  currentActiveCaseId: string | null;
}

const initialState: ActiveCasesState = {
  activeCases: [],
  currentActiveCaseId: null,
};

export const activeCases = writable<ActiveCasesState>(initialState);

// Get the currently active case
export const currentActiveCase = derived(
  activeCases,
  ($state) => {
    if (!$state.currentActiveCaseId) return null;
    return $state.activeCases.find(c => c.caseId === $state.currentActiveCaseId) || null;
  }
);

// Add or activate a case
export function activateCase(caseInstance: Case, caseIndex: number) {
  console.log('[activateCase] START - Called with:', caseInstance.id, caseIndex);
  console.trace('[activateCase] Call stack');
  
  activeCases.update(state => {
    const caseId = `${caseInstance.id}-${Date.now()}`;
    console.log('[activateCase] Generated caseId:', caseId);
    console.log('[activateCase] Current activeCases:', state.activeCases);
    
    const existing = state.activeCases.find(c => c.caseIndex === caseIndex && !c.isComplete);
    
    if (existing) {
      // Case already active, just switch to it
      console.log('[activateCase] Found existing case, switching to:', existing.caseId);
      return {
        ...state,
        currentActiveCaseId: existing.caseId,
      };
    }
    
    // Add new active case
    const newCase: ActiveCase = {
      caseId,
      caseIndex,
      startTime: Date.now(),
      isComplete: false,
    };
    
    console.log('[activateCase] Creating NEW case:', newCase);
    return {
      activeCases: [...state.activeCases, newCase],
      currentActiveCaseId: caseId,
    };
  });
  
  console.log('[activateCase] END');
}

// Switch to a different active case
export function switchToCase(caseId: string) {
  activeCases.update(state => ({
    ...state,
    currentActiveCaseId: caseId,
  }));
}

// Mark a case as complete
export function completeCase(caseId: string) {
  activeCases.update(state => ({
    ...state,
    activeCases: state.activeCases.map(c => 
      c.caseId === caseId ? { ...c, isComplete: true } : c
    ),
  }));
}

// Remove a case from active cases (cleanup after completion)
export function removeCase(caseId: string) {
  activeCases.update(state => {
    const filtered = state.activeCases.filter(c => c.caseId !== caseId);
    let newCurrentId = state.currentActiveCaseId;
    
    // If we're removing the current case, switch to another one
    if (state.currentActiveCaseId === caseId) {
      newCurrentId = filtered.length > 0 ? filtered[0].caseId : null;
    }
    
    return {
      activeCases: filtered,
      currentActiveCaseId: newCurrentId,
    };
  });
}

// Clear all active cases
export function clearActiveCases() {
  activeCases.set(initialState);
}
