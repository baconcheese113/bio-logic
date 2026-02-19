<!--
  ItemRenderer.svelte — Dispatches to the correct item component by type.

  WorkbenchView renders this without knowing which items exist.
  Each item component is self-contained: it handles its own
  interactions and mutates its own state on the Item directly.
-->
<script lang="ts">
  import type { Item } from '../../../../shared/types';
  import BunsenBurnerItem from './BunsenBurnerItem.svelte';
  import CulturePlateItem from './CulturePlateItem.svelte';
  import InoculationLoopItem from './InoculationLoopItem.svelte';
  import PlaceholderItem from './PlaceholderItem.svelte';
  import SampleVialItem from './SampleVialItem.svelte';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();
</script>

{#if item.type === 'bunsen-burner'}
  <BunsenBurnerItem {item} />
{:else if item.type === 'inoculation-loop'}
  <InoculationLoopItem {item} />
{:else if item.type === 'empty-dish' && item.contents}
  <CulturePlateItem {item} />
{:else if item.type === 'sample-vial'}
  <SampleVialItem {item} />
{:else}
  <PlaceholderItem {item} />
{/if}
