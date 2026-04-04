<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createColonyRenderer,
    defaultParams,
    type ColonyParams,
    type ColonyRenderer,
    type RendererTextureMaps,
  } from '../webgl-colony-renderer';
  import { getMediumDef, type PlateMedium, type RenderMaps } from './streak-types';

  type PlateViewPreset = 'observation' | 'diagnostic';
  export type ObservationLightMode = 'bench' | 'grazing' | 'transmitted';

  interface Props {
    maps: RenderMaps;
    medium: PlateMedium;
    preset?: PlateViewPreset;
    lighting?: ObservationLightMode;
    ariaLabel?: string;
    canvasClass?: string;
    dataRef?: string;
    onPointerDown?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
    onLostPointerCapture?: (event: PointerEvent) => void;
  }

  let {
    maps,
    medium,
    preset = 'observation',
    lighting = 'bench',
    ariaLabel = 'Culture plate render',
    canvasClass = '',
    dataRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  }: Props = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);
  let renderer: ColonyRenderer | null = null;
  let webglFailed = $state(false);

  const textureMaps = $derived.by(() => packRenderMaps(maps));
  const params = $derived.by(() => createPlateParams(medium, preset, lighting));

  $effect(() => {
    if (!canvas) return;

    const initialMaps = untrack(() => textureMaps);
    const nextRenderer = createColonyRenderer(canvas, { textureMaps: initialMaps });
    if (!nextRenderer) {
      webglFailed = true;
      return;
    }

    renderer = nextRenderer;
    webglFailed = false;
    let rafId = 0;

    const frame = (time: number) => {
      nextRenderer.render(time, untrack(() => params));
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      renderer = null;
      nextRenderer.destroy();
    };
  });

  $effect(() => {
    textureMaps;
    if (!renderer) return;
    renderer.updateMaps(textureMaps);
  });

  function packRenderMaps(source: RenderMaps): RendererTextureMaps {
    const resolution = source.resolution;
    const cellCount = resolution * resolution;
    const heightMap = new Float32Array(cellCount);
    const colorMap = new Uint8ClampedArray(cellCount * 4);
    const surfaceMap = new Uint8Array(cellCount * 4);

    for (let y = 0; y < resolution; y += 1) {
      const sourceRow = y * resolution;
      const targetRow = (resolution - 1 - y) * resolution;

      for (let x = 0; x < resolution; x += 1) {
        const sourceIndex = sourceRow + x;
        const targetIndex = targetRow + x;
        const sourceOffset = sourceIndex * 4;
        const targetOffset = targetIndex * 4;

        heightMap[targetIndex] = source.height[sourceIndex];
        colorMap[targetOffset] = source.albedo[sourceOffset];
        colorMap[targetOffset + 1] = source.albedo[sourceOffset + 1];
        colorMap[targetOffset + 2] = source.albedo[sourceOffset + 2];
        colorMap[targetOffset + 3] = source.albedo[sourceOffset + 3];
        surfaceMap[targetOffset] = packUnit(source.roughness[sourceIndex]);
        surfaceMap[targetOffset + 1] = packUnit(source.wetMask[sourceIndex]);
        surfaceMap[targetOffset + 2] = packUnit(source.hemolysisAlpha[sourceIndex]);
        surfaceMap[targetOffset + 3] = packUnit(source.hemolysisBeta[sourceIndex]);
      }
    }

    return {
      resolution,
      heightMap,
      colorMap,
      surfaceMap,
    };
  }

  function packUnit(value: number): number {
    return Math.min(255, Math.round(Math.min(1, Math.max(0, value)) * 255));
  }

  function createPlateParams(
    mediumId: PlateMedium,
    viewPreset: PlateViewPreset,
    lightingMode: ObservationLightMode,
  ): ColonyParams {
    const mediumDef = getMediumDef(mediumId);
    const [agarR, agarG, agarB] = getRendererAgarColor(mediumDef.id, viewPreset, mediumDef.agarColor, mediumDef.agarShadowColor);
    const base = defaultParams();

    if (viewPreset === 'diagnostic') {
      return {
        ...base,
        lightX: -0.42,
        lightY: 0.4,
        lightZ: 1.08,
        agarR,
        agarG,
        agarB,
        agarRoughness: 0.26,
        agarSpecular: mediumId === 'blood-agar' ? 0.11 : 0.16,
        agarClearcoat: mediumId === 'blood-agar' ? 0.14 : 0.18,
        agarClearcoatRough: mediumId === 'blood-agar' ? 0.06 : 0.05,
        agarTranslucency: mediumId === 'blood-agar' ? 0.62 : 0.8,
        hemoIntensity: mediumDef.supportsHemolysis ? 0.82 : 0.15,
        colonyRoughness: 0.48,
        colonySpecular: 0.15,
        colonyClearcoat: 0.11,
        colonyClearcoatRough: 0.08,
        colonyMicroBump: 0.18,
        colonyOpacity: 0.92,
        edgeGlow: 0.08,
        bumpStrength: 5.4,
        heightScale: 0.64,
        ambient: mediumId === 'blood-agar' ? 0.18 : 0.24,
        underlight: mediumId === 'blood-agar' ? 0.08 : 0.18,
        aoStrength: mediumId === 'blood-agar' ? 0.22 : 0.18,
        vignetteStrength: 0.11,
        exposure: mediumId === 'blood-agar' ? 0.88 : 1.18,
        grainAmount: 0.004,
      };
    }

    const observationParams: ColonyParams = {
      ...base,
      lightX: -0.72,
      lightY: 0.58,
      lightZ: 0.92,
      agarR,
      agarG,
      agarB,
      agarRoughness: 0.24,
      agarSpecular: mediumId === 'blood-agar' ? 0.13 : 0.2,
      agarClearcoat: mediumId === 'blood-agar' ? 0.16 : 0.24,
      agarClearcoatRough: mediumId === 'blood-agar' ? 0.055 : 0.045,
      agarTranslucency: mediumId === 'blood-agar' ? 0.66 : 0.84,
      hemoIntensity: mediumDef.supportsHemolysis ? 0.94 : 0.12,
      colonyRoughness: 0.5,
      colonySpecular: mediumId === 'blood-agar' ? 0.09 : 0.14,
      colonyClearcoat: mediumId === 'blood-agar' ? 0.07 : 0.11,
      colonyClearcoatRough: mediumId === 'blood-agar' ? 0.11 : 0.08,
      colonyMicroBump: 0.22,
      colonyOpacity: 0.94,
      edgeGlow: mediumId === 'blood-agar' ? 0.06 : 0.08,
      bumpStrength: 6.4,
      heightScale: 0.76,
      ambient: mediumId === 'blood-agar' ? 0.16 : 0.2,
      underlight: mediumId === 'blood-agar' ? 0.1 : 0.22,
      aoStrength: mediumId === 'blood-agar' ? 0.24 : 0.2,
      vignetteStrength: 0.08,
      exposure: mediumId === 'blood-agar' ? 0.88 : 1.24,
      grainAmount: 0.006,
    };

    if (lightingMode === 'grazing') {
      return {
        ...observationParams,
        lightX: -1.08,
        lightY: 0.18,
        lightZ: 0.48,
        agarSpecular: mediumId === 'blood-agar' ? 0.08 : 0.14,
        agarClearcoat: mediumId === 'blood-agar' ? 0.11 : 0.18,
        colonySpecular: mediumId === 'blood-agar' ? 0.08 : 0.12,
        colonyClearcoat: mediumId === 'blood-agar' ? 0.05 : 0.08,
        bumpStrength: 8.2,
        ambient: mediumId === 'blood-agar' ? 0.1 : 0.14,
        underlight: mediumId === 'blood-agar' ? 0.05 : 0.12,
        aoStrength: mediumId === 'blood-agar' ? 0.3 : 0.24,
        exposure: mediumId === 'blood-agar' ? 0.82 : 1.12,
      };
    }

    if (lightingMode === 'transmitted') {
      return {
        ...observationParams,
        lightX: -0.18,
        lightY: 0.1,
        lightZ: 1.16,
        agarTranslucency: mediumId === 'blood-agar' ? 0.9 : 0.92,
        agarSpecular: mediumId === 'blood-agar' ? 0.06 : 0.1,
        agarClearcoat: mediumId === 'blood-agar' ? 0.08 : 0.12,
        hemoIntensity: mediumDef.supportsHemolysis ? 1.18 : 0.14,
        colonySpecular: mediumId === 'blood-agar' ? 0.05 : 0.08,
        colonyClearcoat: mediumId === 'blood-agar' ? 0.03 : 0.06,
        edgeGlow: mediumId === 'blood-agar' ? 0.04 : 0.06,
        ambient: mediumId === 'blood-agar' ? 0.24 : 0.22,
        underlight: mediumId === 'blood-agar' ? 0.22 : 0.26,
        aoStrength: mediumId === 'blood-agar' ? 0.18 : 0.16,
        exposure: mediumId === 'blood-agar' ? 0.86 : 1.18,
      };
    }

    return observationParams;
  }

  function getRendererAgarColor(
    mediumId: PlateMedium,
    viewPreset: PlateViewPreset,
    agarColorHex: string,
    shadowColorHex: string,
  ): [number, number, number] {
    const agarColor = hexToRgb01(agarColorHex);
    const shadowColor = hexToRgb01(shadowColorHex);

    if (mediumId !== 'blood-agar') {
      return agarColor;
    }

    return mixRgb01(agarColor, shadowColor, viewPreset === 'observation' ? 0.56 : 0.48);
  }

  function mixRgb01(
    left: [number, number, number],
    right: [number, number, number],
    amount: number,
  ): [number, number, number] {
    const mix = Math.min(1, Math.max(0, amount));
    return [
      left[0] + (right[0] - left[0]) * mix,
      left[1] + (right[1] - left[1]) * mix,
      left[2] + (right[2] - left[2]) * mix,
    ];
  }

  function hexToRgb01(hex: string): [number, number, number] {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized
          .split('')
          .map((channel) => `${channel}${channel}`)
          .join('')
      : normalized;

    return [
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255,
    ];
  }
</script>

<div class="relative">
  <canvas
    bind:this={canvas}
    aria-label={ariaLabel}
    class={canvasClass}
    data-ref={dataRef}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerCancel}
    onlostpointercapture={onLostPointerCapture}
  ></canvas>

  {#if webglFailed}
    <div class="absolute inset-0 flex items-center justify-center rounded-xl border border-[var(--brass-dark)] bg-black/70 px-4 text-center text-sm text-[var(--parchment-aged)]">
      WebGL 2 is required for the realistic plate renderer.
    </div>
  {/if}
</div>
