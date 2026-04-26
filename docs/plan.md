# Cell-Lab: Promoter Architect Prototype

## Context

The core problem with instrument levels (L1–L9): the instrument does the work. Player clicks Run, reads result. Passive. No authorship.

**The shift:** Replace diagnostic instruments with a construction playground — the player authors a gene regulation circuit by placing binding sites along a DNA rail. Expression updates continuously as they drag, giving instant physical feedback (like eterna's real-time folding). No submit button. No vocabulary needed. Two things can't occupy the same space — you see it, you adjust.

**Why this works where Protocol Assembler didn't:** Protocol Assembler steps had names ("Add Primary Antibody") that required biology vocabulary. Promoter Architect has no names — just shapes that occupy space. The player discovers the rules by watching the expression bar react to their placement.

**What's already done:** L1–L9 silver-bullet fixes complete. Promoter Architect introduces a new level type (`promoter-architect`) that runs independently.

---

## Eight Puzzles (Ordered for Reasoning Arc)

### PA1 — "The Switch" (tutorial — proximity)
**Briefing:** "The construct is silent. Place the activator protein close enough to the promoter to turn it on."
- Rail: 200bp. Promoter at 100bp. Activation range: 50bp.
- Palette: one activator tile (footprint 20bp).
- Expression bar fills as activator approaches. ≥95% → complete.
- Designed to be solved in under 60 seconds. Its purpose is to teach the drag mechanic and establish the distance rule before anything else.

### PA2 — "The Guard" (steric competition — first "aha")
**Briefing:** "A repressor protein is blocking the gene. Find a way to displace it."
- Repressor pre-placed at position 90–110bp (overlapping promoter, footprint 20bp). Fixed.
- Palette: one activator tile (footprint 20bp).
- Rule: if activator footprint overlaps repressor footprint → repressor displaced, expression on.
- The player discovers: you can knock things off by landing on them. This is the first moment where the player does something surprising and it works. That's the early hook.

### PA3 — "Two Masters" (balancing — first real brain puzzle)
**Briefing:** "You need both of these genes running at full strength. They share the same stretch of DNA."
- Rail: 300bp. Gene A promoter at 80bp, Gene B promoter at 220bp. Both must reach ≥90%.
- Palette: two activator tiles (footprint 20bp each).
- Expression computed per promoter. Success only when BOTH ≥ 90%.
- Spatial tension: a site centered on Gene A is 140bp from Gene B — out of range. Player must split activators.
- Solution space: wide. By now the player has enough understanding to reason before dragging.

### PA4 — "The Cliff" (sigmoid threshold — "hunt" puzzle)
**Briefing:** "This sensor only triggers past a certain activation level. The response isn't gradual."
- Rail: 200bp. Single promoter at 100bp. `curveType: 'sigmoid'`.
- **Potential glow**: as the activator approaches the threshold distance (~40bp), the DNA rail begins to visibly pulse/glow with increasing intensity before the expression bar snaps. This pre-signal prevents the cliff from feeling like a black box — the player sees the system building tension before the snap.
- Sigmoid cliff wobble applies: expression bar jitter peaks at 50% (the inflection point).
- Arrives after the player has solid footing in all three prior mechanics.

### PA5 — "The Stress Response" (combined — min/max constraints)
**Briefing:** "The cell is failing. Keep the Survival gene at full power. Don't let the Growth gene overheat."
- Rail: 300bp. Gene A (Survival) at 80bp, Gene B (Growth) at 200bp.
- Success: Gene A ≥ 90% AND Gene B ≤ 60% simultaneously.
- Palette: one activator + one repressor (footprint 20bp each).
- Cooperative snapping: two sites within 15bp → 1.8× boost (alternative solution path).
- Player can reason the solution before dragging: "activator near 80, repressor near 200." Execution requires avoiding collision and tuning both bars simultaneously.

### PA6 — "The Oscillator" (conditional logic — "holy crap" moment)
**Briefing:** "This gene network must survive two conditions. When the safety signal is present, the Growth gene runs. When it's absent, Growth must pause but Survival must stay on."
- Rail: 300bp. Two promoters — Survival (Gene A) at 80bp, Growth (Gene B) at 200bp.
- **Two-state visualization**: the UI shows the rail twice vertically — "State 1: Safety present" (repressor at 250bp, far from both genes) and "State 2: Safety absent" (repressor at 180bp, near Gene B). Both states display their own expression bars.
- Success: State 1 — both genes ≥ 90%. State 2 — Gene A ≥ 90% AND Gene B ≤ 20%.
- Palette: two activators + one repressor (player-draggable; the environment repressor location is shown dimmed in each state row).
- Player places sites once; circuit is evaluated against both states simultaneously.
- The linked ghost preview shows both state rows at once — player sees how one drag position affects both conditions before releasing.

### PA7 — "The Cascade" (sequential unlock — tech tree)
**Briefing:** "The incoming signal is too weak on its own. Build a relay — the first gene must power the second."
- Rail: 400bp. Three promoters — Gene A at 80bp, Gene B at 200bp, Gene C at 320bp.
- Palette initially: two activators. When Gene A expression ≥ 95%, a third activator unlocks (via `conditionalSites`), appearing with a scale-in animation.
- Success: all three genes ≥ 90%.
- Spatial tension: activating Gene A to 95% requires tight placement, leaving limited room for Gene B/C without collisions.
- The "aha": the bonus activator appearing IS the cascade — Gene A's expression producing the tool for the next step.

### PA8 — "The Autoregulator" (negative feedback — final boss)
**Briefing:** "This protein becomes toxic at high levels. Design a construct that regulates itself."
- Rail: 200bp. Single promoter at 100bp. `curveType: 'sigmoid'`.
- `conditionalSites`: when Gene A expression ≥ 50%, a shadow repressor unlocks in the palette.
- Player places the shadow repressor on the rail.
- Goal: stabilize Gene A expression between 30–50% (system must settle into stable state, not a one-time threshold).
- Oscillating failure: shadow repressor too close → expression drops below 50%, repressor deactivates, expression climbs back → bar oscillates visibly.
- Stable solution: place shadow repressor at the sigmoid cliff edge (~40bp from promoter) — a tiny expression increase causes large repression increase → stable equilibrium at ~49%.
- This is the payoff for learning PA4: the sigmoid cliff discovered by exploration is now the precision tool for a completely different problem.

---

## Expression Formula (pure, no side effects)

For multi-promoter puzzles (PA3, PA5–PA7), the formula runs once per promoter entry. Success condition: all promoter targets satisfied simultaneously (both `minExpression` and `maxExpression` bounds where set).

`promoters: PromoterTarget[]` — see types section. Each entry has `positionBp`, `label`, optional `minExpression` (default 0.95), optional `maxExpression` (no cap by default).

```typescript
type CurveType = 'linear' | 'sigmoid';

// All site positions are left-edge bp on rail
function calcExpression(
  placed: PlacedSite[],
  sites: PromoterSite[],
  promoterBp: number,
  rangeBp: number,
  curveType: CurveType = 'linear',
  cooperativeDistBp = 15,
  cooperativeBoost = 1.8,
): number {
  // Collision: any two footprints overlap → both colliding, neither contributes
  const colliding = new Set<string>();
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      const sa = sites.find(s => s.id === a.siteId)!;
      const sb = sites.find(s => s.id === b.siteId)!;
      if (a.positionBp < b.positionBp + sb.footprintBp && b.positionBp < a.positionBp + sa.footprintBp) {
        colliding.add(`${a.siteId}:${i}`);
        colliding.add(`${b.siteId}:${j}`);
      }
    }
  }
  const active = placed.filter((_, i) => !colliding.has(`${placed[i].siteId}:${i}`));

  const rawContrib = (p: PlacedSite): number => {
    const site = sites.find(s => s.id === p.siteId)!;
    const center = p.positionBp + site.footprintBp / 2;
    const dist = Math.abs(center - promoterBp);
    if (dist >= rangeBp) return 0;
    const linear = 1 - dist / rangeBp;
    if (curveType === 'linear') return linear;
    // Hill sigmoid: n=4, K=0.5 of rangeBp
    const x = linear;
    return (x ** 4) / (0.5 ** 4 + x ** 4);
  };

  // Cooperative snapping: activator pairs within cooperativeDistBp → boost both
  const activators = active.filter(p => sites.find(s => s.id === p.siteId)!.role === 'activator');
  const repressors = active.filter(p => sites.find(s => s.id === p.siteId)!.role === 'repressor');

  const isCooperative = (p: PlacedSite): boolean =>
    activators.some(q => q !== p && Math.abs(q.positionBp - p.positionBp) <= cooperativeDistBp);

  if (activators.length === 0) return 0;
  const activatorScore = activators.reduce((acc, p) => {
    const boost = isCooperative(p) ? cooperativeBoost : 1;
    return acc * Math.min(1, rawContrib(p) * boost); // all must contribute (AND logic)
  }, 1);
  const repressorScore = repressors.reduce((acc, p) => Math.max(acc, rawContrib(p)), 0);

  return activatorScore * (1 - repressorScore);
}
```

PA5 success condition: `Gene A calcExpression ≥ 0.9 AND Gene B calcExpression ≤ 0.6`

---

## Implementation Plan

### New Types — `lab-types.ts`

Add to existing file:
```typescript
export interface PromoterSite {
  id: string;
  label: string;
  role: 'activator' | 'repressor';
  footprintBp: number;
  color: string;
}

export interface PlacedSite {
  siteId: string;
  positionBp: number;   // left-edge bp position on rail
  fixed?: boolean;      // if true: not draggable by player (pre-placed repressor in PA4)
}

export interface PromoterTarget {
  positionBp: number;
  label: string;
  /** min expression required (default 0.95); set <1 to allow partial */
  minExpression?: number;
  /** max expression allowed (undefined = no cap); used in PA5 for Gene B ≤ 0.6 */
  maxExpression?: number;
}

export interface PromoterPuzzleData {
  railLengthBp: number;
  activationRangeBp: number;
  promoters: PromoterTarget[];          // one per gene; replaces single promoterPositionBp
  availableSites: PromoterSite[];       // palette items (draggable)
  fixedSites?: PlacedSite[];            // pre-placed, not draggable (e.g., PA4 repressor)
  curveType?: 'linear' | 'sigmoid';    // default 'linear'; 'sigmoid' used in PA3
  cooperativeDistBp?: number;           // default 15
  cooperativeBoost?: number;            // default 1.8
  /** PA6: evaluate the circuit under multiple fixed-site configurations simultaneously */
  states?: Array<{
    label: string;             // e.g., "Safety ON", "Safety OFF"
    fixedSites: PlacedSite[];
  }>;
  /** PA7/PA8: palette items that unlock when a promoter hits a threshold */
  conditionalSites?: ConditionalSite[];
  // When states is defined, success = all promoter targets met in ALL states simultaneously
}

export interface ConditionalSite {
  site: PromoterSite;
  /** Index into promoters[] to watch */
  unlocksWhenPromoterIndex: number;
  /** Expression threshold to cross for unlock */
  minExpression: number;
}
```

Add `'promoter-architect'` to `LabInstrumentType` union.
Add `promoterData?: PromoterPuzzleData` field to `LabPuzzle`.

### New Component — `PromoterArchitect.svelte`

Props: `{ data: PromoterPuzzleData; onpuzzlecomplete: () => void }`

State (Svelte 5 runes):
- `placedSites = $state<PlacedSite[]>(data.fixedSites ?? [])` — includes pre-placed fixed sites
- `dragging = $state<{ siteId: string; startX: number; currentBp: number } | null>(null)`
- `expression = $derived(calcExpression(placedSites, ...))`

**UI layout (top→bottom):**
1. **DNA rail** (full width, ~600px, height 80px)
   - Background: gray double-line (DNA backbone), tick marks every 10bp
   - Promoter(s): distinct arrow marker at each `promoters[i].positionBp`; labeled with `promoters[i].label`
   - Activation range: shaded zone centered on promoter — **glows brighter** (higher opacity/saturation) when any protein's footprint overlaps the zone. Implemented as a `$derived` CSS class toggled by whether any placed site center is within `activationRangeBp`.
   - Placed proteins: colored rounded-rect above/below backbone, positioned by `left = positionBp * scale`
   - Colliding proteins: red border + CSS shake animation (existing `gap-shake` keyframe pattern from DnaStrand.svelte can be reused)
2. **Palette** (below rail, flex row)
   - Available site tiles: label + color chip, `draggable`
   - `pointerdown` → start drag, create ghost
3. **Expression bars** (below palette)
   - One bar per promoter. Single-promoter puzzles (PA1, PA2, PA4, PA8): one green bar. Multi-promoter puzzles (PA3, PA5–PA7): colored bars — Gene A blue (`#3b82f6`), Gene B amber (`#f59e0b`), Gene C purple (`#a855f7`).
   - `width: expression * 100%`, smooth CSS `transition: width 120ms ease`
   - **Wobble**: stochastic ±2% jitter recalculated every 800ms via `setInterval` inside `$effect` (cleanup on destroy). Amplitude = `(1 - expression) * 0.02` — jitter collapses when stable.
   - **Multi-bar completion flash**: when all promoter targets are met, all bars briefly flash green (`#22c55e`) before `onpuzzlecomplete` fires.
   - **Collision state**: proteins shake (≥ 3 rapid lateral oscillations, ±6px — more violent than DnaStrand's gap-shake). Affected bars drop to 0 and turn red while collision persists.

**Drag implementation** (pointer events, matching AssemblyWorkspace pattern):
- `pointerdown` on palette tile: capture pointer, set `dragging`
- `pointermove` on document: update `dragging.currentBp = clampedBp`
- `pointerup`: push to `placedSites`, clear `dragging`
- Snap to 5bp increments for usability
- Clamp to rail bounds (0 to `railLengthBp - site.footprintBp`)
- Already-placed sites: `pointerdown` picks them back up (remove from `placedSites`, start dragging)
- **Ghost preview**: while dragging, render a translucent protein shape on the rail at `dragging.currentBp` with its activation range shaded beneath it. For multi-promoter puzzles (PA2, PA5), the ghost highlights every promoter within activation range at the current position. For multi-state puzzles (PA6), the ghost appears simultaneously on ALL state rail rows — player sees how one placement affects both conditions before releasing. Implemented as a `$derived` overlay computed from `dragging.currentBp`.

**Sigmoid cliff wobble**: In PA3 (`curveType === 'sigmoid'`), wobble amplitude is scaled by how close expression is to the inflection point — `amplitude = 0.04 * (1 - |expression - 0.5| * 2)`. Maximum jitter at 50% expression (the cliff edge), collapses on either side.

**Conditional palette unlocks (PA7/PA8):**
```svelte
let unlockedSites = $derived(
  (data.conditionalSites ?? [])
    .filter(cs => calcExpression(placedSites, data.availableSites, data.promoters[cs.unlocksWhenPromoterIndex].positionBp, data.activationRangeBp, data.curveType) >= cs.minExpression)
    .map(cs => cs.site)
);
let palette = $derived([...data.availableSites, ...unlockedSites]);
```
Newly unlocked sites appear in the palette with a brief scale-in animation.

**Completion:** 
```
$effect(() => {
  if (allPromotersMeetTarget) {
    // brief gold DNA rail flash (CSS class toggle, 600ms)
    railFlashing = true;
    setTimeout(() => { railFlashing = false; onpuzzlecomplete(); }, 600);
  }
});
```
Gold flash: `.dna-rail.flashing { animation: rail-flash 600ms ease; }` — `@keyframes rail-flash { 50% { box-shadow: 0 0 24px #fbbf24; background: #fef3c7; } }`

### `lab-puzzles.ts` Changes

Add after existing puzzles:
```typescript
export const PUZZLE_PA_SWITCH: LabPuzzle = {
  id: 'PA1', title: 'The Switch',
  briefing: 'The construct is silent. Place the activator protein close enough to the promoter to turn on expression.',
  reference: { geneTable: [] },
  acceptedAnswers: [],
  instruments: ['promoter-architect'],
  promoterData: {
    railLengthBp: 200,
    activationRangeBp: 50,
    promoters: [{ positionBp: 100, label: 'Gene A' }],
    availableSites: [{ id: 'act1', label: 'Activator', role: 'activator', footprintBp: 20, color: '#22c55e' }],
  },
};
// PA2: fixedSites: [{siteId:'rep-fixed', positionBp:90, fixed:true}] (pre-placed repressor)
// PA3: promoters: [{positionBp:80,...},{positionBp:220,...}] (two genes)
// PA4: curveType: 'sigmoid'
// PA5: promoters with maxExpression on Gene B target
// PA6: states: [{label:'Safety ON',fixedSites:[...]},{label:'Safety OFF',fixedSites:[...]}]
// PA7: conditionalSites: [{unlocksWhenPromoterIndex:0, minExpression:0.95, site:{...}}]
// PA8: curveType:'sigmoid' + conditionalSites for shadow repressor unlock at 0.5
```

Puzzles are added to `LAB_PUZZLES` array after L9.

**No answer sheet** for PA puzzles — `acceptedAnswers: []` and `instruments: ['promoter-architect']` only. Completion fires from `onpuzzlecomplete` callback (same pattern as AssemblyWorkspace in App.svelte line 775–781).

### `App.svelte` Changes

1. Import `PromoterArchitect` component
2. Add branch to instrument dispatch block:
   ```svelte
   {:else if labInstrument === 'promoter-architect' && isLabPuzzle && labPuzzle.promoterData}
     <PromoterArchitect data={labPuzzle.promoterData} onpuzzlecomplete={() => puzzleComplete = true} />
   ```
3. Instrument sidebar: no button shown for `'promoter-architect'` (it's the only instrument) — or hide the sidebar tab entirely for PA levels.

### Existing instruments (L1–L9) unchanged

`'promoter-architect'` is additive. No existing types or components touched except the two additions above.

---

## Critical Files

- [prototypes/cell-lab/lib/lab-types.ts](prototypes/cell-lab/lib/lab-types.ts) — add PromoterSite, PlacedSite, PromoterTarget, PromoterPuzzleData; extend LabInstrumentType and LabPuzzle
- [prototypes/cell-lab/lib/lab-puzzles.ts](prototypes/cell-lab/lib/lab-puzzles.ts) — add PUZZLE_PA_SWITCH, PUZZLE_PA_GUARD, PUZZLE_PA_TWO_MASTERS, PUZZLE_PA_CLIFF, PUZZLE_PA_STRESS, PUZZLE_PA_OSCILLATOR, PUZZLE_PA_CASCADE, PUZZLE_PA_AUTOREGULATOR
- [prototypes/cell-lab/components/PromoterArchitect.svelte](prototypes/cell-lab/components/PromoterArchitect.svelte) — new component
- [prototypes/cell-lab/App.svelte](prototypes/cell-lab/App.svelte) — import + dispatch branch (reference existing assembly branch at ~line 775)

---

## Future Direction (post-prototype)

### Tier 2 — Cascade & Autoregulation

**PA7 — "The Cascade" (sequential logic / tech tree)**
- Three genes in sequence: Gene A → Gene B → Gene C. Each gene's expression unlocks a bonus activator for the next.
- Implementation requires: `conditionalUnlocks?: Array<{ whenPromoterIndex: number; minExpression: number; unlocksSlot: PromoterSite }>` in PromoterPuzzleData. Component watches expression and adds items to palette when thresholds cross.
- Teaches: sequential signal amplification. Proves the system can be a campaign engine.

**PA8 — "The Autoregulator" (negative feedback / homeostasis)**
- Gene A's own protein represses itself when expression > 50%. A "shadow repressor" appears on the rail; player places its binding site.
- Implementation requires: `shadowRepressor?: { spawnsWhenExpression: number; site: PromoterSite }`. Component spawns a player-placeable element when expression crosses the threshold.
- Goal: stabilize Gene A expression at exactly ~49% — riding the sigmoid cliff from PA4.
- Failure mode: site too close → bar oscillates wildly. Site at the cliff edge → bar locks at 49%. The sigmoid rule from PA4 is the solution tool, not the problem. That's the payoff moment.
- Teaches: feedback loops, homeostasis. This is the bridge to the Bio-Reactor Manager.

### Tier 3 — Bio-Reactor Manager
Promoter Architect as a sub-tool inside a living macro simulation. Player watches a vat turn yellow, opens the Architect, designs the circuit, watches the vat respond. The cell visualization becomes the 2D feedback that replaces the abstract expression bar — cell membrane color, organelle pulse rate. The "pressure" is external and continuous rather than a static threshold.

---

## Build Order

1. New types in `lab-types.ts` (all 4 new interfaces + LabInstrumentType/LabPuzzle extensions)
2. `PromoterArchitect.svelte` — DNA rail, drag, expression bar, ghost preview. Build against hardcoded PA1 data.
3. All 8 puzzle definitions in `lab-puzzles.ts` + `App.svelte` routing
4. Playtest in browser: PA1 should be solved in under 60 seconds, PA2 delivers the first "aha." If PA1 takes longer, widen activation range or increase expression bar sensitivity.
5. Tune wobble, sigmoid cliff wobble, potential glow, and collision shake intensities against real feel
6. Verify PA5 (stress response) is solvable — activator near 80bp, repressor near 200bp, both bars simultaneously meet their target
7. Test PA6 (oscillator): two-state layout must be readable without animation — if not, add state tabs instead of vertical split
8. Test PA8 (autoregulator): shadow repressor must cause visible oscillation when placed too close; stabilize at ~49% when placed at cliff edge

## Verification

- PA1: expression bar fills as activator approaches promoter center (100bp); reaches ≥95% when within 50bp; gold rail flash fires; `puzzleComplete = true`
- PA2: pre-placed repressor occupies promoter zone (90–110bp), expression = 0 initially; dropping activator on repressor footprint displaces it, expression turns on; gold flash fires
- PA3: two expression bars (blue/amber); expression = 0 for both when activators overlap (red shake); both reach ≥90% when each activator is within range of its respective promoter
- PA4: bar stays near 0 far from promoter; DNA rail pulses/glows with increasing intensity as activator approaches threshold; bar snaps sharply past ~40bp; wobble peaks at 50% expression (inflection point); collapses when locked in
- PA5: Gene A bar must reach ≥90% AND Gene B bar must stay ≤60% simultaneously; cooperative boost visible when two sites are ≤15bp apart
- PA6 (oscillator): two-state layout renders both state rows on screen simultaneously; player's placed sites are mirrored in both states; success requires all bars in both states to meet their targets at the same time
- PA7 (cascade): bonus activator appears in palette (with scale-in animation) when Gene A expression crosses 95%; all three genes must reach target simultaneously
- PA8 (autoregulator): shadow repressor unlocks in palette when Gene A ≥ 50%; placing it too close causes visible bar oscillation; stable equilibrium achievable at sigmoid cliff edge; success = Gene A expression stays between 30-50%
- Ghost preview: activation range shaded beneath dragging ghost; promoter markers glow when ghost is in range
- L1–L9 unaffected — no existing types or components changed
- TypeScript: no errors, no `any`
