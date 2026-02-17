<!--
  PrepStation.svelte — Media preparation workbench.
  
  Shows supplies on the bench, available recipes, and handles
  the preparation process: combine ingredients → sterilize → pour → culture plate.
-->
<script lang="ts">
  import type { Fixture, ActivePrep, MediaType } from '../../../shared/types';
  import { MEDIA_RECIPES, getAvailableRecipes, getItemIcon, getItemLabel, ITEM_DEFS, getCulturePlate } from '../../../shared/types';

  interface Props {
    furniture: Fixture;
    currentTick: number;
    activePrep: ActivePrep | null;
    onPrepStart: (mediaType: MediaType) => void;
  }

  let { furniture, currentTick, activePrep, onPrepStart }: Props = $props();

  // Supplies currently on the bench (consumable items)
  const supplies = $derived(
    furniture.items.filter(i => ITEM_DEFS[i.type].consumable)
  );

  const plates = $derived(
    furniture.items.filter(i => getCulturePlate(i) !== null)
  );

  const availableRecipes = $derived(getAvailableRecipes(furniture.items));

  // Derive prep progress from App-level activePrep
  const prepRecipe = $derived(
    activePrep ? MEDIA_RECIPES[activePrep.mediaType] : null
  );

  const prepElapsed = $derived(
    activePrep ? currentTick - activePrep.startTick : 0
  );

  const prepProgress = $derived(
    activePrep ? Math.min(1, prepElapsed / activePrep.duration) : 0
  );

  // Phase labels for the progress bar
  const phaseLabel = $derived.by(() => {
    if (!activePrep) return '';
    if (prepProgress < 0.3) return 'Mixing ingredients…';
    if (prepProgress < 0.6) return 'Sterilizing…';
    if (prepProgress < 0.9) return 'Pouring media…';
    return 'Cooling…';
  });
</script>

<div class="flex flex-col gap-md p-md w-full max-w-[600px]">
  <h3 class="m-0 pb-sm font-heading border-b-thin text-brass-light">Media Preparation</h3>

  {#if activePrep && prepRecipe}
    <!-- Preparation in progress -->
    <div class="prep-progress-section">
      <div class="prep-recipe-name">{prepRecipe.label}</div>
      <div class="prep-phase">{phaseLabel}</div>
      <div class="progress-track" style:max-width="300px">
        <div class="progress-fill" style:width="{prepProgress * 100}%" style:background="linear-gradient(90deg, var(--brass-dark), var(--brass-light))"></div>
      </div>
      <div class="prep-time">
        {Math.round(prepElapsed / 10)}s / {Math.round(activePrep.duration / 10)}s
      </div>
    </div>
  {:else}
    <!-- Supplies on bench -->
    <section class="flex flex-col gap-sm">
      <h4 class="m-0 font-heading text-xs uppercase tracking-wider text-brass">Supplies on Bench</h4>
      {#if supplies.length > 0}
        <div class="flex flex-col gap-xs">
          {#each supplies as item}
            <div class="flex items-center gap-sm py-xs px-sm rounded text-sm bg-bg-medium">
              <span>{getItemIcon(item)}</span>
              <span>{getItemLabel(item)}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm italic text-parchment-aged">No supplies. Bring ingredients from the cabinet.</p>
      {/if}
    </section>

    <!-- Finished plates on bench -->
    {#if plates.length > 0}
      <section class="flex flex-col gap-sm">
        <h4 class="m-0 font-heading text-xs uppercase tracking-wider text-brass">Prepared Plates</h4>
        <div class="flex flex-col gap-xs">
          {#each plates as item}
            <div class="flex items-center gap-sm py-xs px-sm rounded text-sm border bg-bg-medium border-status-idle">
              <span>🧫</span>
              <span>{getItemLabel(item)}</span>
              <span class="phase-tag ready">Ready</span>
            </div>
          {/each}
        </div>
        <p class="text-sm italic text-parchment-aged">Pick up plates and bring them to the culture bench.</p>
      </section>
    {/if}

    <!-- Available recipes -->
    <section class="flex flex-col gap-sm">
      <h4 class="m-0 font-heading text-xs uppercase tracking-wider text-brass">Available Recipes</h4>
      {#if availableRecipes.length > 0}
        <div class="flex flex-col gap-sm">
          {#each availableRecipes as mediaType}
            {@const recipe = MEDIA_RECIPES[mediaType]}
            <button class="recipe-btn" onclick={() => onPrepStart(mediaType)}>
              <span class="text-2xl">🧫</span>
              <div class="flex-1 flex flex-col items-start">
                <span class="font-heading text-sm text-brass-light">{recipe.label}</span>
                <span class="text-xs text-parchment-aged">~{Math.round(recipe.prepTicks / 10)}s</span>
              </div>
              <span class="text-sm uppercase tracking-wider text-status-idle">Prepare →</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-sm text-parchment-aged">
          <p class="mb-sm">Bring supplies from the reagent cabinet:</p>
          <ul class="list-none flex flex-col gap-xs">
            {#each Object.entries(MEDIA_RECIPES) as [, recipe]}
              <li class="py-xs px-sm rounded text-xs bg-bg-medium">
                <strong class="text-brass-light">{recipe.label}:</strong>
                {recipe.ingredients.join(' + ')}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .phase-tag {
    margin-left: auto;
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .phase-tag.ready {
    background: #2a4a2a;
    color: #6cba6c;
  }

  .recipe-btn {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border: var(--border-thin);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--parchment);
    font-family: inherit;
  }

  .recipe-btn:hover {
    border-color: var(--brass);
    box-shadow: var(--shadow-sm);
  }

  /* Progress display */
  .prep-progress-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-xl);
    background: var(--bg-medium);
    border-radius: 8px;
    border: var(--border-thin);
  }

  .prep-recipe-name {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    color: var(--brass-light);
  }

  .prep-phase {
    font-size: 0.9rem;
    color: var(--parchment-aged);
    font-style: italic;
  }

  .prep-time {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--parchment-aged);
  }
</style>
