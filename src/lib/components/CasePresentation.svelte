<script lang="ts">
  import { currentCase, gameState } from '../stores/game-state';
  import { activateCase, currentActiveCase } from '../stores/active-cases';
  import { initializeEvidenceSummary } from '../stores/evidence-summary';
  import { CASES } from '../../data/organisms';
  
  function showSampleSelection() {
    // Activate this case when proceeding
    const caseInstance = $currentCase;
    const caseIndex = $gameState.currentCaseIndex;
    
    activateCase(caseInstance, caseIndex);
    
    // Get the active case ID that was just created
    // We need to wait a tick for the store to update
    if ($currentActiveCase) {
      const presentingComplaint = caseInstance.story.split('.')[0] + '.'; // First sentence as presenting complaint
      initializeEvidenceSummary($currentActiveCase.caseId, presentingComplaint);
    }
    
    gameState.update(state => ({ ...state, gamePhase: 'sample-selection' }));
  }

  function previousCase() {
    gameState.update(state => ({
      ...state,
      currentCaseIndex: (state.currentCaseIndex - 1 + CASES.length) % CASES.length,
    }));
  }

  function skipToNextCase() {
    gameState.update(state => ({
      ...state,
      currentCaseIndex: (state.currentCaseIndex + 1) % CASES.length,
    }));
  }
</script>

<div class="case-presentation">
  <div class="content">
    <div class="case-navigation">
      <button class="nav-button" onclick={previousCase}>← Previous</button>
      <h1>Case #{$gameState.currentCaseIndex + 1} of {CASES.length}</h1>
      <button class="nav-button" onclick={skipToNextCase}>Next →</button>
    </div>
    <h2>{$currentCase.title}</h2>
    <div class="story">
      {@html $currentCase.story.replace(/\n/g, '<br>')}
    </div>
    <button class="proceed-button" onclick={showSampleSelection}>
      Proceed to Sample Selection
    </button>
  </div>
</div>

<style>
  .case-presentation {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .content {
    max-width: 800px;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 3rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  h1 {
    font-size: 1.5rem;
    color: #888;
    margin: 0;
    letter-spacing: 2px;
  }

  .case-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .nav-button {
    background: none;
    border: 1px solid #4a4a4a;
    color: #888;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .nav-button:hover {
    background: #3a3a3a;
    border-color: #6a6a6a;
    color: #aaa;
  }

  h2 {
    font-size: 2.5rem;
    color: #e0e0e0;
    margin: 0 0 2rem 0;
    line-height: 1.2;
  }

  .story {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 3rem;
    color: #c0c0c0;
  }

  .proceed-button {
    background: #4a7c59;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .proceed-button:hover {
    background: #5a8c69;
  }
</style>
