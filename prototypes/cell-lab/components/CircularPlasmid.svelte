<script lang="ts">
  import type { PlacedPart, PartDef, EngineOutput, PartStateKind } from '../lib/types';
  import { PARTS_DEF_MAP } from '../lib/parts-grammar';
  import { CX, CY, R, pointOnRing, partAnglesFor } from '../lib/plasmid-utils';

  interface Props {
    parts: PlacedPart[];
    engineOutput?: EngineOutput | null;
    onplace?: (defId: string, afterIndex: number) => void;
    onremove?: (instanceId: string) => void;
    onreorder?: (fromIndex: number, toIndex: number) => void;
  }

  let { parts, engineOutput = null, onplace, onremove, onreorder }: Props = $props();

  // Compute each part's center angle
  const partAngles = $derived(partAnglesFor(parts.length));

  // Insert slot angles: halfway between parts (and before first)
  const insertAngles = $derived.by(() => {
    const n = parts.length;
    if (n === 0) return [0] as number[];
    const step = 360 / Math.max(n, 6);
    // slot i = before parts[i]
    return parts.map((_, i) => (i === 0 ? -step / 2 : i * step - step / 2));
  });

  const PART_ICONS: Record<string, string> = {
    promoter: '→',
    rbs: 'R',
    gene: '◆',
    linker: 'L',
    terminator: '⊣',
    tag: 'T',
    crispr: '✂',
    enhancer: '⬡',
    'signal-sequence': 'S',
  };

  function stateColor(instanceId: string): string {
    if (!engineOutput) return '#6b7280';
    const ps = engineOutput.partStates[instanceId];
    if (!ps) return '#6b7280';
    const map: Record<PartStateKind, string> = {
      active: '#22c55e',
      repressed: '#6b7280',
      blocked: '#ef4444',
      'read-through': '#38bdf8',
      silent: '#374151',
      inert: '#1f2937',
    };
    return map[ps.state] ?? '#6b7280';
  }

  // Drag state
  let hoverInsert = $state<number | null>(null);
  let dragFrom = $state<number | null>(null); // index of part being dragged
  let hoveredPartId = $state<string | null>(null);

  function handleDragOver(e: DragEvent, insertIdx: number) {
    e.preventDefault();
    hoverInsert = insertIdx;
  }

  function handleDragLeave() {
    hoverInsert = null;
  }

  function handleDropOnInsert(e: DragEvent, insertIdx: number) {
    e.preventDefault();
    hoverInsert = null;
    const defId = e.dataTransfer?.getData('text/plain');
    if (!defId) return;

    if (dragFrom !== null) {
      // Reordering existing part
      const toIdx = insertIdx > dragFrom ? insertIdx - 1 : insertIdx;
      if (toIdx !== dragFrom) onreorder?.(dragFrom, toIdx);
      dragFrom = null;
    } else if (defId) {
      // Placing new part from library
      onplace?.(defId, insertIdx);
    }
  }

  function handlePartDragStart(e: DragEvent, idx: number) {
    dragFrom = idx;
    e.dataTransfer?.setData('text/plain', parts[idx].defId);
  }

  function handlePartDragEnd() {
    dragFrom = null;
  }

  function handleDeleteClick(e: Event, idx: number) {
    e.stopPropagation();
    if (canRemovePart(idx)) {
      onremove?.(parts[idx].instanceId);
    }
  }

  function canRemovePart(idx: number): boolean {
    const prefilledCount = (parts.length > 0 && parts[0]?.instanceId.startsWith('pre'))
      ? parts.filter((p) => p.instanceId.startsWith('pre')).length
      : 0;
    return idx >= prefilledCount;
  }

  function partDef(p: PlacedPart): PartDef | undefined {
    return PARTS_DEF_MAP.get(p.defId);
  }
</script>

<svg
  class="plasmid-svg"
  viewBox="0 0 400 400"
  role="img"
  aria-label="Circular plasmid map"
>
  <!-- Filled plasmid body -->
  <circle
    cx={CX} cy={CY} r={R - 24}
    fill="#111827"
    opacity="0.92"
  />

  <!-- Backbone ring -->
  <circle
    cx={CX} cy={CY} r={R}
    fill="none"
    stroke="#374151"
    stroke-width="6"
  />

  <!-- Direction arrow at top -->
  <text x={CX} y={CY - R - 14} text-anchor="middle" font-size="11" fill="#6b7280">↻ clockwise</text>

  <!-- Insert slots (drop targets) -->
  {#each insertAngles as angle, i}
    {@const pt = pointOnRing(angle, R)}
    <circle
      cx={pt.x} cy={pt.y} r={hoverInsert === i ? 9 : 5}
      fill={hoverInsert === i ? '#3b82f6' : '#1f2937'}
      stroke={hoverInsert === i ? '#60a5fa' : '#4b5563'}
      stroke-width="1.5"
      style="cursor: crosshair; transition: r 0.1s"
      role="button"
      tabindex="0"
      aria-label="Insert part here"
      onmousedown={(e) => e.preventDefault()}
      ondragover={(e) => handleDragOver(e, i)}
      ondragleave={handleDragLeave}
      ondrop={(e) => handleDropOnInsert(e, i)}
    />
  {/each}

  <!-- Parts -->
  {#each parts as part, i (part.instanceId)}
    {@const angle = partAngles[i]}
    {@const def = partDef(part)}
    {@const pt = pointOnRing(angle, R)}
    {@const fillColor = def?.color ?? '#6b7280'}
    {@const stateRing = stateColor(part.instanceId)}
    {@const icon = PART_ICONS[def?.type ?? ''] ?? '?'}

    <!-- State ring -->
    <circle
      cx={pt.x} cy={pt.y} r={18}
      fill="none"
      stroke={stateRing}
      stroke-width="2"
      opacity="0.7"
    />

    <!-- Part body — draggable -->
    <g
      transform="translate({pt.x},{pt.y})"
      style="cursor: grab"
      draggable="true"
      role="button"
      tabindex="0"
      aria-label={def?.name ?? part.defId}
      onmousedown={(e) => e.preventDefault()}
      ondragstart={(e) => handlePartDragStart(e, i)}
      ondragend={handlePartDragEnd}
      onmouseenter={() => hoveredPartId = part.instanceId}
      onmouseleave={() => hoveredPartId = null}
      onfocus={() => hoveredPartId = part.instanceId}
      onblur={() => hoveredPartId = null}
    >
      <circle r={14} fill={fillColor} stroke="#111827" stroke-width="1.5" />
      <text
        text-anchor="middle"
        dominant-baseline="central"
        font-size="11"
        fill="white"
        font-weight="bold"
        style="pointer-events: none"
      >{icon}</text>
      {#if canRemovePart(i) && hoveredPartId === part.instanceId}
        <g
          class="delete-part"
          transform="translate(0,0)"
          role="button"
          tabindex="0"
          aria-label={`Delete ${def?.label ?? part.defId}`}
          onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onclick={(e) => handleDeleteClick(e, i)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleDeleteClick(e, i);
          }}
        >
          <circle r="7" />
          <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" />
        </g>
      {/if}
    </g>

    <!-- Label outside ring, horizontal text positioned radially outward from the node -->
    {@const labelRadius = R + (i % 2 === 0 ? 34 : 50)}
    {@const labelPt = pointOnRing(angle, labelRadius)}
    {@const labelText = def?.label ?? part.defId}
    <text
      x={labelPt.x}
      y={labelPt.y}
      text-anchor="middle"
      dominant-baseline="central"
      font-size="11"
      fill="#9ca3af"
      style="pointer-events: none"
    >{labelText}</text>

  {/each}

  <!-- Empty state hint -->
  {#if parts.length === 0}
    <text x={CX} y={CY - 12} text-anchor="middle" font-size="12" fill="#4b5563">
      Drop parts onto
    </text>
    <text x={CX} y={CY + 8} text-anchor="middle" font-size="12" fill="#4b5563">
      the ring to build
    </text>
    <text x={CX} y={CY + 24} text-anchor="middle" font-size="12" fill="#4b5563">
      your plasmid
    </text>
  {/if}
</svg>

<style>
  .plasmid-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    user-select: none;
  }

  .delete-part {
    cursor: pointer;
  }

  .delete-part circle {
    fill: #b91c1c;
    stroke: #fee2e2;
    stroke-width: 1;
  }

  .delete-part path {
    stroke: #ffffff;
    stroke-width: 1.4;
    stroke-linecap: round;
    pointer-events: none;
  }

  .delete-part:focus-visible circle {
    stroke: #fbbf24;
    stroke-width: 2;
  }
</style>
