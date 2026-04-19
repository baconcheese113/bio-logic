<script lang="ts">
  import type { AssemblyRead, AssemblyPuzzleData } from '../lib/lab-types';

  interface Props {
    data: AssemblyPuzzleData;
  }

  let { data }: Props = $props();

  const CELL_W = 11;
  const CELL_H = 28;

  interface GridRead {
    id: string;
    sequence: string;
    col: number;
    row: number;
  }

  let trayReads = $state<AssemblyRead[]>([]);
  let gridReads = $state<GridRead[]>([]);
  let viewportEl: HTMLDivElement | undefined = $state();

  // Pan/zoom state
  let panX = $state(0);
  let panY = $state(0);
  let zoom = $state(1);
  let isPanning = $state(false);
  let panAnchorX = $state(0);
  let panAnchorY = $state(0);
  let panStartX = $state(0);
  let panStartY = $state(0);

  // Virtual canvas size
  const CANVAS_W = 2000;
  const CANVAS_H = 1400;
  let trayEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    trayReads = [...data.reads];
    gridReads = [];
    panX = 0;
    panY = 0;
    zoom = 1;
  });

  let drag = $state<{
    readId: string;
    anchorX: number;
    anchorY: number;
    x: number;
    y: number;
    fromTray: boolean;
    group: { id: string; dCol: number; dRow: number }[];
  } | null>(null);

  /** Convert a pointer event to virtual-canvas coordinates. */
  function canvasXY(e: PointerEvent) {
    const r = viewportEl!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / zoom - panX,
      y: (e.clientY - r.top) / zoom - panY,
    };
  }

  /** Check if a read at (col, row) overlaps any read on the same row, excluding a set of IDs. */
  function overlapsAnyExcept(col: number, row: number, len: number, excludeIds: Set<string>): boolean {
    for (const r of gridReads) {
      if (excludeIds.has(r.id)) continue;
      if (r.row !== row) continue;
      if (col < r.col + r.sequence.length && col + len > r.col) return true;
    }
    return false;
  }

  /** Find the nearest free row for a single read, excluding one ID. */
  function findFreeRow(col: number, targetRow: number, len: number, excludeId: string): number {
    const ex = new Set([excludeId]);
    for (let offset = 0; offset < 50; offset++) {
      const up = targetRow - offset;
      if (up >= 0 && !overlapsAnyExcept(col, up, len, ex)) return up;
      const down = targetRow + offset;
      if (down !== up && !overlapsAnyExcept(col, down, len, ex)) return down;
    }
    return targetRow;
  }

  /** Find connected component of a read (adjacent rows + overlapping columns). */
  function findConnectedComponent(startId: string): string[] {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const read = gridReads.find(r => r.id === id)!;
      for (const other of gridReads) {
        if (visited.has(other.id)) continue;
        if (Math.abs(read.row - other.row) !== 1) continue;
        if (read.col < other.col + other.sequence.length && read.col + read.sequence.length > other.col) {
          visited.add(other.id);
          queue.push(other.id);
        }
      }
    }
    return [...visited];
  }

  /** Find nearest row offset where an entire group can be placed without overlapping non-group reads. */
  function findFreeGroupRow(
    primaryCol: number,
    targetRow: number,
    group: { id: string; dCol: number; dRow: number }[],
    groupIds: Set<string>,
  ): number {
    for (let offset = 0; offset < 50; offset++) {
      for (const tryRow of offset === 0 ? [targetRow] : [targetRow - offset, targetRow + offset]) {
        let ok = true;
        for (const gm of group) {
          const r = tryRow + gm.dRow;
          if (r < 0) { ok = false; break; }
          const rd = gridReads.find(x => x.id === gm.id)!;
          if (overlapsAnyExcept(primaryCol + gm.dCol, r, rd.sequence.length, groupIds)) {
            ok = false;
            break;
          }
        }
        if (ok) return tryRow;
      }
    }
    return targetRow;
  }

  // Match highlighting — skip reads currently being dragged
  const matchSet = $derived.by(() => {
    const m = new Set<string>();
    const dragIds = drag ? new Set(drag.group.map(g => g.id)) : new Set<string>();
    const reads = gridReads.filter(r => !dragIds.has(r.id));
    for (let i = 0; i < reads.length; i++) {
      for (let j = i + 1; j < reads.length; j++) {
        const a = reads[i], b = reads[j];
        if (Math.abs(a.row - b.row) !== 1) continue;
        const lo = Math.max(a.col, b.col);
        const hi = Math.min(a.col + a.sequence.length, b.col + b.sequence.length);
        for (let c = lo; c < hi; c++) {
          if (a.sequence[c - a.col] === b.sequence[c - b.col]) {
            m.add(`${a.id}-${c - a.col}`);
            m.add(`${b.id}-${c - b.col}`);
          }
        }
      }
    }
    return m;
  });

  // SVG vertical lines between matching bases on adjacent rows
  const matchLines = $derived.by(() => {
    const out: { x: number; y1: number; y2: number }[] = [];
    const dragIds = drag ? new Set(drag.group.map(g => g.id)) : new Set<string>();
    const reads = gridReads.filter(r => !dragIds.has(r.id));
    for (let i = 0; i < reads.length; i++) {
      for (let j = i + 1; j < reads.length; j++) {
        const a = reads[i], b = reads[j];
        if (Math.abs(a.row - b.row) !== 1) continue;
        const upper = a.row < b.row ? a : b;
        const lower = a.row < b.row ? b : a;
        const lo = Math.max(upper.col, lower.col);
        const hi = Math.min(upper.col + upper.sequence.length, lower.col + lower.sequence.length);
        for (let c = lo; c < hi; c++) {
          if (upper.sequence[c - upper.col] === lower.sequence[c - lower.col]) {
            out.push({
              x: c * CELL_W + CELL_W / 2,
              y1: (upper.row + 1) * CELL_H - 5,
              y2: lower.row * CELL_H + 4,
            });
          }
        }
      }
    }
    return out;
  });

  // Assembled contig — project all grid reads onto one line (topmost read wins per column)
  // Also track per-base support count for highlighting
  const contigData = $derived.by(() => {
    if (!gridReads.length) return { bases: [] as { char: string; supported: boolean }[] };
    const sorted = [...gridReads].sort((a, b) => a.row - b.row || a.col - b.col);
    const minC = Math.min(...sorted.map(r => r.col));
    const maxC = Math.max(...sorted.map(r => r.col + r.sequence.length));
    const bases: { char: string; supported: boolean }[] = [];
    for (let c = minC; c < maxC; c++) {
      let base = '?';
      let count = 0;
      for (const r of sorted) {
        const idx = c - r.col;
        if (idx >= 0 && idx < r.sequence.length) {
          if (base === '?') base = r.sequence[idx];
          if (r.sequence[idx] === base) count++;
        }
      }
      bases.push({ char: base, supported: count >= 2 });
    }
    return { bases };
  });
  const contig = $derived(contigData.bases.map(b => b.char).join(''));

  /** Compute connected components for handle display. */
  const connectedGroups = $derived.by(() => {
    const visited = new Set<string>();
    const groups: string[][] = [];
    for (const read of gridReads) {
      if (visited.has(read.id)) continue;
      const component = findConnectedComponent(read.id);
      if (component.length > 1) groups.push(component);
      for (const id of component) visited.add(id);
    }
    return groups;
  });

  /** Set of read IDs that belong to any connected group (for subtle visual). */
  const groupedReadIds = $derived(new Set(connectedGroups.flat()));

  /** For each connected group, place handles on the leading and trailing fragments. */
  const groupHandles = $derived.by(() => {
    return connectedGroups.map(ids => {
      const reads = ids.map(id => gridReads.find(r => r.id === id)!).filter(Boolean);
      const leading = reads.reduce((a, b) => a.col < b.col ? a : b);
      const trailing = reads.reduce((a, b) => (a.col + a.sequence.length) > (b.col + b.sequence.length) ? a : b);
      return { anchorId: leading.id, startCol: leading.col, startRow: leading.row, endCol: trailing.col + trailing.sequence.length, endRow: trailing.row, ids };
    });
  });

  function startDrag(id: string, source: 'tray' | 'grid', e: PointerEvent, asGroup = false) {
    if (!viewportEl) return;
    e.preventDefault();
    e.stopPropagation();
    viewportEl.setPointerCapture(e.pointerId);

    const p = canvasXY(e);

    if (source === 'tray') {
      const tr = trayReads.find(r => r.id === id)!;
      trayReads = trayReads.filter(r => r.id !== id);
      const x = p.x - (tr.sequence.length * CELL_W / 2);
      const y = p.y - CELL_H / 2;
      const col = Math.max(0, Math.round(x / CELL_W));
      const row = Math.max(0, Math.round(y / CELL_H));
      gridReads = [...gridReads, { id: tr.id, sequence: tr.sequence, col, row }];
      drag = {
        readId: id, anchorX: p.x - x, anchorY: p.y - y, x, y, fromTray: true,
        group: [{ id: tr.id, dCol: 0, dRow: 0 }],
      };
    } else {
      const rd = gridReads.find(r => r.id === id)!;
      const rx = rd.col * CELL_W;
      const ry = rd.row * CELL_H;
      if (asGroup) {
        const componentIds = findConnectedComponent(id);
        const group = componentIds.map(cid => {
          const cr = gridReads.find(r => r.id === cid)!;
          return { id: cid, dCol: cr.col - rd.col, dRow: cr.row - rd.row };
        });
        drag = { readId: id, anchorX: p.x - rx, anchorY: p.y - ry, x: rx, y: ry, fromTray: false, group };
      } else {
        drag = {
          readId: id, anchorX: p.x - rx, anchorY: p.y - ry, x: rx, y: ry, fromTray: false,
          group: [{ id, dCol: 0, dRow: 0 }],
        };
      }
    }
  }

  function handlePointerDown(e: PointerEvent) {
    // Only start pan if clicking on empty canvas (not on a read or HUD element)
    if (drag) return;
    if ((e.target as HTMLElement).closest('.grid-read, .tray-read, .hud, .group-handle')) return;
    isPanning = true;
    panAnchorX = e.clientX;
    panAnchorY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    viewportEl?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (isPanning) {
      panX = panStartX + (e.clientX - panAnchorX) / zoom;
      panY = panStartY + (e.clientY - panAnchorY) / zoom;
      return;
    }
    if (!drag || !viewportEl) return;
    const p = canvasXY(e);
    drag = { ...drag, x: p.x - drag.anchorX, y: p.y - drag.anchorY };
  }

  function handlePointerUp(e: PointerEvent) {
    if (isPanning) {
      isPanning = false;
      return;
    }
    if (!drag || !viewportEl) return;
    const trayTop = trayEl ? trayEl.getBoundingClientRect().top : viewportEl.getBoundingClientRect().bottom - 60;
    const groupIds = new Set(drag.group.map(g => g.id));

    if (e.clientY > trayTop) {
      // Return entire group to tray
      const returning = gridReads.filter(r => groupIds.has(r.id));
      gridReads = gridReads.filter(r => !groupIds.has(r.id));
      trayReads = [...trayReads, ...returning.map(r => ({ id: r.id, sequence: r.sequence }))];
    } else {
      const p = canvasXY(e);
      const rawX = p.x - drag.anchorX;
      const rawY = p.y - drag.anchorY;
      const primaryCol = Math.max(0, Math.round(rawX / CELL_W));
      const primaryWantRow = Math.max(0, Math.round(rawY / CELL_H));

      if (drag.group.length === 1) {
        // Single read — use simple findFreeRow
        const rd = gridReads.find(r => r.id === drag!.readId)!;
        const row = findFreeRow(primaryCol, primaryWantRow, rd.sequence.length, drag.readId);
        gridReads = gridReads.map(r => r.id === drag!.readId ? { ...r, col: primaryCol, row } : r);
      } else {
        // Group drop — find free position for the whole group
        const row = findFreeGroupRow(primaryCol, primaryWantRow, drag.group, groupIds);
        gridReads = gridReads.map(r => {
          const gm = drag!.group.find(g => g.id === r.id);
          if (!gm) return r;
          return { ...r, col: primaryCol + gm.dCol, row: row + gm.dRow };
        });
      }
    }
    drag = null;
  }

  function handleWheel(e: WheelEvent) {
    if (!viewportEl) return;
    e.preventDefault();
    const rect = viewportEl.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom * factor));
    panX += sx * (1 / newZoom - 1 / zoom);
    panY += sy * (1 / newZoom - 1 / zoom);
    zoom = newZoom;
  }

  function clearGrid() {
    trayReads = [...trayReads, ...gridReads.map(r => ({ id: r.id, sequence: r.sequence }))];
    gridReads = [];
  }

  function resetView() {
    panX = 0;
    panY = 0;
    zoom = 1;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="assembly-viewport"
  bind:this={viewportEl}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onwheel={handleWheel}
>
  <div
    class="canvas"
    style:transform="scale({zoom}) translate({panX}px, {panY}px)"
    style:transform-origin="0 0"
  >
    <!-- Grid background pattern -->
    <svg class="grid-bg" width={CANVAS_W} height={CANVAS_H}>
      <defs>
        <pattern id="grid-pattern" width={CELL_W} height={CELL_H} patternUnits="userSpaceOnUse">
          <line x1={CELL_W} y1="0" x2={CELL_W} y2={CELL_H} stroke="rgba(207,174,110,0.05)" stroke-width="1" />
          <line x1="0" y1={CELL_H} x2={CELL_W} y2={CELL_H} stroke="rgba(207,174,110,0.05)" stroke-width="1" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid-pattern)" />
    </svg>

    <!-- Connection lines -->
    <svg class="match-svg" width={CANVAS_W} height={CANVAS_H}>
      {#each matchLines as ln}
        <line x1={ln.x} y1={ln.y1} x2={ln.x} y2={ln.y2} />
      {/each}
    </svg>

    <!-- Group handles (start + end) -->
    {#each groupHandles as gh}
      {@const ghInDrag = drag?.group.some(g => gh.ids.includes(g.id))}
      {#if !ghInDrag}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="group-handle left"
          style:left="{gh.startCol * CELL_W - 10}px"
          style:top="{gh.startRow * CELL_H}px"
          onpointerdown={(e) => startDrag(gh.anchorId, 'grid', e, true)}
          title="Drag to move connected group"
        ><span class="grip-dots"></span></div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="group-handle right"
          style:left="{gh.endCol * CELL_W}px"
          style:top="{gh.endRow * CELL_H}px"
          onpointerdown={(e) => startDrag(gh.anchorId, 'grid', e, true)}
          title="Drag to move connected group"
        ><span class="grip-dots"></span></div>
      {/if}
    {/each}

    <!-- Grid reads -->
    {#each gridReads as read (read.id)}
      {@const gm = drag?.group.find(g => g.id === read.id)}
      {@const inDrag = !!gm}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="grid-read"
        class:dragging={inDrag}
        class:grouped={!inDrag && groupedReadIds.has(read.id)}
        style:left="{inDrag ? drag!.x + gm!.dCol * CELL_W : read.col * CELL_W}px"
        style:top="{inDrag ? drag!.y + gm!.dRow * CELL_H : read.row * CELL_H}px"
        style:z-index={inDrag ? 100 : 1}
        onpointerdown={(e) => startDrag(read.id, 'grid', e)}
      >
        {#each read.sequence.split('') as base, i}
          <span
            class="base"
            class:match={!inDrag && matchSet.has(`${read.id}-${i}`)}
          >{base}</span>
        {/each}
      </div>
    {/each}

    {#if gridReads.length === 0 && trayReads.length > 0}
      <div class="grid-empty">Drag reads here to begin assembly</div>
    {/if}

  </div>

  <!-- HUD overlay — not affected by pan/zoom -->
  <div class="hud">
    {#if gridReads.length > 0}
      <div class="contig-row">
        <span class="contig-label">Contig ({contig.length} bp):</span>
        <span class="contig-seq">{#each contigData.bases as b}<span class:contig-match={b.supported}>{b.char}</span>{/each}</span>
      </div>
    {/if}
    <div class="hud-buttons">
      <button class="hud-btn" onclick={clearGrid} disabled={gridReads.length === 0}>Clear</button>
      <button class="hud-btn" onclick={resetView}>Reset view</button>
    </div>
  </div>

  <!-- Read tray (fixed at bottom, outside canvas) -->
  <div class="tray" bind:this={trayEl}>
    <div class="tray-header">
      <span class="tray-label">Reads ({trayReads.length})</span>
      <span class="tray-hint">Scroll to zoom · Drag empty space to pan</span>
    </div>
    <div class="tray-items">
      {#each trayReads as read (read.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="tray-read" onpointerdown={(e) => startDrag(read.id, 'tray', e)}>
          {#each read.sequence.split('') as base}
            <span class="base">{base}</span>
          {/each}
        </div>
      {/each}
      {#if trayReads.length === 0 && gridReads.length > 0}
        <span class="tray-empty">All reads placed</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .assembly-viewport {
    position: relative;
    flex: 1;
    align-self: stretch;
    overflow: hidden;
    border: 1px solid var(--brass-dark);
    border-radius: 6px;
    background: var(--bg-darkest);
    touch-action: none;
    cursor: grab;
  }

  .assembly-viewport:active {
    cursor: grabbing;
  }

  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 2000px;
    height: 1400px;
    z-index: 0;
  }

  /* ── Grid background ──────────────────────────── */
  .grid-bg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .grid-empty {
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    text-align: center;
    color: var(--parchment-aged);
    font-size: 0.85rem;
    font-style: italic;
    pointer-events: none;
  }

  /* ── SVG lines ────────────────────────────────── */
  .match-svg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .match-svg line {
    stroke: #ff6b6b;
    stroke-width: 1;
    opacity: 0.5;
  }

  /* ── Grid reads ───────────────────────────────── */
  .grid-read {
    position: absolute;
    display: flex;
    padding: 2px 0;
    cursor: grab;
    user-select: none;
    border-radius: 3px;
    background: rgba(30, 30, 30, 0.6);
  }

  .grid-read.dragging {
    cursor: grabbing;
    box-shadow: 2px 3px 10px rgba(0, 0, 0, 0.5);
    background: rgba(30, 30, 30, 0.85);
  }

  /* ── Group handle ─────────────────────────────── */
  .group-handle {
    position: absolute;
    width: 10px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    z-index: 2;
    background: rgba(207, 174, 110, 0.12);
    border: 1px solid rgba(207, 174, 110, 0.25);
  }

  .group-handle.left {
    border-radius: 3px 0 0 3px;
    border-right: none;
  }

  .group-handle.right {
    border-radius: 0 3px 3px 0;
    border-left: none;
  }

  .grip-dots {
    display: block;
    width: 6px;
    height: 14px;
    background-image: radial-gradient(circle, var(--brass) 1px, transparent 1px);
    background-size: 3px 4px;
    opacity: 0.7;
  }

  .group-handle:hover {
    background: rgba(207, 174, 110, 0.25);
  }

  .group-handle:hover .grip-dots {
    opacity: 1;
  }

  .group-handle:active {
    cursor: grabbing;
  }

  /* ── Grouped read subtle highlight ────────────── */
  .grid-read.grouped {
    box-shadow: 0 0 0 1px rgba(207, 174, 110, 0.2);
  }

  /* ── Base cells ───────────────────────────────── */
  .base {
    display: inline-block;
    width: 11px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 22px;
    color: var(--parchment);
  }

  .base.match {
    color: #ff6b6b;
    font-weight: 700;
  }

  /* ── HUD overlay ──────────────────────────────── */
  .hud {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    pointer-events: none;
  }

  .hud > * {
    pointer-events: auto;
  }

  .contig-row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
    background: rgba(20, 18, 14, 0.8);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .contig-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--parchment-aged);
    flex-shrink: 0;
  }

  .contig-seq {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--parchment);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contig-match {
    color: #ff6b6b;
    font-weight: 700;
  }

  .hud-buttons {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .hud-btn {
    padding: 3px 10px;
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    background: rgba(20, 18, 14, 0.85);
    color: var(--parchment-aged);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    cursor: pointer;
  }

  .hud-btn:hover:not(:disabled) {
    border-color: var(--brass);
    color: var(--parchment);
  }

  .hud-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* ── Read tray (fixed at bottom of viewport) ─── */
  .tray {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    background: var(--bg-dark);
    border-top: 1px solid var(--brass-dark);
  }

  .tray-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tray-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--parchment-aged);
  }

  .tray-hint {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--parchment-aged);
    opacity: 0.6;
  }

  .tray-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tray-read {
    display: flex;
    padding: 4px 2px;
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    cursor: grab;
    touch-action: none;
  }

  .tray-read:hover {
    border-color: var(--brass);
  }

  .tray-read:active {
    cursor: grabbing;
  }

  .tray-empty {
    color: var(--parchment-aged);
    font-size: 0.8rem;
    font-style: italic;
  }
</style>
