/**
 * Shared types for the workbench surface system.
 *
 * A workbench fixture has a work surface with zones. Items sit in zones.
 * The player interacts using a tool (e.g. inoculation loop) that follows the cursor.
 */

/** Normalized rectangle (0-1) within the workbench surface */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A zone on the workbench surface where an item sits */
export interface ZoneDef {
  id: string;
  label: string;
  bounds: Rect;
}

/** Status bar indicator displayed below the workbench */
export interface StatusItem {
  type: 'dot' | 'bar' | 'badge';
  label: string;
  cssClass?: string;
  value?: number;   // 'bar': 0-1 fill fraction
  text?: string;    // 'badge': display text
}

/** Hit-test zones against a normalized point; returns zone id or null */
export function hitTestZones(zones: ZoneDef[], nx: number, ny: number): string | null {
  for (const zone of zones) {
    const { x, y, w, h } = zone.bounds;
    if (nx >= x && nx <= x + w && ny >= y && ny <= y + h) return zone.id;
  }
  return null;
}
