/**
 * Item registry + grid placement — the single place to add a new item type.
 *
 * ITEM_DEFS maps each item type to its metadata and optional Svelte component.
 * ItemType and ItemState are derived from / live alongside the registry.
 * Helper functions and grid placement logic are also here.
 *
 * To add a new item: create the .svelte component, add one entry below.
 */

import type { Component } from 'svelte';
import type { Item, SubstanceType } from '../../lib/types';
import { getCulturePlate } from '../../lib/types';

import BunsenBurnerItem from '../items/BunsenBurnerItem.svelte';
import InoculationLoopItem from '../items/InoculationLoopItem.svelte';
import SampleVialItem from '../items/SampleVialItem.svelte';
import CulturePlateItem from '../items/culture/CulturePlateItem.svelte';
import PlaceholderItem from '../items/PlaceholderItem.svelte';

type ItemComponent = Component<{ item: Item }>;

interface ContainerDef {
  capacity: number;
  acceptedSubstances: SubstanceType[];
  sealable: boolean;
}

interface ItemDef {
  label: string;
  icon: string;
  gridSize: [number, number];
  placement: 'benchtop' | 'freeStanding';
  maxStack: number;
  consumable: boolean;
  portable: boolean;
  container?: ContainerDef;
  component?: ItemComponent;
}

export const ITEM_DEFS = {
  // Equipment — reusable, stays on benches
  'bunsen-burner':    { label: 'Bunsen Burner',    icon: '🔥', gridSize: [1, 2] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false, component: BunsenBurnerItem as ItemComponent },
  'inoculation-loop': { label: 'Inoculation Loop', icon: '〰️', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: true,  component: InoculationLoopItem as ItemComponent },
  'microscope':       { label: 'Brass Microscope',  icon: '🔬', gridSize: [2, 2] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'hand-centrifuge':  { label: 'Hand Centrifuge',   icon: '🔄', gridSize: [2, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'staining-rack':    { label: 'Staining Rack',     icon: '🧪', gridSize: [2, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'steam-sterilizer': { label: 'Steam Sterilizer',  icon: '♨️', gridSize: [2, 2] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: false },
  'flask':            { label: 'Laboratory Flask',   icon: '⚗️', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: true,
                        container: { capacity: 5, acceptedSubstances: ['distilled-water', 'nutrient-agar', 'blood-agar', 'gelatin'] as SubstanceType[], sealable: true } },

  // Containers — hold substances, portable
  'empty-dish':       { label: 'Petri Dish',         icon: '🧫', gridSize: [2, 2] as [number, number], placement: 'benchtop' as const, maxStack: 5, consumable: false, portable: true,  component: CulturePlateItem as ItemComponent,
                        container: { capacity: 1, acceptedSubstances: ['nutrient-agar', 'blood-agar', 'gelatin', 'bacteria-culture'] as SubstanceType[], sealable: true } },
  'sample-vial':      { label: 'Sample Vial',        icon: '🧪', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 0, consumable: false, portable: true,  component: SampleVialItem as ItemComponent,
                        container: { capacity: 1, acceptedSubstances: ['blood', 'sputum', 'csf', 'urine', 'stool'] as SubstanceType[], sealable: true } },

  // Consumables — depletable supplies, portable
  'agar-powder':        { label: 'Agar Powder',        icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'gelatin-powder':     { label: 'Gelatin Powder',      icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'beef-extract':       { label: 'Beef Extract',        icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'peptone':            { label: 'Peptone',              icon: '🫙', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'defibrinated-blood': { label: 'Defibrinated Blood',  icon: '🩸', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
  'distilled-water':    { label: 'Distilled Water',      icon: '💧', gridSize: [1, 1] as [number, number], placement: 'benchtop' as const, maxStack: 3, consumable: true, portable: true },
} as const satisfies Record<string, ItemDef>;

export type ItemType = keyof typeof ITEM_DEFS;

export type ItemState =
  | { kind: 'microscope'; loadedSlideId: string | null; focusLevel: number }
  | { kind: 'bunsen-burner'; lit: boolean }
  | { kind: 'inoculation-loop'; volume: number; concentration: number; temperature: number; isSterile: boolean }
  | { kind: 'staining-rack'; loadedSlides: string[]; currentStain: string | null }
  | { kind: 'centrifuge'; loadedVials: string[]; spinning: boolean; rpm: number };

export { PlaceholderItem };

// ============================================================
//  Item helper functions
// ============================================================

export function getItemIcon(item: Item): string {
  return ITEM_DEFS[item.type].icon;
}

export function getItemLabel(item: Item): string {
  const def = ITEM_DEFS[item.type];
  const plate = getCulturePlate(item);
  if (plate) return plate.label;
  if (item.quantity > 1) return `${def.label} ×${item.quantity}`;
  return def.label;
}

export function getItemSize(item: Item): number {
  return ITEM_DEFS[item.type].gridSize[0];
}

export function getCarryingLoad(items: Item[]): number {
  return items.reduce((sum, item) => sum + getItemSize(item), 0);
}

export function isPortable(item: Item): boolean {
  return ITEM_DEFS[item.type].portable;
}

export function getItemComponent(type: ItemType): ItemComponent | undefined {
  return (ITEM_DEFS[type] as { component?: ItemComponent }).component;
}

// ============================================================
//  Grid placement (was layout-items.ts)
// ============================================================

export interface GridPlacement {
  item: Item;
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/** Place items on a grid, honouring saved positions then auto-filling. */
export function placeItems(
  items: Item[],
  gridCols: number,
  gridRows: number,
): GridPlacement[] {
  const occupied = new Set<string>();
  const placements: GridPlacement[] = [];

  // First pass: honour explicit positions
  for (const item of items) {
    if (!item.gridPosition) continue;
    const [cols, rows] = ITEM_DEFS[item.type].gridSize;
    markOccupied(occupied, item.gridPosition.col, item.gridPosition.row, cols, rows);
    placements.push({ item, col: item.gridPosition.col, row: item.gridPosition.row, cols, rows });
  }

  // Second pass: auto-place the rest
  for (const item of items) {
    if (item.gridPosition) continue;
    const [cols, rows] = ITEM_DEFS[item.type].gridSize;
    const pos = findFreeCell(occupied, gridCols, gridRows, cols, rows);
    if (!pos) continue;
    markOccupied(occupied, pos.col, pos.row, cols, rows);
    placements.push({ item, col: pos.col, row: pos.row, cols, rows });
  }

  return placements;
}

/**
 * Persist auto-assigned positions back to items so they stay stable.
 * Call from $effect, not $derived.
 */
export function persistPositions(placements: GridPlacement[]) {
  for (const p of placements) {
    if (!p.item.gridPosition) {
      p.item.gridPosition = { col: p.col, row: p.row };
    }
  }
}

function markOccupied(set: Set<string>, col: number, row: number, cols: number, rows: number) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      set.add(`${col + c},${row + r}`);
    }
  }
}

function findFreeCell(
  occupied: Set<string>,
  gridCols: number,
  gridRows: number,
  itemCols: number,
  itemRows: number,
): { col: number; row: number } | null {
  for (let row = 0; row <= gridRows - itemRows; row++) {
    for (let col = 0; col <= gridCols - itemCols; col++) {
      let fits = true;
      for (let r = 0; r < itemRows && fits; r++) {
        for (let c = 0; c < itemCols && fits; c++) {
          if (occupied.has(`${col + c},${row + r}`)) fits = false;
        }
      }
      if (fits) return { col, row };
    }
  }
  return null;
}
