<script lang="ts">
  import { getInfoContent } from '../../../data/info-content';

  interface Props {
    infoKey: string | null;
  }

  let { infoKey }: Props = $props();

  const info = $derived(infoKey ? getInfoContent(infoKey) : null);
</script>

<div class="info-panel">
  {#if info}
    <div class="info-content">
      <h4>{info.title}</h4>
      <p>{info.text}</p>
    </div>
  {:else}
    <div class="info-placeholder">
      Hover over controls to learn more
    </div>
  {/if}
</div>

<style>
  .info-panel {
    background: #2a2a2a;
    border-top: 2px solid #4a4a4a;
    padding: 1.5rem 2rem;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-content {
    max-width: 800px;
    text-align: center;
  }

  .info-content h4 {
    color: #6a9fb5;
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
  }

  .info-content p {
    color: #ccc;
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
  }

  .info-placeholder {
    color: #666;
    font-style: italic;
    font-size: 0.9rem;
  }
</style>
