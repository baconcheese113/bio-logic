import { writable } from 'svelte/store';

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
