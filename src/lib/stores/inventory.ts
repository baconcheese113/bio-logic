import { writable } from 'svelte/store';
import type { SampleType, PrimerDesign } from '../../data/organisms';

export interface InventorySample {
  id: string; // Unique identifier for this inventory item
  type: 'sample';
  sampleType: SampleType;
  caseId: string;
  caseTitle: string;
  caseIndex: number;
  collectedAt: number; // Timestamp when sample was collected
}

export interface InventoryGelResult {
  id: string;
  type: 'gel-result';
  caseId: string;
  caseTitle: string;
  caseIndex: number;
  fragmentSize: number;
  primerDesign: PrimerDesign;
  detectedGene: string;
  createdAt: number;
}

export type InventoryItem = InventorySample | InventoryGelResult;

export interface InventoryState {
  items: InventoryItem[];
  activeSampleId: string | null; // Currently selected sample for testing
}

const initialState: InventoryState = {
  items: [],
  activeSampleId: null,
};

export const inventory = writable<InventoryState>(initialState);

// Derived store to get only samples
export const samples = {
  subscribe: (fn: (samples: InventorySample[]) => void) => {
    return inventory.subscribe(state => {
      fn(state.items.filter((item): item is InventorySample => item.type === 'sample'));
    });
  }
};

// Derived store to get only gel results
export const gelResults = {
  subscribe: (fn: (results: InventoryGelResult[]) => void) => {
    return inventory.subscribe(state => {
      fn(state.items.filter((item): item is InventoryGelResult => item.type === 'gel-result'));
    });
  }
};

// Helper functions
export function addSampleToInventory(
  sampleType: SampleType,
  caseId: string,
  caseTitle: string,
  caseIndex: number
): string {
  const id = `sample_${caseId}_${sampleType}_${Date.now()}`;
  const sample: InventorySample = {
    id,
    type: 'sample',
    sampleType,
    caseId,
    caseTitle,
    caseIndex,
    collectedAt: Date.now(),
  };
  
  inventory.update(state => ({
    ...state,
    items: [...state.items, sample],
    activeSampleId: id, // Set the newly added sample as active
  }));
  
  return id;
}

export function addGelResultToInventory(
  caseId: string,
  caseTitle: string,
  caseIndex: number,
  fragmentSize: number,
  primerDesign: PrimerDesign,
  detectedGene: string
): string {
  const id = `gel_${caseId}_${Date.now()}`;
  const gelResult: InventoryGelResult = {
    id,
    type: 'gel-result',
    caseId,
    caseTitle,
    caseIndex,
    fragmentSize,
    primerDesign,
    detectedGene,
    createdAt: Date.now(),
  };
  
  inventory.update(state => ({
    ...state,
    items: [...state.items, gelResult],
  }));
  
  return id;
}

export function removeSampleFromInventory(sampleId: string) {
  inventory.update(state => {
    const updatedItems = state.items.filter(s => s.id !== sampleId);
    const activeSampleId = state.activeSampleId === sampleId 
      ? (updatedItems.some(i => i.type === 'sample') ? updatedItems.find(i => i.type === 'sample')!.id : null)
      : state.activeSampleId;
    
    return {
      items: updatedItems,
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

export function getSampleById(sampleId: string, items: InventoryItem[]): InventorySample | undefined {
  const item = items.find(s => s.id === sampleId);
  return item && item.type === 'sample' ? item : undefined;
}

export function getActiveSample(state: InventoryState): InventorySample | null {
  if (!state.activeSampleId) return null;
  const item = state.items.find(i => i.id === state.activeSampleId);
  return item && item.type === 'sample' ? item : null;
}
