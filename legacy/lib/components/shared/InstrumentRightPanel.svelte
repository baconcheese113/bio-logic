<script lang="ts">
  import InventoryPanel from './InventoryPanel.svelte';
  import NavigationButtons from './NavigationButtons.svelte';
  import DiagnosisView from '../DiagnosisView.svelte';
  import SampleBadge from './SampleBadge.svelte';
  import { instrumentState, type InstrumentType } from '../../stores/instrument-state';
  import type { InventoryItem } from '../../stores/inventory';
  import type { Snippet } from 'svelte';
  
  type TabConfig = 'controls-inventory' | 'controls-diagnosis' | 'controls-inventory-diagnosis';
  
  type Props = {
    children: Snippet;
    primaryAction?: () => void;
    primaryLabel?: string;
    showDiagnosis?: boolean;
    tabConfig?: TabConfig;
    diagnosisCount?: number;
    instrument?: InstrumentType;
    onSampleLoaded?: (sample: InventoryItem) => void;
    onSampleSelected?: (sample: InventoryItem | null) => void;
  };
  
  let { 
    children, 
    primaryAction, 
    primaryLabel, 
    showDiagnosis, 
    tabConfig = 'controls-inventory', 
    diagnosisCount = 0,
    instrument,
    onSampleLoaded,
    onSampleSelected
  }: Props = $props();
  
  type ActiveTab = 'controls' | 'inventory' | 'diagnosis';
  let activeTab = $state<ActiveTab>('controls');
  let pendingSample = $state<InventoryItem | null>(null);
  
  // Export function to switch to inventory tab
  export function openInventoryForSample(_instrumentType?: InstrumentType) {
    activeTab = 'inventory';
  }
  
  // Export function to get pending sample (for instruments to check)
  export function getPendingSample(): InventoryItem | null {
    return pendingSample;
  }
  
  // Export function to clear pending sample after loading
  export function clearPendingSample() {
    pendingSample = null;
  }
  
  function handleSampleSelected(sample: InventoryItem | null) {
    pendingSample = sample;
    onSampleSelected?.(sample);
  }
  
  function handleSampleLoaded(sample: InventoryItem) {
    // Switch back to controls after loading
    activeTab = 'controls';
    pendingSample = null;
    onSampleLoaded?.(sample);
  }
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
      {#if instrument}
        <div class="sample-management-section">
          <SampleBadge {instrument} />
          {#if !$instrumentState.activeSamples[instrument]}
            <button 
              class="select-sample-btn" 
              onclick={() => openInventoryForSample(instrument)}
            >
              Select Sample
            </button>
          {/if}
        </div>
      {/if}
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
    <InventoryPanel 
      highlightInstrument={instrument}
      onSampleLoaded={handleSampleLoaded}
      onSampleSelected={handleSampleSelected}
    />
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

  .sample-management-section {
    margin-bottom: 1rem;
    background: #222;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.75rem;
  }

  .select-sample-btn {
    width: 100%;
    padding: 0.6rem;
    margin-top: 0.75rem;
    background: #3a7bc8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }

  .select-sample-btn:hover {
    background: #4a8bd8;
  }
</style>
