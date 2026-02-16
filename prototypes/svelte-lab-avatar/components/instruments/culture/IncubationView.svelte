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

<div class="flex gap-xl items-center justify-center">
  <div class="flex flex-col items-center">
    <div class="incubator-box">
      <div class="w-full h-full bg-bg-dark border border-brass-dark rounded flex flex-col items-center justify-center gap-md">
        <div class="flex items-center justify-center">
          <div class="plate-circle" style:background={MEDIA_COLORS[mediaType].base}></div>
        </div>
        <div class="flex items-center gap-sm">
          <span class="text-sm font-mono" style="color: #e8a060;">37°C</span>
          <div>
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

  <div class="flex flex-col gap-sm min-w-[200px]">
    <h3 class="m-0 text-brass-light font-heading">Incubating</h3>
    <p class="text-2xl font-mono text-parchment m-0">
      {hoursElapsed}h / {totalHours}h
    </p>

    <div class="h-[10px] bg-bg-dark border border-brass-dark rounded-[5px] overflow-hidden">
      <div class="progress-fill" style:width="{progress}%"></div>
    </div>

    <p class="text-xs text-parchment-aged m-0">
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
      <p class="text-xs text-parchment-aged italic m-0">
        Or use the speed controls to fast-forward time.
      </p>
    {/if}
  </div>
</div>

<style>
  .incubator-box {
    width: 200px;
    height: 220px;
    background: linear-gradient(180deg, #3a352e 0%, #2a2520 100%);
    border: 2px solid var(--brass-dark);
    border-radius: 8px;
    padding: var(--space-md);
    box-shadow: var(--shadow-lg);
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

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c45a20, #e8a060);
    transition: width 0.3s;
    border-radius: 5px;
  }
</style>
