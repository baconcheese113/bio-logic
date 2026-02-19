<!--
  WorkbenchView.svelte — Generic workbench surface.

  Renders a grid with items placed in fixed cells.
  Item rendering is fully delegated to ItemRenderer — this component
  has ZERO knowledge of specific item types or their interactions.
  Items are self-contained and communicate via workbench context.
-->
<script lang="ts">
  import type { Fixture, Sample } from '../../../shared/types';
  import { FIXTURE_DEFS } from '../../../shared/types';
  import DetailView from '../ui/DetailView.svelte';
  import WorkbenchGrid from './WorkbenchGrid.svelte';
  import ItemRenderer from './items/ItemRenderer.svelte';
  import HeldItemCursor from './items/HeldItemCursor.svelte';
  import { placeItems, persistPositions } from './items/layout-items';
  import { WorkbenchState, setWorkbenchContext } from './workbench-context.svelte';

  interface Props {
    fixture: Fixture;
    samples: Sample[];
    onClose: () => void;
  }

  let { fixture, samples, onClose }: Props = $props();

  const fixtureDef = $derived(FIXTURE_DEFS[fixture.type]);
  const gridCols = $derived('surfaceGrid' in fixtureDef ? fixtureDef.surfaceGrid[0] : 4);
  const gridRows = $derived('surfaceGrid' in fixtureDef ? fixtureDef.surfaceGrid[1] : 2);

  // Place items on the grid (positions are persisted on items)
  const placements = $derived(placeItems(fixture.items, gridCols, gridRows));

  // Persist auto-assigned positions back to items (one-time side effect)
  $effect(() => {
    persistPositions(placements);
  });

  // Reactive workbench context — items read/write through this
  const wb = new WorkbenchState(
    () => fixture.items,
    () => samples,
  );
  setWorkbenchContext(wb);
</script>

<DetailView icon={fixtureDef.icon} title={fixture.name} {onClose}>
  <div class="w-full max-w-225 p-md">
    <WorkbenchGrid
      {gridCols}
      {gridRows}
      {placements}
      hint={fixture.items.length === 0
        ? 'This bench is empty. Place items here from your inventory.'
        : ''}
    >
      {#snippet itemContent(placement)}
        <ItemRenderer item={placement.item} />
      {/snippet}

      {#snippet heldContent(item)}
        <HeldItemCursor {item} />
      {/snippet}

      {#snippet statusBar()}
        <div class="flex items-center gap-md py-xs px-md text-sm bg-bg-dark" style="border-top: var(--border-thin); border-radius: 0 0 6px 6px;">
          <span class="text-parchment-aged italic">
            {fixture.items.length === 0 ? 'Empty workbench' : `${fixture.items.length} item${fixture.items.length === 1 ? '' : 's'} · ${gridCols}×${gridRows} grid`}
          </span>
        </div>
      {/snippet}
    </WorkbenchGrid>
  </div>
</DetailView>
