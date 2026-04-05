/**
 * Game Engine - Main export file
 * 
 * This module provides a clean, isolated game engine with:
 * - Game clock (tick-based time)
 * - Process tracking (timed steps for instruments)
 * - Unified inventory (samples with usage tracking + quality)
 * - Case manager (per-case observations, atomic submission)
 * - Progression system (reputation, funds, tech tree)
 * - Game data (cases, organisms)
 * 
 * The UI components in src/lib/ handle all visual/interaction logic.
 * This engine just tracks state and time.
 */

// Types
export * from './types';

// Observations (structured field definitions)
export * from './observations';

// Game data (cases, organisms)
export * from './data';

// Clock
export { 
  gameClock, 
  pause, 
  resume, 
  setSpeed, 
  resetClock,
  ticksToDisplay,
  getProgress,
  isComplete,
  getRemaining
} from './clock.svelte';

// Instruments
export {
  INSTRUMENT_CONFIGS,
  allInstruments,
  createInstrument,
  removeInstrument,
  loadInstrument,
  startProcessing,
  updateInstrumentStatus,
  getInstrumentProgress,
  collectResults,
  unloadInstrument,
  setInstrumentOutput,
  getInstrumentsForEra,
  resetAllInstruments
} from './instruments.svelte';

// Inventory
export {
  inventory,
  collectPatientSample,
  createDerivedSample,
  markInUse,
  markNotInUse,
  isInUse,
  getUsageLocations,
  updateItemData,
  clearCaseInventory,
  removeItem,
  resetInventory,
  getSampleDisplayName,
  degradeQuality,
  updateAllQualities,
  getQualityColor,
  getQualityLabel
} from './inventory.svelte';

// Cases
export {
  cases,
  getCaseDefinition,
  getCasesForEra,
  acceptCase,
  abandonCase,
  recordObservation,
  getObservations,
  getObservation,
  recordSampleTaken,
  getTotalSampleCost,
  submitCase,
  resetCases
} from './cases.svelte';

// Progression
export {
  TECH_TREE,
  progression,
  adjustFunds,
  adjustReputation,
  paySampleCost,
  purchaseInstrument,
  applyCaseResult,
  applyLawsuit,
  setEra,
  resetProgression,
  getPlayerStats
} from './progression.svelte';

// Process tracking (timed operations with multi-step workflows)
export {
  type Process,
  activeProcesses,
  startWorkflow,
  startProcess,
  advanceStep,
  completeStep,
  endProcess,
  clearInstrument,
  clearCase,
  resetProcesses,
  getProgress as getProcessProgress,
  isComplete as isProcessComplete,
  isTimerDone,
  isStepDone,
  getRemaining as getProcessRemaining,
  getElapsed as getProcessElapsed,
  getCurrentStep
} from './processes.svelte';

// Workflow definitions
export {
  type WorkflowStep,
  type Workflow,
  WORKFLOWS,
  getWorkflow,
  getStep,
  getNextStep,
  isLastStep
} from './workflows';

// ============================================================================
// Full Game Reset
// ============================================================================

import { resetClock } from './clock.svelte';
import { resetAllInstruments } from './instruments.svelte';
import { resetInventory } from './inventory.svelte';
import { resetCases } from './cases.svelte';
import { resetProgression } from './progression.svelte';
import { resetProcesses } from './processes.svelte';

/** Reset entire game state */
export function resetGame() {
  resetClock();
  resetProcesses();
  resetAllInstruments();
  resetInventory();
  resetCases();
  resetProgression();
}
