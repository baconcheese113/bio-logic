<script lang="ts">
  import { currentCase, gameState } from '../stores/game-state';
  
  function showSampleSelection() {
    gameState.update(state => ({ ...state, gamePhase: 'sample-selection' }));
  }
</script>

<div class="case-presentation">
  <div class="content">
    <h1>Case #{$gameState.currentCaseIndex + 1}</h1>
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
    margin: 0 0 1rem 0;
    letter-spacing: 2px;
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
