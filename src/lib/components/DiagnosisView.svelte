<script lang="ts">
  import { evidence, filteredOrganisms, matchCount } from '../stores/evidence';
  import { gameState } from '../stores/game-state';

  function backToMicroscope() {
    gameState.update(state => ({ ...state, gamePhase: 'microscope-observation' }));
  }
</script>

<div class="diagnosis-view">
  <div class="content">
    <h2>Make Your Diagnosis</h2>
    <p class="match-count">{$matchCount} organism(s) match your observations</p>
    
    <div class="placeholder">
      <p>Diagnosis interface will be implemented here</p>
      <p>Evidence collected: {JSON.stringify($evidence, null, 2)}</p>
      <p>Matching organisms: {$filteredOrganisms.length}</p>
    </div>

    <button class="back-button" onclick={backToMicroscope}>
      ← Back to Microscope
    </button>
  </div>
</div>

<style>
  .diagnosis-view {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .content {
    max-width: 1200px;
    width: 100%;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 3rem;
  }

  h2 {
    font-size: 2rem;
    margin: 0 0 1rem 0;
    color: #e0e0e0;
  }

  .match-count {
    font-size: 1.2rem;
    color: #a0a0a0;
    margin-bottom: 2rem;
  }

  .placeholder {
    background: #1a1a1a;
    border: 2px dashed #4a4a4a;
    border-radius: 4px;
    padding: 3rem;
    text-align: center;
    color: #888;
    margin-bottom: 2rem;
  }

  .placeholder p {
    margin: 0.5rem 0;
    font-family: monospace;
  }

  .back-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: #4a4a4a;
  }
</style>
