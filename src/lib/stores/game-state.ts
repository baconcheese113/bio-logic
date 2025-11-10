import { writable, derived } from 'svelte/store';
import { CASES, ORGANISMS, SAMPLE_BACKGROUNDS, type SampleType } from '../../data/organisms';
import { clearEvidence } from './evidence';
import { resetInstrumentState as resetInstruments } from './instrument-state';

export type GamePhase = 
  | 'case-presentation' 
  | 'sample-selection' 
  | 'instrument-selection'
  | 'microscope-observation'
  | 'culture-observation'
  | 'biochemical-testing'
  | 'serology-testing'
  | 'diagnosis';

export type StainType = 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore';

export interface GameState {
  currentCaseIndex: number;
  selectedSampleType: SampleType | null;
  currentStain: StainType;
  gamePhase: GamePhase;
  lastInstrumentPhase: 'microscope-observation' | 'culture-observation' | 'biochemical-testing' | 'serology-testing';
  focusDepth: number;
  zoomLevel: number;
}

const initialState: GameState = {
  currentCaseIndex: 0,
  selectedSampleType: null,
  currentStain: 'none',
  gamePhase: 'case-presentation',
  lastInstrumentPhase: 'microscope-observation',
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
  ($case) => {
    // For organism-identification cases, find the organism
    if ($case.answerFormat === 'organism-identification') {
      return ORGANISMS.find(org => org.id === $case.correctAnswer);
    }
    return undefined;
  }
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
    gamePhase: 'instrument-selection',
  }));
}

export function selectInstrument(instrument: 'microscope' | 'culture' | 'biochemical' | 'serology') {
  let phase: GamePhase;
  if (instrument === 'microscope') {
    phase = 'microscope-observation';
  } else if (instrument === 'culture') {
    phase = 'culture-observation';
  } else if (instrument === 'serology') {
    phase = 'serology-testing';
  } else {
    phase = 'biochemical-testing';
  }
  
  gameState.update(state => ({
    ...state,
    gamePhase: phase,
    lastInstrumentPhase: phase,
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

export function resetInstrumentState() {
  resetInstruments();
  gameState.update(state => ({
    ...state,
    currentStain: 'none',
    focusDepth: 50,
  }));
}

export function returnToSampleSelection() {
  clearEvidence();
  resetInstrumentState();
  gameState.update(state => ({
    ...state,
    selectedSampleType: null,
    currentStain: 'none',
    gamePhase: 'sample-selection',
  }));
}

export function goToDiagnosis() {
  gameState.update(state => ({
    ...state,
    gamePhase: 'diagnosis',
  }));
}

export function returnToInstrumentSelection() {
  gameState.update(state => ({
    ...state,
    gamePhase: 'instrument-selection',
  }));
}

export function proceedToDiagnosis() {
  gameState.update(state => ({
    ...state,
    gamePhase: 'diagnosis',
  }));
}

export function returnToLastInstrument() {
  gameState.update(state => ({
    ...state,
    gamePhase: state.lastInstrumentPhase,
  }));
}

export function goToBiochemicalTests() {
  gameState.update(state => ({
    ...state,
    gamePhase: 'biochemical-testing',
    lastInstrumentPhase: 'biochemical-testing',
  }));
}
