<script lang="ts">
  import type { Observation } from '../../lib/types';
  import { OBSERVATION_ICONS } from '../../lib/types';

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
      <header class="panel-header">
        <h3 class="m-0 text-sm text-brass-light">📓 Lab Notebook</h3>
      </header>
      
      <div class="notebook-body">
        {#if groupedObservations().length === 0}
          <p class="empty-text">No observations recorded yet.</p>
          <p class="empty-text text-xs mt-xs">Use instruments to examine samples and record what you see.</p>
        {:else}
          {#each groupedObservations() as group}
            <section class="mb-md">
              <h4 class="text-xs text-brass m-0 mb-sm border-b border-brass-dark pb-xs">🧑‍⚕️ {group.patientName}</h4>
              <ul class="list-none m-0 p-0">
                {#each group.observations as obs}
                  <li class="flex items-center gap-sm py-xs text-xs text-parchment">
                    <span class="text-sm flex-shrink-0">{OBSERVATION_ICONS[obs.source]}</span>
                    <span class="flex-1">{formatObservation(obs)}</span>
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

  .notebook-body {
    flex: 1;
    padding: var(--space-md);
    overflow-y: auto;
  }
</style>
