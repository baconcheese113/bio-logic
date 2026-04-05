/**
 * Reactive workbench context — the shared nervous system for item interactions.
 *
 * Items use this to:
 *  - Mutate their own state through the owner (avoids ownership warnings)
 *  - Query what other items / samples are on the bench
 *  - Read pointer state (held item, hovered item, cursor position)
 *  - Pick up / put down tools for interaction
 *  - Read shared input state (mouseDown, pressureLevel) without prop-drilling
 *
 * WorkbenchView creates a WorkbenchState and calls setWorkbenchContext().
 * Item components call getWorkbench() and read reactive properties.
 */
import { setContext, getContext } from 'svelte';
import type { Item, Sample } from '../../lib/types';
import type { ItemType } from './item-defs';

const KEY = Symbol('workbench');

export class WorkbenchState {
  /** Which item the player is holding (picked up from its slot). */
  heldItemId = $state<string | null>(null);
  /** Which stationary item the cursor is currently over. */
  hoveredItemId = $state<string | null>(null);
  /** Normalized Y position of the cursor within the currently hovered tile (0 = top, 1 = bottom). Set by WorkbenchGrid. */
  hoverNormY = $state(0);

  /** Whether the primary pointer button is currently pressed. Set by WorkbenchGrid. */
  mouseDown = $state(false);
  /** Pressure level (0 or 1). Full when mouse is held while the inoculation loop is in hand. */
  pressureLevel = $derived(this.mouseDown && this.isHolding('inoculation-loop') ? 1 : 0);

  #getItems: () => Item[];
  #getSamples: () => Sample[];
  #getCurrentTick: () => number;

  constructor(getItems: () => Item[], getSamples: () => Sample[], getCurrentTick: () => number) {
    this.#getItems = getItems;
    this.#getSamples = getSamples;
    this.#getCurrentTick = getCurrentTick;
  }

  get items() { return this.#getItems(); }
  get samples() { return this.#getSamples(); }
  get currentTick() { return this.#getCurrentTick(); }

  get heldItem(): Item | null {
    if (!this.heldItemId) return null;
    return this.items.find(i => i.id === this.heldItemId) ?? null;
  }

  /** Mutate an item on this bench by ID (avoids child ownership warnings). */
  mutateItem(id: string, fn: (item: Item) => void) {
    const item = this.items.find(i => i.id === id);
    if (item) fn(item);
  }

  /** Pick up an item — it follows the cursor for interactions. */
  pickUp(itemId: string) {
    this.heldItemId = itemId;
  }

  /** Return the held item to its slot. */
  putDown() {
    this.heldItemId = null;
  }

  /** Check if a specific item type is currently held. */
  isHolding(type: ItemType): boolean {
    return this.heldItem?.type === type;
  }

  /** Check if the held item is hovering over a specific stationary item. */
  isHeldOver(itemId: string): boolean {
    return this.heldItemId !== null && this.hoveredItemId === itemId;
  }

  /** Find the first item of a given type on this bench. */
  findItem(type: ItemType): Item | undefined {
    return this.items.find(i => i.type === type);
  }

}

export function setWorkbenchContext(wb: WorkbenchState) {
  setContext(KEY, wb);
}

export function getWorkbench(): WorkbenchState {
  return getContext<WorkbenchState>(KEY);
}
