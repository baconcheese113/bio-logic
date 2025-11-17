<script lang="ts">
  import { currentActiveCase, completeCase } from '../stores/active-cases';
  import { gameState } from '../stores/game-state';
  import { filteredOrganisms } from '../stores/evidence';
  import { ORGANISMS } from '../../data/organisms';
  import type { CaseQuestion } from '../../data/case-types';
  
  let currentQuestionIndex = $state(0);
  let answers = $state<Record<string, string>>({});
  let showFeedback = $state(false);
  let score = $state(0);
  let totalPoints = $state(0);
  
  const activeCase = $derived($currentActiveCase);
  const questions = $derived(activeCase?.case.questions || []);
  const currentQuestion = $derived(questions[currentQuestionIndex]);
  
  $effect(() => {
    if (activeCase) {
      // Calculate total points
      totalPoints = activeCase.case.questions.reduce((sum, q) => sum + q.points, 0);
      // Restore submitted answers
      answers = activeCase.answersSubmitted || {};
    }
  });
  
  function handleAnswer(questionId: string, answer: string) {
    answers[questionId] = answer;
  }
  
  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
    } else {
      // All questions answered, calculate score
      calculateScore();
      showFeedback = true;
    }
  }
  
  function calculateScore() {
    let earnedPoints = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += q.points;
      }
    });
    score = earnedPoints;
  }
  
  function handleSubmit() {
    if (!activeCase) return;
    
    const feedback = generateFeedback();
    completeCase(activeCase.case.id, score, feedback);
    
    // Return to job board
    gameState.update(s => ({ ...s, gamePhase: 'job-board' }));
  }
  
  function generateFeedback(): string {
    const percentage = (score / totalPoints) * 100;
    if (percentage === 100) return 'Perfect! Excellent diagnosis work.';
    if (percentage >= 80) return 'Very good! Minor errors but solid work.';
    if (percentage >= 60) return 'Good effort. Review the areas you missed.';
    return 'Needs improvement. Consider reviewing the material.';
  }
  
  function getOrganismOptions(): string[] {
    // For organism-id questions, filter to relevant organisms
    if (currentQuestion?.type === 'organism-id') {
      return $filteredOrganisms.map(o => o.id);
    }
    return [];
  }
  
  function getOrganismName(id: string): string {
    const org = ORGANISMS.find(o => o.id === id);
    return org ? org.scientificName : id;
  }
</script>

{#if activeCase && currentQuestion}
  <div class="diagnosis-view">
    {#if !showFeedback}
      <div class="question-card">
        <div class="header">
          <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <div class="points">{currentQuestion.points} points</div>
        </div>
        
        <p class="prompt">{currentQuestion.prompt}</p>
        
        {#if currentQuestion.hint}
          <p class="hint">💡 Hint: {currentQuestion.hint}</p>
        {/if}
        
        <div class="answer-section">
          {#if currentQuestion.type === 'organism-id'}
            <div class="organism-list">
              {#each getOrganismOptions() as organismId}
                <button 
                  class="organism-option"
                  class:selected={answers[currentQuestion.id] === organismId}
                  onclick={() => handleAnswer(currentQuestion.id, organismId)}
                >
                  {getOrganismName(organismId)}
                </button>
              {/each}
            </div>
          {:else if currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'antibiotic-choice'}
            <div class="options-list">
              {#each currentQuestion.options || [] as option}
                <button 
                  class="option-button"
                  class:selected={answers[currentQuestion.id] === option}
                  onclick={() => handleAnswer(currentQuestion.id, option)}
                >
                  {option}
                </button>
              {/each}
            </div>
          {:else}
            <input 
              type="text" 
              class="text-input"
              value={answers[currentQuestion.id] || ''}
              oninput={(e) => handleAnswer(currentQuestion.id, e.currentTarget.value)}
              placeholder="Enter your answer..."
            />
          {/if}
        </div>
        
        <div class="actions">
          {#if currentQuestionIndex > 0}
            <button class="nav-button" onclick={() => currentQuestionIndex--}>
              ← Previous
            </button>
          {/if}
          <button 
            class="nav-button primary"
            disabled={!answers[currentQuestion.id]}
            onclick={handleNext}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next →' : 'Submit Answers'}
          </button>
        </div>
      </div>
    {:else}
      <div class="feedback-card">
        <h2>Case Complete!</h2>
        <div class="score-display">
          <div class="score-large">{score} / {totalPoints}</div>
          <div class="percentage">{Math.round((score / totalPoints) * 100)}%</div>
        </div>
        
        <p class="feedback-message">{generateFeedback()}</p>
        
        <div class="rewards">
          <div class="reward-item">
            <span class="label">Payment:</span>
            <span class="value">${activeCase.case.payment}</span>
          </div>
          <div class="reward-item">
            <span class="label">Reputation:</span>
            <span class="value">+{activeCase.case.reputationGain}</span>
          </div>
        </div>
        
        <button class="submit-button" onclick={handleSubmit}>
          Return to Job Board
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div class="diagnosis-view">
    <div class="error">No active case found</div>
  </div>
{/if}

<style>
  .diagnosis-view {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
  }
  
  .question-card, .feedback-card {
    max-width: 800px;
    width: 100%;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 3rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  h2 {
    font-size: 1.8rem;
    color: #e0e0e0;
    margin: 0;
  }
  
  .points {
    background: #4a7c59;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .prompt {
    font-size: 1.2rem;
    color: #e0e0e0;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  .hint {
    background: #3a3a3a;
    padding: 1rem;
    border-left: 4px solid #6a9fb5;
    color: #c0c0c0;
    font-style: italic;
    margin-bottom: 2rem;
  }
  
  .answer-section {
    margin: 2rem 0;
  }
  
  .organism-list, .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .organism-option, .option-button {
    width: 100%;
    padding: 1.25rem;
    background: #3a3a3a;
    border: 2px solid #4a4a4a;
    color: #e0e0e0;
    font-size: 1.1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  
  .organism-option:hover, .option-button:hover {
    background: #4a4a4a;
    border-color: #6a9fb5;
  }
  
  .organism-option.selected, .option-button.selected {
    background: #3a4a3a;
    border-color: #4a7c59;
    color: #a0f0a0;
  }
  
  .text-input {
    width: 100%;
    padding: 1rem;
    background: #3a3a3a;
    border: 2px solid #4a4a4a;
    color: #e0e0e0;
    font-size: 1.1rem;
    border-radius: 6px;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .nav-button {
    padding: 1rem 2rem;
    background: #3a3a3a;
    border: 2px solid #4a4a4a;
    color: #e0e0e0;
    font-size: 1.1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .nav-button:hover:not(:disabled) {
    background: #4a4a4a;
    border-color: #6a9fb5;
  }
  
  .nav-button.primary {
    background: #4a7c59;
    border-color: #4a7c59;
  }
  
  .nav-button.primary:hover:not(:disabled) {
    background: #5a8c69;
  }
  
  .nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .feedback-card {
    text-align: center;
  }
  
  .score-display {
    margin: 2rem 0;
  }
  
  .score-large {
    font-size: 4rem;
    font-weight: bold;
    color: #4a7c59;
  }
  
  .percentage {
    font-size: 2rem;
    color: #a0a0a0;
  }
  
  .feedback-message {
    font-size: 1.3rem;
    color: #e0e0e0;
    margin: 2rem 0;
  }
  
  .rewards {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin: 2rem 0;
    padding: 1.5rem;
    background: #1a1a1a;
    border-radius: 6px;
  }
  
  .reward-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .label {
    font-size: 0.9rem;
    color: #888;
    text-transform: uppercase;
  }
  
  .value {
    font-size: 2rem;
    color: #4a7c59;
    font-weight: bold;
  }
  
  .submit-button {
    padding: 1.25rem 3rem;
    background: #4a7c59;
    border: none;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 2rem;
  }
  
  .submit-button:hover {
    background: #5a8c69;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
  }
  
  .error {
    font-size: 1.5rem;
    color: #ff6b6b;
    text-align: center;
  }
</style>
