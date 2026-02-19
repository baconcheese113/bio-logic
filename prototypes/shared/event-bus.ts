/**
 * Event bus for Phaser ↔ Svelte communication
 * Type-safe pub/sub pattern
 */

import type { GridPosition } from './types';

// Event types for the lab
export interface LabEvents {
  'fixture-clicked': string;
  'tile-clicked': GridPosition;
  'item-picked-up': string;
  'item-placed': { fixtureId: string };
  'speed-changed': number;
  'pause-toggled': boolean;
  'tick': number;
}

export type LabEventBus = {
  subscribe<K extends keyof LabEvents>(
    event: K,
    callback: (data: LabEvents[K]) => void
  ): () => void;
  emit<K extends keyof LabEvents>(event: K, data: LabEvents[K]): void;
  clear(): void;
};

export function createEventBus(): LabEventBus {
  const listeners = new Map<string, Set<(data: unknown) => void>>();

  return {
    subscribe<K extends keyof LabEvents>(
      event: K,
      callback: (data: LabEvents[K]) => void
    ): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as (data: unknown) => void);
      return () => listeners.get(event)?.delete(callback as (data: unknown) => void);
    },

    emit<K extends keyof LabEvents>(event: K, data: LabEvents[K]): void {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        for (const callback of eventListeners) {
          callback(data);
        }
      }
    },

    clear(): void {
      listeners.clear();
    },
  };
}

// Legacy singleton for backward compatibility
class EventBus {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  subscribe<K extends keyof LabEvents>(
    event: K,
    callback: (data: LabEvents[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (data: unknown) => void);
    return () => this.listeners.get(event)?.delete(callback as (data: unknown) => void);
  }

  emit<K extends keyof LabEvents>(event: K, data: LabEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const callback of eventListeners) {
        callback(data);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const labEventBus = new EventBus();

