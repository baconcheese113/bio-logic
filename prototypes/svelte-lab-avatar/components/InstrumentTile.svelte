<script lang="ts">
  import type { Instrument, Sample, GridPosition } from '../../shared/types';
  import { INSTRUMENT_ICONS, STATUS_COLORS, SAMPLE_COLORS, CONDITION_OPACITY } from '../../shared/types';

  interface Props {
    instrument: Instrument;
    samples: Sample[];
    tileSize: number;
    isSelected: boolean;
    playerPosition: GridPosition;
    playerHasSample: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    onSamplePickup: (sampleId: string) => void;
    onSampleDrop: () => void;
  }

  let { instrument, samples, tileSize, isSelected, playerPosition, playerHasSample, onClick, onDoubleClick, onSamplePickup, onSampleDrop }: Props = $props();

  const icon = $derived(INSTRUMENT_ICONS[instrument.type]);
  const statusColor = $derived(STATUS_COLORS[instrument.status]);
  const isAdjacent = $derived(() => {
    const dx = Math.abs(playerPosition.x - instrument.position.x);
    const dy = Math.abs(playerPosition.y - instrument.position.y);
    return dx <= 1 && dy <= 1 && (dx + dy > 0 || dx === dy);
  });
  const hasEmptySlot = $derived(instrument.slots.some(s => s.sampleId === null));
  const canDrop = $derived(playerHasSample && isAdjacent() && hasEmptySlot);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    canDrop ? onSampleDrop() : onClick();
  }
</script>

<button
  class="tile"
  class:selected={isSelected}
  class:busy={instrument.status === 'busy'}
  class:ready={instrument.status === 'ready'}
  class:adjacent={isAdjacent()}
  class:can-drop={canDrop}
  style:left="{instrument.position.x * tileSize}px"
  style:top="{instrument.position.y * tileSize}px"
  style:width="{tileSize}px"
  style:height="{tileSize}px"
  onclick={handleClick}
  ondblclick={(e) => { e.stopPropagation(); onDoubleClick(); }}
  data-ref="instrument-{instrument.id}"
>
  <span class="icon">{icon}</span>
  <span class="status" style:background={statusColor}></span>
  
  {#if instrument.status === 'busy' && instrument.progress > 0}
    <div class="progress"><div class="fill" style:width="{instrument.progress}%"></div></div>
  {/if}

  <div class="samples">
    {#each samples as sample}
      <span
        class="dot"
        class:pickable={isAdjacent() && !playerHasSample}
        style:background={SAMPLE_COLORS[sample.type]}
        style:opacity={CONDITION_OPACITY[sample.condition]}
        title="{sample.label} ({sample.condition})"
        onclick={(e) => { e.stopPropagation(); isAdjacent() && onSamplePickup(sample.id); }}
        data-ref="sample-{sample.id}"
      ></span>
    {/each}
    {#if canDrop}<span class="drop-slot">+</span>{/if}
  </div>
</button>

<style>
  .tile {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, var(--bg-light) 0%, var(--bg-medium) 100%);
    border: 2px solid var(--brass-dark);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    font-family: inherit;
  }
  .tile:hover { border-color: var(--brass); transform: scale(1.05); z-index: 10; }
  .tile.selected { border-color: var(--brass-light); box-shadow: 0 0 12px rgba(184, 149, 110, 0.5); z-index: 11; }
  .tile.adjacent { border-color: var(--status-ready); }
  .tile.can-drop { border-color: var(--status-idle); animation: pulse-drop 0.5s ease-in-out infinite alternate; }
  .tile.busy { animation: pulse 2s infinite; }
  .tile.ready { border-color: var(--status-ready); box-shadow: 0 0 8px rgba(91, 143, 168, 0.5); }

  @keyframes pulse-drop { 0% { box-shadow: 0 0 4px rgba(74, 124, 89, 0.5); } 100% { box-shadow: 0 0 12px rgba(74, 124, 89, 0.8); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

  .icon { font-size: 1.75rem; }
  .status { position: absolute; top: 4px; right: 4px; width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.3); }
  .progress { position: absolute; bottom: 4px; left: 4px; right: 4px; height: 4px; background: var(--bg-darkest); border-radius: 2px; overflow: hidden; }
  .fill { height: 100%; background: var(--status-busy); transition: width 0.3s; }

  .samples { position: absolute; bottom: 10px; display: flex; gap: 3px; align-items: center; }
  .dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); cursor: default; transition: transform 0.15s; }
  .dot.pickable { cursor: grab; border-width: 2px; animation: pickable 0.8s ease-in-out infinite alternate; }
  .dot.pickable:hover { transform: scale(1.3); }
  @keyframes pickable { 0% { border-color: rgba(255,255,255,0.3); } 100% { border-color: rgba(255,255,255,0.8); } }

  .drop-slot { width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 2px dashed var(--status-idle); border-radius: 50%; color: var(--status-idle); font-size: 0.7rem; font-weight: bold; }
</style>
