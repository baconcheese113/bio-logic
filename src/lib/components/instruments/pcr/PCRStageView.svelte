<script lang="ts">
  import PCRInstrument from './PCRInstrument.svelte';
  import type { GeneSequenceData, PrimerDesign, PrimerQuality } from '../../../../data/organisms';

  interface Props {
    geneData: GeneSequenceData | null;
    primerDesign: PrimerDesign | null;
    primerQuality: PrimerQuality | null;
    currentCycle: number;
    currentTemp: number;
    currentStage: 'denaturation' | 'annealing' | 'extension' | 'idle';
    workflowStage: 'design' | 'run' | 'gel';
    onHover?: (key: string) => void;
  }

  let { 
    geneData, 
    primerDesign, 
    primerQuality,
    currentCycle,
    currentTemp,
    currentStage,
    workflowStage,
    onHover = () => {}
  }: Props = $props();

  let pcrInstrumentRef = $state<PCRInstrument>();

  const BASES_PER_LINE = 50;

  // Split sequence into lines
  const sequenceLines = $derived(() => {
    if (!geneData) return [];
    const lines: string[] = [];
    for (let i = 0; i < geneData.fullSequence.length; i += BASES_PER_LINE) {
      lines.push(geneData.fullSequence.substring(i, i + BASES_PER_LINE));
    }
    return lines;
  });

  // Get color for each base
  function getBaseColor(base: string): string {
    switch (base.toUpperCase()) {
      case 'A': return '#ff6b6b';
      case 'T': return '#4a9eff';
      case 'G': return '#5fb86c';
      case 'C': return '#ffd93d';
      default: return '#888';
    }
  }

  // Check if position is within primer range
  function isInPrimer(absolutePos: number): 'forward' | 'reverse' | null {
    if (!primerDesign) return null;
    
    if (absolutePos >= primerDesign.forwardStart && 
        absolutePos < primerDesign.forwardStart + primerDesign.forwardLength) {
      return 'forward';
    }
    
    if (absolutePos >= primerDesign.reverseStart && 
        absolutePos < primerDesign.reverseStart + primerDesign.reverseLength) {
      return 'reverse';
    }
    
    return null;
  }

  function getQualityColor(qual: PrimerQuality['overallQuality']): string {
    switch (qual) {
      case 'excellent': return '#5fb86c';
      case 'good': return '#6a9fb5';
      case 'acceptable': return '#ffd93d';
      case 'poor': return '#ff9f40';
      case 'fail': return '#ff6b6b';
      default: return '#888';
    }
  }

  // Expose methods for parent
  export function loadSample() {
    pcrInstrumentRef?.loadSample();
  }

  export function startCycling() {
    pcrInstrumentRef?.startCycling();
  }

  export function completeCycling() {
    pcrInstrumentRef?.completeCycling();
  }
</script>

<div class="pcr-stage-view">
  <!-- Design Stage: Gene Sequence + Quality Metrics -->
  {#if workflowStage === 'design'}
    <!-- Gene Sequence Section -->
    {#if geneData}
      <div class="gene-section">
      <div class="section-header">
        <h3 
          onmouseenter={() => onHover('gene-sequence')}
        >
          {geneData.name}
        </h3>
        <span class="gene-description">{geneData.description}</span>
      </div>

      <div class="sequence-display">
        {#each sequenceLines() as line, lineIndex}
          {@const startPos = lineIndex * BASES_PER_LINE}
          <div class="sequence-line">
            <span 
              class="line-number"
              role="button"
              tabindex="0"
              onmouseenter={() => onHover('sequence-position')}
            >
              {startPos + 1}
            </span>
            <div class="bases">
              {#each line.split('') as base, charIndex}
                {@const absolutePos = startPos + charIndex}
                {@const primerType = isInPrimer(absolutePos)}
                <span 
                  class="base"
                  class:forward-primer={primerType === 'forward'}
                  class:reverse-primer={primerType === 'reverse'}
                  role="button"
                  tabindex="0"
                  style="color: {getBaseColor(base)}"
                  onmouseenter={() => onHover(primerType ? `primer-${primerType}` : `base-${base.toUpperCase()}`)}
                >
                  {base}
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      {#if primerDesign}
        <div class="primer-positions">
          <div class="primer-pos forward">
            <span>Forward: {primerDesign.forwardStart + 1}-{primerDesign.forwardStart + primerDesign.forwardLength}</span>
          </div>
          <div class="primer-pos reverse">
            <span>Reverse: {primerDesign.reverseStart + 1}-{primerDesign.reverseStart + primerDesign.reverseLength}</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Quality Evaluation Section -->
  {#if primerQuality}
    <div class="quality-section">
      <div class="quality-header">
        <span 
          class="quality-badge" 
          style="background: {getQualityColor(primerQuality.overallQuality)}; border-color: {getQualityColor(primerQuality.overallQuality)}"
          onmouseenter={() => onHover('quality-overall')}
                  role="button"
                  tabindex="-1"
        >
          {primerQuality.overallQuality.toUpperCase()}
        </span>
        <span class="quality-label">Primer Quality</span>
      </div>

      <div class="metrics-grid">
        <div 
          class="metric"
          class:pass={primerQuality.tmMatch}
          onmouseenter={() => onHover('metric-tm')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">{primerQuality.tmMatch ? '✓' : '✗'}</span>
          <div class="metric-content">
            <span class="metric-name">Tm Match</span>
            <span class="metric-value">{primerQuality.forwardTm}°C / {primerQuality.reverseTm}°C</span>
            <span class="metric-detail">Δ{primerQuality.tmDifference}°C</span>
          </div>
        </div>

        <div 
          class="metric"
          class:pass={primerQuality.gcContentGood}
          onmouseenter={() => onHover('metric-gc')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">{primerQuality.gcContentGood ? '✓' : '✗'}</span>
          <div class="metric-content">
            <span class="metric-name">GC Content</span>
            <span class="metric-value">{primerQuality.forwardGC}% / {primerQuality.reverseGC}%</span>
            <span class="metric-detail">{primerQuality.gcContentGood ? '40-60% range' : 'Out of range'}</span>
          </div>
        </div>

        <div 
          class="metric"
          class:pass={primerQuality.selfCompGood}
          onmouseenter={() => onHover('metric-complementarity')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">{primerQuality.selfCompGood ? '✓' : '⚠'}</span>
          <div class="metric-content">
            <span class="metric-name">Complementarity</span>
            <span class="metric-value">Score: {primerQuality.selfComplementarity}/10</span>
            <span class="metric-detail">{primerQuality.selfCompGood ? 'Low dimer risk' : 'Dimer risk'}</span>
          </div>
        </div>

        <div 
          class="metric"
          class:pass={!primerQuality.hasHairpins}
          onmouseenter={() => onHover('metric-hairpins')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">{!primerQuality.hasHairpins ? '✓' : '✗'}</span>
          <div class="metric-content">
            <span class="metric-name">Hairpins</span>
            <span class="metric-value">{primerQuality.hasHairpins ? `${primerQuality.hairpinDetails?.length || 0} detected` : 'None'}</span>
            <span class="metric-detail">{!primerQuality.hasHairpins ? 'Good' : 'Will fail'}</span>
          </div>
        </div>

        <div 
          class="metric"
          class:pass={primerQuality.productSizeGood}
          onmouseenter={() => onHover('metric-product-size')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">{primerQuality.productSizeGood ? '✓' : '✗'}</span>
          <div class="metric-content">
            <span class="metric-name">Product Size</span>
            <span class="metric-value">{primerQuality.productSize} bp</span>
            <span class="metric-detail">{primerQuality.productSizeGood ? '100-1000 bp' : 'Out of range'}</span>
          </div>
        </div>

        <div 
          class="metric prediction"
          onmouseenter={() => onHover('pcr-prediction')}
                  role="button"
                  tabindex="-1"
        >
          <span class="icon">🔬</span>
          <div class="metric-content">
            <span class="metric-name">Expected Result</span>
            <span class="metric-value prediction-text">
              {#if primerQuality.expectedBandPattern === 'clean'}
                Single bright band
              {:else if primerQuality.expectedBandPattern === 'weak'}
                Weak/faint band
              {:else if primerQuality.expectedBandPattern === 'dimers'}
                Primer-dimers + weak band
              {:else if primerQuality.expectedBandPattern === 'smeared'}
                Smeared bands
              {:else}
                No amplification
              {/if}
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}
  {/if}

  <!-- Run Stage: PCR Instrument + Primer Summary -->
  {#if workflowStage === 'run' || workflowStage === 'gel'}
    {#if primerDesign && primerQuality}
      <div class="run-stage">
        <div class="primer-summary">
          <h3>Selected Primers</h3>
          <div class="summary-grid">
            <div class="summary-item forward">
              <span class="label">Forward:</span>
              <span class="value">Position {primerDesign.forwardStart + 1}-{primerDesign.forwardStart + primerDesign.forwardLength}</span>
              <span class="detail">{primerDesign.forwardLength}bp, Tm: {primerQuality.forwardTm}°C, GC: {primerQuality.forwardGC}%</span>
            </div>
            <div class="summary-item reverse">
              <span class="label">Reverse:</span>
              <span class="value">Position {primerDesign.reverseStart + 1}-{primerDesign.reverseStart + primerDesign.reverseLength}</span>
              <span class="detail">{primerDesign.reverseLength}bp, Tm: {primerQuality.reverseTm}°C, GC: {primerQuality.reverseGC}%</span>
            </div>
            <div class="summary-item product">
              <span class="label">Expected Product:</span>
              <span class="value">{primerQuality.productSize} bp</span>
              <span 
                class="detail quality-indicator" 
                style="color: {getQualityColor(primerQuality.overallQuality)}"
              >
                Quality: {primerQuality.overallQuality.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div class="instrument-section">
          <PCRInstrument 
            bind:this={pcrInstrumentRef}
            {currentCycle}
            {currentTemp}
            {currentStage}
            {primerQuality}
          />
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .pcr-stage-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #0a0a0a;
    overflow-y: auto;
  }

  /* Gene Sequence Section */
  .gene-section {
    background: #1a1a1a;
    border: 2px solid #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
  }

  .section-header {
    margin-bottom: 0.75rem;
  }

  .section-header h3 {
    margin: 0 0 0.25rem 0;
    color: #6a9fb5;
    font-size: 1.1rem;
    cursor: help;
  }

  .gene-description {
    color: #888;
    font-size: 0.9rem;
  }

  .sequence-display {
    background: #0a0a0a;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    padding: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .sequence-display::-webkit-scrollbar {
    width: 8px;
  }

  .sequence-display::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .sequence-display::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 4px;
  }

  .sequence-line {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
    align-items: center;
  }

  .line-number {
    color: #666;
    font-size: 0.75rem;
    min-width: 3rem;
    text-align: right;
    user-select: none;
    cursor: help;
  }

  .bases {
    display: flex;
    gap: 2px;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .base {
    font-weight: 600;
    padding: 1px 2px;
    border-radius: 2px;
    transition: all 0.2s;
    cursor: help;
  }

  .base:hover {
    transform: scale(1.15);
  }

  .base.forward-primer {
    background: rgba(95, 184, 108, 0.3);
    border-bottom: 2px solid #5fb86c;
  }

  .base.reverse-primer {
    background: rgba(255, 159, 64, 0.3);
    border-bottom: 2px solid #ff9f40;
  }

  .primer-positions {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.85rem;
  }

  .primer-pos {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  .primer-pos.forward {
    background: rgba(95, 184, 108, 0.2);
    border-left: 3px solid #5fb86c;
    color: #5fb86c;
  }

  .primer-pos.reverse {
    background: rgba(255, 159, 64, 0.2);
    border-left: 3px solid #ff9f40;
    color: #ff9f40;
  }

  /* Quality Section */
  .quality-section {
    background: #1a1a1a;
    border: 2px solid #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
  }

  .quality-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .quality-badge {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: bold;
    font-size: 0.9rem;
    color: #fff;
    border: 2px solid;
    cursor: help;
  }

  .quality-label {
    color: #aaa;
    font-size: 0.95rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .metric {
    background: #0a0a0a;
    border: 2px solid #2a2a2a;
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    gap: 0.5rem;
    transition: all 0.2s;
    cursor: help;
  }

  .metric:hover {
    border-color: #4a4a4a;
    transform: translateY(-2px);
  }

  .metric.pass {
    border-left: 3px solid #5fb86c;
  }

  .metric:not(.pass):not(.prediction) {
    border-left: 3px solid #ff6b6b;
  }

  .metric.prediction {
    border-left: 3px solid #6a9fb5;
  }

  .metric .icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .metric.pass .icon {
    color: #5fb86c;
  }

  .metric:not(.pass):not(.prediction) .icon {
    color: #ff6b6b;
  }

  .metric-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .metric-name {
    color: #aaa;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .metric-value {
    color: #fff;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .metric-detail {
    color: #888;
    font-size: 0.75rem;
  }

  .prediction-text {
    color: #6a9fb5;
  }

  /* Run Stage */
  .run-stage {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  .primer-summary {
    background: #0a0a0a;
    border: 2px solid #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
  }

  .primer-summary h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #e0e0e0;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: #1a1a1a;
    border-left: 3px solid #4a4a4a;
    border-radius: 4px;
  }

  .summary-item.forward {
    border-left-color: #5fb86c;
  }

  .summary-item.reverse {
    border-left-color: #ff9f40;
  }

  .summary-item.product {
    border-left-color: #6a9fb5;
  }

  .summary-item .label {
    color: #aaa;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .summary-item .value {
    color: #fff;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .summary-item .detail {
    color: #888;
    font-size: 0.75rem;
  }

  .quality-indicator {
    font-weight: 600;
  }

  /* Instrument Section */
  .instrument-section {
    flex: 1;
    min-height: 400px;
    background: #0a0a0a;
    border: 2px solid #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
  }
</style>
