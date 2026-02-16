<script lang="ts">
  import type { MediaType } from './streak-types';
  import { MEDIA_COLORS } from './streak-types';

  interface Props {
    mediaType: MediaType;
    currentTick: number;
    incubationStartTick: number;
    incubationDuration: number; // ticks
    onSkip: () => void;
  }

  let { mediaType, currentTick, incubationStartTick, incubationDuration, onSkip }: Props = $props();

  const elapsed = $derived(currentTick - incubationStartTick);
  const progress = $derived(Math.min(100, (elapsed / incubationDuration) * 100));
  const isComplete = $derived(elapsed >= incubationDuration);

  // Convert ticks to display time
  const hoursElapsed = $derived(Math.floor(elapsed / 36000)); // 10 ticks/sec * 3600 sec/hr
  const totalHours = $derived(Math.floor(incubationDuration / 36000));
</script>

<div class="incubation-view">
  <div class="incubator-visual">
    <div class="incubator-box">
      <div class="incubator-door">
        <div class="plate-inside">
          <div class="plate-circle" style:background={MEDIA_COLORS[mediaType].base}></div>
        </div>
        <div class="temperature">
          <span class="temp-value">37°C</span>
          <div class="temp-icon">
            <svg viewBox="0 0 16 40" width="16" height="40">
              <rect x="6" y="2" width="4" height="28" rx="2" fill="none" stroke="#c45a20" stroke-width="1" />
              <circle cx="8" cy="34" r="5" fill="#c45a20" />
              <rect x="7" y="{30 - progress * 0.25}" width="2" height="{progress * 0.25 + 4}" fill="#c45a20" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="incubation-info">
    <h3>Incubating</h3>
    <p class="time-display">
      {hoursElapsed}h / {totalHours}h
    </p>

    <div class="progress-bar">
      <div class="progress-fill" style:width="{progress}%"></div>
    </div>

    <p class="status-text">
      {#if isComplete}
        Incubation complete! Colonies have grown.
      {:else}
        Bacteria multiplying at 37°C...
      {/if}
    </p>

    <button class="btn btn-primary" onclick={onSkip}>
      {isComplete ? 'View Results' : 'Skip to Results'}
    </button>

    {#if !isComplete}
      <p class="hint-text">
        Or use the speed controls to fast-forward time.
      </p>
    {/if}
  </div>
</div>

<style>
  .incubation-view {
    display: flex;
    gap: var(--space-xl);
    align-items: center;
    justify-content: center;
  }

  .incubator-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .incubator-box {
    width: 200px;
    height: 220px;
    background: linear-gradient(180deg, #3a352e 0%, #2a2520 100%);
    border: 2px solid var(--brass-dark);
    border-radius: 8px;
    padding: var(--space-md);
    box-shadow: var(--shadow-lg);
  }

  .incubator-door {
    width: 100%;
    height: 100%;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
  }

  .plate-inside {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .plate-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px solid rgba(200, 180, 150, 0.2);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
    animation: pulse-warm 2s ease-in-out infinite;
  }

  @keyframes pulse-warm {
    0%, 100% { box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3); }
    50% { box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 8px rgba(196, 90, 32, 0.15); }
  }

  .temperature {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .temp-value {
    font-size: 0.85rem;
    color: #e8a060;
    font-family: var(--font-mono);
  }

  .incubation-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-width: 200px;
  }

  .incubation-info h3 {
    margin: 0;
    color: var(--brass-light);
    font-family: var(--font-heading);
  }

  .time-display {
    font-size: 1.5rem;
    font-family: var(--font-mono);
    color: var(--parchment);
    margin: 0;
  }

  .progress-bar {
    height: 10px;
    background: var(--bg-dark);
    border: 1px solid var(--brass-dark);
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c45a20, #e8a060);
    transition: width 0.3s;
    border-radius: 5px;
  }

  .status-text {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    margin: 0;
  }

  .hint-text {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
    margin: 0;
  }
</style>
