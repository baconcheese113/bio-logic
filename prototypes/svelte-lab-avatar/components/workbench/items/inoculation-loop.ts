/**
 * Inoculation loop tool behavior.
 * State: dirty → sterile (flame) → loaded (sample pickup) → depositing (streak).
 * Temperature decays after flaming; kills bacteria while hot.
 */

import { SIM } from '../culture/streak-types';

export type LoopStatus = 'dirty' | 'sterile' | 'cooling' | 'loaded';

export interface LoopState {
  inoculumLevel: number;   // 0-1 bacteria load
  temperature: number;     // 0-1 (1 = just flamed)
  isSterile: boolean;
}

export function createLoopState(): LoopState {
  return { inoculumLevel: 0, temperature: 0, isSterile: false };
}

/** Sterilize the loop (called when flame hold completes) */
export function sterilizeLoop(_state: LoopState): LoopState {
  return { inoculumLevel: 0, temperature: 1.0, isSterile: true };
}

/** Pick up inoculum from a sample. Returns null if conditions not met. */
export function pickupInoculum(state: LoopState): LoopState | null {
  if (!canPickup(state)) return null;
  return { ...state, inoculumLevel: 1.0, isSterile: false };
}

/** Display status of the loop */
export function loopStatus(state: LoopState): LoopStatus {
  if (state.inoculumLevel > 0) return 'loaded';
  if (state.temperature > SIM.KILL_THRESHOLD) return 'cooling';
  if (state.isSterile) return 'sterile';
  return 'dirty';
}

/** Whether the loop can pick up inoculum right now */
export function canPickup(state: LoopState): boolean {
  return state.isSterile && state.temperature <= SIM.KILL_THRESHOLD && state.inoculumLevel === 0;
}

/** Reset loop to initial dirty state */
export function resetLoop(): LoopState {
  return createLoopState();
}
