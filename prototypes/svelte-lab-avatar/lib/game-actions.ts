/**
 * Game action functions — pure mutations on LabState.
 *
 * Each function takes the state (and optional params) and mutates it directly.
 * Returns side-information (e.g. departed patient IDs) when the caller needs it.
 */

import type {
  LabState,
  Sample,
  GridPosition,
  SampleType,
  Item,
  Diagnosis,
  ActivePrep,
  Direction,
} from './types';
import { FIXTURE_DEFS } from './types';
import { getCarryingLoad, getItemSize, isPortable } from '../components/workbench/item-defs';
import { generatePatient, WAITING_BENCHES } from './mock-data';

// ============================================================
//  ID COUNTERS
// ============================================================

let sampleCounter = 0;
let plateCounter = 0;
let itemCounter = 100; // offset from mock-data

function nextItemId(): string {
  return `item-${++itemCounter}`;
}

// ============================================================
//  UTILITIES
// ============================================================

export function isAdjacent(a: GridPosition, b: GridPosition): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
}

function getDirection(from: GridPosition, to: GridPosition): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// ============================================================
//  PLAYER ACTIONS
// ============================================================

/** Move the player to a target tile (with 300ms animation). */
export function movePlayerTo(state: LabState, target: GridPosition): void {
  state.player = { ...state.player, isMoving: true, targetPosition: target };
  setTimeout(() => {
    state.player = {
      ...state.player,
      position: target,
      isMoving: false,
      targetPosition: null,
      facing: getDirection(state.player.position, target),
    };
  }, 300);
}

// ============================================================
//  SAMPLE ACTIONS
// ============================================================

/** Collect a sample from a patient. Returns the new sample ID, or null on failure. */
export function collectSample(
  state: LabState,
  patientId: string,
  sampleType: SampleType,
): string | null {
  const player = state.player;
  if (getCarryingLoad(player.carrying) >= player.carryCapacity) return null;

  const patient = state.patients.find(p => p.id === patientId);
  if (!patient) return null;
  if (!isAdjacent(player.position, patient.benchPosition)) return null;
  if (!patient.availableSamples.includes(sampleType)) return null;
  if (patient.collectedSamples.includes(sampleType)) return null;

  sampleCounter++;
  const sampleId = `sample-${sampleCounter}`;
  const newSample: Sample = {
    id: sampleId,
    type: sampleType,
    caseId: patient.caseId,
    patientId: patient.id,
    condition: 'fresh',
    collectedAtTick: state.currentTick,
    location: { type: 'player' },
    label: `${sampleType.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} - ${patient.name}`,
  };

  player.carrying = [...player.carrying, { id: sampleId, type: 'sample-vial' as const, quantity: 1 }];
  state.samples = [...state.samples, newSample];
  state.patients = state.patients.map(p =>
    p.id === patientId ? { ...p, collectedSamples: [...p.collectedSamples, sampleType] } : p
  );

  return sampleId;
}

// ============================================================
//  ITEM PLACEMENT / PICKUP
// ============================================================

/** Place the first carried item onto a fixture. */
export function placeItem(state: LabState, fixtureId: string): boolean {
  if (state.player.carrying.length === 0) return false;

  const furn = state.fixtures.find(f => f.id === fixtureId);
  if (!furn) return false;
  if (!isAdjacent(state.player.position, furn.position)) return false;
  if (furn.items.length >= FIXTURE_DEFS[furn.type].capacity) return false;

  const [dropped, ...rest] = state.player.carrying;
  // Clear grid position so it auto-places on the new bench
  delete dropped.gridPosition;
  furn.items = [...furn.items, dropped];
  state.player.carrying = rest;

  if (dropped.type === 'sample-vial') {
    state.samples = state.samples.map(s =>
      s.id === dropped.id
        ? { ...s, location: { type: 'fixture' as const, fixtureId } }
        : s
    );
  }
  return true;
}

/** Pick up a specific item from a fixture by index. */
export function pickupFromFixture(state: LabState, fixtureId: string, itemIndex: number): boolean {
  const furn = state.fixtures.find(f => f.id === fixtureId);
  if (!furn) return false;
  if (!isAdjacent(state.player.position, furn.position)) return false;

  const item = furn.items[itemIndex];
  if (!item || !isPortable(item)) return false;

  const load = getCarryingLoad(state.player.carrying);
  if (load + getItemSize(item) > state.player.carryCapacity) return false;

  furn.items = furn.items.filter((_, i) => i !== itemIndex);
  state.player.carrying = [...state.player.carrying, item];

  if (item.type === 'sample-vial') {
    state.samples = state.samples.map(s =>
      s.id === item.id ? { ...s, location: { type: 'player' as const } } : s
    );
  }
  return true;
}

/** Take a supply from a cabinet (creates a new single-quantity item for the player). */
export function takeFromCabinet(state: LabState, cabinetId: string, item: Item): boolean {
  const load = getCarryingLoad(state.player.carrying);
  if (load + getItemSize(item) > state.player.carryCapacity) return false;

  const cabinet = state.fixtures.find(f => f.id === cabinetId);
  if (!cabinet) return false;

  const idx = cabinet.items.findIndex(i => i.type === item.type);
  if (idx >= 0) {
    const existing = cabinet.items[idx];
    if (existing.quantity > 1) {
      cabinet.items = cabinet.items.map((c, i) =>
        i === idx ? { ...c, quantity: c.quantity - 1 } : c
      );
    } else {
      cabinet.items = cabinet.items.filter((_, i) => i !== idx);
    }
  }

  const newItem: Item = { id: nextItemId(), type: item.type, quantity: 1 };
  state.player.carrying = [...state.player.carrying, newItem];
  return true;
}

// ============================================================
//  MEDIA PREPARATION
// ============================================================

/** Check completed preps, create plates, return remaining activePreps. */
export function checkPrepCompletion(state: LabState, activePreps: ActivePrep[]): ActivePrep[] {
  const completed = activePreps.filter(p => state.currentTick - p.startTick >= p.duration);
  if (completed.length === 0) return activePreps;

  for (const prep of completed) {
    const furn = state.fixtures.find(f => f.id === prep.fixtureId);
    if (!furn) continue;

    plateCounter++;
    furn.items = [...furn.items, {
      id: `plate-${plateCounter}`,
      type: 'empty-dish' as const,
      quantity: 1,
      contents: {
        substance: prep.mediaType,
        volume: 1,
        sealed: false,
        meta: { kind: 'prepared-media' as const, cooledAtTick: state.currentTick },
      },
    }];
  }

  return activePreps.filter(p => state.currentTick - p.startTick < p.duration);
}

// ============================================================
//  OBSERVATIONS & DIAGNOSIS
// ============================================================

/** Submit a diagnosis for a patient. Returns whether it was correct, or null if patient not found. */
export function submitDiagnosis(state: LabState, patientId: string, diagnosis: Diagnosis): boolean | null {
  const patient = state.patients.find(p => p.id === patientId);
  if (!patient) return null;

  const correct = patient.correctDiagnosis;
  const isCorrect =
    diagnosis.organism === correct.organism &&
    diagnosis.category === correct.category &&
    diagnosis.treatment === correct.treatment;

  state.patients = state.patients.map(p =>
    p.id === patientId
      ? {
          ...p,
          status: isCorrect ? 'treated' as const : 'worsened' as const,
          diagnosisResult: { submitted: diagnosis, correct, isCorrect },
        }
      : p
  );

  return isCorrect;
}

// ============================================================
//  TICK SIMULATION
// ============================================================

/** Update sample degradation based on age and storage location. */
export function updateSampleDegradation(state: LabState): void {
  const degradationRate = 0.0001;
  const spoilThreshold = 0.3;
  const degradeThreshold = 0.6;

  state.samples = state.samples.map(sample => {
    let isInColdStorage = false;
    const loc = sample.location;
    if (loc.type === 'fixture') {
      const furn = state.fixtures.find(f => f.id === loc.fixtureId);
      isInColdStorage = furn?.type === 'ice-box';
    }

    const age = state.currentTick - sample.collectedAtTick;
    const effectiveAge = isInColdStorage ? age * 0.1 : age;
    const freshness = Math.max(0, 1 - effectiveAge * degradationRate);

    let condition: Sample['condition'] = 'fresh';
    if (freshness < spoilThreshold) condition = 'spoiled';
    else if (freshness < degradeThreshold) condition = 'degraded';

    return { ...sample, condition };
  });
}

/** Decrease patience for all patients. Returns IDs of patients who departed. */
export function updatePatientPatience(state: LabState): string[] {
  const departedIds: string[] = [];
  let changed = false;

  const updated = state.patients.map(patient => {
    const newPatience = patient.patienceTicks - state.speed;
    if (newPatience !== patient.patienceTicks) {
      changed = true;
      return { ...patient, patienceTicks: newPatience };
    }
    return patient;
  });

  const remaining = updated.filter(p => {
    if (p.patienceTicks <= 0) {
      departedIds.push(p.id);
      const { x, y } = p.benchPosition;
      if (state.grid[y]?.[x]) state.grid[y][x].patientId = null;
      return false;
    }
    return true;
  });

  if (changed || departedIds.length > 0) {
    state.patients = remaining;
  }

  return departedIds;
}

/** Maybe spawn a new patient on an empty waiting bench. */
export function maybeSpawnNewPatient(state: LabState): void {
  const emptyBench = WAITING_BENCHES.find(bench => {
    const tile = state.grid[bench.y]?.[bench.x];
    return tile && tile.type === 'waiting-bench' && !tile.patientId;
  });

  if (emptyBench && Math.random() < 0.0005 * state.speed) {
    const newPatient = generatePatient(emptyBench, state.currentTick);
    state.grid[emptyBench.y][emptyBench.x].patientId = newPatient.id;
    state.patients = [...state.patients, newPatient];
  }
}
