import { writable, get } from 'svelte/store';
import type { ElisaWellContents, ElisaStep } from '../../data/organisms';

export interface Colony {
  x: number;
  y: number;
  size: number;
}

export type MediaType = 'blood-agar' | 'macconkey' | null;

export type InstrumentType = 'microscope' | 'culture' | 'biochemical' | 'serology' | 'electrophoresis' | 'pcr' | 'sanger' | 'elisa' | 'flow-cytometry' | 'plate-reader';

export interface InstrumentState {
  // Which sample is loaded in each instrument (maps instrument -> sampleId)
  activeSamples: Partial<Record<InstrumentType, string>>;

  // Culture plate state (the only instrument with persistent visual state)
  culture: {
    selectedMedia: MediaType;
    isStreaked: boolean;
    colonies: Colony[];
  };
  
  // ELISA state (multi-step workflow)
  elisa: {
    currentStep: ElisaStep;
    wells: ElisaWellContents[];
    platePrepared: boolean;
  };
}

const initialState: InstrumentState = {
  activeSamples: {},
  culture: {
    selectedMedia: null,
    isStreaked: false,
    colonies: [],
  },
  elisa: {
    currentStep: 'coating',
    wells: [],
    platePrepared: false,
  },
};

export const instrumentState = writable<InstrumentState>(initialState);

export function resetInstrumentState() {
  instrumentState.set(initialState);
}

// Sample loading/unloading
export function loadSampleIntoInstrument(instrument: InstrumentType, sampleId: string) {
  instrumentState.update(state => ({
    ...state,
    activeSamples: {
      ...state.activeSamples,
      [instrument]: sampleId,
    },
  }));
}

export function clearSampleFromInstrument(instrument: InstrumentType) {
  instrumentState.update(state => {
    const { [instrument]: _, ...rest } = state.activeSamples;
    return {
      ...state,
      activeSamples: rest,
    };
  });
}

export function getActiveSampleId(instrument: InstrumentType): string | undefined {
  return get(instrumentState).activeSamples[instrument];
}

// Culture plate helpers
export function selectMedia(media: MediaType) {
  instrumentState.update(state => ({
    ...state,
    culture: {
      selectedMedia: media,
      isStreaked: false,
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

export function showColonies(colonies: Colony[]) {
  instrumentState.update(state => ({
    ...state,
    culture: {
      ...state.culture,
      colonies,
    }
  }));
}

export function resetCulturePlate() {
  instrumentState.update(state => ({
    ...state,
    culture: {
      selectedMedia: null,
      isStreaked: false,
      colonies: [],
    }
  }));
}

// ELISA helpers
export function initializeElisaPlate() {
  const wells: ElisaWellContents[] = [];

  // Row A: Controls (4 positive, 4 negative)
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

  // Patient samples (8 wells)
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
      currentStep: 'coating',
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

export function readElisaWell(wellIndex: number, absorbance: number) {
  updateElisaWell(wellIndex, { absorbance });
}

export function resetElisa() {
  instrumentState.update(state => ({
    ...state,
    elisa: {
      currentStep: 'coating',
      wells: [],
      platePrepared: false,
    }
  }));
}
