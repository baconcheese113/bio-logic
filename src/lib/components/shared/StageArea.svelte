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
  
  // Group evidence by source and clean up text
  const groupedEvidence = $derived(() => {
    const summary = evidenceSummary();
    if (!summary || summary.phrases.length === 0) return null;
    
    const grouped = new Map<string, string[]>();
    
    for (const phrase of summary.phrases) {
      if (!grouped.has(phrase.source)) {
        grouped.set(phrase.source, []);
      }
      // Clean up repetitive words
      let cleanText = phrase.text
        .replace(/observed$/i, '') // Remove trailing "observed"
        .replace(/detected$/i, '')  // Remove trailing "detected"
        .trim();
      
      grouped.get(phrase.source)!.push(cleanText);
    }
    
    return grouped;
  });
  
  function getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
      'microscopy': '🔬 Microscopy',
      'culture': '🧫 Culture',
      'biochemical': '🧪 Biochemical',
      'pcr': '🧬 PCR',
      'serology': '🩸 Serology',
      'electrophoresis': '📊 Electrophoresis',
      'sequencing': '🔬 Sequencing',
      'flow-cytometry': '🔵 Flow Cytometry',
      'elisa': '🧬 ELISA',
    };
    return labels[source] || source;
  }
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
      
      <!-- Evidence summary - shown inline in existing header, grouped by source -->
      {#if groupedEvidence()}
        <div class="evidence-inline">
          <strong>Evidence:</strong>
          {#each Array.from(groupedEvidence()!) as [source, phrases], index}
            <div class="evidence-group">
              <span class="source-label">{getSourceLabel(source)}:</span>
              <span class="evidence-phrases">
                {phrases.join(', ')}
              </span>
            </div>
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
    font-size: 0.85rem;
  }
  
  .evidence-inline strong {
    color: #a0d9b0;
    margin-right: 0.5rem;
    display: block;
    margin-bottom: 0.4rem;
  }
  
  .evidence-group {
    display: flex;
    gap: 0.5rem;
    margin: 0.3rem 0;
    padding: 0.3rem 0.5rem;
    background: rgba(74, 124, 89, 0.1);
    border-left: 2px solid #4a7c59;
    border-radius: 2px;
  }
  
  .source-label {
    color: #b0d9c0;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .evidence-phrases {
    color: #c0e0d0;
    flex: 1;
  }

  .stage-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>
