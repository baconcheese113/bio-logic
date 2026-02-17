/**
 * Bunsen burner interaction behavior.
 * Hover the inoculation loop over the flame for ~800ms to sterilize it.
 */

const STERILIZE_HOLD_MS = 800;

export interface BurnerState {
  isOver: boolean;
  holdMs: number;
}

export function createBurnerState(): BurnerState {
  return { isOver: false, holdMs: 0 };
}

export function enterFlame(state: BurnerState): BurnerState {
  return { isOver: true, holdMs: 0 };
}

export function leaveFlame(_state: BurnerState): BurnerState {
  return { isOver: false, holdMs: 0 };
}

/**
 * Tick the flame hold timer (called each RAF frame).
 * Returns updated state + whether sterilization completed this tick.
 * @param dtMs  milliseconds since last tick
 */
export function tickFlame(
  state: BurnerState,
  dtMs: number,
): { state: BurnerState; sterilized: boolean } {
  if (!state.isOver) return { state, sterilized: false };

  const newMs = state.holdMs + dtMs;
  if (newMs >= STERILIZE_HOLD_MS) {
    return { state: { isOver: false, holdMs: 0 }, sterilized: true };
  }
  return { state: { ...state, holdMs: newMs }, sterilized: false };
}

/** Progress fraction (0-1) for the flame hold indicator */
export function flameProgress(state: BurnerState): number {
  return Math.min(1, state.holdMs / STERILIZE_HOLD_MS);
}
