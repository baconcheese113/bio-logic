import type { DefensePlacement, FounderState, SectorState, TelegraphState, ThreatProbe } from './simulation-engine';
import type { DefenseToolId, GeneId, SectorId, ThreatId } from './strain-data';

export interface PhaserSnapshot {
  elapsedSeconds: number;
  activeThreats: ThreatId[];
  propagatedGenes: GeneId[];
  desiredGenes: GeneId[];
  telegraph: TelegraphState;
  colonyDensity: number;
  founderState: FounderState;
  sectors: SectorState[];
  placements: DefensePlacement[];
  activeProbes: ThreatProbe[];
  selectedTool: DefenseToolId | null;
  toolCooldowns: Record<DefenseToolId, number>;
  wave: number;
  paused: boolean;
}

export interface BusEvents {
  'state:update': PhaserSnapshot;
  'sample:pulse': { instrument: 'elisa' | 'pcr' };
  'game:reset': PhaserSnapshot;
  'battle:loss': { cause: ThreatId };
  'battlefield:place-defense': { sectorId: SectorId };
  'battlefield:hover-sector': { sectorId: SectorId | null };
}

type Listener<T> = (payload: T) => void;

export class EventBus<TEvents extends object> {
  private listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>();

  on<TKey extends keyof TEvents>(event: TKey, listener: Listener<TEvents[TKey]>): () => void {
    const listeners = this.getListeners(event);
    listeners.add(listener as Listener<TEvents[keyof TEvents]>);
    return () => listeners.delete(listener as Listener<TEvents[keyof TEvents]>);
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      (listener as Listener<TEvents[TKey]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  private getListeners<TKey extends keyof TEvents>(event: TKey): Set<Listener<TEvents[keyof TEvents]>> {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }
    return listeners;
  }
}

export const strainBus = new EventBus<BusEvents>();
