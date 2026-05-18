<script lang="ts">
  import { DEFENSE_TOOLS, type DefenseToolId, type GeneId } from '../lib/strain-data';

  interface Props {
    selectedTool: DefenseToolId | null;
    propagatedGenes: GeneId[];
    toolCooldowns: Record<DefenseToolId, number>;
    onSelect: (toolId: DefenseToolId) => void;
  }

  let { selectedTool, propagatedGenes, toolCooldowns, onSelect }: Props = $props();
  const tools = $derived(Object.values(DEFENSE_TOOLS));
</script>

<section class="tool-panel" aria-label="Battlefield defense tools">
  <div class="tool-title">Battlefield tools</div>
  <div class="tool-list">
    {#each tools as tool (tool.id)}
      {@const unlocked = propagatedGenes.includes(tool.gene)}
      {@const cooldown = Math.ceil(toolCooldowns[tool.id])}
      <button
        class:selected={selectedTool === tool.id}
        class="tool"
        disabled={!unlocked || cooldown > 0}
        style={`--tool:${tool.color}`}
        type="button"
        onclick={() => onSelect(tool.id)}
      >
        <span class="key">{tool.hotkey}</span>
        <span>
          <strong>{tool.label}</strong>
          <em>{unlocked ? cooldown > 0 ? `${cooldown}s cooldown` : `place ${tool.durationSeconds}s` : 'gene not active'}</em>
        </span>
      </button>
    {/each}
  </div>
</section>

<style>
  .tool-panel {
    display: grid;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid #2a261c;
    border-radius: 8px;
    background: #fffbf0;
    color: #1f1d18;
  }

  .tool-title {
    font-family: var(--font-heading);
    font-size: 13px;
    color: #6f6553;
    text-transform: uppercase;
  }

  .tool-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .tool {
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: 1px solid color-mix(in srgb, var(--tool) 55%, #2a261c);
    border-radius: 7px;
    background: color-mix(in srgb, var(--tool) 14%, #fff8e8);
    color: #1f1d18;
    text-align: left;
    font-size: 13px;
  }

  .tool.selected {
    outline: 3px solid color-mix(in srgb, var(--tool) 70%, white);
    background: color-mix(in srgb, var(--tool) 26%, #fff8e8);
  }

  .tool:disabled {
    opacity: 0.48;
  }

  .key {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #1f1d18;
    color: #fff8e8;
    font-family: var(--font-mono);
    flex: 0 0 auto;
  }

  .tool span:last-child {
    display: grid;
    gap: 1px;
    min-width: 0;
  }

  .tool strong,
  .tool em {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tool em {
    color: #6f6553;
    font-style: normal;
    font-size: 12px;
  }

  @media (max-width: 940px) {
    .tool-list {
      grid-template-columns: 1fr;
    }
  }
</style>
