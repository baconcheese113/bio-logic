<script lang="ts">
  import type { Patient, Observation, Diagnosis, TreatmentOption, OrganismCategory } from '../../shared/types';

  interface Props {
    patient: Patient;
    observations: Observation[];
    onSubmit: (diagnosis: Diagnosis) => void;
    onCancel: () => void;
  }

  let { patient, observations, onSubmit, onCancel }: Props = $props();

  // Available organisms for Golden Age (1880s)
  const ORGANISMS = [
    { id: 'staphylococcus-aureus', name: 'Staphylococcus aureus' },
    { id: 'streptococcus-pyogenes', name: 'Streptococcus pyogenes' },
    { id: 'streptococcus-pneumoniae', name: 'Streptococcus pneumoniae' },
    { id: 'mycobacterium-tuberculosis', name: 'Mycobacterium tuberculosis' },
    { id: 'corynebacterium-diphtheriae', name: 'Corynebacterium diphtheriae' },
    { id: 'escherichia-coli', name: 'Escherichia coli' },
    { id: 'salmonella-typhi', name: 'Salmonella typhi' },
    { id: 'bacillus-anthracis', name: 'Bacillus anthracis' },
    { id: 'clostridium-tetani', name: 'Clostridium tetani' },
    { id: 'unknown', name: 'Unknown organism' },
  ];

  const CATEGORIES: { id: OrganismCategory; name: string }[] = [
    { id: 'gram-positive', name: 'Gram-positive' },
    { id: 'gram-negative', name: 'Gram-negative' },
    { id: 'acid-fast', name: 'Acid-fast' },
    { id: 'unknown', name: 'Unknown' },
  ];

  const TREATMENTS: { id: TreatmentOption; name: string }[] = [
    { id: 'carbolic-wash', name: 'Carbolic wash & dressing' },
    { id: 'surgical-debridement', name: 'Surgical debridement' },
    { id: 'isolate-patient', name: 'Isolate patient' },
    { id: 'supportive-care', name: 'Supportive care & rest' },
    { id: 'mercury-treatment', name: 'Mercury treatment' },
    { id: 'quinine', name: 'Quinine administration' },
  ];

  let selectedOrganism = $state<string | null>(null);
  let selectedCategory = $state<OrganismCategory | null>(null);
  let selectedTreatment = $state<TreatmentOption | null>(null);

  const canSubmit = $derived(selectedOrganism && selectedCategory && selectedTreatment);

  // Get observations for this patient
  const patientObservations = $derived(observations.filter(o => o.caseId === patient.caseId));

  function handleSubmit() {
    if (!selectedOrganism || !selectedCategory || !selectedTreatment) return;
    
    onSubmit({
      organism: selectedOrganism,
      category: selectedCategory,
      treatment: selectedTreatment,
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="overlay">
  <div class="diagnosis-panel">
    <header class="panel-header">
      <h2>Submit Diagnosis</h2>
      <button class="btn-close" onclick={onCancel}>✕</button>
    </header>

    <div class="panel-body">
      <!-- Patient info -->
      <section class="section patient-info">
        <h3>Patient</h3>
        <div class="patient-details">
          <span class="patient-name">🧑‍⚕️ {patient.name}</span>
          <span class="patient-status {patient.status}">{patient.status}</span>
        </div>
        <p class="synopsis">{patient.synopsis}</p>
      </section>

      <!-- Your observations -->
      <section class="section">
        <h3>Your Observations</h3>
        {#if patientObservations.length === 0}
          <p class="empty-text">No observations recorded for this patient.</p>
        {:else}
          <ul class="obs-list">
            {#each patientObservations as obs}
              <li class="obs-item">
                <span class="obs-field">{obs.field}:</span>
                <span class="obs-value">{obs.value}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <!-- Organism selection -->
      <section class="section">
        <h3>Identified Organism</h3>
        <select class="select" bind:value={selectedOrganism}>
          <option value={null}>-- Select organism --</option>
          {#each ORGANISMS as org}
            <option value={org.id}>{org.name}</option>
          {/each}
        </select>
      </section>

      <!-- Category selection -->
      <section class="section">
        <h3>Category</h3>
        <div class="btn-group">
          {#each CATEGORIES as cat}
            <button 
              class="btn btn-sm {selectedCategory === cat.id ? 'active' : ''}"
              onclick={() => selectedCategory = cat.id}
            >
              {cat.name}
            </button>
          {/each}
        </div>
      </section>

      <!-- Treatment selection -->
      <section class="section">
        <h3>Recommended Treatment</h3>
        <select class="select" bind:value={selectedTreatment}>
          <option value={null}>-- Select treatment --</option>
          {#each TREATMENTS as treat}
            <option value={treat.id}>{treat.name}</option>
          {/each}
        </select>
      </section>
    </div>

    <footer class="panel-footer">
      <button class="btn" onclick={onCancel}>Cancel</button>
      <button 
        class="btn btn-primary" 
        disabled={!canSubmit}
        onclick={handleSubmit}
      >
        Submit Diagnosis
      </button>
    </footer>
  </div>
</div>

<style>
  .diagnosis-panel {
    background: var(--bg-dark);
    border: var(--border-medium);
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border-bottom: var(--border-thin);
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--brass-light);
  }

  .panel-body {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    overflow-y: auto;
  }

  .panel-footer {
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-medium);
    border-top: var(--border-thin);
  }

  .section {
    margin-bottom: var(--space-lg);
  }

  .section h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--brass);
    margin: 0 0 var(--space-sm) 0;
    border-bottom: 1px solid var(--brass-dark);
    padding-bottom: var(--space-xs);
  }

  .patient-info {
    background: var(--bg-medium);
    padding: var(--space-md);
    border-radius: 6px;
  }

  .patient-details {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-sm);
  }

  .patient-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--parchment);
  }

  .patient-status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  .patient-status.stable { background: var(--patient-stable); color: white; }
  .patient-status.guarded { background: var(--patient-guarded); color: var(--bg-darkest); }
  .patient-status.declining { background: var(--patient-declining); color: white; }
  .patient-status.critical { background: var(--patient-critical); color: white; }

  .synopsis {
    font-size: 0.85rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }

  .obs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .obs-item {
    background: var(--bg-medium);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .obs-field {
    color: var(--brass);
    text-transform: capitalize;
  }

  .obs-value {
    color: var(--parchment);
    text-transform: capitalize;
  }

  .select {
    width: 100%;
    padding: var(--space-sm);
    background: var(--bg-medium);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    color: var(--parchment);
    font-family: var(--font-body);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .select:focus {
    outline: none;
    border-color: var(--brass);
  }

  .select option {
    background: var(--bg-dark);
    color: var(--parchment);
  }

  .btn-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .btn-sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.7rem;
  }
</style>
