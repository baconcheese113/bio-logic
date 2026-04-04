<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createColonyRenderer,
    extractHeightMapFromImage,
    type ColonyParams,
    type RendererOpts,
  } from './webgl-colony-renderer';

  const REF_IMAGE_URL =
    '/prototypes/svelte-lab-avatar/components/reference/s-aureus-real.png';

  interface Props {
    compact?: boolean;
    showControls?: boolean;
    canvasSize?: number;
  }

  let {
    compact = false,
    showControls = true,
    canvasSize = 600,
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let webglFailed = $state(false);

  function getRendererOpts(): RendererOpts & { useReferenceImage?: boolean } {
    const params = new URLSearchParams(window.location.search);
    const seedStr = params.get('seed');
    const paths = params.get('paths') || 'image';
    return {
      seed: seedStr ? Number(seedStr) : undefined,
      useReferencePaths: paths === 'reference',
      useReferenceImage: paths === 'image',
    };
  }

  // ── Light ──
  let lightX = $state(-0.1);
  let lightY = $state(0.15);
  let lightZ = $state(1.0);

  // ── Agar material ──
  let agarR = $state(0.92);
  let agarG = $state(0.005);
  let agarB = $state(0.003);
  let agarRoughness = $state(0.3);
  let agarSpecular = $state(0.06);
  let agarClearcoat = $state(0.15);
  let agarClearcoatRough = $state(0.02);
  let agarTranslucency = $state(0.9);
  let hemoIntensity = $state(0.06);

  // ── Colony material ──
  let colonyR = $state(0.75);
  let colonyG = $state(0.15);
  let colonyB = $state(0.04);
  let colonyRoughness = $state(0.55);
  let colonySpecular = $state(0.08);
  let colonyClearcoat = $state(0.1);
  let colonyClearcoatRough = $state(0.04);
  let colonyMicroBump = $state(0.06);
  let colonyOpacity = $state(0.85);
  let edgeGlow = $state(0.15);

  // ── Geometry ──
  let bumpStrength = $state(3.0);
  let heightScale = $state(0.24);

  // ── Post-processing ──
  let ambient = $state(0.3);
  let underlight = $state(0.15);
  let aoStrength = $state(0.15);
  let vignetteStrength = $state(0.15);
  let exposure = $state(1.3);
  let grainAmount = $state(0.015);

  const agarPreview = $derived(
    `rgb(${Math.round(agarR * 255)}, ${Math.round(agarG * 255)}, ${Math.round(agarB * 255)})`,
  );
  const colonyPreview = $derived(
    `rgb(${Math.round(colonyR * 255)}, ${Math.round(colonyG * 255)}, ${Math.round(colonyB * 255)})`,
  );

  $effect(() => {
    if (!canvas) return;
    let cancelled = false;
    let rafId: number;
    let destroyRenderer: (() => void) | undefined;

    function startLoop(render: (t: number, p: ColonyParams) => void) {
      function loop(t: number) {
        render(
          t,
          untrack(() => ({
            lightX, lightY, lightZ,
            agarR, agarG, agarB,
            agarRoughness, agarSpecular,
            agarClearcoat, agarClearcoatRough, agarTranslucency,
            hemoIntensity,
            colonyR, colonyG, colonyB,
            colonyRoughness, colonySpecular,
            colonyClearcoat, colonyClearcoatRough, colonyMicroBump,
            colonyOpacity, edgeGlow,
            bumpStrength, heightScale,
            ambient, underlight, aoStrength, vignetteStrength, exposure, grainAmount,
          })),
        );
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);
    }

    const opts = getRendererOpts();

    if (opts.useReferenceImage) {
      extractHeightMapFromImage(REF_IMAGE_URL).then((heightMap) => {
        if (cancelled) return;
        const r = createColonyRenderer(canvas, { ...opts, heightMap });
        if (!r) { webglFailed = true; return; }
        destroyRenderer = r.destroy;
        startLoop(r.render);
      });
    } else {
      const r = createColonyRenderer(canvas, opts);
      if (!r) { webglFailed = true; return; }
      destroyRenderer = r.destroy;
      startLoop(r.render);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      destroyRenderer?.();
    };
  });
</script>

<div class:compact class="layout" style={`--plate-size:${canvasSize}px;`}>
  <div class="canvas-wrap">
    {#if webglFailed}
      <div class="error">WebGL 2 is required for this renderer.</div>
    {/if}
    <canvas bind:this={canvas} class="plate-canvas"></canvas>
  </div>

  {#if showControls}
    <div class="panel">
      <section>
        <h3>Light Direction</h3>
        <label><span class="lbl">X</span><input type="range" min="-2" max="2" step="0.01" bind:value={lightX} /><span class="val">{lightX.toFixed(2)}</span></label>
        <label><span class="lbl">Y</span><input type="range" min="-2" max="2" step="0.01" bind:value={lightY} /><span class="val">{lightY.toFixed(2)}</span></label>
        <label><span class="lbl">Z</span><input type="range" min="0.1" max="5" step="0.01" bind:value={lightZ} /><span class="val">{lightZ.toFixed(2)}</span></label>
      </section>

      <section>
        <h3>Agar Material <span class="swatch" style:background={agarPreview}></span></h3>
        <label><span class="lbl">Color R</span><input type="range" min="0" max="1" step="0.01" bind:value={agarR} /><span class="val">{agarR.toFixed(2)}</span></label>
        <label><span class="lbl">Color G</span><input type="range" min="0" max="1" step="0.01" bind:value={agarG} /><span class="val">{agarG.toFixed(2)}</span></label>
        <label><span class="lbl">Color B</span><input type="range" min="0" max="1" step="0.01" bind:value={agarB} /><span class="val">{agarB.toFixed(2)}</span></label>
        <label><span class="lbl">Roughness</span><input type="range" min="0.01" max="1" step="0.01" bind:value={agarRoughness} /><span class="val">{agarRoughness.toFixed(2)}</span></label>
        <label><span class="lbl">Specular</span><input type="range" min="0" max="3" step="0.01" bind:value={agarSpecular} /><span class="val">{agarSpecular.toFixed(2)}</span></label>
        <label><span class="lbl">Clearcoat</span><input type="range" min="0" max="1" step="0.01" bind:value={agarClearcoat} /><span class="val">{agarClearcoat.toFixed(2)}</span></label>
        <label><span class="lbl">CC Rough</span><input type="range" min="0.01" max="1" step="0.01" bind:value={agarClearcoatRough} /><span class="val">{agarClearcoatRough.toFixed(2)}</span></label>
        <label><span class="lbl">Translucency</span><input type="range" min="0" max="1" step="0.01" bind:value={agarTranslucency} /><span class="val">{agarTranslucency.toFixed(2)}</span></label>
        <label><span class="lbl">Hemolysis</span><input type="range" min="0" max="2" step="0.01" bind:value={hemoIntensity} /><span class="val">{hemoIntensity.toFixed(2)}</span></label>
      </section>

      <section>
        <h3>Colony Material <span class="swatch" style:background={colonyPreview}></span></h3>
        <label><span class="lbl">Color R</span><input type="range" min="0" max="1" step="0.01" bind:value={colonyR} /><span class="val">{colonyR.toFixed(2)}</span></label>
        <label><span class="lbl">Color G</span><input type="range" min="0" max="1" step="0.01" bind:value={colonyG} /><span class="val">{colonyG.toFixed(2)}</span></label>
        <label><span class="lbl">Color B</span><input type="range" min="0" max="1" step="0.01" bind:value={colonyB} /><span class="val">{colonyB.toFixed(2)}</span></label>
        <label><span class="lbl">Roughness</span><input type="range" min="0.01" max="1" step="0.01" bind:value={colonyRoughness} /><span class="val">{colonyRoughness.toFixed(2)}</span></label>
        <label><span class="lbl">Specular</span><input type="range" min="0" max="3" step="0.01" bind:value={colonySpecular} /><span class="val">{colonySpecular.toFixed(2)}</span></label>
        <label><span class="lbl">Clearcoat</span><input type="range" min="0" max="0.5" step="0.005" bind:value={colonyClearcoat} /><span class="val">{colonyClearcoat.toFixed(3)}</span></label>
        <label><span class="lbl">CC Rough</span><input type="range" min="0.01" max="1" step="0.01" bind:value={colonyClearcoatRough} /><span class="val">{colonyClearcoatRough.toFixed(2)}</span></label>
        <label><span class="lbl">Micro-bump</span><input type="range" min="0" max="1" step="0.005" bind:value={colonyMicroBump} /><span class="val">{colonyMicroBump.toFixed(3)}</span></label>
        <label><span class="lbl">Opacity</span><input type="range" min="0" max="3" step="0.01" bind:value={colonyOpacity} /><span class="val">{colonyOpacity.toFixed(2)}</span></label>
        <label><span class="lbl">Edge Glow</span><input type="range" min="0" max="1" step="0.005" bind:value={edgeGlow} /><span class="val">{edgeGlow.toFixed(3)}</span></label>
      </section>

      <section>
        <h3>Geometry</h3>
        <label><span class="lbl">Bump</span><input type="range" min="0" max="30" step="0.1" bind:value={bumpStrength} /><span class="val">{bumpStrength.toFixed(1)}</span></label>
        <label><span class="lbl">Height Scale</span><input type="range" min="0" max="5" step="0.01" bind:value={heightScale} /><span class="val">{heightScale.toFixed(2)}</span></label>
      </section>

      <section>
        <h3>Post-processing</h3>
        <label><span class="lbl">Ambient</span><input type="range" min="0" max="1" step="0.01" bind:value={ambient} /><span class="val">{ambient.toFixed(2)}</span></label>
        <label><span class="lbl">Underlight</span><input type="range" min="0" max="1" step="0.01" bind:value={underlight} /><span class="val">{underlight.toFixed(2)}</span></label>
        <label><span class="lbl">AO</span><input type="range" min="0" max="1" step="0.005" bind:value={aoStrength} /><span class="val">{aoStrength.toFixed(3)}</span></label>
        <label><span class="lbl">Vignette</span><input type="range" min="0" max="1" step="0.005" bind:value={vignetteStrength} /><span class="val">{vignetteStrength.toFixed(3)}</span></label>
        <label><span class="lbl">Exposure</span><input type="range" min="0.2" max="3" step="0.01" bind:value={exposure} /><span class="val">{exposure.toFixed(2)}</span></label>
        <label><span class="lbl">Grain</span><input type="range" min="0" max="0.1" step="0.001" bind:value={grainAmount} /><span class="val">{grainAmount.toFixed(3)}</span></label>
      </section>
    </div>
  {/if}
</div>

<style>
  .layout {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  .canvas-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .plate-canvas {
    width: var(--plate-size, 600px);
    height: var(--plate-size, 600px);
    border-radius: 50%;
    cursor: crosshair;
    background: #111;
  }

  .compact {
    display: block;
  }

  .compact .canvas-wrap {
    width: min(100%, var(--plate-size, 600px));
    margin: 0 auto;
  }

  .error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f66;
    font-size: 1.1rem;
    pointer-events: none;
  }

  .panel {
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem 1.25rem;
    border-radius: 8px;
    min-width: 280px;
    max-height: 600px;
    overflow-y: auto;
  }

  section {
    margin-bottom: 1rem;
  }

  section:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #999;
    margin-bottom: 0.4rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.3rem 0;
    font-size: 0.8rem;
    color: #ccc;
  }

  .lbl {
    min-width: 72px;
    color: #888;
    font-size: 0.75rem;
  }

  input[type='range'] {
    flex: 1;
    accent-color: var(--accent-brass, #b8956e);
    height: 4px;
  }

  .val {
    min-width: 40px;
    text-align: right;
    font-family: monospace;
    font-size: 0.7rem;
    color: #666;
  }
</style>
