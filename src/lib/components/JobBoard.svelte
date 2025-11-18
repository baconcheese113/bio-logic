<script lang="ts">
  import { acceptCase, activeCases } from '../stores/active-cases';
  import { gameState } from '../stores/game-state';
  import { NEW_FORMAT_CASES } from '../../data/game-cases';
  import type { GameCase } from '../../data/case-types';
  
  // Filter available cases (not already accepted)
  const availableCases = $derived(
    NEW_FORMAT_CASES.filter(gameCase => 
      !$activeCases.cases.some(ac => ac.case.id === gameCase.id)
    )
  );
  
  function handleAcceptCase(gameCase: GameCase) {
    acceptCase(gameCase);
    // Navigate to sample selection
    gameState.update(state => ({
      ...state,
      gamePhase: 'sample-selection',
    }));
  }
  
  function getDifficultyColor(tier: string): string {
    switch (tier) {
      case 'tutorial': return '#6a9fb5';
      case 'easy': return '#4a7c59';
      case 'medium': return '#ffa500';
      case 'hard': return '#ff6b6b';
      case 'expert': return '#c98f8f';
      default: return '#a0a0a0';
    }
  }
  
  function getTypeLabel(type: string): string {
    return type === 'processing' ? 'Processing Job' : 'Diagnostic Case';
  }
</script>

<div class="job-board">
  <div class="header">
    <h1>Available Cases</h1>
    <p class="subtitle">Select a case to begin investigation</p>
  </div>
  
  <div class="cases-grid">
    {#each availableCases as gameCase (gameCase.id)}
      <div class="case-card">
        <div class="case-header">
          <div class="case-type" style:background={getDifficultyColor(gameCase.difficultyTier)}>
            {getTypeLabel(gameCase.type)}
          </div>
          <div class="case-difficulty">
            {gameCase.difficultyTier.charAt(0).toUpperCase() + gameCase.difficultyTier.slice(1)}
          </div>
        </div>
        
        <h3 class="case-title">{gameCase.title}</h3>
        <p class="client-name">{gameCase.clientName}</p>
        <p class="description">{gameCase.description}</p>
        
        <div class="case-details">
          <div class="detail-item">
            <span class="label">Payment:</span>
            <span class="value">${gameCase.payment}</span>
          </div>
          <div class="detail-item">
            <span class="label">Reputation:</span>
            <span class="value">+{gameCase.reputationGain}</span>
          </div>
          {#if gameCase.estimatedTime}
            <div class="detail-item">
              <span class="label">Est. Time:</span>
              <span class="value">
                {gameCase.estimatedTime < 60 
                  ? `${gameCase.estimatedTime}m`
                  : `${Math.floor(gameCase.estimatedTime / 60)}h`
                }
              </span>
            </div>
          {/if}
        </div>
        
        <button class="accept-button" onclick={() => handleAcceptCase(gameCase)}>
          Accept Case
        </button>
      </div>
    {/each}
  </div>
  
  {#if availableCases.length === 0}
    <div class="no-cases">
      <p>No cases available at the moment.</p>
      <p class="hint">Complete your current cases or check back later.</p>
    </div>
  {/if}
</div>

<style>
  .job-board {
    width: 100%;
    height: 100%;
    padding: 2rem;
    overflow-y: auto;
    background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
  }
  
  .header {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  h1 {
    font-size: 2.5rem;
    color: #e0e0e0;
    margin: 0 0 0.5rem 0;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: #a0a0a0;
    margin: 0;
  }
  
  .cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .case-card {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
  }
  
  .case-card:hover {
    border-color: #6a9fb5;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  
  .case-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .case-type {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
  }
  
  .case-difficulty {
    color: #a0a0a0;
    font-size: 0.9rem;
  }
  
  .case-title {
    font-size: 1.4rem;
    color: #e0e0e0;
    margin: 0 0 0.5rem 0;
  }
  
  .client-name {
    color: #6a9fb5;
    font-size: 0.95rem;
    margin: 0 0 1rem 0;
    font-style: italic;
  }
  
  .description {
    color: #c0c0c0;
    line-height: 1.5;
    margin: 0 0 1.5rem 0;
    flex: 1;
  }
  
  .case-details {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #1a1a1a;
    border-radius: 4px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .label {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
  }
  
  .value {
    font-size: 1.1rem;
    color: #4a7c59;
    font-weight: bold;
  }
  
  .accept-button {
    width: 100%;
    background: #4a7c59;
    color: white;
    border: none;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .accept-button:hover {
    background: #5a8c69;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
  }
  
  .no-cases {
    text-align: center;
    padding: 4rem 2rem;
    color: #a0a0a0;
  }
  
  .no-cases p {
    font-size: 1.2rem;
    margin: 0.5rem 0;
  }
  
  .hint {
    font-size: 1rem;
    color: #888;
  }
</style>
