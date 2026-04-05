<!--
  DetailView — full-screen panel with header, content slot, footer, and ESC to close.
  Used by InstrumentDetailView and any future full-screen views.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    title: string;
    tag?: string;
    onClose: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { icon, title, tag, onClose, children, footer }: Props = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="fullscreen">
  <header class="header-bar">
    <div class="flex items-center gap-md">
      <span class="icon-lg">{icon}</span>
      <h1 class="m-0">{title}</h1>
      {#if tag}<span class="tag">{tag}</span>{/if}
    </div>
    <button class="btn-close" onclick={onClose}>✕ Close</button>
  </header>

  <main class="fullscreen-content">
    {@render children()}
  </main>

  <footer class="footer-bar">
    {#if footer}
      {@render footer()}
    {:else}
      <p>Press <kbd>ESC</kbd> or click Close to return to lab</p>
    {/if}
  </footer>
</div>
