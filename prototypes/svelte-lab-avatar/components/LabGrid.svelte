<script lang="ts">
  import type { LabState, GridPosition, Sample, Patient } from '../../shared/types';
  import { TILE_SIZE } from '../../shared/mock-data';
  import InstrumentTile from './InstrumentTile.svelte';
  import PlayerAvatar from './PlayerAvatar.svelte';
  import PatientTile from './PatientTile.svelte';

  interface Props {
    labState: LabState;
    selectedFurnitureId: string | null;
    onFurnitureClick: (furnitureId: string) => void;
    onFurnitureDoubleClick: (furnitureId: string) => void;
    onCameraChange: (camera: LabState['camera']) => void;
    onTileClick: (position: GridPosition) => void;
    onItemDrop: (furnitureId: string) => void;
    onPatientClick: (patientId: string) => void;
  }

  let {
    labState,
    selectedFurnitureId,
    onFurnitureClick,
    onFurnitureDoubleClick,
    onCameraChange,
    onTileClick,
    onItemDrop,
    onPatientClick,
  }: Props = $props();

  let isDragging = $state(false);
  let dragStart = $state({ x: 0, y: 0 });

  const gridWidth = $derived(labState.width * TILE_SIZE);
  const gridHeight = $derived(labState.height * TILE_SIZE);

  const transformStyle = $derived(
    `translate(${labState.camera.x}px, ${labState.camera.y}px) scale(${labState.camera.zoom})`
  );

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(
      labState.camera.minZoom,
      Math.min(labState.camera.maxZoom, labState.camera.zoom + delta)
    );
    onCameraChange({ ...labState.camera, zoom: newZoom });
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 2) { // Right click for panning
      e.preventDefault();
      isDragging = true;
      dragStart = { x: e.clientX - labState.camera.x, y: e.clientY - labState.camera.y };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    onCameraChange({
      ...labState.camera,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleGridClick(e: MouseEvent) {
    if (isDragging) return;

    // Calculate tile position from click
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * labState.camera.zoom));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * labState.camera.zoom));

    if (x >= 0 && x < labState.width && y >= 0 && y < labState.height) {
      onTileClick({ x, y });
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const panSpeed = 20;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        onCameraChange({ ...labState.camera, y: labState.camera.y + panSpeed });
        break;
      case 'ArrowDown':
      case 's':
        onCameraChange({ ...labState.camera, y: labState.camera.y - panSpeed });
        break;
      case 'ArrowLeft':
      case 'a':
        onCameraChange({ ...labState.camera, x: labState.camera.x + panSpeed });
        break;
      case 'ArrowRight':
      case 'd':
        onCameraChange({ ...labState.camera, x: labState.camera.x - panSpeed });
        break;
    }
  }

  function getTileClass(tile: LabState['grid'][0][0]): string {
    return `tile tile-${tile.type}`;
  }

  function getSamplesForFurniture(furnitureId: string): Sample[] {
    return labState.samples.filter(s =>
      s.location.type === 'furniture' && s.location.furnitureId === furnitureId
    );
  }

  function isAdjacent(pos1: GridPosition, pos2: GridPosition): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  function getPatientAtPosition(x: number, y: number): Patient | undefined {
    return labState.patients.find(p => p.benchPosition.x === x && p.benchPosition.y === y);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="lab-grid-container"
  onwheel={handleWheel}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseUp}
  oncontextmenu={(e) => e.preventDefault()}
  data-ref="lab-grid-container"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="lab-grid"
    style:transform={transformStyle}
    style:width="{gridWidth}px"
    style:height="{gridHeight}px"
    onclick={handleGridClick}
    data-ref="lab-grid"
  >
    <!-- Base tiles -->
    {#each labState.grid as row, y}
      {#each row as tile, x}
        {@const patient = tile.type === 'waiting-bench' ? getPatientAtPosition(x, y) : undefined}
        {@const playerAdjacent = isAdjacent(labState.player.position, { x, y })}
        <div
          class={getTileClass(tile)}
          class:walkable={tile.walkable}
          style:left="{x * TILE_SIZE}px"
          style:top="{y * TILE_SIZE}px"
          style:width="{TILE_SIZE}px"
          style:height="{TILE_SIZE}px"
          data-ref="tile-{x}-{y}"
        >
          {#if tile.type === 'gas-lamp'}
            <span class="tile-icon">🔥</span>
          {:else if tile.type === 'window'}
            <span class="tile-icon">🪟</span>
          {:else if tile.type === 'drain'}
            <span class="tile-icon">⚙</span>
          {:else if tile.type === 'door'}
            <span class="tile-icon">🚪</span>
          {:else if tile.type === 'waiting-bench' && patient}
            <PatientTile
              {patient}
              isAdjacent={playerAdjacent}
              onclick={() => onPatientClick(patient.id)}
            />
          {:else if tile.type === 'waiting-bench'}
            <span class="tile-icon bench-empty">🪑</span>
          {/if}
        </div>
      {/each}
    {/each}

    <!-- Furniture -->
    {#each labState.furniture as furn}
      <InstrumentTile
        furniture={furn}
        tileSize={TILE_SIZE}
        isSelected={selectedFurnitureId === furn.id}
        playerPosition={labState.player.position}
        playerHasItem={labState.player.carrying.length > 0}
        onClick={() => onFurnitureClick(furn.id)}
        onDoubleClick={() => onFurnitureDoubleClick(furn.id)}
        onItemDrop={() => onItemDrop(furn.id)}
      />
    {/each}

    <!-- Player Avatar -->
    <PlayerAvatar
      player={labState.player}
      tileSize={TILE_SIZE}
    />
  </div>

  <!-- Zoom indicator -->
  <div class="zoom-indicator" data-ref="zoom-indicator">
    {Math.round(labState.camera.zoom * 100)}%
  </div>

  <!-- Instructions -->
  <div class="instructions">
    <p>Left-click tile to move • Right-drag to pan • Scroll to zoom</p>
    <p>Click sample to pick up • Click instrument slot to drop</p>
  </div>
</div>

<style>
  .lab-grid-container { width: 100%; height: 100%; overflow: hidden; background: var(--bg-darkest); cursor: crosshair; position: relative; }
  .lab-grid { position: absolute; left: 50%; top: 50%; transform-origin: center center; }

  .tile { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; transition: background 0.15s; }
  .tile.walkable:hover { background: rgba(184, 149, 110, 0.2); cursor: pointer; }
  .tile-floor { background: #2a2520; border: 1px solid #3a352e; }
  .tile-wall { background: linear-gradient(135deg, #4a4540 0%, #3a352e 100%); border: 1px solid #5a5550; }
  .tile-door { background: #5a4a3a; border: 2px solid var(--brass); }
  .tile-gas-lamp, .tile-window, .tile-drain { background: linear-gradient(135deg, #4a4540 0%, #3a352e 100%); border: 1px solid #5a5550; }
  .tile-window { background: linear-gradient(135deg, #4a5a6a 0%, #3a4a5a 100%); border-color: #5a6a7a; }
  .tile-drain { background: #2a2520; border: 1px solid #3a352e; }
  .tile-waiting-bench { background: #2a2520; border: 1px solid #3a352e; }
  .tile-icon { font-size: 1.5rem; opacity: 0.7; }
  .bench-empty { opacity: 0.3; }

  .zoom-indicator { position: absolute; bottom: var(--space-md); right: var(--space-md); padding: var(--space-xs) var(--space-sm); background: var(--bg-dark); border: var(--border-thin); border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--parchment-aged); }
  .instructions { position: absolute; bottom: var(--space-md); left: 50%; transform: translateX(-50%); text-align: center; font-size: 0.9rem; color: var(--parchment-aged); opacity: 0.6; }
  .instructions p { margin: 2px 0; }
</style>
