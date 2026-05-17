<script lang="ts">
  import type { PlacedPart, PartDef, EngineOutput, PartStateKind } from '../lib/types';
  import { PARTS_DEF_MAP } from '../lib/parts-grammar';
  import { CX, CY, R, pointOnRing, partAnglesFor } from '../lib/plasmid-utils';

  interface Props {
    parts: PlacedPart[];
    engineOutput?: EngineOutput | null;
    hostMode?: 'bacterial' | 'eukaryotic';
    onplace?: (defId: string, afterIndex: number) => void;
    onremove?: (instanceId: string) => void;
    onreorder?: (fromIndex: number, toIndex: number) => void;
  }

  interface EnhancerParticle {
    id: number;
    fromInstanceId: string;
    toInstanceId: string;
    progress: number;
    opacity: number;
  }

  let { parts, engineOutput = null, hostMode = 'bacterial', onplace, onremove, onreorder }: Props = $props();

  let enhancerParticles = $state<EnhancerParticle[]>([]);
  let nextParticleId = 0;

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
    insulator: '|',
    'signal-sequence': 'S',
  };

  function angleForInstance(instanceId: string): number | null {
    const idx = parts.findIndex((part) => part.instanceId === instanceId);
    return idx < 0 ? null : partAngles[idx];
  }

  function loopPath(fromInstanceId: string, toInstanceId: string): string | null {
    const fromAngle = angleForInstance(fromInstanceId);
    const toAngle = angleForInstance(toInstanceId);
    if (fromAngle === null || toAngle === null) return null;

    const from = pointOnRing(fromAngle, R - 6);
    const to = pointOnRing(toAngle, R - 6);
    return `M ${from.x} ${from.y} Q ${CX} ${CY} ${to.x} ${to.y}`;
  }

  function effectLabelPoint(instanceId: string): { x: number; y: number } | null {
    const angle = angleForInstance(instanceId);
    return angle === null ? null : pointOnRing(angle, R - 34);
  }

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

  function stateLabel(part: PlacedPart): string {
    if (!engineOutput) return '';
    const state = engineOutput.partStates[part.instanceId]?.state;
    const def = partDef(part);
    if (!state || !def) return '';
    if (state === 'blocked') return 'blocked';
    if (state === 'repressed' && def.type === 'promoter') return 'off';
    if (state === 'read-through') return 'read';
    return '';
  }

  function stateClass(instanceId: string): string {
    return engineOutput?.partStates[instanceId]?.state ?? '';
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

  function hexagonPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60) * Math.PI / 180;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  }

  function quadraticBezierPoint(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number,
  ): { x: number; y: number } {
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    };
  }

  $effect(() => {
    let frameId = 0;
    let lastTime = 0;

    function tick(now: number): void {
      frameId = requestAnimationFrame(tick);
      const dt = lastTime === 0 ? 16 : Math.min(50, now - lastTime);
      lastTime = now;

      if (!engineOutput) {
        enhancerParticles = [];
        return;
      }

      // Move existing particles forward
      enhancerParticles = enhancerParticles
        .map(p => ({ ...p, progress: p.progress + dt * 0.00065 }))
        .filter(p => p.progress < 1);

      // Spawn new particles for active enhancer links (cap 2 per link)
      for (const link of engineOutput.enhancerLinks) {
        if (!link.promoterInstanceId) continue;
        const inFlight = enhancerParticles.filter(
          p => p.fromInstanceId === link.enhancerInstanceId && p.toInstanceId === link.promoterInstanceId
        ).length;
        if (inFlight < 2 && Math.random() < 0.002 * dt) {
          enhancerParticles = [
            ...enhancerParticles,
            {
              id: nextParticleId++,
              fromInstanceId: link.enhancerInstanceId,
              toInstanceId: link.promoterInstanceId!,
              progress: 0,
              opacity: 1,
            },
          ];
        }
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  });
</script>

<svg
  class="plasmid-svg"
  class:simulated={engineOutput !== null}
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
    class="backbone-ring"
    cx={CX} cy={CY} r={R}
    fill="none"
    stroke="#374151"
    stroke-width="6"
  />

  {#if engineOutput}
    <!-- DNA double helix: colored base pairs (A-T blue/orange, G-C green/red) -->
    {#each Array(64) as _, i (i)}
      {@const angle = i * (360 / 64)}
      {@const inner = pointOnRing(angle, R - 5)}
      {@const mid = pointOnRing(angle, R)}
      {@const outer = pointOnRing(angle, R + 5)}
      {@const pairType = [0, 1, 2, 3, 1, 0, 3, 2][i % 8]}
      {@const col5 = ['#3b82f6','#f97316','#22c55e','#ef4444'][pairType]}
      {@const col3 = ['#f97316','#3b82f6','#ef4444','#22c55e'][pairType]}
      <line x1={inner.x} y1={inner.y} x2={mid.x} y2={mid.y} stroke={col5} stroke-width="1.6" opacity="0.72" pointer-events="none" />
      <line x1={mid.x} y1={mid.y} x2={outer.x} y2={outer.y} stroke={col3} stroke-width="1.6" opacity="0.72" pointer-events="none" />
    {/each}
  {/if}

  <!-- Direction arrow at top -->
  <text x={CX} y={CY - R - 14} text-anchor="middle" font-size="11" fill="#6b7280">↻ clockwise</text>

  {#if engineOutput}
    {#each engineOutput.enhancerLinks as link (`${link.enhancerInstanceId}-${link.promoterInstanceId ?? link.blockedByInstanceId ?? 'open'}`)}
      {#if link.promoterInstanceId}
        {@const path = loopPath(link.enhancerInstanceId, link.promoterInstanceId)}
        {@const labelPoint = effectLabelPoint(link.promoterInstanceId)}
        {#if path}
          <path d={path} class="enhancer-loop" />
          {#if labelPoint}
            <g transform="translate({labelPoint.x},{labelPoint.y})" class="effect-tag boost-tag">
              <rect x="-18" y="-8" width="36" height="16" rx="8" />
              <text y="4" text-anchor="middle">boost</text>
            </g>
          {/if}
        {/if}
      {:else if link.blockedByInstanceId}
        {@const path = loopPath(link.enhancerInstanceId, link.blockedByInstanceId)}
        {@const labelPoint = effectLabelPoint(link.blockedByInstanceId)}
        {#if path}
          <path d={path} class="enhancer-loop blocked" />
          {#if labelPoint}
            <g transform="translate({labelPoint.x},{labelPoint.y})" class="effect-tag blocked-tag">
              <rect x="-23" y="-8" width="46" height="16" rx="8" />
              <text y="4" text-anchor="middle">blocked</text>
            </g>
          {/if}
        {/if}
      {/if}
    {/each}
    <!-- Enhancer signal particles -->
    {#each enhancerParticles as particle (particle.id)}
      {@const fromAngle = angleForInstance(particle.fromInstanceId)}
      {@const toAngle = angleForInstance(particle.toInstanceId)}
      {#if fromAngle !== null && toAngle !== null}
        {@const p0 = pointOnRing(fromAngle, R - 6)}
        {@const p1 = { x: CX, y: CY }}
        {@const p2 = pointOnRing(toAngle, R - 6)}
        {@const pos = quadraticBezierPoint(p0, p1, p2, particle.progress)}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={4}
          fill="#fbbf24"
          opacity={particle.opacity * (1 - particle.progress * 0.4)}
          class="enhancer-particle"
          pointer-events="none"
        />
      {/if}
    {/each}
  {/if}

  <!-- Insert slots (drop targets) -->
  {#each insertAngles as angle, i (i)}
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
      class:active-state={stateClass(part.instanceId) === 'active'}
      class:blocked-state={stateClass(part.instanceId) === 'blocked'}
    />

    <!-- Repressor blocker hexagon for repressed promoters -->
    {#if def?.type === 'promoter' && stateClass(part.instanceId) === 'repressed' && engineOutput}
      <polygon
        points={hexagonPoints(pt.x, pt.y, 20)}
        fill="#ef444415"
        stroke="#ef4444"
        stroke-width="1.5"
        class="repressor-blocker"
        pointer-events="none"
      />
    {/if}

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

    {#if stateLabel(part)}
      <g transform="translate({pt.x + 13},{pt.y - 18})" class={`state-badge ${stateClass(part.instanceId)}`}>
        <rect x="-23" y="-7" width="46" height="14" rx="7" />
        <text y="4" text-anchor="middle">{stateLabel(part)}</text>
      </g>
    {/if}

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

  .plasmid-svg.simulated .backbone-ring {
    stroke: #1e293b;
    opacity: 0.72;
  }

  /* dna-ring and base-tick removed — replaced by colored base-pair lines in template */

  .enhancer-loop {
    fill: none;
    stroke: #f472b6;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-dasharray: 3 9;
    opacity: 0.46;
    pointer-events: none;
    animation: loop-flow 1.8s linear infinite;
  }

  .enhancer-loop.blocked {
    stroke: #ef4444;
    stroke-dasharray: 2 7;
    opacity: 0.5;
    animation-duration: 1.1s;
  }

  .effect-tag,
  .state-badge {
    pointer-events: none;
  }

  .effect-tag rect,
  .state-badge rect {
    fill: rgba(2, 6, 23, 0.84);
    stroke-width: 1;
  }

  .effect-tag text,
  .state-badge text {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    fill: #e5e7eb;
  }

  .boost-tag rect {
    stroke: rgba(244, 114, 182, 0.8);
  }

  .blocked-tag rect,
  .state-badge.blocked rect {
    stroke: rgba(239, 68, 68, 0.85);
  }

  .state-badge.active rect {
    stroke: rgba(34, 197, 94, 0.85);
  }

  .state-badge.repressed rect {
    stroke: rgba(148, 163, 184, 0.75);
  }

  .state-badge.read-through rect {
    stroke: rgba(56, 189, 248, 0.85);
  }

  .active-state {
    animation: state-pulse 1.3s ease-in-out infinite;
  }

  .blocked-state {
    stroke-dasharray: 4 4;
  }

  @keyframes loop-flow {
    to { stroke-dashoffset: -12; }
  }

  @keyframes state-pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.95; }
  }

  .repressor-blocker {
    pointer-events: none;
    animation: repressor-pulse 1.8s ease-in-out infinite;
  }

  @keyframes repressor-pulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }

  .enhancer-particle {
    filter: drop-shadow(0 0 3px #fbbf24);
  }
</style>
