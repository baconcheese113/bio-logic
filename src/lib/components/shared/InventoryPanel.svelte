<script lang="ts">
  import { currentActiveCase, activeCases } from '../../stores/active-cases';
  import { inventoryByCase } from '../../stores/inventory';
  import { currentCase } from '../../stores/game-state';
  import { CASES } from '../../../data/organisms';
  import type { InventoryItem } from '../../stores/inventory';
  
  let manuallyExpandedCases = $state<Set<string>>(new Set());
  let selectedItem = $state<InventoryItem | null>(null);
  
  // Derive which cases should be expanded (manual + auto-expanded active case)
  let expandedCases = $derived(() => {
    const expanded = new Set(manuallyExpandedCases);
    if ($currentActiveCase) {
      expanded.add($currentActiveCase.caseId);
    }
    return expanded;
  });
  
  function toggleCaseExpansion(caseId: string) {
    if (manuallyExpandedCases.has(caseId)) {
      manuallyExpandedCases.delete(caseId);
    } else {
      manuallyExpandedCases.add(caseId);
    }
    // Trigger reactivity
    manuallyExpandedCases = new Set(manuallyExpandedCases);
  }
  
  function selectItem(item: InventoryItem) {
    selectedItem = selectedItem?.id === item.id ? null : item;
  }
  
  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatStatus(item: InventoryItem): string {
    if (item.activeProcesses && item.activeProcesses.length > 0) {
      // Show first process if multiple
      const process = item.activeProcesses[0];
      return `${process.processName} (${process.progress}%)`;
    }
    return 'Available';
  }
  
  function getStatusClass(item: InventoryItem): string {
    if (item.activeProcesses && item.activeProcesses.length > 0) {
      return 'status-processing';
    }
    return 'status-available';
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
          {@const isExpanded = expandedCases().has(caseId)}
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
                  <div class="items-list-vertical">
                    {#each caseInventory.samples as sample}
                      <div 
                        class="inventory-card sample" 
                        class:selected={selectedItem?.id === sample.id}
                        onclick={() => selectItem(sample)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="card-header">
                          <div class="item-icon">🧪</div>
                          <div class="item-name">{sample.displayName}</div>
                        </div>
                        <div class="card-info">
                          <div class="item-time">Collected: {formatTimestamp(sample.timestamp)}</div>
                          <div class="item-status {getStatusClass(sample)}">
                            {formatStatus(sample)}
                          </div>
                          <!-- Show progress bars for active processes -->
                          {#if sample.activeProcesses && sample.activeProcesses.length > 0}
                            <div class="active-processes">
                              {#each sample.activeProcesses as process}
                                <div class="process-status">
                                  <span class="process-name">{process.instrument}: {process.processName}</span>
                                  <div class="progress-bar">
                                    <div class="progress-fill" style="width: {process.progress}%"></div>
                                  </div>
                                  {#if process.timeRemaining}
                                    <span class="time-remaining">{process.timeRemaining}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          {/if}
                        </div>
                        {#if selectedItem?.id === sample.id && sample.data}
                          <div class="card-details">
                            {#each Object.entries(sample.data) as [key, value]}
                              <div class="detail-line">
                                <span class="detail-label">{key}:</span>
                                <span class="detail-value">{value}</span>
                              </div>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="no-items">
                    <em>No samples collected</em>
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
  

  
  .items-list-vertical {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .inventory-card {
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    transition: all 0.2s;
    cursor: pointer;
    padding: 0.6rem;
  }
  
  .inventory-card:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }
  
  .inventory-card.selected {
    background: #3a3a4a;
    border-color: #5a5a6a;
  }
  
  .inventory-card.sample {
    border-left: 3px solid #4a7c59;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
  }
  
  .item-icon {
    font-size: 1.4rem;
  }
  
  .item-name {
    color: #e0e0e0;
    font-size: 0.85rem;
    font-weight: 600;
    flex: 1;
  }
  
  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-left: 2rem;
  }
  
  .item-time {
    color: #999;
    font-size: 0.7rem;
  }
  
  .item-status {
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .status-available {
    color: #4a7c59;
  }
  
  .status-processing {
    color: #d4af37;
  }
  
  .active-processes {
    margin-top: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .process-status {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 3px;
    padding: 0.3rem 0.4rem;
    font-size: 0.65rem;
  }
  
  .process-name {
    color: #d4af37;
    font-weight: 600;
    display: block;
    margin-bottom: 0.2rem;
  }
  
  .progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin: 0.2rem 0;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a7c59, #6a9c79);
    transition: width 0.3s ease;
  }
  
  .time-remaining {
    color: #999;
    font-size: 0.6rem;
    display: block;
    margin-top: 0.2rem;
  }
  
  .no-items {
    text-align: center;
    padding: 1.5rem 0.8rem;
    color: #666;
    font-size: 0.75rem;
  }
  
  .card-details {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    padding-left: 2rem;
    border-top: 1px solid #3a3a3a;
    font-size: 0.7rem;
  }
  
  .detail-line {
    display: flex;
    gap: 0.5rem;
    margin: 0.25rem 0;
  }
  
  .detail-label {
    color: #999;
    font-weight: 600;
    text-transform: capitalize;
    min-width: 70px;
  }
  
  .detail-value {
    color: #ccc;
    flex: 1;
  }
</style>
