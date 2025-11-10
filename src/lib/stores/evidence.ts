import { writable, derived } from 'svelte/store';
import { ORGANISMS } from '../../data/organisms';
import type { GramStain, Shape, Arrangement } from '../../data/organisms';

export interface Evidence {
  gramStain: GramStain | null;
  shape: Shape | null;
  arrangement: Arrangement | null;
  acidFast: boolean | null;
  capsule: boolean | null;
  spores: boolean | null;
}

const initialEvidence: Evidence = {
  gramStain: null,
  shape: null,
  arrangement: null,
  acidFast: null,
  capsule: null,
  spores: null,
};

export const evidence = writable<Evidence>(initialEvidence);

// Derive filtered organisms based on evidence
export const filteredOrganisms = derived(
  evidence,
  ($evidence) => {
    return ORGANISMS.filter(organism => {
      // Check each piece of evidence
      if ($evidence.gramStain !== null && organism.gramStain !== $evidence.gramStain) {
        return false;
      }
      if ($evidence.shape !== null && organism.shape !== $evidence.shape) {
        return false;
      }
      if ($evidence.arrangement !== null && organism.arrangement !== $evidence.arrangement) {
        return false;
      }
      if ($evidence.acidFast !== null && organism.acidFast !== $evidence.acidFast) {
        return false;
      }
      if ($evidence.capsule !== null && organism.capsule !== $evidence.capsule) {
        return false;
      }
      if ($evidence.spores !== null && organism.sporeFormer !== $evidence.spores) {
        return false;
      }
      return true;
    });
  }
);

export const matchCount = derived(
  filteredOrganisms,
  ($filtered) => $filtered.length
);

// Helper functions
export function toggleGramStain(value: GramStain) {
  evidence.update(e => ({
    ...e,
    gramStain: e.gramStain === value ? null : value,
  }));
}

export function toggleShape(value: Shape) {
  evidence.update(e => ({
    ...e,
    shape: e.shape === value ? null : value,
  }));
}

export function toggleArrangement(value: Arrangement) {
  evidence.update(e => ({
    ...e,
    arrangement: e.arrangement === value ? null : value,
  }));
}

export function toggleAcidFast() {
  evidence.update(e => ({
    ...e,
    acidFast: e.acidFast === null ? true : (e.acidFast ? false : null),
  }));
}

export function toggleCapsule() {
  evidence.update(e => ({
    ...e,
    capsule: e.capsule === null ? true : (e.capsule ? false : null),
  }));
}

export function toggleSpores() {
  evidence.update(e => ({
    ...e,
    spores: e.spores === null ? true : (e.spores ? false : null),
  }));
}

export function clearEvidence() {
  evidence.set(initialEvidence);
}
