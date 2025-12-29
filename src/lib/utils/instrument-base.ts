/**
 * Base instrument utilities and composables
 * 
 * Provides reusable functions for implementing instruments following
 * the standard input/output pattern.
 */

import type {
  InstrumentInput,
  InstrumentConfiguration,
  InstrumentOutput,
  InstrumentState,
  InstrumentStage,
} from '../types/instrument';

/**
 * Create initial instrument state
 */
export function createInstrumentState<
  TConfig extends InstrumentConfiguration = InstrumentConfiguration,
  TOutput extends InstrumentOutput = InstrumentOutput
>(
  input: InstrumentInput,
  initialConfig: TConfig,
  initialOutput: TOutput
): InstrumentState {
  return {
    stage: 'setup',
    input,
    configuration: initialConfig,
    output: initialOutput,
    isProcessing: false,
    progress: 0,
  };
}

/**
 * Transition to a new stage
 */
export function transitionStage(
  currentStage: InstrumentStage,
  action: 'next' | 'reset'
): InstrumentStage {
  if (action === 'reset') {
    return 'setup';
  }

  const stageOrder: InstrumentStage[] = ['setup', 'prepare', 'process', 'observe', 'complete'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const nextIndex = Math.min(currentIndex + 1, stageOrder.length - 1);
  return stageOrder[nextIndex];
}

/**
 * Check if instrument can proceed to next stage
 */
export function canProceed(state: InstrumentState): boolean {
  switch (state.stage) {
    case 'setup':
      // Can proceed if configuration is valid
      return Object.keys(state.configuration.settings).length > 0;
    case 'prepare':
      // Can proceed if not currently processing
      return !state.isProcessing;
    case 'process':
      // Can proceed if processing is complete
      return state.progress >= 100;
    case 'observe':
      // Can proceed if observations are made
      return Object.keys(state.output.observations).length > 0;
    case 'complete':
      return false; // Already complete
    default:
      return false;
  }
}

/**
 * Get user-friendly stage name
 */
export function getStageName(stage: InstrumentStage): string {
  const names: Record<InstrumentStage, string> = {
    setup: 'Setup',
    prepare: 'Prepare Sample',
    process: 'Running',
    observe: 'Observe Results',
    complete: 'Complete',
  };
  return names[stage];
}

/**
 * Get stage description for UI
 */
export function getStageDescription(stage: InstrumentStage, instrumentName: string): string {
  const descriptions: Record<InstrumentStage, string> = {
    setup: `Configure ${instrumentName} settings`,
    prepare: 'Prepare sample for analysis',
    process: `${instrumentName} is processing...`,
    observe: 'View and interpret results',
    complete: 'Analysis complete',
  };
  return descriptions[stage];
}

/**
 * Validate instrument configuration
 */
export function validateConfiguration(config: InstrumentConfiguration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.settings || Object.keys(config.settings).length === 0) {
    errors.push('No settings configured');
  }

  if (!config.actions || config.actions.length === 0) {
    errors.push('No actions available');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a processing simulator for realistic delays
 */
export function createProcessingSimulator(
  durationMs: number,
  onProgress?: (progress: number) => void
): {
  start: () => Promise<void>;
  cancel: () => void;
} {
  let cancelled = false;
  let intervalId: number | null = null;

  const start = async () => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const updateInterval = 50; // Update every 50ms

      intervalId = window.setInterval(() => {
        if (cancelled) {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / durationMs) * 100);

        if (onProgress) {
          onProgress(progress);
        }

        if (progress >= 100) {
          if (intervalId !== null) {
            clearInterval(intervalId);
          }
          resolve();
        }
      }, updateInterval);
    });
  };

  const cancel = () => {
    cancelled = true;
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };

  return { start, cancel };
}

/**
 * Helper for creating realistic step-by-step workflows
 */
export async function executeWorkflow(
  steps: Array<{
    name: string;
    duration: number;
    action: () => void | Promise<void>;
  }>,
  onStepStart?: (stepName: string) => void,
  onStepComplete?: (stepName: string) => void
): Promise<void> {
  for (const step of steps) {
    if (onStepStart) {
      onStepStart(step.name);
    }

    await step.action();
    await sleep(step.duration);

    if (onStepComplete) {
      onStepComplete(step.name);
    }
  }
}

/**
 * Simple sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format time duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  return Math.min(100, Math.max(0, (current / total) * 100));
}

/**
 * Check if action is available in current stage
 */
export function isActionAvailable(
  action: string,
  stage: InstrumentStage,
  availableActions: Record<InstrumentStage, string[]>
): boolean {
  return availableActions[stage]?.includes(action) ?? false;
}

/**
 * Create default output structure
 */
export function createDefaultOutput(): InstrumentOutput {
  return {
    isComplete: false,
    observations: {},
    visualState: {},
    evidence: undefined,
  };
}

/**
 * Merge observations into output
 */
export function recordObservation(
  output: InstrumentOutput,
  key: string,
  value: unknown
): InstrumentOutput {
  return {
    ...output,
    observations: {
      ...output.observations,
      [key]: value,
    },
  };
}

/**
 * Mark output as complete and prepare evidence
 */
export function finalizeOutput(output: InstrumentOutput): InstrumentOutput {
  return {
    ...output,
    isComplete: true,
    evidence: { ...output.observations },
  };
}
