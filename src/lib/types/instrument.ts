/**
 * Standard Instrument Interface
 * 
 * This defines the standard structure for all instruments in the game.
 * Each instrument should have clear inputs, processing steps, and outputs.
 */

import type { SampleType } from '../../data/organisms';

/**
 * Base configuration that all instruments receive
 */
export interface InstrumentInput {
  /** The type of sample being analyzed */
  sampleType: SampleType;
  
  /** The current case ID for context */
  caseId: string;
  
  /** Whether this is the correct sample for the case */
  isCorrectSample: boolean;
}

/**
 * User configuration specific to each instrument
 */
export interface InstrumentConfiguration {
  /** Instrument-specific settings (e.g., stain type, voltage, temperature) */
  settings: Record<string, unknown>;
  
  /** User-triggered actions (e.g., "run", "stain", "read") */
  actions: string[];
}

/**
 * Observable results from the instrument
 */
export interface InstrumentOutput {
  /** Whether the instrument has completed its process */
  isComplete: boolean;
  
  /** Raw data that can be observed */
  observations: Record<string, unknown>;
  
  /** Visual state for rendering */
  visualState: Record<string, unknown>;
  
  /** Evidence that can be recorded for diagnosis */
  evidence?: Record<string, unknown>;
}

/**
 * Workflow stages that instruments go through
 */
export type InstrumentStage = 
  | 'setup'        // Initial configuration
  | 'prepare'      // Sample preparation
  | 'process'      // Main processing (running)
  | 'observe'      // Viewing results
  | 'complete';    // Finished

/**
 * Standard instrument state machine
 */
export interface InstrumentState {
  /** Current workflow stage */
  stage: InstrumentStage;
  
  /** Input configuration */
  input: InstrumentInput;
  
  /** User configuration */
  configuration: InstrumentConfiguration;
  
  /** Observable output */
  output: InstrumentOutput;
  
  /** Processing state (for animations, timers, etc.) */
  isProcessing: boolean;
  
  /** Progress through current stage (0-100) */
  progress: number;
}

/**
 * Instrument definition for the catalog
 */
export interface InstrumentDefinition {
  /** Unique instrument ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Brief description */
  description: string;
  
  /** Historical era when invented */
  era: '1920s' | '1950s' | '1980s' | '2000s' | '2020s';
  
  /** What samples this instrument can process */
  compatibleSamples: SampleType[];
  
  /** What questions this instrument answers */
  capabilities: string[];
  
  /** Available configuration options */
  configurationOptions: Record<string, unknown>;
}

/**
 * Standard actions available to instruments
 */
export interface InstrumentActions {
  /** Initialize the instrument with a sample */
  initialize: (input: InstrumentInput) => void;
  
  /** Configure instrument settings */
  configure: (config: Partial<InstrumentConfiguration>) => void;
  
  /** Start processing */
  run: () => void;
  
  /** Apply additional processing (e.g., staining) */
  process: (action: string, params?: unknown) => void;
  
  /** Record observations as evidence */
  recordEvidence: (observations: Record<string, unknown>) => void;
  
  /** Reset instrument for new sample */
  reset: () => void;
}

/**
 * Example: Gel Electrophoresis specific types
 */
export interface ElectrophoresisConfiguration extends InstrumentConfiguration {
  settings: {
    voltage: number;
    runTime: number;
    bufferType: 'tris-glycine' | 'tris-acetate';
  };
  actions: ('load' | 'run' | 'stain' | 'visualize')[];
}

export interface ElectrophoresisOutput extends InstrumentOutput {
  observations: {
    bandPattern: 'normal' | 'm-spike' | 'beta-gamma-bridge' | 'low-albumin' | 'polyclonal-gammopathy';
    albuminLevel: 'low' | 'normal' | 'high';
    globulinLevel: 'low' | 'normal' | 'high';
    densitometerData?: {
      albumin: number;
      alpha1: number;
      alpha2: number;
      beta: number;
      gamma: number;
    };
  };
  visualState: {
    bandsVisible: boolean;
    isStained: boolean;
    migrationComplete: boolean;
  };
}

/**
 * Example: PCR specific types
 */
export interface PCRConfiguration extends InstrumentConfiguration {
  settings: {
    targetGene: string;
    primerDesign: {
      forwardStart: number;
      forwardLength: number;
      reverseStart: number;
      reverseLength: number;
    };
    cycles: number;
    annealingTemp: number;
  };
  actions: ('design-primers' | 'run-pcr' | 'load-gel' | 'run-gel' | 'visualize')[];
}

export interface PCROutput extends InstrumentOutput {
  observations: {
    amplificationSuccess: boolean;
    bandSize: number | null;
    bandIntensity: 'none' | 'weak' | 'moderate' | 'strong';
    primerQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'fail';
  };
  visualState: {
    pcrComplete: boolean;
    gelRunComplete: boolean;
    bandVisible: boolean;
  };
}

/**
 * Example: Microscope specific types
 */
export interface MicroscopeConfiguration extends InstrumentConfiguration {
  settings: {
    stainType: 'none' | 'gram' | 'acid-fast' | 'capsule' | 'spore';
    magnification: 100 | 400 | 1000;
    focusDepth: number;
  };
  actions: ('apply-stain' | 'adjust-focus' | 'change-magnification')[];
}

export interface MicroscopeOutput extends InstrumentOutput {
  observations: {
    cellShape: 'cocci' | 'bacilli' | 'spirochete' | 'diplococci' | 'coccobacilli' | null;
    arrangement: 'chains' | 'clusters' | 'pairs' | 'single' | 'palisades' | null;
    gramStain: 'positive' | 'negative' | 'variable' | null;
    acidFast: boolean | null;
    capsule: boolean | null;
    spores: boolean | null;
  };
  visualState: {
    isStained: boolean;
    isFocused: boolean;
    cellsVisible: boolean;
  };
}
