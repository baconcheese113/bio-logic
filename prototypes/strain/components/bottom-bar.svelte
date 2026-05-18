<script lang="ts">
  import type { FounderState, TelegraphState } from '../lib/simulation-engine';
  import { THREATS, type ThreatId } from '../lib/strain-data';

  interface Props {
    wave: number;
    secondsToEscalation: number;
    activeThreats: ThreatId[];
    telegraph: TelegraphState;
    usedSlots: number;
    founderState: FounderState;
    colonyDensity: number;
  }

  let { wave, secondsToEscalation, activeThreats, telegraph, usedSlots, founderState, colonyDensity }: Props = $props();
  const founderText = $derived(
    founderState === 'healthy' ? 'Founder glowing' :
    founderState === 'stressed' ? 'Founder stressed' :
    founderState === 'critical' ? 'Founder critical' :
    'Founder lost',
  );
</script>

<footer class="bottom-bar">
  <div class="wave">
    <span class="label">Wave {wave}</span>
    <div class="icons">
      {#each activeThreats as threat}
        <span class="threat" style={`--threat:${THREATS[threat].color}`} title={THREATS[threat].label}>
          {THREATS[threat].icon}
        </span>
      {/each}
      <span
        class:known={telegraph.nextThreatKnown}
        class="threat next"
        style={`--threat:${THREATS[telegraph.nextThreat].color}`}
        title={telegraph.nextThreatKnown ? THREATS[telegraph.nextThreat].label : 'Unknown next escalation'}
      >
        {telegraph.nextThreatKnown ? THREATS[telegraph.nextThreat].icon : '?'}
      </span>
    </div>
    <span class="timer">next {Math.ceil(secondsToEscalation)}s</span>
  </div>

  <div class="slots">plasmid slots {usedSlots}/6</div>

  <div class="founder" class:critical={founderState === 'critical'} class:stressed={founderState === 'stressed'}>
    <span class="founder-cell"></span>
    <span>{founderText} · colony {Math.round(colonyDensity)}%</span>
  </div>
</footer>

<style>
  .bottom-bar {
    min-height: 62px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    padding: 8px 18px;
    background: #17120e;
    border-top: 1px solid #2a261c;
    color: #f4ecdc;
    font-size: 14px;
  }

  .wave,
  .founder {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .label,
  .slots {
    font-family: var(--font-heading);
    color: #d4b896;
  }

  .icons {
    display: flex;
    gap: 5px;
  }

  .threat {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid var(--threat);
    color: #fff8e9;
    background: color-mix(in srgb, var(--threat) 42%, #120e0b);
    font-family: var(--font-heading);
    font-size: 14px;
  }

  .next {
    border-style: dashed;
    background: #332c22;
  }

  .next.known {
    border-style: solid;
    box-shadow: 0 0 12px color-mix(in srgb, var(--threat) 45%, transparent);
  }

  .timer {
    color: #f2b38f;
    white-space: nowrap;
  }

  .slots {
    white-space: nowrap;
  }

  .founder {
    justify-content: end;
    color: #d8cab0;
  }

  .founder-cell {
    width: 38px;
    height: 20px;
    border-radius: 50%;
    background: #ffdc83;
    box-shadow: 0 0 18px rgba(255, 220, 131, 0.5);
    border: 1px solid #fff2c4;
    flex: 0 0 auto;
  }

  .stressed .founder-cell {
    opacity: 0.72;
    box-shadow: 0 0 10px rgba(255, 166, 83, 0.35);
  }

  .critical .founder-cell {
    opacity: 0.5;
    background: #ce6a54;
    box-shadow: none;
  }

  @media (max-width: 760px) {
    .bottom-bar {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .founder {
      justify-content: start;
    }
  }
</style>
