<script lang="ts">
  import { currentActiveCase, activeCases } from '../../stores/active-cases';
  import { inventoryByCase } from '../../stores/inventory';
  import { currentCase } from '../../stores/game-state';
  import { CASES } from '../../../data/organisms';
  import type { InventoryItem } from '../../stores/inventory';
  import { untrack } from 'svelte';
  
  let expandedCases = $state<Set<string>>(new Set());
  let selectedItem = $state<InventoryItem | null>(null);
  
  // Auto-expand current active case
  $effect(() => {
    if ($currentActiveCase) {
      untrack(() => {
        if (!expandedCases.has($currentActiveCase.caseId)) {
          expandedCases.add($currentActiveCase.caseId);
          expandedCases = new Set(expandedCases);
        }
      });
    }
  });
  
  function toggleCaseExpansion(caseId: string) {
    if (expandedCases.has(caseId)) {
      expandedCases.delete(caseId);
    } else {
      expandedCases.add(caseId);
    }
    // Trigger reactivity
    expandedCases = new Set(expandedCases);
  }
  
  function selectItem(item: InventoryItem) {
    selectedItem = selectedItem?.id === item.id ? null : item;
  }
  
  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function isCaseActive(caseId: string): boolean {
    return $currentActiveCase?.caseId === caseId;
  }
  
  // Get case title from case index
  function getCaseTitle(caseId: string): string {
    const activeCase = $activeCases.activeCases.find(c => c.caseId === caseId);
    if (!activeCase) return 'Unknown Case';
    
    const caseData = CASES[activeCase.caseIndex];
    return caseData?.title || `Case #${activeCase.caseIndex + 1}`;
  }
</script>

<div class="inventory-panel">
  <div class="panel-header">
    <h3>Inventory & Observations</h3>
  </div>
  
  <div class="inventory-content">
    {#if $inventoryByCase.size === 0}
      <div class="empty-state">
        <p>No samples collected yet</p>
        <p class="hint">Collect samples from the Sample Selection screen</p>
      </div>
    {:else}
      <div class="case-sections">
        {#each Array.from($inventoryByCase.entries()) as [caseId, caseInventory]}
          {@const isExpanded = expandedCases.has(caseId)}
          {@const isActive = isCaseActive(caseId)}
          
          <div class="case-section" class:active={isActive}>
            <button 
              class="case-header"
              onclick={() => toggleCaseExpansion(caseId)}
            >
              <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              <span class="case-badge">{getCaseTitle(caseId)}</span>
              <span class="item-count">
                {caseInventory.samples.length + caseInventory.results.length} items
              </span>
              {#if isActive}
                <span class="active-badge">Active</span>
              {/if}
            </button>
            
            {#if isExpanded}
              <div class="case-items">
                {#if caseInventory.samples.length > 0}
                  <div class="item-category">
                    <h4>Samples</h4>
                    <div class="items-list">
                      {#each caseInventory.samples as sample}
                        <div 
                          class="inventory-item sample" 
                          class:selected={selectedItem?.id === sample.id}
                          onclick={() => selectItem(sample)}
                          role="button"
                          tabindex="0"
                        >
                          <div class="item-icon">🧪</div>
                          <div class="item-details">
                            <div class="item-name">{sample.displayName}</div>
                            <div class="item-time">{formatTimestamp(sample.timestamp)}</div>
                            {#if selectedItem?.id === sample.id && sample.data}
                              <div class="item-extra-details">
                                {#each Object.entries(sample.data) as [key, value]}
                                  <div class="detail-row">
                                    <span class="detail-label">{key}:</span>
                                    <span class="detail-value">{value}</span>
                                  </div>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
                
                {#if caseInventory.results.length > 0}
                  <div class="item-category">
                    <h4>Test Results</h4>
                    <div class="items-list">
                      {#each caseInventory.results as result}
                        <div 
                          class="inventory-item result"
                          class:selected={selectedItem?.id === result.id}
                          onclick={() => selectItem(result)}
                          role="button"
                          tabindex="0"
                        >
                          <div class="item-icon">📋</div>
                          <div class="item-details">
                            <div class="item-name">{result.displayName}</div>
                            <div class="item-time">{formatTimestamp(result.timestamp)}</div>
                            {#if selectedItem?.id === result.id && result.data}
                              <div class="item-extra-details">
                                {#each Object.entries(result.data) as [key, value]}
                                  <div class="detail-row">
                                    <span class="detail-label">{key}:</span>
                                    <span class="detail-value">{value}</span>
                                  </div>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
                
                {#if caseInventory.samples.length === 0 && caseInventory.results.length === 0}
                  <div class="no-items">
                    <em>No items in inventory</em>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .inventory-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    font-size: 0.85rem;
  }
  
  .panel-header {
    padding: 0.6rem 0.8rem;
    border-bottom: 2px solid #3a3a3a;
    background: #2a2a2a;
  }
  
  .panel-header h3 {
    margin: 0;
    color: #e0e0e0;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  .inventory-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.4rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem 0.8rem;
    color: #888;
  }
  
  .empty-state p {
    margin: 0.4rem 0;
    font-size: 0.85rem;
  }
  
  .empty-state .hint {
    font-size: 0.75rem;
    font-style: italic;
    color: #666;
  }
  
  .case-sections {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  
  .case-section {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .case-section.active {
    border-color: #4a6a8a;
    box-shadow: 0 0 6px rgba(74, 106, 138, 0.3);
  }
  
  .case-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: #e0e0e0;
    transition: background 0.2s;
    font-size: 0.85rem;
  }
  
  .case-header:hover {
    background: #3a3a3a;
  }
  
  .expand-icon {
    color: #888;
    font-size: 0.7rem;
    width: 0.8rem;
  }
  
  .case-badge {
    font-weight: 600;
    font-size: 0.85rem;
  }
  
  .item-count {
    margin-left: auto;
    font-size: 0.75rem;
    color: #999;
  }
  
  .active-badge {
    background: #4a6a8a;
    color: white;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }
  
  .case-items {
    padding: 0.6rem;
    border-top: 1px solid #3a3a3a;
    background: #1a1a1a;
  }
  
  .item-category {
    margin-bottom: 0.6rem;
  }
  
  .item-category:last-child {
    margin-bottom: 0;
  }
  
  .item-category h4 {
    margin: 0 0 0.4rem 0;
    color: #999;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .inventory-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 3px;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .inventory-item:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
    transform: translateX(3px);
  }
  
  .inventory-item.selected {
    background: #3a3a4a;
    border-color: #5a5a6a;
  }
  
  .inventory-item.sample {
    border-left: 2px solid #4a7c59;
  }
  
  .inventory-item.result {
    border-left: 2px solid #6a9fb5;
  }
  
  .item-icon {
    font-size: 1.2rem;
  }
  
  .item-details {
    flex: 1;
    min-width: 0;
  }
  
  .item-name {
    color: #e0e0e0;
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 0.15rem;
  }
  
  .item-time {
    color: #888;
    font-size: 0.7rem;
  }
  
  .no-items {
    text-align: center;
    padding: 0.8rem;
    color: #666;
    font-size: 0.75rem;
  }
  
  .item-extra-details {
    margin-top: 0.4rem;
    padding-top: 0.4rem;
    border-top: 1px solid #3a3a3a;
    font-size: 0.7rem;
  }
  
  .detail-row {
    display: flex;
    gap: 0.4rem;
    margin: 0.2rem 0;
  }
  
  .detail-label {
    color: #999;
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .detail-value {
    color: #ccc;
  }
</style>
