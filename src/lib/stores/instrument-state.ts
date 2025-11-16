import { writable } from 'svelte/store';
import type { ElisaWellContents, ElisaStep } from '../../data/organisms';

export interface Colony {
  x: number;
  y: number;
  size: number;
}

export type MediaType = 'blood-agar' | 'macconkey';

export interface InstrumentState {
  // Culture plate state
  culture: {
    selectedMedia: MediaType;
    isStreaked: boolean;
    isIncubating: boolean;
    incubationProgress: number;
    showColonies: boolean;
    colonies: Colony[];
  };
  // ELISA state
  elisa: {
    currentStep: ElisaStep;
    wells: ElisaWellContents[];
    incubationTime: number;
    platePrepared: boolean;
  };
  // Microscope state is handled in game-state.ts (currentStain, focusDepth)
  // Future: biochemical test state
}

const initialState: InstrumentState = {
  culture: {
    selectedMedia: 'blood-agar',
    isStreaked: false,
    isIncubating: false,
    incubationProgress: 0,
    showColonies: false,
    colonies: [],
  },
  elisa: {
    currentStep: 'coating',
    wells: [],
    incubationTime: 0,
    platePrepared: false,
  },
};

export const instrumentState = writable<InstrumentState>(initialState);

export function resetInstrumentState() {
  instrumentState.set(initialState);
}

// Culture plate helpers
export function selectMedia(media: MediaType) {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      selectedMedia: media,
      isStreaked: false,
      isIncubating: false,
      incubationProgress: 0,
      showColonies: false,
      colonies: [],
    }
  }));
}

export function streakPlate() {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      isStreaked: true,
    }
  }));
}

export function startIncubation() {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      isIncubating: true,
    }
  }));
}

export function setIncubationProgress(progress: number) {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      incubationProgress: progress,
    }
  }));
}

export function showColonies(colonies: Colony[]) {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      showColonies: true,
      colonies,
    }
  }));
}

// ELISA helpers
export function initializeElisaPlate() {
  // Initialize 96-well plate with standard layout:
  // Row A: 4 positive controls, 4 negative controls
  // Rows B-H: Patient samples
  const wells: ElisaWellContents[] = [];
  
  // Row A: Controls (8 wells - 4 positive, 4 negative)
  for (let i = 0; i < 4; i++) {
    wells.push({
      wellType: 'positive-control',
      coated: false,
      blocked: false,
      sampleAdded: false,
      enzymeAdded: false,
      substrateAdded: false,
      absorbance: null,
    });
  }
  for (let i = 0; i < 4; i++) {
    wells.push({
      wellType: 'negative-control',
      coated: false,
      blocked: false,
      sampleAdded: false,
      enzymeAdded: false,
      substrateAdded: false,
      absorbance: null,
    });
  }
  
  // Rows B-H: Patient samples (56 wells, but we'll use first 8 for simplicity)
  for (let i = 0; i < 8; i++) {
    wells.push({
      wellType: 'sample',
      coated: false,
      blocked: false,
      sampleAdded: false,
      enzymeAdded: false,
      substrateAdded: false,
      absorbance: null,
    });
  }
  
  instrumentState.update(state => ({
    ...state,
    elisa: {
      ...state.elisa,
      wells,
      platePrepared: true,
    }
  }));
}

export function setElisaStep(step: ElisaStep) {
  instrumentState.update(state => ({
    ...state,
    elisa: {
      ...state.elisa,
      currentStep: step,
    }
  }));
}

export function updateElisaWell(wellIndex: number, updates: Partial<ElisaWellContents>) {
  instrumentState.update(state => ({
    ...state,
    elisa: {
      ...state.elisa,
      wells: state.elisa.wells.map((well, idx) => 
        idx === wellIndex ? { ...well, ...updates } : well
      ),
    }
  }));
}

export function setElisaIncubationTime(time: number) {
  instrumentState.update(state => ({
    ...state,
    elisa: {
      ...state.elisa,
      incubationTime: time,
    }
  }));
}

export function readElisaWell(wellIndex: number, absorbance: number) {
  instrumentState.update(state => ({
    ...state,
    elisa: {
      ...state.elisa,
      wells: state.elisa.wells.map((well, idx) => 
        idx === wellIndex ? { ...well, absorbance } : well
      ),
    }
  }));
}
