<script lang="ts">
  import { currentActiveCase, activeCases, switchToCase } from '../../stores/active-cases';
  import { CASES } from '../../../data/organisms';
  
  let showCaseSwitcher = $state(false);
  
  function toggleCaseSwitcher() {
    showCaseSwitcher = !showCaseSwitcher;
  }
  
  function handleSwitchCase(caseId: string) {
    switchToCase(caseId);
    showCaseSwitcher = false;
  }
  
  const currentCase = $derived(() => {
    if (!$currentActiveCase) return null;
    return CASES[$currentActiveCase.caseIndex];
  });
</script>

{#if $currentActiveCase}
  <div class="persistent-top-bar">
    <div class="case-info">
      <span class="case-label">Active Case:</span>
      <span class="case-id">#{$currentActiveCase.caseIndex + 1}</span>
      <span class="case-separator">–</span>
      <span class="case-title">{currentCase()?.title || 'Unknown'}</span>
    </div>
    
    {#if $activeCases.activeCases.length > 1}
      <div class="case-switcher-container">
        <button class="switch-cases-btn" onclick={toggleCaseSwitcher}>
          Switch Case ({$activeCases.activeCases.length})
        </button>
        
        {#if showCaseSwitcher}
          <div class="case-dropdown">
            {#each $activeCases.activeCases as activeCase}
              {@const caseData = CASES[activeCase.caseIndex]}
              <button 
                class="case-option"
                class:active={activeCase.caseId === $currentActiveCase?.caseId}
                onclick={() => handleSwitchCase(activeCase.caseId)}
              >
                <div class="case-badge">
                  <span class="badge-number">#{activeCase.caseIndex + 1}</span>
                </div>
                <div class="case-details">
                  <div class="case-option-title">{caseData.title}</div>
                  {#if activeCase.isComplete}
                    <div class="case-status complete">✓ Complete</div>
                  {:else}
                    <div class="case-status in-progress">In Progress</div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .persistent-top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, #1a1a2a, #252535);
    border-bottom: 2px solid #3a3a4a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .case-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
  }
  
  .case-label {
    color: #888;
    font-weight: 500;
  }
  
  .case-id {
    color: #6a9fb5;
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .case-separator {
    color: #555;
  }
  
  .case-title {
    color: #e0e0e0;
    font-weight: 600;
  }
  
  .case-switcher-container {
    position: relative;
  }
  
  .switch-cases-btn {
    background: #3a3a4a;
    color: #e0e0e0;
    border: 1px solid #4a4a5a;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .switch-cases-btn:hover {
    background: #4a4a5a;
    border-color: #6a9fb5;
  }
  
  .case-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 300px;
    background: #2a2a3a;
    border: 2px solid #4a4a5a;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 1001;
  }
  
  .case-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid #3a3a4a;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }
  
  .case-option:last-child {
    border-bottom: none;
  }
  
  .case-option:hover {
    background: #3a3a4a;
  }
  
  .case-option.active {
    background: #2a4a5a;
    border-left: 3px solid #6a9fb5;
  }
  
  .case-badge {
    flex-shrink: 0;
  }
  
  .badge-number {
    display: inline-block;
    background: #4a5a6a;
    color: #e0e0e0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: bold;
  }
  
  .case-option.active .badge-number {
    background: #6a9fb5;
    color: white;
  }
  
  .case-details {
    flex: 1;
  }
  
  .case-option-title {
    color: #e0e0e0;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .case-status {
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .case-status.complete {
    color: #8fc98f;
  }
  
  .case-status.in-progress {
    color: #c9c98f;
  }
</style>
