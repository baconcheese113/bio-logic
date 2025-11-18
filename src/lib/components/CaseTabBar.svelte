<script lang="ts">
  import { activeCases, switchToCase } from '../stores/active-cases';
  import { get } from 'svelte/store';
  
  function selectCase(caseId: string) {
    switchToCase(caseId);
  }
  
  function getCaseDisplayTitle(activeCase: typeof $activeCases.cases[0]): string {
    // Show generic title to avoid spoilers
    return activeCase.case.title;
  }
  
  function getStatusIndicator(activeCase: typeof $activeCases.cases[0]): string {
    switch (activeCase.status) {
      case 'accepted':
        return '';
      case 'awaiting-results':
        return '⏳';
      case 'ready-for-diagnosis':
        return '✓';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '';
    }
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'awaiting-results':
        return '#ffa500';
      case 'ready-for-diagnosis':
        return '#4a7c59';
      case 'completed':
        return '#6a9fb5';
      case 'failed':
        return '#c98f8f';
      default:
        return '#a0a0a0';
    }
  }
</script>

{#if $activeCases.cases.length > 0}
  <div class="case-tab-bar">
    <div class="tabs-container">
      {#each $activeCases.cases as activeCase, index (activeCase.case.id)}
        {@const isActive = $activeCases.currentCaseId === activeCase.case.id}
        {@const statusIcon = getStatusIndicator(activeCase)}
        <button
          class="case-tab"
          class:active={isActive}
          onclick={() => selectCase(activeCase.case.id)}
          style:border-bottom-color={isActive ? 'transparent' : '#4a4a4a'}
        >
          <span class="case-number">Case #{index + 1}</span>
          {#if statusIcon}
            <span class="status-icon" style:color={getStatusColor(activeCase.status)}>
              {statusIcon}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .case-tab-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: linear-gradient(180deg, #2a2a2a 0%, #222222 100%);
    border-bottom: 3px solid #4a4a4a;
    z-index: 900;
    display: flex;
    align-items: flex-end;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  .tabs-container {
    display: flex;
    gap: 4px;
    padding: 0 1rem;
    height: 100%;
    align-items: flex-end;
  }
  
  .case-tab {
    background: #3a3a3a;
    color: #a0a0a0;
    border: 2px solid #555;
    border-bottom: none;
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-radius: 8px 8px 0 0;
    position: relative;
    margin-bottom: -3px;
    font-weight: 500;
  }
  
  .case-tab:hover {
    background: #4a4a4a;
    color: #e0e0e0;
    border-color: #6a6a6a;
  }
  
  .case-tab.active {
    background: #1a1a1a;
    color: #fff;
    border-color: #4a4a4a #4a4a4a transparent #4a4a4a;
    z-index: 1;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .case-number {
    font-weight: 600;
  }
  
  .status-icon {
    font-size: 1.1rem;
  }
</style>
