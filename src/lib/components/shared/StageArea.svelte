<script lang="ts">
  import { currentActiveCase } from '../../stores/active-cases';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    showCaseHeader?: boolean;
  }

  let { children, showCaseHeader = false }: Props = $props();
  
  // Use the active case from the new system
  const activeCase = $derived($currentActiveCase);
</script>

<div class="stage-area">
  {#if showCaseHeader && activeCase}
    <div class="case-header">
      <h2 class="case-title">{activeCase.case.title}</h2>
      <p class="case-story">{activeCase.case.patientInfo}</p>
    </div>
  {/if}
  
  <div class="stage-content">
    {@render children()}
  </div>
</div>

<style>
  .stage-area {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex: 1;
    background: linear-gradient(to bottom, #1a1a1a, #2a2a2a);
  }

  .case-header {
    background: rgba(42, 42, 42, 0.95);
    border-bottom: 2px solid #4a4a4a;
    padding: 1rem 2rem;
    backdrop-filter: blur(4px);
  }

  .case-title {
    margin: 0 0 0.5rem 0;
    color: #e0e0e0;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .case-story {
    margin: 0;
    color: #b0b0b0;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .case-details p {
    margin: 0.25rem 0;
  }

  .stage-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>
