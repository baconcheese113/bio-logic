<script lang="ts">
  import { instrumentState } from '../../../stores/instrument-state';
  import type { ElisaWellContents } from '../../../../data/organisms';

  // Calculate well color based on state with gradual transition
  function getWellColor(well: ElisaWellContents): string {
    // Substrate added creates color based on well type with animation
    if (well.substrateAdded) {
      // Positive controls should be yellow/gold
      if (well.wellType === 'positive-control') {
        return '#ffd700';
      }
      // Negative controls should be very light yellow
      if (well.wellType === 'negative-control') {
        return '#ffffcc';
      }
      // Sample wells - simulate variable results
      if (well.wellType === 'sample') {
        return '#ffeb99';
      }
      // Blank stays clear
      return '#f5f5f5';
    }
    
    // Show progressive states
    if (well.enzymeAdded) return '#e8e8e8';
    if (well.sampleAdded) return '#ddd';
    if (well.blocked) return '#d0d0d0';
    if (well.coated) return '#c8c8c8';
    
    // Empty well
    return '#f5f5f5';
  }

  function getWellLabel(well: ElisaWellContents): string {
    if (well.wellType === 'positive-control') return '+';
    if (well.wellType === 'negative-control') return '-';
    if (well.wellType === 'blank') return 'B';
    return 'S';
  }

  // Check if well should animate (just transitioned to substrate)
  function shouldAnimate(well: ElisaWellContents): boolean {
    return well.substrateAdded;
  }
</script>

<div class="elisa-plate-container">
  <div class="plate-header">
    <h3>96-Well Microtiter Plate</h3>
    <p class="plate-description">Polystyrene plate for solid-phase immunoassay</p>
  </div>

  <div class="plate">
    <div class="row-labels">
      {#each ['A', 'B'] as label}
        <div class="row-label">{label}</div>
      {/each}
    </div>
    
    <div class="wells-grid">
      {#each $instrumentState.elisa.wells as well, index}
        <div class="well-container">
          <div 
            class="well" 
            class:color-developing={shouldAnimate(well)}
            style="background-color: {getWellColor(well)}"
            title="{well.wellType}"
          >
            <div class="well-label">{getWellLabel(well)}</div>
          </div>
          <div class="well-number">{index + 1}</div>
        </div>
      {/each}
    </div>
  </div>

  <div class="legend">
    <h4>Well Types</h4>
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-well positive">+</div>
        <span>Positive Control</span>
      </div>
      <div class="legend-item">
        <div class="legend-well negative">-</div>
        <span>Negative Control</span>
      </div>
      <div class="legend-item">
        <div class="legend-well sample">S</div>
        <span>Patient Sample</span>
      </div>
    </div>
  </div>
</div>

<style>
  .elisa-plate-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  }

  .plate-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .plate-header h3 {
    color: #e0e0e0;
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .plate-description {
    color: #999;
    margin: 0;
    font-size: 0.9rem;
    font-style: italic;
  }

  .plate {
    background: #3a3a3a;
    border: 3px solid #5a5a5a;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    display: flex;
    gap: 1rem;
  }

  .row-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 0.5rem;
  }

  .row-label {
    color: #ccc;
    font-weight: bold;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    height: 60px;
  }

  .wells-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .well-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .well {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    border: 2px solid #666;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: background-color 2s ease-in-out, transform 0.3s ease;
  }

  .well.color-developing {
    animation: colorDevelop 2s ease-in-out;
  }

  @keyframes colorDevelop {
    0% {
      transform: scale(1);
      filter: brightness(0.8);
    }
    50% {
      transform: scale(1.05);
      filter: brightness(1.2);
    }
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
  }

  .well:hover {
    transform: scale(1.1);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.3);
  }

  .well-label {
    color: #333;
    font-weight: bold;
    font-size: 0.8rem;
  }

  .well-number {
    color: #888;
    font-size: 0.7rem;
  }

  .legend {
    margin-top: 2rem;
    text-align: center;
  }

  .legend h4 {
    color: #ccc;
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .legend-items {
    display: flex;
    gap: 2rem;
    justify-content: center;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #aaa;
    font-size: 0.85rem;
  }

  .legend-well {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid #666;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.75rem;
    color: #333;
  }

  .legend-well.positive {
    background-color: #ffd700;
  }

  .legend-well.negative {
    background-color: #ffffcc;
  }

  .legend-well.sample {
    background-color: #ffeb99;
  }
</style>
