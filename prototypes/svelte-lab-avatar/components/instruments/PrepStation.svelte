<!--
  PrepStation.svelte — Media preparation workbench.
  
  Shows supplies on the bench, available recipes, and handles
  the preparation process: combine ingredients → sterilize → pour → culture plate.
-->
<script lang="ts">
  import type { Furniture, ActivePrep, MediaType } from '../../../shared/types';
  import { MEDIA_RECIPES, getAvailableRecipes, getItemIcon, getItemLabel } from '../../../shared/types';

  interface Props {
    furniture: Furniture;
    currentTick: number;
    activePrep: ActivePrep | null;
    onPrepStart: (mediaType: MediaType) => void;
  }

  let { furniture, currentTick, activePrep, onPrepStart }: Props = $props();

  // Supplies currently on the bench (exclude equipment)
  const supplies = $derived(
    furniture.contents.filter(i => i.kind === 'supply')
  );

  const plates = $derived(
    furniture.contents.filter(i => i.kind === 'culture-plate')
  );

  const availableRecipes = $derived(getAvailableRecipes(furniture.contents));

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

<div class="prep-station">
  <h3>Media Preparation</h3>

  {#if activePrep && prepRecipe}
    <!-- Preparation in progress -->
    <div class="prep-progress-section">
      <div class="prep-recipe-name">{prepRecipe.label}</div>
      <div class="prep-phase">{phaseLabel}</div>
      <div class="progress-bar">
        <div class="progress-fill" style:width="{prepProgress * 100}%"></div>
      </div>
      <div class="prep-time">
        {Math.round(prepElapsed / 10)}s / {Math.round(activePrep.duration / 10)}s
      </div>
    </div>
  {:else}
    <!-- Supplies on bench -->
    <section class="section">
      <h4>Supplies on Bench</h4>
      {#if supplies.length > 0}
        <div class="item-list">
          {#each supplies as item}
            <div class="item-row">
              <span>{getItemIcon(item)}</span>
              <span>{getItemLabel(item)}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-text">No supplies. Bring ingredients from the cabinet.</p>
      {/if}
    </section>

    <!-- Finished plates on bench -->
    {#if plates.length > 0}
      <section class="section">
        <h4>Prepared Plates</h4>
        <div class="item-list">
          {#each plates as item}
            <div class="item-row plate-row">
              <span>🧫</span>
              <span>{getItemLabel(item)}</span>
              <span class="phase-tag ready">Ready</span>
            </div>
          {/each}
        </div>
        <p class="hint">Pick up plates and bring them to the culture bench.</p>
      </section>
    {/if}

    <!-- Available recipes -->
    <section class="section">
      <h4>Available Recipes</h4>
      {#if availableRecipes.length > 0}
        <div class="recipe-list">
          {#each availableRecipes as mediaType}
            {@const recipe = MEDIA_RECIPES[mediaType]}
            <button class="recipe-btn" onclick={() => onPrepStart(mediaType)}>
              <span class="recipe-icon">🧫</span>
              <div class="recipe-info">
                <span class="recipe-name">{recipe.label}</span>
                <span class="recipe-time">~{Math.round(recipe.prepTicks / 10)}s</span>
              </div>
              <span class="recipe-go">Prepare →</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="recipe-hint">
          <p>Bring supplies from the reagent cabinet:</p>
          <ul class="recipe-requirements">
            {#each Object.entries(MEDIA_RECIPES) as [, recipe]}
              <li>
                <strong>{recipe.label}:</strong>
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
  .prep-station {
    width: 100%;
    max-width: 600px;
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  h3 {
    margin: 0;
    color: var(--brass-light);
    font-family: var(--font-heading);
    border-bottom: var(--border-thin);
    padding-bottom: var(--space-sm);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section h4 {
    margin: 0;
    font-family: var(--font-heading);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--brass);
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-medium);
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .plate-row {
    border: 1px solid var(--status-idle);
  }

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

  .hint {
    font-size: 0.8rem;
    color: var(--parchment-aged);
    font-style: italic;
  }

  /* Recipe list */
  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
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

  .recipe-icon { font-size: 1.5rem; }

  .recipe-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .recipe-name {
    font-family: var(--font-heading);
    font-size: 0.9rem;
    color: var(--brass-light);
  }

  .recipe-time {
    font-size: 0.75rem;
    color: var(--parchment-aged);
  }

  .recipe-go {
    font-size: 0.8rem;
    color: var(--status-idle);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Recipe hint for when no supplies present */
  .recipe-hint {
    font-size: 0.85rem;
    color: var(--parchment-aged);
  }

  .recipe-hint p { margin-bottom: var(--space-sm); }

  .recipe-requirements {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .recipe-requirements li {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-medium);
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .recipe-requirements strong {
    color: var(--brass-light);
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

  .progress-bar {
    width: 100%;
    max-width: 300px;
    height: 8px;
    background: var(--bg-dark);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--brass-dark);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--brass-dark), var(--brass-light));
    border-radius: 4px;
    transition: width 0.3s;
  }

  .prep-time {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--parchment-aged);
  }
</style>
