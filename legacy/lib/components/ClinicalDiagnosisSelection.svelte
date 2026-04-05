<script lang="ts">
  import { CLINICAL_DIAGNOSES } from '../../data/clinical-diagnoses';
  import type { ClinicalDiagnosis } from '../../data/clinical-diagnoses';

  interface Props {
    selectedAnswer: string | null;
    selectAnswer: (answer: string) => void;
    feedback: string;
    possibleDiagnoses: string[];
  }

  let { selectedAnswer, selectAnswer, feedback, possibleDiagnoses }: Props = $props();

  // Get diagnosis objects from IDs
  const diagnoses = possibleDiagnoses
    .map(id => CLINICAL_DIAGNOSES.find(d => d.id === id))
    .filter((d): d is ClinicalDiagnosis => d !== undefined);
</script>

<div class="clinical-diagnosis-selection">
  <h3>Select Clinical Diagnosis</h3>
  <p class="instruction">Based on the patient presentation and your electrophoresis findings, which diagnosis best fits?</p>
  
  <div class="diagnosis-grid">
    {#each diagnoses as diagnosis}
      <button
        class="diagnosis-card"
        class:selected={selectedAnswer === diagnosis.id}
        onclick={() => selectAnswer(diagnosis.id)}
        disabled={feedback !== ''}
      >
        <div class="diagnosis-name">{diagnosis.displayName}</div>
        <div class="diagnosis-desc">{diagnosis.description}</div>
        <div class="pattern-hint">
          <strong>Expected Pattern:</strong> {diagnosis.proteinPattern}
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .clinical-diagnosis-selection {
    background: #2a3a4a;
    border: 2px solid #4a5a6a;
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 1.2rem;
    color: #e0e0e0;
    margin: 0 0 0.5rem 0;
    text-align: center;
  }

  .instruction {
    text-align: center;
    color: #b0b0b0;
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
  }

  .diagnosis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .diagnosis-card {
    background: #3a4a5a;
    color: #e0e0e0;
    border: 2px solid #4a5a6a;
    border-radius: 4px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .diagnosis-card:hover:not(:disabled) {
    background: #4a5a6a;
    border-color: #6a9fb5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .diagnosis-card.selected {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .diagnosis-card:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .diagnosis-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #ffffff;
  }

  .diagnosis-desc {
    font-size: 0.9rem;
    color: #c0d0e0;
    line-height: 1.4;
  }

  .pattern-hint {
    font-size: 0.85rem;
    color: #a0c0d0;
    padding-top: 0.5rem;
    border-top: 1px solid #4a5a6a;
    line-height: 1.3;
  }

  .pattern-hint strong {
    color: #ffd700;
  }
</style>
