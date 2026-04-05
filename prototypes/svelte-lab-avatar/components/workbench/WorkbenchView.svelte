<!--
  WorkbenchView.svelte - Generic workbench surface.

  Renders a grid with items placed in fixed cells.
  Item rendering is fully delegated to ItemRenderer - this component
  has zero knowledge of specific item types or their interactions.
  Items are self-contained and communicate via workbench context.
-->
<script lang="ts">
  import type { Fixture, Sample } from '../../lib/types';
  import { FIXTURE_DEFS } from '../../lib/types';
  import ItemRenderer from '../items/ItemRenderer.svelte';
  import DetailView from '../ui/DetailView.svelte';
  import HeldItemOverlay from './HeldItemOverlay.svelte';
  import { placeItems, persistPositions } from './item-defs';
  import WorkbenchGrid from './WorkbenchGrid.svelte';
  import { WorkbenchState, setWorkbenchContext } from './workbench-context.svelte';

  interface Props {
    fixture: Fixture;
    samples: Sample[];
    currentTick: number;
    onClose: () => void;
  }

  let { fixture, samples, currentTick, onClose }: Props = $props();

  const fixtureDef = $derived(FIXTURE_DEFS[fixture.type]);
  const gridCols = $derived('surfaceGrid' in fixtureDef ? fixtureDef.surfaceGrid[0] : 4);
  const gridRows = $derived('surfaceGrid' in fixtureDef ? fixtureDef.surfaceGrid[1] : 2);
  const placements = $derived(placeItems(fixture.items, gridCols, gridRows));

  $effect(() => {
    persistPositions(placements);
  });

  const wb = new WorkbenchState(
    () => fixture.items,
    () => samples,
    () => currentTick,
  );
  setWorkbenchContext(wb);
</script>

<DetailView icon={fixtureDef.icon} title={fixture.name} {onClose}>
  <div class="w-full max-w-225 p-md">
    <WorkbenchGrid
      {gridCols}
      {gridRows}
      {placements}
      hint={fixture.items.length === 0 ? 'This bench is empty. Place items here from your inventory.' : ''}
    >
      {#snippet itemContent(placement)}
        <ItemRenderer item={placement.item} />
      {/snippet}

      {#snippet heldContent(item)}
        <HeldItemOverlay {item} />
      {/snippet}

      {#snippet statusBar()}
        <div
          class="flex items-center gap-md bg-bg-dark px-md py-xs text-sm"
          style="border-top: var(--border-thin); border-radius: 0 0 6px 6px;"
        >
          <span class="text-parchment-aged italic">
            {fixture.items.length === 0
              ? 'Empty workbench'
              : `${fixture.items.length} item${fixture.items.length === 1 ? '' : 's'} - ${gridCols}x${gridRows} grid`}
          </span>
        </div>
      {/snippet}
    </WorkbenchGrid>
  </div>
</DetailView>
