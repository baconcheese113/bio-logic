import { get, derived } from 'svelte/store';
import { instrumentState, loadSampleIntoInstrument, clearSampleFromInstrument, type InstrumentType } from './instrument-state';
import { inventory, type InventoryItem } from './inventory';
import { isSampleCompatible } from './sample-compatibility';
import { getInstrumentProcess, isProcessComplete, getProcessProgress } from './timer-service';

/**
 * Creates derived stores and helper functions for an instrument
 * Use this to reduce boilerplate in instrument views
 */
export function createInstrumentHelpers(instrumentType: InstrumentType) {
  // Derived store: check if a sample is loaded
  const hasSampleLoaded = derived(instrumentState, ($state) => !!$state.activeSamples[instrumentType]);
  
  // Derived store: get the loaded sample ID
  const loadedSampleId = derived(instrumentState, ($state) => $state.activeSamples[instrumentType]);
  
  // Derived store: get the full loaded sample from inventory
  const loadedSample = derived(
    [instrumentState, inventory],
    ([$state, $inv]) => {
      const id = $state.activeSamples[instrumentType];
      if (!id) return null;
      return $inv.items.find((item) => item.id === id) ?? null;
    }
  );
  
  // Derived store: check if instrument is busy (has active process)
  const instrumentProcess = derived(
    [instrumentState],
    () => getInstrumentProcess(instrumentType)
  );
  
  const isBusy = derived(instrumentProcess, ($process) => 
    $process ? !isProcessComplete($process) : false
  );
  
  const processProgress = derived(instrumentProcess, ($process) => 
    $process ? getProcessProgress($process) : 0
  );

  // Load a sample into the instrument
  function loadSample(sampleId: string): boolean {
    const sample = get(inventory).items.find(item => item.id === sampleId);
    if (!sample) return false;
    
    if (!isSampleCompatible(sample.itemType, instrumentType)) {
      console.warn(`Sample type ${sample.itemType} not compatible with ${instrumentType}`);
      return false;
    }
    
    loadSampleIntoInstrument(instrumentType, sampleId);
    return true;
  }

  // Clear the current sample
  function clearSample() {
    clearSampleFromInstrument(instrumentType);
  }

  // Try to load a pending sample (for stage click handlers)
  function tryLoadPendingSample(pendingSample: InventoryItem | null): boolean {
    if (!pendingSample) return false;
    return loadSample(pendingSample.id);
  }

  return {
    // Stores
    hasSampleLoaded,
    loadedSampleId,
    loadedSample,
    instrumentProcess,
    isBusy,
    processProgress,
    // Functions
    loadSample,
    clearSample,
    tryLoadPendingSample,
  };
}

// Type for the return value
export type InstrumentHelpers = ReturnType<typeof createInstrumentHelpers>;
