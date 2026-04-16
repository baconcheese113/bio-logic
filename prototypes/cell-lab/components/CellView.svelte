<script lang="ts">
  import { Game, AUTO } from 'phaser';
  import { CellScene } from '../phaser/cell-scene';
  import type { SimulationResult } from '../lib/types';

  interface Props {
    result: SimulationResult | null;
    running: boolean;
  }

  let { result, running }: Props = $props();

  let container: HTMLDivElement;
  let scene = $state<CellScene | undefined>();

  // Create / destroy Phaser game with the DOM element
  $effect(() => {
    if (!container) return;

    const game = new Game({
      type: AUTO,
      parent: container,
      width: 400,
      height: 340,
      transparent: true,
      scene: CellScene,
      banner: false,
    });

    game.events.once('ready', () => {
      scene = game.scene.getScene('CellScene') as CellScene;
    });

    return () => {
      scene = undefined;
      game.destroy(true);
    };
  });

  // Push results into the Phaser scene
  $effect(() => {
    if (!scene) return;
    if (running && result) {
      scene.showResult(result.glowColor, result.glowIntensity, result.proteins);
    } else {
      scene.clearResult();
    }
  });
</script>

<div bind:this={container} class="cell-view"></div>

<style>
  .cell-view {
    width: 400px;
    height: 340px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--brass-dark);
  }

  .cell-view :global(canvas) {
    display: block;
  }
</style>
