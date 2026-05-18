<script lang="ts">
  import { AUTO, Game, Scale } from 'phaser';
  import { TissueScene } from '../phaser/tissue-scene';

  let container: HTMLDivElement;

  $effect(() => {
    if (!container) return;

    const game = new Game({
      type: AUTO,
      parent: container,
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#6f2e35',
      scene: TissueScene,
      banner: false,
      scale: {
        mode: Scale.RESIZE,
        parent: container,
      },
    });

    return () => game.destroy(true);
  });
</script>

<div class="battlefield" bind:this={container} aria-label="Live tissue battlefield"></div>

<style>
  .battlefield {
    width: 100%;
    height: 100%;
    min-height: 360px;
    overflow: hidden;
    background: #7d3338;
  }

  .battlefield :global(canvas) {
    display: block;
  }
</style>
