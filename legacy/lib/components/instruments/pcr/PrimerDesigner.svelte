<script lang="ts">
  import type { GeneSequenceData, PrimerDesign } from '../../../../data/organisms';
  import { extractPrimerSequences } from '../../../utils/primer-calculations';

  interface Props {
    geneData: GeneSequenceData;
    primerDesign: PrimerDesign;
    onDesignChange: (design: PrimerDesign) => void;
  }

  let { geneData, primerDesign, onDesignChange }: Props = $props();

  // Extract current primer sequences
  const primerSequences = $derived(
    extractPrimerSequences(geneData.fullSequence, primerDesign)
  );

  function updateForwardStart(value: number) {
    onDesignChange({
      ...primerDesign,
      forwardStart: value,
    });
  }

  function updateForwardLength(value: number) {
    onDesignChange({
      ...primerDesign,
      forwardLength: value,
    });
  }

  function updateReverseStart(value: number) {
    onDesignChange({
      ...primerDesign,
      reverseStart: value,
    });
  }

  function updateReverseLength(value: number) {
    onDesignChange({
      ...primerDesign,
      reverseLength: value,
    });
  }
</script>

<div class="primer-designer">
  <div class="primer-section forward">
    <h4>Forward Primer</h4>
    
    <div class="slider-group">
      <label>
        <span class="label-text">Position: {primerDesign.forwardStart + 1}</span>
        <input
          type="range"
          min={geneData.suggestedForwardRange.min}
          max={geneData.suggestedForwardRange.max}
          value={primerDesign.forwardStart}
          oninput={(e) => updateForwardStart(parseInt(e.currentTarget.value))}
          class="slider"
        />
        <div class="range-display">
          {geneData.suggestedForwardRange.min + 1} - {geneData.suggestedForwardRange.max + 1}
        </div>
      </label>
    </div>

    <div class="slider-group">
      <label>
        <span class="label-text">Length: {primerDesign.forwardLength} bp</span>
        <input
          type="range"
          min="18"
          max="25"
          value={primerDesign.forwardLength}
          oninput={(e) => updateForwardLength(parseInt(e.currentTarget.value))}
          class="slider"
        />
        <div class="range-display">18 - 25 bp</div>
      </label>
    </div>

    <div class="sequence-display">
      <div class="sequence-label">5'</div>
      <div class="sequence">{primerSequences.forward}</div>
      <div class="sequence-label">3'</div>
    </div>
  </div>

  <div class="primer-section reverse">
    <h4>Reverse Primer</h4>
    
    <div class="slider-group">
      <label>
        <span class="label-text">Position: {primerDesign.reverseStart + 1}</span>
        <input
          type="range"
          min={geneData.suggestedReverseRange.min}
          max={geneData.suggestedReverseRange.max}
          value={primerDesign.reverseStart}
          oninput={(e) => updateReverseStart(parseInt(e.currentTarget.value))}
          class="slider"
        />
        <div class="range-display">
          {geneData.suggestedReverseRange.min + 1} - {geneData.suggestedReverseRange.max + 1}
        </div>
      </label>
    </div>

    <div class="slider-group">
      <label>
        <span class="label-text">Length: {primerDesign.reverseLength} bp</span>
        <input
          type="range"
          min="18"
          max="25"
          value={primerDesign.reverseLength}
          oninput={(e) => updateReverseLength(parseInt(e.currentTarget.value))}
          class="slider"
        />
        <div class="range-display">18 - 25 bp</div>
      </label>
    </div>

    <div class="sequence-display">
      <div class="sequence-label">5'</div>
      <div class="sequence">{primerSequences.reverse}</div>
      <div class="sequence-label">3'</div>
    </div>
  </div>
</div>

<style>
  .primer-designer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .primer-section {
    background: #1a1a1a;
    border: 2px solid #2a2a2a;
    border-radius: 6px;
    padding: 1rem;
  }

  .primer-section.forward {
    border-left: 3px solid #5fb86c;
  }

  .primer-section.reverse {
    border-left: 3px solid #ff9f40;
  }

  .primer-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: #e0e0e0;
  }

  .primer-section.forward h4 {
    color: #5fb86c;
  }

  .primer-section.reverse h4 {
    color: #ff9f40;
  }

  .slider-group {
    margin-bottom: 1rem;
  }

  .slider-group label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .label-text {
    color: #ccc;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .slider {
    width: 100%;
    height: 6px;
    background: #2a2a2a;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #6a9fb5;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    background: #7ab5cc;
    transform: scale(1.1);
  }

  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: #6a9fb5;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .slider::-moz-range-thumb:hover {
    background: #7ab5cc;
    transform: scale(1.1);
  }

  .range-display {
    font-size: 0.75rem;
    color: #666;
    text-align: right;
  }

  .sequence-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #0a0a0a;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    padding: 0.75rem;
    margin-top: 0.5rem;
  }

  .sequence-label {
    color: #888;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .sequence {
    flex: 1;
    color: #4a9eff;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    letter-spacing: 1px;
    word-break: break-all;
    line-height: 1.4;
  }
</style>
