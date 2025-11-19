<script lang="ts">
  import { currentCase, gameState } from '../../stores/game-state';
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
      <div class="header-title-row">
        <h2>{$currentCase.title}</h2>
        {#if $gameState.selectedSampleType}
          <span class="sample-badge">
            {$gameState.selectedSampleType.toUpperCase()}
          </span>
        {/if}
      </div>
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
    min-height: 0;
    flex: 1;
  }

  .case-header {
    background: #2a2a2a;
    border-bottom: 2px solid #4a4a4a;
    padding: 1.5rem 2rem;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .case-header h2 {
    margin: 0;
    color: #ffd700;
    font-size: 1.5rem;
  }

  .sample-badge {
    background: linear-gradient(135deg, #4a7c59 0%, #5a8c69 100%);
    color: white;
    padding: 0.3rem 0.7rem;
    border-radius: 16px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 1px;
    box-shadow: 0 2px 6px rgba(74, 124, 89, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    white-space: nowrap;
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
