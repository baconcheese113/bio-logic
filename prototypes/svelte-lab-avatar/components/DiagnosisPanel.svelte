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
    <header class="flex items-center justify-between p-md panel-header">
      <h2 class="m-0 text-lg text-brass-light">Submit Diagnosis</h2>
      <button class="btn-close" onclick={onCancel}>✕</button>
    </header>

    <div class="flex-1 p-md overflow-y-auto">
      <!-- Patient info -->
      <section class="mb-lg patient-info">
        <h3 class="section-title">Patient</h3>
        <div class="flex items-center gap-md mb-sm">
          <span class="text-base font-semibold text-parchment">🧑‍⚕️ {patient.name}</span>
          <span class="patient-status {patient.status}">{patient.status}</span>
        </div>
        <p class="text-sm text-parchment-aged italic m-0">{patient.synopsis}</p>
      </section>

      <!-- Your observations -->
      <section class="mb-lg">
        <h3 class="section-title">Your Observations</h3>
        {#if patientObservations.length === 0}
          <p class="empty-text">No observations recorded for this patient.</p>
        {:else}
          <ul class="list-none m-0 p-0 flex flex-wrap gap-sm">
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
      <section class="mb-lg">
        <h3 class="section-title">Identified Organism</h3>
        <select class="select" bind:value={selectedOrganism}>
          <option value={null}>-- Select organism --</option>
          {#each ORGANISMS as org}
            <option value={org.id}>{org.name}</option>
          {/each}
        </select>
      </section>

      <!-- Category selection -->
      <section class="mb-lg">
        <h3 class="section-title">Category</h3>
        <div class="flex flex-wrap gap-xs">
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
      <section class="mb-lg">
        <h3 class="section-title">Recommended Treatment</h3>
        <select class="select" bind:value={selectedTreatment}>
          <option value={null}>-- Select treatment --</option>
          {#each TREATMENTS as treat}
            <option value={treat.id}>{treat.name}</option>
          {/each}
        </select>
      </section>
    </div>

    <footer class="flex gap-md justify-end p-md panel-footer">
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
    background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border-bottom: var(--border-thin);
  }

  .panel-footer {
    background: var(--bg-medium);
    border-top: var(--border-thin);
  }

  .section-title {
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

  .patient-status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .patient-status.stable { background: var(--patient-stable); color: white; }
  .patient-status.guarded { background: var(--patient-guarded); color: var(--bg-darkest); }
  .patient-status.declining { background: var(--patient-declining); color: white; }
  .patient-status.critical { background: var(--patient-critical); color: white; }

  .obs-item {
    background: var(--bg-medium);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
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

  .btn-sm {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.8rem;
  }
</style>
