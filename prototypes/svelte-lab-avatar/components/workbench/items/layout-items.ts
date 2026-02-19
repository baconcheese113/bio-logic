/**
 * Grid-based placement for workbench items.
 *
 * Items occupy cells on the fixture's surfaceGrid (e.g. 4×2).
 * Items with a gridPosition are placed first; the rest auto-fill
 * into the next available slot (left-to-right, top-to-bottom).
 *
 * Auto-placed items get their gridPosition written back so positions
 * are stable — picking up one item doesn't rearrange the rest.
 */

import type { Item } from '../../../../shared/types';
import { ITEM_DEFS } from '../../../../shared/types';

export interface GridPlacement {
  item: Item;
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/** Place items on a grid, persisting auto-assigned positions back to items. */
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
    if (!pos) continue; // bench is full
    markOccupied(occupied, pos.col, pos.row, cols, rows);
    placements.push({ item, col: pos.col, row: pos.row, cols, rows });
  }

  return placements;
}

/**
 * Persist auto-assigned positions back to items.
 * Call this from an $effect, not inside $derived.
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
