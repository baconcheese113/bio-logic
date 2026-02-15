<script lang="ts">
  interface Props {
    currentTick: number;
    speed: number;
    isPaused: boolean;
    onSpeedChange: (speed: number) => void;
    onPauseToggle: () => void;
  }

  let { currentTick, speed, isPaused, onSpeedChange, onPauseToggle }: Props = $props();

  const speeds = [1, 2, 5, 10];

  // Convert ticks to time display (10 ticks = 1 second at 1x)
  const timeDisplay = $derived(() => {
    const totalSeconds = Math.floor(currentTick / 10);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  });

  const dateDisplay = $derived(() => {
    // Golden Age: start at January 15, 1885
    const baseDay = Math.floor(currentTick / (10 * 60 * 60 * 24));
    const day = 15 + baseDay;
    return `January ${day}, 1885`;
  });
</script>

<header class="header-bar" data-ref="clock-bar">
  <div class="flex flex-col items-start">
    <span class="text-xs text-muted" data-ref="clock-date">{dateDisplay()}</span>
    <span class="time-display" data-ref="clock-time">{timeDisplay()}</span>
  </div>

  <div class="flex items-center gap-md">
    <button
      class="btn pause-btn"
      class:active={isPaused}
      onclick={onPauseToggle}
      data-ref="clock-pause"
    >
      {isPaused ? '▶' : '⏸'}
    </button>

    <div class="flex gap-xs">
      {#each speeds as s}
        <button
          class="btn"
          class:active={speed === s && !isPaused}
          onclick={() => onSpeedChange(s)}
          disabled={isPaused}
          data-ref="clock-speed-{s}"
        >
          {s}x
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-col items-end">
    <span class="text-brass text-sm" data-ref="clock-era">Golden Age</span>
    <span class="text-xs text-muted">1880-1920</span>
  </div>
</header>

<style>
  .time-display {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    color: var(--brass-light);
    letter-spacing: 0.1em;
  }

  .pause-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 1.25rem;
  }
</style>
