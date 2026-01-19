import { writable, derived, get } from 'svelte/store';

// A running process on an instrument
export interface ActiveProcess {
  id: string;
  caseId: string;
  instrumentType: string;
  sampleId: string;
  processName: string;
  startTime: number;
  duration: number; // ms
}

interface TimerState {
  processes: ActiveProcess[];
}

const initialState: TimerState = {
  processes: [],
};

export const timerState = writable<TimerState>(initialState);

// Start a background process
export function startBackgroundProcess(
  caseId: string,
  instrumentType: string,
  sampleId: string,
  processName: string,
  durationMs: number
): string {
  const id = `process-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const process: ActiveProcess = {
    id,
    caseId,
    instrumentType,
    sampleId,
    processName,
    startTime: Date.now(),
    duration: durationMs,
  };
  
  timerState.update(state => ({
    ...state,
    processes: [...state.processes, process],
  }));
  
  return id;
}

// Complete and remove a process
export function completeProcess(processId: string) {
  timerState.update(state => ({
    ...state,
    processes: state.processes.filter(p => p.id !== processId),
  }));
}

// Cancel a process
export function cancelProcess(processId: string) {
  completeProcess(processId); // Same as complete - just removes it
}

// Get process progress (0-100)
export function getProcessProgress(process: ActiveProcess): number {
  const elapsed = Date.now() - process.startTime;
  return Math.min(100, Math.floor((elapsed / process.duration) * 100));
}

// Check if process is complete
export function isProcessComplete(process: ActiveProcess): boolean {
  return Date.now() >= process.startTime + process.duration;
}

// Get time remaining in human-readable format
export function getTimeRemaining(process: ActiveProcess): string {
  const remaining = Math.max(0, (process.startTime + process.duration) - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Derived: Get all processes for a specific case
export const getProcessesForCase = (caseId: string) => derived(
  timerState,
  ($state) => $state.processes.filter(p => p.caseId === caseId)
);

// Derived: Get all processes for a specific instrument
export const getProcessesForInstrument = (instrumentType: string) => derived(
  timerState,
  ($state) => $state.processes.filter(p => p.instrumentType === instrumentType)
);

// Derived: Check if any instrument has an active process
export const busyInstruments = derived(
  timerState,
  ($state) => {
    const busy = new Set<string>();
    for (const process of $state.processes) {
      busy.add(process.instrumentType);
    }
    return busy;
  }
);

// Get a single process by instrument type (since we have 1 instance per instrument for now)
export function getInstrumentProcess(instrumentType: string): ActiveProcess | undefined {
  const state = get(timerState);
  return state.processes.find(p => p.instrumentType === instrumentType);
}

// Clear all processes (e.g., when resetting game)
export function clearAllProcesses() {
  timerState.set(initialState);
}
