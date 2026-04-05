import { writable, derived } from 'svelte/store';
import { CASES, ORGANISMS, SAMPLE_BACKGROUNDS, type SampleType } from '../../data/organisms';
import { CLINICAL_DIAGNOSES } from '../../data/clinical-diagnoses';
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
  | 'electrophoresis-testing'
  | 'pcr-testing'
  | 'sanger-sequencing'
  | 'elisa-testing'
  | 'plate-reader'
  | 'flow-cytometry'
  | 'diagnosis';

export type StainType = 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore';

export interface GameState {
  currentCaseIndex: number;
  selectedSampleType: SampleType | null;
  currentStain: StainType;
  gamePhase: GamePhase;
  lastInstrumentPhase: 'microscope-observation' | 'culture-observation' | 'biochemical-testing' | 'serology-testing' | 'electrophoresis-testing' | 'pcr-testing' | 'sanger-sequencing' | 'elisa-testing' | 'plate-reader' | 'flow-cytometry';
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

export const correctOrganism = derived(
  currentCase,
  ($case) => {
    // For organism-identification and antibiotic-selection cases, find the organism
    if ($case.answerFormat === 'organism-identification' || $case.answerFormat === 'antibiotic-selection') {
      return ORGANISMS.find(org => org.id === $case.correctAnswer);
    }
    // For clinical-diagnosis cases, there is no organism - just patient serum
    return undefined;
  }
);

export const correctDiagnosis = derived(
  currentCase,
  ($case) => {
    if ($case.answerFormat === 'clinical-diagnosis') {
      return CLINICAL_DIAGNOSES.find(d => d.id === $case.correctAnswer);
    }
    return undefined;
  }
);

// Derived store for electrophoresis data (works for both organisms and clinical diagnoses)
export const currentElectrophoresisData = derived(
  currentCase,
  ($case) => {
    // For organism cases with protein data
    if ($case.answerFormat === 'organism-identification' || $case.answerFormat === 'antibiotic-selection') {
      const organism = ORGANISMS.find(org => org.id === $case.correctAnswer);
      return organism?.proteinElectrophoresis;
    }
    // For clinical-diagnosis cases, get from CLINICAL_DIAGNOSES
    if ($case.answerFormat === 'clinical-diagnosis') {
      const diagnosis = CLINICAL_DIAGNOSES.find(d => d.id === $case.correctAnswer);
      if (diagnosis) {
        return {
          pattern: diagnosis.electrophoresis.pattern,
          densitometer: diagnosis.electrophoresis.densitometer,
          clinicalContext: diagnosis.clinicalPresentation.symptoms.join(', '),
        };
      }
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

export function selectInstrument(instrument: 'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'sanger' | 'elisa' | 'flow-cytometry') {
  let phase: GamePhase;
  if (instrument === 'microscope') {
    phase = 'microscope-observation';
  } else if (instrument === 'culture') {
    phase = 'culture-observation';
  } else if (instrument === 'serology') {
    phase = 'serology-testing';
  } else if (instrument === 'electrophoresis') {
    phase = 'electrophoresis-testing';
  } else if (instrument === 'pcr') {
    phase = 'pcr-testing';
  } else if (instrument === 'sanger') {
    phase = 'sanger-sequencing';
  } else if (instrument === 'elisa') {
    phase = 'elisa-testing';
  } else if (instrument === 'flow-cytometry') {
    phase = 'flow-cytometry';
  } else {
    phase = 'biochemical-testing';
  }
  
  gameState.update(state => ({
    ...state,
    gamePhase: phase,
    lastInstrumentPhase: phase as typeof state.lastInstrumentPhase,
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
