<script lang="ts">
  import type { Patient } from '../../shared/types';
  import { TILE_SIZE } from '../../shared/mock-data';

  interface Props {
    patient: Patient;
    isAdjacent?: boolean;
    onclick?: () => void;
  }

  let { patient, isAdjacent = false, onclick }: Props = $props();

  // Patience bar percentage
  let patiencePercent = $derived(
    Math.max(0, (patient.patienceTicks / patient.maxPatienceTicks) * 100)
  );

  // Patience color: green -> yellow -> red
  let patienceColor = $derived(
    patiencePercent > 60 ? 'var(--success)' :
    patiencePercent > 30 ? 'var(--warning)' :
    'var(--error)'
  );

  // Status indicator color
  const STATUS_COLORS: Record<string, string> = {
    stable: 'var(--success)',
    guarded: 'var(--info)',
    declining: 'var(--warning)',
    critical: 'var(--error)',
  };
</script>

<button
  class="patient-tile"
  class:adjacent={isAdjacent}
  style:width="{TILE_SIZE}px"
  style:height="{TILE_SIZE}px"
  onclick={onclick}
  disabled={!isAdjacent}
>
  <!-- Waiting bench background -->
  <div class="bench"></div>

  <!-- Patient face -->
  <svg class="patient-face" viewBox="0 0 40 50" width="32" height="40">
    <!-- Face shape -->
    {#if patient.appearance.faceShape === 'round'}
      <ellipse cx="20" cy="24" rx="16" ry="18" fill={patient.appearance.skinTone} />
    {:else if patient.appearance.faceShape === 'oval'}
      <ellipse cx="20" cy="26" rx="14" ry="20" fill={patient.appearance.skinTone} />
    {:else}
      <rect x="6" y="8" width="28" height="34" rx="4" fill={patient.appearance.skinTone} />
    {/if}

    <!-- Hair -->
    {#if patient.appearance.hairStyle !== 'bald'}
      <path
        d={patient.appearance.hairStyle === 'short' 
          ? 'M8 18 Q20 4 32 18 Q30 8 20 6 Q10 8 8 18'
          : patient.appearance.hairStyle === 'long'
          ? 'M6 20 Q20 0 34 20 L34 35 Q32 38 30 35 L30 20 Q20 10 10 20 L10 35 Q8 38 6 35 Z'
          : 'M6 18 Q10 2 20 6 Q30 2 34 18 Q28 8 20 10 Q12 8 6 18'}
        fill={patient.appearance.hairColor}
      />
    {/if}

    <!-- Eyes -->
    <g class="eyes">
      {#if patient.appearance.eyeStyle === 'tired'}
        <line x1="11" y1="22" x2="17" y2="24" stroke="#333" stroke-width="2" />
        <line x1="23" y1="24" x2="29" y2="22" stroke="#333" stroke-width="2" />
      {:else if patient.appearance.eyeStyle === 'worried'}
        <ellipse cx="14" cy="24" rx="3" ry="4" fill="white" />
        <ellipse cx="26" cy="24" rx="3" ry="4" fill="white" />
        <circle cx="14" cy="25" r="2" fill="#333" />
        <circle cx="26" cy="25" r="2" fill="#333" />
      {:else}
        <ellipse cx="14" cy="24" rx="2.5" ry="3" fill="white" />
        <ellipse cx="26" cy="24" rx="2.5" ry="3" fill="white" />
        <circle cx="14" cy="24" r="1.5" fill="#333" />
        <circle cx="26" cy="24" r="1.5" fill="#333" />
      {/if}
    </g>

    <!-- Mouth - varies by status -->
    {#if patient.status === 'critical'}
      <path d="M14 36 Q20 32 26 36" stroke="#333" stroke-width="1.5" fill="none" />
    {:else if patient.status === 'declining'}
      <line x1="14" y1="35" x2="26" y2="35" stroke="#333" stroke-width="1.5" />
    {:else}
      <path d="M14 34 Q20 38 26 34" stroke="#333" stroke-width="1.5" fill="none" />
    {/if}
  </svg>

  <!-- Status indicator dot -->
  <div class="status-dot" style:background={STATUS_COLORS[patient.status]} title={patient.status}></div>

  <!-- Patience bar -->
  <div class="patience-bar-container">
    <div class="patience-bar" style:width="{patiencePercent}%" style:background={patienceColor}></div>
  </div>
</button>

<style>
  .patient-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: default;
    border: none;
    background: transparent;
    padding: 0;
    transition: filter 0.15s ease;
  }

  .patient-tile.adjacent {
    cursor: pointer;
  }

  .patient-tile.adjacent:hover {
    filter: brightness(1.2);
  }

  .patient-tile.adjacent:hover .patient-face {
    transform: scale(1.05);
  }

  .bench {
    position: absolute;
    bottom: 0;
    left: 4px;
    right: 4px;
    height: 24px;
    background: linear-gradient(to bottom, #8b4513, #654321);
    border-radius: 2px;
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4);
  }

  .patient-face {
    position: relative;
    z-index: 1;
    margin-bottom: 8px;
    transition: transform 0.15s ease;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
  }

  .status-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.3);
    box-shadow: 0 0 4px currentColor;
  }

  .patience-bar-container {
    position: absolute;
    bottom: 4px;
    left: 8px;
    right: 8px;
    height: 4px;
    background: rgba(0,0,0,0.4);
    border-radius: 2px;
    overflow: hidden;
  }

  .patience-bar {
    height: 100%;
    transition: width 0.5s linear, background 0.3s ease;
    border-radius: 2px;
  }
</style>
