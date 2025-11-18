<script lang="ts">
  import { currentCase, gameState } from '../../stores/game-state';
  import { currentActiveCase } from '../../stores/active-cases';
  import { evidenceSummaries } from '../../stores/evidence-summary';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    showCaseHeader?: boolean;
  }

  let { children, showCaseHeader = false }: Props = $props();
  
  // Get evidence for current active case
  const evidenceSummary = $derived(() => {
    if (!$currentActiveCase) return null;
    return $evidenceSummaries.summaries.get($currentActiveCase.caseId);
  });
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
      
      <!-- Evidence summary - shown inline in existing header -->
      {#if evidenceSummary() && evidenceSummary()!.phrases.length > 0}
        <div class="evidence-inline">
          <strong>Evidence:</strong>
          {#each evidenceSummary()!.phrases as phrase, index}
            {#if index > 0}•{/if}
            <span class="evidence-phrase">{phrase.text}</span>
          {/each}
        </div>
      {/if}
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
  
  .evidence-inline {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #3a3a3a;
    color: #90c9a0;
    font-size: 0.9rem;
  }
  
  .evidence-inline strong {
    color: #a0d9b0;
    margin-right: 0.5rem;
  }
  
  .evidence-phrase {
    margin: 0 0.4rem;
    color: #c0e0d0;
  }

  .stage-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>
