import { writable } from 'svelte/store';
import type { SampleType } from '../../data/organisms';

export interface InventorySample {
  id: string; // Unique identifier for this inventory item
  sampleType: SampleType;
  caseId: string;
  caseTitle: string;
  caseIndex: number;
  collectedAt: number; // Timestamp when sample was collected
}

export interface InventoryState {
  samples: InventorySample[];
  activeSampleId: string | null; // Currently selected sample for testing
}

const initialState: InventoryState = {
  samples: [],
  activeSampleId: null,
};

export const inventory = writable<InventoryState>(initialState);

// Helper functions
export function addSampleToInventory(
  sampleType: SampleType,
  caseId: string,
  caseTitle: string,
  caseIndex: number
): string {
  const id = `${caseId}_${sampleType}_${Date.now()}`;
  const sample: InventorySample = {
    id,
    sampleType,
    caseId,
    caseTitle,
    caseIndex,
    collectedAt: Date.now(),
  };
  
  inventory.update(state => ({
    ...state,
    samples: [...state.samples, sample],
    activeSampleId: id, // Set the newly added sample as active
  }));
  
  return id;
}

export function removeSampleFromInventory(sampleId: string) {
  inventory.update(state => {
    const updatedSamples = state.samples.filter(s => s.id !== sampleId);
    const activeSampleId = state.activeSampleId === sampleId 
      ? (updatedSamples.length > 0 ? updatedSamples[0].id : null)
      : state.activeSampleId;
    
    return {
      samples: updatedSamples,
      activeSampleId,
    };
  });
}

export function setActiveSample(sampleId: string | null) {
  inventory.update(state => ({
    ...state,
    activeSampleId: sampleId,
  }));
}

export function clearInventory() {
  inventory.set(initialState);
}

export function getSampleById(sampleId: string, samples: InventorySample[]): InventorySample | undefined {
  return samples.find(s => s.id === sampleId);
}
