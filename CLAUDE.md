# bio-logic — Claude Conventions

## Project

A biology lab simulation game (Papers Please meets Car Mechanic Simulator).
Primary prototype: `prototypes/svelte-lab-avatar/` — Svelte 5 + Tailwind 4.

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`) — no legacy Options API
- **TypeScript** strict mode
- **Tailwind 4** utility classes (configured via `base.css`)
- **Vite** build; entry points per prototype in `prototypes/`

## Code Placement Rules

Logic lives **in the `.svelte` component** unless there is a clear structural reason to extract it. Only break out to a `.ts` file when:

| Reason to extract | Naming convention |
|---|---|
| Shared reactive context (Svelte context API) | `*.svelte.ts` (e.g. `workbench-context.svelte.ts`) |
| Pure canvas/rendering logic | `renderers/plate-renderer.ts` |
| Pure simulation math / types | `culture/streak-types.ts`, `culture/colony-generator.ts` |
| Shared data types used across multiple files | `shared/types.ts` |

**Do not** create utility files named `utils.ts`, `helpers.ts`, or `culture-utils.ts`. Name files to describe *why* they exist, not what they contain.

## Component Conventions

- **Item-specific controls** (buttons, progress bars, hints) live **inside the item's own grid tile component** (`BunsenBurnerItem.svelte`, `CulturePlateItem.svelte`, etc.). Never put per-item UI in the grid container.
- **WorkbenchState** (`workbench-context.svelte.ts`) is the shared context. Items read global input state (`shiftHeld`, `pressureLevel`, `hoverNormY`) from it via `getWorkbench()` — no prop-drilling.
- **RAF loops** inside `$effect` for smooth animation. Always return a cleanup that calls `cancelAnimationFrame`. Use `untrack()` for reads inside a RAF that shouldn't retrigger the effect.

## Physics Constants

All simulation tuning lives in the `SIM` object in:
`prototypes/svelte-lab-avatar/components/workbench/culture/streak-types.ts`

Do not scatter magic numbers across components.

## Workbench Architecture

```
WorkbenchGrid.svelte        — grid layout, global key/pointer events, pressure RAF
  ItemRenderer.svelte       — dispatches to per-item component
    BunsenBurnerItem.svelte
    CulturePlateItem.svelte — streak canvas, Q/E lid, colony view
    InoculationLoopItem.svelte
    SampleVialItem.svelte
    PlaceholderItem.svelte
HeldItemCursor.svelte       — floating cursor for held item (portal'd to body)
workbench-context.svelte.ts — WorkbenchState class, setContext/getContext
```

Reusable rendering/simulation modules (imported by CulturePlateItem):
```
renderers/plate-renderer.ts       — canvas draw functions
items/culture-plate.ts            — applyStreakSegment, createPlateState
culture/colony-generator.ts       — generateColoniesFromGrid
culture/streak-types.ts           — SIM constants, DensityGrid, Colony types
culture/ColonyPlateView.svelte    — post-incubation colony canvas + picking
```

## Quality Checks

Run all three before committing. Build **must** pass with zero errors.

```bash
npm run knip && npm run lint && npm run build
```

| Tool | Catches | Severity |
|------|---------|----------|
| `knip` | Unused files, unused exports | Warning (exit 1 if any) |
| `lint` | ESLint rules, unused vars in `.svelte` | Warning |
| `build` | TypeScript errors incl. unused locals in `.ts` files | **Error — blocks commit** |

### Dead code after deletions

When you delete a component or module, TypeScript will error (`TS6133`/`TS6196`) on any functions/types in `.ts` files that were only used by the deleted code. **Delete the dead code too** — do not just remove the `export` keyword. Knip will point you at the files; the build will tell you the exact lines.

If a variable is intentionally unused (e.g., a destructured param you must accept), prefix with `_` to silence the rule.

### No test suite yet

There is no automated test runner. Manual verification in the browser (`npm run dev`) is the current standard.

## Git Commits

Do not include `Co-Authored-By` trailers or any AI attribution in commit messages or PR descriptions.
