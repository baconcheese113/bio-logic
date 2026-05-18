<script lang="ts">
  import { INSTRUMENT_RUN_SECONDS, TUBE_RESPAWN_SECONDS, THREATS, type ThreatId } from '../lib/strain-data';
  import type { TelegraphState } from '../lib/simulation-engine';
  import { getElisaSignal } from '../lib/simulation-engine';

  type InstrumentId = 'elisa' | 'pcr' | 'reserved';
  type InstrumentStatus = 'idle' | 'running' | 'complete';

  interface InstrumentRun {
    status: InstrumentStatus;
    remaining: number;
  }

  interface Tube {
    id: number;
    availableIn: number;
  }

  interface Props {
    telegraph: TelegraphState;
    activeThreats: ThreatId[];
    surfaceSwitchActive: boolean;
    onElisaComplete: () => void;
    onSamplePulse: (instrument: 'elisa' | 'pcr') => void;
  }

  let { telegraph, activeThreats, surfaceSwitchActive, onElisaComplete, onSamplePulse }: Props = $props();

  let selectedTube = $state<number | null>(null);
  let tubes = $state<Tube[]>([
    { id: 1, availableIn: 0 },
    { id: 2, availableIn: 0 },
    { id: 3, availableIn: 0 },
  ]);
  let runs = $state<Record<InstrumentId, InstrumentRun>>({
    elisa: { status: 'idle', remaining: 0 },
    pcr: { status: 'idle', remaining: 0 },
    reserved: { status: 'idle', remaining: 0 },
  });

  const elisaSignal = $derived(getElisaSignal(telegraph.nextThreat));
  const pcrBands = $derived(surfaceSwitchActive ? [410] : [240, 520]);
  const pcrNote = $derived(
    surfaceSwitchActive
      ? 'Switched antigen beta is visible; current antibody binding is reduced.'
      : activeThreats.includes('antibody')
        ? 'Baseline antigen alpha is exposed while antibodies are active.'
        : 'Baseline antigen alpha is present. Antibody pressure is not active yet.',
  );

  $effect(() => {
    const interval = window.setInterval(() => {
      let elisaFinished = false;
      for (const run of Object.values(runs)) {
        if (run.status === 'running') {
          run.remaining = Math.max(0, run.remaining - 1);
          if (run.remaining === 0) {
            run.status = 'complete';
            if (run === runs.elisa) elisaFinished = true;
          }
        }
      }

      for (const tube of tubes) {
        if (tube.availableIn > 0) tube.availableIn = Math.max(0, tube.availableIn - 1);
      }

      if (elisaFinished) onElisaComplete();
    }, 1000);

    return () => window.clearInterval(interval);
  });

  function selectTube(id: number) {
    const tube = tubes.find(item => item.id === id);
    if (!tube || tube.availableIn > 0) return;
    selectedTube = selectedTube === id ? null : id;
  }

  function loadInstrument(instrument: InstrumentId) {
    if (instrument === 'reserved' || selectedTube === null) return;
    if (runs[instrument].status === 'running') return;
    const tube = tubes.find(item => item.id === selectedTube);
    if (!tube || tube.availableIn > 0) return;

    tube.availableIn = TUBE_RESPAWN_SECONDS;
    selectedTube = null;
    runs[instrument] = { status: 'running', remaining: INSTRUMENT_RUN_SECONDS };
    onSamplePulse(instrument);
  }
</script>

<section class="instrument-bay">
  <div class="instrument-grid">
    <button class="instrument-card" type="button" onclick={() => loadInstrument('elisa')}>
      <div class="instrument-title">ELISA · Cytokine Panel</div>
      <div class="plate" aria-label="96 well plate">
        {#each Array.from({ length: 24 }) as _, index}
          <span class:hot={index === 5 || index === 6 || index === 10}></span>
        {/each}
      </div>
      {#if runs.elisa.status === 'running'}
        <div class="run-state">running · {runs.elisa.remaining}s</div>
      {:else if runs.elisa.status === 'complete'}
        <div class="result"><b>{elisaSignal.cytokine}</b> elevated · {elisaSignal.meaning}</div>
      {:else}
        <div class="hint">click a tube, then this slot</div>
      {/if}
    </button>

    <button class="instrument-card" type="button" onclick={() => loadInstrument('pcr')}>
      <div class="instrument-title">PCR · Surface Antigen Profile</div>
      <svg class="gel" viewBox="0 0 160 76" role="img" aria-label="PCR gel bands">
        <rect x="4" y="4" width="152" height="68" rx="4"></rect>
        {#each [14, 28, 42, 56] as y}
          <line x1="12" x2="34" y1={y} y2={y}></line>
        {/each}
        {#each pcrBands as band, index}
          <rect x={70 + index * 34} y={band === 410 ? 30 : 44} width="24" height="5" rx="2"></rect>
        {/each}
      </svg>
      {#if runs.pcr.status === 'running'}
        <div class="run-state">running · {runs.pcr.remaining}s</div>
      {:else if runs.pcr.status === 'complete'}
        <div class="result">{pcrNote}</div>
      {:else}
        <div class="hint">click a tube, then this slot</div>
      {/if}
    </button>

    <button class="instrument-card reserved" type="button" onclick={() => loadInstrument('reserved')}>
      <div class="instrument-title">Reserved Instrument Bay</div>
      <div class="empty-slot">future assay</div>
      <div class="hint">inactive in prototype</div>
    </button>
  </div>

  <div class="legend" aria-label="Cytokine reference legend">
    <strong>Cytokine reference</strong>
    {#each Object.values(THREATS) as threat (threat.id)}
      <span><b>{threat.cytokine}</b> → {threat.cytokineMeaning}</span>
    {/each}
  </div>

  <div class="sample-tray">
    <span class="tray-title">sample tray</span>
    {#each tubes as tube (tube.id)}
      <button
        class:selected={selectedTube === tube.id}
        class="tube"
        disabled={tube.availableIn > 0}
        type="button"
        onclick={() => selectTube(tube.id)}
      >
        <span class="tube-glass"></span>
        <span>{tube.availableIn > 0 ? `${tube.availableIn}s` : `tube ${tube.id}`}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .instrument-bay {
    display: grid;
    gap: 10px;
  }

  .instrument-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .instrument-card {
    min-height: 174px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;
    padding: 10px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: #fffbf0;
    color: #1f1d18;
    text-align: center;
    font-size: 14px;
  }

  .instrument-title {
    width: 100%;
    font-family: var(--font-heading);
    font-size: 13px;
    color: #1f1d18;
    border-bottom: 1px dashed #6f6553;
    padding-bottom: 5px;
  }

  .plate {
    display: grid;
    grid-template-columns: repeat(6, 13px);
    gap: 4px;
    padding: 8px;
    background: #f0eadc;
    border: 1px solid #6f6553;
    border-radius: 6px;
  }

  .plate span {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #e5d9bd;
    border: 1px solid #9c8d70;
  }

  .plate .hot {
    background: #d98142;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.25);
  }

  .gel {
    width: min(150px, 100%);
    height: 78px;
  }

  .gel rect:first-child {
    fill: #1a2032;
    stroke: #6f84b8;
  }

  .gel line,
  .gel rect:not(:first-child) {
    stroke: #eaf1ff;
    fill: #eaf1ff;
    opacity: 0.8;
  }

  .empty-slot {
    width: 100%;
    min-height: 78px;
    display: grid;
    place-items: center;
    border: 1px dashed #6f6553;
    border-radius: 6px;
    color: #6f6553;
    background: repeating-linear-gradient(45deg, #fffbf0, #fffbf0 6px, #f4ecdc 6px, #f4ecdc 12px);
  }

  .hint,
  .run-state,
  .result {
    min-height: 34px;
    font-size: 14px;
    line-height: 1.25;
  }

  .run-state {
    color: #a8551c;
    font-family: var(--font-mono);
  }

  .result b {
    color: #a8551c;
  }

  .legend {
    display: grid;
    grid-template-columns: auto repeat(3, minmax(0, 1fr));
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: #f8f2e2;
    color: #1f1d18;
    font-size: 14px;
    line-height: 1.25;
  }

  .legend strong {
    font-family: var(--font-heading);
  }

  .sample-tray {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: #fffbf0;
    color: #1f1d18;
  }

  .tray-title {
    font-family: var(--font-heading);
    font-size: 13px;
    text-transform: uppercase;
  }

  .tube {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 38px;
    border: 1px solid #6f6553;
    border-radius: 18px;
    background: #fff8e8;
    color: #1f1d18;
    padding: 4px 10px;
    font-size: 14px;
  }

  .tube.selected {
    outline: 2px solid #3a6ac2;
  }

  .tube:disabled {
    opacity: 0.55;
  }

  .tube-glass {
    width: 12px;
    height: 24px;
    border: 1px solid #2a261c;
    border-radius: 2px 2px 6px 6px;
    background: linear-gradient(to top, #3a8c4d 0 40%, #fffaea 40%);
  }

  @media (max-width: 940px) {
    .instrument-grid,
    .legend {
      grid-template-columns: 1fr;
    }
  }
</style>
