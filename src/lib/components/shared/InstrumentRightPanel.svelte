<script lang="ts">
  import InventoryPanel from './InventoryPanel.svelte';
  import NavigationButtons from './NavigationButtons.svelte';
  import DiagnosisView from '../DiagnosisView.svelte';
  import type { Snippet } from 'svelte';
  
  type TabConfig = 'controls-inventory' | 'controls-diagnosis' | 'controls-inventory-diagnosis';
  
  type Props = {
    children: Snippet;
    primaryAction?: () => void;
    primaryLabel?: string;
    showDiagnosis?: boolean;
    tabConfig?: TabConfig;
    diagnosisCount?: number;
  };
  
  let { children, primaryAction, primaryLabel, showDiagnosis, tabConfig = 'controls-inventory', diagnosisCount = 0 }: Props = $props();
  
  type ActiveTab = 'controls' | 'inventory' | 'diagnosis';
  let activeTab = $state<ActiveTab>('controls');
</script>

<div class="controls-panel">
  <div class="tab-nav">
    <button 
      class="tab-button" 
      class:active={activeTab === 'controls'}
      onclick={() => activeTab = 'controls'}
    >
      Controls
    </button>
    {#if tabConfig === 'controls-inventory' || tabConfig === 'controls-inventory-diagnosis'}
      <button 
        class="tab-button" 
        class:active={activeTab === 'inventory'}
        onclick={() => activeTab = 'inventory'}
      >
        Inventory
      </button>
    {/if}
    {#if tabConfig === 'controls-diagnosis' || tabConfig === 'controls-inventory-diagnosis'}
      <button 
        class="tab-button" 
        class:active={activeTab === 'diagnosis'}
        onclick={() => activeTab = 'diagnosis'}
      >
        Diagnosis ({diagnosisCount})
      </button>
    {/if}
  </div>

  {#if activeTab === 'controls'}
    <div class="controls-content">
      {@render children()}
    </div>
    
    <!-- Navigation Section - Fixed at bottom -->
    <div class="navigation-section">
      <NavigationButtons 
        {primaryAction}
        {primaryLabel}
        {showDiagnosis}
      />
    </div>
  {:else if activeTab === 'inventory'}
    <InventoryPanel />
  {:else}
    <DiagnosisView />
  {/if}
</div>

<style>
  .controls-panel {
    width: 360px;
    background: #2a2a2a;
    border-left: 2px solid #4a4a4a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tab-nav {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #222;
    border-bottom: 1px solid #444;
    flex-shrink: 0;
  }

  .tab-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background: #3a3a3a;
    color: #a0a0a0;
    border: 2px solid #4a4a4a;
    border-radius: 4px 4px 0 0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    background: #4a4a4a;
    color: #c0c0c0;
  }

  .tab-button.active {
    background: #5a7a6a;
    color: #e0f0e0;
    border-color: #7a9a8a;
    font-weight: bold;
  }

  .controls-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    min-height: 0;
  }

  .navigation-section {
    flex-shrink: 0;
    padding: 0.5rem;
    background: #2a2a2a;
    border-top: 1px solid #444;
  }
</style>
