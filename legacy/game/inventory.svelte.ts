/**
 * Unified inventory system - single source of truth for all samples and results
 * Samples can be used in multiple instruments simultaneously via usedInInstruments tracking
 */

import { gameClock } from './clock.svelte';
import type { 
  InventoryItem, 
  SampleType, 
  PatientSampleType,
  SampleQuality 
} from './types';

// ============================================================================
// State
// ============================================================================

let items = $state<InventoryItem[]>([]);
let itemCounter = 0;

function generateId(): string {
  return `item-${++itemCounter}-${Date.now()}`;
}

// ============================================================================
// Derived Views (using getters for reactivity)
// ============================================================================

export const inventory = {
  get all() { return items; },
  
  /** Get all items for a specific case */
  forCase(caseId: string): InventoryItem[] {
    return items.filter(item => item.caseId === caseId);
  },
  
  /** Get all items of a specific type */
  ofType(type: SampleType): InventoryItem[] {
    return items.filter(item => item.type === type);
  },
  
  /** Get item by ID */
  getById(id: string): InventoryItem | undefined {
    return items.find(item => item.id === id);
  },
  
  /** Get items currently loaded in any instrument */
  inUse(): InventoryItem[] {
    return items.filter(item => item.usedInInstruments.length > 0);
  },
  
  /** Get items available (not currently in an instrument) for a case */
  availableForCase(caseId: string): InventoryItem[] {
    return items.filter(
      item => item.caseId === caseId && item.usedInInstruments.length === 0
    );
  },
  
  /** Check if a sample type exists for a case */
  hasSampleType(caseId: string, type: SampleType): boolean {
    return items.some(item => item.caseId === caseId && item.type === type);
  },
  
  /** Group items by case */
  get byCase(): Map<string, InventoryItem[]> {
    const grouped = new Map<string, InventoryItem[]>();
    for (const item of items) {
      const existing = grouped.get(item.caseId) ?? [];
      existing.push(item);
      grouped.set(item.caseId, existing);
    }
    return grouped;
  },
};

// ============================================================================
// Sample Collection (from patient)
// ============================================================================

/** 
 * Collect a patient sample - costs funds
 * Returns the new item ID or null if already have unlimited of this type
 */
export function collectPatientSample(
  caseId: string, 
  type: PatientSampleType,
  quality: SampleQuality = 'fresh',
  biologicalData?: Record<string, unknown>
): InventoryItem {
  const newItem: InventoryItem = {
    id: generateId(),
    caseId,
    type,
    quality,
    sourceInstrumentId: null,
    createdAtTick: gameClock.tick,
    usedInInstruments: [],
    data: biologicalData ?? {},
  };
  
  items.push(newItem);
  return newItem;
}

// ============================================================================
// Derived Sample Creation (from instruments)
// ============================================================================

/** Create a derived sample from instrument output */
export function createDerivedSample(
  caseId: string,
  type: SampleType,
  sourceInstrumentId: string,
  quality: SampleQuality = 'fresh',
  data: Record<string, unknown> = {}
): InventoryItem {
  const newItem: InventoryItem = {
    id: generateId(),
    caseId,
    type,
    quality,
    sourceInstrumentId,
    createdAtTick: gameClock.tick,
    usedInInstruments: [],
    data,
  };
  
  items.push(newItem);
  return newItem;
}

// ============================================================================
// Instrument Usage Tracking
// ============================================================================

/** Mark a sample as being used in an instrument */
export function markInUse(itemId: string, instrumentId: string): boolean {
  const item = items.find(i => i.id === itemId);
  if (!item) return false;
  
  if (!item.usedInInstruments.includes(instrumentId)) {
    item.usedInInstruments.push(instrumentId);
  }
  return true;
}

/** Remove instrument from sample's usage list */
export function markNotInUse(itemId: string, instrumentId: string): boolean {
  const item = items.find(i => i.id === itemId);
  if (!item) return false;
  
  const index = item.usedInInstruments.indexOf(instrumentId);
  if (index !== -1) {
    item.usedInInstruments.splice(index, 1);
  }
  return true;
}

/** Check if a sample is currently in use */
export function isInUse(itemId: string): boolean {
  const item = items.find(i => i.id === itemId);
  return item ? item.usedInInstruments.length > 0 : false;
}

/** Get which instruments are using a sample */
export function getUsageLocations(itemId: string): string[] {
  const item = items.find(i => i.id === itemId);
  return item?.usedInInstruments ?? [];
}

// ============================================================================
// Data Updates
// ============================================================================

/** Update the data attached to an inventory item */
export function updateItemData(
  itemId: string, 
  data: Record<string, unknown>
): boolean {
  const item = items.find(i => i.id === itemId);
  if (!item) return false;
  
  item.data = { ...item.data, ...data };
  return true;
}

// ============================================================================
// Cleanup
// ============================================================================

/** Remove all items for a case */
export function clearCaseInventory(caseId: string) {
  items = items.filter(item => item.caseId !== caseId);
}

/** Remove a specific item */
export function removeItem(itemId: string): boolean {
  const index = items.findIndex(i => i.id === itemId);
  if (index === -1) return false;
  
  // Don't remove if in use
  if (items[index].usedInInstruments.length > 0) return false;
  
  items.splice(index, 1);
  return true;
}

/** Reset entire inventory (new game) */
export function resetInventory() {
  items = [];
  itemCounter = 0;
}

// ============================================================================
// Sample Quality Management
// ============================================================================

import { SAMPLE_QUALITY_EFFECTS } from './types';

const QUALITY_ORDER: SampleQuality[] = ['fresh', 'fair', 'poor', 'spoiled'];

/** Degrade sample quality based on time elapsed */
export function degradeQuality(item: InventoryItem, elapsedTicks: number): SampleQuality {
  const effects = SAMPLE_QUALITY_EFFECTS[item.quality];
  const degradation = effects.degradationRate * (elapsedTicks / 100);
  
  // Calculate cumulative degradation (simplified: each full 1.0 = one quality level down)
  const currentIndex = QUALITY_ORDER.indexOf(item.quality);
  const stepsDown = Math.floor(degradation);
  const newIndex = Math.min(currentIndex + stepsDown, QUALITY_ORDER.length - 1);
  
  return QUALITY_ORDER[newIndex];
}

/** Update all sample qualities based on current tick */
export function updateAllQualities() {
  for (const item of items) {
    const elapsedTicks = gameClock.tick - item.createdAtTick;
    const newQuality = degradeQuality(item, elapsedTicks);
    if (newQuality !== item.quality) {
      item.quality = newQuality;
    }
  }
}

/** Get display color for quality */
export function getQualityColor(quality: SampleQuality): string {
  switch (quality) {
    case 'fresh': return '#4a9f4a'; // Green
    case 'fair': return '#9f9f4a'; // Yellow
    case 'poor': return '#9f6a4a'; // Orange
    case 'spoiled': return '#9f4a4a'; // Red
  }
}

/** Get display label for quality */
export function getQualityLabel(quality: SampleQuality): string {
  return quality.charAt(0).toUpperCase() + quality.slice(1);
}

// ============================================================================
// Display Helpers
// ============================================================================

const SAMPLE_NAMES: Record<SampleType, string> = {
  // Patient samples
  'blood': 'Blood Sample',
  'sputum': 'Sputum Sample',
  'throat-swab': 'Throat Swab',
  'stool': 'Stool Sample',
  'wound-swab': 'Wound Swab',
  'csf': 'Cerebrospinal Fluid',
  'urine': 'Urine Sample',
  'tissue': 'Tissue Biopsy',
  // Derived samples
  'culture-isolate': 'Culture Isolate',
  'gram-slide': 'Gram Stain Slide',
  'pcr-amplicon': 'PCR Amplicon',
  'dna-extract': 'DNA Extract',
  'protein-extract': 'Protein Extract',
  'sequence-data': 'Sequence Data',
};

export function getSampleDisplayName(type: SampleType): string {
  return SAMPLE_NAMES[type] ?? type;
}
