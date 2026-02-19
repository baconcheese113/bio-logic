<!--
  PlaceholderItem.svelte — Fallback rendering for items without a dedicated component.
  Shows the item's emoji icon and label.
-->
<script lang="ts">
  import type { Item } from '../../lib/types';
  import { ITEM_DEFS } from '../workbench/item-defs';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();
  const def = $derived(ITEM_DEFS[item.type]);
</script>

<div class="flex flex-col items-center justify-center gap-1 p-2 opacity-70">
  <span class="icon-lg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4))">{def.icon}</span>
</div>
