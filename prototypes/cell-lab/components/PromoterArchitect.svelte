<script lang="ts">
  import type { PromoterPuzzleData, PlacedSite, PromoterTarget } from '../lib/lab-types';

  interface Props {
    data: PromoterPuzzleData;
    onpuzzlecomplete: () => void;
  }

  let { data, onpuzzlecomplete }: Props = $props();

  // All possible site definitions — lookup table for footprints/roles
  let allSiteDefs = $derived([
    ...data.availableSites,
    ...(data.siteLibrary ?? []),
    ...(data.conditionalSites?.map(cs => cs.site) ?? []),
  ]);

  // ── Expression formula ─────────────────────────────────────────────────────

  function calcExpression(
    placed: PlacedSite[],
    promoterBp: number,
    rangeBp: number,
    curveType: 'linear' | 'sigmoid' = 'linear',
    cooperativeDistBp = 15,
    cooperativeBoost = 1.8,
  ): number {
    // Collision: overlapping footprints → exclusion.
    // Same-role overlap: both excluded. Activator vs repressor: repressor displaced (activator wins).
    const colliding = new Set<string>();
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const sa = allSiteDefs.find(s => s.id === a.siteId);
        const sb = allSiteDefs.find(s => s.id === b.siteId);
        if (!sa || !sb) continue;
        if (a.positionBp < b.positionBp + sb.footprintBp && b.positionBp < a.positionBp + sa.footprintBp) {
          if (sa.role !== sb.role) {
            // Activator displaces repressor
            const repKey = sa.role === 'repressor' ? `${a.siteId}:${i}` : `${b.siteId}:${j}`;
            colliding.add(repKey);
          } else {
            colliding.add(`${a.siteId}:${i}`);
            colliding.add(`${b.siteId}:${j}`);
          }
        }
      }
    }
    const active = placed.filter((_, i) => !colliding.has(`${placed[i].siteId}:${i}`));

    const rawContrib = (p: PlacedSite): number => {
      const site = allSiteDefs.find(s => s.id === p.siteId);
      if (!site) return 0;
      const effectiveRange = site.activationRangeOverrideBp ?? rangeBp;
      const center = p.positionBp + site.footprintBp / 2;
      const dist = Math.abs(center - promoterBp);
      if (dist >= effectiveRange) return 0;
      const linear = 1 - dist / effectiveRange;
      if (curveType === 'linear') return linear;
      // Hill sigmoid n=4, K=0.5*range
      return (linear ** 4) / (0.5 ** 4 + linear ** 4);
    };

    const activators = active.filter(p => allSiteDefs.find(s => s.id === p.siteId)?.role === 'activator');
    const repressors = active.filter(p => allSiteDefs.find(s => s.id === p.siteId)?.role === 'repressor');

    // Only activators in range of this promoter contribute — fixes multi-promoter AND-product bug
    const activatorsInRange = activators.filter(p => rawContrib(p) > 0);
    if (activatorsInRange.length === 0) return 0;

    const isCooperative = (p: PlacedSite): boolean =>
      activatorsInRange.some(q => q !== p && Math.abs(q.positionBp - p.positionBp) <= cooperativeDistBp);

    // SUM with cooperative boost, clamped to 1 — each in-range activator adds independently
    const activatorScore = Math.min(1, activatorsInRange.reduce((acc, p) => {
      const boost = isCooperative(p) ? cooperativeBoost : 1;
      return acc + rawContrib(p) * boost;
    }, 0));
    const repressorScore = repressors.reduce((acc, p) => Math.max(acc, rawContrib(p)), 0);

    return activatorScore * (1 - repressorScore);
  }

  function getExpressions(placed: PlacedSite[]): number[] {
    return data.promoters.map(p =>
      calcExpression(placed, p.positionBp, data.activationRangeBp,
        data.curveType ?? 'linear', data.cooperativeDistBp, data.cooperativeBoost)
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────

  // Adaptive scale: fit rail into ~900px (viewport minus sidebar), max 3px/bp
  const SCALE = Math.min(3, Math.floor(900 / data.railLengthBp * 10) / 10);
  const SNAP_BP = 5;

  // eslint-disable-next-line svelte/valid-compile -- {#key} remounts on puzzle change, initial capture is intentional
  let placedSites = $state<PlacedSite[]>(
    (data.fixedSites ?? []).filter(s => s.fixed).map(s => ({ ...s }))
  );
  let dragging = $state<{ siteId: string; currentBp: number } | null>(null);
  // eslint-disable-next-line svelte/valid-compile -- same as above
  let wobbleOffsets = $state<number[]>(data.promoters.map(() => 0));
  let railFlashing = $state(false);
  let completed = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  let unlockedSites = $derived(
    (data.conditionalSites ?? [])
      .filter(cs => {
        const p = data.promoters[cs.unlocksWhenPromoterIndex];
        if (!p) return false;
        return calcExpression(placedSites, p.positionBp, data.activationRangeBp,
          data.curveType ?? 'linear') >= cs.minExpression;
      })
      .map(cs => cs.site)
  );

  let palette = $derived([...data.availableSites, ...unlockedSites]);

  // IDs currently unlocked (for animation detection)
  let unlockedIds = $derived(new Set(unlockedSites.map(s => s.id)));

  let expressions = $derived(getExpressions(placedSites));

  function effectivePlaced(stateIndex: number | null): PlacedSite[] {
    if (stateIndex === null || !data.states) return placedSites;
    return [...placedSites.filter(s => !s.fixed), ...data.states[stateIndex].fixedSites];
  }

  let allTargetsMet = $derived((() => {
    const checkExprs = (placed: PlacedSite[], promoters: PromoterTarget[]) => {
      const exprs = getExpressions(placed);
      return promoters.every((p, i) =>
        exprs[i] >= (p.minExpression ?? 0.95) && exprs[i] <= (p.maxExpression ?? 1)
      );
    };
    if (data.states && data.states.length > 0) {
      return data.states.every((state, si) =>
        checkExprs(effectivePlaced(si), state.promoterOverrides ?? data.promoters)
      );
    }
    return checkExprs(placedSites, data.promoters);
  })());

  // Wobble amplitude per promoter
  let wobbleAmplitude = $derived(expressions.map(expr => {
    const base = (1 - expr) * 0.02;
    if (data.curveType === 'sigmoid') {
      return base + 0.04 * Math.max(0, 1 - Math.abs(expr - 0.5) * 2);
    }
    return base;
  }));

  // Collision keys for currently placed sites (plus ghost)
  let collisionKeys = $derived((() => {
    const toCheck: PlacedSite[] = dragging
      ? [...placedSites, { siteId: dragging.siteId, positionBp: dragging.currentBp }]
      : placedSites;
    const keys = new Set<string>();
    for (let i = 0; i < toCheck.length; i++) {
      for (let j = i + 1; j < toCheck.length; j++) {
        const a = toCheck[i], b = toCheck[j];
        const sa = allSiteDefs.find(s => s.id === a.siteId);
        const sb = allSiteDefs.find(s => s.id === b.siteId);
        if (!sa || !sb) continue;
        if (a.positionBp < b.positionBp + sb.footprintBp && b.positionBp < a.positionBp + sa.footprintBp) {
          keys.add(`${a.siteId}:${i}`);
          keys.add(`${b.siteId}:${j}`);
        }
      }
    }
    return keys;
  })());

  // Which promoters are within the ghost's activation range
  let ghostPromoterInRange = $derived(
    data.promoters.map(p => {
      if (!dragging) return false;
      const site = allSiteDefs.find(s => s.id === dragging!.siteId);
      if (!site) return false;
      const center = dragging.currentBp + site.footprintBp / 2;
      const effectiveRange = site.activationRangeOverrideBp ?? data.activationRangeBp;
      return Math.abs(center - p.positionBp) < effectiveRange;
    })
  );

  // Whether any placed site overlaps each promoter's activation zone
  let promoterGlowing = $derived(
    data.promoters.map(p =>
      placedSites.some(ps => {
        const site = allSiteDefs.find(s => s.id === ps.siteId);
        if (!site) return false;
        const center = ps.positionBp + site.footprintBp / 2;
        return Math.abs(center - p.positionBp) < data.activationRangeBp;
      })
    )
  );

  // ── Wobble timer ───────────────────────────────────────────────────────────

  $effect(() => {
    const interval = setInterval(() => {
      wobbleOffsets = wobbleAmplitude.map(amp => (Math.random() - 0.5) * 2 * amp * 100);
    }, 800);
    return () => clearInterval(interval);
  });

  // ── Completion ─────────────────────────────────────────────────────────────

  $effect(() => {
    if (allTargetsMet && !completed) {
      completed = true;
      railFlashing = true;
      setTimeout(() => {
        railFlashing = false;
        onpuzzlecomplete();
      }, 700);
    }
  });

  // ── Drag logic ─────────────────────────────────────────────────────────────

  function clampBp(bp: number, siteId: string): number {
    const site = allSiteDefs.find(s => s.id === siteId);
    const footprint = site?.footprintBp ?? 20;
    return Math.max(0, Math.min(data.railLengthBp - footprint, Math.round(bp / SNAP_BP) * SNAP_BP));
  }

  let railRect = $state<DOMRect | null>(null);

  function onPointerDownPalette(e: PointerEvent, siteId: string) {
    const rail = (e.currentTarget as HTMLElement).closest('.pa-layout')?.querySelector<HTMLElement>('.rail-wrap');
    if (rail) railRect = rail.getBoundingClientRect();
    if (!railRect) return;
    const bp = clampBp((e.clientX - railRect.left) / SCALE, siteId);
    dragging = { siteId, currentBp: bp };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerDownPlaced(e: PointerEvent, index: number) {
    const ps = placedSites[index];
    if (ps.fixed) return;
    const rail = (e.currentTarget as HTMLElement).closest('.pa-layout')?.querySelector<HTMLElement>('.rail-wrap');
    if (rail) railRect = rail.getBoundingClientRect();
    dragging = { siteId: ps.siteId, currentBp: ps.positionBp };
    placedSites = placedSites.filter((_, i) => i !== index);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !railRect) return;
    dragging = { ...dragging, currentBp: clampBp((e.clientX - railRect.left) / SCALE, dragging.siteId) };
  }

  function onPointerUp() {
    if (!dragging) return;
    placedSites = [...placedSites, { siteId: dragging.siteId, positionBp: dragging.currentBp }];
    dragging = null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function barColor(i: number): string {
    const colors = ['#3b82f6', '#f59e0b', '#a855f7', '#22c55e'];
    if (data.promoters.length === 1) return '#22c55e';
    return colors[i % colors.length];
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="pa-layout"
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
>
  {#if data.states && data.states.length > 0}
    {#each data.states as state, si}
      <div class="state-block">
        <div class="state-label">{state.label}</div>
        {@render railRow(si)}
        {@render expressionBars(getExpressions(effectivePlaced(si)), state.promoterOverrides ?? data.promoters)}
      </div>
    {/each}
  {:else}
    {@render railRow(null)}
    {@render expressionBars(expressions, data.promoters)}
  {/if}

  <div class="palette">
    {#each palette as site}
      <div
        class="palette-tile {unlockedIds.has(site.id) ? 'new-unlock' : ''}"
        onpointerdown={(e) => onPointerDownPalette(e, site.id)}
        role="button"
        tabindex="0"
      >
        <div class="tile-dot" style:background={site.color}></div>
        <span>{site.label}</span>
      </div>
    {/each}
  </div>
</div>

{#snippet railRow(stateIndex: number | null)}
  {@const activePlaced = effectivePlaced(stateIndex)}
  {@const stateFixedSet = stateIndex !== null && data.states
    ? new Set(data.states[stateIndex].fixedSites.map(fs => `${fs.siteId}:${fs.positionBp}`))
    : new Set<string>()}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="rail-wrap {railFlashing ? 'flashing' : ''}" style:width="{data.railLengthBp * SCALE}px">
    <div class="backbone"></div>

    {#each data.promoters as promoter, pi}
      <div
        class="range-zone {promoterGlowing[pi] ? 'glowing' : ''}"
        style:left="{(promoter.positionBp - data.activationRangeBp) * SCALE}px"
        style:width="{data.activationRangeBp * 2 * SCALE}px"
      ></div>
    {/each}

    {#each data.promoters as promoter, pi}
      <div
        class="promoter-marker {ghostPromoterInRange[pi] ? 'in-range' : ''}"
        style:left="{promoter.positionBp * SCALE}px"
      >
        <div class="promoter-arrow">▶</div>
        <div class="promoter-lbl">{promoter.label}</div>
      </div>
    {/each}

    {#each activePlaced as ps, i}
      {@const site = allSiteDefs.find(s => s.id === ps.siteId)}
      {@const key = `${ps.siteId}:${i}`}
      {@const isColliding = collisionKeys.has(key)}
      {@const isFixed = ps.fixed || stateFixedSet.has(`${ps.siteId}:${ps.positionBp}`)}
      {#if site}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="protein {isColliding ? 'colliding' : ''} {isFixed ? 'fixed' : ''}"
          style:left="{ps.positionBp * SCALE}px"
          style:width="{site.footprintBp * SCALE}px"
          style:background={site.color}
          onpointerdown={isFixed ? undefined : (e) => onPointerDownPlaced(e, i)}
          role={isFixed ? 'img' : 'button'}
          tabindex={isFixed ? undefined : 0}
          aria-label={site.label}
        >
          <span class="protein-lbl">{site.label[0]}</span>
        </div>
      {/if}
    {/each}

    {#if dragging}
      {@const ghostSite = allSiteDefs.find(s => s.id === dragging!.siteId)}
      {#if ghostSite}
        {@const ghostRange = ghostSite.activationRangeOverrideBp ?? data.activationRangeBp}
        <div
          class="ghost-range"
          style:left="{(dragging.currentBp + ghostSite.footprintBp / 2 - ghostRange) * SCALE}px"
          style:width="{ghostRange * 2 * SCALE}px"
          style:background="{ghostSite.color}22"
          style:border-color="{ghostSite.color}55"
        ></div>
        <div
          class="protein ghost"
          style:left="{dragging.currentBp * SCALE}px"
          style:width="{ghostSite.footprintBp * SCALE}px"
          style:background="{ghostSite.color}77"
          style:border-color={ghostSite.color}
        >
          <span class="protein-lbl">{ghostSite.label[0]}</span>
        </div>
      {/if}
    {/if}
  </div>
{/snippet}

{#snippet expressionBars(exprs: number[], promoters: PromoterTarget[])}
  <div class="expr-bars">
    {#each promoters as promoter, i}
      {@const expr = exprs[i]}
      {@const pct = Math.round(expr * 100)}
      {@const wobble = wobbleOffsets[i] ?? 0}
      {@const displayPct = Math.round(Math.max(0, Math.min(100, pct + wobble)))}
      {@const color = barColor(i)}
      {@const minTarget = promoter.minExpression ?? 0.95}
      {@const maxTarget = promoter.maxExpression}
      {@const met = expr >= minTarget && expr <= (maxTarget ?? 1)}
      <div class="bar-row">
        <div class="bar-label" style:color={color}>{promoter.label}</div>
        <div class="bar-track">
          <div
            class="bar-fill {met ? 'met' : ''} {railFlashing && met ? 'flashing' : ''}"
            style:width="{displayPct}%"
            style:background={met ? '#22c55e' : color}
          ></div>
          <div class="target-line" style:left="{minTarget * 100}%"></div>
          {#if maxTarget !== undefined}
            <div class="target-line max" style:left="{maxTarget * 100}%"></div>
          {/if}
        </div>
        <div class="bar-pct">{displayPct}%</div>
      </div>
    {/each}
  </div>
{/snippet}

<style>
  .pa-layout {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    user-select: none;
    touch-action: none;
    overflow-x: auto;
  }

  .state-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .state-label {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Rail ── */
  .rail-wrap {
    position: relative;
    height: 76px;
    background: #111128;
    border: 1px solid #2d2d4e;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .rail-wrap.flashing {
    animation: rail-glow 0.7s ease;
  }

  .backbone {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 4px;
    margin-top: -2px;
    background: #374151;
    border-radius: 2px;
  }

  .range-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    background: rgba(34, 197, 94, 0.05);
    border-left: 1px dashed rgba(34, 197, 94, 0.18);
    border-right: 1px dashed rgba(34, 197, 94, 0.18);
    pointer-events: none;
    transition: background 0.25s, border-color 0.25s;
  }

  .range-zone.glowing {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.45);
  }

  .promoter-marker {
    position: absolute;
    top: 6px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  .promoter-arrow {
    font-size: 13px;
    color: #6b7280;
    line-height: 1;
    transition: color 0.2s, text-shadow 0.2s;
  }

  .promoter-marker.in-range .promoter-arrow {
    color: #22c55e;
    text-shadow: 0 0 8px #22c55e88;
  }

  .promoter-lbl {
    font-size: 11px;
    color: #6b7280;
    white-space: nowrap;
    margin-top: 2px;
  }

  /* ── Proteins ── */
  .protein {
    position: absolute;
    top: 50%;
    transform: translateY(-65%);
    height: 26px;
    border-radius: 5px;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0,0,0,0.45);
    transition: filter 0.1s, border-color 0.1s;
  }

  .protein:hover:not(.fixed):not(.ghost) {
    filter: brightness(1.18);
  }

  .protein.fixed {
    cursor: default;
    opacity: 0.75;
    border-style: dashed;
  }

  .protein.ghost {
    pointer-events: none;
    border-width: 2px;
    border-style: dashed;
    cursor: grabbing;
  }

  .protein.colliding {
    border-color: #ef4444 !important;
    animation: shake 0.28s ease infinite;
  }

  .protein-lbl {
    font-size: 11px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.65);
    pointer-events: none;
  }

  .ghost-range {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px dashed;
    border-right: 1px dashed;
    pointer-events: none;
  }

  /* ── Palette ── */
  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 4px;
  }

  .palette-tile {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #1c1c38;
    border: 1px solid #383870;
    border-radius: 8px;
    cursor: grab;
    font-size: 12px;
    color: #d1d5db;
    touch-action: none;
    transition: background 0.15s, border-color 0.15s;
  }

  .palette-tile:hover {
    background: #252550;
    border-color: #5555a0;
  }

  .palette-tile.new-unlock {
    animation: scale-in 0.3s ease;
    border-color: #f59e0b;
  }

  .tile-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Expression bars ── */
  .expr-bars {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bar-label {
    font-size: 11px;
    font-weight: 600;
    min-width: 48px;
  }

  .bar-track {
    flex: 1;
    height: 13px;
    background: #111128;
    border: 1px solid #2d2d4e;
    border-radius: 7px;
    overflow: hidden;
    position: relative;
  }

  .bar-fill {
    height: 100%;
    border-radius: 7px;
    transition: width 0.12s ease, background 0.25s;
  }

  .bar-fill.met {
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.45);
  }

  .bar-fill.flashing {
    animation: bar-flash 0.6s ease;
  }

  .target-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(255, 255, 255, 0.22);
    pointer-events: none;
  }

  .target-line.max {
    background: rgba(239, 68, 68, 0.4);
  }

  .bar-pct {
    font-size: 11px;
    color: #6b7280;
    min-width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Animations ── */
  @keyframes shake {
    0%, 100% { transform: translateY(-65%) translateX(0); }
    20%       { transform: translateY(-65%) translateX(-5px); }
    40%       { transform: translateY(-65%) translateX(5px); }
    60%       { transform: translateY(-65%) translateX(-4px); }
    80%       { transform: translateY(-65%) translateX(4px); }
  }

  @keyframes bar-flash {
    0%, 100% { filter: brightness(1); }
    40%      { filter: brightness(2); background: #22c55e !important; }
  }

  @keyframes scale-in {
    from { transform: scale(0.7); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  @keyframes rail-glow {
    50% { box-shadow: 0 0 28px #fbbf24aa; border-color: #fbbf24; background: #1d1808; }
  }
</style>
