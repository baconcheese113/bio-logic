import { writable, derived, get } from 'svelte/store';
import type { SampleType } from '../../data/organisms';

export type InventoryItemType = 'sample' | 'result';

// Process status for long-running tests (incubation, thermocycling, etc.)
export interface ProcessStatus {
  instrument: string; // e.g., 'culture', 'pcr'
  processName: string; // e.g., 'Incubating', 'Thermocycling'
  progress: number; // 0-100
  timeRemaining?: string; // e.g., '2h 30m'
  startTime: number;
}

export interface InventoryItem {
  id: string;
  caseId: string;
  type: InventoryItemType;
  itemType: string; // e.g., 'blood', 'gram-stain', 'pcr-result'
  displayName: string;
  timestamp: number;
  activeProcesses?: ProcessStatus[]; // For samples: tracks active long-running processes
  data?: Record<string, unknown>; // Additional metadata
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
export function addSample(caseId: string, sampleType: SampleType) {
  const currentInventory = get(inventory);
  
  // Check if sample of this type already exists for this case
  const existingSample = currentInventory.items.find(
    item => item.caseId === caseId && item.type === 'sample' && item.itemType === sampleType
  );
  
  if (existingSample) {
    // Return false to indicate we need user confirmation
    return false;
  }
  
  const newSample: InventoryItem = {
    id: `sample-${Date.now()}-${Math.random()}`,
    caseId,
    type: 'sample',
    itemType: sampleType,
    displayName: formatSampleName(sampleType),
    timestamp: Date.now(),
    activeProcesses: [],
  };
  
  inventory.update(state => ({
    ...state,
    items: [...state.items, newSample],
  }));
  
  return true;
}

// Start a process for a sample (e.g., incubation, thermocycling)
export function startProcess(
  sampleId: string,
  instrument: string,
  processName: string,
  durationMs?: number
) {
  const process: ProcessStatus = {
    instrument,
    processName,
    progress: 0,
    startTime: Date.now(),
  };
  
  if (durationMs) {
    process.timeRemaining = formatDuration(durationMs);
  }
  
  inventory.update(state => ({
    ...state,
    items: state.items.map(item =>
      item.id === sampleId
        ? {
            ...item,
            activeProcesses: [...(item.activeProcesses || []), process],
          }
        : item
    ),
  }));
}

// Update process progress
export function updateProcessProgress(
  sampleId: string,
  instrument: string,
  progress: number
) {
  inventory.update(state => ({
    ...state,
    items: state.items.map(item =>
      item.id === sampleId && item.activeProcesses
        ? {
            ...item,
            activeProcesses: item.activeProcesses.map(p =>
              p.instrument === instrument ? { ...p, progress } : p
            ),
          }
        : item
    ),
  }));
}

// Complete a process for a sample
export function completeProcess(sampleId: string, instrument: string) {
  inventory.update(state => ({
    ...state,
    items: state.items.map(item =>
      item.id === sampleId && item.activeProcesses
        ? {
            ...item,
            activeProcesses: item.activeProcesses.filter(p => p.instrument !== instrument),
          }
        : item
    ),
  }));
}

// Get samples for a case (all samples are always available for use)
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
      activeProcesses: [],
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
  };
  return names[sampleType] || sampleType;
}

// Helper to format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
