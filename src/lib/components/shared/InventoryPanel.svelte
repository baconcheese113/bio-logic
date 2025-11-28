<script lang="ts">
  import { currentActiveCase, activeCases } from "../../stores/active-cases";
  import { inventoryByCase } from "../../stores/inventory";
  import {
    loadSampleIntoInstrument,
    instrumentState,
    type InstrumentType,
  } from "../../stores/instrument-state";
  import {
    isSampleCompatible,
    getCompatibleSampleTypes,
    type InstrumentType as CompatInstrumentType,
  } from "../../stores/sample-compatibility";
  import { busyInstruments } from "../../stores/timer-service";
  import { CASES } from "../../../data/organisms";
  import type { InventoryItem } from "../../stores/inventory";

  interface Props {
    highlightInstrument?: InstrumentType | null;
    onSampleLoaded?: (sample: InventoryItem) => void;
    onSampleSelected?: (sample: InventoryItem | null) => void;
  }

  let {
    highlightInstrument = null,
    onSampleLoaded,
    onSampleSelected,
  }: Props = $props();

  let manuallyExpandedCases = $state<Set<string>>(new Set());
  let selectedItem = $state<InventoryItem | null>(null);
  let pendingSample = $state<InventoryItem | null>(null);

  // Helper to get which instruments are using a sample
  function getInstrumentsUsingSample(sampleId: string): InstrumentType[] {
    return Object.entries($instrumentState.activeSamples)
      .filter(([_, id]) => id === sampleId)
      .map(([instrument, _]) => instrument as InstrumentType);
  }

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

  function selectSampleForLoading(sample: InventoryItem) {
    // Auto-load compatible samples immediately when clicked in inventory
    if (highlightInstrument && isCompatibleSample(sample)) {
      loadSample(sample);
    } else {
      // For non-compatible or when no highlight, just toggle pending
      if (pendingSample?.id === sample.id) {
        pendingSample = null;
        onSampleSelected?.(null);
      } else {
        pendingSample = sample;
        onSampleSelected?.(sample);
      }
    }
  }

  function loadSample(sample: InventoryItem) {
    if (highlightInstrument && sample.type === "sample") {
      loadSampleIntoInstrument(highlightInstrument, sample.id);
      pendingSample = null; // Clear pending after loading
      onSampleLoaded?.(sample);
    }
  }

  function isCompatibleSample(item: InventoryItem): boolean {
    if (!highlightInstrument || item.type !== "sample") return false;
    return isSampleCompatible(
      item.itemType,
      highlightInstrument as CompatInstrumentType,
    );
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Check if instrument is busy (has active process)
  function isInstrumentBusy(inst: InstrumentType): boolean {
    return $busyInstruments.has(inst);
  }

  function isCaseActive(caseId: string): boolean {
    return $currentActiveCase?.caseId === caseId;
  }

  // Get case title from case index
  function getCaseTitle(caseId: string): string {
    const activeCase = $activeCases.activeCases.find(
      (c) => c.caseId === caseId,
    );
    if (!activeCase) return "Unknown Case";

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
              <span class="expand-icon">{isExpanded ? "▼" : "▶"}</span>
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
                  {#if highlightInstrument}
                    <div class="highlight-banner">
                      <span class="banner-icon">🔬</span>
                      <div class="banner-content">
                        <div class="banner-title">
                          Select Sample for {highlightInstrument.replace(
                            "-",
                            " ",
                          )}
                        </div>
                        <div class="banner-hint">
                          Compatible: {getCompatibleSampleTypes(
                            highlightInstrument as CompatInstrumentType,
                          )
                            .map((t) => t.replace("-", " "))
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  {/if}
                  <div class="items-list-vertical">
                    {#each caseInventory.samples as sample}
                      {@const compatible = isCompatibleSample(sample)}
                      {@const isPending = pendingSample?.id === sample.id}
                      {@const canSelect = !highlightInstrument || compatible}
                      {@const instrumentsUsing = getInstrumentsUsingSample(
                        sample.id,
                      )}
                      <div
                        class="inventory-card sample"
                        class:selected={selectedItem?.id === sample.id}
                        class:pending={isPending}
                        class:highlighted={highlightInstrument && compatible}
                        class:dimmed={highlightInstrument && !compatible}
                        class:clickable={canSelect}
                        onclick={() =>
                          canSelect
                            ? selectSampleForLoading(sample)
                            : selectItem(sample)}
                        onkeydown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            canSelect
                              ? selectSampleForLoading(sample)
                              : selectItem(sample);
                        }}
                        role="button"
                        tabindex="0"
                      >
                        <div class="card-header">
                          <div class="item-icon">🧪</div>
                          <div class="item-name">{sample.displayName}</div>
                          {#if instrumentsUsing.length > 0}
                            <div class="in-use-badges">
                              {#each instrumentsUsing as inst}
                                <span
                                  class="in-use-badge"
                                  class:test-running={isInstrumentBusy(inst)}
                                >
                                  {#if isInstrumentBusy(inst)}⚙️{:else}🔬{/if}
                                  {inst}
                                </span>
                              {/each}
                            </div>
                          {/if}
                        </div>
                        <div class="card-info">
                          <div class="item-time">
                            Collected: {formatTimestamp(sample.timestamp)}
                          </div>
                          <div class="item-status status-available">
                            Available
                          </div>
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
    flex-wrap: wrap;
  }

  .item-icon {
    font-size: 1.4rem;
  }

  .item-name {
    color: #e0e0e0;
    font-size: 0.85rem;
    font-weight: 600;
    flex: 1;
    min-width: 0;
  }

  .in-use-badges {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .in-use-badge {
    background: #3a4a5a;
    color: #8ab9c5;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .in-use-badge.test-running {
    background: #4a3a1a;
    color: #d4af37;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.9;
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
    }
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

  /* Highlight mode styles */
  .highlight-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem;
    background: rgba(74, 106, 138, 0.2);
    border: 1px solid rgba(74, 106, 138, 0.4);
    border-radius: 4px;
    margin-bottom: 0.5rem;
    color: #8ab4d8;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .banner-icon {
    font-size: 1.2rem;
  }

  .inventory-card.highlighted {
    border-left-color: #4a7c59;
    border-left-width: 4px;
    background: rgba(74, 124, 89, 0.15);
    animation: pulse 2s ease-in-out infinite;
  }

  .inventory-card.highlighted:hover {
    background: rgba(74, 124, 89, 0.25);
    border-color: #5a8c69;
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(74, 124, 89, 0.4);
  }

  .inventory-card.pending {
    border-left-color: #f0a020;
    border-left-width: 4px;
    background: rgba(240, 160, 32, 0.2);
    box-shadow: 0 2px 12px rgba(240, 160, 32, 0.4);
  }

  .inventory-card.pending:hover {
    background: rgba(240, 160, 32, 0.3);
    border-color: #f0b040;
  }

  .inventory-card.dimmed {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .inventory-card.clickable {
    cursor: pointer;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(74, 124, 89, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(74, 124, 89, 0);
    }
  }

  .banner-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .banner-title {
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: capitalize;
  }

  .banner-hint {
    font-size: 0.75rem;
    opacity: 0.8;
  }
</style>
