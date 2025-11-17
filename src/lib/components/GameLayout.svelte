<script lang="ts">
  import CaseTabBar from './CaseTabBar.svelte';
  import { activeCases } from '../stores/active-cases';
  
  interface Props {
    children: any;
  }
  
  let { children }: Props = $props();
  
  // Determine if we should show the tab bar
  const showTabs = $derived($activeCases.cases.length > 0);
</script>

<div class="game-layout">
  {#if showTabs}
    <CaseTabBar />
  {/if}
  
  <div class="content-area" class:with-tabs={showTabs}>
    {@render children()}
  </div>
</div>

<style>
  .game-layout {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .content-area {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .content-area.with-tabs {
    padding-top: 48px;
    height: calc(100% - 48px);
  }
</style>
