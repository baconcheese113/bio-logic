<!--
  ModalOverlay — backdrop overlay with centered card and click-outside-to-close.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onClose: () => void;
    children: Snippet;
  }

  let { onClose, children }: Props = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="overlay" onclick={onClose} role="dialog">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="card" onclick={(e) => e.stopPropagation()}>
    {@render children()}
  </div>
</div>
