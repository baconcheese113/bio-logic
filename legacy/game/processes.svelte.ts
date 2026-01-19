/**
 * Process tracking - minimal system for timed instrument steps
 * 
 * Supports multi-step workflows where:
 * - Each step can have a duration (timed) or be instant (requiresInput)
 * - Player can navigate away while timed steps run
 * - Workflow state is preserved per instrument
 */

import { gameClock } from './clock.svelte';
import { getWorkflow, getNextStep, isLastStep } from './workflows';

// ============================================================================
// Types
// ============================================================================

export interface Process {
  id: string;
  caseId: string;
  instrumentId: string;
  sampleId: string;
  workflowId: string;        // Which workflow (e.g., 'culture', 'culture-antibiotic')
  stepId: string;            // Current step in workflow
  stepName: string;          // Human-readable step name
  startedAt: number;         // Tick when current step started
  duration: number;          // Ticks to complete current step (0 = instant/manual)
  completed: boolean;        // Whether current step is done (waiting for player to advance)
}

// ============================================================================
// State
// ============================================================================

let processes = $state<Process[]>([]);
let processCounter = 0;

// ============================================================================
// Read
// ============================================================================

export const activeProcesses = {
  get all() { return processes; },
  
  /** Get process by ID */
  get(id: string): Process | undefined {
    return processes.find(p => p.id === id);
  },
  
  /** Get all processes for an instrument */
  forInstrument(instrumentId: string): Process[] {
    return processes.filter(p => p.instrumentId === instrumentId);
  },
  
  /** Get all processes for a case */
  forCase(caseId: string): Process[] {
    return processes.filter(p => p.caseId === caseId);
  },
  
  /** Get current process for an instrument (if any) */
  current(instrumentId: string): Process | undefined {
    return processes.find(p => p.instrumentId === instrumentId);
  },
};

// ============================================================================
// Write
// ============================================================================

/** Start a new workflow process */
export function startWorkflow(
  caseId: string,
  instrumentId: string,
  sampleId: string,
  workflowId?: string  // Defaults to instrumentId
): string | null {
  const wfId = workflowId || instrumentId;
  const workflow = getWorkflow(wfId);
  if (!workflow || workflow.steps.length === 0) return null;
  
  // Check if there's already a process for this instrument
  const existing = processes.find(p => p.instrumentId === instrumentId);
  if (existing) return existing.id;
  
  const firstStep = workflow.steps[0];
  const id = `proc-${++processCounter}-${Date.now()}`;
  
  processes.push({
    id,
    caseId,
    instrumentId,
    sampleId,
    workflowId: wfId,
    stepId: firstStep.id,
    stepName: firstStep.name,
    startedAt: gameClock.tick,
    duration: firstStep.duration,
    completed: firstStep.duration === 0, // Instant steps are immediately "complete" (waiting for player)
  });
  
  return id;
}

/** Start a single step process (legacy/simple mode) */
export function startProcess(
  caseId: string,
  instrumentId: string,
  sampleId: string,
  step: string,
  durationTicks: number
): string {
  const id = `proc-${++processCounter}-${Date.now()}`;
  
  processes.push({
    id,
    caseId,
    instrumentId,
    sampleId,
    workflowId: 'custom',
    stepId: step,
    stepName: step,
    startedAt: gameClock.tick,
    duration: durationTicks,
    completed: false,
  });
  
  return id;
}

/** Advance to the next step in a workflow */
export function advanceStep(id: string): boolean {
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  const process = processes[index];
  
  // Can't advance if current step isn't complete
  if (!isStepDone(id)) return false;
  
  // Check if this is the last step
  if (isLastStep(process.workflowId, process.stepId)) {
    // Workflow complete - remove process
    processes.splice(index, 1);
    return true;
  }
  
  // Get next step
  const nextStep = getNextStep(process.workflowId, process.stepId);
  if (!nextStep) {
    processes.splice(index, 1);
    return true;
  }
  
  // Update to next step
  processes[index] = {
    ...process,
    stepId: nextStep.id,
    stepName: nextStep.name,
    startedAt: gameClock.tick,
    duration: nextStep.duration,
    completed: nextStep.duration === 0,
  };
  
  return true;
}

/** Mark a step as completed (for manual steps) */
export function completeStep(id: string) {
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return;
  
  processes[index] = {
    ...processes[index],
    completed: true,
  };
}

/** Remove a process (when collected or cancelled) */
export function endProcess(id: string): boolean {
  const index = processes.findIndex(p => p.id === id);
  if (index === -1) return false;
  processes.splice(index, 1);
  return true;
}

/** Clear all processes for an instrument */
export function clearInstrument(instrumentId: string) {
  processes = processes.filter(p => p.instrumentId !== instrumentId);
}

/** Clear all processes for a case */
export function clearCase(caseId: string) {
  processes = processes.filter(p => p.caseId !== caseId);
}

/** Reset all processes */
export function resetProcesses() {
  processes = [];
  processCounter = 0;
}

// ============================================================================
// Progress Helpers
// ============================================================================

/** Get progress 0-100 for current step */
export function getProgress(id: string): number {
  const process = processes.find(p => p.id === id);
  if (!process || process.duration === 0) return 100;
  
  const elapsed = gameClock.tick - process.startedAt;
  return Math.min(100, (elapsed / process.duration) * 100);
}

/** Check if current step has finished its timer */
export function isTimerDone(id: string): boolean {
  const process = processes.find(p => p.id === id);
  if (!process) return true;
  if (process.duration === 0) return true;
  
  const elapsed = gameClock.tick - process.startedAt;
  return elapsed >= process.duration;
}

/** Check if step is done (either timer complete or manually marked complete) */
export function isStepDone(id: string): boolean {
  const process = processes.find(p => p.id === id);
  if (!process) return true;
  
  // Manual steps are done when explicitly completed
  if (process.duration === 0) return process.completed;
  
  // Timed steps are done when timer expires
  const elapsed = gameClock.tick - process.startedAt;
  return elapsed >= process.duration;
}

/** Check if a process is complete (alias for isStepDone) */
export function isComplete(id: string): boolean {
  return isStepDone(id);
}

/** Get remaining ticks for current step */
export function getRemaining(id: string): number {
  const process = processes.find(p => p.id === id);
  if (!process || process.duration === 0) return 0;
  
  const elapsed = gameClock.tick - process.startedAt;
  return Math.max(0, process.duration - elapsed);
}

/** Get elapsed ticks for current step */
export function getElapsed(id: string): number {
  const process = processes.find(p => p.id === id);
  if (!process) return 0;
  
  return gameClock.tick - process.startedAt;
}

/** Get current step info for a process */
export function getCurrentStep(id: string): { stepId: string; stepName: string; } | null {
  const process = processes.find(p => p.id === id);
  if (!process) return null;
  return { stepId: process.stepId, stepName: process.stepName };
}
