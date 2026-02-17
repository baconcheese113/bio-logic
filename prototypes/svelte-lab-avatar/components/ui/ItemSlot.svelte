<!--
  ItemSlot — grid cell showing item icon + label, with optional pickup action.
  Used in fixture panels, inventory displays, and workbench sidebars.
-->
<script lang="ts">
  import { getItemIcon, getItemLabel } from '../../../shared/types';
  import type { Item } from '../../../shared/types';

  interface Props {
    item: Item;
    /** Show a pickup button (↑) */
    canPickup?: boolean;
    /** Custom trailing text (e.g. "Ready") */
    tag?: string;
    tagColor?: string;
    onPickup?: () => void;
    onClick?: () => void;
  }

  let { item, canPickup = false, tag, tagColor, onPickup, onClick }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="slot"
  class:clickable={!!onClick}
  onclick={onClick}
>
  <span>{getItemIcon(item)}</span>
  <span class="label">{getItemLabel(item)}</span>

  {#if tag}
    <span class="tag" style:background={tagColor}>{tag}</span>
  {/if}

  {#if canPickup && onPickup}
    <button
      class="pickup-btn"
      onclick={(e) => { e.stopPropagation(); onPickup?.(); }}
      title="Pick up"
    >↑</button>
  {/if}
</div>

<style>
  .slot {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--bg-medium);
  }

  .slot.clickable {
    cursor: pointer;
    transition: border-color 0.15s;
    border: 1px solid transparent;
  }

  .slot.clickable:hover {
    border-color: var(--brass-dark);
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag {
    margin-left: auto;
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--bg-light);
    color: var(--parchment-aged);
    flex-shrink: 0;
  }

  .pickup-btn {
    margin-left: auto;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--brass-light);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: bold;
    transition: all 0.15s;
    padding: 0;
    flex-shrink: 0;
  }

  .pickup-btn:hover {
    background: var(--brass-dark);
    border-color: var(--brass);
    color: var(--parchment);
  }
</style>
