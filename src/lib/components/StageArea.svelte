<script lang="ts">
  import { currentCase } from '../stores/game-state';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    showCaseHeader?: boolean;
  }

  let { children, showCaseHeader = false }: Props = $props();
</script>

<div class="stage-area">
  {#if showCaseHeader && $currentCase}
    <div class="case-header">
      <h2>{$currentCase.title}</h2>
      <div class="case-details">
        <p>{$currentCase.story}</p>
      </div>
    </div>
  {/if}
  
  <div class="stage-content">
    {@render children()}
  </div>
</div>

<style>
  .stage-area {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .case-header {
    background: #2a2a2a;
    border-bottom: 2px solid #4a4a4a;
    padding: 1.5rem 2rem;
  }

  .case-header h2 {
    margin: 0 0 0.5rem 0;
    color: #ffd700;
    font-size: 1.5rem;
  }

  .case-details {
    color: #b0b0b0;
    font-size: 0.95rem;
  }

  .case-details p {
    margin: 0.25rem 0;
  }

  .stage-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>
