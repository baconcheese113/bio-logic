<script lang="ts">
  import { filteredOrganisms, matchCount, evidence } from '../stores/evidence';
  import { currentCase, nextCase, returnToLastInstrument } from '../stores/game-state';
  import { ORGANISMS } from '../../data/organisms';
  import type { Organism } from '../../data/organisms';

  let selectedOrganism = $state<Organism | null>(null);
  let feedback = $state<string>('');
  let isCorrect = $state<boolean | null>(null);
  let hoveredCharacteristic = $state<keyof typeof characteristicInfo | null>(null);

  const characteristicInfo = {
    gramStain: {
      name: 'Gram Stain',
      description: 'Reveals cell wall structure. Gram-positive bacteria (thick peptidoglycan layer) appear purple/violet. Gram-negative bacteria (thin peptidoglycan layer) appear pink/red.'
    },
    shape: {
      name: 'Cell Shape',
      description: 'Basic bacterial morphology. Cocci = spherical, Bacilli = rod-shaped, Diplococci = paired spheres, Coccobacilli = short rods.'
    },
    arrangement: {
      name: 'Cell Arrangement',
      description: 'How bacterial cells group together. Chains = long lines, Clusters = grape-like bunches, Pairs = twos, Palisades = fence-like patterns.'
    },
    acidFast: {
      name: 'Acid-Fast Stain',
      description: 'Detects waxy mycolic acids in cell walls using Ziehl-Neelsen stain. Acid-fast positive organisms retain red/pink dye, negative organisms appear blue.'
    },
    capsule: {
      name: 'Capsule Stain',
      description: 'Reveals polysaccharide coating around cells. Capsules appear as clear halos surrounding stained bacteria against a dark background.'
    },
    sporeFormer: {
      name: 'Spore Stain',
      description: 'Reveals endospores - dormant survival structures. Spores appear as bright green oval structures inside or outside bacterial cells.'
    },
  };

  function backToMicroscope() {
    returnToLastInstrument();
  }

  function formatEvidenceValue(value: string | boolean | null): string {
    if (value === null) return 'Not recorded';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function hasEvidence(): boolean {
    return $evidence.gramStain !== null || 
           $evidence.shape !== null || 
           $evidence.arrangement !== null || 
           $evidence.acidFast !== null || 
           $evidence.capsule !== null || 
           $evidence.spores !== null ||
           $evidence.bloodAgarColor !== null ||
           $evidence.hemolysis !== null ||
           $evidence.macConkeyColor !== null ||
           $evidence.catalase !== null ||
           $evidence.coagulase !== null;
  }

  function selectOrganism(organism: Organism) {
    selectedOrganism = organism;
  }

  function submitDiagnosis() {
    if (!selectedOrganism) return;
    
    const correct = selectedOrganism.id === $currentCase.organismId;
    isCorrect = correct;
    
    if (correct) {
      feedback = `Correct! ${selectedOrganism.scientificName} was the right diagnosis.`;
    } else {
      const correctOrganism = ORGANISMS.find(o => o.id === $currentCase.organismId);
      feedback = `Incorrect. The correct organism was ${correctOrganism?.scientificName || 'unknown'}.`;
    }
  }

  function proceedToNextCase() {
    selectedOrganism = null;
    feedback = '';
    isCorrect = null;
    nextCase();
  }

  function getCharacteristicBadgeClass(value: string | boolean) {
    if (typeof value === 'boolean') {
      return value ? 'badge-positive' : 'badge-negative';
    }
    return 'badge-neutral';
  }
</script>

<div class="diagnosis-view">
  <div class="content">
    <div class="header">
      <div>
        <h2>Make Your Diagnosis</h2>
        <p class="match-count">{$matchCount} organism(s) match your observations</p>
      </div>
      <button class="back-button" onclick={backToMicroscope}>
        ← Back to Instruments
      </button>
    </div>

    {#if feedback}
      <div class="feedback" class:correct={isCorrect} class:incorrect={!isCorrect}>
        <p class="feedback-text">{feedback}</p>
        <button class="next-case-button" onclick={proceedToNextCase}>
          Next Case →
        </button>
      </div>
    {/if}

    <!-- Observations Summary -->
    {#if hasEvidence()}
      <div class="observations-summary">
        <h3>Your Recorded Observations</h3>
        <div class="observation-badges">
          <!-- Microscopy observations -->
          {#if $evidence.gramStain !== null}
            <span class="obs-badge">Gram: {formatEvidenceValue($evidence.gramStain)}</span>
          {/if}
          {#if $evidence.shape !== null}
            <span class="obs-badge">Shape: {formatEvidenceValue($evidence.shape)}</span>
          {/if}
          {#if $evidence.arrangement !== null}
            <span class="obs-badge">Arrangement: {formatEvidenceValue($evidence.arrangement)}</span>
          {/if}
          {#if $evidence.acidFast !== null}
            <span class="obs-badge">Acid-Fast: {formatEvidenceValue($evidence.acidFast)}</span>
          {/if}
          {#if $evidence.capsule !== null}
            <span class="obs-badge">Capsule: {formatEvidenceValue($evidence.capsule)}</span>
          {/if}
          {#if $evidence.spores !== null}
            <span class="obs-badge">Spores: {formatEvidenceValue($evidence.spores)}</span>
          {/if}
          
          <!-- Culture observations -->
          {#if $evidence.bloodAgarColor !== null}
            <span class="obs-badge culture">Blood Agar: {formatEvidenceValue($evidence.bloodAgarColor)}</span>
          {/if}
          {#if $evidence.hemolysis !== null}
            <span class="obs-badge culture">Hemolysis: {formatEvidenceValue($evidence.hemolysis)}</span>
          {/if}
          {#if $evidence.macConkeyColor !== null}
            <span class="obs-badge culture">MacConkey: {formatEvidenceValue($evidence.macConkeyColor)}</span>
          {/if}
          
          <!-- Biochemical observations -->
          {#if $evidence.catalase !== null}
            <span class="obs-badge biochem">Catalase: {formatEvidenceValue($evidence.catalase)}</span>
          {/if}
          {#if $evidence.coagulase !== null}
            <span class="obs-badge biochem">Coagulase: {formatEvidenceValue($evidence.coagulase)}</span>
          {/if}
        </div>
      </div>
    {:else}
      <div class="no-observations">
        <p>You haven't recorded any observations yet.</p>
        <p>Return to your instruments to examine the sample and record your findings.</p>
      </div>
    {/if}

    {#if $filteredOrganisms.length === 0}
      <div class="no-matches">
        <p>No organisms match your observations.</p>
        <p>Return to the microscope and adjust your findings.</p>
      </div>
    {:else if $filteredOrganisms.length === 1}
      <div class="single-match">
        <p class="hint">Only one organism matches your observations!</p>
      </div>
    {/if}

    <!-- Comparison Table -->
    {#if $filteredOrganisms.length > 0}
      <div class="comparison-container">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="characteristic-col">Characteristic</th>
              {#each $filteredOrganisms as organism}
                <th class="organism-col" class:selected={selectedOrganism?.id === organism.id}>
                  <button 
                    class="organism-header"
                    onclick={() => selectOrganism(organism)}
                    disabled={feedback !== ''}
                  >
                    <div class="org-scientific">{organism.scientificName}</div>
                    <div class="org-common">{organism.commonName}</div>
                  </button>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'gramStain'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Gram Stain
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge {getCharacteristicBadgeClass(organism.gramStain)}">
                    {organism.gramStain}
                  </span>
                </td>
              {/each}
            </tr>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'shape'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Shape
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge badge-neutral">{organism.shape}</span>
                </td>
              {/each}
            </tr>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'arrangement'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Arrangement
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge badge-neutral">{organism.arrangement}</span>
                </td>
              {/each}
            </tr>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'acidFast'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Acid-Fast
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge {getCharacteristicBadgeClass(organism.acidFast)}">
                    {organism.acidFast ? 'Yes' : 'No'}
                  </span>
                </td>
              {/each}
            </tr>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'capsule'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Capsule
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge {getCharacteristicBadgeClass(organism.capsule)}">
                    {organism.capsule ? 'Yes' : 'No'}
                  </span>
                </td>
              {/each}
            </tr>
            <tr>
              <td class="characteristic-label">
                <span 
                  class="label-with-info"
                  onmouseenter={() => hoveredCharacteristic = 'sporeFormer'}
                  onmouseleave={() => hoveredCharacteristic = null}
                  role="button"
                  tabindex="0"
                >
                  Spore Former
                </span>
              </td>
              {#each $filteredOrganisms as organism}
                <td class:selected={selectedOrganism?.id === organism.id}>
                  <span class="badge {getCharacteristicBadgeClass(organism.sporeFormer)}">
                    {organism.sporeFormer ? 'Yes' : 'No'}
                  </span>
                </td>
              {/each}
            </tr>
            <tr class="notes-row">
              <td class="characteristic-label">Notes</td>
              {#each $filteredOrganisms as organism}
                <td class="notes-cell" class:selected={selectedOrganism?.id === organism.id}>
                  <div class="notes-text">{organism.notes}</div>
                </td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>

      {#if selectedOrganism && !feedback}
        <div class="submit-section">
          <button class="submit-button" onclick={submitDiagnosis}>
            Submit Diagnosis: {selectedOrganism.scientificName}
          </button>
        </div>
      {/if}
    {/if}

    <!-- Info Panel at Bottom -->
    <div class="info-panel">
      {#if hoveredCharacteristic && characteristicInfo[hoveredCharacteristic]}
        <div class="info-content">
          <h4>{characteristicInfo[hoveredCharacteristic].name}</h4>
          <p>{characteristicInfo[hoveredCharacteristic].description}</p>
        </div>
      {:else}
        <div class="info-placeholder">
          Hover over a characteristic name to learn more about it
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .diagnosis-view {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    padding: 2rem;
    overflow-y: auto;
  }

  .content {
    max-width: 1400px;
    width: 100%;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: #e0e0e0;
  }

  .match-count {
    font-size: 1rem;
    color: #a0a0a0;
    margin: 0;
  }

  .back-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 4px;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .back-button:hover {
    background: #4a4a4a;
  }

  .feedback {
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .feedback.correct {
    background: #2d5a3d;
    border: 2px solid #4a7c59;
  }

  .feedback.incorrect {
    background: #5a2d2d;
    border: 2px solid #7c4a4a;
  }

  .feedback-text {
    font-size: 1.2rem;
    margin: 0;
    color: #e0e0e0;
  }

  .next-case-button {
    background: #4a7c59;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 4px;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .next-case-button:hover {
    background: #5a8c69;
  }

  .observations-summary {
    background: #2a3a4a;
    border: 2px solid #4a5a6a;
    border-radius: 4px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .observations-summary h3 {
    font-size: 1rem;
    color: #e0e0e0;
    margin: 0 0 0.75rem 0;
    font-weight: bold;
  }

  .observation-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .obs-badge {
    background: #3a4a5a;
    color: #c0d0e0;
    padding: 0.4rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    border: 1px solid #4a5a6a;
  }

  .obs-badge.culture {
    background: #4a3a5a;
    color: #d0c0e0;
    border-color: #5a4a6a;
  }

  .obs-badge.biochem {
    background: #3a5a4a;
    color: #c0e0d0;
    border-color: #4a6a5a;
  }

  .no-observations {
    background: #3a3a2a;
    border: 2px solid #5a5a3a;
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .no-observations p {
    margin: 0.5rem 0;
    color: #c0b080;
    font-size: 0.95rem;
  }

  .no-matches {
    text-align: center;
    padding: 3rem;
    color: #a0a0a0;
  }

  .no-matches p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  .single-match {
    background: #3a4a3a;
    border: 2px solid #5a7c5a;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .hint {
    margin: 0;
    text-align: center;
    color: #8fc98f;
    font-size: 1rem;
  }

  .comparison-container {
    overflow-x: auto;
    margin-bottom: 1.5rem;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    background: #1a1a1a;
  }

  .comparison-table th,
  .comparison-table td {
    border: 1px solid #3a3a3a;
    padding: 0.75rem;
    text-align: left;
  }

  .characteristic-col {
    width: 140px;
    background: #2a2a2a;
    position: sticky;
    left: 0;
    z-index: 2;
  }

  .characteristic-label {
    background: #2a2a2a;
    color: #b0b0b0;
    font-weight: bold;
    position: sticky;
    left: 0;
    font-size: 0.9rem;
  }

  .label-with-info {
    cursor: help;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .label-with-info:hover {
    background: #3a4a5a;
    color: #ffd700;
  }

  .organism-col {
    background: #2a2a2a;
    min-width: 200px;
    padding: 0;
  }

  .organism-col.selected {
    background: #3a4a5a;
  }

  .organism-header {
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
  }

  .organism-header:not(:disabled):hover {
    background: #3a4a3a;
  }

  .organism-header:disabled {
    cursor: not-allowed;
  }

  .organism-col.selected .organism-header {
    background: #3a4a5a;
  }

  .org-scientific {
    font-size: 0.95rem;
    font-weight: bold;
    font-style: italic;
    color: #e0e0e0;
    margin-bottom: 0.25rem;
  }

  .org-common {
    font-size: 0.85rem;
    color: #a0a0a0;
  }

  .comparison-table td {
    background: #1a1a1a;
    vertical-align: middle;
  }

  .comparison-table td.selected {
    background: #2a3a4a;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .badge-positive {
    background: #2d4a3d;
    color: #8fc98f;
  }

  .badge-negative {
    background: #4a2d3d;
    color: #c98f8f;
  }

  .badge-neutral {
    background: #3a3a4a;
    color: #c0c0d0;
  }

  .notes-row td {
    vertical-align: top;
  }

  .notes-cell {
    max-width: 250px;
  }

  .notes-text {
    font-size: 0.85rem;
    line-height: 1.4;
    color: #b0b0b0;
  }

  .submit-section {
    text-align: center;
  }

  .submit-button {
    background: #4a7c59;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-style: italic;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .submit-button:hover {
    background: #5a8c69;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
  }

  .info-panel {
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1.5rem;
    min-height: 80px;
    display: flex;
    align-items: center;
  }

  .info-content h4 {
    font-size: 1rem;
    color: #ffd700;
    margin: 0 0 0.5rem 0;
    font-weight: bold;
  }

  .info-content p {
    font-size: 0.9rem;
    color: #c0c0c0;
    margin: 0;
    line-height: 1.5;
  }

  .info-placeholder {
    width: 100%;
    text-align: center;
    color: #666;
    font-style: italic;
    font-size: 0.9rem;
  }
</style>
