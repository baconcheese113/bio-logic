/**
 * Instrument factory - creates isolated, reactive instrument instances
 * Each instrument is a state machine: idle → loading → processing → complete
 */

import { gameClock, getProgress, isComplete } from './clock.svelte';
import type { 
  InstrumentType, 
  InstrumentInstance, 
  InstrumentStatus,
  InstrumentConfig,
  InstrumentOutput,
  Era 
} from './types';

// ============================================================================
// Instrument Configuration Data
// ============================================================================

export const INSTRUMENT_CONFIGS: Record<InstrumentType, InstrumentConfig> = {
  'microscope': {
    type: 'microscope',
    name: 'Light Microscope',
    era: 'classical',
    processingTicks: 0, // Instant - manual observation
    cost: 0, // Starter equipment
    accepts: ['blood', 'sputum', 'csf', 'urine', 'gram-slide'],
    produces: ['gram-slide'],
  },
  'culture-plate': {
    type: 'culture-plate',
    name: 'Culture Plate',
    era: 'classical',
    processingTicks: 1800, // 3 minutes at 1x = 18-24 hour incubation
    cost: 10,
    accepts: ['blood', 'sputum', 'throat-swab', 'stool', 'wound-swab', 'csf', 'urine'],
    produces: ['culture-isolate'],
  },
  'biochemical-panel': {
    type: 'biochemical-panel',
    name: 'Biochemical Test Panel',
    era: 'golden-age',
    processingTicks: 300, // 30 seconds
    cost: 50,
    accepts: ['culture-isolate'],
    produces: [],
  },
  'serology-slide': {
    type: 'serology-slide',
    name: 'Serology Slide',
    era: 'golden-age',
    processingTicks: 100, // 10 seconds
    cost: 30,
    accepts: ['blood'],
    produces: [],
  },
  'electrophoresis': {
    type: 'electrophoresis',
    name: 'Gel Electrophoresis',
    era: 'molecular',
    processingTicks: 600, // 1 minute
    cost: 200,
    accepts: ['protein-extract', 'dna-extract'],
    produces: [],
  },
  'pcr-thermocycler': {
    type: 'pcr-thermocycler',
    name: 'PCR Thermocycler',
    era: 'molecular',
    processingTicks: 900, // 1.5 minutes = ~2 hour real PCR
    cost: 500,
    accepts: ['dna-extract', 'blood', 'tissue'],
    produces: ['pcr-amplicon'],
  },
  'gel-imager': {
    type: 'gel-imager',
    name: 'Gel Imaging System',
    era: 'molecular',
    processingTicks: 50, // 5 seconds
    cost: 150,
    accepts: ['pcr-amplicon'],
    produces: [],
  },
  'sanger-sequencer': {
    type: 'sanger-sequencer',
    name: 'Sanger Sequencer',
    era: 'genomic',
    processingTicks: 1200, // 2 minutes
    cost: 1000,
    accepts: ['pcr-amplicon', 'dna-extract'],
    produces: ['sequence-data'],
  },
  'elisa-reader': {
    type: 'elisa-reader',
    name: 'ELISA Plate Reader',
    era: 'molecular',
    processingTicks: 600, // 1 minute
    cost: 400,
    accepts: ['blood'],
    produces: [],
  },
  'flow-cytometer': {
    type: 'flow-cytometer',
    name: 'Flow Cytometer',
    era: 'modern',
    processingTicks: 300, // 30 seconds
    cost: 2000,
    accepts: ['blood', 'tissue'],
    produces: [],
  },
};

// ============================================================================
// Instrument State Management
// ============================================================================

let instrumentCounter = 0;

function generateId(type: InstrumentType): string {
  return `${type}-${++instrumentCounter}`;
}

// All instrument instances (reactive)
let instruments = $state<InstrumentInstance[]>([]);

// ============================================================================
// Public API
// ============================================================================

export const allInstruments = {
  get list() { return instruments; },
  
  getById(id: string): InstrumentInstance | undefined {
    return instruments.find(i => i.id === id);
  },
  
  getByType(type: InstrumentType): InstrumentInstance[] {
    return instruments.filter(i => i.type === type);
  },
  
  getAvailable(type: InstrumentType): InstrumentInstance | undefined {
    return instruments.find(i => i.type === type && i.status === 'idle');
  },
};

/** Create a new instrument instance */
export function createInstrument(type: InstrumentType): InstrumentInstance {
  const instance: InstrumentInstance = {
    id: generateId(type),
    type,
    status: 'idle',
    loadedItemId: null,
    startTick: null,
    output: null,
  };
  
  instruments.push(instance);
  return instance;
}

/** Remove an instrument instance */
export function removeInstrument(id: string): boolean {
  const index = instruments.findIndex(i => i.id === id);
  if (index === -1) return false;
  
  const instrument = instruments[index];
  if (instrument.status === 'processing') {
    return false; // Can't remove while processing
  }
  
  instruments.splice(index, 1);
  return true;
}

/** Load a sample into an instrument */
export function loadInstrument(instrumentId: string, itemId: string): boolean {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return false;
  if (instrument.status !== 'idle') return false;
  
  instrument.loadedItemId = itemId;
  instrument.status = 'loading';
  return true;
}

/** Start processing on an instrument */
export function startProcessing(instrumentId: string): boolean {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return false;
  if (instrument.status !== 'loading') return false;
  if (!instrument.loadedItemId) return false;
  
  instrument.status = 'processing';
  instrument.startTick = gameClock.tick;
  return true;
}

/** Check and update instrument status based on game clock */
export function updateInstrumentStatus(instrumentId: string): InstrumentStatus {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return 'error';
  
  if (instrument.status === 'processing' && instrument.startTick !== null) {
    const config = INSTRUMENT_CONFIGS[instrument.type];
    if (isComplete(instrument.startTick, config.processingTicks)) {
      instrument.status = 'complete';
    }
  }
  
  return instrument.status;
}

/** Get processing progress for an instrument (0-100) */
export function getInstrumentProgress(instrumentId: string): number {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument || instrument.startTick === null) return 0;
  
  const config = INSTRUMENT_CONFIGS[instrument.type];
  if (config.processingTicks === 0) return 100;
  
  return getProgress(instrument.startTick, config.processingTicks);
}

/** Collect results and reset instrument to idle */
export function collectResults(instrumentId: string): InstrumentOutput | null {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return null;
  if (instrument.status !== 'complete') return null;
  
  const output = instrument.output;
  
  // Reset instrument
  instrument.status = 'idle';
  instrument.loadedItemId = null;
  instrument.startTick = null;
  instrument.output = null;
  
  return output;
}

/** Unload without processing (cancel) */
export function unloadInstrument(instrumentId: string): string | null {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return null;
  if (instrument.status === 'processing') return null; // Can't cancel mid-process
  
  const itemId = instrument.loadedItemId;
  
  instrument.status = 'idle';
  instrument.loadedItemId = null;
  instrument.startTick = null;
  instrument.output = null;
  
  return itemId;
}

/** Set output data for an instrument (called by instrument-specific logic) */
export function setInstrumentOutput(instrumentId: string, output: InstrumentOutput): boolean {
  const instrument = instruments.find(i => i.id === instrumentId);
  if (!instrument) return false;
  
  instrument.output = output;
  return true;
}

/** Get instruments available in a given era */
export function getInstrumentsForEra(era: Era): InstrumentConfig[] {
  const eraOrder: Record<Era, number> = {
    'classical': 0,
    'golden-age': 1,
    'molecular': 2,
    'genomic': 3,
    'modern': 4,
  };
  
  const currentOrder = eraOrder[era];
  
  return Object.values(INSTRUMENT_CONFIGS).filter(
    config => eraOrder[config.era] <= currentOrder
  );
}

/** Reset all instruments (for new game) */
export function resetAllInstruments() {
  instruments = [];
  instrumentCounter = 0;
}
