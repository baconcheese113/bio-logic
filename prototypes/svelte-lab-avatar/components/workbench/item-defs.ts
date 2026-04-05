/**
 * Item registry and grid placement.
 *
 * ITEM_DEFS maps each item type to metadata and an optional Svelte component.
 * ItemType and ItemState live alongside the data they describe.
 */

import type { Component } from 'svelte';
import type { Item, SubstanceType } from '../../lib/types';
import { getCulturePlate } from '../../lib/types';
import type { SpeciesDef } from '../reference/codex-streak/streak-types';

import BunsenBurnerItem from '../items/BunsenBurnerItem.svelte';
import IncubatorItem from '../items/IncubatorItem.svelte';
import InoculationLoopItem from '../items/InoculationLoopItem.svelte';
import PlaceholderItem from '../items/PlaceholderItem.svelte';
import SampleVialItem from '../items/SampleVialItem.svelte';
import CulturePlateItem from '../items/culture/CulturePlateItem.svelte';

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
  'bunsen-burner': {
    label: 'Bunsen Burner',
    icon: '🔥',
    gridSize: [1, 2] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
    component: BunsenBurnerItem as ItemComponent,
  },
  incubator: {
    label: 'Incubator',
    icon: '♨️',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
    component: IncubatorItem as ItemComponent,
  },
  'inoculation-loop': {
    label: 'Inoculation Loop',
    icon: '〰️',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: true,
    component: InoculationLoopItem as ItemComponent,
  },
  microscope: {
    label: 'Brass Microscope',
    icon: '🔬',
    gridSize: [2, 2] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
  },
  'hand-centrifuge': {
    label: 'Hand Centrifuge',
    icon: '🔄',
    gridSize: [2, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
  },
  'staining-rack': {
    label: 'Staining Rack',
    icon: '🧪',
    gridSize: [2, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
  },
  'steam-sterilizer': {
    label: 'Steam Sterilizer',
    icon: '♨️',
    gridSize: [2, 2] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: false,
  },
  flask: {
    label: 'Laboratory Flask',
    icon: '⚗️',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: true,
    container: {
      capacity: 5,
      acceptedSubstances: ['distilled-water', 'nutrient-agar', 'blood-agar', 'gelatin'] as SubstanceType[],
      sealable: true,
    },
  },

  'empty-dish': {
    label: 'Petri Dish',
    icon: '🧫',
    gridSize: [2, 2] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 5,
    consumable: false,
    portable: true,
    component: CulturePlateItem as ItemComponent,
    container: {
      capacity: 1,
      acceptedSubstances: ['nutrient-agar', 'blood-agar', 'gelatin', 'bacteria-culture'] as SubstanceType[],
      sealable: true,
    },
  },
  'sample-vial': {
    label: 'Sample Vial',
    icon: '🧪',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 0,
    consumable: false,
    portable: true,
    component: SampleVialItem as ItemComponent,
    container: {
      capacity: 1,
      acceptedSubstances: ['blood', 'sputum', 'csf', 'urine', 'stool', 'wound-swab', 'throat-swab'] as SubstanceType[],
      sealable: true,
    },
  },

  'agar-powder': {
    label: 'Agar Powder',
    icon: '🫙',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
  'gelatin-powder': {
    label: 'Gelatin Powder',
    icon: '🫙',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
  'beef-extract': {
    label: 'Beef Extract',
    icon: '🫙',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
  peptone: {
    label: 'Peptone',
    icon: '🫙',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
  'defibrinated-blood': {
    label: 'Defibrinated Blood',
    icon: '🩸',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
  'distilled-water': {
    label: 'Distilled Water',
    icon: '💧',
    gridSize: [1, 1] as [number, number],
    placement: 'benchtop' as const,
    maxStack: 3,
    consumable: true,
    portable: true,
  },
} as const satisfies Record<string, ItemDef>;

export type ItemType = keyof typeof ITEM_DEFS;

export type ItemState =
  | { kind: 'microscope'; loadedSlideId: string | null; focusLevel: number }
  | { kind: 'bunsen-burner'; lit: boolean }
  | { kind: 'incubator'; targetHours: number }
  | {
      kind: 'inoculation-loop';
      volume: number;
      concentration: number;
      temperature: number;
      isSterile: boolean;
      speciesLoads: number[];
      speciesConfig: SpeciesDef[];
      sourceLabel: string | null;
    }
  | { kind: 'staining-rack'; loadedSlides: string[]; currentStain: string | null }
  | { kind: 'centrifuge'; loadedVials: string[]; spinning: boolean; rpm: number };

export { PlaceholderItem };

export function getItemIcon(item: Item): string {
  return ITEM_DEFS[item.type].icon;
}

export function getItemLabel(item: Item): string {
  const def = ITEM_DEFS[item.type];
  const plate = getCulturePlate(item);
  if (plate) return plate.label;
  if (item.quantity > 1) return `${def.label} x${item.quantity}`;
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

export interface GridPlacement {
  item: Item;
  col: number;
  row: number;
  cols: number;
  rows: number;
}

export function placeItems(items: Item[], gridCols: number, gridRows: number): GridPlacement[] {
  const occupied = new Set<string>();
  const placements: GridPlacement[] = [];

  for (const item of items) {
    if (!item.gridPosition) continue;
    const [cols, rows] = ITEM_DEFS[item.type].gridSize;
    markOccupied(occupied, item.gridPosition.col, item.gridPosition.row, cols, rows);
    placements.push({ item, col: item.gridPosition.col, row: item.gridPosition.row, cols, rows });
  }

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

export function persistPositions(placements: GridPlacement[]) {
  for (const placement of placements) {
    if (!placement.item.gridPosition) {
      placement.item.gridPosition = { col: placement.col, row: placement.row };
    }
  }
}

function markOccupied(set: Set<string>, col: number, row: number, cols: number, rows: number): void {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
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
  for (let row = 0; row <= gridRows - itemRows; row += 1) {
    for (let col = 0; col <= gridCols - itemCols; col += 1) {
      let fits = true;
      for (let r = 0; r < itemRows && fits; r += 1) {
        for (let c = 0; c < itemCols && fits; c += 1) {
          if (occupied.has(`${col + c},${row + r}`)) {
            fits = false;
          }
        }
      }
      if (fits) return { col, row };
    }
  }
  return null;
}
