<script lang="ts">
  import type { Patient, SampleType } from '../../shared/types';
  import { SAMPLE_COLORS } from '../../shared/types';

  interface Props {
    patient: Patient | null;
    playerHasSample: boolean;
    hasObservations: boolean;
    onCollectSample: (sampleType: SampleType) => void;
    onSubmitDiagnosis: () => void;
  }

  let { patient, playerHasSample, hasObservations, onCollectSample, onSubmitDiagnosis }: Props = $props();

  // Available samples that haven't been collected yet
  let availableSamples = $derived(
    patient
      ? patient.availableSamples.filter(s => !patient.collectedSamples.includes(s))
      : []
  );

  // Format sample type for display
  function formatSampleType(type: SampleType): string {
    return type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  // Status badge styling
  const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
    stable: { bg: 'var(--status-idle)', text: 'Stable' },
    guarded: { bg: 'var(--status-ready)', text: 'Guarded' },
    declining: { bg: 'var(--status-busy)', text: 'Declining' },
    critical: { bg: 'var(--status-error)', text: 'Critical' },
  };

  let statusBadge = $derived(patient ? STATUS_BADGE[patient.status] : null);
</script>

<aside class="sidebar" class:visible={patient !== null} data-ref="patient-panel">
  {#if patient && statusBadge}
    <div class="sidebar-header">
      <span class="icon-md">🧑‍⚕️</span>
      <span class="text-brass">{patient.name}</span>
    </div>

    <div class="sidebar-body">
      <section class="control-section">
        <h4>Status</h4>
        <span class="badge" style:background={statusBadge.bg}>
          {statusBadge.text}
        </span>
      </section>

      <section class="control-section">
        <h4>Complaint</h4>
        <p class="synopsis">{patient.synopsis}</p>
      </section>

      <section class="control-section">
        <h4>Available Samples</h4>
        {#if playerHasSample}
          <p class="warning-text">
            <span class="warning-icon">⚠️</span>
            Deposit your current sample first
          </p>
        {:else if availableSamples.length === 0}
          <p class="empty-text">All samples collected</p>
        {:else}
          <div class="sample-buttons">
            {#each availableSamples as sampleType}
              <button
                class="btn sample-btn"
                onclick={() => onCollectSample(sampleType)}
                style:--sample-color={SAMPLE_COLORS[sampleType]}
              >
                <span class="sample-dot" style:background={SAMPLE_COLORS[sampleType]}></span>
                {formatSampleType(sampleType)}
              </button>
            {/each}
          </div>
        {/if}
      </section>

      {#if patient.collectedSamples.length > 0}
        <section class="control-section">
          <h4>Already Collected</h4>
          <div class="collected-list">
            {#each patient.collectedSamples as sampleType}
              <span class="collected-tag" style:background={SAMPLE_COLORS[sampleType]}>
                {formatSampleType(sampleType)}
              </span>
            {/each}
          </div>
        </section>
      {/if}

      <section class="control-section">
        <h4>Diagnosis</h4>
        <button 
          class="btn btn-primary" 
          disabled={!hasObservations}
          onclick={onSubmitDiagnosis}
        >
          {hasObservations ? 'Submit Diagnosis' : 'Need evidence first'}
        </button>
      </section>
    </div>
  {:else}
    <div class="flex items-center justify-center flex-1 p-lg text-center text-muted">
      <p>Select a patient to view details</p>
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    transform: translateX(100%);
    transition: transform 0.2s ease;
  }

  .sidebar.visible {
    transform: translateX(0);
  }

  .synopsis {
    font-size: 0.875rem;
    color: var(--parchment-aged);
    line-height: 1.4;
  }

  .sample-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .sample-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .sample-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .warning-text {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--status-busy);
    font-size: 0.875rem;
  }

  .collected-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .collected-tag {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    color: white;
    opacity: 0.7;
  }
</style>
