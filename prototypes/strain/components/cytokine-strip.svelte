<script lang="ts">
  import type { TelegraphState } from '../lib/simulation-engine';
  import { THREATS } from '../lib/strain-data';

  interface Props {
    telegraph: TelegraphState;
    sampling: boolean;
    propagating: boolean;
  }

  let { telegraph, sampling, propagating }: Props = $props();
  const label = $derived(telegraph.nextThreatKnown ? `${THREATS[telegraph.nextThreat].cytokine} rising` : 'signal unknown');
</script>

<aside class:sample-flow={sampling} class:gene-flow={propagating} class="cytokine-strip" aria-label="Cytokine signal bridge">
  <div class="strip-label">cytokine live</div>
  <div class="signal-chip">{label}</div>
  {#each Array.from({ length: 20 }) as _, index}
    <span class="particle" style={`--i:${index}; --delay:${(index % 7) * 0.31}s`}></span>
  {/each}
</aside>

<style>
  .cytokine-strip {
    position: relative;
    width: 42px;
    min-width: 42px;
    overflow: hidden;
    background: #0d0a06;
    border-inline: 1px solid #2a261c;
  }

  .strip-label {
    position: absolute;
    inset: 10px 0 auto;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11px;
    letter-spacing: 1px;
    color: rgba(244, 236, 220, 0.72);
    text-transform: uppercase;
    margin: auto;
  }

  .signal-chip {
    position: absolute;
    left: 50%;
    bottom: 18px;
    width: 110px;
    transform: translateX(-50%) rotate(-90deg);
    transform-origin: center;
    color: #f4ecdc;
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: center;
  }

  .particle {
    position: absolute;
    left: 8px;
    width: 26px;
    height: 2px;
    top: calc((var(--i) * 41px) % 100%);
    background: #c4471f;
    opacity: 0.35;
    animation: drift 3.2s linear infinite;
    animation-delay: var(--delay);
  }

  .sample-flow .particle {
    background: #3a8c4d;
    opacity: 0.75;
  }

  .gene-flow .particle {
    background: #3a6ac2;
    opacity: 0.75;
    animation-direction: reverse;
  }

  @keyframes drift {
    from { transform: translateY(-80px); }
    to { transform: translateY(160px); }
  }
</style>
