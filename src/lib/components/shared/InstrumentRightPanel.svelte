<script lang="ts">
  import type { Snippet } from 'svelte';
  import InventoryPanel from './InventoryPanel.svelte';
  import { filteredOrganisms } from '../../stores/evidence';
  
  interface Props {
    controls: Snippet;
    showInventoryTab?: boolean;
    showDiagnosisTab?: boolean;
  }
  
  let { controls, showInventoryTab = true, showDiagnosisTab = true }: Props = $props();
  
  let activeTab = $state<'controls' | 'inventory' | 'diagnosis'>('controls');
</script>

<div class="instrument-right-panel">
  <!-- Tabs -->
  <div class="panel-tabs">
    <button 
      class="tab" 
      class:active={activeTab === 'controls'}
      onclick={() => activeTab = 'controls'}
    >
      Controls
    </button>
    {#if showInventoryTab}
      <button 
        class="tab" 
        class:active={activeTab === 'inventory'}
        onclick={() => activeTab = 'inventory'}
      >
        Inventory
      </button>
    {/if}
    {#if showDiagnosisTab}
      <button 
        class="tab" 
        class:active={activeTab === 'diagnosis'}
        onclick={() => activeTab = 'diagnosis'}
      >
        Diagnosis ({$filteredOrganisms.length})
      </button>
    {/if}
  </div>
  
  <!-- Content -->
  <div class="panel-content">
    {#if activeTab === 'controls'}
      {@render controls()}
    {:else if activeTab === 'inventory'}
      <InventoryPanel />
    {:else if activeTab === 'diagnosis'}
      <div class="diagnosis-content">
        <p class="match-info">{$filteredOrganisms.length} matching organism(s)</p>
        <div class="organism-list">
          {#each $filteredOrganisms as organism (organism.id)}
            <div class="organism-item">
              <h4>{organism.name}</h4>
              <p class="organism-type">{organism.type}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .instrument-right-panel {
    width: 400px;
    background: #252535;
    border-left: 2px solid #3a3a4a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .panel-tabs {
    display: flex;
    gap: 0;
    background: #2a2a3a;
    border-bottom: 2px solid #3a3a4a;
    padding: 0.3rem 0.5rem;
  }
  
  .tab {
    flex: 1;
    padding: 0.4rem 0.5rem;
    background: transparent;
    color: #888;
    border: none;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .tab:hover {
    background: #3a3a4a;
    color: #aaa;
  }
  
  .tab.active {
    background: #4a4a5a;
    color: #ffd700;
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }
  
  /* Diagnosis specific styles */
  .diagnosis-content {
    height: 100%;
  }
  
  .match-info {
    color: #888;
    font-size: 0.8rem;
    margin: 0 0 0.75rem 0;
    padding: 0.4rem 0.6rem;
    background: #2a2a3a;
    border-radius: 4px;
    text-align: center;
  }
  
  .organism-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .organism-item {
    background: #2a2a3a;
    padding: 0.6rem;
    border-radius: 4px;
    border-left: 3px solid #4a7c59;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .organism-item:hover {
    background: #3a3a4a;
    border-left-color: #5a8c69;
  }
  
  .organism-item h4 {
    margin: 0 0 0.2rem 0;
    color: #e0e0e0;
    font-size: 0.85rem;
  }
  
  .organism-type {
    margin: 0;
    color: #888;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
