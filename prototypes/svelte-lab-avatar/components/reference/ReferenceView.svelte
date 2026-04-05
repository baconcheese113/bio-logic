<script lang="ts">
  import { renderAureusCanvas } from './aureus-canvas-renderer';
  import { renderAureusPixi } from './aureus-pixi-renderer';
  import WebGLColonyView from './WebGLColonyView.svelte';

  let canvasEl: HTMLCanvasElement;
  let pixiContainer: HTMLDivElement;

  $effect(() => {
    if (canvasEl) renderAureusCanvas(canvasEl);
  });

  $effect(() => {
    if (!pixiContainer) return;
    const cleanup = renderAureusPixi(pixiContainer);
    return cleanup;
  });
</script>

<div class="reference-page">
  <header class="reference-header">
    <h1>Colony Rendering — Reference Lab</h1>
    <a href="#/" class="back-link" onclick={() => window.location.hash = ''}>Back to Lab</a>
  </header>

  <section class="webgl-section">
    <h2>WebGL2 PBR Colony Renderer</h2>
    <WebGLColonyView />
  </section>

  <!-- <section class="comparison-section">
    <h2>Comparison Renderers</h2>
    <div class="renderers">
      <div class="renderer-panel">
        <h3>Canvas 2D</h3>
        <canvas bind:this={canvasEl} width="600" height="600"></canvas>
      </div>
      <div class="renderer-panel">
        <h3>PixiJS</h3>
        <div bind:this={pixiContainer} class="pixi-container"></div>
      </div>
    </div>
  </section> -->
</div>

<style>
  .reference-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background: var(--bg-darkest, #0f0e0d);
    color: var(--text-parchment, #f5f0e6);
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .reference-header {
    display: flex;
    align-items: center;
    gap: 2rem;
    width: 100%;
    max-width: 1280px;
  }

  .reference-header h1 {
    font-family: 'Cinzel', serif;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .back-link {
    font-size: 0.875rem;
    color: var(--accent-brass, #b8956e);
    text-decoration: underline;
  }

  .webgl-section,
  .comparison-section {
    width: 100%;
    max-width: 1280px;
  }

  .webgl-section h2,
  .comparison-section h2 {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-parchment-aged, #d4c4a8);
    margin-bottom: 1rem;
  }

  .renderers {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .renderer-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .renderer-panel h3 {
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-parchment-aged, #d4c4a8);
  }

  canvas, .pixi-container {
    width: 600px;
    height: 600px;
    border-radius: 4px;
    background: #111;
  }
</style>
