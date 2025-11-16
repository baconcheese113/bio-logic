<script lang="ts">
  import { inventory, getSampleById, setActiveSample } from '../stores/inventory';
  
  let isOpen = false;
  
  function toggleInventory() {
    isOpen = !isOpen;
  }
  
  function selectSample(sampleId: string) {
    setActiveSample(sampleId);
  }
  
  function getSampleTypeLabel(sampleType: string): string {
    const labels: Record<string, string> = {
      'blood': 'Blood Culture',
      'sputum': 'Sputum Sample',
      'throat-swab': 'Throat Swab',
      'stool': 'Stool Sample',
      'wound': 'Wound Swab',
      'csf': 'Cerebrospinal Fluid',
      'urine': 'Urine Sample',
      'tissue': 'Tissue Biopsy',
    };
    return labels[sampleType] || sampleType;
  }
  
  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
</script>

<div class="inventory-container">
  <button class="inventory-toggle" onclick={toggleInventory} title="View Inventory">
    <span class="icon">📋</span>
    {#if $inventory.samples.length > 0}
      <span class="count">{$inventory.samples.length}</span>
    {/if}
  </button>
  
  {#if isOpen}
    <div class="inventory-panel">
      <div class="panel-header">
        <h3>Sample Inventory</h3>
        <button class="close-button" onclick={toggleInventory}>✕</button>
      </div>
      
      <div class="panel-content">
        {#if $inventory.samples.length === 0}
          <p class="empty-message">No samples collected yet</p>
        {:else}
          <div class="sample-list">
            {#each $inventory.samples as sample}
              {@const isActive = $inventory.activeSampleId === sample.id}
              <button 
                class="sample-item" 
                class:active={isActive}
                onclick={() => selectSample(sample.id)}
              >
                <div class="sample-header">
                  <span class="sample-type">{getSampleTypeLabel(sample.sampleType)}</span>
                  {#if isActive}
                    <span class="active-badge">Active</span>
                  {/if}
                </div>
                <div class="sample-details">
                  <div class="case-info">
                    <strong>Case:</strong> {sample.caseTitle}
                  </div>
                  <div class="time-info">
                    <strong>Collected:</strong> {formatTimestamp(sample.collectedAt)}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .inventory-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
  }
  
  .inventory-toggle {
    position: relative;
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .inventory-toggle:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .icon {
    font-size: 1.2rem;
  }
  
  .count {
    background: #4a7c59;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: bold;
    min-width: 1.5rem;
    text-align: center;
  }
  
  .inventory-panel {
    position: absolute;
    top: 4rem;
    right: 0;
    background: #2a2a2a;
    border: 2px solid #4a4a4a;
    border-radius: 8px;
    min-width: 400px;
    max-width: 500px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #4a4a4a;
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 1.3rem;
    color: #e0e0e0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .close-button:hover {
    background: #3a3a3a;
    color: #e0e0e0;
  }
  
  .panel-content {
    padding: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }
  
  .empty-message {
    text-align: center;
    color: #888;
    padding: 2rem;
    font-style: italic;
  }
  
  .sample-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .sample-item {
    background: #3a3a3a;
    border: 2px solid #5a5a5a;
    border-radius: 6px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }
  
  .sample-item:hover {
    background: #4a4a4a;
    border-color: #7a7a7a;
  }
  
  .sample-item.active {
    border-color: #4a7c59;
    background: #3a4a3a;
  }
  
  .sample-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .sample-type {
    font-size: 1.1rem;
    font-weight: bold;
    color: #e0e0e0;
  }
  
  .active-badge {
    background: #4a7c59;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
  }
  
  .sample-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .case-info,
  .time-info {
    font-size: 0.9rem;
    color: #a0a0a0;
  }
  
  .case-info strong,
  .time-info strong {
    color: #c0c0c0;
  }
</style>
