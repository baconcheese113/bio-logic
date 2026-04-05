import { writable, derived, get } from 'svelte/store';
import type { SampleType, BiologicalProperties } from '../../data/organisms';

export type InventoryItemType = 'sample' | 'result';

export interface AddSampleOptions {
  data?: Record<string, unknown>;
  displayName?: string;
  allowDuplicate?: boolean;
}

export interface InventoryObservation {
  id: string;
  label: string;
  timestamp: number;
  source?: string;
  data?: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  caseId: string;
  type: InventoryItemType;
  itemType: string; // e.g., 'blood', 'gram-stain', 'pcr-result'
  displayName: string;
  timestamp: number;
  data?: Record<string, unknown>;
  observations?: InventoryObservation[];
  biologicalProperties?: BiologicalProperties;
}

export interface CaseInventory {
  caseId: string;
  samples: InventoryItem[];
  results: InventoryItem[];
}

interface InventoryState {
  items: InventoryItem[];
}

const initialState: InventoryState = {
  items: [],
};

export const inventory = writable<InventoryState>(initialState);

const BASE_SAMPLE_TYPES = new Set<SampleType>([
  'blood',
  'sputum',
  'throat-swab',
  'stool',
  'wound',
  'csf',
  'urine',
  'tissue',
]);

function isBaseSampleType(sampleType: SampleType): boolean {
  return BASE_SAMPLE_TYPES.has(sampleType);
}

// Derived store: get inventory grouped by case
export const inventoryByCase = derived(
  inventory,
  ($inventory) => {
    const grouped = new Map<string, CaseInventory>();
    
    for (const item of $inventory.items) {
      if (!grouped.has(item.caseId)) {
        grouped.set(item.caseId, {
          caseId: item.caseId,
          samples: [],
          results: [],
        });
      }
      
      const caseInventory = grouped.get(item.caseId)!;
      if (item.type === 'sample') {
        caseInventory.samples.push(item);
      } else {
        caseInventory.results.push(item);
      }
    }
    
    return grouped;
  }
);

// Add a sample to inventory
export function addSample(
  caseId: string,
  sampleType: SampleType,
  biologicalProperties?: BiologicalProperties,
  options?: AddSampleOptions
) {
  const currentInventory = get(inventory);

  const shouldPreventDuplicate =
    isBaseSampleType(sampleType) && options?.allowDuplicate !== true;
  if (shouldPreventDuplicate) {
    // Check if sample of this type already exists for this case
    const existingSample = currentInventory.items.find(
      (item) =>
        item.caseId === caseId &&
        item.type === 'sample' &&
        item.itemType === sampleType
    );

    if (existingSample) {
      // Return false to indicate we need user confirmation
      return false;
    }
  }
  
  const newSample: InventoryItem = {
    id: `sample-${Date.now()}-${Math.random()}`,
    caseId,
    type: 'sample',
    itemType: sampleType,
    displayName: options?.displayName ?? formatSampleName(sampleType),
    timestamp: Date.now(),
    data: options?.data,
    biologicalProperties,
  };
  
  inventory.update(state => ({
    ...state,
    items: [...state.items, newSample],
  }));

  return newSample;
}

export function addObservationToItem(
  itemId: string,
  observation: Omit<InventoryObservation, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: number;
  }
): boolean {
  const obs: InventoryObservation = {
    id: observation.id ?? `obs-${Date.now()}-${Math.random()}`,
    timestamp: observation.timestamp ?? Date.now(),
    label: observation.label,
    source: observation.source,
    data: observation.data,
  };

  let didUpdate = false;
  inventory.update((state) => {
    const idx = state.items.findIndex((i) => i.id === itemId);
    if (idx === -1) return state;

    const item = state.items[idx];
    const nextItem: InventoryItem = {
      ...item,
      observations: [...(item.observations ?? []), obs],
    };

    const nextItems = state.items.slice();
    nextItems[idx] = nextItem;
    didUpdate = true;
    return { ...state, items: nextItems };
  });

  return didUpdate;
}

// Get samples for a case
export function getSamplesForCase(caseId: string) {
  const currentInventory = get(inventory);
  return currentInventory.items.filter(
    item => item.caseId === caseId && item.type === 'sample'
  );
}

// Replace existing sample
export function replaceSample(caseId: string, sampleType: SampleType) {
  inventory.update(state => {
    const filtered = state.items.filter(
      item => !(item.caseId === caseId && item.type === 'sample' && item.itemType === sampleType)
    );
    
    const newSample: InventoryItem = {
      id: `sample-${Date.now()}-${Math.random()}`,
      caseId,
      type: 'sample',
      itemType: sampleType,
      displayName: formatSampleName(sampleType),
      timestamp: Date.now(),
    };
    
    return {
      ...state,
      items: [...filtered, newSample],
    };
  });
}

// Add a test result to inventory
export function addResult(
  caseId: string,
  resultType: string,
  displayName: string,
  data?: Record<string, unknown>
) {
  const newResult: InventoryItem = {
    id: `result-${Date.now()}-${Math.random()}`,
    caseId,
    type: 'result',
    itemType: resultType,
    displayName,
    timestamp: Date.now(),
    data,
  };
  
  inventory.update(state => ({
    ...state,
    items: [...state.items, newResult],
  }));
}

// Clear all inventory items for a specific case
export function clearCaseInventory(caseId: string) {
  inventory.update(state => ({
    ...state,
    items: state.items.filter(item => item.caseId !== caseId),
  }));
}

// Clear all inventory
export function clearAllInventory() {
  inventory.set(initialState);
}

// Helper to format sample names
function formatSampleName(sampleType: SampleType): string {
  const names: Record<SampleType, string> = {
    'blood': 'Blood Sample',
    'sputum': 'Sputum Sample',
    'throat-swab': 'Throat Swab',
    'stool': 'Stool Sample',
    'wound': 'Wound Swab',
    'csf': 'Cerebrospinal Fluid',
    'urine': 'Urine Sample',
    'tissue': 'Tissue Biopsy',
    'culture-plate': 'Culture Plate',
    'bacterial-isolate': 'Bacterial Isolate',
    'pcr-amplicon': 'PCR Amplicon',
    'dna-extract': 'DNA Extract',
    'rna-extract': 'RNA Extract',
    'protein-sample': 'Protein Sample',
    'gene-sequence': 'Gene Sequence',
  };
  return names[sampleType] || sampleType;
}
