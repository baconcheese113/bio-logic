<script lang="ts">
  interface Props {
    title: string;
    isOpen?: boolean;
    onToggle?: () => void;
    children: import('svelte').Snippet;
  }

  let { title, isOpen = $bindable(true), onToggle, children }: Props = $props();

  function handleToggle() {
    isOpen = !isOpen;
    onToggle?.();
  }
</script>

<div class="section">
  <button class="section-header" onclick={handleToggle}>
    <span class="section-title">{title}</span>
    <span class="chevron" class:open={isOpen}>▼</span>
  </button>
  
  {#if isOpen}
    <div class="section-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .section {
    border-bottom: 1px solid #3a3a3a;
  }

  .section-header {
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    color: #e0e0e0;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;
    font-family: 'Georgia', serif;
  }

  .section-header:hover {
    background: #333;
  }

  .section-title {
    text-align: left;
  }

  .chevron {
    transition: transform 0.3s;
    font-size: 0.8rem;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 1rem;
  }

  .section-content :global(h3),
  .section-content :global(h4) {
    color: #e0e0e0;
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
  }

  .section-content :global(p) {
    margin: 0.5rem 0;
  }
</style>
