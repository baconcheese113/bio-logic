<script lang="ts">
  import { currentActiveCase } from '../../stores/active-cases';
  import { evidenceSummaries } from '../../stores/evidence-summary';
  import { currentCase } from '../../stores/game-state';
  
  const evidenceSummary = $derived(() => {
    if (!$currentActiveCase) return null;
    return $evidenceSummaries.summaries.get($currentActiveCase.caseId);
  });
  
  let isComplete = $state(false);
  let canSubmit = $state(false);
  
  // Check if evidence is complete (placeholder logic - will be enhanced)
  $effect(() => {
    const summary = evidenceSummary();
    if (summary && summary.phrases.length >= 3) {
      // Basic check: need at least 3 pieces of evidence
      // This will be enhanced with proper completion detection
      canSubmit = true;
    } else {
      canSubmit = false;
    }
  });
  
  function handleSubmitDiagnosis() {
    // This will trigger the diagnosis validation
    // For now, just navigate to diagnosis view
    console.log('Submit diagnosis clicked');
  }
</script>

{#if evidenceSummary()}
  <div class="evidence-summary-bar" class:complete={isComplete}>
    <div class="summary-content">
      <div class="presenting-complaint">
        <strong>Patient presents with:</strong> {evidenceSummary()?.presentingComplaint || ''}
      </div>
      
      {#if evidenceSummary()?.phrases && evidenceSummary()!.phrases.length > 0}
        <div class="evidence-phrases">
          {#each evidenceSummary()!.phrases as phrase, index}
            <span class="phrase">
              {#if index > 0}…{/if}
              {phrase.text}
            </span>
          {/each}
        </div>
      {:else}
        <div class="no-evidence">
          <em>No diagnostic evidence collected yet. Use instruments to gather findings.</em>
        </div>
      {/if}
    </div>
    
    {#if canSubmit}
      <div class="submit-container">
        <button class="submit-diagnosis-btn" onclick={handleSubmitDiagnosis}>
          Submit Diagnosis
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .evidence-summary-bar {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    min-height: 80px;
    background: linear-gradient(to bottom, #2a2a3a, #252535);
    border-bottom: 2px solid #3a3a4a;
    padding: 1rem 2rem;
    z-index: 999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }
  
  .evidence-summary-bar.complete {
    background: linear-gradient(to bottom, #2a4a3a, #254535);
    border-bottom-color: #4a7c5a;
    box-shadow: 0 2px 16px rgba(74, 124, 89, 0.4), 0 0 20px rgba(74, 124, 89, 0.2);
    animation: completeGlow 2s ease-in-out infinite;
  }
  
  @keyframes completeGlow {
    0%, 100% {
      box-shadow: 0 2px 16px rgba(74, 124, 89, 0.4), 0 0 20px rgba(74, 124, 89, 0.2);
    }
    50% {
      box-shadow: 0 2px 20px rgba(74, 124, 89, 0.6), 0 0 30px rgba(74, 124, 89, 0.3);
    }
  }
  
  .summary-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .presenting-complaint {
    color: #b0b0c0;
    font-size: 0.95rem;
  }
  
  .presenting-complaint strong {
    color: #e0e0e0;
  }
  
  .evidence-phrases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  
  .phrase {
    background: #3a4a5a;
    color: #c0d0e0;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.9rem;
    border: 1px solid #4a5a6a;
    animation: phraseAppear 0.3s ease-out;
  }
  
  @keyframes phraseAppear {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .no-evidence {
    color: #888;
    font-size: 0.9rem;
    font-style: italic;
  }
  
  .submit-container {
    margin-top: 1rem;
    text-align: center;
  }
  
  .submit-diagnosis-btn {
    background: linear-gradient(to bottom, #4a7c59, #3a6c49);
    color: white;
    border: 2px solid #5a8c69;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(74, 124, 89, 0.3);
  }
  
  .submit-diagnosis-btn:hover {
    background: linear-gradient(to bottom, #5a8c69, #4a7c59);
    border-color: #6a9c79;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 124, 89, 0.5);
  }
  
  .submit-diagnosis-btn:active {
    transform: translateY(0);
  }
</style>
