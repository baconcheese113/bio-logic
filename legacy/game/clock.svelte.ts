/**
 * Game clock - drives all time-based mechanics
 * Uses Svelte 5 runes for reactivity
 */

const TICK_INTERVAL_MS = 100; // 10 ticks per second at 1x speed

interface ClockState {
  tick: number;
  speed: number; // 0 = paused, 1 = normal, 2 = 2x, etc.
  lastRealTime: number;
}

// Single source of truth for game time
let clockState = $state<ClockState>({
  tick: 0,
  speed: 1,
  lastRealTime: 0,
});

let intervalId: ReturnType<typeof setInterval> | null = null;

function startClock() {
  if (intervalId !== null) return;
  
  clockState.lastRealTime = Date.now();
  
  intervalId = setInterval(() => {
    if (clockState.speed > 0) {
      clockState.tick += clockState.speed;
    }
  }, TICK_INTERVAL_MS);
}

function stopClock() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const gameClock = {
  get tick() { return clockState.tick; },
  get speed() { return clockState.speed; },
  get isPaused() { return clockState.speed === 0; },
};

export function pause() {
  clockState.speed = 0;
}

export function resume(speed = 1) {
  clockState.speed = Math.max(0, speed);
}

export function setSpeed(speed: number) {
  clockState.speed = Math.max(0, speed);
}

export function resetClock() {
  clockState.tick = 0;
  clockState.speed = 1;
}

// Initialize clock on module load
startClock();

// Cleanup helper (for testing or hot reload)
export function destroyClock() {
  stopClock();
}

// ============================================================================
// Utility functions for tick-based timing
// ============================================================================

/** Convert ticks to human-readable time (assuming 10 ticks/sec) */
export function ticksToDisplay(ticks: number): string {
  const totalSeconds = Math.ceil(ticks / 10);
  
  if (totalSeconds < 60) return `${totalSeconds}s`;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/** Calculate progress 0-100 given start tick and duration */
export function getProgress(startTick: number, durationTicks: number): number {
  const elapsed = gameClock.tick - startTick;
  return Math.min(100, Math.max(0, (elapsed / durationTicks) * 100));
}

/** Check if a process that started at startTick with duration is complete */
export function isComplete(startTick: number, durationTicks: number): boolean {
  return gameClock.tick >= startTick + durationTicks;
}

/** Get remaining ticks for a process */
export function getRemaining(startTick: number, durationTicks: number): number {
  return Math.max(0, (startTick + durationTicks) - gameClock.tick);
}
