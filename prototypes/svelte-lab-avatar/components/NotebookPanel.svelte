<script lang="ts">
  import type { Observation } from '../../shared/types';
  import { INSTRUMENT_ICONS } from '../../shared/types';

  interface Props {
    observations: Observation[];
    isOpen: boolean;
    onToggle: () => void;
  }

  let { observations, isOpen, onToggle }: Props = $props();

  // Group observations by caseId (patient)
  const groupedObservations = $derived(() => {
    const groups: Record<string, { patientName: string; observations: Observation[] }> = {};
    
    for (const obs of observations) {
      if (!groups[obs.caseId]) {
        groups[obs.caseId] = {
          patientName: obs.patientName,
          observations: [],
        };
      }
      groups[obs.caseId].observations.push(obs);
    }
    
    return Object.values(groups);
  });

  function formatObservation(obs: Observation): string {
    const fieldLabels: Record<string, string> = {
      gram: 'Gram stain',
      shape: 'Morphology',
      arrangement: 'Arrangement',
      'acid-fast': 'Acid-fast',
      capsule: 'Capsule',
      spores: 'Spores',
      hemolysis: 'Hemolysis',
      colonyColor: 'Colony color',
      growth: 'Growth',
    };
    
    const label = fieldLabels[obs.field] || obs.field;
    return `${label}: ${obs.value}`;
  }
</script>

<div class="notebook-container" class:open={isOpen}>
  <button class="notebook-toggle" onclick={onToggle} title="Toggle Notebook">
    📓 {observations.length > 0 ? `(${observations.length})` : ''}
  </button>
  
  {#if isOpen}
    <aside class="notebook-panel">
      <header class="notebook-header">
        <h3>📓 Lab Notebook</h3>
      </header>
      
      <div class="notebook-body">
        {#if groupedObservations().length === 0}
          <p class="empty-text">No observations recorded yet.</p>
          <p class="empty-text text-sm">Use instruments to examine samples and record what you see.</p>
        {:else}
          {#each groupedObservations() as group}
            <section class="patient-group">
              <h4 class="patient-name">🧑‍⚕️ {group.patientName}</h4>
              <ul class="obs-list">
                {#each group.observations as obs}
                  <li class="obs-item">
                    <span class="obs-icon">{INSTRUMENT_ICONS[obs.instrumentType]}</span>
                    <span class="obs-text">{formatObservation(obs)}</span>
                  </li>
                {/each}
              </ul>
            </section>
          {/each}
        {/if}
      </div>
    </aside>
  {/if}
</div>

<style>
  .notebook-container {
    position: absolute;
    top: 60px;
    left: 0;
    z-index: 100;
  }

  .notebook-toggle {
    background: var(--bg-dark);
    border: var(--border-medium);
    border-left: none;
    border-radius: 0 8px 8px 0;
    padding: var(--space-sm) var(--space-md);
    color: var(--parchment);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .notebook-toggle:hover {
    background: var(--bg-medium);
    border-color: var(--brass-light);
  }

  .notebook-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 280px;
    max-height: 400px;
    background: var(--bg-dark);
    border: var(--border-medium);
    border-radius: 0 8px 8px 0;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .notebook-header {
    padding: var(--space-sm) var(--space-md);
    background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border-bottom: var(--border-thin);
  }

  .notebook-header h3 {
    margin: 0;
    font-size: 0.9rem;
    color: var(--brass-light);
  }

  .notebook-body {
    flex: 1;
    padding: var(--space-md);
    overflow-y: auto;
  }

  .patient-group {
    margin-bottom: var(--space-md);
  }

  .patient-name {
    font-size: 0.8rem;
    color: var(--brass);
    margin: 0 0 var(--space-sm) 0;
    border-bottom: 1px solid var(--brass-dark);
    padding-bottom: var(--space-xs);
  }

  .obs-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .obs-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
    font-size: 0.8rem;
    color: var(--parchment);
  }

  .obs-icon {
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .obs-text {
    flex: 1;
  }

  .text-sm {
    font-size: 0.75rem;
    margin-top: var(--space-xs);
  }
</style>
