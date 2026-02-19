<!--
  ItemRenderer.svelte — Dispatches to the correct item component by type.

  WorkbenchView renders this without knowing which items exist.
  Each item component is self-contained: it handles its own
  interactions and mutates its own state on the Item directly.
-->
<script lang="ts">
  import type { Item } from '../../lib/types';
  import { getItemComponent, PlaceholderItem } from '../workbench/item-defs';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();
  const Component = $derived(getItemComponent(item.type) ?? PlaceholderItem);
</script>

<Component {item} />
