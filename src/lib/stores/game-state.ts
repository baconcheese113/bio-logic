import { writable, derived } from 'svelte/store';
import { CASES, ORGANISMS, SAMPLE_BACKGROUNDS, type SampleType } from '../../data/organisms';
import { clearEvidence } from './evidence';

export type GamePhase = 'case-presentation' | 'sample-selection' | 'microscope-observation' | 'diagnosis';

export type StainType = 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore';

export interface GameState {
  currentCaseIndex: number;
  selectedSampleType: SampleType | null;
  currentStain: StainType;
  gamePhase: GamePhase;
  focusDepth: number;
  zoomLevel: number;
}

const initialState: GameState = {
  currentCaseIndex: 0,
  selectedSampleType: null,
  currentStain: 'none',
  gamePhase: 'case-presentation',
  focusDepth: 50,
  zoomLevel: 1000,
};

export const gameState = writable<GameState>(initialState);

export const currentCase = derived(
  gameState,
  ($state) => CASES[$state.currentCaseIndex]
);

export const currentOrganism = derived(
  currentCase,
  ($case) => ORGANISMS.find(org => org.id === $case.organismId)
);

export const isCorrectSample = derived(
  [gameState, currentCase],
  ([$state, $case]) => $state.selectedSampleType === $case.correctSampleType
);

export const currentBackground = derived(
  gameState,
  ($state) => $state.selectedSampleType ? SAMPLE_BACKGROUNDS[$state.selectedSampleType] : null
);

// Helper functions
export function nextCase() {
  clearEvidence();
  gameState.update(state => ({
    ...state,
    currentCaseIndex: (state.currentCaseIndex + 1) % CASES.length,
    selectedSampleType: null,
    currentStain: 'none',
    gamePhase: 'case-presentation',
    focusDepth: 50,
  }));
}

export function selectSample(sampleType: SampleType) {
  gameState.update(state => ({
    ...state,
    selectedSampleType: sampleType,
    gamePhase: 'microscope-observation',
  }));
}

export function changeStain(stain: StainType) {
  gameState.update(state => ({
    ...state,
    currentStain: stain,
  }));
}

export function setFocus(depth: number) {
  gameState.update(state => ({
    ...state,
    focusDepth: depth,
  }));
}

export function returnToSampleSelection() {
  gameState.update(state => ({
    ...state,
    selectedSampleType: null,
    currentStain: 'none',
    gamePhase: 'sample-selection',
  }));
}

export function proceedToDiagnosis() {
  gameState.update(state => ({
    ...state,
    gamePhase: 'diagnosis',
  }));
}
